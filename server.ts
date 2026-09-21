import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const PORT = 3000;
const ORDERS_FILE = path.join(process.cwd(), "orders.json");
const REVIEWS_FILE = path.join(process.cwd(), "reviews.json");
const SETTINGS_FILE = path.join(process.cwd(), "settings.json");

interface PaymobSettings {
  apiKey: string;
  publicKey: string;
  secretKey: string;
  cardIntegrationId: string;
  walletIntegrationId: string;
  iframeId: string;
  hmacSecret: string;
  isLive: boolean;
}

interface EmailVerificationSettings {
  provider: "firebase_auth" | "gmail" | "none";
  gmailUser: string;
  gmailAppPassword: string;
}

interface ServerSettings {
  googleSheetWebhookUrl: string;
  paymob: PaymobSettings;
  emailVerification: EmailVerificationSettings;
  otp?: any;
}

const defaultPaymobSettings: PaymobSettings = {
  apiKey: process.env.PAYMOB_API_KEY || "",
  publicKey: process.env.PAYMOB_PUBLIC_KEY || "",
  secretKey: process.env.PAYMOB_SECRET_KEY || "",
  cardIntegrationId: process.env.PAYMOB_INTEGRATION_ID_CARD || "",
  walletIntegrationId: process.env.PAYMOB_INTEGRATION_ID_WALLET || "",
  iframeId: process.env.PAYMOB_IFRAME_ID || "",
  hmacSecret: process.env.PAYMOB_HMAC || "",
  isLive: false,
};

const defaultEmailVerificationSettings: EmailVerificationSettings = {
  provider: (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) ? "gmail" : "firebase_auth",
  gmailUser: process.env.GMAIL_USER || "",
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD || "",
};

function loadSettings(): ServerSettings {
  const envSheetUrl = (process.env.GOOGLE_SHEET_WEBHOOK_URL && process.env.GOOGLE_SHEET_WEBHOOK_URL.startsWith("http"))
    ? process.env.GOOGLE_SHEET_WEBHOOK_URL.trim()
    : "";

  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      return {
        googleSheetWebhookUrl: (parsed.googleSheetWebhookUrl && parsed.googleSheetWebhookUrl.startsWith("http"))
          ? parsed.googleSheetWebhookUrl.trim()
          : envSheetUrl,
        paymob: {
          ...defaultPaymobSettings,
          ...(parsed.paymob || {}),
        },
        emailVerification: {
          ...defaultEmailVerificationSettings,
          ...(parsed.emailVerification || {}),
        },
      };
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
  return {
    googleSheetWebhookUrl: envSheetUrl,
    paymob: defaultPaymobSettings,
    emailVerification: defaultEmailVerificationSettings,
  };
}

function saveSettings(settings: ServerSettings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
}

function loadOrders(): any[] {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Failed to load orders from file:", e);
  }
  return [];
}

function saveOrders(orders: any[]) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save orders to file:", e);
  }
}

