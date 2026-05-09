import { Instance } from "cs_script/point_script";

/**
 * 清除玩家所有context
 */
function clearAllContexts() {
    const players = Instance.FindEntitiesByClass("player");
    for (const player of players) {
        if (!player?.IsValid()) continue;
        Instance.EntFireAtTarget({
            target: player,
            input: "ClearContext"
        });
    }
}

/**
 * 每回合开始时重置玩家context
 * CT: 移除Zombie context, 添加Human:1 context
 * T: 移除Human context, 添加Zombie:1 context
 */
function resetPlayerContexts() {
    const players = Instance.FindEntitiesByClass("player");
    
    for (const player of players) {
        if (!player?.IsValid() || !player.IsAlive()) continue;
        
        const team = player.GetTeamNumber();
        
        if (team === 3) {
            // CT - 移除Zombie, 添加Human:1
            Instance.EntFireAtTarget({ 
                target: player, 
                input: "RemoveContext", 
                value: "Zombie" 
            });
            Instance.EntFireAtTarget({ 
                target: player, 
                input: "AddContext", 
                value: "Human:1",
                delay: 1.0 
            });
        } else if (team === 2) {
            // T - 移除Human, 添加Zombie:1
            Instance.EntFireAtTarget({ 
                target: player, 
                input: "RemoveContext", 
                value: "Human" 
            });
            Instance.EntFireAtTarget({ 
                target: player, 
                input: "AddContext", 
                value: "Zombie:1",
                delay: 1.0 
            });
        }
    }
}

let contextThinkActive = false;

Instance.OnRoundStart(() => {
    clearAllContexts();
    resetPlayerContexts();
    contextThinkActive = true;
});

Instance.SetThink(() => {
    if (contextThinkActive) {
        resetPlayerContexts();
    }
    Instance.SetNextThink(Instance.GetGameTime() + 10.0);
});

Instance.SetNextThink(Instance.GetGameTime());

Instance.OnScriptInput("clear_context", (event) => {
    clearAllContexts();
});

Instance.OnScriptInput("reset_context", (event) => {
    resetPlayerContexts();
});

Instance.OnPlayerReset((event) => {
    const player = event.player;
    if (!player?.IsValid()) return;
    
    const team = player.GetTeamNumber();
    
    if (team === 3) {
        // CT - 移除Zombie, 添加Human:1
        Instance.EntFireAtTarget({ 
            target: player, 
            input: "RemoveContext", 
            value: "Zombie" 
        });
        Instance.EntFireAtTarget({ 
            target: player, 
            input: "AddContext", 
            value: "Human:1",
            delay: 1.0 
        });
    } else if (team === 2) {
        // T - 移除Human, 添加Zombie:1
        Instance.EntFireAtTarget({ 
            target: player, 
            input: "RemoveContext", 
            value: "Human" 
        });
        Instance.EntFireAtTarget({ 
            target: player, 
            input: "AddContext", 
            value: "Zombie:1",
            delay: 1.0 
        });
    }
});
