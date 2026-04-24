import { Instance } from "cs_script/point_script";

/**
 * 钩锁拉扯系统：
 * 1. 玩家1按下按钮，MAX_DISTANCE距离内视线捕获不同阵营玩家2
 * 2. 玩家1在XY平面静止不动（Z轴保留，可自由落体）
 * 3. 玩家2无法自由移动，受到XY平面朝向玩家1的恒定吸力
 * 4. 断开条件：玩家1受伤害累计超过MAX_DAMAGE_LIMIT，或两人距离超过MAX_DISTANCE，或任意一方死亡
 */

const CONFIG2 = {
    MAX_DISTANCE: 500,        // 触发和维持的最大距离
    PULL_SPEED: 100,          // 玩家2在XY平面受到的吸力速度
    MAX_DAMAGE_LIMIT: 1000,     // 玩家1断开连接的最大承受伤害
    HUDHINT_PLAYER1: "item_hook_player1_hud_2", // 玩家1hudhint实体
    HUDHINT_PLAYER2: "item_hook_player2_hud_2", // 玩家2hudhint实体
    ROPE_START: "item_hook_particle_2",
    ROPE_END: "item_hook_target_2",
    BUTTON_NAME: "item_hook_button_2",
    SOUND: "item_hook_sound_2"
};

// 系统状态管理
let hookState2 = {
    isActive: false,          // 是否处于激活状态
    player1: null,            // 施放者 (P1)
    player2: null,            // 被吸附者 (P2)
    p1DamageTaken: 0          // P1累计承受伤害
};

/**
 * 监听玩家输入触发钩子 (在 Hammer 中触发 "start_hook" input)
 */
Instance.OnScriptInput("start_hook", (inputData) => {
    let p1 = inputData.activator;
    
    // 校验触发者必须是有效玩家，且当前未在使用钩子
    if (!p1 || !p1.IsValid() || p1.GetClassName() !== "player" || hookState2.isActive) {
        return;
    }

    // 获取视线起点和方向
    let eyePos = p1.GetEyePosition();
    let eyeAngles = p1.GetEyeAngles();
    let forwardVec = getForward(eyeAngles);
    
    // 计算视线最大距离的终点
    let endPos = vectorAdd(eyePos, vectorScale(forwardVec, CONFIG2.MAX_DISTANCE));

    // 发射射线检测视线
    let trace = Instance.TraceLine({
        start: eyePos,
        end: endPos,
        ignoreEntity: Instance.FindEntitiesByName(CONFIG2.BUTTON_NAME)
    });

    // 如果击中实体并且是玩家
    if (trace.didHit && trace.hitEntity && trace.hitEntity.GetClassName() === "player") {
        let p2 = trace.hitEntity;

        // 判断是否为不同阵营
        if (p1.GetTeamNumber() !== p2.GetTeamNumber()) {
            startHook(p1, p2);
            return;
        }
    }

    // 通知p1
    let message = "释放失败...";
    Instance.EntFireAtName({ name: CONFIG2.HUDHINT_PLAYER1, input: "SetMessage", value: message});
    Instance.EntFireAtName({ name: CONFIG2.HUDHINT_PLAYER1, input: "ShowHudHint", activator: p1 });
});

/**
 * 激活钩子状态
 */
function startHook(p1, p2) {
    hookState2.isActive = true;
    hookState2.player1 = p1;
    hookState2.player2 = p2;
    hookState2.p1DamageTaken = 0;

    // 通知p1
    let message = "钩住了 " + p2.GetPlayerController().GetPlayerName();
    Instance.EntFireAtName({ name: CONFIG2.HUDHINT_PLAYER1, input: "SetMessage", value: message});
    Instance.EntFireAtName({ name: CONFIG2.HUDHINT_PLAYER1, input: "ShowHudHint", activator: p1 });

    // 通知p2
    message = "你被 " + p1.GetPlayerController().GetPlayerName() + " 钩住了";
    Instance.EntFireAtName({ name: CONFIG2.HUDHINT_PLAYER2, input: "SetMessage", value: message});
    Instance.EntFireAtName({ name: CONFIG2.HUDHINT_PLAYER2, input: "ShowHudHint", activator: p2 });

    // 播放音频
    Instance.EntFireAtName({ name: CONFIG2.SOUND, input: "StartSound"});

    // 启动 Think 循环来更新玩家速度
    Instance.SetNextThink(Instance.GetGameTime());
}

/**
 * 结束钩子状态
 */
function stopHook() {
    Instance.EntFireAtName({ name: CONFIG2.ROPE_START, input: "DestroyImmediately", delay: 0});
    Instance.EntFireAtName({ name: CONFIG2.ROPE_START, input: "Stop", delay: 0.01});
    let p1 = hookState2.player1;
    hookState2.isActive = false;
    hookState2.player1 = null;
    hookState2.player2 = null;
    hookState2.p1DamageTaken = 0;
    Instance.EntFireAtName({ name: CONFIG2.BUTTON_NAME, input: "lock", delay: 0});
    Instance.EntFireAtName({ name: CONFIG2.BUTTON_NAME, input: "unlock", delay: 60});
    Instance.EntFireAtName({ name: CONFIG2.HUDHINT_PLAYER1, input: "SetMessage", value: "钩子准备好了~", delay: 60});
    Instance.EntFireAtName({ name: CONFIG2.HUDHINT_PLAYER1, input: "ShowHudHint", activator: p1, delay: 60});
}

