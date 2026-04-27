import { Instance } from "cs_script/point_script";

/* ===================== 配置 ===================== */
const CONFIG = {
    moveDamagePerSecond: 1,
    idleHealPerSecond: 2,
    checkInterval: 0.3,
    disabledInterval: 2.0,      // 关闭状态下降频
    maxHealth: 125,
    minMoveSpeed: 100.0
};

const MOVE_THRESHOLD_SQ =
    (CONFIG.minMoveSpeed * CONFIG.checkInterval) *
    (CONFIG.minMoveSpeed * CONFIG.checkInterval);

/* ===================== 状态 ===================== */
let ENABLED = false;
const lastPositions = new Map();

/* ===================== Script Input ===================== */
Instance.OnScriptInput("enable", () => {
    ENABLED = true;
});

Instance.OnScriptInput("disable", () => {
    ENABLED = false;
    lastPositions.clear();
});

/* ===================== 主循环 ===================== */
function think() {
    const now = Instance.GetGameTime();

    if (!ENABLED) {
        Instance.SetNextThink(now + CONFIG.disabledInterval);
        return;
    }

    for (let slot = 0; slot < 32; slot++) {
        const controller = Instance.GetPlayerController(slot);
        if (!controller || !controller.IsValid() || !controller.IsConnected()) {
            continue;
        }

        const pawn = controller.GetPlayerPawn();
        if (!pawn || !pawn.IsValid() || !pawn.IsAlive()) {
            continue;
        }

        const currentPos = pawn.GetAbsOrigin();
        const lastPos = lastPositions.get(slot);

        if (!lastPos) {
            lastPositions.set(slot, currentPos);
            continue;
        }

        const dx = currentPos.x - lastPos.x;
        const dy = currentPos.y - lastPos.y;
        const dz = currentPos.z - lastPos.z;

        const distSq = dx * dx + dy * dy + dz * dz;
        const isMoving = distSq > MOVE_THRESHOLD_SQ;

        if (isMoving) {
            damageWithIOKill(pawn);
        } else {
            heal(pawn);
        }

        lastPositions.set(slot, currentPos);
    }

    Instance.SetNextThink(now + CONFIG.checkInterval);
}

/* ===================== 行为函数 ===================== */
function damageWithIOKill(pawn) {
    const hp = pawn.GetHealth();
    if (hp <= 0) return;

    const nextHp = hp - CONFIG.moveDamagePerSecond;

    if (nextHp <= 0) {
        Instance.EntFireAtTarget({
            target: pawn,
            input: "SetHealth",
            value: "-1"
        });
        return;
    }

    pawn.SetHealth(nextHp);
}

function heal(pawn) {
    const hp = pawn.GetHealth();
    if (hp <= 0 || hp >= CONFIG.maxHealth) return;

    pawn.SetHealth(hp + CONFIG.idleHealPerSecond);
}

/* ===================== 启动 ===================== */
Instance.SetThink(think);
Instance.SetNextThink(Instance.GetGameTime());
