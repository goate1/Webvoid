import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminDb } from '@/lib/firebaseAdmin';

export async function POST() {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error('STRIPE_SECRET_KEY not configured');

    const stripe = new Stripe(secretKey, { apiVersion: '2025-08-27.basil' });
    const adminDb = getAdminDb();

    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const paymentIntents = await stripe.paymentIntents.list({
      created: { gte: thirtyDaysAgo },
      limit: 100,
    });

    const fixed: any[] = [];
    const skipped: string[] = [];

    for (const pi of paymentIntents.data) {
      if (pi.status !== 'succeeded') continue;

      const orderId = pi.metadata?.orderId;
      if (!orderId) continue;

      const orderRef = adminDb.collection('orders').doc(orderId);
      const snap = await orderRef.get();

      if (!snap.exists) {
        skipped.push(`${orderId} - not in Firestore`);
        continue;
      }

      const data = snap.data()!;
      if (data.status !== 'pending') {
        skipped.push(`${orderId} - already ${data.status}`);
        continue;
      }

      await orderRef.update({
        status: 'accepted',
        paymentIntentId: pi.id,
        paidAmount: pi.amount / 100,
        paymentVerified: true,
        updatedAt: new Date(),
        fixedAt: new Date(),
      });

      fixed.push({
        orderId,
        paymentIntentId: pi.id,
        amount: pi.amount / 100,
        currency: pi.currency.toUpperCase(),
        email: data.customerInfo?.email,
      });
    }

    return NextResponse.json({ success: true, fixed: fixed.length, skipped: skipped.length, details: { fixed, skipped } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
