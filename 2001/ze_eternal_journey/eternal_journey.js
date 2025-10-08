import { Instance } from "cs_script/point_script";

const InPuts = [
    ["level_relay_0", "OnTrigger", "start_dest", "origin -14432 -13184 249.291", TeleportObject, 0.00, -1],
    ["level_relay_1", "OnTrigger", "start_dest", "origin -14432 -13184 249.291", TeleportObject, 0.00, -1],

    ["item_spawner_l1", "OnTrigger", "", "origin -6296 -10088 264 fire_temp", SpawnItems, 0.00, -1],
    ["item_spawner_l1", "OnTrigger", "", "origin -9512 -9872 128 freeze_temp", SpawnItems, 0.00, -1],
    ["item_spawner_l1", "OnTrigger", "", "origin -11136 -10188 148 heal_temp", SpawnItems, 0.00, -1],
    ["item_spawner_l1", "OnTrigger", "", "origin -12187.2 -9734 116 tornado_temp", SpawnItems, 0.00, -1],
    ["item_spawner_l1", "OnTrigger", "", "origin -13241.5 -6273.1 202 earth_temp", SpawnItems, 0.00, -1],

    ["item_spawner_l1_1", "OnTrigger", "", "origin -6296 -10088 264 tornado_temp", SpawnItems, 0.00, -1],
    ["item_spawner_l1_1", "OnTrigger", "", "origin -9512 -9872 128 freeze_temp", SpawnItems, 0.00, -1],
    ["item_spawner_l1_1", "OnTrigger", "", "origin -11136 -10188 148 earth_temp", SpawnItems, 0.00, -1],
    ["item_spawner_l1_1", "OnTrigger", "", "origin -12187.2 -9734 116 fire_temp", SpawnItems, 0.00, -1],
    ["item_spawner_l1_1", "OnTrigger", "", "origin -13241.5 -6273.1 202 heal_temp", SpawnItems, 0.00, -1],

    ["item_spwn1_zm", "OnTrigger", "", "origin -14944 -13855.9 272 zmfire_temp", SpawnItems, 0.00, -1],
    ["item_spwn1_zm", "OnTrigger", "", "origin -14944 -12512 272 zmfreeze_temp", SpawnItems, 0.00, -1],
    ["item_spwn1_zm", "OnTrigger", "", "origin -14776 -13183.9 272 zmgravity_temp", SpawnItems, 0.00, -1],

    ["item_spawner_l2_1", "OnTrigger", "", "origin 8128 9472 236 tornado_temp", SpawnItems, 0.00, -1],
    ["item_spawner_l2_1", "OnTrigger", "", "origin 8768 7968 369 freeze_temp", SpawnItems, 0.00, -1],
    ["item_spawner_l2_1", "OnTrigger", "", "origin 7487 7968 369 earth_temp", SpawnItems, 0.00, -1],
    ["item_spawner_l2_1", "OnTrigger", "", "origin 8128 5376.01 2993 fire_temp", SpawnItems, 0.00, -1],
    ["item_spawner_l2_1", "OnTrigger", "", "origin 8131 11747 2992.01 heal_temp", SpawnItems, 0.00, -1],
    ["item_spawner_l2_1", "OnTrigger", "", "origin 10641 14032 4649 ultimate_temp", SpawnItems, 0.00, -1],

    ["item_spawner_l2_2", "OnTrigger", "", "origin 8128 9472 236 fire_temp", SpawnItems, 0.00, -1],
    ["item_spawner_l2_2", "OnTrigger", "", "origin 8768 7968 369 freeze_temp", SpawnItems, 0.00, -1],
    ["item_spawner_l2_2", "OnTrigger", "", "origin 7487 7968 369 heal_temp", SpawnItems, 0.00, -1],
    ["item_spawner_l2_2", "OnTrigger", "", "origin 8128 5376.01 2993 tornado_temp", SpawnItems, 0.00, -1],
    ["item_spawner_l2_2", "OnTrigger", "", "origin 8131 11747 2992.01 earth_temp", SpawnItems, 0.00, -1],
    ["item_spawner_l2_2", "OnTrigger", "", "origin 10641 14032 4649 ultimate_temp", SpawnItems, 0.00, -1],

    ["item_spwn2_zm", "OnTrigger", "", "origin 8128 11776 230.01 zmfire_temp", SpawnItems, 0.00, -1],
    ["item_spwn2_zm", "OnTrigger", "", "origin 8864 11424 230.01 zmfreeze_temp", SpawnItems, 0.00, -1],
    ["item_spwn2_zm", "OnTrigger", "", "origin 7392 11424 230.01 zmgravity_temp", SpawnItems, 0.00, -1],

    ["item_spawner_l3", "OnTrigger", "", "origin 12560 -8664 -12169 fire_temp", SpawnItems, 0.00, -1],
    ["item_spawner_l3", "OnTrigger", "", "origin 9968 -8664 -12169 freeze_temp", SpawnItems, 0.00, -1],
    ["item_spawner_l3", "OnTrigger", "", "origin 11264 -7664 -12169 heal_temp", SpawnItems, 0.00, -1],
    ["item_spawner_l3", "OnTrigger", "", "origin 11264 -3448 -11458 tornado_temp", SpawnItems, 0.00, -1],
    ["item_spawner_l3", "OnTrigger", "", "origin 11264 352 -12178 earth_temp", SpawnItems, 0.00, -1],
    ["item_spawner_l3", "OnTrigger", "", "origin 9568.21 5844 -10512 ultimate_temp", SpawnItems, 0.00, -1],

    ["item_spwn3_zm", "OnTrigger", "", "origin 12128 -12928 -12184 zmfire_temp", SpawnItems, 0.00, -1],
    ["item_spwn3_zm", "OnTrigger", "", "origin 10400 -12928 -12184 zmfreeze_temp", SpawnItems, 0.00, -1],
    ["item_spwn3_zm", "OnTrigger", "", "origin 11265 -13288 -12121 zmgravity_temp", SpawnItems, 0.00, -1],

    ["item_spawner_u1", "OnTrigger", "", "origin -10845 12400 392 ultimate_temp", SpawnItems, 0.00, -1],
]

