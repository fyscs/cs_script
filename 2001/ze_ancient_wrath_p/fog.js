import { Instance } from 'cs_script/point_script';

const script_name = "script_fog";
let fog_start_dist = 2000;
let fog_end_dist = 3200;
let fog = false;
Instance.OnScriptInput("StartFog", () => {
    fog = true;
    Instance.EntFireAtName({ name: "Train_fog1", input: "Enable" });
    set_fog();
});
function set_fog() {
    if (!fog)
        return;
    Instance.EntFireAtName({ name: "Train_fog1", input: "SetFogStartDistance", value: fog_start_dist });
    Instance.EntFireAtName({ name: "Train_fog1", input: "SetFogEndDistance", value: fog_end_dist });
    fog_start_dist -= 4;
    fog_end_dist -= 4;
    if (fog_start_dist < 400)
        return;
    Instance.EntFireAtName({ name: script_name, input: "RunScriptInput", value: "SetFog", delay: 0.01 });
}
Instance.OnScriptInput("SetFog", set_fog);
Instance.OnScriptInput("ResetScript", () => {
    fog_start_dist = 2000;
    fog_end_dist = 3200;
    fog = false;
});
