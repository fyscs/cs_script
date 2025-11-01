
import { Instance } from "cs_script/point_script";

var self = "script"   //Entity name of Script
//------------------------------------------------------- function by 7ychu5 --------------------------------------------------------------

function print(a) {Instance.Msg(a);}

function EntFire(targetname,key,value="",delay=0){Instance.EntFireAtName(targetname,key,value,delay)}

function Rand(min, max) {return Math.floor(Math.random() * (max - min + 1) ) + min;}

function GetDistance3D(v1,v2) {return Math.sqrt((v1[0]-v2[0])*(v1[0]-v2[0]) + (v1[1]-v2[1])*(v1[1]-v2[1]) + (v1[2]-v2[2])*(v1[2]-v2[2]))}

//------------------------------------------------------- function by lopb ----------------------------------------------------------------------------------------------------

var playernum = [0,0,0,0]
Instance.OnScriptInput("players",() => {_GetPlayers()})//1为所有玩家数，2为T阵营玩家数，3为CT阵营玩家数
function _GetPlayers(){
    playernum = [0,0,0,0]
    for (let j = 0; j < 64; j++) {
        var pawn = Instance.GetPlayerController(j);
		if(!pawn){continue}
        if (pawn.GetTeamNumber() == 3) {
			playernum[1]++
			playernum[3]++
        }else if(pawn.GetTeamNumber() == 2){
			playernum[1]++
			playernum[2]++
		}
    }
}

function _cmd(context,num){EntFire("command","command","say "+context.toString(),Number(num));}

function origininbox(ent,x,y,z,a,b,c){let origin = ent.GetOrigin().toString().split(",");if( Number(origin[0]) < Number(x)+Number(a)/2 && Number(origin[0]) >= Number(x)-Number(a)/2 && Number(origin[1]) < Number(y)+Number(b)/2 && Number(origin[1]) >= Number(y)-Number(b)/2 && Number(origin[2]) < Number(z)+Number(c)/2 && Number(origin[2]) >= Number(z)-Number(c)/2 ){return true}}

function origininsphere(ent,x,y,z,length){let origin = ent.GetOrigin().toString().split(",");if( GetDistance3D([Number(x),Number(y),Number(z)],origin) <= Number(length) ){return true}}
//-------------------------------------------------------------- global function ------------------------------------------------------------------------------------------------------------------

Instance.OnScriptInput("boss_test",() => {boss_hp = 0;_hitboss()})

Instance.OnScriptInput("reset",() => {_reset()})
function _reset(){
    boss_hp_counter = 0
    boss_hp = 100
    boss_hitable = false
    boss_die = false
    rtv_delay = [0,0.15,0.3,1.5]
    boss_hp_add = [0,150,0,[90,75,120],[120,75,90]]
    boss_maxhp = 100
    s3_start_counter = 0
    s3_num = Rand(1,2)
    s4_end0_dpos = [-3056,8336,-10976]
    s4end1_delay = [0.56,0.15,0.3,1.5]

    bath_cd =[3,60,300]
    bath_atk_cd = 0
    bath_s1_cd = 0
    bath_s2_cd = 0

    lamiya_cd =[30,2,20,60,30]//------------------------1:自动回血CD|2:平Acd|3:冲刺CD|4:变身CD|5:变身持续时间------------------------------------------------
    lamiya_hp = 15
    lamiya_maxhp = lamiya_hp
    lamiya_atk_cd = 0
    lamiya_s1_cd = 0
    lamiya_s2_cd = 0
    lamiya_selfheal = 0
    lamiya_trans = 0

    emma_cd =[3,30,8]
    emma_atk_cd = 0
    emma_s1_cd = 0

    bitru_cd =[3,10,100,20]
    bitru_atk_cd = 0
    bitru_s1_cd = 0
    bitru_s2_cd = 0
    
    EntFire("lamiya_s2_relay0","addoutput","OnTrigger>lamiya_model>SetAnimationNotLooping>change2>"+(lamiya_cd[4]+3)+">0",0);
    EntFire("lamiya_s2_relay0","addoutput","OnTrigger>lamiya_ui2>Deactivate>>"+(lamiya_cd[4]+3)+">0",0);
    EntFire("lamiya_s2_relay0","addoutput","OnTrigger>lamiya_s2_hurt0>enable>>"+(lamiya_cd[4]+7.3)+">0",0);
    EntFire("lamiya_s2_relay0","addoutput","OnTrigger>lamiya_s2_hurt0>disable>>"+(lamiya_cd[4]+7.6)+">0",0);
    EntFire("lamiya_s2_relay0","addoutput","OnTrigger>lamiya_ui>Activate>>"+(lamiya_cd[4]+8)+">0",0);
    EntFire("lamiya_s2_relay0","addoutput","OnTrigger>lamiya_model>SetIdleAnimationLooping>run>"+(lamiya_cd[4]+8)+">0",0);
    
    EntFire("emma_s1_relay1","addoutput","OnTrigger>emma_model>SetAnimationLooping>run>"+(emma_cd[2])+">0",0);
    EntFire("emma_s1_relay1","addoutput","OnTrigger>emma_model>SetIdleAnimationLooping>run>"+(emma_cd[2])+">0",0);
    EntFire("emma_s1_relay1","addoutput","OnTrigger>emma_s1_par0>stop>>"+(emma_cd[2])+">0",0);
    EntFire("emma_s1_relay1","addoutput","OnTrigger>emma_s1_par1>stop>>"+(emma_cd[2])+">0",0);
    EntFire("emma_s1_relay1","addoutput","OnTrigger>emma_s1_tele0>disable>>"+(emma_cd[2])+">0",0);
    EntFire("emma_s1_relay1","addoutput","OnTrigger>!activator>KeyValues>speed 1>"+(emma_cd[2])+">0",0);
}

var rtv_delay = [0,0.2,0.3,2]
var stage = 1;
var boss_hp_counter = 0
var boss_hp = 100
var boss_hitable = false
var boss_die = false
var boss_hp_add = [0,150,0,[100,75,125],[65,100]]
var boss_maxhp = 100
var caidan = false
var s4_toboss = false
var ingame = [0,0]

Instance.OnScriptInput("ingame0",() => {_ingame0()})
function _ingame0(){
    if(ingame[0]==0){
        EntFire("steam2_0_par0","fireuser1","",0);
        ingame[0]=1
    }
}

Instance.OnScriptInput("ingame1",() => {_ingame1()})
function _ingame1(){
    if(ingame[1]==0){
        EntFire("steam2_1_par0","fireuser1","",0);
        ingame[1]=1
    }
}

Instance.OnScriptInput("start",() => {_start()})
function _start(){
    _reset()
    //EntFire("test_relay","trigger","",0);
    EntFire("s*","hideworldlayeranddestroyentities","",0);
    EntFire("s0_place1_layer","showworldlayerandspawnentities","",0.5);
    EntFire("sky_final","disable","",0);
    EntFire("sky_*","alpha","0",0);
    EntFire("sky_*","stop","",0);
    EntFire("sky_start0","alpha","255",0.5);
    EntFire("main_p","start","",0);
    EntFire("pool","start","",0);
    EntFire("bath_maker","ForceSpawn","",3);
    EntFire("item_maker_*","ForceSpawn","",3);
    EntFire("sound_s"+stage+"_0","startsound","",5);
    switch(stage){
        case 1:
            boss_hp_counter = 6
            EntFire("lvl2_start_p","break","",0);
            EntFire("lvl3_start_p","break","",0);
            EntFire("lvl4_start_p","break","",0);
            EntFire("sky_spring","enable","",0.02);
            EntFire("sky_summer","disable","",0.02);
            EntFire("sky_autumn","disable","",0.02);
            EntFire("sky_winter","disable","",0.02);
            EntFire("dest1","keyvalue","origin -10604 3698 -14624",0);
            EntFire("dest1","keyvalue","angles 0 33.75 0",0);
            EntFire("lvl1_ir_relay","enable","",0);
            EntFire("lvl1_relay","trigger","",0);
            EntFire("lvl1_doo2_main","Open","",0);
            EntFire("lvl1_door2_2","Open","",0);
            EntFire("lvl1_door2","Open","",0);
            EntFire("lvl1_door3","Open","",0);
            EntFire("lvl1_dynamic_boss","alpha","0",0);
            EntFire("lvl1_a_p","start","",0);
            EntFire("spring_start_p","keyvalue","origin -12112 -13184 -13920",0);
            EntFire("spring_start_p","forcespawn","",0.5);
            EntFire("item_season_maker","forcespawn","",0);
            EntFire("item_season_counter","SetHitMax","2",0);
            EntFire("lvl1_plane","forcespawn","",1);
            EntFire("lvl1_sound1","startsound","",2);
            break
        case 2:
            EntFire("lvl1_start_p","break","",0);
            EntFire("lvl3_start_p","break","",0);
            EntFire("lvl4_start_p","break","",0);
            EntFire("sky_spring","disable","",0.02);
            EntFire("sky_summer","enable","",0.02);
            EntFire("sky_autumn","disable","",0.02);
            EntFire("sky_winter","disable","",0.02);
            EntFire("dest1","keyvalue","origin 13702 -13760 -11760",0);
            EntFire("dest1","keyvalue","angles 0 180 0",0);
            EntFire("lvl2_ir_relay","enable","",0);
            EntFire("lvl2_relay","trigger","",0);
            EntFire("lvl2_add_way","open","",0);
            EntFire("lvl2_final_dynamic","alpha","0",0);
            EntFire("summer_start_p","keyvalue","origin -12112 -13184 -13920",0);
            EntFire("summer_start_p","forcespawn","",0.5);
            EntFire("item_season_maker","forcespawn","",0);
            EntFire("item_season_counter","SetHitMax","3",0);
            EntFire("lvl2_sound1","startsound","",2);
            break
        case 3:
            EntFire("lvl1_start_p","break","",0);
            EntFire("lvl2_start_p","break","",0);
            EntFire("lvl4_start_p","break","",0);
            EntFire("sky_spring","disable","",0.02);
            EntFire("sky_summer","disable","",0.02);
            EntFire("sky_autumn","enable","",0.02);
            EntFire("sky_winter","disable","",0.02);
            EntFire("dest1","keyvalue","origin -15352 2936 8632",0);
            EntFire("dest1","keyvalue","angles 0 45 0",0);
            EntFire("lvl3_ir_relay","enable","",0);
            EntFire("lvl3_relay","trigger","",0);
            EntFire("camera_autumn_p","start","",0);
            EntFire("lvl3_final_dynamic","alpha","0",0);
            EntFire("autumn_start_p","keyvalue","origin -12112 -13184 -13920",0);
            EntFire("autumn_start_p","forcespawn","",0.5);
            EntFire("item_season_maker","forcespawn","",0);
            EntFire("item_season_counter","SetHitMax","4",0);
            EntFire("lvl3_plane","forcespawn","",1);
            EntFire("lvl3_sound1","startsound","",2);
            break
        case 4:
            EntFire("rtv_bre0","break","",0);
            let n = Rand(1,2)
            if(n==1){EntFire("sound_s4_2","kill","",0);}else{EntFire("sound_s4_2_2","kill","",0);}
            EntFire("lvl1_start_p","break","",0);
            EntFire("lvl2_start_p","break","",0);
            EntFire("lvl3_start_p","break","",0);
            EntFire("sky_spring","disable","",0.02);
            EntFire("sky_summer","disable","",0.02);
            EntFire("sky_autumn","disable","",0.02);
            EntFire("sky_winter","enable","",0.02);
            EntFire("lvl4_relay","trigger","",0);
            EntFire("winter_start_p","keyvalue","origin -12112 -13184 -13920",0);
            EntFire("winter_start_p","forcespawn","",0.5);
            EntFire("item_season_maker","forcespawn","",0);
            EntFire("item_season_counter","SetHitMax","4",0);
            EntFire("lvl4_sound1","startsound","",2);
            if(caidan){EntFire("item_ult_temp0","forcespawn","",0.5);}
            if(s4_toboss){
                EntFire("dest1","keyvalue","origin 14928.5 -2122.95 7804",0);
                EntFire("dest1","keyvalue","angles 0 105 0",0);
                EntFire("lvl4_ir_relay2","enable","",0);
            }else{
                EntFire("dest1","keyvalue","origin -15904 15056 -4216",0);
                EntFire("dest1","keyvalue","angles 0 0 0",0);
                EntFire("lvl4_ir_relay","enable","",0);
            }
            break
        case 5:
            EntFire("s4_end1_d4_timer0","refiretime",rtv_delay[1].toString(),0);
            EntFire("s4_end1_d5_timer0","refiretime",rtv_delay[2].toString(),0);
            EntFire("s4_end1_d6_timer0","refiretime",rtv_delay[3].toString(),0);
            let bt = 10
            EntFire("lv1_tower_tri*","kill","",0);
            EntFire("lv1_tower_light_button0","kill","",0);
            EntFire("lv1_tower_button*","kill","",0);
            EntFire("lvl1_trigger7","kill","",0);
            EntFire("lv1_tower_bre*","kill","",0);
            EntFire("lvl1_dynamic_boss","kill","",0);
            EntFire("bitru_pick_tri","kill","",0);
            EntFire("lamiya_pick_tri","kill","",0);
            EntFire("lv1_tower_side2_jump0","enable","",0);
            EntFire("sky_spring","disable","",0.02);
            EntFire("sky_summer","disable","",0.02);
            EntFire("sky_autumn","disable","",0.02);
            EntFire("sky_winter","disable","",0.02);
            EntFire("sky_final","enable","",0.02);
            EntFire("lv1_tower_tp0","kill","",0);
            EntFire("lv1_tower_tp1","kill","",0);
            EntFire("lv1_tower_tp2","kill","",0);
            EntFire("lv1_tower_tp3","kill","",0);
            EntFire("lvl1_start_p","kill","",0);
            EntFire("lvl2_start_p","kill","",0);
            EntFire("lvl3_start_p","kill","",0);
            EntFire("lvl4_start_p","kill","",0);
            EntFire("rtv_gra0","enable","",0);

            let l = ["-14656 -6272 -15376",
                    "-14208 -5120 -15008",
                    "-12096 -5120 -14976",
                    "-13104 -2992 -14240",
                    "-11472 -7328 -13056",
                    "-11392 -3456 -13728",
                    "-13056 -5120 -11264",
                    "-12912 -5376 -10176",
                    "-15552 -5120 -15680",
                    "-16032 -4768 -13392"
            ]
            let o = 0
            print(l.length)
            for( let t = 0;o<l.length;o++){
                t+=0.02
                EntFire("rtv_hp_temp0","keyvalue","origin "+l[o],t);
                EntFire("rtv_hp_temp0","forcespawn","",t+0.01);
            }

            _cmd("165 sec",bt);
            _cmd("60 sec",bt+105);
            _cmd("30 sec",bt+135);
            _cmd("10 sec",bt+155);
            EntFire("start_trigger","addoutput","OnStartTouch>dest_start>KeyValues>origin -13056 -5120 -15636>21>1",0);
            EntFire("s1_place2_layer","showworldlayerandspawnentities","",0.1);
            EntFire("dest_item_room","keyvalue","origin -13056 -5120 -15636",0);
            EntFire("dest_item_room","keyvalue","angles 0 0 0",0);
            EntFire("sound_rtv","startsound","",bt);
            EntFire("teleport1_zm","enable","",bt+155);
            EntFire("sky_winter1","alpha","255",bt+164);
            EntFire("s4_end1_road_par0","start","",bt+164);
            EntFire("sky_winter1","start","",bt+164);
            EntFire("s1_place2_layer","hideworldlayeranddestroyentities","",bt+165);
            EntFire("s4_place4_layer","showworldlayerandspawnentities","",bt+164);
            EntFire("s4_end1_phy0_show","break","",bt+164);
            EntFire("ammo_timer","enable","",bt+165);
            EntFire("rtv_tp0","enable","",bt+165);
            EntFire("rtv_d1_par0","start","",bt+165);
            EntFire("rtv_d1_g_timer0","enable","",bt+174);
            EntFire("rtv_d1_g_timer0","disable","",bt+184);
            EntFire("s4_end1_d4_timer0","enable","",bt+184);
            EntFire("s4_end1_d6_timer0","enable","",bt+184);
            EntFire("s4_end1_d4_timer0","disable","",bt+222);
            EntFire("s4_end1_d6_timer0","disable","",bt+222);
            EntFire("rtv_d1_g_timer0","enable","",bt+222);
            EntFire("rtv_d2_g_timer0","enable","",bt+222);
            EntFire("rtv_d1_g_timer0","disable","",bt+242);
            EntFire("rtv_d2_g_timer0","disable","",bt+242);
            EntFire("s4_end1_d4_timer0","enable","",bt+242);
            EntFire("s4_end1_d5_timer0","enable","",bt+242);
            EntFire("s4_end1_d6_timer0","enable","",bt+242);
            EntFire("s4_end1_d4_timer0","disable","",bt+270);
            EntFire("s4_end1_d5_timer0","disable","",bt+270);
            EntFire("s4_end1_d6_timer0","disable","",bt+270);
            EntFire("killzombie_zone","CountPlayersInZone","",bt+275);
            EntFire("zr_toggle_respawn","trigger","",bt+275);
            break
    }
}

