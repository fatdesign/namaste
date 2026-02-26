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
            background: "#120a0a",
            header: "#1a0f0f",
            accent: "#c5a059",
            saffron: "#e67e22",
            text: "#fdfcf0",
            gray: "rgba(253, 252, 240, 0.6)"
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
