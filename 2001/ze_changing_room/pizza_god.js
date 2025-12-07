import { Instance } from "cs_script/point_script";

// by 凯岩城的狼
const state = {
    playerTriggered: new Set(),
    currentRound: 0,
    cachedTemplate: null,
    lastCacheTime: 0
};
const TEMPLATE_NAME = "@fuck_temp";

Instance.OnPlayerChat((event) => {
    try {
        const speaker = event.player;
        if (!speaker || !event.text.toLowerCase().includes("fk pizza")) return;
        const playerSlot = speaker.GetPlayerSlot();
        if (!state.playerTriggered.has(playerSlot)) {
            state.playerTriggered.add(playerSlot);
            const playerPawn = speaker.GetPlayerPawn();
            if (playerPawn && playerPawn.IsValid()) {
                SpawnTemplateAtPlayer(playerPawn);
                Instance.ServerCommand(`say " \x07FF0000你被披萨神惩罚了"`);
            }
        }
    } catch (error) {
    }
});

function SpawnTemplateAtPlayer(player) {
    try {
        if (!player || !player.IsValid()) return;
        const currentTime = Instance.GetGameTime();
        if (currentTime - state.lastCacheTime > 30 || !state.cachedTemplate || !state.cachedTemplate.IsValid()) {
            state.cachedTemplate = Instance.FindEntityByName(TEMPLATE_NAME);
            state.lastCacheTime = currentTime;
        }
        const template = state.cachedTemplate;
        if (!template || !template.IsValid()) return;
        const playerPos = player.GetAbsOrigin();
        template.ForceSpawn({ x: playerPos.x, y: playerPos.y, z: playerPos.z + 10 }, { pitch: 0, yaw: 0, roll: 0 });
    } catch (error) {
    }
}

Instance.OnRoundStart(() => {
    state.playerTriggered.clear();
    state.currentRound++;
});

Instance.OnPlayerDisconnect((event) => {
    try {
        state.playerTriggered.delete(event.playerSlot);
    } catch (error) {
    }
});

Instance.OnScriptInput("test_fuck_pizza", () => {
    try {
        const players = Instance.FindEntitiesByClass("player");
        if (players.length > 0 && players[0].IsValid() && players[0].IsAlive()) {
            SpawnTemplateAtPlayer(players[0]);
        }
    } catch (error) {
    }
});

Instance.OnScriptInput("reset_fuck_pizza", () => {
    state.playerTriggered.clear();
});

Instance.OnActivate(() => {});
Instance.OnScriptReload({ after: () => {} });
