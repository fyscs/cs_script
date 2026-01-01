import { Instance } from "cs_script/point_script";

//const SKIN = "characters/models/exg/chrisan/mizuki/mizuki.vmdl";

const SKINS_LIST = [
    { number: 1, path: "characters/models/exg/kukuka/doroz/doroz.vmdl" },                       // I'M SO SORRY FOR TAKING THIS SKIN
    { number: 2, path: "characters/models/exg/kx/kikyonui/kikyonui.vmdl" },                     // I'M SO SORRY FOR TAKING THIS SKIN
    { number: 3, path: "characters/exg/10011/10011.vmdl" },                                     // I'M SO SORRY FOR TAKING THIS SKIN
    { number: 4, path: "characters/models/kolka/stalker_models/bandit_mask/bandit_mask.vmdl" }  // I'M SO SORRY FOR TAKING THIS SKIN
]

const PlayerInstancesMap = new Map();
class Player {
    constructor(player, controller, name, slot)
    {
        this.player = player;
        this.controller = controller;
        this.player_name = name;
        this.slot = slot;
        this.Mapper = false;
        this.Vip = false;
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

let isExtremeMode = false;

let players_in_elevator = 0;
let meat = 0;
let floor = 0;
let floors_min = 1;
let floors_max = 6;
let safezone_timer = 23;

Instance.OnRoundStart(() => {
    ResetScript();
    Instance.EntFireAtName({ name: "Map_Floor_Postprocessing", input: "Disable", value: "", delay: 0.00 });
    if(isExtremeMode)
    {
        Instance.EntFireAtName({ name: "Map_Extreme_Relay", input: "Trigger", value: "", delay: 0.00 });
    }
})

Instance.OnRoundEnd(() => {
    ResetScript();
})

Instance.OnBeforePlayerDamage((event) => {
    let inflictor = event.inflictor;
    if (inflictor?.GetClassName() == "prop_physics" || inflictor?.GetClassName() == "prop_physics_override" || inflictor?.GetClassName() == "func_physbox") {
        let damage = 0;
        return { damage };
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
        } 
        else 
        {
            PlayerInstancesMap.set(player_slot, new Player(player, player_controller, player_name, player_slot));
        }
    }
});

Instance.OnPlayerChat((event) => {
    let player_controller = event.player
    if (!player_controller?.IsValid() || player_controller == undefined || !player_controller.GetPlayerPawn()?.IsValid() || !player_controller.IsAlive()) {
        return;
    }
    const player_slot = player_controller?.GetPlayerSlot();
    const inst = PlayerInstancesMap.get(player_slot);
    const player_text = event.text.toLowerCase();
    if(player_text.includes("!m_extreme") && inst.Mapper)
    {
        const text = player_text.split(' ');
        const bool = Number(text[1]);
        if(!Number.isNaN(bool) && bool == 0)
        {
            isExtremeMode = false;
        }
        if(!Number.isNaN(bool) && bool == 1)
        {
            isExtremeMode = true;
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
    if(player_text.includes("!m_speed") && inst.Mapper)
    {
        const text = player_text.split(' ');
        const speed = Number(text[1]);
        if(!Number.isNaN(speed) && speed >= 0)
        {
            Instance.EntFireAtTarget({ target: inst.player, input: "KeyValue", value: `speed ${text[1]}` });
        }
    }
    if(player_text.includes("!m_gravity") && inst.Mapper)
    {
        const text = player_text.split(' ');
        const speed = Number(text[1]);
        if(!Number.isNaN(speed) && speed >= 0)
        {
            Instance.EntFireAtTarget({ target: inst.player, input: "KeyValue", value: `gravity ${text[1]}` });
        }
    }
});

Instance.OnPlayerDisconnect((event) => {
    PlayerInstancesMap.delete(event.playerSlot);
});

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

Instance.OnScriptInput("TestMapper", ({caller, activator}) => {
    if(activator)
    {
        const player = activator;
        const player_controller = player?.GetPlayerController();
        const player_slot = player_controller?.GetPlayerSlot();
        const inst = PlayerInstancesMap.get(player_slot);
        if(inst) 
        {
            Instance.Msg(`player ${player_controller?.GetPlayerName()} is Mapper: ${inst.Mapper}`);
        }
    }
});

Instance.OnScriptInput("PlayerInsideElevator", () => {
    players_in_elevator++
})

Instance.OnScriptInput("PlayerOutsideElevator", () => {
    players_in_elevator--
})

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
})

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
    if(meat == 8)
    {
        Instance.EntFireAtName({ name: "cmd", input: "Command", value: `say >> ...? <<`, delay: 3.00 });
    }
})

Instance.OnScriptInput("SpawnFloor", () => {
    ResetFloor();
    floor++
    if(floor <= floors_max - 1)
    {
        if(floor >= floors_min && floor<=floors_max)
        {
            // Main Logic for Floor Spawning
            
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
            if(floor > 3)
            {
                safezone_timer = 28;
                Instance.EntFireAtName({ name: "cmd", input: "Command", value: "say >> Zombie Cage will open in " + safezone_timer + " seconds <<", delay: 13.00 });
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
            if(floor == 5)
            {
                Instance.EntFireAtName({ name: "Floor_Teleport", input: "Kill", value: "", delay: 13.00 });
                Instance.EntFireAtName({ name: "Map_Floor_CheckTeleported", input: "Trigger", value: "", delay: 13.00 });
                Instance.EntFireAtName({ name: "Map_WeatherEvent_Relay", input: "Trigger", value: "", delay: 13.00 });
            }
        }
        if(isExtremeMode)
        {
            Instance.EntFireAtName({ name: "Map_WeatherEvent_Relay", input: "Trigger", value: "", delay: 13.00 });
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
