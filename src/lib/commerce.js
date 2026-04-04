
// Shared commerce helpers used by the AI tool layer. These stay deterministic for
// data access and policy enforcement, but avoid acting like the chatbot brain.

import { createHash } from "node:crypto";
import { products } from "../data/products.js";
import { orders } from "../data/orders.js";
import { storePolicies } from "../data/policies.js";

const paymentMethods = {
  en: ["mada", "Visa", "Mastercard", "Apple Pay", "Cash on Delivery"],
  ar: ["مدى", "فيزا", "ماستركارد", "Apple Pay", "الدفع عند الاستلام"]
};

const stopTokens = new Set([
  "i",
  "can",
  "me",
  "my",
  "you",
  "your",
  "how",
  "what",
  "the",
  "a",
  "an",
  "and",
  "or",
  "for",
  "of",
  "to",
  "about",
  "details",
  "detail",
  "thing",
  "item",
  "product",
  "products",
  "need",
  "want",
  "give",
  "show",
  "tell",
  "list",
  "please",
  "calculate",
  "rewrite",
  "cv",
  "ابي",
  "أبي",
  "ابغى",
  "أبغى",
  "اريد",
  "أريد",
  "احتاج",
  "أحتاج",
  "منتج",
  "منتجات",
  "شي",
  "شيء",
  "عن",
  "لي",
  "من",
  "في",
  "على",
  "مع",
  "هذا",
  "هذه"
]);

function includesAny(normalized, patterns) {
  return patterns.some((pattern) => normalized.includes(pattern));
}

function normalizeQuery(value = "") {
  return value
    .toLowerCase()
    .trim()
    .replace(/[!?.,،؛:()/-]+/g, " ")
    .replace(/\s+/g, " ");
}

function tokenizeQuery(value = "") {
  return normalizeQuery(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !stopTokens.has(token));
}

function getSearchableFields(product) {
  return [
    product.sku,
    product.name,
    product.nameAr,
    product.slug,
    product.category,
    product.categoryAr,
    product.shortDescription,
    product.shortDescriptionAr,
    product.size,
    product.sizeAr,
    ...(product.colors || []),
    ...(product.colorsAr || []),
    ...(product.highlights || []),
    ...(product.highlightsAr || [])
  ]
    .filter(Boolean)
    .map((value) => normalizeQuery(value));
}

function scoreProductMatch(product, query = "") {
  const needle = normalizeQuery(query);
  const tokens = tokenizeQuery(query);

  if (!needle) {
    return 0;
  }

  const fields = getSearchableFields(product);
  let score = 0;

  for (const field of fields) {
    const fieldWords = field.split(" ").filter(Boolean);

    if (field === needle) {
      score += 12;
    } else if (field.includes(needle) || needle.includes(field)) {
      score += 7;
    }

    for (const token of tokens) {
      if (field === token || fieldWords.includes(token)) {
        score += 4;
      } else if (token.length >= 5 && field.includes(token)) {
        score += 2;
      }
    }
  }

  return score;
}

export function findProduct(query = "") {
  const needle = normalizeQuery(query);
  if (!needle) {
    return null;
  }

  const matches = products
    .map((product) => ({
      product,
      score: scoreProductMatch(product, query)
    }))
    .filter((entry) => entry.score >= 6)
    .sort((left, right) => right.score - left.score || right.product.rating - left.product.rating);

  return matches[0]?.product ?? null;
}

function getRankedProducts(query = "") {
  const needle = normalizeQuery(query);

  const ranked = products
    .map((product) => ({
      product,
      score: scoreProductMatch(product, query)
    }))
    .sort((left, right) => right.score - left.score || right.product.rating - left.product.rating);

  if (!needle) {
    return ranked;
  }

  return ranked.filter((entry) => entry.score > 0);
}

export function listProductsByCategory(category = "") {
  const needle = normalizeQuery(category);
  const tokens = tokenizeQuery(category);
  return products.filter((product) => {
    const fields = [
      product.category,
      product.categoryAr,
      product.name,
      product.nameAr,
      product.shortDescription,
      product.shortDescriptionAr
    ].map((value) => normalizeQuery(value));

    if (fields.some((field) => field.includes(needle))) {
      return true;
    }

    return tokens.length > 0 && tokens.every((token) => fields.some((field) => field.includes(token)));
  });
}

