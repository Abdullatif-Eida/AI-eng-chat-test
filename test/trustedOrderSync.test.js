import test from "node:test";
import assert from "node:assert/strict";
import { mergeTrustedKnownOrders } from "../src/lib/trustedOrderSync.js";

test("prefers browser-visible orders when merging chat-known orders with server session orders", () => {
  const merged = mergeTrustedKnownOrders(
    [
      { orderNumber: "KS-10499", email: "shopper@example.com", status: "Delivered" },
      { orderNumber: "KS-10540", email: "shopper@example.com", status: "Shipped" }
    ],
    [
      { orderNumber: "ks-10540", email: "shopper@example.com", status: "Processing", items: ["1x Mechanical Keyboard"] }
    ]
  );

  assert.deepEqual(merged, [
    {
      orderNumber: "KS-10540",
      email: "shopper@example.com",
      status: "Processing",
      items: ["1x Mechanical Keyboard"]
    },
    {
      orderNumber: "KS-10499",
      email: "shopper@example.com",
      status: "Delivered"
    }
  ]);
});

test("ignores invalid order entries while merging trusted known orders", () => {
  const merged = mergeTrustedKnownOrders(
    [{ orderNumber: "KS-10540", email: "shopper@example.com" }],
    [null, {}, { orderNumber: " ", email: "shopper@example.com" }, { orderNumber: "KS-10541", email: "shopper@example.com" }]
  );

  assert.deepEqual(merged, [
    { orderNumber: "KS-10541", email: "shopper@example.com" },
    { orderNumber: "KS-10540", email: "shopper@example.com" }
  ]);
});
