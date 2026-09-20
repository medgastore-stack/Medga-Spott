import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Upload,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  Phone,
  Smartphone,
  Send,
  Loader2,
  ImageIcon,
  Receipt,
  Lock,
  MessageSquare,
  Coins,
  Sparkles,
  KeyRound,
  Tag,
  Mail,
  Zap,
  Clock,
  UserCheck,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { CartItem, Order, User } from '../types';
import { generateOrderId, saveOrderToBackend } from '../lib/orderUtils';
import { getUserPoints, redeemPoints, pointsToEgpDiscount, POINTS_TIERS, canRedeemFreeGame } from '../lib/pointsUtils';
import { WHATSAPP_NUMBER } from '../data/storeData';
import { useLanguage } from '../context/LanguageContext';
import { validateCoupon, calculateStackedDiscounts, AVAILABLE_COUPONS } from '../lib/discountUtils';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  reload,
} from '../lib/firebase';
import { EmailVerificationModal } from './EmailVerificationModal';

interface WebsiteCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  user: User;
  onOrderPlaced: (newOrder: Order) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  onOpenWhatsAppCheckout: () => void;
  onLoginSuccess?: (user: User) => void;
  onOpenAuthModal?: () => void;
}

export const WebsiteCheckoutModal: React.FC<WebsiteCheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  user,
  onOrderPlaced,
  onShowToast,
  onOpenWhatsAppCheckout,
  onLoginSuccess,
  onOpenAuthModal,
}) => {
  const { language } = useLanguage();
  const [checkoutMethod, setCheckoutMethod] = useState<'paymob' | 'transfer'>('transfer');
  const [paymobSubtype, setPaymobSubtype] = useState<'card' | 'wallet'>('card');
  const [transferType, setTransferType] = useState<'instapay' | 'vodafone_cash' | 'telda'>('instapay');

  // In-Modal Mandatory Login States
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');

  // Customer Contact Fields
  const [customerName, setCustomerName] = useState(user.name !== 'Guest' ? user.name : '');
  const [customerEmail, setCustomerEmail] = useState(user.email || '');
  const [customerPhone, setCustomerPhone] = useState('');

  // Check if order contains Fortnite V-Bucks or Rocket League Credits
  const hasFortniteOrRocket = cart.some(
    (item) =>
      item.category === 'vbucks' ||
      item.category === 'rocket' ||
      item.name.toLowerCase().includes('fortnite') ||
      item.name.toLowerCase().includes('v-bucks') ||
      item.name.toLowerCase().includes('rocket league') ||
      item.name.toLowerCase().includes('credits')
  );

  // Email and password required specifically for Fortnite and Rocket League orders
  const [gameAccountEmail, setGameAccountEmail] = useState('');
  const [gameAccountPassword, setGameAccountPassword] = useState('');

  // "Type what you bought" / custom specifications
  const defaultNotes = cart
    .map((item, idx) => `${idx + 1}. ${item.name} (${item.details}) - ${item.price} LE`)
    .join('\n');
  const [customerNotes, setCustomerNotes] = useState(defaultNotes);

  // Manual payment transaction reference & screenshot upload
  const [transactionRef, setTransactionRef] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string>('');

  // Real Paymob Gateway fields & Active Payment States
  const [walletNumber, setWalletNumber] = useState('');
  const [paymobIframeUrl, setPaymobIframeUrl] = useState<string | null>(null);
  const [paymobRedirectionUrl, setPaymobRedirectionUrl] = useState<string | null>(null);
  const [paymobGatewayError, setPaymobGatewayError] = useState<string | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [pendingOrderPayload, setPendingOrderPayload] = useState<Order | null>(null);

  // Real Email Verification States (100% Free Firebase Auth & Google Sign-in)
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [isEmailVerificationModalOpen, setIsEmailVerificationModalOpen] = useState(false);

  // Email Countdown Timer Effect
  useEffect(() => {
    let timer: any;
    if (emailCountdown > 0) {
      timer = setTimeout(() => setEmailCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [emailCountdown]);

  // Sync initial verification status with Firebase Auth & User
  useEffect(() => {
    if (user.isAuthenticated && user.name !== 'Guest') {
      setCustomerName(user.name);
    }
    if (user.isAuthenticated && user.email) {
      setCustomerEmail(user.email);
      setIsEmailVerified(true);
    } else if (auth.currentUser) {
      if (auth.currentUser.emailVerified) {
        setIsEmailVerified(true);
      }
      if (auth.currentUser.email && !customerEmail) {
        setCustomerEmail(auth.currentUser.email);
      }
      if (auth.currentUser.displayName && (!customerName || customerName === 'Guest')) {
        setCustomerName(auth.currentUser.displayName);
      }
    }
  }, [isOpen, user]);

  // Quick 1-Click Google Sign-In for Purchase
  const handleQuickGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError('');
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user && res.user.email) {
        const loggedUser: User = {
          name: res.user.displayName || res.user.email.split('@')[0],
          email: res.user.email,
          isAuthenticated: true,
        };
        if (onLoginSuccess) onLoginSuccess(loggedUser);
        setCustomerName(loggedUser.name);
        setCustomerEmail(loggedUser.email);
        setIsEmailVerified(true);
        onShowToast(
          language === 'ar' ? `مرحباً بك يا ${loggedUser.name}!` : `Welcome ${loggedUser.name}!`,
          'success'
        );
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setAuthError(err.message || 'Google sign-in failed');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Email & Password Auth for Purchase
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError(
        language === 'ar' ? 'يرجى كتابة البريد الإلكتروني وكلمة المرور' : 'Email and password are required'
      );
      return;
    }
    setIsAuthenticating(true);
    setAuthError('');
    try {
      if (authMode === 'signin') {
        const cred = await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword);
        if (cred.user && cred.user.email) {
          const loggedUser: User = {
            name: cred.user.displayName || authName.trim() || cred.user.email.split('@')[0],
            email: cred.user.email,
            isAuthenticated: true,
          };
          if (onLoginSuccess) onLoginSuccess(loggedUser);
          setCustomerName(loggedUser.name);
          setCustomerEmail(loggedUser.email);
          onShowToast(
            language === 'ar' ? 'تم تسجيل الدخول بنجاح!' : 'Signed in successfully!',
            'success'
          );
        }
      } else {
        const cred = await createUserWithEmailAndPassword(auth, authEmail.trim(), authPassword);
        if (cred.user && cred.user.email) {
          const loggedUser: User = {
            name: authName.trim() || cred.user.email.split('@')[0],
            email: cred.user.email,
            isAuthenticated: true,
          };
          if (onLoginSuccess) onLoginSuccess(loggedUser);
          setCustomerName(loggedUser.name);
          setCustomerEmail(loggedUser.email);
          onShowToast(
            language === 'ar' ? 'تم إنشاء الحساب وتسجيل الدخول بنجاح!' : 'Account created & logged in!',
            'success'
          );
        }
      }
    } catch (err: any) {
      let msg = err.message || 'Authentication failed';
      if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        msg = language === 'ar' ? 'كلمة المرور أو البريد الإلكتروني غير صحيح' : 'Invalid email or password';
      } else if (err?.code === 'auth/email-already-in-use') {
        msg = language === 'ar' ? 'هذا البريد مسجل بالفعل، يرجى التبديل لتسجيل الدخول' : 'Email already in use, please sign in';
      } else if (err?.code === 'auth/weak-password') {
        msg = language === 'ar' ? 'كلمة المرور ضعيفة (يجب ألا تقل عن 6 أحرف)' : 'Password must be at least 6 characters';
      }
      setAuthError(msg);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 1-Click Google Verification (Instant, 100% Free, Zero Cost)
  const handleVerifyWithGoogle = async () => {
    setIsSendingVerification(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user && cred.user.email) {
        setCustomerEmail(cred.user.email);
        if (!customerName || customerName === 'Guest') {
          setCustomerName(cred.user.displayName || cred.user.email.split('@')[0]);
        }
        setIsEmailVerified(true);
        // Register verification with backend
        fetch('/api/email-verify/confirm-firebase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cred.user.email }),
        }).catch(() => {});

        onShowToast(
          language === 'ar'
            ? `تم تأكيد بريدك الإلكتروني بنجاح عبر جوجل: ${cred.user.email}`
            : `Email verified successfully with Google: ${cred.user.email}`,
          'success'
        );
      }
    } catch (err: any) {
      console.warn('Google verify error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        onShowToast(err?.message || 'Google verification failed', 'error');
      }
    } finally {
      setIsSendingVerification(false);
    }
  };

  // Send 6-Digit Verification Code via Gmail OTP or Firebase
  const handleSendVerificationEmail = async () => {
    const cleanEmail = customerEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      onShowToast(
        language === 'ar' ? 'يرجى كتابة بريد إلكتروني صحيح أولاً' : 'Please enter a valid email address first',
        'error'
      );
      return;
    }

    setIsSendingVerification(true);
    try {
      // 1. Dispatch real 6-digit OTP code using Gmail SMTP backend
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: cleanEmail, type: 'email' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVerificationEmailSent(true);
        setShowCodeInput(true);
        setEmailCountdown(60);
        onShowToast(
          language === 'ar'
            ? `تم إرسال رمز OTP المكون من 6 أرقام إلى بريدك ${cleanEmail}! يرجى كتابته أدناه.`
            : `6-Digit verification code sent to ${cleanEmail}! Enter it below.`,
          'success'
        );
      } else {
        // Fallback to Firebase Email Verification if SMTP is not configured yet
        if (auth.currentUser && auth.currentUser.email?.toLowerCase() === cleanEmail) {
          await sendEmailVerification(auth.currentUser);
          setVerificationEmailSent(true);
          setEmailCountdown(60);
          onShowToast(
            language === 'ar'
              ? `تم إرسال رابط تأكيد رسمي إلى ${cleanEmail}! افتح بريدك واضغط على الرابط لتأكيد حسابك.`
              : `Verification link sent to ${cleanEmail}! Open your inbox and click the link.`,
            'success'
          );
        } else {
          setShowCodeInput(true);
          onShowToast(
            data.error || (language === 'ar' ? 'فشل إرسال كود OTP. يمكنك استخدام زر تأكيد فوري عبر Google.' : 'Failed to send OTP. You can use 1-Click Google Verify.'),
            'error'
          );
        }
      }
    } catch (err: any) {
      if (err?.code === 'auth/too-many-requests') {
        onShowToast(
          language === 'ar'
            ? 'تم إرسال عدة طلبات مؤخراً. يرجى الانتظار بضع دقائق ثم المحاولة.'
            : 'Too many requests. Please wait a few minutes before trying again.',
          'error'
        );
      } else {
        onShowToast(err?.message || 'Failed to dispatch verification email', 'error');
      }
    } finally {
      setIsSendingVerification(false);
    }
  };

  // Check if customer clicked the verification link in their email
  const handleCheckVerificationLink = async () => {
    if (!auth.currentUser) {
      onShowToast(
        language === 'ar' ? 'يرجى تسجيل الدخول أولاً لفحص حالة التفعيل' : 'Please sign in first to check verification status',
        'info'
      );
      return;
    }

    setIsCheckingVerification(true);
    try {
      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        setIsEmailVerified(true);
        fetch('/api/email-verify/confirm-firebase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: auth.currentUser.email }),
        }).catch(() => {});
        onShowToast(
          language === 'ar' ? 'تهانينا! تم تأكيد بريدك الإلكتروني بنجاح.' : 'Congratulations! Your email is verified.',
          'success'
        );
      } else {
        onShowToast(
          language === 'ar'
            ? 'لم يتم تأكيد الرابط بعد! افتح رسالة Google/Firebase في بريدك، واضغط على رابط التفعيل، ثم اضغط هنا ثانية.'
            : 'Not verified yet! Please click the verification link in your inbox first, then click here again.',
          'info'
        );
      }
    } catch (err: any) {
      onShowToast(err?.message || 'Failed to refresh verification status', 'error');
    } finally {
      setIsCheckingVerification(false);
    }
  };

  // Verify 6-digit code if dispatched via server
  const handleVerifyEmailCode = async () => {
    if (!emailOtpCode || emailOtpCode.trim().length < 6) {
      onShowToast(
        language === 'ar' ? 'يرجى كتابة رمز التحقق المكون من 6 أرقام' : 'Please enter the 6-digit code',
        'error'
      );
      return;
    }

    setIsVerifyingCode(true);
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: customerEmail.trim().toLowerCase(), code: emailOtpCode.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.verified) {
        setIsEmailVerified(true);
        setShowCodeInput(false);
        onShowToast(
          language === 'ar' ? 'تم تأكيد البريد الإلكتروني بنجاح!' : 'Email verified successfully!',
          'success'
        );
      } else {
        onShowToast(
          data.error || (language === 'ar' ? 'رمز التحقق غير صحيح أو منتهي' : 'Invalid or expired code'),
          'error'
        );
      }
    } catch (err) {
      onShowToast('Verification request failed', 'error');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Discount Code & Points Stacking
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [usePointsDiscount, setUsePointsDiscount] = useState(false);
  const [useFreeGameReward, setUseFreeGameReward] = useState(false);

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen) return null;

  const rawTotal = cart.reduce((sum, item) => sum + item.price, 0);

  // Find candidate game item in cart for the 80k Free Game reward
  const gameItemsInCart = cart.filter((item) => {
    const cat = (item.category || '').toLowerCase();
    return cat === 'game' || cat === 'bundle' || (!cat && !hasFortniteOrRocket);
  });
  const highestPricedGame = gameItemsInCart.length > 0
    ? gameItemsInCart.reduce((prev, curr) => (curr.price > prev.price ? curr : prev), gameItemsInCart[0])
    : null;

  // Available user points
  const availablePoints = getUserPoints(user.email);

  // Calculate Coupon validation
  const couponValidation = appliedCoupon
    ? validateCoupon(appliedCoupon, rawTotal, availablePoints, highestPricedGame?.price)
    : null;
  const couponDiscountEgp = couponValidation?.isValid ? couponValidation.discountAmount : 0;

  // Stacking Points Discount with Promo Code
  let pointsToUse = 0;
  let stackedOptions: { redeemFreeGame?: boolean; freeGamePrice?: number } | undefined = undefined;

  if (useFreeGameReward && canRedeemFreeGame(availablePoints) && highestPricedGame) {
    pointsToUse = availablePoints;
    stackedOptions = { redeemFreeGame: true, freeGamePrice: highestPricedGame.price };
  } else if (usePointsDiscount && availablePoints >= POINTS_TIERS.DISCOUNT_THRESHOLD) {
    pointsToUse = availablePoints;
  }

  const stacked = calculateStackedDiscounts(rawTotal, couponDiscountEgp, pointsToUse, stackedOptions);
  const total = stacked.finalTotal;
  const pointsDiscountEgp = stacked.pointsDiscountEgp;
  const pointsSpent = stacked.actualPointsSpent;

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
      onShowToast(
        language === 'ar' ? val.messageAr : val.message,
        'success'
      );
    } else {
      setCouponError(language === 'ar' ? val.messageAr : val.message);
      onShowToast(
        language === 'ar' ? val.messageAr : val.message,
        'error'
      );
    }
  };

  // Handle image upload & base64 conversion
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast(
        language === 'ar'
          ? 'يرجى رفع ملف صورة (PNG أو JPG أو WEBP)'
          : 'Please upload an image file (PNG, JPG, or WEBP)',
        'error'
      );
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      onShowToast(
        language === 'ar'
          ? 'حجم الصورة أكبر من 8 ميجابايت. يرجى اختيار لقطة شاشة أصغر.'
          : 'Image is larger than 8MB. Please upload a smaller screenshot.',
        'error'
      );
      return;
    }

    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotPreview(reader.result as string);
      onShowToast(
        language === 'ar'
          ? 'تم إرفاق صورة إيصال التحويل بنجاح!'
          : 'Transaction screenshot attached successfully!',
        'success'
      );
    };
    reader.readAsDataURL(file);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    onShowToast(
      language === 'ar' ? `تم نسخ ${label}: ${text}` : `Copied ${label}: ${text}`,
      'info'
    );
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user.isAuthenticated && !auth.currentUser) {
      onShowToast(
        language === 'ar'
          ? 'يجب تسجيل الدخول بحسابك أولاً لإتمام الشراء!'
          : 'Please sign in with your account first to complete your purchase!',
        'error'
      );
      return;
    }

    if (checkoutMethod === 'paymob') {
      onShowToast(
        language === 'ar'
          ? 'بوابة Paymob قيد التجهيز الفني وستتوفر قريباً! يرجى اختيار الدفع عبر إنستاباي، فودافون كاش، أو تيلدا للتنفيذ الفوري.'
          : 'Paymob is under integration (coming soon)! Please choose InstaPay, Vodafone Cash, or Telda for immediate fulfillment.',
        'info'
      );
      return;
    }

    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      onShowToast(
        language === 'ar'
          ? 'يرجى إدخال بريد إلكتروني صحيح لاستلام الفاتورة وبيانات الطلب'
          : 'Please enter a valid email address to receive your order keys and receipt',
        'error'
      );
      return;
    }

    if (!isEmailVerified) {
      setIsEmailVerificationModalOpen(true);
      onShowToast(
        language === 'ar'
          ? 'تأكيد البريد مطلوب! يرجى تأكيد بريدك في نافذة التحقق لإتمام الشراء.'
          : 'Email verification required! Please verify your email in the verification modal to complete your order.',
        'info'
      );
      return;
    }

    if (!customerPhone.trim()) {
      onShowToast(
        language === 'ar'
          ? 'يرجى إدخال رقم الهاتف أو الواتساب لتأكيد وتسليم الطلب'
          : 'Please enter your WhatsApp or Mobile phone number for order delivery',
        'error'
      );
      return;
    }

    if (hasFortniteOrRocket && (!gameAccountEmail.trim() || !gameAccountPassword.trim())) {
      onShowToast(
        language === 'ar'
          ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور لشحن الحساب في فورتنايت / روكيت ليج'
          : 'Please enter your Rocket League / Fortnite login email and password for in-game charging',
        'error'
      );
      return;
    }

    if (checkoutMethod === 'transfer' && !screenshotPreview) {
      onShowToast(
        language === 'ar'
          ? 'يرجى رفع لقطة شاشة لإيصال التحويل قبل تأكيد الطلب'
          : 'Please upload a screenshot of your payment receipt before submitting',
        'error'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const actualOrderId = generateOrderId();
      let paymobTxRef = '';

      const nowStr = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      });

      let paymentMethodName = 'Transfer';
      if (transferType === 'instapay') paymentMethodName = 'InstaPay Transfer (Screenshot Verified)';
      if (transferType === 'vodafone_cash') paymentMethodName = 'Vodafone Cash / Wallet (Screenshot Verified)';
      if (transferType === 'telda') paymentMethodName = 'Telda Transfer (Screenshot Verified)';

      if (appliedCoupon && couponDiscountEgp > 0) {
        paymentMethodName += ` [Coupon ${appliedCoupon}: -${couponDiscountEgp} L.E]`;
      }
      if (pointsDiscountEgp > 0) {
        paymentMethodName += ` [Points: -${pointsDiscountEgp} L.E]`;
      }

      const verifiedEmail = customerEmail.trim() || auth.currentUser?.email || (user.isAuthenticated ? user.email : '');
      const verifiedName = customerName.trim() || auth.currentUser?.displayName || (user.isAuthenticated ? user.name : 'Customer');

      const orderData: Order = {
        id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        orderNumber: actualOrderId,
        userEmail: verifiedEmail,
        userName: verifiedName,
        customerPhone: customerPhone.trim(),
        gameAccountEmail: gameAccountEmail.trim() || undefined,
        gameAccountPassword: gameAccountPassword.trim() || undefined,
        pointsDiscountUsed: pointsDiscountEgp > 0 ? pointsDiscountEgp : undefined,
        couponCode: appliedCoupon || undefined,
        couponDiscount: couponDiscountEgp > 0 ? couponDiscountEgp : undefined,
        date: nowStr,
        items: cart.map((i, idx) => ({
          id: `item-${idx}-${Date.now()}`,
          name: i.name,
          details: i.details,
          price: i.price,
          category: i.category,
        })),
        total,
        status: 'Processing',
        paymentMethod: paymentMethodName,
        customerNotes: customerNotes.trim(),
        paymentScreenshot: screenshotPreview || undefined,
        transactionReference: undefined,
        paymentStatus: checkoutMethod === 'paymob' ? 'paid' : 'verification_pending',
        channel: 'website',
        createdAt: new Date().toISOString(),
      };

      // If Paymob is selected:
      if (checkoutMethod === 'paymob') {
        try {
          const paymobRes = await fetch('/api/paymob/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: total,
              orderNumber: actualOrderId,
              customerName: customerName.trim() || (user.isAuthenticated ? user.name : 'Customer'),
              customerEmail: customerEmail.trim() || (user.isAuthenticated ? user.email : 'customer@medgastore.com'),
              customerPhone: customerPhone.trim(),
              paymentMethod: paymobSubtype,
              walletPhone: walletNumber.trim() || customerPhone.trim(),
              items: cart,
            }),
          });
          const paymobData = await paymobRes.json();

          if (!paymobRes.ok || !paymobData.success) {
            const errorMsg =
              paymobData.error ||
              (language === 'ar'
                ? 'بوابة باي موب غير مفعلة حالياً على الخادم. يرجى استخدام إنستاباي أو فودافون كاش، أو إدخال مفاتيح باي موب في لوحة تحكم المتجر.'
                : 'Paymob gateway is not active yet. Please choose InstaPay or Vodafone Cash, or configure Paymob in the Owner Portal.');
            setPaymobGatewayError(errorMsg);
            onShowToast(errorMsg, 'error');
            setIsSubmitting(false);
            return;
          }

          setPendingOrderPayload(orderData);
          if (paymobData.iframeUrl) {
            setPaymobIframeUrl(paymobData.iframeUrl);
            setIsSubmitting(false);
            return;
          } else if (paymobData.redirectionUrl) {
            setPaymobRedirectionUrl(paymobData.redirectionUrl);
            window.open(paymobData.redirectionUrl, '_blank');
            setIsSubmitting(false);
            return;
          }
        } catch (paymobErr: any) {
          const errorMsg =
            language === 'ar'
              ? 'تعذر الاتصال ببوابة باي موب. يرجى التحقق من الشبكة أو الدفع عبر التحويل البنكي.'
              : 'Unable to connect to Paymob gateway. Please verify network or use direct transfer.';
          setPaymobGatewayError(errorMsg);
          onShowToast(errorMsg, 'error');
          setIsSubmitting(false);
          return;
        }
      }

      // Save order to backend, firestore, and trigger Google Sheets webhook
      await saveOrderToBackend(orderData);

      // Deduct redeemed points if discount was applied
      if (pointsSpent > 0) {
        await redeemPoints(pointsSpent, `Discount on Order #${actualOrderId}`, user.email, user.name);
      }

      setConfirmedOrder(orderData);
      onOrderPlaced(orderData);
      onShowToast(
        language === 'ar'
          ? `تم تأكيد الطلب بنجاح! رقم الطلب: ${actualOrderId}`
          : `Order placed successfully! Order ID: ${actualOrderId}`,
        'success'
      );
    } catch (err: any) {
      console.error(err);
      onShowToast(
        language === 'ar'
          ? 'حدث خطأ أثناء إرسال الطلب. يرجى إعادة المحاولة أو التواصل مع الدعم.'
          : 'There was an issue submitting your order. Please retry or contact support.',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPaymobPayment = async () => {
    if (!pendingOrderPayload) return;
    setIsVerifyingPayment(true);
    try {
      const res = await fetch(`/api/paymob/verify-payment?orderNumber=${pendingOrderPayload.orderNumber}`);
      const data = await res.json();
      if (data.isPaid || data.status === 'success') {
        const finalOrder: Order = {
          ...pendingOrderPayload,
          paymentStatus: 'paid',
          transactionReference: data.transactionId ? `PAYMOB-${data.transactionId}` : `PAYMOB-${Date.now()}`,
        };
        await saveOrderToBackend(finalOrder);
        if (pointsSpent > 0) {
          await redeemPoints(
            pointsSpent,
            `Discount on Order #${finalOrder.orderNumber}`,
            user.email,
            user.name
          );
        }
        setConfirmedOrder(finalOrder);
        onOrderPlaced(finalOrder);
        setPaymobIframeUrl(null);
        setPaymobRedirectionUrl(null);
        onShowToast(
          language === 'ar'
            ? `تم تأكيد الدفع بنجاح عبر باي موب! رقم الطلب: ${finalOrder.orderNumber}`
            : `Paymob payment authorized successfully! Order ID: ${finalOrder.orderNumber}`,
          'success'
        );
      } else {
        onShowToast(
          data.message ||
            (language === 'ar'
              ? 'لم يتم تأكيد الدفع بعد من باي موب. يرجى إتمام العملية وإعادة الفحص.'
              : 'Payment has not been confirmed by Paymob yet. Please complete payment and verify again.'),
          'info'
        );
      }
    } catch (err: any) {
      console.error(err);
      onShowToast(
        language === 'ar' ? 'فشلت عملية التحقق من الدفع' : 'Payment verification failed',
        'error'
      );
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const copyOrderId = () => {
    if (!confirmedOrder) return;
    navigator.clipboard.writeText(confirmedOrder.orderNumber);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    onShowToast(
      language === 'ar' ? 'تم نسخ رقم الطلب إلى الحافظة!' : 'Order ID copied to clipboard!',
      'info'
    );
  };

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#0e0e1a] border border-purple-500/30 rounded-3xl shadow-[0_0_60px_rgba(147,51,234,0.25)] overflow-hidden my-6">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-950/80 via-[#15102a] to-[#0e0e1a] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-600/30 border border-purple-400/30 text-purple-300">
              <Receipt className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  {language === 'ar' ? 'الدفع المباشر في الموقع' : 'Direct Website Checkout'}
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                  {language === 'ar' ? 'بدون واتساب' : 'No WhatsApp Required'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'ar'
                  ? 'ادفع بأمان عبر باي موب أو ارفع إيصال التحويل مباشرة'
                  : 'Pay securely on-site or upload transaction screenshot'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ORDER SUCCESS SCREEN */}
        {confirmedOrder ? (
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-3xl flex items-center justify-center mx-auto text-emerald-400 animate-in zoom-in-50 duration-300">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">
                {language === 'ar' ? 'تم تأكيد طلبك بنجاح!' : 'Order Confirmed!'}
              </h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                {language === 'ar' ? (
                  <>
                    شكراً لك، <span className="font-bold text-white">{confirmedOrder.userName}</span>! تم تسجيل طلبك بنجاح وسيتم تنفيذه وتسليمه لك فوراً.
                  </>
                ) : (
                  <>
                    Thank you, <span className="font-bold text-white">{confirmedOrder.userName}</span>! Your order has been registered directly on the website and sent to our fulfillment queue.
                  </>
                )}
              </p>
            </div>

            {/* Actual Order ID Banner */}
            <div className="p-4 bg-slate-900/90 border border-purple-500/30 rounded-2xl max-w-md mx-auto flex items-center justify-between gap-3 shadow-lg">
              <div className="text-left">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {language === 'ar' ? 'رقم طلبك الرسمي' : 'Your Official Order ID'}
                </p>
                <p className="text-xl font-mono font-black text-purple-300 tracking-wider">
                  {confirmedOrder.orderNumber}
                </p>
              </div>

              <button
                onClick={copyOrderId}
                className="px-3 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/30 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedId ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">{language === 'ar' ? 'تم النسخ' : 'Copied'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>{language === 'ar' ? 'نسخ الرقم' : 'Copy'}</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-black transition-all cursor-pointer shadow-lg shadow-purple-900/40"
              >
                {language === 'ar' ? 'العودة للمتجر' : 'Done & Continue Browsing'}
              </button>
            </div>
          </div>
        ) : (!user.isAuthenticated && !auth.currentUser) ? (
          /* MANDATORY LOGIN SCREEN TO BUY ANYTHING */
          <div className="p-6 sm:p-8 space-y-6 max-h-[78vh] overflow-y-auto">
            {/* Cart Preview Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/70 to-slate-900 border border-purple-500/30 flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-300 font-bold uppercase tracking-wider">
                  {language === 'ar' ? 'سلة المشتريات المعلقة' : 'Pending Cart'}
                </p>
                <p className="text-sm font-extrabold text-white mt-0.5">
                  {cart.length}{' '}
                  {language === 'ar'
                    ? cart.length === 1
                      ? 'عنصر جاهز للتنفيذ'
                      : 'عناصر جاهزة للتنفيذ'
                    : cart.length === 1
                    ? 'Item ready to purchase'
                    : 'Items ready to purchase'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">
                  {language === 'ar' ? 'المبلغ المطلوب' : 'Total Due'}
                </p>
                <p className="text-xl font-black text-purple-400 font-mono">
                  {total} {language === 'ar' ? 'ج.م' : 'L.E'}
                </p>
              </div>
            </div>

            {/* Security Notice */}
            <div className="text-center space-y-2 py-1">
              <div className="inline-flex p-3 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-300 mb-1">
                <Lock className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                {language === 'ar' ? 'تسجيل الدخول مطلوب لإتمام الشراء' : 'Sign In Required to Complete Purchase'}
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                {language === 'ar'
                  ? 'جميع طلبات المتجر رسمية وحقيقية وتُربط بحسابك لتسليم أكواد الألعاب وحفظ رصيدك ونقاطك وإرسال تفاصيل الفاتورة إلى الإكسيل شيت المباشر.'
                  : 'All orders are real and linked to your account to securely deliver game keys, track your order history, and sync to live records.'}
              </p>
            </div>

            {/* Quick 1-Click Google Sign-In */}
            <button
              type="button"
              disabled={isAuthenticating}
              onClick={handleQuickGoogleSignIn}
              className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg shadow-white/10 disabled:opacity-50"
            >
              {isAuthenticating ? (
                <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
              ) : (
                <Zap className="w-5 h-5 text-purple-600 fill-purple-600" />
              )}
              <span>
                {language === 'ar'
                  ? 'تسجيل دخول فوري بنقرة واحدة عبر Google'
                  : '1-Click Instant Sign in with Google'}
              </span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-white/15" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                {language === 'ar' ? 'أو بالبريد الإلكتروني' : 'Or with Email'}
              </span>
              <div className="flex-1 h-px bg-white/15" />
            </div>

            {/* Auth Mode Toggle */}
            <div className="flex p-1 rounded-xl bg-slate-950 border border-white/10">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'signin'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'signup'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'إنشاء حساب جديد' : 'Create Account'}</span>
              </button>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {authError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{authError}</span>
                </div>
              )}

              {authMode === 'signup' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    {language === 'ar' ? 'الاسم بالكامل' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: أحمد حسن' : 'e.g. Ahmed Hassan'}
                    className="w-full bg-slate-950 border border-white/15 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full bg-slate-950 border border-white/15 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  {language === 'ar' ? 'كلمة المرور' : 'Password'}
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-white/15 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-black text-xs sm:text-sm transition-all cursor-pointer shadow-lg shadow-purple-900/40 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAuthenticating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
                <span>
                  {authMode === 'signin'
                    ? language === 'ar'
                      ? 'تسجيل الدخول ومتابعة الشراء'
                      : 'Sign In & Continue Checkout'
                    : language === 'ar'
                    ? 'إنشاء الحساب ومتابعة الشراء'
                    : 'Create Account & Continue Checkout'}
                </span>
              </button>
            </form>
          </div>
        ) : (
          /* CHECKOUT FORM */
          <form onSubmit={handleSubmitOrder} className="p-5 sm:p-7 space-y-5 max-h-[78vh] overflow-y-auto">
            {/* Cart Summary Header */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  {language === 'ar' ? 'ملخص السلة' : 'Cart Overview'}
                </p>
                <p className="text-sm font-extrabold text-white mt-0.5">
                  {cart.length}{' '}
                  {language === 'ar'
                    ? cart.length === 1
                      ? 'عنصر جاهز للتسليم'
                      : 'عناصر جاهزة للتسليم'
                    : cart.length === 1
                    ? 'Item Ready for Delivery'
                    : 'Items Ready for Delivery'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">
                  {language === 'ar' ? 'المبلغ المستحق' : 'Total Due'}
                </p>
                <p className="text-xl font-black text-purple-400">
                  {total} {language === 'ar' ? 'ج.م' : 'L.E'}
                </p>
              </div>
            </div>

            {/* Customer Contact Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {language === 'ar' ? '1. بيانات الاتصال والتسليم' : '1. Delivery & Contact Details'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    {language === 'ar' ? 'اسمك الكريم' : 'Your Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: أحمد حسن' : 'e.g. Ahmed Hassan'}
                    className="w-full bg-slate-950 border border-white/15 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    {language === 'ar' ? 'رقم الواتساب أو الهاتف للتسليم' : 'WhatsApp or Phone for Delivery'}{' '}
                    <span className="text-purple-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="012XXXXXXXX or 010XXXXXXXX"
                    className="w-full bg-slate-950 border border-white/15 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {language === 'ar' ? 'يُستخدم للتواصل وتسليم الطلب ومتابعة الشحن' : 'Used for order coordination and delivery'}
                  </p>
                </div>
              </div>

              {/* Real Email Verification Section (100% Free Firebase Auth) */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-purple-500/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-purple-400" />
                    <label className="text-[11px] font-bold text-slate-200">
                      {language === 'ar' ? 'البريد الإلكتروني للطلب والتأكيد' : 'Email Address for Order & Verification'}{' '}
                      <span className="text-purple-400">*</span>
                    </label>
                  </div>
                  {isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                      <Check className="w-3 h-3 text-emerald-400" />
                      {language === 'ar' ? 'تم تأكيد البريد ✓' : 'Email Verified ✓'}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEmailVerificationModalOpen(true)}
                      className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-300 hover:text-amber-200 bg-amber-950/60 hover:bg-amber-950/90 px-2.5 py-0.5 rounded-full border border-amber-500/40 cursor-pointer transition-all shadow-sm"
                    >
                      <ShieldCheck className="w-3 h-3 text-amber-400" />
                      <span>{language === 'ar' ? 'تأكيد البريد مطلوب (اضغط للتأكيد)' : 'Verification Required (Click to Verify)'}</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => {
                      setCustomerEmail(e.target.value);
                      if (isEmailVerified) setIsEmailVerified(false);
                    }}
                    placeholder="name@gmail.com"
                    className="flex-1 bg-slate-900 border border-white/15 focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none"
                  />

                  {!isEmailVerified && (
                    <div className="flex gap-2">
                      {/* Open EmailVerificationModal */}
                      <button
                        type="button"
                        onClick={() => setIsEmailVerificationModalOpen(true)}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-md shadow-purple-900/30"
                        title={language === 'ar' ? 'فتح نافذة التحقق الرسمية عبر Firebase أو Gmail' : 'Open Official Email Verification Modal'}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-200" />
                        <span>{language === 'ar' ? 'تأكيد البريد' : 'Verify Email'}</span>
                      </button>

                      {/* 1-Click Google Verify (Instant Free) */}
                      <button
                        type="button"
                        disabled={isSendingVerification}
                        onClick={handleVerifyWithGoogle}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0 disabled:opacity-50"
                        title={language === 'ar' ? 'تأكيد فوري مجاني بنقرة واحدة عبر حساب جوجل' : '1-Click Free Instant Verification with Google'}
                      >
                        <Zap className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
                        <span>{language === 'ar' ? 'تأكيد عبر Google' : 'Google Verify'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Verification in-progress banner */}
                {!isEmailVerified && verificationEmailSent && !showCodeInput && (
                  <div className="p-2.5 rounded-xl bg-purple-950/50 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <p className="text-slate-300 text-[11px]">
                      {language === 'ar'
                        ? 'تم إرسال رابط التأكيد إلى بريدك! اضغط على الرابط في رسالة البريد، ثم اضغط على زر الفحص:'
                        : 'Verification sent! Click the link in your inbox, then verify status:'}
                    </p>
                    <button
                      type="button"
                      disabled={isCheckingVerification}
                      onClick={handleCheckVerificationLink}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isCheckingVerification ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      <span>{language === 'ar' ? 'ضغطت على الرابط (فحص)' : 'I Clicked the Link'}</span>
                    </button>
                  </div>
                )}

                {/* 6-Digit Gmail OTP Code Input */}
                {!isEmailVerified && (showCodeInput || verificationEmailSent) && (
                  <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-200 font-bold flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-purple-400" />
                        {language === 'ar' ? 'أدخل رمز التحقق (6 أرقام) من بريدك عبر Gmail:' : 'Enter 6-digit Gmail OTP code:'}
                      </span>
                      {emailCountdown > 0 && (
                        <span className="text-slate-400 font-mono text-[10px]">{emailCountdown}s</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={emailOtpCode}
                        onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-32 text-center tracking-widest font-mono font-bold bg-slate-950 border border-white/20 focus:border-purple-400 rounded-lg px-2 py-1.5 text-xs text-white"
                      />
                      <button
                        type="button"
                        disabled={isVerifyingCode || emailOtpCode.length < 6}
                        onClick={handleVerifyEmailCode}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        {isVerifyingCode ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        <span>{language === 'ar' ? 'تأكيد الرمز' : 'Verify Code'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rocket League & Fortnite Account Credentials */}
            {hasFortniteOrRocket && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/70 to-blue-950/60 border border-purple-500/40 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black uppercase text-amber-300 tracking-wider">
                    {language === 'ar'
                      ? 'بيانات حساب فورتنايت / روكيت ليج (مطلوبة للشحن الفوري داخل اللعبة)'
                      : 'Rocket League & Fortnite Account Login (Required for charging)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {language === 'ar'
                    ? 'لشحن الـ V-Bucks أو كريدتس روكيت ليج مباشرة في حسابك، يرجى تقديم بريدك الإلكتروني وكلمة المرور الخاصة بإيبك أو بلايستيشن. يتم التعامل مع بياناتك بأقصى درجات الأمان والسرية.'
                    : 'To charge your V-Bucks or Rocket League Credits directly into your game account, please provide your login details. They will be processed securely.'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      {language === 'ar' ? 'بريد إيبك / PSN' : 'Epic Games / PSN Email'}{' '}
                      <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={gameAccountEmail}
                      onChange={(e) => setGameAccountEmail(e.target.value)}
                      placeholder="epic.account@gmail.com"
                      className="w-full bg-slate-950 border border-white/20 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      {language === 'ar' ? 'كلمة مرور الحساب' : 'Account Password'}{' '}
                      <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={gameAccountPassword}
                      onChange={(e) => setGameAccountPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-white/20 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* DISCOUNT PART ON PAYMENT: Coupon Code & Points Stacking */}
            <div className="p-4 rounded-2xl bg-[#17122b] border border-purple-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-purple-400" />
                  <span>{language === 'ar' ? 'أكواد الخصم والنقاط عند الدفع' : 'Discounts & Points on Payment'}</span>
                </span>
                <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                  {language === 'ar' ? 'النقاط تعمل مع الخصومات' : 'Points Stack with Discounts'}
                </span>
              </div>

              {/* Coupon input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value)}
                  placeholder={language === 'ar' ? 'كود الخصم' : 'Promo Code'}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-white/15 focus:border-purple-500 rounded-xl text-xs font-mono uppercase font-bold text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
                >
                  {language === 'ar' ? 'تطبيق الكود' : 'Apply'}
                </button>
              </div>

              {couponError && <p className="text-[10px] text-rose-400">{couponError}</p>}
              {appliedCoupon && couponDiscountEgp > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-400 font-bold bg-emerald-950/40 p-2 rounded-xl border border-emerald-500/30">
                  <span>
                    {language === 'ar'
                      ? `تم تطبيق كود "${appliedCoupon}": خصم -${couponDiscountEgp} ج.م`
                      : `Code "${appliedCoupon}" applied: -${couponDiscountEgp} L.E discount`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon('');
                      setCouponCodeInput('');
                    }}
                    className="text-rose-400 hover:text-rose-300 text-[10px] underline cursor-pointer"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Remove'}
                  </button>
                </div>
              )}

              {/* Points Redemption & Progress */}
              <div className="space-y-2">
                {availablePoints < POINTS_TIERS.DISCOUNT_THRESHOLD ? (
                  /* Under 16k threshold banner with progress */
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/20 space-y-2">
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
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between gap-3 shadow-md shadow-amber-950/30">
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
                            ? `رصيدك: ${availablePoints.toLocaleString()} نقطة (خصم 50 ج.م متاح)`
                            : `Balance: ${availablePoints.toLocaleString()} PTS (50 L.E off available)`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!usePointsDiscount) {
                          setUseFreeGameReward(false);
                        }
                        setUsePointsDiscount(!usePointsDiscount);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        usePointsDiscount
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/30'
                          : 'bg-slate-900 border border-white/20 text-slate-300 hover:text-white'
                      }`}
                    >
                      {usePointsDiscount
                        ? language === 'ar'
                          ? `مفعل (-${pointsDiscountEgp} ج.م)`
                          : `Applied (-${pointsDiscountEgp} L.E)`
                        : language === 'ar'
                        ? 'تطبيق الخصم'
                        : 'Apply 50 L.E Off'}
                    </button>
                  </div>
                )}

                {/* 180k Tier: Free Game Reward */}
                {canRedeemFreeGame(availablePoints) && highestPricedGame && (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-950/60 to-amber-950/50 border border-amber-400/60 flex items-center justify-between gap-3 shadow-lg shadow-purple-950/40">
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
                        if (!useFreeGameReward) {
                          setUsePointsDiscount(false);
                        }
                        setUseFreeGameReward(!useFreeGameReward);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        useFreeGameReward
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black shadow-md shadow-yellow-500/40'
                          : 'bg-slate-900 border border-amber-400/40 text-amber-200 hover:text-white'
                      }`}
                    >
                      {useFreeGameReward
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
            </div>

            {/* Type what you bought / Account notes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {language === 'ar' ? '2. تحديد ما اشتريته وملاحظات الحساب' : '2. Type What You Bought & Account Notes'}
                </label>
                <span className="text-[10px] text-purple-400 font-bold">
                  {language === 'ar' ? 'قابل للتعديل' : 'Editable'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'ar'
                  ? 'اكتب اسم الحساب أو اسم مستخدم PSN أو أي طلبات إضافية لتسريع التسليم:'
                  : 'Specify your PSN username, Epic Games ID, preferred delivery time, or custom requests:'}
              </p>
              <textarea
                rows={3}
                required
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder={
                  language === 'ar'
                    ? 'اكتب ما اشتريته هنا (مثال: فيفا 26 حساب أساسي، أو شحن في بوكس لحسابي...)'
                    : 'Type what you bought (e.g. EA Sports FC 26 for PS5 primary account. My PSN tag is ...)'
                }
                className="w-full bg-slate-950 border border-white/15 focus:border-purple-500 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none font-mono leading-relaxed"
              />
            </div>

            {/* Choose Website Payment Method */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                {language === 'ar' ? '3. اختر طريقة الدفع' : '3. Choose Payment Method'}
              </label>

              <div className="grid grid-cols-2 gap-3">
                {/* Method 1: Paymob Website Payment (Coming Soon) */}
                <button
                  type="button"
                  onClick={() => setCheckoutMethod('paymob')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    checkoutMethod === 'paymob'
                      ? 'bg-purple-950/70 border-purple-500 shadow-md shadow-purple-950/50 text-white'
                      : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="p-1 rounded-lg bg-blue-500/20">
                      <img src="/paymob.png" alt="Paymob" className="w-5 h-5 object-contain" />
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                      {language === 'ar' ? 'قريباً' : 'Coming Soon'}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-white">
                    {language === 'ar' ? 'بوابة باي موب' : 'Paymob Gateway'}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {language === 'ar' ? 'بطاقات ومحافظ إلكترونية مباشرة' : 'Direct Cards & Mobile Wallets on site'}
                  </p>
                </button>

                {/* Method 2: Transfer with Screenshot Upload */}
                <button
                  type="button"
                  onClick={() => setCheckoutMethod('transfer')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    checkoutMethod === 'transfer'
                      ? 'bg-purple-950/70 border-purple-500 shadow-md shadow-purple-950/50 text-white'
                      : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1">
                      <img src="/Instapay.png" alt="InstaPay" className="w-5 h-5 object-contain rounded-sm" />
                      <img src="/Telda.jpg" alt="Telda" className="w-5 h-5 object-contain rounded-sm" />
                    </div>
                    {checkoutMethod === 'transfer' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                  </div>
                  <h4 className="font-extrabold text-sm text-white">
                    {language === 'ar' ? 'تحويل ورفع الإيصال' : 'Transfer & Upload Proof'}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {language === 'ar' ? 'إنستاباي، فودافون كاش، تيلدا' : 'InstaPay, Vodafone Cash, Telda'}
                  </p>
                </button>
              </div>
            </div>

            {/* PAYMOB METHOD DETAILS (COMING SOON NOTIFICATION) */}
            {checkoutMethod === 'paymob' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                      {language === 'ar' ? 'بوابة باي موب قيد التجهيز الفني (قريباً)' : 'Paymob Gateway Under Active Integration (Coming Soon)'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {language === 'ar' ? 'قيد التطوير' : 'In Progress'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {language === 'ar'
                    ? 'جاري الربط التقني النهائي لبوابة باي موب الرسمية (فيزا، ماستركارد، كروت ميزة، والمحافظ الإلكترونية). حالياً، يرجى استخدام طريقة "تحويل ورفع الإيصال" (إنستاباي / فودافون كاش / تيلدا) لتنفيذ طلبك وتسليم الألعاب فوراً وبدون أي تأخير!'
                    : 'The Paymob payment gateway is undergoing live technical testing and will be available very soon. For instant order fulfillment right now, please select Transfer & Upload Proof (InstaPay / Vodafone Cash / Telda).'}
                </p>

                <button
                  type="button"
                  onClick={() => setCheckoutMethod('transfer')}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {language === 'ar'
                      ? 'التحويل عبر إنستاباي / فودافون كاش / تيلدا للتنفيذ الفوري'
                      : 'Switch to InstaPay / Vodafone Cash / Telda for Instant Order'}
                  </span>
                </button>
              </div>
            )}

            {/* MANUAL TRANSFER & SCREENSHOT UPLOAD METHOD */}
            {checkoutMethod === 'transfer' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-pink-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    {language === 'ar' ? 'حسابات التحويل المعتمدة' : 'Transfer Destination Accounts'}
                  </span>
                  <span className="text-[10px] font-bold text-pink-400">
                    {language === 'ar' ? 'انقر للنسخ' : 'Click to copy'}
                  </span>
                </div>

                {/* Transfer destination selector */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTransferType('instapay')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      transferType === 'instapay'
                        ? 'bg-pink-950/80 border-pink-500 text-pink-200'
                        : 'bg-slate-950 border-white/10 text-slate-400'
                    }`}
                  >
                    <img src="/Instapay.png" alt="InstaPay" className="w-5 h-5 object-contain mx-auto mb-1" />
                    <span className="block text-xs font-extrabold">InstaPay</span>
                    <span className="text-[10px] font-mono opacity-80">01212072882</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransferType('vodafone_cash')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      transferType === 'vodafone_cash'
                        ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                        : 'bg-slate-950 border-white/10 text-slate-400'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-rose-400 mx-auto mb-1" />
                    <span className="block text-xs font-extrabold">Vodafone Cash</span>
                    <span className="text-[10px] font-mono opacity-80">01042240852</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTransferType('telda')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      transferType === 'telda'
                        ? 'bg-purple-950/80 border-purple-500 text-purple-200'
                        : 'bg-slate-950 border-white/10 text-slate-400'
                    }`}
                  >
                    <img src="/Telda.jpg" alt="Telda" className="w-5 h-5 object-contain rounded-sm mx-auto mb-1" />
                    <span className="block text-xs font-extrabold">Telda</span>
                    <span className="text-[10px] font-mono opacity-80">@selimahmed1</span>
                  </button>
                </div>

                {/* Direct copy banner */}
                <div className="p-3 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {language === 'ar' ? `حوّل مبلغ ${total} ج.م إلى:` : `Transfer ${total} L.E To:`}
                    </span>
                    <p className="text-sm font-mono font-black text-pink-300">
                      {transferType === 'instapay' && '01212072882 (InstaPay / Bank)'}
                      {transferType === 'vodafone_cash' && '01042240852 (Vodafone Cash)'}
                      {transferType === 'telda' && '@selimahmed1 (Telda App)'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const val =
                        transferType === 'instapay'
                          ? '01212072882'
                          : transferType === 'vodafone_cash'
                          ? '01042240852'
                          : '@selimahmed1';
                      handleCopyText(val, 'Account');
                    }}
                    className="p-2 rounded-lg bg-pink-500/20 hover:bg-pink-500/40 text-pink-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'نسخ' : 'Copy'}</span>
                  </button>
                </div>

                {/* Screenshot Upload Dropzone */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                    <span>
                      {language === 'ar' ? 'رفع لقطة شاشة لإيصال التحويل' : 'Upload Screenshot of Transaction Receipt'}
                    </span>
                    <span className="text-pink-400">*</span>
                  </label>

                  {screenshotPreview ? (
                    <div className="p-3 bg-slate-950 rounded-xl border border-emerald-500/40 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={screenshotPreview}
                          alt="Receipt Preview"
                          className="w-14 h-14 object-cover rounded-lg border border-white/20"
                        />
                        <div>
                          <p className="text-xs font-bold text-white truncate max-w-[200px]">
                            {screenshotName || 'Receipt Screenshot'}
                          </p>
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />{' '}
                            {language === 'ar' ? 'جاهز للإرسال' : 'Ready to submit'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setScreenshotPreview(null);
                          setScreenshotName('');
                        }}
                        className="px-2.5 py-1 text-xs text-rose-400 hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                      >
                        {language === 'ar' ? 'حذف' : 'Remove'}
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-purple-500/40 hover:border-purple-400 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-950/60 hover:bg-purple-950/20 transition-all">
                      <Upload className="w-6 h-6 text-purple-400" />
                      <div className="text-center">
                        <span className="text-xs font-extrabold text-white block">
                          {language === 'ar' ? 'انقر لرفع صورة أو لقطة شاشة' : 'Click to upload photo or screenshot'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {language === 'ar'
                            ? 'يدعم JPG, PNG, WEBP (إيصال بنكي أو إنستاباي أو رسالة فودافون كاش)'
                            : 'Supports JPG, PNG, WEBP (Bank receipt, InstaPay, SMS screenshot)'}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Optional Transaction reference number */}
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">
                    {language === 'ar'
                      ? 'رقم العملية المرجعي أو رقم المحول منه (اختياري)'
                      : 'Transaction Reference Number / Sender Mobile (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. Ref #9482103 or Transfer from 01012345678"
                    className="w-full bg-slate-950 border border-white/15 focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white"
                  />
                </div>
              </div>
            )}

            {/* Bottom Action Submit */}
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 px-6 rounded-2xl text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl hover:scale-[1.01] active:scale-98 transition-all cursor-pointer disabled:opacity-50 ${
                  !isEmailVerified
                    ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 shadow-amber-900/40'
                    : 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 shadow-purple-900/50 hover:opacity-95'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>
                      {language === 'ar' ? 'جاري معالجة وتأكيد الطلب...' : 'Processing & Creating Order...'}
                    </span>
                  </>
                ) : !isEmailVerified ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-200" />
                    <span>
                      {language === 'ar'
                        ? 'تأكيد البريد مطلوب قبل إتمام الطلب (انقر هنا للتأكيد)'
                        : 'Verify Email to Complete Order (Click to Verify)'}
                    </span>
                  </>
                ) : (
                  <>
                    {checkoutMethod === 'paymob' ? (
                      <>
                        <Clock className="w-4 h-4 text-amber-300" />
                        <span>
                          {language === 'ar'
                            ? 'بوابة باي موب (قريباً) — اضغط للتحويل الفوري عبر إنستاباي'
                            : 'Paymob (Coming Soon) — Click to Switch to Transfer'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-yellow-300" />
                        <span>
                          {language === 'ar'
                            ? `إرسال الطلب مع إيصال الدفع (${total} ج.م)`
                            : `Submit Order with Attached Proof (${total} L.E)`}
                        </span>
                      </>
                    )}
                  </>
                )}
              </button>

              {/* Or WhatsApp Fallback */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>
                  {language === 'ar' ? 'تفضل إتمام الطلب عبر المحادثة؟' : 'Prefer to order via messaging?'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenWhatsAppCheckout();
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>
                    {language === 'ar' ? 'الطلب عبر واتساب بدلاً من ذلك' : 'Order via WhatsApp instead'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* PAYMOB LIVE SECURE IFRAME DIALOG */}
        {paymobIframeUrl && pendingOrderPayload && (
          <div className="fixed inset-0 z-[2700] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-2xl w-full h-[660px] flex flex-col shadow-2xl overflow-hidden relative">
              <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-600/30 border border-purple-500 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-purple-300 uppercase">Paymob Gateway</div>
                    <div className="text-xs text-slate-300 font-bold">
                      {language === 'ar' ? 'نافذة الدفع البنكي المؤمنة' : 'Secure Card Checkout Frame'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymobIframeUrl(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <iframe
                src={paymobIframeUrl}
                title="Paymob Secure Card Payment"
                className="w-full flex-1 bg-white border-none"
              />

              <div className="p-4 bg-slate-950 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>{language === 'ar' ? 'طلب رقم:' : 'Order:'} <strong className="text-white font-mono">{pendingOrderPayload.orderNumber}</strong></span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">{pendingOrderPayload.total} EGP</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setPaymobIframeUrl(null)}
                    className="flex-1 sm:flex-none px-3 py-2 rounded-xl border border-white/15 text-slate-300 text-xs font-bold hover:bg-white/5 cursor-pointer"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    disabled={isVerifyingPayment}
                    onClick={handleVerifyPaymobPayment}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 cursor-pointer disabled:opacity-50"
                  >
                    {isVerifyingPayment ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{language === 'ar' ? 'جاري التحقق...' : 'Verifying...'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        <span>{language === 'ar' ? 'تحقق من اكتمال الدفع' : 'Verify Payment Status'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAYMOB WALLET REDIRECTION / APPROVAL PROMPT */}
        {paymobRedirectionUrl && pendingOrderPayload && (
          <div className="fixed inset-0 z-[2700] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-white relative">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-xs font-black tracking-wider text-purple-300 uppercase">Paymob Mobile Wallet</div>
                    <div className="text-sm font-bold text-white">
                      {language === 'ar' ? 'تأكيد الدفع عبر المحفظة' : 'Wallet Authorization'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymobRedirectionUrl(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-950/80 rounded-2xl p-4 border border-white/10 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>{language === 'ar' ? 'رقم الطلب:' : 'Order ID:'}</span>
                  <span className="font-mono text-purple-300 font-bold">{pendingOrderPayload.orderNumber}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{language === 'ar' ? 'المبلغ المطلوب:' : 'Amount:'}</span>
                  <span className="font-bold text-emerald-400 text-sm">{pendingOrderPayload.total} EGP</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {language === 'ar'
                  ? 'تم إرسال طلب الدفع إلى المحفظة الإلكترونية أو فتح نافذة الدفع. يرجى إدخال الرقم السري في هاتفك ثم الضغط على "تحقق من اكتمال الدفع".'
                  : 'The payment prompt has been sent to your wallet. Please approve the transaction on your phone, then click "Verify Payment Status".'}
              </p>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymobRedirectionUrl(null)}
                  className="flex-1 py-3 px-4 rounded-xl border border-white/15 hover:bg-white/5 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isVerifyingPayment}
                  onClick={handleVerifyPaymobPayment}
                  className="flex-[2] py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 cursor-pointer disabled:opacity-50"
                >
                  {isVerifyingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{language === 'ar' ? 'جاري التحقق...' : 'Verifying...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>{language === 'ar' ? 'تحقق من اكتمال الدفع' : 'Verify Payment Status'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dedicated Firebase Auth & OTP Email Verification Modal */}
        <EmailVerificationModal
          isOpen={isEmailVerificationModalOpen}
          onClose={() => setIsEmailVerificationModalOpen(false)}
          email={customerEmail || user.email || ''}
          onVerified={(verifiedEmail) => {
            setCustomerEmail(verifiedEmail);
            setIsEmailVerified(true);
            setIsEmailVerificationModalOpen(false);
          }}
          language={language}
          onShowToast={onShowToast}
        />
      </div>
    </div>
  );
};
