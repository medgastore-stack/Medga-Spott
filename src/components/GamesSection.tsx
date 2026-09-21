import React, { useState, useMemo } from 'react';
import { Game, PlatformType, WishlistItem, Order, isLowStock } from '../types';
import { gamesData, calculateGamePrice } from '../data/gamesData';
import { Search, ShoppingCart, Check, Gamepad2, Info, Sparkles, Heart, Layers, Zap, Clock, Calendar, Star, Coins, Flame, CheckCircle2, AlertTriangle, AlertCircle, Ban } from 'lucide-react';
import { GameDetailsModal } from './GameDetailsModal';
import { GameRequestBanner } from './GameRequestBanner';
import { PreorderCountdown } from './PreorderCountdown';
import { getDeliveryEstimate } from '../lib/deliveryEstimates';
import { useLanguage } from '../context/LanguageContext';
import { handleImageError } from '../utils/imageHelper';

interface GamesSectionProps {
  onAddToCart: (item: { name: string; details: string; price: number; category: 'game'; icon?: string }) => void;
  onInstantBuy?: (item: { name: string; details: string; price: number; category: 'game'; icon?: string }) => void;
  isWishlisted?: (id: string) => boolean;
  onToggleWishlist?: (item: Omit<WishlistItem, 'addedAt'>) => void;
  hasOrderedCategory?: (category: 'game' | 'psplus' | 'vbucks' | 'rocket' | 'hezo') => boolean;
  onOpenEditionComparison?: (gameId?: string) => void;
  onOpenReviewsModal?: (productId?: string, productTitle?: string) => void;
  onOpenSuggestModal?: (type?: 'game' | 'service') => void;
  onOpenSearchModal?: () => void;
  orders?: Order[];
}

