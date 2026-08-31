'use client';

import React, { useRef, useState, useEffect } from 'react';
import { FoodItem } from '@/lib/db';
import ProductCard from './ProductCard';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface SimilarProductsSliderProps {
  items: FoodItem[];
  onAddToCart: (item: FoodItem) => void;
}

export default function SimilarProductsSlider({ items, onAddToCart }: SimilarProductsSliderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  // Duplicate items array to achieve smooth infinite looping effect
  const displayItems = items.length > 0 ? [...items, ...items, ...items] : [];

  useEffect(() => {
    if (!isAutoScrolling || items.length === 0) return;

    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        // If reached end of infinite duplicate track, reset smoothly to middle
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollContainerRef.current.scrollLeft = scrollWidth / 3;
        } else {
          scrollContainerRef.current.scrollBy({ left: 280, behavior: 'smooth' });
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isAutoScrolling, items]);

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="w-full relative group">
      
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Recommended for You</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Similar <span className="text-emerald-400">Food Items</span>
          </h3>
        </div>

        {/* Carousel Slider Control Arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleScrollLeft}
            className="p-2.5 rounded-full bg-slate-900 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 transition-all focus:outline-none backdrop-blur-md shadow-lg"
            title="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleScrollRight}
            className="p-2.5 rounded-full bg-slate-900 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 transition-all focus:outline-none backdrop-blur-md shadow-lg"
            title="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Infinite Horizontal Sliding Track */}
      <div
        ref={scrollContainerRef}
        onMouseEnter={() => setIsAutoScrolling(false)}
        onMouseLeave={() => setIsAutoScrolling(true)}
        className="flex items-center gap-6 overflow-x-auto scrollbar-none py-4 px-1 scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {displayItems.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            className="snap-start shrink-0 w-[280px] sm:w-[300px]"
          >
            <ProductCard item={item} onAddToCart={onAddToCart} />
          </div>
        ))}
      </div>

    </div>
  );
}