Instance.OnScriptInput("setstage1",() => {stage = 1;EntFire("stage_counter","setvalue",stage.toString(),0);})
Instance.OnScriptInput("setstage2",() => {stage = 2;EntFire("stage_counter","setvalue",stage.toString(),0);})
Instance.OnScriptInput("setstage3",() => {stage = 3;EntFire("stage_counter","setvalue",stage.toString(),0);})
Instance.OnScriptInput("setstage4",() => {stage = 4;EntFire("stage_counter","setvalue",stage.toString(),0);})
Instance.OnScriptInput("setstage5",() => {stage = 5;EntFire("stage_counter","setvalue",stage.toString(),0);})

Instance.OnScriptInput("ent_fade1",(ent) => {_ent_fade1(ent)})
function _ent_fade1(ent){
    let n = ent.caller.GetEntityName()
    if(n == "bath_dynamic"){
        let i = 0;
        for(let a = 255;a>0;a-=255/500){
            EntFire(n,"alpha",a.toString(),i);i+=0.01
        }
    }else if(n == "lvl1_dynamic_boss"){
        let i = 0;
        for(let a = 0;a<255;a+=255/100){
            EntFire(n,"alpha",a.toString(),i);i+=0.01
        }
    }else if(n == "lvl2_final_dynamic"){
        let i = 0;
        for(let a = 255;a>0;a-=255/100){
            EntFire(n,"alpha",a.toString(),i);i+=0.01
        }
    }else if(n == "lvl3_dynamic_boss"){
        let i = 0;
        for(let a = 255;a>0;a-=255/200){
            EntFire(n,"alpha",a.toString(),i);i+=0.01
        }
    }else if(n == "lvl3_final_dynamic"){
        let i = 0;
        for(let a = 255;a>0;a-=255/500){
            EntFire(n,"alpha",a.toString(),i);i+=0.01
        }
    }else if(n == "s4_boss_model"){
        let i = 0;
        for(let a = 0;a<255;a+=255/100){
            EntFire(n,"alpha",a.toString(),i);i+=0.01
        }
    }
}
Instance.OnScriptInput("ent_fade2",(ent) => {_ent_fade2(ent)})
function _ent_fade2(ent){
    let n = ent.caller.GetEntityName()
    if(n == "lvl1_dynamic_boss"){
        let i = 0;
        for(let a = 255;a>0;a-=255/300){
            EntFire(n,"alpha",a.toString(),i);i+=0.01
        }
    }else if(n == "lvl3_final_dynamic"){
        let i = 0;
        for(let a = 0;a<255;a+=255/100){
            EntFire(n,"alpha",a.toString(),i);i+=0.01
        }
    }
}

//--------------------------------------------------- stage 1 ---------------------------------------------------

Instance.OnScriptInput("s1_boss_start",() => {_s1_boss_start()})
function _s1_boss_start(){
    _GetPlayers()
    boss_hitable = true
    boss_hp_counter = 0
    boss_hp = playernum[3]*Number(boss_hp_add[1])
    boss_maxhp = boss_hp;
    EntFire("lvl1_boss_normal1_timer","enable","",0);
    EntFire("boss_hp_par0","start","",0);
    EntFire("lvl1_boss_hp_sprite","start","",0);
    EntFire("lvl1_boss_hp_sprite","setalphascale","2",0);
}

//---------------------------------------------------- stage 2 --------------------------------------------------------------------------------------------
Instance.OnScriptInput("getult",() => {caidan = true})
//---------------------------------------------------- stage 3 --------------------------------------------------------------------------------------------
var s3_start_counter = 0
var s3_num = Rand(1,2)

Instance.OnScriptInput("s3_start",() => {
    if(s3_num == 1){_cmd("<<< Spring >>>",5)}else{_cmd("<<< Summer >>>",5)}
    EntFire("lvl3_door1_button1","unlock","",5);
    EntFire("lvl3_door1_button2","unlock","",5);
})
Instance.OnScriptInput("s3_start_buttonchun",() => {_s3_start_buttonchun()})
function _s3_start_buttonchun(){
    if(s3_num == 2){
        EntFire("lvl3_door1_button1_wrong","trigger","",0);
    }else{
        s3_start_counter++;EntFire("lvl3_door1_button1_correct","trigger","",0);
    }
    _s3_start_buttontest()
}

Instance.OnScriptInput("s3_start_buttonxia",() => {_s3_start_buttonxia()})
function _s3_start_buttonxia(){
    if(s3_num == 1){
        EntFire("lvl3_door1_button2_wrong","trigger","",0);
    }else{
        s3_start_counter++;EntFire("lvl3_door1_button2_correct","trigger","",0);
    }
    _s3_start_buttontest()
}

function _s3_start_buttontest(){
    if(s3_start_counter < 4){
        s3_num = Rand(1,2)
        if(s3_num == 1){_cmd("<<< Spring >>>",5)}else{_cmd("<<< Summer >>>",5)}
        EntFire("lvl3_door1_button1","lock","",0);
        EntFire("lvl3_door1_button2","lock","",0);
        EntFire("lvl3_door1_button1","unlock","",6);
        EntFire("lvl3_door1_button2","unlock","",6);
    }else{
        EntFire("lvl3_door1_button1","kill","",0);
        EntFire("lvl3_door1_button2","kill","",0);
        EntFire("lvl3_door1_counter","trigger","",2);
        EntFire("lvl3_door1","open","",17);
        EntFire("lvl3_sb","CancelPending","",0);
        EntFire("lvl3_sb_hurt","kill","",0);
    }
}

Instance.OnScriptInput("s3_boss_start",() => {_s3_boss_start()})
function _s3_boss_start(){
    _GetPlayers()
    boss_hitable = true
    boss_die = false
    boss_hp_counter = 0
    boss_hp = playernum[3]*boss_hp_add[3][0]
    boss_maxhp = boss_hp;
    EntFire("boss_hp_par0","start","",0);
}

//---------------------------------------------------- stage 4 --------------------------------------------------------------------------------------------
var s4_zm_pos = ["12592 -8656 7344","13360 -8656 7344","14064 -8080 7344","14064 -7424 7344","13360 -6832 7344","12592 -6832 7344"]
var s4_end0_dpos = [-3056,8336,-10976]

Instance.OnScriptInput("s4_boss_start",() => {_s4_boss_start()})
function _s4_boss_start(){
    _GetPlayers()
    boss_hitable = true
    boss_die = false
    boss_hp_counter = 0
    boss_hp = playernum[3]*boss_hp_add[4][2]
    boss_maxhp = boss_hp;
    EntFire("boss_hp_par0","start","",0);
    EntFire("s4_boss_start_par2","start","",0);
    EntFire("s4_boss_diban_hurt0","enable","",0);
    EntFire("s4_n1_timer0","enable","",0);
    EntFire("s4_boss_hp_par0","start","",0);
}

