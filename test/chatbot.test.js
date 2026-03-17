import test from "node:test";
import assert from "node:assert/strict";
import { createChatbot } from "../src/lib/chatbot.js";

test("returns product information for a known item", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-product",
    message: "Tell me about the Mechanical Keyboard"
  });

  assert.equal(result.intent, "product_information");
  assert.match(result.reply, /94\.49 SAR/);
  assert.match(result.reply, /Mechanical Keyboard/);
});

test("responds naturally to a simple greeting instead of falling back", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-greeting",
    message: "hello"
  });

  assert.equal(result.intent, "greeting");
  assert.doesNotMatch(result.reply, /not fully confident/i);
  assert.match(result.reply, /choose a product|track an order|returns|payment|policy/i);
});

test("answers natural help phrasing without falling back", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-help-natural",
    message: "how you can help me"
  });

  assert.equal(result.intent, "general_help");
  assert.doesNotMatch(result.reply, /not fully confident/i);
  assert.match(result.reply, /recommend a product|show products|track an order|privacy/i);
});

test("shows catalog guidance for browse requests", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-catalog",
    message: "give me list of products"
  });

  assert.equal(result.intent, "catalog_browse");
  assert.match(result.reply, /categories we currently carry|tell me the category|travel|home|audio/i);
});

test("keeps English replies for English greeting-style messages", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-greeting-ar",
    message: "hello",
    preferredLocale: "ar"
  });

  assert.equal(result.intent, "greeting");
  assert.equal(result.locale, "en");
  assert.match(result.reply, /Hi there|What would you like to do/i);
});

test("prefers Arabic when the shopper writes Arabic even on an English page", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-ar-overrides-en-page",
    message: "السلام عليكم",
    preferredLocale: "en"
  });

  assert.equal(result.intent, "greeting");
  assert.equal(result.locale, "ar");
  assert.match(result.reply, /مرحباً|مرحبًا|كيف أقدر أساعدك/);
  assert.doesNotMatch(result.reply, /Hi there|What would you like to do/i);
});

test("prefers English when the shopper writes English even on an Arabic page", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-en-overrides-ar-page",
    message: "hello",
    preferredLocale: "ar"
  });

  assert.equal(result.intent, "greeting");
  assert.equal(result.locale, "en");
  assert.match(result.reply, /Hi there|What would you like to do/i);
  assert.doesNotMatch(result.reply, /مرحباً|مرحبًا|كيف أقدر أساعدك/);
});

test("handles misspelled greetings without falling back", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-greeting-typo",
    message: "heelo"
  });

  assert.equal(result.intent, "greeting");
  assert.doesNotMatch(result.reply, /not fully confident/i);
});

test("handles Arabic greeting variants without falling back", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-greeting-ar-variant",
    message: "مرحباا"
  });

  assert.equal(result.intent, "greeting");
  assert.doesNotMatch(result.reply, /لست واثقاً|لست واثقًا/);
});

test("tracks an order with a provided order number", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-order",
    message: "Where is my order KS-10421?"
  });

  assert.equal(result.intent, "order_tracking");
  assert.match(result.reply, /Out for delivery/);
});

test("does not resolve hidden seeded orders when the client has no known orders", async () => {
  const bot = createChatbot();
  const stepOne = await bot.chat({
    sessionId: "session-no-known-orders",
    message: "Where is my order",
    knownOrders: []
  });
  const stepTwo = await bot.chat({
    sessionId: "session-no-known-orders",
    message: "KS-10421",
    knownOrders: []
  });

  assert.equal(stepOne.intent, "order_tracking");
  assert.match(stepOne.reply, /share your order number/i);
  assert.match(stepTwo.reply, /couldn't find KS-10421|double-check the order number/i);
  assert.doesNotMatch(stepTwo.reply, /Out for delivery|Aramex|Noise Cancelling Earbuds/i);
});

test("tracks a locally saved demo order shared by the client", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-local-order",
    message: "Where is my order KS-10541?",
    knownOrders: [
      {
        orderNumber: "KS-10541",
        status: "Delivered",
        eta: "Delivered on 2026-03-16",
        paymentStatus: "Paid",
        courier: "SMSA",
        items: [{ productId: "sku006-gaming-headset", quantity: 1 }]
      }
    ]
  });

  assert.equal(result.intent, "order_tracking");
  assert.match(result.reply, /KS-10541/);
  assert.match(result.reply, /Delivered on 2026-03-16|SMSA/);
});

