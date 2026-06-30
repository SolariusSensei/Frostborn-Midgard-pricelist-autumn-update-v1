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
const SUGGESTION_ITEMS = [
    "Common Fish", "Loki's Berrie", "Ghost Essence", "Sanctum Key",
    "Salt", "Ash Ring", "Blue Bag", "Forge Key",
    "Medium Orb I", "Logi Key", "Archive Key", "Library Key"
];
const MAX_OFFER_SLOTS = 5;

// --- STATE ---
let ITEM_DATABASE   = {};
let currentServerId = null;
let targetState      = { name: '', quantity: 1, level: 0, isBroken: false, armorPiece: 'Full Set' };
let offerStates      = [];

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

    contentEl.innerHTML = suggestions.map(s => {
        const exists  = !!getItemData(s.item_name);
        const safeId  = s.item_name.replace(/[^a-zA-Z0-9]/g, '');
        const safeName = s.item_name.replace(/'/g, "\\'");

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

        return `
        <div class="p-3 bg-gray-900 rounded-lg border border-gray-700">
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-semibold text-amber-400">${s.item_name}</p>
                    <p class="text-xs text-gray-400">Suggested: ${formatLS(s.suggested_price)}${exists ? '' : ' (new item)'}</p>
                    ${s.reason ? `<p class="text-xs text-gray-500 mt-1">"${s.reason.replace(/</g, '&lt;')}"</p>` : ''}
                </div>
                <div class="flex gap-2 shrink-0">
                    <button class="px-3 py-1 bg-green-700 hover:bg-green-600 rounded-md text-xs"
                        onclick="${exists ? `approvePrice('${safeName}', ${s.suggested_price})` : `addNewItem('${safeName}', ${s.suggested_price})`}">
                        ${exists ? 'Approve' : 'Add Item'}
                    </button>
                    <button class="px-3 py-1 bg-red-700 hover:bg-red-600 rounded-md text-xs"
                        onclick="rejectSuggestions('${safeName}')">Reject</button>
                </div>
            </div>
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
        resetTrade();
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

function resetTrade() {
    targetState = { name: '', quantity: 1, level: 0, isBroken: false, armorPiece: 'Full Set' };
    offerStates = [];
    document.getElementById('targetItemNameDisplay').textContent = 'None';
    document.getElementById('targetSearch').value = '';
    document.getElementById('targetGearControls').classList.add('hidden');
    renderOfferSlots();
    document.getElementById('addOfferSlot').click();
    updateCalculations();
}

// =============================================================
// CALCULATIONS
// =============================================================

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

function updateCalculations() {
    const targetItem = getItemData(targetState.name);
    const targetLS   = targetItem
        ? calculateItemLS(targetState.name, targetState.quantity, targetState.level, targetState.isBroken, targetState.armorPiece)
        : 0;
    document.getElementById('their-total-ls').textContent = formatLS(targetLS);

    let totalOfferLS = 0;
    offerStates.forEach((state, i) => {
        const itemLS = state.name
            ? calculateItemLS(state.name, state.quantity, state.level, state.isBroken, state.armorPiece)
            : 0;
        totalOfferLS += itemLS;
        const chip = document.getElementById(`offerLSDisplay-${i}`);
        if (chip) chip.textContent = formatLS(itemLS);
    });
    document.getElementById('your-total-ls').textContent = formatLS(totalOfferLS);

    const liveDiff   = totalOfferLS - targetLS;
    const tolerance  = 0.01;
    const liveDiffEl = document.getElementById('liveDifference');
    liveDiffEl.textContent = formatLS(liveDiff);
    liveDiffEl.className   = 'text-3xl font-bold ' +
        (liveDiff > tolerance ? 'text-green-400' : liveDiff < -tolerance ? 'text-red-400' : 'text-gray-300');

    const total     = targetLS + totalOfferLS;
    const offerPct  = total > 0 ? (totalOfferLS / total) * 100 : 50;
    const targetPct = total > 0 ? (targetLS   / total) * 100 : 50;
    document.getElementById('balanceBarOffer').style.width  = offerPct  + '%';
    document.getElementById('balanceBarTarget').style.width = targetPct + '%';

    const absDiff     = Math.abs(liveDiff);
    const verdictBox  = document.getElementById('verdictBox');
    verdictBox.classList.remove('status-balanced', 'status-overpaid', 'status-deficit');

    let verdictText = '', suggestionHTML = '', statusClass = 'text-gray-300', balanceText = '';

    if (targetLS === 0 || totalOfferLS === 0) {
        verdictText    = 'Waiting for input...';
        suggestionHTML = 'Awaiting calculation...';
        balanceText    = 'Select items to begin trade.';
    } else if (absDiff < tolerance) {
        verdictText    = 'PERFECT TRADE BALANCE';
        suggestionHTML = 'The trade is balanced within minimal tolerance.';
        statusClass    = 'text-green-500';
        balanceText    = 'Trade is perfectly balanced.';
        verdictBox.classList.add('status-balanced');
    } else if (liveDiff > tolerance) {
        verdictText = 'OVERPAID — REFUND REQUIRED';
        statusClass = 'text-green-400';
        balanceText = 'Your offer is too high! Merchant owes you change.';
        verdictBox.classList.add('status-overpaid');
        if (targetItem && targetItem.isConsumable && targetItem.price > 0) {
            const extra = Math.floor(liveDiff / targetItem.price);
            if (extra > 0) {
                const used = extra * targetItem.price;
                const left = liveDiff - used;
                suggestionHTML = `Merchant owes you ${formatLS(liveDiff)}. You could take <strong>${extra} more ${targetState.name}</strong> (${formatLS(used)}). Remaining: ${formatLS(left)}.`;
            } else {
                suggestionHTML = `Merchant owes <strong>${formatLS(liveDiff)}</strong>. Suggested refund items:<br>${suggestItems(liveDiff)}`;
            }
        } else {
            suggestionHTML = `Merchant owes <strong>${formatLS(liveDiff)}</strong>. Suggested refund items:<br>${suggestItems(liveDiff)}`;
        }
    } else {
        verdictText     = 'DEFICIT — ADD MORE ITEMS';
        statusClass     = 'text-red-400';
        balanceText     = 'Your offer is too low! You need to add more.';
        suggestionHTML  = `You are short by <strong>${formatLS(absDiff)}</strong>. Suggested items to add:<br>${suggestItems(absDiff)}`;
        verdictBox.classList.add('status-deficit');
    }

    document.getElementById('tradeVerdict').textContent       = verdictText;
    document.getElementById('tradeVerdict').className         = `text-center text-lg font-semibold ${statusClass}`;
    document.getElementById('tradeSuggestion').innerHTML       = suggestionHTML;
    document.getElementById('balanceStatusText').textContent   = balanceText;
}

// =============================================================
// SUGGESTION ENGINE (refund / deficit item math — NOT the price-suggestion modal)
// =============================================================

function suggestItems(targetValue) {
    const sorted = SUGGESTION_ITEMS
        .map(name => ({ name, data: getItemData(name) }))
        .filter(i => i.data && i.data.price > 0)
        .sort((a, b) => b.data.price - a.data.price);

    if (!sorted.length) return 'Could not generate suggestions.';

    const results = [];
    for (const item of sorted) {
        const qty = Math.floor(targetValue / item.data.price);
        if (qty > 0) {
            const val = qty * item.data.price;
            results.push({ str: `<li><strong>${qty}x ${item.name}</strong> (${formatLS(val)})</li>`, val });
        }
    }

    if (!results.length) {
        const cheapest = sorted[sorted.length - 1];
        const qty = Math.ceil(targetValue / cheapest.data.price);
        return `<ul><li>Try adding <strong>${qty}x ${cheapest.name}</strong> (${formatLS(qty * cheapest.data.price)})</li></ul>`;
    }

    return '<ul>' + results
        .sort((a, b) => Math.abs(a.val - targetValue) - Math.abs(b.val - targetValue))
        .slice(0, 3)
        .map(r => r.str)
        .join('') + '</ul>';
}

// =============================================================
// SEARCH & ITEM SELECTION
// =============================================================

function handleSearchInput(event, resultsId, isTarget) {
    const query      = event.target.value.trim().toLowerCase();
    const resultsDiv = document.getElementById(resultsId);
    if (query.length < 2) { resultsDiv.classList.add('hidden'); return; }

    const matches = Object.keys(ITEM_DATABASE).filter(n => n.toLowerCase().includes(query));
    if (!matches.length) {
        resultsDiv.innerHTML = '<div class="p-2 text-sm text-gray-400">No items found.</div>';
        resultsDiv.classList.remove('hidden');
        return;
    }

    const slotId = isTarget ? 'target' : resultsId.replace('offerSearchResults-', '');
    resultsDiv.innerHTML = matches.map(name => {
        const data  = getItemData(name);
        const color = getRarityColor(data.rarity);
        const safe  = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        return `
        <div class="search-result-item" onclick="selectItem('${safe}','${slotId}',${isTarget})">
            <div class="search-result-name">
                <div class="rarity-dot" style="background-color:${color};"></div>
                <span>${name}</span>
            </div>
            <span class="search-result-price" style="background-color:${color};">${formatLS(data.price)}</span>
        </div>`;
    }).join('');
    resultsDiv.classList.remove('hidden');
}

function selectItem(itemName, slotId, isTarget) {
    const item = getItemData(itemName);
    if (!item) return;
    const state = isTarget ? targetState : offerStates[parseInt(slotId)];
    if (!state) return;

    state.name       = itemName;
    state.level       = 0;
    state.isBroken     = false;
    state.armorPiece = item.isArmorSet ? 'Full Set' : 'N/A';

    const nameEl    = isTarget ? 'targetItemNameDisplay'  : `offerItemNameDisplay-${slotId}`;
    const searchEl  = isTarget ? 'targetSearch'           : `offerSearch-${slotId}`;
    const resultsEl = isTarget ? 'targetSearchResults'    : `offerSearchResults-${slotId}`;

    document.getElementById(nameEl).textContent = itemName;
    document.getElementById(searchEl).value     = '';
    document.getElementById(resultsEl).classList.add('hidden');

    updateGearControls(state, slotId, isTarget);
    updateCalculations();
}

function updateGearControls(state, slotId, isTarget) {
    const item         = getItemData(state.name);
    const gearId       = isTarget ? 'targetGearControls'  : `offerGearControls-${slotId}`;
    const baseId       = isTarget ? 'targetBaseLSDisplay' : `offerBaseLSDisplay-${slotId}`;
    const levelInputId = isTarget ? 'targetUpgradeLevel'  : `offerUpgradeLevel-${slotId}`;
    const levelLabelId = isTarget ? 'targetLevelLabel'    : `offerLevelLabel-${slotId}`;
    const brokenId     = isTarget ? 'targetBrokenToggle'  : `offerBrokenToggle-${slotId}`;
    const armorId      = isTarget ? 'targetArmorSelector' : `offerArmorSelector-${slotId}`;
    const gearEl       = document.getElementById(gearId);

    if (!item || !item.isGear) { gearEl.classList.add('hidden'); return; }
    gearEl.classList.remove('hidden');

    document.getElementById(baseId).textContent = formatLS(item.price);

    const maxLevel   = UPGRADE_LIMITS[item.rarity] || 0;
    const levelInput = document.getElementById(levelInputId);
    levelInput.max   = maxLevel;
    state.level      = Math.min(Number(state.level) || 0, maxLevel);
    levelInput.value = state.level;
    document.getElementById(levelLabelId).textContent = `+${state.level}`;
    document.getElementById(brokenId).checked = state.isBroken;

    const armorEl = document.getElementById(armorId);
    if (item.isArmorSet) {
        armorEl.classList.remove('hidden');
        const groupEl = isTarget
            ? document.getElementById('targetPieceButtons')
            : document.querySelector(`#offerArmorSelector-${slotId} .piece-button-group`);
        if (groupEl) {
            groupEl.querySelectorAll('[data-piece]').forEach(btn => {
                const active = btn.dataset.piece === state.armorPiece;
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

function setArmorPiece(piece, slotId, isTarget) {
    const state = isTarget ? targetState : offerStates[parseInt(slotId)];
    if (!state) return;
    state.armorPiece = piece;
    updateGearControls(state, slotId, isTarget);
    updateCalculations();
}

// =============================================================
// OFFER SLOTS
// =============================================================

function createOfferSlotHTML(index) {
    return `
    <div id="offerSlot-${index}" class="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
        <div class="flex justify-between items-center mb-3">
            <h3 class="text-lg font-semibold text-gray-300">Offer Item ${index + 1}</h3>
            <button data-index="${index}" class="remove-offer-btn text-red-500 hover:text-red-400 text-sm font-bold">Remove</button>
        </div>
        <input type="text" id="offerSearch-${index}" placeholder="Search for Item..."
            class="w-full p-2 mb-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm">
        <div id="offerSearchResults-${index}" class="max-h-40 overflow-y-auto custom-scrollbar bg-gray-700 rounded-md mb-2 hidden"></div>
        <div class="text-sm font-semibold p-2 rounded-md bg-gray-900 border border-gray-700 min-h-[35px] text-gray-400">
            <span class="text-xs text-amber-500 block">Selected:</span>
            <span id="offerItemNameDisplay-${index}">None</span>
        </div>
        <div class="mt-3">
            <label class="block text-sm font-medium mb-1 text-gray-400">Quantity</label>
            <input type="number" id="offerQuantity-${index}" min="1" value="1"
                class="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-sm text-center">
        </div>
        <div id="offerGearControls-${index}" class="space-y-3 mt-4 hidden">
            <div class="flex justify-between items-center text-sm font-medium">
                <span class="text-gray-400">Base LS:</span>
                <span id="offerBaseLSDisplay-${index}" class="font-bold">0</span>
            </div>
            <div>
                <label for="offerUpgradeLevel-${index}" class="block text-sm font-medium text-gray-400">
                    Upgrade Level (<span id="offerLevelLabel-${index}">+0</span>)
                </label>
                <input type="range" id="offerUpgradeLevel-${index}" min="0" max="0" value="0"
                    class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg">
            </div>
            <div id="offerArmorSelector-${index}" class="hidden">
                <label class="block text-sm font-medium mb-2 text-gray-400">Select Armor Piece</label>
                <div class="piece-button-group grid grid-cols-2 gap-2 text-xs">
                    <button data-piece="Full Set" class="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition">Full Set</button>
                    <button data-piece="Head" class="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition">Head (20%)</button>
                    <button data-piece="Chest" class="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition">Chest (30%)</button>
                    <button data-piece="Pants" class="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition">Pants (22%)</button>
                    <button data-piece="Boots" class="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition">Boots (28%)</button>
                </div>
            </div>
            <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-400">Broken Status</span>
                <label class="broken-toggle-switch">
                    <input type="checkbox" id="offerBrokenToggle-${index}">
                    <span class="broken-slider"></span>
                </label>
            </div>
        </div>
        <div class="text-right mt-3 text-sm">
            <span class="text-gray-400">Value: </span>
            <span id="offerLSDisplay-${index}" class="font-bold text-blue-300">0.00 LS</span>
        </div>
    </div>`;
}

function renderOfferSlots() {
    const container = document.getElementById('offerSlots');
    container.innerHTML = offerStates.map((_, i) => createOfferSlotHTML(i)).join('');
    attachOfferSlotListeners();
    document.getElementById('addOfferSlot').disabled = offerStates.length >= MAX_OFFER_SLOTS;
}

function attachOfferSlotListeners() {
    offerStates.forEach((state, i) => {
        const searchInput = document.getElementById(`offerSearch-${i}`);
        if (searchInput) {
            searchInput.addEventListener('input', (e) =>
                handleSearchInput(e, `offerSearchResults-${i}`, false));
        }

        const qtyInput = document.getElementById(`offerQuantity-${i}`);
        if (qtyInput) {
            qtyInput.addEventListener('input', (e) => {
                state.quantity = Math.max(1, Number(e.target.value) || 1);
                updateCalculations();
            });
        }

        const levelInput = document.getElementById(`offerUpgradeLevel-${i}`);
        if (levelInput) {
            levelInput.addEventListener('input', (e) => {
                state.level = Number(e.target.value) || 0;
                document.getElementById(`offerLevelLabel-${i}`).textContent = `+${state.level}`;
                updateCalculations();
            });
        }

        const brokenToggle = document.getElementById(`offerBrokenToggle-${i}`);
        if (brokenToggle) {
            brokenToggle.addEventListener('change', (e) => {
                state.isBroken = e.target.checked;
                updateCalculations();
            });
        }

        const armorGroup = document.querySelector(`#offerArmorSelector-${i} .piece-button-group`);
        if (armorGroup) {
            armorGroup.querySelectorAll('[data-piece]').forEach(btn => {
                btn.addEventListener('click', () => setArmorPiece(btn.dataset.piece, i, false));
            });
        }
    });

    container_clickListener();
}

function container_clickListener() {
    document.querySelectorAll('.remove-offer-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = Number(e.target.dataset.index);
            removeOfferSlot(index);
        });
    });
}

function addOfferSlotHandler() {
    if (offerStates.length >= MAX_OFFER_SLOTS) return;
    offerStates.push({ name: '', quantity: 1, level: 0, isBroken: false, armorPiece: 'Full Set' });
    renderOfferSlots();
    updateCalculations();
}

function removeOfferSlot(index) {
    offerStates.splice(index, 1);
    renderOfferSlots();
    updateCalculations();
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
    document.getElementById('targetSearch')
        .addEventListener('input', (e) => handleSearchInput(e, 'targetSearchResults', true));

    document.getElementById('targetQuantity')
        .addEventListener('input', (e) => {
            targetState.quantity = Math.max(1, Number(e.target.value) || 1);
            updateCalculations();
        });

    document.getElementById('targetUpgradeLevel')
        .addEventListener('input', (e) => {
            targetState.level = Number(e.target.value) || 0;
            document.getElementById('targetLevelLabel').textContent = `+${targetState.level}`;
            updateCalculations();
        });

    document.getElementById('targetBrokenToggle')
        .addEventListener('change', (e) => {
            targetState.isBroken = e.target.checked;
            updateCalculations();
        });

    document.getElementById('targetPieceButtons')
        .querySelectorAll('[data-piece]')
        .forEach(btn => btn.addEventListener('click', () =>
            setArmorPiece(btn.dataset.piece, null, true)));

    document.getElementById('addOfferSlot').addEventListener('click', addOfferSlotHandler);

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
window.selectItem          = selectItem;
window.selectSuggestItem   = selectSuggestItem;
window.openSuggestionModal = openSuggestionModal;
window.closeSuggestionModal= closeSuggestionModal;
window.submitSuggestion    = submitSuggestion;
window.adminLogin          = adminLogin;
window.adminLogout         = adminLogout;
window.closeAdminLoginModal= closeAdminLoginModal;
window.closeAdminModal     = closeAdminModal;
window.approvePrice        = approvePrice;
window.rejectSuggestions   = rejectSuggestions;
window.addNewItem          = addNewItem;

document.addEventListener('DOMContentLoaded', async () => {
    showLoading(true);
    attachStaticListeners();
    await loadServers();
    resetTrade();
    showLoading(false);

    // If an admin is already mid-session (e.g. page refresh), keep them logged in
    // without re-showing the login modal — but never auto-open the admin panel.
});
