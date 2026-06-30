// =============================================================
// MIDGARD BARTER LEDGER — script.js
// =============================================================

// --- SUPABASE CONFIG ---
const SUPABASE_URL = 'https://iostylnrwoytrbygqbzv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvc3R5bG5yd295dHJieWdxYnp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NjYxMTAsImV4cCI6MjA5ODM0MjExMH0.p08MmcHwREicm_k7mA6ZzAL4e1nx0KW5wdaVM_01QOA';

// --- CHANGE THIS TO YOUR OWN PASSWORD ---
const ADMIN_PASSWORD = 'LEONIS';

// --- CONSTANTS ---
const ARMOR_WEIGHTING = { 'Full Set': 1.00, 'Head': 0.20, 'Chest': 0.30, 'Pants': 0.22, 'Boots': 0.28 };
const UPGRADE_LIMITS  = { 'G': 3, 'B': 3, 'P': 5, 'L': 10, 'N': 0 };
const SUGGESTION_ITEMS = [
    "Common Fish", "Loki's Berrie", "Ghost Essence", "Sanctum Key",
    "Salt", "Ash Ring", "Blue Bag", "Forge Key",
    "Medium Orb I", "Logi Key", "Archive Key", "Library Key"
];

// --- STATE ---
let ITEM_DATABASE   = {};
let currentServerId = null;
let targetState     = { name: '', quantity: 1, level: 0, isBroken: false, armorPiece: 'Full Set' };
let offerStates     = [];

// =============================================================
// SUPABASE HELPERS
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

async function supabasePatch(endpoint, data) {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
            method: 'PATCH',
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
        console.error('supabasePatch failed:', err);
        return false;
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
// DATA LOADING
// =============================================================

async function loadServers() {
    const servers = await supabaseFetch('servers?select=*&order=name');
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
            price:       Number(item.price),
            category:    item.category,
            rarity:      item.rarity,
            isGear:      ['W', 'A', 'P'].includes(item.category),
            isArmorSet:  item.category === 'A',
            isConsumable:['F', 'G'].includes(item.category)
        };
    });
    populateAboutSection();
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
    // Target
    const targetItem = getItemData(targetState.name);
    const targetLS   = targetItem
        ? calculateItemLS(targetState.name, targetState.quantity, targetState.level, targetState.isBroken, targetState.armorPiece)
        : 0;
    document.getElementById('their-total-ls').textContent = formatLS(targetLS);

    // Offer
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

    // Difference
    const liveDiff    = totalOfferLS - targetLS;
    const tolerance   = 0.01;
    const liveDiffEl  = document.getElementById('liveDifference');
    liveDiffEl.textContent = formatLS(liveDiff);
    liveDiffEl.className   = 'text-3xl font-bold ' +
        (liveDiff > tolerance ? 'text-green-400' : liveDiff < -tolerance ? 'text-red-400' : 'text-gray-300');

    // Balance bar
    const total    = targetLS + totalOfferLS;
    const offerPct = total > 0 ? (totalOfferLS / total) * 100 : 50;
    const targetPct= total > 0 ? (targetLS   / total) * 100 : 50;
    document.getElementById('balanceBarOffer').style.width  = offerPct  + '%';
    document.getElementById('balanceBarTarget').style.width = targetPct + '%';

    // Verdict
    const absDiff  = Math.abs(liveDiff);
    const verdictBox = document.getElementById('verdictBox');
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
                const used  = extra * targetItem.price;
                const left  = liveDiff - used;
                suggestionHTML = `Merchant owes you ${formatLS(liveDiff)}. You could take <strong>${extra} more ${targetState.name}</strong> (${formatLS(used)}). Remaining: ${formatLS(left)}.`;
            } else {
                suggestionHTML = `Merchant owes <strong>${formatLS(liveDiff)}</strong>. Suggested refund items:<br>${suggestItems(liveDiff)}`;
            }
        } else {
            suggestionHTML = `Merchant owes <strong>${formatLS(liveDiff)}</strong>. Suggested refund items:<br>${suggestItems(liveDiff)}`;
        }
    } else {
        verdictText    = 'DEFICIT — ADD MORE ITEMS';
        statusClass    = 'text-red-400';
        balanceText    = 'Your offer is too low! You need to add more.';
        suggestionHTML = `You are short by <strong>${formatLS(absDiff)}</strong>. Suggested items to add:<br>${suggestItems(absDiff)}`;
        verdictBox.classList.add('status-deficit');
    }

    document.getElementById('tradeVerdict').textContent  = verdictText;
    document.getElementById('tradeVerdict').className    = `text-center text-lg font-semibold ${statusClass}`;
    document.getElementById('tradeSuggestion').innerHTML = suggestionHTML;
    document.getElementById('balanceStatusText').textContent = balanceText;
}

