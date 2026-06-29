// --- SUPABASE CONFIG ---
const SUPABASE_URL = 'https://wahedllttsxoraihmwzm.supabase.co';
const SUPABASE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhaGVkbGx0dHN4b3JhaWhtd3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3Mjk3NTEsImV4cCI6MjA5ODMwNTc1MX0.lqGNfyUsSZ6ePHz3Li1bjNKiy4mAxk44pHx5I8Qxg50

// --- STATE ---
let ITEM_DATABASE = {};
let currentServerId = null;// --- SUPABASE CONFIG ---
const SUPABASE_URL = 'https://wahedllttsxoraihmwzm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhaGVkbGx0dHN4b3JhaWhtd3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3Mjk3NTEsImV4cCI6MjA5ODMwNTc1MX0.lqGNfyUsSZ6ePHz3Li1bjNKiy4mAxk44pHx5I8Qxg50';

// --- STATE ---
let ITEM_DATABASE = {};
let currentServerId = null;
let targetState = { name: '', quantity: 1, level: 0, isBroken: false, armorPiece: 'Full Set' };
let offerStates = [];

const ARMOR_WEIGHTING = { 'Full Set': 1.00, 'Head': 0.20, 'Chest': 0.30, 'Pants': 0.22, 'Boots': 0.28 };
const UPGRADE_LIMITS = { 'G': 3, 'B': 3, 'P': 5, 'L': 10, 'N': 0 };

// --- SUPABASE HELPERS ---
async function supabaseFetch(endpoint) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });
    return res.json();
}

async function supabaseInsert(table, data) {
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
}

// --- LOAD SERVERS ---
async function loadServers() {
    const servers = await supabaseFetch('servers?select=*&order=name');
    const selector = document.getElementById('serverSelector');
    selector.innerHTML = servers.map(s =>
        `<option value="${s.id}">${s.name}</option>`
    ).join('');
    if (servers.length > 0) {
        currentServerId = servers[0].id;
        await loadItems();
    }
    selector.addEventListener('change', async (e) => {
        currentServerId = e.target.value;
        showLoading(true);
        await loadItems();
        resetTrade();
        showLoading(false);
    });
}

// --- LOAD ITEMS FROM SUPABASE ---
async function loadItems() {
    const items = await supabaseFetch(
        `items?select=*&server_id=eq.${currentServerId}&order=name`
    );
    ITEM_DATABASE = {};
    items.forEach(item => {
        ITEM_DATABASE[item.name] = {
            price: Number(item.price),
            category: item.category,
            rarity: item.rarity,
            isGear: ['W', 'A', 'P'].includes(item.category),
            isArmorSet: item.category === 'A',
            isConsumable: ['F', 'G'].includes(item.category)
        };
    });
    populateAboutSection();
}

// --- UTILITY FUNCTIONS ---
function formatLS(value) {
    const numValue = Number(value);
    if (isNaN(numValue)) return '0.00 LS';
    return numValue.toFixed(2) + ' LS';
}

function getRarityColor(rarity) {
    switch (rarity) {
        case 'G': return 'var(--color-gear-green)';
        case 'B': return 'var(--color-gear-blue)';
        case 'P': return 'var(--color-gear-purple)';
        case 'L': return 'var(--color-gear-legendary)';
        default: return 'var(--color-text-medium)';
    }
}

