import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =============================================================
// MIDGARD BARTER LEDGER — script.js
// =============================================================

// --- SUPABASE CONFIG ---
const SUPABASE_URL = 'https://iostylnrwoytrbygqbzv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvc3R5bG5yd295dHJieWdxYnp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NjYxMTAsImV4cCI6MjA5ODM0MjExMH0.p08MmcHwREicm_k7mA6ZzAL4e1nx0KW5wdaVM_01QOA';
const EDGE_FUNCTION_URL = 'https://iostylnrwoytrbygqbzv.supabase.co/functions/v1/admin-actions';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// NOTE: There is intentionally no client-side admin password anymore.
// Admin access is gated by Supabase Auth (email/password sign-in) and the
// Edge Function verifies the user's session token + role server-side before
// performing any privileged action. Nothing secret lives in this file.

// --- CONSTANTS ---
const ARMOR_WEIGHTING = { 'Full Set': 1.00, 'Head': 0.20, 'Chest': 0.30, 'Pants': 0.22, 'Boots': 0.28 };
const UPGRADE_LIMITS  = { 'G': 3, 'B': 3, 'P': 5, 'L': 10, 'N': 0 };
const SIDES = ['your', 'their'];
const SIDE_LABEL = { your: 'Your', their: 'Their' };

// --- STATE ---
let ITEM_DATABASE   = {};
let currentServerId = null;

// rows.your / rows.their: unlimited-length arrays of row objects:
// { id, name, quantity, level, isBroken, armorPiece, customPrice, priceTouched }
let rows    = { your: [], their: [] };
let rowSeq  = { your: 0,  their: 0 };

// last computed totals, kept around for the copy-trade text builder
let totals = {
    yourBook: 0, yourCustom: 0,
    theirBook: 0, theirCustom: 0
};

// =============================================================
// SUPABASE HELPERS (public read-only)
// =============================================================

async function supabaseFetch(endpoint) {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
        return res.json();
    } catch (err) {
        console.error('supabaseFetch failed:', err);
        return [];
    }
}

async function supabaseInsert(table, data) {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(data)
        });
        return res.ok;
    } catch (err) {
        console.error('supabaseInsert failed:', err);
        return false;
    }
}

// =============================================================
// SECURE ADMIN ACTIONS (via Edge Function — auth required)
// =============================================================

async function callAdminAction(action, payload) {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            alert('You must be logged in.');
            return false;
        }
        const res = await fetch(EDGE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action, payload })
        });
        const data = await res.json();
        if (!res.ok) {
            console.error('Admin action failed:', data.error);
            alert(data.error || 'Action failed.');
            return false;
        }
        return true;
    } catch (err) {
        console.error('callAdminAction failed:', err);
        return false;
    }
}

async function adminLogin() {
    const email    = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPasswordInput').value;
    const statusEl = document.getElementById('adminLoginStatus');

    statusEl.textContent = '';

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        statusEl.textContent = error.message;
        statusEl.className   = 'text-red-400 text-sm mb-3';
        return;
    }

    closeAdminLoginModal();
    document.getElementById('adminModal').classList.remove('hidden');
    await loadAdminPanel();
}

async function adminLogout() {
    await supabaseClient.auth.signOut();
    closeAdminModal();
}

function openAdminLoginModal() {
    document.getElementById('adminLoginModal').classList.remove('hidden');
}

function closeAdminLoginModal() {
    document.getElementById('adminLoginModal').classList.add('hidden');
    document.getElementById('adminLoginStatus').textContent = '';
    document.getElementById('adminEmail').value = '';
    document.getElementById('adminPasswordInput').value = '';
}

function closeAdminModal() {
    document.getElementById('adminModal').classList.add('hidden');
}

