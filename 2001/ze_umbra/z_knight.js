import { Instance } from "cs_script/point_script";

// ================= 配置 =================
const NPC_NAME_PREFIX = "knight_script";
const TICK = 0.1;
const AGGRO_RADIUS = 1248;
const MOVE_SPEED = 190;
const ENEMY_TEAM = 3; // 3=T 2=CT

// ================= 全局状态 =================
let self = null;
let model = null;
let hitbox = null;
let enemy = null;
let nextLookTime = 0;
let isActivated = false;
let isDead = false;

// ================= 工具 =================
function RandomFloat(min, max) {
    return min + Math.random() * (max - min);
}

const Vec = {
    len(v) { return Math.hypot(v.x, v.y, v.z); },
    sub(a, b) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; },
    add(a, b) { return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; },
    mul(v, s) { return { x: v.x * s, y: v.y * s, z: v.z * s }; },
    norm(v) {
        const l = this.len(v);
        return l < 0.001 ? { x:0,y:0,z:0 } : this.mul(v, 1/l);
    }
};

// ================= 查找NPC实体（支持后缀 _xxx） =================
function FindKnightNPC() {
    const list = Instance.FindEntitiesByName(NPC_NAME_PREFIX);
    for (const ent of list) {
        if (ent.IsValid() && ent.GetEntityName().startsWith(NPC_NAME_PREFIX)) {
            self = ent;
            Instance.Msg("[NPC] 成功锁定实体: " + ent.GetEntityName());
            return true;
        }
    }
    Instance.Msg("[NPC] 错误：未找到 knight_script 实体");
    return false;
}

// ==============================================
// 【核心】ACT 激活函数 —— 由 RunScriptInput ACT 调用
// ==============================================
function ACT() {
    if (isActivated) return;
    isActivated = true;

    Instance.Msg("[NPC] 收到 ACT 指令 → 开始激活");

    if (!FindKnightNPC()) return;

    // 强制物理移动设置（CS2必须）
    self.SetMoveType(2);
    self.SetCollisionGroup(1);
    self.SetSize({ x:-16, y:-16, z:0 }, { x:16, y:16, z:72 });

    // 获取模型与碰撞盒
    model = self.GetFirstChild();
    if (model) hitbox = model.GetFirstChild();

    // 启动逻辑循环
    Instance.SetThink(Think);
    Instance.SetNextThink(Instance.GetGameTime() + 0.1);
}

// ================= 主循环 =================
function Think() {
    if (!self || !self.IsValid() || !isActivated || isDead) {
        Instance.SetNextThink(Instance.GetGameTime() + TICK);
        return;
    }

    const now = Instance.GetGameTime();

    // 搜索敌人
    if (now > nextLookTime) {
        FindEnemy();
        nextLookTime = now + 1.5 + RandomFloat(0, 1);
    }

    // 移动
    if (enemy && enemy.IsValid() && enemy.GetHealth() > 0) {
        MoveToEnemy();
    } else {
        self.SetAbsVelocity({ x:0, y:0, z:self.GetAbsVelocity().z });
        if (model) Instance.EntFireAtTarget({ target:model, input:"SetAnimation", value:"idle" });
    }

    Instance.SetNextThink(now + TICK);
}

// ================= 搜索敌人 =================
function FindEnemy() {
    enemy = null;
    const myPos = self.GetAbsOrigin();
    const list = [];

    for (const ctrl of Instance.GetAllPlayerControllers()) {
        const pawn = ctrl.GetPlayerPawn();
        if (!pawn || !pawn.IsValid()) continue;

        if (pawn.GetTeamNumber() === ENEMY_TEAM && pawn.GetHealth() > 0) {
            const dist = Vec.len(Vec.sub(pawn.GetAbsOrigin(), myPos));
            if (dist <= AGGRO_RADIUS) list.push(pawn);
        }
    }

    if (list.length === 0) return;

    list.sort((a, b) => Vec.len(Vec.sub(a.GetAbsOrigin(), myPos)) - Vec.len(Vec.sub(b.GetAbsOrigin(), myPos)));
    enemy = list[0];
}

// ================= 移动 =================
function MoveToEnemy() {
    const pos = self.GetAbsOrigin();
    const tPos = enemy.GetAbsOrigin();

    let dir = Vec.sub(tPos, pos);
    dir.z = 0;
    dir = Vec.norm(dir);

    const vel = Vec.mul(dir, MOVE_SPEED);
    vel.z = self.GetAbsVelocity().z;

    self.SetAbsVelocity(vel);
    const yaw = Math.atan2(dir.y, dir.x) * 180 / Math.PI;
    self.SetAbsAngles({ pitch:0, yaw:yaw, roll:0 });

    if (model) Instance.EntFireAtTarget({ target:model, input:"SetAnimation", value:"RunF" });
}

// ================= 死亡 =================
function Death() {
    isDead = true;
    self.SetAbsVelocity({ x:0, y:0, z:0 });
    if (model) Instance.EntFireAtTarget({ target:model, input:"SetAnimation", value:"Death" });

    Instance.SetThink(() => {
        if (model) model.Kill();
        self.Kill();
    });
    Instance.SetNextThink(Instance.GetGameTime() + 4);
}

// ================= 触发绑定（必须） =================
Instance.OnActivate(() => {
    Instance.Msg("[NPC] 脚本已加载 → 等待 RunScriptInput ACT");
});

// 监听伤害死亡
Instance.OnModifyPlayerDamage((e) => {
    if (self && e.player === self && self.GetHealth() - e.damage <= 0) Death();
});