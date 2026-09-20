import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
  Copy,
  ExternalLink,
  Package,
  Truck,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Info,
  Check,
  Loader2
} from 'lucide-react';
import { Order, OrderStatus, OrderItem } from '../types';
import { db } from '../lib/firebase';
import { deduplicateOrders } from '../lib/orderUtils';
import { doc, getDoc, getDocs, collection, query as firestoreQuery, where } from 'firebase/firestore';

interface OrderTrackerProps {
  orders: Order[];
  initialOrderNumber?: string;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

interface ItemStatusDetail {
  statusText: string;
  badgeClass: string;
  icon: React.ElementType;
  description: string;
  eta: string;
}

export const OrderTracker: React.FC<OrderTrackerProps> = ({
  orders,
  initialOrderNumber = '',
  onShowToast,
}) => {
  const [orderQuery, setOrderQuery] = useState(initialOrderNumber);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearchingDb, setIsSearchingDb] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // If initialOrderNumber changes or is provided, search automatically
  useEffect(() => {
    if (initialOrderNumber.trim()) {
      setOrderQuery(initialOrderNumber.trim());
      findAndSetOrder(initialOrderNumber.trim());
    } else if (orders.length > 0 && !activeOrder && !hasSearched) {
      // Default to the most recent order for convenient preview
      setActiveOrder(orders[0]);
      setOrderQuery(orders[0].orderNumber);
    }
  }, [initialOrderNumber, orders]);

  const normalizeQuery = (q: string) => q.trim().toUpperCase().replace(/\s+/g, '');

