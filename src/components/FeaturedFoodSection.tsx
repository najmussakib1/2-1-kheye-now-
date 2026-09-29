'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import type { FoodItem, TopOrderedFoodItem, MostRatedFoodItem, FeaturedFoodResponse } from '@/lib/db';
import {
  Trophy,
  Flame,
  Star,
  MapPin,
  ShoppingCart,
  Eye,
  Heart,
} from 'lucide-react';

interface FeaturedFoodSectionProps {
  onAddToCart?: (item: FoodItem) => void;
  refreshTrigger?: number;
}

export default function FeaturedFoodSection({
  onAddToCart,
  refreshTrigger,
}: FeaturedFoodSectionProps) {
  const { addToCart, user, isWishlisted, toggleWishlist, startPlaceOrderFlow } = useApp();

  const [activeTab, setActiveTab] = useState<'top5' | 'mostWishlisted' | 'mostRated'>('top5');
  const [selectedArea, setSelectedArea] = useState<string>('All');
  const [userArea, setUserArea] = useState<string | null>(null);
  const [availableAreas, setAvailableAreas] = useState<string[]>([
    'All',
    'Dhanmondi',
    'Gulshan',
    'Banani',
    'Mirpur',
    'Uttara',
  ]);

  const [top5Items, setTop5Items] = useState<TopOrderedFoodItem[]>([]);
  const [mostWishlistedItems, setMostWishlistedItems] = useState<FoodItem[]>([]);
  const [mostRatedItems, setMostRatedItems] = useState<MostRatedFoodItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch featured items
  const fetchFeaturedData = useCallback(async (areaToFetch: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (areaToFetch !== 'All') {
        params.set('area', areaToFetch);
      }
      if (user?.id) {
        params.set('userId', String(user.id));
      }

      const res = await fetch(`/api/food-items/featured?${params.toString()}`);
      const data: { success: boolean } & FeaturedFoodResponse = await res.json();

      if (data.success) {
        setTop5Items(data.top5MostOrdered || []);
        setMostWishlistedItems(data.mostWishlisted || []);
        setMostRatedItems(data.mostRated || []);

        if (data.userArea) {
          setUserArea(data.userArea);
        }

        if (data.availableAreas && data.availableAreas.length > 0) {
          setAvailableAreas(Array.from(new Set(['All', ...data.availableAreas])));
        }

        // If user has orders in an area and user hasn't explicitly picked one yet, auto-select it
        if (data.userArea && areaToFetch === 'INIT') {
          setSelectedArea(data.userArea);
        }
      }
    } catch (err) {
      console.error('Failed to fetch featured food data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    fetchFeaturedData('INIT');
  }, [fetchFeaturedData, refreshTrigger]);

  // Handle area change
  const handleAreaSelect = (area: string) => {
    setSelectedArea(area);
    fetchFeaturedData(area);
  };

  const handleItemAddToCart = (item: FoodItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(item);
    } else {
      addToCart(item, 1);
    }
  };

  const top1Item = top5Items.length > 0 ? top5Items[0] : null;
  const remainingTopItems = top5Items.slice(1, 5);

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Container */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          {/* Area Personalization Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3 shadow-lg shadow-emerald-950/40">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            {userArea && selectedArea === userArea ? (
              <span>Personalized for your area: <strong className="text-white font-extrabold">{userArea}</strong> (Based on your orders)</span>
            ) : selectedArea !== 'All' ? (
              <span>Popular in: <strong className="text-white font-extrabold">{selectedArea}</strong></span>
            ) : (
              <span>Dhaka City Wide Highlights</span>
            )}
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>What's Trending in</span>
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
              {selectedArea === 'All' ? 'Dhaka' : selectedArea}
            </span>
          </h2>
          <p className="mt-2 text-slate-400 text-sm sm:text-base max-w-2xl">
            {userArea && selectedArea === userArea
              ? `Curated based on your order history and favorite meals in ${userArea}.`
              : 'Explore the top most ordered dishes, viral favorites, and highest rated treats.'}
          </p>
        </div>

        {/* Area Pills Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md overflow-x-auto max-w-full">
          {availableAreas.map((area) => {
            const isSelected = selectedArea === area;
            const isUserPastArea = userArea === area;
            return (
              <button
                key={area}
                onClick={() => handleAreaSelect(area)}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-md shadow-emerald-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {area === 'All' ? 'All Areas' : area}
                {isUserPastArea && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-emerald-400 animate-ping'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Showcase Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-4 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('top5')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 ${
            activeTab === 'top5'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Trophy className={`w-4 h-4 ${activeTab === 'top5' ? 'text-amber-400' : 'text-slate-400'}`} />
          <span>Top 5 Most Ordered</span>
          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/30 text-amber-200 text-[10px] font-black">
            #{selectedArea === 'All' ? 'Dhaka' : selectedArea}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('mostWishlisted')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 ${
            activeTab === 'mostWishlisted'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Heart className={`w-4 h-4 ${activeTab === 'mostWishlisted' ? 'text-rose-400 fill-rose-400' : 'text-slate-400'}`} />
          <span>Most Wishlisted</span>
          <span className="px-1.5 py-0.5 rounded-md bg-rose-500/30 text-rose-200 text-[10px] font-black">
            ❤️
          </span>
        </button>

        <button
          onClick={() => setActiveTab('mostRated')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 ${
            activeTab === 'mostRated'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Star className={`w-4 h-4 ${activeTab === 'mostRated' ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span>Most Rated Products</span>
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/30 text-emerald-200 text-[10px] font-black">
            5.0 ★
          </span>
        </button>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          <div className="h-72 bg-slate-900/60 rounded-3xl border border-slate-800" />
          <div className="h-72 bg-slate-900/60 rounded-3xl border border-slate-800" />
          <div className="h-72 bg-slate-900/60 rounded-3xl border border-slate-800" />
        </div>
      ) : (
        <div>
          {/* TAB 1: TOP 5 MOST ORDERED ITEMS */}
          {activeTab === 'top5' && (
            <div className="space-y-6">
              {top1Item ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* Spotlight #1 Most Ordered Item Card */}
                  <div className="lg:col-span-6 relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-amber-500/40 shadow-[0_0_35px_rgba(245,158,11,0.15)] flex flex-col justify-between group">
                    {/* Top image with rank badges */}
                    <div className="relative h-64 sm:h-72 w-full overflow-hidden">
                      <img
                        src={top1Item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'}
                        alt={top1Item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                      {/* Rank #1 Crown Badge */}
                      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-500/40">
                        <Trophy className="w-4 h-4 fill-slate-950" />
                        <span>#1 Most Ordered</span>
                      </div>

                      {/* Order Count Stat */}
                      {top1Item.total_ordered > 0 && (
                        <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-500/40 text-amber-300 font-bold text-xs shadow-lg">
                          <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>{top1Item.total_ordered} orders served</span>
                        </div>
                      )}

                      {/* Category and Rating */}
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs">
                        <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-slate-300 font-medium">
                          {top1Item.category}
                        </span>
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-400 font-bold">
                          <Star className="w-3.5 h-3.5 fill-emerald-400" />
                          <span>{Number(top1Item.rating).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Details Section */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-baseline justify-between gap-4 mb-2">
                          <Link
                            href={`/product/${top1Item.id}`}
                            className="text-2xl font-black text-white hover:text-amber-400 transition-colors"
                          >
                            {top1Item.name}
                          </Link>
                        </div>
                        <p className="text-slate-400 text-sm line-clamp-2 mb-4">
                          {top1Item.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-4">
                        <div>
                          <div className="text-xs text-slate-400">Special Price</div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold text-amber-400">
                              ৳{top1Item.sale_price}
                            </span>
                            {top1Item.base_price > top1Item.sale_price && (
                              <span className="text-sm text-slate-500 line-through">
                                ৳{top1Item.base_price}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/product/${top1Item.id}`}
                            className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={(e) => handleItemAddToCart(top1Item, e)}
                            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-500/30"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>Add to Cart</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Remaining Ranked Items (#2, #3, #4, #5) */}
                  <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {remainingTopItems.map((item) => {
                      const wish = isWishlisted(item.id);
                      return (
                        <div
                          key={item.id}
                          className="glass-card rounded-2xl p-4 flex flex-col justify-between relative group hover:border-slate-700 transition-all duration-300"
                        >
                          <div>
                            {/* Card Media with Rank Badge */}
                            <div className="relative h-36 w-full rounded-xl overflow-hidden mb-3 bg-slate-900">
                              <img
                                src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                              {/* Rank Tag */}
                              <div className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-lg bg-slate-950/85 border border-slate-700 text-amber-300 font-extrabold text-xs flex items-center gap-1 shadow-md">
                                <span>#{item.rank}</span>
                              </div>

                              {/* Wishlist toggle */}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleWishlist(item.id);
                                }}
                                className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-slate-950/70 border border-slate-700 text-slate-400 hover:text-rose-400"
                              >
                                <Heart className={`w-3.5 h-3.5 ${wish ? 'fill-rose-400 text-rose-400' : ''}`} />
                              </button>

                              {/* Orders count */}
                              {item.total_ordered > 0 && (
                                <div className="absolute bottom-2 left-2 z-10 text-[10px] font-semibold text-amber-200/90 bg-slate-950/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Flame className="w-3 h-3 text-amber-400" />
                                  <span>{item.total_ordered} orders</span>
                                </div>
                              )}
                            </div>

                            {/* Food Title & Rating */}
                            <Link
                              href={`/product/${item.id}`}
                              className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1 block mb-1"
                            >
                              {item.name}
                            </Link>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                              <span className="flex items-center gap-0.5 text-emerald-400 font-semibold">
                                <Star className="w-3 h-3 fill-emerald-400" />
                                {Number(item.rating).toFixed(1)}
                              </span>
                              <span>•</span>
                              <span className="truncate">{item.category}</span>
                            </div>
                          </div>

                          {/* Price & Action */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-2">
                            <div>
                              <span className="text-base font-extrabold text-white">৳{item.sale_price}</span>
                              {item.base_price > item.sale_price && (
                                <span className="text-xs text-slate-500 line-through ml-1.5">
                                  ৳{item.base_price}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(e) => handleItemAddToCart(item, e)}
                              className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/30 transition-all active:scale-95"
                              title="Add to Cart"
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No order data recorded yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MOST WISHLISTED ITEMS */}
          {activeTab === 'mostWishlisted' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {mostWishlistedItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="glass-card rounded-2xl p-4 flex flex-col justify-between group hover:border-rose-500/40 transition-all duration-300 relative"
                >
                  <div>
                    <div className="relative h-44 w-full rounded-xl overflow-hidden mb-3 bg-slate-900">
                      <img
                        src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                      {/* Wishlist Rank Badge */}
                      <div className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-lg shadow-rose-900/40">
                        <Heart className="w-3 h-3 fill-white" />
                        <span>#{idx + 1} Wishlisted</span>
                      </div>

                      {/* Discount Badge */}
                      {item.discount_percentage && item.discount_percentage > 0 ? (
                        <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-black text-[10px]">
                          -{item.discount_percentage}%
                        </div>
                      ) : null}

                      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/80 text-emerald-400 font-bold text-xs">
                        <Star className="w-3 h-3 fill-emerald-400" />
                        <span>{Number(item.rating).toFixed(1)}</span>
                      </div>
                    </div>

                    <Link
                      href={`/product/${item.id}`}
                      className="text-base font-bold text-white group-hover:text-rose-400 transition-colors line-clamp-1 block mb-1"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <div>
                      <span className="text-lg font-extrabold text-white">৳{item.sale_price}</span>
                      {item.base_price > item.sale_price && (
                        <span className="text-xs text-slate-500 line-through ml-2">
                          ৳{item.base_price}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleItemAddToCart(item, e)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-500/20 to-pink-500/20 hover:from-rose-500 hover:to-pink-500 text-rose-300 hover:text-slate-950 border border-rose-500/30 text-xs font-bold transition-all active:scale-95"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Order</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: MOST RATED PRODUCTS */}
          {activeTab === 'mostRated' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {mostRatedItems.map((item) => (
                <div
                  key={item.id}
                  className="glass-card rounded-2xl p-4 flex flex-col justify-between group hover:border-emerald-500/40 transition-all duration-300 relative"
                >
                  <div>
                    <div className="relative h-44 w-full rounded-xl overflow-hidden mb-3 bg-slate-900">
                      <img
                        src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                      {/* Star Rating Badge */}
                      <div className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow-lg shadow-emerald-950/50">
                        <Star className="w-3.5 h-3.5 fill-slate-950" />
                        <span>{Number(item.rating).toFixed(1)} Rating</span>
                      </div>

                      {/* Review count badge */}
                      {item.review_count > 0 && (
                        <div className="absolute top-2 right-2 z-10 px-2 py-1 rounded-md bg-slate-950/80 border border-slate-700 text-emerald-300 text-[10px] font-semibold">
                          {item.review_count} {item.review_count === 1 ? 'review' : 'reviews'}
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/product/${item.id}`}
                      className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1 block mb-1"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <div>
                      <span className="text-lg font-extrabold text-white">৳{item.sale_price}</span>
                      {item.base_price > item.sale_price && (
                        <span className="text-xs text-slate-500 line-through ml-2">
                          ৳{item.base_price}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => handleItemAddToCart(item, e)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Order</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
