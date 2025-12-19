import { Instance } from "cs_script/point_script";

// 监听pomni输入
Instance.OnScriptInput("pomni", (inputData) => {
    const activator = inputData.activator;
    
    if (!activator || !activator.IsValid()) {
        return;
    }
    
    // 查找目标实体
    const targetEntity = Instance.FindEntityByName("pomni_dance_watch_dest");
    
    if (!targetEntity) {
        return;
    }
    
    // 计算触发者面向目标实体所需的角度
    const newAngles = calculateLookAtAngles(
        activator.GetAbsOrigin(),
        targetEntity.GetAbsOrigin()
    );
    
    // 更改触发者的角度
    activator.Teleport({
        angles: newAngles
    });
});

// 计算从源位置看向目标位置所需的角度
function calculateLookAtAngles(sourcePos, targetPos) {
    // 计算水平方向向量
    const deltaX = targetPos.x - sourcePos.x;
    const deltaY = targetPos.y - sourcePos.y;
    
    // 计算yaw角度（水平旋转）
    // Math.atan2返回弧度，需要转换为度
    // CS2中yaw角度：0为东，90为北，180为西，270为南
    const yaw = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    
    // 计算垂直方向向量
    const deltaZ = targetPos.z - sourcePos.z;
    const horizontalDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // 计算pitch角度（垂直旋转）
    // Math.atan2返回弧度，需要转换为度
    // CS2中pitch角度：0为水平，正值为向下看，负值为向上看
    const pitch = -Math.atan2(deltaZ, horizontalDistance) * (180 / Math.PI);
    
    // 返回QAngle对象
    return {
        pitch: pitch,
        yaw: yaw,
        roll: 0
    };
}