// =============================================================
// SUGGESTION ENGINE
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
    const item  = getItemData(itemName);
    if (!item) return;
    const state = isTarget ? targetState : offerStates[parseInt(slotId)];
    if (!state) return;

    state.name      = itemName;
    state.level     = 0;
    state.isBroken  = false;
    state.armorPiece= item.isArmorSet ? 'Full Set' : 'N/A';

    const nameEl    = isTarget ? 'targetItemNameDisplay'       : `offerItemNameDisplay-${slotId}`;
    const searchEl  = isTarget ? 'targetSearch'                : `offerSearch-${slotId}`;
    const resultsEl = isTarget ? 'targetSearchResults'         : `offerSearchResults-${slotId}`;

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
                btn.classList.toggle('bg-indigo-600',    active);
                btn.classList.toggle('hover:bg-indigo-700', active);
                btn.classList.toggle('bg-gray-700',     !active);
                btn.classList.toggle('hover:bg-gray-600',!active);
            });
        }
    } else {
        armorEl.classList.add('hidden');
    }
}

// =============================================================
// OFFER SLOTS
// =============================================================

function createOfferSlotHTML(index) {
    const state = offerStates[index];
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
            <span id="offerItemNameDisplay-${index}">${state.name || 'None'}</span>
        </div>
        <div class="flex items-center space-x-4 mt-4">
            <div class="flex-1">
                <label class="block text-xs font-medium mb-1 text-gray-400">Quantity</label>
                <input type="number" id="offerQuantity-${index}" min="1" value="${state.quantity}"
                    class="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-sm text-center offer-quantity" data-index="${index}">
            </div>
            <div class="flex-1 bg-amber-900/50 p-2 rounded-lg border border-amber-700 text-center">
                <span class="block text-xs text-gray-400">Total LS</span>
                <span id="offerLSDisplay-${index}" class="font-bold text-lg text-amber-300">0.00 LS</span>
            </div>
        </div>
        <div id="offerGearControls-${index}" class="space-y-3 mt-4 hidden">
            <div class="flex justify-between items-center text-sm font-medium">
                <span class="text-gray-400">Base LS:</span>
                <span id="offerBaseLSDisplay-${index}" class="font-bold">0.00 LS</span>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-400">
                    Upgrade Level (<span id="offerLevelLabel-${index}">+0</span>)
                </label>
                <input type="range" id="offerUpgradeLevel-${index}" min="0" max="0" value="0"
                    class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer offer-upgrade" data-index="${index}">
            </div>
            <div id="offerArmorSelector-${index}" class="hidden">
                <label class="block text-sm font-medium mb-2 text-gray-400">Select Armor Piece</label>
                <div data-index="${index}" class="piece-button-group grid grid-cols-2 gap-2 text-xs">
                    <button data-piece="Full Set" class="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition">Full Set</button>
                    <button data-piece="Head"     class="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition">Head (20%)</button>
                    <button data-piece="Chest"    class="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition">Chest (30%)</button>
                    <button data-piece="Pants"    class="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition">Pants (22%)</button>
                    <button data-piece="Boots"    class="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition">Boots (28%)</button>
                </div>
            </div>
            <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-400">Broken Status</span>
                <label class="broken-toggle-switch">
                    <input type="checkbox" id="offerBrokenToggle-${index}" class="offer-broken" data-index="${index}">
                    <span class="broken-slider"></span>
                </label>
            </div>
        </div>
    </div>`;
}

function renderOfferSlots() {
    const container = document.getElementById('offerSlots');
    container.innerHTML = offerStates.map((_, i) => createOfferSlotHTML(i)).join('');
    offerStates.forEach((state, i) => updateGearControls(state, i, false));
    attachOfferSlotListeners();
    updateCalculations();
}

function attachOfferSlotListeners() {
    const container = document.getElementById('offerSlots');
    if (!container) return;

    container.addEventListener('input', e => {
        const t = e.target;
        if (t.id.startsWith('offerSearch-')) {
            const i = parseInt(t.id.split('-')[1]);
            if (!isNaN(i)) handleSearchInput(e, `offerSearchResults-${i}`, false);
            return;
        }
        const i = parseInt(t.dataset.index);
        if (isNaN(i) || !offerStates[i]) return;
        if (t.classList.contains('offer-quantity')) {
            offerStates[i].quantity = parseInt(t.value) || 1;
        } else if (t.classList.contains('offer-upgrade')) {
            offerStates[i].level = parseInt(t.value);
            document.getElementById(`offerLevelLabel-${i}`).textContent = `+${offerStates[i].level}`;
        }
        updateCalculations();
    });

    container.addEventListener('change', e => {
        const i = parseInt(e.target.dataset.index);
        if (isNaN(i) || !offerStates[i]) return;
        if (e.target.classList.contains('offer-broken')) {
            offerStates[i].isBroken = e.target.checked;
            updateCalculations();
        }
    });

    container.addEventListener('click', e => {
        // Remove button
        if (e.target.classList.contains('remove-offer-btn')) {
            const i = parseInt(e.target.dataset.index);
            if (!isNaN(i)) {
                offerStates.splice(i, 1);
                renderOfferSlots();
                document.getElementById('addOfferSlot').disabled = offerStates.length >= 5;
            }
        }
        // Armor piece buttons
        const pieceBtn = e.target.closest('[data-piece]');
        if (pieceBtn) {
            const group = e.target.closest('.piece-button-group');
            const i     = parseInt(group.dataset.index);
            if (!isNaN(i) && offerStates[i]) {
                offerStates[i].armorPiece = pieceBtn.dataset.piece;
                updateGearControls(offerStates[i], i, false);
                updateCalculations();
            }
        }
    });
}

// =============================================================
// PRICE SUGGESTION MODAL (with autocomplete + new item support)
// =============================================================

let selectedSuggestItem = null;

function openSuggestionModal() {
    document.getElementById('suggestionModal').classList.remove('hidden');
    setupSuggestionAutocomplete();
}

function closeSuggestionModal() {
    document.getElementById('suggestionModal').classList.add('hidden');
    document.getElementById('suggestionForm').reset();
    document.getElementById('suggestionStatus').textContent = '';
    document.getElementById('newItemNotice').classList.add('hidden');
    document.getElementById('suggestItemResults').classList.add('hidden');
    selectedSuggestItem = null;
}

function setupSuggestionAutocomplete() {
    const input   = document.getElementById('suggestItemName');
    const results = document.getElementById('suggestItemResults');
    const notice  = document.getElementById('newItemNotice');

    input.oninput = (e) => {
        const query = e.target.value.trim().toLowerCase();
        selectedSuggestItem = null;
        notice.classList.add('hidden');

        if (query.length < 2) {
            results.classList.add('hidden');
            return;
        }

        const matches = Object.keys(ITEM_DATABASE).filter(n => n.toLowerCase().includes(query));

        if (matches.length === 0) {
            results.innerHTML = `<div class="p-2 text-sm text-amber-400">No match — this will be submitted as a new item.</div>`;
            results.classList.remove('hidden');
            notice.classList.remove('hidden');
            return;
        }

        results.innerHTML = matches.map(name => {
            const data  = getItemData(name);
            const color = getRarityColor(data.rarity);
            const safe  = name.replace(/'/g, "\\'");
            return `
            <div class="search-result-item" onclick="pickSuggestItem('${safe}')">
                <div class="search-result-name">
                    <div class="rarity-dot" style="background-color:${color};"></div>
                    <span>${name}</span>
                </div>
                <span class="search-result-price" style="background-color:${color};">${formatLS(data.price)}</span>
            </div>`;
        }).join('');
        results.classList.remove('hidden');
    };
}

function pickSuggestItem(itemName) {
    selectedSuggestItem = itemName;
    document.getElementById('suggestItemName').value = itemName;
    document.getElementById('suggestItemResults').classList.add('hidden');
    document.getElementById('newItemNotice').classList.add('hidden');
}

async function submitSuggestion() {
    const itemName       = document.getElementById('suggestItemName').value.trim();
    const suggestedPrice = parseFloat(document.getElementById('suggestPrice').value);
    const reason          = document.getElementById('suggestReason').value.trim();
    const statusEl        = document.getElementById('suggestionStatus');

    if (!itemName || isNaN(suggestedPrice) || suggestedPrice <= 0) {
        statusEl.textContent = 'Please enter a valid item name and price.';
        statusEl.className   = 'text-red-400 text-sm mt-2';
        return;
    }

    const currentItem = getItemData(itemName);
    const isNewItem    = !currentItem;

    const ok = await supabaseInsert('price_suggestions', {
        server_id:       currentServerId,
        item_name:       itemName,
        suggested_price: suggestedPrice,
        current_price:   currentItem ? currentItem.price : null,
        reason:          isNewItem ? `[NEW ITEM] ${reason}` : (reason || null)
    });

    if (ok) {
        statusEl.textContent = isNewItem
            ? 'New item suggestion submitted for review!'
            : 'Suggestion submitted! Thank you.';
        statusEl.className = 'text-green-400 text-sm mt-2';
        setTimeout(closeSuggestionModal, 1500);
    } else {
        statusEl.textContent = 'Something went wrong. Please try again.';
        statusEl.className   = 'text-red-400 text-sm mt-2';
    }
}

// =============================================================
// ADMIN PANEL
// =============================================================

function closeAdminModal() {
    document.getElementById('adminModal').classList.add('hidden');
}

async function loadAdminPanel() {
    const content = document.getElementById('adminPanelContent');
    content.innerHTML = '<p class="text-gray-400">Loading...</p>';

    const suggestions = await supabaseFetch(
        `price_suggestions?select=*&status=eq.pending&order=created_at.desc`
    );

    if (!suggestions.length) {
        content.innerHTML = '<p class="text-gray-400">No pending suggestions.</p>';
        return;
    }

    const grouped = {};
    suggestions.forEach(s => {
        if (!grouped[s.item_name]) grouped[s.item_name] = [];
        grouped[s.item_name].push(s);
    });

    const sortedEntries = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);

    let html = '';
    for (const [itemName, entries] of sortedEntries) {
        const avgPrice  = (entries.reduce((sum, e) => sum + Number(e.suggested_price), 0) / entries.length).toFixed(2);
        const isNewItem = entries.some(e => e.reason && e.reason.startsWith('[NEW ITEM]'));
        const safe      = itemName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const safeId    = itemName.replace(/[^a-zA-Z0-9]/g, '');

        if (isNewItem) {
            html += `
            <div class="bg-gray-900 p-4 rounded-lg border border-purple-700 mb-3">
                <div class="flex justify-between items-center mb-2">
                    <span class="font-bold text-purple-400">${itemName} <span class="text-xs">(NEW ITEM)</span></span>
                    <span class="text-xs text-gray-400">${entries.length} suggestion${entries.length > 1 ? 's' : ''}</span>
                </div>
                <div class="text-sm mb-2">
                    <span class="text-gray-400">Suggested avg price: </span>
                    <span class="text-green-400">${formatLS(avgPrice)}</span>
                </div>
                <div class="space-y-1 mb-3">
                    ${entries.map(e => `
                        <div class="text-xs text-gray-500 border-t border-gray-700/50 pt-1">
                            ${formatLS(e.suggested_price)} — ${(e.reason || '').replace('[NEW ITEM] ', '')}
                        </div>
                    `).join('')}
                </div>
                <div class="grid grid-cols-2 gap-2 mb-2">
                    <select id="newCat-${safeId}" class="bg-gray-700 border border-gray-600 rounded text-xs p-1">
                        <option value="W">Weapon</option>
                        <option value="A">Armor Set</option>
                        <option value="P">Armor Piece</option>
                        <option value="O">Orb</option>
                        <option value="R">Resource</option>
                        <option value="F">Food</option>
                        <option value="G">Gadget</option>
                        <option value="K">Key/Collectible</option>
                    </select>
                    <select id="newRar-${safeId}" class="bg-gray-700 border border-gray-600 rounded text-xs p-1">
                        <option value="N">Non-Gear</option>
                        <option value="G">Green</option>
                        <option value="B">Blue</option>
                        <option value="P">Purple</option>
                        <option value="L">Legendary</option>
                    </select>
                </div>
                <div class="flex gap-2">
                    <button onclick="addNewItem('${safe}', ${avgPrice})"
                        class="flex-1 py-1 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold rounded transition">
                        Add as New Item
                    </button>
                    <button onclick="rejectSuggestions('${safe}')"
                        class="flex-1 py-1 bg-red-800 hover:bg-red-700 text-white text-xs font-bold rounded transition">
                        Reject All
                    </button>
                </div>
            </div>`;
        } else {
            const currentPrice = entries[0].current_price;
            html += `
            <div class="bg-gray-900 p-4 rounded-lg border border-gray-700 mb-3">
                <div class="flex justify-between items-center mb-2">
                    <span class="font-bold text-amber-400">${itemName}</span>
                    <span class="text-xs text-gray-400">${entries.length} suggestion${entries.length > 1 ? 's' : ''}</span>
                </div>
                <div class="text-sm mb-2">
                    <span class="text-gray-400">Current price: </span>
                    <span class="text-white">${currentPrice !== null ? formatLS(currentPrice) : 'No current price (new item)'}</span>
                    <span class="text-gray-400 ml-4">Suggested avg: </span>
                    <span class="text-green-400">${formatLS(avgPrice)}</span>
                </div>
                <div class="space-y-1 mb-3">
                    ${entries.map(e => `
                        <div class="text-xs text-gray-500 border-t border-gray-700/50 pt-1">
                            ${formatLS(e.suggested_price)}${e.reason ? ' — ' + e.reason : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="flex gap-2">
                    <button onclick="approvePrice('${safe}', ${avgPrice})"
                        class="flex-1 py-1 bg-green-700 hover:bg-green-600 text-white text-xs font-bold rounded transition">
                        Approve Avg (${formatLS(avgPrice)})
                    </button>
                    <button onclick="rejectSuggestions('${safe}')"
                        class="flex-1 py-1 bg-red-800 hover:bg-red-700 text-white text-xs font-bold rounded transition">
                        Reject All
                    </button>
                </div>
            </div>`;
        }
    }
    content.innerHTML = html;
}

