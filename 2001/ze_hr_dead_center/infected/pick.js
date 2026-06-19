import { CSPlayerPawn, CSWeaponAttackType, Entity, Instance } from "cs_script/point_script";

/**
 * 特感获取脚本
 * 此脚本由皮皮猫233编写
 * 2026/6/18
 */

const infectedTypes = ["Hunter", "Jockey", "Charger"];
const currentInfecteds = new Set();
let pickInterval = 30;

let enableTank = false;
const tankList = new Set();

let enableInfected = false;
const infectedList = new Set();
const preInfected = new Map();
const motherZombies = new Set();

Instance.OnScriptInput("EnableTank", () => {
    enableTank = true;
    // Instance.ServerCommand('say **在聊天框中输入"!tank"有概率成为本关Tank**');
});

Instance.OnScriptInput("EnableInfected", () => {
    enableInfected = true;
});

Instance.OnScriptInput("PushMotherZombies", () => {
    const players = Instance.FindEntitiesByClass("player");
    for (const player of players) {
        if (player.IsValid() && player.GetTeamNumber() === 2) motherZombies.add(player);
    }
});

Instance.OnScriptInput("PickInfected", () => {
    // const newInfectedList = RemoveHumansAndInfetedAndNotMotherZombie(infectedList);
    // if (newInfectedList.length !== 0) {
    //     BecomePreInfected(/** @type {CSPlayerPawn} */ (newInfectedList[Math.floor(newInfectedList.length * Math.random())]), infectedTypes[Math.floor(infectedTypes.length * Math.random())]);
    // } else {
    //     const newInfectedList = RemoveHumansAndInfeted(infectedList);
    //     if (newInfectedList.length !== 0) {
    //         BecomePreInfected(/** @type {CSPlayerPawn} */ (newInfectedList[Math.floor(newInfectedList.length * Math.random())]), infectedTypes[Math.floor(infectedTypes.length * Math.random())]);
    //     } else {
            const newInfectedList = RemoveHumansAndInfeted(Instance.FindEntitiesByClass("player"));
            if (newInfectedList.length !== 0) {
                BecomePreInfected(/** @type {CSPlayerPawn} */ (newInfectedList[Math.floor(newInfectedList.length * Math.random())]), infectedTypes[Math.floor(infectedTypes.length * Math.random())]);
            }
    //     }
    // }
});

Instance.OnScriptInput("PickTank", () => {
    // const newTankList = RemoveHumansAndInfetedAndNotMotherZombie(tankList);
    // if (newTankList.length !== 0) {
    //     BecomePreInfected(/** @type {CSPlayerPawn} */ (newTankList[Math.floor(newTankList.length * Math.random())]), "Tank");
    // } else {
    //     const newTankList = RemoveHumansAndInfeted(tankList);
    //     if (newTankList.length !== 0) {
    //         BecomePreInfected(/** @type {CSPlayerPawn} */ (newTankList[Math.floor(newTankList.length * Math.random())]), "Tank");
    //     } else {
            const newTankList = RemoveHumansAndInfeted(Instance.FindEntitiesByClass("player"));
            if (newTankList.length !== 0) {
                BecomePreInfected(/** @type {CSPlayerPawn} */ (newTankList[Math.floor(newTankList.length * Math.random())]), "Tank");
            }
    //     }
    // }
});

Instance.OnKnifeAttack((event) => {
    if (event.attackType === CSWeaponAttackType.SECONDARY) {
        const player = event.weapon.GetOwner();
        if (player && player.IsValid() && preInfected.has(player) && CheckSpawn(player)) {
            Instance.EntFireAtTarget({ target: player, input: "KeyValue", value: "speed 1" });
            Instance.EntFireAtTarget({ target: player, input: "SetDamageFilter", value: "" });
            Instance.EntFireAtTarget({ target: player, input: "RemoveContext", value: "player_pre_infected" });
            Instance.EntFireAtTarget({ target: player, input: "AddContext", value: "player_infected:1" });
            BecomeInfected(player, preInfected.get(player));
            preInfected.delete(player);
        }
    }
});

