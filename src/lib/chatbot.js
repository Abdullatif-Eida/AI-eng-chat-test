
// this is the core file that controls how the chatbot behaves: 
// it reads the user’s message, detects the intent, manages conversation state, chooses the right business logic, 
// and returns the final response using if else switch and confidence scores.

import { classifyIntent, extractOrderNumber } from "./intents.js";
import {
  canCancelOrder,
  createHandoffTicket,
  findOrder,
  findProduct,
  getCatalogSummary,
  getPolicyAnswer,
  getPaymentSummary,
  getRecommendationRationale,
  getReturnPolicySummary,
  getProductById,
  getShippingSummary,
  isOrderEligibleForReturn,
  listProductsByCategory,
  recommendProducts
} from "./commerce.js";
import { detectLocale, format, t } from "./i18n.js";
import { createOpenAIComposer } from "./openai.js";

function localizeOrderStatus(status = "", locale = "en") {
  const statusMap = {
    "Out for delivery": { en: "Out for delivery", ar: "خرج للتسليم" },
    Shipped: { en: "Shipped", ar: "تم الشحن" },
    Delivered: { en: "Delivered", ar: "تم التسليم" },
    Processing: { en: "Processing", ar: "قيد المعالجة" },
    "Pending payment": { en: "Pending payment", ar: "بانتظار الدفع" }
  };

  return statusMap[status]?.[locale] ?? status;
}

function localizePaymentStatus(status = "", locale = "en") {
  const paymentMap = {
    Paid: { en: "Paid", ar: "مدفوع" },
    "Cash on delivery": { en: "Cash on delivery", ar: "الدفع عند الاستلام" },
    "Pending payment": { en: "Pending payment", ar: "بانتظار الدفع" }
  };

  return paymentMap[status]?.[locale] ?? status;
}

function localizeCourier(courier = "", locale = "en") {
  if (courier === "Pending assignment") {
    return locale === "ar" ? "سيتم التعيين" : "Pending assignment";
  }

  return courier;
}

function localizeEta(eta = "", locale = "en") {
  if (locale !== "ar") {
    return eta;
  }

  const etaMap = {
    "Today before 8:00 PM": "اليوم قبل الساعة 8:00 مساءً",
    "Expected to ship tomorrow": "متوقع الشحن غداً"
  };

  if (etaMap[eta]) {
    return etaMap[eta];
  }

  const deliveredMatch = eta.match(/^Delivered on (\d{4}-\d{2}-\d{2})$/);
  if (deliveredMatch) {
    return `تم التسليم في ${deliveredMatch[1]}`;
  }

  const expectedDaysMatch = eta.match(/^Expected in (\d+) days?$/);
  if (expectedDaysMatch) {
    return `متوقع خلال ${expectedDaysMatch[1]} يوم`;
  }

  return eta;
}

function buildProductReply(product, locale) {
  const title = locale === "ar" ? product.nameAr : product.name;
  const description = locale === "ar" ? product.shortDescriptionAr : product.shortDescription;
  const highlights = locale === "ar" ? product.highlightsAr : product.highlights;
  const colors = locale === "ar" ? product.colorsAr : product.colors;
  const size = locale === "ar" ? product.sizeAr : product.size;
  const colorText = colors.length
    ? locale === "ar"
      ? colors.join("، ")
      : colors.join(", ")
    : "";

  return format(locale, "productDetails", {
    title,
    price: product.priceSar,
    currency: product.currency,
    description,
    size,
    highlights: locale === "ar" ? highlights.join("، ") : highlights.join(", "),
    colors: colorText || (locale === "ar" ? "غير محددة" : "Not specified")
  });
}

function buildOrderReply(order, locale) {
  const itemSummary = order.items
    .map((item) => {
      const product = getProductById(item.productId);
      const name = locale === "ar" ? product?.nameAr ?? product?.name : product?.name;
      return locale === "ar"
        ? `${item.quantity} × ${name ?? item.productId}`
        : `${item.quantity}x ${name ?? item.productId}`;
    })
    .join(locale === "ar" ? "، " : ", ");

  return format(locale, "orderDetails", {
    orderNumber: order.orderNumber,
    status: localizeOrderStatus(order.status, locale),
    eta: localizeEta(order.eta, locale),
    items: itemSummary,
    courier: localizeCourier(order.courier, locale),
    paymentStatus: localizePaymentStatus(order.paymentStatus, locale)
  });
}

