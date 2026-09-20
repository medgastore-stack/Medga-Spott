import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CreditCard,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  Save,
  HelpCircle,
  Mail,
  Send,
  Clock,
  ShoppingBag,
  Layers,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface OwnerIntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const OwnerIntegrationsModal: React.FC<OwnerIntegrationsModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'sheets' | 'gmail' | 'paymob'>('sheets');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTestingPaymob, setIsTestingPaymob] = useState<boolean>(false);
  const [isTestingSheet, setIsTestingSheet] = useState<boolean>(false);
  const [isTestingGmail, setIsTestingGmail] = useState<boolean>(false);

  // Paymob States
  const [paymobApiKey, setPaymobApiKey] = useState<string>('');
  const [paymobPublicKey, setPaymobPublicKey] = useState<string>('');
  const [paymobSecretKey, setPaymobSecretKey] = useState<string>('');
  const [paymobCardId, setPaymobCardId] = useState<string>('');
  const [paymobWalletId, setPaymobWalletId] = useState<string>('');
  const [paymobIframeId, setPaymobIframeId] = useState<string>('1');
  const [paymobHmac, setPaymobHmac] = useState<string>('');
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [showSecretKey, setShowSecretKey] = useState<boolean>(false);
  const [paymobTestStatus, setPaymobTestStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  } | null>(null);

  // Google Sheets States
  const [sheetWebhookUrl, setSheetWebhookUrl] = useState<string>('');
  const [sheetTestStatus, setSheetTestStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  } | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [realOrders, setRealOrders] = useState<any[]>([]);
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);
  const [sendingOrderNumber, setSendingOrderNumber] = useState<string | null>(null);

  // Gmail SMTP States
  const [gmailUser, setGmailUser] = useState<string>('');
  const [gmailAppPassword, setGmailAppPassword] = useState<string>('');
  const [showGmailPassword, setShowGmailPassword] = useState<boolean>(false);
  const [testRecipientEmail, setTestRecipientEmail] = useState<string>('');
  const [gmailTestStatus, setGmailTestStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  } | null>(null);

  // Fetch current backend settings and real store orders
  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    fetch('/api/settings/integrations')
      .then((res) => res.json())
      .then((data) => {
        if (data.googleSheetWebhookUrl) {
          setSheetWebhookUrl(data.googleSheetWebhookUrl);
        }
        if (data.emailVerification) {
          setGmailUser(data.emailVerification.gmailUser || '');
        }
        if (data.paymob) {
          setPaymobApiKey(data.paymob.apiKey || '');
          setPaymobPublicKey(data.paymob.publicKey || '');
          setPaymobSecretKey(data.paymob.secretKey || '');
          setPaymobCardId(data.paymob.cardIntegrationId || '');
          setPaymobWalletId(data.paymob.walletIntegrationId || '');
          setPaymobIframeId(data.paymob.iframeId || '1');
          setPaymobHmac(data.paymob.hmacSecret || '');
          setIsLiveMode(Boolean(data.paymob.isLive));
        }
      })
      .catch((err) => {
        console.warn('Failed to load settings:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // Fetch actual registered store orders
    fetch('/api/orders')
      .then((res) => res.json())
      .then((ordersList) => {
        if (Array.isArray(ordersList)) {
          const authenticOrders = ordersList.filter(
            (o: any) => !o.orderNumber?.includes('TEST') && !o.orderNumber?.includes('VERIFY')
          );
          setRealOrders(authenticOrders);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const payload = {
        googleSheetWebhookUrl: sheetWebhookUrl.trim(),
        emailVerification: {
          gmailUser: gmailUser.trim(),
          gmailAppPassword: gmailAppPassword.trim(),
        },
        paymob: {
          apiKey: paymobApiKey.trim(),
          publicKey: paymobPublicKey.trim(),
          secretKey: paymobSecretKey.trim(),
          cardIntegrationId: paymobCardId.trim(),
          walletIntegrationId: paymobWalletId.trim(),
          iframeId: paymobIframeId.trim() || '1',
          hmacSecret: paymobHmac.trim(),
          isLive: isLiveMode,
        },
      };

      const res = await fetch('/api/settings/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (sheetWebhookUrl.trim()) {
          localStorage.setItem('google_sheet_webhook_url', sheetWebhookUrl.trim());
        }
        onShowToast(
          language === 'ar'
            ? 'تم حفظ كافة الإعدادات (جوجل شيت، بريد Gmail، باي موب) بنجاح!'
            : 'Settings (Google Sheets, Gmail SMTP, Paymob) saved successfully!',
          'success'
        );
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (e: any) {
      console.error(e);
      onShowToast(
        language === 'ar' ? 'فشل حفظ الإعدادات' : 'Failed to save settings',
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendRealOrder = async (orderNumber?: string) => {
    if (!sheetWebhookUrl.trim()) {
      onShowToast(
        language === 'ar'
          ? 'يرجى إدخال رابط Webhook الخاص بـ Google Sheet أولاً'
          : 'Please enter Google Sheet Webhook URL first',
        'error'
      );
      return;
    }

    setIsTestingSheet(true);
    if (orderNumber) setSendingOrderNumber(orderNumber);
    setSheetTestStatus(null);
    try {
      const res = await fetch('/api/settings/google-sheets/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: sheetWebhookUrl.trim(),
          orderNumber: orderNumber || (realOrders[0]?.orderNumber ?? undefined),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSheetTestStatus({
          tested: true,
          success: true,
          message:
            language === 'ar'
              ? `تم إرسال الطلب الفعلي #${data.orderNumber} (${data.customer || 'عميل'} - ${data.total || 0} ج.م) إلى جدول Google Sheet بنجاح!`
              : `Actual order #${data.orderNumber} (${data.customer || 'Customer'} - ${data.total || 0} LE) sent to Google Sheet successfully!`,
        });
        onShowToast(
          language === 'ar' ? 'تم إرسال الطلب الحقيقي للشيت بنجاح!' : 'Real order sent to sheet successfully!',
          'success'
        );
      } else {
        setSheetTestStatus({
          tested: true,
          success: false,
          message: data.error || 'Failed to append real order to Google Sheet',
        });
        onShowToast(
          language === 'ar' ? 'فشل إرسال الطلب للشيت' : 'Failed to send real order to sheet',
          'error'
        );
      }
    } catch (err: any) {
      setSheetTestStatus({
        tested: true,
        success: false,
        message: err.message || 'Network error',
      });
    } finally {
      setIsTestingSheet(false);
      setSendingOrderNumber(null);
    }
  };

  const handleSyncAllRealOrders = async () => {
    if (!sheetWebhookUrl.trim()) {
      onShowToast(
        language === 'ar'
          ? 'يرجى إدخال رابط Webhook الخاص بـ Google Sheet أولاً'
          : 'Please enter Google Sheet Webhook URL first',
        'error'
      );
      return;
    }

    setIsSyncingAll(true);
    setSheetTestStatus(null);
    try {
      const res = await fetch('/api/settings/google-sheets/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: sheetWebhookUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSheetTestStatus({
          tested: true,
          success: true,
          message:
            language === 'ar'
              ? `تمت مزامنة (${data.syncedCount}) طلبات حقيقية من أصل (${data.total}) إلى جدول Google Sheet بنجاح!`
              : `Synced ${data.syncedCount} of ${data.total} actual orders to Google Sheet successfully!`,
        });
        onShowToast(
          language === 'ar' ? `تمت مزامنة ${data.syncedCount} طلبات حقيقية!` : `Synced ${data.syncedCount} real orders!`,
          'success'
        );
      } else {
        setSheetTestStatus({
          tested: true,
          success: false,
          message: data.error || 'Failed to sync orders',
        });
        onShowToast(data.error || 'Sync failed', 'error');
      }
    } catch (err: any) {
      setSheetTestStatus({
        tested: true,
        success: false,
        message: err.message || 'Network error',
      });
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleTestGmail = async () => {
    if (!gmailUser.trim()) {
      onShowToast(
        language === 'ar' ? 'يرجى إدخال عنوان Gmail أولاً' : 'Please enter your Gmail address first',
        'error'
      );
      return;
    }

    setIsTestingGmail(true);
    setGmailTestStatus(null);
    try {
      const res = await fetch('/api/settings/test-gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gmailUser: gmailUser.trim(),
          gmailAppPassword: gmailAppPassword.trim(),
          recipientEmail: testRecipientEmail.trim() || gmailUser.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGmailTestStatus({
          tested: true,
          success: true,
          message:
            language === 'ar'
              ? `تم الاتصال بنجاح وإرسال رمز OTP تجريبي إلى ${testRecipientEmail.trim() || gmailUser.trim()}! افتح بريدك للتأكد.`
              : `Connected and test OTP sent successfully to ${testRecipientEmail.trim() || gmailUser.trim()}! Check your inbox.`,
        });
        onShowToast(
          language === 'ar' ? 'تم فحص وإرسال كود Gmail بنجاح!' : 'Gmail OTP sent successfully!',
          'success'
        );
      } else {
        setGmailTestStatus({
          tested: true,
          success: false,
          message: data.error || 'Failed to authenticate with Gmail SMTP',
        });
        onShowToast(data.error || 'Gmail test failed', 'error');
      }
    } catch (err: any) {
      setGmailTestStatus({
        tested: true,
        success: false,
        message: err.message || 'Network error',
      });
    } finally {
      setIsTestingGmail(false);
    }
  };

  const handleTestPaymob = async () => {
    if (!paymobApiKey.trim()) {
      onShowToast(
        language === 'ar'
          ? 'يرجى إدخال مفتاح API الخاص بباي موب أولاً'
          : 'Please enter your Paymob API Key first',
        'error'
      );
      return;
    }

    setIsTestingPaymob(true);
    setPaymobTestStatus(null);
    try {
      const res = await fetch('/api/paymob/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: paymobApiKey.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPaymobTestStatus({
          tested: true,
          success: true,
          message:
            language === 'ar'
              ? 'تم التحقق من مفتاح باي موب واستلام التوكن الرسمي بنجاح!'
              : 'Successfully connected to Paymob! Authentication token received.',
        });
        onShowToast(
          language === 'ar' ? 'باي موب متصل وجاهز للعمل!' : 'Paymob connected successfully!',
          'success'
        );
      } else {
        setPaymobTestStatus({
          tested: true,
          success: false,
          message: data.error || 'Failed to authenticate with Paymob',
        });
        onShowToast(
          language === 'ar' ? 'فشل الاتصال بباي موب' : 'Paymob connection failed',
          'error'
        );
      }
    } catch (err: any) {
      setPaymobTestStatus({
        tested: true,
        success: false,
        message: err.message || 'Connection error',
      });
    } finally {
      setIsTestingPaymob(false);
    }
  };

  const googleAppsScriptCode = `function doPost(e) {
  return handleRequest(e);
}

function doGet(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Auto-create headers in the exact requested sequence if empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Name", "Order", "Number", "email", "password"]);
    }
    
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }
    
    // Extract strictly in order: Name, Order, Number, email, password
    var name = data.Name || data.name || data.userName || "Customer";
    var order = data.Order || data.order || "Store Order";
    var number = data.Number || data.number || data.customerPhone || "";
    var email = data.email || data.userEmail || data.gameAccountEmail || "";
    var password = data.password || data.gameAccountPassword || "";
    
    sheet.appendRow([name, order, number, email, password]);
    
    return ContentService.createTextOutput(JSON.stringify({ result: "success", status: 200 }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const copyScript = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopiedScript(true);
    onShowToast(
      language === 'ar' ? 'تم نسخ كود Google Apps Script!' : 'Google Apps Script code copied!',
      'success'
    );
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[2800] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0f0e1c] border border-purple-500/30 rounded-3xl shadow-[0_0_60px_rgba(147,51,234,0.25)] overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-950/90 via-[#16122d] to-[#0f0e1c] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-600/30 border border-purple-400/40 text-purple-300">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  {language === 'ar'
                    ? 'لوحة تكامل الخدمات والطلبات'
                    : 'Store Integrations & Automation Hub'}
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {language === 'ar' ? 'نظام فعلي' : 'Live Services'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'ar'
                  ? 'ربط جدول Google Sheets لتسجيل الطلبات تلقائياً، وإرسال أكواد التحقق عبر Gmail'
                  : 'Sync orders to Google Sheets and send email verification OTPs via Gmail'}
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

        {/* Tab Switcher */}
        <div className="flex border-b border-white/10 bg-slate-950/60 p-1.5 gap-2">
          {/* TAB 1: GOOGLE SHEETS */}
          <button
            type="button"
            onClick={() => setActiveTab('sheets')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeTab === 'sheets'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span>{language === 'ar' ? 'جدول الطلبات (Google Sheets)' : 'Google Sheets Sync'}</span>
            {sheetWebhookUrl ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>

          {/* TAB 2: GMAIL OTP */}
          <button
            type="button"
            onClick={() => setActiveTab('gmail')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeTab === 'gmail'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-4 h-4 text-purple-300" />
            <span>{language === 'ar' ? 'كود OTP عبر Gmail' : 'Gmail OTP'}</span>
            {gmailUser ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>

          {/* TAB 3: PAYMOB (COMING SOON) */}
          <button
            type="button"
            onClick={() => setActiveTab('paymob')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer relative ${
              activeTab === 'paymob'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4 text-blue-300" />
            <span>Paymob</span>
            <span className="px-1.5 py-0.2 text-[9px] font-black rounded-full bg-amber-500 text-slate-950">
              {language === 'ar' ? 'قريباً' : 'Soon'}
            </span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="p-5 sm:p-6 max-h-[68vh] overflow-y-auto space-y-6">
          {/* TAB 1: GOOGLE SHEETS INTEGRATION */}
          {activeTab === 'sheets' && (
            <div className="space-y-5">
              {/* Info Banner */}
              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white">
                    {language === 'ar'
                      ? 'تسجيل كل طلب حقيقي في Google Sheets تلقائياً'
                      : 'Automated Real Order Logging to Google Sheets'}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {language === 'ar'
                      ? 'كل طلب يتم في المتجر يُرسل فوراً إلى جدول جوجل الخاص بك بالأعمدة الخمسة بدقة: Name, Order, Number, email, password'
                      : 'Every real order is sent live to your Google Sheet with the exact 5 columns: Name, Order, Number, email, password.'}
                  </p>
                </div>
              </div>

              {/* Webhook Input Field */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {language === 'ar' ? 'رابط Webhook (Google Apps Script Web App URL)' : 'Google Apps Script Web App URL'}{' '}
                  <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="url"
                  value={sheetWebhookUrl}
                  onChange={(e) => setSheetWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                  className="w-full bg-slate-950 border border-white/15 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none"
                />
                {sheetWebhookUrl.includes('/macros/library/d/') && (
                  <div className="mt-2 p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[11px] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <p className="font-bold">
                        {language === 'ar' ? 'تنبيه: هذا رابط مكتبة (Library) وليس تطبيق ويب (Web App)' : 'Notice: This is a Library link, not a Web App URL'}
                      </p>
                      <p className="mt-0.5 text-amber-200/80">
                        {language === 'ar'
                          ? 'في Apps Script اضغط Deploy ثم New deployment واختر نوع Web app واجعل Who has access: Anyone، ثم انسخ الرابط الذي ينتهي بـ /exec'
                          : 'In Apps Script, click Deploy > New deployment, select Web app, set "Who has access" to "Anyone", and copy the URL ending in /exec.'}
                      </p>
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-slate-500 mt-1">
                  {language === 'ar'
                    ? 'أنشئ Web App من Google Sheets -> Extensions -> Apps Script وقم بنشره بصلاحية Anyone'
                    : 'Create a Web App in Google Sheets -> Extensions -> Apps Script and Deploy as Anyone'}
                </p>
              </div>

              {/* Real Orders Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSendRealOrder()}
                  disabled={isTestingSheet || isSyncingAll || !sheetWebhookUrl.trim()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-950"
                >
                  {isTestingSheet && !sendingOrderNumber ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{language === 'ar' ? 'جارٍ إرسال الطلب الفعلي...' : 'Sending Real Order...'}</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>
                        {language === 'ar'
                          ? `إرسال أحدث طلب حقيقي للشيت ${realOrders.length > 0 ? `(#${realOrders[0].orderNumber})` : ''}`
                          : `Send Latest Real Order ${realOrders.length > 0 ? `(#${realOrders[0].orderNumber})` : ''}`}
                      </span>
                    </>
                  )}
                </button>

                {realOrders.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSyncAllRealOrders}
                    disabled={isSyncingAll || isTestingSheet || !sheetWebhookUrl.trim()}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-purple-950"
                  >
                    {isSyncingAll ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{language === 'ar' ? 'جارٍ مزامنة كافة الطلبات...' : 'Syncing All Orders...'}</span>
                      </>
                    ) : (
                      <>
                        <Layers className="w-3.5 h-3.5" />
                        <span>
                          {language === 'ar'
                            ? `مزامنة جميع الطلبات الحقيقية (${realOrders.length} طلب)`
                            : `Sync All Real Orders (${realOrders.length})`}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Real Orders Table / Direct Send Hub */}
              {realOrders.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{language === 'ar' ? 'الطلبات الحقيقية المسجلة في المتجر:' : 'Actual Registered Store Orders:'}</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {language === 'ar' ? `${realOrders.length} طلب فعلي` : `${realOrders.length} Real Orders`}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {realOrders.map((ord: any) => {
                      const isThisSending = isTestingSheet && sendingOrderNumber === ord.orderNumber;
                      const itemsDesc = (ord.items || []).map((i: any) => i.name).join(', ') || ord.customerNotes || 'Digital Item';
                      return (
                        <div
                          key={ord.orderNumber || ord.id}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900 border border-white/5 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-emerald-400">#{ord.orderNumber}</span>
                              <span className="text-white font-medium truncate">{ord.userName || 'Customer'}</span>
                              <span className="text-[10px] text-slate-400">({ord.customerPhone || 'No phone'})</span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {itemsDesc} • <strong className="text-white">{ord.total} LE</strong>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSendRealOrder(ord.orderNumber)}
                            disabled={isTestingSheet || isSyncingAll || !sheetWebhookUrl.trim()}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 disabled:opacity-40 text-[11px] text-white font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                          >
                            {isThisSending ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            <span>{language === 'ar' ? 'إرسال للشيت' : 'Send to Sheet'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sheet Test Result */}
              {sheetTestStatus && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                    sheetTestStatus.success
                      ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                  }`}
                >
                  {sheetTestStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <span className="font-semibold">{sheetTestStatus.message}</span>
                    {!sheetTestStatus.success && sheetTestStatus.message.includes('403') && (
                      <p className="text-[11px] text-rose-200/90 leading-relaxed">
                        {language === 'ar'
                          ? 'حل سريع: في صفحة Google Apps Script، اضغط الزر الأزرق Deploy في الزاوية العلوية > ثم Manage deployments > اضغط رمز القلم (Edit) > غيّر Who has access إلى Anyone > واضغط Deploy.'
                          : 'Quick Fix: In Google Apps Script, click Deploy > Manage deployments > click the pencil icon (Edit) > change "Who has access" to "Anyone" > click Deploy.'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Exact Apps Script Code Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    {language === 'ar'
                      ? 'كود Google Apps Script المعتمد (يدعم POST و GET تلقائياً بالأعمدة الـ 5):'
                      : 'Google Apps Script Code (supports POST & GET redirects with exact 5 columns):'}
                  </span>
                  <button
                    type="button"
                    onClick={copyScript}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{language === 'ar' ? 'تم النسخ!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? 'نسخ الكود' : 'Copy Script'}</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-3 bg-slate-900/90 rounded-xl text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-48 border border-white/5 leading-relaxed">
                  {googleAppsScriptCode}
                </pre>

                <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-[11px] text-slate-300 space-y-2">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-purple-400" />
                    <span>{language === 'ar' ? 'طريقة الربط خطوة بخطوة:' : 'Step-by-Step Instructions:'}</span>
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-400 text-xs leading-relaxed">
                    <li>{language === 'ar' ? 'افتح جدول Google Sheets جديد (أو إكسل جوجل).' : 'Open a new or existing Google Sheet.'}</li>
                    <li>{language === 'ar' ? 'من القائمة العلوية اضغط Extensions ثم Apps Script.' : 'Click Extensions -> Apps Script.'}</li>
                    <li>{language === 'ar' ? 'امسح أي كود موجود، والصق الكود المنسوخ أعلاه، واضغط زر الحفظ 💾.' : 'Delete existing code, paste the script above, and click Save.'}</li>
                    <li>{language === 'ar' ? 'اضغط Deploy في الأعلى، ثم New deployment.' : 'Click Deploy -> New deployment.'}</li>
                    <li>{language === 'ar' ? 'اختر نوع Web App، واضبط الخيار "Who has access" على "Anyone" (مهم جداً).' : 'Select Web App, and set "Who has access" to "Anyone" (crucial).'}</li>
                    <li>{language === 'ar' ? 'انسخ رابط Web App URL والصقه هنا واضغط "حفظ إعدادات الربط".' : 'Copy the Web App URL, paste it here, and click Save.'}</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GMAIL OTP SYSTEM */}
          {activeTab === 'gmail' && (
            <div className="space-y-5">
              {/* Info Banner */}
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white">
                    {language === 'ar'
                      ? 'إرسال كود OTP عبر Gmail مجاناً 100%'
                      : 'Send Real 6-Digit OTP via Free Gmail SMTP'}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {language === 'ar'
                      ? 'يتيح لك إرسال رمز تحقق سري من 6 أرقام إلى بريد العميل تلقائياً عند الشراء عبر حساب Gmail الرسمي الخاص بك دون أي تكلفة (حتى 500 رسالة يومياً مجاناً).'
                      : 'Dispatches cryptographically secure 6-digit verification codes to customer inboxes using your official Gmail account (up to 500 free emails/day via Google App Password).'}
                  </p>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    {language === 'ar' ? 'عنوان بريد Gmail للمرسل' : 'Your Gmail Address'}{' '}
                    <span className="text-purple-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={gmailUser}
                    onChange={(e) => setGmailUser(e.target.value)}
                    placeholder="e.g. medgastore@gmail.com"
                    className="w-full bg-slate-950 border border-white/15 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    {language === 'ar' ? 'البريد الذي ستصل منه الرسائل للعملاء' : 'The sender Gmail address'}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    {language === 'ar' ? 'كلمة مرور التطبيق (Google App Password)' : '16-Character App Password'}{' '}
                    <span className="text-purple-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showGmailPassword ? 'text' : 'password'}
                      value={gmailAppPassword}
                      onChange={(e) => setGmailAppPassword(e.target.value)}
                      placeholder="abcd efgh ijkl mnop"
                      className="w-full bg-slate-950 border border-white/15 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGmailPassword(!showGmailPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showGmailPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {language === 'ar'
                      ? 'رمز من 16 حرفاً من إعدادات حساب جوجل (وليس كلمة مرور الحساب العادية)'
                      : '16-character token from Google Account (not regular password)'}
                  </p>
                </div>
              </div>

              {/* Test Gmail Section */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-3">
                <h5 className="text-xs font-bold text-slate-300">
                  {language === 'ar' ? 'اختبار إرسال رمز OTP تجريبي:' : 'Test Gmail OTP Dispatch:'}
                </h5>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={testRecipientEmail}
                    onChange={(e) => setTestRecipientEmail(e.target.value)}
                    placeholder={gmailUser || 'recipient@gmail.com'}
                    className="flex-1 bg-slate-900 border border-white/15 focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleTestGmail}
                    disabled={isTestingGmail || !gmailUser.trim()}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-purple-950"
                  >
                    {isTestingGmail ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{language === 'ar' ? 'جارٍ الإرسال...' : 'Sending...'}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? 'إرسال رمز OTP تجريبي' : 'Send Test OTP Code'}</span>
                      </>
                    )}
                  </button>
                </div>

                {gmailTestStatus && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2.5 ${
                      gmailTestStatus.success
                        ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {gmailTestStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{gmailTestStatus.message}</span>
                  </div>
                )}
              </div>

              {/* Step-by-Step Instructions */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 to-slate-950 border border-purple-500/20 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>{language === 'ar' ? 'كيف تحصل على كلمة مرور التطبيق (Google App Password)؟' : 'How to generate your Google App Password:'}</span>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 text-xs leading-relaxed">
                  <li>
                    {language === 'ar'
                      ? 'افتح حساب جوجل الخاص بك من المتصفح (myaccount.google.com).'
                      : 'Open your Google Account (myaccount.google.com).'}
                  </li>
                  <li>
                    {language === 'ar'
                      ? 'اذهب إلى تبويب "الأمان" (Security) وتأكد من تفعيل "التحقق بخطوتين" (2-Step Verification).'
                      : 'Go to "Security" tab and make sure "2-Step Verification" is turned ON.'}
                  </li>
                  <li>
                    {language === 'ar'
                      ? 'ادخل مباشرة على صفحة كلمات مرور التطبيقات عبر الرابط: https://myaccount.google.com/apppasswords'
                      : 'Navigate directly to App Passwords: https://myaccount.google.com/apppasswords'}
                  </li>
                  <li>
                    {language === 'ar'
                      ? 'اكتب اسم التطبيق (مثال: Medga Store) ثم اضغط "إنشاء" (Create).'
                      : 'Enter app name (e.g. Medga Store) and click "Create".'}
                  </li>
                  <li>
                    {language === 'ar'
                      ? 'سيظهر لك رمز أصفر مكوّن من 16 حرفاً (مثال: abcd efgh ijkl mnop). انسخه بالكامل.'
                      : 'Google will show a 16-character code (e.g. abcd efgh ijkl mnop). Copy it.'}
                  </li>
                  <li>
                    {language === 'ar'
                      ? 'الصقه هنا في خانة "كلمة مرور التطبيق" واضغط "حفظ إعدادات الربط".'
                      : 'Paste it above in the App Password field and click "Save Integration Settings".'}
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: PAYMOB GATEWAY (COMING SOON) */}
          {activeTab === 'paymob' && (
            <div className="space-y-5">
              {/* Coming Soon Notice */}
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-white">
                      {language === 'ar'
                        ? 'بوابة Paymob قيد التطوير التقني والتجهيز (قريباً)'
                        : 'Paymob Gateway Under Active Integration (Coming Soon)'}
                    </h4>
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full bg-amber-500 text-slate-950">
                      {language === 'ar' ? 'قيد التجهيز' : 'Coming Soon'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {language === 'ar'
                      ? 'نعمل حالياً على إتمام كافة متطلبات الربط مع باي موب. في الوقت الحالي، الدفع عبر إنستاباي، فودافون كاش، وتيلدا يعمل بكفاءة تامة وتأكيد فوري للطلبات. يمكنك حفظ مفاتيح باي موب هنا ليتم تفعيلها فور الانتهاء.'
                      : 'Paymob automated card & wallet checkout is under active technical integration and will launch soon. Instant payments via InstaPay, Vodafone Cash, and Telda are currently live and operational.'}
                  </p>
                </div>
              </div>

              {/* Key Configuration Inputs */}
              <div className="space-y-4 p-4 rounded-2xl bg-slate-950 border border-white/10">
                <h5 className="text-xs font-bold text-slate-300">
                  {language === 'ar' ? 'بيانات ومفاتيح حساب Paymob (للحفظ والتجهيز):' : 'Paymob Account Credentials (For upcoming launch):'}
                </h5>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={paymobApiKey}
                      onChange={(e) => setPaymobApiKey(e.target.value)}
                      placeholder="ZXlKaGJHY2lPaUpJVXpVe..."
                      className="w-full bg-slate-900 border border-white/15 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Card Integration ID
                    </label>
                    <input
                      type="text"
                      value={paymobCardId}
                      onChange={(e) => setPaymobCardId(e.target.value)}
                      placeholder="e.g. 482190"
                      className="w-full bg-slate-900 border border-white/15 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Wallet Integration ID
                    </label>
                    <input
                      type="text"
                      value={paymobWalletId}
                      onChange={(e) => setPaymobWalletId(e.target.value)}
                      placeholder="e.g. 482191"
                      className="w-full bg-slate-900 border border-white/15 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>

                {/* Test Connection Button */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleTestPaymob}
                    disabled={isTestingPaymob || !paymobApiKey.trim()}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-blue-950"
                  >
                    {isTestingPaymob ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>{language === 'ar' ? 'جارٍ فحص المفتاح...' : 'Checking API Key...'}</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-yellow-300" />
                        <span>{language === 'ar' ? 'فحص مصادقة مفتاح باي موب' : 'Validate Paymob API Key'}</span>
                      </>
                    )}
                  </button>
                </div>

                {paymobTestStatus && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2.5 ${
                      paymobTestStatus.success
                        ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {paymobTestStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{paymobTestStatus.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-t border-white/10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            {language === 'ar' ? 'إغلاق' : 'Close'}
          </button>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl gradient-bg hover:opacity-90 disabled:opacity-50 text-white text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-950/50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{language === 'ar' ? 'جارٍ الحفظ...' : 'Saving Changes...'}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{language === 'ar' ? 'حفظ إعدادات الربط' : 'Save Integration Settings'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