test("finds products from short product names", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-camera",
    message: "Camera"
  });

  assert.equal(result.intent, "product_information");
  assert.match(result.reply, /Smart Home Camera|camera/i);
});

test("finds products from loose fuzzy phrases", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-tablet-case",
    message: "I need Tablet Case thing"
  });

  assert.equal(result.intent, "product_information");
  assert.match(result.reply, /Tablet Case/i);
});

test("tracks an order fully in Arabic without mixed English fields", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-order-ar",
    message: "أين طلبي KS-10388؟",
    preferredLocale: "ar"
  });

  assert.equal(result.intent, "order_tracking");
  assert.equal(result.locale, "ar");
  assert.match(result.reply, /تم التسليم/);
  assert.match(result.reply, /تم التسليم في 2026-03-14/);
  assert.match(result.reply, /مدفوع/);
  assert.doesNotMatch(result.reply, /Delivered|Paid|Pending assignment/);
});

test("asks for order number on a returns request and completes on follow-up", async () => {
  const bot = createChatbot();
  const stepOne = await bot.chat({
    sessionId: "session-return",
    message: "I need a refund"
  });
  const stepTwo = await bot.chat({
    sessionId: "session-return",
    message: "KS-10388"
  });

  assert.equal(stepOne.intent, "returns_refunds");
  assert.match(stepOne.reply, /share your order number/i);
  assert.match(stepTwo.reply, /4 business days|original payment method|eligible for a return/i);
});

test("switches from a pending refund flow to cancellation when the user changes intent", async () => {
  const bot = createChatbot();
  const stepOne = await bot.chat({
    sessionId: "session-switch-refund-cancel",
    message: "I need a refund"
  });
  const stepTwo = await bot.chat({
    sessionId: "session-switch-refund-cancel",
    message: "Can I cancel order KS-10291?"
  });

  assert.equal(stepOne.intent, "returns_refunds");
  assert.equal(stepTwo.intent, "order_change_cancel");
  assert.match(stepTwo.reply, /Processing|cancellation|address updates/i);
  assert.doesNotMatch(stepTwo.reply, /return cannot start|business days|original payment method/i);
});

test("keeps Arabic for order-number follow-ups after an Arabic request", async () => {
  const bot = createChatbot();
  const stepOne = await bot.chat({
    sessionId: "session-return-ar-follow-up",
    message: "أريد استرداد الطلب",
    preferredLocale: "en"
  });
  const stepTwo = await bot.chat({
    sessionId: "session-return-ar-follow-up",
    message: "KS-10388",
    preferredLocale: "en"
  });

  assert.equal(stepOne.locale, "ar");
  assert.equal(stepTwo.locale, "ar");
  assert.match(stepTwo.reply, /يتم رد المبلغ|أيام عمل|الطلب/);
  assert.doesNotMatch(stepTwo.reply, /Refunds are processed|business days|order/i);
});

test("keeps English for order-number follow-ups after an English request", async () => {
  const bot = createChatbot();
  const stepOne = await bot.chat({
    sessionId: "session-return-en-follow-up",
    message: "I need a refund",
    preferredLocale: "ar"
  });
  const stepTwo = await bot.chat({
    sessionId: "session-return-en-follow-up",
    message: "KS-10388",
    preferredLocale: "ar"
  });

  assert.equal(stepOne.locale, "en");
  assert.equal(stepTwo.locale, "en");
  assert.match(stepTwo.reply, /Refunds are processed|business days|eligible for a return/i);
  assert.doesNotMatch(stepTwo.reply, /يتم رد المبلغ|أيام عمل|الطلب/);
});

test("creates a handoff recommendation", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-handoff",
    message: "I need a human agent for a complaint"
  });

  assert.equal(result.intent, "human_handoff");
  assert.match(result.reply, /Ticket ID/);
});

test("recommends products for broader shopping questions", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-recommend",
    message: "Recommend the best product for travel"
  });

  assert.equal(result.intent, "recommendations");
  assert.match(result.reply, /Portable Power Bank|Noise Cancelling Earbuds|External SSD/);
});

