import { Instance } from 'cs_script/point_script';

let idPool = 0;
let tasks = [];
function setInterval(callback, ms) {
    const id = idPool++;
    tasks.unshift({
        id,
        everyNSeconds: ms / 1000,
        atSeconds: Instance.GetGameTime() + ms / 1000,
        callback,
    });
    return id;
}
function clearTimeout(id) {
    tasks = tasks.filter((task) => task.id !== id);
}
const clearInterval = clearTimeout;
function runSchedulerTick() {
    for (let i = tasks.length - 1; i >= 0; i--) {
        const task = tasks[i];
        if (Instance.GetGameTime() < task.atSeconds)
            continue;
        if (task.everyNSeconds === undefined)
            tasks.splice(i, 1);
        else
            task.atSeconds = Instance.GetGameTime() + task.everyNSeconds;
        try {
            task.callback();
        }
        catch (err) {
            Instance.Msg('An error occurred inside a scheduler task');
            if (err instanceof Error) {
                Instance.Msg(err.message);
                Instance.Msg(err.stack ?? '<no stack>');
            }
        }
    }
}

class MathUtils {
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
}

class EulerUtils {
    static equals(a, b) {
        return a.pitch === b.pitch && a.yaw === b.yaw && a.roll === b.roll;
    }
    static normalize(angle) {
        const normalizeAngle = (angle) => {
            angle = angle % 360;
            if (angle > 180)
                return angle - 360;
            if (angle < -180)
                return angle + 360;
            return angle;
        };
        return new Euler(normalizeAngle(angle.pitch), normalizeAngle(angle.yaw), normalizeAngle(angle.roll));
    }
    static forward(angle) {
        const pitchInRad = (angle.pitch / 180) * Math.PI;
        const yawInRad = (angle.yaw / 180) * Math.PI;
        const cosPitch = Math.cos(pitchInRad);
        return new Vec3(cosPitch * Math.cos(yawInRad), cosPitch * Math.sin(yawInRad), -Math.sin(pitchInRad));
    }
    static right(angle) {
        const pitchInRad = (angle.pitch / 180) * Math.PI;
        const yawInRad = (angle.yaw / 180) * Math.PI;
        const rollInRad = (angle.roll / 180) * Math.PI;
        const sinPitch = Math.sin(pitchInRad);
        const sinYaw = Math.sin(yawInRad);
        const sinRoll = Math.sin(rollInRad);
        const cosPitch = Math.cos(pitchInRad);
        const cosYaw = Math.cos(yawInRad);
        const cosRoll = Math.cos(rollInRad);
        return new Vec3(-1 * sinRoll * sinPitch * cosYaw + -1 * cosRoll * -sinYaw, -1 * sinRoll * sinPitch * sinYaw + -1 * cosRoll * cosYaw, -1 * sinRoll * cosPitch);
    }
    static up(angle) {
        const pitchInRad = (angle.pitch / 180) * Math.PI;
        const yawInRad = (angle.yaw / 180) * Math.PI;
        const rollInRad = (angle.roll / 180) * Math.PI;
        const sinPitch = Math.sin(pitchInRad);
        const sinYaw = Math.sin(yawInRad);
        const sinRoll = Math.sin(rollInRad);
        const cosPitch = Math.cos(pitchInRad);
        const cosYaw = Math.cos(yawInRad);
        const cosRoll = Math.cos(rollInRad);
        return new Vec3(cosRoll * sinPitch * cosYaw + -sinRoll * -sinYaw, cosRoll * sinPitch * sinYaw + -sinRoll * cosYaw, cosRoll * cosPitch);
    }
    static lerp(a, b, fraction, clamp = true) {
        let t = fraction;
        if (clamp) {
            t = MathUtils.clamp(t, 0, 1);
        }
        const lerpComponent = (start, end, t) => {
            // Calculate the shortest angular distance
            let delta = end - start;
            // Normalize delta to [-180, 180] range to find shortest path
            if (delta > 180) {
                delta -= 360;
            }
            else if (delta < -180) {
                delta += 360;
            }
            // Interpolate using the shortest path
            return start + delta * t;
        };
        // a + (b - a) * t
        return new Euler(lerpComponent(a.pitch, b.pitch, t), lerpComponent(a.yaw, b.yaw, t), lerpComponent(a.roll, b.roll, t));
    }
    static withPitch(angle, pitch) {
        return new Euler(pitch, angle.yaw, angle.roll);
    }
    static withYaw(angle, yaw) {
        return new Euler(angle.pitch, yaw, angle.roll);
    }
    static withRoll(angle, roll) {
        return new Euler(angle.pitch, angle.yaw, roll);
    }
    static rotateTowards(current, target, maxStep) {
        const rotateComponent = (current, target, step) => {
            let delta = target - current;
            if (delta > 180) {
                delta -= 360;
            }
            else if (delta < -180) {
                delta += 360;
            }
            if (Math.abs(delta) <= step) {
                return target;
            }
            else {
                return current + Math.sign(delta) * step;
            }
        };
        return new Euler(rotateComponent(current.pitch, target.pitch, maxStep), rotateComponent(current.yaw, target.yaw, maxStep), rotateComponent(current.roll, target.roll, maxStep));
    }
    static clamp(angle, min, max) {
        return new Euler(MathUtils.clamp(angle.pitch, min.pitch, max.pitch), MathUtils.clamp(angle.yaw, min.yaw, max.yaw), MathUtils.clamp(angle.roll, min.roll, max.roll));
    }
}
class Euler {
    pitch;
    yaw;
    roll;
    static Zero = new Euler(0, 0, 0);
    constructor(pitchOrAngle, yaw, roll) {
        if (typeof pitchOrAngle === 'object') {
            this.pitch = pitchOrAngle.pitch;
            this.yaw = pitchOrAngle.yaw;
            this.roll = pitchOrAngle.roll;
        }
        else {
            this.pitch = pitchOrAngle;
            this.yaw = yaw;
            this.roll = roll;
        }
    }
    /**
     * Returns angle with every componented clamped from -180 to 180
     */
    get normal() {
        return EulerUtils.normalize(this);
    }
    /**
     * Returns a normalized forward direction vector
     */
    get forward() {
        return EulerUtils.forward(this);
    }
    /**
     * Returns a normalized backward direction vector
     */
    get backward() {
        return this.forward.inverse;
    }
    /**
     * Returns a normalized right direction vector
     */
    get right() {
        return EulerUtils.right(this);
    }
    /**
     * Returns a normalized left direction vector
     */
    get left() {
        return this.right.inverse;
    }
    /**
     * Returns a normalized up direction vector
     */
    get up() {
        return EulerUtils.up(this);
    }
    /**
     * Returns a normalized down direction vector
     */
    get down() {
        return this.up.inverse;
    }
    toString() {
        return `Euler: [${this.pitch}, ${this.yaw}, ${this.roll}]`;
    }
    equals(angle) {
        return EulerUtils.equals(this, angle);
    }
    /**
     * Linearly interpolates the angle to an angle based on a 0.0-1.0 fraction
     * Clamp limits the fraction to [0,1]
     * ! Euler angles are not suited for interpolation, prefer to use quarternions instead
     */
    lerp(angle, fraction, clamp = true) {
        return EulerUtils.lerp(this, angle, fraction, clamp);
    }
    /**
     * Returns the same angle but with a supplied pitch component
     */
    withPitch(pitch) {
        return EulerUtils.withPitch(this, pitch);
    }
    /**
     * Returns the same angle but with a supplied yaw component
     */
    withYaw(yaw) {
        return EulerUtils.withYaw(this, yaw);
    }
    /**
     * Returns the same angle but with a supplied roll component
     */
    withRoll(roll) {
        return EulerUtils.withRoll(this, roll);
    }
    /**
     * Rotates an angle towards another angle by a specific step
     * ! Euler angles are not suited for interpolation, prefer to use quarternions instead
     */
    rotateTowards(angle, maxStep) {
        return EulerUtils.rotateTowards(this, angle, maxStep);
    }
    /**
     * Clamps each component (pitch, yaw, roll) between the corresponding min and max values
     */
    clamp(min, max) {
        return EulerUtils.clamp(this, min, max);
    }
}

