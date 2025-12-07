import { Instance } from "cs_script/point_script";
/** @typedef {import("cs_script/point_script").Vector} Vector */
/** @typedef {import("cs_script/point_script").CSPlayerPawn} CSPlayerPawn */
/** @typedef {import("cs_script/point_script").Entity} Entity */
/** @typedef {import("cs_script/point_script").QAngle} QAngle */

// 锁定所有玩家视角与朝向到名为 tv 的实体
const state = {
    lockingAll: false,
    targetName: "tv",
    /** @type {Record<number, boolean>} */
    lockedSlots: {},
    /** @type {Record<number, Vector>} */
    lockPos: {},
    /** @type {Record<number, Vector>} */
    eyeOffset: {},
    /** @type {Vector | undefined} */
    cachedTargetPos: undefined,
    /** @type {Record<number, boolean>} */
    usedThisRound: {},
    /** @type {CSPlayerPawn[]} */
    cachedPlayers: [],
    /** @type {number} */
    lastPlayerUpdate: 0,
    /** @type {Entity | undefined} */
    cachedTarget: undefined,
    /** @type {number} */
    lastTargetUpdate: 0,
};

// 偏移与周期常量
/** @type {number} */
const PITCH_OFFSET_DEG = +10; // 正值向下，负值向上；此处保持现有行为为+10
/** @type {number} */
const BACK_OFFSET_DISTANCE = 96; // 两个身位的后移距离（约 64 单位）
/** @type {number} */
const TARGET_Z_OFFSET = 10;
/** @type {number} */
const TARGET_CACHE_SECONDS = 5.0;
/** @type {number} */
const PLAYER_CACHE_SECONDS = 2.0;
/** @type {number} */
const THINK_INTERVAL_ACTIVE = 0.02;
/** @type {number} */
const THINK_INTERVAL_IDLE = 0.1;

function Init() {
}

/**
 * @param {Vector} forward
 */
function VectorToAngles(forward) {
    let yaw;
    let pitch;

    if (forward.y === 0 && forward.x === 0) {
        yaw = 0;
        if (forward.z > 0) {
            pitch = 270;
        } else {
            pitch = 90;
        }
    } else {
        yaw = (Math.atan2(forward.y, forward.x) * 180 / Math.PI);
        if (yaw < 0) {
            yaw += 360;
        }

        const tmp = Math.sqrt(forward.x * forward.x + forward.y * forward.y);
        pitch = (Math.atan2(-forward.z, tmp) * 180 / Math.PI);
        if (pitch < 0) {
            pitch += 360;
        }
    }

    return {
        pitch,
        yaw,
        roll: 0
    };
}

/**
 * @param {number} deg
 */
function NormalizeAngle360(deg) {
    if (!Number.isFinite(deg)) return 0;
    let a = deg % 360;
    if (a < 0) a += 360;
    return a;
}

/**
 * @param {CSPlayerPawn} player
 * @param {QAngle} targetAngles
 */
function TeleportAndFaceTarget(player, targetAngles) {
    const slot = GetPlayerSlot(player);
    const basePos = state.cachedTargetPos || ((slot !== undefined && state.lockPos[slot]) ? state.lockPos[slot] : player.GetAbsOrigin());
    // 在目标朝向的反方向后移两个身位
    const yawRad = (targetAngles.yaw || 0) / 180 * Math.PI;
    const backX = Math.cos(yawRad) * BACK_OFFSET_DISTANCE;
    const backY = Math.sin(yawRad) * BACK_OFFSET_DISTANCE;
    const targetPos = { x: basePos.x - backX, y: basePos.y - backY, z: basePos.z + TARGET_Z_OFFSET };
    const ang = {
        pitch: NormalizeAngle360(targetAngles.pitch + PITCH_OFFSET_DEG),
        yaw: targetAngles.yaw,
        roll: 0
    };
    // 每帧强制同步角度与位置，确保持续锁定
    player.Teleport({ position: targetPos, angles: ang, velocity: { x: 0, y: 0, z: 0 } });
}

/**
 * 保障指定玩家位置信息已记录
 * @param {number} slot
 * @param {CSPlayerPawn} ent
 */
function ensureBaseline(slot, ent) {
    if (!state.lockPos[slot]) {
        state.lockPos[slot] = ent.GetAbsOrigin();
    }
}

function FindTarget() {
    const currentTime = Instance.GetGameTime();
    if (state.cachedTarget && state.cachedTarget.IsValid() && (currentTime - state.lastTargetUpdate) < TARGET_CACHE_SECONDS) {
        return state.cachedTarget;
    }
    
    const ent = Instance.FindEntityByName(state.targetName);
    if (ent && ent.IsValid()) {
        state.cachedTarget = ent;
        state.lastTargetUpdate = currentTime;
        return ent;
    }
    
    for (const e of Instance.FindEntitiesByClass("func_button")) {
        if (!e || !e.IsValid()) continue;
        if (e.GetEntityName && e.GetEntityName() === state.targetName) {
            state.cachedTarget = e;
            state.lastTargetUpdate = currentTime;
            return e;
        }
    }
    
    state.cachedTarget = undefined;
    state.lastTargetUpdate = currentTime;
    return undefined;
}

