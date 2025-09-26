import { Instance } from 'cs_script/point_script';

let script_name = "script_fog";
let fog_start_dist = 2000;
let fog_end_dist = 3200;
let fog = false;
Instance.OnScriptInput("StartFog", () => {
    fog = true;
    Instance.EntFireAtName("Train_fog1", "Enable", "", 0);
    set_fog();
});
function set_fog() {
    if (!fog)
        return;
    Instance.EntFireAtName("Train_fog1", "SetFogStartDistance", fog_start_dist, 0);
    Instance.EntFireAtName("Train_fog1", "SetFogEndDistance", fog_end_dist, 0);
    fog_start_dist -= 4;
    fog_end_dist -= 4;
    if (fog_start_dist < 400)
        return;
    Instance.EntFireAtName(script_name, "RunScriptInput", "SetFog", 0.01);
}
Instance.OnScriptInput("SetFog", set_fog);
Instance.OnScriptInput("ResetScript", () => {
    fog_start_dist = 2000;
    fog_end_dist = 3200;
    fog = false;
});
