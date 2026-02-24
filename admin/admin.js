// ============================================
// ADMIN PANEL – ALLEY 28 SPEISEKARTE
// Authentication via Cloudflare Worker Proxy
// ============================================

let menuData = null;
let currentFileSha = null;
let editingCatIdx = null;
let sessionPassword = '';

// ── Config from settings.js ──────────────────
const PROXY_URL = (typeof SETTINGS !== 'undefined' && SETTINGS.proxyUrl)
    ? SETTINGS.proxyUrl
    : null;

// ── DOM References ────────────────────────────
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const saveBtn = document.getElementById('save-btn');
const saveStatus = document.getElementById('save-status');
const logoutBtn = document.getElementById('logout-btn');
const categoriesContainer = document.getElementById('categories-container');
const addCategoryBtn = document.getElementById('add-category-btn');
const itemModal = document.getElementById('item-modal');
const itemForm = document.getElementById('item-form');
const modalTitle = document.getElementById('modal-title');
const modalCancel = document.getElementById('modal-cancel');
const catModal = document.getElementById('cat-modal');
const catForm = document.getElementById('cat-form');
const catModalCancel = document.getElementById('cat-modal-cancel');

// ── White-Label Hydration ─────────────────────
(function hydrateAdminUI() {
    if (typeof SETTINGS === 'undefined') return;
    document.querySelectorAll('[data-hydrate]').forEach(el => {
        const key = el.dataset.hydrate;
        if (SETTINGS[key]) el.textContent = SETTINGS[key];
    });
})();

// ── Authentication ────────────────────────────
// Das Passwort wird als X-Admin-Password Header an den Cloudflare Worker geschickt.
// Der Worker prüft es gegen das ADMIN_PASSWORD Cloudflare Secret.
// Bei 401 → Falsches Passwort. Kein lokal gespeichertes Passwort!

