import { Instance, CSPlayerPawn, CSGearSlot } from "cs_script/point_script";

/**
 * 玩家武器剥离脚本
 * 此脚本由皮皮猫233编写
 * 2025/11/23
 */

let active = false;

Instance.OnScriptInput("Enable", () => {
    active = true;
    Instance.SetNextThink(Instance.GetGameTime());
});

Instance.OnScriptInput("Disable", () => {
    active = false;
});

Instance.OnScriptInput("GiveWeapon", () => {
    const players = /** @type {CSPlayerPawn[]} */ (Instance.FindEntitiesByClass("player"));
    for (const player of players) {
        if (!player || !player.IsValid()) continue;
        // 主武器检查
        const rifle = player.FindWeaponBySlot(CSGearSlot.RIFLE);
        if (!rifle) {
            player.GiveNamedItem("weapon_ak47");
        }
    }
})

Instance.OnRoundStart(() => {
    active = false;
});

Instance.SetThink(() => {
    if (!active) return;
    const players = /** @type {CSPlayerPawn[]} */ (Instance.FindEntitiesByClass("player"));
    for (const player of players) {
        if (!player || !player.IsValid()) continue;

        // 主武器检查
        const rifle = player.FindWeaponBySlot(CSGearSlot.RIFLE);
        if (rifle && rifle.IsValid()) {
            player.DestroyWeapon(rifle);
        }

        // 副武器检查
        const pistol = player.FindWeaponBySlot(CSGearSlot.PISTOL);
        if (pistol && pistol.IsValid()) {
            player.DestroyWeapon(pistol);
        }

        // 切换至匕首
        const knife = player.FindWeaponBySlot(CSGearSlot.KNIFE);
        if (knife && knife.IsValid()) {
            player.SwitchToWeapon(knife);
        }
    }
    Instance.SetNextThink(Instance.GetGameTime() + 1);
});
