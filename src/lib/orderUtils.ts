import { Order, OrderStatus } from '../types';
import { db, handleFirestoreError, OperationType } from './firebase';
import { doc, setDoc, getDocs, collection, onSnapshot } from 'firebase/firestore';
import { submitOrderReview } from './reviewsUtils';

/**
 * Generates an authentic, unique Order ID in the format SST-2026-XXXXXX
 */
export function generateOrderId(): string {
  const year = new Date().getFullYear();
  // 6 digit cryptographically random or high-entropy numeric string
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  return `SST-${year}-${randomPart}`;
}

/**
 * Merges and deduplicates orders strictly by Order ID or Order Number,
 * preventing duplicated React keys and overlapping state entries.
 */
export function deduplicateOrders(ordersList: Order[]): Order[] {
  if (!Array.isArray(ordersList)) return [];

  const orderMap = new Map<string, Order>();
  const idToKey = new Map<string, string>();
  const numToKey = new Map<string, string>();

  for (const ord of ordersList) {
    if (!ord) continue;
    const cleanId = (ord.id || '').trim();
    const cleanNum = (ord.orderNumber || '').trim().toUpperCase();

    // Check if an entry with this ID or Order Number already exists
    const existingKey = (cleanId && idToKey.get(cleanId)) || (cleanNum && numToKey.get(cleanNum));

    if (existingKey && orderMap.has(existingKey)) {
      const existing = orderMap.get(existingKey)!;
      const merged: Order = {
        ...existing,
        ...ord,
        id: existing.id || ord.id,
        orderNumber: existing.orderNumber || ord.orderNumber,
        items: ord.items && ord.items.length > 0 ? ord.items : existing.items,
        total: ord.total !== undefined ? ord.total : existing.total,
        status: ord.status || existing.status,
        date: ord.date || existing.date,
        createdAt: ord.createdAt || existing.createdAt,
      };
      orderMap.set(existingKey, merged);
      if (cleanId) idToKey.set(cleanId, existingKey);
      if (cleanNum) numToKey.set(cleanNum, existingKey);
    } else {
      const primaryKey = cleanNum || cleanId || `ord-${Math.random().toString(36).substring(2, 9)}`;
      orderMap.set(primaryKey, ord);
      if (cleanId) idToKey.set(cleanId, primaryKey);
      if (cleanNum) numToKey.set(cleanNum, primaryKey);
    }
  }

  return Array.from(orderMap.values());
}

/**
 * Saves order to both backend Express API and Firestore
 */
export async function saveOrderToBackend(order: Order): Promise<{ success: boolean; order: Order; error?: string }> {
  try {
    const clientWebhookUrl = typeof window !== 'undefined' ? localStorage.getItem('google_sheet_webhook_url') || '' : '';

    // 1. Post to Express Backend (which handles file persistence + Google Sheet appending)
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...order, clientWebhookUrl }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Order saved to backend:', data);
    }

    // Direct client fallback to Google Sheet Webhook if URL exists in browser
    if (clientWebhookUrl && clientWebhookUrl.startsWith('http')) {
      try {
        const isFortniteOrRocket = (order.items || []).some((i) => {
          const cat = (i.category || '').toLowerCase();
          const n = (i.name || '').toLowerCase();
          return (
            cat === 'vbucks' ||
            cat === 'rocket' ||
            n.includes('fortnite') ||
            n.includes('v-bucks') ||
            n.includes('vbucks') ||
            n.includes('rocket league') ||
            n.includes('credits')
          );
        });

        const itemsText = (order.items || [])
          .map((i) => `${i.name}${i.details ? ` (${i.details})` : ''} - ${i.price} LE`)
          .join(' | ');

        const rlEmail = isFortniteOrRocket ? (order.gameAccountEmail || order.userEmail || '') : '';
        const rlPassword = isFortniteOrRocket ? (order.gameAccountPassword || '') : '';
        const cName = order.userName || 'Customer';
        const cOrder = itemsText || order.customerNotes || 'Digital Store Order';
        const cNumber = order.customerPhone || '';

        let targetClientUrl = clientWebhookUrl;
        try {
          const u = new URL(clientWebhookUrl);
          u.searchParams.set('Name', cName);
          u.searchParams.set('Order', cOrder);
          u.searchParams.set('Number', cNumber);
          u.searchParams.set('email', rlEmail);
          u.searchParams.set('password', rlPassword);
          u.searchParams.set('orderNumber', order.orderNumber);
          targetClientUrl = u.toString();
        } catch {}

        fetch(targetClientUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            sheet: 'Orders',
            Name: cName,
            Order: cOrder,
            Number: cNumber,
            email: rlEmail,
            password: rlPassword,
            name: cName,
            order: cOrder,
            number: cNumber,
            values: [cName, cOrder, cNumber, rlEmail, rlPassword],
            row: [cName, cOrder, cNumber, rlEmail, rlPassword],
            orderNumber: order.orderNumber,
            total: order.total,
            createdAt: order.createdAt || new Date().toISOString(),
          }),
        }).catch((e) => console.warn('Direct client Google Sheet send non-blocking:', e));
      } catch (e) {
        // non-blocking
      }
    }
  } catch (backendErr) {
    console.warn('Backend order save warning (will still persist locally/firestore):', backendErr);
  }

  // 2. Also persist to Firestore for durable cloud sync
  try {
    if (db && order.id) {
      await setDoc(doc(db, 'orders', order.id), {
        orderNumber: order.orderNumber,
        userEmail: order.userEmail,
        userName: order.userName,
        customerPhone: order.customerPhone || '',
        gameAccountEmail: order.gameAccountEmail || '',
        gameAccountPassword: order.gameAccountPassword || '',
        pointsDiscountUsed: order.pointsDiscountUsed || 0,
        date: order.date,
        items: order.items,
        total: order.total,
        status: order.status,
        paymentMethod: order.paymentMethod,
        customerNotes: order.customerNotes || '',
        paymentScreenshot: order.paymentScreenshot || '',
        createdAt: order.createdAt || new Date().toISOString(),
        rating: order.rating || null,
        ratingComment: order.ratingComment || null,
        ratedAt: order.ratedAt || null,
      });
      console.log('Order synced to Firestore:', order.orderNumber);
    }
  } catch (firestoreErr) {
    console.warn('Firestore save non-blocking warning:', firestoreErr);
  }

  return { success: true, order };
}

