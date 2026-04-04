import { tokenizeText } from "./dataProtection.js";

const MAX_EXTERNAL_DEPTH = 5;
const MAX_EXTERNAL_ARRAY_ITEMS = 12;
const MAX_EXTERNAL_OBJECT_KEYS = 24;
const MAX_EXTERNAL_STRING_CHARS = 700;
const REDACTED_MARKER = "[redacted]";
const TRUNCATED_MARKER = " [truncated]";

const BLOCKED_KEY_PATTERN =
  /(?:password|secret|token|authorization|cookie|session|api[_-]?key|access[_-]?token|refresh[_-]?token|credential|signature|private[_-]?key|cvv|cvc)/i;

const URL_CREDENTIAL_PATTERN = /\bhttps?:\/\/[^/\s:@]+:[^/\s:@]+@/gi;
const ORDER_SUMMARY_SHAPE = {
  orderNumber: true,
  status: true,
  eta: true,
  paymentStatus: true,
  courier: true,
  deliveryDate: true,
  totalSar: true,
  items: [true]
};

const SEARCH_CATALOG_RESULT_SHAPE = {
  id: true,
  name: true,
  category: true,
  shortDescription: true,
  priceSar: true,
  currency: true,
  stockStatus: true,
  rating: true,
  size: true,
  colors: [true],
  highlights: [true]
};

const TOOL_ARG_SHARING_POLICY = {
  get_customer_profile: {},
  search_catalog: {
    query: true,
    mode: true,
    excludeProductIds: [true]
  },
  get_policy_information: {
    topic: true,
    question: true
  },
  list_customer_orders: {},
  get_order_details: {
    orderNumber: true
  },
  get_return_options: {
    orderNumber: true
  },
  get_cancellation_options: {
    orderNumber: true
  },
  create_handoff: {
    summary: true,
    intent: true
  }
};

const TOOL_OUTPUT_SHARING_POLICY = {
  get_customer_profile: {
    ok: true,
    code: true,
    message: true,
    profile: {
      name: true,
      emailMasked: true,
      phoneMasked: true,
      customerReference: true,
      hasVerifiedEmail: true,
      hasVerifiedIdentity: true,
      newsletter: true,
      visibleOrderCount: true
    },
    latestOrder: ORDER_SUMMARY_SHAPE
  },
  search_catalog: {
    ok: true,
    code: true,
    message: true,
    cache: true,
    mode: true,
    summary: true,
    rationale: true,
    match: SEARCH_CATALOG_RESULT_SHAPE,
    matches: [SEARCH_CATALOG_RESULT_SHAPE]
  },
  get_policy_information: {
    ok: true,
    code: true,
    message: true,
    cache: true,
    answer: true
  },
  list_customer_orders: {
    ok: true,
    code: true,
    message: true,
    cache: true,
    orders: [ORDER_SUMMARY_SHAPE]
  },
  get_order_details: {
    ok: true,
    code: true,
    message: true,
    cache: true,
    order: ORDER_SUMMARY_SHAPE
  },
  get_return_options: {
    ok: true,
    code: true,
    message: true,
    order: ORDER_SUMMARY_SHAPE,
    eligibility: {
      eligible: true,
      reason: true,
      windowDays: true
    }
  },
  get_cancellation_options: {
    ok: true,
    code: true,
    message: true,
    order: ORDER_SUMMARY_SHAPE,
    cancellation: {
      eligible: true,
      reason: true,
      cutoff: true
    }
  },
  create_handoff: {
    ok: true,
    code: true,
    message: true,
    reused: true,
    ticket: {
      id: true,
      status: true,
      channel: true,
      eta: true,
      priority: true
    }
  }
};

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function pickSharedShape(value, shape) {
  if (shape === true) {
    return value;
  }

  if (shape == null || value == null) {
    return undefined;
  }

  if (Array.isArray(shape)) {
    if (!Array.isArray(value)) {
      return undefined;
    }

    const itemShape = shape[0] ?? true;
    return value
      .map((entry) => pickSharedShape(entry, itemShape))
      .filter((entry) => typeof entry !== "undefined");
  }

  if (!isPlainObject(shape) || !isPlainObject(value)) {
    return undefined;
  }

  const output = {};
  for (const [key, nestedShape] of Object.entries(shape)) {
    const nextValue = pickSharedShape(value[key], nestedShape);
    if (typeof nextValue !== "undefined") {
      output[key] = nextValue;
    }
  }

  return output;
}

function sanitizeExternalString(value, boundary) {
  const tokenized = tokenizeText(String(value ?? "").replace(URL_CREDENTIAL_PATTERN, "https://[redacted]@"), boundary);
  if (tokenized.length <= MAX_EXTERNAL_STRING_CHARS) {
    return tokenized;
  }

  return `${tokenized.slice(0, MAX_EXTERNAL_STRING_CHARS)}${TRUNCATED_MARKER}`;
}

function sanitizeExternalArray(value, boundary, depth) {
  return value.slice(0, MAX_EXTERNAL_ARRAY_ITEMS).map((entry) => sanitizeExternalValue(entry, boundary, depth + 1));
}

function sanitizeExternalObject(value, boundary, depth) {
  const output = {};
  const safeEntries = Object.entries(value)
    .filter(([key]) => !["__proto__", "constructor", "prototype"].includes(key))
    .slice(0, MAX_EXTERNAL_OBJECT_KEYS);

  for (const [key, entry] of safeEntries) {
    if (BLOCKED_KEY_PATTERN.test(key)) {
      output[key] = REDACTED_MARKER;
      continue;
    }

    output[key] = sanitizeExternalValue(entry, boundary, depth + 1);
  }

  return output;
}

export function sanitizeExternalValue(value, boundary, depth = 0) {
  if (value == null || typeof value === "boolean" || typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return sanitizeExternalString(value, boundary);
  }

  if (depth >= MAX_EXTERNAL_DEPTH) {
    return "[truncated_object]";
  }

  if (Array.isArray(value)) {
    return sanitizeExternalArray(value, boundary, depth);
  }

  if (isPlainObject(value)) {
    return sanitizeExternalObject(value, boundary, depth);
  }

  return sanitizeExternalString(String(value), boundary);
}

export function buildExternalModelInput(history = [], message = "", boundary) {
  const turns = history
    .slice(-8)
    .map((entry) => ({
      role: entry.role,
      content: sanitizeExternalString(entry.content, boundary)
    }));

  turns.push({
    role: "user",
    content: sanitizeExternalString(message, boundary)
  });

  return turns;
}

export function sanitizeToolArgsForExternalSharing(toolName, args = {}, boundary) {
  const policy = TOOL_ARG_SHARING_POLICY[toolName];
  const scopedArgs = policy ? pickSharedShape(args, policy) ?? {} : args;
  return sanitizeExternalValue(scopedArgs, boundary);
}

export function sanitizeToolOutputForExternalSharing(toolName, output = {}, boundary) {
  const policy = TOOL_OUTPUT_SHARING_POLICY[toolName];
  const scopedOutput = policy ? pickSharedShape(output, policy) ?? {} : output;
  return sanitizeExternalValue(scopedOutput, boundary);
}
