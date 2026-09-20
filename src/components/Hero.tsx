import React from 'react';
import { Gamepad2, ShieldCheck, Zap, MessageSquare, ArrowRight, Package, CreditCard } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../data/storeData';
import { useLanguage } from '../context/LanguageContext';

export const Hero: React.FC = () => {
  const { t, language } = useLanguage();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative pt-32 pb-16 overflow-hidden">
      {/* Sleek Ambient Lighting Effect */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-purple-600/20 via-pink-600/10 to-transparent blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Minimalist Glowing Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-purple-500/30 text-purple-300 text-xs sm:text-sm font-bold mb-8 shadow-[0_0_20px_rgba(168,85,247,0.15)] backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{t.heroBadge}</span>
        </div>

        {/* Clean, Punchy Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 leading-tight text-white">
          {language === 'ar' ? (
            <>
              العب واستمتع. <span className="gradient-text">حسابات أصلية فورية.</span>
            </>
          ) : (
            <>
              Connect. Play. <span className="gradient-text">Dominate.</span>
            </>
          )}
        </h1>

        {/* Concise, Elegant Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-xl text-slate-300 font-medium mb-10 leading-relaxed">
          {t.heroSubtitle}
        </p>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          {/* Explore Bundles (Price removed) */}
          <button
            onClick={() => scrollToSection('bundles')}
            className="w-full sm:w-auto px-7 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-base flex items-center justify-center gap-2.5 shadow-xl shadow-orange-950/40 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-amber-300/30"
          >
            <Package className="w-5 h-5 text-amber-100" />
            <span>{t.heroBrowseBundles}</span>
          </button>

          {/* Browse Games */}
          <button
            onClick={() => scrollToSection('games')}
            className="w-full sm:w-auto px-7 py-4 rounded-xl gradient-bg text-white font-extrabold text-base flex items-center justify-center gap-2.5 shadow-xl shadow-purple-900/40 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-purple-400/30"
          >
            <Gamepad2 className="w-5 h-5 text-purple-200" />
            <span>{t.heroBrowseGames}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </button>

          {/* Direct WhatsApp Order */}
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-7 py-4 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/90 border border-emerald-500/40 text-emerald-200 font-bold text-base flex items-center justify-center gap-2.5 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-emerald-950/40"
          >
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <span>{language === 'ar' ? 'طلب فوري عبر واتساب' : 'Direct WhatsApp Order'}</span>
          </a>
        </div>

        {/* 4 Clean Feature Cards (Right before Bundles Section) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="p-5 rounded-2xl glass-panel border border-white/5 hover:border-purple-500/30 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1">
            <div className="p-3 rounded-xl bg-purple-900/50 text-purple-400 mb-2.5">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-sm">{language === 'ar' ? 'تسليم فوري' : 'Instant Delivery'}</h4>
            <p className="text-xs text-slate-400 mt-1">{language === 'ar' ? 'خلال 1-2 ساعة عبر واتساب' : 'Fast processing'}</p>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-white/5 hover:border-pink-500/30 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1">
            <div className="p-3 rounded-xl bg-pink-900/50 text-pink-400 mb-2.5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-sm">{language === 'ar' ? 'حسابات أصلية 100%' : '100% Genuine'}</h4>
            <p className="text-xs text-slate-400 mt-1">{language === 'ar' ? 'ضمان استبدال دائم' : 'Safe & verified accounts'}</p>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-white/5 hover:border-amber-500/30 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1">
            <div className="p-3 rounded-xl bg-amber-900/50 text-amber-400 mb-2.5">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-sm">PS4 &amp; PS5</h4>
            <p className="text-xs text-slate-400 mt-1">{language === 'ar' ? 'أساسي وثانوي' : 'Primary & Secondary'}</p>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-white/5 hover:border-emerald-500/30 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1">
            <div className="p-3 rounded-xl bg-emerald-900/50 text-emerald-400 mb-2.5">
              <CreditCard className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-sm">{language === 'ar' ? 'طرق دفع مصرية' : 'Egyptian Payments'}</h4>
            <p className="text-xs text-slate-400 mt-1">{language === 'ar' ? 'بايموب، إنستاباي، فودافون كاش' : 'Paymob, InstaPay & Cash'}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
