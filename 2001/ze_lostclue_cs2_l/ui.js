import { Instance, CSGearSlot as CSGearSlot$1 } from "cs_script/point_script";

// State Variables
let BOSS_Alive = false;
let Skilltick1 = false;
let Skilltick2 = false;
let Skilltick3 = false;

// Key State Variables
let g_key_A1 = false; // Attack 1
let g_key_A2 = false; // Attack 2
let g_key_W = false;
let g_key_S = false;
let g_key_A = false;
let g_key_D = false;

Instance.Msg("Launch ui.js");

// --------------------------------------------------------------------------
// Input Handling
// --------------------------------------------------------------------------

Instance.OnScriptInput("Start", (inputData) => {

    let g_hOwner = inputData.activator;

    if (g_hOwner && g_hOwner.IsValid()) {
        g_hOwner.SetEntityName("g_hOwner"); 
        Instance.Msg("g_hOwner set: "+ g_hOwner.GetClassName());
    }

    Instance.EntFireAtName({ name: "boss_ui", input: "Activate", caller: g_hOwner, activator: g_hOwner });

    BOSS_Alive = true;
    
    // Start the Tick loop using the Think system
    Instance.SetThink(Tick);
    Instance.SetNextThink(Instance.GetGameTime() + 0.1);

    if (g_hOwner && g_hOwner.IsValid()) {
        // Teleport owner to start position
        g_hOwner.Teleport({ position: { x: 6920, y: -376.5, z: -1684.5 } }); 
    }
});

// --------------------------------------------------------------------------
// Key Bindings (Inputs)
// --------------------------------------------------------------------------

Instance.OnScriptInput("Press_AT1", () => { g_key_A1 = true; });
Instance.OnScriptInput("UnPress_AT1", () => { g_key_A1 = false; });
Instance.OnScriptInput("Press_AT2", () => { g_key_A2 = true; });
Instance.OnScriptInput("UnPress_AT2", () => { g_key_A2 = false; });

Instance.OnScriptInput("Press_W", () => { g_key_W = true; });
Instance.OnScriptInput("UnPress_W", () => { g_key_W = false; });

Instance.OnScriptInput("Press_A", () => { g_key_A = true; });
Instance.OnScriptInput("UnPress_A", () => { g_key_A = false; });

Instance.OnScriptInput("Press_S", () => { g_key_S = true; });
Instance.OnScriptInput("UnPress_S", () => { g_key_S = false; });

Instance.OnScriptInput("Press_D", () => { g_key_D = true; });
Instance.OnScriptInput("UnPress_D", () => { g_key_D = false; });

// --------------------------------------------------------------------------
// Logic & Skills
// --------------------------------------------------------------------------

function Tick() {
    if (BOSS_Alive) {
        Skill_1();
        Skill_2();
        Skill_3();
        // Schedule next tick
        Instance.SetNextThink(Instance.GetGameTime() + 0.1);
    }
}

function Skill_1() {
    if (g_key_A2) {
        if (!Skilltick1) {
            Skilltick1 = true;
            // EntFire replacements
            Instance.EntFireAtName({ name: "prop_boss", input: "SetAnimationNoResetLooping", value: "zbs_attack_justiceSwing" });
            Instance.EntFireAtName({ name: "swing", input: "PlaySound", delay: 0.1 });
            Instance.EntFireAtName({ name: "jusitc_hurt", input: "Enable" });
            
            // Note: player_speed entity assumed to exist
            if(g_hOwner) {
                Instance.EntFireAtName({ name: "boss_skill_1", input: "Trigger" });
            }

            Instance.EntFireAtName({ name: "jusitc_hurt", input: "Disable", delay: 0.2 });
            Instance.EntFireAtName({ name: "prop_boss", input: "SetAnimationLooping", value: "zbs_run", delay: 2.0 });

            // Reset cooldown using a JS timeout wrapper or EntFire self
            Instance.EntFireAtName({ name: "ui", input: "RunScriptInput", value: "ResetSkill1", delay: 5.0 });
        }
    }
}

Instance.OnScriptInput("ResetSkill1", () => { Skilltick1 = false; });
// --------------------------------------------------------------------------

