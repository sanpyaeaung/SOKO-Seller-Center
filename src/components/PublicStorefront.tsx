import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { Product, ShopSettings, Order, OrderItem } from '../types';

interface PublicStorefrontProps {
  shopSlug: string;
}

export default function PublicStorefront({ shopSlug }: PublicStorefrontProps) {
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cart and checkout states
  const [cart, setCart] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('အားလုံး');
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '', payment: 'KBZPay' });
  const [checkoutStep, setCheckoutStep] = useState<'browse' | 'cart' | 'success'>('browse');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New receipts and unlimited banking/wallet states
  const [paymentSlipImage, setPaymentSlipImage] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('cod');

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit to guard Firestore limits
        alert('ပုံအရွယ်အစား အရမ်းကြီးလွန်းပါသည်၊ ကျေးဇူးပြု၍ 2MB အောက်ရှိ ပုံကို ထည့်သွင်းပေးပါခင်ဗျာ။');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentSlipImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fetch shop settings & products upon load
  useEffect(() => {
    async function loadStorefront() {
      try {
        setLoading(true);
        // Step 1: Query the shop settings by matching slug
        const settingsQuery = query(
          collection(db, 'shop_settings'),
          where('slug', '==', shopSlug)
        );
        const settingsSnap = await getDocs(settingsQuery);

        if (settingsSnap.empty) {
          setErrorMsg('ယခု ဝင်ရောက်ထားသော ဆိုင်လိပ်စာ မမှန်ကန်ပါ သို့မဟုတ် ရှာမတွေ့ပါခင်ဗျာ။');
          setLoading(false);
          return;
        }

        const retrievedSettings = settingsSnap.docs[0].data() as ShopSettings;
        setShopSettings(retrievedSettings);

        // Step 2: Query products associated with store owner UID
        const productsQuery = query(
          collection(db, 'products'),
          where('owner_uid', '==', retrievedSettings.owner_uid)
        );
        const productsSnap = await getDocs(productsQuery);
        const fetchedProducts: Product[] = [];
        productsSnap.forEach(docSnap => {
          fetchedProducts.push(docSnap.data() as Product);
        });

        setProducts(fetchedProducts);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setErrorMsg('အချက်အလက်များ ဆွဲယူစဉ် ချို့ယွင်းချက်ရှိနေပါသည်။ ကွန်ရက်အဆက်အသွယ် ထပ်မံစစ်ဆေးပေးပါ။');
        setLoading(false);
      }
    }

    if (shopSlug) {
      loadStorefront();
    }
  }, [shopSlug]);

  // Derived category lists
  const categories = useMemo(() => {
    const list = new Set<string>();
    products.forEach(p => {
      if (p.category) list.add(p.category);
    });
    return ['အားလုံး', ...Array.from(list)];
  }, [products]);

  // Filter products based on category & search
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'အားလုံး' || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart aggregations
  const totalCartCount = Object.keys(cart).reduce((sum, id) => sum + (cart[id] || 0), 0);
  
  const cartItemsLists = Object.keys(cart)
    .filter(id => cart[id] > 0)
    .map(id => {
      const prod = products.find(p => p.id === id);
      return {
        product_id: id,
        name: prod?.name || 'Unknown Item',
        quantity: cart[id],
        price: prod?.price || 0,
        image: prod?.image || '📦'
      };
    });

  const cartTotalAmount = cartItemsLists.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleAddToCart = (prod: Product) => {
    const current = cart[prod.id] || 0;
    if (current < prod.stock_qty) {
      setCart({ ...cart, [prod.id]: current + 1 });
    } else {
      alert(`လက်ကျန်စတော့ထက် ပိုမိုဝယ်ယူ၍မရပါခင်ဗျာ။ (အများဆုံးစတော့: ${prod.stock_qty})`);
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

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopSettings) return;
    if (cartItemsLists.length === 0) {
      alert('ဈေးဝယ်လှည်းထဲတွင် ဝယ်ယူမည့် ကုန်ပစ္စည်းမရှိသေးပါ');
      return;
    }
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      alert('အမှာစာ ပေးပို့နိုင်ရန် အချက်အလက်ကို အပြည့်အစုံ ဖြည့်စွက်ပေးပါရန်');
      return;
    }

    // Require payment slip if bank/wallet transfer is chosen
    if (selectedAccountId !== 'cod' && !paymentSlipImage) {
      alert('⚠️ ကျေးဇူးပြု၍ မိုဘိုင်းလ်ဘဏ်စနစ်ဖြင့် ငွေလွှဲပြေစာ / ငွေလွှဲဖြတ်ပိုင်းပုံအား ပူးတွဲထည့်သွင်းပေးပါရန်ခင်ဗျာ။');
      return;
    }

    setIsSubmitting(true);
    const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);

    // Resolve name of payment method
    let methodLabel = 'Cash on Delivery';
    if (selectedAccountId !== 'cod') {
      if (selectedAccountId === 'legacy-kpay') {
        methodLabel = `KBZPay (${shopSettings.kpay_number})`;
      } else {
        const foundAcc = shopSettings.payment_accounts?.find(a => a.id === selectedAccountId);
        if (foundAcc) {
          methodLabel = `${foundAcc.provider} (${foundAcc.account_number})`;
        }
      }
    }

    const orderPayload: Order = {
      id: orderId,
      customer_name: customerInfo.name,
      customer_phone: customerInfo.phone,
      address: customerInfo.address,
      items: cartItemsLists.map(p => ({
        product_id: p.product_id,
        name: p.name,
        quantity: p.quantity,
        price: p.price
      })),
      total_amount: cartTotalAmount,
      status: 'pending',
      payment_method: methodLabel,
      payment_account_id: selectedAccountId !== 'cod' ? selectedAccountId : undefined,
      payment_slip_image: paymentSlipImage || undefined,
      created_at: new Date().toISOString(),
      owner_uid: shopSettings.owner_uid
    };

    try {
      // Create guest order inside Firebase
      await setDoc(doc(db, 'orders', orderId), orderPayload);
      
      // Clear Cart state on successful purchase
      setCart({});
      setPaymentSlipImage('');
      setCheckoutStep('success');
    } catch (err) {
      console.error(err);
      alert('အမှာစာတင်သွင်းခြင်း ချို့ယွင်းချက် ဖြစ်သွားပါသည်၊ သင့်အင်တာနက်လိုင်းအား ပြန်လည်စစ်ဆေးပြီး နောက်တစ်ခေါက် ထပ်မံကြိုးစားပေးပါခင်ဗျာ။');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center select-none">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-extrabold mt-5 tracking-tight">ဆိုင်အလှပြင်ဆိုင်မျက်နှာစာများ တည်ဆောက်နေဆဲ...</p>
        <p className="text-[10px] text-zinc-400 mt-1 font-semibold font-mono">Connecting with SOKO cloud firebase...</p>
      </div>
    );
  }

  // Render Errors mapping
  if (errorMsg || !shopSettings) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-600 text-3xl font-bold shadow-xs">
          ⚠️
        </div>
        <h3 className="font-black text-slate-900 border-b border-rose-100 pb-3 mt-4 text-base">ဝင်ရောက်ခွင့်မရရှိပါသဖြင့် စိတ်မကောင်းပါ။</h3>
        <p className="text-xs text-slate-550 max-w-sm mt-3 font-semibold leading-relaxed">
          {errorMsg || 'ဆောင်ရွက်ဆဲ အချက်အလက် ချွတ်ယွင်းမှု တစ်ခုရှိနေပါသည်။'}
        </p>
        <a 
          href="/"
          className="mt-6 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl block cursor-pointer shadow-xs active:scale-95 transition"
        >
          SOKO မူလစာမျက်နှာသို့ သွားမည်
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans relative">
      
      {/* Visual Header Identity */}
      <header className="bg-white border-b-2 border-[#FFD28E] sticky top-0 z-40 px-4 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-black text-xl shadow-xs">
              S
            </div>
            <div>
              <h1 className="text-xs font-black text-slate-900 leading-none truncate max-w-[200px] sm:max-w-xs">
                {shopSettings.name}
              </h1>
              <span className="text-[8.5px] text-orange-500 font-extrabold uppercase tracking-wide">Online Ordering Storefront</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[10px] text-orange-650 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full font-bold">
              “ ပြည်တွင်းဖြစ်ကိုအားပေးပါ ”
            </span>
            {totalCartCount > 0 && checkoutStep === 'browse' && (
              <button 
                onClick={() => setCheckoutStep('cart')}
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-md cursor-pointer animate-pulse active:scale-95 transition"
              >
                🛒 ခြင်းတောင်းထဲကြည့်မည် ({totalCartCount} ခု)
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Responsive Grid Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">

        {/* Patriotic banner inside customer view */}
        <div className="bg-orange-50 border-2 border-[#FFD28E] p-4 rounded-2xl text-center space-y-1 shadow-3xs">
          <p className="text-xs sm:text-sm font-black text-orange-600 block">
            🇲🇲 " ပြည်တွင်းဖြစ်ကိုအားပေးပါ "
          </p>
          <p className="text-[10px] sm:text-xs text-orange-700 font-bold leading-normal">
            ပြည်တွင်းထွက်ကုန်များနှင့် ဒေသထွက်စားသောက်ကုန်များအား အလွယ်တကူ မှာခွင့်ရစနစ် တိုက်ရိုက်အော်ဒါတင်ပါ။
          </p>
        </div>

        {checkoutStep === 'browse' && (
          <div className="space-y-6">
            {/* Filter and Search Ribbon */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-205 shadow-3xs">
              {/* Search Bar */}
              <div className="relative flex-1">
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ပစ္စည်းအမည်ဖြင့် ရှာဖွေပါ..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 outline-hidden font-bold"
                />
                <span className="absolute left-3 top-2 text-slate-400 font-semibold text-xs select-none">🔍</span>
              </div>

              {/* Categories badge scrollable tabs */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5 sm:pb-0">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      selectedCategory === cat 
                        ? 'bg-orange-500 text-white shadow-xs' 
                        : 'bg-slate-50 hover:bg-orange-50 text-slate-650'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products grid lists */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map(prod => {
                const quantityInCart = cart[prod.id] || 0;
                const isUrlImage = prod.image && (prod.image.startsWith('http') || prod.image.startsWith('data:image') || prod.image.startsWith('/'));

                return (
                  <div key={prod.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between gap-4.5 shadow-3xs hover:border-orange-200 transition-all">
                    <div className="flex gap-3">
                      <span className="text-3xl bg-orange-50/20 w-12 h-12 rounded-xl flex items-center justify-center border border-orange-100 shadow-3xs flex-shrink-0 overflow-hidden select-none">
                        {isUrlImage ? (
                          <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          prod.image || '📦'
                        )}
                      </span>
                      <div className="space-y-1">
                        {prod.category && (
                          <span className="inline-block text-[9px] bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-full font-bold">
                            {prod.category}
                          </span>
                        )}
                        <h4 className="font-extrabold text-slate-900 text-xs leading-snug line-clamp-2">{prod.name}</h4>
                        <p className="font-black text-orange-600 text-[13px] font-mono">{prod.price.toLocaleString()} Ks</p>
                        <p className="text-[9.5px] text-slate-400 font-bold">စတော့ကျန်: {prod.stock_qty} ခု</p>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-50 flex items-center justify-between text-xs">
                      {prod.stock_qty <= 0 ? (
                        <span className="text-[10px] text-zinc-400 bg-zinc-100 px-2.5 py-1.5 rounded-lg font-bold w-full text-center">
                          ပစ္စည်းကုန်သွားပါပြီခင်ဗျာ
                        </span>
                      ) : (
                        <>
                          <span className="text-[10.5px] text-slate-500 font-semibold">မှာယူမှုအရေအတွက်</span>
                          <div className="flex items-center gap-2">
                            {quantityInCart > 0 && (
                              <button 
                                onClick={() => handleRemoveFromCart(prod.id)}
                                className="w-6.5 h-6.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 active:scale-90 rounded-full font-black text-xs flex items-center justify-center text-orange-600 cursor-pointer"
                              >
                                -
                              </button>
                            )}
                            {quantityInCart > 0 && <span className="text-xs font-black font-mono px-0.5">{quantityInCart}</span>}
                            <button 
                              onClick={() => handleAddToCart(prod)}
                              className="w-6.5 h-6.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-full font-black text-xs flex items-center justify-center cursor-pointer shadow-xs"
                            >
                              +
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-24 bg-white rounded-2xl border border-slate-200 shadow-3xs text-slate-400 text-xs font-bold space-y-2">
                  <p>🔍 သင့်ရှာဖွေမှုနှင့် ကိုက်ညီသော ကုန်ပစ္စည်းမရှိသေးပါခင်ဗျာ။</p>
                  <p className="text-[10px] text-zinc-405 font-medium">စာလုံးပေါင်း သို့မဟုတ် အမျိုးအစားများကို ပြင်ဆင်ရှာဖွေပေးပါ</p>
                </div>
              )}
            </div>
          </div>
        )}

        {checkoutStep === 'cart' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <span>🛒</span> ခြင်းတောင်းထဲရှိ ကုန်ပစ္စည်းများ စစ်ဆေးရန်
              </h3>
              <button 
                onClick={() => setCheckoutStep('browse')}
                className="text-xs text-orange-600 font-extrabold hover:underline cursor-pointer"
              >
                ← ဆက်လက်ဝယ်ယူဦးမည်
              </button>
            </div>

            {/* List of items in cart */}
            <div className="space-y-3.5">
              {cartItemsLists.map(p => {
                const isUrlImage = p.image && (p.image.startsWith('http') || p.image.startsWith('data:image') || p.image.startsWith('/'));
                return (
                  <div key={p.product_id} className="flex justify-between items-center text-xs pb-3 border-b border-dashed border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 h-9 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-lg overflow-hidden flex-shrink-0 select-none">
                        {isUrlImage ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          p.image || '📦'
                        )}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-slate-800 line-clamp-1 max-w-[150px] sm:max-w-md">{p.name}</h4>
                        <span className="text-[10.5px] font-mono text-zinc-405 font-bold">x{p.quantity} ခု (နှုန်း: {p.price.toLocaleString()} Ks)</span>
                      </div>
                    </div>
                    
                    <span className="font-black text-orange-600 font-mono text-[13px]">
                      {(p.price * p.quantity).toLocaleString()} Ks
                    </span>
                  </div>
                );
              })}

              <div className="pt-2 flex justify-between font-black text-sm text-slate-900 border-t border-slate-100">
                <span>စုစုပေါင်း ကျသင့်ငွေ</span>
                <span className="text-orange-650 font-mono text-[15px]">{cartTotalAmount.toLocaleString()} Ks</span>
              </div>
            </div>

            {/* Shipping Submission Form */}
            <form onSubmit={handleCheckoutSubmit} className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="font-black text-[#8A4A00] text-xs uppercase tracking-wider">📦 ငွေချေလှမ်းမှုနှင့် လိပ်စာ အချက်အလက်ဖြည့်ရန်</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                <div className="space-y-1">
                  <label className="block text-slate-500">ဝယ်ယူသူအမည် *</label>
                  <input 
                    type="text" 
                    required
                    value={customerInfo.name}
                    onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:bg-white outline-hidden font-bold"
                    placeholder="လူကြီးမင်းအမည် ရေးသားပေးပါ"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-505">ဆက်သွယ်ရန်ဖုန်းနံပါတ် *</label>
                  <input 
                    type="tel" 
                    required
                    value={customerInfo.phone}
                    onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:bg-white outline-hidden font-bold"
                    placeholder="ဥပမာ- ၀၉၄၅၀၀၁၁၂၂၃"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-slate-505">ပစ္စည်းပို့ဆောင်ရမည့်လိပ်စာအပြည့်အစုံ *</label>
                  <textarea 
                    required
                    value={customerInfo.address}
                    onChange={e => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 h-20 resize-none focus:bg-white outline-hidden font-bold leading-relaxed"
                    placeholder="အိမ်နံပါတ်၊ လမ်း၊ ရပ်ကွက်၊ မြို့နယ်၊ တိုင်းဒေသကြီး"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-slate-505">ငွေချေစနစ် ရွေးချယ်ရန် *</label>
                  <select 
                    value={selectedAccountId}
                    onChange={e => {
                      setSelectedAccountId(e.target.value);
                      if (e.target.value === 'cod') setPaymentSlipImage('');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:bg-white outline-hidden cursor-pointer font-bold font-sans"
                  >
                    <option value="cod">Cash on Delivery (အိမ်ရောက်မှ ငွေချေစနစ်)</option>
                    
                    {/* Dynamic payment accounts registered by the merchant */}
                    {(shopSettings.payment_accounts || []).map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.provider} - {acc.account_number} ({acc.account_name})
                      </option>
                    ))}

                    {/* Fallback legacy account if no dynamic accounts exist */}
                    {(!shopSettings.payment_accounts || shopSettings.payment_accounts.length === 0) && shopSettings.kpay_number && (
                      <option value="legacy-kpay">
                        KBZPay - {shopSettings.kpay_number} ({shopSettings.kpay_name})
                      </option>
                    )}
                  </select>
                </div>
              </div>

              {/* Dynamic QR / Mobile banking information card and Slip upload prompt */}
              {selectedAccountId !== 'cod' && (
                <div className="p-4.5 bg-orange-50/40 rounded-2xl border border-orange-200 space-y-4 animate-fade-in text-slate-800 font-sans">
                  <div className="flex items-center justify-between border-b border-orange-200/50 pb-2">
                    <h5 className="font-extrabold text-orange-700 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                      🏦 ငွေလွှဲပေးချေရန် အကောင့်အချက်အလက်
                    </h5>
                    <span className="text-[10px] bg-orange-100/80 text-orange-700 px-2.5 py-0.5 rounded-full font-black">
                      ကြိုတင်ငွေလွှဲရပါမည်
                    </span>
                  </div>

                  {(() => {
                    const acc = shopSettings.payment_accounts?.find(a => a.id === selectedAccountId);
                    const isLegacy = selectedAccountId === 'legacy-kpay';
                    const provider = isLegacy ? 'KBZPay' : (acc?.provider || '');
                    const number = isLegacy ? shopSettings.kpay_number : (acc?.account_number || '');
                    const name = isLegacy ? shopSettings.kpay_name : (acc?.account_name || '');

                    return (
                      <div className="bg-white/80 p-3.5 rounded-xl border border-orange-100/50 space-y-2 text-xs font-bold leading-normal">
                        <div className="flex justify-between items-center text-[11px] text-slate-500">
                          <span>ငွေလွှဲအမျိုးအစား:</span>
                          <span className="bg-orange-500 text-white px-2 py-0.5 rounded-md font-black">{provider}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-700 font-medium">
                          <span>ငွေလွှဲရမည့်နံပါတ် / အကောင့်:</span>
                          <span className="text-orange-650 tracking-wide font-mono text-sm font-black">{number}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-700 font-medium">
                          <span>အကောင့်အမည်ပေါက်:</span>
                          <span className="text-slate-900 font-black">{name}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Payment Receipt Upload Widget */}
                  <div className="pt-2">
                    <label className="block text-slate-700 font-extrabold text-[11px] mb-2">📸 ငွေလွှဲပြေစာ ဖြတ်ပိုင်းတင်သွင်းရန် (မဖြစ်မနေလိုအပ်သည်) *</label>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {paymentSlipImage ? (
                        <div className="relative w-28 h-28 bg-white border-2 border-orange-200 rounded-2xl overflow-hidden shadow-2xs flex-shrink-0">
                          <img src={paymentSlipImage} className="w-full h-full object-cover" alt="ငွေလွှဲပြေစာ ဖြတ်ပိုင်း" />
                          <button
                            type="button"
                            onClick={() => setPaymentSlipImage('')}
                            className="absolute top-1 right-1 w-6 h-6 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-black text-xs flex items-center justify-center cursor-pointer shadow-md select-none border border-white"
                            title="ပုံဖျက်မည်"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="w-28 h-28 bg-orange-100/30 border-2 border-dashed border-orange-200 text-orange-400 rounded-2xl flex flex-col justify-center items-center text-center p-2 flex-shrink-0 select-none">
                          <span className="text-2xl">🧾</span>
                          <span className="text-[9px] font-black mt-1 leading-tight text-orange-600">ပြေစာ စလစ်ပုံ</span>
                        </div>
                      )}

                      <div className="flex-1 w-full">
                        <label className="w-full bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-200 rounded-xl px-4 py-3 cursor-pointer transition flex items-center justify-center gap-2 text-center shadow-3xs active:scale-95">
                          <span className="text-base select-none">📁</span>
                          <div>
                            <p className="text-[11px] font-black text-slate-705 text-left">ငွေလွှဲပြေစာဓာတ်ပုံ တင်သွင်းရန်</p>
                            <p className="text-[9px] text-zinc-400 font-semibold text-left mt-0.5">ဓာတ်ပုံရိုက်ပြီး သို့မဟုတ် စခရင်ရှော့ပုံ တင်နိုင်ပါသည်</p>
                          </div>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleReceiptChange}
                            className="hidden" 
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button 
                  type="button" 
                  onClick={() => setCheckoutStep('browse')}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 text-xs rounded-xl cursor-pointer text-center"
                >
                  ကုန်ပစ္စည်းများ ပြန်လည်ရွေးမည်
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-250 text-white font-extrabold py-3 text-xs rounded-xl cursor-pointer shadow-lg shadow-orange-500/10 transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    'အော်ဒါ အချက်အလက်များ သိမ်းဆည်းနေပါသည်...'
                  ) : (
                    'အမှာစာကို အပြီးသတ်တင်မည် (Place Order) 🛍️'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {checkoutStep === 'success' && (
          <div className="bg-white rounded-3xl border border-slate-250 p-8 text-center space-y-6 max-w-md mx-auto shadow-md animate-fade-in my-12">
            <div className="w-16 h-16 bg-orange-50 border border-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto text-4xl shadow-xs animate-bounce">
              🎉
            </div>
            <div className="space-y-2">
              <h3 className="font-black text-slate-900 text-base">ဝယ်ယူမှု အော်ဒါတင်ခြင်း အောင်မြင်ပါသည်ခင်ဗျာ။</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                လူကြီးမင်း၏ အော်ဒါစာရင်းသွင်း လက်ခံရရှိပြီးပါပြီ။ {shopSettings.name} ဆိုင်ရှင်ဖြစ်သူမှ အမှာစာအား အတည်ပြုရန် ဆက်သွယ်ပေးပါလိမ့်မည်။
              </p>
            </div>

            <span className="inline-block text-[10px] sm:text-xs text-orange-655 bg-orange-50/50 border border-orange-100 px-3 py-1.5 rounded-full font-black leading-none">
              “ ပြည်တွင်းဖြစ်ကို တန်ဖိုးထားအားပေးမှု ကျေးဇူးတင်ပါသည် ”
            </span>

            <button 
              onClick={() => setCheckoutStep('browse')}
              className="w-full bg-orange-500 hover:bg-orange-655 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer active:scale-95 shadow-md shadow-orange-500/5 block text-center"
            >
              ဆိုင်သို့ ပြန်သွားမည်
            </button>
          </div>
        )}

      </main>

      {/* Structured Customer View Footer */}
      <footer className="bg-slate-800 text-slate-400 text-center py-6 mt-12 border-t border-slate-700 text-[10px] font-bold space-y-1 bg-linear-to-b from-slate-800 to-slate-900">
        <p className="text-slate-350">👨‍💻 {shopSettings.name} — တိုက်ရိုက် မှာယူမှုစနစ်</p>
        <p className="text-[9px] text-slate-500"> Powered by SOKO Cloud Software Platform 🇲🇲 ပြည်တွင်းဖြစ်ကိုဦးစားပေးပါ</p>
      </footer>

    </div>
  );
}
