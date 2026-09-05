'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SimilarProductsSlider from '@/components/SimilarProductsSlider';
import { FoodItem } from '@/lib/db';
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
  Check
} from 'lucide-react';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [item, setItem] = useState<FoodItem | null>(null);
  const [similarItems, setSimilarItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, startPlaceOrderFlow } = useApp();

  useEffect(() => {
    async function fetchProductDetails() {
      setLoading(true);
      try {
        const res = await fetch(`/api/food-items/${productId}`);
        const json = await res.json();
        if (json.success) {
          setItem(json.data);
          setSimilarItems(json.similarItems || []);
        }
      } catch (err) {
        console.error('Error fetching product detail:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProductDetails();
  }, [productId]);

  const handleAddToCart = (food: FoodItem, count = 1) => {
    addToCart(food, count);
  };

  const handleOrderNowClick = () => {
    if (!item) return;
    startPlaceOrderFlow({ directItem: item, directQuantity: quantity });
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
                    src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000&auto=format&fit=crop&q=80'}
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
                    <button className="p-2.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-emerald-500/30 text-emerald-300 hover:text-rose-400 hover:border-rose-400/50 transition-all">
                      <Heart className="w-4 h-4" />
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

              </div>
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

              {/* Pricing Section (No "Base Price" text, only sale price and base price in delete mode) */}
              <div className="flex items-baseline gap-3 pt-2">
                <span className="text-4xl font-black text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]">
                  ৳{item.sale_price}
                </span>

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
                    Total: <strong className="text-emerald-300 font-bold text-sm">৳{item.sale_price * quantity}</strong>
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

                {/* Order Now Button (Non-functional stub as requested) */}
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
