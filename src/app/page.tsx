'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import HeroSlider from '@/components/HeroSlider';
import FeaturedFoodSection from '@/components/FeaturedFoodSection';
import MostRatedRestaurantsSection from '@/components/MostRatedRestaurantsSection';
import ProductGrid from '@/components/ProductGrid';
import Footer from '@/components/Footer';
import RatingPromptModal from '@/components/RatingPromptModal';
import type { FoodItem, PendingRatingOrder } from '@/lib/db';
import { useApp } from '@/context/AppContext';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const { addToCart, user, showToast } = useApp();

  // Rating Modal state
  const [pendingOrder, setPendingOrder] = useState<PendingRatingOrder | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddToCart = (item: FoodItem) => {
    addToCart(item, 1);
  };

  const handleSelectRestaurant = (restaurantId: number) => {
    if (restaurantId === 0 || selectedRestaurantId === restaurantId) {
      setSelectedRestaurantId(null);
    } else {
      setSelectedRestaurantId(restaurantId);
      // Scroll down to menu section
      const menuSection = document.getElementById('menu');
      if (menuSection) {
        menuSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Check for any unrated delivered order belonging to the signed-in customer
  const checkPendingRatings = useCallback(async () => {
    // Only ever ask for prompts scoped to the current session. The server
    // ignores any user identity in the query string, and refuses the request
    // outright when nobody is signed in.
    if (!user) return;

    try {
      // Candidate order IDs are only a hint for which order to surface first.
      // The server re-checks ownership, so ids left in localStorage by a
      // previous account on this browser cannot expose another customer's order.
      let candidateOrderIds: number[] = [];
      if (typeof window !== 'undefined') {
        try {
          const stored = JSON.parse(localStorage.getItem('kheye_now_order_ids') || '[]');
          if (Array.isArray(stored)) candidateOrderIds = stored;
        } catch {
          // ignore error
        }
      }

      const params = new URLSearchParams();
      if (candidateOrderIds.length > 0) params.set('orderIds', candidateOrderIds.join(','));

      const res = await fetch(`/api/ratings?${params.toString()}`);

      // Signed out (401) or a transient error: make sure no stale prompt from
      // a previous account stays on screen.
      if (res.status === 401) {
        setPendingOrder(null);
        setIsRatingModalOpen(false);
        return;
      }
      if (!res.ok) return;

      const data = await res.json();

      if (data.success && data.pendingOrder) {
        setPendingOrder(data.pendingOrder);
        setIsRatingModalOpen(true);
      } else {
        setPendingOrder(null);
        setIsRatingModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to query pending ratings:', err);
    }
  }, [user]);

  useEffect(() => {
    // Initial check on mount
    checkPendingRatings();

    // Regular polling every 5 seconds to detect live deliveries by riders
    const interval = setInterval(checkPendingRatings, 5000);
    return () => clearInterval(interval);
  }, [checkPendingRatings, user]);

  const handleRatingSubmitted = (newRating: number) => {
    showToast(`Ratings submitted! Restaurant rating updated to ★ ${newRating.toFixed(1)}`, 'success');
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Glassmorphism Navbar */}
      <Navbar
        onSelectCategory={(cat) => setSelectedCategory(cat)}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* Animated Hero Carousel */}
        <HeroSlider />

        {/* Featured Popular, Trending, Top 5 Most Ordered & Most Rated (Area-Aware) */}
        <FeaturedFoodSection
          onAddToCart={handleAddToCart}
          refreshTrigger={refreshKey}
        />

        {/* Most Rated Restaurants According to Rating */}
        <MostRatedRestaurantsSection
          onSelectRestaurant={handleSelectRestaurant}
          selectedRestaurantId={selectedRestaurantId}
          refreshTrigger={refreshKey}
        />

        {/* SQL Database Food Items Grid */}
        <ProductGrid
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          onAddToCart={handleAddToCart}
          selectedRestaurantIdProp={selectedRestaurantId}
          onSelectRestaurantIdProp={(id) => setSelectedRestaurantId(id)}
          refreshTrigger={refreshKey}
        />
      </main>

      {/* Delivery Rating Prompt Modal */}
      {pendingOrder && (
        <RatingPromptModal
          order={pendingOrder}
          isOpen={isRatingModalOpen}
          onClose={() => setIsRatingModalOpen(false)}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

