import { Instance } from "cs_script/point_script";

// ===== State Management =====
const BossState = {
    health: 35.0,
    playerCount: 0,
    isKilled: false,
    laserCount: 0,
    laserPattern: 0,
};

function resetState() {
    BossState.health = 35.0;
    BossState.playerCount = 0;
    BossState.isKilled = false;
    BossState.laserCount = 0;
    BossState.laserPattern = 0;
}



// ===== Configuration =====
//Ground -407
const LaserPOS = [
    { x: 5080, y: 2544, z: -405 },
    { x: 5080, y: 2544, z: -345 },
    { x: 5080, y: 2544, z: -358 },
    { x: 5080, y: 2544, z: -363 }
];

const LaserANG = [
    { pitch: 0, yaw: 0, roll: 0 },
    { pitch: 0, yaw: 0, roll: -4 },
    { pitch: 0, yaw: 0, roll: -6 },
    { pitch: 0, yaw: 0, roll: 4 },
    { pitch: 0, yaw: 0, roll: 6 }
];

const ModelANM = [
    "Left_Attack",
    "Right_Attack",
    "Hand_Throw",
    "Dominated_End",
    "Run"
];

// ===== Initialization =====
Instance.OnActivate(() => {
    Instance.Msg("st4boss3 script initialized");
});

// ===== Health Management =====
function AddHealth(value) {
    const players = Instance.FindEntitiesByClass("player");
    for (const player of players) {
        if (player.GetTeamNumber() === 3 && player.GetHealth() > 0) {
            BossState.health += value;
            BossState.playerCount++;
        }
    }
}

function SubHealthByShoot() {
    try {
        const before = BossState.health;
        BossState.health -= 1;
        Instance.Msg("[st4boss3] Damage: Shoot - HP " + before + " -> " + BossState.health);
    } catch (e) {}
}

function SubHealthByNade() {
    try {
        const before = BossState.health;
        BossState.health -= 45;
        Instance.Msg("[st4boss3] Damage: Nade - HP " + before + " -> " + BossState.health);
    } catch (e) {}
}

function SubHealth(value) {
    try {
        const before = BossState.health;
        const dmg = typeof value === 'number' ? value : parseFloat(value) || 0;
        BossState.health -= dmg;
        Instance.Msg("[st4boss3] Damage: SubHealth(" + dmg + ") - HP " + before + " -> " + BossState.health);
    } catch (e) {}
}

// ===== Health Tick =====
function TickHealth() {
    if (BossState.health < 1 && !BossState.isKilled) {
        BossKilled();
        BossState.isKilled = true;
        return;
    }
    
    HPText();
    
    // Schedule next tick via RunScriptInput
    Instance.EntFireAtName({
        name: "st4_boss3_script",
        input: "RunScriptInput",
        value: "TickHealthLoop",
        delay: 0.1
    });
}

// ===== Display HP Text =====
function HPText() {
    const message = "< GrimReaper >\n HP: ";
    const displayHealth = BossState.health > 0 ? BossState.health.toFixed(0) : "0";
    
    Instance.EntFireAtName({
        name: "Boss_text",
        input: "Setmessage",
        value: message + displayHealth,
        delay: 0.0
    });
    
    Instance.EntFireAtName({
        name: "Boss_text",
        input: "Display",
        value: "",
        delay: 0.01
    });
}

// ===== Boss Killed =====
function BossKilled() {
    Instance.EntFireAtName({ name: "st4_boss3_movelinear", input: "Kill", delay: 0.01 });
    Instance.EntFireAtName({ name: "st4_boss3_model", input: "Kill", delay: 0.01 });
    
    Instance.EntFireAtName({ name: "st4_boss3_particle_death", input: "ClearParent", delay: 0.0 });
    Instance.EntFireAtName({ name: "st4_boss3_particle_death", input: "Start", delay: 0.0 });
    Instance.ServerCommand("say < Grim Reaper retreated!! >");

    const model = Instance.FindEntityByName("st4_boss3_model");
    const exptemp = Instance.FindEntityByName("Explosion_Temp1");
    
    if (model && exptemp) {
        exptemp.ForceSpawn(model.GetAbsOrigin());
    }
}

// ===== Laser Attack =====
function StartReaperLaser() {
    SetupLaserPattern();
    
    // Set random animation
    const motionP = Math.floor(Math.random() * 4);
    Instance.EntFireAtName({
        name: "st4_boss3_model",
        input: "SetAnimation",
        value: ModelANM[motionP],
        delay: 0.0
    });
    Instance.EntFireAtName({
        name: "st4_boss3_laser_snd",
        input: "StartSound",
        delay: 0.02
    });
    
    // Schedule next laser
    BossState.laserCount++;
    const nextSec = (Math.floor(Math.random() * 3) + 11) / 10;
    if (BossState.laserCount < 12) {
        Instance.EntFireAtName({
            name: "st4_boss3_script",
            input: "RunScriptInput",
            value: "LaserTick",
            delay: nextSec
        });
    } else {
        StartCharge();
        Instance.EntFireAtName({
            name: "st4_boss3_laser_snd",
            input: "Kill",
            delay: 5.0
        });
    }
}

