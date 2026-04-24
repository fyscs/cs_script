import { Instance } from "cs_script/point_script";

/**
 * 钩锁拉扯系统：
 * 1. 玩家1按下按钮，MAX_DISTANCE距离内视线捕获不同阵营玩家2
 * 2. 玩家1在XY平面静止不动（Z轴保留，可自由落体）
 * 3. 玩家2无法自由移动，受到XY平面朝向玩家1的恒定吸力
 * 4. 断开条件：玩家1受伤害累计超过MAX_DAMAGE_LIMIT，或两人距离超过MAX_DISTANCE，或任意一方死亡
 */

const CONFIG = {
    MAX_DISTANCE: 500,        // 触发和维持的最大距离
    PULL_SPEED: 100,          // 玩家2在XY平面受到的吸力速度
    MAX_DAMAGE_LIMIT: 1000,     // 玩家1断开连接的最大承受伤害

    // 实体前缀字段
    HUD_P1_NAME: "item_hook_player1_hud",
    HUD_P2_NAME: "item_hook_player2_hud",
    ROPE_START_NAME: "item_hook_particle",
    ROPE_TARGET_NAME: "item_hook_target",
    BUTTON_NAME: "item_hook_button",
    SOUND_NAME: "item_hook_sound"
};

class Hook {
    constructor(player1, slot) {
        this.isActive = false;          // 是否处于激活状态
        this.player1 = player1;            // 施放者 (P1)
        this.player2 = null;            // 被吸附者 (P2)
        this.slot = slot;                 // 钩子槽位
        this.p1DamageTaken = 0;         // P1累计承受伤害
    }

    /**
     * 激活钩子状态
    */
    startHook(p2) {
        this.isActive = true;
        this.player2 = p2;
        this.p1DamageTaken = 0;

        // 通知p1
        let message = "钩住了 " + this.player2.GetPlayerController().GetPlayerName();
        Instance.EntFireAtName({ name: CONFIG.HUD_P1_NAME + "_" + this.slot, input: "SetMessage", value: message });
        Instance.EntFireAtName({ name: CONFIG.HUD_P1_NAME + "_" + this.slot, input: "ShowHudHint", activator: this.player1 });

        // 通知p2
        message = "你被 " + this.player1.GetPlayerController().GetPlayerName() + " 钩住了";
        Instance.EntFireAtName({ name: CONFIG.HUD_P2_NAME + "_" + this.slot, input: "SetMessage", value: message });
        Instance.EntFireAtName({ name: CONFIG.HUD_P2_NAME + "_" + this.slot, input: "ShowHudHint", activator: this.player2 });

        // 播放音频
        Instance.EntFireAtName({ name: CONFIG.SOUND_NAME + "_" + this.slot, input: "StartSound" });
    }

    /**
     * 检查玩家12状态
     */
    checkPlayerStatus() {
        if (!this.player1 || !this.player1.IsValid() || !this.player1.IsAlive()) {
            this.stopHook();
            Instance.Msg("Player 1 is not valid");
            return false;
        }
        if (!this.player2 || !this.player2.IsValid() || !this.player2.IsAlive()) {
            this.stopHook();
            Instance.Msg("Player 2 is not valid");
            return false;
        }
        if (this.player1.GetTeamNumber() == this.player2.GetTeamNumber()) {
            this.stopHook();
            Instance.Msg("Players are on the same team");
            return false;
        }
        return true;
    }

    /** 
     * 检查损伤
     */
    // 超过MAX_DAMAGE_LIMIT点伤害断开
    checkDamage() {
        if (this.p1DamageTaken >= CONFIG.MAX_DAMAGE_LIMIT) {
            // 通知p1
            let message = "钩子断开了~";
            Instance.EntFireAtName({ name: CONFIG.HUD_P1_NAME + "_" + this.slot, input: "SetMessage", value: message });
            Instance.EntFireAtName({ name: CONFIG.HUD_P1_NAME + "_" + this.slot, input: "ShowHudHint", activator: this.player1 });

            this.stopHook();
            Instance.Msg("Damage exceeded");
            return false;
        }
        return true;
    }

    /** 
     * 检查距离
     */
    checkDistance() {
        const dist = vectorDistance(this.player1.GetAbsOrigin(), this.player2.GetAbsOrigin());
        if (dist > CONFIG.MAX_DISTANCE) {
            // 通知p1
            let message = "钩子断开了~";
            Instance.EntFireAtName({ name: CONFIG.HUD_P1_NAME + "_" + this.slot, input: "SetMessage", value: message });
            Instance.EntFireAtName({ name: CONFIG.HUD_P1_NAME + "_" + this.slot, input: "ShowHudHint", activator: this.player1 });

            this.stopHook();
            Instance.Msg("Distance exceeded");
            return false;
        }
        return true;
    }

    /**
     * 改变粒子特效
     */
    updateParticle() {
        Instance.EntFireAtName({ name: CONFIG.ROPE_START_NAME + "_" + this.slot, input: "Start" });
        const target = Instance.FindEntityByName(CONFIG.ROPE_TARGET_NAME + "_" + this.slot);
        if (target) {
            let origin = this.player2.GetAbsOrigin();
            origin.z += 40;
            target.Teleport({ position: origin });
        }
    }

    /** 
     * 更新玩家1状态
     */
    updatePlayer1() {
        let p1Vel = this.player1.GetAbsVelocity();
        this.player1.Teleport({
            velocity: { x: 0, y: 0, z: p1Vel.z }
        });
    }

