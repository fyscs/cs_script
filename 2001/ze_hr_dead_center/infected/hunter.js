import { Instance, CSPlayerPawn, CSInputs, CSWeaponAttackType } from "cs_script/point_script";

/**
 * Hunter脚本
 * 此脚本由皮皮猫233编写
 * 2026/6/13
 */

let timeDelta = 1 / 8;      // Think循环的时间变化量

const CONFIG = {
    pushSpeed: 800,         // 单次飞扑速度
    maxPounceTimes: 3,      // 一次性最多可飞扑的次数
    maxClimbDuration: 1,    // 最大扒墙时间
    minDuckDuration: 1,     // 可触发飞扑的最短时间
    wallDetectDelay: 0.2,   // 扒墙检测延迟
    pounceDamage: 20        // 飞扑伤害（每秒）
}

const state = {
    isPouncing: false,
    isClimbing: false,
    climbDuration: 0,
    duckDuration: 0,
    pouncingDuration: 0,
    pounceTimes: 0,
    isAttacking: false,
    attackDuration: 0
}

let hunter = /** @type {CSPlayerPawn|undefined} */ (undefined);
let pounced = /** @type {CSPlayerPawn|undefined} */ (undefined);
let suffix = 0;

Instance.OnScriptInput("BecomeHunter", (inputData) => {
    hunter = /** @type {CSPlayerPawn} */ (inputData.activator);
    const relayName = inputData.caller?.GetEntityName();
    if (relayName?.startsWith("hunter_relay")) {
        suffix = Number(relayName.slice(13));
    }
    Instance.SetNextThink(Instance.GetGameTime());
});

Instance.OnRoundStart(() => {
    Instance.EntFireAtName({ name: "hunter_script_" + suffix, input: "Kill" });
});

Instance.OnPlayerKill((event) => {
    if (event.player === hunter) {
        if (pounced && pounced.IsValid()) {
            Instance.EntFireAtTarget({ target: pounced, input: "KeyValue", value: "movetype 2" });
            Instance.EntFireAtName({ name: "thirdperson_script", input: "RunScriptInput", value: "FirstPerson", activator: pounced });
        }
        Instance.EntFireAtName({ name: "hunter_script_" + suffix, input: "Kill" });
    }
});

Instance.OnKnifeAttack((event) => {
    if (event.attackType === CSWeaponAttackType.SECONDARY) {
        const player = event.weapon.GetOwner();

        // 人类靠近Hunter重击时解除控制
        if (hunter && hunter.IsValid() && pounced && pounced.IsValid() && player && player.IsValid() && player !== pounced && player.GetTeamNumber() === 3) {
            const hunterPosition = hunter.GetEyePosition();
            const humanPositon = player.GetEyePosition();
            const humanAngles = player.GetEyeAngles();

            // 一定距离内且一定视线角度内
            if (IsPointInSphere(humanPositon, hunterPosition, 70) && (IsPointInViewCone(humanPositon, humanAngles, hunterPosition, 30) || IsPointInViewCone(humanPositon, humanAngles, hunter.GetAbsOrigin(), 30))) {
                const result = Instance.TraceLine({
                    start: hunterPosition,
                    end: humanPositon,
                    ignorePlayers: true
                });

                // 人类与Hunter之间无遮挡时才解除
                if (!result.didHit) {
                    Instance.ServerCommand(`say **${player.GetPlayerController()?.GetPlayerName()}解救了${pounced.GetPlayerController()?.GetPlayerName()}**`);
                    CancleAttack(pounced, hunter);
                }
            }
        }
    }
});

