import { Instance } from "cs_script/point_script";

Instance.OnScriptInput("Drop", ({ caller, activator }) => {
    if (activator?.IsValid())
    {
        const player = activator;
        const active_weapon = player.GetActiveWeapon();
        if (active_weapon)
            player?.DropWeapon(active_weapon);
    }
});