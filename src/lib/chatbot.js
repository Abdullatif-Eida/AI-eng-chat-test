import { detectLocale, format, t } from "./i18n.js";
import {
  createDataProtectionBoundary,
  sanitizeAnalyticsEvent,
  tokenizeText
} from "./dataProtection.js";
import { createSupportAgent } from "./openai.js";
import {
  clearSessionRetentionStore,
  createSessionRetentionStore
} from "./sessionRetention.js";

const SESSION_TTL_MS = 30 * 60 * 1000;
const MAX_HISTORY_ENTRIES = 16;
const MAX_ANALYTICS_EVENTS = 200;
const MAX_MESSAGE_CHARS = 4000;
const MAX_CACHE_ENTRIES = 48;
const MAX_IDEMPOTENCY_ENTRIES = 16;

function normalizeEmail(email = "") {
  return String(email ?? "").trim().toLowerCase();
}

function buildCustomerFingerprint(profile) {
  const email = normalizeEmail(profile?.email);
  return email ? `email:${email}` : "anonymous";
}

function createSessionState(now) {
  return {
    lastLocale: null,
    customer: null,
    customerFingerprint: "anonymous",
    history: [],
    sharingBoundary: createDataProtectionBoundary(),
    cacheStore: createSessionRetentionStore(null, { maxEntries: MAX_CACHE_ENTRIES }),
    idempotencyStore: createSessionRetentionStore(null, { maxEntries: MAX_IDEMPOTENCY_ENTRIES }),
    createdAt: now,
    lastSensitiveResetAt: now,
    lastSeenAt: now
  };
}

function sanitizeMessage(message = "") {
  return String(message ?? "").trim().slice(0, MAX_MESSAGE_CHARS);
}

function sanitizeCustomerProfile(profile) {
  if (!profile || typeof profile !== "object") {
    return null;
  }

  const name = profile.name ? String(profile.name).trim().slice(0, 120) : undefined;
  const email = profile.email ? String(profile.email).trim().toLowerCase().slice(0, 200) : undefined;
  const newsletter =
    typeof profile.newsletter === "boolean"
      ? profile.newsletter
      : undefined;

  if (!name && !email && typeof newsletter === "undefined") {
    return null;
  }

  return {
    ...(name ? { name } : {}),
    ...(email ? { email } : {}),
    ...(typeof newsletter === "boolean" ? { newsletter } : {})
  };
}

function resetSensitiveSessionState(session, currentTime) {
  session.history = [];
  session.sharingBoundary = createDataProtectionBoundary();
  clearSessionRetentionStore(session.cacheStore);
  clearSessionRetentionStore(session.idempotencyStore);
  session.lastSensitiveResetAt = currentTime;
}

function applyCustomerProfileToSession(session, safeCustomerProfile, currentTime) {
  if (!safeCustomerProfile) {
    return false;
  }

  const nextFingerprint = buildCustomerFingerprint(safeCustomerProfile);
  const identityChanged =
    session.customerFingerprint.startsWith("email:") &&
    nextFingerprint.startsWith("email:") &&
    session.customerFingerprint !== nextFingerprint;

  if (identityChanged) {
    resetSensitiveSessionState(session, currentTime);
    session.customer = { ...safeCustomerProfile };
    session.customerFingerprint = nextFingerprint;
    return true;
  }

  session.customer = {
    ...session.customer,
    ...safeCustomerProfile
  };
  session.customerFingerprint = buildCustomerFingerprint(session.customer);
  return false;
}

function resolveReplyLocale(message, preferredLocale, session) {
  const trimmed = String(message).trim();

  if (!trimmed) {
    return session?.lastLocale ?? preferredLocale ?? "en";
  }

  if (/[\u0600-\u06FF]/.test(trimmed)) {
    return "ar";
  }

  if (/[a-z]/i.test(trimmed)) {
    return "en";
  }

  return session?.lastLocale ?? preferredLocale ?? detectLocale(trimmed);
}

function buildFallbackReply(locale = "en") {
  return locale === "ar"
    ? "أقدر أساعدك في المنتجات، الطلبات، الإرجاع، الدفع، والسياسات. إذا كان لديك اسم منتج أو رقم طلب ابدأ به وسنكمل معاً."
    : "I can help with products, orders, returns, payments, and policies. If you already have a product name or order number, start with that and we’ll go from there.";
}

function classifyJourney(intent = "") {
  switch (intent) {
    case "catalog_browse":
    case "product_information":
    case "recommendations":
      return "pre_purchase";
    case "order_tracking":
    case "returns_refunds":
    case "order_change_cancel":
      return "post_purchase";
    case "customer_profile":
      return "account_support";
    case "policy_info":
      return "policy_trust";
    case "human_handoff":
      return "human_handoff";
    default:
      return "other";
  }
}

function isContainedTurn(result) {
  if (!result) {
    return false;
  }

  if (result.degraded || result.intent === "human_handoff" || result.intent === "configuration_error") {
    return false;
  }

  return !Boolean(result.structured?.handoffRecommended);
}

