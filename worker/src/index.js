const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}
function clean(value) {
  return value == null ? '' : String(value).trim();
}
function buildPrompt({ procedure, visitType, schoolName }) {
  return `
أنت مساعد ذكي متخصص في الإشراف التربوي في المدارس العراقية.

مهمتك مساعدة المشرف التربوي في إعداد مسودة مهنية لسجل الزيارة المدرسية.
المشرف هو صاحب القرار النهائي، وهذه المخرجات مسودة مقترحة يراجعها ويعدلها قبل نقلها إلى سجل الزيارة.

المطلوب منك ليس نسخ كلام المشرف، بل تحويل معطياته إلى صياغة تربوية رسمية واضحة ومترابطة وغنية بالمعنى.

القواعد العامة:

1. اعتمد أساسًا على المعلومات التي أدخلها المشرف.
2. لا تخترع أسماء أو أرقامًا أو تواريخ أو نسبًا أو نتائج محددة أو أحداثًا لم يذكرها المشرف.
3. يمكنك إضافة عبارات مهنية إيجابية عامة تساعد على تشجيع الكادر، مثل:
   - الاهتمام بالعمل.
   - الحرص على المتابعة.
   - التعاون.
   - الالتزام.
   - تنظيم العمل.
   - تعزيز الجوانب الإيجابية.
   - الاستمرار في المتابعة.
   بشرط أن تكون العبارة مناسبة لسياق المدخلات وألا تتحول إلى ادعاء واقعة محددة.
4. لا تدّعِ أن المشرف شاهد نتيجة معينة أو تحقق من إنجاز معين إذا لم يذكر ذلك.
5. لا تخترع مشكلات أو تقصيرًا أو نجاحًا محددًا.
6. لا تضف أرقامًا أو نسب إنجاز أو تواريخ أو أسماء مسؤولين أو مواعيد متابعة من عندك.
7. نوع الزيارة هو النوع الذي اختاره المشرف، ويجب الحفاظ على معناه وعدم تغييره.
8. لا تكرر نوع الزيارة داخل النص إلا عندما يكون ذلك ضروريًا.
9. استخدم لغة عربية مهنية رسمية مناسبة لسجل زيارة إشراف تربوي في المدارس العراقية.
10. اجعل الصياغة طبيعية ومترابطة وليست مجرد استبدال كلمات.
11. إذا احتوت المدخلات على عدة إجراءات أو موضوعات، اربط بينها في صياغة واحدة متماسكة.
12. لا تكرر الجملة نفسها في الملاحظات والتوصيات وخطة المتابعة.
13. لا تستخدم عبارات إنشائية فارغة لا ترتبط بموضوع الزيارة.
14. لا تذكر أنك نموذج ذكاء اصطناعي.
15. تذكر دائمًا أن الناتج «مسودة مقترحة» للمشرف وليست سجلًا نهائيًا.

طريقة إعداد المخرجات:

أولًا: الملاحظات

اكتب فقرة مهنية تصف موضوعات الزيارة وما تم تناوله استنادًا إلى المعلومات التي أدخلها المشرف.

يمكنك استخدام عبارات إيجابية مهنية عامة عند ملاءمتها، مثل الاهتمام والمتابعة والحرص والتنظيم والتعاون، ولكن لا تحولها إلى نتائج محددة غير مذكورة.

لا تكتب الملاحظة على شكل نسخ مباشر للإجراء.

مثال:

إذا كان المدخل:
«الاطلاع على السجلات والأوامر المدرسية ومتابعة أداء الكادر وملاحظة سجلات غيابات الطلبة»

فصياغة مناسبة يمكن أن تكون:
«تناولت الزيارة متابعة السجلات والأوامر المدرسية والاطلاع على سجلات غيابات الطلبة، مع متابعة أداء الكادر في الجوانب المرتبطة بالعمل المدرسي، والتأكيد على أهمية تنظيم العمل والاستمرار في المتابعة.»

ثانيًا: التوصيات والإجراءات

حوّل إجراءات المشرف إلى توصيات وإجراءات تربوية واضحة ومهنية.

لا تكتفِ بتكرار النص المدخل.

يمكنك توضيح المقصود وتحسين الأسلوب وربط الإجراءات ببعضها، مع عدم إضافة مهمة جوهرية جديدة.

مثال:

المدخل:
«الاطلاع على السجلات والأوامر المدرسية»

الصياغة:
«التأكيد على تنظيم السجلات المدرسية ومتابعة الأوامر والتعليمات الواردة والاطلاع عليها والعمل بموجبها وفق السياقات المعتمدة.»

ثالثًا: خطة المتابعة

اكتب خطة متابعة عملية ومختصرة مرتبطة مباشرة بما ورد في الإجراءات.

يمكن استخدام عبارات مثل:
«متابعة استمرار...»
«الاستمرار في متابعة...»
«تعزيز متابعة...»
«التأكد من استمرار...»

لكن لا تضف موعدًا أو تاريخًا أو نسبة أو مسؤولًا محددًا لم يذكره المشرف.

مثال:

المدخل:
«الاطلاع على السجلات والأوامر المدرسية ومتابعة سجلات غيابات الطلبة»

خطة المتابعة:
«متابعة انتظام السجلات المدرسية وسجلات غيابات الطلبة والاستمرار في متابعة الأوامر والتعليمات ذات الصلة.»

بيانات الزيارة:

اسم المدرسة:
${schoolName || 'غير محدد'}

نوع الزيارة:
${visitType || 'غير محدد'}

الإجراءات أو التوصيات التي أدخلها المشرف:
${procedure || 'لم يتم إدخال إجراءات محددة.'}

المطلوب:

أعد النتيجة في ثلاثة حقول فقط:

notes:
الملاحظات المقترحة.

recommendations:
التوصيات والإجراءات المقترحة.

followUp:
خطة المتابعة المقترحة.

تعليمات مهمة جدًا:

- لا تضع عناوين داخل قيم الحقول.
- لا تضع شرحًا خارج الحقول الثلاثة.
- لا تكرر النص المدخل حرفيًا.
- اجعل كل حقل مختلفًا في وظيفته عن الحقلين الآخرين.
- اجعل الصياغة مناسبة لأن يراجعها المشرف ثم ينقلها إلى سجل الزيارة.
- إذا كانت المعلومات قليلة، لا تجعل النص طويلًا بلا داعٍ.
- إذا كانت المعلومات متعددة، اربطها في صياغة مهنية متماسكة.
- أعد النتيجة باللغة العربية فقط.
`;
}

