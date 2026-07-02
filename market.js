// =============================================================
// MIDGARD MARKET LEDGER — market.js
// Public, read-only. No writes happen from this page at all —
// every number here comes from item_price_snapshots / price_history,
// which only the admin edge function can write to (see RLS policies
// in step1_price_history.sql).
// =============================================================

// --- SUPABASE CONFIG (same public project as the trade builder) ---
const SUPABASE_URL = 'https://iostylnrwoytrbygqbzv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlvc3R5bG5yd295dHJieWdxYnp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NjYxMTAsImV4cCI6MjA5ODM0MjExMH0.p08MmcHwREicm_k7mA6ZzAL4e1nx0KW5wdaVM_01QOA';

let currentServerId = null;
let itemsById       = {};   // name -> { category, rarity }
let snapshots        = [];  // merged item_price_snapshots + category/rarity
let historyChart      = null;

// --- FETCH HELPERS -------------------------------------------------

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

// --- UTILITIES -------------------------------------------------

function formatLS(value) {
    const n = Number(value);
    return isNaN(n) ? '0.00 LS' : n.toFixed(2) + ' LS';
}

function formatPct(value) {
    if (value === null || value === undefined || isNaN(value)) return '—';
    const sign = value > 0 ? '+' : '';
    return `${sign}${Number(value).toFixed(1)}%`;
}

function pctClass(value) {
    if (value === null || value === undefined || isNaN(value) || Math.abs(value) < 0.05) return 'pct-flat';
    return value > 0 ? 'pct-up' : 'pct-down';
}

function showLoading(show) {
    document.getElementById('loadingOverlay').classList.toggle('hidden', !show);
}

const CATEGORY_LABELS = { W: 'Weapon', A: 'Armor', P: 'Piece', F: 'Food', G: 'General' };

// --- DATA LOADING -------------------------------------------------

async function loadServers() {
    const servers  = await supabaseFetch('servers?select=*&order=name');
    const selector = document.getElementById('serverSelector');

    if (!servers.length) {
        selector.innerHTML = '<option>No servers found</option>';
        return;
    }

    selector.innerHTML = servers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    currentServerId = servers[0].id;
    await loadMarketData();

    selector.addEventListener('change', async (e) => {
        currentServerId = e.target.value;
        showLoading(true);
        await loadMarketData();
        showLoading(false);
    });
}

async function loadMarketData() {
    const [items, snaps] = await Promise.all([
        supabaseFetch(`items?select=name,category,rarity&server_id=eq.${currentServerId}`),
        supabaseFetch(`item_price_snapshots?select=*&server_id=eq.${currentServerId}`)
    ]);

    itemsById = {};
    items.forEach(i => { itemsById[i.name] = i; });

    // Merge snapshot rows with category/rarity from items. An item can
    // exist without a snapshot yet (no price_history written for it
    // since the trigger was added) — skip those rather than show
    // misleading "0% change" rows.
    snapshots = snaps
        .filter(s => itemsById[s.item_name])
        .map(s => ({
            ...s,
            category: itemsById[s.item_name].category,
            rarity: itemsById[s.item_name].rarity
        }));

    renderMarketIndex();
    renderTable();
}

// --- MARKET INDEX -------------------------------------------------

