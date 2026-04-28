// 沉默中的羔羊
import { Instance } from "cs_script/point_script";

let addhp = 0;
Instance.OnScriptInput ("addhealth_150",() => {
    addhp=150;
    add_hhealth(addhp);
});
Instance.OnScriptInput ("addhealth_200",() => {
    addhp=200;
    add_hhealth(addhp);
});
Instance.OnScriptInput ("addhealth_rtv",() => {
   let players = Instance.FindEntitiesByClass("player");
            for (let i = 0; i < players.length; i++) {
            let player = players[i];
            
            if (player.GetTeamNumber() === 3) { 
                player.SetHealth(150);
                player.SetMaxHealth(1);
            }
        }
});


function add_hhealth(value){

let players = Instance.FindEntitiesByClass("player");
            for (let i = 0; i < players.length; i++) {
            let player = players[i];
            
            if (player.GetTeamNumber() === 3) { 
                player.SetHealth(value);
                player.SetMaxHealth(value);
            }
        }
};