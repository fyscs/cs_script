import { CSPlayerPawn, Entity, Instance } from "cs_script/point_script";

class Item002LaserManager {
    static instances = new Map();
    // 存储结构：key = 目标EntityName, value = 锁定它的Laser实例
    static lockRegistry = new Map();

    static connect(relayEntity) {
        if (!relayEntity?.IsValid()) return;

        const relayName = relayEntity.GetEntityName();
        const baseName = `${relayName}`.replace("laser_relay", "laser_base");
        const laserBase = Instance.FindEntityByName(baseName);

        if (!laserBase?.IsValid()) return;

        const laser = new Laser(relayEntity, laserBase);
        if (laser.initialize()) {
            this.instances.set(relayName, laser);
        }
    }

    static findByOwner(player) {
        if (!player?.IsValid()) return undefined;

        for (const [_, laser] of this.instances.entries()) {
            if (laser.laserBase?.GetOwner() === player) {
                return laser;
            }
        }
        return undefined;
    }

    static resetAll() {
        this.lockRegistry.clear();
        for (const laser of this.instances.values()) {
            laser.reset();
        }
    }

    // 每帧调用：清理无效的锁定，保持状态同步（心跳机制）
    static refreshRegistry() {
        for (const [targetName, laserInstance] of this.lockRegistry.entries()) {
            // 如果激光器不再发射，或者目标已经失效，释放锁
            const hasValidTarget = laserInstance.lockedTargets.some(t => {
                if (!t.isActive) return false;
                const target = t.target;
                if (!target || !target.IsValid()) return false;
                return target.GetEntityName() === targetName;
            });
            if (!laserInstance.isFiring || !hasValidTarget) {
                this.lockRegistry.delete(targetName);
            }
        }
    }

    // 统一锁定入口：传入候选名单，返回通过校验的名单
    static requestLocks(requestingLaser, candidateEntities) {
        const approvedTargets = [];

        for (const entity of candidateEntities) {
            if (approvedTargets.length >= requestingLaser.maxTargets) break;

            const name = entity.GetEntityName();
            if (!name) {
                approvedTargets.push(entity);
                continue;
            }

            const currentOwner = this.lockRegistry.get(name);

            // 如果没人锁定，或者锁定者就是自己（续约），则允许锁定
            if (!currentOwner || currentOwner === requestingLaser) {
                this.lockRegistry.set(name, requestingLaser);
                approvedTargets.push(entity);
            }
        }
        return approvedTargets;
    }

    // 释放单个目标的锁定
    static releaseLock(laserInstance, targetName) {
        if (this.lockRegistry.get(targetName) === laserInstance) {
            this.lockRegistry.delete(targetName);
        }
    }

    // 释放激光实例的所有锁定
    static releaseAllLocks(laserInstance) {
        for (const [targetName, owner] of this.lockRegistry.entries()) {
            if (owner === laserInstance) {
                this.lockRegistry.delete(targetName);
            }
        }
    }
}

class Laser {
    relay;
    laserBase;
    model1;
    particles_s = [];
    particles_t = [];
    button;
    pos;
    sound1;

    lockedTargets = [];
    isFiring = false;
    firingTime = 0;
    maxTargets = 3;
    maxAngleDegrees = 45;
    maxRange = 2048;
    soundPlaying = false;

    isCoolingDown = false;
    cooldownDuration = 10.0;
    cooldownStartTime = 0;

    damagePerSecondPlayer = 50;
    damagePerSecondNPC = 20;
    damageInterval = 0.15;
    lastDamageTime = 0;

    static getForwardVectorFromAngles(angles) {
        const pitchRad = angles.pitch * (Math.PI / 180);
        const yawRad = angles.yaw * (Math.PI / 180);
        
        return {
            x: Math.cos(pitchRad) * Math.cos(yawRad),
            y: Math.cos(pitchRad) * Math.sin(yawRad),
            z: -Math.sin(pitchRad)
        };
    }

    constructor(relayEntity, laserBase) {
        this.relay = relayEntity;
        this.laserBase = laserBase;
    }

