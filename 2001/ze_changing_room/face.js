import { Instance } from "cs_script/point_script";

const state = {
    target: null,
    speed: 0.0,
    speedAcceleration: 0.08,
    speedMax: 12.0,
    retarget: 14,
    lastThinkTime: 0,
    isActive: false,
    cachedSelf: null,
    lastCacheTime: 0
};

class Vector3 {
    constructor(x, y, z) {
        if (y === undefined && z === undefined) {
            this.x = x.x;
            this.y = x.y;
            this.z = x.z;
        } else {
            this.x = x;
            this.y = y;
            this.z = z;
        }
    }

    Length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    Normalized() {
        const len = this.Length();
        if (len === 0) return new Vector3(0, 0, 0);
        return new Vector3(this.x / len, this.y / len, this.z / len);
    }

    Add(vector) {
        return new Vector3(this.x + vector.x, this.y + vector.y, this.z + vector.z);
    }

    Subtract(vector) {
        return new Vector3(this.x - vector.x, this.y - vector.y, this.z - vector.z);
    }

    MultiplyScalar(scalar) {
        return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar);
    }

    Distance(vector) {
        return this.Subtract(vector).Length();
    }
}

function Tick() {
    try {
        if (!state.isActive) {
            Instance.SetNextThink(0.1);
            return;
        }

        const currentTime = Instance.GetGameTime();
        state.lastThinkTime = currentTime;
        
        if (currentTime - state.lastCacheTime > 5 || !state.cachedSelf || !state.cachedSelf.IsValid()) {
            state.cachedSelf = Instance.FindEntityByName("eyes_boom");
            state.lastCacheTime = currentTime;
        }
        
        const self = state.cachedSelf;
        if (!self || !self.IsValid()) {
            Instance.SetNextThink(0.1);
            return;
        }

        if (state.target && state.target.IsValid() && state.target.IsAlive()) {
            state.retarget -= 0.02;

            const selfPos = self.GetAbsOrigin();
            const targetPos = state.target.GetAbsOrigin();
            targetPos.z += 48;
            if (state.retarget <= 0.0) {
                SearchTarget();
            }
            const direction = new Vector3(
                targetPos.x - selfPos.x,
                targetPos.y - selfPos.y,
                targetPos.z - selfPos.z
            ).Normalized();

            const angles = VectorToAngles(direction);
            self.Teleport({ angles: angles });

            const newPos = new Vector3(selfPos).Add(direction.MultiplyScalar(state.speed));
            self.Teleport({ position: newPos });

            if (state.speed < state.speedMax) {
                state.speed += state.speedAcceleration;
            }
        } else {
            SearchTarget();
        }

        Instance.SetNextThink(0.05);
    } catch (error) {
        Instance.SetNextThink(0.1);
    }
}

function SearchTarget() {
    try {
        if (state.target && state.target.IsValid() && state.target.IsAlive()) {
            return;
        }

        state.target = null;
        state.speed = 0.0;

        const currentTime = Instance.GetGameTime();
        if (currentTime - state.lastCacheTime > 5 || !state.cachedSelf || !state.cachedSelf.IsValid()) {
            state.cachedSelf = Instance.FindEntityByName("eyes_boom");
            state.lastCacheTime = currentTime;
        }
        
        const self = state.cachedSelf;
        if (!self || !self.IsValid()) return;

        const selfPos = self.GetAbsOrigin();
        const players = Instance.FindEntitiesByClass("player");
        let nearestPlayer = null;
        let nearestDist = 1e12;

        for (const player of players) {
            if (!player || !player.IsValid() || !player.IsAlive()) continue;
            if (player.GetTeamNumber() !== 3) continue;

            const playerPos = player.GetAbsOrigin();
            playerPos.z += 48;
            const dx = playerPos.x - selfPos.x;
            const dy = playerPos.y - selfPos.y;
            const dz = playerPos.z - selfPos.z;
            const distSq = dx*dx + dy*dy + dz*dz;
            if (distSq < nearestDist) {
                nearestDist = distSq;
                nearestPlayer = player;
            }
        }

        if (nearestPlayer) {
            state.retarget = 14;
            state.target = nearestPlayer;
        }
    } catch (error) {
    }
}

function VectorToAngles(forward) {
    let yaw, pitch;
    
    if (forward.y === 0 && forward.x === 0) {
        yaw = 0;
        pitch = forward.z > 0 ? 270 : 90;
    } else {
        yaw = Math.atan2(forward.y, forward.x) * 180 / Math.PI;
        if (yaw < 0) yaw += 360;

        const tmp = Math.sqrt(forward.x * forward.x + forward.y * forward.y);
        pitch = Math.atan2(-forward.z, tmp) * 180 / Math.PI;
        if (pitch < 0) pitch += 360;
    }
    
    return { pitch, yaw, roll: 0 };
}

function StartTracking() {
    state.isActive = true;
    state.speed = 0.0;
    state.retarget = 14;
    SearchTarget();
}

function StopTracking() {
    state.isActive = false;
    state.target = null;
    state.speed = 0.0;
}

Instance.OnActivate(() => {});
Instance.OnScriptReload({ after: () => {} });
Instance.OnScriptInput("start", () => {
    try {
        StartTracking();
    } catch (error) {
    }
});
Instance.OnScriptInput("stop", () => {
    try {
        StopTracking();
    } catch (error) {
    }
});
Instance.SetThink(Tick);
Instance.SetNextThink(0.1);