const EDGE_FUNCTION_URL = 'https://iostylnrwoytrbygqbzv.supabase.co/functions/v1/admin-actions';

async function callAdminAction(action, payload) {
    try {
        const res = await fetch(EDGE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password: ADMIN_PASSWORD, action, payload })
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
// HIDDEN ADMIN TRIGGER — click bottom-left corner 3 times
// =============================================================

let adminClicks = 0;
let adminTimer  = null;

document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById('adminTrigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
        adminClicks++;
        clearTimeout(adminTimer);
        adminTimer = setTimeout(() => { adminClicks = 0; }, 2000);

        if (adminClicks >= 3) {
            adminClicks = 0;
            const pwd = prompt('Admin password:');
            if (pwd === ADMIN_PASSWORD) {
                document.getElementById('adminModal').classList.remove('hidden');
                loadAdminPanel();
            } else if (pwd !== null) {
                alert('Incorrect password.');
            }
        }
    });
});

// =============================================================
// ABOUT SECTION
// =============================================================

const ITEM_CATEGORIES = {
    'Orbs':               ['Small Orb I','Small Orb II','Small Orb III','Medium Orb I','Medium Orb II','Medium Orb III','Large Orb I','Large Orb II','Large Orb III'],
    'Weapons — Green/Blue':['Green Weapon','Blue Weapons','Ice Club','Ice Crossbow','Ice Dagger','Ice Support Staff','Ice Combat Staff','Ice Shield and Sword'],
    'Weapons — Purple':   ['Dragon Bite','Dragon Bow','Fire Bow','5-Shot Crossbow','Dragon Combat Staff','Wrath Staff','Reaper Staff','Cutter of Grey Clan','Dragon Dagger','Fire Dagger','Dragon Shield and Sword','Nord Shield and Sword','Dragon Sword','Fire Axe','Cleaver','Giant Hammer','Ice Axe','Protector Spear','Skoll Claws','Ice Scythe',"Hel's Staff",'Dragon Support Staff','Kirga Flask',"Surt's Flask"],
    'Weapons — Legendary':['THOR Combat Staff','THOR Support Staff','THOR Bow','THOR SNS','THOR Flask','THOR Dagger','THOR Axe','FREYJA Combat Staff','FREYJA Support Staff','FREYJA Crossbow','FREYJA SNS','FREYJA Flask','FREYJA Dagger','FREYJA Mace','ALFAR Combat Staff','ALFAR Support Staff','ALFAR Bow','ALFAR SNS','ALFAR Flask','ALFAR Dagger','ALFAR Axe','ALFAR Mace','ALFAR Spear','ELVEN Combat Staff','ELVEN Support Staff','ELVEN Bow','ELVEN SNS','ELVEN Flask','ELVEN Dagger','ELVEN Spear','YMIR Combat Staff','YMIR Support Staff','YMIR Bow','YMIR SNS','YMIR Flask','YMIR Dagger','YMIR Axe','DWARVEN Combat Staff','DWARVEN Support Staff','DWARVEN Crossbow','DWARVEN SNS','DWARVEN Flask','DWARVEN Dagger','DWARVEN Mace','DWARVEN Axe','BETRAYER Combat Staff','BETRAYER Support Staff','BETRAYER Bow','BETRAYER SNS','BETRAYER Flask','BETRAYER Dagger','BETRAYER Sword','Emperor Sword','Emperor Bow','Emperor Staff','Emperor Crossbow','Master Smith Hammer','Shaman Staff','Retribution Staff','Fire Guardian Crossbow','Valkyrie Lance','Arch Mage Staff','Shadows Dagger','Nosferatu Dagger',"Werewolf's Flask","Wind Mage's Staff",'Bone Mace and Shield',"Ripper's Dagger","Occultist's Flask","Pathfinder's Bow","Protector's Shield and Sword",'Oriental Saber','Thrasher Sword',"Huscarl's Shield and Sword","Hellhound's Sword",'Scythe',"Desert Mage's Staff","Ancestors' Scythe"],
    'Armor — Purple Helms':['Jorgun Helm','Archivist Helm','Instigator Helm','Instigator Chest','Instigator Pants','Instigator Boots','Dragon Helm','Dragon Chest','Dragon Pants','Dragon Boots','Shaman Helm'],
    'Armor — Sets Purple': ['Purple Heavy Set','Purple Medium Set','Purple Light Set','Guardian Set','Chaser Set','Magician Set','Jarl Set'],
    'Armor — Legendary':  ['Warden Set','Scout Set','Sorcerer Set','Heavy Dragon Set','Medium Dragon Set','Light Dragon Set','Barbarian Set','Medium Elven Set','Heavy Elven Set','Light Elven Set','Heavy Betrayer Set','Light Betrayer Set','Medium Betrayer Set','Medium Ymir Set','Heavy Ymir Set','Light Ymir Set','Sand King Set','Light Tribal Set','Witchdoctor Set','Valkyrie Helm','Celestial Dragon Helm',"Protector's Helm","Hellbound's Helm","Occultist's Helm","Huscarl's Helmet","Desert Mage's Turban"],
    'Resources':          ['Construction Pickaxe','Bucket','Set of Tools','Mortar','Copper Nails','Pine Beam','Sturdy Pine Log','Sturdy Limestone','Limestone Brick','Maple Beam','Oats','Oat Seeds','Premium Fertilizer','Improved Fertilizer','Simple Fertilizer','Sturdy Bones','Ancient Tree Log','Ancient Tree Plank','Magic Clay','Clay Brick','Meteorite Ore','Meteorite Ingot','Ancient Rawhide','Ancient Leather','Exquisite Meat',"Loki's Berrie",'Ghost Essence','Hearth Stone','Salt','Gum','Nectar','Steel Pickaxe','Elven Blood','Elven Tool','Medallion of Power','Medallion Base T1','Medallion Base T2','Medallion of Valor','Medallion of Honor','Drowned Chest'],
    'Fishing':            ['Season Fish','Common Fish','Uncommon Fish','Rare Fish','Epic Fish','Bait','Fishing Net'],
    'Food & Potions':     ['Raw Meat','Berries','North Berries','North Meat','Meat','Cooked Food','Goulash','Water Bottle','Carrot','Mushroom Soup','Primrose Soup','Oatmeal','Blood Sausage','Elven Decoction','Healing Pie','Pumpkin Soup','Mead','Mulled Wine','Meat in Honey Sauce','Sushi','Spicy Seafood','Asgardian Honey','Festive Cookies','Fish in Hot Sauce','Ribs','Fish Barbecue','Warrior Elixir','Hunter Elixir','Mage Elixir','Survival Elixir','Speed Potion','Berserk Potion','Shield Potion','Dragon Beer','Dispel Potion','Reflect Potion','Clan Boss Potion','Dexterity Potion','Fury Potion',"Guardian's Potion",'Invisibility Potion','Purification Potion','Elixir of Protector'],
    'Gadgets & Traps':    ['Bolas','Stun Bomb','Fire Bomb','Throwing Axe','Fire Trap','Stun Hammer','Weakening Dart','Healing Totem','Stun Trap','Bowman Scroll','Barrel Scroll','Healing Bomb','Throwing Cleaver','Fear Trap','Rune Hammer','Improved Bandages','Improved Bolas','Decoy Totem',"Odin's Punishment",'Wall of Fire',"Instigator's Trap",'Thunder Totem','Improved Hammer','Rich Fish Soup'],
    'Keys & Collectibles':['Wood Pendant','Steel Pendant','Gold Pendant','Magic Pendant','Sanctum Key','Forge Key','Archive Key','Library Key','Ice Vault Key','Logi Key','Ash Ring','Alfar Key','Alfar Key Part 1','Alfar Key Part 2','Labyrinth Key','Blue Bag','Donation Points','Instant Repair Service','Odin Offering']
};