async function handleVisitDraft(request, env) {
  if (!env.GEMINI_API_KEY) {
    return json({ ok: false, error: 'خدمة الذكاء الاصطناعي غير مهيأة على الخادم.' }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'بيانات الطلب غير صالحة.' }, 400);
  }

  const procedure = clean(body?.procedure);
  const visitType = clean(body?.visitType);
  const schoolName = clean(body?.schoolName);

  if (!procedure) {
    return json({ ok: false, error: 'يرجى إدخال الإجراءات أو التوصيات أولًا.' }, 400);
  }

  const geminiResponse = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: buildPrompt({ procedure, visitType, schoolName }) }],
        },
      ],
      generationConfig: {
        response_mime_type: 'application/json',
        response_schema: {
          type: 'object',
          properties: {
            notes: { type: 'string' },
            recommendations: { type: 'string' },
            followUp: { type: 'string' },
          },
          required: ['notes', 'recommendations', 'followUp'],
        },
        temperature: 0.55,
        max_output_tokens: 1200,
      },
    }),
  });

  const data = await geminiResponse.json();

  if (!geminiResponse.ok) {
    console.error('Gemini request failed:', geminiResponse.status, data?.error?.message);
    return json({
      ok: false,
      error: 'تعذر إنشاء الصياغة الذكية من خدمة Gemini.',
    }, 502);
  }

  const outputText = (data?.candidates?.[0]?.content?.parts || [])
    .map((part) => typeof part?.text === 'string' ? part.text : '')
    .join('')
    .trim();

  if (!outputText) {
    return json({ ok: false, error: 'عادت استجابة فارغة من خدمة الذكاء الاصطناعي.' }, 502);
  }

  let result;
  try {
    result = JSON.parse(outputText);
  } catch (error) {
    console.error('Invalid Gemini JSON:', error, outputText);
    return json({ ok: false, error: 'تعذر قراءة نتيجة الذكاء الاصطناعي.' }, 502);
  }

  return json({
    ok: true,
    result: {
      notes: clean(result?.notes),
      recommendations: clean(result?.recommendations),
      followUp: clean(result?.followUp),
      visitType,
      model: GEMINI_MODEL,
    },
  });
}

