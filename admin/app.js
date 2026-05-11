import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const CONFIG_KEY = "filmguide_admin_supabase_config";
const BUCKET = "film-packshots";
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/13lPATFa6AumQkerDv_6CXJ68tp7QXoMfeP5GUFsekY0/export?format=csv&gid=158929564";
const MAX_IMAGE_UPLOAD_BYTES = 20 * 1024 * 1024;
const FORMAT_OPTIONS = ["135", "120", "Sheet", "4x5", "8x10", "Instax"];
const USE_CASE_OPTIONS = [
  "Portrait",
  "Street",
  "Travel",
  "Landscape",
  "Studio",
  "Sunny",
  "Low Light",
  "Night",
  "Reportage",
  "Wedding",
  "Snapshot",
  "Action",
  "Experimental",
  "Neon"
];

const state = {
  client: null,
  session: null,
  films: [],
  selectedId: "",
  pendingImageFile: null,
  filters: {
    type: { key: "all", value: "all" },
    look: { key: "all", value: "all" }
  }
};

const els = {
  connectionState: document.querySelector("#connectionState"),
  toggleSetupBtn: document.querySelector("#toggleSetupBtn"),
  accountMenu: document.querySelector("#accountMenu"),
  setupForm: document.querySelector("#setupForm"),
  supabaseUrl: document.querySelector("#supabaseUrl"),
  supabaseAnonKey: document.querySelector("#supabaseAnonKey"),
  authForm: document.querySelector("#authForm"),
  authEmail: document.querySelector("#authEmail"),
  authPassword: document.querySelector("#authPassword"),
  signUpBtn: document.querySelector("#signUpBtn"),
  signOutBtn: document.querySelector("#signOutBtn"),
  editConnectionBtn: document.querySelector("#editConnectionBtn"),
  accountSummary: document.querySelector("#accountSummary"),
  signedInActions: document.querySelector("#signedInActions"),
  newFilmBtn: document.querySelector("#newFilmBtn"),
  recordActions: document.querySelector("#recordActions"),
  duplicateBtn: document.querySelector("#duplicateBtn"),
  deleteBtn: document.querySelector("#deleteBtn"),
  importSheetBtn: document.querySelector("#importSheetBtn"),
  importDialog: document.querySelector("#importDialog"),
  cancelImportBtn: document.querySelector("#cancelImportBtn"),
  confirmImportBtn: document.querySelector("#confirmImportBtn"),
  searchInput: document.querySelector("#searchInput"),
  filterChips: document.querySelectorAll(".filter-chip"),
  filmList: document.querySelector("#filmList"),
  filmCount: document.querySelector("#filmCount"),
  editorTitle: document.querySelector("#editorTitle"),
  filmForm: document.querySelector("#filmForm"),
  formStatus: document.querySelector("#formStatus"),
  imageFile: document.querySelector("#imageFile"),
  imagePreview: document.querySelector("#imagePreview"),
  imagePlaceholder: document.querySelector("#imagePlaceholder"),
  formatsChoices: document.querySelector("#formatsChoices"),
  useCasesChoices: document.querySelector("#useCasesChoices")
};

function init() {
  renderChoiceGroup(els.formatsChoices, "formats", FORMAT_OPTIONS);
  renderChoiceGroup(els.useCasesChoices, "use_cases", USE_CASE_OPTIONS);
  els.importSheetBtn.disabled = true;

  const config = loadConfig();
  if (config.url && config.anonKey) {
    els.supabaseUrl.value = config.url;
    els.supabaseAnonKey.value = config.anonKey;
    connect(config);
  } else {
    els.setupForm.classList.remove("hidden");
    els.accountMenu.classList.remove("hidden");
    els.authForm.classList.add("hidden");
    setConnection("Setup fehlt", false);
  }

  bindEvents();
  resetForm();
}

