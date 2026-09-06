import { Instance } from "cs_script/point_script";

// --- Constants ---
const DEBUG = true; // Set to true to enable debug logging
const MAX_FIRE_EXPLOSIONS_PER_USE = 5; // Maximum number of fire explosions per single Fire item use

// --- State Variables ---
let currentFireUseCount = 0; // Counts explosions spawned in current Fire item use

/**
 * Fire Infection Handler
 * Called when the Fire item's trigger_hurt hits a T player
 * Spawns a point_template (hfire_exptemp) at the hit player's location up to 5 times per use
 * The template contains entities that will parent to the player and create periodic explosions
 * 
 * Expected usage in Hammer:
 * trigger_hurt -> OnHurtPlayer -> item_fire_script -> RunScriptInput -> FireInfection
 * 
 * @param {Object} inputData - Contains caller (trigger_hurt) and activator (hit player)
 */
function FireInfection(inputData) {
	const hitPlayer = inputData?.activator;
	if (!hitPlayer) {
		if (DEBUG) Instance.Msg("[Fire] No activator (hit player) found!");
		return;
	}
	// Check if player is on T team (team 2)
	const team = hitPlayer.GetTeamNumber();
	if (team !== 2) {
		if (DEBUG) Instance.Msg("[Fire] Player is not on T team, ignoring");
		return;
	}

	// Check explosion limit per use (max 5 players can be infected per Fire use)
	if (currentFireUseCount >= MAX_FIRE_EXPLOSIONS_PER_USE) {
		if (DEBUG) Instance.Msg("[Fire] Max explosions per use reached (" + MAX_FIRE_EXPLOSIONS_PER_USE + "), cannot spawn more");
		return;
	}

	// Find the fire explosion template
	const fireExpTemplate = Instance.FindEntityByName("hfire_exptemp");
	if (!fireExpTemplate) {
		if (DEBUG) Instance.Msg("[Fire] Fire explosion template (hfire_exptemp) not found!");
		return;
	}

	// Get player's position and spawn template directly
	const playerOrigin = hitPlayer.GetAbsOrigin();
	fireExpTemplate.ForceSpawn(playerOrigin);

	currentFireUseCount++;
	if (DEBUG) {
		Instance.Msg("[Fire] Spawning fire explosion at player location. Count: " + currentFireUseCount + "/" + MAX_FIRE_EXPLOSIONS_PER_USE);
	}
}

function ResetFireCount() {
	if (DEBUG && currentFireUseCount > 0) {
		Instance.Msg("[Fire] Resetting fire use count from " + currentFireUseCount + " to 0");
	}
	currentFireUseCount = 0;
}

Instance.OnRoundStart(() => ResetFireCount());
Instance.OnRoundEnd(() => ResetFireCount());

// Register OnScriptInput handlers
Instance.OnScriptInput("FireInfection", (inputData) => FireInfection(inputData));
Instance.OnScriptInput("ResetFireCount", () => ResetFireCount());

// ===== Item Special Effects =====

let zmItemRestrictFlag = 0;
function ZMItemRestrictToggle() {
	// Toggle the flag
	zmItemRestrictFlag = zmItemRestrictFlag === 0 ? 1 : 0;
	
	// Update env_entitymaker templates
	const makers = [
		{ name: "zwarp_maker", enabledTemplate: "zwarp_projtemp" },
		{ name: "zfortress_shield_maker", enabledTemplate: "zfortress_shield_temp" },
		{ name: "zice_maker", enabledTemplate: "zice_projtemp" }
	];
	
	makers.forEach((maker) => {
		const templateValue = zmItemRestrictFlag === 0 ? maker.enabledTemplate : "";
		Instance.EntFireAtName({
			name: maker.name,
			input: "KeyValue",
			value: "EntityTemplate " + templateValue,
			delay: 0
		});
	});
	
	// Also toggle zombie item access in filter.js
	Instance.EntFireAtName({
		name: "filter_script",
		input: "RunScriptInput",
		value: "ToggleZombieItems",
		delay: 0
	});
	
	if (DEBUG) {
		Instance.Msg("[GensoItem] ZM Item Restrict: " + (zmItemRestrictFlag === 0 ? "ENABLED" : "DISABLED"));
	}
}