Instance.SetThink(() => {
    if (!hunter || !hunter.IsValid()) return;
    const isDuck = hunter.IsInputPressed(CSInputs.DUCK);
    const isAttack = hunter.IsInputPressed(CSInputs.ATTACK);

    if (state.isAttacking) {
        if (pounced && pounced.IsValid()) {
            if (pounced.GetTeamNumber() === 3) {
                state.attackDuration += timeDelta;
                if (state.attackDuration >= 1) {
                    state.attackDuration = 0;
                    const currentHealth = pounced.GetHealth();
                    if (currentHealth < CONFIG.pounceDamage) {
                        pounced.Kill();
                        CancleAttack(pounced, hunter);
                    }
                    else pounced.SetHealth(currentHealth - CONFIG.pounceDamage);
                }
            } else {

                // 被感染立刻解除
                CancleAttack(pounced, hunter);
            }
        } else {
            CancleAttack(undefined, hunter);
        }
    } else {

        // 连续飞扑上墙检测
        if (state.isPouncing) {

            // 松蹲立刻停止飞扑
            if (isDuck) {

                if (state.isClimbing) {

                    // 扒墙时左键触发连续飞扑
                    if (isAttack) {
                        state.climbDuration = 0;
                        state.isClimbing = false;
                        state.pouncingDuration = 0;
                        Pounce(hunter);
                    } else {

                        // 否则检测扒墙时长是否超时
                        state.climbDuration += timeDelta;
                        if (state.climbDuration > CONFIG.maxClimbDuration) {
                            Instance.EntFireAtTarget({ target: hunter, input: "KeyValue", value: "movetype 2" });
                            CanclePounce();
                        }
                    }
                } else {

                    // 起跳后延迟检测是否上墙
                    if (state.pouncingDuration >= CONFIG.wallDetectDelay) {
                        const zombies = GetAllZombies();
                        const start = hunter.GetAbsOrigin();
                        const end = { ...start };
                        end.z += 49;
                        start.z += 10;
                        const result = Instance.TraceSphere({
                            start,
                            end,
                            radius: 20,
                            ignoreEntity: zombies
                        });
                        if (result.didHit && result.hitEntity && result.hitEntity.IsValid()) {

                            // 命中玩家时将其扑倒
                            if (result.hitEntity.GetClassName() === "player") {
                                CanclePounce();
                                state.isAttacking = true;
                                pounced = /** @type {CSPlayerPawn} */ (result.hitEntity);
                                hunter.Teleport({ position: pounced.GetAbsOrigin(), velocity: { x: 0, y: 0, z: 0 } });
                                pounced.Teleport({ velocity: { x: 0, y: 0, z: 0 } });
                                Instance.EntFireAtName({ name: "hunter_model_" + suffix, input: "SetAnimationLooping", value: "Melee_Pounce" });
                                Instance.EntFireAtName({ name: "hunter_particle_" + suffix, input: "Start" });
                                Instance.EntFireAtName({ name: "hunter_attack_timer_" + suffix, input: "Enable" });
                                Instance.EntFireAtTarget({ target: hunter, input: "KeyValue", value: "movetype 0" });
                                Instance.EntFireAtTarget({ target: pounced, input: "KeyValue", value: "movetype 0" });
                                Instance.EntFireAtName({ name: "thirdperson_script", input: "RunScriptInput", value: "ThirdPerson", activator: hunter });
                                Instance.EntFireAtName({ name: "thirdperson_script", input: "RunScriptInput", value: "ThirdPerson", activator: pounced, delay: 0.1 });
                                Instance.ServerCommand(`say **${pounced.GetPlayerController()?.GetPlayerName()}被Hunter扑倒了，使用匕首重击来解救你的队友**`);
                            } else {

                                // 接触面小于45度时重置飞扑状态
                                if (result.normal.z >= 0.5) {
                                    CanclePounce();
                                    state.duckDuration = CONFIG.minDuckDuration;
                                    ShowHudHint(hunter);
                                } else {

                                    // 判断连续飞扑次数，超出次数重置飞扑状态
                                    if (state.pounceTimes >= CONFIG.maxPounceTimes) {
                                        CanclePounce();
                                        state.duckDuration = CONFIG.minDuckDuration;
                                    } else {
                                        state.isClimbing = true;
                                        ShowHudHint(hunter);
                                        hunter.Teleport({ velocity: { x: 0, y: 0, z: 0 } });
                                        Instance.EntFireAtName({ name: "hunter_model_" + suffix, input: "SetAnimationLooping", value: "Idle_Crouching_01" });
                                        Instance.EntFireAtTarget({ target: hunter, input: "KeyValue", value: "movetype 1" });
                                    }
                                }
                            }
                        }
                    } else state.pouncingDuration += timeDelta;
                }
            } else {
                Instance.EntFireAtName({ name: "hunter_model_" + suffix, input: "SetAnimationLooping", value: "a_RunN_fix" });
                Instance.EntFireAtName({ name: "hunter_model_" + suffix, input: "SetIdleAnimationLooping", value: "a_RunN_fix" });
                Instance.EntFireAtTarget({ target: hunter, input: "KeyValue", value: "movetype 2" });
                CanclePounce();
            }
        } else {

            // 未处于飞扑状态则判断是否按蹲
            if (isDuck) {

                // 判断是否处于地面
                const entity = hunter.GetGroundEntity();
                if (entity && entity.IsValid()) {
                    ShowHudHint(hunter);
                    Instance.EntFireAtName({ name: "hunter_model_" + suffix, input: "SetAnimationLooping", value: "Idle_Crouching_01" });
                    Instance.EntFireAtTarget({ target: hunter, input: "KeyValue", value: "movetype 0" });

                    // 判断蹲伏时间是否够长
                    if (state.duckDuration >= CONFIG.minDuckDuration) {

                        // 判断是否按下左键
                        if (isAttack) {
                            state.isPouncing = true;
                            state.pouncingDuration = 0;
                            Pounce(hunter);
                        }
                    } else state.duckDuration += timeDelta;
                }
            } else {

                // 判断蹲伏时间避免重复无用的操作
                if (state.duckDuration > 0) {
                    Instance.EntFireAtName({ name: "hunter_model_" + suffix, input: "SetAnimationLooping", value: "a_RunN_fix" });
                    Instance.EntFireAtName({ name: "hunter_model_" + suffix, input: "SetIdleAnimationLooping", value: "a_RunN_fix" });
                    Instance.EntFireAtTarget({ target: hunter, input: "KeyValue", value: "movetype 2" });
                    CanclePounce();
                }
            }
        }
    }

    Instance.SetNextThink(Instance.GetGameTime() + timeDelta);
});

