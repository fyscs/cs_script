import { Instance } from "cs_script/point_script";

// 创建一个 Set 存储多个玩家
const protectedPlayers = new Set();

Instance.OnScriptInput("LaunchTROLL", (inputData) => {
    // 获取玩家 
    let player = inputData.activator;

    // 确保实体存在且有效
    if (player && player.IsValid()) {
        // 将玩家加入受保护集合
        protectedPlayers.add(player);
        
        // 打印调试信息
        Instance.Msg("[TROLL] 玩家已获得 60% 减伤效果");
    }
});

Instance.OnBeforePlayerDamage((event) => {
    // 检查受害者 (event.player) 是否在我们的受保护列表中
    if (protectedPlayers.has(event.player)) {

        // 计算减伤后的数值 (40% 伤害)
        const newDamage = event.damage * 0.4;

        // 返回修改后的伤害值对象
        return { damage: newDamage };
    }
});

// 回合开始时清空列表，防止效果错误地延续到下一局
Instance.OnRoundStart(() => {
    protectedPlayers.clear();
    Instance.EntFireAtName({name: "finder", input: "AddOutput", value: "OnFoundEntity>!caller>KeyValues>targetname 5>0>1"});
    Instance.Msg("[TROLL] 所有玩家的减伤效果已重置");
});