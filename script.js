<!-- Loading Overlay -->
<div id="loadingOverlay" class="fixed inset-0 bg-gray-900/80 z-50 flex items-center justify-center hidden">
    <div class="text-center">
        <div class="text-amber-400 text-2xl font-bold mb-2">Loading prices...</div>
        <div class="text-gray-400 text-sm">Fetching from database</div>
    </div>
</div>

<!-- Server Selector -->
<div class="mb-6 flex items-center gap-4">
    <label class="text-gray-400 font-semibold">Server:</label>
    <select id="serverSelector" class="bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500">
    </select>
    <button onclick="openSuggestionModal()" class="ml-auto bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-lg transition">
        Suggest Price Change
    </button>
</div>

<!-- Price Suggestion Modal -->
<div id="suggestionModal" class="fixed inset-0 bg-gray-900/90 z-50 flex items-center justify-center hidden">
    <div class="bg-gray-800 border border-gray-700 rounded-xl p-8 w-full max-w-md shadow-2xl">
        <h2 class="text-2xl font-bold gold-text mb-6">Suggest a Price Change</h2>
        <form id="suggestionForm" onsubmit="return false;">
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-400 mb-1">Item Name</label>
                <input type="text" id="suggestItemName" placeholder="Exact item name..." class="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-400 mb-1">Suggested Price (LS)</label>
                <input type="number" id="suggestPrice" step="0.01" min="0.01" placeholder="e.g. 250" class="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-400 mb-1">Reason (optional)</label>
                <textarea id="suggestReason" rows="3" placeholder="Why do you think the price changed?" class="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"></textarea>
            </div>
            <p id="suggestionStatus" class="text-sm mt-2"></p>
            <div class="flex gap-4 mt-6">
                <button onclick="submitSuggestion()" class="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition">Submit</button>
                <button onclick="closeSuggestionModal()" class="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition">Cancel</button>
            </div>
        </form>
    </div>
</div>
