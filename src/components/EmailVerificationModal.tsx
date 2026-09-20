import React, { useState, useEffect } from 'react';
import {
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  KeyRound,
  ExternalLink,
  Zap,
  RefreshCw,
  Edit3,
  Check,
} from 'lucide-react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  sendEmailVerification,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  reload,
} from '../lib/firebase';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerified: (verifiedEmail: string) => void;
  language?: 'ar' | 'en';
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  email,
  onVerified,
  language = 'ar',
  onShowToast,
}) => {
  const [currentEmail, setCurrentEmail] = useState(email);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState(email);

  // Active sub-tab: 'link' (Firebase Email Link) or 'otp' (Gmail OTP Code)
  const [activeTab, setActiveTab] = useState<'link' | 'otp'>('link');

  // Firebase email link states
  const [isSendingFirebaseLink, setIsSendingFirebaseLink] = useState(false);
  const [firebaseLinkSent, setFirebaseLinkSent] = useState(false);
  const [isCheckingFirebaseStatus, setIsCheckingFirebaseStatus] = useState(false);
  const [linkCountdown, setLinkCountdown] = useState(0);

  // Gmail OTP states
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // 1-Click Google Verify
  const [isGoogleVerifying, setIsGoogleVerifying] = useState(false);

  // General Status
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync email prop when opened
  useEffect(() => {
    if (email) {
      setCurrentEmail(email.trim());
      setNewEmailInput(email.trim());
    }
  }, [email, isOpen]);

  // Timers for countdowns
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (linkCountdown > 0) {
      timer = setTimeout(() => setLinkCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [linkCountdown]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // Check if user came from an email sign-in link
  useEffect(() => {
    if (!isOpen) return;

    if (typeof window !== 'undefined' && isSignInWithEmailLink(auth, window.location.href)) {
      let savedEmail = window.localStorage.getItem('emailForSignIn') || currentEmail;
      if (savedEmail) {
        setIsCheckingFirebaseStatus(true);
        signInWithEmailLink(auth, savedEmail, window.location.href)
          .then((res) => {
            window.localStorage.removeItem('emailForSignIn');
            handleSuccess(res.user?.email || savedEmail);
          })
          .catch((err) => {
            console.warn('Sign-in with email link error:', err);
          })
          .finally(() => {
            setIsCheckingFirebaseStatus(false);
          });
      }
    }
  }, [isOpen, currentEmail]);

  if (!isOpen) return null;

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (onShowToast) {
      onShowToast(msg, type);
    }
  };

  const handleSuccess = (verifiedEmailStr: string) => {
    const clean = verifiedEmailStr.trim().toLowerCase();
    setVerificationSuccess(true);
    setErrorMessage('');
    showToast(
      language === 'ar'
        ? 'تم تأكيد البريد الإلكتروني بنجاح! يمكنك الآن إتمام الطلب.'
        : 'Email verified successfully! You may now complete your order.',
      'success'
    );
    setTimeout(() => {
      onVerified(clean);
      onClose();
    }, 1200);
  };

  const handleSaveEditedEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newEmailInput.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setErrorMessage(
        language === 'ar'
          ? 'يرجى إدخال عنوان بريد إلكتروني صحيح'
          : 'Please enter a valid email address'
      );
      return;
    }
    setCurrentEmail(trimmed);
    setIsEditingEmail(false);
    setErrorMessage('');
    setFirebaseLinkSent(false);
    setOtpSent(false);
  };

  // 1. Firebase Auth Email Link / Verification Flow
  const handleSendFirebaseLink = async () => {
    const clean = currentEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      setErrorMessage(
        language === 'ar' ? 'البريد الإلكتروني غير صحيح' : 'Invalid email address'
      );
      return;
    }

    setIsSendingFirebaseLink(true);
    setErrorMessage('');

    try {
      // If user is currently signed in to Firebase Auth
      if (auth.currentUser && auth.currentUser.email?.toLowerCase() === clean) {
        await sendEmailVerification(auth.currentUser);
        setFirebaseLinkSent(true);
        setLinkCountdown(60);
        showToast(
          language === 'ar'
            ? `تم إرسال رابط تأكيد رسمي إلى ${clean}! افتح بريدك واضغط على الرابط.`
            : `Official verification link sent to ${clean}! Open your inbox and click the link.`,
          'success'
        );
      } else {
        // Use Firebase Auth Passwordless email link
        const actionCodeSettings = {
          url: `${window.location.origin}/?emailVerified=true&email=${encodeURIComponent(clean)}`,
          handleCodeInApp: true,
        };
        await sendSignInLinkToEmail(auth, clean, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', clean);
        setFirebaseLinkSent(true);
        setLinkCountdown(60);
        showToast(
          language === 'ar'
            ? `تم إرسال رابط تأكيد الدخول إلى ${clean}! اضغط على الرابط في بريدك للتأكيد.`
            : `Verification link sent to ${clean}! Click the link in your email.`,
          'success'
        );
      }
    } catch (err: any) {
      console.warn('Firebase email link error:', err);
      if (err?.code === 'auth/too-many-requests') {
        setErrorMessage(
          language === 'ar'
            ? 'تم إرسال عدة طلبات مؤخراً. يرجى الانتظار دقيقة ثم المحاولة ثانية.'
            : 'Too many requests. Please wait a minute before trying again.'
        );
      } else {
        // Auto fallback to Gmail OTP if Firebase email link is disabled in project
        setErrorMessage(err?.message || 'Failed to dispatch verification email');
      }
    } finally {
      setIsSendingFirebaseLink(false);
    }
  };

  // Check if Firebase Auth link was clicked
  const handleCheckFirebaseStatus = async () => {
    setIsCheckingFirebaseStatus(true);
    setErrorMessage('');

    try {
      if (auth.currentUser) {
        await reload(auth.currentUser);
        if (auth.currentUser.emailVerified) {
          handleSuccess(auth.currentUser.email || currentEmail);
          return;
        }
      }

      // Check server confirmation endpoint
      const res = await fetch('/api/email-verify/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEmail.toLowerCase() }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        if (data.verified) {
          handleSuccess(currentEmail);
          return;
        }
      }

      setErrorMessage(
        language === 'ar'
          ? 'لم يتم تأكيد الرابط بعد! افتح رسالة البريد واضغط على الرابط، ثم اضغط على هذا الزر مجدداً.'
          : 'Email not verified yet! Please open your email, click the link, and click this button again.'
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to check verification status');
    } finally {
      setIsCheckingFirebaseStatus(false);
    }
  };

  // 2. Gmail OTP 6-Digit Flow
  const handleSendGmailOtp = async () => {
    const clean = currentEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      setErrorMessage(
        language === 'ar' ? 'البريد الإلكتروني غير صحيح' : 'Invalid email address'
      );
      return;
    }

    setIsSendingOtp(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: clean, type: 'email' }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setOtpSent(true);
        setOtpCountdown(60);
        showToast(
          language === 'ar'
            ? `تم إرسال كود OTP المكون من 6 أرقام إلى بريدك ${clean}!`
            : `6-digit OTP code dispatched to ${clean}!`,
          'success'
        );
      } else {
        setErrorMessage(
          data.error ||
            (language === 'ar'
              ? 'تعذر إرسال كود الـ OTP حالياً، يمكنك استخدام رابط Firebase أو التحقق الفوري عبر Google.'
              : 'Failed to send OTP code. Please use the Firebase Link or 1-Click Google Verify.')
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error while sending OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.trim().length < 6) {
      setErrorMessage(
        language === 'ar' ? 'يرجى إدخال كود OTP المكون من 6 أرقام' : 'Please enter the 6-digit OTP'
      );
      return;
    }

    setIsVerifyingOtp(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: currentEmail.trim().toLowerCase(), code: otpCode.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.verified) {
        handleSuccess(currentEmail);
      } else {
        setErrorMessage(
          data.error ||
            (language === 'ar'
              ? 'رمز التحقق غير صحيح أو منتهي الصلاحية'
              : 'Invalid or expired OTP code')
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to verify code');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // 3. Instant 1-Click Google Verify
  const handleQuickGoogleVerify = async () => {
    setIsGoogleVerifying(true);
    setErrorMessage('');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;
      if (googleUser && googleUser.email) {
        handleSuccess(googleUser.email);
      }
    } catch (err: any) {
      console.warn('Google verify error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMessage(
          err?.message ||
            (language === 'ar' ? 'فشل التحقق عبر Google' : 'Google verification failed')
        );
      }
    } finally {
      setIsGoogleVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-slate-900/95 border border-purple-500/40 rounded-3xl shadow-2xl shadow-purple-950/70 overflow-hidden text-white"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-300">
              <ShieldCheck className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>{language === 'ar' ? 'تأكيد البريد الإلكتروني' : 'Verify Email Address'}</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {language === 'ar' ? 'مطلوب للشراء' : 'Required'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'ar'
                  ? 'لتسليم أكواد الألعاب والفاتورة الرسمية بشكل فوري ومضمون'
                  : 'To ensure instant game keys and order delivery'}
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Target Email Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10">
            {isEditingEmail ? (
              <form onSubmit={handleSaveEditedEmail} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  placeholder="name@gmail.com"
                  className="flex-1 bg-slate-900 border border-purple-500/50 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'حفظ' : 'Save'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewEmailInput(currentEmail);
                    setIsEditingEmail(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-all cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <Mail className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-xs text-slate-400">{language === 'ar' ? 'البريد المراد تأكيده:' : 'Target Email:'}</span>
                  <span className="text-xs font-mono font-bold text-white truncate max-w-[200px] sm:max-w-[260px]">
                    {currentEmail}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingEmail(true)}
                  className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'تعديل' : 'Edit'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Success Banner */}
          {verificationSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-center space-y-1.5 animate-in zoom-in-95">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-black text-emerald-300">
                {language === 'ar' ? 'تم تأكيد البريد الإلكتروني بنجاح!' : 'Email Verified Successfully!'}
              </h4>
              <p className="text-xs text-emerald-200/80">
                {language === 'ar' ? 'جاري العودة لنافذة الشراء...' : 'Redirecting to checkout...'}
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && !verificationSuccess && (
            <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {!verificationSuccess && (
            <>
              {/* Method Switcher Tabs */}
              <div className="flex rounded-2xl bg-slate-950 p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('link')}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'link'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'رابط تأكيد Firebase' : 'Firebase Email Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('otp')}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'otp'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'كود OTP عبر Gmail' : 'Gmail 6-Digit OTP'}</span>
                </button>
              </div>

              {/* TAB 1: Firebase Auth Email Link Flow */}
              {activeTab === 'link' && (
                <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      <span>{language === 'ar' ? 'التحقق الرسمي عبر بريد Firebase' : 'Official Firebase Verification Link'}</span>
                    </h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {language === 'ar'
                        ? 'سنرسل رابط تفعيل رسمي إلى بريدك. افتح الرسالة واضغط على الرابط، ثم اضغط على زر "فحص حالة الرابط" بالأسفل.'
                        : 'We will send an official verification link to your email. Click it in your inbox, then press "Check Link Status" below.'}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      disabled={isSendingFirebaseLink || linkCountdown > 0}
                      onClick={handleSendFirebaseLink}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-xs font-black transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-purple-900/30"
                    >
                      {isSendingFirebaseLink ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                      <span>
                        {linkCountdown > 0
                          ? `${language === 'ar' ? 'إعادة الإرسال بعد' : 'Resend in'} ${linkCountdown}s`
                          : firebaseLinkSent
                          ? language === 'ar'
                            ? 'إعادة إرسال الرابط'
                            : 'Resend Verification Link'
                          : language === 'ar'
                          ? 'إرسال رابط التأكيد'
                          : 'Send Verification Link'}
                      </span>
                    </button>

                    {firebaseLinkSent && (
                      <button
                        type="button"
                        disabled={isCheckingFirebaseStatus}
                        onClick={handleCheckFirebaseStatus}
                        className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30 shrink-0"
                      >
                        {isCheckingFirebaseStatus ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        <span>{language === 'ar' ? 'فحص حالة الرابط' : 'Check Link Status'}</span>
                      </button>
                    )}
                  </div>

                  {firebaseLinkSent && (
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10 text-[11px] text-slate-300 space-y-1">
                      <div className="font-bold text-purple-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                        <span>{language === 'ar' ? 'تم إرسال الرابط إلى بريدك بنجاح' : 'Link Sent to Your Email'}</span>
                      </div>
                      <p className="text-slate-400 leading-relaxed">
                        {language === 'ar'
                          ? 'إذا لم تجد الرسالة في صندوق الوارد (Inbox)، يرجى تفقد مجلد البريد غير الهام (Spam / Junk) أو الترويج (Promotions).'
                          : 'If you do not see it in your primary inbox, please check your Spam or Promotions folder.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Gmail OTP Flow */}
              {activeTab === 'otp' && (
                <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-purple-400" />
                      <span>{language === 'ar' ? 'رمز تحقق فوري عبر Gmail (OTP)' : 'Instant Gmail OTP Code'}</span>
                    </h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {language === 'ar'
                        ? 'سنرسل كود تحقق مكون من 6 أرقام إلى بريدك مباشرة لإدخاله هنا.'
                        : 'We will send a 6-digit numeric OTP directly to your email.'}
                    </p>
                  </div>

                  {!otpSent ? (
                    <button
                      type="button"
                      disabled={isSendingOtp || otpCountdown > 0}
                      onClick={handleSendGmailOtp}
                      className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-xs font-black transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-purple-900/30"
                    >
                      {isSendingOtp ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                      <span>
                        {otpCountdown > 0
                          ? `${language === 'ar' ? 'إعادة الإرسال بعد' : 'Resend in'} ${otpCountdown}s`
                          : language === 'ar'
                          ? 'إرسال كود OTP إلى بريدي'
                          : 'Send 6-Digit OTP to Email'}
                      </span>
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <label className="text-slate-300 font-bold">
                          {language === 'ar' ? 'أدخل الرمز (6 أرقام):' : 'Enter 6-Digit Code:'}
                        </label>
                        {otpCountdown > 0 ? (
                          <span className="text-[11px] text-slate-400 font-mono">
                            {otpCountdown}s
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendGmailOtp}
                            disabled={isSendingOtp}
                            className="text-[11px] text-purple-400 hover:text-purple-300 font-bold underline cursor-pointer"
                          >
                            {language === 'ar' ? 'إعادة الإرسال' : 'Resend Code'}
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="123456"
                          className="flex-1 text-center tracking-widest font-mono font-black text-sm bg-slate-950 border border-white/20 focus:border-purple-400 rounded-xl px-3 py-2.5 text-white focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          disabled={isVerifyingOtp || otpCode.length < 6}
                          onClick={handleVerifyOtp}
                          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-purple-900/30 shrink-0"
                        >
                          {isVerifyingOtp ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          <span>{language === 'ar' ? 'تأكيد الرمز' : 'Verify Code'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Method 3: 1-Click Google Verification */}
              <div className="pt-1">
                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {language === 'ar' ? 'أو بنقرة واحدة سريعة' : 'Or Instant 1-Click'}
                  </span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <button
                  type="button"
                  disabled={isGoogleVerifying}
                  onClick={handleQuickGoogleVerify}
                  className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-black flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg shadow-white/5 disabled:opacity-50"
                >
                  {isGoogleVerifying ? (
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  ) : (
                    <Zap className="w-4 h-4 text-purple-600 fill-purple-600" />
                  )}
                  <span>
                    {language === 'ar'
                      ? 'تأكيد فوري بنقرة واحدة عبر حساب Google'
                      : '1-Click Instant Verification with Google'}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{language === 'ar' ? 'حماية مشفرة ومعتمدة' : 'Secure & Certified'}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold cursor-pointer"
          >
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
