import { Instance } from "cs_script/point_script";

/**
 * 卡丁车控制脚本
 * 此脚本由皮皮猫233编写
 * 如需使用请与我联系
 * 2025/10/18
 */

/**
 * 按键状态
 */
const keyState = {
    isForwardPressed: false,
    isLeftPressed: false,
    isBackwardPressed: false,
    isRightPressed: false,
    isSpeedPressed: false
};

/**
 * 卡丁车状态
 */
const kartState = {
    start: false,
    player: null,
    suffix: "",
    currentTurnSpeed: 0,
    isActive: false,
    isDrift: false,
    turnDirection: 0,                // 0: 停止, -1: 右转, 1: 左转
    lastAppliedForce: 0,             // 记录上一次设置的力度
    boostPower1: 0,                  // 第一管能量值
    boostPower2: 0,                  // 第二管能量值
    displayBoostPower1: 0,           // 第一管显示能量值（用于动画）
    displayBoostPower2: 0,           // 第二管显示能量值（用于动画）
    currentTankToFill: 1,            // 当前应该充能的气管 (1或2)
    lastDisplay1: "",                // 上一次第一管能量显示内容
    lastDisplay2: "",                // 上一次第二管能量显示内容
    isAnimatingBoost1: false,        // 是否正在播放第一管能量下降动画
    isAnimatingBoost2: false         // 是否正在播放第二管能量下降动画
}

const kartConfig = {
    forwardForce: 250,               // 前进力度
    backwardForce: -150,             // 后退力度
    driftForce: 150,                 // 漂移力度
    turnAcceleration: 0.05,          // 转向加速度
    maxBoostPower: 50,               // 能量最大值
    boostForce: 800,                 // 冲刺力度
    boostAnimationSpeed: 5           // 能量下降动画速度
};

// 输入事件处理
Instance.OnScriptInput("Activate", (inputData) => {
    kartState.isActive = true;
    kartState.player = inputData.activator;
    const kartUi = inputData.caller;
    
    if (kartUi && kartUi.IsValid()) {
        kartState.suffix = extractSuffix(kartUi.GetEntityName());
    }
});

Instance.OnScriptInput("Deactivate", (inputData) => {
    kartState.isActive = false;
    
    // 重置所有状态
    applyForce(0);
    setTurnDirection(0);
    
    // 重置所有按键状态
    keyState.isForwardPressed = false;
    keyState.isLeftPressed = false;
    keyState.isBackwardPressed = false;
    keyState.isRightPressed = false;
    keyState.isSpeedPressed = false;
    
    // 重置卡丁车状态
    kartState.player = null;
    kartState.currentTurnSpeed = 0;
    kartState.isDrift = false;
    kartState.turnDirection = 0;
    kartState.lastAppliedForce = 0;
    kartState.boostPower1 = 0;
    kartState.boostPower2 = 0;
    kartState.displayBoostPower1 = 0;
    kartState.displayBoostPower2 = 0;
    kartState.currentTankToFill = 1;
    kartState.lastDisplay1 = "";
    kartState.lastDisplay2 = "";
    kartState.isAnimatingBoost1 = false;
    kartState.isAnimatingBoost2 = false;
    
    // 重置转向速度
    Instance.EntFireAtName({ name: "kart_rota_" + kartState.suffix, input: "SetSpeed", value: 0 });
    
    // 重置能量显示
    updateBoostDisplay();
});

Instance.OnScriptInput("Start", (inputData) => {
    keyState.start = true;
});

Instance.OnScriptInput("PressedForward", (inputData) => {
    keyState.isForwardPressed = true;
    updateKartState();
});

Instance.OnScriptInput("PressedMoveLeft", (inputData) => {
    keyState.isLeftPressed = true;
    updateKartState();
});

Instance.OnScriptInput("PressedBack", (inputData) => {
    keyState.isBackwardPressed = true;
    updateKartState();
});

Instance.OnScriptInput("PressedMoveRight", (inputData) => {
    keyState.isRightPressed = true;
    updateKartState();
});

Instance.OnScriptInput("PressedSpeed", (inputData) => {
    if (keyState.start) {
        keyState.isSpeedPressed = true;
        updateKartState();
    }
});

