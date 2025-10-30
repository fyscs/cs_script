import { CSPlayerPawn, Entity, Instance, PointTemplate } from "cs_script/point_script";

// 状态管理
const state = {
    target: null,
    speed: 0.0,
    speedAcceleration: 0.08,  // 加速度
    speedMax: 12.0,            // 最大速度
    retarget: 14,
    lastThinkTime: 0,
    isActive: false  // 添加激活状态
};

// Vector3 工具类
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

// 初始化函数
function Init() {
    
}

// 主循环函数
function Tick() {
    try {
        // 只有在激活状态下才执行追踪逻辑
        if (!state.isActive) {
            Instance.SetNextThink(0.1); // 降低频率等待激活
            return;
        }

        const currentTime = Instance.GetGameTime();
        const deltaTime = currentTime - state.lastThinkTime;
        state.lastThinkTime = currentTime;

        if (state.target && state.target.IsValid() && state.target.IsAlive()) {
            state.retarget -= 0.02;
            
            const self = Instance.FindEntityByName("eyes_boom"); // 需要根据实际情况调整
            if (!self || !self.IsValid()) return;

            const selfPos = self.GetAbsOrigin();
            const targetPos = state.target.GetAbsOrigin();
            targetPos.z += 48;

            // 始终根据目标位置旋转并推进
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

        Instance.SetNextThink(0.01);
    } catch (error) {
        // 静默处理错误
        Instance.SetNextThink(0.1);
    }
}


// 搜索目标函数
function SearchTarget() {
    try {
        // 检查当前目标是否有效
        if (state.target && state.target.IsValid() && state.target.IsAlive()) {
            return;
        }

        state.target = null;
        state.speed = 0.0;

        const self = Instance.FindEntityByName("eyes_boom"); // 需要根据实际情况调整
        if (!self || !self.IsValid()) return;

        const selfPos = self.GetAbsOrigin();
        const players = Instance.FindEntitiesByClass("player");
        let nearestPlayer = null;
        let nearestDist = 1e12;

        for (const player of players) {
            if (!player || !player.IsValid() || !player.IsAlive()) continue;
            if (player.GetTeamNumber() !== 3) continue; // 团队3

            const playerPos = player.GetAbsOrigin();
            playerPos.z += 48;

            // 计算距离，选择最近CT
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
        // 静默处理错误
    }
}


// 工具函数
function GetRandomValue(max) {
    return Math.floor(Math.random() * (max + 1));
}

// 用距离最近策略

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

// 启动追踪功能
function StartTracking() {
    state.isActive = true;
    state.speed = 0.0; // 重置速度
    state.retarget = 14; // 重置重新选择目标时间
    SearchTarget(); // 立即搜索目标
    Instance.Msg("目标追踪已启动");
}

// 停止追踪功能
function StopTracking() {
    state.isActive = false;
    state.target = null;
    state.speed = 0.0;
    Instance.Msg("目标追踪已停止");
}

// 事件监听
Instance.OnActivate(() => {
    Init();
});

Instance.OnScriptReload({
    after: () => {
        Init();
    }
});

// 脚本输入处理
Instance.OnScriptInput("start", (inputData) => {
    try {
        StartTracking();
    } catch (error) {
        // 静默处理错误
    }
});

Instance.OnScriptInput("stop", (inputData) => {
    try {
        StopTracking();
    } catch (error) {
        // 静默处理错误
    }
});

// 设置思考函数
Instance.SetThink(Tick);
Instance.SetNextThink(0.1); // 初始频率较低，等待激活
