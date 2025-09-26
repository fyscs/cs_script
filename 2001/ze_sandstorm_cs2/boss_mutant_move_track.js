import { Instance } from "cs_script/point_script";

let TARGET = null;
let STOP_M = false;

let BOSS_MOVE_S = true;

let Retarget_Time = 5.00;

let b_ZOffset = 32;
let b_MaxZOffset = 64;
let b_MaxTDist = 4096;
let b_MaxDistToPl = 16;

let b_ScriptEnt = null;
let b_ScriptEnt_name = "mutant_boss_script";

let b_PhysBox = null;
let b_PhysBox_name = "mutant_hitbox";

let b_BossTrain = null;
let b_BossTrain_name = "CY01Physic"; 

let b_Fpath = null;
let b_Fp_name = "mutant_first_path";

let b_Spath = null;
let b_Sp_name = "mutant_sec_path";

let b_Model = null;
let b_Model_name = "mutant_boss";

let b_Speed = 260;
let b_SaveSpeed = b_Speed;

let Refire_Time_Base = 0.01;
let Time_N = 0.00;

let speed_turning = 300;
let ang_rot_limit = 10;

let lastTime = null;

Instance.OnRoundStart(() => {
    ResetScript();
    Instance.EntFireAtName(b_ScriptEnt_name, "RunScriptInput", "SetBossEntities", 0.50);
    if(b_BossTrain?.IsValid())
    {
        Instance.EntFireAtTarget(b_BossTrain, "SetSpeedReal", ""+b_Speed, 0.00);
        Instance.EntFireAtTarget(b_BossTrain, "SetMaxSpeed", ""+b_Speed, 0.00);
    }
});

Instance.OnScriptInput("StartMove", () => {
    if(!BOSS_MOVE_S)
    {
        return;
    }

    let currentTime = Instance.GetGameTime();
    if(lastTime === null) 
    {
        lastTime = currentTime;
    }

    let deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    Instance.EntFireAtTarget(b_ScriptEnt, "RunScriptInput", "StartMove", Refire_Time_Base);

    if(Time_N >= Retarget_Time || 
       TARGET == null ||
       !IsValidEntityTeam(TARGET, 3) ||
       TargetPick(TARGET?.GetAbsOrigin()) < 0)
    {
        Instance.EntFireAtTarget(b_BossTrain, "Stop", "", 0.00);
        FindTarget();
        return;  
    }
    else
    {
        Time_N += deltaTime;
    }
    if(STOP_M)
    {
        Instance.EntFireAtTarget(b_BossTrain, "Stop", "", 0.00);
        return;
    }
    
    let gto = TARGET.GetAbsOrigin();
    let npc_m_gto = b_Model.GetAbsOrigin()
    let bosst_pos = b_BossTrain.GetAbsOrigin();
    let tm_ang = GetYawFVect2D(gto, npc_m_gto)
    let setg_rangd = SetGraduallyAng(tm_ang, b_Model)
    let target_t = {
        startpos: {
            x: bosst_pos.x,
            y: bosst_pos.y,
            z: bosst_pos.z + b_ZOffset
        },
        endpos: {
            x: bosst_pos.x,
            y: bosst_pos.y,
            z: bosst_pos.z - b_MaxZOffset
        }
    }
    let trace_l = Instance.GetTraceHit(target_t.startpos, target_t.endpos, {ignoreEnt: null, interacts: 1, sphereRadius: 0});
    let dist_z = VectorDistance(target_t.startpos, trace_l.end)
    if(dist_z <= b_MaxZOffset)
    {
        b_BossTrain.Teleport({x: bosst_pos.x, y: bosst_pos.y, z: trace_l.end.z + 8}, null, null);
    }
    if(setg_rangd > 0 && setg_rangd <= ang_rot_limit || setg_rangd < 0 && setg_rangd >= -ang_rot_limit)
    {
        let dist_pb = VectorDistance(npc_m_gto, gto);
        if(dist_pb > b_MaxDistToPl)
        {
            b_Spath.Teleport({x: gto.x, y: gto.y, z: b_Fpath.GetAbsOrigin().z}, null, null);
            Instance.EntFireAtTarget(b_BossTrain, "StartForward", "", 0.00);
        }
        else
        {
            Instance.EntFireAtTarget(b_BossTrain, "Stop", "", 0.00);
        }  
    }   
    else
    {
        Instance.EntFireAtTarget(b_BossTrain, "Stop", "", 0.00);
    }
});

function FindTarget()
{
    if(!BOSS_MOVE_S)
    {
        return;
    }
    let players = Instance.FindEntitiesByClass("player");
    if(players.length > 0)
    {
        Time_N = 0.00
        let valid_pl = [];
        for(let i = 0; i < players.length; i++)
        {
            if(IsValidEntityTeam(players[i], 3) && TargetPick(players[i].GetAbsOrigin()) > 0)
            {
                valid_pl.push(players[i]);
            }
        }
        
        if(valid_pl.length > 0)
        {
            TARGET = valid_pl[getRandomInt(0, valid_pl.length - 1)];
        }
    }
}

function SetGraduallyAng(ang_t, ent)
{
    let ang_y = ent.GetAbsAngles().yaw
    let ang_dif = AngleDiff( ang_t, ang_y );
    if(speed_turning > 1000)
    {
        speed_turning = 1000;
    }
    else if(speed_turning < 100)
    {
        speed_turning = 100;
    }
    let add_gs = speed_turning * Refire_Time_Base;
    while (ang_y < -180) 
    {
        ang_y = ang_y + 360;
    }
    while (ang_y > 180)
    {
        ang_y = ang_y - 360;
    }
    if(ang_dif > add_gs)
    {
        ent.Teleport(null, {pitch: ent.GetAbsAngles().pitch, yaw: Math.round(ang_y + add_gs), roll: ent.GetAbsAngles().roll}, null);
    }
    else if(ang_dif < -add_gs)
    {
        ent.Teleport(null, {pitch: ent.GetAbsAngles().pitch, yaw: Math.round(ang_y - add_gs), roll: ent.GetAbsAngles().roll}, null);
    }
    return ang_dif
}

