import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { storePolicies } from "../data/policies.js";
import { products } from "../data/products.js";
import {
  localizeOrderCourier,
  localizeOrderEta,
  localizeOrderPaymentStatus,
  localizeOrderStatus
} from "../lib/orderLocalization.js";

function fillTemplate(template, values) {
  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replaceAll(`{${key}}`, String(value));
  }, template);
}

const localized = {
  en: {
    dir: "ltr",
    nav: ["Chargers & Cables", "Deals", "Watches", "Power Banks", "Bundles", "Seasonal Offers"],
    heroSlides: [
      {
        id: "chargers",
        eyebrow: "Chargers and connectivity",
        title: "Smart accessories that help all day.",
        subtitle: "Fast charging, trusted quality, and instant support inside the storefront.",
        cta: "Shop now",
        supportCta: "Chat with us",
        visualTitle: "USB-C",
        visualNote: "65W",
        theme: "theme-charger"
      },
      {
        id: "wearables",
        eyebrow: "Smart watches",
        title: "Support that helps at every step.",
        subtitle: "Clear products, easier decisions, and support before and after purchase.",
        cta: "Explore watch",
        supportCta: "Chat with us",
        visualTitle: "Watch",
        visualNote: "4.8★",
        theme: "theme-watch"
      },
      {
        id: "power",
        eyebrow: "Power and battery",
        title: "Portable power that lasts all day.",
        subtitle: "Instant answers about compatibility, delivery, and returns from the same widget.",
        cta: "See offers",
        supportCta: "Chat with us",
        visualTitle: "20,000",
        visualNote: "mAh",
        theme: "theme-power"
      }
    ],
    categories: [
      { icon: "🔌", label: "Chargers & Cables" },
      { icon: "⌚", label: "Watches" },
      { icon: "🔋", label: "Power Banks" },
      { icon: "🎧", label: "Bundles" },
      { icon: "🎁", label: "Seasonal Offers" }
    ],
    merchCards: [
      {
        id: "wireless-mouse",
        title: "Wireless Mouse",
        subtitle: "Comfortable daily office mouse with a straightforward support flow.",
        price: "SAR 27.29",
        accent: "visual-mouse",
        prompt: "Tell me about the Wireless Mouse"
      },
      {
        id: "smartwatch",
        title: "Active Smartwatch",
        subtitle: "A bilingual-friendly wearable for health, tracking, and daily use.",
        price: "SAR 209.99",
        accent: "visual-watch",
        prompt: "Tell me about the Smartwatch"
      },
      {
        id: "earbuds",
        title: "Noise Cancelling Earbuds",
        subtitle: "A strong example for post-purchase support, delivery, and returns.",
        price: "SAR 104.99",
        accent: "visual-audio",
        prompt: "Tell me about the Noise Cancelling Earbuds"
      },
      {
        id: "charger",
        title: "Fast Wall Charger",
        subtitle: "Clear compatibility, delivery guidance, and policy-aware support.",
        price: "SAR 59.00",
        accent: "visual-charger",
        prompt: "I need help choosing a fast charger"
      }
    ],
    supportKicker: "Core use case",
    supportTitle: "Support is the first product problem we solve in this store.",
    supportBody:
      "Instead of waiting 8-12 hours, shoppers can ask about a product, track an order, check return rules, or escalate to a human agent from the same interface.",
    supportPoints: ["Product information", "Order tracking", "Returns & refunds", "Human escalation"],
    supportPrimary: "Start chatting now",
    supportStats: [
      { value: "15%", text: "Expected CSAT/NPS recovery after reducing delay" },
      { value: "7%", text: "Cart-abandonment gap addressed through pre-purchase support" },
      { value: "EN + AR", text: "Bilingual-ready support experience grounded in real policies" }
    ],
    sections: {
      categories: "Product categories",
      topSelling: "Full catalog",
      askBeforeBuy: "Ask support before buying",
      askSupport: "Ask support",
      addToCart: "Add to cart",
      viewDetails: "View details",
      cart: "Cart",
      cartSummary: "Cart summary",
      cartEmpty: "Your cart is empty. Add a product and I’ll keep the whole order visible here.",
      subtotal: "Subtotal",
      tax: "Tax",
      total: "Total",
      clearCart: "Clear cart",
      placeDemoOrder: "Create order",
      creatingOrder: "Creating order...",
      orderCreated: "Order created",
      orderCreateFailed: "We couldn't create the order right now. Please try again.",
      orders: "Orders",
      orderItems: "Items",
      orderStatus: "Status",
      trackInChat: "Track in chat",
      orderDetails: "View order",
      quantity: "Qty",
      remove: "Remove",
      storeFeatures: "Store features",
      analytics: "View support log",
      analyticsTitle: "Recent analytics events",
      analyticsSummaryTitle: "Journey summary",
      testimonials: "Customer reviews",
      policies: "Policies and trust",
      footerLinks: "Important links",
      contact: "Contact us"
    },
    featureCards: [
      {
        title: "Direct product help",
        description: "The assistant answers product, delivery, and refund questions before the customer leaves the page."
      },
      {
        title: "Clear pricing",
        description: "Prices, stock context, and product facts are easy to understand and easy to confirm."
      },
      {
        title: "Faster delivery support",
        description: "Order ETA and tracking questions are handled quickly before they reach a human queue."
      }
    ],
    testimonials: [
      {
        name: "Abdulaziz",
        quote: "I liked how quickly the assistant helped me compare products before buying.",
        stars: "★★★★★"
      },
      {
        name: "Raheen",
        quote: "When I needed my order status, the answer was instant and clear.",
        stars: "★★★★★"
      },
      {
        name: "Khaled",
        quote: "The return explanation was much easier to understand than searching through policy pages.",
        stars: "★★★★★"
      }
    ],
    footer: {
      about: "About us",
      terms: "Terms & conditions",
      returns: "Returns and exchange policy",
      privacy: "Usage and privacy policy",
      storeBlurb: "A support-first storefront showing how an AI agent can assist across a modern e-commerce journey."
    },
    widget: {
      homeTitle: "Support concierge",
      chatTitle: "Chat with us",
      offlineNotice:
        "Hi there. We can help with products, orders, returns, payments, and store policies from the same storefront support desk.",
      introTitle: "Please introduce yourself",
      namePlaceholder: "Enter your name",
      emailPlaceholder: "Enter your email",
      phonePlaceholder: "Enter your phone number",
      customerNumberPlaceholder: "Enter your customer number",
      newsletter: "Sign up for our newsletter",
      introSend: "Send",
      skipIntro: "Skip for now",
      homeHero: "Support that feels built into the store.",
      chatEntryTitle: "Chat with us",
      chatEntryBody: "We typically reply within a few minutes.",
      homeTab: "Home",
      chatTab: "Chat",
      previous: "Previous messages",
      quickActions: [
        "Where is my latest order?",
        "I want help with a refund",
        "Recommend the best product for travel",
        "What payment methods do you support?",
        "What data do you collect?",
        "What are your terms and conditions?",
        "I need a human agent"
      ],
      placeholder: "Type your message here...",
      menuHome: "Home",
      menuNewChat: "New chat",
      menuClose: "Close",
      poweredLabel: "POWERED BY",
      poweredBrand: "AI SUPPORT",
      meta: "Intent coverage: product info, tracking, returns, handoff",
      typing: "Typing…",
      retry: "Retry",
      sendingLocked: "Please wait for the current reply before sending another message.",
      cooldownNotice: "Please wait {seconds}s before sending the next message.",
      timeoutError: "That reply took too long. Tap retry to send the same message again.",
      temporaryError: "I hit a temporary issue while sending that message. Tap retry to try the same request again.",
      offlineError: "You appear to be offline. Reconnect and tap retry to send the same message again.",
      afterIntro: "Thanks {name}. I’ve saved your details and I’m ready to help. What would you like to do first?",
      orderCreatedFollowUp:
        "Your order {orderNumber} has been created. I can track it for you, explain the status, or check the shopper profile saved for this session."
    },
    brand: {
      title: "Support Commerce",
      subtitle: "AI-assisted storefront"
    }
  },
  ar: {
    dir: "rtl",
    nav: ["شواحن وتوصيلات", "تخفيضات", "ساعات", "بطاريات متنوعة وباوربنك", "بكجات", "عروض موسمية"],
    heroSlides: [
      {
        id: "chargers",
        eyebrow: "شواحن وتوصيلات",
        title: "أجهزة ذكية تخدمك كل يوم",
        subtitle: "شحن سريع، جودة موثوقة، ودعم فوري داخل المتجر.",
        cta: "تسوق الآن",
        supportCta: "تحدث معنا",
        visualTitle: "USB-C",
        visualNote: "65W",
        theme: "theme-charger"
      },
      {
        id: "wearables",
        eyebrow: "ساعات ذكية",
        title: "دعم يساعدك في كل لحظة",
        subtitle: "منتجات واضحة، ومساعد دعم جاهز للأسئلة قبل وبعد الشراء.",
        cta: "اكتشف الساعة",
        supportCta: "تحدث معنا",
        visualTitle: "Watch",
        visualNote: "4.8★",
        theme: "theme-watch"
      },
      {
        id: "power",
        eyebrow: "بطاريات وباور بنك",
        title: "نوفر لك طاقة تدوم طوال اليوم",
        subtitle: "ردود سريعة حول التوافق، التوصيل، والإرجاع من نفس الواجهة.",
        cta: "شاهد العروض",
        supportCta: "تحدث معنا",
        visualTitle: "20,000",
        visualNote: "mAh",
        theme: "theme-power"
      }
    ],
    categories: [
      { icon: "🔌", label: "شواحن وتوصيلات" },
      { icon: "⌚", label: "ساعات" },
      { icon: "🔋", label: "بطاريات متنوعة وباوربنك" },
      { icon: "🎧", label: "بكجات" },
      { icon: "🎁", label: "عروض موسمية" }
    ],
    merchCards: [
      {
        id: "wireless-mouse",
        title: "ماوس لاسلكي مريح",
        subtitle: "مثالي للمكاتب والعمل اليومي مع استجابة سريعة.",
        price: "٢٧٫٢٩ ر.س",
        accent: "visual-mouse",
        prompt: "أريد معرفة تفاصيل ماوس لاسلكي"
      },
      {
        id: "smartwatch",
        title: "ساعة ذكية نشطة",
        subtitle: "مناسبة للرياضة والنبض مع وصف ثنائي اللغة.",
        price: "٢٠٩٫٩٩ ر.س",
        accent: "visual-watch",
        prompt: "أريد معرفة تفاصيل ساعة ذكية"
      },
      {
        id: "earbuds",
        title: "سماعات عازلة للضوضاء",
        subtitle: "منتج مناسب لسيناريوهات الدعم بعد الشراء والشحن والاسترجاع.",
        price: "١٠٤٫٩٩ ر.س",
        accent: "visual-audio",
        prompt: "أريد معرفة تفاصيل سماعات عازلة للضوضاء"
      },
      {
        id: "charger",
        title: "شاحن جداري سريع",
        subtitle: "دعم واضح للتوافق، وسياسة إرجاع مضبوطة.",
        price: "٥٩٫٠٠ ر.س",
        accent: "visual-charger",
        prompt: "أحتاج مساعدة لاختيار شاحن سريع"
      }
    ],
    supportKicker: "جوهر التجربة",
    supportTitle: "الدعم هو أول شيء نصلحه داخل المتجر",
    supportBody:
      "بدل انتظار 8-12 ساعات، المستخدم يقدر يسأل عن المنتج، يتابع طلبه، يعرف شروط الإرجاع، أو يتحول لموظف خدمة عملاء من نفس الواجهة.",
    supportPoints: ["معلومات منتجات", "تتبع الطلبات", "استرجاع واستبدال", "تصعيد بشري"],
    supportPrimary: "ابدأ المحادثة الآن",
    supportStats: [
      { value: "15%", text: "تحسن متوقع في CSAT/NPS بعد تقليل التأخير" },
      { value: "7%", text: "تقليل فجوة التخلي عن السلة عبر دعم قبل الشراء" },
      { value: "AR + EN", text: "جاهزية ثنائية اللغة مع سياسات مرتكزة على البيانات" }
    ],
    sections: {
      categories: "أقسام المنتجات",
      topSelling: "كل المنتجات",
      askBeforeBuy: "اسأل الدعم قبل الشراء",
      askSupport: "اسأل الدعم",
      addToCart: "إضافة للسلة",
      viewDetails: "عرض التفاصيل",
      cart: "السلة",
      cartSummary: "ملخص السلة",
      cartEmpty: "السلة فارغة حاليًا. أضف منتجًا وسيظهر الطلب هنا مباشرة.",
      subtotal: "الإجمالي قبل الضريبة",
      tax: "الضريبة",
      total: "الإجمالي",
      clearCart: "تفريغ السلة",
      placeDemoOrder: "إنشاء طلب تجريبي",
      creatingOrder: "جاري إنشاء الطلب...",
      orderCreated: "تم إنشاء الطلب",
      orderCreateFailed: "تعذر إنشاء الطلب التجريبي الآن. حاول مرة أخرى.",
      orders: "الطلبات",
      orderItems: "المنتجات",
      orderStatus: "الحالة",
      trackInChat: "تتبع في المحادثة",
      orderDetails: "عرض الطلب",
      quantity: "الكمية",
      remove: "حذف",
      storeFeatures: "مميزات المتجر",
      analytics: "عرض سجل الدعم",
      analyticsTitle: "أحدث أحداث سجل الدعم",
      analyticsSummaryTitle: "ملخص الرحلات",
      testimonials: "آراء العملاء",
      policies: "السياسات والثقة",
      footerLinks: "روابط مهمة",
      contact: "تواصل معنا"
    },
    featureCards: [
      {
        title: "دعم فني مباشر",
        description: "المساعد يجاوب على أسئلة المنتجات، الطلبات، والاسترجاع قبل ما يتحول العميل للبريد أو الواتساب."
      },
      {
        title: "أسعار واضحة",
        description: "معلومات المنتج والسعر والجاهزية تظهر بوضوح، مع ردود فورية على الاستفسارات المتكررة."
      },
      {
        title: "توصيل سريع",
        description: "يتعامل مع أسئلة ETA وتتبع الطلبات ويخفف الضغط على فريق خدمة العملاء."
      }
    ],
    testimonials: [
      {
        name: "عبدالعزيز",
        quote: "أحب هذا المتجر وتعاملهم الراقي مع العملاء. الدردشة ساعدتني أحدد المنتج بسرعة.",
        stars: "★★★★★"
      },
      {
        name: "رهين",
        quote: "لما احتجت أعرف حالة طلبي، الرد كان فوري وواضح بدون انتظار طويل.",
        stars: "★★★★★"
      },
      {
        name: "خالد",
        quote: "تجربة الدعم مريحة جدًا، خصوصًا في معرفة سياسة الاسترجاع قبل الشراء.",
        stars: "★★★★★"
      }
    ],
    footer: {
      about: "من نحن",
      terms: "الشروط والأحكام",
      returns: "سياسة الاستبدال والاسترجاع",
      privacy: "سياسة الاستخدام والخصوصية",
      storeBlurb: "متجر تجريبي يوضح كيف يندمج الدعم الذكي داخل متجر سعودي بسيط وواضح."
    },
    widget: {
      homeTitle: "مركز الدعم",
      chatTitle: "تحدث معنا",
      offlineNotice:
        "مرحبًا. نحن هنا لمساعدتك في المنتجات والطلبات والاسترجاع والدفع وسياسات المتجر من داخل واجهة المتجر نفسها.",
      introTitle: "عرّفنا بنفسك",
      namePlaceholder: "أدخل اسمك",
      emailPlaceholder: "أدخل بريدك الإلكتروني",
      phonePlaceholder: "أدخل رقم الجوال",
      customerNumberPlaceholder: "أدخل رقم العميل",
      newsletter: "سجل في النشرة البريدية",
      introSend: "إرسال",
      skipIntro: "تخطي الآن",
      homeHero: "دعم مصمم ليشبه المتجر نفسه.",
      chatEntryTitle: "تحدث معنا",
      chatEntryBody: "عادة نرد خلال بضع دقائق.",
      homeTab: "الرئيسية",
      chatTab: "المحادثة",
      previous: "الرسائل السابقة",
      quickActions: [
        "أين آخر طلب لي؟",
        "أريد مساعدة في الاسترداد",
        "رشح لي أفضل منتج للسفر",
        "ما طرق الدفع المتاحة؟",
        "ما البيانات التي تجمعونها؟",
        "ما هي الشروط والأحكام؟",
        "أحتاج موظف خدمة عملاء"
      ],
      placeholder: "اكتب رسالتك هنا...",
      menuHome: "الرئيسية",
      menuNewChat: "محادثة جديدة",
      menuClose: "إغلاق",
      poweredLabel: "مشغل بواسطة",
      poweredBrand: "AI SUPPORT",
      meta: "نطاق الخدمة: منتجات، تتبع، إرجاع، تصعيد",
      typing: "جاري الكتابة…",
      retry: "إعادة المحاولة",
      sendingLocked: "يرجى انتظار الرد الحالي قبل إرسال رسالة جديدة.",
      cooldownNotice: "يرجى الانتظار {seconds} ث قبل إرسال الرسالة التالية.",
      timeoutError: "استغرق الرد وقتاً أطول من المتوقع. اضغط إعادة المحاولة لإرسال نفس الرسالة مرة أخرى.",
      temporaryError: "واجهنا مشكلة مؤقتة أثناء إرسال الرسالة. اضغط إعادة المحاولة لتجربة نفس الطلب مرة أخرى.",
      offlineError: "يبدو أنك غير متصل بالإنترنت. أعد الاتصال ثم اضغط إعادة المحاولة لإرسال نفس الرسالة مرة أخرى.",
      afterIntro: "شكرًا {name}. حفظت بياناتك وأنا جاهز للمساعدة. ما الذي تريد البدء به؟",
      orderCreatedFollowUp:
        "تم إنشاء طلبك {orderNumber}. أقدر أتابع حالته لك، أشرح وضع الشحن، أو أراجع ملف العميل المحفوظ في هذه الجلسة."
    },
    brand: {
      title: "متجر الدعم",
      subtitle: "واجهة تجارة مدعومة بالذكاء الاصطناعي"
    }
  }
};