function bindEvents() {
  els.toggleSetupBtn.addEventListener("click", () => {
    els.accountMenu.classList.toggle("hidden");
  });

  els.editConnectionBtn.addEventListener("click", () => {
    els.setupForm.classList.toggle("hidden");
  });

  document.addEventListener("click", event => {
    const isMenuClick = event.target.closest(".account-menu-wrap");
    if (!isMenuClick) els.accountMenu.classList.add("hidden");
  });

  els.setupForm.addEventListener("submit", event => {
    event.preventDefault();
    const config = {
      url: els.supabaseUrl.value.trim(),
      anonKey: els.supabaseAnonKey.value.trim()
    };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    connect(config);
  });

  els.authForm.addEventListener("submit", event => {
    event.preventDefault();
    signIn();
  });

  els.signUpBtn.addEventListener("click", signUp);
  els.signOutBtn.addEventListener("click", signOut);
  els.newFilmBtn.addEventListener("click", resetForm);
  els.duplicateBtn.addEventListener("click", duplicateSelectedFilm);
  els.deleteBtn.addEventListener("click", archiveSelectedFilm);
  els.importSheetBtn.addEventListener("click", openImportDialog);
  els.cancelImportBtn.addEventListener("click", closeImportDialog);
  els.confirmImportBtn.addEventListener("click", importSheetFilms);
  els.importDialog.addEventListener("click", event => {
    if (event.target === els.importDialog) closeImportDialog();
  });
  els.searchInput.addEventListener("input", renderFilmList);
  els.filterChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const group = chip.dataset.filterGroup;
      state.filters[group] = {
        key: chip.dataset.filterKey,
        value: chip.dataset.filterValue
      };
      els.filterChips.forEach(item => {
        if (item.dataset.filterGroup === group) {
          item.classList.toggle("active", item === chip);
        }
      });
      renderFilmList();
    });
  });
  els.filmForm.addEventListener("submit", saveFilm);
  els.imageFile.addEventListener("change", event => {
    const [file] = event.target.files;
    state.pendingImageFile = file || null;
    if (file) {
      if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
        state.pendingImageFile = null;
        els.imageFile.value = "";
        setStatus("Bild ist zu groß. Bitte maximal 20 MB hochladen.", true);
        return;
      }
      els.imagePreview.src = URL.createObjectURL(file);
      els.imagePreview.parentElement.classList.add("has-image");
    }
  });

  els.filmForm.elements.brand.addEventListener("input", maybeSuggestId);
  els.filmForm.elements.name.addEventListener("input", maybeSuggestId);
  els.filmForm.elements.iso_box.addEventListener("input", maybeSuggestId);
  els.filmForm.elements.film_type.addEventListener("change", maybeSuggestProcess);
}

function loadConfig() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}");
  } catch {
    return {};
  }
}

async function connect(config) {
  state.client = createClient(config.url, config.anonKey);
  setConnection("Verbinde...", false);

  const { data } = await state.client.auth.getSession();
  state.session = data.session;
  updateAuthUi();

  state.client.auth.onAuthStateChange((_event, session) => {
    state.session = session;
    updateAuthUi();
    loadFilms();
  });

  await loadFilms();
}

function setConnection(label, ok) {
  els.connectionState.textContent = label;
  els.connectionState.classList.toggle("ok", ok);
}

function updateAuthUi() {
  const email = state.session?.user?.email;
  if (email) {
    setConnection(email, true);
    els.accountSummary.textContent = `Angemeldet als ${email}`;
    els.authForm.classList.add("hidden");
    els.signedInActions.classList.remove("hidden");
    els.setupForm.classList.add("hidden");
    els.importSheetBtn.disabled = false;
  } else if (state.client) {
    setConnection("Nicht angemeldet", false);
    els.accountSummary.textContent = "Nicht angemeldet";
    els.authForm.classList.remove("hidden");
    els.signedInActions.classList.add("hidden");
    els.importSheetBtn.disabled = true;
  }
}

async function signIn() {
  if (!requireClient()) return;
  setStatus("Melde an...");
  const { error } = await state.client.auth.signInWithPassword({
    email: els.authEmail.value.trim(),
    password: els.authPassword.value
  });
  if (error) return setStatus(`Login fehlgeschlagen: ${error.message}`, true);
  setStatus("Eingeloggt");
}

