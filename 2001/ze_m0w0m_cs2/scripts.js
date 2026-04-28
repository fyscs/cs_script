import { Instance } from "cs_script/point_script";

// =============================================
// 通用功能
// =============================================
class vMath {
    static vec(x, y, z) { return { x, y, z }; }
    static ang(p, y, r) { return { pitch: p, yaw: y, roll: r }; }
    static len3(v) { return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2); }
    static len2(v) { return Math.sqrt(v.x ** 2 + v.y ** 2); }
    static sub(v1, v2) { return { x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z }; }
    static add(v1, v2) { return { x: v1.x + v2.x, y: v1.y + v2.y, z: v1.z + v2.z }; }
    static scale(v, s) { return { x: v.x * s, y: v.y * s, z: v.z * s }; }
    static clamp(v, max) {
        const l = this.len3(v);
        return l > max ? this.scale(v, max / l) : v;
    }
    static fwd(a) {
        const p = (a.pitch * Math.PI) / 180;
        const y = (a.yaw * Math.PI) / 180;
        const h = Math.cos(p);
        return { x: Math.cos(y) * h, y: Math.sin(y) * h, z: -Math.sin(p) };
    }
    static vecAng(v) {
        if (!v.y && !v.x) return { pitch: v.z > 0 ? -90 : 90, yaw: 0, roll: 0 };
        return {
            yaw: Math.atan2(v.y, v.x) * 180 / Math.PI,
            pitch: Math.atan2(-v.z, Math.sqrt(v.x ** 2 + v.y ** 2)) * 180 / Math.PI,
            roll: 0
        };
    }
    static rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
}

function print(text) { Instance.Msg(text); }

class EMgr {
    static fire(name = "", input = "", val = "", delay = 0, caller, activator) {
        Instance.EntFireAtName({ name, input, value: val, caller, activator, delay });
    }
    static fireT(target, input = "", val = "", delay = 0, caller, activator) {
        Instance.EntFireAtTarget({ target, input, value: val, caller, activator, delay });
    }
    static find(name) { return Instance.FindEntityByName(name); }
    static findAll(name) { return Instance.FindEntitiesByName(name); }
    static findByClass(cls) { return Instance.FindEntitiesByClass(cls); }
}

var bossadd = [0,50,26,30,3,52,64,36,36,32,3,58]//   s1:50    s2:26|30   s3:3|52   s4:64    s5:36|36|32    s6:3|58
var bosshp = [10,99999];
var s36mini = [100,100,100,100];
var stage = 1;
var caidan = 0;

// 根据血量和总血量计算血条编号（0-9）
function calculateBarIndex(currentHp, maxHp) {
    if (currentHp <= 0) return 0; // 最低血条
    if (currentHp >= maxHp) return 9; // 最高血条
    
    // 计算百分比，然后映射到0-9
    const percentage = currentHp / maxHp;
    // 映射到0-9（血量越高，血条编号越大）
    return Math.floor(percentage * 10)-1;
}

function updateHpBar(barName, currentHp, maxHp) {
    const barIndex = calculateBarIndex(currentHp, maxHp);
    EMgr.fire(barName, "setalphascale", barIndex.toString(), 0);
}

var exnum = 0

Instance.OnScriptInput("voteex", ({activator}) => {
    EMgr.fireT(activator,"addcontext","voteex:1",0)
    exnum ++
    if(exnum/getPlayers().humans > 0.7){
        if(stage <= 3){
            stage += 3;
            EMgr.fire("command","command","endround",3)
            EMgr.fire("command","fireuser1","",0)
        }
    }
})

for(let i = 1;i<=6;i++){
    Instance.OnScriptInput("setstage"+i, () => {
        stage = i
    })
}

for(let i = 1;i<=11;i++){
    Instance.OnScriptInput("setboss"+i, () => {
        bossadd[0] = i
        bosshp[0]=10
        bosshp[1]=getPlayers().humans*bossadd[bossadd[0]];
        const outputs = [
            "s5_endboss_hpbar",
            "s36miniboss_hpbar",
            "s36boss_hpbar",
            "s25boss_hpbar",
            "s14boss_hpbar"
        ];
        // 更新所有boss血条
        outputs.forEach(output => {
            updateHpBar(output, bosshp[0], 10);
        });
    })
}

Instance.OnScriptInput("setboss", () => {
    bosshp[0]=10
    bosshp[1]=getPlayers().humans*bossadd[bossadd[0]];
    const outputs = [
        "s5_endboss_hpbar",
        "s36miniboss_hpbar", 
        "s36boss_hpbar",
        "s25boss_hpbar",
        "s14boss_hpbar"
    ];
    // 更新所有boss血条
    outputs.forEach(output => {
        updateHpBar(output, bosshp[0], 10);
    });
})

