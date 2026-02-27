// ============================================
// ADMIN PANEL – NAMASTE SPEISEKARTE
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
const MENU_INLINE = { "categories": [{ "id": "vorspeisen", "name": { "de": "VORSPEISEN", "en": "STARTERS" }, "items": [{ "name": { "de": "Veggie Samosa (2 Stk.)", "en": "Veggie Samosa (2 pcs.)" }, "desc": { "de": "Knusprige Teigtaschen · Kartoffeln · Erbsen · Chutney", "en": "Crispy pastries · Potatoes · Peas · Chutney" }, "price": "6.50" }] }] };

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

    const url = `${PROXY_URL}?t=${Date.now()}`;
    const res = await fetch(url, options);
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

            // Ensure settings object exists
            if (!menuData.settings) menuData.settings = {};

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

    // Sync settings
    const merklisteToggle = document.getElementById('setting-merkliste');
    if (merklisteToggle) {
        merklisteToggle.checked = menuData.settings?.enableMerkliste === true;
        merklisteToggle.onchange = (e) => {
            if (!menuData.settings) menuData.settings = {};
            menuData.settings.enableMerkliste = e.target.checked;
            showSaveHint();
        };
    }

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