export function getCatalogSummary(locale = "en") {
  const categoryMap = new Map();

  for (const product of products) {
    const key = locale === "ar" ? product.categoryAr : product.category;
    if (!categoryMap.has(key)) {
      categoryMap.set(key, []);
    }
    categoryMap.get(key).push(locale === "ar" ? product.nameAr : product.name);
  }

  const categoryLines = Array.from(categoryMap.entries())
    .map(([category, items]) => {
      const sampleItems = items.slice(0, 3).join(locale === "ar" ? "، " : ", ");
      return locale === "ar"
        ? `• ${category}: ${sampleItems}`
        : `• ${category}: ${sampleItems}`;
    })
    .join("\n");

  return locale === "ar"
    ? `هذه أبرز الفئات المتوفرة لدينا:\n${categoryLines}\n\nاذكر المنتج أو الفئة أو ما تحتاجه وسأبحث لك في الكتالوج.`
    : `Here are the main categories we currently carry:\n${categoryLines}\n\nTell me the product, category, or what you need, and I’ll search the catalog for the best fits.`;
}

export function recommendProducts(query = "", locale = "en") {
  const ranked = getRankedProducts(query);

  if (ranked.length > 0) {
    return ranked.slice(0, 4).map((entry) => entry.product);
  }

  const sorted = [...products].sort((left, right) => right.rating - left.rating || left.priceSar - right.priceSar);
  return locale === "ar" ? sorted.slice(0, 4).reverse() : sorted.slice(0, 4);
}

export function getRecommendationRationale(query = "", locale = "en") {
  const tokens = tokenizeQuery(query);

  if (tokens.length > 0) {
    return locale === "ar"
      ? "اخترت هذه الخيارات بناءً على أقرب تطابق مع ما طلبته، مع مراعاة التقييمات والجودة العامة."
      : "I picked these options based on the closest catalog match to your request, while also favoring stronger ratings and overall quality.";
  }

  return locale === "ar"
    ? "اخترت هذه الخيارات بناءً على أفضل التقييمات والتوازن بين السعر والقيمة."
    : "I picked these options based on strong ratings and a balanced mix of value and quality.";
}

export function findOrder(orderNumber = "") {
  const normalized = orderNumber.trim().toUpperCase();
  return orders.find((order) => order.orderNumber === normalized) ?? null;
}

export function getProductById(id) {
  return products.find((product) => product.id === id) ?? null;
}

export function isOrderEligibleForReturn(order, locale = "en") {
  if (!order?.deliveryDate) {
    return {
      eligible: false,
      reason:
        locale === "ar"
          ? "الطلب لم يتم تسليمه بعد، لذلك لا يمكن بدء طلب الإرجاع الآن."
          : "The order has not been delivered yet, so a return cannot start."
    };
  }

  const deliveredAt = new Date(order.deliveryDate);
  const now = new Date("2026-03-15");
  const diffDays = Math.floor((now - deliveredAt) / (1000 * 60 * 60 * 24));

  if (diffDays > storePolicies.returns.windowDays) {
    return {
      eligible: false,
      reason:
        locale === "ar"
          ? `تم تسليم هذا الطلب قبل ${diffDays} أيام، وهذا خارج نافذة الإرجاع البالغة ${storePolicies.returns.windowDays} أيام.`
          : `This order was delivered ${diffDays} days ago, which is outside the ${storePolicies.returns.windowDays}-day return window.`
    };
  }

  if (order.discounted) {
    return {
      eligible: true,
      reason:
        locale === "ar"
          ? "الطلب داخل فترة الإرجاع، لكن المنتجات المخفضة قد تكون مؤهلة لرصيد متجر أو استبدال فقط."
          : "This order is within the return window, but discounted items are eligible for store credit or exchange only."
    };
  }

  if (order.defectiveClaim) {
    return {
      eligible: true,
      reason:
        locale === "ar"
          ? "المنتجات التالفة أو المعيبة يمكن استبدالها أو استردادها، وتتحمل الشركة رسوم الشحن العكسي. قد نحتاج صوراً توضيحية."
          : "Damaged or defective items can be replaced or refunded, and return shipping is covered by the company. Photo evidence may be required."
    };
  }

  return {
    eligible: true,
    reason:
      locale === "ar"
        ? `يبدو أن الطلب مؤهل للإرجاع خلال ${storePolicies.returns.windowDays} أيام من التسليم، بشرط أن يكون المنتج غير مستخدم ومع التغليف والملصقات الأصلية. رسوم الشحن العكسي على العميل ما لم يكن السبب خطأ من الشركة.`
        : `This order appears eligible for a return request within ${storePolicies.returns.windowDays} days of delivery, as long as the item is unused and returned with its original tags and packaging. Return shipping is paid by the customer unless the return is due to company error.`
  };
}

