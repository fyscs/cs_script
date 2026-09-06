import { Instance } from "cs_script/point_script";

// ===== Helper Functions  =====
function convertAddOutputString(s) {
    if (!s || typeof s !== "string") return s;
    const trimmed = s.trim();

    const gtCount = (trimmed.match(/>/g) || []).length;
    if (gtCount >= 5) return trimmed;

    const firstSpace = trimmed.indexOf(' ');
    if (firstSpace === -1) {
        const fallbackParts = trimmed.split(':');
        while (fallbackParts.length < 5) fallbackParts.push('');
        return fallbackParts.join('>');
    }

    const outputName = trimmed.slice(0, firstSpace).trim();
    const rest = trimmed.slice(firstSpace + 1);
    const parts = rest.split(':');

    let target = '';
    let inputName = '';
    let parameter = '';
    let delay = '';
    let times = '';

    if (parts.length >= 5) {
        target = parts[0].trim();
        inputName = parts[1].trim();
        parameter = parts.slice(2, parts.length - 2).join(':').trim();
        delay = parts[parts.length - 2].trim();
        times = parts[parts.length - 1].trim();
    } else if (parts.length === 4) {
        target = parts[0].trim();
        inputName = parts[1].trim();
        parameter = parts[2].trim();
        delay = parts[3].trim();
        times = '';
    } else if (parts.length === 3) {
        target = parts[0].trim();
        inputName = parts[1].trim();
        parameter = '';
        delay = parts[2].trim();
        times = '';
    } else if (parts.length === 2) {
        target = parts[0].trim();
        inputName = parts[1].trim();
    } else if (parts.length === 1) {
        target = parts[0].trim();
    }

    const keyvaluePattern = /^(origin|color|fogcolor|health|alpha|rendercolor|renderamt|scale)\s+/i;
    if (keyvaluePattern.test(parameter)) {
        inputName = "KeyValue";
    }

    return `${outputName}>${target}>${inputName}>${parameter}>${delay}>${times}`;
}

function EntFire(name, input, value = "", delay = 0) {
    if (input === "AddOutput" && typeof value === "string") {
        value = convertAddOutputString(value);
    }
    // Object form: the positional overload is deprecated in point_script.
    Instance.EntFireAtName({ name: name, input: input, value: value, delay: delay });
}

function EntFireByHandle(target, input, value, delay, a, b) {
    Instance.EntFireAtTarget({ target: target, input: input, value: value, delay: delay });
}

let _rngState = 0;
function _seedRngIfNeeded() {
    if (!_rngState) {
        _rngState = (Math.floor(Math.random() * 0xFFFFFFFF) >>> 0) || 1;
    }
}
function _xorshift32() {
    _seedRngIfNeeded();
    let x = _rngState >>> 0;
    x ^= (x << 13) >>> 0;
    x = x >>> 0;
    x ^= x >>> 17;
    x = x >>> 0;
    x ^= (x << 5) >>> 0;
    x = x >>> 0;
    _rngState = x;
    return x >>> 0;
}

function RandomInt(min, max) {
    min = Math.floor(min);
    max = Math.floor(max);
    if (isNaN(min) || isNaN(max)) return 0;
    if (max < min) {
        const t = min; min = max; max = t;
    }
    const range = (max - min) + 1;
    if (range <= 1) return min;

    const maxUInt = 0xFFFFFFFF >>> 0;
    const limit = maxUInt - ((maxUInt + 1) % range);
    let r;
    do {
        r = _xorshift32();
    } while (r > limit);
    return min + (r % range);
}

// ===== End Helper Functions =====

// Script loaded confirmation
const DEBUG_LOGGING = false;  // Set to true for verbose logging, false for production

function _log(level, message) {
    if (!DEBUG_LOGGING && level !== "ERROR" && level !== "WARN") {
        return;
    }

    Instance.Msg(`[${level}] ${message}`);
    try { Instance.ServerCommand(`echo [${level}] ${message}`); } catch (e) {}
}

_log("INIT", "st1boss.js script loaded!");

// Define `self` to reference the point_script entity executing this script
const SELF = Instance.FindEntityByName("st1_boss_script");
const self = SELF;

if (self) {
    _log("INIT", "st1_boss_script entity found");
} else {
    _log("ERROR", "st1_boss_script entity NOT found!");
}

// bossEntity is managed inside MovementSystem for portability

// Wrap Instance.OnScriptInput so a throwing handler can never break the input chain.
try {
    const _origOnScriptInput = Instance.OnScriptInput.bind(Instance);
    Instance.OnScriptInput = (name, callback) => {
        _origOnScriptInput(name, (inputData) => {
            try {
                callback(inputData);
            } catch (e) {
                if (DEBUG_LOGGING) {
                    try { Instance.Msg("[LOG] OnScriptInput callback error (" + name + "): " + e); } catch (e2) {}
                }
            }
        });
    };
} catch (e) {
    // ignore
}

_log("INIT", "Registering OnScriptInput handlers...");
Instance.OnScriptInput("TickHealth", () => {
    if (!cicholBoss.tickSystemRunning) {
        cicholBoss.tickSystemRunning = true;
        cicholBoss.startTickSystem();
    }
});
Instance.OnScriptInput("TickHealthUpdate", () => {
    cicholBoss.tickHealth();
});
Instance.OnScriptInput("Stop", () => cicholBoss.movement.stop());
Instance.OnScriptInput("StartCicholAttack", () => cicholBoss.startCicholAttack());
Instance.OnScriptInput("CicholShock", () => cicholBoss.cicholShock());
Instance.OnScriptInput("CicholShockWave", () => cicholBoss.cicholShockWave());
Instance.OnScriptInput("Resume", () => cicholBoss.movement.resume());
Instance.OnScriptInput("CicholShockSpawn", () => cicholBoss.cicholShockSpawn());
Instance.OnScriptInput("CicholShockReset", () => cicholBoss.cicholShockReset());
Instance.OnScriptInput("Pause", () => cicholBoss.movement.pause());
Instance.OnScriptInput("MovementRotationTick", () => cicholBoss.movement.rotationTick());
Instance.OnScriptInput("MovementTick", () => cicholBoss.movement.tick());
Instance.OnScriptInput("BeginMovement", () => { try { cicholBoss.movement._beginStart(); } catch (e) {} });

