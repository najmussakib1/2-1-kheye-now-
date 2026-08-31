'use client';

import React, { useState, useEffect } from 'react';
import { FoodItem } from '@/lib/db';
import ProductCard from './ProductCard';
import { Search, Utensils, Sparkles, Filter } from 'lucide-react';

interface ProductGridProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onAddToCart: (item: FoodItem) => void;
}

export default function ProductGrid({
  selectedCategory,
  onSelectCategory,
  onAddToCart,
}: ProductGridProps) {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Burgers', 'Pizza', 'Desi Feast', 'Pasta', 'Beverages', 'Desserts'];

  const fetchItems = async (category: string) => {
    setLoading(true);
    try {
      const url = category === 'All' 
        ? '/api/food-items' 
        : `/api/food-items?category=${encodeURIComponent(category)}`;
      
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

  useEffect(() => {
    fetchItems(selectedCategory);
  }, [selectedCategory]);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            placeholder="Search burgers, biryani, pizza..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-900/80 border border-emerald-500/30 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all backdrop-blur-md"
          />
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-10">
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
