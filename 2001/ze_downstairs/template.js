import { Instance } from 'cs_script/point_script';

const templates = [
    "illum_template",
    "saw_template",
    "platform_template",
    "seph_template",
    "jump_template",
    "surf_template",
    "unsafe_template",
    "30s_template",
    "blade_template",
    "spear_template"
];
/* const templates: string[] = [
  "blade_template",
  "blade_template",
] */
Instance.Msg("script loaded")
let templates_tmp = templates.slice();
let last_template = "";
function getRandomString(arr) {
    const index = Math.floor(Math.random() * arr.length);
    return arr[index];
}
function removeString(arr, str) {
    const index = arr.indexOf(str);
    if (index !== -1) {
        arr.splice(index, 1);
    }
    return arr;
}
Instance.OnScriptInput("SetTemplate", (context) => {
    let maker = context.caller;
    let maker_name = maker.GetEntityName();
    let template = "";
    Instance.EntFireAtName("cmd", "Command", "say hold for 10 seconds", 0);
    if (templates_tmp.length === 0) {
        templates_tmp = templates.slice();
    }
    do {
        template = getRandomString(templates_tmp);
    } while (last_template === template ||
        (maker_name === "stairs12" &&
            (template === "platform_template" || template === "seph_template")));
    last_template = template;
    templates_tmp = removeString(templates_tmp, template);
    Instance.EntFireAtTarget(maker, "KeyValue", "EntityTemplate " + template, 0);
    Instance.EntFireAtTarget(maker, "ForceSpawn", "", 5);
    Instance.EntFireAtName("fall_hurt_train", "StartForward", "", 10);

    Instance.Msg("spawning " + template + " at maker " + maker_name);
});
Instance.OnScriptInput("Reset", () => {
    templates_tmp = templates.slice();
    last_template = "";
    Instance.Msg("reset");
});