Instance.OnScriptInput("PressedDuck", (inputData) => {
    triggerBoost();
});

Instance.OnScriptInput("PressedAttack2", (inputData) => {
    if (kartState.player && kartState.player.IsValid()) {
        Instance.EntFireAtTarget({ target: kartState.player, input: "ClearParent" });
        Instance.EntFireAtName({ name: "kart_ptp_" + kartState.suffix, input: "TeleportToCurrentPos", activator: kartState.player });
        Instance.EntFireAtTarget({ target: kartState.player, input: "SetParent", value: "kart_rota_" + kartState.suffix });
    }
});

Instance.OnScriptInput("UnpressedForward", (inputData) => {
    keyState.isForwardPressed = false;
    updateKartState();
});

Instance.OnScriptInput("UnpressedMoveLeft", (inputData) => {
    keyState.isLeftPressed = false;
    updateKartState();
});

Instance.OnScriptInput("UnpressedBack", (inputData) => {
    keyState.isBackwardPressed = false;
    updateKartState();
});

Instance.OnScriptInput("UnpressedMoveRight", (inputData) => {
    keyState.isRightPressed = false;
    updateKartState();
});

Instance.OnScriptInput("UnpressedSpeed", (inputData) => {
    keyState.isSpeedPressed = false;
    updateKartState();
});

// 主要功能函数
Instance.SetThink(() => {
    let newTurnSpeed = 0;
    
    // 判断是否处于漂移状态
    const maxTurnSpeed = kartState.isDrift ? 1 : 0.8;
    
    // 判断转向方向
    if (kartState.turnDirection === 1) {
        newTurnSpeed = Math.min((kartState.currentTurnSpeed + kartConfig.turnAcceleration), maxTurnSpeed);
    } else if (kartState.turnDirection === -1) {
        newTurnSpeed = Math.max((kartState.currentTurnSpeed - kartConfig.turnAcceleration), -maxTurnSpeed);
    } else {
        if (kartState.currentTurnSpeed > 0) {
            newTurnSpeed = Math.max(kartState.currentTurnSpeed - kartConfig.turnAcceleration, 0);
        } else if (kartState.currentTurnSpeed < 0) {
            newTurnSpeed = Math.min(kartState.currentTurnSpeed + kartConfig.turnAcceleration, 0);
        }
    }
    
    // 只有当转向速度发生变化时才设置
    if (newTurnSpeed !== kartState.currentTurnSpeed) {
        Instance.EntFireAtName({ name: "kart_rota_" + kartState.suffix, input: "SetSpeed", value: newTurnSpeed });
        kartState.currentTurnSpeed = newTurnSpeed;
    }
    
    // 处理漂移能量积累
    if (kartState.isDrift) {
        // 根据当前应该充能的气管进行充能
        if (kartState.currentTankToFill === 1 && kartState.boostPower1 < kartConfig.maxBoostPower) {
            // 充能第一管
            kartState.boostPower1 = Math.min(kartState.boostPower1 + 1, kartConfig.maxBoostPower);
            kartState.displayBoostPower1 = kartState.boostPower1; // 同步显示能量值
            
            // 如果第一管充满，切换到第二管
            if (kartState.boostPower1 >= kartConfig.maxBoostPower && kartState.boostPower2 < kartConfig.maxBoostPower) {
                kartState.currentTankToFill = 2;
            }
        } else if (kartState.currentTankToFill === 2 && kartState.boostPower2 < kartConfig.maxBoostPower) {
            // 充能第二管
            kartState.boostPower2 = Math.min(kartState.boostPower2 + 1, kartConfig.maxBoostPower);
            kartState.displayBoostPower2 = kartState.boostPower2; // 同步显示能量值
            
            // 如果第二管充满，切换到第一管
            if (kartState.boostPower2 >= kartConfig.maxBoostPower) {
                kartState.currentTankToFill = 1;
            }
        }
    }
    
    // 处理能量下降动画
    if (kartState.isAnimatingBoost1 && kartState.displayBoostPower1 > kartState.boostPower1) {
        kartState.displayBoostPower1 = Math.max(kartState.displayBoostPower1 - kartConfig.boostAnimationSpeed, kartState.boostPower1);
        if (kartState.displayBoostPower1 <= kartState.boostPower1) {
            kartState.isAnimatingBoost1 = false;
        }
    }
    
    if (kartState.isAnimatingBoost2 && kartState.displayBoostPower2 > kartState.boostPower2) {
        kartState.displayBoostPower2 = Math.max(kartState.displayBoostPower2 - kartConfig.boostAnimationSpeed, kartState.boostPower2);
        if (kartState.displayBoostPower2 <= kartState.boostPower2) {
            kartState.isAnimatingBoost2 = false;
        }
    }
    
    // 更新能量显示
    updateBoostDisplay();
    
    // 只要有能量动画在播放，或者转向速度不为0，就继续循环
    const shouldContinue = 
        kartState.isAnimatingBoost1 || 
        kartState.isAnimatingBoost2 || 
        newTurnSpeed !== 0;
    
    if (!shouldContinue)
        return;
    Instance.SetNextThink(Instance.GetGameTime());
});

