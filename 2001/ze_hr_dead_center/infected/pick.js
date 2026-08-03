import { CSGearSlot, CSInputs, CSPlayerPawn, Entity, Instance } from "cs_script/point_script";

/**
 * 特感获取脚本
 * 此脚本由皮皮猫233编写
 * 2026/8/3
 */

const infectedTypes = ["Spitter", "Boomer", "Smoker", "Hunter", "Jockey", "Charger"];

let enableTank = false;
let enableInfected = false;
let isMainRunning = false;

const infected = new Map();

class Infected {
    /** @param {CSPlayerPawn} player */
    constructor(player) {
        // this.wantInfected = false;
        // this.wantTank = false;
        this.isMotherZombie = false;
        this.isPreInfected = false;
        this.isInfected = false;
        this.isDeadPreInfected = false;
        this.type = "none";
    }

    Reset() {
        // this.wantInfected = false;
        // this.wantTank = false;
        this.isPreInfected = false;
        this.isInfected = false;
        this.isDeadPreInfected = false;
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
    TestPreInfected(/** @type {CSPlayerPawn} */(infectedList[Math.floor(infectedList.length * Math.random())]), infectedTypes[Math.floor(infectedTypes.length * Math.random())]);
});

Instance.OnScriptInput("PickTank", () => {
    const tankList = GetPreTank();
    if (tankList.length === 0) return;
    TestPreInfected(/** @type {CSPlayerPawn} */(tankList[Math.floor(tankList.length * Math.random())]), "Tank");
});

