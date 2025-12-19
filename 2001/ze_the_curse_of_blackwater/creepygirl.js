// 导入模块
import { Instance } from "cs_script/point_script";

/**
 * 配置参数 - 根据您的需求调整这些值
 */
const CONFIG = {
    BASE_ENTITY_NAME: "creepygirl_ct",     // 实体基础名称
    DETECTION_RADIUS: 2048,                // 检测半径
    SUFFIX: "",                            // 后缀（默认为空，自动从point_script实体提取）
    AUTO_ACTIVATE: true,                   // 脚本加载后自动激活
    ONLY_LIVING_PLAYERS: true,             // 只检测存活的玩家
    ONLY_CT_PLAYERS: true,                 // 仅检测CT方玩家
    MAX_PLAYERS: 64,                       // 最大玩家数量
    COOLDOWN_AFTER_TRIGGER: 0.5,           // 触发后的冷却时间（秒）
    TARGET_CONTEXT_DURATION: 8,            // target上下文持续时间（秒）
    TARGET_EYE_HEIGHT: 70,                 // 目标实体的眼睛高度（单位）
    
    // 玩家实体类名尝试列表
    PLAYER_CLASS_NAMES: [
        "cs_player_pawn",
        "player",
        "cs_player_controller",
        "cs_player"
    ]
};

/**
 * 脚本状态
 */
const state = {
    isActive: CONFIG.AUTO_ACTIVATE,        // 脚本是否激活
    targetEntity: null,                     // 目标实体引用
    lastTriggerTime: 0,                     // 上次触发时间
    triggerCount: 0,                        // 触发次数
    currentSuffix: CONFIG.SUFFIX,           // 当前使用的后缀
    playerClassName: null,                  // 检测到的玩家类名
    currentTargetPlayer: null,              // 当前选中的目标玩家
    targetContextActive: false,             // target上下文是否激活
    contextTimeout: null,                   // 上下文超时计时器
    lastFindTargetTime: 0                   // 上次执行Findtarget的时间
};

/**
 * 提取后缀函数（从point_script实体名称）
 * @param {string} entityName - 实体名称
 * @returns {string} 后缀
 */
function extractSuffix(entityName) {
    if (!entityName) return "";
    const parts = entityName.split('_');
    return parts.length > 1 ? parts[parts.length - 1] : "";
}

/**
 * 获取目标实体名称
 * @returns {string} 完整的目标实体名称
 */
function getTargetEntityName() {
    return state.currentSuffix ? 
           `${CONFIG.BASE_ENTITY_NAME}_${state.currentSuffix}` : 
           CONFIG.BASE_ENTITY_NAME;
}

/**
 * 查找并设置目标实体
 * @returns {boolean} 是否成功找到实体
 */
function findTargetEntity() {
    const targetName = getTargetEntityName();
    
    state.targetEntity = Instance.FindEntityByName(targetName);
    
    if (state.targetEntity && state.targetEntity.IsValid()) {
        return true;
    } else {
        state.targetEntity = null;
        return false;
    }
}

/**
 * 检测玩家实体类名
 * @returns {string|null} 有效的玩家类名
 */
function detectPlayerClassName() {
    if (state.playerClassName) {
        return state.playerClassName;
    }
    
    // 尝试所有可能的玩家类名
    for (const className of CONFIG.PLAYER_CLASS_NAMES) {
        try {
            const players = Instance.FindEntitiesByClass(className);
            if (players && players.length > 0) {
                state.playerClassName = className;
                return className;
            }
        } catch (e) {
            // 如果类名无效，继续尝试下一个
            continue;
        }
    }
    
    // 如果通过类名找不到，尝试通过控制器查找
    let foundPlayers = 0;
    for (let slot = 0; slot < CONFIG.MAX_PLAYERS; slot++) {
        const controller = Instance.GetPlayerController(slot);
        if (controller && controller.IsConnected()) {
            const pawn = controller.GetPlayerPawn();
            if (pawn && pawn.IsValid()) {
                foundPlayers++;
                if (!state.playerClassName) {
                    state.playerClassName = pawn.GetClassName();
                }
            }
        }
    }
    
    if (foundPlayers > 0) {
        return state.playerClassName;
    }
    
    return null;
}

