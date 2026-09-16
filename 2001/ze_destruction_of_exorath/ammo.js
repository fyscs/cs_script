import { Instance, CSGearSlot } from 'cs_script/point_script';

Instance.OnScriptInput("Ammo_use", (data) => {
    const player = data.activator;

    if (!player)
        return;

    // 弾薬補給
    const primary = player.FindWeaponBySlot(CSGearSlot.RIFLE);
    const secondary = player.FindWeaponBySlot(CSGearSlot.PISTOL);

    if (primary) {
        Instance.EntFireAtTarget({
            target: primary,
            input: "SetAmmoAmount",
            value: "999"
        });
    }

    if (secondary) {
        Instance.EntFireAtTarget({
            target: secondary,
            input: "SetAmmoAmount",
            value: "999"
        });
    }
});