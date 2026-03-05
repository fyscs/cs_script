import { Instance, PointTemplate } from "cs_script/point_script";

/** 
 * 道具效果生成脚本
 * 此脚本由皮皮猫233编写
 * 2026/2/9
 */

Instance.OnScriptInput("Explode", (inputData) => {
    const caller = inputData.caller;
    if (!caller || !caller.IsValid()) return;
    const entityName = caller.GetEntityName();
    const position = caller.GetAbsOrigin();
    const angles = caller.GetAbsAngles();
    angles.pitch = 0;
    angles.roll = 0;
    Instance.EntFireAtTarget({ target: caller, input: "KillHierarchy" });

    if (entityName.includes("anecanister")) Explode("anecanister", position, angles);
    else if (entityName.includes("gascan")) Explode("gascan", position, angles);
    else if (entityName.includes("oxygentank")) Explode("oxygentank", position, angles);
});

/**
 * 爆炸函数
 * @param {string} type 
 * @param {import("cs_script/point_script").Vector} position
 * @param {import("cs_script/point_script").QAngle} angles
 */
function Explode(type, position, angles) {
    const explodeTemp = /** @type {PointTemplate} */ (Instance.FindEntityByName("item_" + type + "_effect_temp"));
    if (!explodeTemp || !explodeTemp.IsValid()) return;
    const entities = explodeTemp.ForceSpawn(position, angles);
    if (!entities) return;
    for (const entity of entities) {
        Instance.EntFireAtTarget({ target: entity, input: "Kill", delay: 5 });
        if (entity.GetClassName() === "env_explosion") {
            Instance.EntFireAtTarget({ target: entity, input: "Explode" });
        } else if (entity.GetClassName() === "env_shake") {
            Instance.EntFireAtTarget({ target: entity, input: "StartShake" });
        } else if (entity.GetClassName() === "point_soundevent") {
            Instance.EntFireAtTarget({ target: entity, input: "StopSound", delay: 4.9 });
        }
    }
}