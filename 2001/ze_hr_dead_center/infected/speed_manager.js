import { Entity, Instance } from "cs_script/point_script";

/**
 * 速度管理系统
 * 此脚本由皮皮猫233编写
 * 2026/7/12
 */

const players = new Map();

for (let mulit = 0.1; mulit < 3.1; mulit += 0.1) {
    for (let duration = 0; duration <= 20; duration += 1) {
        Instance.OnScriptInput(`Speed(${mulit.toFixed(1)}, ${duration})`, (inputData) => Speed(inputData.activator, mulit, duration))
    }
}
Instance.OnScriptInput(`Speed(0.67, 0)`, (inputData) => Speed(inputData.activator, 1 / 1.5, 0));

Instance.OnRoundStart(() => {
    players.forEach((state, player) => {
        for(const task of state.tasks) CancelDelay(task);
        Instance.EntFireAtTarget({ target: player, input: "KeyValue", value: "speed 1" });
    });
    players.clear();
});

Instance.OnPlayerKill((event) => {
    if (!players.has(event.player)) return;
    const state = players.get(event.player);
    for(const task of state.tasks) CancelDelay(task);
    Instance.EntFireAtTarget({ target: event.player, input: "KeyValue", value: "speed 1" });
});

/**
 * 速度设置
 * @param {Entity|undefined} player
 * @param {number} mulit 
 * @param {number} duration 
 */
function Speed(player, mulit, duration) {
    if (!player || !player.IsValid()) return;
    if (!players.has(player)) players.set(player, { speed: 1, tasks: [] });
    const state = players.get(player);
    state.speed *= mulit;
    Instance.EntFireAtTarget({ target: player, input: "KeyValue", value: "speed " + state.speed.toFixed(2) });
    if (duration !== 0) {
        state.tasks.push(Delay(duration, () => {
            state.speed /= mulit;
            Instance.EntFireAtTarget({ target: player, input: "KeyValue", value: "speed " + state.speed.toFixed(2) });
        }));
    }
}

/** @type {{ id: number, time: number, callback: () => void }[]} */
const thinkQueue = [];
/** @type {Map<number, { id: number, time: number, callback: () => void }>} */
const taskMap = new Map();
let nextTaskId = 1;

/**
 * 延迟执行函数
 * @param {number} delaySeconds 延迟的秒数
 * @param {() => void} callback 回调函数
 * @returns {number} 任务ID，可用于取消
 */
function Delay(delaySeconds, callback) {
    const executeTime = Instance.GetGameTime() + delaySeconds;
    return QueueThink(executeTime, callback);
}

/**
 * 将think任务加入队列
 * @param {number} time 执行时间
 * @param {() => void} callback 回调函数
 * @returns {number} 任务ID
 */
function QueueThink(time, callback) {
    const id = nextTaskId++;
    const task = { id, time, callback };

    // 查找插入位置（按时间升序）
    let insertIndex = 0;
    for (let i = thinkQueue.length - 1; i >= 0; i--) {
        if (thinkQueue[i].time <= time) {
            insertIndex = i + 1;
            break;
        }
    }

    // 插入任务并记录
    thinkQueue.splice(insertIndex, 0, task);
    taskMap.set(id, task);

    // 如果新任务是最早的，则更新think
    if (insertIndex === 0) {
        Instance.SetNextThink(time);
    }

    return id;
}

/**
 * 取消指定ID的延迟任务（若尚未执行）
 * @param {number} taskId 任务ID
 */
function CancelDelay(taskId) {
    const task = taskMap.get(taskId);
    if (!task) return; // 任务不存在或已执行/取消

    // 从数组中移除（利用对象引用定位）
    const index = thinkQueue.indexOf(task);
    if (index !== -1) {
        thinkQueue.splice(index, 1);
    }
    taskMap.delete(taskId);

    // 如果移除的是队首任务，需要重新设置下一次think
    if (index === 0) {
        if (thinkQueue.length > 0) {
            Instance.SetNextThink(thinkQueue[0].time);
        }
        // 若队列已空，不再设think，RunThinkQueue会在执行结束后自然停止
    }
}

/**
 * Think循环处理函数
 */
function RunThinkQueue() {
    const currentTime = Instance.GetGameTime();

    // 执行所有到期的任务
    while (thinkQueue.length > 0 && thinkQueue[0].time <= currentTime) {
        const task = thinkQueue.shift();
        if (!task) return;
        taskMap.delete(task.id); // 清理映射
        try {
            task.callback();
        } catch (e) {
            // 避免回调异常中断队列处理
        }
    }

    // 更新下一次think
    if (thinkQueue.length > 0) {
        Instance.SetNextThink(thinkQueue[0].time);
    }
}

// 设置Think循环
Instance.SetThink(RunThinkQueue);