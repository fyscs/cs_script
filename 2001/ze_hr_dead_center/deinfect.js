import { Instance, Entity, CSWeaponAttackType } from "cs_script/point_script";

/**
 * 防化脚本
 * 此脚本用于实现类似求生之路中的感染者攻击而非ze模式中的直接感染
 * 此脚本为针对风云社适配后的版本
 * 使用其他方式来代替返回abort实现免抓的效果
 * 此脚本由皮皮猫233编写
 * 2026/4/20
 */

let deinfectSwitch = false;

Instance.OnScriptInput("Enable", () => {
    deinfectSwitch = true;
    ZombieLowHP();
    SetHumanGod(true);
});

Instance.OnScriptInput("Disable", () => {
    deinfectSwitch = false;
    SetHumanGod(false);
});

Instance.OnRoundStart(() => {
    deinfectSwitch = false;
    SetHumanGod(false);
    thinkQueue.length = 0;
});

Instance.OnPlayerKill((event) => {
    if (event.player.GetTeamNumber() === 3) {
        Instance.EntFireAtTarget({ target: event.player, input: "SetDamageFilter", value: "" });
    }
});

Instance.OnKnifeAttack((event) => {
    if (!deinfectSwitch) return;

    const player = event.weapon.GetOwner();
    if (!player || !player.IsValid() || player.GetTeamNumber() !== 2) return;

    const start = player.GetEyePosition();
    const forward = getForward(player.GetEyeAngles());
    let end = { x: 0, y: 0, z: 0 };
    if (event.attackType === CSWeaponAttackType.PRIMARY) end = vectorAdd(start, vectorScale(forward, 71.9));
    else if (event.attackType === CSWeaponAttackType.SECONDARY) end = vectorAdd(start, vectorScale(forward, 50.2));
    else return;

    const players = Instance.FindEntitiesByClass("player");
    let zombies = /** @type {Entity[]} */ ([]);
    for (const player of players) {
        if (player && player.IsValid() && player.GetTeamNumber() === 2)
            zombies.push(player);
    }
    const result = Instance.TraceLine({
        start,
        end,
        ignoreEntity: zombies
    });

    if (result.didHit) {
        if (result.hitEntity && result.hitEntity.IsValid() && result.hitEntity.GetClassName() === "player" && result.hitEntity.GetTeamNumber() === 3) {
            const health = result.hitEntity.GetHealth();
            if (health <= 40) {
                result.hitEntity.Kill();
            } else {
                result.hitEntity.SetHealth(health - 40);
            }
        }
    }
});

/**
 * 设置人类无敌
 * @param {boolean} active 
 */
function SetHumanGod(active) {
    const players = Instance.FindEntitiesByClass("player");
    let value = "";
    if (active) value = "god";
    for (const player of players) {
        if (!player || !player.IsValid() || !player.IsAlive() || player.GetTeamNumber() !== 3) continue;
        Instance.EntFireAtTarget({ target: player, input: "SetDamageFilter", value: value });
    }
}

/**
 * 设置僵尸低血量
 */
function ZombieLowHP() {
    if (!deinfectSwitch) return;
    const players = Instance.FindEntitiesByClass("player");
    for (const player of players) {
        if (!player || !player.IsValid() || player.GetTeamNumber() !== 2) continue;
        SetLowHP(player);
    }
    // 1秒后再次检测
    Delay(1, ZombieLowHP);
}

/**
 * 设置低血量
 * @param {Entity} player 
 */
function SetLowHP(player) {
    if (player.GetMaxHealth() > 100) {
        Delay(0.5, () => {
            player.SetMaxHealth(1);
            player.SetHealth(1000);
        });
    }
}

/**
 * @param {import("cs_script/point_script").Vector} vec1
 * @param {import("cs_script/point_script").Vector} vec2
 * @returns {import("cs_script/point_script").Vector}
 */
function vectorAdd(vec1, vec2) {
    return { x: vec1.x + vec2.x, y: vec1.y + vec2.y, z: vec1.z + vec2.z };
}

/**
 * @param {import("cs_script/point_script").Vector} vec
 * @param {number} scale
 * @returns {import("cs_script/point_script").Vector}
 */
function vectorScale(vec, scale) {
    return { x: vec.x * scale, y: vec.y * scale, z: vec.z * scale };
}

/**
 * @param {import("cs_script/point_script").QAngle} angles
 * @returns {import("cs_script/point_script").Vector}
 */
function getForward(angles) {
    const pitchRadians = (angles.pitch * Math.PI) / 180;
    const yawRadians = (angles.yaw * Math.PI) / 180;
    const hScale = Math.cos(pitchRadians);
    return {
        x: Math.cos(yawRadians) * hScale,
        y: Math.sin(yawRadians) * hScale,
        z: -Math.sin(pitchRadians),
    };
}

/** @type {{ time: number, callback: () => void }[]} */
const thinkQueue = [];

/**
 * 延迟执行函数
 * @param {number} delaySeconds 延迟的秒数
 * @param {() => void} callback 回调函数
 */
function Delay(delaySeconds, callback) {
    const executeTime = Instance.GetGameTime() + delaySeconds;
    QueueThink(executeTime, callback);
}

/**
 * 异步延迟函数，返回Promise
 * @param {number} delaySeconds 延迟的秒数
 * @returns {Promise<void>}
 */
function DelayAsync(delaySeconds) {
    return new Promise((resolve) => {
        Delay(delaySeconds, resolve);
    });
}

/**
 * 将think任务加入队列
 * @param {number} time 执行时间
 * @param {() => void} callback 回调函数
 */
function QueueThink(time, callback) {
    // 查找插入位置（按时间排序）
    let insertIndex = 0;
    for (let i = thinkQueue.length - 1; i >= 0; i--) {
        if (thinkQueue[i].time <= time) {
            insertIndex = i + 1;
            break;
        }
    }

    // 插入到合适位置
    thinkQueue.splice(insertIndex, 0, { time, callback });

    // 如果新任务是最早的，则更新think
    if (insertIndex === 0) {
        Instance.SetNextThink(time);
    }
}

/**
 * Think循环处理函数
 */
function RunThinkQueue() {
    const currentTime = Instance.GetGameTime();
    
    // 执行所有到期的任务
    while (thinkQueue.length > 0 && thinkQueue[0].time <= currentTime) {
        const task = thinkQueue.shift();
        if (!task) continue;
        task.callback();
    }

    // 更新下一次think
    if (thinkQueue.length > 0) {
        Instance.SetNextThink(thinkQueue[0].time);
    }
}

// 设置Think循环
Instance.SetThink(RunThinkQueue);