import { createHash } from "node:crypto";
import { createSeededCommerceProvider } from "./commerceProvider.js";
import {
  createSessionRetentionStore,
  readSessionRetentionValue,
  writeSessionRetentionValue
} from "./sessionRetention.js";

const MAX_CACHE_ENTRIES = 48;
const MAX_IDEMPOTENCY_ENTRIES = 16;
const HANDOFF_IDEMPOTENCY_TTL_MS = 15 * 60 * 1000;

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function normalizePhone(phone = "") {
  return String(phone).replace(/[^\d+]/g, "").slice(0, 24);
}

function normalizeCustomerReference(value = "") {
  return String(value).trim().toUpperCase().replace(/\s+/g, "-").slice(0, 64);
}

function normalizeOrderNumber(orderNumber = "") {
  return String(orderNumber).trim().toUpperCase();
}

function maskEmail(email = "") {
  const [localPart = "", domain = ""] = String(email).split("@");
  if (!localPart || !domain) {
    return null;
  }

  const visible = localPart.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(1, localPart.length - visible.length))}@${domain}`;
}

function maskPhone(phone = "") {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return null;
  }

  const visiblePrefix = normalized.slice(0, Math.min(4, normalized.length));
  const visibleSuffix = normalized.slice(-2);
  const hiddenLength = Math.max(2, normalized.length - visiblePrefix.length - visibleSuffix.length);
  return `${visiblePrefix}${"*".repeat(hiddenLength)}${visibleSuffix}`;
}

function maskCustomerReference(value = "") {
  const normalized = normalizeCustomerReference(value);
  if (!normalized) {
    return null;
  }

  if (normalized.length <= 4) {
    return `${normalized.slice(0, 1)}${"*".repeat(Math.max(1, normalized.length - 1))}`;
  }

  return `${normalized.slice(0, 2)}${"*".repeat(Math.max(2, normalized.length - 4))}${normalized.slice(-2)}`;
}

function hasVerifiedCustomerIdentity(customer) {
  return Boolean(
    normalizeCustomerReference(customer?.customerNumber ?? customer?.customerId ?? customer?.id) ||
    normalizeEmail(customer?.email) ||
    normalizePhone(customer?.phone)
  );
}

function buildCustomerScope(customer, sessionId) {
  const customerReference = normalizeCustomerReference(
    customer?.customerNumber ?? customer?.customerId ?? customer?.id
  );
  if (customerReference) {
    return `customer:${customerReference}`;
  }

  const email = normalizeEmail(customer?.email);
  if (email) {
    return `email:${email}`;
  }

  const phone = normalizePhone(customer?.phone);
  if (phone) {
    return `phone:${phone}`;
  }

  return `session:${sessionId}`;
}

function hashValue(value = "") {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 16);
}

function redactSensitiveText(value = "") {
  return String(value)
    .replace(/\b[A-Z]{1,4}-\d+\b/gi, "[order]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]");
}

function createScopedCacheStore(existingStore) {
  const store = createSessionRetentionStore(existingStore, {
    maxEntries: MAX_CACHE_ENTRIES
  });

  return {
    read(scope, key) {
      return readSessionRetentionValue(store, `${scope}:${key}`);
    },
    write(scope, key, value, ttlMs) {
      return writeSessionRetentionValue(store, `${scope}:${key}`, value, { ttlMs });
    }
  };
}

async function withCache(cache, { scope, key, ttlMs, loader }) {
  const cached = cache.read(scope, key);
  if (cached) {
    return {
      value: cached,
      cache: "hit"
    };
  }

  const value = await loader();
  cache.write(scope, key, value, ttlMs);
  return {
    value,
    cache: "miss"
  };
}

function buildOrderSummary(order, locale = "en", commerceProvider) {
  const items = commerceProvider.getLocalizedOrderItems(order, locale);

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    eta: order.eta,
    paymentStatus: order.paymentStatus,
    courier: order.courier,
    deliveryDate: order.deliveryDate,
    totalSar: order.totalSar,
    items
  };
}

function buildIdentityError(locale = "en") {
  return {
    ok: false,
    code: "identity_required",
    message:
      locale === "ar"
        ? "قبل مشاركة تفاصيل الطلب، أحتاج البريد الإلكتروني أو رقم الجوال أو رقم العميل الموثق المرتبط بهذه الجلسة."
        : "Before I can share order details, I need the verified customer email, phone number, customer number, or profile attached to this session."
  };
}

function buildOrderNotFound(orderNumber, locale = "en") {
  return {
    ok: false,
    code: "order_not_found",
    message:
      locale === "ar"
        ? `لم أتمكن من العثور على الطلب ${orderNumber}.`
        : `I couldn't find order ${orderNumber}.`
  };
}

