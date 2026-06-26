import { Instance } from "cs_script/point_script";

Instance.OnScriptInput("Drop", (event) => {
    const Player = event.activator;
    if (!Player || !Player.IsValid()) return;
    Player.GetPlayerController().GetPlayerPawn().DropWeapon(Player.GetPlayerController().GetPlayerPawn().GetActiveWeapon());
});