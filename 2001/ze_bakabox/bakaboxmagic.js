// ============================================================
// 脚本名称：bakaboxmagic.js
// 功能：CS2 ZE 地图逻辑，含 NPC 追逐、Boss、投票等
// 注册方式：logic_relay 的 OnSpawn 触发，无循环，完全事件驱动
// 解析增强：自动提取纯类型和数字 ID，无视多余下划线
// ============================================================

import { Instance } from 'cs_script/point_script';

// ---------- 工具类 ----------
class MathUtils {
    static clamp(value, min, max) { return Math.min(Math.max(value, min), max); }
}
const RAD_TO_DEG = 180 / Math.PI;

class Vector3Utils {
    static equals(a, b) { return a.x === b.x && a.y === b.y && a.z === b.z; }
    static add(a, b) { return new Vec3(a.x + b.x, a.y + b.y, a.z + b.z); }
    static subtract(a, b) { return new Vec3(a.x - b.x, a.y - b.y, a.z - b.z); }
    static scale(vector, scale) { return new Vec3(vector.x * scale, vector.y * scale, vector.z * scale); }
    static multiply(a, b) { return new Vec3(a.x * b.x, a.y * b.y, a.z * b.z); }
    static divide(vector, divider) {
        if (typeof divider === 'number') {
            if (divider === 0) throw Error('Division by zero');
            return new Vec3(vector.x / divider, vector.y / divider, vector.z / divider);
        } else {
            if (divider.x === 0 || divider.y === 0 || divider.z === 0) throw Error('Division by zero');
            return new Vec3(vector.x / divider.x, vector.y / divider.y, vector.z / divider.z);
        }
    }
    static length(vector) { return Math.sqrt(Vector3Utils.lengthSquared(vector)); }
    static lengthSquared(vector) { return vector.x ** 2 + vector.y ** 2 + vector.z ** 2; }
    static length2D(vector) { return Math.sqrt(Vector3Utils.length2DSquared(vector)); }
    static length2DSquared(vector) { return vector.x ** 2 + vector.y ** 2; }
    static normalize(vector) {
        const length = Vector3Utils.length(vector);
        return length ? Vector3Utils.divide(vector, length) : Vec3.Zero;
    }
    static dot(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }
    static cross(a, b) {
        return new Vec3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
    }
    static inverse(vector) { return new Vec3(-vector.x, -vector.y, -vector.z); }
    static distance(a, b) { return Vector3Utils.subtract(a, b).length; }
    static distanceSquared(a, b) { return Vector3Utils.subtract(a, b).lengthSquared; }
    static floor(vector) { return new Vec3(Math.floor(vector.x), Math.floor(vector.y), Math.floor(vector.z)); }
    static vectorAngles(vector) {
        let yaw = 0, pitch = 0;
        if (!vector.y && !vector.x) {
            if (vector.z > 0) pitch = -90; else pitch = 90;
        } else {
            yaw = Math.atan2(vector.y, vector.x) * RAD_TO_DEG;
            pitch = Math.atan2(-vector.z, Vector3Utils.length2D(vector)) * RAD_TO_DEG;
        }
        return new Euler({ pitch, yaw, roll: 0 });
    }
    static lerp(a, b, fraction, clamp = true) {
        let t = fraction;
        if (clamp) t = MathUtils.clamp(t, 0, 1);
        return new Vec3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);
    }
    static directionTowards(a, b) { return Vector3Utils.subtract(b, a).normal; }
    static lookAt(a, b) { return Vector3Utils.directionTowards(a, b).eulerAngles; }
    static withX(vector, x) { return new Vec3(x, vector.y, vector.z); }
    static withY(vector, y) { return new Vec3(vector.x, y, vector.z); }
    static withZ(vector, z) { return new Vec3(vector.x, vector.y, z); }
}
class Vec3 {
    x; y; z;
    static Zero = new Vec3(0, 0, 0);
    constructor(xOrVector, y, z) {
        if (typeof xOrVector === 'object') {
            this.x = xOrVector.x === 0 ? 0 : xOrVector.x;
            this.y = xOrVector.y === 0 ? 0 : xOrVector.y;
            this.z = xOrVector.z === 0 ? 0 : xOrVector.z;
        } else {
            this.x = xOrVector === 0 ? 0 : xOrVector;
            this.y = y === 0 ? 0 : y;
            this.z = z === 0 ? 0 : z;
        }
    }
    get length() { return Vector3Utils.length(this); }
    get lengthSquared() { return Vector3Utils.lengthSquared(this); }
    get length2D() { return Vector3Utils.length2D(this); }
    get length2DSquared() { return Vector3Utils.length2DSquared(this); }
    get normal() { return Vector3Utils.normalize(this); }
    get inverse() { return Vector3Utils.inverse(this); }
    get floored() { return Vector3Utils.floor(this); }
    get eulerAngles() { return Vector3Utils.vectorAngles(this); }
    toString() { return `Vec3: [${this.x}, ${this.y}, ${this.z}]`; }
    equals(vector) { return Vector3Utils.equals(this, vector); }
    add(vector) { return Vector3Utils.add(this, vector); }
    subtract(vector) { return Vector3Utils.subtract(this, vector); }
    divide(vector) { return Vector3Utils.divide(this, vector); }
    scale(scaleOrVector) {
        return typeof scaleOrVector === 'number' ? Vector3Utils.scale(this, scaleOrVector) : Vector3Utils.multiply(this, scaleOrVector);
    }
    multiply(scaleOrVector) {
        return typeof scaleOrVector === 'number' ? Vector3Utils.scale(this, scaleOrVector) : Vector3Utils.multiply(this, scaleOrVector);
    }
    dot(vector) { return Vector3Utils.dot(this, vector); }
    cross(vector) { return Vector3Utils.cross(this, vector); }
    distance(vector) { return Vector3Utils.distance(this, vector); }
    distanceSquared(vector) { return Vector3Utils.distanceSquared(this, vector); }
    lerpTo(vector, fraction, clamp = true) { return Vector3Utils.lerp(this, vector, fraction, clamp); }
    directionTowards(vector) { return Vector3Utils.directionTowards(this, vector); }
    lookAt(vector) { return Vector3Utils.lookAt(this, vector); }
    withX(x) { return Vector3Utils.withX(this, x); }
    withY(y) { return Vector3Utils.withY(this, y); }
    withZ(z) { return Vector3Utils.withZ(this, z); }
}
class EulerUtils {
    static equals(a, b) { return a.pitch === b.pitch && a.yaw === b.yaw && a.roll === b.roll; }
    static normalize(angle) {
        const normalizeAngle = (a) => { a = a % 360; if (a > 180) return a - 360; if (a < -180) return a + 360; return a; };
        return new Euler(normalizeAngle(angle.pitch), normalizeAngle(angle.yaw), normalizeAngle(angle.roll));
    }
    static forward(angle) {
        const pitchInRad = (angle.pitch / 180) * Math.PI;
        const yawInRad = (angle.yaw / 180) * Math.PI;
        const cosPitch = Math.cos(pitchInRad);
        return new Vec3(cosPitch * Math.cos(yawInRad), cosPitch * Math.sin(yawInRad), -Math.sin(pitchInRad));
    }
    static right(angle) {
        const p = (angle.pitch / 180) * Math.PI, y = (angle.yaw / 180) * Math.PI, r = (angle.roll / 180) * Math.PI;
        const sp = Math.sin(p), sy = Math.sin(y), sr = Math.sin(r), cp = Math.cos(p), cy = Math.cos(y), cr = Math.cos(r);
        return new Vec3(-sr * sp * cy + -cr * -sy, -sr * sp * sy + -cr * cy, -sr * cp);
    }
    static up(angle) {
        const p = (angle.pitch / 180) * Math.PI, y = (angle.yaw / 180) * Math.PI, r = (angle.roll / 180) * Math.PI;
        const sp = Math.sin(p), sy = Math.sin(y), sr = Math.sin(r), cp = Math.cos(p), cy = Math.cos(y), cr = Math.cos(r);
        return new Vec3(cr * sp * cy + -sr * -sy, cr * sp * sy + -sr * cy, cr * cp);
    }
    static lerp(a, b, fraction, clamp = true) {
        let t = fraction;
        if (clamp) t = MathUtils.clamp(t, 0, 1);
        const lerpComponent = (start, end, t) => {
            let delta = end - start;
            if (delta > 180) delta -= 360; else if (delta < -180) delta += 360;
            return start + delta * t;
        };
        return new Euler(lerpComponent(a.pitch, b.pitch, t), lerpComponent(a.yaw, b.yaw, t), lerpComponent(a.roll, b.roll, t));
    }
    static withPitch(angle, pitch) { return new Euler(pitch, angle.yaw, angle.roll); }
    static withYaw(angle, yaw) { return new Euler(angle.pitch, yaw, angle.roll); }
    static withRoll(angle, roll) { return new Euler(angle.pitch, angle.yaw, roll); }
    static rotateTowards(current, target, maxStep) {
        const rotateComponent = (cur, tar, step) => {
            let delta = tar - cur;
            if (delta > 180) delta -= 360; else if (delta < -180) delta += 360;
            if (Math.abs(delta) <= step) return tar;
            else return cur + Math.sign(delta) * step;
        };
        return new Euler(rotateComponent(current.pitch, target.pitch, maxStep), rotateComponent(current.yaw, target.yaw, maxStep), rotateComponent(current.roll, target.roll, maxStep));
    }
    static clamp(angle, min, max) {
        return new Euler(MathUtils.clamp(angle.pitch, min.pitch, max.pitch), MathUtils.clamp(angle.yaw, min.yaw, max.yaw), MathUtils.clamp(angle.roll, min.roll, max.roll));
    }
}
class Euler {
    pitch; yaw; roll;
    static Zero = new Euler(0, 0, 0);
    constructor(pitchOrAngle, yaw, roll) {
        if (typeof pitchOrAngle === 'object') {
            this.pitch = pitchOrAngle.pitch === 0 ? 0 : pitchOrAngle.pitch;
            this.yaw = pitchOrAngle.yaw === 0 ? 0 : pitchOrAngle.yaw;
            this.roll = pitchOrAngle.roll === 0 ? 0 : pitchOrAngle.roll;
        } else {
            this.pitch = pitchOrAngle === 0 ? 0 : pitchOrAngle;
            this.yaw = yaw === 0 ? 0 : yaw;
            this.roll = roll === 0 ? 0 : roll;
        }
    }
    get normal() { return EulerUtils.normalize(this); }
    get forward() { return EulerUtils.forward(this); }
    get backward() { return this.forward.inverse; }
    get right() { return EulerUtils.right(this); }
    get left() { return this.right.inverse; }
    get up() { return EulerUtils.up(this); }
    get down() { return this.up.inverse; }
    toString() { return `Euler: [${this.pitch}, ${this.yaw}, ${this.roll}]`; }
    equals(angle) { return EulerUtils.equals(this, angle); }
    lerp(angle, fraction, clamp = true) { return EulerUtils.lerp(this, angle, fraction, clamp); }
    withPitch(pitch) { return EulerUtils.withPitch(this, pitch); }
    withYaw(yaw) { return EulerUtils.withYaw(this, yaw); }
    withRoll(roll) { return EulerUtils.withRoll(this, roll); }
    rotateTowards(angle, maxStep) { return EulerUtils.rotateTowards(this, angle, maxStep); }
    clamp(min, max) { return EulerUtils.clamp(this, min, max); }
}

