// ============================================
// EAST MENU – CLOUDFLARE WORKER PROXY
// Deploy at: east-menu-proxy.f-klavun.workers.dev
//
// Cloudflare Environment Secrets needed:
//   ADMIN_PASSWORD  – Admin-Passwort für das Panel
//   GITHUB_OWNER    – GitHub Username / Organisation
//   GITHUB_REPO     – Repository Name (z.B. east-menu)
//   GITHUB_TOKEN    – GitHub Personal Access Token (repo Schreibrecht)
// ============================================

export default {
    async fetch(request, env) {

        // ── CORS Preflight ──────────────────────────────────
        if (request.method === 'OPTIONS') {
            return corsResponse(null, 204, env);
        }

        // ── Passwort-Prüfung ────────────────────────────────
        const password = request.headers.get('X-Admin-Password');
        if (!password || password !== env.ADMIN_PASSWORD) {
            return corsResponse(
                JSON.stringify({ error: 'Unauthorized – falsches Passwort.' }),
                401,
                env
            );
        }

        // ── Zieldatei ermitteln ─────────────────────────────
        const menuFile = request.headers.get('X-Menu-File') || 'menu.json';
        const githubApiUrl = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${menuFile}`;

        const githubHeaders = {
            'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Alley28MenuAdmin/1.0',
            'Content-Type': 'application/json',
        };

        // ── GET: Aktuelle menu.json von GitHub laden ────────
        if (request.method === 'GET') {
            const res = await fetch(githubApiUrl, { headers: githubHeaders });
            const data = await res.text();
            return corsResponse(data, res.status, env);
        }

        // ── POST: Aktualisierte menu.json auf GitHub speichern
        if (request.method === 'POST') {
            let body;
            try {
                body = await request.json();
            } catch {
                return corsResponse(
                    JSON.stringify({ error: 'Ungültiger Request-Body (JSON erwartet)' }),
                    400,
                    env
                );
            }

            if (!body.content || !body.sha) {
                return corsResponse(
                    JSON.stringify({ error: 'Fehlende Felder: content und sha werden benötigt.' }),
                    400,
                    env
                );
            }

            const res = await fetch(githubApiUrl, {
                method: 'PUT',
                headers: githubHeaders,
                body: JSON.stringify({
                    message: `Admin: East Menu Speisekarte (${menuFile}) aktualisiert`,
                    content: body.content,
                    sha: body.sha,
                }),
            });

            const data = await res.text();
            return corsResponse(data, res.status, env);
        }

        return corsResponse(JSON.stringify({ error: 'Method not allowed' }), 405, env);
    }
};

// ── CORS Helper ───────────────────────────────────────
function corsResponse(body, status, env) {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password, X-Menu-File',
    };
    return new Response(body, { status, headers });
}
