import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
  Copy,
  ExternalLink,
  Package,
  Truck,
  ArrowRight,
  Star,
  Sparkles,
  LogOut,
  RotateCcw,
  ShoppingCart,
  Flame,
  Check,
} from 'lucide-react';
import { Order, OrderStatus, User } from '../types';
import { gamesData } from '../data/gamesData';
import { OrderTracker } from './OrderTracker';
import { deduplicateOrders } from '../lib/orderUtils';
import { OrderFeedbackModal } from './OrderFeedbackModal';
import { handleImageError } from '../utils/imageHelper';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  orders: Order[];
  onLogout?: () => void;
  onRequireLogin: () => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  initialTab?: 'tracker' | 'history' | 'reorder';
  initialOrderNumber?: string;
  onOpenReviewsModal?: () => void;
  onUpdateOrderStatus?: (orderId: string, newStatus: OrderStatus, orderNumber?: string) => void;
  onAddToCart?: (item: {
    name: string;
    details: string;
    price: number;
    category: 'game' | 'psplus' | 'vbucks' | 'rocket' | 'hezo' | 'bundle';
    icon?: string;
  }) => void;
  onBatchAddToCart?: (items: Array<{
    name: string;
    details: string;
    price: number;
    category: 'game' | 'psplus' | 'vbucks' | 'rocket' | 'hezo' | 'bundle';
    icon?: string;
  }>) => void;
  onOpenCart?: () => void;
}

export interface PastOrderedItem {
  key: string;
  name: string;
  details: string;
  lastPrice: number;
  currentPrice: number;
  orderCount: number;
  lastOrderDate: string;
  lastOrderNumber: string;
  category: 'game' | 'psplus' | 'vbucks' | 'rocket' | 'hezo' | 'bundle';
  isAvailable: boolean;
  stock?: number;
  availabilityStatus: string;
  badgeClass: string;
  image?: string;
}

export const checkItemAvailability = (
  itemName: string,
  itemDetails: string = '',
  itemPrice: number = 0
): {
  isAvailable: boolean;
  currentPrice: number;
  availabilityStatus: string;
  badgeClass: string;
  stock?: number;
  category: 'game' | 'psplus' | 'vbucks' | 'rocket' | 'hezo' | 'bundle';
  image?: string;
} => {
  const nameNorm = (itemName || '').toLowerCase().trim();
  const detailsNorm = (itemDetails || '').toLowerCase().trim();

  // 1. Check gamesData catalog
  const matchedGame = gamesData.find((g) => {
    const gName = g.name.toLowerCase().trim();
    return (
      gName === nameNorm ||
      nameNorm.includes(gName) ||
      gName.includes(nameNorm) ||
      (g.id && nameNorm.includes(g.id.replace(/_/g, ' ')))
    );
  });

  if (matchedGame) {
    let currentPrice = itemPrice;
    if (detailsNorm.includes('primary ps5') && matchedGame.prim5) {
      currentPrice = matchedGame.prim5;
    } else if (detailsNorm.includes('primary ps4') && matchedGame.prim4) {
      currentPrice = matchedGame.prim4;
    } else if (detailsNorm.includes('secondary') && matchedGame.sec) {
      currentPrice = matchedGame.sec;
    } else if (detailsNorm.includes('full') && matchedGame.full) {
      currentPrice = matchedGame.full;
    } else if (matchedGame.prim5) {
      currentPrice = matchedGame.prim5;
    }

    if (matchedGame.stock === 0) {
      return {
        isAvailable: false,
        currentPrice,
        availabilityStatus: 'Out of Stock',
        badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        stock: 0,
        category: 'game',
        image: matchedGame.image,
      };
    }

    if (typeof matchedGame.stock === 'number' && matchedGame.stock > 0 && matchedGame.stock <= 5) {
      return {
        isAvailable: true,
        currentPrice,
        availabilityStatus: `Low Stock (${matchedGame.stock} left)`,
        badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        stock: matchedGame.stock,
        category: 'game',
        image: matchedGame.image,
      };
    }

    return {
      isAvailable: true,
      currentPrice,
      availabilityStatus: 'In Stock & Ready',
      badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      stock: matchedGame.stock,
      category: 'game',
      image: matchedGame.image,
    };
  }

  // 2. PlayStation Plus
  if (
    nameNorm.includes('plus') ||
    nameNorm.includes('essential') ||
    nameNorm.includes('extra') ||
    nameNorm.includes('deluxe') ||
    detailsNorm.includes('essential') ||
    detailsNorm.includes('extra') ||
    detailsNorm.includes('deluxe')
  ) {
    return {
      isAvailable: true,
      currentPrice: itemPrice,
      availabilityStatus: 'Digital Account Delivery',
      badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      category: 'psplus',
    };
  }

  // 3. V-Bucks
  if (nameNorm.includes('v-bucks') || nameNorm.includes('vbucks') || nameNorm.includes('fortnite')) {
    return {
      isAvailable: true,
      currentPrice: itemPrice,
      availabilityStatus: 'Instant Transfer',
      badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      category: 'vbucks',
    };
  }

  // 4. Rocket League
  if (nameNorm.includes('rocket') || nameNorm.includes('credits')) {
    return {
      isAvailable: true,
      currentPrice: itemPrice,
      availabilityStatus: 'Instant Transfer',
      badgeClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      category: 'rocket',
    };
  }

  // 5. Hezo Boost
  if (nameNorm.includes('hezo') || nameNorm.includes('boost')) {
    return {
      isAvailable: true,
      currentPrice: itemPrice,
      availabilityStatus: 'Service Active',
      badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      category: 'hezo',
    };
  }

  // Fallback digital title
  return {
    isAvailable: true,
    currentPrice: itemPrice,
    availabilityStatus: 'In Stock & Ready',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    category: 'game',
  };
};

