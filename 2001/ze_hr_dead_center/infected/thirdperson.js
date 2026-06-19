import { Instance, Entity } from "cs_script/point_script";

/**
 * 第三人称脚本
 * 此脚本由皮皮猫233编写
 * 2026/6/17
 */

const cameraEntities = new Map();
let cameraIndex = 0;

Instance.OnScriptInput("ThirdPerson", (inputData) => {
    const player = inputData.activator;
    if (!player || !player.IsValid()) return;

    player.SetEntityName("player_thirdperson_" + cameraIndex);
    // @ts-ignore
    const entities = Instance.FindEntityByName("thirdperson_temp").ForceSpawn(player.GetEyePosition(), player.GetAbsAngles());
    cameraEntities.set(player, entities);
    for (const entity of entities) {

        const entityName = entity.GetEntityName();
        switch (entityName) {
            case "thirdperson_mm":
                Instance.EntFireAtTarget({ target: entity, input: "SetMeasureTarget", value: "player_thirdperson_" + cameraIndex });
                break;
            case "thirdperson_camera":
                Instance.EntFireAtTarget({ target: entity, input: "KeyValue", value: "target thirdperson_move_" + cameraIndex });
                Instance.EntFireAtTarget({ target: entity, input: "EnableCamera", activator: player });
                break;
            case "thirdperson_move":
                entity.SetEntityName("thirdperson_move_" + cameraIndex);
                Instance.EntFireAtTarget({ target: entity, input: "Close" });
        }
    }
    cameraIndex++;
});

Instance.OnScriptInput("FirstPerson", (inputData) => {
    const player = inputData.activator;
    if (!player || !player.IsValid()) return;

    const playerName = player.GetEntityName();
    if (playerName.startsWith("player_thirdperson_")) {

        const index = Number(playerName.slice(19));
        if (cameraEntities.has(player)) {

            const entities = /** @type {Entity[]} */ (cameraEntities.get(player));
            for (const entity of entities) {

                const entityName = entity.GetEntityName();
                switch (entityName) {
                    case "thirdperson_move_" + index:
                        Instance.EntFireAtTarget({ target: entity, input: "Open" });
                        Instance.EntFireAtTarget({ target: entity, input: "SetSpeed", value: 360 });
                        break;
                    case "thirdperson_camera":
                        Instance.EntFireAtTarget({ target: entity, input: "DisableCamera", activator: player, delay: 0.5 });
                }
                Instance.EntFireAtTarget({ target: entity, input: "Kill", delay: 1 });
            }
            player.SetEntityName("");
            cameraEntities.delete(player);
        }
    }
});

Instance.OnRoundStart(() => {
    cameraEntities.forEach((value, player) => {
        if (player.IsValid()) player.SetEntityName("");
    });
    cameraEntities.clear();
    cameraIndex = 0;
});