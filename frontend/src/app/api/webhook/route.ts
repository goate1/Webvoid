import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { sendOrderConfirmationEmail } from '@/lib/mailService';
import { sendCriticalAlert } from '@/lib/alertService';

let stripe: Stripe | null = null;
let webhookSecret: string | undefined;

const getStripe = () => {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    stripe = new Stripe(secretKey, {
      apiVersion: '2025-08-27.basil',
    });
  }
  return stripe;
};

const getWebhookSecret = () => {
  if (!webhookSecret) {
    webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }
  }
  return webhookSecret;
};

const verifyOrderInFirebase = async (orderId: string, orderData: any) => {
  const adminDb = getAdminDb();
  const orderRef = adminDb.collection('orders').doc(orderId);
  const orderSnapshot = await orderRef.get();
  if (!orderSnapshot.exists) {
    console.log('CRITICAL: Order not found, creating new order:', orderId);
    try {
      await orderRef.set({
        ...orderData,
        status: 'accepted',
        createdAt: new Date(),
        createdBy: 'webhook-fallback',
        criticalRecovery: true,
      });
      console.log('CRITICAL RECOVERY: Order created successfully:', orderId);
      return true;
    } catch (creationError: any) {
      console.error('CRITICAL: Failed to create missing order:', creationError);
      throw new Error(`Order creation failed: ${creationError.message}`);
    }
  }

  const order = orderSnapshot.data();
  if (!order || order.status !== 'accepted' || order.paymentIntentId !== orderData.paymentIntentId) {
    throw new Error(`Order verification failed: ${orderId}`);
  }
  return true;
};

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;

  try {
    const stripeInstance = getStripe();
    const secret = getWebhookSecret();
    event = stripeInstance.webhooks.constructEvent(body, sig!, secret);
  } catch (err) {
    console.error('CRITICAL: Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // CRITICAL: Verify payment amount matches expected amount
        const expectedAmount = parseFloat(paymentIntent.metadata?.expectedAmount || '0');
        const actualAmount = paymentIntent.amount / 100; // Convert from cents
        const currency = paymentIntent.currency.toUpperCase();
        
        // CRITICAL: Amount validation to prevent $1 -> $100 scenario
        if (Math.abs(actualAmount - expectedAmount) > 0.01) {
          console.error('CRITICAL PAYMENT MISMATCH:', {
            paymentIntentId: paymentIntent.id,
            expected: expectedAmount,
            actual: actualAmount,
            currency,
            difference: Math.abs(actualAmount - expectedAmount),
            metadata: paymentIntent.metadata
          });
          
          // Don't process order, but still log the payment
          await sendCriticalAlert({
            type: 'PAYMENT_AMOUNT_MISMATCH',
            paymentIntentId: paymentIntent.id,
            expected: expectedAmount,
            actual: actualAmount,
            currency,
            metadata: paymentIntent.metadata
          });
          
          return NextResponse.json({ received: true, warning: 'Amount mismatch detected' });
        }
        
        // Extract order data from metadata
        const metadata = paymentIntent.metadata;
        const firestoreOrderId = metadata.orderId;
        
        // CRITICAL: Enhanced order creation with retry logic
        let orderCreated = false;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (!orderCreated && retryCount < maxRetries) {
          try {
            if (firestoreOrderId) {
              const adminDb = getAdminDb();
              const orderData = {
                status: 'accepted',
                paymentIntentId: paymentIntent.id,
                updatedAt: new Date(),
                paidAmount: actualAmount,
                currency: currency,
                paymentVerified: true,
                verifiedAt: new Date(),
                stripeMetadata: metadata
              };

              const orderRef = adminDb.collection('orders').doc(firestoreOrderId);
              const orderSnapshot = await orderRef.get();

              if (orderSnapshot.exists) {
                await orderRef.update(orderData);
                console.log('Order updated to accepted:', firestoreOrderId);
              } else {
                // Fallback: order wasn't pre-created (shouldn't happen with new flow)
                const completeOrderData = {
                  ...orderData,
                  id: firestoreOrderId,
                  items: [],
                  total: actualAmount,
                  customerInfo: {
                    name: metadata.customerName || '',
                    email: metadata.customerEmail || '',
                    address: metadata.customerAddress || '',
                    city: metadata.customerCity || '',
                    zipCode: metadata.customerZipCode || '',
                    phone: metadata.customerPhone || '',
                    country: metadata.customerCountry || '',
                    discordUsername: metadata.customerDiscord || ''
                  },
                  createdAt: new Date(),
                  createdBy: 'stripe-webhook-fallback',
                  webhookPaymentId: paymentIntent.id
                };

                await orderRef.set(completeOrderData);
                console.log('Order created by webhook fallback:', firestoreOrderId);
              }

              orderCreated = true;

              await verifyOrderInFirebase(firestoreOrderId, orderData);
            } else {
              console.error('CRITICAL: Missing order ID in payment metadata', { firestoreOrderId });
              break;
            }
          } catch (error: unknown) {
            retryCount++;
            console.error(`Order creation attempt ${retryCount} failed:`, error);
            
            if (retryCount >= maxRetries) {
              await sendCriticalAlert({
                type: 'ORDER_CREATION_FAILED',
                paymentIntentId: paymentIntent.id,
                orderId: firestoreOrderId,
                error: error instanceof Error ? error.message : 'Unknown error',
                retryCount
              });
            } else {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
          }
        }
        
        // Send confirmation email only if order was created successfully
        if (orderCreated && metadata.customerEmail) {
          try {
             await sendOrderConfirmationEmail({
              email: metadata.customerEmail,
              orderId: firestoreOrderId || paymentIntent.id,
              customerName: metadata.customerName || 'Customer',
              total: actualAmount.toFixed(2),
              currency: currency,
            });
            console.log('Confirmation email sent for order:', firestoreOrderId);
          } catch (emailError) {
            console.error('Error sending confirmation email from webhook:', emailError);
          }
        }
        
        console.log('PAYMENT PROCESSED SUCCESSFULLY:', {
          paymentIntentId: paymentIntent.id,
          orderId: firestoreOrderId,
          amount: actualAmount,
          currency,
          orderCreated
        });
        break;
      }

      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        const failedFirestoreId = failedPaymentIntent.metadata.orderId; // Get Firestore order ID from metadata
        
        if (failedFirestoreId) {
          try {
            const adminDb = getAdminDb();
            await adminDb.collection('orders').doc(failedFirestoreId).update({
              status: 'declined',
              paymentIntentId: failedPaymentIntent.id,
              updatedAt: new Date(),
            });
            console.log('Order marked as failed:', failedFirestoreId);
          } catch (error) {
            console.error('Error updating failed order:', error);
          }
        }
        
        console.log('Payment failed for order:', failedFirestoreId || failedPaymentIntent.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}