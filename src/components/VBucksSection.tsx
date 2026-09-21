import React, { useState } from 'react';
import { vBucksData, WHATSAPP_NUMBER } from '../data/storeData';
import { ShoppingCart, Check, Mail, Eye, EyeOff, Sparkles, Zap, Heart, Phone, User } from 'lucide-react';
import { WishlistItem, Order } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { saveOrderToBackend } from '../lib/orderUtils';
import { getImageUrl, handleImageError } from '../utils/imageHelper';

interface VBucksSectionProps {
  onAddToCart: (item: { name: string; details: string; price: number; category: 'vbucks'; icon?: string }) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isWishlisted?: (id: string) => boolean;
  onToggleWishlist?: (item: Omit<WishlistItem, 'addedAt'>) => void;
  hasOrderedCategory?: (category: 'game' | 'psplus' | 'vbucks' | 'rocket' | 'hezo') => boolean;
}

export const VBucksSection: React.FC<VBucksSectionProps> = ({
  onAddToCart,
  onShowToast,
  isWishlisted,
  onToggleWishlist,
  hasOrderedCategory,
}) => {
  const { language } = useLanguage();
  const [selectedPackId, setSelectedPackId] = useState<string>(vBucksData[1]?.id || 'vb2400');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const hasOrderedVBucks = hasOrderedCategory ? hasOrderedCategory('vbucks') : false;

  const selectedPack = vBucksData.find((p) => p.id === selectedPackId) || vBucksData[0];

  const handleBuyNow = () => {
    if (!phone.trim()) {
      if (onShowToast) {
        onShowToast(
          language === 'ar'
            ? 'يرجى إدخال رقم الهاتف أو الواتساب مع الطلب للمتابعة.'
            : 'Please enter your phone number with your order to proceed.',
          'error'
        );
      }
      return;
    }

    if (!email.trim() || !password.trim()) {
      if (onShowToast) {
        onShowToast(
          language === 'ar'
            ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور لحساب Epic Games للمتابعة.'
            : 'Please enter your Epic Games email and password to proceed with instant delivery.',
          'error'
        );
      }
      return;
    }

    // Save order to backend and Google Sheets
    const orderNumber = `ORD-VB-${Date.now().toString().slice(-6)}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      orderNumber,
      userEmail: email.trim(),
      userName: customerName.trim() || 'Fortnite Gamer',
      customerPhone: phone.trim(),
      gameAccountEmail: email.trim(),
      gameAccountPassword: password,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      items: [
        {
          id: `vb-${selectedPack.id}-${Date.now()}`,
          name: `Fortnite ${selectedPack.amount.toLocaleString()} V-Bucks`,
          details: `${selectedPack.bonus || 'Digital V-Bucks'} • Epic: ${email.trim()}`,
          price: selectedPack.price,
          category: 'vbucks',
        },
      ],
      total: selectedPack.price,
      status: 'Processing',
      paymentMethod: 'Instant WhatsApp Order',
      channel: 'whatsapp',
      createdAt: new Date().toISOString(),
    };
    saveOrderToBackend(newOrder).catch((e) => console.warn(e));

    let msg = `⚡ *Fortnite V-Bucks Order - Instant Buy Now*\n\n`;
    msg += `👤 *Name:* ${customerName.trim() || 'Fortnite Gamer'}\n`;
    msg += `📦 *Order:* Fortnite ${selectedPack.amount.toLocaleString()} V-Bucks ${selectedPack.bonus ? `(${selectedPack.bonus})` : ''}\n`;
    msg += `📱 *Number:* ${phone.trim()}\n`;
    msg += `✉ *Email:* ${email.trim()}\n`;
    msg += `🔑 *Password:* ${password}\n`;
    msg += `💰 *Price:* ${selectedPack.price} L.E\n`;
    msg += `--------------------------\n`;
    msg += `Please deliver the V-Bucks to my Fortnite account. Thank you!`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');

    if (onShowToast) {
      onShowToast(`Order initiated for ${selectedPack.amount.toLocaleString()} V-Bucks! Opening WhatsApp...`, 'success');
    }
  };

  const handleAddToCart = () => {
    const details = email.trim()
      ? `${selectedPack.bonus || 'Digital V-Bucks'} • Epic: ${email.trim()}`
      : selectedPack.bonus || 'Digital V-Bucks';

    onAddToCart({
      name: `Fortnite ${selectedPack.amount.toLocaleString()} V-Bucks`,
      details,
      price: selectedPack.price,
      category: 'vbucks',
      icon: 'zap'
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1400);

    if (onShowToast) {
      onShowToast(`Added ${selectedPack.amount.toLocaleString()} V-Bucks to your cart!`, 'success');
    }
  };

  return (
    <section id="vbucks" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-3">
            <img
              src={getImageUrl('Fortnite Vbucks.jpg')}
              onError={handleImageError}
              alt="Fortnite V-Bucks"
              referrerPolicy="no-referrer"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-xl border-2 border-white/20 hover:scale-105 transition-transform"
            />
            <div className="text-center sm:text-left">
              <h2 className="text-3xl sm:text-5xl font-black text-white">
                Fortnite <span className="gradient-text">V-Bucks</span>
              </h2>
              <p className="text-slate-400 max-w-xl text-sm sm:text-base mt-1">
                {language === 'ar'
                  ? 'احصل على V-Bucks بسرعة وأمان مباشرة إلى حساب Epic Games الخاص بك'
                  : 'Get V-Bucks fast and secure directly to your Epic Games account'}
              </p>
            </div>
          </div>
        </div>

        {/* Outer Glowing Custom Container matching user reference */}
        <div className="max-w-5xl mx-auto rounded-3xl p-6 sm:p-10 border border-purple-500/30 bg-[#0c0c17]/90 shadow-[0_0_50px_rgba(168,85,247,0.18)] backdrop-blur-xl relative">
          {/* Subtle top glow accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-purple-500/60 to-transparent blur-[1px]" />

          {/* Subtitle */}
          <h3 className="text-center text-lg sm:text-xl font-bold text-white mb-6 tracking-wide">
            {language === 'ar' ? 'اختر باقة V-Bucks' : 'Select V-Bucks Package'}
          </h3>

          {/* Packages Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {vBucksData.map((pack) => {
              const isSelected = selectedPackId === pack.id;
              const isWish = isWishlisted ? isWishlisted(`vbucks-${pack.id}`) : false;

              return (
                <div
                  key={pack.id}
                  onClick={() => setSelectedPackId(pack.id)}
                  className={`p-4 sm:p-5 rounded-2xl text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[110px] sm:min-h-[120px] relative ${
                    isSelected
                      ? 'border-2 border-purple-500 bg-purple-950/40 shadow-[0_0_20px_rgba(168,85,247,0.35)] scale-[1.02]'
                      : 'border border-white/10 bg-slate-900/80 hover:border-purple-500/40 hover:bg-slate-900'
                  }`}
                >
                  {/* Top Badges & Heart */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleWishlist) {
                        onToggleWishlist({
                          id: `vbucks-${pack.id}`,
                          productId: pack.id,
                          name: `Fortnite ${pack.amount.toLocaleString()} V-Bucks`,
                          category: 'vbucks',
                          price: pack.price,
                          details: pack.bonus || 'Fortnite Currency',
                          icon: 'zap',
                        });
                      }
                    }}
                    className={`absolute top-2 left-2 p-1.5 rounded-lg transition-all z-10 cursor-pointer ${
                      isWish
                        ? 'bg-pink-950/90 text-pink-400 border border-pink-500/40'
                        : 'opacity-40 hover:opacity-100 text-slate-400 hover:text-pink-400'
                    }`}
                    title={isWish ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isWish ? 'fill-pink-500 text-pink-500' : ''}`} />
                  </button>

                  {hasOrderedVBucks && (pack.id === 'vb5000' || pack.id === 'vb13500') ? (
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 animate-pulse">
                      <Zap className="w-2.5 h-2.5 fill-slate-950" /> {language === 'ar' ? 'أفضل عرض' : 'Best Deal'}
                    </span>
                  ) : pack.popular ? (
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider shadow-sm">
                      {language === 'ar' ? 'شائع' : 'Hot'}
                    </span>
                  ) : null}
                  <div className="mt-1">
                    <span className="font-extrabold text-sm sm:text-base text-white block">
                      {pack.amount.toLocaleString()} V-Bucks
                    </span>
                    {pack.bonus && (
                      <span className="text-[11px] text-amber-300 font-semibold block mt-0.5">
                        {pack.bonus}
                      </span>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-black text-emerald-400 mt-2 block">
                    {pack.price} {language === 'ar' ? 'ج.م' : 'L.E'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Order Details & Epic Games Credentials Box */}
          <div className="rounded-2xl p-5 sm:p-6 bg-[#07070e] border border-white/10 mb-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2 border-b border-white/5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  <span>{language === 'ar' ? 'الاسم' : 'Your Name'}</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={language === 'ar' ? 'اسم العميل' : 'Your name'}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-purple-400" />
                  <span>{language === 'ar' ? 'رقم الهاتف / الواتساب' : 'Phone Number (WhatsApp)'}</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm pt-1">
              <Mail className="w-4 h-4 text-amber-400" />
              <span>{language === 'ar' ? 'بيانات حساب Epic Games للشحن' : 'Epic Games Credentials'}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {language === 'ar' ? 'البريد الإلكتروني لحساب Epic' : 'Epic Email'} <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {language === 'ar' ? 'كلمة المرور لحساب Epic' : 'Epic Password'} <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={language === 'ar' ? 'كلمة المرور الخاصة بك' : 'Your password'}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-[11px] sm:text-xs text-amber-300/80 italic">
              {language === 'ar'
                ? '* البريد الإلكتروني وكلمة المرور مطلوبان لإرسال وشحن الـ V-Bucks إلى حسابك'
                : '* Email and password needed to deliver V-Bucks to your account'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleBuyNow}
              className="w-full sm:flex-1 py-3.5 px-6 rounded-xl font-black text-sm text-white bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 shadow-lg shadow-pink-950/50 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer text-center"
            >
              {language === 'ar' ? 'شراء فوري الآن' : 'Buy Now'}
            </button>

            <button
              type="button"
              onClick={() => {
                if (onToggleWishlist) {
                  onToggleWishlist({
                    id: `vbucks-${selectedPack.id}`,
                    productId: selectedPack.id,
                    name: `Fortnite ${selectedPack.amount.toLocaleString()} V-Bucks`,
                    category: 'vbucks',
                    price: selectedPack.price,
                    details: selectedPack.bonus || 'Fortnite Currency',
                    icon: 'zap',
                  });
                }
              }}
              className={`w-full sm:w-auto py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                isWishlisted && isWishlisted(`vbucks-${selectedPack.id}`)
                  ? 'bg-pink-950/80 border-pink-500/60 text-pink-400 shadow-md shadow-pink-950/50'
                  : 'bg-slate-900 hover:bg-pink-950/40 border-white/10 hover:border-pink-500/40 text-slate-300 hover:text-pink-400'
              }`}
              title={isWishlisted && isWishlisted(`vbucks-${selectedPack.id}`) ? (language === 'ar' ? 'إزالة من المفضلة' : 'Remove from Wishlist') : (language === 'ar' ? 'إضافة إلى المفضلة' : 'Add to Wishlist')}
            >
              <Heart className={`w-4 h-4 ${isWishlisted && isWishlisted(`vbucks-${selectedPack.id}`) ? 'fill-pink-500 text-pink-500' : ''}`} />
              <span>{isWishlisted && isWishlisted(`vbucks-${selectedPack.id}`) ? (language === 'ar' ? 'في المفضلة' : 'Wishlisted') : (language === 'ar' ? 'المفضلة' : 'Wishlist')}</span>
            </button>

            <button
              type="button"
              onClick={handleAddToCart}
              className={`w-full sm:w-auto py-3.5 px-8 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                isAdded
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 border-white/10 hover:border-purple-500/50 text-white'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>{language === 'ar' ? 'تمت الإضافة للسلة!' : 'Added to Cart!'}</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>{language === 'ar' ? 'إضافة إلى السلة' : 'Add to Cart'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