// ---------- 调度器 ----------
let idPool = 0;
let tasks = [];
function setTimeout(callback, ms) {
    const id = idPool++;
    tasks.unshift({ id, atSeconds: Instance.GetGameTime() + ms / 1000, callback });
    return id;
}
function setInterval(callback, ms) {
    const id = idPool++;
    tasks.unshift({ id, everyNSeconds: ms / 1000, atSeconds: Instance.GetGameTime() + ms / 1000, callback });
    return id;
}
function clearTimeout(id) { tasks = tasks.filter((task) => task.id !== id); }
const clearInterval = clearTimeout;
function runSchedulerTick() {
    for (let i = tasks.length - 1; i >= 0; i--) {
        const task = tasks[i];
        if (Instance.GetGameTime() < task.atSeconds) continue;
        if (task.everyNSeconds === undefined) tasks.splice(i, 1);
        else task.atSeconds = Instance.GetGameTime() + task.everyNSeconds;
        try { task.callback(); } catch (err) {
            Instance.Msg('An error occurred inside a scheduler task');
            if (err instanceof Error) { Instance.Msg(err.message); Instance.Msg(err.stack ?? '<no stack>'); }
        }
    }
}

Instance.Msg("BakaBox Script Loaded (logic_relay OnSpawn 驱动版 - 增强解析)");
Instance.SetThink(() => { Instance.SetNextThink(Instance.GetGameTime()); runSchedulerTick(); });
Instance.SetNextThink(Instance.GetGameTime());

// ---------- 全局状态 ----------
let CLEAR_ALL_INTERVAL = false;
let EXTREME = false;
let VOTING_BOOTH = true;
let VOTING_BOOTH_COUNT = 0;
let VOTING_BOOTH_REQUIRED = 0;
let VOINTG_BOOTH_PLAYERS = 0;
let VOTING_BOOTH_ANTI_TROLL = 0;
const VOTING_BOOTH_ANTI_TROLL_MAX = 2;
let LEVEL = 1;
let WARMUP = true;
let TIME_TO_WIN = false;

// ===== 新增：存储神器按钮和中继 =====
let registeredItemButtons = [];
let registeredItemRelays = [];

function reset_player_variables() {
    const players = Instance.FindEntitiesByClass("player");
    for (const player of players) player.trump = false;
}

// ---------- 回合生命周期 ----------
Instance.OnRoundStart(() => {
    VOTING_BOOTH_COUNT = 0;
    VOTING_BOOTH_REQUIRED = 0;
    VOINTG_BOOTH_PLAYERS = 0;
    TIME_TO_WIN = false;
    CLEAR_ALL_INTERVAL = false;
    reset_player_variables();

    if (WARMUP) {
        LEVEL = 0;
        Instance.EntFireAtName({ name: "LevelRelayWarmup", input: "Trigger" });
        Instance.EntFireAtName({ name: "tem_stage_2", input: "Kill" });
        Instance.EntFireAtName({ name: "tem_stage_3", input: "Kill" });
        Instance.EntFireAtName({ name: "tem_stage_4", input: "Kill" });
        Instance.EntFireAtName({ name: "server", input: "Command", value: "say *** WARMUP ***" });
        Instance.EntFireAtName({ name: "server", input: "Command", value: "say *** BAKA WILL SLAY ALL PLAYERS IN 60 SECONDS ***", delay: 1 });
        Instance.EntFireAtName({ name: "server", input: "Command", value: "say *** BAKA WILL SLAY ALL PLAYERS IN 30 SECONDS ***", delay: 30 });
        Instance.EntFireAtName({ name: "server", input: "Command", value: "say *** BAKA WILL SLAY ALL PLAYERS IN 10 SECONDS ***", delay: 50 });
        Instance.EntFireAtName({ name: "server", input: "Command", value: "say *** THE JOURNEY SHALL COMMENCE SHORTLY ***", delay: 55 });
        Instance.EntFireAtName({ name: "server", input: "Command", value: "say *** THE TIME IS NOW ***", delay: 60 });
        setTimeout(() => {
            const players = Instance.FindEntitiesByClass("player");
            for (const player of players) {
                if (player?.IsValid() && player.IsAlive()) {
                    Instance.EntFireAtTarget({ target: player, input: "sethealth", value: 0 });
                }
            }
            WARMUP = false;
            LEVEL = 1;
        }, 60 * 1000);
    } else {
        if (LEVEL == 1) {
            if (EXTREME) Instance.EntFireAtName({ name: "LevelRelayExtremeMain", input: "Trigger" });
            Instance.EntFireAtName({ name: "LevelRelayPrologue", input: "Trigger" });
        }
        if (LEVEL == 2) {
            if (EXTREME) Instance.EntFireAtName({ name: "LevelRelayExtremeMain", input: "Trigger" });
            Instance.EntFireAtName({ name: "LevelRelayActI", input: "Trigger" });
        }
        if (LEVEL == 3) {
            if (EXTREME) Instance.EntFireAtName({ name: "LevelRelayExtremeMain", input: "Trigger" });
            Instance.EntFireAtName({ name: "LevelRelayActII", input: "Trigger" });
        }
        if (LEVEL == 4) {
            if (EXTREME) Instance.EntFireAtName({ name: "LevelRelayExtremeMain", input: "Trigger" });
            Instance.EntFireAtName({ name: "LevelRelayActIII", input: "Trigger" });
        }
        if (LEVEL == 5) {
            Instance.EntFireAtName({ name: "LevelRelayVoid", input: "Trigger" });
        }
        if ((VOTING_BOOTH && EXTREME) || (VOTING_BOOTH && LEVEL == 1)) {
            Instance.EntFireAtName({ name: "trump_diddler", input: "Enable" });
            Instance.EntFireAtName({ name: "disable_vote_prop", input: "Kill" });
        } else if (!VOTING_BOOTH) {
            Instance.EntFireAtName({ name: "voting_booth", input: "Break" });
        }
        if (!WARMUP && !EXTREME) {
            Instance.EntFireAtName({ name: "LevelRelayNormalMain", input: "Trigger" });
        }
    }
});

