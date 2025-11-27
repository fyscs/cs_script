import { Instance } from 'cs_script/point_script';

let first_round = true;
Instance.OnScriptInput("EndWarmUp", () => {
    first_round = false;
});
Instance.OnRoundStart(() => {
    if (first_round) {
        Instance.EntFireAtName({ name: "wamrup_relay", input: "Trigger" });
        Instance.EntFireAtName({ name: "script_warmup", input: "RunScriptInput", value: "EndWarmUp", delay: 10 });
        Instance.EntFireAtName({ name: "console", input: "Command", value: "mp_restartgame 1", delay: 30 });
    }
});
