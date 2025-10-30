import { CSPlayerPawn, Entity, Instance, PointTemplate } from "cs_script/point_script";

// by 凯岩城的狼
// 在CT阵营获胜时有概率在CT玩家脚下生成@ct_win实体

const CT_TEAM = 3; // CT队伍编号
const SPAWN_PROBABILITY = 0.4; // 40%概率生成奖励

// 初始化脚本
Instance.OnActivate(() => {
    Init();
});

Instance.OnScriptReload({
    after: () => {
        Init();
    }
});

function Init()
{
    Instance.SetNextThink(0.001);
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
        Instance.Msg(`CT获胜奖励脚本错误: ${error}`);
    }
});

// 在CT玩家脚下生成@ct_win实体
function SpawnCTWinReward()
{
    try {
        // 获取所有CT玩家
        const allPlayers = Instance.FindEntitiesByClass("player");
        const ctPlayers = [];
        
        for (const player of allPlayers) {
            if (player?.IsValid() && player.IsAlive() && player.GetTeamNumber() === CT_TEAM) {
                const playerController = player.GetPlayerController();
                if (playerController) {
                    ctPlayers.push(player);
                }
            }
        }
        
        if (ctPlayers.length === 0) {
            Instance.Msg("没有找到活着的CT玩家");
            return;
        }
        
        // 随机选择一个CT玩家
        const selectedPlayer = ctPlayers[Math.floor(Math.random() * ctPlayers.length)];
        
        // 获取玩家脚下位置
        const playerPos = selectedPlayer.GetAbsOrigin();
        const spawnPos = {
            x: playerPos.x,
            y: playerPos.y,
            z: playerPos.z + 42 // 在玩家脚下，稍微降低一点高度
        };
        
        // 查找@ct_win模板
        const ctWinTemplate = Instance.FindEntityByName("@ct_win");
        if (!ctWinTemplate) {
            Instance.Msg("未找到@ct_win模板");
            return;
        }
        
        // 生成实体
        const entities = ctWinTemplate.ForceSpawn(spawnPos, { pitch: 0, yaw: 0, roll: 0 });
        
        if (entities && entities.length > 0) {
            Instance.Msg(`在CT玩家脚下生成了@ct_win奖励`);
            
            // 设置实体自动删除（可选，根据需求调整时间）
            for (const ent of entities) {
                Instance.EntFireAtTarget({ 
                    target: ent, 
                    input: "Kill", 
                    value: "", 
                    delay: 30.0 // 30秒后自动删除
                });
            }
        } else {
            Instance.Msg("生成@ct_win实体失败");
        }
        
    } catch (error) {
        Instance.Msg(`生成CT获胜奖励时出错: ${error}`);
    }
}

// 手动测试输入
Instance.OnScriptInput("test_ct_win", (inputData) => {
    Instance.Msg("手动测试CT获胜奖励生成");
    SpawnCTWinReward();
});

// 设置思考函数
Instance.SetThink(() => {
    Instance.SetNextThink(0.1);
});

Instance.SetNextThink(0.1);