// Auto-register OnScriptInput for all main functions
Instance.OnScriptInput("AddHealth", () => cicholBoss.addHealth());
Instance.OnScriptInput("AddHealthbyPlayer", () => cicholBoss.addHealth(320));
Instance.OnScriptInput("AddHealthbyPlayer2", () => cicholBoss.addHealth(120));
Instance.OnScriptInput("SubHealthbyShoot", () => cicholBoss.subHealthByShoot());
Instance.OnScriptInput("SubHealthbyNade", () => cicholBoss.subHealthByNade());
Instance.OnScriptInput("SubHealthbyItem", () => cicholBoss.subHealth(1));
Instance.OnScriptInput("InstaKill", () => cicholBoss.subHealth(999));
Instance.OnScriptInput("SubHealth", () => cicholBoss.subHealth());
Instance.OnScriptInput("Setminiboss", () => cicholBoss.setMiniboss());
Instance.OnScriptInput("HPText", () => cicholBoss.hpText(true));
Instance.OnScriptInput("BossKilled", () => cicholBoss.bossKilled());
Instance.OnScriptInput("ToggleATKtick", () => cicholBoss.toggleATKtick());
Instance.OnScriptInput("CicholHoly", () => cicholBoss.cicholHoly());
Instance.OnScriptInput("CicholFire", () => cicholBoss.cicholFire());
Instance.OnScriptInput("CicholPush", () => cicholBoss.CicholPush());
Instance.OnScriptInput("CicholGravity", () => cicholBoss.CicholGravity());
Instance.OnScriptInput("CicholTrueDamage", () => cicholBoss.CicholTrueDamage());
Instance.OnScriptInput("Start", () => {
    Instance.Msg("[HANDLER] Start input received!");
    try { Instance.ServerCommand("echo [HANDLER] Start input received!"); } catch (e) {}
    try { cicholBoss.resetState(); } catch (e) {}

    // Trigger entry visual/effect immediately
    try {
        Instance.EntFireAtName({ name: "yellow_fade", input: "Fade", delay: 5.00 });
        Instance.EntFireAtName({ name: "st1_boss_model", input: "Alpha", value: "255", delay: 5.20 });
        Instance.EntFireAtName({ name: "st1_boss_back_part", input: "Start", delay: 5.00 });
        Instance.EntFireAtName({ name: "st1_Boss_text", input: "Enable", delay: 5.00 });
        Instance.EntFireAtName({ name: "st1_boss_tp_part1", input: "Start", delay: 0.00 });
        Instance.EntFireAtName({ name: "st1_boss_tp_part2", input: "Start", delay: 5.00 });
        
    } catch (e) {}

    // Schedule movement start (movement.start will respect this.config.startDelaySeconds)
    cicholBoss.movement.start();
    _log("INIT", "Start received: visuals fired, movement scheduled according to startDelaySeconds");
});
Instance.OnScriptInput("SetSpeedForw", (inputData) => {
    const speed = parseFloat(inputData.value) || 1.0;
    cicholBoss.movement.setSpeedMultiplier(speed);
});
Instance.OnScriptInput("TestTempleGateYaw45", () => {
    const gate = Instance.FindEntityByName("temple_gate_10");

    if (!gate || !gate.IsValid || !gate.IsValid()) {
        _log("WARN", "TestTempleGateYaw45: temple_gate_10 not found or invalid");
        return;
    }

    const position = gate.GetAbsOrigin();
    const angles = gate.GetAbsAngles();

    gate.Teleport({
        position: position,
        angles: {
            pitch: angles.pitch,
            yaw: 45,
            roll: angles.roll
        }
    });

    _log("LOG", "TestTempleGateYaw45: teleported temple_gate_10 to yaw 45");
});
Instance.OnScriptInput("SearchTarget", () => cicholBoss.movement.searchTarget());
Instance.OnScriptInput("GetTargetYaw", () => {
    // Legacy function, kept for compatibility
});
Instance.OnScriptInput("GetDistance", () => {
    // Legacy function, kept for compatibility
});
Instance.OnScriptInput("BossTimeOver", () => {
    let players = Instance.FindEntitiesByClass("player");
    for (let p of players) {
        if (p.GetTeamNumber() == 3) {
            p.TakeDamage({ damage: 99999 });
        }
    }
});
Instance.OnScriptInput("MarkMoversReady", () => {
    cicholBoss.movement.markMoversReady();
});
Instance.OnScriptInput("MovementReady", () => {
    cicholBoss.movement.markMoversReady();
});
_log("INIT", "All OnScriptInput handlers registered!");

// Round lifecycle handlers to reset state between rounds
try {
    Instance.OnRoundEnd((_event) => {
        try { cicholBoss.miniboss = 0; } catch (e) {}
        try { cicholBoss.resetState(); } catch (e) {}
    });

    Instance.OnRoundStart(() => {
        try { cicholBoss.miniboss = 0; } catch (e) {}
        try { cicholBoss.resetState(); } catch (e) {}
    });
} catch (e) {
    // ignore
}

//==============================================================//
//     MOVEMENT SYSTEM                                          //
//==============================================================//
const MOVEMENT_DEBUG_LOGGING = false;
function log(level, message) {
    if (MOVEMENT_DEBUG_LOGGING) _log(level, message);
}
const MIN_MOVEMENT_LOOP_INTERVAL = 0.1;
const MOVEMENT_STEP_RATE = 0.02;
const defaultConfig = {
    scriptEntityName: "st1_boss_script",

    // 追尾移動を行うentity。
    moverEntityName: "st1_boss_mover",
    bossEntityName: "st1_boss_mover",

    // 角度を変えるentity。
    rotEntityName: "st1_boss_rot",

    modelEntityName: "st1_boss_model",
    measureEntityName: "st1_boss_measure_movement",
    measureTargetName: null,
    measureReferenceName: null,
    targetReferenceName: null,

    tickRate: MIN_MOVEMENT_LOOP_INTERVAL,
    rotationTickRate: MIN_MOVEMENT_LOOP_INTERVAL,
    movementStepRate: MOVEMENT_STEP_RATE,
    rotationStepRate: MOVEMENT_STEP_RATE,

    targetDistance: 5000,
    maxSpeed: 450,
    acceleration: 0.3,
    minDistanceToTarget: 50,
    targetRetargetInterval: 2.0,

    // モデルの向きがズレる場合はここを調整。
    // 例: -90, 0, 90, 180
    rotationOffset: -90,

    enableZMovement: false,

    onStart: null
};
// Helper to create a movement system with per-stage overrides
function createMovementSystem(overrides = {}) {
    const moverEntityName = overrides.moverEntityName || overrides.bossEntityName || "st1_boss_mover";
    return new MovementSystem({
        ...defaultConfig,

        moverEntityName: moverEntityName,
        bossEntityName: moverEntityName,
        rotEntityName: overrides.rotEntityName || overrides.bossRotateName || "st1_boss_rot",
        modelEntityName: overrides.modelEntityName || overrides.bossModelName || "st1_boss_model",
        measureEntityName: overrides.measureEntityName || overrides.logicMeasureName || "st1_boss_measure_movement",

        tickRate: overrides.tickRate ?? defaultConfig.tickRate,
        rotationTickRate: overrides.rotationTickRate ?? defaultConfig.rotationTickRate,
        movementStepRate: overrides.movementStepRate ?? defaultConfig.movementStepRate,
        rotationStepRate: overrides.rotationStepRate ?? defaultConfig.rotationStepRate,
        targetDistance: overrides.targetDistance ?? defaultConfig.targetDistance,
        maxSpeed: overrides.maxSpeed ?? defaultConfig.maxSpeed,
        acceleration: overrides.acceleration ?? defaultConfig.acceleration,
        enableZMovement: overrides.enableZMovement ?? defaultConfig.enableZMovement,

        //
        ...overrides
    });
}