    initialize() {
        const relayName = this.relay.GetEntityName();

        this.model1 = Instance.FindEntityByName(relayName.replace("laser_relay", "laser_model"));

        for (let i = 1; i <= 3; i++) {
            const particle_s = Instance.FindEntityByName(relayName.replace("laser_relay", `laser_particle_s_${i}`));
            if (particle_s && particle_s.IsValid()) {
                this.particles_s.push(particle_s);
            }
        }

        for (let i = 1; i <= 3; i++) {
            const particle_t = Instance.FindEntityByName(relayName.replace("laser_relay", `laser_particle_t_${i}`));
            if (particle_t && particle_t.IsValid()) {
                this.particles_t.push(particle_t);
            }
        }

        this.button = Instance.FindEntityByName(relayName.replace("laser_relay", "laser_button"));
        this.sound1 = Instance.FindEntityByName(relayName.replace("laser_relay", "laser_sound_1"));

        const hasRequired = this.model1 && this.particles_s.length > 0 && this.particles_t.length > 0 && this.button;
        if (!hasRequired) return false;

        if (this.button?.IsValid()) {
            Instance.ConnectOutput(this.button, "OnPressed", (event) => {
                const player = event.activator;

                if (!player?.IsValid()) return;
                if (!player.IsAlive()) return;
                if (this.laserBase?.GetOwner() !== player) return;
                if (!this.canFire()) return;

                this.fire(player);
            });
        }

        this.reset();
        return true;
    }

    reset() {
        this.isCoolingDown = false;
        this.isFiring = false;
        this.firingTime = 0;
        this.lockedTargets = [];
        this.lastDamageTime = 0;
        this.setButtonEnabled(true);

        for (const particle of this.particles_s) {
            if (particle?.IsValid()) {
                Instance.EntFireAtTarget({ target: particle, input: "Stop" });
            }
        }
    }

    canFire() {
        return !this.isCoolingDown && !this.isFiring;
    }

    fire(player) {
        if (!this.canFire() || !player?.IsValid() || !player.IsAlive()) return false;

        this.lockTargets(player);
        if (this.lockedTargets.length === 0) {
            this.isCoolingDown = false;
            this.setButtonEnabled(true);
            return false;
        }
        this.startCooldown();
        this.activateLaser(player);
        return true;
    }

    // 核心重写：寻找并请求锁定
    lockTargets(player) {
        if (!player?.IsValid()) return;

        const eyePos = player.GetEyePosition();
        const forwardDir = Laser.getForwardVectorFromAngles(player.GetEyeAngles());
        const laserStartPos = this.pos?.GetAbsOrigin() || player.GetAbsOrigin();

        // 1. 获取视野内所有潜在目标并按距离排序
        const potentials = this.getPotentialTargets(eyePos, forwardDir, laserStartPos);

        // 2. 向 Manager 申请锁定权限
        const finalEntities = Item002LaserManager.requestLocks(this, potentials);

        // 3. 应用锁定结果
        this.lockedTargets = finalEntities.map(ent => ({
            target: ent,
            isActive: true
        }));
    }

    getPotentialTargets(eyePos, forwardDir, laserStartPos) {
        const validTargets = [];

        // 获取所有可攻击实体（Player + NPCs）
        const allPlayers = Instance.FindEntitiesByClass("player");
        for (const target of allPlayers) {
            if (!target?.IsValid() || !target.IsAlive()) continue;
            if (target.GetTeamNumber() === 2) {
                validTargets.push(target);
            }
        }

        const npcs = this.findNPCs(eyePos, this.maxRange);
        for (const npc of npcs) {
            if (npc?.IsValid()) {
                validTargets.push(npc);
            }
        }

        // 计算距离并筛选有效目标
        const targetsWithDistance = [];
        for (const target of validTargets) {
            const targetPos = target.GetAbsOrigin();
            const dx = targetPos.x - eyePos.x;
            const dy = targetPos.y - eyePos.y;
            const dz = targetPos.z - eyePos.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance > this.maxRange) continue;

            // 计算夹角
            if (distance > 0.1) {
                const targetDir = {
                    x: dx / distance,
                    y: dy / distance,
                    z: dz / distance
                };

                const dot = forwardDir.x * targetDir.x + forwardDir.y * targetDir.y + forwardDir.z * targetDir.z;
                const angleRad = Math.acos(Math.min(1, Math.max(-1, dot)));
                const angleDeg = angleRad * (180 / Math.PI);

                if (angleDeg > this.maxAngleDegrees) continue;
            }

            // 视线检测
            const targetCenterPos = this.getTargetCenterPosition(target);
            if (!this.hasLineOfSight(laserStartPos, targetCenterPos, target)) continue;

            targetsWithDistance.push({
                entity: target,
                dist: distance
            });
        }