export function getShippingSummary(locale = "en") {
  return locale === "ar"
    ? "أوقات التوصيل تقديرية وليست مضمونة. غالبًا يصل الشحن إلى المدن الرئيسية خلال 1 إلى 3 أيام عمل، وتنتقل مسؤولية فقدان الشحنة إلى العميل عند التسليم."
    : "Delivery times are estimated rather than guaranteed. Orders usually reach major cities within 1 to 3 business days, and risk of loss transfers to the customer upon delivery.";
}

export function getPaymentSummary(locale = "en") {
  return locale === "ar"
    ? `طرق الدفع المتاحة تشمل عادة ${paymentMethods.ar.join("، ")}، وتتم المعالجة بأمان عبر ${storePolicies.contact.paymentsProvider}. يوافق العميل أيضًا على دفع الرسوم والضرائب المرتبطة بالشراء.`
    : `Supported payment methods usually include ${paymentMethods.en.join(", ")}, and payments are processed securely through ${storePolicies.contact.paymentsProvider}. Customers also agree to pay the fees and taxes associated with the purchase.`;
}

export function canCancelOrder(order) {
  const cancellableStatuses = ["Processing", "Pending payment"];
  return cancellableStatuses.includes(order?.status);
}

export function createHandoffTicket({ customerMessage, intent, locale, sessionId, customer }) {
  const customerFingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        sessionId,
        intent,
        email: customer?.email ?? null,
        name: customer?.name ?? null
      })
    )
    .digest("hex")
    .slice(0, 8);

  return {
    id: `handoff-${customerFingerprint}`,
    queue: "customer-support-tier-1",
    priority: ["returns_refunds", "order_change_cancel"].includes(intent) ? "high" : "normal",
    locale,
    summary: String(customerMessage ?? "").trim().slice(0, 240),
    intent,
    customerName: customer?.name ?? null,
    customerEmail: customer?.email ?? null
  };
}

export function getReturnPolicySummary(locale = "en") {
  const rules = storePolicies.returns.highlights[locale].slice(0, 5).join(locale === "ar" ? " " : " ");
  return locale === "ar"
    ? `${rules} يتم رد المبلغ إلى وسيلة الدفع الأصلية خلال ${storePolicies.returns.refundBusinessDays} أيام عمل بعد استلام المرتجع واعتماده.`
    : `${rules} Refunds return to the original payment method within ${storePolicies.returns.refundBusinessDays} business days after the returned item is received and approved.`;
}

