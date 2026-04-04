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
const DEFAULT_OPENROUTER_MODEL = "openrouter/free";
const MAX_TOOL_STEPS = 6;

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
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: buildOpenRouterHeaders(apiKey),
    body: JSON.stringify(body)
  });

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

function buildAgentRequestBody({
  model,
  instructions,
  input,
  tools,
  useStructuredOutput
}) {
  return {
    model,
    instructions,
    input,
    tools,
    ...(useStructuredOutput ? { text: buildSupportResponseFormat() } : {}),
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

async function requestAgentTurn({
  apiKey,
  model,
  instructions,
  input,
  tools,
  track,
  sessionId,
  locale
}) {
  const preferredBody = buildAgentRequestBody({
    model,
    instructions,
    input,
    tools,
    useStructuredOutput: true
  });

  try {
    return await requestOpenRouter({
      apiKey,
      body: preferredBody
    });
  } catch (error) {
    if (!shouldRetryWithoutStructuredOutput(error)) {
      throw error;
    }

    track({
      type: "structured_output_retry",
      sessionId,
      locale,
      provider: "openrouter",
      reason: error.message
    });

    return requestOpenRouter({
      apiKey,
      body: buildAgentRequestBody({
        model,
        instructions,
        input,
        tools,
        useStructuredOutput: false
      })
    });
  }
}

function classifyProviderFailure(error, locale = "en") {
  const haystack = error instanceof OpenRouterRequestError
    ? `${error.message}\n${error.responseText}`.toLowerCase()
    : String(error?.message ?? "").toLowerCase();

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
          reply: "خدمة الدعم الذكية المجانية مزدحمة أو محدودة حالياً على OpenRouter. حاول مرة أخرى بعد قليل.",
          customerAction: "أعد المحاولة بعد قليل."
        }
      : {
          reply: "The free AI support service on OpenRouter is busy or rate limited right now. Please try again shortly.",
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
          reply: "خدمة الدعم الذكية غير مهيأة بشكل صحيح الآن لأن نموذج OpenRouter المجاني المختار غير متاح.",
          customerAction: "تحقق من إعداد النموذج المجاني على OpenRouter ثم أعد المحاولة."
        }
      : {
          reply: "The AI support service is misconfigured right now because the selected OpenRouter free model is unavailable.",
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

export function createSupportAgent({ track = () => {} } = {}) {
  const configuredModel =
    process.env.OPENROUTER_MODEL ||
    process.env.NETLIFY_OPENROUTER_MODEL ||
    DEFAULT_OPENROUTER_MODEL;
  const config = {
    defaultModel: configuredModel,
    cheapModel: configuredModel,
    complexModel: configuredModel
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

    const selectedModel = selectSupportModel({
      message,
      history,
      customer,
      knownOrders,
      config
    });
    const instructions = buildSupportInstructions({
      locale,
      storefrontLocale,
      customer,
      knownOrders,
      history
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
        freeOnly: true
      };
    }
  };
}