async function signUp() {
  if (!requireClient()) return;
  setStatus("Lege Account an...");
  const { error } = await state.client.auth.signUp({
    email: els.authEmail.value.trim(),
    password: els.authPassword.value
  });
  if (error) return setStatus(`Account konnte nicht angelegt werden: ${error.message}`, true);
  setStatus("Account angelegt. Bestätige bei Bedarf die E-Mail.");
}

async function signOut() {
  if (!requireClient()) return;
  await state.client.auth.signOut();
  els.accountMenu.classList.remove("hidden");
  setStatus("Ausgeloggt");
}

async function loadFilms() {
  if (!requireClient(false)) return;

  const { data, error } = await state.client
    .from("films")
    .select("*")
    .order("brand", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    setConnection("Fehler", false);
    setStatus(`Filme konnten nicht geladen werden: ${error.message}`, true);
    return;
  }

  state.films = data || [];
  renderFilmList();
  setConnection(state.session?.user?.email || "Nicht angemeldet", Boolean(state.session));
}

function renderFilmList() {
  const query = els.searchInput.value.trim().toLowerCase();
  const films = state.films.filter(film => {
    const haystack = [
      film.brand,
      film.name,
      film.iso_box,
      film.film_type,
      film.process,
      film.id,
      film.grain,
      film.saturation,
      film.tone,
      film.contrast,
      film.price_level,
      film.exposure_latitude,
      film.short_description,
      film.look_description,
      ...(film.formats || []),
      ...(film.use_cases || []),
      ...getSearchSynonyms(film)
    ]
      .join(" ")
      .toLowerCase();
    const matchesQuery = haystack.includes(query);
    return matchesQuery && matchesFilmFilters(film);
  });

  els.filmCount.textContent = String(films.length);
  els.filmList.innerHTML = "";

  if (films.length === 0) {
    els.filmList.innerHTML = `<p class="muted">Keine Filme gefunden.</p>`;
    return;
  }

  for (const film of films) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `film-item${film.id === state.selectedId ? " active" : ""}`;
    button.innerHTML = `
      <strong>${escapeHtml(film.brand)} ${escapeHtml(film.name)}</strong>
      <span>ISO ${escapeHtml(String(film.iso_box || ""))} · ${escapeHtml(film.process || "")} · ${film.active ? "aktiv" : "archiviert"}</span>
    `;
    button.addEventListener("click", () => selectFilm(film.id));
    els.filmList.append(button);
  }
}

function matchesFilmFilters(film) {
  return Object.values(state.filters).every(filter => {
    if (!filter || filter.key === "all") return true;
    return String(film[filter.key] || "") === filter.value;
  });
}

function getSearchSynonyms(film) {
  const values = [];
  if (film.film_type === "B&W") values.push("schwarzweiss", "schwarzweiß", "sw", "bw", "black white");
  if (film.film_type === "Color Negative") values.push("farbnegativ", "farbe", "color", "c41", "c-41");
  if (film.film_type === "Slide") values.push("dia", "diafilm", "slide", "e6", "e-6");
  if (film.grain === "Fein") values.push("feines korn", "feinkorn");
  if (film.grain === "Sichtbar" || film.grain === "Grob") values.push("korn", "grain", "sichtbares korn");
  if (film.price_level === "Budget") values.push("günstig", "guenstig", "billig");
  if (film.price_level === "Premium") values.push("profi", "teuer", "professional");
  return values;
}

function selectFilm(id) {
  const film = state.films.find(item => item.id === id);
  if (!film) return;
  state.selectedId = id;
  state.pendingImageFile = null;
  fillForm(film);
  updateRecordActions();
  renderFilmList();
}

function resetForm() {
  state.selectedId = "";
  state.pendingImageFile = null;
  els.filmForm.reset();
  els.filmForm.elements.active.checked = true;
  els.filmForm.elements.film_type.value = "Color Negative";
  els.filmForm.elements.process.value = "C-41";
  els.filmForm.elements.review_needed.value = "false";
  setChoiceValues("formats", []);
  setChoiceValues("use_cases", []);
  els.editorTitle.textContent = "Film anlegen";
  updateRecordActions();
  setImagePreview("");
  setStatus("Bereit");
  renderFilmList();
}

