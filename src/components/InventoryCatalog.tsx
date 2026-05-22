import React, { useState } from 'react';
import { Product } from '../types';
import { Trash2, AlertTriangle, Check, X } from 'lucide-react';

interface InventoryCatalogProps {
  products: Product[];
  onUpdateStock: (productId: string, newQty: number) => void;
  onOpenAddModal: () => void;
  onDeleteProduct?: (productId: string) => void;
}

export default function InventoryCatalog({
  products,
  onUpdateStock,
  onOpenAddModal,
  onDeleteProduct
}: InventoryCatalogProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter(p => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return p.name.toLowerCase().includes(query) || (p.category && p.category.toLowerCase().includes(query));
  });

  return (
    <div className="bg-white rounded-3xl border-2 border-orange-100 p-5 space-y-5 shadow-xs">
      
      {/* Header section for Catalog */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-slate-900 text-base">ပြည်တွင်းဖြစ် ကူးသန်းစတော့ခ်</h3>
          <p className="text-xs text-slate-500 font-medium">ရောင်းချမည့် ပြည်တွင်းထုတ်ကုန်ပစ္စည်းများ စာရင်းသွင်း ရွေးချယ်ခြင်း</p>
        </div>
        <button 
          onClick={onOpenAddModal}
          className="bg-orange-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 flex-shrink-0"
        >
          <span>+ ပစ္စည်းအသစ်ထည့်ရန်</span>
        </button>
      </div>

      {/* 🔍 Dynamic Catalog search bar with Button */}
      <div className="bg-[#FFF8F0]/40 rounded-2xl border border-orange-100 p-3.5 flex flex-col sm:flex-row gap-3 items-center text-xs">
        <label className="font-black text-slate-700 sm:w-28 flex-shrink-0 flex items-center gap-1">
          <span>🔍</span> ပစ္စည်းရှာရန်:
        </label>
        <div className="flex gap-2 w-full">
          <input
            type="text"
            placeholder="ပစ္စည်းအမည် (သို့) အမျိုးအစား ရိုက်ထည့်ပါ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs bg-white border border-slate-205 rounded-xl p-2 px-3 flex-1 font-bold focus:outline-hidden focus:border-orange-400"
          />
          <button
            type="button"
            className="bg-orange-500 hover:bg-orange-600 text-white font-black text-xs px-4 py-2 rounded-xl active:scale-95 transition cursor-pointer shadow-3xs flex-shrink-0"
          >
            ရှာမည် (Search)
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold text-xs px-3 py-2 rounded-xl transition cursor-pointer flex-shrink-0"
            >
              ပြန်စမည်
            </button>
          )}
        </div>
      </div>

      {/* Inventory listing Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredProducts.map(prod => (
          <div key={prod.id} className="relative p-4 bg-[#FFF8F0]/30 rounded-2xl border border-orange-100 hover:border-orange-200 transition-all flex flex-col justify-between gap-4 shadow-2xs group">
            
            {/* Quick Delete item button - State-based fallback confirmation */}
            <div className="absolute top-2 right-2 z-20">
              {confirmDeleteId === prod.id ? (
                <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg p-1 animate-fade-in">
                  <span className="text-[10px] text-rose-700 font-bold px-1 select-none">တကယ်ဖျက်မလား?</span>
                  <button
                    onClick={() => {
                      onDeleteProduct?.(prod.id);
                      setConfirmDeleteId(null);
                    }}
                    title="ဟုတ်ကဲ့ ဖျက်မည်"
                    className="bg-rose-600 hover:bg-rose-750 text-white p-1 rounded-md transition-colors cursor-pointer active:scale-95"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    title="မဖျက်တော့ပါ"
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-1 rounded-md transition-colors cursor-pointer active:scale-95"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(prod.id)}
                  title="ကုန်စည်ဖျက်မည်"
                  className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer active:scale-95 bg-white/70 backdrop-blur-xs border border-slate-100/50 shadow-3xs"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <span className="text-3xl bg-white w-12 h-12 rounded-xl flex items-center justify-center border border-orange-100 shadow-3xs flex-shrink-0 overflow-hidden">
                {prod.image && (prod.image.startsWith('http') || prod.image.startsWith('data:image') || prod.image.startsWith('/')) ? (
                  <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  prod.image || '📦'
                )}
              </span>
              <div className="space-y-1 max-w-[calc(100%-60px)]">
                <span className="inline-block text-[10px] bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-full font-black">
                  {prod.category}
                </span>
                <h4 className="font-extrabold text-slate-900 text-xs leading-snug line-clamp-2 pr-4">{prod.name}</h4>
                <p className="font-black text-orange-600 text-[11.5px] font-mono">{prod.price.toLocaleString()} Ks</p>
              </div>
            </div>


            {/* Stock Adjuster */}
            <div className="pt-3 border-t border-orange-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">စတော့လက်ကျန်</span>
                <span className={`text-xs font-black ${prod.stock_qty <= 5 ? 'text-rose-600 animate-pulse' : 'text-slate-800'}`}>
                  {prod.stock_qty} ခု {prod.stock_qty <= 5 && '(စတော့ကုန်ခါနီး)'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button 
                  onClick={() => onUpdateStock(prod.id, prod.stock_qty - 1)}
                  className="w-7 h-7 bg-white border border-orange-100 text-orange-600 hover:bg-orange-50 rounded-md font-bold flex items-center justify-center cursor-pointer active:scale-95 transition-transform shadow-3xs"
                >
                  -
                </button>
                <button 
                  onClick={() => onUpdateStock(prod.id, prod.stock_qty + 1)}
                  className="w-7 h-7 bg-white border border-orange-100 text-orange-600 hover:bg-orange-50 rounded-md font-bold flex items-center justify-center cursor-pointer active:scale-95 transition-transform shadow-3xs"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <div className="col-span-full text-center py-16 bg-[#FFF8F0]/30 rounded-2xl border-2 border-dashed border-orange-200 text-xs text-slate-400 font-medium">
            ရောင်းချမည့် ကုန်ပစ္စည်းမရှိသေးပါ။ ညာဘက်အပေါ်ရှိ ခလုတ်ဖြင့် စတင်ထည့်သွင်းပါ။
          </div>
        )}
      </div>

    </div>
  );
}
