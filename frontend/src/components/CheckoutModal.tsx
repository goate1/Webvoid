"use client";

import { useState, useEffect, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Elements } from '@stripe/react-stripe-js';
import getStripe from '@/lib/stripe';
import CheckoutForm from './CheckoutForm';
import { useOrders, Order } from '@/contexts/OrderContext';
import { useCart } from '@/contexts/CartContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import OrderSuccessModal from './OrderSuccessModal';
import { generateOrderNumber } from '@/lib/orderUtils';
import { SUPPORTED_CURRENCIES, convertFromUSD, formatCurrency, getCurrencyForCountry } from '@/lib/currencyService';


interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  items: Array<{
    id: string;
    productId?: number;
    name: string;
    price: number;
    quantity: number;
    image: string;
    customization?: {
      customFields?: Record<string, string>;
      size?: string;
      sizeModifier?: number;
    };
    firestoreId?: string;
  }>;
}

interface CustomerInfo {
  name: string;
  email: string;
  address: string;
  city: string;
  zipCode: string;
  phone: string;
  country: string;
  discordUsername?: string;
}


export default function CheckoutModal({ isOpen, onClose, total, items }: CheckoutModalProps) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
    phone: '',
    country: '',
    discordUsername: '',
  });
  
  // Add currency state
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  
  // Auto-update currency when country changes
  useEffect(() => {
    if (customerInfo.country) {
      const currencyForCountry = getCurrencyForCountry(customerInfo.country);
      setSelectedCurrency(currencyForCountry);
    }
  }, [customerInfo.country]);
  
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [orderProcessed, setOrderProcessed] = useState(false);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [pendingOrderId, setPendingOrderId] = useState<string>('');
  // Remove shipping calculation effect since we're not calculating shipping
  // const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  
  const { addOrder } = useOrders();
  const { clearCart } = useCart();

  const isFormValid = customerInfo.name.trim() !== '' && 
                      customerInfo.email.trim() !== '' && 
                      customerInfo.address.trim() !== '' && 
                      customerInfo.city.trim() !== '' &&
                      customerInfo.zipCode.trim() !== '' && 
                      customerInfo.phone.trim() !== '' && 
                      customerInfo.country.trim() !== '';
  
  // Base prices in USD
  const subtotalUSD = total;
  const taxUSD = (total > 0) ? total * 0.08 : 0;
  const shippingCostUSD = 0; // Currently fixed at 0
  const finalTotalUSD = subtotalUSD + taxUSD + shippingCostUSD;

  // Converted prices for display and charging
  const subtotal = convertFromUSD(subtotalUSD, selectedCurrency);
  const tax = convertFromUSD(taxUSD, selectedCurrency);
  const finalTotal = convertFromUSD(finalTotalUSD, selectedCurrency);
  
  // Get selected currency details
  const currencyDetails = SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency) || SUPPORTED_CURRENCIES[0];
  
  // Format price with selected currency
  const formatPrice = (amount: number) => {
    return formatCurrency(amount, selectedCurrency);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('checkout-open');
      setOrderProcessed(false); // Reset when opening
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('checkout-open');
      if (!orderProcessed) {
        setShowPayment(false);
        setClientSecret('');
      }
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('checkout-open');
    };
  }, [isOpen, orderProcessed]);

  // Calculate the total weight of items in the cart
  // This is a simplified implementation - in a real app, you would have actual product weights
  const calculateOrderWeight = useCallback((): number => {
    // Simplified: assume each item weighs 1 pound
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  // Set fixed shipping cost (removed dynamic calculation)
  useEffect(() => {
    // Set a fixed shipping cost of $0 (free shipping)
    setShippingCost(0);
  }, []);



  const handleInputChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const handleProceedToPayment = async () => {
    if (!isFormValid) return;

    // If total is $0 or less, skip payment processing and create order directly
    if (finalTotal <= 0) {
      setIsLoading(true);
      try {
        // Create order directly for free items
        const newOrder = {
          id: generateOrderNumber(),
          items: items.map(item => ({
            ...item,
            price: convertFromUSD(item.price, selectedCurrency)
          })), 
          total: finalTotal,
          customerInfo: customerInfo,
          status: 'accepted' as const,
          createdAt: new Date().toISOString(),
        };
        
        try {
          if (db) {
            await setDoc(doc(db, 'orders', newOrder.id), {
              ...newOrder,
              createdAt: new Date(),
            });
          }
        } catch (error) {
          console.error('Error saving free order to Firebase:', error);
        }
        
        addOrder(newOrder);
        
        // Send confirmation email for free order
        try {
          await fetch('/api/send-order-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: customerInfo.email,
              orderId: newOrder.id,
              customerName: customerInfo.name,
              total: 0,
              currency: selectedCurrency,
            }),
          });
        } catch (emailError) {
          console.error('Error sending free order email:', emailError);
        }

        clearCart();
        setCompletedOrder(newOrder);
        setOrderProcessed(true);
        setShowSuccessModal(true);
        onClose();
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // For paid orders, proceed with Stripe
    try {
      setIsLoading(true);
      
      // Generate order number for metadata
      const orderNumber = generateOrderNumber();
      const tempOrderId = `Void_Order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setPendingOrderId(tempOrderId);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalTotal,
          currency: selectedCurrency.toLowerCase(),
          metadata: {
            customerName: customerInfo.name,
            customerEmail: customerInfo.email,
            customerAddress: customerInfo.address,
            customerCity: customerInfo.city,
            customerZipCode: customerInfo.zipCode,
            customerPhone: customerInfo.phone,
            customerCountry: customerInfo.country,
            customerDiscord: customerInfo.discordUsername,
            orderId: tempOrderId, // Reference for potential order creation
            orderNumber,
            items: JSON.stringify(items.map(item => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              customization: item.customization
              // Note: image excluded to stay under Stripe's 500 char metadata limit
            }))),
          },
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initialize payment');
      }

      const responseData = await response.json();
      const { clientSecret } = responseData;
      
      if (!clientSecret) {
        throw new Error('No client secret received from server');
      }
      
      setClientSecret(clientSecret);
      setShowPayment(true);
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      if (error.name === 'AbortError') {
        alert('Payment request timed out. Please try again.');
      } else {
        alert(error.message || 'Failed to initialize payment. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const [stripeInstance, setStripeInstance] = useState<any>(null);

  // Initialize Stripe on mount - use consistent getStripe
  useEffect(() => {
    let mounted = true;
    
    const initStripe = async () => {
      try {
        const stripe = await getStripe();
        if (mounted && stripe) {
          setStripeInstance(stripe);
        }
      } catch (error) {
        console.error('Error loading Stripe:', error);
      }
    };
    
    initStripe();
    
    return () => {
      mounted = false;
    };
  }, []);

  const appearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#FFFFFF',
      colorBackground: '#1A1A1A',
      colorText: '#FFFFFF',
      colorDanger: '#df1b41',
      fontFamily: 'Arial, Helvetica, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <>
      {/* Checkout Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-300"
          data-checkout-modal="true"
        >
      <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-300 mt-16">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A]">
          <h2 className="text-xl font-bold gradient-text">
            {showPayment ? 'Complete Payment' : 'Checkout'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-300 p-1"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {!showPayment ? (
            <>
              {/* Customer Information Form */}
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Shipping Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFFFFF] focus:border-transparent transition-all duration-300"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFFFFF] focus:border-transparent transition-all duration-300"
                    placeholder="Enter your email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFFFFF] focus:border-transparent transition-all duration-300"
                    placeholder="Enter your city"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Discord Username (optional)
                  </label>
                  <input
                    type="text"
                    value={customerInfo.discordUsername || ''}
                    onChange={(e) => handleInputChange('discordUsername', e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFFFFF] focus:border-transparent transition-all duration-300"
                    placeholder="Enter your Discord username (e.g., user#1234)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFFFFF] focus:border-transparent transition-all duration-300"
                    placeholder="Enter your address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFFFFF] focus:border-transparent transition-all duration-300"
                      placeholder="ZIP Code"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFFFFF] focus:border-transparent transition-all duration-300"
                      placeholder="Phone"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Country *
                  </label>
                  <select
                    value={customerInfo.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFFFFF] focus:border-transparent transition-all duration-300"
                  >
                    <option value="">Select your country</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="JP">Japan</option>
                    <option value="CN">China</option>
                    <option value="IN">India</option>
                    <option value="BR">Brazil</option>
                    <option value="MX">Mexico</option>
                    <option value="ES">Spain</option>
                    <option value="IT">Italy</option>
                    <option value="NL">Netherlands</option>
                    <option value="SE">Sweden</option>
                    <option value="NO">Norway</option>
                    <option value="DK">Denmark</option>
                    <option value="FI">Finland</option>
                    <option value="BE">Belgium</option>
                    <option value="CH">Switzerland</option>
                    <option value="AT">Austria</option>
                    <option value="IE">Ireland</option>
                    <option value="PT">Portugal</option>
                    <option value="PL">Poland</option>
                    <option value="CZ">Czech Republic</option>
                    <option value="HU">Hungary</option>
                    <option value="RO">Romania</option>
                    <option value="BG">Bulgaria</option>
                    <option value="HR">Croatia</option>
                    <option value="RS">Serbia</option>
                    <option value="SI">Slovenia</option>
                    <option value="SK">Slovakia</option>
                    <option value="EE">Estonia</option>
                    <option value="LV">Latvia</option>
                    <option value="LT">Lithuania</option>
                    <option value="LU">Luxembourg</option>
                    <option value="MT">Malta</option>
                    <option value="CY">Cyprus</option>
                    <option value="GR">Greece</option>
                    <option value="RU">Russia</option>
                    <option value="UA">Ukraine</option>
                    <option value="TR">Turkey</option>
                    <option value="IL">Israel</option>
                    <option value="SA">Saudi Arabia</option>
                    <option value="AE">United Arab Emirates</option>
                    <option value="ZA">South Africa</option>
                    <option value="NG">Nigeria</option>
                    <option value="EG">Egypt</option>
                    <option value="KE">Kenya</option>
                    <option value="MA">Morocco</option>
                    <option value="GH">Ghana</option>
                    <option value="AR">Argentina</option>
                    <option value="CL">Chile</option>
                    <option value="CO">Colombia</option>
                    <option value="PE">Peru</option>
                    <option value="VE">Venezuela</option>
                    <option value="UY">Uruguay</option>
                    <option value="PY">Paraguay</option>
                    <option value="BO">Bolivia</option>
                    <option value="EC">Ecuador</option>
                    <option value="CR">Costa Rica</option>
                    <option value="GT">Guatemala</option>
                    <option value="HN">Honduras</option>
                    <option value="SV">El Salvador</option>
                    <option value="NI">Nicaragua</option>
                    <option value="PA">Panama</option>
                    <option value="DO">Dominican Republic</option>
                    <option value="JM">Jamaica</option>
                    <option value="TT">Trinidad and Tobago</option>
                    <option value="BB">Barbados</option>
                    <option value="BS">Bahamas</option>
                    <option value="BZ">Belize</option>
                    <option value="HT">Haiti</option>
                    <option value="CU">Cuba</option>
                    <option value="SG">Singapore</option>
                    <option value="MY">Malaysia</option>
                    <option value="TH">Thailand</option>
                    <option value="VN">Vietnam</option>
                    <option value="PH">Philippines</option>
                    <option value="ID">Indonesia</option>
                    <option value="KR">South Korea</option>
                    <option value="TW">Taiwan</option>
                    <option value="HK">Hong Kong</option>
                    <option value="MO">Macau</option>
                    <option value="NZ">New Zealand</option>
                  </select>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-[#1A1A1A] rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Order Summary</h3>
                
                {/* Currency Selector */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Currency *
                  </label>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFFFFF] focus:border-transparent transition-all duration-300"
                  >
                    {SUPPORTED_CURRENCIES.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.name} ({currency.symbol})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {customerInfo.country ? 
                      `Currency auto-selected for ${customerInfo.country}. You can change it manually.` : 
                      'Select a country to auto-select currency, or choose manually.'
                    }
                  </p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {subtotal > 0 && (
                    <div className="flex justify-between text-gray-400">
                      <span>Tax (8%)</span>
                      <span>{formatPrice(tax)}</span>
                    </div>
                  )}
                  <div className="border-t border-[#2A2A2A] pt-2 mt-2">
                    <div className="flex justify-between text-white font-bold">
                      <span>Total</span>
                      <span>{formatPrice(finalTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Proceed Button */}
              <button
                onClick={handleProceedToPayment}
                disabled={!isFormValid || isLoading || !stripeInstance}
                className="w-full bg-[#FFFFFF] hover:bg-[#FFFFFF]/90 text-black font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed glow-on-hover"
              >
                {isLoading ? 'Processing...' : (!stripeInstance ? 'Loading...' : (finalTotal <= 0 ? 'Place Free Order' : `Pay ${formatPrice(finalTotal)}`))}
              </button>
            </>
          ) : (
            <>
              {/* Payment Form - Always render when we have clientSecret */}
              {clientSecret ? (
                <Elements options={options} stripe={stripeInstance}>
                  <CheckoutForm 
                    clientSecret={clientSecret}
                    customerInfo={customerInfo}
                    items={items}
                    onSuccess={async (paymentData: any) => {
                      // Use the same order ID that was sent to Stripe metadata (used by webhook)
                      const finalOrderId = pendingOrderId || `Void_Order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                      
                      const completedOrderData = {
                        id: finalOrderId,
                        paymentIntentId: paymentData.paymentIntentId,
                        status: 'accepted' as const,
                        items: items.map(item => ({
                          ...item,
                          price: convertFromUSD(item.price, selectedCurrency)
                        })),
                        total: finalTotal,
                        customerInfo,
                        createdAt: new Date().toISOString(),
                        currency: selectedCurrency,
                        shippingCost: convertFromUSD(shippingCostUSD, selectedCurrency),
                        tax,
                        totalUSD: finalTotalUSD,
                      };
                      
                      // Save to Firebase after successful payment
                      try {
                        if (db) {
                          await setDoc(doc(db, 'orders', finalOrderId), {
                            ...completedOrderData,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                          });
                        }
                      } catch (error) {
                        console.error('Error saving paid order to Firebase:', error);
                      }
                      
                      addOrder(completedOrderData);
                      
                      // Send confirmation email
                      try {
                        await fetch('/api/send-order-email', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            email: customerInfo.email,
                            orderId: finalOrderId,
                            customerName: customerInfo.name,
                            total: finalTotal,
                            currency: selectedCurrency,
                          }),
                        });
                      } catch (emailError) {
                        console.error('Error sending order email:', emailError);
                      }
                      
                      clearCart();
                      setCompletedOrder(completedOrderData);
                      setOrderProcessed(true);
                      setShowSuccessModal(true);
                      onClose();
                    }}
                    onError={(error: string) => {
                      console.error('Payment error:', error);
                      alert(`Payment failed: ${error}`);
                    }}
                    total={finalTotal}
                    currency={selectedCurrency}
                  />
                </Elements>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400">Preparing payment...</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )}

      {/* Order Success Modal - Persists even when checkout modal closes */}
      <OrderSuccessModal
        isOpen={showSuccessModal && orderProcessed}
        onClose={() => {
          setShowSuccessModal(false);
          setCompletedOrder(null);
          setOrderProcessed(false);
          // Reset checkout modal state
          setCustomerInfo({
            name: '',
            email: '',
            address: '',
            city: '',
            zipCode: '',
            phone: '',
            country: '',
            discordUsername: '',
          });
          setShowPayment(false);
          setClientSecret('');
        }}
        order={completedOrder}
      />
    </>
  );
}