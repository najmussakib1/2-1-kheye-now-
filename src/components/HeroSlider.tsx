'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Clock, Flame, ArrowRight, ShieldCheck } from 'lucide-react';

interface SlideItem {
  id: number;
  title: string;
  subtitle: string;
  tag: string;
  discount: string;
  price: string;
  image: string;
  cookTime: string;
  rating: number;
}

const slides: SlideItem[] = [
  {
    id: 1,
    title: 'Dhaka Special Royal Kacchi Biryani',
    subtitle: 'Fragrant Basmati rice cooked with tender mutton chunks & aromatic spices.',
    tag: 'Trending #1',
    discount: 'FLAT 20% OFF',
    price: '৳ 380',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200&auto=format&fit=crop&q=80',
    cookTime: '25-30 min',
    rating: 4.9,
  },
  {
    id: 2,
    title: 'Double Smokey Smash Burger',
    subtitle: 'Juicy double beef patties melted with sharp cheddar & house secret dip.',
    tag: 'Chef Special',
    discount: 'HOT DEAL',
    price: '৳ 299',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&auto=format&fit=crop&q=80',
    cookTime: '15-20 min',
    rating: 4.8,
  },
  {
    id: 3,
    title: 'Artisanal Truffle Mushroom Pizza',
    subtitle: 'Fresh sourdough crust topped with truffle oil, wild mushrooms & basil.',
    tag: 'Popular',
    discount: 'BUY 1 GET 1 50% OFF',
    price: '৳ 549',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&auto=format&fit=crop&q=80',
    cookTime: '20-25 min',
    rating: 4.7,
  },
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const activeSlide = slides[currentSlide];

  return (
    <section className="relative pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Slider Container */}
      <div className="relative rounded-3xl overflow-hidden border border-emerald-500/20 bg-slate-950/70 shadow-2xl min-h-[480px] lg:min-h-[520px] flex items-center">
        
        {/* Background Image Carousel with Overlay */}
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Dark gradient vignette over hero food image */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10"></div>
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover object-center scale-105 transition-transform duration-10000 ease-out"
            />
          </div>
        ))}

        {/* Foreground Content Card with Glassmorphism */}
        <div className="relative z-20 w-full p-6 sm:p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text & CTA */}
          <div className="lg:col-span-7 space-y-5 animate-in fade-in duration-500">
            {/* Tag & Discount Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 backdrop-blur-md">
                <Flame className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                {activeSlide.tag}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-teal-400 to-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)] uppercase">
                {activeSlide.discount}
              </span>
            </div>

            {/* Slide Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              {activeSlide.title}
            </h1>

            {/* Slide Subtitle */}
            <p className="text-slate-300 text-sm sm:text-base max-w-xl line-clamp-2 leading-relaxed">
              {activeSlide.subtitle}
            </p>

            {/* Price & Specs row */}
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-slate-400 uppercase font-semibold">Only</span>
                <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400 tracking-tight drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                  {activeSlide.price}
                </span>
              </div>

              <div className="h-8 w-px bg-slate-800"></div>

              <div className="flex items-center gap-4 text-xs font-medium text-slate-300">
                <div className="flex items-center gap-1 text-emerald-400">
                  <Star className="w-4 h-4 fill-emerald-400" />
                  <span className="font-bold text-white">{activeSlide.rating}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>{activeSlide.cookTime}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <a
                href="#menu"
                className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-400 hover:to-teal-300 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-105"
              >
                <span>Order Now</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <div className="flex items-center gap-2 text-xs text-slate-400 px-4 py-3 rounded-full bg-slate-900/60 border border-emerald-500/20 backdrop-blur-md">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Hot & Fresh Guaranteed</span>
              </div>
            </div>
          </div>

          {/* Right Floating Glass Card Visual */}
          <div className="hidden lg:col-span-5 lg:block">
            <div className="glass-panel p-6 rounded-3xl relative group transform hover:rotate-1 transition-transform duration-500">
              <div className="relative h-64 rounded-2xl overflow-hidden border border-emerald-500/30">
                <img
                  src={activeSlide.image}
                  alt={activeSlide.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>
                <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-950/80 backdrop-blur-md border border-emerald-500/30 flex justify-between items-center">
                  <span className="text-xs font-semibold text-emerald-300">Fast Delivery</span>
                  <span className="text-xs font-bold text-white bg-emerald-500/30 px-2.5 py-1 rounded-full border border-emerald-400/40">⚡ 25 Min</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Carousel Navigation Buttons */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-slate-900/70 border border-emerald-500/30 text-emerald-300 hover:text-white hover:bg-emerald-500/30 transition-all focus:outline-none backdrop-blur-md"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-slate-900/70 border border-emerald-500/30 text-emerald-300 hover:text-white hover:bg-emerald-500/30 transition-all focus:outline-none backdrop-blur-md"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide
                  ? 'w-8 bg-gradient-to-r from-emerald-400 to-teal-300 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                  : 'w-2 bg-slate-700 hover:bg-emerald-500/50'
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
