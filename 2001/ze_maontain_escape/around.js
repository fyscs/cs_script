import { Instance } from "cs_script/point_script";

// 存储玩家转圈状态的对象
const spinningPlayers = new Map();

// 监听RunScriptInput输入，值为"start"时开始转圈
Instance.OnScriptInput("start", (inputData) => {
    const { caller, activator } = inputData;
    
    Instance.Msg(`收到start输入，caller: ${caller?.GetEntityName()}, activator: ${activator?.GetEntityName()}`);
    
    // 尝试从不同来源获取玩家
    let targetPlayer = null;
    
    // 首先检查activator是否是玩家
    if (activator && activator.IsValid()) {
        const className = activator.GetClassName();
        if (className.includes("player") || className.includes("Player")) {
            targetPlayer = activator;
        }
    }
    
    // 如果没有通过activator找到玩家，尝试通过caller获取
    if (!targetPlayer && caller && caller.IsValid()) {
        // 检查caller是否是玩家控制器
        const className = caller.GetClassName();
        if (className.includes("player_controller") || className.includes("PlayerController")) {
            targetPlayer = caller.GetPlayerPawn();
        }
    }
    
    // 如果还没有找到玩家，尝试查找所有玩家并选择第一个（作为示例）
    if (!targetPlayer) {
        Instance.Msg("无法直接获取玩家，尝试查找所有玩家");
        const allPlayers = Instance.FindEntitiesByClass("cs_player_pawn");
        if (allPlayers.length > 0) {
            targetPlayer = allPlayers[0];
            Instance.Msg(`选择了玩家: ${targetPlayer.GetEntityName()}`);
        }
    }
    
    // 确保找到了玩家
    if (!targetPlayer || !targetPlayer.IsValid()) {
        Instance.Msg("无法找到有效的玩家实体");
        return;
    }
    
    // 获取玩家控制器来识别玩家槽位
    const controller = targetPlayer.GetOriginalPlayerController();
    if (!controller || !controller.IsValid()) {
        Instance.Msg("无法获取玩家控制器");
        return;
    }
    
    const playerSlot = controller.GetPlayerSlot();
    const playerName = controller.GetPlayerName();
    
    Instance.Msg(`玩家 ${playerName} (槽位: ${playerSlot}) 开始转圈`);
    
    // 如果玩家已经在转圈，则停止之前的转圈
    if (spinningPlayers.has(playerSlot)) {
        Instance.Msg(`玩家 ${playerSlot} 已经在转圈中，重新开始`);
        stopSpinning(playerSlot);
    }
    
    // 存储玩家转圈状态
    spinningPlayers.set(playerSlot, {
        player: targetPlayer,
        startTime: Instance.GetGameTime(),
        currentYaw: 0, // 从0度开始
        lastUpdateTime: Instance.GetGameTime()
    });
    
    // 在调试屏幕上显示转圈开始信息
    Instance.DebugScreenText({
        text: `玩家 ${playerName} 开始转圈!`,
        x: 0.5,
        y: 0.3,
        duration: 2.0,
        color: { r: 0, g: 255, b: 0, a: 255 }
    });
});

// 停止玩家转圈的函数
function stopSpinning(playerSlot) {
    const playerData = spinningPlayers.get(playerSlot);
    if (playerData) {
        const controller = playerData.player.GetOriginalPlayerController();
        if (controller && controller.IsValid()) {
            Instance.Msg(`停止玩家 ${controller.GetPlayerName()} 的转圈`);
        }
        spinningPlayers.delete(playerSlot);
    }
}

// 更新玩家角度的函数
function updatePlayerRotation(playerSlot) {
    const playerData = spinningPlayers.get(playerSlot);
    if (!playerData) {
        return false;
    }
    
    const { player, startTime, currentYaw, lastUpdateTime } = playerData;
    
    // 检查玩家是否有效
    if (!player.IsValid()) {
        stopSpinning(playerSlot);
        return false;
    }
    
    // 检查是否已经转圈超过3秒
    const currentTime = Instance.GetGameTime();
    if (currentTime - startTime >= 3.0) {
        const controller = player.GetOriginalPlayerController();
        if (controller && controller.IsValid()) {
            Instance.Msg(`玩家 ${controller.GetPlayerName()} 转圈结束`);
            
            // 在调试屏幕上显示转圈结束信息
            Instance.DebugScreenText({
                text: `玩家 ${controller.GetPlayerName()} 转圈结束!`,
                x: 0.5,
                y: 0.3,
                duration: 2.0,
                color: { r: 255, g: 0, b: 0, a: 255 }
            });
        }
        stopSpinning(playerSlot);
        return false;
    }
    
    // 计算自上次更新以来的时间差
    const deltaTime = currentTime - lastUpdateTime;
    
    // 计算本次更新应该旋转的角度
    // 我们目标是每秒旋转180度（3秒转540度），每次更新根据时间差计算
    const rotationSpeed = 180; // 度/秒
    const angleIncrement = rotationSpeed * deltaTime;
    
    // 更新当前角度
    playerData.currentYaw += angleIncrement;
    
    // 确保角度在0-360范围内
    while (playerData.currentYaw >= 360) {
        playerData.currentYaw -= 360;
    }
    
    // 获取玩家当前位置和速度，只改变角度
    const currentPosition = player.GetAbsOrigin();
    const currentVelocity = player.GetAbsVelocity();
    
    // 设置玩家角度（只改变yaw，保持pitch和roll为0）
    player.Teleport({
        position: currentPosition,
        angles: {
            pitch: 0,
            yaw: playerData.currentYaw,
            roll: 0
        },
        velocity: currentVelocity
    });
    
    // 更新最后更新时间
    playerData.lastUpdateTime = currentTime;
    
    // 保存更新后的数据
    spinningPlayers.set(playerSlot, playerData);
    
    return true;
}