const DeliveryTracker: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const isCompletedOrDelivered = status === 'Completed' || status === 'Delivered';
  const steps = [
    { id: 1, label: 'Ordered', icon: ShoppingBag },
    { id: 2, label: 'Processing', icon: Clock },
    { id: 3, label: 'Being Delivered', icon: Truck },
    { id: 4, label: status === 'Completed' ? 'Completed' : 'Delivered', icon: CheckCircle2 },
  ];

  const currentStep =
    isCompletedOrDelivered
      ? 4
      : status === 'Pending Delivery'
      ? 3
      : status === 'Processing'
      ? 2
      : status === 'Cancelled'
      ? 0
      : 2;

  if (status === 'Cancelled') {
    return (
      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
        <span>This order was cancelled. If you believe this is an error, please contact support.</span>
      </div>
    );
  }

  // Calculate percentage between nodes
  const fillPercent = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="py-2 px-1 my-3 bg-slate-950/50 rounded-xl p-3 border border-white/5 space-y-3">
      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
        <span className="flex items-center gap-1.5 text-purple-300">
          <Truck className="w-3.5 h-3.5 text-purple-400" />
          Delivery Progress
        </span>
        <span className="text-slate-400">
          Stage {currentStep} of 4: <strong className={isCompletedOrDelivered ? 'text-emerald-400' : 'text-purple-300'}>{status === 'Completed' ? 'Completed' : steps[currentStep - 1]?.label || 'Processing'}</strong>
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="relative pt-1 pb-2">
        {/* Track Line Background */}
        <div className="absolute top-5 left-6 right-6 h-1 bg-slate-800 rounded-full z-0" />

        {/* Active Progress Line */}
        <div
          className="absolute top-5 left-6 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-emerald-400 rounded-full z-0 transition-all duration-500"
          style={{ width: `calc(${fillPercent}% * (100% - 3rem) / 100)` }}
        />

        {/* Step Nodes */}
        <div className="relative z-10 flex justify-between items-start">
          {steps.map((step) => {
            const Icon = step.icon;
            const isCompleted = step.id <= currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <div key={step.id} className="flex flex-col items-center text-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? isCurrent && step.id !== 4
                        ? 'bg-purple-600 text-white ring-4 ring-purple-500/30 shadow-lg shadow-purple-900/50 scale-110'
                        : step.id === 4
                        ? 'bg-emerald-500 text-slate-950 font-bold ring-4 ring-emerald-500/30 shadow-lg shadow-emerald-900/50'
                        : 'bg-purple-600 text-white'
                      : 'bg-slate-800 border border-slate-700 text-slate-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`mt-2 text-[10px] font-bold tracking-tight max-w-[70px] leading-tight ${
                    isCurrent
                      ? 'text-purple-300'
                      : isCompleted
                      ? 'text-slate-200'
                      : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
  user,
  orders,
  onLogout,
  onRequireLogin,
  onShowToast,
  initialTab,
  initialOrderNumber = '',
  onOpenReviewsModal,
  onUpdateOrderStatus,
  onAddToCart,
  onBatchAddToCart,
  onOpenCart,
}) => {
  const [activeTab, setActiveTab] = useState<'tracker' | 'history' | 'reorder'>(() => {
    if (initialTab) return initialTab;
    return user.isAuthenticated ? 'history' : 'tracker';
  });
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<string>(initialOrderNumber);
  const [searchTerm, setSearchTerm] = useState('');
  const [reorderSearchTerm, setReorderSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | OrderStatus>('All');
  const [feedbackOrder, setFeedbackOrder] = useState<Order | null>(null);

  // Scroll direction detection for the floating 'Reorder' button:
  // Disappears when scrolling DOWN, appears when scrolling UP!
  const [isReorderButtonVisible, setIsReorderButtonVisible] = useState(true);
  const lastScrollTopRef = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollTop = e.currentTarget.scrollTop;
    if (currentScrollTop <= 15) {
      setIsReorderButtonVisible(true);
    } else if (currentScrollTop > lastScrollTopRef.current + 6) {
      // User is scrolling down -> disappear
      setIsReorderButtonVisible(false);
    } else if (currentScrollTop < lastScrollTopRef.current - 6) {
      // User is scrolling up -> appear!
      setIsReorderButtonVisible(true);
    }
    lastScrollTopRef.current = currentScrollTop;
  };

  // Sync if initialOrderNumber changes
  React.useEffect(() => {
    if (initialOrderNumber) {
      setSelectedTrackingOrder(initialOrderNumber);
      setActiveTab('tracker');
    }
  }, [initialOrderNumber]);

  // Filter user specific orders - signed in users see their account orders, guests see orders placed in current browser
  const userOrders = useMemo(() => {
    const raw = user.isAuthenticated && user.email
      ? orders.filter(
          (o) =>
            o.userEmail.toLowerCase() === user.email.toLowerCase() ||
            (o.userEmail === '' && o.userName === user.name)
        )
      : orders;
    return deduplicateOrders(raw);
  }, [orders, user]);

  const filteredOrders = userOrders.filter((order) => {
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.details.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesStatus && matchesSearch;
  });

  // Extract all distinct items ordered across user's past purchases
  const allPastOrderedItems = useMemo<PastOrderedItem[]>(() => {
    const itemsMap = new Map<string, PastOrderedItem>();

    userOrders.forEach((order) => {
      order.items?.forEach((item) => {
        const key = `${(item.name || '').toLowerCase().trim()}___${(item.details || '').toLowerCase().trim()}`;
        const existing = itemsMap.get(key);

        const check = checkItemAvailability(item.name, item.details, item.price);

        if (existing) {
          existing.orderCount += 1;
        } else {
          itemsMap.set(key, {
            key,
            name: item.name,
            details: item.details,
            lastPrice: item.price,
            currentPrice: check.currentPrice || item.price,
            orderCount: 1,
            lastOrderDate: order.date,
            lastOrderNumber: order.orderNumber,
            category: check.category,
            isAvailable: check.isAvailable,
            stock: check.stock,
            availabilityStatus: check.availabilityStatus,
            badgeClass: check.badgeClass,
            image: check.image,
          });
        }
      });
    });

    return Array.from(itemsMap.values());
  }, [userOrders]);

  const filteredReorderItems = useMemo(() => {
    if (!reorderSearchTerm.trim()) return allPastOrderedItems;
    const term = reorderSearchTerm.toLowerCase();
    return allPastOrderedItems.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.details.toLowerCase().includes(term) ||
        item.lastOrderNumber.toLowerCase().includes(term)
    );
  }, [allPastOrderedItems, reorderSearchTerm]);

  const availablePastItemsCount = useMemo(
    () => allPastOrderedItems.filter((i) => i.isAvailable).length,
    [allPastOrderedItems]
  );
  const outOfStockPastItemsCount = useMemo(
    () => allPastOrderedItems.filter((i) => !i.isAvailable).length,
    [allPastOrderedItems]
  );

  // Handler: Reorder full order (all items from a past order)
  const handleReorderFullOrder = (order: Order) => {
    if (!order.items || order.items.length === 0) {
      onShowToast('This order has no items to reorder', 'error');
      return;
    }

    const availableToReorder: Array<{
      name: string;
      details: string;
      price: number;
      category: 'game' | 'psplus' | 'vbucks' | 'rocket' | 'hezo' | 'bundle';
      icon?: string;
    }> = [];
    const unavailableItems: string[] = [];

    order.items.forEach((item) => {
      const check = checkItemAvailability(item.name, item.details, item.price);
      if (check.isAvailable) {
        availableToReorder.push({
          name: item.name,
          details: item.details,
          price: check.currentPrice || item.price,
          category: check.category,
          icon: check.image,
        });
      } else {
        unavailableItems.push(item.name);
      }
    });

    if (availableToReorder.length === 0) {
      onShowToast(`Items in Order #${order.orderNumber} are currently out of stock.`, 'error');
      return;
    }

    if (onBatchAddToCart) {
      onBatchAddToCart(availableToReorder);
    } else if (onAddToCart) {
      availableToReorder.forEach((i) => onAddToCart(i));
    }

    if (unavailableItems.length > 0) {
      onShowToast(
        `Added ${availableToReorder.length} items from #${order.orderNumber} to cart (${unavailableItems.join(', ')} currently out of stock).`,
        'info'
      );
    } else {
      onShowToast(
        `Reordered all ${availableToReorder.length} items from Order #${order.orderNumber} into your active cart!`,
        'success'
      );
    }
  };

  // Handler: Reorder single item from "Everything You Ordered Before"
  const handleReorderSingleItem = (item: PastOrderedItem) => {
    const check = checkItemAvailability(item.name, item.details, item.currentPrice);
    if (!check.isAvailable) {
      onShowToast(`${item.name} is currently out of stock.`, 'error');
      return;
    }

    const payload = {
      name: item.name,
      details: item.details,
      price: check.currentPrice || item.currentPrice,
      category: check.category,
      icon: check.image,
    };

    if (onAddToCart) {
      onAddToCart(payload);
    } else if (onBatchAddToCart) {
      onBatchAddToCart([payload]);
    }
    onShowToast(`Reordered ${item.name} into your active cart!`, 'success');
  };

  // Handler: Reorder all available items from "Everything You Ordered Before"
  const handleReorderAllAvailable = () => {
    const availableItems = allPastOrderedItems.filter((i) => i.isAvailable);
    if (availableItems.length === 0) {
      onShowToast('No items are currently available to reorder.', 'error');
      return;
    }

    const cartPayload = availableItems.map((i) => ({
      name: i.name,
      details: i.details,
      price: i.currentPrice,
      category: i.category,
      icon: i.image,
    }));

    if (onBatchAddToCart) {
      onBatchAddToCart(cartPayload);
    } else if (onAddToCart) {
      cartPayload.forEach((i) => onAddToCart(i));
    }

    onShowToast(
      `Reordered all ${availableItems.length} available items from your past orders into your active cart!`,
      'success'
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    onShowToast(`Copied Order ID: ${text}`, 'info');
  };

  const handleTrackSpecificOrder = (orderNum: string) => {
    setSelectedTrackingOrder(orderNum);
    setActiveTab('tracker');
    onShowToast(`Tracking Order ${orderNum}`, 'info');
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-950/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Completed
          </span>
        );
      case 'Delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Delivered
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            Processing
          </span>
        );
      case 'Pending Delivery':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Pending Delivery
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="border-b border-white/10 bg-[#151525]">
          <div className="flex items-center justify-between p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl gradient-bg text-white shadow-lg shadow-purple-900/40">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  Order Center & Fulfillment
                </h2>
                <p className="text-xs text-slate-400">
                  {user.isAuthenticated
                    ? `Account: ${user.email || user.name}`
                    : 'Track orders in real-time or log in to view past purchases'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user.isAuthenticated && onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                  title="Log Out"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Log Out</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center px-4 sm:px-5 gap-2 border-t border-white/5 bg-[#121220] py-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('tracker')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'tracker'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Truck className="w-4 h-4 text-purple-300" />
              <span>Live Order Tracker</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>My Orders</span>
              {userOrders.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 border border-white/10 text-purple-300 font-mono">
                  {userOrders.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reorder')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'reorder'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40'
                  : 'text-purple-300 hover:text-white hover:bg-purple-950/40 border border-purple-500/20'
              }`}
            >
              <RotateCcw className="w-4 h-4 text-purple-300" />
              <span>Reorder</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-200 font-mono">
                {allPastOrderedItems.length}
              </span>
            </button>
          </div>
        </div>

        {/* Modal Tab Content */}
        {activeTab === 'tracker' ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            <OrderTracker
              orders={orders}
              initialOrderNumber={selectedTrackingOrder}
              onShowToast={onShowToast}
            />
          </div>
        ) : activeTab === 'reorder' ? (
          /* Reorder Tab: Everything You Ordered Before */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
            {/* Header banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-950/60 via-indigo-950/40 to-slate-900 border border-purple-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 shadow-lg shadow-purple-900/40">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <span>Everything You Ordered Before</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {allPastOrderedItems.length} Products
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300">
                      Real-time inventory and catalog pricing are automatically checked. Quickly reorder any game or pack back into your active cart.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReorderAllAvailable}
                    disabled={availablePastItemsCount === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-950/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4 text-slate-950" />
                    <span>Reorder All Available ({availablePastItemsCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-white/10 transition-colors cursor-pointer"
                  >
                    View Orders List
                  </button>
                </div>
              </div>

              {/* Summary Stats Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 text-xs">
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Total Past Items</span>
                  <span className="font-bold text-slate-200">{allPastOrderedItems.length} items</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 block">In Stock & Ready</span>
                  <span className="font-bold text-emerald-400">{availablePastItemsCount} available</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Stock Unavailable</span>
                  <span className="font-bold text-rose-400">{outOfStockPastItemsCount} out of stock</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Quick Checkout</span>
                  {onOpenCart ? (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenCart();
                      }}
                      className="text-purple-400 hover:text-purple-300 font-bold underline cursor-pointer text-xs"
                    >
                      Open Active Cart &rarr;
                    </button>
                  ) : (
                    <span className="text-purple-300 font-bold">Ready in Cart</span>
                  )}
                </div>
              </div>
            </div>

            {/* Search within past ordered items */}
            {allPastOrderedItems.length > 2 && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={reorderSearchTerm}
                  onChange={(e) => setReorderSearchTerm(e.target.value)}
                  placeholder="Search within previous purchases..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900/80 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            )}

            {/* List of Previous Items */}
            {filteredReorderItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center">
                <RotateCcw className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-base font-semibold text-slate-300">
                  {reorderSearchTerm ? 'No matching past items found' : 'No previous items found'}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  {reorderSearchTerm
                    ? 'Try changing your search keywords'
                    : 'Once you complete your gaming orders, every unique game and package you purchased will appear here for instant 1-click reordering.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredReorderItems.map((item) => (
                  <div
                    key={item.key}
                    className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 hover:border-purple-500/30 transition-all flex flex-col justify-between space-y-3 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      {item.image ? (
                        <img
                          src={item.image}
                          onError={handleImageError}
                          alt={item.name}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-white/10 shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-purple-950/50 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-100 truncate">{item.name}</h4>
                          <span className="text-sm font-black text-white shrink-0">
                            {item.currentPrice.toLocaleString()} L.E
                          </span>
                        </div>
                        <p className="text-xs text-purple-400 font-medium truncate">{item.details}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.badgeClass}`}>
                            {item.isAvailable ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <AlertCircle className="w-3 h-3" />
                            )}
                            <span>{item.availabilityStatus}</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Ordered {item.orderCount}x • Last: {item.lastOrderDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
                      <span className="text-[11px] text-slate-400">
                        From order: <strong className="text-slate-300 font-mono">{item.lastOrderNumber}</strong>
                      </span>
                      <button
                        type="button"
                        disabled={!item.isAvailable}
                        onClick={() => handleReorderSingleItem(item)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          item.isAvailable
                            ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/40 active:scale-95'
                            : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{item.isAvailable ? 'Reorder' : 'Out of Stock'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Order History Tab */
          !user.isAuthenticated ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-950/50 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-2">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Sign In Required</h3>
              <p className="text-sm text-slate-400 max-w-md">
                Please log in to your account to view your full history of past purchases. Or use our Live Order Tracker to inspect any order by confirmation ID.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                <button
                  onClick={() => {
                    onClose();
                    onRequireLogin();
                  }}
                  className="px-6 py-2.5 rounded-xl font-bold text-white gradient-bg hover:opacity-90 shadow-lg shadow-purple-900/40 transition-all cursor-pointer"
                >
                  Sign In to View Orders
                </button>
                <button
                  onClick={() => setActiveTab('tracker')}
                  className="px-5 py-2.5 rounded-xl font-bold text-purple-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-purple-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Truck className="w-4 h-4 text-purple-400" />
                  Use Order Tracker
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Filter & Search Header */}
              <div className="p-4 border-b border-white/5 bg-[#121220] flex flex-col sm:flex-row gap-3 items-center justify-between">
                {/* Search input */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search order ID or game..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900/80 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                {/* Status Filter Tabs & Reviews Link */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap mr-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Realtime Sync</span>
                  </div>
                  {(['All', 'Processing', 'Completed', 'Delivered', 'Pending Delivery'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        statusFilter === filter
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                  {onOpenReviewsModal && (
                    <button
                      type="button"
                      onClick={onOpenReviewsModal}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>Community Reviews</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Orders List Area */}
              <div className="flex-1 flex flex-col relative overflow-hidden">
                <div
                  ref={scrollContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar pb-24"
                >
                {filteredOrders.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 flex flex-col items-center">
                    <Package className="w-12 h-12 text-slate-600 mb-3" />
                    <p className="text-base font-semibold text-slate-300">No orders found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {searchTerm || statusFilter !== 'All'
                        ? 'Try adjusting your search or status filter'
                        : 'You have not placed any orders yet. Explore our games and packages!'}
                    </p>
                  </div>
                ) : (
                  filteredOrders.map((order, idx) => {
                    const isCompleted = order.status === 'Completed' || order.status === 'Delivered';
                    const itemKey = order.id ? `${order.id}-${order.orderNumber || idx}` : `order-${order.orderNumber || idx}`;
                    return (
                    <div
                      key={itemKey}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-purple-500/30 transition-all space-y-4"
                    >
                      {/* Order Top Line */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/5 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-200 text-sm">
                            {order.orderNumber}
                          </span>
                          <button
                            onClick={() => copyToClipboard(order.orderNumber)}
                            className="p-1 hover:text-purple-400 text-slate-500 transition-colors cursor-pointer"
                            title="Copy Order Number"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 border border-white/10 text-slate-300 font-medium">
                            {order.paymentMethod.startsWith('Paymob') ? '💳 Paymob' : order.paymentMethod}
                          </span>
                          <span className="text-slate-400">{order.date}</span>
                          {getStatusBadge(order.status)}
                        </div>
                      </div>

                      {/* Order Items List */}
                      <div className="space-y-2.5">
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm py-1 px-2 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <div>
                              <span className="font-bold text-slate-200">{item.name}</span>
                              <span className="text-xs text-purple-400 block sm:inline sm:ml-2">
                                ({item.details})
                              </span>
                            </div>
                            <span className="font-semibold text-slate-300">
                              {item.price.toLocaleString()} L.E
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Delivery Progress Step-Tracker */}
                      <DeliveryTracker status={order.status} />

                      {/* Order Rating Feature: Appears when order status is Completed (or Delivered) */}
                      {isCompleted && (
                        <div className="pt-1">
                          {order.rating ? (
                            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    Your Rating: {order.rating} / 5 Stars
                                  </span>
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <Star
                                        key={s}
                                        className={`w-3 h-3 ${
                                          s <= (order.rating || 0)
                                            ? 'fill-amber-400 text-amber-400'
                                            : 'text-slate-600'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                                    Verified Rating
                                  </span>
                                </div>
                                {order.ratingComment && (
                                  <p className="text-xs text-slate-300 italic">
                                    &ldquo;{order.ratingComment}&rdquo;
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => setFeedbackOrder(order)}
                                className="self-start sm:self-auto text-xs font-bold text-amber-300 hover:text-amber-200 underline cursor-pointer"
                              >
                                Edit Rating
                              </button>
                            </div>
                          ) : (
                            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-purple-900/20 to-slate-900/60 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-sm shadow-amber-500/20">
                                  <Star className="w-4 h-4 fill-amber-400" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-white">Order Rating</span>
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-950">
                                      +25 Pts
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-300">
                                    Your order is {order.status}! Leave a 1–5 star rating and a short comment for your purchase.
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setFeedbackOrder(order)}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-md shadow-amber-950/40 transition-all cursor-pointer whitespace-nowrap active:scale-95"
                              >
                                <Star className="w-3.5 h-3.5 fill-slate-950" />
                                <span>Leave Rating</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Order Bottom Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5 bg-slate-950/40 -mx-4 -mb-4 p-4 rounded-b-2xl">
                        <div>
                          <span className="text-xs text-slate-400 block">Total Amount</span>
                          <span className="text-base font-black gradient-text">
                            {order.total.toLocaleString()} L.E
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Reorder Button for this specific order */}
                          <button
                            type="button"
                            onClick={() => handleReorderFullOrder(order)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all cursor-pointer shadow-sm active:scale-95"
                            title="Reorder all available items from this order into your cart"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Reorder</span>
                          </button>

                          {isCompleted ? (
                            <button
                              type="button"
                              onClick={() => setFeedbackOrder(order)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-md shadow-amber-950/40 transition-all cursor-pointer animate-in fade-in"
                            >
                              <Star className="w-3.5 h-3.5 fill-slate-950" />
                              <span>{order.rating ? 'Edit Rating' : 'Order Rating'}</span>
                            </button>
                          ) : (
                            onUpdateOrderStatus && (
                              <button
                                type="button"
                                onClick={() => onUpdateOrderStatus(order.id, 'Completed', order.orderNumber)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-emerald-300/85 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 transition-colors cursor-pointer"
                                title="Simulate Google Sheet or Backend updating order to Completed"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Set to Completed (Live Test)</span>
                              </button>
                            )
                          )}
                          <button
                            type="button"
                            onClick={() => handleTrackSpecificOrder(order.orderNumber)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition-all cursor-pointer"
                          >
                            <Truck className="w-3.5 h-3.5 text-purple-400" />
                            <span>Track Real-Time Status</span>
                          </button>
                          <a
                            href={`https://wa.me/201042240852?text=${encodeURIComponent(
                              `Hello Medga Store support! I am inquiring about my Order ${order.orderNumber}. Status: ${order.status}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>WhatsApp Support</span>
                          </a>
                        </div>
                      </div>
                    </div>
                    );
                  })
                )}
                </div>

                {/* Floating 'Reorder' Button - Disappears when scrolling down, appears when scrolling up */}
                {userOrders.length > 0 && (
                  <div
                    className={`absolute bottom-5 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ease-out transform pointer-events-none ${
                      isReorderButtonVisible
                        ? 'translate-y-0 opacity-100 scale-100'
                        : 'translate-y-16 opacity-0 scale-95'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveTab('reorder')}
                      className="pointer-events-auto flex items-center gap-2.5 px-5 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs shadow-2xl shadow-purple-950/90 border border-white/25 hover:border-white/50 active:scale-95 transition-all cursor-pointer group"
                      title="View everything you ordered before and reorder items"
                    >
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                        <RotateCcw className="w-3.5 h-3.5 text-white group-hover:-rotate-45 transition-transform" />
                      </div>
                      <span className="text-sm font-black tracking-wide">Reorder</span>
                      <span className="hidden sm:inline-block text-[11px] font-semibold text-purple-200 border-l border-white/20 pl-2">
                        Everything You Ordered Before
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                        {allPastOrderedItems.length} items
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-purple-200 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                )}
              </div>
            </>
          )
        )}
      </div>

      {/* Order Feedback & Star Rating Modal */}
      <OrderFeedbackModal
        isOpen={!!feedbackOrder}
        onClose={() => setFeedbackOrder(null)}
        order={feedbackOrder}
        user={user}
        onSuccess={(rating, comment) => {
          if (feedbackOrder) {
            feedbackOrder.rating = rating;
            feedbackOrder.ratingComment = comment;
            feedbackOrder.ratedAt = new Date().toISOString();
          }
          onShowToast('Order Rating saved! Thank you for rating your order (+25 reward points earned).', 'success');
        }}
        onShowToast={onShowToast}
      />
    </div>
  );
};