// ---------- 管理员指令 ----------
Instance.OnScriptInput("input_enable_extreme", () => { EXTREME = true; });
Instance.OnScriptInput("input_time_to_win", () => { TIME_TO_WIN = true; });
Instance.OnScriptInput("input_admin_normal", () => { EXTREME = false; });
Instance.OnScriptInput("input_admin_extreme", () => { EXTREME = true; });
Instance.OnScriptInput("input_admin_prologue", () => { LEVEL = 1; });
Instance.OnScriptInput("input_admin_act_i", () => { LEVEL = 2; });
Instance.OnScriptInput("input_admin_act_ii", () => { LEVEL = 3; });
Instance.OnScriptInput("input_admin_act_iii", () => { LEVEL = 4; });

// ---------- 处死命令 ----------
Instance.OnScriptInput("input_kill_zombies", () => {
    const players = Instance.FindEntitiesByClass("player");
    for (const p of players) { if (p?.IsValid() && p.GetTeamNumber() == 2 && p.IsAlive()) Instance.EntFireAtTarget({ target: p, input: "sethealth", value: 0 }); }
});
Instance.OnScriptInput("input_kill_all", () => {
    const players = Instance.FindEntitiesByClass("player");
    for (const p of players) { if (p?.IsValid() && p.IsAlive()) Instance.EntFireAtTarget({ target: p, input: "sethealth", value: 0 }); }
});
Instance.OnScriptInput("input_kill_humans", () => {
    const players = Instance.FindEntitiesByClass("player");
    for (const p of players) { if (p?.IsValid() && p.GetTeamNumber() == 3 && p.IsAlive()) Instance.EntFireAtTarget({ target: p, input: "sethealth", value: 0 }); }
});

// ---------- 投票系统 ----------
Instance.OnScriptInput("input_voting_booth_init", () => {
    if (EXTREME) {
        Instance.EntFireAtName({ name: "server", input: "Command", value: "say ***WANNA REVERT BACK TO NORMAL MODE? > STEP ON THE PLATFORM***" });
        Instance.EntFireAtName({ name: "server", input: "Command", value: "say ***50% OF THE HUMANS NEED TO VOTE IN ORDER FOR IT TO PASS***", delay: 1 });
        Instance.EntFireAtName({ name: "server", input: "Command", value: "say ***BAKA IS PROUD OF YOU***", delay: 2 });
        Instance.EntFireAtName({ name: "vote_percentage_number", input: "Enable" });
        Instance.EntFireAtName({ name: "trump_diddle", input: "Enable" });
        Instance.EntFireAtName({ name: "vote_percentage_symbol", input: "Enable" });
        Instance.EntFireAtName({ name: "vote_percentage_goal", input: "Enable" });
        Instance.EntFireAtName({ name: "vote_percentage_goal", input: "SetMessage", value: "GOAL (%): 50" });
    } else {
        Instance.EntFireAtName({ name: "server", input: "Command", value: "say ***WANNA SKIP TO EXTREME MODE? > STEP ON THE PLATFORM***" });
        Instance.EntFireAtName({ name: "server", input: "Command", value: "say ***80% OF THE HUMANS NEED TO VOTE IN ORDER FOR IT TO PASS***", delay: 1 });
        Instance.EntFireAtName({ name: "server", input: "Command", value: "say ***BAKA IS PROUD OF YOU***", delay: 2 });
        Instance.EntFireAtName({ name: "vote_percentage_number", input: "Enable" });
        Instance.EntFireAtName({ name: "trump_diddle", input: "Enable" });
        Instance.EntFireAtName({ name: "vote_percentage_symbol", input: "Enable" });
        Instance.EntFireAtName({ name: "vote_percentage_goal", input: "Enable" });
        Instance.EntFireAtName({ name: "vote_percentage_goal", input: "SetMessage", value: "GOAL (%): 80" });
    }
    const players = Instance.FindEntitiesByClass("player");
    let aliveHumans = 0;
    for (const p of players) { if (p?.IsValid() && p.GetTeamNumber() == 3 && p.IsAlive()) aliveHumans++; }
    VOINTG_BOOTH_PLAYERS = aliveHumans;
    VOTING_BOOTH_REQUIRED = EXTREME ? Math.floor(aliveHumans * 0.5) : Math.floor(aliveHumans * 0.8);
});

function swap_mode() {
    VOTING_BOOTH_ANTI_TROLL++;
    if (VOTING_BOOTH_ANTI_TROLL == VOTING_BOOTH_ANTI_TROLL_MAX) VOTING_BOOTH = false;
    if (EXTREME) {
        Instance.EntFireAtName({ name: "mixtape_doombell", input: "StartSound" });
        Instance.EntFireAtName({ name: "server", input: "Command", value: "say ***THE VOTE HAS SPOKEN***" });
        Instance.EntFireAtName({ name: "server", input: "Command", value: "say ***REVERTING TO NORMAL MODE***", delay: 1 });
        Instance.EntFireAtName({ name: "server", input: "Command", value: "say ***RESTARTING ROUND***", delay: 2 });
        Instance.EntFireAtName({ name: "server", input: "Command", value: "say ***BAKA BAKA***", delay: 3 });
        Instance.EntFireAtName({ name: "KILL_ALL", input: "Trigger", delay: 3 });
        EXTREME = false;
    } else {
        Instance.EntFireAtName({ name: "mixtape_doombell", input: "StartSound" });
        Instance.EntFireAtName({ name: "server", input: "Command", value: "say ***THE VOTE HAS SPOKEN***" });
        Instance.EntFireAtName({ name: "server", input: "Command", value: "say ***ENABLING EXTREME MODE***", delay: 1 });
        Instance.EntFireAtName({ name: "server", input: "Command", value: "say ***RESTARTING ROUND***", delay: 2 });
        Instance.EntFireAtName({ name: "server", input: "Command", value: "say ***BAKA BAKA***", delay: 3 });
        Instance.EntFireAtName({ name: "KILL_ALL", input: "Trigger", delay: 3 });
        EXTREME = true;
    }
}
Instance.OnScriptInput("input_trump_vote", (stuff) => {
    const player = stuff.activator;
    if (player?.IsValid() && player.GetTeamNumber() == 3 && !player.trump) {
        player.trump = true;
        VOTING_BOOTH_COUNT++;
        const percent = Math.floor((VOTING_BOOTH_COUNT / VOINTG_BOOTH_PLAYERS) * 100);
        Instance.EntFireAtName({ name: "vote_percentage_number", input: "SetMessage", value: percent.toString() });
        if (VOTING_BOOTH_COUNT >= VOTING_BOOTH_REQUIRED) swap_mode();
    }
});

// ---------- 回合结束 ----------
Instance.OnRoundEnd((winningTeam) => {
    const team = winningTeam.winningTeam;
    if (TIME_TO_WIN && team == 3) {
        if (LEVEL == 1) LEVEL++;
        else if (LEVEL == 2) LEVEL++;
        else if (LEVEL == 3) LEVEL++;
        else if (LEVEL == 4) {
            if (EXTREME) { LEVEL = 5; EXTREME = false; }
            else { LEVEL = 1; EXTREME = true; }
        }
    }
    CLEAR_ALL_INTERVAL = true;
});

