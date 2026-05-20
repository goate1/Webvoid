"use client";

import Link from 'next/link';
import { useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';

export default function PaymentSuccessPage() {
  const { clearCart } = useCart();

  useEffect(() => {
    // Clear the cart when payment is successful
    clearCart();
  }, [clearCart]);

  return (
    <div className="pt-20 min-h-screen bg-[#0F0F0F]">
      <div className="container mx-auto px-4 py-12">
        {/* Ad Spot - Banner at top */}
        <div className="mb-8">
        </div>

        <div className="text-center max-w-md mx-auto">
          <div className="text-green-400 mb-8">
            <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold gradient-text mb-4">Payment Successful!</h1>
          <p className="text-gray-400 mb-8">
            Thank you for your order. You will receive a confirmation email shortly.
          </p>
          
          <div className="space-y-4">
            <Link href="/shop" className="block void-button glow-on-hover">
              Continue Shopping
            </Link>
            <Link href="/track-order" className="block text-gray-400 hover:text-white transition-colors duration-300">
              Track Your Order
            </Link>
            <Link href="/" className="block text-gray-400 hover:text-white transition-colors duration-300">
              Back to Home
            </Link>
          </div>

          {/* Ad Spot - Banner at bottom */}
          <div className="mt-12">
          </div>
        </div>
      </div>
    </div>
  );
}