function populateAboutSection() {
    let html = '';
    for (const [title, items] of Object.entries(ITEM_CATEGORIES)) {
        html += `<h3 class="text-xl font-semibold gold-text mt-4">${title}</h3><ul class="list-none space-y-1">`;
        for (const name of items) {
            const data = getItemData(name);
            if (!data) continue;
            const color = getRarityColor(data.rarity);
            html += `
            <li class="flex justify-between items-center py-1 border-b border-gray-700/50">
                <span>${name}</span>
                <span class="px-2 py-0.5 rounded text-xs font-semibold" style="background-color:${color};color:#1f2937;">${formatLS(data.price)}</span>
            </li>`;
        }
        html += '</ul>';
    }
    document.getElementById('itemListDisplay').innerHTML = html;
}

// =============================================================
// INIT
// =============================================================

window.onload = async function () {
    showLoading(true);
    await loadServers();
    showLoading(false);

    document.getElementById('targetSearch').addEventListener('input', e =>
        handleSearchInput(e, 'targetSearchResults', true));

    document.getElementById('targetQuantity').addEventListener('input', e => {
        targetState.quantity = parseInt(e.target.value) || 1;
        updateCalculations();
    });

    document.getElementById('targetGearControls').addEventListener('input', e => {
        if (e.target.id === 'targetUpgradeLevel') {
            targetState.level = parseInt(e.target.value);
            document.getElementById('targetLevelLabel').textContent = `+${targetState.level}`;
            updateCalculations();
        }
    });

    document.getElementById('targetBrokenToggle').addEventListener('change', e => {
        targetState.isBroken = e.target.checked;
        updateCalculations();
    });

    document.getElementById('targetPieceButtons').addEventListener('click', e => {
        if (e.target.hasAttribute('data-piece')) {
            targetState.armorPiece = e.target.dataset.piece;
            updateGearControls(targetState, null, true);
            updateCalculations();
        }
    });

    document.getElementById('addOfferSlot').addEventListener('click', () => {
        if (offerStates.length < 5) {
            offerStates.push({ name: '', quantity: 1, level: 0, isBroken: false, armorPiece: 'Full Set' });
            renderOfferSlots();
        }
        document.getElementById('addOfferSlot').disabled = offerStates.length >= 5;
    });

    if (offerStates.length === 0) document.getElementById('addOfferSlot').click();
};