function _s4_zm(){
    let i = Rand(0,5)
    EntFire("s4_zm_temp0","keyvalue","angles 0 0 0",0);
    EntFire("s4_zm_temp0","keyvalue","origin "+s4_zm_pos[i],4);
    if(i==2||i==3){
        EntFire("s4_zm_temp0","keyvalue","angles 0 90 0",4);
    }else if(i>3){
        EntFire("s4_zm_temp0","keyvalue","angles 0 180 0",4);
    }
    EntFire("s4_zm_temp0","forcespawn","",4.02);
    if(boss_hp_counter == 10){
        let n = Rand(0,5)
        for(;n==i;n=Rand(0,5))
        EntFire("s4_zm_temp1","keyvalue","angles 0 0 0",0);
        EntFire("s4_zm_temp1","keyvalue","origin "+s4_zm_pos[n],4);
        if(n==2||n==3){
            EntFire("s4_zm_temp1","keyvalue","angles 0 90 0",4);
        }else if(n>3){
            EntFire("s4_zm_temp1","keyvalue","angles 0 180 0",4);
        }
        EntFire("s4_zm_temp1","forcespawn","",4.02);
    }
}

Instance.OnScriptInput("s4_ult",() => {_s4_ult()})
function _s4_ult(){
    EntFire("item_ult_par0","Kill","",0);
    EntFire("fadeout_0.5","fireuser1","",0);
    EntFire("item_ult_par1","start","",0);
    for(let n = 0;n<1;n+=0.1){
        EntFire("s4_summer_par0*","KillHierarchy","",0);
        EntFire("s4_n1_dy*","KillHierarchy","",0);
        EntFire("s4_n2_dy*","KillHierarchy","",0);
        EntFire("s4_d1_dy*","KillHierarchy","",0);
        EntFire("s4_d2_dy*","KillHierarchy","",0);
        EntFire("s4_d3_dy*","KillHierarchy","",0);
        EntFire("s4_d4_dy*","KillHierarchy","",0);
        EntFire("s4_d5_dy*","KillHierarchy","",0);
        EntFire("s4_d6_dy*","KillHierarchy","",0);
        EntFire("s4_d7_dy*","KillHierarchy","",0);
    }
    EntFire("s4_d4_line_hurt0","disable","",0);
    EntFire("s4_d4_line_par0","DestroyImmediately","",0);
    if(boss_hp_counter == 11 && (boss_hp/boss_maxhp) <= 0.4){
        EntFire("s4_d3_line_hurt0","disable","",0);
        EntFire("s4_d3_line_par0","DestroyImmediately","",0);
        EntFire("s4_d3_line_hurt0","enable","",4);
        EntFire("s4_d3_line_par0","start","",2);
    }
}

var s4end1_delay = [0.5,0.15,0.3,1.5]
Instance.OnScriptInput("s4end1",() => {_s4end1()})
function _s4end1(){
    for(let n = 0;n<10;n+=s4end1_delay[0]){
        EntFire("s4_end1_case0","PickRandomShuffle","",n+0.47);
        EntFire("s4_end1_bathory","SetAnimationNotLooping","atk1_fast",n);
    }
}

Instance.OnScriptInput("s4_end_start",() => {_s4_end_start()})
function _s4_end_start(){
    let basetime = 5
    EntFire("s4_end1_d4_timer0","refiretime",s4end1_delay[1].toString(),0);
    EntFire("s4_end1_d5_timer0","refiretime",s4end1_delay[2].toString(),0);
    EntFire("s4_end1_d6_timer0","refiretime",s4end1_delay[3].toString(),0);
    //-------------------------end0----------------------------
    s4_end0_dpos = [-3056,8336,-10976]
    EntFire("item_disable_relay","trigger","",basetime+41);
    EntFire("sound_s4_3","startsound","",basetime);
    EntFire("s4_end0_bathory0*","kill","",basetime+41);
    EntFire("dest1","keyvalue","origin 13936 -2160 7936",basetime+41);
    EntFire("dest1","keyvalue","angles 0 0 0",basetime+41);
    EntFire("lvl4_afk_tele7_2","disable","",basetime+41);
    EntFire("sky_*","alpha","0",basetime+41);
    EntFire("dest_winter_boss_zm","keyvalue","origin -2960 8336 -10944",basetime+41);
    EntFire("dest_winter_boss_zm","SetParent","s4_end0_move1",basetime+41);
    EntFire("sky_spring","enable","",basetime+41);
    EntFire("sky_summer","disable","",basetime+41);
    EntFire("sky_autumn","disable","",basetime+41);
    EntFire("sky_winter","disable","",basetime+41);
    EntFire("s4_end0_telein","enable","",basetime+41);
    EntFire("lvl4_afk_tele8","enable","",basetime+41.1);
    EntFire("sky_spring0","alpha","255",basetime+41.02);
    EntFire("sky_spring0","start","",basetime+41.02);
    EntFire("s4_place2_layer","hideworldlayeranddestroyentities","",basetime+41.02);
    EntFire("s1_place1_layer","showworldlayerandspawnentities","",basetime+41.02);
    EntFire("sky_*","alpha","0",basetime+50);
    EntFire("sky_*","stop","",basetime+50);
    EntFire("sky_summer0","alpha","255",basetime+50.02);
    EntFire("s1_place1_layer","hideworldlayeranddestroyentities","",basetime+50.02);
    EntFire("s2_place2_layer","showworldlayerandspawnentities","",basetime+50.02);
    EntFire("sky_spring","disable","",basetime+50);
    EntFire("sky_summer","enable","",basetime+50);
    EntFire("sky_autumn","disable","",basetime+50);
    EntFire("sky_winter","disable","",basetime+50);
    EntFire("sky_*","alpha","0",basetime+59);
    EntFire("sky_*","stop","",basetime+59);
    EntFire("sky_autumn0","alpha","255",basetime+59.02);
    EntFire("sky_autumn0","start","",basetime+59.02);
    EntFire("s2_place2_layer","hideworldlayeranddestroyentities","",basetime+59.02);
    EntFire("s3_place1_layer","showworldlayerandspawnentities","",basetime+59.02);
    EntFire("sky_spring","disable","",basetime+59);
    EntFire("sky_summer","disable","",basetime+59);
    EntFire("sky_autumn","enable","",basetime+59);
    EntFire("sky_winter","disable","",basetime+59);
    EntFire("sky_*","alpha","0",basetime+68);
    EntFire("sky_*","stop","",basetime+68);
    EntFire("sky_winter0","alpha","255",basetime+68.02);
    EntFire("s3_place1_layer","hideworldlayeranddestroyentities","",basetime+68.02);
    EntFire("s4_place1_layer","showworldlayerandspawnentities","",basetime+68.02);
    EntFire("sky_spring","disable","",basetime+68);
    EntFire("sky_summer","disable","",basetime+68);
    EntFire("sky_autumn","disable","",basetime+68);
    EntFire("sky_winter","enable","",basetime+68);
    EntFire("sky_*","alpha","0",basetime+78);
    EntFire("sky_*","stop","",basetime+78);
    EntFire("sky_winter1","alpha","255",basetime+78.02);
    EntFire("sky_winter1","start","",basetime+78.02);
    EntFire("s4_place1_layer","hideworldlayeranddestroyentities","",basetime+78);
    EntFire("s4_place4_layer","showworldlayerandspawnentities","",basetime+78);
    EntFire("sky_spring","disable","",basetime+78);
    EntFire("sky_summer","disable","",basetime+78);
    EntFire("sky_autumn","disable","",basetime+78);
    EntFire("sky_winter","disable","",basetime+78);
    EntFire("sky_final","enable","",basetime+78);
    EntFire("s4_end0_move1","open","",basetime+41);
    EntFire("s4_end0_d1_timer0","enable","",basetime+43);
    EntFire("s4_end0_d1_timer0","disable","",basetime+50);
    EntFire("s4_end0_dy0","setidleanimationnotlooping","idle2",basetime+41);
    EntFire("s4_end0_dy0","setanimationnoresetnotlooping","qiao",basetime+41);
    EntFire("s4_end0_move0","keyvalue","origin 2368 -7296 -9536",basetime+50.05);
    EntFire(self,"RunScriptInput","s4_end_base_set1",basetime+50.05);
    EntFire("s4_end0_dy*","color","119 174 123",basetime+50);
    EntFire("s4_end0_tele0","enable","",basetime+50);
    EntFire("s4_end0_tele0","disable","",basetime+50.05);
    EntFire("s4_end0_d2_timer0","enable","",basetime+50);
    EntFire("s4_end0_d2_timer0","disable","",basetime+59);
    EntFire("s4_end0_tar","keyvalue","origin -5648 5952 10192",basetime+50.1);
    EntFire("s4_end0_dy1","setidleanimationnotlooping","idle2",basetime+50);
    EntFire("s4_end0_dy1","setanimationnoresetnotlooping","qiao",basetime+50);
    EntFire("s4_end0_move0","keyvalue","origin -5648 5952 9920",basetime+59.05);
    EntFire(self,"RunScriptInput","s4_end_base_set2",basetime+59.05);
    EntFire("s4_end0_dy*","color","238 159 91",basetime+59);
    EntFire("s4_end0_tele0","enable","",basetime+59);
    EntFire("s4_end0_tele0","disable","",basetime+59.05);
    EntFire("s4_end0_d3_timer0","enable","",basetime+59);
    EntFire("s4_end0_d3_timer0","disable","",basetime+68);
    EntFire("s4_end0_tar","keyvalue","origin -7360 12320 -1568",basetime+59.1);
    EntFire("s4_end0_dy2","setidleanimationnotlooping","idle2",basetime+59);
    EntFire("s4_end0_dy2","setanimationnoresetnotlooping","qiao",basetime+59);
    EntFire("s4_end0_move0","keyvalue","origin -7360 12320 -1840",basetime+68.05);
    EntFire(self,"RunScriptInput","s4_end_base_set3",basetime+68.05);
    EntFire("s4_end0_dy*","color","92 169 217",basetime+68);
    EntFire("s4_end0_tele0","enable","",basetime+68);
    EntFire("s4_end0_tele0","disable","",basetime+68.05);
    EntFire("s4_end0_d4_timer0","enable","",basetime+68);
    EntFire("s4_end0_d4_timer0","disable","",basetime+77);
    EntFire("s4_end0_dy3","setidleanimationnotlooping","idle2",basetime+68);
    EntFire("s4_end0_dy3","setanimationnoresetnotlooping","qiao",basetime+68);
    EntFire("s4_end0_bathory","setidleanimationnotlooping","idle2",basetime+75);
    EntFire("s4_end0_bathory","setanimationnotlooping","attack",basetime+75);
    EntFire("s4_end0_move1","SetSpeed","0",basetime+75);
    EntFire("s4_end0_tele1","enable","",basetime+78);
    EntFire("s4_end0_tele2","enable","",basetime+83);
    for(let n = 0;n<=37;n+=0.1){EntFire(self,"RunScriptInput","s4_end_base_move",basetime+n+41);}
    //-------------------------end1----------------------------
    EntFire("s4_end1_cmd0","trigger","",basetime+92);
    EntFire("s4_end1_wall0","toggle","",basetime+90);
    _cmd("7",basetime+90)
    _cmd("6",basetime+91)
    _cmd("5",basetime+92)
    _cmd("4",basetime+93)
    _cmd("3",basetime+94)
    _cmd("2",basetime+95)
    _cmd("1",basetime+96)
    EntFire("s4_end1_wall0","toggle","",basetime+97);
    EntFire("s4_end1_bathory_par1","start","",basetime+95);
 
    let i = basetime+95;
    for(let a = 0;a<255;a+=255/50){
        EntFire("s4_end1_bathory","alpha",a.toString(),i);i+=0.01
    }

    EntFire("s4_end1_phy0_show","break","",basetime+100);
    EntFire("lihui_bath_par0","fireuser1","",basetime+100);
    for(let n = 102;n<113;n+=s4end1_delay[0]){
        EntFire("s4_end1_case0","PickRandomShuffle","",basetime+n+0.47);
        EntFire("s4_end1_bathory","SetAnimationNotLooping","atk1_fast",basetime+n);
    }
    EntFire("s4_end1_temp0","forcespawn","",basetime+100.02);
    EntFire("s4_end1_bathory_par0","start","",basetime+100);
    EntFire("s4_end1_bathory_par2","start","",basetime+100);
    EntFire("s4_end1_bathory_par2","stop","",basetime+105);
    EntFire("s4_end1_bathory_par3","start","",basetime+113);
    EntFire("s4_end1_bathory_par1","stop","",basetime+113);
    EntFire("s4_end1_bathory_par0","stop","",basetime+113);

    i = basetime+113;
    for(let a = 255;a>0;a-=255/100){
        EntFire("s4_end1_bathory","alpha",a.toString(),i);i+=0.01
    }

    EntFire("s4_end1_push0","enable","",basetime+116);
    EntFire("s4_end1_bathory","keyvalues","origin 1932 -11264 11688",basetime+118);
    EntFire("s4_end1_bathory","keyvalues","angles 0 180 0",basetime+118);
    EntFire("s4_end1_bathory","SetParent","s4_end1_move0",basetime+119);
    EntFire("fadeout_0.5","fireuser1","",basetime+124);
    EntFire("sky_winter1","alpha","0",basetime+124);
    EntFire("sky_winter2","alpha","255",basetime+124);
    EntFire("s4_end1_bathory_par2","start","",basetime+125);
    EntFire("s4_end1_bathory_par2","stop","",basetime+130);

    i = basetime+123;
    for(let a = 0;a<255;a+=255/100){
        EntFire("s4_end1_bathory","alpha",a.toString(),i);i+=0.01
    }

    EntFire("s4_end1_bathory","SetAnimationNotLooping","spawn",basetime+123);
    EntFire("s4_end1_bathory","setidleanimationlooping","walk",basetime+123);
    EntFire("s4_end1_bathory_par0","start","",basetime+123);
    EntFire("s4_end1_relay1","trigger","",basetime+124);
    EntFire("s4_end1_move0","open","",basetime+126);
    EntFire("s4_end1_d4_timer0","enable","",basetime+126);
    EntFire("s4_end1_d6_timer0","enable","",basetime+126);
    EntFire("lihui_bath_par0","fireuser1","",basetime+126);
    EntFire("dest_winter2","keyvalues","origin 1728 -11280 11664",basetime+128);
    EntFire("s4_end1_push1","enable","",basetime+156);
    EntFire("s4_end1_bre0","break","",basetime+156);
    EntFire("s4_end1_road_par0","start","",basetime+156);

    i = basetime+155;
    for(let a = 255;a>0;a-=255/100){
        EntFire("s4_end1_bathory","alpha",a.toString(),i);i+=0.01
    }

    EntFire("s4_end1_cmd1","trigger","",basetime+154);
    EntFire("s4_end1_win_par0","start","",basetime+154);
    EntFire("s4_end1_d4_timer0","disable","",basetime+154);
    EntFire("s4_end1_d6_timer0","disable","",basetime+154);
    EntFire("s4_end1_dy0","setidleanimationnotlooping","idle",basetime+126);
    EntFire("s4_end1_dy0","setanimationnoresetnotlooping","qiao1",basetime+126);
    EntFire("s4_end1_dy1","setidleanimationnotlooping","idle",basetime+132);
    EntFire("s4_end1_dy1","setanimationnoresetnotlooping","qiao1",basetime+132);
    EntFire("s4_end1_dy2","setidleanimationnotlooping","idle",basetime+138);
    EntFire("s4_end1_dy2","setanimationnoresetnotlooping","qiao1",basetime+138);
    EntFire("s4_end1_dy3","setidleanimationnotlooping","idle",basetime+144);
    EntFire("s4_end1_dy3","setanimationnoresetnotlooping","qiao1",basetime+144);
    EntFire("s4_end1_dy4","setidleanimationnotlooping","idle",basetime+150);
    EntFire("s4_end1_dy4","setanimationnoresetnotlooping","qiao1",basetime+150);
    
}

