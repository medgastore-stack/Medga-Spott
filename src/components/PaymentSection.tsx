import React, { useState } from 'react';
import { getImageUrl, handleImageError } from '../utils/imageHelper';
import {
  Wallet,
  PhoneCall,
  CreditCard,
  Copy,
  Check,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Coins,
  Tag,
  Percent,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { WHATSAPP_NUMBER } from '../data/storeData';
import { useLanguage } from '../context/LanguageContext';
import { validateCoupon, calculateStackedDiscounts, AVAILABLE_COUPONS } from '../lib/discountUtils';
import { getUserPoints } from '../lib/pointsUtils';

interface PaymentSectionProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  userEmail?: string;
  onOpenCart?: () => void;
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({
  onShowToast,
  userEmail,
  onOpenCart,
}) => {
  const { language } = useLanguage();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Interactive Discount & Points on Payment Calculator
  const [sampleOrderTotal, setSampleOrderTotal] = useState<number>(1200);
  const [couponCodeInput, setCouponCodeInput] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<string>('');
  const [usePoints, setUsePoints] = useState<boolean>(true);

  const availablePoints = getUserPoints(userEmail);
  const couponValidation = appliedCoupon
    ? validateCoupon(appliedCoupon, sampleOrderTotal, availablePoints)
    : null;
  const couponDiscountAmount = couponValidation?.isValid ? couponValidation.discountAmount : 0;
  const pointsToUse = usePoints ? availablePoints : 0;

  const stacked = calculateStackedDiscounts(sampleOrderTotal, couponDiscountAmount, pointsToUse);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onShowToast(
      language === 'ar' ? `تم النسخ إلى الحافظة: ${text}` : `Copied to clipboard: ${text}`,
      'success'
    );
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) {
      onShowToast(
        language === 'ar' ? 'يرجى كتابة كود الخصم' : 'Please enter a coupon code',
        'error'
      );
      return;
    }
    const val = validateCoupon(couponCodeInput, sampleOrderTotal, availablePoints);
    if (val.isValid) {
      setAppliedCoupon(couponCodeInput.trim().toUpperCase());
      onShowToast(
        language === 'ar' ? `تم تطبيق الكود: ${val.messageAr}` : `Coupon applied: ${val.message}`,
        'success'
      );
    } else {
      onShowToast(
        language === 'ar' ? val.messageAr : val.message,
        'error'
      );
    }
  };

  return (
    <section id="payment" className="py-20 relative bg-slate-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>
              {language === 'ar' ? 'بوابات دفع رسمية وآمنة 100%' : 'Official & Secure Payment Gateways'}
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">
            {language === 'ar' ? 'طرق' : 'Payment'}{' '}
            <span className="gradient-text">{language === 'ar' ? 'الدفع والخصومات' : 'Methods & Discounts'}</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base sm:text-lg">
            {language === 'ar'
              ? 'ندعم أسرع وأفضل طرق الدفع المحلية في مصر: باي موب (فيزا وماستركارد ومحافظ إلكترونية)، إنستاباي، وتيلدا.'
              : 'We support fast & local Egyptian payment options including Paymob (Cards & Mobile Wallets), InstaPay, and Telda.'}
          </p>
        </div>

        {/* Payment Grid - 3-column top options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-10">
          {/* Paymob Card */}
          <div
            onClick={() =>
              copyToClipboard(
                'Paymob Gateway: Visa, Mastercard, Meeza & Mobile Wallets',
                'paymob'
              )
            }
            className="group cursor-pointer p-6 sm:p-8 rounded-3xl glass-panel border border-blue-500/30 hover:border-blue-400/70 hover:bg-slate-900/90 transition-all duration-300 text-center flex flex-col items-center justify-between shadow-xl relative overflow-hidden ring-1 ring-blue-500/20"
          >
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-400" /> {language === 'ar' ? 'موصى به' : 'Recommended'}
            </div>

            <div className="w-16 h-16 rounded-2xl bg-blue-900/40 border border-blue-500/40 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-950/50">
              <img
                src={getImageUrl('paymob.png')}
                onError={handleImageError}
                alt="Paymob"
                className="w-9 h-9 object-contain"
              />
            </div>

            <div className="w-full">
              <h3 className="text-2xl font-black text-white mb-1">Paymob</h3>
              <p className="text-sm font-bold text-blue-300 mb-3">
                {language === 'ar' ? 'بطاقات ومحافظ إلكترونية' : 'Cards & Mobile Wallets'}
              </p>

              {/* Supported payment chips */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4">
                <span className="px-2 py-0.5 rounded-md bg-blue-950/80 border border-blue-500/30 text-[11px] font-extrabold text-slate-200">
                  💳 Visa / Mastercard
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-[11px] font-extrabold text-emerald-300">
                  Meeza
                </span>
                <span className="px-2 py-0.5 rounded-md bg-rose-950/80 border border-rose-500/30 text-[11px] font-extrabold text-rose-300">
                  Vodafone Cash
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-500/30 text-[11px] font-extrabold text-amber-300">
                  Orange / Etisalat / WE
                </span>
              </div>

              <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
                {copiedId === 'paymob' ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> {language === 'ar' ? 'تم نسخ معلومات باي موب!' : 'Copied Paymob Info!'}
                  </span>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-blue-400" /> {language === 'ar' ? 'انقر لنسخ التفاصيل' : 'Click to copy details'}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Telda Card */}
          <div
            onClick={() => copyToClipboard('@selimahmed1', 'telda')}
            className="group cursor-pointer p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 hover:border-purple-500/50 hover:bg-slate-900/80 transition-all duration-300 text-center flex flex-col items-center justify-between shadow-xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
              <img
                src={getImageUrl('Telda.jpg')}
                onError={handleImageError}
                alt="Telda"
                className="w-9 h-9 object-contain rounded-xl"
              />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white mb-1">Telda</h3>
              <p className="text-xs font-bold text-slate-400 mb-2">
                {language === 'ar' ? 'تحويل فوري عبر تطبيق تيلدا' : 'Telda Instant App Transfer'}
              </p>
              <p className="text-xl font-bold text-purple-300 font-mono tracking-wide my-2">@selimahmed1</p>
              <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 mt-4">
                {copiedId === 'telda' ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> {language === 'ar' ? 'تم النسخ!' : 'Copied!'}
                  </span>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-purple-400" /> {language === 'ar' ? 'انقر على المعرف للنسخ' : 'Click handle to copy'}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* InstaPay Card */}
          <div
            onClick={() => copyToClipboard('01212072882', 'instapay')}
            className="group cursor-pointer p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 hover:border-pink-500/50 hover:bg-slate-900/80 transition-all duration-300 text-center flex flex-col items-center justify-between shadow-xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-pink-900/40 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-4 group-hover:scale-110 transition-transform">
              <img
                src={getImageUrl('Instapay.png')}
                onError={handleImageError}
                alt="InstaPay"
                className="w-9 h-9 object-contain rounded-xl"
              />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white mb-1">InstaPay</h3>
              <p className="text-xs font-bold text-slate-400 mb-2">
                {language === 'ar' ? 'تحويل بنكي ولحظي فوري' : 'Instant Bank & Mobile IPA'}
              </p>
              <p className="text-xl font-bold text-pink-300 font-mono tracking-wide my-2">01212072882</p>
              <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 mt-4">
                {copiedId === 'instapay' ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> {language === 'ar' ? 'تم النسخ!' : 'Copied!'}
                  </span>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-pink-400" /> {language === 'ar' ? 'انقر على الرقم للنسخ' : 'Click number to copy'}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* DISCOUNT PART ON PAYMENT: Points & Promo Codes Combined */}
        <div className="max-w-5xl mx-auto mb-10 rounded-3xl bg-gradient-to-br from-[#1b1535] via-[#141228] to-[#1e1533] border-2 border-purple-500/40 p-6 sm:p-8 shadow-2xl shadow-purple-950/60 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider mb-2">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {language === 'ar'
                    ? 'الخصومات والنقاط عند الدفع (100 نقطة = 1 ج.م)'
                    : 'Discounts & Points on Payment (100 PTS = 1 L.E)'}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                {language === 'ar' ? 'ادمج النقاط مع كود الخصم' : 'Stack Points with Promo Discounts'}
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
                {language === 'ar'
                  ? 'في متجر ميدجا، النقاط تعمل جنباً إلى جنب مع أكواد الخصم لتوفير أقصى مبلغ ممكن عند إتمام الدفع!'
                  : 'At Medga Store, points seamlessly work together with promo codes to give you maximum savings at payment checkout!'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-purple-900/60 border border-purple-400/40 text-purple-200 text-xs font-bold">
                {language === 'ar' ? `رصيدك: ${availablePoints} نقطة` : `Your Balance: ${availablePoints} PTS`}
              </span>
            </div>
          </div>

          {/* Interactive Calculator Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 items-center">
            {/* Left form controls */}
            <div className="lg:col-span-7 space-y-4">
              {/* Promo Code Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  {language === 'ar' ? 'كود الخصم (Promo Code)' : 'Promo / Discount Code'}
                </label>
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value)}
                      placeholder={language === 'ar' ? 'أدخل كود الخصم' : 'Enter discount code'}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-white/20 focus:border-purple-500 rounded-xl text-xs sm:text-sm text-white font-mono uppercase font-bold focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl gradient-bg text-white text-xs sm:text-sm font-black transition-all hover:opacity-90 shadow-md shadow-purple-950 cursor-pointer shrink-0"
                  >
                    {language === 'ar' ? 'تطبيق الخصم' : 'Apply'}
                  </button>
                </form>
              </div>

              {/* Points Toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-amber-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">
                        {language === 'ar' ? 'تفعيل خصم النقاط' : 'Apply Points Discount'}
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        16,000 PTS = 50 L.E
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {language === 'ar'
                        ? 'النقاط تتراكم وتعمل مع أكواد الخصم في نفس الوقت'
                        : 'Points stack concurrently with coupon codes for double savings'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setUsePoints(!usePoints)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                    usePoints
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30'
                      : 'bg-slate-900 border-white/20 text-slate-400'
                  }`}
                >
                  {usePoints
                    ? language === 'ar'
                      ? 'مفعل ✓'
                      : 'Active ✓'
                    : language === 'ar'
                    ? 'تفعيل'
                    : 'Enable'}
                </button>
              </div>
            </div>

            {/* Right Breakdown Summary Box */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-950/90 border border-white/10 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 pb-2">
                {language === 'ar' ? 'معاينة الخصم المزدوج' : 'Stacked Discount Breakdown'}
              </h4>

              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>{language === 'ar' ? 'سعر الطلب التجريبي' : 'Sample Order Value'}</span>
                <span className="font-mono font-bold text-white">{sampleOrderTotal} L.E</span>
              </div>

              {couponDiscountAmount > 0 && (
                <div className="flex items-center justify-between text-xs text-purple-300">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-purple-400" />
                    <span>{language === 'ar' ? `كود الخصم (${appliedCoupon})` : `Coupon (${appliedCoupon})`}</span>
                  </span>
                  <span className="font-mono font-bold">-{couponDiscountAmount} L.E</span>
                </div>
              )}

              {stacked.pointsDiscountEgp > 0 && (
                <div className="flex items-center justify-between text-xs text-amber-300">
                  <span className="flex items-center gap-1">
                    <Coins className="w-3 h-3 text-amber-400" />
                    <span>
                      {language === 'ar'
                        ? `خصم النقاط (${stacked.actualPointsSpent} نقطة)`
                        : `Points Discount (${stacked.actualPointsSpent} PTS)`}
                    </span>
                  </span>
                  <span className="font-mono font-bold">-{stacked.pointsDiscountEgp} L.E</span>
                </div>
              )}

              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 block">
                    {language === 'ar' ? 'المبلغ النهائي بعد الخصم' : 'Final Total to Pay'}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400">
                    {language === 'ar' ? `وفرت إجمالياً: ${stacked.totalDiscount} ج.م!` : `Total Saved: ${stacked.totalDiscount} L.E!`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-white">
                    {stacked.finalTotal}{' '}
                    <span className="text-sm font-bold text-purple-400">
                      {language === 'ar' ? 'ج.م' : 'L.E'}
                    </span>
                  </span>
                </div>
              </div>

              {onOpenCart && (
                <button
                  type="button"
                  onClick={onOpenCart}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition-all shadow-md shadow-purple-950 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{language === 'ar' ? 'تطبيق على سلة المشتريات والدفع' : 'Apply to Cart & Checkout'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Paymob Step-by-Step Info Box */}
        <div className="max-w-4xl mx-auto mb-10 p-5 sm:p-6 rounded-3xl bg-blue-950/30 border border-blue-500/20 flex flex-col md:flex-row items-center gap-5 justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-300 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-white">
                {language === 'ar' ? 'كيف يعمل الدفع عبر باي موب (Paymob)؟' : 'How does Paymob checkout work?'}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {language === 'ar'
                  ? 'اختر باي موب في سلة مشترياتك أو في نموذج الدفع المباشر، وادفع فورياً عبر فيزا أو ماستركارد أو ميزة أو محفظة فودافون/أورنج/اتصالات/وي كاش.'
                  : 'Select Paymob in your cart. We instantly generate an official Paymob invoice or payment link where you can pay securely using Visa, Mastercard, Meeza, or your Vodafone/Orange/Etisalat/WE Cash wallet.'}
              </p>
            </div>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
              language === 'ar'
                ? 'مرحباً متجر ميدجا! أود الاستفسار عن الدفع عبر باي موب والخصومات المتاحة.'
                : 'Hello Medga Store! I want to pay via Paymob (Visa / Mastercard / Mobile Wallet). Please guide me.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-blue-950/60 whitespace-nowrap"
          >
            <span>{language === 'ar' ? 'مساعدة باي موب' : 'Paymob Help'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Big WhatsApp Card Underneath */}
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
            language === 'ar'
              ? 'مرحباً متجر ميدجا! أود عمل طلب جديد والاستفسار عن الأسعار.'
              : 'Hello Medga Store! I would like to place an order or ask a question.'
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group block max-w-4xl mx-auto p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-2 border-emerald-500/50 hover:border-emerald-400 transition-all duration-300 shadow-[0_0_50px_rgba(16,185,129,0.2)] hover:shadow-[0_0_70px_rgba(16,185,129,0.35)] text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5 text-left">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-950/80">
                <MessageSquare className="w-9 h-9" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 mb-1">
                  {language === 'ar' ? 'دعم وطلبات 24/7' : '24/7 Live Support & Orders'}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {language === 'ar' ? 'الطلب عبر واتساب' : 'Order via WhatsApp'}
                </h3>
                <p className="text-emerald-300 font-mono text-lg font-bold mt-0.5">01042240852</p>
                <p className="text-slate-300 text-xs sm:text-sm mt-1">
                  {language === 'ar'
                    ? 'مساعدة فورية ومباشرة، عروض أسعار مخصصة، وتسليم الحسابات بسرعة فائقة.'
                    : 'Direct instant assistance, custom order quotes, and fast delivery verification.'}
                </p>
              </div>
            </div>

            <div className="shrink-0 w-full sm:w-auto">
              <div className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 transition-all group-hover:scale-105">
                <span>{language === 'ar' ? 'تواصل واطلب الآن' : 'Chat & Order Now'}</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </div>
        </a>
      </div>
    </section>
  );
};
