import { Instance } from "cs_script/point_script";

/*
    聊天关键词 -> Context 配置
    以后新增内容，只需要在这里加
*/
const CHAT_CONTEXT_MAP = {
    jump: {
        add: "jump:1",
        remove: "jump"
    },
    around: {
        add: "around:1",
        remove: "around"
    },
    push: {
        add: "push:1",
        remove: "push"
    }
};

/* =========================
   聊天监听：addcontext
   ========================= */
Instance.OnPlayerChat(function (event) {
    if (!event || !event.text || !event.player) return;

    const key = event.text.toLowerCase();
    const config = CHAT_CONTEXT_MAP[key];
    if (!config) return;

    const playerPawn = event.player.GetPlayerPawn();
    if (!playerPawn || !playerPawn.IsValid()) return;

    Instance.EntFireAtTarget({
        target: playerPawn,
        input: "addcontext",
        value: config.add
    });
});
