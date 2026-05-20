"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { productService, type Product, type CustomField, type Size, getLocationSpecificPrice } from '@/lib/productService';
import { useCart } from '@/contexts/CartContext';
import { AnimatedCard } from '@/components/FramerAnimations';
import ReviewModal from '@/components/ReviewModal';
import ReviewList from '@/components/ReviewList';
import LoadingScreen from '@/components/LoadingScreen';
import { getCurrencyForCountry, formatFromUSD } from '@/lib/currencyService';
import { ViewfinderCircleIcon } from '@heroicons/react/24/outline';

// Hash function to convert Firestore string ID to consistent numeric ID (same as shop page)
function stringToHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Ensure positive ID and avoid 0, and make it larger to avoid conflicts with hardcoded products
  const numericId = Math.abs(hash) || Math.floor(Math.random() * 1000000) + 1000;
  return numericId;
}

interface CartItemCustomization {
  customFields?: Record<string, string>;
  size?: string;
  quantity: number;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [customization, setCustomization] = useState<CartItemCustomization>({
    quantity: 1
  });
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | undefined>(undefined);
  const [showSizeChart, setShowSizeChart] = useState(false);

  const { addItem } = useCart();

  // Combine primary image with hover image and additional images
  const allImages = product ? [product.image, ...(product.hoverImage ? [product.hoverImage] : []), ...(product.images || [])].filter(Boolean) : [];

  useEffect(() => {
    console.log('Current product images:', product?.images);
    console.log('All images to display:', allImages);
  }, [product, allImages]);

  // Load user country from localStorage
  useEffect(() => {
    const savedCountry = localStorage.getItem('selectedCountry');
    if (savedCountry) {
      setUserCountry(savedCountry);
    }
  }, []);

