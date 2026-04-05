import { createHash } from "node:crypto";
import { products } from "../data/products.js";
import { storePolicies } from "../data/policies.js";
import { createCommerceToolbox } from "./agentTools.js";
import {
  detokenizeValue,
  tokenizeValue
} from "./dataProtection.js";
import {
  buildExternalModelInput,
  sanitizeToolArgsForExternalSharing,
  sanitizeToolOutputForExternalSharing
} from "./externalSharing.js";
import {
  buildSupportInstructions,
  buildSupportResponseFormat,
  inferIntentFromTools,
  normalizeStructuredReply,
  selectSupportModel
} from "./supportBrain.js";


const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/responses";
const DEFAULT_OPENROUTER_MODEL = "deepseek/deepseek-v3.2";
const OPENROUTER_TIMEOUT_MS = Number(
  process.env.OPENROUTER_TIMEOUT_MS ||
  process.env.NETLIFY_OPENROUTER_TIMEOUT_MS ||
  20000
);
const OPENROUTER_MAX_TRANSIENT_RETRIES = Math.max(
  0,
  Number(
    process.env.OPENROUTER_MAX_TRANSIENT_RETRIES ||
    process.env.NETLIFY_OPENROUTER_MAX_TRANSIENT_RETRIES ||
    2
  )
);
const OPENROUTER_RETRY_BASE_DELAY_MS = Math.max(
  0,
  Number(
    process.env.OPENROUTER_RETRY_BASE_DELAY_MS ||
    process.env.NETLIFY_OPENROUTER_RETRY_BASE_DELAY_MS ||
    250
  )
);
const OPENROUTER_MAX_EMPTY_RESPONSE_RETRIES = Math.max(
  0,
  Number(
    process.env.OPENROUTER_MAX_EMPTY_RESPONSE_RETRIES ||
    process.env.NETLIFY_OPENROUTER_MAX_EMPTY_RESPONSE_RETRIES ||
    1
  )
);
const MAX_TOOL_STEPS = 6;

class OpenRouterRequestError extends Error {
  constructor(message, { status = null, responseText = "", durationMs = null } = {}) {
    super(message);
    this.name = "OpenRouterRequestError";
    this.status = status;
    this.responseText = responseText;
    this.durationMs = Number.isFinite(durationMs) ? durationMs : null;
  }
}

function extractOutputText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const parts = [];
  for (const outputItem of payload?.output ?? []) {
    for (const contentItem of outputItem?.content ?? []) {
      if (contentItem?.type === "output_text" && contentItem.text) {
        parts.push(contentItem.text);
      }
    }
  }

  return parts.join("\n").trim();
}

function extractFunctionCalls(payload) {
  return (payload?.output ?? []).filter((item) => item?.type === "function_call");
}