// ── Inline fallback data (used when file:// or proxy unreachable) ─────────────
const MENU_INLINE = { "categories": [{ "id": "vorspeisen", "name": { "de": "VORSPEISEN", "en": "STARTERS" }, "items": [{ "name": { "de": "Edamame", "en": "Edamame" }, "desc": { "de": "Gedämpfte Sojabohnen · Meersalz · Sesam", "en": "Steamed soybeans · Sea salt · Sesame" }, "price": "5.50" }, { "name": { "de": "Miso Suppe", "en": "Miso Soup" }, "desc": { "de": "Dashi · Tofu · Wakame · Frühlingszwiebel", "en": "Dashi · Tofu · Wakame · Spring onion" }, "price": "5.90" }, { "name": { "de": "Spring Rolls (3 Stk.)", "en": "Spring Rolls (3 pcs.)" }, "desc": { "de": "Knuspriges Gemüse · Glasnudeln · Süß-sauer Dip", "en": "Crispy vegetables · Glass noodles · Sweet & sour dip" }, "price": "8.50" }, { "name": { "de": "Garnelen Tempura (4 Stk.)", "en": "Prawn Tempura (4 pcs.)" }, "desc": { "de": "Black Tiger Garnelen · Ponzu · Wasabi-Mayo", "en": "Black Tiger prawns · Ponzu · Wasabi mayo" }, "price": "13.90" }, { "name": { "de": "Tom Kha Suppe", "en": "Tom Kha Soup" }, "desc": { "de": "Kokosmilch · Galgant · Zitronengras · Champignons", "en": "Coconut milk · Galangal · Lemongrass · Mushrooms" }, "price": "9.50" }, { "name": { "de": "Beef Tataki", "en": "Beef Tataki" }, "desc": { "de": "Kurz gebratenes Rind · Yuzu Ponzu · Microgreens", "en": "Seared beef · Yuzu ponzu · Microgreens" }, "price": "16.90" }] }, { "id": "dumplings", "name": { "de": "DIM SUM & DUMPLINGS", "en": "DIM SUM & DUMPLINGS" }, "items": [{ "name": { "de": "Guotie (6 Stk.)", "en": "Guotie (6 pcs.)" }, "desc": { "de": "Pan-fried · Schwein & Kohl · Ingwer-Soja Dip", "en": "Pan-fried · Pork & cabbage · Ginger-soy dip" }, "price": "12.90" }, { "name": { "de": "Baozi (3 Stk.)", "en": "Baozi (3 pcs.)" }, "desc": { "de": "Gedämpfte Hefeteigtaschen · Cha Siu · Hoisin", "en": "Steamed buns · Char siu · Hoisin" }, "price": "11.50" }, { "name": { "de": "Har Gow (4 Stk.)", "en": "Har Gow (4 pcs.)" }, "desc": { "de": "Garnelen-Dumplings · Zitronengras · Chili-Öl", "en": "Prawn dumplings · Lemongrass · Chili oil" }, "price": "13.50" }, { "name": { "de": "Siu Mai (4 Stk.)", "en": "Siu Mai (4 pcs.)" }, "desc": { "de": "Schwein & Garnelen · Bambussprossen · Soja", "en": "Pork & prawn · Bamboo shoots · Soy" }, "price": "12.90" }, { "name": { "de": "Veggie Dumplings (5 Stk.)", "en": "Veggie Dumplings (5 pcs.)" }, "desc": { "de": "Tofu · Shiitake · Edamame · Sesam-Soja Dip", "en": "Tofu · Shiitake · Edamame · Sesame-soy dip" }, "price": "11.50" }, { "name": { "de": "Xiao Long Bao (4 Stk.)", "en": "Xiao Long Bao (4 pcs.)" }, "desc": { "de": "Suppenknödel · Schweinebrät · Ingwer-Essig", "en": "Soup dumplings · Pork filling · Ginger vinegar" }, "price": "14.90" }] }, { "id": "bowls-ramen", "name": { "de": "BOWLS & RAMEN", "en": "BOWLS & RAMEN" }, "items": [{ "name": { "de": "Tonkotsu Ramen", "en": "Tonkotsu Ramen" }, "desc": { "de": "Schweineknochenbrühe · Chashu · Wachtelei · Nori · Bambus", "en": "Pork bone broth · Chashu · Quail egg · Nori · Bamboo" }, "price": "18.90" }, { "name": { "de": "Miso Ramen", "en": "Miso Ramen" }, "desc": { "de": "Shiro Miso Brühe · Tofu · Mais · Wakame · Frühlingszwiebel", "en": "Shiro miso broth · Tofu · Corn · Wakame · Spring onion" }, "price": "17.50" }, { "name": { "de": "Spicy Tantanmen", "en": "Spicy Tantanmen" }, "desc": { "de": "Sesambrühe · Schweinhack · Chili · Tahini · Ramen-Ei", "en": "Sesame broth · Pork mince · Chili · Tahini · Ramen egg" }, "price": "19.50" }, { "name": { "de": "Alley 28 Signature Bowl", "en": "Alley 28 Signature Bowl" }, "desc": { "de": "Reis · Beef Bulgogi · Kimchi · Gurke · Sesam-Dressing", "en": "Rice · Beef bulgogi · Kimchi · Cucumber · Sesame dressing" }, "price": "21.90" }, { "name": { "de": "Chicken Teriyaki Bowl", "en": "Chicken Teriyaki Bowl" }, "desc": { "de": "Japanischer Reis · Gegrilltes Hähnchen · Teriyaki · Edamame", "en": "Japanese rice · Grilled chicken · Teriyaki · Edamame" }, "price": "18.90" }, { "name": { "de": "Veggie Buddha Bowl", "en": "Veggie Buddha Bowl" }, "desc": { "de": "Quinoa-Reis · Avocado · Karotte · Tofu · Miso-Tahini", "en": "Quinoa rice · Avocado · Carrot · Tofu · Miso tahini" }, "price": "16.90" }] }, { "id": "wok", "name": { "de": "WOK GERICHTE", "en": "WOK DISHES" }, "items": [{ "name": { "de": "Pad Thai Klassik", "en": "Pad Thai Classic" }, "desc": { "de": "Reisnudeln · Garnelen · Erdnüsse · Tamarinde · Limette", "en": "Rice noodles · Prawns · Peanuts · Tamarind · Lime" }, "price": "17.50" }, { "name": { "de": "Rindfleisch mit Austernsauce", "en": "Beef with Oyster Sauce" }, "desc": { "de": "Streifen · Chinakohl · Shiitake · Ingwer · Jasminreis", "en": "Strips · Chinese cabbage · Shiitake · Ginger · Jasmine rice" }, "price": "22.90" }, { "name": { "de": "Gebratener Reis Spezial", "en": "Fried Rice Special" }, "desc": { "de": "Ei · Gemüse · Krabben · Soja · Frühlingszwiebel", "en": "Egg · Vegetables · Crab · Soy · Spring onion" }, "price": "15.90" }, { "name": { "de": "Kung Pao Hühnchen", "en": "Kung Pao Chicken" }, "desc": { "de": "Zucchini · Paprika · Erdnüsse · Sichuan-Pfeffer", "en": "Zucchini · Bell pepper · Peanuts · Sichuan pepper" }, "price": "19.90" }, { "name": { "de": "Garnelen Thai Green Curry", "en": "Prawn Thai Green Curry" }, "desc": { "de": "Kokosmilch · Thai-Basilikum · Aubergine · Jasminreis", "en": "Coconut milk · Thai basil · Aubergine · Jasmine rice" }, "price": "23.50" }, { "name": { "de": "Glasnudeln mit Gemüse", "en": "Glass Noodles with Vegetables" }, "desc": { "de": "Tofu · Shiitake · Paprika · Sojasprossen · Sesam", "en": "Tofu · Shiitake · Bell pepper · Bean sprouts · Sesame" }, "price": "15.50" }] }, { "id": "sushi", "name": { "de": "SUSHI", "en": "SUSHI" }, "items": [{ "name": { "de": "Sake Nigiri (2 Stk.)", "en": "Sake Nigiri (2 pcs.)" }, "desc": { "de": "Lachs · Sushi-Reis · Wasabi", "en": "Salmon · Sushi rice · Wasabi" }, "price": "7.50" }, { "name": { "de": "Ebi Nigiri (2 Stk.)", "en": "Ebi Nigiri (2 pcs.)" }, "desc": { "de": "Garnelen · Sushi-Reis · Wasabi", "en": "Prawn · Sushi rice · Wasabi" }, "price": "7.90" }, { "name": { "de": "Alley Roll (8 Stk.)", "en": "Alley Roll (8 pcs.)" }, "desc": { "de": "Lachs · Avocado · Cream Cheese · Sesam · Teriyaki", "en": "Salmon · Avocado · Cream cheese · Sesame · Teriyaki" }, "price": "16.90" }, { "name": { "de": "Spicy Tuna Roll (8 Stk.)", "en": "Spicy Tuna Roll (8 pcs.)" }, "desc": { "de": "Thunfisch · Chili-Mayo · Gurke · Sesam", "en": "Tuna · Chili mayo · Cucumber · Sesame" }, "price": "15.90" }, { "name": { "de": "Veggie Maki (8 Stk.)", "en": "Veggie Maki (8 pcs.)" }, "desc": { "de": "Avocado · Gurke · Karotte · Sesam", "en": "Avocado · Cucumber · Carrot · Sesame" }, "price": "11.50" }, { "name": { "de": "Omakase Platte (18 Stk.)", "en": "Omakase Plate (18 pcs.)" }, "desc": { "de": "Chef's Auswahl – Nigiri & Maki Mix", "en": "Chef's selection – Nigiri & Maki mix" }, "price": "38.00" }] }, { "id": "vegetarisch", "name": { "de": "VEGETARISCH & VEGAN", "en": "VEGETARIAN & VEGAN" }, "items": [{ "name": { "de": "Agedashi Tofu", "en": "Agedashi Tofu" }, "desc": { "de": "Frittierter Tofu · Dashi · Daikon · Katsuobushi", "en": "Fried tofu · Dashi · Daikon · Bonito flakes" }, "price": "12.90" }, { "name": { "de": "Mapo Tofu", "en": "Mapo Tofu" }, "desc": { "de": "Seidentofu · Sichuan · Chili-Öl · Jasminreis", "en": "Silken tofu · Sichuan · Chili oil · Jasmine rice" }, "price": "14.50" }, { "name": { "de": "Gemüse Tempura", "en": "Vegetable Tempura" }, "desc": { "de": "Süßkartoffel · Zucchini · Shiso · Tsuyu-Dip", "en": "Sweet potato · Zucchini · Shiso · Tsuyu dip" }, "price": "13.90" }, { "name": { "de": "Avocado-Mango Salat", "en": "Avocado-Mango Salad" }, "desc": { "de": "Avocado · Mango · Sesam · Yuzu Vinaigrette · Koriander", "en": "Avocado · Mango · Sesame · Yuzu vinaigrette · Coriander" }, "price": "12.50" }] }, { "id": "beilagen", "name": { "de": "BEILAGEN", "en": "SIDES" }, "items": [{ "name": { "de": "Jasminreis", "en": "Jasmine Rice" }, "price": "3.50" }, { "name": { "de": "Gebratener Reis", "en": "Fried Rice" }, "price": "4.50" }, { "name": { "de": "Sesam-Wokgemüse", "en": "Sesame Wok Vegetables" }, "price": "5.50" }, { "name": { "de": "Kimchi", "en": "Kimchi" }, "desc": { "de": "Hausgemacht · scharf", "en": "Homemade · spicy" }, "price": "4.00" }, { "name": { "de": "Edamame", "en": "Edamame" }, "price": "5.50" }, { "name": { "de": "Ramen-Ei", "en": "Ramen Egg" }, "desc": { "de": "Sous-vide · Soja mariniert", "en": "Sous-vide · Soy marinated" }, "price": "2.50" }] }, { "id": "desserts", "name": { "de": "DESSERTS", "en": "DESSERTS" }, "items": [{ "name": { "de": "Matcha Tiramisu", "en": "Matcha Tiramisu" }, "desc": { "de": "Japanischer Matcha · Mascarpone · Biskuit", "en": "Japanese matcha · Mascarpone · Biscuit" }, "price": "8.50" }, { "name": { "de": "Mango Sticky Rice", "en": "Mango Sticky Rice" }, "desc": { "de": "Klebreis · Frische Mango · Kokosmilch · Sesam", "en": "Glutinous rice · Fresh mango · Coconut milk · Sesame" }, "price": "7.90" }, { "name": { "de": "Schwarzes Sesam Eis", "en": "Black Sesame Ice Cream" }, "desc": { "de": "Hausgemacht · Sesam-Pralinée · Mochi", "en": "Homemade · Sesame praline · Mochi" }, "price": "7.50" }, { "name": { "de": "Dorayaki", "en": "Dorayaki" }, "desc": { "de": "Japanische Pfannkuchen · Anko-Füllung · Sahne", "en": "Japanese pancakes · Anko filling · Cream" }, "price": "6.90" }] }, { "id": "getraenke", "name": { "de": "GETRÄNKE", "en": "DRINKS" }, "items": [{ "name": { "de": "Jasmin-Tee (Kanne)", "en": "Jasmine Tea (Pot)" }, "desc": { "de": "Bio · Heiß oder kalt", "en": "Organic · Hot or cold" }, "price": "4.50" }, { "name": { "de": "Matcha Latte", "en": "Matcha Latte" }, "desc": { "de": "Ceremonial Grade · Oat Milk", "en": "Ceremonial grade · Oat milk" }, "price": "5.90" }, { "name": { "de": "Yuzu Lemonade", "en": "Yuzu Lemonade" }, "desc": { "de": "Frischer Yuzu · Ingwer · Sprudelwasser", "en": "Fresh yuzu · Ginger · Sparkling water" }, "price": "5.50" }, { "name": { "de": "Lychee Soda", "en": "Lychee Soda" }, "desc": { "de": "Lychee Sirup · Zitrone · Minze", "en": "Lychee syrup · Lemon · Mint" }, "price": "4.90" }, { "name": { "de": "Asahi Bier 0,33l", "en": "Asahi Beer 0.33l" }, "price": "4.90" }, { "name": { "de": "Sake – Junmai Ginjo 0,18l", "en": "Sake – Junmai Ginjo 0.18l" }, "desc": { "de": "Warm oder kalt", "en": "Warm or cold" }, "price": "7.90" }, { "name": { "de": "Mineralwasser 0,5l", "en": "Mineral Water 0.5l" }, "desc": { "de": "Still oder prickelnd", "en": "Still or sparkling" }, "price": "3.50" }, { "name": { "de": "Softdrinks 0,5l", "en": "Soft Drinks 0.5l" }, "desc": { "de": "Cola · Zero · Fanta · Orange", "en": "Cola · Zero · Fanta · Orange" }, "price": "3.90" }] }] };

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw = document.getElementById('password').value;
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    loginError.classList.add('hidden');

    sessionPassword = pw;

    try {
        await loadMenu();
        loginScreen.classList.remove('active');
        dashboardScreen.classList.add('active');
    } catch (err) {
        sessionPassword = '';
        if (err.message.includes('401')) {
            loginError.textContent = 'Falsches Passwort!';
        } else {
            loginError.textContent = 'Fehler: ' + err.message;
        }
        loginError.classList.remove('hidden');
        document.getElementById('password').value = '';
    } finally {
        submitBtn.disabled = false;
    }
});

