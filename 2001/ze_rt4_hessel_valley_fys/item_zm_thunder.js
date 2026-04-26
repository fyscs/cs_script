import { CSGearSlot, CSPlayerController, CSPlayerPawn, Instance } from "cs_script/point_script";
let phys = null;
let player = null;
const push = 7500;//推力大小
const push_up_fix = 1200;//向上修正推力大小

Instance.Msg("脚本已加载");
/**
 * 根据角度生成方向向量
 * @param {QAngle} angles - 角度
 * @param {number} magnitude - 向量倍数（默认1.0）
 * @returns {Vector | undefined} 方向向量
 */

function calculateViewDirectionVector(angles, magnitude = 1.0) {
    const pitchRad = angles.pitch * (Math.PI / 180);
    const yawRad = angles.yaw * (Math.PI / 180);
    const x = Math.cos(yawRad) * Math.cos(pitchRad);
    const y = Math.sin(yawRad) * Math.cos(pitchRad);
    const z = -Math.sin(pitchRad);
    return {
        x: x * magnitude,
        y: y * magnitude,
        z: z * magnitude
    };
}

Instance.OnScriptInput("pick_up", (inputData) => {
    if (inputData.activator?.IsValid() && inputData.activator?.GetTeamNumber() == 2) {
        player = inputData.activator;
    }
});

Instance.OnScriptInput("use_item", (inputData) => {
    phys = Instance.FindEntityByName("item_rock_ball");
    const player_angle = player?.GetEyeAngles();
    let phys_vector = calculateViewDirectionVector(player_angle, push);
    phys_vector.z += push_up_fix;
    phys?.Teleport({ velocity: phys_vector });
})