const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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
  return typeof value === 'string' ? value.trim() : '';
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

  const visitType = clean(body?.visitType) || 'زيارة';
  const schoolName = clean(body?.schoolName);
  const notes = clean(body?.notes);
  const findings = clean(body?.findings);
  const recommendations = clean(body?.recommendations);

  const prompt = `
أنت مساعد ذكي متخصص في الإشراف التربوي المدرسي في العراق.

اكتب مسودة مهنية باللغة العربية لبيانات الزيارة التربوية اعتمادًا فقط على المعطيات المرسلة.
لا تخترع وقائع أو أرقامًا أو نتائج غير موجودة.
المشرف هو صاحب القرار النهائي، والنتيجة مسودة قابلة للتعديل.

نوع الزيارة: ${visitType}
المدرسة: ${schoolName}
الملاحظات: ${notes}
النتائج: ${findings}
التوصيات: ${recommendations}

أعد JSON فقط بالشكل:
{
  "notes": "صياغة مهنية مختصرة للملاحظات",
  "recommendations": "توصيات عملية مختصرة",
  "followUp": "إجراءات المتابعة إن وجدت"
}
`;

  const geminiResponse = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
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
        temperature: 0.4,
        max_output_tokens: 1200,
      },
    }),
  });

  const data = await geminiResponse.json();

  if (!geminiResponse.ok) {
    console.error('Gemini visit draft request failed:', geminiResponse.status, data?.error?.message);
    return json({ ok: false, error: 'تعذر إنشاء مسودة الزيارة.' }, 502);
  }

  const outputText = (data?.candidates?.[0]?.content?.parts || [])
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
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

<<<<<<< HEAD
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
=======
async function handleMonthlyPlanSuggestion(request, env) {
  if (!env.GEMINI_API_KEY) {
    return json({ ok: false, error: 'خدمة الذكاء الاصطناعي غير مهيأة على الخادم.' }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'بيانات الطلب غير صالحة.' }, 400);
>>>>>>> 4129586 (Improve AI monthly plan suggestions)
  }

  const month = clean(body?.month);
  const year = clean(body?.year);
