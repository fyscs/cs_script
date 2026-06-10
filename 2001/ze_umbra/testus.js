import { Instance } from "cs_script/point_script";

// 配置
const TRACK_CONFIG = {
    trackRadius: 1500,
    updateInterval: 0.1,
    moveSpeed: 6,
    debugColor: { r: 255, g: 0, b: 0, a: 255 },
    npcNamePrefix: "tracker_npc", // 只需要前缀！不管后缀
};

// 现在存储【所有NPC】，而不是单个
let allTrackerNpcs = [];
let currentTargetPlayer = null;

// 初始化：查找所有 以 tracker_npc 开头的实体（支持后缀 _xxx）
function initAllTrackers() {
    allTrackerNpcs = [];

    // 遍历全图实体，匹配名字前缀
    const allEntities = Instance.FindAllEntities();
    for (const ent of allEntities) {
        if (!ent || !ent.IsValid()) continue;
        const name = ent.GetName() || "";

        // 关键：只要名字开头是 tracker_npc 就捕获
        if (name.startsWith(TRACK_CONFIG.npcNamePrefix)) {
            allTrackerNpcs.push(ent);
        }
    }

    Instance.Msg(`[追踪NPC] 找到 ${allTrackerNpcs.length} 个动态NPC\n`);
    return allTrackerNpcs.length > 0;
}

// 获取最近玩家
function getNearestPlayer() {
    const allPlayers = Instance.GetAllPlayerControllers();
    let nearest = null;
    let minDist = TRACK_CONFIG.trackRadius;

    for (const controller of allPlayers) {
        if (!controller?.IsConnected()) continue;
        const pawn = controller.GetPlayerPawn();
        if (!pawn?.IsValid() || !pawn.IsAlive()) continue;

        nearest = pawn;
        break;
    }
    return nearest;
}

// 移动单个NPC到目标
function moveNpcToPlayer(npc, target) {
    if (!npc || !npc.IsValid() || !target) return;

    const npcPos = npc.GetAbsOrigin();
    const targetPos = target.GetAbsOrigin();

    // 计算方向
    const deltaX = targetPos.x - npcPos.x;
    const deltaY = targetPos.y - npcPos.y;
    const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (dist < 10) return; // 太近不移动

    // 单位方向
    const dirX = deltaX / dist;
    const dirY = deltaY / dist;

    // 新位置
    const newPos = {
        x: npcPos.x + dirX * TRACK_CONFIG.moveSpeed,
        y: npcPos.y + dirY * TRACK_CONFIG.moveSpeed,
        z: npcPos.z,
    };

    // 朝向
    const yaw = Math.atan2(dirY, dirX) * (180 / Math.PI);

    // 移动 + 转向
    npc.Teleport({
        origin: newPos,
        angles: { pitch: 0, yaw: yaw, roll: 0 },
    });
}

// 主循环：控制所有NPC
function trackLoop() {
    currentTargetPlayer = getNearestPlayer();
    if (!currentTargetPlayer) return;

    // 移动每一个动态生成的NPC
    for (const npc of allTrackerNpcs) {
        if (npc.IsValid()) {
            moveNpcToPlayer(npc, currentTargetPlayer);
        }
    }

    Instance.SetNextThink(Instance.GetGameTime() + TRACK_CONFIG.updateInterval);
    Instance.SetThink(trackLoop);
}

// 入口
function main() {
    initAllTrackers();
    trackLoop();
}

// 激活启动
Instance.OnActivate(() => {
    Instance.Msg("[追踪NPC] 已激活 -> 支持动态后缀NPC\n");
    main();
});

// 安全重载
Instance.OnScriptReload({
    before: () => ({}),
    after: () => main(),
});