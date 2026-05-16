import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
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

const { data: films, error } = await client
  .from("filmguide_films")
  .select("id, brand, name, iso_box, image_url, image_path")
  .order("brand");

if (error) throw error;

let imported = 0;
let skipped = 0;

for (const film of films || []) {
  if (film.image_path && isSupabaseUrl(film.image_url)) {
    skipped += 1;
    console.log(`Skipping ${labelFilm(film)} (already in Supabase)`);
    continue;
  }

  const localPath = resolveLocalImagePath(film.image_url);
  if (!localPath) {
    skipped += 1;
    console.log(`Skipping ${labelFilm(film)} (no local image URL)`);
    continue;
  }

  const bytes = await readFile(localPath).catch(error => {
    if (error.code === "ENOENT") return null;
    throw error;
  });

  if (!bytes) {
    skipped += 1;
    console.log(`Skipping ${labelFilm(film)} (file not found: ${localPath})`);
    continue;
  }

  const ext = extname(localPath).toLowerCase();
  const contentType = getImageContentType(ext);
  if (!contentType) {
    skipped += 1;
    console.log(`Skipping ${labelFilm(film)} (unsupported image type: ${ext})`);
    continue;
  }

  const storagePath = `${film.id}/${slugify([film.brand, film.name, film.iso_box].filter(Boolean).join(" "))}${ext}`;
  const { error: uploadError } = await client.storage
    .from("filmguide-packshots")
    .upload(storagePath, new Blob([bytes], { type: contentType }), {
      upsert: true,
      contentType,
      cacheControl: "31536000"
    });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = client.storage
    .from("filmguide-packshots")
    .getPublicUrl(storagePath);

  const { error: updateError } = await client
    .from("filmguide_films")
    .update({
      image_url: publicUrlData.publicUrl,
      image_path: storagePath
    })
    .eq("id", film.id);

  if (updateError) throw updateError;

  imported += 1;
  console.log(`Imported ${labelFilm(film)} -> ${storagePath}`);
}

console.log(`Done. Imported ${imported}, skipped ${skipped}.`);

function resolveLocalImagePath(imageUrl) {
  if (!imageUrl || isSupabaseUrl(imageUrl) || /^https?:\/\//i.test(imageUrl)) return "";
  const normalized = imageUrl.replace(/^\.?\//, "");
  if (imageUrl.startsWith("../")) return resolve(rootDir, "admin", imageUrl);
  return resolve(rootDir, normalized);
}

function isSupabaseUrl(value) {
  return String(value || "").includes("/storage/v1/object/public/filmguide-packshots/");
}

function getImageContentType(ext) {
  return {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".avif": "image/avif"
  }[ext] || "";
}

function labelFilm(film) {
  return [film.brand, film.name].filter(Boolean).join(" ");
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