class MovementSystem {
    constructor(config) {
        this.config = { ...defaultConfig, ...config };

        // Hot-path config cache: tick()/rotation run at up to 50Hz, so the
        // per-frame values are hoisted out of the config object once here.
        const cfg = this.config;
        this.scriptEntityName = cfg.scriptEntityName;
        this.tickRate = Math.max(MIN_MOVEMENT_LOOP_INTERVAL, cfg.tickRate);
        this.rotationTickRate = Math.max(MIN_MOVEMENT_LOOP_INTERVAL, cfg.rotationTickRate);
        this.movementStepRate = cfg.movementStepRate;
        this.rotationStepRate = cfg.rotationStepRate;
        this.maxSpeed = cfg.maxSpeed;
        this.acceleration = cfg.acceleration;
        this.minDistanceToTarget = cfg.minDistanceToTarget;
        this.targetRetargetInterval = cfg.targetRetargetInterval;
        this.rotationOffset = cfg.rotationOffset;
        this.enableZMovement = cfg.enableZMovement;
        this.targetDistanceSq = cfg.targetDistance * cfg.targetDistance;
        this.maxRotPerTick = 360.0 * this.rotationStepRate;

        // When both tick rates match, rotation is folded into the movement tick
        // so only one RunScriptInput chain has to be scheduled per frame.
        this.rotationMerged = (this.rotationTickRate === this.tickRate);

        this.moverEntity = null;
        this.bossEntity = null;
        this.rotEntity = null;
        this.modelEntity = null;
        this.measureEntity = null;
        this.target = null;

        this.isRunning = false;
        this.isPaused = false;

        this.currentPos = { x: 0, y: 0, z: 0 };
        this.currentVelocityX = 0.0;
        this.currentVelocityY = 0.0;

        this.speedMultiplier = 1.0;
        this.lastLogTime = -999.0;
        this.lastTargetRetargetTime = -999.0;

        // Throttle for retries while no valid target exists (a failed search
        // still costs a full FindEntitiesByClass sweep).
        this.nextTargetSearchTime = -999.0;
        this.noTargetSearchInterval = 0.2;
    }

    findEntities() {
        this.moverEntity = Instance.FindEntityByName(this.config.moverEntityName || this.config.bossEntityName);
        this.bossEntity = this.moverEntity;
        this.rotEntity = Instance.FindEntityByName(this.config.rotEntityName);
        this.modelEntity = this.config.modelEntityName
            ? Instance.FindEntityByName(this.config.modelEntityName)
            : null;
        this.measureEntity = this.config.measureEntityName
            ? Instance.FindEntityByName(this.config.measureEntityName)
            : null;

        if (!this.moverEntity) {
            log("ERROR", "Missing moverEntityName: " + (this.config.moverEntityName || this.config.bossEntityName));
            return false;
        }

        if (!this.rotEntity) {
            this.rotEntity = this.moverEntity;
        }

        return true;
    }

    start() {
        // Support optional start delay via this.config.startDelaySeconds
        if (this.isRunning) return;
        if (!this.findEntities()) return;

        const delay = (this.config && this.config.startDelaySeconds) ? Number(this.config.startDelaySeconds) : 0.0;
        if (delay > 0.0) {
            try {
                Instance.EntFireAtName({ name: this.config.scriptEntityName, input: "RunScriptInput", value: "BeginMovement", delay: delay });
            } catch (e) {
                // fallback to immediate start if scheduling fails
                try { this._beginStart(); } catch (e2) {}
            }
            return;
        }

        // Immediate start when no delay configured
        this._beginStart();
    }

    _beginStart() {
        try {
            if (this.isRunning) return;
            if (!this.findEntities()) return;

            this.currentPos = this.moverEntity.GetAbsOrigin();

            this.isRunning = true;
            this.isPaused = false;
            this.lastTargetRetargetTime = -999.0;
            this.nextTargetSearchTime = -999.0;
            this.searchTarget();

            this.scheduleNextTick();
            if (!this.rotationMerged) this.scheduleNextRotationTick();

            // Configure logic_measure_movement exactly like the working desktop version
            try {
                const measureTargetName = this.config.measureTargetName || this.config.rotEntityName;
                let measureReferenceName = this.config.measureReferenceName || this.config.bossHitboxName;
                const targetReferenceName = this.config.targetReferenceName || this.config.bossHitboxName;

                if (measureTargetName === measureReferenceName) {
                    measureReferenceName = this.config.moverEntityName || this.config.bossEntityName;
                    log("WARN", "measureTargetName equals measureReferenceName; fallback reference to " + measureReferenceName);
                }

                Instance.EntFireAtName({ name: this.config.measureEntityName, input: "SetMeasureTarget", value: measureTargetName, delay: 0.00 });
                Instance.EntFireAtName({ name: this.config.measureEntityName, input: "SetTarget", value: this.config.modelEntityName, delay: 0.00 });
                Instance.EntFireAtName({ name: this.config.measureEntityName, input: "SetMeasureReference", value: measureReferenceName, delay: 0.00 });
                Instance.EntFireAtName({ name: this.config.measureEntityName, input: "SetTargetReference", value: targetReferenceName, delay: 0.00 });
                Instance.EntFireAtName({ name: this.config.measureEntityName, input: "Enable", delay: 0.00 });
            } catch (e) {
                log("WARN", "Failed to configure logic_measure_movement (desktop mode): " + e);
            }

            // Start HP tick and enable attack scheduler now that movement begins.
            // Guarded so a TickHealth input that already started the chain does
            // not leave two RunScriptInput chains running in parallel.
            try {
                if (!cicholBoss.tickSystemRunning) {
                    cicholBoss.tickSystemRunning = true;
                    cicholBoss.startTickSystem();
                }
            } catch (e) {}
            try {
                // allow attacks and process any deferred init request
                cicholBoss.allowAttacks = true;
                cicholBoss.pendingInitAttack = false;
                cicholBoss.initAttackSystem();
            } catch (e) {}

            try {
                cicholBoss.damageEnabled = true;
                Instance.EntFireAtName({ name: "hfire_but", input: "AddOutput", value: "OnUser4>st1_boss_damage>FireUser1>>0>-1", delay: 0.02 });
                Instance.EntFireAtName({ name: "hgrav_but", input: "AddOutput", value: "OnUser4>st1_boss_damage>FireUser1>>0>-1", delay: 0.02 });
                Instance.EntFireAtName({ name: "hice_but", input: "AddOutput", value: "OnUser4>st1_boss_stop_damage>FireUser1>>0>-1", delay: 0.02 });
                Instance.EntFireAtName({ name: "hstop_but", input: "AddOutput", value: "OnUser4>st1_boss_stop_damage>FireUser1>>0>-1", delay: 0.02 });
            } catch (e) {}

            if (typeof this.config.onStart === "function") {
                try {
                    this.config.onStart(this);
                } catch (e) {
                    log("WARN", "onStart failed: " + e);
                }
            }
        } catch (e) {
            // swallow errors to avoid breaking scheduling
        }
    }

