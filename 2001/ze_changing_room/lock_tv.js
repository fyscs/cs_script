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

// 视角向上偏移（度）。正值向下，负值向上。根据 VectorToAngles 的定义，向上应使用负值。
const PITCH_OFFSET_DEG = +10;
// 两个身位的后移距离（约 64 单位）
const BACK_OFFSET_DISTANCE = 96;

function Init()
{
    Instance.SetNextThink(0.001);
}

/**
 * @param {Vector} forward
 */
function VectorToAngles(forward)
{
    let yaw;
    let pitch;

    if (forward.y == 0 && forward.x == 0)
    {
        yaw = 0;
        if (forward.z > 0)
            pitch = 270;
        else
            pitch = 90;
    }
    else
    {
        yaw = (Math.atan2(forward.y, forward.x) * 180 / Math.PI);
        if (yaw < 0)
            yaw += 360;

        let tmp = Math.sqrt(forward.x*forward.x + forward.y*forward.y);
        pitch = (Math.atan2(-forward.z, tmp) * 180 / Math.PI);
        if (pitch < 0)
            pitch += 360;
    }

    return {
        pitch: pitch,
        yaw: yaw,
        roll: 0
    };
}

/**
 * @param {Vector} vector
 * @returns {Vector}
 */
function NormalizeVector(vector)
{
    const len = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z) || 1;
    return {
        x: vector.x / len,
        y: vector.y / len,
        z: vector.z / len
    };
}

/**
 * @param {number} deg
 */
function NormalizeAngle360(deg)
{
    let a = deg % 360;
    if (a < 0) a += 360;
    return a;
}

/**
 * @param {CSPlayerPawn} player
 * @param {QAngle} targetAngles
 */
function FaceForward(player, targetAngles)
{
    const slot = GetPlayerSlot(player);
    const basePos = state.cachedTargetPos ?? ((slot !== undefined && state.lockPos[slot]) ? state.lockPos[slot] : player.GetAbsOrigin());
    // 在目标朝向的反方向后移两个身位
    const yawRad = (targetAngles.yaw || 0) / 180 * Math.PI;
    const backX = Math.cos(yawRad) * BACK_OFFSET_DISTANCE;
    const backY = Math.sin(yawRad) * BACK_OFFSET_DISTANCE;
    const targetPos = { x: basePos.x - backX, y: basePos.y - backY, z: basePos.z + 10 };
    const ang = {
        pitch: NormalizeAngle360(targetAngles.pitch + PITCH_OFFSET_DEG),
        yaw: targetAngles.yaw,
        roll: 0
    };
    // 每帧强制同步角度与位置，确保持续锁定
    player.Teleport({ position: targetPos, angles: ang, velocity: { x: 0, y: 0, z: 0 } });
}

function FindTarget()
{
    const currentTime = Instance.GetGameTime();
    // 缓存目标实体，每5秒更新一次
    if (state.cachedTarget && state.cachedTarget.IsValid() && (currentTime - state.lastTargetUpdate) < 5.0)
    {
        return state.cachedTarget;
    }
    
    const ent = Instance.FindEntityByName(state.targetName);
    if (ent && ent.IsValid())
    {
        state.cachedTarget = ent;
        state.lastTargetUpdate = currentTime;
        return ent;
    }
    
    for (const e of Instance.FindEntitiesByClass("func_button"))
    {
        if (!e?.IsValid()) continue;
        if (e.GetEntityName && e.GetEntityName() === state.targetName)
        {
            state.cachedTarget = e;
            state.lastTargetUpdate = currentTime;
            return e;
        }
    }
    
    Instance.Msg(`[lock_tv] 未找到名称为 ${state.targetName} 的目标`);
    state.cachedTarget = undefined;
    state.lastTargetUpdate = currentTime;
    return undefined;
}

/**
 * @param {Entity | undefined} entity
 * @returns {number | undefined}
 */
function GetPlayerSlot(entity)
{
    if (!entity)
        return undefined;
    const maybePawn = /** @type {any} */(entity);
    if (typeof maybePawn.GetPlayerController === "function")
    {
        const controller = maybePawn.GetPlayerController();
        return controller?.GetPlayerSlot();
    }
    return undefined;
}

function UpdatePlayerCache()
{
    const currentTime = Instance.GetGameTime();
    // 每2秒更新一次玩家列表
    if ((currentTime - state.lastPlayerUpdate) < 2.0)
        return;
    
    state.cachedPlayers = [];
    for (const player of Instance.FindEntitiesByClass("player"))
    {
        if (player?.IsValid() && player.IsAlive())
        {
            state.cachedPlayers.push(/** @type {CSPlayerPawn} */ (player));
        }
    }
    state.lastPlayerUpdate = currentTime;
}