Instance.OnScriptInput("s4_end_base_set1",() => {s4_end0_dpos[0]=-32;s4_end0_dpos[1]=-7296;s4_end0_dpos[2]=-9504})
Instance.OnScriptInput("s4_end_base_set2",() => {s4_end0_dpos[0]=-6848;s4_end0_dpos[1]=5952;s4_end0_dpos[2]=9952})
Instance.OnScriptInput("s4_end_base_set3",() => {s4_end0_dpos[0]=-7360;s4_end0_dpos[1]=12320;s4_end0_dpos[2]=-1808})

Instance.OnScriptInput("s4_end_base_move",() => {_s4_end_base_move()})
function _s4_end_base_move(){
    s4_end0_dpos[0]+=13.3
}

Instance.OnScriptInput("s4_e1",() => {_s4_e1()})
function _s4_e1(){
    let y = s4_end0_dpos[1]+Rand(-320,320)
    let z = s4_end0_dpos[2]+Rand(16,72)
    let origin = "origin "+(s4_end0_dpos[0]-256)+" "+y+" "+z;
    EntFire("s4_end0_d1_temp0","keyvalue",origin,0);
    EntFire("s4_end0_d1_temp0","forcespawn","",0.02);
}

Instance.OnScriptInput("s4_e2",() => {_s4_e2()})
function _s4_e2(){
    let x = s4_end0_dpos[0]+Rand(400,1500)
    let y = s4_end0_dpos[1]+Rand(-320,320)
    let origin = "origin "+x+" "+y+" "+(s4_end0_dpos[2]+4);
    EntFire("s4_summer_temp0","keyvalue",origin,0);
    EntFire("s4_summer_temp0","forcespawn","",0.02);
}

Instance.OnScriptInput("s4_e3",() => {_s4_e3()})
function _s4_e3(){
    let y = s4_end0_dpos[1]+Rand(-320,320)
    let origin = "origin "+(s4_end0_dpos[0]-256)+" "+y+" "+s4_end0_dpos[2];
    EntFire("s4_end0_d3_temp0","keyvalue",origin,0);
    EntFire("s4_end0_d3_temp0","forcespawn","",0.02);
}

Instance.OnScriptInput("s4_e4",() => {_s4_e4()})
function _s4_e4(){
    let z = s4_end0_dpos[2]+32
    let n = Rand(1,2)
    if(n==1){
        z+=32
    }
    let origin = "origin "+(s4_end0_dpos[0]-1024)+" "+s4_end0_dpos[1]+" "+z;
    EntFire("s4_end0_d4_temp0","keyvalue",origin,0);
    EntFire("s4_end0_d4_temp0","forcespawn","",0.02);
}

Instance.OnScriptInput("s4_e5",() => {_s4_e5()})
function _s4_e5(){
    let z = 11656+32
    let n = Rand(1,2)
    if(n==1){
        z+=32
    }
    let origin = "origin 5000 -11264 "+z;
    EntFire("s4_end0_d4_temp0","keyvalue",origin,0);
    EntFire("s4_end0_d4_temp0","keyvalue","angles 0 0 0",0);
    EntFire("s4_end0_d4_temp0","forcespawn","",0.02);
}

Instance.OnScriptInput("s4_e6",() => {_s4_e6()})
function _s4_e6(){
    for(let n =0;n<0.15;n+=0.03){
        let y = -11264+Rand(-256,256)
        let origin = "origin 5000 "+y+" 11656";
        EntFire("s4_end1_d2_temp0","keyvalue",origin,n);
        EntFire("s4_end1_d2_temp0","forcespawn","",n+0.02);
    }
}

Instance.OnScriptInput("s4_e7",() => {_s4_e7()})
function _s4_e7(){
    let y = -11082
    let n = Rand(1,3)
    print(n)
    if(n==5){
        EntFire("s4_end1_d1_temp0","keyvalue","origin 5000 "+y+" 11656",0);
        EntFire("s4_end1_d1_temp0","forcespawn","",0.01);
        y-=128
        EntFire("s4_end1_d1_temp0","keyvalue","origin 5000 "+y+" 11656",0.02);
        EntFire("s4_end1_d1_temp0","forcespawn","",0.03);
    }else if(n==1){
        EntFire("s4_end1_d1_temp0","keyvalue","origin 5000 "+y+" 11656",0);
        EntFire("s4_end1_d1_temp0","forcespawn","",0.01);
        y-=256
        EntFire("s4_end1_d1_temp0","keyvalue","origin 5000 "+y+" 11656",0.02);
        EntFire("s4_end1_d1_temp0","forcespawn","",0.03);
    }else if(n==2){
        EntFire("s4_end1_d1_temp0","keyvalue","origin 5000 "+y+" 11656",0);
        EntFire("s4_end1_d1_temp0","forcespawn","",0.01);
        y-=384
        EntFire("s4_end1_d1_temp0","keyvalue","origin 5000 "+y+" 11656",0.02);
        EntFire("s4_end1_d1_temp0","forcespawn","",0.03);
    }else if(n==4){
        y-=128
        EntFire("s4_end1_d1_temp0","keyvalue","origin 5000 "+y+" 11656",0);
        EntFire("s4_end1_d1_temp0","forcespawn","",0.01);
        y=-11082-256
        EntFire("s4_end1_d1_temp0","keyvalue","origin 5000 "+y+" 11656",0.02);
        EntFire("s4_end1_d1_temp0","forcespawn","",0.03);
    }else if(n==3){
        y-=128
        EntFire("s4_end1_d1_temp0","keyvalue","origin 5000 "+y+" 11656",0);
        EntFire("s4_end1_d1_temp0","forcespawn","",0.01);
        y=-11082-384
        EntFire("s4_end1_d1_temp0","keyvalue","origin 5000 "+y+" 11656",0.02);
        EntFire("s4_end1_d1_temp0","forcespawn","",0.03);
    }else if(n==6){
        y-=256
        EntFire("s4_end1_d1_temp0","keyvalue","origin 5000 "+y+" 11656",0);
        EntFire("s4_end1_d1_temp0","forcespawn","",0.01);
        y=-11082-384
        EntFire("s4_end1_d1_temp0","keyvalue","origin 5000 "+y+" 11656",0.02);
        EntFire("s4_end1_d1_temp0","forcespawn","",0.03);
    }
}

Instance.OnScriptInput("r1",() => {_r1()})
function _r1(){
    let n = Rand(1,4)
    let y = -11082 - (n-1)*128
    let z = 11656+96
    let origin = "origin 1200 "+y+" "+z;
    EntFire("rtv_d1_temp0","keyvalue",origin,0);
    EntFire("rtv_d1_temp0","forcespawn","",0.02);
    if(n==1){
        EntFire("rtv_d1_temp1","keyvalue","origin 1200 "+(-11082-128)+" "+z,0);
        EntFire("rtv_d1_temp1","forcespawn","",0.01);
        EntFire("rtv_d1_temp1","keyvalue","origin 1200 "+(-11082-256)+" "+z,0.02);
        EntFire("rtv_d1_temp1","forcespawn","",0.03);
        EntFire("rtv_d1_temp1","keyvalue","origin 1200 "+(-11082-384)+" "+z,0.04);
        EntFire("rtv_d1_temp1","forcespawn","",0.05);
    }else if(n==2){
        EntFire("rtv_d1_temp1","keyvalue","origin 1200 "+(-11082)+" "+z,0);
        EntFire("rtv_d1_temp1","forcespawn","",0.01);
        EntFire("rtv_d1_temp1","keyvalue","origin 1200 "+(-11082-256)+" "+z,0.02);
        EntFire("rtv_d1_temp1","forcespawn","",0.03);
        EntFire("rtv_d1_temp1","keyvalue","origin 1200 "+(-11082-384)+" "+z,0.04);
        EntFire("rtv_d1_temp1","forcespawn","",0.05);
    }else if(n==3){
        EntFire("rtv_d1_temp1","keyvalue","origin 1200 "+(-11082-128)+" "+z,0);
        EntFire("rtv_d1_temp1","forcespawn","",0.01);
        EntFire("rtv_d1_temp1","keyvalue","origin 1200 "+(-11082)+" "+z,0.02);
        EntFire("rtv_d1_temp1","forcespawn","",0.03);
        EntFire("rtv_d1_temp1","keyvalue","origin 1200 "+(-11082-384)+" "+z,0.04);
        EntFire("rtv_d1_temp1","forcespawn","",0.05);
    }else if(n==4){
        EntFire("rtv_d1_temp1","keyvalue","origin 1200 "+(-11082-128)+" "+z,0);
        EntFire("rtv_d1_temp1","forcespawn","",0.01);
        EntFire("rtv_d1_temp1","keyvalue","origin 1200 "+(-11082-256)+" "+z,0.02);
        EntFire("rtv_d1_temp1","forcespawn","",0.03);
        EntFire("rtv_d1_temp1","keyvalue","origin 1200 "+(-11082)+" "+z,0.04);
        EntFire("rtv_d1_temp1","forcespawn","",0.05);
    }
}

