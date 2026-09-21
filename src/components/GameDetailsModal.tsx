import React, { useState } from 'react';
import { X, Gamepad2, ShoppingCart, Check, ShieldCheck, Sparkles, Tv, HelpCircle, Heart, Layers, ChevronRight, Star, Clock, Calendar, Coins, Flame, CheckCircle2, AlertTriangle, Zap, AlertCircle, Ban } from 'lucide-react';
import { Game, PlatformType, WishlistItem, isLowStock } from '../types';
import { calculateGamePrice } from '../data/gamesData';
import { getDeliveryEstimate } from '../lib/deliveryEstimates';
import { PreorderCountdown } from './PreorderCountdown';
import { useLanguage } from '../context/LanguageContext';
import { handleImageError } from '../utils/imageHelper';

interface GameDetailsModalProps {
  game: Game | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: { name: string; details: string; price: number; category: 'game'; icon?: string }) => void;
  onInstantBuy?: (item: { name: string; details: string; price: number; category: 'game'; icon?: string }) => void;
  isWishlisted?: (id: string) => boolean;
  onToggleWishlist?: (item: Omit<WishlistItem, 'addedAt'>) => void;
  onOpenEditionComparison?: (gameId?: string) => void;
  onOpenReviewsModal?: (productId?: string, productTitle?: string) => void;
  isBoughtBefore?: boolean;
}