const InPutsSpawned = [
    [],
]
const FiredOnceTracker = new Set();

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
    FiredOnceTracker.clear();
    DelayedCalls.length = 0;
    if(InPuts.length > 0)
    {
        for (let i = 0; i < InPuts.length; i++) 
        {
            const [entName, outputName, target, param, handlerFn, delay, FireOnceOnly] = InPuts[i];

            let ent = null;
            if(entName.includes("*"))
            {
                ent = Instance.FindEntitiesByName(entName);
            }
            else
            {
                ent = Instance.FindEntityByName(entName);
            }
            
            if(!ent)
            {
                Instance.Msg("Can't Find: "+entName);
                continue;
            } 

            Instance.Msg(`Add Output to: ${entName} | OutputName: ${outputName} | Target: ${target} | Param: ${param} | Func: ${handlerFn.name} | Delay: ${delay} | FireOnceOnly: ${FireOnceOnly}`);

            if(Array.isArray(ent))
            {
                for(let i = 0; i < ent.length; i++)
                {
                    if(ent[i]?.IsValid())
                    {
                        CAddOutput(ent[i], outputName, target, param, handlerFn, delay, FireOnceOnly);
                    }
                }
            }
            else
            {
                if(ent?.IsValid())
                {
                    CAddOutput(ent, outputName, target, param, handlerFn, delay, FireOnceOnly);
                }
            }
        }
    }
})

function CAddOutput(ent, outputName, target, param, handlerFn, delay, FireOnceOnly)
{
    const uniqueKey = `${ent.GetEntityName()}_${getPositionKey(ent)}_${outputName}_${handlerFn.name}`;
    if(outputName == "OnSpawn")
    {
        let n_ent = Instance.FindEntityByName(target);
        Delay(function () {
            handlerFn(param, n_ent);
        }, delay);
        return;
    }
    let add_output = Instance.ConnectOutput(ent, outputName, ({value = param, caller, activator}) => {
    Delay(function () 
    {
        if(FireOnceOnly == 1)
        {
            if (FiredOnceTracker.has(uniqueKey)) {
                return;
            }
            FiredOnceTracker.add(uniqueKey);
            Instance.DisconnectOutput(add_output);
        }
        if(target.length == 0)
        {
            handlerFn(value);
        }
        else if(target == "!activator")
        {
            handlerFn(value, activator);
        }
        else if(target == "!caller")
        {
            handlerFn(value, caller);
        }
        else
        {
            if(target.includes("*"))
            {
                const ent = Instance.FindEntitiesByName(target);
                ent.forEach(ent => {
                    if(ent?.IsValid())
                    {
                        if(value == "!activator")
                        {
                            handlerFn(activator, ent);
                        }
                        else if(value == "!caller")
                        {
                            handlerFn(caller, ent);
                        }
                        else
                        {
                            handlerFn(value, ent);
                        }
                    }
                });
            }
            else
            {
                const ent = Instance.FindEntityByName(target);
                if(ent?.IsValid())
                {
                    if(value == "!activator")
                    {
                        handlerFn(activator, ent);
                    }
                    else if(value == "!caller")
                    {
                        handlerFn(caller, ent);
                    }
                    else
                    {
                        handlerFn(value, ent);
                    }
                }
            }
        } 
    }, delay);
});
}

Instance.OnRoundEnd(() => {
    DelayedCalls.length = 0;
})

function TeleportObject(arg, activator)
{
    let parts = arg.split(" ");
    let origin = {
        x: Number(parts[1]),
        y: Number(parts[2]),
        z: Number(parts[3])
    };

    const name = IsPlayerT(activator) ? activator?.GetPlayerController()?.GetPlayerName() : activator.GetEntityName();

    Instance.Msg(`Teleport: ${name} | TO: ${origin.x} ${origin.y} ${origin.z}`);
    activator.Teleport(origin, null, null);
}

