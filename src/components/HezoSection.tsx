import React, { useState } from 'react';
import { socialServices, WHATSAPP_NUMBER } from '../data/storeData';
import {
  Heart,
  Eye,
  UserPlus,
  MessageSquare,
  ShoppingCart,
  Check,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HezoSectionProps {
  onAddToCart: (item: { name: string; details: string; price: number; category: 'hezo'; icon?: string }) => void;
}

export const HezoSection: React.FC<HezoSectionProps> = ({ onAddToCart }) => {
  const { language } = useLanguage();
  const [platform, setPlatform] = useState<'tiktok' | 'instagram'>('tiktok');
  const [category, setCategory] = useState<string>('views');
  const [selectedPkgIndex, setSelectedPkgIndex] = useState<number>(0);
  const [warrantyDays, setWarrantyDays] = useState<number>(0);
  const [added, setAdded] = useState(false);

  // Available services for active platform
  const currentPlatformServices = socialServices.filter((s) => s.platform === platform);
  const activeService = currentPlatformServices.find((s) => s.category === category) || currentPlatformServices[0];
  
  // Safe index bounds
  const safePkgIndex = Math.min(selectedPkgIndex, (activeService?.packages.length || 1) - 1);
  const activePackage = activeService?.packages[safePkgIndex] || { quantity: 1000, price: 90 };

  // 30 Days Refill Warranty is +50 EGP per pack as requested
  const WARRANTY_OPTIONS = [
    {
      days: 0,
      fee: 0,
      label: language === 'ar' ? 'بدون ضمان (عادي)' : 'Standard (No Warranty)',
      badge: '+0 L.E',
      desc: language === 'ar' ? 'تسليم قياسي سريع' : 'Standard fast delivery',
    },
    {
      days: 30,
      fee: 50,
      label: language === 'ar' ? 'ضمان تعويض 30 يوم (Refill)' : '30 Days Refill Warranty',
      badge: '+50 L.E',
      desc: language === 'ar' ? 'ضمان تعويض النقص لمدة 30 يوم' : '30-Day auto refill coverage',
    },
    {
      days: 90,
      fee: 100,
      label: language === 'ar' ? 'ضمان تعويض 90 يوم' : '90 Days Extended Refill',
      badge: '+100 L.E',
      desc: language === 'ar' ? 'حماية ممتدة لمدة 3 شهور' : '3-Month maximum safety refill',
    },
  ];

  const selectedWarranty = WARRANTY_OPTIONS.find((w) => w.days === warrantyDays) || WARRANTY_OPTIONS[0];
  const finalPrice = activePackage.price + selectedWarranty.fee;

  const handlePlatformChange = (newPlatform: 'tiktok' | 'instagram') => {
    setPlatform(newPlatform);
    if (newPlatform === 'tiktok') {
      setCategory('views');
    } else {
      setCategory('followers');
    }
    setSelectedPkgIndex(0);
  };

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    setSelectedPkgIndex(0);
  };

  const handlePrevPackage = () => {
    const total = activeService.packages.length;
    setSelectedPkgIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  };

  const handleNextPackage = () => {
    const total = activeService.packages.length;
    setSelectedPkgIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'views': return <Eye className="w-4 h-4" />;
      case 'likes': return <Heart className="w-4 h-4" />;
      case 'followers': return <UserPlus className="w-4 h-4" />;
      case 'comments': return <MessageSquare className="w-4 h-4" />;
      default: return <TrendingUp className="w-4 h-4" />;
    }
  };

  const handleAdd = () => {
    onAddToCart({
      name: `Hezo Boost - ${activeService.title}`,
      details: `${activePackage.quantity.toLocaleString()} ${activeService.category} • ${selectedWarranty.label}`,
      price: finalPrice,
      category: 'hezo',
      icon: 'trending-up'
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <section id="hezo" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-950/60 border border-pink-500/30 text-pink-300 text-xs font-bold uppercase tracking-wider mb-4">
            <TrendingUp className="w-4 h-4 text-pink-400" />
            <span>{language === 'ar' ? 'خدمات دعم السوشيال ميديا' : 'Social Media Boosting Engine'}</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-4">
            <img
              src="/Hezo Boost.jpg"
              alt="Hezo Boost"
              referrerPolicy="no-referrer"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-xl border-2 border-pink-500/30 hover:scale-105 transition-transform"
            />
            <div className="text-center sm:text-left">
              <h2 className="text-3xl sm:text-5xl font-black text-white">
                Hezo <span className="gradient-text">{language === 'ar' ? 'خدمات السوشيال' : 'Social Services'}</span>
              </h2>
              <p className="text-slate-400 max-w-xl text-sm sm:text-base mt-1">
                {language === 'ar'
                  ? 'عزز حساباتك على تيك توك وإنستغرام بتفاعل حقيقي وتسليم سريع مضمون.'
                  : 'Boost your TikTok & Instagram presence with fast, high-quality engagement packages.'}
              </p>
            </div>
          </div>
        </div>

        {/* Main Boosting Widget */}
        <div className="max-w-4xl mx-auto glass-panel p-6 sm:p-10 rounded-3xl border border-white/10 shadow-2xl">
          {/* 1. Platform Selector (Top Choice) */}
          <div className="mb-6">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-3">
              {language === 'ar' ? '1. اختر المنصة' : '1. Choose Platform'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handlePlatformChange('tiktok')}
                className={`py-3.5 px-4 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                  platform === 'tiktok'
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-900/40 border-pink-400/50 scale-[1.02]'
                    : 'bg-slate-900/70 border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <span>🎵 TikTok</span>
              </button>
              <button
                type="button"
                onClick={() => handlePlatformChange('instagram')}
                className={`py-3.5 px-4 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                  platform === 'instagram'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/40 border-purple-400/50 scale-[1.02]'
                    : 'bg-slate-900/70 border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <span>📸 Instagram</span>
              </button>
            </div>
          </div>

          {/* 2. Service Category Tabs */}
          <div className="mb-8">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-3">
              {language === 'ar' ? '2. نوع التفاعل المطلوب' : '2. Engagement Category'}
            </label>
            <div className={`grid gap-2.5 ${platform === 'instagram' ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
              {currentPlatformServices.map((srv) => {
                const isSel = activeService.category === srv.category;
                return (
                  <button
                    type="button"
                    key={srv.category}
                    onClick={() => handleCategoryChange(srv.category)}
                    className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 transition-all cursor-pointer font-bold text-xs sm:text-sm capitalize w-full ${
                      isSel
                        ? 'bg-purple-900/70 border-purple-400 text-white shadow-md shadow-purple-950/50'
                        : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {getCategoryIcon(srv.category)}
                    <span>{srv.category}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Combined Interactive Arrow Selector & Quick-Pick Grid */}
          <div className="mb-8 p-6 rounded-2xl bg-slate-900/80 border border-white/10 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                {language === 'ar'
                  ? `3. اختر كمية الـ ${activeService.category} (بالأسهم أو القائمة)`
                  : `3. Choose ${activeService.title} Quantity (Use Arrows or Dropdown)`}
              </label>
              <span className="text-[11px] text-pink-400 font-bold">
                {language === 'ar' ? `الباقة ${safePkgIndex + 1} من ${activeService.packages.length}` : `Package ${safePkgIndex + 1} of ${activeService.packages.length}`}
              </span>
            </div>

            {/* Interactive Arrow Carousel Showcase */}
            <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-pink-950/30 to-slate-950 border border-pink-500/30 shadow-xl mb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Left Arrow */}
              <button
                type="button"
                onClick={handlePrevPackage}
                aria-label="Previous Package"
                className="w-12 h-12 rounded-2xl bg-slate-800/90 hover:bg-pink-600 text-slate-200 hover:text-white border border-white/10 hover:border-pink-400 flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Center Display Card */}
              <div className="flex-1 text-center py-2 px-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-bold mb-2">
                  {getCategoryIcon(activeService.category)}
                  <span>{platform === 'tiktok' ? 'TikTok' : 'Instagram'} • {activeService.category}</span>
                </div>

                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight my-1">
                  {activePackage.quantity.toLocaleString()}{' '}
                  <span className="text-pink-400 capitalize">{activeService.category}</span>
                </div>

                <div className="flex items-center justify-center gap-2 my-2">
                  <span className="text-2xl sm:text-3xl font-black text-white">{activePackage.price}</span>
                  <span className="text-sm font-bold text-pink-400">{language === 'ar' ? 'ج.م' : 'L.E'}</span>
                  <span className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold ml-1">
                    {language === 'ar' ? 'تسليم فوري مضمون' : 'Guaranteed Fast'}
                  </span>
                </div>

                {/* Package Stepper Dots */}
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  {activeService.packages.map((_, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setSelectedPkgIndex(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        safePkgIndex === idx
                          ? 'w-6 bg-pink-500 shadow-md shadow-pink-500/50'
                          : 'w-2 bg-slate-700 hover:bg-slate-500'
                      }`}
                      aria-label={`Select package ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Right Arrow */}
              <button
                type="button"
                onClick={handleNextPackage}
                aria-label="Next Package"
                className="w-12 h-12 rounded-2xl bg-slate-800/90 hover:bg-pink-600 text-slate-200 hover:text-white border border-white/10 hover:border-pink-400 flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Quick-Pick Dropdown with Arrow */}
            <div className="mb-4">
              <div className="relative">
                <select
                  value={safePkgIndex}
                  onChange={(e) => setSelectedPkgIndex(Number(e.target.value))}
                  className="appearance-none w-full bg-slate-950/90 border border-white/10 hover:border-pink-500/50 text-slate-200 font-bold text-xs sm:text-sm py-3 px-4 pr-10 rounded-xl cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-pink-500/40"
                >
                  {activeService.packages.map((pkg, idx) => (
                    <option key={pkg.quantity} value={idx} className="bg-slate-900 text-white py-2">
                      {pkg.quantity.toLocaleString()} {activeService.category} — {pkg.price} {language === 'ar' ? 'ج.م' : 'L.E'}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-pink-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Quick-Pick Package Grid Tiles */}
            <div className={`grid gap-2.5 ${
              activeService.packages.length === 3
                ? 'grid-cols-3'
                : activeService.packages.length === 4
                ? 'grid-cols-2 sm:grid-cols-4'
                : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
            }`}>
              {activeService.packages.map((pkg, idx) => {
                const isSelected = safePkgIndex === idx;
                return (
                  <button
                    type="button"
                    key={pkg.quantity}
                    onClick={() => setSelectedPkgIndex(idx)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-pink-950/90 border-pink-400 text-white ring-2 ring-pink-500/50 shadow-md scale-[1.02]'
                        : 'bg-slate-950/60 border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/20'
                    }`}
                  >
                    <span className="text-xs font-black block text-white">
                      {pkg.quantity.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-bold text-pink-400 block mt-0.5">
                      {pkg.price} {language === 'ar' ? 'ج.م' : 'L.E'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Refill Warranty Selection (+50 EGP for 30 days) */}
          <div className="mb-8 p-6 rounded-2xl bg-slate-900/80 border border-purple-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <label className="text-xs font-extrabold uppercase tracking-wider text-purple-300">
                  {language === 'ar' ? '4. حماية وضمان التعويض (Refill Warranty)' : '4. Refill Warranty Protection'}
                </label>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {language === 'ar' ? 'تعويض النقص مجاناً' : 'Guarantees free refills'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {WARRANTY_OPTIONS.map((w) => {
                const isSel = warrantyDays === w.days;
                return (
                  <button
                    type="button"
                    key={w.days}
                    onClick={() => setWarrantyDays(w.days)}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isSel
                        ? 'bg-purple-950/90 border-purple-400 text-white ring-2 ring-purple-500/50'
                        : 'bg-slate-950/60 border-white/5 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-bold">{w.label}</span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          w.fee === 0
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-purple-900 text-purple-200 border border-purple-500/40'
                        }`}
                      >
                        {w.badge}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight mt-1">
                      {w.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Direct Banner for Other Services */}
          <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-pink-950/40 to-slate-900 border border-pink-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-pink-500/20 text-pink-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {language === 'ar' ? 'خدمات وسيرفرات أخرى متوفرة!' : 'Other Services are offered, dm to ask if they are there.'}
                </h4>
                <p className="text-xs text-slate-300">
                  {language === 'ar' ? 'تواصل معنا مباشرة عبر الواتساب للاستفسار عن أي خدمة إضافية.' : 'Message Selim on WhatsApp to request custom platforms or quantities.'}
                </p>
              </div>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello Selim! I would like to ask about other social media boost services.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-bold whitespace-nowrap transition-all shadow-md cursor-pointer"
            >
              {language === 'ar' ? 'استفسر عبر واتساب 💬' : 'DM on WhatsApp 💬'}
            </a>
          </div>

          {/* Summary & Add to Cart */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-white/10">
            <div>
              <span className="text-xs text-slate-400 block font-semibold">
                {language === 'ar' ? 'الإجمالي المقدر' : 'Total Price'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">{finalPrice}</span>
                <span className="text-lg font-bold text-pink-400">{language === 'ar' ? 'ج.م' : 'L.E'}</span>
                {selectedWarranty.fee > 0 && (
                  <span className="text-xs text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded-md border border-purple-500/20">
                    {language === 'ar' ? `+${selectedWarranty.fee} ج.م ضمان تعويض` : `Includes +${selectedWarranty.fee} L.E Warranty`}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              className={`w-full sm:w-auto px-8 py-4 rounded-xl font-extrabold text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
                added
                  ? 'bg-emerald-600 text-white'
                  : 'gradient-bg text-white hover:opacity-90 shadow-xl shadow-pink-900/40 hover:scale-105 active:scale-95'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" /> {language === 'ar' ? 'تمت الإضافة للطلب' : 'Added to Order'}
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" /> {language === 'ar' ? 'إضافة إلى السلة' : 'Add Boost to Cart'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
