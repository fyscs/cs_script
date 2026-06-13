import { Entity, Instance } from "cs_script/point_script";

/**
 * Tank脚本
 * 此脚本由皮皮猫233编写
 * 2026/6/11
 */

let tank = /** @type {Entity|undefined} */ (undefined);
let suffix = 0;

Instance.OnScriptInput("BecomeTank", (inputData) => {
    tank = inputData.activator;
    const scriptName = inputData.caller?.GetEntityName();
    if (scriptName?.startsWith("tank_relay")) {
        suffix = Number(scriptName.slice(11));
    }
});

Instance.OnScriptInput("Die", () => {
    if (tank && tank.IsValid()) {
        tank.Kill();
    }
});

Instance.OnScriptInput("Hit", (inputData) => {
    if (tank && tank.IsValid()) {
        const phy = inputData.caller;
        if (phy && phy.IsValid()) {
            const health = phy.GetHealth();
            if (health > 0) {
                tank.SetHealth(health);
                const velocity = tank.GetAbsVelocity();
                const speed = Math.hypot(velocity.x, velocity.y);
                if (speed >= 160) {
                    tank.Teleport({ velocity: LimitHorizontalMagnitude(velocity, Math.max((speed - 20), 160))});
                }
            }
        }
    }
});

Instance.OnScriptInput("Throw", () => {
    // @ts-ignore
    const concreteEntities = Instance.FindEntityByName("tank_concrete_temp").ForceSpawn();
    for (const entity of concreteEntities) {
        if (entity.GetEntityName().startsWith("tank_concrete_phy")) {
            Instance.EntFireAtTarget({ target: entity, input: "SetParent", value: "tank_model_" + suffix });
            Instance.EntFireAtTarget({ target: entity, input: "SetParentAttachment", value: "debris" });
            break;
        }
    }
});

Instance.OnRoundStart(() => {
    if (tank && tank.IsValid()) {
        Instance.EntFireAtTarget({ target: tank, input: "SetDamageFilter", value: "" });
        Instance.EntFireAtTarget({ target: tank, input: "Alpha", value: 255 });
    }
    Instance.EntFireAtName({ name: "tank_script_" + suffix, input: "Kill" });
});

/**
 * 限制三维向量的水平分量（X和Y）的模长，若超过 maxMagnitude 则等比例缩放，保持方向不变；垂直分量 Z 保持不变。
 * @param {import("cs_script/point_script").Vector} v - 输入向量
 * @param {number} maxMagnitude - 允许的最大水平模长（非负数）
 * @returns {import("cs_script/point_script").Vector} 限制后的新向量
 */
function LimitHorizontalMagnitude(v, maxMagnitude) {
    const { x, y, z } = v;
    const horizMag = Math.hypot(x, y);
    if (horizMag <= maxMagnitude) {
        return { x, y, z };
    }
    const scale = maxMagnitude / horizMag;
    return {
        x: x * scale,
        y: y * scale,
        z: z
    };
}