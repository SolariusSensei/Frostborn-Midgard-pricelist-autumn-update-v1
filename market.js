import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// -------------------------------------------------------------
// SAME config as script.js — copy your existing SUPABASE_URL and
// SUPABASE_ANON_KEY values in here so both pages hit the same
// project. (Public anon key only — this page never needs the
// service role key, it's read-only.)
// -------------------------------------------------------------
const SUPABASE_URL = 'YOUR_SUPABASE_URL'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

let snapshots = []       // raw item_price_snapshots rows, joined with items for category
let currentServerId = null
let indexChart = null
let itemChart = null

const el = id => document.getElementById(id)

// -------------------------------------------------------------
// Bootstrapping
// -------------------------------------------------------------
async function init() {
  await loadServers()
  el('serverSelector').addEventListener('change', () => {
    currentServerId = el('serverSelector').value
    loadServerData()
  })
  el('itemSearch').addEventListener('input', renderTable)
  el('categoryFilter').addEventListener('change', renderTable)
  el('sortSelector').addEventListener('change', renderTable)
}

async function loadServers() {
  const { data, error } = await supabase.from('items').select('server_id')
  if (error || !data) return

  const uniqueServers = [...new Set(data.map(r => r.server_id))]
  const selector = el('serverSelector')
  selector.innerHTML = uniqueServers.map(s => `<option value="${s}">${s}</option>`).join('')

  if (uniqueServers.length) {
    currentServerId = uniqueServers[0]
    selector.value = currentServerId
    loadServerData()
  }
}

// -------------------------------------------------------------
// Load everything for the selected server: snapshots (joined with
// category from items), and the market index history.
// -------------------------------------------------------------
async function loadServerData() {
  el('marketTableBody').innerHTML = `<tr><td colspan="5" class="px-4 py-6 text-center text-gray-500">Loading market data...</td></tr>`

  const [{ data: snapshotRows, error: snapErr }, { data: itemRows }] = await Promise.all([
    supabase.from('item_price_snapshots').select('*').eq('server_id', currentServerId),
    supabase.from('items').select('name, category').eq('server_id', currentServerId)
  ])

  if (snapErr) {
    el('marketTableBody').innerHTML = `<tr><td colspan="5" class="px-4 py-6 text-center text-red-400">Couldn't load market data.</td></tr>`
    return
  }

  const categoryByName = new Map((itemRows || []).map(i => [i.name, i.category]))
  snapshots = (snapshotRows || []).map(s => ({ ...s, category: categoryByName.get(s.item_name) || 'Uncategorized' }))

  populateCategoryFilter()
  renderTable()
  loadMarketIndex()
}

function populateCategoryFilter() {
  const categories = [...new Set(snapshots.map(s => s.category))].sort()
  const selector = el('categoryFilter')
  const current = selector.value
  selector.innerHTML = `<option value="">All categories</option>` +
    categories.map(c => `<option value="${c}">${c}</option>`).join('')
  selector.value = categories.includes(current) ? current : ''
}

// -------------------------------------------------------------
// Table: filter -> sort -> render
// -------------------------------------------------------------
function renderTable() {
  const search = el('itemSearch').value.trim().toLowerCase()
  const category = el('categoryFilter').value
  const sort = el('sortSelector').value

  let rows = snapshots.filter(s => {
    const matchesSearch = !search || s.item_name.toLowerCase().includes(search)
    const matchesCategory = !category || s.category === category
    return matchesSearch && matchesCategory
  })

  const sorters = {
    'name-asc': (a, b) => a.item_name.localeCompare(b.item_name),
    'pct7-desc': (a, b) => (b.pct_change_7d ?? -Infinity) - (a.pct_change_7d ?? -Infinity),
    'pct7-asc': (a, b) => (a.pct_change_7d ?? Infinity) - (b.pct_change_7d ?? Infinity),
    'pct30-desc': (a, b) => (b.pct_change_30d ?? -Infinity) - (a.pct_change_30d ?? -Infinity),
    'pct30-asc': (a, b) => (a.pct_change_30d ?? Infinity) - (b.pct_change_30d ?? Infinity),
    'price-desc': (a, b) => (b.current_price ?? 0) - (a.current_price ?? 0),
    'price-asc': (a, b) => (a.current_price ?? 0) - (b.current_price ?? 0),
  }
  rows.sort(sorters[sort] || sorters['name-asc'])

  el('emptyState').classList.toggle('hidden', rows.length > 0)

  if (!rows.length) {
    el('marketTableBody').innerHTML = ''
    return
  }

  el('marketTableBody').innerHTML = rows.map(r => `
    <tr class="hover:bg-gray-700/50 cursor-pointer transition" data-item="${escapeAttr(r.item_name)}">
      <td class="px-4 py-3 font-medium text-gray-200">${escapeHtml(r.item_name)}</td>
      <td class="px-4 py-3 text-gray-400">${escapeHtml(r.category)}</td>
      <td class="px-4 py-3 text-right text-gray-300">${formatPrice(r.current_price)} LS</td>
      <td class="px-4 py-3 text-right font-semibold ${pctColor(r.pct_change_7d)}">${formatPct(r.pct_change_7d)}</td>
      <td class="px-4 py-3 text-right font-semibold ${pctColor(r.pct_change_30d)}">${formatPct(r.pct_change_30d)}</td>
    </tr>
  `).join('')

  el('marketTableBody').querySelectorAll('tr[data-item]').forEach(tr => {
    tr.addEventListener('click', () => openItemHistory(tr.dataset.item))
  })
}

