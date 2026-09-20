import { POINTS_TIERS } from './pointsUtils';

export interface DiscountCoupon {
  code: string;
  type: 'percent' | 'fixed' | 'free_game';
  value: number; // percentage or fixed amount in L.E
  requiredPoints: number;
  description: string;
  descriptionAr: string;
  minOrder?: number;
}

// Strictly the ONLY active discount codes allowed in the system:
// - 2542SDSG35: 50 L.E off, unlocked strictly at 16,000 PTS (16k)
// - 23254FXSZD: Free Game reward, unlocked strictly at 180,000 PTS (180k)
// These codes are not displayed anywhere in the UI.
export const AVAILABLE_COUPONS: DiscountCoupon[] = [
  {
    code: '2542SDSG35',
    type: 'fixed',
    value: 50,
    requiredPoints: 16000,
    description: '50 L.E Off Loyalty Reward',
    descriptionAr: 'خصم 50 ج.م لمكافأة الولاء (16,000 نقطة)',
  },
  {
    code: '23254FXSZD',
    type: 'free_game',
    value: 100,
    requiredPoints: 180000,
    description: 'Free Game 100% Off Reward',
    descriptionAr: 'لعبة مجانية بالكامل 100% (180,000 نقطة)',
  },
];

export function validateCoupon(
  code: string,
  orderTotal: number = 0,
  userPoints: number = 0,
  freeGamePrice: number = 0
): {
  isValid: boolean;
  coupon?: DiscountCoupon;
  discountAmount: number;
  message: string;
  messageAr: string;
} {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) {
    return {
      isValid: false,
      discountAmount: 0,
      message: 'Please enter a discount code',
      messageAr: 'يرجى إدخال كود الخصم',
    };
  }

  const found = AVAILABLE_COUPONS.find((c) => c.code.toUpperCase() === cleanCode);
  if (!found) {
    return {
      isValid: false,
      discountAmount: 0,
      message: `Coupon code "${cleanCode}" is invalid or expired.`,
      messageAr: `كود الخصم "${cleanCode}" غير صالح أو منتهي الصلاحية.`,
    };
  }

  // Check required points threshold
  if (found.requiredPoints && userPoints < found.requiredPoints) {
    const needed = (found.requiredPoints - userPoints).toLocaleString();
    return {
      isValid: false,
      discountAmount: 0,
      message: `Code "${found.code}" is only unlocked once you reach ${found.requiredPoints.toLocaleString()} PTS (You need ${needed} more PTS).`,
      messageAr: `الكود "${found.code}" لا يمكن استخدامه إلا بعد الوصول إلى ${found.requiredPoints.toLocaleString()} نقطة (تحتاج إلى ${needed} نقطة إضافية).`,
    };
  }

  if (found.minOrder && orderTotal < found.minOrder) {
    return {
      isValid: false,
      discountAmount: 0,
      message: `Code requires a minimum order of ${found.minOrder} L.E.`,
      messageAr: `يتطلب الكود حداً أدنى للطلب بقيمة ${found.minOrder} ج.م.`,
    };
  }

  let discountAmount = 0;
  if (found.type === 'free_game') {
    discountAmount = freeGamePrice > 0 ? freeGamePrice : orderTotal;
  } else if (found.type === 'percent') {
    discountAmount = Math.round((orderTotal * found.value) / 100);
  } else {
    discountAmount = Math.min(orderTotal, found.value);
  }

  return {
    isValid: true,
    coupon: found,
    discountAmount,
    message: `${found.description} (-${discountAmount} L.E applied)`,
    messageAr: `${found.descriptionAr} (تم تطبيق -${discountAmount} ج.م)`,
  };
}

export interface StackedDiscountOptions {
  redeemFreeGame?: boolean;
  freeGamePrice?: number;
}

export interface StackedDiscountResult {
  pointsDiscountEgp: number;
  totalDiscount: number;
  finalTotal: number;
  actualPointsSpent: number;
  rewardType: 'none' | 'cash_discount' | 'free_game';
}

/**
 * Calculates combined discount of Promo Coupon + Reward Points:
 * - 16,000 PTS = 50 L.E discount (must reach at least 16k points to unlock)
 * - 180,000 PTS = 100% Free Game!
 */
export function calculateStackedDiscounts(
  rawTotal: number,
  couponDiscountEgp: number,
  pointsUsed: number,
  options?: StackedDiscountOptions
): StackedDiscountResult {
  const afterCoupon = Math.max(0, rawTotal - couponDiscountEgp);

  // Option 1: 180,000 PTS Free Game Reward
  if (options?.redeemFreeGame && pointsUsed >= POINTS_TIERS.FREE_GAME_THRESHOLD) {
    const gameDiscount = options.freeGamePrice && options.freeGamePrice > 0 ? options.freeGamePrice : afterCoupon;
    const pointsDiscountEgp = Math.min(afterCoupon, gameDiscount);
    const totalDiscount = Math.min(rawTotal, couponDiscountEgp + pointsDiscountEgp);
    const finalTotal = Math.max(0, rawTotal - totalDiscount);

    return {
      pointsDiscountEgp,
      totalDiscount,
      finalTotal,
      actualPointsSpent: POINTS_TIERS.FREE_GAME_THRESHOLD,
      rewardType: 'free_game',
    };
  }

  // Option 2: 16,000 PTS = 50 L.E Discount tiers (must reach at least 16,000 points)
  if (pointsUsed >= POINTS_TIERS.DISCOUNT_THRESHOLD && afterCoupon > 0) {
    const availableTiers = Math.floor(pointsUsed / POINTS_TIERS.DISCOUNT_THRESHOLD);
    const maxTiersNeeded = Math.max(1, Math.ceil(afterCoupon / POINTS_TIERS.DISCOUNT_AMOUNT_EGP));
    const tiersToUse = Math.min(availableTiers, maxTiersNeeded);

    const potentialDiscount = tiersToUse * POINTS_TIERS.DISCOUNT_AMOUNT_EGP;
    const pointsDiscountEgp = Math.min(afterCoupon, potentialDiscount);
    const actualPointsSpent = tiersToUse * POINTS_TIERS.DISCOUNT_THRESHOLD;
    const totalDiscount = Math.min(rawTotal, couponDiscountEgp + pointsDiscountEgp);
    const finalTotal = Math.max(0, rawTotal - totalDiscount);

    return {
      pointsDiscountEgp,
      totalDiscount,
      finalTotal,
      actualPointsSpent,
      rewardType: 'cash_discount',
    };
  }

  // Below 16,000 points or no points used
  const totalDiscount = Math.min(rawTotal, couponDiscountEgp);
  const finalTotal = Math.max(0, rawTotal - totalDiscount);

  return {
    pointsDiscountEgp: 0,
    totalDiscount,
    finalTotal,
    actualPointsSpent: 0,
    rewardType: 'none',
  };
}