/**
 * 获取所有CT方玩家实体
 * @returns {Array} CT方玩家实体数组
 */
function getAllCTPlayers() {
    const ctPlayers = [];
    
    // 方法1: 通过检测到的类名查找所有玩家，然后筛选CT方
    if (state.playerClassName) {
        const allPlayers = Instance.FindEntitiesByClass(state.playerClassName);
        if (allPlayers && allPlayers.length > 0) {
            for (const player of allPlayers) {
                if (player && player.IsValid() && player.GetTeamNumber() === 3) { // 3 = CT方
                    ctPlayers.push(player);
                }
            }
        }
    }
    
    // 方法2: 通过玩家控制器查找（备用方法）
    if (ctPlayers.length === 0) {
        for (let slot = 0; slot < CONFIG.MAX_PLAYERS; slot++) {
            const controller = Instance.GetPlayerController(slot);
            if (controller && controller.IsConnected()) {
                const pawn = controller.GetPlayerPawn();
                if (pawn && pawn.IsValid() && pawn.GetTeamNumber() === 3) { // 3 = CT方
                    ctPlayers.push(pawn);
                }
            }
        }
    }
    
    return ctPlayers;
}

/**
 * 获取目标实体的视线检测点（解决原点可能在地面的问题）
 * @param {Entity} target - 目标实体
 * @returns {Vector} 调整后的检测点
 */
function getTargetEyePosition(target) {
    if (!target || !target.IsValid()) {
        return { x: 0, y: 0, z: 0 };
    }
    
    const origin = target.GetAbsOrigin();
    
    // 如果目标实体是玩家，使用玩家的眼睛位置
    if (target.GetClassName().includes("player")) {
        return target.GetEyePosition();
    }
    
    // 否则，使用原点加上预设的眼睛高度
    return {
        x: origin.x,
        y: origin.y,
        z: origin.z + CONFIG.TARGET_EYE_HEIGHT
    };
}

/**
 * 获取所有可见的CT方玩家（与目标实体之间没有墙壁阻隔）
 * @returns {Array} 可见的CT方玩家数组
 */
function getVisibleCTPlayers() {
    if (!state.targetEntity || !state.targetEntity.IsValid()) {
        return [];
    }
    
    const visiblePlayers = [];
    const ctPlayers = getAllCTPlayers();
    
    if (ctPlayers.length === 0) {
        return [];
    }
    
    // 获取目标实体的检测点（使用调整后的眼睛高度）
    const targetPos = getTargetEyePosition(state.targetEntity);
    
    // 检查每个CT方玩家
    for (const player of ctPlayers) {
        if (!player || !player.IsValid()) {
            continue;
        }
        
        // 可选：只检查存活玩家
        if (CONFIG.ONLY_LIVING_PLAYERS && !player.IsAlive()) {
            continue;
        }
        
        // 获取玩家眼睛位置（视线起点）
        const playerPos = player.GetEyePosition();
        
        // 计算距离
        const dx = playerPos.x - targetPos.x;
        const dy = playerPos.y - targetPos.y;
        const dz = playerPos.z - targetPos.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // 检查距离是否在范围内
        if (distance <= CONFIG.DETECTION_RADIUS) {
            // 进行射线追踪检查是否有墙壁阻隔
            const traceResult = Instance.TraceLine({
                start: playerPos,
                end: targetPos,
                ignoreEntity: [player, state.targetEntity],
                ignorePlayers: true,
                traceHitboxes: false
            });
            
            // 如果没有命中任何东西（fraction为1），说明没有墙壁阻隔
            if (traceResult.fraction === 1) {
                visiblePlayers.push(player);
            }
        }
    }
    
    return visiblePlayers;
}

/**
 * 从可见玩家中随机选择一个
 * @returns {Entity|null} 随机选中的玩家实体
 */
function selectRandomVisiblePlayer() {
    const visiblePlayers = getVisibleCTPlayers();
    
    if (visiblePlayers.length === 0) {
        return null;
    }
    
    // 随机选择一个玩家
    const randomIndex = Math.floor(Math.random() * visiblePlayers.length);
    return visiblePlayers[randomIndex];
}

