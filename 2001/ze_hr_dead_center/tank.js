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

Instance.OnScriptInput("Hit", () => {
    if (currentTank && currentTank.IsValid()) {
        const velocity = currentTank.GetAbsVelocity();
        const speed = Math.hypot(velocity.x, velocity.y);
        if (speed >= 100) {
            currentTank.Teleport({ velocity: LimitHorizontalMagnitude(velocity, Math.max((speed - 20), 100))});
        }
    }
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
        const entityName = entity.GetEntityName();
        if (entityName === "tank_ui") {
            Instance.EntFireAtTarget({ target: entity, input: "Activate", activator: currentTank });
        } else if (entityName === "tank_yell_sound") {
            Instance.EntFireAtTarget({ target: entity, input: "StartSound" });
        } else if (entityName !== "tank_phy_mm" && entityName !== "tank_phy" && entityName !== "tank_walk_sound" && entityName !== "tank_walk_sound_loop_timer") {
            Instance.EntFireAtTarget({ target: entity, input: "SetParent", value: "!activator", activator: currentTank });
        }
    }
    Instance.EntFireAtTarget({ target: currentTank, input: "SetDamageFilter", value: "god" });
    Instance.EntFireAtTarget({ target: currentTank, input: "Alpha", value: 0 });
    Instance.ServerCommand("say >> " + currentTank.GetPlayerController()?.GetPlayerName() + " << 成为了Tank!!!");
}

/**
 * 限制三维向量的水平分量（X和Y）的模长，若超过 maxMagnitude 则等比例缩放，保持方向不变；垂直分量 Z 保持不变。
 * @param {import("cs_script/point_script").Vector} v - 输入向量
 * @param {number} maxMagnitude - 允许的最大水平模长（非负数）
 * @returns {import("cs_script/point_script").Vector} 限制后的新向量
 */
function LimitHorizontalMagnitude(v, maxMagnitude) {
    const { x, y, z } = v;
    const horizMag = Math.hypot(x, y);
    if (horizMag <= maxMagnitude) {
        return { x, y, z };
    }
    const scale = maxMagnitude / horizMag;
    return {
        x: x * scale,
        y: y * scale,
        z: z
    };
}