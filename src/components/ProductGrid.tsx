'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { FoodItem } from '@/lib/db';
import ProductCard from './ProductCard';
import { Search, Utensils, Sparkles, Filter, Store, Star } from 'lucide-react';

interface Restaurant {
  id: number;
  name: string;
  image_url: string | null;
  rating?: number;
  categories?: string;
  address?: string;
}

interface ProductGridProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onAddToCart: (item: FoodItem) => void;
  refreshTrigger?: number;
}

export default function ProductGrid({
  selectedCategory,
  onSelectCategory,
  onAddToCart,
  refreshTrigger,
}: ProductGridProps) {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);

  const categories = ['All', 'Burgers', 'Pizza', 'Desi Feast', 'Pasta', 'Beverages', 'Juice', 'Desserts'];

  // Fetch restaurants for filter pills
  const fetchRestaurants = useCallback(() => {
    fetch('/api/restaurants')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setRestaurants(json.data || []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants, refreshTrigger]);

  const fetchItems = async (category: string, restaurantId: number | null, search: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== 'All') params.set('category', category);
      if (restaurantId !== null) params.set('restaurant_id', String(restaurantId));
      if (search.trim()) params.set('search', search.trim());

      const url = `/api/food-items${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch food items:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when category or restaurant filter changes or ratings updated
  useEffect(() => {
    fetchItems(selectedCategory, selectedRestaurantId, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedRestaurantId, refreshTrigger]);

  // Client-side search filter (instant, no API call) — API-side search is also available
  const filteredItems = searchQuery.trim()
    ? items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.restaurant_name && item.restaurant_name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : items;

  return (
    <section id="menu" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fresh & Hot Menu</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Delicious Dishes for <span className="text-emerald-400">Instant Delivery</span>
          </h2>
          <p className="text-slate-400 text-sm mt-2 max-w-xl">
            Explore our mouth-watering collection of freshly prepared meals delivered straight to your door.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[260px] sm:min-w-[320px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dishes or restaurants..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-900/80 border border-emerald-500/30 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all backdrop-blur-md"
          />
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-4">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1 pr-2">
          <Filter className="w-3.5 h-3.5 text-emerald-400" />
          <span>Category:</span>
        </span>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105'
                  : 'bg-slate-900/60 border border-emerald-500/20 text-emerald-300/80 hover:border-emerald-400/60 hover:text-white'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Restaurant Filter Pills */}
      {restaurants.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-10">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 pr-2">
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            <span>Restaurant:</span>
          </span>
          {/* All restaurants pill */}
          <button
            onClick={() => setSelectedRestaurantId(null)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 ${
              selectedRestaurantId === null
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105'
                : 'bg-slate-900/60 border border-emerald-500/20 text-emerald-300/80 hover:border-emerald-400/60 hover:text-white'
            }`}
          >
            All Restaurants
          </button>
          {restaurants.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRestaurantId(r.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 flex items-center gap-2 ${
                selectedRestaurantId === r.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105'
                  : 'bg-slate-900/60 border border-emerald-500/20 text-emerald-300/80 hover:border-emerald-400/60 hover:text-white'
              }`}
            >
              {r.image_url && (
                <img src={r.image_url} alt={r.name} className="w-4 h-4 rounded-full object-cover" />
              )}
              <span>{r.name}</span>
              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black ${
                selectedRestaurantId === r.id ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-400/15 text-amber-300'
              }`}>
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                <span>{Number(r.rating || 4.8).toFixed(1)}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Selected Restaurant Rating Showcase Banner */}
      {selectedRestaurantId && (() => {
        const selectedRestaurant = restaurants.find((r) => r.id === selectedRestaurantId);
        if (!selectedRestaurant) return null;
        return (
          <div className="mb-8 p-4 sm:p-5 rounded-3xl bg-slate-900/70 border border-emerald-500/30 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300 shadow-xl">
            <div className="flex items-center gap-3.5">
              {selectedRestaurant.image_url ? (
                <img
                  src={selectedRestaurant.image_url}
                  alt={selectedRestaurant.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-emerald-500/30 shadow-md"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Store className="w-7 h-7 text-emerald-400" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-white">{selectedRestaurant.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Partner Restaurant
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedRestaurant.categories || 'Fast Food, Drinks & Snacks'}
                </p>
                {selectedRestaurant.address && (
                  <p className="text-[11px] text-slate-500 mt-0.5">{selectedRestaurant.address}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-emerald-500/25 sm:self-center">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="text-xl font-black text-white">
                  {Number(selectedRestaurant.rating || 4.8).toFixed(1)}
                </span>
              </div>
              <div className="text-left pr-2">
                <p className="text-xs font-bold text-white">Restaurant Rating</p>
                <p className="text-[10px] text-emerald-300">Average of all menu foods</p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-80 rounded-3xl bg-slate-900/40 border border-slate-800 animate-pulse p-4"></div>
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <ProductCard key={item.id} item={item} onAddToCart={onAddToCart} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-3xl bg-slate-950/60 border border-emerald-500/20 backdrop-blur-md">
          <Utensils className="w-12 h-12 text-emerald-500/40 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No food items found</h3>
          <p className="text-slate-400 text-sm mt-1">Try selecting another category or resetting search query.</p>
          <button
            onClick={() => {
              onSelectCategory('All');
              setSearchQuery('');
              setSelectedRestaurantId(null);
            }}
            className="mt-4 px-5 py-2 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-bold hover:bg-emerald-500 hover:text-slate-950 transition-all"
          >
            Show All Foods
          </button>
        </div>
      )}

    </section>
  );
}
