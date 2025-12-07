import { Instance } from "cs_script/point_script";

// by 凯岩城的狼
// 在CT阵营获胜时有概率在CT玩家脚下生成@ct_win实体

const CT_TEAM = 3;
const SPAWN_PROBABILITY = 0.4;
const PLAYER_SPAWN_Z_OFFSET = 42;
const REWARD_LIFETIME = 30.0;

const state = {
    cachedTemplate: null,
    lastCacheTime: 0
};

function Init() {
}

// 监听回合结束事件
Instance.OnRoundEnd((event) => {
    try {
        // 检查是否为CT获胜
        if (event.winningTeam === CT_TEAM) {
            // 随机决定是否生成奖励
            if (Math.random() < SPAWN_PROBABILITY) {
                SpawnCTWinReward();
            }
        }
    } catch (error) {
    }
});

// 在CT玩家脚下生成@ct_win实体
function SpawnCTWinReward() {
    try {
        // 获取所有CT玩家
        const allPlayers = Instance.FindEntitiesByClass("player");
        const ctPlayers = [];
        
        for (const player of allPlayers) {
            if (player && player.IsValid() && player.IsAlive() && player.GetTeamNumber() === CT_TEAM) {
                const playerController = player.GetPlayerController();
                if (playerController) {
                    ctPlayers.push(player);
                }
            }
        }
        
        if (ctPlayers.length === 0) {
            return;
        }
        
        const selectedPlayer = ctPlayers[Math.floor(Math.random() * ctPlayers.length)];
        const playerPos = selectedPlayer.GetAbsOrigin();
        const spawnPos = {
            x: playerPos.x,
            y: playerPos.y,
            z: playerPos.z + PLAYER_SPAWN_Z_OFFSET
        };
        
        const currentTime = Instance.GetGameTime();
        if (currentTime - state.lastCacheTime > 30 || !state.cachedTemplate || !state.cachedTemplate.IsValid()) {
            state.cachedTemplate = Instance.FindEntityByName("@ct_win");
            state.lastCacheTime = currentTime;
        }
        
        const ctWinTemplate = state.cachedTemplate;
        if (!ctWinTemplate || !ctWinTemplate.IsValid()) {
            return;
        }
        
        const entities = ctWinTemplate.ForceSpawn(spawnPos, { pitch: 0, yaw: 0, roll: 0 });
        
        if (entities && entities.length > 0) {
            for (const ent of entities) {
                Instance.EntFireAtTarget({
                    target: ent,
                    input: "Kill",
                    value: "",
                    delay: REWARD_LIFETIME
                });
            }
        }
        
    } catch (error) {
    }
}

Instance.OnScriptInput("test_ct_win", () => {
    SpawnCTWinReward();
});

Instance.OnActivate(() => {
    Init();
});

Instance.OnScriptReload({
    after: () => {
        Init();
    }
});