/**
 * 使用HudHint显示重要参数
 * @param {CSPlayerPawn} player 
 */
function ShowHudHint(player) {
    let duckDurationText = "";
    if (state.duckDuration < CONFIG.minDuckDuration) duckDurationText = GetProgressBar(state.duckDuration, CONFIG.minDuckDuration, 30, "-");
    else {
        if (state.pounceTimes <= 0 || state.isClimbing) duckDurationText = "||||||||||||||||||||||||||||||||||||||||";
        else duckDurationText = "------------------------------";
    }
    const pounceTimesText = GetProgressBar(CONFIG.maxPounceTimes - state.pounceTimes, CONFIG.maxPounceTimes, CONFIG.maxPounceTimes, "■", '□');
    const text = `${pounceTimesText}\n[${duckDurationText}]`;
    Instance.EntFireAtName({ name: "hunter_hudhint_" + suffix, input: "SetMessage", value: text });
    Instance.EntFireAtName({ name: "hunter_hudhint_" + suffix, input: "ShowHudHint", activator: player });
}

/**
 * 取消攻击状态
 * @param {CSPlayerPawn|undefined} player 
 * @param {CSPlayerPawn} hunter 
 */
function CancleAttack(player = undefined, hunter) {
    state.isAttacking = false;
    state.attackDuration = 0;
    Instance.EntFireAtName({ name: "hunter_model_" + suffix, input: "SetAnimationLooping", value: "a_RunN_fix" });
    Instance.EntFireAtName({ name: "hunter_model_" + suffix, input: "SetIdleAnimationLooping", value: "a_RunN_fix" });
    Instance.EntFireAtName({ name: "hunter_particle_" + suffix, input: "Stop" });
    Instance.EntFireAtName({ name: "hunter_attack_timer_" + suffix, input: "Disable" });
    Instance.EntFireAtTarget({ target: hunter, input: "KeyValue", value: "movetype 2" });
    Instance.EntFireAtName({ name: "thirdperson_script", input: "RunScriptInput", value: "FirstPerson", activator: hunter });
    if (player) {
        Instance.EntFireAtTarget({ target: player, input: "KeyValue", value: "movetype 2" });
        Instance.EntFireAtName({ name: "thirdperson_script", input: "RunScriptInput", value: "FirstPerson", activator: player, delay: 0.1 });
    }
    pounced = undefined;
}

/**
 * 飞扑效果
 * @param {CSPlayerPawn} player 
 */
