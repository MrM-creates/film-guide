const { PDFParse } = require("pdf-parse");

const maxPdfUploadBytes = 20 * 1024 * 1024;
const maxFactsheetChars = 36000;

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  let parser;
  try {
    const buffer = await readRawBody(request, maxPdfUploadBytes);
    if (!buffer.length) {
      return sendJson(response, 400, { error: "PDF-Datei fehlt." });
    }

    const sourceName = clean(request.query?.sourceName) || "PDF Factsheet";
    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
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
  } finally {
    await parser?.destroy();
  }
};

module.exports.config = {
  api: {
    bodyParser: false
  }
};

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
