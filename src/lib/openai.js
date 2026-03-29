
// The optional AI layer that sends grounded facts to the OpenAI API to generate a nicer reply, while falling back to the normal 
// deterministic response if no API key is set or the call fails.

const OPENAI_API_URL = "https://api.openai.com/v1/responses";

function extractOutputText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const parts = [];
  for (const outputItem of payload?.output ?? []) {
    for (const contentItem of outputItem?.content ?? []) {
      if (contentItem?.type === "output_text" && contentItem.text) {
        parts.push(contentItem.text);
      }
    }
  }

  return parts.join("\n").trim();
}

export function createOpenAIComposer() {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-5";

  if (!apiKey) {
    return {
      enabled: false,
      model: null,
      async composeReply({ fallbackReply }) {
        return fallbackReply;
      }
    };
  }

  return {
    enabled: true,
    model,
    async composeReply({
      locale,
      intent,
      customerMessage,
      structuredFacts,
      fallbackReply
    }) {
      const instructions =
        locale === "ar"
          ? [
              "أنت مساعد دعم عملاء لمتجر تجارة إلكترونية في السعودية.",
              "استخدم فقط الحقائق المعطاة لك في structured facts.",
              "لا تخترع أي معلومات عن الطلب أو المنتج أو السياسة.",
              "إذا كانت الحقائق لا تكفي، التزم بالرد الاحتياطي.",
              "اكتب رداً موجزاً وواضحاً وودوداً بالعربية."
            ].join(" ")
          : [
              "You are a customer support assistant for a KSA e-commerce retailer.",
              "Use only the facts given in the structured facts section.",
              "Do not invent any product, order, refund, or policy details.",
              "If the facts are insufficient, stay close to the provided fallback reply.",
              "Write a concise, helpful, trustworthy reply in the same language as the customer."
            ].join(" ");

      const input = [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                `Intent: ${intent}`,
                `Customer message: ${customerMessage}`,
                `Locale: ${locale}`,
                `Structured facts: ${JSON.stringify(structuredFacts)}`,
                `Fallback reply: ${fallbackReply}`,
                "Return a single support response only."
              ].join("\n")
            }
          ]
        }
      ];

      try {
        const response = await fetch(OPENAI_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            instructions,
            input
          })
        });

        if (!response.ok) {
          return fallbackReply;
        }

        const payload = await response.json();
        return extractOutputText(payload) || fallbackReply;
      } catch {
        return fallbackReply;
      }
    }
  };
}