/**
 * @param {Entity | undefined} entity
 * @returns {number | undefined}
 */
function GetPlayerSlot(entity) {
    if (!entity) {
        return undefined;
    }
    const maybePawn = /** @type {any} */(entity);
    if (typeof maybePawn.GetPlayerController === "function") {
        const controller = maybePawn.GetPlayerController();
        return controller ? controller.GetPlayerSlot() : undefined;
    }
    return undefined;
}

function UpdatePlayerCache() {
    const currentTime = Instance.GetGameTime();
    if ((currentTime - state.lastPlayerUpdate) < PLAYER_CACHE_SECONDS) {
        return;
    }
    state.cachedPlayers = [];
    for (const player of Instance.FindEntitiesByClass("player")) {
        if (player && player.IsValid() && player.IsAlive()) {
            state.cachedPlayers.push(/** @type {CSPlayerPawn} */ (player));
        }
    }
    state.lastPlayerUpdate = currentTime;
}

function ScriptThink() {
    const hasPersonalLocks = state.lockedSlots && Object.keys(state.lockedSlots).length > 0;
    if (!state.lockingAll && !hasPersonalLocks) {
        Instance.SetNextThink(THINK_INTERVAL_IDLE);
        return;
    }

    const target = FindTarget();
    if (!target) {
        Instance.SetNextThink(THINK_INTERVAL_IDLE);
        return;
    }

    // 更新玩家缓存
    UpdatePlayerCache();

    const targetPos = target.GetAbsOrigin();
    const targetAngles = target.GetAbsAngles();
    state.cachedTargetPos = targetPos;
    
    for (const playerPawn of state.cachedPlayers) {
        if (!playerPawn || !playerPawn.IsValid() || !playerPawn.IsAlive()) {
            continue;
        }

        const slotForInit = GetPlayerSlot(playerPawn);
        if (slotForInit !== undefined) {
            if (state.lockingAll || (!!state.lockedSlots[slotForInit])) {
                ensureBaseline(slotForInit, playerPawn);
            }
        }

        if (state.lockingAll) {
            TeleportAndFaceTarget(playerPawn, targetAngles);
            continue;
        }

        const slot = GetPlayerSlot(playerPawn);
        if (slot !== undefined && !!state.lockedSlots[slot]) {
            TeleportAndFaceTarget(playerPawn, targetAngles);
        }
    }
    
    Instance.SetNextThink(THINK_INTERVAL_ACTIVE);
}

Instance.OnScriptInput("StartAll", () => {
    const target = FindTarget();
    if (!target) {
        return;
    }
    UpdatePlayerCache();
    state.lockingAll = true;
    for (const player of state.cachedPlayers) {
        const slot = GetPlayerSlot(player);
        if (slot === undefined) {
            continue;
        }
        if (state.usedThisRound[slot]) {
            continue;
        }
        state.usedThisRound[slot] = true;
        state.lockedSlots[slot] = true;
        ensureBaseline(slot, player);
    }
    Instance.SetNextThink(THINK_INTERVAL_ACTIVE);
});

Instance.OnScriptInput("StopAll", () => {
    state.lockingAll = false;
    state.lockPos = {};
});

// 针对触发者
Instance.OnScriptInput("Start", (inputData) => {
    const activator = inputData.activator;
    const slot = GetPlayerSlot(activator);
    if (slot === undefined) {
        return;
    }
    if (state.usedThisRound[slot]) {
        return;
    }
    const target = FindTarget();
    if (!target) {
        return;
    }
    state.usedThisRound[slot] = true;
    state.lockedSlots[slot] = true;
    if (!!activator) {
        ensureBaseline(slot, /** @type {CSPlayerPawn} */(activator));
    }
    Instance.SetNextThink(THINK_INTERVAL_ACTIVE);
});

Instance.OnScriptInput("Stop", (inputData) => {
    const activator = inputData.activator;
    const slot = GetPlayerSlot(activator);
    if (slot !== undefined) {
        delete state.lockedSlots[slot];
        delete state.lockPos[slot];
    }
});

// 回合开始时刷新一次性生效记录
Instance.OnRoundStart(() => {
    state.usedThisRound = {};
    state.lockedSlots = {};
    state.lockPos = {};
    state.lockingAll = false;
    state.cachedPlayers = [];
    state.lastPlayerUpdate = 0;
    state.cachedTarget = undefined;
    state.lastTargetUpdate = 0;
});

Instance.OnActivate(() => {
    Init();
});

Instance.OnScriptReload({
    after: () => {
    }
});

Instance.SetThink(ScriptThink);
Instance.SetNextThink(THINK_INTERVAL_IDLE);