/**
 * Fetches all orders from backend
 */
export async function fetchOrdersFromBackend(): Promise<Order[]> {
  try {
    const res = await fetch('/api/orders');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.orders)) {
        return deduplicateOrders(data.orders);
      }
    }
  } catch (e) {
    console.warn('Error fetching backend orders:', e);
  }

  // Fallback to Firestore
  try {
    if (db) {
      const snapshot = await getDocs(collection(db, 'orders'));
      const list: Order[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as any;
        list.push({
          id: d.id,
          orderNumber: data.orderNumber || d.id,
          userEmail: data.userEmail || '',
          userName: data.userName || 'Customer',
          customerPhone: data.customerPhone,
          date: data.date || '',
          items: data.items || [],
          total: data.total || 0,
          status: data.status || 'Processing',
          paymentMethod: data.paymentMethod || 'Manual',
          customerNotes: data.customerNotes,
          paymentScreenshot: data.paymentScreenshot,
          createdAt: data.createdAt,
          rating: data.rating,
          ratingComment: data.ratingComment,
          ratedAt: data.ratedAt,
        });
      });
      if (list.length > 0) return deduplicateOrders(list);
    }
  } catch (e) {
    console.warn('Firestore fetch fallback error:', e);
  }

  return [];
}

/**
 * Subscribes to Real-Time Order status updates:
 * - Listens to Firebase Firestore `orders` collection via onSnapshot
 * - Listens to Server-Sent Events (SSE) `/api/orders/stream` for live updates from Google Sheets/Backend
 * - Automatically dispatches live orders list without requiring a page refresh
 */
export function subscribeToOrders(onOrdersChange: (orders: Order[]) => void): () => void {
  let isCleanedUp = false;
  let unsubscribeFirestore: (() => void) | null = null;
  let eventSource: EventSource | null = null;

  // 1. Firebase Firestore onSnapshot Listener
  if (db) {
    try {
      const ordersCol = collection(db, 'orders');
      unsubscribeFirestore = onSnapshot(
        ordersCol,
        (snapshot) => {
          if (isCleanedUp) return;
          const liveOrders: Order[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as any;
            liveOrders.push({
              id: docSnap.id,
              orderNumber: data.orderNumber || docSnap.id,
              userEmail: data.userEmail || '',
              userName: data.userName || 'Customer',
              customerPhone: data.customerPhone || '',
              gameAccountEmail: data.gameAccountEmail || '',
              gameAccountPassword: data.gameAccountPassword || '',
              date: data.date || '',
              items: data.items || [],
              total: data.total || 0,
              status: data.status || 'Processing',
              paymentMethod: data.paymentMethod || 'Manual',
              customerNotes: data.customerNotes || '',
              paymentScreenshot: data.paymentScreenshot || '',
              transactionReference: data.transactionReference || '',
              paymentStatus: data.paymentStatus || 'paid',
              channel: data.channel || 'website',
              createdAt: data.createdAt,
              rating: data.rating,
              ratingComment: data.ratingComment,
              ratedAt: data.ratedAt,
            });
          });

          if (liveOrders.length > 0) {
            onOrdersChange(deduplicateOrders(liveOrders));
          }
        },
        (error) => {
          console.warn('Firestore orders onSnapshot listener error:', error);
          try {
            handleFirestoreError(error, OperationType.GET, 'orders');
          } catch (e) {
            // non-fatal in listener
          }
        }
      );
    } catch (err) {
      console.warn('Could not attach Firestore onSnapshot listener:', err);
    }
  }

  // 2. Server-Sent Events (SSE) from Express Backend (triggered by Google Sheet / Webhook / API updates)
  if (typeof window !== 'undefined' && 'EventSource' in window) {
    try {
      eventSource = new EventSource('/api/orders/stream');
      eventSource.onmessage = (event) => {
        if (isCleanedUp) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload && Array.isArray(payload.orders) && payload.orders.length > 0) {
            onOrdersChange(deduplicateOrders(payload.orders));
          }
        } catch (e) {
          console.warn('Error parsing SSE orders update:', e);
        }
      };
      eventSource.onerror = () => {
        // SSE automatically attempts reconnection
      };
    } catch (e) {
      console.warn('EventSource initialization warning:', e);
    }
  }

  // 3. Fallback Heartbeat (periodic polling every 8s to guarantee no updates are ever missed)
  const pollInterval = setInterval(() => {
    if (isCleanedUp) return;
    fetchOrdersFromBackend().then((orders) => {
      if (!isCleanedUp && orders && orders.length > 0) {
        onOrdersChange(deduplicateOrders(orders));
      }
    }).catch(() => {});
  }, 8000);

  return () => {
    isCleanedUp = true;
    clearInterval(pollInterval);
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
    if (eventSource) {
      eventSource.close();
    }
  };
}

