import React, { useState } from 'react';
import { rocketData, WHATSAPP_NUMBER } from '../data/storeData';
import { ShoppingCart, Check, Mail, Lock, Eye, EyeOff, Sparkles, Rocket, Heart, Phone, User } from 'lucide-react';
import { WishlistItem, Order } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { saveOrderToBackend } from '../lib/orderUtils';

interface RocketSectionProps {
  onAddToCart: (item: { name: string; details: string; price: number; category: 'rocket'; icon?: string }) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isWishlisted?: (id: string) => boolean;
  onToggleWishlist?: (item: Omit<WishlistItem, 'addedAt'>) => void;
}

export const RocketSection: React.FC<RocketSectionProps> = ({
  onAddToCart,
  onShowToast,
  isWishlisted,
  onToggleWishlist,
}) => {
  const { language } = useLanguage();
  const [selectedPackId, setSelectedPackId] = useState<string>(rocketData[0]?.id || 'rc500');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const selectedPack = rocketData.find((p) => p.id === selectedPackId) || rocketData[0];

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
    const orderNumber = `ORD-RL-${Date.now().toString().slice(-6)}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      orderNumber,
      userEmail: email.trim(),
      userName: customerName.trim() || 'Rocket League Player',
      customerPhone: phone.trim(),
      gameAccountEmail: email.trim(),
      gameAccountPassword: password,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      items: [
        {
          id: `rl-${selectedPack.id}-${Date.now()}`,
          name: `Rocket League ${selectedPack.name}`,
          details: selectedPack.isPass ? 'Rocket Pass' : 'In-Game Credits',
          price: selectedPack.price,
          category: 'rocket',
        },
      ],
      total: selectedPack.price,
      status: 'Processing',
      paymentMethod: 'Instant WhatsApp Order',
      channel: 'whatsapp',
      createdAt: new Date().toISOString(),
    };
    saveOrderToBackend(newOrder).catch((e) => console.warn(e));

    let msg = `🚀 *Rocket League Order - Instant Buy Now*\n\n`;
    msg += `👤 *Name:* ${customerName.trim() || 'Rocket League Player'}\n`;
    msg += `📦 *Order:* Rocket League ${selectedPack.name}\n`;
    msg += `📱 *Number:* ${phone.trim()}\n`;
    msg += `✉ *Email:* ${email.trim()}\n`;
    msg += `🔑 *Password:* ${password}\n`;
    msg += `💰 *Price:* ${selectedPack.price} L.E\n`;
    msg += `--------------------------\n`;
    msg += `Please deliver the credits to my account as fast as possible. Thank you!`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');

    if (onShowToast) {
      onShowToast(`Order initiated for ${selectedPack.name}! Opening WhatsApp...`, 'success');
    }
  };

  const handleAddToCart = () => {
    const details = email.trim()
      ? `${selectedPack.isPass ? 'Rocket Pass' : 'In-Game Credits'} • Epic: ${email.trim()}`
      : selectedPack.isPass ? 'Rocket Pass' : 'In-Game Credits';

    onAddToCart({
      name: `Rocket League ${selectedPack.name}`,
      details,
      price: selectedPack.price,
      category: 'rocket',
      icon: 'rocket'
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1400);

    if (onShowToast) {
      onShowToast(`Added ${selectedPack.name} to your cart!`, 'success');
    }
  };

  return (
    <section id="rocket" className="py-20 relative bg-slate-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-3">
            <div className="flex items-center gap-2">
              <img
                src="/Rocket League Credits.jpg"
                alt="Rocket League Credits"
                referrerPolicy="no-referrer"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-xl border-2 border-white/20 hover:scale-105 transition-transform"
              />
              <img
                src="/Rocket League Season Pass.jpg"
                alt="Rocket League Pass"
                referrerPolicy="no-referrer"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-xl border-2 border-white/20 hover:scale-105 transition-transform hidden sm:block"
              />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-3xl sm:text-5xl font-black text-white">
                Rocket League <span className="gradient-text">Credits & Pass</span>
              </h2>
              <p className="text-slate-400 max-w-xl text-sm sm:text-base mt-1">
                {language === 'ar'
                  ? 'احصل على كريديتس و Rocket Pass بسرعة وأمان مباشرة إلى حساب Epic / PSN الخاص بك'
                  : 'Get credits and Rocket Pass fast and secure directly to your Epic / PSN account'}
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
            {language === 'ar' ? 'اختر باقة الكريديتس أو الباس' : 'Select Credits Package'}
          </h3>

          {/* Packages Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
            {rocketData.map((pack) => {
              const isSelected = selectedPackId === pack.id;
              const isWish = isWishlisted ? isWishlisted(`rocket-${pack.id}`) : false;

              return (
                <div
                  key={pack.id}
                  onClick={() => setSelectedPackId(pack.id)}
                  className={`p-4 sm:p-5 rounded-2xl text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[105px] sm:min-h-[115px] relative ${
                    isSelected
                      ? 'border-2 border-purple-500 bg-purple-950/40 shadow-[0_0_20px_rgba(168,85,247,0.35)] scale-[1.02]'
                      : 'border border-white/10 bg-slate-900/80 hover:border-purple-500/40 hover:bg-slate-900'
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleWishlist) {
                        onToggleWishlist({
                          id: `rocket-${pack.id}`,
                          productId: pack.id,
                          name: `Rocket League ${pack.name}`,
                          category: 'rocket',
                          price: pack.price,
                          details: pack.isPass ? 'Rocket Pass' : 'In-Game Credits',
                          icon: 'rocket',
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

                  <span className="font-extrabold text-sm sm:text-base text-white block mt-1">
                    {pack.name}
                  </span>
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
              <span>{language === 'ar' ? 'بيانات حساب Epic Games لتسليم الكريديتس' : 'Epic Games Credentials'}</span>
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
                ? '* البريد الإلكتروني وكلمة المرور مطلوبان لتسليم الكريديتس إلى حسابك'
                : '* Email and password needed to deliver Credits to your account'}
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
                    id: `rocket-${selectedPack.id}`,
                    productId: selectedPack.id,
                    name: `Rocket League ${selectedPack.name}`,
                    category: 'rocket',
                    price: selectedPack.price,
                    details: selectedPack.isPass ? 'Rocket Pass' : 'In-Game Credits',
                    icon: 'rocket',
                  });
                }
              }}
              className={`w-full sm:w-auto py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                isWishlisted && isWishlisted(`rocket-${selectedPack.id}`)
                  ? 'bg-pink-950/80 border-pink-500/60 text-pink-400 shadow-md shadow-pink-950/50'
                  : 'bg-slate-900 hover:bg-pink-950/40 border-white/10 hover:border-pink-500/40 text-slate-300 hover:text-pink-400'
              }`}
              title={isWishlisted && isWishlisted(`rocket-${selectedPack.id}`) ? (language === 'ar' ? 'إزالة من المفضلة' : 'Remove from Wishlist') : (language === 'ar' ? 'إضافة إلى المفضلة' : 'Add to Wishlist')}
            >
              <Heart className={`w-4 h-4 ${isWishlisted && isWishlisted(`rocket-${selectedPack.id}`) ? 'fill-pink-500 text-pink-500' : ''}`} />
              <span>{isWishlisted && isWishlisted(`rocket-${selectedPack.id}`) ? (language === 'ar' ? 'في المفضلة' : 'Wishlisted') : (language === 'ar' ? 'المفضلة' : 'Wishlist')}</span>
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
