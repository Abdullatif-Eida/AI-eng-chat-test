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

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
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

export function sanitizeToolArgsForExternalSharing(args = {}, boundary) {
  return sanitizeExternalValue(args, boundary);
}

export function sanitizeToolOutputForExternalSharing(output = {}, boundary) {
  return sanitizeExternalValue(output, boundary);
}
