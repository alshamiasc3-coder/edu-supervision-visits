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

async function handleMonthlyPlanSuggestion(request, env) {
  if (!env.GEMINI_API_KEY) {
    return json({ ok: false, error: 'خدمة الذكاء الاصطناعي غير مهيأة على الخادم.' }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'بيانات الطلب غير صالحة.' }, 400);
  }

  const month = clean(body?.month);
  const year = clean(body?.year);
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

الشهر المطلوب:
${month}

السنة:
${year}

المدارس:
${JSON.stringify(schools, null, 2)}

سجل الزيارات السابقة:
${JSON.stringify(visits, null, 2)}

مهام الشهر المطلوب حاليًا:
${JSON.stringify(body?.currentTasks || [], null, 2)}

المهام السابقة:
${JSON.stringify(previousTasks, null, 2)}

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
    }
  ]
}

إذا لم توجد اقتراحات مناسبة:
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
      contents: [{ parts: [{ text: prompt }] }],
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
                required: ['schoolId', 'title', 'notes', 'reason'],
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
    console.error('Gemini monthly plan request failed:', geminiResponse.status, data?.error?.message);
    return json({ ok: false, error: 'تعذر إنشاء اقتراح الخطة الشهرية.' }, 502);
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
    console.error('Invalid monthly plan Gemini JSON:', error, outputText);
    return json({ ok: false, error: 'تعذر قراءة اقتراح الخطة الشهرية.' }, 502);
  }

  return json({
    ok: true,
    result: {
      suggestions: Array.isArray(result?.suggestions) ? result.suggestions : [],
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

    if (request.method === 'POST' && url.pathname === '/api/ai/visit-draft') {
      return handleVisitDraft(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/api/ai/monthly-plan') {
      return handleMonthlyPlanSuggestion(request, env);
    }

    return json({ ok: false, error: 'المسار غير موجود.' }, 404);
  },
};