// Register additional handlers
Instance.OnScriptInput("SetImmortal", (inputData) => {
	const player = inputData?.activator;
	if (!player) {
		if (DEBUG) Instance.Msg("[GensoItem] No activator for SetImmortal");
		return;
	}
	Instance.EntFireAtTarget({
		target: player,
		input: "SetDamageFilter",
		value: "filter_immune_zm",
		delay: 0.02
	});
	Instance.EntFireAtTarget({
		target: player,
		input: "SetDamageFilter",
		value: "",
		delay: 6.0
	});
});

Instance.OnScriptInput("NoFatality", (inputData) => {
	const player = inputData?.activator;
	if (!player) {
		if (DEBUG) Instance.Msg("[GensoItem] No activator for NoFatality");
		return;
	}
	if (player.GetHealth() < 2000 && player.GetTeamNumber() === 2) {
		Instance.EntFireAtTarget({
			target: player,
			input: "SetHealth",
			value: "2000",
			delay: 0.0
		});
	}
});

Instance.OnScriptInput("GensoHoly", (inputData) => {
	const player = inputData?.activator;
	if (!player) {
		if (DEBUG) Instance.Msg("[GensoItem] No activator for GensoHoly");
		return;
	}
	if (player.GetTeamNumber() === 2) {
		player.TakeDamage({
			damage: 999999999
		});
	}
});

// Heal Zone Management
const playersInHealZone = new Set();
const HEAL_ZONE_MAX_HP = 220;
const HEAL_ZONE_MAX_ARMOR = 200;
const HEAL_ZONE_INTERVAL = 0.1;
const HEAL_ZONE_HP_PER_TICK = 6; // 60 HP/s at 0.1s interval
const HEAL_ZONE_ARMOR_PER_TICK = 3; // 30 armor/s at 0.1s interval
let healLoopActive = false;

Instance.OnScriptInput("GensoHHealEnter", (inputData) => {
	const player = inputData?.activator;
	if (!player) {
		if (DEBUG) Instance.Msg("[GensoHHeal] No activator for entry");
		return;
	}
	
	// CT（team3）
	if (player.GetTeamNumber() === 3) {
		playersInHealZone.add(player);
		// setmaxhealth
		player.SetMaxHealth(HEAL_ZONE_MAX_HP);
		const controller = player.GetPlayerController();
		if (DEBUG && controller) Instance.Msg("[GensoHHeal] Player entered: " + controller.GetPlayerName());
	}
});

Instance.OnScriptInput("GensoHHealExit", (inputData) => {
	const player = inputData?.activator;
	if (player) {
		const controller = player.GetPlayerController();
		playersInHealZone.delete(player);
		if (DEBUG && controller) Instance.Msg("[GensoHHeal] Player exited: " + controller.GetPlayerName());
	}
});

Instance.OnScriptInput("HealLoopStart", () => {
	healLoopActive = true;
	if (DEBUG) Instance.Msg("[GensoHHeal] Healing loop started");
	// schedule the first loop tick
	Instance.EntFireAtName({
		name: "item_script",
		input: "RunScriptInput",
		value: "HealLoopTick",
		delay: 0
	});
});

Instance.OnScriptInput("HealLoopStop", () => {
	healLoopActive = false;
	if (DEBUG) Instance.Msg("[GensoHHeal] Healing loop stopped");
});

// Healing tick
Instance.OnScriptInput("HealLoopTick", () => {
	if (!healLoopActive) return;
	
	playersInHealZone.forEach(player => {
		if (!player || !player.IsValid()) {
			playersInHealZone.delete(player);
			return;
		}
		
		// hpheal(per 0.1s): 6 HP, armor: 3
		const currentHealth = player.GetHealth();
		const newHealth = Math.min(currentHealth + HEAL_ZONE_HP_PER_TICK, HEAL_ZONE_MAX_HP);
		player.SetHealth(newHealth);
		
		const currentArmor = player.GetArmor();
		const newArmor = Math.min(currentArmor + HEAL_ZONE_ARMOR_PER_TICK, HEAL_ZONE_MAX_ARMOR);
		player.SetArmor(newArmor);
		
		// refill ammo
		const activeWeapon = player.GetActiveWeapon();
		if (activeWeapon) {
			Instance.EntFireAtTarget({
				target: activeWeapon,
				input: "SetAmmoAmount",
				value: "999",
				delay: 0
			});
		}
	});
	
	// schedule
	Instance.EntFireAtName({
		name: "item_script",
		input: "RunScriptInput",
		value: "HealLoopTick",
		delay: HEAL_ZONE_INTERVAL
	});
});

