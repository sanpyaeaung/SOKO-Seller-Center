import React, { useState, useEffect } from 'react';
import { User, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { ShopSettings } from '../types';

interface ShopSettingsViewProps {
  settings: ShopSettings;
  onSaveSettings: (updated: ShopSettings) => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
  user: User;
}

export default function ShopSettingsView({
  settings,
  onSaveSettings,
  onShowToast,
  user
}: ShopSettingsViewProps) {
  const [localSettings, setLocalSettings] = useState<ShopSettings>({ ...settings });
  const [loading, setLoading] = useState(false);

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