export function getPolicyAnswer(message = "", locale = "en") {
  const normalized = message.toLowerCase();
  const asksPrivacyCollection = includesAny(normalized, ["privacy", "data", "collect", "gather", "personal data", "الخصوصية", "بيانات", "نجمع", "معلومات"]);
  const asksPrivacySharing = includesAny(normalized, ["sell my data", "share data", "third party", "advertiser", "cookies", "cookie", "sell", "third-party", "مشاركة", "معلنين", "كوكيز", "ملفات تعريف", "أطراف ثالثة", "بيع", "تبيع", "تبيعون"]);
  const asksPrivacyRights = includesAny(normalized, ["security", "ssl", "protect my data", "rights", "delete my data", "gdpr", "ccpa", "children", "under 13", "أمان", "حماية", "ssl", "حقوق", "حذف", "gdpr", "ccpa", "الأطفال", "13"]);
  const asksTermsBasics = includesAny(normalized, ["terms", "conditions", "18", "legal consent", "who can use", "account", "pricing", "price error", "الشروط", "الأحكام", "18", "موافقة قانونية", "حساب", "التسعير", "السعر"]);
  const asksTermsLaw = includesAny(normalized, ["warranty", "liability", "intellectual property", "copyright", "law", "governing law", "liable", "الضمان", "المسؤولية", "الملكية الفكرية", "حقوق النشر", "القانون"]);
  const asksContact = includesAny(normalized, ["contact", "email", "phone", "whatsapp", "support", "تواصل", "البريد", "الايميل", "واتساب", "الدعم"]);

  if (includesAny(normalized, ["return policy", "refund policy", "exchange", "refund", "return", "استرجاع", "استرداد", "ارجاع", "استبدال", "تالف", "معيب"])) {
    return getReturnPolicySummary(locale);
  }

  if (asksPrivacyCollection || asksPrivacySharing || asksPrivacyRights) {
    const parts = [];
    if (asksPrivacyCollection) {
      parts.push(
        locale === "ar"
          ? "وفق سياسة الخصوصية، يجمع المتجر الاسم والبريد الإلكتروني والعنوان وتفاصيل الدفع، إضافة إلى بيانات تلقائية مثل عنوان IP ونوع المتصفح والكوكيز وبيانات الاستخدام. تُستخدم هذه البيانات لمعالجة الطلبات وتحسين الموقع والتواصل مع العميل."
          : "According to the Privacy Policy, the store collects name, email, address, and payment details, plus automated data such as IP address, browser type, cookies, and usage data. This data is used to process orders, improve the website, and communicate with customers."
      );
    }
    if (asksPrivacySharing) {
      parts.push(
        locale === "ar"
          ? "لا يبيع المتجر بيانات العميل للمعلنين. تتم مشاركة البيانات فقط مع مزودي الدفع والشحن والخدمات اللازمة للتشغيل، ويمكن تعطيل الكوكيز من المتصفح مع احتمال تأثر بعض وظائف الموقع."
          : "The store does not sell customer data to advertisers. Data is shared only with payment processors, shipping providers, and service providers needed to operate the site, and cookies can be disabled in the browser although some site functionality may be affected."
      );
    }
    if (asksPrivacyRights) {
      parts.push(
        locale === "ar"
          ? "كما تنص السياسة على استخدام تشفير SSL وخوادم آمنة، مع إمكانية الوصول إلى البيانات أو تصحيحها أو حذفها أو تقييد معالجتها، والخدمة غير موجهة للأطفال دون 13 عاماً."
          : "The policy also notes SSL encryption and secure servers, gives customers rights to access, correct, delete, or restrict processing of their data, and says the service is not intended for children under 13."
      );
    }
    return parts.join(locale === "ar" ? " " : " ");
  }

  if (asksTermsBasics || asksTermsLaw) {
    const parts = [];
    if (asksTermsBasics) {
      parts.push(
        locale === "ar"
          ? "وفق الشروط والأحكام، يجب أن يكون المستخدم بعمر 18 سنة على الأقل أو لديه موافقة قانونية. يجب تقديم معلومات دقيقة وعدم إساءة استخدام الموقع، وقد تتغير أوصاف المنتجات والأسعار مع حق المتجر في تصحيح أخطاء التسعير."
          : "Under the Terms & Conditions, users must be at least 18 years old or have legal consent. Customers must provide accurate information and not misuse the website, and product descriptions and prices may change while the store reserves the right to correct pricing errors."
      );
    }
    if (asksTermsLaw) {
      parts.push(
        locale === "ar"
          ? `كما تنص الشروط على أن المنتجات تُباع كما هي دون ضمانات إضافية، وأن محتوى الموقع مملوك للتاجر، وتخضع هذه الشروط لقوانين ${storePolicies.contact.governingLaw.ar}.`
          : `The terms also state that products are provided as-is without additional warranties, website content belongs to the merchant, and the terms are governed by the laws of the ${storePolicies.contact.governingLaw.en}.`
      );
    }
    return parts.join(locale === "ar" ? " " : " ");
  }

  if (asksContact) {
    return locale === "ar"
      ? `للاستفسارات، يمكن التواصل عبر البريد الإلكتروني ${storePolicies.contact.email} أو عبر صفحة التواصل ${storePolicies.contact.contactUrl}. كما يمكن لفريق خدمة العملاء متابعة الحالات الخاصة مثل الإرجاع والاستثناءات.`
      : `For questions, customers can contact ${storePolicies.contact.email} or use the contact page at ${storePolicies.contact.contactUrl}. Human support can also follow up on special cases such as returns or exceptions.`;
  }

  return locale === "ar"
    ? "أستطيع شرح سياسة الخصوصية، شروط الاستخدام، الدفع، الشحن، أو سياسة الاسترجاع والاستبدال حسب المستندات الرسمية. أخبرني بالموضوع الذي تريد معرفته."
    : "I can explain the Privacy Policy, Terms & Conditions, payment rules, shipping terms, or the return and refund policy based on the official documents. Tell me which policy area you want.";
}
