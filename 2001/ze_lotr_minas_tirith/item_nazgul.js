import { Instance } from "cs_script/point_script";

// @ts-ignore
// 数组存储多个玩家
let markedPlayers = [];

// 输入：标记玩家(范围在1-6人)
Instance.OnScriptInput("LaunchNAZGUL", (inputData) => {
    let player = inputData.activator;

    if (!player || !player.IsValid()) return;

    // @ts-ignore
    // 查重：如果数组里已经有这个人，就不再重复添加
    if (markedPlayers.includes(player)) {
        Instance.Msg("LaunchNAZGUL: 玩家已在列表 -> " + player.GetEntityName());
        return;
    }

    // @ts-ignore
    // 如果数组里没有这个人，添加到数组
    markedPlayers.push(player);
    Instance.Msg("LaunchNAZGUL: 新增标记玩家 -> " + player.GetEntityName() + " (当前总数: " + markedPlayers.length + ")");
});

Instance.OnPlayerDamage((event) => {
    // 获取被攻击者
    let victim = event.player;

    // @ts-ignore
    // 1. 检查被攻击者是否在我们的标记名单里
    // 如果名单为空，或者被攻击者不在名单里，直接跳过
    if (markedPlayers.length === 0 || !markedPlayers.includes(victim)) {
        return;
    }

    // 2. 获取攻击者
    let attacker = event.attacker;
    if (!attacker || !attacker.IsValid()) return;

    // 3. 计算击退向量
    let attackerPos = attacker.GetAbsOrigin();
    let playerPos = victim.GetAbsOrigin();

    let dirX = playerPos.x - attackerPos.x;
    let dirY = playerPos.y - attackerPos.y;
    let dirZ = playerPos.z - attackerPos.z;

    let len = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);

    if (len > 0) {
        const force = 110;
        
        let pushX = (dirX / len) * force;
        let pushY = (dirY / len) * force;
        let pushZ = (dirZ / len) * force + 5; 

        // 优化2：动量保留 (当前速度 + 击退速度)
        let currentVel = victim.GetAbsVelocity();

        let finalVelocity = {
            x: currentVel.x + pushX,
            y: currentVel.y + pushY,
            z: currentVel.z + pushZ + 10 // 额外提升Z轴速度
        };

        // 应用速度
        victim.Teleport({ velocity: finalVelocity });
    }
});

// 回合开始时清空名单
Instance.OnRoundStart(() => {
    // @ts-ignore
    markedPlayers = [];
    Instance.Msg("LaunchNAZGUL: 回合开始，清空标记名单。");
});