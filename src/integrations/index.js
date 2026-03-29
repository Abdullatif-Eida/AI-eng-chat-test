
// simple file that lists the mocked external systems your chatbot is designed to use, 
// so the app can show how it would connect to real services later.

export const integrationMap = [
  {
    id: "catalog",
    name: "Product Catalog",
    type: "Mock commerce API",
    productionExamples: ["Shopify Storefront API", "Medusa", "Custom catalog service"],
    purpose: "Grounds product questions in trusted product, stock, and pricing data."
  },
  {
    id: "orders",
    name: "Order Management",
    type: "Mock order service",
    productionExamples: ["OMS / ERP", "3PL tracking provider", "Internal order service"],
    purpose: "Provides live order status, ETA, courier, and payment-state lookups."
  },
  {
    id: "returns",
    name: "Returns Policy Engine",
    type: "Mock policy service",
    productionExamples: ["Policy engine", "Help center rules", "Returns operations backend"],
    purpose: "Handles return-window rules, refund timing, and exception handling."
  },
  {
    id: "crm",
    name: "CRM / Handoff",
    type: "Mock support integration",
    productionExamples: ["Zendesk", "Freshdesk", "Intercom", "HubSpot"],
    purpose: "Routes sensitive or uncertain cases to a human support queue with summary context."
  }
];

// “this chatbot gets product facts from a catalog system”
// “this chatbot gets order status from an order system”
// “this chatbot gets return rules from a returns system”
// “this chatbot sends hard cases to a CRM/human support system”