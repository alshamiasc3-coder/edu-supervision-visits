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
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function handleVisitDraft(request, env) {
  if (!env.GEMINI_API_KEY) return json({ ok: false, error: 'خدمة الذكاء الاصطناعي غير مهيأة على الخادم.' }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'بيانات الطلب غير صالحة.' }, 400); }

  const visitType = clean(body?.visitType) || 'زيارة';
  const schoolName = clean(body?.schoolName);
  const visitDate = clean(body?.visitDate);
  const observations = clean(body?.observations);
  const actions = clean(body?.actions);
  const proposals = clean(body?.proposals);
  const followUp = clean(body?.followUp);
  const history = clean(body?.history);
  const legalReferences = clean(body?.legalReferences);

  const prompt = `
أنت مساعد مهني متخصص في الإشراف التربوي المدرسي في العراق.

مهمتك إعداد مسودة قابلة للمراجعة لزيارة إشرافية اعتمادًا فقط على المعطيات المرسلة.
المشرف التربوي هو صاحب القرار النهائي. لا تحفظ شيئًا ولا تعتمد توصية تلقائيًا.
لا تخترع وقائع أو أرقامًا أو نتائج أو إجراءات أو تواريخ غير موجودة.
لا تستنتج شخصية المشرف أو حالته النفسية أو نواياه. استخدم السجل السابق لفهم الاستمرارية المهنية فقط.

افصل بدقة بين:
- الملاحظات والمشاهدات: ما يمكن صياغته مما شاهده أو سجله المشرف.
- الإجراءات المتخذة فعليًا: ما تم تنفيذه أثناء الزيارة فقط. لا تضع هنا أي إجراء مقترح.
- المقترحات والتوصيات: ما يُقترح تنفيذه لاحقًا، ولا تقدمه على أنه منفذ.
- المتابعة المقترحة: ما ينبغي مراجعته لاحقًا.

إذا كانت خانة من الخانات الحالية تحتوي على معلومات كافية، حسّن صياغتها دون تغيير معناها.
إذا كانت الخانة فارغة، لا تخترع واقعة؛ يمكن تقديم صياغة مقترحة عامة فقط عندما تكون مبنية بوضوح على نوع الزيارة والمعطيات المتاحة، وإلا أعدها فارغة.
إذا ظهر في السجل السابق ارتباط بتوصية أو إجراء سابق، صِغ الاستمرارية بحذر ولا تدّعِ التنفيذ إلا إذا كان السجل يثبته.

بيانات الزيارة الحالية:
المدرسة: ${schoolName}
التاريخ: ${visitDate}
نوع الزيارة: ${visitType}
الملاحظات والمشاهدات الحالية: ${observations}
الإجراءات المتخذة فعليًا الحالية: ${actions}
المقترحات والتوصيات الحالية: ${proposals}
المتابعة المقترحة الحالية: ${followUp}

السجل المهني السابق:
${history || 'لا توجد زيارات سابقة مسجلة.'}

المراجع التشريعية الموثقة المرشحة:
${legalReferences || 'لا يوجد سند تشريعي موثق مرتبط بالمعطيات الحالية.'}

بالنسبة للمرجع التشريعي: استخدمه كقرينة موثقة فقط. لا تخترع رقم مادة أو فقرة أو حكمًا. إذا لم يتوفر نص المادة، لا تدّعِ مضمونًا قانونيًا تفصيليًا.

أعد JSON فقط بالشكل التالي:
{
  "observations": "صياغة الملاحظات والمشاهدات",
  "actions": "صياغة الإجراءات المتخذة فعليًا",
  "proposals": "صياغة المقترحات والتوصيات",
  "followUp": "صياغة المتابعة المقترحة"
}
`;

  const geminiResponse = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        response_mime_type: 'application/json',
        response_schema: {
          type: 'object',
          properties: {
            observations: { type: 'string' },
            actions: { type: 'string' },
            proposals: { type: 'string' },
            followUp: { type: 'string' },
          },
          required: ['observations', 'actions', 'proposals', 'followUp'],
        },
        temperature: 0.4,
        max_output_tokens: 1400,
      },
    }),
  });

  const data = await geminiResponse.json();
  if (!geminiResponse.ok) {
    console.error('Gemini visit draft request failed:', geminiResponse.status, data?.error?.message);
    return json({ ok: false, error: 'تعذر إنشاء مسودة الزيارة.' }, 502);
  }

  const outputText = (data?.candidates?.[0]?.content?.parts || []).map((part) => typeof part?.text === 'string' ? part.text : '').join('').trim();
  if (!outputText) return json({ ok: false, error: 'عادت استجابة فارغة من خدمة الذكاء الاصطناعي.' }, 502);

  let result;
  try { result = JSON.parse(outputText); } catch (error) {
    console.error('Invalid Gemini JSON:', error, outputText);
    return json({ ok: false, error: 'تعذر قراءة نتيجة الذكاء الاصطناعي.' }, 502);
  }

  return json({
    ok: true,
    result: {
      observations: clean(result?.observations),
      actions: clean(result?.actions),
      proposals: clean(result?.proposals),
      followUp: clean(result?.followUp),
      visitType,
      visitDate,
      model: GEMINI_MODEL,
    },
  });
}

