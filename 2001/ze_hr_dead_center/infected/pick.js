import { CSGearSlot, CSInputs, CSPlayerPawn, Entity, Instance } from "cs_script/point_script";

/**
 * 特感获取脚本
 * 此脚本由皮皮猫233编写
 * 2026/7/12
 */

const infectedTypes = ["Hunter", "Jockey", "Charger"];

let enableTank = false;
let enableInfected = false;

const infected = new Map();

class Infected {
    /** @param {CSPlayerPawn} player */
    constructor(player) {
        // this.wantInfected = false;
        // this.wantTank = false;
        this.isMotherZombie = false;
        this.isPreInfected = false;
        this.isInfected = false;
        this.type = "none";
    }

    Reset() {
        // this.wantInfected = false;
        // this.wantTank = false;
        this.isPreInfected = false;
        this.isInfected = false;
        this.type = "none";
    }
}

Instance.OnScriptInput("EnableTank", () => {
    enableTank = true;
    // Instance.ServerCommand('say **在聊天框中输入"!tank"有概率成为本关Tank**');
});

Instance.OnScriptInput("EnableInfected", () => {
    enableInfected = true;
});

Instance.OnScriptInput("PushMotherZombies", () => {
    infected.forEach((state, player) => {
        state.isMotherZombie = false;
    });
    const players = /** @type {CSPlayerPawn[]} */ (Instance.FindEntitiesByClass("player"));
    for (const player of players) {
        if (player.IsValid() && player.GetTeamNumber() === 2) {
            if (infected.has(player)) infected.get(player).isMotherZombie = true;
            else {
                const state = new Infected(player);
                state.isMotherZombie = true;
                infected.set(player, state);
            }
        }
    }
});

Instance.OnScriptInput("PickInfected", () => {
    const infectedList = GetPreInfected();
    if (infectedList.length === 0) return;
    BecomePreInfected(/** @type {CSPlayerPawn} */(infectedList[Math.floor(infectedList.length * Math.random())]), infectedTypes[Math.floor(infectedTypes.length * Math.random())]);
});

Instance.OnScriptInput("PickTank", () => {
    const tankList = GetPreTank();
    if (tankList.length === 0) return;
    BecomePreInfected(/** @type {CSPlayerPawn} */(tankList[Math.floor(tankList.length * Math.random())]), "Tank");
});

Instance.OnRoundStart(() => {
    infected.forEach((state, player) => {
        if (player && player.IsValid()) {
            Instance.EntFireAtTarget({ target: player, input: "SetDamageFilter", value: "" });
            Instance.EntFireAtTarget({ target: player, input: "Alpha", value: 255 });
            Instance.EntFireAtTarget({ target: player, input: "RemoveContext", value: "player_pre_infected" });
            Instance.EntFireAtTarget({ target: player, input: "RemoveContext", value: "player_infected" });
            state.Reset();
        } else infected.delete(player);
    });
    enableInfected = false;
    enableTank = false;
});

Instance.OnPlayerReset((event) => {
    if (event.player.IsValid() && event.player.GetTeamNumber() === 3) {
        Instance.EntFireAtTarget({ target: event.player, input: "SetDamageFilter", value: "no_special_infected_filter", delay: 1 });
    }
});

Instance.OnPlayerKill((event) => {
    const player = event.player;
    if (infected.has(player)) {
        Instance.EntFireAtTarget({ target: player, input: "SetDamageFilter", value: "" });
        Instance.EntFireAtTarget({ target: player, input: "Alpha", value: 255 });
        Instance.EntFireAtTarget({ target: player, input: "RemoveContext", value: "player_pre_infected" });
        Instance.EntFireAtTarget({ target: player, input: "RemoveContext", value: "player_infected" });
    }
});

// Instance.OnPlayerChat((event) => {
//     if (enableTank) {
//         if (event.text === "!tank") {
//             if (event.player && event.player.IsValid() && event.player.GetTeamNumber() === 2) {
//                 const pawn = event.player.GetPlayerPawn();
//                 if (pawn && pawn.IsValid()) {
//                     if (infected.has(pawn)) infected.get(pawn).wantTank = true;
//                     else {
//                         const state = new Infected(pawn);
//                         state.wantTank = true;
//                         infected.set(pawn, state);
//                     }
//                 }
//             }
//         }
//     }
//     if (enableInfected) {
//         if (event.text === "!infected") {
//             if (event.player && event.player.IsValid() && event.player.GetTeamNumber() === 2) {
//                 const pawn = event.player.GetPlayerPawn();
//                 if (pawn && pawn.IsValid()) {
//                     if (infected.has(pawn)) infected.get(pawn).wantInfected = true;
//                     else {
//                         const state = new Infected(pawn);
//                         state.wantInfected = true;
//                         infected.set(pawn, state);
//                     }
//                 }
//             }
//         }
//     }
// });

