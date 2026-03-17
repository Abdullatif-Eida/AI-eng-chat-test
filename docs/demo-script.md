# Demo Script

## Goal

Keep the demo between `3` and `5` minutes. The goal is not to explain every implementation detail. The goal is to show strong product judgment, a working prototype, and clear reasoning behind your trade-offs.

## Recording setup

- Keep the browser open on the chatbot homepage before recording starts
- Keep the problem and solution docs open in separate tabs in case you want to reference them
- Use one clean browser window only
- Zoom the page enough so text is readable in the recording
- Close notifications and unrelated tabs

## Suggested structure and timing

### 0:00 - 0:30 | Problem framing

Say:

"This POC is for a mid-sized KSA e-commerce retailer with three linked business issues: support response times are averaging 8 to 12 hours, CSAT/NPS has dropped by 15 percent over the last quarter, and cart abandonment is 7 percent above the industry average. I treated this as both a support problem and a revenue problem."

### 0:30 - 1:00 | What you chose to build

Say:

"Instead of trying to automate the entire support operation, I focused on the highest-value MVP flows: product information, order tracking, returns and refunds, plus human handoff. I also designed it to be bilingual-ready for Arabic and English and easy to extend into CRM and commerce integrations."

### 1:00 - 1:35 | Architecture in plain English

Show the UI and briefly point to the integration cards.

Say:

"The architecture is intentionally simple: a chat interface, an intent and policy layer, structured services for products, orders, and returns, a human handoff path, and analytics logging. I used structured data for factual answers so the bot does not hallucinate order or policy details. If an OpenAI key is present, the app can optionally use OpenAI to compose grounded replies, but it always falls back safely to deterministic behavior."

### 1:35 - 3:20 | Live demo

Use these prompts in order:

1. `Tell me about the Nova Wireless Headphones`
2. `Where is my order KS-10421?`
3. `I need a refund`
4. `KS-10388`
5. `I need a human agent`
6. Optional bilingual moment: switch to Arabic and use `أين طلبي KS-10421؟`

As you demo, say short framing lines like:

- "This first flow addresses pre-purchase support and helps reduce cart abandonment."
- "This second flow handles one of the most repetitive e-commerce support tickets."
- "For returns, the bot follows policy but still leaves room for human escalation when trust matters."
- "For sensitive or uncertain cases, the bot hands off instead of pretending to know everything."

### 3:20 - 4:10 | AI/tooling choices

Say:

"I used AI throughout the process for requirements shaping, test generation, implementation support, and review, and I documented the alternatives and trade-offs in a separate tooling section as requested. In the product itself, I made a deliberate choice to ground the bot in structured commerce data first, because reliability matters more than free-form generation for support use cases like order status and refunds."

### 4:10 - 4:45 | Close with business impact and next steps

Say:

"The point of this MVP is to reduce first response time, lower repetitive support load, protect CSAT through better escalation, and improve conversion on pre-purchase questions. If I extended this further, I would add live CRM integration, richer Arabic response generation, and analytics tied directly to support deflection, CSAT, and abandonment recovery."

## Recording notes

- Do not read every sentence word-for-word; use this as a guide
- Keep energy calm and confident
- Avoid overexplaining implementation details unless they directly support a product decision
- If something loads slowly, pause briefly instead of filling space
- If OpenAI mode is not enabled, say that the app supports optional OpenAI reply composition but defaults to deterministic mode for reviewer-friendly reliability
