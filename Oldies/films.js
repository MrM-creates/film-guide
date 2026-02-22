const filmsData = [
    {
        id: "kodak-portra-400",
        brand: "Kodak",
        name: "Portra 400",
        iso: 400,
        type: "Color Negative",
        formats: ["35mm", "120", "Sheet"],
        process: "C-41",
        shortDesc: "Der Profi-Standard. Perfekte Hauttöne & extrem flexibel.",
        specs: {
            grain: "Feinkorn",
            handling: "Einsteiger",
            saturation: "Natürlich",
            budget: "Teuer"
        },
        uses: ["Portrait", "Travel", "Wedding", "Sunny"],
        keywords: ["Farbe", "Color", "Profi", "Teuer", "Pastell", "Fine Grain"],
        look: {
            desc: "Legendäre Hauttöne, weiche Pastellfarben bei Überbelichtung."
        },
        tips: {
            exposure: "Liebt Licht! Belichte wie ISO 200 (+1 Stop).",
            scanning: "Sehr scan-freundlich.",
            dev: "Standard C-41."
        }
    },
    {
        id: "kodak-gold-200",
        brand: "Kodak",
        name: "Gold 200",
        iso: 200,
        type: "Color Negative",
        formats: ["35mm", "120"],
        process: "C-41",
        shortDesc: "Der Klassiker für Urlaubserinnerungen mit goldenem Glow.",
        specs: {
            grain: "Mittel",
            handling: "Einsteiger",
            saturation: "Vivid",
            budget: "Günstig"
        },
        uses: ["Travel", "Sunny", "Snapshot"],
        keywords: ["Farbe", "Color", "Günstig", "Warm", "Urlaub", "Einsteiger"],
        look: {
            desc: "Warm, Goldtöne, nostalgisches Gelb/Rot."
        },
        tips: {
            exposure: "Braucht gutes Licht, Schatten werden schnell matschig.",
            scanning: "Neigt zu warmen Stichen.",
            dev: "Standard C-41."
        }
    },
    {
        id: "ilford-hp5",
        brand: "Ilford",
        name: "HP5 Plus",
        iso: 400,
        type: "B&W",
        formats: ["35mm", "120", "Sheet"],
        process: "B&W",
        shortDesc: "Der vielseitigste SW-Film. Perfekt für Street & Push-Entwicklung.",
        specs: {
            grain: "Stark",
            handling: "Einsteiger",
            saturation: "Mittel",
            budget: "Mittel"
        },
        uses: ["Street", "Reportage", "Low Light", "Action"],
        keywords: ["Schwarzweiß", "SW", "Black White", "Mono", "Push", "Grainy", "Korn"],
        look: {
            desc: "Schöne Graustufen, sichtbares aber angenehmes Korn."
        },
        tips: {
            exposure: "Kann problemlos auf 800 oder 1600 gepusht werden.",
            scanning: "Einfach.",
            dev: "Sehr tolerant (z.B. in Rodinal)."
        }
    },
    {
        id: "fuji-velvia-50",
        brand: "Fujifilm",
        name: "Velvia 50",
        iso: 50,
        type: "Slide",
        formats: ["35mm", "120"],
        process: "E-6",
        shortDesc: "Maximale Sättigung für Landschaften. Nichts für Anfänger.",
        specs: {
            grain: "Feinkorn",
            handling: "Profi",
            saturation: "Vivid",
            budget: "Teuer"
        },
        uses: ["Landscape", "Nature", "Studio"],
        keywords: ["Dia", "Slide", "Positiv", "Farbe", "Color", "Scharf", "Teuer", "Profi"],
        look: {
            desc: "Leuchtende Rottöne, tiefe Magentas, extremes Kontrast."
        },
        tips: {
            exposure: "Miss auf die Lichter! Verzeiht keine Fehler.",
            scanning: "Schwer, sieht auf Leuchttisch am besten aus.",
            dev: "E-6 Prozess."
        }
    },
    {
        id: "cinestill-800t",
        brand: "Cinestill",
        name: "800T",
        iso: 800,
        type: "Color Negative",
        formats: ["35mm", "120"],
        process: "C-41",
        shortDesc: "Kino-Look bei Nacht (Tungsten) mit rotem Glühen.",
        specs: {
            grain: "Mittel",
            handling: "Fortgeschritten",
            saturation: "Mittel",
            budget: "Teuer"
        },
        uses: ["Low Light", "Night", "Neon", "Experimental"],
        keywords: ["Farbe", "Color", "Kunstlicht", "Tungsten", "Halation", "Rot", "Kino", "Cinematic"],
        look: {
            desc: "Kühl (Tungsten), rotes Glühen um Lichter (Halation)."
        },
        tips: {
            exposure: "Tageslicht braucht 85B Filter.",
            scanning: "Halation ist Teil des Looks.",
            dev: "C-41 (Remjet bereits entfernt)."
        }
    }
];
