import { Instance } from "cs_script/point_script";

// by 凯岩城的狼
const SCRIPT_VERSION = "v1.2.0";

// NPC配置
// changed by krays'js
const TURRET_CONFIG = {
    turretName: "lv2_boss_physbox",
    teamFilter: 2, // 攻击CT玩家
    range: 1210000,
    turnSpeed: 100, // 平滑转向速度
    updateInterval: 0.05, // 更频繁的更新
    targetSwitchInterval: 2.0, // 每2秒随机切换目标
    focusSingleTarget: true // 当只剩一个目标时持续追踪
};

const turretStates = {};
let isSystemActive = false;
const playerCache = {
    players: [],
    lastUpdate: 0,
    updateInterval: 0.5
};

function getAllPlayers() {
    const currentTime = Instance.GetGameTime();
    if (currentTime - playerCache.lastUpdate > playerCache.updateInterval) {
        try {
            const players = Instance.FindEntitiesByClass("player");
            playerCache.players = players.filter(player => {
                if (!player || !player.IsValid()) return false;
                if (!player.IsAlive()) return false;
                return true;
            });
            playerCache.lastUpdate = currentTime;
        } catch (error) {
            playerCache.players = [];
        }
    }
    return playerCache.players;
}

// 计算两点之间的距离平方
function getSquaredDistance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return dx * dx + dy * dy + dz * dz;
}

function normalizeAngle(angle) {
    return ((angle + 180) % 360) - 180;
}

// 获取目标
function acquireTarget(turret) {
    const origin = turret.ent.GetAbsOrigin();
    const allPlayers = getAllPlayers();
    
    // 找到范围内的所有玩家
    const candidates = allPlayers.filter(player => {
        const teamNumber = player.GetTeamNumber();
        const distance = getSquaredDistance(player.GetAbsOrigin(), origin);
        return teamNumber !== turret.teamFilter && distance <= turret.range;
    });
    
    if (candidates.length === 0) {
        return null;
    }
    
    if (candidates.length === 1) {
        return candidates[0];
    }
    
    // 多个玩家时随机选择
    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
}

// 更新单个NPC
function updateTurret(turret) {
    // 检查系统是否激活
    if (!isSystemActive) return;
    
    // 检查NPC是否有效
    if (!turret.ent.IsValid()) return;
    
    const currentTime = Instance.GetGameTime();
    
    // 如果当前目标无效，重新获取目标
    if (!turret.target || !turret.target.IsValid()) {
        turret.target = acquireTarget(turret);
        turret.lastTargetSwitch = currentTime;
    }
    
    // 检查是否需要随机切换目标（只有在有有效目标时才切换）
    if (turret.target && turret.target.IsValid() && 
        currentTime - turret.lastTargetSwitch >= TURRET_CONFIG.targetSwitchInterval) {
        
        // 获取所有符合条件的玩家
        const allPlayers = getAllPlayers();
        const validPlayers = allPlayers.filter(player => {
            const teamNumber = player.GetTeamNumber();
            const distance = getSquaredDistance(player.GetAbsOrigin(), turret.ent.GetAbsOrigin());
            return teamNumber !== turret.teamFilter && distance <= turret.range;
        });
        
        if (validPlayers.length === 1 && TURRET_CONFIG.focusSingleTarget) {
            turret.target = validPlayers[0];
        } else {
            // 多个玩家时随机切换
            turret.target = acquireTarget(turret);
        }
        
        turret.lastTargetSwitch = currentTime;
    }
    
    if (!turret.target) return;
    
    // 获取目标当前位置
    const src = turret.ent.GetAbsOrigin();
    let dst = turret.target.GetAbsOrigin();
    const currentTargetPos = { x: dst.x, y: dst.y, z: dst.z };
    
    // 检测自身是否静止
    const currentTurretPos = turret.ent.GetAbsOrigin();
    if (turret.lastTurretPosition) {
        const distance = getSquaredDistance(currentTurretPos, turret.lastTurretPosition);
        const stillThreshold = 9; // 9单位内认为静止（3的平方）
        
        if (distance < stillThreshold) {
            turret.turretStillTime += TURRET_CONFIG.updateInterval;
        } else {
            turret.turretStillTime = 0;
        }
    } else {
        turret.turretStillTime = 0;
    }
    
    if (turret.turretStillTime >= 3.0 && 
        currentTime - turret.lastRotationTime >= 5.0) {
        turret.currentYaw += 180;
        turret.lastRotationTime = currentTime;
        turret.turretStillTime = 0;
    }
    
    // 更新目标位置记录
    turret.lastTargetPosition = currentTargetPos;
    
    // 更新自身位置记录
    turret.lastTurretPosition = { x: currentTurretPos.x, y: currentTurretPos.y, z: currentTurretPos.z };
    
    // 计算目标角度
    dst.z += 12; // 瞄准胸部高度
    
    const dx = dst.x - src.x;
    const dy = dst.y - src.y;
    const dz = dst.z - src.z;
    
    const desiredYaw = Math.atan2(dy, dx) * 180 / Math.PI;
    const horizDist = Math.sqrt(dx * dx + dy * dy);
    const desiredPitch = -Math.atan2(dz, horizDist) * 180 / Math.PI;
    
    // 平滑转向 - 使用更精细的角度插值
    const dt = TURRET_CONFIG.updateInterval;
    const maxTurnSpeed = turret.turnSpeed * dt;
    
    // 计算角度差
    const yawDiff = normalizeAngle(desiredYaw - turret.currentYaw);
    const pitchDiff = normalizeAngle(desiredPitch - turret.currentPitch);
    
    // 使用更平滑的插值
    const smoothFactor = 0.15; // 平滑系数
    turret.currentYaw = normalizeAngle(turret.currentYaw + yawDiff * smoothFactor);
    turret.currentPitch = normalizeAngle(turret.currentPitch + pitchDiff * smoothFactor);
    
    // 限制最大转向速度
    const yawSpeed = Math.abs(yawDiff * smoothFactor);
    const pitchSpeed = Math.abs(pitchDiff * smoothFactor);
    
    if (yawSpeed > maxTurnSpeed) {
        turret.currentYaw = normalizeAngle(turret.currentYaw + Math.sign(yawDiff) * maxTurnSpeed);
    }
    if (pitchSpeed > maxTurnSpeed) {
        turret.currentPitch = normalizeAngle(turret.currentPitch + Math.sign(pitchDiff) * maxTurnSpeed);
    }
    
    // 应用NPC角度
    turret.ent.Teleport({ 
        angles: { 
            pitch: turret.currentPitch, 
            yaw: turret.currentYaw, 
            roll: 0 
        }
    });
}

