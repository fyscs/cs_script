import { Instance } from "cs_script/point_script";

const SKINS_LIST = [
    { number: 1, path: "characters/models/exg/kukuka/doroz/doroz.vmdl" },                       // I'm sorry for temporarily stealing this skin
    { number: 2, path: "characters/models/exg/kx/kikyonui/kikyonui.vmdl" },                     // I'm sorry for temporarily stealing this skin
    { number: 3, path: "characters/exg/10011/10011.vmdl" },                                     // I'm sorry for temporarily stealing this skin
    { number: 4, path: "characters/models/kolka/stalker_models/bandit_mask/bandit_mask.vmdl" }  // I'm sorry for temporarily stealing this skin
]

let BOTTLE_CHANCE = [
    { value: 0, weight: 30 },
    { value: 1, weight: 50 },
    { value: 2, weight: 15 },
    { value: 5, weight: 5 }
]

let votes = 0;
let votes_min = 10;

let traps_percentage = 25;

let isVoteExtreme = true;
let isVoteExtremeSucceeded = false;
let isExtremeMode = false;

let players_in_elevator = 0;
let meat = 0;
let meat_needed = 8;
let floor = 0;
let floors_min = 1;
let floors_max = 6;
let safezone_timer = 23;

//    ___ _                       ___ _                       
//   / __\ | __ _ ___ ___   _    / _ \ | __ _ _   _  ___ _ __ 
//  / /  | |/ _` / __/ __| (_)  / /_)/ |/ _` | | | |/ _ \ '__|
// / /___| | (_| \__ \__ \  _  / ___/| | (_| | |_| |  __/ |   
// \____/|_|\__,_|___/___/ (_) \/    |_|\__,_|\__, |\___|_|   
//                                            |___/           

const PlayerInstancesMap = new Map();
class Player {
    constructor(player, controller, name, slot)
    {
        this.player = player;
        this.controller = controller;
        this.player_name = name;
        this.slot = slot;
        this.voted_extreme = false;
        this.Mapper = false;
        this.Vip = false;
        this.Skin = "";
    }
    SetVotedExtreme()
    {
        this.voted_extreme = true;
    }
    SetMapper()
    {
        this.Mapper = true;
    }
    SetVip()
    {
        this.Vip = true;
    }
}

Instance.OnScriptInput("SetMapper", ({caller, activator}) => {
    if(activator)
    {
        const player = activator;
        const player_controller = player?.GetPlayerController();
        const player_slot = player_controller?.GetPlayerSlot();
        const inst = PlayerInstancesMap.get(player_slot);
        if(inst && !inst.Mapper) 
        {
            inst.SetMapper();
        }
    }
});

Instance.OnScriptInput("SetVip", ({caller, activator}) => {
    if(activator)
    {
        const player = activator;
        const player_controller = player?.GetPlayerController();
        const player_slot = player_controller?.GetPlayerSlot();
        const inst = PlayerInstancesMap.get(player_slot);
        if(inst && !inst.Vip) 
        {
            inst.SetVip();
        }
    }
});

//    __                 _       
//   /__\_   _____ _ __ | |_ ___ 
//  /_\ \ \ / / _ \ '_ \| __/ __|
// //__  \ V /  __/ | | | |_\__ \
// \__/   \_/ \___|_| |_|\__|___/

Instance.OnPlayerDisconnect((event) => {
    let player_slot = event.playerSlot
    const inst = PlayerInstancesMap.get(player_slot);
    PlayerInstancesMap.delete(event.playerSlot);
    if(isVoteExtreme)
    {
        if(inst.voted_extreme)
        {
            votes--
        }
        let players_amount = Instance.FindEntitiesByClass("player");
        let players_needed = (players_amount.length/100) * 55;
        players_needed = Math.ceil(players_needed);
        if(players_needed <= votes_min)
        {
            players_needed = votes_min;
        }
        if(players_needed >= 35)
        {
            players_needed = 35;
        }
        if(votes >= players_needed)
        {
            isVoteExtreme = false;
            isVoteExtremeSucceeded = true;
            votes = 0;
            Instance.EntFireAtName({ name: "cmd", input: "Command", value: "say Voting for Extreme Mode has been Disabled.", delay: 0.50 });
        }
    }
});

