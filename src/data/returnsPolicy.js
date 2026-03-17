import { storePolicies } from "./policies.js";

export const returnsPolicy = {
  standardWindowDays: storePolicies.returns.windowDays,
  refundTimeline:
    "Refunds are processed to the original payment method within 4 business days of receiving the returned item.",
  rules: storePolicies.returns.highlights.en
};
