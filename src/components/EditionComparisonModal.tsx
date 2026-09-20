import React, { useState } from 'react';
import { X, Check, ShoppingCart, Heart, Sparkles, Trophy, Car, Gamepad2, Layers, HelpCircle, ChevronRight, Zap, ShieldCheck } from 'lucide-react';
import { comparisonGames, GameComparisonData } from '../data/editionsData';
import { PlatformType, WishlistItem } from '../types';

interface EditionComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGameId?: string;
  onAddToCart: (item: { name: string; details: string; price: number; category: 'game'; icon?: string }) => void;
  isWishlisted?: (id: string) => boolean;
  onToggleWishlist?: (item: Omit<WishlistItem, 'addedAt'>) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const EditionComparisonModal: React.FC<EditionComparisonModalProps> = ({
  isOpen,
  onClose,
  initialGameId = 'fc27',
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
  onShowToast,
}) => {
  const safeInitialId = typeof initialGameId === 'string' && initialGameId ? initialGameId : 'fc27';
  const [selectedGameId, setSelectedGameId] = useState<string>(safeInitialId);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('prim5');
  const [addedEdition, setAddedEdition] = useState<string | null>(null);

  // Sync initial game when opened
  React.useEffect(() => {
    if (typeof initialGameId === 'string' && initialGameId && comparisonGames.some((g) => g.gameId === initialGameId)) {
      setSelectedGameId(initialGameId);
    }
  }, [initialGameId, isOpen]);

  if (!isOpen) return null;

  const currentGame = comparisonGames.find((g) => g.gameId === selectedGameId) || comparisonGames[0];

  const platformLabels: Record<PlatformType, { label: string; sub: string }> = {
    prim5: { label: 'PS5 Primary', sub: 'Main Profile on PS5' },
    prim4: { label: 'PS4 Primary', sub: 'Main Profile on PS4' },
    sec: { label: 'Secondary (Sec)', sub: 'Assigned Profile' },
    full: { label: 'Full Access', sub: 'Multi-device account' },
  };

  const getGameIcon = (icon: string) => {
    switch (icon) {
      case 'trophy':
        return <Trophy className="w-5 h-5 text-amber-400" />;
      case 'car':
        return <Car className="w-5 h-5 text-purple-400" />;
      default:
        return <Gamepad2 className="w-5 h-5 text-blue-400" />;
    }
  };

  const stdPrice = currentGame.standardEdition.prices[selectedPlatform] || 0;
  const ultPrice = currentGame.ultimateEdition.prices[selectedPlatform] || 0;

  const handleAdd = (edition: 'standard' | 'ultimate') => {
    const isStd = edition === 'standard';
    const opt = isStd ? currentGame.standardEdition : currentGame.ultimateEdition;
    const price = isStd ? stdPrice : ultPrice;

    if (!price) {
      if (onShowToast) onShowToast('This option is not available for the selected platform', 'error');
      return;
    }

    onAddToCart({
      name: `${currentGame.title} (${opt.name})`,
      details: `${platformLabels[selectedPlatform].label}`,
      price,
      category: 'game',
      icon: currentGame.icon,
    });

    setAddedEdition(opt.id);
    if (onShowToast) {
      onShowToast(`Added ${currentGame.title} ${opt.name} to your cart!`, 'success');
    }

    setTimeout(() => {
      setAddedEdition(null);
    }, 1500);
  };

  const handleWishlist = (edition: 'standard' | 'ultimate') => {
    const isStd = edition === 'standard';
    const opt = isStd ? currentGame.standardEdition : currentGame.ultimateEdition;
    const price = isStd ? stdPrice : ultPrice;
    const wishId = `edition-${opt.id}-${selectedPlatform}`;

    if (onToggleWishlist) {
      onToggleWishlist({
        id: wishId,
        productId: opt.id,
        name: `${currentGame.title} - ${opt.name}`,
        category: 'game',
        price: price || 0,
        details: `${platformLabels[selectedPlatform].label}`,
        icon: currentGame.icon,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#111122] border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-950 via-[#181832] to-slate-900 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-lg shadow-purple-950/50">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-extrabold uppercase tracking-wider border border-purple-500/30">
                  Buyer's Decision Guide
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">• Compare & Choose</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                Game Edition <span className="gradient-text">Comparison</span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
            aria-label="Close Comparison"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Game Tabs & Platform Selector Bar */}
        <div className="p-4 sm:px-6 bg-[#15152a] border-b border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shrink-0">
          {/* Game Selection Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {comparisonGames.map((g) => {
              const isSelected = g.gameId === selectedGameId;
              return (
                <button
                  key={g.gameId}
                  onClick={() => setSelectedGameId(g.gameId)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/60 ring-1 ring-purple-400/40'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-white/5'
                  }`}
                >
                  {getGameIcon(g.icon)}
                  <span>{g.title}</span>
                </button>
              );
            })}
          </div>

          {/* Platform Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-white/5 shrink-0 self-start sm:self-auto">
            {(['prim5', 'prim4', 'sec', 'full'] as PlatformType[]).map((plt) => {
              const isSelected = selectedPlatform === plt;
              return (
                <button
                  key={plt}
                  onClick={() => setSelectedPlatform(plt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={platformLabels[plt].sub}
                >
                  {platformLabels[plt].label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Active Game Info Banner */}
          <div className="glass-panel p-4 rounded-2xl border border-white/5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center shrink-0">
              {getGameIcon(currentGame.icon)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">{currentGame.title}</h3>
                <span className="text-xs text-slate-400 font-medium">({currentGame.publisher})</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">{currentGame.description}</p>
            </div>
          </div>

          {/* Side-by-Side Edition Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Standard Edition Card */}
            <div className="rounded-3xl p-5 sm:p-6 bg-slate-900/60 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between relative">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-white/10">
                    {currentGame.standardEdition.badge || 'Standard Edition'}
                  </span>
                  <span className="text-xs text-slate-400">Essential Base Game</span>
                </div>

                <h4 className="text-xl sm:text-2xl font-black text-white mb-1">
                  {currentGame.standardEdition.name}
                </h4>
                <p className="text-xs text-slate-400 mb-5">{currentGame.standardEdition.tagline}</p>

                {/* Price */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 mb-5">
                  <span className="text-xs text-slate-400 block mb-0.5">
                    Price for {platformLabels[selectedPlatform].label}:
                  </span>
                  {stdPrice > 0 ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-white">{stdPrice}</span>
                      <span className="text-sm font-bold text-purple-400">L.E</span>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-rose-400">Platform not available for Standard</span>
                  )}
                </div>

                {/* What's Included bullet preview */}
                <div className="space-y-2 mb-6 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Full Base Game across PS4 & PS5</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Full Online Multiplayer Access</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="w-4 h-4 text-center leading-none text-slate-500 font-bold shrink-0">—</span>
                    <span>No pre-order early access</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="w-4 h-4 text-center leading-none text-slate-500 font-bold shrink-0">—</span>
                    <span>No bonus in-game currency packs</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                {onToggleWishlist && (
                  <button
                    type="button"
                    onClick={() => handleWishlist('standard')}
                    className="p-3 rounded-xl border border-white/10 hover:border-pink-500/40 bg-slate-800 text-slate-300 hover:text-pink-400 transition-all cursor-pointer"
                    title="Wishlist Standard Edition"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isWishlisted && isWishlisted(`edition-${currentGame.standardEdition.id}-${selectedPlatform}`)
                          ? 'fill-pink-500 text-pink-500'
                          : ''
                      }`}
                    />
                  </button>
                )}

                <button
                  disabled={!stdPrice}
                  onClick={() => handleAdd('standard')}
                  className={`flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    !stdPrice
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : addedEdition === currentGame.standardEdition.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-white active:scale-95'
                  }`}
                >
                  {addedEdition === currentGame.standardEdition.id ? (
                    <>
                      <Check className="w-4 h-4" /> Added!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" /> Choose Standard
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Ultimate / Deluxe Edition Card */}
            <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-b from-purple-950/70 via-[#191538] to-[#121124] border-2 border-purple-500 shadow-2xl shadow-purple-950/60 flex flex-col justify-between relative scale-[1.01]">
              <div className="absolute -top-3 right-6 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-lg flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-200" />
                <span>{currentGame.ultimateEdition.badge || 'Ultimate Experience'}</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-600 text-white">
                    Recommended
                  </span>
                  <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> Best Deal per Feature
                  </span>
                </div>

                <h4 className="text-xl sm:text-2xl font-black text-white mb-1">
                  {currentGame.ultimateEdition.name}
                </h4>
                <p className="text-xs text-purple-200 mb-5">{currentGame.ultimateEdition.tagline}</p>

                {/* Price */}
                <div className="p-4 rounded-2xl bg-purple-950/80 border border-purple-500/40 mb-5 shadow-inner">
                  <span className="text-xs text-purple-200 block mb-0.5">
                    Price for {platformLabels[selectedPlatform].label}:
                  </span>
                  {ultPrice > 0 ? (
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-white">{ultPrice}</span>
                        <span className="text-sm font-bold text-amber-400">L.E</span>
                      </div>
                      {stdPrice > 0 && ultPrice > stdPrice && (
                        <span className="text-[11px] font-extrabold text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                          +{(ultPrice - stdPrice)} L.E for all bonuses
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-rose-400">Platform not available for Ultimate</span>
                  )}
                </div>

                {/* What's Included bullet preview */}
                <div className="space-y-2 mb-6 text-xs text-slate-200">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-bold text-white">All Standard Edition features included</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-bold text-amber-300">Early Access play ahead of launch</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Massive In-Game Currency & Special Pre-order Item</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Exclusive VIP Cosmetics & Season Pass perks</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-purple-500/20">
                {onToggleWishlist && (
                  <button
                    type="button"
                    onClick={() => handleWishlist('ultimate')}
                    className="p-3 rounded-xl border border-purple-400/30 hover:border-pink-500/40 bg-purple-900/60 text-purple-200 hover:text-pink-400 transition-all cursor-pointer"
                    title="Wishlist Ultimate Edition"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isWishlisted && isWishlisted(`edition-${currentGame.ultimateEdition.id}-${selectedPlatform}`)
                          ? 'fill-pink-500 text-pink-500'
                          : ''
                      }`}
                    />
                  </button>
                )}

                <button
                  disabled={!ultPrice}
                  onClick={() => handleAdd('ultimate')}
                  className={`flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    !ultPrice
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : addedEdition === currentGame.ultimateEdition.id
                      ? 'bg-emerald-600 text-white'
                      : 'gradient-bg text-white hover:opacity-90 shadow-xl shadow-purple-900/50 hover:scale-[1.02] active:scale-95'
                  }`}
                >
                  {addedEdition === currentGame.ultimateEdition.id ? (
                    <>
                      <Check className="w-4 h-4" /> Added Ultimate!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" /> Upgrade to Ultimate
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Perks Breakdown Table */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 overflow-hidden">
            <h4 className="text-base font-black text-white mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <span>Side-by-Side Feature Matrix</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[550px]">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-3">Feature / Entitlement</th>
                    <th className="py-3 px-3 text-center w-40">Standard Edition</th>
                    <th className="py-3 px-3 text-center w-52 bg-purple-950/40 text-purple-300 rounded-t-xl">
                      Ultimate / Deluxe
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
                  {currentGame.perks.map((perk, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{perk.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{perk.description}</div>
                      </td>

                      {/* Standard Column */}
                      <td className="py-3 px-3 text-center align-middle">
                        {typeof perk.standard === 'boolean' ? (
                          perk.standard ? (
                            <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                          ) : (
                            <span className="text-slate-500 font-bold">—</span>
                          )
                        ) : (
                          <span className="text-xs font-semibold text-slate-300">{perk.standard}</span>
                        )}
                      </td>

                      {/* Ultimate Column */}
                      <td className="py-3 px-3 text-center align-middle bg-purple-950/20">
                        {typeof perk.deluxeOrUltimate === 'boolean' ? (
                          perk.deluxeOrUltimate ? (
                            <div className="inline-flex items-center justify-center p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                              <Check className="w-4 h-4" />
                            </div>
                          ) : (
                            <span className="text-slate-500 font-bold">—</span>
                          )
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-purple-900/60 text-amber-300 border border-purple-400/30 text-xs font-extrabold shadow-sm">
                            {perk.deluxeOrUltimate}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Buyer Recommendation Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5">
              <div className="flex items-center gap-2 text-xs font-black text-slate-300 uppercase tracking-wider mb-1">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>Who should pick Standard?</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {currentGame.verdict.standardRecommend}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30">
              <div className="flex items-center gap-2 text-xs font-black text-amber-300 uppercase tracking-wider mb-1">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Who should pick Ultimate?</span>
              </div>
              <p className="text-xs text-purple-200 leading-relaxed">
                {currentGame.verdict.ultimateRecommend}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="p-4 sm:px-6 bg-[#15152a] border-t border-white/10 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>All editions include lifetime account warranty and instant WhatsApp credentials delivery.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
