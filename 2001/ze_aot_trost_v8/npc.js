import { Instance } from "cs_script/point_script";

// 辅助函数
function fire(name = "", input = "", val = "", delay = 0, caller, activator) {
    Instance.EntFireAtName({ name, input, value: val, caller, activator, delay });
}
function fireT(target, input = "", val = "", delay = 0, caller, activator) {
    Instance.EntFireAtTarget({ target, input, value: val, caller, activator, delay });
}
function find(name) { return Instance.FindEntityByName(name); }
function findAll(name) { return Instance.FindEntitiesByName(name); }
function findByClass(cls) { return Instance.FindEntitiesByClass(cls); }

function len2(v) { return Math.sqrt(v.x ** 2 + v.y ** 2); }
function sub(v1, v2) { return { x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z }; }

var self = undefined;
var type = 0; // 0:普通NPC,1:BOSS

Instance.OnScriptInput("getentnpc", ({caller}) => { self = caller; type = 0; tracker.type = 0; tracker.init(); });
Instance.OnScriptInput("getentboss", ({caller}) => { self = caller; type = 1; tracker.type = 1; tracker.init(); });

function print(text){ Instance.Msg(text); }

let tracker = {
    // 实体引用
    npc: null,
    model: null,
    target: null,

    // 玩家缓存（每10秒更新）
    cachedPlayers: [],
    lastPlayerCacheUpdate: 0,
    PLAYER_CACHE_UPDATE_INTERVAL: 10.0,

    // 时间记录
    lastLockTime: 0,
    lastValidTargetTime: 0,
    lastNoTargetTime: 0,
    noTargetStartTime: 0,
    NO_TARGET_DEATH_TIME: 20,
    lockStartTime: 0,
    spawnTime: 0,
    NPC_MAX_LIFETIME: 120,

    // 基础参数
    LOCK_INTERVAL: 5,
    MAX_HEIGHT: 400,
    RANGE: 4000,
    MOVE_SPEED: 4000,
    ROTATION_SPEED: 360,
    IDLE_THINK_INTERVAL: 2.0,
    NORMAL_THINK_INTERVAL: 1/64,
    CLOSE_RANGE_NPC: 300,
    CLOSE_RANGE_BOSS: 500,
    bossParams: {
        RANGE: 10000,
        MAX_HEIGHT: 8000,
        MOVE_SPEED: 8000,
        ROTATION_SPEED: 180,
        IDLE_THINK_INTERVAL: 0.5,
    },

    // 转向
    targetYaw: 0,
    turningActive: false,

    // 技能相关
    isPreparingSkill: false,
    preparingSkillType: null,
    preparingSkillStartTime: 0,
    PREPARE_SKILL_DURATION: 0.5,
    prepareThinkInterval: 0.02,
    prepareStartAngles: null,
    prepareTargetAngles: null,
    isSkillCasting: false,
    skillCastStartTime: 0,
    skillCastDuration: 0,
    currentSkillType: null,
    isReacquiringTarget: false,
    reacquireStartTime: 0,
    REACQUIRE_DURATION: 1.0,
    skillEndAngles: null,

    // 技能冷却
    lastSkillTime: 0,
    SKILL_CD: 7.0,
    skillAlternateFlag: 0,
    lastMeleeSkillTime: 0,
    MELEE_SKILL_COOLDOWN: 3.0,

    // 远程攻击（技能一）
    remoteAttackStartTime: 0,
    remoteAttackDelay: 1.53,
    remoteAttackLaunched: false,

    // 脆弱状态
    cutCount: 0,
    isVulnerable: false,
    vulnerableStartTime: 0,
    VULNERABLE_DURATION: 10,
    VULNERABLE_DAMAGE_MULTIPLIER: 1.5,
    NPC_CUT_THRESHOLD: 1,
    BOSS_CUT_THRESHOLD: 8,

    // 血量系统（每阶段10格，动态难度）
    stage: 1,
    stageGrids: 10,
    baseGridHealth: 10,
    stageExtraPerPlayer: [10, 10, 20],
    remainingGrids: 10,
    currentGridHealth: 0,
    currentGridMaxHealth: 0,

    // 预判
    PREDICT_TIME: 0.5,
    MIN_PREDICT_TIME: 0.05,
    MAX_PREDICT_TIME: 1.0,
    MIN_DISTANCE: 500,
    MAX_DISTANCE: 10000,

    // 角度和速度
    type: 0,
    currentAngles: { pitch: 0, yaw: 0, roll: 0 },
    thinkInterval: 0.05,

    // 卡墙后退
    isStuckTurning: false,
    turnStartTime: 0,
    turnStartDelta: 0,
    isBackingUp: false,
    backupStartTime: 0,
    BACKUP_DURATION: 0.3,
    BACKUP_SPEED: -2000,
    STUCK_TURN_TIMEOUT: 1.5,
    STUCK_ANGLE_THRESHOLD: 10,

    // 直立维持
    STABILITY_K: 5.0,
    MAX_STABILITY_SPEED: 90,

    // 状态机
    state: 0,
    normalSub: 0,
    transSub: 0,
    pendingTransition: false,
    transitionStage: 0,
    transitionStartTime: 0,
    transitionDelayEndTime: 0,
    transitionTargetPos: null,
    savedMoveSpeed: 0,
    transitionArrivalTime: null,
    transitionMoveStartTime: 0,
    isInvulnerable: false,

    // 空闲行为
    idleBehavior: function() {},

    // ========== 辅助函数 ==========
    getCloseRange() { return this.type === 1 ? this.CLOSE_RANGE_BOSS : this.CLOSE_RANGE_NPC; },
    getDistance(a, b) {
        let dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
    },
    getDirection(from, to) {
        let dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
        let yaw = Math.atan2(dy, dx) * 180 / Math.PI;
        let horiz = Math.sqrt(dx*dx + dy*dy);
        let pitch = -Math.atan2(dz, horiz) * 180 / Math.PI;
        return { pitch, yaw, roll: 0 };
    },
    getAngleDifference(a1, a2) {
        let diff = Math.abs(a1.yaw - a2.yaw);
        return Math.min(diff, 360 - diff);
    },
    lerpAngle(start, end, t) {
        let diff = end - start;
        let short = ((diff + 180) % 360) - 180;
        return start + short * t;
    },

    // ========== 玩家缓存 ==========
    updatePlayerCache(force = false) {
        let now = Instance.GetGameTime();
        if (!force && now - this.lastPlayerCacheUpdate < this.PLAYER_CACHE_UPDATE_INTERVAL) return;
        this.lastPlayerCacheUpdate = now;
        let allPlayers = Instance.FindEntitiesByClass("player");
        let newCache = [];
        for (let p of allPlayers) {
            if (p.IsAlive() && p.GetTeamNumber() === 3) {
                newCache.push(p);
            }
        }
        this.cachedPlayers = newCache;
    },

    // 更新血条UI
    updateHealthBar() {
        if (this.type !== 1) return;
        let healthRatio = (this.remainingGrids - 1 + (this.currentGridHealth / this.currentGridMaxHealth)) / this.stageGrids;
        if (healthRatio < 0) healthRatio = 0;
        if (healthRatio > 1) healthRatio = 1;
        let ctrl = healthRatio * 0.931 + 0.135;
        fire("s25_boss_hp", "setcontrolpoint", "10:" + ctrl + " 0 0", 0);
    },

    // 初始化阶段
    initStage() {
        this.updatePlayerCache(true);
        let human = this.cachedPlayers.length;
        if (human < 1) human = 1;
        let extra = this.stageExtraPerPlayer[this.stage - 1];
        let perGrid = this.baseGridHealth + human * extra;
        this.remainingGrids = this.stageGrids;
        this.currentGridHealth = perGrid;
        this.currentGridMaxHealth = perGrid;
        this.updateHealthBar();
    },

    // 扣血处理
    applyDamage(damage) {
        if (this.type !== 1) return false;
        if (this.isInvulnerable) return false;

        let finalDamage = damage * (this.isCurrentlyVulnerable() ? this.VULNERABLE_DAMAGE_MULTIPLIER : 1);
        this.currentGridHealth -= finalDamage;

        while (this.currentGridHealth <= 0 && this.remainingGrids > 0) {
            this.remainingGrids--;
            if (this.remainingGrids > 0) {
                this.updatePlayerCache(true);
                let human = this.cachedPlayers.length;
                if (human < 1) human = 1;
                let extra = this.stageExtraPerPlayer[this.stage - 1];
                let newGridHealth = this.baseGridHealth + human * extra;
                this.currentGridHealth = newGridHealth;
                this.currentGridMaxHealth = newGridHealth;
            } else {
                this.currentGridHealth = 0;
                this.currentGridMaxHealth = 1;
            }
        }

        this.updateHealthBar();

        if (this.remainingGrids <= 0) {
            if (this.stage === 3) {
                this.npcDeath(false);
                return true;
            } else {
                if (this.state !== 0) return true;
                if (this.normalSub === 0) {
                    this.startPhaseTransition();
                } else {
                    this.pendingTransition = true;
                }
                return true;
            }
        }
        return true;
    },

    // ========== 初始化 ==========
    init() {
        let npc = self.GetParent();
        if (!npc || npc.GetClassName() !== "func_physbox") {
            for (let phy of Instance.FindEntitiesByClass("func_physbox")) {
                if (this.getDistance(phy.GetAbsOrigin(), self.GetAbsOrigin()) <= 64) { npc = phy; break; }
            }
        }
        if (!npc) { Instance.Msg("错误: 未找到func_physbox"); return; }
        this.npc = npc;
        if(type === 0){
            fireT(this.npc,"fireuser3");
            fireT(this.npc,"addoutput","onuser3>!self>fireuser2>>0>1");
        }

        for (let dy of Instance.FindEntitiesByClass("prop_dynamic")) {
            if (this.getDistance(dy.GetAbsOrigin(), self.GetAbsOrigin()) <= 64 && dy.GetParent() === this.npc) {
                this.model = dy;
                break;
            }
        }

        for (let i = 0; i <= 0.5; i += 0.01) {
            fireT(this.model, "setrenderattribute", "a = " + (0.5 - i) / 0.5, i);
        }

        let initAng = this.npc.GetAbsAngles();
        this.currentAngles = { pitch: 0, yaw: initAng.yaw, roll: 0 };
        this.targetYaw = initAng.yaw;
        this.npc.Teleport({ angles: this.currentAngles });

        let now = Instance.GetGameTime();
        this.lastValidTargetTime = now;
        this.lastNoTargetTime = now;
        this.lastSkillTime = now;
        this.lastMeleeSkillTime = now;
        this.cutCount = 0;
        this.isVulnerable = false;
        this.vulnerableStartTime = 0;
        this.noTargetStartTime = 0;
        this.currentSkillType = null;
        this.turningActive = false;
        this.targetYaw = this.currentAngles.yaw;
        this.skillAlternateFlag = 0;
        this.lockStartTime = now + 2.0;

        this.state = 0;
        this.normalSub = 0;
        this.transSub = 0;
        this.pendingTransition = false;
        this.transitionStage = 0;
        this.transitionStartTime = 0;
        this.transitionDelayEndTime = 0;
        this.transitionTargetPos = null;
        this.savedMoveSpeed = 0;
        this.transitionArrivalTime = null;
        this.transitionMoveStartTime = 0;
        this.isInvulnerable = false;

        this.spawnTime = now;
        this.updatePlayerCache(true);

        if (this.type === 1) {
            this.RANGE = this.bossParams.RANGE;
            this.MAX_HEIGHT = this.bossParams.MAX_HEIGHT;
            this.MOVE_SPEED = this.bossParams.MOVE_SPEED;
            this.ROTATION_SPEED = this.bossParams.ROTATION_SPEED;
            this.IDLE_THINK_INTERVAL = this.bossParams.IDLE_THINK_INTERVAL;

            this.stage = 1;
            this.initStage();
        } else {
        let hp = 50 + this.cachedPlayers.length * 10;
        this.npc_hp = hp;
        this.npc_maxhp = hp;
    }

        this.thinkInterval = this.NORMAL_THINK_INTERVAL;
        this.startThink();
    },

    startThink() {
        Instance.SetThink(() => { this.update(); Instance.SetNextThink(Instance.GetGameTime() + this.thinkInterval); });
        Instance.SetNextThink(Instance.GetGameTime() + this.thinkInterval);
    },

    // ========== 主更新 ==========
    update() {
        let now = Instance.GetGameTime();

        // 普通NPC存活超时检测
        if (this.type === 0 && this.npc?.IsValid()) {
            let age = now - this.spawnTime;
            if (age >= this.NPC_MAX_LIFETIME) {
                this.npcDeath(true);
                return;
            }
        }

        if (now - this.lastPlayerCacheUpdate > this.PLAYER_CACHE_UPDATE_INTERVAL) {
            this.updatePlayerCache();
        }

        // 转阶段期间血条动画
        if (this.state === 1) {
            let elapsed = now - this.transitionStartTime;
            let health = 0;
            if (elapsed >= 2.0) {
                health = Math.min(1.0, (elapsed - 2.0) / 5.0);
            }
            let ctrl = health * 0.931 + 0.135;
            fire("s25_boss_hp", "setcontrolpoint", `10:${ctrl} 0 0`, 0);
        }

        // 转阶段延迟技能触发（二转三）
        if (this.state === 1 && this.transSub === 0 && this.transitionDelayEndTime > 0 && now >= this.transitionDelayEndTime) {
            this.triggerTransitionSkill();
            this.transitionDelayEndTime = 0;
        }

        // 远程攻击触发
        if (this.type === 1 && this.remoteAttackStartTime > 0 && !this.remoteAttackLaunched && now - this.remoteAttackStartTime >= this.remoteAttackDelay) {
            this.launchRemoteAttack();
        }

        // 技能准备
        if (this.isPreparingSkill) {
            let elapsed = now - this.preparingSkillStartTime;
            if (elapsed >= this.PREPARE_SKILL_DURATION) {
                this.startSkillAfterPreparation();
            } else {
                this.smoothFaceTarget(elapsed);
                this.npc.Teleport({ velocity: { x: 0, y: 0, z: 0 } });
                this.thinkInterval = this.prepareThinkInterval;
                Instance.SetNextThink(now + this.thinkInterval);
                return;
            }
        }

        // 技能施放
        if (this.isSkillCasting) {
            if (now - this.skillCastStartTime >= this.skillCastDuration) {
                this.endSkillCast();
                this.thinkInterval = this.NORMAL_THINK_INTERVAL;
            } else {
                this.npc.Teleport({ velocity: { x: 0, y: 0, z: 0 } });
                this.stopTurning();
                this.thinkInterval = this.NORMAL_THINK_INTERVAL;
                Instance.SetNextThink(now + this.thinkInterval);
                return;
            }
        }

        // 重新锁定目标
        if (this.isReacquiringTarget) {
            if (now - this.reacquireStartTime >= this.REACQUIRE_DURATION) {
                this.isReacquiringTarget = false;
                this.skillEndAngles = null;
            } else {
                this.npc.Teleport({ velocity: { x: 0, y: 0, z: 0 } });
                if (this.skillEndAngles) {
                    this.npc.Teleport({ angles: this.skillEndAngles });
                    this.currentAngles = { ...this.skillEndAngles };
                    this.targetYaw = this.skillEndAngles.yaw;
                }
                if (this.target?.IsValid() && this.target.IsAlive()) {
                    let npcPos = this.npc.GetAbsOrigin();
                    let tPos = this.target.GetAbsOrigin();
                    let dist = this.getDistance(npcPos, tPos);
                    if (dist <= this.RANGE && Math.abs(npcPos.z - tPos.z) <= this.MAX_HEIGHT) {
                        this.isReacquiringTarget = false;
                        this.skillEndAngles = null;
                        this.lastLockTime = now;
                        this.lastValidTargetTime = now;
                    }
                }
                this.thinkInterval = this.NORMAL_THINK_INTERVAL;
                Instance.SetNextThink(now + this.thinkInterval);
                return;
            }
        }

        // 转阶段移动分支（一转二移动）
        if (this.state === 1 && this.transSub === 2) {
            let npcPos = this.npc.GetAbsOrigin();
            let distToTarget = this.getDistance(npcPos, this.transitionTargetPos);
            this.moveToFixedPoint(this.transitionTargetPos);
            let dir = this.getDirection(npcPos, this.transitionTargetPos);
            this.startTurningTo(dir.yaw);
            this.updateRotation(now);

            let reached = (distToTarget < 50);
            let timeout = (now - this.transitionMoveStartTime >= 10.0);
            if (reached || timeout) {
                if (timeout) {
                    this.npc.Teleport({ position: this.transitionTargetPos });
                }
                this.onReachTargetAfterMove();
                return;
            }
            this.thinkInterval = this.NORMAL_THINK_INTERVAL;
            return;
        }

        // 转阶段其他子状态静止
        if (this.state === 1) {
            this.npc.Teleport({ velocity: { x: 0, y: 0, z: 0 } });
            this.stopTurning();
            this.thinkInterval = this.NORMAL_THINK_INTERVAL;
            return;
        }

        // ========== 常态 ==========
        if (!this.npc?.IsValid()) return;

        // 动态调整阶段速度
        if (this.stage === 1) {
            this.MOVE_SPEED = 12000;
            this.ROTATION_SPEED = 360;
        } else if (this.stage === 2) {
            this.MOVE_SPEED = this.bossParams.MOVE_SPEED;
            this.ROTATION_SPEED = this.bossParams.ROTATION_SPEED;
        } else if (this.stage === 3) {
            this.MOVE_SPEED = 10000;
            this.ROTATION_SPEED = 240;
        }

        // 后退处理
        if (this.isBackingUp) {
            if (this.updateBackup(now)) {
                this.isBackingUp = false;
                this.isStuckTurning = false;
                this.turnStartTime = 0;
                if (this.target?.IsValid()) {
                    let dir = this.getDirection(this.npc.GetAbsOrigin(), this.target.GetAbsOrigin());
                    this.startTurningTo(dir.yaw);
                }
            }
        }

        this.maintainStability();

        // 目标有效性检测
        let hasTarget = false;
        if (this.target?.IsValid() && this.target.IsAlive()) {
            let npcPos = this.npc.GetAbsOrigin();
            let tPos = this.target.GetAbsOrigin();
            let dist = this.getDistance(npcPos, tPos);
            if (dist <= this.RANGE && Math.abs(npcPos.z - tPos.z) <= this.MAX_HEIGHT) {
                hasTarget = true;
                this.lastValidTargetTime = now;
                this.lastNoTargetTime = now;
                if (this.normalSub === 0) {
                    this.checkSkills(dist, now);
                }
                if (this.isIdleMode) this.switchToNormalMode();
            } else {
                this.target = null;
            }
        }

        // 普通NPC无目标死亡
        if (this.type === 0 && !hasTarget && !this.isSkillCasting && !this.isPreparingSkill && !this.isReacquiringTarget && !this.isBackingUp) {
            if (this.noTargetStartTime === 0) this.noTargetStartTime = now;
            else if (now - this.noTargetStartTime >= this.NO_TARGET_DEATH_TIME) {
                this.npcDeath(true);
                return;
            }
        } else this.noTargetStartTime = 0;

        // 重新锁定目标
        if (!this.isReacquiringTarget && !this.isBackingUp && (!this.target || now - this.lastLockTime > this.LOCK_INTERVAL)) {
            if (!this.isIdleMode) hasTarget = this.findTargetWeighted(now);
            else {
                this.idleCheckCounter++;
                if (this.idleCheckCounter >= 1) {
                    this.idleCheckCounter = 0;
                    hasTarget = this.findTargetWeighted(now);
                }
            }
        }

        // 移动与转向
        if (this.normalSub === 0 && hasTarget && !this.isSkillCasting && !this.isPreparingSkill && !this.isReacquiringTarget && !this.isBackingUp) {
            let npcPos = this.npc.GetAbsOrigin();
            let tPos = this.target.GetAbsOrigin();
            this.startTurningTo(this.getDirection(npcPos, tPos).yaw);
            if (!(this.type === 1 && this.stage === 2)) {
                this.moveToTarget();
            }
        } else {
            if (this.type === 0 && !hasTarget && !this.isSkillCasting && !this.isPreparingSkill && !this.isReacquiringTarget && !this.isBackingUp) {
                if (typeof this.idleBehavior === 'function') this.idleBehavior();
            } else if (!this.isBackingUp) {
                this.npc.Teleport({ velocity: { x: 0, y: 0, z: 0 } });
            }
        }

        this.updateRotation(now);
        this.thinkInterval = this.isIdleMode ? this.IDLE_THINK_INTERVAL : this.NORMAL_THINK_INTERVAL;
    },

    // 移动到固定点
    moveToFixedPoint(pos) {
        if (!this.npc?.IsValid()) return;
        let npcPos = this.npc.GetAbsOrigin();
        let dist = this.getDistance(npcPos, pos);
        if (dist < 50) return;
        let yawRad = this.currentAngles.yaw * Math.PI / 180;
        let dtFactor = 2 * this.thinkInterval;
        let desired = {
            x: Math.cos(yawRad) * this.MOVE_SPEED * dtFactor,
            y: Math.sin(yawRad) * this.MOVE_SPEED * dtFactor,
            z: 0
        };
        let current = this.npc.GetAbsVelocity();
        let newVel = {
            x: current.x + desired.x,
            y: current.y + desired.y,
            z: current.z
        };
        let speed = Math.sqrt(newVel.x*newVel.x + newVel.y*newVel.y);
        let max = this.MOVE_SPEED * dtFactor;
        if (speed > max) {
            let scale = max / speed;
            newVel.x *= scale;
            newVel.y *= scale;
        }
        if (newVel.z > 100) newVel.z = 100;
        this.npc.Teleport({ velocity: newVel });
    },

    // 转向相关函数
    updateRotation(now) {
        if (!this.npc?.IsValid() || this.isSkillCasting || this.isPreparingSkill || this.isReacquiringTarget) {
            this.stopTurning();
            return;
        }
        if (!this.turningActive) {
            if (Math.abs(this.npc.GetAbsAngularVelocity().z) > 0.1) this.npc.Teleport({ angularVelocity: { x: 0, y: 0, z: 0 } });
            this.isStuckTurning = false;
            return;
        }
        let current = this.npc.GetAbsAngles();
        this.currentAngles.yaw = current.yaw;
        let delta = ((this.targetYaw - current.yaw + 540) % 360) - 180;
        let absDelta = Math.abs(delta);
        if (absDelta < 1) {
            this.stopTurning();
            this.npc.Teleport({ angles: { pitch: 0, yaw: this.targetYaw, roll: 0 } });
            this.currentAngles.yaw = this.targetYaw;
            this.isStuckTurning = false;
            return;
        }
        if (!this.isBackingUp && !this.isStuckTurning) {
            if (this.turnStartTime === 0 || Math.abs(absDelta - this.turnStartDelta) > 5) {
                this.turnStartTime = now;
                this.turnStartDelta = absDelta;
            } else if (now - this.turnStartTime > this.STUCK_TURN_TIMEOUT && absDelta > this.STUCK_ANGLE_THRESHOLD) {
                this.isStuckTurning = true;
                this.startBackup();
                return;
            }
        }
        let speed = this.ROTATION_SPEED * (this.isBackingUp ? 2 : 1);
        let desiredZ = (delta > 0 ? 1 : -1) * speed;
        let currentZ = this.npc.GetAbsAngularVelocity().z;
        if (Math.abs(currentZ) < 0.1 || (currentZ > 0) !== (desiredZ > 0)) {
            this.npc.Teleport({ angularVelocity: { x: 0, y: 0, z: desiredZ } });
        }
    },
    startTurningTo(yaw) {
        if (this.isSkillCasting || this.isPreparingSkill || this.isReacquiringTarget) return;
        this.targetYaw = yaw;
        this.turningActive = true;
    },
    stopTurning() {
        if (this.turningActive) {
            this.npc.Teleport({ angularVelocity: { x: 0, y: 0, z: 0 } });
            this.turningActive = false;
        }
    },

    // 移动
    moveToTarget() {
        if (!this.target?.IsValid() || this.isSkillCasting || this.isPreparingSkill || this.isReacquiringTarget || this.isBackingUp) return;
        if (this.type === 1 && this.stage === 2) return;
        let npcPos = this.npc.GetAbsOrigin();
        if (this.getDistance(npcPos, this.target.GetAbsOrigin()) < 50) return;
        if (this.type === 1 && this.getDistance(npcPos, this.target.GetAbsOrigin()) < 100) return;
        let yawRad = this.currentAngles.yaw * Math.PI / 180;
        let dtFactor = 2 * this.thinkInterval;
        let desired = {
            x: Math.cos(yawRad) * this.MOVE_SPEED * dtFactor,
            y: Math.sin(yawRad) * this.MOVE_SPEED * dtFactor,
            z: 0
        };
        let current = this.npc.GetAbsVelocity();
        let newVel = {
            x: current.x + desired.x,
            y: current.y + desired.y,
            z: current.z
        };
        let speed = Math.sqrt(newVel.x*newVel.x + newVel.y*newVel.y);
        let max = this.MOVE_SPEED * dtFactor;
        if (speed > max) {
            let scale = max / speed;
            newVel.x *= scale;
            newVel.y *= scale;
        }
        if (newVel.z > 100) newVel.z = 100;
        this.npc.Teleport({ velocity: newVel });
    },

    // 后退
    startBackup() {
        if (this.isBackingUp) return;
        this.isBackingUp = true;
        this.backupStartTime = Instance.GetGameTime();
        this.npc?.Teleport({ velocity: { x: 0, y: 0, z: 0 } });
        this.isStuckTurning = false;
        this.turnStartTime = 0;
    },
    updateBackup(now) {
        if (!this.isBackingUp) return true;
        if (now - this.backupStartTime >= this.BACKUP_DURATION) return true;
        let yawRad = this.currentAngles.yaw * Math.PI / 180;
        let dtFactor = 2 * this.thinkInterval;
        let desired = {
            x: -Math.cos(yawRad) * Math.abs(this.BACKUP_SPEED) * dtFactor,
            y: -Math.sin(yawRad) * Math.abs(this.BACKUP_SPEED) * dtFactor,
            z: 0
        };
        let current = this.npc.GetAbsVelocity();
        let newVel = {
            x: current.x + desired.x,
            y: current.y + desired.y,
            z: current.z
        };
        let speed = Math.sqrt(newVel.x*newVel.x + newVel.y*newVel.y);
        let max = Math.abs(this.BACKUP_SPEED) * dtFactor;
        if (speed > max) {
            let scale = max / speed;
            newVel.x *= scale;
            newVel.y *= scale;
        }
        if (newVel.z > 100) newVel.z = 100;
        this.npc.Teleport({ velocity: newVel });
        return false;
    },

    // 直立维持
    maintainStability() {
        if (!this.npc?.IsValid()) return;
        let ang = this.npc.GetAbsAngles();
        let pitchErr = -ang.pitch;
        let rollErr = -ang.roll;
        let pitchSpd = this.STABILITY_K * pitchErr;
        let rollSpd = this.STABILITY_K * rollErr;
        pitchSpd = Math.min(Math.max(pitchSpd, -this.MAX_STABILITY_SPEED), this.MAX_STABILITY_SPEED);
        rollSpd = Math.min(Math.max(rollSpd, -this.MAX_STABILITY_SPEED), this.MAX_STABILITY_SPEED);
        let curAngVel = this.npc.GetAbsAngularVelocity();
        if (Math.abs(pitchErr) > 0.1 || Math.abs(rollErr) > 0.1) {
            this.npc.Teleport({ angularVelocity: { x: pitchSpd, y: rollSpd, z: curAngVel.z } });
        } else if (Math.abs(curAngVel.x) > 0.1 || Math.abs(curAngVel.y) > 0.1) {
            this.npc.Teleport({ angularVelocity: { x: 0, y: 0, z: curAngVel.z } });
        }
    },

    // 模式切换
    switchToIdleMode() {
        if (this.isIdleMode) return;
        this.isIdleMode = true;
        this.thinkInterval = this.IDLE_THINK_INTERVAL;
        this.idleCheckCounter = 0;
        this.npc?.Teleport({ velocity: { x: 0, y: 0, z: 0 } });
        this.stopTurning();
    },
    switchToNormalMode() {
        if (!this.isIdleMode) return;
        this.isIdleMode = false;
        this.thinkInterval = this.NORMAL_THINK_INTERVAL;
    },

    // 目标查找（加权）
    findTargetWeighted(now) {
        if (now < this.lockStartTime) return false;
        if (Instance.GetGameTime() - this.lastPlayerCacheUpdate > this.PLAYER_CACHE_UPDATE_INTERVAL) {
            this.updatePlayerCache();
        }
        if (this.cachedPlayers.length === 0) return false;
        let npcPos = this.npc.GetAbsOrigin();
        let candidates = [];
        let totalWeight = 0;
        for (let p of this.cachedPlayers) {
            if (!p.IsAlive() || p.GetTeamNumber() !== 3) continue;
            let pPos = p.GetAbsOrigin();
            let dist = this.getDistance(npcPos, pPos);
            if (dist <= this.RANGE && Math.abs(npcPos.z - pPos.z) <= this.MAX_HEIGHT) {
                let vel = p.GetAbsVelocity();
                let speed = Math.sqrt(vel.x*vel.x + vel.y*vel.y + vel.z*vel.z);
                let w = speed > 500 ? 3 : speed > 300 ? 2 : 1;
                candidates.push({ player: p, weight: w });
                totalWeight += w;
            }
        }
        if (candidates.length === 0) return false;
        let r = Math.random() * totalWeight;
        let acc = 0;
        for (let c of candidates) {
            acc += c.weight;
            if (r <= acc) {
                if (this.isReacquiringTarget && this.target === c.player) return true;
                this.target = c.player;
                this.lastLockTime = now;
                this.lastValidTargetTime = now;
                this.lastNoTargetTime = now;
                if (this.isIdleMode) this.switchToNormalMode();
                let tPos = this.target.GetAbsOrigin();
                this.startTurningTo(this.getDirection(npcPos, tPos).yaw);
                return true;
            }
        }
        return false;
    },

    // ========== 技能相关 ==========
    tryUseSkill(skillName) {
        if (this.state !== 0 || this.normalSub !== 0) return;
        this.forceUseSkill(skillName);
    },

    forceUseSkill(skillName) {
        if (this.isPreparingSkill || this.isSkillCasting) {
            this.isPreparingSkill = false;
            this.isSkillCasting = false;
        }
        this.prepareSkill(Instance.GetGameTime(), skillName);
    },

    checkSkills(dist, now) {
        if (this.type === 0) {
            if (this.isNPCInAttackRange() && now - this.lastMeleeSkillTime >= this.MELEE_SKILL_COOLDOWN) {
                this.tryUseSkill("普通攻击");
            }
            return;
        }

        if (this.stage === 1) {
            if (this.isBossInAttackRange() && now - this.lastMeleeSkillTime >= this.MELEE_SKILL_COOLDOWN) {
                this.tryUseSkill("普通攻击");
            }
            return;
        }

        let skillReady = (now - this.lastSkillTime >= this.SKILL_CD);
        if (skillReady) {
            let skillToCast = null;
            if (this.stage === 2) {
                skillToCast = this.skillAlternateFlag === 0 ? "技能一" : "咆哮";
                this.skillAlternateFlag = 1 - this.skillAlternateFlag;
            } else if (this.stage === 3) {
                skillToCast = this.skillAlternateFlag === 0 ? "技能一" : "震击";
                this.skillAlternateFlag = 1 - this.skillAlternateFlag;
            }
            if (skillToCast) {
                this.tryUseSkill(skillToCast);
                return;
            }
        }

        if (this.isBossInAttackRange() && now - this.lastMeleeSkillTime >= this.MELEE_SKILL_COOLDOWN) {
            this.tryUseSkill("普通攻击");
        }
    },

    isNPCInAttackRange() {
        if (this.type !== 0 || !this.target?.IsValid()) return false;
        let npcPos = this.npc.GetAbsOrigin();
        let tPos = this.target.GetAbsOrigin();
        let dx = tPos.x - npcPos.x, dy = tPos.y - npcPos.y;
        let horiz = Math.sqrt(dx*dx + dy*dy);
        return horiz <= this.CLOSE_RANGE_NPC && Math.abs(tPos.z - npcPos.z) <= 1600;
    },

    isBossInAttackRange() {
        if (this.type !== 1 || !this.target?.IsValid()) return false;
        let npcPos = this.npc.GetAbsOrigin();
        let tPos = this.target.GetAbsOrigin();
        let dx = tPos.x - npcPos.x, dy = tPos.y - npcPos.y;
        let horiz = Math.sqrt(dx*dx + dy*dy);
        return horiz <= this.CLOSE_RANGE_BOSS && Math.abs(tPos.z - npcPos.z) <= 1600;
    },

    // ========== 伤害处理 ==========
    takeDamage(amount, ignoreVulnerable = false) {
        if (!this.npc?.IsValid()) return false;
        if (this.isInvulnerable) return false;
        if (this.type === 1) {
            let final = ignoreVulnerable ? amount : amount * (this.isCurrentlyVulnerable() ? this.VULNERABLE_DAMAGE_MULTIPLIER : 1);
            this.applyDamage(final);
            return true;
        } else {
            let final = ignoreVulnerable ? amount : amount * (this.isCurrentlyVulnerable() ? this.VULNERABLE_DAMAGE_MULTIPLIER : 1);
            this.npc_hp -= final;
            print(this.npc_hp)
            if (this.npc_hp <= 0) { this.npcDeath(false); return true; }
            return true;
        }
    },

    npcDeath(isNatural = false) {
        if (!this.npc?.IsValid()) return;
        let bossPhy = find("s25_boss_phy");
        if (this.type === 0 && bossPhy && bossPhy.IsValid()) {
            fire("s25_boss_phy", isNatural ? "fireuser1" : "fireuser3");
        } else if (this.type === 1) {
            fire("s25_npc_phy*", "fireuser3", "", 0);
            fire("tq_timer0", "disable", "", 0);
            fire("s25_boss_qxz_timer0", "disable", "", 0);
        }
        fireT(this.npc, "fireuser4", "", 0);
        fireT(this.model, "kill", "", 10);
        for (let i = 0; i <= 7; i += 0.02) fireT(this.model, "setrenderattribute", "a = " + i/7, i+3);
        this.target = null;
        this.isSkillCasting = false;
        this.isPreparingSkill = false;
        this.isReacquiringTarget = false;
        this.stopTurning();
        this.npc.Teleport({ velocity: { x: 0, y: 0, z: 0 } });
        Instance.SetThink(() => {});
        this.boss_hp_counter = 0;
        this.npc_hp = 0;
        this.noTargetStartTime = 0;
        this.state = 0;
        this.pendingTransition = false;
    },

    // 脆弱状态
    isCurrentlyVulnerable() {
        if (!this.isVulnerable) return false;
        let now = Instance.GetGameTime();
        if (now - this.vulnerableStartTime >= this.VULNERABLE_DURATION) {
            this.isVulnerable = false;
            return false;
        }
        return true;
    },

    handleCut() {
        if (this.type === 1 && this.stage === 2) return;
        this.cutCount++;
        let th = this.type === 1 ? this.BOSS_CUT_THRESHOLD : this.NPC_CUT_THRESHOLD;
        if (this.cutCount >= th && !this.isVulnerable) {
            this.isVulnerable = true;
            this.vulnerableStartTime = Instance.GetGameTime();
            this.cutCount = 0;
            if(type === 1){
                fire("s25_boss_weak_p0","start","",0);
                fire("s25_boss_weak_p0","stop","",10);
            }
        }
        let dmg = 50;
        if(type === 0){dmg = 1000}
        this.takeDamage(dmg, true);
        print("getcut")
    },

    handlenpcdie() {
        if (this.type === 1 && this.stage === 2) {
            let dmg = 30;
            this.takeDamage(dmg);
            return;
        }
    },

    handlenpcdie2() {
        if (this.type === 1 && this.stage === 2) {
            let dmg = 5;
            this.takeDamage(dmg);
            return;
        }
    },

    // ========== 技能准备和执行 ==========
    prepareSkill(now, skill) {
        if (this.state === 0) this.normalSub = 1;
        if (this.state === 1 && this.transSub === 0) this.transSub = 1;
        if (this.state === 1 && this.transSub === 2) this.transSub = 1;

        this.stopTurning();
        this.isPreparingSkill = true;
        this.preparingSkillType = skill;
        this.preparingSkillStartTime = now;
        this.prepareStartAngles = { ...this.currentAngles };
        this.calculatePrepareTargetAngles();
        this.thinkInterval = this.prepareThinkInterval;
        Instance.SetNextThink(now + this.prepareThinkInterval);
    },

    calculatePrepareTargetAngles() {
        if (!this.target?.IsValid()) return;
        let npcPos = this.npc.GetAbsOrigin();
        let tPos = this.target.GetAbsOrigin();
        let dir = this.getDirection(npcPos, tPos);
        this.prepareTargetAngles = { pitch: 0, yaw: dir.yaw, roll: 0 };
    },

    smoothFaceTarget(elapsed) {
        if (!this.target?.IsValid() || !this.prepareStartAngles || !this.prepareTargetAngles) return;
        let t = Math.min(elapsed / this.PREPARE_SKILL_DURATION, 1.0);
        let yaw = this.lerpAngle(this.prepareStartAngles.yaw, this.prepareTargetAngles.yaw, t);
        this.npc.Teleport({ angles: { pitch: 0, yaw, roll: 0 } });
        this.currentAngles.yaw = yaw;
    },

    startSkillAfterPreparation() {
        let skill = this.preparingSkillType;
        if (this.prepareTargetAngles) {
            this.npc.Teleport({ angles: this.prepareTargetAngles });
            this.currentAngles = { ...this.prepareTargetAngles };
        }
        this.isPreparingSkill = false;
        this.preparingSkillType = null;
        this.preparingSkillStartTime = 0;
        this.prepareStartAngles = null;
        this.prepareTargetAngles = null;

        if (skill === "普通攻击") {
            if (this.type === 1) {
                this.startSkillCast(2.0, "BOSS普通攻击");
                fire("s25_boss_atk1_hurt0", "enable", "", 0.3);
                fire("s25_boss_atk1_hurt0", "disable", "", 0.8);
                fire("s25_boss_dy0", "SetAnimationNotLooping", "attack1_1", 0);
                if(this.stage===2){
                    fire("s25_boss_dy0", "SetAnimationLooping", "idle", 2);
                }else{
                    fire("s25_boss_dy0", "SetAnimationLooping", "run_f", 2);
                }
                fire("s25_boss_atk1_p0", "fireuser1", "", 0.3);
                this.lastMeleeSkillTime = Instance.GetGameTime();
            } else {
                this.startSkillCast(3, "NPC普通攻击");
                fireT(this.npc, "fireuser1", "", 0);
                this.lastMeleeSkillTime = Instance.GetGameTime();
            }
        } else if (skill === "技能一") {
            this.startSkillCast(4.0, "技能一");
            fire("s25_boss_dy0", "SetAnimationNotLooping", "skill_fireball", 0);
            if(this.stage===2){
                fire("s25_boss_dy0", "SetAnimationLooping", "idle", 3);
            }else{
                fire("s25_boss_dy0", "SetAnimationLooping", "run_f", 3);
            }
            this.setupRemoteAttack();
        } else if (skill === "震击") {
            this.startSkillCast(5, "震击");
            fire("s25_boss_dy0", "SetAnimationNotLooping", "skill_jump", 0);
            fire("s25_boss_dy0", "SetAnimationLooping", "run_f", 5);
            fire("s25_boss_shake", "startshake", "", 2.87);
            fire("s25_boss_shake", "startshake", "", 3.07);
            fire("s25_boss_shake", "startshake", "", 3.27);
            fire("s25_boss_script", "runscriptinput", "boss_zhenji", 2.87);
            fire("s25_boss_s2_p1", "fireuser1", "", 2.87);
            fire("script", "runscriptinput", "disliti", 2.87);
        } else if (skill === "咆哮") {
            this.startSkillCast(7, "咆哮");
            fire("s25_boss_dy0", "SetAnimationNotLooping", "skill_qxz", 0);
            fire("s25_boss_dy0", "SetAnimationLooping", "idle", 8.5);
            fire("script", "runscriptinput", "s36npc_boss", 1);
            fire("s25_boss_s3_p0", "start", "", 0.5);
            fire("s25_boss_s3_p0", "stop", "", 4.5);
            fire("s25_boss_sound_hou", "startsound", "", 0);
        }
    },

    startSkillCast(duration, skill) {
        this.stopTurning();
        this.isSkillCasting = true;
        this.skillCastStartTime = Instance.GetGameTime();
        this.skillCastDuration = duration;
        this.currentSkillType = skill;
        this.npc.Teleport({ velocity: { x: 0, y: 0, z: 0 } });
        this.thinkInterval = 0.05;
    },

    endSkillCast() {
        this.skillEndAngles = this.npc.GetAbsAngles();
        this.isSkillCasting = false;
        this.skillCastStartTime = 0;
        this.skillCastDuration = 0;
        let now = Instance.GetGameTime();

        if (this.currentSkillType !== "普通攻击") {
            this.lastSkillTime = now;
        }

        if (this.state === 0) {
            this.normalSub = 0;
            if (this.pendingTransition) {
                this.pendingTransition = false;
                this.startPhaseTransition();
                return;
            }
            this.startReacquireTarget();
        } else if (this.state === 1 && this.transSub === 1) {
            this.onTransitionSkillFinished();
        }
    },

    // ========== 转阶段核心 ==========
    startPhaseTransition() {
        if (this.state !== 0) return;
        this.state = 1;
        this.transitionStage = this.stage;
        this.transitionStartTime = Instance.GetGameTime();
        this.isInvulnerable = true;
        this.stopTurning();
        this.npc.Teleport({ velocity: { x: 0, y: 0, z: 0 } });

        if (this.transitionStage === 1) {
            this.transSub = 2;
            this.transitionTargetPos = { x: 8704, y: -6704, z: this.npc.GetAbsOrigin().z };
            this.savedMoveSpeed = this.MOVE_SPEED;
            this.MOVE_SPEED = this.savedMoveSpeed * 2;
            this.transitionMoveStartTime = Instance.GetGameTime();
            this.transitionDelayEndTime = 0;
            fire("bgm_beast0", "stopsound", "", 0);
            fire("bgm_beast1", "startsound", "", 0);
        } else if (this.transitionStage === 2) {
            this.transSub = 0;
            this.transitionDelayEndTime = this.transitionStartTime + 2.0;
            fire("tq_timer0", "enable", "", 5);
            fire("tq_timer0", "refiretime", "5", 5);
            fire("s25_boss_qxz_timer0", "enable", "", 5);
        }
    },

    onReachTargetAfterMove() {
        if (this.state !== 1 || this.transSub !== 2) return;
        this.transSub = 1;
        this.forceUseSkill("咆哮");
    },

    triggerTransitionSkill() {
        if (this.state !== 1 || this.transSub !== 0) return;
        let skill = this.transitionStage === 1 ? "咆哮" : "震击";
        this.forceUseSkill(skill);
    },

    onTransitionSkillFinished() {
        if (this.state !== 1) return;
        if (this.transitionStage === 1 || this.transitionStage === 2) {
            this.finishPhaseTransition();
        }
    },

    finishPhaseTransition() {
        this.MOVE_SPEED = this.savedMoveSpeed;
        this.isInvulnerable = false;

        if (this.transitionStage === 1) {
            this.stage = 2;
        } else if (this.transitionStage === 2) {
            this.stage = 3;
        }
        this.initStage();

        this.state = 0;
        this.normalSub = 0;
        this.transSub = 0;
        this.transitionStage = 0;
        this.transitionStartTime = 0;
        this.transitionDelayEndTime = 0;
        this.transitionTargetPos = null;
        this.transitionArrivalTime = null;
        this.transitionMoveStartTime = 0;

        fire("s25_boss_dy0", "SetAnimationLooping", "run_f", 0);
    },

    // 远程攻击相关
    setupRemoteAttack() {
        if (this.type !== 1) return;
        this.remoteAttackStartTime = Instance.GetGameTime();
        this.remoteAttackLaunched = false;
        fire("s25_boss_s1_p0", "fireuser1", "", this.remoteAttackDelay);
    },
    launchRemoteAttack() {
        if (this.type !== 1) return;
        let atk = Instance.FindEntityByName("s25_boss_s1_phy0");
        let maker = Instance.FindEntityByName("s25_boss_s1_maker0");
        if (!atk?.IsValid() || !maker || !this.target?.IsValid()) {
            this.resetRemoteAttack();
            return;
        }
        this.calculateDynamicPredictTime();
        let predict = this.PREDICT_TIME;
        let spawnPos = maker.GetAbsOrigin();
        let tPos = this.target.GetAbsOrigin();
        let tVel = this.target.GetAbsVelocity();
        let predPos = {
            x: tPos.x + tVel.x * predict,
            y: tPos.y + tVel.y * predict,
            z: tPos.z + tVel.z * predict
        };
        let dir = this.getDirection(spawnPos, predPos);
        atk.Teleport({ position: spawnPos, angles: dir });
        let speed = 12000;
        let yaw = dir.yaw * Math.PI/180;
        let pitch = dir.pitch * Math.PI/180;
        let vel = {
            x: Math.cos(yaw) * Math.cos(pitch) * speed,
            y: Math.sin(yaw) * Math.cos(pitch) * speed,
            z: Math.sin(-pitch) * speed
        };
        atk.Teleport({ velocity: vel });
        this.remoteAttackLaunched = true;
    },
    resetRemoteAttack() {
        this.remoteAttackStartTime = 0;
        this.remoteAttackLaunched = false;
    },
    calculateDynamicPredictTime() {
        if (!this.target?.IsValid() || !this.npc?.IsValid()) { this.PREDICT_TIME = 0.5; return; }
        let dist = this.getDistance(this.npc.GetAbsOrigin(), this.target.GetAbsOrigin());
        if (dist <= this.MIN_DISTANCE) this.PREDICT_TIME = this.MIN_PREDICT_TIME;
        else if (dist >= this.MAX_DISTANCE) this.PREDICT_TIME = this.MAX_PREDICT_TIME;
        else {
            let t = (dist - this.MIN_DISTANCE) / (this.MAX_DISTANCE - this.MIN_DISTANCE);
            this.PREDICT_TIME = this.MIN_PREDICT_TIME + t * (this.MAX_PREDICT_TIME - this.MIN_PREDICT_TIME);
        }
    },

    startReacquireTarget() {
        this.stopTurning();
        this.isReacquiringTarget = true;
        this.reacquireStartTime = Instance.GetGameTime();
        this.target = null;
        this.lastLockTime = 0;
    },

    zhenji(){
        for(const p of this.cachedPlayers){
            let delta = sub(p.GetAbsOrigin(), this.npc.GetAbsOrigin());
            if(len2(delta) < 1200 ){
                p.TakeDamage({damage:180});
            }else if(len2(delta) < 3600 && delta.z < 96){
                p.TakeDamage({damage:50});
            }
        }
    }
};

// 输入处理
Instance.OnScriptInput("gethit", ({caller, activator}) => tracker.takeDamage(1));
Instance.OnScriptInput("getcut", ({caller, activator}) => tracker.handleCut());
Instance.OnScriptInput("npcdeath", ({caller, activator}) => tracker.handlenpcdie());
Instance.OnScriptInput("npcdeath2", ({caller, activator}) => tracker.handlenpcdie2());
Instance.OnScriptInput("boss_zhenji", ({caller, activator}) => tracker.zhenji());

Instance.Msg("NPC追踪系统已加载");