// ============================================================
// 🎯 NPC 系统（完全由 logic_relay 驱动）
// ============================================================

const NPC_TICK = 0.1;
const NPC_ANGLE_THRESHOLD = 10;
const NPC_AGGRO_RANGE = 1792;
const NPC_BRAKE_DURATION = 3;
const NPC_PREDICT_TIME = 0.25;
const NPC_SMOOTH_FACTOR = 0.3;
const NPC_STUCK_THRESHOLD = 2;
const NPC_STUCK_FRAME_LIMIT = 20;

const NPC_CONFIG_LIGHT = {
    type: '轻型',
    maxForward: 800,
    maxSide: 405,
    accel: 15,
    brakeForce: 150,
    minSide: 50,
    baseBodyName: 'npc_monster_body',
    baseThrustName: 'npc_thrust'
};
const NPC_CONFIG_MEDIUM = {
    type: '中型',
    maxForward: 600,
    maxSide: 280,
    accel: 12,
    brakeForce: 120,
    minSide: 40,
    baseBodyName: 'npc_medium_body',
    baseThrustName: 'npc_medium_thrust'
};
const NPC_CONFIG_HEAVY = {
    type: '重型',
    maxForward: 450,
    maxSide: 250,
    accel: 8,
    brakeForce: 100,
    minSide: 30,
    baseBodyName: 'npc_heavy_body',
    baseThrustName: 'npc_heavy_thrust'
};

const TYPE_CONFIG_MAP = {
    light: NPC_CONFIG_LIGHT,
    medium: NPC_CONFIG_MEDIUM,
    heavy: NPC_CONFIG_HEAVY
};

let registeredBodies = [];

function getEntityName(ent) {
    if (!ent) return "";
    if (typeof ent.GetEntityName === "function") return ent.GetEntityName();
    if (typeof ent.GetName === "function") return ent.GetName();
    return "（无名称）";
}

// ---------- 注册单个 NPC ----------
function registerNPC(body, config) {
    try {
        if (body._npc_registered) return false;
        if (registeredBodies.includes(body)) return false;
        if (body._npc_interval) { clearInterval(body._npc_interval); body._npc_interval = null; }

        const bodyName = getEntityName(body);
        let suffix = "";
        const match = bodyName.match(/_(\d+)$/);
        if (match) suffix = "_" + match[1];

        let thrust_forward = Instance.FindEntityByName(config.baseThrustName + "_forward" + suffix);
        let thrust_left = Instance.FindEntityByName(config.baseThrustName + "_left" + suffix);
        let thrust_right = Instance.FindEntityByName(config.baseThrustName + "_right" + suffix);
        if (!thrust_forward || !thrust_left || !thrust_right) {
            thrust_forward = Instance.FindEntityByName(config.baseThrustName + "_forward");
            thrust_left = Instance.FindEntityByName(config.baseThrustName + "_left");
            thrust_right = Instance.FindEntityByName(config.baseThrustName + "_right");
        }
        if (!thrust_forward || !thrust_left || !thrust_right) {
            Instance.Msg(`⚠️ [${config.type}] 推力器缺失，跳过 ${bodyName}`);
            return false;
        }

        Instance.EntFireAtTarget({ target: thrust_forward, input: "Activate" });
        Instance.EntFireAtTarget({ target: thrust_left, input: "Activate" });
        Instance.EntFireAtTarget({ target: thrust_right, input: "Activate" });
        Instance.EntFireAtTarget({ target: thrust_forward, input: "Deactivate" });
        Instance.EntFireAtTarget({ target: thrust_left, input: "Deactivate" });
        Instance.EntFireAtTarget({ target: thrust_right, input: "Deactivate" });
        Instance.EntFireAtTarget({ target: body, input: "Wake" });

        const interval = npc_chase(body, thrust_forward, thrust_left, thrust_right, config);
        body._npc_interval = interval;
        body._npc_registered = true;
        registeredBodies.push(body);
        Instance.Msg(`✅ [${config.type}] ${bodyName} 已注册 (速度: ${config.maxForward})`);

        // 血量显示绑定
        let id = 0;
        let idMatch = bodyName.match(/_(\d+)$/);
        if (idMatch) {
            id = parseInt(idMatch[1], 10);
        } else {
            idMatch = bodyName.match(/(\d+)$/);
            if (idMatch) {
                id = parseInt(idMatch[1], 10);
            }
        }

        if (id > 0) {
            let healthBoxBase = '';
            let textBase = '';
            if (config === NPC_CONFIG_LIGHT) {
                healthBoxBase = 'npc_physm';
                textBase = 'npc_monster_healthtext';
            } else if (config === NPC_CONFIG_HEAVY) {
                healthBoxBase = 'npc_physm_heavy';
                textBase = 'npc_heavy_healthtext';
            } else {
                healthBoxBase = 'npc_physm';
                textBase = 'npc_healthtext';
            }

            const healthCandidates = [healthBoxBase + '_' + id, healthBoxBase + id];
            let healthBox = null;
            for (const name of healthCandidates) {
                const ent = Instance.FindEntityByName(name);
                if (ent && ent.IsValid()) { healthBox = ent; break; }
            }

            const textCandidates = [textBase + '_' + id, textBase + id];
            let textEntity = null;
            for (const name of textCandidates) {
                const ent = Instance.FindEntityByName(name);
                if (ent && ent.IsValid()) { textEntity = ent; break; }
            }

            if (healthBox && healthBox.IsValid() && textEntity && textEntity.IsValid()) {
                healthBox._textEntity = textEntity;

                Instance.ConnectOutput(healthBox, 'OnHealthChanged', (stuff) => {
                    const box = stuff.caller;
                    if (!box || !box.IsValid()) return;
                    const text = box._textEntity;
                    if (!text || !text.IsValid()) return;
                    const health = box.GetHealth ? box.GetHealth() : 0;
                    Instance.EntFireAtTarget({
                        target: text,
                        input: 'SetMessage',
                        value: 'HP: ' + Math.floor(health)
                    });
                });

                const initHealth = healthBox.GetHealth ? healthBox.GetHealth() : 0;
                Instance.EntFireAtTarget({
                    target: textEntity,
                    input: 'SetMessage',
                    value: 'HP: ' + Math.floor(initHealth)
                });

                Instance.Msg(`📊 血量显示绑定成功：${healthBox.GetEntityName()} → ${textEntity.GetEntityName()}`);
            } else {
                if (!healthBox) Instance.Msg(`⚠️ 未找到血量箱（尝试了 ${healthCandidates.join('、')}）`);
                if (!textEntity) Instance.Msg(`⚠️ 未找到血量文本（尝试了 ${textCandidates.join('、')}）`);
            }
        }

        return true;
    } catch (e) {
        Instance.Msg(`❌ 注册 ${config.type} NPC 时发生异常: ${e.message}`);
        return false;
    }
}