// 使用SetThink回调来处理转圈逻辑
let isThinkActive = false;

function updateSpinningPlayers() {
    // 如果没有玩家在转圈，停止思考循环
    if (spinningPlayers.size === 0) {
        isThinkActive = false;
        return;
    }
    
    // 遍历所有转圈中的玩家
    const playerSlots = Array.from(spinningPlayers.keys());
    let hasActivePlayers = false;
    
    for (const playerSlot of playerSlots) {
        if (updatePlayerRotation(playerSlot)) {
            hasActivePlayers = true;
        }
    }
    
    // 如果还有玩家在转圈，设置下一次Think
    if (hasActivePlayers) {
        Instance.SetNextThink(Instance.GetGameTime() + 0.1); // 每0.1秒更新一次（每秒10次）
    } else {
        isThinkActive = false;
    }
}

// 设置Think回调
Instance.SetThink(() => {
    updateSpinningPlayers();
});

// 监听玩家断开连接事件，清理转圈状态
Instance.OnPlayerDisconnect((event) => {
    const { playerSlot } = event;
    if (spinningPlayers.has(playerSlot)) {
        Instance.Msg(`玩家 ${playerSlot} 断开连接，清理转圈状态`);
        spinningPlayers.delete(playerSlot);
    }
});

// 监听玩家死亡事件，清理转圈状态
Instance.OnPlayerKill((event) => {
    const { player } = event;
    const controller = player.GetOriginalPlayerController();
    
    if (controller && controller.IsValid()) {
        const playerSlot = controller.GetPlayerSlot();
        if (spinningPlayers.has(playerSlot)) {
            Instance.Msg(`玩家 ${controller.GetPlayerName()} 死亡，清理转圈状态`);
            spinningPlayers.delete(playerSlot);
        }
    }
});

// 监听回合结束事件，清理所有转圈状态
Instance.OnRoundEnd(() => {
    Instance.Msg("回合结束，清理所有转圈状态");
    spinningPlayers.clear();
});

// 可选：添加一个停止转圈的输入监听
Instance.OnScriptInput("stop", (inputData) => {
    // 尝试获取玩家槽位并停止转圈
    const { activator, caller } = inputData;
    
    let targetPlayer = null;
    
    if (activator && activator.IsValid()) {
        const className = activator.GetClassName();
        if (className.includes("player") || className.includes("Player")) {
            targetPlayer = activator;
        }
    }
    
    if (!targetPlayer && caller && caller.IsValid()) {
        const className = caller.GetClassName();
        if (className.includes("player_controller") || className.includes("PlayerController")) {
            targetPlayer = caller.GetPlayerPawn();
        }
    }
    
    if (targetPlayer && targetPlayer.IsValid()) {
        const controller = targetPlayer.GetOriginalPlayerController();
        if (controller && controller.IsValid()) {
            const playerSlot = controller.GetPlayerSlot();
            if (spinningPlayers.has(playerSlot)) {
                Instance.Msg(`玩家 ${controller.GetPlayerName()} 手动停止转圈`);
                stopSpinning(playerSlot);
            }
        }
    } else {
        // 如果没有指定玩家，停止所有玩家的转圈
        Instance.Msg("停止所有玩家的转圈");
        spinningPlayers.clear();
    }
});

// 监听玩家连接事件，用于测试
Instance.OnPlayerConnect((event) => {
    const { player } = event;
    Instance.Msg(`玩家 ${player.GetPlayerName()} 已连接`);
});

// 监听玩家激活事件，用于测试
Instance.OnPlayerActivate((event) => {
    const { player } = event;
    const playerPawn = player.GetPlayerPawn();
    if (playerPawn && playerPawn.IsValid()) {
        Instance.Msg(`玩家 ${player.GetPlayerName()} 已激活，实体: ${playerPawn.GetEntityName()}`);
    }
});

Instance.Msg("改进版转圈脚本已加载");