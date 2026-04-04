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

const OPENAI_API_URL = "https://api.openai.com/v1/responses";

class OpenAIRequestError extends Error {
  constructor(message, { status = null, responseText = "" } = {}) {
    super(message);
    this.name = "OpenAIRequestError";
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

async function requestOpenAI({
  apiKey,
  body
}) {
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new OpenAIRequestError(
      `OpenAI request failed with ${response.status}: ${text.slice(0, 400)}`,
      {
        status: response.status,
        responseText: text
      }
    );
  }

  return response.json();
}

function buildReasoningPayload(model, reasoning) {
  return /^gpt-5(?:$|[.-])/.test(String(model ?? "").trim()) ? reasoning : undefined;
}

function classifyOpenAIFailure(error, locale = "en") {
  const haystack = error instanceof OpenAIRequestError
    ? `${error.message}\n${error.responseText}`.toLowerCase()
    : String(error?.message ?? "").toLowerCase();

  if (haystack.includes("insufficient_quota") || haystack.includes("current quota") || haystack.includes("billing")) {
    return locale === "ar"
      ? {
          reply: "خدمة الدعم الذكية متوقفة الآن لأن رصيد أو حصة OpenAI غير كافية على الخادم. حدّث الفوترة أو الحصة ثم أعد المحاولة.",
          customerAction: "حدّث الفوترة أو الحصة في OpenAI ثم أعد المحاولة."
        }
      : {
          reply: "The AI support service is out of OpenAI quota right now. Please update billing or quota settings and try again.",
          customerAction: "Update OpenAI billing or quota settings, then try again."
        };
  }

  if (haystack.includes("rate limit") || haystack.includes("requests per min") || haystack.includes("rpm")) {
    return locale === "ar"
      ? {
          reply: "خدمة الدعم الذكية تتعرض حالياً لتحديد مؤقت في عدد الطلبات. انتظر قليلاً ثم أعد المحاولة.",
          customerAction: "انتظر بضع ثوانٍ ثم أعد المحاولة."
        }
      : {
          reply: "The AI support service is being rate limited right now. Please wait a few seconds and try again.",
          customerAction: "Wait a few seconds, then try again."
        };
  }

  if (
    haystack.includes("invalid_api_key") ||
    haystack.includes("incorrect api key") ||
    haystack.includes("invalid api key") ||
    haystack.includes("unauthorized")
  ) {
    return locale === "ar"
      ? {
          reply: "خدمة الدعم الذكية غير مهيأة بشكل صحيح الآن لأن مفتاح OpenAI على الخادم غير صالح.",
          customerAction: "حدّث مفتاح OpenAI على الخادم ثم أعد المحاولة."
        }
      : {
          reply: "The AI support service is misconfigured right now because the server OpenAI API key was rejected.",
          customerAction: "Update the server OpenAI API key, then try again."
        };
  }

  if (haystack.includes("model") && (haystack.includes("not found") || haystack.includes("not have access") || haystack.includes("does not exist"))) {
    return locale === "ar"
      ? {
          reply: "خدمة الدعم الذكية غير مهيأة بشكل صحيح الآن لأن نموذج OpenAI المطلوب غير متاح لهذا المفتاح.",
          customerAction: "تحقق من إعداد النموذج أو استخدم نموذجاً متاحاً ثم أعد المحاولة."
        }
      : {
          reply: "The AI support service is misconfigured right now because the selected OpenAI model is unavailable for this API key.",
          customerAction: "Check the configured model or switch to one this API key can use."
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

function buildModelFallbackCandidates(model) {
  const candidates = [];
  const seen = new Set();

  function addCandidate(value) {
    const normalized = String(value ?? "").trim();
    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    candidates.push(normalized);
  }

  addCandidate(model);

  const aliases = {
    "gpt-5.4-mini": ["gpt-5-mini", "gpt-4.1-mini", "gpt-4o-mini"],
    "gpt-5.4-nano": ["gpt-5-nano", "gpt-5-mini", "gpt-4.1-mini", "gpt-4o-mini"],
    "gpt-5.4": ["gpt-5", "gpt-4.1", "gpt-4o"],
    "gpt-5-mini": ["gpt-5-nano", "gpt-5.4-mini", "gpt-4.1-mini", "gpt-4o-mini"],
    "gpt-5-nano": ["gpt-5.4-nano", "gpt-5-mini", "gpt-4.1-mini", "gpt-4o-mini"],
    "gpt-5": ["gpt-5.4", "gpt-4.1", "gpt-4o"],
    "gpt-4.1-mini": ["gpt-4o-mini"],
    "gpt-4.1": ["gpt-4o"]
  };

  for (const alias of aliases[model] ?? []) {
    addCandidate(alias);
  }

  const genericFallbacks =
    /nano|mini/i.test(model)
      ? ["gpt-5-mini", "gpt-4.1-mini", "gpt-4o-mini"]
      : ["gpt-5", "gpt-4.1", "gpt-4o"];

  for (const fallback of genericFallbacks) {
    addCandidate(fallback);
  }

  return candidates;
}

function isRecoverableModelError(error) {
  if (!(error instanceof OpenAIRequestError)) {
    return false;
  }

  const haystack = `${error.message}\n${error.responseText}`.toLowerCase();

  if (error.status === 429) {
    return [
      "insufficient_quota",
      "quota",
      "current quota",
      "billing",
      "rate limit",
      "tier"
    ].some((needle) => haystack.includes(needle));
  }

  if (![400, 403, 404].includes(error.status)) {
    return false;
  }

  return [
    "model",
    "unsupported",
    "not found",
    "does not exist",
    "not have access",
    "access to",
    "permission",
    "reasoning",
    "json_schema",
    "text.format"
  ].some((needle) => haystack.includes(needle));
}

async function requestWithModelFallback({
  apiKey,
  selectedModel,
  buildBody,
  track,
  sessionId,
  locale
}) {
  const candidates = buildModelFallbackCandidates(selectedModel);
  let lastError = null;

  for (let index = 0; index < candidates.length; index += 1) {
    const model = candidates[index];

    try {
      const payload = await requestOpenAI({
        apiKey,
        body: buildBody(model)
      });

      if (index > 0) {
        track({
          type: "model_fallback_recovered",
          sessionId,
          locale,
          provider: "openai",
          fromModel: selectedModel,
          toModel: model
        });
      }

      return {
        payload,
        model
      };
    } catch (error) {
      lastError = error;
      if (!isRecoverableModelError(error) || index === candidates.length - 1) {
        throw error;
      }

      track({
        type: "model_fallback_retry",
        sessionId,
        locale,
        provider: "openai",
        fromModel: model,
        reason: error instanceof Error ? error.message : "Unknown OpenAI failure"
      });
    }
  }

  throw lastError ?? new Error("OpenAI request failed before any model fallback could run.");
}

export function createSupportAgent({ track = () => {} } = {}) {
  const config = {
    defaultModel: process.env.OPENAI_MODEL || "gpt-5-mini",
    cheapModel: process.env.OPENAI_CHEAP_MODEL || "gpt-5-nano",
    complexModel: process.env.OPENAI_COMPLEX_MODEL || "gpt-5.4"
  };

  function resolveApiKey(requestApiKey) {
    return sanitizeApiKey(
      requestApiKey ||
      process.env.OPENAI_API_KEY ||
      process.env.NETLIFY_OPENAI_API_KEY ||
      process.env.X_OPENAI_KEY ||
      null
    );
  }

  async function respond({
    sessionId,
    locale,
    message,
    history,
    customer,
    knownOrders,
    sharingBoundary,
    cacheStore,
    idempotencyStore,
    openaiApiKey,
    commerceProvider
  }) {
    const apiKey = resolveApiKey(openaiApiKey);
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

    if (!apiKey) {
      return {
        reply:
          locale === "ar"
            ? "خدمة الدعم الذكية غير مفعلة حالياً لأن مفتاح OpenAI API غير مضاف على الخادم."
            : "The AI support agent is not configured right now because the OpenAI API key is missing on the server.",
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
      locale,
      customer,
      knownOrders,
      history
    });
    const toolTrace = [];
    const text = buildSupportResponseFormat();
    const reasoning = {
      effort: selectedModel === config.complexModel ? "medium" : "low"
    };
    let model = selectedModel;
    const buildInitialBody = (model) => {
      const reasoningPayload = buildReasoningPayload(model, reasoning);

      return {
        model,
        instructions,
        input: buildExternalModelInput(history, message, sharingBoundary),
        tools: toolbox.tools,
        ...(reasoningPayload ? { reasoning: reasoningPayload } : {}),
        text,
        truncation: "auto",
        parallel_tool_calls: false,
        store: true
      };
    };

    try {
      const initialResponse = await requestWithModelFallback({
        apiKey,
        selectedModel,
        buildBody: buildInitialBody,
        track,
        sessionId,
        locale
      });
      model = initialResponse.model;
      let payload = initialResponse.payload;

      for (let step = 0; step < 6; step += 1) {
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
            throw new Error("OpenAI returned no text response.");
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

        for (const call of functionCalls) {
          const args = safeJsonParse(call.arguments);
          const resolvedArgs = detokenizeValue(args, sharingBoundary);
          const output = await toolbox.execute(call.name, resolvedArgs);
          const protectedArgs = sanitizeToolArgsForExternalSharing(
            tokenizeValue(resolvedArgs, sharingBoundary),
            sharingBoundary
          );
          const protectedOutput = sanitizeToolOutputForExternalSharing(
            tokenizeValue(output, sharingBoundary),
            sharingBoundary
          );
          toolTrace.push({
            tool: call.name,
            args: protectedArgs,
            output: protectedOutput
          });
          toolOutputs.push({
            type: "function_call_output",
            call_id: call.call_id,
            output: JSON.stringify(protectedOutput)
          });
        }

        const reasoningPayload = buildReasoningPayload(model, reasoning);
        payload = await requestOpenAI({
          apiKey,
          body: {
            model,
            instructions,
            previous_response_id: payload.id,
            input: toolOutputs,
            tools: toolbox.tools,
            ...(reasoningPayload ? { reasoning: reasoningPayload } : {}),
            text,
            truncation: "auto",
            parallel_tool_calls: false,
            store: true
          }
        });
      }

      throw new Error("OpenAI tool loop exceeded the safety limit.");
    } catch (error) {
      const failure = classifyOpenAIFailure(error, locale);

      track({
        type: "agent_fallback",
        sessionId,
        locale,
        provider: "openai",
        reason: error instanceof Error ? error.message : "Unknown OpenAI failure"
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
        provider: "openai-responses",
        model: config.defaultModel,
        cheapModel: config.cheapModel,
        complexModel: config.complexModel
      };
    }
  };
}
