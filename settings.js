/**
 * ============================================
 * DIGITAL MENU - CENTRAL SETTINGS (ALLEY 28)
 * ============================================
 */

const SETTINGS = {
    // 1. BRANDING
    restaurantName: "East Menu",
    tagline: "Asian Fusion & Fine Dining · Graz",
    metaDescription: "Speisekarte des East Menu – Asian Fusion & Fine Dining in Graz.",
    footerText: "2026 East Menu · Graz",

    // 2. DESIGN TOKENS (Alley 28 Palette)
    theme: {
        bgPrimary: "#3d3d3d",
        bgHeader: "#2d2d2d",
        accentGold: "#e3c49e",
        accentSecondary: "#aaaaaa",
        textPrimary: "#ffffff",
        textSecondary: "rgba(255,255,255,0.6)",
        fontHeading: "'Stylish Classy Font', cursive",
        fontBody: "'Montserrat', sans-serif"
    },

    // 3. API & STORAGE
    proxyUrl: "https://east-menu-proxy.f-klavun.workers.dev",
    storageKey: "eastmenu_lang",

    // 4. FEATURES
    languages: ["de", "en"],
    defaultLang: "de",

    // 5. ADMIN
    // Das Passwort wird NICHT hier gespeichert.
    // Es wird sicher als Cloudflare Secret 'ADMIN_PASSWORD' im Worker verwaltet.
    // Das Admin-Panel schickt das Passwort per Header 'X-Admin-Password' an den Worker.
};
