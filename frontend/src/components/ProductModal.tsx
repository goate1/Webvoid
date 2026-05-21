"use client";

import { useState } from "react";
import Image from "next/image";
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { type Product, getLocationSpecificPrice } from "@/lib/productService";

function isJersey(product: Product): boolean {
  const h = `${product.name} ${product.category}`.toLowerCase();
  return h.includes("jersey") || h.includes("kit");
}

interface AddToCartOpts {
  product: Product;
  size?: { name: string; priceModifier?: number };
  jerseyFields?: { nameOnBack: string; countryFlag: string; color: string; jerseyNumber: string };
}

interface Props {
  product: Product;
  userCountry: string | null;
  onClose: () => void;
  onAddToCart: (opts: AddToCartOpts) => void;
}

export default function ProductModal({ product, userCountry, onClose, onAddToCart }: Props) {
  const allImages = [
    ...(product.image ? [product.image] : []),
    ...(product.hoverImage && product.hoverImage !== product.image ? [product.hoverImage] : []),
    ...(product.images ?? []).filter(
      (img) => img !== product.image && img !== product.hoverImage
    ),
  ];

  const [activeImg, setActiveImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [nameOnBack, setNameOnBack] = useState("");
  const [countryFlag, setCountryFlag] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [jerseyColor, setJerseyColor] = useState<"Black" | "White">("Black");
  const [error, setError] = useState<string | null>(null);

  const jersey = isJersey(product);
  const hasSizes = (product.sizes?.length ?? 0) > 0;
  const hasColorOptions = jersey && allImages.length >= 2;
  const basePrice = getLocationSpecificPrice(product, userCountry ?? undefined);
  const sizeObj = product.sizes?.find((s) => s.name === selectedSize);
  const displayPrice = basePrice + (sizeObj?.priceModifier ?? 0);

  const handleColorChange = (color: "Black" | "White") => {
    setJerseyColor(color);
    setActiveImg(color === "Black" ? 0 : 1);
  };

  const prevImg = () => setActiveImg((i) => (i - 1 + allImages.length) % allImages.length);
  const nextImg = () => setActiveImg((i) => (i + 1) % allImages.length);

  const handleAdd = () => {
    if (hasSizes && !selectedSize) {
      setError("Please select a size.");
      return;
    }
    setError(null);
    onAddToCart({
      product,
      size: sizeObj ? { name: sizeObj.name, priceModifier: sizeObj.priceModifier } : undefined,
      jerseyFields: jersey ? { nameOnBack, countryFlag, color: jerseyColor, jerseyNumber } : undefined,
    });
    onClose();
  };

  return (
    // Scrollable overlay — content expands naturally, backdrop scrolls on mobile
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="bg-white rounded-[4px] w-full max-w-3xl flex flex-col md:flex-row shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Image panel ── */}
          <div className="md:w-1/2 flex flex-col flex-shrink-0">
            <div className="relative aspect-square bg-[#F5F5F5]">
              {allImages.length > 0 ? (
                <Image
                  src={allImages[activeImg]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width:768px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#E5E5E5] to-[#D0D0D0]" />
              )}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={prevImg}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1 shadow"
                  >
                    <ChevronLeftIcon className="w-5 h-5 text-[#0A0A0A]" />
                  </button>
                  <button
                    onClick={nextImg}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1 shadow"
                  >
                    <ChevronRightIcon className="w-5 h-5 text-[#0A0A0A]" />
                  </button>
                </>
              )}
              {product.onSale && (
                <span className="absolute top-3 left-3 bg-[#A855F7] text-white text-[10px] font-grotesk font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px]">
                  Sale
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 p-3 border-t border-[#E5E5E5] overflow-x-auto">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`relative w-16 h-16 flex-shrink-0 rounded overflow-hidden border-2 transition-colors ${
                      i === activeImg ? "border-[#A855F7]" : "border-transparent hover:border-[#D0D0D0]"
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Details panel ── */}
          <div className="md:w-1/2 flex flex-col p-6 gap-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-grotesk font-black text-[#0A0A0A] text-xl leading-tight">
                  {product.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-grotesk font-bold text-[#A855F7] text-2xl">
                    ${displayPrice.toFixed(2)}
                  </span>
                  {product.onSale && product.salePrice != null && (
                    <span className="text-[#6B6B6B] text-base line-through">
                      ${product.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-[#6B6B6B] hover:text-[#0A0A0A] p-1 flex-shrink-0"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-[#6B6B6B] leading-relaxed">{product.description}</p>
            )}

            {/* Color selector (jerseys with 2+ images) */}
            {hasColorOptions && (
              <div>
                <p className="void-label">Color</p>
                <div className="flex gap-2 mt-1">
                  {(["Black", "White"] as const).map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`px-4 py-1.5 text-sm font-grotesk font-bold border rounded-[4px] transition-colors ${
                        jerseyColor === color
                          ? "border-[#A855F7] bg-[#A855F7] text-white"
                          : "border-[#E5E5E5] text-[#0A0A0A] hover:border-[#A855F7]"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {hasSizes && (
              <div>
                <p className="void-label">Size</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {product.sizes!.map((size) => (
                    <button
                      key={size.id}
                      disabled={!size.available}
                      onClick={() => { setSelectedSize(size.name); setError(null); }}
                      className={`px-3 py-1.5 text-sm font-grotesk font-bold border rounded-[4px] transition-colors ${
                        !size.available
                          ? "border-[#E5E5E5] text-[#BEBEBE] line-through cursor-not-allowed"
                          : selectedSize === size.name
                          ? "border-[#A855F7] bg-[#A855F7] text-white"
                          : "border-[#E5E5E5] text-[#0A0A0A] hover:border-[#A855F7]"
                      }`}
                    >
                      {size.name}
                      {size.priceModifier ? ` +$${size.priceModifier}` : ""}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Jersey custom fields */}
            {jersey && (
              <div className="space-y-3 pt-2 border-t border-[#E5E5E5]">
                <div>
                  <label className="void-label" htmlFor="modal-name-on-back">
                    Name on Back
                  </label>
                  <input
                    id="modal-name-on-back"
                    type="text"
                    className="void-input"
                    placeholder="e.g. VOID"
                    value={nameOnBack}
                    onChange={(e) => setNameOnBack(e.target.value)}
                  />
                </div>
                <div>
                  <label className="void-label" htmlFor="modal-country-flag">
                    Country Flag
                  </label>
                  <input
                    id="modal-country-flag"
                    type="text"
                    className="void-input"
                    placeholder="e.g. USA, Canada, UK..."
                    value={countryFlag}
                    onChange={(e) => setCountryFlag(e.target.value)}
                  />
                </div>
                <div>
                  <label className="void-label" htmlFor="modal-jersey-number">
                    Jersey Number
                  </label>
                  <input
                    id="modal-jersey-number"
                    type="number"
                    min={0}
                    max={99}
                    className="void-input"
                    placeholder="e.g. 7"
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(e.target.value)}
                  />
                </div>
              </div>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="button"
              onClick={handleAdd}
              className="mt-auto void-button w-full"
            >
              ADD TO CART
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
