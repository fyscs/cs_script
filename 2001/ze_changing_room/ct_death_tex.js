import { CSPlayerPawn, Entity, Instance, PointTemplate } from "cs_script/point_script";
// by 凯岩城的狼
// 脚本状态管理
let deathTemplates = [];

// CT阵营队伍ID
const CT_TEAM_ID = 3;

// 死亡模板配置
const deathTemplateConfig = {
    templateName: "@death_tex",
    spawnOffset: { x: 0, y: 0, z: 0 }
};

// 初始化脚本
function Init() {
    Instance.SetNextThink(0.1);
}

// 监听玩家死亡事件 - 使用新的API
Instance.OnPlayerKill((event) => {
    try {
        const victim = event.player;
        if (!victim) {
            return;
        }
        
        // 检查是否为CT阵营玩家死亡
        if (victim.GetTeamNumber() === CT_TEAM_ID) {
            SpawnDeathTemplate(victim);
        }
    } catch (error) {
        // 静默处理错误
    }
});

// 在CT玩家死亡位置生成@death_tex模板
function SpawnDeathTemplate(victimPawn) {
    try {
        // 验证受害者实体
        if (!victimPawn || !victimPawn.IsValid()) {
            return;
        }
        
        // 获取死亡玩家的位置
        const deathPosition = victimPawn.GetAbsOrigin();
        const deathAngles = victimPawn.GetAbsAngles();
        
        // 查找@death_tex模板
        const deathTemplate = Instance.FindEntityByName(deathTemplateConfig.templateName);
        
        if (!deathTemplate || !deathTemplate.IsValid()) {
            return;
        }
        
        // 计算生成位置（尸体位置 + 偏移）
        const spawnPosition = {
            x: deathPosition.x + deathTemplateConfig.spawnOffset.x,
            y: deathPosition.y + deathTemplateConfig.spawnOffset.y,
            z: deathPosition.z + deathTemplateConfig.spawnOffset.z
        };
        
        // 生成模板实体
        let spawnedEntities = null;
        if (deathTemplate.ForceSpawn) {
            spawnedEntities = deathTemplate.ForceSpawn(spawnPosition, deathAngles);
        }
        
        if (spawnedEntities && spawnedEntities.length > 0) {
            // 验证生成的实体
            const validEntities = spawnedEntities.filter(ent => ent && ent.IsValid());
            
            if (validEntities.length > 0) {
                // 将生成的实体添加到管理列表
                const templateRecord = {
                    entities: validEntities,
                    spawnTime: Date.now() / 1000,
                    position: spawnPosition
                };
                deathTemplates.push(templateRecord);
            }
        }
        
    } catch (error) {
        // 静默处理错误
    }
}

// 获取当前模板数量
function GetTemplateCount() {
    return deathTemplates.length;
}

// 脚本思考函数
function ScriptThink() {
    Instance.SetNextThink(0.1);
}

// 脚本输入处理
Instance.OnScriptInput("GetCount", (inputData) => {
    try {
        const count = GetTemplateCount();
        // 静默返回数量，不输出消息
    } catch (error) {
        // 静默处理错误
    }
});

// 回合开始事件
Instance.OnRoundStart(() => {
    try {
        // 回合开始时的处理
        // 可以在这里清理死亡模板记录
        deathTemplates = [];
    } catch (error) {
        // 静默处理错误
    }
});

// 回合结束事件
Instance.OnRoundEnd((event) => {
    try {
        // 回合结束时的处理
        // 可以在这里清理死亡模板记录
        deathTemplates = [];
    } catch (error) {
        // 静默处理错误
    }
});

// 脚本激活和重载事件
Instance.OnActivate(() => {
    Init();
});

Instance.OnScriptReload({
    after: () => {
        Init();
    }
});

// 设置思考函数
Instance.SetThink(ScriptThink);
Instance.SetNextThink(0.1);