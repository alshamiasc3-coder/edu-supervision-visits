const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' };
const RAW_BASE = 'https://raw.githubusercontent.com/alshamiasc3-coder/edu-supervision-visits/photo-restoration/assets/legislation/';
const LEGISLATION = {
  exams1983: { title: 'تعليمات الامتحانات لسنة 1983', file: 'تعليمات_الامتحانات_لسنة_1983_من_الموسوعة_1_24.pdf', keywords: ['امتحان','امتحانات','اختبار','مراقبة','قاعة','دفتر','تصحيح','درجات','نتائج','لجنة'] },
  exams1987: { title: 'نظام الامتحانات العامة رقم (18) لسنة 1987', file: 'نظام_الامتحانات_العامة_رقم_18_لسنة_1987_من_الموسوعة.pdf', keywords: ['امتحان','امتحانات','امتحان عام','شهادة','نتائج','درجات','لجنة'] },
  secondary1977: { title: 'نظام المدارس الثانوية رقم (2) لسنة 1977 المعدل', file: 'نظام_المدارس_الثانوية_رقم_2_لسنة_1977_المعدل_من_الموسوعة.pdf', keywords: ['مدرسة ثانوية','دوام','طلبة','طلاب','حضور','غياب','مدير','هيئة تعليمية','سجل','انضباط'] },
  vocational2016: { title: 'نظام التعليم المهني رقم (6) لسنة 2016', file: 'نظام_التعليم_المهني_رقم_6_لسنة_2016.pdf', keywords: ['مهني','مهني','تخصص مهني','ورش','تدريب مهني','التعليم المهني'] },
  discipline1991: { title: 'قانون انضباط موظفي الدولة والقطاع العام رقم (14) لسنة 1991 المعدل', file: 'قانون_انضباط_موظفي_الدولة_رقم_14_لسنة_1991_المعدل_من_الموسوعة.pdf', keywords: ['موظف','انضباط','مخالفة','واجب','عقوبة','غياب موظف','مساءلة','دوام موظف'] },
};
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' } }); }
function clean(v) { return v == null ? '' : String(v).trim(); }
function arr(v) { return Array.isArray(v) ? v : []; }
function normalize(v) { return clean(v).replace(/[ًٌٍَُِّْـ]/g, '').replace(/أ|إ|آ/g, 'ا').replace(/ى/g, 'ي').toLowerCase(); }

async function gemini(parts, schema, env, max = 1800) {
  if (!env.GEMINI_API_KEY) return { ok: false, error: 'خدمة الذكاء الاصطناعي غير مهيأة على الخادم.' };
  const r = await fetch(GEMINI_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY }, body: JSON.stringify({ contents: [{ parts }], generationConfig: { response_mime_type: 'application/json', response_schema: schema, max_output_tokens: max } }) });
  const data = await r.json();
  if (!r.ok) { console.error('Gemini failed', r.status, data?.error?.message); return { ok: false, error: 'تعذر إنشاء المسودة من خدمة الذكاء الاصطناعي.' }; }
  const text = (data?.candidates?.[0]?.content?.parts || []).map(p => typeof p?.text === 'string' ? p.text : '').join('').trim();
  if (!text) return { ok: false, error: 'عادت استجابة فارغة من خدمة الذكاء الاصطناعي.' };
  try { return { ok: true, result: JSON.parse(text) }; } catch (e) { console.error('Invalid Gemini JSON', e, text); return { ok: false, error: 'تعذر قراءة نتيجة الذكاء الاصطناعي.' }; }
}
function imagePart(dataUrl) {
  const match = clean(dataUrl).match(/^data:([^;]+);base64,(.+)$/s); if (!match) return null;
  return { inline_data: { mime_type: match[1], data: match[2] } };
}
function bytesToBase64(bytes) {
  let binary = ''; const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  return btoa(binary);
}
async function legislationPart(doc) {
  const r = await fetch(RAW_BASE + encodeURIComponent(doc.file));
  if (!r.ok) throw new Error(`تعذر تحميل المرجع التشريعي: ${doc.title}`);
  const bytes = new Uint8Array(await r.arrayBuffer());
  return { inline_data: { mime_type: 'application/pdf', data: bytesToBase64(bytes) } };
}
function chooseLegislation(body) {
  const text = normalize([body?.visitType, body?.actions, body?.recommendations, body?.followUp].join(' '));
  const scored = Object.values(LEGISLATION).map(doc => ({ doc, score: doc.keywords.reduce((n, k) => n + (text.includes(normalize(k)) ? 1 : 0), 0) })).sort((a,b) => b.score - a.score);
  return scored[0]?.score ? scored[0].doc : null;
}