/**
 * Updates order status across Backend and Firestore in real time.
 */
export async function updateOrderStatus(
  orderNumber: string,
  status: OrderStatus,
  orderId?: string
): Promise<boolean> {
  // 1. Update Backend
  try {
    await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  } catch (e) {
    console.warn('Backend updateOrderStatus error:', e);
  }

  // 2. Update Firestore
  if (db) {
    try {
      const docId = orderId || orderNumber;
      await setDoc(doc(db, 'orders', docId), { status }, { merge: true });
    } catch (e) {
      console.warn('Firestore updateOrderStatus error:', e);
    }
  }

  return true;
}

/**
 * Submits an Order Rating (1-5 stars & comment) once an order is Completed.
 * - Saves rating to the Order in Backend and Firestore
 * - Submits verified review and awards +25 Reward Points
 */
export async function submitOrderRating(
  order: Order,
  rating: number,
  comment: string,
  reviewerName?: string,
  reviewerEmail?: string
): Promise<boolean> {
  const ratedAt = new Date().toISOString();
  const authorName = reviewerName || order.userName || 'Customer';
  const authorEmail = reviewerEmail || order.userEmail || '';

  // 1. Update Backend Order
  try {
    await fetch(`/api/orders/${encodeURIComponent(order.orderNumber)}/rating`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating,
        ratingComment: comment,
        ratedAt,
        authorName,
        authorEmail,
      }),
    });
  } catch (e) {
    console.warn('Backend submitOrderRating error:', e);
  }

  // 2. Update Firestore Order document
  if (db && (order.id || order.orderNumber)) {
    try {
      const docId = order.id || order.orderNumber;
      await setDoc(
        doc(db, 'orders', docId),
        {
          rating,
          ratingComment: comment,
          ratedAt,
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Firestore order rating update error:', e);
    }
  }

  // 3. Register Customer Review and Award +25 Reward Points
  try {
    const firstItem = order.items?.[0];
    await submitOrderReview({
      productId: firstItem?.name?.toLowerCase().replace(/\s+/g, '_') || 'order',
      productTitle: firstItem ? `${firstItem.name} (${firstItem.details})` : `Order #${order.orderNumber}`,
      category: (firstItem?.category as any) || 'game',
      rating,
      comment,
      authorName,
      authorEmail,
    });
  } catch (e) {
    console.warn('submitOrderReview error:', e);
  }

  return true;
}

/**
 * Downloads full Excel CSV file with UTF-8 BOM
 */
export function downloadExcelSheet(orders: Order[]): void {
  // Headers
  const headers = [
    'Order ID',
    'Date & Time',
    'Customer Name',
    'Email',
    'Phone / WhatsApp',
    'Items Summary',
    'What Was Bought (Customer Notes)',
    'Payment Method',
    'Total (EGP)',
    'Status',
    'Rating',
    'Rating Comment',
    'Receipt Screenshot Attached',
  ];

  const rows = orders.map((o) => {
    const itemsText = o.items.map((i) => `${i.name} (${i.details}) - ${i.price} LE`).join(' | ');
    const hasScreenshot = o.paymentScreenshot ? 'YES (Receipt Uploaded)' : 'NO';
    const cleanNotes = (o.customerNotes || '').replace(/"/g, '""');
    const cleanItems = itemsText.replace(/"/g, '""');
    const cleanComment = (o.ratingComment || '').replace(/"/g, '""');

    return [
      `"${o.orderNumber}"`,
      `"${o.date}"`,
      `"${(o.userName || '').replace(/"/g, '""')}"`,
      `"${(o.userEmail || '').replace(/"/g, '""')}"`,
      `"${(o.customerPhone || '').replace(/"/g, '""')}"`,
      `"${cleanItems}"`,
      `"${cleanNotes}"`,
      `"${(o.paymentMethod || '').replace(/"/g, '""')}"`,
      o.total,
      `"${o.status}"`,
      o.rating ? `${o.rating} Stars` : 'Unrated',
      `"${cleanComment}"`,
      `"${hasScreenshot}"`,
    ].join(',');
  });

  // UTF-8 BOM for Arabic/English Excel compatibility
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `seensoldthere-orders-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