logoutBtn.addEventListener('click', () => {
    dashboardScreen.classList.remove('active');
    loginScreen.classList.add('active');
    document.getElementById('password').value = '';
    sessionPassword = '';
    menuData = null;
    currentFileSha = null;
    categoriesContainer.innerHTML = '';
});

// ── Proxy Request ─────────────────────────────
async function proxyRequest(method, body = null) {
    if (!PROXY_URL) throw new Error('Kein Proxy konfiguriert.');
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Password': sessionPassword,
            'X-Menu-File': 'menu.json',
        },
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(PROXY_URL, options);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`${res.status}: ${err.error || 'Request fehlgeschlagen'}`);
    }
    return res.json();
}

// ── Load Menu ─────────────────────────────────
async function loadMenu() {
    categoriesContainer.innerHTML = '<p style="padding:3rem;text-align:center;color:rgba(255,255,255,0.3);">Lade Speisekarte…</p>';

    const isLocal = location.protocol === 'file:';

    // ── Lokal (file://) → direkt inline Daten, kein fetch nötig ──
    if (isLocal) {
        menuData = JSON.parse(JSON.stringify(MENU_INLINE)); // deep copy
        currentFileSha = null;
        categoriesContainer.innerHTML = '';
        showConfigNotice('Lokaler Modus (file://) – Änderungen werden als Download gespeichert. Für Live-Speichern: auf Server hosten.');
        renderDashboard();
        return;
    }

    // ── Online: Cloudflare Worker Proxy ──────────────────────
    if (PROXY_URL) {
        try {
            const fileData = await proxyRequest('GET');
            currentFileSha = fileData.sha;
            const decoded = decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, ''))));
            menuData = JSON.parse(decoded);
            categoriesContainer.innerHTML = '';
            renderDashboard();
            return;
        } catch (err) {
            // 401 = falsches Passwort → nach oben weiterwerfen
            if (err.message.startsWith('401:')) throw err;
            // Andere Fehler → Fallback
            console.warn('Proxy-Fehler, Fallback auf inline Daten:', err.message);
            menuData = JSON.parse(JSON.stringify(MENU_INLINE));
            currentFileSha = null;
            categoriesContainer.innerHTML = '';
            showConfigNotice('Proxy nicht erreichbar – inline Daten geladen. (' + err.message + ')');
            renderDashboard();
            return;
        }
    }

    // ── Kein Proxy konfiguriert → inline Daten ───────────────
    menuData = JSON.parse(JSON.stringify(MENU_INLINE));
    currentFileSha = null;
    categoriesContainer.innerHTML = '';
    showConfigNotice('Kein Proxy konfiguriert – inline Daten geladen.');
    renderDashboard();
}

