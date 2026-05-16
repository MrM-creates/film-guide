import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const CONFIG_KEY = "filmguide_admin_supabase_config";
const FILMS_TABLE = "filmguide_films";
const BUCKET = "filmguide-packshots";
const FACTSHEET_BUCKET = "filmguide-factsheets";
const FACTSHEET_SOURCES_TABLE = "filmguide_factsheet_sources";
const PROPOSALS_TABLE = "filmguide_film_proposals";
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
  savedFactsheets: [],
  factsheetFileText: "",
  factsheetFileName: "",
  factsheetInput: null,
  currentProposal: null,
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
  newFilmDialog: document.querySelector("#newFilmDialog"),
  closeNewFilmDialogBtn: document.querySelector("#closeNewFilmDialogBtn"),
  cancelNewFilmDialogBtn: document.querySelector("#cancelNewFilmDialogBtn"),
  recordActions: document.querySelector("#recordActions"),
  discardDraftBtn: document.querySelector("#discardDraftBtn"),
  duplicateBtn: document.querySelector("#duplicateBtn"),
  deleteBtn: document.querySelector("#deleteBtn"),
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
  useCasesChoices: document.querySelector("#useCasesChoices"),
  savedFactsheetSelect: document.querySelector("#savedFactsheetSelect"),
  savedFactsheetActions: document.querySelector("#savedFactsheetActions"),
  viewFactsheetBtn: document.querySelector("#viewFactsheetBtn"),
  downloadFactsheetBtn: document.querySelector("#downloadFactsheetBtn"),
  factsheetUrl: document.querySelector("#factsheetUrl"),
  factsheetFile: document.querySelector("#factsheetFile"),
  factsheetText: document.querySelector("#factsheetText"),
  analyzeFactsheetBtn: document.querySelector("#analyzeFactsheetBtn"),
  proposalPanel: document.querySelector("#proposalPanel")
};

function init() {
  renderChoiceGroup(els.formatsChoices, "formats", FORMAT_OPTIONS);
  renderChoiceGroup(els.useCasesChoices, "use_cases", USE_CASE_OPTIONS);

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
  els.newFilmBtn.addEventListener("click", openNewFilmDialog);
  els.closeNewFilmDialogBtn.addEventListener("click", closeNewFilmDialog);
  els.cancelNewFilmDialogBtn.addEventListener("click", closeNewFilmDialog);
  els.newFilmDialog.addEventListener("click", event => {
    if (event.target === els.newFilmDialog) closeNewFilmDialog();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !els.newFilmDialog.classList.contains("hidden")) {
      closeNewFilmDialog();
    }
  });
  els.discardDraftBtn.addEventListener("click", discardDraft);
  els.duplicateBtn.addEventListener("click", duplicateSelectedFilm);
  els.deleteBtn.addEventListener("click", deleteSelectedFilm);
  els.savedFactsheetSelect.addEventListener("change", selectSavedFactsheet);
  els.viewFactsheetBtn.addEventListener("click", viewSelectedFactsheet);
  els.downloadFactsheetBtn.addEventListener("click", downloadSelectedFactsheet);
  els.factsheetFile.addEventListener("change", readFactsheetFile);
  els.factsheetUrl.addEventListener("input", () => {
    if (els.factsheetUrl.value.trim()) {
      els.savedFactsheetSelect.value = "";
      els.factsheetText.value = "";
      state.factsheetFileText = "";
      state.factsheetFileName = "";
      state.factsheetInput = null;
      els.factsheetFile.value = "";
    }
  });
  els.factsheetText.addEventListener("input", () => {
    if (els.factsheetText.value.trim()) {
      els.savedFactsheetSelect.value = "";
      els.factsheetUrl.value = "";
      state.factsheetFileText = "";
      state.factsheetFileName = "";
      state.factsheetInput = { type: "text", sourceName: "Eingefügter Text", sourceUrl: "" };
      els.factsheetFile.value = "";
    }
  });
  els.analyzeFactsheetBtn.addEventListener("click", createAndApplyFactsheetProposal);
  els.searchInput.addEventListener("input", renderFilmList);
  document.addEventListener("click", event => {
    if (!event.target.closest(".film-menu-wrap")) {
      closeFilmMenus();
    }
  });
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

function openNewFilmDialog() {
  resetForm();
  resetFactsheetInputs();
  els.newFilmDialog.classList.remove("hidden");
  els.factsheetFile.focus();
}

function closeNewFilmDialog() {
  els.newFilmDialog.classList.add("hidden");
}

function resetFactsheetInputs() {
  els.savedFactsheetSelect.value = "";
  els.factsheetUrl.value = "";
  els.factsheetFile.value = "";
  els.factsheetText.value = "";
  state.factsheetFileText = "";
  state.factsheetFileName = "";
  state.factsheetInput = null;
  state.currentProposal = null;
  els.proposalPanel.classList.add("hidden");
  els.proposalPanel.innerHTML = "";
  updateSavedFactsheetActions();
}

async function loadSavedFactsheets() {
  if (!state.client || !state.session) {
    state.savedFactsheets = [];
    renderSavedFactsheets();
    return;
  }

  const { data, error } = await state.client
    .from(FACTSHEET_SOURCES_TABLE)
    .select("id, film_id, source_type, source_name, source_url, storage_path, extracted_text, extraction_status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.info("Vorhandene Factsheets konnten nicht geladen werden:", error.message);
    state.savedFactsheets = [];
  } else {
    state.savedFactsheets = data || [];
  }

  renderSavedFactsheets();
  renderFilmList();
}

function renderSavedFactsheets() {
  els.savedFactsheetSelect.innerHTML = `<option value="">Factsheet wählen</option>`;
  updateSavedFactsheetActions();

  if (!state.session) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Zum Laden einloggen";
    option.disabled = true;
    els.savedFactsheetSelect.append(option);
    return;
  }

  if (state.savedFactsheets.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Keine gespeichert";
    option.disabled = true;
    els.savedFactsheetSelect.append(option);
    return;
  }

  for (const source of state.savedFactsheets) {
    const option = document.createElement("option");
    option.value = source.id;
    option.textContent = `${source.source_name || "Factsheet"} · ${source.source_type}`;
    els.savedFactsheetSelect.append(option);
  }
}

