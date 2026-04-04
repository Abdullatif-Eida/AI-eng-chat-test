# AI Commerce Support Agent

This project is an AI-first customer support agent prototype for a generic e-commerce case study. It focuses on four MVP outcomes:

- Product information
- Order tracking
- Returns and refunds
- Human handoff

The implementation is intentionally dependency-light so reviewers can run it quickly.

## Submission links

- Live site: [https://chat-bot-case.netlify.app](https://chat-bot-case.netlify.app)

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Configure the OpenRouter key on the server side.

For local development:

```bash
export OPENROUTER_API_KEY="your_openrouter_key_here"
export OPENROUTER_MODEL="openrouter/free"
```

For Netlify:

- Set `OPENROUTER_API_KEY` in the Netlify site environment variables.
- You can also use `NETLIFY_OPENROUTER_API_KEY` if you want a Netlify-specific secret name.
- Do not expose the key in client-side code.

To connect real commerce systems instead of the seeded provider, you can also set:

- `COMMERCE_API_BASE_URL`
- `COMMERCE_API_KEY` (optional bearer token)
- `COMMERCE_API_HEADERS_JSON` (optional JSON object for extra headers)
- `COMMERCE_CUSTOMER_PROFILE_PATH` default: `/customers/profile?email={email}`
- `COMMERCE_CUSTOMER_ORDERS_PATH` default: `/orders?email={email}`
- `COMMERCE_ORDER_DETAILS_PATH` default: `/orders/{orderNumber}`

These paths support `{email}`, `{customerId}`, and `{orderNumber}` placeholders.

The backend also accepts an override header named `x-openrouter-key` on `/api/chat`, but that should only be used by trusted server-to-server callers.

Optional debug-only routes:

- Set `ENABLE_DEBUG_API_ROUTES=true` only in local review/demo environments if you want `GET /api/analytics` or `GET /api/orders`.
- These routes are disabled by default in secure mode so broad internal data is not exposed accidentally.

3. Start the local server:

```bash
npm start
```

4. Open `http://localhost:3000`.

## Run tests

After installing dependencies, run:

```bash
npm test
```

## Reviewer notes

- This project is designed to be reviewed from source code directly, including a zip or shared folder.
- `npm start` builds the frontend bundle and starts the local server on port `3000`.
- The chatbot is OpenRouter-only and requires a valid server-side OpenRouter key.
- The default model is `openrouter/free`, so the app stays on OpenRouter's zero-cost router unless you explicitly override `OPENROUTER_MODEL`.
- The recommended production setup is a Netlify environment variable, not a browser-exposed key.
- If `COMMERCE_API_BASE_URL` is configured, the tool layer will use your real commerce APIs; otherwise it uses the seeded provider bundled with the project.

## What is included

- A browser-based chat experience
- Catalog, order, and policy data adapters that can sit behind real commerce APIs
- Explicit mock integration map for catalog, orders, returns, and CRM handoff
- Multi-turn session handling for order lookups and refund flows
- Basic analytics log for intent, resolution type, and locale
- Arabic-aware locale detection with bilingual sample journeys
- OpenRouter Responses API orchestration over trusted commerce tools
- Dedicated outbound tokenization layer so emails, order numbers, and similar identifiers are not sent raw to OpenRouter
- Provider-based commerce backend integration, ready for existing profile, order, and tracking APIs
- Case-study docs for problem framing, solution design, and tooling decisions
- KSA-aligned policy grounding for returns, privacy, and terms responses

## Assumptions

- The portfolio company is a mid-sized e-commerce retailer operating in KSA.
- The first support channel is website chat, with future extension to WhatsApp and CRM/ticketing systems.
- The MVP should be bilingual-ready for Arabic and English.
- Product facts, order data, and refund policies should come from trusted systems, not free-form generation.
- Human handoff is part of the MVP because confidence fallback is important for trust and CSAT.

## Suggested prompts

- `Tell me about the Wireless Mouse`
- `Show me products`
- `How do returns work?`
- `Create an order, then ask where it is`
- `I want to speak to a human agent`
- `اعرض المنتجات`
