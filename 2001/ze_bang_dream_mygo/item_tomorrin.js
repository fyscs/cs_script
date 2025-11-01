import { Instance } from "cs_script/point_script";

// 技能开始标志
let skill1Flag = false;
let skill2Flag = false;

// 玩家状态存储
let monitoredPlayers = new Map();

// 目标实体存储
let targetEntity = null;
let hasValidTarget = false;

// 模型实体存储
let modelEntity = null;
let hasValidModel = false;
let glowStartTime = 0;

// 初始化Think
Instance.SetThink(TomorrinSkill);

// 当接收到skill1输入时开始技能一
Instance.OnScriptInput("skill1", (context) => {
    // 在技能开始时获取目标实体并检查有效性
    targetEntity = Instance.FindEntityByName("item_human_tomorrin_rota");
    hasValidTarget = targetEntity && targetEntity.IsValid();
    
    // 获取模型实体并开始发光效果
    modelEntity = Instance.FindEntityByName("item_human_tomorrin_model");
    hasValidModel = modelEntity && modelEntity.IsValid();
    
    if (hasValidTarget && hasValidModel) {
        skill1Flag = true;
        glowStartTime = Instance.GetGameTime();
        Instance.SetNextThink(Instance.GetGameTime());
    }
});

// 当接收到skill2输入时开始技能一
Instance.OnScriptInput("skill2", (context) => {
    // 在技能开始时获取目标实体并检查有效性
    targetEntity = Instance.FindEntityByName("item_human_tomorrin_rota");
    hasValidTarget = targetEntity && targetEntity.IsValid();
    
    // 获取模型实体并开始发光效果
    modelEntity = Instance.FindEntityByName("item_human_tomorrin_model");
    hasValidModel = modelEntity && modelEntity.IsValid();
    
    if (hasValidTarget && hasValidModel) {
        skill2Flag = true;
        glowStartTime = Instance.GetGameTime();
        Instance.SetNextThink(Instance.GetGameTime());
    }
});

// 当接收到stop时停止循环并清除玩家状态
Instance.OnScriptInput("stop", (context) => {
    // 停止循环标志
    skill1Flag = false;
    skill2Flag = false;
    hasValidTarget = false;
    
    // 停止发光效果
    if (modelEntity && modelEntity.IsValid()) {
        modelEntity.Unglow();
    }
    hasValidModel = false;

    // 清除玩家状态
    monitoredPlayers.clear();
});

// 当接收到playerAdd时将给予玩家添加状态
Instance.OnScriptInput("playerAdd", (context) => {
    if (!context.activator) {
        return;
    }

    // 检查玩家是否已经在监测中
    if (monitoredPlayers.has(context.activator)) {
        return;
    }
    
    // 为玩家创建新的监测状态，包括冻结开始时间
    monitoredPlayers.set(context.activator, {
        freezeStartTime: Instance.GetGameTime()
    });
});

// 当接收到playerRemove时将移除玩家添加状态
Instance.OnScriptInput("playerRemove", (context) => {
    if (!context.activator) {
        return;
    }

    // 检查玩家是否在监测中并将玩家状态移除
    if (monitoredPlayers.has(context.activator)) {
        monitoredPlayers.delete(context.activator);
    }
});

function TomorrinSkill() {
    if (skill1Flag && hasValidTarget) {
        monitoredPlayers.forEach((state, player) => {
            if (player && player.IsValid()) {
                Skill1Effect(player);
                // 应用冻结效果
                freezeEffect(player, state);
            } else {
                monitoredPlayers.delete(player);
            }
        });
        
        // 更新发光效果
        if (hasValidModel) {
            TomorrinGlow();
        }
        
        Instance.SetNextThink(Instance.GetGameTime());
    }
    else if (skill2Flag && hasValidTarget) {
        monitoredPlayers.forEach((state, player) => {
            if (player && player.IsValid()) {
                Skill2Effect(player);
                // 应用冻结效果
                freezeEffect(player, state);
            } else {
                monitoredPlayers.delete(player);
            }
        });
        
        // 更新发光效果
        if (hasValidModel) {
            TomorrinGlow();
        }
        
        Instance.SetNextThink(Instance.GetGameTime());
    }
    else return;
}

