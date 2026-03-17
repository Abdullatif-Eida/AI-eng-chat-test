import { createChatbot } from "../../src/lib/chatbot.js";
import { integrationMap } from "../../src/integrations/index.js";
import { createOrder, listOrders } from "../../src/data/orders.js";
import { products } from "../../src/data/products.js";

const chatbot = createChatbot();

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

  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
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
          "Show me products",
          "How do returns work?",
          "Recommend the best product for travel",
          "What payment methods do you support?",
          "What data do you collect?",
          "What are your terms and conditions?",
          "I need a human agent"
        ],
        samplePromptsAr: [
          "أريد معرفة تفاصيل ماوس لاسلكي",
          "اعرض المنتجات",
          "كيف تعمل سياسة الاسترجاع؟",
          "رشح لي أفضل منتج للسفر",
          "ما طرق الدفع المتاحة؟",
          "ما البيانات التي تجمعونها؟",
          "ما هي الشروط والأحكام؟",
          "أحتاج موظف خدمة عملاء"
        ],
        integrations: integrationMap
      });
    }

    if (method === "GET" && path === "/products") {
      return json(200, { products });
    }

    if (method === "GET" && path === "/orders") {
      return json(200, { orders: listOrders() });
    }

    if (method === "GET" && path === "/analytics") {
      return json(200, { events: chatbot.getAnalytics() });
    }

    if (method === "POST" && path === "/chat") {
      const parsed = parseBody(event.body);
      const sessionId = parsed.sessionId || crypto.randomUUID();
      const result = await chatbot.chat({
        sessionId,
        message: parsed.message ?? "",
        preferredLocale: normalizeLocale(parsed.preferredLocale),
        customerProfile: parsed.customerProfile ?? null,
        knownOrders: Array.isArray(parsed.knownOrders) ? parsed.knownOrders : undefined
      });

      return json(200, {
        sessionId,
        ...result
      });
    }

    if (method === "POST" && path === "/orders") {
      const parsed = parseBody(event.body);
      const order = createOrder({
        customerName: parsed.customerName,
        email: parsed.email,
        items: parsed.items ?? [],
        locale: normalizeLocale(parsed.locale)
      });

      return json(201, {
        order,
        orders: listOrders()
      });
    }

    return json(404, { error: "Not found" });
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : "Unknown server error"
    });
  }
}
