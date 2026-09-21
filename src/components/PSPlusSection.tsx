import React, { useState } from 'react';
import { plusData } from '../data/storeData';
import { Check, ShoppingCart, Award, ShieldCheck, Heart, Zap, Sparkles } from 'lucide-react';
import { WishlistItem } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getImageUrl, handleImageError } from '../utils/imageHelper';

interface PSPlusSectionProps {
  onAddToCart: (item: { name: string; details: string; price: number; category: 'psplus'; icon?: string }) => void;
  isWishlisted?: (id: string) => boolean;
  onToggleWishlist?: (item: Omit<WishlistItem, 'addedAt'>) => void;
  hasOrderedCategory?: (category: 'game' | 'psplus' | 'vbucks' | 'rocket' | 'hezo') => boolean;
}

export const PSPlusSection: React.FC<PSPlusSectionProps> = ({
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
  hasOrderedCategory,
}) => {
  const { t, language } = useLanguage();
  const [selectedAccessType, setSelectedAccessType] = useState<'prim5' | 'prim4' | 'sec' | 'full'>('prim5');
  const [duration, setDuration] = useState<'1m' | '3m' | '12m'>('12m');
  const [addedPlanId, setAddedPlanId] = useState<string | null>(null);

  const hasOrderedPlus = hasOrderedCategory ? hasOrderedCategory('psplus') : false;

  const durationLabels: Record<'1m' | '3m' | '12m', string> = {
    '1m': language === 'ar' ? 'شهر واحد' : '1 Month',
    '3m': language === 'ar' ? '3 أشهر' : '3 Months',
    '12m': language === 'ar' ? '12 شهر (سنة)' : '12 Months (1 Year)',
  };

  const accessLabels: Record<'prim5' | 'prim4' | 'sec' | 'full', { label: string; desc: string }> = {
    prim5: {
      label: language === 'ar' ? 'أساسي PS5 (برايمري 5)' : 'Prim 5 (PS5 Primary)',
      desc: language === 'ar' ? 'العب على حسابك الشخصي' : 'Personal account on PS5',
    },
    prim4: {
      label: language === 'ar' ? 'أساسي PS4 (برايمري 4)' : 'Prim 4 (PS4 Primary)',
      desc: language === 'ar' ? 'العب على حسابك الشخصي' : 'Personal account on PS4',
    },
    sec: {
      label: language === 'ar' ? 'حساب ثانوي (سكندري)' : 'Secondary (Sec)',
      desc: language === 'ar' ? 'العب من الحساب المزود' : 'Assigned account profile',
    },
    full: {
      label: language === 'ar' ? 'حساب كامل' : 'Full Access',
      desc: language === 'ar' ? 'مشاركة لـ 3 أجهزة' : 'Can share with 3+ people',
    },
  };

  const handleAddPlan = (plan: typeof plusData[0]) => {
    const isP = selectedAccessType === 'prim5' || selectedAccessType === 'prim4';
    const priceKey = `${duration}_${isP ? 'p' : 's'}` as keyof typeof plan.basePrices;
    const price = plan.basePrices[priceKey];

    onAddToCart({
      name: `PlayStation Plus ${plan.name}`,
      details: `${durationLabels[duration]} • ${accessLabels[selectedAccessType].label}`,
      price,
      category: 'psplus',
      icon: 'award',
    });

    setAddedPlanId(plan.id);
    setTimeout(() => setAddedPlanId(null), 1200);
  };

  return (
    <section id="plus" className="py-20 relative bg-slate-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Official PS Plus Artwork */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-4">
            <Award className="w-4 h-4 text-blue-400" />
            <span>{language === 'ar' ? 'اشتراكات بلايستيشن' : 'PlayStation Subscriptions'}</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-4">
            <img
              src={getImageUrl('Playstation Plus.jpg')}
              onError={handleImageError}
              alt="PlayStation Plus"
              referrerPolicy="no-referrer"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-xl border-2 border-white/20 hover:scale-105 transition-transform"
            />
            <div className="text-center sm:text-left">
              <h2 className="text-3xl sm:text-5xl font-black text-white">
                PlayStation Plus <span className="gradient-text">{language === 'ar' ? 'عضوية واشتراكات' : 'Membership'}</span>
              </h2>
              <p className="text-slate-400 max-w-xl text-sm sm:text-base mt-1">
                {language === 'ar'
                  ? 'افتح اللعب الجماعي أونلاين، والألعاب الشهرية المجانية وكتالوج الألعاب بأفضل الأسعار المضمونة في مصر.'
                  : 'Unlock online multiplayer, monthly free games, and catalog access with guaranteed best Egyptian rates.'}
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls: Access Type & Duration for Tier Catalog */}
        <div className="max-w-3xl mx-auto mb-12 p-4 rounded-2xl glass-panel border border-white/10 space-y-4">
          {/* Access Type Toggle */}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              {language === 'ar' ? 'نوع الحساب وصلاحية الوصول' : 'Account Access Level'}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['prim5', 'prim4', 'sec', 'full'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedAccessType(type)}
                  className={`py-2.5 px-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    selectedAccessType === type
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/50'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {accessLabels[type].label.split(' ')[0]} {accessLabels[type].label.split(' ')[1] || ''}
                </button>
              ))}
            </div>
          </div>

          {/* Duration Selector */}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              {language === 'ar' ? 'مدة الاشتراك' : 'Subscription Duration'}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['1m', '3m', '12m'] as const).map((dur) => (
                <button
                  key={dur}
                  onClick={() => setDuration(dur)}
                  className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                    duration === dur
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {durationLabels[dur]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Plans Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plusData.map((plan) => {
            const isP = selectedAccessType === 'prim5' || selectedAccessType === 'prim4';
            const priceKey = `${duration}_${isP ? 'p' : 's'}` as keyof typeof plan.basePrices;
            const price = plan.basePrices[priceKey];
            const isPopular = plan.id === 'extra';
            const isJustAdded = addedPlanId === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                  isPopular
                    ? 'bg-[#1e1b4b] border-2 border-purple-500 shadow-2xl shadow-purple-950/80 scale-[1.03]'
                    : 'glass-panel border border-white/10 hover:border-white/20'
                }`}
              >
                {plan.badge && (
                  <span
                    className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 ${
                      hasOrderedPlus && isPopular && duration === '12m'
                        ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/40 animate-pulse'
                        : isPopular
                        ? 'gradient-bg text-white'
                        : 'bg-slate-800 text-slate-300 border border-white/10'
                    }`}
                  >
                    {hasOrderedPlus && isPopular && duration === '12m' ? (
                      <>
                        <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                        <span>{language === 'ar' ? 'أفضل عرض • عميل مميز' : 'Best Deal • Returning Subscriber'}</span>
                      </>
                    ) : (
                      plan.badge
                    )}
                  </span>
                )}

                {onToggleWishlist && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleWishlist({
                        id: `psplus-${plan.id}-${duration}-${selectedAccessType}`,
                        productId: plan.id,
                        name: `PlayStation Plus ${plan.name}`,
                        category: 'psplus',
                        price,
                        details: `${durationLabels[duration]} • ${accessLabels[selectedAccessType].label}`,
                        icon: 'award',
                      });
                    }}
                    className={`absolute top-4 right-4 p-2.5 rounded-xl border transition-all z-10 cursor-pointer ${
                      isWishlisted && isWishlisted(`psplus-${plan.id}-${duration}-${selectedAccessType}`)
                        ? 'bg-pink-950/80 border-pink-500/60 text-pink-400 shadow-md shadow-pink-950/50'
                        : 'bg-slate-900/80 hover:bg-pink-950/40 border-white/10 hover:border-pink-500/40 text-slate-400 hover:text-pink-400'
                    }`}
                    title={isWishlisted && isWishlisted(`psplus-${plan.id}-${duration}-${selectedAccessType}`) ? (language === 'ar' ? 'إزالة من المفضلة' : 'Remove from Wishlist') : (language === 'ar' ? 'إضافة إلى المفضلة' : 'Add to Wishlist')}
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted && isWishlisted(`psplus-${plan.id}-${duration}-${selectedAccessType}`) ? 'fill-pink-500 text-pink-500' : ''}`} />
                  </button>
                )}

                <div>
                  <h3 className="text-2xl font-black text-white mb-2">{plan.name}</h3>

                  {/* Price */}
                  <div className="my-6">
                    <span className="text-4xl font-black text-white">{price}</span>
                    <span className="text-lg font-bold text-purple-400 ml-1.5">{language === 'ar' ? 'ج.م' : 'L.E'}</span>
                    <span className="text-xs text-slate-400 block mt-1">
                      {durationLabels[duration]} • {accessLabels[selectedAccessType].label}
                    </span>
                  </div>

                  {/* Feature List */}
                  <ul className="space-y-3 mb-8 text-sm text-slate-300">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <div className="p-0.5 rounded-full bg-blue-500/20 text-blue-400 mt-0.5 shrink-0">
                          <Check className="w-4 h-4" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleAddPlan(plan)}
                  className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isJustAdded
                      ? 'bg-emerald-600 text-white'
                      : isPopular
                      ? 'gradient-bg text-white hover:opacity-90 shadow-xl shadow-purple-900/40 hover:scale-105 active:scale-95'
                      : 'bg-slate-800 hover:bg-slate-700 text-white hover:scale-105 active:scale-95'
                  }`}
                >
                  {isJustAdded ? (
                    <>
                      <Check className="w-4 h-4" /> {language === 'ar' ? 'تمت الإضافة للسلة' : 'Added to Cart'}
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" /> {language === 'ar' ? 'اشترك الآن' : 'Subscribe Now'}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

