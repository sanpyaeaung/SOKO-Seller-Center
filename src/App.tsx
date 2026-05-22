/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from './firebase';
import { Product, Order, ShopSettings, OrderItem } from './types';

// Components
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import OrdersManager from './components/OrdersManager';
import InventoryCatalog from './components/InventoryCatalog';
import StorefrontSimulator from './components/StorefrontSimulator';
import ShopSettingsView from './components/ShopSettingsView';
import SalesReportView from './components/SalesReportView';
import InstallPrompt from './components/InstallPrompt';
import PublicStorefront from './components/PublicStorefront';

// Fallback initial data for new sellers (Req: complete initial onboarding data)
const MOCK_INITIAL_PRODUCTS_FOR = (ownerUid: string): Product[] => [
  { id: 'p_teal_mix', name: 'Premium Myanmar Tea Mix (30 Packs)', price: 8500, stock_qty: 45, image: '☕', category: 'စားသောက်ကုန်', owner_uid: ownerUid },
  { id: 'p_shan_noodle', name: 'Shan Traditional Noodle (Instant Packing)', price: 3200, stock_qty: 4, image: '🍜', category: 'စားသောက်ကုန်', owner_uid: ownerUid },
  { id: 'p_cotton_tshirt', name: 'Premium Cotton Unisex T-Shirt (Free Size)', price: 15000, stock_qty: 80, image: '👕', category: 'အဝတ်အထည်', owner_uid: ownerUid },
  { id: 'p_honey', name: 'Organic Honey (500ml pure natural nectar)', price: 12000, stock_qty: 12, image: '🍯', category: 'စားသောက်ကုန်', owner_uid: ownerUid }
];

const DEFAULT_SHOP_SETTINGS_FOR = (ownerUid: string): ShopSettings => ({
  owner_uid: ownerUid,
  name: 'ရွှေမြန်မာ အွန်လိုင်းစတိုး',
  phone: '09955123456',
  address: 'ရန်ကုန်မြို့၊ မြန်မာနိုင်ငံ။',
  kpay_number: '09955123456',
  kpay_name: 'U Kyaw Kyaw',
  slug: 'shwemyanmar'
});

