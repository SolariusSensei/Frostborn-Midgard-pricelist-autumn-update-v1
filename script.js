// --- ITEM DATABASE ---
// Key: [LS Price, Category, Rarity/Quality]
// Categories: W=Weapon, A=Armor Set, P=Armor Piece, O=Orb, R=Resource, F=Food/Consumable, G=Gadget/Trap, K=Key/Collectible
// Rarity: G=Green, B=Blue, P=Purple, L=Legendary, N=Non-Gear

const ITEM_DATABASE = {
    // --- 1. Weapons (107) ---
    "Green Weapon": [5, 'W', 'G'], "Blue Weapons": [10, 'W', 'B'], "Ice Club": [15, 'W', 'B'], "Ice Crossbow": [15, 'W', 'B'], "Ice Dagger": [15, 'W', 'B'], "Ice Support Staff": [15, 'W', 'B'], "Ice Combat Staff": [15, 'W', 'B'], "Ice Shield and Sword": [15, 'W', 'B'],
    "Dragon Bite": [85, 'W', 'P'], "Dragon Bow": [40, 'W', 'P'], "Fire Bow": [95, 'W', 'P'], "5-Shot Crossbow": [60, 'W', 'P'], "Dragon Combat Staff": [90, 'W', 'P'], "Wrath Staff": [80, 'W', 'P'], "Reaper Staff": [40, 'W', 'P'], "Cutter of Grey Clan": [40, 'W', 'P'], "Dragon Dagger": [70, 'W', 'P'], "Fire Dagger": [70, 'W', 'P'], "Dragon Shield and Sword": [90, 'W', 'P'], "Nord Shield and Sword": [45, 'W', 'P'], "Dragon Sword": [95, 'W', 'P'], "Fire Axe": [30, 'W', 'P'], "Cleaver": [45, 'W', 'P'], "Giant Hammer": [50, 'W', 'P'], "Ice Axe": [80, 'W', 'P'], "Protector Spear": [40, 'W', 'P'], "Skoll Claws": [80, 'W', 'P'], "Ice Scythe": [60, 'W', 'P'], "Hel's Staff": [45, 'W', 'P'], "Dragon Support Staff": [80, 'W', 'P'], "Kirga Flask": [80, 'W', 'P'], "Surt's Flask": [45, 'W', 'P'],
    "THOR Combat Staff": [200, 'W', 'L'], "THOR Support Staff": [200, 'W', 'L'], "THOR Bow": [200, 'W', 'L'], "THOR SNS": [200, 'W', 'L'], "THOR Flask": [300, 'W', 'L'], "THOR Dagger": [350, 'W', 'L'], "THOR Axe": [200, 'W', 'L'], "FREYJA Combat Staff": [200, 'W', 'L'], "FREYJA Support Staff": [250, 'W', 'L'], "FREYJA Crossbow": [250, 'W', 'L'], "FREYJA SNS": [200, 'W', 'L'], "FREYJA Flask": [250, 'W', 'L'], "FREYJA Dagger": [250, 'W', 'L'], "FREYJA Mace": [200, 'W', 'L'], "ALFAR Combat Staff": [250, 'W', 'L'], "ALFAR Support Staff": [300, 'W', 'L'], "ALFAR Bow": [300, 'W', 'L'], "ALFAR SNS": [200, 'W', 'L'], "ALFAR Flask": [250, 'W', 'L'], "ALFAR Dagger": [300, 'W', 'L'], "ALFAR Axe": [250, 'W', 'L'], "ALFAR Mace": [250, 'W', 'L'], "ALFAR Spear": [250, 'W', 'L'], "ELVEN Combat Staff": [250, 'W', 'L'], "ELVEN Support Staff": [300, 'W', 'L'], "ELVEN Bow": [300, 'W', 'L'], "ELVEN SNS": [250, 'W', 'L'], "ELVEN Flask": [300, 'W', 'L'], "ELVEN Dagger": [300, 'W', 'L'], "ELVEN Spear": [250, 'W', 'L'], "YMIR Combat Staff": [250, 'W', 'L'], "YMIR Support Staff": [300, 'W', 'L'], "YMIR Bow": [250, 'W', 'L'], "YMIR SNS": [250, 'W', 'L'], "YMIR Flask": [250, 'W', 'L'], "YMIR Dagger": [350, 'W', 'L'], "YMIR Axe": [250, 'W', 'L'], "DWARVEN Combat Staff": [200, 'W', 'L'], "DWARVEN Support Staff": [350, 'W', 'L'], "DWARVEN Crossbow": [300, 'W', 'L'], "DWARVEN SNS": [350, 'W', 'L'], "DWARVEN Flask": [300, 'W', 'L'], "DWARVEN Dagger": [200, 'W', 'L'], "DWARVEN Mace": [200, 'W', 'L'], "DWARVEN Axe": [200, 'W', 'L'], "BETRAYER Combat Staff": [250, 'W', 'L'], "BETRAYER Support Staff": [250, 'W', 'L'], "BETRAYER Bow": [250, 'W', 'L'], "BETRAYER SNS": [250, 'W', 'L'], "BETRAYER Flask": [210, 'W', 'L'], "BETRAYER Dagger": [210, 'W', 'L'], "BETRAYER Sword": [250, 'W', 'L'], "Emperor Sword": [180, 'W', 'L'], "Emperor Bow": [180, 'W', 'L'], "Emperor Staff": [180, 'W', 'L'], "Emperor Crossbow": [210, 'W', 'L'], "Master Smith Hammer": [300, 'W', 'L'], "Shaman Staff": [300, 'W', 'L'], "Retribution Staff": [200, 'W', 'L'], "Fire Guardian Crossbow": [300, 'W', 'L'], "Valkyrie Lance": [180, 'W', 'L'], "Arch Mage Staff": [200, 'W', 'L'], "Shadows Dagger": [210, 'W', 'L'], "Nosferatu Dagger": [300, 'W', 'L'], "Werewolf’s Flask": [210, 'W', 'L'], "Wind Mage’s Staff": [250, 'W', 'L'], "Bone Mace and Shield": [210, 'W', 'L'], "Ripper’s Dagger": [300, 'W', 'L'], "Occultist’s Flask": [250, 'W', 'L'], "Pathfinder’s Bow": [250, 'W', 'L'], "Protector’s Shield and Sword": [250, 'W', 'L'], "Oriental Saber": [250, 'W', 'L'], "Thrasher Sword": [210, 'W', 'L'], "Huscarl’s Shield and Sword": [210, 'W', 'L'], "Hellhound’s Sword": [250, 'W', 'L'], "Scythe": [1000, 'W', 'L'], "Desert Mage’s Staff": [210, 'W', 'L'], "Ancestors’ Scythe": [250, 'W', 'L'],
    "Green Set": [12, 'A', 'G'], "Blue Heavy Set": [30, 'A', 'B'], "Blue Medium Set": [30, 'A', 'B'], "Blue Light Set": [30, 'A', 'B'], "Immortal Set": [50, 'A', 'B'],
    "Purple Heavy Set": [100, 'A', 'P'], "Purple Medium Set": [80, 'A', 'P'], "Purple Light Set": [80, 'A', 'P'], "Guardian Set": [100, 'A', 'P'], "Chaser Set": [100, 'A', 'P'], "Magician Set": [100, 'A', 'P'], "Jarl Set": [140, 'A', 'P'],
    "Jorgun Helm": [120, 'P', 'P'], "Archivist Helm": [1000, 'P', 'P'], "Instigator Helm": [60, 'P', 'P'], "Instigator Chest": [30, 'P', 'P'], "Instigator Pants": [30, 'P', 'P'], "Instigator Boots": [60, 'P', 'P'], "Dragon Helm": [50, 'P', 'P'], "Dragon Chest": [250, 'P', 'P'], "Dragon Pants": [250, 'P', 'P'], "Dragon Boots": [50, 'P', 'P'], "Shaman Helm": [200, 'P', 'P'],
    "Warden Set": [180, 'A', 'L'], "Scout Set": [180, 'A', 'L'], "Sorcerer Set": [180, 'A', 'L'], "Heavy Dragon Set": [1350, 'A', 'L'], "Medium Dragon Set": [1350, 'A', 'L'], "Light Dragon Set": [1350, 'A', 'L'], "Barbarian Set": [180, 'A', 'L'], "Medium Elven Set": [210, 'A', 'L'], "Heavy Elven Set": [210, 'A', 'L'], "Light Elven Set": [210, 'A', 'L'], "Heavy Betrayer Set": [300, 'A', 'L'], "Light Betrayer Set": [300, 'A', 'L'], "Medium Betrayer Set": [300, 'A', 'L'],
    "Valkyrie Helm": [180, 'P', 'L'], "Celestial Dragon Helm": [300, 'P', 'L'], "Medium Ymir Set": [360, 'A', 'L'], "Heavy Ymir Set": [360, 'A', 'L'], "Light Ymir Set": [360, 'A', 'L'],
    "Sand King Set": [1575, 'A', 'L'], "Light Tribal Set": [300, 'A', 'L'], "Witchdoctor Set": [360, 'A', 'L'], "Protector’s Helm": [180, 'P', 'L'], "Hellbound’s Helm": [180, 'P', 'L'], "Occultist’s Helm": [180, 'P', 'L'], "Huscarl’s Helmet": [180, 'P', 'L'], "Desert Mage’s Turban": [180, 'P', 'L'],
    "Small Orb I": [10, 'O', 'N'], "Small Orb II": [15, 'O', 'N'], "Small Orb III": [20, 'O', 'N'], "Medium Orb I": [40, 'O', 'N'], "Medium Orb II": [60, 'O', 'N'], "Medium Orb III": [70, 'O', 'N'], "Large Orb I": [200, 'O', 'N'], "Large Orb II": [350, 'O', 'N'], "Large Orb III": [500, 'O', 'N'],
    "Construction Pickaxe": [250, 'R', 'N'], "Bucket": [12, 'R', 'N'], "Set of Tools": [10, 'R', 'N'], "Mortar": [3, 'R', 'N'], "Copper Nails": [12, 'R', 'N'], "Pine Beam": [1, 'R', 'N'], "Sturdy Pine Log": [4, 'R', 'N'], "Sturdy Limestone": [4, 'R', 'N'], "Limestone Brick": [1, 'R', 'N'], "Maple Beam": [8, 'R', 'N'], "Oats": [15, 'R', 'N'], "Oat Seeds": [5, 'R', 'N'], "Premium Fertilizer": [75, 'R', 'N'], "Improved Fertilizer": [30, 'R', 'N'], "Simple Fertilizer": [2, 'R', 'N'], "Sturdy Bones": [7, 'R', 'N'],
    "Ancient Tree Log": [15, 'R', 'N'], "Ancient Tree Plank": [30, 'R', 'N'], "Magic Clay": [35, 'R', 'N'], "Clay Brick": [70, 'R', 'N'], "Meteorite Ore": [60, 'R', 'N'], "Meteorite Ingot": [120, 'R', 'N'], "Ancient Rawhide": [5, 'R', 'N'], "Ancient Leather": [10, 'R', 'N'], "Exquisite Meat": [5, 'R', 'N'], "Loki’s Berrie": [5, 'R', 'N'], "Ghost Essence": [4, 'R', 'N'], "Hearth Stone": [100, 'R', 'N'], "Salt": [15, 'R', 'N'], "Gum": [10, 'R', 'N'], "Nectar": [40, 'R', 'N'], "Steel Pickaxe": [250, 'R', 'N'], "Elven Blood": [10, 'R', 'N'], "Elven Tool": [25, 'R', 'N'], "Medallion of Power": [5, 'R', 'N'], "Medallion Base T1": [2, 'R', 'N'], "Medallion Base T2": [2, 'R', 'N'], "Medallion of Valor": [75, 'R', 'N'], "Medallion of Honor": [150, 'R', 'N'], "Drowned Chest": [5, 'R', 'N'],
    "Season Fish": [4, 'R', 'N'], "Common Fish": [2, 'R', 'N'], "Uncommon Fish": [8, 'R', 'N'], "Rare Fish": [25, 'R', 'N'], "Epic Fish": [50, 'R', 'N'], "Bait": [25, 'R', 'N'], "Fishing Net": [5, 'R', 'N'],
    "Iron Ore": [3/20, 'R', 'N'], "Scrap Iron": [2/20, 'R', 'N'], "Iron Ingot": [10/20, 'R', 'N'], "Iron Plate": [10/20, 'R', 'N'], "Iron Nail": [10/20, 'R', 'N'], "Copper Ore": [10/20, 'R', 'N'], "Dirty Copper": [3/20, 'R', 'N'], "Copper Ingot": [120/20, 'R', 'N'], "Tin Rod": [4/20, 'R', 'N'], "Tin Ingot": [15/20, 'R', 'N'], "Tin Plate": [30/20, 'R', 'N'], "Steel Ingot": [200/20, 'R', 'N'], "Steel Plate": [100/20, 'R', 'N'], "Pine Wood": [1/20, 'R', 'N'], "Pine Plank": [7/20, 'R', 'N'], "Maple Log": [20/20, 'R', 'N'], "Maple Plank": [60/20, 'R', 'N'], "Limestone": [1/20, 'R', 'N'], "Limestone Block": [7/20, 'R', 'N'], "Plant Fiber": [2/20, 'R', 'N'], "Fabric": [4/20, 'R', 'N'], "Thick Fabric": [8/20, 'R', 'N'], "Warm Fabric": [5/20, 'R', 'N'], "Rope": [3/20, 'R', 'N'], "Animal Skin": [4/20, 'R', 'N'], "Leather": [7/20, 'R', 'N'], "North Rawhide": [10/20, 'R', 'N'],
    "Gold Ore": [4/20, 'R', 'N'], "Gold Ingot": [40/20, 'R', 'N'], "Orichalcum Ore": [400/20, 'R', 'N'], "Orichalcum Ingot": [450/20, 'R', 'N'], "Forged Fastener": [60/20, 'R', 'N'], "Metal Parts": [4/20, 'R', 'N'], "Blacksmith Hammer": [100/20, 'R', 'N'], "Charcoal": [5/20, 'R', 'N'], "Resin": [10/20, 'R', 'N'], "Oil": [7/20, 'R', 'N'], "Varnish": [5/20, 'R', 'N'], "Bone Fastener": [5/20, 'R', 'N'], "Dragon Scale": [20/20, 'R', 'N'], "Spirit": [5/20, 'R', 'N'], "Rune of Power": [60/20, 'R', 'N'], "Loki Rune": [800/20, 'R', 'N'], "Soul Stone": [4/20, 'R', 'N'], "Needle": [15/20, 'R', 'N'], "Ghost Flower": [80/20, 'R', 'N'], "Fire Bloom": [40/20, 'R', 'N'], "Explosive Powder": [160/20, 'R', 'N'], "Alchemical Powder": [20/20, 'R', 'N'], "Sulfur": [8/20, 'R', 'N'], "Dragon Tear": [20/20, 'R', 'N'], "Eternal Ice": [20/20, 'R', 'N'], "Wax": [4/20, 'R', 'N'], "Chains": [4/20, 'R', 'N'], "Pliers": [4/20, 'R', 'N'], "Leather Strips": [20/20, 'R', 'N'], "Fish Glue": [40/20, 'R', 'N'], "Feather": [4/20, 'R', 'N'],
    "Raw Meat": [1/20, 'F', 'N'], "Berries": [1/20, 'F', 'N'], "North Berries": [7/20, 'F', 'N'], "North Meat": [10/20, 'F', 'N'], "Meat": [2/20, 'F', 'N'], "Cooked Food": [7/20, 'F', 'N'], "Goulash": [40/20, 'F', 'N'], "Water Bottle": [1.5/20, 'F', 'N'], "Carrot": [2/20, 'F', 'N'], "Mushroom Soup": [40/20, 'F', 'N'], "Primrose Soup": [20/20, 'F', 'N'], "Oatmeal": [40, 'F', 'N'],
    "Blood Sausage": [80, 'F', 'N'], "Elven Decoction": [150, 'F', 'N'], "Healing Pie": [80, 'F', 'N'], "Pumpkin Soup": [60, 'F', 'N'], "Mead": [45, 'F', 'N'], "Mulled Wine": [35, 'F', 'N'], "Meat in Honey Sauce": [3, 'F', 'N'], "Sushi": [20, 'F', 'N'], "Spicy Seafood": [25, 'F', 'N'], "Asgardian Honey": [15, 'F', 'N'], "Festive Cookies": [35, 'F', 'N'], "Fish in Hot Sauce": [16, 'F', 'N'], "Ribs": [15, 'F', 'N'], "Fish Barbecue": [10, 'F', 'N'],
    "Warrior Elixir": [6, 'F', 'N'], "Hunter Elixir": [6, 'F', 'N'], "Mage Elixir": [6, 'F', 'N'], "Survival Elixir": [6, 'F', 'N'], "Speed Potion": [1, 'F', 'N'],
    "Berserk Potion": [1, 'F', 'N'], "Shield Potion": [1, 'F', 'N'], "Dragon Beer": [3, 'F', 'N'], "Dispel Potion": [40, 'F', 'N'], "Reflect Potion": [6, 'F', 'N'], "Clan Boss Potion": [10, 'F', 'N'], "Dexterity Potion": [50, 'F', 'N'], "Fury Potion": [50, 'F', 'N'], "Guardian’s Potion": [50, 'F', 'N'], "Invisibility Potion": [100, 'F', 'N'], "Purification Potion": [100, 'F', 'N'], "Elixir of Protector": [40, 'F', 'N'],
    "Bolas": [5/10, 'G', 'N'], "Stun Bomb": [10/20, 'G', 'N'], "Fire Bomb": [1/20, 'G', 'N'], "Throwing Axe": [1/20, 'G', 'N'], "Fire Trap": [5/5, 'G', 'N'], "Stun Hammer": [6, 'G', 'N'], "Weakening Dart": [1, 'G', 'N'],
    "Healing Totem": [5/10, 'G', 'N'], "Stun Trap": [1, 'G', 'N'], "Bowman Scroll": [1, 'G', 'N'], "Barrel Scroll": [1/6, 'G', 'N'], "Healing Bomb": [1/6, 'G', 'N'],
    "Throwing Cleaver": [1/4, 'G', 'N'], "Fear Trap": [4, 'G', 'N'], "Rune Hammer": [6, 'G', 'N'], "Improved Bandages": [20, 'G', 'N'], "Improved Bolas": [3, 'G', 'N'],
    "Decoy Totem": [20, 'G', 'N'], "Odin’s Punishment": [9, 'G', 'N'], "Wall of Fire": [9, 'G', 'N'], "Instigator’s Trap": [9, 'G', 'N'],
    "Thunder Totem": [7.5, 'G', 'N'], "Improved Hammer": [10, 'G', 'N'], "Rich Fish Soup": [150, 'G', 'N'],
    "Blue Bag": [30, 'K', 'N'], "Donation Points": [25/100, 'K', 'N'], "Instant Repair Service": [25, 'K', 'N'], "Wood Pendant": [30/30, 'K', 'N'],
    "Steel Pendant": [60/30, 'K', 'N'], "Gold Pendant": [240/30, 'K', 'N'], "Magic Pendant": [450/30, 'K', 'N'], "Odin Offering": [5/10, 'K', 'N'],
    "Sanctum Key": [10, 'K', 'N'], "Forge Key": [40, 'K', 'N'], "Archive Key": [80, 'K', 'N'], "Library Key": [100, 'K', 'N'], "Ice Vault Key": [10, 'K', 'N'], "Logi Key": [60, 'K', 'N'], "Ash Ring": [20, 'K', 'N'], "Alfar Key": [50, 'K', 'N'], "Alfar Key Part 1": [25, 'K', 'N'], "Alfar Key Part 2": [25, 'K', 'N'], "Labyrinth Key": [100, 'K', 'N']
};

