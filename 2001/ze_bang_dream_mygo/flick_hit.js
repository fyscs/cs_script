import { Instance } from "cs_script/point_script";

/** 
 * 粉键高度恢复脚本
 * 用于击中粉键后强制将玩家落回地面，防止部分粉键击中过于困难
 * 此脚本由皮皮猫233编写
 * 2025/12/25
 */

Instance.OnScriptInput("Hit", (inputData) => {
    const player = inputData.activator;
    if (!player || !player.IsValid()) return;
    const currentPostition = player.GetAbsOrigin();
    const currentVelocity = player.GetAbsVelocity();

    currentPostition.z = 1880;
    currentVelocity.z = 0;
    player.Teleport({ position: currentPostition, velocity: currentVelocity });
});