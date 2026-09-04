const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' };
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' } }); }
function clean(v) { return v == null ? '' : String(v).trim(); }
function arr(v) { return Array.isArray(v) ? v : []; }

async function gemini(prompt, schema, env, max = 1600) {
  if (!env.GEMINI_API_KEY) return { ok: false, error: 'خدمة الذكاء الاصطناعي غير مهيأة على الخادم.' };
  const r = await fetch(GEMINI_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { response_mime_type: 'application/json', response_schema: schema, max_output_tokens: max } }) });
  const data = await r.json();
  if (!r.ok) { console.error('Gemini failed', r.status, data?.error?.message); return { ok: false, error: 'تعذر إنشاء الاقتراح من خدمة Gemini.' }; }
  const text = (data?.candidates?.[0]?.content?.parts || []).map(p => typeof p?.text === 'string' ? p.text : '').join('').trim();
  if (!text) return { ok: false, error: 'عادت استجابة فارغة من خدمة الذكاء الاصطناعي.' };
  try { return { ok: true, result: JSON.parse(text) }; } catch (e) { console.error('Invalid Gemini JSON', e, text); return { ok: false, error: 'تعذر قراءة نتيجة الذكاء الاصطناعي.' }; }
}

async function handleVisitDraft(request, env) {
  let body; try { body = await request.json(); } catch { return json({ ok: false, error: 'بيانات الطلب غير صالحة.' }, 400); }
  const schoolName = clean(body?.schoolName), visitType = clean(body?.visitType);
  const actions = clean(body?.actions || body?.procedure), recommendations = clean(body?.recommendations), followUp = clean(body?.followUp);
  if (!actions && !recommendations && !followUp) return json({ ok: false, error: 'يرجى إدخال الإجراءات أو التوصيات أو المتابعة أولًا.' }, 400);
  const prompt = `أنت مستشار تربوي مهني يعمل مع مشرف تربوي في المدارس العراقية. أعد مسودة مهنية قابلة للمراجعة والرفض أو التعديل قبل اعتمادها. لا تعتبر أي اقتراح واقعة فعلية إلا بعد اعتماد المشرف.

القواعد: لا تخترع أسماء أو تواريخ أو أرقامًا أو نتائج أو وقائع. لا تضف سببًا للزيارة. لا تستنتج شخصية أو نية أو حالة نفسية لأي شخص. لا تكتب ملاحظات أو مشاهدات مستقلة ولا نقاط قوة أو احتياجات. افصل بدقة بين الإجراءات المتخذة فعليًا وبين التوصيات وبين المتابعة. إذا كانت المعطيات قليلة، قدّم اقتراحات مهنية عامة بصيغة مقترحة، ولا تعرضها كحقائق. نوع الزيارة كما أدخله المشرف.

المدرسة: ${schoolName || 'غير محددة'}
نوع الزيارة: ${visitType || 'غير محدد'}
الإجراءات المتخذة فعليًا: ${actions || 'غير مدخلة'}
التوصيات: ${recommendations || 'غير مدخلة'}
المتابعة: ${followUp || 'غير مدخلة'}

أعد أربعة بدائل لكل قسم: الأول مختصر، الثاني متوازن، الثالث الأكثر تفصيلًا والأفضل، الرابع صياغة بديلة. يجب أن تكون البدائل اقتراحات مهنية وليست وقائع مخترعة.`;
  const schema = { type: 'object', properties: {
    actionsOptions: { type: 'array', items: { type: 'string' } }, recommendationsOptions: { type: 'array', items: { type: 'string' } }, followUpOptions: { type: 'array', items: { type: 'string' } }
  }, required: ['actionsOptions','recommendationsOptions','followUpOptions'] };
  const g = await gemini(prompt, schema, env, 1800); if (!g.ok) return json(g, 502);
  const ao = arr(g.result?.actionsOptions).map(clean).filter(Boolean).slice(0,4), ro = arr(g.result?.recommendationsOptions).map(clean).filter(Boolean).slice(0,4), fo = arr(g.result?.followUpOptions).map(clean).filter(Boolean).slice(0,4);
  return json({ ok: true, result: { actions: ao[2] || ao[0] || actions, recommendations: ro[2] || ro[0] || recommendations, followUp: fo[2] || fo[0] || followUp, actionsOptions: ao, recommendationsOptions: ro, followUpOptions: fo, visitType, model: GEMINI_MODEL } });
}

