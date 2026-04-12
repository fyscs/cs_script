// @ts-nocheck

import { Instance } from "cs_script/point_script";

Instance.OnScriptInput("spawn", (inputData) => {
    spawnCannons();
});

function spawnCannons() {
    const allPlayers = Instance.FindEntitiesByClass("player");
    
    // CT并且存活
    const ctPlayers = allPlayers.filter(player => {
        return player.GetTeamNumber() === 3 && player.IsAlive();
    });
    
    if (ctPlayers.length === 0) {
        return;
    }
    
    // 按血量从低到高排序
    const sortedByHealth = ctPlayers.sort((a, b) => a.GetHealth() - b.GetHealth());
    
    // 只攻击血量最低的1个单位
    const targetPlayer = sortedByHealth[0];
    
    const template = Instance.FindEntityByName("strider_cannon_template");
    
    if (!template || !template.IsValid()) {
        return;
    }
    
    const playerPos = targetPlayer.GetAbsOrigin();
    template.ForceSpawn(playerPos, { pitch: 0, yaw: 0, roll: 0 });
}