import { Instance, CSPlayerPawn, CSPlayerController, Entity } from "cs_script/point_script";

export const utils = {
    printl(a) {Instance.Msg(a)},

    EntFire(name = "", input = "", value = "", delay = 0.00, caller = undefined, activator = undefined)
    {
        Instance.EntFireAtName({name,input,value,delay,caller,activator})
    },

    EntFireByHandle(target = "", input = "", value = "", delay = 0.00, caller = undefined, activator = undefined)
    {
        if(target == undefined) return;
        Instance.EntFireAtTarget({target,input,value,delay,caller,activator})
    },

    GetRandomIntBetween(min, max) {return Math.floor(Math.random() * (max - min + 1) ) + min;},
    vectorAdd(vec1, vec2) {
        return { x: vec1.x + vec2.x, y: vec1.y + vec2.y, z: vec1.z + vec2.z };
    },

    vectorScale(vec, scale) {
        return { x: vec.x * scale, y: vec.y * scale, z: vec.z * scale };
    },
    
    vectorDistance(x, y,z) {
        return Math.sqrt(Math.pow(x,2)+Math.pow(y,2)+Math.pow(z,2))
    }
}

// === 重置护甲 ===
let bIsRunning = false;

function removeTArmorFromAllPlayers() {
    for (let i = 0; i < 64; i++) {
        const controller = Instance.GetPlayerController(i);
        if (!controller || !controller.IsConnected()) {
            continue;
        }
        const pawn = controller.GetPlayerPawn();
        if (!pawn || !pawn.IsValid() || !pawn.IsAlive()) {
            continue;
        }
        if (pawn.GetTeamNumber() === 2) {
            pawn.SetArmor(0);
        }
    }
}

function mainLoop() {
    if (bIsRunning) {
        removeTArmorFromAllPlayers();
        Instance.SetNextThink(Instance.GetGameTime() + 3.0); // 3秒后再次执行
    }
}

function startArmorRemover() {
    if (bIsRunning) {
        return;
    }
    bIsRunning = true;
    Instance.SetNextThink(Instance.GetGameTime()); 
}

function stopArmorRemover() {
    if (!bIsRunning) {
        return;
    }
    bIsRunning = false;
}

// === LastManStanding ===
function handleLastManStanding() {
    const aliveCTPlayers = [];
    for (let i = 0; i < 64; i++) {
        const controller = Instance.GetPlayerController(i);
        if (!controller || !controller.IsConnected()) {
            continue;
        }
        const pawn = controller.GetPlayerPawn();
        if (!pawn || !pawn.IsValid() || !pawn.IsAlive()) {
            continue;
        }
        if (pawn.GetTeamNumber() === 3) {
            aliveCTPlayers.push(pawn);
        }
    }
    
    if (aliveCTPlayers.length === 0) {
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * aliveCTPlayers.length);
    const selectedPlayer = aliveCTPlayers[randomIndex];
    selectedPlayer.SetEntityName("last_man_standing");
    
    Instance.SetNextThink(Instance.GetGameTime() + 0.02);
    bExecuteLastManEvents = true;
}

let bExecuteLastManEvents = false;