function buildReturnReply(order, locale) {
  const eligibility = isOrderEligibleForReturn(order, locale);

  if (!eligibility.eligible) {
    return format(locale, "returnException", { reason: eligibility.reason });
  }

  return format(locale, "returnEligible", { reason: eligibility.reason });
}

function buildRecommendationReply(message, locale) {
  const matches = recommendProducts(message, locale);
  const items = matches
    .map((product) => {
      const title = locale === "ar" ? product.nameAr : product.name;
      return locale === "ar"
        ? `• ${title} - ${product.priceSar} ${product.currency}`
        : `• ${title} - ${product.priceSar} ${product.currency}`;
    })
    .join("\n");

  return format(locale, "recommendationReply", {
    items,
    guidance: `${getRecommendationRationale(message, locale)}\n${t(locale, "recommendationGuidance")}`
  });
}

function normalizeOrderNumber(orderNumber = "") {
  return String(orderNumber).trim().toUpperCase();
}

function lookupOrder(orderNumber, knownOrders) {
  const normalized = normalizeOrderNumber(orderNumber);

  if (!normalized) {
    return null;
  }

  if (Array.isArray(knownOrders)) {
    return knownOrders.find((order) => normalizeOrderNumber(order?.orderNumber) === normalized) ?? null;
  }

  return findOrder(normalized);
}

function isOrderNumberFollowup(message = "") {
  const normalized = message.trim();

  return [
    /^(?:order\s*)?[a-z]{1,4}-\d+[?.!]*$/i,
    /^(?:my\s+order(?:\s+number)?\s*(?:is|:)?\s*)[a-z]{1,4}-\d+[?.!]*$/i,
    /^(?:order\s+number\s*(?:is|:)?\s*)[a-z]{1,4}-\d+[?.!]*$/i,
    /^(?:رقم\s+الطلب|الطلب\s+رقمه|رقم\s+طلبي|طلبي)\s*(?:هو|:)?\s*[a-z]{1,4}-\d+[؟?.!،]*$/i
  ].some((pattern) => pattern.test(normalized));
}

function isAddressChangeRequest(message = "") {
  return /\b(delivery address|address update|change address|update address|change my address|change my delivery address|update my delivery address)\b|تعديل العنوان|تغيير العنوان|عنوان التوصيل/i.test(
    message
  );
}

export function createChatbot() {
  const sessions = new Map();
  const analytics = [];
  const composer = createOpenAIComposer();

  function resolveReplyLocale(message, preferredLocale, session) {
    const normalized = message.trim();

    if (/[\u0600-\u06FF]/.test(message)) {
      return "ar";
    }

    if (/^(?:order\s*)?[a-z]{1,4}-\d+$/i.test(normalized)) {
      return session?.lastLocale ?? preferredLocale ?? "en";
    }

    if (/[a-z]/i.test(message)) {
      return "en";
    }

    return session?.lastLocale ?? preferredLocale ?? detectLocale(message);
  }

  function getSession(sessionId) {
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        awaiting: null,
        lastIntent: null,
        lastLocale: null,
        customer: null
      });
    }

    return sessions.get(sessionId);
  }

  function track(event) {
    analytics.push({
      ...event,
      timestamp: new Date().toISOString()
    });
  }

  async function buildReply({
    locale,
    intent,
    customerMessage,
    structuredFacts,
    fallbackReply
  }) {
    return composer.composeReply({
      locale,
      intent,
      customerMessage,
      structuredFacts,
      fallbackReply
    });
  }