// ---------- 追逐循环 ----------
function npc_chase(body, thrust_forward, thrust_left, thrust_right, config) {
    let currentForwardThrust = 50;
    let sideActive = false;
    let smoothAngle = 0;
    let brakeActive = false;
    let brakeFrames = 0;
    let lastTurnDirection = 0;
    let lastPosition = body.GetAbsOrigin ? body.GetAbsOrigin() : new Vec3(0, 0, 0);
    let stuckCounter = 0
    let hadTarget = false;

    const interval = setInterval(() => {
        if (!body?.IsValid() || !thrust_forward?.IsValid() || !thrust_left?.IsValid() || !thrust_right?.IsValid()) {
            clearInterval(interval);
            if (body) body._npc_interval = null;
            Instance.Msg(`🛑 [${config.type}] NPC 实体已销毁，停止追逐循环`);
            return;
        }

        const players = Instance.FindEntitiesByClass("player");
        let target = null;
        let minDist = NPC_AGGRO_RANGE;
        for (const player of players) {
            if (player?.IsValid() && player.IsAlive() && player.GetTeamNumber() == 3) {
                let dist = Vector3Utils.distance(body.GetAbsOrigin(), player.GetAbsOrigin());
                if (dist < minDist) { minDist = dist; target = player; }
            }
        }
        if (target) {
            if (!hadTarget) {
                hadTarget = true;
                if (body && body.IsValid()) {
                    Instance.EntFireAtTarget({ target: body, input: "FireUser2" });
                }
            }
        } else {
            hadTarget = false;
        }


        if (!target) {
            Instance.EntFireAtTarget({ target: thrust_forward, input: "Deactivate" });
            Instance.EntFireAtTarget({ target: thrust_left, input: "Deactivate" });
            Instance.EntFireAtTarget({ target: thrust_right, input: "Deactivate" });
            sideActive = false; brakeActive = false; lastTurnDirection = 0; stuckCounter = 0;
            lastPosition = body.GetAbsOrigin ? body.GetAbsOrigin() : new Vec3(0, 0, 0);
            return;
        }

        Instance.EntFireAtTarget({ target: body, input: "Wake" });
        let currentPos = body.GetAbsOrigin ? body.GetAbsOrigin() : new Vec3(0, 0, 0);
        let displacement = Vector3Utils.distance(currentPos, lastPosition);
        if (displacement < NPC_STUCK_THRESHOLD) stuckCounter++; else stuckCounter = 0;
        lastPosition = currentPos;

        if (stuckCounter > NPC_STUCK_FRAME_LIMIT) {
            let bodyPos = body.GetAbsOrigin ? body.GetAbsOrigin() : new Vec3(0, 0, 0);
            let targetPos = target.GetAbsOrigin ? target.GetAbsOrigin() : new Vec3(0, 0, 0);
            let dirToTarget = Vector3Utils.subtract(targetPos, bodyPos);
            let horizontalDir = new Vec3(dirToTarget.x, dirToTarget.y, 0);
            if (horizontalDir.length > 0.1) {
                let targetAng = Vector3Utils.vectorAngles(horizontalDir);
                body.Teleport(null, targetAng, null);
            }
            stuckCounter = 0;
            lastPosition = body.GetAbsOrigin ? body.GetAbsOrigin() : new Vec3(0, 0, 0);
        }

        let targetPos = target.GetAbsOrigin ? target.GetAbsOrigin() : new Vec3(0, 0, 0);
        let targetVel = target.GetVelocity ? target.GetVelocity() : new Vec3(0, 0, 0);
        if (targetVel) {
            let predictedPos = Vector3Utils.add(targetPos, Vector3Utils.scale(targetVel, NPC_PREDICT_TIME));
            let delta = Vector3Utils.subtract(predictedPos, body.GetAbsOrigin());
            if (delta.length > NPC_AGGRO_RANGE * 1.2) predictedPos = targetPos;
            targetPos = predictedPos;
        }

        let body_forward = getForwardVector(body.GetAbsAngles());
        let rawAngle = GetDirectionToTarget(body.GetAbsOrigin(), targetPos, body_forward);
        smoothAngle = smoothAngle * NPC_SMOOTH_FACTOR + rawAngle * (1 - NPC_SMOOTH_FACTOR);

        let angleAbs = Math.abs(smoothAngle);
        let speedFactor = MathUtils.clamp(1 - (angleAbs / 90) * 0.75, 0.25, 1.0);
        if (minDist < 300) speedFactor *= MathUtils.clamp(minDist / 300, 0.2, 1.0);
        let targetForward = Math.max(80, config.maxForward * speedFactor);

        if (currentForwardThrust < targetForward) currentForwardThrust = Math.min(currentForwardThrust + config.accel * 2, targetForward);
        else if (currentForwardThrust > targetForward) currentForwardThrust = Math.max(targetForward, currentForwardThrust - config.accel * 4);
        currentForwardThrust = MathUtils.clamp(currentForwardThrust, 50, config.maxForward);

        Instance.EntFireAtTarget({ target: thrust_forward, input: "KeyValues", value: "Force " + currentForwardThrust + " 0 0" });
        Instance.EntFireAtTarget({ target: thrust_forward, input: "Activate" });

        let speed = Vector3Utils.length(body.GetVelocity ? body.GetVelocity() : new Vec3(0, 0, 0));
        let sidePower = config.maxSide;
        if (angleAbs < 20) sidePower = config.maxSide * (0.2 + 0.8 * (angleAbs / 20));
        sidePower = Math.max(config.minSide, sidePower);

        if (smoothAngle > NPC_ANGLE_THRESHOLD) {
            Instance.EntFireAtTarget({ target: thrust_right, input: "KeyValues", value: "Force " + sidePower + " 0 0" });
            Instance.EntFireAtTarget({ target: thrust_right, input: "Activate" });
            Instance.EntFireAtTarget({ target: thrust_left, input: "Deactivate" });
            sideActive = true; lastTurnDirection = 1; brakeActive = false;
        } else if (smoothAngle < -NPC_ANGLE_THRESHOLD) {
            Instance.EntFireAtTarget({ target: thrust_left, input: "KeyValues", value: "Force " + sidePower + " 0 0" });
            Instance.EntFireAtTarget({ target: thrust_left, input: "Activate" });
            Instance.EntFireAtTarget({ target: thrust_right, input: "Deactivate" });
            sideActive = true; lastTurnDirection = -1; brakeActive = false;
        } else {
            if (speed > 100) {
                if (lastTurnDirection !== 0) {
                    if (!brakeActive) { brakeActive = true; brakeFrames = NPC_BRAKE_DURATION; }
                    if (brakeFrames > 0) {
                        let brakePower = config.brakeForce * (currentForwardThrust / config.maxForward);
                        if (lastTurnDirection === 1) {
                            Instance.EntFireAtTarget({ target: thrust_left, input: "KeyValues", value: "Force " + brakePower + " 0 0" });
                            Instance.EntFireAtTarget({ target: thrust_left, input: "Activate" });
                            Instance.EntFireAtTarget({ target: thrust_right, input: "Deactivate" });
                        } else {
                            Instance.EntFireAtTarget({ target: thrust_right, input: "KeyValues", value: "Force " + brakePower + " 0 0" });
                            Instance.EntFireAtTarget({ target: thrust_right, input: "Activate" });
                            Instance.EntFireAtTarget({ target: thrust_left, input: "Deactivate" });
                        }
                        sideActive = true; brakeFrames--;
                    } else {
                        Instance.EntFireAtTarget({ target: thrust_left, input: "Deactivate" });
                        Instance.EntFireAtTarget({ target: thrust_right, input: "Deactivate" });
                        sideActive = false; brakeActive = false; lastTurnDirection = 0;
                    }
                } else {
                    if (sideActive) {
                        Instance.EntFireAtTarget({ target: thrust_left, input: "Deactivate" });
                        Instance.EntFireAtTarget({ target: thrust_right, input: "Deactivate" });
                        sideActive = false;
                    }
                }
            } else {
                if (!sideActive && angleAbs > 2) {
                    let smallPower = Math.max(config.minSide, sidePower * 0.3);
                    if (smoothAngle > 0) {
                        Instance.EntFireAtTarget({ target: thrust_right, input: "KeyValues", value: "Force " + smallPower + " 0 0" });
                        Instance.EntFireAtTarget({ target: thrust_right, input: "Activate" });
                        Instance.EntFireAtTarget({ target: thrust_left, input: "Deactivate" });
                    } else {
                        Instance.EntFireAtTarget({ target: thrust_left, input: "KeyValues", value: "Force " + smallPower + " 0 0" });
                        Instance.EntFireAtTarget({ target: thrust_left, input: "Activate" });
                        Instance.EntFireAtTarget({ target: thrust_right, input: "Deactivate" });
                    }
                    sideActive = true; brakeActive = false; lastTurnDirection = 0;
                } else if (sideActive && angleAbs < 1) {
                    Instance.EntFireAtTarget({ target: thrust_left, input: "Deactivate" });
                    Instance.EntFireAtTarget({ target: thrust_right, input: "Deactivate" });
                    sideActive = false;
                }
            }
        }
        if (minDist < 20) {
            Instance.EntFireAtTarget({ target: thrust_forward, input: "Deactivate" });
            Instance.EntFireAtTarget({ target: thrust_left, input: "Deactivate" });
            Instance.EntFireAtTarget({ target: thrust_right, input: "Deactivate" });
            sideActive = false; brakeActive = false; lastTurnDirection = 0; stuckCounter = 0;
            lastPosition = body.GetAbsOrigin ? body.GetAbsOrigin() : new Vec3(0, 0, 0);
        }
    }, NPC_TICK * 1000);
    return interval;
}

