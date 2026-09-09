'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SimilarProductsSlider from '@/components/SimilarProductsSlider';
import { FoodItem, FoodAddon } from '@/lib/db';
import { useApp } from '@/context/AppContext';
import { 
  Star, 
  ShoppingCart, 
  Minus, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Clock, 
  Flame, 
  ShieldCheck, 
  Sparkles, 
  Utensils, 
  Share2, 
  Heart,
  Check,
  Layers,
} from 'lucide-react';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [item, setItem] = useState<FoodItem | null>(null);
  const [similarItems, setSimilarItems] = useState<FoodItem[]>([]);
  const [addons, setAddons] = useState<FoodAddon[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<FoodAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { addToCart, startPlaceOrderFlow, toggleWishlist, isWishlisted } = useApp();

  useEffect(() => {
    async function fetchProductDetails() {
      setLoading(true);
      try {
        const [foodRes, addonRes] = await Promise.all([
          fetch(`/api/food-items/${productId}`),
          fetch(`/api/addons?food_id=${productId}`),
        ]);
        const foodJson = await foodRes.json();
        const addonJson = await addonRes.json();

        if (foodJson.success) {
          setItem(foodJson.data);
          setSimilarItems(foodJson.similarItems || []);
        }
        if (addonJson.success) {
          setAddons(addonJson.data || []);
        }
      } catch (err) {
        console.error('Error fetching product detail or addons:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProductDetails();
  }, [productId]);

  const toggleAddon = (addon: FoodAddon) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      }
      return [...prev, addon];
    });
  };

  const handleAddToCart = (food: FoodItem, count = 1) => {
    addToCart(food, count, selectedAddons);
  };

  const handleOrderNowClick = () => {
    if (!item) return;
    startPlaceOrderFlow({ directItem: item, directQuantity: quantity, selectedAddons });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-32 w-full">
          <div className="animate-pulse grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-6 h-[450px] bg-slate-900/60 rounded-3xl"></div>
            <div className="lg:col-span-6 space-y-6">
              <div className="h-8 bg-slate-900/60 rounded-xl w-3/4"></div>
              <div className="h-4 bg-slate-900/60 rounded-xl w-1/2"></div>
              <div className="h-24 bg-slate-900/60 rounded-2xl w-full"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-32 flex flex-col items-center justify-center text-center">
          <Utensils className="w-16 h-16 text-emerald-500/40 mb-4" />
          <h2 className="text-2xl font-bold text-white">Food Item Not Found</h2>
          <p className="text-slate-400 text-sm mt-2">The requested food item does not exist or has been removed.</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Menu</span>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const isAvailable = Boolean(item.is_available);
  const discountPercent = item.base_price > item.sale_price
    ? Math.round(((item.base_price - item.sale_price) / item.base_price) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Glassmorphism Header Navbar */}
      <Navbar />

      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-8">
            <Link href="/" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Menu</span>
            </Link>
            <span>/</span>
            <span className="text-emerald-400/90">{item.category}</span>
            <span>/</span>
            <span className="text-slate-200 line-clamp-1">{item.name}</span>
          </div>

          {/* Main Product Showcase Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            
            {/* LEFT SIDE: Big Product Image Showcase */}
            <div className="lg:col-span-6 space-y-4">
              <div className="glass-panel p-4 rounded-3xl relative overflow-hidden group shadow-2xl border border-emerald-500/25">
                
                {/* Big Image Container */}
                <div className="relative h-[380px] sm:h-[450px] w-full rounded-2xl overflow-hidden bg-slate-950">
                  <img
                    src={selectedImage || item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000&auto=format&fit=crop&q=80'}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>

                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-300 shadow-lg">
                      {item.category}
                    </span>
                    {discountPercent > 0 && (
                      <span className="px-3 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-lg">
                        -{discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  {/* Top Right Action Icons */}
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                    <button
                      onClick={() => toggleWishlist(item.id)}
                      className={`p-2.5 rounded-full backdrop-blur-md border transition-all ${
                        isWishlisted(item.id)
                          ? 'bg-rose-500/30 border-rose-400/60 text-rose-400'
                          : 'bg-slate-950/70 border-emerald-500/30 text-emerald-300 hover:text-rose-400 hover:border-rose-400/50'
                      }`}
                      aria-label={isWishlisted(item.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <Heart className={`w-4 h-4 ${isWishlisted(item.id) ? 'fill-rose-400' : ''}`} />
                    </button>
                    <button className="p-2.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-emerald-500/30 text-emerald-300 hover:text-white transition-all">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Bottom Guarantee Banner */}
                  <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Hygiene & Quality Checked</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      ⚡ 25 Min Express
                    </span>
                  </div>
                </div>

                {/* Thumbnail Strip (only shows when there are multiple images) */}
                {item.images && item.images.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-none">
                    {item.images.map((src, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(src)}
                        className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                          (selectedImage || item.image_url) === src
                            ? 'border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                            : 'border-slate-700 hover:border-emerald-500/60'
                        }`}
                      >
                        <img src={src} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Restaurant Branding Card */}
              {(item.restaurant_name || item.restaurant_logo) && (
                <div className="p-4 rounded-2xl border border-emerald-500/20 bg-slate-900/60 backdrop-blur-md flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.restaurant_logo ? (
                      <img src={item.restaurant_logo} alt={item.restaurant_name || 'Restaurant'} className="w-full h-full object-cover" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-slate-950" />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Served by</p>
                    <p className="text-sm font-bold text-white">{item.restaurant_name || 'Restaurant'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT SIDE: Product Information, Ratings & Ordering */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Category & Status Row */}
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{item.category}</span>
                </span>

                {isAvailable ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-xs font-bold text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Available for Sale
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-xs font-bold text-rose-300">
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  {item.name}
                </h1>
                <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* 5-Star Food Item Rating Section */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-emerald-500/20 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-5 h-5 fill-emerald-400 text-emerald-400" />
                    ))}
                  </div>
                  <span className="text-base font-extrabold text-white">5.0</span>
                </div>
                <div className="text-xs text-slate-400 font-semibold">
                  Based on <span className="text-emerald-300 font-bold">128 Customer Reviews</span>
                </div>
              </div>

              {/* Add-ons & Customizations Section */}
              {addons.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Choose Add-ons & Extras:</span>
                    </label>
                    <span className="text-[11px] text-emerald-400 font-semibold">
                      {selectedAddons.length} selected
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {addons.map((addon) => {
                      const isSelected = selectedAddons.some((a) => a.id === addon.id);

                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => toggleAddon(addon)}
                          className={`p-2.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all duration-200 group ${
                            isSelected
                              ? 'bg-emerald-500/15 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                              : 'bg-slate-900/60 border-emerald-500/20 hover:border-emerald-500/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Addon Picture Thumbnail */}
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-950 border border-emerald-500/30 flex-shrink-0">
                              {addon.image_url ? (
                                <img src={addon.image_url} alt={addon.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-emerald-400">
                                  +৳
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{addon.name}</p>
                              <p className="text-xs font-black text-emerald-400 mt-0.5">+৳{addon.price}</p>
                            </div>
                          </div>

                          {/* Checkbox Indicator */}
                          <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 ${
                            isSelected
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                              : 'border-slate-700 bg-slate-950 text-transparent'
                          }`}>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pricing Section (Shows base price + selected add-ons) */}
              <div className="flex items-baseline gap-3 pt-2">
                <span className="text-4xl font-black text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]">
                  ৳{item.sale_price + selectedAddons.reduce((sum, a) => sum + Number(a.price), 0)}
                </span>

                {selectedAddons.length > 0 && (
                  <span className="text-xs font-semibold text-emerald-300/90 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                    Includes ৳{selectedAddons.reduce((sum, a) => sum + Number(a.price), 0)} add-ons
                  </span>
                )}

                {item.base_price > item.sale_price && (
                  <del className="text-xl text-slate-500 font-bold decoration-rose-500/70">
                    ৳{item.base_price}
                  </del>
                )}
              </div>

              {/* Quantity Selector Section */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  Select Item Quantity:
                </label>
                <div className="flex items-center gap-4">
                  <div className="inline-flex items-center rounded-2xl bg-slate-900 border border-emerald-500/30 p-1">
                    <button
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      className="p-2.5 rounded-xl text-emerald-400 hover:bg-emerald-500/20 transition-all focus:outline-none"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center text-lg font-bold text-white">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((prev) => prev + 1)}
                      className="p-2.5 rounded-xl text-emerald-400 hover:bg-emerald-500/20 transition-all focus:outline-none"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <span className="text-xs text-slate-400 font-medium">
                    Total: <strong className="text-emerald-300 font-bold text-base">
                      ৳{(item.sale_price + selectedAddons.reduce((sum, a) => sum + Number(a.price), 0)) * quantity}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Add to Cart & Order Now Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                {/* Add to Cart Button */}
                <button
                  disabled={!isAvailable}
                  onClick={() => handleAddToCart(item, quantity)}
                  className={`flex-1 min-w-[180px] py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-300 ${
                    isAvailable
                      ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart ({quantity})</span>
                </button>

                {/* Order Now Button */}
                <button
                  onClick={handleOrderNowClick}
                  className="flex-1 min-w-[180px] py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                >
                  <Flame className="w-4 h-4 text-slate-950 fill-slate-950" />
                  <span>Order Now</span>
                </button>
              </div>

              {/* Key Features Bullet List */}
              <div className="pt-6 border-t border-emerald-500/15 grid grid-cols-2 gap-4 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Prepared in 15-20 mins</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>100% Fresh Ingredients</span>
                </div>
              </div>

            </div>

          </div>

          {/* INFINITE SLIDING SIMILAR PRODUCTS SECTION */}
          {similarItems.length > 0 && (
            <div className="mt-24 pt-12 border-t border-emerald-500/20">
              <SimilarProductsSlider
                items={similarItems}
                onAddToCart={(food) => handleAddToCart(food, 1)}
              />
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}
