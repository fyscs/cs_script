import { Instance, CSPlayerPawn, CSInputs } from "cs_script/point_script";

/**
 * Charger脚本
 * 此脚本由皮皮猫233编写
 * 2026/6/18
 */

let timeDelta = 1 / 8;      // Think循环的时间变化量

const CONFIG = {
    damage: 30,                 // 攻击伤害（每次）
    chargeCD: 10,               // 冲刺CD
    maxChargeDuration: 2,       // 最大冲刺时间
    chargeAccelerate: 1000,     // 冲刺加速度
    maxChargeSpeed: 1000,       // 最大冲刺速度
    pushSpeed: 600,             // 推力
}

const state = {
    isCharging: false,
    isAttacking: false,
    chargeDuration: 0,
    attackDuration: 0,
    chargeCD: 0,
    chargeAngles: { pitch: 0, yaw: 0, roll: 0 }
}

let charger = /** @type {CSPlayerPawn|undefined} */ (undefined);
let caught = /** @type {CSPlayerPawn|undefined} */ (undefined);
let suffix = 0;

Instance.OnScriptInput("BecomeCharger", (inputData) => {
    charger = /** @type {CSPlayerPawn} */ (inputData.activator);
    const relayName = inputData.caller?.GetEntityName();
    if (relayName?.startsWith("charger_relay")) {
        suffix = Number(relayName.slice(14));
    }
    Instance.SetNextThink(Instance.GetGameTime());
});

Instance.OnScriptInput("Attack", (inputData) => {
    const player = /** @type {CSPlayerPawn|undefined} */ (inputData.activator);
    if (!player || !player.IsValid()) return;
    state.isAttacking = true;
    caught = player;
    Instance.EntFireAtTarget({ target: caught, input: "KeyValue", value: "movetype 1" });
});

Instance.OnScriptInput("Push", (inputData) => {
    const player = /** @type {CSPlayerPawn|undefined} */ (inputData.activator);
    if (!player || !player.IsValid()) return;
    const angles = { ...state.chargeAngles };
    angles.pitch = -45;
    player.Teleport({ velocity: VectorScale(AnglesToVector(angles), CONFIG.pushSpeed) });
});

Instance.OnRoundStart(() => {
    if (charger && charger.IsValid()) {
        Instance.EntFireAtTarget({ target: charger, input: "SetScale", value: 1 });
        Instance.EntFireAtTarget({ target: charger, input: "KeyValue", value: "speed 1" });
        Instance.EntFireAtTarget({ target: charger, input: "KeyValue", value: "movetype 2" });
    }
    if (caught && caught.IsValid()) {
        Instance.EntFireAtTarget({ target: caught, input: "KeyValue", value: "movetype 2" });
        Instance.EntFireAtTarget({ target: caught, input: "RemoveContext", value: "player_controlled" });
    }
    Instance.EntFireAtName({ name: "charger_script_" + suffix, input: "Kill" });
});

Instance.OnPlayerKill((event) => {
    if (event.player === charger) {
        Instance.EntFireAtTarget({ target: charger, input: "SetScale", value: 1 });
        Instance.EntFireAtTarget({ target: charger, input: "KeyValue", value: "speed 1" });
        CancelAttack(caught, charger);
        if (caught && caught.IsValid()) {
            Instance.EntFireAtTarget({ target: caught, input: "KeyValue", value: "movetype 2" });
            if (event.attacker && event.attacker.IsValid() && event.attacker.GetClassName() === "player") {
                // @ts-ignore
                Instance.ServerCommand(`say **${event.attacker.GetPlayerController()?.GetPlayerName()}解救了${caught.GetPlayerController()?.GetPlayerName()}**`);
                // @ts-ignore
                event.attacker.GetPlayerController()?.AddMoneySpendableNow(5000);
            }
        }
        Instance.EntFireAtName({ name: "charger_kill_relay_" + suffix, input: "Trigger" });
    }
});

Instance.SetThink(() => {
    if (!charger || !charger.IsValid()) return;
    UpdateState(charger);

    Instance.SetNextThink(Instance.GetGameTime() + timeDelta);
});

/**
 * 更新状态
 * @param {CSPlayerPawn} charger 
 */
