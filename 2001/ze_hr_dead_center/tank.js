import { CSPlayerPawn, Instance } from "cs_script/point_script";

/**
 * Tank获取脚本
 * 已针对风云社更改为随机挑选玩家成为Tank
 * 此脚本由皮皮猫233编写
 * 2026/4/29
 */

// let enableTank = false;
// const tanks = new Set();

/** @type {CSPlayerPawn|undefined} */
let currentTank = undefined;

// Instance.OnScriptInput("Enable", () => {
//     enableTank = true;
//     Instance.ServerCommand('say **在聊天框中输入"!tank"有概率成为本关Tank**');
// });

Instance.OnScriptInput("PickTank", () => {
    // for (const tank of tanks) {
    //     if (!tank || !tank.IsValid() || !tank.IsAlive() || tank.GetTeamNumber() !== 2) tanks.delete(tank);
    // }
    // if (tanks.size === 0) {
        const players = new Set(Instance.FindEntitiesByClass("player"))
        for (const player of players) {
            if (!player || !player.IsValid() || !player.IsAlive() || player.GetTeamNumber() !== 2) players.delete(player);
        }
        if (players.size !== 0) {
            const tankList = Array.from(players);
            BecomeTank(/** @type {CSPlayerPawn} */ (tankList[Math.floor(tankList.length * Math.random())]));
        }
    // } else {
    //     const tankList = Array.from(tanks);
    //     BecomeTank(/** @type {CSPlayerPawn} */ (tankList[Math.floor(tankList.length * Math.random())]));
    // }
    // enableTank = false;
    // tanks.clear();
});

Instance.OnScriptInput("Die", () => {
    if (currentTank && currentTank.IsValid()) {
        Instance.EntFireAtTarget({ target: currentTank, input: "SetDamageFilter", value: "" });
        Instance.EntFireAtTarget({ target: currentTank, input: "Alpha", value: 255 });
        currentTank.Kill();
    }
    currentTank = undefined;
});

Instance.OnRoundStart(() => {
    if (currentTank && currentTank.IsValid()) {
        Instance.EntFireAtTarget({ target: currentTank, input: "SetDamageFilter", value: "" });
        Instance.EntFireAtTarget({ target: currentTank, input: "Alpha", value: 255 });
    }
    // enableTank = false;
    currentTank = undefined;
    // tanks.clear();
});

// Instance.OnPlayerChat((event) => {
//     if (!enableTank) return;
//     if (event.text === "!tank") {
//         if (event.player && event.player.IsValid() && event.player.GetTeamNumber() === 2) {
//             const pawn = event.player.GetPlayerPawn();
//             if (pawn && pawn.IsValid()) {
//                 tanks.add(pawn);
//             }
//         }
//     }
// });

/**
 * 成为Tank
 * @param {CSPlayerPawn} pawn 
 */
function BecomeTank(pawn) {
    currentTank = pawn;
    currentTank.Teleport({ velocity: { x: 0, y: 0, z: 0 }});
    const position = currentTank.GetAbsOrigin();
    const angles = currentTank.GetEyeAngles();
    // @ts-ignore
    const entities = Instance.FindEntityByName("tank_temp").ForceSpawn(position, { pitch: 0, yaw: angles.yaw, roll: 0 });
    for (const entity of entities) {
        if (entity.GetEntityName() === "tank_ui") {
            Instance.EntFireAtTarget({ target: entity, input: "Activate", activator: currentTank });
        } else {
            Instance.EntFireAtTarget({ target: entity, input: "SetParent", value: "!activator", activator: currentTank });
        }
    }
    Instance.EntFireAtTarget({ target: currentTank, input: "SetDamageFilter", value: "god" });
    Instance.EntFireAtTarget({ target: currentTank, input: "Alpha", value: 0 });
    Instance.ServerCommand("say >> " + currentTank.GetPlayerController()?.GetPlayerName() + " << 成为了Tank!!!");
}