Instance.SetThink(() => {
    // const players = Instance.FindEntitiesByClass("player");
    // for (const player of players) {
    //     if (player.IsValid() && player.GetTeamNumber() === 3) Instance.EntFireAtTarget({ target: player, input: "SetDamageFilter", value: "no_special_infected_filter" });
    // }
    infected.forEach((state, player) => {
        if (player.IsValid()) {
            if (state.isPreInfected && player.IsInputPressed(CSInputs.ATTACK2) && CheckSpawn(player)) {
                BecomeInfected(player);
            }
        } else infected.delete(player);
    });
    Instance.SetNextThink(Instance.GetGameTime() + 1 / 8);
});

Instance.SetNextThink(Instance.GetGameTime());

/**
 * 成为预复活特感
 * @param {CSPlayerPawn} player 
 * @param {string} type 
 */
function BecomePreInfected(player, type) {
    if (!infected.has(player)) infected.set(player, new Infected(player));
    const state = infected.get(player);
    state.isPreInfected = true;
    state.type = type;
    Instance.EntFireAtName({ name: "speed_manager_script", input: "RunScriptInput", value: "Speed(1.5, 0)", activator: player });
    Instance.EntFireAtTarget({ target: player, input: "Alpha", value: 0 });
    Instance.EntFireAtTarget({ target: player, input: "SetDamageFilter", value: "god" });
    Instance.EntFireAtTarget({ target: player, input: "AddContext", value: "player_pre_infected:1" });
    for (let i = 0; i < 10; i++) {
        Instance.EntFireAtName({ name: "become_pre_" + type.toLowerCase() + "_filter", input: "TestActivator", activator: player, delay: i });
    }
    const knife = player.FindWeaponBySlot(CSGearSlot.KNIFE);
    if (knife && knife.IsValid()) player.DestroyWeapon(knife);
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
 */
function BecomeInfected(player) {
    if (!infected.has(player)) return;
    const state = infected.get(player);
    state.isInfected = true;
    state.isPreInfected = false;
    player.Teleport({ velocity: { x: 0, y: 0, z: 0 } });
    player.GiveNamedItem("weapon_knife", true);
    Instance.EntFireAtName({ name: "speed_manager_script", input: "RunScriptInput", value: "Speed(0.67, 0)", activator: player });
    Instance.EntFireAtTarget({ target: player, input: "SetDamageFilter", value: "" });
    Instance.EntFireAtTarget({ target: player, input: "RemoveContext", value: "player_pre_infected" });
    Instance.EntFireAtTarget({ target: player, input: "AddContext", value: "player_infected:1" });
    const typeLow = state.type.toLowerCase();
    // @ts-ignore
    const entities = Instance.FindEntityByName(typeLow + "_temp").ForceSpawn(player.GetAbsOrigin(), player.GetAbsAngles());
    for (const entity of entities) {
        const entityName = entity.GetEntityName();
        if (entityName.startsWith(typeLow + "_relay")) {
            Instance.EntFireAtTarget({ target: entity, input: "Trigger", activator: player });
            break;
        }
    }
    const playerController = player.GetPlayerController();
    if (playerController && playerController.IsValid()) Instance.ServerCommand("say >> " + Sanitize(playerController.GetPlayerName()) + " << 成为了" + state.type + "!!!");
}

/**
 * 获取符合抽取为特感要求的玩家
 */
function GetPreInfected() {
    let normalZombies = [];
    let motherZombies = [];
    const allPlayers = /** @type {CSPlayerPawn[]} */ (Instance.FindEntitiesByClass("player"));
    for (const player of allPlayers) {
        if (infected.has(player)) {
            const state = infected.get(player);
            if (
                player.IsValid() &&
                player.IsAlive() &&
                player.GetTeamNumber() === 2 &&
                !state.isPreInfected &&
                !state.isInfected
            ) {
                normalZombies.push(player);
                if (state.isMotherZombie) motherZombies.push(player);
            }
        } else {
            if (
                player.IsValid() &&
                player.IsAlive() &&
                player.GetTeamNumber() === 2
            ) normalZombies.push(player);
        }
    }
    return motherZombies.length !== 0 ? motherZombies : normalZombies;
}

/**
 * 获取符合抽取为Tank要求的玩家
 */
function GetPreTank() {
    let players = [];
    const allPlayers = /** @type {CSPlayerPawn[]} */ (Instance.FindEntitiesByClass("player"));
    for (const player of allPlayers) {
        if (infected.has(player)) {
            const state = infected.get(player);
            if (
                player.IsValid() &&
                player.IsAlive() &&
                player.GetTeamNumber() === 2 &&
                !state.isPreInfected &&
                !state.isInfected
            ) players.push(player);
        } else {
            if (
                player.IsValid() &&
                player.IsAlive() &&
                player.GetTeamNumber() === 2
            ) players.push(player);
        }
    }
    return players;
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

/**
 * 移除常见危险字符防止注入
 * @param {string} str 
 * @returns 
 */
function Sanitize(str) {
    return str.replace(/[";`$\\\n\r]/g, ""); // 
}