function loadReviews(): any[] {
  try {
    if (fs.existsSync(REVIEWS_FILE)) {
      const data = fs.readFileSync(REVIEWS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Failed to load reviews from file:", e);
  }
  return [];
}

function saveReviews(reviews: any[]) {
  try {
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save reviews to file:", e);
  }
}

let currentOrders = loadOrders();
let currentReviews = loadReviews();
let currentSettings = loadSettings();

// In-memory set of dispatched order numbers to strictly prevent duplicate rows in Google Sheets
const dispatchedSheetOrders = new Set<string>();

// Real OTP Store (hashed storage, rate limiting, and expiration)
interface StoredOtp {
  target: string;
  type: "phone" | "email";
  codeHash: string;
  salt: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
}

const otpStore = new Map<string, StoredOtp>();
const otpRateLimit = new Map<string, { count: number; windowStart: number }>();
const verifiedTokens = new Map<string, { target: string; expiresAt: number }>();

// Prune expired OTP entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of otpStore.entries()) {
    if (now > item.expiresAt) {
      otpStore.delete(key);
    }
  }
  for (const [key, item] of verifiedTokens.entries()) {
    if (now > item.expiresAt) {
      verifiedTokens.delete(key);
    }
  }
  for (const [key, rl] of otpRateLimit.entries()) {
    if (now - rl.windowStart > 10 * 60 * 1000) {
      otpRateLimit.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Helper to forward orders to Google Sheets via Webhook / Apps Script
// Ordered strictly as requested: Name, Order, Number, email, password
// with email and password populated specifically for Rocket League and Fortnite orders
async function forwardOrderToGoogleSheet(order: any, clientWebhookUrl?: string, force = false) {
  if (!order || !order.orderNumber) {
    return { forwarded: false, reason: "Invalid order object" };
  }

  // Prevent duplicate row insertion if already sent (unless force is true)
  if (!force && dispatchedSheetOrders.has(order.orderNumber)) {
    console.log(`[GoogleSheet] Order ${order.orderNumber} was already sent. Skipping duplicate row.`);
    return { forwarded: true, duplicate: true };
  }

  const envSheet = (process.env.GOOGLE_SHEET_WEBHOOK_URL && process.env.GOOGLE_SHEET_WEBHOOK_URL.startsWith("http"))
    ? process.env.GOOGLE_SHEET_WEBHOOK_URL.trim()
    : "";
  const webhookUrl = (clientWebhookUrl && clientWebhookUrl.startsWith("http"))
    ? clientWebhookUrl.trim()
    : (currentSettings.googleSheetWebhookUrl && currentSettings.googleSheetWebhookUrl.startsWith("http"))
    ? currentSettings.googleSheetWebhookUrl.trim()
    : envSheet;

  if (!webhookUrl) {
    console.log(`[GoogleSheet] Order ${order.orderNumber} placed. No Google Sheet Webhook URL configured yet in settings or environment.`);
    return { forwarded: false, reason: "No Google Sheet Webhook URL configured" };
  }

  const itemsText = (order.items || [])
    .map((i: any) => `${i.name}${i.details ? ` (${i.details})` : ''} - ${i.price} LE`)
    .join(" | ");

  // Email and password for delivery / game accounts if provided
  const customerEmail = order.gameAccountEmail || order.userEmail || "";
  const customerPassword = order.gameAccountPassword || "";

  const customerName = order.userName || "Customer";
  const orderDescription = itemsText || order.customerNotes || "Digital Store Order";
  const customerNumber = order.customerPhone || "";

  const payload = {
    sheet: "Orders",
    // Standard 5-column layout: Name, Order, Number, email, password
    Name: customerName,
    Order: orderDescription,
    Number: customerNumber,
    email: customerEmail,
    password: customerPassword,

    // Case variations for Apps Script compatibility
    name: customerName,
    order: orderDescription,
    number: customerNumber,
    customerPhone: customerNumber,
    userName: customerName,
    userEmail: order.userEmail || "",
    gameAccountEmail: order.gameAccountEmail || "",
    gameAccountPassword: customerPassword,

    // 5-Column Array matching Name, Order, Number, email, password
    values: [customerName, orderDescription, customerNumber, customerEmail, customerPassword],
    row: [customerName, orderDescription, customerNumber, customerEmail, customerPassword],

    // Complete order record fields for extended sheets
    orderNumber: order.orderNumber,
    items: order.items || [],
    total: order.total || 0,
    paymentMethod: order.paymentMethod || "Website",
    paymentStatus: order.paymentStatus || "paid",
    status: order.status || "Processing",
    date: order.date || new Date().toLocaleDateString(),
    createdAt: order.createdAt || new Date().toISOString(),
  };

  // Construct query-string enriched URL to ensure parameters survive any HTTP 302 GET redirects
  let targetUrl = webhookUrl;
  try {
    const urlObj = new URL(webhookUrl);
    urlObj.searchParams.set("Name", customerName);
    urlObj.searchParams.set("Order", orderDescription);
    urlObj.searchParams.set("Number", customerNumber);
    urlObj.searchParams.set("email", customerEmail);
    urlObj.searchParams.set("password", customerPassword);
    urlObj.searchParams.set("orderNumber", order.orderNumber);
    urlObj.searchParams.set("total", String(order.total || 0));
    urlObj.searchParams.set("status", order.status || "Processing");
    urlObj.searchParams.set("date", order.date || new Date().toLocaleDateString());
    targetUrl = urlObj.toString();
  } catch {
    // If not a standard URL string, keep original webhookUrl
  }

  // Retry with exponential backoff (up to 2 retries)
  let attempt = 0;
  let lastError: string | null = null;

  while (attempt <= 2) {
    try {
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
        redirect: "follow",
      });

      const responseText = await res.text();
      const isRedirectedToAuth = (res.url && res.url.includes("accounts.google.com")) ||
                                 responseText.includes("You need access") ||
                                 responseText.includes("accounts.google.com") ||
                                 responseText.includes("Sign in - Google Accounts");

      if (res.ok && !isRedirectedToAuth) {
        dispatchedSheetOrders.add(order.orderNumber);
        console.log(`[GoogleSheet] Successfully appended real order ${order.orderNumber} to Google Sheet! Status: ${res.status}`);
        return { forwarded: true, status: res.status, orderNumber: order.orderNumber, customer: customerName };
      } else if (isRedirectedToAuth) {
        lastError = "HTTP 403 / Access Denied: Google redirected to login ('You need access'). In Google Apps Script, click Deploy > Manage deployments > Edit > set 'Who has access' to 'Anyone' (not 'Only myself').";
        break;
      } else {
        lastError = `HTTP Status ${res.status}`;
        if (res.status === 403) {
          break;
        }
      }
    } catch (err: any) {
      lastError = err.message;
    }
    attempt++;
    if (attempt <= 2) {
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }

  if (lastError?.includes("Access Denied") || lastError?.includes("403")) {
    console.warn(`[GoogleSheet] Notice for order ${order.orderNumber}: Webhook permissions issue. Make sure 'Who has access' is 'Anyone' in Google Apps Script.`);
  } else {
    console.warn(`[GoogleSheet] Note: Could not forward order ${order.orderNumber} to Google Sheet:`, lastError);
  }
  return { forwarded: false, error: lastError, orderNumber: order.orderNumber };
}

// Helper to forward reviews to Google Sheets on a separate sheet
async function forwardReviewToGoogleSheet(review: any) {
  const webhookUrl = currentSettings.googleSheetWebhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl || !webhookUrl.startsWith("http")) {
    return { forwarded: false, reason: "No Google Sheet Webhook URL configured" };
  }

  try {
    const payload = {
      sheet: "Reviews",
      name: review.userName || "Customer",
      product: review.productTitle || "Medga Store",
      rating: review.rating || 5,
      comment: review.comment || "",
      number: review.customerPhone || "",
      createdAt: review.createdAt || new Date().toISOString()
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    return { forwarded: true, status: res.status };
  } catch (err: any) {
    console.warn("[GoogleSheet] Review Forwarding warning:", err.message);
    return { forwarded: false, error: err.message };
  }
}


async function startServer() {
  const app = express();
  // Support large base64 screenshot uploads
  app.use(express.json({ limit: "25mb" }));

  // Initialize Gemini Client
  const getAiClient = () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY environment variable is missing.");
    }
    return new GoogleGenAI({
      apiKey: key || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // GET Orders list
  app.get("/api/orders", (req, res) => {
    res.json({ orders: currentOrders });
  });

  // GET Single Order by orderNumber or ID
  app.get("/api/orders/:orderNumber", (req, res) => {
    const { orderNumber } = req.params;
    const cleanNum = orderNumber.trim().toUpperCase();
    const order = currentOrders.find((o) => {
      const oNum = (o.orderNumber || "").toUpperCase();
      const oId = (o.id || "").toUpperCase();
      return (
        oNum === cleanNum ||
        oNum === `SST-${cleanNum}` ||
        oNum.includes(cleanNum) ||
        oId === cleanNum
      );
    });

    if (order) {
      return res.json({ success: true, order });
    }
    return res.status(404).json({ success: false, error: "Order not found" });
  });

  // POST Create New Order (Website Checkout)
  app.post("/api/orders", async (req, res) => {
    try {
      const body = req.body;
      if (!body.orderNumber || typeof body.total !== "number") {
        return res.status(400).json({ error: "orderNumber and total are required" });
      }

      const newOrder = {
        id: body.id || `ord-${Date.now()}`,
        orderNumber: body.orderNumber,
        userEmail: body.userEmail || "customer@medgastore.com",
        userName: body.userName || "Customer",
        customerPhone: body.customerPhone || "",
        gameAccountEmail: body.gameAccountEmail || "",
        gameAccountPassword: body.gameAccountPassword || "",
        date: body.date || new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        items: body.items || [],
        total: body.total,
        status: body.status || "Processing",
        paymentMethod: body.paymentMethod || "Website Payment",
        customerNotes: body.customerNotes || "",
        paymentScreenshot: body.paymentScreenshot || "",
        transactionReference: body.transactionReference || "",
        paymentStatus: body.paymentStatus || "paid",
        channel: body.channel || "website",
        createdAt: body.createdAt || new Date().toISOString(),
      };

      // If client provided a valid webhook URL, automatically register and persist to settings
      if (body.clientWebhookUrl && typeof body.clientWebhookUrl === 'string' && body.clientWebhookUrl.startsWith("http")) {
        const cleaned = body.clientWebhookUrl.trim();
        if (currentSettings.googleSheetWebhookUrl !== cleaned) {
          currentSettings.googleSheetWebhookUrl = cleaned;
          saveSettings(currentSettings);
          console.log(`[GoogleSheet] Auto-registered active sheet webhook URL: ${cleaned}`);
        }
      }

      // Add to beginning of current orders
      currentOrders = [newOrder, ...currentOrders.filter((o) => o.orderNumber !== newOrder.orderNumber)];
      saveOrders(currentOrders);
      broadcastOrdersUpdate(newOrder);

      // Forward to Google Sheets Webhook automatically
      const sheetResult = await forwardOrderToGoogleSheet(newOrder, body.clientWebhookUrl);

      return res.status(201).json({
        success: true,
        order: newOrder,
        googleSheet: sheetResult,
      });
    } catch (err: any) {
      console.error("Failed to save order:", err);
      return res.status(500).json({ error: "Failed to create order" });
    }
  });

  // SSE order stream listeners
  const orderStreamClients = new Set<express.Response>();
  function broadcastOrdersUpdate(updatedOrder?: any) {
    const payload = JSON.stringify({ type: 'orders_update', orders: currentOrders, updatedOrder });
    for (const client of orderStreamClients) {
      try {
        client.write(`data: ${payload}\n\n`);
      } catch (e) {
        orderStreamClients.delete(client);
      }
    }
  }

  // GET Server-Sent Events (SSE) stream for live order updates
  app.get("/api/orders/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    if (typeof (res as any).flushHeaders === "function") {
      (res as any).flushHeaders();
    }

    // Send initial snapshot
    res.write(`data: ${JSON.stringify({ type: 'initial', orders: currentOrders })}\n\n`);
    orderStreamClients.add(res);

    const pingTimer = setInterval(() => {
      try {
        res.write(": ping\n\n");
      } catch (e) {
        clearInterval(pingTimer);
        orderStreamClients.delete(res);
      }
    }, 25000);

    req.on("close", () => {
      clearInterval(pingTimer);
      orderStreamClients.delete(res);
    });
  });

  // PATCH / POST Update Order Status
  const handleOrderStatusUpdate = (req: express.Request, res: express.Response) => {
    try {
      const { orderNumber } = req.params;
      const status = req.body.status || req.body.Status;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      let updated = false;
      let matchedOrder: any = null;
      currentOrders = currentOrders.map((ord) => {
        if (
          ord.orderNumber === orderNumber ||
          ord.id === orderNumber ||
          ord.orderNumber?.toLowerCase() === orderNumber?.toLowerCase()
        ) {
          updated = true;
          matchedOrder = { ...ord, status };
          return matchedOrder;
        }
        return ord;
      });

      if (!updated) {
        return res.status(404).json({ error: "Order not found" });
      }

      saveOrders(currentOrders);
      broadcastOrdersUpdate(matchedOrder);
      return res.json({ success: true, orderNumber, status, order: matchedOrder });
    } catch (err: any) {
      console.error("Failed to update order status:", err);
      return res.status(500).json({ error: "Failed to update status" });
    }
  };

  app.patch("/api/orders/:orderNumber/status", handleOrderStatusUpdate);
  app.post("/api/orders/:orderNumber/status", handleOrderStatusUpdate);

  // Webhook for Google Sheets / Automated status changes
  app.post("/api/webhook/order-status", (req, res) => {
    try {
      const body = req.body || {};
      const orderIdentifier =
        body.orderNumber ||
        body.order ||
        body.Order ||
        body.orderId ||
        body.order_id ||
        body.Number ||
        body.number;
      const newStatus = body.status || body.Status || "Completed";

      if (!orderIdentifier) {
        return res.status(400).json({ error: "Order number or ID is required in webhook payload" });
      }

      let updated = false;
      let targetOrder: any = null;

      currentOrders = currentOrders.map((ord) => {
        if (
          ord.orderNumber === orderIdentifier ||
          ord.id === orderIdentifier ||
          ord.orderNumber?.toLowerCase() === String(orderIdentifier).toLowerCase()
        ) {
          updated = true;
          targetOrder = { ...ord, status: newStatus };
          return targetOrder;
        }
        return ord;
      });

      if (!updated) {
        return res.status(404).json({ error: `Order ${orderIdentifier} not found` });
      }

      saveOrders(currentOrders);
      broadcastOrdersUpdate(targetOrder);

      return res.json({
        success: true,
        orderNumber: targetOrder.orderNumber,
        status: newStatus,
        message: "Order status updated and pushed live to connected clients",
      });
    } catch (err: any) {
      console.error("Webhook order-status error:", err);
      return res.status(500).json({ error: "Webhook update failed" });
    }
  });

  // PATCH / POST Order Rating (Rating 1-5 & comment)
  const handleOrderRating = (req: express.Request, res: express.Response) => {
    try {
      const { orderNumber } = req.params;
      const { rating, ratingComment, comment, authorName, authorEmail, ratedAt } = req.body;

      if (!rating || Number(rating) < 1 || Number(rating) > 5) {
        return res.status(400).json({ error: "A valid rating between 1 and 5 stars is required" });
      }

      let updated = false;
      let matchedOrder: any = null;
      const finalComment = (ratingComment || comment || "").trim();
      const ratingTimestamp = ratedAt || new Date().toISOString();

      currentOrders = currentOrders.map((ord) => {
        if (
          ord.orderNumber === orderNumber ||
          ord.id === orderNumber ||
          ord.orderNumber?.toLowerCase() === orderNumber?.toLowerCase()
        ) {
          updated = true;
          matchedOrder = {
            ...ord,
            rating: Number(rating),
            ratingComment: finalComment,
            ratedAt: ratingTimestamp,
          };
          return matchedOrder;
        }
        return ord;
      });

      if (!updated) {
        return res.status(404).json({ error: "Order not found" });
      }

      saveOrders(currentOrders);
      broadcastOrdersUpdate(matchedOrder);

      // Also persist to store reviews list
      const firstItem = matchedOrder.items?.[0];
      const newReview = {
        id: `rev-${Date.now()}`,
        productId: firstItem?.name?.toLowerCase().replace(/\s+/g, "_") || "order",
        productTitle: firstItem ? `${firstItem.name} (${firstItem.details})` : `Order #${matchedOrder.orderNumber}`,
        category: firstItem?.category || "game",
        rating: Number(rating),
        comment: finalComment,
        authorName: authorName || matchedOrder.userName || "Customer",
        authorEmail: authorEmail || matchedOrder.userEmail || "",
        createdAt: ratingTimestamp,
        verifiedBuyer: true,
      };

      currentReviews = [newReview, ...currentReviews];
      saveReviews(currentReviews);

      return res.json({
        success: true,
        orderNumber: matchedOrder.orderNumber,
        rating: Number(rating),
        ratingComment: finalComment,
        ratedAt: ratingTimestamp,
      });
    } catch (err: any) {
      console.error("Failed to save order rating:", err);
      return res.status(500).json({ error: "Failed to save order rating" });
    }
  };

  app.patch("/api/orders/:orderNumber/rating", handleOrderRating);
  app.post("/api/orders/:orderNumber/rating", handleOrderRating);

  // DELETE Remove Order
  app.delete("/api/orders/:orderNumber", (req, res) => {
    try {
      const { orderNumber } = req.params;
      currentOrders = currentOrders.filter((ord) => ord.orderNumber !== orderNumber);
      saveOrders(currentOrders);
      return res.json({ success: true, orderNumber });
    } catch (err: any) {
      console.error("Failed to delete order:", err);
      return res.status(500).json({ error: "Failed to delete order" });
    }
  });

  // GET Reviews list
  app.get("/api/reviews", (req, res) => {
    res.json({ reviews: currentReviews });
  });

  // POST Submit New Customer Review
  app.post("/api/reviews", async (req, res) => {
    try {
      const { userName, customerPhone, rating, comment, productTitle } = req.body;
      const newReview = {
        id: `rev-${Date.now()}`,
        userName: userName || "Customer",
        customerPhone: customerPhone || "",
        rating: Number(rating) || 5,
        comment: comment || "",
        productTitle: productTitle || "Store Order",
        createdAt: new Date().toISOString(),
      };

      currentReviews = [newReview, ...currentReviews];
      saveReviews(currentReviews);

      const sheetResult = await forwardReviewToGoogleSheet(newReview);
      return res.status(201).json({ success: true, review: newReview, googleSheet: sheetResult });
    } catch (err: any) {
      console.error("Failed to save review:", err);
      return res.status(500).json({ error: "Failed to create review" });
    }
  });

  // Download / Export Orders to Excel CSV with UTF-8 BOM
  app.get("/api/orders/export-excel", (req, res) => {
    try {
      const headers = [
        "Order ID",
        "Date & Time",
        "Customer Name",
        "Email",
        "Phone / WhatsApp",
        "Items Summary",
        "What Was Bought (Notes)",
        "Payment Method",
        "Total (EGP)",
        "Status",
        "Screenshot Proof Attached",
        "Transaction Reference"
      ];

      const rows = currentOrders.map((o) => {
        const itemsText = (o.items || [])
          .map((i: any) => `${i.name} (${i.details}) - ${i.price} LE`)
          .join(" | ");
        const hasScreenshot = o.paymentScreenshot ? "YES (Receipt Uploaded)" : "NO";
        const cleanNotes = (o.customerNotes || "").replace(/"/g, '""');
        const cleanItems = itemsText.replace(/"/g, '""');
        const cleanName = (o.userName || "").replace(/"/g, '""');
        const cleanEmail = (o.userEmail || "").replace(/"/g, '""');
        const cleanPhone = (o.customerPhone || "").replace(/"/g, '""');
        const cleanPayment = (o.paymentMethod || "").replace(/"/g, '""');
        const cleanRef = (o.transactionReference || "").replace(/"/g, '""');

        return [
          `"${o.orderNumber}"`,
          `"${o.date}"`,
          `"${cleanName}"`,
          `"${cleanEmail}"`,
          `"${cleanPhone}"`,
          `"${cleanItems}"`,
          `"${cleanNotes}"`,
          `"${cleanPayment}"`,
          o.total,
          `"${o.status}"`,
          `"${hasScreenshot}"`,
          `"${cleanRef}"`
        ].join(",");
      });

      // UTF-8 BOM: \uFEFF ensures Excel and Google Sheets render Arabic & special characters seamlessly
      const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="medgastore-orders-${new Date().toISOString().slice(0, 10)}.csv"`);
      return res.status(200).send(csvContent);
    } catch (err: any) {
      console.error("Export Excel error:", err);
      return res.status(500).send("Export failed");
    }
  });

  // Google Sheets integration configuration endpoints
  app.get("/api/settings/google-sheets", (req, res) => {
    const configured = !!(currentSettings.googleSheetWebhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL);
    res.json({
      configured,
      webhookUrl: currentSettings.googleSheetWebhookUrl ? currentSettings.googleSheetWebhookUrl.replace(/(.{15}).+(.{5})/, "$1...$2") : "",
      fullUrl: currentSettings.googleSheetWebhookUrl || "",
    });
  });

  app.post("/api/settings/google-sheets", async (req, res) => {
    try {
      const { webhookUrl, testOrder } = req.body;
      if (typeof webhookUrl === "string") {
        currentSettings.googleSheetWebhookUrl = webhookUrl.trim();
        saveSettings(currentSettings);
      }

      let testResult = null;
      if (testOrder && currentSettings.googleSheetWebhookUrl) {
        // Forward the latest real customer order instead of a demo placeholder
        const targetOrder = currentOrders.find((o: any) => !o.orderNumber?.includes("TEST")) || currentOrders[0];
        if (targetOrder) {
          dispatchedSheetOrders.delete(targetOrder.orderNumber);
          testResult = await forwardOrderToGoogleSheet(targetOrder, currentSettings.googleSheetWebhookUrl, true);
        }
      }

      return res.json({
        success: true,
        configured: !!currentSettings.googleSheetWebhookUrl,
        testResult,
      });
    } catch (err: any) {
      console.error("Failed to save google sheet settings:", err);
      return res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Dedicated endpoint to send actual store orders to Google Sheets
  app.post("/api/settings/google-sheets/test", async (req, res) => {
    try {
      const webhookUrl = (req.body?.webhookUrl || currentSettings.googleSheetWebhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL || "").trim();
      if (!webhookUrl || !webhookUrl.startsWith("http")) {
        return res.status(400).json({
          success: false,
          error: "Invalid webhook URL. Please provide a full URL starting with https://script.google.com/..."
        });
      }

      // Pick actual customer order: requested order number or the latest authentic order
      const requestedOrderNumber = req.body?.orderNumber;
      let targetOrder = null;
      if (requestedOrderNumber) {
        targetOrder = currentOrders.find(
          (o: any) => o.orderNumber === requestedOrderNumber || o.id === requestedOrderNumber
        );
      }
      if (!targetOrder && currentOrders.length > 0) {
        targetOrder = currentOrders.find((o: any) => !o.orderNumber?.includes("TEST")) || currentOrders[0];
      }

      if (!targetOrder) {
        return res.status(400).json({
          success: false,
          error: "No actual customer orders found to send. Please place a store order first."
        });
      }

      // Clear from dispatched cache to allow manual forward
      dispatchedSheetOrders.delete(targetOrder.orderNumber);

      const testResult = await forwardOrderToGoogleSheet(targetOrder, webhookUrl, true);

      if (testResult.forwarded) {
        return res.json({
          success: true,
          message: `Actual order #${targetOrder.orderNumber} (${targetOrder.userName || "Customer"} - ${targetOrder.total} LE) sent successfully to Google Sheet!`,
          orderNumber: targetOrder.orderNumber,
          customer: targetOrder.userName,
          total: targetOrder.total,
          status: testResult.status
        });
      }

      const is403 = testResult.error?.includes("403") || testResult.error?.includes("Access Denied");
      return res.status(400).json({
        success: false,
        is403,
        error: is403
          ? "HTTP 403 Forbidden / Access Denied: Google redirected to sign-in. In Google Apps Script, click Deploy > Manage deployments > Edit > set 'Who has access' to 'Anyone' (not 'Only myself')."
          : `Failed: ${testResult.error}`
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Dedicated endpoint to sync ALL authentic customer orders to Google Sheet
  app.post("/api/settings/google-sheets/sync-all", async (req, res) => {
    try {
      const webhookUrl = (req.body?.webhookUrl || currentSettings.googleSheetWebhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL || "").trim();
      if (!webhookUrl || !webhookUrl.startsWith("http")) {
        return res.status(400).json({
          success: false,
          error: "Invalid Google Sheet Webhook URL."
        });
      }

      // Filter to authentic customer orders
      const realOrders = currentOrders.filter(
        (o: any) => !o.orderNumber?.includes("TEST") && !o.orderNumber?.includes("VERIFY")
      );

      if (realOrders.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No authentic store orders found in database to sync."
        });
      }

      const results = [];
      let successCount = 0;

      for (const order of realOrders) {
        dispatchedSheetOrders.delete(order.orderNumber);
        const result = await forwardOrderToGoogleSheet(order, webhookUrl, true);
        if (result.forwarded) {
          successCount++;
        }
        results.push({
          orderNumber: order.orderNumber,
          customer: order.userName,
          total: order.total,
          forwarded: result.forwarded,
          error: result.error,
        });
        await new Promise((r) => setTimeout(r, 400));
      }

      return res.json({
        success: successCount > 0,
        syncedCount: successCount,
        total: realOrders.length,
        results,
        message: `Synced ${successCount} of ${realOrders.length} actual customer orders to Google Sheet.`
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Dedicated endpoint to send a single real order by order number
  app.post("/api/settings/google-sheets/send-order", async (req, res) => {
    try {
      const { orderNumber } = req.body;
      const webhookUrl = (req.body?.webhookUrl || currentSettings.googleSheetWebhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL || "").trim();
      if (!webhookUrl || !webhookUrl.startsWith("http")) {
        return res.status(400).json({ success: false, error: "No Google Sheet Webhook URL configured." });
      }

      const targetOrder = currentOrders.find((o: any) => o.orderNumber === orderNumber || o.id === orderNumber);
      if (!targetOrder) {
        return res.status(404).json({ success: false, error: `Order #${orderNumber} not found in database.` });
      }

      dispatchedSheetOrders.delete(targetOrder.orderNumber);
      const result = await forwardOrderToGoogleSheet(targetOrder, webhookUrl, true);

      if (result.forwarded) {
        return res.json({
          success: true,
          message: `Actual order #${targetOrder.orderNumber} sent successfully to Google Sheet!`,
          order: targetOrder,
        });
      }

      return res.status(400).json({
        success: false,
        error: result.error || "Failed to forward order to Google Sheet"
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // STORE OWNER INTEGRATIONS: Combined Paymob, Google Sheets & Free Email Verification Settings
  app.get("/api/settings/integrations", (req, res) => {
    const hasGoogleSheet = !!(currentSettings.googleSheetWebhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL);
    const hasPaymobKey = !!(currentSettings.paymob.apiKey || process.env.PAYMOB_API_KEY);
    const hasGmail = !!((currentSettings.emailVerification?.gmailUser && currentSettings.emailVerification?.gmailAppPassword) || (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD));

    res.json({
      googleSheetWebhookUrl: currentSettings.googleSheetWebhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL || "",
      hasGoogleSheet,
      paymob: {
        ...currentSettings.paymob,
        apiKey: currentSettings.paymob.apiKey ? `${currentSettings.paymob.apiKey.slice(0, 8)}...` : (process.env.PAYMOB_API_KEY ? `${process.env.PAYMOB_API_KEY.slice(0, 8)}...` : ""),
        publicKey: currentSettings.paymob.publicKey || process.env.PAYMOB_PUBLIC_KEY || "",
        secretKey: currentSettings.paymob.secretKey ? "••••••••••••" : (process.env.PAYMOB_SECRET_KEY ? "••••••••••••" : ""),
        cardIntegrationId: currentSettings.paymob.cardIntegrationId || process.env.PAYMOB_INTEGRATION_ID_CARD || "",
        walletIntegrationId: currentSettings.paymob.walletIntegrationId || process.env.PAYMOB_INTEGRATION_ID_WALLET || "",
        iframeId: currentSettings.paymob.iframeId || process.env.PAYMOB_IFRAME_ID || "",
        hmacSecret: currentSettings.paymob.hmacSecret ? "••••••••••••" : (process.env.PAYMOB_HMAC ? "••••••••••••" : ""),
        isLive: Boolean(currentSettings.paymob.isLive),
      },
      hasPaymobKey,
      emailVerification: {
        provider: "gmail",
        isFreeFirebaseActive: true,
        hasGmail,
        gmailUser: currentSettings.emailVerification?.gmailUser || process.env.GMAIL_USER || "",
        hasGmailAppPassword: !!(currentSettings.emailVerification?.gmailAppPassword || process.env.GMAIL_APP_PASSWORD),
      },
      otp: {
        provider: hasGmail ? "gmail" : "firebase_auth",
        configured: true,
        hasGmail,
      },
    });
  });

  // TEST GMAIL SMTP OTP CONNECTION
  app.post("/api/settings/test-gmail", async (req, res) => {
    try {
      const { gmailUser, gmailAppPassword, recipientEmail } = req.body;
      const user = (gmailUser || currentSettings.emailVerification?.gmailUser || process.env.GMAIL_USER || "").trim();
      const pass = (gmailAppPassword || currentSettings.emailVerification?.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || "").trim();

      if (!user || !pass) {
        return res.status(400).json({
          success: false,
          error: "Gmail address and 16-character App Password are required to test connection.",
        });
      }

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
      });

      await transporter.verify();

      // Send real test email
      const target = (recipientEmail || user).trim();
      const testCode = Math.floor(100000 + Math.random() * 900000).toString();
      await transporter.sendMail({
        from: `"Medga Store" <${user}>`,
        to: target,
        subject: `[Medga Store] رمز التحقق التجريبي: ${testCode}`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 480px; margin: auto;">
            <h3 style="color: #a855f7; margin-top: 0;">🎮 متجر ميدجا - اختبار إرسال البريد بنجاح!</h3>
            <p style="color: #cbd5e1; font-size: 14px;">تم التحقق من إعدادات Gmail SMTP بنجاح. رمز التأكيد التجريبي الخاص بك:</p>
            <div style="text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #38bdf8; background: #1e293b; padding: 10px 24px; border-radius: 8px;">
                ${testCode}
              </span>
            </div>
            <p style="color: #94a3b8; font-size: 12px;">تاريخ الاختبار: ${new Date().toLocaleString('ar-EG')}</p>
          </div>
        `,
      });

      return res.json({
        success: true,
        message: `Gmail SMTP connected and test OTP code sent successfully to ${target}!`,
      });
    } catch (err: any) {
      console.error("Gmail test error:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to authenticate with Gmail SMTP. Make sure 2-Step Verification is ON and you generated a 16-character App Password.",
      });
    }
  });

  app.post("/api/settings/integrations", (req, res) => {
    try {
      const { googleSheetWebhookUrl, paymob, emailVerification } = req.body;
      if (typeof googleSheetWebhookUrl === "string") {
        currentSettings.googleSheetWebhookUrl = googleSheetWebhookUrl.trim();
      }
      if (paymob && typeof paymob === "object") {
        currentSettings.paymob = {
          ...currentSettings.paymob,
          apiKey: (typeof paymob.apiKey === "string" && !paymob.apiKey.includes("...")) ? paymob.apiKey.trim() : currentSettings.paymob.apiKey,
          publicKey: typeof paymob.publicKey === "string" ? paymob.publicKey.trim() : currentSettings.paymob.publicKey,
          secretKey: (typeof paymob.secretKey === "string" && !paymob.secretKey.includes("•••")) ? paymob.secretKey.trim() : currentSettings.paymob.secretKey,
          cardIntegrationId: typeof paymob.cardIntegrationId === "string" ? paymob.cardIntegrationId.trim() : currentSettings.paymob.cardIntegrationId,
          walletIntegrationId: typeof paymob.walletIntegrationId === "string" ? paymob.walletIntegrationId.trim() : currentSettings.paymob.walletIntegrationId,
          iframeId: typeof paymob.iframeId === "string" ? paymob.iframeId.trim() : currentSettings.paymob.iframeId,
          hmacSecret: (typeof paymob.hmacSecret === "string" && !paymob.hmacSecret.includes("•••")) ? paymob.hmacSecret.trim() : currentSettings.paymob.hmacSecret,
          isLive: typeof paymob.isLive === "boolean" ? paymob.isLive : currentSettings.paymob.isLive,
        };
      }
      if (emailVerification && typeof emailVerification === "object") {
        currentSettings.emailVerification = {
          ...currentSettings.emailVerification,
          provider: "firebase_auth",
          gmailUser: typeof emailVerification.gmailUser === "string" ? emailVerification.gmailUser.trim() : currentSettings.emailVerification.gmailUser,
          gmailAppPassword: typeof emailVerification.gmailAppPassword === "string" ? emailVerification.gmailAppPassword.trim() : currentSettings.emailVerification.gmailAppPassword,
        };
      }
      saveSettings(currentSettings);
      return res.json({ success: true, message: "Settings saved successfully" });
    } catch (err: any) {
      console.error("Failed to save integrations settings:", err);
      return res.status(500).json({ error: "Failed to save integrations" });
    }
  });

  // TEST PAYMOB GATEWAY CONNECTION (Verifies real Paymob API authentication token)
  app.post("/api/paymob/test", async (req, res) => {
    try {
      const keyToTest = req.body.apiKey || currentSettings.paymob.apiKey || process.env.PAYMOB_API_KEY;
      if (!keyToTest) {
        return res.status(400).json({
          success: false,
          error: "No Paymob API Key provided. Enter your API Key in the Store Owner Portal or PAYMOB_API_KEY environment variable.",
        });
      }

      const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: keyToTest }),
      });

      const authData = await authRes.json();
      if (!authRes.ok || !authData.token) {
        return res.status(400).json({
          success: false,
          error: authData.detail || authData.message || "Paymob rejected authentication. Please check your API key.",
          details: authData,
        });
      }

      return res.json({
        success: true,
        message: "Paymob Gateway connected successfully! Token authenticated with Paymob servers.",
        profileId: authData.profile?.id || "Active",
      });
    } catch (err: any) {
      console.error("Paymob test error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // CREATE PAYMOB PAYMENT (Real Cards & Mobile Wallets via official Paymob Accept API)
  app.post("/api/paymob/create-payment", async (req, res) => {
    try {
      const {
        amount,
        orderNumber,
        customerName,
        customerEmail,
        customerPhone,
        paymentMethod, // 'card' | 'wallet'
        walletPhone,
        items,
      } = req.body;

      const apiKey = currentSettings.paymob.apiKey || process.env.PAYMOB_API_KEY;
      const cardIntegrationId = currentSettings.paymob.cardIntegrationId || process.env.PAYMOB_INTEGRATION_ID_CARD;
      const walletIntegrationId = currentSettings.paymob.walletIntegrationId || process.env.PAYMOB_INTEGRATION_ID_WALLET;
      const iframeId = currentSettings.paymob.iframeId || process.env.PAYMOB_IFRAME_ID || "1";

      // If credentials not configured, DO NOT simulate or fake. Return genuine error!
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          configured: false,
          error: "Paymob credentials not configured. Please set PAYMOB_API_KEY and integration IDs in your environment or Store Owner Portal.",
        });
      }

      const integrationId = paymentMethod === "wallet" ? walletIntegrationId : cardIntegrationId;
      if (!integrationId) {
        return res.status(400).json({
          success: false,
          configured: false,
          error: `Paymob ${paymentMethod === "wallet" ? "Mobile Wallet" : "Card"} Integration ID is not configured. Please enter it in the Store Owner Portal.`,
        });
      }

      const totalAmount = Number(amount || 0);
      if (totalAmount <= 0) {
        return res.status(400).json({ success: false, error: "Invalid payment amount." });
      }

      const amountCents = Math.round(totalAmount * 100);

      // Step 1: Paymob Authentication Token
      const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey }),
      });
      const authData = await authRes.json();
      if (!authRes.ok || !authData.token) {
        return res.status(400).json({
          success: false,
          error: "Paymob authentication rejected. Please verify your API Key.",
          details: authData,
        });
      }
      const authToken = authData.token;

      // Step 2: Paymob Order Registration
      const actualOrderNumber = orderNumber || `SST-${Date.now()}`;
      const orderRes = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_token: authToken,
          delivery_needed: "false",
          amount_cents: amountCents.toString(),
          currency: "EGP",
          merchant_order_id: actualOrderNumber,
          items: (items || []).map((i: any) => ({
            name: i.name || "Digital Item",
            amount_cents: Math.round(Number(i.price || 0) * 100).toString(),
            description: i.details || "Digital Game or Service Delivery",
            quantity: "1",
          })),
        }),
      });
      const orderRespData = await orderRes.json();
      if (!orderRes.ok || !orderRespData.id) {
        return res.status(400).json({
          success: false,
          error: "Paymob order registration failed.",
          details: orderRespData,
        });
      }
      const paymobOrderId = orderRespData.id;

      // Step 3: Paymob Payment Key Request
      const nameParts = (customerName || "Customer").trim().split(" ");
      const firstName = nameParts[0] || "Customer";
      const lastName = nameParts.slice(1).join(" ") || "Client";

      const keyRes = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_token: authToken,
          amount_cents: amountCents.toString(),
          expiration: 3600,
          order_id: paymobOrderId,
          billing_data: {
            apartment: "NA",
            email: customerEmail || "customer@medgastore.com",
            floor: "NA",
            first_name: firstName,
            street: "NA",
            building: "NA",
            phone_number: customerPhone || "01000000000",
            shipping_method: "PKG",
            postal_code: "NA",
            city: "Cairo",
            country: "EG",
            last_name: lastName,
            state: "Cairo",
          },
          currency: "EGP",
          integration_id: integrationId,
          lock_order_when_paid: "false",
        }),
      });
      const keyData = await keyRes.json();
      if (!keyRes.ok || !keyData.token) {
        return res.status(400).json({
          success: false,
          error: `Paymob payment key generation failed. Verify Integration ID (${integrationId}) in Store Owner Portal.`,
          details: keyData,
        });
      }
      const paymentKey = keyData.token;

      // Step 4: Dispatch payment based on method
      if (paymentMethod === "wallet") {
        const walletTargetPhone = (walletPhone || customerPhone || "").trim();
        if (!walletTargetPhone) {
          return res.status(400).json({ success: false, error: "Mobile wallet phone number is required for wallet payment." });
        }

        const walletRes = await fetch("https://accept.paymob.com/api/acceptance/payments/pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: {
              identifier: walletTargetPhone,
              subtype: "WALLET",
            },
            payment_token: paymentKey,
          }),
        });
        const walletData = await walletRes.json();
        return res.json({
          success: true,
          mode: currentSettings.paymob.isLive ? "live" : "sandbox",
          paymobOrderId,
          paymentKey,
          redirectionUrl: walletData.redirect_url || walletData.iframe_redirection_url || "",
          walletResponse: walletData,
        });
      }

      // Card payment: Return official Paymob hosted iframe URL
      const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey}`;
      return res.json({
        success: true,
        mode: currentSettings.paymob.isLive ? "live" : "sandbox",
        paymobOrderId,
        paymentKey,
        iframeUrl,
      });
    } catch (err: any) {
      console.error("Paymob payment error:", err);
      return res.status(500).json({ success: false, error: "Failed to initiate Paymob payment", message: err.message });
    }
  });

  // SECURE SERVER-SIDE PAYMOB PAYMENT VERIFICATION
  // Queries Paymob transaction API directly to verify real transaction status
  app.get("/api/paymob/verify-payment", async (req, res) => {
    try {
      const transactionId = req.query.transactionId as string;
      const orderNumber = req.query.orderNumber as string;

      if (!transactionId && !orderNumber) {
        return res.status(400).json({ success: false, error: "transactionId or orderNumber is required." });
      }

      const apiKey = currentSettings.paymob.apiKey || process.env.PAYMOB_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ success: false, error: "Paymob API key not configured on server." });
      }

      // Get Paymob auth token
      const authRes = await fetch("https://accept.paymob.com/api/auth/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey }),
      });
      const authData = await authRes.json();
      if (!authRes.ok || !authData.token) {
        return res.status(400).json({ success: false, error: "Paymob authentication failed during verification." });
      }
      const authToken = authData.token;

      // Query transaction directly from Paymob
      if (transactionId) {
        const txRes = await fetch(`https://accept.paymob.com/api/acceptance/transactions/${encodeURIComponent(transactionId)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        });
        const txData = await txRes.json();

        if (txRes.ok && txData.id) {
          const isSuccess = txData.success === true && txData.pending === false;
          const isPending = txData.pending === true;

          // Update order in database only based on real Paymob verification
          const merchantOrderId = txData.order?.merchant_order_id || orderNumber;
          if (merchantOrderId) {
            currentOrders = currentOrders.map((ord) => {
              if (ord.orderNumber === merchantOrderId) {
                const updated = {
                  ...ord,
                  paymentStatus: isSuccess ? "paid" : (isPending ? "pending" : "failed"),
                  status: isSuccess ? "Processing" : (isPending ? "Pending Payment" : "Payment Failed"),
                  paymobTransactionId: txData.id,
                };
                if (isSuccess) {
                  forwardOrderToGoogleSheet(updated).catch(console.error);
                }
                return updated;
              }
              return ord;
            });
            saveOrders(currentOrders);
          }

          return res.json({
            verified: true,
            success: isSuccess,
            pending: isPending,
            transactionId: txData.id,
            status: isSuccess ? "paid" : (isPending ? "pending" : "failed"),
            data: txData,
          });
        }
      }

      // If queried by orderNumber, search current verified orders
      if (orderNumber) {
        const matching = currentOrders.find((o) => o.orderNumber === orderNumber);
        if (matching) {
          return res.json({
            verified: true,
            success: matching.paymentStatus === "paid",
            pending: matching.paymentStatus === "pending",
            status: matching.paymentStatus,
          });
        }
      }

      return res.json({ verified: false, success: false, message: "Transaction not yet verified by gateway." });
    } catch (err: any) {
      console.error("Paymob verification inquiry error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // PAYMOB WEBHOOK / TRANSACTION CALLBACK (With official HMAC validation & deduplication)
  const processedPaymobWebhooks = new Set<string>();

  app.post("/api/paymob/callback", async (req, res) => {
    try {
      const obj = req.body?.obj || req.body;
      const merchantOrderId = obj.order?.merchant_order_id;
      const transactionId = obj.id ? String(obj.id) : null;

      // Prevent duplicate processing of the same transaction notification
      if (transactionId && processedPaymobWebhooks.has(transactionId)) {
        console.log(`[Paymob Webhook] Transaction ${transactionId} already processed. Acknowledging.`);
        return res.json({ received: true, duplicate: true });
      }

      // HMAC Verification if secret is configured
      const hmacSecret = currentSettings.paymob.hmacSecret || process.env.PAYMOB_HMAC;
      if (hmacSecret && req.query.hmac) {
        const concatenated = [
          obj.amount_cents ?? "",
          obj.created_at ?? "",
          obj.currency ?? "",
          obj.error_occured ?? "",
          obj.has_parent_transaction ?? "",
          obj.id ?? "",
          obj.integration_id ?? "",
          obj.is_3d_secure ?? "",
          obj.is_auth ?? "",
          obj.is_capture ?? "",
          obj.is_refunded ?? "",
          obj.is_standalone_payment ?? "",
          obj.is_voided ?? "",
          obj.order?.id ?? "",
          obj.owner ?? "",
          obj.pending ?? "",
          obj.source_data?.pan ?? "",
          obj.source_data?.sub_type ?? "",
          obj.source_data?.type ?? "",
          obj.success ?? "",
        ].join("");

        const calculatedHmac = crypto.createHmac("sha512", hmacSecret).update(concatenated).digest("hex");
        if (calculatedHmac !== req.query.hmac) {
          console.warn("[Paymob Webhook] HMAC verification failed. Unauthorized callback rejected.");
          return res.status(401).json({ error: "Invalid HMAC signature" });
        }
      }

      const isSuccess = obj.success === true && obj.pending === false;
      const isPending = obj.pending === true;

      console.log(`[Paymob Webhook] Order: ${merchantOrderId}, Success: ${isSuccess}, Pending: ${isPending}, TxID: ${transactionId}`);

      if (transactionId) {
        processedPaymobWebhooks.add(transactionId);
      }

      if (merchantOrderId) {
        currentOrders = currentOrders.map((ord) => {
          if (ord.orderNumber === merchantOrderId) {
            const updated = {
              ...ord,
              paymentStatus: isSuccess ? "paid" : (isPending ? "pending" : "failed"),
              status: isSuccess ? "Processing" : (isPending ? "Pending Payment" : "Payment Failed"),
              paymobTransactionId: transactionId,
            };
            if (isSuccess) {
              forwardOrderToGoogleSheet(updated).catch(console.error);
            }
            return updated;
          }
          return ord;
        });
        saveOrders(currentOrders);
      }

      return res.json({ received: true });
    } catch (err: any) {
      console.error("Paymob callback error:", err);
      return res.status(500).json({ error: "Webhook handling error" });
    }
  });

  // REAL EMAIL VERIFICATION SYSTEM (Rate-limited, cryptographically hashed, expired & single-use)
  // Check email verification provider status
  app.get("/api/otp/status", (req, res) => {
    const hasGmail = !!((currentSettings.emailVerification?.gmailUser && currentSettings.emailVerification?.gmailAppPassword) || (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD));

    return res.json({
      configured: true,
      provider: "firebase_auth",
      type: "email",
      supportsFreeFirebase: true,
      hasGmail,
    });
  });

  // Client registers verified email (from Firebase Auth / Google Sign-In)
  app.post("/api/email-verify/confirm-firebase", (req, res) => {
    const { email } = req.body;
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return res.status(400).json({ success: false, error: "Valid email is required" });
    }
    const verificationToken = crypto.randomBytes(32).toString("hex");
    verifiedTokens.set(verificationToken, { target: cleanEmail, expiresAt: Date.now() + 60 * 60 * 1000 });
    return res.json({ success: true, verified: true, verificationToken, email: cleanEmail });
  });

  // Send real email verification code via Free Gmail SMTP or Free Firebase Auth
  app.post("/api/otp/send", async (req, res) => {
    try {
      const { target } = req.body;
      const cleanEmail = (target || "").trim().toLowerCase();

      if (!cleanEmail || !cleanEmail.includes("@")) {
        return res.status(400).json({
          success: false,
          error: "A valid email address is required. SMS OTP has been discontinued.",
        });
      }

      // Rate limiting: Maximum 3 requests per 10 minutes
      const now = Date.now();
      const clientIp = req.ip || req.socket.remoteAddress || "ip";
      const rateKey = `${cleanEmail}_${clientIp}`;
      const rlEntry = otpRateLimit.get(rateKey);

      if (rlEntry && now - rlEntry.windowStart < 10 * 60 * 1000) {
        if (rlEntry.count >= 3) {
          return res.status(429).json({
            success: false,
            error: "Too many verification requests. Please wait 10 minutes before requesting a new code.",
          });
        }
        rlEntry.count += 1;
      } else {
        otpRateLimit.set(rateKey, { count: 1, windowStart: now });
      }

      const gmailUser = currentSettings.emailVerification?.gmailUser || process.env.GMAIL_USER;
      const gmailPass = currentSettings.emailVerification?.gmailAppPassword || process.env.GMAIL_APP_PASSWORD;

      if (gmailUser && gmailPass) {
        // Generate cryptographically secure 6-digit code
        const code = crypto.randomInt(100000, 1000000).toString();
        const salt = crypto.randomBytes(16).toString("hex");
        const codeHash = crypto.createHmac("sha256", salt).update(code).digest("hex");

        otpStore.set(cleanEmail, {
          target: cleanEmail,
          type: "email",
          codeHash,
          salt,
          expiresAt: now + 10 * 60 * 1000, // 10 minutes
          attempts: 0,
          maxAttempts: 3,
          createdAt: now,
        });

        // 100% Free Gmail SMTP (500 free emails/day via Google App Password)
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: gmailUser.trim(),
            pass: gmailPass.trim(),
          },
        });

        await transporter.sendMail({
          from: `"Medga Store" <${gmailUser.trim()}>`,
          to: cleanEmail,
          subject: `رمز تأكيد طلبك في متجر ميدجا: ${code}`,
          html: `
            <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 28px; border-radius: 16px; max-width: 500px; margin: auto;">
              <h2 style="color: #a855f7; margin-top: 0; font-size: 22px;">🎮 متجر ميدجا للألعاب - تأكيد البريد</h2>
              <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">استخدم رمز التحقق التالي لإتمام طلبك على موقع متجر ميدجا:</p>
              <div style="text-align: center; margin: 24px 0;">
                <span style="display: inline-block; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #38bdf8; background-color: #1e293b; padding: 12px 28px; border-radius: 12px; border: 1px solid #334155;">
                  ${code}
                </span>
              </div>
              <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
                • صلاحية الرمز: 10 دقائق فقط.<br/>
                • لا تشارك هذا الرمز مع أي شخص لحماية حسابك.<br/>
                • للاستفسار، تواصل مع المالك سليم أحمد على واتساب: 01042240852
              </p>
            </div>
          `,
        });

        return res.json({
          success: true,
          provider: "gmail",
          message: `Verification code sent to ${cleanEmail}. Please check your inbox.`,
          expiresInSeconds: 600,
        });
      }

      // If no custom SMTP credentials are set, instruct user to use Free Firebase Authentication
      return res.status(400).json({
        success: false,
        configured: false,
        error: "Free Firebase Email Verification is active. Please use 1-Click Google Verify or click 'Send Link' in the checkout modal.",
      });
    } catch (err: any) {
      console.error("Email verification dispatch error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Verify real email code
  app.post("/api/otp/verify", (req, res) => {
    try {
      const { target, code } = req.body;
      const cleanTarget = (target || "").trim().toLowerCase();
      const cleanCode = (code || "").trim();

      if (!cleanTarget || !cleanCode) {
        return res.status(400).json({ success: false, error: "Target email and verification code are required." });
      }

      const stored = otpStore.get(cleanTarget);
      if (!stored) {
        return res.status(400).json({
          success: false,
          error: "No active verification code found for this email. Please request a new code or verify with Google.",
        });
      }

      const now = Date.now();
      if (now > stored.expiresAt) {
        otpStore.delete(cleanTarget);
        return res.status(400).json({
          success: false,
          error: "Verification code has expired. Please request a new code.",
        });
      }

      if (stored.attempts >= stored.maxAttempts) {
        otpStore.delete(cleanTarget);
        return res.status(400).json({
          success: false,
          error: "Maximum verification attempts exceeded. Code has been invalidated. Please request a new code.",
        });
      }

      // Timing-safe comparison of code hash
      const inputHash = crypto.createHmac("sha256", stored.salt).update(cleanCode).digest("hex");
      const hashBufferA = Buffer.from(inputHash, "hex");
      const hashBufferB = Buffer.from(stored.codeHash, "hex");

      if (hashBufferA.length !== hashBufferB.length || !crypto.timingSafeEqual(hashBufferA, hashBufferB)) {
        stored.attempts += 1;
        const attemptsLeft = stored.maxAttempts - stored.attempts;
        if (attemptsLeft <= 0) {
          otpStore.delete(cleanTarget);
        }
        return res.status(400).json({
          success: false,
          error: `Incorrect verification code. ${attemptsLeft > 0 ? `${attemptsLeft} attempt(s) remaining.` : "Code invalidated."}`,
        });
      }

      // Success: Invalidate OTP immediately (single use protection)
      otpStore.delete(cleanTarget);

      // Generate single-use verification token valid for 30 minutes
      const verificationToken = crypto.randomBytes(32).toString("hex");
      verifiedTokens.set(verificationToken, { target: cleanTarget, expiresAt: now + 30 * 60 * 1000 });

      console.log(`[EmailVerify] Email ${cleanTarget} successfully verified.`);
      return res.json({
        success: true,
        verified: true,
        verificationToken,
        message: "Email verification successful.",
      });
    } catch (err: any) {
      console.error("OTP verify error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Query email verification status
  app.post("/api/email-verify/status", (req, res) => {
    const { email } = req.body;
    const clean = (email || "").trim().toLowerCase();
    if (!clean) return res.status(400).json({ verified: false });

    for (const [, record] of verifiedTokens.entries()) {
      if (record.target === clean && record.expiresAt > Date.now()) {
        return res.json({ verified: true, email: clean });
      }
    }
    return res.json({ verified: false, email: clean });
  });

  // Support Message / Ticket endpoint
  app.post("/api/support/message", (req, res) => {
    const { name, phone, message, orderNumber } = req.body;
    console.log(`[Support Ticket] From ${name || "Customer"} (${phone || "No phone"}): ${message} [Order: ${orderNumber || "None"}]`);
    return res.json({ success: true, message: "Ticket received. Our support team has been notified!" });
  });

  // AI Support Handler - Works for both /api/ai-chat and /api/chat
  const handleAiChat = async (req: express.Request, res: express.Response) => {
    try {
      let rawMessages = req.body.messages;
      if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
        if (typeof req.body.message === "string" && req.body.message.trim()) {
          rawMessages = [{ role: "user", content: req.body.message.trim() }];
        } else {
          return res.status(400).json({ error: "A message or messages array is required." });
        }
      }

      const apiKey = process.env.GEMINI_API_KEY;
      const lastUserMsg = (rawMessages[rawMessages.length - 1]?.content || "").toLowerCase();

      const cleanAiReply = (text: string): string => {
        if (!text) return "";
        return text
          // Remove runs of two or more asterisks like **bold** or ****
          .replace(/\*{2,}/g, "")
          // Convert markdown star bullet points to clean bullets
          .replace(/^(\s*)\*\s+/gm, "$1• ")
          .trim();
      };

      // Smart fallback responses engine without asterisk clutter
      const getFallbackReply = () => {
        if (lastUserMsg.includes("pay") || lastUserMsg.includes("دفع") || lastUserMsg.includes("instapay") || lastUserMsg.includes("انستاباي") || lastUserMsg.includes("فودافون") || lastUserMsg.includes("vodafone") || lastUserMsg.includes("telda")) {
          return "💳 Medga Store Official Payment Methods:\n• InstaPay: 01212072882\n• Vodafone Cash: 01042240852\n• Telda: @selimahmed1\n• Paymob: Visa, Mastercard, Meeza, and Mobile Wallets.\n\nYou can upload a transfer screenshot directly during website checkout for instant verification!";
        }
        if (lastUserMsg.includes("selim") || lastUserMsg.includes("سليم") || lastUserMsg.includes("owner") || lastUserMsg.includes("مالك") || lastUserMsg.includes("whatsapp") || lastUserMsg.includes("واتساب")) {
          return "👑 Direct Access to Selim Ahmed (Store Owner):\nYou can reach Selim directly on WhatsApp at +20 104 224 0852 (or tap 'Reach Selim (Owner)' above) for custom deals, special game requests, and instant assistance!";
        }
        if (lastUserMsg.includes("point") || lastUserMsg.includes("نقط") || lastUserMsg.includes("نقاط") || lastUserMsg.includes("مكافأ")) {
          return "🎁 Medga Store Loyalty Points:\n• Earn points on game purchases, suggestions, and customer reviews!\n• Conversion: Every 100 Points = 1 L.E discount.\n• Redeem directly during checkout to save on your orders!";
        }
        if (lastUserMsg.includes("order") || lastUserMsg.includes("طلب") || lastUserMsg.includes("sst-") || lastUserMsg.includes("medga-") || lastUserMsg.includes("track")) {
          return "📦 Order Tracking & Fulfillment:\n• Every order generates a verified ID (e.g. MEDGA-2026-XXXXXX).\n• Delivery takes 5–30 minutes directly to your console or account.\n• You can enter your Order ID anytime in the Live Order Tracker on the top menu to view real-time status!";
        }
        if (lastUserMsg.includes("fc") || lastUserMsg.includes("fifa") || lastUserMsg.includes("gta") || lastUserMsg.includes("v-bucks") || lastUserMsg.includes("vbucks") || lastUserMsg.includes("game") || lastUserMsg.includes("لعب")) {
          return "🎮 Top PlayStation Games & Offers:\n• EA Sports FC 26: 1,000 EGP\n• GTA VI Pre-order: 1,500 EGP\n• Fortnite V-Bucks: starting at 300 EGP for 1,000 V-Bucks\n• PS Plus Subscriptions: Essential, Extra, & Deluxe available!\nAdd items to your cart and checkout directly on the site.";
        }
        return "👋 Welcome to Medga Store! How can I assist you with games, PlayStation Plus, Fortnite V-Bucks, Rocket League credits, or order tracking today? You can also message owner Selim on WhatsApp at 01042240852.";
      };

      if (!apiKey) {
        return res.json({ reply: cleanAiReply(getFallbackReply()) });
      }

      const ai = getAiClient();

      const systemInstruction = `You are Medga Store AI Support, an expert, friendly, and enthusiastic customer service assistant for Medga Store - Egypt's premier gaming store & digital services.

STORE CATALOG & DETAILS:
1. PlayStation Games:
   - EA Sports FC 26 (1,000 EGP)
   - Grand Theft Auto VI Pre-order (1,500 EGP)
   - Marvel's Spider-Man 2 (900 EGP)
   - God of War Ragnarök (800 EGP)
   - Call of Duty: Black Ops 6 (1,200 EGP)
   - Custom game requests: Customers can request any unlisted game via WhatsApp!

2. PlayStation Plus Subscriptions:
   - Essential: 1 Month (350 EGP), 12 Months (1,250 EGP)
   - Extra: 1 Month (500 EGP), 12 Months (1,875 EGP)
   - Deluxe / Premium: 1 Month (600 EGP), 12 Months (2,200 EGP)

3. Fortnite V-Bucks:
   - 1,000 V-Bucks (300 EGP)
   - 2,800 V-Bucks (750 EGP)
   - 5,000 V-Bucks (1,250 EGP)
   - 13,500 V-Bucks (2,900 EGP)

4. Rocket League Credits:
   - 500 Credits (180 EGP)
   - 1,100 Credits (360 EGP)
   - 3,000 Credits (900 EGP)
   - 6,500 Credits (1,800 EGP)

5. Hezo Boost (Social Media Growth Services):
   - TikTok Followers (1,000 = 150 EGP)
   - Instagram Followers (1,000 = 120 EGP)
   - TikTok Likes/Views, YouTube Subscribers & Views

6. Payment Methods:
   - Paymob: Visa, MasterCard, Meeza, and Mobile Wallets (Vodafone Cash, Orange Cash, Etisalat Cash, WE Pay)
   - InstaPay: 01212072882
   - Vodafone Cash: 01042240852
   - Telda: @selimahmed1

7. How Ordering Works:
   - Real website orders are placed via Checkout, saved to database and synchronized.
   - Orders can be tracked via real-time Order Tracker with Order ID (e.g. SST-2026-XXXXXX).
   - Delivery is fast and instant (within 5 to 30 minutes after payment verification).

8. Direct WhatsApp Support:
   - Phone / WhatsApp: +201042240852 (01042240852)
   - Store Owner: Selim Ahmed

GUIDELINES & FORMATTING:
- Be friendly, clear, helpful, and concise.
- STRICT FORMATTING RULE: Do NOT use markdown asterisks (never use **text** or ****). Do not bold words with asterisks. Write clean, natural sentences. Use emojis and simple bullet points (• or -) instead.
- Format responses cleanly with readable spacing.
- Answer in English or Arabic depending on user's message language.`;

      // Build turn contents for Gemini generateContent
      const contents = rawMessages.map((m: { role: string; content: string }) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));

      try {
        let response;
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });
        } catch (primaryModelErr: any) {
          console.warn("Primary model gemini-3.8-flash failed, attempting fallback model gemini-3.6-flash:", primaryModelErr?.message);
          response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });
        }

        const replyText = cleanAiReply(response.text || getFallbackReply());
        return res.json({ reply: replyText });
      } catch (geminiErr: any) {
        console.warn("Gemini model error, using smart fallback:", geminiErr?.message);
        return res.json({ reply: cleanAiReply(getFallbackReply()) });
      }
    } catch (err: any) {
      console.error("AI Support Error:", err);
      return res.json({
        reply: "Welcome to Medga Store! How can we assist you today? You can also message Selim on WhatsApp at 01042240852.",
      });
    }
  };

  // Mount on both /api/ai-chat and /api/chat
  app.post("/api/ai-chat", handleAiChat);
  app.post("/api/chat", handleAiChat);

  // Serve static assets from public/ and dist/ directly with high priority
  app.use(express.static(path.join(process.cwd(), "public")));
  app.use("/images", express.static(path.join(process.cwd(), "public", "images")));
  app.use(express.static(path.join(process.cwd(), "dist")));

  // Resilient image resolver middleware: catches all image requests regardless of encoding or subpath
  app.use((req, res, next) => {
    const rawPath = req.path;
    if (/\.(jpg|jpeg|png|webp|svg|gif|ico)$/i.test(rawPath)) {
      const decodedFilename = path.basename(decodeURIComponent(rawPath));
      const candidates = [
        path.join(process.cwd(), "public", decodedFilename),
        path.join(process.cwd(), "public", "images", decodedFilename),
        path.join(process.cwd(), "dist", decodedFilename),
        path.join(process.cwd(), "dist", "images", decodedFilename),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return res.sendFile(candidate);
        }
      }
    }
    next();
  });

  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ProSoskaStation server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