export default function App() {
  // Check if we are visiting as a public customer for a specific shop slug
  const [publicShopSlug] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get('shop');
  });

  // Authentication & Global states
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dbLoading, setDbLoading] = useState(false);

  // Firestore Collections data states
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);

  // UI State toggles
  const [activeTab, setActiveTab] = useState<string>('dashboard'); // dashboard, orders, inventory, storefront-sim, settings
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null); // modal preview for POS receipts
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // New Product Form State
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock_qty: '', image: '📦', category: 'စားသောက်ကုန်' });

  // Toast notifier helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 1. Listen to Auth State changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        showToast(`${user.displayName || 'ရောင်းသူ'} ဝင်ရောက်မှု အောင်မြင်ပါသည်။`);
      } else {
        // Reset local data states upon signing out
        setProducts([]);
        setOrders([]);
        setShopSettings(null);
        setActiveTab('dashboard');
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Real-time Firebase Sync logic when logged in
  useEffect(() => {
    if (!currentUser) return;

    setDbLoading(true);
    const uid = currentUser.uid;

    // Check & Initialize Shop Settings inside Firestore if empty
    const settingsDocRef = doc(db, 'shop_settings', uid);
    getDoc(settingsDocRef).then((snap) => {
      if (!snap.exists()) {
        const initialSettings = DEFAULT_SHOP_SETTINGS_FOR(uid);
        setDoc(settingsDocRef, initialSettings)
          .then(() => {
            // Also seed sample products to make onboarding amazing!
            const sampleProducts = MOCK_INITIAL_PRODUCTS_FOR(uid);
            sampleProducts.forEach((p) => {
              setDoc(doc(db, 'products', p.id), p);
            });
          })
          .catch((err) => handleFirestoreError(err, OperationType.WRITE, `shop_settings/${uid}`));
      }
    });

    // Sub A: Synchronous Real-time Product Catalog Listener
    const productQuery = query(collection(db, 'products'), where('owner_uid', '==', uid));
    const unsubscribeProducts = onSnapshot(productQuery, (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Product);
      });
      setProducts(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    // Sub B: Synchronous Real-time Orders Listener (Sellers see their own orders)
    const orderQuery = query(collection(db, 'orders'), where('owner_uid', '==', uid));
    const unsubscribeOrders = onSnapshot(orderQuery, (snapshot) => {
      const items: Order[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Order);
      });
      // Sort orders descending (by newest first)
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOrders(items);
      setDbLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setDbLoading(false);
    });

    // Sub C: Synchronous Real-time Shop Identity Listener
    const unsubscribeSettings = onSnapshot(doc(db, 'shop_settings', uid), (docSnap) => {
      if (docSnap.exists()) {
        setShopSettings(docSnap.data() as ShopSettings);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `shop_settings/${uid}`);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
      unsubscribeSettings();
    };
  }, [currentUser]);

  // Handle errors displayed to user
  const handleAuthError = (msg: string) => {
    showToast(msg, 'error');
  };

  // Action: Add new product onto Firebase
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!newProduct.name || !newProduct.price || !newProduct.stock_qty) {
      showToast('ကုန်ပစ္စည်းအချက်အလက်ကို အပြည့်အစုံ ဖြည့်စွက်ပေးပါရန်', 'error');
      return;
    }

    const productId = 'p_' + Date.now();
    const itemPayload: Product = {
      id: productId,
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      stock_qty: parseInt(newProduct.stock_qty, 10),
      image: newProduct.image,
      category: newProduct.category,
      owner_uid: currentUser.uid
    };

    try {
      await setDoc(doc(db, 'products', productId), itemPayload);
      setNewProduct({ name: '', price: '', stock_qty: '', image: '📦', category: 'စားသောက်ကုန်' });
      setShowAddProductModal(false);
      showToast('ကုန်ပစ္စည်းအသစ်ကို Firestore တွင် သိမ်းဆည်းပြီးပါပြီ။');
    } catch (err) {
      const customErr = handleFirestoreError(err, OperationType.CREATE, `products/${productId}`);
      showToast('ကုန်ပစ္စည်းထည့်သွင်းခြင်း မအောင်မြင်ပါ', 'error');
    }
  };

  // Action: Modify stock level (e.g. plus / minus button triggers)
  const handleUpdateStockLevel = async (productId: string, newQty: number) => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        stock_qty: Math.max(0, newQty)
      });
      showToast('လက်ကျန်စာရင်းကို အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ။');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${productId}`);
      showToast('စတော့ပြုပြင်ခြင်း မအောင်မြင်ပါ', 'error');
    }
  };

  // Action: Handle Order Stage Workflow Transformations
  const handleChangeOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      
      const MyanmarStatus = 
        newStatus === 'confirmed' ? 'အတည်ပြုပြီး' :
        newStatus === 'shipped' ? 'ပို့ဆောင်ဆဲ' :
        newStatus === 'completed' ? 'အောင်မြင်' : 'ပယ်ဖျက်';

      showToast(`အော်ဒါ #${orderId} ကို "${MyanmarStatus}" သို့ ပြောင်းလဲပြီးပါပြီ။`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
      showToast('အော်ဒါအခြေအနေပြောင်းလဲမှုမအောင်မြင်ပါ', 'error');
    }
  };

  // Action: Customer checkout simulation (Order Form submits)
  const handlePlaceStorefrontOrder = async (
    customerName: string,
    customerPhone: string,
    address: string,
    paymentMethod: string,
    cartItems: OrderItem[],
    paymentSlipImage?: string,
    paymentAccountId?: string
  ) => {
    if (!currentUser) return;

    const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
    const cartTotalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const orderPayload: Order = {
      id: orderId,
      customer_name: customerName,
      customer_phone: customerPhone,
      address,
      items: cartItems,
      total_amount: cartTotalPrice,
      status: 'pending',
      payment_method: paymentMethod,
      payment_slip_image: paymentSlipImage || undefined,
      payment_account_id: paymentAccountId || undefined,
      created_at: new Date().toISOString(),
      owner_uid: currentUser.uid
    };

    try {
      // 1. Submit the Order onto Firebase
      await setDoc(doc(db, 'orders', orderId), orderPayload);

      // 2. Decrement corresponding stock levels inside Firestore
      for (const item of cartItems) {
        const prod = products.find(p => p.id === item.product_id);
        if (prod) {
          const decrementedQty = Math.max(0, prod.stock_qty - item.quantity);
          await updateDoc(doc(db, 'products', item.product_id), {
            stock_qty: decrementedQty
          });
        }
      }

      showToast('အော်ဒါအသစ်တစ်ခု မှာယူပြီးမြောက်ပါပြီ။ (SaaS Firebase sync updated)');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `orders/${orderId}`);
      throw err;
    }
  };

  // Action: Save customized Shop Settings
  const handleSaveShopSettings = async (updated: ShopSettings) => {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, 'shop_settings', currentUser.uid), updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `shop_settings/${currentUser.uid}`);
      throw err;
    }
  };

  // View Loader
  if (publicShopSlug) {
    return <PublicStorefront shopSlug={publicShopSlug} />;
  }

  // View Loader
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-bold mt-4 font-mono">Loading SOKO PWA cloud auth...</p>
      </div>
    );
  }

  // View Login Screen
  if (!currentUser) {
    return <LoginScreen onLoginError={handleAuthError} />;
  }

  // Active settings profile fallback
  const resolvedSettings = shopSettings || DEFAULT_SHOP_SETTINGS_FOR(currentUser.uid);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans pb-6 mb-0 relative animate-fade-in">
      
      {/* Header bar modularity with menu state */}
      <Header 
        user={currentUser} 
        shopName={resolvedSettings.name} 
        shopSlug={resolvedSettings.slug} 
        activeTab={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setSelectedOrder(null);
        }}
      />

      {/* Global Toast Notifier - repositioned to bottom-6 for clean layout since dock is removed */}
      {toast && (
        <div className={`fixed bottom-6 right-4 z-[100] flex items-center gap-2.5 px-4.5 py-3.5 rounded-xl shadow-lg border transition-all duration-300 transform scale-100 text-xs font-semibold ${
          toast.type === 'error' 
            ? 'bg-rose-50 border-rose-200 text-rose-800' 
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <span className="text-base">{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Core Body Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Automatic installation banner promo (Req: auto install prompt appears if available) */}
        <InstallPrompt />

        {/* Clean, zero-clutter workspace with synced cloud database state */}

        {/* Tab switcher renderer */}
        {activeTab === 'dashboard' && (
          <Dashboard 
            products={products}
            orders={orders}
            onNavigate={(tab) => setActiveTab(tab)}
            onUpdateStock={handleUpdateStockLevel}
            onSelectOrder={(order) => setSelectedOrder(order)}
            onChangeOrderStatus={handleChangeOrderStatus}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersManager 
            orders={orders}
            onChangeOrderStatus={handleChangeOrderStatus}
            onSelectOrder={(order) => setSelectedOrder(order)}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryCatalog 
            products={products}
            onUpdateStock={handleUpdateStockLevel}
            onOpenAddModal={() => setShowAddProductModal(true)}
          />
        )}

        {activeTab === 'storefront-sim' && (
          <StorefrontSimulator 
            products={products}
            shopInfo={resolvedSettings}
            onPlaceOrder={handlePlaceStorefrontOrder}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'settings' && (
          <ShopSettingsView 
            settings={resolvedSettings}
            onSaveSettings={handleSaveShopSettings}
            onShowToast={showToast}
            user={currentUser}
          />
        )}

        {activeTab === 'reports' && (
          <SalesReportView 
            orders={orders}
            products={products}
            shopName={resolvedSettings.name}
          />
        )}

      </main>

      {/* MODAL 1: ADD NEW PRODUCT TO COLLECTION */}
      {showAddProductModal && (
        <div id="add-product-dialog" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[70] animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">ဇာတိကုန်ပစ္စည်းအသစ် ထည့်သွင်းရန်</h3>
              <button 
                onClick={() => setShowAddProductModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-500 font-bold">ကုန်ပစ္စည်းအမည် *</label>
                <input 
                  type="text" 
                  required
                  value={newProduct.name}
                  onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-805"
                  placeholder="ဥပမာ- ရေနံချောင်း နှမ်းဆီစစ်စစ် (၅၀ဝ မမ)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">စျေးနှုန်း (ကျပ်) *</label>
                  <input 
                    type="number" 
                    required
                    value={newProduct.price}
                    onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800"
                    placeholder="၅၀၀၀"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">စတော့ပမာဏ *</label>
                  <input 
                    type="number" 
                    required
                    value={newProduct.stock_qty}
                    onChange={e => setNewProduct({ ...newProduct, stock_qty: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800"
                    placeholder="၅၀"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">ကုန်ပစ္စည်းပုံစံ (Emoji သို့မဟုတ် Image URL) *</label>
                  <input 
                    type="text" 
                    required
                    value={newProduct.image}
                    onChange={e => setNewProduct({ ...newProduct, image: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:bg-white outline-hidden font-bold"
                    placeholder="📦 သို့မဟုတ် https://pics.com/pic.jpg"
                  />
                  <span className="text-[9.5px] text-zinc-400 block pt-0.5 leading-none">အီမိုဂျီ သို့မဟုတ် အင်တာနက် ပုံလင့်ခ် ရေးသွင်းနိုင်ပါသည်</span>
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-500 font-bold">အမြန်ရွေးရန် အီမိုဂျီများ</label>
                  <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-lg h-[46px] overflow-y-auto items-center">
                    {['📦', '☕', '🍜', '👕', '🍯', '👜', '🧴'].map(emo => (
                      <button
                        key={emo}
                        type="button"
                        onClick={() => setNewProduct({ ...newProduct, image: emo })}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white cursor-pointer hover:shadow-2xs border ${newProduct.image === emo ? 'bg-white shadow-2xs border-orange-300' : 'border-transparent'}`}
                      >
                        {emo}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-slate-500 font-bold">အမျိုးအစား</label>
                  <select 
                    value={newProduct.category}
                    onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 cursor-pointer outline-hidden font-bold"
                  >
                    <option value="စားသောက်ကုန်">စားသောက်ကုန်</option>
                    <option value="အဝတ်အထည်">အဝတ်အထည်</option>
                    <option value="အလှကုန်ပစ္စည်း">အလှကုန်ပစ္စည်း</option>
                    <option value="အထွေထွေ">အထွေထွေ</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-2 text-xs">
                <button 
                  type="button" 
                  onClick={() => setShowAddProductModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl cursor-pointer"
                >
                  ပယ်ဖျက်မည်
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-xl cursor-pointer shadow-md shadow-teal-600/10"
                >
                  စနစ်ထဲသိမ်းမည်
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: 58MM POS RECEIPT BILL PRINT OUT DEMO */}
      {selectedOrder && (
        <div id="receipt-modal-dialog" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[70] animate-fade-in">
          <div className="bg-slate-850 max-w-sm w-full rounded-3xl p-6 relative shadow-2xl space-y-4">
            
            <div className="flex justify-between items-center text-white pb-2 border-b border-slate-700">
              <span className="text-xs font-bold">📄 ၅၈ မမ အပူပေး ပြေစာ ပုံစံအကြို</span>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Print Area layout */}
            <div className="bg-white text-slate-900 p-5 font-mono text-[10px] leading-relaxed rounded-2xl shadow-inner select-all">
              
              <div className="text-center space-y-1 mb-4">
                <h4 className="font-black text-sm uppercase tracking-wide text-slate-950">{resolvedSettings.name}</h4>
                <p className="text-[9px] text-slate-550">{resolvedSettings.address}</p>
                <p className="text-[9px] text-slate-550">ဖုန်း: {resolvedSettings.phone}</p>
                <p className="border-b border-dashed border-slate-300 py-0.5"></p>
                {/* requirement match local slogan shown elegantly inside bill invoice */}
                <p className="text-[10px] font-black text-emerald-800 py-1 font-sans">“ ပြည်တွင်းဖြစ်ကိုအားပေးပါ ”</p>
                <p className="border-b border-dashed border-slate-300 py-0.5"></p>
              </div>

              <div className="space-y-1 mb-3">
                <p><strong>ပြေစာနံပါတ်:</strong> {selectedOrder.id}</p>
                <p><strong>နေ့စွဲ:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                <p><strong>ဝယ်သူ:</strong> {selectedOrder.customer_name} ({selectedOrder.customer_phone})</p>
                <p className="line-clamp-2"><strong>လိပ်စာ:</strong> {selectedOrder.address}</p>
                <p className="border-b border-dashed border-slate-300 py-1"></p>
              </div>

              {/* Product items inside Voucher */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold border-b border-dashed border-slate-250 pb-1">
                  <span>ကုန်ပစ္စည်း</span>
                  <span>စုစုပေါင်း</span>
                </div>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="max-w-[190px] truncate">{item.name} x{item.quantity}</span>
                    <span className="font-mono">{(item.price * item.quantity).toLocaleString()} Ks</span>
                  </div>
                ))}
                <p className="border-b border-dashed border-slate-300 py-1"></p>
              </div>

              <div className="space-y-1 pt-1.5 text-xs">
                <div className="flex justify-between font-black text-slate-950">
                  <span>စုစုပေါင်းကျသင့်ငွေ</span>
                  <span className="font-mono">{selectedOrder.total_amount.toLocaleString()} Ks</span>
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                  <span>ငွေချေစနစ်</span>
                  <span>{selectedOrder.payment_method}</span>
                </div>
              </div>

              <div className="text-center mt-6 space-y-1 border-t border-dashed border-slate-300 pt-3">
                <p className="text-[9px] text-slate-600 font-bold font-sans">ဝယ်ယူအားပေးမှုကို လှိုက်လှဲစွာကျေးဇူးတင်ရှိပါသည်</p>
                <p className="text-[8px] text-slate-400 font-mono">Powered by SOKO SaaS Cloud</p>
              </div>

            </div>

            {/* Print commands */}
            <div className="flex gap-2 pt-1">
              <button 
                onClick={() => {
                  window.print();
                  showToast('စက်ပစ္စည်းပရင့်ထုတ်စနစ်သို့ ချိတ်ဆက်နေပါသည်...');
                }}
                className="flex-1 bg-teal-600 hover:bg-teal-550 text-white font-bold text-xs py-2 rounded-xl cursor-pointer transition"
              >
                🖨️ ပရင့်စကင်ဖတ်မည်
              </button>
              <button 
                onClick={() => {
                  showToast('ပြေစာဖြတ်ပိုင်းအား ပုံအဖြစ် သိမ်းဆည်းလိုက်ပါပြီ။');
                  setSelectedOrder(null);
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs py-2 rounded-xl cursor-pointer transition"
              >
                💾 သိမ်းဆည်းရန်
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