    stop() {
        this.isRunning = false;
        this.target = null;
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        // Only a paused system restarts the rotation chain. Without this guard a
        // stray Resume (overlapping attacks fire Pause/Resume pairs) would spawn
        // an extra rotation chain that never dies, doubling the rotation rate.
        if (!this.isPaused) return;
        this.isPaused = false;
        if (this.isRunning && !this.rotationMerged) {
            this.scheduleNextRotationTick();
        }
    }

    setSpeedMultiplier(speed) {
        this.speedMultiplier = speed;
    }

    normalizeYaw(yaw) {
        let value = yaw;
        while (value < 0) value += 360;
        while (value >= 360) value -= 360;
        return value;
    }

    shortestYawDiff(targetYaw, currentYaw) {
        let diff = targetYaw - currentYaw;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        return diff;
    }

    stepYaw(currentYaw, targetYaw) {
        const normalizedCurrent = this.normalizeYaw(currentYaw);
        if (targetYaw === null || targetYaw === undefined) {
            return normalizedCurrent;
        }

        const diff = this.shortestYawDiff(targetYaw, normalizedCurrent);
        const maxRotSpeed = this.maxRotPerTick;
        const rotAmount = Math.max(-maxRotSpeed, Math.min(maxRotSpeed, diff));
        return this.normalizeYaw(normalizedCurrent + rotAmount);
    }

    getFacingYaw(fromPos, targetPos) {
        const deltaX = targetPos.x - fromPos.x;
        const deltaY = targetPos.y - fromPos.y;

        if ((deltaX * deltaX + deltaY * deltaY) < 1.0) {
            return null;
        }

        let targetYaw = Math.atan2(deltaY, deltaX) * (180.0 / Math.PI);
        if (targetYaw < 0) targetYaw += 360;
        targetYaw += this.rotationOffset;
        return this.normalizeYaw(targetYaw);
    }

    applyMoverTransform(position) {
        if (!this.moverEntity || !this.moverEntity.IsValid()) {
            return;
        }

        this.moverEntity.Teleport({ position: position });
    }

    applyRotYaw(yaw) {
        if (!this.rotEntity || !this.rotEntity.IsValid()) {
            return;
        }

        this.rotEntity.Teleport({
            angles: {
                pitch: 0,
                yaw: yaw,
                roll: 0
            }
        });
    }

    markMoversReady() {
        // No-op: teleport-based movement needs no mover hand-shake.
    }

    scheduleNextTick() {
        if (!this.isRunning) return;

        Instance.EntFireAtName({
            name: this.scriptEntityName,
            input: "RunScriptInput",
            value: "MovementTick",
            delay: this.tickRate
        });
    }

    scheduleNextRotationTick() {
        if (!this.isRunning) return;

        Instance.EntFireAtName({
            name: this.scriptEntityName,
            input: "RunScriptInput",
            value: "MovementRotationTick",
            delay: this.rotationTickRate
        });
    }

    tick() {
        if (!this.isRunning) {
            return;
        }

        this.scheduleNextTick();

        const mover = this.moverEntity;
        if (!mover || !mover.IsValid()) {
            log("ERROR", "Mover entity lost");
            return;
        }

        const now = Instance.GetGameTime();
        const pos = mover.GetAbsOrigin();
        this.currentPos = pos;

        const tickRate = this.movementStepRate;
        const maxSpeed = this.maxSpeed;
        const acceleration = this.acceleration;
        let distance = 0.0;

        const target = this.isPaused ? null : this.acquireTarget(now);

        // searchTarget() may have replaced currentPos with its own snapshot;
        // keep it pointing at the vector this tick actually integrates.
        this.currentPos = pos;

        if (target) {
            const targetPos = target.GetAbsOrigin();

            const deltaX = targetPos.x - pos.x;
            const deltaY = targetPos.y - pos.y;

            distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            if (distance < this.minDistanceToTarget) {
                this.currentVelocityX *= 0.5;
                this.currentVelocityY *= 0.5;

                if (Math.abs(this.currentVelocityX) < 1.0) this.currentVelocityX = 0.0;
                if (Math.abs(this.currentVelocityY) < 1.0) this.currentVelocityY = 0.0;
            } else {
                // Single reciprocal instead of two divisions by `distance`.
                const speedScale = (maxSpeed * this.speedMultiplier) / distance;
                const desiredVelX = deltaX * speedScale;
                const desiredVelY = deltaY * speedScale;

                let velX = this.currentVelocityX + (desiredVelX - this.currentVelocityX) * acceleration;
                let velY = this.currentVelocityY + (desiredVelY - this.currentVelocityY) * acceleration;

                if (velX > maxSpeed) velX = maxSpeed;
                else if (velX < -maxSpeed) velX = -maxSpeed;

                if (velY > maxSpeed) velY = maxSpeed;
                else if (velY < -maxSpeed) velY = -maxSpeed;

                this.currentVelocityX = velX;
                this.currentVelocityY = velY;

                if (this.enableZMovement) {
                    const deltaZ = targetPos.z - pos.z;

                    if (deltaZ > 10) {
                        pos.z += maxSpeed * tickRate;
                    } else if (deltaZ < -10) {
                        pos.z -= maxSpeed * tickRate;
                    }
                }
            }
        } else {
            this.currentVelocityX *= (1.0 - acceleration);
            this.currentVelocityY *= (1.0 - acceleration);

            if (Math.abs(this.currentVelocityX) < 1.0) this.currentVelocityX = 0.0;
            if (Math.abs(this.currentVelocityY) < 1.0) this.currentVelocityY = 0.0;
        }

        pos.x += this.currentVelocityX * tickRate;
        pos.y += this.currentVelocityY * tickRate;

        this.applyMoverTransform(pos);

        if (this.rotationMerged) {
            this.updateRotation(pos);
        }

        this.refreshTargetIfNeeded(now);

        if (DEBUG_LOGGING) {
            if ((now - this.lastLogTime) >= 2.0) {
                this.lastLogTime = now;
                log(
                    "DEBUG",
                    "dist=" + distance.toFixed(1) +
                    " velX=" + this.currentVelocityX.toFixed(1) +
                    " velY=" + this.currentVelocityY.toFixed(1)
                );
            }
        }
    }

