import { Instance } from "cs_script/point_script";

Instance.OnScriptInput("nameShow", (context) => {
    const player = context.activator;
    if (!player || !player.IsValid())
        return;
    Instance.EntFireAtName({ name: "kart_1st_text", input: "SetMessage", value: player.GetPlayerController().GetPlayerName() });
});