function selectSavedFactsheet() {
  const id = els.savedFactsheetSelect.value;
  if (!id) return;

  const source = state.savedFactsheets.find(item => item.id === id);
  if (!source) return;

  state.factsheetFileText = source.extracted_text || "";
  state.factsheetFileName = source.source_name || "Vorhandenes Factsheet";
  state.factsheetInput = {
    type: source.source_type || "text",
    sourceName: source.source_name || "Vorhandenes Factsheet",
    sourceUrl: source.source_url || "",
    storagePath: source.storage_path || "",
    existingSourceId: source.id
  };
  els.factsheetUrl.value = "";
  els.factsheetText.value = "";
  els.factsheetFile.value = "";
  updateSavedFactsheetActions();
  renderProposalMessage(`${state.factsheetFileName} geladen. Jetzt Vorschlag erstellen.`, false);
}

function updateSavedFactsheetActions() {
  const source = getSelectedSavedFactsheet();
  const hasSource = Boolean(source);
  const hasFile = Boolean(source?.storage_path);
  els.savedFactsheetActions.classList.toggle("hidden", !hasSource);
  els.viewFactsheetBtn.disabled = !hasSource;
  els.downloadFactsheetBtn.disabled = !hasFile;
}

function getSelectedSavedFactsheet() {
  const id = els.savedFactsheetSelect.value;
  if (!id) return null;
  return state.savedFactsheets.find(item => item.id === id) || null;
}

async function viewSelectedFactsheet() {
  const source = getSelectedSavedFactsheet();
  if (!source) return;

  if (source.storage_path) {
    const url = await createFactsheetSignedUrl(source.storage_path);
    if (url) window.open(url, "_blank", "noopener");
    return;
  }

  if (source.source_url && /^https?:\/\//i.test(source.source_url)) {
    window.open(source.source_url, "_blank", "noopener");
    return;
  }

  renderProposalMessage("Diese Quelle hat keine Originaldatei. Der extrahierte Text ist im Datensatz gespeichert und kann erneut analysiert werden.", false);
}

async function downloadSelectedFactsheet() {
  const source = getSelectedSavedFactsheet();
  if (!source?.storage_path) return;

  const url = await createFactsheetSignedUrl(source.storage_path, true);
  if (!url) return;

  const link = document.createElement("a");
  link.href = url;
  link.download = source.source_name || "factsheet";
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
}

async function createFactsheetSignedUrl(path, download = false) {
  if (!state.client || !state.session) {
    setStatus("Bitte zuerst einloggen.", true);
    return "";
  }

  const options = download ? { download: true } : undefined;
  const { data, error } = await state.client.storage
    .from(FACTSHEET_BUCKET)
    .createSignedUrl(path, 60, options);

  if (error) {
    setStatus(`Factsheet konnte nicht geöffnet werden: ${error.message}`, true);
    return "";
  }

  return data.signedUrl;
}

async function readFactsheetFile(event) {
  const [file] = event.target.files;
  state.factsheetFileText = "";
  state.factsheetFileName = "";
  state.factsheetInput = null;
  if (!file) return;

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    await readPdfFactsheet(file);
    return;
  }

  if (!file.type.includes("text") && !file.name.toLowerCase().endsWith(".txt")) {
    renderProposalMessage("Bitte eine Textdatei oder ein PDF laden.", true);
    event.target.value = "";
    return;
  }
  state.factsheetFileText = await file.text();
  state.factsheetFileName = file.name;
  state.factsheetInput = {
    type: "text",
    sourceName: file.name,
    sourceUrl: "",
    storagePath: await uploadFactsheetSourceFile(file)
  };
  els.savedFactsheetSelect.value = "";
  els.factsheetUrl.value = "";
  els.factsheetText.value = "";
  renderProposalMessage(`${file.name} geladen. Jetzt Vorschlag erstellen.`, false);
}

async function readPdfFactsheet(file) {
  try {
    setStatus("Lese PDF...");
    const response = await fetch(`/api/factsheet/extract-pdf?sourceName=${encodeURIComponent(file.name)}`, {
      method: "POST",
      headers: { "Content-Type": "application/pdf" },
      body: file
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);

    state.factsheetFileText = payload.text;
    state.factsheetFileName = file.name;
    state.factsheetInput = {
      type: "pdf",
      sourceName: file.name,
      sourceUrl: "",
      storagePath: await uploadFactsheetSourceFile(file)
    };
    els.savedFactsheetSelect.value = "";
    els.factsheetUrl.value = "";
    els.factsheetText.value = "";
    renderProposalMessage(`${file.name} gelesen. Jetzt Vorschlag erstellen.`, false);
  } catch (error) {
    state.factsheetFileText = "";
    state.factsheetFileName = "";
    state.factsheetInput = null;
    els.factsheetFile.value = "";
    renderProposalMessage(`PDF konnte nicht gelesen werden: ${error.message}`, true);
  }
}

async function createAndApplyFactsheetProposal() {
  try {
    const sourceUrl = els.factsheetUrl.value.trim();
    let text = els.factsheetText.value.trim();
    let sourceName = "Eingefügter Text";

    if (state.factsheetFileText) {
      text = state.factsheetFileText;
      sourceName = state.factsheetFileName || "Textdatei";
    } else if (sourceUrl) {
      const urlSource = await readFactsheetUrl(sourceUrl);
      text = urlSource.text;
      sourceName = urlSource.sourceName;
      state.factsheetInput = {
        type: "url",
        sourceName,
        sourceUrl: urlSource.sourceUrl,
        storagePath: ""
      };
    } else if (text) {
      state.factsheetInput = {
        type: "text",
        sourceName,
        sourceUrl: "",
        storagePath: ""
      };
    }

    if (!text || text.length < 120) {
      renderProposalMessage("Bitte erst eine Factsheet-Quelle wählen oder mehr Text einfügen.", true);
      return;
    }

    const localProposal = buildFactsheetProposal(text, sourceName);
    state.currentProposal = await getBestFactsheetProposal(text, sourceName, localProposal);
    await saveProposalDraft(text, state.currentProposal);
    applyFactsheetProposal(state.currentProposal);
    renderFactsheetProposalSummary(state.currentProposal);
    closeNewFilmDialog();
  } catch (error) {
    renderProposalMessage(`Vorschlag konnte nicht erstellt werden: ${error.message}`, true);
  }
}

async function readFactsheetUrl(sourceUrl) {
  setStatus("Lese Website...");
  const response = await fetch("/api/factsheet/read-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: sourceUrl })
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
  return payload;
}

function renderProposalMessage(message, isError) {
  els.proposalPanel.classList.remove("hidden");
  els.proposalPanel.innerHTML = `<p class="proposal-warning">${escapeHtml(message)}</p>`;
  if (isError) setStatus(message, true);
}

function renderFactsheetProposalSummary(proposal) {
  const fieldCount = Object.values(proposal.film).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== "" && value !== 0 && value !== null && value !== undefined;
  }).length;
  els.proposalPanel.classList.remove("hidden");
  els.proposalPanel.innerHTML = `
    <div class="proposal-title">
      <strong>${escapeHtml(proposal.film.brand || "Unbekannt")} ${escapeHtml(proposal.film.name || "")} übernommen</strong>
      <span>${escapeHtml(proposal.sourceName)} · ${proposal.provider === "openai" ? "LLM-Vorschlag" : "Lokaler Vorschlag"}</span>
    </div>
    <p class="proposal-warning">${fieldCount} Felder vorgeschlagen. Bitte im Formular prüfen.</p>
  `;
  setStatus("Factsheet-Vorschlag übernommen. Bitte prüfen.");
}