function getItemData(itemName) {
    const trimmed = itemName ? itemName.trim() : '';
    return ITEM_DATABASE[trimmed] || null;
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

// --- CALCULATIONS ---
function calculateItemLS(itemName, quantity, level, isBroken, armorPiece) {
    const item = getItemData(itemName);
    if (!item || !Number.isFinite(item.price) || item.price < 0 || quantity <= 0) return 0;
    let baseLS = item.price;
    if (item.isArmorSet && armorPiece && armorPiece !== 'Full Set') {
        baseLS *= ARMOR_WEIGHTING[armorPiece] || 1.0;
    }
    if (item.isGear) {
        const upgradeMultiplier = 1 + (level * (item.rarity === 'L' ? 0.15 : 0.10));
        const brokenMultiplier = isBroken ? 0.5 : 1.0;
        return baseLS * brokenMultiplier * upgradeMultiplier * quantity;
    }
    return baseLS * quantity;
}

function updateCalculations() {
    const targetItem = getItemData(targetState.name);
    let targetLS = 0;
    if (targetItem) {
        targetLS = calculateItemLS(targetState.name, targetState.quantity, targetState.level, targetState.isBroken, targetState.armorPiece);
    }
    document.getElementById('their-total-ls').textContent = formatLS(targetLS);

    let totalOfferLS = 0;
    offerStates.forEach((state, index) => {
        let itemLS = 0;
        if (state.name) {
            itemLS = calculateItemLS(state.name, state.quantity, state.level, state.isBroken, state.armorPiece);
        }
        totalOfferLS += itemLS;
        const chip = document.getElementById(`offerLSDisplay-${index}`);
        if (chip) chip.textContent = formatLS(itemLS);
    });
    document.getElementById('your-total-ls').textContent = formatLS(totalOfferLS);

    const liveDiff = totalOfferLS - targetLS;
    const liveDiffElem = document.getElementById('liveDifference');
    liveDiffElem.textContent = formatLS(liveDiff);
    liveDiffElem.classList.remove('text-red-400', 'text-green-400', 'text-gray-300');
    const tolerance = 0.01;
    liveDiffElem.classList.add(liveDiff > tolerance ? 'text-green-400' : (liveDiff < -tolerance ? 'text-red-400' : 'text-gray-300'));

    const totalValue = targetLS + totalOfferLS;
    const offerPct = totalValue > 0 ? (totalOfferLS / totalValue) * 100 : 50;
    const targetPct = totalValue > 0 ? (targetLS / totalValue) * 100 : 50;
    document.getElementById('balanceBarOffer').style.width = offerPct + '%';
    document.getElementById('balanceBarTarget').style.width = targetPct + '%';

    let verdictText = '', suggestionText = '', statusClass = 'text-gray-300';
    const absDiff = Math.abs(liveDiff);
    const verdictBox = document.getElementById('verdictBox');
    verdictBox.classList.remove('status-balanced', 'status-overpaid', 'status-deficit');

    if (targetLS === 0 || totalOfferLS === 0) {
        verdictText = "Waiting for input...";
        suggestionText = "Awaiting calculation...";
    } else if (absDiff < tolerance) {
        verdictText = "PERFECT TRADE BALANCE";
        suggestionText = "The trade is balanced within minimal tolerance.";
        statusClass = 'text-green-500';
        verdictBox.classList.add('status-balanced');
    } else if (liveDiff > tolerance) {
        statusClass = 'text-green-400';
        verdictText = "OVERPAID - REFUND REQUIRED";
        verdictBox.classList.add('status-overpaid');
        if (targetItem && targetItem.isConsumable && targetItem.price > 0) {
            const extraItems = Math.floor(liveDiff / targetItem.price);
            if (extraItems > 0) {
                const valueUsed = extraItems * targetItem.price;
                const finalExcess = liveDiff - valueUsed;
                suggestionText = `The merchant owes you ${formatLS(liveDiff)}. You could instead acquire <strong>${extraItems} more ${targetState.name}</strong> (value: ${formatLS(valueUsed)}). Remaining balance: ${formatLS(finalExcess)}.`;
            } else {
                suggestionText = `The merchant owes <strong>${formatLS(liveDiff)}</strong>. Suggested refund items:<br>${suggestItems(liveDiff)}`;
            }
        } else {
            suggestionText = `The merchant owes <strong>${formatLS(liveDiff)}</strong>. Suggested refund items:<br>${suggestItems(liveDiff)}`;
        }
    } else {
        statusClass = 'text-red-400';
        verdictText = "DEFICIT MUST BE MET";
        verdictBox.classList.add('status-deficit');
        suggestionText = `You are short by <strong>${formatLS(absDiff)}</strong>. Suggested items to add:<br>${suggestItems(absDiff)}`;
    }

    document.getElementById('tradeVerdict').textContent = verdictText;
    document.getElementById('tradeVerdict').className = `text-center text-lg font-semibold ${statusClass}`;
    document.getElementById('tradeSuggestion').innerHTML = suggestionText;

    const balanceStatusElem = document.getElementById('balanceStatusText');
    if (liveDiff > tolerance) {
        balanceStatusElem.textContent = "Your offer is too high! Merchant owes you change.";
    } else if (liveDiff < -tolerance) {
        balanceStatusElem.textContent = "Your offer is too low! You need to add more items.";
    } else if (targetLS > 0 || totalOfferLS > 0) {
        balanceStatusElem.textContent = "Trade is perfectly balanced.";
    } else {
        balanceStatusElem.textContent = "Select items to begin trade.";
    }
}

// --- SUGGESTION ENGINE ---
const SUGGESTION_ITEMS = ["Common Fish", "Loki's Berrie", "Ghost Essence", "Sanctum Key", "Salt", "Ash Ring", "Blue Bag", "Forge Key", "Medium Orb I", "Logi Key", "Archive Key", "Library Key"];

function suggestItems(targetValue) {
    let suggestions = [];
    const sortedItems = SUGGESTION_ITEMS
        .map(name => ({ name: name.trim(), data: getItemData(name.trim()) }))
        .filter(item => item.data && Number.isFinite(item.data.price) && item.data.price > 0)
        .sort((a, b) => b.data.price - a.data.price);
    if (sortedItems.length === 0) return "Could not generate suggestions.";
    for (const item of sortedItems) {
        const quantity = Math.floor(targetValue / item.data.price);
        if (quantity > 0) {
            const suggestionValue = quantity * item.data.price;
            suggestions.push({ string: `<li><strong>${quantity}x ${item.name}</strong> (${formatLS(suggestionValue)})</li>`, value: suggestionValue });
        }
    }
    if (suggestions.length === 0) {
        const cheapest = sortedItems[sortedItems.length - 1];
        if (!cheapest) return "No suitable items found.";
        const qty = Math.ceil(targetValue / cheapest.data.price);
        return `<ul><li>Try adding <strong>${qty}x ${cheapest.name}</strong> (${formatLS(qty * cheapest.data.price)})</li></ul>`;
    }
    return '<ul>' + suggestions
        .sort((a, b) => Math.abs(a.value - targetValue) - Math.abs(b.value - targetValue))
        .slice(0, 3)
        .map(s => s.string)
        .join('') + '</ul>';
}

// --- SEARCH ---
function handleSearchInput(event, resultsId, stateObject, isTarget) {
    const query = event.target.value.trim().toLowerCase();
    const resultsDiv = document.getElementById(resultsId);
    if (query.length < 2) { resultsDiv.classList.add('hidden'); return; }
    let html = '';
    Object.keys(ITEM_DATABASE).forEach(name => {
        if (name.toLowerCase().includes(query)) {
            const data = getItemData(name);
            if (data) {
                const color = getRarityColor(data.rarity);
                const slotId = isTarget ? 'target' : resultsId.replace('offerSearchResults-', '');
                html += `
                <div class="search-result-item" onclick="selectItem('${name.replace(/'/g, "\\'")}', '${slotId}', ${isTarget})">
                    <div class="search-result-name">
                        <div class="rarity-dot" style="background-color:${color};"></div>
                        <span>${name}</span>
                    </div>
                    <span class="search-result-price" style="background-color:${color};">${formatLS(data.price)}</span>
                </div>`;
            }
        }
    });
    resultsDiv.innerHTML = html || '<div class="p-2 text-sm text-gray-400">No items found.</div>';
    resultsDiv.classList.remove('hidden');
}

function selectItem(itemName, slotId, isTarget) {
    const item = getItemData(itemName);
    if (!item) return;
    const state = isTarget ? targetState : offerStates[parseInt(slotId)];
    if (!state) return;
    state.name = itemName;
    state.level = 0;
    state.isBroken = false;
    state.armorPiece = item.isArmorSet ? 'Full Set' : 'N/A';
    const nameDisplayId = isTarget ? 'targetItemNameDisplay' : `offerItemNameDisplay-${slotId}`;
    const searchInputId = isTarget ? 'targetSearch' : `offerSearch-${slotId}`;
    const searchResultsId = isTarget ? 'targetSearchResults' : `offerSearchResults-${slotId}`;
    document.getElementById(nameDisplayId).textContent = itemName;
    document.getElementById(searchInputId).value = '';
    document.getElementById(searchResultsId).classList.add('hidden');
    updateGearControls(state, slotId, isTarget);
    updateCalculations();
}

function updateGearControls(state, slotId, isTarget) {
    const item = getItemData(state.name);
    const prefix = isTarget ? 'target' : `offer`;
    const suffix = isTarget ? '' : `-${slotId}`;
    const gearControls = document.getElementById(isTarget ? 'targetGearControls' : `offerGearControls-${slotId}`);
    if (!item || !item.isGear) { gearControls.classList.add('hidden'); return; }
    gearControls.classList.remove('hidden');
    document.getElementById(isTarget ? 'targetBaseLSDisplay' : `offerBaseLSDisplay-${slotId}`).textContent = formatLS(item.price);
    const maxLevel = UPGRADE_LIMITS[item.rarity] || 0;
    const levelInput = document.getElementById(isTarget ? 'targetUpgradeLevel' : `offerUpgradeLevel-${slotId}`);
    levelInput.max = maxLevel;
    state.level = Math.min(Number(state.level) || 0, maxLevel);
    levelInput.value = state.level;
    document.getElementById(isTarget ? 'targetLevelLabel' : `offerLevelLabel-${slotId}`).textContent = `+${state.level}`;
    document.getElementById(isTarget ? 'targetBrokenToggle' : `offerBrokenToggle-${slotId}`).checked = state.isBroken;
    const armorSelector = document.getElementById(isTarget ? 'targetArmorSelector' : `offerArmorSelector-${slotId}`);
    if (item.isArmorSet) {
        armorSelector.classList.remove('hidden');
        const group = isTarget
            ? document.getElementById('targetPieceButtons')
            : document.querySelector(`#offerArmorSelector-${slotId} .piece-button-group`);
        if (group) {
            group.querySelectorAll('[data-piece]').forEach(btn => {
                btn.classList.toggle('bg-indigo-600', btn.dataset.piece === state.armorPiece);
                btn.classList.toggle('hover:bg-indigo-700', btn.dataset.piece === state.armorPiece);
                btn.classList.toggle('bg-gray-700', btn.dataset.piece !== state.armorPiece);
                btn.classList.toggle('hover:bg-gray-600', btn.dataset.piece !== state.armorPiece);
            });
        }
    } else {
        armorSelector.classList.add('hidden');
    }
}

// --- OFFER SLOTS ---
function createOfferSlotHTML(index) {
    const state = offerStates[index];
    return `
    <div id="offerSlot-${index}" class="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
        <div class="flex justify-between items-center mb-3">
            <h3 class="text-lg font-semibold text-gray-300">Offer Item ${index + 1}</h3>
            <button data-index="${index}" class="remove-offer-btn text-red-500 hover:text-red-400 text-sm font-bold">Remove</button>
        </div>
        <input type="text" id="offerSearch-${index}" placeholder="Search for Item..." class="w-full p-2 mb-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm">
        <div id="offerSearchResults-${index}" class="max-h-40 overflow-y-auto custom-scrollbar bg-gray-700 rounded-md mb-2 hidden"></div>
        <div class="text-sm font-semibold p-2 rounded-md bg-gray-900 border border-gray-700 min-h-[35px] text-gray-400">
            <span class="text-xs text-amber-500 block">Selected:</span>
            <span id="offerItemNameDisplay-${index}">${state.name || 'None'}</span>
        </div>
        <div class="flex items-center space-x-4 mt-4">
            <div class="flex-1">
                <label class="block text-xs font-medium mb-1 text-gray-400">Quantity</label>
                <input type="number" id="offerQuantity-${index}" min="1" value="${state.quantity}" class="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-sm text-center offer-quantity" data-index="${index}">
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
                <label class="block text-sm font-medium text-gray-400">Upgrade Level (<span id="offerLevelLabel-${index}">+0</span>)</label>
                <input type="range" id="offerUpgradeLevel-${index}" min="0" max="0" value="0" class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer offer-upgrade" data-index="${index}">
            </div>
            <div id="offerArmorSelector-${index}" class="hidden">
                <label class="block text-sm font-medium mb-2 text-gray-400">Select Armor Piece</label>
                <div data-index="${index}" class="piece-button-group grid grid-cols-2 gap-2 text-xs">
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
        const target = e.target;
        if (target.id.startsWith('offerSearch-')) {
            const index = parseInt(target.id.split('-')[1]);
            if (!isNaN(index)) handleSearchInput(e, `offerSearchResults-${index}`, offerStates[index], false);
            return;
        }
        const index = parseInt(target.dataset.index);
        if (isNaN(index) || !offerStates[index]) return;
        if (target.classList.contains('offer-quantity')) {
            offerStates[index].quantity = parseInt(target.value) || 1;
        } else if (target.classList.contains('offer-upgrade')) {
            offerStates[index].level = parseInt(target.value);
            document.getElementById(`offerLevelLabel-${index}`).textContent = `+${offerStates[index].level}`;
        }
        updateCalculations();
    });
    container.addEventListener('change', e => {
        const index = parseInt(e.target.dataset.index);
        if (isNaN(index) || !offerStates[index]) return;
        if (e.target.classList.contains('offer-broken')) {
            offerStates[index].isBroken = e.target.checked;
            updateCalculations();
        }
    });
    container.addEventListener('click', e => {
        if (e.target.classList.contains('remove-offer-btn')) {
            const index = parseInt(e.target.dataset.index);
            if (!isNaN(index)) {
                offerStates.splice(index, 1);
                renderOfferSlots();
                document.getElementById('addOfferSlot').disabled = offerStates.length >= 5;
            }
        }
        const pieceButton = e.target.closest('[data-piece]');
        if (pieceButton) {
            const group = e.target.closest('.piece-button-group');
            const index = parseInt(group.dataset.index);
            if (!isNaN(index) && offerStates[index]) {
                offerStates[index].armorPiece = pieceButton.dataset.piece;
                updateGearControls(offerStates[index], index, false);
                updateCalculations();
            }
        }
    });
}

// --- PRICE SUGGESTION MODAL ---
function openSuggestionModal() {
    document.getElementById('suggestionModal').classList.remove('hidden');
}

function closeSuggestionModal() {
    document.getElementById('suggestionModal').classList.add('hidden');
    document.getElementById('suggestionForm').reset();
    document.getElementById('suggestionStatus').textContent = '';
}

async function submitSuggestion() {
    const itemName = document.getElementById('suggestItemName').value.trim();
    const suggestedPrice = parseFloat(document.getElementById('suggestPrice').value);
    const reason = document.getElementById('suggestReason').value.trim();
    const statusEl = document.getElementById('suggestionStatus');

    if (!itemName || isNaN(suggestedPrice) || suggestedPrice <= 0) {
        statusEl.textContent = 'Please fill in item name and a valid price.';
        statusEl.className = 'text-red-400 text-sm mt-2';
        return;
    }

    const currentItem = getItemData(itemName);
    const ok = await supabaseInsert('price_suggestions', {
        server_id: currentServerId,
        item_name: itemName,
        suggested_price: suggestedPrice,
        current_price: currentItem ? currentItem.price : null,
        reason: reason || null
    });

    if (ok) {
        statusEl.textContent = 'Suggestion submitted! Thank you.';
        statusEl.className = 'text-green-400 text-sm mt-2';
        setTimeout(closeSuggestionModal, 1500);
    } else {
        statusEl.textContent = 'Something went wrong. Try again.';
        statusEl.className = 'text-red-400 text-sm mt-2';
    }
}

// --- ABOUT SECTION ---
const itemCategories = {
    "Orbs": ["Small Orb I", "Small Orb II", "Small Orb III", "Medium Orb I", "Medium Orb II", "Medium Orb III", "Large Orb I", "Large Orb II", "Large Orb III"],
    "Weapons - Green / Blue": ["Green Weapon", "Blue Weapons", "Ice Club", "Ice Crossbow", "Ice Dagger", "Ice Support Staff", "Ice Combat Staff", "Ice Shield and Sword"],
    "Weapons - Purple": ["Dragon Bite", "Dragon Bow", "Fire Bow", "5-Shot Crossbow", "Dragon Combat Staff", "Wrath Staff", "Reaper Staff", "Cutter of Grey Clan", "Dragon Dagger", "Fire Dagger", "Dragon Shield and Sword", "Nord Shield and Sword", "Dragon Sword", "Fire Axe", "Cleaver", "Giant Hammer", "Ice Axe", "Protector Spear", "Skoll Claws", "Ice Scythe", "Hel's Staff", "Dragon Support Staff", "Kirga Flask", "Surt's Flask"],
    "Weapons - Legendary": ["THOR Combat Staff", "THOR Support Staff", "THOR Bow", "THOR SNS", "THOR Flask", "THOR Dagger", "THOR Axe", "FREYJA Combat Staff", "FREYJA Support Staff", "FREYJA Crossbow", "FREYJA SNS", "FREYJA Flask", "FREYJA Dagger", "FREYJA Mace", "ALFAR Combat Staff", "ALFAR Support Staff", "ALFAR Bow", "ALFAR SNS", "ALFAR Flask", "ALFAR Dagger", "ALFAR Axe", "ALFAR Mace", "ALFAR Spear", "ELVEN Combat Staff", "ELVEN Support Staff", "ELVEN Bow", "ELVEN SNS", "ELVEN Flask", "ELVEN Dagger", "ELVEN Spear", "YMIR Combat Staff", "YMIR Support Staff", "YMIR Bow", "YMIR SNS", "YMIR Flask", "YMIR Dagger", "YMIR Axe", "DWARVEN Combat Staff", "DWARVEN Support Staff", "DWARVEN Crossbow", "DWARVEN SNS", "DWARVEN Flask", "DWARVEN Dagger", "DWARVEN Mace", "DWARVEN Axe", "BETRAYER Combat Staff", "BETRAYER Support Staff", "BETRAYER Bow", "BETRAYER SNS", "BETRAYER Flask", "BETRAYER Dagger", "BETRAYER Sword", "Emperor Sword", "Emperor Bow", "Emperor Staff", "Emperor Crossbow", "Master Smith Hammer", "Shaman Staff", "Retribution Staff", "Fire Guardian Crossbow", "Valkyrie Lance", "Arch Mage Staff", "Shadows Dagger", "Nosferatu Dagger", "Werewolf's Flask", "Wind Mage's Staff", "Bone Mace and Shield", "Ripper's Dagger", "Occultist's Flask", "Pathfinder's Bow", "Protector's Shield and Sword", "Oriental Saber", "Thrasher Sword", "Huscarl's Shield and Sword", "Hellhound's Sword", "Scythe", "Desert Mage's Staff", "Ancestors' Scythe"],
    "Armor - Purple Helms": ["Jorgun Helm", "Archivist Helm", "Instigator Helm", "Instigator Chest", "Instigator Pants", "Instigator Boots", "Dragon Helm", "Dragon Chest", "Dragon Pants", "Dragon Boots", "Shaman Helm"],
    "Armor - Legendary": ["Warden Set", "Scout Set", "Sorcerer Set", "Heavy Dragon Set", "Medium Dragon Set", "Light Dragon Set", "Barbarian Set", "Medium Elven Set", "Heavy Elven Set", "Light Elven Set", "Heavy Betrayer Set", "Light Betrayer Set", "Medium Betrayer Set", "Medium Ymir Set", "Heavy Ymir Set", "Light Ymir Set", "Sand King Set", "Light Tribal Set", "Witchdoctor Set", "Valkyrie Helm", "Celestial Dragon Helm", "Protector's Helm", "Hellbound's Helm", "Occultist's Helm", "Huscarl's Helmet", "Desert Mage's Turban"],
    "Resources": ["Construction Pickaxe", "Bucket", "Set of Tools", "Mortar", "Copper Nails", "Pine Beam", "Sturdy Pine Log", "Sturdy Limestone", "Limestone Brick", "Maple Beam", "Oats", "Oat Seeds", "Premium Fertilizer", "Improved Fertilizer", "Simple Fertilizer", "Sturdy Bones", "Ancient Tree Log", "Ancient Tree Plank", "Magic Clay", "Clay Brick", "Meteorite Ore", "Meteorite Ingot", "Ancient Rawhide", "Ancient Leather", "Exquisite Meat", "Loki's Berrie", "Ghost Essence", "Hearth Stone", "Salt", "Gum", "Nectar", "Steel Pickaxe", "Elven Blood", "Elven Tool", "Medallion of Power", "Medallion Base T1", "Medallion Base T2", "Medallion of Valor", "Medallion of Honor", "Drowned Chest"],
    "Fishing": ["Season Fish", "Common Fish", "Uncommon Fish", "Rare Fish", "Epic Fish", "Bait", "Fishing Net"],
    "Food & Potions": ["Raw Meat", "Berries", "North Berries", "North Meat", "Meat", "Cooked Food", "Goulash", "Water Bottle", "Carrot", "Mushroom Soup", "Primrose Soup", "Oatmeal", "Blood Sausage", "Elven Decoction", "Healing Pie", "Pumpkin Soup", "Mead", "Mulled Wine", "Meat in Honey Sauce", "Sushi", "Spicy Seafood", "Asgardian Honey", "Festive Cookies", "Fish in Hot Sauce", "Ribs", "Fish Barbecue", "Warrior Elixir", "Hunter Elixir", "Mage Elixir", "Survival Elixir", "Speed Potion", "Berserk Potion", "Shield Potion", "Dragon Beer", "Dispel Potion", "Reflect Potion", "Clan Boss Potion", "Dexterity Potion", "Fury Potion", "Guardian's Potion", "Invisibility Potion", "Purification Potion", "Elixir of Protector"],
    "Gadgets & Traps": ["Bolas", "Stun Bomb", "Fire Bomb", "Throwing Axe", "Fire Trap", "Stun Hammer", "Weakening Dart", "Healing Totem", "Stun Trap", "Bowman Scroll", "Barrel Scroll", "Healing Bomb", "Throwing Cleaver", "Fear Trap", "Rune Hammer", "Improved Bandages", "Improved Bolas", "Decoy Totem", "Odin's Punishment", "Wall of Fire", "Instigator's Trap", "Thunder Totem", "Improved Hammer", "Rich Fish Soup"],
    "Keys & Collectibles": ["Wood Pendant", "Steel Pendant", "Gold Pendant", "Magic Pendant", "Sanctum Key", "Forge Key", "Archive Key", "Library Key", "Ice Vault Key", "Logi Key", "Ash Ring", "Alfar Key", "Alfar Key Part 1", "Alfar Key Part 2", "Labyrinth Key", "Blue Bag", "Donation Points", "Instant Repair Service", "Odin Offering"]
};

function populateAboutSection() {
    let html = '';
    for (const [title, items] of Object.entries(itemCategories)) {
        html += `<h3 class="text-xl font-semibold gold-text mt-4">${title}</h3><ul class="list-none space-y-1">`;
        for (const name of items) {
            const data = getItemData(name);
            if (!data) continue;
            const color = getRarityColor(data.rarity);
            html += `<li class="flex justify-between items-center py-1 border-b border-gray-700/50">
                <span>${name}</span>
                <span class="px-2 py-0.5 rounded text-xs font-semibold" style="background-color:${color};color:#1f2937;">${formatLS(data.price)}</span>
            </li>`;
        }
        html += '</ul>';
    }
    document.getElementById('itemListDisplay').innerHTML = html;
}

// --- INIT ---
window.onload = async function () {
    showLoading(true);
    await loadServers();
    showLoading(false);

    document.getElementById('targetSearch').addEventListener('input', e =>
        handleSearchInput(e, 'targetSearchResults', targetState, true));
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

window.selectItem = selectItem;
window.openSuggestionModal = openSuggestionModal;
window.closeSuggestionModal = closeSuggestionModal;
window.submitSuggestion = submitSuggestion;
let targetState = { name: '', quantity: 1, level: 0, isBroken: false, armorPiece: 'Full Set' };
let offerStates = [];

const ARMOR_WEIGHTING = { 'Full Set': 1.00, 'Head': 0.20, 'Chest': 0.30, 'Pants': 0.22, 'Boots': 0.28 };
const UPGRADE_LIMITS = { 'G': 3, 'B': 3, 'P': 5, 'L': 10, 'N': 0 };

// --- SUPABASE HELPERS ---
async function supabaseFetch(endpoint) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });
    return res.json();
}

async function supabaseInsert(table, data) {
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
}

// --- LOAD SERVERS ---
async function loadServers() {
    try {
        console.log("Fetching servers...");
        const servers = await supabaseFetch('servers?select=*&order=name');
        
        // Debugging: see what Supabase sent back in the browser console
        console.log("Servers received:", servers);

        if (!Array.isArray(servers)) {
            console.error("Supabase did not return an array. Check your API key/URL.");
            return;
        }

        const selector = document.getElementById('serverSelector');
        if (!selector) {
            console.error("Could not find element with id 'serverSelector' in your HTML!");
            return;
        }

        selector.innerHTML = servers.map(s =>
            `<option value="${s.id}">${s.name}</option>`
        ).join('');
        
        if (servers.length > 0) {
            currentServerId = servers[0].id;
            await loadItems();
        }
    } catch (err) {
        console.error("Error in loadServers:", err);
    }
}

// --- LOAD ITEMS FROM SUPABASE ---
async function loadItems() {
    const items = await supabaseFetch(
        `items?select=*&server_id=eq.${currentServerId}&order=name`
    );
    ITEM_DATABASE = {};
    items.forEach(item => {
        ITEM_DATABASE[item.name] = {
            price: Number(item.price),
            category: item.category,
            rarity: item.rarity,
            isGear: ['W', 'A', 'P'].includes(item.category),
            isArmorSet: item.category === 'A',
            isConsumable: ['F', 'G'].includes(item.category)
        };
    });
    populateAboutSection();
}

// --- ADMIN FUNCTIONS ---
async function loadAdminPanel() {
    const { data: suggestions } = await supabaseFetch('price_suggestions?status=eq.pending');
    
    const container = document.getElementById('adminPanel');
    container.innerHTML = suggestions.map(s => `
        <div class="p-4 bg-gray-800 border border-gray-600 rounded mb-2 flex justify-between">
            <div>
                <p class="font-bold">${s.item_name}</p>
                <p class="text-sm">Suggested: ${s.suggested_price} LS (Reason: ${s.reason || 'None'})</p>
            </div>
            <button onclick="approvePrice('${s.id}', '${s.item_name}', ${s.suggested_price})" 
                    class="bg-green-600 px-4 py-2 rounded">Approve</button>
        </div>
    `).join('');
}

async function approvePrice(suggestionId, itemName, newPrice) {
    // 1. Update the item price
    await fetch(`${SUPABASE_URL}/rest/v1/items?name=eq.${encodeURIComponent(itemName)}`, {
        method: 'PATCH',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: newPrice })
    });

    // 2. Mark suggestion as approved
    await fetch(`${SUPABASE_URL}/rest/v1/price_suggestions?id=eq.${suggestionId}`, {
        method: 'PATCH',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
    });

    alert("Price Updated!");
    loadAdminPanel();
    loadItems(); // Refresh the active list
}

function toggleAdminPanel() {
    const wrapper = document.getElementById('adminPanelWrapper');
    wrapper.classList.toggle('hidden');
    if (!wrapper.classList.contains('hidden')) {
        loadAdminPanel(); // Refresh the list whenever we open the panel
    }
}

// Add this to your script.js
function unlockAdmin() {
    const password = prompt("Enter Admin Password:");
    if (password === "Leo123") { // You can change this password to whatever you want
        document.getElementById('admin-only-section').style.display = 'block';
    } else {
        alert("Access Denied.");
    }
}

// --- UTILITY FUNCTIONS ---
function formatLS(value) {
    const numValue = Number(value);
    if (isNaN(numValue)) return '0.00 LS';
    return numValue.toFixed(2) + ' LS';
}

function getRarityColor(rarity) {
    switch (rarity) {
        case 'G': return 'var(--color-gear-green)';
        case 'B': return 'var(--color-gear-blue)';
        case 'P': return 'var(--color-gear-purple)';
        case 'L': return 'var(--color-gear-legendary)';
        default: return 'var(--color-text-medium)';
    }
}

function getItemData(itemName) {
    const trimmed = itemName ? itemName.trim() : '';
    return ITEM_DATABASE[trimmed] || null;
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

// --- CALCULATIONS ---
function calculateItemLS(itemName, quantity, level, isBroken, armorPiece) {
    const item = getItemData(itemName);
    if (!item || !Number.isFinite(item.price) || item.price < 0 || quantity <= 0) return 0;
    let baseLS = item.price;
    if (item.isArmorSet && armorPiece && armorPiece !== 'Full Set') {
        baseLS *= ARMOR_WEIGHTING[armorPiece] || 1.0;
    }
    if (item.isGear) {
        const upgradeMultiplier = 1 + (level * (item.rarity === 'L' ? 0.15 : 0.10));
        const brokenMultiplier = isBroken ? 0.5 : 1.0;
        return baseLS * brokenMultiplier * upgradeMultiplier * quantity;
    }
    return baseLS * quantity;
}

function updateCalculations() {
    const targetItem = getItemData(targetState.name);
    let targetLS = 0;
    if (targetItem) {
        targetLS = calculateItemLS(targetState.name, targetState.quantity, targetState.level, targetState.isBroken, targetState.armorPiece);
    }
    document.getElementById('their-total-ls').textContent = formatLS(targetLS);

    let totalOfferLS = 0;
    offerStates.forEach((state, index) => {
        let itemLS = 0;
        if (state.name) {
            itemLS = calculateItemLS(state.name, state.quantity, state.level, state.isBroken, state.armorPiece);
        }
        totalOfferLS += itemLS;
        const chip = document.getElementById(`offerLSDisplay-${index}`);
        if (chip) chip.textContent = formatLS(itemLS);
    });
    document.getElementById('your-total-ls').textContent = formatLS(totalOfferLS);

    const liveDiff = totalOfferLS - targetLS;
    const liveDiffElem = document.getElementById('liveDifference');
    liveDiffElem.textContent = formatLS(liveDiff);
    liveDiffElem.classList.remove('text-red-400', 'text-green-400', 'text-gray-300');
    const tolerance = 0.01;
    liveDiffElem.classList.add(liveDiff > tolerance ? 'text-green-400' : (liveDiff < -tolerance ? 'text-red-400' : 'text-gray-300'));

    const totalValue = targetLS + totalOfferLS;
    const offerPct = totalValue > 0 ? (totalOfferLS / totalValue) * 100 : 50;
    const targetPct = totalValue > 0 ? (targetLS / totalValue) * 100 : 50;
    document.getElementById('balanceBarOffer').style.width = offerPct + '%';
    document.getElementById('balanceBarTarget').style.width = targetPct + '%';

    let verdictText = '', suggestionText = '', statusClass = 'text-gray-300';
    const absDiff = Math.abs(liveDiff);
    const verdictBox = document.getElementById('verdictBox');
    verdictBox.classList.remove('status-balanced', 'status-overpaid', 'status-deficit');

    if (targetLS === 0 || totalOfferLS === 0) {
        verdictText = "Waiting for input...";
        suggestionText = "Awaiting calculation...";
    } else if (absDiff < tolerance) {
        verdictText = "PERFECT TRADE BALANCE";
        suggestionText = "The trade is balanced within minimal tolerance.";
        statusClass = 'text-green-500';
        verdictBox.classList.add('status-balanced');
    } else if (liveDiff > tolerance) {
        statusClass = 'text-green-400';
        verdictText = "OVERPAID - REFUND REQUIRED";
        verdictBox.classList.add('status-overpaid');
        if (targetItem && targetItem.isConsumable && targetItem.price > 0) {
            const extraItems = Math.floor(liveDiff / targetItem.price);
            if (extraItems > 0) {
                const valueUsed = extraItems * targetItem.price;
                const finalExcess = liveDiff - valueUsed;
                suggestionText = `The merchant owes you ${formatLS(liveDiff)}. You could instead acquire <strong>${extraItems} more ${targetState.name}</strong> (value: ${formatLS(valueUsed)}). Remaining balance: ${formatLS(finalExcess)}.`;
            } else {
                suggestionText = `The merchant owes <strong>${formatLS(liveDiff)}</strong>. Suggested refund items:<br>${suggestItems(liveDiff)}`;
            }
        } else {
            suggestionText = `The merchant owes <strong>${formatLS(liveDiff)}</strong>. Suggested refund items:<br>${suggestItems(liveDiff)}`;
        }
    } else {
        statusClass = 'text-red-400';
        verdictText = "DEFICIT MUST BE MET";
        verdictBox.classList.add('status-deficit');
        suggestionText = `You are short by <strong>${formatLS(absDiff)}</strong>. Suggested items to add:<br>${suggestItems(absDiff)}`;
    }

    document.getElementById('tradeVerdict').textContent = verdictText;
    document.getElementById('tradeVerdict').className = `text-center text-lg font-semibold ${statusClass}`;
    document.getElementById('tradeSuggestion').innerHTML = suggestionText;

    const balanceStatusElem = document.getElementById('balanceStatusText');
    if (liveDiff > tolerance) {
        balanceStatusElem.textContent = "Your offer is too high! Merchant owes you change.";
    } else if (liveDiff < -tolerance) {
        balanceStatusElem.textContent = "Your offer is too low! You need to add more items.";
    } else if (targetLS > 0 || totalOfferLS > 0) {
        balanceStatusElem.textContent = "Trade is perfectly balanced.";
    } else {
        balanceStatusElem.textContent = "Select items to begin trade.";
    }
}

// --- SUGGESTION ENGINE ---
const SUGGESTION_ITEMS = ["Common Fish", "Loki's Berrie", "Ghost Essence", "Sanctum Key", "Salt", "Ash Ring", "Blue Bag", "Forge Key", "Medium Orb I", "Logi Key", "Archive Key", "Library Key"];

function suggestItems(targetValue) {
    let suggestions = [];
    const sortedItems = SUGGESTION_ITEMS
        .map(name => ({ name: name.trim(), data: getItemData(name.trim()) }))
        .filter(item => item.data && Number.isFinite(item.data.price) && item.data.price > 0)
        .sort((a, b) => b.data.price - a.data.price);
    if (sortedItems.length === 0) return "Could not generate suggestions.";
    for (const item of sortedItems) {
        const quantity = Math.floor(targetValue / item.data.price);
        if (quantity > 0) {
            const suggestionValue = quantity * item.data.price;
            suggestions.push({ string: `<li><strong>${quantity}x ${item.name}</strong> (${formatLS(suggestionValue)})</li>`, value: suggestionValue });
        }
    }
    if (suggestions.length === 0) {
        const cheapest = sortedItems[sortedItems.length - 1];
        if (!cheapest) return "No suitable items found.";
        const qty = Math.ceil(targetValue / cheapest.data.price);
        return `<ul><li>Try adding <strong>${qty}x ${cheapest.name}</strong> (${formatLS(qty * cheapest.data.price)})</li></ul>`;
    }
    return '<ul>' + suggestions
        .sort((a, b) => Math.abs(a.value - targetValue) - Math.abs(b.value - targetValue))
        .slice(0, 3)
        .map(s => s.string)
        .join('') + '</ul>';
}

// --- SEARCH ---
function handleSearchInput(event, resultsId, stateObject, isTarget) {
    const query = event.target.value.trim().toLowerCase();
    const resultsDiv = document.getElementById(resultsId);
    if (query.length < 2) { resultsDiv.classList.add('hidden'); return; }
    let html = '';
    Object.keys(ITEM_DATABASE).forEach(name => {
        if (name.toLowerCase().includes(query)) {
            const data = getItemData(name);
            if (data) {
                const color = getRarityColor(data.rarity);
                const slotId = isTarget ? 'target' : resultsId.replace('offerSearchResults-', '');
                html += `
                <div class="search-result-item" onclick="selectItem('${name.replace(/'/g, "\\'")}', '${slotId}', ${isTarget})">
                    <div class="search-result-name">
                        <div class="rarity-dot" style="background-color:${color};"></div>
                        <span>${name}</span>
                    </div>
                    <span class="search-result-price" style="background-color:${color};">${formatLS(data.price)}</span>
                </div>`;
            }
        }
    });
    resultsDiv.innerHTML = html || '<div class="p-2 text-sm text-gray-400">No items found.</div>';
    resultsDiv.classList.remove('hidden');
}

function selectItem(itemName, slotId, isTarget) {
    const item = getItemData(itemName);
    if (!item) return;
    const state = isTarget ? targetState : offerStates[parseInt(slotId)];
    if (!state) return;
    state.name = itemName;
    state.level = 0;
    state.isBroken = false;
    state.armorPiece = item.isArmorSet ? 'Full Set' : 'N/A';
    const nameDisplayId = isTarget ? 'targetItemNameDisplay' : `offerItemNameDisplay-${slotId}`;
    const searchInputId = isTarget ? 'targetSearch' : `offerSearch-${slotId}`;
    const searchResultsId = isTarget ? 'targetSearchResults' : `offerSearchResults-${slotId}`;
    document.getElementById(nameDisplayId).textContent = itemName;
    document.getElementById(searchInputId).value = '';
    document.getElementById(searchResultsId).classList.add('hidden');
    updateGearControls(state, slotId, isTarget);
    updateCalculations();
}

function updateGearControls(state, slotId, isTarget) {
    const item = getItemData(state.name);
    const prefix = isTarget ? 'target' : `offer`;
    const suffix = isTarget ? '' : `-${slotId}`;
    const gearControls = document.getElementById(isTarget ? 'targetGearControls' : `offerGearControls-${slotId}`);
    if (!item || !item.isGear) { gearControls.classList.add('hidden'); return; }
    gearControls.classList.remove('hidden');
    document.getElementById(isTarget ? 'targetBaseLSDisplay' : `offerBaseLSDisplay-${slotId}`).textContent = formatLS(item.price);
    const maxLevel = UPGRADE_LIMITS[item.rarity] || 0;
    const levelInput = document.getElementById(isTarget ? 'targetUpgradeLevel' : `offerUpgradeLevel-${slotId}`);
    levelInput.max = maxLevel;
    state.level = Math.min(Number(state.level) || 0, maxLevel);
    levelInput.value = state.level;
    document.getElementById(isTarget ? 'targetLevelLabel' : `offerLevelLabel-${slotId}`).textContent = `+${state.level}`;
    document.getElementById(isTarget ? 'targetBrokenToggle' : `offerBrokenToggle-${slotId}`).checked = state.isBroken;
    const armorSelector = document.getElementById(isTarget ? 'targetArmorSelector' : `offerArmorSelector-${slotId}`);
    if (item.isArmorSet) {
        armorSelector.classList.remove('hidden');
        const group = isTarget
            ? document.getElementById('targetPieceButtons')
            : document.querySelector(`#offerArmorSelector-${slotId} .piece-button-group`);
        if (group) {
            group.querySelectorAll('[data-piece]').forEach(btn => {
                btn.classList.toggle('bg-indigo-600', btn.dataset.piece === state.armorPiece);
                btn.classList.toggle('hover:bg-indigo-700', btn.dataset.piece === state.armorPiece);
                btn.classList.toggle('bg-gray-700', btn.dataset.piece !== state.armorPiece);
                btn.classList.toggle('hover:bg-gray-600', btn.dataset.piece !== state.armorPiece);
            });
        }
    } else {
        armorSelector.classList.add('hidden');
    }
}

