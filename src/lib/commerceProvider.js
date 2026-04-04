import {
  canCancelOrder,
  createHandoffTicket,
  findProduct,
  getCatalogSummary,
  getPaymentSummary,
  getPolicyAnswer,
  getProductById,
  getRecommendationRationale,
  getReturnPolicySummary,
  getShippingSummary,
  isOrderEligibleForReturn,
  listProductsByCategory,
  recommendProducts
} from "./commerce.js";
import { enrichOrder, orders as seededOrders } from "../data/orders.js";

function isAbsoluteUrl(value = "") {
  return /^https?:\/\//i.test(value);
}

function joinUrl(baseUrl, path) {
  if (!path) {
    return baseUrl;
  }

  if (isAbsoluteUrl(path)) {
    return path;
  }

  return `${String(baseUrl).replace(/\/+$/, "")}/${String(path).replace(/^\/+/, "")}`;
}

function fillTemplate(template = "", variables = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_match, key) => {
    const value = variables[key];
    return value == null ? "" : encodeURIComponent(String(value));
  });
}

function normalizeOrder(order) {
  return order?.subtotalSar != null || order?.totalSar != null ? order : enrichOrder(order);
}

function parseJsonEnv(value) {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function normalizeOrderNumber(orderNumber = "") {
  return String(orderNumber).trim().toUpperCase();
}

function dedupeOrders(entries = []) {
  const byNumber = new Map();

  for (const order of entries) {
    if (!order?.orderNumber) {
      continue;
    }

    byNumber.set(order.orderNumber, order);
  }

  return [...byNumber.values()];
}

function extractOrderSequence(order) {
  const raw = String(order?.orderNumber ?? "");
  const digits = raw
    .split("")
    .filter((char) => char >= "0" && char <= "9")
    .join("");

  return Number(digits) || 0;
}

function sortOrdersNewestFirst(entries = []) {
  return [...entries].sort((left, right) => extractOrderSequence(right) - extractOrderSequence(left));
}

function buildProductSummary(product, locale = "en") {
  return {
    id: product.id,
    name: locale === "ar" ? product.nameAr : product.name,
    category: locale === "ar" ? product.categoryAr : product.category,
    shortDescription: locale === "ar" ? product.shortDescriptionAr : product.shortDescription,
    priceSar: product.priceSar,
    currency: product.currency,
    stockStatus: product.stockStatus,
    rating: product.rating,
    highlights: locale === "ar" ? product.highlightsAr : product.highlights,
    colors: locale === "ar" ? product.colorsAr : product.colors,
    size: locale === "ar" ? product.sizeAr : product.size
  };
}

export function createSeededCommerceProvider() {
  function listVisibleOrders({ customer, knownOrders }) {
    const localOrders = Array.isArray(knownOrders) ? knownOrders.map(enrichOrder) : [];
    const customerEmail = normalizeEmail(customer?.email);
    const providerOrders = customerEmail
      ? seededOrders
          .filter((order) => normalizeEmail(order.email) === customerEmail)
          .map(enrichOrder)
      : [];

    return sortOrdersNewestFirst(dedupeOrders([...localOrders, ...providerOrders]));
  }

  function getOrder({ customer, knownOrders, orderNumber }) {
    const normalized = normalizeOrderNumber(orderNumber);
    if (!normalized) {
      return null;
    }

    return (
      listVisibleOrders({ customer, knownOrders }).find(
        (order) => normalizeOrderNumber(order.orderNumber) === normalized
      ) ?? null
    );
  }

  return {
    name: "seeded-commerce-provider",

    async getCustomerProfile({ customer }) {
      return customer?.email
        ? {
            name: customer?.name ?? null,
            email: customer.email,
            newsletter: Boolean(customer?.newsletter)
          }
        : null;
    },

    getCatalogData({ query, mode, locale }) {
      if (mode === "catalog_overview") {
        return {
          mode,
          summary: getCatalogSummary(locale),
          matches: []
        };
      }

      if (mode === "category_browse") {
        const matches = listProductsByCategory(query)
          .slice(0, 6)
          .map((product) => buildProductSummary(product, locale));

        return {
          mode,
          summary: matches.length > 0 ? null : getCatalogSummary(locale),
          matches
        };
      }

      if (mode === "recommendation") {
        const matches = recommendProducts(query, locale)
          .slice(0, 4)
          .map((product) => buildProductSummary(product, locale));

        return {
          mode,
          rationale: getRecommendationRationale(query, locale),
          matches
        };
      }

      const product = findProduct(query);
      return {
        mode,
        match: product ? buildProductSummary(product, locale) : null
      };
    },

    getPolicyData({ topic, question, locale }) {
      switch (topic) {
        case "returns":
          return getReturnPolicySummary(locale);
        case "shipping":
          return getShippingSummary(locale);
        case "payments":
          return getPaymentSummary(locale);
        default:
          return getPolicyAnswer(question, locale);
      }
    },

    listVisibleOrders,

    getOrder,

    getLocalizedOrderItems(order, locale = "en") {
      return (order.items ?? []).map((item) => {
        const product = getProductById(item.productId);
        const name = locale === "ar" ? product?.nameAr ?? product?.name : product?.name ?? product?.nameAr;
        return `${item.quantity}x ${name ?? item.productId}`;
      });
    },

    getReturnAssessment({ order, locale }) {
      return isOrderEligibleForReturn(order, locale);
    },

    getCancellationAssessment({ order, locale }) {
      return {
        eligible: canCancelOrder(order),
        reason: canCancelOrder(order)
          ? locale === "ar"
            ? "الطلب ما زال قبل الشحن وقد يكون قابلاً للإلغاء أو تعديل العنوان."
            : "The order is still before shipment and may still be cancellable or editable."
          : locale === "ar"
            ? "الطلب تجاوز مرحلة الإلغاء المباشر، والأفضل مراجعته مع موظف دعم أو بدء إرجاع لاحقاً."
            : "The order has passed the direct-cancellation stage, so the next best step is support review or a later return flow."
      };
    },

    createHandoff({ customerMessage, intent, locale, sessionId, customer }) {
      return createHandoffTicket({
        customerMessage,
        intent,
        locale,
        sessionId,
        customer
      });
    }
  };
}

function normalizeRemoteOrders(payload) {
  if (Array.isArray(payload)) {
    return payload.map(normalizeOrder);
  }

  if (Array.isArray(payload?.orders)) {
    return payload.orders.map(normalizeOrder);
  }

  return [];
}

function normalizeRemoteProfile(payload, customer) {
  const profile = payload?.profile ?? payload ?? null;
  if (!profile || typeof profile !== "object") {
    return customer?.email
      ? {
          name: customer?.name ?? null,
          email: customer.email,
          newsletter: Boolean(customer?.newsletter)
        }
      : null;
  }

  return {
    ...profile,
    email: profile.email ?? customer?.email ?? null,
    name: profile.name ?? customer?.name ?? null,
    newsletter: Boolean(profile.newsletter ?? customer?.newsletter)
  };
}

export function createHttpCommerceProvider({
  baseUrl,
  apiKey,
  headers = {},
  profilePath = "/customers/profile?email={email}",
  ordersPath = "/orders?email={email}",
  orderPath = "/orders/{orderNumber}",
  fetchImpl = fetch
}) {
  const seeded = createSeededCommerceProvider();

  async function requestJson(pathTemplate, variables) {
    const url = joinUrl(baseUrl, fillTemplate(pathTemplate, variables));
    const response = await fetchImpl(url, {
      headers: {
        Accept: "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        ...headers
      }
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Commerce API request failed with ${response.status}: ${text.slice(0, 300)}`);
    }

    return response.json();
  }

  async function getRemoteOrders({ customer }) {
    if (!customer?.email) {
      return [];
    }

    const payload = await requestJson(ordersPath, {
      email: customer.email,
      customerId: customer.customerId ?? customer.id ?? ""
    });

    return normalizeRemoteOrders(payload);
  }

  return {
    name: "http-commerce-provider",

    async getCustomerProfile({ customer }) {
      if (!customer?.email) {
        return null;
      }

      const payload = await requestJson(profilePath, {
        email: customer.email,
        customerId: customer.customerId ?? customer.id ?? ""
      });

      return normalizeRemoteProfile(payload, customer);
    },

    getCatalogData: seeded.getCatalogData,
    getPolicyData: seeded.getPolicyData,
    getLocalizedOrderItems: seeded.getLocalizedOrderItems,
    getReturnAssessment: seeded.getReturnAssessment,
    getCancellationAssessment: seeded.getCancellationAssessment,
    createHandoff: seeded.createHandoff,

    async listVisibleOrders({ customer, knownOrders }) {
      const localOrders = Array.isArray(knownOrders) ? knownOrders.map(normalizeOrder) : [];
      const remoteOrders = await getRemoteOrders({ customer });
      return sortOrdersNewestFirst(dedupeOrders([...localOrders, ...remoteOrders]));
    },

    async getOrder({ customer, knownOrders, orderNumber }) {
      const normalized = normalizeOrderNumber(orderNumber);
      if (!normalized) {
        return null;
      }

      const visibleOrders = await this.listVisibleOrders({ customer, knownOrders });
      const visibleMatch = visibleOrders.find(
        (order) => normalizeOrderNumber(order.orderNumber) === normalized
      );

      if (visibleMatch) {
        return visibleMatch;
      }

      if (!customer?.email) {
        return null;
      }

      const payload = await requestJson(orderPath, {
        orderNumber: normalized,
        email: customer.email,
        customerId: customer.customerId ?? customer.id ?? ""
      });

      const order = normalizeOrder(payload?.order ?? payload);
      if (!order?.orderNumber) {
        return null;
      }

      if (normalizeEmail(order.email) && normalizeEmail(order.email) !== normalizeEmail(customer.email)) {
        return null;
      }

      return order;
    }
  };
}

export function createCommerceProviderFromEnv(env = process.env) {
  const baseUrl = env.COMMERCE_API_BASE_URL;

  if (!baseUrl) {
    return createSeededCommerceProvider();
  }

  return createHttpCommerceProvider({
    baseUrl,
    apiKey: env.COMMERCE_API_KEY || env.API_COMMERCE_KEY || null,
    headers: parseJsonEnv(env.COMMERCE_API_HEADERS_JSON),
    profilePath: env.COMMERCE_CUSTOMER_PROFILE_PATH || "/customers/profile?email={email}",
    ordersPath: env.COMMERCE_CUSTOMER_ORDERS_PATH || "/orders?email={email}",
    orderPath: env.COMMERCE_ORDER_DETAILS_PATH || "/orders/{orderNumber}"
  });
}
