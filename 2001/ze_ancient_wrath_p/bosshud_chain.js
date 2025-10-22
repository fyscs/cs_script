import { Instance } from 'cs_script/point_script';

let chain_n = false;
let chain_e = false;
let chain_s = false;
let chain_w = false;
let hp_n_max = 5;
let hp_e_max = 5;
let hp_s_max = 5;
let hp_w_max = 5;
let hp_n = 5;
let hp_e = 5;
let hp_s = 5;
let hp_w = 5;
let n_relay = "boss_5_chainN_relay";
let e_relay = "boss_5_chainE_relay";
let s_relay = "boss_5_chainS_relay";
let w_relay = "boss_5_chainW_relay";
let north_text = "";
let east_text = "";
let south_text = "";
let west_text = "";
let script_name = "script_chain_bosshud";
Instance.OnScriptInput("AddHealth", () => {
    hp_n_max += 100;
    hp_e_max += 100;
    hp_s_max += 100;
    hp_w_max += 100;
    hp_n += 100;
    hp_e += 100;
    hp_s += 100;
    hp_w += 100;
});
Instance.OnScriptInput("StartBoss", () => {
    chain_n = true;
    chain_e = true;
    chain_s = true;
    chain_w = true;
    Instance.EntFireAtName({ name: "bhud_timer", input: "Enable" });
    checkHealthNorth();
    checkHealthEast();
    checkHealthSouth();
    checkHealthWest();
    buildHud();
});
Instance.OnScriptInput("DamageN", () => {
    if (!chain_n)
        return;
    hp_n--;
});
Instance.OnScriptInput("DamageE", () => {
    if (!chain_e)
        return;
    hp_e--;
});
Instance.OnScriptInput("DamageS", () => {
    if (!chain_s)
        return;
    hp_s--;
});
Instance.OnScriptInput("DamageW", () => {
    if (!chain_w)
        return;
    hp_w--;
});
function checkHealthNorth() {
    if (!chain_n)
        return;
    if (hp_n <= 0) {
        chain_n = false;
        Instance.EntFireAtName({ name: n_relay, input: "Trigger" });
    }
    buildHudNorth();
    Instance.EntFireAtName({ name: script_name, input: "RunScriptInput", value: "checkHealthNorth", delay: 0.01 });
}
function checkHealthEast() {
    if (!chain_e)
        return;
    if (hp_e <= 0) {
        chain_e = false;
        Instance.EntFireAtName({ name: e_relay, input: "Trigger" });
    }
    buildHudEast();
    Instance.EntFireAtName({ name: script_name, input: "RunScriptInput", value: "checkHealthEast", delay: 0.01 });
}
function checkHealthSouth() {
    if (!chain_s)
        return;
    if (hp_s <= 0) {
        chain_s = false;
        Instance.EntFireAtName({ name: s_relay, input: "Trigger" });
    }
    buildHudSouth();
    Instance.EntFireAtName({ name: script_name, input: "RunScriptInput", value: "checkHealthSouth", delay: 0.01 });
}
function checkHealthWest() {
    if (!chain_w)
        return;
    if (hp_w <= 0) {
        chain_w = false;
        Instance.EntFireAtName({ name: w_relay, input: "Trigger" });
    }
    buildHudWest();
    Instance.EntFireAtName({ name: script_name, input: "RunScriptInput", value: "checkHealthWest", delay: 0.01 });
}
function buildHudNorth() {
    if (!chain_n) {
        north_text = "";
        return;
    }
    let percentage = hp_n / hp_n_max;
    north_text = "[NORTH: " + Math.ceil(percentage * 100) + "%] ";
}
function buildHudEast() {
    if (!chain_e) {
        east_text = "";
        return;
    }
    let percentage = hp_e / hp_e_max;
    east_text = "[EAST: " + Math.ceil(percentage * 100) + "%] ";
}
function buildHudSouth() {
    if (!chain_s) {
        south_text = "";
        return;
    }
    let percentage = hp_s / hp_s_max;
    south_text = "[SOUTH: " + Math.ceil(percentage * 100) + "%] ";
}
function buildHudWest() {
    if (!chain_w) {
        west_text = "";
        return;
    }
    let percentage = hp_w / hp_w_max;
    west_text = "[WEST: " + Math.ceil(percentage * 100) + "%] ";
}
function buildHud() {
    if (!chain_n && !chain_e && !chain_s && !chain_w)
        return;
    let bhud_text = north_text + east_text + south_text + west_text;
    Instance.EntFireAtName({ name: "bhud_hudhint", input: "SetMessage", value: bhud_text });
    Instance.EntFireAtName({ name: script_name, input: "RunScriptInput", value: "buildHud", delay: 0.01 });
}
Instance.OnScriptInput("Fail", () => {
    chain_n = false;
    chain_e = false;
    chain_s = false;
    chain_w = false;
    Instance.EntFireAtName({ name: "bhud_hudhint", input: "SetMessage", value: "", delay: 3 });
    Instance.EntFireAtName({ name: "bhud_timer", input: "Disable", delay: 3 });
    Instance.EntFireAtName({ name: "hide_hud", input: "CountPlayersInZone", delay: 3 });
});
function resetScript() {
    chain_n = false;
    chain_e = false;
    chain_s = false;
    chain_w = false;
    hp_n_max = 5;
    hp_e_max = 5;
    hp_s_max = 5;
    hp_w_max = 5;
    hp_n = 5;
    hp_e = 5;
    hp_s = 5;
    hp_w = 5;
    north_text = "";
    east_text = "";
    south_text = "";
    west_text = "";
    Instance.EntFireAtName({ name: "bhud_hudhint", input: "SetMessage", value: "" });
    Instance.EntFireAtName({ name: "bhud_timer", input: "Disable" });
    Instance.EntFireAtName({ name: "hide_hud", input: "CountPlayersInZone" });
}
Instance.OnScriptInput("checkHealthNorth", checkHealthNorth);
Instance.OnScriptInput("checkHealthEast", checkHealthEast);
Instance.OnScriptInput("checkHealthSouth", checkHealthSouth);
Instance.OnScriptInput("checkHealthWest", checkHealthWest);
Instance.OnScriptInput("buildHud", buildHud);
Instance.OnScriptInput("ResetScript", resetScript);
