import { CSPlayerController, CSPlayerPawn, Instance, CSInputs } from "cs_script/point_script";

const CONFIG = { EffectedTeam: 3, duration: 30, scriptName: "main", moveSpeed: 250, drag: 0.9, maxSpeed: 300, thinkInterval: 1 / 64, velocityZIgnore: true };

//-------------------工具函数-------------------

/**
 * 根据玩家视角角度生成方向向量
 * @param {QAngle} player_angles - 玩家Pawn的视角角度
 * @param {number} magnitude - 向量倍数（默认1.0）
 * @returns {Vector | undefined} 方向向量
 */

function calculateViewDirectionVector(player_angles, magnitude = 1.0) {
    if (!player_angles) return { x: 0, y: 0, z: 0 };
    const pitchRad = player_angles.pitch * (Math.PI / 180);
    const yawRad = player_angles.yaw * (Math.PI / 180);
    const x = Math.cos(yawRad) * Math.cos(pitchRad);
    const y = Math.sin(yawRad) * Math.cos(pitchRad);
    const z = -Math.sin(pitchRad);
    return {
        x: x * magnitude,
        y: y * magnitude,
        z: z * magnitude
    };
}

/**
 * 计算向量和
 * @param {Vector} vec1 向量1
 * @param {Vector} vec2 向量2
 * @returns {Vector} 向量和
 */

function VectorAdd(vec1, vec2) {
    return {
        x: (vec1.x || 0) + (vec2.x || 0),
        y: (vec1.y || 0) + (vec2.y || 0),
        z: (vec1.z || 0) + (vec2.z || 0)
    }
}

/**
 * 克隆角度
 * @param {QAngle} angle 输入角度
 * @returns {QAangle} 返回克隆角度
 */
function cloneAngle(angle) {
    if (!angle) return { pitch: 0, yaw: 0, roll: 0 };
    return { pitch: angle.pitch, yaw: angle.yaw, roll: angle.roll };
}
/**
 * 根据速度向量计算速度大小
 * @param {Vector} velocity 速度向量
 * @param {Boolean} ignoreZ 是否忽略Z轴速度
 * @returns {Number} 速度大小
 */
function calculateSpeed(velocity, ignoreZ = false) {
    if (!velocity) return 0;
    const x = velocity.x || 0;
    const y = velocity.y || 0;
    const z = ignoreZ ? 0 : (velocity.z || 0);
    return Math.sqrt(x * x + y * y + z * z);
}
//-------------------核心功能-------------------
const state = {
    taskPause: true,
    intervalTimer: null,
    effectedPlayer: null,
    thinkCallback: null
}

Instance.OnScriptInput("Alter", (inputData) => {
    if (state.taskPause || state.effectedPlayer || state.intervalTimer) return;
    const players = Instance.FindEntitiesByClass("player") || [];
    state.effectedPlayer = new AlterPlayer(players);
    const filtered = state.effectedPlayer.getFilteredPlayers();
    if (filtered.length > 0) {
        state.intervalTimer = new Timer(CONFIG.duration, filtered);
    }
})

class AlterPlayer {
    constructor(players) {
        this.playerList = players || [];
        this.filteredPlayers = [];
        this.filterPlayer();
    }
    filterPlayer() {
        this.filteredPlayers = [];
        for (const player of this.playerList) {
            if (!player || !player.IsValid() || player?.GetTeamNumber() !== CONFIG.EffectedTeam) continue;
            const playerController = player?.GetPlayerController();
            if (!playerController || !playerController.IsValid()) continue;
            const slot = playerController?.GetPlayerSlot();
            this.filteredPlayers.push({
                slot,
                forward: false,
                backward: false,
                left: false,
                right: false
            });
        }
    }
    getFilteredPlayers() {
        return this.filteredPlayers;
    }
}

