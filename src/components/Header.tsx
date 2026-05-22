import React, { useState } from 'react';
import { User } from 'firebase/auth';

interface HeaderProps {
  user: User;
  shopName: string;
  shopSlug: string;
  activeTab: string;
  onNavigate: (tab: string) => void;
}

export default function Header({ user, shopName, shopSlug, activeTab, onNavigate }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-white border-b-2 border-[#FFD28E] sticky top-0 z-30 px-4 py-2.5 shadow-xs">
      <div className="max-w-6xl mx-auto flex justify-between items-center gap-3">
        
        {/* Left Side: Hamburger Menu & Logo */}
        <div className="flex items-center gap-2.5">
          {/* Top-Left Corner Menu Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 -ml-1 hover:bg-orange-50 text-orange-600 rounded-xl transition duration-150 cursor-pointer flex items-center justify-center border border-orange-100/50"
            title="နောက်ထပ် လုပ်ဆောင်ချက်များ"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-black text-xl shadow-xs hover:rotate-6 transition-transform flex-shrink-0">
              S
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xs font-black text-slate-900 tracking-tight leading-none">
                SOKO Admin
              </h1>
              <span className="text-[8px] text-orange-500 font-bold tracking-wider uppercase">PWA Cloud</span>
            </div>
          </div>
        </div>

        {/* Center: Patriotic slogan badge */}
        <div id="header-patriotic-badge" className="flex items-center gap-1 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg">
          <span className="text-[10px] font-black text-orange-600 leading-none">
            🇲🇲 " ပြည်တွင်းဖြစ်ကိုအားပေးပါ "
          </span>
        </div>

        {/* Right Side: Active user avatar and slug indicator */}
        <div className="flex items-center gap-3">
          {/* Shop Slug Badge */}
          <div className="hidden md:flex items-center gap-1 bg-orange-50/50 px-2 py-0.5 rounded-md border border-orange-100">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[9px] text-orange-600 font-mono font-bold">soko.to/{shopSlug}</span>
          </div>

          {/* Clean Avatar representation without text or buttons */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Seller User'}
                referrerPolicy="no-referrer"
                className="w-6.5 h-6.5 rounded-full border border-orange-200"
              />
            ) : (
              <div className="w-6.5 h-6.5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-black">
                {user.displayName?.charAt(0) || 'U'}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Hamburger Drawer Overlay */}
      {isOpen && (
        <>
          {/* Dark overlay backdrop */}
          <div 
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 transition-opacity duration-200 animate-fade-in" 
          />
          {/* Left Sliding Menu Drawer */}
          <div className="fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-50 p-5 flex flex-col justify-between border-r-2 border-[#FFD28E] transition-transform duration-300 transform translate-x-0">
            
            <div className="space-y-6">
              {/* Drawer Title Section */}
              <div className="flex items-center justify-between pb-4 border-b border-orange-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white font-black text-base">
                    S
                  </div>
                  <div className="text-left">
                    <span className="font-black text-slate-900 text-xs block tracking-tight">SOKO Menu</span>
                    <span className="text-[9px] text-zinc-400 font-semibold block truncate max-w-[130px]">{shopName}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 px-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold transition duration-150 cursor-pointer"
                >
                  ✕ ပိတ်ရန်
                </button>
              </div>

              {/* Navigation Options list */}
              <nav className="space-y-1">
                <button
                  onClick={() => { onNavigate('dashboard'); setIsOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-[11px] font-bold rounded-lg transition-all ${
                    activeTab === 'dashboard' 
                      ? 'bg-orange-500 text-white shadow-xs' 
                      : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  <span className="text-sm">📊</span>
                  <span className="truncate">Dashboard</span>
                </button>
                <button
                  onClick={() => { onNavigate('orders'); setIsOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-[11px] font-bold rounded-lg transition-all ${
                    activeTab === 'orders' 
                      ? 'bg-orange-500 text-white shadow-xs' 
                      : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  <span className="text-sm">📦</span>
                  <span className="truncate">အော်ဒါများ</span>
                </button>
                <button
                  onClick={() => { onNavigate('inventory'); setIsOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-[11px] font-bold rounded-lg transition-all ${
                    activeTab === 'inventory' 
                      ? 'bg-orange-500 text-white shadow-xs' 
                      : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  <span className="text-sm">🏷️</span>
                  <span className="truncate">ကုန်ပစ္စည်း</span>
                </button>
                <button
                  onClick={() => { onNavigate('storefront-sim'); setIsOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-[11px] font-bold rounded-lg transition-all ${
                    activeTab === 'storefront-sim' 
                      ? 'bg-orange-500 text-white shadow-xs' 
                      : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  <span className="text-sm">📱</span>
                  <span className="truncate">ဝယ်သူဆိုင်စမ်းသပ်မှု</span>
                </button>
                <button
                  onClick={() => { onNavigate('reports'); setIsOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-[11px] font-bold rounded-lg transition-all ${
                    activeTab === 'reports' 
                      ? 'bg-orange-500 text-white shadow-xs' 
                      : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  <span className="text-sm">📈</span>
                  <span className="truncate">အပတ်စဉ်/လစဉ် အရောင်းစာရင်း</span>
                </button>
                <button
                  onClick={() => { onNavigate('settings'); setIsOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-[11px] font-bold rounded-lg transition-all ${
                    activeTab === 'settings' 
                      ? 'bg-orange-500 text-white shadow-xs' 
                      : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  <span className="text-sm">⚙️</span>
                  <span className="truncate">ဆက်တင်</span>
                </button>
              </nav>
            </div>

            {/* Small elegant footer in Drawer */}
            <div className="p-3 bg-orange-50/50 border border-orange-100 rounded-xl text-center">
              <span className="text-[9px] text-orange-600 font-bold block">🇲🇲 ပြည်တွင်းဖြစ်ကို တန်ဖိုးထားပါ</span>
              <span className="text-[8px] text-slate-400 font-mono mt-0.5 block">v1.1 Stable</span>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
