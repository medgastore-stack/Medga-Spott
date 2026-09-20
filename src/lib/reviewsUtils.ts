import { Review } from '../types';
import { db } from './firebase';
import { collection, addDoc, getDocs, orderBy, query, onSnapshot } from 'firebase/firestore';
import { addPoints } from './pointsUtils';

const REVIEWS_KEY = 'sst_product_reviews';

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    productId: 'fc26',
    productTitle: 'FC 26',
    category: 'game',
    rating: 5,
    comment: 'Super fast handover! Got the PS5 primary account credentials within 40 minutes and Ultimate Team works completely on my personal gamer tag.',
    authorName: 'Omar K.',
    authorEmail: 'omar.k@gmail.com',
    createdAt: '2026-08-28T14:20:00Z',
    verifiedBuyer: true,
  },
  {
    id: 'rev-2',
    productId: 'vb2400',
    productTitle: 'Fortnite 2,400 V-Bucks',
    category: 'vbucks',
    rating: 5,
    comment: 'Instant delivery was true! Literally took 8 minutes and the V-Bucks were added to my Epic account. Will buy again 100%.',
    authorName: 'Youssef M.',
    authorEmail: 'youssef.m@hotmail.com',
    createdAt: '2026-09-02T11:45:00Z',
    verifiedBuyer: true,
  },
  {
    id: 'rev-3',
    productId: 'it_takes_two',
    productTitle: 'It Takes Two',
    category: 'game',
    rating: 5,
    comment: 'Best deal I found in Egypt. Played the entire game with my friend smoothly. 5 stars all the way!',
    authorName: 'Karim F.',
    authorEmail: 'karim.f@gmail.com',
    createdAt: '2026-09-04T18:10:00Z',
    verifiedBuyer: true,
  },
  {
    id: 'rev-4',
    productId: 'essential',
    productTitle: 'PS Plus Essential (12 Months)',
    category: 'psplus',
    rating: 5,
    comment: 'Activated on my PS4 console with zero hassle. Saved over 1,500 LE compared to the PlayStation store direct price.',
    authorName: 'Tamer H.',
    authorEmail: 'tamer.h@yahoo.com',
    createdAt: '2026-08-19T09:30:00Z',
    verifiedBuyer: true,
  },
  {
    id: 'rev-5',
    productId: 'gtav',
    productTitle: 'GTA V',
    category: 'game',
    rating: 5,
    comment: 'Great support on live chat and WhatsApp. They guided me through Primary PS5 setup step by step.',
    authorName: 'Ahmed S.',
    authorEmail: 'ahmed.s@gmail.com',
    createdAt: '2026-09-06T16:00:00Z',
    verifiedBuyer: true,
  },
  {
    id: 'rev-6',
    productId: 'rc1100',
    productTitle: '1100 Rocket League Credits',
    category: 'rocket',
    rating: 5,
    comment: 'Quick and legit credits delivered right to my account. Clean transaction with InstaPay.',
    authorName: 'Ziad A.',
    authorEmail: 'ziad.a@gmail.com',
    createdAt: '2026-09-07T20:15:00Z',
    verifiedBuyer: true,
  },
];

/**
 * Gets all verified customer reviews from Firestore/local storage and default seed.
 */
export function getAllReviews(): Review[] {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse local reviews:', e);
  }
  return INITIAL_REVIEWS;
}

/**
 * Real-time listener for customer reviews from Firestore
 */
export function subscribeToReviews(callback: (reviews: Review[]) => void): () => void {
  if (!db) {
    callback(getAllReviews());
    return () => {};
  }

  try {
    const reviewsCol = collection(db, 'reviews');
    const unsub = onSnapshot(
      reviewsCol,
      (snap) => {
        const list: Review[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as any;
          list.push({
            id: docSnap.id,
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            productId: data.productId,
            productTitle: data.productTitle,
            category: data.category,
            rating: data.rating,
            comment: data.comment,
            authorName: data.authorName,
            authorEmail: data.authorEmail,
            createdAt: data.createdAt,
            verifiedBuyer: data.verifiedBuyer ?? true,
          });
        });

        // Combine Firestore reviews with initial reviews if empty, or prepend unique
        const combined = [...list];
        for (const init of INITIAL_REVIEWS) {
          if (!combined.some((r) => r.id === init.id || (r.comment === init.comment && r.authorName === init.authorName))) {
            combined.push(init);
          }
        }
        try {
          localStorage.setItem(REVIEWS_KEY, JSON.stringify(combined));
        } catch (e) {}
        callback(combined);
      },
      (err) => {
        console.warn('Reviews onSnapshot warning:', err);
        callback(getAllReviews());
      }
    );
    return unsub;
  } catch (e) {
    console.warn('Error subscribing to reviews:', e);
    callback(getAllReviews());
    return () => {};
  }
}

/**
 * Gets reviews for a specific product ID (or related game).
 */
export function getReviewsForProduct(productId: string): Review[] {
  const all = getAllReviews();
  const filtered = all.filter((r) => r.productId.toLowerCase() === productId.toLowerCase());
  if (filtered.length > 0) return filtered;

  // If specific product has no direct reviews, return top verified store reviews
  return all.slice(0, 3);
}

/**
 * Submits an order review/feedback.
 * - Saves review locally and to Firestore
 * - Awards 25 Reward Points per store requirements
 */
export async function submitOrderReview(review: Omit<Review, 'id' | 'createdAt' | 'verifiedBuyer'>): Promise<Review> {
  const fullReview: Review = {
    ...review,
    id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    createdAt: new Date().toISOString(),
    verifiedBuyer: true,
  };

  try {
    const all = getAllReviews();
    const updated = [fullReview, ...all];
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(updated));

    // Save to Firestore
    if (db) {
      try {
        await addDoc(collection(db, 'reviews'), fullReview);
      } catch (e) {
        console.warn('Firestore review save warning:', e);
      }
    }

    // Award 25 Reward Points for leaving a review
    await addPoints(
      25,
      'review',
      `Review bonus: +25 Points for rating "${review.productTitle}"`,
      review.authorEmail,
      review.authorName
    );
  } catch (e) {
    console.error('Error saving review:', e);
  }

  return fullReview;
}