Instance.OnPlayerReset((event) => {
    const player = event.player;
    if(player?.IsValid())
    {
        const player_controller = player?.GetPlayerController();
        const player_name = player_controller?.GetPlayerName();
        const player_slot = player_controller?.GetPlayerSlot();
        Instance.EntFireAtTarget({ target: player, input: "Alpha", value: "255" });
        Instance.EntFireAtTarget({ target: player, input: "Color", value: "255 255 255" });
        Instance.EntFireAtTarget({ target: player, input: "KeyValue", value: "gravity 1" });
        Instance.EntFireAtTarget({ target: player, input: "SetScale", value: "1" });
        Instance.EntFireAtTarget({ target: player, input: "SetDamageFilter" });
        Instance.EntFireAtName({ name: "SteamID_Mapper_FilterMulti", input: "TestActivator", activator: player, delay: 0.10 });
        Instance.EntFireAtName({ name: "SteamID_Vip_FilterMulti", input: "TestActivator", activator: player, delay: 0.10 });
        if(PlayerInstancesMap.has(player_slot))
        {
            const inst = PlayerInstancesMap.get(player_slot);
            inst.player = player;
            inst.controller = player_controller;
            inst.name = player_name;
            if(inst.Mapper || inst.Vip)
            {
                if(inst.Skin != "" && player.GetTeamNumber() === 3)
                {
                    Instance.EntFireAtTarget({ target: inst.player, input: "SetModel", value: inst.Skin, delay: 1.00 });
                }
            }
        } 
        else 
        {
            PlayerInstancesMap.set(player_slot, new Player(player, player_controller, player_name, player_slot));
        }
    }
});

Instance.OnRoundStart(() => {
    ResetScript();
    if(isVoteExtremeSucceeded)
    {
        isExtremeMode = true;
    }
    Instance.EntFireAtName({ name: "Map_Floor_Postprocessing", input: "Disable", value: "", delay: 0.00 });
    if(!isExtremeMode)
    {
        traps_percentage = 25;
    }
    if(isExtremeMode)
    {
        traps_percentage = 60;
    }
});

Instance.OnRoundEnd(() => {
    ResetScript();
});

Instance.OnBeforePlayerDamage((event) => {
    let inflictor = event.inflictor;
    if (inflictor?.GetClassName() == "prop_physics" || inflictor?.GetClassName() == "prop_physics_override" || inflictor?.GetClassName() == "func_physbox") {
        let damage = 0;
        return { damage };
    }
});

//    ___ _           _       ___                                          _     
//   / __\ |__   __ _| |_    / __\___  _ __ ___  _ __ ___   __ _ _ __   __| |___ 
//  / /  | '_ \ / _` | __|  / /  / _ \| '_ ` _ \| '_ ` _ \ / _` | '_ \ / _` / __|
// / /___| | | | (_| | |_  / /__| (_) | | | | | | | | | | | (_| | | | | (_| \__ \
// \____/|_| |_|\__,_|\__| \____/\___/|_| |_| |_|_| |_| |_|\__,_|_| |_|\__,_|___/

