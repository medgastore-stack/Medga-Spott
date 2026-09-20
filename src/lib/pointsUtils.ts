import { PointsTransaction } from '../types';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

const POINTS_KEY = 'sst_user_points';
const HISTORY_KEY = 'sst_points_history';

export const POINTS_REWARD_RATES = {
  GAME: 200,     // "with each order of a game u get 200 points"
  PS_PLUS: 150,  // "for ps plus u get 150"
  HEZO: 50,      // "for hezo u get 50 per order"
  OTHER: 50,     // V-Bucks, Rocket League or digital services
};

export const POINTS_TIERS = {
  DISCOUNT_THRESHOLD: 16000,    // "for the 50 pounds ofmake it when they reach 16k instead of 8 and thisis the code 2542SDSG35"
  DISCOUNT_AMOUNT_EGP: 50,     // 50 pounds (50 L.E) off per 16,000 points
  FREE_GAME_THRESHOLD: 180000, // "dont make any discount codes except 23254FXSZD and this is only used once the person reaches 180k"
};

/**
 * Calculates Points earned from a purchase.
 * Per user instructions:
 * - With each order of a game: 200 points
 * - For PS Plus: 150 points
 * - For Hezo: 50 points per order
 * - Other packs: 50 points
 */
export function calculatePurchasePoints(price?: number, category?: string, itemName?: string): number {
  const cat = (category || '').toLowerCase();
  const name = (itemName || '').toLowerCase();

  // PlayStation Plus: 150 points
  if (cat === 'psplus' || name.includes('ps plus') || name.includes('playstation plus')) {
    return POINTS_REWARD_RATES.PS_PLUS;
  }

  // Hezo: 50 points
  if (cat === 'hezo' || name.includes('hezo')) {
    return POINTS_REWARD_RATES.HEZO;
  }

  // Game / Bundle: 200 points
  if (cat === 'game' || cat === 'bundle') {
    return POINTS_REWARD_RATES.GAME;
  }

  // V-Bucks or Rocket League: 50 points
  if (cat === 'vbucks' || cat === 'rocket') {
    return POINTS_REWARD_RATES.OTHER;
  }

  // Check if name hints at PlayStation Plus
  if (name.includes('plus') || name.includes('essential') || name.includes('extra') || name.includes('deluxe')) {
    return POINTS_REWARD_RATES.PS_PLUS;
  }

  // Default to game: 200 points
  return POINTS_REWARD_RATES.GAME;
}

/**
 * Converts points to L.E discount.
 * Rule: User has to reach 16,000 points to have 50 pounds (50 L.E) off.
 * Under 16,000 points, cash discount is 0.
 */
export function pointsToEgpDiscount(points: number): number {
  if (points < POINTS_TIERS.DISCOUNT_THRESHOLD) {
    return 0;
  }
  const tiers = Math.floor(points / POINTS_TIERS.DISCOUNT_THRESHOLD);
  return tiers * POINTS_TIERS.DISCOUNT_AMOUNT_EGP;
}

export function canRedeemFreeGame(points: number): boolean {
  return points >= POINTS_TIERS.FREE_GAME_THRESHOLD;
}

export function egpToRequiredPoints(egp: number): number {
  const tiers = Math.ceil(egp / POINTS_TIERS.DISCOUNT_AMOUNT_EGP);
  return tiers * POINTS_TIERS.DISCOUNT_THRESHOLD;
}

/**
 * Gets currently accumulated reward points for the current user.
 */
export function getUserPoints(userEmail?: string): number {
  try {
    const raw = localStorage.getItem(`${POINTS_KEY}_${userEmail || 'guest'}`);
    if (raw !== null) {
      const parsed = parseInt(raw, 10);
      return isNaN(parsed) ? 100 : parsed;
    }
    // Default starter reward for new users: 150 points
    return 150;
  } catch {
    return 150;
  }
}

/**
 * Gets points history transactions.
 */
export function getPointsHistory(userEmail?: string): PointsTransaction[] {
  try {
    const raw = localStorage.getItem(`${HISTORY_KEY}_${userEmail || 'guest'}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }

  // Default welcome transaction
  return [
    {
      id: 'welcome-bonus',
      userEmail: userEmail || 'guest@prososka.com',
      userName: 'Valued Customer',
      points: 150,
      reason: 'bonus',
      description: 'Welcome Bonus: Thank you for visiting SeenSoldThere!',
      createdAt: new Date().toISOString(),
    },
  ];
}

/**
 * Adds reward points to customer ledger and updates local state & Firestore.
 */
export async function addPoints(
  points: number,
  reason: PointsTransaction['reason'],
  description: string,
  userEmail?: string,
  userName?: string
): Promise<number> {
  const current = getUserPoints(userEmail);
  const updated = Math.max(0, current + points);

  try {
    localStorage.setItem(`${POINTS_KEY}_${userEmail || 'guest'}`, updated.toString());

    const history = getPointsHistory(userEmail);
    const newTx: PointsTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userEmail: userEmail || 'guest@prososka.com',
      userName: userName || 'Customer',
      points,
      reason,
      description,
      createdAt: new Date().toISOString(),
    };

    const updatedHistory = [newTx, ...history];
    localStorage.setItem(`${HISTORY_KEY}_${userEmail || 'guest'}`, JSON.stringify(updatedHistory.slice(0, 50)));

    // Firestore sync if available
    try {
      if (db) {
        await addDoc(collection(db, 'points_transactions'), newTx);
      }
    } catch (e) {
      console.warn('Firestore points sync warning:', e);
    }
  } catch (e) {
    console.error('Failed to save points:', e);
  }

  // Trigger custom window event so all UI components update synchronously
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sst_points_updated', { detail: { points: updated } }));
    if (points > 0) {
      window.dispatchEvent(
        new CustomEvent('sst_points_gained', {
          detail: {
            points,
            reason,
            description,
          },
        })
      );
    }
  }

  return updated;
}

/**
 * Syncs user points from Firestore
 */
export async function syncPointsWithFirestore(userEmail: string): Promise<number> {
  if (!db || !userEmail) return getUserPoints(userEmail);
  try {
    const q = query(
      collection(db, 'points_transactions'),
      where('userEmail', '==', userEmail)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      let total = 0;
      const historyList: PointsTransaction[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        const pts = Number(data.points) || 0;
        total += pts;
        historyList.push({
          id: d.id,
          userEmail: data.userEmail || userEmail,
          userName: data.userName || 'Customer',
          points: pts,
          reason: data.reason || 'bonus',
          description: data.description || '',
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });

      // Sort descending by date
      historyList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const finalPoints = Math.max(0, total);
      localStorage.setItem(`${POINTS_KEY}_${userEmail}`, finalPoints.toString());
      localStorage.setItem(`${HISTORY_KEY}_${userEmail}`, JSON.stringify(historyList.slice(0, 50)));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sst_points_updated', { detail: { points: finalPoints } }));
      }
      return finalPoints;
    }
  } catch (e) {
    console.warn('Error syncing points from Firestore:', e);
  }
  return getUserPoints(userEmail);
}

/**
 * Deducts points for a purchase discount or full redemption.
 */
export async function redeemPoints(
  pointsToRedeem: number,
  description: string,
  userEmail?: string,
  userName?: string
): Promise<boolean> {
  const current = getUserPoints(userEmail);
  if (current < pointsToRedeem || pointsToRedeem <= 0) return false;

  await addPoints(-pointsToRedeem, 'redeem', description, userEmail, userName);
  return true;
}