function showConfigNotice(msg = '') {
    const notice = document.createElement('div');
    notice.className = 'config-notice';
    notice.innerHTML = `⚠️ <strong>Lokaler Modus:</strong> ${msg} Änderungen werden als Download gespeichert (nicht live).`;
    categoriesContainer.appendChild(notice);
}

// ── Render Dashboard ──────────────────────────
function renderDashboard() {
    const notice = categoriesContainer.querySelector('.config-notice');
    categoriesContainer.innerHTML = '';
    if (notice) categoriesContainer.appendChild(notice);

    menuData.categories.forEach((cat, catIdx) => {
        const block = document.createElement('div');
        block.className = 'category-block';
        const catName = cat.name['de'] || 'Unbenannte Kategorie';
        const numStr = String(catIdx + 1).padStart(2, '0');

        block.innerHTML = `
            <div class="category-header">
                <div class="cat-label">
                    <span class="cat-num">${numStr}</span>
                    <span class="category-name">${catName}</span>
                </div>
                <div class="category-actions">
                    <button class="btn btn-ghost btn-sm edit-cat-btn" data-cat-idx="${catIdx}" title="Umbenennen">✏️</button>
                    <button class="btn btn-ghost btn-sm delete-cat-btn" data-cat-idx="${catIdx}" title="Löschen">🗑</button>
                </div>
            </div>
            <div class="item-list">
                ${cat.items.map((item, itemIdx) => renderItemRow(item, catIdx, itemIdx)).join('')}
            </div>
            <div class="add-item-wrap">
                <button class="btn btn-secondary add-item-btn" data-cat-idx="${catIdx}">+ Gericht hinzufügen</button>
            </div>
        `;
        categoriesContainer.appendChild(block);
    });

    document.querySelectorAll('.add-item-btn').forEach(btn =>
        btn.onclick = () => openItemModal(parseInt(btn.dataset.catIdx)));
    document.querySelectorAll('.edit-item-btn').forEach(btn =>
        btn.onclick = () => openItemModal(parseInt(btn.dataset.catIdx), parseInt(btn.dataset.itemIdx)));
    document.querySelectorAll('.delete-item-btn').forEach(btn =>
        btn.onclick = () => deleteItem(parseInt(btn.dataset.catIdx), parseInt(btn.dataset.itemIdx)));
    document.querySelectorAll('.delete-cat-btn').forEach(btn =>
        btn.onclick = () => deleteCategory(parseInt(btn.dataset.catIdx)));
    document.querySelectorAll('.edit-cat-btn').forEach(btn =>
        btn.onclick = () => openCatModal(parseInt(btn.dataset.catIdx)));
}

