import React from 'react';
import { Home, Gamepad2, Heart, Search, ShoppingBag, Package } from 'lucide-react';
import { CartItem, WishlistItem } from '../types';

interface MobileBottomNavProps {
  cart: CartItem[];
  wishlist: WishlistItem[];
  language?: string;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenTracker: () => void;
  onOpenSearch: () => void;
  onScrollToGames: () => void;
  onScrollToTop: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  cart,
  wishlist,
  language = 'en',
  onOpenCart,
  onOpenWishlist,
  onOpenTracker,
  onOpenSearch,
  onScrollToGames,
  onScrollToTop,
}) => {
  const totalCartCount = cart.length;
  const totalWishlistCount = wishlist.length;

  return (
    <nav
      aria-label="Mobile Navigation"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-[1900] bg-[#0a0a14]/95 backdrop-blur-lg border-t border-white/10 px-2 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.8)]"
      style={{ paddingBottom: 'calc(0.375rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
        {/* Home */}
        <button
          type="button"
          onClick={onScrollToTop}
          className="flex flex-col items-center justify-center py-1 text-slate-400 hover:text-purple-400 active:text-purple-400 transition-colors cursor-pointer group"
        >
          <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold mt-1 tracking-tight">
            {language === 'ar' ? 'الرئيسية' : 'Home'}
          </span>
        </button>

        {/* Catalog / Games */}
        <button
          type="button"
          onClick={onScrollToGames}
          className="flex flex-col items-center justify-center py-1 text-slate-400 hover:text-purple-400 active:text-purple-400 transition-colors cursor-pointer group"
        >
          <Gamepad2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold mt-1 tracking-tight">
            {language === 'ar' ? 'الألعاب' : 'Games'}
          </span>
        </button>

        {/* Wishlist */}
        <button
          type="button"
          onClick={onOpenWishlist}
          className="flex flex-col items-center justify-center py-1 text-slate-400 hover:text-pink-400 active:text-pink-400 transition-colors cursor-pointer group relative"
        >
          <div className="relative">
            <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {totalWishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-pink-600 text-white rounded-full text-[9px] font-extrabold flex items-center justify-center shadow-sm">
                {totalWishlistCount > 9 ? '9+' : totalWishlistCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold mt-1 tracking-tight">
            {language === 'ar' ? 'المفضلة' : 'Wishlist'}
          </span>
        </button>

        {/* Live Order Tracker */}
        <button
          type="button"
          onClick={onOpenTracker}
          className="flex flex-col items-center justify-center py-1 text-slate-400 hover:text-emerald-400 active:text-emerald-400 transition-colors cursor-pointer group"
        >
          <Package className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold mt-1 tracking-tight whitespace-nowrap">
            {language === 'ar' ? 'تتبع الطلب' : 'Track'}
          </span>
        </button>

        {/* Cart */}
        <button
          type="button"
          onClick={onOpenCart}
          className="flex flex-col items-center justify-center py-1 text-purple-400 hover:text-purple-300 active:text-purple-300 transition-colors cursor-pointer group relative"
        >
          <div className="relative">
            <div className="w-9 h-7 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner">
              <ShoppingBag className="w-4 h-4 text-purple-300" />
            </div>
            {totalCartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-purple-500 text-white rounded-full text-[9px] font-extrabold flex items-center justify-center animate-pulse shadow">
                {totalCartCount > 9 ? '9+' : totalCartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold mt-0.5 tracking-tight text-purple-300">
            {language === 'ar' ? 'السلة' : 'Cart'}
          </span>
        </button>
      </div>
    </nav>
  );
};
