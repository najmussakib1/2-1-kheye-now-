'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import HeroSlider from '@/components/HeroSlider';
import ProductGrid from '@/components/ProductGrid';
import Footer from '@/components/Footer';
import { FoodItem } from '@/lib/db';
import { ShoppingBag, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const { addToCart } = useApp();

  const handleAddToCart = (item: FoodItem) => {
    addToCart(item, 1);
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
        />
      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}

