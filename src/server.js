import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createChatbot } from "./lib/chatbot.js";
import { integrationMap } from "./integrations/index.js";
import { createOrder, listOrders } from "./data/orders.js";
import { products } from "./data/products.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "public");
const chatbot = createChatbot();
const port = process.env.PORT || 3000;
const host = process.env.HOST || "127.0.0.1";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
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
          "Where is my order KS-10421?",
          "I want a refund for KS-10388",
          "Recommend the best product for travel",
          "What payment methods do you support?",
          "What data do you collect?",
          "What are your terms and conditions?",
          "I need a human agent"
        ],
        samplePromptsAr: [
          "أريد معرفة تفاصيل ماوس لاسلكي",
          "أين طلبي KS-10421؟",
          "أريد استرداد الطلب KS-10388",
          "رشح لي أفضل منتج للسفر",
          "ما طرق الدفع المتاحة؟",
          "ما البيانات التي تجمعونها؟",
          "ما هي الشروط والأحكام؟",
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
      sendJson(response, 200, { orders: listOrders() });
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/analytics") {
      sendJson(response, 200, { events: chatbot.getAnalytics() });
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/chat") {
      const rawBody = await readRequestBody(request);
      const parsed = JSON.parse(rawBody || "{}");
      const sessionId = parsed.sessionId || crypto.randomUUID();
      const result = await chatbot.chat({
        sessionId,
        message: parsed.message ?? "",
        preferredLocale: parsed.preferredLocale === "ar" ? "ar" : "en",
        customerProfile: parsed.customerProfile ?? null,
        knownOrders: Array.isArray(parsed.knownOrders) ? parsed.knownOrders : []
      });

      sendJson(response, 200, {
        sessionId,
        ...result
      });
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/orders") {
      const rawBody = await readRequestBody(request);
      const parsed = JSON.parse(rawBody || "{}");
      const order = createOrder({
        customerName: parsed.customerName,
        email: parsed.email,
        items: parsed.items ?? [],
        locale: parsed.locale === "ar" ? "ar" : "en"
      });

      sendJson(response, 201, {
        order,
        orders: listOrders()
      });
      return;
    }

    await serveStatic({ ...request, url: requestUrl.pathname }, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    sendJson(response, 500, {
      error: message
    });
  }
});

server.listen(port, host, async () => {
  const docsDir = path.join(__dirname, "..", "docs");
  await fs.mkdir(docsDir, { recursive: true });
  console.log(`Lean Scale support chatbot is running at http://${host}:${port}`);
});
