import { Instance } from "cs_script/point_script";

// by 凯岩城的狼
const BANANA_TEMPLATE_NAME = "@banana_temp";

const state = {
    lastTriggerTime: 0,
    cooldown: 1.0,
    cachedTemplate: null,
    lastCacheTime: 0
};

function SpawnBananaNearActivator(activator) {
    try {
        if (!activator || !activator.IsValid() || !activator.IsAlive()) return false;
        const currentTime = Instance.GetGameTime();
        if (currentTime - state.lastCacheTime > 30 || !state.cachedTemplate || !state.cachedTemplate.IsValid()) {
            state.cachedTemplate = Instance.FindEntityByName(BANANA_TEMPLATE_NAME);
            state.lastCacheTime = currentTime;
        }
        const template = state.cachedTemplate;
        if (!template || !template.IsValid()) return false;
        const origin = activator.GetAbsOrigin();
        const t = Math.random() * Math.PI * 2;
        const r = Math.random() * 10;
        const ents = template.ForceSpawn({
            x: origin.x + Math.cos(t) * r,
            y: origin.y + Math.sin(t) * r,
            z: origin.z + 15
        }, { pitch: 0, yaw: 0, roll: 0 });
        return !!(ents && ents.length > 0);
    } catch (error) {
        return false;
    }
}

function HandleTriggerActivation(inputData) {
    try {
        const currentTime = Instance.GetGameTime();
        if (currentTime - state.lastTriggerTime < state.cooldown) return;
        state.lastTriggerTime = currentTime;
        SpawnBananaNearActivator(inputData && inputData.activator ? inputData.activator : null);
    } catch (error) {
    }
}

Instance.OnScriptInput("start", HandleTriggerActivation);
Instance.OnActivate(() => {});
Instance.OnScriptReload({ after: () => {} });
