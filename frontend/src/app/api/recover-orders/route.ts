import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

let stripe: Stripe | null = null;

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

export async function POST(req: NextRequest) {
  try {
    const stripeInstance = getStripe();

    console.log('Starting order recovery process...');

    // Get all payment intents from last 30 days — status check happens per-item below
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);

    const paymentIntents = await stripeInstance.paymentIntents.list({
      created: {
        gte: thirtyDaysAgo,
      },
      limit: 100,
    });

    console.log(`Found ${paymentIntents.data.length} payment intents (will filter for succeeded only)`);

    const results = {
      recovered: [] as any[],
      skipped: 0,
      errors: [] as string[],
    };

    for (const paymentIntent of paymentIntents.data) {
      try {
        const metadata = paymentIntent.metadata;
        const firestoreOrderId = metadata.orderId;

        if (paymentIntent.status !== 'succeeded') {
          results.skipped++;
          continue;
        }

        if (!firestoreOrderId) {
          console.log(`Skipping payment ${paymentIntent.id} - no orderId in metadata`);
          continue;
        }

        // Check if order already exists in Firebase
        if (!db) {
          throw new Error('Firebase not available');
        }
        
        const orderRef = doc(db, 'orders', firestoreOrderId);
        const orderSnapshot = await getDoc(orderRef);

        if (orderSnapshot.exists()) {
          console.log(`Order ${firestoreOrderId} already exists - skipping`);
          results.skipped++;
          continue;
        }

        // Create the missing order
        const amount = paymentIntent.amount / 100; // Convert from cents
        const currency = paymentIntent.currency.toUpperCase();

        const itemsFromMetadata = metadata.items ? JSON.parse(metadata.items) : [];
        const formattedItems = itemsFromMetadata.map((item: any) => ({
          ...item,
          customization: item.customization || null
        }));

        const orderData = {
          id: firestoreOrderId,
          paymentIntentId: paymentIntent.id,
          status: 'accepted',
          paidAmount: amount,
          currency: currency,
          total: amount,
          items: formattedItems,
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
          createdBy: 'stripe-recovery',
          webhookPaymentId: paymentIntent.id,
          recovered: true,
          recoveredAt: new Date(),
          originalPaymentDate: new Date(paymentIntent.created * 1000)
        };

        await setDoc(orderRef, orderData);

        console.log(`RECOVERED ORDER: ${firestoreOrderId} - $${amount} - ${metadata.customerEmail}`);

        results.recovered.push({
          orderId: firestoreOrderId,
          paymentIntentId: paymentIntent.id,
          amount: amount,
          currency: currency,
          customerEmail: metadata.customerEmail,
          createdAt: new Date(paymentIntent.created * 1000).toISOString()
        });

      } catch (error: any) {
        console.error(`Error processing payment ${paymentIntent.id}:`, error);
        results.errors.push(`Payment ${paymentIntent.id}: ${error.message}`);
      }
    }

    console.log(`Recovery complete - Recovered: ${results.recovered.length}, Skipped: ${results.skipped}, Errors: ${results.errors.length}`);

    return NextResponse.json({
      success: true,
      recovered: results.recovered.length,
      skipped: results.skipped,
      errors: results.errors.length,
      details: results
    });

  } catch (error: any) {
    console.error('Recovery process failed:', error);
    return NextResponse.json(
      { error: 'Recovery failed', message: error.message },
      { status: 500 }
    );
  }
}