Instance.OnScriptInput("r2",() => {_r2()})
function _r2(){
    let z = 11656+32
    let n = Rand(1,2)
    if(n==1){
        z+=32
    }
    let origin = "origin 1200 -11264 "+z;
    EntFire("s4_end0_d4_temp0","keyvalue",origin,0);
    EntFire("s4_end0_d4_temp0","keyvalue","angles 0 180 0",0);
    EntFire("s4_end0_d4_temp0","forcespawn","",0.02);
}

//---------------------------------------------------- boss function --------------------------------------------------------------------------------------------
Instance.OnScriptInput("boss_hp_reset",() => {_boss_hp_reset()})
function _boss_hp_reset(){
    let i = 0
    for(let n = 0.05;n <= 1;n+=0.01){
        EntFire("boss_hp_par0","setalphascale",n.toString(),i);
        i+=0.01
    }
}

Instance.OnScriptInput("test",() => {_test()})
function _test(){
    let i = 0
    let move = -14307
    let angle = 0
    for(let n = 0;n <= 360;n+=0.1){
        if(angle>360){angle-=360}
        EntFire("lv1_camera_train","keyvalues","origin "+move.toString()+" -5120 -7872",i);
        EntFire("lv1_camera_train","keyvalues","angles 0 "+angle.toString()+" 0",i);
        i+=0.01
        angle+=1
        move+=3
    }
}

Instance.OnScriptInput("togglehitboss1",() => {boss_hitable = true})
Instance.OnScriptInput("togglehitboss0",() => {boss_hitable = false})

Instance.OnScriptInput("hitboss_s3end",() => {
    if(boss_hp > 0 ){
        _hitboss()
        EntFire(self,"RunScriptInput","hitboss_s3end",0.1);
    }
})

Instance.OnScriptInput("hitboss_s4end",() => {
    if(boss_hp > 0 ){
        _hitboss()
        EntFire(self,"RunScriptInput","hitboss_s4end",0.1);
    }
})

Instance.OnScriptInput("hitboss",() => {_hitboss()})
function _hitboss(){
    if(boss_hitable){
        boss_hp --
        EntFire("boss_hp_par0","setalphascale",(boss_hp/boss_maxhp).toString(),0);
    }
    print(boss_hp)
    if(boss_hp <= 0 && !boss_die){
        boss_hp_counter ++
        if(stage == 1){
            if(boss_hp_counter <6){
                _GetPlayers()
                boss_hp = playernum[3]*Number(boss_hp_add[stage]);
                boss_maxhp = boss_hp;
                _boss_hp_reset()
                boss_hitable = false
                if(boss_hp_counter == 1){
                    EntFire("lvl1_boss_skill1_relay","trigger","",0);
                }else if(boss_hp_counter == 2){
                    EntFire("lvl1_boss_hp_sprite","setalphascale","3",0);
                    EntFire("lvl1_boss_normal2_relay","trigger","",0);
                }else if(boss_hp_counter == 3){
                    EntFire("lvl1_boss_skill2_relay","trigger","",0);
                }else if(boss_hp_counter == 4){
                    EntFire("lvl1_boss_hp_sprite","setalphascale","4",0);
                    EntFire("lvl1_boss_skill3_relay","trigger","",0);
                }else if(boss_hp_counter == 5){
                    EntFire("lvl1_boss_skill32_relay","trigger","",0);
                }
                
            }else{
            boss_die = true
            boss_hitable = false
            EntFire("lvl1_boss_hp_sprite","stop","",0);
            EntFire("boss_hp_par0","setalphascale","0",0);
            EntFire("boss_hp_par0","stop","",0);
            EntFire("lvl1_boss_defeat_relay","trigger","",0);
            }
        }else if(stage == 3){
            if(boss_hp_counter <8){
                _GetPlayers()
                _boss_hp_reset()
                boss_hitable = false
                if(boss_hp_counter == 1){
                    boss_hp = playernum[3]*Number(boss_hp_add[3][2]);
                    EntFire("lvl3_boss_normal1*","kill","",0);
                    EntFire("lvl3_boss_skill1_relay","trigger","",0);
                }else if(boss_hp_counter == 2){
                    boss_hp = playernum[3]*Number(boss_hp_add[3][1]);
                    EntFire("lvl3_boss_skill1*","kill","",0);
                    EntFire("lvl3_boss_hp_sprite","setalphascale","1",0);
                    EntFire("lvl3_boss_normal2_relay","trigger","",0);
                }else if(boss_hp_counter == 3){
                    boss_hp = playernum[3]*Number(boss_hp_add[3][2]);
                    EntFire("lvl3_boss_normal2*","kill","",0);
                    EntFire("lvl3_boss_skill2_relay","trigger","",0);
                }else if(boss_hp_counter == 4){
                    boss_hp = playernum[3]*Number(boss_hp_add[3][2]);
                    EntFire("lvl3_boss_skill2*","kill","",0);
                    EntFire("lvl3_boss_hp_sprite","setalphascale","2",0);
                    EntFire("lvl3_boss_skill3_relay","trigger","",0);
                }else if(boss_hp_counter == 5){
                    boss_hp = playernum[3]*Number(boss_hp_add[3][1]);
                    EntFire("lvl3_boss_skill3*","kill","",0);
                    EntFire("lvl3_boss_hp_sprite","setalphascale","3",0);
                    EntFire("lvl3_boss_normal3_relay","trigger","",0);
                }else if(boss_hp_counter == 6){
                    boss_hp = playernum[3]*Number(boss_hp_add[3][2]);
                    EntFire("lvl3_boss_normal3*","kill","",0);
                    EntFire("lvl3_boss_skill4_relay","trigger","",0);
                }else if(boss_hp_counter == 7){
                    boss_hp = 450;
                    boss_maxhp = boss_hp;
                    EntFire("lvl3_boss_skill4*","kill","",0);
                    EntFire("lvl3_boss_hp_sprite","setalphascale","4",0);
                    EntFire("lvl3_boss_skill5_relay","trigger","",0);
                    EntFire(self,"RunScriptInput","togglehitboss1",0);
                    EntFire(self,"RunScriptInput","hitboss_s3end",3);
                    EntFire(self,"RunScriptInput","hitboss",48.5);
                }
                boss_maxhp = boss_hp;
            }else{
            boss_die = true
            boss_hitable = false
            EntFire("lvl3_boss_hp_sprite","stop","",0);
            EntFire("boss_hp_par0","setalphascale","0",0);
            EntFire("boss_hp_par0","stop","",0);
            EntFire("lvl3_boss_defeat_relay","trigger","",0);
            }
        }else if(stage == 4){
            if(boss_hp_counter <12){
                _GetPlayers()
                _boss_hp_reset()
                boss_hitable = false
                EntFire("s4_boss_switch_par0","start","",0);
                EntFire("s4_boss_switch_par0","stop","",2);
                if(boss_hp_counter == 1){//符卡1
				    s4_toboss = true;
                    boss_hp = playernum[3]*Number(boss_hp_add[4][0]);
                    EntFire("s4_num1_par0","start","",4);
                    EntFire("s4_boss_model","SetAnimationNotLooping","atk2",2);
                    EntFire("sound_effect1","startsound","",4);
                    EntFire("sound_effect2","startsound","",0);
                    EntFire("sound_effect3","startsound","",2.5);
                    EntFire("s4_n1_timer0","disable","",0);
                    EntFire("s4_n1_dy0*","KillHierarchy","",0);
                    EntFire("s4_n1_dy0*","KillHierarchy","",0.2);
                    EntFire("s4_n1_dy0*","KillHierarchy","",0.4);
                    EntFire("s4_d5_g_timer0","enable","",3.98);
                    EntFire("s4_d5_g_timer0","FireTimer","",4);
                    EntFire("s4_boss_switch_par1","start","",4);
                    EntFire("lihui_doros_par0","fireuser1","",4);
                    EntFire("s4_boss_switch_par1","stop","",6);
                    EntFire(self,"RunScriptInput","togglehitboss1",4);
                }else if(boss_hp_counter == 2){//非符2（守僵尸）
                    boss_hp = playernum[3]*Number(boss_hp_add[4][1]);
                    _s4_zm()
                    EntFire("s4_boss_model","SetAnimationNotLooping","atk2",2);
                    EntFire("s4_zm_tele1","disable","",6);
                    EntFire("s4_zm_tele","enable","",6.2);
                    EntFire("s4_d5_*","KillHierarchy","",0);
                    EntFire("s4_boss_hp_par0","setalphascale","1",0);
                    EntFire("s4_boss_switch_par1","start","",4);
                    EntFire("s4_boss_switch_par1","stop","",6);
                    EntFire(self,"RunScriptInput","togglehitboss1",6);
                }else if(boss_hp_counter == 3){//符卡2
                    boss_hp = playernum[3]*Number(boss_hp_add[4][0]);
                    EntFire("s4_num2_par0","start","",4);
                    EntFire("s4_boss_model","SetAnimationNotLooping","atk2",2);
                    EntFire("sound_effect1","startsound","",4);
                    EntFire("sound_effect2","startsound","",0);
                    EntFire("sound_effect3","startsound","",2.5);
                    EntFire("s4_zm_m0","KillHierarchy","",0);
                    EntFire("s4_zm_tele1","enable","",0);
                    EntFire("s4_zm_tele","disable","",0);
                    EntFire("s4_boss_start_*","open","",0);

                    let i = 2;
                    for(let a = 255;a>0;a-=255/300){
                        EntFire("s4_boss_start_*","alpha",a.toString(),i);i+=0.01
                    }

                    EntFire("s4_d7_g_timer0","enable","",3.98);
                    EntFire("s4_d7_g_timer0","FireTimer","",4);
                    EntFire("s4_boss_switch_par1","start","",4);
                    EntFire("lihui_doros_par0","fireuser1","",4);
                    EntFire("s4_boss_switch_par1","stop","",6);
                    EntFire(self,"RunScriptInput","togglehitboss1",4);
                }else if(boss_hp_counter == 4){//非符3
                    boss_hp = playernum[3]*Number(boss_hp_add[4][2]);
                    EntFire("s4_boss_model","SetAnimationNotLooping","atk2",2);
                    EntFire("sound_effect1","startsound","",4);
                    EntFire("sound_effect2","startsound","",0);
                    EntFire("sound_effect3","startsound","",2.5);
                    EntFire("s4_d7_*","KillHierarchy","",0);
                    EntFire("s4_n1_dy0*","KillHierarchy","",0);
                    EntFire("s4_n1_dy0*","KillHierarchy","",0.2);
                    EntFire("s4_n1_dy0*","KillHierarchy","",0.4);
                    EntFire("s4_n2_timer0","enable","",3.98);
                    EntFire("s4_n2_timer0","FireTimer","",4);
                    EntFire("s4_boss_hp_par0","setalphascale","2",0);
                    EntFire("s4_boss_switch_par1","start","",4);
                    EntFire("s4_boss_switch_par1","stop","",6);
                    EntFire(self,"RunScriptInput","togglehitboss1",4);
                }else if(boss_hp_counter == 5){//春符3
                    boss_hp = playernum[3]*Number(boss_hp_add[4][0]);
                    EntFire("s4_num3_par0","start","",4);
                    EntFire("fadeout_0.5","fireuser1","",4);
                    EntFire("sky_spring","enable","",4);
                    EntFire("sky_summer","disable","",4);
                    EntFire("sky_autumn","disable","",4);
                    EntFire("sky_winter","disable","",4);
                    EntFire("s4_boss_model","SetAnimationNotLooping","atk2",2);
                    EntFire("sound_effect1","startsound","",4);
                    EntFire("sound_effect2","startsound","",0);
                    EntFire("sound_effect3","startsound","",2.5);
                    EntFire("s4_n2_timer0","disable","",0);
                    EntFire("s4_n2_dy0*","KillHierarchy","",0);
                    EntFire("s4_n2_dy0*","KillHierarchy","",0.2);
                    EntFire("s4_n2_dy0*","KillHierarchy","",0.4);
                    EntFire("s4_d1_timer1","disable","",0);
                    EntFire("s4_d1_timer0","enable","",3.98);
                    EntFire("s4_d1_timer0","FireTimer","",4);
                    EntFire("s4_spring_par0","fireuser1","",4);
                    EntFire("s4_boss_switch_par1","start","",4);
                    EntFire("lihui_doros_par0","fireuser1","",4);
                    EntFire("s4_boss_switch_par1","stop","",6);
                    EntFire(self,"RunScriptInput","togglehitboss1",4);
                }else if(boss_hp_counter == 6){//非符4（守僵尸）
                    boss_hp = playernum[3]*Number(boss_hp_add[4][1]);
                    EntFire("s4_boss_model","SetAnimationNotLooping","atk2",2);
                    _s4_zm()
                    EntFire("s4_spring_par0","fireuser2","",0);
                    EntFire("s4_zm_tele1","disable","",6);
                    EntFire("s4_zm_tele","enable","",6.2);
                    EntFire("s4_n1_dy0*","KillHierarchy","",0);
                    EntFire("s4_n1_dy0*","KillHierarchy","",0.2);
                    EntFire("s4_n1_dy0*","KillHierarchy","",0.4);
                    EntFire("s4_d1_*","KillHierarchy","",0);
                    EntFire("s4_boss_hp_par0","setalphascale","3",0);
                    EntFire("s4_boss_switch_par1","start","",4);
                    EntFire("s4_boss_switch_par1","stop","",6);
                    EntFire(self,"RunScriptInput","togglehitboss1",6);
                }else if(boss_hp_counter == 7){//夏符4
                    boss_hp = playernum[3]*Number(boss_hp_add[4][0]);
                    EntFire("s4_num4_par0","start","",4);
                    EntFire("fadeout_0.5","fireuser1","",4);
                    EntFire("sky_spring","disable","",4);
                    EntFire("sky_summer","enable","",4);
                    EntFire("sky_autumn","disable","",4);
                    EntFire("sky_winter","disable","",4);
                    EntFire("s4_boss_model","SetAnimationNotLooping","atk2",2);
                    EntFire("sound_effect1","startsound","",4);
                    EntFire("sound_effect2","startsound","",0);
                    EntFire("sound_effect3","startsound","",2.5);
                    EntFire("s4_zm_m0","KillHierarchy","",0);
                    EntFire("s4_zm_tele1","enable","",0);
                    EntFire("s4_zm_tele","disable","",0);
                    EntFire("s4_d6_g_relay0","trigger","",3.98);
                    EntFire("s4_boss_switch_par1","start","",4);
                    EntFire("lihui_doros_par0","fireuser1","",4);
                    EntFire("s4_boss_switch_par1","stop","",6);
                    EntFire(self,"RunScriptInput","togglehitboss1",4);
                }else if(boss_hp_counter == 8){//秋符5
                    boss_hp = playernum[3]*Number(boss_hp_add[4][0]);
                    EntFire("s4_num5_par0","start","",4);
                    EntFire("fadeout_0.5","fireuser1","",4);
                    EntFire("sky_spring","disable","",4);
                    EntFire("sky_summer","disable","",4);
                    EntFire("sky_autumn","enable","",4);
                    EntFire("sky_winter","disable","",4);
                    EntFire("s4_boss_model","SetAnimationNotLooping","atk2",2);
                    EntFire("sound_effect1","startsound","",4);
                    EntFire("sound_effect2","startsound","",0);
                    EntFire("sound_effect3","startsound","",2.5);
                    EntFire("s4_d6_*","KillHierarchy","",0);
                    EntFire("s4_summer_par1","stop","",0);
                    EntFire("s4_d2_timer0","enable","",3.98);
                    EntFire("s4_d2_timer0","FireTimer","",4);
                    EntFire("s4_boss_hp_par0","setalphascale","4",0);
                    EntFire("s4_boss_switch_par1","start","",4);
                    EntFire("lihui_doros_par0","fireuser1","",4);
                    EntFire("s4_boss_switch_par1","stop","",6);
                    EntFire(self,"RunScriptInput","togglehitboss1",4);
                }else if(boss_hp_counter == 9){//冬符6
                    boss_hp = playernum[3]*Number(boss_hp_add[4][0]);
                    EntFire("s4_num6_par0","start","",4);
                    EntFire("fadeout_0.5","fireuser1","",4);
                    EntFire("sky_spring","disable","",4);
                    EntFire("sky_summer","disable","",4);
                    EntFire("sky_autumn","disable","",4);
                    EntFire("sky_winter","enable","",4);
                    EntFire("s4_boss_model","SetAnimationNotLooping","atk2",2);
                    EntFire("sound_effect1","startsound","",4);
                    EntFire("sound_effect2","startsound","",0);
                    EntFire("sound_effect3","startsound","",2.5);
                    EntFire("s4_d2_*","KillHierarchy","",0);
                    EntFire("s4_winter_par0","fireuser1","",4);
                    EntFire("s4_d4_g_relay0","fireuser1","",3.98);
                    EntFire("s4_boss_hp_par0","setalphascale","5",0);
                    EntFire("s4_boss_switch_par1","start","",4);
                    EntFire("lihui_doros_par0","fireuser1","",4);
                    EntFire("s4_boss_switch_par1","stop","",6);
                    EntFire(self,"RunScriptInput","togglehitboss1",4);
                }else if(boss_hp_counter == 10){//非符5（收僵尸）
                    boss_hp = playernum[3]*Number(boss_hp_add[4][1]);
                    EntFire("s4_boss_model","SetAnimationNotLooping","atk2",2);
                    _s4_zm()
                    EntFire("s4_winter_par0","fireuser2","",0);
                    EntFire("s4_zm_tele1","disable","",6);
                    EntFire("s4_zm_case0","addoutput","OnCase02>s4_zm_pt1>TeleportToCurrentPos>>0>0",6.1);
                    EntFire("s4_zm_tele","enable","",6.2);
                    EntFire("s4_d4_*","KillHierarchy","",0);
                    EntFire("s4_boss_hp_par0","setalphascale","6",0);
                    EntFire("s4_boss_switch_par1","start","",4);
                    EntFire("s4_boss_switch_par1","stop","",6);
                    EntFire(self,"RunScriptInput","togglehitboss1",6);
                }else if(boss_hp_counter == 11){//终符10-20-20
                    boss_hp = 500;
                    boss_maxhp = boss_hp;
                    EntFire("s4_num7_par0","start","",4);
                    EntFire("s4_boss_model","SetAnimationNotLooping","atk2",2);
                    EntFire("sound_effect1","startsound","",4);
                    EntFire("sound_effect2","startsound","",0);
                    EntFire("sound_effect3","startsound","",2.5);
                    EntFire("s4_zm_m0","KillHierarchy","",0);
                    EntFire("s4_zm_m1","KillHierarchy","",0);
                    EntFire("s4_zm_tele1","enable","",0);
                    EntFire("s4_zm_tele","disable","",0);
                    EntFire("s4_boss_hitbox","kill","",0);
                    EntFire("s4_d3_g_relay0","trigger","",4);
                    EntFire("s4_boss_switch_par1","start","",4);
                    EntFire("lihui_doros_par0","fireuser1","",4);
                    EntFire("s4_boss_switch_par1","stop","",6);
                    EntFire(self,"RunScriptInput","togglehitboss1","true",0);
                    EntFire(self,"RunScriptInput","hitboss_s4end",4);
                    EntFire(self,"RunScriptInput","hitboss",54.5);
                    for(let n = 44;n<=54.5;n+=1){
                        EntFire("sound_effect4","startsound","",n);
                    }
                }
                boss_maxhp = boss_hp;
            }else{
            boss_die = true
            boss_hitable = false
            EntFire("item_ult_relay0","disable","",0.1);
            EntFire("item_ult_relay0","CancelPending","",0);
            for(let n = 0;n<=4.5;n+=1){
                EntFire("sound_effect2","startsound","",n);
            }
            EntFire("s4_boss_switch_par1","start","",0);
            EntFire("s4_boss_switch_par1","stop","",0.5);
            EntFire("s4_boss_switch_par1","start","",1);
            EntFire("s4_boss_switch_par1","stop","",1.5);
            EntFire("s4_boss_switch_par1","start","",2);
            EntFire("s4_boss_switch_par1","stop","",2.5);
            EntFire("s4_boss_switch_par1","start","",3);
            EntFire("s4_boss_switch_par1","stop","",3.5);
            EntFire("s4_boss_switch_par1","start","",4);
            EntFire("s4_boss_switch_par1","stop","",4.5);
            EntFire("s4_boss_start_par1","stop","",5);
            EntFire("sound_s4_2","stopsound","",5);
            EntFire("sound_s4_2_2","stopsound","",5);
            EntFire("s4_boss_die_relay","trigger","",0);
            EntFire("s4_d3_*","KillHierarchy","",0);
            EntFire("s4_boss_hp_par0","stop","",0);
            EntFire("boss_hp_par0","setalphascale","0",0);
            EntFire("boss_hp_par0","stop","",0);
            EntFire("s4_boss_model","setidleanimationnotlooping","dead",2);
            EntFire("s4_boss_model","setanimationnoresetnotlooping","dead",2);

            let i = 5;
            for(let a = 255;a>0;a-=255/300){
                EntFire("s4_boss_model","alpha",a.toString(),i);i+=0.01
            }
            
            EntFire("dest_winter10","keyvalue","origin 12871.8 -7744 7776",9.98);
            EntFire("lvl4_teletoboss","disable","",9.98);
            EntFire("lvl4_afk_tele8","disable","",9.98);
            EntFire("s4_end0_bathory0","alpha","255",10);
            EntFire("s4_end0_bathory0_par2","start","",10);
            EntFire("s4_end0_bathory0_par0","start","",27);
            EntFire("s4_end0_bathory0_par1","start","",42);
            EntFire("s4_end0_bathory0","SetAnimationNotLooping","standup",25);
            EntFire("s4_end0_bathory0_m0","open","",26.53);
            EntFire("s4_win_tele","enable","",10);
            EntFire("s4_place3_layer","hideworldlayeranddestroyentities","",10);
            EntFire("s4_place2_layer","showworldlayerandspawnentities","",10);
            EntFire("s4_end0_temp0","forcespawn","",14);
            EntFire(self,"RunScriptInput","s4_end_start",15);
            EntFire("s4_zm_case0","kill","",16.5);
            EntFire("s4_zm_tele","addoutput","OnHurtPlayer>!activator>keyvalue>origin 13936 -2160 7936>0>0",16.5);
            EntFire("s4_zm_tele","enable","",17);
            }
        }
    }
}

