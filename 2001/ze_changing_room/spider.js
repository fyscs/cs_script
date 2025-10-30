import { CSPlayerPawn, Entity, Instance, PointTemplate } from "cs_script/point_script";

//by 凯岩城的狼
// 状态管理
const state = {
    spiders: new Map(),
    isActive: false,
    stuckMode: false,
    stuckPlayer: null,
    // 缓存常用数据
    cache: {
        lastPlayerUpdate: 0,
        validPlayers: [],
        updateInterval: 0.5 // 每0.5秒更新一次玩家列表
    }
};

// 玩家查找
function getValidPlayers() {
    const currentTime = Instance.GetGameTime();
    if (currentTime - state.cache.lastPlayerUpdate > state.cache.updateInterval) {
        state.cache.validPlayers = Instance.FindEntitiesByClass("player")
            .filter(player => player?.IsValid() && player.IsAlive() && player.GetTeamNumber() === 3);
        state.cache.lastPlayerUpdate = currentTime;
    }
    return state.cache.validPlayers;
}

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

    LengthSq() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
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

    DistanceSq(vector) {
        return this.Subtract(vector).LengthSq();
    }
}

// 蜘蛛状态类
class SpiderState {
    constructor(entity) {
        this.entity = entity;
        this.target = null;
        this.lastJumpTime = 0;
        this.jumpCooldown = 1.5; // 适中的冷却时间，允许更频繁接近目标
        this.jumpForce = 300;    // 跳跃力度（降低）
        this.isStuck = false;
        this.stuckPlayer = null;
        this.lastTargetPos = null; // 上次目标位置
        this.targetVelocity = null; // 目标移动速度
        this.consecutiveMisses = 0; // 连续失误次数
        this.lastJumpSuccess = true; // 上次跳跃是否成功
        this.groundStabilization = true; // 地面稳定系统
        this.lastGroundCheck = 0; // 上次地面检查时间
    }

    // 检查是否可以跳跃
    canJump() {
        const currentTime = Instance.GetGameTime();
        const timeSinceLastJump = currentTime - this.lastJumpTime;
        
        // 检查蜘蛛是否在地面上
        const velocity = this.entity.GetAbsVelocity();
        const speed = new Vector3(velocity).Length();
        
        
        if (speed > 100) {
            return false; // 在空中时不跳跃
        }
        
        // 获取当前目标距离
        const currentTarget = findBestTarget(new Vector3(this.entity.GetAbsOrigin()));
        const targetDistance = currentTarget ? 
            new Vector3(this.entity.GetAbsOrigin()).Distance(new Vector3(currentTarget.GetAbsOrigin())) : 0;
        
        // 基于距离的动态冷却时间调整
        let adjustedCooldown = this.calculateDistanceBasedCooldown(targetDistance);
        
        // 根据连续失误调整冷却时间
        if (this.consecutiveMisses > 3) {
            adjustedCooldown *= 1.3; // 失误多时适度增加冷却时间
        } else if (this.consecutiveMisses === 0 && this.lastJumpSuccess) {
            adjustedCooldown *= 0.9; // 成功时轻微减少冷却时间
        }
        
        return timeSinceLastJump >= adjustedCooldown;
    }

    // 基于距离计算冷却时间
    calculateDistanceBasedCooldown(targetDistance) {
        // 基础冷却时间
        let baseCooldown = this.jumpCooldown;
        
        if (targetDistance < 50) {
            // 极近距离：快速冷却，允许频繁跳跃
            return baseCooldown * 0.6;
        } else if (targetDistance < 150) {
            // 近距离：正常冷却
            return baseCooldown * 0.8;
        } else if (targetDistance < 300) {
            // 中距离：标准冷却
            return baseCooldown;
        } else if (targetDistance < 500) {
            // 长距离：增加冷却时间，避免过度跳跃
            return baseCooldown * 1.2;
        } else {
            // 超长距离：大幅增加冷却时间
            return baseCooldown * 1.5;
        }
    }

