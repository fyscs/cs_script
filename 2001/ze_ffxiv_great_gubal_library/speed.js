import { Instance } from "cs_script/point_script";

const setspeed = 1.0;

//在Stillness函数中，会处死移动的玩家
Instance.OnScriptInput("Stillness", (context) => {

    // 获取玩家
    const player = context.activator;

    if (!player || !player.IsValid) return;

    // 获取玩家速度
    const CurrentVelocity = player.GetAbsVelocity();
    const speed = Math.sqrt(CurrentVelocity.x * CurrentVelocity.x + CurrentVelocity.y * CurrentVelocity.y + CurrentVelocity.z * CurrentVelocity.z);

    // 速度判断
    if (speed > setspeed) {
        Instance.EntFireAtName({ name: "Boss_Hurt", input: "Hurt", activator: player });
    }
});

//在Motion函数中，会处死没动的玩家
Instance.OnScriptInput("Motion", (context) => {

    // 获取玩家
    const player = context.activator;

    if (!player || !player.IsValid) return;

    // 获取玩家速度
    const CurrentVelocity = player.GetAbsVelocity();
    const speed = Math.sqrt(CurrentVelocity.x * CurrentVelocity.x + CurrentVelocity.y * CurrentVelocity.y + CurrentVelocity.z * CurrentVelocity.z);

    // 速度判断
    if (speed < setspeed) {
        Instance.EntFireAtName({ name: "Boss_Hurt", input: "Hurt", activator: player });
    }
});