function renderItemRow(item, catIdx, itemIdx) {
    const name = item.name['de'] || 'N/A';
    const soldOut = item.isSoldOut === true;
    const spiciness = parseInt(item.spiciness) || 0;
    const chilis = spiciness > 0 ? '🌶'.repeat(spiciness) : '';
    return `
        <div class="item-row ${soldOut ? 'is-unavailable' : ''}">
            <div class="item-info">
                <div class="item-row-name">${name} ${chilis} ${soldOut ? '<span class="badge-aus">AUSVERKAUFT</span>' : ''}</div>
                <div class="item-row-desc">${item.desc?.de || ''}</div>
            </div>
            <div class="item-row-price">€ ${item.price}</div>
            <div class="item-actions">
                <button class="btn-icon edit-item-btn" data-cat-idx="${catIdx}" data-item-idx="${itemIdx}" title="Bearbeiten">✏️</button>
                <button class="btn-icon delete-item-btn" data-cat-idx="${catIdx}" data-item-idx="${itemIdx}" title="Löschen">🗑</button>
            </div>
        </div>`;
}

// ── Item Modal ────────────────────────────────
function openItemModal(catIdx, itemIdx = null) {
    document.getElementById('item-cat-id').value = catIdx;
    document.getElementById('item-index').value = itemIdx !== null ? itemIdx : '';
    itemForm.reset();
    document.getElementById('item-vegan').checked = false;
    document.querySelectorAll('input[name="allergen"]').forEach(cb => cb.checked = false);

    if (itemIdx !== null) {
        const item = menuData.categories[catIdx].items[itemIdx];
        modalTitle.textContent = 'Gericht bearbeiten';
        document.getElementById('item-name-de').value = item.name?.de || '';
        document.getElementById('item-name-en').value = item.name?.en || '';
        document.getElementById('item-price').value = item.price || '';
        document.getElementById('item-available').checked = item.isSoldOut === true;
        document.getElementById('item-vegan').checked = item.isVegan === true;
        document.getElementById('item-desc-de').value = item.desc?.de || '';
        document.getElementById('item-desc-en').value = item.desc?.en || '';
        document.getElementById('item-spiciness').value = item.spiciness || '';

        // Allergens
        const allergens = item.allergens || [];
        document.querySelectorAll('input[name="allergen"]').forEach(cb => {
            cb.checked = allergens.includes(cb.value);
        });
    } else {
        modalTitle.textContent = 'Gericht hinzufügen';
    }
    itemModal.classList.remove('hidden');
}