Instance.OnRoundStart(() => {
    for (const player of currentInfecteds) {
        if (player && player.IsValid()) {
            Instance.EntFireAtTarget({ target: player, input: "SetDamageFilter", value: "" });
            Instance.EntFireAtTarget({ target: player, input: "Alpha", value: 255 });
            Instance.EntFireAtTarget({ target: player, input: "RemoveContext", value: "player_infected" });
        }
    }
    preInfected.forEach((value, player) => {
        if (player && player.IsValid()) {
            Instance.EntFireAtTarget({ target: player, input: "KeyValue", value: "speed 1" });
            Instance.EntFireAtTarget({ target: player, input: "SetDamageFilter", value: "" });
            Instance.EntFireAtTarget({ target: player, input: "Alpha", value: 255 });
            Instance.EntFireAtTarget({ target: player, input: "RemoveContext", value: "player_pre_infected" });
        }
    });
    motherZombies.clear();
    currentInfecteds.clear();
    enableInfected = false;
    infectedList.clear();
    enableTank = false;
    tankList.clear();
    preInfected.clear();
    Instance.EntFireAtName({ name: "infected_pick_text", input: "SetIntMessage", value: pickInterval });
    Instance.EntFireAtName({ name: "infected_pick_timer", input: "RefireTime", value: pickInterval });
});

Instance.OnRoundEnd((event) => {
    if (event.winningTeam === 2) {
        pickInterval = Math.min(pickInterval + 3, 40);
    } else if (event.winningTeam === 3) {
        pickInterval = Math.max(pickInterval - 5, 20);
    }
});

Instance.OnPlayerReset((event) => {
    if (event.player.IsValid() && event.player.GetTeamNumber() === 3) {
        Instance.EntFireAtTarget({ target: event.player, input: "SetDamageFilter", value: "no_special_infected_filter", delay: 1 });
    }
});

Instance.OnPlayerKill((event) => {
    const player = event.player;
    if (currentInfecteds.has(player)) {
        currentInfecteds.delete(player);
        Instance.EntFireAtTarget({ target: player, input: "KeyValue", value: "speed 1" });
        Instance.EntFireAtTarget({ target: player, input: "SetDamageFilter", value: "" });
        Instance.EntFireAtTarget({ target: player, input: "Alpha", value: 255 });
        Instance.EntFireAtTarget({ target: player, input: "RemoveContext", value: "player_infected" });
    }
    if (preInfected.has(player)) {
        currentInfecteds.delete(player);
        Instance.EntFireAtTarget({ target: player, input: "KeyValue", value: "speed 1" });
        Instance.EntFireAtTarget({ target: player, input: "SetDamageFilter", value: "" });
        Instance.EntFireAtTarget({ target: player, input: "Alpha", value: 255 });
        Instance.EntFireAtTarget({ target: player, input: "RemoveContext", value: "player_infected" });
    }
});

// Instance.OnPlayerChat((event) => {
//     if (enableTank) {
//         if (event.text === "!tank") {
//             if (event.player && event.player.IsValid() && event.player.GetTeamNumber() === 2) {
//                 const pawn = event.player.GetPlayerPawn();
//                 if (pawn && pawn.IsValid() && !currentInfecteds.has(pawn)) {
//                     tankList.add(pawn);
//                 }
//             }
//         }
//     }
//     if (enableInfected) {
//         if (event.text === "!infected") {
//             if (event.player && event.player.IsValid() && event.player.GetTeamNumber() === 2) {
//                 const pawn = event.player.GetPlayerPawn();
//                 if (pawn && pawn.IsValid() && !currentInfecteds.has(pawn)) {
//                     infectedList.add(pawn);
//                 }
//             }
//         }
//     }
// });

