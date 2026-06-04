"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircleIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { useCart } from "@/contexts/CartContext";
import { formatCurrency, convertToUSD } from "@/lib/currencyService";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  customization?: {
    customFields?: Record<string, string>;
    customFieldLabels?: Record<string, string>;
    size?: string;
  };
}

interface OrderData {
  id: string;
  items: OrderItem[];
  total: number;
  currency?: string;
  shippingCost?: number;
  tax?: number;
  createdAt: string;
  customerInfo: {
    name?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    discordUsername?: string;
  };
}

export default function PaymentSuccessPage() {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    clearCart();
    try {
      const stored = localStorage.getItem("void-last-order");
      if (stored) {
        const parsed = JSON.parse(stored);
        setOrder(parsed);
      }
    } catch {}
  }, [clearCart]);

  const copyOrderId = async () => {
    const text = order?.id ?? orderId ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const currency = order?.currency ?? "USD";
  const displayId = order?.id ?? orderId ?? "—";

  return (
    <main className="min-h-screen bg-[#F5F5F5] pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-6">

        {/* Success header */}
        <div className="bg-white rounded-[4px] border border-[#E5E5E5] p-8 text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircleIcon className="w-9 h-9 text-green-600" />
          </div>
          <h1 className="font-grotesk font-black text-[#0A0A0A] text-3xl uppercase tracking-tight mb-2">
            Order Confirmed
          </h1>
          <p className="text-[#6B6B6B] text-sm">
            {order?.customerInfo?.email
              ? `A confirmation email is on its way to ${order.customerInfo.email}`
              : "Thank you for your purchase. A confirmation email is on its way."}
          </p>
        </div>

        {/* Order ID */}
        <div className="bg-white rounded-[4px] border border-[#E5E5E5] p-6 mb-6">
          <p className="text-[10px] font-grotesk font-bold uppercase tracking-[0.15em] text-[#6B6B6B] mb-3">
            Order ID
          </p>
          <div className="flex items-center justify-between gap-3 bg-[#F5F5F5] rounded-[4px] px-4 py-3">
            <span className="font-mono text-sm text-[#0A0A0A] truncate">{displayId}</span>
            <button
              onClick={copyOrderId}
              className="flex items-center gap-1.5 text-xs font-grotesk font-bold uppercase tracking-wider text-[#A855F7] hover:text-[#9333EA] transition-colors flex-shrink-0"
            >
              <ClipboardDocumentIcon className="w-4 h-4" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-[#6B6B6B] text-xs mt-2">Save this to track your order status.</p>
        </div>

        {/* Order items */}
        {order && (
          <div className="bg-white rounded-[4px] border border-[#E5E5E5] p-6 mb-6">
            <p className="text-[10px] font-grotesk font-bold uppercase tracking-[0.15em] text-[#6B6B6B] mb-4">
              Items Ordered
            </p>
            <div className="space-y-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="relative w-14 h-14 flex-shrink-0 bg-[#F5F5F5] rounded-[4px] overflow-hidden">
                    <Image src={item.image} alt={item.name} fill className="object-contain" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-grotesk font-bold text-[#0A0A0A] text-sm truncate">{item.name}</p>
                    {item.customization?.size && (
                      <p className="text-xs text-[#6B6B6B]">Size: {item.customization.size}</p>
                    )}
                    {item.customization?.customFields && Object.entries(item.customization.customFields)
                      .filter(([k]) => k !== "size" && k !== "color")
                      .map(([k, v]) => (
                        <p key={k} className="text-xs text-[#6B6B6B]">
                          {item.customization?.customFieldLabels?.[k] ?? k}: {v}
                        </p>
                      ))}
                    <p className="text-xs text-[#6B6B6B] mt-0.5">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-grotesk font-bold text-[#0A0A0A] text-sm flex-shrink-0">
                    {formatCurrency(item.price * item.quantity, currency)}
                  </p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-[#E5E5E5] mt-5 pt-4 space-y-2 text-sm">
              {order.shippingCost != null && order.shippingCost > 0 && (
                <div className="flex justify-between text-[#6B6B6B]">
                  <span>Shipping</span>
                  <span>{formatCurrency(order.shippingCost, currency)}</span>
                </div>
              )}
              {order.tax != null && order.tax > 0 && (
                <div className="flex justify-between text-[#6B6B6B]">
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax, currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-grotesk font-black text-[#0A0A0A] text-base pt-1 border-t border-[#E5E5E5]">
                <span>Total</span>
                <span>
                  {formatCurrency(order.total, currency)}
                  {currency !== "USD" && (
                    <span className="text-xs font-normal text-[#6B6B6B] ml-1">
                      (≈${convertToUSD(order.total, currency).toFixed(2)} USD)
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Shipping address */}
        {order?.customerInfo && (
          <div className="bg-white rounded-[4px] border border-[#E5E5E5] p-6 mb-6">
            <p className="text-[10px] font-grotesk font-bold uppercase tracking-[0.15em] text-[#6B6B6B] mb-3">
              Shipping To
            </p>
            <div className="text-sm text-[#0A0A0A] space-y-0.5">
              <p className="font-bold">{order.customerInfo.name}</p>
              {order.customerInfo.address && <p className="text-[#6B6B6B]">{order.customerInfo.address}</p>}
              {order.customerInfo.city && (
                <p className="text-[#6B6B6B]">
                  {order.customerInfo.city}{order.customerInfo.state ? `, ${order.customerInfo.state}` : ""} {order.customerInfo.zipCode}
                </p>
              )}
              {order.customerInfo.country && <p className="text-[#6B6B6B]">{order.customerInfo.country}</p>}
              {order.customerInfo.discordUsername && (
                <p className="text-[#6B6B6B] mt-1">Discord: {order.customerInfo.discordUsername}</p>
              )}
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/track-order?order=${encodeURIComponent(displayId)}`}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-[#0A0A0A] text-white text-sm font-grotesk font-bold uppercase tracking-wider rounded-[4px] hover:bg-[#A855F7] transition-colors"
          >
            Track Order
          </Link>
          <Link
            href="/shop"
            className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-[#E5E5E5] text-[#0A0A0A] text-sm font-grotesk font-bold uppercase tracking-wider rounded-[4px] hover:border-[#0A0A0A] transition-colors"
          >
            Continue Shopping
          </Link>
        </div>

      </div>
    </main>
  );
}