function Skill_2() {
    if (g_key_W && g_key_S) {
        if (!Skilltick2) {
            Skilltick2 = true;
            Instance.EntFireAtName({ name: "prop_boss", input: "SetAnimationNoResetLooping", value: "zbs_attack_shockwave" });
            Instance.EntFireAtName({ name: "shockwave", input: "PlaySound", delay: 0.1 });

            if(g_hOwner) {
                Instance.EntFireAtName({ name: "boss_skill_2", input: "Trigger" });
            }

            Instance.EntFireAtName({ name: "drop_trigger", input: "Enable", delay: 2.0 });
            Instance.EntFireAtName({ name: "shock_part", input: "Start", delay: 2.5 });
            Instance.EntFireAtName({ name: "shock_part", input: "Stop", delay: 2.6 });
            Instance.EntFireAtName({ name: "drop_trigger", input: "Disable", delay: 2.7 });
            Instance.EntFireAtName({ name: "prop_boss", input: "SetAnimationLooping", value: "zbs_run", delay: 4.0 });
            
            Instance.EntFireAtName({ name: "ui", input: "RunScriptInput", value: "ResetSkill2", delay: 20.0 });
        }
    }
}

Instance.OnScriptInput("ResetSkill2", () => { Skilltick2 = false; });
// --------------------------------------------------------------------------

function Skill_3() {
    if (g_key_W && g_key_A1) {
        if (!Skilltick3) {
            Skilltick3 = true;
            Instance.EntFireAtName({ name: "prop_boss", input: "SetAnimationNoResetLooping", value: "zbs_attack_mahadash" });
            Instance.EntFireAtName({ name: "dash", input: "PlaySound", delay: 0.1 });
            Instance.EntFireAtName({ name: "jusitc_hurt", input: "Enable" });
            Instance.EntFireAtName({ name: "madash", input: "Enable" });
            Instance.EntFireAtName({ name: "madash", input: "Disable", delay: 0.5 });
            
            Instance.EntFireAtName({ name: "dash_push", input: "Enable" });
            Instance.EntFireAtName({ name: "dash_push", input: "Disable", delay: 2.0 });
            Instance.EntFireAtName({ name: "jusitc_hurt", input: "Disable", delay: 0.5 });
            Instance.EntFireAtName({ name: "prop_boss", input: "SetAnimationLooping", value: "zbs_run", delay: 2.0 });
            
            Instance.EntFireAtName({ name: "ui", input: "RunScriptInput", value: "ResetSkill3", delay: 30.0 });
        }
    }
}

Instance.OnScriptInput("ResetSkill3", () => { Skilltick3 = false; });
// --------------------------------------------------------------------------

Instance.OnScriptInput("Deatch", () => {
    BOSS_Alive = false;
    Instance.EntFireAtName({ name: "bosskill", input: "FindEntity" });
    let g_hOwner = null;
});;

Instance.OnScriptInput("StripKnife", (inputData) => {
    let activator = inputData.activator;
    activator.DestroyWeapon(activator.FindWeaponBySlot(CSGearSlot$1.KNIFE));
});

Instance.OnScriptInput("Czmplayer", () => {
    let check = Instance.FindEntityByName("g_hOwner");
    if (check == undefined || !check.IsValid()) {
        Instance.EntFireAtName({ name: "Czmplayer_relay", input: "Trigger" });
    }
    else {
        Instance.Msg("boss玩家还在场地中持续输出");
    }
});

// --- 回合重置 ---
Instance.OnRoundStart(() => {
    // 重置所有数组，防止引用旧实体 

    g_hOwner.SetEntityName(""); 

    // Key State Variables
    let g_key_A1 = false; // Attack 1
    let g_key_A2 = false; // Attack 2
    let g_key_W = false;
    let g_key_S = false;
    let g_key_A = false;
    let g_key_D = false;

    // State Variables
    let BOSS_Alive = false;
    let Skilltick1 = false;
    let Skilltick2 = false;
    let Skilltick3 = false;

    let g_hOwner = null;
    Instance.Msg("LaunchUI: 回合开始，清空标记名单。");
});
