# Support Bot Edge Cases Summary

This support bot handles the main risks around security, memory, retention, and cache by keeping identity, permissions, and data boundaries in the backend rather than trusting the model alone.

## Security

Customer-specific order access always goes through the tool layer and requires verified customer context. Even if a shopper enters a valid order number, the provider checks that the order belongs to that customer. If it does not match, the bot returns a safe "not found" result instead of leaking another shopper's data.

Prompt-injection attempts are also limited by architecture. The model is told that tools are the only source of truth, and the backend still enforces access rules. Sensitive values such as emails, order numbers, phone numbers, payment-like strings, bearer tokens, JWTs, and handoff IDs are tokenized before they are shared externally. Tool outputs are allowlisted, secret-shaped fields are redacted, and oversized payloads are truncated.

## Memory And Retention

The bot uses session memory, not long-term memory. History is capped, stored in tokenized form, and expires after a fixed window. The current setup uses a 30-minute session TTL and keeps up to 16 history entries. If the verified shopper identity changes within the same session, protected history, cache, and handoff deduplication state are reset to avoid cross-shopper bleed.

Retention is privacy-first. OpenRouter requests use `store: false`, provider-side data collection is denied by default, analytics are bounded in memory, raw session IDs are replaced with hashed references, and there is no durable transcript store in this project.

## Cache

Cache keys are scoped by authenticated customer or session, so one shopper cannot receive another shopper's cached order data. Order cache is intentionally short at 30 seconds, while catalog cache is 5 minutes and policy cache is 10 minutes. Human handoff creation is also idempotent within a bounded window, and that deduplication is customer-scoped.

## Expected Behavior

- missing identity leads to a verification request, not a guessed answer
- wrong identity leads to a safe "not found" result
- rapid duplicate turns are deduplicated or rate-limited
- transient provider failures are retried before fallback
- malformed structured output can fall back to the latest safe tool response
- debug analytics and raw order endpoints stay disabled unless explicitly enabled

## Remaining Production Gaps

- real authenticated customer sessions
- moderation and abuse detection
- durable redacted audit logging
- formal vendor and channel DLP review
- broader prompt-injection evaluation
- approval-based flows for live refunds or cancellations

## Conclusion

The key strength of this bot is that risky decisions are not left to the model alone. Security, memory, retention, and cache boundaries are enforced in the backend, which makes the system safer while still keeping the conversation natural for shoppers.