Instance.OnScriptInput("ZMItemRestrictToggle", () => ZMItemRestrictToggle());

//=========================================================================================//
//     Item-Shuffler
//  未完成
//  Item-List on Normal-mode
//   Human-Item: 0:Heal 1:Fire 2:(Wind, Thunder, Ice or Gravity)
//   Zombie-Item: 0:zmIce 1:zmDark 2:zmPoison
//
//  Item-List on Hard-mode
//   Human-Item: 0:Heal 1:Fire 2, 3:(Wind, Thunder, Ice or Gravity)
//   Zombie-Item: 0:zmIce 1:zmDark 2:zmPoison 3:zmWarp
//
//  Item-List on Soul-mode
//   Human-Item: 0:Heal 1:Fire 2, 3:(Wind, Thunder, Ice or Gravity) 4:Sword
//   Zombie-Item: 0:zmIce 1:zmDark 2:zmPoison 3:zmWarp 4:zmSpeed 5:zmMeteor
//
//  Item-List on Terminal-mode
//   Human-Item: 0:Heal 1:Fire 2, 3:(Wind, Thunder, Ice or Gravity) 4:Sword 5:Earth
//   Zombie-Item: 0:zmIce 1:zmDark 2:zmPoison 3:zmWarp 4:zmSpeed 5:zmMeteor 6:zmFortress
//=========================================================================================//

const vec = (x, y, z) => ({ x, y, z });

const ITEM_DATA = {
	human: {
		heal: { template: "hheal_temp", tier: 0 },
		fire: { template: "hfire_temp", tier: 0 },
		earth: { template: "hearth_temp", tier: 1 },
		wind: { template: "hwind_temp", tier: 1 },
		thunder: { template: "hthunder_temp", tier: 2 },
		ice: { template: "hice_temp", tier: 1 },
		grav: { template: "hgrav_temp", tier: 1 },
		sword: { template: "hsword_temp", tier: 0 },
		holy: { template: "hholy_temp", tier: 0 },
		lance: { template: "hlance_temp", tier: 2 }
	},
	zombie: {
		zspeed: { template: "zspeed_temp", tier: 1 },
		zwarp: { template: "zwarp_temp", tier: 2 },
		zgrav: { template: "zgrav_temp", tier: 2 },
		zfortress: { template: "zfortress_temp", tier: 1 },
		zice: { template: "zice_temp", tier: 2 },
		zpoison: { template: "zpoison_temp", tier: 2 }
	}
};

// Preferred human item to auto-attach when zombies have a higher tier on the field.
// Must be tier 1 items (power items that can counter zombie pushes)
const HUMAN_TIER_FALLBACK = {
	1: ["earth", "wind", "ice", "grav"], // tier 1 item pool for fallback
	2: ["earth", "wind", "ice", "grav"]  // tier 1 item pool for fallback
};

// Tier fallback should use category keys so position handling stays unified in resolvePositions().
const HUMAN_TIER_FALLBACK_CATEGORY = {
	1: "outsidelater",
	2: "insidelater"
};

const POSITION_CATEGORIES = {
	outsideformer: [
		vec(-632, -12632, -176),
		vec(832, -10816, -248),
		vec(832, -10816, -248),
		vec(-844, -10816, -248),
		vec(-304, -10096, -396),
		vec(-524, -10000, -420),
		vec(-984, -9308, -264),
		vec(804, -8640, -432),
		vec(-352, -8483.85, -412),
		vec(8, -7376, -253.317),
		vec(644, -6488, -253.317),
		vec(660, -5900, -253.317),
		vec(429, -5592, -167),
		vec(1412, -5460, -253.317),
		vec(-588, -5876, -248)
	],
	outsidelater: [
		vec(-1376, -5116, -248),
		vec(-612, -4344, -248),
		vec(1400, -5124, -248),
		vec(604, -4440, -248),
		vec(1552, -3980, -324),
		vec(508, -3316, -212),
		vec(1085.89, -2504, -136),
		vec(96, -3096, -220),
		vec(-60, -3096, -220),
		vec(-968, -2608, -268),
		vec(938, -1589, -136),
		vec(345, -1954, -405),
		vec(-862, -1626, -206)
	],
	insideformer: [
		vec(-392, 1048, -232.373),
		vec(-848, 788, -232.373),
		vec(-863.979, 372.82, -241),
		vec(-916, -364, -208),
		vec(860, -756, -248),
		vec(928, 360, -248),
		vec(420, 1992, -196),
		vec(-376, 1992, -196)
	    ],
	insidelater: [
		vec(-688.655, 2671, -174),
		vec(696.906, 2616.92, -193.75),
		vec(672, 3412, -232),
		vec(16, 3232, -216),
		vec(716, 4560, -72),
		vec(-692, 4560, -72),
		vec(-852, 4260, -92),
		vec(-1372, 4388, -68),
		vec(-1332, 2616, -252),
		vec(-812, 2616, -264),
		vec(840, 2616, -264),
		vec(880, 4112, -92),
		vec(880, 3748, -264),
		vec(612, 6488, -100),
		vec(132, 7572, 368),
		vec(112, 6588, 368),
		vec(1216, 7992, -72),
		vec(1284, 6836, -72),
		vec(-1128, 8180, -128),
		vec(-1252, 6836, -96),
		vec(-348, 8128, -284)
	    ]
};

