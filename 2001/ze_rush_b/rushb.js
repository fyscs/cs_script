import { Instance } from 'cs_script/point_script';

const script_ent_name = "rushb_script";
let script_ent = null;
let hud_ent_name = "map_hud";
let hud_ent = null;

const Lasers = [
    {
        start: "Laser1",
        end: "TrainLaser1",
        start_entity: null,
        end_entity: null
    },
    {
        start: "Laser2",
        end: "TrainLaser2",
        start_entity: null,
        end_entity: null
    },
    {
        start: "Laser3",
        end: "TrainLaser3",
        start_entity: null,
        end_entity: null
    },
    {
        start: "Laser4",
        end: "TrainLaser4",
        start_entity: null,
        end_entity: null
    },
    {
        start: "Laser5",
        end: "TrainLaser5",
        start_entity: null,
        end_entity: null
    },
    {
        start: "Laser6",
        end: "TrainLaser6",
        start_entity: null,
        end_entity: null
    },
    {
        start: "Laser7",
        end: "TrainLaser7",
        start_entity: null,
        end_entity: null
    },
    {
        start: "Laser8",
        end: "TrainLaser8",
        start_entity: null,
        end_entity: null
    },
    {
        start: "Laser9",
        end: "TrainLaser9",
        start_entity: null,
        end_entity: null
    },
    {
        start: "Laser11",
        end: "TrainLaser11",
        start_entity: null,
        end_entity: null
    },
    {
        start: "Laser12",
        end: "TrainLaser12",
        start_entity: null,
        end_entity: null
    },
    {
        start: "Laser13",
        end: "TrainLaser13",
        start_entity: null,
        end_entity: null
    },
    {
        start: "Laser14",
        end: "TrainLaser14",
        start_entity: null,
        end_entity: null
    },
    {
        start: "Laser15",
        end: "TrainLaser15",
        start_entity: null,
        end_entity: null
    },
    {
        start: "Laser16",
        end: "TrainLaser16",
        start_entity: null,
        end_entity: null
    },
    {
        start: "Laser17",
        end: "TrainLaser17",
        start_entity: null,
        end_entity: null
    },
    {
        start: "Laser18",
        end: "TrainLaser18",
        start_entity: null,
        end_entity: null
    },
    {
        start: "Laser19",
        end: "TrainLaser19",
        start_entity: null,
        end_entity: null
    },
];

const MiniGames = [
    {
        humans_pos: {
            x: -12011,
            y: -4627,
            z: -1690
        },
        zombies_pos: {
            x: -11371,
            y: -4627,
            z: -1690
        },
        checkRadius: 256,
        minigameTime: 25,
        minigame_f: "minigame_failed",
        minigame_s: "minigame_success",
        minigame_zm_f: "minigame_zm_failed",
        minigame_zm_s: "minigame_zm_success",
    },
    {
        humans_pos: {
            x: -2195,
            y: 5623,
            z: 2018
        },
        zombies_pos: {
            x: -4243,
            y: 5624,
            z: 2018
        },
        checkRadius: 1024,
        minigameTime: 68,
        minigame_f: "minigame2_failed",
        minigame_s: "minigame2_success",
        minigame_zm_f: "minigame2_zm_failed",
        minigame_zm_s: "minigame2_zm_success",
    },
    {
        humans_pos: {
            x: 3584,
            y: -4744,
            z: -3069
        },
        checkRadius: 300,
        minigameTime: 62,
        minigame_f: "minigame3_failed",
        minigame_s: "minigame3_success",
    }
]

let MiniGame = 0;
let MiniGame_Tick_Time = 0.01;
let MiniGame_Ticking = true;
let MiniGame_Duration = 0.00;
let lastTime = null;

const Laser_Damage = 54;
const LASER_INTERVAL = 0.10;
let isLaserActive = true;

Instance.OnRoundStart(() => {
    Ammo_Toggle = true;
    MiniGame = 0;
    isLaserActive = true;
    lastTime = null;
    MiniGame_Ticking = true;
    MiniGame_Duration = MiniGames[MiniGame].minigameTime;
    if(!script_ent?.IsValid())
    {
        script_ent = Instance.FindEntityByName(script_ent_name);
    }
    if(!hud_ent?.IsValid())
    {
        hud_ent = Instance.FindEntityByName(hud_ent_name);
    }
    for(let i = 0; i < Lasers.length; i++)
    {
        Lasers[i].start_entity = Instance.FindEntityByName(Lasers[i].start);
        Lasers[i].end_entity = Instance.FindEntityByName(Lasers[i].end);
    }
});