function ScriptThink()
{
    const hasPersonalLocks = state.lockedSlots && Object.keys(state.lockedSlots).length > 0;
    if (!state.lockingAll && !hasPersonalLocks)
    {
        Instance.SetNextThink(0.1); // 降低频率到10 FPS
        return;
    }

    const target = FindTarget();
    if (!target)
    {
        Instance.SetNextThink(0.1);
        return;
    }

    // 更新玩家缓存
    UpdatePlayerCache();

    const targetPos = target.GetAbsOrigin();
    const targetAngles = target.GetAbsAngles();
    state.cachedTargetPos = targetPos;
    
    // 使用缓存的玩家列表
    for (const playerPawn of state.cachedPlayers)
    {
        if (!playerPawn?.IsValid() || !playerPawn.IsAlive())
            continue;

        // 确保在锁定时记录初始位置
        const slotForInit = GetPlayerSlot(playerPawn);
        if (slotForInit !== undefined)
        {
            if (state.lockingAll && !state.lockPos[slotForInit])
            {
                state.lockPos[slotForInit] = playerPawn.GetAbsOrigin();
                const eye = playerPawn.GetEyePosition();
                const base = state.lockPos[slotForInit];
                state.eyeOffset[slotForInit] = { x: eye.x - base.x, y: eye.y - base.y, z: eye.z - base.z };
            }
            if (!state.lockingAll && !!state.lockedSlots[slotForInit] && !state.lockPos[slotForInit])
            {
                state.lockPos[slotForInit] = playerPawn.GetAbsOrigin();
                const eye = playerPawn.GetEyePosition();
                const base = state.lockPos[slotForInit];
                state.eyeOffset[slotForInit] = { x: eye.x - base.x, y: eye.y - base.y, z: eye.z - base.z };
            }
        }

        if (state.lockingAll)
        {
            FaceForward(playerPawn, targetAngles);
            continue;
        }

        const slot = GetPlayerSlot(playerPawn);
        if (slot !== undefined && !!state.lockedSlots[slot])
        {
            FaceForward(playerPawn, targetAngles);
        }
    }
    
    Instance.SetNextThink(0.02); // 只在有锁定玩家时使用高频率
}

Instance.OnScriptInput("StartAll", () => {
    const target = FindTarget();
    if (!target)
        return;
    
    // 更新玩家缓存
    UpdatePlayerCache();
    
    for (const player of state.cachedPlayers)
    {
        const slot = GetPlayerSlot(player);
        if (slot === undefined)
            continue;
        if (state.usedThisRound[slot])
            continue;
        state.usedThisRound[slot] = true;
        state.lockedSlots[slot] = true;
        if (!state.lockPos[slot])
        {
            state.lockPos[slot] = player.GetAbsOrigin();
            const eye = player.GetEyePosition();
            const base = state.lockPos[slot];
            state.eyeOffset[slot] = { x: eye.x - base.x, y: eye.y - base.y, z: eye.z - base.z };
        }
    }
    Instance.SetNextThink(0.02);
});

Instance.OnScriptInput("StopAll", () => {
    state.lockingAll = false;
    state.lockPos = {};
    state.eyeOffset = {};
});

// 针对触发者
Instance.OnScriptInput("Start", (inputData) => {
    const activator = inputData.activator;
    const slot = GetPlayerSlot(activator);
    if (slot === undefined)
        return;
    if (state.usedThisRound[slot])
        return;
    const target = FindTarget();
    if (!target)
        return;
    state.usedThisRound[slot] = true;
    state.lockedSlots[slot] = true;
    if (!!activator && !state.lockPos[slot])
    {
        state.lockPos[slot] = activator.GetAbsOrigin();
        const eye = activator.GetEyePosition();
        const base = state.lockPos[slot];
        state.eyeOffset[slot] = { x: eye.x - base.x, y: eye.y - base.y, z: eye.z - base.z };
    }
    Instance.SetNextThink(0.02);
});

Instance.OnScriptInput("Stop", (inputData) => {
    const activator = inputData.activator;
    const slot = GetPlayerSlot(activator);
    if (slot !== undefined)
    {
        delete state.lockedSlots[slot];
        delete state.lockPos[slot];
        delete state.eyeOffset[slot];
    }
});

// 回合开始时刷新一次性生效记录
Instance.OnRoundStart(() => {
    state.usedThisRound = {};
    state.lockedSlots = {};
    state.lockPos = {};
    state.eyeOffset = {};
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
        Init();
    }
});

Instance.SetThink(ScriptThink);
Instance.SetNextThink(0.1);


