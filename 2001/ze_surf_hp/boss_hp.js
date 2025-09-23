import { Instance } from "cs_script/point_script";

let HEALTH_PLAYERADD = 999;

let BOSS_HEALTH = 2000;
let BOSS_MAX_HEALTH = 0;
let HP_BAR_MAX_FRAME = 15;
let HP_BAR_FRAME = 0;
let HP_PER_FRAME = 0;

let BOSS_NAME = "BOSS: ";
let BOSS_ENT = "";
let BOSS_HUD_ENT = "";
let BOSS_PERCENT_C = "";

let BOSS_HUD_TEXT = "";
let BOSS_HUD_IND = true;
let BOSS_HUD_ST = "◼";
let BOSS_HUD_ST2 = "◻";

let TICKRATE_B = 0.01;
let IS_BOSS_FIGHT = false;

let ITEM_DAMAGE = "";
let ITEM_DAMAGE_TICK = 2.00;
let GRENADE_DAMAGE = 0;
let GRENADE_DAMAGE_TICK = 0.50;

function StartBoss() {
    ITEM_DAMAGE = "";
    GRENADE_DAMAGE = 0;
    
    BOSS_MAX_HEALTH = BOSS_HEALTH;
    HP_PER_FRAME = BOSS_HEALTH / HP_BAR_MAX_FRAME;
    HP_BAR_FRAME = HP_BAR_MAX_FRAME;
    
    IS_BOSS_FIGHT = true;

    CheckHealth();
};

Instance.OnScriptInput("AddHealth", () => {
    
    BOSS_HEALTH += HEALTH_PLAYERADD;
    
    if (BOSS_HEALTH > BOSS_MAX_HEALTH) {
        BOSS_MAX_HEALTH = BOSS_HEALTH;
        HP_PER_FRAME = BOSS_HEALTH / HP_BAR_MAX_FRAME;
    }
    
    CheckHealth();
});

function CheckHealth() {
    if (!IS_BOSS_FIGHT) return;

    HP_BAR_FRAME = Math.floor(BOSS_HEALTH / HP_PER_FRAME);
    HP_BAR_FRAME = Math.min(HP_BAR_FRAME, HP_BAR_MAX_FRAME);

    if (BOSS_HEALTH <= 0) {
        BOSS_HEALTH = 0;
        BossKill();
        return;
    }

    BuildHud();
    Instance.SetNextThink(Instance.GetGameTime() + TICKRATE_B, CheckHealth);
}

function BuildHud() {
    if (!IS_BOSS_FIGHT) return;
    
    if (ITEM_DAMAGE !== "") {
        ITEM_DAMAGE_TICK -= TICKRATE_B;
        if (ITEM_DAMAGE_TICK <= 0) {
            ITEM_DAMAGE = "";
            ITEM_DAMAGE_TICK = 2.00;
        }
    }
    
    if (GRENADE_DAMAGE > 0) {
        GRENADE_DAMAGE_TICK -= TICKRATE_B;
        if (GRENADE_DAMAGE_TICK <= 0) {
            GRENADE_DAMAGE = 0;
            GRENADE_DAMAGE_TICK = 0.50;
        }
    }
    
    const PERCENT_HP = Math.ceil((BOSS_HEALTH / BOSS_MAX_HEALTH) * 100);
    BOSS_HUD_TEXT = `${BOSS_NAME}: ${BOSS_HEALTH} (${PERCENT_HP}%)`;
    
    if (GRENADE_DAMAGE > 0) {
        BOSS_HUD_TEXT += ` [HE: -${GRENADE_DAMAGE} HP]`;
    }
    if (ITEM_DAMAGE !== "") {
        BOSS_HUD_TEXT += ITEM_DAMAGE;
    }
    
    if (BOSS_PERCENT_C && BOSS_PERCENT_C.length > 0) {
        Instance.EntFireAtName(BOSS_PERCENT_C, "InValue", `${PERCENT_HP}`, 0);
    }
    
    if (BOSS_HUD_IND) {
        BOSS_HUD_TEXT += "\n[";
        const filled = Math.max(1, HP_BAR_FRAME);
        
        for (let c = 0; c < filled; c++) {
            BOSS_HUD_TEXT += BOSS_HUD_ST;
        }
        for (let a = filled; a < HP_BAR_MAX_FRAME; a++) {
            BOSS_HUD_TEXT += BOSS_HUD_ST2;
        }
        BOSS_HUD_TEXT += "]";
    }
    
    Instance.EntFireAtName(BOSS_HUD_ENT, "SetMessage", BOSS_HUD_TEXT, 0);
}

