import { Instance } from "cs_script/point_script";

let SCRIPT = undefined;
let Temp_TimeshiftOverlay = undefined;
let Temp_TimeshiftResidue = undefined;
let Temp_TimeshiftActivate = undefined;

let stage_cur = 1;

const THINK_INTERVAL = 0.1;
const PlayerInstancesMap = new Map();
class Player {
    constructor(player, controller, name, slot)
    {
        this.player = player;
        this.controller = controller;
        this.player_name = name;
        this.slot = slot;
        this.shift_last = 0;
        this.next_allowed_input = 0;
        this.input_was_down = false;
    }
    TimeShift()
    {
        const pos = this.player.GetAbsOrigin();
        Instance.ClientCommand(this.slot, `play sounds/timeshift/items/timeshift_scr_shift_6ch_v1_0${GetRandomNumber(1, 6)}`);
        Instance.EntFireAtTarget({ target: SCRIPT, input: "RunScriptInput", value: "SpawnOverlayAndParticleActivate", delay: THINK_INTERVAL, caller: this.player });
    }
}

Instance.OnScriptInput("SpawnOverlayAndParticleActivate", ({ caller, activator }) => {
    const pos = caller?.GetAbsOrigin();
    Temp_TimeshiftOverlay.ForceSpawn({ x: pos.x, y: pos.y, z: pos.z + 40 });
    Temp_TimeshiftActivate.ForceSpawn({ x: pos.x, y: pos.y, z: pos.z + 40 });
});

Instance.SetThink(function () {
    const now = Instance.GetGameTime();
    Instance.SetNextThink(now + THINK_INTERVAL);

    PlayerInstancesMap.forEach((player_class, slot) => {
        if(player_class.player?.IsValid() && player_class.player.IsAlive())
        {
            const input_down = player_class.player.IsInputPressed(128);
            const pressed = input_down && !player_class.input_was_down;
            player_class.input_was_down = input_down;

            if(pressed && now >= player_class.next_allowed_input)
            {
                player_class.next_allowed_input = now + 2.0;

                if(now - player_class.shift_last >= 4)
                {
                    player_class.shift_last = now;

                    const player = player_class.player;
                    const pos = player.GetAbsOrigin();

                    if(pos.z <= 0)
                    {
                        Temp_TimeshiftResidue.ForceSpawn({ x: pos.x, y: pos.y, z: pos.z + 40 });
                        player.Teleport({ position: { x: pos.x, y: pos.y, z: pos.z + 9216 } });
                        player_class.TimeShift();
                    }
                    else
                    {
                        Temp_TimeshiftResidue.ForceSpawn({ x: pos.x, y: pos.y, z: pos.z + 40 });
                        player.Teleport({ position: { x: pos.x, y: pos.y, z: pos.z - 9215 } });
                        player_class.TimeShift();
                    }

                    Instance.EntFireAtName({ name: "Timeshift_Hudhint_Ready", input: "ShowHudHint", delay: 4.00, activator: player });
                    Instance.EntFireAtName({ name: "Timeshift_Hudhint_Ready", input: "HideHudHint", delay: 5.50, activator: player });
                }
            }
        }
    });
});

Instance.SetNextThink(Instance.GetGameTime() + THINK_INTERVAL);

Instance.OnPlayerDisconnect((event) => {
    let player_slot = event.playerSlot
    const inst = PlayerInstancesMap.get(player_slot);
    PlayerInstancesMap.delete(event.playerSlot);
});

Instance.OnPlayerReset((event) => {
    const player = event.player;
    if(player?.IsValid())
    {
        const player_controller = player?.GetPlayerController();
        const player_name = player_controller?.GetPlayerName();
        const player_slot = player_controller?.GetPlayerSlot();
        if(player_slot == null)
        {
            return;
        }
        Instance.EntFireAtTarget({ target: player, input: "Alpha", value: "255" });
        Instance.EntFireAtTarget({ target: player, input: "Color", value: "255 255 255" });
        Instance.EntFireAtTarget({ target: player, input: "KeyValue", value: "gravity 1" });
        Instance.EntFireAtTarget({ target: player, input: "SetScale", value: "1" });
        Instance.EntFireAtTarget({ target: player, input: "SetDamageFilter" });
        Instance.EntFireAtTarget({ target: player, input: "KeyValue", value: "friction 1.0" });
        //
        if(PlayerInstancesMap.has(player_slot))
        {
            const inst = PlayerInstancesMap.get(player_slot);
            inst.player = player;
            inst.controller = player_controller;
            inst.name = player_name;
            inst.shift_last = 0;
            inst.next_allowed_input = 0;
            inst.input_was_down = false;
        } 
        else 
        {
            PlayerInstancesMap.set(player_slot, new Player(player, player_controller, player_name, player_slot));
        }
    }
});

Instance.OnRoundStart(() => {
    SCRIPT = Instance.FindEntityByName("Map_Script");
    Temp_TimeshiftOverlay = Instance.FindEntityByName("Temp_PlayerOverlay");
    Temp_TimeshiftResidue = Instance.FindEntityByName("Temp_TimeshiftResidue");
    Temp_TimeshiftActivate = Instance.FindEntityByName("Temp_TimeshiftActivate");
    Instance.EntFireAtTarget({ target: SCRIPT, input: "RunScriptInput", value: "SetStage" });
});

Instance.OnRoundEnd(() => {
    SCRIPT = undefined;
});

Instance.OnScriptInput("SetStage", () => {
    if(stage_cur == 1)
    {
        stage_cur = 2;
        Instance.EntFireAtName({ name: "relay_level1", input: "Trigger" });
        return;
    }
    else
    {
        Instance.EntFireAtName({ name: "relay_level2", input: "Trigger" });
    }
});

function GetRandomNumber(min, max ) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
