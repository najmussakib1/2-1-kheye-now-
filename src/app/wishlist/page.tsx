"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { FoodItem } from "@/lib/db";
import { useApp } from "@/context/AppContext";
import { Heart, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function WishlistPage() {
  const { user, role, isAuthLoading, openAuthModal } = useApp();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user || role !== "user") {
      setLoading(false);
      return;
    }
    fetch("/api/wishlist")
      .then(r => r.json())
      .then(data => {
        if (data.items) setItems(data.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, role, isAuthLoading]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#070b12" }}>
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-400/40">
            <Heart className="w-6 h-6 text-rose-400 fill-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">My Wishlist</h1>
            <p className="text-sm text-slate-400">{items.length} saved item{items.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Loading */}
        {(loading || isAuthLoading) && (
          <div className="flex justify-center items-center py-32">
            <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Not logged in */}
        {!loading && !isAuthLoading && (!user || role !== "user") && (
          <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-emerald-500/20">
              <Heart className="w-16 h-16 text-slate-600 mx-auto" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Sign in to view your wishlist</h2>
              <p className="text-slate-400 text-sm mb-6">Save your favourite items and order them any time.</p>
              <button
                onClick={() => openAuthModal({ tab: "signin", role: "user" })}
                className="px-6 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-all"
              >
                Sign In
              </button>
            </div>
          </div>
        )}

        {/* Empty wishlist */}
        {!loading && !isAuthLoading && user && role === "user" && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-rose-500/20">
              <Heart className="w-16 h-16 text-slate-600 mx-auto" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Your wishlist is empty</h2>
              <p className="text-slate-400 text-sm mb-6">Tap the ❤ heart icon on any item to save it here.</p>
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-all"
              >
                <ShoppingBag className="w-5 h-5" />
                Browse Menu
              </Link>
            </div>
          </div>
        )}

        {/* Wishlist grid */}
        {!loading && !isAuthLoading && user && role === "user" && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map(item => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
