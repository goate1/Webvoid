"use client";

import Link from 'next/link';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import Image from 'next/image';

export default function CartIcon() {
  const { itemCount, items, total } = useCart();
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
    >
      <Link href="/cart" className="relative p-2 text-white hover:text-[#a6a6a6] transition-colors duration-300">
        <ShoppingCartIcon className="h-6 w-6" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#FFFFFF] text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transform translate-x-0 translate-y-2.5">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </Link>

      {/* Cart Preview Dropdown */}
      {showPreview && itemCount > 0 && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-xl z-50 p-4">
          <div className="mb-3">
            <h3 className="text-white font-semibold">Cart ({itemCount} items)</h3>
          </div>
          
          <div className="max-h-64 overflow-y-auto space-y-3 mb-4">
            {items.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-contain rounded"
                  />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-white text-sm font-medium truncate">{item.name}</p>
                  <p className="text-gray-400 text-xs">
                    {item.quantity} × ${item.price.toFixed(2)}
                  </p>
                </div>
                <div className="text-white text-sm font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
            
            {items.length > 3 && (
              <p className="text-gray-400 text-sm text-center">
                +{items.length - 3} more items
              </p>
            )}
          </div>
          
          <div className="border-t border-[#2A2A2A] pt-3">
            <div className="flex justify-between items-center mb-3">
              <span className="text-white font-semibold">Total:</span>
              <span className="text-white font-bold">${total.toFixed(2)}</span>
            </div>
            
            <Link
              href="/cart"
              className="block w-full bg-[#0A0A0A] hover:bg-[#222] text-white text-center py-2 px-4 rounded-lg transition-all duration-300 font-medium"
            >
              View Cart
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}