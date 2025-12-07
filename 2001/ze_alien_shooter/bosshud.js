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
// Alien 1
Instance.OnScriptInput("InitBossAlien1", () => {
    let boss = new Boss("Alien", 1, 20000, 300, "boss_killed_relay");
    boss.he_damage = 30;
    boss.sprite_particle = "Boss_HP_Bar_lvl1";
    boss.segments = 16;
    initBoss(boss);
});
Instance.OnScriptInput("Alien1AddHealth", () => {
    addHealth(hp_per_human);
});
Instance.OnScriptInput("Alien1Damage", () => {
    damage(1, "");
});
Instance.OnScriptInput("Alien1DamageHE", () => {
    damage(damage_per_grenade, "HE");
});
Instance.OnScriptInput("Alien1DamageFire", () => {
    damage(150, "Fire");
});
Instance.OnScriptInput("Alien1DamageElectro", () => {
    damage(250, "Electro");
});
Instance.OnScriptInput("Alien1DamageBio", () => {
    damage(100, "Bio");
});
Instance.OnScriptInput("Alien1Heal", () => {
    damage(-175, "Heal");
});
// Alien 2
Instance.OnScriptInput("InitBossAlien2", () => {
    let boss = new Boss("Alien", 1, 20000, 85, "laser_boss_dead");
    initBoss(boss);
});
Instance.OnScriptInput("Alien2AddHealth", () => {
    addHealth(hp_per_human);
});
Instance.OnScriptInput("Alien2Damage", () => {
    damage(1, "");
});
Instance.OnScriptInput("Alien2DamageLaser", () => {
    damage(55, "Laser");
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
    Instance.EntFireAtName({ name: "bhud_timer", input: "Enable" });
    checkHealth();
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
        Instance.EntFireAtName({ name: boss_relay, input: "Trigger" });
        Instance.EntFireAtName({ name: "bhud_timer", input: "Disable" });
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
    Instance.EntFireAtName({ name: script_name, input: "RunScriptInput", value: "CheckHealth", delay: 0.01 });
}
function buildHud() {
    if (!bossfight)
        return;
    let percentage = hp / hp_max;
    if (health_sprite !== "") {
        let n = Math.ceil(percentage * segments);
        Instance.EntFireAtName({ name: health_sprite, input: "setalphascale", value: n });
    }
    bhud_text = bossname + ": " + hp + " [" + Math.ceil(percentage * 100) + "%]" + he_damage_text + item_damage_text;
    Instance.EntFireAtName({ name: "bhud_hudhint", input: "SetMessage", value: bhud_text });
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
    Instance.EntFireAtName({ name: "bhud_hudhint", input: "SetMessage", value: "" });
    Instance.EntFireAtName({ name: "hide_hud", input: "CountPlayersInZone", value: "" });
}
Instance.OnScriptInput("CheckHealth", checkHealth);
Instance.OnScriptInput("ResetScript", resetScript);
