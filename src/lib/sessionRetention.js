const DEFAULT_MAX_ENTRIES = 64;
const DEFAULT_MAX_VALUE_BYTES = 24 * 1024;

function isManagedStore(value) {
  return value?.entries instanceof Map;
}

function measureRetentionValueBytes(value) {
  try {
    return Buffer.byteLength(JSON.stringify(value));
  } catch {
    return Buffer.byteLength(String(value ?? ""));
  }
}

export function createSessionRetentionStore(
  existingStore,
  {
    maxEntries = DEFAULT_MAX_ENTRIES,
    maxValueBytes = DEFAULT_MAX_VALUE_BYTES
  } = {}
) {
  if (isManagedStore(existingStore)) {
    existingStore.maxEntries = Math.min(existingStore.maxEntries ?? maxEntries, maxEntries);
    existingStore.maxValueBytes = Math.min(existingStore.maxValueBytes ?? maxValueBytes, maxValueBytes);
    return existingStore;
  }

  const entries = existingStore instanceof Map ? existingStore : new Map();
  return {
    entries,
    maxEntries,
    maxValueBytes
  };
}

export function clearSessionRetentionStore(storeInput) {
  const store = createSessionRetentionStore(storeInput);
  store.entries.clear();
  return store;
}

export function readSessionRetentionValue(storeInput, key, now = Date.now()) {
  const store = createSessionRetentionStore(storeInput);
  pruneSessionRetentionStore(store, now);
  const entry = store.entries.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt != null && entry.expiresAt <= now) {
    store.entries.delete(key);
    return null;
  }

  store.entries.delete(key);
  store.entries.set(key, {
    ...entry,
    lastTouchedAt: now
  });

  return entry.value;
}

export function writeSessionRetentionValue(storeInput, key, value, { ttlMs = null, now = Date.now() } = {}) {
  const store = createSessionRetentionStore(storeInput);
  pruneSessionRetentionStore(store, now);

  if (measureRetentionValueBytes(value) > store.maxValueBytes) {
    return value;
  }

  store.entries.delete(key);
  store.entries.set(key, {
    value,
    createdAt: now,
    lastTouchedAt: now,
    expiresAt: typeof ttlMs === "number" ? now + ttlMs : null
  });
  pruneSessionRetentionStore(store, now);
  return value;
}

function pruneSessionRetentionStore(store, now) {
  for (const [key, entry] of store.entries.entries()) {
    if (entry.expiresAt != null && entry.expiresAt <= now) {
      store.entries.delete(key);
    }
  }

  while (store.entries.size > store.maxEntries) {
    const oldestKey = store.entries.keys().next().value;
    if (!oldestKey) {
      break;
    }
    store.entries.delete(oldestKey);
  }
}
