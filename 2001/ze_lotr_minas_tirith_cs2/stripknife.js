import { Instance, CSGearSlot } from 'cs_script/point_script';

Instance.OnScriptInput("StripKnife", (inputData) => {
    let activator = inputData.activator;
    activator.DestroyWeapon(activator.FindWeaponBySlot(CSGearSlot.KNIFE));
});