Instance.OnScriptInput("s1_n1",() => {_s1_n1()})
function _s1_n1(){
    let yaw = Rand(-45,45);
    let angles = "angles 0 " + yaw + " 0";
    EntFire("lvl1_boss_normal1_maker","keyvalue","origin -14146 -5120 -7967.03",0);
    EntFire("lvl1_boss_normal1_maker","keyvalue",angles,0);
    EntFire("lvl1_boss_normal1_maker","forcespawn","",0.02);
}

Instance.OnScriptInput("s1_n2",() => {_s1_n2()})
function _s1_n2(){
    let yaw = Rand(-60,-55)
    for(let n = 0;n < 48 ; n++){
        yaw += 360/48
        if(yaw>=60){yaw-=125}
        let angles = "angles 0 " + yaw + " 0";
        EntFire("lvl1_boss_normal2_maker","keyvalue","origin -13810 -5120 -7967.03",n*0.04);
        EntFire("lvl1_boss_normal2_maker","keyvalue",angles,n*0.04);
        EntFire("lvl1_boss_normal2_maker","forcespawn","",n*0.04+0.02);
    }
}

Instance.OnScriptInput("s1_s2",() => {_s1_s2()})
function _s1_s2(){
    let x_off = Rand(-700,700)
    let y_off = Rand(-700,700)
    let origin1 = "origin -13762 "+(-5120+y_off)+" -7967.03";
    let origin2 = "origin "+(-13058+x_off)+" -5824 -7967.03";
    EntFire("lvl1_boss_skill2_maker1","keyvalue",origin1,0);
    EntFire("lvl1_boss_skill2_maker1","forcespawn","",0.02);
    EntFire("lvl1_boss_skill2_maker2","keyvalue",origin2,0);
    EntFire("lvl1_boss_skill2_maker2","forcespawn","",0.02);
}

Instance.OnScriptInput("s1_s3",() => {_s1_s3()})
function _s1_s3(){
    let y_off = Rand(-700,700)
    let origin = "origin -13890 "+(-5120+y_off)+" -7967.03";
    EntFire("lvl1_boss_skill3_maker1","keyvalue",origin,0);
    EntFire("lvl1_boss_skill3_maker1","forcespawn","",0.02);
}

