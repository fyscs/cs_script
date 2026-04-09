import { Instance, CSInputs } from "cs_script/point_script";

var jk_maxhp = 25;                      // 剑客血量
const MARK_RADIUS = 384;                // 范围 
const MARK_HEALTH_THRESHOLD = 1000;    // 斩杀血量
const MARK_DELAY = 1;                   // 标记时间
const DASH_TIME = 0.5;                  // 冲刺时间
const COOLDOWN_DURATION = 2;            // 斩杀冷却时间（秒）

function vec(x, y, z) { return { x, y, z }; }
function ang(p, y, r) { return { pitch: p, yaw: y, roll: r }; }
function len3(v) { return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z); }
function len2(v) { return Math.sqrt(v.x * v.x + v.y * v.y); }
function sub(v1, v2) { return { x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z }; }
function add(v1, v2) { return { x: v1.x + v2.x, y: v1.y + v2.y, z: v1.z + v2.z }; }
function scale(v, s) { return { x: v.x * s, y: v.y * s, z: v.z * s }; }
function fwd(a) {
    const p = (a.pitch * Math.PI) / 180;
    const y = (a.yaw * Math.PI) / 180;
    const h = Math.cos(p);
    return { x: Math.cos(y) * h, y: Math.sin(y) * h, z: -Math.sin(p) };
}
function dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }

function print(text) { Instance.Msg(text); }
function fire(name, input = "", val = "", delay = 0, caller, activator) {
    Instance.EntFireAtName({ name, input, value: val, caller, activator, delay });
}
function fireT(target, input = "", val = "", delay = 0, caller, activator) {
    Instance.EntFireAtTarget({ target, input, value: val, caller, activator, delay });
}
function find(name) { return Instance.FindEntityByName(name); }
function findAll(name) { return Instance.FindEntitiesByName(name); }
function findByClass(cls) { return Instance.FindEntitiesByClass(cls); }

function setPlayerColor(player, r, g, b, a = 255) {
    if (player && player.IsValid()) {
        player.SetColor({ r, g, b, a });
    }
}

var jk_hp = jk_maxhp;
var jk = undefined;
var gt_type = 1;

const ARRIVE_DIST = 100;
const FOV_DEG = 30;
const FOV_COS = Math.cos(FOV_DEG * Math.PI / 180);

let targetStates = new Map(); 

let dashing = false;
let dashTarget = undefined;
let dashVelocity = undefined;   

let charging = false;
let chargeTarget = undefined;
let chargeStartTime = 0;

let thinkStarted = false;
let lastExecutionTime = 0;          

Instance.OnScriptInput("jk_reset", ({}) => {
    let allplayer = findByClass("player");
    for (const p of allplayer) {
        setPlayerColor(p, 255, 255, 255, 255);
    }
    targetStates.clear();
    jk = undefined;
    jk_hp = jk_maxhp;    
    dashing = false;
    dashTarget = undefined;
    dashVelocity = undefined;
    charging = false;
    chargeTarget = undefined;
    lastExecutionTime = 0;
});

Instance.OnScriptInput("jk_getitem", ({ activator }) => {
    jk = activator;
    if (!thinkStarted) {
        thinkStarted = true;
        Instance.SetThink(think);
        Instance.SetNextThink(Instance.GetGameTime() + 1/64);
    }
});

Instance.OnScriptInput("jk_gethit", ({}) => {
    jk_hp--;
    if (jk_hp <= 0) {
        jk_hp = 0;
        fireT(jk, "keyvalues", "targetname ", 0);
        fireT(jk, "alpha", "255");
        fireT(jk, "sethealth", "-1", 0);
        fire("jk_mmfix", "KillHierarchy", "", 0.2);
        fire("jk_knife", "KillHierarchy", "", 0.2);
        fire("jk_ui", "KillHierarchy", "", 0.2);
        jk = undefined;
    } else {
        jk.SetHealth(jk_hp * 1000);
    }
});

