import { Instance } from "cs_script/point_script";

// ===== State Management =====
const BossState = {
    health: 300.0,
    isKilled: false,
    isTicking: false,
    lastHpMsgAt: -999.0,
};

const SelfEntity = Instance.FindEntityByName("st4_boss4_script");

function resetState() {
    BossState.health = 300.0;
    BossState.isKilled = false;
    BossState.isTicking = false;
    BossState.lastHpMsgAt = -999.0;
}

function toNumber(value, fallback = 0) {
    const parsed = typeof value === "number" ? value : parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function StartTickInternal() {
    BossState.isKilled = false;
    if (BossState.isTicking) {
        return;
    }
    BossState.isTicking = true;
    TickHealth();
}

function ScheduleNextTick() {
    if (!BossState.isTicking || BossState.isKilled) {
        return;
    }

    Instance.EntFireAtName({
        name: "st4_boss4_script",
        input: "RunScriptInput",
        value: "TickHealth",
        delay: 0.1
    });
}

// ===== Initialization =====
Instance.Msg("st4boss4 script initialized");

// ===== Health Management =====
function AddHealth() {
    const players = Instance.FindEntitiesByClass("player");
    for (const player of players) {
        if (player.GetTeamNumber() === 3 && player.GetHealth() > 0) {
            BossState.health += 85;
        }
    }
}

function SubHealthByShoot() {
    BossState.health--;
}

function SubHealth(value) {
    BossState.health -= value;
}

function CheckBossKilled() {
    if (BossState.health >= 1 || BossState.isKilled) {
        return;
    }

    BossState.health = 0;
    BossKilled();
    BossState.isKilled = true;
    BossState.isTicking = false;
}

// ===== Health Tick =====
function TickHealth() {
    if (!BossState.isTicking) {
        return;
    }

    const now = Instance.GetGameTime();

    if (BossState.health < 1 && !BossState.isKilled) {
        CheckBossKilled();
        HPText();
        return;
    }
    
    HPText();

    ReportRemainingHp(false, now);
    
    ScheduleNextTick();
}

function ReportRemainingHp(force = false, now = Instance.GetGameTime()) {
    if (!force && now - BossState.lastHpMsgAt < 1.0) {
        return;
    }

    BossState.lastHpMsgAt = now;
    Instance.Msg(`[st4boss4] remaining HP: ${BossState.health.toFixed(0)}`);
}

// ===== Display HP Text =====
function HPText() {
    const message = "< Soul >\n HP: ";
    const displayHealth = BossState.health > 0 ? BossState.health.toFixed(0) : "0";
    
    Instance.EntFireAtName({
        name: "st4_Boss4_text",
        input: "SetMessage",
        value: message + displayHealth,
        delay: 0.0
    });
}

// ===== Boss Killed =====
function BossKilled() {
    const bossEntities = Instance.FindEntitiesByName("st4_boss4_*") || [];
    for (const entity of bossEntities) {
        if (SelfEntity && entity === SelfEntity) {
            continue;
        }
        Instance.EntFireAtTarget({
            target: entity,
            input: "Kill",
            delay: 0.10
        });
    }
    
    // Kill missiles timer
    Instance.EntFireAtName({
        name: "st3_boss1_missiles_timer",
        input: "Kill",
        delay: 0.0
    });
    
    // Start death particle
    Instance.EntFireAtName({
        name: "st4_boss4_particle_death",
        input: "Start",
        delay: 0.0
    });
    
    // Open exit
    Instance.EntFireAtName({
        name: "out_6",
        input: "Open",
        delay: 0.0
    });
    Instance.EntFireAtName({
        name: "out_61",
        input: "Open",
        delay: 0.0
    });
    
    // Cancel pending triggers
    Instance.EntFireAtName({
        name: "st4_boss4_start*",
        input: "CancelPending",
        delay: 0.0
    });
    
    // Server message
    Instance.ServerCommand("say < The Soul fizzled out. >");
    
    // Toggle outputs
    Instance.EntFireAtName({
        name: "out_toggle",
        input: "Toggle",
        delay: 0.02
    });
    
    Instance.EntFireAtName({
        name: "out_toggle_2",
        input: "Toggle",
        delay: 0.02
    });
}

// ===== Script Input Handlers (for external triggers) =====
Instance.OnScriptInput("StartTick", () => {
    StartTickInternal();
});

Instance.OnScriptInput("TickHealth", () => {
    StartTickInternal();
});

Instance.OnScriptInput("StopTick", () => {
    BossState.isKilled = true;
    BossState.isTicking = false;
});

Instance.OnScriptInput("AddHealth", () => {
    AddHealth();
});

Instance.OnScriptInput("TakeDamageShoot", () => {
    SubHealthByShoot();
    CheckBossKilled();
    ReportRemainingHp(true);
});

Instance.OnScriptInput("TakeDamage", (data) => {
    const damage = toNumber(data && data.value, 1);
    SubHealth(damage);
    CheckBossKilled();
});

Instance.OnScriptInput("SetHealth", (data) => {
    BossState.health = toNumber(data && data.value, BossState.health);
    CheckBossKilled();
});

Instance.OnScriptInput("GetHealth", () => {
    Instance.Msg(`Boss health: ${BossState.health}`);
});

try {
    Instance.OnRoundStart(() => {
        resetState();
    });

    Instance.OnRoundEnd(() => {
        BossState.isKilled = true;
        BossState.isTicking = false;
    });
} catch (e) {
    // ignore
}