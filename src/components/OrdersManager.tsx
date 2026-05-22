import React, { useState } from 'react';
import { Order } from '../types';

interface OrdersManagerProps {
  orders: Order[];
  onChangeOrderStatus: (orderId: string, newStatus: Order['status']) => void;
  onSelectOrder: (order: Order) => void;
}

export default function OrdersManager({
  orders,
  onChangeOrderStatus,
  onSelectOrder
}: OrdersManagerProps) {
  const [filter, setFilter] = useState<Order['status'] | 'all'>('all');
  const [zoomedReceipt, setZoomedReceipt] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter(o => {
    const statusMatch = filter === 'all' || o.status === filter;
    const searchMatch = !searchQuery.trim() || o.id.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return statusMatch && searchMatch;
  });

  return (
    <div className="bg-white rounded-3xl border-2 border-orange-100 p-5 space-y-5 shadow-xs">

      
      {/* Filtering Header block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-black text-slate-900 text-base">အော်ဒါစာရင်း စီမံခန့်ခွဲမှု</h3>
          <p className="text-xs text-slate-500 font-medium">ဝင်ရောက်လာသော အော်ဒါမှတ်တမ်းများနှင့် အဆင့်ဆင့်လုပ်ဆောင်ချက်များ</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1 font-bold">
          {(['all', 'pending', 'confirmed', 'shipped', 'completed', 'cancelled'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-2 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                filter === st 
                  ? 'bg-orange-500 text-white shadow-xs' 
                  : 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-100/70'
              }`}
            >
              {st === 'all' ? 'အားလုံး' : 
               st === 'pending' ? 'စောင့်ဆိုင်းဆဲ' :
               st === 'confirmed' ? 'အတည်ပြုပြီး' :
               st === 'shipped' ? 'ပို့ဆောင်ဆဲ' :
               st === 'completed' ? 'ပြီးဆုံး' : 'ပယ်ဖျက်'}
            </button>
          ))}
        </div>
      </div>

      {/* 🔍 Order Search Bar */}
      <div className="bg-[#FFF8F0]/40 rounded-2xl border border-orange-100 p-3.5 flex flex-col sm:flex-row gap-3 items-center text-xs">
        <label className="font-black text-slate-700 sm:w-28 flex-shrink-0 flex items-center gap-1">
          <span>🔍</span> အော်ဒါ ID ရှာရန်:
        </label>
        <div className="flex gap-2 w-full">
          <input
            type="text"
            placeholder="ဥပမာ - ORD-1234 (သို့) နံပါတ်ရိုက်ပါ"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs bg-white border border-slate-205 rounded-xl p-2 px-3 flex-1 font-mono font-bold focus:outline-hidden focus:border-orange-400"
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

      {/* Orders Grid/List */}
      <div className="space-y-4">
        {filteredOrders.map(order => {
          const isCancelled = order.status === 'cancelled';
          const isConfirmed = order.status === 'confirmed' || order.status === 'completed' || order.status === 'shipped';
          
          const cardClass = isCancelled 
            ? "p-4 sm:p-5 bg-rose-50/15 border-2 border-dashed border-rose-250 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 text-xs opacity-75 transition-colors"
            : isConfirmed 
            ? "p-4 sm:p-5 bg-emerald-50/15 border-2 border-emerald-250 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 text-xs hover:border-emerald-350 transition-colors"
            : "p-4 sm:p-5 bg-[#FFF8F0]/30 rounded-2xl border border-orange-105 flex flex-col lg:flex-row lg:items-center justify-between gap-5 text-xs hover:border-orange-200 transition-colors";

          return (
            <div key={order.id} className={cardClass}>
              
              {/* Information Side */}
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black text-slate-900 text-sm tracking-tight">{order.id}</span>
                  <span className="text-[10px] bg-orange-50 text-orange-600 px-2.5 py-0.5 rounded-md font-extrabold border border-orange-100">{order.payment_method}</span>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">{new Date(order.created_at).toLocaleString()}</span>
                  
                  {/* Status Badges */}
                  {order.status === 'pending' && (
                    <span className="text-[9.5px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-lg font-black border border-amber-200">⏳ စောင့်ဆိုင်းဆဲ (Pending)</span>
                  )}
                  {order.status === 'confirmed' && (
                    <span className="text-[9.5px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg font-black border border-emerald-200 animate-pulse">💚 လက်ခံအတည်ပြုပြီး (Confirmed)</span>
                  )}
                  {order.status === 'shipped' && (
                    <span className="text-[9.5px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-lg font-black border border-sky-200">🚚 ပစ္စည်းပို့ဆောင်ဆဲ (Shipped)</span>
                  )}
                  {order.status === 'completed' && (
                    <span className="text-[9.5px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-lg font-black border border-teal-200">🎉 အောင်မြင်ပြီးဆုံး (Completed)</span>
                  )}
                  {order.status === 'cancelled' && (
                    <span className="text-[9.5px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-lg font-black border border-rose-220">❌ ပယ်ဖျက်ပြီး (Cancelled)</span>
                  )}
                </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div>
                  <p className="text-orange-500 font-black uppercase tracking-wider text-[9px] mb-0.5">ဝယ်ယူသူအချက်အလက်</p>
                  <p className="font-bold text-slate-800">{order.customer_name} ({order.customer_phone})</p>
                </div>
                <div>
                  <p className="text-orange-500 font-black uppercase tracking-wider text-[9px] mb-0.5">ပို့ဆောင်မည့်လိပ်စာ</p>
                  <p className="text-slate-700 leading-normal font-medium">{order.address}</p>
                </div>
              </div>

              {/* Items Panel */}
              <div className="bg-white p-3 rounded-xl border border-orange-100/50">
                <p className="text-[9px] text-orange-500 font-black mb-1.5 uppercase tracking-wider">မှာယူသည့် ပစ္စည်းစာရင်း ({order.items.length} မျိုး)</p>
                <div className="space-y-1.5 text-[11px] font-bold">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-slate-700">
                      <span>• {item.name} <strong className="text-orange-600 font-extrabold">x{item.quantity}</strong></span>
                      <span className="font-mono text-slate-600">{(item.price * item.quantity).toLocaleString()} Ks</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Slip Attachment Section if present */}
              {order.payment_slip_image && (
                <div className="bg-orange-50/50 p-3 rounded-2xl border border-orange-100 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-shrink-0">
                    <p className="text-[9px] text-orange-600 font-extrabold uppercase tracking-wider mb-1.5">ငွေလွှဲဖြတ်ပိုင်း / ပြေစာ</p>
                    <button 
                      type="button"
                      onClick={() => setZoomedReceipt(order.payment_slip_image || null)}
                      className="block relative w-20 h-20 rounded-xl overflow-hidden border border-orange-200 shadow-2xs group cursor-zoom-in bg-white focus:outline-hidden"
                      title="ပုံကြီးချဲ့ရန်နှိပ်ပါ"
                    >
                      <img src={order.payment_slip_image} alt="ငွေလွှဲဖြတ်ပိုင်း" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[9px] font-black">
                        🔍 ပုံကြီးကြည့်မည်
                      </div>
                    </button>
                  </div>
                  <div className="text-[10px] text-orange-950 font-bold leading-normal">
                    <p className="text-orange-900">💡 ဝယ်ယူသူမှ မှာယူစဉ် တိုက်ရိုက်ပူးတွဲပေးခဲ့သော ငွေလွှဲဖြတ်ပိုင်း ဖြစ်ပါသည်။</p>
                    <p className="text-slate-450 font-semibold mt-0.5">ပုံကိုနှိပ်၍ Browser security အတားဆီးမရှိဘဲ ချက်ချင်းပုံကြီးချဲ့ကြည့်ရှုနိုင်ပါသည်</p>
                  </div>
                </div>
              )}
            </div>

            {/* Price and Status Actions Side */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-end gap-3 justify-center min-w-[170px] pt-4 lg:pt-0 border-t border-orange-100 lg:border-t-0">
              <div className="text-right w-full sm:w-auto lg:w-full mb-1">
                <span className="text-[10px] text-orange-500 block font-black uppercase tracking-wider">စုစုပေါင်း ကျသင့်ငွေ</span>
                <span className="text-lg font-black text-orange-600 block font-mono">{order.total_amount.toLocaleString()} Ks</span>
              </div>

              <div className="flex flex-wrap gap-1.5 justify-end w-full font-bold">
                {/* Pending State -> Accept (Confirm) and Decline (Cancel) option buttons */}
                {order.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => onChangeOrderStatus(order.id, 'confirmed')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9.5px] font-black px-2.5 py-1.5 rounded-lg cursor-pointer transition shadow-xs flex items-center gap-1 active:scale-95"
                    >
                      <span>✅ လက်ခံမည်</span>
                    </button>
                    <button 
                      onClick={() => onChangeOrderStatus(order.id, 'cancelled')}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-[9.5px] font-black px-2.5 py-1.5 rounded-lg cursor-pointer transition shadow-xs flex items-center gap-1 active:scale-95"
                    >
                      <span>❌ ငြင်းပယ်မည်</span>
                    </button>
                  </>
                )}

                {/* Confirmed State -> Ship Button */}
                {order.status === 'confirmed' && (
                  <button 
                    onClick={() => onChangeOrderStatus(order.id, 'shipped')}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-[9.5px] font-bold px-2 py-1 rounded-md cursor-pointer transition"
                  >
                    ပစ္စည်းပို့ဆောင်မည်
                  </button>
                )}

                {/* Shipped State -> Complete Button */}
                {order.status === 'shipped' && (
                  <button 
                    onClick={() => onChangeOrderStatus(order.id, 'completed')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9.5px] font-bold px-2 py-1 rounded-md cursor-pointer transition"
                  >
                    အောင်မြင်သတ်မှတ်မည်
                  </button>
                )}

                {/* Print/Voucher Viewer */}
                <button 
                  onClick={() => onSelectOrder(order)}
                  className="bg-orange-50 text-orange-600 border border-orange-200 text-[9.5px] font-bold px-2 py-1 rounded-md hover:bg-orange-100 flex items-center gap-1 cursor-pointer transition"
                >
                  📄 ပြေစာထုတ်
                </button>

                {/* Cancel Trigger */}
                {order.status !== 'pending' && order.status !== 'completed' && order.status !== 'cancelled' && (
                  <button 
                    onClick={() => onChangeOrderStatus(order.id, 'cancelled')}
                    className="bg-rose-50 text-rose-700 hover:bg-rose-100 text-[9.5px] font-bold px-2 py-1 rounded-md border border-rose-200 cursor-pointer transition"
                  >
                    ပယ်ဖျက်
                  </button>
                )}
              </div>
            </div>

          </div>
        ); })}

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs">
            မည့်သည့်အော်ဒါမှတ်တမ်းမျှ မရှိသေးပါခင်ဗျာ။
          </div>
        )}
      </div>

      {/* Lightbox / Image Zoom Viewer to bypass standard iframe target blank security restrictions */}
      {zoomedReceipt && (
        <div 
          onClick={() => setZoomedReceipt(null)}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 z-[100] cursor-zoom-out animate-fade-in"
        >
          <div className="bg-white/5 border border-white/10 p-2 rounded-2xl max-w-sm w-full relative" onClick={e => e.stopPropagation()}>
            <img src={zoomedReceipt} alt="ပုံကြီးချဲ့ပြေစာ" className="w-full h-auto max-h-[80vh] object-contain rounded-xl shadow-2xl" />
            
            <div className="flex justify-between items-center mt-3 text-white px-2">
              <span className="text-[10px] bg-white/15 px-3 py-1 rounded-full font-bold">🧾 ငွေလွှဲပြေစာ ဖြတ်ပိုင်းပုံစံ</span>
              <button 
                type="button"
                onClick={() => setZoomedReceipt(null)} 
                className="bg-white text-slate-900 hover:bg-slate-100 px-4 py-1.5 rounded-full font-black text-[10px] cursor-pointer shadow-md"
              >
                ပိတ်မည် (Close)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