function UpdateState(charger) {

    // 检查是否处于冲刺状态
    if (state.isCharging) {

        // 时长检测
        if (state.chargeDuration >= CONFIG.maxChargeDuration) {
            CancelCharge(charger);
            return;
        }

        // 障碍物检测
        const start = charger.GetEyePosition();
        start.z -= 20;
        const end = VectorAdd(start, VectorScale(AnglesToVector(state.chargeAngles), 50));
        const result = Instance.TraceSphere({
            start,
            end,
            radius: 20,
            ignorePlayers: true
        });
        if (result.didHit) {
            CancelCharge(charger);
            return;
        }

        state.chargeDuration += timeDelta;
        const velocity = charger.GetAbsVelocity();
        const newVelocity = LimitHorizontalMagnitude(VectorScale(AnglesToVector(state.chargeAngles), CONFIG.chargeAccelerate * state.chargeDuration), CONFIG.maxChargeSpeed);
        newVelocity.z = velocity.z;
        charger.Teleport({ velocity: newVelocity });
        if (caught && caught.IsValid()) {
            const handTarget = Instance.FindEntityByName("charger_hand_target_move_" + suffix);
            if (handTarget && handTarget.IsValid()) {
                const position = handTarget.GetAbsOrigin();
                position.z -= 30;
                caught.Teleport({ position });
            }
        }
        const model = Instance.FindEntityByName("charger_model_" + suffix);
        if (model && model.IsValid()) model.Teleport({ angles: state.chargeAngles });
        return;
    }

    // 检查是否处于攻击状态
    if (state.isAttacking) {

        // 被感染立刻解除
        if (!caught || !caught.IsValid() || caught.GetTeamNumber() !== 3) {
            CancelAttack(undefined, charger);
            return;
        }
        const handTarget = Instance.FindEntityByName("charger_hand_target_move_" + suffix);
        if (handTarget && handTarget.IsValid()) {
            const position = handTarget.GetAbsOrigin();
            position.z -= 60;
            caught.Teleport({ position });
        }
        const model = Instance.FindEntityByName("charger_model_" + suffix);
        if (model && model.IsValid()) model.Teleport({ angles: state.chargeAngles });

        // 伤害判定
        state.attackDuration += timeDelta;
        if (state.attackDuration === 1) Instance.EntFireAtName({ name: "charger_smash_sound_" + suffix, input: "StartSound" });
        if (state.attackDuration >= 1.67) {
            state.attackDuration = 0;
            const currentHealth = caught.GetHealth();
            if (currentHealth <= CONFIG.damage) {
                caught.Kill();
                CancelAttack(caught, charger);
            } else {
                caught.SetHealth(currentHealth - CONFIG.damage);
            }
        }
        return;
    }

    // CD检查
    if (state.chargeCD > 0) {
        let text = "";
        if (state.chargeCD > 0) {
            text = "冷却：" + state.chargeCD.toFixed(2);
            state.chargeCD -= timeDelta;
            if (state.chargeCD <= 0) {
                text = "准备就绪";
            }
        }
        Instance.EntFireAtName({ name: "charger_hudhint_" + suffix, input: "SetMessage", value: text });
        Instance.EntFireAtName({ name: "charger_hudhint_" + suffix, input: "ShowHudHint", activator: charger });
        return;
    }

    const isAttack = charger.IsInputPressed(CSInputs.ATTACK);
    if (isAttack) {
        state.chargeAngles = charger.GetEyeAngles();
        state.chargeAngles.pitch = 0;
        state.chargeAngles.roll = 0;
        state.isCharging = true;
        state.chargeCD = CONFIG.chargeCD;
        Instance.EntFireAtName({ name: "charger_model_" + suffix, input: "SetAnimationLooping", value: "a_charge_fix" });
        Instance.EntFireAtName({ name: "charger_charge_sound_" + suffix, input: "StartSound" });
        Instance.EntFireAtName({ name: "charger_attack_trigger_" + suffix, input: "Enable" });
        Instance.EntFireAtName({ name: "charger_push_trigger_" + suffix, input: "Enable" });
    }
}

/**
 * 取消冲刺并判断是否有抓住人类
 * @param {CSPlayerPawn} charger 
 */
