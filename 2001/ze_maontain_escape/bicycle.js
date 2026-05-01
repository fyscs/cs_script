import { Instance, CSInputs } from "cs_script/point_script";

// 配置参数
const UPDATE_INTERVAL = 0.2;          // 更新间隔（秒）
const MAX_SPEED_FWD = 250;              // 前进最大速度
const MAX_SPEED_REV = MAX_SPEED_FWD / 4; // 倒车最大速度（前进的1/4）
const TURN_RATE = 100;                   // 最大转向角速度（度/秒）
const ACCELERATION = 1500;               // 水平加速度（单位/秒²）

// 爬坡辅助参数
const HILL_ASSIST_ANGLE_MIN = -75;       // 触发爬坡辅助的最小 pitch 角度
const HILL_ASSIST_ANGLE_MAX = 30;         // 触发爬坡辅助的最大 pitch 角度
const HILL_ASSIST_MAX_SPEED = 35;         // 爬坡辅助最大附加速度

// 侧翻修正参数
const ROLL_THRESHOLD = 90;                // 触发侧翻修正的 roll 绝对值阈值
const ROLL_CORRECTION_RATE = 300;          // 最大侧翻修正角速度

// 脚本状态
let bicycleBox = null;                   // 当前自行车实体
let riderPawn = null;                    // 当前骑手玩家
let isRiding = false;                    // 是否正在骑行
let thinkRegistered = false;              // think 是否已注册

// 按键按下时间记录（用于优先级处理）
let keyTimers = {};

// 辅助函数：提取 namefix 后缀
function getSuffixFromName(name) { return name.match(/_(\d+)$/)?.[1] || null; }

// 辅助函数：检查实体是否有效
function isValidEntity(ent) { return ent && ent.IsValid(); }

// 辅助函数：计算前向向量（基于 QAngle）
function getForwardVector(angles) {
    const pitch = angles.pitch * Math.PI / 180;
    const yaw = angles.yaw * Math.PI / 180;
    const cosPitch = Math.cos(pitch);
    return {
        x: Math.cos(yaw) * cosPitch,
        y: Math.sin(yaw) * cosPitch,
        z: -Math.sin(pitch)
    };
}

// 辅助函数：限制水平速度变化量（平滑加速/减速）
function applyAcceleration(current, target, maxDelta) {
    const diff = { x: target.x - current.x, y: target.y - current.y };
    const len = Math.sqrt(diff.x * diff.x + diff.y * diff.y);
    if (len <= maxDelta) return target;
    const scale = maxDelta / len;
    return { x: current.x + diff.x * scale, y: current.y + diff.y * scale };
}

