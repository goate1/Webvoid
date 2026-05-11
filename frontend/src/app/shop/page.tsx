"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  productService,
  getLocationSpecificPrice,
  type Product,
} from "@/lib/productService";
import CountrySelector from "@/components/CountrySelector";
import CheckoutModal from "@/components/CheckoutModal";
import ProductModal from "@/components/ProductModal";
import { useCart } from "@/contexts/CartContext";
import { ShoppingBagIcon } from "@heroicons/react/24/outline";

// ── Helpers ───────────────────────────────────────────────────
function stringToHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) || Math.floor(Math.random() * 1_000_000) + 1_000;
}

// ── Component ─────────────────────────────────────────────────
export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const { items: cartItems, total: cartTotal, addItem } = useCart();

  // ── Load products ─────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await productService.getAll();
        if (!mounted) return;
        setProducts(items ?? []);
      } catch {
        setProducts([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ── Country persistence ───────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("selectedCountry");
    if (saved) setUserCountry(saved);
    else setShowCountrySelector(true);
  }, []);

  const handleCountryChange = useCallback((code: string) => {
    setUserCountry(code);
    setShowCountrySelector(false);
    localStorage.setItem("selectedCountry", code);
  }, []);

  const handleCountryReset = useCallback(() => {
    setUserCountry(null);
    setShowCountrySelector(true);
    localStorage.removeItem("selectedCountry");
  }, []);

  // ── Add to cart ───────────────────────────────────────────
  const handleAddToCart = useCallback((opts: {
    product: Product;
    size?: { name: string; priceModifier?: number };
    jerseyFields?: { nameOnBack: string; countryFlag: string; color: string };
  }) => {
    const { product, size, jerseyFields } = opts;
    const numericId = product.id ? stringToHash(product.id) : Date.now();
    const basePrice = getLocationSpecificPrice(product, userCountry ?? undefined);
    const sizeModifier = size?.priceModifier ?? 0;
    const price = basePrice + sizeModifier;

    const customFields: Record<string, string> = {};
    const customFieldLabels: Record<string, string> = {};

    if (size) {
      customFields["size"] = size.name;
      customFieldLabels["size"] = "Size";
    }
    if (jerseyFields?.color) {
      customFields["color"] = jerseyFields.color;
      customFieldLabels["color"] = "Color";
    }
    if (jerseyFields?.nameOnBack) {
      customFields["nameOnBack"] = jerseyFields.nameOnBack;
      customFieldLabels["nameOnBack"] = "Name on Back";
    }
    if (jerseyFields?.countryFlag) {
      customFields["countryFlag"] = jerseyFields.countryFlag;
      customFieldLabels["countryFlag"] = "Country Flag";
    }

    addItem({
      id: `${product.id ?? numericId}-${JSON.stringify(customFields)}`,
      productId: numericId,
      name: product.name,
      price,
      originalPrice: product.price,
      image: product.image,
      category: product.category,
      description: product.description,
      firestoreId: product.id,
      customization:
        Object.keys(customFields).length > 0
          ? { customFields, customFieldLabels, size: size?.name, sizeModifier }
          : undefined,
    });
  }, [userCountry, addItem]);

  // ── Pagination ────────────────────────────────────────────
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const pageItems = products.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // ── Country selector gate ─────────────────────────────────
  if (showCountrySelector) {
    return (
      <CountrySelector
        onCountryChange={handleCountryChange}
        initialCountry={userCountry ?? undefined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── Page header ──────────────────────────────────────── */}
      <div className="border-b border-[#E5E5E5] bg-white">
        <div className="void-container py-12">
          <h1
            className="font-grotesk font-black uppercase text-[#0A0A0A] leading-none"
            style={{ fontSize: "clamp(40px, 7vw, 72px)", letterSpacing: "-0.02em" }}
          >
            STORE
          </h1>
          <p className="text-[#6B6B6B] mt-3 text-base">
            Official VOID merchandise — apparel, accessories &amp; gaming gear.
          </p>

          <div className="flex items-center gap-3 mt-5 flex-wrap">
            <span className="text-sm text-[#6B6B6B]">
              Shipping to:{" "}
              <strong className="text-[#0A0A0A]">{userCountry ?? "—"}</strong>
            </span>
            <button
              onClick={handleCountryReset}
              className="text-xs text-[#A855F7] underline underline-offset-2"
            >
              Change
            </button>
          </div>
        </div>
      </div>

      <div className="void-container py-12">
        {products.length === 0 ? (
          <div className="text-center py-24 text-[#6B6B6B]">
            No products available right now. Check back soon.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pageItems.map((product) => {
                const price = getLocationSpecificPrice(product, userCountry ?? undefined);

                return (
                  <article
                    key={product.id}
                    className="void-card overflow-hidden flex flex-col cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    {/* Product image with hover swap */}
                    <div className="relative h-56 bg-[#F5F5F5] overflow-hidden">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#E5E5E5] to-[#D0D0D0]" />
                      )}
                      {product.onSale && (
                        <span className="absolute top-3 left-3 bg-[#A855F7] text-white text-[10px] font-grotesk font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px]">
                          Sale
                        </span>
                      )}
                      {/* Extra images indicator */}
                      {(() => {
                        const seen = new Set(product.image ? [product.image] : []);
                        let extra = 0;
                        if (product.hoverImage && !seen.has(product.hoverImage)) { seen.add(product.hoverImage); extra++; }
                        for (const img of product.images ?? []) { if (!seen.has(img)) { seen.add(img); extra++; } }
                        if (extra === 0) return null;
                        return (
                          <span className="absolute bottom-3 right-3 bg-black/50 text-white text-[10px] font-grotesk px-2 py-0.5 rounded-[2px]">
                            +{extra} photo{extra > 1 ? "s" : ""}
                          </span>
                        );
                      })()}
                    </div>

                    <div className="p-5 flex flex-col flex-1 gap-3">
                      <div>
                        <p className="font-grotesk font-bold text-[#0A0A0A] text-base leading-tight">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-grotesk font-bold text-[#A855F7] text-lg">
                            ${price.toFixed(2)}
                          </span>
                          {product.onSale && product.salePrice != null && (
                            <span className="text-[#6B6B6B] text-sm line-through">
                              ${product.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {product.description && (
                          <p className="text-xs text-[#6B6B6B] mt-2 line-clamp-2 leading-relaxed">
                            {product.description}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); }}
                        className="mt-auto void-button w-full"
                      >
                        VIEW / ADD TO CART
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* ── Pagination ──────────────────────────────────── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-[#E5E5E5] rounded-[4px] text-sm font-medium text-[#0A0A0A] disabled:opacity-40 hover:border-[#A855F7] transition-colors"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`px-4 py-2 border rounded-[4px] text-sm font-medium transition-colors ${
                      n === page
                        ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                        : "border-[#E5E5E5] text-[#0A0A0A] hover:border-[#A855F7]"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-[#E5E5E5] rounded-[4px] text-sm font-medium text-[#0A0A0A] disabled:opacity-40 hover:border-[#A855F7] transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Floating cart button ───────────────────────────────── */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            type="button"
            onClick={() => setCheckoutOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-[#0A0A0A] text-white rounded-[4px] shadow-xl hover:bg-[#A855F7] transition-colors text-sm font-grotesk font-bold uppercase tracking-wider"
          >
            <ShoppingBagIcon className="h-5 w-5" />
            <span>
              Checkout ({cartItems.reduce((s, i) => s + i.quantity, 0)}) · $
              {cartTotal.toFixed(2)}
            </span>
          </button>
        </div>
      )}

      {/* ── Product detail modal ───────────────────────────────── */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          userCountry={userCountry}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* ── Checkout modal ─────────────────────────────────────── */}
      {checkoutOpen && (
        <CheckoutModal
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          total={cartTotal}
          items={cartItems.map((i) => ({
            id: i.id,
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
            customization: i.customization,
            firestoreId: i.firestoreId,
          }))}
        />
      )}
    </div>
  );
}
