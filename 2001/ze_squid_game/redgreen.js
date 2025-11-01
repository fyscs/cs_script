import { Instance } from "cs_script/point_script";
//  this.Trigger_Origin = {x: 3552, y: -1536, z: 64}
//         this.Trigger_BBox_Max = {x: 2016, y: 1536, z: 128};
//         this.Trigger_BBox_Min = {x: -2016,y:  -1536, z: -128};
const TICKRATE = 0.1;
const MAX_PLAYERS = 63;


let isActive = false;
let isUsed = true;
let PLAYERS = [];
const redgreen_script_ent = "redgreen_script";
const awp_sound = "awp_sound";

class Trigger {
    constructor() {
        this.Trigger_Origin = {x: 3552, y: -1536, z: 61}
        this.World_bbox_max = {x: 5568, y: 0, z: 128};
        this.World_bbox_min = {x: 1536,y: -3072, z: -128};


        this.Trigger_BBox_Min = {
            x: this.World_bbox_min.x - this.Trigger_Origin.x,
            y: this.World_bbox_min.y - this.Trigger_Origin.y,
            z: this.World_bbox_min.z - this.Trigger_Origin.z,
        };
        this.Trigger_BBox_Max = {
            x: this.World_bbox_max.x - this.Trigger_Origin.x,
            y: this.World_bbox_max.y - this.Trigger_Origin.y,
            z: this.World_bbox_max.z - this.Trigger_Origin.z,
        };
    }  


    PlayerInBounding(player_origin) {


        const worldMin = {
            x: this.Trigger_Origin.x + this.Trigger_BBox_Min.x,
            y: this.Trigger_Origin.y + this.Trigger_BBox_Min.y,
            z: this.Trigger_Origin.z + this.Trigger_BBox_Min.z,
        };


        const worldMax = {
            x: this.Trigger_Origin.x + this.Trigger_BBox_Max.x,
            y: this.Trigger_Origin.y + this.Trigger_BBox_Max.y,
            z: this.Trigger_Origin.z + this.Trigger_BBox_Max.z,
        };

    //Instance.DebugBox({ mins: worldMin, maxs: worldMax, duration: 60.00, color: {r: 255, g: 0, b: 0} });


    const inside =
        player_origin.x >= worldMin.x && player_origin.x <= worldMax.x &&
        player_origin.y >= worldMin.y && player_origin.y <= worldMax.y &&
        player_origin.z >= worldMin.z && player_origin.z <= worldMax.z;


        return inside;
    }
}
class Player {
    constructor(slot, pawn, origin, angles) {
        this.slot = slot;
        this.pawn = pawn;
        this.origin = origin;
        this.angles = angles;
    }
    CompareOrigin(new_origin) {
    if (this.origin) {
        const delta = {
            x: this.origin.x - new_origin.x,
            y: this.origin.y - new_origin.y,
            z: this.origin.z - new_origin.z,
        }
        if (delta.x === 0 && delta.y === 0 && delta.z === 0) {
            return true;
        } else {
            return false;
        }
    } else {
        return null;
    }
    }
    CompareOrigin2(new_origin_eyes)
    {
        if (this.angles) 
        {
            const yawDiff = Math.abs(((this.angles.yaw - new_origin_eyes.yaw + 180) % 360) - 180);
            const pitchDiff = Math.abs(((this.angles.pitch - new_origin_eyes.pitch + 180) % 360) - 180);

            if (yawDiff <= 0.12 && pitchDiff <= 0.12) 
            {
                return true;
            }
            else 
            {
               return false;
            }
        } 
        else
        {
            return null;
        }
    }
    
    KillPlayer() {
        if (this.pawn && this.pawn?.IsValid())
        {
            this.pawn?.TakeDamage({damage: 99999});
            Instance.EntFireAtName({ name: awp_sound, input: "StartSound", delay: 0.01 });
        }
        else
        {
            return;
        }
    }
}


Instance.OnRoundStart(() => {
    isActive = false;
    isUsed = true;
    PLAYERS.length = 0;
});


Instance.OnScriptInput("StartCheck", () => {
    if (!isUsed || !isActive)
    {
        return;
    } 
    PLAYERS.length = 0;
    const trigger = new Trigger();
    const players = Instance.FindEntitiesByClass("player");
    if(players.length > 0)
    {
        for (const p of players) 
        {
            if(p && p?.IsValid() && p?.GetHealth() > 0)
            {
                const origin = p.GetAbsOrigin();
                const angles = p.GetEyeAngles();
                if (trigger.PlayerInBounding(origin)) 
                {
                    //Instance.Msg(`${p?.GetPlayerController()?.GetPlayerName()} in Trigger`);
                    PLAYERS.push(new Player(p, p?.GetPlayerController()?.GetPlayerPawn(), origin,angles));
                }
            }
        }
    }
    Instance.EntFireAtName({ name: redgreen_script_ent, input: "runscriptinput", value: "ComparePos", delay: 0.02 });
});

Instance.OnScriptInput("ComparePos", () => {


    if (PLAYERS.length === 0) 
    {
        Instance.Msg("NO PLAYERS EXIST");
    }
    else
    {
        for (const player of PLAYERS) 
        {
            if (!player.pawn || !player.pawn?.IsValid()) continue;
            const current_origin = player.pawn.GetAbsOrigin();
            const current_eyes_origin = player.pawn.GetEyeAngles();
            if (!player.CompareOrigin(current_origin) || !player.CompareOrigin2(current_eyes_origin)) 
            {
                player.KillPlayer();
            }
        }
    }
    Instance.EntFireAtName({ name: redgreen_script_ent, input: "runscriptinput", value: "StartCheck", delay: TICKRATE });
});




Instance.OnScriptInput("Start", () => {
    if (!isActive)
    {
        isActive = true;
        Instance.EntFireAtName({ name: redgreen_script_ent, input: "runscriptinput", value: "StartCheck", delay: 0.00 });
    }   
});
Instance.OnScriptInput("Stop", () => {
    if (isActive)
    {
        isActive = false;
    }
});
Instance.OnScriptInput("End", () => {
    if (isUsed)
    {
        isUsed = false;
        Instance.Msg("Script end");
    }
});
Instance.OnScriptInput("Reset", () => {
    isActive = true;
    isUsed = true;
    Instance.Msg("Script reset");
});