// Expose globals
window.selectItem           = selectItem;
window.openSuggestionModal  = openSuggestionModal;
window.closeSuggestionModal = closeSuggestionModal;
window.submitSuggestion     = submitSuggestion;
window.pickSuggestItem      = pickSuggestItem;
window.closeAdminModal      = closeAdminModal;
window.approvePrice         = approvePrice;
window.rejectSuggestions    = rejectSuggestions;
window.addNewItem           = addNewItem;

// =============================================================
// INIT
// =============================================================

window.onload = async function () {
    showLoading(true);
    await loadServers();
    showLoading(false);

    // Target listeners
    document.getElementById('targetSearch').addEventListener('input', e =>
        handleSearchInput(e, 'targetSearchResults', true));

    document.getElementById('targetQuantity').addEventListener('input', e => {
        targetState.quantity = parseInt(e.target.value) || 1;
        updateCalculations();
    });

    document.getElementById('targetGearControls').addEventListener('input', e => {
        if (e.target.id === 'targetUpgradeLevel') {
            targetState.level = parseInt(e.target.value);
            document.getElementById('targetLevelLabel').textContent = `+${targetState.level}`;
            updateCalculations();
        }
    });

    document.getElementById('targetBrokenToggle').addEventListener('change', e => {
        targetState.isBroken = e.target.checked;
        updateCalculations();
    });

    document.getElementById('targetPieceButtons').addEventListener('click', e => {
        if (e.target.hasAttribute('data-piece')) {
            targetState.armorPiece = e.target.dataset.piece;
            updateGearControls(targetState, null, true);
            updateCalculations();
        }
    });

    // Add offer slot
    document.getElementById('addOfferSlot').addEventListener('click', () => {
        if (offerStates.length < 5) {
            offerStates.push({ name: '', quantity: 1, level: 0, isBroken: false, armorPiece: 'Full Set' });
            renderOfferSlots();
        }
        document.getElementById('addOfferSlot').disabled = offerStates.length >= 5;
    });

    // Start with one slot
    if (offerStates.length === 0) document.getElementById('addOfferSlot').click();
};

// Expose globals
window.selectItem           = selectItem;
window.openSuggestionModal  = openSuggestionModal;
window.closeSuggestionModal = closeSuggestionModal;
window.submitSuggestion     = submitSuggestion;
window.pickSuggestItem      = pickSuggestItem;
window.closeAdminModal      = closeAdminModal;
window.approvePrice         = approvePrice;
window.rejectSuggestions    = rejectSuggestions;
window.addNewItem           = addNewItem;
