import { createHash } from "node:crypto";
import { createCommerceToolbox } from "./agentTools.js";
import { findProduct } from "./commerce.js";
import { products } from "../data/products.js";
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
const MAX_TOOL_STEPS = 6;
const ORDER_NUMBER_PATTERN = /\b[A-Z]{1,4}-\d+\b/i;
const CATALOG_FOLLOW_UP_PATTERN =
  /(?:details?|specs?|specifications?|features?|price|availability|colors?|size|tell me more|more info|more information|it|this one|that one|تفاصيل|مواصفات|سعر|التوفر|ألوان|الوان|مقاس|المزيد|هذا المنتج|هذا|هالمنتج)/i;
const RECOMMENDATION_PATTERN = /(?:recommend|best|top|gift|رشح|أفضل|افضل|أنسب|انسب|هدية)/i;
const CATALOG_BROWSE_PATTERN = /(?:products|catalog|browse|show me products|اعرض المنتجات|منتجات|الكتالوج|الفئات)/i;
const NON_CATALOG_PATTERN =
  /(?:where is my order|latest order|most recent order|last order|track|shipment|order\b|refund|return|cancel|change address|privacy|terms|payment|human|agent|profile|account|طلبي|آخر طلب|أحدث طلب|تتبع|استرجاع|استرداد|إلغاء|الغاء|الخصوصية|الشروط|الدفع|موظف|خدمة العملاء|حسابي|ملفي)/i;
const PROFILE_PATTERN =
  /(?:my profile|my account|saved profile|profile on file|check my profile|check my account|what email|which email|what phone|which phone|customer number on file|saved customer number|ملفي|حسابي|البريد المحفوظ|رقم الجوال المحفوظ|رقم العميل المحفوظ|الملف المحفوظ)/i;
const LATEST_ORDER_PATTERN =
  /(?:latest order|most recent order|last order|newest order|where is my latest order|where is my most recent order|my latest order|my most recent order|آخر طلب|أحدث طلب|آخر طلب لي|أحدث طلب لي)/i;
const ORDER_TRACKING_PATTERN =
  /(?:where is my order|track|tracking|shipment|delivery status|order status|status of my order|my order status|my order|طلبي|تتبع|الشحنة|حالة الطلب)/i;
const RETURN_PATTERN = /(?:refund|return|exchange|استرجاع|استرداد|إرجاع|ارجاع)/i;
const CANCELLATION_PATTERN =
  /(?:cancel|cancellation|change address|edit order|modify order|update order|إلغاء|الغاء|تعديل العنوان|تعديل الطلب)/i;
const POLICY_PATTERN =
  /(?:privacy|data retention|terms|shipping|payment|payments|cookie|cookies|returns policy|refund policy|contact|الخصوصية|البيانات|الاحتفاظ بالبيانات|الشروط|الشحن|الدفع|الدفع|الكوكيز|سياسة الاسترجاع|سياسة الإرجاع|التواصل)/i;
const HUMAN_HANDOFF_PATTERN =
  /(?:human|agent|representative|support team|real person|موظف|ممثل خدمة|خدمة العملاء|فريق الدعم)/i;
const CATEGORY_TERMS = Array.from(
  new Set(
    products
      .flatMap((product) => [product.category, product.categoryAr])
      .filter(Boolean)
      .map((value) => String(value).toLowerCase())
  )
);

