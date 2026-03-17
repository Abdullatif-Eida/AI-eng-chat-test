# Mermaid Diagrams Pack

These diagrams are written as clean Mermaid blocks so they can be pasted directly into Mermaid Live or exported as images for the final submission.

Recommended use:

- Problem Definition document:
  - Diagram 1: Problem and impact map
  - Diagram 2: MVP scope and success metrics
- Solution Design document:
  - Diagram 3: System architecture
  - Diagram 4: Core user interaction flow
  - Diagram 5: Design choices and prioritization

## Diagram 1: Problem and impact map

```mermaid
flowchart TD
    A["Growing support volume"] --> B["Manual agent-heavy support model"]
    B --> C["Slow response times: 8 to 12 hours"]
    B --> D["Inconsistent handling of routine questions"]

    C --> E["Customer frustration"]
    D --> E

    E --> F["CSAT and NPS down 15 percent"]
    E --> G["Cart abandonment 7 percent above industry average"]

    H["Missing self-service layer"] --> B
    I["No automated triage"] --> B
    J["Product, order, and policy data not surfaced instantly"] --> B
    K["No clear fallback to human support"] --> B

    F --> L["Lower trust and weaker retention"]
    G --> M["Lost revenue and weaker conversion"]
```

## Diagram 2: MVP scope and success metrics

```mermaid
flowchart LR
    A["MVP support chatbot"] --> B["Product information"]
    A --> C["Order tracking"]
    A --> D["Returns and refunds"]
    A --> E["Human handoff"]

    B --> F["Reduce pre-purchase friction"]
    C --> G["Reduce repetitive support load"]
    D --> H["Improve post-purchase trust"]
    E --> I["Protect customer experience on exceptions"]

    F --> J["Lower cart abandonment"]
    G --> K["Faster first response time"]
    H --> L["Improve CSAT and NPS"]
    I --> L
```

## Diagram 3: System architecture

```mermaid
flowchart LR
    A["Customer channel\nWeb chat now, WhatsApp later"] --> B["Chat orchestrator"]
    B --> C["Intent and policy layer"]

    C --> D["Product catalog service"]
    C --> E["Order service"]
    C --> F["Returns and refund policy service"]
    C --> G["Human handoff and CRM ticketing"]
    C --> H["Analytics and observability"]

    D --> I["Commerce platform\nShopify, Medusa, custom backend"]
    E --> J["OMS, ERP, courier tracking"]
    F --> K["Policy engine or help center rules"]
    G --> L["Zendesk, Freshdesk, Intercom, HubSpot"]
```

## Diagram 4: Core user interaction flow

```mermaid
flowchart TD
    A["Customer sends message"] --> B["Detect intent"]
    B --> C{"Intent type"}

    C -->|"Product information"| D["Search product catalog"]
    C -->|"Order tracking"| E{"Order number provided"}
    C -->|"Returns and refunds"| F{"Order number provided"}
    C -->|"Unclear or sensitive"| G["Escalate to human agent"]

    D --> H["Return grounded product details"]

    E -->|"No"| I["Ask for order number"]
    I --> J["Lookup order"]
    E -->|"Yes"| J
    J --> K{"Order found"}
    K -->|"Yes"| L["Return status, ETA, and order summary"]
    K -->|"No"| G

    F -->|"No"| M["Ask for order number"]
    M --> N["Check return eligibility and policy"]
    F -->|"Yes"| N
    N --> O{"Eligible and straightforward"}
    O -->|"Yes"| P["Explain next refund step"]
    O -->|"No"| G

    H --> Q["Log analytics event"]
    L --> Q
    P --> Q
    G --> Q
```

## Diagram 5: Design choices and prioritization

```mermaid
flowchart TD
    A["Design choices"] --> B["Why these four MVP flows first"]
    A --> C["Why grounded data over free-form answers"]
    A --> D["Why human handoff is part of the MVP"]
    A --> E["Why web chat is the first channel"]

    B --> F["Highest support volume"]
    B --> G["Fastest path to measurable business value"]

    C --> H["Lower hallucination risk"]
    C --> I["More trust for product, order, and refund answers"]

    D --> J["Protect CSAT on exceptions"]
    D --> K["Avoid false confidence from the bot"]

    E --> L["Fastest to prototype and review"]
    E --> M["Easy to extend to WhatsApp and CRM systems"]
```

## Optional Diagram 6: Delivery roadmap

```mermaid
flowchart LR
    A["Phase 1\nPOC"] --> B["Phase 2\nProduction hardening"]
    B --> C["Phase 3\nOmnichannel expansion"]

    A --> A1["Product info"]
    A --> A2["Order tracking"]
    A --> A3["Returns and refunds"]
    A --> A4["Human handoff"]

    B --> B1["Live commerce integrations"]
    B --> B2["LLM reply composition"]
    B --> B3["Analytics dashboard"]
    B --> B4["Operational guardrails"]

    C --> C1["WhatsApp support"]
    C --> C2["CRM automation"]
    C --> C3["Arabic response optimization"]
    C --> C4["Support deflection reporting"]
```