const RAD_TO_DEG = 180 / Math.PI;

class Vector3Utils {
    static equals(a, b) {
        return a.x === b.x && a.y === b.y && a.z === b.z;
    }
    static add(a, b) {
        return new Vec3(a.x + b.x, a.y + b.y, a.z + b.z);
    }
    static subtract(a, b) {
        return new Vec3(a.x - b.x, a.y - b.y, a.z - b.z);
    }
    static scale(vector, scale) {
        return new Vec3(vector.x * scale, vector.y * scale, vector.z * scale);
    }
    static multiply(a, b) {
        return new Vec3(a.x * b.x, a.y * b.y, a.z * b.z);
    }
    static divide(vector, divider) {
        if (typeof divider === 'number') {
            return new Vec3(vector.x / divider, vector.y / divider, vector.z / divider);
        }
        else {
            return new Vec3(vector.x / divider.x, vector.y / divider.y, vector.z / divider.z);
        }
    }
    static length(vector) {
        return Math.sqrt(Vector3Utils.lengthSquared(vector));
    }
    static lengthSquared(vector) {
        return vector.x ** 2 + vector.y ** 2 + vector.z ** 2;
    }
    static length2D(vector) {
        return Math.sqrt(Vector3Utils.length2DSquared(vector));
    }
    static length2DSquared(vector) {
        return vector.x ** 2 + vector.y ** 2;
    }
    static normalize(vector) {
        const length = Vector3Utils.length(vector);
        return length ? Vector3Utils.divide(vector, length) : Vec3.Zero;
    }
    static dot(a, b) {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }
    static cross(a, b) {
        return new Vec3(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
    }
    static inverse(vector) {
        return new Vec3(-vector.x, -vector.y, -vector.z);
    }
    static distance(a, b) {
        return Vector3Utils.subtract(a, b).length;
    }
    static distanceSquared(a, b) {
        return Vector3Utils.subtract(a, b).lengthSquared;
    }
    static floor(vector) {
        return new Vec3(Math.floor(vector.x), Math.floor(vector.y), Math.floor(vector.z));
    }
    static vectorAngles(vector) {
        let yaw = 0;
        let pitch = 0;
        if (!vector.y && !vector.x) {
            if (vector.z > 0)
                pitch = -90;
            else
                pitch = 90;
        }
        else {
            yaw = Math.atan2(vector.y, vector.x) * RAD_TO_DEG;
            pitch = Math.atan2(-vector.z, Vector3Utils.length2D(vector)) * RAD_TO_DEG;
        }
        return new Euler({
            pitch,
            yaw,
            roll: 0,
        });
    }
    static lerp(a, b, fraction, clamp = true) {
        let t = fraction;
        if (clamp) {
            t = MathUtils.clamp(t, 0, 1);
        }
        // a + (b - a) * t
        return new Vec3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);
    }
    static directionTowards(a, b) {
        return Vector3Utils.subtract(b, a).normal;
    }
    static lookAt(a, b) {
        return Vector3Utils.directionTowards(a, b).eulerAngles;
    }
    static withX(vector, x) {
        return new Vec3(x, vector.y, vector.z);
    }
    static withY(vector, y) {
        return new Vec3(vector.x, y, vector.z);
    }
    static withZ(vector, z) {
        return new Vec3(vector.x, vector.y, z);
    }
}
class Vec3 {
    x;
    y;
    z;
    static Zero = new Vec3(0, 0, 0);
    constructor(xOrVector, y, z) {
        if (typeof xOrVector === 'object') {
            this.x = xOrVector.x;
            this.y = xOrVector.y;
            this.z = xOrVector.z;
        }
        else {
            this.x = xOrVector;
            this.y = y;
            this.z = z;
        }
    }
    get length() {
        return Vector3Utils.length(this);
    }
    get lengthSquared() {
        return Vector3Utils.lengthSquared(this);
    }
    get length2D() {
        return Vector3Utils.length2D(this);
    }
    get length2DSquared() {
        return Vector3Utils.length2DSquared(this);
    }
    /**
     * Normalizes the vector (Dividing the vector by its length to have the length be equal to 1 e.g. [0.0, 0.666, 0.333])
     */
    get normal() {
        return Vector3Utils.normalize(this);
    }
    get inverse() {
        return Vector3Utils.inverse(this);
    }
    /**
     * Floor (Round down) each vector component
     */
    get floored() {
        return Vector3Utils.floor(this);
    }
    /**
     * Calculates the angles from a forward vector
     */
    get eulerAngles() {
        return Vector3Utils.vectorAngles(this);
    }
    toString() {
        return `Vec3: [${this.x}, ${this.y}, ${this.z}]`;
    }
    equals(vector) {
        return Vector3Utils.equals(this, vector);
    }
    add(vector) {
        return Vector3Utils.add(this, vector);
    }
    subtract(vector) {
        return Vector3Utils.subtract(this, vector);
    }
    divide(vector) {
        return Vector3Utils.divide(this, vector);
    }
    scale(scaleOrVector) {
        return typeof scaleOrVector === 'number'
            ? Vector3Utils.scale(this, scaleOrVector)
            : Vector3Utils.multiply(this, scaleOrVector);
    }
    multiply(scaleOrVector) {
        return typeof scaleOrVector === 'number'
            ? Vector3Utils.scale(this, scaleOrVector)
            : Vector3Utils.multiply(this, scaleOrVector);
    }
    dot(vector) {
        return Vector3Utils.dot(this, vector);
    }
    cross(vector) {
        return Vector3Utils.cross(this, vector);
    }
    distance(vector) {
        return Vector3Utils.distance(this, vector);
    }
    distanceSquared(vector) {
        return Vector3Utils.distanceSquared(this, vector);
    }
    /**
     * Linearly interpolates the vector to a point based on a 0.0-1.0 fraction
     * Clamp limits the fraction to [0,1]
     */
    lerpTo(vector, fraction, clamp = true) {
        return Vector3Utils.lerp(this, vector, fraction, clamp);
    }
    /**
     * Gets the normalized direction vector pointing towards specified point (subtracting two vectors)
     */
    directionTowards(vector) {
        return Vector3Utils.directionTowards(this, vector);
    }
    /**
     * Returns an angle pointing towards a point from the current vector
     */
    lookAt(vector) {
        return Vector3Utils.lookAt(this, vector);
    }
    /**
     * Returns the same vector but with a supplied X component
     */
    withX(x) {
        return Vector3Utils.withX(this, x);
    }
    /**
     * Returns the same vector but with a supplied Y component
     */
    withY(y) {
        return Vector3Utils.withY(this, y);
    }
    /**
     * Returns the same vector but with a supplied Z component
     */
    withZ(z) {
        return Vector3Utils.withY(this, z);
    }
}

