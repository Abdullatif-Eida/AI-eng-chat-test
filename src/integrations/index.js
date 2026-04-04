
// Reference integrations exposed in the UI to show the systems the assistant
// can sit on top of in a production e-commerce stack.

export const integrationMap = [
  {
    id: "data-protection",
    name: "AI Data Protection Gateway",
    type: "Security boundary",
    productionExamples: ["Tokenization service", "PII redaction layer", "Outbound policy gateway"],
    purpose: "Minimizes, tokenizes, and controls what leaves the trusted backend before any external AI call."
  },
  {
    id: "catalog",
    name: "Product Catalog",
    type: "Commerce API",
    productionExamples: ["Shopify Storefront API", "Medusa", "Custom catalog service"],
    purpose: "Grounds product questions in trusted product, stock, and pricing data."
  },
  {
    id: "orders",
    name: "Order Management",
    type: "Order service",
    productionExamples: ["OMS / ERP", "3PL tracking provider", "Internal order service"],
    purpose: "Provides live order status, ETA, courier, and payment-state lookups."
  },
  {
    id: "returns",
    name: "Returns Policy Engine",
    type: "Policy service",
    productionExamples: ["Policy engine", "Help center rules", "Returns operations backend"],
    purpose: "Handles return-window rules, refund timing, and exception handling."
  },
  {
    id: "crm",
    name: "CRM / Handoff",
    type: "Support integration",
    productionExamples: ["Zendesk", "Freshdesk", "Intercom", "HubSpot"],
    purpose: "Routes sensitive or uncertain cases to a human support queue with summary context."
  }
];