async function loadAdminPanel() {
    const contentEl = document.getElementById('adminPanelContent');
    contentEl.innerHTML = 'Loading...';

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        contentEl.innerHTML = '<p class="text-red-400">Not logged in.</p>';
        return;
    }

    const suggestions = await supabaseFetch('suggestions?select=*&order=created_at.desc');

    if (!suggestions.length) {
        contentEl.innerHTML = '<p class="text-gray-400">No pending suggestions.</p>';
        return;
    }

    // Group suggestions by normalized item name (case-insensitive, trimmed)
    const groups = {};
    suggestions.forEach(s => {
        const key = s.item_name.trim().toLowerCase();
        if (!groups[key]) groups[key] = { displayName: s.item_name.trim(), items: [] };
        groups[key].items.push(s);
    });

    contentEl.innerHTML = Object.values(groups).map(group => {
        const itemName = group.displayName;
        const exists   = !!getItemData(itemName);
        const safeId   = itemName.replace(/[^a-zA-Z0-9]/g, '');
        const prices   = group.items.map(s => Number(s.suggested_price));
        const avg      = prices.reduce((a, b) => a + b, 0) / prices.length;

        const newItemFields = exists ? '' : `
            <div class="grid grid-cols-2 gap-2 mt-2">
                <select id="newCat-${safeId}" class="bg-gray-700 border border-gray-600 rounded-md p-1 text-xs">
                    <option value="W">Weapon</option>
                    <option value="A">Armor</option>
                    <option value="P">Piece</option>
                    <option value="F">Food</option>
                    <option value="G">General</option>
                </select>
                <select id="newRar-${safeId}" class="bg-gray-700 border border-gray-600 rounded-md p-1 text-xs">
                    <option value="G">Green</option>
                    <option value="B">Blue</option>
                    <option value="P">Purple</option>
                    <option value="L">Legendary</option>
                    <option value="N">N/A</option>
                </select>
            </div>`;

        const rowsHtml = group.items.map(s => {
            const safeRowName = s.item_name.replace(/'/g, "\\'");
            return `
            <div class="flex justify-between items-start py-2 ${group.items.length > 1 ? 'border-t border-gray-800' : ''}">
                <div>
                    <p class="text-sm text-gray-200">${formatLS(s.suggested_price)}${exists ? '' : ' (new item)'}</p>
                    ${s.reason ? `<p class="text-xs text-gray-500 mt-1">"${s.reason.replace(/</g, '&lt;')}"</p>` : ''}
                    <p class="text-[10px] text-gray-600 mt-0.5">${new Date(s.created_at).toLocaleString()}</p>
                </div>
                <div class="flex gap-2 shrink-0">
                    <button class="px-3 py-1 bg-green-700 hover:bg-green-600 rounded-md text-xs"
                        onclick="${exists ? `approvePrice('${safeRowName}', ${s.suggested_price})` : `addNewItem('${safeRowName}', ${s.suggested_price})`}">
                        ${exists ? 'Approve' : 'Add Item'}
                    </button>
                    <button class="px-3 py-1 bg-red-700 hover:bg-red-600 rounded-md text-xs"
                        onclick="rejectSuggestions('${safeRowName}')">Reject</button>
                </div>
            </div>`;
        }).join('');

        return `
        <div class="p-3 bg-gray-900 rounded-lg border border-gray-700">
            <div class="flex justify-between items-center">
                <p class="font-semibold text-amber-400">${itemName}</p>
                ${group.items.length > 1
                    ? `<span class="text-xs text-gray-500">${group.items.length} suggestions &middot; avg ${formatLS(avg)}</span>`
                    : ''}
            </div>
            ${rowsHtml}
            ${newItemFields}
        </div>`;
    }).join('');
}

async function approvePrice(itemName, newPrice) {
    const ok = await callAdminAction('approvePrice', {
        itemName, newPrice, serverId: currentServerId
    });
    if (ok) {
        await loadItems();
        await loadAdminPanel();
    }
}

async function rejectSuggestions(itemName) {
    const ok = await callAdminAction('rejectSuggestions', { itemName });
    if (ok) await loadAdminPanel();
}

async function addNewItem(itemName, price) {
    const safeId   = itemName.replace(/[^a-zA-Z0-9]/g, '');
    const category = document.getElementById(`newCat-${safeId}`).value;
    const rarity   = document.getElementById(`newRar-${safeId}`).value;

    const ok = await callAdminAction('addNewItem', {
        itemName, price, category, rarity, serverId: currentServerId
    });

    if (ok) {
        await loadItems();
        await loadAdminPanel();
    } else {
        alert('Failed to add item — it may already exist.');
    }
}

// =============================================================
// DATA LOADING
// =============================================================

async function loadServers() {
    const servers  = await supabaseFetch('servers?select=*&order=name');
    const selector = document.getElementById('serverSelector');

    if (!servers.length) {
        selector.innerHTML = '<option>No servers found</option>';
        return;
    }

    selector.innerHTML = servers.map(s =>
        `<option value="${s.id}">${s.name}</option>`
    ).join('');

    currentServerId = servers[0].id;
    await loadItems();

    selector.addEventListener('change', async (e) => {
        currentServerId = e.target.value;
        showLoading(true);
        await loadItems();
        resetTradeBuilder();
        showLoading(false);
    });
}

async function loadItems() {
    const items = await supabaseFetch(
        `items?select=*&server_id=eq.${currentServerId}&order=name`
    );
    ITEM_DATABASE = {};
    items.forEach(item => {
        ITEM_DATABASE[item.name] = {
            price:        Number(item.price),
            category:     item.category,
            rarity:       item.rarity,
            isGear:       ['W', 'A', 'P'].includes(item.category),
            isArmorSet:   item.category === 'A',
            isConsumable: ['F', 'G'].includes(item.category)
        };
    });
    populateAboutSection();
}