function fillForm(film) {
  els.editorTitle.textContent = `${film.brand} ${film.name}`;
  const elements = els.filmForm.elements;
  for (const [key, value] of Object.entries(film)) {
    if (key === "formats" || key === "use_cases") {
      setChoiceValues(key, value || []);
    } else if (!elements[key]) {
      continue;
    } else if (key === "active") {
      elements[key].checked = Boolean(value);
    } else if (key === "review_needed") {
      elements[key].value = String(Boolean(value));
    } else {
      elements[key].value = value ?? "";
    }
  }
  setImagePreview(film.image_url);
  updateRecordActions();
  setStatus("Bereit");
}

function updateRecordActions() {
  els.recordActions.classList.toggle("hidden", !state.selectedId);
}

function maybeSuggestId() {
  if (state.selectedId) return;
  const brand = els.filmForm.elements.brand.value;
  const name = els.filmForm.elements.name.value;
  const iso = els.filmForm.elements.iso_box.value;
  els.filmForm.elements.id.value = slugify([brand, name, iso].filter(Boolean).join(" "));
}

function maybeSuggestProcess() {
  const type = els.filmForm.elements.film_type.value;
  if (type === "B&W") els.filmForm.elements.process.value = "B&W";
  if (type === "Slide") els.filmForm.elements.process.value = "E-6";
  if (type === "Color Negative") els.filmForm.elements.process.value = "C-41";
}

async function saveFilm(event) {
  event.preventDefault();
  if (!requireClient() || !requireSession()) return;

  const film = readForm();
  if (!film.id) {
    film.id = slugify([film.brand, film.name, film.iso_box].filter(Boolean).join(" "));
    els.filmForm.elements.id.value = film.id;
  }
  if (!film.id || !film.brand || !film.name) {
    setStatus("Marke und Name sind Pflichtfelder.", true);
    return;
  }

  setStatus("Speichere...");

  if (state.pendingImageFile) {
    const upload = await uploadImage(film);
    if (!upload) return;
    film.image_url = upload.publicUrl;
    film.image_path = upload.path;
    els.filmForm.elements.image_url.value = upload.publicUrl;
    els.filmForm.elements.image_path.value = upload.path;
  }

  const { data, error } = await state.client
    .from("films")
    .upsert(film, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    setStatus(`Film konnte nicht gespeichert werden: ${error.message}`, true);
    return;
  }

  state.selectedId = data.id;
  state.pendingImageFile = null;
  await loadFilms();
  selectFilm(data.id);
  setStatus("Gespeichert");
}

function readForm() {
  const form = new FormData(els.filmForm);
  return {
    id: slugify(form.get("id")),
    brand: clean(form.get("brand")),
    name: clean(form.get("name")),
    film_type: clean(form.get("film_type")),
    process: clean(form.get("process")),
    iso_box: Number(form.get("iso_box") || 0),
    formats: getChoiceValues("formats"),
    use_cases: getChoiceValues("use_cases"),
    grain: clean(form.get("grain")),
    saturation: clean(form.get("saturation")),
    tone: clean(form.get("tone")),
    contrast: clean(form.get("contrast")),
    look_description: clean(form.get("look_description")),
    price_level: clean(form.get("price_level")),
    exposure_latitude: clean(form.get("exposure_latitude")),
    exposure_note: clean(form.get("exposure_note")),
    short_description: clean(form.get("short_description")),
    tip_exposure: clean(form.get("tip_exposure")),
    tip_development: clean(form.get("tip_development")),
    tip_scan: clean(form.get("tip_scan")),
    image_url: clean(form.get("image_url")),
    image_path: clean(form.get("image_path")),
    review_needed: form.get("review_needed") === "true",
    notes: clean(form.get("notes")),
    active: els.filmForm.elements.active.checked
  };
}

