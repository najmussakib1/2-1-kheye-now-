'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import HeroSlider from '@/components/HeroSlider';
import ProductGrid from '@/components/ProductGrid';
import Footer from '@/components/Footer';
import RatingPromptModal from '@/components/RatingPromptModal';
import type { FoodItem, PendingRatingOrder } from '@/lib/db';
import { useApp } from '@/context/AppContext';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const { addToCart, user, showToast } = useApp();

  // Rating Modal state
  const [pendingOrder, setPendingOrder] = useState<PendingRatingOrder | null>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddToCart = (item: FoodItem) => {
    addToCart(item, 1);
  };

  // Check for any unrated delivered order for the customer
  const checkPendingRatings = useCallback(async () => {
    try {
      // Gather candidate order IDs from localStorage
      let candidateOrderIds: number[] = [];
      if (typeof window !== 'undefined') {
        try {
          candidateOrderIds = JSON.parse(localStorage.getItem('kheye_now_order_ids') || '[]');
        } catch {
          // ignore error
        }
      }

      // Check URL query parameters (e.g. ?customer=5 or ?orderId=...)
      const searchParams = new URLSearchParams(window.location.search);
      const urlOrderId = searchParams.get('orderId');
      const urlCustomer = searchParams.get('customer') || searchParams.get('userId');

      const params = new URLSearchParams();
      if (urlOrderId) params.set('orderId', urlOrderId);
      if (urlCustomer) params.set('customer', urlCustomer);
      if (candidateOrderIds.length > 0) params.set('orderIds', candidateOrderIds.join(','));

      const res = await fetch(`/api/ratings?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.pendingOrder) {
        setPendingOrder(data.pendingOrder);
        setIsRatingModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to query pending ratings:', err);
    }
  }, []);

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

        {/* SQL Database Food Items Grid */}
        <ProductGrid
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          onAddToCart={handleAddToCart}
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

