import { CSPlayerPawn, Entity, Instance, PointTemplate } from "cs_script/point_script";

//by 凯岩城的狼
const state = {
    playerInfos: {},
    lastShotTime: {} // 记录每个玩家的最后射击时间
};

class Vector3
{
    constructor(x, y, z)
    {
        if (y == undefined && z == undefined)
        {
            this.x = x.x;
            this.y = x.y;
            this.z = x.z;
        }
        else
        {
            this.x = x;
            this.y = y;
            this.z = z;
        }
    }

    Inverse()
    {
        return new Vector3(1 / this.x, 1 / this.y, 1 / this.z);
    }

    Length()
    {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    LengthSq()
    {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    Normalized()
    {
        const len = this.Length();
        return new Vector3(this.x / len, this.y / len, this.z / len);
    }

    Add(vector)
    {
        return new Vector3(this.x + vector.x, this.y + vector.y, this.z + vector.z);
    }

    Subtract(vector)
    {
        return new Vector3(this.x - vector.x, this.y - vector.y, this.z - vector.z);
    }

    Divide(vector)
    {
        return new Vector3(this.x / vector.x, this.y / vector.y, this.z / vector.z);
    }

    Multiply(vector)
    {
        return new Vector3(this.x * vector.x, this.y * vector.y, this.z * vector.z);
    }

    MultiplyScalar(v)
    {
        return new Vector3(this.x * v, this.y * v, this.z * v);
    }

    Cross(v)
    {
        const x = this.y*v.z - this.z*v.y;
        const y = this.z*v.x - this.x*v.z;
        const z = this.x*v.y - this.y*v.x;
        return new Vector3(x, y, z);
    }
}

let templatePaintball = null;

const PAINTBALL_SPAWN_DISTANCE = 10;
const PAINTBALL_FORCE = 1700;
const PAINTBALL_FORCE_PLAYER_FACTOR = 0.3;


// 射击冷却配置
const SHOT_COOLDOWN = 20; // 20秒冷却时间

const MIN_KILLS_FOR_REWARD = 2;
const KILL_REWARD = "weapon_hegrenade";


const UP = new Vector3(0, 0, 1);

// 模板配置
const paintballTemplate = {
    impactTemplate: "@template_boom",
    ballTemplate: "@template_boom"
}


// 监听武器开火事件
Instance.OnGunFire((event) => {
    const weapon = event.weapon;
    try {
        if (!weapon) {
            return;
        }
        
        const weaponName = weapon.GetData()?.GetName();
        const owner = weapon.GetOwner();
        if (!owner) {
            return;
        }
        
        const playerController = owner.GetPlayerController();
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
                state.lastShotTime[playerSlot] = Date.now() / 1000;
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


function GetKills(userId)
{
    if (userId === undefined || !state.playerInfos[userId])
    {
        return 0;
    }
    return state.playerInfos[userId].kills || 0;
}

function ResetKills(userId)
{
    if (userId === undefined || !state.playerInfos[userId])
    {
        return;
    }
    state.playerInfos[userId].kills = 0;
}

function AddKill(userId)
{
    if (userId === undefined || !state.playerInfos[userId])
    {
        state.playerInfos[userId] = {};
    }
    const oldKills = state.playerInfos[userId].kills || 0;
    state.playerInfos[userId].kills = oldKills + 1;
}

function GiveWeaponIfNotInInventory(player, weapon, autoDeploy)
{
    if (!player.FindWeapon(weapon))
    {
        player.GiveNamedItem(weapon, autoDeploy);
    }
}

// 回合开始事件 
Instance.OnRoundStart(() => {
    Instance.SetNextThink(0.001);

    for (const player of Instance.FindEntitiesByClass("player"))
    {
        if (player?.IsValid() && player.IsAlive())
        {
            const slot = player.GetPlayerController()?.GetPlayerSlot();
            if (GetKills(slot) >= MIN_KILLS_FOR_REWARD)
            {
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

// 手动测试输入
Instance.OnScriptInput("test_boom", (inputData) => {
    const players = Instance.FindEntitiesByClass("player");
    if (players.length > 0) {
        const player = players[0];
        if (player && player.IsValid()) {
            CreatePaintball(player);
        }
    }
});

Instance.OnActivate(() => {
    Init();
});
Instance.OnScriptReload({
    after: () => {
        Init();
    }
});

// 检查是否为AWP狙击步枪
function IsAWPWeapon(weapon)
{
    switch (weapon)
    {
        case "weapon_awp":
            return true;
    }
    return false;
}


function Init()
{
    Instance.SetNextThink(0.001);
}

function AnglesToVector(angles)
{
    const radYaw = angles.yaw / 180 * Math.PI;
    const radPitch = angles.pitch / 180 * Math.PI;
    return new Vector3(
        Math.cos(radYaw) * Math.cos(radPitch),
        Math.sin(radYaw) * Math.cos(radPitch),
        -Math.sin(radPitch)
    );
}

function VectorToAngles(forward)
{
    let yaw;
    let pitch;
    
    if (forward.y == 0 && forward.x == 0)
    {
        yaw = 0;
        if (forward.z > 0)
            pitch = 270;
        else
            pitch = 90;
    }
    else
    {
        yaw = (Math.atan2(forward.y, forward.x) * 180 / Math.PI);
        if (yaw < 0)
            yaw += 360;

        let tmp = Math.sqrt(forward.x*forward.x + forward.y*forward.y);
        pitch = (Math.atan2(-forward.z, tmp) * 180 / Math.PI);
        if (pitch < 0)
            pitch += 360;
    }
    
    return {
        pitch: pitch,
        yaw: yaw,
        roll: 0
    }
}

function VectorLength(vector)
{
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
}

function NormalizeVector(vector)
{
    const len = VectorLength(vector);
    return {
        x: vector.x / len,
        y: vector.y / len,
        z: vector.z / len
    }
}

function TeamIdToName(team)
{
    return team == 3 ? "ct" : "t";
}

function GetPaintballTemplate()
{
    return paintballTemplate;
}

function CanPlayerShoot(playerSlot)
{
    if (!state.lastShotTime[playerSlot])
    {
        return true; // 第一次射击
    }
    
    const currentTime = Date.now() / 1000;
    const lastShot = state.lastShotTime[playerSlot];
    const timeSinceLastShot = currentTime - lastShot;
    
    return timeSinceLastShot >= SHOT_COOLDOWN;
}

function GetRemainingCooldown(playerSlot)
{
    if (!state.lastShotTime[playerSlot])
    {
        return 0;
    }
    
    const currentTime = Date.now() / 1000;
    const lastShot = state.lastShotTime[playerSlot];
    const timeSinceLastShot = currentTime - lastShot;
    const remaining = SHOT_COOLDOWN - timeSinceLastShot;
    
    return Math.max(0, remaining);
}

function ApplySpreadToAngles(angles, maxChange)
{
    const change = maxChange * Math.random();
    const t = Math.PI * Math.random() * 2;
    return {
        pitch: angles.pitch + Math.sin(t) * change,
        yaw: angles.yaw + Math.cos(t) * change,
        roll: angles.roll
    }
}

function CreatePaintball(player)
{
    const eyePos = player.GetEyePosition();
    const eyeAngles = player.GetEyeAngles();
    const angles = ApplySpreadToAngles(eyeAngles, 1.5);
    const dir = AnglesToVector(angles);

    const selectedTemplate = GetPaintballTemplate();

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
    let hitPlayer = null;
    let hitGroup = null;
    
    if (traceResults && traceResults.length > 0) {
        // 使用第一个命中结果的位置
        const firstHit = traceResults[0];
        impactPos = firstHit.position;
        hitPlayer = firstHit.hitEntity;
        hitGroup = firstHit.hitGroup;
        
        // 检查是否击中玩家
        if (hitPlayer && hitPlayer.GetClassName() === "player") {
            // 击中玩家处理逻辑
        }
    } else {
        // 如果没有击中任何东西，在最大距离处生成
        impactPos = {
            x: eyePos.x + dir.x * 1000,
            y: eyePos.y + dir.y * 1000,
            z: eyePos.z + dir.z * 1000
        };
    }


    // 在枪口位置生成 @template_boom2
    const muzzleTemplate = Instance.FindEntityByName("@template_boom2");
    if (muzzleTemplate) {
        const muzzlePos = {
            x: eyePos.x + dir.x * 50,  // 枪口位置，稍微向前一点
            y: eyePos.y + dir.y * 50,
            z: eyePos.z + dir.z * 50
        };
        muzzleTemplate.ForceSpawn(muzzlePos, angles);
    }

    // 在射击目标点生成爆炸效果
    templatePaintball = Instance.FindEntityByName(selectedTemplate.ballTemplate);
    if (!templatePaintball) {
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

function ScriptThink()
{
    Instance.SetNextThink(0.001);
    
}





// 设置思考函数
Instance.SetThink(ScriptThink);
Instance.SetNextThink(0.1);

