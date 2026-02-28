/**
 * ============================================
 * DIGITAL MENU - CENTRAL SETTINGS (ALLEY 28)
 * ============================================
 */

const SETTINGS = {
    // 1. BRANDING
    restaurantName: "Namaste",
    tagline: "Indische Spezialitäten in Hallein · Pflegerplatz 3",
    metaDescription: "Herzlich Willkommen im Namaste – Ihr Restaurant für authentische indische Spezialitäten in Hallein.",
    footerText: "2026 Namaste · Hallein",
    googleReviewLink: "https://search.google.com/local/writereview?placeid=ChIJBwf39QmVdkcR4-8C2bNJ7oE",
    reviewTimerHours: 0.0833, // 5 minutes for testing

    // 2. DESIGN TOKENS (Namaste Indian Palette)
    theme: {
        colors: {
            background: "#FFFCF5",
            header: "#FDF6E3",
            accent: "#BF6E0B",
            saffron: "#E67E22",
            text: "#401201",
            gray: "#A68A64"
        },
        accent: "accent",
        fontHeading: "'Cormorant Garamond', serif",
        fontBody: "'Montserrat', sans-serif"
    },

    // 3. API & STORAGE
    proxyUrl: "https://namaste-proxy.f-klavun.workers.dev",
    storageKey: "namaste_lang",

    // 4. FEATURES
    languages: ["de", "en"],
    defaultLang: "de",

    // 5. ADMIN
    // Das Passwort wird NICHT hier gespeichert.
    // Es wird sicher als Cloudflare Secret 'ADMIN_PASSWORD' im Worker verwaltet.
    // Das Admin-Panel schickt das Passwort per Header 'X-Admin-Password' an den Worker.
};
