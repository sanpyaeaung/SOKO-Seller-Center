import React, { useState, useEffect } from 'react';
import { User, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { ShopSettings } from '../types';
import { collection, query, where, getDocs, setDoc, doc, updateDoc } from 'firebase/firestore';
import { compressBase64Image } from '../utils';

interface ShopSettingsViewProps {
  settings: ShopSettings;
  onSaveSettings: (updated: ShopSettings) => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
  user: User;
  activeShopUid: string;
  onChangeActiveShop: (uid: string) => void;
}

export default function ShopSettingsView({
  settings,
  onSaveSettings,
  onShowToast,
  user,
  activeShopUid,
  onChangeActiveShop
}: ShopSettingsViewProps) {
  const [localSettings, setLocalSettings] = useState<ShopSettings>({ ...settings });
  const [loading, setLoading] = useState(false);

  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  
  // New branch form state
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchSlug, setNewBranchSlug] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [branchSubmitting, setBranchSubmitting] = useState(false);

  // Suggestions state
  const [suggestionText, setSuggestionText] = useState('');
  const [sugSubmitting, setSugSubmitting] = useState(false);

  // Premium request states
  const [premiumSlipRaw, setPremiumSlipRaw] = useState('');
  const [premiumReqText, setPremiumReqText] = useState('');
  const [premiumReqSubmitting, setPremiumReqSubmitting] = useState(false);

  const isPremiumActive = true; // Temporarily make Premium free and unlocked while its upgrade UI is hidden/removed based on user request.

  const handlePremiumRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!premiumSlipRaw) {
      onShowToast('⚠️ ကျေးဇူးပြု၍ ငွေလွှဲပြေစာ ပုံရိပ်ကို အရင်ရွေးချယ်ပေးပါရန်။', 'error');
      return;
    }
    setPremiumReqSubmitting(true);
    try {
      const shopId = activeShopUid || user.uid;
      const docRef = doc(db, 'shop_settings', shopId);
      
      const compressedSlip = await compressBase64Image(premiumSlipRaw);
      await setDoc(docRef, {
        premium_requested: true,
        premium_request_payment_slip: compressedSlip,
        premium_request_text: premiumReqText || 'No extra message',
        premium_request_date: new Date().toISOString()
      }, { merge: true });

      onShowToast('💎 Premium Upgrade လျှောက်ထားမှုအား အောင်မြင်စွာ တင်သွင်းပြီးပါပြီ။ Admin မှ မကြာမီစစ်ဆေးပေးပါမည်။', 'success');
      setPremiumSlipRaw('');
      setPremiumReqText('');
    } catch (err) {
      console.error(err);
      onShowToast('တောင်းဆိုချက် ပို့ဆောင်မှု မအောင်မြင်ပါ၊ ထပ်မံကြိုးစားကြည့်ပါခင်ဗျာ။', 'error');
    } finally {
      setPremiumReqSubmitting(false);
    }
  };

  // Load branches from Firestore
  const loadBranches = async () => {
    if (!user) return;
    setLoadingBranches(true);
    try {
      const q = query(
        collection(db, 'shop_settings'),
        where('parent_uid', '==', user.uid)
      );
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() });
      });
      setBranches(list);
    } catch (err) {
      console.error('Error fetching branches:', err);
    } finally {
      setLoadingBranches(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, [user]);

  // Branch creation
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPremiumActive) {
      onShowToast('👑 ဆိုင်ခွဲသစ်တိုးချဲ့ခွင့်သည် SOKO PRO VIP Premium သီးသန့် ဝန်ဆောင်မှု ဖြစ်ပါသည်။ ဆက်တင်စာမျက်နှာထိပ်ရှိ Premium Upgrade ကို ဝယ်ယူပေးပါရန်။', 'error');
      return;
    }
    const isBranchOrStaffMode = (user.uid === 'staff_user') || (activeShopUid !== user.uid) || (!!settings.parent_uid);
    if (isBranchOrStaffMode) {
      onShowToast('⚠️ ဆိုင်ခွဲလင့်ခ်မှ ဆိုင်ခွဲသစ်တိုးချဲ့ခွင့် မရှိပါခင်ဗျာ။', 'error');
      return;
    }
    if (!newBranchName || !newBranchSlug) {
      onShowToast('ဆိုင်ခွဲအမည်နှင့် လိပ်စာအကြို ဖြည့်စွက်ပေးပါရန်', 'error');
      return;
    }
    setBranchSubmitting(true);
    try {
      const newUid = `${user.uid}_branch_${Date.now()}`;
      const sanitizedSlug = newBranchSlug.toLowerCase().replace(/[^a-z0-9_]/g, '');
      
      const newBranchDoc: ShopSettings = {
        owner_uid: newUid,
        parent_uid: user.uid,
        name: newBranchName,
        phone: newBranchPhone || settings.phone || '',
        address: newBranchAddress || settings.address || '',
        kpay_name: settings.kpay_name || '',
        kpay_number: settings.kpay_number || '',
        payment_accounts: settings.payment_accounts || [],
        slug: sanitizedSlug
      };

      await setDoc(doc(db, 'shop_settings', newUid), newBranchDoc);
      onShowToast(`🏪 ဆိုင်ခွဲအသစ် "${newBranchName}" အား အောင်မြင်စွာ တိုးချဲ့ပြီးပါပြီ။`);
      setNewBranchName('');
      setNewBranchSlug('');
      setNewBranchPhone('');
      setNewBranchAddress('');
      loadBranches();
    } catch (err) {
      console.error(err);
      onShowToast('ဆိုင်ခွဲတိုးချဲ့မှု မအောင်မြင်ပါ၊ slug လိပ်စာထပ်နေခြင်း ရှိမရှိ စစ်ဆေးပေးပါ', 'error');
    } finally {
      setBranchSubmitting(false);
    }
  };

  // Feedback/Suggestion Submission
  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionText.trim()) {
      onShowToast('အကြံပြုချက် စာသားရေးသားပေးပါခင်ဗျာ။', 'error');
      return;
    }
    setSugSubmitting(true);
    try {
      const suggestionId = 'SUG-' + Date.now();
      await setDoc(doc(db, 'suggestions', suggestionId), {
        id: suggestionId,
        sender_name: user.displayName || settings.name || 'SOKO လုပ်ငန်းရှင်',
        sender_email: user.email || 'N/A',
        content: suggestionText,
        created_at: new Date().toISOString()
      });
      onShowToast('💬 အချက်အလက်များကို Admin Panel ထံ တိုက်ရိုက်တင်ပြလိုက်ပါပြီ။ ကျေးဇူးတင်ရှိပါသည်!');
      setSuggestionText('');
    } catch (err) {
      console.error(err);
      onShowToast('အကြံပြုချက်တင်သွင်းမှု မအောင်မြင်ပါ', 'error');
    } finally {
      setSugSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onShowToast('စနစ်မှ ထွက်ခွာပြီးပါပြီ။');
    } catch (err) {
      console.error(err);
      onShowToast('စနစ်မှ ထွက်ရန် ကြိုးစားမှု မအောင်မြင်ပါ', 'error');
    }
  };

  const [newProvider, setNewProvider] = useState('KBZPay');
  const [newAccNumber, setNewAccNumber] = useState('');
  const [newAccName, setNewAccName] = useState('');

  const handleAddAccount = () => {
    if (!newAccNumber || !newAccName) {
      onShowToast('အကောင့်နံပါတ်နှင့် အမည်အပြည့်အစုံ ဖြည့်စွက်ပေးပါရန်', 'error');
      return;
    }
    const newAcc = {
      id: 'ACC-' + Date.now(),
      provider: newProvider,
      account_number: newAccNumber,
      account_name: newAccName
    };
    
    const updatedAccounts = [...(localSettings.payment_accounts || []), newAcc];
    
    // Auto-fill fallback fields for backward compatibility
    let fallbackNum = localSettings.kpay_number;
    let fallbackName = localSettings.kpay_name;
    if (newProvider === 'KBZPay' || newProvider === 'WaveMoney') {
      if (!fallbackNum) fallbackNum = newAccNumber;
      if (!fallbackName) fallbackName = newAccName;
    }

    setLocalSettings({
      ...localSettings,
      payment_accounts: updatedAccounts,
      kpay_number: fallbackNum,
      kpay_name: fallbackName
    });

    setNewAccNumber('');
    setNewAccName('');
    onShowToast('ငွေချေစနစ်အသစ် ထည့်သွင်းပြီးပါပြီ။ ဆက်တင်များသိမ်းဆည်းရန် "ပြင်ဆင်ချက်များ သိမ်းဆည်းမည်" ကိုနှိပ်ပေးပါရန်။');
  };

  const handleRemoveAccount = (id: string) => {
    const updatedAccounts = (localSettings.payment_accounts || []).filter(acc => acc.id !== id);
    setLocalSettings({
      ...localSettings,
      payment_accounts: updatedAccounts
    });
    onShowToast('ငွေချေစနစ် ဖယ်ရှားပြီးပါပြီ။ ဆက်တင်များသိမ်းဆည်းရန် "ပြင်ဆင်ချက်များ သိမ်းဆည်းမည်" ကိုနှိပ်ပေးပါရန်။');
  };

  useEffect(() => {
    setLocalSettings({ ...settings });
  }, [settings]);

  const handleSubmitSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSaveSettings(localSettings);
      onShowToast('ဆိုင်ဆက်တင်အချက်အလက်များကို အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ။');
    } catch (err) {
      console.error(err);
      onShowToast('သိမ်းဆည်းခြင်း မအောင်မြင်ပါ၊ ထပ်မံကြိုးစားကြည့်ပါ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSlugChange = (val: string) => {
    // Sanitize slug (lowercase English letters, numbers, and dashes only)
    const sanitized = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setLocalSettings({ ...localSettings, slug: sanitized });
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-orange-100 p-6 space-y-6 shadow-xs">
      <div>
        <h3 className="font-black text-slate-900 text-base">စတိုးဆိုင် ဆက်တင်များ</h3>
        <p className="text-xs text-slate-505 font-medium">ပြေစာထုတ်ယူမှု စနစ်နမူနာများနှင့် KBZPay/WavePay ငွေချေလှမ်းမှုအချက်အလက်များ ပြုပြင်ခြင်း</p>
      </div>

      {/* 👑 SOKO PRO VIP PREMIUM SUBSCRIPTION STATUS SECTION - Temporarily Removed Based on User Request */}

      <form onSubmit={handleSubmitSettings} className="space-y-6 max-w-xl text-xs font-bold text-slate-700">
        
        {/* Core Store Setup */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-slate-500 font-bold">စတိုးဆိုင်အမည် *</label>
            <input 
              type="text" 
              required
              value={localSettings.name}
              onChange={e => setLocalSettings({ ...localSettings, name: e.target.value })}
              className="w-full bg-orange-50/25 border border-orange-100 rounded-xl p-3 font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-orange-500 outline-hidden transition"
              placeholder="ဥပမာ- ရွှေမြန်မာ စားသောက်ကုန်ဦးစီး"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-slate-500 font-bold">ဆိုင်လိပ်စာအကြို (URL Slug) *</label>
            <input 
              type="text" 
              required
              value={localSettings.slug}
              onChange={e => handleSlugChange(e.target.value)}
              className="w-full bg-orange-50/25 border border-orange-100 rounded-xl p-3 font-mono text-slate-800 focus:bg-white focus:ring-1 focus:ring-orange-500 outline-hidden transition font-bold"
              placeholder="shwemyanmar"
            />
            <span className="text-[10px] text-orange-500 font-semibold font-mono leading-none block pt-1">{window.location.origin}/?shop={localSettings.slug || 'slug'}</span>
          </div>

          <div className="space-y-1">
            <label className="block text-slate-500 font-bold">ဆက်သွယ်ရန်ဖုန်း *</label>
            <input 
              type="tel" 
              required
              value={localSettings.phone}
              onChange={e => setLocalSettings({ ...localSettings, phone: e.target.value })}
              className="w-full bg-orange-50/25 border border-orange-100 rounded-xl p-3 font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-orange-500 outline-hidden transition"
              placeholder="ဥပမာ- ၀၉၄၅၀၀၁၁၂၂၃"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-slate-500 font-bold">ဆိုင်တည်နေရာလိပ်စာ *</label>
            <input 
              type="text" 
              required
              value={localSettings.address}
              onChange={e => setLocalSettings({ ...localSettings, address: e.target.value })}
              className="w-full bg-orange-50/25 border border-orange-100 rounded-xl p-3 font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-orange-500 outline-hidden transition"
              placeholder="တိုက်နံပါတ်၊ မြို့နယ်၊ တိုင်းဒေသကြီး"
            />
          </div>

          {/* Allowed Payment Modes Selection */}
          <div className="space-y-2 sm:col-span-2 border-t border-orange-50 pt-4">
            <label className="block text-[#8A4A00] font-black text-xs">💸 ဆိုင်တွင် လက်ခံမည့် ငွေချေစနစ် ရွေးချယ်ရန် (Payment Settings) *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, allowed_payment_modes: 'both' })}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 text-center transition cursor-pointer active:scale-95 ${
                  (localSettings.allowed_payment_modes || 'both') === 'both'
                    ? 'border-orange-500 bg-orange-50/25 text-orange-600 shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="text-lg">🔄</span>
                <span className="font-extrabold text-[10.5px] mt-1">နှစ်မျိုးလုံး ခွင့်ပြုမည်</span>
                <span className="text-[9px] text-zinc-400 font-bold leading-none mt-0.5">(COD & Prepay)</span>
              </button>

              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, allowed_payment_modes: 'cod' })}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 text-center transition cursor-pointer active:scale-95 ${
                  localSettings.allowed_payment_modes === 'cod'
                    ? 'border-orange-500 bg-orange-50/25 text-orange-600 shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="text-lg">🚚</span>
                <span className="font-extrabold text-[10.5px] mt-1">COD (အိမ်အရောက်ရှင်း)</span>
                <span className="text-[9px] text-zinc-400 font-bold leading-none mt-0.5">(Cash On Delivery)</span>
              </button>

              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, allowed_payment_modes: 'prepay' })}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 text-center transition cursor-pointer active:scale-95 ${
                  localSettings.allowed_payment_modes === 'prepay'
                    ? 'border-orange-500 bg-orange-50/25 text-orange-600 shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span className="text-lg">💳</span>
                <span className="font-extrabold text-[10.5px] mt-1">မိုဘိုင်းလ်ဘဏ်/Wallet သာ</span>
                <span className="text-[9px] text-zinc-400 font-bold leading-none mt-0.5">(Pre-paid Mobile)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Upgraded Payment Accounts Manage Section */}
        <div className="border-t border-orange-100 pt-5 space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h4 className="font-black text-[#8A4A00] text-sm flex items-center gap-1.5">
              <span>🏦 ချိတ်ဆက်ထားသော ဘဏ်နှင့် ပိုက်ဆံအိတ်များ ({localSettings.payment_accounts?.length || 0} ခု)</span>
            </h4>
            <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2.5 py-1 rounded-full">
              အကန့်အသတ်မရှိ ချိတ်ဆက်နိုင်သည်
            </span>
          </div>

          {/* List of currently connected accounts */}
          <div className="grid grid-cols-1 gap-2.5">
            {(localSettings.payment_accounts || []).map(acc => (
              <div key={acc.id} className="p-3.5 bg-orange-50/10 rounded-2xl border border-orange-100 flex items-center justify-between gap-4 hover:border-orange-300 transition">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-center ${
                    acc.provider.includes('Pay') || acc.provider.includes('Money') 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-teal-100 text-teal-800'
                  }`}>
                    {acc.provider}
                  </span>
                  <div>
                    <span className="font-mono font-black text-slate-800 text-xs block leading-tight">{acc.account_number}</span>
                    <span className="text-[10px] text-slate-400 font-bold block pt-0.5">အကောင့်အမည်: {acc.account_name}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAccount(acc.id)}
                  className="text-rose-650 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer active:scale-90 transition font-black text-xs"
                  title="ဖယ်ရှားမည်"
                >
                  ✕ ဖယ်ထုတ်မည်
                </button>
              </div>
            ))}

            {(!localSettings.payment_accounts || localSettings.payment_accounts.length === 0) && (
              <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-[11px] font-bold">
                ⚠️ ချိတ်ဆက်ထားသော ဘဏ်အကောင့် သို့မဟုတ် မိုဘိုင်းလ်ဖုန်းနံပါတ်များ မရှိသေးပါခင်ဗျာ။ အောက်ပါပုံစံမှ ထည့်သွင်းပေးပါ။
              </div>
            )}
          </div>

          {/* Form to add a new payment method */}
          <div className="p-4 bg-orange-50/15 border-2 border-[#FFD28E]/40 rounded-2xl space-y-3.5">
            <h5 className="font-black text-[#8A4A00] text-[11.5px] uppercase tracking-wider">➕ အကောင့်အသစ် ချိတ်ဆက်ထည့်သွင်းရန်</h5>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-slate-500 font-bold text-[10px]">ဘဏ် သို့မဟုတ် Wave/KPay</label>
                <select
                  value={newProvider}
                  onChange={e => setNewProvider(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:ring-1 focus:ring-orange-500 outline-hidden cursor-pointer"
                >
                  <option value="KBZPay">KBZPay</option>
                  <option value="WaveMoney">WaveMoney</option>
                  <option value="KBZ Bank">KBZ Bank</option>
                  <option value="AYA Bank">AYA Bank</option>
                  <option value="CB Bank">CB Bank</option>
                  <option value="Yoma Bank">Yoma Bank</option>
                  <option value="UAB Bank">UAB Bank</option>
                  <option value="MAB Bank">MAB Bank</option>
                  <option value="အခြား Banking">အခြား Banking</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500 font-bold text-[10px]">အကောင့် / ဖုန်းနံပါတ်</label>
                <input
                  type="text"
                  placeholder="ဥပမာ- ၀၉၄၅၃၃၂၂၁၁"
                  value={newAccNumber}
                  onChange={e => setNewAccNumber(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:ring-1 focus:ring-orange-500 outline-hidden font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500 font-bold text-[10px]">အကောင့်အမည်ပေါက်</label>
                <input
                  type="text"
                  placeholder="ဥပမာ- U Tun Tun"
                  value={newAccName}
                  onChange={e => setNewAccName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:ring-1 focus:ring-orange-500 outline-hidden"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddAccount}
              className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold py-2.5 rounded-xl text-[11px] cursor-pointer shadow-xs transition flex items-center justify-center gap-1"
            >
              📎 အကောင့်အသစ်ချိတ်ဆက်မည်
            </button>
          </div>
        </div>

        {/* Submission */}
        <div className="flex justify-end pt-2">
          <button 
            type="submit"
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold px-4 py-2 text-xs rounded-lg transition duration-150 cursor-pointer shadow-xs active:scale-95"
          >
            {loading ? 'သိမ်းဆည်းနေဆဲ...' : 'ပြင်ဆင်ချက်များ သိမ်းဆည်းမည်'}
          </button>
        </div>

      </form>

      {/* 🏪 MULTI-BRANCH MANAGEMENT & SWITCHER CONTEXT */}
      <div className="border-t border-orange-100 pt-6 space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <h4 className="font-black text-[#8A4A00] text-sm uppercase tracking-wide flex items-center gap-1.5">
              <span>🏪 ဆိုင်ခွဲများ တည်ထောင်ခြင်းနှင့် ကူးပြောင်းစီမံခြင်း (Branch Switching Hub)</span>
            </h4>
            <p className="text-[10px] text-zinc-500 font-bold font-sans">ပင်မဆိုင်ကြီးမှတဆင့် ဆိုင်ခွဲလုပ်ငန်းများကို စီမံခွဲခြားကာ လုပ်ငန်းခွင်တစ်ခုချင်းစီကို ပြောင်းလဲ ကိုင်တွယ်နိုင်သည်</p>
          </div>

          <span className="text-[10.5px] bg-slate-100 text-slate-800 px-3 py-1 rounded-full font-extrabold border border-slate-200 font-mono">
            Active: {activeShopUid === user.uid ? 'Main Store' : 'Branch Context'}
          </span>
        </div>

        {/* Existing active workspaces grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Main workspace */}
          <div className={`p-4.5 rounded-2xl border-2 transition-all text-left space-y-2.5 ${
            activeShopUid === user.uid 
              ? 'bg-orange-50/40 border-orange-355 shadow-xs' 
              : 'bg-white border-slate-100 hover:border-slate-200'
          }`}>
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-0.5">
                <span className="text-[8px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider font-mono">Main</span>
                <h5 className="font-black text-xs text-slate-900 pt-1">🏪 {settings.name}</h5>
                <p className="text-[10px] text-orange-600 font-mono font-bold font-sans">soko.to/{settings.slug}</p>
                <p className="text-[10px] text-zinc-400 font-medium truncate max-w-xs">{settings.address || 'Address: N/A'}</p>
              </div>

              {activeShopUid === user.uid ? (
                <span className="text-[9px] bg-orange-500 text-white font-black px-2.5 py-1 rounded-full select-none shadow-3xs animate-fade-in">
                  လက်ရှိသုံးနေသည်
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onChangeActiveShop(user.uid);
                    onShowToast('🔄 ပင်မဆိုင်ကြီး လုပ်ငန်းခွင်သို့ အောင်မြင်စွာ ကူးပြောင်းပြီးပါပြီ။', 'success');
                  }}
                  className="bg-slate-150 hover:bg-orange-50 text-slate-700 hover:text-orange-600 text-[10px] font-black px-3.5 py-1.5 rounded-lg active:scale-95 transition cursor-pointer border border-slate-200"
                >
                  ပြောင်းမည်
                </button>
              )}
            </div>
          </div>

          {/* Sub workspaces */}
          {branches.map(b => {
            const staffUrl = `${window.location.origin}/?staff_shop=${b.owner_uid}`;
            return (
              <div key={b.owner_uid} className={`p-4.5 rounded-2xl border-2 transition-all text-left space-y-2.5 ${
                activeShopUid === b.owner_uid 
                  ? 'bg-orange-50/40 border-orange-355 shadow-xs' 
                  : 'bg-white border-slate-100 hover:border-slate-250'
              }`}>
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-0.5 flex-1">
                    <span className="text-[8px] bg-[#1e293b] text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider font-mono">Branch</span>
                    <h5 className="font-black text-xs text-slate-900 pt-1">🏪 {b.name}</h5>
                    <p className="text-[10px] text-slate-500 font-mono font-bold font-sans">soko.to/{b.slug}</p>
                    <p className="text-[10px] text-zinc-400 font-medium truncate max-w-xs">{b.address || 'Address: N/A'}</p>
                  </div>

                  {activeShopUid === b.owner_uid ? (
                    <span className="text-[9px] bg-orange-500 text-white font-black px-2.5 py-1 rounded-full select-none shadow-3xs animate-fade-in">
                      လက်ရှိသုံးနေသည်
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onChangeActiveShop(b.owner_uid);
                        onShowToast(`🔄 ဆိုင်ခွဲ "${b.name}" သို့ အောင်မြင်စွာ ကူးပြောင်းပြီးပါပြီ။`, 'success');
                      }}
                      className="bg-slate-150 hover:bg-orange-50 text-slate-700 hover:text-orange-600 text-[10px] font-black px-3.5 py-1.5 rounded-lg active:scale-95 transition cursor-pointer border border-slate-200 flex-shrink-0"
                    >
                      ပြောင်းမည်
                    </button>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 mt-1 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-650 font-black">🔑 ဝန်ထမ်းသီးသန့် လင့်ခ် (Staff Link)</span>
                    <a
                      href={staffUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:text-orange-700 font-bold text-[9px] hover:underline"
                    >
                      🔗 လင့်ခ်ဖွင့်မည် (Open)
                    </a>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      readOnly
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      value={staffUrl}
                      className="text-[9px] bg-slate-50 border border-slate-200 rounded-lg p-1.5 px-2.5 font-mono text-slate-500 flex-1 select-all focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(staffUrl);
                        onShowToast('📋 ဝန်ထမ်းလင့်ခ်ကို Clipboard သို့ ကူးယူပြီးပါပြီ။', 'success');
                      }}
                      className="bg-[#FFF8F0] hover:bg-orange-50 text-orange-600 border border-orange-200 text-[9px] font-black px-2.5 py-1.5 rounded-lg cursor-pointer transition active:scale-95 flex-shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Create new branch expansion panel */}
        {((user.uid === 'staff_user') || (activeShopUid !== user.uid) || (!!settings.parent_uid)) ? (
          <div className="p-5.5 bg-amber-50/50 rounded-2.5xl border border-dashed border-amber-200 text-amber-900 space-y-3.5 text-center">
            <span className="text-3xl select-none inline-block animate-bounce mt-1">⚠️</span>
            <h5 className="text-[11px] font-black text-amber-950 uppercase tracking-wide">ဆိုင်ခွဲလင့်ခ်မှ ဆိုင်ခွဲသစ်ထပ်မံဖွင့်လှစ်ခွင့် မရှိပါ</h5>
            <p className="text-[10px] text-amber-850 font-bold max-w-sm mx-auto leading-relaxed">
              လူကြီးမင်းသည် လက်ရှိတွင် ဆိုင်ခွဲလင့်ခ် (သို့မဟုတ်) ဆိုင်ခွဲအလုပ်ခွင်ထဲသို့ ဝင်ရောက်နေခြင်းဖြစ်သောကြောင့် ဆိုင်ခွဲအောက်တွင် ဆိုင်ခွဲထပ်မံတိုးချဲ့ဖွင့်လှစ်ခွင့် (Create sub-branch) မရှိပါခင်ဗျာ။ ပင်မဆိုင်ရှင်အကောင့် (Main Store) စာမျက်နှာတွင်သာ ဆိုင်ခွဲသစ်များကို Сီမံတိုးချဲ့နိုင်ပါမည်။
            </p>
          </div>
        ) : (
          <div className={`p-5.5 rounded-2.5xl border transition-all space-y-4 relative ${
            isPremiumActive 
              ? 'bg-slate-50 border-slate-200 text-slate-800' 
              : 'bg-amber-50/15 border-amber-200 text-slate-700 opacity-90'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{isPremiumActive ? '➕' : '🔒'}</span>
              <div>
                <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-wide">
                  တိုးချဲ့ဆိုင်ခွဲအသစ် ဖွင့်လှစ်ရန်ပုံစံ (Add New Branch Store) {!isPremiumActive && ' (PRO VIP သီးသန့်)'}
                </h5>
                <p className="text-[9px] text-zinc-400 font-bold">ပင်မဆိုင်ကြီး၏ ငွေကိုင်စနစ်များနှင့် ဘဏ်အကောင့်များကို အလိုအလျောက်ကူးယူပေးပါမည်။</p>
              </div>
            </div>

            {!isPremiumActive && (
              <div className="bg-amber-500/10 border border-amber-300 p-4 rounded-xl text-center space-y-1 my-2">
                <p className="text-xs font-black text-amber-950">👑 SOKO Pro VIP Feature Locked</p>
                <p className="text-[10px] text-amber-900 font-bold leading-relaxed max-w-sm mx-auto">
                  ဆိုင်ခွဲအသစ်တိုးချဲ့ခြင်းစနစ်သည် 💎 Premium ဝယ်ယူအသုံးပြုသူများသာ သုံးစွဲနိုင်သော feature ဖြစ်ပါသည်။ စနစ်ကိုအသုံးပြုရန် အပေါ်ရှိ Upgrade Form မှာ လျှောက်ထားပေးပါ။
                </p>
              </div>
            )}

            <form onSubmit={handleCreateBranch} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-slate-700 block">🏪 ဆိုင်ခွဲအမည် (Branch Name)</label>
                <input
                  type="text"
                  required
                  disabled={!isPremiumActive}
                  placeholder="ဥပမာ- ရန်ကင်းဆိုင်ခွဲ / တာမွေဆိုင်ခွဲ"
                  value={newBranchName}
                  onChange={e => setNewBranchName(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-orange-400 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-slate-700 block">🔗 ဆိုင်ခွဲ slug လိပ်စာ (soko.to/yourslug)</label>
                <input
                  type="text"
                  required
                  disabled={!isPremiumActive}
                  placeholder="ဥပမာ - myanmarsushi-ygn"
                  value={newBranchSlug}
                  onChange={e => setNewBranchSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  className="w-full text-xs font-semibold p-2.5 border border-slate-300 rounded-xl bg-white font-mono focus:outline-none focus:border-orange-400 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-slate-700 block">📞 ဆိုင်ခွဲဆက်သွယ်ရန်ဖုန်း (Branch Phone)</label>
                <input
                  type="text"
                  disabled={!isPremiumActive}
                  placeholder="ဥပမာ - ၀၉၁၂၃၄၅၆၇၈၉ (ချန်ထားက ပင်မဆိုင်ဖုန်းသုံးမည်)"
                  value={newBranchPhone}
                  onChange={e => setNewBranchPhone(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-orange-400 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-slate-700 block">📍 ဆိုင်ခွဲလိပ်စာ (Branch Physical Address)</label>
                <input
                  type="text"
                  disabled={!isPremiumActive}
                  placeholder="ဥပမာ - အမှတ် (၈)၊ ကမ္ဘာအေးဘုရားလမ်း..."
                  value={newBranchAddress}
                  onChange={e => setNewBranchAddress(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-orange-400 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={branchSubmitting || !isPremiumActive}
                  className="bg-slate-800 text-white font-black text-xs px-5 py-2.5 rounded-xl transition cursor-pointer hover:bg-slate-900 active:scale-95 shadow-xs disabled:bg-slate-300 disabled:text-slate-500"
                >
                  {branchSubmitting ? 'ဆိုင်ခွဲတည်ဆောက်နေပါသည်...' : '🏪 ဆိုင်ခွဲ သက်တမ်းမြှင့်ပြီး စတင်တည်ဆောက်မည်'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>



      {/* 💬 DIRECT SUGGESTIONS SUBMISSION TO SOKO SYSTEM ADMIN */}
      <div className="border-t border-orange-100 pt-6 space-y-4">
        <h4 className="font-black text-[#8A4A00] text-sm uppercase tracking-wide flex items-center gap-1.5">
          <span>💬 SOKO အက်ဒမင်ထံသို့ တိုက်ရိုက် အကြံပြုချက်စာသားများ တင်ပြရန် (Developer Suggestion Box)</span>
        </h4>

        <div className="bg-white p-5.5 rounded-3xl border border-slate-200.5 text-left text-slate-800 space-y-4">
          <p className="text-xs text-slate-600 leading-normal font-semibold">
            လုပ်ငန်းသုံးစွဲရာတွင် တွေ့ကြုံရသော အတွေ့အကြုံများ၊ လိုအပ်ချက်များ သို့မဟုတ် Feature သစ် တောင်းဆိုချက်များကို ဤနေရာမှ တိုက်ရိုက်ရေးသားပေးပို့ပါက Developer စူပါအက်ဒမင်များထံ စက္ကန့်ပိုင်းအတွင်း တိုက်ရိုက် ရောက်ရှိပြသမည် ဖြစ်ပါသည်။
          </p>

          <form onSubmit={handleSubmitSuggestion} className="space-y-4">
            <textarea
              required
              rows={3}
              value={suggestionText}
              onChange={e => setSuggestionText(e.target.value)}
              placeholder="သင်၏ တုံ့ပြန်အကြံပြုချက်များနှင့် တောင်းဆိုမှုများကို အသေးစိတ် ဤနေရာတွင် ရေးသားပါ..."
              className="w-full text-xs font-semibold p-4 border border-slate-300 rounded-2xl focus:outline-none focus:border-orange-500 bg-white"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sugSubmitting}
                className="bg-slate-900 hover:bg-slate-950 text-white font-black text-xs px-5 py-2.5 rounded-xl transition cursor-pointer active:scale-95 shadow-xs disabled:bg-slate-400 flex items-center gap-2"
              >
                <span>💬 Idea တင်ပြမည် (Submit Suggestion)</span>
                {sugSubmitting && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Connected Account & Account Session Controls (Req Alignment: Google Connection & Logout inside settings) */}
      <div className="border-t border-orange-100 pt-5 space-y-3 font-semibold text-slate-700">
        <h4 className="font-black text-[#8A4A00] text-xs uppercase tracking-wide flex items-center gap-1.5">
          <span>🛡️ လုပ်ငန်းရှင်အကောင့် စီမံခန့်ခွဲမှု (Merchant Identity)</span>
        </h4>
        
        <div className="p-3 bg-orange-50/20 rounded-xl border border-orange-100/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Merchant'}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full border-2 border-orange-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-black shadow-3xs">
                {user?.displayName?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <p className="font-black text-slate-900 text-xs">ဦးစီးလုပ်ငန်းရှင်: {user?.displayName || 'Merchant Account'}</p>
              <p className="text-[10px] text-slate-500 font-mono font-medium">အီးမေးလ်: {user?.email}</p>
              <span className="inline-flex items-center gap-1 text-[9.5px] text-emerald-600 font-bold mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Google အကောင့် ချိတ်ဆက်ထားပြီးဖြစ်ပါသည်
              </span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleLogout}
            className="w-full sm:w-auto bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 hover:border-rose-300 font-bold px-3.5 py-1.5 text-[10px] rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>စနစ်မှထွက်မည် (Sign Out)</span>
          </button>
        </div>
      </div>

    </div>
  );
}
