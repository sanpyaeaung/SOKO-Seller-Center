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
            <span className="text-[10px] text-orange-500 font-semibold font-mono leading-none block pt-1">https://soko.com/shop/{localSettings.slug || 'slug'}</span>
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

        {/* Payment Wallet Setup */}
        <div className="border-t border-orange-100 pt-5 space-y-4">
          <h4 className="font-black text-[#8A4A00] text-sm flex items-center gap-1.5 justify-between">
            <span>🏦 မိုဘိုင်းလ်ငွေလက်ခံမှုစနစ် (KPay / WavePay)</span>
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-slate-500 font-bold">ငွေထုတ်/ငွေသွင်းလက်ခံမည့် ဖုန်းနံပါတ် *</label>
              <input 
                type="text" 
                required
                value={localSettings.kpay_number}
                onChange={e => setLocalSettings({ ...localSettings, kpay_number: e.target.value })}
                className="w-full bg-orange-50/25 border border-orange-100 rounded-xl p-3 text-slate-800 font-bold focus:bg-white focus:ring-1 focus:ring-orange-500 outline-hidden transition"
                placeholder="၀၉၉၅၅၁၂၃၄၅၆"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-slate-500 font-bold">အကောင့်နာမည် (Account Name) *</label>
              <input 
                type="text" 
                required
                value={localSettings.kpay_name}
                onChange={e => setLocalSettings({ ...localSettings, kpay_name: e.target.value })}
                className="w-full bg-orange-50/25 border border-orange-100 rounded-xl p-3 text-slate-800 font-bold focus:bg-white focus:ring-1 focus:ring-orange-500 outline-hidden transition"
                placeholder="ဥပမာ- U Kyaw Kyaw"
              />
            </div>
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