modalCancel.onclick = () => itemModal.classList.add('hidden');
itemModal.addEventListener('click', e => { if (e.target === itemModal) itemModal.classList.add('hidden'); });

itemForm.onsubmit = (e) => {
    e.preventDefault();
    const catIdx = parseInt(document.getElementById('item-cat-id').value);
    const rawIdx = document.getElementById('item-index').value;
    const itemIdx = rawIdx !== '' ? parseInt(rawIdx) : null;

    const newItem = {
        name: {
            de: document.getElementById('item-name-de').value.trim(),
            en: document.getElementById('item-name-en').value.trim()
        },
        price: document.getElementById('item-price').value.trim(),
        isSoldOut: document.getElementById('item-available').checked,
        isVegan: document.getElementById('item-vegan').checked,
        spiciness: document.getElementById('item-spiciness').value,
        allergens: Array.from(document.querySelectorAll('input[name="allergen"]:checked')).map(cb => cb.value)
    };

    const descDe = document.getElementById('item-desc-de').value.trim();
    const descEn = document.getElementById('item-desc-en').value.trim();
    if (descDe || descEn) newItem.desc = { de: descDe, en: descEn };

    if (itemIdx !== null) {
        menuData.categories[catIdx].items[itemIdx] = newItem;
    } else {
        menuData.categories[catIdx].items.push(newItem);
    }

    itemModal.classList.add('hidden');
    renderDashboard();
    showSaveHint();
};

