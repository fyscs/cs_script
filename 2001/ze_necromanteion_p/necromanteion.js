import { Instance } from 'cs_script/point_script';

let level = 1;
Instance.OnScriptInput("SetLevel1", () => {
    level = 1;
});
Instance.OnScriptInput("SetLevel2", () => {
    level = 2;
});
Instance.OnScriptInput("SetLevel3", () => {
    level = 3;
});
Instance.OnRoundStart(() => {
    Instance.EntFireAtName({ name: "Level_case", input: "InValue", value: level });
});
