import { Instance } from "cs_script/point_script";

// by 凯岩城的狼

const SLIDE_SPEED = 150; // 水平滑行速度（单位/秒）
const MIN_ANGULAR_SPEED = 270; // 最小角速度（度/秒）
const MAX_ANGULAR_SPEED = 720; // 最大角速度（度/秒）
const THINK_INTERVAL = 0.01; // 脚本思考间隔（秒）

const state = {
    lastThinkTime: 0,
    // playerSlot -> { dir: {x,y,z}, angularSpeed: number, yaw: number, basePitch: number }
    activePlayers: {},
};

function IsValidPawn(entity) {
    try {
        return entity && entity.IsValid && entity.IsValid() && entity.GetPlayerController;
    } catch (e) {
        return false;
    }
}

function GetPlayerSlotFromEntity(entity) {
    try {
        const controller = entity.GetPlayerController && entity.GetPlayerController();
        return controller ? controller.GetPlayerSlot() : undefined;
    } catch (e) {
        return undefined;
    }
}

function YawToHorizontalUnit(yawDeg) {
    const yawRad = yawDeg / 180 * Math.PI;
    return { x: Math.cos(yawRad), y: Math.sin(yawRad), z: 0 };
}

function RandomAngularSpeed() {
    return MIN_ANGULAR_SPEED + Math.random() * (MAX_ANGULAR_SPEED - MIN_ANGULAR_SPEED);
}

function ClampAngle360(a) {
    let x = a % 360;
    if (x < 0) x += 360;
    return x;
}

function StartSpinSlide(activator) {
    try {
        if (!IsValidPawn(activator) || !activator.IsAlive()) {
            return;
        }
        const playerSlot = GetPlayerSlotFromEntity(activator);
        if (playerSlot === undefined) {
            return;
        }

        if (!state.activePlayers[playerSlot]) {
            const ang = (typeof activator.GetEyeAngles === "function" ? activator.GetEyeAngles() : activator.GetAbsAngles()) || {};
            state.activePlayers[playerSlot] = {
                dir: YawToHorizontalUnit(ang.yaw !== undefined ? ang.yaw : 0),
                angularSpeed: RandomAngularSpeed(),
                yaw: ang.yaw !== undefined ? ang.yaw : 0,
                basePitch: ang.pitch !== undefined ? ang.pitch : 0,
            };
        }
    } catch (e) {
        // 静默
    }
}

function StopSpinSlide(activator) {
    try {
        if (!IsValidPawn(activator)) {
            return;
        }
        const playerSlot = GetPlayerSlotFromEntity(activator);
        if (playerSlot === undefined) {
            return;
        }
        delete state.activePlayers[playerSlot];

        // 尝试清除水平速度
        const pawn = activator;
        if (pawn && pawn.IsValid()) {
            const currentVel = pawn.GetAbsVelocity();
            pawn.Teleport({ velocity: { x: 0, y: 0, z: currentVel.z } });
        }
    } catch (e) {
        // 静默
    }
}

function UpdatePlayerMotion(dt) {
    for (const key in state.activePlayers) {
        const playerSlot = Number(key);
        const motion = state.activePlayers[playerSlot];
        const controller = Instance.GetPlayerController(playerSlot);
        if (!controller) {
            delete state.activePlayers[playerSlot];
            continue;
        }
        const pawn = controller.GetPlayerPawn();
        if (!pawn || !pawn.IsValid() || !pawn.IsAlive()) {
            delete state.activePlayers[playerSlot];
            continue;
        }

        // 旋转：基于保存的连续 yaw 进行累加，避免每帧从实体读取引入量化误差
        motion.yaw = ClampAngle360(motion.yaw + motion.angularSpeed * dt);
        const newAngles = {
            pitch: motion.basePitch,
            yaw: motion.yaw,
            roll: 0
        };

        // 水平滑行（保持Z速度不变）
        const currentVel = pawn.GetAbsVelocity();
        const newVelocity = {
            x: motion.dir.x * SLIDE_SPEED,
            y: motion.dir.y * SLIDE_SPEED,
            z: currentVel.z
        };

        pawn.Teleport({ angles: newAngles, velocity: newVelocity });
    }
}

function ScriptThink() {
    const now = Instance.GetGameTime();
    const dt = state.lastThinkTime > 0 ? Math.max(0, now - state.lastThinkTime) : THINK_INTERVAL;
    state.lastThinkTime = now;

    try {
        UpdatePlayerMotion(dt);
    } catch (e) {
        // 静默
    }

    Instance.SetNextThink(THINK_INTERVAL);
}

function Init() {
    state.lastThinkTime = Instance.GetGameTime();
}

Instance.OnScriptInput("start", (inputData) => {
    StartSpinSlide(inputData.activator);
});

Instance.OnScriptInput("stop", (inputData) => {
    StopSpinSlide(inputData.activator);
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
Instance.SetNextThink(THINK_INTERVAL);