/**
 * 为玩家添加target上下文
 * @param {Entity} player - 玩家实体
 */
function addTargetContext(player) {
    if (!player || !player.IsValid()) {
        return;
    }
    
    // 添加addcontext输入
    Instance.EntFireAtTarget({
        target: player,
        input: "addcontext",
        value: "target:1",
        delay: 0
    });
    
    // 设置状态
    state.currentTargetPlayer = player;
    state.targetContextActive = true;
    state.lastFindTargetTime = Instance.GetGameTime();
    
    // 清除现有的超时计时器
    if (state.contextTimeout) {
        clearTimeout(state.contextTimeout);
    }
    
    // 设置8秒后移除context的计时器
    state.contextTimeout = setTimeout(() => {
        removeTargetContext();
    }, CONFIG.TARGET_CONTEXT_DURATION * 1000);
}

/**
 * 移除目标玩家的target上下文
 */
function removeTargetContext() {
    if (!state.currentTargetPlayer || !state.currentTargetPlayer.IsValid()) {
        state.targetContextActive = false;
        state.currentTargetPlayer = null;
        return;
    }
    
    // 添加removecontext输入
    Instance.EntFireAtTarget({
        target: state.currentTargetPlayer,
        input: "removecontext",
        value: "target",
        delay: 0
    });
    
    // 清除状态
    state.targetContextActive = false;
    state.currentTargetPlayer = null;
    state.contextTimeout = null;
}

/**
 * 执行Findtarget功能
 */
function findTarget() {
    // 检查脚本是否激活
    if (!state.isActive) {
        return;
    }
    
    // 检查目标实体有效性
    if (!state.targetEntity || !state.targetEntity.IsValid()) {
        if (!findTargetEntity()) {
            return;
        }
    }
    
    // 如果有当前目标，先移除其上下文
    if (state.targetContextActive && state.currentTargetPlayer && state.currentTargetPlayer.IsValid()) {
        removeTargetContext();
    }
    
    // 从可见玩家中随机选择一个
    const selectedPlayer = selectRandomVisiblePlayer();
    
    if (selectedPlayer) {
        // 为选中的玩家添加target上下文
        addTargetContext(selectedPlayer);
    }
}

/**
 * 检查冷却状态
 * @returns {boolean} 是否在冷却中
 */
function isCooldown() {
    const currentTime = Instance.GetGameTime();
    return (currentTime - state.lastTriggerTime) < CONFIG.COOLDOWN_AFTER_TRIGGER;
}

/**
 * 主检测函数 - 手动触发版本，仅检测CT方玩家
 */
function checkLineOfSight() {
    // 检查脚本是否激活
    if (!state.isActive) {
        return;
    }
    
    // 检查目标实体有效性
    if (!state.targetEntity || !state.targetEntity.IsValid()) {
        if (!findTargetEntity()) {
            return;
        }
    }
    
    // 检查冷却状态
    if (isCooldown()) {
        return;
    }
    
    // 获取所有CT方玩家
    const ctPlayers = getAllCTPlayers();
    
    if (ctPlayers.length === 0) {
        return;
    }
    
    // 获取目标实体的检测点
    const targetPos = getTargetEyePosition(state.targetEntity);
    
    // 检查每个CT方玩家
    for (const player of ctPlayers) {
        if (!player || !player.IsValid()) {
            continue;
        }
        
        // 可选：只检查存活玩家
        if (CONFIG.ONLY_LIVING_PLAYERS && !player.IsAlive()) {
            continue;
        }
        
        // 获取玩家眼睛位置（视线起点）
        const playerPos = player.GetEyePosition();
        
        // 计算距离
        const dx = playerPos.x - targetPos.x;
        const dy = playerPos.y - targetPos.y;
        const dz = playerPos.z - targetPos.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // 检查距离是否在范围内
        if (distance <= CONFIG.DETECTION_RADIUS) {
            // 进行射线追踪检查是否有墙壁阻隔
            const traceResult = Instance.TraceLine({
                start: playerPos,
                end: targetPos,
                ignoreEntity: [player, state.targetEntity],
                ignorePlayers: true,
                traceHitboxes: false
            });
            
            // 如果没有命中任何东西（fraction为1），说明没有墙壁阻隔
            if (traceResult.fraction === 1) {
                // 触发 FireUser1 输入
                Instance.EntFireAtTarget({
                    target: state.targetEntity,
                    input: "FireUser1",
                    activator: player,
                    caller: player
                });
                
                // 更新状态
                state.lastTriggerTime = Instance.GetGameTime();
                state.triggerCount++;
                
                break; // 触发一次后跳出循环
            }
        }
    }
}