/**
 * 成为预复活特感
 * @param {CSPlayerPawn} player 
 * @param {string} type 
 */
function BecomePreInfected(player, type) {
    currentInfecteds.add(player);
    Instance.EntFireAtTarget({ target: player, input: "KeyValue", value: "speed 1.5" });
    Instance.EntFireAtTarget({ target: player, input: "Alpha", value: 0 });
    Instance.EntFireAtTarget({ target: player, input: "SetDamageFilter", value: "god" });
    Instance.EntFireAtTarget({ target: player, input: "AddContext", value: "player_pre_infected:1" });
    Instance.EntFireAtName({ name: "become_pre_" + type.toLowerCase() + "_hudhint", input: "ShowHudHint", activator: player });
    preInfected.set(player, type);
}

/**
 * 检查复活是否符合要求
 * @param {CSPlayerPawn} player 
 */
function CheckSpawn(player) {
    const position = player.GetEyePosition();
    const humans = GetAllHumans();
    for (const human of humans) {
        const humanPositon = human.GetEyePosition();
        if (IsPointInSphere(humanPositon, position, 1000)) {
            const result = Instance.TraceLine({
                start: position,
                end: humanPositon,
                ignorePlayers: true
            });
            if (!result.didHit) {
                Instance.EntFireAtName({ name: "pre_infected_spawn_fail_hudhint", input: "ShowHudHint", activator: player });
                return false;
            }
        }
    }
    return true;
}

/**
 * 成为特感
 * @param {CSPlayerPawn} player 
 * @param {string} type 
 */
function BecomeInfected(player, type) {
    player.Teleport({ velocity: { x: 0, y: 0, z: 0 }});
    const typeLow = type.toLowerCase();
    // @ts-ignore
    const entities = Instance.FindEntityByName(typeLow + "_temp").ForceSpawn(player.GetAbsOrigin(), player.GetAbsAngles());
    for (const entity of entities) {
        const entityName = entity.GetEntityName();
        if (entityName.startsWith(typeLow + "_relay")) {
            Instance.EntFireAtTarget({ target: entity, input: "Trigger", activator: player });
            break;
        }
    }
    Instance.ServerCommand("say >> " + player.GetPlayerController()?.GetPlayerName() + " << 成为了" + type + "!!!");
}

/**
 * 去除人类、特感以及非母体玩家
 * @param {Set<Entity>|Entity[]} players 
 */
function RemoveHumansAndInfetedAndNotMotherZombie(players) {
    let newPlayers = [];
    for (const player of players) {
        if (player && player.IsValid() && player.IsAlive() && player.GetTeamNumber() === 2 && !currentInfecteds.has(player) && !preInfected.has(player) && motherZombies.has(player)) newPlayers.push(player);
    }
    return newPlayers;
}

/**
 * 去除人类玩家与特感玩家
 * @param {Set<Entity>|Entity[]} players 
 */
function RemoveHumansAndInfeted(players) {
    let newPlayers = [];
    for (const player of players) {
        if (player && player.IsValid() && player.IsAlive() && player.GetTeamNumber() === 2 && !currentInfecteds.has(player) && !preInfected.has(player)) newPlayers.push(player);
    }
    return newPlayers;
}

/**
 * 获取全部人类
 */
function GetAllHumans() {
    const players = Instance.FindEntitiesByClass("player");
    let humans = [];
    for (const player of players) {
        if (player.IsValid() && player.GetTeamNumber() === 3) humans.push(player);
    }
    return humans;
}

/**
 * 判断点是否在指定球体内
 * @param {import("cs_script/point_script").Vector} point 待检测的点
 * @param {import("cs_script/point_script").Vector} center 球心坐标
 * @param {number} radius 球半径
 * @returns {boolean} 点在球内（含边界）返回 true，否则 false
 */
function IsPointInSphere(point, center, radius) {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const dz = point.z - center.z;
    const distSq = dx * dx + dy * dy + dz * dz;
    return distSq <= radius * radius;
}