    // 执行智能跳跃
    jump() {
        if (!this.canJump()) return false;

        const spiderPos = new Vector3(this.entity.GetAbsOrigin());
        
        // 每次跳跃都随机选择一个新的CT目标
        const randomTarget = findBestTarget(spiderPos);
        if (!randomTarget) return false;
        
        const targetPos = randomTarget.GetAbsOrigin();
        targetPos.z += 38; // 瞄准玩家中心
        
        // 智能高度预测 - 考虑目标移动
        const predictedHeight = this.predictTargetHeight(randomTarget, targetPos.z);
        targetPos.z = predictedHeight;
        
        // 计算从蜘蛛到目标的方向向量
        const direction = new Vector3(
            targetPos.x - spiderPos.x,
            targetPos.y - spiderPos.y,
            targetPos.z - spiderPos.z
        );

        // 计算距离和高度差
        const distance = direction.Length();
        const heightDiff = targetPos.z - spiderPos.z;
        
        // 先旋转蜘蛛朝向目标
        const normalizedDir = direction.Normalized();
        const angles = VectorToAngles(normalizedDir);
        // 确保roll角度为0，防止乱滚
        const stableAngles = { pitch: angles.pitch, yaw: angles.yaw, roll: 0 };
        this.entity.Teleport({ angles: stableAngles });
        
        // 使用物理计算来优化跳跃力度
        const jumpResult = this.calculateOptimalJumpVelocity(direction, distance, heightDiff);
        const jumpVelocity = jumpResult.velocity;
        const accuracyFactor = jumpResult.accuracyFactor;
        const flightTime = jumpResult.flightTime;
        
        // 应用速度
        this.entity.Teleport({ velocity: jumpVelocity });
        this.lastJumpTime = Instance.GetGameTime();
        
        // 记录跳跃类型用于统计
        this.lastJumpType = jumpResult.jumpType;
        
        // 不需要更新目标位置记录
        
        // 设置跳跃结果检测定时器
        this.scheduleJumpResultCheck(distance);
        
        return true;
    }

    // 预测目标位置
    predictTargetPosition(currentTargetPos) {
        if (!this.target || !this.lastTargetPos) {
            return currentTargetPos; // 无法预测时返回当前位置
        }

        const currentPos = new Vector3(currentTargetPos);
        const lastPos = this.lastTargetPos;
        
        // 计算目标移动速度
        const deltaTime = Instance.GetGameTime() - this.lastJumpTime;
        if (deltaTime > 0) {
            this.targetVelocity = new Vector3(
                (currentPos.x - lastPos.x) / deltaTime,
                (currentPos.y - lastPos.y) / deltaTime,
                (currentPos.z - lastPos.z) / deltaTime
            );
        }
        
        // 如果没有速度信息，返回当前位置
        if (!this.targetVelocity) {
            return currentTargetPos;
        }
        
        // 预测跳跃飞行时间
        const spiderPos = new Vector3(this.entity.GetAbsOrigin());
        const distance = spiderPos.Distance(currentPos);
        const estimatedFlightTime = Math.min(1.0, distance / 400); // 估算飞行时间
        
        // 预测目标在飞行时间后的位置
        const predictedPos = new Vector3(
            currentPos.x + this.targetVelocity.x * estimatedFlightTime,
            currentPos.y + this.targetVelocity.y * estimatedFlightTime,
            currentPos.z + this.targetVelocity.z * estimatedFlightTime
        );
        
        return predictedPos;
    }

    // 安排跳跃结果检测
    scheduleJumpResultCheck(initialDistance) {
        // 存储检查信息，在主循环中处理
        this.pendingJumpCheck = {
            initialDistance: initialDistance,
            checkTime: Instance.GetGameTime() + 0.5
        };
    }

    // 检查跳跃结果
    checkJumpResult(initialDistance) {
        if (!this.target || !this.target.IsValid()) {
            this.consecutiveMisses++;
            this.lastJumpSuccess = false;
            return;
        }

        const spiderPos = new Vector3(this.entity.GetAbsOrigin());
        const targetPos = this.target.GetAbsOrigin();
        const currentDistance = spiderPos.Distance(new Vector3(targetPos));
        
        // 判断跳跃是否成功
        const distanceImprovement = initialDistance - currentDistance;
        const isSuccessful = distanceImprovement > 50; // 距离减少超过50单位认为成功
        
        if (isSuccessful) {
            this.consecutiveMisses = 0;
            this.lastJumpSuccess = true;
        } else {
            this.consecutiveMisses++;
            this.lastJumpSuccess = false;
        }
    }

