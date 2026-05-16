import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFParse } from "pdf-parse";

const rootDir = resolve(fileURLToPath(new URL("..", import.meta.url)));

await loadDotEnv(join(rootDir, ".env"));

const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const openAiBaseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const openAiModel = process.env.OPENAI_MODEL || "gpt-5-mini";
const maxFactsheetChars = 36000;
const maxPdfUploadBytes = 20 * 1024 * 1024;

const mimeTypes = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".webp": "image/webp"
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || `${host}:${port}`}`);

    if (request.method === "POST" && url.pathname === "/api/factsheet/propose") {
      await handleFactsheetProposal(request, response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/factsheet/read-url") {
      await handleReadUrl(request, response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/factsheet/extract-pdf") {
      await handleExtractPdf(request, response, url);
      return;
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      sendJson(response, 405, { error: "Method not allowed" });
      return;
    }

    await serveStatic(url.pathname, request.method === "HEAD", response);
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Server error" });
  }
});

server.listen(port, host, () => {
  console.log(`FilmGuide Admin running at http://${host}:${port}/admin/`);
});

async function handleFactsheetProposal(request, response) {
  if (!process.env.OPENAI_API_KEY) {
    sendJson(response, 503, {
      error: "OPENAI_API_KEY fehlt. Lokale Regel-Auswertung wird verwendet."
    });
    return;
  }

  const body = await readJsonBody(request);
  const sourceName = clean(body.sourceName) || "Factsheet";
  const factsheetText = clean(body.text).slice(0, maxFactsheetChars);
  const localProposal = body.localProposal && typeof body.localProposal === "object" ? body.localProposal : null;

  if (factsheetText.length < 120) {
    sendJson(response, 400, { error: "Factsheet-Text ist zu kurz." });
    return;
  }

  const apiResponse = await fetch(`${openAiBaseUrl}/responses`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: openAiModel,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "Du bist ein deutschsprachiger analog-film editor fuer FilmGuide.",
                "Erzeuge faktenbasierte, kurze und ansprechende Admin-Vorschlaege.",
                "Trenne belegte technische Fakten von Interpretation.",
                "Erfinde keine harten technischen Werte. Wenn etwas unsicher ist, markiere review_needed und ergaenze review_notes.",
                "Ton: menschlich, praktisch, bildorientiert, nicht werblich, nicht technisch trocken."
              ].join(" ")
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                sourceName,
                localProposal,
                factsheetText
              })
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "filmguide_factsheet_proposal",
          strict: true,
          schema: getProposalSchema()
        }
      }
    })
  });

  const payload = await apiResponse.json().catch(() => ({}));
  if (!apiResponse.ok) {
    sendJson(response, apiResponse.status, {
      error: payload.error?.message || "LLM-Vorschlag konnte nicht erstellt werden."
    });
    return;
  }

  const proposal = parseOpenAiJson(payload);
  sendJson(response, 200, {
    sourceName,
    provider: "openai",
    model: openAiModel,
    proposal
  });
}

async function handleReadUrl(request, response) {
  const body = await readJsonBody(request);
  const sourceUrl = clean(body.url);
  if (!sourceUrl) {
    sendJson(response, 400, { error: "URL fehlt." });
    return;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(sourceUrl);
  } catch {
    sendJson(response, 400, { error: "URL ist ungültig." });
    return;
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    sendJson(response, 400, { error: "Nur HTTP- und HTTPS-URLs sind erlaubt." });
    return;
  }

  if (isBlockedUrlHost(parsedUrl.hostname)) {
    sendJson(response, 400, { error: "Lokale oder private Netzwerkadressen sind fuer URL-Import nicht erlaubt." });
    return;
  }

  const fetched = await fetch(parsedUrl, {
    headers: {
      "User-Agent": "FilmGuideAdmin/1.0 (+local factsheet import)"
    }
  });

  if (!fetched.ok) {
    sendJson(response, fetched.status, { error: `URL konnte nicht gelesen werden: HTTP ${fetched.status}` });
    return;
  }

  const contentType = fetched.headers.get("content-type") || "";
  if (!/text\/html|text\/plain|application\/xhtml\+xml/i.test(contentType)) {
    sendJson(response, 415, { error: `URL liefert keinen lesbaren Text (${contentType || "unbekannt"}).` });
    return;
  }

  const raw = await fetched.text();
  const text = extractReadableText(raw).slice(0, maxFactsheetChars);
  if (text.length < 120) {
    sendJson(response, 422, { error: "Aus der URL konnte zu wenig Text extrahiert werden." });
    return;
  }

  sendJson(response, 200, {
    sourceName: parsedUrl.hostname,
    sourceUrl: parsedUrl.toString(),
    text
  });
}

