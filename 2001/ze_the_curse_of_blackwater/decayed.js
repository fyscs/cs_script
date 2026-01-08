import { Instance } from "cs_script/point_script";

/* ================= 配置 ================= */

const CFG = {
    BASE_NAME: "decayed_ct",
    RADIUS: 2048,
    COOLDOWN: 0.5,
    TARGET_CONTEXT_TIME: 8,
    TARGET_EYE_Z: 70,
    AUTO_ACTIVE: true
};

/* ================= 状态 ================= */

const S = {
    active: false,
    suffix: "",
    target: null,
    lastFire: 0,
    targetPlayer: null,
    contextTimer: null
};

/* ================= 工具 ================= */

const now = () => Instance.GetGameTime();

function extractSuffix(name) {
    const i = name.lastIndexOf("_");
    return i !== -1 ? name.slice(i + 1) : "";
}

function targetName() {
    return S.suffix ? `${CFG.BASE_NAME}_${S.suffix}` : CFG.BASE_NAME;
}

function findTarget() {
    S.target = Instance.FindEntityByName(targetName());
    return S.target && S.target.IsValid();
}

function getTargetEyePos(ent) {
    const o = ent.GetAbsOrigin();
    return { x: o.x, y: o.y, z: o.z + CFG.TARGET_EYE_Z };
}

function forEachCTPlayer(fn) {
    for (let i = 0; i < 64; i++) {
        const c = Instance.GetPlayerController(i);
        if (!c || !c.IsConnected()) continue;
        const p = c.GetPlayerPawn();
        if (!p || !p.IsValid()) continue;
        if (p.GetTeamNumber() !== 3) continue;
        if (!p.IsAlive()) continue;
        fn(p);
    }
}

function visibleCTPlayers() {
    if (!S.target || !S.target.IsValid()) return [];

    const res = [];
    const tgtPos = getTargetEyePos(S.target);

    forEachCTPlayer(p => {
        const eye = p.GetEyePosition();
        const dx = eye.x - tgtPos.x;
        const dy = eye.y - tgtPos.y;
        const dz = eye.z - tgtPos.z;

        if (dx*dx + dy*dy + dz*dz > CFG.RADIUS*CFG.RADIUS) return;

        const tr = Instance.TraceLine({
            start: eye,
            end: tgtPos,
            ignoreEntity: [p, S.target],
            ignorePlayers: true
        });

        if (tr.fraction === 1) res.push(p);
    });

    return res;
}

function setTargetContext(p) {
    clearTargetContext();

    Instance.EntFireAtTarget({
        target: p,
        input: "addcontext",
        value: "target:1"
    });

    S.targetPlayer = p;
    S.contextTimer = setTimeout(clearTargetContext, CFG.TARGET_CONTEXT_TIME * 1000);
}

function clearTargetContext() {
    if (S.targetPlayer && S.targetPlayer.IsValid()) {
        Instance.EntFireAtTarget({
            target: S.targetPlayer,
            input: "removecontext",
            value: "target"
        });
    }
    S.targetPlayer = null;
    if (S.contextTimer) clearTimeout(S.contextTimer);
    S.contextTimer = null;
}

/* ================= 核心逻辑 ================= */

function fireIfVisible() {
    if (!S.active) return;
    if (!S.target || !S.target.IsValid()) {
        if (!findTarget()) return;
    }
    if (now() - S.lastFire < CFG.COOLDOWN) return;

    for (const p of visibleCTPlayers()) {
        Instance.EntFireAtTarget({
            target: S.target,
            input: "FireUser1",
            activator: p,
            caller: p
        });
        S.lastFire = now();
        break;
    }
}

function pickRandomTarget() {
    const list = visibleCTPlayers();
    if (!list.length) return;
    setTargetContext(list[Math.floor(Math.random() * list.length)]);
}

/* ================= 输入 ================= */

Instance.OnScriptInput("Activate", d => {
    if (d.caller) S.suffix = extractSuffix(d.caller.GetEntityName());
    S.active = findTarget();
});

Instance.OnScriptInput("Deactivate", () => {
    S.active = false;
    clearTargetContext();
});

Instance.OnScriptInput("CheckNow", fireIfVisible);
Instance.OnScriptInput("Findtarget", pickRandomTarget);

/* ================= 事件 ================= */

Instance.OnPlayerDisconnect(e => {
    if (!S.targetPlayer) return;
    const c = S.targetPlayer.GetPlayerController();
    if (c && c.GetPlayerSlot() === e.playerSlot) clearTargetContext();
});

Instance.OnActivate(() => {
    if (CFG.AUTO_ACTIVE) {
        Instance.SetNextThink(now() + 1);
        Instance.SetThink(() => Instance.OnScriptInput("Activate", {}));
    }
});
