import React from 'react';
import { Product } from '../types';

interface InventoryCatalogProps {
  products: Product[];
  onUpdateStock: (productId: string, newQty: number) => void;
  onOpenAddModal: () => void;
}

export default function InventoryCatalog({
  products,
  onUpdateStock,
  onOpenAddModal
}: InventoryCatalogProps) {
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
          className="bg-orange-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
        >
          <span>+ ပစ္စည်းအသစ်ထည့်ရန်</span>
        </button>
      </div>

      {/* Inventory listing Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {products.map(prod => (
          <div key={prod.id} className="p-4 bg-[#FFF8F0]/30 rounded-2xl border border-orange-100 hover:border-orange-200 transition-all flex flex-col justify-between gap-4 shadow-2xs">
            <div className="flex gap-3">
              <span className="text-3xl bg-white w-12 h-12 rounded-xl flex items-center justify-center border border-orange-100 shadow-3xs flex-shrink-0">
                {prod.image || '📦'}
              </span>
              <div className="space-y-1">
                <span className="inline-block text-[10px] bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-full font-black">
                  {prod.category}
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2">{prod.name}</h4>
                <p className="font-black text-orange-600 text-sm font-mono">{prod.price.toLocaleString()} Ks</p>
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
