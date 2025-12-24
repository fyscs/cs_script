import { Instance } from "cs_script/point_script";

// @ts-ignore
let savedPlayer = null;

Instance.OnScriptInput("LaunchNAZGUL", (inputData) => {
    // 获取触发该输入的实体
    let player = inputData.activator;

    // 确保实体存在且有效 
    if (player && player.IsValid()) {
        savedPlayer = player; 
        // 将玩家存入全局变量
        Instance.Msg("LaunchNAZGUL 已抓取并保存 player: " + player.GetEntityName());
    }
});
Instance.OnScriptInput("hurt", (inputData) => {
    // 获取攻击者
    let attacker = inputData.caller;

    // 检查实体是否有效且存在 
    // @ts-ignore
    if (attacker && savedPlayer && attacker.IsValid() && savedPlayer.IsValid()) {
        
        // 获取两者的位置 
        let attackerPos = attacker.GetAbsOrigin();
        let playerPos = savedPlayer.GetAbsOrigin();
        // 计算击退方向：从攻击者指向被触发者
        let dirX = playerPos.x - attackerPos.x;
        let dirY = playerPos.y - attackerPos.y;
        let dirZ = playerPos.z - attackerPos.z;

        // 计算向量长度以便归一化
        let len = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);

        if (len > 0) {
            // 归一化并乘以力度 110
            let force = 110;
            let velocity = {
                x: (dirX / len) * force,
                y: (dirY / len) * force,
                z: (dirZ / len) * force + 5
            };

            // 应用击退效果
            savedPlayer.Teleport({ velocity: velocity });
        }
    }
});