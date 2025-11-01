import { Instance } from 'cs_script/point_script';

let soundevents;
Instance.OnScriptInput("GetHandles", () => {
    soundevents = Instance.FindEntitiesByName("client_soundevent");
});
Instance.OnScriptInput("PlaySound", (context) => {
    const activator = context.activator;
    const slot = activator.GetPlayerController().GetPlayerSlot();
    const clientname = "client" + slot;
    activator.SetEntityName(clientname);
    Instance.EntFireAtTarget({ target: soundevents[slot], input: "SetSourceEntity", value: clientname });
    Instance.EntFireAtTarget({ target: soundevents[slot], input: "StartSound", delay: 0.1 });
});