async function getBestFactsheetProposal(text, sourceName, localProposal) {
  setStatus("Erstelle Vorschlag...");

  try {
    const response = await fetch("/api/factsheet/propose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceName,
        text,
        localProposal
      })
    });

    if (!response.ok) throw new Error((await response.json()).error || `HTTP ${response.status}`);

    const payload = await response.json();
    return normalizeRemoteProposal(payload, sourceName, localProposal);
  } catch (error) {
    console.info("Nutze lokalen Factsheet-Vorschlag:", error.message);
    return {
      ...localProposal,
      provider: "local",
      warnings: [
        ...localProposal.warnings,
        "LLM-Auswertung nicht verfügbar; lokaler Vorschlag wurde verwendet."
      ]
    };
  }
}

function normalizeRemoteProposal(payload, sourceName, fallback) {
  const remote = payload.proposal || {};
  const remoteFilm = remote.film || {};
  const film = {
    ...fallback.film,
    ...remoteFilm,
    id: slugify(remoteFilm.id || fallback.film.id),
    iso_box: Number(remoteFilm.iso_box || fallback.film.iso_box || 0),
    formats: filterAllowed(remoteFilm.formats, FORMAT_OPTIONS, fallback.film.formats),
    use_cases: filterAllowed(remoteFilm.use_cases, USE_CASE_OPTIONS, fallback.film.use_cases),
    review_needed: true,
    image_url: "",
    image_path: ""
  };

  if (!film.id) film.id = fallback.film.id;

  return {
    sourceName: payload.sourceName || sourceName,
    provider: payload.provider || "openai",
    model: payload.model || "",
    film,
    confidence: Number(remote.confidence || fallback.confidence || 0),
    warnings: [...(remote.warnings || []), ...(remote.review_notes || [])].filter(Boolean),
    field_sources: remote.field_sources || {},
    evidence: fallback.evidence || {}
  };
}

async function uploadFactsheetSourceFile(file) {
  if (!state.client || !state.session) return "";

  try {
    const ext = file.name.split(".").pop().toLowerCase();
    const baseName = slugify(file.name.replace(/\.[^.]+$/, "")) || "factsheet";
    const path = `${baseName}/${Date.now()}-${baseName}.${ext}`;
    const { error } = await state.client.storage
      .from(FACTSHEET_BUCKET)
      .upload(path, file, {
        cacheControl: "31536000",
        upsert: true
      });

    if (error) throw error;
    return path;
  } catch (error) {
    console.info("Factsheet-Datei wurde nicht in Supabase gespeichert:", error.message);
    return "";
  }
}

async function saveProposalDraft(extractedText, proposal) {
  if (!state.client || !state.session || !proposal?.film) return;

  const input = state.factsheetInput || {
    type: "text",
    sourceName: proposal.sourceName || "Factsheet",
    sourceUrl: "",
    storagePath: ""
  };

  try {
    let source = null;

    if (input.existingSourceId) {
      const { data, error } = await state.client
        .from(FACTSHEET_SOURCES_TABLE)
        .update({
          film_id: state.selectedId || null,
          extracted_text: extractedText,
          extraction_status: "ready"
        })
        .eq("id", input.existingSourceId)
        .select()
        .single();

      if (error) throw error;
      source = data;
    } else {
      const { data, error } = await state.client
        .from(FACTSHEET_SOURCES_TABLE)
        .insert({
        film_id: state.selectedId || null,
        source_type: input.type || "text",
        source_name: input.sourceName || proposal.sourceName || "Factsheet",
        source_url: input.sourceUrl || "",
        storage_path: input.storagePath || "",
        extracted_text: extractedText,
        extraction_status: "ready"
        })
        .select()
        .single();

      if (error) throw error;
      source = data;
    }

    const { error: proposalError } = await state.client
      .from(PROPOSALS_TABLE)
      .insert({
        factsheet_source_id: source.id,
        proposed_data: proposal.film,
        field_sources: proposal.field_sources || {},
        status: "draft"
      });

    if (proposalError) throw proposalError;
    await loadSavedFactsheets();
  } catch (error) {
    console.info("Proposal-Entwurf wurde nicht in Supabase gespeichert:", error.message);
  }
}