class OpenRouterRequestError extends Error {
  constructor(message, { status = null, responseText = "" } = {}) {
    super(message);
    this.name = "OpenRouterRequestError";
    this.status = status;
    this.responseText = responseText;
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
          status: 408
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
        responseText: text
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

function buildForcedFunctionToolChoice(name) {
  return {
    type: "function",
    name
  };
}

function extractOrderNumber(message = "") {
  return String(message).match(ORDER_NUMBER_PATTERN)?.[0] ?? null;
}

function buildGuardrailedToolChoice(message = "") {
  const trimmed = String(message).trim();
  if (!trimmed) {
    return "auto";
  }

  const orderNumber = extractOrderNumber(trimmed);

  if (HUMAN_HANDOFF_PATTERN.test(trimmed)) {
    return buildForcedFunctionToolChoice("create_handoff");
  }

  if (PROFILE_PATTERN.test(trimmed)) {
    return buildForcedFunctionToolChoice("get_customer_profile");
  }

  if (LATEST_ORDER_PATTERN.test(trimmed)) {
    return buildForcedFunctionToolChoice("list_customer_orders");
  }

  if (RETURN_PATTERN.test(trimmed)) {
    return orderNumber
      ? buildForcedFunctionToolChoice("get_return_options")
      : "required";
  }

  if (CANCELLATION_PATTERN.test(trimmed)) {
    return orderNumber
      ? buildForcedFunctionToolChoice("get_cancellation_options")
      : "required";
  }

  if (POLICY_PATTERN.test(trimmed)) {
    return buildForcedFunctionToolChoice("get_policy_information");
  }

  if (ORDER_TRACKING_PATTERN.test(trimmed)) {
    return orderNumber
      ? buildForcedFunctionToolChoice("get_order_details")
      : "required";
  }

  return "auto";
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
      relaxedRouting: false
    }
  ];
  const attempted = new Set();
  let lastError;

