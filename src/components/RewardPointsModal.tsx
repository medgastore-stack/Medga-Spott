import React from 'react';
import { X, Sparkles, Coins, Gift, ShoppingBag, Star, ShieldCheck, History, Tag, Bell, Trophy, CheckCircle2 } from 'lucide-react';
import { User, ToastType } from '../types';
import { useRewardPoints } from '../hooks/useRewardPoints';
import { pointsToEgpDiscount, addPoints, POINTS_REWARD_RATES, POINTS_TIERS, canRedeemFreeGame } from '../lib/pointsUtils';

interface RewardPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onOpenAuth?: () => void;
  onShowToast?: (message: string, type?: ToastType) => void;
  onOpenSuggestModal?: () => void;
  onOpenOrdersModal?: () => void;
  onOpenReviewsModal?: () => void;
  onOpenCart?: () => void;
}

export const RewardPointsModal: React.FC<RewardPointsModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenAuth,
  onShowToast,
  onOpenSuggestModal,
  onOpenOrdersModal,
  onOpenReviewsModal,
  onOpenCart,
}) => {
  const { points, history } = useRewardPoints(user);

  if (!isOpen) return null;

  const egpValue = pointsToEgpDiscount(points);
  const qualifiesFor50Egp = points >= POINTS_TIERS.DISCOUNT_THRESHOLD;
  const qualifiesForFreeGame = canRedeemFreeGame(points);

  const handleTestAddPoints = async (amount: number, label: string) => {
    await addPoints(amount, 'bonus', `Test Bonus: ${label}`, user.email, user.name);
  };

  const progressTo8k = Math.min(100, Math.round((points / POINTS_TIERS.DISCOUNT_THRESHOLD) * 100));
  const progressTo80k = Math.min(100, Math.round((points / POINTS_TIERS.FREE_GAME_THRESHOLD) * 100));

  return (
    <div className="fixed inset-0 z-[2250] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-[#1a1a2e] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-[#151525] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/30">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white">Points</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                  Loyalty System
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Reach 16k PTS for 50 L.E off &bull; Reach 180k PTS for a 100% Free Game
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance & Side Alert Banner */}
        <div className="p-6 bg-gradient-to-br from-purple-950/60 via-slate-900 to-amber-950/40 border-b border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Your Current Points Balance
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl sm:text-5xl font-black text-amber-400 font-mono tracking-tight drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                  {points.toLocaleString()}
                </span>
                <span className="text-sm font-bold text-slate-300">PTS</span>
              </div>
              <p className="text-xs text-emerald-400 font-bold mt-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                {qualifiesFor50Egp
                  ? `Active discount available: ${egpValue.toLocaleString()} L.E off at checkout!`
                  : `Reach 16,000 PTS to unlock 50 L.E discount (${(POINTS_TIERS.DISCOUNT_THRESHOLD - points).toLocaleString()} PTS to go)`}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenCart) onOpenCart();
                }}
                className="px-5 py-2.5 rounded-xl gradient-bg text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-900/40 hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Gift className="w-4 h-4" />
                <span>Spend in Cart / Payment</span>
              </button>
            </div>
          </div>

          {/* Goals / Tiers Progress Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {/* 16,000 PTS = 50 L.E Off */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              qualifiesFor50Egp 
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 shadow-md shadow-emerald-950/40' 
                : 'bg-slate-900/60 border-white/10 text-slate-300'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>50 L.E Off Discount</span>
                </span>
                <span className="text-[11px] font-mono font-black text-amber-300">16,000 PTS</span>
              </div>
              <div className="w-full bg-slate-950/80 rounded-full h-2 overflow-hidden mb-1.5 border border-white/5">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${progressTo8k}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">{progressTo8k}% Complete</span>
                <span className="font-bold">
                  {qualifiesFor50Egp ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-black">
                      <CheckCircle2 className="w-3 h-3" /> Unlocked ({egpValue} L.E Available)
                    </span>
                  ) : (
                    <span className="text-amber-400/90">
                      Need {(POINTS_TIERS.DISCOUNT_THRESHOLD - points).toLocaleString()} PTS
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* 180,000 PTS = 100% Free Game */}
            <div className={`p-3.5 rounded-2xl border transition-all ${
              qualifiesForFreeGame 
                ? 'bg-amber-950/50 border-amber-400 text-amber-200 shadow-lg shadow-amber-950/50' 
                : 'bg-slate-900/60 border-white/10 text-slate-300'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Get Any Game for FREE</span>
                </span>
                <span className="text-[11px] font-mono font-black text-amber-300">180,000 PTS</span>
              </div>
              <div className="w-full bg-slate-950/80 rounded-full h-2 overflow-hidden mb-1.5 border border-white/5">
                <div 
                  className="bg-gradient-to-r from-purple-500 via-amber-400 to-yellow-300 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${progressTo80k}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">{progressTo80k}% Complete</span>
                <span className="font-bold">
                  {qualifiesForFreeGame ? (
                    <span className="text-amber-300 flex items-center gap-1 font-black">
                      <Trophy className="w-3 h-3 text-yellow-300" /> 100% Free Game Unlocked!
                    </span>
                  ) : (
                    <span className="text-purple-300/90">
                      Need {(POINTS_TIERS.FREE_GAME_THRESHOLD - points).toLocaleString()} PTS
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Test Simulator Bar */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" /> Quick Testing Controls:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleTestAddPoints(POINTS_REWARD_RATES.GAME, 'Order of a Game (+200 PTS)')}
                className="px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 text-xs font-bold transition-all cursor-pointer"
              >
                +200 (Game)
              </button>
              <button
                type="button"
                onClick={() => handleTestAddPoints(POINTS_REWARD_RATES.PS_PLUS, 'PS Plus Subscription (+150 PTS)')}
                className="px-2.5 py-1 rounded-lg bg-sky-950/40 hover:bg-sky-900/50 border border-sky-500/30 text-sky-300 text-xs font-bold transition-all cursor-pointer"
              >
                +150 (PS Plus)
              </button>
              <button
                type="button"
                onClick={() => handleTestAddPoints(POINTS_REWARD_RATES.HEZO, 'Hezo Order (+50 PTS)')}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all cursor-pointer"
              >
                +50 (Hezo)
              </button>
              <button
                type="button"
                onClick={() => handleTestAddPoints(16000, 'Test 50 L.E Discount Tier (+16k PTS)')}
                className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 text-xs font-black transition-all cursor-pointer shadow-sm"
              >
                +16,000 (Test 50 L.E Off)
              </button>
              <button
                type="button"
                onClick={() => handleTestAddPoints(180000, 'Test Free Game Reward (+180k PTS)')}
                className="px-3 py-1 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-400/50 text-yellow-300 text-xs font-black transition-all cursor-pointer shadow-sm"
              >
                +180,000 (Test Free Game)
              </button>
            </div>
          </div>
        </div>

        {/* Earning Rates Guide */}
        <div className="p-5 border-b border-white/5 bg-[#141424]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span>Points Earning Rates Per Order</span>
            </h4>
            <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Instant Point Credit
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {/* Buying a Game */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-purple-500/20 space-y-1">
              <div className="flex items-center justify-between">
                <ShoppingBag className="w-4 h-4 text-purple-400" />
                <span className="text-[11px] font-bold text-purple-300 font-mono bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-500/30">
                  +200 PTS
                </span>
              </div>
              <div className="text-xs font-bold text-white">Each Order of a Game</div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Get 200 points with each game or game bundle you purchase.
              </p>
            </div>

            {/* PlayStation Plus */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-sky-500/20 space-y-1">
              <div className="flex items-center justify-between">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span className="text-[11px] font-bold text-sky-300 font-mono bg-sky-950/50 px-2 py-0.5 rounded-md border border-sky-500/30">
                  +150 PTS
                </span>
              </div>
              <div className="text-xs font-bold text-white">PlayStation Plus</div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Get 150 points for every PS Plus Essential, Extra, or Deluxe subscription.
              </p>
            </div>

            {/* Hezo Services */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/20 space-y-1">
              <div className="flex items-center justify-between">
                <Coins className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] font-bold text-emerald-300 font-mono bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  +50 PTS
                </span>
              </div>
              <div className="text-xs font-bold text-white">Hezo Social Services</div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Get 50 points per order for all Hezo followers, likes, and engagement boosts.
              </p>
            </div>

            {/* Suggest Game/Service */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span className="text-[11px] font-bold text-pink-300 font-mono bg-pink-950/50 px-2 py-0.5 rounded-md border border-pink-500/30">
                  +50 PTS
                </span>
              </div>
              <div className="text-xs font-bold text-white">Suggest Game or Service</div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Earn 50 points whenever you suggest a title or service to be added.
              </p>
            </div>

            {/* Review Past Order */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-[11px] font-bold text-amber-300 font-mono bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-500/30">
                  +25 PTS
                </span>
              </div>
              <div className="text-xs font-bold text-white">Review &amp; Rating</div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Earn 25 points by leaving star feedback on any delivered order.
              </p>
            </div>

            {/* Discounts Integration */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <Tag className="w-4 h-4 text-purple-400" />
                <span className="text-[11px] font-bold text-purple-300 font-mono bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-500/30">
                  Stacks
                </span>
              </div>
              <div className="text-xs font-bold text-white">Works with Coupons</div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Points seamlessly stack on checkout with valid promo discount codes.
              </p>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/5">
            {onOpenSuggestModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSuggestModal();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-pink-300 bg-pink-950/30 hover:bg-pink-900/40 border border-pink-500/30 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Suggest Game (+50 PTS)</span>
              </button>
            )}
            {onOpenReviewsModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReviewsModal();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-300 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/30 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Star className="w-3.5 h-3.5" />
                <span>Customer Reviews</span>
              </button>
            )}
            {onOpenOrdersModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenOrdersModal();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-purple-300 bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/30 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>My Orders</span>
              </button>
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" /> Points History &amp; Activity
            </span>
            <span>{history.length} transactions</span>
          </div>

          {history.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No points transactions yet. Start shopping, reviewing, or suggesting!
            </div>
          ) : (
            history.map((tx) => (
              <div
                key={tx.id}
                className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-200">{tx.description}</div>
                  <div className="text-[11px] text-slate-500">
                    {new Date(tx.createdAt).toLocaleDateString()}{' '}
                    {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div
                  className={`font-mono font-bold text-sm px-2.5 py-1 rounded-lg ${
                    tx.points >= 0
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {tx.points >= 0 ? `+${tx.points.toLocaleString()}` : tx.points.toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#121220] flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Rules: <strong>16,000 PTS = 50 L.E Off</strong> &bull; <strong>180,000 PTS = Free Game</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