    // 计算最优跳跃速度
    calculateOptimalJumpVelocity(direction, distance, heightDiff) {
        const horizontalDistance = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
        const hasObstacle = this.checkPathObstacles(
            new Vector3(this.entity.GetAbsOrigin()),
            new Vector3(this.entity.GetAbsOrigin()).Add(direction)
        );
        
        const jumpParams = this.getJumpParams(horizontalDistance);
        const verticalSpeed = this.calculateVerticalSpeed(horizontalDistance, heightDiff, jumpParams.flightTime, hasObstacle);
        
        const horizontalSpeed = Math.min(
            horizontalDistance / jumpParams.flightTime * jumpParams.accuracyFactor,
            jumpParams.maxHorizontalSpeed
        );
        
        const normalizedHorizontal = new Vector3(direction.x, direction.y, 0).Normalized();
        
        // 当与目标几乎在同一水平面时，进一步降低垂直速度上下限，避免跳得过高
        const isSameLevel = Math.abs(heightDiff) <= 12;
        const effectiveMinV = isSameLevel ? 10 : Math.max(60, jumpParams.minVerticalSpeed * 0.8);
        const effectiveMaxV = isSameLevel ? Math.min(jumpParams.maxVerticalSpeed, 110) : Math.max(200, jumpParams.maxVerticalSpeed * 0.85);
        
        return {
            velocity: new Vector3(
                normalizedHorizontal.x * horizontalSpeed,
                normalizedHorizontal.y * horizontalSpeed,
                Math.max(effectiveMinV, Math.min(verticalSpeed, effectiveMaxV))
            ),
            accuracyFactor: jumpParams.accuracyFactor,
            flightTime: jumpParams.flightTime,
            jumpType: jumpParams.jumpType
        };
    }

    // 获取跳跃参数
    getJumpParams(horizontalDistance) {
        const params = [
            { max: 20, flightTime: 0.30, accuracy: 0.70, maxH: 180, minV: 80,  maxV: 320, type: "precision" },
            { max: 120, flightTime: 0.48, accuracy: 0.80, maxH: 260, minV: 95,  maxV: 380, type: "close_range" },
            { max: 300, flightTime: 0.65, accuracy: 0.90, maxH: 340, minV: 120, maxV: 460, type: "medium_range" },
            { max: 500, flightTime: 0.95, accuracy: 1.00, maxH: 420, minV: 170, maxV: 560, type: "long_range" },
            { max: Infinity, flightTime: 1.15, accuracy: 1.05, maxH: 520, minV: 200, maxV: 650, type: "extreme_range" }
        ];
        
        const param = params.find(p => horizontalDistance < p.max);
        return {
            flightTime: param.flightTime,
            accuracyFactor: param.accuracy,
            maxHorizontalSpeed: param.maxH,
            minVerticalSpeed: param.minV,
            maxVerticalSpeed: param.maxV,
            jumpType: param.type
        };
    }

    // 计算垂直速度 - 降低跳跃力度
    calculateVerticalSpeed(horizontalDistance, heightDiff, flightTime, hasObstacle) {
        const gravity = 800;
        const isSameLevel = Math.abs(heightDiff) <= 8;
        
        // 同层时采用极低基础高度且不加入飞行时间补偿，避免过高
        if (isSameLevel) {
            const baseHeightSame = 6; // 更贴地（再降）
            const finalHeightSame = baseHeightSame; // 同层不放大障碍物系数
            return Math.sqrt(2 * gravity * finalHeightSame);
        }
        
        const baseHeight = this.getBaseHeight(horizontalDistance);
        const requiredHeight = this.calculateRequiredHeight(baseHeight, heightDiff, flightTime, gravity);
        const finalHeight = hasObstacle ? requiredHeight * 1.15 : requiredHeight; // 进一步降低障碍物倍数
        
        // 极远距离时给予小幅高度补偿，避免远距离跳得过低
        const farBoost = horizontalDistance > 350 ? Math.min(24, (horizontalDistance - 350) * 0.04) : 0;
        const boostedHeight = finalHeight + farBoost;
        
        // 非同层时保留较小补偿
        return Math.sqrt(2 * gravity * boostedHeight) + gravity * flightTime * 0.18; // 再小幅降低（飞行补偿更小）
    }

