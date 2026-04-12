import { Instance } from "cs_script/point_script";

// 聊天关键词 → 实体名 映射
const CHAT_SPAWN_MAP = {
    ciallo: "ciallo_sound",
    bbkb: "bbkb_sound",
    ng: "ng_sound",
    omg: "omg_sound",
    lkc: "lkstcc_sound",
    sfm: "syfkm_sound",
    adr: "adrian_sound"
};

// 核心处理函数
function spawnAtPlayer(player, makerName) {
    if (!player || !player.IsValid()) return;

    const pawn = player.GetPlayerPawn();
    if (!pawn || !pawn.IsValid()) return;

    const position = pawn.GetAbsOrigin();
    const maker = Instance.FindEntityByName(makerName);

    if (!maker || !maker.IsValid()) return;

    maker.Teleport({
        position: position
    });

    Instance.EntFireAtTarget({
        target: maker,
        input: "StartSound"
    });
}

// 聊天监听
Instance.OnPlayerChat(function (event) {
    if (!event || !event.text) return;

    const text = event.text.trim();
    const makerName = CHAT_SPAWN_MAP[text];

    if (!makerName) return;

    spawnAtPlayer(event.player, makerName);
});