function filterAllowed(values, allowed, fallback) {
  const set = new Set(allowed);
  const filtered = (Array.isArray(values) ? values : [])
    .map(value => String(value || "").trim())
    .filter(value => set.has(value));
  return filtered.length ? [...new Set(filtered)] : fallback;
}

function applyFactsheetProposal(proposal) {
  state.selectedId = "";
  state.pendingImageFile = null;
  fillForm({
    ...proposal.film,
    active: true,
    image_url: "",
    image_path: ""
  });
  els.editorTitle.textContent = "Vorschlag prüfen";
  updateRecordActions();
  renderFilmList();
  setStatus("Vorschlag übernommen. Bitte prüfen und speichern.");
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
    loadSavedFactsheets();
  } else if (state.client) {
    setConnection("Nicht angemeldet", false);
    els.accountSummary.textContent = "Nicht angemeldet";
    els.authForm.classList.remove("hidden");
    els.signedInActions.classList.add("hidden");
    loadSavedFactsheets();
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
    .from(FILMS_TABLE)
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
  loadSavedFactsheets();
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
    const item = document.createElement("div");
    item.className = "film-list-item";

    const button = document.createElement("button");
    button.type = "button";
    button.className = `film-item${film.id === state.selectedId ? " active" : ""}`;
    button.innerHTML = `
      <strong>${escapeHtml(film.brand)} ${escapeHtml(film.name)}</strong>
      <span>ISO ${escapeHtml(String(film.iso_box || ""))} · ${escapeHtml(film.process || "")} · ${film.active ? "aktiv" : "archiviert"}</span>
    `;
    button.addEventListener("click", () => selectFilm(film.id));

    const menuWrap = document.createElement("div");
    menuWrap.className = "film-menu-wrap";

    const menuButton = document.createElement("button");
    menuButton.className = "icon-btn film-menu-button";
    menuButton.type = "button";
    menuButton.setAttribute("aria-label", `Aktionen für ${film.brand} ${film.name}`);
    menuButton.textContent = "...";
    menuButton.addEventListener("click", event => {
      event.stopPropagation();
      const menu = menuWrap.querySelector(".film-action-menu");
      const willOpen = menu.classList.contains("hidden");
      closeFilmMenus();
      menu.classList.toggle("hidden", !willOpen);
    });

    const menu = document.createElement("div");
    menu.className = "film-action-menu hidden";
    const factsheet = getFactsheetForFilm(film);

    const viewButton = document.createElement("button");
    viewButton.type = "button";
    viewButton.className = "menu-item";
    viewButton.innerHTML = `<span><strong>Factsheet ansehen</strong><small>${escapeHtml(getFactsheetActionLabel(film, factsheet, "view"))}</small></span>`;
    viewButton.addEventListener("click", event => {
      event.stopPropagation();
      closeFilmMenus();
      viewFactsheetSource(film, factsheet);
    });

    const downloadButton = document.createElement("button");
    downloadButton.type = "button";
    downloadButton.className = "menu-item";
    downloadButton.innerHTML = `<span><strong>Factsheet herunterladen</strong><small>${escapeHtml(getFactsheetActionLabel(film, factsheet, "download"))}</small></span>`;
    downloadButton.addEventListener("click", event => {
      event.stopPropagation();
      closeFilmMenus();
      downloadFactsheetSource(film, factsheet);
    });

    menu.append(viewButton, downloadButton);
    menuWrap.append(menuButton, menu);

    item.append(button, menuWrap);
    els.filmList.append(item);
  }
}

function closeFilmMenus() {
  document.querySelectorAll(".film-action-menu").forEach(menu => {
    menu.classList.add("hidden");
  });
}

function getFactsheetForFilm(film) {
  const filmIdSlug = slugify(film.id);
  const filmNameSlug = slugify([film.brand, film.name, film.iso_box].filter(Boolean).join(" "));
  const filmNameWithoutBrandSlug = slugify([film.name, film.iso_box].filter(Boolean).join(" "));
  const candidates = [filmIdSlug, filmNameSlug, filmNameWithoutBrandSlug].filter(Boolean);

  const byFilmId = state.savedFactsheets.find(source => slugify(source.film_id) === filmIdSlug);
  if (byFilmId) return byFilmId;

  return state.savedFactsheets.find(source => {
    const sourceSlug = slugify(source.source_name || source.storage_path || "");
    return candidates.some(candidate => sourceSlug === candidate || sourceSlug.includes(candidate));
  }) || null;
}

function getFactsheetActionLabel(film, source, mode) {
  if (source?.storage_path) {
    return source.storage_path.toLowerCase().endsWith(".pdf")
      ? source.source_name || "Original-PDF"
      : source.source_name || "Gespeicherte Textdatei";
  }
  if (source?.extracted_text) return `${source.source_name || "Factsheet"} als Text`;
  if (source?.source_url && mode === "view") return source.source_name || "Original-Link";
  return `${film.brand} ${film.name} als Text`;
}

async function viewFactsheetSource(film, source) {
  if (source?.storage_path) {
    const url = await createFactsheetSignedUrl(source.storage_path);
    if (url) window.open(url, "_blank", "noopener");
    return;
  }

  if (source?.source_url && /^https?:\/\//i.test(source.source_url)) {
    window.open(source.source_url, "_blank", "noopener");
    return;
  }

  openTextDocument(getFactsheetText(film, source), `${film.brand} ${film.name}`);
}

async function downloadFactsheetSource(film, source) {
  if (source?.storage_path) {
    const url = await createFactsheetSignedUrl(source.storage_path, true);
    if (!url) return;

    const link = document.createElement("a");
    link.href = url;
    link.download = source.source_name || "factsheet";
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();
    return;
  }

  downloadTextDocument(getFactsheetText(film, source), `${slugify([film.brand, film.name, film.iso_box].filter(Boolean).join(" ")) || "film"}-factsheet.txt`);
}