        // 严格按距离升序排列，确保 requestLocks 优先处理最近的目标
        return targetsWithDistance.sort((a, b) => a.dist - b.dist).map(t => t.entity);
    }

    hasLineOfSight(startPos, endPos, targetEntity) {
        // laser不会被阻挡
        return true;
    }

    findNPCs(playerPos, maxRange) {
        const npcs = [];

        // 查找 func_physbox 类型的 NPC (bean, frog, baby)
        const physboxes = Instance.FindEntitiesByClass("func_physbox");
        for (const physbox of physboxes) {
            if (!physbox?.IsValid()) continue;
            const name = physbox.GetEntityName();
            if (name && (name.startsWith("bean_health") || name.startsWith("frog_health") || name === "baby_health")) {
                const npcPos = physbox.GetAbsOrigin();
                const dx = npcPos.x - playerPos.x;
                const dy = npcPos.y - playerPos.y;
                const dz = npcPos.z - playerPos.z;
                const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
                if (distance <= maxRange) {
                    npcs.push(physbox);
                }
            }
        }

        // 查找 func_breakable 类型的 NPC (baby helmet)
        const breakables = Instance.FindEntitiesByClass("func_breakable");
        for (const breakable of breakables) {
            if (!breakable?.IsValid()) continue;
            const name = breakable.GetEntityName();
            if (name && name.startsWith("ActIII_Baby_Helmet_")) {
                const npcPos = breakable.GetAbsOrigin();
                const dx = npcPos.x - playerPos.x;
                const dy = npcPos.y - playerPos.y;
                const dz = npcPos.z - playerPos.z;
                const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
                if (distance <= maxRange) {
                    npcs.push(breakable);
                }
            }
        }

        return npcs;
    }

    activateLaser(player) {
        if (this.lockedTargets.length === 0) return;

        this.isFiring = true;
        this.firingTime = 0;

        if (this.sound1?.IsValid()) {
            Instance.EntFireAtTarget({ target: this.sound1, input: "StartSound" });
            this.soundPlaying = true;
        }

        for (let i = 0; i < this.lockedTargets.length; i++) {
            if (this.particles_t[i]?.IsValid()) {
                const targetCenterPos = this.getTargetCenterPosition(this.lockedTargets[i].target);
                this.particles_t[i].Teleport({ position: targetCenterPos });

                Instance.EntFireAtTarget({ target: this.particles_t[i], input: "Start" });
            }

            if (this.particles_s[i]?.IsValid()) {
                Instance.EntFireAtTarget({ target: this.particles_s[i], input: "Start" });
            }
        }
    }

    updateLaser() {
        if (!this.isFiring || this.lockedTargets.length === 0) return;

        const player = this.laserBase?.GetOwner();
        if (!player?.IsValid() || !player.IsAlive()) {
            this.stopLaser();
            return;
        }

        const eyePos = player.GetEyePosition();
        const eyeAngles = player.GetEyeAngles();
        const forwardDir = Laser.getForwardVectorFromAngles(eyeAngles);
        let activeLaserCount = 0;

        for (let i = 0; i < this.lockedTargets.length; i++) {
            const lockedTarget = this.lockedTargets[i];
            if (!lockedTarget.isActive) continue;

            const target = lockedTarget.target;
            if (!target?.IsValid() || !target.IsAlive()) {
                this.stopSingleLaser(i);
                continue;
            }

            const targetPos = target.GetAbsOrigin();
            const dx = targetPos.x - eyePos.x;
            const dy = targetPos.y - eyePos.y;
            const dz = targetPos.z - eyePos.z;
            const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);

            if (distance > this.maxRange) {
                this.stopSingleLaser(i);
                continue;
            }

            let isInRange = true;
            if (distance > 0.1) {
                const targetDir = {
                    x: dx / distance,
                    y: dy / distance,
                    z: dz / distance
                };

                const dot = forwardDir.x * targetDir.x + forwardDir.y * targetDir.y + forwardDir.z * targetDir.z;
                const angleRad = Math.acos(Math.min(1, Math.max(-1, dot)));
                const angleDeg = angleRad * (180 / Math.PI);

                if (angleDeg > this.maxAngleDegrees) {
                    isInRange = false;
                }
            }

            if (!isInRange) {
                this.stopSingleLaser(i);
                continue;
            }

            const laserStartPos = this.pos?.GetAbsOrigin() || player.GetAbsOrigin();
            const targetCenterPos = this.getTargetCenterPosition(target);
            if (!this.hasLineOfSight(laserStartPos, targetCenterPos, target)) {
                this.stopSingleLaser(i);
                continue;
            }

            activeLaserCount++;
            if (this.particles_t[i]?.IsValid()) {
                this.particles_t[i].Teleport({ position: targetCenterPos });
            }
        }

        if (activeLaserCount === 0) {
            this.stopLaser();
            return;
        }

        this.firingTime += 0.01;

        if (this.firingTime > 3.1) {
            this.stopLaser();
            return;
        }

        const currentTime = Instance.GetGameTime();
        if (currentTime - this.lastDamageTime >= this.damageInterval) {
            this.applyDamage();
            this.lastDamageTime = currentTime;
        }
    }

    applyDamage() {
        const attacker = this.laserBase?.GetOwner();

        for (const lockedTarget of this.lockedTargets) {
            if (!lockedTarget.isActive) continue;
            const target = lockedTarget.target;
            if (!target?.IsValid()) continue;


            if (target.IsAlive() && target.GetTeamNumber() === 2) {
                target.TakeDamage({
                    attacker: attacker,
                    damage: this.damagePerSecondPlayer,
                    damageTypes: 0
                });
                const speed = target?.GetAbsVelocity();
                target.Teleport({ velocity: { x: speed.x * 0.4, y: speed.y * 0.4, z: speed.z * 0.4 } });
            }

            const targetName = target.GetEntityName();
            if (targetName?.startsWith("bean_health") || targetName?.startsWith("frog_health") || targetName?.startsWith("ActIII_Baby_Helmet_") || targetName === "baby_health") {
                const isBabyTarget = targetName === "baby_health" || targetName?.startsWith("ActIII_Baby_Helmet_");
                const damageMultiplier = isBabyTarget ? 4.0 : 1.0;
                target.TakeDamage({
                    attacker: attacker,
                    damage: this.damagePerSecondNPC * damageMultiplier,
                    damageTypes: 0
                });
            }
        }
    }

    getTargetCenterPosition(target) {
        const origin = target.GetAbsOrigin();
        const heightOffset = 36;
        return {
            x: origin.x,
            y: origin.y,
            z: origin.z + heightOffset
        };
    }

    stopSingleLaser(index) {
        if (index < 0 || index >= this.lockedTargets.length) return;

        const target = this.lockedTargets[index].target;
        // 通知 Manager 释放锁（目标可能已失效，需要安全检查）
        if (target && target.IsValid()) {
            const targetName = target.GetEntityName();
            if (targetName) {
                Item002LaserManager.releaseLock(this, targetName);
            }
        }
        this.lockedTargets[index].isActive = false;

        // 停止源粒子和目标粒子
        if (this.particles_s[index]?.IsValid()) {
            Instance.EntFireAtTarget({ target: this.particles_s[index], input: "Stop" });
        }
        if (this.particles_t[index]?.IsValid()) {
            Instance.EntFireAtTarget({ target: this.particles_t[index], input: "Stop" });
        }

        const allStopped = this.lockedTargets.every(t => !t.isActive);
        if (allStopped) {
            this.stopSound();
            this.isFiring = false;
            this.firingTime = 0;
            this.lastDamageTime = 0;
        }
    }

    stopSound() {
        if (this.soundPlaying && this.sound1?.IsValid()) {
            Instance.EntFireAtTarget({ target: this.sound1, input: "StopSound" });
            this.soundPlaying = false;
        }
    }

    stopLaser() {
        this.isFiring = false;
        this.firingTime = 0;
        this.lastDamageTime = 0;

        // 通知 Manager 释放所有锁定
        Item002LaserManager.releaseAllLocks(this);

        // 停止所有源粒子和目标粒子
        for (const particle of this.particles_s) {
            if (particle?.IsValid()) {
                Instance.EntFireAtTarget({ target: particle, input: "Stop" });
            }
        }
        for (const particle of this.particles_t) {
            if (particle?.IsValid()) {
                Instance.EntFireAtTarget({ target: particle, input: "Stop" });
            }
        }

        for (const lockedTarget of this.lockedTargets) {
            lockedTarget.isActive = false;
        }

        this.stopSound();
        this.lockedTargets = [];
    }

    setButtonEnabled(enabled) {
        if (!this.button?.IsValid()) return;
        Instance.EntFireAtTarget({
            target: this.button,
            input: enabled ? "Enable" : "Disable",
            delay: 0.0
        });
    }

    startCooldown() {
        if (this.isCoolingDown) return;
        this.isCoolingDown = true;
        this.setButtonEnabled(false);
        this.cooldownStartTime = Instance.GetGameTime();
    }

    checkCooldown() {
        if (!this.isCoolingDown) return;

        const elapsed = Instance.GetGameTime() - this.cooldownStartTime;
        if (elapsed >= this.cooldownDuration) {
            this.isCoolingDown = false;
            this.setButtonEnabled(true);
        }
    }
}


Instance.SetThink(() => {
    Instance.SetNextThink(Instance.GetGameTime() + 0.01);
    // 心跳机制：每帧校验锁定状态，自动清理无效锁
    Item002LaserManager.refreshRegistry();
    for (const laser of Item002LaserManager.instances.values()) {
        if (laser?.laserBase?.IsValid()) {
            laser.checkCooldown();
            laser.updateLaser();
        }
    }
});
Instance.SetNextThink(Instance.GetGameTime());

Instance.OnScriptInput("connect_laser", (event) => {
    Item002LaserManager.connect(event.caller);
});

Instance.OnRoundStart(() => {
    Item002LaserManager.resetAll();
});