const AREA = {
	outsideformer: "#sym:outsideformer",
	outsidelater: "#sym:outsidelater",
	insideformer: "#sym:insideformer",
	insidelater: "#sym:insidelater"
};

const AREA_SEQUENCE = ["outsideformer", "outsidelater", "insideformer", "insidelater"];
const AREA_SYMBOL_TO_KEY = new Map(Object.entries(AREA).map(([key, value]) => [value, key]));

function getAreaKey(area)
{
	if (!area)
	{
		return null;
	}

	if (AREA[area])
	{
		return area;
	}

	return AREA_SYMBOL_TO_KEY.get(area) ?? null;
}

function getPositionsForArea(areaKey, options = {})
{
	const cumulative = options.cumulative ?? true;
	if (!cumulative)
	{
		return POSITION_CATEGORIES[areaKey] ?? [];
	}

	const index = AREA_SEQUENCE.indexOf(areaKey);
	if (index < 0)
	{
		return [];
	}

	const positions = [];
	for (let i = 0; i <= index; i++)
	{
		positions.push(...(POSITION_CATEGORIES[AREA_SEQUENCE[i]] ?? []));
	}

	return positions;
}

function getCumulativePositionsForArea(areaKey)
{
	return getPositionsForArea(areaKey, { cumulative: true });
}

function shuffleInPlace(items)
{
	for (let i = items.length - 1; i > 0; i--)
	{
		const j = Math.floor(Math.random() * (i + 1));
		const tmp = items[i];
		items[i] = items[j];
		items[j] = tmp;
	}
	return items;
}

function randomPartition(total, bins)
{
	if (bins <= 0)
	{
		return [];
	}

	const cuts = [];
	for (let i = 0; i < bins - 1; i++)
	{
		cuts.push(Math.floor(Math.random() * (total + 1)));
	}
	cuts.sort((a, b) => a - b);

	const counts = [];
	let last = 0;
	for (const cut of [...cuts, total])
	{
		counts.push(cut - last);
		last = cut;
	}
	return counts;
}

function buildAreaAssignment(entries, areaCounts)
{
	const shuffled = shuffleInPlace(entries.slice());
	const assignment = new Map();
	let index = 0;

	for (let i = 0; i < AREA_SEQUENCE.length; i++)
	{
		const areaKey = AREA_SEQUENCE[i];
		const count = areaCounts[i] ?? 0;
		for (let j = 0; j < count; j++)
		{
			const entry = shuffled[index++];
			if (!entry)
			{
				break;
			}
			assignment.set(entry, areaKey);
		}
	}

	return assignment;
}

function prefixLeadIsSafe(humanEntries, zombieEntries)
{
	let humanCum = 0;
	let zombieCum = 0;

	for (const areaKey of AREA_SEQUENCE)
	{
		humanCum += humanEntries.filter((entry) => getAreaKey(entry.area) === areaKey).length;
		zombieCum += zombieEntries.filter((entry) => getAreaKey(entry.area) === areaKey).length;
		if (humanCum < zombieCum)
		{
			return false;
		}
	}

	return true;
}

function applyAreaAssignment(entries, assignment)
{
	entries.forEach((entry) => {
		const areaKey = assignment.get(entry);
		if (!areaKey)
		{
			return;
		}
		entry.area = AREA[areaKey];
		entry.positions = areaKey;
		delete entry.randomArea;
	});
}

