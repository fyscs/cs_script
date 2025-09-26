import { Instance } from "cs_script/point_script";
const InPuts = [
    ["Map_Boss_TheHeart_Start", "OnTrigger", "Map_Boss_TheHeart_GetDamage,Map_Boss_Health_Script,Map_Boss_Health_Hud,[The$Heart]$[2/2],100,1", StartBoss, 3.00],
	["Boss_Phase_Case", "OnCase01", "Map_Boss_TheHeart_GetDamage,Map_Boss_Health_Script,Map_Boss_Health_Hud,[The$Heart]$[1/2],50,1", StartBoss, 0.10],
    ["Map_Boss_TheHeart_Start", "OnTrigger", "0,450", AddHealth, 2.90],
	["Filter_Team_Human_BossAdd_P2", "OnPass", "1,580", AddHealth, 0.00],
	["Map_Boss_TheHeart_Health_Branch", "OnTrue", "-5", ChangeHealthIt, 0.00],
	["Map_Boss_Arena_Bottom_SubtractHealth", "OnStartTouch", "70", ChangeHealthIt, 0.00],
];

let BOSS_HEALTH = 0.00;
let BOSS_MAX_HEALTH = 0.00;
let HP_BAR_MAX_FRAME = 15;
let HP_BAR_FRAME = 0;
let HP_PER_FRAME = 0;

let BOSS_NAME = "BOSS: ";
let BOSS_ENT = "";
let BOSS_SCRIPT = "";
let BOSS_HUD_ENT = "";
let BOSS_HUD_TEXT = "";
let BOSS_PERCENT_C = ""; 

let BOSS_HUD_IND = true; 
let BOSS_HUD_ST = "◼";
let BOSS_HUD_ST2 = "◻";

let TICKRATE_B = 0.01;
let IS_BOSS_FIGHT = false;

let ITEM_DAMAGE = "";
let ITEM_DAMAGE_TICK = 2.00;
let SAVE_ITEM_DAMAG_T = ITEM_DAMAGE_TICK;

let GRENADE_DAMAGE = 0;
let GRENADE_DAMAGE_TICK = 2.00;
let SAVE_GRENADE_DAMAG_T = GRENADE_DAMAGE_TICK;

const DelayedCalls = [];

function Delay(callback, delaySeconds) {
    DelayedCalls.push({
        time: Instance.GetGameTime() + delaySeconds,
        callback: callback
    });
}

Instance.SetThink(function () {
    const now = Instance.GetGameTime();

    for (let i = DelayedCalls.length - 1; i >= 0; i--) {
        if (DelayedCalls[i].time <= now) {
            DelayedCalls[i].callback();
            DelayedCalls.splice(i, 1);
        }
    }
    Instance.SetNextThink(now + 0.01);
});

Instance.SetNextThink(Instance.GetGameTime() + 0.01);

Instance.OnRoundStart(() => {
	ResetBossS();
	DelayedCalls.length = 0;
    if(InPuts.length > 0)
    {
        for (let i = 0; i < InPuts.length; i++) 
        {
            const [entName, outputName, param, handlerFn, delay] = InPuts[i];

            const ent = Instance.FindEntityByName(entName);
            if(!ent || !ent?.IsValid())
            {
                Instance.Msg("Can't Find: "+entName);
                continue;
            } 

            Instance.Msg(`Add Output to: ${entName} | OutputName: ${outputName} | Param: ${param} | Func: ${handlerFn.name} | Delay: ${delay}`);

            Instance.ConnectOutput(ent, outputName, ({value = param, caller, activator}) => {
                Delay(function () {
                    handlerFn(value);
                }, delay);
            });
        }
    }
})

Instance.OnRoundEnd(() => {
    DelayedCalls.length = 0;
	ResetBossS();
})

