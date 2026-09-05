'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FoodItem } from '@/lib/db';
import { useApp } from '@/context/AppContext';
import { ShoppingCart, Star, CheckCircle2, XCircle, Tag, Eye, Store } from 'lucide-react';

interface ProductCardProps {
  item: FoodItem;
  onAddToCart?: (item: FoodItem) => void;
}

export default function ProductCard({ item, onAddToCart }: ProductCardProps) {
  const { addToCart } = useApp();
  const [imgSrc, setImgSrc] = useState(
    item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'
  );

  const isAvailable = Boolean(item.is_available);
  const discountPercent = item.base_price > item.sale_price
    ? Math.round(((item.base_price - item.sale_price) / item.base_price) * 100)
    : 0;

  return (
    <div className="glass-card rounded-3xl overflow-hidden flex flex-col justify-between group relative min-w-[260px]">
      
      {/* Top Media Section */}
      <Link href={`/product/${item.id}`} className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-900 block">
        <img
          src={imgSrc}
          onError={() => setImgSrc('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80')}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>

        {/* Hover Quick View Overlay */}
        <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-all duration-300 flex items-center justify-center">
          <span className="px-4 py-2 rounded-full bg-slate-950/80 border border-emerald-400 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-xl">
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>View Details</span>
          </span>
        </div>

        {/* Category Pill */}
        <div className="absolute top-3 left-3 z-10">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-950/70 backdrop-blur-md border border-emerald-500/30 text-emerald-300 flex items-center gap-1 shadow-md">
            <Tag className="w-3 h-3 text-emerald-400" />
            {item.category}
          </span>
        </div>

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-3 right-3 z-10">
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-lg">
              -{discountPercent}% OFF
            </span>
          </div>
        )}

        {/* Rating Badge */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-emerald-500/20 text-xs font-bold text-white">
          <Star className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
          <span>{Number(item.rating).toFixed(1)}</span>
        </div>

        {/* Availability Badge */}
        <div className="absolute bottom-3 right-3 z-10">
          {isAvailable ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/50 backdrop-blur-md text-[11px] font-bold text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Available for Sale
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 backdrop-blur-md text-[11px] font-bold text-rose-300">
              <XCircle className="w-3 h-3 text-rose-400" />
              Out of Stock
            </span>
          )}
        </div>
      </Link>

      {/* Details & Pricing Section */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <Link href={`/product/${item.id}`}>
            <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
              {item.name}
            </h3>
          </Link>
          {item.restaurant_name && (
            <p className="text-[10px] font-semibold text-emerald-400/70 mt-0.5 flex items-center gap-1">
              <Store className="w-3 h-3" />
              {item.restaurant_name}
            </p>
          )}
          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Price Row */}
        <div className="flex items-center justify-between pt-2 border-t border-emerald-500/10">
          <div className="flex items-baseline gap-2">
            {/* Sale Price */}
            <span className="text-xl font-extrabold text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
              ৳{item.sale_price}
            </span>
            {/* Base Price in Strikethrough/Delete Mode */}
            {item.base_price > item.sale_price && (
              <del className="text-xs text-slate-500 font-medium decoration-rose-500/70">
                ৳{item.base_price}
              </del>
            )}
          </div>

          {/* Action Button */}
          <button
            disabled={!isAvailable}
            onClick={() => {
              if (onAddToCart) {
                onAddToCart(item);
              } else {
                addToCart(item, 1);
              }
            }}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all duration-300 ${
              isAvailable
                ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] active:scale-95'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{isAvailable ? 'Add' : 'Off'}</span>
          </button>
        </div>

      </div>

    </div>
  );
}
