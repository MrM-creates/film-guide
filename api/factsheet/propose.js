const openAiBaseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const openAiModel = process.env.OPENAI_MODEL || "gpt-5-mini";
const maxFactsheetChars = 36000;

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return sendJson(response, 503, {
      error: "OPENAI_API_KEY fehlt. Lokale Regel-Auswertung wird verwendet."
    });
  }

  try {
    const body = await readJsonBody(request);
    const sourceName = clean(body.sourceName) || "Factsheet";
    const factsheetText = clean(body.text).slice(0, maxFactsheetChars);
    const localProposal = body.localProposal && typeof body.localProposal === "object" ? body.localProposal : null;

    if (factsheetText.length < 120) {
      return sendJson(response, 400, { error: "Factsheet-Text ist zu kurz." });
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
          format: getProposalSchema()
        }
      })
    });

    const payload = await apiResponse.json();
    if (!apiResponse.ok) {
      return sendJson(response, apiResponse.status, {
        error: payload.error?.message || `OpenAI request failed: ${apiResponse.status}`
      });
    }

    return sendJson(response, 200, {
      provider: "openai",
      model: openAiModel,
      sourceName,
      proposal: parseOpenAiJson(payload)
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

function parseOpenAiJson(payload) {
  if (typeof payload.output_text === "string") return JSON.parse(payload.output_text);

  const text = payload.output
    ?.flatMap(item => item.content || [])
    ?.find(part => part.type === "output_text" && typeof part.text === "string")
    ?.text;

  if (!text) throw new Error("OpenAI response did not contain JSON text.");
  return JSON.parse(text);
}

function getProposalSchema() {
  return {
    type: "json_schema",
    name: "filmguide_factsheet_proposal",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        confidence: { type: "number" },
        warnings: { type: "array", items: { type: "string" } },
        review_notes: { type: "array", items: { type: "string" } },
        field_sources: { type: "object", additionalProperties: { type: "string" } },
        film: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            brand: { type: "string" },
            name: { type: "string" },
            film_type: { type: "string", enum: ["Color Negative", "B&W", "Slide"] },
            process: { type: "string", enum: ["C-41", "B&W", "E-6", "ECN-2"] },
            iso_box: { type: "number" },
            formats: { type: "array", items: { type: "string" } },
            use_cases: { type: "array", items: { type: "string" } },
            grain: { type: "string" },
            saturation: { type: "string" },
            tone: { type: "string" },
            contrast: { type: "string" },
            look_description: { type: "string" },
            price_level: { type: "string" },
            exposure_latitude: { type: "string" },
            exposure_note: { type: "string" },
            short_description: { type: "string" },
            tip_exposure: { type: "string" },
            tip_development: { type: "string" },
            tip_scan: { type: "string" },
            review_needed: { type: "boolean" },
            notes: { type: "string" }
          },
          required: [
            "id", "brand", "name", "film_type", "process", "iso_box", "formats", "use_cases",
            "grain", "saturation", "tone", "contrast", "look_description", "price_level",
            "exposure_latitude", "exposure_note", "short_description", "tip_exposure",
            "tip_development", "tip_scan", "review_needed", "notes"
          ]
        }
      },
      required: ["confidence", "warnings", "review_notes", "field_sources", "film"]
    }
  };
}

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function clean(value) {
  return String(value || "").trim();
}