function assignRandomAreasByProgression(humanEntries, zombieEntries)
{
	const humanMovable = humanEntries.filter((entry) => entry.randomArea);
	const zombieMovable = zombieEntries.filter((entry) => entry.randomArea);

	if (humanMovable.length === 0 && zombieMovable.length === 0)
	{
		return;
	}

	for (let attempt = 0; attempt < 200; attempt++)
	{
		const humanAssignment = buildAreaAssignment(humanMovable, randomPartition(humanMovable.length, AREA_SEQUENCE.length));
		const zombieAssignment = buildAreaAssignment(zombieMovable, randomPartition(zombieMovable.length, AREA_SEQUENCE.length));

		const candidateHumans = humanEntries.map((entry) => {
			if (!entry.randomArea)
			{
				return entry;
			}

			const areaKey = humanAssignment.get(entry);
			if (!areaKey)
			{
				return entry;
			}

			return {
				...entry,
				area: AREA[areaKey],
				positions: areaKey
			};
		});

		const candidateZombies = zombieEntries.map((entry) => {
			if (!entry.randomArea)
			{
				return entry;
			}

			const areaKey = zombieAssignment.get(entry);
			if (!areaKey)
			{
				return entry;
			}

			return {
				...entry,
				area: AREA[areaKey],
				positions: areaKey
			};
		});

		if (prefixLeadIsSafe(candidateHumans, candidateZombies))
		{
			applyAreaAssignment(humanMovable, humanAssignment);
			applyAreaAssignment(zombieMovable, zombieAssignment);
			return;
		}
	}

	// Fallback: front-load humans and back-load zombies so humans never fall behind by area.
	const humanFallbackOrder = ["outsideformer", "outsideformer", "outsidelater", "insideformer", "insidelater"];
	const zombieFallbackOrder = ["outsidelater", "insideformer", "insideformer", "insidelater", "insidelater"];

	const humanFallback = new Map();
	humanMovable.forEach((entry, index) => {
		const areaKey = humanFallbackOrder[Math.min(index, humanFallbackOrder.length - 1)];
		humanFallback.set(entry, areaKey);
	});

	const zombieFallback = new Map();
	zombieMovable.forEach((entry, index) => {
		const areaKey = zombieFallbackOrder[Math.min(index, zombieFallbackOrder.length - 1)];
		zombieFallback.set(entry, areaKey);
	});

	applyAreaAssignment(humanMovable, humanFallback);
	applyAreaAssignment(zombieMovable, zombieFallback);
}

function resolvePositions(descriptor, options = {})
{
	if (!descriptor) return [];
	const cumulativeCategories = options.cumulativeCategories ?? true;

	const parseCoordString = (s) => {
		if (typeof s !== 'string') return null;
		const parts = s.trim().split(/\s+/);
		if (parts.length !== 3) return null;
		const nums = parts.map((p) => parseFloat(p));
		if (nums.some((n) => Number.isNaN(n))) return null;
		return vec(nums[0], nums[1], nums[2]);
	};

	if (typeof descriptor === 'string')
	{
		const coord = parseCoordString(descriptor);
		if (coord) return [coord];
		const areaKey = getAreaKey(descriptor);
		if (areaKey) return getPositionsForArea(areaKey, { cumulative: cumulativeCategories });
		return [];
	}

	if (Array.isArray(descriptor))
	{
		if (descriptor.length === 0) return [];
		const out = [];

		for (const el of descriptor)
		{
			if (!el) continue;

			// string entries: either coord strings or category/key names
			if (typeof el === 'string')
			{
				const coord = parseCoordString(el);
				if (coord) { out.push(coord); continue; }

				// category name
				const areaKey = getAreaKey(el);
				const cat = areaKey ? getPositionsForArea(areaKey, { cumulative: cumulativeCategories }) : null;
				if (cat && cat.length) { out.push(...cat); continue; }

				// If a single-key category exists, it will be returned above.
				continue;
				continue;
			}

			// object entries: could be vec-like ({x,y,z}) or { origin: "x y z" }
			if (typeof el === 'object')
			{
				if (el.x !== undefined && el.y !== undefined && el.z !== undefined)
				{
					out.push(el);
					continue;
				}
				const originVal = el.origin || el.Origin || el.pos || el.position;
				if (originVal)
				{
					const coord = parseCoordString(originVal);
					if (coord) { out.push(coord); continue; }
				}
				continue;
			}
		}

		return out;
	}

	return [];
}

// (Position categories are static vec arrays; runtime add/remove helpers intentionally omitted)

const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];