function getForwardVector(ang) {
    const pitchRad = ang.pitch * Math.PI / 180;
    const yawRad = ang.yaw * Math.PI / 180;
    const x = Math.cos(pitchRad) * Math.cos(yawRad);
    const y = Math.cos(pitchRad) * Math.sin(yawRad);
    const z = -Math.sin(pitchRad);
    const len = Math.hypot(x, y, z) || 1;
    return new Vec3(x / len, y / len, z / len);
}
function GetDirectionToTarget(origin, targetOrigin, forward) {
    const delta = Vector3Utils.subtract(targetOrigin, origin);
    const cross = Vector3Utils.cross(forward, delta);
    const dot = Vector3Utils.dot(forward, delta);
    return Math.atan2(cross.z, dot) * 180 / Math.PI;
}

// ---------- 事件驱动注册入口 ----------
Instance.OnScriptInput("input_register_npc", (stuff) => {
    const caller = stuff.caller;
    if (!caller || !caller.IsValid()) {
        Instance.Msg("❌ input_register_npc: 没有有效的 caller（请确保由 logic_relay 触发）");
        return;
    }
    const name = caller.GetEntityName ? caller.GetEntityName() : '';
    if (!name) {
        Instance.Msg("❌ caller 没有 targetname");
        return;
    }

    const prefix = "npc_register_";
    if (!name.startsWith(prefix)) {
        Instance.Msg(`❌ 无效的 caller targetname: ${name}，应以 "npc_register_" 开头`);
        return;
    }

    const rest = name.substring(prefix.length);
    const parts = rest.split('_').filter(p => p.length > 0);
    if (parts.length < 2) {
        Instance.Msg(`❌ 格式错误: ${name}，应包含类型和数字ID`);
        return;
    }

    const idStr = parts[parts.length - 1];
    const id = parseInt(idStr, 10);
    if (isNaN(id) || id <= 0) {
        Instance.Msg(`❌ 无效的 ID: ${idStr}，应为正整数`);
        return;
    }

    let typeRaw = parts.slice(0, -1).join('_').toLowerCase();
    typeRaw = typeRaw.replace(/_+$/, '');
    const type = typeRaw.split('_')[0];

    const config = TYPE_CONFIG_MAP[type];
    if (!config) {
        Instance.Msg(`❌ 未知的NPC类型: ${type}（完整名称: ${name}）`);
        return;
    }

    const bodyName = config.baseBodyName + "_" + id;
    const body = Instance.FindEntityByName(bodyName);
    if (!body || !body.IsValid()) {
        Instance.Msg(`⚠️ 未找到主体实体: ${bodyName}`);
        return;
    }

    const success = registerNPC(body, config);
    if (success) Instance.Msg(`✅ NPC ${type}_${id} 注册成功`);
    else Instance.Msg(`❌ NPC ${type}_${id} 注册失败`);
});


// ---------- 备用手动注册 ----------
Instance.OnScriptInput("input_init_npc", () => {
    let foundAny = false;
    const configs = [NPC_CONFIG_LIGHT, NPC_CONFIG_MEDIUM, NPC_CONFIG_HEAVY];
    for (const config of configs) {
        let body = Instance.FindEntityByName(config.baseBodyName);
        if (body && body.IsValid()) {
            if (registerNPC(body, config)) foundAny = true;
        }
    }
    if (!foundAny) Instance.Msg("ℹ️ 未发现任何基础 NPC 主体（不带后缀）");
    else Instance.Msg("✅ 基础 NPC 注册完成（无后缀）");
});

// ============================================================
// 🐉 Boss 系统
// ============================================================

const BOSS_MAX_FORWARD_THRUST = 900;
const BOSS_MAX_SIDE_THRUST = 400;
const BOSS_ACCELERATION_STEP = 15;
const BOSS_BRAKE_FORCE = 80;
const BOSS_BRAKE_DURATION = 3;
const BOSS_MIN_SIDE_THRUST = 100;

let bossData = null;

function getAliveCTCount() {
    let count = 0;
    const players = Instance.FindEntitiesByClass("player");
    for (const p of players) { if (p?.IsValid() && p.IsAlive() && p.GetTeamNumber() == 3) count++; }
    return count;
}
function deactivateAllThrusters() {
    if (!bossData) return;
    const { thrust_forward, thrust_left, thrust_right } = bossData;
    Instance.EntFireAtTarget({ target: thrust_forward, input: "Deactivate" });
    Instance.EntFireAtTarget({ target: thrust_left, input: "Deactivate" });
    Instance.EntFireAtTarget({ target: thrust_right, input: "Deactivate" });
}

function registerBossWithBody(body) {
    if (!body || !body.IsValid()) {
        Instance.Msg("❌ Boss 主体无效");
        return;
    }
    if (bossData) {
        if (bossData.interval) clearInterval(bossData.interval);
        bossData = null;
    }

    const bodyName = getEntityName(body);
    let suffix = "";
    const match = bodyName.match(/_(\d+)$/);
    if (match) suffix = "_" + match[1];

    let healthBox = Instance.FindEntityByName("boss_physbox" + suffix);
    if (!healthBox) healthBox = Instance.FindEntityByName("boss_physbox");
    if (!healthBox || !healthBox.IsValid()) {
        Instance.Msg(`⚠️ 未找到对应的 boss_physbox${suffix}`);
        return;
    }

    let thrust_forward = Instance.FindEntityByName("boss_thrust_forward" + suffix);
    let thrust_left = Instance.FindEntityByName("boss_thrust_left" + suffix);
    let thrust_right = Instance.FindEntityByName("boss_thrust_right" + suffix);
    if (!thrust_forward || !thrust_left || !thrust_right) {
        thrust_forward = Instance.FindEntityByName("boss_thrust_forward");
        thrust_left = Instance.FindEntityByName("boss_thrust_left");
        thrust_right = Instance.FindEntityByName("boss_thrust_right");
    }
    if (!thrust_forward || !thrust_left || !thrust_right) {
        Instance.Msg("⚠️ Boss 推力器缺失");
        return;
    }

    Instance.EntFireAtTarget({ target: thrust_forward, input: "Activate" });
    Instance.EntFireAtTarget({ target: thrust_left, input: "Activate" });
    Instance.EntFireAtTarget({ target: thrust_right, input: "Activate" });
    Instance.EntFireAtTarget({ target: thrust_forward, input: "Deactivate" });
    Instance.EntFireAtTarget({ target: thrust_left, input: "Deactivate" });
    Instance.EntFireAtTarget({ target: thrust_right, input: "Deactivate" });
    Instance.EntFireAtTarget({ target: body, input: "Wake" });

    const playerCount = getAliveCTCount();
    const BASE_HEALTH = 30000;
    const HEALTH_PER_PLAYER = 3000;
    const totalHealth = BASE_HEALTH + playerCount * HEALTH_PER_PLAYER;
    Instance.EntFireAtTarget({ target: healthBox, input: "sethealth", value: totalHealth });

    bossData = {
        body, healthBox, thrust_forward, thrust_left, thrust_right,
        currentTarget: null,
        hateTimer: 0,
        hateSwitchInterval: 7,
        baseHealth: BASE_HEALTH,
        healthPerPlayer: HEALTH_PER_PLAYER,
        maxHealth: totalHealth,
        currentHealth: totalHealth,
        isActive: true,
        lastPosition: body.GetAbsOrigin ? body.GetAbsOrigin() : new Vec3(0, 0, 0),
        stuckCounter: 0,
        interval: null,
    };
    if (bossData.interval) clearInterval(bossData.interval);
    bossData.interval = setInterval(() => bossAI(), 40);
    Instance.Msg(`✅ Boss 已注册，主体: ${bodyName}，受击盒: ${getEntityName(healthBox)}，初始血量 = ${totalHealth}（当前 CT：${playerCount} 人）`);
}