async function handleVisitDraftFromImage(request, env) {
  let body; try { body = await request.json(); } catch { return json({ ok: false, error: 'بيانات الطلب غير صالحة.' }, 400); }
  const schoolName = clean(body?.schoolName), visitType = clean(body?.visitType), briefContext = clean(body?.briefContext), registerImage = clean(body?.registerImage);
  const previousVisits = arr(body?.previousVisits).slice(0, 8);
  if (!visitType) return json({ ok: false, error: 'نوع الزيارة مطلوب.' }, 400);
  const image = imagePart(registerImage); if (!image) return json({ ok: false, error: 'صورة سجل الزيارة مطلوبة وبصيغة صورة صالحة.' }, 400);
  const doc = chooseLegislation(body); let legalPart = null; try { if (doc) legalPart = await legislationPart(doc); } catch (e) { console.error(e); }
  const legalInstruction = doc ? `يوجد أدناه المرجع المحلي الأصلي: ${doc.title}. استخدمه فقط للتحقق من السند التشريعي. لا تخمن رقم مادة أو فقرة أو صفحة. إذا لم تستطع إثباتها من الملف فأعد legalReferences فارغة.` : 'لا يوجد مرجع محلي محدد؛ لا تنشئ أي سند تشريعي.';
  const prompt = `أنت مساعد مهني للمشرف التربوي في المدارس العراقية. لديك صورة لسجل زيارة ورقية، وسجل زيارات سابقة، ونوع الزيارة، ومرجع تشريعي محلي أصلي عند توفره.

مهمتك إعداد مسودة قابلة للمراجعة في أربعة أقسام فقط: نوع الزيارة، الإجراءات المتخذة فعليًا، التوصيات، المتابعة.

قواعد صارمة: صورة السجل هي المصدر الأساسي للوقائع الحالية. لا تخترع إجراءات أو نتائج أو أسماء أو أرقامًا أو تواريخ. الزيارات السابقة للسياق والاستمرارية فقط. لا تستنتج شخصية أو نية أو حالة نفسية. لا تضف سببًا للزيارة أو ملاحظات مستقلة. التوصيات والمتابعة اقتراحات مهنية وليست وقائع. ${legalInstruction}

إذا كان المرجع يثبت صلة قانونية بالتوصيات، أعد بعد ذلك legalReferences: قائمة من 0 إلى 4 عناصر، وكل عنصر: recommendationIndex (رقم التوصية 1-4)، legislationTitle، article، paragraph، page، basis. article وparagraph وpage يجب أن تكون نصوصًا مستخرجة أو محددة بوضوح من الملف؛ إذا لم تكن متاحة اتركها فارغة. basis وصف قصير لما يدعم التوصية دون اختلاق نص قانوني.

المدرسة: ${schoolName || 'غير محددة'}
نوع الزيارة: ${visitType}
محاور إضافية: ${briefContext || 'لا توجد'}
الزيارات السابقة: ${JSON.stringify(previousVisits)}

أعد JSON يحتوي على visitType, actions, recommendations, followUp, legalReferences.`;
  const schema = { type: 'object', properties: {
    visitType: { type: 'string' }, actions: { type: 'string' }, recommendations: { type: 'string' }, followUp: { type: 'string' },
    legalReferences: { type: 'array', items: { type: 'object', properties: { recommendationIndex: { type: 'integer' }, legislationTitle: { type: 'string' }, article: { type: 'string' }, paragraph: { type: 'string' }, page: { type: 'string' }, basis: { type: 'string' } }, required: ['recommendationIndex','legislationTitle','article','paragraph','page','basis'] } }
  }, required: ['visitType','actions','recommendations','followUp','legalReferences'] };
  const parts = [{ text: prompt }, image]; if (legalPart) parts.push(legalPart);
  const g = await gemini(parts, schema, env, 2400); if (!g.ok) return json(g, 502);
  const refs = arr(g.result?.legalReferences).map(x => ({ recommendationIndex: Number(x?.recommendationIndex) || 0, legislationTitle: clean(x?.legislationTitle), article: clean(x?.article), paragraph: clean(x?.paragraph), page: clean(x?.page), basis: clean(x?.basis) })).filter(x => x.recommendationIndex >= 1 && x.recommendationIndex <= 4 && x.legislationTitle && x.basis).slice(0,4);
  const result = { visitType: clean(g.result?.visitType) || visitType, actions: clean(g.result?.actions), recommendations: clean(g.result?.recommendations), followUp: clean(g.result?.followUp), legalReferences: refs, model: GEMINI_MODEL };
  if (!result.actions) return json({ ok: false, error: 'لم يتمكن المساعد من استخراج إجراءات واضحة من صورة السجل. جرّب صورة أوضح.' }, 422);
  return json({ ok: true, result });
}