// Generates all combinations of `size` elements from `arr`
// e.g., getCombinations(['a', 'b', 'c', 'd'], 3) => [['a','b','c'], ['a','b','d'], ['a','c','d'], ['b','c','d']]
function getCombinations(arr, size)
{
	if (size === 1)
	{
		return arr.map((e) => [e]);
	}
	if (size === arr.length)
	{
		return [arr];
	}
	const result = [];
	for (let i = 0; i <= arr.length - size; i++)
	{
		const head = arr[i];
		const rest = getCombinations(arr.slice(i + 1), size - 1);
		result.push(...rest.map((combination) => [head, ...combination]));
	}
	return result;
}

function getItemData(faction, key)
{
	const item = ITEM_DATA[faction]?.[key];
	if (!item && DEBUG)
	{
		Instance.Msg(`[ItemSpawner] Missing item data for ${faction}:${key}`);
	}
	return item;
}

function spawnTemplateAt(templateName, origin, label)
{
	const template = Instance.FindEntityByName(templateName);

	if (!template || typeof template.ForceSpawn !== "function")
	{
		if (DEBUG)
		{
			Instance.Msg(`[ItemSpawner] Template missing or invalid: ${label ?? templateName}`);
		}
		return;
	}

	template.ForceSpawn(origin);
}

// Utility: key for a position (useful for uniqueness checks)
function positionKey(pos)
{
	return `${pos.x}|${pos.y}|${pos.z}`;
}

function getAllKnownPositions()
{
	const seen = new Set();
	const positions = [];

	Object.values(POSITION_CATEGORIES).forEach((categoryPositions) => {
		categoryPositions.forEach((pos) => {
			const key = positionKey(pos);
			if (seen.has(key))
			{
				return;
			}
			seen.add(key);
			positions.push(pos);
		});
	});

	return positions;
}

// Choose a position from `positions` that is not already in `usedSet` when possible.
function chooseUniquePosition(positions, usedSet, allowGlobalFallback = true)
{
	if (!usedSet || usedSet.size === 0)
	{
		return pickRandom(positions);
	}

	const allPositions = allowGlobalFallback ? getAllKnownPositions() : [];
	const orderedCandidates = [...(positions || []), ...allPositions];
	const order = orderedCandidates.slice();
	for (let i = order.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const tmp = order[i]; order[i] = order[j]; order[j] = tmp;
	}

	const seen = new Set();
	for (const p of order)
	{
		const k = positionKey(p);
		if (seen.has(k))
		{
			continue;
		}
		seen.add(k);
		if (!usedSet.has(k))
		{
			return p;
		}
	}

	return null;
}

function spawnItem(faction, key, positions, label, usedSet, options = {})
{
	const item = getItemData(faction, key);
	if (!item)
	{
		return;
	}

	const resolved = resolvePositions(positions, {
		cumulativeCategories: options.cumulativeCategories ?? true
	});
	if (!resolved || resolved.length === 0)
	{
		if (DEBUG) Instance.Msg(`[ItemSpawner] No positions resolved for ${label ?? key}`);
		return;
	}

	const position = (usedSet ? chooseUniquePosition(resolved, usedSet, options.allowGlobalFallback ?? true) : pickRandom(resolved));
	if (!position)
	{
		if (DEBUG) Instance.Msg(`[ItemSpawner] No available unique position for ${label ?? key}`);
		return;
	}

	spawnTemplateAt(item.template, position, label ?? key);

	if (usedSet)
	{
		usedSet.add(positionKey(position));
	}
}

