import { Instance, CSGearSlot } from 'cs_script/point_script';

Instance.OnScriptInput("StripKnife", ({ activator }) => {
    if (!activator)
        return;

    const weapon = activator.FindWeaponBySlot(CSGearSlot.KNIFE);
    if (!weapon)
        return;

    activator.DestroyWeapon(weapon);
});