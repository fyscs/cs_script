import { CSPlayerPawn, Entity, Instance, PointTemplate } from "cs_script/point_script";
//by 凯岩城的狼
const TEAM_CT = 3;

const boomTemplates = {
    template1: "@boom_temp",
    template2: "@boom_temp2"
};

const state = {
    lastTriggerTime: 0,
    cooldown: 5.0
};

function GetAllPlayers() {
    const players = Instance.FindEntitiesByClass("player");
    return players.filter(player => player && player.IsValid() && player.IsAlive());
}

function GetCTPlayers() {
    return GetAllPlayers().filter(player => {
        try {
            const teamNumber = player.GetTeamNumber();
            return teamNumber === TEAM_CT;
        } catch (error) {
            return false;
        }
    });
}

function GetRandomElement(array) {
    if (array.length === 0) {
        return null;
    }
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

function GetRandomBoomTemplate() {
    const templateKeys = Object.keys(boomTemplates);
    const randomKey = templateKeys[Math.floor(Math.random() * templateKeys.length)];
    return boomTemplates[randomKey];
}

function SpawnBoomAtPosition(position) {
    try {
        const selectedTemplate = GetRandomBoomTemplate();
        const boomTemplate = Instance.FindEntityByName(selectedTemplate);
        
        if (!boomTemplate) {
            return false;
        }

        const entities = boomTemplate.ForceSpawn(position, { pitch: 0, yaw: 0, roll: 0 });
        
        if (!entities || entities.length === 0) {
            return false;
        }


        return true;
    } catch (error) {
        return false;
    }
}

function SpawnBoomAtRandomCT() {
    try {
        const ctPlayers = GetCTPlayers();
        
        if (ctPlayers.length === 0) {
            return;
        }

        const randomCT = GetRandomElement(ctPlayers);
        
        if (!randomCT || !randomCT.IsValid()) {
            return;
        }

        const playerOrigin = randomCT.GetAbsOrigin();
        const boomPosition = {
            x: playerOrigin.x,
            y: playerOrigin.y,
            z: playerOrigin.z + 46
        };

        SpawnBoomAtPosition(boomPosition);
    } catch (error) {
        // 静默处理错误
    }
}

function HandleTriggerActivation(inputData) {
    try {
        const currentTime = Instance.GetGameTime();
        
        if (currentTime - state.lastTriggerTime < state.cooldown) {
            return;
        }

        state.lastTriggerTime = currentTime;
        SpawnBoomAtRandomCT();
    } catch (error) {
        // 静默处理错误
    }
}

// 初始化函数
function Init() {
    Instance.SetNextThink(0.1);
}

// 脚本输入处理
Instance.OnScriptInput("boom_trigger", HandleTriggerActivation);
Instance.OnScriptInput("body_trigger", HandleTriggerActivation);
Instance.OnScriptInput("explosion_trigger", HandleTriggerActivation);

// 脚本激活和重载处理
Instance.OnActivate(() => {
    Init();
});

Instance.OnScriptReload({
    after: () => {
        Init();
    }
});