Instance.OnScriptInput("gt_atk1", ({}) => { gt_type = 1; });
Instance.OnScriptInput("gt_atk2", ({}) => { gt_type = 2; });

Instance.OnScriptInput("jk_gethit_gt", ({ activator }) => {
    if (activator !== jk) return;

    let dmg = 3;
    if (gt_type === 2) dmg = 8;

    jk_hp -= dmg;
    if (jk_hp <= 0) {
        jk_hp = 0;
        fireT(jk, "keyvalues", "targetname ", 0);
        fireT(jk, "alpha", "255");
        fireT(jk, "sethealth", "-1", 0);
        fire("jk_mmfix", "KillHierarchy", "", 0.2);
        fire("jk_knife", "KillHierarchy", "", 0.2);
        fire("jk_ui", "KillHierarchy", "", 0.2);
        jk = undefined;
    } else {
        jk.SetHealth(jk_hp * 100);
    }
});

Instance.OnScriptInput("jk_dash", ({}) => {
    if (!jk) return;
    const angles = jk.GetEyeAngles();
    const dir = fwd(angles);
    let vel = scale(dir, 500);
    if (Math.abs(angles.pitch) < 15) {
        vel.z += 150;
    }
    jk.Teleport({ velocity: vel });
});

function think() {
    const now = Instance.GetGameTime();

    if (!jk || !jk.IsValid() || jk.GetTeamNumber() === 2) {
        for (let [target, state] of targetStates) {
            if (target.IsValid()) setPlayerColor(target, 255, 255, 255);
        }
        targetStates.clear();
        dashing = false;
        dashTarget = undefined;
        dashVelocity = undefined;
        charging = false;
        chargeTarget = undefined;
        jk = undefined;
        Instance.SetNextThink(now + 1/64);
        return;
    }

    if (dashing && dashTarget && dashTarget.IsValid() && dashTarget.IsAlive()) {
        const jkPos = jk.GetAbsOrigin();
        const targetPos = dashTarget.GetAbsOrigin();
        const dirToTarget = sub(targetPos, jkPos);
        const dist = len3(dirToTarget);

        if (dist < ARRIVE_DIST) {
            fire("jk_hitbox", "SetDamageFilter", "cf_zombie", 0.5);
            fire("jk_slay_post", "disable", "", 0);
            fire("jk_ui", "Activate", "", 0, undefined, jk);
            dashTarget.TakeDamage({ damage: 1000000, attacker: jk, inflictor: jk });
            dashing = false;
            dashTarget = undefined;
            dashVelocity = undefined;
        } else {
            dashTarget.Teleport({ velocity: vec(0, 0, 0) });
            if (dashVelocity) jk.Teleport({ velocity: dashVelocity });
        }
    } else if (dashing) {
        dashing = false;
        dashTarget = undefined;
        dashVelocity = undefined;
    }

    if (charging) {
        if (!chargeTarget || !chargeTarget.IsValid() || !chargeTarget.IsAlive()) {
            if (chargeTarget && chargeTarget.IsValid()) setPlayerColor(chargeTarget, 255, 255, 255);
            targetStates.delete(chargeTarget);
            charging = false;
            chargeTarget = undefined;
        } else {
            jk.Teleport({ velocity: vec(0, 0, 0) });
            chargeTarget.Teleport({ velocity: vec(0, 0, 0) });

            const elapsed = now - chargeStartTime;
            if (elapsed >= 0.5) {
                const jkPos = jk.GetAbsOrigin();
                const targetPos = chargeTarget.GetAbsOrigin();
                const dir = sub(targetPos, jkPos);
                const dist = len3(dir);
                if (dist >= 1) {
                    const normDir = scale(dir, 1 / dist);
                    const speed = dist / DASH_TIME;
                    dashVelocity = scale(normDir, speed);
                } else {
                    dashVelocity = vec(0, 0, 0);
                }

                dashing = true;
                dashTarget = chargeTarget;
                dashTarget.Teleport({ velocity: vec(0, 0, 0) });
                jk.Teleport({ velocity: dashVelocity });

                fire("jk_sound0", "SetSoundEventName", "ambient.jk_slay2", 0);
                fire("jk_sound0", "startsound", "", 0.02);

                setPlayerColor(chargeTarget, 255, 255, 255);
                targetStates.delete(chargeTarget);

                charging = false;
                chargeTarget = undefined;
            }
        }
    }

    if (!dashing && !charging && jk && jk.IsValid()) {
        const jkPos = jk.GetAbsOrigin();

        const players = findByClass("player");
        const currentTargets = new Set();

        for (const p of players) {
            if (p.GetTeamNumber() === 2 && p.IsAlive()) {
                const dist = len3(sub(p.GetAbsOrigin(), jkPos));
                if (dist <= MARK_RADIUS && p.GetHealth() < MARK_HEALTH_THRESHOLD) {
                    currentTargets.add(p);
                    if (!targetStates.has(p)) {
                        targetStates.set(p, { startTime: now, marked: false });
                    }
                }
            }
        }

        for (let [target, state] of targetStates) {
            if (!currentTargets.has(target) || !target.IsValid() || !target.IsAlive()) {
                setPlayerColor(target, 255, 255, 255);
                targetStates.delete(target);
            }
        }

        for (let [target, state] of targetStates) {
            if (!state.marked) {
                const elapsed = now - state.startTime;
                if (elapsed >= MARK_DELAY) {
                    state.marked = true;
                    setPlayerColor(target, 255, 0, 0);
                } else {
                    const progress = elapsed / MARK_DELAY;
                    const gb = Math.floor(255 * (1 - progress));
                    setPlayerColor(target, 255, gb, gb);
                }
            }
        }

        if (jk.WasInputJustPressed(CSInputs.LOOK_AT_WEAPON)) {
            if (now - lastExecutionTime < COOLDOWN_DURATION) {
            } else {
                const eyeAng = jk.GetEyeAngles();
                const forward = fwd(eyeAng);
                let bestTarget = null;
                let bestDot = -1;

                const allButtons = Instance.FindEntitiesByClass("func_button");

                for (let [target, state] of targetStates) {
                    if (!state.marked) continue;
                    if (!target.IsValid() || !target.IsAlive()) continue;

                    // 视线检测
                    const start = jk.GetEyePosition();
                    const end = target.GetEyePosition();
                    const ignoreList = [jk, target, ...allButtons];
                    const traceResult = Instance.TraceLine({
                        start,
                        end,
                        ignoreEntity: ignoreList,
                        ignorePlayers: false,
                        traceHitboxes: true
                    });
                    if (traceResult.didHit && traceResult.hitEntity !== undefined) {
                        continue; // 被遮挡
                    }

                    const dir = sub(target.GetAbsOrigin(), jkPos);
                    const dist = len3(dir);
                    if (dist < 1) continue;
                    const normDir = scale(dir, 1 / dist);
                    const d = dot(forward, normDir);
                    if (d >= FOV_COS && d > bestDot) {
                        bestDot = d;
                        bestTarget = target;
                    }
                }

                if (bestTarget) {
                    charging = true;
                    chargeTarget = bestTarget;
                    chargeStartTime = now;
                    jk.Teleport({ velocity: vec(0, 0, 0) });
                    fire("jk_model", "SetAnimationNotLooping", "slay0", 0);
                    fire("jk_slay_post", "enable", "", 0);
                    fire("jk_hitbox", "SetDamageFilter", "wudi", 0);
                    fire("jk_ui", "Deactivate", "", 0, undefined, jk);
                    fire("jk_sound0", "SetSoundEventName", "ambient.jk_slay1", 0);
                    fire("jk_sound0", "startsound", "", 0.02);
                    lastExecutionTime = now;
                }
            }
        }
    }

    Instance.SetNextThink(now + 1/64);
}