Instance.OnPlayerChat((event) => {
    let player_controller = event.player
    if (!player_controller?.IsValid() || player_controller == undefined || !player_controller.GetPlayerPawn()?.IsValid() || !player_controller.IsAlive()) {
        return;
    }
    const player_slot = player_controller?.GetPlayerSlot();
    const inst = PlayerInstancesMap.get(player_slot);
    const player_text = event.text.toLowerCase();
    if(player_text.includes("!m_ex") || player_text.includes("m_ex"))
    {
        if(isVoteExtreme && !isVoteExtremeSucceeded && !inst.voted_extreme)
        {
            inst.SetVotedExtreme();
            votes++
            let player_name = player_controller.GetPlayerName()
            let players_amount = Instance.FindEntitiesByClass("player");
            let players_needed = (players_amount.length/100) * 55;
            players_needed = Math.ceil(players_needed);
            if(players_needed <= votes_min)
            {
                players_needed = votes_min;
            }
            if(players_needed >= 35)
            {
                players_needed = 35;
            }
            Instance.ServerCommand(`say Player ${player_name} wants to vote for Extreme Mode (${votes}/${players_needed})`);
            if(votes >= players_needed)
            {
                isVoteExtreme = false;
                isVoteExtremeSucceeded = true;
                votes = 0;
                Instance.EntFireAtName({ name: "cmd", input: "Command", value: "say Voting for Extreme Mode has been Disabled.", delay: 0.50 });
            }
        }
    }
    if(player_text.includes("!m_extreme") && inst.Mapper)
    {
        const text = player_text.split(' ');
        const bool = Number(text[1]);
        if(!Number.isNaN(bool) && bool == 0 && !isVoteExtreme)
        {
            isVoteExtreme = true;
            isVoteExtremeSucceeded = false;
            Instance.EntFireAtName({ name: "cmd", input: "Command", value: "say Voting for Extreme Mode has been Enabled.", delay: 0.50 });
            isExtremeMode = false;
        }
        if(!Number.isNaN(bool) && bool == 1 && isVoteExtreme)
        {
            isVoteExtreme = false;
            isVoteExtremeSucceeded = true;
            Instance.EntFireAtName({ name: "cmd", input: "Command", value: "say Voting for Extreme Mode has been Disabled.", delay: 0.50 });
            isExtremeMode = true;
        }
    }
    if(player_text.includes("!m_traps") && inst.Mapper)
    {
        const text = player_text.split(' ');
        const chance = Number(text[1]);
        if(Number.isInteger(chance) && chance >= 0 && chance <= 100)
        {
            traps_percentage = chance;
        }
    }
    if(player_text.includes("!m_rr") && inst.Mapper)
    {
        Instance.EntFireAtName({ name: "Map_Parameters", input: "FireWinCondition", value: "10", delay: 0.00 });
    }
    if(player_text.includes("!m_skin"))
    {
        if(inst.Mapper)
        {
            const text = player_text.split(' ');
            if(Number(text[1]) && Number(text[1]) > 0 && Number.isInteger(Number(text[1])) && Number(text[1]) <= SKINS_LIST.length)
            {
                let skin_path = SKINS_LIST.find(item => item.number == Number(text[1]))
                inst.Skin = skin_path?.path
                Instance.EntFireAtTarget({ target: inst.player, input: "SetModel", value: `${skin_path?.path}` });
            }
        }
        if(inst.Vip && !inst.Mapper)
        {
            const text = player_text.split(' ');
            if(Number(text[1]) && Number(text[1]) > 0 && Number(text[1]) < 3 && Number.isInteger(Number(text[1])) && Number(text[1]) <= SKINS_LIST.length)
            {
                let skin_path = SKINS_LIST.find(item => item.number == Number(text[1]))
                Instance.EntFireAtTarget({ target: inst.player, input: "SetModel", value: `${skin_path?.path}` });
            }
        }
    }
    if(player_text.includes("!m_scale") && inst.Mapper)
    {
        const text = player_text.split(' ');
        const scale = Number(text[1]);
        if(!Number.isNaN(scale) && scale > 0)
        {
            Instance.EntFireAtTarget({ target: inst.player, input: "SetScale", value: `${text[1]}` });
        }
    }
});

//                         ___                 _   _                 
//   /\/\   __ _ _ __     / __\   _ _ __   ___| |_(_) ___  _ __  ___ 
//  /    \ / _` | '_ \   / _\| | | | '_ \ / __| __| |/ _ \| '_ \/ __|
// / /\/\ \ (_| | |_) | / /  | |_| | | | | (__| |_| | (_) | | | \__ \
// \/    \/\__,_| .__/  \/    \__,_|_| |_|\___|\__|_|\___/|_| |_|___/
//              |_|                                                  

Instance.OnScriptInput("PlayerInsideElevator", () => {
    players_in_elevator++
});

Instance.OnScriptInput("PlayerOutsideElevator", () => {
    players_in_elevator--
});

Instance.OnScriptInput("CountPlayersInElevator", ({ caller, activator }) => {
    let players = Instance.FindEntitiesByClass("player");
    if(players.length == 0) return;
    let players_human = players.filter(player => player?.GetTeamNumber() === 3);
    if(players_human.length > 0)
    {
        let players_needed = (players_human.length/100) * 60;
        let players_total = players_human.length;
        players_needed = Math.ceil(players_needed);
        if(players_in_elevator >= players_needed || players_total <= 20)
        {
            Instance.EntFireAtName({ name: "Map_Elevator_Warning", input: "HideHudHint", value: "", delay: 0.00, activator: activator });
            Instance.EntFireAtName({ name: "Elevator_Branch*", input: "Toggle", value: "", delay: 0.00 });
        }
        if(players_in_elevator <= players_needed && players_total > 20)
        {
            Instance.EntFireAtName({ name: "Map_Elevator_Warning", input: "ShowHudHint", value: "", delay: 0.00, activator: activator });
        }
    }
});