/**
 * 激活脚本
 */
function activateScript() {
    if (state.isActive) {
        return;
    }
    
    // 查找目标实体
    if (findTargetEntity()) {
        state.isActive = true;
        
        // 检测玩家类名
        detectPlayerClassName();
    } else {
        state.isActive = false;
    }
}

/**
 * 停用脚本
 */
function deactivateScript() {
    if (!state.isActive) {
        return;
    }
    
    state.isActive = false;
    
    // 如果target上下文处于激活状态，移除它
    if (state.targetContextActive && state.currentTargetPlayer && state.currentTargetPlayer.IsValid()) {
        removeTargetContext();
    }
    
    // 清除超时计时器
    if (state.contextTimeout) {
        clearTimeout(state.contextTimeout);
        state.contextTimeout = null;
    }
}

/**
 * 重置脚本状态
 */
function resetScript() {
    state.triggerCount = 0;
    state.lastTriggerTime = 0;
    
    // 重置target相关状态
    if (state.targetContextActive) {
        removeTargetContext();
    }
    
    if (state.contextTimeout) {
        clearTimeout(state.contextTimeout);
        state.contextTimeout = null;
    }
}

// ========== 输入事件处理 ==========

/**
 * 激活脚本输入
 */
Instance.OnScriptInput("Activate", (inputData) => {
    // 尝试从调用者获取后缀
    if (inputData.caller && inputData.caller.IsValid()) {
        const callerName = inputData.caller.GetEntityName();
        const extractedSuffix = extractSuffix(callerName);
        
        if (extractedSuffix && extractedSuffix !== state.currentSuffix) {
            state.currentSuffix = extractedSuffix;
        }
    }
    
    activateScript();
});

/**
 * 停用脚本输入
 */
Instance.OnScriptInput("Deactivate", () => {
    deactivateScript();
});

/**
 * 设置后缀输入
 */
Instance.OnScriptInput("SetSuffix", (inputData) => {
    if (inputData.value && typeof inputData.value === 'string') {
        state.currentSuffix = inputData.value;
        
        // 重新查找目标实体
        if (state.isActive) {
            findTargetEntity();
        }
    }
});

/**
 * 获取脚本信息
 */
Instance.OnScriptInput("GetInfo", () => {
    Instance.Msg("=== 脚本状态信息 ===");
    Instance.Msg(`激活状态: ${state.isActive ? "是" : "否"}`);
    Instance.Msg(`目标实体: ${state.targetEntity ? "已找到" : "未找到"}`);
    Instance.Msg(`后缀: ${state.currentSuffix || "无"}`);
    Instance.Msg(`触发次数: ${state.triggerCount}`);
    Instance.Msg(`检测半径: ${CONFIG.DETECTION_RADIUS}`);
    Instance.Msg(`玩家类名: ${state.playerClassName || "未检测"}`);
    
    // 显示当前CT方玩家数量
    const ctPlayers = getAllCTPlayers();
    Instance.Msg(`当前CT方玩家数量: ${ctPlayers.length}`);
    
    // 显示当前可见玩家数量
    const visiblePlayers = getVisibleCTPlayers();
    Instance.Msg(`可见CT玩家数量: ${visiblePlayers.length}`);
    
    // 显示target上下文状态
    Instance.Msg(`Target上下文状态: ${state.targetContextActive ? "激活" : "未激活"}`);
    if (state.targetContextActive && state.currentTargetPlayer && state.currentTargetPlayer.IsValid()) {
        const controller = state.currentTargetPlayer.GetPlayerController();
        const playerName = controller ? controller.GetPlayerName() : "未知玩家";
        const timeLeft = CONFIG.TARGET_CONTEXT_DURATION - (Instance.GetGameTime() - state.lastFindTargetTime);
        Instance.Msg(`当前目标玩家: ${playerName}`);
        Instance.Msg(`剩余时间: ${Math.max(0, timeLeft.toFixed(1))} 秒`);
    }
    
    Instance.Msg("=====================");
});