// ===== Setup Laser Pattern =====
function SetupLaserPattern() {
    const laserP = Math.floor(Math.random() * 7) + 1;
    
    if (BossState.laserPattern === 0) {
        switch (laserP) {
            case 1: SetLaserPosition(1, 0); break;
            case 2: SetLaserPosition(2, 0); break;
            case 3: SetLaserPosition(3, 0); break;
            case 4: SetLaserPosition(2, 1); break;
            case 5: SetLaserPosition(2, 2); break;
            case 6: SetLaserPosition(2, 3); break;
            case 7: SetLaserPosition(2, 4); break;
        }
        BossState.laserPattern++;
    }
    else if (BossState.laserPattern === 1) {
        switch (laserP) {
            case 1: SetLaserPosition(2, 2); break;
            case 2: SetLaserPosition(2, 3); break;
            case 3: SetLaserPosition(2, 4); break;
            case 4: SetLaserPosition(1, 0); break;
            case 5: SetLaserPosition(2, 0); break;
            case 6: SetLaserPosition(3, 0); break;
            case 7: SetLaserPosition(2, 1); break;
        }
        BossState.laserPattern++;
    }
    else if (BossState.laserPattern === 2) {
        switch (laserP) {
            case 1: SetLaserPosition(2, 0); break;
            case 2: SetLaserPosition(3, 0); break;
            case 3: SetLaserPosition(2, 1); break;
            case 4: SetLaserPosition(2, 2); break;
            case 5: SetLaserPosition(2, 3); break;
            case 6: SetLaserPosition(2, 4); break;
            case 7: SetLaserPosition(1, 0); break;
        }
        BossState.laserPattern = 0;
    }
}

// ===== Helper: Set Laser Position =====
function SetLaserPosition(posIndex, angIndex) {
    const pos = LaserPOS[posIndex];
    const ang = LaserANG[angIndex];

    const laserTemp = Instance.FindEntityByName("st4_boss3_laser_temp");
    if (laserTemp) {
        laserTemp.ForceSpawn(pos, ang);
    }
}

// ===== Debug Laser (continuous) =====
function DebugReaperLaser() {
    SetupLaserPattern();
    
    // Set random animation
    const motionP = Math.floor(Math.random() * 4);
    Instance.EntFireAtName({
        name: "st4_boss3_model",
        input: "SetAnimation",
        value: ModelANM[motionP],
        delay: 0.0
    });
    
    Instance.EntFireAtName({
        name: "st4_boss3_laser_snd",
        input: "PlaySound",
        delay: 0.02
    });
    
    // Schedule next laser (continuous for debug)
    const nextSec = (Math.floor(Math.random() * 3) + 15) / 10;
    Instance.EntFireAtName({
        name: "st4_boss3_script",
        input: "RunScriptInput",
        value: "DebugLaserTick",
        delay: nextSec
    });
}

// ===== Charge Phase =====
function StartCharge() {
    // Log current HP before charge
    try {
        Instance.Msg("[st4boss3] StartCharge called - HP: " + (typeof BossState.health === 'number' ? BossState.health.toFixed(0) : BossState.health));
    } catch (e) {}

    Instance.EntFireAtName({ name: "st4_boss3_movelinear", input: "Open", delay: 3.5});
    
    Instance.EntFireAtName({
        name: "st4_boss3_physbreak*",
        input: "SetDamageFilter",
        value: "filter_ct",
        delay: 3.02
    });
    
    Instance.EntFireAtName({
        name: "st4_boss3_nadetrigger*",
        input: "Enable",
        delay: 3.02
    });
    
    Instance.EntFireAtName({
        name: "st4_nade_supply_trigger",
        input: "Enable",
        delay: 3.0
    });
    
    Instance.EntFireAtName({
        name: "st4_nade_supply_trigger",
        input: "Kill",
        delay: 3.02
    });
    
    Instance.EntFireAtName({
        name: "st4_boss3_model",
        input: "SetAnimation",
        value: ModelANM[4],
        delay: 3.0
    });
    
    Instance.ServerCommand("say < Grim Reaper is catching you >");
    Instance.ServerCommand("say < Grenades do more damage >");
    
    // const bossText = Instance.FindEntityByName("Boss_text");
    // if (bossText) {
    //     bossText.SetColor({ r: 146, g: 29, b: 255 });
    // }
    
    // Add health trigger
    AddHealth(55);
    
    // Restart health tick
    Instance.EntFireAtName({
        name: "st4_boss3_script",
        input: "RunScriptInput",
        value: "TickHealthLoop",
        delay: 3.03
    });
}

// ===== Script Input Handlers (for external triggers) =====
Instance.OnScriptInput("StartLaser", () => {
    BossState.laserCount = 0;
    BossState.laserPattern = 0;
    StartReaperLaser();
});

Instance.OnScriptInput("StartDebugLaser", () => {
    BossState.laserCount = 0;
    BossState.laserPattern = 0;
    DebugReaperLaser();
});

Instance.OnScriptInput("TakeDamageShoot", () => {
    SubHealthByShoot();
});

Instance.OnScriptInput("TakeDamageNade", () => {
    SubHealthByNade();
});

Instance.OnScriptInput("TakeDamage", (data) => {
    const damage = typeof data.value === "number" ? data.value : 1;
    SubHealth(damage);
});

Instance.OnScriptInput("AddHealthBonus", (data) => {
    const bonus = typeof data.value === "number" ? data.value : 55;
    AddHealth(bonus);
});

Instance.OnScriptInput("StartCharge", () => {
    StartCharge();
});

// ===== Scheduler Handlers (for RunScriptInput self-scheduling) =====
Instance.OnScriptInput("TickHealthLoop", () => {
    if (BossState.isKilled) return;
    TickHealth();
});

Instance.OnScriptInput("LaserTick", () => {
    if (BossState.isKilled) return;
    StartReaperLaser();
});

Instance.OnScriptInput("DebugLaserTick", () => {
    if (BossState.isKilled) return;
    DebugReaperLaser();
});

try {
    Instance.OnRoundStart(() => {
        resetState();
    });

    Instance.OnRoundEnd(() => {
        BossState.isKilled = true;
    });
} catch (e) {
    // ignore
}