function buildAnalyticsSummary(events = []) {
  const summary = {
    totalTurns: 0,
    containedTurns: 0,
    handoffTurns: 0,
    prePurchaseTurns: 0,
    postPurchaseTurns: 0,
    accountSupportTurns: 0,
    policyTurns: 0,
    degradedTurns: 0
  };

  for (const event of events) {
    if (event.type !== "chat_turn") {
      continue;
    }

    summary.totalTurns += 1;
    if (event.contained) {
      summary.containedTurns += 1;
    }
    if (event.intent === "human_handoff" || event.handoffRecommended) {
      summary.handoffTurns += 1;
    }
    if (event.degraded) {
      summary.degradedTurns += 1;
    }

    switch (event.journey) {
      case "pre_purchase":
        summary.prePurchaseTurns += 1;
        break;
      case "post_purchase":
        summary.postPurchaseTurns += 1;
        break;
      case "account_support":
        summary.accountSupportTurns += 1;
        break;
      case "policy_trust":
        summary.policyTurns += 1;
        break;
      default:
        break;
    }
  }

  return summary;
}

export function createChatbot({ commerceProvider, now = () => Date.now(), sessionTtlMs = SESSION_TTL_MS } = {}) {
  const sessions = new Map();
  const analytics = [];
  const agent = createSupportAgent({
    track(event) {
      analytics.push({
        ...sanitizeAnalyticsEvent(event),
        timestamp: new Date().toISOString()
      });
      if (analytics.length > MAX_ANALYTICS_EVENTS) {
        analytics.splice(0, analytics.length - MAX_ANALYTICS_EVENTS);
      }
    }
  });

  function purgeExpiredSessions(currentTime) {
    for (const [sessionId, session] of sessions.entries()) {
      if (currentTime - session.lastSeenAt > sessionTtlMs) {
        sessions.delete(sessionId);
      }
    }
  }

  function getSession(sessionId) {
    const currentTime = now();
    purgeExpiredSessions(currentTime);

    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, createSessionState(currentTime));
    }

    const session = sessions.get(sessionId);
    session.lastSeenAt = currentTime;
    return session;
  }

  async function chat({
    sessionId,
    message,
    preferredLocale,
    customerProfile,
    knownOrders,
    openaiApiKey
  }) {
    const session = getSession(sessionId);
    const trimmedMessage = sanitizeMessage(message);
    const locale = resolveReplyLocale(trimmedMessage, preferredLocale, session);
    session.lastLocale = locale;

    const safeCustomerProfile = sanitizeCustomerProfile(customerProfile);
    if (safeCustomerProfile?.name || safeCustomerProfile?.email || typeof safeCustomerProfile?.newsletter === "boolean") {
      const identityChanged = applyCustomerProfileToSession(session, safeCustomerProfile, now());
      if (identityChanged) {
        analytics.push({
          type: "session_identity_reset",
          ...sanitizeAnalyticsEvent({ sessionId }),
          locale,
          timestamp: new Date().toISOString()
        });
        if (analytics.length > MAX_ANALYTICS_EVENTS) {
          analytics.splice(0, analytics.length - MAX_ANALYTICS_EVENTS);
        }
      }
    }

    if (!trimmedMessage) {
      return {
        locale,
        reply: buildFallbackReply(locale),
        intent: "fallback",
        confidence: 0.25
      };
    }

    const priorHistory = session.history.slice(-8);
    const result = await agent.respond({
      sessionId,
      locale,
      message: trimmedMessage,
      history: priorHistory,
      customer: session.customer,
      knownOrders,
      sharingBoundary: session.sharingBoundary,
      cacheStore: session.cacheStore,
      idempotencyStore: session.idempotencyStore,
      openaiApiKey,
      commerceProvider
    });

    session.history.push(
      {
        role: "user",
        content: tokenizeText(trimmedMessage, session.sharingBoundary)
      },
      {
        role: "assistant",
        content: tokenizeText(result.reply, session.sharingBoundary)
      }
    );
    session.history = session.history.slice(-MAX_HISTORY_ENTRIES);

    analytics.push({
      type: "chat_turn",
      ...sanitizeAnalyticsEvent({ sessionId }),
      locale,
      intent: result.intent,
      journey: classifyJourney(result.intent),
      model: result.model ?? agent.getStatus().model,
      provider: agent.getStatus().provider,
      confidence: result.confidence,
      contained: isContainedTurn(result),
      handoffRecommended: Boolean(result.structured?.handoffRecommended),
      degraded: Boolean(result.degraded),
      timestamp: new Date().toISOString()
    });
    if (analytics.length > MAX_ANALYTICS_EVENTS) {
      analytics.splice(0, analytics.length - MAX_ANALYTICS_EVENTS);
    }

    return {
      locale,
      reply: result.reply,
      intent: result.intent,
      confidence: result.confidence,
      structured: result.structured ?? null
    };
  }

  return {
    chat,
    getAnalytics() {
      return analytics.slice(-50);
    },
    getAnalyticsSummary() {
      return buildAnalyticsSummary(analytics);
    },
    getWelcomeMessage(locale = "en", name = null) {
      return name ? format(locale, "personalizedWelcome", { name }) : t(locale, "welcome");
    },
    getAIMode() {
      return agent.getStatus();
    }
  };
}
