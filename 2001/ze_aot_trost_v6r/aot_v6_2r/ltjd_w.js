import { Instance } from "cs_script/point_script";

/**
 * 此脚本仅供巨人地图使用
 * 请勿盗用
 * 交流学习请联系作者
 * 2025/10/15
 */

/**
 * 钩锁系统状态管理
 */
let hookState = {
    isActive: false,                    // 钩锁是否激活
    player: null,                       // 当前使用钩锁的玩家
    startPosition: null,                // 钩锁发射起始位置
    targetPosition: null,               // 钩锁目标位置
    hookDirection: null,                // 钩锁发射方向
    startTime: 0,                       // 钩锁发射开始时间
    travelTime: 0,                      // 钩锁飞行时间
    playerVelocity: { x: 0, y: 0, z: 0 }, // 玩家速度
    effectPosition: null,               // 特效当前位置
    effectReachedTarget: false,         // 特效是否到达目标点
    playerSuffix: "",                   // 玩家名称尾缀
    canGrapple: false,                  // 是否允许发射新绳索
    originalTeamNumber: 0               // 玩家发射钩锁时的队伍编号
};

/**
 * 钩锁系统配置参数
 */
const HOOK_CONFIG = {
    MAX_DISTANCE: 2000,                 // 最大钩锁距离
    PLAYER_PULL_FORCE: 35,              // 玩家被拉向目标的力
    PLAYER_CONTROL_FORCE: 30,           // 玩家自主控制的力
    MAX_Z_ACCELERATION: 30,             // 最大z轴正方向加速度（力）
    MIN_DISTANCE: 0,                    // 最小停止距离
    MAX_TRAVEL_TIME: 5,                 // 最大飞行时间
    LOW_GRAVITY_FACTOR: 1,              // 低重力因子 (0-1, 越小重力越弱)
    TERMINAL_VELOCITY: -650,            // 终端速度 (最大下降速度)
    MAX_Z_VELOCITY: 1200,               // 最大z轴正方向速度（上升速度限制）
    LAUNCH_UPWARD_FORCE: 150,           // 初始向上推力
    CONTROL_FORCE_DECAY_START: 1000,    // 控制力开始衰减的距离
    EFFECT_ARRIVAL_THRESHOLD: 50,       // 特效到达目标点的阈值
    EFFECT_MOVE_DISTANCE: 50,           // 特效每帧移动距离
    MAX_DISTANCE_BUFFER: 1000,          // 最大距离缓冲值
    TIME_DECAY_START: 2.0,              // 时间衰减开始时间（秒）
    TIME_DECAY_END: 5.0,                // 时间衰减结束时间（秒）
    MIN_TIME_DECAY_FACTOR: 0.2          // 最小时间衰减因子
};

// 初始化Think循环
Instance.SetThink(Think);

/**
 * 处理回合重启事件 - 清理所有状态
 */
Instance.OnRoundStart(() => {
    resetAllState();
});

/**
 * 处理ltjdNoPower输入 - 禁用发射新绳索
 */
Instance.OnScriptInput("ltjdNoPower", (inputData) => {
    hookState.canGrapple = false;
});

/**
 * 处理ltjdPower输入 - 恢复发射新绳索
 */
Instance.OnScriptInput("ltjdPower", (inputData) => {
    hookState.canGrapple = true;
});

/**
 * 处理钩锁发射输入
 */
