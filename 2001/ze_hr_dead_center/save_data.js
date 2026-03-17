import { CSPlayerPawn, Instance, CSGearSlot } from "cs_script/point_script";

/**
 * 数据存读取脚本
 * 此脚本用于实现回合结算后仍能恢复连关数据
 * 此脚本由皮皮猫233编写
 * 2026/3/16
 */

let continuousSwitch = true;
const playerData = new Map();

Instance.OnScriptInput("SaveData", () => {
    Instance.ServerCommand("say **正在保存连关数据**");

    // 启用针对风云社的开局防尸变参数配置实体
    Instance.EntFireAtName({ name: "stage_continuous_init_zr_off_relay_fys", input: "Enable" });

    // 清除上次的存储内容
    playerData.clear();

    const players = /** @type {CSPlayerPawn[]} */ (Instance.FindEntitiesByClass("player"));
    for (const player of players) {
        if (!player || !player.IsValid() || player.GetTeamNumber() !== 3) continue;
        const health = player.GetHealth();
        if (!(health > 0)) continue;
        const armor = player.GetArmor();
        const weapons = FindWeapons(player);
        playerData.set(player, { armor: armor, health: health, weapons: weapons });
    }
});

Instance.OnScriptInput("ReadData", () => {

    // 检查是否开启连关
    if (!continuousSwitch) return;
    if (!playerData.size) return;

    // 尸变发生后延迟1秒将所有玩家变为人类
    Delay(1, () => {
        Instance.ServerCommand("c_revive @t");
    });

    // 延迟2秒后读取数据
    Delay(2, () => {
        Instance.ServerCommand("say **正在读取连关数据**");
        const players = /** @type {CSPlayerPawn[]} */ (Instance.FindEntitiesByClass("player"));
        for (const player of players) {
            if (!player || !player.IsValid()) continue;

            // 检查是否被存储为上局存活的玩家
            if (playerData.has(player)) {
                const properties = playerData.get(player);
                player.SetArmor(properties.armor);
                player.SetHealth(properties.health);
                GiveWeapons(player, properties.weapons);
            } else if (player.GetTeamNumber() === 3) {
                player.Kill();
            }
        }
        playerData.clear();
    });
});

Instance.OnScriptInput("Enable", () => {
    continuousSwitch = true;
});

Instance.OnScriptInput("Disable", () => {
    continuousSwitch = false;
});

Instance.OnRoundEnd((event) => {
    if (event.winningTeam === 2) {
        if (continuousSwitch) {
            Instance.EntFireAtName({ name: "level_counter", input: "SetValue", value: 1 });

            // 关闭针对风云社的开局防尸变参数配置实体
            Instance.EntFireAtName({ name: "stage_continuous_init_zr_off_relay_fys", input: "Disable" });
        }
        playerData.clear();
    }
});

/**
 * 获取当前玩家的全部武器
 * @param {CSPlayerPawn} player 
 */
function FindWeapons(player) {
    const weaponSlots = [CSGearSlot.RIFLE, CSGearSlot.PISTOL]
    const weaponNames = ["weapon_healthshot", "weapon_molotov", "weapon_flashbang", "weapon_incgrenade", "weapon_hegrenade", "weapon_smokegrenade", "weapon_decoy", "weapon_taser"]
    const weapons = [];
    for (const weaponSlot of weaponSlots) {
        const weapon = player.FindWeaponBySlot(weaponSlot);
        if (!weapon || !weapon.IsValid()) continue;
        const name = weapon.GetClassName();
        weapons.push(name);
    }
    for (const weaponName of weaponNames) {
        const weapon = player.FindWeapon(weaponName);
        if (!weapon || !weapon.IsValid()) continue;
        weapons.push(weaponName);
    }
    return weapons;
}

/**
 * 给予玩家多种武器
 * @param {CSPlayerPawn} player 
 * @param {string[]} weapons
 */
function GiveWeapons(player, weapons) {
    for (const weapon of weapons) {
        player.DestroyWeapons();
        Delay(1, () => {
            player.GiveNamedItem(weapon);
        });
    }
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