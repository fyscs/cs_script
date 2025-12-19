// kick_push_strong.vjs
// 当接收到"Kick"输入时，对触碰触发器的实体施加强力向外推力

import { Instance } from "cs_script/point_script";

// 配置参数
const PUSH_FORCE = 375; // 水平推力大小（速度单位）
const PUSH_UPWARD_FORCE = 5; // 向上的推力分量
const DESIRED_HEIGHT = 0; // 希望玩家被推离地面的高度，没什么用
const UPWARD_MULTIPLIER = 0.05; // 向上推力的乘数

/**
 * 计算从一个点到另一个点的方向向量（已归一化）
 * @param {Vector} from - 起始点
 * @param {Vector} to - 目标点
 * @returns {Vector} 归一化的方向向量
 */
function calculateDirection(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;
    
    // 计算距离
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (distance === 0) {
        // 如果距离为0，使用随机方向
        return {
            x: (Math.random() * 2) - 1,
            y: (Math.random() * 2) - 1,
            z: 0.8
        };
    }
    
    // 归一化
    return {
        x: dx / distance,
        y: dy / distance,
        z: dz / distance
    };
}

/**
 * 计算强力推力向量
 * @param {Vector} triggerPos - 触发器位置
 * @param {Entity} target - 目标实体
 * @returns {Vector} 推力向量
 */
function calculateStrongPushForce(triggerPos, target) {
    // 获取目标位置
    const targetPos = target.GetAbsOrigin();
    
    // 计算从触发器指向目标的方向
    const direction = calculateDirection(triggerPos, targetPos);
    
    // 为了达到48单位的高度，我们需要增加向上的分量
    let upwardMultiplier = UPWARD_MULTIPLIER;
    
    // 如果目标在触发器下方，增加更多向上的推力
    if (targetPos.z < triggerPos.z) {
        upwardMultiplier = 0.8;
    }
    
    // 计算垂直向上的推力分量
    const verticalForce = PUSH_UPWARD_FORCE * upwardMultiplier;
    
    // 确保方向向量的Z分量至少为0.3，保证有足够的向上推力
    const minZ = 0.3;
    if (direction.z < minZ) {
        direction.z = minZ;
    }
    
    // 增加额外的向上推力
    direction.z += 0.4;
    
    // 计算推力向量
    return {
        x: direction.x * PUSH_FORCE,
        y: direction.y * PUSH_FORCE,
        z: direction.z * PUSH_FORCE + verticalForce
    };
}

/**
 * 处理"Kick"脚本输入
 * @param {Object} inputData - 输入数据
 */
function handleKickInput(inputData) {
    try {
        const { caller, activator } = inputData;
        
        if (!caller || !caller.IsValid()) {
            return;
        }
        
        // 检查activator是否存在且有效
        if (!activator || !activator.IsValid()) {
            return;
        }
        
        // 获取触发器位置
        const triggerPos = caller.GetAbsOrigin();
        
        // 计算推力
        const pushForce = calculateStrongPushForce(triggerPos, activator);
        
        // 获取目标当前速度
        let currentVelocity;
        try {
            currentVelocity = activator.GetAbsVelocity();
        } catch (e) {
            currentVelocity = { x: 0, y: 0, z: 0 };
        }
        
        // 计算新的速度（叠加推力）
        const newVelocity = {
            x: currentVelocity.x + pushForce.x,
            y: currentVelocity.y + pushForce.y,
            z: currentVelocity.z + pushForce.z
        };
        
        // 应用新的速度
        try {
            activator.Teleport({
                velocity: newVelocity
            });
        } catch (e) {
            // 忽略施加推力时的错误
        }
        
    } catch (error) {
        // 忽略所有其他错误
    }
}

/**
 * 初始化脚本
 */
function initializeScript() {
    // 监听名为"Kick"的脚本输入
    Instance.OnScriptInput("Kick", handleKickInput);
    
    // 监听点脚本激活
    Instance.OnActivate(() => {
        // 初始化完成，无需额外操作
    });
}

// 执行初始化
initializeScript();