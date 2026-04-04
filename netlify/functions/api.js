import { createChatbot } from "../../src/lib/chatbot.js";
import { createCommerceProviderFromEnv } from "../../src/lib/commerceProvider.js";
import { integrationMap } from "../../src/integrations/index.js";
import { createOrder, listOrders } from "../../src/data/orders.js";
import { products } from "../../src/data/products.js";
import {
  createSessionRetentionStore,
  readSessionRetentionValue,
  writeSessionRetentionValue
} from "../../src/lib/sessionRetention.js";
import { mergeTrustedKnownOrders } from "../../src/lib/trustedOrderSync.js";

const chatbot = createChatbot({
  commerceProvider: createCommerceProviderFromEnv(),
  messageCooldownMs: Number(process.env.MESSAGE_COOLDOWN_MS || 1500)
});
const debugApiRoutesEnabled = process.env.ENABLE_DEBUG_API_ROUTES === "true";
const allowRequestScopedOpenRouterKey = process.env.ALLOW_CLIENT_OPENROUTER_KEY_OVERRIDE === "true";
const maxRequestBodyBytes = Number(process.env.MAX_REQUEST_BODY_BYTES || 64 * 1024);
const trustedSessionOrders = createSessionRetentionStore(null, {
  maxEntries: Number(process.env.MAX_TRUSTED_ORDER_SESSIONS || 256)
});
const trustedSessionOrdersTtlMs = Number(process.env.TRUSTED_ORDER_SESSION_TTL_MS || 30 * 60 * 1000);
const maxTrustedOrdersPerSession = Number(process.env.MAX_TRUSTED_ORDERS_PER_SESSION || 20);
const sessionIdPattern = /^[a-z0-9._:-]{8,120}$/i;

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(payload)
  };
}

function normalizeMethod(method) {
  return (method ?? "GET").toUpperCase();
}

function normalizeLocale(locale) {
  return locale === "ar" ? "ar" : "en";
}

function parseBody(body) {
  if (!body) {
    return {};
  }

  if (body.length > maxRequestBodyBytes) {
    throw new Error("Request body too large");
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

function normalizeSessionId(value) {
  const trimmed = String(value ?? "").trim();
  return sessionIdPattern.test(trimmed) ? trimmed : crypto.randomUUID();
}

function readTrustedOrdersForSession(sessionId) {
  return readSessionRetentionValue(trustedSessionOrders, sessionId) ?? [];
}

function rememberTrustedOrder(sessionId, order) {
  const existingOrders = readTrustedOrdersForSession(sessionId);
  const dedupedOrders = mergeTrustedKnownOrders(existingOrders, [order], maxTrustedOrdersPerSession);

  writeSessionRetentionValue(trustedSessionOrders, sessionId, dedupedOrders, {
    ttlMs: trustedSessionOrdersTtlMs
  });
}

function normalizePath(event) {
  const rawPath = event.rawUrl ? new URL(event.rawUrl).pathname : event.path ?? "/";

  return (
    rawPath
      .replace(/^\/\.netlify\/functions\/api/, "")
      .replace(/^\/api/, "") || "/"
  );
}

export async function handler(event) {
  try {
    const method = normalizeMethod(event.httpMethod);
    const path = normalizePath(event);
    const query = new URLSearchParams(event.queryStringParameters ?? {});

    if (method === "GET" && path === "/health") {
      return json(200, { ok: true });
    }

    if (method === "GET" && path === "/bootstrap") {
      const locale = normalizeLocale(query.get("locale"));

      return json(200, {
        welcome: chatbot.getWelcomeMessage(locale),
        aiMode: chatbot.getAIMode(),
        locale,
        samplePrompts: [
          "Tell me about the Wireless Mouse",
          "What can you help me with?",
          "How do returns work?",
          "Recommend the best product for travel",
          "What payment methods do you support?",
          "What data do you collect?",
          "What are your terms and conditions?",
          "Where is my latest order?",
          "I need a human agent"
        ],
        samplePromptsAr: [
          "أريد معرفة تفاصيل ماوس لاسلكي",
          "بماذا تستطيع مساعدتي؟",
          "كيف تعمل سياسة الاسترجاع؟",
          "رشح لي أفضل منتج للسفر",
          "ما طرق الدفع المتاحة؟",
          "ما البيانات التي تجمعونها؟",
          "ما هي الشروط والأحكام؟",
          "أين آخر طلب لي؟",
          "أحتاج موظف خدمة عملاء"
        ],
        integrations: integrationMap
      });
    }

    if (method === "GET" && path === "/products") {
      return json(200, { products });
    }

    if (method === "GET" && path === "/orders") {
      if (!debugApiRoutesEnabled) {
        return json(403, { error: "Debug order access is disabled in secure mode." });
      }

      return json(200, { orders: listOrders() });
    }

    if (method === "GET" && path === "/analytics") {
      if (!debugApiRoutesEnabled) {
        return json(403, { error: "Support analytics are disabled in secure mode." });
      }

      return json(200, {
        events: chatbot.getAnalytics(),
        summary: chatbot.getAnalyticsSummary()
      });
    }

    if (method === "POST" && path === "/chat") {
      const parsed = parseBody(event.body);
      const sessionId = normalizeSessionId(parsed.sessionId);
      const mergedKnownOrders = mergeTrustedKnownOrders(
        readTrustedOrdersForSession(sessionId),
        parsed.knownOrders,
        maxTrustedOrdersPerSession
      );

      if (Array.isArray(parsed.knownOrders) && parsed.knownOrders.length > 0) {
        writeSessionRetentionValue(trustedSessionOrders, sessionId, mergedKnownOrders, {
          ttlMs: trustedSessionOrdersTtlMs
        });
      }

      const result = await chatbot.chat({
        sessionId,
        message: parsed.message ?? "",
        preferredLocale: normalizeLocale(parsed.preferredLocale),
        customerProfile: parsed.customerProfile ?? null,
        knownOrders: mergedKnownOrders,
        conversationHistory: parsed.conversationHistory ?? null,
        openrouterApiKey: allowRequestScopedOpenRouterKey
          ? event.headers?.["x-openrouter-key"] ??
            event.headers?.["X-OpenRouter-Key"] ??
            event.headers?.["X-Openrouter-Key"] ??
            null
          : null
      });

      return json(Number(result.statusCode) || 200, {
        sessionId,
        ...result
      });
    }

    if (method === "POST" && path === "/orders") {
      const parsed = parseBody(event.body);
      const sessionId = normalizeSessionId(parsed.sessionId);
      const order = createOrder({
        customerName: parsed.customerName,
        email: parsed.email,
        phone: parsed.phone,
        customerNumber: parsed.customerNumber,
        items: parsed.items ?? [],
        locale: normalizeLocale(parsed.locale)
      });
      rememberTrustedOrder(sessionId, order);

      return json(201, {
        sessionId,
        order
      });
    }

    return json(404, { error: "Not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    const statusCode =
      message === "Request body too large"
        ? 413
        : message === "Request body must be valid JSON."
          ? 400
          : 500;
    return json(statusCode, {
      error:
        statusCode === 400
          ? message
          : statusCode === 413
          ? "Request body too large."
          : "Internal server error."
    });
  }
}