Instance.OnScriptInput("ltjd", (inputData) => {
    // 获取玩家
    const player = inputData.activator;
    if (!player || !player.IsValid()) return;

    // 获取玩家名称尾缀
    const playerName = player.GetEntityName();
    const playerSuffix = getPlayerSuffix(playerName);
    
    if (!playerSuffix) {
        return;
    }

    // 如果钩锁已经在使用中，先结束当前的钩锁
    if (hookState.isActive && hookState.player === player) {
        endGrapple(playerSuffix);
        return; // 不发射新钩锁
    }

    // 检查是否允许发射新绳索
    if (!hookState.canGrapple) {
        return;
    }
    
    // 获取忽略按钮
    const ignoreButton = Instance.FindEntitiesByClass("func_button");
    
    // 获取玩家视角方向
    const eyePosition = player.GetEyePosition();
    const eyeAngles = player.GetEyeAngles();
    const forward = getForward(eyeAngles);
    
    // 计算钩锁终点
    const endPoint = vectorAdd(eyePosition, vectorScale(forward, HOOK_CONFIG.MAX_DISTANCE));
    
    // 进行射线检测，寻找可钩点
    const traceResult = Instance.TraceLine({
        start: eyePosition,
        end: endPoint,
        ignoreEntity: ignoreButton,
        ignorePlayers: true
    });
    
    // 如果没有命中，则不发射钩锁
    if (!traceResult.didHit) {
        return;
    }
    
    // 发射前调用计数器实体
    const counterName = "item_ltjd_w_counter_" + playerSuffix;
    Instance.EntFireAtName({ name: counterName, input: "Subtract", value: 1 });

    // 发射前播放立体机动音效
    const soundName = "item_ltjd_w_sound_" + playerSuffix;
    Instance.EntFireAtName({ name: soundName, input: "StartSound" });
    
    // 初始化钩锁状态
    hookState.isActive = true;
    hookState.player = player;
    hookState.startPosition = eyePosition;
    hookState.targetPosition = traceResult.end;
    hookState.hookDirection = normalize(vectorSubtract(traceResult.end, eyePosition));
    hookState.startTime = Instance.GetGameTime();
    hookState.travelTime = 0;
    hookState.effectPosition = eyePosition; // 特效从玩家眼睛位置开始
    hookState.effectReachedTarget = false;
    hookState.playerSuffix = playerSuffix;
    hookState.originalTeamNumber = player.GetTeamNumber(); // 记录玩家发射时的队伍编号
    
    // 在开始推进前给予玩家一个向上的速度（但不超过最大z轴速度限制）
    const currentVelocity = player.GetAbsVelocity();
    const upwardForce = Math.min(HOOK_CONFIG.LAUNCH_UPWARD_FORCE, HOOK_CONFIG.MAX_Z_VELOCITY - currentVelocity.z);
    const launchVelocity = {
        x: currentVelocity.x,
        y: currentVelocity.y,
        z: currentVelocity.z + upwardForce // 向上推力（受最大z轴速度限制）
    };
    player.Teleport({ velocity: launchVelocity });
    hookState.playerVelocity = launchVelocity;
    
    // 启动钩锁粒子效果 - 使用动态粒子实体名称
    const particleName = "item_ltjd_w_particle_" + playerSuffix;
    Instance.EntFireAtName({ name: particleName, input: "Start" });

    // 启动喷气粒子
    const steamParticleName = "item_ltjd_w_steam_particle_" + playerSuffix;
    Instance.EntFireAtName({ name: steamParticleName, input: "Start" });
    
    // 开始Think循环 - 使用绝对时间
    Instance.SetNextThink(Instance.GetGameTime());
});

/**
 * 主Think循环
 */
function Think() {
    if (!hookState.isActive || !hookState.player || !hookState.player.IsValid()) {
        return; // 停止Think循环
    }
    
    const currentTime = Instance.GetGameTime();
    hookState.travelTime = currentTime - hookState.startTime;
    
    // 更新特效位置
    updateGrappleEffect();
    
    // 检查是否应该结束钩锁
    if (shouldEndGrapple()) {
        endGrapple(hookState.playerSuffix);
        return;
    }
    
    // 应用钩锁物理
    applyGrapplePhysics();
    
    // 继续Think循环 - 使用绝对时间设置下一帧
    Instance.SetNextThink(Instance.GetGameTime());
}

/**
 * 更新钩锁特效位置
 */
