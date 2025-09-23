import { Instance } from 'cs_script/point_script';

Instance.OnScriptInput("SetParticle15", () => {
    setParticle(15);
});
Instance.OnScriptInput("SetParticle14", () => {
    setParticle(14);
});
Instance.OnScriptInput("SetParticle13", () => {
    setParticle(13);
});
Instance.OnScriptInput("SetParticle12", () => {
    setParticle(12);
});
Instance.OnScriptInput("SetParticle11", () => {
    setParticle(11);
});
Instance.OnScriptInput("SetParticle10", () => {
    setParticle(10);
});
Instance.OnScriptInput("SetParticle9", () => {
    setParticle(9);
});
Instance.OnScriptInput("SetParticle8", () => {
    setParticle(8);
});
Instance.OnScriptInput("SetParticle7", () => {
    setParticle(7);
});
Instance.OnScriptInput("SetParticle6", () => {
    setParticle(6);
});
Instance.OnScriptInput("SetParticle5", () => {
    setParticle(5);
});
Instance.OnScriptInput("SetParticle4", () => {
    setParticle(4);
});
Instance.OnScriptInput("SetParticle3", () => {
    setParticle(3);
});
Instance.OnScriptInput("SetParticle2", () => {
    setParticle(2);
});
Instance.OnScriptInput("SetParticle1", () => {
    setParticle(1);
});
Instance.OnScriptInput("SetParticle0", () => {
    setParticle(0);
});
function setParticle(arg) {
    let n = arg - 1;
    if (n < 0) {
        Instance.EntFireAtName("flamethrower_indicator_particle", "Stop", "", 0);
    }
    else {
        let percentage = n / 14;
        let r = Math.trunc((1 - percentage) * 255);
        let g = Math.trunc(percentage * 255);
        let color_string = String(r) + " " + String(g) + " " + "0";
        Instance.EntFireAtName("flamethrower_indicator_particle", "setcolortint", color_string, 0);
        Instance.EntFireAtName("flamethrower_indicator_particle", "Start", "", 0);
    }
}
