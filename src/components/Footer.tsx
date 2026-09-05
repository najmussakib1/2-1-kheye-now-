'use client';

import React from 'react';
import { Utensils, Heart, Database, MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="about" className="relative border-t border-emerald-500/20 bg-slate-950/90 pt-16 pb-12 overflow-hidden">
      {/* Background Subtle Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-64 bg-emerald-500/5 blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-emerald-500/10">
          
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center">
                <Utensils className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="font-brand font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">
                KHEYE NOW!
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              Kheye Now! is a modern food delivery system to revolutionize the way people enjoy and order food.It enhances our day to day life by easing the worries of fnot only saves time but also provides comfort and convenience in ordering delicious meals from your favorite restaurants.So Order Now and enjoy the food with your loved one.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 pt-2">
              <Database className="w-4 h-4" />
              <span>Database Engine: SQLite (raw SQL commands & schema)</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Quick Navigation</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Home Page</a></li>
              <li><a href="#menu" className="hover:text-emerald-400 transition-colors">Food Menu & SQL Grid</a></li>
              <li><a href="#about" className="hover:text-emerald-400 transition-colors">About Project</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Categories Catalog</a></li>
            </ul>
          </div>

          {/* Contact & Info */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Contact & Support</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Dhaka, Bangladesh</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+880 1700-000000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>support@kheyenow.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} KHEYE NOW! All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>Built with Next.js & SQL for CSE Term Project</span>
            <Heart className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
          </p>
        </div>
      </div>
    </footer>
  );
}