Instance.OnRoundStart(() => {
    infected.forEach((state, player) => {
        if (player && player.IsValid()) {
            Instance.EntFireAtTarget({ target: player, input: "SetDamageFilter", value: "" });
            Instance.EntFireAtTarget({ target: player, input: "Alpha", value: 255 });
            Instance.EntFireAtTarget({ target: player, input: "KeyValue", value: "gravity 1" });
            Instance.EntFireAtTarget({ target: player, input: "RemoveContext", value: "player_pre_infected" });
            Instance.EntFireAtTarget({ target: player, input: "RemoveContext", value: "player_infected" });
            state.Reset();
        } else infected.delete(player);
    });
    enableInfected = false;
    enableTank = false;
    if (isMainRunning) return;
    isMainRunning = true;
    Main();
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
        Instance.EntFireAtTarget({ target: player, input: "KeyValue", value: "gravity 1" });
        Instance.EntFireAtTarget({ target: player, input: "RemoveContext", value: "player_pre_infected" });
        Instance.EntFireAtTarget({ target: player, input: "RemoveContext", value: "player_infected" });
        const state = infected.get(player);
        state.isInfected = false;
        state.isPreInfected = false;
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

/**
 * 主循环
 */
function Main() {
    // const players = Instance.FindEntitiesByClass("player");
    // for (const player of players) {
    //     if (player.IsValid() && player.GetTeamNumber() === 3) Instance.EntFireAtTarget({ target: player, input: "SetDamageFilter", value: "no_special_infected_filter" });
    // }
    infected.forEach((state, player) => {
        if (player.IsValid()) {
            if (state.isDeadPreInfected && player.IsAlive()) {
                state.isDeadPreInfected = false;
                Delay(0.5, () => {
                    if (!player.IsValid() || !player.IsAlive()) {
                        state.isDeadPreInfected = true;
                        return;
                    }
                    BecomePreInfected(player, state.type);
                });
            }
            if (state.isPreInfected && player.IsInputPressed(CSInputs.ATTACK2) && CheckSpawn(player)) {
                BecomeInfected(player);
            }
        } else infected.delete(player);
    });
    Delay(1 / 8, Main);
}

/**
 * 尝试变为预复活特感
 * @param {CSPlayerPawn} player 
 * @param {string} type 
 */
function TestPreInfected(player, type) {
    if (player.IsAlive()) BecomePreInfected(player, type);
    else {
        const state = infected.get(player);
        state.type = type;
        state.isDeadPreInfected = true;
    }
}

/**
 * 成为预复活特感
 * @param {CSPlayerPawn} player 
 * @param {string} type 
 */
function BecomePreInfected(player, type) {
    if (!player.IsAlive()) return;
    if (!infected.has(player)) infected.set(player, new Infected(player));
    const state = infected.get(player);
    state.isPreInfected = true;
    state.type = type;
    Instance.EntFireAtName({ name: "speed_manager_script", input: "RunScriptInput", value: "Speed(1.5, 0)", activator: player });
    Instance.EntFireAtTarget({ target: player, input: "Alpha", value: 0 });
    Instance.EntFireAtTarget({ target: player, input: "KeyValue", value: "gravity 0.2" });
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
    if (!player.GetGroundEntity()) {
        Instance.EntFireAtName({ name: "pre_infected_spawn_in_air_hudhint", input: "ShowHudHint", activator: player });
        return false;
    }
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
    Instance.EntFireAtTarget({ target: player, input: "KeyValue", value: "gravity 1" });
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
                player.GetTeamNumber() === 2 &&
                !state.isDeadPreInfected &&
                !state.isPreInfected &&
                !state.isInfected
            ) {
                normalZombies.push(player);
                if (state.isMotherZombie) motherZombies.push(player);
            }
        } else {
            if (
                player.IsValid() &&
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
                player.GetTeamNumber() === 2 &&
                !state.isDeadPreInfected &&
                !state.isPreInfected &&
                !state.isInfected
            ) players.push(player);
        } else {
            if (
                player.IsValid() &&
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

/** @type {{ id: number, time: number, callback: () => void }[]} */
const thinkQueue = [];
/** @type {Map<number, { id: number, time: number, callback: () => void }>} */
const taskMap = new Map();
let nextTaskId = 1;

/**
 * 延迟执行函数
 * @param {number} delaySeconds 延迟的秒数
 * @param {() => void} callback 回调函数
 * @returns {number} 任务ID，可用于取消或重新调度
 */
function Delay(delaySeconds, callback) {
    const executeTime = Instance.GetGameTime() + delaySeconds;
    return QueueThink(executeTime, callback);
}

/**
 * 将think任务加入队列
 * @param {number} time 执行时间
 * @param {() => void} callback 回调函数
 * @returns {number} 任务ID
 */
function QueueThink(time, callback) {
    const id = nextTaskId++;
    const task = { id, time, callback };

    // 查找插入位置（按时间升序）
    let insertIndex = 0;
    for (let i = thinkQueue.length - 1; i >= 0; i--) {
        if (thinkQueue[i].time <= time) {
            insertIndex = i + 1;
            break;
        }
    }

    // 插入任务并记录
    thinkQueue.splice(insertIndex, 0, task);
    taskMap.set(id, task);

    // 如果新任务是最早的，则更新think
    if (insertIndex === 0) {
        Instance.SetNextThink(time);
    }

    return id;
}

/**
 * 取消指定ID的延迟任务（若尚未执行）
 * @param {number} taskId 任务ID
 */
function CancelDelay(taskId) {
    const task = taskMap.get(taskId);
    if (!task) return; // 任务不存在或已执行/取消

    // 从数组中移除
    const index = thinkQueue.indexOf(task);
    if (index !== -1) {
        thinkQueue.splice(index, 1);
    }
    taskMap.delete(taskId);

    // 如果移除的是队首任务，需要重新设置下一次think
    if (index === 0) {
        if (thinkQueue.length > 0) {
            Instance.SetNextThink(thinkQueue[0].time);
        }
    }
}

/**
 * 重新设置未执行任务的新延迟时间（从当前游戏时间开始计算）
 * @param {number} taskId 任务ID
 * @param {number} newDelaySeconds 新的延迟秒数
 * @returns {boolean} 是否修改成功（任务存在且未执行）
 */
function RescheduleDelay(taskId, newDelaySeconds) {
    const task = taskMap.get(taskId);
    if (!task) return false;

    const newTime = Instance.GetGameTime() + newDelaySeconds;

    // 如果时间没有变化，直接返回
    if (task.time === newTime) return true;

    // 先从队列中移除
    const index = thinkQueue.indexOf(task);
    if (index === -1) return false; // 理论上不会发生
    thinkQueue.splice(index, 1);

    // 更新时间
    task.time = newTime;

    // 按新时间重新插入到正确位置
    let insertIndex = 0;
    for (let i = thinkQueue.length - 1; i >= 0; i--) {
        if (thinkQueue[i].time <= newTime) {
            insertIndex = i + 1;
            break;
        }
    }
    thinkQueue.splice(insertIndex, 0, task);

    // 更新下一次think时间（只要队列不为空就重新设置最早时间）
    if (thinkQueue.length > 0) {
        Instance.SetNextThink(thinkQueue[0].time);
    }

    return true;
}

/**
 * Think循环处理函数
 */
function RunThinkQueue() {
    const currentTime = Instance.GetGameTime();

    // 执行所有到期的任务
    while (thinkQueue.length > 0 && thinkQueue[0].time <= currentTime) {
        const task = thinkQueue.shift();
        if (!task) return;
        taskMap.delete(task.id); // 清理映射
        try {
            task.callback();
        } catch (e) {
            // 避免回调异常中断队列处理
        }
    }

    // 更新下一次think
    if (thinkQueue.length > 0) {
        Instance.SetNextThink(thinkQueue[0].time);
    }
}

// 设置Think循环
Instance.SetThink(RunThinkQueue);