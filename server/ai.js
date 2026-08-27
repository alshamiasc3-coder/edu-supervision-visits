const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent';

const DEFAULT_MODEL = 'gemini-3.5-flash-lite';

/**
 * =========================================================
 * بناء طلب الذكاء الاصطناعي
 *
 * ملاحظة:
 * نوع الزيارة يأتي من visit-form.tsx كما اختاره المشرف.
 *
 * لا توجد هنا قائمة ثابتة لأنواع الزيارات.
 * =========================================================
 */

function buildPrompt({
  procedure,
  visitType,
  schoolName,
}) {
  return `
أنت مساعد ذكي متخصص في الإشراف التربوي في المدارس العراقية.

مهمتك إعداد صياغة مهنية رسمية لسجل زيارة مدرسية اعتمادًا
فقط على البيانات التي أدخلها المشرف.

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

/**
 * =========================================================
 * استخراج النص من استجابة Gemini
 * =========================================================
 */

function extractOutputText(data) {
  const parts =
    data?.candidates?.[0]?.content?.parts || [];

  return parts
    .map((part) => {
      if (
        typeof part?.text === 'string'
      ) {
        return part.text;
      }

      return '';
    })
    .join('')
    .trim();
}

/**
 * =========================================================
 * تنظيف النص
 * =========================================================
 */

function cleanText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  return String(value).trim();
}

/**
 * =========================================================
 * إنشاء صياغة الزيارة بواسطة Gemini
 * =========================================================
 */

async function generateVisitDraft({
  procedure,
  visitType,
  schoolName,
}) {
  const apiKey =
    process.env.GEMINI_API_KEY;

  /**
   * التحقق من وجود مفتاح Gemini
   */

  if (!apiKey) {
    const error =
      new Error(
        'GEMINI_API_KEY is not configured on the server.'
      );

    error.code =
      'GEMINI_API_KEY_MISSING';

    throw error;
  }

  /**
   * تنظيف البيانات القادمة من التطبيق
   */

  const cleanProcedure =
    cleanText(procedure);

  const cleanVisitType =
    cleanText(visitType);

  const cleanSchoolName =
    cleanText(schoolName);

  /**
   * إرسال الطلب إلى Gemini
   */

  const response =
    await fetch(
      GEMINI_API_URL,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',

          'x-goog-api-key':
            apiKey,
        },

        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    buildPrompt({
                      procedure:
                        cleanProcedure,

                      visitType:
                        cleanVisitType,

                      schoolName:
                        cleanSchoolName,
                    }),
                },
              ],
            },
          ],

          generationConfig: {
            response_mime_type:
              'application/json',

            response_schema: {
              type: 'object',

              properties: {
                notes: {
                  type: 'string',
                },

                recommendations: {
                  type: 'string',
                },

                followUp: {
                  type: 'string',
                },
              },

              required: [
                'notes',
                'recommendations',
                'followUp',
              ],
            },

            temperature: 0.3,

            max_output_tokens: 1200,
          },
        }),
      }
    );

  /**
   * قراءة استجابة Gemini
   */

  const data =
    await response.json();

  /**
   * معالجة أخطاء Gemini
   */

  if (!response.ok) {
    const message =
      data?.error?.message ||
      `Gemini request failed with status ${response.status}`;

    const error =
      new Error(message);

    error.code =
      'GEMINI_REQUEST_FAILED';

    error.status =
      response.status;

    throw error;
  }

  /**
   * استخراج النص
   */

  const outputText =
    extractOutputText(data);

  if (!outputText) {
    const error =
      new Error(
        'Gemini returned an empty response.'
      );

    error.code =
      'GEMINI_EMPTY_RESPONSE';

    throw error;
  }

  /**
   * تحويل JSON القادم من Gemini
   */

  let result;

  try {
    result =
      JSON.parse(outputText);
  } catch {
    const error =
      new Error(
        'Gemini returned invalid JSON.'
      );

    error.code =
      'GEMINI_INVALID_JSON';

    throw error;
  }

  /**
   * النتيجة النهائية
   */

  return {
    notes:
      cleanText(
        result?.notes
      ),

    recommendations:
      cleanText(
        result?.recommendations
      ),

    followUp:
      cleanText(
        result?.followUp
      ),

    /**
     * نعيد نوع الزيارة أيضًا
     * حتى يبقى محفوظًا كما اختاره المشرف.
     */

    visitType:
      cleanVisitType,

    model:
      DEFAULT_MODEL,
  };
}

/**
 * =========================================================
 * التصدير
 * =========================================================
 */

module.exports = {
  generateVisitDraft,
};