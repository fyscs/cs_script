import { Instance } from "cs_script/point_script";

// by 凯岩城的狼

const state = {
    activeArrows: new Map(),
    arrowCounter: 0,
    lastUseTime: 0,
    cachedTemplate: null,
    lastCacheTime: 0
};

// 箭头配置
const ARROW_CONFIG = {
    cooldownTime: 40.0 // 冷却时间（秒）
};

const TEAM_CT = 3; // CT队伍ID

// 向量3D类
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
}

// 角度转向量
function AnglesToVector(angles) {
    const radYaw = angles.yaw / 180 * Math.PI;
    const radPitch = angles.pitch / 180 * Math.PI;
    return new Vector3(
        Math.cos(radYaw) * Math.cos(radPitch),
        Math.sin(radYaw) * Math.cos(radPitch),
        -Math.sin(radPitch)
    );
}

// 向量转角度
function VectorToAngles(forward) {
    let yaw;
    let pitch;
    
    if (forward.y === 0 && forward.x === 0) {
        yaw = 0;
        if (forward.z > 0)
            pitch = 270;
        else
            pitch = 90;
    } else {
        yaw = (Math.atan2(forward.y, forward.x) * 180 / Math.PI);
        if (yaw < 0)
            yaw += 360;

        const tmp = Math.sqrt(forward.x * forward.x + forward.y * forward.y);
        pitch = (Math.atan2(-forward.z, tmp) * 180 / Math.PI);
        if (pitch < 0)
            pitch += 360;
    }
    
    return {
        pitch,
        yaw,
        roll: 0
    };
}

// 计算玩家瞄准位置
function CalculateAimPosition(player) {
    try {
        const eyePos = player.GetEyePosition();
        const eyeAngles = player.GetEyeAngles();
        const direction = AnglesToVector(eyeAngles);
        
        // 进行射线追踪，找到瞄准的目标点
        const traceResult = Instance.TraceLine({
            start: eyePos,
            end: {
                x: eyePos.x + direction.x * 10000,
                y: eyePos.y + direction.y * 10000,
                z: eyePos.z + direction.z * 10000
            },
            ignoreEntity: player,
            ignorePlayers: false
        });
        
        if (traceResult && traceResult.didHit) {
            return traceResult.end;
        } else {
            // 如果没有击中任何东西，在最大距离处生成
            return {
                x: eyePos.x + direction.x * 1000,
                y: eyePos.y + direction.y * 1000,
                z: eyePos.z + direction.z * 1000
            };
        }
    } catch (error) {
        return null;
    }
}

// 计算箭头朝向地面的角度
function CalculateArrowAngles(pingPosition, playerPosition) {
    // 计算从玩家到ping位置的方向
    const direction = new Vector3(
        pingPosition.x - playerPosition.x,
        pingPosition.y - playerPosition.y,
        pingPosition.z - playerPosition.z
    ).Normalized();
    
    // 将方向转换为角度
    const angles = VectorToAngles(direction);
    
    // 让箭头稍微向下倾斜，看起来更自然
    angles.pitch += 15; // 向下倾斜15度
    
    return angles;
}

// 创建箭头 
function CreateArrow(pingPosition, player) {
    try {
        // 获取玩家位置
        const playerPosition = player.GetAbsOrigin();
        
        // 计算箭头角度
        const arrowAngles = CalculateArrowAngles(pingPosition, playerPosition);
        
        // 在ping位置稍微上方生成箭头，避免嵌入地面
        const spawnPosition = {
            x: pingPosition.x,
            y: pingPosition.y,
            z: pingPosition.z + 5 // 稍微抬高5单位
        };

        const currentTime = Instance.GetGameTime();
        if (currentTime - state.lastCacheTime > 30 || !state.cachedTemplate || !state.cachedTemplate.IsValid()) {
            state.cachedTemplate = Instance.FindEntityByName("@ar_temp");
            state.lastCacheTime = currentTime;
        }
        
        const template = state.cachedTemplate;
        if (!template || !template.IsValid()) {
            return null;
        }

        // 先移动模板到目标位置，然后生成
        template.Teleport({
            position: spawnPosition,
            angles: arrowAngles
        });
        
        // 使用ForceSpawn生成实体
        const spawnedEntities = template.ForceSpawn();
        
        if (spawnedEntities && spawnedEntities.length > 0) {
            const arrowId = ++state.arrowCounter;
            const arrowEntity = spawnedEntities[0];
            
            // 存储箭头信息
            state.activeArrows.set(arrowId, {
                entity: arrowEntity,
                player: player
            });
            
            return arrowId;
        }
    } catch (error) {
        // 静默处理错误
    }
    
    return null;
}

// 检查是否可以生成箭头（全局冷却）
function CanUseArrow() {
    if (state.lastUseTime === 0) {
        return true; // 第一次使用
    }
    
    const currentTime = Instance.GetGameTime();
    const elapsed = currentTime - state.lastUseTime;
    
    return elapsed >= ARROW_CONFIG.cooldownTime;
}

// 获取剩余冷却时间
function GetRemainingCooldown() {
    if (state.lastUseTime === 0) {
        return 0;
    }
    
    const currentTime = Instance.GetGameTime();
    const elapsed = currentTime - state.lastUseTime;
    const remaining = ARROW_CONFIG.cooldownTime - elapsed;
    
    return Math.max(0, remaining);
}

// 监听玩家ping事件
Instance.OnPlayerPing((event) => {
    try {
        const player = event.player;
        const pingPosition = event.position;
        
        if (!player) {
            return;
        }
        
        // 获取玩家pawn
        const playerPawn = player.GetPlayerPawn();
        if (!playerPawn) {
            return;
        }
        
        // 检查是否为CT
        if (playerPawn.GetTeamNumber() !== TEAM_CT) {
            return;
        }
        
        // 检查全局冷却时间（20秒内所有人只能使用一次）
        if (!CanUseArrow()) {
            return;
        }
        
        // 如果ping位置无效，使用玩家瞄准方向计算位置
        let targetPosition = pingPosition;
        if (!targetPosition) {
            targetPosition = CalculateAimPosition(playerPawn);
        }
        
        if (!targetPosition) {
            return;
        }
        
        // 创建箭头
        try {
            CreateArrow(targetPosition, playerPawn);
            // 记录全局使用时间
            state.lastUseTime = Instance.GetGameTime();
        } catch (error) {
            // 静默处理错误
        }
        
    } catch (error) {
        // 静默处理错误
    }
});

// 清理所有箭头的手动输入
Instance.OnScriptInput("clear_arrows", (inputData) => {
    for (const [arrowId, arrowInfo] of state.activeArrows) {
        if (arrowInfo.entity && arrowInfo.entity.IsValid()) {
            arrowInfo.entity.Remove();
        }
    }
    state.activeArrows.clear();
});

// 脚本重新加载
Instance.OnScriptReload({
    after: () => {
        state.activeArrows.clear();
        state.arrowCounter = 0;
    }
});