function StartBoss(arg) 
{
    ITEM_DAMAGE = "";
    GRENADE_DAMAGE = 0;
    let arg_s = arg;
    let arg_rs = arg_s.replace(/\s+/g, '');
    const arr = arg_rs.split(",");
    BOSS_ENT = arr[0];
    BOSS_SCRIPT = arr[1];
    BOSS_HUD_ENT = arr[2];
    BOSS_NAME = arr[3];
    if (BOSS_NAME.includes('$')) 
    {
        BOSS_NAME = BOSS_NAME.replace(/\$/g, ' ');
    }
    BOSS_HEALTH = BOSS_HEALTH + Number(arr[4]);
    HP_BAR_MAX_FRAME = Number(arr[5]);
    HP_BAR_FRAME = Number(arr[5]);
    if(Number(arr[5]) === 1)
    {
        BOSS_HUD_IND = false;
    }
    BOSS_PERCENT_C = arr[6];
    if(BOSS_PERCENT_C == null)
    {
        BOSS_PERCENT_C = "";
    }
    IS_BOSS_FIGHT = true;
    Instance.EntFireAtName(BOSS_SCRIPT, "RunScriptInput", "CheckHealth", 0.00);
}

function AddHealth(arg)
{
    let arg_s = arg;
    let arg_rs = arg_s.replace(/\s+/g, '');
    const arr = arg_rs.split(",");
    if(arr[0] == "0")
    {
        let players = Instance.FindEntitiesByClass("player");
        if(players.length > 0)
        {
            for (let i = 0; i < players.length; i++) 
            {
                if(IsValidEntity(players[i]))
                {
                    BOSS_HEALTH = BOSS_HEALTH + Number(arr[1]);
                }
            }
        }
    }
    else
    {
        BOSS_HEALTH = BOSS_HEALTH + Number(arr[1]);
    }
}

Instance.OnScriptInput("CheckHealth", () => {
    if(!IS_BOSS_FIGHT)
    {
        return;
    }

    if(HP_PER_FRAME == 0)
    {
        HP_PER_FRAME = BOSS_HEALTH / HP_BAR_MAX_FRAME;
        BOSS_MAX_HEALTH = BOSS_HEALTH;
    }

    if(BOSS_HEALTH > BOSS_MAX_HEALTH)
    {
        HP_PER_FRAME = BOSS_HEALTH / HP_BAR_MAX_FRAME;
        BOSS_MAX_HEALTH = BOSS_HEALTH;
    }

    HP_BAR_FRAME = BOSS_HEALTH / HP_PER_FRAME;
    if(HP_BAR_FRAME > HP_BAR_MAX_FRAME)
    {
        HP_BAR_FRAME = HP_BAR_MAX_FRAME;
    }

    if(BOSS_HEALTH <= 0)
    {
        BOSS_HEALTH = 0;
        Instance.EntFireAtName(BOSS_SCRIPT, "RunScriptInput", "BossKill", 0.00);
        return;
    }
    BuildHud();
    Instance.EntFireAtName(BOSS_SCRIPT, "RunScriptInput", "CheckHealth", TICKRATE_B);
});

function BuildHud()
{
    if(!IS_BOSS_FIGHT)
    {
        return;
    }
    BOSS_HUD_TEXT = "";
    let GrenadeDamage_String = "";
    if(ITEM_DAMAGE != "")
    {
        ITEM_DAMAGE_TICK = ITEM_DAMAGE_TICK - TICKRATE_B;
    }
    if(ITEM_DAMAGE_TICK <= 0)
    {
        ITEM_DAMAGE = "";
        ITEM_DAMAGE_TICK = SAVE_ITEM_DAMAG_T;
    }

    if(GRENADE_DAMAGE != 0)
    {
        GrenadeDamage_String = " [HE: -" + GRENADE_DAMAGE + " HP] ";
        GRENADE_DAMAGE_TICK = GRENADE_DAMAGE_TICK - TICKRATE_B;
    }
    if(GRENADE_DAMAGE_TICK <= 0)
    {
        GRENADE_DAMAGE = 0;
        GRENADE_DAMAGE_TICK = SAVE_GRENADE_DAMAG_T;
    }
    if(BOSS_HEALTH < 0)
    {
        BOSS_HEALTH = 0;
    }
    let PERCENT_HP = Math.ceil(BOSS_HEALTH / BOSS_MAX_HEALTH * 100);
    BOSS_HUD_TEXT += `${BOSS_NAME}: ${BOSS_HEALTH} (${PERCENT_HP}%)${GrenadeDamage_String}${ITEM_DAMAGE}`;
    if(BOSS_PERCENT_C.length > 0)
    {
        Instance.EntFireAtName(BOSS_PERCENT_C, "InValue", ""+PERCENT_HP, 0.00);
    }
    if(BOSS_HUD_IND)
    {
        BOSS_HUD_TEXT += "\n[";
        let hp_bar_int = Math.ceil(HP_BAR_FRAME);
        if(hp_bar_int < 1)
        {
            hp_bar_int = 1;
        }
        for(let c = 0; c < hp_bar_int; c++)
        {
            BOSS_HUD_TEXT = BOSS_HUD_TEXT + BOSS_HUD_ST;
        }
        if(hp_bar_int < HP_BAR_MAX_FRAME)
        {
            for(let a = hp_bar_int; a < HP_BAR_MAX_FRAME; a++)
            {
                BOSS_HUD_TEXT = BOSS_HUD_TEXT + BOSS_HUD_ST2;
            }
        }
        BOSS_HUD_TEXT = BOSS_HUD_TEXT + "]";
    }
    Instance.EntFireAtName(BOSS_HUD_ENT, "SetMessage", BOSS_HUD_TEXT, 0.00);
    //Instance.Msg(BOSS_HUD_TEXT);
}