// 主更新循环
function think() {
    if (!isRiding) { Instance.SetNextThink(Instance.GetGameTime() + UPDATE_INTERVAL); return; }

    // 检查实体有效性，失效时自动停止骑行
    if (!isValidEntity(bicycleBox) || !isValidEntity(riderPawn) || !riderPawn.IsAlive()) {
        isRiding = false;
        return;
    }

    // 1. 将骑手位置锁定到自行车位置
    riderPawn.Teleport({ position: bicycleBox.GetAbsOrigin() });

    // 2. 获取当前时间
    const currentTime = Instance.GetGameTime();

    // 3. 检查按键状态
    const pressedForward = riderPawn.IsInputPressed(CSInputs.FORWARD);
    const pressedBack    = riderPawn.IsInputPressed(CSInputs.BACK);
    const pressedLeft    = riderPawn.IsInputPressed(CSInputs.LEFT);
    const pressedRight   = riderPawn.IsInputPressed(CSInputs.RIGHT);

    // 更新按键按下时间（仅刚按下时记录）
    if (riderPawn.WasInputJustPressed(CSInputs.FORWARD)) keyTimers[CSInputs.FORWARD] = currentTime;
    if (riderPawn.WasInputJustPressed(CSInputs.BACK))    keyTimers[CSInputs.BACK]    = currentTime;
    if (riderPawn.WasInputJustPressed(CSInputs.LEFT))    keyTimers[CSInputs.LEFT]    = currentTime;
    if (riderPawn.WasInputJustPressed(CSInputs.RIGHT))   keyTimers[CSInputs.RIGHT]   = currentTime;

    // 键释放时清除时间戳
    if (!pressedForward) keyTimers[CSInputs.FORWARD] = null;
    if (!pressedBack)    keyTimers[CSInputs.BACK]    = null;
    if (!pressedLeft)    keyTimers[CSInputs.LEFT]    = null;
    if (!pressedRight)   keyTimers[CSInputs.RIGHT]   = null;

    // 移动方向：1前进 -1后退 0无
    let moveDir = 0;
    const forwardTime = keyTimers[CSInputs.FORWARD];
    const backTime    = keyTimers[CSInputs.BACK];
    if (forwardTime !== null && backTime !== null) moveDir = forwardTime < backTime ? 1 : -1;
    else if (forwardTime !== null) moveDir = 1;
    else if (backTime !== null) moveDir = -1;

    // 转向方向：1左转 -1右转 0无
    let turnDir = 0;
    const leftTime  = keyTimers[CSInputs.LEFT];
    const rightTime = keyTimers[CSInputs.RIGHT];
    if (leftTime !== null && rightTime !== null) turnDir = leftTime < rightTime ? 1 : -1;
    else if (leftTime !== null) turnDir = 1;
    else if (rightTime !== null) turnDir = -1;

    // 4. 获取自行车当前朝向
    const boxAngles = bicycleBox.GetAbsAngles();
    const pitch = boxAngles.pitch;
    const roll = boxAngles.roll;

    // 5. 获取当前速度和角速度
    const currentVel = bicycleBox.GetAbsVelocity();
    const currentAngVel = bicycleBox.GetAbsAngularVelocity();

    // 6. 计算基础目标水平速度（基于玩家输入）
    let baseTargetHor = { x: 0, y: 0 };
    if (moveDir !== 0) {
        const forward = getForwardVector(boxAngles);
        const maxSpeed = moveDir > 0 ? MAX_SPEED_FWD : MAX_SPEED_REV;
        baseTargetHor = { x: forward.x * maxSpeed * moveDir, y: forward.y * maxSpeed * moveDir };
    }

    // 7. 爬坡辅助（仅前进时且在角度范围内）
    let hillAssistSpeed = 0;
    if (moveDir > 0 && pitch >= HILL_ASSIST_ANGLE_MIN && pitch <= HILL_ASSIST_ANGLE_MAX) {
        const factor = (pitch - HILL_ASSIST_ANGLE_MIN) / (HILL_ASSIST_ANGLE_MAX - HILL_ASSIST_ANGLE_MIN);
        hillAssistSpeed = factor * HILL_ASSIST_MAX_SPEED;
        const forward = getForwardVector(boxAngles);
        baseTargetHor.x += forward.x * hillAssistSpeed;
        baseTargetHor.y += forward.y * hillAssistSpeed;
    }

    // 8. 平滑加速/减速（水平方向）
    const maxDelta = ACCELERATION * UPDATE_INTERVAL;
    const newHor = applyAcceleration({ x: currentVel.x, y: currentVel.y }, baseTargetHor, maxDelta);

    // 9. 合成新速度：保留垂直速度，加上爬坡辅助垂直分量
    let newVelocity = { x: newHor.x, y: newHor.y, z: currentVel.z };
    if (hillAssistSpeed > 0) {
        const forward = getForwardVector(boxAngles);
        newVelocity.z += forward.z * hillAssistSpeed;
    }

    // 10. 侧翻修正（基于滚转角）
    let correctionAngVelY = 0;
    if (Math.abs(roll) > ROLL_THRESHOLD) {
        const error = -roll;
        const k = 2.0;
        correctionAngVelY = Math.max(-ROLL_CORRECTION_RATE, Math.min(ROLL_CORRECTION_RATE, error * k));
    }

    // 11. 新角速度：保留俯仰，修正滚转，设置偏航
    const newAngularVelocity = {
        x: currentAngVel.x,
        y: correctionAngVelY,
        z: turnDir * TURN_RATE
    };

    // 12. 应用 Teleport（只设置速度和角速度）
    bicycleBox.Teleport({ velocity: newVelocity, angularVelocity: newAngularVelocity });

    // 13. 安排下一次更新
    Instance.SetNextThink(Instance.GetGameTime() + UPDATE_INTERVAL);
}

// 处理 Start 输入（上车）
Instance.OnScriptInput("start", (inputData) => {
    const caller = inputData.caller;
    const activator = inputData.activator;
    if (!caller || !activator) return;

    const suffix = getSuffixFromName(caller.GetEntityName());
    if (!suffix) return;

    const box = Instance.FindEntityByName(`bicycle_box_${suffix}`);
    if (!box || !box.IsValid()) return;

    if (!activator.IsAlive || !activator.IsAlive()) return;

    if (isRiding) isRiding = false; // 替换旧骑手

    bicycleBox = box;
    riderPawn = activator;
    isRiding = true;

    if (!thinkRegistered) {
        Instance.SetThink(think);
        thinkRegistered = true;
    }
    Instance.SetNextThink(Instance.GetGameTime() + UPDATE_INTERVAL);
});

// 处理 Stop 输入（下车）
Instance.OnScriptInput("stop", () => {
    isRiding = false;
    bicycleBox = null;
    riderPawn = null;
    keyTimers = {};
});

// 处理脚本重载（Tools 模式）
Instance.OnScriptReload({
    before: () => {
        isRiding = false;
        bicycleBox = null;
        riderPawn = null;
        thinkRegistered = false;
    }
});