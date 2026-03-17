import { Instance } from "cs_script/point_script";

function fire(name = "", input = "", val = "", delay = 0, caller, activator) {
    Instance.EntFireAtName({ name, input, value: val, caller, activator, delay });
}

function fireT(target, input = "", val = "", delay = 0, caller, activator) {
    Instance.EntFireAtTarget({ target, input, value: val, caller, activator, delay });
}

function find(name) { return Instance.FindEntityByName(name); }
function findAll(name) { return Instance.FindEntitiesByName(name); }
function findByClass(cls) { return Instance.FindEntitiesByClass(cls); }

var self = undefined
var type = 0

// 新增：锁定阵营2的索敌方式
Instance.OnScriptInput("getentenemy", ({caller}) => {
    self = caller;
    type = 3; // 新增：锁定阵营2（敌人）的模式
    tracker.init();
})

// 新增：随机移动模式
Instance.OnScriptInput("getentrandom", ({caller}) => {
    self = caller;
    type = 2;
    tracker.init();
})

Instance.OnScriptInput("getentnpc", ({caller}) => {
    self = caller;
    type = 0
    tracker.init();
})

Instance.OnScriptInput("getentboss", ({caller}) => {
    self = caller;
    type = 1
    tracker.init();
})

function print(text){Instance.Msg(text)}