    rotationTick() {
        if (!this.isRunning || this.isPaused) {
            return;
        }

        // When tickRate === rotationTickRate the rotation already runs inside
        // tick(); this chain is not scheduled at all in that case.
        if (this.rotationMerged) {
            return;
        }

        this.scheduleNextRotationTick();

        if (!this.target || !this.target.IsValid()) {
            this.acquireTarget(Instance.GetGameTime());
        }

        const mover = this.moverEntity;
        const moverPos = (mover && mover.IsValid()) ? mover.GetAbsOrigin() : this.currentPos;
        this.updateRotation(moverPos);
    }

    updateRotation(moverPos) {
        if (this.isPaused) {
            return;
        }

        const rot = this.rotEntity;
        if (!rot || !rot.IsValid()) {
            log("ERROR", "Rot entity lost");
            return;
        }

        const target = this.target;
        if (!target || !target.IsValid()) {
            return;
        }

        const targetYaw = this.getFacingYaw(moverPos, target.GetAbsOrigin());
        if (targetYaw === null) {
            return;
        }

        this.applyRotYaw(this.stepYaw(rot.GetAbsAngles().yaw, targetYaw));
    }

    /**
     * Returns the current target, searching for a new one when it is gone.
     * A failed search is throttled: without it, a boss with no players in range
     * would run a full FindEntitiesByClass sweep on every single tick.
     */
    acquireTarget(now) {
        const target = this.target;
        if (target && target.IsValid()) {
            return target;
        }

        if (now < this.nextTargetSearchTime) {
            return null;
        }
        this.nextTargetSearchTime = now + this.noTargetSearchInterval;

        this.searchTarget();

        const found = this.target;
        return (found && found.IsValid()) ? found : null;
    }

    refreshTargetIfNeeded(now, force = false) {
        if (!this.isRunning || this.isPaused) {
            return;
        }

        if (now === undefined || now === null) {
            now = Instance.GetGameTime();
        }

        if (!force && (now - this.lastTargetRetargetTime) < this.targetRetargetInterval) {
            return;
        }

        this.lastTargetRetargetTime = now;
        this.searchTarget(force);
    }

    searchTarget(forceRetarget = false) {
        const previousTarget = this.target;
        this.target = null;

        // start前や外部呼び出し時でも原点基準にならないよう、現在位置を更新する。
        if (this.moverEntity && this.moverEntity.IsValid()) {
            this.currentPos = this.moverEntity.GetAbsOrigin();
        }

        const originX = this.currentPos.x;
        const originY = this.currentPos.y;
        const originZ = this.currentPos.z;
        const maxDistSq = this.targetDistanceSq;

        const players = Instance.FindEntitiesByClass("player") || [];
        const candidates = [];

        for (const player of players) {
            // Cheap rejects first; the position read and the distance test only
            // run for living CT-side players. Squared distance avoids the sqrt.
            if (player.GetTeamNumber() !== 3) continue;
            if (player.GetHealth() <= 0) continue;

            const pos = player.GetAbsOrigin();
            const dx = pos.x - originX;
            const dy = pos.y - originY;
            const dz = pos.z - originZ;

            if ((dx * dx + dy * dy + dz * dz) > maxDistSq) continue;

            candidates.push(player);
        }

        if (forceRetarget && previousTarget && candidates.length > 1) {
            const index = candidates.indexOf(previousTarget);
            if (index !== -1) {
                candidates[index] = candidates[candidates.length - 1];
                candidates.pop();
            }
        }

        if (candidates.length > 0) {
            this.target = candidates.length === 1
                ? candidates[0]
                : candidates[RandomInt(0, candidates.length - 1)];
        }
    }
}

//==============================================================//
//     CICHOL BOSS SYSTEM - CLASS-BASED ARCHITECTURE            //
//==============================================================//

class CicholBossSystem {
    constructor() {
        this.bossHealth = 300.00;
        this.bossKill = 0;
        this.miniboss = 0;
        this.player = 0;
        this.atkTick = true;
        this.atkCycle = 6;
        this.attackDispatchDelaySeconds = 0.15;
        this.shockTarget = null;
        this.shockPool = null; // Remaining shock targets for the current wave
        this.attackDeck = [];
        this.attackDeckCursor = 0;
        this.lastAttackInput = null;
        this.holyTemp = Instance.FindEntityByName("st1_boss_holy_template");
        this.shockTemp = Instance.FindEntityByName("st1_boss_shock_template");
        this.tickSystemRunning = false;
        this.atkSchedulerRunning = false;
        this.allowAttacks = false; // blocks attacks until movement truly begins
        this.pendingInitAttack = false;
        this.damageEnabled = false;
        this.lastHpTextValue = null; // last value pushed to the HP text entity

        // Movement system (override default config only where needed)
        this.movement = createMovementSystem({
            moverEntityName: "st1_boss_mover",
            bossEntityName: "st1_boss_mover",
            bossHitboxName: "st1_boss_physbreak",
            bossModelName: "st1_boss_model",
            logicMeasureName: "st1_boss_measure_movement",
            // Back to stable setup: measure rotation from rot entity.
            measureTargetName: "st1_boss_rot",
            measureReferenceName: "st1_boss_physbreak",
            targetReferenceName: "st1_boss_physbreak",
            rotEntityName: "st1_boss_rot",
            enableZMovement: false,
            tickRate: MIN_MOVEMENT_LOOP_INTERVAL,
            rotationTickRate: MIN_MOVEMENT_LOOP_INTERVAL,
            movementStepRate: MOVEMENT_STEP_RATE,
            rotationStepRate: MOVEMENT_STEP_RATE,
            rotationOffset: 0,
            startDelaySeconds: 7.0,
            targetDistance: 5000,
            maxSpeed: 350,
            acceleration: 0.3
        });
        
        _log("INIT", "CicholBossSystem initialized");
        _log("DEBUG", "holyTemp found: " + (this.holyTemp && this.holyTemp.IsValid ? "YES" : "NO"));
        _log("DEBUG", "shockTemp found: " + (this.shockTemp && this.shockTemp.IsValid ? "YES" : "NO"));
    }