Instance.OnScriptInput("SetFloorMessage", ({ caller, activator }) => {
    if(caller?.IsValid() && caller?.GetClassName() == "point_worldtext")
    {
        if(floor != floors_max)
        {
            Instance.EntFireAtTarget({ target: caller, input: "SetMessage", value: `FLOOR ${floor}` });
        }
        if(floor == floors_max)
        {
            Instance.EntFireAtTarget({ target: caller, input: "SetMessage", value: "FLOOR ?" });
        }
    }
});

Instance.OnScriptInput("AddMeat", () => {
    meat++
    if(meat == meat_needed)
    {
        Instance.EntFireAtName({ name: "cmd", input: "Command", value: `say >> ...? <<`, delay: 3.00 });
    }
});

Instance.OnScriptInput("SpawnBottle", ({ caller, activator }) => {
    if(caller?.IsValid && caller.GetClassName() == "trigger_multiple")
    {
        let caller_name = caller.GetEntityName()
        let bottle = getRandomBottle(BOTTLE_CHANCE)
        let bottle_amount = BOTTLE_CHANCE.find(item => item.value == bottle)
        if(bottle_amount?.value == 0)
        {
            return;
        }
        if(bottle_amount?.value == 1)
        {
            Instance.EntFireAtName({ name: "Map_BottleCrate_Maker", input: "ForceSpawnAtEntityOrigin", value: caller_name })
        }
        if(bottle_amount?.value == 2)
        {
            Instance.EntFireAtName({ name: "Map_BottleCrate_Maker", input: "ForceSpawnAtEntityOrigin", value: caller_name })
            Instance.EntFireAtName({ name: "Map_BottleCrate_Maker", input: "ForceSpawnAtEntityOrigin", value: caller_name, delay: 0.10 })
        }
        if(bottle_amount?.value == 5)
        {
            Instance.EntFireAtName({ name: "Map_BottleCrate_Maker2", input: "ForceSpawnAtEntityOrigin", value: caller_name })
        }
    }
})

Instance.OnScriptInput("SpawnTrap", () => {
    let makers = Instance.FindEntitiesByClass("env_entity_maker")
    let trap_makers = makers.filter(maker => (maker.GetEntityName()).search("_Trap_Maker_") != -1)
    let traps_amount = Math.ceil(trap_makers.length/100 * traps_percentage)
    for(let i = 0; i < traps_amount; i++)
    {
        let rnd_n = GetRandomNumber(0, trap_makers.length - 1);
        let r_ent = trap_makers[rnd_n];
        if(r_ent?.IsValid())
        {
            Instance.EntFireAtTarget({ target: r_ent, input: "ForceSpawn", value: "", delay: 0.00 });
        }
        trap_makers.splice(rnd_n, 1)
    }
})

Instance.OnScriptInput("TeleportPlayersNextFloor", ({ caller, activator }) => {
    if(activator?.IsValid() && activator?.GetClassName() == "player")
    {
        if(floor <= 5)
        {
            activator.Teleport({ position: {x: -527, y: 0, z: 13325}, angles: {pitch: 0, yaw: 0, roll: 0}});
        }
        if(floor > 5 && meat < 8)      // Normal Ending
        {
            activator.Teleport({ position: {x: 7488, y: -11264, z: -12974}, angles: {pitch: 0, yaw: 0, roll: 0}});
        }
        if(floor > 5 && meat >= 8)     // Secret Ending
        {
            activator.Teleport({ position: {x: -7200, y: -3352, z: -7748}, angles: {pitch: 0, yaw: 270, roll: 0}});
        }
    }
});

function GetRandomNumber(min, max ) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomBottle(items) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
        if (random < items[i].weight) {
            return items[i].value;
        }
        random -= items[i].weight;
    }
}