/**
 * 手动触发检测（用于调试）
 */
Instance.OnScriptInput("CheckNow", () => {
    checkLineOfSight();
});

/**
 * 执行Findtarget功能
 */
Instance.OnScriptInput("Findtarget", () => {
    findTarget();
});

/**
 * 检测玩家类名（用于调试）
 */
Instance.OnScriptInput("DetectPlayers", () => {
    detectPlayerClassName();
});

/**
 * 手动触发FireUser1（用于测试）
 */
Instance.OnScriptInput("TestFire", () => {
    if (!state.targetEntity || !state.targetEntity.IsValid()) {
        return;
    }
    
    Instance.EntFireAtTarget({
        target: state.targetEntity,
        input: "FireUser1",
        delay: 0
    });
});

/**
 * 手动移除target上下文（用于测试）
 */
Instance.OnScriptInput("RemoveTarget", () => {
    if (state.targetContextActive && state.currentTargetPlayer) {
        removeTargetContext();
    }
});

// ========== 其他事件 ==========

/**
 * 脚本激活时（自动运行）
 */
Instance.OnActivate(() => {
    // 如果配置为自动激活
    if (CONFIG.AUTO_ACTIVATE) {
        Instance.SetNextThink(Instance.GetGameTime() + 2);
        Instance.SetThink(() => {
            activateScript();
        });
    }
});

/**
 * 玩家断开连接事件
 */
Instance.OnPlayerDisconnect((event) => {
    // 如果断开连接的玩家是当前的目标玩家
    if (state.targetContextActive && state.currentTargetPlayer && state.currentTargetPlayer.IsValid()) {
        const controller = state.currentTargetPlayer.GetPlayerController();
        if (controller && controller.GetPlayerSlot() === event.playerSlot) {
            removeTargetContext();
        }
    }
});

/**
 * 脚本重载处理
 */
Instance.OnScriptReload({
    before: () => {
        return {
            wasActive: state.isActive,
            previousSuffix: state.currentSuffix,
            triggerCount: state.triggerCount,
            targetName: state.targetEntity ? getTargetEntityName() : "",
            playerClassName: state.playerClassName,
            targetContextActive: state.targetContextActive,
            currentTargetPlayer: state.currentTargetPlayer,
            lastFindTargetTime: state.lastFindTargetTime
        };
    },
    after: (memory) => {
        // 恢复状态
        state.currentSuffix = memory.previousSuffix || CONFIG.SUFFIX;
        state.triggerCount = memory.triggerCount || 0;
        state.playerClassName = memory.playerClassName || null;
        state.targetContextActive = memory.targetContextActive || false;
        state.lastFindTargetTime = memory.lastFindTargetTime || 0;
        
        // 注意：不能直接恢复实体引用，需要重新查找
        state.currentTargetPlayer = null;
        
        // 如果之前是激活状态，重新激活
        if (memory.wasActive) {
            Instance.SetNextThink(Instance.GetGameTime() + 1);
            Instance.SetThink(() => {
                activateScript();
            });
        }
        
        // 如果之前有激活的target上下文，重新计算剩余时间
        if (memory.targetContextActive && memory.lastFindTargetTime > 0) {
            const elapsedTime = Instance.GetGameTime() - memory.lastFindTargetTime;
            const remainingTime = CONFIG.TARGET_CONTEXT_DURATION - elapsedTime;
            
            if (remainingTime > 0) {
                // 注意：由于无法恢复玩家实体引用，这里只能清除状态
                state.targetContextActive = false;
            }
        }
    }
});

// 立即尝试查找目标实体和检测玩家类名
Instance.SetNextThink(Instance.GetGameTime() + 1);
Instance.SetThink(() => {
    if (!state.targetEntity) {
        findTargetEntity();
    }
    
    if (!state.playerClassName) {
        detectPlayerClassName();
    }
    
    // 只执行一次
});