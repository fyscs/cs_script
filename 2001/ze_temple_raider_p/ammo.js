import { Instance } from 'cs_script/point_script'

Instance.OnScriptInput("GiveAmmo", (context) => {
    let activator = context.activator
    if (activator.GetHealth() > 0){
        let playerWeapon = activator.GetActiveWeapon()
        Instance.EntFireAtTarget({target: playerWeapon, input: "SetAmmoAmount", value: 9999})
    }
})