test("handles Arabic recommendation requests for use cases naturally", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-recommend-ar",
    message: "رشح لي أفضل منتج للسفر",
    preferredLocale: "ar"
  });

  assert.equal(result.locale, "ar");
  assert.equal(result.intent, "recommendations");
  assert.match(result.reply, /باور|سماعات|SSD|أرشح|اخترت هذه المنتجات|الأنسب/);
  assert.doesNotMatch(result.reply, /اذكر اسم المنتج أو الفئة/);
});

test("answers payment-method questions", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-payment",
    message: "What payment methods do you support?"
  });

  assert.equal(result.intent, "payments");
  assert.match(result.reply, /Apple Pay|mada|Cash on Delivery/i);
});

test("answers privacy questions from the policy documents", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-privacy",
    message: "What data do you collect and do you sell it?"
  });

  assert.equal(result.intent, "policy_info");
  assert.match(result.reply, /name, email, address, and payment details/i);
  assert.match(result.reply, /does not sell customer data/i);
});

test("answers simple privacy questions without falling back", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-privacy-simple",
    message: "What data do you collect?"
  });

  assert.equal(result.intent, "policy_info");
  assert.match(result.reply, /collects name, email, address, and payment details/i);
});

test("answers terms and governing law questions from the policy documents", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-terms",
    message: "What are your terms and conditions and what law governs them?"
  });

  assert.equal(result.intent, "policy_info");
  assert.match(result.reply, /18 years old|legal consent/i);
  assert.match(result.reply, /Kingdom of Saudi Arabia/i);
});

test("answers general return-policy questions without requiring an order number", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-return-policy",
    message: "What is your return and refund policy?"
  });

  assert.equal(result.intent, "returns_refunds");
  assert.match(result.reply, /3 days of the original purchase date/i);
  assert.match(result.reply, /4 business days/i);
});

test("answers Arabic privacy questions from the policy documents", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-ar-privacy",
    message: "ما البيانات التي تجمعونها وهل تبيعون بيانات العملاء؟"
  });

  assert.equal(result.intent, "policy_info");
  assert.match(result.reply, /الاسم والبريد الإلكتروني والعنوان وتفاصيل الدفع/);
  assert.match(result.reply, /لا يبيع المتجر بيانات العميل/);
});

test("answers direct Arabic data-selling questions without fallback", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-ar-privacy-selling",
    message: "هل تبيعون بيانات العملاء؟",
    preferredLocale: "ar"
  });

  assert.equal(result.intent, "policy_info");
  assert.doesNotMatch(result.reply, /قد لا أكون فهمت/i);
  assert.match(result.reply, /لا يبيع المتجر بيانات العميل/);
});

test("checks cancellation eligibility with an order number", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-cancel",
    message: "Can I cancel order KS-10291?"
  });

  assert.equal(result.intent, "order_change_cancel");
  assert.match(result.reply, /cancellation|address updates|Processing/i);
});

test("handles delivery address change requests as order changes instead of tracking", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-address-change-locked",
    message: "Can you change my delivery address for KS-10421?"
  });

  assert.equal(result.intent, "order_change_cancel");
  assert.match(result.reply, /delivery address|human agent review|Out for delivery/i);
  assert.doesNotMatch(result.reply, /^Order: KS-10421/m);
});

test("uses address-update wording for editable orders", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-address-change-eligible",
    message: "Please update my delivery address for KS-10291"
  });

  assert.equal(result.intent, "order_change_cancel");
  assert.match(result.reply, /delivery address update|update it before shipping|Processing/i);
});

test("returns Arabic guidance when the customer writes in Arabic", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-ar",
    message: "أريد معرفة تفاصيل قرص SSD خارجي"
  });

  assert.equal(result.intent, "product_information");
  assert.equal(result.locale, "ar");
  assert.match(result.reply, /قرص SSD خارجي/);
  assert.match(result.reply, /136\.49 SAR/);
});

test("falls back safely on unsupported requests", async () => {
  const bot = createChatbot();
  const result = await bot.chat({
    sessionId: "session-fallback",
    message: "Can you calculate my taxes and rewrite my CV?"
  });

  assert.equal(result.intent, "fallback");
  assert.match(result.reply, /show products|order number|returns|privacy/i);
});

test("reports deterministic mode when no OpenAI key is configured", () => {
  const bot = createChatbot();
  const aiMode = bot.getAIMode();

  assert.equal(aiMode.enabled, false);
  assert.equal(aiMode.provider, "deterministic");
});
