const ORDER_STATUS_MAP = {
  en: {
    "Out for delivery": "Out for delivery",
    Delivered: "Delivered",
    Shipped: "Shipped",
    Processing: "Processing",
    Paid: "Paid",
    "Cash on delivery": "Cash on delivery",
    "Pending assignment": "Pending assignment"
  },
  ar: {
    "Out for delivery": "خرج للتسليم",
    Delivered: "تم التسليم",
    Shipped: "تم الشحن",
    Processing: "قيد المعالجة",
    Paid: "مدفوع",
    "Cash on delivery": "الدفع عند الاستلام",
    "Pending assignment": "بانتظار شركة الشحن"
  }
};

export function localizeOrderStatus(locale = "en", value = "") {
  return ORDER_STATUS_MAP[locale]?.[value] ?? value;
}

export function localizeOrderPaymentStatus(locale = "en", value = "") {
  return ORDER_STATUS_MAP[locale]?.[value] ?? value;
}

export function localizeOrderCourier(locale = "en", value = "") {
  if (locale !== "ar") {
    return value;
  }

  return value === "Pending assignment" ? "بانتظار شركة الشحن" : value;
}

export function localizeOrderEta(locale = "en", value = "") {
  const eta = String(value ?? "");
  if (locale !== "ar") {
    return eta;
  }

  if (eta === "Today before 8:00 PM") {
    return "اليوم قبل الساعة 8:00 مساءً";
  }

  if (eta.startsWith("Delivered on ")) {
    return `تم التسليم في ${eta.replace("Delivered on ", "")}`;
  }

  if (eta === "Expected in 2 days") {
    return "متوقع خلال يومين";
  }

  if (eta === "Expected to ship tomorrow") {
    return "متوقع شحنه غداً";
  }

  return eta;
}

export function localizeOrderSnapshot(order, locale = "en") {
  if (!order || typeof order !== "object") {
    return order;
  }

  return {
    ...order,
    status: localizeOrderStatus(locale, order.status),
    paymentStatus: localizeOrderPaymentStatus(locale, order.paymentStatus),
    courier: localizeOrderCourier(locale, order.courier),
    eta: localizeOrderEta(locale, order.eta)
  };
}
