import React, { useEffect, useState } from 'react';
import { signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

interface LoginScreenProps {
  onLoginError: (msg: string) => void;
}

export default function LoginScreen({ onLoginError }: LoginScreenProps) {
  const [loadingRedirect, setLoadingRedirect] = useState(false);

  useEffect(() => {
    setLoadingRedirect(true);
    try {
      getRedirectResult(auth)
        .then((result) => {
          if (result) {
            console.log('Redirect sign-in success:', result.user);
          }
        })
        .catch((err: any) => {
          console.error('Redirect Auth Error:', err);
          onLoginError(err.message || 'Redirect Sign-in failed');
        })
        .finally(() => {
          setLoadingRedirect(false);
        });
    } catch (syncErr: any) {
      console.warn('Google Redirect check blocked synchronously (expected in sandboxed environments):', syncErr);
      setLoadingRedirect(false);
    }
  }, [onLoginError]);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.warn('Google Popup blocked or failed, initiating Redirect fallback...', err);
      try {
        setLoadingRedirect(true);
        await signInWithRedirect(auth, provider);
      } catch (redirectErr: any) {
        console.error('Google Redirect Error:', redirectErr);
        onLoginError(redirectErr.message || 'Google Sign-in failed');
        setLoadingRedirect(false);
      }
    }
  };

  return (
    <div id="login-container" className="min-h-screen bg-[#FFF8F0] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Visual background accents */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-yellow-405/10 blur-3xl"></div>

      <div id="login-card" className="w-full max-w-md bg-white border-2 border-[#FFD28E] rounded-3xl p-8 shadow-xl relative z-10 flex flex-col items-center text-center space-y-6">
        
        {/* Brand Logo Icon */}
        <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-orange-500/20 antialiased transform hover:scale-105 transition-transform duration-300">
          S
        </div>

        {/* Patriotic Myanmar Support Brand Banner */}
        <div className="space-y-2 py-2">
          <span className="text-[11px] font-bold text-orange-600 uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
            Myanmar Local Brand Hub
          </span>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-normal py-1">
            SOKO Seller Center
          </h1>
          
          <div className="bg-gradient-to-r from-orange-400 via-yellow-450 to-orange-600 h-1.5 w-32 mx-auto rounded-full my-3"></div>
          
          {/* Beautiful text: "ပြည်တွင်းဖြစ်ကိုအားပေးပါ" */}
          <div id="support-local-text" className="bg-orange-50 border-2 border-[#FFD28E] px-6 py-4 rounded-2xl my-2 shadow-xs">
            <h2 className="text-xl font-black text-orange-600 leading-snug">
              " ပြည်တွင်းဖြစ်ကိုအားပေးပါ "
            </h2>
            <p className="text-[11px] text-orange-700 mt-1 font-medium">
              ကျပ်ငွေစီးဆင်းမှုမှစ၍ မိမိနိုင်ငံထုတ်ပစ္စည်းများကို ဂုဏ်ယူစွာရောင်းချကြပါစို့
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
          သင့်ပြည်တွင်းဖြစ် ကုန်ပစ္စည်းများကို အွန်လိုင်းစတိုးတစ်ခုအဖြစ် ဖွင့်လှစ်ပြီး စတော့ထိန်းသိမ်းခြင်း၊ dynamic order forms များနှင့် ပြေစာများကို အဆင်ပြေစုံလင်စွာ စီမံခန့်ခွဲလိုက်ပါ။
        </p>

        {/* Google Authentication Action Button */}
        <button
          id="btn-google-login"
          disabled={loadingRedirect}
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-2 bg-white hover:bg-orange-50 text-slate-700 hover:text-slate-900 border-2 border-orange-100 font-bold py-2.5 px-3 text-xs rounded-xl shadow-xs transition duration-200 active:scale-98 cursor-pointer disabled:opacity-50 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
        >
          {loadingRedirect ? (
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.68 14.93 1 12 1 7.35 1 3.37 3.65 1.41 7.55l3.79 2.94C6.1 7.51 8.83 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.45h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.69 2.86c2.16-1.99 3.74-4.92 3.74-8.54z"
              />
              <path
                fill="#FBBC05"
                d="M5.2 14.49c-.23-.69-.36-1.43-.36-2.2c0-.77.13-1.51.36-2.2L1.41 7.15C.51 8.95 0 10.94 0 13c0 2.06.51 4.05 1.41 5.85l3.79-2.94-1-.42z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.69-2.86c-1.03.69-2.35 1.1-4.27 1.1-3.17 0-5.9-2.47-6.8-5.45L1.41 15.8C3.37 19.7 7.35 22.3 12 23z"
              />
            </svg>
          )}
          <span className="text-xs">
            {loadingRedirect ? 'လုံခြုံစွာ ဝင်ရောက်နေဆဲဖြစ်ပါသည် (Signing in...)' : 'Google အကောင့်ဖြင့် ဝင်မည်'}
          </span>
        </button>

        {/* Footer info banner */}
        <div className="text-[10px] text-slate-400">
          <span>လုံခြုံစိတ်ချရသော မြန်မာ့ပထမဦးဆုံး SaaS စနစ်</span>
        </div>
      </div>
    </div>
  );
}
