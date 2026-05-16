import { createClient } from "@supabase/supabase-js";
import { readFile, readdir } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(fileURLToPath(new URL("..", import.meta.url)));
await loadDotEnv(resolve(rootDir, ".env"));

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY muessen in .env gesetzt sein.");
  process.exit(1);
}

const client = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

const sources = JSON.parse(await readFile(resolve(rootDir, "admin/factsheet-sources.json"), "utf8"));
const factsheetFiles = await readdir(resolve(rootDir, "Factsheets Films"));

for (const source of sources) {
  const sourcePath = resolve(rootDir, "admin", source.path);
  const extractedText = await readFile(sourcePath, "utf8");
  const sourceName = source.label || source.path;
  console.log(`Importing ${sourceName}...`);
  const originalFileName = findOriginalFactsheetFile(sourceName);
  const originalPath = originalFileName ? resolve(rootDir, "Factsheets Films", originalFileName) : sourcePath;
  const originalBytes = await readFile(originalPath);
  const originalExt = extname(originalPath) || ".txt";
  const contentType = originalExt.toLowerCase() === ".pdf" ? "application/pdf" : "text/plain";
  const storagePath = `repo/${slugify(sourceName)}${originalExt}`;

  const { error: uploadError } = await client.storage
    .from("filmguide-factsheets")
    .upload(storagePath, new Blob([originalBytes], { type: contentType }), {
      upsert: true,
      contentType
    });

  if (uploadError) throw uploadError;

  const { data: existing, error: selectError } = await client
    .from("filmguide_factsheet_sources")
    .select("id")
    .eq("source_type", "repo")
    .eq("source_url", source.path)
    .maybeSingle();

  if (selectError) throw selectError;

  const row = {
    source_type: "repo",
    source_name: sourceName,
    source_url: source.path,
    storage_path: storagePath,
    extracted_text: extractedText,
    extraction_status: "ready"
  };

  const result = existing?.id
    ? await client.from("filmguide_factsheet_sources").update(row).eq("id", existing.id)
    : await client.from("filmguide_factsheet_sources").insert(row);

  if (result.error) throw result.error;
  console.log(`Imported ${sourceName}`);
}

function findOriginalFactsheetFile(sourceName) {
  const knownFiles = {
    "fujifilm-provia-100f": "Fujichrome_provia_100.pdf",
    "fujifilm-velvia-50": "Fujichrome_VELVIA_50 .pdf",
    "ilford-fp4-plus-125": "Ilford_FP4plus_125.pdf",
    "ilford-hp5-plus-400": "Ilford_hp5_400.pdf",
    "kodak-tri-x-400": "Kodak_TriX_400.pdf"
  };
  const sourceSlug = slugify(sourceName);
  if (knownFiles[sourceSlug]) return knownFiles[sourceSlug];

  return factsheetFiles.find(file => {
    if (!file.toLowerCase().endsWith(".pdf")) return false;
    return slugify(file.replace(/\.[^.]+$/, "")) === sourceSlug;
  }) || factsheetFiles.find(file => {
    if (!file.toLowerCase().endsWith(".pdf")) return false;
    const fileSlug = slugify(file.replace(/\.[^.]+$/, ""));
    return sourceSlug.includes(fileSlug) || fileSlug.includes(sourceSlug);
  }) || "";
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

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
