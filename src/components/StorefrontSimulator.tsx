import React, { useState } from 'react';
import { Product, Order, ShopSettings } from '../types';

interface StorefrontSimulatorProps {
  products: Product[];
  shopInfo: ShopSettings;
  onPlaceOrder: (customerName: string, customerPhone: string, address: string, paymentMethod: string, cartItems: { product_id: string, name: string, quantity: number, price: number }[]) => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function StorefrontSimulator({
  products,
  shopInfo,
  onPlaceOrder,
  onShowToast
}: StorefrontSimulatorProps) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '', payment: 'KBZPay' });
  const [simStep, setSimStep] = useState<'browse' | 'cart' | 'success'>('browse');

  const totalCartCount = Object.keys(cart).reduce((sum, key) => sum + (cart[key] || 0), 0);

  const cartItemsLists = Object.keys(cart)
    .filter(id => cart[id] > 0)
    .map(id => {
      const prod = products.find(p => p.id === id);
      return {
        product_id: id,
        name: prod?.name || 'Unknown Item',
        quantity: cart[id],
        price: prod?.price || 0
      };
    });

  const cartTotalAmount = cartItemsLists.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleAddToCart = (prod: Product) => {
    const current = cart[prod.id] || 0;
    if (current < prod.stock_qty) {
      setCart({ ...cart, [prod.id]: current + 1 });
    } else {
      onShowToast('လက်ကျန်စတော့ထက် ပိုမိုဝယ်ယူ၍မရပါခင်ဗျာ။', 'error');
    }
  };

  const handleRemoveFromCart = (prodId: string) => {
    const current = cart[prodId] || 0;
    if (current > 1) {
      setCart({ ...cart, [prodId]: current - 1 });
    } else {
      const copy = { ...cart };
      delete copy[prodId];
      setCart(copy);
    }
  };

  const handleSubmitSimulatedOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItemsLists.length === 0) {
      onShowToast('ဈေးဝယ်လှည်းထဲတွင် ပစ္စည်းမရှိသေးပါ', 'error');
      return;
    }
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      onShowToast('အချက်အလက်များကို အပြည့်အစုံ ဖြည့်စွက်ပေးပါရန်', 'error');
      return;
    }

    try {
      await onPlaceOrder(
        customerInfo.name,
        customerInfo.phone,
        customerInfo.address,
        customerInfo.payment,
        cartItemsLists
      );
      setCart({});
      setCustomerInfo({ name: '', phone: '', address: '', payment: 'KBZPay' });
      setSimStep('success');
    } catch (err) {
      console.error(err);
      onShowToast('အော်ဒါတင်ခြင်းမအောင်မြင်ပါ၊ နောက်မှပြန်စမ်းပါ', 'error');
    }
  };

  const copyStoreUrl = () => {
    const fullUrl = `https://soko.com/shop/${shopInfo.slug}`;
    navigator.clipboard.writeText(fullUrl);
    onShowToast('စတိုးလင့်ခ်ကို ကော်ပီကူးယူပြီးပါပြီ။');
  };

  return (
    <div id="storefront-simulator-view" className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      
      {/* Simulation Info Segment */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white p-5 rounded-3xl border-2 border-orange-100 shadow-sm space-y-4">
          <div className="space-y-1">
            <h3 className="font-black text-slate-900 text-base">ဝယ်ယူသူ စတိုးဆိုင်မျက်နှာစာ</h3>
            <p className="text-xs text-slate-500 leading-normal">
              ညာဘက်ရှိ မိုဘိုင်းလ်ဖုန်း အစမ်းပြကွက်သည် သင့်ဝယ်ယူသူများ လိပ်စာဖြည့်မှာယူရန် အသုံးပြုရမည့် <strong>ပြည်တွင်းသီးသန့် Online Order Form</strong> ဖြစ်သည်။
            </p>
          </div>

          <div className="bg-orange-50 border-2 border-[#FFD28E] p-3.5 rounded-2xl text-xs space-y-2.5">
            <h4 className="font-extrabold text-orange-600 flex items-center gap-1">
              <span>💡</span> စမ်းသပ်ရန် အကြံပြုချက်
            </h4>
            <ol className="list-decimal pl-4 space-y-1 text-slate-700 font-semibold">
              <li>ပစ္စည်းအချို့ဘေးရှိ <strong className="text-orange-600">+</strong> အမှတ်ကိုနှိပ်ပြီး Cart ထဲထည့်ပါ။</li>
              <li>အောက်ခြေရှိ <strong className="text-orange-600">ဝယ်ယူမည်</strong> ခလုတ်ကို နှိပ်ပါ။</li>
              <li>လိပ်စာအပြည့်အစုံ ရေးသွင်းပြီး အော်ဒါတင်ကြည့်ပါ။</li>
              <li>Firebase DB မှတစ်ဆင့် Dashboard (အော်ဒါများ) ထဲသို့ အချိန်နှင့်တပြေးညီ တိုက်ရိုက်ရောက်ရှိသွားမည်။</li>
            </ol>
          </div>

          <div className="border-t border-orange-100 pt-3 space-y-1.5">
            <span className="text-[10px] text-orange-500 font-extrabold uppercase tracking-wider block">ဝယ်ယူသူများအား မျှဝေရန် လင့်ခ်-</span>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly 
                value={`https://soko.com/shop/${shopInfo.slug}`} 
                className="bg-orange-50/50 border border-orange-200 text-xs px-3 py-2 rounded-xl flex-1 font-mono text-orange-700 focus:outline-hidden font-bold"
              />
              <button 
                onClick={copyStoreUrl}
                className="bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-600 text-xs px-3 py-2 rounded-xl transition cursor-pointer active:scale-95 font-bold"
                title="လင့်ခ်ကော်ပီ"
              >
                📋
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Smartphone viewport */}
      <div className="lg:col-span-3 flex justify-center">
        <div className="w-full max-w-[360px] bg-slate-900 rounded-[48px] p-4 shadow-2xl border-[8px] border-slate-800 relative ring-1 ring-white/10">
          
          {/* Dynamic Speaker Notch layout */}
          <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-full z-20 flex items-center justify-center gap-1.5 shadow-inner">
            <div className="w-10 h-1 bg-slate-705 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-slate-755 rounded-full"></div>
          </div>

          {/* Internal Viewport Screen */}
          <div className="bg-slate-100 w-full h-[620px] rounded-[36px] overflow-hidden relative flex flex-col pt-7 text-slate-800 font-sans selection:bg-orange-105">
            
            {simStep !== 'success' && (
              <>
                {/* Store Header bar inside smartphone */}
                <div className="bg-white px-4 py-3.5 border-b border-orange-100 sticky top-0 z-10 flex items-center justify-between">
                  <div className="max-w-[180px]">
                    <h4 className="font-extrabold text-slate-900 text-xs truncate">{shopInfo.name}</h4>
                    <span className="text-[9px] text-orange-500 font-bold uppercase tracking-wider block">Online Storefront</span>
                  </div>
                  {totalCartCount > 0 && (
                    <button 
                      onClick={() => setSimStep(simStep === 'browse' ? 'cart' : 'browse')}
                      className="bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-100 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer"
                    >
                      🛒 {totalCartCount} ခု ({cartTotalAmount.toLocaleString()} Ks)
                    </button>
                  )}
                </div>

                <div className="p-3.5 flex-1 overflow-y-auto space-y-4">
                  {/* Step A: Browse Catalog directory */}
                  {simStep === 'browse' && (
                    <div className="space-y-3">
                      <div className="bg-orange-50 border border-[#FFD28E] p-3 rounded-2xl text-center space-y-1 shadow-2xs">
                        {/* Requirement Match: Slogan dynamically displayed beautifully on Storefront header / client view */}
                        <p id="store-patriotic-slogan" className="text-xs font-black text-orange-600">
                          " ပြည်တွင်းဖြစ်ကိုအားပေးပါ "
                        </p>
                        <p className="text-[9px] text-orange-700 font-bold">မြန်မာ့လယ်ယာနှင့် တိုင်းရင်းထုတ်ကုန်သီးသန့်စတိုး</p>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {products.map(prod => {
                          const quantityInCart = cart[prod.id] || 0;
                          return (
                            <div key={prod.id} className="p-3 bg-white rounded-xl border border-orange-100 flex justify-between items-center shadow-3xs hover:border-orange-200">
                              <div className="flex gap-2.5 items-center">
                                <span className="text-2xl bg-orange-55/20 w-10 h-10 rounded-lg flex items-center justify-center border border-orange-100">{prod.image}</span>
                                <div>
                                  <h5 className="font-bold text-slate-800 text-[11px] line-clamp-1">{prod.name}</h5>
                                  <p className="text-[11.5px] font-black text-orange-600 font-mono">{prod.price.toLocaleString()} Ks</p>
                                  <p className="text-[9px] text-slate-400 font-bold">စတော့ကျန်: {prod.stock_qty} ခု</p>
                                </div>
                              </div>

                              {prod.stock_qty === 0 ? (
                                <span className="text-[9px] text-slate-500 font-bold bg-slate-100 px-2 py-1 rounded-md">ပစ္စည်းပြတ်သွားပါပြီ</span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {quantityInCart > 0 && (
                                    <button 
                                      onClick={() => handleRemoveFromCart(prod.id)}
                                      className="w-6 h-6 bg-orange-50 hover:bg-orange-100 border border-orange-200 active:scale-90 rounded-full font-black text-xs flex items-center justify-center text-orange-600 cursor-pointer"
                                    >
                                      -
                                    </button>
                                  )}
                                  {quantityInCart > 0 && <span className="text-xs font-black font-mono">{quantityInCart}</span>}
                                  <button 
                                    onClick={() => handleAddToCart(prod)}
                                    className="w-6 h-6 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-full font-black text-xs flex items-center justify-center cursor-pointer shadow-xs"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {products.length === 0 && (
                          <div className="text-center py-16 text-slate-400 text-[11px] font-bold">
                            ကုန်ပစ္စည်းစာရင်း မရှိသေးပါ။
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step B: Secure Cart details and Billing form submissions */}
                  {simStep === 'cart' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-orange-100 pb-2">
                        <h5 className="font-bold text-slate-900 text-xs">ရွေးချယ်ထားသောပစ္စည်းများ</h5>
                        <button 
                          onClick={() => setSimStep('browse')}
                          className="text-[10px] text-orange-600 font-bold cursor-pointer font-black"
                        >
                          + ထပ်ထည့်ရန်
                        </button>
                      </div>

                      {/* Purchased Items lists */}
                      <div className="space-y-2 whitespace-nowrap font-bold">
                        {cartItemsLists.map(p => (
                          <div key={p.product_id} className="flex justify-between text-[11px] py-1 border-b border-dashed border-orange-50">
                            <span className="truncate max-w-[160px]">{p.name} (x{p.quantity})</span>
                            <span className="font-extrabold text-orange-600">{(p.price * p.quantity).toLocaleString()} Ks</span>
                          </div>
                        ))}
                        
                        <div className="pt-2 flex justify-between font-black text-xs text-slate-900">
                          <span>စုစုပေါင်း ကျသင့်ငွေ</span>
                          <span className="text-orange-650 font-mono">{cartTotalAmount.toLocaleString()} Ks</span>
                        </div>
                      </div>

                      {/* Customer Info Form */}
                      <form onSubmit={handleSubmitSimulatedOrder} className="space-y-3.5 pt-3.5 border-t border-orange-100">
                        <h6 className="font-extrabold text-[9px] text-slate-400 uppercase tracking-widest">ပို့ဆောင်ရေးအချက်အလက်</h6>
                        
                        <div className="space-y-2.5 text-[11px]">
                          <div className="space-y-1">
                            <label className="block text-slate-500 font-bold">ဝယ်သူအမည် *</label>
                            <input 
                              type="text" 
                              required
                              value={customerInfo.name}
                              onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                              className="w-full bg-white border border-orange-100 rounded-xl p-2.5 text-xs outline-hidden focus:ring-1 focus:ring-orange-550"
                              placeholder="အမည်ရေးရန်"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-slate-505 font-bold">ဖုန်းနံပါတ် *</label>
                            <input 
                              type="tel" 
                              required
                              value={customerInfo.phone}
                              onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                              className="w-full bg-white border border-orange-100 rounded-xl p-2.5 text-xs outline-hidden"
                              placeholder="ဆက်သွယ်ရန်ဖုန်း"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-slate-505 font-bold">ပို့ဆောင်ရမည့်လိပ်စာ *</label>
                            <textarea 
                              required
                              value={customerInfo.address}
                              onChange={e => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                              className="w-full bg-white border border-orange-100 rounded-xl p-2.5 text-xs h-16 resize-none outline-hidden"
                              placeholder="ရပ်ကွက်၊ လမ်း၊ အိမ်နံပါတ်၊ မြို့နယ်"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-slate-505 font-bold">ငွေချေစနစ် *</label>
                            <select 
                              value={customerInfo.payment}
                              onChange={e => setCustomerInfo({ ...customerInfo, payment: e.target.value })}
                              className="w-full bg-white border border-orange-100 rounded-xl p-2.5 text-xs outline-hidden cursor-pointer font-bold"
                            >
                              <option value="KBZPay">KBZPay (ကြိုတင်ငွေလွှဲ)</option>
                              <option value="WaveMoney">WavePay (ကြိုတင်ငွေလွှဲ)</option>
                              <option value="Cash on Delivery">Cash on Delivery (အိမ်ရောက်ငွေချေ)</option>
                            </select>
                          </div>
                        </div>

                        {/* Interactive wallets instructions inside phone chassis */}
                        {customerInfo.payment !== 'Cash on Delivery' && (
                          <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 text-[10px] space-y-1 text-orange-900 leading-normal font-bold">
                            <p className="font-extrabold flex items-center gap-1 text-orange-600">🏦 KPay/Wave QR ဖြင့်ငွေလွှဲပါရန် </p>
                            <p className="font-medium">လက်ခံနံပါတ်: <strong>{shopInfo.kpay_number}</strong></p>
                            <p className="font-medium">အမည်ပေါက်: <strong>{shopInfo.kpay_name}</strong></p>
                            <div className="w-16 h-16 bg-white mx-auto border border-orange-200 flex items-center justify-center font-bold text-[8px] text-slate-350 rounded mt-1.5 shadow-2xs">
                              [ QR Code ]
                            </div>
                          </div>
                        )}

                        <button 
                          type="submit"
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10.5px] py-2 rounded-lg transition cursor-pointer shadow-xs active:scale-98"
                        >
                          အော်ဒါတင်မည် (Confirm Order)
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Smartphone Viewport Floating Banner */}
                {simStep === 'browse' && totalCartCount > 0 && (
                  <div className="p-3 bg-white border-t border-orange-100 sticky bottom-0 flex justify-between items-center shadow-md">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">ကျသင့်ငွေ</span>
                      <span className="font-black text-orange-600 text-xs font-mono">
                        {cartTotalAmount.toLocaleString()} Ks
                      </span>
                    </div>
                    <button 
                      onClick={() => setSimStep('cart')}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10.5px] px-4 py-1.5 rounded-lg cursor-pointer"
                    >
                      မှာယူရန် ရှေ့သို့ →
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Simulated Checkout Success Screen */}
            {simStep === 'success' && (
              <div className="p-6 text-center space-y-5 my-auto">
                <div className="w-16 h-16 bg-orange-50 border border-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-xs">
                  🎉
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm">အော်ဒါအောင်မြင်စွာ တင်ပြီးပါပြီ။</h4>
                  <p className="text-xs text-slate-500 leading-normal max-w-xs mx-auto font-medium">
                    အော်ဒါစာရင်းသွင်း ရရှိပြီးပါပြီ။ {shopInfo.name} ဆိုင်ရှင်မှ လူကြီးမင်းထံ ဆက်သွယ်ပြီး ပစ္စည်းအရောက်ပို့ဆောင်မှုကို အတည်ပြုပေးပါမည်သူ။
                  </p>
                </div>

                {/* Slogan displays gracefully on Success page too */}
                <span className="inline-block text-[10px] text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full font-bold">
                  “ ပြည်တွင်းဖြစ်ကို တန်ဖိုးထားပေးမှု ကျေးဇူးတင်ပါသည် ”
                </span>

                <button 
                  onClick={() => setSimStep('browse')}
                  className="bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-600 font-bold text-[10px] px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  နောက်တစ်ခေါက် စမ်းသပ်မည့် ဆိုင်သို့ပြန်သွားမည်
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

    </div>
  );
}
