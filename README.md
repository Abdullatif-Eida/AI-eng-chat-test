# Lean Assist POC

Lean Assist is a small AI-first customer support chatbot prototype for the Lean Scale AI Product Engineer case study. It is designed for a mid-sized KSA e-commerce retailer and focuses on four MVP outcomes:

- Product information
- Order tracking
- Returns and refunds
- Human handoff

The implementation is intentionally dependency-light so reviewers can run it quickly.

## Run locally

```bash
npm start
```

Then open `http://localhost:3000`.

### Optional OpenAI mode

If `OPENAI_API_KEY` is present, the chatbot will use OpenAI's Responses API to compose grounded customer-facing replies from the structured commerce facts. If the key is missing, or if the API call fails, the app automatically falls back to the deterministic built-in responses.

Example:

```bash
OPENAI_API_KEY=your_key_here OPENAI_MODEL=gpt-5 npm start
```

## Run tests

```bash
npm test
```

## What is included

- A browser-based chat demo
- Mock catalog, order, and returns-policy data grounded in the supplied portfolio-company files
- Explicit mock integration map for catalog, orders, returns, and CRM handoff
- Multi-turn session handling for order lookups and refund flows
- Basic analytics log for intent, resolution type, and locale
- Arabic-aware locale detection with bilingual sample journeys
- Optional OpenAI-powered response composition with deterministic fallback
- Case-study docs for problem framing, solution design, tooling decisions, and demo script
- KSA-aligned policy grounding for returns, privacy, and terms responses

## Assumptions

- The portfolio company is a mid-sized e-commerce retailer operating in KSA.
- The first support channel is website chat, with future extension to WhatsApp and CRM/ticketing systems.
- The MVP should be bilingual-ready for Arabic and English, even if the demo is primarily in English.
- Product facts, order data, and refund policies should come from trusted systems, not free-form generation.
- Human handoff is part of the MVP because confidence fallback is important for trust and CSAT.

## Suggested demo prompts

- `Tell me about the Wireless Mouse`
- `Show me products`
- `How do returns work?`
- `Create a demo order, then ask where it is`
- `I want to speak to a human agent`
- `اعرض المنتجات`