const ARMOR_WEIGHTING = { 'Full Set': 1.00, 'Head': 0.20, 'Chest': 0.30, 'Pants': 0.22, 'Boots': 0.28 };
const UPGRADE_LIMITS = { 'G': 3, 'B': 3, 'P': 5, 'L': 10, 'N': 0 };

// --- UTILITY FUNCTIONS ---
function formatLS(value) {
    const numValue = Number(value);
    if (isNaN(numValue)) { return '0.00 LS'; }
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
    const trimmedItemName = itemName ? itemName.trim() : '';
    const data = ITEM_DATABASE[trimmedItemName];
    if (!data) { return null; }
    let price = data[0];
    if (typeof price !== 'number') {
        try { price = eval(String(price)); } catch (e) {
            console.error(`Invalid price format for item "${trimmedItemName}": ${data[0]}`);
            price = 0;
        }
    }
    return {
        price: Number(price), category: data[1], rarity: data[2],
        isGear: ['W', 'A', 'P'].includes(data[1]), isArmorSet: data[1] === 'A', isConsumable: ['F', 'G'].includes(data[1])
    };
}

function calculateItemLS(itemName, quantity, level, isBroken, armorPiece) {
    const item = getItemData(itemName);
    if (!item || !Number.isFinite(item.price) || item.price < 0 || quantity <= 0) { return 0; }
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

// --- MAIN CALCULATION & UI UPDATE ---
let targetState = { name: '', quantity: 1, level: 0, isBroken: false, armorPiece: 'Full Set' };
let offerStates = [];

function updateCalculations() {
    // 1. Target LS Calculation
    const targetItem = getItemData(targetState.name);
    let targetLS = 0;
    if (targetItem) {
        targetLS = calculateItemLS(targetState.name, targetState.quantity, targetState.level, targetState.isBroken, targetState.armorPiece);
    }
    document.getElementById('their-total-ls').textContent = formatLS(targetLS);

    // 2. Offer LS Calculation
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

    // 3. Balance Bar and Live Difference
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

    // 4. Final Verdict and Suggestions
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
        let excess = liveDiff;
        verdictText = "OVERPAID - REFUND REQUIRED";
        verdictBox.classList.add('status-overpaid');
        if (targetItem && targetItem.isConsumable && targetItem.price > 0) {
            const extraItems = Math.floor(excess / targetItem.price);
            if (extraItems > 0) {
                const valueUsed = extraItems * targetItem.price;
                const finalExcess = excess - valueUsed;
                suggestionText = `The merchant owes you ${formatLS(excess)}. You could instead acquire **${extraItems} more ${targetState.name}** (value: ${formatLS(valueUsed)}). Remaining balance: ${formatLS(finalExcess)}.`;
            } else {
                suggestionText = `The merchant owes **${formatLS(excess)}**. Suggested refund items:<br>${suggestItems(excess)}`;
            }
        } else {
            suggestionText = `The merchant owes **${formatLS(excess)}**. Suggested refund items:<br>${suggestItems(excess)}`;
        }
    } else {
        statusClass = 'text-red-400';
        let deficit = absDiff;
        verdictText = "DEFICIT MUST BE MET";
        verdictBox.classList.add('status-deficit');
        suggestionText = `You are short by **${formatLS(deficit)}**. Suggested items to add:<br>${suggestItems(deficit)}`;
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

// --- DYNAMIC ITEM SUGGESTION LOGIC ---
const SUGGESTION_ITEMS = [ "Common Fish", "Loki’s Berrie", "Ghost Essence", "Sanctum Key", "Salt", "Ash Ring", "Blue Bag", "Forge Key", "Medium Orb I", "Logi Key", "Archive Key", "Library Key" ];

function suggestItems(targetValue) {
    let suggestions = [];
    const sortedItems = SUGGESTION_ITEMS
        .map(name => ({ name: name.trim(), data: getItemData(name.trim()) }))
        .filter(item => item.data && Number.isFinite(item.data.price) && item.data.price > 0)
        .sort((a, b) => b.data.price - a.data.price);
    if (sortedItems.length === 0) { return "Could not generate suggestions."; }
    for (const item of sortedItems) {
        if (item.data.price <= 0) continue;
        const quantity = Math.floor(targetValue / item.data.price);
        if (quantity > 0) {
            const suggestionValue = quantity * item.data.price;
            suggestions.push({ string: `<li>**${quantity}x ${item.name}** (${formatLS(suggestionValue)})</li>`, value: suggestionValue });
        }
    }
    if (suggestions.length === 0) {
        const cheapestItem = sortedItems[sortedItems.length - 1];
        if (!cheapestItem) return "No suitable items found.";
        const quantityNeeded = Math.ceil(targetValue / cheapestItem.data.price);
        const valueNeeded = quantityNeeded * cheapestItem.data.price;
        return `<ul><li>Try adding **${quantityNeeded}x ${cheapestItem.name}** (${formatLS(valueNeeded)})</li></ul>`;
    }
    return '<ul>' + suggestions
        .sort((a, b) => Math.abs(a.value - targetValue) - Math.abs(b.value - targetValue))
        .slice(0, 3)
        .map(s => s.string)
        .join('') + '</ul>';
}

// --- SEARCH AND SELECTION LOGIC ---
window.handleSearchInput = handleSearchInput;
window.selectItem = selectItem;

function handleSearchInput(event, containerId, stateObject, isTarget = false) {
    const input = event.target;
    const resultsDiv = document.getElementById(containerId);
    const query = input.value.trim().toLowerCase();
    if (query.length < 2) {
        resultsDiv.classList.add('hidden');
        return;
    }
    let html = '';
    Object.keys(ITEM_DATABASE).forEach(name => {
        if (name.toLowerCase().includes(query)) {
            const data = getItemData(name);
            if (data) {
                const baseLS = formatLS(data.price);
                const color = getRarityColor(data.rarity);
                html += `
                <div class="search-result-item" onclick="selectItem('${name.replace(/'/g, "\\'")}', '${isTarget ? 'target' : containerId.split('-')[1]}', ${isTarget})">
                    <div class="search-result-name">
                        <div class="rarity-dot" style="background-color: ${color};"></div>
                        <span>${name}</span>
                    </div>
                    <span class="search-result-price" style="background-color: ${color};">${baseLS}</span>
                </div>`;
            }
        }
    });
    resultsDiv.innerHTML = html || '<div class="p-2 text-sm text-gray-400">No items found.</div>';
    resultsDiv.classList.remove('hidden');
}

function selectItem(itemName, slotId, isTarget) {
    const item = getItemData(itemName);
    if (!item) { return; }
    const state = isTarget ? targetState : offerStates[parseInt(slotId)];
    if (!state) { return; }
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
    const gearControlsId = isTarget ? 'targetGearControls' : `offerGearControls-${slotId}`;
    const brokenToggleId = isTarget ? 'targetBrokenToggle' : `offerBrokenToggle-${slotId}`;
    const armorSelectorId = isTarget ? 'targetArmorSelector' : `offerArmorSelector-${slotId}`;
    const baseLSDisplayId = isTarget ? 'targetBaseLSDisplay' : `offerBaseLSDisplay-${slotId}`;
    const levelInputId = isTarget ? 'targetUpgradeLevel' : `offerUpgradeLevel-${slotId}`;
    const levelLabelId = isTarget ? 'targetLevelLabel' : `offerLevelLabel-${slotId}`;
    const gearControls = document.getElementById(gearControlsId);
    if (!item || !item.isGear) {
        gearControls.classList.add('hidden');
        return;
    }
    gearControls.classList.remove('hidden');
    document.getElementById(baseLSDisplayId).textContent = formatLS(item.price);
    const maxLevel = UPGRADE_LIMITS[item.rarity] || 0;
    const levelInput = document.getElementById(levelInputId);
    levelInput.max = maxLevel;
    state.level = Math.min(Number(state.level) || 0, maxLevel);
    levelInput.value = state.level;
    document.getElementById(levelLabelId).textContent = `+${state.level}`;
    document.getElementById(brokenToggleId).checked = state.isBroken;
    const armorSelector = document.getElementById(armorSelectorId);
    if (item.isArmorSet) {
        armorSelector.classList.remove('hidden');
        const pieceButtonGroup = isTarget ? document.getElementById('targetPieceButtons') : document.querySelector(`#offerArmorSelector-${slotId} .piece-button-group`);
        if (pieceButtonGroup) {
            const buttons = pieceButtonGroup.querySelectorAll('[data-piece]');
            buttons.forEach(btn => {
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

// --- EVENT HANDLERS & SLOT MANAGEMENT ---
function createOfferSlotHTML(index) {
    const state = offerStates[index];
    const itemNameDisplay = state.name || 'None';
    // CORRECTED: Removed the broken "oninput" attribute from the search input
    return `
        <div id="offerSlot-${index}" class="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <div class="flex justify-between items-center mb-3">
                <h3 class="text-lg font-semibold text-gray-300">Offer Item ${index + 1}</h3>
                <button data-index="${index}" class="remove-offer-btn text-red-500 hover:text-red-400 text-sm font-bold">Remove</button>
            </div>
            <div id="offerItemContainer-${index}">
                <input type="text" id="offerSearch-${index}" placeholder="Search for Item..." class="w-full p-2 mb-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm">
                <div id="offerSearchResults-${index}" class="max-h-40 overflow-y-auto custom-scrollbar bg-gray-700 rounded-md mb-2 hidden"></div>
                <div class="text-sm font-semibold p-2 rounded-md bg-gray-900 border border-gray-700 min-h-[35px] text-gray-400">
                    <span class="text-xs text-amber-500 block">Selected:</span> <span id="offerItemNameDisplay-${index}">${itemNameDisplay}</span>
                </div>
            </div>
            <div class="flex items-center space-x-4 mt-4">
                <div class="flex-1"><label class="block text-xs font-medium mb-1 text-gray-400">Quantity</label><input type="number" id="offerQuantity-${index}" min="1" value="${state.quantity}" class="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-sm text-center offer-quantity" data-index="${index}"></div>
                <div class="flex-1 bg-amber-900/50 p-2 rounded-lg border border-amber-700 text-center"><span class="block text-xs text-gray-400">Total LS</span><span id="offerLSDisplay-${index}" class="font-bold text-lg text-amber-300">0.00 LS</span></div>
            </div>
            <div id="offerGearControls-${index}" class="space-y-3 mt-4 hidden">
                <div class="flex justify-between items-center text-sm font-medium"><span class="text-gray-400">Base LS:</span><span id="offerBaseLSDisplay-${index}" class="font-bold">0.00 LS</span></div>
                <div><label for="offerUpgradeLevel-${index}" class="block text-sm font-medium text-gray-400">Upgrade Level (<span id="offerLevelLabel-${index}">+0</span>)</label><input type="range" id="offerUpgradeLevel-${index}" min="0" max="0" value="0" class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg offer-upgrade" data-index="${index}"></div>
                <div id="offerArmorSelector-${index}" class="hidden"><label class="block text-sm font-medium mb-2 text-gray-400">Select Armor Piece</label><div data-index="${index}" class="piece-button-group grid grid-cols-2 gap-2 text-xs"><button data-piece="Full Set" class="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition">Full Set</button><button data-piece="Head" class="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition">Head (20%)</button><button data-piece="Chest" class="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition">Chest (30%)</button><button data-piece="Pants" class="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition">Pants (22%)</button><button data-piece="Boots" class="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition">Boots (28%)</button></div></div>
                <div class="flex items-center justify-between"><span class="text-sm font-medium text-gray-400">Broken Status</span><label class="broken-toggle-switch"><input type="checkbox" id="offerBrokenToggle-${index}" class="offer-broken" data-index="${index}"><span class="broken-slider"></span></label></div>
            </div>
        </div>`;
}

function renderOfferSlots() {
    const container = document.getElementById('offerSlots');
    container.innerHTML = offerStates.map((_, index) => createOfferSlotHTML(index)).join('');
    offerStates.forEach((state, index) => { updateGearControls(state, index, false); });
    attachOfferSlotListeners();
    updateCalculations();
}

function attachOfferSlotListeners() {
    const slotsContainer = document.getElementById('offerSlots');
    if (!slotsContainer) return;
    slotsContainer.addEventListener('input', function(e) {
        const target = e.target;
        // CORRECTED: Logic to handle search input
        if (target.id.startsWith('offerSearch-')) {
            const index = parseInt(target.id.split('-')[1]);
            if (!isNaN(index) && offerStates[index]) {
                handleSearchInput(e, `offerSearchResults-${index}`, offerStates[index], false);
            }
            return; // Stop here for search inputs
        }
        
        const index = parseInt(target.dataset.index);
        if (isNaN(index) || !offerStates[index]) return;
        if (target.classList.contains('offer-quantity')) {
            offerStates[index].quantity = parseInt(target.value) || 1;
        } else if (target.classList.contains('offer-upgrade')) {
            const level = parseInt(target.value);
            offerStates[index].level = level;
            document.getElementById(`offerLevelLabel-${index}`).textContent = `+${level}`;
        }
        updateCalculations();
    });
    slotsContainer.addEventListener('change', function(e) {
        const target = e.target;
        const index = parseInt(target.dataset.index);
        if (isNaN(index) || !offerStates[index]) return;
        if (target.classList.contains('offer-broken')) {
            offerStates[index].isBroken = target.checked;
            updateCalculations();
        }
    });
    slotsContainer.addEventListener('click', function(e) {
        const target = e.target;
        if (target.classList.contains('remove-offer-btn')) {
            const index = parseInt(target.dataset.index);
            if (!isNaN(index) && offerStates[index]) {
                offerStates.splice(index, 1);
                renderOfferSlots();
                document.getElementById('addOfferSlot').disabled = offerStates.length >= 5;
            }
        }
        const pieceButton = target.closest('[data-piece]');
        if (pieceButton) {
            const group = target.closest('.piece-button-group');
            const index = parseInt(group.dataset.index);
            if (!isNaN(index) && offerStates[index]) {
                offerStates[index].armorPiece = pieceButton.dataset.piece;
                updateGearControls(offerStates[index], index, false);
                updateCalculations();
            }
        }
    });
}

// --- INITIALIZATION ---
window.onload = function() {
    document.getElementById('targetSearch').addEventListener('input', (e) => handleSearchInput(e, 'targetSearchResults', targetState, true));
    document.getElementById('targetQuantity').addEventListener('input', (e) => {
        targetState.quantity = parseInt(e.target.value) || 1;
        updateCalculations();
    });
    document.getElementById('targetGearControls').addEventListener('input', (e) => {
        if (e.target.id === 'targetUpgradeLevel') {
            targetState.level = parseInt(e.target.value);
            document.getElementById('targetLevelLabel').textContent = `+${targetState.level}`;
            updateCalculations();
        }
    });
    document.getElementById('targetBrokenToggle').addEventListener('change', (e) => {
        targetState.isBroken = e.target.checked;
        updateCalculations();
    });
    document.getElementById('targetPieceButtons').addEventListener('click', (e) => {
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
    if (offerStates.length === 0) { document.getElementById('addOfferSlot').click(); }
    populateAboutSection();
};

// --- ABOUT SECTION POPULATION ---
const itemCategories = {
    "1. Orbs": ["Small Orb I", "Small Orb II", "Small Orb III", "Medium Orb I", "Medium Orb II", "Medium Orb III", "Large Orb I", "Large Orb II", "Large Orb III"],
    "2. Weapons - Green / Blue": ["Green Weapon", "Blue Weapons", "Ice Club", "Ice Crossbow", "Ice Dagger", "Ice Support Staff", "Ice Combat Staff", "Ice Shield and Sword"],
    "2.1. Weapons - Purple": ["Dragon Bite", "Dragon Bow", "Fire Bow", "5-Shot Crossbow", "Dragon Combat Staff", "Wrath Staff", "Reaper Staff", "Cutter of Grey Clan", "Dragon Dagger", "Fire Dagger", "Dragon Shield and Sword", "Nord Shield and Sword", "Dragon Sword", "Fire Axe", "Cleaver", "Giant Hammer", "Ice Axe", "Protector Spear", "Skoll Claws", "Ice Scythe", "Hel's Staff", "Dragon Support Staff", "Kirga Flask", "Surt's Flask"],
    "2.2. Weapons - Legendary": ["THOR Combat Staff", "THOR Support Staff", "THOR Bow", "THOR SNS", "THOR Flask", "THOR Dagger", "THOR Axe", "FREYJA Combat Staff", "FREYJA Support Staff", "FREYJA Crossbow", "FREYJA SNS", "FREYJA Flask", "FREYJA Dagger", "FREYJA Mace", "ALFAR Combat Staff", "ALFAR Support Staff", "ALFAR Bow", "ALFAR SNS", "ALFAR Flask", "ALFAR Dagger", "ALFAR Axe", "ALFAR Mace", "ALFAR Spear", "ELVEN Combat Staff", "ELVEN Support Staff", "ELVEN Bow", "ELVEN SNS", "ELVEN Flask", "ELVEN Dagger", "ELVEN Spear", "YMIR Combat Staff", "YMIR Support Staff", "YMIR Bow", "YMIR SNS", "YMIR Flask", "YMIR Dagger", "YMIR Axe", "DWARVEN Combat Staff", "DWARVEN Support Staff", "DWARVEN Crossbow", "DWARVEN SNS", "DWARVEN Flask", "DWARVEN Dagger", "DWARVEN Mace", "DWARVEN Axe", "BETRAYER Combat Staff", "BETRAYER Support Staff", "BETRAYER Bow", "BETRAYER SNS", "BETRAYER Flask", "BETRAYER Dagger", "BETRAYER Sword", "Emperor Sword", "Emperor Bow", "Emperor Staff", "Emperor Crossbow", "Master Smith Hammer", "Shaman Staff", "Retribution Staff", "Fire Guardian Crossbow", "Valkyrie Lance", "Arch Mage Staff", "Shadows Dagger", "Nosferatu Dagger", "Werewolf’s Flask", "Wind Mage’s Staff", "Bone Mace and Shield", "Ripper’s Dagger", "Occultist’s Flask", "Pathfinder’s Bow", "Protector’s Shield and Sword", "Oriental Saber", "Thrasher Sword", "Huscarl’s Shield and Sword", "Hellhound’s Sword", "Scythe", "Desert Mage’s Staff", "Ancestors’ Scythe"],
    "2.3. Armor - purple helm": ["Jorgun Helm", "Archivist Helm", "Instigator Helm", "Instigator Chest", "Instigator Pants", "Instigator Boots", "Dragon Helm", "Dragon Chest", "Dragon Pants", "Dragon Boots", "Shaman Helm"],
    "2.4 Armor - Legendary": ["Warden Set", "Scout Set", "Sorcerer Set", "Heavy Dragon Set", "Medium Dragon Set", "Light Dragon Set", "Barbarian Set", "Medium Elven Set", "Heavy Elven Set", "Light Elven Set", "Heavy Betrayer Set", "Light Betrayer Set", "Medium Betrayer Set", "Medium Ymir Set", "Heavy Ymir Set", "Light Ymir Set", "Sand King Set", "Light Tribal Set", "Witchdoctor Set", "Valkyrie Helm", "Celestial Dragon Helm", "Protector’s Helm", "Hellbound’s Helm", "Occultist’s Helm", "Huscarl’s Helmet", "Desert Mage’s Turban"],
    "3. Resources from Zones 🌲": ["Pine Wood", "Pine Plank", "Limestone", "Limestone Block", "Maple Log", "Maple Plank", "Charcoal", "Plant Fiber", "Fabric", "Rope", "Animal Skin", "Thick Fabric", "Leather", "North Rawhide", "Warm Fabric", "Iron Ore", "Scrap Iron", "Iron Ingot", "Iron Plate", "Iron Nail", "Copper Ore", "Dirty Copper", "Copper Ingot", "Tin Rod", "Tin Ingot", "Tin Plate", "Steel Ingot", "Steel Plate", "Orichalcum Ore", "Orichalcum Ingot", "Blacksmith Hammer", "Eternal Ice", "Dragon Tear", "Fire Bloom"],
    "3.1 Resources from Odin's/Tombs": ["Soul Stone", "Bone Fastener", "Resin", "Oil", "Pliers", "Chains", "Ghost Flower", "Metal Parts", "Needle", "Spirit", "Wax", "Varnish", "Sulfur", "Alchemical Powder", "Gold Ore", "Gold Ingot", "Dragon Scale", "Forged Fastener", "Explosive Powder", "Rune of Power", "Loki Rune", "Feather", "Fish Glue", "Leather Strips"],
    "3.2 Southern Resources": ["Ancient Tree Log", "Ancient Tree Plank", "Magic Clay", "Clay Brick", "Meteorite Ore", "Meteorite Ingot", "Ancient Rawhide", "Ancient Leather", "Elven Blood", "Exquisite Meat", "Loki’s Berrie", "Ghost Essence", "Salt", "Gum", "Nectar", "Medallion of Power", "Medallion Base T1", "Medallion Base T2", "Medallion of Valor", "Medallion of Honor", "Hearth Stone", "Steel Pickaxe", "Elven Tool", "Drowned Chest"],
    "3.3 Manor resources": ["Construction Pickaxe", "Bucket", "Set of Tools", "Mortar", "Copper Nails", "Pine Beam", "Sturdy Pine Log", "Sturdy Limestone", "Limestone Brick", "Maple Beam", "Sturdy Bones", "Oats", "Oat Seeds", "Premium Fertilizer", "Improved Fertilizer", "Simple Fertilizer"],
    "3.4 Fishing Resources": ["Season Fish", "Common Fish", "Uncommon Fish", "Rare Fish", "Epic Fish", "Bait", "Fishing Net"],
    "4. Food / Healing / Potions": ["Raw Meat", "Berries", "North Berries", "North Meat", "Meat", "Cooked Food", "Goulash", "Water Bottle", "Carrot", "Mushroom Soup", "Primrose Soup", "Oatmeal", "Blood Sausage", "Elven Decoction", "Healing Pie", "Pumpkin Soup", "Mead", "Mulled Wine", "Meat in Honey Sauce", "Sushi", "Spicy Seafood", "Asgardian Honey", "Festive Cookies", "Fish in Hot Sauce", "Ribs", "Fish Barbecue", "Warrior Elixir", "Hunter Elixir", "Mage Elixir", "Survival Elixir", "Speed Potion", "Berserk Potion", "Shield Potion", "Dragon Beer", "Dispel Potion", "Reflect Potion", "Clan Boss Potion", "Dexterity Potion", "Fury Potion", "Guardian’s Potion", "Invisibility Potion", "Purification Potion", "Elixir of Protector"],
    "5. Gadgets / Traps / Scrolls": ["Bolas", "Stun Bomb", "Fire Bomb", "Throwing Axe", "Fire Trap", "Stun Hammer", "Weakening Dart", "Healing Totem", "Stun Trap", "Throwing Cleaver", "Fear Trap", "Rune Hammer", "Improved Bolas", "Decoy Totem", "Thunder Totem", "Improved Hammer", "Instigator’s Trap", "Bowman Scroll", "Barrel Scroll", "Healing Bomb", "Odin’s Punishment", "Wall of Fire", "Improved Bandages", "Rich Fish Soup", "Dexterity Potion", "Guardian’s Potion", "Fury Potion"],
    "6. Others / Keys / Collectibles": ["Wood Pendant", "Steel Pendant", "Gold Pendant", "Magic Pendant", "Sanctum Key", "Forge Key", "Archive Key", "Library Key", "Ice Vault Key", "Logi Key", "Alfar Key", "Alfar Key Part 1", "Alfar Key Part 2", "Labyrinth Key", "Blue Bag", "Donation Points", "Instant Repair Service", "Odin Offering", "Ash Ring"],
};

function populateAboutSection() {
    let html = '';
    const formatListItem = (name) => {
        const itemData = getItemData(name);
        if (!itemData) {
            console.warn(`Item not found for About section: ${name}`);
            return '';
        }
        const color = getRarityColor(itemData.rarity);
        const priceText = formatLS(itemData.price);
        return `<li class="flex justify-between items-center py-1 border-b border-gray-700/50"><span>${name}</span><span class="px-2 py-0.5 rounded text-xs font-semibold" style="background-color: ${color}; color: #1f2937;">${priceText}</span></li>`;
    };
    for (const [title, items] of Object.entries(itemCategories)) {
        html += `<h3 class="text-xl font-semibold gold-text mt-4">${title} (${items.length} Items)</h3><ul class="list-none space-y-1">`;
        for (const itemName of items) {
            html += formatListItem(itemName.trim());
        }
        html += `</ul>`;
    }
    document.getElementById('itemListDisplay').innerHTML = html;
}