async function uploadImage(film) {
  const file = state.pendingImageFile;
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    setStatus("Bild ist zu groß. Bitte maximal 20 MB hochladen.", true);
    return null;
  }
  if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
    setStatus("Bildformat nicht unterstützt. Erlaubt sind JPG, PNG, WebP und AVIF.", true);
    return null;
  }
  const ext = file.name.split(".").pop().toLowerCase();
  const path = `${film.id}/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ""))}.${ext}`;

  const { error } = await state.client.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "31536000",
      upsert: true
    });

  if (error) {
    setStatus(`Bild konnte nicht hochgeladen werden: ${getUploadErrorMessage(error)}`, true);
    return null;
  }

  const { data } = state.client.storage.from(BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

function getUploadErrorMessage(error) {
  const message = error && error.message ? error.message : String(error || "");
  if (/payload|size|too large|exceeded/i.test(message)) {
    return "Die Datei ist vermutlich zu groß. Bitte Supabase-Bucket auf 20 MB aktualisieren oder ein kleineres Bild wählen.";
  }
  if (/mime|type|not allowed/i.test(message)) {
    return "Das Dateiformat wurde vom Bucket abgelehnt. Erlaubt sind JPG, PNG, WebP und AVIF.";
  }
  return message;
}

function duplicateSelectedFilm() {
  const film = state.films.find(item => item.id === state.selectedId);
  if (!film) return setStatus("Wähle zuerst einen Film aus.", true);
  const copy = {
    ...film,
    id: `${film.id}_copy`,
    name: `${film.name} Kopie`,
    image_path: "",
    image_url: ""
  };
  state.selectedId = "";
  fillForm(copy);
  els.editorTitle.textContent = "Kopie bearbeiten";
  setImagePreview("");
}

async function archiveSelectedFilm() {
  if (!requireClient() || !requireSession()) return;
  const film = state.films.find(item => item.id === state.selectedId);
  if (!film) return setStatus("Wähle zuerst einen Film aus.", true);
  const confirmed = window.confirm(`${film.brand} ${film.name} archivieren?`);
  if (!confirmed) return;

  const { error } = await state.client
    .from("films")
    .update({ active: false })
    .eq("id", film.id);

  if (error) return setStatus(`Film konnte nicht archiviert werden: ${error.message}`, true);
  await loadFilms();
  selectFilm(film.id);
  setStatus("Archiviert");
}

async function importSheetFilms() {
  if (!requireClient() || !requireSession()) return;

  closeImportDialog();
  setStatus("Importiere Sheet...");

  try {
    const response = await fetch(`${SHEET_CSV_URL}&ts=${Date.now()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const csv = await response.text();
    const rows = parseCsv(csv);
    const films = rows.map(mapSheetRowToFilm).filter(film => film.id && film.brand && film.name);
    if (films.length === 0) throw new Error("Keine gültigen Filme gefunden.");

    const { error } = await state.client
      .from("films")
      .upsert(films, { onConflict: "id" });

    if (error) throw error;
    await loadFilms();
    setStatus(`${films.length} Filme importiert`);
  } catch (error) {
    setStatus(`Import fehlgeschlagen: ${error.message}`, true);
  }
}

function openImportDialog() {
  if (!requireClient() || !requireSession()) return;
  els.importDialog.classList.remove("hidden");
}

function closeImportDialog() {
  els.importDialog.classList.add("hidden");
}

function mapSheetRowToFilm(row) {
  const filmType = first(row, ["Filmtyp", "Typ"]) || "Color Negative";
  const process = first(row, ["Prozess"]) || (filmType === "B&W" ? "B&W" : filmType === "Slide" ? "E-6" : "C-41");
  const imageValue = first(row, ["Bilder", "Dateiname"]);

  return {
    id: slugify(first(row, ["ID"]) || [first(row, ["Marke"]), first(row, ["Name"]), first(row, ["ISO Box", "ISO"])].filter(Boolean).join(" ")),
    brand: first(row, ["Marke"]),
    name: first(row, ["Name"]),
    film_type: filmType,
    process,
    iso_box: Number(first(row, ["ISO Box", "ISO"]) || 0),
    formats: splitList(first(row, ["Formate aktuell", "Formate"])),
    use_cases: splitList(first(row, ["Einsatz", "Alt Einsatzgebiete"])),
    grain: first(row, ["Korn", "Grain"]),
    saturation: first(row, ["Sättigung"]),
    tone: first(row, ["Farbton"]),
    contrast: first(row, ["Kontrast"]),
    look_description: first(row, ["Look Beschreibung"]),
    price_level: first(row, ["Preisniveau", "Budget"]),
    exposure_latitude: first(row, ["Belichtungsspielraum", "Handling"]),
    exposure_note: first(row, ["Belichtungsspielraum Hinweis"]),
    short_description: first(row, ["Kurzbeschreibung"]),
    tip_exposure: first(row, ["Tipp Belichtung", "Tipp: Belichtung"]),
    tip_development: first(row, ["Tipp Entwicklung", "Tipp: Dev"]),
    tip_scan: first(row, ["Tipp Scan", "Tipp: Scan"]),
    image_url: getLegacyImageUrl(imageValue),
    image_path: "",
    review_needed: ["ja", "true", "1", "yes"].includes(first(row, ["Review nötig"]).toLowerCase()),
    notes: first(row, ["Notiz Migration"]),
    active: true
  };
}

function getLegacyImageUrl(imageValue) {
  const imageName = clean(imageValue);
  if (!imageName) return "";
  if (/^https?:\/\//i.test(imageName)) return imageName;
  if (imageName.startsWith("img/")) return `../${imageName}`;
  const vintageImageName = imageName.replace(/\.[^.]+$/, "").toLowerCase() + ".webp";
  return `../img/packshots-vintage/${vintageImageName}`;
}

function first(row, names) {
  for (const name of names) {
    const value = row[name];
    if (value !== undefined && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}

function parseCsv(text) {
  const rows = parseCsvRows(text);
  if (rows.length < 2) return [];
  const headers = rows[0].map(header => header.trim());
  return rows.slice(1).map(row => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = row[index] || "";
    });
    return item;
  });
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuote = false;
  const firstLine = text.split("\n")[0] || "";
  const separator = firstLine.includes(";") ? ";" : ",";

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === "\"") {
      if (inQuote && next === "\"") {
        cell += "\"";
        i += 1;
      } else {
        inQuote = !inQuote;
      }
    } else if (char === separator && !inQuote) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuote) {
      if (cell || row.length > 0) row.push(cell);
      if (row.length > 0) rows.push(row);
      row = [];
      cell = "";
      if (char === "\r" && next === "\n") i += 1;
    } else {
      cell += char;
    }
  }

  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function setImagePreview(url) {
  const hasUrl = Boolean(url);
  els.imagePreview.src = hasUrl ? url : "";
  els.imagePreview.parentElement.classList.toggle("has-image", hasUrl);
  els.imagePlaceholder.textContent = hasUrl ? "" : "Kein Bild";
}

function renderChoiceGroup(container, name, options) {
  container.innerHTML = "";
  for (const option of options) {
    const id = `${name}_${slugify(option)}`;
    const label = document.createElement("label");
    label.className = "choice-chip";
    label.htmlFor = id;
    label.innerHTML = `
      <input id="${id}" name="${name}" type="checkbox" value="${escapeHtml(option)}">
      <span>${escapeHtml(option)}</span>
    `;
    container.append(label);
  }
}

function getChoiceValues(name) {
  return [...els.filmForm.querySelectorAll(`input[name="${name}"]:checked`)].map(input => input.value);
}

function setChoiceValues(name, values) {
  const selected = new Set((values || []).map(value => String(value).trim()).filter(Boolean));
  els.filmForm.querySelectorAll(`input[name="${name}"]`).forEach(input => {
    input.checked = selected.has(input.value);
  });
}

function splitList(value) {
  return String(value || "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function clean(value) {
  return String(value || "").trim();
}

function setStatus(message, isError = false) {
  els.formStatus.textContent = message;
  els.formStatus.style.color = isError ? "var(--danger)" : "var(--muted)";
}

function requireClient(showMessage = true) {
  if (state.client) return true;
  if (showMessage) setStatus("Supabase-Verbindung fehlt.", true);
  return false;
}

function requireSession() {
  if (state.session) return true;
  setStatus("Bitte zuerst einloggen.", true);
  return false;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

init();