// 更新所有NPC
function updateAllTurrets() {
    for (const turretName in turretStates) {
        if (turretStates.hasOwnProperty(turretName)) {
            updateTurret(turretStates[turretName]);
        }
    }
}

function initTurrets() {
    for (const key in turretStates) {
        delete turretStates[key];
    }
    let entities = [];
    try {
        entities = Instance.FindEntitiesByName(TURRET_CONFIG.turretName);
    } catch (e) {
        entities = Instance.FindEntitiesByClass("func_physbox");
    }
    
    let count = 0;
    for (let i = 0; i < entities.length; i++) {
        const ent = entities[i];
        if (!ent) continue;
        
        try {
            if (!ent.IsValid()) continue;
            
            const name = ent.GetEntityName();
            if (!name) continue;
            
            const angles = ent.GetAbsAngles();
            if (!angles) continue;
            
            turretStates[name] = {
                ent: ent,
                teamFilter: 2,
                range: 1210000,
                turnSpeed: 200,
                currentYaw: angles.yaw || 0,
                currentPitch: angles.pitch || 0,
                target: null,
                lastTargetSwitch: 0,
                lastTargetPosition: null,
                lastTurretPosition: null,
                turretStillTime: 0,
                lastRotationTime: 0
            };
            
            count++;
        } catch (e) {
            // 静默跳过错误实体
        }
    }
    isSystemActive = true;
}

// 停止所有NPC
function stopAllTurrets() {
    // 停用系统
    isSystemActive = false;
    
    for (const turretName in turretStates) {
        if (turretStates.hasOwnProperty(turretName)) {
            turretStates[turretName].target = null;
        }
    }
}

// 重新初始化NPC
function reinitTurrets() {
    // 先停止系统
    isSystemActive = false;
    
    for (const turretName in turretStates) {
        delete turretStates[turretName];
    }
    
    // 重新初始化
    initTurrets();
}

Instance.OnScriptInput("Init", () => {
    try {
        initTurrets();
    } catch (error) {
    }
});

Instance.OnScriptInput("Stop", (inputData) => {
    try {
        stopAllTurrets();
    } catch (error) {
        // 静默处理错误
    }
});

Instance.OnScriptInput("Reinit", (inputData) => {
    try {
        reinitTurrets();
    } catch (error) {
        // 静默处理错误
    }
});

Instance.OnScriptInput("RunScriptInput", (inputData) => {
    try {
        if (!isSystemActive) {
            initTurrets();
        } else {
            stopAllTurrets();
        }
    } catch (error) {
        // 静默处理错误
    }
});

function ScriptThink() {
    try {
        updateAllTurrets();
    } catch (error) {
    }
    Instance.SetNextThink(Instance.GetGameTime() + TURRET_CONFIG.updateInterval);
}

function Init() {
    Instance.SetNextThink(0.1);
}

// 脚本激活和重载事件
Instance.OnActivate(() => {
    Init();
});

Instance.OnScriptReload({
    after: () => {
        Init();
    }
});

// 设置思考函数
Instance.SetThink(ScriptThink);
Instance.SetNextThink(Instance.GetGameTime());

