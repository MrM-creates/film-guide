// --- Kleine Film-"Datenbank" ---
const films = [
    {
      id: "portra400",
      name: "Kodak Portra 400",
      brand: "Kodak",
      iso: 400,
      type: "Farbnegativ",
      formats: ["35mm", "120"],
      grain: "fein bis mittel",
      contrast: "mittel",
      colors:
        "leicht warm, sehr gute Hauttöne, eher weiche Pastellfarben bei Überbelichtung",
      dynamicRange:
        "sehr groß, lässt sich gut +1 bis +2 Blenden überbelichten",
      description:
        "Moderner Allround-Farbfilm mit sehr gutem Dynamikumfang, weichen Farben und hervorragenden Hauttönen. Ideal für Portraits und Reportage, aber auch für Reisefotografie.",
      recommendedUses: [
        "Portrait",
        "Street",
        "Reise",
        "Available Light",
        "Outdoor (gemischtes Licht)"
      ],
      tips: [
        "Lässt sich sehr gut bei ISO 200 oder 320 belichten (+1 bis +2 EV) für noch weichere, pastellige Farben.",
        "Unterbelichtung vermeiden – wird schnell matschig und kontrastarm.",
        "Ideal, wenn du einen 'sauberen' modernen Look willst."
      ]
    },
    {
      id: "ektar100",
      name: "Kodak Ektar 100",
      brand: "Kodak",
      iso: 100,
      type: "Farbnegativ",
      formats: ["35mm", "120"],
      grain: "sehr fein",
      contrast: "hoch",
      colors:
        "starke, gesättigte Farben, eher kühl, sehr knackige Blautöne und Grüntöne",
      dynamicRange:
        "gut, aber weniger gnädig als Portra bei Fehlbelichtung",
      description:
        "Sehr feinkörniger Farbfilm mit hohem Kontrast und stark gesättigten Farben. Ideal für Landschaft, Architektur und Szenen mit viel Licht.",
      recommendedUses: [
        "Landschaft",
        "Architektur",
        "Reise bei Tageslicht",
        "Still Life"
      ],
      tips: [
        "Am besten bei gutem Licht einsetzen – nicht ideal für Low Light.",
        "Hauttöne können schnell hart und zu bunt wirken, daher Portrait nur mit Vorsicht.",
        "Sorgfältiges Belichten – er verzeiht Unterbelichtung weniger."
      ]
    },
    {
      id: "hp5",
      name: "Ilford HP5 Plus 400",
      brand: "Ilford",
      iso: 400,
      type: "Schwarzweiß",
      formats: ["35mm", "120"],
      grain: "mittel",
      contrast: "mittel",
      colors: "n/a (Schwarzweiß)",
      dynamicRange:
        "sehr flexibel, lässt sich gut pushen (800, 1600 und darüber) mit deutlicherem Korn und mehr Kontrast",
      description:
        "Klassischer Schwarzweiß-Film mit flexiblem Belichtungsspielraum und angenehmem Korn. Ein echter Allrounder für Street, Reportage und Portrait.",
      recommendedUses: [
        "Street",
        "Reportage",
        "Portrait",
        "Low Light (mit Push)",
        "Dokumentarisch"
      ],
      tips: [
        "Lässt sich gut auf 800 oder 1600 pushen – ideal für Low-Light-Situationen.",
        "Charaktervolles Korn, aber nicht extrem grob.",
        "Sehr vielseitig – guter Standard-SW-Film, wenn du dich nicht festlegen magst."
      ]
    }
  ];
  
  // --- Suchindex vorab bauen (macht das Filtern einfacher & robust) ---
  films.forEach((film) => {
    const textParts = [
      film.name,
      film.brand,
      film.type,
      String(film.iso),
      film.grain,
      film.contrast,
      film.colors,
      film.dynamicRange,
      film.description,
      ...(film.recommendedUses || []),
      ...(film.tips || [])
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  
    film._searchIndex = textParts;
  });
  
  // --- DOM-Elemente ---
  const filmListEl = document.getElementById("filmList");
  const filmDetailEl = document.getElementById("filmDetail");
  const searchInputEl = document.getElementById("searchInput");
  
  // --- Film-Liste rendern ---
  function renderFilmList(filmsToShow) {
    filmListEl.innerHTML = "";
  
    if (!filmsToShow.length) {
      filmListEl.innerHTML = "<p>Keine Filme gefunden.</p>";
      return;
    }
  
    filmsToShow.forEach((film) => {
      const item = document.createElement("div");
      item.className = "film-item";
      item.dataset.id = film.id;
      item.innerHTML = `
        <strong>${film.name}</strong><br />
        <span>${film.brand} · ISO ${film.iso} · ${film.type}</span>
      `;
      item.addEventListener("click", () => {
        selectFilm(film.id, filmsToShow);
      });
      filmListEl.appendChild(item);
    });
  }
  
  // --- Film-Details rendern ---
  function renderFilmDetail(film) {
    filmDetailEl.innerHTML = `
      <h3>${film.name}</h3>
      <div class="meta-row"><strong>Marke:</strong> ${film.brand}</div>
      <div class="meta-row"><strong>Typ:</strong> ${film.type}</div>
      <div class="meta-row"><strong>ISO:</strong> ${film.iso}</div>
      <div class="meta-row"><strong>Formate:</strong> ${film.formats.join(", ")}</div>
      <div class="meta-row"><strong>Grain:</strong> ${film.grain}</div>
      <div class="meta-row"><strong>Kontrast:</strong> ${film.contrast}</div>
      <div class="meta-row"><strong>Farben/Look:</strong> ${film.colors}</div>
      <div class="meta-row"><strong>Dynamikumfang:</strong> ${film.dynamicRange}</div>
  
      <h4>Beschreibung</h4>
      <p>${film.description}</p>
  
      <h4>Empfohlene Einsatzgebiete</h4>
      <div class="tag-list">
        ${(film.recommendedUses || [])
          .map((use) => `<span class="tag">${use}</span>`)
          .join("")}
      </div>
  
      <h4>Tipps</h4>
      <ul>
        ${(film.tips || []).map((tip) => `<li>${tip}</li>`).join("")}
      </ul>
    `;
  }
  
  // --- Auswahl aktualisieren ---
  function selectFilm(id, currentList = films) {
    const selected = currentList.find((f) => f.id === id);
    if (!selected) return;
  
    // aktive Klasse aktualisieren
    const items = filmListEl.querySelectorAll(".film-item");
    items.forEach((item) => {
      item.classList.toggle("active", item.dataset.id === id);
    });
  
    renderFilmDetail(selected);
  }
  
  // --- Filter-Funktion ---
  function filterFilms(query) {
    const q = query.trim().toLowerCase();
  
    if (!q) {
      return films;
    }
  
    const filtered = films.filter((film) => {
      return film._searchIndex.includes(q);
    });
  
    return filtered;
  }
  
  // --- Event Listener für Suche ---
  if (searchInputEl) {
    searchInputEl.addEventListener("input", () => {
      const query = searchInputEl.value;
      const filtered = filterFilms(query);
  
      renderFilmList(filtered);
  
      if (filtered.length === 1) {
        // Wenn genau ein Treffer: direkt Details anzeigen
        selectFilm(filtered[0].id, filtered);
      } else {
        // Sonst Hinweis in den Details
        filmDetailEl.innerHTML = "<p>Bitte einen Film in der Liste auswählen.</p>";
      }
    });
  }
  
  // --- Initialer Render ---
  renderFilmList(films);
  if (films.length > 0) {
    selectFilm(films[0].id);
  }
  