function getFactsheetText(film, source) {
  if (source?.extracted_text) return source.extracted_text;

  const lines = [
    `${film.brand || ""} ${film.name || ""}`.trim(),
    film.iso_box ? `ISO: ${film.iso_box}` : "",
    film.film_type ? `Filmtyp: ${film.film_type}` : "",
    film.process ? `Prozess: ${film.process}` : "",
    Array.isArray(film.formats) && film.formats.length ? `Formate: ${film.formats.join(", ")}` : "",
    film.short_description ? `Kurzbeschreibung: ${film.short_description}` : "",
    film.look_description ? `Look: ${film.look_description}` : "",
    film.tip_exposure ? `Belichtung: ${film.tip_exposure}` : "",
    film.tip_development ? `Entwicklung: ${film.tip_development}` : "",
    film.tip_scan ? `Scan: ${film.tip_scan}` : ""
  ].filter(Boolean);

  return `${lines.join("\n\n")}\n`;
}

function openTextDocument(text, title) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function downloadTextDocument(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
  state.currentProposal = null;
  fillForm(film);
  updateRecordActions();
  renderFilmList();
}

function resetForm() {
  state.selectedId = "";
  state.pendingImageFile = null;
  state.currentProposal = null;
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
  const hasDraft = Boolean(readForm().brand || readForm().name || readForm().id);
  els.recordActions.classList.toggle("hidden", !state.selectedId && !hasDraft);
  els.discardDraftBtn.classList.toggle("hidden", state.selectedId && !state.currentProposal);
  els.duplicateBtn.classList.toggle("hidden", !state.selectedId);
  els.deleteBtn.classList.toggle("hidden", !state.selectedId);
}

function discardDraft() {
  state.currentProposal = null;
  resetForm();
  els.proposalPanel.classList.add("hidden");
  els.proposalPanel.innerHTML = "";
  setStatus("Entwurf verworfen");
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
    .from(FILMS_TABLE)
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
  state.currentProposal = null;
  fillForm(copy);
  els.editorTitle.textContent = "Kopie bearbeiten";
  setImagePreview("");
}

async function deleteSelectedFilm() {
  if (!requireClient() || !requireSession()) return;
  const film = state.films.find(item => item.id === state.selectedId);
  if (!film) return setStatus("Wähle zuerst einen Film aus.", true);
  const confirmed = window.confirm(`${film.brand} ${film.name} dauerhaft löschen?`);
  if (!confirmed) return;

  const { error } = await state.client
    .from(FILMS_TABLE)
    .delete()
    .eq("id", film.id);

  if (error) return setStatus(`Film konnte nicht gelöscht werden: ${error.message}`, true);

  if (film.image_path) {
    await state.client.storage.from(BUCKET).remove([film.image_path]);
  }

  state.selectedId = "";
  await loadFilms();
  resetForm();
  setStatus("Gelöscht");
}

function buildFactsheetProposal(text, sourceName) {
  const compact = text.replace(/\s+/g, " ").trim();
  const brand = inferBrand(compact, sourceName);
  const name = inferFilmName(compact, sourceName, brand);
  const iso = inferIso(compact, sourceName, name);
  const filmType = inferFilmType(compact, sourceName, name);
  const process = inferProcess(compact, filmType);
  const formats = inferFormats(compact, sourceName, name);
  const useCases = inferUseCases(compact, filmType);
  const look = inferLook(compact, filmType);
  const voice = inferFilmVoice(brand, name, filmType);
  const priceLevel = inferPriceLevel(brand, name);
  const exposure = inferExposure(compact, filmType);
  const warnings = [];

  if (!brand || !name || !iso) warnings.push("Basisdaten sind nicht vollständig eindeutig.");
  if (filmType === "Slide") warnings.push("Diafilm: Belichtungsspielraum eng prüfen, technische Push/Pull-Werte nicht als Praxis-Toleranz übernehmen.");
  if (!formats.length) warnings.push("Formate wurden nicht sicher erkannt.");

  const film = {
    id: slugify([brand, name, String(name).includes(String(iso)) ? "" : iso].filter(Boolean).join(" ")),
    brand,
    name,
    film_type: filmType,
    process,
    iso_box: iso,
    formats,
    use_cases: useCases,
    grain: look.grain,
    saturation: look.saturation,
    tone: look.tone,
    contrast: look.contrast,
    look_description: makeLookDescription(brand, name, filmType, look, compact, voice),
    price_level: priceLevel,
    exposure_latitude: exposure.level,
    exposure_note: exposure.note,
    short_description: makeShortDescription(brand, name, filmType, iso, useCases, look, voice),
    tip_exposure: makeExposureTip(filmType, iso, exposure.level, compact),
    tip_development: makeDevelopmentTip(process, filmType, compact),
    tip_scan: makeScanTip(filmType, look),
    review_needed: true,
    notes: `Aus Factsheet-Vorschlag übernommen. Quelle: ${sourceName}. Bitte technische Werte und interpretierte Texte prüfen.`
  };

  const filled = Object.entries(film).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== "" && value !== 0 && value !== null && value !== undefined;
  }).length;

  return {
    sourceName,
    film,
    confidence: Math.max(45, Math.min(92, Math.round((filled / Object.keys(film).length) * 100) - warnings.length * 4)),
    warnings,
    evidence: {
      brand: getEvidence(compact, [brand]) || "Aus Quelle/Dateiname abgeleitet",
      name: getEvidence(compact, [name]) || "Aus Quelle/Dateiname abgeleitet",
      iso_box: getEvidence(compact, [`ISO ${iso}`, `ASA ${iso}`, `EI ${iso}`, String(iso)]) || "Aus Name oder Film-Speed-Tabelle abgeleitet",
      film_type: getEvidence(compact, ["color negative", "black-and-white", "black and white", "panchromatic", "reversal", "slide"]),
      process: getEvidence(compact, [process, "Process C-41", "E-6", "black-and-white"]),
      formats: formats.length ? `Erkannt: ${formats.join(", ")}` : ""
    }
  };
}

function inferBrand(text, sourceName) {
  const value = `${sourceName} ${text}`;
  const brands = [
    ["CineStill", /cinestill/i],
    ["Fujifilm", /fuji|fujifilm|fujichrome/i],
    ["Ilford", /ilford/i],
    ["Kodak", /kodak/i],
    ["Foma", /foma|fomapan/i],
    ["Lomography", /lomography/i]
  ];
  return brands.find(([, pattern]) => pattern.test(value))?.[0] || "";
}

