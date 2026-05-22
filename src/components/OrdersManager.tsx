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

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);

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

      {/* Orders Grid/List */}
      <div className="space-y-4">
        {filteredOrders.map(order => (
          <div key={order.id} className="p-4 sm:p-5 bg-[#FFF8F0]/30 rounded-2xl border border-orange-100 flex flex-col lg:flex-row lg:items-center justify-between gap-5 text-xs hover:border-orange-200 transition-colors">
            
            {/* Information Side */}
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-slate-900 text-sm tracking-tight">{order.id}</span>
                <span className="text-[10px] bg-orange-50 text-orange-600 px-2.5 py-0.5 rounded-md font-extrabold border border-orange-100">{order.payment_method}</span>
                <span className="text-[10px] text-slate-400 font-mono font-bold">{new Date(order.created_at).toLocaleString()}</span>
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
                    <a 
                      href={order.payment_slip_image} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="block relative w-20 h-20 rounded-xl overflow-hidden border border-orange-200 shadow-2xs group cursor-zoom-in bg-white"
                      title="ပုံကြီးချဲ့ရန်နှိပ်ပါ"
                    >
                      <img src={order.payment_slip_image} alt="ငွေလွှဲဖြတ်ပိုင်း" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[9.5px] font-black">
                        🔍 ပုံကြီးကြည့်ရန်
                      </div>
                    </a>
                  </div>
                  <div className="text-[10px] text-orange-950 font-bold leading-normal">
                    <p className="text-orange-900">💡 ဝယ်ယူသူမှ မှာယူစဉ် တိုက်ရိုက်ပူးတွဲပေးခဲ့သော ငွေလွှဲဖြတ်ပိုင်း ဖြစ်ပါသည်။</p>
                    <p className="text-slate-450 font-semibold mt-0.5">ပုံကိုနှိပ်၍ window အသစ်တွင် full size ချက်ချင်းကြည့်ရှုနိုင်ပါသည်</p>
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

              <div className="flex flex-wrap gap-1 justify-end w-full font-bold">
                {/* Pending State -> Confirm Button */}
                {order.status === 'pending' && (
                  <button 
                    onClick={() => onChangeOrderStatus(order.id, 'confirmed')}
                    className="bg-orange-500 hover:bg-orange-600 text-white text-[9.5px] font-bold px-2 py-1 rounded-md cursor-pointer transition shadow-xs"
                  >
                    အတည်ပြုမည်
                  </button>
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
                {order.status !== 'completed' && order.status !== 'cancelled' && (
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
        ))}

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs">
            မည့်သည့်အော်ဒါမှတ်တမ်းမျှ မရှိသေးပါခင်ဗျာ။
          </div>
        )}
      </div>

    </div>
  );
}