function ensureTierParity(humanEntries, zombieEntries)
{
	const areas = new Set(["global"]);
	zombieEntries.forEach((e) => areas.add(e.area ?? "global"));
	humanEntries.forEach((e) => areas.add(e.area ?? "global"));

	areas.forEach((area) => {
		const maxZmTier = zombieEntries.reduce((m, e) => {
			if ((e.area ?? "global") !== area)
			{
				return m;
			}
			const item = getItemData("zombie", e.item);
			return item ? Math.max(m, item.tier ?? 0) : m;
		}, 0);

		const maxHumanTier = humanEntries.reduce((m, e) => {
			if ((e.area ?? "global") !== area)
			{
				return m;
			}
			const item = getItemData("human", e.item);
			return item ? Math.max(m, item.tier ?? 0) : m;
		}, 0);

		if (maxHumanTier < maxZmTier)
		{
			const fallbackPool = HUMAN_TIER_FALLBACK[maxZmTier] ?? HUMAN_TIER_FALLBACK[1];
			// Prefer a fallback key that's not already present among human entries to avoid duplicate spawns of the same item
			const existingHumanKeys = new Set(humanEntries.map((he) => he.item));
			const availablePool = (fallbackPool || []).filter((k) => !existingHumanKeys.has(k));
			const fallbackKey = availablePool.length ? pickRandom(availablePool) : pickRandom(fallbackPool);
			const areaKey = getAreaKey(area);
			const fallbackCategory = areaKey ?? HUMAN_TIER_FALLBACK_CATEGORY[maxZmTier] ?? HUMAN_TIER_FALLBACK_CATEGORY[1];
			if (fallbackKey && fallbackCategory)
			{
				humanEntries.push({
					item: fallbackKey,
					positions: fallbackCategory,
					label: "TierParity",
					area,
					exactCategory: true,
					strictArea: true
				});
				if (DEBUG)
				{
					Instance.Msg(`[ItemSpawner] Added human tier fallback '${fallbackKey}' for area '${area}' using category '${fallbackCategory}' to match zombie tier ${maxZmTier}`);
				}
			}
		}
	});
}

function spawnEntries(faction, entries)
{
	entries.forEach((entry) => {
		// usedSet may be provided on the function object (set by caller)
		const usedSet = spawnEntries._usedSet || null;
		spawnItem(faction, entry.item, entry.positions, entry.label, usedSet, {
			cumulativeCategories: !entry.exactCategory,
			allowGlobalFallback: !entry.strictArea
		});
	});
}

function buildRandomEntries(items, count, labelPrefix)
{
	const choices = getCombinations(items, count);
	const selected = pickRandom(choices);

	return selected.map((item, index) => ({
		item,
		positions: null,
		label: `${labelPrefix} ${index + 1}`,
		randomArea: true
	}));
}

function runSpawnCycle(humanEntries, zombieEntries)
{
	assignRandomAreasByProgression(humanEntries, zombieEntries);
	ensureTierParity(humanEntries, zombieEntries);
	makeUniqueAcrossFactions(humanEntries, zombieEntries);

	const usedSet = new Set();
	spawnEntries._usedSet = usedSet;
	spawnEntries("human", humanEntries);
	spawnEntries("zombie", zombieEntries);
	spawnEntries._usedSet = null;
}

function spawnNormal()
{
	const tier0Items = [
		{ item: "heal", positions: 'outsidelater', label: "Heal", area: AREA.outsidelater, exactCategory: true, strictArea: true },
		{ item: "fire", positions: 'outsideformer', label: "Fire", area: AREA.outsideformer, exactCategory: true, strictArea: true }
	];

	const randomPool = ['earth', 'wind', 'thunder', 'ice', 'grav', 'lance'];
	const randomItems = buildRandomEntries(randomPool, 2, "Random");
	const humanEntries = [...tier0Items, ...randomItems];

	const zombieEntries = [
		{ item: "zice", positions: null, label: "ZM Ice", randomArea: true },
		{ item: "zgrav", positions: null, label: "ZM Gravity", randomArea: true },
		{ item: "zpoison", positions: null, label: "ZM Poison", randomArea: true }
	];

	runSpawnCycle(humanEntries, zombieEntries);
}

function spawnHard()
{
	const tier0Items = [
		{ item: "heal", positions: 'outsidelater', label: "Heal", area: AREA.outsidelater, exactCategory: true, strictArea: true },
		{ item: "fire", positions: 'outsideformer', label: "Fire", area: AREA.outsideformer, exactCategory: true, strictArea: true }
	];
	const fixedItems = [
		{ item: "wind", positions: 'outsidelater', label: "Wind", area: AREA.outsidelater, exactCategory: true, strictArea: true }
	];

	const randomPool = ['earth', 'thunder', 'ice', 'grav', 'lance'];
	const randomItems = buildRandomEntries(randomPool, 2, "Random");
	const humanEntries = [...tier0Items, ...fixedItems, ...randomItems];

	const zombieEntries = [
		{ item: "zice", positions: null, label: "ZM Ice", randomArea: true },
		{ item: "zgrav", positions: null, label: "ZM Gravity", randomArea: true },
		{ item: "zpoison", positions: null, label: "ZM Poison", randomArea: true },
		{ item: "zspeed", positions: null, label: "ZM Speed", randomArea: true }
	];

	runSpawnCycle(humanEntries, zombieEntries);
}