function SetAngToObject(arg, activator)
{
    let parts = arg.split(" ");
    let angles = {
        pitch: Number(parts[1]),
        yaw: Number(parts[2]),
        roll: Number(parts[3])
    };

    const name = IsPlayerT(activator) ? activator?.GetPlayerController()?.GetPlayerName() : activator.GetEntityName();

    Instance.Msg(`SetAngTo: ${name} | Ang: ${angles.pitch} ${angles.yaw} ${angles.roll}`);
    activator.Teleport(null, angles, null);
}

function SetTargetName(arg, activator)
{
    let parts = arg.split(" ");
    let targetname = parts[1];

    const name = IsPlayerT(activator) ? activator?.GetPlayerController()?.GetPlayerName() : activator.GetEntityName();

    Instance.Msg(`SetNameTo: ${name} | Name: ${targetname}`);

    activator.SetEntityName(targetname);
}

function SetPlayerModel(arg, activator)
{
    const name = IsPlayerT(activator) ? activator?.GetPlayerController()?.GetPlayerName() : activator.GetEntityName();

    Instance.Msg(`SetPlayerModelTo: ${name} | Model: ${arg}`);

    activator.SetModel(arg);
}

function SetHealthToObject(arg, activator) 
{
    const parts = arg.split(" ");
    const hp = Number(parts[1]);

    if (isNaN(hp)) 
    {
        return;
    }

    const name = IsPlayerT(activator) ? activator?.GetPlayerController()?.GetPlayerName() : activator.GetEntityName();

    Instance.Msg(`SetHpTo: ${name} | Hp: ${hp}`);
    activator.SetHealth(hp);
}

function SetMaxHealthToObject(arg, activator) 
{
    const parts = arg.split(" ");
    const hp = Number(parts[1]);

    if (isNaN(hp)) 
    {
        return;
    }

    const name = IsPlayerT(activator) ? activator?.GetPlayerController()?.GetPlayerName() : activator.GetEntityName();

    Instance.Msg(`SetMaxHpTo: ${name} | Hp: ${hp}`);
    activator.SetMaxHealth(hp);
}

function SpawnItems(param, activator)
{
    let parts = param.split(" ");
    let origin = {
        x: Number(parts[1]),
        y: Number(parts[2]),
        z: Number(parts[3])
    };
    let temp = parts[4];
    let temp_ent = Instance.FindEntityByName(temp);
    if(temp_ent && temp_ent?.IsValid())
    {
        temp_ent.ForceSpawn(origin, {pitch: 0, yaw: 0, roll: 0});
    }
    else
    {
        Instance.Msg("Can't find: "+temp);
    }
}

function SpawnPointTemplate(param, activator)
{
    if(typeof param === "object" && param?.IsValid())
    {
        let ent_spawned = activator.ForceSpawn(param.GetAbsOrigin(), param.GetAbsAngles());
        AddOutputInSpawnedEntity(ent_spawned);
    }
    else
    {
        let parts = param.split(" ");
        let origin = {
            x: Number(parts[1]),
            y: Number(parts[2]),
            z: Number(parts[3])
        };
        let angles = null;
        if(parts.length > 4)
        {
            angles = {
                pitch: Number(parts[4]),
                yaw: Number(parts[5]),
                roll: Number(parts[6])
            }
        }
        if(angles != null)
        {
            let ent_spawned = activator.ForceSpawn(origin, angles);
            AddOutputInSpawnedEntity(ent_spawned);
        }
        else
        {
            let ent_spawned = activator.ForceSpawn(origin, {pitch: 0, yaw: 0, roll: 0});
            AddOutputInSpawnedEntity(ent_spawned);
        }
    }
}

function AddOutputInSpawnedEntity(ent_spawned)
{
    if(ent_spawned.length > 0)
    {
        for(let i = 0; i < ent_spawned.length; i++)
        {
            for(let j = 0; j < InPutsSpawned.length; j++)
            {
                const [entName, outputName, target, param, handlerFn, delay, FireOnceOnly] = InPutsSpawned[j];
                if(outputName == "OnSpawn")
                {
                    if(ent_spawned[i].GetEntityName().includes(target))
                    {
                        Delay(function () {
                            handlerFn(param, ent_spawned[i])
                        }, delay);
                        continue; 
                    }
                }
                else
                {
                    if(ent_spawned[i].GetEntityName().includes(entName))
                    {
                        CAddOutput(ent_spawned[i], outputName, target, param, handlerFn, delay, FireOnceOnly);
                    }
                }
            }
        }
    }
}

function PrintInConsole(param)
{
    Instance.Msg(`${param}`);
}

function IsPlayerT(activator) 
{
    return activator?.GetClassName() === "player";
}

function getPositionKey(ent) 
{
    const pos = ent.GetAbsOrigin();
    return `${Math.floor(pos.x)}_${Math.floor(pos.y)}_${Math.floor(pos.z)}`;
}
