/**
 * ============================================
 * DIGITAL MENU - CENTRAL SETTINGS (ALLEY 28)
 * ============================================
 */

const SETTINGS = {
    // 1. BRANDING
    restaurantName: "EAST MENU",
    tagline: "Asian Fusion & Fine Dining · Graz",
    metaDescription: "Speisekarte des East Menu – Asian Fusion & Fine Dining in Graz.",
    footerText: "2026 East Menu · Graz",

    // 2. DESIGN TOKENS (Alley 28 Palette)
    theme: {
        bgPrimary: "#f5f4f2",       // Warm off-white (matches site --bg-primary)
        bgHeader: "#1a1a1a",        // Black header
        accentGold: "#BFA882",      // Alley 28 accent gold
        accentSecondary: "#8c7b6b", // Secondary warm tone
        textPrimary: "#1a1a1a",     // Dark text on light bg
        textSecondary: "rgba(26,26,26,0.5)",
        fontHeading: "'Cormorant Garamond', serif",
        fontBody: "'DM Sans', sans-serif"
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
