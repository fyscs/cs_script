import { CSGearSlot, CSPlayerController, CSPlayerPawn, Instance, PointTemplate } from "cs_script/point_script";
/** Author: Theordinary
 * Create Time:2026/1/19
 * 起源2基于JavaScript的boss追踪功能,提供一定程度上的自由配置
 * Version 1.2 Update 2026/2/15
 * 此脚本可供任意地图作者使用
 */

const Server_tickrate = 64;
const Server_tickInterval = 1 / Server_tickrate;
const MIN_THINK_INTERVAL = 0.1;
const MAX_TURN_RATE = 360;
//脚本常规配置
const boss_track_team = 3;//boss锁定玩家阵营,3为ct,2为t
const boss_hp_add = 100;//boss动态血量,乘以人数后累加至血量中
const boss_script = "boss1_script";//boss脚本实体targetname配置
const boss_template_targetname = "boss1_template";//boss模板实体targetname配置
const boss_position_targetname = "boss_spawn_point";//boss生成位置targetname配置
const boss_phys_targetname = "Stage2_Boss";//boss物理碰撞实体的targetname配置
const boss_hpbar_targetname = "boss_hp_text_1";//boss血条实体的targetname配置
const boss_model_targetname = "Stage2_Boss_Model";//boss模型的targetname配置
const boss_track_traget_boolean = true;//boss锁定目标显示开关,若不需要改为false
const boss_death_animation_boolean = false;//boss是否启用死亡动画,若启用则需要配置下方动画输出
const boss_death_animation = "";//boss死亡动画名称,对应模型编辑器内的动作名字,未启用死亡动画则不用管
const boss_death_animation_delay = 0;//boss死亡动画播放延迟,未启用死亡动画则不用管
const config = {
    acceleration: 100,//加速度
    maxspeed: 325,//最大速度
    health: 250,//初始血量
    position: null,
    template: null,
    rotabase: 1,//转向速度
    hatred: 4,//仇恨时间,自动更换目标所需的时间
    Buffer: 1//boss靠近减速距离
};//boss配置

//-------------------------------工具函数-----------------------------

//计算两点距离
/**
 * 
 * @param {Vector} start 出发点
 * @param {Vector} end 结束点
 */

function CalculateDistanceBetween(start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dz = end.z - start.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return distance;
}
//根据实体视线计算方向向量
/**
 * 
 * @param {QAngle} angle 实体角度
 * 
 */

function CalculateViewtoVector(angles) {
    const pitchRad = angles.pitch * (Math.PI / 180);
    const yawRad = angles.yaw * (Math.PI / 180);
    let x = Math.cos(yawRad) * Math.cos(pitchRad);
    let y = Math.sin(yawRad) * Math.cos(pitchRad);
    let z = -Math.sin(pitchRad);
    return { x: x, y: y, z: z };
}

//计算本体到目标的方向向量,并转化为欧拉角
/**
 * 
 * @param {Vector} self 要设置角度的实体
 * @param {Vector} target 目标实体
 */

function CalculateQangleFromTarget(self, target) {
    const selfpos = self?.GetAbsOrigin();
    const targetpos = target?.GetAbsOrigin();
    const dirVector = { x: targetpos.x - selfpos.x, y: targetpos.y - selfpos.y, z: targetpos.z - selfpos.z };//计算向量
    const xylen = Math.sqrt(dirVector.x * dirVector.x + dirVector.y * dirVector.y);
    let pitch = 0;
    let yaw = 0;
    const roll = 0;
    if (xylen > 0.001) {
        pitch = -Math.atan2(dirVector.z, xylen) * (180 / Math.PI);
    }
    else {
        pitch = dirVector.z > 0 ? -90 : 90;
    }
    yaw = Math.atan2(dirVector.y, dirVector.x) * (180 / Math.PI);
    return { pitch: pitch, yaw: yaw, roll: roll };
}

//向量相加
/**
 * 
 * @param {Vector} vec1 向量1
 * @param {Vector} vec2 向量2
 */
function VectorAdd(vec1, vec2) {
    return { x: vec1.x + vec2.x, y: vec1.y + vec2.y, z: vec1.z + vec2.z };
}