function inferFilmName(text, sourceName, brand) {
  const fromSource = sourceName
    .replace(/\.[^.]+$/, "")
    .replace(/_/g, " ")
    .replace(new RegExp(`^${brand}\\s+`, "i"), "")
    .replace(/^Fujichrome\s+/i, "")
    .replace(/^Fujifilm\s+/i, "")
    .trim();
  const known = [
    ["HP5 Plus", /hp5\s*plus/i],
    ["FP4 Plus", /fp4\s*plus/i],
    ["Delta 3200", /delta\s*3200/i],
    ["Tri-X 400", /tri[-\s]?x\s*400/i],
    ["Portra 160", /portra\s*160/i],
    ["Portra 400", /portra\s*400/i],
    ["Portra 800", /portra\s*800/i],
    ["Gold 200", /gold\s*200/i],
    ["Ultramax 400", /ultramax\s*400/i],
    ["Ektar 100", /ektar\s*100/i],
    ["Velvia 50", /velvia\s*50/i],
    ["Provia 100F", /provia\s*100f?/i],
    ["Fomapan 200", /fomapan\s*200/i],
    ["Fomapan 400", /fomapan\s*400/i],
    ["800T", /800t|800 tungsten/i],
    ["Lomography 800", /lomography\s*800/i]
  ];
  return known.find(([, pattern]) => pattern.test(`${sourceName} ${text}`))?.[0] || titleCase(fromSource);
}

function inferIso(text, sourceName, name) {
  const value = `${sourceName} ${name} ${text}`;
  const match = value.match(/\b(?:ISO|ASA|EI)?\s*(25|50|64|80|100|125|160|200|400|800|1600|3200)\b/i);
  return match ? Number(match[1]) : 0;
}

function inferFilmType(text, sourceName, name) {
  const value = `${sourceName} ${name} ${text}`;
  if (/reversal|slide|transparency|e-6|e6|velvia|provia/i.test(value)) return "Slide";
  if (/black[-\s]?and[-\s]?white|black & white|panchromatic|monochrome|b&w|hp5|fp4|tri[-\s]?x|delta|fomapan/i.test(value)) return "B&W";
  return "Color Negative";
}

function inferProcess(text, filmType) {
  if (/ecn-2|ecn2/i.test(text)) return "ECN-2";
  if (/c-41|c41|color negative/i.test(text)) return "C-41";
  if (/e-6|e6|reversal|slide/i.test(text)) return "E-6";
  return filmType === "B&W" ? "B&W" : filmType === "Slide" ? "E-6" : "C-41";
}

function inferFormats(text, sourceName, name) {
  const knownFormats = {
    "delta 3200": ["135", "120"],
    "ektar 100": ["135", "120", "4x5"],
    "fomapan 200": ["135", "120", "Sheet"],
    "fomapan 400": ["135", "120", "Sheet"],
    "fp4 plus": ["135", "120", "Sheet"],
    "gold 200": ["135", "120"],
    "hp5 plus": ["135", "120", "Sheet"],
    "portra 160": ["135", "120", "4x5"],
    "portra 400": ["135", "120", "4x5"],
    "portra 800": ["135", "120"],
    "provia 100f": ["135", "120"],
    "tri-x 400": ["135", "120"],
    "ultramax 400": ["135"],
    "velvia 50": ["135", "120", "4x5"]
  };
  const known = knownFormats[String(name || "").toLowerCase()];
  if (known) return known;

  const value = `${sourceName} ${text}`;
  const formats = [];
  if (/\b135\b|35\s*mm|135\s*format/i.test(value)) formats.push("135");
  if (/\b120\s*film\b|\b120\s*format\b|roll\s*film/i.test(value)) formats.push("120");
  if (/sheet|large format|4\s*x\s*5/i.test(value)) formats.push("Sheet");
  if (/4\s*x\s*5/i.test(value)) formats.push("4x5");
  if (/8\s*x\s*10/i.test(value)) formats.push("8x10");
  return [...new Set(formats)];
}

function inferUseCases(text, filmType) {
  const value = text.toLowerCase();
  const cases = [];
  if (/portrait|skin|wedding/.test(value)) cases.push("Portrait");
  if (/street|reportage|documentary/.test(value)) cases.push("Street", "Reportage");
  if (/travel|general picture-taking|snapshot/.test(value)) cases.push("Travel", "Snapshot");
  if (/landscape|nature|scenic/.test(value)) cases.push("Landscape");
  if (/daylight|sun|sunny/.test(value)) cases.push("Sunny");
  if (/flash|studio/.test(value)) cases.push("Studio");
  if (/low light|available light|night|tungsten/.test(value)) cases.push("Low Light");
  if (filmType === "Slide" && !cases.includes("Landscape")) cases.push("Landscape");
  if (filmType === "B&W" && !cases.includes("Street")) cases.push("Street");
  return [...new Set(cases)].slice(0, 6);
}

function inferLook(text, filmType) {
  const value = text.toLowerCase();
  return {
    grain: /very fine|extremely fine|fine grain|feines korn/.test(value) ? "Fein" : /coarse|pronounced|sichtbar|classic grain/.test(value) ? "Sichtbar" : "",
    saturation: filmType === "B&W" ? "Monochrom" : /saturated|vivid|rich color|color saturation/.test(value) ? "Hoch" : /natural|neutral/.test(value) ? "Natürlich" : "Mittel",
    tone: filmType === "B&W" ? "Neutral" : /warm|gold|yellow|red/.test(value) ? "Warm" : /cool|blue/.test(value) ? "Kühl" : "Neutral",
    contrast: /high contrast|contrasty|hoher kontrast/.test(value) ? "Hoch" : /soft contrast|low contrast|weicher kontrast/.test(value) ? "Weich" : "Mittel"
  };
}

