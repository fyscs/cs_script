import { Instance } from "cs_script/point_script";

// 当接收到"Health"输入时处理加血
Instance.OnScriptInput("Health", (context) => {
    // 检查激活者是否存在且有效
    if (!context.activator || typeof context.activator.IsValid !== 'function' || !context.activator.IsValid()) {
        return;
    }
    
    // 检查实体是否为玩家
    try {
        const className = context.activator.GetClassName();
        if (!className || !className.includes("player")) {
            return; // 不是玩家实体，不处理
        }
    } catch (e) {
        return; // 获取类名失败，不处理
    }
    
    // 直接给玩家加血
    try {
        const currentHealth = context.activator.GetHealth();
        context.activator.SetHealth(currentHealth + 2500);
    } catch (e) {
        // 忽略错误，避免服务器崩溃
    }
});