var Team;
(function (Team) {
    Team[Team["UNASSIGNED"] = 0] = "UNASSIGNED";
    Team[Team["SPECTATOR"] = 1] = "SPECTATOR";
    Team[Team["T"] = 2] = "T";
    Team[Team["CT"] = 3] = "CT";
})(Team || (Team = {}));
var CSWeaponType;
(function (CSWeaponType) {
    CSWeaponType[CSWeaponType["KNIFE"] = 0] = "KNIFE";
    CSWeaponType[CSWeaponType["PISTOL"] = 1] = "PISTOL";
    CSWeaponType[CSWeaponType["SUBMACHINEGUN"] = 2] = "SUBMACHINEGUN";
    CSWeaponType[CSWeaponType["RIFLE"] = 3] = "RIFLE";
    CSWeaponType[CSWeaponType["SHOTGUN"] = 4] = "SHOTGUN";
    CSWeaponType[CSWeaponType["SNIPER_RIFLE"] = 5] = "SNIPER_RIFLE";
    CSWeaponType[CSWeaponType["MACHINEGUN"] = 6] = "MACHINEGUN";
    CSWeaponType[CSWeaponType["C4"] = 7] = "C4";
    CSWeaponType[CSWeaponType["TASER"] = 8] = "TASER";
    CSWeaponType[CSWeaponType["GRENADE"] = 9] = "GRENADE";
    CSWeaponType[CSWeaponType["EQUIPMENT"] = 10] = "EQUIPMENT";
    CSWeaponType[CSWeaponType["STACKABLEITEM"] = 11] = "STACKABLEITEM";
    CSWeaponType[CSWeaponType["UNKNOWN"] = 12] = "UNKNOWN";
})(CSWeaponType || (CSWeaponType = {}));
var CSGearSlot;
(function (CSGearSlot) {
    CSGearSlot[CSGearSlot["INVALID"] = -1] = "INVALID";
    CSGearSlot[CSGearSlot["RIFLE"] = 0] = "RIFLE";
    CSGearSlot[CSGearSlot["PISTOL"] = 1] = "PISTOL";
    CSGearSlot[CSGearSlot["KNIFE"] = 2] = "KNIFE";
    CSGearSlot[CSGearSlot["GRENADES"] = 3] = "GRENADES";
    CSGearSlot[CSGearSlot["C4"] = 4] = "C4";
})(CSGearSlot || (CSGearSlot = {}));
var TraceInteracts;
(function (TraceInteracts) {
    TraceInteracts[TraceInteracts["SOLID"] = 0] = "SOLID";
    TraceInteracts[TraceInteracts["WORLD"] = 1] = "WORLD";
})(TraceInteracts || (TraceInteracts = {}));