let tracker = {
    npc: null,
    target: null,
    lastLockTime: 0,
    lastValidTargetTime: 0,
    lastNoTargetTime: 0,
    LOCK_INTERVAL: 5,
    MAX_HEIGHT: 200,
    RANGE: 1000,
    MOVE_SPEED: 4000,
    currentAngles: { pitch: 0, yaw: 0, roll: 0 },
    isTurning: false,
    turnStartTime: 0,
    turnDuration: 0.4,
    thinkInterval: 0.05, // 默认更新间隔
    idleThinkInterval: 2.0, // 空闲模式更新间隔2秒
    isIdleMode: false,
    idleCheckCounter: 0, // 空闲模式检测计数器
    
    // 新增：锁定阵营2的参数
    ENEMY_TEAM: 2, // 阵营2的编号
    
    // 新增：随机移动相关参数
    isRandomMode: false,
    randomTargetYaw: 0,
    randomMoveDuration: 0,
    randomMoveStartTime: 0,
    lastRandomTurnTime: 0,
    initTime: 0, // 所有模式的初始化时间
    isInitialPhase: true, // 是否在初始阶段（前2秒）
    RANDOM_MOVE_DURATION_MIN: 2.0, // 随机移动最短持续时间
    RANDOM_MOVE_DURATION_MAX: 5.0, // 随机移动最长持续时间
    RANDOM_TURN_INTERVAL: 1, // 随机转向间隔
    RANDOM_MOVE_SPEED: 4000, // 随机移动速度
    RANDOM_YAW_CHANGE: 180, // 随机转向角度变化范围
    INITIAL_PHASE_DURATION: 3.0, // 初始阶段持续时间（2秒）

    init() {
        //Instance.Msg("NPC追踪系统启动");
        const allphy = Instance.FindEntitiesByClass("func_physbox");
        this.npc = undefined
        for(const phy of allphy){
            if(this.getDistance(phy.GetAbsOrigin(),self.GetAbsOrigin()) <= 16)
                this.npc = phy
        }
        if (!this.npc?.IsValid()) {
            //Instance.Msg("错误: 没有找到最近的phy");
            return;
        }
        
        // 初始化当前角度，强制保持水平（pitch=0）
        const initAngles = this.npc.GetAbsAngles();
        this.currentAngles = { pitch: 0, yaw: initAngles.yaw, roll: 0 };
        this.npc.Teleport({ angles: this.currentAngles });
        
        this.lastValidTargetTime = Instance.GetGameTime();
        this.lastNoTargetTime = Instance.GetGameTime();
        
        // 记录所有模式的初始化时间
        this.initTime = Instance.GetGameTime();
        this.isInitialPhase = true; // 设置为初始阶段
        
        // 判断模式类型
        this.isRandomMode = (type === 2);
        
        // 根据模式显示提示信息
        switch(type) {
            case 0:
                //Instance.Msg("启动普通NPC模式 (锁定阵营3)");
                break;
            case 1:
                //Instance.Msg("启动BOSS模式 (锁定阵营3)");
                break;
            case 2:
                //Instance.Msg("启动随机移动模式");
                break;
            case 3:
                //Instance.Msg("启动敌人模式 (锁定阵营2)");
                break;
        }
        
        if (this.isRandomMode) {
            // 初始化随机移动参数
            this.randomTargetYaw = initAngles.yaw;
            this.randomMoveDuration = this.getRandomDuration();
            this.randomMoveStartTime = Instance.GetGameTime();
            this.lastRandomTurnTime = Instance.GetGameTime();
            // 随机模式下强制设置为正常模式（非空闲模式）
            this.isIdleMode = false;
            this.thinkInterval = 0.05;
        }
        
        this.startThink();
    },
    
    startThink() {
        Instance.SetThink(() => {
            this.update();
            Instance.SetNextThink(Instance.GetGameTime() + this.thinkInterval);
        });
        Instance.SetNextThink(Instance.GetGameTime() + this.thinkInterval);
    },
    
    update() {
        if (!this.npc?.IsValid()) return;
        
        const now = Instance.GetGameTime();
        
        // 根据模式设置参数
        switch(type) {
            case 1: // BOSS模式
                this.RANGE = 4000;
                this.idleThinkInterval = 0.5;
                this.MAX_HEIGHT = 300;
                this.MOVE_SPEED = 4500;
                this.LOCK_INTERVAL = 3;
                this.turnDuration = 0.4;
                break;
            case 3: // 敌人模式 (锁定阵营2)
                this.RANGE = 1000; // 可以根据需要调整
                this.idleThinkInterval = 2.0;
                this.MAX_HEIGHT = 200;
                this.MOVE_SPEED = 4000;
                this.LOCK_INTERVAL = 5;
                this.turnDuration = 0.4;
                break;
            default: // 普通NPC模式和随机模式
                this.RANGE = 1000;
                this.idleThinkInterval = 2.0;
                this.MAX_HEIGHT = 200;
                this.MOVE_SPEED = 4000;
                this.LOCK_INTERVAL = 5;
                this.turnDuration = 0.4;
                break;
        }
        
        // =============================================
        // 无论是否有目标都要执行的基本维护
        // =============================================
        this.maintainStability();
        
        // 处理转向动画
        this.updateTurning(now);
        
        // 根据模式执行不同的逻辑
        if (this.isRandomMode) {
            this.updateRandomMove(now);
        } else {
            this.updateTrackingMode(now);
        }
    },
    
    // 随机移动模式更新 - 不会进入空闲模式
    updateRandomMove(now) {
        // 随机模式下永远不会进入空闲模式
        // 始终保持在正常更新频率
        
        // 检查是否需要改变方向
        if (now - this.lastRandomTurnTime > this.RANDOM_TURN_INTERVAL) {
            this.randomTurn(now);
        }
        
        // 检查是否需要结束当前移动周期
        if (now - this.randomMoveStartTime > this.randomMoveDuration) {
            this.startNewRandomMove(now);
        }
        
        // 执行随机移动
        this.randomMove();
    },
    
    // 追踪模式更新（原来的逻辑）
    updateTrackingMode(now) {
        // 检查是否应该切换模式
        this.checkModeSwitch(now);
        
        // 检查当前目标是否有效
        let hasValidTarget = false;
        
        if (this.target) {
            if (!this.target.IsValid() || !this.target.IsAlive() || 
                now - this.lastLockTime > this.LOCK_INTERVAL) {
                this.target = null;
            } else {
                // 检查目标是否在有效范围内
                const npcPos = this.npc.GetAbsOrigin();
                const targetPos = this.target.GetAbsOrigin();
                const dist = this.getDistance(npcPos, targetPos);
                const heightDiff = Math.abs(npcPos.z - targetPos.z);
                
                if (dist <= this.RANGE && heightDiff <= this.MAX_HEIGHT) {
                    hasValidTarget = true;
                    this.lastValidTargetTime = now;
                    this.lastNoTargetTime = now;
                    
                    // 如果有目标，确保在正常模式
                    if (this.isIdleMode) {
                        this.switchToNormalMode();
                    }
                }
            }
        }
        
        // 如果需要重新锁定目标
        if (!this.target || now - this.lastLockTime > this.LOCK_INTERVAL) {
            // 在空闲模式下，每次更新都检测（但更新频率是2秒一次）
            if (!this.isIdleMode) {
                hasValidTarget = this.findTarget(now);
            } else {
                // 空闲模式下，在每次更新时检测目标
                this.idleCheckCounter++;
                if (this.idleCheckCounter >= 1) { // 每次空闲更新都检测
                    this.idleCheckCounter = 0;
                    hasValidTarget = this.findTarget(now);
                }
            }
        }
        
        // 如果有有效目标，追踪并移动
        if (hasValidTarget) {
            this.track(now);
            this.moveToTarget();
        } else {
            // 如果没有有效目标，仅记录无目标时间
            this.lastNoTargetTime = now;
        }
    },
    
    // 随机转向
    randomTurn(now) {
        // 随机改变yaw角度
        const currentYaw = this.currentAngles.yaw;
        const yawChange = (Math.random() * 2 - 1) * this.RANDOM_YAW_CHANGE;
        this.randomTargetYaw = (currentYaw + yawChange + 360) % 360;
        
        // 开始转向到随机角度
        this.startTurningTo({
            pitch: 0,
            yaw: this.randomTargetYaw,
            roll: 0
        }, Math.abs(yawChange));
        
        this.lastRandomTurnTime = now;
    },
    
    // 开始新的随机移动周期 - 总是改变方向
    startNewRandomMove(now) {
        this.randomMoveDuration = this.getRandomDuration();
        this.randomMoveStartTime = now;
        
        // 总是改变方向（不再有30%几率不改变）
        this.randomTurn(now);
    },
    
    // 执行随机移动
    randomMove() {
        const moveDirection = this.calculateMoveDirection();
        const currentVel = this.npc.GetAbsVelocity();
        
        // 使用随机移动速度
        const speedFactor = this.RANDOM_MOVE_SPEED * 0.1;
        
        // 检查是否在初始阶段（前2秒）
        const now = Instance.GetGameTime();
        const isInInitialPhase = this.isInitialPhase && 
                                (now - this.initTime < this.INITIAL_PHASE_DURATION);
        
        let newVelocity;
        if (isInInitialPhase) {
            // 初始阶段（前2秒）：不限制Z轴速度
            newVelocity = {
                x: currentVel.x + moveDirection.x * speedFactor / this.MOVE_SPEED,
                y: currentVel.y + moveDirection.y * speedFactor / this.MOVE_SPEED,
                z: currentVel.z // 保持当前Z轴速度
            };
        } else {
            // 正常阶段：仅清除向上的Z轴速度
            if (this.isInitialPhase) {
                this.isInitialPhase = false; // 结束初始阶段
                //Instance.Msg("初始2秒结束，开始限制向上Z轴速度");
            }
            
            // 仅限制向上的速度（正值），向下速度（负值）保持不变
            let zVelocity = currentVel.z;
            if (currentVel.z > 0) {
                zVelocity = 0; // 清除向上的速度
            }
            
            newVelocity = {
                x: currentVel.x + moveDirection.x * speedFactor / this.MOVE_SPEED,
                y: currentVel.y + moveDirection.y * speedFactor / this.MOVE_SPEED,
                z: zVelocity
            };
        }
        
        // 限制最大水平速度
        const horizontalSpeed = Math.sqrt(newVelocity.x * newVelocity.x + newVelocity.y * newVelocity.y);
        const maxHorizontalSpeed = this.RANDOM_MOVE_SPEED * 0.1;
        if (horizontalSpeed > maxHorizontalSpeed) {
            const scale = maxHorizontalSpeed / horizontalSpeed;
            newVelocity.x *= scale;
            newVelocity.y *= scale;
        }
        
        this.npc.Teleport({
            velocity: newVelocity
        });
    },
    
    // 获取随机持续时间
    getRandomDuration() {
        return this.RANDOM_MOVE_DURATION_MIN + 
               Math.random() * (this.RANDOM_MOVE_DURATION_MAX - this.RANDOM_MOVE_DURATION_MIN);
    },
    
    // 维护NPC的稳定性（无论是否有目标都要执行）
    maintainStability() {
        if (!this.npc?.IsValid()) return;
        
        // 1. 强制保持水平角度
        const currentAngles = this.npc.GetAbsAngles();
        if (Math.abs(currentAngles.pitch) > 0.1 || Math.abs(currentAngles.roll) > 0.1) {
            this.npc.Teleport({
                angles: { pitch: 0, yaw: currentAngles.yaw, roll: 0 }
            });
            this.currentAngles.yaw = currentAngles.yaw;
        }
        
        // 2. 仅清除异常向上的Z轴速度（所有模式前2秒不限制）
        const currentVel = this.npc.GetAbsVelocity();
        
        // 检查是否在初始阶段（前2秒）
        const now = Instance.GetGameTime();
        const isInInitialPhase = this.isInitialPhase && 
                                (now - this.initTime < this.INITIAL_PHASE_DURATION);
        
        // 仅限制向上的速度（正值），负值（向下）保持不变
        if (!isInInitialPhase && currentVel.z > 0) {
            this.npc.Teleport({
                velocity: { x: currentVel.x, y: currentVel.y, z: 0 }
            });
        }
        
        // 3. 如果不在转向中，确保当前角度记录正确
        if (!this.isTurning) {
            const currentAngles = this.npc.GetAbsAngles();
            this.currentAngles = { pitch: 0, yaw: currentAngles.yaw, roll: 0 };
        }
    },
    
    checkModeSwitch(now) {
        // 随机模式下不检查模式切换
        if (this.isRandomMode) return;
        
        const timeSinceNoTarget = now - this.lastNoTargetTime;
        
        // 如果5秒没有目标且不在空闲模式，切换到空闲模式
        if (!this.isIdleMode && timeSinceNoTarget >= 5) {
            this.switchToIdleMode();
        }
        
        // 如果有目标且在空闲模式，切换回正常模式
        if (this.isIdleMode && this.target && this.target.IsValid() && this.target.IsAlive()) {
            // 额外检查目标是否在范围内
            const npcPos = this.npc.GetAbsOrigin();
            const targetPos = this.target.GetAbsOrigin();
            const dist = this.getDistance(npcPos, targetPos);
            const heightDiff = Math.abs(npcPos.z - targetPos.z);
            
            if (dist <= this.RANGE && heightDiff <= this.MAX_HEIGHT) {
                this.switchToNormalMode();
            }
        }
    },
    
    switchToIdleMode() {
        // 随机模式下不能进入空闲模式
        if (this.isRandomMode) return;
        if (this.isIdleMode) return;
        
        this.isIdleMode = true;
        this.thinkInterval = this.idleThinkInterval;
        this.idleCheckCounter = 0;
        //Instance.Msg("进入空闲模式 (2秒更新间隔)");
        
        // 停止所有移动
        if (this.npc && this.npc.IsValid()) {
            this.npc.Teleport({
                velocity: { x: 0, y: 0, z: 0 }
            });
        }
        
        // 重新设置思考间隔
        Instance.SetNextThink(Instance.GetGameTime() + this.thinkInterval);
    },
    
    switchToNormalMode() {
        if (!this.isIdleMode) return;
        
        this.isIdleMode = false;
        this.thinkInterval = 0.05;
        //Instance.Msg("退出空闲模式 (0.05秒更新间隔)");
        
        // 重新设置思考间隔
        Instance.SetNextThink(Instance.GetGameTime() + this.thinkInterval);
    },
    
    updateTurning(now) {
        if (!this.isTurning) return;
        
        const elapsed = now - this.turnStartTime;
        
        if (elapsed >= this.turnDuration) {
            // 转向完成
            this.isTurning = false;
            this.npc.Teleport({
                angles: this.targetAngles
            });
            this.currentAngles = this.targetAngles;
        } else {
            // 插值计算当前角度，保持pitch为0
            const t = elapsed / this.turnDuration;
            const currentYaw = this.lerpAngle(this.startAngles.yaw, this.targetAngles.yaw, t);
            
            const currentAngles = {
                pitch: 0, // 始终保持水平
                yaw: currentYaw,
                roll: 0
            };
            
            this.npc.Teleport({
                angles: currentAngles
            });
            this.currentAngles = currentAngles;
        }
    },
    
    findTarget(now) {
        // 随机模式下不寻找目标
        if (this.isRandomMode) return false;
        
        const players = Instance.FindEntitiesByClass("player");
        const npcPos = this.npc.GetAbsOrigin();
        let bestTarget = null;
        let bestDist = Infinity;
        let hasValidTarget = false;
        
        // 根据模式确定目标阵营
        let targetTeam = 3; // 默认阵营3
        
        if (type === 3) {
            targetTeam = this.ENEMY_TEAM; // 敌人模式锁定阵营2
        }
        
        for (const player of players) {
            if (!player.IsAlive() || player.GetTeamNumber() !== targetTeam) continue;
            
            const playerPos = player.GetAbsOrigin();
            const dist = this.getDistance(npcPos, playerPos);
            const heightDiff = Math.abs(npcPos.z - playerPos.z);
            
            // 检查是否在有效范围内
            if (dist <= this.RANGE && heightDiff <= this.MAX_HEIGHT) {
                hasValidTarget = true;
                if (dist < bestDist) {
                    bestTarget = player;
                    bestDist = dist;
                }
            }
        }
        
        if (bestTarget) {
            this.target = bestTarget;
            this.lastLockTime = now;
            this.lastValidTargetTime = now;
            this.lastNoTargetTime = now;
            
            // 显示锁定信息
            const playerName = bestTarget.GetPlayerController()?.GetPlayerName();
            if (type === 3) {
                //Instance.Msg(`锁定敌人(阵营2): ${playerName || "未知"}`);
            } else {
                //Instance.Msg(`锁定: ${playerName || "未知"}`);
            }
            
            // 如果是在空闲模式下找到目标，立即切换到正常模式
            if (this.isIdleMode) {
                this.switchToNormalMode();
            }
            
            // 开始转向到目标
            this.startTurningToTarget();
        } else {
            // 如果没有找到目标，记录无目标时间
            const playersExist = players.length > 0;
            if (playersExist) {
                // 有玩家存在但不在范围内
                ////Instance.Msg("范围内无有效目标");
            }
        }
        
        return hasValidTarget;
    },
    
    track(now) {
        // 随机模式下不追踪目标
        if (this.isRandomMode) return;
        if (!this.target?.IsValid()) return;
        
        const npcPos = this.npc.GetAbsOrigin();
        const targetPos = this.target.GetAbsOrigin();
        
        // 检查目标是否在范围内（已经确认是有效的）
        const dist = this.getDistance(npcPos, targetPos);
        const heightDiff = Math.abs(npcPos.z - targetPos.z);
        
        if (dist > this.RANGE || heightDiff > this.MAX_HEIGHT) {
            //Instance.Msg("目标超出范围");
            this.target = null;
            return;
        }
        
        // 检查是否需要重新转向（如果目标移动较大）
        const targetDirection = this.getDirection(npcPos, targetPos);
        const angleDiff = this.getAngleDifference(this.currentAngles, targetDirection);
        
        // 如果角度差大于5度，开始转向
        if (angleDiff > 5 && !this.isTurning) {
            this.startTurningTo(targetDirection, angleDiff);
        }
    },
    
    startTurningToTarget() {
        // 随机模式下不追踪目标
        if (this.isRandomMode) return;
        if (!this.target?.IsValid()) return;
        
        const npcPos = this.npc.GetAbsOrigin();
        const targetPos = this.target.GetAbsOrigin();
        const targetDirection = this.getDirection(npcPos, targetPos);
        const angleDiff = this.getAngleDifference(this.currentAngles, targetDirection);
        
        this.startTurningTo(targetDirection, angleDiff);
    },
    
    startTurningTo(targetAngles, angleDiff = null) {
        this.isTurning = true;
        this.startAngles = { ...this.currentAngles };
        // 强制将目标角度设为水平（pitch=0）
        this.targetAngles = { 
            pitch: 0, // 始终保持水平
            yaw: targetAngles.yaw, 
            roll: 0 
        };
        
        // 根据角度差计算转向速度
        if (angleDiff === null) {
            angleDiff = this.getAngleDifference(this.startAngles, this.targetAngles);
        }
        
        // 如果角度超过30度，加快转向速度
        let actualTurnDuration = this.turnDuration;
        if (angleDiff > 30) {
            // 角度越大，转向越快，最小为0.1秒
            const speedFactor = Math.max(this.turnDuration/3, this.turnDuration * (30 / angleDiff));
            actualTurnDuration = speedFactor;
        }
        
        this.turnStartTime = Instance.GetGameTime();
    },
    
    moveToTarget() {
        // 随机模式下使用randomMove方法
        if (this.isRandomMode) {
            this.randomMove();
            return;
        }
        
        if (!this.target?.IsValid()) return;
        
        const npcPos = this.npc.GetAbsOrigin();
        const targetPos = this.target.GetAbsOrigin();
        const dist = this.getDistance(npcPos, targetPos);
        
        // 如果距离小于50单位则停止移动
        if (dist < 50) return;
        if (dist < 100 && (type === 1 || type === 3)) return;
        
        // 根据当前朝向计算移动方向（只在X和Y轴上移动）
        const moveDirection = this.calculateMoveDirection();
        
        // 获取当前速度
        const currentVel = this.npc.GetAbsVelocity();
        
        // 检查是否在初始阶段（前2秒）
        const now = Instance.GetGameTime();
        const isInInitialPhase = this.isInitialPhase && 
                                (now - this.initTime < this.INITIAL_PHASE_DURATION);
        
        let newVelocity;
        if (isInInitialPhase) {
            // 初始阶段（前2秒）：不限制Z轴速度
            newVelocity = {
                x: currentVel.x + moveDirection.x * 0.1,
                y: currentVel.y + moveDirection.y * 0.1,
                z: currentVel.z // 保持当前Z轴速度
            };
        } else {
            // 正常阶段：仅清除向上的Z轴速度
            if (this.isInitialPhase) {
                this.isInitialPhase = false; // 结束初始阶段
                //Instance.Msg("初始2秒结束，开始限制向上Z轴速度");
            }
            
            // 仅限制向上的速度（正值），向下速度（负值）保持不变
            let zVelocity = currentVel.z;
            if (currentVel.z > 0) {
                zVelocity = 0; // 清除向上的速度
            }
            
            newVelocity = {
                x: currentVel.x + moveDirection.x * 0.1,
                y: currentVel.y + moveDirection.y * 0.1,
                z: zVelocity
            };
        }
        
        // 限制最大水平速度（不考虑Z轴）
        const horizontalSpeed = Math.sqrt(newVelocity.x * newVelocity.x + newVelocity.y * newVelocity.y);
        const maxHorizontalSpeed = this.MOVE_SPEED * 0.1;
        if (horizontalSpeed > maxHorizontalSpeed) {
            const scale = maxHorizontalSpeed / horizontalSpeed;
            newVelocity.x *= scale;
            newVelocity.y *= scale;
        }
        
        this.npc.Teleport({
            velocity: newVelocity
        });
    },
    
    calculateMoveDirection() {
        const yawRad = this.currentAngles.yaw * (Math.PI / 180);
        
        // 只计算水平方向（X和Y轴），保持水平移动
        const forwardX = Math.cos(yawRad);
        const forwardY = Math.sin(yawRad);
        
        return {
            x: forwardX * this.MOVE_SPEED * 0.1,
            y: forwardY * this.MOVE_SPEED * 0.1,
            z: 0
        };
    },
    
    getDistance(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dz = b.z - a.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    },
    
    getDirection(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dz = to.z - from.z;
        const yaw = Math.atan2(dy, dx) * (180 / Math.PI);
        // 即使计算了俯仰角度，我们也会在startTurningTo中将其设为0
        const horizontalDist = Math.sqrt(dx * dx + dy * dy);
        const pitch = -Math.atan2(dz, horizontalDist) * (180 / Math.PI);
        return { pitch, yaw, roll: 0 };
    },
    
    getAngleDifference(angles1, angles2) {
        // 只计算yaw的差异，因为pitch始终为0
        let yawDiff = Math.abs(angles1.yaw - angles2.yaw);
        yawDiff = Math.min(yawDiff, 360 - yawDiff);
        return yawDiff;
    },
    
    lerpAngle(start, end, t) {
        const diff = end - start;
        const shortDiff = ((diff + 180) % 360) - 180;
        return start + shortDiff * t;
    }
};

//Instance.Msg("NPC追踪系统已加载");