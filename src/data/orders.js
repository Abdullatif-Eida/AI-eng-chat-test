import { products } from "./products.js";

const productIndex = new Map(products.map((product) => [product.id, product]));
const MAX_ORDER_ITEMS = 12;
const MAX_ITEM_QUANTITY = 10;
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 200;
const MAX_PHONE_LENGTH = 24;
const MAX_CUSTOMER_NUMBER_LENGTH = 64;

let nextOrderSeed = 10540;

const deliveryScenarios = [
  {
    status: "Processing",
    eta: "Expected to ship tomorrow",
    deliveryDate: null,
    paymentStatus: "Paid",
    courier: "Pending assignment",
    trackingUrl: null
  },
  {
    status: "Shipped",
    eta: "Expected in 2 days",
    deliveryDate: null,
    paymentStatus: "Paid",
    courier: "SMSA",
    trackingUrl: "tracking"
  },
  {
    status: "Out for delivery",
    eta: "Today before 8:00 PM",
    deliveryDate: null,
    paymentStatus: "Paid",
    courier: "Aramex",
    trackingUrl: "tracking"
  },
  {
    status: "Delivered",
    eta: "Delivered on {date}",
    deliveryDate: "{date}",
    paymentStatus: "Paid",
    courier: "SPL",
    trackingUrl: "tracking"
  }
];

export const orders = [
  {
    orderNumber: "KS-10421",
    customerName: "Maha Alharbi",
    email: "maha@example.com",
    status: "Out for delivery",
    eta: "Today before 8:00 PM",
    city: "Riyadh",
    deliveryDate: "2026-03-14",
    paymentStatus: "Paid",
    courier: "Aramex",
    trackingUrl: "https://tracking.example.com/KS-10421",
    items: [{ productId: "sku012-noise-cancelling-earbuds", quantity: 1 }]
  },
  {
    orderNumber: "KS-10388",
    customerName: "Faisal Alotaibi",
    email: "faisal@example.com",
    status: "Delivered",
    eta: "Delivered on 2026-03-14",
    city: "Jeddah",
    deliveryDate: "2026-03-14",
    paymentStatus: "Paid",
    courier: "SMSA",
    trackingUrl: "https://tracking.example.com/KS-10388",
    items: [{ productId: "sku001-wireless-mouse", quantity: 1 }],
    discounted: false
  },
  {
    orderNumber: "KS-10291",
    customerName: "Layan Saleh",
    email: "layan@example.com",
    status: "Processing",
    eta: "Expected to ship tomorrow",
    city: "Dammam",
    deliveryDate: null,
    paymentStatus: "Cash on delivery",
    courier: "Pending assignment",
    trackingUrl: null,
    items: [{ productId: "sku010-smartwatch", quantity: 2 }]
  }
];

function calculateOrderTotals(items) {
  return items.reduce(
    (totals, item) => {
      const product = productIndex.get(item.productId);
      const lineBase = (product?.basePriceSar ?? 0) * item.quantity;
      const lineTax = (product?.taxSar ?? 0) * item.quantity;

      return {
        subtotalSar: totals.subtotalSar + lineBase,
        taxSar: totals.taxSar + lineTax,
        totalSar: totals.totalSar + lineBase + lineTax
      };
    },
    { subtotalSar: 0, taxSar: 0, totalSar: 0 }
  );
}

export function enrichOrder(order) {
  return {
    ...order,
    ...calculateOrderTotals(order.items)
  };
}

export function listOrders() {
  return orders.map(enrichOrder).reverse();
}

function normalizeName(value = "", fallback = "Guest Shopper") {
  const trimmed = String(value ?? "").trim().slice(0, MAX_NAME_LENGTH);
  return trimmed || fallback;
}

function normalizeEmail(value = "", fallback = "guest@example.com") {
  const trimmed = String(value ?? "").trim().toLowerCase().slice(0, MAX_EMAIL_LENGTH);
  return trimmed || fallback;
}

function normalizePhone(value = "") {
  const trimmed = String(value ?? "").replace(/[^\d+]/g, "").slice(0, MAX_PHONE_LENGTH);
  return trimmed || null;
}

function normalizeCustomerNumber(value = "") {
  const trimmed = String(value ?? "").trim().toUpperCase().replace(/\s+/g, "-").slice(0, MAX_CUSTOMER_NUMBER_LENGTH);
  return trimmed || null;
}

function normalizeOrderItems(items = []) {
  if (!Array.isArray(items)) {
    throw new TypeError("Invalid order: items must be an array.");
  }

  const dedupedItems = new Map();

  for (const rawItem of items.slice(0, MAX_ORDER_ITEMS)) {
    const productId = String(rawItem?.productId ?? "").trim();
    if (!productIndex.has(productId)) {
      continue;
    }

    const nextQuantity = Math.max(1, Math.min(MAX_ITEM_QUANTITY, Number(rawItem?.quantity) || 1));
    dedupedItems.set(productId, Math.min(
      MAX_ITEM_QUANTITY,
      (dedupedItems.get(productId) ?? 0) + nextQuantity
    ));
  }

  const normalizedItems = Array.from(dedupedItems.entries()).map(([productId, quantity]) => ({
    productId,
    quantity
  }));

  if (normalizedItems.length === 0) {
    throw new TypeError("Invalid order: at least one valid cart item is required.");
  }

  return normalizedItems;
}

export function createOrder({ customerName, email, phone, customerNumber, items, locale = "en" }) {
  const orderNumber = `KS-${nextOrderSeed++}`;
  const city = locale === "ar" ? "Riyadh" : "Riyadh";
  const today = new Date().toISOString().slice(0, 10);
  const scenario = deliveryScenarios[Math.floor(Math.random() * deliveryScenarios.length)];
  const normalizedItems = normalizeOrderItems(items);
  const order = {
    orderNumber,
    customerName: normalizeName(customerName),
    email: normalizeEmail(email),
    phone: normalizePhone(phone),
    customerNumber: normalizeCustomerNumber(customerNumber),
    status: scenario.status,
    eta: scenario.eta.replace("{date}", today),
    city,
    deliveryDate: scenario.deliveryDate ? scenario.deliveryDate.replace("{date}", today) : null,
    paymentStatus: scenario.paymentStatus,
    courier: scenario.courier,
    trackingUrl:
      scenario.trackingUrl === "tracking"
        ? `https://tracking.example.com/${orderNumber}`
        : null,
    items: normalizedItems
  };

  orders.unshift(order);
  return enrichOrder(order);
}