/**
 * 监听玩家受到的伤害 (利用 OnPlayerDamage 替代生命值换算，更加精准)
 */
Instance.OnPlayerDamage((event) => {
    if (hookState2.isActive && event.player === hookState2.player1) {
        hookState2.p1DamageTaken += event.damage;
        
        // 超过MAX_DAMAGE_LIMIT点伤害断开
        if (hookState2.p1DamageTaken >= CONFIG2.MAX_DAMAGE_LIMIT) {
            // 通知p1
            let message = "钩子断开了~";
            Instance.EntFireAtName({ name: CONFIG2.HUDHINT_PLAYER1, input: "SetMessage", value: message});
            Instance.EntFireAtName({ name: CONFIG2.HUDHINT_PLAYER1, input: "ShowHudHint", activator: hookState2.player1 });

            stopHook();
        }
    }
});

/**
 * 监听玩家死亡，防止死人保持连接
 */
Instance.OnPlayerKill((event) => {
    if (hookState2.isActive && (event.player === hookState2.player1 || event.player === hookState2.player2)) {
        stopHook();
    }
});

/**
 * 回合重新开始时重置状态
 */
Instance.OnRoundStart(() => {
    Instance.EntFireAtName({ name: CONFIG2.ROPE_START, input: "DestroyImmediately", delay: 0});
    Instance.EntFireAtName({ name: CONFIG2.ROPE_START, input: "Stop", delay: 0.01});
    hookState2.isActive = false;
    hookState2.player1 = null;
    hookState2.player2 = null;
    hookState2.p1DamageTaken = 0;
});

/**
 * 核心逻辑：逐帧更新玩家运动状态
 */
Instance.SetThink(() => {
    if (!hookState2.isActive) return;

    let p1 = hookState2.player1;
    let p2 = hookState2.player2;

    // 1. 合法性检查
    if (!p1 || !p1.IsValid() || !p1.IsAlive() || !p2 || !p2.IsValid() || !p2.IsAlive()) {
        return;
    }

    // 队伍检查
    if (p1.GetTeamNumber() == p2.GetTeamNumber()) {
        stopHook();
        return;
    }

    let p1Pos = p1.GetAbsOrigin();
    let p2Pos = p2.GetAbsOrigin();

    // 2. 距离检查 (空间距离超过 MAX_DISTANCE 判定断开)
    let dist = vectorDistance(p1Pos, p2Pos);
    if (dist > CONFIG2.MAX_DISTANCE) {
        // 通知p1
        let message = "钩子断开了~";
        Instance.EntFireAtName({ name: CONFIG2.HUDHINT_PLAYER1, input: "SetMessage", value: message});
        Instance.EntFireAtName({ name: CONFIG2.HUDHINT_PLAYER1, input: "ShowHudHint", activator: hookState2.player1 });

        stopHook();
        return;
    }

    // 粒子特效
    Instance.EntFireAtName({ name: CONFIG2.ROPE_START, input: "Start" });
    let target = Instance.FindEntityByName(CONFIG2.ROPE_END);
    if (target) {
        let origin = p2.GetAbsOrigin();
        origin.z += 40;
        target.Teleport({position:origin});
    }

    // 3. 玩家1：XY 平面静止不动，Z轴保持不变（自由落体）
    let p1Vel = p1.GetAbsVelocity();
    p1.Teleport({ 
        velocity: { x: 0, y: 0, z: p1Vel.z } 
    });

    // 4. 玩家2：计算 XY 平面上的吸力向量并限制自由移动
    let dirToP1 = vectorSubtract(p1Pos, p2Pos);
    dirToP1.z = 0; // 只取 XY 平面方向
    dirToP1 = normalize(dirToP1);

    let p2Vel = p2.GetAbsVelocity();
    p2.Teleport({ 
        velocity: { 
            x: dirToP1.x * CONFIG2.PULL_SPEED, 
            y: dirToP1.y * CONFIG2.PULL_SPEED, 
            z: p2Vel.z // 保留 Z 轴速度，允许下落或跳跃
        } 
    });

    // 安排下一帧执行
    Instance.SetNextThink(Instance.GetGameTime());
});

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

function vectorAdd(vec1, vec2) {
    return { x: vec1.x + vec2.x, y: vec1.y + vec2.y, z: vec1.z + vec2.z };
}

function vectorSubtract(vec1, vec2) {
    return { x: vec1.x - vec2.x, y: vec1.y - vec2.y, z: vec1.z - vec2.z };
}

function vectorScale(vec, scale) {
    return { x: vec.x * scale, y: vec.y * scale, z: vec.z * scale };
}

function vectorLength(vec) {
    return Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
}

function normalize(vec) {
    const length = vectorLength(vec);
    if (length === 0) return { x: 0, y: 0, z: 0 };
    return { x: vec.x / length, y: vec.y / length, z: vec.z / length };
}

function vectorDistance(vec1, vec2) {
    const dx = vec1.x - vec2.x;
    const dy = vec1.y - vec2.y;
    const dz = vec1.z - vec2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}