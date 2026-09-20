import React, { useState, useEffect } from 'react';
import { Gamepad2, ShoppingCart, User as UserIcon, LogOut, ChevronDown, Menu, X, Heart, Truck, Languages } from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  wishlistCount: number;
  onOpenWishlist: () => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onOpenOrders: () => void;
  onOpenSearch?: () => void;
  onOpenComparison?: () => void;
  onOpenGoogleSheets?: () => void;
  onOpenLiveChat?: () => void;
  onOpenContactOwner?: () => void;
  onOpenRewardPoints?: () => void;
  rewardPointsBalance?: number;
  onOpenReviews?: () => void;
  user: User;
  onLogout: () => void;
  activeCategory?: string;
  onSelectCategory?: (cat: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  wishlistCount,
  onOpenWishlist,
  onOpenAuth,
  onOpenOrders,
  user,
  onLogout,
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, toggleLanguage, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      setScrollProgress(scrolled);
      setIsScrolled(winScroll > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-900 z-[1001]">
        <div
          className="h-full gradient-bg transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <nav
        className={`fixed top-1 left-0 right-0 z-[1000] transition-all duration-300 ${
          isScrolled
            ? 'bg-[#0f0f1a]/90 backdrop-blur-xl border-b border-white/10 py-3 shadow-2xl'
            : 'bg-[#0f0f1a]/60 backdrop-blur-md py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <a
            href="#"
            className="flex items-center gap-2.5 group text-white text-xl sm:text-2xl font-black tracking-tight shrink-0"
          >
            <div className="p-2 rounded-xl gradient-bg group-hover:scale-105 transition-transform shadow-lg shadow-purple-900/40">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <span className="gradient-text font-extrabold">Medga Store</span>
          </a>

          {/* Top Menu Actions: Track Order, Change Language, Wishlist Heart, Cart, Sign In & Sign Up */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 1. Track Order */}
            <button
              type="button"
              onClick={onOpenOrders}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-200 hover:text-white transition-all text-xs sm:text-sm font-bold cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
              title={t.navTrackOrder}
            >
              <Truck className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="hidden sm:inline">{t.navTrackOrder}</span>
            </button>

            {/* 2. Change Language */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-purple-950/70 hover:bg-purple-900/90 border border-purple-400/40 text-purple-200 hover:text-white transition-all cursor-pointer text-xs sm:text-sm font-black shadow-md shadow-purple-950/50 hover:scale-105 active:scale-95"
              title={language === 'en' ? 'التبديل إلى اللغة العربية' : 'Switch to English'}
            >
              <Languages className="w-3.5 h-3.5 text-purple-300 shrink-0" />
              <span>{t.languageBtn}</span>
            </button>

            {/* 3. The Heart of the Wishlists */}
            <button
              type="button"
              onClick={onOpenWishlist}
              className="relative p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-200 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
              title={t.navWishlist}
            >
              <Heart className={`w-5 h-5 ${wishlistCount > 0 ? 'text-pink-500 fill-pink-500' : 'text-slate-300'}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[10px] font-black bg-pink-500 text-white rounded-full shadow-lg">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* 4. The Cart */}
            <button
              type="button"
              onClick={onOpenCart}
              className="relative p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-200 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
              title={t.navCart}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 text-xs font-bold bg-pink-500 text-white rounded-full shadow-lg animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

            {/* 5. Sign In and Sign Up Buttons */}
            {user.isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-200 hover:bg-purple-900/60 transition-all cursor-pointer text-xs sm:text-sm font-semibold"
                  >
                    <UserIcon className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="max-w-[75px] sm:max-w-[110px] truncate">{user.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 py-2 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-2 border-b border-white/5">
                        <p className="text-xs text-slate-400">{language === 'ar' ? 'مسجل الدخول كـ' : 'Signed in as'}</p>
                        <p className="text-sm font-bold text-white truncate">{user.email || user.name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          onOpenOrders();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-purple-300 hover:bg-purple-950/40 transition-colors text-left cursor-pointer border-b border-white/5"
                      >
                        <Truck className="w-4 h-4 text-purple-400" />
                        <span>{t.navTrackOrder}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:bg-rose-950/40 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t.navLogOut}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Direct Logout Button */}
                <button
                  type="button"
                  onClick={onLogout}
                  className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 hover:border-rose-400 text-rose-300 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                  title={t.navLogOut}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.navLogOut}</span>
                </button>
              </div>
            ) : (
              <>
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenAuth('login')}
                    className="px-3 py-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    {t.navSignIn}
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenAuth('signup')}
                    className="px-3.5 py-2 text-xs sm:text-sm font-bold text-white gradient-bg rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-purple-900/30 cursor-pointer"
                  >
                    {t.navSignUp}
                  </button>
                </div>

                {/* Mobile Hamburger toggle for small screens to access Sign In / Sign Up */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="sm:hidden p-2 rounded-xl bg-slate-800/80 border border-white/10 text-slate-300 hover:text-white cursor-pointer"
                  title="Menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Dropdown for small screens: only contains Sign In and Sign Up */}
        {mobileMenuOpen && !user.isAuthenticated && (
          <div className="sm:hidden px-4 pt-3 pb-4 border-t border-white/10 bg-[#0f0f1a] mt-3 space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('login');
                }}
                className="flex-1 py-2 text-center text-sm font-semibold rounded-xl bg-slate-800 text-slate-200 border border-white/10"
              >
                {t.navSignIn}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('signup');
                }}
                className="flex-1 py-2 text-center text-sm font-bold rounded-xl gradient-bg text-white shadow-md"
              >
                {t.navSignUp}
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};
