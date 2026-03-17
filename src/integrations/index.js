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
