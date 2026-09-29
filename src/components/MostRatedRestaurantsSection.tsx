'use client';

import React, { useEffect, useState } from 'react';
import { Star, Store, MapPin, Sparkles, Utensils, Award } from 'lucide-react';
import type { MostRatedRestaurant } from '@/lib/complex-queries';

interface MostRatedRestaurantsSectionProps {
  onSelectRestaurant?: (restaurantId: number) => void;
  selectedRestaurantId?: number | null;
  refreshTrigger?: number;
}

export default function MostRatedRestaurantsSection({
  onSelectRestaurant,
  selectedRestaurantId,
  refreshTrigger,
}: MostRatedRestaurantsSectionProps) {
  const [restaurants, setRestaurants] = useState<MostRatedRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch('/api/restaurants?sort=rating&limit=6')
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.success) {
          setRestaurants(json.data || []);
        }
      })
      .catch((err) => console.error('Failed to fetch most rated restaurants:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  if (!loading && restaurants.length === 0) {
    return null;
  }

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>Highest Customer Satisfaction</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span>Most Rated Restaurants</span>
            <span className="text-amber-400 flex items-center gap-1 text-xl sm:text-2xl">
              <Star className="w-5 h-5 fill-amber-400" />
              <span>Top Rated</span>
            </span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
            Ranked by customer ratings and verified review counts across all served orders.
          </p>
        </div>

        {onSelectRestaurant && selectedRestaurantId !== null && (
          <button
            onClick={() => onSelectRestaurant?.(0)}
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors underline"
          >
            Show All Restaurants
          </button>
        )}
      </div>

      {/* Grid of Most Rated Restaurants */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 rounded-3xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {restaurants.map((rest, idx) => {
            const isSelected = selectedRestaurantId === rest.id;
            return (
              <div
                key={rest.id}
                onClick={() => onSelectRestaurant && onSelectRestaurant(rest.id)}
                className={`glass-card rounded-3xl p-5 border transition-all duration-300 relative group flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-amber-400/80 bg-slate-900/90 shadow-[0_0_30px_rgba(245,158,11,0.25)] scale-[1.02]'
                    : 'border-slate-800 hover:border-amber-500/40 hover:bg-slate-900/70'
                }`}
              >
                <div>
                  {/* Top Row: Rank Badge & Image */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-950 border border-emerald-500/25 flex-shrink-0 flex items-center justify-center">
                        {rest.image_url ? (
                          <img
                            src={rest.image_url}
                            alt={rest.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <Store className="w-7 h-7 text-emerald-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black tracking-wider uppercase border border-amber-500/30">
                            #{idx + 1} Rated
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1 mt-1">
                          {rest.name}
                        </h3>
                      </div>
                    </div>

                    {/* Rating Pill */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-extrabold text-sm shadow-md flex-shrink-0">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{Number(rest.rating).toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Categories */}
                  <p className="text-xs text-slate-300 line-clamp-1 mb-2 font-medium">
                    {rest.categories || 'Fast Food & Delights'}
                  </p>

                  {/* Address */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="truncate">{rest.address}</span>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Utensils className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{rest.total_dishes} dishes listed</span>
                  </div>
                  <span className="text-amber-400/90 font-semibold text-[11px]">
                    {rest.review_count > 0 ? `${rest.review_count} verified reviews` : 'Top Rated Partner'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