Instance.OnScriptInput("SubtractHealth", () => {
    if(!IS_BOSS_FIGHT)
    {
        return;
    }
        
    if(BOSS_HEALTH >= 0)
    {
        BOSS_HEALTH = BOSS_HEALTH - 1
    }
});

function ChangeHealthIt(arg)
{
    if(!IS_BOSS_FIGHT )
    {
        return;
    }
    if(BOSS_HEALTH >= 0)
    {
        BOSS_HEALTH = BOSS_HEALTH - arg;
    }
}

function GrenadeDamage(arg)
{
    if(!IS_BOSS_FIGHT )
    {
        return;
    }
    if(BOSS_HEALTH >= 0)
    {
        BOSS_HEALTH = BOSS_HEALTH - arg;
    }
   GRENADE_DAMAGE = Number(GRENADE_DAMAGE) + Number(arg);
   GRENADE_DAMAGE_TICK = 2.00;
}

function ItemDamage(arg)
{
    if(!IS_BOSS_FIGHT )
    {
        return;
    }
    let arg_s = arg;
    let arg_rs = arg_s.replace(/\s+/g, '');
    const arr = arg_rs.split(",");
    let damage = Number(arr[1]);
    let subs = "-";
    if(BOSS_HEALTH >= 0)
    {
        BOSS_HEALTH = BOSS_HEALTH - damage;
    }
    if(damage < 0)
    {
        subs = "+";
    }
    ITEM_DAMAGE = " (" + arr[0] + ": "+subs+""+ Math.abs(damage) + " HP) ";
}


Instance.OnScriptInput("BossKill", () => {
    BOSS_HEALTH = 0.00;
    IS_BOSS_FIGHT = false;
    Instance.EntFireAtName(BOSS_ENT, "FireUser3", "", 0.00);
    Instance.EntFireAtName(BOSS_HUD_ENT, "SetMessage", BOSS_NAME+": 0", 0.00);
    Instance.EntFireAtName(BOSS_HUD_ENT, "HideHudHint", "", 0.02);
    ResetBossS();
});

function IsValidEntity(ent)
{
    if(ent?.IsValid() && ent?.GetHealth() > 0 && ent?.GetTeamNumber() == 3)
    {
        return true;
    }
    return false;
}

function ResetBossS()
{
    BOSS_HEALTH = 0.00;
    BOSS_MAX_HEALTH = 0.00;
    HP_BAR_MAX_FRAME = 15;
    HP_BAR_FRAME = 0;
    HP_PER_FRAME = 0;
    BOSS_NAME = "BOSS: ";
    BOSS_ENT = "";
    BOSS_SCRIPT = "";
    BOSS_HUD_ENT = "";
    BOSS_HUD_TEXT = "";
    IS_BOSS_FIGHT = false;
    BOSS_HUD_IND = true;
    ITEM_DAMAGE = "";
    GRENADE_DAMAGE = 0;
}