async function handleVisitDraft(request, env) {
  let body; try { body = await request.json(); } catch { return json({ ok: false, error: 'بيانات الطلب غير صالحة.' }, 400); }
  const schoolName = clean(body?.schoolName), visitType = clean(body?.visitType);
  const actions = clean(body?.actions || body?.procedure), recommendations = clean(body?.recommendations), followUp = clean(body?.followUp);
  if (!actions && !recommendations && !followUp) return json({ ok: false, error: 'يرجى إدخال الإجراءات أو التوصيات أو المتابعة أولًا.' }, 400);
  const doc = chooseLegislation(body); let legalPart = null; if (doc) { try { legalPart = await legislationPart(doc); } catch (e) { console.error(e); } }
  const legalInstruction = doc ? `المرجع المحلي المرفق هو ${doc.title}. افحصه مباشرة قبل إصدار أي سند. لا تخمن أرقام المواد أو الفقرات أو الصفحات. إذا لم يثبت المرجع الصلة، اجعل legalReferences فارغة.` : 'لا يوجد تطابق واضح مع المراجع المحلية المتاحة؛ لا تضع أي سند تشريعي.';
  const prompt = `أنت مستشار تربوي مهني يعمل مع مشرف تربوي في المدارس العراقية. أعد أربعة بدائل مهنية لكل من الإجراءات والتوصيات والمتابعة، قابلة للمراجعة قبل الاعتماد.

القواعد: لا تخترع أسماء أو تواريخ أو أرقامًا أو نتائج أو وقائع. لا تضف سببًا للزيارة. لا تستنتج شخصية أو نية أو حالة نفسية. افصل الإجراءات الفعلية عن التوصيات والمتابعة. التوصيات والمتابعة مقترحات وليست وقائع. ${legalInstruction}

بالنسبة للتوصيات الأربعة، أنشئ legalReferences عند وجود سند مثبت فقط. كل عنصر يحتوي recommendationIndex (1-4)، legislationTitle، article، paragraph، page، basis. رقم المادة والفقرة والصفحة يجب أن تكون مستندة مباشرة إلى الملف. لا تستخدم أرقامًا متوقعة من المعرفة العامة.

المدرسة: ${schoolName || 'غير محددة'}
نوع الزيارة: ${visitType || 'غير محدد'}
الإجراءات المتخذة فعليًا: ${actions || 'غير مدخلة'}
التوصيات: ${recommendations || 'غير مدخلة'}
المتابعة: ${followUp || 'غير مدخلة'}

أعد JSON: actionsOptions, recommendationsOptions, followUpOptions, legalReferences.`;
  const schema = { type: 'object', properties: {
    actionsOptions: { type: 'array', items: { type: 'string' } }, recommendationsOptions: { type: 'array', items: { type: 'string' } }, followUpOptions: { type: 'array', items: { type: 'string' } },
    legalReferences: { type: 'array', items: { type: 'object', properties: { recommendationIndex: { type: 'integer' }, legislationTitle: { type: 'string' }, article: { type: 'string' }, paragraph: { type: 'string' }, page: { type: 'string' }, basis: { type: 'string' } }, required: ['recommendationIndex','legislationTitle','article','paragraph','page','basis'] } }
  }, required: ['actionsOptions','recommendationsOptions','followUpOptions','legalReferences'] };
  const parts = [{ text: prompt }]; if (legalPart) parts.push(legalPart);
  const g = await gemini(parts, schema, env, 2200); if (!g.ok) return json(g, 502);
  const ao = arr(g.result?.actionsOptions).map(clean).filter(Boolean).slice(0,4), ro = arr(g.result?.recommendationsOptions).map(clean).filter(Boolean).slice(0,4), fo = arr(g.result?.followUpOptions).map(clean).filter(Boolean).slice(0,4);
  const refs = arr(g.result?.legalReferences).map(x => ({ recommendationIndex: Number(x?.recommendationIndex) || 0, legislationTitle: clean(x?.legislationTitle), article: clean(x?.article), paragraph: clean(x?.paragraph), page: clean(x?.page), basis: clean(x?.basis) })).filter(x => x.recommendationIndex >= 1 && x.recommendationIndex <= 4 && x.legislationTitle && x.basis).slice(0,4);
  return json({ ok: true, result: { actions: ao[2] || ao[0] || actions, recommendations: ro[2] || ro[0] || recommendations, followUp: fo[2] || fo[0] || followUp, actionsOptions: ao, recommendationsOptions: ro, followUpOptions: fo, legalReferences: refs, visitType, model: GEMINI_MODEL } });
}