function TargetPick(pos)
{
    if(b_PhysBox == null)
    {
        return -1;
    }
    let boss_pos = b_Model.GetAbsOrigin();
    let delta = {
        x: pos.x - boss_pos.x,
        y: pos.y - boss_pos.y,
        z: pos.z - boss_pos.z
    };
    let length = Math.sqrt(delta.x ** 2 + delta.y ** 2 + delta.z ** 2);
    let normalized = {
        x: delta.x / length,
        y: delta.y / length,
        z: delta.z / length
    };
    let target_t = {
        startpos: {
            x: boss_pos.x,
            y: boss_pos.y,
            z: boss_pos.z + b_ZOffset
        },
        endpos: {
            x: boss_pos.x + normalized.x * b_MaxTDist,
            y: boss_pos.y + normalized.y * b_MaxTDist,
            z: boss_pos.z + b_ZOffset + normalized.z * b_MaxTDist
        }
    }
    let b_Trace_line = Instance.GetTraceHit(target_t.startpos, target_t.endpos, {ignoreEnt: b_PhysBox, interacts: 0, sphereRadius: 0});
    
    let dist_tb = VectorDistance(pos, b_Model.GetAbsOrigin());
    let hit_mdist = VectorDistance(b_Trace_line.end, b_Model.GetAbsOrigin());
    let dist_be = hit_mdist - dist_tb;
    if(b_Trace_line.hitEnt?.GetClassName() == "func_button")
    {
        return 1;
    }
    return dist_be;
}

Instance.OnScriptInput("SetBossEntities", () => {
    if(b_PhysBox == null)
    {
        let physbox = Instance.FindEntityByName(b_PhysBox_name);
        if(physbox?.IsValid())
        {
            b_PhysBox = physbox;
        }
        else
        {
            Instance.Msg("Can't Find: "+b_PhysBox_name);
        }
    }
    if(b_Fpath == null)
    {
        let first_pathtrack = Instance.FindEntityByName(b_Fp_name);
        if(first_pathtrack?.IsValid())
        {
            b_Fpath = first_pathtrack;
        }
        else
        {
            Instance.Msg("Can't Find: "+b_Fp_name);
        }
    }
    if(b_Spath == null)
    {
        let second_pathtrack = Instance.FindEntityByName(b_Sp_name);
        if(second_pathtrack?.IsValid())
        {
            b_Spath = second_pathtrack;
        }
        else
        {
            Instance.Msg("Can't Find: "+b_Sp_name);
        }
    }
    if(b_BossTrain == null)
    {
        let boss_train = Instance.FindEntityByName(b_BossTrain_name);
        if(boss_train?.IsValid())
        {
            b_BossTrain = boss_train;
        }
        else
        {
            Instance.Msg("Can't Find: "+b_BossTrain_name);
        }
    }
    if(b_ScriptEnt == null)
    {
        let boss_script = Instance.FindEntityByName(b_ScriptEnt_name);
        if(boss_script?.IsValid())
        {
            b_ScriptEnt = boss_script;
        }
        else
        {
            Instance.Msg("Can't Find: "+b_ScriptEnt_name);
        }
    }
    if(b_Model == null)
    {
        let boss_model = Instance.FindEntityByName(b_Model_name);
        if(boss_model?.IsValid())
        {
            b_Model = boss_model;
        }
        else
        {
            Instance.Msg("Can't Find: "+b_Model_name);
        }
    }
});

function ResetScript()
{
    TARGET = null;
    STOP_M = false;
    BOSS_MOVE_S = true;
    b_ScriptEnt = null;
    b_PhysBox = null;
    b_BossTrain = null;
    b_Fpath = null;
    b_Spath = null;
    b_Model = null;
    b_Speed = b_SaveSpeed;
}

Instance.OnScriptInput("ResetScript", () => {
    TARGET = null;
    STOP_M = false;
    BOSS_MOVE_S = true;
    b_ScriptEnt = null;
    b_PhysBox = null;
    b_BossTrain = null;
    b_Fpath = null;
    b_Spath = null;
    b_Model = null;
    b_Speed = b_SaveSpeed;
    lastTime = null;
});

function VectorDistance(vec1, vec2) 
{
    const dx = vec1.x - vec2.x;
    const dy = vec1.y - vec2.y;
    const dz = vec1.z - vec2.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function GetYawFVect2D(a, b) {
    const deltaX = a.x - b.x;
    const deltaY = a.y - b.y;
    const yaw = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
    return yaw;
}

function AngleDiff(angle1, angle2) 
{
    let diff = angle1 - angle2;

    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;

    return diff;
}

function IsValidEntityTeam(ent, t)
{
    if(ent?.IsValid() && ent?.GetHealth() > 0 && ent?.GetTeamNumber() == t)
    {
        return true;
    }
    return false;
}

function getRandomInt(min, max) 
{
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

Instance.OnScriptInput("DisableMove", () => {
    STOP_M = true;
});

Instance.OnScriptInput("EnableMove", () => {
    STOP_M = false;
});

Instance.OnScriptInput("BossKill", () => {
    BOSS_MOVE_S = false;
    if(b_PhysBox?.IsValid())
    {
        b_PhysBox.Teleport({x: 0, y: 0, z: 0}, null, null);
    }
    Instance.EntFireAtTarget(b_ScriptEnt, "RunScriptInput", "ResetScript", 0.10);
});
