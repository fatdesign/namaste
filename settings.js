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

    // 2. DESIGN TOKENS (Namaste Indian Palette)
    theme: {
        colors: {
            background: "#401201",
            header: "#5c1a01",
            accent: "#BF6E0B",
            saffron: "#A6330A",
            text: "#F2BF80",
            gray: "#8C5637"
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
