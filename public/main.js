const messagesEl = document.querySelector("#messages");
const composer = document.querySelector("#composer");
const input = document.querySelector("#message-input");
const promptList = document.querySelector("#prompt-list");
const analyticsDialog = document.querySelector("#analytics-dialog");
const analyticsOutput = document.querySelector("#analytics-output");
const analyticsButton = document.querySelector("#analytics-button");
const closeAnalyticsButton = document.querySelector("#close-analytics");
const localeSwitch = document.querySelector("#locale-switch");
const integrationList = document.querySelector("#integration-list");
const heroNote = document.querySelector("#hero-note");
const chatWidget = document.querySelector("#chat-widget");
const chatLauncher = document.querySelector("#chat-launcher");
const openChatTop = document.querySelector("#open-chat-top");
const openChatHero = document.querySelector("#open-chat-hero");
const chatClose = document.querySelector("#chat-close");
const promptTriggers = document.querySelectorAll(".prompt-trigger");

let sessionId = crypto.randomUUID();
let activeLocale = "en";
let bootstrapData = null;

function appendMessage(role, text, meta = "") {
  const wrapper = document.createElement("article");
  wrapper.className = `message ${role}`;
  wrapper.innerHTML = `
    <div>${text}</div>
    ${meta ? `<div class="message-meta">${meta}</div>` : ""}
  `;
  messagesEl.appendChild(wrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function setChatOpen(open) {
  chatWidget.classList.toggle("open", open);
  chatLauncher.classList.toggle("hidden", open);
  if (open) {
    input.focus();
  }
}

function renderPromptButtons() {
  promptList.innerHTML = "";
  const prompts =
    activeLocale === "ar" ? bootstrapData.samplePromptsAr : bootstrapData.samplePrompts;

  prompts.forEach((prompt) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "prompt-chip";
    button.textContent = prompt;
    button.addEventListener("click", () => {
      setChatOpen(true);
      input.value = prompt;
      input.focus();
    });
    promptList.appendChild(button);
  });
}

function renderIntegrations() {
  integrationList.innerHTML = "";

  bootstrapData.integrations.forEach((integration) => {
    const item = document.createElement("article");
    item.className = "integration-item";
    item.innerHTML = `
      <strong>${integration.name}</strong>
      <span>${integration.type}</span>
      <span>${integration.purpose}</span>
      <span>Production examples: ${integration.productionExamples.join(", ")}</span>
    `;
    integrationList.appendChild(item);
  });
}

function updateLocaleButtons() {
  localeSwitch.querySelectorAll(".locale-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.locale === activeLocale);
  });
}

async function bootstrap() {
  const response = await fetch("/api/bootstrap");
  bootstrapData = await response.json();

  appendMessage(
    "bot",
    bootstrapData.welcome,
    "Intent coverage: product info, tracking, returns, handoff"
  );

  const aiModeLabel = bootstrapData.aiMode.enabled
    ? `OpenAI reply composer enabled (${bootstrapData.aiMode.model})`
    : "Deterministic mode active until OPENAI_API_KEY is provided";
  heroNote.textContent = `${aiModeLabel}. Bilingual-ready demo with mock commerce integrations.`;

  renderPromptButtons();
  renderIntegrations();
}

async function sendMessage(message) {
  appendMessage("user", message);

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      sessionId,
      message
    })
  });

  const data = await response.json();
  sessionId = data.sessionId;

  const meta = `Intent: ${data.intent} | Confidence: ${Math.round(data.confidence * 100)}%`;
  appendMessage("bot", data.reply, meta);
}

composer.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = input.value.trim();
  if (!message) {
    return;
  }

  input.value = "";
  await sendMessage(message);
});

analyticsButton.addEventListener("click", async () => {
  const response = await fetch("/api/analytics");
  const data = await response.json();
  analyticsOutput.textContent = JSON.stringify(data.events, null, 2);
  analyticsDialog.showModal();
});

closeAnalyticsButton.addEventListener("click", () => analyticsDialog.close());

localeSwitch.addEventListener("click", (event) => {
  const button = event.target.closest(".locale-button");
  if (!button) {
    return;
  }

  activeLocale = button.dataset.locale;
  updateLocaleButtons();
  renderPromptButtons();
  input.placeholder =
    activeLocale === "ar"
      ? "اسأل عن منتج أو طلب أو استرداد أو التحويل إلى موظف خدمة عملاء..."
      : "Ask about a product, order, refund, or human handoff...";
});

[chatLauncher, openChatTop, openChatHero].forEach((element) => {
  element.addEventListener("click", () => setChatOpen(true));
});

chatClose.addEventListener("click", () => setChatOpen(false));

promptTriggers.forEach((button) => {
  button.addEventListener("click", () => {
    setChatOpen(true);
    input.value = button.dataset.prompt;
    input.focus();
  });
});

bootstrap();