Instance.OnScriptInput("s1_s32",() => {_s1_s32()})
function _s1_s32(){
    let y_off = Rand(-700,700)
    let origin = "origin -13890 "+(-5120+y_off)+" -7967.03";
    EntFire("lvl1_boss_skill3_maker2","keyvalue",origin,0);
    EntFire("lvl1_boss_skill3_maker2","forcespawn","",0.02);
}

//-------------------------------------------------------------- s3 skill ----------------------------------------------------------------
Instance.OnScriptInput("s3_n1",() => {_s3_n1()})
function _s3_n1(){
    let yaw = Rand(275,280)
    for(let n = 0;n < 33 ; n++){
        yaw -= 360/32
        if(yaw<=80){yaw+=195}
        let angles = "angles 0 " + yaw + " 0";
        EntFire("lvl3_boss_normal1_maker","keyvalue","origin 13856 -14272 -14240",n*0.04);
        EntFire("lvl3_boss_normal1_maker","keyvalue",angles,n*0.04);
        EntFire("lvl3_boss_normal1_maker","forcespawn","",n*0.04+0.02);
    }
}

Instance.OnScriptInput("s3_s1",() => {_s3_s1()})
function _s3_s1(){
    let yaw = Rand(0,360)
    for(let n = 0;n < 10 ; n++){
        yaw -= 360/10
        let angles = "angles 0 " + (yaw+Rand(0,360/10)) + " 0";
        EntFire("lvl3_boss_skill1_makerm","keyvalue","origin 13152 -14272 -14288",n*0.04);
        EntFire("lvl3_boss_skill1_makerm","keyvalue",angles,n*0.04);
        EntFire("lvl3_boss_skill1_makerm","forcespawn","",n*0.04+0.02);
    }
}

Instance.OnScriptInput("s3_s2",() => {_s3_s2()})
function _s3_s2(){
    let x = 13424+Rand(0,320)
    let y = -14272+Rand(-160,160)
    let origin = "origin "+x+" "+y+" -14272";
    EntFire("lvl3_boss_skill2_mmaker","keyvalue",origin,0);
    EntFire("lvl3_boss_skill2_mmaker","forcespawn","",0.02);
}

Instance.OnScriptInput("s3_s3",() => {_s3_s3()})
function _s3_s3(){
    let y = -14272+Rand(-600,600)
    let origin = "origin 13984 "+y+" -14256";
    EntFire("lvl3_boss_skill3_maker2","keyvalue",origin,0);
    EntFire("lvl3_boss_skill3_maker2","forcespawn","",0.02);
}

Instance.OnScriptInput("s3_s31",() => {_s3_s31()})
function _s3_s31(){
    let yaw = Rand(0,-90)
    let angles = "angles 0 "+yaw+" 0";
    EntFire("lvl3_boss_skill3_maker","keyvalue",angles,0);
    EntFire("lvl3_boss_skill3_maker","forcespawn","",0.02);
}

Instance.OnScriptInput("s3_s32",() => {_s3_s32()})
function _s3_s32(){
    let yaw = Rand(0,90)
    let angles = "angles 0 "+yaw+" 0";
    EntFire("lvl3_boss_skill3_maker3","keyvalue",angles,0);
    EntFire("lvl3_boss_skill3_maker3","forcespawn","",0.02);
}

Instance.OnScriptInput("s3_s5",() => {_s3_s5()})
function _s3_s5(){
    let yaw = Rand(0,360)
    for(let n = 0;n < 8 ; n++){
        let angles = "angles 0 " + (yaw+Rand(0,360/8)) + " 0";
        EntFire("lvl3_boss_skill5_maker","keyvalue",angles,n*0.04);
        EntFire("lvl3_boss_skill5_maker","forcespawn","",n*0.04+0.02);
        yaw -= 360/8
    }
}

Instance.OnScriptInput("s3_s51",() => {_s3_s51()})
function _s3_s51(){
    let yaw = Rand(0,360)
    for(let n = 0;n < 8 ; n++){
        let angles = "angles 0 " + (yaw+Rand(0,360/8)) + " 0";
        EntFire("lvl3_boss_skill5_maker2","keyvalue",angles,n*0.04);
        EntFire("lvl3_boss_skill5_maker2","forcespawn","",n*0.04+0.02);
        yaw -= 360/8
    }
}

Instance.OnScriptInput("s3_s52",() => {_s3_s52()})
function _s3_s52(){
    let yaw = Rand(0,360)
    for(let n = 0;n < 8 ; n++){
        let angles = "angles 0 " + (yaw+Rand(0,360/8)) + " 0";
        EntFire("lvl3_boss_skill5_maker3","keyvalue",angles,n*0.04);
        EntFire("lvl3_boss_skill5_maker3","forcespawn","",n*0.04+0.02);
        yaw -= 360/8
    }
}

Instance.OnScriptInput("s3_e1",() => {_s3_e1()})
function _s3_e1(){
    let y = 6272+Rand(-600,600)
    let origin = "origin 10272 "+y+" 8648";
    EntFire("lvl3_final_laser_2_maker","keyvalue",origin,0);
    EntFire("lvl3_final_laser_2_maker","forcespawn","",0.02);
}
//---------------------------------------------------------------- s4 skill --------------------------------------------------------------------------------
Instance.OnScriptInput("s4_n1",() => {_s4_n1()})
function _s4_n1(){
    let yaw = 180+Rand(-75,75)
    let angles = "angles 0 " + yaw + " 0";
    EntFire("s4_n1_g_maker0","keyvalue",angles,0);
    EntFire("s4_n1_g_maker0","forcespawn","",0.02);
}

var s4_n2_x = 12976+660
var s4_n2_r = Rand(12,16)
var s4_n2_a = true
var s4_n2_x_fix = s4_n2_x
Instance.OnScriptInput("s4_n2_toggle",() => {s4_n2_r = Rand(12,16);s4_n2_a = !s4_n2_a;s4_n2_x = 12976+660+Rand(-60,60);s4_n2_x_fix = s4_n2_x})
Instance.OnScriptInput("s4_n2",() => {_s4_n2()})
function _s4_n2(){
    let y = -7744-600
    let angles = "angles 0 90 0";
    if(s4_n2_a){angles = "angles 0 270 0";y+=1200}
    let origin = "origin "+s4_n2_x+" "+y+" 7376";
    EntFire("s4_n2_g_maker0","keyvalue",origin,0);
    EntFire("s4_n2_g_maker0","keyvalue",angles,0);
    EntFire("s4_n2_g_maker0","forcespawn","",0.02);
    s4_n2_x -= 1320/s4_n2_r
    if(s4_n2_x<(12976-660)){
        s4_n2_x = s4_n2_x_fix;
    }
}

Instance.OnScriptInput("s4_d1",() => {_s4_d1()})
function _s4_d1(){
    let yaw = 90+Rand(-10,10)
    for(let n = 0;n < 16 ; n++){
        let angles = "angles 0 " + yaw + " 0";
        EntFire("s4_d1_g_maker0","keyvalue",angles,n*0.04);
        EntFire("s4_d1_g_maker0","forcespawn","",n*0.04+0.02);
        yaw += 180/16
    }
}
Instance.OnScriptInput("s4_d1_1",() => {_s4_d1_1()})
function _s4_d1_1(){
    let yaw = 180+Rand(-75,75)
    let angles = "angles 0 " + yaw + " 0";
    EntFire("s4_d1_g_maker1","keyvalue",angles,0);
    EntFire("s4_d1_g_maker1","forcespawn","",0.02);
}

var s4_d2_toggle = true
var s4_d2_numtoggle = 0
var s4_d2_num = 1
var s4_d2_x = 12976+660
Instance.OnScriptInput("s4_d2",() => {_s4_d2()})
function _s4_d2(){
    let y = -7744 + 600
    let angles = "angles 0 270 0";
    if(s4_d2_toggle){angles = "angles 0 90 0";y-=1200}
    let origin = "origin "+s4_d2_x+" "+y+" 7360";
    EntFire("s4_d2_dy0","keyvalue",angles,0);
    EntFire("s4_d2_dy0","keyvalue",origin,0);
    EntFire("s4_d2_dy0","fireuser1","",12);
    EntFire("s4_d2_move0","open","",0);
    EntFire("s4_d2_move0","setspeed",(90+30*s4_d2_num).toString(),0);
    EntFire("s4_d2_move0","keyvalue","targetname s4_d2_move0_1",0.02);
    EntFire("s4_d2_dy0","keyvalue","targetname s4_d2_dy0_1",0.02);
    EntFire("s4_d2_move1","open","",0);
    EntFire("s4_d2_move1","setspeed",Rand(100,200).toString(),0);
    EntFire("s4_d2_move1","keyvalue","targetname s4_d2_move1_1",0.02);
    let n = Rand(1,2);if(n == 1){EntFire("s4_d2_move1","KillHierarchy","",0);}
    if(s4_d2_numtoggle == 0){s4_d2_num++}else{s4_d2_num--}
    if(s4_d2_num>5)
        {s4_d2_numtoggle = 1;s4_d2_num = 5}
    else if(s4_d2_num<1){
        {s4_d2_numtoggle = 0;s4_d2_num = 1}
    }
    s4_d2_x -= 1320/20
    if(s4_d2_x<(12976-660)){
        let i = Rand(1,2)
        if(i==1){
            EntFire("s4_boss_push","KeyValues","angles 0 90 0",0);
            EntFire("s4_autumn_par0","KeyValues","angles 0 180 0",0);
        }else{
            EntFire("s4_boss_push","KeyValues","angles 0 270 0",0);
            EntFire("s4_autumn_par0","KeyValues","angles 0 0 0",0);
        }
        EntFire("s4_autumn_par0","start","",0);
        EntFire("s4_autumn_par0","stop","",4);
        EntFire("s4_boss_push","enable","",0);
        EntFire("s4_boss_push","disable","",4);
        EntFire("s4_d2_timer0","disable","",0);
        EntFire("s4_d2_timer0","enable","",5);
        s4_d2_x = 12976+660;s4_d2_toggle=!s4_d2_toggle}
}

Instance.OnScriptInput("s4_d3",() => {_s4_d3()})
function _s4_d3(){
    let yaw = Rand(165,195)
    let angles = "angles 0 "+yaw+" 0";
    EntFire("s4_d3_maker0","keyvalue",angles,0);
    EntFire("s4_d3_maker0","forcespawn","",0.02);
}

Instance.OnScriptInput("s4_d4",() => {_s4_d4()})
function _s4_d4(){
    let yaw = [Rand(110,200),Rand(135,225),Rand(135,225),Rand(135,225),Rand(135,225),Rand(135,225),Rand(160,250)]
    let angles = ["angles 0 "+yaw[0]+" 0","angles 0 "+yaw[1]+" 0","angles 0 "+yaw[2]+" 0","angles 0 "+yaw[3]+" 0","angles 0 "+yaw[4]+" 0","angles 0 "+yaw[5]+" 0","angles 0 "+yaw[6]+" 0"];
    for(let n = 0;n<7;n++){
        EntFire("s4_d4_g_maker"+n,"keyvalue",angles[n],0);
        EntFire("s4_d4_g_maker"+n,"forcespawn","",0.02);
    }
}

Instance.OnScriptInput("s4_d5",() => {_s4_d5()})
function _s4_d5(){
    let yaw = Rand(155,205)
    let angles = "angles 0 "+yaw+" 0";
    EntFire("s4_d5_g_maker0","keyvalue",angles,0);
    EntFire("s4_d5_g_maker0","forcespawn","",0.02);
}

Instance.OnScriptInput("s4_d6",() => {_s4_d6()})
function _s4_d6(){
    let x = 13648+Rand(-20,20)
    let y = -7744+Rand(-450,450)
    let origin = "origin "+x+" "+y+" 7376";
    EntFire("s4_d6_g_maker1","keyvalue",origin,0);
    EntFire("s4_d6_g_maker1","forcespawn","",0.02);
}

