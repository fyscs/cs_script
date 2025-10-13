import { Instance } from "cs_script/point_script";

/**
 * 此脚本用于修复使用template的name fixup功能生成多个按钮类神器时错误的的targetname
 * 使用方法：在template中创建一个targetname同名的info_target（若不使用name fixup功能而只是不想使用cs2fix可不创建此实体）
 * 同时在template中再创建一个targetname_target（如targetname为player_item则info_target名称为player_item_target）的info_target
 * 将原先手枪内对!activator给予targetname的输出更改为对上述含有_target标志的info_target FireUser1
 * 在含有_target标志的info_target中添加输出OnUser1 "对此脚本实体" RunScriptInput targetname
 * 
 * 此脚本由皮皮猫233编写
 * 如需使用请标明出处
 * 版本V2.2 2025/10/13
 * 
 * V2新版本修复了使用mm等特殊情况要求不能存在同名targetname的info_target问题
 */

Instance.OnScriptInput("targetname", (context) => {
    // 获取caller的实体名称
    const callerName = context.caller.GetEntityName();
    if (!callerName)
        return;

    // 检测caller的名称中是否包含_target
    if (!callerName.includes("_target")) {
        // 如果不包含_target，则直接返回
        return;
    }

    // 如果包含_target，则去掉所有_target字符
    const targetname = callerName.replace(/_target/g, "");

    // 获取玩家实体
    const player = context.activator;
    if (!player || !player.IsValid())
        return;
    
    // 检查并移除残留info_target与上一个玩家的targetname
    const lastPlayers = Instance.FindEntitiesByName(targetname);
    for (const lastPlayer of lastPlayers) {
        if (lastPlayer.GetClassName() === "player")
            lastPlayer.SetEntityName("");
        else if (lastPlayer.GetClassName() === "info_target")
            Instance.EntFireAtName({ name: lastPlayer.GetEntityName(), input: "Kill" });
    }
    
    // 设置新的targetname给当前玩家
    player.SetEntityName(targetname);
});

// 回合开始时清空所有玩家的targetname
Instance.OnRoundStart(() => {
    const players = Instance.FindEntitiesByClass("player");
    for (const player of players) {
        if (player && player.IsValid()) {
            player.SetEntityName("");
        }
    }
});
