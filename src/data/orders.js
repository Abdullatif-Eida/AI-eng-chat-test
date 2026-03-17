import { products } from "./products.js";

const productIndex = new Map(products.map((product) => [product.id, product]));

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

export function createOrder({ customerName, email, items, locale = "en" }) {
  const orderNumber = `KS-${nextOrderSeed++}`;
  const city = locale === "ar" ? "Riyadh" : "Riyadh";
  const today = new Date().toISOString().slice(0, 10);
  const scenario = deliveryScenarios[Math.floor(Math.random() * deliveryScenarios.length)];
  const order = {
    orderNumber,
    customerName: customerName?.trim() || "Guest Shopper",
    email: email?.trim() || "guest@example.com",
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
    items: items.map((item) => ({
      productId: item.productId,
      quantity: Math.max(1, Number(item.quantity) || 1)
    }))
  };

  orders.unshift(order);
  return enrichOrder(order);
}
