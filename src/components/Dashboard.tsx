import React from 'react';
import { Product, Order } from '../types';

interface DashboardProps {
  products: Product[];
  orders: Order[];
  onNavigate: (tab: string) => void;
  onUpdateStock: (productId: string, newQty: number) => void;
  onSelectOrder: (order: Order) => void;
  onChangeOrderStatus: (orderId: string, newStatus: Order['status']) => void;
}

export default function Dashboard({
  products,
  orders,
  onNavigate,
  onUpdateStock,
  onSelectOrder,
  onChangeOrderStatus
}: DashboardProps) {

  const [showSimulatorGuide, setShowSimulatorGuide] = React.useState(() => {
    return localStorage.getItem('soko_hide_sim_guide') !== 'true';
  });

  // Logic Calculations
  const getLowStockProducts = () => products.filter(p => p.stock_qty <= 5);
  const getTodayOrders = () => orders.filter(o => {
    const today = new Date().toDateString();
    return new Date(o.created_at).toDateString() === today;
  });
  const getTodayRevenue = () => getTodayOrders()
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total_amount, 0);

  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="space-y-6">

      {/* Clean Workspace Title Header (Slogan & Hashtags completely removed per request) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-1 border-b border-orange-100">
        <div>
          <h2 className="text-lg font-black text-[#8A4A00] tracking-tight flex items-center gap-2">
            📊 အရောင်းဌာန ဆိုင်အချက်အလက်များ
          </h2>
          <p className="text-[11px] text-zinc-500 font-medium">ဆိုင်သတင်းတိုများနှင့် လုပ်ဆောင်ရမည့် သတိပေးချက်များ</p>
        </div>
      </div>

      {/* Quick Insights Grid */}
      <div id="analytics-grid" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border-2 border-orange-105/70 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest block mb-1">ယနေ့ရောင်းရငွေ</span>
          <span className="text-xl sm:text-2xl font-black text-orange-600 font-mono">{getTodayRevenue().toLocaleString()} Ks</span>
          <span className="text-[10px] text-slate-505 block mt-2">ယနေ့အော်ဒါအားလုံး၏ စုစုပေါင်း</span>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border-2 border-orange-105/70 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest block mb-1">အော်ဒါအသစ်</span>
          <span className="text-xl sm:text-2xl font-black text-orange-600 font-mono">
            {pendingOrdersCount} ခု
          </span>
          <span className="text-[10px] text-orange-500 block mt-2 animate-pulse font-bold">● လုပ်ဆောင်ရန်ကျန်ရှိ</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-orange-105/70 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest block mb-1">ကုန်ပစ္စည်း</span>
          <span className="text-xl sm:text-2xl font-black text-slate-800 font-mono">{products.length} မျိုး</span>
          <span className="text-[10px] text-slate-500 block mt-2 font-medium">ပစ္စည်းကတ်တလောက်စုစုပေါင်း</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-orange-105/70 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest block mb-1">စတော့နည်းပစ္စည်း</span>
          <span className={`text-xl sm:text-2xl font-black font-mono ${getLowStockProducts().length > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
            {getLowStockProducts().length} မျိုး
          </span>
          <span className="text-[10px] text-rose-500 block mt-2 font-bold">{getLowStockProducts().length > 0 ? '🚨 စတော့ပြန်ဖြည့်ပါ' : '✅ အစီအစဉ်တကျဖြစ်နေဆဲ'}</span>
        </div>
      </div>

      {/* Simulator Interactive Callout Board (With Close Action button per User request) */}
      {showSimulatorGuide && (
        <div className="relative bg-orange-50/50 border-2 border-[#FFD28E] text-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in pr-10 md:pr-12">
          {/* Top Right Close button */}
          <button
            onClick={() => {
              setShowSimulatorGuide(false);
              localStorage.setItem('soko_hide_sim_guide', 'true');
            }}
            className="absolute top-2.5 right-2.5 w-6 h-6 hover:bg-orange-100 text-orange-900 font-bold text-xs rounded-full flex items-center justify-center transition border border-orange-200/40 cursor-pointer active:scale-90"
            title="ပယ်ဖျတ်မည် (စမ်းသပ်ဝယ်ယူနည်း လမ်းညွှန်ချက်ကိုဖျောက်ပါ)"
          >
            ✕
          </button>
          
          <div className="flex gap-3">
            <span className="text-3xl mt-0.5 flex-shrink-0">📲</span>
            <div>
              <h4 className="font-extrabold text-sm text-orange-950">နိုင်ငံခြားဝယ်လက်များ နှင့် ပြည်တွင်းဝယ်သူများမှာယူမှုစနစ် (Storefront Simulator)</h4>
              <p className="text-xs text-orange-700 mt-1 leading-normal">
                ဖုန်း Simulator မျက်နှာပြင်တွင် ဝယ်ယူသူအဖြစ် ဟန်ဆောင်၍ ပါဆယ်ပစ္စည်းများကို ဝယ်ယူစမ်းသပ်နိုင်သည်။ စမ်းသပ်သမျှ အော်ဒါမှတ်တမ်းအားလုံးသည် Firebase server တွင် ချက်ချင်း updates ရရှိပါမည်။
              </p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('storefront-sim')}
            className="bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition flex-shrink-0 cursor-pointer shadow-xs active:scale-95"
          >
            ဝယ်ယူမှုကို စမ်းသပ်မည်
          </button>
        </div>
      )}

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Segment: Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">မကြာသေးမီက အော်ဒါမှတ်တမ်းများ</h3>
              <p className="text-xs text-slate-500">နောက်ဆုံးဝင်ရောက်လာသော အရောင်းပြေစာမှတ်တမ်းများ</p>
            </div>
            <button 
              onClick={() => onNavigate('orders')}
              className="text-teal-600 hover:text-teal-700 text-xs font-bold cursor-pointer"
            >
              အားလုံးကြည့်ရန် →
            </button>
          </div>

          <div className="space-y-3">
            {orders.slice(0, 5).map(order => {
              const isCancelled = order.status === 'cancelled';
              const isConfirmed = order.status === 'confirmed' || order.status === 'completed' || order.status === 'shipped';
              const bgClass = isCancelled 
                ? "p-3.5 bg-rose-50/15 border border-rose-200 text-slate-400 opacity-80 flex justify-between items-center text-xs rounded-xl" 
                : isConfirmed 
                ? "p-3.5 bg-emerald-50/15 border border-emerald-250 flex justify-between items-center text-xs hover:bg-emerald-100/10 transition rounded-xl" 
                : "p-3.5 bg-slate-50 border border-slate-100 flex justify-between items-center text-xs rounded-xl";

              return (
                <div key={order.id} className={bgClass}>
                  <div className="space-y-1 my-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-800">{order.id}</span>
                      <span className="text-slate-300">|</span>
                      <span className="font-bold text-slate-700">{order.customer_name}</span>
                    </div>
                    <p className="text-slate-500 font-mono text-[10px]">{order.customer_phone}</p>
                    <p className="text-[10px] text-slate-600 line-clamp-1 max-w-[180px] sm:max-w-md">
                      {order.items.map(i => `${i.name} (${i.quantity}ခု)`).join('၊ ')}
                    </p>
                  </div>

                  <div className="text-right space-y-2">
                    <span className="font-black block text-slate-800 font-mono">{order.total_amount.toLocaleString()} Ks</span>
                    
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                        order.status === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        order.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                        order.status === 'completed' ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                        'bg-rose-100 text-rose-850 border border-rose-200'
                      }`}>
                        {order.status === 'pending' ? 'စောင့်ဆိုင်းဆဲ' :
                         order.status === 'confirmed' ? 'အတည်ပြုပြီး' :
                         order.status === 'shipped' ? 'ပို့ဆောင်ဆဲ' :
                         order.status === 'completed' ? 'ပြီးဆုံး' : 'ပယ်ဖျက်'}
                      </span>
                      
                      <button 
                        onClick={() => onSelectOrder(order)}
                        className="p-1.5 bg-white border border-slate-200 rounded-md hover:bg-slate-100 cursor-pointer text-slate-700"
                        title="ပြေစာထုတ်ရန်"
                      >
                        📄
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {orders.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs">
                မှာယူမှုအချက်အလက်များ မတွေ့သေးပါခင်ဗျာ။
              </div>
            )}
          </div>
        </div>

        {/* Right Segment: Inventory Controls & High Stock Alarm */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">လျော့နည်းစတော့ သတိပေးချက်</h3>
            <p className="text-xs text-slate-500">အရေအတွက် ၅ ထက်နည်းနေသော ပစ္စည်းများ</p>
          </div>

          <div className="space-y-3">
            {getLowStockProducts().map(prod => (
              <div key={prod.id} className="p-3 bg-rose-50/50 rounded-xl border border-rose-100/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl bg-white w-9 h-9 rounded-lg flex items-center justify-center border border-slate-100 shadow-2xs overflow-hidden">
                    {prod.image && (prod.image.startsWith('http') || prod.image.startsWith('data:image') || prod.image.startsWith('/')) ? (
                      <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      prod.image || '📦'
                    )}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-850 line-clamp-1">{prod.name}</h4>
                    <span className="text-[10px] text-rose-600 font-bold font-mono">လက်ရှိစတော့ကျန်: {prod.stock_qty} ခု</span>
                  </div>
                </div>

                <button 
                  onClick={() => onUpdateStock(prod.id, prod.stock_qty + 10)}
                  className="bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg hover:bg-rose-700 transition cursor-pointer"
                >
                  +၁၀ ဖြည့်ဆည်းရန်
                </button>
              </div>
            ))}

            {getLowStockProducts().length === 0 && (
              <div className="text-center py-12 text-emerald-700 bg-emerald-50/40 rounded-2xl border border-dashed border-emerald-100 text-xs">
                🎉 ကုန်ပစ္စည်းအားလုံးစတော့ လုံလောက်စွာရှိပါသည်။
              </div>
            )}
          </div>


        </div>

      </div>

    </div>
  );
}
