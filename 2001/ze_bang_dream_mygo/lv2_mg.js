import { Instance, Entity } from "cs_script/point_script";

/**
 * 小游戏脚本
 * 此脚本由皮皮猫233编写
 * 仅供MyGO地图使用
 * 交流学习请联系作者
 * 2025/10/28
 */

const MG_CONFIG = {
    EVENT_TIME: 1,          // 检测时长
    PUNISH_DAMAGE: 15       // 惩罚伤害
};

const GAME_TYPE = {
    NONE: 0,
    JUMP: 1,
    SPIN: 2,
    JUMP_AND_SPIN: 3
};

const mgState = {
    endTime: -1,
    currentChallenge: GAME_TYPE.NONE,
    isActive: false,
    player: new Map()
};

Instance.OnScriptInput("Jump", (inputData) => {

    // 重置玩家状态
    mgState.player.forEach((value, key) => {
        value.isJumpFinish = false;
    });
    mgState.currentChallenge = GAME_TYPE.JUMP;
    mgState.endTime = Instance.GetGameTime() + MG_CONFIG.EVENT_TIME;
    Instance.SetNextThink(Instance.GetGameTime());
});

Instance.OnScriptInput("Spin", (inputData) => {

    // 保存当前玩家身后朝向
    mgState.player.forEach((value, key) => {

        // 重置玩家状态
        value.isSpinFinish = false;

        const angles = key.GetAbsAngles();
        value.angles = {
            pitch: angles.pitch,
            yaw: (angles.yaw >= 180) ? angles.yaw - 180 : angles.yaw + 180,
            roll: angles.roll
        };
    });
    mgState.currentChallenge = GAME_TYPE.SPIN;
    mgState.endTime = Instance.GetGameTime() + MG_CONFIG.EVENT_TIME;
    Instance.SetNextThink(Instance.GetGameTime());
});

Instance.OnScriptInput("JumpAndSpin", (inputData) => {

    // 保存当前玩家身后朝向
    mgState.player.forEach((value, key) => {

        // 重置玩家状态
        value.isJumpFinish = false;
        value.isSpinFinish = false;

        const angles = key.GetAbsAngles();
        value.angles = {
            pitch: angles.pitch,
            yaw: (angles.yaw + 180) % 360,
            roll: angles.roll
        };
    });
    mgState.currentChallenge = GAME_TYPE.JUMP_AND_SPIN;
    mgState.endTime = Instance.GetGameTime() + MG_CONFIG.EVENT_TIME;
    Instance.SetNextThink(Instance.GetGameTime());
});

// 游戏开始时注册所有玩家状态
Instance.OnScriptInput("Start", (inputData) => {
    mgState.isActive = true;
    const players = Instance.FindEntitiesByClass("player");
    for (const player of players) {

        // 只注册人类玩家
        if (player.GetTeamNumber() === 3)
            mgState.player.set(player, { isJumpFinish: false, isSpinFinish: false, angles: { pitch: 0, yaw: 0, roll: 0 } });
    }
});

// 监听玩家跳跃状态
Instance.OnPlayerJump((event) => {
    if (!mgState.isActive)
        return;
    const player = event.player
    if (mgState.player.has(player))
        mgState.player.get(player).isJumpFinish = true;
});

// 玩家断连或死亡时清理玩家状态
Instance.OnPlayerDisconnect((event) => {
    if (!mgState.isActive)
        return;
    const player = Instance.GetPlayerController(event.playerSlot).GetPlayerPawn();
    if (mgState.player.has(player))
        mgState.player.delete(player);
});

// 回合重启时重置所有状态
Instance.OnRoundStart(() => {
    mgState.endTime = -1;
    mgState.currentChallenge = GAME_TYPE.NONE;
    mgState.isActive = false;
    mgState.player.clear();
});

Instance.OnPlayerKill((event) => {
    if (!mgState.isActive)
        return;
    const player = event.player;
    if (mgState.player.has(player))
        mgState.player.delete(player);
});

Instance.SetThink(() => {
    if (!mgState.isActive && mgState.currentChallenge === GAME_TYPE.NONE)
        return;
    const currentTime = Instance.GetGameTime();

    if (mgState.currentChallenge === GAME_TYPE.JUMP)
        Jump(currentTime);
    if (mgState.currentChallenge === GAME_TYPE.SPIN)
        Spin(currentTime);
    if (mgState.currentChallenge === GAME_TYPE.JUMP_AND_SPIN)
        JumpAndSpin(currentTime);
    Instance.SetNextThink(Instance.GetGameTime());
});

/**
 * 惩罚函数
 * @param {Entity} player 
 */
function punishPlayer(player) {
    const newHealth = player.GetHealth() - MG_CONFIG.PUNISH_DAMAGE;
    player.SetHealth(newHealth);
    
    // 清除0血量玩家
    if (newHealth <= 0)
        player.Kill();
}

/**
 * 跳跃监测
 * 当规定时间内未跳跃扣除20血量
 * @param {Number} currentTime 
 */
function Jump(currentTime) {
    if (mgState.endTime <= currentTime) {

        // 重置玩家状态
        mgState.currentChallenge = GAME_TYPE.NONE;
        mgState.player.forEach((value, key) => {
            if (!value.isJumpFinish) {
                punishPlayer(key);
            }
        });
    }
}

/**
 * 旋转监测
 * 当规定时间内未旋转扣除20血量
 * @param {Number} currentTime 
 */
function Spin(currentTime) {
    if (mgState.endTime >= currentTime) {
        mgState.player.forEach((value, key) => {
            if (isAngleInRange(key.GetAbsAngles().yaw, value.angles.yaw, 45))
                value.isSpinFinish = true;
        });
    } else {
        // 重置玩家状态
        mgState.currentChallenge = GAME_TYPE.NONE;
        mgState.player.forEach((value, key) => {
            if (!value.isSpinFinish) {
                punishPlayer(key);
            }
        });
    }
}

/**
 * 双监测
 * @param {Number} currentTime 
 */
function JumpAndSpin(currentTime) {
    if (mgState.endTime >= currentTime) {
        mgState.player.forEach((value, key) => {
            if (isAngleInRange(key.GetAbsAngles().yaw, value.angles.yaw, 45))
                value.isSpinFinish = true;
        });
    } else {
        // 重置玩家状态
        mgState.currentChallenge = GAME_TYPE.NONE;
        mgState.player.forEach((value, key) => {
            if (!value.isJumpFinish || !value.isSpinFinish) {
                punishPlayer(key);
            }
        });
    }
}

//-----------------工具函数-----------------

/**
 * 角度比较
 * @param {Number} angle 
 * @param {Number} center 
 * @param {Number} range 
 * @returns {Boolean}
 */
function isAngleInRange(angle, center, range) {
    // 标准化所有角度到0-360之间
    angle = ((angle % 360) + 360) % 360;
    center = ((center % 360) + 360) % 360;
    
    // 计算范围边界
    let start = center - range;
    let end = center + range;
    
    // 处理跨越0度的情况
    if (start < 0 || end > 360) {
        // 将角度和范围都平移到以0为中心
        let shiftedAngle = (angle + 180) % 360;
        let shiftedStart = (start + 180) % 360;
        let shiftedEnd = (end + 180) % 360;
        
        // 检查是否在平移后的范围内
        if (shiftedStart <= shiftedEnd) {
            return shiftedAngle >= shiftedStart && shiftedAngle <= shiftedEnd;
        } else {
            return shiftedAngle >= shiftedStart || shiftedAngle <= shiftedEnd;
        }
    } else {
        return angle >= start && angle <= end;
    }
}