const categoryIconMap = {
  Electronics: "🖥️",
  Accessories: "🧩",
  Gaming: "🎮",
  Storage: "💾",
  Wearables: "⌚",
  Audio: "🎧",
  "Smart Home": "🏠",
  "Personal Care": "🪥"
};

const STORAGE_KEYS = {
  cart: "lean-souq-session-cart",
  orders: "lean-souq-session-orders",
  profile: "lean-souq-session-profile",
  messages: "lean-souq-session-messages",
  sessionId: "lean-souq-session-id",
  locale: "lean-souq-session-locale",
  widgetOpen: "lean-souq-session-widget-open",
  widgetView: "lean-souq-session-widget-view",
  draft: "lean-souq-session-draft",
  queuedPrompt: "lean-souq-session-queued-prompt",
  checkoutNotice: "lean-souq-session-checkout-notice"
};

const CHAT_REQUEST_TIMEOUT_MS = 30000;
const MESSAGE_COOLDOWN_MS = 1500;

const LEGACY_STORAGE_KEYS = {
  cart: "lean-souq-cart",
  orders: "lean-souq-orders",
  profile: "lean-souq-profile"
};

const LEGACY_STORAGE_BY_NEW_KEY = {
  [STORAGE_KEYS.cart]: LEGACY_STORAGE_KEYS.cart,
  [STORAGE_KEYS.orders]: LEGACY_STORAGE_KEYS.orders,
  [STORAGE_KEYS.profile]: LEGACY_STORAGE_KEYS.profile
};

const memorySessionStorage = new Map();

function normalizeEmail(value = "") {
  return String(value ?? "").trim().toLowerCase();
}

function normalizePhone(value = "") {
  return String(value ?? "").replace(/[^\d+]/g, "").slice(0, 24);
}

function normalizeCustomerNumber(value = "") {
  return String(value ?? "").trim().toUpperCase().replace(/\s+/g, "-").slice(0, 64);
}

function getSessionStorageHandle() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function getLegacyStorageHandle() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readFromMemoryStorage(key) {
  return memorySessionStorage.has(key) ? memorySessionStorage.get(key) : null;
}

function writeToMemoryStorage(key, value) {
  memorySessionStorage.set(key, value);
}

function parseRoute(pathname) {
  const normalizedPath = pathname && pathname !== "/" ? pathname.replace(/\/+$/, "") : "/";
  const orderMatch = normalizedPath.match(/^\/orders\/([^/]+)$/);

  if (orderMatch) {
    return {
      page: "orders",
      orderNumber: decodeURIComponent(orderMatch[1])
    };
  }

  if (normalizedPath === "/orders") {
    return {
      page: "orders",
      orderNumber: null
    };
  }

  return {
    page: "store",
    orderNumber: null
  };
}

function readStorage(key, fallback) {
  const sessionStorageHandle = getSessionStorageHandle();
  const rawValue = sessionStorageHandle
    ? sessionStorageHandle.getItem(key)
    : readFromMemoryStorage(key);

  if (rawValue) {
    try {
      return JSON.parse(rawValue);
    } catch {
      return fallback;
    }
  }

  const legacyKey = LEGACY_STORAGE_BY_NEW_KEY[key] ?? null;
  const legacyStorageHandle = getLegacyStorageHandle();
  try {
    const rawLegacy = legacyKey ? legacyStorageHandle?.getItem(legacyKey) : null;
    if (!rawLegacy) {
      return fallback;
    }

    if (sessionStorageHandle) {
      sessionStorageHandle.setItem(key, rawLegacy);
    } else {
      writeToMemoryStorage(key, rawLegacy);
    }

    return JSON.parse(rawLegacy);
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  const serializedValue = JSON.stringify(value);
  const sessionStorageHandle = getSessionStorageHandle();
  try {
    if (sessionStorageHandle) {
      sessionStorageHandle.setItem(key, serializedValue);
    } else {
      writeToMemoryStorage(key, serializedValue);
    }
  } catch {
    writeToMemoryStorage(key, serializedValue);
  }
}

function matchesOrderToProfile(order, profile) {
  const profileEmail = normalizeEmail(profile?.email);
  const orderEmail = normalizeEmail(order?.email);
  const profilePhone = normalizePhone(profile?.phone);
  const orderPhone = normalizePhone(order?.phone);
  const profileCustomerNumber = normalizeCustomerNumber(profile?.customerNumber);
  const orderCustomerNumber = normalizeCustomerNumber(order?.customerNumber);

  return Boolean(
    (profileCustomerNumber && orderCustomerNumber === profileCustomerNumber) ||
    (profileEmail && orderEmail === profileEmail) ||
    (profilePhone && orderPhone === profilePhone)
  );
}

function hasSavedIdentity(profile) {
  return Boolean(
    profile?.name &&
    (normalizeEmail(profile?.email) || normalizePhone(profile?.phone) || normalizeCustomerNumber(profile?.customerNumber))
  );
}

function mergeOrdersByNumber(primaryOrders, secondaryOrders = []) {
  const orderMap = new Map();

  [...secondaryOrders, ...primaryOrders].forEach((order) => {
    if (order?.orderNumber) {
      orderMap.set(order.orderNumber, order);
    }
  });

  return [...orderMap.values()].sort((left, right) => {
    const leftSeed = Number(String(left.orderNumber).split("-")[1] ?? 0);
    const rightSeed = Number(String(right.orderNumber).split("-")[1] ?? 0);
    return rightSeed - leftSeed;
  });
}

function formatCurrency(locale, value) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2
  }).format(value);
}