function inferPriceLevel(brand, name) {
  const value = `${brand} ${name}`.toLowerCase();
  if (/gold|ultramax|fomapan|kodacolor/.test(value)) return "Budget";
  if (/portra|ektar|velvia|provia|cinestill|delta/.test(value)) return "Premium";
  return "Mittel";
}

function inferFilmVoice(brand, name, filmType) {
  const value = `${brand} ${name}`.toLowerCase();
  if (/portra/.test(value)) {
    return {
      short: "Ein ruhiger, sehr flexibler Film für Menschen, Hauttöne und weiches Licht. Er wirkt professionell, ohne steril zu werden, und bleibt auch bei wechselnden Bedingungen verlässlich.",
      look: "Der Look ist weich, warm und sehr schmeichelhaft. Farben bleiben kontrolliert, Haut wirkt natürlich, und leichte Überbelichtung gibt dem Film oft diesen luftigen Portra-Charakter."
    };
  }
  if (/gold|ultramax|kodacolor/.test(value)) {
    return {
      short: "Ein unkomplizierter Alltagsfilm für Reisen, Familie, Sonne und spontane Bilder. Er bringt schnell Wärme ins Bild und macht auch einfache Motive freundlich und lebendig.",
      look: "Der Look ist warm, farbig und leicht nostalgisch. Gelb- und Rottöne kommen gerne nach vorne, Kontrast und Korn bleiben präsent genug, damit die Bilder klar analog wirken."
    };
  }
  if (/hp5|tri[-\s]?x|delta|fomapan/.test(value)) {
    return {
      short: "Ein Schwarzweissfilm für direkte, ehrliche Bilder. Er passt gut zu Street, Reportage und Available Light, besonders wenn das Bild nicht zu glatt wirken soll.",
      look: "Der Look lebt von Struktur, Korn und Kontrast. Schatten dürfen Gewicht haben, helle Kanten setzen sich gut ab, und Motive bekommen schnell eine dokumentarische Präsenz."
    };
  }
  if (/velvia|provia/.test(value)) {
    return {
      short: "Ein Diafilm für bewusstes Arbeiten mit Licht, Farbe und Komposition. Er ist weniger verzeihend, belohnt saubere Belichtung aber mit sehr klaren, dichten Ergebnissen.",
      look: "Der Look ist präzise, farbdicht und brillant. Farben wirken direkt, Kontrast ist klar gesetzt, und jede Belichtungsentscheidung bleibt sichtbar."
    };
  }
  if (/ektar/.test(value)) {
    return {
      short: "Ein feiner, farbstarker Film für klare Motive, Reisen, Landschaft und detailreiche Szenen. Er wirkt sauber und modern, ohne den analogen Charakter zu verlieren.",
      look: "Der Look ist scharf, gesättigt und vergleichsweise sauber. Farben haben Druck, feine Details bleiben gut erhalten, und das Korn tritt eher in den Hintergrund."
    };
  }
  if (/cinestill|800t/.test(value)) {
    return {
      short: "Ein Film für Kunstlicht, Nacht und farbige Lichtquellen. Er ist besonders spannend, wenn vorhandenes Licht Teil der Bildstimmung werden soll.",
      look: "Der Look ist cineastisch, warm in Kunstlicht und oft von Halation geprägt. Lichtquellen bekommen Glühen, Schatten bleiben atmosphärisch, Farben wirken schnell filmisch."
    };
  }
  if (/lomography/.test(value)) {
    return {
      short: "Ein spielerischer Film für spontane Situationen, wechselndes Licht und Bilder, die nicht zu kontrolliert wirken müssen.",
      look: "Der Look ist farbig, direkt und etwas unberechenbarer. Genau das kann gut passen, wenn die Bilder locker, lebendig und weniger perfektionistisch wirken sollen."
    };
  }
  return null;
}

function inferExposure(text, filmType) {
  const value = text.toLowerCase();
  if (filmType === "Slide") {
    return { level: "Gering", note: "Diafilm: Lichter präzise schützen; technische Push/Pull-Angaben separat prüfen." };
  }
  if (/wide exposure latitude|two stops underexposure to three stops overexposure|2 stops under.*3 stops over/.test(value)) {
    return { level: "Hoch", note: "Factsheet nennt breiten Belichtungsspielraum; konkrete Stop-Werte vor Freigabe prüfen." };
  }
  if (/push|pull|flexible|latitude/.test(value) && filmType === "B&W") {
    return { level: "Sehr hoch", note: "Schwarzweiss-Factsheet weist auf flexible Belichtung oder Entwicklung hin; Push-Werte als Entwicklungsangabe prüfen." };
  }
  if (/latitude|overexposure|underexposure/.test(value)) {
    return { level: "Hoch", note: "Factsheet erwähnt Belichtungsspielraum; genaue Praxisgrenzen prüfen." };
  }
  return { level: "Mittel", note: "Kein eindeutiger Belichtungsspielraum erkannt." };
}

function makeShortDescription(brand, name, filmType, iso, useCases, look, voice) {
  if (voice?.short) return `${brand} ${name}: ${voice.short}`;

  const typeLabel = filmType === "B&W" ? "Schwarzweissfilm" : filmType === "Slide" ? "Diafilm" : "Farbnegativfilm";
  const use = getUseCasePhrase(useCases);
  const saturation = getSaturationAdjective(look.saturation);
  const grain = getGrainPhrase(look.grain);

  if (filmType === "B&W") {
    return `${brand} ${name} ist ein vielseitiger ISO-${iso}-${typeLabel}${use}. Er passt gut, wenn Bilder direkt, zeitlos und etwas rau wirken dürfen${grain ? `, ohne dass ${grain} stört` : ""}.`;
  }

  if (filmType === "Slide") {
    return `${brand} ${name} ist ein ISO-${iso}-${typeLabel}${use}. Er belohnt präzise Belichtung mit klaren Farben, hoher Schärfe und einem Look, der sehr bewusst wirkt.`;
  }

  return `${brand} ${name} ist ein ISO-${iso}-${typeLabel}${use}. Er liefert ${saturation}e Farben, bleibt dabei unkompliziert und eignet sich gut für Situationen, in denen der Filmcharakter sichtbar sein soll${grain ? `, aber ${grain} fein bleibt` : ""}.`;
}