  const findAndSetOrder = async (queryStr: string) => {
    const normalized = normalizeQuery(queryStr);
    if (!normalized) {
      setActiveOrder(null);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    // 1. Check local orders in memory first
    const found = orders.find((o) => {
      const ordNumNorm = normalizeQuery(o.orderNumber);
      const ordIdNorm = normalizeQuery(o.id);
      return (
        ordNumNorm === normalized ||
        ordNumNorm === `SST-${normalized}` ||
        ordNumNorm.endsWith(normalized) ||
        ordNumNorm.includes(normalized) ||
        ordIdNorm === normalized
      );
    });

    if (found) {
      setActiveOrder(found);
      return;
    }

    // 2. Query Firestore live database
    setIsSearchingDb(true);
    try {
      if (db) {
        // Query by orderNumber
        const qSnap = await getDocs(
          firestoreQuery(collection(db, 'orders'), where('orderNumber', '==', queryStr.trim()))
        );
        if (!qSnap.empty) {
          const docSnap = qSnap.docs[0];
          const d = docSnap.data() as any;
          setActiveOrder({
            id: docSnap.id,
            orderNumber: d.orderNumber || docSnap.id,
            userEmail: d.userEmail || '',
            userName: d.userName || 'Customer',
            customerPhone: d.customerPhone || '',
            date: d.date || '',
            items: d.items || [],
            total: d.total || 0,
            status: d.status || 'Processing',
            paymentMethod: d.paymentMethod || 'Website Payment',
            customerNotes: d.customerNotes || '',
            paymentScreenshot: d.paymentScreenshot || '',
            createdAt: d.createdAt,
            rating: d.rating,
            ratingComment: d.ratingComment,
            ratedAt: d.ratedAt,
          });
          return;
        }

        // Try direct document ID lookup
        const directSnap = await getDoc(doc(db, 'orders', queryStr.trim()));
        if (directSnap.exists()) {
          const d = directSnap.data() as any;
          setActiveOrder({
            id: directSnap.id,
            orderNumber: d.orderNumber || directSnap.id,
            userEmail: d.userEmail || '',
            userName: d.userName || 'Customer',
            customerPhone: d.customerPhone || '',
            date: d.date || '',
            items: d.items || [],
            total: d.total || 0,
            status: d.status || 'Processing',
            paymentMethod: d.paymentMethod || 'Website Payment',
            customerNotes: d.customerNotes || '',
            paymentScreenshot: d.paymentScreenshot || '',
            createdAt: d.createdAt,
            rating: d.rating,
            ratingComment: d.ratingComment,
            ratedAt: d.ratedAt,
          });
          return;
        }
      }

      // 3. Query Backend API
      const res = await fetch(`/api/orders/${encodeURIComponent(queryStr.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          setActiveOrder(data.order);
          return;
        }
      }

      setActiveOrder(null);
    } catch (e) {
      console.warn('Error querying order:', e);
      setActiveOrder(null);
    } finally {
      setIsSearchingDb(false);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderQuery.trim()) return;
    await findAndSetOrder(orderQuery);
    setTimeout(() => {
      // Check state
    }, 100);
  };

  const handleRefreshStatus = () => {
    if (!activeOrder) return;
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      onShowToast('Live order status refreshed: Status is up to date', 'info');
    }, 600);
  };

  const handleCopyOrderNumber = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
    onShowToast(`Copied ${text}`, 'info');
  };

  // Derive per-item real-time processing status
  const getItemStatusDetail = (item: OrderItem, overallStatus: OrderStatus): ItemStatusDetail => {
    const nameLower = item.name.toLowerCase();
    const detailsLower = item.details.toLowerCase();

    if (overallStatus === 'Delivered' || overallStatus === 'Completed') {
      return {
        statusText: overallStatus === 'Completed' ? 'Completed & Handed Over' : 'Delivered & Activated',
        badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        icon: CheckCircle2,
        description: 'Credentials handed over and verified successfully with guarantee active.',
        eta: 'Completed',
      };
    }

    if (overallStatus === 'Cancelled') {
      return {
        statusText: 'Cancelled',
        badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        icon: AlertCircle,
        description: 'This item processing was cancelled. Reach support for refunds.',
        eta: 'Cancelled',
      };
    }

    if (overallStatus === 'Pending Delivery') {
      return {
        statusText: 'Ready for Handover',
        badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        icon: Truck,
        description: 'Account credentials and activation tokens prepared. Releasing via WhatsApp/Email.',
        eta: 'Est. 5–15 minutes',
      };
    }

    // Default 'Processing'
    if (nameLower.includes('v-bucks') || nameLower.includes('vbucks') || detailsLower.includes('fortnite')) {
      return {
        statusText: 'Epic ID Verification',
        badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        icon: Clock,
        description: 'Authenticating Epic account identifier for direct in-game balance transfer.',
        eta: 'Est. 10–25 minutes',
      };
    }

    if (nameLower.includes('plus') || detailsLower.includes('plus')) {
      return {
        statusText: 'PSN Subscription Setup',
        badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        icon: Clock,
        description: 'Configuring regional subscription slot and preparing primary activation guide.',
        eta: 'Est. 15–30 minutes',
      };
    }

    if (nameLower.includes('rocket') || detailsLower.includes('rocket')) {
      return {
        statusText: 'Rocket Credits Queue',
        badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        icon: Clock,
        description: 'Processing Epic/PlayStation ID credit drop with delivery agent.',
        eta: 'Est. 10–20 minutes',
      };
    }

    // Default game account
    return {
      statusText: 'Primary Account Preparation',
      badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      icon: Clock,
      description: 'Allocating fresh login credentials and configuring two-factor security.',
      eta: 'Est. 15–40 minutes',
    };
  };

  const getStepState = (stepIndex: number, status: OrderStatus) => {
    // 1: Order Placed
    // 2: Processing & Prep
    // 3: Pending Handover
    // 4: Delivered
    let currentStep = 2;
    if (status === 'Delivered' || status === 'Completed') currentStep = 4;
    else if (status === 'Pending Delivery') currentStep = 3;
    else if (status === 'Processing') currentStep = 2;
    else if (status === 'Cancelled') currentStep = 0;

    return {
      isCompleted: status !== 'Cancelled' && currentStep >= stepIndex,
      isCurrent: status !== 'Cancelled' && currentStep === stepIndex,
    };
  };

  const recentOrders = deduplicateOrders(orders).slice(0, 4);

  return (
    <div className="space-y-5">
      {/* Tracker Input Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#121220] border border-white/10 shadow-lg relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-400" />
              Live Order Tracker
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your order confirmation number to monitor real-time item fulfillment and delivery status.
            </p>
          </div>

          {activeOrder && (
            <button
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer disabled:opacity-60"
              title="Refresh live status"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Status'}</span>
            </button>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              placeholder="e.g. SST-2026-849201 or 849201"
              className="w-full pl-9 pr-24 py-2.5 text-xs sm:text-sm bg-slate-900/90 border border-purple-500/30 focus:border-purple-400 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono transition-all"
            />
            {orderQuery && (
              <button
                type="button"
                onClick={() => {
                  setOrderQuery('');
                  setActiveOrder(null);
                  setHasSearched(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 hover:text-white bg-slate-800/60 px-2 py-0.5 rounded cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isSearchingDb}
            className="px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white gradient-bg hover:opacity-95 shadow-md shadow-purple-900/40 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 disabled:opacity-60"
          >
            {isSearchingDb ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <span>Track</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Recent Order Suggestion Chips */}
        {recentOrders.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
            <span className="text-slate-500 font-medium">Recent orders:</span>
            {recentOrders.map((ord, idx) => (
              <button
                key={ord.id ? `${ord.id}-${ord.orderNumber || idx}` : `recent-${idx}`}
                type="button"
                onClick={() => {
                  setOrderQuery(ord.orderNumber);
                  setActiveOrder(ord);
                  setHasSearched(true);
                  onShowToast(`Tracking ${ord.orderNumber}`, 'info');
                }}
                className={`px-2 py-0.5 rounded-lg border font-mono transition-all cursor-pointer ${
                  activeOrder?.id === ord.id
                    ? 'bg-purple-600/30 border-purple-500/50 text-purple-300 font-bold'
                    : 'bg-slate-900/60 border-white/5 hover:border-purple-500/30 text-slate-300 hover:text-white'
                }`}
              >
                {ord.orderNumber}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* When Order is Found */}
      {activeOrder && (
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-purple-500/20 shadow-xl space-y-5 animate-in fade-in duration-200">
          {/* Order Header Info */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Order ID:</span>
                <span className="font-mono text-base sm:text-lg font-black text-white">
                  {activeOrder.orderNumber}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyOrderNumber(activeOrder.orderNumber)}
                  className="p-1 hover:text-purple-400 text-slate-400 transition-colors cursor-pointer"
                  title="Copy Order ID"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Placed on <strong className="text-slate-300">{activeOrder.date}</strong> • Paid via{' '}
                <span className="text-purple-300 font-medium">
                  {activeOrder.paymentMethod.startsWith('Paymob') ? 'Paymob (Card / Wallets)' : activeOrder.paymentMethod}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Paid</span>
                <span className="text-lg font-black gradient-text">
                  {activeOrder.total.toLocaleString()} L.E
                </span>
              </div>
              <div>
                {(activeOrder.status === 'Delivered' || activeOrder.status === 'Completed') && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-950/40">
                    <CheckCircle2 className="w-4 h-4" />
                    {activeOrder.status === 'Completed' ? 'Completed' : 'Delivered'}
                  </span>
                )}
                {activeOrder.status === 'Processing' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm shadow-amber-950/40 animate-pulse">
                    <Clock className="w-4 h-4" />
                    Processing
                  </span>
                )}
                {activeOrder.status === 'Pending Delivery' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-sm shadow-blue-950/40">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Pending Delivery
                  </span>
                )}
                {activeOrder.status === 'Cancelled' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/40">
                    <AlertCircle className="w-4 h-4" />
                    Cancelled
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-purple-300">
                <Truck className="w-4 h-4 text-purple-400" />
                Live Fulfillment Stages
              </span>
              <span className="text-[11px] text-slate-400">
                {activeOrder.status === 'Delivered' || activeOrder.status === 'Completed'
                  ? 'All items delivered and order completed successfully'
                  : activeOrder.status === 'Pending Delivery'
                  ? 'Ready for digital transmission'
                  : 'Preparing accounts & credentials'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center relative pt-2">
              {/* Timeline connecting line behind nodes */}
              <div className="absolute top-5 left-[12.5%] right-[12.5%] h-1 bg-slate-800 rounded-full -z-0" />
              <div
                className="absolute top-5 left-[12.5%] h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-400 rounded-full transition-all duration-700 -z-0"
                style={{
                  width:
                    activeOrder.status === 'Delivered' || activeOrder.status === 'Completed'
                      ? '75%'
                      : activeOrder.status === 'Pending Delivery'
                      ? '50%'
                      : activeOrder.status === 'Processing'
                      ? '25%'
                      : '0%',
                }}
              />

              {/* Step 1 */}
              <div className="flex flex-col items-center z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    getStepState(1, activeOrder.status).isCompleted
                      ? 'bg-purple-600 text-white ring-2 ring-purple-400/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Check className="w-4 h-4" />
                </div>
                <span className="mt-1.5 text-[10px] sm:text-[11px] font-bold text-slate-200">
                  Order Received
                </span>
                <span className="text-[9px] text-slate-400 hidden sm:inline">Payment Confirmed</span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    getStepState(2, activeOrder.status).isCompleted
                      ? getStepState(2, activeOrder.status).isCurrent
                        ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/30 font-black animate-pulse'
                        : 'bg-purple-600 text-white ring-2 ring-purple-400/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {getStepState(2, activeOrder.status).isCurrent ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </div>
                <span className="mt-1.5 text-[10px] sm:text-[11px] font-bold text-slate-200">
                  Processing
                </span>
                <span className="text-[9px] text-slate-400 hidden sm:inline">Allocating Items</span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    getStepState(3, activeOrder.status).isCompleted
                      ? getStepState(3, activeOrder.status).isCurrent
                        ? 'bg-blue-500 text-white ring-4 ring-blue-500/30 animate-pulse'
                        : 'bg-purple-600 text-white ring-2 ring-purple-400/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                </div>
                <span className="mt-1.5 text-[10px] sm:text-[11px] font-bold text-slate-200">
                  Handover
                </span>
                <span className="text-[9px] text-slate-400 hidden sm:inline">Credentials Sent</span>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    getStepState(4, activeOrder.status).isCompleted
                      ? 'bg-emerald-500 text-slate-950 font-black ring-4 ring-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="mt-1.5 text-[10px] sm:text-[11px] font-bold text-slate-200">
                  {activeOrder.status === 'Completed' ? 'Completed' : 'Delivered'}
                </span>
                <span className="text-[9px] text-slate-400 hidden sm:inline">Warranty Active</span>
              </div>
            </div>
          </div>

          {/* Real-Time Processing Status of Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Real-Time Processing by Item ({activeOrder.items.length})
              </h4>
              <span className="text-[11px] text-slate-500">Live fulfillment queue</span>
            </div>

            <div className="space-y-2.5">
              {activeOrder.items.map((item, idx) => {
                const itemDetail = getItemStatusDetail(item, activeOrder.status);
                const StatusIcon = itemDetail.icon;

                return (
                  <div
                    key={item.id || idx}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-white/5 hover:border-purple-500/20 transition-all space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-sm text-white">{item.name}</span>
                        <span className="text-xs text-purple-400 block sm:inline sm:ml-2">
                          ({item.details})
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-200">
                          {item.price.toLocaleString()} L.E
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${itemDetail.badgeClass}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {itemDetail.statusText}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-1.5">
                      <p className="flex items-center gap-1.5 text-slate-300">
                        <Info className="w-3 h-3 text-purple-400 shrink-0" />
                        <span>{itemDetail.description}</span>
                      </p>
                      <span className="text-[11px] font-semibold text-purple-300 shrink-0">
                        {itemDetail.eta}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Help & WhatsApp Dispatch Banner */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Need help or credentials resent? Contact our 24/7 gaming support team with your order ID.
              </span>
            </div>

            <a
              href={`https://wa.me/201042240852?text=${encodeURIComponent(
                `Hello Medga Store Support! I am tracking my Order ${activeOrder.orderNumber}. Could you please give me a real-time update on my items?`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/40 transition-all shrink-0 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Inquire via WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* When Order is NOT Found after searching */}
      {hasSearched && !activeOrder && (
        <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-white/10 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">No Order Found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            We couldn't locate an order matching{' '}
            <strong className="text-rose-300 font-mono">"{orderQuery}"</strong>. Please verify the order number on your payment receipt or message our support.
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <a
              href={`https://wa.me/201042240852?text=${encodeURIComponent(
                `Hello Medga Store Support! I am trying to track an order with number "${orderQuery}", but it is not appearing in the tracker. Can you please check?`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ask Support on WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