function updateGrappleEffect() {
    if (hookState.effectReachedTarget) return;
    
    // 计算特效移动方向
    const moveDirection = hookState.hookDirection;
    
    // 移动特效位置
    hookState.effectPosition = vectorAdd(
        hookState.effectPosition, 
        vectorScale(moveDirection, HOOK_CONFIG.EFFECT_MOVE_DISTANCE)
    );
    
    // 更新终点粒子位置 - 使用动态名称
    const endParticleName = "item_ltjd_w_end_particle_" + hookState.playerSuffix;
    const endParticle = Instance.FindEntityByName(endParticleName);
    if (endParticle) {
        endParticle.Teleport({ position: hookState.effectPosition });
    }
    
    // 检查特效是否接近目标点（在阈值范围内）
    const distanceToTarget = vectorDistance(hookState.effectPosition, hookState.targetPosition);
    if (distanceToTarget <= HOOK_CONFIG.EFFECT_ARRIVAL_THRESHOLD) {
        hookState.effectPosition = hookState.targetPosition;
        hookState.effectReachedTarget = true;
        
        // 确保特效精确定位到目标点
        if (endParticle) {
            endParticle.Teleport({ position: hookState.targetPosition });
        }
    }
}

/**
 * 应用钩锁物理效果
 */
function applyGrapplePhysics() {
    if (!hookState.player || !hookState.player.IsValid()) return;
    
    const player = hookState.player;
    const playerPos = player.GetAbsOrigin();
    let currentVelocity = player.GetAbsVelocity();
    
    // 计算到目标点的方向
    const toTarget = vectorSubtract(hookState.targetPosition, playerPos);
    const distanceToTarget = vectorLength(toTarget);
    const directionToTarget = normalize(toTarget);
    
    // 计算钩锁拉力（朝向目标点）
    const pullForce = vectorScale(directionToTarget, HOOK_CONFIG.PLAYER_PULL_FORCE);
    
    // 计算玩家控制力（基于玩家视角方向），并根据距离和时间衰减
    const eyeAngles = player.GetEyeAngles();
    const playerForward = getForward(eyeAngles);
    const controlForce = calculateDecayedControlForce(playerForward, distanceToTarget);
    
    // 应用低重力效果
    currentVelocity = applyLowGravity(currentVelocity);
    
    // 结合所有力
    let totalForce = vectorAdd(pullForce, controlForce);
    
    // 限制z轴正方向加速度（力）
    if (totalForce.z > HOOK_CONFIG.MAX_Z_ACCELERATION) {
        totalForce.z = HOOK_CONFIG.MAX_Z_ACCELERATION;
    }
    
    // 应用速度变化（模拟加速度）
    const newVelocity = {
        x: currentVelocity.x + totalForce.x,
        y: currentVelocity.y + totalForce.y,
        z: currentVelocity.z + totalForce.z
    };
    
    // 限制最大水平速度，但保持垂直灵活性
    const horizontalSpeed = Math.sqrt(newVelocity.x * newVelocity.x + newVelocity.y * newVelocity.y);
    const maxHorizontalSpeed = 800;
    
    if (horizontalSpeed > maxHorizontalSpeed) {
        const scale = maxHorizontalSpeed / horizontalSpeed;
        newVelocity.x *= scale;
        newVelocity.y *= scale;
    }
    
    // 限制最大z轴正方向速度（上升速度）
    if (newVelocity.z > HOOK_CONFIG.MAX_Z_VELOCITY) {
        newVelocity.z = HOOK_CONFIG.MAX_Z_VELOCITY;
    }
    
    // 应用最终速度
    player.Teleport({ velocity: newVelocity });
    
    // 根据距离调整力的强度（越近拉力越小）
    const forceMultiplier = Math.min(1, distanceToTarget / 500);
    hookState.playerVelocity = newVelocity;
}

/**
 * 计算根据距离和时间衰减的控制力
 * @param {Object} playerForward - 玩家前向向量
 * @param {number} distanceToTarget - 到目标的距离
 * @returns {Object} 衰减后的控制力向量
 */