Instance.OnScriptInput("GrenadeDamage", () => {
    if (!IS_BOSS_FIGHT) return;
    
    const damage = 50;
    BOSS_HEALTH = Math.max(0, BOSS_HEALTH - damage);
    GRENADE_DAMAGE += damage;
    GRENADE_DAMAGE_TICK = 0.50;
    
    CheckHealth();
});

/*
Instance.OnScriptInput("ItemDamage", (context) => {
    if (!IS_BOSS_FIGHT) return;
    
    const arg = context.value || "item,0";
    const arg_rs = arg.replace(/\s+/g, '');
    const arr = arg_rs.split(",");
    
    const itemName = arr[0];
    const damage = Number(arr[1]) || 0;
    
    BOSS_HEALTH = Math.max(0, BOSS_HEALTH - damage);
    const subs = damage < 0 ? "+" : "-";
    ITEM_DAMAGE = ` (${itemName}: ${subs}${Math.abs(damage)} HP)`;
    
    CheckHealth();
});
*/

function BossKill() {
    IS_BOSS_FIGHT = false;
    Instance.EntFireAtName(BOSS_ENT, "FireUser3");
    Instance.EntFireAtName(BOSS_HUD_ENT, "SetMessage", `${BOSS_NAME}: 0`);
    Instance.EntFireAtName(BOSS_HUD_ENT, "HideHudHint", "", 0.1);
    ResetBossS();
}

Instance.OnScriptInput("SubtractHealth", () => {
    if (!IS_BOSS_FIGHT || BOSS_HEALTH <= 0) return;
    BOSS_HEALTH -= 1;
    CheckHealth();
});

Instance.OnScriptInput("BossKill", () => BossKill());

Instance.OnGameEvent("round_start", (event) => {
    ResetBossS();
    Instance.Msg('=== ROUND START ===');
});

function ResetBossS() {
    BOSS_HEALTH = 25;
    BOSS_MAX_HEALTH = 25;
    HP_BAR_MAX_FRAME = 10;
    HP_BAR_FRAME = 10;
    HP_PER_FRAME = 2.5;
    IS_BOSS_FIGHT = false;
    BOSS_HUD_IND = true;
    ITEM_DAMAGE = "";
    ITEM_DAMAGE_TICK = 2.00;
    GRENADE_DAMAGE = 0;
    GRENADE_DAMAGE_TICK = 2.00;
    
}


// boss_phys,boss_hud,Cubic,120,220
Instance.OnScriptInput("Start_test_Boss", () => {
    BOSS_ENT = "boss_phys"
    BOSS_HUD_ENT = "boss_hud"

    BOSS_NAME = "Cubic"
    BOSS_HEALTH = 20;
    HEALTH_PLAYERADD = 50

    HP_BAR_MAX_FRAME = 10;
    HP_PER_FRAME = 0;

    ITEM_DAMAGE_TICK = 2.00;
    GRENADE_DAMAGE = 50;
    GRENADE_DAMAGE_TICK = 0.50;
    StartBoss();
});

Instance.OnScriptInput("Start_Angry_Boss", () => {
    BOSS_ENT = "angry_boss"
    BOSS_HUD_ENT = "boss_hud"

    BOSS_NAME = "Evil surf"
    BOSS_HEALTH = 100;
    HEALTH_PLAYERADD = 220

    HP_BAR_MAX_FRAME = 10;
    HP_PER_FRAME = 0;

    ITEM_DAMAGE_TICK = 2.00;
    GRENADE_DAMAGE = 50;
    GRENADE_DAMAGE_TICK = 0.50;

    StartBoss();
});