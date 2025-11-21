import { Instance } from "cs_script/point_script";

// by 凯岩城的狼
Instance.OnPlayerDisconnect((event) => {
    try {
        const playerSlot = event.playerSlot;
        // 尝试获取玩家控制器来获取真实名字
        const playerController = Instance.GetPlayerController(playerSlot);
        let playerName = `ID=${playerSlot}`;
        
        if (playerController && typeof playerController.GetPlayerName === "function") {
            const realName = playerController.GetPlayerName();
            if (realName && realName.trim() !== '') {
                playerName = realName;
            }
        }
        
        // 发送到聊天框 - 使用服务器命令（带颜色）
        Instance.ServerCommand(`say \x04有人被撅爆了: \x03${playerName}\x01, \x05原因=断开连接`);
    } catch (error) {
    }
});

Instance.OnActivate(() => {});
Instance.OnScriptReload({ after: () => {} });