Instance.OnScriptInput( "StartLasers", () => {
    if(script_ent?.IsValid())
    {
        if(!isLaserActive)
        {
            return;
        }
        Instance.EntFireAtTarget({ target: script_ent, input: "RunScriptInput", value: "StartLasers", delay: LASER_INTERVAL });
        for(let i = 0; i < Lasers.length; i++)
        {
            const start_laser = Lasers[i].start_entity;
            const end_laser = Lasers[i].end_entity;
            if(start_laser?.IsValid() && end_laser?.IsValid())
            {
                const startPos = start_laser.GetAbsOrigin();
                const endPos = end_laser.GetAbsOrigin();
                let delta = CalculateDelta(startPos, endPos);
                let normalize = normalizeVector(delta);
                let distance = VectorDistance(startPos, endPos);
                let T_end_dir = {
                    x: normalize.x * distance,
                    y: normalize.y * distance,
                    z: normalize.z * distance,
                }
            
                const T_endPos = {
                    x: startPos.x + T_end_dir.x,
                    y: startPos.y + T_end_dir.y,
                    z: startPos.z + T_end_dir.z
                };
                Instance.DebugLine({ start: start_laser.GetAbsOrigin(), end: T_endPos, duration: LASER_INTERVAL, color: {r: 255, g: 0, b: 0} });
                let trace = Instance.TraceLine({ start: start_laser.GetAbsOrigin(), end: T_endPos, ignorePlayers: false });
                if(trace.hitEntity?.IsValid() && trace.hitEntity.GetClassName() == "player")
                {
                    trace.hitEntity.TakeDamage( { damage: Laser_Damage });
                }
            }
        }
    }
});

Instance.OnScriptInput( "StopLasers", () => {
    isLaserActive = false;
});

Instance.OnScriptInput( "StartMiniGame1", () => {
    MiniGame = 0;
    MiniGame_Duration = MiniGames[MiniGame]?.minigameTime ?? 0;
    MiniGame_Ticking = true;
    Instance.EntFireAtTarget({ target: script_ent, input: "RunScriptInput", value: "MiniGameCheckPlayers", delay: 0.00 });
});

Instance.OnScriptInput( "StartMiniGame2", () => {
    MiniGame = 1;
    MiniGame_Duration = MiniGames[MiniGame]?.minigameTime ?? 0;
    MiniGame_Ticking = true;
    Instance.EntFireAtTarget({ target: script_ent, input: "RunScriptInput", value: "MiniGameCheckPlayers", delay: 0.00 });
});

Instance.OnScriptInput( "StartMiniGame3", () => {
    MiniGame = 2;
    MiniGame_Duration = MiniGames[MiniGame]?.minigameTime ?? 0;
    MiniGame_Ticking = true;
    Instance.EntFireAtTarget({ target: script_ent, input: "RunScriptInput", value: "MiniGameCheckPlayers", delay: 0.00 });
});