<<<<<<< HEAD
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
=======
  const schools = Array.isArray(body?.schools) ? body.schools : [];
  const visits = Array.isArray(body?.visits) ? body.visits : [];
  const previousTasks = Array.isArray(body?.previousTasks) ? body.previousTasks : [];

  if (!month || !year) {
    return json({ ok: false, error: 'يجب تحديد الشهر والسنة.' }, 400);
  }

  const prompt = `
أنت مساعد ذكي متخصص في الإشراف التربوي المدرسي في العراق.

مهمتك إعداد مقترحات مسودة لخطة العمل الشهرية للمشرف التربوي، اعتمادًا فقط على البيانات المرسلة إليك.
المشرف هو صاحب القرار النهائي. أنت تقترح فقط، ولا تضف أي مهمة تلقائيًا إلى النظام.
>>>>>>> 4129586 (Improve AI monthly plan suggestions)

الشهر المطلوب:
${month}

السنة:
${year}

<<<<<<< HEAD
المدارس المتوفرة في النظام:
${JSON.stringify(schools, null, 2)}

المهام الموجودة حاليًا في الخطة للشهر المطلوب:
${JSON.stringify(currentTasks, null, 2)}
=======
المدارس:
${JSON.stringify(schools, null, 2)}

سجل الزيارات السابقة:
${JSON.stringify(visits, null, 2)}

مهام الشهر المطلوب حاليًا:
${JSON.stringify(body?.currentTasks || [], null, 2)}
>>>>>>> 4129586 (Improve AI monthly plan suggestions)

المهام السابقة:
${JSON.stringify(previousTasks, null, 2)}

<<<<<<< HEAD
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
=======
قواعد الاقتراح:
1. الزيارات المدرسية الدورية مهمة أساسية في عمل المشرف؛ لذلك يجوز اقتراح زيارة دورية للمدارس.
2. رتّب أولوية الزيارات حسب أقدم تاريخ لآخر زيارة معروف لكل مدرسة: المدرسة التي مضى على آخر زيارة لها أطول وقت تكون أولى بالاقتراح، ثم الأحدث.
3. إذا لم توجد زيارة سابقة معروفة لمدرسة، اعتبرها من المدارس ذات الأولوية، ولا تخترع لها تاريخًا.
4. لا تقترح نفس المدرسة + نفس عنوان المهمة إذا كانت هذه المهمة موجودة بالفعل في مهام الشهر المطلوب، سواء كانت مخططة أو قيد التنفيذ أو مكتملة.
5. وجود مهمة مشابهة في شهر سابق لا يمنع اقتراح عمل جديد في الشهر المطلوب؛ استخدم المهام السابقة لفهم الاستمرارية والمتابعة.
6. أعط الأولوية للأعمال السابقة غير المكتملة أو التي تحتاج متابعة واضحة.
7. لا تقترح "تحقيق" أو "تحقق" من نفسك. هذه الأعمال لا تُقترح إلا إذا كانت موجودة أصلًا ضمن المهام المخططة السابقة أو الحالية وتوجد قرينة واضحة على الحاجة إلى متابعتها.
8. لا تخترع مشكلة في مدرسة، ولا تخترع نتائج أو أرقامًا أو تواريخ أو معلومات غير موجودة في البيانات.
9. لا تضع تاريخًا محددًا للمهمة المقترحة؛ تاريخ التنفيذ يحدده المشرف عند اعتمادها.
10. اجعل كل اقتراح عمليًا ومختصرًا ومناسبًا لعمل المشرف التربوي.
11. عند اقتراح زيارة دورية، استخدم المدرسة ذات الأولوية الأعلى بناءً على أقدمية آخر زيارة، ولا تكرر مدرسة موجودة أصلًا بنفس عنوان المهمة في الشهر المطلوب.
12. إذا كانت البيانات غير كافية لاقتراح مهمة مفيدة، أعد قائمة فارغة بدل اختراع معلومات.
13. أعد النتيجة باللغة العربية فقط.
14. أعد JSON فقط بالشكل التالي:
{
  "suggestions": [
    {
      "schoolId": "معرف المدرسة",
      "title": "عنوان المهمة",
      "notes": "وصف مختصر للمهمة",
      "reason": "سبب الاقتراح"
>>>>>>> 4129586 (Improve AI monthly plan suggestions)
    }
  ]
}

<<<<<<< HEAD
إذا لم توجد بيانات كافية لاقتراح مهمة مناسبة، أعد:
=======
إذا لم توجد اقتراحات مناسبة:
>>>>>>> 4129586 (Improve AI monthly plan suggestions)
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
<<<<<<< HEAD
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
=======
      contents: [{ parts: [{ text: prompt }] }],
>>>>>>> 4129586 (Improve AI monthly plan suggestions)
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
<<<<<<< HEAD
                required: [
                  'schoolId',
                  'title',
                  'notes',
                  'reason',
                ],
=======
                required: ['schoolId', 'title', 'notes', 'reason'],
>>>>>>> 4129586 (Improve AI monthly plan suggestions)
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
<<<<<<< HEAD
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
=======
    console.error('Gemini monthly plan request failed:', geminiResponse.status, data?.error?.message);
    return json({ ok: false, error: 'تعذر إنشاء اقتراح الخطة الشهرية.' }, 502);
  }

  const outputText = (data?.candidates?.[0]?.content?.parts || [])
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
>>>>>>> 4129586 (Improve AI monthly plan suggestions)
    .join('')
    .trim();

  if (!outputText) {
<<<<<<< HEAD
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
=======
    return json({ ok: false, error: 'عادت استجابة فارغة من خدمة الذكاء الاصطناعي.' }, 502);
  }

  let result;
  try {
    result = JSON.parse(outputText);
  } catch (error) {
    console.error('Invalid monthly plan Gemini JSON:', error, outputText);
    return json({ ok: false, error: 'تعذر قراءة اقتراح الخطة الشهرية.' }, 502);
  }

  return json({
    ok: true,
    result: {
      suggestions: Array.isArray(result?.suggestions) ? result.suggestions : [],
>>>>>>> 4129586 (Improve AI monthly plan suggestions)
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
      return handleVisitDraft(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/api/ai/monthly-plan') {
      return handleMonthlyPlanSuggestion(request, env);
    }

    return json({ ok: false, error: 'المسار غير موجود.' }, 404);
  },
};