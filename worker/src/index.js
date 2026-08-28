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

مهمتك إعداد صياغة مهنية رسمية لسجل زيارة مدرسية اعتمادًا فقط على البيانات التي أدخلها المشرف.

القواعد الأساسية:
1. لا تخترع أي واقعة أو رقم أو اسم أو نتيجة أو معلومة غير موجودة.
2. لا تستنتج معلومات جديدة من عندك.
3. لا تضف سببًا للزيارة إذا لم يكن موجودًا في البيانات.
4. نوع الزيارة هو النوع الذي اختاره المشرف، ويجب استخدامه كما هو.
5. لا تغيّر اسم نوع الزيارة.
6. لا تكرر نوع الزيارة داخل النص بلا حاجة.
7. اعتمد بصورة أساسية على الإجراءات أو التوصيات التي أدخلها المشرف.
8. اجعل الصياغة مناسبة لسجل زيارة إشراف تربوي رسمي في العراق.
9. استخدم لغة عربية مهنية واضحة ومباشرة.
10. يجب أن تكون الملاحظات والتوصيات وخطة المتابعة مرتبطة مباشرة بما أدخله المشرف.
11. لا تضف إجراءات لم يذكرها المشرف.
12. لا تذكر أنك نموذج ذكاء اصطناعي.
13. لا تستخدم عبارات عامة لا تستند إلى المعطيات.
14. لا تكرر نفس الجملة بين الملاحظات والتوصيات وخطة المتابعة إلا إذا كان التكرار ضروريًا للمعنى.

بيانات الزيارة:
اسم المدرسة:
${schoolName || 'غير محدد'}

نوع الزيارة:
${visitType || 'غير محدد'}

الإجراءات أو التوصيات التي أدخلها المشرف:
${procedure || 'لم يتم إدخال إجراءات محددة.'}

المطلوب:
أولًا: الملاحظات
اكتب ملاحظات مهنية مختصرة تصف ما يمكن صياغته اعتمادًا على الإجراءات المدخلة ونوع الزيارة فقط.

ثانيًا: التوصيات والإجراءات
أعد صياغة الإجراءات أو التوصيات التي أدخلها المشرف بصورة مهنية وواضحة، دون إضافة إجراءات جديدة.

ثالثًا: خطة المتابعة
اكتب خطة متابعة مرتبطة مباشرة بالإجراءات المذكورة، دون اختراع مواعيد أو أرقام أو مسؤوليات أو نتائج غير موجودة.

مهم جدًا:
إذا كانت البيانات قليلة، اجعل الصياغة مختصرة ولا تحاول ملء النقص بمعلومات من عندك.

أعد النتيجة باللغة العربية فقط.
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
        temperature: 0.3,
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