Instance.OnScriptInput( "MiniGameCheckPlayers", () => {

    if(!MiniGame_Ticking)
    {
        return;
    }
    let players = GetMiniGameHZPlayers();
    Instance.DebugSphere({ center: MiniGames[MiniGame].humans_pos, radius: MiniGames[MiniGame].checkRadius, duration: MiniGame_Tick_Time, color: {r: 0, g: 255, b: 0} });
    let currentTime = Instance.GetGameTime();
    if(lastTime === null) 
    {
        lastTime = currentTime;
    }
    let deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    MiniGame_Duration -= deltaTime;
    if(players.humans.length <= 0 && MiniGames[MiniGame].minigame_f)
    {
        Instance.EntFireAtName({name: MiniGames[MiniGame].minigame_f, input: "Trigger", delay: 0.00});
        return;
    }
    if(players.zombies.length <= 0 && MiniGames[MiniGame].minigame_zm_f)
    {
        Instance.EntFireAtName({name: MiniGames[MiniGame].minigame_zm_f, input: "Trigger", delay: 0.00});
    }
    let messageLines = [];
    if(players.humans.length > 0) 
    {
        messageLines.push(`Humans: ${players.humans.length}`);
    }
    if(players.zombies.length > 0) 
    {
        messageLines.push(`Zombies: ${players.zombies.length}`);
    }

    messageLines.push(`Survive: ${formatTimer(MiniGame_Duration)}`);

    let message = messageLines.join('\n');
    ShowHudHint(message);
    Instance.DebugScreenText({ text: message, x: 625, y: 250, duration: 0.01, color: {r: 0, g: 255, b:255} });
    if(MiniGame_Duration <= 0.00)
    {
        if(players.humans.length <= 3)
        {
            let names = [];
            for(let i = 0; i < players.humans.length; i++)
            {
                const player = players.humans[i];
                const controller = player?.GetPlayerController();
                const name = controller?.GetPlayerName() ?? "null";
                names.push(name);
            }
            const playersName = names.join(", ");
            if(players.humans.length == 1)
            {
                Instance.ServerCommand(`say *** SOLO WIN! WINNER: ${playersName} ***`);
            }
            else if(players.humans.length == 2)
            {
                Instance.ServerCommand(`say *** DUO WIN! WINNERS: ${playersName} ***`);
            }
            else if(players.humans.length == 3)
            {
                Instance.ServerCommand(`say *** TRIO WIN! WINNERS: ${playersName} ***`);
            }
        }
        else
        {
            Instance.ServerCommand(`say *** GOOD JOB, YOU DID IT! ***`);
        }
        Instance.EntFireAtName({name: MiniGames[MiniGame].minigame_s, input: "Trigger", delay: 0.00});
        if(players.zombies.length > 0 && MiniGames[MiniGame].minigame_zm_s)
        {
            Instance.EntFireAtName({name: MiniGames[MiniGame].minigame_zm_s, input: "Trigger", delay: 0.00});
        }
        lastTime = null;
        MiniGame_Ticking = false;
        return;
    }
    Instance.EntFireAtTarget({ target: script_ent, input: "RunScriptInput", value: "MiniGameCheckPlayers", delay: MiniGame_Tick_Time });
});

function GetMiniGameHZPlayers()
{
    let humans = [];
    let zombies = [];
    let players = Instance.FindEntitiesByClass("player");
    for(let i = 0; i < players.length; i++)
    {
        let player = players[i];
        if(player?.IsValid() && player?.GetHealth() > 0) 
        {
            let team = player.GetTeamNumber();
            if(team == 3 && MiniGames[MiniGame].humans_pos && isPlayerInRadius(player.GetAbsOrigin(), MiniGames[MiniGame].humans_pos, MiniGames[MiniGame].checkRadius)) 
            {
                humans.push(player);
            }
            else if(team == 2 && MiniGames[MiniGame].zombies_pos && isPlayerInRadius(player.GetAbsOrigin(), MiniGames[MiniGame].zombies_pos, MiniGames[MiniGame].checkRadius)) 
            {
                zombies.push(player);
            }
        }
    }
    return {humans: humans, zombies: zombies}
}

function ShowHudHint(message)
{
    if(!hud_ent?.IsValid())
    {
        return;
    }
    let players = Instance.FindEntitiesByClass("player");
    for(let i = 0; i < players.length; i++)
    {
        let player = players[i];
        if(player?.IsValid())
        {
            Instance.EntFireAtTarget({ target: hud_ent, input: "SetMessage", value: message, delay: 0.00 });
            Instance.EntFireAtTarget({ target: hud_ent, input: "ShowHudHint", activator: player, delay: 0.00 });
        }
    }
}

function formatTimer(seconds) 
{
    seconds = Math.max(0, seconds);

    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 100);

    const pad = (n) => n.toString().padStart(2, '0');

    return `${pad(minutes)}:${pad(secs)}:${pad(millis)}`;
}

function isPlayerInRadius(playerPos, centerPos, radius) {
    const dx = playerPos.x - centerPos.x;
    const dy = playerPos.y - centerPos.y;
    const dz = playerPos.z - centerPos.z;

    const distanceSquared = dx * dx + dy * dy + dz * dz;
    return distanceSquared <= radius * radius;
}