//----- BOSS MOVEMENT SCRIPT BY PENGU -----\\
//--------------- VARIABLES ---------------\\
const tickrate = 64; // how often the script makes calculations a second (Not accurate because of custom scheduler. It's best to leave this value alone)
const front_angle = 5; // angle to the left and right in which the boss won't turn if the target is within that angle
const turn_angle_speed = 4; // angle in degrees the boss will turn every tick
const forward_thruster_force = 450; // force of thruster that is used when boss is outside of precision_tracking_distance
const precision_velocity = 450; // velocity used for precision tracking
const precision_tracking_distance = 250; // distance at which script changes how boss moves (at this distance, it's almost impossible to dodge the boss)
const timeout_distance = 50; // distance at which precision tracking is turned off and thruster is being used again until target enters precision_tracking_distance again
const origin_height_offset = 687;
//-----------------------------------------\\
let has_target = false;
let boss_physbox;
let forward_thruster;
let timeout = false;
let bio = false;
Instance.OnScriptInput("SetTarget", (context) => {
    if (has_target) {
        return;
    }
    else {
        const player = context.activator;
        has_target = true;
        timeout = false;
        startBoss(player);
    }
});
Instance.OnScriptInput("SetBossPhysbox", (context) => {
    boss_physbox = context.caller;
});
Instance.OnScriptInput("SetForwardThruster", (context) => {
    forward_thruster = context.caller;
    Instance.EntFireAtTarget({ target: forward_thruster, input: "KeyValue", value: "force " + forward_thruster_force });
});
Instance.OnScriptInput("ResetTarget", () => {
    has_target = false;
});
Instance.OnScriptInput("BioActivate", () => {
    bio = true;
})
Instance.OnScriptInput("BioDeactivate", () => {
    bio = false;
})
function startBoss(target) {
    const interval = setInterval(async () => {
        if (has_target && target.IsValid() && target.GetTeamNumber() === Team.CT && target.GetHealth() > 0) {
            let boss_origin = new Vec3(boss_physbox.GetAbsOrigin());
            boss_origin.z -= origin_height_offset;
            const target_origin = new Vec3(target.GetAbsOrigin());
            const distance = Vector3Utils.distance(target_origin, boss_origin);
            const abs_angle_rad = Math.atan2(target_origin.y - boss_origin.y, target_origin.x - boss_origin.x);
            const abs_angle_deg = atan2Deg(abs_angle_rad);
            const boss_yaw = boss_physbox.GetAbsAngles().yaw;
            const local_angle_deg = wrapDeg(abs_angle_deg, boss_yaw);
            if (!bio) {
                if (local_angle_deg > front_angle) {
                    let angle = boss_physbox.GetAbsAngles();
                    angle.yaw += turn_angle_speed;
                    boss_physbox.Teleport({ angles: angle });
                }
                else {
                    let angle = boss_physbox.GetAbsAngles();
                    angle.yaw -= turn_angle_speed;
                    boss_physbox.Teleport({ angles: angle });
                }
            }
            if (distance >= precision_tracking_distance) {
                Instance.EntFireAtTarget({ target: forward_thruster, input: "Activate" });
                timeout = false;
            }
            else if (distance >= timeout_distance) {
                if (!timeout) {
                    Instance.EntFireAtTarget({ target: forward_thruster, input: "Deactivate", delay: 0.02 });
                    const vel_vec = rad2Vec(abs_angle_rad, precision_velocity);
                    boss_physbox.Teleport({ velocity: vel_vec });
                }
                else {
                    Instance.EntFireAtTarget({ target: forward_thruster, input: "Activate" });
                }
            }
            else {
                if (!timeout) {
                    Instance.EntFireAtTarget({ target: forward_thruster, input: "Deactivate", delay: 0.02 });
                    const vel_vec = rad2Vec(abs_angle_rad, precision_velocity);
                    boss_physbox.Teleport({ velocity: vel_vec });
                    timeout = true;
                }
                else {
                    Instance.EntFireAtTarget({ target: forward_thruster, input: "Activate" });
                }
            }
        }
        else {
            Instance.EntFireAtTarget({ target: forward_thruster, input: "Deactivate", delay: 0.02 });
            clearInterval(interval);
        }
    }, 1000 / tickrate);
}
function atan2Deg(radians) {
    const degrees = radians * (180 / Math.PI); // convert to degrees
    return degrees;
}
function wrapDeg(a, y) {
    let degrees = a - y;
    // Normalize to [-180, 180)
    degrees = ((degrees + 180) % 360 + 360) % 360 - 180;
    return degrees;
}
function rad2Vec(rad, vel) {
    const x = Math.cos(rad);
    const y = Math.sin(rad);
    const vector = new Vec3(x * vel, y * vel, 0);
    return vector;
}
Instance.OnScriptInput("ResetScript", resetScript);
Instance.OnRoundStart(() => resetScript());
function resetScript() {
    has_target = false;
    boss_physbox = undefined;
    forward_thruster = undefined;
    timeout = false;
    bio = false;
}
Instance.SetThink(() => {
    Instance.SetNextThink(Instance.GetGameTime());
    runSchedulerTick();
});
Instance.SetNextThink(Instance.GetGameTime());