async function resolveOrderRequiredIntent({
  classificationName,
  locale,
  message,
  session,
  knownOrders
}) {
  const orderNumber = extractOrderNumber(message);
  if (!orderNumber) {
    if (
      classificationName === "returns_refunds" &&
      /policy|how|days|window|eligible|exchange|damaged|defective|sale|discount|rules|سياسة|كم|نافذة|استبدال|تالف|معيب|مخفض/i.test(
        message
      )
    ) {
      return {
        locale,
        reply: getReturnPolicySummary(locale),
        intent: classificationName,
        confidence: 0.8
      };
    }

    session.awaiting = "order_number";
    const promptKey = classificationName === "returns_refunds" ? "askReturnOrder" : "askCancellationOrder";
    return {
        locale,
        reply: t(locale, promptKey),
        intent: classificationName,
        confidence: 0.72
      };
    }

    const order = lookupOrder(orderNumber, knownOrders);
    if (!order) {
      return {
        locale,
        reply: format(locale, "orderNotFound", { orderNumber }),
        intent: classificationName,
        confidence: 0.73
      };
    }

    if (classificationName === "returns_refunds") {
      return {
        locale,
        reply: buildReturnReply(order, locale),
        intent: classificationName,
        confidence: 0.88,
        structured: {
          orderNumber,
          returnEligible: isOrderEligibleForReturn(order, locale).eligible
        }
      };
    }

    const addressChange = isAddressChangeRequest(message);

    return {
      locale,
      reply: canCancelOrder(order)
        ? format(locale, addressChange ? "addressChangeEligible" : "cancellationEligible", {
            orderNumber,
            status: localizeOrderStatus(order.status, locale)
          })
        : format(locale, addressChange ? "addressChangeLocked" : "cancellationLocked", {
            orderNumber,
            status: localizeOrderStatus(order.status, locale)
          }),
      intent: classificationName,
      confidence: 0.85,
      structured: {
        orderNumber,
        cancellable: canCancelOrder(order),
        changeType: addressChange ? "address_update" : "cancellation"
      }
    };
  }

  async function chat({
    sessionId,
    message,
    preferredLocale,
    customerProfile,
    knownOrders
  }) {
    const trimmedMessage = message.trim();
    const session = getSession(sessionId);
    const locale = trimmedMessage ? resolveReplyLocale(trimmedMessage, preferredLocale, session) : session.lastLocale ?? preferredLocale ?? "en";
    session.lastLocale = locale;

    if (customerProfile?.name || customerProfile?.email) {
      session.customer = {
        ...session.customer,
        ...customerProfile
      };
    }

    if (!trimmedMessage) {
      return {
        locale,
        reply: t(locale, "fallback"),
        intent: "fallback",
        confidence: 0.1
      };
    }

    const classification = classifyIntent(trimmedMessage);
    const explicitIntentSwitch =
      session.awaiting === "order_number" &&
      !isOrderNumberFollowup(trimmedMessage) &&
      classification.name !== "fallback" &&
      classification.name !== session.lastIntent;

    if (explicitIntentSwitch) {
      session.awaiting = null;
    }

    if (session.awaiting === "order_number") {
      const orderNumber = extractOrderNumber(trimmedMessage);
      if (!orderNumber) {
        return {
          locale,
          reply: t(locale, "askOrderNumber"),
          intent: session.lastIntent ?? "order_tracking",
          confidence: 0.5
        };
      }

      const order = lookupOrder(orderNumber, knownOrders);
      if (!order) {
        return {
          locale,
          reply: format(locale, "orderNotFound", { orderNumber }),
          intent: session.lastIntent ?? "order_tracking",
          confidence: 0.7
        };
      }

      session.awaiting = null;

      if (session.lastIntent === "returns_refunds") {
        return {
          locale,
          reply: buildReturnReply(order, locale),
          intent: session.lastIntent,
          confidence: 0.9
        };
      }

      if (session.lastIntent === "order_change_cancel") {
        const addressChange = isAddressChangeRequest(trimmedMessage);
        return {
          locale,
          reply: canCancelOrder(order)
            ? format(locale, addressChange ? "addressChangeEligible" : "cancellationEligible", {
                orderNumber,
                status: localizeOrderStatus(order.status, locale)
              })
            : format(locale, addressChange ? "addressChangeLocked" : "cancellationLocked", {
                orderNumber,
                status: localizeOrderStatus(order.status, locale)
              }),
          intent: session.lastIntent,
          confidence: 0.88
        };
      }

      const fallbackReply = buildOrderReply(order, locale);
      const reply = await buildReply({
        locale,
        intent: session.lastIntent,
        customerMessage: trimmedMessage,
        structuredFacts: { orderNumber, order },
        fallbackReply
      });

      return {
        locale,
        reply,
        intent: session.lastIntent,
        confidence: 0.93,
        structured: {
          orderNumber,
          status: order.status
        }
      };
    }

    session.lastIntent = classification.name;

    switch (classification.name) {
      case "greeting": {
        return {
          locale,
          reply: t(locale, "greeting"),
          intent: classification.name,
          confidence: classification.confidence
        };
      }

      case "general_help": {
        return {
          locale,
          reply: t(locale, "generalHelp"),
          intent: classification.name,
          confidence: classification.confidence
        };
      }

      case "catalog_browse": {
        return {
          locale,
          reply: getCatalogSummary(locale),
          intent: classification.name,
          confidence: classification.confidence
        };
      }

      case "product_information": {
        const product = findProduct(trimmedMessage);
        if (product) {
          const fallbackReply = buildProductReply(product, locale);
          const reply = await buildReply({
            locale,
            intent: classification.name,
            customerMessage: trimmedMessage,
            structuredFacts: { product },
            fallbackReply
          });

          track({
            sessionId,
            intent: classification.name,
            resolution: "resolved",
            locale,
            composer: composer.enabled ? "openai_or_fallback" : "deterministic"
          });

          return {
            locale,
            reply,
            intent: classification.name,
            confidence: classification.confidence,
            structured: {
              productId: product.id,
              category: product.category,
              priceSar: product.priceSar
            }
          };
        }

        const categoryMatches = listProductsByCategory(trimmedMessage);
        if (categoryMatches.length > 0) {
          const categoryLabel = locale === "ar" ? categoryMatches[0].categoryAr : categoryMatches[0].category;
          return {
            locale,
            reply: format(locale, "categoryOptions", {
              category: categoryLabel,
              items: categoryMatches
                .map((item) => (locale === "ar" ? item.nameAr ?? item.name : item.name))
                .join(locale === "ar" ? "، " : ", ")
            }),
            intent: classification.name,
            confidence: 0.74
          };
        }

        const recommendationMatches = recommendProducts(trimmedMessage, locale);
        if (recommendationMatches.length > 0 && /best|recommend|suggest|choose|for |gift|رشح|أفضل|أنسب|اختار|استخدام|لل|للسفر|للعمل|للبيت|للمنزل/i.test(trimmedMessage)) {
          return {
            locale,
            reply: buildRecommendationReply(trimmedMessage, locale),
            intent: "recommendations",
            confidence: 0.7
          };
        }

        return {
          locale,
          reply: /for |need|use|رشح|أفضل|أنسب|استخدام|للسفر|للعمل|للمنزل|للبيت/i.test(trimmedMessage)
            ? t(locale, "askUseCase")
            : t(locale, "askProductName"),
          intent: classification.name,
          confidence: 0.52
        };
      }

      case "recommendations": {
        return {
          locale,
          reply: buildRecommendationReply(trimmedMessage, locale),
          intent: classification.name,
          confidence: classification.confidence
        };
      }

      case "order_tracking": {
        const orderNumber = extractOrderNumber(trimmedMessage);
        if (!orderNumber) {
          session.awaiting = "order_number";
          return {
            locale,
            reply: t(locale, "askOrderNumber"),
            intent: classification.name,
            confidence: classification.confidence
          };
        }

        const order = lookupOrder(orderNumber, knownOrders);
        if (!order) {
          return {
            locale,
            reply: format(locale, "orderNotFound", { orderNumber }),
            intent: classification.name,
            confidence: 0.74
          };
        }

        const fallbackReply = buildOrderReply(order, locale);
        const reply = await buildReply({
          locale,
          intent: classification.name,
          customerMessage: trimmedMessage,
          structuredFacts: { orderNumber, order },
          fallbackReply
        });

        track({
          sessionId,
          intent: classification.name,
          resolution: "resolved",
          locale,
          composer: composer.enabled ? "openai_or_fallback" : "deterministic"
        });

        return {
          locale,
          reply,
          intent: classification.name,
          confidence: classification.confidence,
          structured: {
            orderNumber,
            status: order.status
          }
        };
      }

      case "returns_refunds":
      case "order_change_cancel": {
        const result = await resolveOrderRequiredIntent({
          classificationName: classification.name,
          locale,
          message: trimmedMessage,
          session,
          knownOrders
        });

        track({
          sessionId,
          intent: classification.name,
          resolution: "resolved",
          locale,
          composer: composer.enabled ? "openai_or_fallback" : "deterministic"
        });

        return result;
      }

      case "shipping_delivery": {
        return {
          locale,
          reply: `${getShippingSummary(locale)} ${t(locale, "promptForMore")}`,
          intent: classification.name,
          confidence: classification.confidence
        };
      }

      case "payments": {
        return {
          locale,
          reply: `${getPaymentSummary(locale)} ${t(locale, "promptForMore")}`,
          intent: classification.name,
          confidence: classification.confidence
        };
      }

      case "policy_info": {
        return {
          locale,
          reply: getPolicyAnswer(trimmedMessage, locale),
          intent: classification.name,
          confidence: classification.confidence
        };
      }

      case "human_handoff": {
        const ticket = createHandoffTicket({
          customerMessage: trimmedMessage,
          intent: classification.name,
          locale,
          sessionId,
          customer: session.customer
        });

        track({
          sessionId,
          intent: classification.name,
          resolution: "handoff",
          locale,
          composer: composer.enabled ? "openai_or_fallback" : "deterministic"
        });

        return {
          locale,
          reply: `${t(locale, "handoff")} Ticket ID: ${ticket.id}. ${session.customer?.email ? "" : t(locale, "askContactPreference")}`.trim(),
          intent: classification.name,
          confidence: classification.confidence,
          structured: ticket
        };
      }

      default: {
        const rescuedProduct = findProduct(trimmedMessage);
        if (rescuedProduct) {
          return {
            locale,
            reply: buildProductReply(rescuedProduct, locale),
            intent: "product_information",
            confidence: 0.66,
            structured: {
              productId: rescuedProduct.id,
              category: rescuedProduct.category,
              priceSar: rescuedProduct.priceSar
            }
          };
        }

        const rescuedCategoryMatches = listProductsByCategory(trimmedMessage);
        if (rescuedCategoryMatches.length > 0) {
          const categoryLabel =
            locale === "ar" ? rescuedCategoryMatches[0].categoryAr : rescuedCategoryMatches[0].category;
          return {
            locale,
            reply: format(locale, "categoryOptions", {
              category: categoryLabel,
              items: rescuedCategoryMatches
                .map((item) => (locale === "ar" ? item.nameAr ?? item.name : item.name))
                .join(locale === "ar" ? "، " : ", ")
            }),
            intent: "product_information",
            confidence: 0.62
          };
        }

        if (
          /\b(list|show|browse|catalog|products?|categories|what do you sell)\b|منتجات|الأقسام|الفئات|وش عندكم|اعرض المنتجات/i.test(
            trimmedMessage
          )
        ) {
          return {
            locale,
            reply: getCatalogSummary(locale),
            intent: "catalog_browse",
            confidence: 0.62
          };
        }

        if (
          /\b(help|how can you help|how you can help me|what can i ask|how to use|how does this work)\b|ساعدني|كيف تساعدني|كيف أستخدم|كيف استخدم|وش أسأل/i.test(
            trimmedMessage
          )
        ) {
          return {
            locale,
            reply: t(locale, "generalHelp"),
            intent: "general_help",
            confidence: 0.62
          };
        }

        if (
          /\b(data|privacy|terms|policy|refund|return|payment|cookies?|sell my data|share data)\b|البيانات|بيانات|الخصوصية|الشروط|السياسة|استرجاع|استرداد|الدفع|كوكيز|بيع|تبيع|تبيعون|مشاركة/i.test(
            trimmedMessage
          )
        ) {
          return {
            locale,
            reply: getPolicyAnswer(trimmedMessage, locale),
            intent: "policy_info",
            confidence: 0.62
          };
        }

        track({
          sessionId,
          intent: "fallback",
          resolution: "fallback",
          locale
        });

        return {
          locale,
          reply: t(locale, "fallback"),
          intent: "fallback",
          confidence: classification.confidence
        };
      }
    }
  }

  return {
    chat,
    getAnalytics() {
      return analytics.slice(-50);
    },
    getWelcomeMessage(locale = "en", name = null) {
      return name ? format(locale, "personalizedWelcome", { name }) : t(locale, "welcome");
    },
    getAIMode() {
      return {
        enabled: composer.enabled,
        provider: composer.enabled ? "openai" : "deterministic",
        model: composer.model
      };
    }
  };
}