// 技能一效果
function Skill1Effect(player) {
    // 获取目标实体的角度
    const targetAngles = targetEntity.GetAbsAngles();
    
    // 设置玩家的角度与目标实体一致，但强制垂直角度为水平面
    player.Teleport({ 
        angles: { 
            pitch: 0,                // 强制垂直角度为水平面
            yaw: targetAngles.yaw,   // 使用目标实体的水平角度
            roll: 0 
        } 
    });
}

// 技能二效果
function Skill2Effect(player) {
    // 获取玩家眼睛位置和目标实体位置
    const playerEyePos = player.GetEyePosition();
    const targetPos = targetEntity.GetAbsOrigin();
    
    // 计算从玩家到目标实体的方向向量
    const direction = {
        x: targetPos.x - playerEyePos.x,
        y: targetPos.y - playerEyePos.y,
        z: targetPos.z - playerEyePos.z
    };
    
    // 计算偏航角（水平方向）
    const yaw = Math.atan2(direction.y, direction.x) * 180 / Math.PI;
    
    // 设置玩家的视角角度，强制垂直角度为水平面
    player.Teleport({ 
        angles: { 
            pitch: 0,        // 强制垂直角度为水平面
            yaw: yaw,        // 使用计算出的水平角度
            roll: 0 
        } 
    });
}

// 给予Tomorrin一个颜色变化的Glow
function TomorrinGlow() {
    if (!modelEntity || !modelEntity.IsValid()) {
        hasValidModel = false;
        return;
    }
    
    // 基于时间的颜色渐变
    const currentTime = Instance.GetGameTime();
    const elapsedTime = currentTime - glowStartTime;
    
    // 使用正弦函数创建平滑的颜色变化
    // 红色分量 - 随时间周期性变化
    const red = Math.floor(127 + 127 * Math.sin(elapsedTime * 2));
    // 绿色分量 - 相位偏移的周期性变化
    const green = Math.floor(127 + 127 * Math.sin(elapsedTime * 2 + Math.PI * 2 / 3));
    // 蓝色分量 - 相位偏移的周期性变化
    const blue = Math.floor(127 + 127 * Math.sin(elapsedTime * 2 + Math.PI * 4 / 3));
    
    // 设置发光颜色
    modelEntity.Glow({
        r: red,
        g: green,
        b: blue,
        a: 255
    });
}

// 冻结效果 - 在3秒内逐渐将玩家速度限制到0
function freezeEffect(player, state) {
    // 计算冻结进度（0到1之间）
    const currentTime = Instance.GetGameTime();
    const freezeProgress = Math.min(1, (currentTime - state.freezeStartTime) / 3);
    
    // 如果已经完成冻结，设置速度为0
    if (freezeProgress >= 1) {
        player.Teleport({ velocity: { x: 0, y: 0, z: 0 } });
        return;
    }
    
    // 获取当前速度
    const currentVelocity = player.GetAbsVelocity();
    
    // 计算减速因子（从1逐渐减少到0）
    const decelerationFactor = 1 - freezeProgress;
    
    // 应用减速
    const newVelocity = {
        x: currentVelocity.x * decelerationFactor,
        y: currentVelocity.y * decelerationFactor,
        z: currentVelocity.z * decelerationFactor
    };
    
    // 设置新速度
    player.Teleport({ velocity: newVelocity });
}

// 当玩家断开连接时移除其状态
Instance.OnPlayerDisconnect((event) => {
    const playerSlot = event.playerSlot;
    
    // 查找对应的玩家实体并移除其状态
    monitoredPlayers.forEach((state, player) => {
        if (player && player.IsValid()) {
            const controller = player.GetPlayerController();
            if (controller && controller.GetPlayerSlot() === playerSlot) {
                monitoredPlayers.delete(player);
            }
        }
    });
});