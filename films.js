const filmsData = [
    {
        "id": "fujifilm-velvia-50",
        "brand": "Fujifilm",
        "name": "Velvia 50",
        "img": "img/fujifilm-velvia-50-50.jpg",
        "iso": 50,
        "type": "Slide",
        "formats": [
            "120",
            "35mm",
            "Sheet"
        ],
        "process": "E-6",
        "shortDesc": "Extrem gesättigter Diafilm für Landschaft und Natur. Maximale Farbdichte und Detailtreue bei idealen Lichtbedingungen.",
        "specs": {
            "grain": "Feinkorn",
            "handling": "Präzise",
            "saturation": "Vivid",
            "budget": "Premium"
        },
        "uses": [
            "Landscape",
            "Studio",
            "Sunny",
            "Travel"
        ],
        "keywords": [
            "Dia",
            "Slide",
            "E6",
            "Feinkorn",
            "Präzise",
            "Premium",
            "Vivid"
        ],
        "look": {
            "desc": "Sehr satte Farben (stark in Rot- und Grüntönen). Hoher Kontrast, tiefes Schwarz. Feinstes Korn, sehr hohe Schärfe."
        },
        "tips": {
            "exposure": "Lichter schützen: lieber –0.3 bis –0.7 EV. Null Fehlertoleranz bei Überbelichtung.",
            "scanning": "Neutral scannen. Highlights schützen, Schwarztöne leicht anheben. Keine automatische Farbstichkorrektur auf Rot/Magenta – sonst verliert Velvia seinen typischen Look.",
            "dev": "E-6 Standardprozess → Push nur in Ausnahmefällen, da zusätzliche Kontraststeigerung"
        }
    },
    {
        "id": "kodak-ultramax-400",
        "brand": "Kodak",
        "name": "Ultramax 400",
        "img": "img/kodak-ultramax-400-400.jpg",
        "iso": 400,
        "type": "Color Negative",
        "formats": [
            "35mm"
        ],
        "process": "C-41",
        "shortDesc": "Günstiger Allround-Farbfilm für Alltag, Reisen und Street. Gute Ergebnisse bei fast allen Lichtsituationen, besonders draußen.",
        "specs": {
            "grain": "Mittel",
            "handling": "Tolerant",
            "saturation": "Vivid",
            "budget": "Budget"
        },
        "uses": [
            "Snapshot",
            "Street",
            "Sunny",
            "Travel"
        ],
        "keywords": [
            "Farbe",
            "Color",
            "Mittel",
            "Tolerant",
            "Budget",
            "Vivid"
        ],
        "look": {
            "desc": "Kräftige, etwas warm verschobene Farben. Sichtbares, aber angenehmes Korn. Leicht höherer Kontrast für einen lebendigen, konsumententypischen Look."
        },
        "tips": {
            "exposure": "Am besten bei ISO 200 belichten (+1 EV) für sattere Farben und weniger Korn. Bei schwachem Licht auf ISO 400 bleiben.",
            "scanning": "Warmton leicht kontrollieren. Schatten vorsichtig aufhellen, sonst stärkeres Rauschen. Gut für leichte Farb-Punch-Looks.",
            "dev": "C-41 Standard. Push bis 800 möglich, aber Korn und Kontrast werden deutlich stärker."
        }
    },
    {
        "id": "kodak-tri-x-400",
        "brand": "Kodak",
        "name": "Tri-X 400",
        "img": "img/kodak-tri-X-400.jpg",
        "iso": 400,
        "type": "B&W",
        "formats": [
            "120",
            "35mm"
        ],
        "process": "B&W",
        "shortDesc": "Klassischer Schwarzweißfilm mit unverwechselbarem Charakter. Ideal für Street, Reportage und Situationen mit wenig Licht.",
        "specs": {
            "grain": "Klassisch",
            "handling": "Tolerant",
            "saturation": "B&W",
            "budget": "Medium"
        },
        "uses": [
            "Action",
            "Low Light",
            "Reportage",
            "Street",
            "Travel"
        ],
        "keywords": [
            "Schwarzweiß",
            "SW",
            "B&W",
            "Klassisch",
            "Tolerant",
            "Medium",
            "B&W"
        ],
        "look": {
            "desc": "Markantes, grobkörnigeres Korn. Hoher Mikrokontrast. Typischer Zeitungs-Reportagelook: rau, direkt und sehr ausdrucksstark."
        },
        "tips": {
            "exposure": "Markantes, grobkörnigeres Korn. Hoher Mikrokontrast. Typischer Zeitungs-Reportagelook: rau, direkt und sehr ausdrucksstark.",
            "scanning": "Kontrast oft etwas hoch → flacher scannen und Kontrast in der Nachbearbeitungå gezielt setzen. Korn als Gestaltungselement beibehalten.",
            "dev": "Sehr vielseitig: D-76 für klassischen Look, Rodinal für ausgeprägtes Korn, HC-110 für etwas mehr Kontrast. Push-Entwicklung funktioniert hervorragend."
        }
    },
    {
        "id": "fujifilm-provia-100f",
        "brand": "Fujifilm",
        "name": "Provia 100F",
        "img": "img/fujifilm-provia-100f-100.jpg",
        "iso": 100,
        "type": "Color Negative",
        "formats": [
            "120",
            "35mm"
        ],
        "process": "C-41",
        "shortDesc": "Neutraler Diafilm mit hoher Schärfe und feinem Korn. Ideal, wenn natürliche Farbwiedergabe und Detailtreue gefragt sind.",
        "specs": {
            "grain": "Feinkorn",
            "handling": "Präzise",
            "saturation": "Natürlich",
            "budget": "Premium"
        },
        "uses": [
            "Landscape",
            "Studio",
            "Travel"
        ],
        "keywords": [
            "Farbe",
            "Color",
            "Feinkorn",
            "Präzise",
            "Premium",
            "Natürlich"
        ],
        "look": {
            "desc": "Kühle bis neutrale Farbbalance. Feines Korn, hohe Schärfe. Deutlich mehr Dynamikumfang als Velvia, aber weiterhin präzise Belichtung erforderlich."
        },
        "tips": {
            "exposure": "Auf die Highlights messen. Leicht unterbelichten (–0.3 EV) bewahrt die Zeichnung in hellen Bereichen.",
            "scanning": "Neutrales Profil, Blau/Magenta leicht kontrollieren bei Hauttönen. Tiefen minimal anheben, ohne die Schatten zu öffnen.",
            "dev": "E-6 Standard. Push bis 200 möglich; Farben werden dabei etwas lebendiger, Kontrast steigt moderat."
        }
    },
    {
        "id": "kodak-portra-800",
        "brand": "Kodak",
        "name": "Portra 800",
        "img": "img/kodak-portra-800.jpg",
        "iso": 800,
        "type": "Color Negative",
        "formats": [
            "120",
            "35mm"
        ],
        "process": "C-41",
        "shortDesc": "Lichtstarker Farbfilm mit sehr guten Hauttönen für Portraits, Weddings und Available-Light-Situationen. Ideal, wenn Portra-Look bei wenig Licht gefragt ist.",
        "specs": {
            "grain": "Mittel",
            "handling": "Tolerant",
            "saturation": "Natürlich",
            "budget": "Premium"
        },
        "uses": [
            "Low Light",
            "Portrait",
            "Street",
            "Travel",
            "Wedding"
        ],
        "keywords": [
            "Farbe",
            "Color",
            "Mittel",
            "Tolerant",
            "Premium",
            "Natürlich"
        ],
        "look": {
            "desc": "Etwas kräftigeres Korn als Portra 400, aber weiterhin weiche, natürliche Farben. Leicht warm, angenehme Hauttöne, guter Erhalt von Details in den Schatten."
        },
        "tips": {
            "exposure": "Für sauberere Ergebnisse gerne wie ISO 400–640 raten (+2/3 bis +1 EV). Bei sehr wenig Licht auf ISO 800 bleiben, um Verwackeln zu vermeiden.",
            "scanning": "Leicht warme Grundtönung, besonders unter Kunstlicht. Weißabgleich sparsam korrigieren, um den typischen Portra-Look nicht zu verlieren. Schatten vorsichtig anheben, damit das Korn nicht zu dominant wird.",
            "dev": "C-41 Standardprozess. Push bis ISO 1600 möglich, führt zu deutlich mehr Korn und Kontrast – eher stilistischer Effekt."
        }
    },
    {
        "id": "kodak-portra-400",
        "brand": "Kodak",
        "name": "Portra 400",
        "img": "img/kodak-portra-400.jpg",
        "iso": 400,
        "type": "Color Negative",
        "formats": [
            "120",
            "35mm"
        ],
        "process": "C-41",
        "shortDesc": "Flexibler Profi-Farbfilm mit natürlichen Hauttönen und sehr hohem Dynamikumfang. Zuverlässige Wahl für Portraits, Reportage und Reisen bei unterschiedlichsten Lichtbedingungen.",
        "specs": {
            "grain": "Feinkorn",
            "handling": "Tolerant",
            "saturation": "Natürlich",
            "budget": "Premium"
        },
        "uses": [
            "Portrait",
            "Street",
            "Sunny",
            "Travel",
            "Wedding"
        ],
        "keywords": [
            "Farbe",
            "Color",
            "Feinkorn",
            "Tolerant",
            "Premium",
            "Natürlich"
        ],
        "look": {
            "desc": "Sanfte, warme Farben mit zarten Pastelltönen bei Überbelichtung. Sehr feines, organisches Korn und weicher Kontrast – besonders schmeichelhaft für Haut."
        },
        "tips": {
            "exposure": "Für maximale Qualität als ISO 200 raten (+1 EV). Bei schwachem Licht ISO 400–800 möglich. Lichter sind sehr verzeihend.",
            "scanning": "Neutraler Weißabgleich genügt. Schatten können leicht angehoben werden, ohne starken Kornzuwachs. Sehr scan-freundliche Farbstruktur.",
            "dev": "C-41 Standard. Push bis 800 sehr gut nutzbar, minimal härterer Look."
        }
    },
    {
        "id": "kodak-portra-160",
        "brand": "Kodak",
        "name": "Portra 160",
        "img": "img/kodak-portra-160.jpg",
        "iso": 160,
        "type": "Color Negative",
        "formats": [
            "120",
            "35mm"
        ],
        "process": "C-41",
        "shortDesc": "Feinkörniger Profi-Farbfilm mit sehr natürlicher Farbwiedergabe und exzellenter Detailreproduktion. Ideal für Portraits, Studio und kontrolliertes Licht.",
        "specs": {
            "grain": "Feinkorn",
            "handling": "Tolerant",
            "saturation": "Natürlich",
            "budget": "Premium"
        },
        "uses": [
            "Portrait",
            "Studio",
            "Travel",
            "Wedding"
        ],
        "keywords": [
            "Farbe",
            "Color",
            "Feinkorn",
            "Tolerant",
            "Premium",
            "Natürlich"
        ],
        "look": {
            "desc": "Sehr weiche, neutrale Farbtöne. Extrem feines Korn mit hoher Schärfe. Besonders harmonische Hauttöne, weniger Pastell als Portra 400 bei Überbelichtung."
        },
        "tips": {
            "exposure": "Als ISO 100–125 raten (+1/3 bis +2/3 EV) ergibt die sanftesten Hauttöne. Bei gemischtem Licht ISO 160 belassen.",
            "scanning": "Sehr neutrale Basis – Weißabgleich nur minimal korrigieren. Schatten vorsichtig öffnen, um den natürlichen Look beizubehalten.",
            "dev": "C-41 Standardprozess. Push bis ISO 320 möglich, führt zu etwas mehr Kontrast ohne groben Qualitätsverlust."
        }
    },
    {
        "id": "lomography-lomography-800",
        "brand": "Lomography",
        "name": "Lomography 800",
        "img": "img/lomography-800.jpg",
        "iso": 800,
        "type": "Color Negative",
        "formats": [
            "120",
            "35mm"
        ],
        "process": "C-41",
        "shortDesc": "Vielseitiger 800er Farbfilm mit kräftigen Farben und solider Low-Light-Performance. Ideal für Reisen, Snapshot-Situationen und urbane Szenen bei wenig Licht.",
        "specs": {
            "grain": "Mittel",
            "handling": "Tolerant",
            "saturation": "Vivid",
            "budget": "Medium"
        },
        "uses": [
            "Experimental",
            "Low Light",
            "Night",
            "Snapshot",
            "Street",
            "Travel"
        ],
        "keywords": [
            "Farbe",
            "Color",
            "Mittel",
            "Tolerant",
            "Medium",
            "Vivid"
        ],
        "look": {
            "desc": "Lebendige, teilweise unvorhersehbare Farben mit einem leicht analogen Retro-Touch. Sichtbares, aber charaktervoller Korn. Tendenziell wärmer und kontrastreicher."
        },
        "tips": {
            "exposure": "Gerne leicht überbelichten (+1/3 bis +2/3 EV) für sattere Farben und etwas feineres Korn. Bei Night-Shots auf ISO 800 bleiben.",
            "scanning": "Farbstiche mild halten, Weißabgleich nicht zu neutral setzen – die Filmcharakteristik lebt von ihrem Farb-Punch. Schatten mit Vorsicht aufhellen, da Korn dann hervortritt.",
            "dev": "C-41 Standard. Push bis 1600 möglich, verstärkt aber das Korn und erhöht die Farbsättigung deutlich."
        }
    },
    {
        "id": "ilford-hp5-plus",
        "brand": "Ilford",
        "name": "HP5 Plus",
        "img": "img/ilford-hp5-plus-400.jpg",
        "iso": 400,
        "type": "B&W",
        "formats": [
            "120",
            "35mm"
        ],
        "process": "B&W",
        "shortDesc": "Vielseitiger Schwarzweißfilm mit hohem Belichtungsspielraum. Perfekt für Street, Reportage und Situationen mit wenig Licht.",
        "specs": {
            "grain": "Klassisch",
            "handling": "Tolerant",
            "saturation": "B&W",
            "budget": "Medium"
        },
        "uses": [
            "Action",
            "Low Light",
            "Portrait",
            "Reportage",
            "Street",
            "Travel"
        ],
        "keywords": [
            "Schwarzweiß",
            "SW",
            "B&W",
            "Klassisch",
            "Tolerant",
            "Medium",
            "B&W"
        ],
        "look": {
            "desc": "Klassisches, sichtbares Korn. Ausgewogene Kontraste mit guter Zeichnung in Schatten und Lichtern. Zeitloser Dokumentarlook."
        },
        "tips": {
            "exposure": "Als ISO 400–800 top. Push bis 1600 oder 3200 problemlos möglich → stärkeres Korn, kräftigerer Look.",
            "scanning": "Kontrast oft etwas höher einstellen, aber Schatten nicht komplett öffnen → Filmcharakter behalten. Korn bewusst als Gestaltungselement nutzen.",
            "dev": "Sehr flexibel: ID-11 / D-76 für ausgewogenen Look, HC-110 für mehr Kontur, Rodinal für betontes Korn. Push-Entwicklung funktioniert hervorragend."
        }
    },
    {
        "id": "kodak-gold-200",
        "brand": "Kodak",
        "name": "Gold 200",
        "img": "img/kodak-gold-200.jpg",
        "iso": 200,
        "type": "Color Negative",
        "formats": [
            "120",
            "35mm"
        ],
        "process": "C-41",
        "shortDesc": "Günstiger Alltagsfilm mit warmem Look für Sonne, Reisen und spontane Aufnahmen. Einsteigerfreundlich und fehlerverzeihend.",
        "specs": {
            "grain": "Klassisch",
            "handling": "Tolerant",
            "saturation": "Mittel",
            "budget": "Budget"
        },
        "uses": [
            "Snapshot",
            "Sunny",
            "Travel"
        ],
        "keywords": [
            "Farbe",
            "Color",
            "Klassisch",
            "Tolerant",
            "Budget",
            "Mittel"
        ],
        "look": {
            "desc": "Warme Grundtöne, besonders in Gelb- und Rotbereichen. Klassisches Korn, leicht nostalgischer Farbstich. Etwas stärkerer Kontrast bei hartem Licht."
        },
        "tips": {
            "exposure": "Gutes Licht bevorzugt → +1/3 bis +2/3 EV für saubere Schatten und etwas feineres Korn. In Schattenbereichen vorsichtig, da Zeichnung schnell verloren geht.",
            "scanning": "Warme Farben bewusst nutzen, nicht zu stark neutralisieren. Schatten leicht anheben, um Muddy-Look zu vermeiden.",
            "dev": "C-41 Standard. Push auf ISO 400 möglich, führt aber zu merklich mehr Korn und weniger Sanftheit."
        }
    },
    {
        "id": "ilford-fp4-plus",
        "brand": "Ilford",
        "name": "FP4 Plus",
        "img": "img/ilford-fp4plus-125.jpg",
        "iso": 125,
        "type": "B&W",
        "formats": [
            "120",
            "35mm"
        ],
        "process": "B&W",
        "shortDesc": "Feinkörniger Schwarzweißfilm mit sehr guter Detailwiedergabe. Ideal für Portraits, Studio und kontrollierte Lichtsituationen.",
        "specs": {
            "grain": "Feinkorn",
            "handling": "Mittel",
            "saturation": "B&W",
            "budget": "Medium"
        },
        "uses": [
            "Landscape",
            "Portrait",
            "Studio"
        ],
        "keywords": [
            "Schwarzweiß",
            "SW",
            "B&W",
            "Feinkorn",
            "Mittel",
            "Medium",
            "B&W"
        ],
        "look": {
            "desc": "Neutraler Tonbereich mit sauberen Graustufen. Feines Korn, gute Schärfe. Etwas geringerer Kontrast als HP5 – sehr klassischer, ruhiger Look."
        },
        "tips": {
            "exposure": "Bei ISO 100–125 arbeiten für bestes Ergebnis. Leichte Überbelichtung (+1/3 EV) sorgt für weiche Hauttöne und feinen Detailerhalt in den Schatten.",
            "scanning": "Neutrales Profil. Schatten nicht übertrieben öffnen, damit der charakteristisch klassische Eindruck bestehen bleibt. Feines Korn ermöglicht gute Vergrößerungen.",
            "dev": "D-76 / ID-11 für ausgewogenen Look. HC-110 für etwas mehr Kontrast und Schärfeeindruck. Push möglich, aber nicht optimal → Korn wirkt dann härter."
        }
    },
    {
        "id": "foma-fomapan-200",
        "brand": "Foma",
        "name": "Fomapan 200",
        "img": "img/fomapan-200.jpg",
        "iso": 200,
        "type": "B&W",
        "formats": [
            "120",
            "35mm"
        ],
        "process": "B&W",
        "shortDesc": "Günstiger Schwarzweißfilm mit klassischem Look. Geeignet für kontrolliertes Licht, Portraits und kreative Experimente.",
        "specs": {
            "grain": "Mittel",
            "handling": "Mittel",
            "saturation": "B&W",
            "budget": "Budget"
        },
        "uses": [
            "Experimental",
            "Portrait",
            "Studio"
        ],
        "keywords": [
            "Schwarzweiß",
            "SW",
            "B&W",
            "Mittel",
            "Mittel",
            "Budget",
            "B&W"
        ],
        "look": {
            "desc": "Leicht härteres Korn als bei Premiumfilmen. Tonwerte neutral bis kühl, mittlerer Kontrast. Kann je nach Entwicklung etwas unvorhersehbar in den Schatten sein."
        },
        "tips": {
            "exposure": "Als ISO 160–200 arbeiten für beste Schattenzeichnung. In kontrastreichem Licht lieber –1/3 EV halten, um Lichter zu schützen.",
            "scanning": "Kontrast bei Bedarf leicht erhöhen, um die Tontrennung zu optimieren. Vorsichtig mit Schattenaufhellung – sonst wirkt das Korn gröber.",
            "dev": "Rodinal für betontes Korn und knackigeren Look. D-76 / ID-11 für harmonischere Tonwerte. Pushentwicklung möglich, aber mit Qualitätsverlust (mehr Korn, härtere Schatten)."
        }
    },
    {
        "id": "kodak-ektar-100",
        "brand": "Kodak",
        "name": "Ektar 100",
        "img": "img/kodak-ektar-100.jpg",
        "iso": 100,
        "type": "Color Negative",
        "formats": [
            "120",
            "35mm"
        ],
        "process": "C-41",
        "shortDesc": "Farbfilm mit extrem feinem Korn und sehr hoher Schärfe. Ideal für Landschaften und detailreiche Motive bei gutem Licht.",
        "specs": {
            "grain": "Feinkorn",
            "handling": "Mittel",
            "saturation": "Vivid",
            "budget": "Premium"
        },
        "uses": [
            "Landscape",
            "Studio",
            "Sunny",
            "Travel"
        ],
        "keywords": [
            "Farbe",
            "Color",
            "Feinkorn",
            "Mittel",
            "Premium",
            "Vivid"
        ],
        "look": {
            "desc": "Sehr kräftige, gesättigte Farben. Hoher Mikrokontrast, besonders klare Rot- und Blautöne. Hauttöne können kühl und unnatürlich wirken."
        },
        "tips": {
            "exposure": "Als ISO 80–100 arbeiten. Bei hartem Sonnenlicht lieber –0.3 EV, um Clippen in Highlights zu vermeiden.",
            "scanning": "Farbsättigung bewusst kontrollieren, starke Blau-/Rottöne leicht abmildern. Feines Korn ideal für große Prints.",
            "dev": "C-41 Standard. Push möglich, aber nicht ideal — Kontrast steigt und Farbbalance wird unruhiger."
        }
    },
    {
        "id": "ilford-delta-3200",
        "brand": "Ilford",
        "name": "Delta 3200",
        "img": "img/ilford-delta-3200.jpg",
        "iso": 3200,
        "type": "B&W",
        "formats": [
            "120",
            "35mm"
        ],
        "process": "B&W",
        "shortDesc": "Hochempfindlicher Schwarzweißfilm für vorhandenes Licht. Ideal für Nachtaufnahmen, Konzerte und schnelle Street-Szenen ohne Blitz.",
        "specs": {
            "grain": "Grob",
            "handling": "Mittel",
            "saturation": "B&W",
            "budget": "Premium"
        },
        "uses": [
            "Action",
            "Experimental",
            "Low Light",
            "Night",
            "Street"
        ],
        "keywords": [
            "Schwarzweiß",
            "SW",
            "B&W",
            "Grob",
            "Mittel",
            "Premium",
            "B&W"
        ],
        "look": {
            "desc": "Deutlich sichtbares, charaktervolles Korn. Hoher Kontrast, dramatische Tonwerte. Sehr urbaner, rauer Stil."
        },
        "tips": {
            "exposure": "Als ISO 1600–3200 belichten für beste Ergebnisse. In extrem wenig Licht +1 EV geben, um Schattenzeichnung zu erhalten.",
            "scanning": "Flacher scannen → Kontrast gezielt später setzen. Korn nicht weichbügeln — das ist Teil der Bildsprache.",
            "dev": "Ideal zum Pushen: 3200 → 6400 möglich = intensiveres Korn, dramatischerer Look. Entwicklerwahl stark lookbestimmend: Microphen / DD-X für mehr Schattendetails."
        }
    },
    {
        "id": "cinestill-800t",
        "brand": "Cinestill",
        "name": "800T",
        "img": "img/cinestill-800t.jpg",
        "iso": 800,
        "type": "Color Negative",
        "formats": [
            "120",
            "35mm"
        ],
        "process": "C-41",
        "shortDesc": "Film mit Kinolook für Nacht- und Available-Light-Situationen. Ideal für urbane Szenen mit Kunstlicht und Neonreklamen.",
        "specs": {
            "grain": "Mittel",
            "handling": "Mittel",
            "saturation": "Mittel",
            "budget": "Premium"
        },
        "uses": [
            "Experimental",
            "Low Light",
            "Neon",
            "Night",
            "Street"
        ],
        "keywords": [
            "Farbe",
            "Color",
            "Mittel",
            "Mittel",
            "Premium",
            "Mittel"
        ],
        "look": {
            "desc": "Kühle Farbtemperatur (Tungsten). Charakteristische rote Halation um Lichtquellen. Sichtbares Korn, ausgewogene Kontraste mit filmischem Flair."
        },
        "tips": {
            "exposure": "Unter Kunstlicht ISO 800. Bei Tageslicht 85B-Filter oder manuell wärmen, sonst starker Blaustich. Bei wenig Licht sinnvoll leicht überbelichten (+1/3 EV), um Schattenzeichnung zu halten.",
            "scanning": "Halation bewusst erhalten – nicht komplett neutralisieren. Weißabgleich sanft Richtung warm schieben, besonders bei Tageslicht-Aufnahmen.",
            "dev": "C-41 Standard. Kein Remjet → etwas mehr Halation und teils höhere Empfindung gegenüber Kratzern im Labor."
        }
    }
];