function calculateDecayedControlForce(playerForward, distanceToTarget) {
    // 基础控制力
    let controlForce = vectorScale(playerForward, HOOK_CONFIG.PLAYER_CONTROL_FORCE);
    
    // 计算距离衰减因子
    let distanceDecayFactor = 1.0;
    if (distanceToTarget < HOOK_CONFIG.CONTROL_FORCE_DECAY_START) {
        // 线性衰减因子，从1（在CONTROL_FORCE_DECAY_START距离）到0（在MIN_DISTANCE距离）
        const decayFactor = (distanceToTarget - HOOK_CONFIG.MIN_DISTANCE) / 
                           (HOOK_CONFIG.CONTROL_FORCE_DECAY_START - HOOK_CONFIG.MIN_DISTANCE);
        
        // 确保衰减因子在0-1之间
        distanceDecayFactor = Math.max(0, Math.min(1, decayFactor));
    }
    
    // 计算时间衰减因子
    let timeDecayFactor = 1.0;
    if (hookState.travelTime > HOOK_CONFIG.TIME_DECAY_START) {
        // 线性时间衰减，从1（在TIME_DECAY_START时间）到MIN_TIME_DECAY_FACTOR（在TIME_DECAY_END时间）
        const timeProgress = (hookState.travelTime - HOOK_CONFIG.TIME_DECAY_START) / 
                           (HOOK_CONFIG.TIME_DECAY_END - HOOK_CONFIG.TIME_DECAY_START);
        
        // 确保时间进度在0-1之间
        const clampedTimeProgress = Math.max(0, Math.min(1, timeProgress));
        
        // 计算时间衰减因子（从1线性减小到MIN_TIME_DECAY_FACTOR）
        timeDecayFactor = 1 - (1 - HOOK_CONFIG.MIN_TIME_DECAY_FACTOR) * clampedTimeProgress;
    }
    
    // 应用距离和时间衰减
    controlForce = vectorScale(controlForce, distanceDecayFactor * timeDecayFactor);
    
    return controlForce;
}

/**
 * 应用低重力效果
 * @param {Object} velocity - 当前速度向量
 * @returns {Object} 应用低重力后的速度向量
 */
function applyLowGravity(velocity) {
    // 只对下降速度应用低重力效果
    if (velocity.z < 0) {
        // 使用低重力因子减少下降速度
        velocity.z *= HOOK_CONFIG.LOW_GRAVITY_FACTOR;
        
        // 确保下降速度不超过终端速度
        if (velocity.z < HOOK_CONFIG.TERMINAL_VELOCITY) {
            velocity.z = HOOK_CONFIG.TERMINAL_VELOCITY;
        }
    }
    
    return velocity;
}

/**
 * 检查是否应该结束钩锁
 * @returns {boolean} 是否应该结束钩锁
 */
function shouldEndGrapple() {
    if (!hookState.player || !hookState.player.IsValid()) return true;
    
    const playerPos = hookState.player.GetAbsOrigin();
    const distanceToTarget = vectorDistance(playerPos, hookState.targetPosition);
    
    // 获取玩家当前队伍编号
    const currentTeamNumber = hookState.player.GetTeamNumber();

    // 结束条件：
    // 1. 玩家非常接近目标点
    // 2. 超过最大飞行时间
    // 3. 玩家死亡或无效
    // 4. 玩家与目标点距离超过最大钩锁距离+缓冲值
    // 5. 玩家队伍编号发生变化
    return distanceToTarget < HOOK_CONFIG.MIN_DISTANCE || 
           hookState.travelTime > HOOK_CONFIG.MAX_TRAVEL_TIME ||
           distanceToTarget > (HOOK_CONFIG.MAX_DISTANCE + HOOK_CONFIG.MAX_DISTANCE_BUFFER) ||
           currentTeamNumber !== hookState.originalTeamNumber;
}

/**
 * 结束钩锁
 * @param {string} playerSuffix - 玩家名称尾缀
 */
function endGrapple(playerSuffix) {
    if (hookState.isActive) {
        // 停止粒子效果 - 使用动态粒子实体名称
        const particleName = "item_ltjd_w_particle_" + playerSuffix;
        Instance.EntFireAtName({ name: particleName, input: "Stop" });

        // 停止喷气粒子
        const steamParticleName = "item_ltjd_w_steam_particle_" + playerSuffix;
        Instance.EntFireAtName({ name: steamParticleName, input: "Stop" });
    }
    
    // 重置状态（但不重置canGrapple，因为这是独立的状态）
    hookState.isActive = false;
    hookState.player = null;
    hookState.startPosition = null;
    hookState.targetPosition = null;
    hookState.hookDirection = null;
    hookState.startTime = 0;
    hookState.travelTime = 0;
    hookState.playerVelocity = { x: 0, y: 0, z: 0 };
    hookState.effectPosition = null;
    hookState.effectReachedTarget = false;
    hookState.playerSuffix = "";
    hookState.originalTeamNumber = 0;
}

