const copy = {
  en: {
    welcome:
      "Hi, I'm Lean Assist. I can help with product information, recommendations, order tracking, delivery questions, returns/refunds, cancellations, payment questions, privacy and terms, or connect you to a human agent.",
    greeting:
      "Hi there. I can help you choose a product, compare options, track an order, explain returns, answer payment or policy questions, or connect you to a human agent. What would you like to do?",
    generalHelp:
      "Absolutely. You can ask me things like: recommend a product, compare products, show what products you sell, explain product details, track an order with a number like KS-10421, explain returns and refunds, answer payment or privacy questions, or connect you to a human agent.",
    catalogBrowse:
      "I can show you products by category or recommend the right option for your use case. Tell me a category like accessories, smart home, wearables, or audio, or say what you need it for, like travel, work, or home.",
    personalizedWelcome:
      "Hi {name}, thanks for sharing your details. I’m ready to help with products, orders, returns, delivery, payments, privacy and legal questions, or a human handoff.",
    askOrderNumber: "Please share your order number, for example KS-10421.",
    askProductName:
      "Tell me the product name, category, or what you need it for, and I’ll narrow the options for you.",
    askUseCase:
      "Tell me what you need it for, such as travel, work, gaming, home, fitness, or audio, and I’ll recommend the best options.",
    askReturnOrder:
      "I can help with returns and refunds. Please share your order number first.",
    askCancellationOrder:
      "I can check cancellation or order-change options. Please share your order number first.",
    handoff:
      "I've created a human support handoff recommendation with the issue summary so an agent can continue quickly.",
    fallback:
      "I’m not fully confident I understood that yet, but I can still help. Try asking for a product by name or category, ask me to show products, share an order number like KS-10421, ask about returns, payments, privacy, or say you want a human agent.",
    orderNotFound:
      "I couldn't find {orderNumber}. Please double-check the order number or ask for a human agent.",
    productDetails:
      "{title}\n\nPrice: {price} {currency}\nDescription: {description}\nSize: {size}\nHighlights: {highlights}\nColors: {colors}",
    categoryOptions:
      "I found these options in {category}:\n{items}\n\nTell me which one you want details about.",
    recommendationReply:
      "Based on your request, I’d shortlist:\n{items}\n\n{guidance}",
    recommendationGuidance:
      "If you tell me whether you care more about budget, audio quality, portability, or fitness use, I can narrow it further.",
    orderDetails:
      "Order: {orderNumber}\nStatus: {status}\nETA: {eta}\nItems: {items}\nCourier: {courier}\nPayment: {paymentStatus}",
    returnException:
      "{reason} A human agent can review exceptions like damaged or wrong-item cases.",
    returnEligible:
      "{reason} Refunds are processed to the original payment method within 4 business days after the returned item is received and approved.",
    shippingInfo:
      "Standard delivery usually reaches Riyadh, Jeddah, and Dammam within 1-3 business days. Fees depend on the order value and city, and tracking activates as soon as the courier is assigned.",
    paymentInfo:
      "This store can support card payments, mada, Apple Pay, and cash on delivery where available. Paid orders move faster, while COD orders may need address confirmation before shipping.",
    cancellationEligible:
      "Order {orderNumber} is still in {status}, so cancellation or address updates may still be possible. I recommend escalating it now so the team can action it before shipping.",
    cancellationLocked:
      "Order {orderNumber} is already {status}, so direct cancellation is no longer available. The best next step is a return request or a human agent review.",
    addressChangeEligible:
      "Order {orderNumber} is still in {status}, so a delivery address update may still be possible. I recommend escalating it now so the team can update it before shipping.",
    addressChangeLocked:
      "Order {orderNumber} is already {status}, so the delivery address can no longer be changed directly. The best next step is a human agent review, or later a return request if needed.",
    policyInfo:
      "I can explain the return policy, privacy policy, terms and conditions, delivery rules, payment handling, or contact options. Tell me which policy topic you want.",
    askContactPreference:
      "If you want a human follow-up, share the best email or phone number and I’ll attach it to the handoff summary.",
    promptForMore:
      "I can continue if you share the order number, product name, or what outcome you want help with.",
    typing: "Typing…"
  },
  ar: {
    welcome:
      "مرحباً، أنا Lean Assist. أستطيع مساعدتك في معلومات المنتجات، الترشيحات، تتبع الطلبات، أسئلة التوصيل، الإرجاع والاسترداد، الإلغاء، الدفع، وسياسة الخصوصية والشروط، أو تحويلك إلى موظف خدمة عملاء.",
    greeting:
      "مرحباً بك. أستطيع مساعدتك في اختيار منتج، مقارنة الخيارات، تتبع الطلب، شرح الإرجاع والاسترداد، الإجابة عن الدفع والسياسات، أو تحويلك إلى موظف خدمة عملاء. كيف أقدر أساعدك؟",
    generalHelp:
      "أكيد. يمكنك أن تسألني مثلاً عن ترشيح منتج، مقارنة المنتجات، عرض المنتجات المتوفرة، شرح تفاصيل منتج، تتبع طلب برقم مثل KS-10421، شرح الإرجاع والاسترداد، الإجابة عن الدفع أو الخصوصية، أو التحويل إلى موظف خدمة عملاء.",
    catalogBrowse:
      "أستطيع عرض المنتجات حسب الفئة أو ترشيح الأنسب حسب استخدامك. اذكر فئة مثل الإكسسوارات أو المنزل الذكي أو الصوتيات، أو اذكر الاستخدام مثل السفر أو العمل أو المنزل.",
    personalizedWelcome:
      "مرحباً {name}، شكرًا لمشاركة بياناتك. أنا جاهز لمساعدتك في المنتجات، الطلبات، الإرجاع، التوصيل، الدفع، وأسئلة الخصوصية والشروط، أو التحويل إلى موظف خدمة عملاء.",
    askOrderNumber: "يرجى مشاركة رقم الطلب، مثل KS-10421.",
    askProductName:
      "اذكر اسم المنتج أو الفئة أو الغرض الذي تحتاجه له، وسأرشح لك الأنسب.",
    askUseCase:
      "اذكر الاستخدام الذي تريده مثل السفر أو العمل أو الألعاب أو المنزل أو الرياضة أو الصوتيات، وسأرشح لك الأنسب.",
    askReturnOrder: "أستطيع مساعدتك في الإرجاع والاسترداد. شاركني رقم الطلب أولاً.",
    askCancellationOrder:
      "أستطيع التحقق من الإلغاء أو تعديل الطلب. شاركني رقم الطلب أولاً.",
    handoff:
      "أنشأت ملخصاً للتحويل إلى موظف خدمة العملاء حتى يتمكن من المتابعة بسرعة.",
    fallback:
      "قد لا أكون فهمت طلبك بالكامل بعد، لكن ما زلت أستطيع مساعدتك. جرّب أن تذكر اسم المنتج أو الفئة، أو اطلب مني عرض المنتجات، أو شاركني رقم طلب مثل KS-10421، أو اسأل عن الإرجاع أو الدفع أو الخصوصية، أو اطلب موظف خدمة عملاء.",
    orderNotFound:
      "لم أتمكن من العثور على الطلب {orderNumber}. يرجى التحقق من الرقم أو طلب التحويل إلى موظف خدمة عملاء.",
    productDetails:
      "{title}\n\nالسعر: {price} {currency}\nالوصف: {description}\nالمقاس: {size}\nالمزايا: {highlights}\nالألوان: {colors}",
    categoryOptions:
      "وجدت هذه الخيارات ضمن فئة {category}:\n{items}\n\nأخبرني أي منتج تريد تفاصيله.",
    recommendationReply:
      "بناءً على طلبك، أرشح لك:\n{items}\n\n{guidance}",
    recommendationGuidance:
      "إذا أخبرتني هل تهمك الميزانية أو جودة الصوت أو سهولة الحمل أو الاستخدام الرياضي، أقدر أحدد لك الأنسب.",
    orderDetails:
      "رقم الطلب: {orderNumber}\nالحالة: {status}\nالموعد المتوقع: {eta}\nالمنتجات: {items}\nشركة الشحن: {courier}\nحالة الدفع: {paymentStatus}",
    returnException:
      "{reason} يمكن لموظف خدمة العملاء مراجعة الحالات الاستثنائية مثل المنتج التالف أو المنتج الخاطئ.",
    returnEligible:
      "{reason} يتم رد المبلغ إلى وسيلة الدفع الأصلية خلال 4 أيام عمل بعد استلام المنتج وإقرار الموافقة عليه.",
    shippingInfo:
      "التوصيل المعتاد يصل إلى الرياض وجدة والدمام خلال 1 إلى 3 أيام عمل. الرسوم تعتمد على قيمة الطلب والمدينة، ويظهر التتبع بمجرد تعيين شركة الشحن.",
    paymentInfo:
      "يمكن للمتجر دعم البطاقات البنكية ومدى وApple Pay والدفع عند الاستلام حسب التوفر. الطلبات المدفوعة تتحرك أسرع، أما الدفع عند الاستلام فقد يحتاج لتأكيد العنوان قبل الشحن.",
    cancellationEligible:
      "الطلب {orderNumber} ما زال في حالة {status}، لذلك قد يكون الإلغاء أو تعديل العنوان ممكناً. الأفضل تصعيده الآن حتى يتحرك الفريق قبل الشحن.",
    cancellationLocked:
      "الطلب {orderNumber} أصبح في حالة {status}، لذلك الإلغاء المباشر لم يعد متاحاً. الخطوة الأنسب الآن هي طلب إرجاع أو تحويله إلى موظف خدمة عملاء.",
    addressChangeEligible:
      "الطلب {orderNumber} ما زال في حالة {status}، لذلك قد يكون تعديل عنوان التوصيل ممكناً. الأفضل تصعيده الآن حتى يتمكن الفريق من تحديثه قبل الشحن.",
    addressChangeLocked:
      "الطلب {orderNumber} أصبح في حالة {status}، لذلك لم يعد تعديل عنوان التوصيل متاحاً بشكل مباشر. الخطوة الأنسب الآن هي مراجعة موظف خدمة عملاء، أو لاحقاً طلب إرجاع إذا لزم الأمر.",
    policyInfo:
      "أستطيع شرح سياسة الاسترجاع، وسياسة الخصوصية، والشروط والأحكام، وقواعد التوصيل، وآلية الدفع، وطرق التواصل. أخبرني بأي سياسة تريد معرفتها.",
    askContactPreference:
      "إذا رغبت بمتابعة بشرية، شاركني البريد الإلكتروني أو رقم الجوال الأنسب وسأضيفه إلى ملخص التحويل.",
    promptForMore:
      "أستطيع المتابعة إذا شاركت رقم الطلب أو اسم المنتج أو النتيجة التي تريد الوصول لها.",
    typing: "جاري الكتابة…"
  }
};

export function detectLocale(text = "") {
  return /[\u0600-\u06FF]/.test(text) ? "ar" : "en";
}

export function t(locale, key) {
  return copy[locale]?.[key] ?? copy.en[key] ?? "";
}

export function format(locale, key, values = {}) {
  const template = t(locale, key);
  return Object.entries(values).reduce((result, [name, value]) => {
    return result.replaceAll(`{${name}}`, String(value));
  }, template);
}