Instance.OnScriptInput("reset", ({}) => {
    exnum = 0
    bosshp = [10,99999];
    s36mini = [100,100,100,100];
    EMgr.fire("stage_counter","setvalue",stage.toString(),0)
    const allplayer = EMgr.findByClass("player")
    for(const player of allplayer){
        player.SetHealth(100)
        player.SetArmor(100)
        player.SetEntityName("")
        EMgr.fireT(player,"keyvalues","gravity 1",0)
        EMgr.fireT(player,"keyvalues","speed 1",0)
        EMgr.fireT(player,"alpha","255",0)
        EMgr.fireT(player,"clearcontext","",0)
    }
    if(testmod){
        EMgr.fire("command","command","sv_infinite_ammo 1;give weapon_mp9",0)
        const allplayer = EMgr.findByClass("player")
        for(const player of allplayer){
            player.SetHealth(100000)
            player.SetArmor(100000)
        }
    }
    EMgr.fire("post_*","disable","",0)
    EMgr.fire("w_l_*","hideworldlayeranddestroyentities","",0)
    EMgr.fire("w_l_start","showworldlayerandspawnentities","",0.02)
    EMgr.fire("s14sky","alpha","0",0);
    EMgr.fire("s25sky","alpha","0",0);
    EMgr.fire("s36sky","alpha","0",0);
    EMgr.fire("exsky1","alpha","0",0);
    EMgr.fire("s6sky","alpha","0",0);
    if(caidan >= 3){
        EMgr.fire("caidan_button*","kill","",0);
    }
    switch (stage){
        case 1:
            bossadd[0]=1;EMgr.fire("w_l_s14_0","showworldlayerandspawnentities","",0.02);
            EMgr.fire("s14sky","alpha","255",0.02);
            EMgr.fire("timer_post","addoutput","OnTimer>post_nor>enable>>0>0",0)
            break
        case 2:
            bossadd[0]=2;EMgr.fire("w_l_s25_0","showworldlayerandspawnentities","",0.02);
            EMgr.fire("s25sky","alpha","255",0.02);
            EMgr.fire("timer_post","addoutput","OnTimer>post_nor>enable>>0>0",0)
            break
        case 3:
            bossadd[0]=4;EMgr.fire("w_l_s36_0","showworldlayerandspawnentities","",0.02);
            EMgr.fire("timer_post","addoutput","OnTimer>post_nor>enable>>0>0",0)
            break 
        case 4:
            bossadd[0]=6;EMgr.fire("w_l_s14_0","showworldlayerandspawnentities","",0.02);
            EMgr.fire("s14sky","alpha","255",0.02);
            EMgr.fire("exsky1","alpha","255",0.02);
            EMgr.fire("timer_post","addoutput","OnTimer>post_ex>enable>>0>0",0)
            EMgr.fire("ex_bre0","kill","",0.02);
            if(caidan >= 3){
                EMgr.find("caidan_temp").ForceSpawn(vMath.vec(6992,-4192,-10276),vMath.ang(0,0,0))
            }
            break
        case 5:
            bossadd[0]=7;EMgr.fire("w_l_s25_0","showworldlayerandspawnentities","",0.02);
            EMgr.fire("s25sky","alpha","255",0.02);
            EMgr.fire("exsky1","alpha","255",0.02);
            EMgr.fire("timer_post","addoutput","OnTimer>post_ex>enable>>0>0",0)
            EMgr.fire("ex_bre0","kill","",0.02);
            if(caidan >= 3){
                EMgr.find("caidan_temp").ForceSpawn(vMath.vec(-320,-11648,-12900),vMath.ang(0,0,0))
            }
            break
        case 6:
            bossadd[0]=10;EMgr.fire("w_l_s36_0","showworldlayerandspawnentities","",0.02);
            EMgr.fire("exsky1","alpha","255",0.02);
            EMgr.fire("s6sky","alpha","255",0.02);
            EMgr.fire("timer_post","addoutput","OnTimer>post_ex>enable>>0>0",0)
            EMgr.fire("ex_bre0","kill","",0.02);
            if(caidan >= 3){
                EMgr.find("caidan_temp").ForceSpawn(vMath.vec(-12864,-1584,-14016),vMath.ang(0,0,0))
            }
            break
    }
})

Instance.OnScriptInput("bosshit", ({}) => {
    if(bosshp[1]===99999){bosshp[1] = getPlayers().humans*bossadd[bossadd[0]]}
    bosshp[1]--;
    //print(bosshp[0]+"|"+bosshp[1]+"|"+bossadd[0])
    if(bosshp[1] <= 0){ 
        bosshp[0]--
        bosshp[1] = getPlayers().humans*bossadd[bossadd[0]]
        if(bosshp[0] <= 0){
            bosshp[0] = 0
            EMgr.fire("bosshp3","Subtract","10",0)
        }
        return
    }
    const outputs = [
        "s5_endboss_hpbar",
        "s36miniboss_hpbar", 
        "s36boss_hpbar",
        "s25boss_hpbar",
        "s14boss_hpbar"
    ];
    // 更新所有boss血条
    outputs.forEach(output => {
        updateHpBar(output, bosshp[0], 10);
    });
})