  // Load current user email (mock for now - in real app, this would come from auth context)
  useEffect(() => {
    // Mock user email - in a real implementation, this would come from your auth system
    const mockUserEmail = localStorage.getItem('userEmail') || undefined;
    setCurrentUserEmail(mockUserEmail);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading product with ID:', productId);
        
        const productData = await productService.getById(productId);

        console.log('Product loaded:', {
          id: productData?.id,
          name: productData?.name,
          imageCount: productData?.images?.length || 0,
          images: productData?.images,
          hoverImage: productData?.hoverImage,
          sizes: productData?.sizes,
          hasSizes: productData?.hasSizes
        });
        console.log('All images array will be:', productData ? [productData.image, ...(productData.hoverImage ? [productData.hoverImage] : []), ...(productData.images || [])].filter(Boolean) : []);

        // Debug size data specifically
        if (productData?.sizes) {
          console.log('Size data:', productData.sizes.map(size => ({
            id: size.id,
            name: size.name,
            nameLength: size.name?.length,
            priceModifier: size.priceModifier,
            available: size.available
          })));
        }

        if (!productData) {
          console.log('No product data found, redirecting to shop');
          router.push('/shop');
          return;
        }

        setProduct(productData);
      } catch (error) {
        console.error('Error loading product:', error);
        router.push('/shop');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadData();
    }
  }, [productId, router]);

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setCustomization(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [fieldId]: value
      }
    }));
  };

  const handleSizeChange = (sizeId: string) => {
    setCustomization(prev => ({
      ...prev,
      size: sizeId
    }));
  };

  const handleQuantityChange = (quantity: number) => {
    setCustomization(prev => ({
      ...prev,
      quantity: Math.max(1, quantity)
    }));
  };

  const calculateTotalPrice = () => {
    if (!product) return 0;
    // Use country-specific price
    let basePrice = getLocationSpecificPrice(product, userCountry || undefined);
    
    if (product.sizes && customization.size) {
      const selectedSize = product.sizes.find(s => s.id === customization.size);
      if (selectedSize?.priceModifier) {
        basePrice += selectedSize.priceModifier;
      }
    }
    return basePrice * customization.quantity;
  };

  const validateCustomFields = () => {
    if (!product?.customFields) return true;

    for (const field of product.customFields) {
      if (field.required) {
        const value = customization.customFields?.[field.id];
        if (!value || value.trim() === '') {
          alert(`Please fill in the required field: ${field.label}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (!validateCustomFields()) return;

    setAddingToCart(true);

    try {
      // Generate unique cart item ID based on product and customization
      const customizationKey = JSON.stringify({
        size: customization.size,
        customFields: customization.customFields
      });
      const cartItemId = `${product.id}_${btoa(customizationKey).replace(/[^a-zA-Z0-9]/g, '')}`;
      
      // Get country-specific price
      const itemPrice = getLocationSpecificPrice(product, userCountry || undefined);
      
      await addItem({
        id: cartItemId,
        productId: parseInt(product.id!) || Math.floor(Math.random() * 1000000),
        name: product.name,
        price: itemPrice,
        originalPrice: product.price !== itemPrice ? product.price : undefined,
        image: product.image,
        category: product.category,
        description: product.description,
        quantity: customization.quantity, // Pass the total quantity
        customization: {
          customFields: customization.customFields,
          customFieldLabels: product.customFields?.reduce((acc, field) => {
            acc[field.id] = field.label;
            return acc;
          }, {} as Record<string, string>),
          size: product.sizes?.find(s => s.id === customization.size)?.name || customization.size,
          sizeModifier: product.sizes?.find(s => s.id === customization.size)?.priceModifier || 0
        },
        firestoreId: product.id,
      });

      alert(`Added ${customization.quantity} item(s) to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!product) {
    return (
      <div className="pt-20 min-h-screen bg-gradient-to-b from-[#1a0a2e] via-[#2a1a3a] to-[#1a0a2e] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Product Not Found</h1>
          <button
            onClick={() => router.push('/shop')}
            className="bg-[#FFFFFF] text-black px-6 py-2 rounded-lg font-medium hover:bg-[#FFFFFF]/90 transition-colors"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-b from-[#1a0a2e] via-[#2a1a3a] to-[#1a0a2e] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="void-container py-8 relative z-10">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/shop')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Shop
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 items-start">
          {/* Product Image Gallery */}
          <div className="space-y-4">
            <AnimatedCard className="void-card overflow-hidden p-0 bg-[#0F0F0F]">
              {allImages.length > 1 ? (
                <div className="relative w-full h-auto min-h-[300px] sm:min-h-[400px] md:min-h-[500px] flex items-center justify-center">
                  {/* Previous Arrow */}
                  <button
                    onClick={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentImageIndex === 0}
                    className={`absolute left-2 sm:left-4 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm border border-white/20 ${
                      currentImageIndex === 0 ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'
                    }`}
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Current Image */}
                  <div className="relative w-full h-full flex items-center justify-center p-4">
                    <img
                      src={allImages[currentImageIndex]}
                      alt={`${product.name} view ${currentImageIndex + 1}`}
                      className="w-full h-full object-contain max-w-full max-h-[60vh]"
                      loading="lazy"
                    />
                  </div>

                  {/* Next Arrow */}
                  <button
                    onClick={() => setCurrentImageIndex(prev => Math.min(allImages.length - 1, prev + 1))}
                    disabled={currentImageIndex === allImages.length - 1}
                    className={`absolute right-2 sm:right-4 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm border border-white/20 ${
                      currentImageIndex === allImages.length - 1 ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'
                    }`}
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Image Counter */}
                  <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                    <span className="text-xs sm:text-sm text-white font-medium">
                      {currentImageIndex + 1} / {allImages.length}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-auto min-h-[300px] sm:min-h-[400px] md:min-h-[500px] flex items-center justify-center p-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain max-w-full max-h-[60vh]"
                    loading="lazy"
                  />
                </div>
              )}
            </AnimatedCard>

            {/* Ad Placeholder */}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <span className="inline-block px-3 py-1 bg-[#FFFFFF]/10 rounded-full text-[#FFFFFF] text-sm font-medium mb-3">
                {product.category}
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
                {product.name}
              </h1>
              <div className="mb-4">
                {(() => {
                  const displayPrice = getLocationSpecificPrice(product, userCountry || undefined);
                  const hasDiscount = displayPrice < product.price && displayPrice > 0;
                  const currency = getCurrencyForCountry(userCountry || 'US');
                  
                  return (
                    <>
                      <div className="text-xl sm:text-2xl font-bold text-green-400">
                        {displayPrice === 0 ? 'FREE' : formatFromUSD(displayPrice, currency)}
                      </div>
                      {hasDiscount && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-gray-500 line-through text-lg">{formatFromUSD(product.price, currency)}</span>
                          <span className="text-red-400 text-sm font-bold">
                            -{Math.round(((product.price - displayPrice) / product.price) * 100)}% OFF
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Size Selection */}
            {product.hasSizes && product.sizes && product.sizes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Size</h3>
                  {product.hasSizeChart && (
                    <button
                      onClick={() => setShowSizeChart(true)}
                      className="text-[#FFFFFF]/60 hover:text-[#FFFFFF] text-sm flex items-center gap-1.5 transition-colors group"
                    >
                      <ViewfinderCircleIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      View Size Chart
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                  {product.sizes.filter(size => size.available).map((size) => {
                    console.log('Rendering size:', {
                      id: size.id,
                      name: size.name,
                      nameType: typeof size.name,
                      priceModifier: size.priceModifier,
                      priceModifierType: typeof size.priceModifier,
                      showPrice: size.priceModifier && size.priceModifier !== 0
                    });
                    return (
                    <button
                      key={size.id}
                      onClick={() => handleSizeChange(size.id)}
                      className={`py-2 sm:py-3 px-2 sm:px-4 rounded-lg border transition-all text-sm sm:text-base ${
                        customization.size === size.id
                          ? 'bg-[#FFFFFF] text-black border-[#FFFFFF]'
                          : 'bg-[#1A1A1A] text-white border-[#2A2A2A] hover:border-[#FFFFFF]/50'
                      }`}
                    >
                      {size.name}
                      {size.priceModifier && size.priceModifier !== 0 && (
                        <span className="block text-xs text-gray-400 mt-1">
                          {size.priceModifier > 0 ? `+$${size.priceModifier}` : `-$${Math.abs(size.priceModifier)}`}
                        </span>
                      )}
                    </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Fields */}
            {product.hasCustomFields && product.customFields && product.customFields.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Customization</h3>
                {product.customFields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      {field.label} {field.required && <span className="text-red-400">*</span>}
                    </label>

                    {field.type === 'text' && (
                      <input
                        type="text"
                        placeholder={field.placeholder}
                        maxLength={field.maxLength}
                        value={customization.customFields?.[field.id] || ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#FFFFFF]"
                      />
                    )}

                    {field.type === 'number' && (
                      <input
                        type="number"
                        placeholder={field.placeholder}
                        min={field.validation?.min}
                        max={field.validation?.max}
                        value={customization.customFields?.[field.id] || ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#FFFFFF]"
                      />
                    )}

                    {field.type === 'select' && field.options && (
                      <select
                        value={customization.customFields?.[field.id] || ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#FFFFFF]"
                      >
                        <option value="">Select {field.label.toLowerCase()}</option>
                        {field.options.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-300">Quantity:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleQuantityChange(customization.quantity - 1)}
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-white hover:border-[#FFFFFF]/50 flex items-center justify-center text-lg"
                    >
                      -
                    </button>
                    <span className="w-12 text-center text-white font-medium text-base sm:text-lg">{customization.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(customization.quantity + 1)}
                      className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1A1A1A] border border-[#2A2A2A] rounded text-white hover:border-[#FFFFFF]/50 flex items-center justify-center text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between py-4 border-t border-[#2A2A2A]">
                <span className="text-lg sm:text-xl font-semibold text-white">
                  Total: {(() => {
                    const total = calculateTotalPrice();
                    const currency = getCurrencyForCountry(userCountry || 'US');
                    return total === 0 ? 'FREE' : formatFromUSD(total, currency);
                  })()}
                </span>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="void-button glow-on-hover w-full py-3 px-4 sm:py-4 sm:px-6 text-base sm:text-lg font-bold transition-all duration-300"
              >
                {addingToCart ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Adding to Cart...
                  </div>
                ) : (
                  `Add ${customization.quantity} to Cart - ${(() => {
                    const total = calculateTotalPrice();
                    const currency = getCurrencyForCountry(userCountry || 'US');
                    return total === 0 ? 'FREE' : formatFromUSD(total, currency);
                  })()}`
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Customer Reviews</h2>
            <button
              onClick={() => setShowReviewModal(true)}
              className="bg-[#FFFFFF] hover:bg-[#FFFFFF]/90 text-black px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Write a Review
            </button>
          </div>

          <ReviewList 
            productId={productId ? stringToHash(productId) : Math.floor(Math.random() * 1000000) + 1000}
            currentUserEmail={currentUserEmail}
            showAll={true}
          />
        </div>

        {/* Review Modal */}
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          productId={productId ? stringToHash(productId) : Math.floor(Math.random() * 1000000) + 1000}
          productName={product?.name || 'Product'}
        />

        {/* Size Chart Modal */}
        {showSizeChart && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-black/80 animate-in fade-in duration-300">
            <div 
              className="absolute inset-0" 
              onClick={() => setShowSizeChart(false)}
            />
            <AnimatedCard className="relative w-full max-w-4xl bg-[#0F0F0F] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#2A2A2A]">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <ViewfinderCircleIcon className="w-6 h-6 text-purple-400" />
                  Size Guide
                </h3>
                <button 
                  onClick={() => setShowSizeChart(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-2 sm:p-4 overflow-y-auto max-h-[85vh] flex items-center justify-center bg-[#050505]">
                <div className="relative w-full">
                  <img
                    src="https://scontent.xx.fbcdn.net/v/t1.15752-9/670784301_933741676130468_8460096998453077367_n.png?_nc_cat=100&ccb=1-7&_nc_sid=fc17b8&efg=eyJxZV9ncm91cHMiOlsiaWdkX2Jlc3RfZWZmb3J0X2ltYWdlOmNvbnRyb2wiXX0%3D&_nc_ohc=t7zv7zw0dBMQ7kNvwFv4Jsz&_nc_oc=AdqsoxW5IbuV85_H1w2FGsO9YHRjpnBY-3cT0eYVVgBKjx7wcbZv_SZZk23zB3bXEYhA1fqjgtdrTptP1a_z71Dk&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.xx&_nc_ss=7a22e&oh=03_Q7cD5AEVVfFCwihMhrj8QNjpZji3-4fbcUUx0oykqQSTGV4fiQ&oe=6A10E3C1"
                    alt="Size Chart"
                    className="w-full h-auto object-contain rounded-lg"
                  />
                </div>
              </div>
              <div className="p-4 sm:p-6 border-t border-[#2A2A2A] bg-[#0A0A0A]">
                <p className="text-sm text-gray-400 text-center italic">
                  * All measurements are in centimeters unless specified otherwise.
                </p>
              </div>
            </AnimatedCard>
          </div>
        )}
      </div>
    </div>
  );
}