export const GamesSection: React.FC<GamesSectionProps> = ({
  onAddToCart,
  onInstantBuy,
  isWishlisted,
  onToggleWishlist,
  hasOrderedCategory,
  onOpenEditionComparison,
  onOpenReviewsModal,
  onOpenSuggestModal,
  onOpenSearchModal,
  orders = [],
}) => {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('prim5');
  const [catalogMode, setCatalogMode] = useState<'all' | 'instock' | 'preorder' | 'bought'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price_low' | 'price_high' | 'name'>('featured');
  const [addedGameId, setAddedGameId] = useState<string | null>(null);
  const [activeModalGame, setActiveModalGame] = useState<Game | null>(null);

  const hasOrderedGames = hasOrderedCategory ? hasOrderedCategory('game') : false;

  // Check if a game was previously purchased by the user
  const isGameBoughtBefore = (game: Game): boolean => {
    if (orders && orders.length > 0) {
      const gName = (game.name || '').toLowerCase().trim();
      const gId = (game.id || '').toLowerCase().trim();
      const found = orders.some((order) =>
        order.items?.some((item) => {
          const iName = (item.name || '').toLowerCase().trim();
          const iId = (item.id || '').toLowerCase().trim();
          return (
            iName.includes(gName) ||
            gName.includes(iName) ||
            iId.includes(gId) ||
            (gId === 'fc26' && iName.includes('fc 26')) ||
            (gId === 'gtav' && (iName.includes('gta') || iName.includes('grand theft auto'))) ||
            (gId === 'rdr2' && iName.includes('red dead'))
          );
        })
      );
      if (found) return true;
    }
    try {
      const saved = localStorage.getItem('medga_bought_items');
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        if (parsed.includes(game.id) || parsed.includes(game.name)) return true;
      }
    } catch {}
    return false;
  };

  const boughtGamesCount = useMemo(() => {
    return gamesData.filter(isGameBoughtBefore).length;
  }, [orders]);

  const isGameBestDeal = (gameId: string, isOffer?: boolean) => {
    if (!hasOrderedGames) return false;
    return (
      Boolean(isOffer) ||
      gameId === 'it_takes_two' ||
      gameId === 'fc26' ||
      gameId === 'gtav' ||
      gameId === 'rdr2' ||
      gameId === 'fc27_std'
    );
  };

  const platformLabels: Record<PlatformType, { title: string; subtitle: string; tag: string }> = {
    prim5: {
      title: language === 'ar' ? 'أساسي PS5 (برايمري 5)' : 'PS5 Primary (Prim 5)',
      subtitle: language === 'ar' ? 'حساب كامل على حساب جهازك الأساسي' : 'Full account on PS5 main profile',
      tag: language === 'ar' ? 'برايمري 5' : 'Prim 5',
    },
    prim4: {
      title: language === 'ar' ? 'أساسي PS4 (برايمري 4)' : 'PS4 Primary (Prim 4)',
      subtitle: language === 'ar' ? 'حساب كامل على حساب جهازك الأساسي' : 'Full account on PS4 main profile',
      tag: language === 'ar' ? 'برايمري 4' : 'Prim 4',
    },
    sec: {
      title: language === 'ar' ? 'حساب ثانوي (سكندري)' : 'Secondary (Sec)',
      subtitle: language === 'ar' ? 'العب على الحساب المزود مباشرة (PS4/PS5)' : 'Play on assigned profile (PS4/PS5)',
      tag: language === 'ar' ? 'سكندري' : 'Sec',
    },
    full: {
      title: language === 'ar' ? 'حساب كامل (3 أشخاص)' : 'Full Access (3 People)',
      subtitle: language === 'ar' ? 'حساب كامل مشترك لجميع الأجهزة' : 'Full account shared access',
      tag: language === 'ar' ? 'فول أكسس' : 'Full Access',
    },
  };

  const filteredGames = useMemo(() => {
    let list = gamesData.filter((game) => {
      const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (game.genre && game.genre.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchesSearch) return false;

      if (selectedGenre !== 'all') {
        const gameGenre = (game.genre || '').toLowerCase();
        if (!gameGenre.includes(selectedGenre.toLowerCase())) return false;
      }

      if (catalogMode === 'preorder') {
        return Boolean(game.isPreorder);
      }
      if (catalogMode === 'instock') {
        return !game.isPreorder;
      }
      if (catalogMode === 'bought') {
        return isGameBoughtBefore(game);
      }
      return true;
    });

    if (sortBy === 'price_low') {
      list = [...list].sort((a, b) => (a[selectedPlatform] || 0) - (b[selectedPlatform] || 0));
    } else if (sortBy === 'price_high') {
      list = [...list].sort((a, b) => (b[selectedPlatform] || 0) - (a[selectedPlatform] || 0));
    } else if (sortBy === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [searchTerm, catalogMode, selectedGenre, sortBy, selectedPlatform, orders]);

  const handleAdd = (game: Game, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const rawPrice = game[selectedPlatform];
    const finalPrice = calculateGamePrice(rawPrice);
    if (finalPrice <= 0) return;

    const details = `${platformLabels[selectedPlatform].tag} Account`;
    onAddToCart({
      name: game.name,
      details,
      price: finalPrice,
      category: 'game',
      icon: game.icon
    });

    setAddedGameId(`${game.id}-${selectedPlatform}`);
    setTimeout(() => setAddedGameId(null), 1200);
  };

  return (
    <section id="games-section" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Gamepad2 className="w-4 h-4 text-purple-400" />
            <span>{language === 'ar' ? 'متجر بلايستيشن الرقمي' : 'PlayStation Digital Store'}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">
            PlayStation <span className="gradient-text">{language === 'ar' ? 'كتالوج الألعاب' : 'Games Catalog'}</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base sm:text-lg">
            {language === 'ar'
              ? 'اختر لعبتك، وحدد نوع الحساب (أساسي أو ثانوي لأجهزة PS4 و PS5) واستلم فوراً.'
              : 'Choose your game, select platform type (Primary or Secondary for PS4 & PS5), and instantly order.'}
          </p>
        </div>

        {/* Platform Selection Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 max-w-4xl mx-auto">
          {(['prim5', 'prim4', 'sec', 'full'] as PlatformType[]).map((platform) => {
            const isSelected = selectedPlatform === platform;
            return (
              <button
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
                className={`p-3.5 rounded-2xl border text-center transition-all duration-200 cursor-pointer relative overflow-hidden active:scale-95 ${
                  isSelected
                    ? 'bg-purple-900/80 border-purple-500 text-white shadow-xl shadow-purple-950/60 scale-[1.02] ring-1 ring-purple-400/30'
                    : 'bg-[#1a1a2e]/60 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="font-extrabold text-sm sm:text-base flex items-center justify-center gap-1.5">
                  <span className="text-purple-300">{platformLabels[platform].tag}</span>
                </div>
                <div className="text-[11px] opacity-80 mt-0.5 truncate">{platformLabels[platform].title}</div>
              </button>
            );
          })}
        </div>

        {/* Interactive Platform Explainer Banner */}
        <div className="max-w-4xl mx-auto mb-8 p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900/80 to-purple-950/60 border border-purple-500/30 flex items-center justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-center gap-2.5 text-purple-200">
            <Info className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="leading-relaxed">
              {selectedPlatform === 'prim5' &&
                (language === 'ar'
                  ? '🎮 أساسي PS5: تفعيل رئيسي لجهازك. العب من حسابك الشخصي وجمّع التروفيز مع دعم الأوفلاين.'
                  : '🎮 PS5 Primary: Full primary rights on PS5. Play on your personal account with full trophy sync.')}
              {selectedPlatform === 'prim4' &&
                (language === 'ar'
                  ? '🎮 أساسي PS4: تفعيل رئيسي لجهاز PS4. جميع حساباتك على الجهاز تستطيع تشغيل اللعبة بأمان.'
                  : '🎮 PS4 Primary: Full primary activation on PS4. All accounts on your console can play.')}
              {selectedPlatform === 'sec' &&
                (language === 'ar'
                  ? '⚡ ثانوي (سكندري): تلعب مباشرة من الحساب المسلم لك مع دعم الأونلاين والتخزين السحابي.'
                  : '⚡ Secondary Account: Play directly on the provided account with full online multiplayer access.')}
              {selectedPlatform === 'full' &&
                (language === 'ar'
                  ? '🔑 فول أكسس: امتلاك كامل للحساب وصلاحية وصول لجميع الأجهزة.'
                  : '🔑 Full Access: Complete account credentials with shared access support.')}
            </span>
          </div>
          <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {platformLabels[selectedPlatform].tag}
          </span>
        </div>

        {/* Search Bar */}
        <div className="max-w-lg mx-auto mb-8 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'ar' ? 'ابحث عن لعبة (FC 26, GTA V, Spider-Man...)' : 'Search games (FC 26, GTA V, Spider-Man...)'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 bg-[#1a1a2e]/90 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors shadow-xl text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                {language === 'ar' ? 'مسح' : 'Clear'}
              </button>
            )}
          </div>
          {onOpenSearchModal && (
            <button
              type="button"
              onClick={onOpenSearchModal}
              className="px-3.5 py-3.5 rounded-2xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 text-xs font-bold transition-all shrink-0 hover:scale-105 active:scale-95 cursor-pointer shadow-md"
              title={language === 'ar' ? 'فتح نافذة البحث الكامل' : 'Open full catalog search modal'}
            >
              {language === 'ar' ? 'بحث شامل' : 'Full Search'}
            </button>
          )}
        </div>

        {/* Catalog View Mode Switcher & Pre-Order Option (Not in the top menu) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6">
          <button
            type="button"
            onClick={() => setCatalogMode('all')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              catalogMode === 'all'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/60 scale-105 ring-1 ring-purple-400/40'
                : 'bg-[#1a1a2e]/80 text-slate-400 hover:text-white border border-white/5 hover:bg-slate-800/60'
            }`}
          >
            {language === 'ar' ? `جميع ألعاب بلايستيشن (${gamesData.length})` : `All PlayStation Games (${gamesData.length})`}
          </button>
          <button
            type="button"
            onClick={() => setCatalogMode('instock')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              catalogMode === 'instock'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60 scale-105 ring-1 ring-emerald-400/40'
                : 'bg-[#1a1a2e]/80 text-slate-400 hover:text-emerald-300 border border-white/5 hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'ar' ? '⚡ متوفر فوري (تسليم 1-2 ساعة)' : '⚡ In-Stock (1–2 Hr Delivery)'}</span>
          </button>
          <button
            type="button"
            onClick={() => setCatalogMode('preorder')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
              catalogMode === 'preorder'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-xl shadow-amber-950/50 scale-105 font-black ring-2 ring-amber-300'
                : 'bg-[#1a1a2e]/80 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:bg-amber-950/20'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{language === 'ar' ? '⏳ قسم الطلب المسبق' : '⏳ Pre-Orders Vault'}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              {language === 'ar' ? `${gamesData.filter((g) => g.isPreorder).length} قادم` : `${gamesData.filter((g) => g.isPreorder).length} Upcoming`}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setCatalogMode('bought')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              catalogMode === 'bought'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60 scale-105 ring-1 ring-emerald-400/40'
                : 'bg-[#1a1a2e]/80 text-emerald-300 hover:text-white border border-emerald-500/30 hover:bg-emerald-950/20'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'ar' ? 'تم شراؤه سابقاً' : 'Bought Before'}</span>
            {boughtGamesCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                {boughtGamesCount}
              </span>
            )}
          </button>
        </div>

        {/* Bought Before Informational Banner */}
        {catalogMode === 'bought' && (
          <div className="mb-8 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950/70 via-[#0a2318] to-purple-950/50 border border-emerald-500/40 shadow-2xl animate-in fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-950/50">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {language === 'ar' ? 'سجل مشترياتك السابقة' : 'Your Purchase History'}
                    </span>
                    <span className="text-xs text-emerald-400 font-bold">
                      {language === 'ar' ? 'ألعاب قمت بطلبها من قبل' : 'Items You Ordered Before'}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-1">
                    {language === 'ar' ? 'ألعاب تم شراؤها مسبقاً' : 'Previously Purchased Products'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                    {language === 'ar'
                      ? 'هنا تجد الألعاب التي قمت بطلبها سابقاً لمتابعة تفاصيلها، مقارنة النسخ، أو إعادة طلب نسخة إضافية بسهولة وسرعة.'
                      : 'Browse products you previously bought from Medga Store to review details, compare editions, or easily re-order for friends.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pre-Order Section Informational Banner */}
        {catalogMode === 'preorder' && (
          <div className="mb-8 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-950/70 via-[#221305] to-purple-950/50 border border-amber-500/40 shadow-2xl animate-in fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-950/50">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {language === 'ar' ? 'عروض حصرية للطلب المسبق' : 'Pre-Order Exclusives'}
                    </span>
                    <span className="text-xs text-amber-400 font-bold">
                      {language === 'ar' ? 'ليس تسليماً فورياً • يُسلّم يوم الصدور الرسمي' : 'Not Instant • Delivered on Official Launch'}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-1">
                    {language === 'ar' ? 'قسم حجز الطلب المسبق' : 'Pre-Order Reservation Vault'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                    {language === 'ar'
                      ? 'عرض الألعاب المتوفرة حالياً للحجز المسبق (غير مخصصة للعب الفوري حالياً). يضمن لك الحجز المسبق الحصول على بيانات الحساب بأقل سعر رسمي، بالإضافة لجميع حزم وهدايا الطلب المسبق الإضافية فور صدورها.'
                      : 'Showing items that are currently being pre-ordered (not bought for instant play at the moment). Pre-ordering guarantees your account credentials, lowest launch price, and official pre-order bonus DLCs delivered on release day.'}
                  </p>
                </div>
              </div>

              {onOpenReviewsModal && (
                <button
                  type="button"
                  onClick={() => onOpenReviewsModal()}
                  className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold bg-amber-900/40 hover:bg-amber-800/50 border border-amber-500/30 text-amber-300 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{language === 'ar' ? 'تقييمات الحجز المسبق' : 'See Pre-Order Reviews'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Edition Comparison Interactive Callout */}
        {onOpenEditionComparison && (
          <div className="mb-10 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-950/80 via-[#191538] to-blue-950/80 border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5 text-center md:text-left">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0 shadow-lg shadow-purple-950/50">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {language === 'ar' ? 'دليل اختيار النسخة' : 'Buyers Decision Guide'}
                  </span>
                  {hasOrderedGames && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-400" /> {language === 'ar' ? 'أفضل العروض مميزة' : 'Best Deals Highlighted'}
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mt-1">
                  {language === 'ar' ? 'محتار تختار أي نسخة؟ قارن بين Standard و Ultimate' : 'Unsure which edition to pick? Compare Standard vs Ultimate'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {language === 'ar'
                    ? 'شاهد مقارنة شاملة للعب المبكر ونقاط FC Points وأموال الأونلاين وحزم DLC الحصرية.'
                    : 'See side-by-side early access, FC Points, bonus online cash, and exclusive pre-order DLC perks.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenEditionComparison('fc27')}
              className="w-full md:w-auto px-5 py-3 rounded-2xl gradient-bg text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-950/60 hover:opacity-90 transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
            >
              <Layers className="w-4 h-4" />
              <span>{language === 'ar' ? 'دليل مقارنة النسخ' : 'Compare Editions Guide'}</span>
            </button>
          </div>
        )}

        {/* Interactive Genre Filters & Sorter */}
        <div className="flex flex-wrap items-center justify-between gap-3 max-w-5xl mx-auto mb-6">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', labelAr: 'الكل', labelEn: 'All Genres' },
              { id: 'Sports', labelAr: 'رياضة وكورة', labelEn: 'Sports' },
              { id: 'Action', labelAr: 'أكشن ومغامرات', labelEn: 'Action' },
              { id: 'Co-op', labelAr: 'ألعاب جماعية (Co-Op)', labelEn: 'Co-Op' },
              { id: 'Horror', labelAr: 'رعب وبقاء', labelEn: 'Horror' },
              { id: 'Racing', labelAr: 'سباقات', labelEn: 'Racing' },
            ].map((genre) => (
              <button
                key={genre.id}
                type="button"
                onClick={() => setSelectedGenre(genre.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedGenre === genre.id
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-950'
                    : 'bg-slate-900/70 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {language === 'ar' ? genre.labelAr : genre.labelEn}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-bold">{language === 'ar' ? 'ترتيب:' : 'Sort by:'}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#1a1a2e] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="featured">{language === 'ar' ? 'المميزة' : 'Featured'}</option>
              <option value="price_low">{language === 'ar' ? 'الأقل سعراً' : 'Price: Low to High'}</option>
              <option value="price_high">{language === 'ar' ? 'الأعلى سعراً' : 'Price: High to Low'}</option>
              <option value="name">{language === 'ar' ? 'أبجدياً (A-Z)' : 'Name: A-Z'}</option>
            </select>
          </div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game) => {
            const rawBase = game[selectedPlatform];
            const price = calculateGamePrice(rawBase);
            const isSoldOut = Boolean(game.isSoldOut || game.stock === 0);
            const isAvailable = !isSoldOut && price > 0;
            const isJustAdded = addedGameId === `${game.id}-${selectedPlatform}`;
            const isWishItem = isWishlisted ? isWishlisted(`game-${game.id}`) : false;
            const isBestDeal = isGameBestDeal(game.id, game.isOffer);
            const isBought = isGameBoughtBefore(game);
            const lowStock = !isSoldOut && isLowStock(game.stock);
            const hasMultipleEditions =
              game.id.startsWith('fc27') || game.id.startsWith('gta6') || game.id === 'spiderman2';
            const deliveryEstimate = getDeliveryEstimate('game', game.isPreorder);

            return (
              <div
                key={game.id}
                onClick={() => setActiveModalGame(game)}
                className={`group relative rounded-2xl glass-panel p-5 border transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between cursor-pointer ${
                  isSoldOut
                    ? 'border-rose-500/40 bg-slate-950/80 opacity-85 hover:border-rose-400/80 shadow-lg shadow-rose-950/20'
                    : lowStock
                    ? 'border-rose-500/50 hover:border-rose-400 shadow-lg shadow-rose-950/30'
                    : isBought
                    ? 'border-emerald-500/40 hover:border-emerald-400/80 shadow-lg shadow-emerald-950/20'
                    : game.isPreorder
                    ? 'border-amber-500/40 hover:border-amber-400/80 shadow-lg shadow-amber-950/20'
                    : isBestDeal
                    ? 'border-emerald-500/40 hover:border-emerald-400/80 shadow-lg shadow-emerald-950/20'
                    : 'border-white/5 hover:border-purple-500/50'
                }`}
              >
                {/* Dynamic Badges: Sold Out / Bought Before / Low Stock / Pre-Order / Best Deal / Hot */}
                <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10 max-w-[75%]">
                  {isSoldOut && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600/30 text-rose-300 border border-rose-500/60 flex items-center gap-1 shadow-md shadow-rose-950/60">
                      <AlertCircle className="w-3 h-3 text-rose-400" />
                      <span>{language === 'ar' ? 'نفذت الكمية (Sold Out)' : 'Sold Out'}</span>
                    </span>
                  )}
                  {!isSoldOut && isBought && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 flex items-center gap-1 shadow-md shadow-emerald-950/60">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{language === 'ar' ? 'تم شراؤه سابقاً' : 'Bought Before'}</span>
                    </span>
                  )}
                  {lowStock && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/25 text-rose-300 border border-rose-500/50 flex items-center gap-1 shadow-md shadow-rose-950/60 animate-pulse">
                      <Flame className="w-3 h-3 text-rose-400" />
                      <span>{language === 'ar' ? `متبقي ${game.stock} فقط!` : `Low Stock: ${game.stock} Left`}</span>
                    </span>
                  )}
                  {!isSoldOut && game.isPreorder ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-md shadow-amber-950/60">
                      <Clock className="w-3 h-3 text-amber-400" /> {language === 'ar' ? 'حجز مسبق' : 'Pre-Order'}
                    </span>
                  ) : !isSoldOut && isBestDeal ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-md shadow-emerald-950/60 animate-pulse">
                      <Zap className="w-3 h-3 text-emerald-400" /> {language === 'ar' ? 'أفضل عرض' : 'Best Deal'}
                    </span>
                  ) : !isSoldOut && game.popular ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm">
                      <Sparkles className="w-3 h-3 text-amber-400" /> {language === 'ar' ? 'شائع' : 'Hot'}
                    </span>
                  ) : null}
                </div>

                {/* Heart / Wishlist Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleWishlist) {
                      onToggleWishlist({
                        id: `game-${game.id}`,
                        productId: game.id,
                        name: game.name,
                        category: 'game',
                        price: isAvailable ? price : calculateGamePrice(game.prim5 || game.sec || 0),
                        details: `${platformLabels[selectedPlatform].tag} • ${game.genre || 'PlayStation'}`,
                        icon: game.icon,
                      });
                    }
                  }}
                  className={`absolute top-3 right-3 p-2 rounded-xl transition-all z-10 cursor-pointer ${
                    isWishItem
                      ? 'bg-pink-950/80 border border-pink-500/60 text-pink-400 shadow-md shadow-pink-950/50'
                      : 'bg-slate-900/80 hover:bg-pink-950/40 border border-white/10 hover:border-pink-500/40 text-slate-400 hover:text-pink-400'
                  }`}
                  title={isWishItem ? (language === 'ar' ? 'إزالة من المفضلة' : 'Remove from Wishlist') : (language === 'ar' ? 'إضافة إلى المفضلة' : 'Add to Wishlist')}
                >
                  <Heart
                    className={`w-4 h-4 transition-transform active:scale-125 ${
                      isWishItem ? 'fill-pink-500 text-pink-500' : ''
                    }`}
                  />
                </button>

                <div>
                  {/* Icon / Cover Thumbnail & Title Header */}
                  <div className={`flex items-start gap-3.5 mb-3.5 ${game.isPreorder || isBestDeal || game.popular ? 'mt-7' : ''}`}>
                    <div className="w-14 h-18 sm:w-16 sm:h-20 rounded-xl overflow-hidden shrink-0 shadow-lg shadow-purple-950/50 border border-white/20 bg-slate-900 group-hover:scale-105 transition-all">
                      {game.image ? (
                        <img
                          src={game.image}
                          onError={handleImageError}
                          alt={game.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full gradient-bg flex items-center justify-center">
                          <Gamepad2 className="w-7 h-7 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-purple-300 transition-colors flex items-center gap-1.5 leading-snug">
                        {game.name}
                      </h3>
                      {game.genre && (
                        <p className="text-xs text-slate-400 mt-1 font-medium">{game.genre}</p>
                      )}
                    </div>
                  </div>

                  {/* Trust & Delivery Estimation Tag + Review Preview */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg border ${
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
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenReviewsModal(game.id, game.name);
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-amber-300 border border-white/5 transition-colors cursor-pointer"
                        title="Click to inspect customer ratings & reviews"
                      >
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{language === 'ar' ? '4.9 (التقييمات)' : '4.9 (Reviews)'}</span>
                      </button>
                    )}
                  </div>

                  {/* Pre-Order Specific Release Details & Countdown */}
                  {game.isPreorder && (
                    <div className="space-y-2 mb-3">
                      <PreorderCountdown targetDate={game.targetReleaseDate} releaseDateLabel={game.releaseDate} compact={true} />
                      {game.preorderBonus && (
                        <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/20 text-slate-300 text-[10px] truncate">
                          <span className="text-amber-400 font-bold">{language === 'ar' ? 'هدية الحجز:' : 'Bonus:'}</span> {game.preorderBonus}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bought Before Indicator Bar */}
                  {isBought && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-emerald-950/60 to-teal-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold mb-3 shadow-inner">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>
                          {language === 'ar' ? 'قمت بشراء هذا المنتج سابقاً' : 'You previously bought this item'}
                        </span>
                      </div>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 uppercase">
                        {language === 'ar' ? 'طلب مجدد' : 'Re-order'}
                      </span>
                    </div>
                  )}

                  {/* Account Type Specs */}
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 mb-3 text-xs space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>{language === 'ar' ? 'الخيار المحدد:' : 'Selected Option:'}</span>
                      <span className="font-bold text-purple-300">{platformLabels[selectedPlatform].tag}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>{language === 'ar' ? 'اضغط للعرض:' : 'Click to view:'}</span>
                      <span className="text-purple-400 font-semibold flex items-center gap-1">
                        <Info className="w-3 h-3" /> {language === 'ar' ? 'جميع الخيارات' : 'All options'}
                      </span>
                    </div>
                  </div>

                  {/* Compare Editions Button on supported games */}
                  {onOpenEditionComparison && hasMultipleEditions && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const compId = game.id.startsWith('fc27')
                          ? 'fc27'
                          : game.id.startsWith('gta6')
                          ? 'gta6'
                          : 'spiderman2';
                        onOpenEditionComparison(compId);
                      }}
                      className="w-full mb-3 py-1.5 px-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/30 hover:border-purple-400 text-purple-300 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      <span>{language === 'ar' ? 'قارن بين Standard و Ultimate' : 'Compare Standard vs Ultimate'}</span>
                    </button>
                  )}
                </div>

                {/* Price & Add to Cart Footer */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-slate-400 block font-semibold">
                      {isSoldOut ? (language === 'ar' ? 'حالة التوفر' : 'Availability') : (language === 'ar' ? 'السعر الإجمالي' : 'Total Price')}
                    </span>
                    {isSoldOut ? (
                      <span className="text-base sm:text-lg font-black text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>{language === 'ar' ? 'نفذت الكمية' : 'Sold Out'}</span>
                      </span>
                    ) : isAvailable ? (
                      <div>
                        <span className="text-2xl font-black text-white">
                          {price.toLocaleString()} <span className="text-xs font-bold text-purple-400">{language === 'ar' ? 'ج.م' : 'L.E'}</span>
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-rose-400">{language === 'ar' ? 'غير متوفر' : 'Not Available'}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isSoldOut ? (
                      <div className="px-4 py-2.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 font-black text-xs flex items-center gap-1.5 cursor-not-allowed">
                        <Ban className="w-3.5 h-3.5 text-rose-400" />
                        <span>{language === 'ar' ? 'نفذت الكمية' : 'Sold Out'}</span>
                      </div>
                    ) : (
                      <>
                        <button
                          disabled={!isAvailable}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rawPrice = game[selectedPlatform];
                            const finalPrice = calculateGamePrice(rawPrice);
                            if (finalPrice <= 0) return;
                            const item = {
                              name: game.name,
                              details: `${platformLabels[selectedPlatform].tag} Account`,
                              price: finalPrice,
                              category: 'game' as const,
                              icon: game.icon,
                            };
                            if (onInstantBuy) {
                              onInstantBuy(item);
                            } else {
                              handleAdd(game, e);
                            }
                          }}
                          className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                            !isAvailable
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-40'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/60 hover:scale-105 active:scale-95'
                          }`}
                          title={language === 'ar' ? 'شراء فوري مباشر' : 'Instant Buy'}
                        >
                          <Zap className="w-3.5 h-3.5 text-yellow-300" />
                          <span>{language === 'ar' ? 'شراء فوري' : 'Buy Now'}</span>
                        </button>

                        <button
                          disabled={!isAvailable}
                          onClick={(e) => handleAdd(game, e)}
                          className={`px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                            !isAvailable
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                              : isJustAdded
                              ? 'bg-emerald-600 text-white'
                              : game.isPreorder
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black shadow-lg shadow-amber-950/40 hover:scale-105 active:scale-95'
                              : 'gradient-bg text-white hover:opacity-90 shadow-md shadow-purple-900/30 hover:scale-105 active:scale-95'
                          }`}
                        >
                          {isJustAdded ? (
                            <>
                              <Check className="w-4 h-4" /> {game.isPreorder ? (language === 'ar' ? 'تم الحجز' : 'Reserved') : (language === 'ar' ? 'تمت الإضافة' : 'Added')}
                            </>
                          ) : game.isPreorder ? (
                            <>
                              <Calendar className="w-4 h-4" /> {language === 'ar' ? 'حجز مسبق' : 'Pre-Order'}
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4" /> {language === 'ar' ? 'إضافة' : 'Add'}
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredGames.length === 0 && (
          <div className="text-center py-16 text-slate-400 bg-slate-900/40 rounded-2xl border border-white/5">
            <p className="text-lg font-semibold">
              {language === 'ar' ? `لا توجد ألعاب تطابق "${searchTerm}"` : `No games match "${searchTerm}"`}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {language === 'ar' ? 'جرب البحث عن FC 26 أو GTA V أو Spider-Man' : 'Try searching for FC 26, GTA V, or Spider-Man'}
            </p>
          </div>
        )}

        {/* Game Request Banner */}
        <GameRequestBanner onOpenSuggestModal={onOpenSuggestModal} />

        {/* Game Modal */}
        <GameDetailsModal
          game={activeModalGame}
          isOpen={!!activeModalGame}
          onClose={() => setActiveModalGame(null)}
          onAddToCart={onAddToCart}
          onInstantBuy={onInstantBuy}
          isWishlisted={isWishlisted}
          onToggleWishlist={onToggleWishlist}
          onOpenEditionComparison={onOpenEditionComparison}
          onOpenReviewsModal={onOpenReviewsModal}
          isBoughtBefore={activeModalGame ? isGameBoughtBefore(activeModalGame) : false}
        />
      </div>
    </section>
  );
};