Instance.OnScriptInput("s4_d6_1",() => {_s4_d6_1()})
function _s4_d6_1(){
    let x = 13648+Rand(-160,160)
    let y = -7744+Rand(-240,240)
    let origin = "origin "+x+" "+y+" 7366";
    EntFire("s4_d6_g_maker0","keyvalue",origin,0);
    EntFire("s4_d6_g_maker0","forcespawn","",0.02);
    EntFire("s4_d6_g_maker0","forcespawn","",0.2);
    EntFire("s4_d6_g_maker0","forcespawn","",0.4);
    EntFire("s4_d6_g_maker0","forcespawn","",0.6);
    EntFire("s4_d6_g_maker0","forcespawn","",0.8);
    EntFire("s4_d6_g_maker0","forcespawn","",1);
}

Instance.OnScriptInput("s4_d6_2",() => {_s4_d6_2()})
function _s4_d6_2(){
    let x = 12976+Rand(-600,600)
    let y = -7744+Rand(-400,400)
    let origin = "origin "+x+" "+y+" 7332";
    EntFire("s4_summer_temp0","keyvalue",origin,0);
    EntFire("s4_summer_temp0","forcespawn","",0.02);
}

Instance.OnScriptInput("s4_d7",() => {_s4_d7()})
function _s4_d7(){
    let y = -7744+Rand(-320,320)
    let origin = "origin 13664 "+y+" 7376";
    EntFire("s4_d7_g_maker0","keyvalue",origin,0);
    EntFire("s4_d7_g_maker0","forcespawn","",0.02);
    for(let i =0;i<0.15;i+=0.01){
        let yaw = Rand(135,225)
        let angles = "angles 0 "+yaw+" 0";
        EntFire("s4_d7_g_maker1","keyvalue",origin,i);
        EntFire("s4_d7_g_maker1","keyvalue",angles,i);
        EntFire("s4_d7_g_maker1","forcespawn","",i+0.01);
    }
}
//----------------------------------------------------------------巴托丽----------------------------------------------------------------------------------
var bath_cd =[3,60,300]
var bath_atk_cd = 0
var bath_s1_cd = 0
var bath_s2_cd = 0

Instance.OnScriptInput("bath_tick",() => {_bath_tick()})
function _bath_tick(){
    EntFire(self,"RunScriptInput","bath_tick",0.1);
    bath_atk_cd-=0.1
    bath_s1_cd-=0.1
    //bath_s2_cd-=0.1
    if(bath_atk_cd<=0){EntFire("press_attack","enable","",0);bath_atk_cd=0}else{EntFire("press_attack","disable","",0);};
    if(bath_s1_cd<=0){EntFire("bath_push_relay","enable","",0);bath_s1_cd=0}else{EntFire("bath_push_relay","disable","",0);};
    if(bath_s2_cd<=0){EntFire("bath_ult_relay","enable","",0);bath_s2_cd=0}else{EntFire("bath_ult_relay","disable","",0);};
	let text = ""
    if(bath_s2_cd<=0){
        text = "Double R-c:"+Math.floor(bath_cd[1]-bath_s1_cd).toString()+"|"+bath_cd[1].toString()+"\nUltimate:Ready"
    }else{
        text = "Double R-c:"+Math.floor(bath_cd[1]-bath_s1_cd).toString()+"|"+bath_cd[1].toString()+"\nUltimate:Off"
    }
	EntFire("bath_text","SetMessage",text,0);
}

Instance.OnScriptInput("bath_act0",() => {bath_atk_cd = bath_cd[0]})
Instance.OnScriptInput("bath_act1",() => {bath_s1_cd = bath_cd[1]})
Instance.OnScriptInput("bath_act2",() => {bath_s2_cd = bath_cd[2]})
//----------------------------------------------------------------拉 弥 亚----------------------------------------------------------------------------------
var lamiya_cd =[20,1.5,20,60,30]
var lamiya_hp = 30
var lamiya_maxhp = 30
var lamiya_atk_cd = 0
var lamiya_s1_cd = 0
var lamiya_s2_cd = 0
var lamiya_selfheal = 0
var lamiya_trans = 0

Instance.OnScriptInput("lamiya_tick",() => {_lamiya_tick()})
function _lamiya_tick(){
    EntFire(self,"RunScriptInput","lamiya_tick",0.1);
    lamiya_atk_cd-=0.1
    lamiya_s1_cd-=0.1
    lamiya_s2_cd-=0.1
    lamiya_trans-=0.1
    lamiya_selfheal+=0.1
    if(lamiya_atk_cd<=0){EntFire("lamiya_atk1_relay0","enable","",0);EntFire("lamiya_atk2_relay0","enable","",0);lamiya_atk_cd=0}else{EntFire("lamiya_atk1_relay0","disable","",0);EntFire("lamiya_atk2_relay0","disable","",0)};
    if(lamiya_selfheal>=lamiya_cd[0]){lamiya_hp+=1;lamiya_selfheal=0;if(lamiya_hp>=lamiya_maxhp){lamiya_hp=lamiya_maxhp}};
    if(lamiya_s1_cd<=0){EntFire("lamiya_s1_relay0","enable","",0);lamiya_s1_cd=0}else{EntFire("lamiya_s1_relay0","disable","",0);};
    if(lamiya_s2_cd<=0){EntFire("lamiya_s2_relay0","enable","",0);lamiya_s2_cd=0}else{EntFire("lamiya_s2_relay0","disable","",0);};
    if(lamiya_trans<=0){lamiya_trans=0;}
	let text = "HP:"+Math.ceil(lamiya_hp).toString()+"|"+lamiya_maxhp.toString()+"\nShift L-c:"+Math.floor(lamiya_cd[2]-lamiya_s1_cd).toString()+"|"+lamiya_cd[2].toString()+"\nShift R-c:"+Math.floor(lamiya_cd[3]-lamiya_s2_cd).toString()+"|"+lamiya_cd[3].toString()+"\nHenshin:"+Math.ceil(lamiya_trans).toString()
	EntFire("lamiya_text","SetMessage",text,0);
}

Instance.OnScriptInput("lamiya_act0",() => {lamiya_atk_cd = lamiya_cd[1]})
Instance.OnScriptInput("lamiya_act1",() => {lamiya_s1_cd = lamiya_cd[2]})
Instance.OnScriptInput("lamiya_act2",() => {lamiya_s2_cd = lamiya_cd[3]})
Instance.OnScriptInput("lamiya_act3",() => {lamiya_trans = lamiya_cd[4]})

Instance.OnScriptInput("lamiya_getnuke",() => {lamiya_hp = Math.round(lamiya_hp*0.6)})
Instance.OnScriptInput("lamiya_gethurt",() => {_lamiya_gethurt()})
function _lamiya_gethurt(){
	lamiya_hp --
	if(lamiya_hp <= 0){
		EntFire("lamiya_die_zone","CountPlayersInZone","",0)
		EntFire("lamiya_die_relay0","trigger","",0)
	}else if(lamiya_hp >= lamiya_maxhp){lamiya_hp = lamiya_maxhp}
}
//----------------------------------------------------------------zm skin--------------------------------------------------------------------------------
var emma_cd =[3,30,8]
var emma_atk_cd = 0
var emma_s1_cd = 0
Instance.OnScriptInput("emma_tick",() => {_emma_tick()})
function _emma_tick(){
    EntFire(self,"RunScriptInput","emma_tick",0.1);
    emma_atk_cd-=0.1
    emma_s1_cd-=0.1
    if(emma_atk_cd<=0){EntFire("emma_atk1_relay0","enable","",0);emma_atk_cd=0}else{EntFire("emma_atk1_relay0","disable","",0);};
    if(emma_s1_cd<=0){EntFire("emma_s1_relay1","enable","",0);emma_s1_cd=0}else{EntFire("emma_s1_relay1","disable","",0);};
	let text = "Shift L-c:Place Teleporter\nShift R-c:Activate Teleporter\nCD:"+Math.floor(emma_cd[1]-emma_s1_cd).toString()+"|"+emma_cd[1].toString()
	EntFire("emma_text","SetMessage",text,0);
}

Instance.OnScriptInput("emma_act0",() => {emma_atk_cd = emma_cd[0]})
Instance.OnScriptInput("emma_act1",() => {emma_s1_cd = emma_cd[1]})

//----------------------------------------------------------------必 托 鲁----------------------------------------------------------------------------------
var bitru_cd =[3,10,100,20]
var bitru_atk_cd = 0
var bitru_s1_cd = 0
var bitru_s2_cd = 0
var bitru_speed = 0
var bitru_speed_counter = 0
var bitru_speed_reset = false

Instance.OnScriptInput("bitru_tick",() => {_bitru_tick()})
function _bitru_tick(){
    EntFire(self,"RunScriptInput","bitru_tick",0.1);
    print("test")
    bitru_atk_cd-=0.1
    bitru_s1_cd-=0.1
    bitru_s2_cd-=0.1
    if(bitru_atk_cd<=0){EntFire("bitru_atk1_relay0","enable","",0);bitru_atk_cd=0}else{EntFire("bitru_atk1_relay0","disable","",0);};
    if(bitru_s1_cd<=0){EntFire("bitru_atk2_relay0","enable","",0);bitru_s1_cd=0}else{EntFire("bitru_atk2_relay0","disable","",0);};
    if(bitru_s2_cd<=0){EntFire("bitru_s2_relay0","enable","",0);bitru_s2_cd=0}else{EntFire("bitru_s2_relay0","disable","",0);};
	let text = "R-c:"+Math.floor(bitru_cd[1]-bitru_s1_cd).toString()+"|"+bitru_cd[1].toString()+"\nShift R-c:"+Math.floor(bitru_cd[2]-bitru_s2_cd).toString()+"|"+bitru_cd[2].toString()+"\nSpeed:"+(1+bitru_speed*0.1)
	EntFire("bitru_text","SetMessage",text,0);
}

Instance.OnScriptInput("bitru_speed_add",() => {_bitru_speed_add()})
function _bitru_speed_add(){
    bitru_speed ++
    bitru_speed_reset = true
    if(bitru_speed>=4){bitru_speed = 4}
}

Instance.OnScriptInput("bitru_speed",() => {_bitru_speed()})
function _bitru_speed(){
    if(bitru_speed_reset){bitru_speed_counter++}
    if(bitru_speed_counter>=bitru_cd[3]){bitru_speed_counter=0;bitru_speed--}
    if(bitru_speed<0){bitru_speed=0;bitru_speed_reset=false}
    EntFire("bitru_speed_filter1","addoutput","OnFail>!activator>keyvalues>speed "+(1+bitru_speed*0.1)+">0>1",0);
}

Instance.OnScriptInput("bitru_act0",() => {bitru_atk_cd = bitru_cd[0]})
Instance.OnScriptInput("bitru_act1",() => {bitru_s1_cd = bitru_cd[1]})
Instance.OnScriptInput("bitru_act2",() => {bitru_s2_cd = bitru_cd[2]})
//----------------------------------------------------------------players list by 7ychu5--------------------------------------------------------------------
class player {//单个玩家信息快
    slot = -1;
    controller = null;
    pawn = null;
    constructor(slot,controller,pawn){
        this.slot = slot;
        this.controller =controller;
        this.pawn = pawn;
    }
    weapon_primary = "weapon_ak47";
    weapon_secondary = "weaponusp_silencer";
    zeus = 0
    nade = 0
    decoy= 0
    molotov = 0
    flash = 0
    smoke = 0
    death= 0
    vip = 0
}

var players = new Array;//玩家数组

Instance.OnScriptInput("player_init",() => {_player_init()})
Instance.OnScriptInput("player_reg",() =>  {_player_reg()})
Instance.OnScriptInput("list_player",() => {_list_player()})

function _player_init() {for(let j =0 ; j <= 64; j++) {players[j] = new player(null,null,-1);}}  //初始化玩家数组,清空内容

function _player_reg() {                                                                          //注册玩家
    for (let j = 0;j <= 64; j++){
        if(players[j].controller != null){
            if(players[j].controller.GetPlayer() != null)
            continue;
        }
    else{
        var pawn= Instance.GetPlayerPawn(j);
        if (pawn){
            var controller= pawn.GetOriginalController();
            if (controller) players[j] = (new player(j, controller, pawn))//将搜到的正常玩家数据写进信息块，并且写进玩家数组，数组角标是玩家的slot
            }
        }
    }
}

function _list_player(){
    for (let j = 0; j <= 64; j++){
        if(players[j].controller == null) continue
        else{
            print(players[j].slot)
            print(players[j].controller)
            print(players[j].pawn)
        }
    }
}