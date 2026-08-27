/**
 * Standalone production server for Expo static builds.
 *
 * Serves the output of build.js (static-build/) with:
 *
 * - GET / or /manifest with expo-platform header
 *   → platform manifest JSON
 *
 * - GET / without expo-platform
 *   → landing page HTML
 *
 * - POST /api/ai/visit-draft
 *   → Gemini AI visit drafting
 *
 * Uses only Node.js built-ins plus ./ai.js.
 */
require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');

const {
  generateVisitDraft,
} = require('./ai');

/* =========================================================
   PATHS
========================================================= */

const STATIC_ROOT = path.resolve(
  __dirname,
  '..',
  'static-build'
);

const TEMPLATE_PATH = path.resolve(
  __dirname,
  'templates',
  'landing-page.html'
);

/* =========================================================
   BASE PATH
========================================================= */

const basePath = (
  process.env.BASE_PATH || '/'
).replace(/\/+$/, '');

/* =========================================================
   MIME TYPES
========================================================= */

const MIME_TYPES = {
  '.html':
    'text/html; charset=utf-8',

  '.js':
    'application/javascript; charset=utf-8',

  '.json':
    'application/json; charset=utf-8',

  '.css':
    'text/css; charset=utf-8',

  '.png':
    'image/png',

  '.jpg':
    'image/jpeg',

  '.jpeg':
    'image/jpeg',

  '.gif':
    'image/gif',

  '.svg':
    'image/svg+xml',

  '.ico':
    'image/x-icon',

  '.woff':
    'font/woff',

  '.woff2':
    'font/woff2',

  '.ttf':
    'font/ttf',

  '.otf':
    'font/otf',

  '.map':
    'application/json',
};

/* =========================================================
   APP NAME
========================================================= */

function getAppName() {
  try {
    const appJsonPath =
      path.resolve(
        __dirname,
        '..',
        'app.json'
      );

    const appJson =
      JSON.parse(
        fs.readFileSync(
          appJsonPath,
          'utf-8'
        )
      );

    return typeof appJson.expo?.name === 'string'
      ? appJson.expo.name
      : 'App Landing Page';
  } catch {
    return 'App Landing Page';
  }
}

/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/* =========================================================
   SAFE SCRIPT STRING
========================================================= */

function toScriptString(value) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026');
}

/* =========================================================
   SEND JSON
========================================================= */

function sendJson(
  res,
  statusCode,
  data
) {
  res.writeHead(statusCode, {
    'content-type':
      'application/json; charset=utf-8',

    'access-control-allow-origin':
      '*',

    'access-control-allow-methods':
      'GET,POST,OPTIONS',

    'access-control-allow-headers':
      'Content-Type',
  });

  res.end(
    JSON.stringify(data)
  );
}

/* =========================================================
   SERVE EXPO MANIFEST
========================================================= */

function serveManifest(
  platform,
  res
) {
  const manifestPath =
    path.join(
      STATIC_ROOT,
      platform,
      'manifest.json'
    );

  if (
    !fs.existsSync(
      manifestPath
    )
  ) {
    sendJson(
      res,
      404,
      {
        error:
          `Manifest not found for platform: ${platform}`,
      }
    );

    return;
  }

  const manifest =
    fs.readFileSync(
      manifestPath,
      'utf-8'
    );

  res.writeHead(200, {
    'content-type':
      'application/json',

    'expo-protocol-version':
      '1',

    'expo-sfv-version':
      '0',
  });

  res.end(manifest);
}

/* =========================================================
   LANDING PAGE
========================================================= */

