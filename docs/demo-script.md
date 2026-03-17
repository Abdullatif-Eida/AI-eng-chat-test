# Demo Script

## Goal

Keep the recording between `3` and `5` minutes. The video should do three things clearly:

- show the business problem you are solving
- prove the prototype works on the core MVP flows
- explain the most important design decisions without going too deep into implementation

The ideal target is about `4:00` to `4:30`.

## Recording setup

- Open the app homepage before you start recording
- Use one clean browser window only
- Zoom in enough so chat text is clearly readable
- Keep the widget visible early in the recording
- Close notifications, side apps, and unrelated tabs
- If OpenAI mode is not enabled, that is fine; mention the deterministic fallback as a design choice

## Recommended demo path

Use this exact order so the story feels deliberate and business-led:

1. Problem framing
2. What you built
3. Architecture in plain English
4. Live demo of the `3` required inquiry flows
5. Human handoff and bilingual readiness
6. Why the design is safe and scalable
7. Close with business impact and next steps

## Suggested 4-minute script

### 0:00 - 0:30 | Problem framing

Keep the homepage visible.

Say:

"This POC is for a mid-sized KSA e-commerce retailer with three connected business issues: support response times average 8 to 12 hours, CSAT and NPS dropped by 15 percent over the last quarter, and cart abandonment is 7 percent above the industry average. I treated this as both a support problem and a revenue problem, not just a chatbot feature request."

### 0:30 - 0:55 | What you chose to build

Point briefly to the storefront and chat entry point.

Say:

"Instead of trying to automate the full support operation, I focused on the highest-value MVP flows: product information, order tracking, returns and refunds, plus human handoff. Those are the flows most likely to reduce repetitive ticket load, improve trust, and support conversion."

### 0:55 - 1:20 | Architecture in plain English

Open the chat widget and briefly point to the integration cards or surrounding UI.

Say:

"The architecture is intentionally simple but production-shaped: a storefront chat UI, an orchestration layer that detects intent, grounded business services for products, orders, and policies, a human handoff path, and analytics logging. I grounded factual answers in structured data so the assistant does not hallucinate product, order, or refund information."

### 1:20 - 2:50 | Live demo of the core support flows

Use these prompts in order:

1. `Tell me about the Wireless Mouse`
2. `Where is my order KS-10421?`
3. `I need a refund`
4. `KS-10388`

Narration while demoing:

- For the product question:
  "This is the pre-purchase flow. It helps customers get fast product answers without waiting for an agent, which is where I expect support to reduce abandonment."
- For order tracking:
  "This is one of the highest-volume repetitive support requests in e-commerce, so it is a strong candidate for early automation."
- For refunds:
  "Here the bot asks a clarifying question first, because returns and refunds should follow policy and not guess. Once the order number is provided, it gives the next step based on grounded rules."

### 2:50 - 3:25 | Human handoff and trust

Use:

5. `I need a human agent`

Say:

"I deliberately included human handoff in the MVP because support bots should not force automation where trust is at risk. If the case is sensitive, unclear, or exception-heavy, the right behavior is escalation, not improvisation."

### 3:25 - 3:50 | Bilingual readiness

Switch to Arabic and use:

6. `أين طلبي KS-10421؟`

Say:

"Because this business operates in KSA, bilingual readiness matters. The prototype can already handle Arabic and English flows, which is important for regional support expectations."

### 3:50 - 4:20 | Design decisions and close

Keep the chat visible or return to the main storefront view.

Say:

"The main design choice here was to optimize for reliability over flash. I used structured product, order, and policy data first, optional AI composition second, and human handoff when confidence should not be assumed. That makes the system safer for customer support while still leaving a clear path to integrate with platforms like Shopify, Zendesk, or courier APIs later."

"If I extended this beyond the POC, I would add live CRM integration, WhatsApp as a channel, stronger analytics tied to support deflection and CSAT, and richer Arabic optimization. But for an MVP, this already proves the business value and the system direction."

## Backup shorter version

If you need to stay closer to `3:00`:

- Keep the same intro
- Demo only these prompts:
  - `Tell me about the Wireless Mouse`
  - `Where is my order KS-10421?`
  - `I need a refund`
  - `KS-10388`
  - `I need a human agent`
- Mention Arabic readiness without fully demoing it

## Optional stronger variant

If the app is running smoothly and you want a slightly stronger systems-thinking moment, add one short sentence while the storefront is visible:

"I embedded the chatbot inside the storefront instead of making it a separate toy interface, because the real goal is to support the buying journey and the post-purchase journey in the same product environment."

## Recording notes

- Do not read this word-for-word; use it as a speaking guide
- Keep your pace calm and confident
- Emphasize trade-offs and product judgment more than technical detail
- Avoid clicking around too much; the story should feel intentional
- If something loads slowly, pause instead of talking over it
- If OpenAI mode is disabled, say: "The prototype supports optional OpenAI reply composition, but defaults safely to deterministic grounded behavior for reviewer-friendly reliability."
