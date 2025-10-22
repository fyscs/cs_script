import { Instance } from "cs_script/point_script";

/**
 * 清除玩家targetname系统
 * 使用Think循环检测，当玩家没有手枪时清除targetname
 * 
 * 此脚本由皮皮猫233编写
 * 如需使用请标明出处
 * 版本V1.5 2025/10/12
 */

// 配置参数
const CHECK_INTERVAL = 0; // 检测间隔（秒）

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
            // 检查玩家名称是否符合player_ltjd_w_?格式
            const playerName = player.GetEntityName();
            if (playerName && playerName.startsWith("player_ltjd_w_")) {
                // 检查玩家是否没有手枪（副武器槽位为空）
                if (!hasPistol(player)) {
                    // 提取后缀（去掉"player_ltjd_w_"后的部分）
                    const suffix = playerName.substring("player_ltjd_w_".length);
                    
                    // 构建对应的mm实体名称
                    const mmEntityName = "item_ltjd_w_mm_" + suffix;
                    
                    // 查找对应的mm实体
                    const mmEntity = Instance.FindEntityByName(mmEntityName);
                    
                    if (mmEntity && mmEntity.IsValid()) {
                        // 对mm实体执行SetMeasureTarget
                        Instance.EntFireAtName({ 
                            name: mmEntityName, 
                            input: "SetMeasureTarget", 
                            value: "" 
                        });
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
