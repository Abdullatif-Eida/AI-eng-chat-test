
// The local backend server that serves the website files and handles the API routes for chat, 
// products, orders, analytics, and app bootstrap data.

import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createChatbot } from "./lib/chatbot.js";
import { createCommerceProviderFromEnv } from "./lib/commerceProvider.js";
import {
  createSessionRetentionStore,
  readSessionRetentionValue,
  writeSessionRetentionValue
} from "./lib/sessionRetention.js";
import { mergeTrustedKnownOrders } from "./lib/trustedOrderSync.js";
import { integrationMap } from "./integrations/index.js";
import { createOrder, listOrders } from "./data/orders.js";
import { products } from "./data/products.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "public");
const chatbot = createChatbot({
  commerceProvider: createCommerceProviderFromEnv(),
  messageCooldownMs: Number(process.env.MESSAGE_COOLDOWN_MS || 1500)
});
const port = process.env.PORT || 3000;
const host = process.env.HOST || "127.0.0.1";
const debugApiRoutesEnabled = process.env.ENABLE_DEBUG_API_ROUTES === "true";
const allowRequestScopedOpenRouterKey = process.env.ALLOW_CLIENT_OPENROUTER_KEY_OVERRIDE === "true";
const maxRequestBodyBytes = Number(process.env.MAX_REQUEST_BODY_BYTES || 64 * 1024);
const trustedSessionOrders = createSessionRetentionStore(null, {
  maxEntries: Number(process.env.MAX_TRUSTED_ORDER_SESSIONS || 256)
});
const trustedSessionOrdersTtlMs = Number(process.env.TRUSTED_ORDER_SESSION_TTL_MS || 30 * 60 * 1000);
const maxTrustedOrdersPerSession = Number(process.env.MAX_TRUSTED_ORDERS_PER_SESSION || 20);
const sessionIdPattern = /^[a-z0-9._:-]{8,120}$/i;

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = "BadRequestError";
  }
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    let bodyLength = 0;
    request.on("data", (chunk) => {
      bodyLength += chunk.length;
      if (bodyLength > maxRequestBodyBytes) {
        reject(new Error("Request body too large"));
        request.destroy();
        return;
      }
      body += chunk.toString();
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function parseJsonBody(rawBody = "") {
  try {
    return JSON.parse(rawBody || "{}");
  } catch {
    throw new BadRequestError("Request body must be valid JSON.");
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

async function serveStatic(request, response) {
  const requestedPath = request.url === "/" ? "/index.html" : request.url;
  const requestedFilePath = path.join(publicDir, requestedPath);
  const isAppRoute = !path.extname(requestedPath);
  const filePath = existsSync(requestedFilePath) ? requestedFilePath : isAppRoute ? path.join(publicDir, "index.html") : requestedFilePath;

  if (!filePath.startsWith(publicDir) || !existsSync(filePath)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  const ext = path.extname(filePath);
  response.writeHead(200, {
    "Content-Type": contentTypes[ext] ?? "application/octet-stream"
  });
  createReadStream(filePath).pipe(response);
}

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? `${host}:${port}`}`);

    if (request.method === "GET" && requestUrl.pathname === "/api/health") {
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/bootstrap") {
      const locale = requestUrl.searchParams.get("locale") === "ar" ? "ar" : "en";
      sendJson(response, 200, {
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
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/products") {
      sendJson(response, 200, { products });
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/orders") {
      if (!debugApiRoutesEnabled) {
        sendJson(response, 403, {
          error: "Debug order access is disabled in secure mode."
        });
        return;
      }

      sendJson(response, 200, { orders: listOrders() });
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/analytics") {
      if (!debugApiRoutesEnabled) {
        sendJson(response, 403, {
          error: "Support analytics are disabled in secure mode."
        });
        return;
      }

      sendJson(response, 200, {
        events: chatbot.getAnalytics(),
        summary: chatbot.getAnalyticsSummary()
      });
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/chat") {
      const rawBody = await readRequestBody(request);
      const parsed = parseJsonBody(rawBody);
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
        preferredLocale: parsed.preferredLocale === "ar" ? "ar" : "en",
        customerProfile: parsed.customerProfile ?? null,
        knownOrders: mergedKnownOrders,
        conversationHistory: parsed.conversationHistory ?? null,
        openrouterApiKey: allowRequestScopedOpenRouterKey ? request.headers["x-openrouter-key"] : null
      });

      sendJson(response, Number(result.statusCode) || 200, {
        sessionId,
        ...result
      });
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/orders") {
      const rawBody = await readRequestBody(request);
      const parsed = parseJsonBody(rawBody);
      const sessionId = normalizeSessionId(parsed.sessionId);
      const order = createOrder({
        customerName: parsed.customerName,
        email: parsed.email,
        phone: parsed.phone,
        customerNumber: parsed.customerNumber,
        items: parsed.items ?? [],
        locale: parsed.locale === "ar" ? "ar" : "en"
      });
      rememberTrustedOrder(sessionId, order);

      sendJson(response, 201, {
        sessionId,
        order
      });
      return;
    }

    await serveStatic({ ...request, url: requestUrl.pathname }, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    const statusCode =
      error instanceof BadRequestError
        ? 400
        : message === "Request body too large"
          ? 413
          : /^Invalid order:/i.test(message)
            ? 400
            : 500;
    sendJson(response, statusCode, {
      error:
        statusCode === 400
          ? message
          : statusCode === 413
            ? "Request body too large."
            : "Internal server error."
    });
  }
});

server.listen(port, host, async () => {
  const docsDir = path.join(__dirname, "..", "docs");
  await fs.mkdir(docsDir, { recursive: true });
  console.log(`Lean Scale support chatbot is running at http://${host}:${port}`);
});
