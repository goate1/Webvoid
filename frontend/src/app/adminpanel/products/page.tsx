"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { productService } from '@/lib/productService';
import { uploadService } from '@/lib/uploadService';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CloudArrowUpIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import GoogleDrivePicker from '@/components/GoogleDrivePicker';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [productForm, setProductForm] = useState({
    name: '',
    price: 0,
    salePrice: 0,
    onSale: false,
    image: '', // Primary image
    images: [] as string[], // Array of additional images
    hoverImage: '',
    category: '',
    description: '',
    link: '',
    displayOnHomePage: false,
    countryPrices: {} as { [countryCode: string]: number }
  });

  // State for managing country-specific pricing
  const [newCountryCode, setNewCountryCode] = useState('');
  const [newCountryPrice, setNewCountryPrice] = useState(0);

  // Helper functions for country pricing management
  const addCountryPrice = () => {
    if (newCountryCode.trim() && newCountryPrice > 0) {
      setProductForm(prev => ({
        ...prev,
        countryPrices: {
          ...prev.countryPrices,
          [newCountryCode.toUpperCase()]: newCountryPrice
        }
      }));
      setNewCountryCode('');
      setNewCountryPrice(0);
    }
  };

  const removeCountryPrice = (countryCode: string) => {
    setProductForm(prev => {
      const newCountryPrices = { ...prev.countryPrices };
      delete newCountryPrices[countryCode.toUpperCase()];
      return {
        ...prev,
        countryPrices: newCountryPrices
      };
    });
  };

  // Product customization state
  const [selectedProductForCustomization, setSelectedProductForCustomization] = useState<any>(null);
  const [customizationForm, setCustomizationForm] = useState<{
    hasCustomFields: boolean;
    hasSizes: boolean;
    customFields: any[];
    sizes: any[];
  }>({
    hasCustomFields: false,
    hasSizes: false,
    customFields: [],
    sizes: []
  });

  // Refs for file inputs
  const imageFileRef = useRef<HTMLInputElement>(null);
  const hoverImageFileRef = useRef<HTMLInputElement>(null);
  const additionalImageFileRef = useRef<HTMLInputElement>(null);

  // Drag-over state for each drop zone
  const [imageDragging, setImageDragging] = useState(false);
  const [hoverDragging, setHoverDragging] = useState(false);
  const [additionalDragging, setAdditionalDragging] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const all = await productService.getAll();
      setProducts(all);
    } catch (e) {
      console.error('Error loading products:', e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedProductForCustomization) {
      setCustomizationForm({
        hasCustomFields: selectedProductForCustomization.hasCustomFields || false,
        hasSizes: selectedProductForCustomization.hasSizes || false,
        customFields: selectedProductForCustomization.customFields || [],
        sizes: selectedProductForCustomization.sizes || []
      });
    }
  }, [selectedProductForCustomization]);

  const handleUpdateProductCustomization = async () => {
    if (!selectedProductForCustomization) return;

    try {
      await productService.update(selectedProductForCustomization.id!, {
        hasCustomFields: customizationForm.hasCustomFields,
        hasSizes: customizationForm.hasSizes,
        customFields: customizationForm.hasCustomFields ? customizationForm.customFields : undefined,
        sizes: customizationForm.hasSizes ? customizationForm.sizes : undefined
      });

      // Reload products to reflect changes
      await loadProducts();
      setSelectedProductForCustomization(null);

      alert('Product customization updated successfully!');
    } catch (error) {
      console.error('Error updating product customization:', error);
      alert('Failed to update product customization');
    }
  };

  const resetProductForm = () => {
    setProductForm({ name: '', price: 0, salePrice: 0, onSale: false, image: '', images: [], hoverImage: '', category: '', description: '', link: '', displayOnHomePage: false, countryPrices: {} });
    setEditingProduct(null);
    // Reset file inputs
    if (imageFileRef.current) imageFileRef.current.value = '';
    if (hoverImageFileRef.current) hoverImageFileRef.current.value = '';
    if (additionalImageFileRef.current) additionalImageFileRef.current.value = '';
  };

  const addImage = (imageUrl: string) => {
    setProductForm(prev => ({
      ...prev,
      images: [...(prev.images || []), imageUrl]
    }));
  };

  const removeImage = (index: number) => {
    setProductForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleAdditionalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const downloadURL = await uploadService.uploadProductImage(file);
      addImage(downloadURL);
    } catch (error) {
      console.error('Error uploading additional image:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to upload image: ${errorMsg}\n\n💡 Tip: Use the Image URL field above instead! Upload to Imgur (imgur.com) and paste the direct image URL.`);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const downloadURL = await uploadService.uploadProductImage(file);
      setProductForm(prev => ({ ...prev, image: downloadURL }));
    } catch (error) {
      console.error('Error uploading product image:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to upload image: ${errorMsg}\n\n💡 Tip: Use the Image URL field above instead! Upload to Imgur (imgur.com) and paste the direct image URL.`);
    }
  };

  const handleHoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const downloadURL = await uploadService.uploadProductImage(file);
      setProductForm(prev => ({ ...prev, hoverImage: downloadURL || '' }));
    } catch (error) {
      console.error('Error uploading hover image:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to upload hover image: ${errorMsg}\n\n💡 Tip: Use the Hover Image URL field above instead! Upload to Imgur (imgur.com) and paste the direct image URL.`);
    }
  };

  const submitProduct = async () => {
    try {
      if (editingProduct?.id) {
        await productService.update(editingProduct.id, { ...productForm });
      } else {
        await productService.create({ ...productForm });
      }
      await loadProducts();
      resetProductForm();
    } catch (e) {
      console.error('Error saving product:', e);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await productService.remove(id);
      await loadProducts();
    } catch (e) {
      console.error('Error deleting product:', e);
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const filteredProducts = searchTerm 
    ? products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  const productRequiredMissing = !productForm.name || !productForm.category || productForm.price < 0;
  
  // Count how many products are set to display on home page
  const homePageDisplayCount = products.filter(p => p.displayOnHomePage).length;
  const maxHomePageItems = 5;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Products Management</h1>
          <p className="text-gray-400 mt-1">Manage shop products and inventory</p>
        </div>
        <button 
          onClick={resetProductForm}
          className="bg-[#FFFFFF] hover:bg-[#FFFFFF]/90 text-black font-medium py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products by name, category or description..."
            className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFFFFF] focus:border-transparent transition-all duration-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products List */}
        <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] overflow-hidden">
          <div className="p-4 border-b border-[#2A2A2A]">
            <h2 className="text-xl font-semibold text-white">Products</h2>
          </div>
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FFFFFF] mx-auto mb-2"></div>
                <p>Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p>No products found</p>
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {filteredProducts.map((product) => {
                  const isChecked = product.displayOnHomePage || false;
                  const isDisabled = !isChecked && homePageDisplayCount >= maxHomePageItems;
                  
                  return (
                    <div key={product.id ?? product.name} className="p-4 rounded-lg border border-[#3A3A3A] hover:bg-[#2A2A2A] transition-all duration-300">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-white font-semibold truncate">{product.name}</h3>
                            <label className="relative flex items-center group cursor-pointer">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={isDisabled}
                                  onChange={async (e) => {
                                    if (!product.id) return;
                                    const newValue = e.target.checked;
                                    if (newValue && homePageDisplayCount >= maxHomePageItems) return;
                                    try {
                                      await productService.update(product.id, { displayOnHomePage: newValue });
                                      await loadProducts();
                                    } catch (error) {
                                      console.error('Error updating product:', error);
                                    }
                                  }}
                                  className="sr-only"
                                />
                                <div className={`w-4 h-4 rounded border-2 transition-all flex items-center justify-center ${
                                  isDisabled 
                                    ? 'border-gray-600 bg-gray-700 cursor-not-allowed opacity-50' 
                                    : isChecked
                                    ? 'border-purple-500 bg-purple-500 cursor-pointer'
                                    : 'border-gray-400 bg-transparent cursor-pointer hover:border-purple-400'
                                }`}>
                                  {isChecked && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                {isDisabled && (
                                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-gray-700 shadow-lg">
                                    5 items is already checked
                                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                  </div>
                                )}
                              </div>
                              <span className={`ml-2 text-xs ${isDisabled ? 'text-gray-500 cursor-not-allowed' : 'text-gray-300'}`}>
                                Display on home page?
                              </span>
                            </label>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm truncate">{product.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex flex-col">
                            <span className="text-green-400 font-bold">
                              ${product.onSale && product.salePrice ? product.salePrice.toFixed(2) : product.price.toFixed(2)}
                            </span>
                            {product.onSale && product.salePrice && product.salePrice < product.price && (
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500 line-through text-sm">${product.price.toFixed(2)}</span>
                                <span className="text-red-400 text-xs font-bold">
                                  -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{product.category}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4 flex-shrink-0">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setProductForm({
                              name: product.name,
                              price: product.price,
                              salePrice: product.salePrice || 0,
                              onSale: product.onSale || false,
                              image: product.image,
                              images: product.images || [], // Load existing images array
                              hoverImage: product.hoverImage || '',
                              category: product.category,
                              description: product.description,
                              link: product.link,
                              displayOnHomePage: product.displayOnHomePage || false,
                              countryPrices: product.countryPrices || {}
                            });
                          }}
                          className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-blue-400/10 transition-all duration-300"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedProductForCustomization(product)}
                          className="text-purple-400 hover:text-purple-300 p-1 rounded hover:bg-purple-400/10 transition-all duration-300"
                          title="Configure Custom Fields & Sizes"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                          </svg>
                        </button>
                        {product.id && (
                          <button
                            onClick={() => setShowDeleteConfirm(product.id!)}
                            className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-400/10 transition-all duration-300"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Product Form */}
        <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] overflow-hidden">
          <div className="p-4 border-b border-[#2A2A2A]">
            <h2 className="text-xl font-semibold text-white">
              {editingProduct ? 'Edit Product' : 'Create Product'}
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input 
                value={productForm.name} 
                onChange={e=>setProductForm(p=>({...p,name:e.target.value}))} 
                placeholder="Product name" 
                className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFFFFF]" 
              />
              <input 
                type="number" 
                step="0.01" 
                value={productForm.price === 0 ? '' : productForm.price} 
                onChange={e=>setProductForm(p=>({...p,price:parseFloat(e.target.value)||0}))} 
                placeholder="Price" 
                className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFFFFF]" 
              />
              <div className="flex items-center gap-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2">
                <input
                  type="checkbox"
                  id="onSale"
                  checked={productForm.onSale}
                  onChange={e=>setProductForm(p=>({...p,onSale:e.target.checked}))}
                  className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                />
                <label htmlFor="onSale" className="text-sm text-gray-300 cursor-pointer">
                  On Sale
                </label>
              </div>
              {productForm.onSale && (
                <input 
                  type="number" 
                  step="0.01" 
                  value={productForm.salePrice === 0 ? '' : productForm.salePrice} 
                  onChange={e=>setProductForm(p=>({...p,salePrice:parseFloat(e.target.value)||0}))} 
                  placeholder="Sale Price" 
                  className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFFFFF]" 
                />
              )}
              <input 
                value={productForm.category} 
                onChange={e=>setProductForm(p=>({...p,category:e.target.value}))} 
                placeholder="Category" 
                className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFFFFF] md:col-span-2" 
              />
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Product Image URL</label>
                <input 
                  value={productForm.image} 
                  onChange={e=>setProductForm(p=>({...p,image:e.target.value}))} 
                  placeholder="Image URL" 
                  className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFFFFF]" 
                />
              </div>
              
              {/* File Upload / Drive for Product Image */}
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Or Upload Product Image</label>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="file"
                    ref={imageFileRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                    id="product-image-upload"
                  />
                  <label
                    htmlFor="product-image-upload"
                    className="flex items-center gap-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white px-3 py-2 rounded cursor-pointer transition-colors"
                  >
                    <CloudArrowUpIcon className="w-5 h-5" />
                    <span>Choose File</span>
                  </label>
                  <GoogleDrivePicker
                    label="Pick from Drive"
                    onSelect={(url) => setProductForm(p => ({ ...p, image: url }))}
                  />
                  <div
                    onDragOver={(e) => { e.preventDefault(); setImageDragging(true); }}
                    onDragLeave={() => setImageDragging(false)}
                    onDrop={async (e) => {
                      e.preventDefault();
                      setImageDragging(false);
                      const file = e.dataTransfer.files[0];
                      if (!file || !file.type.startsWith('image/')) return;
                      try {
                        const url = await uploadService.uploadProductImage(file);
                        setProductForm(p => ({ ...p, image: url }));
                      } catch (err) {
                        alert(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
                      }
                    }}
                    className={`flex items-center gap-2 border-2 border-dashed rounded px-3 py-2 text-sm cursor-pointer transition-colors ${
                      imageDragging ? 'border-white bg-white/10 text-white' : 'border-[#3A3A3A] text-gray-500 hover:border-gray-400'
                    }`}
                  >
                    <CloudArrowUpIcon className="w-4 h-4" />
                    Drop here
                  </div>
                  <span className="text-gray-400 text-sm">
                    {imageFileRef.current?.files?.[0]?.name || ''}
                  </span>
                </div>
              </div>
              
              {productForm.image && (
                <div className="md:col-span-2">
                  <div className="bg-gray-700 w-full h-32 rounded-lg flex items-center justify-center">
                    <Image 
                      src={productForm.image} 
                      alt="Product preview" 
                      width={200}
                      height={128}
                      className="max-h-32 max-w-full object-contain rounded" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextSibling?.addEventListener('click', () => {
                          target.style.display = 'block';
                        });
                      }}
                    />
                    <span className="text-gray-400 text-sm">Image preview</span>
                  </div>
                </div>
              )}
              
              {/* Hover Image Section */}
              <div className="md:col-span-2">
                <label htmlFor="hoverImageUrl" className="block text-sm text-gray-400 mb-1">Hover Image URL (Optional)</label>
                <input 
                  id="hoverImageUrl"
                  type="text"
                  value={productForm.hoverImage ?? ''} 
                  onChange={e=>setProductForm(p=>({...p,hoverImage:e.target.value || ''}))} 
                  placeholder="Hover Image URL" 
                  className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FFFFFF] focus:border-[#FFFFFF]" 
                />
              </div>
              
              {/* File Upload / Drive for Hover Image */}
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Or Upload Hover Image</label>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="file"
                    ref={hoverImageFileRef}
                    onChange={handleHoverImageUpload}
                    accept="image/*"
                    className="hidden"
                    id="hover-image-upload"
                  />
                  <label
                    htmlFor="hover-image-upload"
                    className="flex items-center gap-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white px-3 py-2 rounded cursor-pointer transition-colors"
                  >
                    <CloudArrowUpIcon className="w-5 h-5" />
                    <span>Choose Hover Image</span>
                  </label>
                  <GoogleDrivePicker
                    label="Pick from Drive"
                    onSelect={(url) => setProductForm(p => ({ ...p, hoverImage: url }))}
                  />
                  <div
                    onDragOver={(e) => { e.preventDefault(); setHoverDragging(true); }}
                    onDragLeave={() => setHoverDragging(false)}
                    onDrop={async (e) => {
                      e.preventDefault();
                      setHoverDragging(false);
                      const file = e.dataTransfer.files[0];
                      if (!file || !file.type.startsWith('image/')) return;
                      try {
                        const url = await uploadService.uploadProductImage(file);
                        setProductForm(p => ({ ...p, hoverImage: url }));
                      } catch (err) {
                        alert(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
                      }
                    }}
                    className={`flex items-center gap-2 border-2 border-dashed rounded px-3 py-2 text-sm cursor-pointer transition-colors ${
                      hoverDragging ? 'border-white bg-white/10 text-white' : 'border-[#3A3A3A] text-gray-500 hover:border-gray-400'
                    }`}
                  >
                    <CloudArrowUpIcon className="w-4 h-4" />
                    Drop here
                  </div>
                  <span className="text-gray-400 text-sm">
                    {hoverImageFileRef.current?.files?.[0]?.name || ''}
                  </span>
                </div>
              </div>
              
              {productForm.hoverImage && (
                <div className="md:col-span-2">
                  <div className="bg-gray-700 w-full h-32 rounded-lg flex items-center justify-center">
                    <Image 
                      src={productForm.hoverImage} 
                      alt="Hover image preview" 
                      width={200}
                      height={128}
                      className="max-h-32 max-w-full object-contain rounded" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextSibling?.addEventListener('click', () => {
                          target.style.display = 'block';
                        });
                      }}
                    />
                    <span className="text-gray-400 text-sm">Hover image preview</span>
                  </div>
                </div>
              )}
              
              {/* Additional Images Section */}
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Additional Images</label>
                <div className="space-y-2">
                  {/* Current Images */}
                  {productForm.images && productForm.images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {productForm.images.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <div className="bg-gray-700 w-full h-20 rounded-lg flex items-center justify-center overflow-hidden">
                            <Image
                              src={imageUrl}
                              alt={`Additional image ${index + 1}`}
                              width={80}
                              height={80}
                              className="max-h-20 max-w-full object-contain rounded"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextSibling?.addEventListener('click', () => {
                                  target.style.display = 'block';
                                });
                              }}
                            />
                            <span className="text-gray-400 text-xs">Image {index + 1}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove image"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Image Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Additional image URL"
                      className="flex-1 bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFFFFF]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = (e.target as HTMLInputElement).value.trim();
                          if (value) {
                            addImage(value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <input
                      type="file"
                      ref={additionalImageFileRef}
                      onChange={handleAdditionalImageUpload}
                      accept="image/*"
                      className="hidden"
                      id="additional-image-upload"
                    />
                    <label
                      htmlFor="additional-image-upload"
                      className="flex items-center gap-2 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white px-3 py-2 rounded cursor-pointer transition-colors text-sm"
                    >
                      <CloudArrowUpIcon className="w-4 h-4" />
                      Upload
                    </label>
                    <GoogleDrivePicker
                      label="Drive"
                      onSelect={(url) => addImage(url)}
                    />
                    <div
                      onDragOver={(e) => { e.preventDefault(); setAdditionalDragging(true); }}
                      onDragLeave={() => setAdditionalDragging(false)}
                      onDrop={async (e) => {
                        e.preventDefault();
                        setAdditionalDragging(false);
                        const file = e.dataTransfer.files[0];
                        if (!file || !file.type.startsWith('image/')) return;
                        try {
                          const url = await uploadService.uploadProductImage(file);
                          addImage(url);
                        } catch (err) {
                          alert(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
                        }
                      }}
                      className={`flex items-center gap-2 border-2 border-dashed rounded px-3 py-2 text-sm cursor-pointer transition-colors ${
                        additionalDragging ? 'border-white bg-white/10 text-white' : 'border-[#3A3A3A] text-gray-500 hover:border-gray-400'
                      }`}
                    >
                      <CloudArrowUpIcon className="w-4 h-4" />
                      Drop here
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Press Enter in the URL field to add an image, or use the upload button. Images will be displayed in the product detail page.
                  </p>
                </div>
              </div>
              <input 
                value={productForm.link} 
                onChange={e=>setProductForm(p=>({...p,link:e.target.value}))} 
                placeholder="Purchase link" 
                className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFFFFF] md:col-span-2" 
              />
              <textarea 
                value={productForm.description} 
                onChange={e=>setProductForm(p=>({...p,description:e.target.value}))} 
                placeholder="Description" 
                rows={3} 
                className="bg-[#0F0F0F] border border-[#2A2A2A] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFFFFF] md:col-span-2" 
              />
              <div className="md:col-span-2 flex items-center gap-2">
                <label className="relative flex items-center group cursor-pointer">
                  <input
                    type="checkbox"
                    id="displayOnHomePage"
                    checked={productForm.displayOnHomePage}
                    disabled={!productForm.displayOnHomePage && homePageDisplayCount >= maxHomePageItems}
                    onChange={(e) => {
                      if (e.target.checked && homePageDisplayCount >= maxHomePageItems) return;
                      setProductForm(p => ({ ...p, displayOnHomePage: e.target.checked }));
                    }}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border-2 transition-all flex items-center justify-center ${
                    !productForm.displayOnHomePage && homePageDisplayCount >= maxHomePageItems
                      ? 'border-gray-600 bg-gray-700 cursor-not-allowed opacity-50'
                      : productForm.displayOnHomePage
                      ? 'border-purple-500 bg-purple-500 cursor-pointer'
                      : 'border-gray-400 bg-transparent cursor-pointer hover:border-purple-400'
                  }`}>
                    {productForm.displayOnHomePage && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  {!productForm.displayOnHomePage && homePageDisplayCount >= maxHomePageItems && (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-gray-700 shadow-lg">
                      5 items is already checked
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </label>
                <label 
                  htmlFor="displayOnHomePage" 
                  className={`text-sm ${
                    !productForm.displayOnHomePage && homePageDisplayCount >= maxHomePageItems
                      ? 'text-gray-500 cursor-not-allowed'
                      : 'text-gray-300 cursor-pointer'
                  }`}
                >
                  Display on home page?
                </label>
                {!productForm.displayOnHomePage && homePageDisplayCount >= maxHomePageItems && (
                  <span className="text-xs text-gray-500">(5 items already selected)</span>
                )}
              </div>
            </div>
            
            {/* Dynamic Country-Specific Pricing */}
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Country-Specific Pricing (Optional)</label>
              <div className="space-y-2">
                {/* Display current country prices */}
                {Object.entries(productForm.countryPrices).map(([countryCode, price]) => (
                  <div key={countryCode} className="flex items-center justify-between bg-[#2A2A2A] p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{countryCode}</span>
                      <span className="text-green-400 font-bold">${price.toFixed(2)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCountryPrice(countryCode)}
                      className="text-red-400 hover:text-red-300 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                
                {/* Add new country price */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCountryCode}
                    onChange={(e) => setNewCountryCode(e.target.value.toUpperCase())}
                    placeholder="Country Code (e.g., SA, US, GB, DE, FR)"
                    className="w-24 bg-[#2A2A2A] border border-[#3A3A3A] rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FFFFFF]"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={newCountryPrice || ''}
                    onChange={(e) => setNewCountryPrice(parseFloat(e.target.value) || 0)}
                    placeholder="Price"
                    className="flex-1 bg-[#2A2A2A] border border-[#3A3A3A] rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FFFFFF]"
                  />
                  <button
                    type="button"
                    onClick={addCountryPrice}
                    disabled={!newCountryCode.trim() || newCountryPrice <= 0}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300"
                  >
                    Add Price
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Add unlimited country codes and their specific prices. Leave empty to use default price.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button 
                onClick={submitProduct} 
                disabled={productRequiredMissing} 
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 flex-1"
              >
                {editingProduct ? 'Update Product' : 'Create Product'}
              </button>
              <button 
                onClick={resetProductForm} 
                className="bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white font-medium py-2 px-4 rounded-lg transition-all duration-300"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customization Modal */}
      {selectedProductForCustomization && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A]">
              <h3 className="text-xl font-bold text-white">
                Configure: {selectedProductForCustomization.name}
              </h3>
              <button
                onClick={() => setSelectedProductForCustomization(null)}
                className="text-gray-400 hover:text-white p-1 rounded"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Sizes */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="hasSizes"
                    checked={customizationForm.hasSizes}
                    onChange={e => setCustomizationForm(prev => ({ ...prev, hasSizes: e.target.checked }))}
                    className="w-4 h-4 accent-purple-500"
                  />
                  <label htmlFor="hasSizes" className="text-white font-semibold cursor-pointer">
                    Enable Size Selection
                  </label>
                </div>

                {customizationForm.hasSizes && (
                  <div className="space-y-2 ml-7">
                    <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 px-1 mb-1">
                      <span className="col-span-4">Size Name</span>
                      <span className="col-span-3">Price +/-</span>
                      <span className="col-span-3">Available</span>
                      <span className="col-span-2" />
                    </div>
                    {customizationForm.sizes.map((size, idx) => (
                      <div key={size.id} className="grid grid-cols-12 gap-2 items-center bg-[#1A1A1A] p-2 rounded-lg">
                        <input
                          type="text"
                          value={size.name}
                          onChange={e => {
                            const updated = [...customizationForm.sizes];
                            updated[idx] = { ...updated[idx], name: e.target.value };
                            setCustomizationForm(prev => ({ ...prev, sizes: updated }));
                          }}
                          placeholder="e.g. S, M, XL"
                          className="col-span-4 bg-[#0F0F0F] border border-[#2A2A2A] rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <div className="col-span-3 flex items-center gap-1">
                          <span className="text-gray-500 text-sm">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={size.priceModifier || ''}
                            onChange={e => {
                              const updated = [...customizationForm.sizes];
                              updated[idx] = { ...updated[idx], priceModifier: parseFloat(e.target.value) || 0 };
                              setCustomizationForm(prev => ({ ...prev, sizes: updated }));
                            }}
                            placeholder="0.00"
                            className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                        <label className="col-span-3 flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={size.available}
                            onChange={e => {
                              const updated = [...customizationForm.sizes];
                              updated[idx] = { ...updated[idx], available: e.target.checked };
                              setCustomizationForm(prev => ({ ...prev, sizes: updated }));
                            }}
                            className="w-4 h-4 accent-purple-500"
                          />
                          <span className="text-sm text-gray-300">In stock</span>
                        </label>
                        <button
                          onClick={() => setCustomizationForm(prev => ({
                            ...prev,
                            sizes: prev.sizes.filter((_, i) => i !== idx)
                          }))}
                          className="col-span-2 text-red-400 hover:text-red-300 p-1 flex justify-center"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setCustomizationForm(prev => ({
                        ...prev,
                        sizes: [...prev.sizes, { id: Date.now().toString(), name: '', priceModifier: 0, available: true }]
                      }))}
                      className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-medium mt-2"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add Size
                    </button>
                  </div>
                )}
              </div>

              {/* Jersey / Custom Fields */}
              <div className="border-t border-[#2A2A2A] pt-4">
                <div className="flex items-center gap-3 mb-1">
                  <input
                    type="checkbox"
                    id="hasCustomFields"
                    checked={customizationForm.hasCustomFields}
                    onChange={e => setCustomizationForm(prev => ({ ...prev, hasCustomFields: e.target.checked }))}
                    className="w-4 h-4 accent-purple-500"
                  />
                  <label htmlFor="hasCustomFields" className="text-white font-semibold cursor-pointer">
                    Enable Jersey Custom Fields
                  </label>
                </div>
                <p className="text-xs text-gray-500 ml-7">
                  Adds Name on Back and Country Flag text inputs at checkout (auto-applied to jersey/kit products).
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-[#2A2A2A]">
                <button
                  onClick={handleUpdateProductCustomization}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setSelectedProductForCustomization(null)}
                  className="bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white font-medium py-2 px-4 rounded-lg transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl max-w-md w-full p-6 transform transition-all duration-300 scale-100">
            <div className="text-center">
              <div className="text-red-400 mb-4">
                <TrashIcon className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Product</h3>
              <p className="text-gray-400 mb-6">Are you sure you want to delete this product? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button 
                  onClick={()=>setShowDeleteConfirm(null)} 
                  className="flex-1 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white font-medium py-2 px-4 rounded-lg transition-all duration-300"
                >
                  Cancel
                </button>
                <button 
                  onClick={()=>{ if (showDeleteConfirm) deleteProduct(showDeleteConfirm); }} 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}