function deleteItem(catIdx, itemIdx) {
    if (confirm('Gericht wirklich löschen?')) {
        menuData.categories[catIdx].items.splice(itemIdx, 1);
        renderDashboard();
        showSaveHint();
    }
}

// ── Category Modal ─────────────────────────────
function openCatModal(catIdx = null) {
    editingCatIdx = catIdx;
    catForm.reset();
    if (catIdx !== null) {
        document.getElementById('cat-name-de').value = menuData.categories[catIdx].name?.de || '';
        document.getElementById('cat-name-en').value = menuData.categories[catIdx].name?.en || '';
    }
    catModal.classList.remove('hidden');
}

addCategoryBtn.onclick = () => openCatModal();
catModalCancel.onclick = () => catModal.classList.add('hidden');
catModal.addEventListener('click', e => { if (e.target === catModal) catModal.classList.add('hidden'); });

catForm.onsubmit = (e) => {
    e.preventDefault();
    const name = {
        de: document.getElementById('cat-name-de').value.trim(),
        en: document.getElementById('cat-name-en').value.trim()
    };

    if (editingCatIdx !== null) {
        menuData.categories[editingCatIdx].name = name;
    } else {
        const id = name.de.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        menuData.categories.push({ id, name, items: [] });
    }
    catModal.classList.add('hidden');
    renderDashboard();
    showSaveHint();
};

function deleteCategory(catIdx) {
    const catName = menuData.categories[catIdx]?.name?.de || 'Kategorie';
    if (confirm(`"${catName}" wirklich löschen? Alle Gerichte werden entfernt.`)) {
        menuData.categories.splice(catIdx, 1);
        renderDashboard();
        showSaveHint();
    }
}

// ── Save ───────────────────────────────────────
function showSaveHint() {
    saveStatus.textContent = '● Ungespeicherte Änderungen';
    saveStatus.style.color = '#e2b04d';
}

saveBtn.onclick = async () => {
    const jsonStr = JSON.stringify(menuData, null, 2);

    // 1. Mit Proxy + SHA → direkt auf GitHub speichern
    if (PROXY_URL && currentFileSha) {
        saveBtn.disabled = true;
        saveStatus.textContent = 'Speichern…';
        saveStatus.style.color = 'var(--text-muted)';
        try {
            const content = btoa(unescape(encodeURIComponent(jsonStr)));
            const res = await proxyRequest('POST', { content, sha: currentFileSha });
            currentFileSha = res.content?.sha || currentFileSha;
            saveStatus.textContent = '✓ Live gespeichert (in ~30s aktuell)';
            saveStatus.style.color = '#5cb85c';
        } catch (err) {
            saveStatus.textContent = '❌ Fehler: ' + err.message;
            saveStatus.style.color = '#e53e3e';
        } finally {
            saveBtn.disabled = false;
            setTimeout(() => { saveStatus.textContent = ''; }, 5000);
        }
        return;
    }

    // 2. Kein Proxy / kein SHA → Download-Fallback
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'menu.json';
    a.click();
    URL.revokeObjectURL(url);
    saveStatus.textContent = '✓ Als Datei heruntergeladen – im Projektordner ersetzen!';
    saveStatus.style.color = '#5cb85c';
    setTimeout(() => { saveStatus.textContent = ''; }, 6000);
};
