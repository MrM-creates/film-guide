const maxPdfUploadBytes = 20 * 1024 * 1024;
const maxFactsheetChars = 36000;

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  try {
    const buffer = await readRawBody(request, maxPdfUploadBytes);
    if (!buffer.length) {
      return sendJson(response, 400, { error: "PDF-Datei fehlt." });
    }

    const sourceName = clean(request.query?.sourceName) || "PDF Factsheet";
    const result = await extractPdfText(buffer);
    const text = clean(result.text).slice(0, maxFactsheetChars);

    if (text.length < 120) {
      return sendJson(response, 422, {
        error: "Aus dem PDF konnte zu wenig Text extrahiert werden. OCR ist noch nicht integriert."
      });
    }

    return sendJson(response, 200, {
      sourceName,
      text,
      pages: result.total
    });
  } catch (error) {
    return sendJson(response, 422, {
      error: `PDF konnte nicht gelesen werden: ${error.message || "Unbekannter Fehler"}`
    });
  }
};

module.exports.config = {
  api: {
    bodyParser: false
  }
};

async function extractPdfText(buffer) {
  installPdfJsNodePolyfills();
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableFontFace: true,
    isEvalSupported: false,
    useWorkerFetch: false
  });
  const document = await loadingTask.promise;

  try {
    const pages = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map(item => item.str || "").join(" "));
    }

    return {
      text: pages.join("\n\n"),
      total: document.numPages
    };
  } finally {
    await document.destroy();
  }
}

function installPdfJsNodePolyfills() {
  const canvas = require("@napi-rs/canvas");
  globalThis.DOMMatrix ||= canvas.DOMMatrix;
  globalThis.DOMPoint ||= canvas.DOMPoint;
  globalThis.DOMRect ||= canvas.DOMRect;
  globalThis.ImageData ||= canvas.ImageData;
  globalThis.Path2D ||= canvas.Path2D;
}

async function readRawBody(request, maxBytes) {
  if (Buffer.isBuffer(request.body)) return request.body;
  if (typeof request.body === "string") return Buffer.from(request.body);

  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maxBytes) throw new Error("Upload ist zu groß.");
    chunks.push(buffer);
  }

  return Buffer.concat(chunks);
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function clean(value) {
  return String(value || "").trim();
}
