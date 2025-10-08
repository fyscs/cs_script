import { Instance } from "cs_script/point_script";

let h_Heal = 200;
let h_Armor = 100;
let h_Button = "heal_button";
let h_Script = "heal_script"
let h_mAmmo = 150;
let h_Radius = 256;
let h_Duration = 8.00;
let h_sDuration = h_Duration;
let h_Tick = 0.01;

const Player_M = new Map();
let lastTime = null;

Instance.OnRoundStart(() => {
    lastTime = null;
});

Instance.OnScriptInput("Heal", () => {
    let button_h = Instance.FindEntityByName(h_Button);
    let players = Instance.FindEntitiesByClass("player");
    if(players.length > 0 && button_h?.IsValid())
    {
        if(h_Duration > 0.00)
        {
            let currentTime = Instance.GetGameTime();
            if(lastTime === null) 
            {
                lastTime = currentTime;
            }

            let deltaTime = currentTime - lastTime;
            lastTime = currentTime;
            // Instance.DebugSphere(button_h.GetAbsOrigin(), h_Radius, deltaTime, {r: 0, g: 255, b: 0});
            for(let i = 0; i < players.length; i++)
            {
                let player = players[i];
                if(IsValidEntityTeam(player, 3))
                {
                    if(VectorDistance(player.GetAbsOrigin(), button_h.GetAbsOrigin()) <= h_Radius)
                    {
                        Instance.EntFireAtTarget({ target: player, input: "SetDamageFilter", value: "Block_ZM_Dmg", delay: 0.00 });
                        Instance.EntFireAtTarget({ target: player, input: "IgniteLifetime", value: "0", delay: 0.00 });
                        player.SetHealth(h_Heal);
                        player.SetArmor(h_Armor);
                        let player_weapon = player.GetActiveWeapon();
                        Instance.EntFireAtTarget({ target: player_weapon, input: "SetAmmoAmount", value: ""+h_mAmmo, delay: 0.00 });
                        Player_M.set(player, player);
                    }
                    let player_h = Player_M.get(player);
                    if(player_h?.IsValid())
                    {
                        if(VectorDistance(player_h.GetAbsOrigin(), button_h.GetAbsOrigin()) > h_Radius)
                        {
                            Instance.EntFireAtTarget({ target: player_h, input: "SetDamageFilter", value: "", delay: 0.00 });
                            Player_M.delete(player_h);
                        }
                    }
                }
            }
            h_Duration -= deltaTime;
            Instance.EntFireAtName({ name: h_Script, input: "RunScriptInput", value: "Heal", delay: h_Tick });
        }
        else
        {
            ClearDamageFilter();
        }
    }
});

function ClearDamageFilter()
{
    for(const [key, value] of Player_M) 
    {
        if(value?.IsValid())
        {
            Instance.EntFireAtTarget({ target: value, input: "SetDamageFilter", value: "", delay: 0.00 });
        }
        
    }
    Player_M.clear();
    h_Duration = h_sDuration;
    lastTime = null;
}

function IsValidEntityTeam(ent, t)
{
    if(ent?.IsValid() && ent?.GetHealth() > 0 && ent?.GetTeamNumber() == t)
    {
        return true;
    }
    return false;
}

function VectorDistance(vec1, vec2) 
{
    const dx = vec1.x - vec2.x;
    const dy = vec1.y - vec2.y;
    const dz = vec1.z - vec2.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