    resetState() {
        this.bossKill = 0;
        this.player = 0;
        this.atkTick = true;
        this.allowAttacks = false;
        this.pendingInitAttack = false;
        this.damageEnabled = false;
        this.shockTarget = null;
        this.shockPool = null;
        this.tickSystemRunning = false;
        this.atkSchedulerRunning = false;
        this.lastHpTextValue = null;
        this.attackDeck = [];
        this.attackDeckCursor = 0;
        this.lastAttackInput = null;

        try { this.movement?.stop(); } catch (e) {}
        try { this.movement?.resume(); } catch (e) {}
    }

    addHealth(value) {
        // Guard: the bare "AddHealth" input passes no value, and `+= undefined`
        // turns bossHealth into NaN, after which `bossHealth < 1` is never true
        // and the boss can no longer be killed.
        const amount = Number(value);
        const healthPerPlayer = isFinite(amount) ? amount : 0;

        if (DEBUG_LOGGING) _log("LOG", "addHealth(" + value + ") called");

        const players = Instance.FindEntitiesByClass("player");
        for (const p of players) {
            if (p.GetTeamNumber() == 3) {
                this.bossHealth += healthPerPlayer;
                this.player++;
            }
        }
    }

    subHealthByShoot() {
        // Fired once per bullet hit, so the guard comes before any logging work.
        if (!this.damageEnabled) return;
        if (DEBUG_LOGGING) _log("LOG", "subHealthByShoot() called");
        this.bossHealth--;
    }

    subHealthByNade() {
        if (!this.damageEnabled) return;
        if (DEBUG_LOGGING) _log("LOG", "subHealthByNade() called");
        this.bossHealth -= 30;
    }

    subHealth(value) {
        if (!this.damageEnabled) return;
        if (DEBUG_LOGGING) _log("LOG", "subHealth(" + value + ") called");
        if (value == 0) {
            this.bossHealth -= 120;
        } else if (value == 1) {
            this.bossHealth -= 150;
        } else if (value == 999) {
            this.bossHealth -= 999999;
        }
    }

    setMiniboss() {
        _log("LOG", "setMiniboss() called");
        this.bossHealth = 300;
        this.miniboss = 1;
    }

    startTickSystem() {
        if (DEBUG_LOGGING) {
            _log("LOG", "startTickSystem() called");
        }
        EntFireByHandle(self, "RunScriptInput", "TickHealthUpdate", 0.1, null, null);
    }

    tickHealth() {
        try {
            if (this.bossHealth < 1) {
                if (this.bossKill == 0) {
                    _log("LOG", "Boss killed");
                    this.bossKilled();
                    this.bossKill = 1;
                    this.atkTick = false;
                }
                // The chain ends here; keep the flag in sync with reality so a
                // later TickHealth input can start a fresh one.
                this.tickSystemRunning = false;
                return;
            }

            this.hpText();

            if (!this.tickSystemRunning) return;
            EntFireByHandle(self, "RunScriptInput", "TickHealthUpdate", 0.1, null, null);
        } catch (e) {
            if (DEBUG_LOGGING) {
                _log("ERROR", "tickHealth error: " + e);
            }
        }
    }

    hpText(force = false) {
        try {
            // Runs 10x/s from the health tick. The HP number only changes when
            // the boss is actually hit, so skip the redundant SetMessage fires.
            const health = this.bossHealth > 0 ? this.bossHealth : 0;
            if (!force && health === this.lastHpTextValue) return;
            this.lastHpTextValue = health;

            EntFire("st1_Boss_text", "SetMessage", `< Cichol >\n HP: ${health}`, 0.00, null);
        } catch (e) {
            _log("ERROR", "hpText error: " + e);
        }
    }

    bossKilled() {
        _log("LOG", "bossKilled() called");
        this.bossHealth = 0;
        try {
            this.hpText(true);
        } catch (e) {}
        if (this.miniboss == 0) {
            EntFire("Boss1_After_Relay", "FireUser1", "", 0.00, null);
            EntFire("st1_boss_partafter", "Start", "", 0.00, null);
            EntFire("st1_boss_model", "SetAnimation", "cichol_tired", 0.00, null);
            //EntFire("st1_boss_model", "KeyValue", "targetname st1_boss1_ragdoll", 0.01, null);
            EntFire("st1_boss_model", "ClearParent", "", 0.00, null);
            EntFire("st1_Boss_text", "Kill", "", 5.0, null);

            EntFire("st1_Boss_tp_part1", "Stop", "", 0, null);
            EntFire("st1_Boss_tp_part2", "Stop", "", 0, null);
            EntFire("st1_Boss_tp_part1", "Start", "", 0.02, null);
            EntFire("st1_Boss_tp_part2", "Start", "", 4.50, null);

            EntFire("st1_boss_dead_part", "Start", "", 0, null);
            EntFire("st1_boss_model", "Kill", "", 4.70, null);

            EntFire("st1_boss_start_relay", "CancelPending", "", 0.00, null);
            EntFire("st1_boss_partend1", "Stop", "", 0.00, null);
            EntFire("st1_boss_partend2", "Stop", "", 0.00, null);
            EntFire("st1_boss_push", "Kill", "", 0.00, null);
            EntFireByHandle(self, "RunScriptInput", "Stop", 0.02, null, null);

            EntFire("st1_boss_fire*", "Kill", "", 0.00, null);
            EntFire("st1_boss_shock*", "Kill", "", 0.00, null);
            EntFire("st1_boss_holy*", "Kill", "", 0.00, null);
            EntFire("st1_boss_partarea*", "Kill", "", 0.00, null);
            EntFire("st1_boss_bodyhurt*", "Kill", "", 0.00, null);
        } else if (this.miniboss == 1) {
            EntFireByHandle(self, "RunScriptInput", "Stop", 0.02, null, null);

            //EntFire("st1_boss_model", "KeyValue", "targetname st1_boss1_ragdoll", 0.01, null);
            EntFire("st1_boss_model", "Kill", "", 4.70, null);
            EntFire("st1_boss_model", "ClearParent", "", 0.00, null);
            EntFire("st1_boss_fire*", "Kill", "", 0.00, null);
            EntFire("st1_boss_shock*", "Kill", "", 0.00, null);
            EntFire("st1_boss_holy*", "Kill", "", 0.00, null);
            EntFire("st1_boss_push*", "Kill", "", 0.00, null);
            EntFire("st1_boss_partarea*", "Kill", "", 0.00, null);
            EntFire("st1_boss_bodyhurt*", "Kill", "", 0.00, null);
            EntFire("st1_boss_back_part*", "Kill", "", 0.00, null);
            EntFire("st1_boss_metal", "Kill", "", 0.00, null);
            EntFire("st1_boss_partafter", "Start", "", 0.00, null);
            EntFire("st1_boss_model", "SetAnimation", "cichol_tired", 0.00, null);
            EntFire("Boss1_toggle", "Toggle", "", 0.00, null);
            EntFire("st4_boss2_start", "FireUser1", "", 0.01, null);

            EntFire("st1_Boss_text", "Kill", "", 5.0, null);
            EntFire("st1_Boss_tp_part1", "Stop", "", 0, null);
            EntFire("st1_Boss_tp_part2", "Stop", "", 0, null);
            EntFire("st1_Boss_tp_part1", "Start", "", 0.02, null);
            EntFire("st1_Boss_tp_part2", "Start", "", 4.50, null);
        }
    }