function bossAI() {
    if (!bossData || !bossData.isActive) return;
    const { body, thrust_forward, thrust_left, thrust_right } = bossData;
    if (!body?.IsValid() || !thrust_forward?.IsValid() || !thrust_left?.IsValid() || !thrust_right?.IsValid()) {
        clearInterval(bossData.interval);
        bossData = null;
        Instance.Msg("🛑 Boss 实体已失效，终止 AI");
        return;
    }

    const players = Instance.FindEntitiesByClass("player");
    const cts = [];
    for (const p of players) { if (p?.IsValid() && p.IsAlive() && p.GetTeamNumber() === 3) cts.push(p); }
    if (cts.length === 0) { deactivateAllThrusters(); return; }

    bossData.hateTimer += 0.04;
    if (bossData.hateTimer >= bossData.hateSwitchInterval) {
        bossData.hateTimer = 0;
        let candidates = cts.filter(p => p !== bossData.currentTarget);
        if (candidates.length > 0) {
            const bodyPos = body.GetAbsOrigin ? body.GetAbsOrigin() : new Vec3(0, 0, 0);
            let nearest = null, minDist = Infinity;
            for (const p of candidates) {
                const d = Vector3Utils.distance(bodyPos, p.GetAbsOrigin ? p.GetAbsOrigin() : new Vec3(0, 0, 0));
                if (d < minDist) { minDist = d; nearest = p; }
            }
            bossData.currentTarget = nearest;
        }
    } else {
        if (bossData.currentTarget) {
            if (!bossData.currentTarget.IsValid() || !bossData.currentTarget.IsAlive() || bossData.currentTarget.GetTeamNumber() !== 3) {
                bossData.currentTarget = cts.length > 0 ? cts[0] : null;
                bossData.hateTimer = 0;
            }
        } else {
            bossData.currentTarget = cts.length > 0 ? cts[0] : null;
            bossData.hateTimer = 0;
        }
    }
    if (!bossData.currentTarget) { deactivateAllThrusters(); return; }

    let currentForwardThrust = 100;
    let sideActive = false;
    let smoothAngle = 0;
    let brakeActive = false;
    let brakeFrames = 0;
    let lastTurnDirection = 0;

    let currentPos = body.GetAbsOrigin ? body.GetAbsOrigin() : new Vec3(0, 0, 0);
    let displacement = Vector3Utils.distance(currentPos, bossData.lastPosition);
    if (displacement < NPC_STUCK_THRESHOLD) bossData.stuckCounter++; else bossData.stuckCounter = 0;
    bossData.lastPosition = currentPos;

    if (bossData.stuckCounter > NPC_STUCK_FRAME_LIMIT) {
        let bodyPos = body.GetAbsOrigin ? body.GetAbsOrigin() : new Vec3(0, 0, 0);
        let targetPos = bossData.currentTarget.GetAbsOrigin ? bossData.currentTarget.GetAbsOrigin() : new Vec3(0, 0, 0);
        let dirToTarget = Vector3Utils.subtract(targetPos, bodyPos);
        let horizontalDir = new Vec3(dirToTarget.x, dirToTarget.y, 0);
        if (horizontalDir.length > 0.1) {
            let targetAng = Vector3Utils.vectorAngles(horizontalDir);
            body.Teleport(null, targetAng, null);
        }
        bossData.stuckCounter = 0;
        bossData.lastPosition = body.GetAbsOrigin ? body.GetAbsOrigin() : new Vec3(0, 0, 0);
    }

    let targetPos = bossData.currentTarget.GetAbsOrigin ? bossData.currentTarget.GetAbsOrigin() : new Vec3(0, 0, 0);
    let targetVel = bossData.currentTarget.GetVelocity ? bossData.currentTarget.GetVelocity() : new Vec3(0, 0, 0);
    if (targetVel) {
        let predictedPos = Vector3Utils.add(targetPos, Vector3Utils.scale(targetVel, NPC_PREDICT_TIME));
        let delta = Vector3Utils.subtract(predictedPos, body.GetAbsOrigin());
        if (delta.length > NPC_AGGRO_RANGE * 1.2) predictedPos = targetPos;
        targetPos = predictedPos;
    }

    let body_forward = getForwardVector(body.GetAbsAngles());
    let rawAngle = GetDirectionToTarget(body.GetAbsOrigin(), targetPos, body_forward);
    smoothAngle = smoothAngle * NPC_SMOOTH_FACTOR + rawAngle * (1 - NPC_SMOOTH_FACTOR);

    let angleAbs = Math.abs(smoothAngle);
    let speedFactor = MathUtils.clamp(1 - (angleAbs / 90) * 0.75, 0.25, 1.0);
    const distToTarget = Vector3Utils.distance(body.GetAbsOrigin(), targetPos);
    if (distToTarget < 300) speedFactor *= MathUtils.clamp(distToTarget / 300, 0.2, 1.0);
    let targetForward = Math.max(90, BOSS_MAX_FORWARD_THRUST * speedFactor);

    if (currentForwardThrust < targetForward) currentForwardThrust = Math.min(currentForwardThrust + BOSS_ACCELERATION_STEP * 2, targetForward);
    else if (currentForwardThrust > targetForward) currentForwardThrust = Math.max(targetForward, currentForwardThrust - BOSS_ACCELERATION_STEP * 4);
    currentForwardThrust = MathUtils.clamp(currentForwardThrust, 30, BOSS_MAX_FORWARD_THRUST);

    Instance.EntFireAtTarget({ target: thrust_forward, input: "KeyValues", value: "Force " + currentForwardThrust + " 0 0" });
    Instance.EntFireAtTarget({ target: thrust_forward, input: "Activate" });

    let speed = Vector3Utils.length(body.GetVelocity ? body.GetVelocity() : new Vec3(0, 0, 0));
    let sidePower = BOSS_MAX_SIDE_THRUST;
    if (angleAbs < 20) sidePower = BOSS_MAX_SIDE_THRUST * (0.2 + 0.8 * (angleAbs / 20));
    sidePower = Math.max(BOSS_MIN_SIDE_THRUST, sidePower);

    if (smoothAngle > NPC_ANGLE_THRESHOLD) {
        Instance.EntFireAtTarget({ target: thrust_right, input: "KeyValues", value: "Force " + sidePower + " 0 0" });
        Instance.EntFireAtTarget({ target: thrust_right, input: "Activate" });
        Instance.EntFireAtTarget({ target: thrust_left, input: "Deactivate" });
        sideActive = true; lastTurnDirection = 1; brakeActive = false;
    } else if (smoothAngle < -NPC_ANGLE_THRESHOLD) {
        Instance.EntFireAtTarget({ target: thrust_left, input: "KeyValues", value: "Force " + sidePower + " 0 0" });
        Instance.EntFireAtTarget({ target: thrust_left, input: "Activate" });
        Instance.EntFireAtTarget({ target: thrust_right, input: "Deactivate" });
        sideActive = true; lastTurnDirection = -1; brakeActive = false;
    } else {
        if (speed > 80) {
            if (lastTurnDirection !== 0) {
                if (!brakeActive) { brakeActive = true; brakeFrames = BOSS_BRAKE_DURATION; }
                if (brakeFrames > 0) {
                    let brakePower = BOSS_BRAKE_FORCE * (currentForwardThrust / BOSS_MAX_FORWARD_THRUST);
                    if (lastTurnDirection === 1) {
                        Instance.EntFireAtTarget({ target: thrust_left, input: "KeyValues", value: "Force " + brakePower + " 0 0" });
                        Instance.EntFireAtTarget({ target: thrust_left, input: "Activate" });
                        Instance.EntFireAtTarget({ target: thrust_right, input: "Deactivate" });
                    } else {
                        Instance.EntFireAtTarget({ target: thrust_right, input: "KeyValues", value: "Force " + brakePower + " 0 0" });
                        Instance.EntFireAtTarget({ target: thrust_right, input: "Activate" });
                        Instance.EntFireAtTarget({ target: thrust_left, input: "Deactivate" });
                    }
                    sideActive = true; brakeFrames--;
                } else {
                    Instance.EntFireAtTarget({ target: thrust_left, input: "Deactivate" });
                    Instance.EntFireAtTarget({ target: thrust_right, input: "Deactivate" });
                    sideActive = false; brakeActive = false; lastTurnDirection = 0;
                }
            } else {
                if (sideActive) {
                    Instance.EntFireAtTarget({ target: thrust_left, input: "Deactivate" });
                    Instance.EntFireAtTarget({ target: thrust_right, input: "Deactivate" });
                    sideActive = false;
                }
            }
        } else {
            if (!sideActive && angleAbs > 2) {
                let smallPower = Math.max(BOSS_MIN_SIDE_THRUST, sidePower * 0.3);
                if (smoothAngle > 0) {
                    Instance.EntFireAtTarget({ target: thrust_right, input: "KeyValues", value: "Force " + smallPower + " 0 0" });
                    Instance.EntFireAtTarget({ target: thrust_right, input: "Activate" });
                    Instance.EntFireAtTarget({ target: thrust_left, input: "Deactivate" });
                } else {
                    Instance.EntFireAtTarget({ target: thrust_left, input: "KeyValues", value: "Force " + smallPower + " 0 0" });
                    Instance.EntFireAtTarget({ target: thrust_left, input: "Activate" });
                    Instance.EntFireAtTarget({ target: thrust_right, input: "Deactivate" });
                }
                sideActive = true; brakeActive = false; lastTurnDirection = 0;
            } else if (sideActive && angleAbs < 1) {
                Instance.EntFireAtTarget({ target: thrust_left, input: "Deactivate" });
                Instance.EntFireAtTarget({ target: thrust_right, input: "Deactivate" });
                sideActive = false;
            }
        }
    }
    if (distToTarget < 20) {
        Instance.EntFireAtTarget({ target: thrust_forward, input: "Deactivate" });
        Instance.EntFireAtTarget({ target: thrust_left, input: "Deactivate" });
        Instance.EntFireAtTarget({ target: thrust_right, input: "Deactivate" });
        bossData.stuckCounter = 0;
        bossData.lastPosition = body.GetAbsOrigin ? body.GetAbsOrigin() : new Vec3(0, 0, 0);
    }
}