function average(nums) {
    const valid = nums.filter(n => n !== null && n !== undefined && !isNaN(n));
    if (!valid.length) return null;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function renderMarketIndex() {
    const idx7d  = average(snapshots.map(s => s.pct_change_7d));
    const idx30d = average(snapshots.map(s => s.pct_change_30d));

    document.getElementById('indexItemCount').textContent = snapshots.length;

    const el7d  = document.getElementById('indexChange7d');
    const el30d = document.getElementById('indexChange30d');

    el7d.textContent  = formatPct(idx7d);
    el7d.className    = 'text-2xl font-bold ' + (idx7d > 0.05 ? 'index-up' : idx7d < -0.05 ? 'index-down' : 'index-flat');

    el30d.textContent = formatPct(idx30d);
    el30d.className   = 'text-2xl font-bold ' + (idx30d > 0.05 ? 'index-up' : idx30d < -0.05 ? 'index-down' : 'index-flat');
}

// --- TABLE: FILTER + SORT + RENDER -------------------------------------------------

function getFilteredSortedSnapshots() {
    const query    = document.getElementById('marketSearch').value.trim().toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const sortBy   = document.getElementById('sortBy').value;

    let list = snapshots.filter(s => {
        if (category && s.category !== category) return false;
        if (query && !s.item_name.toLowerCase().includes(query)) return false;
        return true;
    });

    switch (sortBy) {
        case 'price':
            list.sort((a, b) => b.current_price - a.current_price);
            break;
        case 'gainers7d':
            list.sort((a, b) => (b.pct_change_7d ?? -Infinity) - (a.pct_change_7d ?? -Infinity));
            break;
        case 'losers7d':
            list.sort((a, b) => (a.pct_change_7d ?? Infinity) - (b.pct_change_7d ?? Infinity));
            break;
        case 'gainers30d':
            list.sort((a, b) => (b.pct_change_30d ?? -Infinity) - (a.pct_change_30d ?? -Infinity));
            break;
        case 'losers30d':
            list.sort((a, b) => (a.pct_change_30d ?? Infinity) - (b.pct_change_30d ?? Infinity));
            break;
        default:
            list.sort((a, b) => a.item_name.localeCompare(b.item_name));
    }

    return list;
}

function renderTable() {
    const list = getFilteredSortedSnapshots();
    const body = document.getElementById('marketTableBody');
    const empty = document.getElementById('marketEmptyState');

    if (!list.length) {
        body.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');

    body.innerHTML = list.map(s => `
        <tr data-item="${s.item_name.replace(/"/g, '&quot;')}">
            <td class="p-3 font-semibold text-gray-200">${s.item_name}</td>
            <td class="p-3"><span class="category-pill">${CATEGORY_LABELS[s.category] || s.category}</span></td>
            <td class="p-3 text-right text-gray-300">${formatLS(s.current_price)}</td>
            <td class="p-3 text-right ${pctClass(s.pct_change_7d)}">${formatPct(s.pct_change_7d)}</td>
            <td class="p-3 text-right ${pctClass(s.pct_change_30d)}">${formatPct(s.pct_change_30d)}</td>
        </tr>
    `).join('');

    body.querySelectorAll('tr[data-item]').forEach(row => {
        row.addEventListener('click', () => openHistoryModal(row.dataset.item));
    });
}

// --- ITEM HISTORY DRILL-DOWN -------------------------------------------------
// Deliberately lazy: full price_history is only fetched for one item at a
// time, when clicked — not preloaded for all 300+ items on page load.

async function openHistoryModal(itemName) {
    document.getElementById('historyModal').classList.remove('hidden');
    document.getElementById('historyModalTitle').textContent = itemName;
    document.getElementById('historyModalSubtitle').textContent = 'Loading history...';
    document.getElementById('historyEmptyState').classList.add('hidden');

    const history = await supabaseFetch(
        `price_history?select=new_price,source,created_at&server_id=eq.${currentServerId}&item_name=eq.${encodeURIComponent(itemName)}&order=created_at.asc`
    );

    const canvas = document.getElementById('historyChart');

    if (historyChart) {
        historyChart.destroy();
        historyChart = null;
    }

    if (!history.length) {
        canvas.classList.add('hidden');
        document.getElementById('historyEmptyState').classList.remove('hidden');
        document.getElementById('historyModalSubtitle').textContent = '';
        return;
    }

    canvas.classList.remove('hidden');
    document.getElementById('historyModalSubtitle').textContent =
        `${history.length} recorded price change${history.length === 1 ? '' : 's'}`;

    historyChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: history.map(h => new Date(h.created_at).toLocaleDateString()),
            datasets: [{
                label: 'Price (LS)',
                data: history.map(h => h.new_price),
                borderColor: '#fcd34d',
                backgroundColor: 'rgba(252, 211, 77, 0.1)',
                tension: 0.2,
                fill: true,
                pointRadius: 3,
                pointBackgroundColor: '#fcd34d'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        afterLabel: (ctx) => `Source: ${history[ctx.dataIndex].source}`
                    }
                }
            },
            scales: {
                x: { ticks: { color: '#9ca3af' }, grid: { color: '#374151' } },
                y: { ticks: { color: '#9ca3af' }, grid: { color: '#374151' } }
            }
        }
    });
}

function closeHistoryModal() {
    document.getElementById('historyModal').classList.add('hidden');
}
window.closeHistoryModal = closeHistoryModal;

// --- INIT -------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
    showLoading(true);

    document.getElementById('marketSearch').addEventListener('input', renderTable);
    document.getElementById('categoryFilter').addEventListener('change', renderTable);
    document.getElementById('sortBy').addEventListener('change', renderTable);

    await loadServers();
    showLoading(false);
});