function makeLookDescription(brand, name, filmType, look, text, voice) {
  if (voice?.look) return voice.look;

  if (filmType === "B&W") {
    return `${brand} ${name} zeichnet mit ${getContrastPhrase(look.contrast)} und ${getGrainPhrase(look.grain) || "sichtbarem Korn"}. Der Look wirkt klassisch, ehrlich und eignet sich besonders gut für Motive mit Struktur, Lichtkanten und Bewegung.`;
  }
  if (filmType === "Slide") {
    return `${brand} ${name} wirkt dicht, klar und sehr präzise. Farben stehen schnell im Vordergrund, der Kontrast ist präsent, und Lichter brauchen Aufmerksamkeit.`;
  }
  const sharp = /sharpness|high sharpness|schärfe/i.test(text) ? " und guter Schärfe" : "";
  return `${brand} ${name} zeigt ${getSaturationSentencePart(look.saturation)}, ${getTonePhrase(look.tone)} und ${getContrastPhrase(look.contrast)}${sharp}. Der Look bleibt zugänglich, wirkt aber deutlich analog statt neutral-digital.`;
}

function getSaturationPhrase(value) {
  if (value === "Hoch") return "hoher Sättigung";
  if (value === "Natürlich") return "natürlicher Farbwiedergabe";
  if (value === "Monochrom") return "monochromer Wiedergabe";
  return "mittlerer Sättigung";
}

function getSaturationAdjective(value) {
  if (value === "Hoch") return "satte";
  if (value === "Natürlich") return "natürliche";
  if (value === "Monochrom") return "monochrome";
  return "ausgewogene";
}

function getSaturationSentencePart(value) {
  if (value === "Hoch") return "eine hohe Sättigung";
  if (value === "Natürlich") return "eine natürliche Farbwiedergabe";
  if (value === "Monochrom") return "eine monochrome Wiedergabe";
  return "eine mittlere Sättigung";
}

function getContrastPhrase(value) {
  if (value === "Hoch") return "hohem Kontrast";
  if (value === "Weich") return "weichem Kontrast";
  return "mittlerem Kontrast";
}

function getGrainPhrase(value) {
  if (value === "Fein") return "feinem Korn";
  if (value === "Grob") return "grobem Korn";
  if (value === "Sichtbar") return "sichtbarem Korn";
  return "";
}

function getTonePhrase(value) {
  if (value === "Warm") return "warme Grundtöne";
  if (value === "Kühl") return "kühle Grundtöne";
  if (value === "Variabel") return "variable Farbstimmung";
  return "neutrale Grundtöne";
}

function makeExposureTip(filmType, iso, level, text) {
  if (filmType === "Slide") return "Lichter sauber messen und lieber etwas vorsichtiger belichten. Der Film verzeiht wenig, wirkt dafür sehr stark, wenn die Belichtung sitzt.";
  if (/two stops underexposure to three stops overexposure/i.test(text)) return `Als ISO ${iso} starten. Etwas mehr Licht hilft den Schatten und macht den Scan entspannter; knappe Belichtung lieber nur bewusst einsetzen.`;
  if (filmType === "B&W") return `Als ISO ${iso} starten. Pushen funktioniert als Stilmittel gut, bringt aber mehr Korn und härtere Kontraste mit.`;
  return `Als ISO ${iso} starten. Ein wenig reichlicher belichten ist meist die angenehmere Richtung, besonders wenn Schatten sauber bleiben sollen.`;
}

function makeDevelopmentTip(process, filmType, text) {
  if (process === "C-41") return "C-41 Standard ist die sichere Wahl. Push oder Pull nur gezielt nutzen, wenn der Look bewusst härter oder dichter werden soll.";
  if (process === "E-6") return "E-6 Standardprozess bevorzugen. Push kann spannend sein, macht den Film aber kontrastreicher und weniger tolerant.";
  if (filmType === "B&W") return "Entwickler nach gewünschtem Charakter wählen: ausgewogen für Alltag, härter für Reportage, körniger für mehr Biss.";
  return `${process} Prozess nach Herstellerangabe.`;
}

function makeScanTip(filmType, look) {
  if (filmType === "B&W") return "Beim Scan nicht zu glatt ziehen. Kontrast und Korn dürfen sichtbar bleiben, sonst verliert der Film schnell seinen Charakter.";
  if (filmType === "Slide") return "Neutral starten und die Lichter schützen. Farben nur vorsichtig korrigieren, damit der Dia-Look nicht flach wird.";
  return look.tone === "Warm" ? "Warme Grundtöne ruhig stehen lassen. Schatten moderat öffnen und nicht zu stark neutralisieren." : "Neutral starten, Schwarzpunkt sauber setzen und die Farbstimmung nur leicht führen.";
}

function getUseCasePhrase(useCases) {
  const labels = {
    Portrait: "Porträts",
    Street: "Street",
    Travel: "Reisen",
    Landscape: "Landschaften",
    Studio: "Studioarbeit",
    Sunny: "sonnige Tage",
    "Low Light": "weniger Licht",
    Night: "Nacht",
    Reportage: "Reportage",
    Wedding: "Hochzeiten",
    Snapshot: "Alltag",
    Action: "Bewegung",
    Experimental: "Experimente",
    Neon: "Neonlicht"
  };
  const selected = useCases.slice(0, 3).map(value => labels[value] || value);
  if (!selected.length) return "";
  if (selected.length === 1) return ` für ${selected[0]}`;
  return ` für ${selected.slice(0, -1).join(", ")} und ${selected.at(-1)}`;
}

function getEvidence(text, terms) {
  for (const term of terms) {
    if (!term) continue;
    const index = text.toLowerCase().indexOf(String(term).toLowerCase());
    if (index >= 0) {
      const start = Math.max(0, index - 55);
      const end = Math.min(text.length, index + String(term).length + 70);
      return text.slice(start, end).trim();
    }
  }
  return "";
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

function titleCase(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\b[a-z0-9]/g, char => char.toUpperCase());
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