// ---------- Boss 注册入口 ----------
Instance.OnScriptInput("input_register_boss", (stuff) => {
    const caller = stuff.caller;
    if (!caller || !caller.IsValid()) {
        Instance.Msg("❌ input_register_boss: 没有有效的 caller（请确保由 logic_relay 触发）");
        return;
    }
    const name = caller.GetEntityName ? caller.GetEntityName() : '';
    if (!name) {
        Instance.Msg("❌ caller 没有 targetname");
        return;
    }

    const prefix = "boss_register";
    if (!name.startsWith(prefix)) {
        Instance.Msg(`❌ 无效的 caller targetname: ${name}，应以 "boss_register" 开头`);
        return;
    }

    let id = "";
    const rest = name.substring(prefix.length);
    const match = rest.match(/^_(\d+)$/);
    if (match) {
        const num = parseInt(match[1], 10);
        if (num > 0) id = "_" + num;
        else {
            Instance.Msg(`❌ 无效的 Boss ID: ${match[1]}，应为正整数`);
            return;
        }
    } else if (rest.length > 0) {
        Instance.Msg(`❌ 格式错误: ${name}，应为 boss_register 或 boss_register_<ID>`);
        return;
    }

    const bodyName = "boss_body" + id;
    const body = Instance.FindEntityByName(bodyName);
    if (!body || !body.IsValid()) {
        Instance.Msg(`⚠️ 未找到 Boss 主体: ${bodyName}`);
        return;
    }
    registerBossWithBody(body);
});

// ---------- 手动注册 Boss ----------
Instance.OnScriptInput("input_register_boss_manual", () => {
    let body = Instance.FindEntityByName("boss_body");
    if (!body || !body.IsValid()) {
        for (let i = 0; i <= 10; i++) {
            const candidate = Instance.FindEntityByName("boss_body_" + i);
            if (candidate) { body = candidate; break; }
        }
    }
    if (body && body.IsValid()) registerBossWithBody(body);
    else Instance.Msg("⚠️ 未找到任何 boss_body");
});

// ============================================================
// 神器界面
// ============================================================

// 彩蛋cap
Instance.OnScriptInput("input_connect_cap", (stuff) => {
    let init_relay = stuff.caller;
    let button = Instance.FindEntityByName(init_relay.GetEntityName().replace("connect_cap", "item_button_10"));
    button.wep = Instance.FindEntityByName(init_relay.GetEntityName().replace("connect_cap", "item_holder_10"));
    button.relay = Instance.FindEntityByName(init_relay.GetEntityName().replace("connect_cap", "item_relay_10"));
    connect_item(button);
});

// 彩蛋hpz
Instance.OnScriptInput("input_connect_hpz", (stuff) => {
    let init_relay = stuff.caller;
    let button = Instance.FindEntityByName(init_relay.GetEntityName().replace("connect_hpz", "item_button_12"));
    button.wep = Instance.FindEntityByName(init_relay.GetEntityName().replace("connect_hpz", "item_holder_12"));
    button.relay = Instance.FindEntityByName(init_relay.GetEntityName().replace("connect_hpz", "item_relay_12"));
    connect_item(button);
});

// 光束
Instance.OnScriptInput("input_connect_beam", (stuff) => {
    let init_relay = stuff.caller;
    let button = Instance.FindEntityByName(init_relay.GetEntityName().replace("connect_beam", "item_button_2"));
    button.wep = Instance.FindEntityByName(init_relay.GetEntityName().replace("connect_beam", "item_holder_2"));
    button.relay = Instance.FindEntityByName(init_relay.GetEntityName().replace("connect_beam", "item_relay_2"));
    connect_item(button);
});

// heal
Instance.OnScriptInput("input_connect_heal", (stuff) => {
    let init_relay = stuff.caller;
    let button = Instance.FindEntityByName(init_relay.GetEntityName().replace("connect_heal", "item_button_5"));
    button.wep = Instance.FindEntityByName(init_relay.GetEntityName().replace("connect_heal", "item_holder_5"));
    button.relay = Instance.FindEntityByName(init_relay.GetEntityName().replace("connect_heal", "item_relay_5"));
    connect_item(button);
});

// ===== 修改：connect_item 记录按钮和中继 =====
function connect_item(button) {
    Instance.ConnectOutput(button, "OnPressed", (stuff) => {
        if (stuff.activator == button.wep?.GetOwner()) {
            Instance.EntFireAtTarget({ target: button.relay, input: "Trigger", activator: button.wep?.GetOwner() });
        }
    });

    // 只记录按钮和中继，不记录持有者
    if (button && button.IsValid() && !registeredItemButtons.includes(button)) {
        registeredItemButtons.push(button);
    }
    if (button.relay && button.relay.IsValid() && !registeredItemRelays.includes(button.relay)) {
        registeredItemRelays.push(button.relay);
    }
}

// ===== 新增：删除所有已记录的神器按钮和中继 =====
Instance.OnScriptInput("input_kill_items", () => {
    let triggeredCount = 0;
    for (let btn of registeredItemButtons) {
        if (btn && btn.IsValid() && btn.wep && btn.wep.IsValid()) {
            // 触发 holder 的 OnUser1，您可以在 holder 的 OnUser1 输出中 Kill 模型等
            Instance.EntFireAtTarget({ target: btn.wep, input: "FireUser1" });
            triggeredCount++;
        }
    }
    // 清空记录（可选）
    registeredItemButtons = [];
    registeredItemRelays = [];
    Instance.Msg(`✅ 已触发 ${triggeredCount} 个神器的 OnUser1（持有者）。`);
});

// ========== 脚本重载清理 ==========
Instance.OnScriptReload({
    after: () => {
        CLEAR_ALL_INTERVAL = false;
        reset_player_variables();
        registeredBodies = [];
        if (bossData) {
            if (bossData.interval) clearInterval(bossData.interval);
            bossData = null;
        }
        // ===== 新增：清空神器记录 =====
        registeredItemButtons = [];
        registeredItemRelays = [];
        Instance.Msg("脚本已重载，NPC/Boss 注册需重新触发（地图重载或手动输入）");
    }
});

// 启动提示
Instance.Msg("📢 注册方式：为每个 NPC/Boss 创建 logic_relay，targetname 格式：");
Instance.Msg("   NPC: npc_register_light_5  或 npc_register_light_5（类型 light/medium/heavy）");
Instance.Msg("   Boss: boss_register 或 boss_register_3");
Instance.Msg("   在 OnSpawn 输出中调用 RunScriptInput，参数 input_register_npc 或 input_register_boss，Activator 留空。");