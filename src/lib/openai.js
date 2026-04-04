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
    throw new Error(`OpenAI request failed with ${response.status}: ${text.slice(0, 400)}`);
  }

  return response.json();
}

export function createSupportAgent({ track = () => {} } = {}) {
  const config = {
    defaultModel: process.env.OPENAI_MODEL || "gpt-5.4-mini",
    cheapModel: process.env.OPENAI_CHEAP_MODEL || "gpt-5-nano",
    complexModel: process.env.OPENAI_COMPLEX_MODEL || "gpt-5.4"
  };

  function resolveApiKey(requestApiKey) {
    return (
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

    const model = selectSupportModel({
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

    try {
      let payload = await requestOpenAI({
        apiKey,
        body: {
          model,
          instructions,
          input: buildExternalModelInput(history, message, sharingBoundary),
          tools: toolbox.tools,
          reasoning: { effort: model === config.complexModel ? "medium" : "low" },
          text,
          truncation: "auto",
          parallel_tool_calls: false,
          store: false
        }
      });

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

        payload = await requestOpenAI({
          apiKey,
          body: {
            model,
            instructions,
            previous_response_id: payload.id,
            input: toolOutputs,
            tools: toolbox.tools,
            reasoning: { effort: model === config.complexModel ? "medium" : "low" },
            text,
            truncation: "auto",
            parallel_tool_calls: false,
            store: false
          }
        });
      }

      throw new Error("OpenAI tool loop exceeded the safety limit.");
    } catch (error) {
      track({
        type: "agent_fallback",
        sessionId,
        locale,
        provider: "openai",
        reason: error instanceof Error ? error.message : "Unknown OpenAI failure"
      });

      return {
        reply:
          locale === "ar"
            ? "أواجه مشكلة مؤقتة في خدمة الذكاء الاصطناعي الآن. حاول مرة أخرى بعد قليل أو اطلب تحويل الحالة إلى موظف دعم."
            : "I’m having a temporary problem reaching the AI support service right now. Please try again shortly or ask me to escalate this to a human agent.",
        intent: inferIntentFromTools(toolTrace),
        confidence: 0.15,
        model,
        degraded: true,
        structured: {
          intent: inferIntentFromTools(toolTrace),
          resolution: "temporary_failure",
          handoffRecommended: true,
          customerAction:
            locale === "ar"
              ? "أعد المحاولة بعد قليل أو اطلب التحويل إلى موظف دعم."
              : "Try again shortly or ask for a human agent."
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
