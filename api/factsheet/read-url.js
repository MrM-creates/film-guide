const maxFactsheetChars = 36000;

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  try {
    const body = await readJsonBody(request);
    const sourceUrl = clean(body.url);
    if (!sourceUrl) return sendJson(response, 400, { error: "URL fehlt." });

    let parsedUrl;
    try {
      parsedUrl = new URL(sourceUrl);
    } catch {
      return sendJson(response, 400, { error: "URL ist ungültig." });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return sendJson(response, 400, { error: "Nur HTTP- und HTTPS-URLs sind erlaubt." });
    }

    if (isBlockedUrlHost(parsedUrl.hostname)) {
      return sendJson(response, 400, { error: "Lokale oder private Netzwerkadressen sind fuer URL-Import nicht erlaubt." });
    }

    const fetched = await fetch(parsedUrl, {
      headers: {
        "User-Agent": "FilmGuideAdmin/1.0"
      }
    });

    if (!fetched.ok) {
      return sendJson(response, fetched.status, { error: `URL konnte nicht gelesen werden: HTTP ${fetched.status}` });
    }

    const contentType = fetched.headers.get("content-type") || "";
    if (!/text\/html|text\/plain|application\/xhtml\+xml/i.test(contentType)) {
      return sendJson(response, 415, { error: `URL liefert keinen lesbaren Text (${contentType || "unbekannt"}).` });
    }

    const raw = await fetched.text();
    const text = extractReadableText(raw).slice(0, maxFactsheetChars);

    if (text.length < 120) {
      return sendJson(response, 422, { error: "Aus der URL konnte zu wenig Text extrahiert werden." });
    }

    return sendJson(response, 200, {
      sourceName: parsedUrl.hostname,
      sourceUrl: parsedUrl.toString(),
      text
    });
  } catch (error) {
    return sendJson(response, 500, { error: error.message || "Server error" });
  }
};

async function readJsonBody(request) {
  if (request.body && typeof request.body === "object" && !Buffer.isBuffer(request.body)) return request.body;
  const chunks = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
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

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function clean(value) {
  return String(value || "").trim();
}