function ClampNumber(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function NormalizeYawDelta(delta) {
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;
    return delta;
}

function ApproachYaw(current, target, step) {
    const delta = NormalizeYawDelta(target - current);
    if (Math.abs(delta) <= step) return target;
    return current + Math.sign(delta) * step;
}

function BuildVelocityFromSpeed(angles, speed, maxspeed) {
    const speed_vector = CalculateViewtoVector(angles);
    const safeSpeed = ClampNumber(speed, 0, maxspeed);
    return { x: speed_vector.x * safeSpeed, y: speed_vector.y * safeSpeed, z: 0 };
}

//计算安全的时间延迟
/**
 * 
 * @param {Number} delay 预输入延迟
 * 
 */
function AligntimeToTickrate(delay) {
    const safeDelay = Math.max(delay, MIN_THINK_INTERVAL);
    const delayTicks = Math.ceil(safeDelay / Server_tickInterval);
    return Math.max(MIN_THINK_INTERVAL, delayTicks * Server_tickInterval);
}


//---------------boss类--------------------------
class BossMain {
    /**
     * @param {Object} config boss配置
     * @param {Number} config.maxspeed boss最大速度
     * @param {Number} config.health boss基础血量
     * @param {Vector} config.position boss生成位置
     * @param {Object} config.template boss生成模板类
     * @param {Number} config.radius boss最大索敌半径
     * @param {Number} config.rotabase boss转向速度(0,1]越大转向越快
     * @param {Number} config.acceleration boss加速度
     * @param {Number} config.hatred boss仇恨时间
     * @param {Number} config.Buffer boss靠近减速距离
     */
    constructor(config) {
        this.maxspeed = config.maxspeed;
        this.health = config.health;
        this.position = config.position;
        this.template = config.template;
        this.rotabase = config.rotabase;
        this.acceleration = config.acceleration;
        this.hatred = config.hatred;
        this.Buffer = config.Buffer;
        this.hatetime = 0;//动态存储仇恨时间,当到达仇恨时间时自动情况并变换target
        this.velocity = { x: 0, y: 0, z: 0 };//boss速度,Vector
        this.speed = 0;//boss速度,Numberm
        this.target = null;//boss锁定目标
        this.isActive = false;//boss追踪布尔值
        this.phy = null;//为boss物理实体创建变量
        this.hpbar = null;//为boss血条血量显m示创建变量
        this.model = null;//为boss模型创建变量
        this.strafe = false;//boss是否处于加速状态
        this.slow = false;//boss是否处于减速状态
    }
    boss_init() {
        const EntityArray = this.template?.ForceSpawn(this.position);//在目标点位生成模板,并储存模板实体到数组
        for (let raw in EntityArray) {
            if (EntityArray[raw]?.GetEntityName() == boss_phys_targetname && EntityArray[raw]?.IsValid()) { this.phy = EntityArray[raw] };
            if (EntityArray[raw]?.GetEntityName() == boss_hpbar_targetname && EntityArray[raw]?.IsValid()) { this.hpbar = EntityArray[raw] };
            if (EntityArray[raw]?.GetEntityName() == boss_model_targetname && EntityArray[raw]?.IsValid()) { this.model = EntityArray[raw] };
        }
        let TargetArray = Instance.FindEntitiesByClass("player");
        let enemy = [];//筛选符合索敌阵营的玩家
        for (let player in TargetArray) {
            if (TargetArray[player]?.GetTeamNumber() == boss_track_team) { enemy.push(TargetArray[player]) };
        }
        if (enemy.length > 0) {
            this.target = enemy[Math.floor(Math.random() * enemy.length)];//随机锁定一名玩家作为初始目标
            this.health += boss_hp_add * enemy.length;//根据玩家累加血量
            Instance.EntFireAtTarget({ target: this.phy, input: "SetHealth", value: 999999999 });//初始化phybox血量,避免被打爆
            if (boss_track_traget_boolean) { Instance.EntFireAtTarget({ target: this.hpbar, input: "SetMessage", value: "HP:" + this.health + "\n" + this.target?.GetPlayerController()?.GetPlayerName() }) }//初始化hpbar值
            else (Instance.EntFireAtTarget({ target: this.hpbar, input: "SetMessage", value: "HP:" + this.health }));
        }
        else {
            this.isActive = false;
        }
        Timer.startthink();
        Queue_pause = false;
    }
    target_change() {
        if (!this.phy?.IsValid() || this.health == 0 || this.hatetime < this.hatred) return;
        this.hatetime = 0;//重置仇恨时间
        let TargetArray = Instance.FindEntitiesByClass("player");
        let enemy = [];//筛选符合索敌阵营的玩家
        for (let player of TargetArray) {
            if (player?.GetTeamNumber() == boss_track_team) { enemy.push(player) };
        }
        if (enemy.length > 0) {
            this.target = enemy[Math.floor(Math.random() * enemy.length)];//随机锁定一名玩家
            this.isActive = true;
        }
        else {
            this.isActive = false;//没有符合目标玩家时停止追逐
        }
    }
    dynamic_track(deltaTime = MIN_THINK_INTERVAL) {
        if (!this.isActive || !this.phy?.IsValid() || this.health == 0) return;
        if (!this.target?.IsValid()) { this.hatetime = config.hatred; this.target_change(); return };
        let angle_pre = CalculateQangleFromTarget(this.phy, this.target);//计算面向目标实体的角度
        angle_pre.pitch = 0;//仅保留水平方向角度
        angle_pre.roll = 0;
        let angle = this.phy?.GetAbsAngles()//获取phy当前角度
        angle.pitch = 0;
        angle.roll = 0;
        const yawStep = MAX_TURN_RATE * deltaTime * ClampNumber(this.rotabase, 0.1, 1);
        angle.yaw = ApproachYaw(angle.yaw, angle_pre.yaw, yawStep);
        this.phy.Teleport({ angles: angle });
        this.velocity = this.phy?.GetAbsVelocity();//获取phy当前速度
        const distance = CalculateDistanceBetween(this.phy?.GetAbsOrigin(), this.target?.GetAbsOrigin());//计算boss与玩家的距离
        if (distance >= 1000) this.strafe = true, this.slow = false;
        else if (distance < 1000 && distance >= this.Buffer) this.strafe = true, this.slow = true;
        else if (distance < this.Buffer && this.speed != 0) this.strafe = false, this.slow = true;
        else if (distance < this.Buffer && this.speed == 0) this.strafe = true, this.slow = true;
        if (this.strafe == true) {
            if (this.slow == true) {
                this.speed += (this.acceleration / 2) * deltaTime * 10;
                this.speed = ClampNumber(this.speed, 0, this.maxspeed);
                this.velocity = BuildVelocityFromSpeed(this.phy?.GetAbsAngles(), this.speed, this.maxspeed);
                this.phy.Teleport({ velocity: this.velocity });
                return;
            }
            if (this.slow == false) {
                this.speed += this.acceleration * deltaTime * 10;
                this.speed = ClampNumber(this.speed, 0, this.maxspeed);
                this.velocity = BuildVelocityFromSpeed(this.phy?.GetAbsAngles(), this.speed, this.maxspeed);
                this.phy.Teleport({ velocity: this.velocity });
                return;
            }
        }
        if (this.strafe == false) {
            if (this.slow == true) {
                this.speed -= this.acceleration * deltaTime * 10;
                this.speed = ClampNumber(this.speed, 0, this.maxspeed);
                this.velocity = BuildVelocityFromSpeed(this.phy?.GetAbsAngles(), this.speed, this.maxspeed);
                this.phy.Teleport({ velocity: this.velocity });
                return;
            }
        }
    }
    boss_statue_check() {
        if (!this.phy?.IsValid() || this.health <= 0) { this.boss_death(); return };
        if (this.target === null) return;
        if (boss_track_traget_boolean && this.target.IsValid()) { Instance.EntFireAtTarget({ target: this.hpbar, input: "SetMessage", value: "HP:" + this.health + "\n" + this.target?.GetPlayerController()?.GetPlayerName() }) }//初始化hpbar值
        else if (boss_track_traget_boolean && !this.target.IsValid()) { Instance.EntFireAtTarget({ target: this.hpbar, input: "SetMessage", value: "HP:" + this.health + "\n" + "NoTarget" }) }
        else if (!boss_track_traget_boolean) (Instance.EntFireAtTarget({ target: this.hpbar, input: "SetMessage", value: "HP:" + this.health }));
    }
    boss_death() {
        if (Queue_pause) return;
        if (!boss_death_animation_boolean) {
            this.isActive = false;
            this.phy?.Remove();
            this.hpbar?.Remove();
            this.model?.Remove();
            Queue_pause = true;//终止循环
            Instance.EntFireAtName({ name: "stage2_boss_ed", input: "Trigger" });
            
            return;
        }
        else {
            this.isActive = false;
            this.hpbar?.Remove();
            Queue_pause = true;//终止循环
            Instance.EntFireAtTarget({ target: this.model, input: "SetIdleAnimationNotLooping", value: boss_death_animation, delay: boss_death_animation_delay });
            Instance.EntFireAtTarget({ target: this.model, input: "SetAnimationNoResetNotLooping", value: boss_death_animation, delay: boss_death_animation_delay });
            Instance.EntFireAtName({ name: "stage2_boss_ed", input: "Trigger" });
        }
    }
    boss_clear() {
        if (this.phy?.IsValid()) this.phy.Remove();
        if (this.hpbar?.IsValid()) this.hpbar.Remove();
        if (this.model?.IsValid()) this.model.Remove();
        deafult_boss = null;
        Timer = null;
    }
}

//-------------------循环类--------------------
class QueueMain {
    constructor() {
        this.delay = AligntimeToTickrate(MIN_THINK_INTERVAL);
        this.started = false;
    }
    startthink() {
        if (this.started) return;
        this.started = true;
        Instance.SetThink(() => {
            if (Queue_pause || !deafult_boss?.phy?.IsValid()) { this.started = false; return; }
            deafult_boss.hatetime += this.delay;
            deafult_boss.target_change();
            deafult_boss.boss_statue_check();
            deafult_boss.dynamic_track(this.delay);
            Instance.SetNextThink(Instance.GetGameTime() + this.delay);
        })
        Instance.SetNextThink(Instance.GetGameTime() + this.delay);
    }
}

let deafult_boss = null;
let Timer = null;
let Queue_pause = false;

//-------------------操作区--------------------

//初始化boss
Instance.OnActivate(() => {
    const template = Instance.FindEntityByName(boss_template_targetname);
    const position = Instance.FindEntityByName(boss_position_targetname)?.GetAbsOrigin();
    config.template = template;
    config.position = position;
    deafult_boss = new BossMain(config);
    Timer = new QueueMain();
    deafult_boss.boss_init();
})

//boss血量减少函数,同上对脚本进行输出,参数栏填写boss_hp_subract
Instance.OnScriptInput("boss_hp_subract", (inputData) => { if (deafult_boss && !Queue_pause) deafult_boss.health-- });

//强制处死boss,同上对脚本进行输出,参数栏填写boss_death
Instance.OnScriptInput("boss_death", (inputData) => {
    if (deafult_boss) deafult_boss.boss_death();
})

//关闭boss移动,同上对脚本进行输出,参数栏填写boss_freeze
Instance.OnScriptInput("boss_freeze", (inputData) => {
    if (deafult_boss) deafult_boss.isActive = false;
})

//恢复boss移动,同上对脚本进行输出,参数栏填写boss_unfreeze
Instance.OnScriptInput("boss_unfreeze", (inputData) => {
    if (deafult_boss && !Queue_pause) deafult_boss.isActive = true;
})

Instance.OnRoundEnd((event) => {
    if (deafult_boss) deafult_boss.boss_clear();
    Queue_pause = true;
    deafult_boss = null;
    Timer = null;
    Instance.EntFireAtName({ name: boss_script, input: "kill" });
})

Instance.OnRoundStart((event) => {
    if (deafult_boss) deafult_boss.boss_clear();
    Queue_pause = true;
    deafult_boss = null;
    Timer = null;
    Instance.EntFireAtName({ name: boss_script, input: "kill" });
})
