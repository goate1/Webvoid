import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { orderId, orderData } = await req.json();

    if (!orderId || !orderData) {
      return NextResponse.json({ error: 'Missing orderId or orderData' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    await adminDb.collection('orders').doc(orderId).set({
      ...orderData,
      status: 'pending',
      createdAt: new Date(),
      createdBy: 'checkout',
    });

    console.log('Pending order created:', orderId);
    return NextResponse.json({ success: true, orderId });
  } catch (error: any) {
    console.error('Error creating pending order:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}