function VectorDistance(vec1, vec2) 
{
    const dx = vec1.x - vec2.x;
    const dy = vec1.y - vec2.y;
    const dz = vec1.z - vec2.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function normalizeVector(vec) 
{
    const magnitude = Math.sqrt(vec.x ** 2 + vec.y ** 2 + vec.z ** 2);

    if (magnitude === 0) {
        return { x: 0, y: 0, z: 0 };
    }
  
    return {
        x: vec.x / magnitude,
        y: vec.y / magnitude,
        z: vec.z / magnitude
    };
}

function CalculateDelta(pos1, pos2) 
{
  return {
    x: pos2.x - pos1.x,
    y: pos2.y - pos1.y,
    z: pos2.z - pos1.z
  };
}

/////////////////////////////////////////////////////////////////////////

let Ammo_Toggle = true;
let Ammo_Tick = 0.10;

Instance.OnScriptInput("AddAmmo", () => {
    let players = Instance.FindEntitiesByClass("player");
    if(players.length > 0)
    {
        if(Ammo_Toggle && script_ent?.IsValid())
        {
            for(let i = 0; i < players.length; i++)
            {
                let player = players[i];
                if(player?.IsValid() && player?.GetHealth() > 0 && player?.GetTeamNumber() == 3)
                {
                    if(isPlayerInRadius(player.GetAbsOrigin(), MiniGames[2].humans_pos, MiniGames[2].checkRadius))
                    {
                        let player_weapon = player.GetActiveWeapon();
                        Instance.EntFireAtTarget({ target: player_weapon, input: "SetAmmoAmount", value: "150", delay: 0.00 });
                    }
                }
            }
            Instance.EntFireAtTarget({ target: script_ent, input: "RunScriptInput", value: "AddAmmo", delay: Ammo_Tick });
        }
    }
});

Instance.OnScriptInput("StopAmmo", () => {
    Ammo_Toggle = false;
});

/////////////////////////////////////////////////////////////////////////

Instance.OnScriptInput("PickUpFidget", ({activator}) => {
    activator?.SetEntityName("item_Fidget");
});

Instance.OnScriptInput("PickUpJihad", ({activator}) => {
    activator?.SetEntityName("item_Jihad");
});

Instance.OnScriptInput("PickUpMoney", ({activator}) => {
    activator?.SetEntityName("item_Money");
});

Instance.OnScriptInput("PickUpWall", ({activator}) => {
    activator?.SetEntityName("item_Wall");
});

Instance.OnScriptInput("SetPlayerName", ({activator}) => {
    activator?.SetEntityName("player");
});

Instance.OnScriptInput("RemoveKnife", ({activator, caller}) => {
    let player = activator;
    if(player?.IsValid() && player?.GetTeamNumber() == 2 && !player?.GetEntityName().includes("item_"))
    {
        let player_c = player?.GetPlayerController();
        let player_p = player_c?.GetPlayerPawn();
        let weapon_knife = player_p?.FindWeaponBySlot(2);
        if(weapon_knife)
        {
            weapon_knife.Remove();
            caller.Remove();
        }
    }
});

/////////////////////////////////////////////////////////////////////////

Instance.OnScriptInput("ResetSpeed", ({caller, activator}) => {
    activator.Teleport({velocity: {x: 0, y: 0, z: 0}});
});

/////////////////////////////////////////////////////////////////////////

function SetHealthCt(health, activator) {
    let player = activator;
    if (player?.IsValid() && player?.GetTeamNumber() === 3) {
        player.SetHealth(health);
    }
}

function SetHealthT(health, activator) {
    let player = activator;
    if (player?.IsValid() && player?.GetTeamNumber() === 2) {
        player.SetHealth(health);
    }
}

Instance.OnScriptInput("hp_vendingmachine", ({ activator }) => {
    SetHealthCt(175, activator);
});

Instance.OnScriptInput("zm_hp_jihad", ({ activator }) => {
    SetHealthT(50000, activator);
});

Instance.OnScriptInput("zm_hp_fidget", ({ activator }) => {
    SetHealthT(50000, activator);
});

/////////////////////////////////////////////////////////////////////////