function buildOrderNumberRequired(locale = "en") {
  return {
    ok: false,
    code: "order_number_required",
    message:
      locale === "ar"
        ? "أحتاج رقم الطلب أولاً حتى أراجع حالة الطلب أو الإرجاع أو الإلغاء."
        : "I need the order number first so I can check the order, return, or cancellation details."
  };
}

function buildToolFailure(locale = "en") {
  return {
    ok: false,
    code: "tool_error",
    message:
      locale === "ar"
        ? "واجهت مشكلة مؤقتة أثناء الوصول إلى بيانات المتجر. حاول مرة أخرى بعد قليل أو اطلب تحويل الحالة إلى موظف دعم."
        : "I hit a temporary issue while reaching the store data. Please try again shortly or ask me to escalate this to a human agent."
  };
}

export function createCommerceToolbox({
  locale = "en",
  sessionId,
  customer,
  knownOrders,
  cacheStore,
  idempotencyStore,
  commerceProvider = createSeededCommerceProvider(),
  track = () => {}
}) {
  const cache = createScopedCacheStore(cacheStore);
  const idempotency = createSessionRetentionStore(idempotencyStore, {
    maxEntries: MAX_IDEMPOTENCY_ENTRIES
  });
  const customerScope = buildCustomerScope(customer, sessionId);
  const identityScope = hashValue(customerScope);
  const hasVerifiedCustomer = hasVerifiedCustomerIdentity(customer);

  async function runTool(name, args, handler) {
    try {
      const result = await handler();
      track({
        type: "tool_call",
        sessionId,
        tool: name,
        status: result?.ok === false ? "soft_error" : "ok",
        locale
      });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown tool error";
      track({
        type: "tool_call",
        sessionId,
        tool: name,
        status: "hard_error",
        error: redactSensitiveText(message),
        locale
      });
      return buildToolFailure(locale);
    }
  }

  const tools = [
    {
      type: "function",
      name: "get_customer_profile",
      description:
        "Get the shopper profile that is already verified in the current session. Use this before order access if identity is unclear.",
      strict: true,
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false
      }
    },
    {
      type: "function",
      name: "search_catalog",
      description:
        "Search products, browse categories, or recommend items for a use case using trusted catalog data.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The shopper's product question, category, or use case."
          },
          mode: {
            type: "string",
            enum: ["product_lookup", "category_browse", "recommendation", "catalog_overview"],
            description: "Choose product lookup for a named item, category browse for category questions, recommendation for use-case guidance, or catalog overview for generic browsing."
          }
        },
        required: ["query", "mode"],
        additionalProperties: false
      }
    },
    {
      type: "function",
      name: "get_policy_information",
      description:
        "Answer questions grounded in official store policies for returns, privacy, terms, shipping, payments, or contact.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            enum: ["returns", "privacy", "terms", "shipping", "payments", "contact", "general"],
            description: "The policy area the shopper asked about."
          },
          question: {
            type: "string",
            description: "The shopper's original policy question."
          }
        },
        required: ["topic", "question"],
        additionalProperties: false
      }
    },
    {
      type: "function",
      name: "list_customer_orders",
      description:
        "List the orders visible to the authenticated customer in this session. Do not use for another customer.",
      strict: true,
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false
      }
    },
    {
      type: "function",
      name: "get_order_details",
      description:
        "Look up a specific order that belongs to the authenticated customer or this session's visible order set.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          orderNumber: {
            type: "string",
            description: "A merchant order number."
          }
        },
        required: ["orderNumber"],
        additionalProperties: false
      }
    },
    {
      type: "function",
      name: "get_return_options",
      description:
        "Check whether a customer's order appears eligible for a return or refund based on delivery status and policy.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          orderNumber: {
            type: "string",
            description: "A merchant order number."
          }
        },
        required: ["orderNumber"],
        additionalProperties: false
      }
    },
    {
      type: "function",
      name: "get_cancellation_options",
      description:
        "Check whether a customer's order can still be cancelled or updated before shipment.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          orderNumber: {
            type: "string",
            description: "A merchant order number."
          }
        },
        required: ["orderNumber"],
        additionalProperties: false
      }
    },
    {
      type: "function",
      name: "create_handoff",
      description:
        "Create or reuse a human-support handoff for sensitive, blocked, or low-confidence cases.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "Brief summary of what the shopper needs."
          },
          intent: {
            type: "string",
            description: "Support area such as order_tracking, returns_refunds, or human_handoff."
          }
        },
        required: ["summary", "intent"],
        additionalProperties: false
      }
    }
  ];

  async function execute(name, rawArgs = {}) {
    switch (name) {
      case "get_customer_profile":
        return runTool(name, rawArgs, async () => {
          const profile = await commerceProvider.getCustomerProfile({ customer });
          const visibleOrders = await commerceProvider.listVisibleOrders({ knownOrders, customer });
          const latestOrder = visibleOrders[0] ?? null;
          return {
            ok: true,
            profile: {
              name: profile?.name ?? customer?.name ?? null,
              emailMasked: maskEmail(profile?.email ?? customer?.email),
              phoneMasked: maskPhone(profile?.phone ?? customer?.phone),
              customerReference: maskCustomerReference(
                profile?.customerNumber ??
                customer?.customerNumber ??
                customer?.customerId ??
                customer?.id
              ),
              hasVerifiedEmail: Boolean(normalizeEmail(profile?.email ?? customer?.email)),
              hasVerifiedIdentity: hasVerifiedCustomerIdentity(profile ?? customer),
              newsletter: Boolean(profile?.newsletter ?? customer?.newsletter),
              visibleOrderCount: visibleOrders.length
            },
            latestOrder: latestOrder ? buildOrderSummary(latestOrder, locale, commerceProvider) : null
          };
        });

      case "search_catalog":
        return runTool(name, rawArgs, async () => {
          const { query, mode } = rawArgs;
          const cacheKey = `catalog:${mode}:${hashValue(query)}`;
          const { value, cache: cacheStatus } = await withCache(cache, {
            scope: "public",
            key: cacheKey,
            ttlMs: 5 * 60 * 1000,
            loader: () => commerceProvider.getCatalogData({ query, mode, locale })
          });

          return {
            ok: true,
            cache: cacheStatus,
            ...value
          };
        });

      case "get_policy_information":
        return runTool(name, rawArgs, async () => {
          const { topic, question } = rawArgs;
          const cacheKey = `policy:${topic}:${hashValue(question)}`;
          const { value, cache: cacheStatus } = await withCache(cache, {
            scope: "public",
            key: cacheKey,
            ttlMs: 10 * 60 * 1000,
            loader: () => commerceProvider.getPolicyData({ topic, question, locale })
          });

          return {
            ok: true,
            cache: cacheStatus,
            answer: value
          };
        });

      case "list_customer_orders":
        return runTool(name, rawArgs, async () => {
          const visibleOrders = await commerceProvider.listVisibleOrders({ knownOrders, customer });
          if (!hasVerifiedCustomer && visibleOrders.length === 0) {
            return buildIdentityError(locale);
          }

          const { value, cache: cacheStatus } = await withCache(cache, {
            scope: customerScope,
            key: "visible-orders",
            ttlMs: 30 * 1000,
            loader: () => visibleOrders.map((order) => buildOrderSummary(order, locale, commerceProvider))
          });

          return {
            ok: true,
            cache: cacheStatus,
            orders: value
          };
        });

      case "get_order_details":
        return runTool(name, rawArgs, async () => {
          const normalizedOrder = normalizeOrderNumber(rawArgs.orderNumber);
          if (!normalizedOrder) {
            return buildOrderNumberRequired(locale);
          }

          const visibleOrders = await commerceProvider.listVisibleOrders({ knownOrders, customer });

          if (!hasVerifiedCustomer && visibleOrders.length === 0) {
            return buildIdentityError(locale);
          }

          const { value, cache: cacheStatus } = await withCache(cache, {
            scope: customerScope,
            key: `order:${normalizedOrder}`,
            ttlMs: 30 * 1000,
            loader: async () => {
              const order = await commerceProvider.getOrder({
                knownOrders,
                customer,
                orderNumber: normalizedOrder
              });

              return order ? buildOrderSummary(order, locale, commerceProvider) : null;
            }
          });

          if (!value) {
            return buildOrderNotFound(normalizedOrder, locale);
          }

          return {
            ok: true,
            cache: cacheStatus,
            order: value
          };
        });

      case "get_return_options":
        return runTool(name, rawArgs, async () => {
          const normalizedOrder = normalizeOrderNumber(rawArgs.orderNumber);
          if (!normalizedOrder) {
            return buildOrderNumberRequired(locale);
          }

          const visibleOrders = await commerceProvider.listVisibleOrders({ knownOrders, customer });
          if (!hasVerifiedCustomer && visibleOrders.length === 0) {
            return buildIdentityError(locale);
          }

          const order = await commerceProvider.getOrder({
            knownOrders,
            customer,
            orderNumber: normalizedOrder
          });

          if (!order) {
            return buildOrderNotFound(normalizedOrder, locale);
          }

          const eligibility = commerceProvider.getReturnAssessment({ order, locale });
          return {
            ok: true,
            order: buildOrderSummary(order, locale, commerceProvider),
            eligibility
          };
        });

      case "get_cancellation_options":
        return runTool(name, rawArgs, async () => {
          const normalizedOrder = normalizeOrderNumber(rawArgs.orderNumber);
          if (!normalizedOrder) {
            return buildOrderNumberRequired(locale);
          }

          const visibleOrders = await commerceProvider.listVisibleOrders({ knownOrders, customer });
          if (!hasVerifiedCustomer && visibleOrders.length === 0) {
            return buildIdentityError(locale);
          }

          const order = await commerceProvider.getOrder({
            knownOrders,
            customer,
            orderNumber: normalizedOrder
          });

          if (!order) {
            return buildOrderNotFound(normalizedOrder, locale);
          }

          return {
            ok: true,
            order: buildOrderSummary(order, locale, commerceProvider),
            cancellation: commerceProvider.getCancellationAssessment({ order, locale })
          };
        });

      case "create_handoff":
        return runTool(name, rawArgs, async () => {
          const key = `handoff:${identityScope}:${rawArgs.intent}:${hashValue(rawArgs.summary.trim().toLowerCase())}`;
          const existingTicket = readSessionRetentionValue(idempotency, key);
          if (existingTicket) {
            return {
              ok: true,
              reused: true,
              ticket: existingTicket
            };
          }

          const ticket = commerceProvider.createHandoff({
            customerMessage: rawArgs.summary,
            intent: rawArgs.intent,
            locale,
            sessionId,
            customer
          });

          writeSessionRetentionValue(idempotency, key, ticket, {
            ttlMs: HANDOFF_IDEMPOTENCY_TTL_MS
          });
          return {
            ok: true,
            reused: false,
            ticket
          };
        });

      default:
        return {
          ok: false,
          code: "unknown_tool",
          message: `Unknown tool: ${name}`
        };
    }
  }

  return {
    tools,
    execute
  };
}
