
// The intent-detection file that looks at the user’s message and decides what they are asking for,
// like product info, order tracking, returns, or human support.


const intentPatterns = {
  greeting: [
    "hello",
    "hi",
    "hey",
    "good morning",
    "good evening",
    "salam",
    "مرحبا",
    "اهلا",
    "أهلا",
    "السلام",
    "هلا",
    "يا هلا"
  ],
  general_help: [
    "help",
    "can you help",
    "i need help",
    "support me",
    "what can you do",
    "how can you help",
    "how can you help me",
    "how do you help",
    "how you help",
    "how you can help me",
    "what can i ask",
    "how to use this",
    "how does this work",
    "what do i do here",
    "ساعدني",
    "مساعدة",
    "ابغى مساعدة",
    "أبغى مساعدة",
    "كيف تساعدني",
    "كيف تقدر تساعدني",
    "كيف أستخدم",
    "كيف استخدم",
    "كيف يعمل",
    "وش تقدر تسوي",
    "ماذا يمكنك",
    "بماذا تساعدني",
    "وش أسأل"
  ],
  catalog_browse: [
    "list products",
    "show me products",
    "show products",
    "all products",
    "browse products",
    "product list",
    "catalog",
    "what do you sell",
    "what products do you have",
    "give me list of products",
    "list categories",
    "browse catalog",
    "منتجات",
    "اعرض المنتجات",
    "كل المنتجات",
    "قائمة المنتجات",
    "وش عندكم",
    "ماذا تبيعون",
    "الأقسام",
    "الفئات",
    "الكتالوج"
  ],
  product_information: [
    "product",
    "details",
    "tell me about",
    "tell me details about",
    "show me",
    "price",
    "stock",
    "available",
    "case",
    "mouse",
    "keyboard",
    "speaker",
    "stand",
    "holder",
    "headset",
    "hub",
    "ssd",
    "charger",
    "camera",
    "toothbrush",
    "tablet",
    "power bank",
    "smartwatch",
    "earbuds",
    "audio",
    "wearables",
    "electronics",
    "wireless",
    "الكترون",
    "منتج",
    "تفاصيل",
    "سعر",
    "متوفر",
    "ماوس",
    "لوحة مفاتيح",
    "مكبر صوت",
    "حامل",
    "سماعة",
    "محول",
    "قرص",
    "باور بانك",
    "كاميرا",
    "فرشاة",
    "ساعة",
    "سماعات",
    "شاحن"
  ],
  recommendations: [
    "recommend",
    "suggest",
    "best",
    "which one",
    "what should i buy",
    "compare",
    "help me choose",
    "gift",
    "رشح",
    "اقترح",
    "أفضل",
    "اختار",
    "أختار",
    "أنسب",
    "مقارنة"
  ],
  order_tracking: [
    "where is my order",
    "track",
    "delivery status",
    "shipment",
    "tracking",
    "eta",
    "ks-",
    "طلبي",
    "تتبع",
    "شحنة",
    "موعد الطلب"
  ],
  returns_refunds: [
    "return",
    "refund",
    "exchange",
    "damaged",
    "wrong item",
    "استرجاع",
    "استرداد",
    "ارجاع",
    "استبدال",
    "تالف"
  ],
  order_change_cancel: [
    "cancel",
    "change order",
    "update order",
    "change address",
    "modify order",
    "إلغاء",
    "الغاء",
    "تعديل الطلب",
    "تغيير العنوان",
    "تعديل العنوان"
  ],
  shipping_delivery: [
    "shipping",
    "delivery fee",
    "delivery cost",
    "how long",
    "same day",
    "arrive",
    "ship to",
    "riyadh",
    "jeddah",
    "dammam",
    "توصيل",
    "شحن",
    "رسوم الشحن",
    "كم يوم",
    "يوصل",
    "الرياض",
    "جدة",
    "الدمام"
  ],
  payments: [
    "payment",
    "pay",
    "mada",
    "apple pay",
    "cash on delivery",
    "cod",
    "card",
    "visa",
    "mastercard",
    "دفع",
    "مدى",
    "ابل باي",
    "بطاقة",
    "الدفع عند الاستلام"
  ],
  human_handoff: [
    "human",
    "agent",
    "support",
    "complaint",
    "someone",
    "supervisor",
    "موظف",
    "خدمة العملاء",
    "مندوب",
    "شكوى",
    "مسؤول"
  ],
  policy_info: [
    "policy",
    "warranty",
    "guarantee",
    "terms",
    "privacy",
    "data",
    "sell my data",
    "share data",
    "cookies",
    "cookie",
    "gdpr",
    "ccpa",
    "law",
    "legal",
    "rights",
    "working hours",
    "contact",
    "email",
    "whatsapp",
    "سياسة",
    "الخصوصية",
    "الضمان",
    "بيانات",
    "البيانات",
    "بيع",
    "تبيع",
    "تبيعون",
    "مشاركة",
    "كوكيز",
    "القانون",
    "الحقوق",
    "تواصل",
    "البريد",
    "واتساب",
    "الشروط"
  ]
};