    // 获取基础高度 - 大幅降低无高度差时的跳跃
    getBaseHeight(horizontalDistance) {
        const heights = [10, 14, 18, 24, 34, 48]; // 远距离略增基础高度，避免过低
        const thresholds = [50, 100, 200, 300, 500];
        return heights[thresholds.findIndex(t => horizontalDistance < t)] || heights[heights.length - 1];
    }

    // 计算所需高度 - 优化高度差判断
    calculateRequiredHeight(baseHeight, heightDiff, flightTime, gravity) {
        // 降低阈值，更敏感地检测高度差
        const threshold = Math.max(4, baseHeight * 0.04); // 更敏感但更低
        
        if (heightDiff > threshold) {
            // 目标在上方：计算所需额外高度
            const compensation = heightDiff + gravity * flightTime * flightTime * 0.08; // 进一步降低重力补偿
            return baseHeight + (heightDiff > 50 ? compensation * 1.05 : compensation);
        } else if (heightDiff < -threshold) {
            // 目标在下方：减少高度
            const reduction = Math.min(0.6, Math.abs(heightDiff) / baseHeight);
            return baseHeight + Math.max(-baseHeight * 0.35, heightDiff * reduction);
        }
        
        // 无高度差时使用较低的基础高度
        return baseHeight;
    }

    // 智能预测目标高度
    predictTargetHeight(target, currentHeight) {
        if (!target || !target.IsValid()) {
            return currentHeight;
        }

        // 获取目标速度
        const velocity = target.GetAbsVelocity();
        const verticalVelocity = velocity.z;
        
        // 估算飞行时间
        const spiderPos = new Vector3(this.entity.GetAbsOrigin());
        const targetPos = new Vector3(target.GetAbsOrigin());
        const distance = spiderPos.Distance(targetPos);
        const estimatedFlightTime = Math.min(1.5, distance / 400);
        
        // 预测目标在飞行时间后的高度
        // 考虑重力对目标的影响
        let predictedHeight = currentHeight;
        
        if (verticalVelocity !== 0) {
            // 如果目标有垂直速度，预测其高度变化
            const gravity = 800; // 重力加速度
            predictedHeight += verticalVelocity * estimatedFlightTime;
            
            // 如果目标在空中下降，考虑重力影响
            if (verticalVelocity < 0) {
                predictedHeight -= 0.5 * gravity * estimatedFlightTime * estimatedFlightTime;
            }
        }
        
        // 限制预测范围，避免过度预测
        const maxPrediction = 100; // 最大预测高度变化
        const heightChange = predictedHeight - currentHeight;
        if (Math.abs(heightChange) > maxPrediction) {
            predictedHeight = currentHeight + (heightChange > 0 ? maxPrediction : -maxPrediction);
        }
        
        return predictedHeight;
    }

    // 检查路径上的障碍物
    checkPathObstacles(startPos, endPos) {
        // 使用射线检测检查路径
        const traceResult = Instance.TraceLine({
            start: startPos,
            end: endPos,
            ignorePlayers: true
        });
        
        // 如果射线击中了实体且不是玩家，则认为有障碍物
        if (traceResult.didHit && traceResult.hitEntity) {
            const hitEntity = traceResult.hitEntity;
            // 检查是否击中玩家
            if (hitEntity.GetClassName() === "player") {
                return false; // 击中玩家不算障碍物
            }
            return true; // 击中其他实体算障碍物
        }
        
        return false; // 没有击中任何实体
    }

    // 地面稳定系统
    stabilizeOnGround() {
        if (!this.groundStabilization) return;
        
        const currentTime = Instance.GetGameTime();
        // 每0.1秒检查一次地面状态
        if (currentTime - this.lastGroundCheck < 0.1) return;
        this.lastGroundCheck = currentTime;
        
        const spiderPos = new Vector3(this.entity.GetAbsOrigin());
        const velocity = this.entity.GetAbsVelocity();
        const speed = new Vector3(velocity).Length();
        
        // 如果蜘蛛移动速度很慢
        if (speed < 50) {
            // 检查地面
            const groundPos = this.findGroundPosition(spiderPos);
            if (groundPos) {
                // 如果当前位置与地面位置差异较大，进行修正
                const heightDiff = Math.abs(spiderPos.z - groundPos.z);
                if (heightDiff > 5) {
                    // 修正位置到地面
                    const correctedPos = new Vector3(spiderPos.x, spiderPos.y, groundPos.z);
                    this.entity.Teleport({ 
                        position: correctedPos,
                        velocity: { x: 0, y: 0, z: 0 } // 停止移动
                    });
                }
            }
            
            // 稳定旋转
            this.stabilizeRotation();
        }
    }
    