/**
 * 重置所有状态到初始值
 */
function resetAllState() {
    // 如果有活跃的钩锁，先结束它
    if (hookState.isActive && hookState.playerSuffix) {
        endGrapple(hookState.playerSuffix);
    }

    // 完全重置所有状态
    hookState.isActive = false;
    hookState.player = null;
    hookState.startPosition = null;
    hookState.targetPosition = null;
    hookState.hookDirection = null;
    hookState.startTime = 0;
    hookState.travelTime = 0;
    hookState.playerVelocity = { x: 0, y: 0, z: 0 };
    hookState.effectPosition = null;
    hookState.effectReachedTarget = false;
    hookState.playerSuffix = "";
    hookState.originalTeamNumber = 0;
    hookState.canGrapple = true; // 重置为允许发射状态
}

/**
 * 从玩家名称中提取尾缀
 * @param {string} playerName - 玩家名称
 * @returns {string|null} 玩家名称尾缀
 */
function getPlayerSuffix(playerName) {
    // 假设玩家名称格式为 "player_ltjd_w_1" 或类似格式
    const parts = playerName.split('_');
    if (parts.length > 0) {
        return parts[parts.length - 1]; // 返回最后一个部分作为尾缀
    }
    return null;
}

// ========== 工具函数 ==========

/**
 * 将角度转换为前向向量
 * @param {Object} angles - 角度对象 {pitch, yaw, roll}
 * @returns {Object} 前向向量
 */
function getForward(angles) {
    const pitchRadians = (angles.pitch * Math.PI) / 180;
    const yawRadians = (angles.yaw * Math.PI) / 180;
    const hScale = Math.cos(pitchRadians);
    return {
        x: Math.cos(yawRadians) * hScale,
        y: Math.sin(yawRadians) * hScale,
        z: -Math.sin(pitchRadians),
    };
}

/**
 * 向量加法
 * @param {Object} vec1 - 向量1
 * @param {Object} vec2 - 向量2
 * @returns {Object} 相加后的向量
 */
function vectorAdd(vec1, vec2) {
    return { 
        x: vec1.x + vec2.x, 
        y: vec1.y + vec2.y, 
        z: vec1.z + vec2.z 
    };
}

/**
 * 向量减法
 * @param {Object} vec1 - 向量1
 * @param {Object} vec2 - 向量2
 * @returns {Object} 相减后的向量
 */
function vectorSubtract(vec1, vec2) {
    return { 
        x: vec1.x - vec2.x, 
        y: vec1.y - vec2.y, 
        z: vec1.z - vec2.z 
    };
}

/**
 * 向量缩放
 * @param {Object} vec - 向量
 * @param {number} scale - 缩放比例
 * @returns {Object} 缩放后的向量
 */
function vectorScale(vec, scale) {
    return { 
        x: vec.x * scale, 
        y: vec.y * scale, 
        z: vec.z * scale 
    };
}

/**
 * 计算向量长度
 * @param {Object} vec - 向量
 * @returns {number} 向量长度
 */
function vectorLength(vec) {
    return Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
}

/**
 * 向量归一化
 * @param {Object} vec - 向量
 * @returns {Object} 归一化后的向量
 */
function normalize(vec) {
    const length = vectorLength(vec);
    if (length === 0) return { x: 0, y: 0, z: 0 };
    return {
        x: vec.x / length,
        y: vec.y / length,
        z: vec.z / length
    };
}

/**
 * 计算两点间距离
 * @param {Object} vec1 - 点1
 * @param {Object} vec2 - 点2
 * @returns {number} 两点间距离
 */
function vectorDistance(vec1, vec2) {
    const dx = vec1.x - vec2.x;
    const dy = vec1.y - vec2.y;
    const dz = vec1.z - vec2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