async function handleMonthlyPlanSuggestion(request, env) {
  let body; try { body = await request.json(); } catch { return json({ ok: false, error: 'بيانات الطلب غير صالحة.' }, 400); }
  const month = clean(body?.month), year = clean(body?.year);
  const schools = arr(body?.schools), visits = arr(body?.visits), previousTasks = arr(body?.previousTasks), currentTasks = arr(body?.currentTasks);
  const prompt = `أنت مستشار تخطيط تربوي لمشرف مدارس عراقية. اقترح أعمالًا مهنية واقعية لخطة شهرية، على أن تكون الاقتراحات قابلة للمراجعة والرفض قبل اعتمادها. لا تخترع نتائج أو تواريخ أو وقائع. لا تكرر عملًا موجودًا في الأعمال الحالية. استفد من سجل الزيارات والأعمال السابقة لاستمرارية المتابعة المهنية فقط، ولا تستنتج شخصية أو نية أو حالة نفسية. إذا كانت مدرسة لم تُزر أو توجد متابعة مهنية غير مكتملة، يمكن اقتراح عمل مناسب لها دون الادعاء بأن ذلك حدث فعلاً. لا تجعل الاقتراحات كلها زيارات؛ نوّع بين زيارة، متابعة توصيات، تدقيق سجل، متابعة كتاب/تعميم، أو عمل إشرافي مناسب عندما تدعمه البيانات.

الشهر: ${month} ${year}
المدارس: ${JSON.stringify(schools)}
الزيارات: ${JSON.stringify(visits)}
الأعمال السابقة: ${JSON.stringify(previousTasks)}
أعمال الشهر الحالية: ${JSON.stringify(currentTasks)}

أعد حتى 6 اقتراحات فقط، وكل اقتراح يحتوي schoolId من المدارس المعطاة إن كان مرتبطًا بمدرسة، title وnotes وreason. لا تضع تاريخًا مخترعًا داخل النص.`;
  const schema = { type: 'object', properties: { suggestions: { type: 'array', items: { type: 'object', properties: { schoolId: { type: 'string' }, title: { type: 'string' }, notes: { type: 'string' }, reason: { type: 'string' } }, required: ['schoolId','title','notes','reason'] } } }, required: ['suggestions'] };
  const g = await gemini(prompt, schema, env, 1600); if (!g.ok) return json(g, 502);
  const validSchools = new Set(schools.map(s => clean(s?.id)));
  const existingTitles = new Set(currentTasks.map(t => clean(t?.title).toLowerCase()));
  const suggestions = arr(g.result?.suggestions).map(s => ({ schoolId: validSchools.has(clean(s?.schoolId)) ? clean(s.schoolId) : '', title: clean(s?.title), notes: clean(s?.notes), reason: clean(s?.reason) })).filter(s => s.title && !existingTitles.has(s.title.toLowerCase())).slice(0,6);
  return json({ ok: true, suggestions, model: GEMINI_MODEL });
}

export default { async fetch(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  const url = new URL(request.url);
  if (request.method === 'GET' && url.pathname === '/api/health') return json({ ok: true, service: 'edu-supervision-ai' });
  if (request.method === 'POST' && url.pathname === '/api/ai/visit-draft') { try { return await handleVisitDraft(request, env); } catch (e) { console.error(e); return json({ ok: false, error: 'حدث خطأ غير متوقع في خدمة الذكاء الاصطناعي.' }, 500); } }
  if (request.method === 'POST' && url.pathname === '/api/ai/monthly-plan') { try { return await handleMonthlyPlanSuggestion(request, env); } catch (e) { console.error(e); return json({ ok: false, error: 'حدث خطأ غير متوقع في اقتراح الخطة الشهرية.' }, 500); } }
  return json({ ok: false, error: 'المسار غير موجود.' }, 404);
} };