    // 查找地面位置
    findGroundPosition(spiderPos) {
        // 向下发射射线检测地面
        const traceResult = Instance.TraceLine({
            start: spiderPos,
            end: new Vector3(spiderPos.x, spiderPos.y, spiderPos.z - 200), // 向下200单位
            ignorePlayers: true
        });
        
        if (traceResult.didHit) {
            return new Vector3(traceResult.end);
        }
        
        return null;
    }
    
    // 稳定旋转
    stabilizeRotation() {
        const currentAngles = this.entity.GetAbsAngles();
        

        const stabilizedAngles = {
            pitch: currentAngles.pitch,
            yaw: currentAngles.yaw,
            roll: 0 
        };
        

        this.entity.Teleport({ angles: stabilizedAngles });
    }

    // 粘附到玩家身上
    stickToPlayer(player) {
        this.isStuck = true;
        this.stuckPlayer = player;
        this.target = null; // 清除目标
    }

    // 取消粘附
    unstick() {
        this.isStuck = false;
        this.stuckPlayer = null;
    }

    // 更新粘附位置 
    updateStuckPosition() {
        if (!this.isStuck || !this.stuckPlayer || !this.stuckPlayer.IsValid()) {
            this.unstick();
            return;
        }

        const playerPos = this.stuckPlayer.GetAbsOrigin();
        const playerAngles = this.stuckPlayer.GetAbsAngles();
        
        // 计算玩家位置
        const waistHeight = 40;
        
        // 计算玩家视角相对视的方向
        const yawRad = playerAngles.yaw * Math.PI / 270;
        const pitchRad = playerAngles.pitch * Math.PI / 180;
        
        // 计算玩家后方位置
        const backDistance = 8; // 距离玩家10单位
        const backPos = new Vector3(
            playerPos.x - Math.sin(yawRad) * Math.cos(pitchRad) * backDistance,
            playerPos.y + Math.cos(yawRad) * Math.cos(pitchRad) * backDistance,
            playerPos.z + waistHeight + Math.sin(pitchRad) * backDistance
        );
        
        // 计算朝向玩家相反的角度
        const direction = new Vector3(
            backPos.x - playerPos.x,
            backPos.y - playerPos.y,
            backPos.z - playerPos.z
        );
        
        const angles = VectorToAngles(direction);
        
        // 传送到后方位置，停止移动，朝向玩家相反方向
        this.entity.Teleport({ 
            position: backPos,
            velocity: { x: 0, y: 0, z: 0 }, // 停止移动
            angles: angles // 朝向玩家相反方向
        });
    }
}

// 初始化函数 
function Init() {
    Instance.SetNextThink(0.1);
}

// 主循环函数
function Tick() {
    try {
        // 只有在激活状态下才执行追踪逻辑
        if (!state.isActive) {
            Instance.SetNextThink(0.1);
            return;
        }

        // 更新所有蜘蛛
        updateAllSpiders();

        // 动态调整更新频率以提高性能
        const spiderCount = state.spiders.size;
        let updateInterval = 0.1; // 默认更新间隔
        
        if (spiderCount > 5) {
            updateInterval = 0.15; // 蜘蛛多时降低更新频率
        } else if (spiderCount === 0) {
            updateInterval = 0.5; // 没有蜘蛛时大幅降低更新频率
        }

        Instance.SetNextThink(updateInterval);
    } catch (error) {
        Instance.SetNextThink(0.1);
    }
}