    /** 
     * 更新玩家2状态
     */
    updatePlayer2() {
        let p2Pos = this.player2.GetAbsOrigin();
        let dirToP1 = vectorSubtract(this.player1.GetAbsOrigin(), p2Pos);
        dirToP1.z = 0; // 只取 XY 平面方向
        dirToP1 = normalize(dirToP1);

        let p2Vel = this.player2.GetAbsVelocity();
        this.player2.Teleport({
            velocity: {
                x: dirToP1.x * CONFIG.PULL_SPEED,
                y: dirToP1.y * CONFIG.PULL_SPEED,
                z: p2Vel.z // 保留 Z 轴速度，允许下落或跳跃
            }
        });
    }

    /**
     * 结束钩子状态
     */
    stopHook() {
        Instance.EntFireAtName({ name: CONFIG.ROPE_START_NAME + "_" + this.slot, input: "DestroyImmediately", delay: 0 });
        Instance.EntFireAtName({ name: CONFIG.ROPE_START_NAME + "_" + this.slot, input: "Stop", delay: 0.01 });
        this.isActive = false;
        this.player2 = null;
        this.p1DamageTaken = 0;
        Instance.EntFireAtName({ name: CONFIG.BUTTON_NAME + "_" + this.slot, input: "lock", delay: 0 });
        Instance.EntFireAtName({ name: CONFIG.BUTTON_NAME + "_" + this.slot, input: "unlock", delay: 60 });
        Instance.EntFireAtName({ name: CONFIG.HUD_P1_NAME + "_" + this.slot, input: "SetMessage", value: "钩子准备好了~", delay: 60 });
        Instance.EntFireAtName({ name: CONFIG.HUD_P1_NAME + "_" + this.slot, input: "ShowHudHint", activator: this.player1, delay: 60 });
    }

    /**
     * 重置钩子状态
     */
    resetHook() {
        Instance.EntFireAtName({ name: CONFIG.ROPE_START_NAME + "_" + this.slot, input: "DestroyImmediately", delay: 0 });
        Instance.EntFireAtName({ name: CONFIG.ROPE_START_NAME + "_" + this.slot, input: "Stop", delay: 0.01 });
    }
}

const hooks = new Map();

/**
 * 主函数
 */
Instance.SetThink(() => {
    hooks.forEach((hook, player) => {
        if (!hook.isActive) return;

        if (!hook.checkPlayerStatus()) return;
        if (!hook.checkDamage()) return;
        if (!hook.checkDistance()) return;

        hook.updateParticle();
        hook.updatePlayer1();
        hook.updatePlayer2();
    });
    Instance.SetNextThink(Instance.GetGameTime());
});

Instance.SetNextThink(Instance.GetGameTime());

/**
 * 监听玩家输入触发钩子 (在 Hammer 中触发 "start_hook" input)
 */
Instance.OnScriptInput("start_hook", (inputData) => {
    const p1 = inputData.activator;
    if (!hooks.has(p1)) return;
    const hook = hooks.get(p1);

    // 校验触发者必须是有效玩家，且当前未在使用钩子
    if (!p1 || !p1.IsValid() || p1.GetClassName() !== "player" || hook.isActive) {
        return;
    }

    // 获取视线起点和方向
    let eyePos = p1.GetEyePosition();
    let eyeAngles = p1.GetEyeAngles();
    let forwardVec = getForward(eyeAngles);

    // 计算视线最大距离的终点
    let endPos = vectorAdd(eyePos, vectorScale(forwardVec, CONFIG.MAX_DISTANCE));

    const ignoreEntities = [p1, Instance.FindEntitiesByClass("func_button")];

    // 发射射线检测视线
    let trace = Instance.TraceLine({
        start: eyePos,
        end: endPos,
        ignoreEntity: ignoreEntities
    });

    // 如果击中实体并且是玩家
    if (trace.didHit && trace.hitEntity && trace.hitEntity.GetClassName() === "player") {
        let p2 = trace.hitEntity;

        Instance.Msg("Player " + p1.GetPlayerController().GetPlayerName() + " hit " + p2.GetPlayerController().GetPlayerName() + " with hook");

        // 判断是否为不同阵营
        if (p1.GetTeamNumber() !== p2.GetTeamNumber()) {
            hook.startHook(p2);
            return;
        }
    }

    Instance.Msg("start_hook failed");

    // 通知p1
    let message = "释放失败...";
    Instance.EntFireAtName({ name: CONFIG.HUD_P1_NAME + "_" + hook.slot, input: "SetMessage", value: message });
    Instance.EntFireAtName({ name: CONFIG.HUD_P1_NAME + "_" + hook.slot, input: "ShowHudHint", activator: p1 });
});

/**
 * 监听玩家受到的伤害
 */
Instance.OnPlayerDamage((event) => {
    if (hooks.has(event.player) && hooks.get(event.player).isActive) {
        const hook = hooks.get(event.player);
        hook.p1DamageTaken += event.damage;
        Instance.Msg("Player " + event.player.GetPlayerController().GetPlayerName() + " took " + event.damage + " damage.");
        Instance.Msg("Total damage taken: " + hook.p1DamageTaken);
    }
});

/**
 * 回合重新开始时重置状态
 */
Instance.OnRoundStart(() => {
    hooks.forEach((hook) => {
        hook.resetHook();
    });
    hooks.clear();
});

// 拾取神器时注册
Instance.OnScriptInput("register", (inputData) => {
    const player = inputData.activator;
    const parts = inputData.caller.GetEntityName().split('_');
    const slot = parts[parts.length - 1];

    const hook = new Hook(player, slot);
    hooks.set(player, hook);

    Instance.Msg("hook registered for player: " + player.GetPlayerController().GetPlayerName() + " in slot: " + slot);
})

// 通用计算函数
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