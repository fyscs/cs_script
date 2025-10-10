import { Instance } from "cs_script/point_script";

Instance.OnScriptInput("PickUpFire", ({caller, activator}) => {
    activator.SetEntityName("fire_player");
});

Instance.OnScriptInput("PickUpFreeze", ({caller, activator}) => {
    activator.SetEntityName("freeze_player");
});

Instance.OnScriptInput("PickUpHeal", ({caller, activator}) => {
    activator.SetEntityName("heal_player");
});

Instance.OnScriptInput("PickUpTornado", ({caller, activator}) => {
    activator.SetEntityName("tornado_player");
});

Instance.OnScriptInput("PickUpEarth", ({caller, activator}) => {
    activator.SetEntityName("earth_player");
});

Instance.OnScriptInput("PickUpUltimate", ({caller, activator}) => {
    activator.SetEntityName("ultimate_player");
});

Instance.OnScriptInput("PickUpZFire", ({caller, activator}) => {
    activator.SetEntityName("zmfire_player");
});

Instance.OnScriptInput("PickUpZGrav", ({caller, activator}) => {
    activator.SetEntityName("zmgravity_player");
});

Instance.OnScriptInput("PickUpZFreez", ({caller, activator}) => {
    activator.SetEntityName("zmfreeze_player");
});

Instance.OnScriptInput("PickUpZSkin1", ({caller, activator}) => {
    activator.SetEntityName("zmskin1_player");
});

Instance.OnScriptInput("PickUpZSkin2", ({caller, activator}) => {
    activator.SetEntityName("zmskin2_player");
});

Instance.OnScriptInput("SetZmItemHP", ({caller, activator}) => {
    activator.SetHealth(50000);
});