Instance.OnScriptInput("ammo", ({caller}) => {
    const player = EMgr.findByClass("player")
    for(const p of player){

        if(vMath.len2(vMath.sub(p.GetAbsOrigin(),caller.GetAbsOrigin())) < 288){
            EMgr.fireT(p.GetActiveWeapon(), "SetAmmoAmount", "999", 0);
        }
    }
})

Instance.OnScriptInput("s25_layer1", ({}) => {
    for(let i = 255;i>=0;i--){
        EMgr.fire("s25_layer2_m","alpha",i.toString(),1-(i/255))
        EMgr.fire("s25_layer2_m","alpha",(255-i).toString(),6-(i/255))
    }
    EMgr.fire("w_l_s25_2","showworldlayerandspawnentities","",0)
})

Instance.OnScriptInput("caidan", ({}) => {
    if(caidan === 0 && stage === 1){_cmd("Ha!",0);caidan=1}
    else if(caidan === 1 && stage === 2){_cmd("Ha!Ji!",0);caidan=2}
    else if(caidan === 2 && stage === 3){_cmd("Ha!Ji!Mi!",0);caidan=3}
})

Instance.OnScriptInput("caidan_hurt", ({activator}) => {
    let user = EMgr.find("player_caidan")
    activator.TakeDamage({
        damage:1000,
        attacker:user
    })
    activator.Teleport({velocity:vMath.vec(0,0,0)})
})

Instance.OnScriptInput("s36miniadd", ({}) => {
    if(stage===3){
        s36mini[0] = getPlayers().humans*120;
        s36mini[1] = getPlayers().humans*120;
        s36mini[2] = s36mini[0];
        s36mini[3] = s36mini[1];
        // 更新水晶血条
        updateHpBar("s36miniboss_crystal_hpbar", s36mini[2], s36mini[0]);
        updateHpBar("s36miniboss_crystal2_hpbar", s36mini[3], s36mini[1]);
    }else if(stage ===6){
        s36mini[0] = getPlayers().humans*180;
        s36mini[1] = getPlayers().humans*180;
        s36mini[2] = s36mini[0];
        s36mini[3] = s36mini[1];
        // 更新水晶血条
        updateHpBar("s36miniboss_crystal_hpbar", s36mini[2], s36mini[0]);
        updateHpBar("s36miniboss_crystal2_hpbar", s36mini[3], s36mini[1]);
    }
})

Instance.OnScriptInput("s36minihit1", ({}) => {
    s36mini[2]--;
    updateHpBar("s36miniboss_crystal_hpbar", s36mini[2], s36mini[0]);
    if(s36mini[2] < 0){ 
        s36mini[2] = 0;
        EMgr.fire("s36miniboss_crystal_counter3","Subtract","10",0) 
    }
})

Instance.OnScriptInput("s36minihit2", ({}) => {
    s36mini[3]--;
    updateHpBar("s36miniboss_crystal2_hpbar", s36mini[3], s36mini[1]);
    if(s36mini[3] < 0){ 
        s36mini[3] = 0
        EMgr.fire("s36miniboss_crystal2_counter3","Subtract","10",0) 
    }
})

function _cmd(text,time){
    EMgr.fire("command","command","say "+text,time,undefined,undefined)
}

Instance.OnScriptInput("killzombie", () => {killTeam(2)})
Instance.OnScriptInput("killhuman", () => {killTeam(3)})
Instance.OnScriptInput("killall", () => {killTeam(1)})

function killTeam(team) {
    const players = EMgr.findByClass("player")
    for(const p of players){
        if(team === 1 ){
            p.TakeDamage({damage:10000000})
        }else if(team === 2 && p.GetTeamNumber() === 2){
            p.TakeDamage({damage:10000000});
            EMgr.fireT(p,"sethealth","-1",0);
        }else if(team === 3 && p.GetTeamNumber() === 3){
            p.TakeDamage({damage:100000});
            EMgr.fireT(p,"sethealth","-1",0);
        }
    }
        //print(`kill all team`+team);
}

function getPlayers() {
    const players = Instance.FindEntitiesByClass("player");
    let allplayers = 0;
    let zombies = 0;      // 阵营 2
    let humans = 0; // 阵营 3
    
    for (const player of players) {
        if (player.IsValid()) {
            const controller = player.GetPlayerController();
            if (controller && controller.IsValid()) {
                allplayers++;
                const teamNum = controller.GetTeamNumber();
                if (teamNum === 2) {
                    zombies++;
                } else if (teamNum === 3) {
                    humans++;
                }
            }
        }
    }
    
    return {
        allplayers: allplayers,
        zombies: zombies,
        humans: humans,
    };
}

var testmod = false;
var teststage = 1;
if(testmod){
    caidan = 3
    stage = teststage
    EMgr.fire("stage_counter","setvalue",teststage.toString(),0)
    EMgr.fire("command","command","endround",0.5)
}