  while (attempts.length > 0) {
    const attempt = attempts.shift();
    const attemptKey = `${attempt.useStructuredOutput ? "schema" : "plain"}:${attempt.relaxedRouting ? "relaxed" : "strict"}`;

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
          relaxedRouting: true
        });

        if (attempt.useStructuredOutput) {
          attempts.push({
            useStructuredOutput: false,
            relaxedRouting: true
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
          relaxedRouting: attempt.relaxedRouting
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

  if (haystack.includes("model") && (haystack.includes("not found") || haystack.includes("not have access") || haystack.includes("does not exist"))) {
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

function buildRequestOptions({
  model,
  message = "",
  history = [],
  customer,
  knownOrders,
  sessionId
}) {
  const trimmed = String(message).trim();
  const toolChoice = buildGuardrailedToolChoice(trimmed);
  const simpleTurn =
    trimmed.length <= 90 &&
    history.length <= 4 &&
    !hasVerifiedCustomerIdentity(customer) &&
    (!Array.isArray(knownOrders) || knownOrders.length === 0);
  const complexTurn =
    trimmed.length >= 220 ||
    history.length >= 6 ||
    (hasVerifiedCustomerIdentity(customer) && trimmed.length >= 140) ||
    (Array.isArray(knownOrders) && knownOrders.length > 0);
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
  const providerSort =
    configuredProviderSort ||
    (simpleTurn && toolChoice === "auto" ? "price" : "");

  return {
    max_output_tokens: complexTurn ? 1200 : simpleTurn ? 450 : 800,
    temperature: complexTurn ? 0.15 : 0.2,
    tool_choice: toolChoice,
    user: buildStableOpenRouterUser(sessionId, customer),
    max_tool_calls: MAX_TOOL_STEPS,
    provider: {
      require_parameters: true,
      data_collection: providerDataCollection,
      ...(providerSort ? { sort: providerSort } : {}),
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

function formatList(values = [], locale = "en") {
  const filtered = values.filter(Boolean);
  return filtered.join(locale === "ar" ? "، " : ", ");
}

function formatStockStatus(stockStatus = "", locale = "en") {
  switch (stockStatus) {
    case "in_stock":
      return locale === "ar" ? "متوفر الآن" : "In stock";
    case "low_stock":
      return locale === "ar" ? "كمية محدودة" : "Low stock";
    case "out_of_stock":
      return locale === "ar" ? "غير متوفر حالياً" : "Out of stock";
    default:
      return locale === "ar" ? "تحقق من التوفر" : "Check availability";
  }
}

function buildCatalogToolTrace({ action, output, sharingBoundary }) {
  return [
    {
      tool: "search_catalog",
      args: sanitizeToolArgsForExternalSharing(
        "search_catalog",
        tokenizeValue(action, sharingBoundary),
        sharingBoundary
      ),
      output: sanitizeToolOutputForExternalSharing(
        "search_catalog",
        tokenizeValue(output, sharingBoundary),
        sharingBoundary
      )
    }
  ];
}

function buildOrderToolTrace({ tool, args, output, sharingBoundary }) {
  return [
    {
      tool,
      args: sanitizeToolArgsForExternalSharing(
        tool,
        tokenizeValue(args, sharingBoundary),
        sharingBoundary
      ),
      output: sanitizeToolOutputForExternalSharing(
        tool,
        tokenizeValue(output, sharingBoundary),
        sharingBoundary
      )
    }
  ];
}

function buildSpecificOrderReply(order, locale = "en") {
  if (locale === "ar") {
    return `طلبك ${order.orderNumber} حالته ${order.status}. الموعد المتوقع: ${order.eta}. شركة الشحن: ${order.courier}.`;
  }

  return `Your order ${order.orderNumber} is currently ${order.status}. ETA: ${order.eta}. Courier: ${order.courier}.`;
}

function buildLatestVisibleOrderReply(order, locale = "en") {
  if (locale === "ar") {
    return `آخر طلب ظاهر لك هو ${order.orderNumber}. حالته ${order.status}. الموعد المتوقع: ${order.eta}. شركة الشحن: ${order.courier}.`;
  }

  return `Your latest visible order is ${order.orderNumber}. Status: ${order.status}. ETA: ${order.eta}. Courier: ${order.courier}.`;
}

function planDeterministicOrderAction(message = "") {
  if (PROFILE_PATTERN.test(message) || RETURN_PATTERN.test(message) || CANCELLATION_PATTERN.test(message) || POLICY_PATTERN.test(message) || HUMAN_HANDOFF_PATTERN.test(message)) {
    return null;
  }

  const orderNumber = extractOrderNumber(message);
  if (orderNumber && ORDER_TRACKING_PATTERN.test(message)) {
    return {
      tool: "get_order_details",
      args: {
        orderNumber
      }
    };
  }

  if (LATEST_ORDER_PATTERN.test(message) || ORDER_TRACKING_PATTERN.test(message)) {
    return {
      tool: "list_customer_orders",
      args: {}
    };
  }

  return null;
}

function buildDeterministicOrderResponse({ action, output, locale = "en", sharingBoundary }) {
  const toolTrace = buildOrderToolTrace({
    tool: action.tool,
    args: action.args,
    output,
    sharingBoundary
  });

  if (output?.ok === false) {
    if (output.code === "identity_required") {
      return {
        reply: output.message,
        intent: "order_tracking",
        confidence: 0.7,
        toolTrace,
        structured: {
          intent: "order_tracking",
          resolution: "identity_required",
          handoffRecommended: false,
          customerAction:
            locale === "ar"
              ? "شارك البريد الإلكتروني أو رقم الجوال أو رقم العميل الموثق."
              : "Share the verified email, phone number, or customer number on the order."
        }
      };
    }

    if (output.code === "order_number_required") {
      return {
        reply: output.message,
        intent: "order_tracking",
        confidence: 0.72,
        toolTrace,
        structured: {
          intent: "order_tracking",
          resolution: "order_number_required",
          handoffRecommended: false,
          customerAction:
            locale === "ar"
              ? "شارك رقم الطلب الذي تريد مراجعته."
              : "Share the order number you want checked."
        }
      };
    }

    return {
      reply: output.message,
      intent: "order_tracking",
      confidence: 0.3,
      degraded: output.code === "tool_error",
      toolTrace,
      structured: {
        intent: "order_tracking",
        resolution: output.code === "tool_error" ? "temporary_failure" : "fallback",
        handoffRecommended: output.code === "tool_error",
        customerAction:
          output.code === "tool_error"
            ? locale === "ar"
              ? "أعد المحاولة بعد قليل أو اطلب التحويل إلى موظف دعم."
              : "Try again shortly or ask for a human agent."
            : ""
      }
    };
  }

  if (action.tool === "get_order_details" && output.order) {
    return {
      reply: buildSpecificOrderReply(output.order, locale),
      intent: "order_tracking",
      confidence: 0.95,
      toolTrace,
      structured: {
        intent: "order_tracking",
        resolution: "answered",
        handoffRecommended: false,
        customerAction: ""
      }
    };
  }

  const latestOrder = output.orders?.[0] ?? null;
  if (!latestOrder) {
    return {
      reply:
        locale === "ar"
          ? "لم أجد طلباً ظاهراً بعد. شارك رقم الطلب أو البريد الإلكتروني الموثق وسأتحقق مرة أخرى."
          : "I couldn't find a visible order yet. Share your order number or verified email and I’ll check again.",
      intent: "order_tracking",
      confidence: 0.7,
      toolTrace,
      structured: {
        intent: "order_tracking",
        resolution: "clarification_needed",
        handoffRecommended: false,
        customerAction:
          locale === "ar"
            ? "شارك رقم الطلب أو البريد الإلكتروني الموثق."
            : "Share your order number or verified email."
      }
    };
  }

  return {
    reply: buildLatestVisibleOrderReply(latestOrder, locale),
    intent: "order_tracking",
    confidence: 0.91,
    toolTrace,
    structured: {
      intent: "order_tracking",
      resolution: "answered",
      handoffRecommended: false,
      customerAction: ""
    }
  };
}

function inferPolicyTopic(message = "") {
  const normalized = String(message).toLowerCase();

  if (/(?:return policy|refund policy|return|refund|exchange|استرجاع|استرداد|ارجاع|استبدال)/i.test(message)) {
    return "returns";
  }

  if (/(?:privacy|data retention|data|cookies?|الخصوصية|البيانات|الاحتفاظ بالبيانات|الكوكيز)/i.test(message)) {
    return "privacy";
  }

  if (/(?:terms|conditions|الشروط|الأحكام)/i.test(message)) {
    return "terms";
  }

  if (/(?:shipping|delivery|shipment|الشحن|التوصيل)/i.test(message)) {
    return "shipping";
  }

  if (/(?:payment|payments|mada|visa|mastercard|apple pay|cash on delivery|الدفع|مدى|فيزا|ماستركارد|ابل باي|الدفع عند الاستلام)/i.test(message)) {
    return "payments";
  }

  if (/(?:contact|email|phone|whatsapp|support|التواصل|البريد|الايميل|واتساب|الدعم)/i.test(message)) {
    return "contact";
  }

  return "general";
}

function planDeterministicPolicyAction(message = "") {
  if (!POLICY_PATTERN.test(message)) {
    return null;
  }

  return {
    tool: "get_policy_information",
    args: {
      topic: inferPolicyTopic(message),
      question: message
    }
  };
}

function buildDeterministicPolicyResponse({ action, output, locale = "en", sharingBoundary }) {
  const toolTrace = buildOrderToolTrace({
    tool: action.tool,
    args: action.args,
    output,
    sharingBoundary
  });

  if (output?.ok === false) {
    return {
      reply: output.message,
      intent: "policy_info",
      confidence: 0.3,
      degraded: output.code === "tool_error",
      toolTrace,
      structured: {
        intent: "policy_info",
        resolution: output.code === "tool_error" ? "temporary_failure" : "fallback",
        handoffRecommended: output.code === "tool_error",
        customerAction:
          output.code === "tool_error"
            ? locale === "ar"
              ? "أعد المحاولة بعد قليل أو اطلب التحويل إلى موظف دعم."
              : "Try again shortly or ask for a human agent."
            : ""
      }
    };
  }

  return {
    reply: output.answer,
    intent: "policy_info",
    confidence: 0.92,
    toolTrace,
    structured: {
      intent: "policy_info",
      resolution: "answered",
      handoffRecommended: false,
      customerAction: ""
    }
  };
}

function buildProductReply(match, locale = "en") {
  if (locale === "ar") {
    return [
      `${match.name}`,
      `السعر: ${match.priceSar} ${match.currency}`,
      `الوصف: ${match.shortDescription}`,
      `التوفر: ${formatStockStatus(match.stockStatus, locale)}`,
      `التقييم: ${match.rating}/5`,
      `المقاس: ${match.size}`,
      `الألوان: ${formatList(match.colors, locale)}`,
      `أبرز التفاصيل: ${formatList(match.highlights, locale)}`
    ].join("\n");
  }

  return [
    `${match.name}`,
    `Price: ${match.priceSar} ${match.currency}`,
    `Description: ${match.shortDescription}`,
    `Availability: ${formatStockStatus(match.stockStatus, locale)}`,
    `Rating: ${match.rating}/5`,
    `Size: ${match.size}`,
    `Colors: ${formatList(match.colors, locale)}`,
    `Highlights: ${formatList(match.highlights, locale)}`
  ].join("\n");
}

function buildRecommendationReply(output, locale = "en") {
  const lines = output.matches.map((item) =>
    locale === "ar"
      ? `- ${item.name}: ${item.priceSar} ${item.currency} — ${item.shortDescription}`
      : `- ${item.name}: ${item.priceSar} ${item.currency} — ${item.shortDescription}`
  );

  return [output.rationale, ...lines].filter(Boolean).join("\n\n");
}

function findRecentProductReference(message = "", history = []) {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const entry = history[index];
    const product = findProduct(entry?.content ?? "");
    if (product) {
      return product;
    }
  }

  return null;
}

function normalizeCatalogText(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[!?.,،؛:()/-]+/g, " ")
    .replace(/\s+/g, " ");
}

function findCategoryReference(message = "") {
  const normalizedMessage = ` ${normalizeCatalogText(message)} `;

  for (const category of CATEGORY_TERMS) {
    const normalizedCategory = normalizeCatalogText(category);
    if (normalizedCategory && normalizedMessage.includes(` ${normalizedCategory} `)) {
      return category;
    }
  }

  return null;
}

function planDeterministicCatalogAction(message = "", history = []) {
  if (NON_CATALOG_PATTERN.test(message)) {
    return null;
  }

  if (RECOMMENDATION_PATTERN.test(message)) {
    return {
      query: message,
      mode: "recommendation"
    };
  }

  const categoryReference = findCategoryReference(message);
  if (categoryReference) {
    return {
      query: categoryReference,
      mode: "category_browse"
    };
  }

  const directProductMatch = findProduct(message);
  if (directProductMatch) {
    return {
      query: directProductMatch.name,
      mode: "product_lookup"
    };
  }

  if (CATALOG_BROWSE_PATTERN.test(message)) {
    return {
      query: message,
      mode: "catalog_overview"
    };
  }

  if (CATALOG_FOLLOW_UP_PATTERN.test(message)) {
    const recentProduct = findRecentProductReference("", history);
    if (recentProduct) {
      return {
        query: recentProduct.name,
        mode: "product_lookup"
      };
    }
  }

  return null;
}

function buildDeterministicCatalogResponse({ action, output, locale = "en", sharingBoundary }) {
  const toolTrace = buildCatalogToolTrace({ action, output, sharingBoundary });

  if (output?.ok === false) {
    return {
      reply: output.message,
      intent: action.mode === "recommendation" ? "recommendations" : "product_information",
      confidence: 0.3,
      degraded: true,
      toolTrace,
      structured: {
        intent: action.mode === "recommendation" ? "recommendations" : "product_information",
        resolution: "temporary_failure",
        handoffRecommended: true,
        customerAction: locale === "ar" ? "أعد المحاولة بعد قليل أو اطلب التحويل إلى موظف دعم." : "Try again shortly or ask for a human agent."
      }
    };
  }

  if (output.match) {
    return {
      reply: buildProductReply(output.match, locale),
      intent: "product_information",
      confidence: 0.96,
      toolTrace,
      structured: {
        intent: "product_information",
        resolution: "answered",
        handoffRecommended: false,
        customerAction: ""
      }
    };
  }

  if (output.matches?.length) {
    return {
      reply:
        action.mode === "recommendation"
          ? buildRecommendationReply(output, locale)
          : output.matches
              .map((item) => `${item.name} - ${item.priceSar} ${item.currency}`)
              .join("\n"),
      intent: action.mode === "recommendation" ? "recommendations" : "catalog_browse",
      confidence: action.mode === "recommendation" ? 0.9 : 0.88,
      toolTrace,
      structured: {
        intent: action.mode === "recommendation" ? "recommendations" : "catalog_browse",
        resolution: "answered",
        handoffRecommended: false,
        customerAction: ""
      }
    };
  }

  return {
    reply:
      output.summary ??
      (locale === "ar"
        ? "اذكر اسم المنتج أو الفئة أو الاستخدام الذي تريده وسأبحث لك في الكتالوج."
        : "Tell me the product name, category, or use case and I’ll search the catalog for you."),
    intent: "catalog_browse",
    confidence: 0.74,
    toolTrace,
    structured: {
      intent: "catalog_browse",
      resolution: "clarification_needed",
      handoffRecommended: false,
      customerAction: locale === "ar" ? "اذكر اسم المنتج أو الفئة أو الاستخدام." : "Tell me the product name, category, or use case."
    }
  };
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
    const deterministicCatalogAction = planDeterministicCatalogAction(message, visibleHistory);
    const deterministicOrderAction = planDeterministicOrderAction(message);
    const deterministicPolicyAction = planDeterministicPolicyAction(message);
    const shouldBypassProviderForCatalog =
      deterministicCatalogAction &&
      deterministicCatalogAction.mode !== "product_lookup";

    if (deterministicPolicyAction) {
      const output = await toolbox.execute(deterministicPolicyAction.tool, deterministicPolicyAction.args);
      return buildDeterministicPolicyResponse({
        action: deterministicPolicyAction,
        output,
        locale,
        sharingBoundary
      });
    }

    if (deterministicOrderAction) {
      const output = await toolbox.execute(deterministicOrderAction.tool, deterministicOrderAction.args);
      return buildDeterministicOrderResponse({
        action: deterministicOrderAction,
        output,
        locale,
        sharingBoundary
      });
    }

    if (shouldBypassProviderForCatalog) {
      const output = await toolbox.execute("search_catalog", deterministicCatalogAction);
      return buildDeterministicCatalogResponse({
        action: deterministicCatalogAction,
        output,
        locale,
        sharingBoundary
      });
    }

    if (!apiKey) {
      if (deterministicCatalogAction) {
        const output = await toolbox.execute("search_catalog", deterministicCatalogAction);
        return buildDeterministicCatalogResponse({
          action: deterministicCatalogAction,
          output,
          locale,
          sharingBoundary
        });
      }

      return {
        reply:
          locale === "ar"
            ? "خدمة الدعم الذكية غير مفعلة حالياً لأن مفتاح OpenRouter API غير مضاف على الخادم."
            : "The AI support agent is not configured right now because the OpenRouter API key is missing on the server.",
        intent: "configuration_error",
        confidence: 0
      };
    }

    const selectedModel = selectSupportModel({
      message,
      history,
      customer,
      knownOrders,
      config
    });
    const instructions = buildSupportInstructions({
      locale
    });
    const requestOptions = buildRequestOptions({
      model: selectedModel,
      message,
      history,
      customer,
      knownOrders,
      sessionId
    });
    const toolTrace = [];
    let model = selectedModel;
    let conversationInput = buildConversationInput(history, message, sharingBoundary);

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
      if (deterministicCatalogAction) {
        const output = await toolbox.execute("search_catalog", deterministicCatalogAction);
        return buildDeterministicCatalogResponse({
          action: deterministicCatalogAction,
          output,
          locale,
          sharingBoundary
        });
      }

      const failure = classifyProviderFailure(error, locale);

      track({
        type: "agent_fallback",
        sessionId,
        locale,
        provider: "openrouter",
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
