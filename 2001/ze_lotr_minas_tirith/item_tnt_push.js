import { Instance } from "cs_script/point_script";

// @ts-ignore
let TNT_Phys = null;

function Get_TNT_Phys() {
    // @ts-ignore
    if (!TNT_Phys || !TNT_Phys.IsValid()) {
        TNT_Phys = Instance.FindEntityByName("item_tnt_s1");
    }
    return TNT_Phys;
}

//计算发射方向向量
// @ts-ignore
function calculateLaunchDirection(AbsAngles, pitchOffset) {
    let yawRad = AbsAngles.yaw * Math.PI / 180;
    let pitchRad = (AbsAngles.pitch + pitchOffset) * Math.PI / 180;
    
    let x = Math.cos(pitchRad) * Math.cos(yawRad);
    let y = Math.cos(pitchRad) * Math.sin(yawRad);
    let z = Math.sin(pitchRad);
    
    return { x, y, z };
}

Instance.OnScriptInput("LaunchTNT", (inputData) => {
    Instance.Msg("LaunchTNT is running.");
    
    // 获取玩家 (Entity)
    let player = inputData.activator;
    
    if (!player || !player.IsValid()) {
        return;
    }

    // 注意：在CS2中，玩家Pawn的classname通常是 "cs_player_pawn" 而不是 "player"
    // 为了兼容性，这里主要检查 IsValid 和 IsAlive
    if (player.IsAlive && !player.IsAlive()) {
        Instance.Msg("LaunchTNT: Player not alive.");
        return;
    }

    let tnt = Get_TNT_Phys();
    if (!tnt || !tnt.IsValid()) {
        Instance.Msg("LaunchTNT: TNT entity not found or invalid.");
        return;
    }

    let AbsAngles = player.GetAbsAngles(); 
    // 获取角度
    let launchDirection = calculateLaunchDirection(AbsAngles, 60);
    // 设置速度
    let launchSpeed = 720;
    // 设置跳投的额外速度
    let launchBoost = 530; 

    // 获取玩家当前的绝对速度向量 {x, y, z}
    let playerVel = player.GetAbsVelocity(); // 

    // 检查 Z 轴速度。使用 Math.abs 处理向上(正)或向下(负)的速度
    if (playerVel && Math.abs(playerVel.z) > 10) {
        launchSpeed += launchBoost;
        Instance.Msg("Boost applied! Z-Speed: " + playerVel.z);
    }
    // --- 修改结束 ---

    let launchVelocity = {
        x: launchDirection.x * launchSpeed,
        y: launchDirection.y * launchSpeed,
        z: launchDirection.z * launchSpeed
    };

    // 设置TNT速度
    tnt.Teleport({ velocity: launchVelocity });
});