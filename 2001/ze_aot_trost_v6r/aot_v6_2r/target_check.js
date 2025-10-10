import { Instance } from "cs_script/point_script";

/**
 * 清除人类targetname系统
 * 使用Think循环检测，当玩家是人类且没有手枪时清除targetname
 * 
 * 此脚本由皮皮猫233编写
 * 如需使用请标明出处
 * 版本V1.2 2025/10/9
 */

// 配置参数
const CHECK_INTERVAL = 0.5; // 检测间隔（秒）

// 武器槽位常量
const WEAPON_SLOT_PISTOL = 1; // 手枪槽位

/**
 * 初始化Think循环
 */
Instance.SetThink(CheckPlayers);
Instance.SetNextThink(Instance.GetGameTime() + CHECK_INTERVAL);

/**
 * 主检测循环
 */
function CheckPlayers() {
    
    // 获取所有玩家
    const players = Instance.FindEntitiesByClass("player");
    
    for (const player of players) {
        if (player && player.IsValid()) {
            // 检查玩家是否已经有空targetname，如果是则跳过检测
            if (player.GetEntityName() === "") {
                continue;
            }
            
            // 检查玩家是否为人类（队伍编号为3）
            if (player.GetTeamNumber() === 3) {
                // 检查玩家是否没有手枪（副武器槽位为空）
                if (!hasPistol(player)) {
                    // 获取玩家名称
                    const playerName = player.GetEntityName();
                    
                    // 检查玩家名称是否符合player_ltjd_w_?格式
                    if (playerName && playerName.startsWith("player_ltjd_w_")) {
                        // 提取后缀（去掉"player_ltjd_w_"后的部分）
                        const suffix = playerName.substring("player_ltjd_w_".length);
                        
                        // 构建对应的mm实体和p250实体名称
                        const mmEntityName = "item_ltjd_w_mm_" + suffix;
                        const p250EntityName = "item_ltjd_w_p250_" + suffix;
                        
                        // 查找对应的mm实体
                        const mmEntity = Instance.FindEntityByName(mmEntityName);
                        
                        if (mmEntity && mmEntity.IsValid()) {
                            // 对mm实体执行SetMeasureTarget，目标为对应的p250实体
                            Instance.EntFireAtName({ 
                                name: mmEntityName, 
                                input: "SetMeasureTarget", 
                                value: p250EntityName 
                            });
                            
                            // 可选：输出调试信息
                            // Instance.Msg(`已为 ${mmEntityName} 设置测量目标: ${p250EntityName}`);
                        }
                    }
                    
                    // 清除targetname
                    player.SetEntityName("");
                }
            }
        }
    }
    
    // 继续Think循环
    Instance.SetNextThink(Instance.GetGameTime() + CHECK_INTERVAL);
}

/**
 * 检查玩家是否拥有手枪（副武器）
 * @param {Entity} player - 玩家实体
 * @returns {boolean} 是否拥有手枪
 */
function hasPistol(player) {
    // 获取副武器槽位的武器
    const pistol = player.FindWeaponBySlot(WEAPON_SLOT_PISTOL);
    return pistol && pistol.IsValid();
}

/**
 * 清理换边玩家的targetname
 */
Instance.OnPlayerReset((event) => {
    if (event.player && event.player.IsValid()) {
        const playerName = event.player.GetEntityName();
        
        // 检查玩家名称是否符合player_ltjd_w_?格式
        if (playerName && playerName.startsWith("player_ltjd_w_")) {
            // 提取后缀（去掉"player_ltjd_w_"后的部分）
            const suffix = playerName.substring("player_ltjd_w_".length);
            
            // 构建对应的mm实体和p250实体名称
            const mmEntityName = "item_ltjd_w_mm_" + suffix;
            const p250EntityName = "item_ltjd_w_p250_" + suffix;
            
            // 查找对应的mm实体
            const mmEntity = Instance.FindEntityByName(mmEntityName);
            
            if (mmEntity && mmEntity.IsValid()) {
                // 对mm实体执行SetMeasureTarget，目标为对应的p250实体
                Instance.EntFireAtName({ 
                    name: mmEntityName, 
                    input: "SetMeasureTarget", 
                    value: p250EntityName 
                });
            }
        }
        
        // 清除targetname
        event.player.SetEntityName("");
    }
});