function Pounce(player) {
    state.pounceTimes++;
    ShowHudHint(player);
    Instance.EntFireAtName({ name: "hunter_model_" + suffix, input: "SetAnimationNoResetNotLooping", value: "pounce_idle_low" });
    Instance.EntFireAtName({ name: "hunter_model_" + suffix, input: "SetIdleAnimationNotLooping", value: "pounce_idle_low" });
    Instance.EntFireAtName({ name: "hunter_pounce_sound_" + suffix, input: "StartSound" });
    Instance.EntFireAtTarget({ target: player, input: "KeyValue", value: "movetype 2" });
    const forward = AnglesToVector(player.GetEyeAngles());
    player.Teleport({ velocity: VectorScale(forward, CONFIG.pushSpeed) });
}

/**
 * 取消飞扑并重置各状态
 */
function CanclePounce() {
    state.climbDuration = 0;
    state.isPouncing = false;
    state.isClimbing = false;
    state.pounceTimes = 0;
    state.pouncingDuration = 0;
    state.duckDuration = 0;
}

/**
 * 获取全部僵尸
 */
function GetAllZombies() {
    const players = Instance.FindEntitiesByClass("player");
    let zombies = [];
    for (const player of players) {
        if (player.IsValid() && player.GetTeamNumber() === 2) zombies.push(player);
    }
    return zombies;
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
 * 判断点是否在指定球体内
 * @param {import("cs_script/point_script").Vector} point 待检测的点
 * @param {import("cs_script/point_script").Vector} center 球心坐标
 * @param {number} radius 球半径
 * @returns {boolean} 点在球内（含边界）返回 true，否则 false
 */
function IsPointInSphere(point, center, radius) {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const dz = point.z - center.z;
    const distSq = dx * dx + dy * dy + dz * dz;
    return distSq <= radius * radius;
}

/**
 * 判断三维坐标点是否在给定视线方向的锥形范围内
 * @param {import("cs_script/point_script").Vector} eyePos - 观察者的眼睛位置（世界坐标）
 * @param {import("cs_script/point_script").QAngle} eyeAng - 观察者的视线角度（欧拉角，pitch/yaw/roll）
 * @param {import("cs_script/point_script").Vector} point - 要检测的世界坐标点
 * @param {number} fovDeg - 半视角（视线方向到圆锥边缘的最大夹角，单位：度）
 * @returns {boolean} 如果点在视野锥形内则返回 true
 */
function IsPointInViewCone(eyePos, eyeAng, point, fovDeg) {
    // 1. 将欧拉角转换为视线方向向量（Source 引擎坐标系：X 前，Y 左，Z 上）
    const pitch = eyeAng.pitch * (Math.PI / 180);
    const yaw   = eyeAng.yaw   * (Math.PI / 180);

    const forwardX = Math.cos(pitch) * Math.cos(yaw);
    const forwardY = Math.cos(pitch) * Math.sin(yaw);
    const forwardZ = -Math.sin(pitch); // pitch 正值为向下看

    // 2. 计算眼睛到目标点的方向向量
    const dirX = point.x - eyePos.x;
    const dirY = point.y - eyePos.y;
    const dirZ = point.z - eyePos.z;
    const dirLen = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);

    if (dirLen < 0.001) {
        // 目标点几乎与眼睛重合，认为在视野内
        return true;
    }

    // 归一化
    const normX = dirX / dirLen;
    const normY = dirY / dirLen;
    const normZ = dirZ / dirLen;

    // 3. 计算点积并得出夹角（弧度 -> 度）
    const dot = forwardX * normX + forwardY * normY + forwardZ * normZ;
    const angleRad = Math.acos(Math.max(-1, Math.min(1, dot)));
    const angleDeg = angleRad * (180 / Math.PI);

    // 4. 比较
    return angleDeg <= fovDeg;
}

/**
 * 生成抽象进度条
 * @param {number} value 当前值（0 ≤ value ≤ max）
 * @param {number} max 最大值（> 0）
 * @param {number} totalBars 进度条总格子数（正整数）
 * @param {string} fillChar 填充字符
 * @param {string|undefined} emptyChar 填空字符
 * @returns {string} 进度条字符串
 */
function GetProgressBar(value, max, totalBars, fillChar, emptyChar = undefined) {

    // 计算填充比例并限制在 [0, totalBars] 之间
    const filled = Math.min(totalBars, Math.max(0, Math.round((value / max) * totalBars)));

    if (emptyChar) {
        // 生成实心和空心部分
        return fillChar.repeat(filled) + emptyChar.repeat(totalBars - filled);
    } else {
        return fillChar.repeat(filled);
    }
}