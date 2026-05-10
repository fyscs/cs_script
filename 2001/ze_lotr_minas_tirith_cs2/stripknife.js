import { Instance, CSGearSlot } from 'cs_script/point_script';

Instance.OnScriptInput('StripKnife', ({ activator }) => {
    const knife = activator.FindWeaponBySlot(CSGearSlot.KNIFE);

    if (!knife)
        return;

    activator.DestroyWeapon(knife);
});