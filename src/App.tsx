import React, { useState, useEffect } from 'react';
import { CartItem, User, ToastMessage, ToastType, Order, WishlistItem } from './types';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { BundlesSection } from './components/BundlesSection';
import { GamesSection } from './components/GamesSection';
import { PSPlusSection } from './components/PSPlusSection';
import { VBucksSection } from './components/VBucksSection';
import { RocketSection } from './components/RocketSection';
import { HezoSection } from './components/HezoSection';
import { PaymentSection } from './components/PaymentSection';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { OrderHistoryModal } from './components/OrderHistoryModal';
import { ProductSearchModal } from './components/ProductSearchModal';
import { WishlistModal } from './components/WishlistModal';
import { EditionComparisonModal } from './components/EditionComparisonModal';
import { Toast } from './components/Toast';
import { Footer } from './components/Footer';
import { ChatWidget } from './components/ChatWidget';
import { WebsiteCheckoutModal } from './components/WebsiteCheckoutModal';
import { OwnerIntegrationsModal } from './components/OwnerIntegrationsModal';
import { ReviewsModal } from './components/ReviewsModal';
import { SuggestGameModal } from './components/SuggestGameModal';
import { RewardPointsModal } from './components/RewardPointsModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { useWishlist } from './hooks/useWishlist';
import { useRewardPoints } from './hooks/useRewardPoints';
import { calculatePurchasePoints } from './lib/pointsUtils';
import { generateOrderId, saveOrderToBackend, fetchOrdersFromBackend, subscribeToOrders, updateOrderStatus, deduplicateOrders } from './lib/orderUtils';
import { gamesData } from './data/gamesData';

