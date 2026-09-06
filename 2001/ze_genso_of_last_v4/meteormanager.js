import { Instance } from "cs_script/point_script";

// --- Constants ---
const DEBUG = true; // Set to true to enable debug logging

// --- State Management ---
const MeteorState = {
    isEnabled: true,
    isRunning: false,
    insideList: [],
    meteorTemplate: null,
    trigger: null,
    scriptEntity: null
};

// --- Initialization ---
Instance.Msg("meteormanager script initialized");

// Find entities on first spawn
MeteorState.meteorTemplate = Instance.FindEntityByName("world_meteor_temp");
MeteorState.trigger = Instance.FindEntityByName("world_meteor_trigger");
MeteorState.scriptEntity = Instance.FindEntityByName("meteor_scripts");

// Trigger is wired in Hammer via RunScriptInput "HitCheck"
Instance.OnScriptInput("HitCheck", (inputData) => {
    HitCheck(inputData);
});

Instance.OnRoundEnd(() => {
    if (DEBUG) Instance.Msg("[Meteor] Round ended, stopping meteor tick system");
    StopMeteorTick();
});

// --- Meteor Spawning ---
function World_Meteor_Spawn() {
    if (MeteorState.insideList.length === 0) {
        if (DEBUG) Instance.Msg("[Meteor] No targets in list, skipping spawn");
        return;
    }

    // Pick random target from list
    const randomIndex = Math.floor(Math.random() * MeteorState.insideList.length);
    const target = MeteorState.insideList[randomIndex];

    if (!target) return;
    
    // Re-fetch template each time to ensure valid reference
    const meteorTemplate = Instance.FindEntityByName("world_meteor_temp");
    if (!meteorTemplate) return;
    
    const targetOrigin = (target && typeof target.GetAbsOrigin === "function") ? target.GetAbsOrigin() : target;
    if (!targetOrigin) return;
    const spawnedEntities = meteorTemplate.ForceSpawn(targetOrigin);
    
    if (DEBUG) {
        const spawnCount = spawnedEntities ? spawnedEntities.length : 0;
        Instance.Msg(`[Meteor] Spawned meteor at target position (${spawnCount} entities, ${MeteorState.insideList.length} targets in list)`);
    }

    // Clear the list after spawning
    MeteorState.insideList = [];
}

// --- Meteor Tick (Periodic Execution) ---
function World_Meteor_Tick() {
    if (!MeteorState.isRunning) {
        if (DEBUG) Instance.Msg("[Meteor] Tick loop is stopped, skipping");
        return;
    }

    if (MeteorState.isEnabled) {
        World_Meteor_Spawn();
    }
    // Random interval between 9-14 seconds
    const randomSec = Math.random() * 5 + 9; // 9 to 14 seconds
    // Enable trigger briefly before next spawn
    Instance.EntFireAtName({
        name: "world_meteor_trigger",
        input: "Enable",
        delay: randomSec - 0.2
    });
    Instance.EntFireAtName({
        name: "world_meteor_trigger",
        input: "Disable",
        delay: randomSec - 0.1
    });

    // Schedule next tick via RunScriptInput
    if (MeteorState.isRunning && MeteorState.scriptEntity) {
        Instance.EntFireAtTarget({
            target: MeteorState.scriptEntity,
            input: "RunScriptInput",
            value: "MeteorTick",
            delay: randomSec
        });
    }

    if (DEBUG) {
        Instance.Msg(`[Meteor] Next tick scheduled in ${randomSec.toFixed(1)} seconds`);
    }
}

Instance.OnScriptInput("MeteorTick", () => {
    if (!MeteorState.isRunning) {
        if (DEBUG) Instance.Msg("[Meteor] Ignored queued MeteorTick because loop is stopped");
        return;
    }

    World_Meteor_Tick();
});

// --- Toggle Meteor System ---
function World_Meteor_Toggle() {
    MeteorState.isEnabled = !MeteorState.isEnabled;
    
    if (DEBUG) {
        Instance.Msg(`[Meteor] System ${MeteorState.isEnabled ? "ENABLED" : "DISABLED"}`);
    }
}

// --- Hit Check (Trigger OnStartTouch) ---
function HitCheck(inputData) {
    const player = inputData?.activator;
    if (!player) {
        if (DEBUG) Instance.Msg("[Meteor] No activator in HitCheck");
        return;
    }
    if (player.GetTeamNumber() === 3 && player.GetHealth() > 0) {
        const touchOrigin = player.GetAbsOrigin();
        if (!touchOrigin) return;

        MeteorState.insideList.push(touchOrigin);
        
        if (DEBUG) {
            Instance.Msg(`[Meteor] Added touch origin to target list (total: ${MeteorState.insideList.length})`);
        }
    }
}

// --- Script Input Handlers ---
function StopMeteorTick() {
    MeteorState.isRunning = false;
    MeteorState.isEnabled = false;
    if (DEBUG) Instance.Msg("[Meteor] Stopped meteor tick system");
}

Instance.OnScriptInput("StartMeteorTick", () => {
    if (DEBUG) Instance.Msg("[Meteor] Starting meteor tick system");
    MeteorState.isRunning = true;
    MeteorState.isEnabled = true;
    World_Meteor_Tick();
});

Instance.OnScriptInput("StopMeteorTick", () => {
    StopMeteorTick();
});

Instance.OnScriptInput("ToggleMeteor", () => {
    World_Meteor_Toggle();
});

Instance.OnScriptInput("EnableMeteor", () => {
    MeteorState.isEnabled = true;
    if (DEBUG) Instance.Msg("[Meteor] Meteor system enabled");
});

Instance.OnScriptInput("DisableMeteor", () => {
    MeteorState.isEnabled = false;
    if (DEBUG) Instance.Msg("[Meteor] Meteor system disabled");
});

Instance.OnScriptInput("ClearTargetList", () => {
    MeteorState.insideList = [];
    if (DEBUG) Instance.Msg("[Meteor] Target list cleared");
});