function serveLandingPage(
  req,
  res,
  landingPageTemplate,
  appName
) {
  const forwardedProto =
    req.headers[
      'x-forwarded-proto'
    ];

  const protocol =
    forwardedProto || 'https';

  const host =
    req.headers[
      'x-forwarded-host'
    ] ||
    req.headers.host;

  const baseUrl =
    `${protocol}://${host}`;

  const expsUrl =
    `exps://${host}${basePath}`;

  const html =
    landingPageTemplate
      .replace(
        /BASE_URL_PLACEHOLDER/g,
        baseUrl
      )
      .replace(
        /EXPS_URL_ATTRIBUTE_PLACEHOLDER/g,
        escapeHtml(expsUrl)
      )
      .replace(
        /EXPS_URL_JSON_PLACEHOLDER/g,
        toScriptString(expsUrl)
      )
      .replace(
        /APP_NAME_PLACEHOLDER/g,
        escapeHtml(appName)
      );

  res.writeHead(200, {
    'content-type':
      'text/html; charset=utf-8',
  });

  res.end(html);
}

/* =========================================================
   SERVE STATIC FILE
========================================================= */

function serveStaticFile(
  urlPath,
  res
) {
  /*
   * إزالة query string
   */
  const pathname =
    urlPath.split('?')[0];

  /*
   * منع الوصول إلى المسارات
   * خارج static-build
   */
  const safePath =
    path
      .normalize(pathname)
      .replace(
        /^(\.\.(\/|\\|$))+/, 
        ''
      );

  const filePath =
    path.join(
      STATIC_ROOT,
      safePath
    );

  /*
   * حماية إضافية
   */
  const relativePath =
    path.relative(
      STATIC_ROOT,
      filePath
    );

  if (
    relativePath.startsWith('..') ||
    path.isAbsolute(relativePath)
  ) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (
    !fs.existsSync(filePath) ||
    fs.statSync(filePath).isDirectory()
  ) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }

  const ext =
    path
      .extname(filePath)
      .toLowerCase();

  const contentType =
    MIME_TYPES[ext] ||
    'application/octet-stream';

  const content =
    fs.readFileSync(filePath);

  res.writeHead(200, {
    'content-type':
      contentType,
  });

  res.end(content);
}

/* =========================================================
   READ JSON BODY
========================================================= */

function readJsonBody(req) {
  return new Promise(
    (resolve, reject) => {
      let body = '';

      req.on(
        'data',
        (chunk) => {
          body += chunk.toString();

          /*
           * منع الطلبات الضخمة
           */
          if (
            body.length >
            1024 * 1024
          ) {
            reject(
              new Error(
                'Request body is too large.'
              )
            );

            req.destroy();
          }
        }
      );

      req.on(
        'end',
        () => {
          try {
            const parsed =
              JSON.parse(
                body || '{}'
              );

            resolve(parsed);
          } catch {
            reject(
              new Error(
                'Invalid JSON request body.'
              )
            );
          }
        }
      );

      req.on(
        'error',
        reject
      );
    }
  );
}

/* =========================================================
   AI VISIT DRAFT
========================================================= */

/**
 * POST /api/ai/visit-draft
 *
 * Receives:
 *
 * {
 *   procedure: "...",
 *   visitType: "...",
 *   schoolName: "..."
 * }
 *
 * Returns:
 *
 * {
 *   ok: true,
 *   result: {
 *     notes: "...",
 *     recommendations: "...",
 *     followUp: "...",
 *     model: "..."
 *   }
 * }
 */

