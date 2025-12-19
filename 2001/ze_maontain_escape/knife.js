import { Instance } from "cs_script/point_script";

// 计算从起点指向终点的角度
function calculateAnglesToTarget(fromPosition, toPosition) {
    // 计算方向向量
    var dx = toPosition.x - fromPosition.x;
    var dy = toPosition.y - fromPosition.y;
    var dz = toPosition.z - fromPosition.z;
    
    // 计算偏航角（yaw）
    var yaw = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // 计算俯仰角（pitch）
    var horizontalDistance = Math.sqrt(dx * dx + dy * dy);
    var pitch = -Math.atan2(dz, horizontalDistance) * (180 / Math.PI);
    
    // 返回欧拉角
    return {
        pitch: pitch,
        yaw: yaw,
        roll: 0
    };
}

// 监听RunScriptInput输入，当value为"active"时触发
Instance.OnScriptInput("active", function(inputData) {
    // 查找position1和position2实体
    var position1Entity = Instance.FindEntityByName("dragon_knife_train");
    var position2Entity = Instance.FindEntityByName("dragon_knife_fly_push");
    var arrowEntity = Instance.FindEntityByName("dragon_knife_fly_push");
    
    // 检查所有实体是否存在且有效
    if (position1Entity && position1Entity.IsValid() && 
        position2Entity && position2Entity.IsValid() && 
        arrowEntity && arrowEntity.IsValid()) {
        
        // 获取position1和position2的位置
        var position1Pos = position1Entity.GetAbsOrigin();
        var position2Pos = position2Entity.GetAbsOrigin();
        
        // 计算箭头应该朝向的角度
        var arrowAngles = calculateAnglesToTarget(position2Pos, position1Pos);
        
        // 更新arrow实体的位置和角度
        // 位置设置为position2的位置，角度设置为指向position1的角度
        arrowEntity.Teleport({
            position: position2Pos,
            angles: arrowAngles
        });
        

    }
});