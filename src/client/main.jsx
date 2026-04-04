import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { storePolicies } from "../data/policies.js";
import { products } from "../data/products.js";

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

const orderStatusMap = {
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
    "Pending assignment": "بانتظار التعيين"
  }
};

const STORAGE_KEYS = {
  cart: "lean-souq-cart",
  orders: "lean-souq-orders",
  profile: "lean-souq-profile"
};

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
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write failures in private mode or limited environments.
  }
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
    displayStatus: orderStatusMap[locale][order.status] ?? order.status,
    displayPaymentStatus: orderStatusMap[locale][order.paymentStatus] ?? order.paymentStatus,
    displayCourier:
      locale === "ar" && order.courier === "Pending assignment" ? "بانتظار شركة الشحن" : order.courier,
    displayEta:
      locale === "ar"
        ? order.eta === "Today before 8:00 PM"
          ? "اليوم قبل 8:00 مساءً"
          : order.eta.startsWith("Delivered on ")
            ? `تم التسليم في ${order.eta.replace("Delivered on ", "")}`
            : order.eta === "Expected in 2 days"
              ? "متوقع خلال يومين"
              : order.eta === "Expected to ship tomorrow"
                ? "متوقع الشحن غداً"
                : order.eta
        : order.eta,
    displaySubtotal: formatCurrency(locale, order.subtotalSar ?? 0),
    displayTax: formatCurrency(locale, order.taxSar ?? 0),
    displayTotal: formatCurrency(locale, order.totalSar ?? 0)
  };
}

function buildProductPrompt(product, locale) {
  return locale === "ar" ? `أريد معرفة تفاصيل ${product.nameAr}` : `Tell me about the ${product.name}`;
}

function createChatMessage(role, text) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    sentAt: new Date().toISOString()
  };
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

