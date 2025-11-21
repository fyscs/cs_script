import { Instance } from "cs_script/point_script";

// by 凯岩城的狼
const state = {
    playerInfos: {},
    lastShotTime: {} // 记录每个玩家的最后射击时间
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

    Inverse() {
        return new Vector3(1 / this.x, 1 / this.y, 1 / this.z);
    }

    Length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    LengthSq() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    Normalized() {
        const len = this.Length();
        return new Vector3(this.x / len, this.y / len, this.z / len);
    }

    Add(vector) {
        return new Vector3(this.x + vector.x, this.y + vector.y, this.z + vector.z);
    }

    Subtract(vector) {
        return new Vector3(this.x - vector.x, this.y - vector.y, this.z - vector.z);
    }

    Divide(vector) {
        return new Vector3(this.x / vector.x, this.y / vector.y, this.z / vector.z);
    }

    Multiply(vector) {
        return new Vector3(this.x * vector.x, this.y * vector.y, this.z * vector.z);
    }

    MultiplyScalar(v) {
        return new Vector3(this.x * v, this.y * v, this.z * v);
    }

    Cross(v) {
        const x = this.y * v.z - this.z * v.y;
        const y = this.z * v.x - this.x * v.z;
        const z = this.x * v.y - this.y * v.x;
        return new Vector3(x, y, z);
    }
}

const SHOT_COOLDOWN = 20;
const MIN_KILLS_FOR_REWARD = 2;
const KILL_REWARD = "weapon_hegrenade";
const paintballTemplate = {
    impactTemplate: "@template_boom",
    ballTemplate: "@template_boom"
};

let cachedTemplates = {
    paintball: null,
    muzzle: null,
    lastCacheTime: 0
};

function getTemplate(name) {
    const currentTime = Instance.GetGameTime();
    if (currentTime - cachedTemplates.lastCacheTime > 30) {
        cachedTemplates.paintball = Instance.FindEntityByName(paintballTemplate.ballTemplate);
        cachedTemplates.muzzle = Instance.FindEntityByName("@template_boom2");
        cachedTemplates.lastCacheTime = currentTime;
    }
    return name === "paintball" ? cachedTemplates.paintball : cachedTemplates.muzzle;
}


// 监听武器开火事件
Instance.OnGunFire((event) => {
    const weapon = event.weapon;
    try {
        if (!weapon) {
            return;
        }
        
        const weaponData = typeof weapon.GetData === "function" ? weapon.GetData() : null;
        const weaponName = weaponData && typeof weaponData.GetName === "function" ? weaponData.GetName() : undefined;
        const owner = typeof weapon.GetOwner === "function" ? weapon.GetOwner() : null;
        if (!owner) {
            return;
        }
        
        const playerController = typeof owner.GetPlayerController === "function" ? owner.GetPlayerController() : null;
        if (!playerController) {
            return;
        }
        
        // 检查武器是否为AWP
        if (IsAWPWeapon(weaponName)) {
            const playerSlot = playerController.GetPlayerSlot();
            
            // 检查射击冷却
            if (CanPlayerShoot(playerSlot)) {
                CreatePaintball(owner);
                // 记录射击时间
                state.lastShotTime[playerSlot] = Instance.GetGameTime();
            }
        }
    } catch (error) {
        // 静默处理错误
    }
});

// 监听玩家击杀事件
Instance.OnPlayerKill((event) => {
    try {
        const victim = event.player;
        const attacker = event.attacker;
        
        if (!victim || !attacker) {
            return;
        }
        
        const victimController = victim.GetPlayerController();
        const attackerController = attacker.GetPlayerController();
        
        if (victimController && attackerController && 
            attacker.GetTeamNumber() !== victim.GetTeamNumber()) {
            const attackerSlot = attackerController.GetPlayerSlot();
            AddKill(attackerSlot);
        }
    } catch (error) {
        // 静默处理错误
    }
});

function GetKills(userId) {
    if (userId === undefined || !state.playerInfos[userId]) {
        return 0;
    }
    return state.playerInfos[userId].kills || 0;
}

function ResetKills(userId) {
    if (userId === undefined || !state.playerInfos[userId]) {
        return;
    }
    state.playerInfos[userId].kills = 0;
}

function AddKill(userId) {
    if (userId === undefined || !state.playerInfos[userId]) {
        state.playerInfos[userId] = {};
    }
    const oldKills = state.playerInfos[userId].kills || 0;
    state.playerInfos[userId].kills = oldKills + 1;
}

function GiveWeaponIfNotInInventory(player, weapon, autoDeploy) {
    if (!player.FindWeapon(weapon)) {
        player.GiveNamedItem(weapon, autoDeploy);
    }
}

Instance.OnRoundStart(() => {
    for (const player of Instance.FindEntitiesByClass("player")) {
        if (player && typeof player.IsValid === "function" && player.IsValid() && player.IsAlive()) {
            const pc = typeof player.GetPlayerController === "function" ? player.GetPlayerController() : null;
            const slot = pc && typeof pc.GetPlayerSlot === "function" ? pc.GetPlayerSlot() : undefined;
            if (GetKills(slot) >= MIN_KILLS_FOR_REWARD) {
                GiveWeaponIfNotInInventory(player, KILL_REWARD, false);
            }
            ResetKills(slot);
        }
    }
});