// 状态判断
function updateKartState() {
    if (!kartState.isActive) {
        return;
    }

    const { isForwardPressed, isLeftPressed, isBackwardPressed, isRightPressed, isSpeedPressed } = keyState;
    
    // 检查是否需要重置漂移状态
    if (kartState.isDrift && !(isForwardPressed && !isBackwardPressed && isSpeedPressed)) {
        kartState.isDrift = false;
        Instance.EntFireAtName({ name: "kart_drift_particle_" + kartState.suffix, input: "Stop" });
    }

    // 前进条件 W&!S
    if (isForwardPressed && !isBackwardPressed) {
        // 漂移检查 (前进状态下按Shift)
        if (isSpeedPressed) {
            kartState.isDrift = true;
            Instance.EntFireAtName({ name: "kart_drift_particle_" + kartState.suffix, input: "Start" });
            Instance.EntFireAtName({ name: "kart_drift_sound_" + kartState.suffix, input: "StartSound" });
            applyForce(kartConfig.driftForce);
        } else {
            applyForce(kartConfig.forwardForce);
        }
        
        // 前进+左转 A&!D
        if (isLeftPressed && !isRightPressed) {
            setTurnDirection(1);
        }
        // 前进+右转 !A&D
        else if (!isLeftPressed && isRightPressed) {
            setTurnDirection(-1);
        }
        // 单纯前进 (!A&!D) 或 (A&D)
        else if ((!isLeftPressed && !isRightPressed) || (isLeftPressed && isRightPressed)) {
            setTurnDirection(0);
        }
        // 其他情况停止
        else {
            applyForce(0);
            setTurnDirection(0);
        }
    }
    // 后退条件 !W&S
    else if (!isForwardPressed && isBackwardPressed) {
        applyForce(kartConfig.backwardForce);
        
        // 后退+右转 A&!D
        if (isLeftPressed && !isRightPressed) {
            setTurnDirection(-1);
        }
        // 后退+左转 !A&D
        else if (!isLeftPressed && isRightPressed) {
            setTurnDirection(1);
        }
        // 单纯后退 (!A&!D) 或 (A&D)
        else if ((!isLeftPressed && !isRightPressed) || (isLeftPressed && isRightPressed)) {
            setTurnDirection(0);
        }
        // 其他情况停止
        else {
            applyForce(0);
            setTurnDirection(0);
        }
    }
    // 单纯左转 !W&!S&A&!D
    else if (!isForwardPressed && !isBackwardPressed && isLeftPressed && !isRightPressed) {
        applyForce(0);
        setTurnDirection(1);
    }
    // 单纯右转 !W&!S&!A&D
    else if (!isForwardPressed && !isBackwardPressed && !isLeftPressed && isRightPressed) {
        applyForce(0);
        setTurnDirection(-1);
    }
    // 其他情况全部停止
    else {
        applyForce(0);
        setTurnDirection(0);
    }
    
    Instance.SetNextThink(Instance.GetGameTime());
}

// 辅助功能函数
function applyForce(force) {
    if (force !== kartState.lastAppliedForce) {
        Instance.EntFireAtName({ name: "kart_push_" + kartState.suffix, input: "SetPushSpeed", value: force });
        kartState.lastAppliedForce = force;
    }
}

