export type PlatformType = 'prim5' | 'prim4' | 'sec' | 'full';

export interface Game {
  id: string;
  name: string;
  icon: string;
  image?: string;
  prim5?: number;
  prim4?: number;
  sec?: number;
  full?: number;
  genre?: string;
  popular?: boolean;
  isOffer?: boolean;
  isPreorder?: boolean;
  releaseDate?: string;
  targetReleaseDate?: string;
  preorderBonus?: string;
  expectedDelivery?: string;
  stock?: number;
  isSoldOut?: boolean;
}

export const isLowStock = (stock?: number): boolean => {
  return typeof stock === 'number' && stock > 0 && stock <= 5;
};

export interface PSPlusPrices {
  '1m_p': number;
  '3m_p': number;
  '12m_p': number;
  '1m_s': number;
  '3m_s': number;
  '12m_s': number;
}

export interface PSPlusPlan {
  id: string;
  name: string;
  color: string;
  badge?: string;
  basePrices: PSPlusPrices;
  features: string[];
}

export interface VBucksPack {
  id: string;
  amount: number;
  price: number;
  bonus?: string;
  popular?: boolean;
}

export interface RocketPack {
  id: string;
  name: string;
  credits?: number;
  price: number;
  isPass?: boolean;
}

export interface HezoService {
  id: string;
  name: string;
  icon: string;
  pricePer1k: number;
  unit: string;
  minQty?: number;
  maxQty?: number;
  step?: number;
}

export interface CartItem {
  cartId: string;
  name: string;
  details: string;
  price: number;
  category: 'game' | 'psplus' | 'vbucks' | 'rocket' | 'hezo' | 'bundle';
  icon?: string;
  image?: string;
  quantity?: number;
}

export type OrderStatus = 'Processing' | 'Delivered' | 'Pending Delivery' | 'Cancelled' | 'Completed';

export interface OrderItem {
  id: string;
  name: string;
  details: string;
  price: number;
  category?: string;
  image?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userEmail: string;
  userName: string;
  customerPhone?: string;
  gameAccountEmail?: string;
  gameAccountPassword?: string;
  pointsDiscountUsed?: number;
  couponCode?: string;
  couponDiscount?: number;
  date: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  customerNotes?: string;
  paymentScreenshot?: string; // base64 or image URL
  transactionReference?: string;
  paymentStatus?: 'paid' | 'verification_pending' | 'completed';
  channel?: 'website' | 'whatsapp';
  createdAt?: string;
  rating?: number;
  ratingComment?: string;
  ratedAt?: string;
}

export interface SupportTicketMessage {
  id: string;
  sender: 'customer' | 'support' | 'ai';
  text: string;
  timestamp: string;
  customerName?: string;
  customerPhone?: string;
  orderNumber?: string;
}

export interface User {
  name: string;
  email: string;
  isAuthenticated: boolean;
  points?: number;
}

export interface ToastTypeOption {
  type: 'success' | 'error' | 'info';
}

export interface Review {
  id: string;
  orderId?: string;
  orderNumber?: string;
  productId: string;
  productTitle: string;
  category?: string;
  rating: number; // 1 to 5
  comment: string;
  authorName: string;
  authorEmail?: string;
  createdAt: string;
  verifiedBuyer: boolean;
}

export interface PointsTransaction {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  points: number; // positive for earn, negative for redemption
  reason: 'purchase' | 'review' | 'suggestion' | 'redeem' | 'bonus';
  description: string;
  createdAt: string;
}

export interface GameSuggestion {
  id: string;
  type: 'game' | 'service';
  title: string;
  platform?: string;
  details?: string;
  userEmail?: string;
  userName?: string;
  pointsAwarded: number;
  createdAt: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'points';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  category: 'game' | 'psplus' | 'vbucks' | 'rocket' | 'hezo';
  price: number;
  details?: string;
  icon?: string;
  image?: string;
  addedAt: number;
}