function normalizePlanText(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/\u0640/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getPlanTitleKey(value) {
  return normalizePlanText(value);
}

function isSamePlanTask(a, b) {
  const sameSchool =
    clean(a?.schoolId) !== '' &&
    clean(a?.schoolId) === clean(b?.schoolId);

  if (!sameSchool) return false;

  const titleA = getPlanTitleKey(a?.title);
  const titleB = getPlanTitleKey(b?.title);

  if (!titleA || !titleB) return false;

  if (titleA === titleB) return true;

  const wordsA = new Set(titleA.split(' ').filter(Boolean));
  const wordsB = new Set(titleB.split(' ').filter(Boolean));

  const common = [...wordsA].filter((word) => wordsB.has(word));
  const similarity =
    common.length / Math.max(wordsA.size, wordsB.size);

  return similarity >= 0.8 && common.length >= 2;
}

async function handleMonthlyPlanSuggestion(request, env) {
  if (!env.GEMINI_API_KEY) {
    return json(
      {
        ok: false,
        error: 'خدمة الذكاء الاصطناعي غير مهيأة على الخادم.',
      },
      500
    );
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return json(
      {
        ok: false,
        error: 'بيانات الطلب غير صالحة.',
      },
      400
    );
  }

  const month = clean(body?.month);
  const year = clean(body?.year);
  const schools = Array.isArray(body?.schools)
    ? body.schools
    : [];
  const previousTasks = Array.isArray(body?.previousTasks)
    ? body.previousTasks
    : [];
  const currentTasks = Array.isArray(body?.currentTasks)
    ? body.currentTasks
    : [];

  if (!month || !year) {
    return json(
      {
        ok: false,
        error: 'يجب تحديد الشهر والسنة.',
      },
      400
    );
  }

  const prompt = `
أنت مساعد ذكي متخصص في الإشراف التربوي في المدارس العراقية.

مهمتك مساعدة المشرف التربوي في اقتراح مسودة خطة عمل شهرية.

المشرف هو صاحب القرار النهائي.
لا تقم بإضافة أي مهمة إلى النظام.
أنت تقدم اقتراحات فقط ليقوم المشرف بمراجعتها واعتمادها أو تعديلها أو رفضها.

الشهر المطلوب:
${month}

السنة:
${year}

المدارس المتوفرة في النظام:
${JSON.stringify(schools, null, 2)}

المهام الموجودة حاليًا في الخطة للشهر المطلوب:
${JSON.stringify(currentTasks, null, 2)}

المهام السابقة:
${JSON.stringify(previousTasks, null, 2)}

القواعد:

1. اعتمد فقط على البيانات المرسلة إليك.
2. لا تخترع مدرسة غير موجودة في قائمة المدارس.
3. لا تخترع نتائج أو أرقامًا أو تواريخ غير موجودة في البيانات.
4. استفد من المهام السابقة لتحديد الموضوعات التي قد تحتاج إلى استمرار أو متابعة.
5. أعط الأولوية للمهام السابقة غير المكتملة أو التي تحتاج متابعة.
6. ممنوع اقتراح أي مهمة موجودة حاليًا في الخطة للشهر المطلوب.
7. لا تكرر المهمة الحالية حتى لو كان تاريخها مختلفًا.
8. لا تكرر المهمة الحالية حتى لو غُيّرت صياغة عنوانها بشكل بسيط.
9. إذا وجدت مهمة حالية لنفس المدرسة وبنفس الموضوع أو بعنوان مشابه جدًا، اعتبرها موجودة ولا تقترحها مرة أخرى.
10. لا تكرر مهمة مكتملة دون سبب واضح.
11. اجعل المقترحات مناسبة لعمل المشرف التربوي.
12. اجعل كل مقترح عمليًا وواضحًا ومختصرًا.
13. لا تضف أي موعد أو تاريخ محدد من عندك.
14. الناتج مسودة مقترحة وليست خطة نهائية.
15. أعد النتيجة باللغة العربية فقط.

أعد النتيجة في JSON فقط بالشكل التالي:

{
  "suggestions": [
    {
      "schoolId": "معرف المدرسة من البيانات",
      "title": "عنوان المهمة المقترحة",
      "notes": "وصف مختصر للمهمة",
      "reason": "سبب اقتراح المهمة"
    }
  ]
}

إذا لم توجد بيانات كافية لاقتراح مهمة مناسبة، أعد:
{
  "suggestions": []
}
`;

  const geminiResponse = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        response_mime_type: 'application/json',
        response_schema: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  schoolId: { type: 'string' },
                  title: { type: 'string' },
                  notes: { type: 'string' },
                  reason: { type: 'string' },
                },
                required: [
                  'schoolId',
                  'title',
                  'notes',
                  'reason',
                ],
              },
            },
          },
          required: ['suggestions'],
        },
        temperature: 0.4,
        max_output_tokens: 1600,
      },
    }),
  });

  const data = await geminiResponse.json();

  if (!geminiResponse.ok) {
    console.error(
      'Gemini monthly plan request failed:',
      geminiResponse.status,
      data?.error?.message
    );

    return json(
      {
        ok: false,
        error: 'تعذر إنشاء اقتراح الخطة الشهرية.',
      },
      502
    );
  }

  const outputText = (
    data?.candidates?.[0]?.content?.parts || []
  )
    .map((part) =>
      typeof part?.text === 'string'
        ? part.text
        : ''
    )
    .join('')
    .trim();

  if (!outputText) {
    return json(
      {
        ok: false,
        error:
          'عادت استجابة فارغة من خدمة الذكاء الاصطناعي.',
      },
      502
    );
  }

  let result;

  try {
    result = JSON.parse(outputText);
  } catch (error) {
    console.error(
      'Invalid monthly plan Gemini JSON:',
      error,
      outputText
    );

    return json(
      {
        ok: false,
        error:
          'تعذر قراءة اقتراح الخطة الشهرية.',
      },
      502
    );
  }

  const rawSuggestions = Array.isArray(result?.suggestions)
    ? result.suggestions
    : [];

  const existingTasks = [...currentTasks, ...previousTasks];

  const filteredSuggestions = rawSuggestions.filter((suggestion, index, list) => {
    const validSchool = schools.some(
      (school) =>
        clean(school?.id) !== '' &&
        clean(school?.id) === clean(suggestion?.schoolId)
    );

    if (!validSchool) return false;

    const alreadyExists = existingTasks.some((task) =>
      isSamePlanTask(task, suggestion)
    );

    if (alreadyExists) return false;

    const duplicateInResponse = list
      .slice(0, index)
      .some((previous) => isSamePlanTask(previous, suggestion));

    return !duplicateInResponse;
  });

  return json({
    ok: true,
    result: {
      suggestions: filteredSuggestions,
      month,
      year,
      model: GEMINI_MODEL,
    },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/api/health') {
      return json({ ok: true, service: 'edu-supervision-ai' });
    }

    if (
      request.method === 'POST' &&
      url.pathname === '/api/ai/monthly-plan'
    ) {
      try {
        return await handleMonthlyPlanSuggestion(
          request,
          env
        );
      } catch (error) {
        console.error(
          'Monthly plan AI error:',
          error
        );

        return json(
          {
            ok: false,
            error:
              'حدث خطأ غير متوقع في خدمة اقتراح الخطة الشهرية.',
          },
          500
        );
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/ai/visit-draft') {
      try {
        return await handleVisitDraft(request, env);
      } catch (error) {
        console.error('Worker error:', error);
        return json({ ok: false, error: 'حدث خطأ غير متوقع في خدمة الذكاء الاصطناعي.' }, 500);
      }
    }

    return json({ ok: false, error: 'المسار غير موجود.' }, 404);
  },
};