// --- OFFER SLOTS ---
function createOfferSlotHTML(index) {
    const state = offerStates[index];
    return `
    <div id="offerSlot-${index}" class="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
        <div class="flex justify-between items-center mb-3">
            <h3 class="text-lg font-semibold text-gray-300">Offer Item ${index + 1}</h3>
            <button data-index="${index}" class="remove-offer-btn text-red-500 hover:text-red-400 text-sm font-bold">Remove</button>
        </div>
        <input type="text" id="offerSearch-${index}" placeholder="Search for Item..." class="w-full p-2 mb-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm">
        <div id="offerSearchResults-${index}" class="max-h-40 overflow-y-auto custom-scrollbar bg-gray-700 rounded-md mb-2 hidden"></div>
        <div class="text-sm font-semibold p-2 rounded-md bg-gray-900 border border-gray-700 min-h-[35px] text-gray-400">
            <span class="text-xs text-amber-500 block">Selected:</span>
            <span id="offerItemNameDisplay-${index}">${state.name || 'None'}</span>
        </div>
        <div class="flex items-center space-x-4 mt-4">
            <div class="flex-1">
                <label class="block text-xs font-medium mb-1 text-gray-400">Quantity</label>
                <input type="number" id="offerQuantity-${index}" min="1" value="${state.quantity}" class="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-sm text-center offer-quantity" data-index="${index}">
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
                <label class="block text-sm font-medium text-gray-400">Upgrade Level (<span id="offerLevelLabel-${index}">+0</span>)</label>
                <input type="range" id="offerUpgradeLevel-${index}" min="0" max="0" value="0" class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer offer-upgrade" data-index="${index}">
            </div>
            <div id="offerArmorSelector-${index}" class="hidden">
                <label class="block text-sm font-medium mb-2 text-gray-400">Select Armor Piece</label>
                <div data-index="${index}" class="piece-button-group grid grid-cols-2 gap-2 text-xs">
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
        const target = e.target;
        if (target.id.startsWith('offerSearch-')) {
            const index = parseInt(target.id.split('-')[1]);
            if (!isNaN(index)) handleSearchInput(e, `offerSearchResults-${index}`, offerStates[index], false);
            return;
        }
        const index = parseInt(target.dataset.index);
        if (isNaN(index) || !offerStates[index]) return;
        if (target.classList.contains('offer-quantity')) {
            offerStates[index].quantity = parseInt(target.value) || 1;
        } else if (target.classList.contains('offer-upgrade')) {
            offerStates[index].level = parseInt(target.value);
            document.getElementById(`offerLevelLabel-${index}`).textContent = `+${offerStates[index].level}`;
        }
        updateCalculations();
    });
    container.addEventListener('change', e => {
        const index = parseInt(e.target.dataset.index);
        if (isNaN(index) || !offerStates[index]) return;
        if (e.target.classList.contains('offer-broken')) {
            offerStates[index].isBroken = e.target.checked;
            updateCalculations();
        }
    });
    container.addEventListener('click', e => {
        if (e.target.classList.contains('remove-offer-btn')) {
            const index = parseInt(e.target.dataset.index);
            if (!isNaN(index)) {
                offerStates.splice(index, 1);
                renderOfferSlots();
                document.getElementById('addOfferSlot').disabled = offerStates.length >= 5;
            }
        }
        const pieceButton = e.target.closest('[data-piece]');
        if (pieceButton) {
            const group = e.target.closest('.piece-button-group');
            const index = parseInt(group.dataset.index);
            if (!isNaN(index) && offerStates[index]) {
                offerStates[index].armorPiece = pieceButton.dataset.piece;
                updateGearControls(offerStates[index], index, false);
                updateCalculations();
            }
        }
    });
}

// --- PRICE SUGGESTION MODAL ---
function openSuggestionModal() {
    document.getElementById('suggestionModal').classList.remove('hidden');
}

function closeSuggestionModal() {
    document.getElementById('suggestionModal').classList.add('hidden');
    document.getElementById('suggestionForm').reset();
    document.getElementById('suggestionStatus').textContent = '';
}

async function submitSuggestion() {
    const itemName = document.getElementById('suggestItemName').value.trim();
    const suggestedPrice = parseFloat(document.getElementById('suggestPrice').value);
    const reason = document.getElementById('suggestReason').value.trim();
    const statusEl = document.getElementById('suggestionStatus');

    if (!itemName || isNaN(suggestedPrice) || suggestedPrice <= 0) {
        statusEl.textContent = 'Please fill in item name and a valid price.';
        statusEl.className = 'text-red-400 text-sm mt-2';
        return;
    }

    const currentItem = getItemData(itemName);
    const ok = await supabaseInsert('price_suggestions', {
        server_id: currentServerId,
        item_name: itemName,
        suggested_price: suggestedPrice,
        current_price: currentItem ? currentItem.price : null,
        reason: reason || null
    });

    if (ok) {
        statusEl.textContent = 'Suggestion submitted! Thank you.';
        statusEl.className = 'text-green-400 text-sm mt-2';
        setTimeout(closeSuggestionModal, 1500);
    } else {
        statusEl.textContent = 'Something went wrong. Try again.';
        statusEl.className = 'text-red-400 text-sm mt-2';
    }
}

// --- ABOUT SECTION ---
const itemCategories = {
    "Orbs": ["Small Orb I", "Small Orb II", "Small Orb III", "Medium Orb I", "Medium Orb II", "Medium Orb III", "Large Orb I", "Large Orb II", "Large Orb III"],
    "Weapons - Green / Blue": ["Green Weapon", "Blue Weapons", "Ice Club", "Ice Crossbow", "Ice Dagger", "Ice Support Staff", "Ice Combat Staff", "Ice Shield and Sword"],
    "Weapons - Purple": ["Dragon Bite", "Dragon Bow", "Fire Bow", "5-Shot Crossbow", "Dragon Combat Staff", "Wrath Staff", "Reaper Staff", "Cutter of Grey Clan", "Dragon Dagger", "Fire Dagger", "Dragon Shield and Sword", "Nord Shield and Sword", "Dragon Sword", "Fire Axe", "Cleaver", "Giant Hammer", "Ice Axe", "Protector Spear", "Skoll Claws", "Ice Scythe", "Hel's Staff", "Dragon Support Staff", "Kirga Flask", "Surt's Flask"],
    "Weapons - Legendary": ["THOR Combat Staff", "THOR Support Staff", "THOR Bow", "THOR SNS", "THOR Flask", "THOR Dagger", "THOR Axe", "FREYJA Combat Staff", "FREYJA Support Staff", "FREYJA Crossbow", "FREYJA SNS", "FREYJA Flask", "FREYJA Dagger", "FREYJA Mace", "ALFAR Combat Staff", "ALFAR Support Staff", "ALFAR Bow", "ALFAR SNS", "ALFAR Flask", "ALFAR Dagger", "ALFAR Axe", "ALFAR Mace", "ALFAR Spear", "ELVEN Combat Staff", "ELVEN Support Staff", "ELVEN Bow", "ELVEN SNS", "ELVEN Flask", "ELVEN Dagger", "ELVEN Spear", "YMIR Combat Staff", "YMIR Support Staff", "YMIR Bow", "YMIR SNS", "YMIR Flask", "YMIR Dagger", "YMIR Axe", "DWARVEN Combat Staff", "DWARVEN Support Staff", "DWARVEN Crossbow", "DWARVEN SNS", "DWARVEN Flask", "DWARVEN Dagger", "DWARVEN Mace", "DWARVEN Axe", "BETRAYER Combat Staff", "BETRAYER Support Staff", "BETRAYER Bow", "BETRAYER SNS", "BETRAYER Flask", "BETRAYER Dagger", "BETRAYER Sword", "Emperor Sword", "Emperor Bow", "Emperor Staff", "Emperor Crossbow", "Master Smith Hammer", "Shaman Staff", "Retribution Staff", "Fire Guardian Crossbow", "Valkyrie Lance", "Arch Mage Staff", "Shadows Dagger", "Nosferatu Dagger", "Werewolf's Flask", "Wind Mage's Staff", "Bone Mace and Shield", "Ripper's Dagger", "Occultist's Flask", "Pathfinder's Bow", "Protector's Shield and Sword", "Oriental Saber", "Thrasher Sword", "Huscarl's Shield and Sword", "Hellhound's Sword", "Scythe", "Desert Mage's Staff", "Ancestors' Scythe"],
    "Armor - Purple Helms": ["Jorgun Helm", "Archivist Helm", "Instigator Helm", "Instigator Chest", "Instigator Pants", "Instigator Boots", "Dragon Helm", "Dragon Chest", "Dragon Pants", "Dragon Boots", "Shaman Helm"],
    "Armor - Legendary": ["Warden Set", "Scout Set", "Sorcerer Set", "Heavy Dragon Set", "Medium Dragon Set", "Light Dragon Set", "Barbarian Set", "Medium Elven Set", "Heavy Elven Set", "Light Elven Set", "Heavy Betrayer Set", "Light Betrayer Set", "Medium Betrayer Set", "Medium Ymir Set", "Heavy Ymir Set", "Light Ymir Set", "Sand King Set", "Light Tribal Set", "Witchdoctor Set", "Valkyrie Helm", "Celestial Dragon Helm", "Protector's Helm", "Hellbound's Helm", "Occultist's Helm", "Huscarl's Helmet", "Desert Mage's Turban"],
    "Resources": ["Construction Pickaxe", "Bucket", "Set of Tools", "Mortar", "Copper Nails", "Pine Beam", "Sturdy Pine Log", "Sturdy Limestone", "Limestone Brick", "Maple Beam", "Oats", "Oat Seeds", "Premium Fertilizer", "Improved Fertilizer", "Simple Fertilizer", "Sturdy Bones", "Ancient Tree Log", "Ancient Tree Plank", "Magic Clay", "Clay Brick", "Meteorite Ore", "Meteorite Ingot", "Ancient Rawhide", "Ancient Leather", "Exquisite Meat", "Loki's Berrie", "Ghost Essence", "Hearth Stone", "Salt", "Gum", "Nectar", "Steel Pickaxe", "Elven Blood", "Elven Tool", "Medallion of Power", "Medallion Base T1", "Medallion Base T2", "Medallion of Valor", "Medallion of Honor", "Drowned Chest"],
    "Fishing": ["Season Fish", "Common Fish", "Uncommon Fish", "Rare Fish", "Epic Fish", "Bait", "Fishing Net"],
    "Food & Potions": ["Raw Meat", "Berries", "North Berries", "North Meat", "Meat", "Cooked Food", "Goulash", "Water Bottle", "Carrot", "Mushroom Soup", "Primrose Soup", "Oatmeal", "Blood Sausage", "Elven Decoction", "Healing Pie", "Pumpkin Soup", "Mead", "Mulled Wine", "Meat in Honey Sauce", "Sushi", "Spicy Seafood", "Asgardian Honey", "Festive Cookies", "Fish in Hot Sauce", "Ribs", "Fish Barbecue", "Warrior Elixir", "Hunter Elixir", "Mage Elixir", "Survival Elixir", "Speed Potion", "Berserk Potion", "Shield Potion", "Dragon Beer", "Dispel Potion", "Reflect Potion", "Clan Boss Potion", "Dexterity Potion", "Fury Potion", "Guardian's Potion", "Invisibility Potion", "Purification Potion", "Elixir of Protector"],
    "Gadgets & Traps": ["Bolas", "Stun Bomb", "Fire Bomb", "Throwing Axe", "Fire Trap", "Stun Hammer", "Weakening Dart", "Healing Totem", "Stun Trap", "Bowman Scroll", "Barrel Scroll", "Healing Bomb", "Throwing Cleaver", "Fear Trap", "Rune Hammer", "Improved Bandages", "Improved Bolas", "Decoy Totem", "Odin's Punishment", "Wall of Fire", "Instigator's Trap", "Thunder Totem", "Improved Hammer", "Rich Fish Soup"],
    "Keys & Collectibles": ["Wood Pendant", "Steel Pendant", "Gold Pendant", "Magic Pendant", "Sanctum Key", "Forge Key", "Archive Key", "Library Key", "Ice Vault Key", "Logi Key", "Ash Ring", "Alfar Key", "Alfar Key Part 1", "Alfar Key Part 2", "Labyrinth Key", "Blue Bag", "Donation Points", "Instant Repair Service", "Odin Offering"]
};

function populateAboutSection() {
    let html = '';
    for (const [title, items] of Object.entries(itemCategories)) {
        html += `<h3 class="text-xl font-semibold gold-text mt-4">${title}</h3><ul class="list-none space-y-1">`;
        for (const name of items) {
            const data = getItemData(name);
            if (!data) continue;
            const color = getRarityColor(data.rarity);
            html += `<li class="flex justify-between items-center py-1 border-b border-gray-700/50">
                <span>${name}</span>
                <span class="px-2 py-0.5 rounded text-xs font-semibold" style="background-color:${color};color:#1f2937;">${formatLS(data.price)}</span>
            </li>`;
        }
        html += '</ul>';
    }
    document.getElementById('itemListDisplay').innerHTML = html;
}

// --- INIT ---
window.onload = async function () {
    showLoading(true);
    await loadServers();
    showLoading(false);

    document.getElementById('targetSearch').addEventListener('input', e =>
        handleSearchInput(e, 'targetSearchResults', targetState, true));
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

window.selectItem = selectItem;
window.openSuggestionModal = openSuggestionModal;
window.closeSuggestionModal = closeSuggestionModal;
window.submitSuggestion = submitSuggestion;

async function loadAdminPanel() {
    console.log("Loading admin panel...");
    const { data: suggestions, error } = await supabaseFetch('price_suggestions?status=eq.pending');
    
    if (error) {
        console.error("Error fetching suggestions:", error);
        return;
    }
    
    const container = document.getElementById('adminPanel');
    if (!suggestions || suggestions.length === 0) {
        container.innerHTML = "<p>No pending suggestions.</p>";
        return;
    }

    container.innerHTML = suggestions.map(s => `
        <div style="background: #333; padding: 10px; margin-bottom: 5px;">
            <p><strong>${s.item_name}</strong> - ${s.suggested_price} LS</p>
            <button onclick="approvePrice('${s.id}', '${s.item_name}', ${s.suggested_price})" 
                    style="background: blue; color: white; padding: 5px;">Approve</button>
        </div>
    `).join('');
}