async function handleMonthlyPlanSuggestion(request, env) {
  let body; try { body = await request.json(); } catch { return json({ ok: false, error: 'بيانات الطلب غير صالحة.' }, 400); }
  const month = clean(body?.month), year = clean(body?.year); const schools = arr(body?.schools), visits = arr(body?.visits), previousTasks = arr(body?.previousTasks), currentTasks = arr(body?.currentTasks);
  const prompt = `أنت مستشار تخطيط تربوي لمشرف مدارس عراقية. اقترح أعمالًا مهنية واقعية لخطة شهرية، قابلة للمراجعة والرفض قبل اعتمادها. لا تخترع نتائج أو تواريخ أو وقائع. لا تكرر عملًا موجودًا. استفد من سجل الزيارات والأعمال السابقة للاستمرارية المهنية فقط، ولا تستنتج شخصية أو نية أو حالة نفسية. إذا كانت مدرسة لم تُزر أو توجد متابعة غير مكتملة، يمكن اقتراح عمل مناسب دون الادعاء بأنه حدث. نوّع بين زيارة، متابعة توصيات، تدقيق سجل، متابعة كتاب/تعميم، أو عمل إشرافي مناسب عندما تدعمه البيانات.

الشهر: ${month} ${year}
المدارس: ${JSON.stringify(schools)}
الزيارات: ${JSON.stringify(visits)}
الأعمال السابقة: ${JSON.stringify(previousTasks)}
أعمال الشهر الحالية: ${JSON.stringify(currentTasks)}

أعد حتى 6 اقتراحات فقط، وكل اقتراح يحتوي schoolId من المدارس المعطاة إن كان مرتبطًا بمدرسة، title وnotes وreason. لا تضع تاريخًا مخترعًا داخل النص.`;
  const schema = { type: 'object', properties: { suggestions: { type: 'array', items: { type: 'object', properties: { schoolId: { type: 'string' }, title: { type: 'string' }, notes: { type: 'string' }, reason: { type: 'string' } }, required: ['schoolId','title','notes','reason'] } } }, required: ['suggestions'] };
  const g = await gemini([{ text: prompt }], schema, env, 1600); if (!g.ok) return json(g, 502);
  const validSchools = new Set(schools.map(s => clean(s?.id))); const existingTitles = new Set(currentTasks.map(t => clean(t?.title).toLowerCase()));
  const suggestions = arr(g.result?.suggestions).map(s => ({ schoolId: validSchools.has(clean(s?.schoolId)) ? clean(s.schoolId) : '', title: clean(s?.title), notes: clean(s?.notes), reason: clean(s?.reason) })).filter(s => s.title && !existingTitles.has(s.title.toLowerCase())).slice(0,6);
  return json({ ok: true, suggestions, model: GEMINI_MODEL });
}

export default { async fetch(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  const url = new URL(request.url);
  if (request.method === 'GET' && url.pathname === '/api/health') return json({ ok: true, service: 'edu-supervision-ai' });
  if (request.method === 'POST' && url.pathname === '/api/ai/visit-draft-image') { try { return await handleVisitDraftFromImage(request, env); } catch (e) { console.error(e); return json({ ok: false, error: 'حدث خطأ غير متوقع أثناء قراءة صورة السجل.' }, 500); } }
  if (request.method === 'POST' && url.pathname === '/api/ai/visit-draft') { try { return await handleVisitDraft(request, env); } catch (e) { console.error(e); return json({ ok: false, error: 'حدث خطأ غير متوقع في خدمة الذكاء الاصطناعي.' }, 500); } }
  if (request.method === 'POST' && url.pathname === '/api/ai/monthly-plan') { try { return await handleMonthlyPlanSuggestion(request, env); } catch (e) { console.error(e); return json({ ok: false, error: 'حدث خطأ غير متوقع في اقتراح الخطة الشهرية.' }, 500); } }
  return json({ ok: false, error: 'المسار غير موجود.' }, 404);
} };