// 更新所有蜘蛛 
function updateAllSpiders() {
    // 获取@spider_1实体
    const spiders = Instance.FindEntitiesByName("@spider_1");
    
    // 清理无效的蜘蛛状态
    for (const [entityName, spiderState] of state.spiders) {
        if (!spiderState.entity.IsValid()) {
            state.spiders.delete(entityName);
        }
    }

    // 为每个蜘蛛创建或更新状态
    for (const spider of spiders) {
        if (!spider.IsValid()) continue;

        const entityName = spider.GetEntityName();
        if (!entityName) continue;

        let spiderState = state.spiders.get(entityName);
        if (!spiderState) {
            spiderState = new SpiderState(spider);
            state.spiders.set(entityName, spiderState);
        }

        // 更新蜘蛛状态
        updateSpider(spiderState);
        
        // 应用地面稳定系统
        spiderState.stabilizeOnGround();
        
        // 检查是否有待处理的跳跃结果
        if (spiderState.pendingJumpCheck) {
            const currentTime = Instance.GetGameTime();
            if (currentTime >= spiderState.pendingJumpCheck.checkTime) {
                spiderState.checkJumpResult(spiderState.pendingJumpCheck.initialDistance);
                spiderState.pendingJumpCheck = null; // 清除待检查项
            }
        }
    }
}

// 更新单个蜘蛛
function updateSpider(spiderState) {
    if (!spiderState.entity.IsValid()) return;

    // 如果是粘附模式
    if (state.stuckMode && state.stuckPlayer) {
        spiderState.stickToPlayer(state.stuckPlayer);
    }

    // 如果蜘蛛被粘附，只更新位置，不执行跳跃
    if (spiderState.isStuck) {
        spiderState.updateStuckPosition();
        return; // 直接返回，不执行后续的跳跃逻辑
    }

    // 只有在非stuck状态下才执行追踪和跳跃
    if (!spiderState.isStuck) {
        // 正常追踪模式 
        const spiderPos = new Vector3(spiderState.entity.GetAbsOrigin());
        
        // 直接尝试跳跃（每次随机选择目标）
        spiderState.jump();
    }
}

// 智能目标选择算法 
function findBestTarget(spiderPos) {
    const validTargets = getValidPlayers()
        .map(player => ({
            player,
            distance: spiderPos.Distance(new Vector3(player.GetAbsOrigin())),
            priority: calculatePriority(spiderPos, player)
        }))
        .sort((a, b) => b.priority - a.priority);

    return validTargets.length > 0 ? selectTarget(validTargets) : null;
}

// 计算优先级 
function calculatePriority(spiderPos, player) {
    const distance = spiderPos.Distance(new Vector3(player.GetAbsOrigin()));
    const heightDiff = player.GetAbsOrigin().z - spiderPos.z;
    const speed = new Vector3(player.GetAbsVelocity()).Length();
    
    const distanceScore = distance < 100 ? 30 : distance < 300 ? 50 : distance < 500 ? 40 : 20;
    const heightScore = heightDiff > 50 ? 10 : heightDiff < -50 ? -5 : 0;
    const speedScore = speed < 100 ? 15 : speed < 200 ? 10 : 5;
    const randomScore = Math.random() * 20;
    
    return distanceScore + heightScore + speedScore + randomScore;
}

// 选择目标 
function selectTarget(targets) {
    const topTargets = targets.slice(0, Math.min(3, targets.length));
    return Math.random() < 0.7 ? topTargets[0].player : topTargets[Math.floor(Math.random() * topTargets.length)].player;
}

// 启动追踪功能
function StartTracking() {
    state.isActive = true;
    state.stuckMode = false;
    state.stuckPlayer = null;
    
    for (const spiderState of state.spiders.values()) {
        spiderState.target = null;
    }
}

// 停止追踪功能
function StopTracking() {
    state.isActive = false;
    state.stuckMode = false;
    state.stuckPlayer = null;
    
    for (const spiderState of state.spiders.values()) {
        spiderState.unstick();
        spiderState.target = null;
        spiderState.entity.Teleport({ velocity: { x: 0, y: 0, z: 0 } });
    }
}

// 粘附模式 
function StuckMode(activator) {
    if (!activator || !activator.IsValid()) {
        return;
    }

    const playerController = activator.GetPlayerController();
    if (!playerController) {
        return;
    }

    state.stuckMode = true;
    state.stuckPlayer = activator;
    
    let spiderCount = 0;
    for (const spiderState of state.spiders.values()) {
        if (spiderState.entity.IsValid()) {
            spiderState.stickToPlayer(activator);
            spiderCount++;
        }
    }
}

