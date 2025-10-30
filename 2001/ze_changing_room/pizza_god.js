import { CSPlayerPawn, Entity, Instance, PointTemplate } from "cs_script/point_script";
//by 凯岩城的狼
// 全局状态管理
const state = {
    playerTriggered: new Set(), // 记录本回合已触发过的玩家
    currentRound: 0 // 当前回合数
};

// 模板名称
const TEMPLATE_NAME = "@fuck_temp";

// 初始化函数
function Init() {
    Instance.SetNextThink(0.001);
    console.log("Fuck Pizza Trigger 脚本已加载");
}

// 监听玩家聊天事件
Instance.OnPlayerChat((event) => {
    try {
        const speaker = event.player;
        const text = event.text;
        const team = event.team;
        
        if (!speaker) return;
        
        // 检查是否包含 "fuck pizza" (不区分大小写)
        if (text.toLowerCase().includes("fk pizza")) {
            const playerSlot = speaker.GetPlayerSlot();
            
            // 检查该玩家本回合是否已经触发过
            if (!state.playerTriggered.has(playerSlot)) {
                // 标记该玩家已触发
                state.playerTriggered.add(playerSlot);
                
                // 获取玩家实体
                const playerPawn = speaker.GetPlayerPawn();
                if (playerPawn && playerPawn.IsValid()) {
                    // 在玩家脚下生成模板
                    SpawnTemplateAtPlayer(playerPawn);
                    
                    // 发送消息到公屏聊天框（红色字体）
                    Instance.ServerCommand(`say " \x07FF0000你被披萨神惩罚了"`);
                }
            }
        }
    } catch (error) {
        // 静默处理错误
    }
});

// 在玩家脚下生成模板实体
function SpawnTemplateAtPlayer(player) {
    try {
        // 验证玩家实体
        if (!player || !player.IsValid()) {
            return;
        }
        
        // 获取玩家位置
        const playerPos = player.GetAbsOrigin();
        
        // 在玩家脚下稍微低一点的位置生成
        const spawnPos = {
            x: playerPos.x,
            y: playerPos.y,
            z: playerPos.z + 10 // 在脚下10单位的位置
        };
        
        // 查找模板实体
        const template = Instance.FindEntityByName(TEMPLATE_NAME);
        if (!template || !template.IsValid()) {
            console.log(`未找到模板实体: ${TEMPLATE_NAME}`);
            return;
        }
        
        // 生成模板实体
        const entities = template.ForceSpawn(spawnPos, { pitch: 0, yaw: 0, roll: 0 });
        
        if (entities && entities.length > 0) {
            // 验证生成的实体
            const validEntities = entities.filter(ent => ent && ent.IsValid());
            console.log(`成功在玩家脚下生成 ${validEntities.length} 个实体`);
        } else {
            console.log("模板生成失败");
        }
    } catch (error) {
        console.log("生成模板时出错:", error);
    }
}

// 回合开始事件 - 重置触发状态
Instance.OnRoundStart(() => {
    // 清空本回合的触发记录
    state.playerTriggered.clear();
    state.currentRound++;
    
    console.log(`第 ${state.currentRound} 回合开始，重置 fuck pizza 触发状态`);
    
});

// 玩家断开连接事件 - 清理状态
Instance.OnPlayerDisconnect((event) => {
    try {
        const playerSlot = event.playerSlot;
        state.playerTriggered.delete(playerSlot);
        console.log(`玩家 ${playerSlot} 断开连接，清理状态`);
    } catch (error) {
        // 静默处理错误
    }
});

// 手动测试输入
Instance.OnScriptInput("test_fuck_pizza", (inputData) => {
    try {
        const players = Instance.FindEntitiesByClass("player");
        if (players.length > 0) {
            const player = players[0];
            if (player && player.IsValid() && player.IsAlive()) {
                SpawnTemplateAtPlayer(player);
                console.log("手动测试：生成 fuck pizza 模板");
            }
        }
    } catch (error) {
        // 静默处理错误
    }
});

// 重置所有玩家触发状态
Instance.OnScriptInput("reset_fuck_pizza", (inputData) => {
    try {
        state.playerTriggered.clear();
        console.log("已重置所有玩家的 fuck pizza 触发状态");
    } catch (error) {
        // 静默处理错误
    }
});

// 脚本激活和重载事件
Instance.OnActivate(() => {
    Init();
});

Instance.OnScriptReload({
    after: () => {
        Init();
    }
});

// 设置思考函数（虽然这个脚本不需要持续思考，但保持一致性）
Instance.SetThink(() => {
    Instance.SetNextThink(0.1);
});

console.log("Fuck Pizza Trigger 脚本加载完成");