// -------------------------------------------------------------
// Market index chart (optional overall economy chart)
// -------------------------------------------------------------
async function loadMarketIndex() {
  const { data, error } = await supabase
    .from('market_index_snapshots')
    .select('*')
    .eq('server_id', currentServerId)
    .order('created_at', { ascending: true })

  if (error || !data || data.length < 2) {
    // Not enough history yet for a meaningful line — hide the card
    // rather than show a flat/misleading single point.
    el('marketIndexCard').classList.add('hidden')
    return
  }

  el('marketIndexCard').classList.remove('hidden')
  const latest = data[data.length - 1]
  el('marketIndexStat').textContent =
    `7d: ${formatPct(latest.avg_pct_change_7d)} · 30d: ${formatPct(latest.avg_pct_change_30d)} (${latest.item_count} items)`

  const labels = data.map(d => new Date(d.created_at).toLocaleDateString())
  const values = data.map(d => d.avg_pct_change_7d)

  if (indexChart) indexChart.destroy()
  indexChart = new Chart(el('marketIndexChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Avg 7d % change',
        data: values,
        borderColor: '#fcd34d',
        backgroundColor: 'rgba(252, 211, 77, 0.1)',
        tension: 0.3,
        fill: true,
        pointRadius: 2
      }]
    },
    options: chartOptions()
  })
}

// -------------------------------------------------------------
// Drill-down modal: full price_history for one item
// -------------------------------------------------------------
async function openItemHistory(itemName) {
  el('itemHistoryModal').classList.remove('hidden')
  el('itemHistoryTitle').textContent = itemName
  el('itemHistorySubtitle').textContent = 'Loading history...'
  el('itemHistoryEmpty').classList.add('hidden')

  const { data, error } = await supabase
    .from('price_history')
    .select('price, source, created_at')
    .eq('item_name', itemName)
    .eq('server_id', currentServerId)
    .order('created_at', { ascending: true })

  if (error || !data || !data.length) {
    el('itemHistorySubtitle').textContent = ''
    el('itemHistoryEmpty').classList.remove('hidden')
    if (itemChart) { itemChart.destroy(); itemChart = null }
    return
  }

  el('itemHistorySubtitle').textContent = `${data.length} recorded price change${data.length === 1 ? '' : 's'}`

  const labels = data.map(d => new Date(d.created_at).toLocaleDateString())
  const values = data.map(d => Number(d.price))

  if (itemChart) itemChart.destroy()
  itemChart = new Chart(el('itemHistoryChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Price (LS)',
        data: values,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.2,
        fill: true,
        pointRadius: 3
      }]
    },
    options: chartOptions()
  })
}

window.closeItemHistoryModal = function () {
  el('itemHistoryModal').classList.add('hidden')
}

// -------------------------------------------------------------
// Small helpers
// -------------------------------------------------------------
function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#9ca3af' } } },
    scales: {
      x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  }
}

function formatPrice(v) {
  return v == null ? '—' : Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function formatPct(v) {
  if (v == null) return '—'
  const sign = v > 0 ? '+' : ''
  return `${sign}${Number(v).toFixed(1)}%`
}

function pctColor(v) {
  if (v == null) return 'text-gray-500'
  if (v > 0) return 'text-emerald-400'
  if (v < 0) return 'text-red-400'
  return 'text-gray-400'
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]))
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;')
}

init()