export default function App() {
  // Cart State with LocalStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('prososka_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // User Auth State
  const [user, setUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem('prososka_user');
      return saved ? JSON.parse(saved) : { name: 'Guest', email: '', isAuthenticated: false };
    } catch {
      return { name: 'Guest', email: '', isAuthenticated: false };
    }
  });

  // Real Orders State - only authentic user-placed orders, no mock or demo data
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('prososka_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Clean out any legacy mock or test orders and deduplicate
          const cleaned = parsed.filter(
            (o) =>
              !o.id?.startsWith('ord-101') &&
              !o.id?.startsWith('ord-102') &&
              !o.orderNumber?.startsWith('ORD-') &&
              !o.orderNumber?.includes('TEST')
          );
          return deduplicateOrders(cleaned);
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // Modals & Drawers
  const [cartOpen, setCartOpen] = useState(false);
  const [websiteCheckoutOpen, setWebsiteCheckoutOpen] = useState(false);
  const [ownerIntegrationsOpen, setOwnerIntegrationsOpen] = useState(false);
  const [liveChatOpen, setLiveChatOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [ordersInitialTab, setOrdersInitialTab] = useState<'tracker' | 'history'>('tracker');
  const [ordersInitialNumber, setOrdersInitialNumber] = useState<string>('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [comparisonGameId, setComparisonGameId] = useState<string>('fc27');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Customer Reviews & Community Feedback Modals
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [reviewsTarget, setReviewsTarget] = useState<{ productId?: string; productTitle?: string }>({});

  // Suggest a Game or Service Modal (+50 Points)
  const [suggestOpen, setSuggestOpen] = useState(false);

  // Loyalty & Reward Points Modal
  const [pointsOpen, setPointsOpen] = useState(false);

  // Reward Points Hook
  const { points: rewardPointsBalance, earnPoints } = useRewardPoints(user);

  // Real-time Firebase & backend listener for order statuses
  useEffect(() => {
    // 1. Initial snapshot from backend
    fetchOrdersFromBackend()
      .then((backendOrders) => {
        if (backendOrders && backendOrders.length > 0) {
          setOrders((prev) => deduplicateOrders([...backendOrders, ...prev]));
        }
      })
      .catch((e) => console.warn('Orders initial sync warning:', e));

    // 2. Real-time Firebase and backend SSE listeners
    const unsubscribe = subscribeToOrders((liveOrders) => {
      setOrders((prev) => {
        // Detect transitions to 'Completed' and notify user live
        liveOrders.forEach((newOrd) => {
          const oldOrd = prev.find((o) => o.orderNumber === newOrd.orderNumber || o.id === newOrd.id);
          if (oldOrd && oldOrd.status !== 'Completed' && newOrd.status === 'Completed') {
            showToast(
              `Order #${newOrd.orderNumber} is now Completed! You can now rate your purchase.`,
              'success'
            );
          }
        });

        // Merge orders safely eliminating any duplicate keys
        return deduplicateOrders([...liveOrders, ...prev]);
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Wishlist State Hook
  const { wishlist, isWishlisted, toggleWishlist, removeFromWishlist, clearWishlist } = useWishlist();

  // Price drop & sale notification for wishlist items (without promotional UI text)
  useEffect(() => {
    if (!wishlist || wishlist.length === 0) return;

    try {
      const notifiedKey = 'seen_notified_wishlist_sales';
      const notifiedRaw = sessionStorage.getItem(notifiedKey) || '{}';
      const notifiedMap = JSON.parse(notifiedRaw);

      wishlist.forEach((wItem) => {
        const rawId = wItem.productId?.replace('game-', '') || wItem.id?.replace('game-', '');
        const matchedGame = gamesData.find(
          (g) => g.id === rawId || g.name.toLowerCase() === wItem.name.toLowerCase()
        );
        if (matchedGame) {
          const currentPrice = matchedGame.prim5 || matchedGame.sec || wItem.price;
          const isSale = matchedGame.isOffer || (wItem.price > 0 && currentPrice < wItem.price);

          if (isSale && !notifiedMap[matchedGame.id]) {
            notifiedMap[matchedGame.id] = Date.now();
            sessionStorage.setItem(notifiedKey, JSON.stringify(notifiedMap));

            showToast(
              `🔔 Wishlist Alert: ${matchedGame.name} is on sale for ${currentPrice} L.E!`,
              'info'
            );

            if (
              typeof window !== 'undefined' &&
              'Notification' in window &&
              Notification.permission === 'granted'
            ) {
              try {
                new Notification('Medga Store Wishlist Alert', {
                  body: `${matchedGame.name} in your wishlist is now on sale for ${currentPrice} L.E!`,
                  icon: matchedGame.image || undefined,
                });
              } catch (e) {}
            }
          }
        }
      });
    } catch (e) {
      console.warn('Wishlist check error:', e);
    }
  }, [wishlist]);

  // Navigation & Support Tabs
  const [chatTab, setChatTab] = useState<'chat' | 'owner' | 'ticket'>('chat');
  const [activeCategory, setActiveCategory] = useState<string>('games');

  // Helper to determine if user has previously ordered from a category (for Best Deal perks)
  const hasOrderedCategory = (category: 'game' | 'psplus' | 'vbucks' | 'rocket' | 'hezo'): boolean => {
    if (!orders || orders.length === 0) return false;
    return orders.some((order) => {
      return order.items?.some((item) => {
        const nameLower = (item.name || '').toLowerCase();
        const detailsLower = (item.details || '').toLowerCase();
        if (category === 'game') {
          return (
            nameLower.includes('fc') ||
            nameLower.includes('gta') ||
            nameLower.includes('spider') ||
            nameLower.includes('game') ||
            nameLower.includes('takes two') ||
            nameLower.includes('rdr') ||
            detailsLower.includes('account') ||
            detailsLower.includes('ps5') ||
            detailsLower.includes('ps4')
          );
        }
        if (category === 'psplus') {
          return (
            nameLower.includes('plus') ||
            detailsLower.includes('plus') ||
            detailsLower.includes('essential') ||
            detailsLower.includes('extra') ||
            detailsLower.includes('deluxe')
          );
        }
        if (category === 'vbucks') {
          return nameLower.includes('v-bucks') || nameLower.includes('vbucks') || detailsLower.includes('fortnite');
        }
        if (category === 'rocket') {
          return nameLower.includes('rocket') || nameLower.includes('credits');
        }
        if (category === 'hezo') {
          return nameLower.includes('hezo') || nameLower.includes('boost');
        }
        return false;
      });
    });
  };

  const handleOpenComparison = (gameId?: unknown) => {
    if (typeof gameId === 'string' && gameId.trim().length > 0) {
      setComparisonGameId(gameId.trim());
    } else {
      setComparisonGameId('fc27');
    }
    setComparisonOpen(true);
  };

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem('prososka_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('prososka_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('prososka_orders', JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  // Global Points side notification listener
  useEffect(() => {
    const handlePointsGained = (e: Event) => {
      const customEvt = e as CustomEvent<{ points: number; description?: string }>;
      const { points } = customEvt.detail || {};
      if (points && points > 0) {
        showToast(`✨ Gained ${points.toLocaleString()} points`, 'points');
      }
    };
    window.addEventListener('sst_points_gained', handlePointsGained);
    return () => window.removeEventListener('sst_points_gained', handlePointsGained);
  }, []);

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddToCart = (item: {
    name: string;
    details: string;
    price: number;
    category: 'game' | 'psplus' | 'vbucks' | 'rocket' | 'hezo' | 'bundle';
    icon?: string;
    image?: string;
  }) => {
    const cartId = Date.now().toString() + Math.random().toString().slice(2, 5);
    const newCartItem: CartItem = {
      cartId,
      ...item,
    };

    setCart((prev) => [...prev, newCartItem]);
    showToast(`Added ${item.name} to cart!`, 'success');
  };

  const handleBatchAddToCart = (
    items: Array<{
      name: string;
      details: string;
      price: number;
      category: 'game' | 'psplus' | 'vbucks' | 'rocket' | 'hezo' | 'bundle';
      icon?: string;
      image?: string;
    }>
  ) => {
    if (!items || items.length === 0) return;
    const newCartItems: CartItem[] = items.map((item, idx) => ({
      cartId: `${Date.now()}_${idx}_${Math.random().toString().slice(2, 6)}`,
      ...item,
    }));
    setCart((prev) => [...prev, ...newCartItems]);
    showToast(
      `Reordered ${items.length} ${items.length === 1 ? 'item' : 'items'} into your cart!`,
      'success'
    );
  };

  const handleRemoveFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((i) => i.cartId !== cartId));
    showToast('Item removed from cart', 'info');
  };

  const handleClearCart = () => {
    setCart([]);
    showToast('Cart cleared', 'info');
  };

  const handleToggleWishlist = (item: Omit<WishlistItem, 'addedAt'>) => {
    const wasAdded = toggleWishlist(item);
    if (wasAdded) {
      showToast(`Added ${item.name} to your wishlist!`, 'success');
    } else {
      showToast(`Removed ${item.name} from your wishlist`, 'info');
    }
  };

  const handleCheckoutSuccess = (
    items: CartItem[],
    total: number,
    paymentMethod: string,
    customerPhone?: string,
    customerName?: string,
    gameAccountEmail?: string,
    gameAccountPassword?: string
  ) => {
    const orderNum = generateOrderId();
    const nowStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });

    const newOrder: Order = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      orderNumber: orderNum,
      userEmail: user.isAuthenticated ? user.email : (gameAccountEmail || 'customer@medgastore.com'),
      userName: customerName?.trim() || (user.isAuthenticated ? user.name : 'Customer'),
      customerPhone: customerPhone?.trim() || '',
      gameAccountEmail: gameAccountEmail?.trim(),
      gameAccountPassword: gameAccountPassword?.trim(),
      date: nowStr,
      items: items.map((i, idx) => ({
        id: `item-${idx}-${Date.now()}`,
        name: i.name,
        details: i.details,
        price: i.price,
        category: i.category,
      })),
      total,
      status: 'Processing',
      paymentMethod,
      channel: 'whatsapp',
      createdAt: new Date().toISOString(),
    };

    saveOrderToBackend(newOrder).catch((e) => console.warn(e));

    // Award loyalty points for this purchase
    const earnedPoints = newOrder.items.reduce((sum, itm) => {
      return sum + calculatePurchasePoints(itm.price, itm.category, itm.name);
    }, 0);
    if (earnedPoints > 0) {
      earnPoints(
        earnedPoints,
        'purchase',
        `Order ${orderNum} Purchase Reward`
      ).catch((e) => console.warn(e));
    }

    setOrders((prev) => deduplicateOrders([newOrder, ...prev]));
    setCart([]);
    setCartOpen(false);
    setOrdersInitialTab('tracker');
    setOrdersInitialNumber(orderNum);
    showToast(
      `Order ${orderNum} placed! ${earnedPoints > 0 ? `+${earnedPoints.toLocaleString()} Points earned! 💎` : ''}`,
      'success'
    );
  };

  const handleLoginSuccess = (newUser: User) => {
    setUser(newUser);
    try {
      localStorage.setItem('prososka_user', JSON.stringify(newUser));
    } catch {}
  };

  const handleLogout = () => {
    const guestUser = { name: 'Guest', email: '', isAuthenticated: false };
    setUser(guestUser);
    try {
      localStorage.removeItem('prososka_user');
    } catch {}
    setOrdersOpen(false);
    showToast('Signed out successfully', 'info');
  };

  return (
    <div className="min-h-screen relative bg-[#0a0a12] text-slate-100 selection:bg-purple-500 selection:text-white pb-20 sm:pb-0">
      {/* Animated Glowing Background */}
      <div className="bg-animation" />

      {/* Navigation */}
      <Navbar
        cartCount={cart.length}
        onOpenCart={() => setCartOpen(true)}
        wishlistCount={wishlist.length}
        onOpenWishlist={() => setWishlistOpen(true)}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setAuthOpen(true);
        }}
        onOpenOrders={() => setOrdersOpen(true)}
        onOpenComparison={handleOpenComparison}
        onOpenLiveChat={() => {
          setChatTab('chat');
          setLiveChatOpen(true);
        }}
        onOpenContactOwner={() => {
          setChatTab('owner');
          setLiveChatOpen(true);
        }}
        onOpenRewardPoints={() => setPointsOpen(true)}
        rewardPointsBalance={rewardPointsBalance}
        onOpenReviews={() => {
          setReviewsTarget({});
          setReviewsOpen(true);
        }}
        user={user}
        onLogout={handleLogout}
        activeCategory={activeCategory}
        onSelectCategory={(cat) => setActiveCategory(cat)}
      />

      {/* Main Sections */}
      <main>
        <Hero />

        <BundlesSection
          onAddToCart={handleAddToCart}
          onInstantBuy={(item) => {
            handleAddToCart(item);
            setWebsiteCheckoutOpen(true);
          }}
          isWishlisted={isWishlisted}
          onToggleWishlist={handleToggleWishlist}
        />
        <GamesSection
          onAddToCart={handleAddToCart}
          onInstantBuy={(item) => {
            handleAddToCart(item);
            setWebsiteCheckoutOpen(true);
          }}
          isWishlisted={isWishlisted}
          onToggleWishlist={handleToggleWishlist}
          hasOrderedCategory={hasOrderedCategory}
          onOpenEditionComparison={handleOpenComparison}
          onOpenReviewsModal={(productId, productTitle) => {
            setReviewsTarget({ productId, productTitle });
            setReviewsOpen(true);
          }}
          onOpenSuggestModal={() => setSuggestOpen(true)}
          onOpenSearchModal={() => setSearchOpen(true)}
          orders={orders}
        />
        <PSPlusSection
          onAddToCart={handleAddToCart}
          isWishlisted={isWishlisted}
          onToggleWishlist={handleToggleWishlist}
          hasOrderedCategory={hasOrderedCategory}
        />
        <VBucksSection
          onAddToCart={handleAddToCart}
          onShowToast={showToast}
          isWishlisted={isWishlisted}
          onToggleWishlist={handleToggleWishlist}
          hasOrderedCategory={hasOrderedCategory}
        />
        <RocketSection
          onAddToCart={handleAddToCart}
          onShowToast={showToast}
          isWishlisted={isWishlisted}
          onToggleWishlist={handleToggleWishlist}
        />
        <HezoSection onAddToCart={handleAddToCart} />
        <PaymentSection onShowToast={showToast} />
      </main>

      {/* Footer */}
      <Footer
        onOpenChat={() => setLiveChatOpen(true)}
        onOpenOwnerPortal={() => setOwnerIntegrationsOpen(true)}
      />

      {/* Modals & Overlays */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onCheckoutSuccess={handleCheckoutSuccess}
        onOpenWebsiteCheckout={() => {
          setCartOpen(false);
          setWebsiteCheckoutOpen(true);
        }}
      />

      {/* Website Direct Checkout with Screenshots & Paymob */}
      <WebsiteCheckoutModal
        isOpen={websiteCheckoutOpen}
        onClose={() => setWebsiteCheckoutOpen(false)}
        cart={cart}
        user={user}
        onLoginSuccess={handleLoginSuccess}
        onOpenAuthModal={() => setAuthOpen(true)}
        onOrderPlaced={(newOrder) => {
          // Award loyalty points for this purchase
          const earnedPoints = newOrder.items.reduce((sum, itm) => {
            return sum + calculatePurchasePoints(itm.price, (itm.category as any) || 'game');
          }, 0);
          if (earnedPoints > 0) {
            earnPoints(
              earnedPoints,
              'purchase',
              `Order ${newOrder.orderNumber} Purchase Reward`
            ).catch((e) => console.warn(e));
          }

          setOrders((prev) => deduplicateOrders([newOrder, ...prev]));
          setCart([]);
          setWebsiteCheckoutOpen(false);
          setCartOpen(false);
          setOrdersInitialTab('tracker');
          setOrdersInitialNumber(newOrder.orderNumber);
          setOrdersOpen(true);
        }}
        onShowToast={showToast}
        onOpenWhatsAppCheckout={() => {
          setWebsiteCheckoutOpen(false);
          setCartOpen(true);
        }}
      />

      {/* Store Owner Integrations: Paymob Gateway & Google Sheets Live Sync */}
      <OwnerIntegrationsModal
        isOpen={ownerIntegrationsOpen}
        onClose={() => setOwnerIntegrationsOpen(false)}
        onShowToast={showToast}
      />

      {/* Customer Reviews & Ratings Modal */}
      <ReviewsModal
        isOpen={reviewsOpen}
        onClose={() => setReviewsOpen(false)}
        productId={reviewsTarget.productId}
        productTitle={reviewsTarget.productTitle}
        onOpenFeedback={() => {
          setReviewsOpen(false);
          setOrdersInitialTab('history');
          setOrdersOpen(true);
        }}
      />

      {/* Suggest a Game or Service Modal (+50 Points) */}
      <SuggestGameModal
        isOpen={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        user={user}
        onShowToast={showToast}
      />

      {/* Points Guide & Balance Modal */}
      <RewardPointsModal
        isOpen={pointsOpen}
        onClose={() => setPointsOpen(false)}
        user={user}
        onShowToast={showToast}
        onOpenAuth={() => {
          setAuthMode('login');
          setAuthOpen(true);
        }}
        onOpenSuggestModal={() => {
          setPointsOpen(false);
          setSuggestOpen(true);
        }}
        onOpenReviewsModal={() => {
          setPointsOpen(false);
          setReviewsTarget({});
          setReviewsOpen(true);
        }}
        onOpenOrdersModal={() => {
          setPointsOpen(false);
          setOrdersOpen(true);
        }}
        onOpenCart={() => {
          setPointsOpen(false);
          setCartOpen(true);
        }}
      />

      <WishlistModal
        isOpen={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        wishlist={wishlist}
        onRemoveItem={(id) => {
          removeFromWishlist(id);
          showToast('Item removed from wishlist', 'info');
        }}
        onClearWishlist={() => {
          clearWishlist();
          showToast('Wishlist cleared', 'info');
        }}
        onAddToCart={handleAddToCart}
        onShowToast={showToast}
        onNavigateToCategory={(cat) => {
          setActiveCategory(cat);
          setWishlistOpen(false);
          const el = document.getElementById(cat);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      <EditionComparisonModal
        isOpen={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
        initialGameId={comparisonGameId}
        onAddToCart={handleAddToCart}
        isWishlisted={isWishlisted}
        onToggleWishlist={handleToggleWishlist}
        onShowToast={showToast}
      />

      <AuthModal
        isOpen={authOpen}
        initialMode={authMode}
        onClose={() => setAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onShowToast={showToast}
      />

      <OrderHistoryModal
        isOpen={ordersOpen}
        onClose={() => setOrdersOpen(false)}
        user={user}
        orders={orders}
        onLogout={handleLogout}
        onRequireLogin={() => {
          setAuthMode('login');
          setAuthOpen(true);
        }}
        onShowToast={showToast}
        initialTab={ordersInitialTab}
        initialOrderNumber={ordersInitialNumber}
        onOpenReviewsModal={() => {
          setReviewsTarget({});
          setReviewsOpen(true);
        }}
        onUpdateOrderStatus={async (orderId, newStatus, orderNumber) => {
          const targetNum = orderNumber || orders.find((o) => o.id === orderId)?.orderNumber || orderId;
          setOrders((prev) =>
            deduplicateOrders(
              prev.map((o) =>
                o.id === orderId || o.orderNumber === targetNum ? { ...o, status: newStatus } : o
              )
            )
          );
          showToast(`Order status updated to ${newStatus}`, 'info');
          await updateOrderStatus(targetNum, newStatus, orderId);
        }}
        onAddToCart={handleAddToCart}
        onBatchAddToCart={handleBatchAddToCart}
        onOpenCart={() => {
          setOrdersOpen(false);
          setCartOpen(true);
        }}
      />

      <ProductSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onAddToCart={handleAddToCart}
        onSelectCategorySection={(cat) => setActiveCategory(cat)}
        isWishlisted={isWishlisted}
        onToggleWishlist={handleToggleWishlist}
      />

      {/* Mobile Native Bottom Navigation */}
      <MobileBottomNav
        cart={cart}
        wishlist={wishlist}
        onOpenCart={() => setCartOpen(true)}
        onOpenWishlist={() => setWishlistOpen(true)}
        onOpenTracker={() => {
          setOrdersInitialTab('tracker');
          setOrdersOpen(true);
        }}
        onOpenSearch={() => setSearchOpen(true)}
        onScrollToGames={() => {
          const el = document.getElementById('games-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        onScrollToTop={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={handleDismissToast} />

      {/* Chat With Us, Reach Selim (Owner), & Support Ticket Widget */}
      <ChatWidget
        externalOpen={liveChatOpen}
        initialTab={chatTab}
        onCloseExternal={() => {
          setLiveChatOpen(false);
          setChatTab('chat');
        }}
        onOpenOrderTracker={(orderNum) => {
          setOrdersInitialTab('tracker');
          setOrdersInitialNumber(orderNum || '');
          setOrdersOpen(true);
        }}
      />
    </div>
  );
}
