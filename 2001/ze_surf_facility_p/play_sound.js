import { Instance } from 'cs_script/point_script';

let soundevents;
Instance.OnScriptInput("GetHandles", () => {
    soundevents = Instance.FindEntitiesByName("client_soundevent");
});
Instance.OnScriptInput("PlaySound", (context) => {
    let activator = context.activator;
    let slot = activator.GetPlayerController().GetPlayerSlot();
    activator.SetEntityName("client" + slot);
    Instance.EntFireAtTarget(soundevents[slot], "SetSourceEntity", "client" + slot, 0);
    Instance.EntFireAtTarget(soundevents[slot], "StartSound", "", 0.1);
});
