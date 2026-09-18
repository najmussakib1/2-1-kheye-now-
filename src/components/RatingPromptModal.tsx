'use client';

import React, { useState } from 'react';
import { Star, X, Check, Sparkles, Utensils, Store, ArrowRight, ThumbsUp } from 'lucide-react';
import type { PendingRatingOrder } from '@/lib/db';

interface RatingPromptModalProps {
  order: PendingRatingOrder;
  isOpen: boolean;
  onClose: () => void;
  onRatingSubmitted: (newRestaurantRating: number) => void;
}

export default function RatingPromptModal({
  order,
  isOpen,
  onClose,
  onRatingSubmitted,
}: RatingPromptModalProps) {
  // Map of food_id -> rating (default 5 for each food item)
  const [ratings, setRatings] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    order.items.forEach((item) => {
      initial[item.food_id] = 5;
    });
    return initial;
  });

  // Map of food_id -> hover rating
  const [hoverRatings, setHoverRatings] = useState<Record<number, number>>({});

  // Map of food_id -> review comment
  const [reviews, setReviews] = useState<Record<number, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{
    restaurantName: string;
    previousRating: number;
    newRating: number;
    updatedFoods: { foodId: number; foodName: string; newRating: number }[];
  } | null>(null);

  if (!isOpen) return null;

  const handleSetRating = (foodId: number, val: number) => {
    setRatings((prev) => ({ ...prev, [foodId]: val }));
  };

  const handleSetHover = (foodId: number, val: number) => {
    setHoverRatings((prev) => ({ ...prev, [foodId]: val }));
  };

  const handleSetAllFiveStars = () => {
    const allFive: Record<number, number> = {};
    order.items.forEach((it) => {
      allFive[it.food_id] = 5;
    });
    setRatings(allFive);
  };

  const getRatingLabel = (val: number) => {
    switch (val) {
      case 1:
        return 'Needs Improvement';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent!';
      default:
        return `${val} Stars`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        orderId: order.id,
        ratings: order.items.map((it) => ({
          food_id: it.food_id,
          rating: ratings[it.food_id] || 5,
          review_text: reviews[it.food_id] || '',
        })),
      };

      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'Failed to submit ratings. Please try again.');
        setSubmitting(false);
      } else {
        const resData = json.result;
        setSubmittedResult({
          restaurantName: resData.restaurantName || order.restaurant_name,
          previousRating: Number(resData.previousRestaurantRating) || order.restaurant_rating,
          newRating: Number(resData.newRestaurantRating) || 5.0,
          updatedFoods: resData.updatedFoods || [],
        });
        onRatingSubmitted(Number(resData.newRestaurantRating) || 5.0);
      }
    } catch {
      setError('A network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={submittedResult ? onClose : undefined}
      />

      {/* Modal Card */}
      <div
        className="relative z-10 w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/30 animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: 'rgba(9, 13, 22, 0.97)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          boxShadow: '0 25px 70px rgba(0,0,0,0.85), inset 0 1px 0 rgba(16,185,129,0.2)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/20 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.25)]">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                  Delivered Successfully
                </span>
                <span className="text-xs text-slate-400 font-mono">Order #{order.id}</span>
              </div>
              <h2 className="text-lg font-black text-white leading-tight mt-0.5">
                {submittedResult ? 'Thank You for Your Feedback!' : 'Rate Your Delivered Order'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {submittedResult ? (
            /* SUBMITTED SUCCESS VIEW */
            <div className="py-4 flex flex-col items-center text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.5)]">
                  <Check className="w-10 h-10 text-emerald-400 stroke-[3]" />
                </div>
                <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-slate-950 border border-emerald-400 text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white">Ratings Recorded!</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                  Your ratings have been added to the dishes. The overall restaurant rating has been recalculated as the average of all its food items!
                </p>
              </div>

              {/* Updated Restaurant Rating Card */}
              <div className="w-full bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-5 text-center space-y-3 shadow-lg">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Store className="w-4 h-4" />
                  <span>{submittedResult.restaurantName}</span>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-amber-300">
                    <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                    <span className="text-3xl font-black text-white">
                      {submittedResult.newRating.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-300">
                  <span className="text-slate-400">Previous Rating: </span>
                  <span className="font-semibold line-through text-slate-500 mr-2">
                    ★ {submittedResult.previousRating.toFixed(1)}
                  </span>
                  <span className="text-emerald-400 font-bold">
                    ➔ New Avg Rating: ★ {submittedResult.newRating.toFixed(1)}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 border-t border-emerald-500/15 pt-2 italic">
                  * Calculated as the average of all food item ratings of {submittedResult.restaurantName}.
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl font-bold text-slate-950 text-sm bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)]"
              >
                Done & Continue Exploring
              </button>
            </div>
          ) : (
            /* RATING FORM */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Restaurant Info Pill */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-emerald-500/20">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-none">
                      {order.restaurant_name}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Current Rating:{' '}
                      <span className="text-amber-400 font-bold">
                        ★ {Number(order.restaurant_rating || 4.8).toFixed(1)}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSetAllFiveStars}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 border border-amber-400/40 text-amber-300 hover:bg-amber-500/20 transition-all flex items-center gap-1 shadow-sm"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>All 5 Stars</span>
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Please rate each food item from your order. Your feedback directly updates the food rating and recalculates the overall restaurant rating!
              </p>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              {/* Items List */}
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {order.items.map((item) => {
                  const currentVal = ratings[item.food_id] || 5;
                  const activeVal = hoverRatings[item.food_id] || currentVal;

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-slate-900/70 border border-emerald-500/20 hover:border-emerald-500/40 transition-all space-y-3"
                    >
                      {/* Item Top: Photo & Title */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=80'}
                            alt={item.food_name}
                            className="w-12 h-12 rounded-xl object-cover bg-slate-950 flex-shrink-0 border border-slate-800"
                          />
                          <div>
                            <p className="text-sm font-bold text-white leading-tight line-clamp-1">
                              {item.food_name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Qty: {item.quantity} • ৳{item.price}
                            </p>
                          </div>
                        </div>

                        {/* Current Value Pill */}
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-amber-500/15 border border-amber-400/30 text-amber-300">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {activeVal}.0
                          </span>
                        </div>
                      </div>

                      {/* Interactive Star Bar */}
                      <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-800/60">
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const isFilled = star <= activeVal;
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => handleSetRating(item.food_id, star)}
                                onMouseEnter={() => handleSetHover(item.food_id, star)}
                                onMouseLeave={() => handleSetHover(item.food_id, 0)}
                                className="p-1 rounded-lg transition-transform hover:scale-125 focus:outline-none"
                                aria-label={`Rate ${star} star`}
                              >
                                <Star
                                  className={`w-6 h-6 transition-colors duration-150 ${
                                    isFilled
                                      ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                                      : 'fill-transparent text-slate-600 hover:text-slate-400'
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-300">
                          {getRatingLabel(activeVal)}
                        </span>
                      </div>

                      {/* Optional Note */}
                      <input
                        type="text"
                        placeholder="Write a quick thought (optional)..."
                        value={reviews[item.food_id] || ''}
                        onChange={(e) =>
                          setReviews((prev) => ({ ...prev, [item.food_id]: e.target.value }))
                        }
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 rounded-2xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
                >
                  Remind Later
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-slate-950 text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin" />
                      <span>Submitting Ratings…</span>
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 fill-slate-950" />
                      <span>Submit Ratings & Update Restaurant</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
