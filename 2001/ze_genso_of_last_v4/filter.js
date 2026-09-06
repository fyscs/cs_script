import { CSGearSlot, Instance } from "cs_script/point_script";

// --- Constants ---
const DEBUG = true; // Set to true to enable debug logging

// --- State Variables ---
let allow_zombie_items = true; // true = zombies can use items, false = zombies cannot use items (e.g., during boss fights)

function ResolveWeaponFromButton(button) {
	let current = button?.GetParent?.();
	for (let depth = 0; current && depth < 4; depth++) {
		if (typeof current.GetOwner === "function" && current.GetOwner()) {
			return current;
		}

		if (typeof current.GetParent !== "function") {
			break;
		}

		current = current.GetParent();
	}

	return undefined;
}

/**
 * Filter function to check if activator owns the item
 * Called via RunScriptInput from func_button
 * 
 * Expected usage in Hammer:
 * func_button -> OnPressed -> item_filter_script -> RunScriptInput -> CheckOwner
 * 
 * The button should be parented to the weapon entity
 * The weapon entity should have an owner (GetOwner())
 */
function CheckOwner(inputData) {
	// Get the activator (player who pressed the button)
	const activator = inputData?.activator;
	if (!activator) {
		if (DEBUG) Instance.Msg("[Filter] No activator found!");
		return;
	}

	const activatorPawn = typeof activator.GetPlayerPawn === "function" ? activator.GetPlayerPawn() : activator;
	
	// Get the button entity (caller)
	const button = inputData?.caller;
	if (!button) {
		if (DEBUG) Instance.Msg("[Filter] No caller (button) found!");
		return;
	}
	
	// Get the button's parent (the weapon entity)
	const weapon = ResolveWeaponFromButton(button);
	if (!weapon) {
		if (DEBUG) Instance.Msg("[Filter] Button has no parent!");
		return;
	}
	
	// Get the weapon's owner
	const owner = weapon.GetOwner();
	if (!owner) {
		if (DEBUG) Instance.Msg("[Filter] Weapon has no owner!");
		return;
	}

	const ownerName = typeof owner.GetPlayerController === "function"
		? owner.GetPlayerController()?.GetPlayerName() || "unnamed"
		: typeof owner.GetEntityName === "function"
			? owner.GetEntityName() || "unnamed"
			: "unnamed";
	const activatorName = typeof activator.GetPlayerName === "function"
		? activator.GetPlayerName() || "unnamed"
		: typeof activator.GetEntityName === "function"
			? activator.GetEntityName() || "unnamed"
			: "unnamed";
	
	if (DEBUG) {
		Instance.Msg("[Filter] Checking - Owner: " + ownerName + ", Activator: " + activatorName);
	}
	
	// Check if activator is the owner
	if (owner === activator || owner === activatorPawn) {
		const team = activator.GetTeamNumber();
		
		// CT team (3) is always allowed
		if (team == 3) {
			if (DEBUG) Instance.Msg("[Filter] CT owner matched - firing User4");
			Instance.EntFireAtTarget({ 
				target: button, 
				input: "FireUser4", 
				activator: activator,
				delay: 0.0 
			});
		}
		// T team (2) is allowed only if zombie items are enabled
		else if (team == 2 && allow_zombie_items) {
			if (DEBUG) Instance.Msg("[Filter] T owner matched (zombie items allowed) - firing User4");
			Instance.EntFireAtTarget({ 
				target: button, 
				input: "FireUser4", 
				activator: activator,
				delay: 0.0 
			});
		}
	} else {
		if (DEBUG) Instance.Msg("[Filter] Owner mismatch - access denied");
	}
}

function ToggleZombieItems() {
	allow_zombie_items = !allow_zombie_items;
	if (DEBUG) Instance.Msg("[Filter] Zombie items " + (allow_zombie_items ? "ENABLED" : "DISABLED"));
}

function StripKnife(inputData) {
	const activator = inputData?.activator;
	if (!activator) {
		if (DEBUG) Instance.Msg("[Filter] No activator found for StripKnife!");
		return;
	}

	const playerPawn = typeof activator.GetPlayerPawn === "function" ? activator.GetPlayerPawn() : activator;
	if (!playerPawn || typeof playerPawn.FindWeapon !== "function" || typeof playerPawn.DestroyWeapon !== "function") {
		if (DEBUG) Instance.Msg("[Filter] Activator has no player pawn for StripKnife!");
		return;
	}

	const knife = playerPawn.FindWeaponBySlot(CSGearSlot.KNIFE);
	if (!knife) {
		if (DEBUG) Instance.Msg("[Filter] No knife found on activator!");
		return;
	}

	playerPawn.DestroyWeapon(knife);
	if (DEBUG) Instance.Msg("[Filter] Knife stripped from activator!");
}

// --- Register handlers for RunScriptInput ---
Instance.OnScriptInput("CheckOwner", (inputData) => {
	CheckOwner(inputData);
});

Instance.OnScriptInput("StripKnife", (inputData) => {
	StripKnife(inputData);
});

Instance.OnScriptInput("EnableZombieItems", () => {
	allow_zombie_items = true;
	Instance.EntFireAtName({ name: "zwarp_maker", input: "KeyValue", value: "EntityTemplate zwarp_projtemp", delay: 0.0 });
	Instance.EntFireAtName({ name: "zice_maker", input: "KeyValue", value: "EntityTemplate zice_projtemp", delay: 0.0 });
	Instance.EntFireAtName({ name: "zfortress_shield_maker", input: "KeyValue", value: "EntityTemplate zfortress_shield_temp", delay: 0.0 });
});
Instance.OnScriptInput("DisableZombieItems", () => {
	allow_zombie_items = false;
	Instance.EntFireAtName({ name: "zwarp_maker", input: "KeyValue", value: "EntityTemplate temp", delay: 0.0 });
	Instance.EntFireAtName({ name: "zice_maker", input: "KeyValue", value: "EntityTemplate temp", delay: 0.0 });
	Instance.EntFireAtName({ name: "zfortress_shield_maker", input: "KeyValue", value: "EntityTemplate temp", delay: 0.0 });
	try {
		Instance.EntFireAtName({ name: "server", input: "Command", value: "say *** ZM-Items are restricted!!! ***", delay: 0.0 });
	} catch (e) {
		if (DEBUG) Instance.Msg("[Filter] Failed to send disable chat message");
	}
});
Instance.OnScriptInput("ToggleZombieItems", () => ToggleZombieItems());