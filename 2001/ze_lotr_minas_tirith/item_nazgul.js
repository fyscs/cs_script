import { Instance } from 'cs_script/point_script';

// --- 基础数学工具类 (击退逻辑必需) ---
class Vector3Utils {
    // @ts-ignore
    static subtract(a, b) {
        return new Vec3(a.x - b.x, a.y - b.y, a.z - b.z);
    }
    // @ts-ignore
    static length(vector) {
        return Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2);
    }
    // @ts-ignore
    static normalize(vector) {
        const len = Vector3Utils.length(vector);
        return len ? new Vec3(vector.x / len, vector.y / len, vector.z / len) : new Vec3(0, 0, 0);
    }
    // @ts-ignore
    static directionTowards(a, b) {
        // 计算从点A指向点B的归一化方向向量
        return Vector3Utils.normalize(Vector3Utils.subtract(b, a));
    }
}

class Vec3 {
    // @ts-ignore
    constructor(xOrVector, y, z) {
        if (typeof xOrVector === 'object') {
            this.x = xOrVector.x || 0;
            this.y = xOrVector.y || 0;
            this.z = xOrVector.z || 0;
        } else {
            this.x = xOrVector || 0;
            this.y = y || 0;
            this.z = z || 0;
        }
    }
    // @ts-ignore
    scale(factor) {
        return new Vec3(this.x * factor, this.y * factor, this.z * factor);
    }
}

// --- 击退效果逻辑 ---
let nazguls = new Set();
Instance.Msg("NAZGUL: 脚本已加载");
const nazgul_push_scale = 120;     // Nazgul 击退强度

// 初始化实体映射
Instance.OnScriptInput("LaunchNAZGUL", (inputData) => {
    let player = inputData.activator;
    
    // 确保实体存在且有效
    if (player && player.IsValid()) {
        let nazgul = inputData.caller;
        let player = inputData.activator;
        // @ts-ignore
        nazgul.player = player;
        nazguls.add(nazgul.player);

        // 打印调试信息
        Instance.Msg(`LaunchNAZGUL: 新增标记实体 -> ${nazgul?.GetClassName()} | ${nazgul?.GetParent()} | 新增玩家 -> ${player.GetEntityName()} (当前总数: ${nazguls.size})`);
    }
});

// 处理击退的核心函数
// @ts-ignore
function applyKnockback(physbox, activator, list, scale) {
    for (let item of list) {
        if (item === physbox) {
            let monsterPawn = item.player;
            let attackerOrigin = activator.GetAbsOrigin(); // 获取攻击者位置 
            let monsterOrigin = monsterPawn.GetAbsOrigin(); // 获取戒灵位置 

            // 计算推力方向并缩放
            let dir = Vector3Utils.directionTowards(attackerOrigin, monsterOrigin);
            let pushVel = dir.scale(scale);

            // 获取当前速度并叠加新推力 
            let currentVel = monsterPawn.GetAbsVelocity();
            let newVel = {
                x: currentVel.x + pushVel.x,
                y: currentVel.y + pushVel.y,
                z: currentVel.z + pushVel.z
            };

            // 应用新的速度到实体 
            monsterPawn.Teleport({ velocity: newVel });
            return;
        }
    }
}

// 映射具体的输入事件
Instance.OnScriptInput("hitNAZGUL", (inputData) => {
    applyKnockback(inputData.caller, inputData.activator, nazguls, nazgul_push_scale);
    Instance.Msg("hitNAZGUL: 击退效果已应用。");
});

// --- 回合重置 ---
Instance.OnRoundStart(() => {
    // 重置所有数组，防止引用旧实体 
    nazguls.clear();
    Instance.Msg("LaunchNAZGUL: 回合开始，清空标记名单。");
});