    toggleATKtick() {
        _log("LOG", "toggleATKtick() called");
        this.atkTick = !this.atkTick;
    }

    // ===== ATTACK SYSTEM =====
    // 0~39 FireBall (40%); 40~64 Shock (25%); 65~79 Holy (15%); 80~89 Push (10%); 90~94 Gravity (5%); 95~99 TrueDamage (5%)
    
    // Initialize attack scheduler
    initAttackSystem() {
        _log("LOG", "initAttackSystem() called");

        // Defer actual attack scheduling until attacks are allowed (movement started)
        if (!this.allowAttacks) {
            _log("LOG", "initAttackSystem: attacks not allowed yet, deferring");
            this.pendingInitAttack = true;
            return;
        }

        // A scheduler chain is already alive; starting a second one would run
        // two independent attack loops at once.
        if (this.atkSchedulerRunning) {
            _log("LOG", "initAttackSystem: scheduler already running, skipping");
            return;
        }

        this.atkSchedulerRunning = true;
        EntFireByHandle(self, "RunScriptInput", "StartCicholAttack", 10.0, null, null);
    }

    buildAttackDeck() {
        const attackDefs = [
            { key: "FIREBALL", input: "CicholFire", baseDelay: 2.9, weight: 20 },
            { key: "SHOCK", input: "CicholShock", baseDelay: 16.0, weight: 20 },
            { key: "HOLY", input: "CicholHoly", baseDelay: 5.0, weight: 15 },
            { key: "PUSH", input: "CicholPush", baseDelay: 6.0, weight: 15 },
            { key: "TRUEDAMAGE", input: "CicholTrueDamage", baseDelay: 5.5, weight: 20 }
        ];

        if (this.miniboss === 1) {
            attackDefs.splice(3, 0, { key: "GRAVITY", input: "CicholGravity", baseDelay: 7.0, weight: 0 });
        } else {
            attackDefs.push({ key: "GRAVITY", input: "CicholGravity", baseDelay: 7.0, weight: 15 });
        }

        const deck = [];
        for (const attack of attackDefs) {
            for (let i = 0; i < attack.weight; i++) {
                deck.push(attack);
            }
        }

        for (let i = deck.length - 1; i > 0; i--) {
            const j = RandomInt(0, i);
            const tmp = deck[i];
            deck[i] = deck[j];
            deck[j] = tmp;
        }

        this.attackDeck = deck;
        this.attackDeckCursor = 0;
        return deck;
    }

    selectNextAttackFromDeck() {
        if (!this.attackDeck || this.attackDeck.length === 0 || this.attackDeckCursor >= this.attackDeck.length) {
            this.buildAttackDeck();
        }

        let selected = null;
        let attempts = 0;

        while (attempts < this.attackDeck.length) {
            const candidate = this.attackDeck[this.attackDeckCursor];
            this.attackDeckCursor++;

            if (this.attackDeckCursor >= this.attackDeck.length) {
                this.attackDeckCursor = 0;
                this.attackDeck = [];
            }

            if (!this.lastAttackInput || candidate.input !== this.lastAttackInput || this.attackDeck.length <= 1) {
                selected = candidate;
                break;
            }

            attempts++;
        }

        if (!selected) {
            this.buildAttackDeck();
            selected = this.attackDeck[0];
            this.attackDeckCursor = 1;
        }

        this.lastAttackInput = selected.input;
        return selected;
    }

    scheduleNextAttack() {
        if (!this.atkSchedulerRunning || !this.atkTick) {
            _log("LOG", "scheduleNextAttack: scheduler stopped or atkTick=false, not scheduling");
            return;
        }

        const attack = this.selectNextAttackFromDeck();
        let nextDelay = 0;
        let atkType = "UNKNOWN";
        let attackInput = null;

        if (attack) {
            atkType = attack.key;
            attackInput = attack.input;
            const randomsec = RandomInt(-2, 2);
            nextDelay = attack.baseDelay + randomsec + this.atkCycle;
        } else {
            _log("ERROR", "scheduleNextAttack: failed to select attack from deck");
            EntFire("server", "Command", "say Attack System got any error!!", 0.00, null);
            nextDelay = 5;
        }

        _log("LOG", "scheduleNextAttack: selected " + atkType + " (input=" + attackInput + ")");
        _log("LOG", "scheduleNextAttack: next attack (" + atkType + ") scheduled in " + nextDelay.toFixed(2) + "s");

        if (this.atkSchedulerRunning) {
            EntFireByHandle(self, "RunScriptInput", "StartCicholAttack", nextDelay, null, null);
        }

        if (attackInput) {
            EntFireByHandle(self, "RunScriptInput", attackInput, this.attackDispatchDelaySeconds, null, null);
        }
    }

    startCicholAttack() {
        _log("LOG", "startCicholAttack() called");
        if (!this.allowAttacks) {
            _log("LOG", "startCicholAttack: attack triggered but not allowed yet; ignoring");
            return;
        }
        if (!this.atkSchedulerRunning) {
            _log("LOG", "startCicholAttack: starting attack scheduler");
            this.atkSchedulerRunning = true;
        }
        this.scheduleNextAttack();
    }

    stopCicholAttack() {
        _log("LOG", "stopCicholAttack() called");
        this.atkSchedulerRunning = false;
        this.atkTick = false;
    }

