// 沉默中的羔羊
import { Instance } from "cs_script/point_script";


let attack = 1;
let defence = 1;
let npc_relay = "";

Instance.OnScriptInput("addattack", () => {
     if (1) {
        attack++;
       
        attackpart(attack); 
        Instance.Msg(attack);
    } 
   
 });

Instance.OnScriptInput("adddefence", () => {
    if (1) {
        defence++;
      
        defencepart(defence);  
    } 
});

// 重置函数
 
 function attackpart(value){
    if(value<10){
       let value1=value-1;   
        Instance.EntFireAtName({name:"a"+value1+"_text", input:"stop"});
        Instance.EntFireAtName({name:"a"+value+"_text",input:"start"});

    };
    if(value==10){
        Instance.EntFireAtName({ name: "a9_text", input: "stop"});
        Instance.EntFireAtName({ name: "a0_1_text", input:"start"})
        Instance.EntFireAtName({ name: "a0_text", input: "start"})
    };
     if(value>10){
          value = value-10;
          let value1=value-1;
          Instance.EntFireAtName({ name: "a"+value1+"_text", input: "stop"});
          Instance.EntFireAtName({ name: "a"+value+"_text", input: "start"});
    };
    };
 function defencepart(defence){
    if(defence<10){
        let defence1=defence-1;
          Instance.EntFireAtName({ name: "d"+defence1+"_text", input: "stop"});
          Instance.EntFireAtName({ name: "d"+defence+"_text", input: "start"});
    };
    if(defence==10){
        Instance.EntFireAtName({ name: "d9_text", input: "stop"});
        Instance.EntFireAtName({ name: "d0_1_text", input:"start"})
        Instance.EntFireAtName({ name: "d0_text", input: "start"})
    };
     if(defence>10){
          defence = defence-10;
          let defence1=defence-1;
          Instance.EntFireAtName({ name: "d"+defence1+"_text", input: "stop"});
          Instance.EntFireAtName({ name: "d"+defence+"_text", input: "start"});
    };
    };

let hurt_hhp = 0;
let hurt_mhp = 0;
    Instance.OnScriptInput("npchurt_gslime", () => {
        if(1){
    hurt_hhp=10-defence;
    
    npc_relay = "npc_1_relay";
    hurt_mhp = attack-0;
    Instance.Msg(hurt_mhp);
    Instance.EntFireAtName({ name: "npc_hurt", input: "keyvalues", value: "damage "+hurt_hhp});
     Instance.EntFireAtName("manager", "RunScriptInput","npchurt", 0.01)
           
           
        }
});
    Instance.OnScriptInput("npchurt_rslime", () => {
        if(1){
     hurt_hhp=20-defence;
    
    npc_relay = "npc_2_relay";
     hurt_mhp = attack-0;
      Instance.EntFireAtName({ name: "npc_hurt", input: "keyvalues", value: "damage "+hurt_hhp});
      Instance.EntFireAtName("manager", "RunScriptInput","npchurt", 0.01)
           Instance.Msg(attack);
        }
});
Instance.Msg(hurt_mhp);

Instance.OnScriptInput("npchurt", () => {
        if(1){
       
  if (hurt_mhp!=0){
   Instance.EntFireAtName({ name: npc_relay, input: "trigger" });
   hurt_mhp = hurt_mhp - 1;
   Instance.EntFireAtName("manager", "RunScriptInput", "npchurt", 0.1)
   Instance.Msg(attack);
  };
        }
});
//function npchurt(value_mhp,value_relay,delay){
   
  //if (value_mhp!=0){
   //Instance.EntFireAtName({ name: value_relay, input: "trigger" , delay: 0.5});
   //value_mhp = value_mhp - 1;
   //npchurt(value_mhp, value_relay,delay);
   //Instance.Msg(attack);
  //};};
let npc_hp = 0;
let npc_hp1 = 0;
let npc_s = "";

    Instance.OnScriptInput("rslime_health_math", () => {
        if(1){
         npc_hp = 20;  
         npc_s = "redslime";
         npc_hp1++;
      npc_hp=npc_hp-npc_hp1;
        };
     
    npc_hp_text(npc_hp);
     
    if(npc_hp1 == 20){
        npc_hp1 =0;
    };
      });



Instance.OnRoundStart(() => {
    attack=1;
    defence=1;
    npc_hp = 0;
    npc_hp1 = 0;
    npc_s = "";

attackpart(attack); 
defencepart(defence);
});

Instance.OnScriptInput ("killallt",() => {
   
 let players = Instance.FindEntitiesByClass("player");
            for (let i = 0; i < players.length; i++) {
            let player = players[i];
            
            if (player.GetTeamNumber() === 2) { // 2 = T
                player.TakeDamage({ damage: 99999 });
            }
        }
});



function npc_hp_text(value){
    if (npc_s == "redslime"){
        value = value - 1;
         Instance.EntFireAtName({ name: "rslime_health", input: "SetMessage", value: "当前生命 "+value});
    }
   
}





   
 Instance.OnScriptInput(test_health,() => {
    if (1) {
        let players = Instance.FindEntitiesByClass("player");
        let ctCount = 0;

        for (let i = 0; i < players.length; i++) {
            let player = players[i];
            if (player && typeof player.GetTeamNumber === "function") {
                if (player.GetTeamNumber() === 3) { 
                    ctCount++;
                }
            }
        }

        
     if (ctCount < 20) {
        let players = Instance.FindEntitiesByClass("player");
         for (let i = 0; i < players.length; i++) {
            let player = players[i];
            
            if (player.GetTeamNumber() === 3) { // 3 = CT
                player.SetHealth(200);
            }
        }
        
    }
    }});


