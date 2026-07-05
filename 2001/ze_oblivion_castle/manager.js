import { CSGearSlot, CSPlayerController, CSPlayerPawn, Instance, PointTemplate } from "cs_script/point_script";


let level = 0;
const INPUT_COOLDOWN = 0.2;
let lastKillAllTime = -INPUT_COOLDOWN;
let lastAddHealthTime = -INPUT_COOLDOWN;

Instance.OnRoundStart(() => {
    Instance.Msg(level);
    Instance.EntFireAtName("Level_Case","InValue",level,0);
});

Instance.OnScriptInput("lv1", () => {
  level = 1;
});
Instance.OnScriptInput("lv2", () => {
  level = 2;
  });
Instance.OnScriptInput("lv3", () => {
  level = 3;
});

Instance.OnScriptInput ("killallt",() => {
    const now = Instance.GetGameTime();
    if (now - lastKillAllTime < INPUT_COOLDOWN) return;
    lastKillAllTime = now;
   
  let players = Instance.FindEntitiesByClass("player");
            for (let i = 0; i < players.length; i++) {
            let player = players[i];
            
            if (player.GetTeamNumber() === 2) { // 2 = T
                player.TakeDamage({ damage: 999999 });
            }
        }
});

Instance.OnScriptInput("addhealth",() => {
        const now = Instance.GetGameTime();
        if (now - lastAddHealthTime < INPUT_COOLDOWN) return;
        lastAddHealthTime = now;

        let add_amount = 2500; 
        
        let players = Instance.FindEntitiesByClass("player");
        let ctCount = 0;
 
        for (let i = 0; i < players.length; i++) {
            let player = players[i];
         
            if (player.GetTeamNumber() === 3) { // 3 = CT
                ctCount++;
            }
        }

        let newHp = 10000 + (add_amount * ctCount);

        if (1) {
            Instance.EntFireAtName("L1_Boss", "SetHealth", newHp.toString(), 0.0);
            Instance.Msg(`[AddHP] CT人数: ${ctCount}, 增加血量: ${add_amount * ctCount}, 新血量: ${newHp}`);
        } }
);
