import { CSPlayerPawn, Entity, Instance, PointTemplate } from "cs_script/point_script";
// by 凯岩城的狼


const BANANA_TEMPLATE_NAME = "@banana_temp";

const state = {
    lastTriggerTime: 0,
    cooldown: 1.0
};

function SpawnBananaNearActivator(activator) {
    try {
        if (!activator || !activator.IsValid() || !activator.IsAlive()) {
            return false;
        }
        const origin = activator.GetAbsOrigin();
        const t = Math.random() * Math.PI * 2;
        const r = Math.random() * 10;
        const spawnPos = {
            x: origin.x + Math.cos(t) * r,
            y: origin.y + Math.sin(t) * r,
            z: origin.z + 15
        };

        const template = Instance.FindEntityByName(BANANA_TEMPLATE_NAME);
        if (!template) {
            return false;
        }
        const ents = template.ForceSpawn(spawnPos, { pitch: 0, yaw: 0, roll: 0 });
        return !!(ents && ents.length > 0);
    } catch (error) {
        return false;
    }
}

function HandleTriggerActivation(inputData) {
    try {
        const currentTime = Instance.GetGameTime();
        if (currentTime - state.lastTriggerTime < state.cooldown) {
            return;
        }
        state.lastTriggerTime = currentTime;

        const activator = inputData.activator;
        SpawnBananaNearActivator(activator);
    } catch (error) {
        // 静默处理错误
    }
}

// 初始化函数
function Init() {
    Instance.SetNextThink(0.1);
}

// 脚本输入处理
Instance.OnScriptInput("start", HandleTriggerActivation);

// 脚本激活和重载处理
Instance.OnActivate(() => {
    Init();
});

Instance.OnScriptReload({
    after: () => {
        Init();
    }
});