async function handleMonthlyPlanSuggestion(request, env) {
  if (!env.GEMINI_API_KEY) return json({ ok: false, error: 'خدمة الذكاء الاصطناعي غير مهيأة على الخادم.' }, 500);
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'بيانات الطلب غير صالحة.' }, 400); }

  const month = clean(body?.month);
  const year = clean(body?.year);
  const schools = Array.isArray(body?.schools) ? body.schools : [];
  const visits = Array.isArray(body?.visits) ? body.visits : [];
  const previousTasks = Array.isArray(body?.previousTasks) ? body.previousTasks : [];
  const currentTasks = Array.isArray(body?.currentTasks) ? body.currentTasks : [];
  if (!month || !year) return json({ ok: false, error: 'يجب تحديد الشهر والسنة.' }, 400);

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
${JSON.stringify(currentTasks, null, 2)}

المهام السابقة من الأشهر السابقة:
${JSON.stringify(previousTasks, null, 2)}

قواعد الاقتراح المهمة جدًا:
1. الزيارات المدرسية الدورية مهمة أساسية في عمل المشرف؛ لذلك يجوز ويُستحسن اقتراح زيارة دورية للمدارس.
2. ابدأ الأولوية بالمدارس التي لم تُزر أو التي لا توجد لها زيارة سابقة معروفة، ثم رتّب المدارس التي لها زيارات سابقة من الأقدم زيارة إلى الأحدث زيارة.
3. إذا لم توجد زيارة سابقة معروفة لمدرسة، اعتبرها ذات أولوية ولا تخترع لها تاريخًا.
4. أي مهمة سابقة من الأشهر السابقة حالتها "planned" أو كانت done=false ولم تُنفذ بعد، وخاصة مهام الزيارة، يجب اعتبارها مهمة مرحّلة غير مكتملة ويجب اقتراحها للشهر المطلوب إذا لم تكن موجودة بالفعل في مهام الشهر الحالي.
5. عند ترحيل مهمة زيارة غير مكتملة من شهر سابق، حافظ على نفس المدرسة ونفس فكرة/عنوان المهمة، واجعل سبب الاقتراح واضحًا بأنها زيارة مخططة سابقًا لم تُنفذ.
6. لا تعتبر المهمة السابقة المكتملة سببًا كافيًا لإعادة اقتراح نفس المهمة؛ لكن الزيارة الدورية للمدرسة يمكن اقتراحها مرة أخرى إذا كانت المدرسة مستحقة للمتابعة وفق ترتيب أقدمية الزيارات.
7. لا تقترح نفس المدرسة + نفس عنوان المهمة إذا كانت هذه المهمة موجودة بالفعل في مهام الشهر المطلوب، سواء كانت مخططة أو قيد التنفيذ أو مكتملة.
8. وجود مهمة مشابهة في شهر سابق لا يمنع اقتراح عمل جديد في الشهر المطلوب، إلا إذا كانت المهمة السابقة نفسها غير مكتملة؛ ففي هذه الحالة أعطها الأولوية واقترح ترحيلها بدل تجاهلها.
9. استخدم المهام السابقة وسجل الزيارات لفهم الاستمرارية والمتابعة، وليس لمجرد استبعادها.
10. أعط الأولوية للمهام السابقة غير المكتملة التي تحتاج متابعة واضحة، ثم للمدارس غير المزارة، ثم للزيارات الدورية حسب أقدمية آخر زيارة.
11. لا تقترح "تحقيق" أو "تحقق" من نفسك بسبب مجرد مرور الوقت. هذان النوعان يرتبطان بوجود مشكلة أو حاجة محددة.
12. إذا وُجدت مهمة سابقة "تحقيق" أو "تحقق" مخططة وغير مكتملة، فيجوز اقتراح متابعتها فقط لأنها مهمة مخططة غير مكتملة، مع المحافظة على طبيعتها وعدم تحويلها إلى زيارة دورية.
13. لا تخترع مشكلة في مدرسة، ولا تخترع نتائج أو أرقامًا أو تواريخ أو معلومات غير موجودة في البيانات.
14. لا تضع تاريخًا محددًا للمهمة المقترحة؛ تاريخ التنفيذ يحدده المشرف عند اعتمادها.
15. اجعل كل اقتراح عمليًا ومختصرًا ومناسبًا لعمل المشرف التربوي.
16. عند اقتراح زيارة دورية، اختر المدرسة ذات الأولوية الأعلى وفق أقدمية آخر زيارة، ولا تكرر مدرسة موجودة أصلًا بنفس عنوان المهمة في الشهر المطلوب.
17. إذا كانت هناك مدارس قليلة العدد، فلا تتردد في اقتراح الزيارات الدورية لها لإكمال المتابعة، حتى لو كانت قد زُرت في شهر سابق، ما دام لا يوجد نفس عنوان المهمة في الشهر الحالي.
18. إذا كانت البيانات غير كافية لاقتراح مهمة مفيدة، أعد قائمة فارغة بدل اختراع معلومات.
19. أعد النتيجة باللغة العربية فقط.
20. أعد JSON فقط بالشكل التالي:
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