function localizeText(locale, en, ar) {
  return locale === "ar" ? ar : en;
}

function localizeProduct(product, locale) {
  return {
    ...product,
    title: locale === "ar" ? product.nameAr : product.name,
    subtitle: locale === "ar" ? product.shortDescriptionAr : product.shortDescription,
    category: locale === "ar" ? product.categoryAr : product.category,
    size: locale === "ar" ? product.sizeAr : product.size,
    displayName: locale === "ar" ? product.nameAr : product.name,
    displayCategory: locale === "ar" ? product.categoryAr : product.category,
    displayDescription: locale === "ar" ? product.shortDescriptionAr : product.shortDescription,
    displaySize: locale === "ar" ? product.sizeAr : product.size,
    displayColors: locale === "ar" ? product.colorsAr : product.colors,
    displayHighlights: locale === "ar" ? product.highlightsAr : product.highlights,
    price: formatCurrency(locale, product.priceSar),
    displayPrice: formatCurrency(locale, product.priceSar),
    stockLabel:
      product.stockStatus === "low_stock"
        ? localizeText(locale, "Low stock", "مخزون منخفض")
        : localizeText(locale, "In stock", "متوفر")
  };
}

function buildCategoryCards(locale) {
  const byCategory = new Map();
  products.forEach((product) => {
    if (!byCategory.has(product.category)) {
      byCategory.set(product.category, {
        key: product.category,
        icon: categoryIconMap[product.category] ?? "🛍️",
        label: locale === "ar" ? product.categoryAr : product.category,
        count: 0
      });
    }
    byCategory.get(product.category).count += 1;
  });

  return [...byCategory.values()].sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function buildPolicyCards(locale) {
  return [
    {
      key: "returns",
      anchor: "returns-policy",
      title: storePolicies.returns.title[locale],
      updated:
        locale === "ar"
          ? `استرداد خلال ${storePolicies.returns.refundBusinessDays} أيام عمل`
          : `${storePolicies.returns.refundBusinessDays}-business-day refund processing`,
      points: storePolicies.returns.highlights[locale].slice(0, 4)
    },
    {
      key: "privacy",
      anchor: "privacy-policy",
      title: storePolicies.privacy.title[locale],
      updated:
        locale === "ar"
          ? `آخر تحديث ${storePolicies.privacy.lastUpdated}`
          : `Updated ${storePolicies.privacy.lastUpdated}`,
      points: storePolicies.privacy.highlights[locale].slice(0, 4)
    },
    {
      key: "terms",
      anchor: "terms-policy",
      title: storePolicies.terms.title[locale],
      updated:
        locale === "ar"
          ? `آخر تحديث ${storePolicies.terms.lastUpdated}`
          : `Updated ${storePolicies.terms.lastUpdated}`,
      points: storePolicies.terms.highlights[locale].slice(0, 4)
    }
  ];
}

function localizeOrder(order, locale) {
  const items = order.items.map((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    return {
      ...item,
      name: locale === "ar" ? product?.nameAr ?? product?.name ?? item.productId : product?.name ?? item.productId
    };
  });

  return {
    ...order,
    items,
    displayStatus: localizeOrderStatus(locale, order.status),
    displayPaymentStatus: localizeOrderPaymentStatus(locale, order.paymentStatus),
    displayCourier: localizeOrderCourier(locale, order.courier),
    displayEta: localizeOrderEta(locale, order.eta),
    displaySubtotal: formatCurrency(locale, order.subtotalSar ?? 0),
    displayTax: formatCurrency(locale, order.taxSar ?? 0),
    displayTotal: formatCurrency(locale, order.totalSar ?? 0)
  };
}

function buildProductPrompt(product, locale) {
  return locale === "ar" ? `أريد معرفة تفاصيل ${product.nameAr}` : `Tell me about the ${product.name}`;
}

function createChatMessage(role, text, options = {}) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    sentAt: new Date().toISOString(),
    kind: options.kind ?? "standard",
    retryable: Boolean(options.retryable),
    retryText: options.retryText ?? "",
    retryAfterMs: Number(options.retryAfterMs) || 0
  };
}

function findRetryableTurn(messages = [], retryText = "") {
  const trimmedRetryText = String(retryText ?? "").trim();
  if (!trimmedRetryText) {
    return null;
  }

  const lastMessage = messages[messages.length - 1];
  const previousMessage = messages[messages.length - 2];

  if (
    lastMessage?.role !== "bot" ||
    !lastMessage.retryable ||
    String(lastMessage.retryText ?? "").trim() !== trimmedRetryText
  ) {
    return null;
  }

  if (previousMessage?.role !== "user" || String(previousMessage.text ?? "").trim() !== trimmedRetryText) {
    return null;
  }

  return {
    failedReplyId: lastMessage.id,
    userMessageId: previousMessage.id
  };
}

function buildClientErrorReply(text, error, responseStatus = 0) {
  if (error?.name === "AbortError") {
    return text.timeoutError;
  }

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return text.offlineError;
  }

  if (responseStatus >= 500 || responseStatus === 0) {
    return text.temporaryError;
  }

  return text.temporaryError;
}

function buildConversationHistory(messages = []) {
  return messages
    .filter((message) => {
      const role = String(message?.role ?? "").trim().toLowerCase();
      return (role === "user" || role === "bot") && (message?.kind ?? "standard") === "standard";
    })
    .map((message) => ({
      role: message.role === "bot" ? "assistant" : message.role,
      content: String(message.text ?? "")
    }))
    .slice(-16);
}

function formatMessageTime(sentAt, locale) {
  if (!sentAt) {
    return "";
  }

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(sentAt));
}

function inferMessageDirection(text, locale) {
  const value = String(text ?? "");
  const arabicMatches = value.match(/[\u0600-\u06FF]/g) ?? [];
  const latinMatches = value.match(/[A-Za-z]/g) ?? [];

  if (locale === "ar" && arabicMatches.length > 0) {
    return "rtl";
  }

  if (arabicMatches.length === 0 && latinMatches.length === 0) {
    return locale === "ar" ? "rtl" : "ltr";
  }

  return arabicMatches.length > latinMatches.length ? "rtl" : "ltr";
}

function renderInlineMessage(text = "") {
  const parts = String(text ?? "").split(/(\*\*[^*\n]+\*\*)/g);

  return parts.map((part, index) => {
    const isBoldToken = part.startsWith("**") && part.endsWith("**") && part.length > 4;

    if (isBoldToken) {
      return <strong key={`bold-${index}`}>{part.slice(2, -2)}</strong>;
    }

    return <React.Fragment key={`text-${index}`}>{part}</React.Fragment>;
  });
}

function normalizeMessageBlocks(text = "") {
  const normalized = String(text ?? "").replace(/\r\n?/g, "\n").trim();

  if (!normalized) {
    return [];
  }

  const withSuggestedBreaks = normalized.includes("\n")
    ? normalized
    : normalized
        .replace(/([.?!]) (Another(?: great)? option is\b)/g, "$1\n\n$2")
        .replace(/([.?!]) (The \*\*[^*\n]+\*\* .*?\bis also\b)/g, "$1\n\n$2")
        .replace(/([.?!]) ((?:Which|Would|Do|Are|Is|Any) [^?.!]*\?)$/g, "$1\n\n$2");

  return withSuggestedBreaks
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function renderFormattedMessage(text = "") {
  const blocks = normalizeMessageBlocks(text);

  return blocks.map((block, index) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const isBulletList =
      lines.length > 0 &&
      lines.every((line) => /^([-*•]|\d+\.)\s+/.test(line));

    if (isBulletList) {
      return (
        <ul key={`list-${index}`}>
          {lines.map((line, itemIndex) => (
            <li key={`item-${index}-${itemIndex}`}>
              {renderInlineMessage(line.replace(/^([-*•]|\d+\.)\s+/, ""))}
            </li>
          ))}
        </ul>
      );
    }

    return <p key={`paragraph-${index}`}>{renderInlineMessage(block)}</p>;
  });
}