async function handleAIVisitDraft(
  req,
  res
) {
  try {
    const input =
      await readJsonBody(req);

    /*
     * ================================================
     * البيانات القادمة من VisitAI
     * ================================================
     */

    const visitType =
      String(
        input.visitType || ''
      ).trim();

    const procedure =
      String(
        input.procedure || ''
      ).trim();

    const schoolName =
      String(
        input.schoolName || ''
      ).trim();

    /*
     * ================================================
     * التحقق
     * ================================================
     */

    if (!visitType) {
      sendJson(
        res,
        400,
        {
          ok: false,
          error:
            'نوع الزيارة مطلوب.',
          code:
            'VISIT_TYPE_REQUIRED',
        }
      );

      return;
    }

    if (!procedure) {
      sendJson(
        res,
        400,
        {
          ok: false,
          error:
            'الإجراءات أو التوصيات مطلوبة.',
          code:
            'PROCEDURE_REQUIRED',
        }
      );

      return;
    }

    /*
     * ================================================
     * إرسال البيانات إلى Gemini
     *
     * visitType = سبب الزيارة
     * procedure = الإجراءات
     * schoolName = المدرسة
     * ================================================
     */

    const result =
      await generateVisitDraft({
        procedure,
        visitType,
        schoolName,
      });

    /*
     * ================================================
     * النتيجة
     * ================================================
     */

    sendJson(
      res,
      200,
      {
        ok: true,

        result,
      }
    );
  } catch (error) {
    console.error(
      'AI visit draft error:',
      error
    );

    sendJson(
      res,
      error.status || 500,
      {
        ok: false,

        error:
          error.message ||
          'AI request failed',

        code:
          error.code ||
          'AI_REQUEST_FAILED',
      }
    );
  }
}

/* =========================================================
   LOAD TEMPLATE
========================================================= */

const landingPageTemplate =
  fs.readFileSync(
    TEMPLATE_PATH,
    'utf-8'
  );

const appName =
  getAppName();

/* =========================================================
   HTTP SERVER
========================================================= */

const server =
  http.createServer(
    async (req, res) => {
      /*
       * ================================================
       * CORS / PREFLIGHT
       * ================================================
       */

      if (
        req.method ===
        'OPTIONS'
      ) {
        res.writeHead(204, {
          'access-control-allow-origin':
            '*',

          'access-control-allow-methods':
            'GET,POST,OPTIONS',

          'access-control-allow-headers':
            'Content-Type',
        });

        res.end();

        return;
      }

      /*
       * ================================================
       * AI ENDPOINT
       * ================================================
       */

      if (
        req.method === 'POST' &&
        req.url
      ) {
        const requestUrl =
          new URL(
            req.url,
            `http://${req.headers.host}`
          );

        if (
          requestUrl.pathname ===
          '/api/ai/visit-draft'
        ) {
          await handleAIVisitDraft(
            req,
            res
          );

          return;
        }
      }

      /*
       * ================================================
       * HEALTH CHECK
       * ================================================
       */

      if (req.method === 'GET' && req.url === '/api/health') {
        sendJson(res, 200, {
          ok: true,
          service: 'edu-supervision-server',
          aiConfigured: Boolean(process.env.GEMINI_API_KEY),
        });
        return;
      }

      /*
       * ================================================
       * STATIC EXPO SERVER
       * ================================================
       */

      const url =
        new URL(
          req.url || '/',
          `http://${req.headers.host}`
        );

      let pathname =
        url.pathname;

      /*
       * إزالة BASE_PATH
       */
      if (
        basePath &&
        pathname.startsWith(
          basePath
        )
      ) {
        pathname =
          pathname.slice(
            basePath.length
          ) || '/';
      }

      /*
       * ================================================
       * MANIFEST / LANDING
       * ================================================
       */

      if (
        pathname === '/' ||
        pathname === '/manifest'
      ) {
        const platform =
          req.headers[
            'expo-platform'
          ];

        if (
          platform === 'ios' ||
          platform === 'android'
        ) {
          return serveManifest(
            platform,
            res
          );
        }

        if (
          pathname === '/'
        ) {
          return serveLandingPage(
            req,
            res,
            landingPageTemplate,
            appName
          );
        }
      }

      /*
       * ================================================
       * STATIC FILE
       * ================================================
       */

      serveStaticFile(
        pathname,
        res
      );
    }
  );

/* =========================================================
   START SERVER
========================================================= */

const port =
  parseInt(
    process.env.PORT || '3000',
    10
  );

server.listen(
  port,
  '0.0.0.0',
  () => {
    console.log(
      `Serving static Expo build on port ${port}`
    );

    console.log(
      `AI endpoint: POST http://localhost:${port}/api/ai/visit-draft`
    );
  }
);