function executeLastManEvents() {
    // last_man_standing
    utils.EntFire("last_man_standing", "Alpha", "255", 0);
    utils.EntFire("last_man_standing", "Color", "255 255 255", 0);
    utils.EntFire("last_man_standing", "SetDamageFilter", "", 0);
    utils.EntFire("last_man_standing", "ClearContext", "", 0);
    utils.EntFire("last_man_standing", "KeyValues", "speed 1", 0);
    utils.EntFire("last_man_standing", "KeyValues", "gravity 1", 0);
    
    // human_mech
    utils.EntFire("human_mech", "Alpha", "255", 0);
    utils.EntFire("human_mech", "Color", "255 255 255", 0);
    utils.EntFire("human_mech", "SetDamageFilter", "", 0);
    utils.EntFire("human_mech", "ClearContext", "", 0);
    utils.EntFire("human_mech", "KeyValues", "speed 1", 0);
    utils.EntFire("human_mech", "KeyValues", "gravity 1", 0);
    
    // monster
    utils.EntFire("monster", "Alpha", "255", 0);
    utils.EntFire("monster", "Color", "255 255 255", 0);
    utils.EntFire("monster", "SetDamageFilter", "", 0);
    utils.EntFire("monster", "ClearContext", "", 0);
    utils.EntFire("monster", "KeyValues", "speed 1", 0);
    utils.EntFire("monster", "KeyValues", "gravity 1", 0);
    
    // 坦克
    utils.EntFire("v_button1", "Kill", "", 0);
    utils.EntFire("v_model1", "Fireuser3", "", 0.04);
    
    // 机甲
    utils.EntFire("Human_Item_Mech_UI", "Deactivate", "", 0.02);
    utils.EntFire("Human_Item_Mech_UI", "Kill", "", 0.04);
    utils.EntFire("Human_Item_Mech_Cam", "Kill", "", 0.02);
    utils.EntFire("Human_Item_Mech_Attack_*", "Disable", "", 0.02);
    utils.EntFire("Human_Item_Mech_Attack_*", "Kill", "", 0.04);
    utils.EntFire("Human_Item_Mech_Hurt_*", "Disable", "", 0.02);
    utils.EntFire("Human_Item_Mech_Hurt_*", "Kill", "", 0.04);
    utils.EntFire("Human_Item_Mech_Model", "SetAnimation", "Die", 0.02);
    utils.EntFire("Human_Item_Mech_Model", "ClearParent", "", 0.04);
    utils.EntFire("Human_Item_Mech_Model", "Kill", "", 2.50);
    utils.EntFire("Human_Item_Mech_Selector", "Disable", "", 0.04);
    utils.EntFire("Human_Item_Mech_Sound_Die", "StartSound", "", 0.04);
    utils.EntFire("Human_Item_Mech_Body", "Break", "", 0.02);
    utils.EntFire("Human_Item_Mech*", "Kill", "", 0.2);

    // 机械狗
    utils.EntFire("wpn_jugger_phys", "Break", "", 0.02);
    utils.EntFire("wpn_jugger_ui", "Kill", "", 0.02);
    utils.EntFire("wpn_jugger*", "Kill", "", 0.04);
    
    // 黑洞巫师
    utils.EntFire("Zombie_Item_Summoner_Slow_Trigger", "Kill", "", 0.02);
    utils.EntFire("Zombie_Item_Summoner_Teleport*", "Kill", "", 0.02);
    
    // 传送&处死
    utils.EntFire("stage5_goaway", "FireUser1", "", 0.20);
    utils.EntFire("lms_fuckoffzombies", "Enable", "", 0.20);
    utils.EntFire("stage_5_last_man_trigger", "Enable", "", 0.20);
    utils.EntFire("teleport_lastmanstanding", "Enable", "", 0.30);
    utils.EntFire("lms_fuckoffzombies", "Disable", "", 0.50);
    utils.EntFire("teleport_lastmanstanding", "Disable", "", 0.50);
    utils.EntFire("stage_5_last_man_trigger", "Kill", "", 2.20);
    
    //last_man_reset_relay
    utils.EntFire("last_man_reset", "Enable", "", 0.50);
    utils.EntFire("last_man_reset", "Trigger", "", 1.50);
    utils.EntFire("last_man_reset", "Trigger", "", 2.50);
}

function handleNowReset() {
    executeLastManEvents();
}

function extendedMainLoop() {
    if (bIsRunning) {
        removeTArmorFromAllPlayers();
    }
    
    if (bExecuteLastManEvents) {
        bExecuteLastManEvents = false;
        executeLastManEvents();
    }
    
    if (bIsRunning) {
        Instance.SetNextThink(Instance.GetGameTime() + 3.0);
    } else if (bExecuteLastManEvents) {
        Instance.SetNextThink(Instance.GetGameTime() + 0.01);
    }
}

Instance.OnScriptInput("Start", startArmorRemover);
Instance.OnScriptInput("Stop", stopArmorRemover);
Instance.OnScriptInput("LastManStanding", handleLastManStanding);
Instance.OnScriptInput("NowReset", handleNowReset);

Instance.SetThink(extendedMainLoop);
