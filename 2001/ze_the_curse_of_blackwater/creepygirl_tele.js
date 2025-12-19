import { Instance } from "cs_script/point_script";

// 存储每个触发者的位置和角度信息
const positionRecords = new Map(); // 键: 实体引用，值: {position: Vector, angles: QAngle}

// 监听Catch输入
Instance.OnScriptInput("Catch", (inputData) => {
    const activator = inputData.activator;
    
    if (!activator || !activator.IsValid()) {
        return;
    }
    
    // 获取当前位置和角度
    const position = activator.GetAbsOrigin();
    const angles = activator.GetAbsAngles();
    
    // 存储记录
    positionRecords.set(activator, {
        position: position,
        angles: angles
    });
});

// 监听Back输入
Instance.OnScriptInput("Back", (inputData) => {
    const activator = inputData.activator;
    
    if (!activator || !activator.IsValid()) {
        return;
    }
    
    // 检查是否有该触发者的记录
    const record = positionRecords.get(activator);
    
    if (!record) {
        return;
    }
    
    // 执行传送
    teleportEntity(activator, record.position, record.angles);
    
    // 传送完成后清除该实体的记录
    positionRecords.delete(activator);
});

// 传送实体到指定位置
function teleportEntity(entity, position, angles) {
    try {
        // 执行传送
        entity.Teleport({
            position: position,
            angles: angles
        });
        
        // 重置速度（防止惯性）
        entity.Teleport({
            velocity: {x: 0, y: 0, z: 0}
        });
    } catch (error) {
        // 传送失败，静默处理
    }
}

// 清理无效记录（定期检查）
function cleanupInvalidRecords() {
    for (const [entity, _] of positionRecords.entries()) {
        if (!entity.IsValid()) {
            positionRecords.delete(entity);
        }
    }
}

// 监听回合开始事件，清除所有记录
Instance.OnRoundStart(() => {
    positionRecords.clear();
});

// 脚本激活时的初始化
Instance.OnActivate(() => {
    // 每30秒清理一次无效记录
    setInterval(cleanupInvalidRecords, 30000);
});

// 脚本重载处理
Instance.OnScriptReload({
    before: () => {
        return [];
    },
    after: () => {
        // 重载后清空所有记录
        positionRecords.clear();
    }
});