تذكّر: الهدف ليس منع الاقتراحات، بل مساعدة المشرف على إكمال الأعمال. لذلك لا تُرجع قائمة فارغة إذا كانت هناك مدرسة غير مزارة أو مهمة زيارة سابقة مخططة وغير مكتملة ويمكن اقتراحها دون تكرار مهمة الشهر الحالي.

إذا لم توجد اقتراحات مناسبة فعلًا:
{
  "suggestions": []
}
`;

  const geminiResponse = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        response_mime_type: 'application/json',
        response_schema: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              items: { type: 'object', properties: {
                schoolId: { type: 'string' }, title: { type: 'string' }, notes: { type: 'string' }, reason: { type: 'string' },
              }, required: ['schoolId', 'title', 'notes', 'reason'] },
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
  const outputText = (data?.candidates?.[0]?.content?.parts || []).map((part) => typeof part?.text === 'string' ? part.text : '').join('').trim();
  if (!outputText) return json({ ok: false, error: 'عادت استجابة فارغة من خدمة الذكاء الاصطناعي.' }, 502);

  let result;
  try { result = JSON.parse(outputText); } catch (error) {
    console.error('Invalid monthly plan Gemini JSON:', error, outputText);
    return json({ ok: false, error: 'تعذر قراءة اقتراح الخطة الشهرية.' }, 502);
  }
  return json({ ok: true, result: { suggestions: Array.isArray(result?.suggestions) ? result.suggestions : [], month, year, model: GEMINI_MODEL } });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/api/health') return json({ ok: true, service: 'edu-supervision-ai' });
    if (request.method === 'POST' && url.pathname === '/api/ai/visit-draft') return handleVisitDraft(request, env);
    if (request.method === 'POST' && url.pathname === '/api/ai/monthly-plan') return handleMonthlyPlanSuggestion(request, env);
    return json({ ok: false, error: 'المسار غير موجود.' }, 404);
  },
};