// 工具函数
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
    StartTracking();
});

Instance.OnScriptInput("stop", (inputData) => {
    StopTracking();
});

Instance.OnScriptInput("stuck", (inputData) => {
    const activator = inputData.activator;
    StuckMode(activator);
});

// 手动测试输入
Instance.OnScriptInput("test_spider", (inputData) => {
    const spiders = Instance.FindEntitiesByName("@spider");
    for (const spider of spiders) {
        if (spider.IsValid()) {
            const pos = spider.GetAbsOrigin();
        }
    }
});

// 检查蜘蛛状态
Instance.OnScriptInput("check_spiders", (inputData) => {
    for (const [name, spiderState] of state.spiders) {
        if (spiderState.entity.IsValid()) {
            const pos = spiderState.entity.GetAbsOrigin();
            const targetName = spiderState.target ? spiderState.target.GetPlayerController()?.GetPlayerName() : "无";
        } else {
        }
    }
});

// 通用统计函数
function getSpiderStats() {
    let stats = {
        totalSpiders: 0,
        totalMisses: 0,
        activeTargets: 0,
        jumpTypes: {},
        stabilizationEnabled: true
    };
    
    for (const [name, spiderState] of state.spiders) {
        if (spiderState.entity.IsValid()) {
            stats.totalSpiders++;
            stats.totalMisses += spiderState.consecutiveMisses;
            if (spiderState.target?.IsValid()) stats.activeTargets++;
            if (spiderState.lastJumpType) {
                stats.jumpTypes[spiderState.lastJumpType] = (stats.jumpTypes[spiderState.lastJumpType] || 0) + 1;
            }
            stats.stabilizationEnabled = spiderState.groundStabilization;
        }
    }
    
    return stats;
}

// 显示统计信息
function displayStats(title, stats) {
    Instance.Msg(`=== ${title} ===`);
    Instance.Msg(`总蜘蛛数: ${stats.totalSpiders}`);
    Instance.Msg(`活跃目标数: ${stats.activeTargets}`);
    Instance.Msg(`总失误次数: ${stats.totalMisses}`);
    
    if (stats.jumpTypes && Object.keys(stats.jumpTypes).length > 0) {
        Instance.Msg(`跳跃类型分布:`);
        Object.entries(stats.jumpTypes).forEach(([type, count]) => {
            Instance.Msg(`  ${type}: ${count}`);
        });
    }
}

// 简化的输入处理
Instance.OnScriptInput("jump_stats", () => displayStats("蜘蛛跳跃统计", getSpiderStats()));

Instance.OnScriptInput("distance_stats", (inputData) => {
    const stats = getSpiderStats();
    Instance.Msg(`=== 距离优化统计 ===`);
    
    for (const [name, spiderState] of state.spiders) {
        if (spiderState.entity.IsValid()) {
            const spiderPos = new Vector3(spiderState.entity.GetAbsOrigin());
            const currentTarget = findBestTarget(spiderPos);
            
            if (currentTarget) {
                const distance = spiderPos.Distance(new Vector3(currentTarget.GetAbsOrigin()));
                const cooldown = spiderState.calculateDistanceBasedCooldown(distance);
                
                Instance.Msg(`蜘蛛 ${name}: 距离=${distance.toFixed(1)}, 冷却=${cooldown.toFixed(2)}s, 失误=${spiderState.consecutiveMisses}`);
            }
        }
    }
});

Instance.OnScriptInput("toggle_stabilization", () => {
    for (const spiderState of state.spiders.values()) {
        spiderState.groundStabilization = !spiderState.groundStabilization;
    }
    Instance.Msg(`地面稳定系统: ${state.spiders.values().next().value?.groundStabilization ? '开启' : '关闭'}`);
});

Instance.OnScriptInput("stabilize_all", () => {
    let count = 0;
    for (const spiderState of state.spiders.values()) {
        if (spiderState.entity.IsValid()) {
            spiderState.stabilizeOnGround();
            count++;
        }
    }
    Instance.Msg(`已稳定 ${count} 只蜘蛛`);
});

// 设置思考函数
Instance.SetThink(Tick);
Instance.SetNextThink(0.1);