function setTurnDirection(direction) {
    kartState.turnDirection = direction;
}

// 加速检查
function triggerBoost() {
    // 检查是否有满的能量管
    if (kartState.boostPower1 >= kartConfig.maxBoostPower) {
        kartState.boostPower1 = 0;
        kartState.isAnimatingBoost1 = true; // 开始能量下降动画
        
        // 如果第一管被使用，检查是否需要切换充能目标
        if (kartState.currentTankToFill === 1 && kartState.boostPower2 < kartConfig.maxBoostPower) {
            kartState.currentTankToFill = 2;
        }
        applyBoost();
    } else if (kartState.boostPower2 >= kartConfig.maxBoostPower) {
        kartState.boostPower2 = 0;
        kartState.isAnimatingBoost2 = true; // 开始能量下降动画
        
        // 如果第二管被使用，检查是否需要切换充能目标
        if (kartState.currentTankToFill === 2 && kartState.boostPower1 < kartConfig.maxBoostPower) {
            kartState.currentTankToFill = 1;
        }
        applyBoost();
    }
    
    // 更新能量显示
    updateBoostDisplay();
    
    // 确保能量动画能继续播放
    Instance.SetNextThink(Instance.GetGameTime());
}

function applyBoost() {
    const kartPhy = Instance.FindEntityByName("kart_phy_" + kartState.suffix);
    if (!kartPhy || !kartPhy.IsValid())
        return;
    const kartRota = Instance.FindEntityByName("kart_rota_" + kartState.suffix);
    if (!kartRota || !kartRota.IsValid())
        return;

    Instance.EntFireAtName({ name: "kart_boost_sound_" + kartState.suffix, input: "StartSound" });
    Instance.EntFireAtName({ name: "kart_boost_particle_" + kartState.suffix, input: "Start" });
    Instance.EntFireAtName({ name: "kart_boost_particle_" + kartState.suffix, input: "Stop", delay: 1 });
    Instance.EntFireAtName({ name: "kart_model_" + kartState.suffix, input: "SetAnimationNoResetNotLooping", value: "changea" });
    Instance.EntFireAtName({ name: "kart_model_" + kartState.suffix, input: "SetAnimationLooping", value: "booster_idle", delay: 0.67 });
    Instance.EntFireAtName({ name: "kart_model_" + kartState.suffix, input: "SetAnimationNotLooping", value: "changeb", delay: 1 });
    Instance.EntFireAtName({ name: "kart_model_" + kartState.suffix, input: "SetAnimationLooping", value: "move", delay: 1.67 });

    kartPhy.Teleport({ velocity: vectorAdd(kartPhy.GetAbsVelocity(), vectorScale(getForward(kartRota.GetAbsAngles()), kartConfig.boostForce)) });
}

// 更新能量显示
function updateBoostDisplay() {
    const maxPower = kartConfig.maxBoostPower;
    const maxBars = 10; // 总共10格显示
    
    // 计算第一管能量显示（使用显示能量值）
    const bars1 = Math.floor((kartState.displayBoostPower1 / maxPower) * maxBars);
    const display1 = "■".repeat(bars1) + "□".repeat(maxBars - bars1);
    
    // 计算第二管能量显示（使用显示能量值）
    const bars2 = Math.floor((kartState.displayBoostPower2 / maxPower) * maxBars);
    const display2 = "■".repeat(bars2) + "□".repeat(maxBars - bars2);
    
    // 只有当显示内容发生变化时才更新
    if (display1 !== kartState.lastDisplay1) {
        Instance.EntFireAtName({ name: "kart_boost_text1_" + kartState.suffix, input: "SetMessage", value: display1 });
        kartState.lastDisplay1 = display1;
    }
    
    if (display2 !== kartState.lastDisplay2) {
        Instance.EntFireAtName({ name: "kart_boost_text2_" + kartState.suffix, input: "SetMessage", value: display2 });
        kartState.lastDisplay2 = display2;
    }
}

// 提取尾缀
function extractSuffix(entityName) {
    const parts = entityName.split('_');
    if (parts.length > 0) {
        return parts[parts.length - 1];
    }
    return "";
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