function CancelCharge(charger) {
    if (caught && caught.IsValid() && caught.GetTeamNumber() === 3) {
        state.isAttacking = true;
        Instance.EntFireAtTarget({ target: charger, input: "KeyValue", value: "movetype 0" });
        Instance.EntFireAtName({ name: "charger_model_" + suffix, input: "StartGlowing" });
        Instance.EntFireAtName({ name: "charger_model_" + suffix, input: "SetAnimationLooping", value: "Charger_pound" });
        Instance.EntFireAtTarget({ target: caught, input: "AddContext", value: "player_controlled:1" });
        Instance.EntFireAtName({ name: "thirdperson_script", input: "RunScriptInput", value: "ThirdPerson", activator: charger });
        Instance.EntFireAtName({ name: "thirdperson_script", input: "RunScriptInput", value: "ThirdPerson", activator: caught, delay: 0.1 });
    } else {
        const model = Instance.FindEntityByName("charger_model_" + suffix);
        if (model && model.IsValid()) model.Teleport({ angles: charger.GetAbsAngles() });
        Instance.EntFireAtName({ name: "charger_model_" + suffix, input: "SetAnimationLooping", value: "a_RunN_fix" });
    }
    Instance.EntFireAtName({ name: "charger_attack_trigger_" + suffix, input: "Disable" });
    Instance.EntFireAtName({ name: "charger_push_trigger_" + suffix, input: "Disable" });
    state.isCharging = false;
    state.chargeDuration = 0;
}

/**
 * 取消攻击状态
 * @param {CSPlayerPawn|undefined} player 
 * @param {CSPlayerPawn} charger 
 */
function CancelAttack(player, charger) {
    state.isAttacking = false;
    state.attackDuration = 0;
    Instance.EntFireAtTarget({ target: charger, input: "KeyValue", value: "movetype 2" });
    const model = Instance.FindEntityByName("charger_model_" + suffix);
    if (model && model.IsValid()) model.Teleport({ angles: charger.GetAbsAngles() });
    Instance.EntFireAtName({ name: "charger_model_" + suffix, input: "StopGlowing" });
    Instance.EntFireAtName({ name: "charger_model_" + suffix, input: "SetAnimationLooping", value: "a_RunN_fix" });
    Instance.EntFireAtName({ name: "thirdperson_script", input: "RunScriptInput", value: "FirstPerson", activator: charger });
    if (player && player.IsValid()) {
        const angles = player.GetAbsAngles();
        angles.pitch = 0;
        angles.roll = 0;
        player.Teleport({ position: charger.GetAbsOrigin(), angles });
        Instance.EntFireAtTarget({ target: player, input: "RemoveContext", value: "player_controlled" });
        Instance.EntFireAtName({ name: "thirdperson_script", input: "RunScriptInput", value: "FirstPerson", activator: player, delay: 0.1 });
    }
    caught = undefined;
}

/**
 * 将欧拉角转换为三维方向向量
 * @param {import("cs_script/point_script").QAngle} angles
 * @returns {import("cs_script/point_script").Vector}
 */
function AnglesToVector(angles) {
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
 * @param {import("cs_script/point_script").Vector} vec 
 * @param {number} scale 
 * @returns 
 */
function VectorScale(vec, scale) {
    return { x: vec.x * scale, y: vec.y * scale, z: vec.z * scale };
}

/**
 * 向量加法
 * @param {import("cs_script/point_script").Vector} vec1
 * @param {import("cs_script/point_script").Vector} vec2
 * @returns {import("cs_script/point_script").Vector}
 */
function VectorAdd(vec1, vec2) {
    return { x: vec1.x + vec2.x, y: vec1.y + vec2.y, z: vec1.z + vec2.z };
}

/**
 * 限制三维向量的水平分量（X和Y）的模长，若超过 maxMagnitude 则等比例缩放，保持方向不变；垂直分量 Z 保持不变。
 * @param {import("cs_script/point_script").Vector} v - 输入向量
 * @param {number} maxMagnitude - 允许的最大水平模长（非负数）
 * @returns {import("cs_script/point_script").Vector} 限制后的新向量
 */
function LimitHorizontalMagnitude(v, maxMagnitude) {
    const { x, y, z } = v;
    const horizMag = Math.hypot(x, y);
    if (horizMag <= maxMagnitude) {
        return { x, y, z };
    }
    const scale = maxMagnitude / horizMag;
    return {
        x: x * scale,
        y: y * scale,
        z: z
    };
}