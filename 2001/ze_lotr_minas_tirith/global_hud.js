import { Instance } from "cs_script/point_script";

let remaining = 0; // 总时间
let delay = 0; // 每次触发的延迟
let isCounting = false; // 添加一个标志来控制倒计时，防止重复启动

function tickCountdown() {
    if (!isCounting) return;

    if (remaining < 0) {
        Instance.Msg("Countdown finished!");
        isCounting = false;
        return;
    }

    const text = "TIME UNTIL GHOST ARMY ARRIVAL:" + remaining + " SECONDS";
    Instance.EntFireAtName({
        name: "counter",
        input: "SetMessage",
        value: text,
        delay: 0
    });

    Instance.EntFireAtName({
        name: "countdown",
        input: "CountPlayersInZone",
        delay: 0.1
    });

    remaining--;

    Instance.Msg("Countdown " + remaining);
    
    Instance.SetNextThink(Instance.GetGameTime() + 1.0);
}

Instance.OnScriptInput("globalHUD", () => {
    if (isCounting) {
        Instance.Msg("Countdown is already running.");
        return;
    }

    remaining = 150;
    isCounting = true;

    Instance.SetThink(tickCountdown);
    tickCountdown(); // 立即显示首帧
    Instance.SetNextThink(Instance.GetGameTime() + 1.0);
});