// 玩家断开连接事件
Instance.OnPlayerDisconnect((event) => {
    const playerSlot = event.playerSlot;
    delete state.playerInfos[playerSlot];
    delete state.lastShotTime[playerSlot];
});

Instance.OnScriptInput("test_boom", (inputData) => {
    const players = Instance.FindEntitiesByClass("player");
    if (players.length > 0) {
        const player = players[0];
        if (player && typeof player.IsValid === "function" && player.IsValid()) {
            CreatePaintball(player);
        }
    }
});

function IsAWPWeapon(weapon) {
    return weapon === "weapon_awp";
}

function AnglesToVector(angles) {
    const radYaw = angles.yaw / 180 * Math.PI;
    const radPitch = angles.pitch / 180 * Math.PI;
    return new Vector3(
        Math.cos(radYaw) * Math.cos(radPitch),
        Math.sin(radYaw) * Math.cos(radPitch),
        -Math.sin(radPitch)
    );
}

function VectorToAngles(forward) {
    let yaw;
    let pitch;
    
    if (forward.y === 0 && forward.x === 0) {
        yaw = 0;
        if (forward.z > 0) {
            pitch = 270;
        } else {
            pitch = 90;
        }
    } else {
        yaw = (Math.atan2(forward.y, forward.x) * 180 / Math.PI);
        if (yaw < 0) {
            yaw += 360;
        }

        const tmp = Math.sqrt(forward.x * forward.x + forward.y * forward.y);
        pitch = (Math.atan2(-forward.z, tmp) * 180 / Math.PI);
        if (pitch < 0) {
            pitch += 360;
        }
    }
    
    return {
        pitch: pitch,
        yaw: yaw,
        roll: 0
    };
}

function CanPlayerShoot(playerSlot) {
    if (!state.lastShotTime[playerSlot]) {
        return true; // 第一次射击
    }
    
    const currentTime = Instance.GetGameTime();
    const lastShot = state.lastShotTime[playerSlot];
    const timeSinceLastShot = currentTime - lastShot;
    
    return timeSinceLastShot >= SHOT_COOLDOWN;
}

function GetRemainingCooldown(playerSlot) {
    if (!state.lastShotTime[playerSlot]) {
        return 0;
    }
    
    const currentTime = Instance.GetGameTime();
    const lastShot = state.lastShotTime[playerSlot];
    const timeSinceLastShot = currentTime - lastShot;
    const remaining = SHOT_COOLDOWN - timeSinceLastShot;
    
    return Math.max(0, remaining);
}

function ApplySpreadToAngles(angles, maxChange) {
    const change = maxChange * Math.random();
    const t = Math.PI * Math.random() * 2;
    return {
        pitch: angles.pitch + Math.sin(t) * change,
        yaw: angles.yaw + Math.cos(t) * change,
        roll: angles.roll
    };
}

function CreatePaintball(player) {
    const eyePos = player.GetEyePosition();
    const eyeAngles = player.GetEyeAngles();
    const angles = ApplySpreadToAngles(eyeAngles, 1.5);
    const dir = AnglesToVector(angles);
    // 进行子弹追踪，找到射击目标点
    const traceResults = Instance.TraceBullet({
        start: eyePos,
        end: {
            x: eyePos.x + dir.x * 10000,
            y: eyePos.y + dir.y * 10000,
            z: eyePos.z + dir.z * 10000
        },
        shooter: player,
        damage: 100,
        rangeModifier: 0.99,
        penetration: 2.5
    });

    // 确定生成位置
    let impactPos;
    if (traceResults && traceResults.length > 0) {
        impactPos = traceResults[0].position;
    } else {
        impactPos = {
            x: eyePos.x + dir.x * 1000,
            y: eyePos.y + dir.y * 1000,
            z: eyePos.z + dir.z * 1000
        };
    }
    const muzzleTemplate = getTemplate("muzzle");
    if (muzzleTemplate && typeof muzzleTemplate.ForceSpawn === "function") {
        const muzzlePos = {
            x: eyePos.x + dir.x * 50,
            y: eyePos.y + dir.y * 50,
            z: eyePos.z + dir.z * 50
        };
        muzzleTemplate.ForceSpawn(muzzlePos, angles);
    }

    const templatePaintball = getTemplate("paintball");
    if (!templatePaintball || typeof templatePaintball.ForceSpawn !== "function") {
        return;
    }
    
    const entities = templatePaintball.ForceSpawn(impactPos, angles);
    if (!entities || entities.length === 0) {
        return;
    }

    // 设置爆炸实体自动删除
    for (const ent of entities) {
        Instance.EntFireAtTarget({ target: ent, input: "Kill", value: "", delay: 3.0 });
    }
}