function App() {
  const [siteLocale, setSiteLocale] = useState("en");
  const [route, setRoute] = useState(() => parseRoute(window.location.pathname));
  const [heroIndex, setHeroIndex] = useState(0);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [widgetView, setWidgetView] = useState("home");
  const [bootstrapData, setBootstrapData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [draft, setDraft] = useState("");
  const [cartItems, setCartItems] = useState(() => readStorage(STORAGE_KEYS.cart, []));
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [orderList, setOrderList] = useState(() => readStorage(STORAGE_KEYS.orders, []));
  const [ordersLoaded, setOrdersLoaded] = useState(true);
  const [checkoutNotice, setCheckoutNotice] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [toastNotice, setToastNotice] = useState(null);
  const [queuedPrompt, setQueuedPrompt] = useState("");
  const [customerProfile, setCustomerProfile] = useState(() => {
    const saved = readStorage(STORAGE_KEYS.profile, {});
    const hasIdentity = Boolean(saved?.name && saved?.email);

    return {
      name: saved?.name ?? "",
      email: saved?.email ?? "",
      newsletter: Boolean(saved?.newsletter),
      submitted: Boolean(saved?.submitted ?? hasIdentity)
    };
  });
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const inputRef = useRef(null);
  const autoOpenedRef = useRef(false);
  const content = localized[siteLocale];
  const catalog = products.map((product) => localizeProduct(product, siteLocale));
  const selectedProduct = selectedProductId ? catalog.find((product) => product.id === selectedProductId) ?? null : null;
  const matchedProfileOrders = customerProfile.submitted && customerProfile.email
    ? orderList.filter((order) => String(order.email).toLowerCase() === customerProfile.email.toLowerCase())
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
      setMessages([
        createChatMessage("bot", data.welcome)
      ]);
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

  async function sendMessage(nextMessage) {
    if (!nextMessage.trim()) {
      return;
    }

    setLoading(true);
    const userEntry = createChatMessage("user", nextMessage);
    setMessages((current) => [...current, userEntry]);
    setDraft("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionId,
          message: nextMessage,
          preferredLocale: siteLocale,
          knownOrders: orderList,
          customerProfile: customerProfile.submitted
            ? {
                name: customerProfile.name,
                email: customerProfile.email,
                newsletter: customerProfile.newsletter
              }
            : null
        })
      });

      const data = await response.json();
      setSessionId(data.sessionId);
      setMessages((current) => [
        ...current,
        createChatMessage("bot", data.reply)
      ]);
    } finally {
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
          customerName: customerProfile.name || (siteLocale === "ar" ? "متسوق تجريبي" : "Demo shopper"),
          email: customerProfile.email || "shopper@example.com",
          items: cartItems,
          locale: siteLocale
        })
      });

      const data = await response.json();

      if (!response.ok || !data.order?.orderNumber) {
        throw new Error(data.error || "Failed to create order");
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
        draft={draft}
        locale={siteLocale}
        loading={loading}
        messages={messages}
        customerProfile={customerProfile}
        onChangeDraft={setDraft}
        onClose={() => setWidgetOpen(false)}
        onPrimePrompt={primeSupportPrompt}
        onProfileSubmit={submitLeadProfile}
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
  const hasProfile = customerProfile.submitted && customerProfile.email;

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
                  "Your saved profile and recent orders are stored locally on this device, so you can return and continue from the same account view.",
                  "نحفظ ملفك وطلباتك الأخيرة محليًا على هذا الجهاز حتى تتمكن من الرجوع ومتابعة الطلبات من نفس الصفحة."
                )
              : localizeText(
                  locale,
                  "Complete your support profile once in chat, then your future orders will appear here automatically.",
                  "أكمل بياناتك مرة واحدة داخل المحادثة، وبعدها ستظهر طلباتك هنا تلقائيًا."
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
            <strong>{localizeText(locale, "Saved local orders", "تم حفظ الطلبات المحلية")}</strong>
            <p>
              {localizeText(
                locale,
                "These local orders were created on this device. Add your support details anytime to link future orders to your shopper profile too.",
                "تم إنشاء هذه الطلبات المحلية على هذا الجهاز. يمكنك إضافة بياناتك لاحقًا لربط الطلبات القادمة بملفك الشخصي أيضًا."
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
  onSend,
  onSetView,
  onResetConversation,
  open,
  text,
  view
}) {
  const prompts = locale === "ar" ? bootstrapData?.samplePromptsAr ?? [] : bootstrapData?.samplePrompts ?? [];
  const guidedPrompts = (text.quickActions ?? prompts).slice(0, 4);
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadNewsletter, setLeadNewsletter] = useState(false);
  const messageListRef = useRef(null);
  const emojiChoices = ["🙂", "👍", "🎉", "🙏", "💙", "🔥"];

  useEffect(() => {
    setLeadName(customerProfile.name ?? "");
    setLeadEmail(customerProfile.email ?? "");
    setLeadNewsletter(customerProfile.newsletter ?? false);
  }, [customerProfile.email, customerProfile.name, customerProfile.newsletter]);

  useEffect(() => {
    if (!open) {
      setShowMenu(false);
      setShowEmojiPicker(false);
    }
  }, [open]);

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

  const capabilityPills = locale === "ar"
    ? ["اقتراحات شراء", "ربط الطلبات", "استرجاع وسياسات", "تحويل للبشر"]
    : ["Buying advice", "Order tracking", "Returns & policies", "Human handoff"];

  return (
    <aside
      className={`support-widget ${open ? "open" : ""} ${compactMode ? "compact" : ""} ${
        view === "home" ? "view-home" : "view-chat"
      }`}
      aria-label="Support widget"
    >
      <div className="widget-header">
        <div className="widget-actions widget-actions-menu">
          <button
            className="widget-icon"
            type="button"
            onClick={() => setShowMenu((current) => !current)}
            aria-label="Widget actions"
          >
            ⋮
          </button>
          {view !== "home" ? (
            <button
              className="widget-icon"
              type="button"
              onClick={() => setCompactMode((current) => !current)}
              aria-label="Toggle compact mode"
            >
              ↕
            </button>
          ) : null}
          {showMenu ? (
            <div className="widget-menu">
              <button
                type="button"
                onClick={() => {
                  onSetView("home");
                  setShowMenu(false);
                }}
              >
                {text.menuHome}
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetConversation();
                  setShowMenu(false);
                }}
              >
                {text.menuNewChat}
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setShowMenu(false);
                }}
              >
                {text.menuClose}
              </button>
            </div>
          ) : null}
        </div>
        <div className="widget-brand">
          <div className="widget-brand-avatar">LA</div>
          <div className="widget-brand-copy">
            <strong>{view === "home" ? text.homeTitle : text.chatTitle}</strong>
            <span>{localizeText(locale, "Usually replies instantly", "يرد غالباً بشكل فوري")}</span>
          </div>
        </div>
        <div className="widget-header-end">
          <span className="widget-header-badge">{localizeText(locale, "Live support", "دعم مباشر")}</span>
          <button className="widget-icon widget-close" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
      </div>

      {view === "home" ? (
        <div className="widget-home">
          <section className="widget-home-hero">
            <span className="widget-home-eyebrow">{localizeText(locale, "Storefront support", "دعم داخل المتجر")}</span>
            <strong>{customerProfile.submitted
              ? localizeText(locale, `Welcome back, ${customerProfile.name}`, `مرحبًا بعودتك ${customerProfile.name}`)
              : text.homeHero}</strong>
            <p>{text.offlineNotice}</p>
            <div className="widget-capability-row">
              {capabilityPills.map((item) => (
                <span key={item} className="widget-capability-pill">
                  {item}
                </span>
              ))}
            </div>
          </section>

          <section className="widget-home-stats" aria-label={localizeText(locale, "Support overview", "نظرة عامة على الدعم")}>
            <article className="widget-mini-stat">
              <strong>{localizeText(locale, "Fast replies", "ردود سريعة")}</strong>
              <span>{localizeText(locale, "Guided answers without leaving the product page.", "إجابات موجهة بدون الخروج من صفحة المنتج.")}</span>
            </article>
            <article className="widget-mini-stat">
              <strong>{localizeText(locale, "Order-aware", "مرتبطة بطلباتك")}</strong>
              <span>{localizeText(locale, "Saved details help us connect future orders on this device.", "البيانات المحفوظة تساعدنا نربط الطلبات القادمة على هذا الجهاز.")}</span>
            </article>
          </section>

          {customerProfile.submitted ? (
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
              </div>
              <p className="lead-card-note">
                {localizeText(
                  locale,
                  "Orders and future support chats can continue with the same saved identity.",
                  "يمكن متابعة الطلبات والمحادثات القادمة بنفس الهوية المحفوظة."
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
                if (!leadName.trim() || !leadEmail.trim()) {
                  return;
                }

                onProfileSubmit({
                  name: leadName.trim(),
                  email: leadEmail.trim(),
                  newsletter: leadNewsletter
                });
              }}
            >
              <div className="widget-section-heading">
                <strong>{text.introTitle}</strong>
                <span>{localizeText(locale, "Save your details once for faster support and order tracking.", "احفظ بياناتك مرة واحدة لتجربة دعم وتتبع أسرع.")}</span>
              </div>
              <input
                type="text"
                value={leadName}
                onChange={(event) => setLeadName(event.target.value)}
                placeholder={text.namePlaceholder}
              />
              <input
                type="email"
                value={leadEmail}
                onChange={(event) => setLeadEmail(event.target.value)}
                placeholder={text.emailPlaceholder}
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
                  "We only use this profile to personalize support and attach demo orders on this device.",
                  "نستخدم هذا الملف فقط لتخصيص الدعم وربط الطلبات التجريبية على هذا الجهاز."
                )}
              </p>
              <div className="lead-actions">
                <button className="lead-submit" type="submit">
                  {text.introSend}
                </button>
              </div>
            </form>
          )}

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
              {messages.map((message) => (
                <article key={message.id} className={`message-row ${message.role}`}>
                  {message.role === "bot" ? <div className="message-avatar">LA</div> : null}
                  <div className={`message-bubble ${message.role}`}>
                    <p>{message.text}</p>
                    <div className="message-meta">
                      <span>{formatMessageTime(message.sentAt, locale)}</span>
                      {message.role === "user" ? <span className="message-status">✓✓</span> : null}
                    </div>
                  </div>
                </article>
              ))}
              {loading ? (
                <article className="message-row bot typing-row">
                  <div className="message-avatar">LA</div>
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
