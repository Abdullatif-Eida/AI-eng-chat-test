# System Architecture

## Goal

Build a generic e-commerce support agent that behaves like a strong human support rep, while keeping business truth, security rules, and side effects in deterministic backend code.

This project intentionally separates:

- conversation and judgment
- trusted business data
- outbound AI data sharing controls
- policy enforcement
- session memory and retention
- response structure and failure normalization

That split is the core move away from a regex chatbot.

## High-Level Design

### 1. OpenRouter orchestration layer

File: [src/lib/aiProvider.js](/Users/abdullatifeida/abdullatif_eida/new/src/lib/aiProvider.js)

Responsibilities:

- understand natural customer messages
- choose the next best action
- ask follow-up questions
- call backend tools
- produce the final human-like response

Important constraint:

- the model is not the source of truth for orders, profiles, products, or policies

Important update:

- the model now returns a strict structured reply contract
- intent, confidence, and resolution metadata are no longer inferred from brittle post-processing rules
- the default runtime is now tuned for `deepseek/deepseek-v3.2` on OpenRouter
- simple turns keep reasoning disabled and output budgets tight for lower cost
- more complex turns enable hidden reasoning plus required-parameter routing for stronger tool reliability
- customer/profile/order/policy/handoff turns now use an app-enforced tool-choice guardrail, so sensitive support flows do not depend on the model spontaneously deciding to ground itself
- simple public turns still prefer lower-cost provider routing, while more sensitive tool-heavy turns leave provider ordering open so OpenRouter can apply its stronger tool-calling routing defaults
- external routing denies provider-side data collection by default and can require ZDR-compatible routing through environment flags

### 2. Support brain runtime

File: [src/lib/supportBrain.js](/Users/abdullatifeida/abdullatif_eida/new/src/lib/supportBrain.js)

Responsibilities:

- define the final response schema used with OpenAI Structured Outputs
- choose the model tier using conversation complexity rather than intent regexes
- encode support edge-case instructions for ambiguity, prompt injection, identity checks, and latest-order handling
- normalize safe fallbacks when the model response is incomplete but tool output is still usable

Why this matters:

- the chatbot brain is now shaped as an explicit runtime contract, not scattered heuristics
- edge-case behavior is easier to reason about, test, and evolve
- prompt instructions stay mostly stable across turns, which is friendlier to OpenRouter prompt caching than re-sending dynamic summaries in the system prompt

### 3. External AI data protection gateway

Files:

- [src/lib/dataProtection.js](/Users/abdullatifeida/abdullatif_eida/new/src/lib/dataProtection.js)
- [src/lib/externalSharing.js](/Users/abdullatifeida/abdullatif_eida/new/src/lib/externalSharing.js)

Responsibilities:

- tokenize sensitive values before anything is sent to OpenAI
- resolve those tokens back to raw values only inside the trusted backend
- keep session memory tokenized so raw emails and order numbers are not retained in model history
- tokenize accidental bearer tokens and JWT-like secrets before outbound sharing
- apply per-tool sharing contracts so only approved fields leave the trusted backend
- redact secret-shaped object fields like `apiKey`, `accessToken`, `authorization`, and cookies before outbound sharing
- cap nested depth, array size, object width, and string length before external-model sharing
- hash analytics session references so debug views do not expose raw session identifiers

Examples:

- `maha@example.com` becomes `[[email_1]]` for the model
- `KS-10421` becomes `[[order_1]]` for the model
- final shopper replies are detokenized on the server before they are returned

Why this matters:

- the model can still reason over account/order flows without receiving raw identifiers
- the app now has a dedicated outbound-sharing boundary with explicit tool allowlists instead of scattered redaction logic
- oversized or unexpectedly rich tool payloads cannot silently turn into retention or leakage risks

### 4. Tool layer

File: [src/lib/agentTools.js](/Users/abdullatifeida/abdullatif_eida/new/src/lib/agentTools.js)

Responsibilities:

- expose safe, narrow actions to the model
- validate and scope access per customer/session
- control caching
- return sanitized data back to the model
- avoid retaining raw sensitive text in cache and idempotency keys

Current tool set:

- `get_customer_profile`
- `search_catalog`
- `get_policy_information`
- `list_customer_orders`
- `get_order_details`
- `get_return_options`
- `get_cancellation_options`
- `create_handoff`

### 5. Commerce provider layer

File: [src/lib/commerceProvider.js](/Users/abdullatifeida/abdullatif_eida/new/src/lib/commerceProvider.js)

Responsibilities:

- act as the backend source of truth for profile/order/catalog/policy data
- hide whether the data comes from in-project seeded data or real HTTP APIs

Current provider options:

- `createSeededCommerceProvider()`
- `createHttpCommerceProvider()`
- `createCommerceProviderFromEnv()`

Current order behavior:

- visible orders are deduplicated and sorted newest-first so “latest order” has a deterministic meaning

Why this matters:

- the agent architecture stays stable even if the backend changes later
- existing commerce APIs can be added without rewriting the chatbot again

### 6. Session and retention layer

File: [src/lib/chatbot.js](/Users/abdullatifeida/abdullatif_eida/new/src/lib/chatbot.js)

Responsibilities:

- keep short-lived session context
- keep model-facing memory tokenized rather than raw
- cap message history
- expire inactive sessions
- avoid retaining customer identity indefinitely

Current behavior:

- session TTL: 30 minutes
- max remembered history: 16 entries
- max stored analytics events: 200
- retained cache/idempotency values are also size-bounded, so oversized payloads are dropped instead of quietly inflating memory use
- input message length is capped before processing
- shopper identity switches reset tokenized history, cache, and idempotency state inside the same session
- session analytics use hashed `sessionRef` values instead of raw `sessionId`
- cache and handoff state live in bounded retention-aware stores so long sessions do not grow indefinitely
- order-detail cache stores minimized order summaries instead of raw provider objects
- HTTP entrypoints now keep a server-managed, TTL-bounded list of session-created demo orders so the browser does not have to send untrusted `knownOrders` back into the trusted AI path

### 7. UI layer

Files:

- [src/client/main.jsx](/Users/abdullatifeida/abdullatif_eida/new/src/client/main.jsx)
- [public/styles.css](/Users/abdullatifeida/abdullatif_eida/new/public/styles.css)

Responsibilities:

- create a premium messaging-style experience
- make the conversation feel human and familiar
- show user messages on the right and assistant messages on the left

## Why This Is Better Than Regex

The original problem was not just “bad matching.” It was that the architecture treated support as intent classification instead of agentic problem-solving.

Regex approach:

- guess the intent
- branch to a fixed answer
- fail on messy real language
- cannot scale to nuanced support

Current approach:

- model understands the request
- model chooses tools
- backend enforces truth and safety
- response stays natural even when the path is complex
- final output shape is enforced by schema instead of guessed after the fact

## Why This Is Still Honest

This repository does not yet have external commerce services. Because of that, the current provider uses in-project data by default.

That is still a valid case-study architecture because:

- the chatbot brain is no longer hard-coded
- the chatbot brain is no longer regex-driven for intent and reply shaping
- the tool layer is generic
- the provider abstraction is ready for real APIs
- the edge-case thinking is already in the design

## What Would Be Next In Production

- replace the seeded provider with real profile/order/shipment services
- add authenticated session tokens instead of local profile submission
- add durable audit storage with redaction
- move the tokenization gateway into a standalone service or middleware for multi-channel reuse
- disable any request-scoped external-model key overrides except for trusted internal hops
- add moderation and abuse controls
- add replay/eval datasets from real support transcripts
- add offline evals against the structured reply contract
