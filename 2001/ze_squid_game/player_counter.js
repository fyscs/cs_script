import { Instance } from "cs_script/point_script";


const MAX_PLAYERS = 63;

const Hud_Ent = "timer_counter1";
let TICKRATE = 1.00;
let IsWorking = false;
let Players_C = 0;

const counter_script_ent = "counter_script";

Instance.OnScriptInput("StartCount", () => {
    IsWorking = true;
    Players_C = 0;
    Instance.EntFireAtName({ name: counter_script_ent, input: "runscriptinput", value: "CountsPlayers", delay: 0.00 });
});

Instance.OnScriptInput("CountsPlayers", () => {
    if (IsWorking) {
        Players_C = 0;
        for (let i = 0; i < MAX_PLAYERS; i++) 
        {
            const controller = Instance.GetPlayerController(i);
            const pawn = controller?.GetPlayerPawn();
            if (pawn && pawn?.IsValid() && pawn?.GetHealth() > 0 && pawn?.GetTeamNumber() == 3) 
            {
                Players_C++;
            }
        }
        Instance.EntFireAtName({name: Hud_Ent, input: "SetMessage",value: `${Players_C}`, delay: 0.00 });
        Instance.EntFireAtName({ name: counter_script_ent, input: "runscriptinput", value: "CountsPlayers", delay: TICKRATE });
    }
});

Instance.OnScriptInput("StopCounting",() => {
    IsWorking = false;
});

Instance.OnScriptInput("StartCounting",() => {
    IsWorking = true;
});