import { createHash } from "node:crypto";

const MAX_BOUNDARY_TOKENS = 96;
const TOKEN_TYPES = ["email", "order", "phone", "payment", "ticket", "secret"];

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const ORDER_PATTERN = /\b[A-Z]{1,4}-\d+\b/gi;
const PHONE_PATTERN = /(?:\+?\d[\d\s-]{7,}\d)/g;
const PAYMENT_PATTERN = /\b(?:\d[ -]*?){13,19}\b/g;
const TICKET_PATTERN = /\bhandoff-[a-z0-9-]+\b/gi;
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._-]{16,}\b/gi;
const TOKEN_PATTERN = /\[\[(?:email|order|phone|payment|ticket|secret)_\d+\]\]/gi;

function buildToken(type, id) {
  return `[[${type}_${id}]]`;
}

function buildRawKey(type, rawValue) {
  return `${type}:${rawValue}`;
}

function replaceWithTokens(text, boundary, pattern, type) {
  return String(text).replace(pattern, (match) => registerBoundaryToken(boundary, type, match));
}

export function createDataProtectionBoundary(existingBoundary) {
  if (
    existingBoundary &&
    existingBoundary.tokenToRaw instanceof Map &&
    existingBoundary.rawToToken instanceof Map &&
    Array.isArray(existingBoundary.tokenOrder)
  ) {
    return existingBoundary;
  }

  return {
    nextId: 1,
    tokenToRaw: new Map(),
    rawToToken: new Map(),
    tokenOrder: []
  };
}

export function registerBoundaryToken(boundaryInput, type, rawValue) {
  const boundary = createDataProtectionBoundary(boundaryInput);
  const normalizedType = TOKEN_TYPES.includes(type) ? type : "ticket";
  const raw = String(rawValue ?? "").trim();

  if (!raw) {
    return raw;
  }

  const rawKey = buildRawKey(normalizedType, raw);
  const existingToken = boundary.rawToToken.get(rawKey);
  if (existingToken) {
    return existingToken;
  }

  const token = buildToken(normalizedType, boundary.nextId++);
  boundary.rawToToken.set(rawKey, token);
  boundary.tokenToRaw.set(token, raw);
  boundary.tokenOrder.push(token);

  while (boundary.tokenOrder.length > MAX_BOUNDARY_TOKENS) {
    const oldestToken = boundary.tokenOrder.shift();
    if (!oldestToken) {
      break;
    }

    const rawForToken = boundary.tokenToRaw.get(oldestToken);
    boundary.tokenToRaw.delete(oldestToken);
    if (rawForToken != null) {
      boundary.rawToToken.delete(buildRawKey(normalizedType, rawForToken));
      for (const tokenType of TOKEN_TYPES) {
        boundary.rawToToken.delete(buildRawKey(tokenType, rawForToken));
      }
    }
  }

  return token;
}

export function tokenizeText(text = "", boundaryInput) {
  const boundary = createDataProtectionBoundary(boundaryInput);
  let value = String(text ?? "");

  value = replaceWithTokens(value, boundary, EMAIL_PATTERN, "email");
  value = replaceWithTokens(value, boundary, ORDER_PATTERN, "order");
  value = replaceWithTokens(value, boundary, PHONE_PATTERN, "phone");
  value = replaceWithTokens(value, boundary, PAYMENT_PATTERN, "payment");
  value = replaceWithTokens(value, boundary, TICKET_PATTERN, "ticket");
  value = replaceWithTokens(value, boundary, JWT_PATTERN, "secret");
  value = replaceWithTokens(value, boundary, BEARER_PATTERN, "secret");

  return value;
}

export function detokenizeText(text = "", boundaryInput) {
  const boundary = createDataProtectionBoundary(boundaryInput);
  return String(text ?? "").replace(TOKEN_PATTERN, (token) => boundary.tokenToRaw.get(token) ?? token);
}

export function tokenizeValue(value, boundaryInput) {
  if (typeof value === "string") {
    return tokenizeText(value, boundaryInput);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => tokenizeValue(entry, boundaryInput));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, tokenizeValue(entry, boundaryInput)])
    );
  }

  return value;
}

export function detokenizeValue(value, boundaryInput) {
  if (typeof value === "string") {
    return detokenizeText(value, boundaryInput);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => detokenizeValue(entry, boundaryInput));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, detokenizeValue(entry, boundaryInput)])
    );
  }

  return value;
}

export function buildProtectedModelInput(history = [], message = "", boundaryInput) {
  const turns = history
    .slice(-8)
    .map((entry) => ({
      role: entry.role,
      content: tokenizeText(entry.content, boundaryInput)
    }));

  turns.push({
    role: "user",
    content: tokenizeText(message, boundaryInput)
  });

  return turns;
}

export function redactSensitiveText(text = "") {
  return String(text ?? "")
    .replace(EMAIL_PATTERN, "[email]")
    .replace(ORDER_PATTERN, "[order]")
    .replace(PHONE_PATTERN, "[phone]")
    .replace(PAYMENT_PATTERN, "[payment]")
    .replace(TICKET_PATTERN, "[ticket]")
    .replace(JWT_PATTERN, "[secret]")
    .replace(BEARER_PATTERN, "[secret]");
}

export function createSafeReference(prefix, value) {
  const hash = createHash("sha256").update(String(value ?? "")).digest("hex").slice(0, 12);
  return `${prefix}_${hash}`;
}

export function sanitizeAnalyticsEvent(event = {}) {
  const safeEvent = { ...event };

  if (safeEvent.sessionId) {
    safeEvent.sessionRef = createSafeReference("session", safeEvent.sessionId);
    delete safeEvent.sessionId;
  }

  for (const key of ["reason", "error", "message"]) {
    if (typeof safeEvent[key] === "string") {
      safeEvent[key] = redactSensitiveText(safeEvent[key]);
    }
  }

  return safeEvent;
}
