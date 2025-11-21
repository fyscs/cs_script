import { Instance } from "cs_script/point_script";

// by 凯岩城的狼
const TEAM_CT = 3;

const boomTemplates = {
    template1: "@boom_temp",
    template2: "@boom_temp2"
};

const state = {
    lastTriggerTime: 0,
    cooldown: 5.0,
    cachedTemplates: {},
    lastCacheTime: 0
};

function GetAllPlayers() {
    const players = Instance.FindEntitiesByClass("player");
    return players.filter(player => player && player.IsValid() && player.IsAlive());
}

function GetCTPlayers() {
    return GetAllPlayers().filter(player => {
        try {
            return player.GetTeamNumber() === TEAM_CT;
        } catch (error) {
            return false;
        }
    });
}

function GetRandomElement(array) {
    if (array.length === 0) {
        return null;
    }
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

function GetRandomBoomTemplate() {
    const templateKeys = Object.keys(boomTemplates);
    const randomKey = templateKeys[Math.floor(Math.random() * templateKeys.length)];
    return boomTemplates[randomKey];
}

function SpawnBoomAtPosition(position) {
    try {
        const templateName = GetRandomBoomTemplate();
        const currentTime = Instance.GetGameTime();
        if (currentTime - state.lastCacheTime > 30 || !state.cachedTemplates[templateName] || !state.cachedTemplates[templateName].IsValid()) {
            state.cachedTemplates[templateName] = Instance.FindEntityByName(templateName);
            state.lastCacheTime = currentTime;
        }
        const boomTemplate = state.cachedTemplates[templateName];
        if (!boomTemplate || !boomTemplate.IsValid()) return false;
        const entities = boomTemplate.ForceSpawn(position, { pitch: 0, yaw: 0, roll: 0 });
        return !!(entities && entities.length > 0);
    } catch (error) {
        return false;
    }
}

function SpawnBoomAtRandomCT() {
    try {
        const ctPlayers = GetCTPlayers();
        if (ctPlayers.length === 0) return;
        const randomCT = GetRandomElement(ctPlayers);
        if (!randomCT || !randomCT.IsValid()) return;
        const playerOrigin = randomCT.GetAbsOrigin();
        SpawnBoomAtPosition({ x: playerOrigin.x, y: playerOrigin.y, z: playerOrigin.z + 46 });
    } catch (error) {
    }
}

function HandleTriggerActivation(inputData) {
    try {
        const currentTime = Instance.GetGameTime();
        
        if (currentTime - state.lastTriggerTime < state.cooldown) {
            return;
        }

        state.lastTriggerTime = currentTime;
        SpawnBoomAtRandomCT();
    } catch (error) {
    }
}

Instance.OnScriptInput("boom_trigger", HandleTriggerActivation);
Instance.OnScriptInput("body_trigger", HandleTriggerActivation);
Instance.OnScriptInput("explosion_trigger", HandleTriggerActivation);
Instance.OnActivate(() => {});
Instance.OnScriptReload({ after: () => {} });
