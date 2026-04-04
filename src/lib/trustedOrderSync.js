function normalizeOrderNumber(value = "") {
  return String(value ?? "").trim().toUpperCase();
}

export function mergeTrustedKnownOrders(sessionOrders = [], requestOrders = [], maxOrders = 20) {
  const merged = [];
  const seen = new Set();

  for (const order of [...(Array.isArray(requestOrders) ? requestOrders : []), ...(Array.isArray(sessionOrders) ? sessionOrders : [])]) {
    if (!order || typeof order !== "object") {
      continue;
    }

    const orderNumber = normalizeOrderNumber(order.orderNumber);
    if (!orderNumber || seen.has(orderNumber)) {
      continue;
    }

    seen.add(orderNumber);
    merged.push({
      ...order,
      orderNumber
    });

    if (merged.length >= maxOrders) {
      break;
    }
  }

  return merged;
}
