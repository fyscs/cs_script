import { Instance } from "cs_script/point_script";

Instance.OnScriptInput("Drop", (event) => {
    const player = event.activator;
    if (!player?.IsValid()) return;

    const playerController = player.GetPlayerController();
    const playerPawn = playerController?.GetPlayerPawn();
    const activeWeapon = playerPawn?.GetActiveWeapon();

    if (!playerPawn?.IsValid() || !activeWeapon?.IsValid()) return;
    playerPawn.DropWeapon(activeWeapon);
});
