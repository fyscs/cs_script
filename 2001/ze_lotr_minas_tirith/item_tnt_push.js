import { Instance } from "cs_script/point_script";

// @ts-ignore
let TNT_Phys = null;


function Get_TNT_Phys() {
    // @ts-ignore
    if (!TNT_Phys || !TNT_Phys.IsValid()) {
        // 如果 TNT_Phys 为null/undefined则运行
        TNT_Phys = Instance.FindEntityByName("item_tnt_s1");
        // 抓取Entity存入变量TNT_Phys
    }
    return TNT_Phys;
}

//计算发射方向向量
//@param {QAngle} AbsAngles - 玩家视角角度
//@param {number} pitchOffset - 俯仰角偏移（度）
//@returns {Vector} 标准化后的方向向量

// @ts-ignore
function calculateLaunchDirection(AbsAngles, pitchOffset) {
    // 将角度转换为弧度
    let yawRad = AbsAngles.yaw * Math.PI / 180;
    let pitchRad = (AbsAngles.pitch + pitchOffset) * Math.PI / 180;
    
    // 计算方向向量的各分量
    let x = Math.cos(pitchRad) * Math.cos(yawRad);
    let y = Math.cos(pitchRad) * Math.sin(yawRad);
    let z = Math.sin(pitchRad);
    
    return { x, y, z };
}

Instance.OnScriptInput("LaunchTNT", (inputData) => {
    Instance.Msg("LaunchTNT is running.");
    // 获取玩家 
    let player = inputData.activator;
    if (!player || !player.IsValid()) 
        return;

    if (!player || player.GetClassName() !== "player") {
        Instance.Msg("LaunchTNT: Invalid player. Got: " + player?.GetClassName());
        return;
    }

    // 类型断言：我们已验证 class name，可以安全断言
    if (!player || !player.IsValid() || !player.IsAlive()) {
        // 错误报告
        Instance.Msg("LaunchTNT: Player pawn not valid or not alive.");
        return;
    }

    let tnt = Get_TNT_Phys();
    if (!tnt || !tnt.IsValid()) {
        // 错误报告
        Instance.Msg("LaunchTNT: TNT entity not found or invalid.");
        return;
    }

    let AbsAngles = player.GetAbsAngles();
    let launchDirection = calculateLaunchDirection(AbsAngles, 60);
    let launchSpeed = 1120;
    let launchVelocity = {
        x: launchDirection.x * launchSpeed,
        y: launchDirection.y * launchSpeed,
        z: launchDirection.z * launchSpeed
    };

    tnt.Teleport({ velocity: launchVelocity });
});