async function handleExtractPdf(request, response, url) {
  const buffer = await readRawBody(request, maxPdfUploadBytes);
  if (!buffer.length) {
    sendJson(response, 400, { error: "PDF-Datei fehlt." });
    return;
  }

  const sourceName = clean(url.searchParams.get("sourceName")) || "PDF Factsheet";
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const text = clean(result.text).slice(0, maxFactsheetChars);
    if (text.length < 120) {
      sendJson(response, 422, { error: "Aus dem PDF konnte zu wenig Text extrahiert werden. OCR ist noch nicht integriert." });
      return;
    }

    sendJson(response, 200, {
      sourceName,
      text,
      pages: result.total
    });
  } finally {
    await parser.destroy();
  }
}

async function serveStatic(pathname, headOnly, response) {
  const decodedPath = decodeURIComponent(pathname);
  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.replace(/^\/+/, "");
  let filePath = resolve(rootDir, normalize(relativePath));

  if (!filePath.startsWith(rootDir)) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }

  const fileStat = await stat(filePath).catch(() => null);
  if (fileStat?.isDirectory()) filePath = join(filePath, "index.html");

  const finalStat = await stat(filePath).catch(() => null);
  if (!finalStat?.isFile()) {
    sendJson(response, 404, { error: "Not found" });
    return;
  }

  response.writeHead(200, {
    "Content-Length": finalStat.size,
    "Content-Type": mimeTypes[extname(filePath).toLowerCase()] || "application/octet-stream"
  });

  if (headOnly) {
    response.end();
    return;
  }

  createReadStream(filePath).pipe(response);
}

function extractReadableText(raw) {
  return raw
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|li|tr|h1|h2|h3|h4|table)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function isBlockedUrlHost(hostname) {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host.endsWith(".local") ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  );
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error("Request body too large");
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function readRawBody(request, maxBytes) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw new Error("Upload ist zu groß.");
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

function parseOpenAiJson(payload) {
  if (typeof payload.output_text === "string") return JSON.parse(payload.output_text);

  const text = payload.output
    ?.flatMap(item => item.content || [])
    ?.find(part => part.type === "output_text" && typeof part.text === "string")
    ?.text;

  if (!text) throw new Error("OpenAI response did not contain JSON text.");
  return JSON.parse(text);
}

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  response.end(body);
}

function clean(value) {
  return String(value || "").trim();
}

async function loadDotEnv(filePath) {
  const content = await readFile(filePath, "utf8").catch(error => {
    if (error.code === "ENOENT") return "";
    throw error;
  });

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = parseEnvValue(rawValue);
  }
}

function parseEnvValue(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function getProposalSchema() {
  const filmFields = [
    "id",
    "brand",
    "name",
    "film_type",
    "process",
    "iso_box",
    "formats",
    "use_cases",
    "grain",
    "saturation",
    "tone",
    "contrast",
    "look_description",
    "price_level",
    "exposure_latitude",
    "exposure_note",
    "short_description",
    "tip_exposure",
    "tip_development",
    "tip_scan",
    "review_needed",
    "notes"
  ];

  const sourceState = { enum: ["factsheet", "inferred", "interpreted", "missing"] };

  return {
    type: "object",
    additionalProperties: false,
    required: ["film", "field_sources", "review_notes", "warnings", "confidence"],
    properties: {
      film: {
        type: "object",
        additionalProperties: false,
        required: filmFields,
        properties: {
          id: { type: "string" },
          brand: { type: "string" },
          name: { type: "string" },
          film_type: { enum: ["Color Negative", "B&W", "Slide"] },
          process: { enum: ["C-41", "B&W", "E-6", "ECN-2"] },
          iso_box: { type: "integer" },
          formats: { type: "array", items: { enum: ["135", "120", "Sheet", "4x5", "8x10", "Instax"] } },
          use_cases: { type: "array", items: { enum: ["Portrait", "Street", "Travel", "Landscape", "Studio", "Sunny", "Low Light", "Night", "Reportage", "Wedding", "Snapshot", "Action", "Experimental", "Neon"] } },
          grain: { enum: ["", "Fein", "Sichtbar", "Grob"] },
          saturation: { enum: ["", "Natürlich", "Hoch", "Mittel", "Monochrom"] },
          tone: { enum: ["", "Warm", "Neutral", "Kühl", "Variabel"] },
          contrast: { enum: ["", "Weich", "Mittel", "Hoch"] },
          look_description: { type: "string" },
          price_level: { enum: ["", "Budget", "Mittel", "Premium"] },
          exposure_latitude: { enum: ["", "Gering", "Mittel", "Hoch", "Sehr hoch"] },
          exposure_note: { type: "string" },
          short_description: { type: "string" },
          tip_exposure: { type: "string" },
          tip_development: { type: "string" },
          tip_scan: { type: "string" },
          review_needed: { type: "boolean" },
          notes: { type: "string" }
        }
      },
      field_sources: {
        type: "object",
        additionalProperties: false,
        required: filmFields,
        properties: Object.fromEntries(filmFields.map(field => [field, sourceState]))
      },
      review_notes: {
        type: "array",
        items: { type: "string" }
      },
      warnings: {
        type: "array",
        items: { type: "string" }
      },
      confidence: {
        type: "integer",
        minimum: 0,
        maximum: 100
      }
    }
  };
}