function spawnSoul()
{
	const tier0Items = [
		{ item: "heal", positions: 'outsidelater', label: "Heal", area: AREA.outsidelater, exactCategory: true, strictArea: true },
		{ item: "fire", positions: 'outsideformer', label: "Fire", area: AREA.outsideformer, exactCategory: true, strictArea: true }
	];

	const randomPool = ['earth', 'wind', 'thunder', 'ice', 'grav', 'lance'];
	const randomItems = buildRandomEntries(randomPool, 5, "Random");
	const humanEntries = [...tier0Items, ...randomItems];

	const zombieEntries = [
		{ item: "zice", positions: null, label: "ZM Ice", randomArea: true },
		{ item: "zgrav", positions: null, label: "ZM Gravity", randomArea: true },
		{ item: "zpoison", positions: null, label: "ZM Poison", randomArea: true },
		{ item: "zspeed", positions: null, label: "ZM Speed", randomArea: true },
		{ item: "zwarp", positions: null, label: "ZM Warp", randomArea: true }
	];

	runSpawnCycle(humanEntries, zombieEntries);
}

function spawnTerminal()
{
	const tier0Items = [
		{ item: "heal", positions: 'outsidelater', label: "Heal", area: AREA.outsidelater, exactCategory: true, strictArea: true },
		{ item: "fire", positions: 'outsideformer', label: "Fire", area: AREA.outsideformer, exactCategory: true, strictArea: true },
		{ item: "lance", positions: null, label: "Lance", randomArea: true },
		//{ item: "sword", positions: 'insideformer', label: "Sword", area: AREA.insideformer },
		//{ item: "holy", positions: 'insidelater', label: "Holy", area: AREA.insidelater }
	];

	const randomPool = ['earth', 'wind', 'thunder', 'ice', 'grav'];
	const randomItems = buildRandomEntries(randomPool, 4, "Random");
	const humanEntries = [...tier0Items, ...randomItems];

	const zombieEntries = [
		{ item: "zice", positions: null, label: "ZM Ice", randomArea: true },
		{ item: "zgrav", positions: null, label: "ZM Gravity", randomArea: true },
		{ item: "zpoison", positions: null, label: "ZM Poison", randomArea: true },
		{ item: "zspeed", positions: null, label: "ZM Speed", randomArea: true },
		{ item: "zwarp", positions: null, label: "ZM Warp", randomArea: true },
		{ item: "zfortress", positions: null, label: "ZM Fortress", randomArea: true }
	];

	runSpawnCycle(humanEntries, zombieEntries);
}

function ItemSpawner(index)
{
	switch (index)
	{
		case 1:
			spawnNormal();
			break;
		case 2:
			spawnHard();
			break;
		case 3:
			spawnSoul();
			break;
		case 4:
			spawnTerminal();
			break;
		default:
			if (DEBUG)
			{
				Instance.Msg(`[ItemSpawner] Unknown index ${index}`);
			}
	}
}

const ITEM_SPAWN_INPUTS = new Map([
	["ItemSpawner1", () => ItemSpawner(1)],
	["ItemSpawner2", () => ItemSpawner(2)],
	["ItemSpawner3", () => ItemSpawner(3)],
	["ItemSpawner4", () => ItemSpawner(4)],
	["SpawnItemsNormal", () => ItemSpawner(1)],
	["SpawnItemsHard", () => ItemSpawner(2)],
	["SpawnItemsSoul", () => ItemSpawner(3)],
	["SpawnItemsTerminal", () => ItemSpawner(4)]
]);

ITEM_SPAWN_INPUTS.forEach((handler, inputName) => {
	Instance.OnScriptInput(inputName, (inputData) => handler(inputData));
});

// Ensure that no identical item key appears more than once across the human and zombie entry lists.
// Mutates the provided arrays in-place to keep callers' references valid.
function makeUniqueAcrossFactions(humanEntries, zombieEntries)
{
	const seen = new Set();

	const removeDuplicates = (entries) => {
		for (let i = entries.length - 1; i >= 0; i--)
		{
			const key = entries[i]?.item;
			if (!key)
			{
				entries.splice(i, 1);
				continue;
			}

			if (seen.has(key))
			{
				entries.splice(i, 1);
				continue;
			}

			seen.add(key);
		}
	};

	removeDuplicates(humanEntries);
	removeDuplicates(zombieEntries);
}