//               _           __             _      
//   /\/\   __ _(_)_ __     / /  ___   __ _(_) ___ 
//  /    \ / _` | | '_ \   / /  / _ \ / _` | |/ __|
// / /\/\ \ (_| | | | | | / /__| (_) | (_| | | (__ 
// \/    \/\__,_|_|_| |_| \____/\___/ \__, |_|\___|
//                                    |___/        

Instance.OnScriptInput("SpawnFloor", () => {
    ResetFloor();
    floor++
    if(floor <= floors_max - 1)
    {
        if(floor >= floors_min && floor<=floors_max)
        {
            if(isExtremeMode)
            {
                traps_percentage = 80;
            }
            if(floor > 3)
            {
                safezone_timer = 28;
                Instance.EntFireAtName({ name: "cmd", input: "Command", value: "say >> Zombie Cage will open in " + safezone_timer + " seconds <<", delay: 13.00 });
            }
            Instance.EntFireAtName({ name: "Map_Floor_Relay", input: "Trigger", value: "", delay: 0.00 });
            Instance.EntFireAtName({ name: "cmd", input: "Command", value: `say >> FLOOR ${floor} <<`, delay: 0.00 });
            Instance.EntFireAtName({ name: `Map_Floor${floor}_Case`, input: "PickRandom", value: "", delay: 0.00 });
            Instance.EntFireAtName({ name: `Map_FogController_Floor${floor}`, input: "Trigger", value: "", delay: 0.00 });
            Instance.EntFireAtName({ name: "Map_Chunk_Add_Case", input: "InValue", value: floor, delay: 0.00 });
            Instance.EntFireAtName({ name: "Map_Human_Item_Case", input: "InValue", value: floor, delay: 16.00 });
            Instance.EntFireAtName({ name: "Map_Floor_SafeZone_Doors", input: "Open", value: "", delay: 13.00 + safezone_timer });
            Instance.EntFireAtName({ name: "Map_Items_Toggle", input: "FireUser2", value: "", delay: 13.00 + safezone_timer });
            Instance.EntFireAtName({ name: "Map_Items_Ammunition", input: "Trigger", value: "", delay: 13.00 + safezone_timer });
            if(floor <= 3)
            {
                Instance.EntFireAtName({ name: "cmd", input: "Command", value: "say >> Zombie Cage will open in " + safezone_timer + " seconds <<", delay: 13.00 });
            }
            if(floor >= 3)
            {
                Instance.EntFireAtName({ name: "Map_Floor_Postprocessing", input: "Enable", value: "", delay: 0.00 });
            }
            if(floor == 1 && !isExtremeMode)
            {
                Instance.EntFireAtName({ name: "Map_Floor_DeleteTraps", input: "Trigger", value: "", delay: 13.00 });
            }
            if(floor > 1)
            {
                Instance.EntFireAtName({ name: "Map_Chunk_Branch", input: "Toggle", value: "", delay: 0.00 });
                Instance.EntFireAtName({ name: "Map_Store_Branch", input: "SetValue", value: "1", delay: 0.00 });
                Instance.EntFireAtName({ name: "Map_Store_BranchChat", input: "SetValue", value: "0", delay: 0.00 });
            }
        }

        // TRAILS
        if(floor == 1 && !isExtremeMode)
        {
            Instance.EntFireAtName({ name: "Item_Trail_Orange_Template", input: "KeyValue", value: "origin 310 308 13400", delay: 5.00 });
            Instance.EntFireAtName({ name: "Item_Trail_Orange_Template", input: "ForceSpawn", value: "", delay: 5.05 });
        }
        if(floor == 2 && !isExtremeMode)
        {
            Instance.EntFireAtName({ name: "Item_Trail_Green_Template", input: "KeyValue", value: "origin 310 308 13400", delay: 5.00 });
            Instance.EntFireAtName({ name: "Item_Trail_Green_Template", input: "ForceSpawn", value: "", delay: 5.05 });
        }

        // LIGHTNING STRIKES
        if(!isExtremeMode)
        {
            if(floor == 4)
            {
                Instance.EntFireAtName({ name: "Map_Floor_Lightning_Strike_Case", input: "PickRandomShuffle", value: "", delay: 13.00 });
            }
            if(floor == floors_max - 1)
            {
                Instance.EntFireAtName({ name: "Floor_Teleport", input: "Kill", value: "", delay: 13.00 });
                Instance.EntFireAtName({ name: "Map_Floor_CheckTeleported", input: "Trigger", value: "", delay: 13.00 });
                Instance.EntFireAtName({ name: "Map_WeatherEvent_Relay", input: "Trigger", value: "", delay: 13.00 });
            }
        }
        if(isExtremeMode)
        {
            Instance.EntFireAtName({ name: "Map_WeatherEvent_Relay", input: "Trigger", value: "", delay: 13.00 });
            if(floor == floors_max - 1)
            {
                Instance.EntFireAtName({ name: "Floor_Teleport", input: "Kill", value: "", delay: 13.00 });
                Instance.EntFireAtName({ name: "Map_Floor_CheckTeleported", input: "Trigger", value: "", delay: 13.00 });
            }
        }

        // ZOMBIE ITEMS SPAWN
        if(floor > 1)
        {
            Instance.EntFireAtName({ name: "Map_ZM_Item_Case", input: "ResetShuffle", value: "", delay: 0.00 });
        }
        if(floor <= 2)
        {
            Instance.EntFireAtName({ name: "Map_ZM_Item_Case", input: "PickRandomShuffle", value: "", delay: 13.00 });
        }
        if(floor > 2 && floor < 5)
        {
            Instance.EntFireAtName({ name: "Map_ZM_Item_Case", input: "PickRandomShuffle", value: "", delay: 13.00 });
            Instance.EntFireAtName({ name: "Map_ZM_Item_Case", input: "PickRandomShuffle", value: "", delay: 14.00 });
        }
        if(floor == 5)
        {
            Instance.EntFireAtName({ name: "Map_ZM_Item_Case", input: "PickRandomShuffle", value: "", delay: 13.00 });
            Instance.EntFireAtName({ name: "Map_ZM_Item_Case", input: "PickRandomShuffle", value: "", delay: 14.00 });
            Instance.EntFireAtName({ name: "Map_ZM_Item_Case", input: "PickRandomShuffle", value: "", delay: 15.00 });
        }
    }
    if(floor == floors_max)
    {
        if(meat < 8)        // Normal Ending
        {
            Instance.EntFireAtName({ name: "Template_ElevatorTeleport", input: "KeyValue", value: "origin 7504 -11264 -12984", delay: 0.00 });
            Instance.EntFireAtName({ name: "Template_ElevatorTeleport", input: "ForceSpawn", value: "", delay: 0.05 });
            Instance.EntFireAtName({ name: "Map_Floor_TeleportToEnd", input: "AddOutput", value: "OnStartTouch>!activator>KeyValue>origin 7488 -11264 -12974>0>-1", delay: 0.00 });
            Instance.EntFireAtName({ name: "Map_Floor_TeleportToEnd", input: "AddOutput", value: "OnStartTouch>!activator>KeyValue>angles 0 0 0>0>-1", delay: 0.00 });
        }
        if(meat >= 8)        // Secret Ending
        {
            Instance.EntFireAtName({ name: "Template_ElevatorTeleport", input: "KeyValue", value: "origin -7200 -3344 -7760", delay: 0.00 });
            Instance.EntFireAtName({ name: "Template_ElevatorTeleport", input: "KeyValue", value: "angles 0 90 0", delay: 0.05 });
            Instance.EntFireAtName({ name: "Template_ElevatorTeleport", input: "ForceSpawn", value: "", delay: 0.10 });
            Instance.EntFireAtName({ name: "Map_QuestionableEnding_Relay", input: "Trigger", value: "", delay: 0.00 });
            Instance.EntFireAtName({ name: "Map_Floor_TeleportToEnd", input: "AddOutput", value: "OnStartTouch>Map_Boss_Arena_ZM_Case>PickRandomShuffle>>0>-1", delay: 0.00 });
        }
    }
})

//    __                _       
//   /__\ ___  ___  ___| |_ ___ 
//  / \/// _ \/ __|/ _ \ __/ __|
// / _  \  __/\__ \  __/ |_\__ \
// \/ \_/\___||___/\___|\__|___/

function ResetFloor()
{
    players_in_elevator = 0;
}

function ResetScript()
{
    players_in_elevator = 0;
    meat = 0;
    floor = 0;
    floors_min = 1;
    floors_max = 6;
    safezone_timer = 23;
}