class Timer {
    constructor(duration, playerList) {
        this.duration = duration || CONFIG.duration;
        this.isActive = true;
        this.playerList = playerList || [];
        this.thinkTimer = null;
        this.initThink();
        this.initEndTask();
    }
    initThink() {
        state.thinkCallback = () => {
            if (!this.isActive || state.taskPause) return;
            this.UpdateKeyPressed();
            this.AlterVelocity();
            Instance.SetNextThink(Instance.GetGameTime() + CONFIG.thinkInterval);
        }
        Instance.SetThink(state.thinkCallback);
        Instance.SetNextThink(Instance.GetGameTime());
    }
    UpdateKeyPressed() {
        for (const player of this.playerList) {
            const controller = Instance.GetPlayerController(player.slot);
            const pawn = controller?.GetPlayerPawn();
            if (!controller || !pawn || !pawn.IsValid()) continue;
            player.forward = pawn?.IsInputPressed(CSInputs.FORWARD);
            player.backward = pawn?.IsInputPressed(CSInputs.BACK);
            player.left = pawn?.IsInputPressed(CSInputs.LEFT);
            player.right = pawn?.IsInputPressed(CSInputs.RIGHT);
            if (pawn?.WasInputJustReleased(CSInputs.FORWARD)) player.forward = false;
            if (pawn?.WasInputJustReleased(CSInputs.BACK)) player.backward = false;
            if (pawn?.WasInputJustReleased(CSInputs.LEFT)) player.left = false;
            if (pawn?.WasInputJustReleased(CSInputs.RIGHT)) player.right = false;
        }
    }
    AlterVelocity() {
        for (const player of this.playerList) {
            const controller = Instance.GetPlayerController(player.slot);
            const pawn = controller?.GetPlayerPawn();
            if (!controller || !pawn || !pawn.IsValid()) continue;
            let velocity = pawn?.GetAbsVelocity() || { x: 0, y: 0, z: 0 };
            velocity.x = velocity.x * CONFIG.drag;
            velocity.y = velocity.y * CONFIG.drag;
            const originAngle = cloneAngle(pawn?.GetAbsAngles());
            let vectorX = { x: 0, y: 0, z: 0 };
            let vectorY = { x: 0, y: 0, z: 0 };
            if (player.forward && !player.backward) {
                const angle = cloneAngle(originAngle);
                angle.yaw += 180;
                vectorX = calculateViewDirectionVector(angle, CONFIG.moveSpeed);
            }
            else if (!player.forward && player.backward) {
                vectorX = calculateViewDirectionVector(originAngle, CONFIG.moveSpeed);
            }
            if (player.left && !player.right) {
                const angle = cloneAngle(originAngle);
                angle.yaw -= 90;
                vectorY = calculateViewDirectionVector(angle, CONFIG.moveSpeed);
            }
            else if (!player.left && player.right) {
                const angle = cloneAngle(originAngle);
                angle.yaw += 90;
                vectorY = calculateViewDirectionVector(angle, CONFIG.moveSpeed);
            }
            const vectorMuti = VectorAdd(vectorX, vectorY);
            velocity = VectorAdd(vectorMuti, velocity);
            const currentSpeed = calculateSpeed(velocity, CONFIG.velocityZIgnore);
            if (currentSpeed >= CONFIG.maxSpeed) {
                const scale = CONFIG.maxSpeed / currentSpeed;
                velocity.x *= scale;
                velocity.y *= scale;
                if (!CONFIG.velocityZIgnore) velocity.z *= scale;
            }
            pawn?.Teleport({ velocity: velocity });
        }
    }
    initEndTask() {
        Instance.EntFireAtName({ name: CONFIG.scriptName, input: "RunScriptInput", value: "think_end", delay: this.duration });
    }
}
Instance.OnScriptInput("think_end", (inputData) => {
    if (state.intervalTimer) {
        state.intervalTimer.isActive = false;
        state.intervalTimer = null;
    }
    state.effectedPlayer = null;
})
Instance.OnRoundEnd((event) => {
    state.taskPause = true;
    if (state.intervalTimer) {
        state.intervalTimer.isActive = false;
        state.intervalTimer = null;
    }
    state.effectedPlayer = null;
    state.thinkCallback = null;
})

Instance.OnRoundStart((event) => {
    state.taskPause = false;
})