import React from 'react';
import { X, Heart, Trash2, ShoppingCart, ArrowRight, Gamepad2, Award, Zap, Rocket, Share2, Sparkles } from 'lucide-react';
import { WishlistItem } from '../types';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlist: WishlistItem[];
  onRemoveItem: (id: string) => void;
  onClearWishlist: () => void;
  onAddToCart: (item: { name: string; details: string; price: number; category: any; icon?: string }) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateToCategory?: (cat: string) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  wishlist,
  onRemoveItem,
  onClearWishlist,
  onAddToCart,
  onShowToast,
  onNavigateToCategory,
}) => {
  if (!isOpen) return null;

  const totalValue = wishlist.reduce((sum, item) => sum + (item.price || 0), 0);

  const getCategoryIcon = (category: WishlistItem['category']) => {
    switch (category) {
      case 'game':
        return <Gamepad2 className="w-5 h-5 text-purple-400" />;
      case 'psplus':
        return <Award className="w-5 h-5 text-blue-400" />;
      case 'vbucks':
        return <Zap className="w-5 h-5 text-amber-400" />;
      case 'rocket':
        return <Rocket className="w-5 h-5 text-pink-400" />;
      case 'hezo':
      default:
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getCategoryLabel = (category: WishlistItem['category']) => {
    switch (category) {
      case 'game':
        return 'PlayStation Game';
      case 'psplus':
        return 'PS Plus';
      case 'vbucks':
        return 'Fortnite V-Bucks';
      case 'rocket':
        return 'Rocket League';
      case 'hezo':
        return 'Hezo Boost';
      default:
        return 'Product';
    }
  };

  const handleAddSingleToCart = (item: WishlistItem) => {
    onAddToCart({
      name: item.name,
      details: item.details || 'Wishlist Item',
      price: item.price,
      category: item.category,
      icon: item.icon,
    });
    if (onShowToast) {
      onShowToast(`Added "${item.name}" to cart!`, 'success');
    }
  };

  const handleAddAllToCart = () => {
    if (wishlist.length === 0) return;
    wishlist.forEach((item) => {
      onAddToCart({
        name: item.name,
        details: item.details || 'Wishlist Item',
        price: item.price,
        category: item.category,
        icon: item.icon,
      });
    });
    if (onShowToast) {
      onShowToast(`Added all ${wishlist.length} wishlist items to your cart!`, 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#141426] border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-pink-950/70 via-[#19152b] to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-pink-950/60 border border-pink-500/40 flex items-center justify-center text-pink-400 shadow-lg shadow-pink-950/60">
              <Heart className="w-6 h-6 fill-pink-500 text-pink-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">My Wishlist</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs font-bold">
                  {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Saved items stored in your browser for fast access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {wishlist.length > 0 && (
              <button
                onClick={onClearWishlist}
                className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-rose-950/60 border border-white/10 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                title="Clear entire wishlist"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {wishlist.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-20 h-20 rounded-full bg-slate-900/90 border border-white/5 mx-auto flex items-center justify-center text-slate-500 mb-4">
                <Heart className="w-10 h-10 stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Your wishlist is empty</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
                Click the heart icon on any game, PS Plus plan, V-Bucks pack, or Rocket League credits to save it here for later.
              </p>
              {onNavigateToCategory && (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToCategory('games');
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-purple-950/60 cursor-pointer"
                  >
                    <Gamepad2 className="w-3.5 h-3.5" />
                    <span>Explore Games</span>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToCategory('vbucks');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>V-Bucks</span>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToCategory('rocket');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Rocket className="w-3.5 h-3.5 text-pink-400" />
                    <span>Rocket League</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {wishlist.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-900/70 border border-white/5 hover:border-pink-500/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-white/5">
                          {getCategoryLabel(item.category)}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-white truncate mt-1">
                        {item.name}
                      </h4>
                      {item.details && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {item.details}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    <div className="text-left sm:text-right">
                      <div className="text-base font-black text-emerald-400">
                        {item.price > 0 ? `${item.price} L.E` : 'Contact for price'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAddSingleToCart(item)}
                        className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-purple-950/60 cursor-pointer"
                        title="Add this item to cart"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>

                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/70 border border-white/5 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {wishlist.length > 0 && (
          <div className="p-5 bg-slate-950 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400 block font-semibold">Total Estimated Value</span>
              <span className="text-2xl font-black text-white">
                {totalValue} <span className="text-sm font-bold text-purple-400">L.E</span>
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={handleAddAllToCart}
                className="flex-1 sm:flex-none px-5 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white shadow-xl shadow-purple-950/50 transition-all cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Move All to Cart</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