function App() {
  const [siteLocale, setSiteLocale] = useState(() => readStorage(STORAGE_KEYS.locale, "en"));
  const [route, setRoute] = useState(() => parseRoute(window.location.pathname));
  const [heroIndex, setHeroIndex] = useState(0);
  const [widgetOpen, setWidgetOpen] = useState(() => readStorage(STORAGE_KEYS.widgetOpen, false));
  const [widgetView, setWidgetView] = useState(() => readStorage(STORAGE_KEYS.widgetView, "home"));
  const [bootstrapData, setBootstrapData] = useState(null);
  const [messages, setMessages] = useState(() => readStorage(STORAGE_KEYS.messages, []));
  const [sessionId, setSessionId] = useState(() => readStorage(STORAGE_KEYS.sessionId, crypto.randomUUID()));
  const [draft, setDraft] = useState(() => readStorage(STORAGE_KEYS.draft, ""));
  const [cartItems, setCartItems] = useState(() => readStorage(STORAGE_KEYS.cart, []));
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [orderList, setOrderList] = useState(() => readStorage(STORAGE_KEYS.orders, []));
  const [ordersLoaded, setOrdersLoaded] = useState(true);
  const [checkoutNotice, setCheckoutNotice] = useState(() => readStorage(STORAGE_KEYS.checkoutNotice, null));
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [toastNotice, setToastNotice] = useState(null);
  const [queuedPrompt, setQueuedPrompt] = useState(() => readStorage(STORAGE_KEYS.queuedPrompt, ""));
  const [customerProfile, setCustomerProfile] = useState(() => {
    const saved = readStorage(STORAGE_KEYS.profile, {});
    const hasIdentity = hasSavedIdentity(saved);

    return {
      name: saved?.name ?? "",
      email: saved?.email ?? "",
      phone: saved?.phone ?? "",
      customerNumber: saved?.customerNumber ?? "",
      newsletter: Boolean(saved?.newsletter),
      submitted: Boolean(saved?.submitted ?? hasIdentity)
    };
  });
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const inputRef = useRef(null);
  const autoOpenedRef = useRef(false);
  const content = localized[siteLocale];
  const catalog = products.map((product) => localizeProduct(product, siteLocale));
  const selectedProduct = selectedProductId ? catalog.find((product) => product.id === selectedProductId) ?? null : null;
  const matchedProfileOrders = customerProfile.submitted && hasSavedIdentity(customerProfile)
    ? orderList.filter((order) => matchesOrderToProfile(order, customerProfile))
    : [];
  const visibleOrderSource = matchedProfileOrders.length > 0 ? matchedProfileOrders : orderList;
  const selectedOrderSource = route.orderNumber
    ? orderList.find((order) => order.orderNumber === route.orderNumber) ?? null
    : null;
  const selectedOrder = selectedOrderSource ? localizeOrder(selectedOrderSource, siteLocale) : null;
  const visibleOrders = visibleOrderSource.map((order) => localizeOrder(order, siteLocale));
  const categoryCards = buildCategoryCards(siteLocale);
  const policyCards = buildPolicyCards(siteLocale);
  const cartDetailedItems = cartItems
    .map((entry) => {
      const product = catalog.find((item) => item.id === entry.productId);
      return product ? { ...entry, product, lineTotal: product.priceSar * entry.quantity } : null;
    })
    .filter(Boolean);
  const cartSubtotal = cartDetailedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const cartTax = cartDetailedItems.reduce((sum, item) => sum + (item.product.taxSar ?? 0) * item.quantity, 0);
  const cartTotal = cartSubtotal;
  const cooldownRemainingMs = Math.max(0, cooldownUntil - clockNow);
  const composerLocked = loading || cooldownRemainingMs > 0;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % localized.en.heroSlides.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    function syncRouteFromLocation() {
      setRoute(parseRoute(window.location.pathname));
    }

    window.addEventListener("popstate", syncRouteFromLocation);
    return () => window.removeEventListener("popstate", syncRouteFromLocation);
  }, []);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.profile, customerProfile);
  }, [customerProfile]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.messages, messages);
  }, [messages]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.sessionId, sessionId);
  }, [sessionId]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.locale, siteLocale);
  }, [siteLocale]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.widgetOpen, widgetOpen);
  }, [widgetOpen]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.widgetView, widgetView);
  }, [widgetView]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.draft, draft);
  }, [draft]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.queuedPrompt, queuedPrompt);
  }, [queuedPrompt]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.checkoutNotice, checkoutNotice);
  }, [checkoutNotice]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.orders, orderList);
  }, [orderList]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.cart, cartItems);
  }, [cartItems]);

  useEffect(() => {
    async function loadBootstrap() {
      const response = await fetch(`/api/bootstrap?locale=${siteLocale}`);
      const data = await response.json();
      setBootstrapData(data);
      setMessages((current) =>
        current.length > 0
          ? current
          : [
              createChatMessage("bot", data.welcome)
            ]
      );
    }

    loadBootstrap();
  }, [siteLocale]);

  useEffect(() => {
    document.documentElement.lang = siteLocale;
    document.documentElement.dir = content.dir;
  }, [content.dir, siteLocale]);

  useEffect(() => {
    if (autoOpenedRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      autoOpenedRef.current = true;
      setWidgetOpen(true);
      setWidgetView("home");
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (widgetOpen && widgetView === "chat" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [widgetOpen, widgetView]);

  useEffect(() => {
    setHeroIndex(0);
  }, [siteLocale]);

  useEffect(() => {
    if (!toastNotice) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setToastNotice(null);
    }, 2800);

    return () => window.clearTimeout(timeoutId);
  }, [toastNotice]);

  useEffect(() => {
    if (cooldownUntil <= Date.now()) {
      if (cooldownUntil !== 0) {
        setClockNow(Date.now());
      }
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setClockNow(Date.now());
    }, 200);

    return () => window.clearInterval(intervalId);
  }, [cooldownUntil]);

  useEffect(() => {
    const shouldLockScroll =
      cartOpen ||
      selectedProductId !== null ||
      showAnalytics ||
      (widgetOpen && window.matchMedia("(max-width: 920px)").matches);

    if (!shouldLockScroll) {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyTouchAction = document.body.style.touchAction;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.touchAction = previousBodyTouchAction;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [cartOpen, selectedProductId, showAnalytics, widgetOpen]);

  const currentSlide = content.heroSlides[heroIndex];

  function showToast(message) {
    setToastNotice({
      id: crypto.randomUUID(),
      message
    });
  }

  async function sendMessage(nextMessage, options = {}) {
    const { repeatUserBubble = true } = options;
    const trimmedMessage = nextMessage.trim();
    if (!trimmedMessage || loading) {
      return;
    }

    const currentTime = Date.now();
    if (currentTime < cooldownUntil) {
      setClockNow(currentTime);
      return;
    }

    setLoading(true);
    setCooldownUntil(currentTime + MESSAGE_COOLDOWN_MS);
    setClockNow(currentTime);
    setMessages((current) => {
      const retryableTurn = findRetryableTurn(current, trimmedMessage);
      const withoutFailedReply = retryableTurn
        ? current.filter((message) => message.id !== retryableTurn.failedReplyId)
        : current;

      if (!repeatUserBubble || retryableTurn) {
        return withoutFailedReply;
      }

      return [...withoutFailedReply, createChatMessage("user", trimmedMessage)];
    });
    setDraft("");
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), CHAT_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        signal: controller.signal,
        body: JSON.stringify({
          sessionId,
          message: trimmedMessage,
          preferredLocale: siteLocale,
          knownOrders: visibleOrderSource,
          conversationHistory: buildConversationHistory(messages),
          customerProfile: customerProfile.submitted
            ? {
                name: customerProfile.name,
                email: customerProfile.email,
                phone: customerProfile.phone,
                customerNumber: customerProfile.customerNumber,
                newsletter: customerProfile.newsletter
              }
            : null
        })
      });

      const data = await response.json().catch(() => ({}));

      if (data.sessionId) {
        setSessionId(data.sessionId);
      }

      if (!response.ok) {
        const inlineReply = typeof data.reply === "string" && data.reply.trim()
          ? data.reply
          : buildClientErrorReply(content.widget, null, response.status);
        const retryAfterMs = Number(data.meta?.retryAfterMs) || 0;
        if (retryAfterMs > 0) {
          setCooldownUntil(Date.now() + retryAfterMs);
          setClockNow(Date.now());
        }
        setMessages((current) => [
          ...current,
          createChatMessage("bot", inlineReply, {
            kind: "error",
            retryable: true,
            retryText: trimmedMessage,
            retryAfterMs
          })
        ]);
        return;
      }

      if (typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("Missing chat reply");
      }

      const isTemporaryFailure = data.structured?.resolution === "temporary_failure";

      setMessages((current) => [
        ...current,
        createChatMessage("bot", data.reply, {
          kind: isTemporaryFailure ? "error" : "standard",
          retryable: isTemporaryFailure,
          retryText: isTemporaryFailure ? trimmedMessage : ""
        })
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        createChatMessage("bot", buildClientErrorReply(content.widget, error), {
          kind: "error",
          retryable: true,
          retryText: trimmedMessage
        })
      ]);
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  async function openAnalytics() {
    const response = await fetch("/api/analytics");
    const data = await response.json();

    if (!response.ok) {
      showToast(data.error ?? "Support analytics are unavailable right now.");
      return;
    }

    setAnalytics(data.events);
    setAnalyticsSummary(data.summary ?? null);
    setShowAnalytics(true);
  }

  function openChatWith(prompt = "") {
    setWidgetOpen(true);
    if (prompt) {
      setQueuedPrompt(prompt);
      setDraft(prompt);
    }
    setWidgetView(customerProfile.submitted ? "chat" : "home");
  }

  function primeSupportPrompt(prompt) {
    if (!prompt.trim()) {
      return;
    }

    setWidgetOpen(true);
    setQueuedPrompt(prompt);
    setDraft(prompt);
    setWidgetView(customerProfile.submitted ? "chat" : "home");
  }

  function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function navigateTo(pathname, options = {}) {
    const { replace = false } = options;

    if (window.location.pathname !== pathname) {
      window.history[replace ? "replaceState" : "pushState"]({}, "", pathname);
    }

    setRoute(parseRoute(pathname));
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function addToCart(productId, options = {}) {
    const { closeDetails = false, openCart = false } = options;
    const product = catalog.find((item) => item.id === productId);
    if (!product) {
      return;
    }

    setCartItems((current) => {
      const existing = current.find((item) => item.productId === productId);
      if (existing) {
        return current.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...current, { productId, quantity: 1 }];
    });
    if (closeDetails) {
      setSelectedProductId(null);
    }
    if (openCart) {
      setCartOpen(true);
    }
    showToast(
      localizeText(
        siteLocale,
        `${product.displayName} added to cart.`,
        `تمت إضافة ${product.displayName} إلى السلة.`
      )
    );
  }

  function updateCartQuantity(productId, change) {
    setCartItems((current) =>
      current
        .map((item) => (item.productId === productId ? { ...item, quantity: item.quantity + change } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  function clearCart() {
    setCartItems([]);
    setCheckoutError("");
  }

  async function createDemoOrder() {
    if (!cartItems.length || checkoutLoading) {
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          customerName: customerProfile.name || (siteLocale === "ar" ? "متسوق تجريبي" : "Demo shopper"),
          email: customerProfile.email || "shopper@example.com",
          phone: customerProfile.phone || null,
          customerNumber: customerProfile.customerNumber || null,
          items: cartItems,
          locale: siteLocale
        })
      });

      const data = await response.json();

      if (!response.ok || !data.order?.orderNumber) {
        throw new Error(data.error || "Failed to create order");
      }

      if (data.sessionId) {
        setSessionId(data.sessionId);
      }
      setOrderList((current) => mergeOrdersByNumber([data.order], current));
      setCartItems([]);
      setCartOpen(false);
      setCheckoutNotice(data.order.orderNumber);
      setMessages((current) => [
        ...current,
        createChatMessage(
          "bot",
          fillTemplate(content.widget.orderCreatedFollowUp, {
            orderNumber: data.order.orderNumber
          })
        )
      ]);
      showToast(
        localizeText(
          siteLocale,
          `Demo order ${data.order.orderNumber} created successfully.`,
          `تم إنشاء الطلب التجريبي ${data.order.orderNumber} بنجاح.`
        )
      );
      navigateTo(`/orders/${data.order.orderNumber}`);
    } catch (error) {
      setCheckoutError(content.sections.orderCreateFailed);
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function submitLeadProfile(profile) {
    const nextProfile = {
      ...profile,
      phone: normalizePhone(profile.phone),
      customerNumber: normalizeCustomerNumber(profile.customerNumber),
      submitted: true
    };
    setCustomerProfile(nextProfile);
    setWidgetOpen(true);
    setWidgetView("chat");
    const introMessage = createChatMessage("bot", fillTemplate(content.widget.afterIntro, { name: profile.name }));
    setMessages((current) => [
      ...current,
      introMessage
    ]);

    if (queuedPrompt.trim()) {
      const prompt = queuedPrompt;
      setQueuedPrompt("");
      setDraft("");
      await sendMessage(prompt);
    }
  }

  function resetConversation() {
    setSessionId(crypto.randomUUID());
    setMessages(
      bootstrapData
        ? [
            createChatMessage(
              "bot",
              customerProfile.submitted
                ? fillTemplate(content.widget.afterIntro, { name: customerProfile.name })
                : bootstrapData.welcome
            )
          ]
        : []
    );
    setDraft("");
    setQueuedPrompt("");
    setWidgetOpen(true);
    setWidgetView(customerProfile.submitted ? "chat" : "home");
  }

  return (
    <div className="app-shell">
      <StoreHeader
        locale={siteLocale}
        brand={content.brand}
        nav={content.nav}
        onLocaleChange={setSiteLocale}
        onGoHome={() => navigateTo("/")}
        onOpenAccount={() => navigateTo("/orders")}
        onOpenCart={() => setCartOpen(true)}
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
      />
      <main className="page-main">
        {route.page === "orders" ? (
          route.orderNumber ? (
            <OrderDetailsPage
              content={content}
              locale={siteLocale}
              order={selectedOrder}
              orderNumber={route.orderNumber}
              ordersLoaded={ordersLoaded}
              onBackToOrders={() => navigateTo("/orders")}
              onBackToStore={() => navigateTo("/")}
              onOpenChat={openChatWith}
            />
          ) : (
            <AccountPage
              checkoutNotice={checkoutNotice}
              content={content}
              locale={siteLocale}
              customerProfile={customerProfile}
              onBackToStore={() => navigateTo("/")}
              onOpenChat={openChatWith}
              onOpenOrder={(orderNumber) => navigateTo(`/orders/${orderNumber}`)}
              orders={visibleOrders}
              storedOrderCount={orderList.length}
            />
          )
        ) : (
          <>
            <HeroSection
              slide={currentSlide}
              locale={siteLocale}
              onPrev={() =>
                setHeroIndex((current) => (current - 1 + content.heroSlides.length) % content.heroSlides.length)
              }
              onNext={() => setHeroIndex((current) => (current + 1) % content.heroSlides.length)}
              onOpenChat={() => openChatWith()}
              onShopNow={() => scrollToSection("featured")}
            />

            <section className="section-frame category-frame">
              <div className="section-title-row">
                <h2>{content.sections.categories}</h2>
              </div>
              <div className="category-grid">
                {categoryCards.map((category) => (
                  <article className="category-card" key={category.key}>
                    <span className="category-icon">{category.icon}</span>
                    <strong>{category.label}</strong>
                    <span className="category-count">{category.count}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="section-frame support-hero">
              <div className="support-copy">
                <p className="section-kicker">{content.supportKicker}</p>
                <h2>{content.supportTitle}</h2>
                <p>{content.supportBody}</p>
                <div className="support-points">
                  {content.supportPoints.map((point) => (
                    <span key={point}>{point}</span>
                  ))}
                </div>
                <button className="primary-cta" type="button" onClick={() => openChatWith()}>
                  {content.supportPrimary}
                </button>
              </div>

              <div className="support-card">
                {content.supportStats.map((stat) => (
                  <div className="support-stat" key={stat.value}>
                    <strong>{stat.value}</strong>
                    <span>{stat.text}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="section-frame product-frame" id="featured">
              <div className="section-title-row">
                <h2>{content.sections.topSelling}</h2>
                <button className="ghost-link" type="button" onClick={() => openChatWith(siteLocale === "ar" ? "أحتاج مساعدة لاختيار منتج" : "I need help choosing a product")}>
                  {content.sections.askBeforeBuy}
                </button>
              </div>
              <div className="product-grid">
                {catalog.map((card) => (
                  <ProductCard
                    key={card.id}
                    askLabel={content.sections.askSupport}
                    cartLabel={content.sections.addToCart}
                    detailsLabel={content.sections.viewDetails}
                    card={card}
                    locale={siteLocale}
                    quantityLabel={content.sections.quantity}
                    onAsk={() => openChatWith(buildProductPrompt(card, siteLocale))}
                    onAddToCart={() => addToCart(card.id)}
                    onViewDetails={() => setSelectedProductId(card.id)}
                  />
                ))}
              </div>
            </section>

            <section className="section-frame feature-frame" id="support">
              <div className="section-title-row">
                <h2>{content.sections.storeFeatures}</h2>
                <button className="ghost-link" type="button" onClick={openAnalytics}>
                  {content.sections.analytics}
                </button>
              </div>
              <div className="feature-grid">
                {content.featureCards.map((feature) => (
                  <article className="feature-card" key={feature.title}>
                    <div className="feature-icon">✦</div>
                    <strong>{feature.title}</strong>
                    <p>{feature.description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="section-frame testimonial-frame" id="assurance">
              <div className="section-title-row">
                <h2>{content.sections.testimonials}</h2>
              </div>
              <div className="testimonial-grid">
                {content.testimonials.map((item) => (
                  <article className="testimonial-card" key={item.name}>
                    <div className="quote-mark">❝</div>
                    <p>{item.quote}</p>
                    <span className="stars">{item.stars}</span>
                    <strong>{item.name}</strong>
                  </article>
                ))}
              </div>
            </section>

            <section className="section-frame policy-frame" id="policies">
              <div className="section-title-row">
                <h2>{content.sections.policies}</h2>
              </div>
              <div className="policy-grid">
                {policyCards.map((policy) => (
                  <article className="policy-card" key={policy.key} id={policy.anchor}>
                    <div className="policy-card-head">
                      <strong>{policy.title}</strong>
                      <span>{policy.updated}</span>
                    </div>
                    <ul>
                      {policy.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
              <div className="policy-contact-card">
                <strong>{content.sections.contact}</strong>
                <p>
                  {siteLocale === "ar"
                    ? `للاستفسارات القانونية أو المتعلقة بالخصوصية أو الطلبات: ${storePolicies.contact.email}`
                    : `For legal, privacy, or order questions: ${storePolicies.contact.email}`}
                </p>
                <span>{storePolicies.contact.contactUrl}</span>
              </div>
            </section>

            <FooterSection content={content} />
          </>
        )}
      </main>

      <SupportTeaser
        label={content.widget.chatTitle}
        locale={siteLocale}
        open={widgetOpen}
        onOpen={() => setWidgetOpen(true)}
      />

      {cartOpen ? (
        <CartDrawer
          cartItems={cartDetailedItems}
          content={content}
          locale={siteLocale}
          onCheckout={createDemoOrder}
          onClose={() => setCartOpen(false)}
          onDecrease={(productId) => updateCartQuantity(productId, -1)}
          onIncrease={(productId) => updateCartQuantity(productId, 1)}
          onClear={clearCart}
          subtotal={formatCurrency(siteLocale, cartSubtotal - cartTax)}
          tax={formatCurrency(siteLocale, cartTax)}
          total={formatCurrency(siteLocale, cartTotal)}
          checkoutLoading={checkoutLoading}
          checkoutError={checkoutError}
        />
      ) : null}

      {selectedProduct ? (
        <ProductDetailsModal
          content={content}
          locale={siteLocale}
          onAddToCart={() => addToCart(selectedProduct.id, { closeDetails: true })}
          onAsk={() => {
            setSelectedProductId(null);
            openChatWith(buildProductPrompt(selectedProduct, siteLocale));
          }}
          onClose={() => setSelectedProductId(null)}
          product={selectedProduct}
        />
      ) : null}

      <SupportWidget
        bootstrapData={bootstrapData}
        cooldownRemainingMs={cooldownRemainingMs}
        draft={draft}
        locale={siteLocale}
        loading={loading}
        messages={messages}
        customerProfile={customerProfile}
        onChangeDraft={setDraft}
        onClose={() => setWidgetOpen(false)}
        onPrimePrompt={primeSupportPrompt}
        onProfileSubmit={submitLeadProfile}
        onRetryMessage={(message) => sendMessage(message, { repeatUserBubble: false })}
        onResetConversation={resetConversation}
        onSend={sendMessage}
        onSetView={setWidgetView}
        open={widgetOpen}
        text={content.widget}
        view={widgetView}
        inputRef={inputRef}
      />

      {toastNotice ? <ToastNotice key={toastNotice.id} message={toastNotice.message} /> : null}

      {showAnalytics ? (
        <div className="modal-shell" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{content.sections.analyticsTitle}</h3>
              <button type="button" className="icon-circle" onClick={() => setShowAnalytics(false)}>
                ×
              </button>
            </div>
            {analyticsSummary ? (
              <div className="analytics-summary-grid">
                <article className="analytics-summary-card">
                  <span>{content.sections.analyticsSummaryTitle}</span>
                  <strong>{analyticsSummary.totalTurns}</strong>
                </article>
                <article className="analytics-summary-card">
                  <span>{localizeText(siteLocale, "Contained", "تم الاحتواء")}</span>
                  <strong>{analyticsSummary.containedTurns}</strong>
                </article>
                <article className="analytics-summary-card">
                  <span>{localizeText(siteLocale, "Pre-purchase", "قبل الشراء")}</span>
                  <strong>{analyticsSummary.prePurchaseTurns}</strong>
                </article>
                <article className="analytics-summary-card">
                  <span>{localizeText(siteLocale, "Post-purchase", "بعد الشراء")}</span>
                  <strong>{analyticsSummary.postPurchaseTurns}</strong>
                </article>
                <article className="analytics-summary-card">
                  <span>{localizeText(siteLocale, "Account support", "دعم الحساب")}</span>
                  <strong>{analyticsSummary.accountSupportTurns}</strong>
                </article>
                <article className="analytics-summary-card">
                  <span>{localizeText(siteLocale, "Human handoff", "التحويل البشري")}</span>
                  <strong>{analyticsSummary.handoffTurns}</strong>
                </article>
              </div>
            ) : null}
            <pre>{JSON.stringify(analytics ?? [], null, 2)}</pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StoreHeader({ brand, cartCount, locale, nav, onGoHome, onLocaleChange, onOpenAccount, onOpenCart }) {
  return (
    <header className="store-header">
      <div className="store-header-inner">
        <div className="header-icons">
          <div className="locale-toggle">
            <button
              type="button"
              className={locale === "en" ? "active" : ""}
              onClick={() => onLocaleChange("en")}
            >
              EN
            </button>
            <button
              type="button"
              className={locale === "ar" ? "active" : ""}
              onClick={() => onLocaleChange("ar")}
            >
              AR
            </button>
          </div>
          <IconButton label="cart" onClick={onOpenCart}>
            <CartIcon />
            {cartCount > 0 ? <span className="header-badge">{cartCount}</span> : null}
          </IconButton>
          <IconButton label="account" onClick={onOpenAccount}>
            <UserIcon />
          </IconButton>
        </div>

        <nav className="store-nav" aria-label="Primary">
          {nav.map((item) => (
            <a href="/#featured" key={item}>
              {item}
            </a>
          ))}
        </nav>

        <button type="button" className="store-brand" onClick={onGoHome}>
          <div className="brand-logo">LS</div>
          <div>
            <strong>{brand.title}</strong>
            <span>{brand.subtitle}</span>
          </div>
        </button>
      </div>
    </header>
  );
}

function HeroSection({ slide, onPrev, onNext, onOpenChat, onShopNow }) {
  return (
    <section className={`hero-banner ${slide.theme}`}>
      <div className="hero-arrow-group">
        <button className="hero-arrow prev" type="button" onClick={onPrev} aria-label="Previous slide">
          <ArrowIcon direction="left" />
        </button>
        <button className="hero-arrow next" type="button" onClick={onNext} aria-label="Next slide">
          <ArrowIcon direction="right" />
        </button>
      </div>

      <div className="hero-content">
        <div className="hero-copy">
          <p className="section-kicker">{slide.eyebrow}</p>
          <h1>{slide.title}</h1>
          <p>{slide.subtitle}</p>
          <div className="hero-actions">
            <button className="primary-cta" type="button" onClick={onShopNow}>
              {slide.cta}
            </button>
            <button className="secondary-cta" type="button" onClick={() => onOpenChat()}>
              {slide.supportCta}
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="device-card large">
            <span>{slide.visualTitle}</span>
          </div>
          <div className="device-card small">
            <span>{slide.visualNote}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductCard({ askLabel, card, cartLabel, detailsLabel, locale, onAddToCart, onAsk, onViewDetails, quantityLabel }) {
  return (
    <article className="product-card">
      <div className={`product-media ${card.accent}`}>
        <div className="product-stock-chip">{card.stockLabel}</div>
      </div>
      <div className="product-card-body">
        <strong>{card.title}</strong>
        <p>{card.subtitle}</p>
        <div className="price-row">
          <span>{card.price}</span>
          <button className="text-action" type="button" onClick={onAsk}>
            {askLabel}
          </button>
        </div>
        <div className="product-meta-row">
          <span>{card.category}</span>
          <span>
            {quantityLabel}: {card.size}
          </span>
        </div>
        <div className="product-card-actions">
          <button className="secondary-cta compact" type="button" onClick={onViewDetails}>
            {detailsLabel}
          </button>
          <button className="cart-cta" type="button" onClick={onAddToCart}>
            {cartLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

function AccountPage({
  checkoutNotice,
  content,
  customerProfile,
  locale,
  onBackToStore,
  onOpenChat,
  onOpenOrder,
  orders,
  storedOrderCount
}) {
  const hasProfile = customerProfile.submitted && hasSavedIdentity(customerProfile);

  return (
    <section className="account-page">
      <div className="section-frame account-hero">
        <div className="account-hero-copy">
          <p className="section-kicker">{localizeText(locale, "Your account", "حسابك")}</p>
          <h2>{localizeText(locale, "Track every order in one place", "تابع كل طلباتك من مكان واحد")}</h2>
          <p>
            {hasProfile
              ? localizeText(
                  locale,
                  "Your saved profile and recent orders live in this browser session, so you can refresh and continue from the same account view without re-entering them.",
                  "نحفظ ملفك وطلباتك الأخيرة داخل جلسة المتصفح الحالية حتى تتمكن من التحديث والمتابعة بدون إعادة إدخال البيانات."
                )
              : localizeText(
                  locale,
                  "Complete your support profile once in chat, then your future orders will appear here automatically.",
                  "أكمل بياناتك مرة واحدة داخل المحادثة، وبعدها ستظهر طلباتك هنا تلقائيًا خلال نفس جلسة المتصفح."
                )}
          </p>
          <div className="account-hero-actions">
            <button className="primary-cta" type="button" onClick={onBackToStore}>
              {localizeText(locale, "Continue shopping", "متابعة التسوق")}
            </button>
            <button className="secondary-cta" type="button" onClick={() => onOpenChat()}>
              {localizeText(locale, "Open support", "فتح الدعم")}
            </button>
          </div>
          {checkoutNotice ? (
            <div className="account-notice">
              <strong>{localizeText(locale, "Latest order", "آخر طلب")}</strong>
              <span>{checkoutNotice}</span>
            </div>
          ) : null}
        </div>

        <div className="account-profile-card">
          <strong>{localizeText(locale, "Saved shopper profile", "الملف المحفوظ")}</strong>
          <div className="account-profile-grid">
            <div>
              <span>{localizeText(locale, "Name", "الاسم")}</span>
              <strong>{customerProfile.name || localizeText(locale, "Not set yet", "غير مضاف بعد")}</strong>
            </div>
            <div>
              <span>{localizeText(locale, "Email", "البريد الإلكتروني")}</span>
              <strong>{customerProfile.email || localizeText(locale, "Not set yet", "غير مضاف بعد")}</strong>
            </div>
            <div>
              <span>{localizeText(locale, "Phone", "رقم الجوال")}</span>
              <strong>{customerProfile.phone || localizeText(locale, "Not set yet", "غير مضاف بعد")}</strong>
            </div>
            <div>
              <span>{localizeText(locale, "Customer number", "رقم العميل")}</span>
              <strong>{customerProfile.customerNumber || localizeText(locale, "Not set yet", "غير مضاف بعد")}</strong>
            </div>
            <div>
              <span>{localizeText(locale, "Newsletter", "النشرة البريدية")}</span>
              <strong>{customerProfile.newsletter ? localizeText(locale, "Subscribed", "مشترك") : localizeText(locale, "Not subscribed", "غير مشترك")}</strong>
            </div>
            <div>
              <span>{localizeText(locale, "Orders stored", "الطلبات المحفوظة")}</span>
              <strong>{storedOrderCount}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="section-frame account-orders-frame">
        <div className="section-title-row">
          <h2>{localizeText(locale, "My orders", "طلباتي")}</h2>
        </div>

        {!hasProfile && orders.length > 0 ? (
          <div className="account-inline-note">
            <strong>{localizeText(locale, "Saved session orders", "تم حفظ طلبات الجلسة")}</strong>
            <p>
              {localizeText(
                locale,
                "These orders were created in this browser session. Add your support details anytime to link future orders to your shopper profile too.",
                "تم إنشاء هذه الطلبات داخل جلسة المتصفح الحالية. يمكنك إضافة بياناتك لاحقًا لربط الطلبات القادمة بملفك الشخصي أيضًا."
              )}
            </p>
          </div>
        ) : null}

        {orders.length === 0 ? (
          <div className="account-empty-state">
            <strong>
              {hasProfile
                ? localizeText(locale, "No orders yet", "لا توجد طلبات بعد")
                : localizeText(locale, "Add your details once to unlock order tracking", "أضف بياناتك مرة واحدة لتفعيل متابعة الطلبات")}
            </strong>
            <p>
              {hasProfile
                ? localizeText(
                    locale,
                    "Create an order from the cart and it will appear here with its latest status.",
                    "أنشئ طلبًا من السلة وسيظهر هنا مع أحدث حالة له."
                  )
                : localizeText(
                    locale,
                    "Open the support widget, introduce yourself, and future orders will be attached to your saved account.",
                    "افتح نافذة الدعم وعرّف بنفسك، وبعدها سيتم ربط الطلبات القادمة بحسابك المحفوظ."
                  )}
            </p>
          </div>
        ) : (
          <div className="order-grid">
            {orders.map((order) => (
              <article className="order-card" key={order.orderNumber}>
                <div className="order-card-head">
                  <strong>{order.orderNumber}</strong>
                  <span>{order.displayStatus}</span>
                </div>
                <p>
                  {content.sections.orderItems}:{" "}
                  {order.items.map((item) => `${item.quantity}× ${item.name}`).join(locale === "ar" ? "، " : ", ")}
                </p>
                <p>
                  {content.sections.total}: {order.displayTotal}
                </p>
                <div className="order-card-actions">
                  <button
                    className="secondary-cta"
                    type="button"
                    onClick={() =>
                      onOpenChat(
                        locale === "ar"
                          ? `أين طلبي ${order.orderNumber}؟`
                          : `Where is my order ${order.orderNumber}?`
                      )
                    }
                  >
                    {content.sections.trackInChat}
                  </button>
                  <button className="ghost-link" type="button" onClick={() => onOpenOrder(order.orderNumber)}>
                    {content.sections.orderDetails}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function OrderDetailsPage({ content, locale, onBackToOrders, onBackToStore, onOpenChat, order, orderNumber, ordersLoaded }) {
  if (!ordersLoaded && !order) {
    return (
      <section className="account-page order-page">
        <div className="section-frame account-empty-state">
          <strong>{localizeText(locale, "Loading order details...", "جاري تحميل تفاصيل الطلب...")}</strong>
        </div>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="account-page order-page">
        <div className="section-frame account-empty-state">
          <strong>{localizeText(locale, "Order not found", "الطلب غير موجود")}</strong>
          <p>
            {localizeText(
              locale,
              `We couldn't find ${orderNumber} in the saved orders on this device.`,
              `لم نتمكن من العثور على ${orderNumber} ضمن الطلبات المحفوظة على هذا الجهاز.`
            )}
          </p>
          <div className="account-hero-actions">
            <button className="primary-cta" type="button" onClick={onBackToOrders}>
              {localizeText(locale, "Back to orders", "العودة إلى الطلبات")}
            </button>
            <button className="secondary-cta" type="button" onClick={onBackToStore}>
              {localizeText(locale, "Continue shopping", "متابعة التسوق")}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="account-page order-page">
      <div className="section-frame order-page-hero">
        <div className="account-hero-copy">
          <p className="section-kicker">{localizeText(locale, "Order details", "تفاصيل الطلب")}</p>
          <h2>{order.orderNumber}</h2>
          <p>
            {localizeText(
              locale,
              `Track the full status, delivery estimate, and items for ${order.orderNumber} from this page.`,
              `تابع الحالة الكاملة وموعد التوصيل والمنتجات الخاصة بالطلب ${order.orderNumber} من هذه الصفحة.`
            )}
          </p>
          <div className="account-hero-actions">
            <button className="primary-cta" type="button" onClick={onBackToOrders}>
              {localizeText(locale, "Back to orders", "العودة إلى الطلبات")}
            </button>
            <button
              className="secondary-cta"
              type="button"
              onClick={() =>
                onOpenChat(
                  locale === "ar"
                    ? `أين طلبي ${order.orderNumber}؟`
                    : `Where is my order ${order.orderNumber}?`
                )
              }
            >
              {content.sections.trackInChat}
            </button>
          </div>
        </div>

        <div className="account-profile-card">
          <strong>{localizeText(locale, "Delivery summary", "ملخص التوصيل")}</strong>
          <div className="account-profile-grid">
            <div>
              <span>{content.sections.orderStatus}</span>
              <strong>{order.displayStatus}</strong>
            </div>
            <div>
              <span>{content.sections.total}</span>
              <strong>{order.displayTotal}</strong>
            </div>
            <div>
              <span>ETA</span>
              <strong>{order.displayEta}</strong>
            </div>
            <div>
              <span>Courier</span>
              <strong>{order.displayCourier}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="section-frame order-page-content">
        <div className="order-detail-items">
          {order.items.map((item) => (
            <article className="order-detail-item" key={`${order.orderNumber}-${item.productId}`}>
              <strong>{item.name}</strong>
              <span>
                {content.sections.quantity}: {item.quantity}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FooterSection({ content }) {
  return (
    <footer className="footer-shell">
      <div className="footer-col">
        <h3>{content.sections.footerLinks}</h3>
        <a href="#featured">{content.footer.about}</a>
        <a href="#terms-policy">{content.footer.terms}</a>
        <a href="#returns-policy">{content.footer.returns}</a>
        <a href="#privacy-policy">{content.footer.privacy}</a>
      </div>
      <div className="footer-col">
        <h3>{content.sections.contact}</h3>
        <div className="footer-socials">
          <span>✉</span>
          <span>◔</span>
          <span>🟢</span>
        </div>
        <p>{content.footer.storeBlurb}</p>
      </div>
      <div className="footer-col brand">
        <div className="footer-logo">LS</div>
        <p>{content.brand.title}</p>
        <span>{content.brand.subtitle}</span>
      </div>
    </footer>
  );
}

function SupportTeaser({ label, locale, open, onOpen }) {
  return (
    <div className={`support-teaser ${open ? "support-teaser-open" : ""}`}>
      {!open ? (
        <>
          <button className="support-pill" type="button" onClick={onOpen}>
            <span className="support-pill-spark">✦</span>
            <span className="support-pill-copy">
              <strong>{label}</strong>
              <span>{localizeText(locale, "Instant product and order help", "دعم فوري للمنتجات والطلبات")}</span>
            </span>
          </button>
          <button className="support-bubble" type="button" onClick={onOpen} aria-label="chat with us">
            <ChatIcon />
          </button>
        </>
      ) : null}
    </div>
  );
}

function CartDrawer({
  cartItems,
  content,
  locale,
  onCheckout,
  onClose,
  onDecrease,
  onIncrease,
  onClear,
  subtotal,
  tax,
  total,
  checkoutLoading,
  checkoutError
}) {
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const savings = cartItems.reduce(
    (sum, item) => sum + Math.max(0, (item.product.basePriceSar - item.product.priceSar) * item.quantity),
    0
  );

  return (
    <div className="modal-shell" role="dialog" aria-modal="true">
      <div className="modal-card cart-drawer">
        <div className="modal-header">
          <div className="cart-header-copy">
            <h3>{content.sections.cartSummary}</h3>
            <span>
              {locale === "ar"
                ? `${itemCount} ${itemCount === 1 ? "منتج" : "منتجات"} في السلة`
                : `${itemCount} ${itemCount === 1 ? "item" : "items"} in cart`}
            </span>
          </div>
          <button type="button" className="icon-circle" onClick={onClose}>
            ×
          </button>
        </div>

        {cartItems.length === 0 ? <p className="empty-state">{content.sections.cartEmpty}</p> : (
          <div className="cart-layout">
            <div className="cart-list-panel">
              <div className="cart-badges">
                <span>{locale === "ar" ? "دفع آمن" : "Secure checkout"}</span>
                <span>{locale === "ar" ? "سجل طلب فوري" : "Instant order record"}</span>
                <span>{locale === "ar" ? "دعم عبر الشات" : "Support-linked cart"}</span>
              </div>

              <div className="cart-list">
                {cartItems.map((item) => (
                  <article className="cart-row" key={item.product.id}>
                    <div className={`cart-row-visual ${item.product.accent}`}>
                      <span>{item.product.sku}</span>
                    </div>
                    <div className="cart-row-copy">
                      <div className="cart-row-head">
                        <div>
                          <strong>{item.product.displayName}</strong>
                          <span>{item.product.displayCategory}</span>
                        </div>
                        <div className="cart-row-price">
                          <strong>{item.product.displayPrice}</strong>
                          <span>
                            {locale === "ar" ? "للقطعة" : "per item"}
                          </span>
                        </div>
                      </div>
                      <p>{item.product.displayDescription}</p>
                      <div className="cart-row-meta">
                        <span>
                          {locale === "ar" ? "المقاس" : "Size"}: {item.product.displaySize}
                        </span>
                        <span>
                          {locale === "ar" ? "الألوان" : "Colors"}: {item.product.displayColors.join(locale === "ar" ? "، " : ", ")}
                        </span>
                      </div>
                      <div className="cart-row-actions">
                        <div className="cart-stepper">
                          <button type="button" onClick={() => onDecrease(item.product.id)} aria-label={locale === "ar" ? "تقليل الكمية" : "Decrease quantity"}>
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => onIncrease(item.product.id)} aria-label={locale === "ar" ? "زيادة الكمية" : "Increase quantity"}>
                            +
                          </button>
                        </div>
                        <button className="cart-remove" type="button" onClick={() => onDecrease(item.product.id)}>
                          {content.sections.remove}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <aside className="cart-summary-card">
              <div className="cart-summary-head">
                <strong>{locale === "ar" ? "ملخص الطلب" : "Order snapshot"}</strong>
                <span>
                  {locale === "ar"
                    ? "الأسعار مرتبطة مباشرة بالمنتجات الحالية"
                    : "Live totals from the current product data"}
                </span>
              </div>
              <div className="cart-totals">
                <div><span>{content.sections.subtotal}</span><strong>{subtotal}</strong></div>
                <div><span>{content.sections.tax}</span><strong>{tax}</strong></div>
                <div><span>{locale === "ar" ? "التوفير" : "Savings"}</span><strong>{formatCurrency(locale, savings)}</strong></div>
                <div className="cart-total-row"><span>{content.sections.total}</span><strong>{total}</strong></div>
              </div>
              <div className="cart-summary-note">
                <strong>{locale === "ar" ? "جاهز للدعم" : "Support ready"}</strong>
                <p>
                  {locale === "ar"
                    ? "بعد إنشاء الطلب التجريبي، يمكن متابعة حالة الطلب أو الإرجاع مباشرة من الشات."
                    : "After creating the order, the customer can immediately track it or ask for a return in chat."}
                </p>
              </div>
              <div className="cart-footer">
                <button className="ghost-link cart-clear" type="button" onClick={onClear}>
                  {content.sections.clearCart}
                </button>
                <button
                  className="primary-cta cart-checkout"
                  type="button"
                  onClick={onCheckout}
                  disabled={!cartItems.length || checkoutLoading}
                >
                  {checkoutLoading ? content.sections.creatingOrder : content.sections.placeDemoOrder}
                </button>
              </div>
              {checkoutError ? <p className="cart-error">{checkoutError}</p> : null}
            </aside>
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="cart-footer cart-footer-empty">
            <button className="primary-cta cart-checkout" type="button" onClick={onClose}>
              {locale === "ar" ? "متابعة التسوق" : "Continue shopping"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ProductDetailsModal({ content, locale, onAddToCart, onAsk, onClose, product }) {
  const savings = Math.max(0, product.basePriceSar - product.priceSar);
  const stockCopy =
    product.stockStatus === "low_stock"
      ? localizeText(locale, "Low stock", "مخزون منخفض")
      : localizeText(locale, "Ready to ship", "جاهز للشحن");
  const ratingCopy = `${product.rating.toFixed(1)} ${localizeText(locale, "rating", "تقييم")}`;
  const returnCopy = localizeText(
    locale,
    `${product.returnWindowDays}-day return policy`,
    `إرجاع خلال ${product.returnWindowDays} أيام`
  );

  return (
    <div className="modal-shell" role="dialog" aria-modal="true">
      <div className="modal-card product-modal">
        <div className="modal-header">
          <h3>{product.displayName}</h3>
          <button type="button" className="icon-circle" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="product-modal-layout">
          <div className="product-detail-stage">
            <div className={`product-detail-media ${product.accent}`}>
              <div className="product-stage-badges">
                <span>{product.sku}</span>
                <span>{stockCopy}</span>
              </div>
              <div className="product-stage-title">
                <strong>{product.displayCategory}</strong>
                <span>{product.displayName}</span>
              </div>
            </div>
            <div className="product-stage-highlights">
              <div className="product-stage-metric">
                <strong>{ratingCopy}</strong>
                <span>{localizeText(locale, "Customer signal", "إشارة رضا العملاء")}</span>
              </div>
              <div className="product-stage-metric">
                <strong>{returnCopy}</strong>
                <span>{localizeText(locale, "Policy grounded", "حسب السياسة المعتمدة")}</span>
              </div>
            </div>
          </div>

          <div className="product-detail-copy">
            <div className="product-detail-overview">
              <div>
                <span className="product-kicker">{product.displayCategory}</span>
                <p>{product.displayDescription}</p>
              </div>
              <div className="product-price-card">
                <span>{localizeText(locale, "Current price", "السعر الحالي")}</span>
                <strong>{product.displayPrice}</strong>
                <div className="product-price-meta">
                  <span>
                    {localizeText(locale, "Before", "السعر قبل")}: {formatCurrency(locale, product.basePriceSar)}
                  </span>
                  <span>
                    {localizeText(locale, "You save", "التوفير")}: {formatCurrency(locale, savings)}
                  </span>
                </div>
              </div>
            </div>

            <div className="product-detail-grid">
              <div><span>{localizeText(locale, "Category", "الفئة")}</span><strong>{product.displayCategory}</strong></div>
              <div><span>{localizeText(locale, "Size", "المقاس")}</span><strong>{product.displaySize}</strong></div>
              <div><span>{localizeText(locale, "Colors", "الألوان")}</span><strong>{product.displayColors.join(locale === "ar" ? "، " : ", ")}</strong></div>
              <div><span>{localizeText(locale, "Price", "السعر")}</span><strong>{product.displayPrice}</strong></div>
              <div><span>{localizeText(locale, "Rating", "التقييم")}</span><strong>{product.rating.toFixed(1)} / 5</strong></div>
              <div><span>{localizeText(locale, "Availability", "التوفر")}</span><strong>{stockCopy}</strong></div>
            </div>

            <div className="product-trust-row">
              <div className="product-trust-card">
                <strong>{localizeText(locale, "Support connected", "الدعم متصل")}</strong>
                <span>
                  {localizeText(
                    locale,
                    "Ask the assistant before buying or after ordering.",
                    "يمكنك سؤال المساعد قبل الشراء أو بعد إنشاء الطلب."
                  )}
                </span>
              </div>
              <div className="product-trust-card">
                <strong>{localizeText(locale, "Fast decisions", "قرار أسرع")}</strong>
                <span>
                  {localizeText(
                    locale,
                    "Pricing, stock status, and policy answers stay grounded.",
                    "السعر والمخزون والإرجاع كلها مبنية على بيانات حقيقية."
                  )}
                </span>
              </div>
            </div>

            <div className="detail-highlight-row">
              {product.displayHighlights.map((highlight) => (
                <span key={highlight}>{highlight}</span>
              ))}
            </div>
            <div className="product-detail-actions">
              <button className="secondary-cta product-ask" type="button" onClick={onAsk}>
                {content.sections.askSupport}
              </button>
              <button className="primary-cta product-add" type="button" onClick={onAddToCart}>
                {content.sections.addToCart}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SupportWidget({
  bootstrapData,
  cooldownRemainingMs,
  customerProfile,
  draft,
  inputRef,
  locale,
  loading,
  messages,
  onChangeDraft,
  onClose,
  onPrimePrompt,
  onProfileSubmit,
  onRetryMessage,
  onSend,
  onSetView,
  onResetConversation,
  open,
  text,
  view
}) {
  const prompts = locale === "ar" ? bootstrapData?.samplePromptsAr ?? [] : bootstrapData?.samplePrompts ?? [];
  const guidedPrompts = (text.quickActions ?? prompts).slice(0, 4);
  const homePromptOptions = customerProfile.submitted ? guidedPrompts.slice(0, 3) : guidedPrompts;
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadNewsletter, setLeadNewsletter] = useState(false);
  const messageListRef = useRef(null);
  const headerMenuRef = useRef(null);
  const emojiChoices = ["🙂", "👍", "🎉", "🙏", "💙", "🔥"];

  useEffect(() => {
    setLeadName(customerProfile.name ?? "");
    setLeadEmail(customerProfile.email ?? "");
    setLeadNewsletter(customerProfile.newsletter ?? false);
  }, [
    customerProfile.email,
    customerProfile.name,
    customerProfile.newsletter
  ]);

  useEffect(() => {
    if (!open) {
      setShowEmojiPicker(false);
      setShowHeaderMenu(false);
      setExpanded(false);
    }
  }, [open]);

  useEffect(() => {
    if (!showHeaderMenu) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!headerMenuRef.current?.contains(event.target)) {
        setShowHeaderMenu(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [showHeaderMenu]);

  useEffect(() => {
    if (!open || view !== "chat" || !messageListRef.current) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const list = messageListRef.current;
      if (!list) {
        return;
      }

      list.scrollTo({
        top: list.scrollHeight,
        behavior: "smooth"
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [messages, loading, open, view]);

  function handlePromptSelection(prompt) {
    onPrimePrompt(prompt);
  }

  function handleGoHome() {
    setShowHeaderMenu(false);
    onSetView("home");
  }

  function handleResetConversation() {
    setShowHeaderMenu(false);
    onResetConversation();
  }

  const capabilityPills = locale === "ar"
    ? ["اقتراحات شراء", "ربط الطلبات", "استرجاع وسياسات", "تحويل للبشر"]
    : ["Buying advice", "Order tracking", "Returns & policies", "Human handoff"];
  const composerNotice = loading
    ? text.sendingLocked
    : cooldownRemainingMs > 0
      ? fillTemplate(text.cooldownNotice, {
          seconds: Math.max(1, Math.ceil(cooldownRemainingMs / 1000))
        })
      : "";
  const supportOverview = (
    <section className="widget-home-stats" aria-label={localizeText(locale, "Support overview", "نظرة عامة على الدعم")}>
      <article className="widget-mini-stat">
        <strong>{localizeText(locale, "Fast replies", "ردود سريعة")}</strong>
        <span>{localizeText(locale, "Guided answers without leaving the product page.", "إجابات موجهة بدون الخروج من صفحة المنتج.")}</span>
      </article>
      <article className="widget-mini-stat">
        <strong>{localizeText(locale, "Order-aware", "مرتبطة بطلباتك")}</strong>
        <span>{localizeText(locale, "Saved session details help us reconnect your orders without asking again.", "بيانات الجلسة المحفوظة تساعدنا نربط الطلبات بدون أن نطلبها منك كل مرة.")}</span>
      </article>
    </section>
  );
  const leadCaptureSection = customerProfile.submitted ? (
    <div className="lead-capture-card lead-saved-card">
      <div className="widget-section-heading">
        <strong>{localizeText(locale, "You are ready to continue", "أنت جاهز للمتابعة")}</strong>
        <span>{localizeText(locale, "Your profile stays linked on this device.", "ملفك محفوظ ومربوط على هذا الجهاز.")}</span>
      </div>
      <div className="lead-summary-grid">
        <div>
          <span>{localizeText(locale, "Name", "الاسم")}</span>
          <strong>{customerProfile.name}</strong>
        </div>
        <div>
          <span>{localizeText(locale, "Email", "البريد الإلكتروني")}</span>
          <strong dir="ltr">{customerProfile.email}</strong>
        </div>
        {customerProfile.phone ? (
          <div>
            <span>{localizeText(locale, "Phone", "رقم الجوال")}</span>
            <strong dir="ltr">{customerProfile.phone}</strong>
          </div>
        ) : null}
        {customerProfile.customerNumber ? (
          <div>
            <span>{localizeText(locale, "Customer number", "رقم العميل")}</span>
            <strong dir="ltr">{customerProfile.customerNumber}</strong>
          </div>
        ) : null}
      </div>
      <p className="lead-card-note">
        {localizeText(
          locale,
          "Orders and future support chats can continue with the same browser-session identity.",
          "يمكن متابعة الطلبات والمحادثات القادمة بنفس الهوية المحفوظة داخل جلسة المتصفح."
        )}
      </p>
      <div className="lead-actions">
        <button className="lead-submit" type="button" onClick={() => onSetView("chat")}>
          {localizeText(locale, "Continue in chat", "المتابعة في المحادثة")}
        </button>
      </div>
    </div>
  ) : (
    <form
      className="lead-capture-card"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmedName = leadName.trim();
        const trimmedEmail = leadEmail.trim();

        if (!trimmedName || !trimmedEmail) {
          return;
        }

        onProfileSubmit({
          name: trimmedName,
          email: trimmedEmail,
          phone: "",
          customerNumber: "",
          newsletter: leadNewsletter
        });
      }}
    >
      <div className="widget-section-heading">
        <strong>{text.introTitle}</strong>
        <span>{localizeText(locale, "Save your name and email once for faster support and order tracking.", "احفظ اسمك وبريدك الإلكتروني مرة واحدة لتجربة دعم وتتبع أسرع.")}</span>
      </div>
      <input
        type="text"
        value={leadName}
        onChange={(event) => setLeadName(event.target.value)}
        placeholder={text.namePlaceholder}
        required
      />
      <input
        type="email"
        value={leadEmail}
        onChange={(event) => setLeadEmail(event.target.value)}
        placeholder={text.emailPlaceholder}
        required
      />
      <label className="lead-checkbox">
        <input
          type="checkbox"
          checked={leadNewsletter}
          onChange={(event) => setLeadNewsletter(event.target.checked)}
        />
        <span>{text.newsletter}</span>
      </label>
      <p className="lead-card-note">
        {localizeText(
          locale,
          "We use this browser-session profile to personalize support and reconnect this chat without asking again during the same session.",
          "نستخدم ملف جلسة المتصفح هذا لتخصيص الدعم وربط نفس المحادثة بدون إعادة السؤال خلال نفس الجلسة."
        )}
      </p>
      <div className="lead-actions">
        <button className="lead-submit" type="submit">
          {text.introSend}
        </button>
      </div>
    </form>
  );

  return (
    <aside
      className={`support-widget ${open ? "open" : ""} ${expanded ? "expanded" : ""} ${
        view === "home" ? "view-home" : "view-chat"
      }`}
      aria-label="Support widget"
    >
      <div className="widget-header">
        <div className="widget-brand">
          <div className="widget-brand-avatar">LA</div>
          <div className="widget-brand-copy">
            <strong>{view === "home" ? text.homeTitle : text.chatTitle}</strong>
            <span>{localizeText(locale, "Usually replies instantly", "يرد غالباً بشكل فوري")}</span>
          </div>
        </div>
        <div className="widget-header-end" ref={headerMenuRef}>
          <span className="widget-header-badge">{localizeText(locale, "Live support", "دعم مباشر")}</span>
          <button
            className={`widget-toolbar-button ${expanded ? "active" : ""}`}
            type="button"
            onClick={() => setExpanded((current) => !current)}
            aria-pressed={expanded}
            aria-label={expanded ? localizeText(locale, "Collapse widget", "تصغير النافذة") : localizeText(locale, "Extend widget", "توسيع النافذة")}
          >
            {expanded ? <CollapseIcon /> : <ExpandIcon />}
            <span>{expanded ? localizeText(locale, "Shrink", "تصغير") : localizeText(locale, "Extend", "توسيع")}</span>
          </button>
          <button
            className={`widget-toolbar-button ${showHeaderMenu ? "active" : ""}`}
            type="button"
            onClick={() => setShowHeaderMenu((current) => !current)}
            aria-expanded={showHeaderMenu}
            aria-label={localizeText(locale, "Open more actions", "فتح المزيد من الإجراءات")}
          >
            <MoreIcon />
            <span>{localizeText(locale, "More", "المزيد")}</span>
          </button>
          {showHeaderMenu ? (
            <div className="widget-header-menu" role="menu" aria-label={localizeText(locale, "Widget actions", "إجراءات النافذة")}>
              <button type="button" role="menuitem" onClick={handleGoHome}>
                {text.menuHome}
              </button>
              <button type="button" role="menuitem" onClick={handleResetConversation}>
                {text.menuNewChat}
              </button>
            </div>
          ) : null}
          <button className="widget-icon widget-close" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
      </div>

      {view === "home" ? (
        <div className="widget-home">
          {customerProfile.submitted ? leadCaptureSection : supportOverview}
          {!customerProfile.submitted ? leadCaptureSection : null}

          <section className={`widget-home-hero ${customerProfile.submitted ? "compact" : ""}`}>
            <span className="widget-home-eyebrow">{localizeText(locale, "Storefront support", "دعم داخل المتجر")}</span>
            <strong>{customerProfile.submitted
              ? localizeText(locale, `Welcome back, ${customerProfile.name}`, `مرحبًا بعودتك ${customerProfile.name}`)
              : text.homeHero}</strong>
            <p>{customerProfile.submitted
              ? localizeText(
                  locale,
                  "Jump back into chat, pick a quick topic, or start a fresh conversation from here.",
                  "ارجع للمحادثة مباشرة، أو اختر موضوعًا سريعًا، أو ابدأ محادثة جديدة من هنا."
                )
              : text.offlineNotice}</p>
            <div className="widget-capability-row">
              {capabilityPills.map((item) => (
                <span key={item} className="widget-capability-pill">
                  {item}
                </span>
              ))}
            </div>
            {customerProfile.submitted ? (
              <div className="widget-home-inline-prompts">
                {homePromptOptions.map((prompt) => (
                  <button key={prompt} className="prompt-chip home" type="button" onClick={() => handlePromptSelection(prompt)}>
                    {prompt}
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          {customerProfile.submitted ? null : supportOverview}

          {!customerProfile.submitted ? (
            <section className="widget-home-section">
            <div className="widget-section-heading">
              <strong>{localizeText(locale, "Start with a guided topic", "ابدأ بموضوع جاهز")}</strong>
              <span>{localizeText(locale, "We’ll open chat with the question ready for you.", "سنفتح المحادثة مع تجهيز السؤال لك.")}</span>
            </div>
            <div className="widget-topic-grid">
              {guidedPrompts.map((prompt) => (
                <button key={prompt} className="widget-topic-card" type="button" onClick={() => handlePromptSelection(prompt)}>
                  <strong>{prompt}</strong>
                  <span>{localizeText(locale, "Open in chat", "افتح في المحادثة")}</span>
                </button>
              ))}
            </div>
            </section>
          ) : null}

          <div className="widget-powered">
            <span className="powered-label">{text.poweredLabel}</span>
            <span className="powered-brand">{text.poweredBrand}</span>
          </div>
        </div>
      ) : (
        <div className="widget-chat">
          <div className="widget-chat-scroll" ref={messageListRef}>
            <div className="widget-chat-intro">
              <span className="widget-chat-intro-badge">{localizeText(locale, "Store support desk", "مكتب دعم المتجر")}</span>
              <p>{localizeText(locale, "Ask about products, orders, returns, or policies and keep the whole conversation in one place.", "اسأل عن المنتجات أو الطلبات أو الإرجاع أو السياسات واحتفظ بكل المحادثة في مكان واحد.")}</p>
            </div>
            <div className="prompt-row">
              {guidedPrompts.map((prompt) => (
                <button key={prompt} className="prompt-chip" type="button" onClick={() => handlePromptSelection(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>

            <div className="message-list">
              {messages.map((message) => {
                const messageDirection = inferMessageDirection(message.text, locale);

                return (
                  <article key={message.id} className={`message-row ${message.role}`}>
                    <div
                      className={`message-bubble ${message.role} message-${messageDirection} ${message.kind === "error" ? "message-error" : ""}`}
                      dir={messageDirection}
                    >
                      <div className="message-content">
                        {message.role === "bot" ? renderFormattedMessage(message.text) : <p>{message.text}</p>}
                      </div>
                      {message.retryable ? (
                        <div className="message-actions">
                          <button
                            type="button"
                            className="message-retry"
                            onClick={() => onRetryMessage(message.retryText)}
                            disabled={loading || cooldownRemainingMs > 0}
                          >
                            {text.retry}
                          </button>
                        </div>
                      ) : null}
                      <div className="message-meta">
                        <span className="message-time">{formatMessageTime(message.sentAt, locale)}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
              {loading ? (
                <article className="message-row bot typing-row">
                  <div className="message-bubble bot typing-bubble">
                    <div className="typing-dots" aria-label={text.typing}>
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </article>
              ) : null}
            </div>
          </div>

          <form
            className="widget-composer"
            onSubmit={(event) => {
              event.preventDefault();
              onSend(draft);
            }}
          >
            {composerNotice ? (
              <div className="composer-notice">{composerNotice}</div>
            ) : null}
            {showEmojiPicker ? (
              <div className="emoji-picker">
                {emojiChoices.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="emoji-choice"
                    onClick={() => {
                      onChangeDraft(`${draft}${emoji}`);
                      setShowEmojiPicker(false);
                      inputRef.current?.focus();
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : null}
            <button
              className={`send-button ${draft.trim() ? "ready" : ""}`}
              type="submit"
              aria-label={localizeText(locale, "Send message", "إرسال الرسالة")}
              disabled={loading || cooldownRemainingMs > 0 || !draft.trim()}
            >
              <SendIcon />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(event) => onChangeDraft(event.target.value)}
              placeholder={text.placeholder}
            />
            <button
              className="emoji-button"
              type="button"
              onClick={() => setShowEmojiPicker((current) => !current)}
              aria-label="Open emoji picker"
            >
              ☺
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}

function ToastNotice({ message }) {
  return (
    <div className="toast-notice" role="status" aria-live="polite">
      {message}
    </div>
  );
}

function IconButton({ children, label, onClick }) {
  return (
    <button type="button" className="header-icon-button" aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 7h12l-1.4 6.2a2 2 0 0 1-2 1.6H9.3A2 2 0 0 1 7.4 13L6 4H3" />
      <circle cx="10" cy="19" r="1.5" />
      <circle cx="17" cy="19" r="1.5" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20c1.8-3.6 4.2-5 7-5s5.2 1.4 7 5" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 5h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 4v-4H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12 20 4l-4.8 16-2.7-6.5L4 12Z" />
      <path d="M12.5 13.5 20 4" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4H4v4" />
      <path d="M16 4h4v4" />
      <path d="M20 16v4h-4" />
      <path d="M4 16v4h4" />
      <path d="m9 9-5-5" />
      <path d="m15 9 5-5" />
      <path d="m15 15 5 5" />
      <path d="m9 15-5 5" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 4H4v6" />
      <path d="M14 4h6v6" />
      <path d="M20 14v6h-6" />
      <path d="M4 14v6h6" />
      <path d="m4 10 6-6" />
      <path d="m20 10-6-6" />
      <path d="m20 14-6 6" />
      <path d="m4 14 6 6" />
    </svg>
  );
}

function ArrowIcon({ direction }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {direction === "left" ? (
        <>
          <path d="M19 12H5" />
          <path d="m11 6-6 6 6 6" />
        </>
      ) : (
        <>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </>
      )}
    </svg>
  );
}

createRoot(document.querySelector("#root")).render(<App />);
