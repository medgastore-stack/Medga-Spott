import React, { useState } from 'react';
import { CartItem } from '../types';
import { getImageUrl, handleImageError } from '../utils/imageHelper';
import {
  X,
  Trash2,
  ShoppingCart,
  Send,
  ShieldCheck,
  CreditCard,
  Coins,
  Tag,
  Check,
  Phone,
  User,
  KeyRound,
} from 'lucide-react';
import { WHATSAPP_NUMBER } from '../data/storeData';
import { getUserPoints, pointsToEgpDiscount, POINTS_TIERS, canRedeemFreeGame, redeemPoints } from '../lib/pointsUtils';
import { useLanguage } from '../context/LanguageContext';
import { validateCoupon, calculateStackedDiscounts, AVAILABLE_COUPONS } from '../lib/discountUtils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onRemoveItem: (cartId: string) => void;
  onClearCart: () => void;
  onCheckoutSuccess?: (
    items: CartItem[],
    total: number,
    paymentMethod: string,
    customerPhone?: string,
    customerName?: string,
    gameAccountEmail?: string,
    gameAccountPassword?: string
  ) => void;
  onOpenWebsiteCheckout?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onRemoveItem,
  onClearCart,
  onCheckoutSuccess,
  onOpenWebsiteCheckout,
}) => {
  const { language } = useLanguage();
  const [selectedPayment, setSelectedPayment] = useState<'Paymob' | 'InstaPay' | 'Telda'>('InstaPay');
  const [applyPointsDiscount, setApplyPointsDiscount] = useState<boolean>(false);
  const [applyFreeGameReward, setApplyFreeGameReward] = useState<boolean>(false);
  const [couponCodeInput, setCouponCodeInput] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<string>('');
  const [couponError, setCouponError] = useState<string>('');

  // Customer Contact Fields - Required phone number with every order
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  const [gameAccountEmail, setGameAccountEmail] = useState<string>('');
  const [gameAccountPassword, setGameAccountPassword] = useState<string>('');

  if (!isOpen) return null;

  // Check if items include Rocket League or Fortnite
  const hasFortniteOrRocket = cart.some((item) => {
    const cat = (item.category || '').toLowerCase();
    const name = (item.name || '').toLowerCase();
    return (
      cat === 'vbucks' ||
      cat === 'rocket' ||
      name.includes('fortnite') ||
      name.includes('v-bucks') ||
      name.includes('vbucks') ||
      name.includes('rocket league') ||
      name.includes('credits')
    );
  });

  // Find candidate game item in cart for the 80k Free Game reward
  const gameItemsInCart = cart.filter((item) => {
    const cat = (item.category || '').toLowerCase();
    return cat === 'game' || cat === 'bundle' || (!cat && !hasFortniteOrRocket);
  });
  const highestPricedGame = gameItemsInCart.length > 0
    ? gameItemsInCart.reduce((prev, curr) => (curr.price > prev.price ? curr : prev), gameItemsInCart[0])
    : null;

  // Retrieve user email to read points
  let userEmail = '';
  try {
    const storedUser = localStorage.getItem('seen_user');
    if (storedUser) {
      userEmail = JSON.parse(storedUser).email || '';
    }
  } catch (e) {}

  const availablePoints = getUserPoints(userEmail);
  const maxPossibleDiscount = pointsToEgpDiscount(availablePoints);
  const rawTotal = cart.reduce((sum, item) => sum + item.price, 0);

  // Validate applied coupon
  const couponValidation = appliedCoupon
    ? validateCoupon(appliedCoupon, rawTotal, availablePoints, highestPricedGame?.price)
    : null;
  const couponDiscountAmount = couponValidation?.isValid ? couponValidation.discountAmount : 0;

  // Stacking points with coupon discount
  let pointsToSpend = 0;
  let stackedOptions: { redeemFreeGame?: boolean; freeGamePrice?: number } | undefined = undefined;

  if (applyFreeGameReward && canRedeemFreeGame(availablePoints) && highestPricedGame) {
    pointsToSpend = availablePoints;
    stackedOptions = { redeemFreeGame: true, freeGamePrice: highestPricedGame.price };
  } else if (applyPointsDiscount && availablePoints >= POINTS_TIERS.DISCOUNT_THRESHOLD) {
    pointsToSpend = availablePoints;
  }

  const stacked = calculateStackedDiscounts(rawTotal, couponDiscountAmount, pointsToSpend, stackedOptions);
  const total = stacked.finalTotal;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    if (!couponCodeInput.trim()) {
      setAppliedCoupon('');
      return;
    }
    const val = validateCoupon(couponCodeInput, rawTotal, availablePoints, highestPricedGame?.price);
    if (val.isValid) {
      setAppliedCoupon(couponCodeInput.trim().toUpperCase());
      setCouponError('');
    } else {
      setCouponError(language === 'ar' ? val.messageAr : val.message);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    if (!customerPhone.trim()) {
      setPhoneError(
        language === 'ar'
          ? 'يرجى إدخال رقم الهاتف أو الواتساب مع الطلب للمتابعة'
          : 'Please enter your phone number with your order to proceed'
      );
      return;
    }

    if (hasFortniteOrRocket && (!gameAccountEmail.trim() || !gameAccountPassword.trim())) {
      setPhoneError(
        language === 'ar'
          ? 'يرجى إدخال بريد وكلمة مرور الحساب لشحن فورتنايت / روكيت ليج'
          : 'Please enter your login email and password for Fortnite / Rocket League charge'
      );
      return;
    }

    setPhoneError('');

    if (stacked.actualPointsSpent > 0 && userEmail) {
      redeemPoints(
        stacked.actualPointsSpent,
        stacked.rewardType === 'free_game'
          ? `Free Game Redemption: ${highestPricedGame?.name || 'Game'}`
          : `Points Discount (-${stacked.pointsDiscountEgp} L.E)`,
        userEmail,
        customerName.trim() || 'Customer'
      ).catch((e) => console.warn('Points redemption warning:', e));
    }

    if (onCheckoutSuccess) {
      onCheckoutSuccess(
        cart,
        total,
        selectedPayment,
        customerPhone.trim(),
        customerName.trim() || 'Customer',
        gameAccountEmail.trim(),
        gameAccountPassword.trim()
      );
    }

    let paymentLabel = selectedPayment as string;
    if (selectedPayment === 'Paymob') {
      paymentLabel = 'Paymob (Visa, Mastercard, Meeza, Vodafone Cash, Orange, Etisalat, WE)';
    } else if (selectedPayment === 'InstaPay') {
      paymentLabel = 'InstaPay (01212072882)';
    } else if (selectedPayment === 'Telda') {
      paymentLabel = 'Telda (@selimahmed1)';
    }

    let msg = `🛒 *Medga Store Order Request*\n\n`;
    cart.forEach((item, idx) => {
      msg += `*${idx + 1}. ${item.name}*\n`;
      msg += `   └ Details: ${item.details}\n`;
      msg += `   └ Price: ${item.price} L.E\n\n`;
    });

    msg += `--------------------------\n`;
    msg += `👤 *Customer Name:* ${customerName.trim() || 'Customer'}\n`;
    msg += `📱 *Customer Phone / Number:* ${customerPhone.trim()}\n`;
    if (hasFortniteOrRocket && gameAccountEmail.trim()) {
      msg += `✉ *Account Email:* ${gameAccountEmail.trim()}\n`;
      msg += `🔑 *Account Password:* ${gameAccountPassword.trim()}\n`;
    }
    msg += `--------------------------\n`;
    if (appliedCoupon && couponDiscountAmount > 0) {
      msg += `🏷️ *Coupon Code (${appliedCoupon}):* -${couponDiscountAmount} L.E\n`;
    }
    if (stacked.pointsDiscountEgp > 0) {
      msg += `🎁 *Points Discount Applied:* -${stacked.pointsDiscountEgp} L.E (${stacked.actualPointsSpent} PTS redeemed)\n`;
    }
    if (stacked.totalDiscount > 0) {
      msg += `✨ *Total Discount:* -${stacked.totalDiscount} L.E\n`;
    }
    msg += `💰 *Total Amount Due:* ${total} L.E\n`;
    msg += `💳 *Selected Payment:* ${paymentLabel}\n`;
    msg += `--------------------------\n`;
    msg += `Please verify this order and send the delivery instructions / link. Thank you!`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[2000] overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0f0f1a] border-l border-white/10 shadow-2xl flex flex-col justify-between relative">
          {/* Drawer Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl gradient-bg text-white">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">
                  {language === 'ar' ? 'سلة المشتريات' : 'Your Cart'}
                </h2>
                <p className="text-xs text-slate-400">
                  {cart.length}{' '}
                  {language === 'ar'
                    ? cart.length === 1
                      ? 'عنصر مختار'
                      : 'عناصر مختارة'
                    : cart.length === 1
                    ? 'item selected'
                    : 'items selected'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12">
                <ShoppingCart className="w-16 h-16 stroke-1 mb-4 opacity-40 text-purple-400" />
                <p className="text-base font-bold text-slate-300">
                  {language === 'ar' ? 'سلة المشتريات فارغة' : 'Your cart is empty'}
                </p>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  {language === 'ar'
                    ? 'أضف ألعاب بلايستيشن، بلايستيشن بلس، في بوكس، أو خدمات الدعم للمتابعة.'
                    : 'Add PlayStation games, PS Plus, V-Bucks, or social boosts to proceed.'}
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.cartId}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 flex items-center justify-between gap-3 group hover:border-purple-500/30 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-white text-sm truncate">{item.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{item.details}</p>
                    <p className="text-sm font-black text-purple-400 mt-1">
                      {item.price} {language === 'ar' ? 'ج.م' : 'L.E'}
                    </p>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.cartId)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors shrink-0 cursor-pointer"
                    title={language === 'ar' ? 'حذف العنصر' : 'Remove item'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer & Checkout */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-white/10 bg-slate-950/90 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  {language === 'ar' ? 'اختر طريقة الدفع' : 'Select Payment Method'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPayment('Paymob');
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 relative ${
                      selectedPayment === 'Paymob'
                        ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                        : 'bg-slate-900/50 border-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black text-[8px] uppercase tracking-tighter shadow">
                      {language === 'ar' ? 'قريباً' : 'Soon'}
                    </span>
                    <span className="flex items-center gap-1">
                      <img
                        src={getImageUrl('paymob.png')}
                        onError={handleImageError}
                        alt="Paymob"
                        className="w-3.5 h-3.5 object-contain rounded-sm"
                      />
                      <span>Paymob</span>
                    </span>
                    <span className="text-[9px] font-normal opacity-80 truncate max-w-[80px]">
                      {language === 'ar' ? 'قريباً جداً' : 'Coming Soon'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPayment('InstaPay')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      selectedPayment === 'InstaPay'
                        ? 'bg-pink-950/90 border-pink-500 text-pink-200 shadow-md shadow-pink-950/60'
                        : 'bg-slate-900/50 border-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <img
                        src={getImageUrl('Instapay.png')}
                        onError={handleImageError}
                        alt="InstaPay"
                        className="w-3.5 h-3.5 object-contain rounded-sm"
                      />
                      <span>InstaPay</span>
                    </span>
                    <span className="text-[9px] font-normal opacity-80 truncate max-w-[80px]">01212072882</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPayment('Telda')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      selectedPayment === 'Telda'
                        ? 'bg-purple-950/90 border-purple-500 text-purple-200 shadow-md shadow-purple-950/60'
                        : 'bg-slate-900/50 border-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <img
                        src={getImageUrl('Telda.jpg')}
                        onError={handleImageError}
                        alt="Telda"
                        className="w-3.5 h-3.5 object-contain rounded-sm"
                      />
                      <span>Telda</span>
                    </span>
                    <span className="text-[9px] font-normal opacity-80 truncate max-w-[80px]">@selimahmed1</span>
                  </button>
                </div>

                {/* Dynamic method info tip */}
                <div className="mt-2.5 p-2 rounded-xl bg-slate-900/80 border border-white/5 text-[11px] text-slate-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  {selectedPayment === 'Paymob' && (
                    <span>
                      {language === 'ar'
                        ? 'باي موب: دفع فوري لبطاقات فيزا وماستركارد وميزة ومحافظ الهاتف (فودافون كاش، أورنج، اتصالات، وي).'
                        : 'Paymob: Instant checkout for Visa, MasterCard, Meeza & Mobile Wallets.'}
                    </span>
                  )}
                  {selectedPayment === 'InstaPay' && (
                    <span>
                      {language === 'ar'
                        ? 'إنستاباي: تحويل بنكي ولحظي إلى 01212072882.'
                        : 'InstaPay: Instant bank/IPA transfer to 01212072882.'}
                    </span>
                  )}
                  {selectedPayment === 'Telda' && (
                    <span>
                      {language === 'ar'
                        ? 'تيلدا: تحويل مباشر وفوري عبر تطبيق تيلدا إلى @selimahmed1.'
                        : 'Telda: Instant app-to-app transfer to @selimahmed1.'}
                    </span>
                  )}
                </div>
              </div>

              {/* Promo Coupon Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-purple-400" />
                    <span>{language === 'ar' ? 'كود الخصم (Coupon)' : 'Discount Code'}</span>
                  </span>
                  {appliedCoupon && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> {language === 'ar' ? 'تم تفعيل الكود' : 'Applied'}
                    </span>
                  )}
                </label>
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value)}
                    placeholder={language === 'ar' ? 'أدخل كود الخصم' : 'Discount code'}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-white/15 focus:border-purple-500 rounded-xl text-xs font-mono uppercase font-bold text-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    {language === 'ar' ? 'تطبيق' : 'Apply'}
                  </button>
                </form>
                {couponError && <p className="text-[10px] text-rose-400">{couponError}</p>}
                {appliedCoupon && couponDiscountAmount > 0 && (
                  <p className="text-[10px] text-emerald-400 font-semibold">
                    {language === 'ar'
                      ? `تم تطبيق كود ${appliedCoupon}: خصم -${couponDiscountAmount} ج.م`
                      : `Applied code ${appliedCoupon}: -${couponDiscountAmount} L.E discount`}
                  </p>
                )}
              </div>

              {/* Points Redemption & Progress */}
              <div className="space-y-2">
                {availablePoints < POINTS_TIERS.DISCOUNT_THRESHOLD ? (
                  /* Under 16k threshold banner with progress */
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-amber-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-black text-slate-200">
                          {language === 'ar' ? 'نقاط المكافآت' : 'Reward Points'}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-black text-amber-400">
                        {availablePoints.toLocaleString()} PTS
                      </span>
                    </div>

                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.round((availablePoints / POINTS_TIERS.DISCOUNT_THRESHOLD) * 100))}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>
                        {language === 'ar'
                          ? `اجمع 16,000 نقطة لخصم 50 ج.م`
                          : `Reach 16,000 PTS for 50 L.E off`}
                      </span>
                      <span className="text-amber-400 font-bold">
                        {language === 'ar'
                          ? `متبقي ${(POINTS_TIERS.DISCOUNT_THRESHOLD - availablePoints).toLocaleString()} نقطة`
                          : `${(POINTS_TIERS.DISCOUNT_THRESHOLD - availablePoints).toLocaleString()} PTS to go`}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* 16k+ Tier: 50 L.E Cash Discount */
                  <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between gap-3 shadow-md shadow-amber-950/30">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        <Coins className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-amber-200 uppercase tracking-wider">
                            {language === 'ar' ? 'خصم 50 ج.م (16 ألف نقطة)' : '50 L.E Off (16,000 PTS)'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {language === 'ar'
                            ? `رصيدك: ${availablePoints.toLocaleString()} نقطة`
                            : `Balance: ${availablePoints.toLocaleString()} PTS available`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!applyPointsDiscount) {
                          setApplyFreeGameReward(false);
                        }
                        setApplyPointsDiscount(!applyPointsDiscount);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        applyPointsDiscount
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                          : 'bg-slate-900 border border-white/20 text-slate-300 hover:text-white'
                      }`}
                    >
                      {applyPointsDiscount
                        ? language === 'ar'
                          ? `مفعل (-${stacked.pointsDiscountEgp} ج.م)`
                          : `Applied (-${stacked.pointsDiscountEgp} L.E)`
                        : language === 'ar'
                        ? 'تطبيق الخصم'
                        : 'Apply 50 L.E Off'}
                    </button>
                  </div>
                )}

                {/* 180k Tier: Free Game Reward */}
                {canRedeemFreeGame(availablePoints) && highestPricedGame && (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/60 to-amber-950/50 border border-amber-400/60 flex items-center justify-between gap-3 shadow-lg shadow-purple-950/40">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-yellow-300 uppercase tracking-wider">
                          {language === 'ar' ? '🏆 لعبة مجانية (180 ألف نقطة)' : '🏆 Free Game (180,000 PTS)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 truncate">
                        {language === 'ar'
                          ? `احصل على ${highestPricedGame.name} مجاناً!`
                          : `Get ${highestPricedGame.name} for 0 L.E!`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!applyFreeGameReward) {
                          setApplyPointsDiscount(false);
                        }
                        setApplyFreeGameReward(!applyFreeGameReward);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        applyFreeGameReward
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black shadow-md shadow-yellow-500/40'
                          : 'bg-slate-900 border border-amber-400/40 text-amber-200 hover:text-white'
                      }`}
                    >
                      {applyFreeGameReward
                        ? language === 'ar'
                          ? 'اللعبة مجاناً ✓'
                          : 'Free Game Active ✓'
                        : language === 'ar'
                        ? 'استبدال اللعبة'
                        : 'Claim Free Game'}
                    </button>
                  </div>
                )}
              </div>

              {/* Total Row */}
              <div className="pt-2 space-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-slate-300 block">
                      {language === 'ar' ? 'المبلغ الإجمالي' : 'Total Price'}
                    </span>
                    {stacked.totalDiscount > 0 && (
                      <span className="text-[11px] font-bold text-emerald-400 block">
                        {language === 'ar'
                          ? `وفرت إجمالياً: -${stacked.totalDiscount} ج.م!`
                          : `Total Savings: -${stacked.totalDiscount} L.E!`}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    {stacked.totalDiscount > 0 && (
                      <span className="text-xs text-slate-500 line-through block">
                        {rawTotal} {language === 'ar' ? 'ج.م' : 'L.E'}
                      </span>
                    )}
                    <span className="text-2xl font-black text-white">
                      {total} <span className="text-sm text-purple-400">{language === 'ar' ? 'ج.م' : 'L.E'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information - Phone Number Required */}
              <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-purple-400" />
                    <span>{language === 'ar' ? 'رقم الهاتف والتواصل' : 'Contact Phone Number'}</span>
                  </span>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {language === 'ar' ? 'مطلوب مع كل طلب *' : 'Required with order *'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">
                      {language === 'ar' ? 'الاسم' : 'Name'}
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={language === 'ar' ? 'اسم العميل' : 'Your name'}
                      className="w-full bg-slate-950 border border-white/15 focus:border-purple-500 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">
                      {language === 'ar' ? 'رقم الهاتف / واتساب *' : 'Phone / WhatsApp *'}
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        if (phoneError) setPhoneError('');
                      }}
                      placeholder="01XXXXXXXXX"
                      className={`w-full bg-slate-950 border rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none ${
                        phoneError ? 'border-rose-500 ring-1 ring-rose-500' : 'border-white/15 focus:border-purple-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Rocket League / Fortnite login credentials if cart has them */}
                {hasFortniteOrRocket && (
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>{language === 'ar' ? 'بيانات حساب فورتنايت / روكيت ليج للشحن' : 'Fortnite / Rocket League Login'}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={gameAccountEmail}
                        onChange={(e) => setGameAccountEmail(e.target.value)}
                        placeholder={language === 'ar' ? 'بريد الحساب (إيبك/بلايستيشن)' : 'Account Email'}
                        className="w-full bg-slate-950 border border-white/15 focus:border-amber-400 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <input
                        type="password"
                        value={gameAccountPassword}
                        onChange={(e) => setGameAccountPassword(e.target.value)}
                        placeholder={language === 'ar' ? 'كلمة المرور' : 'Account Password'}
                        className="w-full bg-slate-950 border border-white/15 focus:border-amber-400 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {phoneError && (
                  <p className="text-[11px] text-rose-400 font-bold">{phoneError}</p>
                )}
              </div>

              {/* Action Buttons */}
              {onOpenWebsiteCheckout && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenWebsiteCheckout();
                  }}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:opacity-95 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-xl shadow-purple-900/40 hover:scale-[1.02] active:scale-98 transition-all cursor-pointer"
                >
                  <CreditCard className="w-5 h-5 text-yellow-300" />
                  <span>
                    {language === 'ar'
                      ? 'الدفع في الموقع (باي موب / تحويل)'
                      : 'Checkout on Website (Paymob / Transfer)'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                className="w-full py-3 px-4 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4 text-emerald-400" />
                <span>{language === 'ar' ? 'أو اطلب عبر واتساب' : 'Or Order via WhatsApp'}</span>
              </button>

              <button
                type="button"
                onClick={onClearCart}
                className="w-full py-2 text-xs text-slate-500 hover:text-rose-400 text-center transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'تفريغ السلة' : 'Clear Cart'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