function normalizeMessage(message = "") {
  return message
    .toLowerCase()
    .trim()
    .replace(/[!?.,،؛:]+/g, " ")
    .replace(/(.)\1{2,}/g, "$1$1")
    .replace(/\s+/g, " ");
}

function looksLikeGreeting(normalized) {
  return /^(h+i+|he+y+|he+l+o+|he+llo+|hello there|hey there|hi there|good morning|good evening|sala+m+|marh?aba+|مرحبا+|اهلا+|أهلا+|السلام عليكم|هلا+|يا هلا+)(\s+\w+){0,2}$/i.test(
    normalized
  );
}

function looksLikeCatalogBrowse(normalized) {
  return /\b(list|show|browse|see|view|have|sell)\b.*\b(products?|catalog|items|categories)\b|\b(products?|catalog|categories)\b.*\b(list|show|browse|see|view)\b|^(products?|catalog|categories)$|^وش عندكم$|^اعرض المنتجات$|^كل المنتجات$|^قائمة المنتجات$|^الأقسام$|^الفئات$|^الكتالوج$/i.test(
    normalized
  );
}

function looksLikeOrderChangeCancel(normalized) {
  return /\b(cancel|change|update|modify)\b.*\b(order|address|delivery address)\b|\b(change|update)\b.*\bmy\b.*\baddress\b|^(change|update)\s+address\b|إلغاء|الغاء|تعديل الطلب|تغيير العنوان|تعديل العنوان/i.test(
    normalized
  );
}

export function classifyIntent(message = "") {
  const normalized = normalizeMessage(message);

  if (looksLikeGreeting(normalized)) {
    return {
      name: "greeting",
      confidence: 0.95
    };
  }

  if (looksLikeCatalogBrowse(normalized)) {
    return {
      name: "catalog_browse",
      confidence: 0.9
    };
  }

  if (
    looksLikeOrderChangeCancel(normalized) ||
    intentPatterns.order_change_cancel.some((pattern) => normalized.includes(pattern))
  ) {
    return {
      name: "order_change_cancel",
      confidence: 0.82
    };
  }

  let winner = {
    name: "fallback",
    score: 0
  };

  for (const [name, patterns] of Object.entries(intentPatterns)) {
    const score = patterns.reduce((sum, pattern) => {
      return sum + (normalized.includes(pattern) ? 1 : 0);
    }, 0);

    if (score > winner.score) {
      winner = { name, score };
    }
  }

  if (winner.score === 0) {
    return {
      name: "fallback",
      confidence: 0.2
    };
  }

  return {
    name: winner.name,
    confidence: Math.min(0.35 + winner.score * 0.12, 0.95)
  };
}

export function extractOrderNumber(message = "") {
  const match = message.toUpperCase().match(/KS-\d{4,6}/);
  return match?.[0] ?? null;
}
