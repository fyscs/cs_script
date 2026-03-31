// @ts-nocheck

import { Instance } from "cs_script/point_script";

Instance.Msg("boss追踪脚本已加载");

const TICKRATE = 0.10;
const SWITCH_INTERVAL = 5.0;
const FIXED_ANGLE = { pitch: 0, yaw: 0, roll: 0 }; // 固定朝向
let targetPlayer = null;
let tf = null;
let tb = null;
let tl = null;
let tr = null;
let npcEntity = null;
let ticking = false;
let lastSwitchTime = 0;

// 实体查找
function SetupEntities() {
    npcEntity = Instance.FindEntityByName("boss_physbox");
    tf = Instance.FindEntityByName("boss_thruster_forward");
    tb = Instance.FindEntityByName("boss_thruster_back");
    tl = Instance.FindEntityByName("boss_thruster_left");
    tr = Instance.FindEntityByName("boss_thruster_right");
    
    return npcEntity && tf && tb && tl && tr;
}

// 查找最近的CT玩家
function FindNearestCTPlayer() {
    if (!npcEntity || !npcEntity.IsValid()) return null;
    
    const npcPos = npcEntity.GetAbsOrigin();
    const players = Instance.FindEntitiesByClass("player");
    let nearestPlayer = null;
    let minDistance = Infinity;
    
    for (const player of players) {
        if (player && player.IsValid()) {
            const team = player.GetTeamNumber();
            if (team === 3) { // 只追踪团队编号为3的CT玩家
                const playerPos = player.GetAbsOrigin();
                const dx = playerPos.x - npcPos.x;
                const dy = playerPos.y - npcPos.y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestPlayer = player;
                }
            }
        }
    }
    
    return nearestPlayer;
}

// 切换目标到最近的CT玩家
function SwitchToNearestCT() {
    const newTarget = FindNearestCTPlayer();
    if (newTarget && newTarget.IsValid()) {
        if (!targetPlayer || targetPlayer !== newTarget) {
            targetPlayer = newTarget;
            return true;
        }
    }
    return false;
}

// 开始追踪触发玩家
Instance.OnScriptInput("Start", (inputData) => {
    let player = null;
    
    if (inputData.activator && inputData.activator.IsValid()) {
        player = inputData.activator;
    }
    else if (inputData.caller && inputData.caller.IsValid()) {
        player = inputData.caller;
    }
    else {
        const players = Instance.FindEntitiesByClass("player");
        if (players.length > 0) {
            player = players[0];
        }
    }
    
    if (!player || !player.IsValid()) {
        return;
    }
    
    if (ticking) {
        StopTracking();
    }
    
    targetPlayer = player;
    
    if (!SetupEntities()) {
        return;
    }
    
    // 设置固定朝向
    if (npcEntity && npcEntity.IsValid()) {
        npcEntity.Teleport({
            angles: FIXED_ANGLE
        });
    }
    
    ticking = true;
    lastSwitchTime = Instance.GetGameTime();
    Instance.SetThink(Tick);
    Instance.SetNextThink(Instance.GetGameTime() + TICKRATE);
});

// 停止追踪
Instance.OnScriptInput("Stop", () => {
    StopTracking();
});

function StopTracking() {
    if (ticking) {
        ticking = false;
        targetPlayer = null;
        Instance.SetThink(null);
        DeactivateAllThrusters();
    }
}

// 关闭所有推进器
function DeactivateAllThrusters() {
    if (tf && tf.IsValid()) Instance.EntFireAtTarget({ target: tf, input: "Deactivate" });
    if (tb && tb.IsValid()) Instance.EntFireAtTarget({ target: tb, input: "Deactivate" });
    if (tl && tl.IsValid()) Instance.EntFireAtTarget({ target: tl, input: "Deactivate" });
    if (tr && tr.IsValid()) Instance.EntFireAtTarget({ target: tr, input: "Deactivate" });
}

// 追踪主循环
function Tick() {
    if (!ticking) return;

    Instance.SetNextThink(Instance.GetGameTime() + TICKRATE);

    // 强制保持固定朝向
    if (npcEntity && npcEntity.IsValid()) {
        npcEntity.Teleport({
            angles: FIXED_ANGLE
        });
    }

    // 每5秒检查一次是否需要切换目标
    const currentTime = Instance.GetGameTime();
    if (currentTime - lastSwitchTime >= SWITCH_INTERVAL) {
        SwitchToNearestCT();
        lastSwitchTime = currentTime;
    }

    if (!targetPlayer || !targetPlayer.IsValid()) {
        StopTracking();
        return;
    }

    if (!npcEntity || !npcEntity.IsValid()) {
        StopTracking();
        return;
    }

    // 每次循环都先关闭所有推进器
    DeactivateAllThrusters();

    // 计算相对位置和距离
    const npcPos = npcEntity.GetAbsOrigin();
    const playerPos = targetPlayer.GetAbsOrigin();
    const dx = playerPos.x - npcPos.x;
    const dy = playerPos.y - npcPos.y;
    const distance = Math.sqrt(dx*dx + dy*dy);

    // 四方向移动逻辑
    if (distance > 50) {
        // X方向移动
        if (dx > 10) {
            if (tf && tf.IsValid()) Instance.EntFireAtTarget({ target: tf, input: "Activate" });
        } else if (dx < -10) {
            if (tb && tb.IsValid()) Instance.EntFireAtTarget({ target: tb, input: "Activate" });
        }
        
        // Y方向移动
        if (dy > 10) {
            if (tl && tl.IsValid()) Instance.EntFireAtTarget({ target: tl, input: "Activate" });
        } else if (dy < -10) {
            if (tr && tr.IsValid()) Instance.EntFireAtTarget({ target: tr, input: "Activate" });
        }
    }
}

// 立即切换目标
Instance.OnScriptInput("SwitchTarget", () => {
    SwitchToNearestCT();
});

// 地图加载时设置实体
Instance.OnActivate(() => {
    SetupEntities();
});