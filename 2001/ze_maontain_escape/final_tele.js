import { Instance } from "cs_script/point_script";

// 监听ct_tele输入
Instance.OnScriptInput("ct_tele", () => {
    // 查找目标实体
    const teleportDest = Instance.FindEntityByName("final_tele_human_dest");
    
    if (!teleportDest) {
        return;
    }
    
    // 获取目标位置和角度
    const targetPosition = teleportDest.GetAbsOrigin();
    const targetAngles = teleportDest.GetAbsAngles();
    
    // 查找所有玩家
    for (let i = 0; i < 64; i++) {
        const playerController = Instance.GetPlayerController(i);
        
        if (playerController) {
            const playerPawn = playerController.GetPlayerPawn();
            
            // 检查玩家是否是CT阵营（阵营编号3）
            if (playerPawn && playerPawn.GetTeamNumber() === 3) {
                // 传送玩家
                playerPawn.Teleport({
                    position: targetPosition,
                    angles: targetAngles
                });
                
                // 重置速度
                playerPawn.Teleport({
                    velocity: {x: 0, y: 0, z: 0}
                });
            }
        }
    }
});

// 监听t_tele输入
Instance.OnScriptInput("t_tele", () => {
    // 查找目标实体
    const teleportDest = Instance.FindEntityByName("final_tele_zombie_dest");
    
    if (!teleportDest) {
        return;
    }
    
    // 获取目标位置和角度
    const targetPosition = teleportDest.GetAbsOrigin();
    const targetAngles = teleportDest.GetAbsAngles();
    
    // 查找所有玩家
    for (let i = 0; i < 64; i++) {
        const playerController = Instance.GetPlayerController(i);
        
        if (playerController) {
            const playerPawn = playerController.GetPlayerPawn();
            
            // 检查玩家是否是T阵营（阵营编号2）
            if (playerPawn && playerPawn.GetTeamNumber() === 2) {
                // 传送玩家
                playerPawn.Teleport({
                    position: targetPosition,
                    angles: targetAngles
                });
                
                // 重置速度
                playerPawn.Teleport({
                    velocity: {x: 0, y: 0, z: 0}
                });
            }
        }
    }
});