function populateAboutSection() {
    const el = document.getElementById('itemListDisplay');
    if (!el) return;

    const byCategory = {};
    Object.entries(ITEM_DATABASE).forEach(([name, data]) => {
        if (!byCategory[data.category]) byCategory[data.category] = [];
        byCategory[data.category].push({ name, ...data });
    });

    const labels = { W: 'Weapons', A: 'Armor', P: 'Pieces', F: 'Food', G: 'General' };

    el.innerHTML = Object.entries(byCategory).map(([cat, items]) => `
        <div>
            <h3 class="text-lg font-bold text-amber-400 mb-2">${labels[cat] || cat}</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                ${items.sort((a, b) => a.name.localeCompare(b.name)).map(i => `
                    <div class="flex justify-between bg-gray-900 px-2 py-1 rounded text-xs">
                        <span>${i.name}</span>
                        <span class="text-gray-400">${formatLS(i.price)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// =============================================================
// UTILITIES
// =============================================================

function formatLS(value) {
    const n = Number(value);
    return isNaN(n) ? '0.00 LS' : n.toFixed(2) + ' LS';
}

function getRarityColor(rarity) {
    const map = {
        'G': 'var(--color-gear-green)',
        'B': 'var(--color-gear-blue)',
        'P': 'var(--color-gear-purple)',
        'L': 'var(--color-gear-legendary)'
    };
    return map[rarity] || 'var(--color-text-medium)';
}

function getItemData(itemName) {
    return ITEM_DATABASE[(itemName || '').trim()] || null;
}

function showLoading(show) {
    document.getElementById('loadingOverlay').classList.toggle('hidden', !show);
}

function calculateItemLS(itemName, quantity, level, isBroken, armorPiece) {
    const item = getItemData(itemName);
    if (!item || !Number.isFinite(item.price) || item.price < 0 || quantity <= 0) return 0;

    let baseLS = item.price;
    if (item.isArmorSet && armorPiece && armorPiece !== 'Full Set') {
        baseLS *= ARMOR_WEIGHTING[armorPiece] || 1.0;
    }
    if (item.isGear) {
        const upgradeMult = 1 + (level * (item.rarity === 'L' ? 0.15 : 0.10));
        const brokenMult  = isBroken ? 0.5 : 1.0;
        return baseLS * brokenMult * upgradeMult * quantity;
    }
    return baseLS * quantity;
}

// =============================================================
// TRADE BUILDER — generic row engine, shared by 'your' and 'their'
// ---------------------------------------------------------------
// Each side is an unlimited list of rows. Every row carries both
// its computed book value (from the price database + gear state)
// and an independently editable "price" — what's actually being
// negotiated for that item. The price auto-follows book value
// until the person edits it directly, at which point it's marked
// "touched" and stops auto-syncing (until reset).
// =============================================================

function createRowHTML(side, row) {
    const id = row.id;
    return `
    <div id="${side}Row-${id}" class="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
        <div class="flex flex-col sm:flex-row gap-3 sm:items-start">
            <div class="flex-1 relative">
                <label class="block text-xs font-medium mb-1 text-gray-400">Item</label>
                <input type="text" id="${side}Search-${id}" placeholder="Search for item..." autocomplete="off"
                    class="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm">
                <div id="${side}SearchResults-${id}" class="max-h-40 overflow-y-auto custom-scrollbar bg-gray-700 rounded-md mt-1 hidden absolute w-full z-10"></div>
                <div class="text-sm font-semibold mt-2">
                    <span id="${side}ItemNameDisplay-${id}" class="text-gray-200">No item selected</span>
                </div>
            </div>
            <div class="w-full sm:w-24 shrink-0">
                <label class="block text-xs font-medium mb-1 text-gray-400">Qty</label>
                <input type="number" id="${side}Quantity-${id}" min="1" value="1"
                    class="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-sm text-center">
            </div>
            <div class="w-full sm:w-32 shrink-0 text-left sm:text-right">
                <label class="block text-xs font-medium mb-1 text-gray-400">Book Value</label>
                <span id="${side}BookLS-${id}" class="font-bold text-gray-300 text-sm block py-2">0.00 LS</span>
            </div>
            <div class="w-full sm:w-36 shrink-0">
                <label class="flex items-center justify-between text-xs font-medium mb-1 text-gray-400">
                    <span>Price</span>
                    <button type="button" data-side="${side}" data-id="${id}" class="reset-price-btn text-amber-500 hover:text-amber-400 text-[10px] underline">reset</button>
                </label>
                <input type="number" id="${side}Price-${id}" min="0" step="0.01" value="0"
                    class="w-full p-2 bg-gray-700 border border-amber-700/50 rounded-md text-sm text-center font-bold text-amber-300">
            </div>
            <button data-side="${side}" data-id="${id}" class="remove-row-btn text-red-500 hover:text-red-400 text-sm font-bold shrink-0 sm:pt-6">
                Remove
            </button>
        </div>

        <div id="${side}GearControls-${id}" class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-800 hidden">
            <div class="flex justify-between items-center text-sm font-medium sm:col-span-2">
                <span class="text-gray-400">Base LS:</span>
                <span id="${side}BaseLSDisplay-${id}" class="font-bold">0</span>
            </div>
            <div>
                <label for="${side}UpgradeLevel-${id}" class="block text-xs font-medium text-gray-400">
                    Upgrade Level (<span id="${side}LevelLabel-${id}">+0</span>)
                </label>
                <input type="range" id="${side}UpgradeLevel-${id}" min="0" max="0" value="0"
                    class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg">
            </div>
            <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-400">Broken</span>
                <label class="broken-toggle-switch">
                    <input type="checkbox" id="${side}BrokenToggle-${id}">
                    <span class="broken-slider"></span>
                </label>
            </div>
            <div id="${side}ArmorSelector-${id}" class="hidden sm:col-span-2">
                <label class="block text-xs font-medium mb-2 text-gray-400">Select Armor Piece</label>
                <div class="${side}-piece-button-group grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    <button data-piece="Full Set" class="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition">Full Set</button>
                    <button data-piece="Head" class="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition">Head (20%)</button>
                    <button data-piece="Chest" class="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition">Chest (30%)</button>
                    <button data-piece="Pants" class="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition">Pants (22%)</button>
                    <button data-piece="Boots" class="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition">Boots (28%)</button>
                </div>
            </div>
        </div>
    </div>`;
}

function renderRows(side) {
    const container = document.getElementById(`${side}Rows`);
    if (!rows[side].length) {
        container.innerHTML = `<p class="text-gray-500 text-sm text-center py-6">No items yet — click "+ Add Item" to start listing ${SIDE_LABEL[side].toLowerCase()} offer.</p>`;
    } else {
        container.innerHTML = rows[side].map(r => createRowHTML(side, r)).join('');
    }
    attachRowListeners(side);
}

function attachRowListeners(side) {
    rows[side].forEach((row) => {
        const id = row.id;

        const searchInput = document.getElementById(`${side}Search-${id}`);
        if (searchInput) {
            searchInput.addEventListener('input', (e) => handleRowSearchInput(side, id, e));
        }

        const qtyInput = document.getElementById(`${side}Quantity-${id}`);
        if (qtyInput) {
            qtyInput.addEventListener('input', (e) => {
                row.quantity = Math.max(1, Number(e.target.value) || 1);
                recalculateRow(side, row);
                updateTotals();
            });
        }

        const priceInput = document.getElementById(`${side}Price-${id}`);
        if (priceInput) {
            priceInput.addEventListener('input', (e) => {
                row.customPrice  = Math.max(0, Number(e.target.value) || 0);
                row.priceTouched = true;
                updateTotals();
            });
        }

        const levelInput = document.getElementById(`${side}UpgradeLevel-${id}`);
        if (levelInput) {
            levelInput.addEventListener('input', (e) => {
                row.level = Number(e.target.value) || 0;
                document.getElementById(`${side}LevelLabel-${id}`).textContent = `+${row.level}`;
                recalculateRow(side, row);
                updateTotals();
            });
        }

        const brokenToggle = document.getElementById(`${side}BrokenToggle-${id}`);
        if (brokenToggle) {
            brokenToggle.addEventListener('change', (e) => {
                row.isBroken = e.target.checked;
                recalculateRow(side, row);
                updateTotals();
            });
        }

        const armorGroup = document.querySelector(`#${side}ArmorSelector-${id} .${side}-piece-button-group`);
        if (armorGroup) {
            armorGroup.querySelectorAll('[data-piece]').forEach(btn => {
                btn.addEventListener('click', () => setRowArmorPiece(side, id, btn.dataset.piece));
            });
        }

        const resetBtn = document.querySelector(`.reset-price-btn[data-side="${side}"][data-id="${id}"]`);
        if (resetBtn) {
            resetBtn.addEventListener('click', () => resetRowPrice(side, id));
        }

        const removeBtn = document.querySelector(`.remove-row-btn[data-side="${side}"][data-id="${id}"]`);
        if (removeBtn) {
            removeBtn.addEventListener('click', () => removeRow(side, id));
        }
    });
}

function handleRowSearchInput(side, id, event) {
    const query      = event.target.value.trim().toLowerCase();
    const resultsDiv = document.getElementById(`${side}SearchResults-${id}`);
    if (query.length < 2) { resultsDiv.classList.add('hidden'); return; }

    const matches = Object.keys(ITEM_DATABASE).filter(n => n.toLowerCase().includes(query));
    if (!matches.length) {
        resultsDiv.innerHTML = '<div class="p-2 text-sm text-gray-400">No items found.</div>';
        resultsDiv.classList.remove('hidden');
        return;
    }

    resultsDiv.innerHTML = matches.map(name => {
        const data  = getItemData(name);
        const color = getRarityColor(data.rarity);
        const safe  = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        return `
        <div class="search-result-item" onclick="selectRowItem('${side}', ${id}, '${safe}')">
            <div class="search-result-name">
                <div class="rarity-dot" style="background-color:${color};"></div>
                <span>${name}</span>
            </div>
            <span class="search-result-price" style="background-color:${color};">${formatLS(data.price)}</span>
        </div>`;
    }).join('');
    resultsDiv.classList.remove('hidden');
}

function selectRowItem(side, id, itemName) {
    const item = getItemData(itemName);
    if (!item) return;
    const row = rows[side].find(r => r.id === id);
    if (!row) return;

    row.name         = itemName;
    row.level        = 0;
    row.isBroken     = false;
    row.armorPiece   = item.isArmorSet ? 'Full Set' : 'N/A';
    row.priceTouched = false; // fresh item: price follows book value again

    document.getElementById(`${side}ItemNameDisplay-${id}`).textContent = itemName;
    document.getElementById(`${side}ItemNameDisplay-${id}`).classList.add(side === 'your' ? 'text-blue-300' : 'text-amber-300');
    document.getElementById(`${side}Search-${id}`).value = '';
    document.getElementById(`${side}SearchResults-${id}`).classList.add('hidden');

    updateRowGearControls(side, row);
    recalculateRow(side, row);
    updateTotals();
}

function updateRowGearControls(side, row) {
    const item   = getItemData(row.name);
    const id     = row.id;
    const gearEl = document.getElementById(`${side}GearControls-${id}`);
    if (!gearEl) return;

    if (!item || !item.isGear) { gearEl.classList.add('hidden'); return; }
    gearEl.classList.remove('hidden');

    document.getElementById(`${side}BaseLSDisplay-${id}`).textContent = formatLS(item.price);

    const maxLevel   = UPGRADE_LIMITS[item.rarity] || 0;
    const levelInput = document.getElementById(`${side}UpgradeLevel-${id}`);
    levelInput.max   = maxLevel;
    row.level        = Math.min(Number(row.level) || 0, maxLevel);
    levelInput.value = row.level;
    document.getElementById(`${side}LevelLabel-${id}`).textContent = `+${row.level}`;
    document.getElementById(`${side}BrokenToggle-${id}`).checked = row.isBroken;

    const armorEl = document.getElementById(`${side}ArmorSelector-${id}`);
    if (item.isArmorSet) {
        armorEl.classList.remove('hidden');
        const groupEl = document.querySelector(`#${side}ArmorSelector-${id} .${side}-piece-button-group`);
        if (groupEl) {
            groupEl.querySelectorAll('[data-piece]').forEach(btn => {
                const active = btn.dataset.piece === row.armorPiece;
                btn.classList.toggle('bg-indigo-600',      active);
                btn.classList.toggle('hover:bg-indigo-700', active);
                btn.classList.toggle('bg-gray-700',        !active);
                btn.classList.toggle('hover:bg-gray-600',  !active);
            });
        }
    } else {
        armorEl.classList.add('hidden');
    }
}

function setRowArmorPiece(side, id, piece) {
    const row = rows[side].find(r => r.id === id);
    if (!row) return;
    row.armorPiece = piece;
    updateRowGearControls(side, row);
    recalculateRow(side, row);
    updateTotals();
}

function resetRowPrice(side, id) {
    const row = rows[side].find(r => r.id === id);
    if (!row) return;
    row.priceTouched = false;
    recalculateRow(side, row);
    updateTotals();
}

// Recomputes a row's book value display, and — if the price hasn't
// been manually touched — keeps its price mirrored to book value.
function recalculateRow(side, row) {
    const bookValue = row.name
        ? calculateItemLS(row.name, row.quantity, row.level, row.isBroken, row.armorPiece)
        : 0;

    const bookDisplay = document.getElementById(`${side}BookLS-${row.id}`);
    if (bookDisplay) bookDisplay.textContent = formatLS(bookValue);

    if (!row.priceTouched) {
        row.customPrice = bookValue;
    }

    const priceInput = document.getElementById(`${side}Price-${row.id}`);
    if (priceInput && document.activeElement !== priceInput) {
        priceInput.value = row.customPrice.toFixed(2);
    }

    return bookValue;
}

function addRow(side) {
    rowSeq[side] += 1;
    rows[side].push({
        id: rowSeq[side], name: '', quantity: 1, level: 0, isBroken: false,
        armorPiece: 'Full Set', customPrice: 0, priceTouched: false
    });
    renderRows(side);
    updateTotals();
}

function removeRow(side, id) {
    rows[side] = rows[side].filter(r => r.id !== id);
    renderRows(side);
    updateTotals();
}

function clearRows(side) {
    if (rows[side].length && !confirm(`Clear all items from ${SIDE_LABEL[side]} Offer?`)) return;
    rows[side] = [];
    renderRows(side);
    updateTotals();
    addRow(side); // leave one empty row ready to go
}

function resetTradeBuilder() {
    SIDES.forEach(side => {
        rows[side]   = [];
        rowSeq[side] = 0;
        renderRows(side);
        addRow(side);
    });
    updateTotals();
}

// =============================================================
// TOTALS & VERDICT
// =============================================================

function sideTotals(side) {
    let book = 0, custom = 0;
    rows[side].forEach(row => {
        if (!row.name) return;
        book   += calculateItemLS(row.name, row.quantity, row.level, row.isBroken, row.armorPiece);
        custom += row.priceTouched ? row.customPrice : calculateItemLS(row.name, row.quantity, row.level, row.isBroken, row.armorPiece);
    });
    return { book, custom };
}

function updateTotals() {
    const your  = sideTotals('your');
    const their = sideTotals('their');

    totals = { yourBook: your.book, yourCustom: your.custom, theirBook: their.book, theirCustom: their.custom };

    document.getElementById('yourBookTotalLS').textContent   = formatLS(your.book);
    document.getElementById('yourCustomTotalLS').textContent = formatLS(your.custom);
    document.getElementById('theirBookTotalLS').textContent  = formatLS(their.book);
    document.getElementById('theirCustomTotalLS').textContent= formatLS(their.custom);

    document.getElementById('your-total-ls').textContent  = formatLS(your.custom);
    document.getElementById('your-total-book').textContent = formatLS(your.book);
    document.getElementById('their-total-ls').textContent = formatLS(their.custom);
    document.getElementById('their-total-book').textContent = formatLS(their.book);

    const tolerance = 0.01;
    const diff      = your.custom - their.custom;
    const diffEl    = document.getElementById('liveDifference');
    diffEl.textContent = formatLS(diff);
    diffEl.className   = 'text-3xl font-bold ' +
        (diff > tolerance ? 'text-green-400' : diff < -tolerance ? 'text-red-400' : 'text-gray-300');

    const total     = your.custom + their.custom;
    const yourPct   = total > 0 ? (your.custom  / total) * 100 : 50;
    const theirPct  = total > 0 ? (their.custom / total) * 100 : 50;
    document.getElementById('balanceBarOffer').style.width  = yourPct  + '%';
    document.getElementById('balanceBarTarget').style.width = theirPct + '%';

    const hasYourItems  = rows.your.some(r => r.name);
    const hasTheirItems = rows.their.some(r => r.name);

    const verdictBox = document.getElementById('verdictBox');
    verdictBox.classList.remove('status-balanced', 'status-overpaid', 'status-deficit');

    let verdictText, statusClass, balanceText;

    if (!hasYourItems || !hasTheirItems) {
        verdictText = 'Waiting for input...';
        statusClass = 'text-gray-300';
        balanceText = 'Add items to both sides to begin.';
    } else if (Math.abs(diff) < tolerance) {
        verdictText = 'BALANCED — MATCHING VALUE';
        statusClass = 'text-green-500';
        balanceText = 'Both sides are worth the same, at the prices you\u2019ve set.';
        verdictBox.classList.add('status-balanced');
    } else if (diff > tolerance) {
        verdictText = `YOUR OFFER IS WORTH ${formatLS(diff)} MORE`;
        statusClass = 'text-amber-400';
        balanceText = 'You\u2019re offering more than you\u2019re getting back.';
        verdictBox.classList.add('status-overpaid');
    } else {
        verdictText = `THEIR OFFER IS WORTH ${formatLS(Math.abs(diff))} MORE`;
        statusClass = 'text-green-400';
        balanceText = 'You\u2019re getting more than you\u2019re giving up.';
        verdictBox.classList.add('status-deficit');
    }

    document.getElementById('tradeVerdict').textContent     = verdictText;
    document.getElementById('tradeVerdict').className       = `text-center text-lg font-semibold ${statusClass}`;
    document.getElementById('balanceStatusText').textContent = balanceText;

    const bookCheckEl = document.getElementById('bookValueCheck');
    if (!hasYourItems || !hasTheirItems) {
        bookCheckEl.textContent = 'Add items to compare against book value.';
    } else {
        const bookDiff = your.book - their.book;
        if (Math.abs(bookDiff) < tolerance) {
            bookCheckEl.textContent = 'At book value, this trade is exactly even.';
        } else if (bookDiff > 0) {
            bookCheckEl.textContent = `At book value, your side is worth ${formatLS(bookDiff)} more — you may be discounting your own items or getting a deal from them.`;
        } else {
            bookCheckEl.textContent = `At book value, their side is worth ${formatLS(Math.abs(bookDiff))} more — you may be paying a premium or discounting their items.`;
        }
    }
}

// =============================================================
// COPY TRADE
// =============================================================

function gearSuffix(row) {
    const item = getItemData(row.name);
    if (!item || !item.isGear) return '';
    const parts = [];
    if (row.level > 0) parts.push(`+${row.level}`);
    if (item.isArmorSet && row.armorPiece && row.armorPiece !== 'Full Set') parts.push(row.armorPiece);
    if (row.isBroken) parts.push('Broken');
    return parts.length ? ` (${parts.join(', ')})` : '';
}

function buildSideLines(side) {
    const list = rows[side].filter(r => r.name);
    if (!list.length) return ['  (nothing listed)'];
    return list.map(row => {
        const book  = calculateItemLS(row.name, row.quantity, row.level, row.isBroken, row.armorPiece);
        const price = row.priceTouched ? row.customPrice : book;
        return `  - ${row.quantity}x ${row.name}${gearSuffix(row)} — Book: ${formatLS(book)} | Price: ${formatLS(price)}`;
    });
}

function buildTradeSummaryText() {
    const serverSelect = document.getElementById('serverSelector');
    const serverName   = serverSelect && serverSelect.selectedOptions.length
        ? serverSelect.selectedOptions[0].textContent
        : 'Unknown Server';

    const diff = totals.yourCustom - totals.theirCustom;
    let diffLine;
    if (Math.abs(diff) < 0.01) {
        diffLine = 'Balanced.';
    } else if (diff > 0) {
        diffLine = `Your offer is worth ${formatLS(diff)} more than theirs.`;
    } else {
        diffLine = `Their offer is worth ${formatLS(Math.abs(diff))} more than yours.`;
    }

    const lines = [];
    lines.push(`=== Midgard Trade Agreement (${serverName}) ===`);
    lines.push('');
    lines.push('YOUR OFFER:');
    lines.push(...buildSideLines('your'));
    lines.push(`  Total — Book: ${formatLS(totals.yourBook)} | Price: ${formatLS(totals.yourCustom)}`);
    lines.push('');
    lines.push('THEIR OFFER:');
    lines.push(...buildSideLines('their'));
    lines.push(`  Total — Book: ${formatLS(totals.theirBook)} | Price: ${formatLS(totals.theirCustom)}`);
    lines.push('');
    lines.push(`Difference (Price basis): ${diffLine}`);

    return lines.join('\n');
}

function openCopyTradeModal() {
    document.getElementById('copyTradeText').value = buildTradeSummaryText();
    document.getElementById('copyTradeStatus').textContent = '';
    document.getElementById('copyTradeModal').classList.remove('hidden');
}

function closeCopyTradeModal() {
    document.getElementById('copyTradeModal').classList.add('hidden');
}

async function copyTradeToClipboard() {
    const textarea = document.getElementById('copyTradeText');
    const statusEl = document.getElementById('copyTradeStatus');
    const text     = textarea.value;

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            textarea.focus();
            textarea.select();
            document.execCommand('copy');
        }
        statusEl.textContent = 'Copied! Paste it into chat.';
        statusEl.className   = 'text-sm mt-2 h-5 text-green-400';
    } catch (err) {
        console.error('Copy failed:', err);
        textarea.focus();
        textarea.select();
        statusEl.textContent = 'Could not auto-copy — text is selected, press Ctrl/Cmd+C.';
        statusEl.className   = 'text-sm mt-2 h-5 text-amber-400';
    }
}

// =============================================================
// PRICE SUGGESTION MODAL (public, writes to `suggestions` table)
// =============================================================

function openSuggestionModal() {
    document.getElementById('suggestionModal').classList.remove('hidden');
    document.getElementById('suggestItemName').value = '';
    document.getElementById('suggestPrice').value     = '';
    document.getElementById('suggestReason').value    = '';
    document.getElementById('suggestionStatus').textContent = '';
    document.getElementById('newItemNotice').classList.add('hidden');
}

function closeSuggestionModal() {
    document.getElementById('suggestionModal').classList.add('hidden');
}

function handleSuggestItemSearch(event) {
    const query      = event.target.value.trim().toLowerCase();
    const resultsDiv = document.getElementById('suggestItemResults');
    const notice     = document.getElementById('newItemNotice');

    if (query.length < 2) {
        resultsDiv.classList.add('hidden');
        notice.classList.add('hidden');
        return;
    }

    const matches = Object.keys(ITEM_DATABASE).filter(n => n.toLowerCase().includes(query));
    const exactMatch = Object.keys(ITEM_DATABASE).some(n => n.toLowerCase() === query);
    notice.classList.toggle('hidden', exactMatch || !query);

    if (!matches.length) {
        resultsDiv.classList.add('hidden');
        return;
    }

    resultsDiv.innerHTML = matches.map(name => {
        const data  = getItemData(name);
        const color = getRarityColor(data.rarity);
        const safe  = name.replace(/'/g, "\\'");
        return `
        <div class="search-result-item" onclick="selectSuggestItem('${safe}')">
            <div class="search-result-name">
                <div class="rarity-dot" style="background-color:${color};"></div>
                <span>${name}</span>
            </div>
            <span class="search-result-price" style="background-color:${color};">${formatLS(data.price)}</span>
        </div>`;
    }).join('');
    resultsDiv.classList.remove('hidden');
}

function selectSuggestItem(name) {
    document.getElementById('suggestItemName').value = name;
    document.getElementById('suggestItemResults').classList.add('hidden');
    document.getElementById('newItemNotice').classList.add('hidden');
}

async function submitSuggestion() {
    const itemName = document.getElementById('suggestItemName').value.trim();
    const price    = Number(document.getElementById('suggestPrice').value);
    const reason   = document.getElementById('suggestReason').value.trim();
    const statusEl = document.getElementById('suggestionStatus');

    if (!itemName || !Number.isFinite(price) || price <= 0) {
        statusEl.textContent = 'Please enter a valid item name and price.';
        statusEl.className   = 'text-red-400 text-sm mt-2';
        return;
    }

    const ok = await supabaseInsert('suggestions', {
        item_name: itemName,
        suggested_price: price,
        reason: reason || null,
        server_id: currentServerId
    });

    if (ok) {
        statusEl.textContent = 'Suggestion submitted — thank you!';
        statusEl.className   = 'text-green-400 text-sm mt-2';
        setTimeout(closeSuggestionModal, 1200);
    } else {
        statusEl.textContent = 'Failed to submit suggestion. Please try again.';
        statusEl.className   = 'text-red-400 text-sm mt-2';
    }
}

// =============================================================
// INIT
// =============================================================

function attachStaticListeners() {
    document.getElementById('addYourRow').addEventListener('click', () => addRow('your'));
    document.getElementById('clearYourRows').addEventListener('click', () => clearRows('your'));
    document.getElementById('addTheirRow').addEventListener('click', () => addRow('their'));
    document.getElementById('clearTheirRows').addEventListener('click', () => clearRows('their'));

    document.getElementById('openCopyTrade').addEventListener('click', openCopyTradeModal);

    document.getElementById('suggestItemName')
        .addEventListener('input', handleSuggestItemSearch);

    // Hidden admin trigger: click bottom-left corner 3 times in 2s to open login modal
    let clickCount = 0;
    let clickTimer = null;
    document.getElementById('adminTrigger').addEventListener('click', () => {
        clickCount++;
        clearTimeout(clickTimer);
        clickTimer = setTimeout(() => { clickCount = 0; }, 2000);
        if (clickCount >= 3) {
            clickCount = 0;
            openAdminLoginModal();
        }
    });
}

// Expose functions used via inline onclick="" in index.html
window.selectRowItem        = selectRowItem;
window.selectSuggestItem    = selectSuggestItem;
window.openSuggestionModal  = openSuggestionModal;
window.closeSuggestionModal = closeSuggestionModal;
window.submitSuggestion     = submitSuggestion;
window.adminLogin           = adminLogin;
window.adminLogout          = adminLogout;
window.closeAdminLoginModal = closeAdminLoginModal;
window.closeAdminModal      = closeAdminModal;
window.approvePrice         = approvePrice;
window.rejectSuggestions    = rejectSuggestions;
window.addNewItem           = addNewItem;
window.closeCopyTradeModal  = closeCopyTradeModal;
window.copyTradeToClipboard = copyTradeToClipboard;

document.addEventListener('DOMContentLoaded', async () => {
    showLoading(true);
    attachStaticListeners();
    await loadServers();
    resetTradeBuilder();
    showLoading(false);

    // If an admin is already mid-session (e.g. page refresh), keep them logged in
    // without re-showing the login modal — but never auto-open the admin panel.
});