    cicholHoly() {
        _log("LOG", "cicholHoly() called");
        const holy = this.getHolyTemplate();
        if (!holy) return;
        EntFireByHandle(holy, "ForceSpawn", "", 0.02, null, null);
        EntFire("server", "Command", "say *** Holy - Go to side!!! ***", 0.00, null);
    }

    getHolyTemplate() {
        if (this.holyTemp && this.holyTemp.IsValid && this.holyTemp.IsValid()) {
            return this.holyTemp;
        }

        this.holyTemp = Instance.FindEntityByName("st1_boss_holy_template");

        if (!this.holyTemp || !this.holyTemp.IsValid || !this.holyTemp.IsValid()) {
            _log("WARN", "getHolyTemplate: holy template not found (st1_boss_holy_template)");
            return null;
        }

        _log("DEBUG", "getHolyTemplate: resolved holy template");
        return this.holyTemp;
    }

    cicholFire() {
        _log("LOG", "cicholFire() called");
        EntFire("st1_boss_firemaker", "ForceSpawn", "", 0.00, null);
        EntFire("st1_boss_model", "SetAnimation", "cichol_ball", 0.00, null);
        EntFire("st1_boss_model", "SetAnimation", "idle", 2.83, null);

        try {
            this.movement.pause();
        } catch (e) {
            _log("ERROR", "movement.pause() failed: " + e);
        }
        EntFireByHandle(self, "RunScriptInput", "Resume", 2.83, null, null);
    }

    /**
     * Builds the pool of players a shock wave can still hit. Taken once per
     * wave instead of once per spawn, so a 10-spawn wave costs one
     * FindEntitiesByClass sweep instead of ten.
     */
    buildShockPool() {
        const pool = [];
        const players = Instance.FindEntitiesByClass("player") || [];

        for (const p of players) {
            if (p.GetTeamNumber() === 3 && p.GetHealth() > 0) {
                pool.push(p);
            }
        }

        this.shockPool = pool;
        return pool;
    }

    cicholShockSpawn() {
        _log("LOG", "cicholShockSpawn() called");

        // Lazily build if the input was fired outside of a wave.
        const pool = this.shockPool || this.buildShockPool();

        if (pool.length === 0) {
            _log("WARN", "No available shock targets (all players already used)");
            return;
        }

        // Take a random entry out of the pool: picking is O(1) and removal
        // doubles as the "already used this wave" bookkeeping.
        const randomIndex = RandomInt(0, pool.length - 1);
        const target = pool[randomIndex];
        pool[randomIndex] = pool[pool.length - 1];
        pool.pop();

        if (!target || !target.IsValid()) {
            _log("WARN", "No valid shock target found");
            return;
        }

        this.shockTarget = target;

        const shock = this.getShockTemplate();
        if (!shock) return;

        shock.Teleport({ position: target.GetAbsOrigin() });
        EntFireByHandle(shock, "ForceSpawn", "", 0.00, null, null);
    }

    cicholShock() {
        _log("LOG", "cicholShock() called");
        // 3 waves at 0s, 5.5s, 11s
        EntFireByHandle(self, "RunScriptInput", "CicholShockWave", 0.00, null, null);
        EntFireByHandle(self, "RunScriptInput", "CicholShockWave", 5.50, null, null);
        EntFireByHandle(self, "RunScriptInput", "CicholShockWave", 11.00, null, null);
    }

    cicholShockWave() {
        _log("LOG", "cicholShockWave() called");
        this.buildShockPool();
        const targetnum = RandomInt(6, 10);
        for (let i = 0; i < targetnum; i++) {
            EntFireByHandle(self, "RunScriptInput", "CicholShockSpawn", 0.01 * i, null, null);
        }
        EntFireByHandle(self, "RunScriptInput", "CicholShockReset", 1.0, null, null);
    }

    cicholShockReset() {
        _log("LOG", "cicholShockReset() called");
        this.shockTarget = null;
        this.shockPool = null;
    }

    getShockTemplate() {
        if (this.shockTemp && this.shockTemp.IsValid && this.shockTemp.IsValid()) {
            return this.shockTemp;
        }

        this.shockTemp = Instance.FindEntityByName("st1_boss_shock_template");

        if (!this.shockTemp || !this.shockTemp.IsValid || !this.shockTemp.IsValid()) {
            _log("WARN", "getShockTemplate: shock template not found (st1_boss_shock_template)");
            return null;
        }

        _log("DEBUG", "getShockTemplate: resolved shock template");
        return this.shockTemp;
    }

    CicholPush() {
        _log("LOG", "CicholPush() called");
        EntFire("server", "Command", "say *** A radiant gale is gathering—brace for the knockback! ***", 0.00, null);
        EntFire("st1_boss_attack_delay_part", "Start", "", 0.00, null);
        EntFire("st1_boss_attack_delay_part", "Stop", "", 3.00, null);
        EntFire("st1_boss_push_case", "PickRandom", "", 3.00, null);
    }

    CicholGravity() {
        _log("LOG", "CicholGravity() called");
        EntFire("st1_boss_model", "SetAnimation", "cichol_defense", 0.00, null);
        EntFire("st1_boss_model", "SetAnimation", "cichol_defense_during", 3.83, null);
        EntFire("st1_boss_model", "SetAnimation", "idle", 7, null);
        EntFire("st1_boss_attack_delay_part", "Start", "", 1.00, null);
        EntFire("st1_boss_attack_delay_part", "Stop", "", 4.00, null);
        EntFire("st1_boss_grav_part", "Start", "", 4.00, null);
        EntFire("st1_boss_grav_part", "Stop", "", 7.00, null);
        EntFire("st1_boss_grav_push", "Enable", "", 4.00, null);
        EntFire("st1_boss_grav_push", "Disable", "", 7.00, null);
        EntFireByHandle(self, "RunScriptInput", "Pause", 3.83, null, null);
        EntFireByHandle(self, "RunScriptInput", "Resume", 7.00, null, null);
    }

    CicholTrueDamage() {
        _log("LOG", "CicholTrueDamage() called");
        EntFire("server", "Command", "say *** Radiant energy floods the area! ***", 0.00, null);
        EntFire("st1_boss_truedmg_part", "Start", "", 0.00, null);
        EntFire("st1_boss_truedmg_part", "Stop", "", 5.00, null);
        EntFire("st1_boss_truedmg_hurt", "Enable", "", 1.00, null);
        EntFire("st1_boss_truedmg_hurt", "Disable", "", 5.00, null);
    }


}

// ===== CICHOL BOSS INSTANCE =====
let cicholBoss = new CicholBossSystem();
