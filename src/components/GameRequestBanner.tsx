import React from 'react';
import { Gamepad2, Sparkles, MessageSquare, Coins } from 'lucide-react';

interface GameRequestBannerProps {
  onOpenSuggestModal?: (type?: 'game' | 'service') => void;
}

export const GameRequestBanner: React.FC<GameRequestBannerProps> = ({ onOpenSuggestModal }) => {
  const handleRequestGame = () => {
    if (onOpenSuggestModal) {
      onOpenSuggestModal('game');
    } else {
      const defaultMsg = `Hello Medga Store! I would like to request a price quote for this game: [WRITE GAME TITLE HERE]`;
      window.open(`https://wa.me/201042240852?text=${encodeURIComponent(defaultMsg)}`, '_blank');
    }
  };

  const handleRequestService = () => {
    if (onOpenSuggestModal) {
      onOpenSuggestModal('service');
    } else {
      const defaultMsg = `Hello Medga Store! I would like to request a custom service quote for: [WRITE SERVICE DETAILS HERE]`;
      window.open(`https://wa.me/201042240852?text=${encodeURIComponent(defaultMsg)}`, '_blank');
    }
  };

  return (
    <div className="mt-16 max-w-5xl mx-auto px-4">
      {/* Banner Card styled with ambient glow */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1c080a] via-[#100304] to-[#1c080a] border border-red-900/40 p-8 sm:p-12 text-center shadow-[0_0_50px_rgba(220,38,38,0.15)] flex flex-col items-center justify-center">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-red-500 font-extrabold text-xs sm:text-sm tracking-widest uppercase">
              GAME & SERVICE REQUEST
            </span>
          </div>

          <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Can't find your game or service?
          </h3>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Suggest any game, DLC, or digital service, and our fulfillment team will price and source it for you immediately.
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-4">
            {/* Request A Game */}
            <button
              onClick={handleRequestGame}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl font-black text-sm text-white bg-red-600 hover:bg-red-500 active:scale-95 shadow-[0_0_25px_rgba(220,38,38,0.5)] transition-all cursor-pointer"
            >
              <Gamepad2 className="w-5 h-5" />
              <span>Suggest a Game</span>
            </button>

            {/* Request A Service */}
            <button
              onClick={handleRequestService}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 active:scale-95 shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span>Suggest a Service</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