function safeJsonParse(value) {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

function extractProviderErrorText(text = "") {
  try {
    const parsed = JSON.parse(text);
    return String(parsed?.error?.message ?? text).trim();
  } catch {
    return String(text).trim();
  }
}

function buildOpenRouterHeaders(apiKey) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`
  };

  const referer = String(process.env.PUBLIC_APP_URL ?? process.env.URL ?? "").trim();
  const title = String(process.env.OPENROUTER_APP_NAME ?? "Lean Scale AI Support Agent").trim();

  if (referer) {
    headers["HTTP-Referer"] = referer;
  }

  if (title) {
    headers["X-Title"] = title;
  }

  return headers;
}

async function requestOpenRouter({
  apiKey,
  body
}) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);
  let response;

  try {
    response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: buildOpenRouterHeaders(apiKey),
      body: JSON.stringify(body),
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new OpenRouterRequestError(
        `OpenRouter request timed out after ${OPENROUTER_TIMEOUT_MS}ms.`,
        {
          status: 408,
          durationMs: Date.now() - startedAt
        }
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new OpenRouterRequestError(
      `OpenRouter request failed with ${response.status}: ${extractProviderErrorText(text).slice(0, 400)}`,
      {
        status: response.status,
        responseText: text,
        durationMs: Date.now() - startedAt
      }
    );
  }

  return response.json();
}

function buildConversationInput(history = [], message = "", boundary) {
  return buildExternalModelInput(history, message, boundary).map((turn) => ({
    type: "message",
    role: turn.role,
    content: [
      {
        type: "input_text",
        text: String(turn.content ?? "")
      }
    ]
  }));
}

function buildFunctionCallInput(call = {}) {
  const callId = call.call_id ?? call.id;
  const input = {
    type: "function_call",
    call_id: callId,
    name: call.name,
    arguments: typeof call.arguments === "string" ? call.arguments : JSON.stringify(call.arguments ?? {})
  };

  if (call.id) {
    input.id = call.id;
  }

  return input;
}

function buildAgentRequestBody({
  model,
  instructions,
  input,
  tools,
  useStructuredOutput,
  requestOptions,
  relaxedRouting = false
}) {
  const resolvedRequestOptions = relaxedRouting
    ? {
        ...requestOptions,
        provider: undefined,
        reasoning: undefined
      }
    : requestOptions;

  return {
    model,
    instructions,
    input,
    tools,
    ...(useStructuredOutput ? { text: buildSupportResponseFormat() } : {}),
    ...resolvedRequestOptions,
    store: false,
    truncation: "auto",
    parallel_tool_calls: false
  };
}

function shouldRetryWithoutStructuredOutput(error) {
  if (!(error instanceof OpenRouterRequestError)) {
    return false;
  }

  if (![400, 404, 422].includes(error.status)) {
    return false;
  }

  const haystack = `${error.message}\n${error.responseText}`.toLowerCase();
  return [
    "json_schema",
    "structured output",
    "structured response",
    "response_format",
    "text.format",
    "schema",
    "strict"
  ].some((needle) => haystack.includes(needle));
}

function shouldRetryWithRelaxedRouting(error) {
  if (!(error instanceof OpenRouterRequestError)) {
    return false;
  }

  if (![404, 422].includes(error.status)) {
    return false;
  }

  const haystack = `${error.message}\n${error.responseText}`.toLowerCase();
  return [
    "no endpoints found",
    "requested parameters",
    "provider routing"
  ].some((needle) => haystack.includes(needle));
}

function shouldRetryTransientFailure(error) {
  if (error instanceof OpenRouterRequestError) {
    if ([429, 500, 502, 503, 504].includes(error.status)) {
      return true;
    }

    const haystack = `${error.message}\n${error.responseText}`.toLowerCase();
    return [
      "temporarily unavailable",
      "upstream",
      "overloaded",
      "capacity",
      "connection reset",
      "socket hang up",
      "fetch failed"
    ].some((needle) => haystack.includes(needle));
  }

  const message = String(error?.message ?? "").toLowerCase();
  return [
    "fetch failed",
    "socket hang up",
    "econnreset",
    "network",
    "connection reset"
  ].some((needle) => message.includes(needle));
}

function getTransientRetryDelayMs(retryCount) {
  const safeRetryCount = Math.max(1, Number(retryCount) || 1);
  return Math.min(1500, OPENROUTER_RETRY_BASE_DELAY_MS * (2 ** (safeRetryCount - 1)));
}

function wait(ms) {
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestAgentTurn({
  apiKey,
  model,
  instructions,
  input,
  tools,
  requestOptions,
  track,
  sessionId,
  locale
}) {
  const attempts = [
    {
      useStructuredOutput: true,
      relaxedRouting: false,
      transientRetryCount: 0
    }
  ];
  const attempted = new Set();
  let lastError;

  while (attempts.length > 0) {
    const attempt = attempts.shift();
    const attemptKey = `${attempt.useStructuredOutput ? "schema" : "plain"}:${attempt.relaxedRouting ? "relaxed" : "strict"}:${attempt.transientRetryCount ?? 0}`;

    if (attempted.has(attemptKey)) {
      continue;
    }
    attempted.add(attemptKey);

    try {
      return await requestOpenRouter({
        apiKey,
        body: buildAgentRequestBody({
          model,
          instructions,
          input,
          tools,
          useStructuredOutput: attempt.useStructuredOutput,
          requestOptions,
          relaxedRouting: attempt.relaxedRouting
        })
      });
    } catch (error) {
      lastError = error;

      if (shouldRetryWithRelaxedRouting(error) && !attempt.relaxedRouting) {
        track({
          type: "provider_routing_retry",
          sessionId,
          locale,
          provider: "openrouter",
          reason: error.message
        });

        attempts.unshift({
          useStructuredOutput: attempt.useStructuredOutput,
          relaxedRouting: true,
          transientRetryCount: 0
        });

        if (attempt.useStructuredOutput) {
          attempts.push({
            useStructuredOutput: false,
            relaxedRouting: true,
            transientRetryCount: 0
          });
        }

        continue;
      }

      if (shouldRetryWithoutStructuredOutput(error) && attempt.useStructuredOutput) {
        track({
          type: "structured_output_retry",
          sessionId,
          locale,
          provider: "openrouter",
          reason: error.message
        });

        attempts.unshift({
          useStructuredOutput: false,
          relaxedRouting: attempt.relaxedRouting,
          transientRetryCount: 0
        });
        continue;
      }

      if (
        shouldRetryTransientFailure(error) &&
        (attempt.transientRetryCount ?? 0) < OPENROUTER_MAX_TRANSIENT_RETRIES
      ) {
        const retryCount = (attempt.transientRetryCount ?? 0) + 1;
        const delayMs = getTransientRetryDelayMs(retryCount);

        track({
          type: "provider_transient_retry",
          sessionId,
          locale,
          provider: "openrouter",
          retryCount,
          delayMs,
          status: error instanceof OpenRouterRequestError ? error.status : null,
          durationMs: error instanceof OpenRouterRequestError ? error.durationMs : null,
          reason: error instanceof Error ? error.message : "Unknown transient OpenRouter failure"
        });

        await wait(delayMs);
        attempts.unshift({
          ...attempt,
          transientRetryCount: retryCount
        });
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

function classifyProviderFailure(error, locale = "en") {
  const haystack = error instanceof OpenRouterRequestError
    ? `${error.message}\n${error.responseText}`.toLowerCase()
    : String(error?.message ?? "").toLowerCase();

  if (haystack.includes("timed out") || haystack.includes("timeout")) {
    return locale === "ar"
      ? {
          reply: "استغرقت خدمة الدعم الذكية وقتاً أطول من المتوقع. حاول مرة أخرى الآن، وإذا استمرت المشكلة أطلب التحويل إلى موظف دعم.",
          customerAction: "أعد المحاولة الآن أو اطلب التحويل إلى موظف دعم."
        }
      : {
          reply: "The AI support service took too long to respond. Please retry now, or ask me to escalate this to a human agent if it keeps happening.",
          customerAction: "Retry now or ask for a human agent."
        };
  }

  if (
    haystack.includes("rate_limit_exceeded") ||
    haystack.includes("rate limit") ||
    haystack.includes("requests per min") ||
    haystack.includes("rpm") ||
    haystack.includes("daily limit") ||
    haystack.includes("free") && haystack.includes("limit")
  ) {
    return locale === "ar"
      ? {
          reply: "خدمة الدعم الذكية على OpenRouter مزدحمة أو محدودة حالياً. حاول مرة أخرى بعد قليل.",
          customerAction: "أعد المحاولة بعد قليل."
        }
      : {
          reply: "The AI support service on OpenRouter is busy or rate limited right now. Please try again shortly.",
          customerAction: "Wait a little, then try again."
        };
  }

  if (
    haystack.includes("invalid_api_key") ||
    haystack.includes("incorrect api key") ||
    haystack.includes("invalid api key") ||
    haystack.includes("unauthorized") ||
    haystack.includes("api key")
  ) {
    return locale === "ar"
      ? {
          reply: "خدمة الدعم الذكية غير مهيأة بشكل صحيح الآن لأن مفتاح OpenRouter على الخادم غير صالح.",
          customerAction: "حدّث مفتاح OpenRouter على الخادم ثم أعد المحاولة."
        }
      : {
          reply: "The AI support service is misconfigured right now because the server OpenRouter API key was rejected.",
          customerAction: "Update the server OpenRouter API key, then try again."
        };
  }

  if (
    haystack.includes("model") &&
    (haystack.includes("not found") || haystack.includes("not have access") || haystack.includes("does not exist"))
  ) {
    return locale === "ar"
      ? {
          reply: "خدمة الدعم الذكية غير مهيأة بشكل صحيح الآن لأن نموذج OpenRouter المختار غير متاح.",
          customerAction: "تحقق من إعداد نموذج OpenRouter ثم أعد المحاولة."
        }
      : {
          reply: "The AI support service is misconfigured right now because the selected OpenRouter model is unavailable.",
          customerAction: "Check the configured OpenRouter model, then try again."
        };
  }

  return locale === "ar"
    ? {
        reply: "أواجه مشكلة مؤقتة في خدمة الذكاء الاصطناعي الآن. حاول مرة أخرى بعد قليل أو اطلب تحويل الحالة إلى موظف دعم.",
        customerAction: "أعد المحاولة بعد قليل أو اطلب التحويل إلى موظف دعم."
      }
    : {
        reply: "I’m having a temporary problem reaching the AI support service right now. Please try again shortly or ask me to escalate this to a human agent.",
        customerAction: "Try again shortly or ask for a human agent."
      };
}

function sanitizeApiKey(rawValue) {
  const trimmed = String(rawValue ?? "").trim();
  if (!trimmed) {
    return null;
  }

  const wrappedInDoubleQuotes = trimmed.startsWith("\"") && trimmed.endsWith("\"");
  const wrappedInSingleQuotes = trimmed.startsWith("'") && trimmed.endsWith("'");
  if (!wrappedInDoubleQuotes && !wrappedInSingleQuotes) {
    return trimmed;
  }

  const unwrapped = trimmed.slice(1, -1).trim();
  return unwrapped || null;
}

function normalizeHistoryForPlanning(history = [], boundary) {
  return history.map((entry) => ({
    role: entry.role,
    content: String(detokenizeValue(entry.content, boundary) ?? "")
  }));
}

function hasVerifiedCustomerIdentity(customer) {
  return Boolean(
    String(customer?.customerNumber ?? customer?.customerId ?? customer?.id ?? "").trim() ||
    String(customer?.email ?? "").trim() ||
    String(customer?.phone ?? "").trim()
  );
}

function buildStableOpenRouterUser(sessionId, customer) {
  const stableIdentity = [
    sessionId,
    customer?.customerNumber ?? customer?.customerId ?? customer?.id ?? "",
    customer?.email ?? "",
    customer?.phone ?? ""
  ].join(":");

  return `support_${createHash("sha256").update(stableIdentity).digest("hex").slice(0, 24)}`;
}

function isShortSupportFollowUp(message = "") {
  const trimmed = String(message ?? "").trim();
  if (!trimmed) {
    return false;
  }

  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  const lineCount = trimmed.split("\n").length;

  return trimmed.length <= 40 && wordCount <= 6 && lineCount === 1;
}

function buildRequestOptions({
  model,
  message = "",
  history = [],
  customer,
  knownOrders,
  sessionId
}) {
  const trimmed = String(message).trim();
  const visibleOrderCount = Array.isArray(knownOrders) ? knownOrders.length : 0;
  const shortFollowUp = isShortSupportFollowUp(trimmed);
  const complexTurn =
    trimmed.length >= 220 ||
    history.length >= 6 ||
    (hasVerifiedCustomerIdentity(customer) && trimmed.length >= 140) ||
    visibleOrderCount >= 5 ||
    (!shortFollowUp && visibleOrderCount >= 2 && trimmed.length >= 80);
  const providerDataCollection =
    String(
      process.env.OPENROUTER_DATA_COLLECTION ??
      process.env.NETLIFY_OPENROUTER_DATA_COLLECTION ??
      "deny"
    ).trim().toLowerCase() === "allow"
      ? "allow"
      : "deny";
  const requireZeroDataRetention = String(
    process.env.OPENROUTER_REQUIRE_ZDR ??
    process.env.NETLIFY_OPENROUTER_REQUIRE_ZDR ??
    "false"
  ).trim().toLowerCase() === "true";
  const configuredProviderSort = String(
    process.env.OPENROUTER_PROVIDER_SORT ??
    process.env.NETLIFY_OPENROUTER_PROVIDER_SORT ??
    ""
  ).trim().toLowerCase();

  return {
    max_output_tokens: complexTurn ? 1200 : 800,
    temperature: complexTurn ? 0.15 : 0.2,
    tool_choice: "auto",
    user: buildStableOpenRouterUser(sessionId, customer),
    max_tool_calls: MAX_TOOL_STEPS,
    provider: {
      require_parameters: true,
      data_collection: providerDataCollection,
      ...(configuredProviderSort ? { sort: configuredProviderSort } : {}),
      ...(requireZeroDataRetention ? { zdr: true } : {})
    },
    ...(model.startsWith("deepseek/")
      ? {
          reasoning: complexTurn
            ? {
                enabled: true,
                exclude: true
              }
            : {
                enabled: false
              }
        }
      : {})
  };
}

function summarizeCatalog(locale = "en") {
  return products.map((product) => {
    const name = locale === "ar" ? `${product.nameAr} (${product.name})` : `${product.name} (${product.nameAr})`;
    const category = locale === "ar" ? `${product.categoryAr} (${product.category})` : `${product.category} (${product.categoryAr})`;
    const highlights = locale === "ar" ? product.highlightsAr : product.highlights;

    return locale === "ar"
      ? `- ${name}: الفئة ${category}. السعر ${product.priceSar} ${product.currency}. التوفر ${product.stockStatus}. أبرز التفاصيل: ${highlights.slice(0, 4).join("، ")}`
      : `- ${name}: category ${category}. Price ${product.priceSar} ${product.currency}. Availability ${product.stockStatus}. Highlights: ${highlights.slice(0, 4).join(", ")}`;
  }).join("\n");
}

function buildStorefrontContext(locale = "en") {
  const categories = Array.from(
    new Set(
      products.map((product) =>
        locale === "ar"
          ? `${product.categoryAr} (${product.category})`
          : `${product.category} (${product.categoryAr})`
      )
    )
  );
  const governingLaw = storePolicies.contact.governingLaw[locale] ?? storePolicies.contact.governingLaw.en;

  if (locale === "ar") {
    return [
      "معلومات المتجر الموثوقة المتاحة لك في كل محادثة:",
      `- عدد المنتجات الحالية: ${products.length}.`,
      `- الفئات الحالية: ${categories.join("، ")}.`,
      `- البريد الرسمي للدعم: ${storePolicies.contact.email}.`,
      `- رابط التواصل: ${storePolicies.contact.contactUrl}.`,
      `- مزود الدفع: ${storePolicies.contact.paymentsProvider}.`,
      `- نافذة الإرجاع القياسية: ${storePolicies.returns.windowDays} أيام من تاريخ الشراء.`,
      `- استرداد المبلغ عادة خلال ${storePolicies.returns.refundBusinessDays} أيام عمل بعد قبول الإرجاع.`,
      `- الخصوصية آخر تحديث: ${storePolicies.privacy.lastUpdated}.`,
      `- الشروط آخر تحديث: ${storePolicies.terms.lastUpdated}.`,
      `- القانون الحاكم: ${governingLaw}.`,
      "كتالوج المنتجات المتاح:",
      summarizeCatalog(locale)
    ].join("\n");
  }

  return [
    "Trusted storefront knowledge available on every turn:",
    `- Current product count: ${products.length}.`,
    `- Active categories: ${categories.join(", ")}.`,
    `- Official support email: ${storePolicies.contact.email}.`,
    `- Contact URL: ${storePolicies.contact.contactUrl}.`,
    `- Payments provider: ${storePolicies.contact.paymentsProvider}.`,
    `- Standard return window: ${storePolicies.returns.windowDays} days from purchase.`,
    `- Refunds usually complete within ${storePolicies.returns.refundBusinessDays} business days after an approved return.`,
    `- Privacy policy last updated: ${storePolicies.privacy.lastUpdated}.`,
    `- Terms last updated: ${storePolicies.terms.lastUpdated}.`,
    `- Governing law: ${governingLaw}.`,
    "Available catalog snapshot:",
    summarizeCatalog(locale)
  ].join("\n");
}

function buildSessionContext({
  customer,
  knownOrders,
  locale = "en"
}) {
  const verifiedIdentity = hasVerifiedCustomerIdentity(customer);
  const customerSignals = [
    customer?.name ? "name" : null,
    customer?.email ? "email" : null,
    customer?.phone ? "phone" : null,
    customer?.customerNumber || customer?.customerId || customer?.id ? "customer_reference" : null,
    typeof customer?.newsletter === "boolean" ? "newsletter_preference" : null
  ].filter(Boolean);
  const visibleOrderCount = Array.isArray(knownOrders) ? knownOrders.length : 0;
  const latestKnownOrder = Array.isArray(knownOrders) && knownOrders.length > 0
    ? knownOrders[0]
    : null;

  if (locale === "ar") {
    return [
      "سياق الجلسة الحالي:",
      `- هوية العميل ${verifiedIdentity ? "موثقة" : "غير موثقة"}.`,
      `- إشارات الملف المتوفرة في الجلسة: ${customerSignals.length > 0 ? customerSignals.join("، ") : "لا يوجد"}.`,
      `- عدد الطلبات الظاهرة في الجلسة: ${visibleOrderCount}.`,
      latestKnownOrder
        ? `- أحدث طلب ظاهر بدون مشاركة معرفه هنا حالته ${latestKnownOrder.status} والدفع ${latestKnownOrder.paymentStatus}. استخدم الأدوات قبل ذكر أي رقم طلب أو تفاصيل دقيقة.`
        : "- لا يوجد طلب ظاهر جاهز للتلخيص حالياً."
    ].join("\n");
  }

  return [
    "Current session support context:",
    `- Shopper identity is ${verifiedIdentity ? "verified" : "not yet verified"}.`,
    `- Session profile signals available: ${customerSignals.length > 0 ? customerSignals.join(", ") : "none"}.`,
    `- Visible order count attached to this session: ${visibleOrderCount}.`,
    latestKnownOrder
      ? `- The latest visible order is present with status ${latestKnownOrder.status} and payment status ${latestKnownOrder.paymentStatus}. Use tools before mentioning any exact order details.`
      : "- No visible order snapshot is currently attached."
  ].join("\n");
}

export function createSupportAgent({ track = () => {} } = {}) {
  const configuredModel =
    process.env.OPENROUTER_MODEL ||
    process.env.NETLIFY_OPENROUTER_MODEL ||
    DEFAULT_OPENROUTER_MODEL;
  const config = {
    defaultModel: configuredModel,
    cheapModel:
      process.env.OPENROUTER_CHEAP_MODEL ||
      process.env.NETLIFY_OPENROUTER_CHEAP_MODEL ||
      configuredModel,
    complexModel:
      process.env.OPENROUTER_COMPLEX_MODEL ||
      process.env.NETLIFY_OPENROUTER_COMPLEX_MODEL ||
      configuredModel
  };

  function resolveApiKey(requestApiKey) {
    return sanitizeApiKey(
      requestApiKey ||
      process.env.OPENROUTER_API_KEY ||
      process.env.NETLIFY_OPENROUTER_API_KEY ||
      process.env.X_OPENROUTER_KEY ||
      null
    );
  }

  async function respond({
    sessionId,
    locale,
    storefrontLocale,
    message,
    history,
    customer,
    knownOrders,
    sharingBoundary,
    cacheStore,
    idempotencyStore,
    openrouterApiKey,
    commerceProvider
  }) {
    const apiKey = resolveApiKey(openrouterApiKey);

    if (!apiKey) {
      return {
        reply:
          locale === "ar"
            ? "خدمة الدعم الذكية غير مفعلة حالياً لأن مفتاح OpenRouter API غير مضاف على الخادم."
            : "The AI support agent is not configured right now because the OpenRouter API key is missing on the server.",
        intent: "configuration_error",
        confidence: 0
      };
    }

    const toolbox = createCommerceToolbox({
      locale,
      sessionId,
      customer,
      knownOrders,
      cacheStore,
      idempotencyStore,
      commerceProvider,
      track
    });
    const visibleHistory = normalizeHistoryForPlanning(history, sharingBoundary);
    const selectedModel = selectSupportModel({
      message,
      history: visibleHistory,
      customer,
      knownOrders,
      config
    });
    const instructions = buildSupportInstructions({
      locale,
      // Keep the full prompt in the shopper's active language for this turn.
      // Mixing a large storefront context in the site locale can pull the model
      // away from replying in the language of the latest message.
      storeContext: buildStorefrontContext(locale ?? storefrontLocale ?? "en"),
      sessionContext: buildSessionContext({
        customer,
        knownOrders,
        locale
      })
    });
    const requestOptions = buildRequestOptions({
      model: selectedModel,
      message,
      history: visibleHistory,
      customer,
      knownOrders,
      sessionId
    });
    const toolTrace = [];
    let model = selectedModel;
    let conversationInput = buildConversationInput(history, message, sharingBoundary);
    let emptyResponseRetryCount = 0;

    try {
      let payload = await requestAgentTurn({
        apiKey,
        model,
        instructions,
        input: conversationInput,
        tools: toolbox.tools,
        requestOptions,
        track,
        sessionId,
        locale
      });

      for (let step = 0; step < MAX_TOOL_STEPS; step += 1) {
        const functionCalls = extractFunctionCalls(payload);
        if (functionCalls.length === 0) {
          const reply = extractOutputText(payload);
          const normalized = normalizeStructuredReply({
            payload,
            outputText: reply,
            locale,
            toolTrace
          });

          if (!normalized) {
            if (emptyResponseRetryCount < OPENROUTER_MAX_EMPTY_RESPONSE_RETRIES) {
              emptyResponseRetryCount += 1;
              track({
                type: "provider_empty_response_retry",
                sessionId,
                locale,
                provider: "openrouter",
                retryCount: emptyResponseRetryCount,
                toolCount: toolTrace.length
              });
              payload = await requestAgentTurn({
                apiKey,
                model,
                instructions,
                input: conversationInput,
                tools: toolbox.tools,
                requestOptions,
                track,
                sessionId,
                locale
              });
              continue;
            }

            throw new Error("OpenRouter returned no text response.");
          }

          const structured = detokenizeValue(normalized.structured, sharingBoundary);

          return {
            reply: detokenizeValue(normalized.reply, sharingBoundary),
            intent: normalized.intent,
            confidence: normalized.confidence,
            model,
            toolTrace,
            structured
          };
        }

        const toolOutputs = [];
        const serializedCalls = [];

        for (const call of functionCalls) {
          const callId = call.call_id ?? call.id;
          const args = safeJsonParse(call.arguments);
          const resolvedArgs = detokenizeValue(args, sharingBoundary);
          const output = await toolbox.execute(call.name, resolvedArgs);
          const protectedArgs = sanitizeToolArgsForExternalSharing(
            call.name,
            tokenizeValue(resolvedArgs, sharingBoundary),
            sharingBoundary
          );
          const protectedOutput = sanitizeToolOutputForExternalSharing(
            call.name,
            tokenizeValue(output, sharingBoundary),
            sharingBoundary
          );
          toolTrace.push({
            tool: call.name,
            args: protectedArgs,
            output: protectedOutput
          });
          serializedCalls.push(buildFunctionCallInput(call));
          toolOutputs.push({
            type: "function_call_output",
            call_id: callId,
            output: JSON.stringify(protectedOutput)
          });
        }

        conversationInput = [...conversationInput, ...serializedCalls, ...toolOutputs];
        payload = await requestAgentTurn({
          apiKey,
          model,
          instructions,
          input: conversationInput,
          tools: toolbox.tools,
          requestOptions,
          track,
          sessionId,
          locale
        });
      }

      throw new Error("OpenRouter tool loop exceeded the safety limit.");
    } catch (error) {
      const failure = classifyProviderFailure(error, locale);

      track({
        type: "agent_fallback",
        sessionId,
        locale,
        provider: "openrouter",
        status: error instanceof OpenRouterRequestError ? error.status : null,
        durationMs: error instanceof OpenRouterRequestError ? error.durationMs : null,
        reason: error instanceof Error ? error.message : "Unknown OpenRouter failure"
      });

      return {
        reply: failure.reply,
        intent: inferIntentFromTools(toolTrace),
        confidence: 0.15,
        model,
        degraded: true,
        structured: {
          intent: inferIntentFromTools(toolTrace),
          resolution: "temporary_failure",
          handoffRecommended: true,
          customerAction: failure.customerAction
        }
      };
    }
  }

  return {
    respond,
    getStatus() {
      const configuredKey = resolveApiKey(null);
      return {
        enabled: Boolean(configuredKey),
        provider: "openrouter",
        model: config.defaultModel,
        cheapModel: config.cheapModel,
        complexModel: config.complexModel,
        freeOnly: false
      };
    }
  };
}
