import React, { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  const [manualNotice, setManualNotice] = useState(false);

  useEffect(() => {
    // Intercept standard beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      // Store event to trigger later
      setDeferredPrompt(e);
      // Auto show the custom install banner immediately on website entry
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Also prompt standard manual instructions if they enter on mobile and want to know
    const isAlreadyInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (!isAlreadyInstalled) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1500);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShowBanner(false);
    } else {
      // Beautiful inline message switch instead of browser-blocking window.alert
      setManualNotice(true);
      setTimeout(() => {
        setShowBanner(false);
        setManualNotice(false);
      }, 5000);
    }
  };

  if (!showBanner) return null;

  return (
    <div id="pwa-install-banner" className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 rounded-2xl border-2 border-[#FFD28E] shadow-lg flex flex-col md:flex-row items-center justify-between gap-3 animate-fade-in transition-all">
      <div className="flex items-center gap-3 text-center md:text-left flex-col md:flex-row">
        <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-white text-xl shadow-inner flex-shrink-0">
          📲
        </div>
        <div>
          <h4 className="font-extrabold text-xs text-yellow-300">SOKO App အဖြစ် ထည့်သွင်းအသုံးပြုမလား?</h4>
          <p className="text-[10px] text-orange-50 mt-0.5 leading-snug">
            {manualNotice 
              ? 'ဘရောက်ဇာ Menu တွင် "Add to Home screen" သို့မဟုတ် "Install App" ကိုနှိပ်ပြီး တိုက်ရိုက်သွင်းယူနိုင်ပါသည်'
              : 'စတိုးဆိုင်ကို အင်တာနက်မရှိဘဲ စတော့ခ်စစ်ဆေးရန်နှင့် အော်ဒါများကို ဖုန်း Screen ပေါ်တွင် App ကဲ့သို့ လျင်မြန်စွာ အသုံးပြုနိုင်သည်။'
            }
          </p>
        </div>
      </div>

      <div className="flex gap-2 w-full md:w-auto">
        <button
          onClick={() => setShowBanner(false)}
          className="flex-1 md:flex-initial text-orange-100 hover:text-white text-[10px] font-bold px-3 py-1.5 rounded-lg border border-white/20 transition cursor-pointer"
        >
          ကြည့်ရုံသာ
        </button>
        <button
          onClick={handleInstallClick}
          className="flex-1 md:flex-initial bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-extrabold text-[10px] px-4 py-1.5 rounded-lg shadow-md transition transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
        >
          <span>📥 INSTALL NOW</span>
        </button>
      </div>
    </div>
  );
}
