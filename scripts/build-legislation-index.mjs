#!/usr/bin/env node
/**
 * Build a searchable legislation index from the official local PDFs.
 *
 * Run from the project root:
 *   npm install -D pdfjs-dist
 *   node scripts/build-legislation-index.mjs
 *
 * The script NEVER invents legal text. It extracts only text that exists
 * in the supplied PDF files and records the source page.
 */

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const LEGISLATION_DIR = path.join(ROOT, 'assets', 'legislation');
const OUT = path.join(LEGISLATION_DIR, 'index.json');

const DOCS = [
  {
    id: 'exams1983',
    title: 'تعليمات الامتحانات لسنة 1983',
    file: 'تعليمات_الامتحانات_لسنة_1983_من_الموسوعة_1_24.pdf',
  },
  {
    id: 'exams1987',
    title: 'نظام الامتحانات العامة رقم (18) لسنة 1987',
    file: 'نظام_الامتحانات_العامة_رقم_18_لسنة_1987_من_الموسوعة.pdf',
  },
  {
    id: 'secondary1977',
    title: 'نظام المدارس الثانوية رقم (2) لسنة 1977 المعدل',
    file: 'نظام_المدارس_الثانوية_رقم_2_لسنة_1977_المعدل_من_الموسوعة.pdf',
  },
  {
    id: 'vocational2016',
    title: 'نظام التعليم المهني رقم (6) لسنة 2016',
    file: 'نظام_التعليم_المهني_رقم_6_لسنة_2016.pdf',
  },
  {
    id: 'discipline1991',
    title: 'قانون انضباط موظفي الدولة والقطاع العام رقم (14) لسنة 1991 المعدل',
    file: 'قانون_انضباط_موظفي_الدولة_رقم_14_لسنة_1991_المعدل_من_الموسوعة.pdf',
  },
];

const clean = (v) =>
  String(v ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const normalize = (v) =>
  clean(v)
    .replace(/[ًٌٍَُِّْـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .toLowerCase();

function articleNumber(value) {
  return clean(value).replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

function extractArticleHeader(text) {
  const patterns = [
    /(?:^|\n)\s*(?:المادة|مادة)\s*[\(\[（]?\s*([0-9٠-٩]+)\s*[\)\]）]?\s*[:\-–—]?/u,
    /(?:^|\n)\s*المادة\s+([0-9٠-٩]+)\s*[:\-–—]?/u,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return articleNumber(m[1]);
  }
  return '';
}

function extractParagraph(text) {
  const m = text.match(/(?:^|\n)\s*[\(\[（]?\s*([أ-ي])\s*[\)\]）]\s*/u);
  return m ? `الفقرة (${m[1]})` : '';
}

function makeChunks(pageText) {
  const text = clean(pageText);
  if (!text) return [];

  // Prefer explicit article headings. If a page contains multiple articles,
  // split at those headings while retaining the exact extracted text.
  const re = /(?:^|\n)\s*(?:المادة|مادة)\s*[\(\[（]?\s*([0-9٠-٩]+)\s*[\)\]）]?\s*[:\-–—]?/gu;
  const matches = [...text.matchAll(re)];

  if (!matches.length) {
    return [{
      article: '',
      paragraph: extractParagraph(text),
      text,
    }];
  }

  const chunks = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index ?? 0;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length;
    const chunk = clean(text.slice(start, end));
    if (!chunk) continue;
    chunks.push({
      article: articleNumber(matches[i][1]),
      paragraph: extractParagraph(chunk),
      text: chunk,
    });
  }
  return chunks;
}

async function loadPdfJs() {
  try {
    return await import('pdfjs-dist/legacy/build/pdf.mjs');
  } catch {
    throw new Error(
      'لم يتم العثور على pdfjs-dist. نفّذ أولًا: npm install -D pdfjs-dist'
    );
  }
}

async function extractDocument(pdfjs, doc) {
  const filePath = path.join(LEGISLATION_DIR, doc.file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`الملف غير موجود: ${filePath}`);
  }

  const bytes = new Uint8Array(fs.readFileSync(filePath));
  const pdf = await pdfjs.getDocument({ data: bytes, disableWorker: true }).promise;
  const records = [];
  let extractedChars = 0;

  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
    const page = await pdf.getPage(pageNo);
    const content = await page.getTextContent();

    // Group text items roughly by their vertical position so Arabic lines
    // remain readable instead of becoming one long unordered string.
    const rows = new Map();
    for (const item of content.items) {
      if (!('str' in item)) continue;
      const str = clean(item.str);
      if (!str) continue;
      const y = Math.round(item.transform?.[5] ?? 0);
      const key = String(y);
      if (!rows.has(key)) rows.set(key, []);
      rows.get(key).push(item);
    }

    const lines = [...rows.entries()]
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([, items]) =>
        items
          .sort((a, b) => (a.transform?.[4] ?? 0) - (b.transform?.[4] ?? 0))
          .map((x) => x.str)
          .join(' ')
      );

    const pageText = clean(lines.join('\n'));
    extractedChars += pageText.length;

    for (const chunk of makeChunks(pageText)) {
      records.push({
        id: `${doc.id}-p${pageNo}-a${chunk.article || 'page'}`,
        legislationId: doc.id,
        legislationTitle: doc.title,
        file: doc.file,
        page: String(pageNo),
        article: chunk.article,
        paragraph: chunk.paragraph,
        text: chunk.text,
      });
    }
  }

  return {
    ...doc,
    pages: pdf.numPages,
    extractedChars,
    records,
  };
}

async function main() {
  const pdfjs = await loadPdfJs();
  const documents = [];

  for (const doc of DOCS) {
    console.log(`استخراج: ${doc.title}`);
    const result = await extractDocument(pdfjs, doc);
    documents.push(result);
    console.log(`  الصفحات: ${result.pages} | الأحرف المستخرجة: ${result.extractedChars} | المقاطع: ${result.records.length}`);
  }

  const totalChars = documents.reduce((n, d) => n + d.extractedChars, 0);
  const index = {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: 'assets/legislation/*.pdf',
    warning:
      'هذا الفهرس مستخرج آليًا من ملفات PDF المحلية. النص القانوني الأصلي هو المرجع النهائي.',
    documents,
    records: documents.flatMap((d) => d.records),
    stats: {
      documents: documents.length,
      records: documents.reduce((n, d) => n + d.records.length, 0),
      extractedChars: totalChars,
      documentsWithoutText: documents.filter((d) => d.extractedChars === 0).map((d) => d.id),
    },
  };

  fs.writeFileSync(OUT, JSON.stringify(index, null, 2), 'utf8');
  console.log(`\nتم إنشاء الفهرس: ${path.relative(ROOT, OUT)}`);
  console.log(`إجمالي المقاطع: ${index.stats.records}`);
  if (index.stats.documentsWithoutText.length) {
    console.warn(
      `تحذير: لم يُستخرج نص من: ${index.stats.documentsWithoutText.join(', ')}. قد تكون هذه الملفات صورًا ممسوحة ضوئيًا.`
    );
  }
}

main().catch((error) => {
  console.error('\nفشل إنشاء الفهرس:', error?.message || error);
  process.exit(1);
});
