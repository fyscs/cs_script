import { Instance } from 'cs_script/point_script';

class Boss {
    name;
    start_hp;
    max_hp;
    hp_per_human;
    death_relay;
    he_damage;
    sprite_particle;
    segments;
    constructor(name, start_hp, max_hp, hp_per_human, death_relay) {
        this.name = name;
        this.start_hp = start_hp;
        this.max_hp = max_hp;
        this.hp_per_human = hp_per_human;
        this.death_relay = death_relay;
        this.he_damage = 0;
        this.sprite_particle = "";
        this.segments = 0;
    }
}
// Quadralex Phase 1
Instance.OnScriptInput("InitBossQuad1", () => {
    let boss = new Boss("Quadralex", 1, 8888, 240, "quad_1_dead");
    boss.he_damage = 45;
    initBoss(boss);
});
Instance.OnScriptInput("Quad1DamageFire", () => {
    damage(180, "Fire");
});
Instance.OnScriptInput("Quad1DamageElectro", () => {
    damage(80, "Electro");
});
// Quadralex Phase 2
Instance.OnScriptInput("InitBossQuad2", () => {
    let boss = new Boss("Quadralex", 1, 5500, 185, "boss_quad_arena_die_relay");
    boss.he_damage = 45;
    initBoss(boss);
});
// Worm 1
Instance.OnScriptInput("InitBossWorm1", () => {
    let boss = new Boss("Worm", 30, 3200, 80, "worm_1_dead");
    initBoss(boss);
});
// Worm 2
Instance.OnScriptInput("InitBossWorm2", () => {
    let boss = new Boss("Worm", 50, 12000, 40, "worm_2_dead");
    initBoss(boss);
});
// Worm 3
Instance.OnScriptInput("InitBossWorm3", () => {
    let boss = new Boss("Worm", 1, 12000, 35, "worm_3_dead");
    initBoss(boss);
});
let bossname = "";
let hp_max = 0;
let hp = 0;
let max_init_hp = 0;
let hp_per_human = 0;
let health_sprite = "";
let segments = 0;
let bhud_text = "";
let item_damage_text = "";
let he_damage_text = "";
let item_temp = "";
let item_hits = 1;
let he_hits = 0;
let damage_per_grenade = 0;
let he_damage = 0;
let item_tick_max = 200;
let he_tick_max = 200;
let item_tick = 0;
let he_tick = 0;
let bossfight = false;
let boss_relay = "";
let script_name = "script_bosshud";
function initBoss(boss) {
    bossname = boss.name;
    hp = hp_max = boss.start_hp;
    max_init_hp = boss.max_hp;
    hp_per_human = boss.hp_per_human;
    boss_relay = boss.death_relay;
    damage_per_grenade = boss.he_damage;
    health_sprite = boss.sprite_particle;
    segments = boss.segments;
}
Instance.OnScriptInput("BossAddHealth", () => {
    addHealth(hp_per_human);
});
function addHealth(health) {
    hp_max += health;
    hp += health;
    if (hp_max > max_init_hp) {
        hp_max = max_init_hp;
        hp = max_init_hp;
    }
}
Instance.OnScriptInput("StartBoss", () => {
    bossfight = true;
    Instance.EntFireAtName("bhud_timer", "Enable", "", 0);
    checkHealth();
});
Instance.OnScriptInput("BossDamage", () => {
    damage(1, "");
});
Instance.OnScriptInput("BossDamageHE", () => {
    damage(damage_per_grenade, "HE");
});
function damage(damage, name) {
    if (!bossfight) {
        return;
    }
    hp -= damage;
    if (name !== "") {
        if (name === "HE") {
            he_tick = 0;
            he_hits++;
            he_damage = damage * he_hits;
            he_damage_text = " [HE: " + (-he_damage) + "]";
        }
        else {
            item_tick = 0;
            itemDamage(name, damage);
        }
    }
}
function checkHealth() {
    if (!bossfight)
        return;
    if (hp <= 0) {
        bossfight = false;
        Instance.EntFireAtName(boss_relay, "Trigger", "", 0);
        Instance.EntFireAtName("bhud_timer", "Disable", "", 0);
        resetScript();
        return;
    }
    if (item_damage_text !== "") {
        if (item_tick > item_tick_max) {
            item_tick = 0;
            item_temp = "";
            item_hits = 1;
            item_damage_text = "";
        }
        else {
            item_tick++;
        }
    }
    if (he_damage_text !== "") {
        if (he_tick > he_tick_max) {
            he_tick = 0;
            he_hits = 0;
            he_damage_text = "";
        }
        else {
            he_tick++;
        }
    }
    buildHud();
    Instance.EntFireAtName(script_name, "RunScriptInput", "CheckHealth", 0.01);
}
function buildHud() {
    if (!bossfight)
        return;
    let percentage = hp / hp_max;
    if (health_sprite !== "") {
        let n = Math.ceil(percentage * segments);
        Instance.EntFireAtName(health_sprite, "setalphascale", n, 0);
    }
    bhud_text = bossname + ": " + hp + " [" + Math.ceil(percentage * 100) + "%]" + he_damage_text + item_damage_text;
    Instance.EntFireAtName("bhud_hudhint", "SetMessage", bhud_text, 0);
}
function itemDamage(item_name, item_dmg) {
    if (!bossfight)
        return;
    if (item_name === item_temp) {
        item_hits++;
        item_damage_text = " [" + item_name + ": " + (item_dmg < 0 ? "+" + Math.abs(item_dmg) * item_hits : (-item_dmg) * item_hits) + "]";
    }
    else {
        item_hits = 1;
        item_damage_text = " [" + item_name + ": " + (item_dmg < 0 ? "+" + Math.abs(item_dmg) : (-item_dmg)) + "]";
    }
    item_temp = item_name;
}
function resetScript() {
    bossname = "";
    hp_max = 0;
    hp = 0;
    max_init_hp = 0;
    hp_per_human = 0;
    health_sprite = "";
    segments = 0;
    bhud_text = "";
    item_damage_text = "";
    he_damage_text = "";
    item_temp = "";
    item_hits = 1;
    he_hits = 0;
    damage_per_grenade = 0;
    he_damage = 0;
    item_tick = 0;
    he_tick = 0;
    bossfight = false;
    boss_relay = "";
    Instance.EntFireAtName("bhud_hudhint", "SetMessage", "", 0);
    Instance.EntFireAtName("hide_hud", "CountPlayersInZone", "", 0);
}
Instance.OnScriptInput("CheckHealth", checkHealth);
Instance.OnScriptInput("ResetScript", resetScript);
