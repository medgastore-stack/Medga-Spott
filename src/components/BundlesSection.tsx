import React, { useState } from 'react';
import { Package, Sparkles, Check, ShoppingCart, Zap, Heart, ShieldCheck, Users, Gamepad2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getImageUrl, handleImageError } from '../utils/imageHelper';

interface BundlesSectionProps {
  onAddToCart: (item: {
    name: string;
    details: string;
    price: number;
    category: 'game' | 'psplus' | 'vbucks' | 'rocket' | 'hezo' | 'bundle';
    icon?: string;
    image?: string;
  }) => void;
  onInstantBuy?: (item: {
    name: string;
    details: string;
    price: number;
    category: 'game' | 'psplus' | 'vbucks' | 'rocket' | 'hezo' | 'bundle';
    icon?: string;
    image?: string;
  }) => void;
  isWishlisted?: (id: string) => boolean;
  onToggleWishlist?: (item: { id: string; name: string; price: number; category: string; icon?: string; image?: string }) => void;
}

export const BundlesSection: React.FC<BundlesSectionProps> = ({
  onAddToCart,
  onInstantBuy,
  isWishlisted,
  onToggleWishlist,
}) => {
  const { t, language } = useLanguage();
  const [selectedEdition, setSelectedEdition] = useState<'prim5' | 'prim4' | 'sec'>('prim5');
  const [isAdded, setIsAdded] = useState(false);

  const editionPrices: Record<'prim5' | 'prim4' | 'sec', { price: number; originalPrice: number }> = {
    prim5: { price: 900, originalPrice: 1400 },
    prim4: { price: 700, originalPrice: 1200 },
    sec: { price: 450, originalPrice: 850 },
  };

  const currentPricing = editionPrices[selectedEdition];
  const bundlePrice = currentPricing.price;
  const originalPrice = currentPricing.originalPrice;
  const bundleId = `bundle-it-takes-two-a-way-out-${selectedEdition}`;
  const bundleTitle = 'It Takes Two x A Way Out Co-Op Bundle';

  const editions = [
    {
      id: 'prim5' as const,
      label: language === 'ar' ? 'أساسي PS5 (برايمري 5)' : 'PS5 Primary (Prim 5)',
      badge: 'PS5',
      price: 900,
      originalPrice: 1400,
      desc: language === 'ar' ? 'العب على حسابك الشخصي مع حفظ التروفيز وميزة اللعب الأونلاين' : 'Play on your personal profile with trophies & online',
    },
    {
      id: 'prim4' as const,
      label: language === 'ar' ? 'أساسي PS4 (برايمري 4)' : 'PS4 Primary (Prim 4)',
      badge: 'PS4',
      price: 700,
      originalPrice: 1200,
      desc: language === 'ar' ? 'العب على حسابك الشخصي بجهازك مع حفظ التروفيز واللعب الجماعي' : 'Play on your personal PS4 profile with full online',
    },
    {
      id: 'sec' as const,
      label: language === 'ar' ? 'حساب ثانوي (سكندري)' : 'Secondary (Sec)',
      badge: 'PS4 / PS5',
      price: 450,
      originalPrice: 850,
      desc: language === 'ar' ? 'العب مباشرة من الحساب المزود مع اتصال إنترنت وتختيم كامل' : 'Play directly inside the account with internet connection',
    },
  ];

  const currentEditionObj = editions.find((e) => e.id === selectedEdition) || editions[0];

  const handleAdd = () => {
    onAddToCart({
      name: `${bundleTitle} (${currentEditionObj.badge})`,
      details: `${currentEditionObj.label} - Special Bundle (${bundlePrice} ${t.egp})`,
      price: bundlePrice,
      category: 'bundle',
      icon: '🎁',
      image: getImageUrl('It Takes Two.jpg'),
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    const item = {
      name: `${bundleTitle} (${currentEditionObj.badge})`,
      details: `${currentEditionObj.label} - Special Bundle (${bundlePrice} ${t.egp})`,
      price: bundlePrice,
      category: 'bundle' as const,
      icon: '🎁',
      image: getImageUrl('It Takes Two.jpg'),
    };
    if (onInstantBuy) {
      onInstantBuy(item);
    } else {
      onAddToCart(item);
    }
  };

  const wishlisted = isWishlisted ? isWishlisted(bundleId) : false;

  return (
    <section id="bundles" className="py-20 relative overflow-hidden bg-gradient-to-b from-[#0e0e1a] via-[#121226] to-[#0a0a12]">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 blur-[130px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-900/60 to-pink-900/60 border border-purple-500/40 text-purple-300 text-xs font-black uppercase tracking-wider mb-4 shadow-lg shadow-purple-950/50">
            <Package className="w-4 h-4 text-purple-400" />
            <span>{t.bundlesBadge}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-3">
            {t.bundlesTitle} <span className="gradient-text">2-in-1</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            {t.bundlesSubtitle}
          </p>
        </div>

        {/* Featured Co-Op Bundle Card */}
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#181830] via-[#141428] to-[#1a1533] border-2 border-purple-500/30 hover:border-purple-500/60 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-purple-950/60 transition-all group">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Visual Cover Showcase (It Takes Two + A Way Out side-by-side) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-sm flex items-center justify-center">
                {/* It Takes Two Cover */}
                <div className="w-36 h-52 sm:w-44 sm:h-64 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 transform -rotate-6 hover:rotate-0 transition-transform duration-300 z-10 bg-slate-900 shrink-0">
                  <img
                    src={getImageUrl('It Takes Two.jpg')}
                    onError={handleImageError}
                    alt="It Takes Two"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Plus / X Connector Badge */}
                <div className="absolute z-30 w-11 h-11 rounded-full gradient-bg flex items-center justify-center text-white font-black text-lg shadow-xl shadow-purple-950 border-2 border-white/30">
                  ✕
                </div>

                {/* A Way Out Cover */}
                <div className="w-36 h-52 sm:w-44 sm:h-64 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 transform rotate-6 hover:rotate-0 transition-transform duration-300 z-20 bg-slate-900 shrink-0 -ml-10">
                  <img
                    src={getImageUrl('A way Out.jpg')}
                    onError={handleImageError}
                    alt="A Way Out"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Tagline & Studio Credit */}
              <div className="mt-5 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  Hazelight Studios 2-Player Co-Op
                </span>
              </div>
            </div>

            {/* Bundle Details & Configuration */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                {/* Badges & Wishlist */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-950/40">
                      {t.bundleDealBadge}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {language === 'ar' ? `وفر ${originalPrice - bundlePrice} ج.م` : `Save ${originalPrice - bundlePrice} L.E`}
                    </span>
                  </div>

                  {onToggleWishlist && (
                    <button
                      type="button"
                      onClick={() =>
                        onToggleWishlist({
                          id: bundleId,
                          name: `${bundleTitle} (${currentEditionObj.badge})`,
                          price: bundlePrice,
                          category: 'bundle',
                          icon: '🎁',
                          image: getImageUrl('It Takes Two.jpg'),
                        })
                      }
                      className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                      title="Add Bundle to Wishlist"
                    >
                      <Heart className={`w-5 h-5 ${wishlisted ? 'text-pink-500 fill-pink-500' : ''}`} />
                    </button>
                  )}
                </div>

                {/* Game Title (Game names kept in English as requested!) */}
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                  It Takes Two <span className="text-purple-400">✕</span> A Way Out
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm mb-5 leading-relaxed">
                  {t.bundleCoopDuoDesc}
                </p>

                {/* Price Display */}
                <div className="flex items-baseline gap-3 mb-6 p-4 rounded-2xl bg-slate-900/60 border border-white/10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-emerald-400">
                      {bundlePrice}
                    </span>
                    <span className="text-sm font-bold text-slate-300">
                      {t.egp}
                    </span>
                  </div>
                  <span className="text-base text-slate-500 line-through">
                    {originalPrice} {t.egp}
                  </span>
                  <span className="ml-auto text-xs font-black text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full">
                    {language === 'ar' ? `بـ ${bundlePrice} ج.م فقط!` : `Only ${bundlePrice} L.E!`}
                  </span>
                </div>

                {/* Edition Selector (PS5 Primary / PS4 Primary / Secondary) */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                    {t.bundleChooseEdition}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {editions.map((ed) => (
                      <button
                        key={ed.id}
                        type="button"
                        onClick={() => setSelectedEdition(ed.id)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          selectedEdition === ed.id
                            ? 'bg-purple-950/80 border-purple-400 shadow-lg shadow-purple-950 text-white'
                            : 'bg-slate-900/50 border-white/10 hover:border-white/20 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black text-white">{ed.label}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-purple-300">
                            {ed.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                          {ed.desc}
                        </p>
                        <div className="mt-2 text-xs font-black text-emerald-400">
                          {ed.price} {t.egp}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Checklist Features */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{t.bundleFeature1}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{t.bundleFeature2}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{t.bundleFeature3}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>{t.bundleFeature4}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons (Add to Cart & Instant Buy) */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAdd}
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 hover:text-white font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  {isAdded ? (
                    <>
                      <Check className="w-5 h-5 text-emerald-400" />
                      <span>{t.addedToCart}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 text-purple-400" />
                      <span>
                        {language === 'ar'
                          ? `إضافة الحزمة للسلة (${bundlePrice} ج.م)`
                          : `Add Bundle to Cart (${bundlePrice} L.E)`}
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl gradient-bg hover:opacity-95 text-white font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl shadow-purple-900/50 hover:scale-[1.02] active:scale-95"
                >
                  <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
                  <span>
                    {language === 'ar'
                      ? `شراء الحزمة الآن (${bundlePrice} ج.م)`
                      : `Buy Bundle Now (${bundlePrice} L.E)`}
                  </span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
