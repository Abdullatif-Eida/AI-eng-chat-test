# Problem Definition

## Business context

The client is a mid-sized KSA e-commerce retailer whose manual support model is no longer scaling. The brief gives three linked signals:

- average response time: `8-12 hours`
- `CSAT/NPS` down `15%` over the last quarter
- cart abandonment `7%` above the industry average

This means support is no longer just an operations issue. It is now hurting revenue, trust, and the company’s ability to scale efficiently.

## Core problem

The retailer does not primarily have a "chatbot problem." It has a `first-response` and `support-design` problem:

- repetitive questions are consuming human-agent capacity
- customers cannot get fast, trustworthy answers at the moment of decision
- the business lacks a structured way to resolve routine cases instantly and escalate risky cases safely

The right MVP is therefore not full support automation. It is a trusted AI-first support layer for the highest-volume journeys.

## Where the business is breaking

1. `Pre-purchase`: shoppers do not get timely product and delivery answers, which increases abandonment.
2. `Post-purchase`: customers wait too long for order, return, and refund updates, which drives repeat contacts and lower satisfaction.
3. `Operations`: manual agents are spending too much time on low-complexity tickets, which slows response times for higher-value cases.

## Root causes

- Agents spend too much time on repetitive requests that should be automated or triaged earlier.
- Product, order, and policy information is not surfaced instantly through self-service support.
- There is no clear fallback path for uncertain, sensitive, or exception-heavy cases.
- The support experience likely lacks strong Arabic/English readiness for the KSA market.

## What the client did not explicitly ask for but still needs

- `Human handoff`: a support bot without escalation will damage trust on exceptions.
- `Grounded answers`: order status, returns, and policies must come from trusted systems, not free-form generation.
- `Bilingual readiness`: Arabic and English support is essential for KSA operations.
- `Analytics`: the POC should capture intent mix, handoff rate, and containment signals so the business can prove ROI.

## Assumptions

- The retailer is a mid-sized KSA online store focused on consumer electronics, accessories, and wearables.
- Website chat is the first MVP channel, with future extension to WhatsApp and helpdesk/CRM systems.
- The three highest-value intents for a POC are product information, order tracking, and returns/refunds.
- Human handoff should be part of the MVP.
- The POC can use mock commerce, order, and policy services as long as the interfaces clearly map to real integrations later.

## Questions I would validate with the client next

- Which ticket categories drive the highest volume today: delivery ETA, returns, product fit, payment issues, or something else?
- Which systems are the system of record for catalog, order status, and support tickets?
- What SLAs and escalation rules already exist for refunds, damaged items, VIP customers, and Arabic-language support?

## MVP scope

The MVP should prove four things quickly:

- product information answers can support conversion
- order tracking can deflect repetitive tickets
- returns/refunds guidance can protect trust
- human handoff can safely catch low-confidence or exception cases

The goal is not to replace the full support team. The goal is to prove that an AI-first support layer can reduce response time for routine inquiries and create a scalable foundation for future channels and integrations.

## Success metrics

- first response time
- containment rate for supported intents
- human handoff rate for sensitive cases
- CSAT/NPS recovery
- reduced repetitive ticket load
- reduced cart abandonment on assisted pre-purchase journeys

Suggested visual: `Diagram 1: Problem and impact map` from [mermaid-diagrams.md](/Users/abdullatifeida/abdullatif_eida/new/docs/mermaid-diagrams.md)
