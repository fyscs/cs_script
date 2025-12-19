import { Instance } from "cs_script/point_script";

Instance.OnPlayerChat(function(event) {
    if (event.text.trim() === "ciallo") {
        if (event.player && event.player.IsValid()) {
            var playerPawn = event.player.GetPlayerPawn();
            
            if (playerPawn && playerPawn.IsValid()) {
                // 获取玩家的位置和角度
                var position = playerPawn.GetAbsOrigin();
                var angles = playerPawn.GetAbsAngles();
                
                // 查找目标实体
                var targetEntity = Instance.FindEntityByName("ciallo_maker");
                
                // 检查实体是否存在且有效
                if (targetEntity && targetEntity.IsValid()) {
                    // 将目标实体的位置和角度设置为玩家的位置和角度
                    targetEntity.Teleport({
                        position: position,
                        angles: angles
                    });
                    
                    // 对target实体输入ForceSpawn
                    Instance.EntFireAtTarget({
                        target: targetEntity,
                        input: "ForceSpawn"
                    });
                }
            }
        }
    }
    if (event.text.trim() === "bbkb") {
        if (event.player && event.player.IsValid()) {
            var playerPawn = event.player.GetPlayerPawn();
            
            if (playerPawn && playerPawn.IsValid()) {
                // 获取玩家的位置和角度
                var position = playerPawn.GetAbsOrigin();
                var angles = playerPawn.GetAbsAngles();
                
                // 查找目标实体
                var targetEntity = Instance.FindEntityByName("bbkb_maker");
                
                // 检查实体是否存在且有效
                if (targetEntity && targetEntity.IsValid()) {
                    // 将目标实体的位置和角度设置为玩家的位置和角度
                    targetEntity.Teleport({
                        position: position,
                        angles: angles
                    });
                    
                    // 对target实体输入ForceSpawn
                    Instance.EntFireAtTarget({
                        target: targetEntity,
                        input: "ForceSpawn"
                    });
                }
            }
        }
    }
    if (event.text.trim() === "ng") {
        if (event.player && event.player.IsValid()) {
            var playerPawn = event.player.GetPlayerPawn();
            
            if (playerPawn && playerPawn.IsValid()) {
                // 获取玩家的位置和角度
                var position = playerPawn.GetAbsOrigin();
                var angles = playerPawn.GetAbsAngles();
                
                // 查找目标实体
                var targetEntity = Instance.FindEntityByName("ng_maker");
                
                // 检查实体是否存在且有效
                if (targetEntity && targetEntity.IsValid()) {
                    // 将目标实体的位置和角度设置为玩家的位置和角度
                    targetEntity.Teleport({
                        position: position,
                        angles: angles
                    });
                    
                    // 对target实体输入ForceSpawn
                    Instance.EntFireAtTarget({
                        target: targetEntity,
                        input: "ForceSpawn"
                    });
                }
            }
        }
    }
        if (event.text.trim() === "omg") {
        if (event.player && event.player.IsValid()) {
            var playerPawn = event.player.GetPlayerPawn();
            
            if (playerPawn && playerPawn.IsValid()) {
                // 获取玩家的位置和角度
                var position = playerPawn.GetAbsOrigin();
                var angles = playerPawn.GetAbsAngles();
                
                // 查找目标实体
                var targetEntity = Instance.FindEntityByName("omg_maker");
                
                // 检查实体是否存在且有效
                if (targetEntity && targetEntity.IsValid()) {
                    // 将目标实体的位置和角度设置为玩家的位置和角度
                    targetEntity.Teleport({
                        position: position,
                        angles: angles
                    });
                    
                    // 对target实体输入ForceSpawn
                    Instance.EntFireAtTarget({
                        target: targetEntity,
                        input: "ForceSpawn"
                    });
                }
            }
        }
    }
});