export const GameDetailsModal: React.FC<GameDetailsModalProps> = ({
  game,
  isOpen,
  onClose,
  onAddToCart,
  onInstantBuy,
  isWishlisted,
  onToggleWishlist,
  onOpenEditionComparison,
  onOpenReviewsModal,
  isBoughtBefore = false,
}) => {
  const { language } = useLanguage();
  const [selectedOption, setSelectedOption] = useState<PlatformType>('prim5');
  const [added, setAdded] = useState(false);

  if (!isOpen || !game) return null;

  const optionDetails: Record<
    PlatformType,
    { title: string; subtitle: string; description: string; badge: string; icon: string }
  > = {
    prim5: {
      title: language === 'ar' ? 'أساسي PS5 (برايمري 5)' : 'PS5 Primary (Prim 5)',
      subtitle: language === 'ar' ? 'العب على حسابك الشخصي على جهاز PS5' : 'Play on your personal profile on PS5',
      description: language === 'ar'
        ? 'تفعّل الحساب كـ Primary على جهاز PS5 الخاص بك، وتلعب من حسابك الأساسي الشخصي مع حفظ كامل التروفيز واللعب أونلاين.'
        : 'You activate the account as Primary on your PS5 console. Play from your personal account with full trophies & online access.',
      badge: language === 'ar' ? 'أفضل تجربة' : 'Best Experience',
      icon: '🎮',
    },
    prim4: {
      title: language === 'ar' ? 'أساسي PS4 (برايمري 4)' : 'PS4 Primary (Prim 4)',
      subtitle: language === 'ar' ? 'العب على حسابك الشخصي على جهاز PS4' : 'Play on your personal profile on PS4',
      description: language === 'ar'
        ? 'تفعّل الحساب كـ Primary على جهاز PS4 الخاص بك، وتلعب من حسابك الشخصي مع حفظ التروفيز واللعب الجماعي.'
        : 'You activate the account as Primary on your PS4 console. Play on your personal account with full trophy progression.',
      badge: language === 'ar' ? 'مفضل لـ PS4' : 'PS4 Favorite',
      icon: '🎮',
    },
    sec: {
      title: language === 'ar' ? 'حساب ثانوي (سكندري)' : 'Secondary (Sec)',
      subtitle: language === 'ar' ? 'العب مباشرة من ملف الحساب المزود' : 'Play directly on assigned account profile',
      description: language === 'ar'
        ? 'تلعب مباشرة من الحساب المزود نفسه مع وجود اتصال إنترنت دائم أثناء اللعب.'
        : 'You play directly from the provided account profile (requires active internet connection while playing).',
      badge: language === 'ar' ? 'أفضل سعر' : 'Best Price',
      icon: '⚡',
    },
    full: {
      title: language === 'ar' ? 'حساب كامل (مشاركة لـ 3 أفراد)' : 'Full Access (Can share w/ 3 people)',
      subtitle: language === 'ar' ? 'تحكم كامل وأصلي بالحساب' : 'Complete original account control',
      description: language === 'ar'
        ? 'حساب كامل مع الإيميل الأساسي يمكنك مشاركته مع ما يصل إلى 3 أصدقاء أو أجهزة مختلفة.'
        : 'Full access account provided that can be shared with up to 3 people or consoles.',
      badge: language === 'ar' ? 'ملكية كاملة' : 'Full Ownership',
      icon: '🔑',
    },
  };

  const isSoldOut = Boolean(game.isSoldOut || game.stock === 0);
  const rawPrice = game[selectedOption];
  const finalPrice = calculateGamePrice(rawPrice);
  const isAvailable = !isSoldOut && finalPrice > 0;
  const wishId = `game-${game.id}`;
  const isCurrentlyWishlisted = isWishlisted ? isWishlisted(wishId) : false;
  const deliveryEstimate = getDeliveryEstimate('game', game.isPreorder);

  const handleToggleWishlist = () => {
    if (onToggleWishlist) {
      onToggleWishlist({
        id: wishId,
        productId: game.id,
        name: game.name,
        category: 'game',
        price: isAvailable ? finalPrice : calculateGamePrice(game.prim5 || game.sec || 0),
        details: `${optionDetails[selectedOption].title} • ${game.genre || 'PS Game'}`,
        icon: game.icon,
      });
    }
  };

  const handleAdd = () => {
    if (!isAvailable) return;
    onAddToCart({
      name: game.name,
      details: `${optionDetails[selectedOption].title}`,
      price: finalPrice,
      category: 'game',
      icon: game.icon,
    });
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#141426] border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header Background */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-r from-purple-950 via-[#181832] to-slate-900 border-b border-white/10 flex items-start justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-18 h-24 sm:w-22 sm:h-30 rounded-2xl overflow-hidden shrink-0 shadow-2xl shadow-purple-950/70 border-2 border-white/20 bg-slate-900">
              {game.image ? (
                <img
                  src={game.image}
                  onError={handleImageError}
                  alt={game.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full gradient-bg flex items-center justify-center">
                  <Gamepad2 className="w-9 h-9 text-white" />
                </div>
              )}
            </div>
            <div>
              {game.popular && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" /> {language === 'ar' ? 'لعبة شائعة' : 'Hot Game'}
                </span>
              )}
              {/* PlayStation game names kept in English */}
              <h2 className="text-xl sm:text-3xl font-black text-white leading-tight">
                {game.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {isBoughtBefore && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{language === 'ar' ? 'تم شراؤه سابقاً' : 'Bought Before'}</span>
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                    game.isPreorder
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  {game.isPreorder ? (
                    <Calendar className="w-3 h-3 text-amber-400" />
                  ) : (
                    <Clock className="w-3 h-3 text-emerald-400" />
                  )}
                  <span>{deliveryEstimate.label}</span>
                </span>

                {onOpenReviewsModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenReviewsModal(game.id, game.name);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                  >
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{language === 'ar' ? 'تقييمات اللاعبين' : 'See Customer Reviews'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleWishlist}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                isCurrentlyWishlisted
                  ? 'bg-pink-950/80 border border-pink-500/60 text-pink-400 shadow-md shadow-pink-950/50'
                  : 'bg-slate-800/80 hover:bg-pink-950/40 border border-white/10 hover:border-pink-500/40 text-slate-400 hover:text-pink-400'
              }`}
              title={isCurrentlyWishlisted ? (language === 'ar' ? 'إزالة من المفضلة' : 'Remove from Wishlist') : (language === 'ar' ? 'إضافة إلى المفضلة' : 'Add to Wishlist')}
            >
              <Heart className={`w-5 h-5 ${isCurrentlyWishlisted ? 'fill-pink-500 text-pink-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {/* Sold Out Callout Banner */}
          {isSoldOut && (
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 flex items-start gap-3 text-rose-200 shadow-lg shadow-rose-950/50">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-300">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-white">
                    {language === 'ar' ? 'هذا الإصدار نفذت كميته بالكامل (Sold Out)' : 'This Edition is Completely Sold Out'}
                  </span>
                </div>
                <p className="text-xs text-rose-200/90 mt-1 leading-relaxed">
                  {language === 'ar'
                    ? 'تم حجز كامل النسخ المخصصة لهذا الإصدار. يمكنك اختيار إصدار FC ULTIMATE EDITION 🔥 أو Standard Edition المتوفرين للحجز والطلب الفوري.'
                    : 'All allocated copies for this edition have been claimed. You can choose FC ULTIMATE EDITION 🔥 or Standard Edition.'}
                </p>
              </div>
            </div>
          )}

          {/* Bought Before Callout Banner */}
          {isBoughtBefore && (
            <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 flex items-start justify-between gap-3 text-emerald-300 shadow-lg shadow-emerald-950/40">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-300">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-white">
                      {language === 'ar' ? 'لقد قمت بشراء هذه اللعبة سابقاً' : 'You Purchased This Product Previously'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {language === 'ar' ? 'طلب سابق مؤكد' : 'Verified Purchase'}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed">
                    {language === 'ar'
                      ? 'يمكنك إعادة طلب نسخة إضافية لنفسك أو لصديق بأي وقت، أو التواصل مع سليم مالك المتجر إذا كنت بحاجة للمساعدة في بيانات حسابك.'
                      : 'You can easily re-order an extra copy anytime or reach out to store owner Selim if you need help with your login details.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pre-Order Countdown Banner */}
          {game.isPreorder && (
            <PreorderCountdown
              targetDate={game.targetReleaseDate}
              releaseDateLabel={game.releaseDate}
            />
          )}

          {/* Option Selector Label */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-purple-400 block mb-3">
              {language === 'ar' ? 'اختر نوع الحساب (أساسي أو ثانوي):' : 'Select Account Option (Primary vs Secondary):'}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['prim5', 'prim4', 'sec', 'full'] as PlatformType[])
                .filter((opt) => (game[opt] ?? 0) > 0)
                .map((opt) => {
                const info = optionDetails[opt];
                const optPrice = calculateGamePrice(game[opt]);
                const isSelected = selectedOption === opt;

                return (
                  <button
                    key={opt}
                    onClick={() => setSelectedOption(opt)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'bg-purple-950/80 border-purple-500 text-white shadow-xl shadow-purple-950/60 ring-2 ring-purple-500/50 scale-[1.02]'
                        : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-purple-500/40 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="font-extrabold text-sm sm:text-base flex items-center gap-1.5">
                        <span>{info.icon}</span> {info.title}
                      </div>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500 text-white shadow">
                          {language === 'ar' ? 'محدد' : 'Selected'}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {info.subtitle}
                    </p>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-500">{info.badge}</span>
                      <span className="text-base font-black text-white">
                        {optPrice > 0 ? `${optPrice} ${language === 'ar' ? 'ج.م' : 'L.E'}` : (language === 'ar' ? 'غير متوفر' : 'Unavailable')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Option Deep Breakdown */}
          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 space-y-2">
            <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>{language === 'ar' ? `طريقة عمل حساب ${optionDetails[selectedOption].title}:` : `How ${optionDetails[selectedOption].title} works:`}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {optionDetails[selectedOption].description}
            </p>
            <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-2">
              <Tv className="w-3.5 h-3.5 text-purple-400" />
              <span>
                {language === 'ar'
                  ? 'تسليم فوري عبر واتساب مع شرح وخطوات التفعيل خطوة بخطوة.'
                  : 'Instant WhatsApp delivery with complete step-by-step setup guide.'}
              </span>
            </div>
          </div>

          {/* Pre-Order Specific Callout */}
          {game.isPreorder && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 via-stone-900 to-amber-950/50 border border-amber-500/40 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>{language === 'ar' ? 'معلومات حجز الطلب المسبق (Pre-Order):' : 'Pre-Order Reservation Info:'}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {language === 'ar'
                  ? `هذه اللعبة مجدولة للإصدار في ${game.releaseDate || '2026'}. بحجزك الآن، نضمن لك تسليم بيانات الحساب وإضافات الـ DLC الحصرية فور يوم الإطلاق الرسمي.`
                  : `This title is currently scheduled for release in ${game.releaseDate || '2026'}. By placing your order now, your digital account credentials and pre-order bonus DLCs are guaranteed for delivery on official launch day.`}
              </p>
              {game.preorderBonus && (
                <div className="text-xs text-amber-200/90 font-semibold pt-1">
                  🎁 {language === 'ar' ? 'مكافأة الطلب المسبق:' : 'Pre-Order Bonus:'} {game.preorderBonus}
                </div>
              )}
            </div>
          )}

          {/* Standard vs Ultimate Comparison Prompt */}
          {onOpenEditionComparison && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">
                    {language === 'ar' ? 'مقارنة النسخة العادية مع الألتيميت' : 'Compare Standard vs Ultimate Editions'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {language === 'ar' ? 'شاهد نقاط المكافأة، الوصول المبكر، ومزايا الـ DLC جنباً إلى جنب' : 'View bonus points, early access, and DLC perks side-by-side'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  const compId = game.id.startsWith('fc27') ? 'fc27' : game.id.startsWith('gta6') ? 'gta6' : game.id === 'spiderman2' ? 'spiderman2' : 'fc27';
                  onOpenEditionComparison(compId);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition-all shadow-md shadow-purple-950/60 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>{language === 'ar' ? 'قارن النسخ' : 'Compare Editions'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer / Price & Add Button */}
        <div className="p-5 bg-slate-950 border-t border-white/10 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 block font-semibold">
              {isSoldOut ? (language === 'ar' ? 'حالة التوفر' : 'Availability') : (language === 'ar' ? 'السعر الإجمالي' : 'Total Price')}
            </span>
            {isSoldOut ? (
              <span className="text-xl font-black text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <span>{language === 'ar' ? 'نفذت الكمية' : 'Sold Out'}</span>
              </span>
            ) : isAvailable ? (
              <div>
                <span className="text-2xl font-black text-white">
                  {finalPrice.toLocaleString()} <span className="text-sm font-bold text-purple-400">{language === 'ar' ? 'ج.م' : 'L.E'}</span>
                </span>
              </div>
            ) : (
              <span className="text-sm font-bold text-rose-400">{language === 'ar' ? 'الخيار غير متاح' : 'Option Unavailable'}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleWishlist}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-2 text-sm font-bold ${
                isCurrentlyWishlisted
                  ? 'bg-pink-950/80 border-pink-500/60 text-pink-400 shadow-md shadow-pink-950/50'
                  : 'bg-slate-900 border-white/10 hover:border-pink-500/40 text-slate-300 hover:text-pink-400'
              }`}
              title={isCurrentlyWishlisted ? (language === 'ar' ? 'إزالة من المفضلة' : 'Remove from Wishlist') : (language === 'ar' ? 'إضافة إلى المفضلة' : 'Add to Wishlist')}
            >
              <Heart className={`w-5 h-5 ${isCurrentlyWishlisted ? 'fill-pink-500 text-pink-500' : ''}`} />
              <span className="hidden sm:inline">{isCurrentlyWishlisted ? (language === 'ar' ? 'في المفضلة' : 'Wishlisted') : (language === 'ar' ? 'المفضلة' : 'Wishlist')}</span>
            </button>

            {isSoldOut ? (
              <div className="px-6 py-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 font-black text-sm flex items-center gap-2 cursor-not-allowed">
                <Ban className="w-4 h-4 text-rose-400" />
                <span>{language === 'ar' ? 'نفذت الكمية بالكامل' : 'Sold Out'}</span>
              </div>
            ) : (
              <>
                {onInstantBuy && isAvailable && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onInstantBuy({
                        name: game.name,
                        details: `${optionDetails[selectedOption].title}`,
                        price: finalPrice,
                        category: 'game',
                        icon: game.icon,
                      });
                    }}
                    className="px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center gap-2 transition-all shadow-xl shadow-emerald-950/50 hover:scale-105 active:scale-95 cursor-pointer"
                    title={language === 'ar' ? 'شراء فوري مباشر' : 'Instant Checkout'}
                  >
                    <Zap className="w-4 h-4 text-yellow-300" />
                    <span>{language === 'ar' ? 'شراء فوري' : 'Buy Now'}</span>
                  </button>
                )}

                <button
                  disabled={!isAvailable}
                  onClick={handleAdd}
                  className={`px-6 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2.5 transition-all cursor-pointer ${
                    !isAvailable
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : added
                      ? 'bg-emerald-600 text-white'
                      : game.isPreorder
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black shadow-xl shadow-amber-950/50 hover:scale-105 active:scale-95'
                      : 'gradient-bg text-white hover:opacity-90 shadow-xl shadow-purple-900/50 hover:scale-105 active:scale-95'
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-5 h-5" /> {game.isPreorder ? (language === 'ar' ? 'تم حجز الطلب المسبق!' : 'Pre-Order Reserved!') : (language === 'ar' ? 'تمت الإضافة للسلة!' : 'Added to Cart!')}
                    </>
                  ) : game.isPreorder ? (
                    <>
                      <Calendar className="w-5 h-5" /> {language === 'ar' ? `اطلب مسبقاً الآن (${finalPrice} ج.م)` : `Pre-Order Now (${finalPrice} L.E)`}
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" /> {language === 'ar' ? `إضافة إلى الطلب (${finalPrice} ج.م)` : `Add to Order (${finalPrice} L.E)`}
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
