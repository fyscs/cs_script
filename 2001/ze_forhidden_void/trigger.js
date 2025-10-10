import { Instance } from "cs_script/point_script";

const scripter = "lopb";
const script_time = "2024.10.23";
const script_version = "1.1";

var players = new Array;
var self = "scripts"
//-----------------------------------------------------function by 7ychu5---------------------------------------------------------------------------------------
function print(a) {Instance.Msg(a);}

function GetDistance3D(v1,v2) {return Math.sqrt((v1[0]-v2[0])*(v1[0]-v2[0]) + (v1[1]-v2[1])*(v1[1]-v2[1]) + (v1[2]-v2[2])*(v1[2]-v2[2]))}

function Rand(min, max) {return Math.floor(Math.random() * (max - min + 1) ) + min;}

function EntFire(targetname,key,value="",delay=0){Instance.EntFireAtName(targetname,key,value,delay)}
//-------------------------------------------------------function by lopb---------------------------------------------------------------------------------------
function _cmd(context,num){EntFire("cmd","command","say "+context.toString(),Number(num));}

var players=[0,0]
Instance.OnScriptInput("GetPlayers",() => {_GetPlayers()})
function _GetPlayers(){
	players=[0,0]
    for (let j = 0; j < 64; j++) {
        var pawn = Instance.GetPlayerController(j);
		if(!pawn){continue}
        if (pawn.GetTeamNumber() == 3) {
			players[0]++
        }else if(pawn.GetTeamNumber() == 2){
			players[1]++
		}
    }
}
//--------------------------------------------------------------------------------------------------------------------------------------------------------------
var stage = 0//-----------------------------------------关卡数(0为热身)----------------------------------------------

function resetscript(){ //EntFire("test_relay","trigger","",0);
    s2hitemspawn=[0,0,0,0,0]
    s2zitemspawn=[0,0,0,0,0,0]
	zmitem = [0,0,0,0,0,0]
	huitem = [0,0,0,0,0]
	stage1_obj1_counter = 0
	stage2_obj2_button_num = 0;
	stage2_yincang_counter = [0,0,0,0,0,0]
	diehuman = 0
	stage3_obj4_button_num = 0;
	stage3_obj5_hurt_num = 0;
	stage3_obj11_num = 0;
	stage3_obj13_num = 0;
	stage3_obj14_num = 0;
	stage3_laser = true;
	boss_hp = 400;
	boss_hp_Enable = false;

	soul_shnum = 0;
	soul_reget = false;
	soul_skill1num = 0;
	soul_skill2num = 0;
	soul_selfheal = 20//--------------------------------自动回血间隔-------------------------------------------------
	soul_hp = 30//--------------------------------------初始生命值---------------------------------------------------
	soul_point = 100//----------------------------------初始能量值---------------------------------------------------
	soul_maxpoint = 400//-------------------------------最大能量值---------------------------------------------------
	soul_quanji_counter = 30//--------------------------初始拳击冷却-------------------------------------------------
	soul_quanjimax = 30 //------------------------------拳击冷却时间-------------------------------------------------
	soul_quanjitime = 20 //-----------------------------拳击持续时间-------------------------------------------------
	soul_combo_delay = 0.3//----------------------------搓招间隔-----------------------------------------------------
	soul_maxhp = 30//-----------------------------------最大生命值---------------------------------------------------
	soul_quanjinum = 2//--------------------------------拳击每个僵尸增加的能量----------------------------------------

	hq_cd = [1,60,90,150,-999999999999999999]//-----------冷却，从左到右为:平A,双击右键技能,shift+左键,shift+右键,aadd需求能量--------------------------------
	hq_maxhp = 30
	hq_hp = 30
	hq_combo_delay = 0.3
	hq_s1_counter = 0
	hq_s1_cd = 0
	hq_s2_counter = 0
	hq_s2_cd = 0
	hq_s3_counter = 0
	hq_s3_cd = 0
	hq_s4_counter = 0
	hq_s4_cd = 0//-----------------------------------aadd终极大招初始能量---------------------------------------
	hq_s4_cd_max = 200//-------------------------------aadd终极大招需要能量---------------------------------------
	hq_s4_atk_counter = 0
	hq_shnum = 0
	hq_selfheal = 20
	
	hina_cd = [3,300]//------------------------------平A冷却,大招冷却------------------------------
	hina_atk_cd = 0
	hina_ult_cd = 0
	hina_maxhp = 16//--------------------------------最大血量---------------------------------------
	hina_hp = 16//----------------------------------初始血量---------------------------------------
	
	xjy_cd = [30,75,90,100,10]//-------------------------技能CD,需求能量-------------------------
	xjy_cd_num = [0,0,0,0,0]//---------------------初始CD,初始能量-----------------------------------
	xjy_hp = 30//-----------------------------------初始血量-------------------------------
	xjy_maxhp = 30 //--------------------------------最大血量---------------------------------------
	xjy_selfheal = 20
	xjy_shnum = 0
	xjy_snum = 0
	xjy_sing = false
	xjy_atk_combo_num = 1
	xjy_atking = false
	xjy_atk_cp = 1
	xjy_s_counter = 0
}

Instance.OnScriptInput("setstage1",() => {setstage1()});function setstage1(){stage = 1;EntFire("stage_cunter","SetValue","1",0)}
Instance.OnScriptInput("setstage2",() => {setstage2()});function setstage2(){stage = 2;EntFire("stage_cunter","SetValue","2",0)}
Instance.OnScriptInput("setstage3",() => {setstage3()});function setstage3(){stage = 3;EntFire("stage_cunter","SetValue","3",0)}
Instance.OnScriptInput("loadstage",() => {loadnewstage()})
function loadnewstage(){
    resetscript()
	if(stage == 1){
		EntFire("stage_1","forcespawn","",0)
		EntFire("auto_fog","SetFogColor","166 152 111",0.5)
		EntFire("auto_fog","setfogstrength","0.3",0.5)
		EntFire("stage3_sky_1","disable","",0.5);
		EntFire("stage3_sky_2","disable","",0.5);
		EntFire("stage1_skybox_dynamic1","enable","",0.5)
		EntFire("sky_cs15","enable","",0.5)
		EntFire("sky_space","disable","",0.5)
		EntFire("sky_tibet","disable","",0.5)
		EntFire("stage1_obj0_dynamic2","enable","",0.5)
		EntFire("stage1_obj0_dynamic4","enable","",0.5)
		EntFire("stage1_obj0_dynamic5","enable","",0.5)
		EntFire("stage1_obj0_dynamic6","enable","",0.5)
		EntFire("stage_tp1","enable","",0.5)
		EntFire("stage_tp2","enable","",20)
		EntFire("tp1","keyvalue","origin -3357 -14901 -2656",0.5)
		EntFire("tp1","keyvalue","angles 0 90 0",0.5)
		EntFire("exp_temp","forcespawn","",2)
		EntFire("ItemTemp_ammo","keyvalue","origin -2604 -11085.3 -2708",2);
		EntFire("ItemTemp_ammo","forcespawn","",2.1);
		stage1_fire()
        _cmd("We have to take back our devices,Search the missing devices around the crash site!!!",10)
		EntFire("s1_go_sound","StartSound","",3)
		EntFire("s1_bgm_sound1","StartSound","",5)
	let a = Rand(1,3)
    switch (a) 
	{
        case 1:
			EntFire("item_human_spawn_temp","keyvalue","origin -3199.8 -10523.8 -2724.5",0);
			EntFire("item_human_spawn_temp","keyvalue","angles 0 60 0",0);
			EntFire("item_human_spawn_temp","forcespawn","",0.02);
			EntFire("item_human_spawn_temp","keyvalue","origin -4004 -10886 -2633.5",0.04);
			EntFire("item_human_spawn_temp","keyvalue","angles 0 180 0",0.04);
			EntFire("item_human_spawn_temp","forcespawn","",0.06);
			EntFire("item_zombie_spawn_temp","keyvalue","origin -8336 -9000 -2145.5",0.04);
			EntFire("item_zombie_spawn_temp","keyvalue","angles 0 180 0",0.04);
			EntFire("item_zombie_spawn_temp","forcespawn","",0.06);
			break;
		case 2:
            EntFire("item_zombie_spawn_temp","keyvalue","origin -3199.8 -10523.8 -2724.5",0);
			EntFire("item_zombie_spawn_temp","keyvalue","angles 0 60 0",0);
			EntFire("item_zombie_spawn_temp","forcespawn","",0.02);
			EntFire("item_human_spawn_temp","keyvalue","origin -4004 -10886 -2633.5",0);
			EntFire("item_human_spawn_temp","keyvalue","angles 0 180 0",0);
			EntFire("item_human_spawn_temp","forcespawn","",0.02);
			EntFire("item_human_spawn_temp","keyvalue","origin -8336 -9000 -2145.5",0.04);
			EntFire("item_human_spawn_temp","keyvalue","angles 0 180 0",0.04);
			EntFire("item_human_spawn_temp","forcespawn","",0.06);
			break;
		case 3:
			EntFire("item_human_spawn_temp","keyvalue","origin -3199.8 -10523.8 -2724.5",0);
			EntFire("item_human_spawn_temp","keyvalue","angles 0 60 0",0);
			EntFire("item_human_spawn_temp","forcespawn","",0.02);
			EntFire("item_zombie_spawn_temp","keyvalue","origin -4004 -10886 -2633.5",0.04);
			EntFire("item_zombie_spawn_temp","keyvalue","angles 0 180 0",0.04);
			EntFire("item_zombie_spawn_temp","forcespawn","",0.06);
			EntFire("item_human_spawn_temp","keyvalue","origin -8336 -9000 -2145.5",0.04);
			EntFire("item_human_spawn_temp","keyvalue","angles 0 180 0",0.04);
			EntFire("item_human_spawn_temp","forcespawn","",0.06);
			break;
    }
	}else if(stage == 2){
		let n = Rand(13,20)
		EntFire("stage_2","forcespawn","",0)
		EntFire("auto_fog","SetFogColor","166 152 111",0.5)
		EntFire("sky_cs15","enable","",0.5)
		EntFire("sky_space","disable","",0.5)
		EntFire("sky_tibet","disable","",0.5)
		EntFire("stage_tp1","enable","",3)
		EntFire("stage_tp1","disable","",8)
		EntFire("stage_tp2","enable","",8)
		EntFire("stage2_obj0_particle","start","",3)
		EntFire("stage2_obj2_trigger","start","",3)
		EntFire("tp1","keyvalue","origin -12094.6 8432.37 9963",n)
		EntFire("tp1","keyvalue","angles 0 315 0",n)
		EntFire("tp1","keyvalue","origin -12611 7640 10300",3)
		EntFire("tp1","keyvalue","angles 0 90 0",3)
		_cmd("We fall into an underground cave?",3)
		stage2_fire()

		EntFire("s2_bgm_sound1","StartSound","",5)

		EntFire("ItemTemp_Heal","keyvalue","origin -10969 11957 9727",0);
		EntFire("ItemTemp_Heal","keyvalue","angles 0 180 0",0);
		EntFire("ItemTemp_Heal","forcespawn","",0.02);
		EntFire("ItemTemp_ammo","keyvalue","origin -12064 8248 9952",2);
		EntFire("ItemTemp_ammo","forcespawn","",2.1);
		EntFire("ItemTemp_medical","keyvalue","origin -11824 8432 9968",3);
		EntFire("ItemTemp_medical","forcespawn","",3.1);

		EntFire(self,"RunScriptInput","s2hitemorigin","",0.5)
		EntFire(self,"RunScriptInput","s2hitemorigin",1)
		EntFire(self,"RunScriptInput","s2hitemorigin",1.5)
		EntFire(self,"RunScriptInput","s2hitemorigin",2)

		EntFire(self,"RunScriptInput","s2zitemorigin",3)
		EntFire(self,"RunScriptInput","s2zitemorigin",3.5)
		EntFire(self,"RunScriptInput","s2zitemorigin",4)
		EntFire(self,"RunScriptInput","s2zitemorigin",4.5)
		EntFire(self,"RunScriptInput","s2zitemorigin",5)
		EntFire(self,"RunScriptInput","s2zitemorigin",5.5)
	}else if(stage == 3){
		EntFire("stage_3","forcespawn","",0)
		EntFire("auto_fog","SetFogColor","49 121 151",0.5)
		EntFire("auto_fog","setfogmaxopacity","0.3",0.5)
		EntFire("sky_cs15","disable","",0.5)
		EntFire("sky_space","enable","",0.5)
		EntFire("sky_tibet","disable","",0.5)
		EntFire(self,"RunScriptInput","s3_o0_f1",0.5)
		let n = Rand(1,100)
		EntFire("stage3_item_once2","KillHierarchy","",0.5);
		EntFire("stage3_item_once","KillHierarchy","",0.5);
		if(n<= 25){
			EntFire("steam_trigger","enable","",0.5);
			skin = 1
			EntFire("stage3_item_particle4","KillHierarchy","",0.5);
			EntFire("stage3_item_once3","KillHierarchy","",0.5);
			EntFire("stage3_item_once4","keyvalue","origin 865 -3425.5 3035",0.5);
			EntFire("stage3_item_particle6","keyvalue","origin 3036 -3809 2955",0.5);
			EntFire("xjy_weapon","addoutput","OnPlayerPickup>!activator>keyvalue>origin 865 -3425.5 3035>0>1",0.5);
		}else if(n <= 50 && n > 25){
			EntFire("steam_trigger","enable","",0.5);
			skin = 1
			EntFire("stage3_item_particle4","KillHierarchy","",0.5);
			EntFire("stage3_item_once3","KillHierarchy","",0.5);
			EntFire("stage3_item_once4","keyvalue","origin 3036 -3809 2955",0.5);
			EntFire("stage3_item_particle6","keyvalue","origin 865 -3425.5 3035",0.5);
			EntFire("xjy_weapon","addoutput","OnPlayerPickup>!activator>keyvalue>origin 3036 -3809 2955>0>1",0.5);
		}else if(n <= 75 && n > 50){
			skin = 2
			EntFire("stage3_item_once4","KillHierarchy","",0.5);
			EntFire("stage3_item_once","KillHierarchy","",0.5);
			EntFire("stage3_item_once3","keyvalue","origin 3036 -3809 2955",0.5);
			EntFire("stage3_item_particle4","keyvalue","origin 865 -3425.5 3035",0.5);
			EntFire("stage3_item_particle6","kill","",0.5);
			EntFire("hq_weapon","addoutput","OnPlayerPickup>!activator>keyvalue>origin 3036 -3809 2955>0>1",0.5);
		}else if(n <= 100 && n > 75){
			skin = 2
			EntFire("stage3_item_once4","KillHierarchy","",0.5);
			EntFire("stage3_item_once","KillHierarchy","",0.5);
			EntFire("stage3_item_once3","keyvalue","origin 865 -3425.5 3035",0.5);
			EntFire("stage3_item_particle4","keyvalue","origin 3036 -3809 2955",0.5);
			EntFire("stage3_item_particle6","kill","",0.5);
			EntFire("hq_weapon","addoutput","OnPlayerPickup>!activator>keyvalue>origin 865 -3425.5 3035>0>1",0.5);
		}

		EntFire("fade2","fade","",0.5)
		stage3_item()
		stage3_fire()

		EntFire("s3_bgm_sound1","StartSound","",3)
	}else if(stage == 0){
		EntFire("stage_1","forcespawn","",0)
		EntFire("auto_fog","SetFogColor","166 152 111",0.5)
		EntFire("stage1_skybox_dynamic1","enable","",0.5)
		EntFire("sky_cs15","enable","",0.5)
		EntFire("sky_space","disable","",0.5)
		EntFire("sky_tibet","disable","",0.5)
		EntFire("stage_tp1","enable","",3)
		EntFire("stage_tp2","enable","",20)
		EntFire("tp1","keyvalue","origin -3357 -14901 -2656",0.5)
		EntFire("tp1","keyvalue","angles 0 90 0",0.5)
		EntFire("cmd","command","endround",91)
		EntFire(self,"RunScriptInput","setstage1",0)
		_cmd("<< Warm Up Time >>",3)
	}
}

var s2hitemspawn = [0,0,0,0,0]
Instance.OnScriptInput("s2hitemorigin",() => {huitem_s2origin()})
function huitem_s2origin(){
	let a = Rand(1,5)
    switch (a) 
	{
        case 1:
			if(s2hitemspawn[0]==0){
				s2hitemspawn[0]=1
			    EntFire("item_human_spawn_temp", "keyvalue", "origin -11663 11155 9370.47", 0)
			    EntFire("item_human_spawn_temp", "keyvalue", "angles 0 90 0", 0)
			    EntFire("item_human_spawn_temp", "forcespawn", "", 0.02)
			}else {huitem_s2origin()}
			break;
		case 2:
			if(s2hitemspawn[1]==0){
				s2hitemspawn[1]=1
				EntFire("item_human_spawn_temp", "keyvalue", "origin -10786.1 9081.42 9394.37", 0)
				EntFire("item_human_spawn_temp", "keyvalue", "angles -15 270 0", 0)
				EntFire("item_human_spawn_temp", "forcespawn", "", 0.02)
			}else {huitem_s2origin()}
			break;
		case 3:
			if(s2hitemspawn[2]==0){
				s2hitemspawn[2]=1
				EntFire("item_human_spawn_temp", "keyvalue", "origin -11263 14079.7 9371.5", 0)
				EntFire("item_human_spawn_temp", "keyvalue", "angles 0 180 0", 0)
				EntFire("item_human_spawn_temp", "forcespawn", "", 0.02)
			}else {huitem_s2origin()}
			break;
		case 4:
			if(s2hitemspawn[3]==0){
				s2hitemspawn[3]=1
				EntFire("item_human_spawn_temp", "keyvalue", "origin -7943 6345.54 11731.5", 0)
				EntFire("item_human_spawn_temp", "keyvalue", "angles -34.5 270 0", 0)
				EntFire("item_human_spawn_temp", "forcespawn", "", 0.02)
			}else {huitem_s2origin()}
			break;
		case 5:
			if(s2hitemspawn[4]==0){
				s2hitemspawn[4]=1
				EntFire("item_human_spawn_temp", "keyvalue", "origin -7511 6868 11323.5", 0)
				EntFire("item_human_spawn_temp", "keyvalue", "angles 0 90 0", 0)
				EntFire("item_human_spawn_temp", "forcespawn", "", 0.02)
			}else {huitem_s2origin()}
			break;
	}
}

var s2zitemspawn = [0,0,0,0,0,0]
Instance.OnScriptInput("s2zitemorigin",() => {zmitem_s2origin()})
function zmitem_s2origin(){
	let a = Rand(1,6)
    switch (a) 
	{
        case 1:
			if(s2zitemspawn[0]==0){
				s2zitemspawn[0]=1
				EntFire("item_zombie_spawn_temp", "keyvalue", "origin -10156.1 11415.6 9497.74", 0)
				EntFire("item_zombie_spawn_temp", "keyvalue", "angles 0 150 0", 0)
				EntFire("item_zombie_spawn_temp", "forcespawn", "", 0.02)
			}else {zmitem_s2origin()}
			break;
		case 2:
			if(s2zitemspawn[1]==0){
				s2zitemspawn[1]=1
				EntFire("item_zombie_spawn_temp", "keyvalue", "origin -9098.85 10321 10027.1", 0)
				EntFire("item_zombie_spawn_temp", "keyvalue", "angles -36.5 0 0", 0)
				EntFire("item_zombie_spawn_temp", "forcespawn", "", 0.02)
			}else {zmitem_s2origin()}
			break;
		case 3:
			if(s2zitemspawn[2]==0){
				s2zitemspawn[2]=1
				EntFire("item_zombie_spawn_temp", "keyvalue", "origin -5179 6046.37 11516.5", 0)
				EntFire("item_zombie_spawn_temp", "keyvalue", "angles 0 0 0", 0)
				EntFire("item_zombie_spawn_temp", "forcespawn", "", 0.02)
			}else {zmitem_s2origin()}
			break;
		case 4:
			if(s2zitemspawn[3]==0){
				s2zitemspawn[3]=1
				EntFire("item_zombie_spawn_temp", "keyvalue", "origin -10784 12155 9369.5", 0)
				EntFire("item_zombie_spawn_temp", "keyvalue", "angles 0 0 0", 0)
				EntFire("item_zombie_spawn_temp", "forcespawn", "", 0.02)
			}else {zmitem_s2origin()}
			break;
		case 5:
			if(s2zitemspawn[4]==0){
				s2zitemspawn[4]=1
				EntFire("item_zombie_spawn_temp", "keyvalue", "origin -11439 12329.2 9741.08", 0)
				EntFire("item_zombie_spawn_temp", "keyvalue", "angles -15 90 0", 0)
				EntFire("item_zombie_spawn_temp", "forcespawn", "", 0.02)
			}else {zmitem_s2origin()}
			break;
		case 6:
			if(s2zitemspawn[5]==0){
				s2zitemspawn[5]=1
				EntFire("item_zombie_spawn_temp", "keyvalue", "origin -6276 8752 11515.5", 0)
				EntFire("item_zombie_spawn_temp", "keyvalue", "angles 0 90 0", 0)
				EntFire("item_zombie_spawn_temp", "forcespawn", "", 0.02)
			}else {zmitem_s2origin()}
			break;
	}
}

function stage3_item() 
{
	EntFire("ItemTemp_Dark", "keyvalue", "origin 4640 -7208 2766", 0);
	EntFire("ItemTemp_Dark", "keyvalue", "angles 0 0 0", 0);
	EntFire("ItemTemp_Dark", "ForceSpawn", "", 0.02);
	EntFire("ItemTemp_Cursed", "keyvalue", "origin 4640 -7344 2766", 0.04);
	EntFire("ItemTemp_Cursed", "keyvalue", "angles 0 0 0", 0.04);
	EntFire("ItemTemp_Cursed", "ForceSpawn", "", 0.06);
	EntFire("ItemTemp_Flame", "keyvalue", "origin 4640 -7912 2766", 0.08);
	EntFire("ItemTemp_Flame", "keyvalue", "angles 0 0 0", 0.08);
	EntFire("ItemTemp_Flame", "ForceSpawn", "", 0.1);
	EntFire("ItemTemp_Gravity", "keyvalue", "origin 4640 -7880 2766", 0.12);
	EntFire("ItemTemp_Gravity", "keyvalue", "angles 0 0 0", 0.12);
	EntFire("ItemTemp_Gravity", "ForceSpawn", "", 0.14);
	EntFire("ItemTemp_Sand", "keyvalue", "origin 4640 -8024 2766", 0.16);
	EntFire("ItemTemp_Sand", "keyvalue", "angles 0 0 0", 0.16);
	EntFire("ItemTemp_Sand", "ForceSpawn", "", 0.18);
	EntFire("ItemTemp_Wind", "keyvalue", "origin 4640 -8072 2766", 0.2);
	EntFire("ItemTemp_Wind", "keyvalue", "angles 0 0 0", 0.2);
	EntFire("ItemTemp_Wind", "ForceSpawn", "", 0.22);
	
	EntFire("ItemTemp_Earth", "keyvalue", "origin 4456 -7248 2766", 0.24);
	EntFire("ItemTemp_Earth", "keyvalue", "angles 0 180 0", 0.24);
	EntFire("ItemTemp_Earth", "ForceSpawn", "", 0.26);
	EntFire("ItemTemp_Heal", "keyvalue", "origin 4456 -7304 2766", 0.28);
	EntFire("ItemTemp_Heal", "keyvalue", "angles 0 180 0", 0.28);
	EntFire("ItemTemp_Heal", "ForceSpawn", "", 0.3);
	EntFire("ItemTemp_Doom", "keyvalue", "origin 4456 -7848 2766", 0.32);
	EntFire("ItemTemp_Doom", "keyvalue", "angles 0 180 0", 0.32);
	EntFire("ItemTemp_Doom", "ForceSpawn", "", 0.34);
	EntFire("ItemTemp_Fireball", "keyvalue", "origin 4456 -7944 2766", 0.36);
	EntFire("ItemTemp_Fireball", "keyvalue", "angles 0 180 0", 0.36);
	EntFire("ItemTemp_Fireball", "ForceSpawn", "", 0.38);
	EntFire("ItemTemp_Poison", "keyvalue", "origin 4456 -8000 2766", 0.4);
	EntFire("ItemTemp_Poison", "keyvalue", "angles 0 180 0", 0.4);
	EntFire("ItemTemp_Poison", "ForceSpawn", "", 0.42);
	EntFire("ItemTemp_ZmHeal", "keyvalue", "origin 4456 -8096 2766", 0.44);
	EntFire("ItemTemp_ZmHeal", "keyvalue", "angles 0 180 0", 0.44);
	EntFire("ItemTemp_ZmHeal", "ForceSpawn", "", 0.46);
}

var zmitem = [0,0,0,0,0,0]
Instance.OnScriptInput("randitem_zm",() => {zmitemcase()})
function zmitemcase(){
	let n = Rand(1,6)
	switch(n){
		case 1:if(zmitem[0]==0){
			zmitem[0]=1;
			EntFire("item_zombie_maker","keyvalue","EntityTemplate ItemTemp_Poison",0);
		}else {zmitemcase()}break

		case 2:if(zmitem[1]==0){
			zmitem[1]=1;
			EntFire("item_zombie_maker","keyvalue","EntityTemplate ItemTemp_Doom",0);
		}else {zmitemcase()}break
		
		case 3:if(zmitem[2]==0){
			zmitem[2]=1;
			EntFire("item_zombie_maker","keyvalue","EntityTemplate ItemTemp_Fireball",0);
		}else {zmitemcase()}break
		
		case 4:if(zmitem[3]==0){
			zmitem[3]=1;
			EntFire("item_zombie_maker","keyvalue","EntityTemplate ItemTemp_Cursed",0);
		}else {zmitemcase()}break
		
		case 5:if(zmitem[4]==0){
			zmitem[4]=1;
			EntFire("item_zombie_maker","keyvalue","EntityTemplate ItemTemp_ZmHeal",0);
		}else {zmitemcase()}break
		
		case 6:if(zmitem[5]==0){
			zmitem[5]=1;
			EntFire("item_zombie_maker","keyvalue","EntityTemplate ItemTemp_Dark",0);
		}else {zmitemcase()}break

		default: _cmd("zmitems is overspawn",0)
	}
}

var huitem = [0,0,0,0,0]
Instance.OnScriptInput("randitem_hu",() => {huitemcase()})
function huitemcase(){
	let n = Rand(1,5)
	switch(n){
		case 1:if(huitem[0]==0){
			huitem[0]=1;
			EntFire("item_human_maker","keyvalue","EntityTemplate ItemTemp_Earth",0);
		}else {huitemcase()}break

		case 2:if(huitem[1]==0){
			huitem[1]=1;
			EntFire("item_human_maker","keyvalue","EntityTemplate ItemTemp_Flame",0);
		}else {huitemcase()}break
		
		case 3:if(huitem[2]==0){
			huitem[2]=1;
			EntFire("item_human_maker","keyvalue","EntityTemplate ItemTemp_Gravity",0);
		}else {huitemcase()}break
		
		case 4:if(huitem[3]==0){
			huitem[3]=1;
			EntFire("item_human_maker","keyvalue","EntityTemplate ItemTemp_Sand",0);
		}else {huitemcase()}break
		
		case 5:if(huitem[4]==0){
			huitem[4]=1;
			EntFire("item_human_maker","keyvalue","EntityTemplate ItemTemp_Wind",0);
		}else {huitemcase()}break
		
		default: _cmd("huitems is overspawn",0)
	}
}
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------
var stage1_obj1_counter = 0

Instance.OnScriptInput("s1_o0_f1",() => {stage1_obj0_func1()})
function stage1_obj0_func1(){
    if(stage1_obj1_counter < 7){stage1_obj1_counter++;
		EntFire("cmd","command","say "+stage1_obj1_counter+"/7",0)}
	if(stage1_obj1_counter == 7){
		_cmd("Devices are all collected!!!",1)
		EntFire("stage1_obj1_dynamic1","enable","",0)
		EntFire("stage1_obj1_dynamic1","StartGlowing","",0.02)
		EntFire("stage1_obj1_button","Unlock","",0)
	}
}

Instance.OnScriptInput("s1_o1_f1",() => {stage1_obj1_func1()})
function stage1_obj1_func1(){
	_cmd("C4 is going to explode [5 sec] !!!",10)
	EntFire("stage1_obj1_dynamic1","StopGlowing","",0)
	EntFire("stage1_obj1_dynamic1","alpha","255",0)
	EntFire("stage1_obj1_exp","Explode","",15)
	EntFire("stage1_obj1_exp_p","start","",15)
	EntFire("stage1_obj1_dynamic1","kill","",16)
	EntFire("stage1_obj1_clip","break","",16)
	EntFire("stage1_obj1_dynamic2","kill","",16)
	EntFire("stage1_obj2_dynamic1","alpha","150",19)

	EntFire("exp_g_sound3","startsound","",15)
	EntFire("exp_g_sound3","stopsound","",20)
}

Instance.OnScriptInput("s1_o2_f1",() => {stage1_obj2_func1()})
function stage1_obj2_func1(){
	let n = Rand(8,18)
	EntFire("tp1","keyvalue","origin -2581 -5844 -1420",n)
	EntFire("tp1","keyvalue","angles 0 180 0",n)
	_cmd("C4 is going to explode [5 sec] !!!",15)
	EntFire("stage1_obj2_dynamic1","alpha","255",0)
	EntFire("stage1_obj2_dynamic1","kill","",20)
	EntFire("stage1_obj2_break","break","",20)
	EntFire("stage1_obj2_exp","Explode","",20)
	EntFire("stage1_obj2_exp_p","start","",20)
	EntFire("stage1_obj_2_button","unlock","",20)
	EntFire("stage1_obj2_exp_p","kill","",30)
	EntFire("dragon_1","enable","",0)
	EntFire("dragon_1","SetAnimationnotLooping","dragon_action",0.02)
	EntFire("stage1_obj3_shake","StartShake","",2.7);
	EntFire("dragon_1","kill","",13)

	EntFire("exp_g_sound2","startsound","",20)
	EntFire("exp_g_sound2","stopsound","",25)
}

Instance.OnScriptInput("s1_o2_f2",() => {stage1_obj2_func2()})
function stage1_obj2_func2()
{
	EntFire("stage1_obj2_lever1","SetAnimationNoResetNotLooping","pull",0);
	EntFire("stage1_obj2_lever1","SetAnimationNoResetNotLooping","pull_2",1.25);
	EntFire("stage1_obj2_movelinear","open","",3);
	EntFire("tp1","keyvalue","origin -4552 -6352 -1489",12);
	EntFire("tp1","keyvalue","angles 0 180 0",12);
	EntFire("stage1_tp1","enable","",12);
	_GetPlayers()
	let n = 1000+players[0]*500
	let a = Instance.FindEntityByName("stage1_obj2_break2",null)
	print(n)
	a.SetHealth(n)
}

Instance.OnScriptInput("s1_o2_f3",() => {stage1_obj2_func3()})
function stage1_obj2_func3()
{
	EntFire("dragon_2","SetAnimationnotLooping","dragon_cs18_action1",3.02);
	EntFire("dragon_2","enable","",3);
	EntFire("stage1_obj3_hurt","enable","",6.1);
	EntFire("stage1_obj3_hurt","kill","",12.1);
	EntFire("stage1_obj3_shake","StartShake","",6.1);
	_cmd("why there are so many dragons at this island?",5)
}

Instance.OnScriptInput("s1_o3_f1",() => {stage1_obj3_func1()})
function stage1_obj3_func1()
{
	EntFire("stage1_obj3_dynamic2","alpha","255",0);
	EntFire("stage1_obj3_dynamic2","kill","",20);
	EntFire("stage1_obj3_exp","explode","",20.02);
	EntFire("stage1_obj3_exp_p","start","",20);
	EntFire("stage1_obj3_dynamic1","kill","",20);
	EntFire("stage1_obj3_dynamic2","kill","",20);
	_cmd("C4 is going to explode [5 sec] !!!",15)
	EntFire("stage1_obj3_tp","enable","",20);
	EntFire("tp2","keyvalue","origin 5009.37 -5659.63 12253.3",15);
	EntFire("tp2","keyvalue","angles 0 135 0",15);
	let a= Rand(16,21)
	EntFire("tp1","keyvalue","origin -6548 -7920 -1605",a);
	EntFire("tp1","keyvalue","angles 0 180 0",a);

	EntFire("exp_g_sound3","startsound","",20)
	EntFire("exp_g_sound3","stopsound","",25)
}

Instance.OnScriptInput("s1_o3_f2",() => {stage1_obj3_func2()})
function stage1_obj3_func2()
{
	_cmd("According to radar before our helicopter crashed,There seems to be a huge building nearby,We need to take a look",3)
	EntFire("stage1_tp2","enable","",12.02);
	EntFire("tp1","keyvalue","origin 5009.37 -5659.63 12556",12);
	EntFire("tp1","keyvalue","angles 0 135 0",12);
	EntFire("stage1_obj3_tp","kill","",13);
	EntFire("stage1_skybox_dynamic1","disable","",13);
	EntFire("stage1_skybox_water","toggle","",13);
	EntFire("stage1_dynamic","enable","",0);
}

Instance.OnScriptInput("s1_o4_f1",() => {stage1_obj4_func1()})
function stage1_obj4_func1()
{
	let a= Rand(40,48)
	_cmd("The gate is opening [6 sec] ",0)
	_cmd("It looks like a church, we need to get in",30)
	EntFire("stage1_obj2_lever1","kill","",0);
	EntFire("stage1_obj4_dynamic3","SetAnimationNoResetNotLooping","pull",0);
	EntFire("stage1_obj4_dynamic3","SetAnimationNoResetNotLooping","pull_2",1.25);
	EntFire("stage1_obj4_doorL","open","",6);
	EntFire("stage1_obj4_doorR","open","",6);
	EntFire("stage1_obj4_doorL2","open","",16);
	EntFire("stage1_obj4_doorR2","open","",16);
	EntFire("stage1_obj4_exp_p","start","",a);
	EntFire("stage1_obj4_dynamic2","kill","0 ",a);
	EntFire("stage1_obj4_break2","kill","",a);
	EntFire("stage1_obj4_button","kill","",0);
}

Instance.OnScriptInput("s1_o4_f2",() => {stage1_obj4_func2()})
function stage1_obj4_func2()
{
	_cmd("fence is ready to open",0)
	EntFire("stage1_obj4_dynamic4","SetAnimationNoResetNotLooping","pull",0);
	EntFire("stage1_obj4_dynamic4","SetAnimationNoResetNotLooping","pull_2",1.25);
	EntFire("stage1_obj4_doorU","open","",18);
	EntFire("stage1_obj4_break","kill","",20);
	EntFire("stage1_obj4_button2","kill","",0);
}

Instance.OnScriptInput("s1_o5_f1",() => {stage1_obj5_func1()})
function stage1_obj5_func1()
{
	let a= Rand(40,50)
	EntFire("tp1","keyvalue","origin 7656 1792 13202.6",0);
	EntFire("tp1","keyvalue","angles 0 45 0",0);
	EntFire("stage1_tp3","enable","",0.02);
	EntFire("stage1_obj5_button","kill","",0);
	_cmd("Wait for the church gate to open [50 sec] ",0)
	EntFire("stage1_obj5_rota","start","",50);
	EntFire("stage1_obj5_rota","fireuser1","",52.2);
	EntFire("tp1","keyvalue","origin 10618.1 6393.85 12343",a);
	EntFire("tp1","keyvalue","angles 0 150 0",a);
	EntFire("tp1","keyvalue","origin 10680 8743.99 12348",61);
	EntFire("tp1","keyvalue","angles 0 90 0",61);
	EntFire("stage1_tp4","enable","",61.02);
	EntFire("stage1_obj6_break_zone","CountPlayersInZone","",50);
    EntFire("stage1_obj6_break","SetHealth","500",50);
	EntFire("s1_bgm_sound1","StopSound","",0)
	EntFire("s1_bgm_sound2","StartSound","",0)
}

Instance.OnScriptInput("s1_o6_f1",() => {stage1_obj6_func1()})
function stage1_obj6_func1()
{
	EntFire("stage1_obj6_multiple","kill","",0);
	_cmd("The slate is opening [12 sec] ",12)
	EntFire("stage1_obj6_door2","open","",24);
	_cmd("Get in now! The slate is going to close!",34)
	EntFire("stage1_obj6_particle","start","",34);
	EntFire("stage1_obj6_zm_tp","enable","",34);
	EntFire("stage1_obj6_door2","setspeed","50",36);
	EntFire("stage1_obj6_door2","close","",36.02);
	EntFire("stage1_obj6_fade","fade","",40.02);
	EntFire("stage1_obj6_break2","break","",42.5);
	EntFire("tp2","keyvalue","origin -12611 7640 10300",42);
	EntFire("tp2","keyvalue","angles 0 90 0",42);
	EntFire("stage1_obj6_tp","enable","",42.02);
	EntFire("item_zm_disable","fireuser1","",34);
	EntFire("stage1_obj6_particle","stop","",50);
	EntFire("stage1_obj6_zm_tp","disable","",50);
}
//--------------------------------------------------------stage2 trigger-----------------------------------------------------------------------------------------
Instance.OnScriptInput("s2_o1_f1",() => {stage2_obj1_func1()})
function stage2_obj1_func1()
{
	let a= Rand(35,40)
	_cmd("need time to open this gate  [35 sec] ",5)
	EntFire("stage2_obj1_door","open","",40);
	EntFire("tp1","keyvalue","origin -11818 11810 9824",a);
	EntFire("tp1","keyvalue","angles 0 0 0",a);
	EntFire("stage2_obj1_dynamic","SetAnimationNoResetNotLooping","pull",0);
	EntFire("stage2_obj1_dynamic","SetAnimationNoResetNotLooping","pull_2",1.25);
}

Instance.OnScriptInput("s2_o2_f1",() => {stage2_obj2_func1()})
function stage2_obj2_func1()
{
	EntFire("stage2_obj1_door","close","",8);
	EntFire("tp1","keyvalue","origin -10149 11090 9539",12);
	EntFire("tp1","keyvalue","angles 0 180 0",12);
	EntFire("stage2_tp1","enable","",12.02);
	_cmd("It seems like we have to split up",2)
}

var stage2_obj2_button_num = 0;
Instance.OnScriptInput("s2_o2_f2",() => {stage2_obj2_func2()})
function stage2_obj2_func2()
{
	let a= Rand(15,20)
	if(stage2_obj2_button_num < 2)
    {
		stage2_obj2_button_num++;
		EntFire("tp1","keyvalue","origin -10889 12080 9415",a);
		EntFire("tp1","keyvalue","angles 0 270 0",a);
	}
	if(stage2_obj2_button_num == 2)
	{
		EntFire("stage2_obj2_doorL","open","",30);
		EntFire("stage2_obj2_doorR","open","",30);
		EntFire("stage2_obj2_doorL2","open","",30);
		EntFire("stage2_obj2_doorR2","open","",30);
		EntFire("stage2_obj3_hurt_particle","start","",0);
		_cmd("The pull rod has been pulled down [30 sec]",0)
	}
}

Instance.OnScriptInput("s2_o3_f1",() => {stage2_obj3_func1()})
function stage2_obj3_func1()
{
	EntFire("tp1","keyvalue","origin -11267 12725 9415.5",6);
	EntFire("tp1","keyvalue","angles 0 90 0",6);
	EntFire("stage2_tp2","enable","",6.02);
	_cmd("Something is actived [30 sec]",2)
	EntFire("stage2_obj3_break","break","",30);
	EntFire("stage2_obj3_tp","enable","",35.02);
	EntFire("tp2","keyvalue","origin -6641 6887.5 11364",35);
	EntFire("tp2","keyvalue","angles 0 180 0",35);
	EntFire("stage2_obj3_particle","start","",32);
}

Instance.OnScriptInput("s2_o3_f2",() => {stage2_obj3_func2()})
function stage2_obj3_func2()
{
	EntFire("stage2_obj4_particle","start","",0);
	_cmd("What's this place? Weird magic teleport us to here",2)
	EntFire("tp1","keyvalue","origin -6641 6887.5 11364",10);
	EntFire("tp1","keyvalue","angles 0 180 0",10);
	EntFire("stage2_tp3","enable","",10.02);
	EntFire("stage2_obj4_particle","kill","",30);
	EntFire("stage2_obj3_particle","kill","",10);
	EntFire("stage2_obj1_button","kill","",10);
	EntFire("stage2_obj2_button","kill","",10);
	EntFire("stage2_obj2_button2","kill","",10);
	EntFire("stage2_obj2_door*","kill","",10);
	EntFire("stage2_obj3_button","kill","",10);
	EntFire("stage2_obj2_zm_break","kill","",10);
	EntFire("stage2_obj2_zm_break2","kill","",10);
	EntFire("stage2_obj3_tp","kill","",10);
	EntFire("stage2_obj3_hurt","kill","",10);
	EntFire("stage2_obj0_particle","kill","",10);
	EntFire("s2_bgm_sound1","StopSound","",0)
	EntFire("s2_bgm_sound2","StartSound","",0)
}

Instance.OnScriptInput("s2_o4_f1",() => {stage2_obj4_func1()})
function stage2_obj4_func1()
{
	_cmd("need time to open this gate [20 sec]",0)
	EntFire("stage2_obj4_button","kill","",0);
	EntFire("stage2_obj4_button_dynamic","kill","",0);
	EntFire("stage2_obj4_door","unlock","",20);
	EntFire("stage2_obj4_door","open","",20.02);
	EntFire("tp1","keyvalue","origin -6944 8256 11652",36);
	EntFire("tp1","keyvalue","angles 0 270 0",36);
	EntFire("stage2_tp4","enable","",36.02);
	EntFire("stage2_obj4_door","close","",35);
	EntFire("stage2_obj4_door","lock","",35);
}

Instance.OnScriptInput("s2_o5_f1",() => {stage2_obj5_func1()})
function stage2_obj5_func1()
{
	EntFire("stage2_obj5_button","kill","",0);
	EntFire("stage2_obj5_physics","kill","",0);
	EntFire("tp1","keyvalue","origin -8456 6880 11747.5",16);
	EntFire("tp1","keyvalue","angles 0 0 0",16);
	EntFire("stage2_tp5","enable","",16.02);
	EntFire("stage2_obj5_break2","Break","",15);
	EntFire("stage2_obj5_break2_zone","CountPlayersInZone","",14.98);
	_cmd("We need to spend some time to dismantle this iron gate [15 sec]",0)
	_cmd("set C4 to destroy the rock",15)
}

Instance.OnScriptInput("s2_o5_f2",() => {stage2_obj5_func2()})
function stage2_obj5_func2()
{
	EntFire("stage2_tp4","disable","",0);
	EntFire("stage2_obj6_dynamic2","keyvalue","origin -7117 7461.16 11360.6",3);
	EntFire("stage2_obj6_dynamic2","alpha","130",3);
	EntFire("stage2_obj6_button","Unlock","",0);
	EntFire("tp1","keyvalue","origin -7875.5 6883 11748",6);
	EntFire("tp1","keyvalue","angles 0 0 0",6);
	EntFire("stage2_obj5_break3","break","",13);
}

Instance.OnScriptInput("s2_o6_f1",() => {stage2_obj6_func1()})
function stage2_obj6_func1()
{
	EntFire("stage2_obj6_dynamic2","alpha","255",0);
	EntFire("stage2_obj6_exp","explode","",18.02);
	EntFire("stage2_obj6_exp_p","start","",18);
	EntFire("stage2_obj6_exp_p","stop","",28);
	_cmd("C4 is going to explode [5 sec] !!!",13)
	EntFire("stage2_obj6_dynamic","kill","",18);
	EntFire("stage2_obj6_dynamic2","kill","",18);
	EntFire("stage2_obj6_break","break","",19);
	EntFire("tp1","keyvalue","origin -6016 8392.5 11172",20);
	EntFire("tp1","keyvalue","angles 0 270 0 ",20);

	EntFire("exp_g_sound2","startsound","",18)
	EntFire("exp_g_sound2","stopsound","",23)
}

Instance.OnScriptInput("s2_o7_f1",() => {stage2_obj7_func1()})
function stage2_obj7_func1()
{
	_cmd("need time to open this gate [24 sec]",0)
	EntFire("stage2_obj7_door2","open","",24);
	EntFire("stage2_obj7_button2_dynamic","kill","",0);
	EntFire("tp1","keyvalue","origin -8387 7058 11436",28);
	EntFire("tp1","keyvalue","angles 0 90 0 ",28);
	EntFire("stage2_tp6","enable","",28.02);
	EntFire("stage2_tp4","enable","",28.02);
}

Instance.OnScriptInput("s2_o8_f1",() => {stage2_obj8_func1()})
function stage2_obj8_func1()
{
	_cmd("hold on [24 sec]",0)
	EntFire("stage2_obj8_break","break","",24);
	EntFire("stage2_obj8_break2","break","",9);
	EntFire("stage2_obj8_break3","break","",24);
	EntFire("tp1","keyvalue","origin -9231 9075 10792",38);
	EntFire("tp1","keyvalue","angles 0 180 0 ",38);
	EntFire("stage2_tp7","enable","",38.02);
	EntFire("stage2_obj8_case","PickRandom","",24);
	EntFire("stage2_obj10_hurt_particle","start","",24);
	EntFire("stage2_obj8_exp_p","start","",24);

	EntFire("exp_g_sound2","startsound","",24)
	EntFire("exp_g_sound2","stopsound","",29)
	EntFire("s2_bgm_sound2","stopsound","",24);
	EntFire("s2_bgm_sound2_2","startsound","",24);
}

Instance.OnScriptInput("s2_o9_f1",() => {stage2_obj9_func1()})
function stage2_obj9_func1()
{
	EntFire("stage2_obj9_3_break","break","",0);
	EntFire("stage2_obj9_break","break","",22);
	EntFire("stage2_obj9_3_break2","break","",32);
	EntFire("tp1","keyvalue","origin -9848 9072 10792",32);
	EntFire("tp1","keyvalue","angles 0 180 0 ",32);
	_cmd("It needs some time [18 sec]",4)
	_cmd("Path is clear, time to move",22)
}

Instance.OnScriptInput("s2_o9_f2",() => {stage2_obj9_func2()})
function stage2_obj9_func2()
{
	EntFire("stage2_obj9_2_button_dynamic","SetAnimationNoResetNotLooping","pull",0);
	EntFire("stage2_obj9_2_button_dynamic","SetAnimationNoResetNotLooping","pull_2",1.25);
	_cmd("Wait for the gate to open [23 sec]",3)
	EntFire("stage2_obj9_2_move","open","",22);
	EntFire("stage2_obj9_2_break2","break","",23);
	EntFire("stage2_obj9_3_break","break","",0);
	EntFire("stage2_obj9_3_break2","break","",27);
}

Instance.OnScriptInput("s2_o10_f1",() => {stage2_obj10_func1()})
function stage2_obj10_func1()
{
	_cmd("a locked gate, destroy it !",3)
	EntFire("stage2_obj10_movelinear_L","open","",0);
	EntFire("stage2_obj10_movelinear_R","open","",0); 
	EntFire("stage2_obj10_zone","CountPlayersInZone","",3);
	EntFire("tp1","keyvalue","origin -11620 9219 10692",12);
	EntFire("tp1","keyvalue","angles 0 180 0 ",12);
	EntFire("stage2_tp8","enable","",12.02);
	EntFire("stage2_obj12_break1","alpha","0",0); 
	EntFire("stage2_obj12_break2","alpha","0",0); 
	EntFire("stage2_obj12_break3","alpha","0",0); 
	EntFire("stage2_obj12_break4","alpha","0",0); 
	EntFire("stage2_obj12_break5","alpha","0",0); 
	EntFire("stage2_obj12_break6","alpha","0",0);

	EntFire("s2_bgm_sound2_2","StopSound","",0)
	let n = 0
	for(let i = 0;i<6;i++){
        if(stage2_yincang_counter[i]==1){n++}
	}
	if(n == 6){
		EntFire("s2_bgm_sound3_ge","StartSound","",0)
	}else{
		EntFire("s2_end_post","enable","",0)
		EntFire("s2_bgm_sound3_be","StartSound","",0)
	}
}

Instance.OnScriptInput("s2_o11_f1",() => {stage2_obj11_func1()})
function stage2_obj11_func1()
{
	EntFire("stage2_obj11_move","open","",3); 
	EntFire("stage2_obj11_move2","open","",13); 
	_cmd("It seems like a altar,need something to active it",16)
	EntFire("stage2_obj12_door_button","unlock","",18);
	EntFire("stage2_obj12_particle2","start","",13);
}

var stage2_yincang_counter = [0,0,0,0,0,0]
Instance.OnScriptInput("stage2_yincang0",() => {stage2_yincang_counter[0]=1})
Instance.OnScriptInput("stage2_yincang1",() => {stage2_yincang_counter[1]=1})
Instance.OnScriptInput("stage2_yincang2",() => {stage2_yincang_counter[2]=1})
Instance.OnScriptInput("stage2_yincang3",() => {stage2_yincang_counter[3]=1})
Instance.OnScriptInput("stage2_yincang4",() => {stage2_yincang_counter[4]=1})
Instance.OnScriptInput("stage2_yincang5",() => {stage2_yincang_counter[5]=1})

var diehuman = 0
Instance.OnScriptInput("stage2_yincang_end",() => {stage2_yincang_end()})
function stage2_yincang_end(){
	let n = 0;
	EntFire("stage2_obj12_button_sound","Startsound","",0)
	if(stage2_yincang_counter[0]==1){EntFire("stage2_obj12_break1","alpha","255",0);n++}
	if(stage2_yincang_counter[1]==1){EntFire("stage2_obj12_break2","alpha","255",0);n++}
	if(stage2_yincang_counter[2]==1){EntFire("stage2_obj12_break3","alpha","255",0);n++}
	if(stage2_yincang_counter[3]==1){EntFire("stage2_obj12_break4","alpha","255",0);n++}
	if(stage2_yincang_counter[4]==1){EntFire("stage2_obj12_break5","alpha","255",0);n++}
	if(stage2_yincang_counter[5]==1){EntFire("stage2_obj12_break6","alpha","255",0);n++}
	if(n == 6){
		_cmd("Altar is now functioning,we need to defend until it's completed [40 sec]",0)
		_cmd("The portal is open, get in now [10 sec]!!!",30)
		EntFire("stage2_obj12_dynamic4_move","Close","",6)
		EntFire("stage2_obj12_door","Close","",12)
		EntFire("stage2_obj12_particle2","Stop","",10)
		EntFire("stage2_obj12_particle3","Start","",5)
		EntFire("tp2","keyvalue","origin 8418 -15330 -2093",40);
		EntFire("tp2","keyvalue","angles 0 0 0",40);
		EntFire("stage2_obj12_tp","enable","",40.02);
	}else if(n < 6){
		diehuman = 6-n
		_cmd("We don't have enough items to active this altar! [40 sec]",0)
		_cmd("Altar is emitting strange energy, it's corrupting us!!!",10)
		_cmd("s**t!We still need "+diehuman.toString()+" pieces,altar is devouring all of us,it wants our lives to fill its gaps",20)
		EntFire("stage2_obj12_dynamic4_move","Close","",6)
		EntFire("stage2_obj12_door","Close","",12)
		EntFire("stage2_obj12_particle2","Stop","",10)
		EntFire("stage2_obj12_particle3","Start","",5)
		EntFire("tp2","keyvalue","origin 8418 -15330 -2093",40);
		EntFire("tp2","keyvalue","angles 0 0 0",40);
		EntFire("stage2_obj12_tp","enable","",40.02);
		
		EntFire("stage2_obj12_particle","Start","",18)
		EntFire("stage2_obj12_badend_hurt","enable","",20)
		EntFire("stage2_obj12_badend_relay","trigger","",40)
	}
}

Instance.OnScriptInput("stage2_yincang_badend",() => {stage2_yincang_badend()})
function stage2_yincang_badend(){
    diehuman--
	if(diehuman==0){
		_cmd("We made it! Those sacrificial companions will be memorialized forever.We can't fail them.The portal is going to open,get in now!",0)
		EntFire("stage2_obj12_particle","stop","",5)
		EntFire("stage2_obj12_badend_hurt","kill","",0)
		EntFire("stage2_obj12_badend_relay","kill","",0)
	}
}

Instance.OnScriptInput("s2_o12_f2",() => {stage2_obj12_func2()})
function stage2_obj12_func2(){
	EntFire("item_zm_disable","fireuser1","",5);
	EntFire("stage2_obj12_particle3","stop","",5);
	EntFire("tp1","keyvalue","origin 7966 -15330 -2093",5);
	EntFire("tp1","keyvalue","angles 0 0 0",5);
	EntFire("stage2_tp9","enable","",5.02);
	EntFire("stage2_obj12_tp","disable","",10);
	EntFire("tp1","keyvalue","origin 14496 -14528 -14880",14);
	EntFire("tp1","keyvalue","angles 0 180 0",14);
	EntFire("tp2","keyvalue","origin 14496 -14528 -14880",11);
	EntFire("tp2","keyvalue","angles 0 180 0",11);
	EntFire("stage2_obj12_tp2_push","enable","",11);
	EntFire("stage2_obj12_tp2","enable","",11.02);
	EntFire("auto_fog","disable","",11);
	EntFire("stage2_obj12_tp3","enable","",14.02);
	EntFire("stage2_obj12_tp2","disable","",15);
	EntFire("stage2_obj12_tp3","disable","",19);
	EntFire("stage2_obj12_kill","enable","",91);
	EntFire("stage2_obj12_tp4","enable","",21);
	EntFire("s2_final_zone","CountPlayersInZone","",11);
	
	EntFire("s2_bgm_sound4","StartSound","",5)
}
//--------------------------------------------------------------stage3 trigger----------------------------------------------------------------------------------------------
Instance.OnScriptInput("s3_o0_f1",() => {stage3_obj0_func1()})
function stage3_obj0_func1(){
	EntFire("stage3_sky_1","enable","",0);
	EntFire("stage3_sky_2","enable","",0);
	EntFire("stage1_skybox_dynamic1","disable","",0)
	EntFire("stage_3_brush1","disable","",0);
	EntFire("stage_3_brush1","alpha","0",0);
	EntFire("tp1","keyvalue","origin 4560 -10043 3430.58",3);
	EntFire("tp1","keyvalue","angles 0 90 0",3);
	EntFire("tp2","keyvalue","origin 4558 -9246 2873",3);
	EntFire("tp2","keyvalue","angles 0 90 0",3);
	EntFire("stage_tp1","enable","",3.02);
	EntFire("stage_tp1","disable","",13);
	EntFire("stage_tp2","enable","",13);
	EntFire("tp1","keyvalue","origin 4558 -9246 2873",4);
	EntFire("tp1","keyvalue","angles 0 90 0",4);
	EntFire("stage3_obj0_push","kill","",5);

	EntFire("stage3_particle","start","",0);
	EntFire("tem_spirit","keyvalue","origin 4202 -6903.94 2872",0);
	EntFire("tem_spirit","keyvalue","angles 0 90 0",0);
	EntFire("tem_spirit","ForceSpawn","",0.02);
	EntFire("stage3_item_once","enable","",22)
	stage3_obj1_break_hp()
	stage3_obj0_case()
}

function stage3_obj0_case(){
	let r = Rand(1,3);
    switch (r) 
	{
		case 1:
			EntFire("stage3_sky_cloud1","setscale","5",0);
			EntFire("stage3_sky_cloud1","enable","",0);
			break;
        case 2:	
			EntFire("stage3_sky_cloud2","setscale","60",0);
            EntFire("stage3_sky_cloud2","enable","",0);
			break;
		case 3:	
			EntFire("stage3_sky_cloud1","setscale","5",0);
			EntFire("stage3_sky_cloud1","enable","",0);
            EntFire("stage3_sky_cloud2","setscale","60",0);
            EntFire("stage3_sky_cloud2","enable","",0);
			break;
    }
}

function stage3_obj1_break_hp(){
	EntFire("stage3_obj2_clip_p","start","",0);
	_GetPlayers()
	let n = 5000+players[0]*400
	let a = Instance.FindEntityByName("stage3_obj1_breakble",null)
	a.SetHealth(n)
}

Instance.OnScriptInput("s3_o1_f1",() => {stage3_obj1_func1()})
function stage3_obj1_func1(){
	_cmd("Wait for the path to open [20 sec]",0)
	EntFire("stage3_obj1_movelinear","open","",20);
	EntFire("stage3_obj1_clip","kill","",20);
	EntFire("stage_3_brush1","enable","",24);
    let n = 10
    for(let i=24.1;i<=26.4;i+=0.1) {
        EntFire("stage_3_brush1","alpha",n.toString(),i);
        n += 10
    }
	EntFire("stage3_obj3_particle","kill","",0);
	EntFire("tp1","keyvalue","origin 3723 -7373 2748",5);
	EntFire("tp1","keyvalue","angles 0 0 0",5);
	EntFire("tp1","keyvalue","origin 4610 -6058 3046",32);
	EntFire("tp1","keyvalue","angles 0 180 0",32);
	EntFire("tp2","keyvalue","origin 4610 -6058 3046",32);
	EntFire("tp2","keyvalue","angles 0 180 0",32);
}

Instance.OnScriptInput("s3_o2_f1",() => {stage3_obj2_func1()})
function stage3_obj2_func1()
{
	_cmd("Wait for the path to extend [22 sec]",0)
	EntFire("stage3_obj3_dynamic","DisableCollision","",0);
	EntFire("stage3_obj2_clip_p","kill","",22);
	EntFire("stage3_obj2_clip","kill","",22);
	EntFire("tp1","keyvalue","origin 2848 -4872 3004",43);
	EntFire("tp1","keyvalue","angles 0 180 0",43);
	EntFire("tp2","keyvalue","origin 3034 -3811 3004",43);
	EntFire("tp2","keyvalue","angles 0 180 0",43);
	EntFire("stage3_tp1","enable","",43.02);
}

Instance.OnScriptInput("s3_o3_f1",() => {stage3_obj3_func1()})
function stage3_obj3_func1()
{
	_cmd("Wait for the slate to move [30 sec]",0)
	EntFire("stage3_obj3_move","open","",0);
	EntFire("stage3_obj3_clip","kill","",30);
	EntFire("stage3_obj3_movelinear2","open","",30);
	EntFire("stage3_obj3_movelinear3","open","",30);
	EntFire("stage3_obj5_hurt_particle","start","",30);
	EntFire("stage3_obj3_dynamic","EnableCollision","",41);
	EntFire("stage3_obj3_dynamic","enable","",41);
	stage3_obj3_alpha()
	EntFire("stage3_obj3_dynamic2","enable","",46.52);
	EntFire("stage3_obj3_dynamic2","keyvalue","origin 3233 -3406 2832",46.5);
}

function stage3_obj3_alpha()
{	
	for (let i = 0; i < 21; i++)
	{
		EntFire("stage3_obj3_dynamic","alpha",(i*12.75).toString(),(i*0.5)+36.02);
	}
}

var stage3_obj4_button_num = 0;
Instance.OnScriptInput("s3_o4_f1",() => {stage3_obj4_func1()})
function stage3_obj4_func1()
{

	if(stage3_obj4_button_num < 4)
    {
		stage3_obj4_button_num++;

	}
	if(stage3_obj4_button_num == 4)
	{
		let r = Rand(34,46);
		_cmd("Wait for the slate to move [30 sec]",0)
		_cmd("A strange crystal, try to touch it",30)
		EntFire("tp1","keyvalue","origin 5960 -2558 2925",r);
		EntFire("tp1","keyvalue","angles 0 0 0",r);
		EntFire("stage3_obj4_movelinear5","open","",30);
		EntFire("stage3_obj4_movelinear6","open","",30);
		stage3_obj4_break_hp()
	}
}

function stage3_obj4_break_hp()
{
	_GetPlayers()
	let n = 4000+players[0]*400
	let a = Instance.FindEntityByName("stage3_obj4_break",null)
	a.SetHealth(n)
}

var stage3_obj5_hurt_num = 0;
Instance.OnScriptInput("s3_o5_f1",() => {stage3_obj5_func1()})
function stage3_obj5_func1()
{
	if(stage3_obj5_hurt_num < 300)
    {stage3_obj5_hurt_num++;}
	if(stage3_obj5_hurt_num == 300)
	{
		_cmd("Crystal has been activated, wait for it to function [16 sec]",0)
		_cmd("Portal is now open",10)
		EntFire("stage3_obj5_hurt","kill","",0);
		EntFire("stage3_obj5_hurt_particle","kill","",0);
		EntFire("stage3_obj5_tp_particle","start","",10);
		EntFire("stage3_obj5_tp","enable","",16);
		EntFire("stage3_obj6_particle","start","",16);
		EntFire("stage3_obj6_break3_particle","start","",16);
		EntFire("stage3_obj6_break2_particle","start","",16);
		EntFire("stage3_obj6_dy1","enable","",16);
		
		EntFire("s3_bgm_sound1","StopSound","",0)
		EntFire("s3_bgm_sound2","StartSound","",0)
	}
}

Instance.OnScriptInput("s3_o5_f2",() => {stage3_obj5_func2()})
function stage3_obj5_func2()
{
	EntFire("tp1","keyvalue","origin 5061 1355 2550",8);
	EntFire("tp1","keyvalue","angles 0 90 0",8);
	EntFire("stage3_tp3","enable","",8.02);
	EntFire("stage3_sky_2","disable","",5);
	EntFire("stage3_obj6_break","break","",22);
	EntFire("stage3_obj0_particle","kill","",8);
	EntFire("stage3_obj0_particle2","kill","",8);
	EntFire("stage3_obj3_particle","kill","",8);
	EntFire("stage3_item_particle1","kill","",8);
	EntFire("stage3_item_particle2","kill","",8);
}

Instance.OnScriptInput("s3_o6_f1",() => {stage3_obj6_func1()})
function stage3_obj6_func1()
{
	_cmd("defend until entrance opens [50 sec]",0)
	_cmd("Gate is opening [5 sec]",45)
	EntFire("stage3_obj6_doorL_1","open","",50);
	EntFire("stage3_obj6_doorR_1","open","",50);
	EntFire("stage3_obj6_doorL_2","open","",52);
	EntFire("stage3_obj6_doorR_2","open","",52);
	EntFire("stage3_obj6_doorL_1","close","",71);
	EntFire("stage3_obj6_doorR_1","close","",71);
	EntFire("stage3_obj6_doorL_2","close","",73);
	EntFire("stage3_obj6_doorR_2","close","",73);
	EntFire("tp1","keyvalue","origin 8109 6027 2709",74);
	EntFire("tp1","keyvalue","angles 0 0 0",74);
	EntFire("stage3_tp4","enable","",74.02);
}

Instance.OnScriptInput("s3_o7_f1",() => {stage3_obj7_func1()})
function stage3_obj7_func1()
{
	let r = Rand(1,2);
    switch (r) 
	{
		case 1://左边
		    _cmd("Left Side",28)
			EntFire("stage3_obj7_doorL","open","",30);
			EntFire("stage3_obj7_doorR","open","",30);
			EntFire("tp1","keyvalue","origin 10976 6024 2710",40);
			EntFire("tp1","keyvalue","angles 0 180 0",40);
			break;
        case 2:	//右边
		    _cmd("Right Side",28)
			EntFire("stage3_obj7_2_doorL","open","",30);
			EntFire("stage3_obj7_2_doorR","open","",30);
			EntFire("tp1","keyvalue","origin 10976 6024 2710",40);
			EntFire("tp1","keyvalue","angles 0 180 0",40);
			break;
    }
}

Instance.OnScriptInput("s3_o7_f2",() => {stage3_obj7_func2()})
function stage3_obj7_func2(){	
	_cmd("Wait for the crystal to fall [23 sec]",0)
	_cmd("trigger the crystal to activate portal",22)
	EntFire("stage3_obj7_movelinear","open","",0);
	EntFire("stage3_obj7_break","SetHealth","800",22);
	EntFire("stage3_obj7_break2","SetHealth","800",22);
	EntFire("stage3_obj7_button","unlock","",23);
}

Instance.OnScriptInput("s3_o7_f3",() => {stage3_obj7_func3()})
function stage3_obj7_func3()
{	
	_cmd("Portal is open ",18)
	EntFire("stage3_obj7_tp_particle","start","",18);
	EntFire("stage3_obj7_rotating","start","",18);
	EntFire("stage3_sky_1","disable","",18);
	EntFire("tp2","keyvalue","origin -552 8728 524",21);
	EntFire("tp2","keyvalue","angles 0 0 0",21);
	EntFire("stage3_obj7_tp","enable","",21.02);
	EntFire("stage3_obj7_doorL","close","",4);
	EntFire("stage3_obj7_doorR","close","",4);
	EntFire("tp1","keyvalue","origin 10640 7800 2702",8);
	EntFire("tp1","keyvalue","angles 0 90 0",8);
	EntFire("stage3_tp5","enable","",8.02);
	EntFire("stage3_obj7_movelinear","kill","",0);
}

Instance.OnScriptInput("s3_o72_f1",() => {stage3_obj7_2_func1()})
function stage3_obj7_2_func1()
{	
	_cmd("Wait for the iron fence to open [30 sec]",0)
	_cmd("Teleport is activated",54)
	EntFire("stage3_obj7_2_dynamic","SetAnimationNoResetNotLooping","pull",0);
	EntFire("stage3_obj7_2_dynamic","SetAnimationNoResetNotLooping","pull_2",1.25);
	EntFire("stage3_obj7_2_doorL2","open","",30);
	EntFire("stage3_obj7_2_doorR2","open","",30);
	EntFire("tp1","keyvalue","origin 10060 4096 2580",34);
	EntFire("tp1","keyvalue","angles 0 90 0",34);
	EntFire("stage3_tp5","enable","",34.02);
	EntFire("stage3_obj7_2_doorL","close","",34);
	EntFire("stage3_obj7_2_doorR","close","",34);
	EntFire("stage3_obj7_tp2_particle","start","",54);
	EntFire("stage3_obj7_rotating","start","",54);
	EntFire("tp2","keyvalue","origin -552 8728 524",57);
	EntFire("tp2","keyvalue","angles 0 0 0",57);
	EntFire("stage3_obj7_tp2","enable","",57.02);
	EntFire("stage3_sky_1","disable","",57);
	EntFire("stage3_sky_3","enable","",57);
}

Instance.OnScriptInput("s3_o8_f1",() => {stage3_obj8_func1()})
function stage3_obj8_func1()
{	
	EntFire("stage3_obj7_tp3_particle","start","",0);
	EntFire("stage3_obj7_sky_dy0","disable","",0);
	EntFire("stage3_obj6_dy1","disable","",0);
	EntFire("stage3_obj8_particle","start","",16);
	EntFire("stage3_obj8_wall","Toggle","",16);
	EntFire("tp1","keyvalue","origin -552 8728 524",18);
	EntFire("tp1","keyvalue","angles 0 0 0",18);
	EntFire("stage3_tp6","enable","",18.02);
	EntFire("stage3_obj11_particle","start","",0);
	EntFire("stage3_obj7_tp","kill","",18);
	EntFire("stage3_obj7_tp2","kill","",18);
	EntFire("stage3_obj11_p0","start","",0);

	EntFire("s3_bgm_sound2","StopSound","",0)
	EntFire("s3_bgm_sound3","StartSound","",0)
}

Instance.OnScriptInput("s3_o9_f1",() => {stage3_obj9_func1()})
function stage3_obj9_func1()
{	
	_cmd("defend until the crystal falls [63 sec]",10)
	_cmd("Obstacle has been moved",63)
	_cmd("trigger the crystal to activate the slate",70)
	EntFire("stage3_obj8_wall","Toggle","",8);
	EntFire("stage3_obj8_particle","kill","",6);
	EntFire("stage3_obj9_movelinear","open","",30);
	EntFire("stage3_obj9_tp","enable","",13); 
	EntFire("stage3_obj9_particle","start","",60);
	EntFire("stage3_obj9_particle","kill","",70);
	EntFire("stage3_obj9_wall","Toggle","",63);
	EntFire("tp1","keyvalue","origin 2333 8737 454",70);
	EntFire("tp1","keyvalue","angles 0 0 0",70);
	EntFire("stage3_obj10_button","unlock","",70.02);
}

Instance.OnScriptInput("s3_o10_f1",() => {stage3_obj10_func1()})
function stage3_obj10_func1()
{	
	_cmd("The crystal is activated, wait for the slate to function [30 sec]",0)
	_cmd("trigger 3 slates to activate the mechanism",30)
	EntFire("stage3_obj10_break","break","",0);
	EntFire("stage3_obj10_movelinear1","open","",26);
	EntFire("stage3_obj10_movelinear2","open","",27);
	EntFire("stage3_obj10_movelinear3","open","",28);
	EntFire("stage3_obj9_wall","Toggle","",34);
	EntFire("stage3_obj10_tp","enable","",34);
	EntFire("stage3_obj11_mut1","enable","",30);
	EntFire("stage3_obj11_mut2","enable","",30);
	EntFire("stage3_obj11_mut3","enable","",30);
}

var stage3_obj11_num = 0;
Instance.OnScriptInput("s3_o11_f1",() => {stage3_obj11_func1()})
function stage3_obj11_func1()
{
	if(stage3_obj11_num < 3)
    {stage3_obj11_num++;}
	if(stage3_obj11_num == 3)
	{
		_cmd("wait for the path to clear [22 sec]",38)
		EntFire("stage3_obj11_movelinear","open","",6);
		EntFire("stage3_obj11_jump0","enable","",14);
		EntFire("stage3_obj11_jump0","disable","",14.5);
		EntFire("stage3_obj11_break1","break","",16); 
		EntFire("stage3_obj11_p0","stop","",16);
		EntFire("stage3_obj11_wall","Toggle","",16);
		EntFire("stage3_obj11_movelinear4","open","",34 ); 
		EntFire("tp1","keyvalue","origin 2306.01 10600 388",12);
		EntFire("tp1","keyvalue","angles 0 90 0",12);
		EntFire("stage3_obj11_tp","enable","",38);
		EntFire("stage3_obj11_wall2","Toggle","",60);
		EntFire("stage3_obj11_particle","kill","",60);
		EntFire("stage3_obj11_particle2","start","",72);
		EntFire("stage3_obj11_tp2","enable","",77.02);
		EntFire("tp2","keyvalue","origin -10384 -874.15 1540",77);
		EntFire("tp2","keyvalue","angles 0 90 0",77);
	}
}

Instance.OnScriptInput("s3_o11_f2",() => {stage3_obj11_func2()})
function stage3_obj11_func2()
{	
	_cmd("Is this inside the building?",0)
	EntFire("tp1","keyvalue","origin -10384 -874.15 1540",14);
	EntFire("tp1","keyvalue","angles 0 90 0",14);
	EntFire("stage3_tp7","enable","",14.02);
	EntFire("stage3_obj9_tp","disable","",14);
	EntFire("stage3_obj10_tp","disable","",14);
	EntFire("stage3_obj11_tp","disable","",14);
	EntFire("stage3_sky_3","disable","",14);
	EntFire("stage3_sky_4","enable","",14);
	EntFire("stage3_obj11_dy1","enable","",0);
}

Instance.OnScriptInput("s3_o12_f1",() => {stage3_obj12_func1()})
function stage3_obj12_func1()
{	
	_cmd("Wait for the gate to fall [30 sec]",0)
	_cmd("Find crystal to remove the barrier of the gate",35)
	EntFire("stage3_obj12_particle","kill","",0);
	EntFire("stage3_obj12_button","kill","",0);
	EntFire("stage3_obj12_door","open","",30);
	EntFire("tp1","keyvalue","origin -10400 -208 1684",5);
	EntFire("tp1","keyvalue","angles 0 90 0",5);
}

var stage3_obj13_num = 0;
Instance.OnScriptInput("s3_o13_f1",() => {stage3_obj13_func1()})
function stage3_obj13_func1()
{
	if(stage3_obj13_num < 4)
    {stage3_obj13_num++;}
	if(stage3_obj13_num == 4)
	{
		_cmd("Wait for the barrier to disappear [30 sec]",0)
		EntFire("stage3_obj12_door","close","",10);
		EntFire("tp1","keyvalue","origin -7480 579 1492",12);
		EntFire("tp1","keyvalue","angles 0 0 0",12);
		EntFire("stage3_tp8","enable","",12.02);
		EntFire("stage3_obj13_wall","Toggle","",30);
		EntFire("stage3_obj13_particle","kill","",30);
		EntFire("stage3_obj13_break3","break","",20);
		EntFire("stage3_obj13_break1","break","",30);
		EntFire("stage3_obj13_break2","break","",30);
		EntFire("stage3_obj14_move","open","",30);

		EntFire("s3_bgm_sound3","StopSound","",30)
		EntFire("s3_bgm_sound4","StartSound","",30)
	}
}

var stage3_obj14_num = 0;
Instance.OnScriptInput("s3_o14_f1",() => {stage3_obj14_func1()})
function stage3_obj14_func1()
{	
	if(stage3_obj14_num < 2)
    {stage3_obj14_num++;}
	if(stage3_obj14_num == 2)
	{
		_cmd("Wait for the tunnel to open [24 sec]",0)
		EntFire("stage3_obj14_move2","open","",24);
		EntFire("stage3_obj14_move3","open","",44);
		EntFire("stage3_obj14_move2","close","",50);
		EntFire("tp1","keyvalue","origin -2456 579 2020",52);
		EntFire("tp1","keyvalue","angles 0 0 0",52);
		EntFire("stage3_tp9","enable","",52.02);
		
	}
}

Instance.OnScriptInput("s3_o15_f1",() => {stage3_obj15_func1()})
function stage3_obj15_func1()
{	
	_cmd("Wait for tunnel open [18 sec]",0)
	_cmd("Holy Spirit Prayer [5 sec]",10)
	EntFire("Item_Human_Heal_Maker","forcespawn","",15);
	EntFire("Item_Human_Heal_Sound","startsound","",15);
	EntFire("Item_Human_Heal_Sound","stopsound","",21);
	EntFire("stage3_obj17_particle3","start","",15);
	EntFire("stage3_obj16_wall2_p","start","",15);
	EntFire("stage3_obj15_door","open","",18);
	EntFire("stage3_obj15_wall","kill","",22);
	EntFire("stage3_boss_particle2","start","",15);
	EntFire("stage3_tp10","enable","",49.02);
	EntFire("stage3_obj15_door","close","",47);
	EntFire("item_zm_disable","fireuser1","",51);
	EntFire("stage3_obj16_wall2","kill","",57);
	EntFire("stage3_obj16_wall2_p","stop","",57);
	EntFire("stage3_boss_particle","start","",51);
	EntFire("stage3_boss_dynamic","alpha","0",51);
	EntFire("stage3_boss_dynamic","enable","",51);
	EntFire("stage3_boss_dynamic","alpha","50",51.5);
	EntFire("stage3_boss_dynamic","alpha","100",52);
	EntFire("stage3_boss_dynamic","alpha","150",52.5);
	EntFire("stage3_boss_dynamic","alpha","200",53);
	EntFire("stage3_boss_dynamic","alpha","255",53.5);
	EntFire("stage3_boss_dynamic","alpha","255",54);
	EntFire("stage3_boss_dynamic","alpha","255",54.5);
	EntFire("stage3_boss_dynamic","alpha","255",55);
	EntFire("stage3_boss_dynamic","alpha","255",55.5);
	EntFire("stage3_boss_dynamic","alpha","255",56);
	EntFire("stage3_boss_particle","kill","",56);
	EntFire("stage3_boss_dynamic","SetAnimationNotLooping","skill1",57.1);
	EntFire(self,"RunScriptInput","s3_o16_hpadd",58);
	EntFire(self,"RunScriptInput","s3_o16_f1",58.5);


	EntFire("stage3_boss_startsound","startsound","",51);
	EntFire("stage3_boss_startsound2","startsound","",57);
}

var stage3_laser = true;
Instance.OnScriptInput("s3_o16_f1",() => {stage3_obj16_func1()})
function stage3_obj16_func1() 
{
	if(stage3_laser)
	{
    let r = Rand(1,4);
    switch (r) 
	{
		case 1:
			EntFire("stage3_boss_dynamic","SetAnimationNotLooping","AttackA",0);
			stage3_obj16_case()
			break;
        case 2:
			EntFire("stage3_boss_dynamic","SetAnimationNotLooping","AttackB",0);
			stage3_obj16_case()
			break;
		case 3:
			EntFire("stage3_boss_dynamic","SetAnimationNotLooping","AttackC",0);
			stage3_obj16_case()
			break;
		case 4:
			EntFire("stage3_boss_dynamic","SetAnimationNotLooping","AttackD",0);
			stage3_obj16_case()
			break;
    }
	EntFire("stage3_boss_laser_sound","startsound","",0);
	EntFire(self,"RunScriptInput","s3_o16_f1",1.2);
	}
}

function stage3_obj16_case() 
{
    let r = Rand(1,7);
    switch (r) 
	{
		case 1:
			EntFire("stage_3_laser_1","keyvalue","origin -794 1764 1894",0);
			EntFire("stage_3_laser_1","keyvalue","angles 0 0 0",0);
			EntFire("stage_3_laser_1","forcespawn","",0.02);
			break;//高
        case 2:
            EntFire("stage_3_laser_1","keyvalue","origin -794 1764 1866",0);
			EntFire("stage_3_laser_1","keyvalue","angles 0 0 0",0);
			EntFire("stage_3_laser_1","forcespawn","",0.02);
			break;//中
		case 3:
            EntFire("stage_3_laser_1","keyvalue","origin -794 1764 1838",0);
			EntFire("stage_3_laser_1","keyvalue","angles 0 0 0",0);
			EntFire("stage_3_laser_1","forcespawn","",0.02);
			break;//低
		case 4:
            EntFire("stage_3_laser_1","keyvalue","origin -794 1764 1894",0);
			EntFire("stage_3_laser_1","keyvalue","angles -18 0 0",0);
			EntFire("stage_3_laser_1","forcespawn","",0.02);
			break;//高右斜
		case 5:
            EntFire("stage_3_laser_1","keyvalue","origin -794 1764 1894",0);
			EntFire("stage_3_laser_1","keyvalue","angles 18 0 0",0);
			EntFire("stage_3_laser_1","forcespawn","",0.02);
			break;//高左斜
		case 5:
            EntFire("stage_3_laser_1","keyvalue","origin -794 1764 1866",0);
			EntFire("stage_3_laser_1","keyvalue","angles -10 0 0",0);
			EntFire("stage_3_laser_1","forcespawn","",0.02);
			break;//中右斜
		case 6:
            EntFire("stage_3_laser_1","keyvalue","origin -794 1764 1866",0);
			EntFire("stage_3_laser_1","keyvalue","angles 10 0 0",0);
			EntFire("stage_3_laser_1","forcespawn","",0.02);
			break;//中左斜	
		case 7:
            EntFire("stage_3_laser_1","keyvalue","origin -794 1764 1866",0);
			EntFire("stage_3_laser_1","keyvalue","angles 10 0 0",0);
			EntFire("stage_3_laser_1","forcespawn","",0.02);
			EntFire("stage_3_laser_1","keyvalue","origin -794 1764 1866",0.04);
			EntFire("stage_3_laser_1","keyvalue","angles -10 0 0",0.04);
			EntFire("stage_3_laser_1","forcespawn","",0.06);
			break;//交叉刀
    }
	EntFire("stage_3_laser_1_hurt*","SetDamage","28",0.1);
}

var boss_maxhp = 100
Instance.OnScriptInput("s3_o16_hpadd",() => {stage3_obj16_boss_hpadd()})
function stage3_obj16_boss_hpadd()
{
	boss_hp_Enable=true;
	EntFire("stage3_boss_box","addhealth","11111111",0);
	EntFire("stage3_boss_box","keyvalue","origin -794 1950 1915.76",0);
	EntFire("stage3_hp_par0","start","",0);
	_GetPlayers()
	boss_hp = players[0]*110
	boss_maxhp = boss_hp
}

var boss_hp = 400;
var boss_hp_Enable = false;
Instance.OnScriptInput("stage3_obj16_hpchange",() => {stage3_obj16_boss_hp()})
function stage3_obj16_boss_hp()
{
	if(boss_hp_Enable)
	{	if(boss_hp>0)
		boss_hp = boss_hp - 1
	}
	EntFire("stage3_hp_par0","setalphascale",(boss_hp/boss_maxhp).toString(),0);
	if(boss_hp<=0)
	{
		stage3_laser = false
		_cmd("She disappeared, we need to leave this place now [37 sec]!!!",1)
		EntFire("stage3_hp_par0","stop","",0);
		EntFire("stage3_boss_box","kill","",0);
		EntFire("stage3_obj16_wall","kill","",3);
		EntFire("stage3_boss_particle2","kill","",3);
		EntFire("stage3_boss_particle3","start","",0);
		EntFire("stage3_boss_particle3","kill","",2);
		EntFire("stage3_boss_dynamic","kill","",0.5);
		EntFire(self,"RunScriptInput","s3_o17_f1","",1);
	}
	return
}

Instance.OnScriptInput("s3_o17_f1",() => {stage3_obj17_func1()})
function stage3_obj17_func1()
{		
	_cmd("This is the end,Get in and leave this s**t place [19 sec]!!!",37)
	EntFire("item_zm_disable","fireuser2","",6);
	EntFire("stage3_obj17_wall","kill","",10.52);
	EntFire("stage3_obj17_particle3","kill","",10.5);
	EntFire("stage3_obj17_move","break","",37);
	EntFire("stage3_obj17_wall2","kill","",37);
	EntFire("stage3_obj17_particle2","start","",37);
	
	EntFire("stage3_obj17_particle","start","",37);
	EntFire("stage3_obj17_push","enable","",56);
	EntFire("stage3_obj17_tp","enable","",56);
}

Instance.OnScriptInput("s3_o18_f1",() => {stage3_obj18_func1()})
function stage3_obj18_func1()
{		
	_cmd("We made it! What's the place? Again???",9)
	EntFire("fade2","fade","",7);
	EntFire("stage3_tp11","enable","",7);
	EntFire("fade1","Fade","",5);
	EntFire("auto_fog","disable","",7);
	EntFire("stage3_particle","kill","",5);
	EntFire("stage3_sky_cloud*","disable","",7.1);
	EntFire("stage3_obj17_particle","stop","",5);
	EntFire("stage3_sky_*","disable","",7.1);
	EntFire("zone_killzombie","CountPlayersInZone","",17);
	EntFire("zr_toggle_respawn","Trigger","",17);

	EntFire("sky_tibet","enable","",7.1);
	EntFire("sky_space","disable","",7.1);
	EntFire("sky_cs15","disable","",7.1);
}

//--------------第一关64单位火焰刷新

function stage1_fire()
{
	EntFire("stage_fire_temp","keyvalue","origin -3332 -9225.17 -2124",0);
	EntFire("stage_fire_temp","ForceSpawn","",0.02);
	EntFire("stage_fire_temp","keyvalue","origin -6431 -7211 -1788",0.04);
	EntFire("stage_fire_temp","ForceSpawn","",0.06);
	EntFire("stage_fire_temp","keyvalue","origin -6429 -7516 -1790",0.08);
	EntFire("stage_fire_temp","ForceSpawn","",0.1);
	EntFire("stage_fire_temp","keyvalue","origin -8411 -8818 -2083",0.12);
	EntFire("stage_fire_temp","ForceSpawn","",0.14);
	EntFire("stage_fire_temp","keyvalue","origin -8241 -8997 -2084",0.16);
	EntFire("stage_fire_temp","ForceSpawn","",0.18);
	EntFire("stage_fire_temp","keyvalue","origin -8414 -9161 -2084",0.20);
	EntFire("stage_fire_temp","ForceSpawn","",0.22);
	EntFire("stage_fire_temp","keyvalue","origin -9945 -9211 -2116",0.24);
	EntFire("stage_fire_temp","ForceSpawn","",0.26);
	EntFire("stage_fire_temp","keyvalue","origin -10012 -8967 -2116",0.28);
	EntFire("stage_fire_temp","ForceSpawn","",0.30);
	EntFire("stage_fire_temp","keyvalue","origin 4945 -5423 12255",0.32);
	EntFire("stage_fire_temp","ForceSpawn","",0.34);
	EntFire("stage_fire_temp","keyvalue","origin 4763 -5559 12261",0.36);
	EntFire("stage_fire_temp","ForceSpawn","",0.38);
	EntFire("stage_fire_temp","keyvalue","origin -8587 -8992 -2086",0.40);
	EntFire("stage_fire_temp","ForceSpawn","",0.42);
	EntFire("stage_fire_temp","keyvalue","origin -9568 -9408 -2120",0.44);
	EntFire("stage_fire_temp","ForceSpawn","",0.46);
}
//---------------第二关64单位火焰刷新
function stage2_fire()
{
	EntFire("stage_fire_temp","keyvalue","origin -9303 12115 9835",0);
	EntFire("stage_fire_temp","ForceSpawn","",0.02);
	EntFire("stage_fire_temp","keyvalue","origin -9276 11616 9834",0.04);
	EntFire("stage_fire_temp","ForceSpawn","",0.06);
	EntFire("stage_fire_temp","keyvalue","origin -9711 11026 9545",0.08);
	EntFire("stage_fire_temp","ForceSpawn","",0.1);
	EntFire("stage_fire_temp","keyvalue","origin -10078 10527 9672",0.12);
	EntFire("stage_fire_temp","ForceSpawn","",0.14);
	EntFire("stage_fire_temp","keyvalue","origin -10078 10527 9672",0.16);
	EntFire("stage_fire_temp","ForceSpawn","",0.18);
	EntFire("stage_fire_temp","keyvalue","origin -9989 10348 9675",0.20);
	EntFire("stage_fire_temp","ForceSpawn","",0.22);
	EntFire("stage_fire_temp","keyvalue","origin -10682 10351 9679",0.24);
	EntFire("stage_fire_temp","ForceSpawn","",0.26);
	EntFire("stage_fire_temp","keyvalue","origin -10949 11072 9413",0.28);
	EntFire("stage_fire_temp","ForceSpawn","",0.30);
	EntFire("stage_fire_temp","keyvalue","origin -10839 11616 9417",0.32);
	EntFire("stage_fire_temp","ForceSpawn","",0.34);
	EntFire("stage_fire_temp","keyvalue","origin -10890 12122 9417",0.36);
	EntFire("stage_fire_temp","ForceSpawn","",0.38);
	EntFire("stage_fire_temp","keyvalue","origin -10878 10225 9416",0.40);
	EntFire("stage_fire_temp","ForceSpawn","",0.42);
	EntFire("stage_fire_temp","keyvalue","origin -10881 9194 9421",0.44);
	EntFire("stage_fire_temp","ForceSpawn","",0.46);
	EntFire("stage_fire_temp","keyvalue","origin -11055 10355 9672",0.48);
	EntFire("stage_fire_temp","ForceSpawn","",0.50);
	EntFire("stage_fire_temp","keyvalue","origin -11260 9612 9422",0.52);
	EntFire("stage_fire_temp","ForceSpawn","",0.54);
	EntFire("stage_fire_temp","keyvalue","origin -11303 10295 9417",0.56);
	EntFire("stage_fire_temp","ForceSpawn","",0.58);
	EntFire("stage_fire_temp","keyvalue","origin -11211 11105 9415",0.60);
	EntFire("stage_fire_temp","ForceSpawn","",0.62);
	EntFire("stage_fire_temp","keyvalue","origin -11184 11883 9415",0.64);
	EntFire("stage_fire_temp","ForceSpawn","",0.66);
	EntFire("stage_fire_temp","keyvalue","origin -11173 12704 9416",0.68);
	EntFire("stage_fire_temp","ForceSpawn","",0.70);
	EntFire("stage_fire_temp","keyvalue","origin -11478 10238 9672",0.72);
	EntFire("stage_fire_temp","ForceSpawn","",0.74);
	EntFire("stage_fire_temp","keyvalue","origin -11705 10237 9674",0.76);
	EntFire("stage_fire_temp","ForceSpawn","",0.78);
	EntFire("stage_fire_temp","keyvalue","origin -11651 11103 9414",0.80);
	EntFire("stage_fire_temp","ForceSpawn","",0.82);
	EntFire("stage_fire_temp","keyvalue","origin -6641 6561 11369",0.84);
	EntFire("stage_fire_temp","ForceSpawn","",0.86);
	EntFire("stage_fire_temp","keyvalue","origin -6641 7202 11368",0.88);
	EntFire("stage_fire_temp","ForceSpawn","",0.90);
	EntFire("stage_fire_temp","keyvalue","origin -6641 7420 11368",0.92);
	EntFire("stage_fire_temp","ForceSpawn","",0.94);
	EntFire("stage_fire_temp","keyvalue","origin -6947 6561 11369",0.96);
	EntFire("stage_fire_temp","ForceSpawn","",0.98);
	EntFire("stage_fire_temp","keyvalue","origin -6941 7202 11369",1.0);
	EntFire("stage_fire_temp","ForceSpawn","",1.02);
	EntFire("stage_fire_temp","keyvalue","origin -7264 7209 11368",1.04);
	EntFire("stage_fire_temp","ForceSpawn","",1.06);
	EntFire("stage_fire_temp","keyvalue","origin -7598 6566 11368",1.08);
	EntFire("stage_fire_temp","ForceSpawn","",1.10);
	EntFire("stage_fire_temp","keyvalue","origin -7598 6877 11369",1.12);
	EntFire("stage_fire_temp","ForceSpawn","",1.14);
	EntFire("stage_fire_temp","keyvalue","origin -7598 7202 11368",1.16);
	EntFire("stage_fire_temp","ForceSpawn","",1.18);
	EntFire("stage_fire_temp","keyvalue","origin -8193 6884 11173",1.20);
	EntFire("stage_fire_temp","ForceSpawn","",1.22);
	EntFire("stage_fire_temp","keyvalue","origin -5949 6119 11557",1.24);
	EntFire("stage_fire_temp","ForceSpawn","",1.26);
	EntFire("stage_fire_temp","keyvalue","origin -5949 6119 11557",1.28);
	EntFire("stage_fire_temp","ForceSpawn","",1.30);
	EntFire("stage_fire_temp","keyvalue","origin -5611 6817 11751",1.32);
	EntFire("stage_fire_temp","ForceSpawn","",1.34);
	EntFire("stage_fire_temp","keyvalue","origin -5923 7320 11557",1.36);
	EntFire("stage_fire_temp","ForceSpawn","",1.38);
	EntFire("stage_fire_temp","keyvalue","origin -6304 7641 11557",1.40);
	EntFire("stage_fire_temp","ForceSpawn","",1.42);
	EntFire("stage_fire_temp","keyvalue","origin -6336 7985 11555",1.44);
	EntFire("stage_fire_temp","ForceSpawn","",1.46);
	EntFire("stage_fire_temp","keyvalue","origin -6964 8013 11647",1.48);
	EntFire("stage_fire_temp","ForceSpawn","",1.50);
	EntFire("stage_fire_temp","keyvalue","origin -7714 6850 11746",1.52);
	EntFire("stage_fire_temp","ForceSpawn","",1.54);
	EntFire("stage_fire_temp","keyvalue","origin -6642 7367 11621",1.56);
	EntFire("stage_fire_temp","ForceSpawn","",1.58);
	EntFire("stage_fire_temp","keyvalue","origin -7032 7394 11621",1.60);
	EntFire("stage_fire_temp","ForceSpawn","",1.62);
	EntFire("stage_fire_temp","keyvalue","origin -7430 7361 11621",1.64);
	EntFire("stage_fire_temp","ForceSpawn","",1.66);
	EntFire("stage_fire_temp","keyvalue","origin -6622 6827 11621",1.68);
	EntFire("stage_fire_temp","ForceSpawn","",1.70);
	EntFire("stage_fire_temp","keyvalue","origin -6639 6376 11621",1.72);
	EntFire("stage_fire_temp","ForceSpawn","",1.74);
	EntFire("stage_fire_temp","keyvalue","origin -7043 6391 11621",1.76);
	EntFire("stage_fire_temp","ForceSpawn","",1.78);
	EntFire("stage_fire_temp","keyvalue","origin -7487 6380 11621",1.80);
	EntFire("stage_fire_temp","ForceSpawn","",1.82);
	EntFire("stage_fire_temp","keyvalue","origin -7111 8321 11366",1.84);
	EntFire("stage_fire_temp","ForceSpawn","",1.86);
	EntFire("stage_fire_temp","keyvalue","origin -8381 7896 11175",1.88);
	EntFire("stage_fire_temp","ForceSpawn","",1.90);
	EntFire("stage_fire_temp","keyvalue","origin -8874 7961 11177",1.92);
	EntFire("stage_fire_temp","ForceSpawn","",1.94);
	EntFire("stage_fire_temp","keyvalue","origin -8895 8765 10985",1.96);
	EntFire("stage_fire_temp","ForceSpawn","",1.98);
	EntFire("stage_fire_temp","keyvalue","origin -8392 7666 10981",2.0);
	EntFire("stage_fire_temp","ForceSpawn","",2.02);
	EntFire("stage_fire_temp","keyvalue","origin -8386 8407 10981",2.04);
	EntFire("stage_fire_temp","ForceSpawn","",2.06);
	EntFire("stage_fire_temp","keyvalue","origin -8386 8707 10981",2.08);
	EntFire("stage_fire_temp","ForceSpawn","",2.10);
	EntFire("stage_fire_temp","keyvalue","origin -8386 9174 10981",2.12);
	EntFire("stage_fire_temp","ForceSpawn","",2.14);
	EntFire("stage_fire_temp","keyvalue","origin -8379 9669 10982",2.16);
	EntFire("stage_fire_temp","ForceSpawn","",2.18);
	EntFire("stage_fire_temp","keyvalue","origin -9288 9084 10783",2.20);
	EntFire("stage_fire_temp","ForceSpawn","",2.22);
	EntFire("stage_fire_temp","keyvalue","origin -9920 9071 10788",2.24);
	EntFire("stage_fire_temp","ForceSpawn","",2.26);
	EntFire("stage_fire_temp","keyvalue","origin -9894 8598 10786",2.28);
	EntFire("stage_fire_temp","ForceSpawn","",2.30);
	EntFire("stage_fire_temp","keyvalue","origin -9914 9543 10782",2.32);
	EntFire("stage_fire_temp","ForceSpawn","",2.34);
	EntFire("stage_fire_temp","keyvalue","origin -9251 8529 10790",2.36);
	EntFire("stage_fire_temp","ForceSpawn","",2.38);
	EntFire("stage_fire_temp","keyvalue","origin -8724 8546 10716",2.40);
	EntFire("stage_fire_temp","ForceSpawn","",2.42);
	EntFire("stage_fire_temp","keyvalue","origin -9258 8023 10789",2.44);
	EntFire("stage_fire_temp","ForceSpawn","",2.46);
	EntFire("stage_fire_temp","keyvalue","origin -9635 8020 10696",2.48);
	EntFire("stage_fire_temp","ForceSpawn","",2.50);
	EntFire("stage_fire_temp","keyvalue","origin -9631 8333 10694",2.52);
	EntFire("stage_fire_temp","ForceSpawn","",2.54);
	EntFire("stage_fire_temp","keyvalue","origin -10368 8183 10503",2.56);
	EntFire("stage_fire_temp","ForceSpawn","",2.58);
	EntFire("stage_fire_temp","keyvalue","origin -10799 8095 10500",2.60);
	EntFire("stage_fire_temp","ForceSpawn","",2.62);
	EntFire("stage_fire_temp","keyvalue","origin -10443 8440 10502",2.64);
	EntFire("stage_fire_temp","ForceSpawn","",2.66);
	EntFire("stage_fire_temp","keyvalue","origin -9274 10009 10688",2.68);
	EntFire("stage_fire_temp","ForceSpawn","",2.70);
	EntFire("stage_fire_temp","keyvalue","origin -9274 10295 10688",2.72);
	EntFire("stage_fire_temp","ForceSpawn","",2.74);
	EntFire("stage_fire_temp","keyvalue","origin -9762 10295 10687",2.76);
	EntFire("stage_fire_temp","ForceSpawn","",2.78);
	EntFire("stage_fire_temp","keyvalue","origin -10054 10686 10812",2.80);
	EntFire("stage_fire_temp","ForceSpawn","",2.82);
	EntFire("stage_fire_temp","keyvalue","origin -10324 10277 10694",2.84);
	EntFire("stage_fire_temp","ForceSpawn","",2.86);
	EntFire("stage_fire_temp","keyvalue","origin -10741 10305 10810",2.88);
	EntFire("stage_fire_temp","ForceSpawn","",2.90);
	EntFire("stage_fire_temp","keyvalue","origin -9874 8992 10494",2.92);
	EntFire("stage_fire_temp","ForceSpawn","",2.94);
	EntFire("stage_fire_temp","keyvalue","origin -9880 9427 10497",2.96);
	EntFire("stage_fire_temp","ForceSpawn","",2.98);
	EntFire("stage_fire_temp","keyvalue","origin -10548 10012 10470",3.0);
	EntFire("stage_fire_temp","ForceSpawn","",3.02);
	EntFire("stage_fire_temp","keyvalue","origin -10328 9848 10691",3.04);
	EntFire("stage_fire_temp","ForceSpawn","",3.06);
	EntFire("stage_fire_temp","keyvalue","origin -10488 9232 10688",3.08);
	EntFire("stage_fire_temp","ForceSpawn","",3.10);
	EntFire("stage_fire_temp","keyvalue","origin -10337 8571 10692",3.12);
	EntFire("stage_fire_temp","ForceSpawn","",3.14);
	EntFire("stage_fire_temp","keyvalue","origin -10347 8107 10695",3.16);
	EntFire("stage_fire_temp","ForceSpawn","",3.18);
	EntFire("stage_fire_temp","keyvalue","origin -10129 7763 10684",3.20);
	EntFire("stage_fire_temp","ForceSpawn","",3.22);
	EntFire("stage_fire_temp","keyvalue","origin -10832 9145 10690",3.24);
	EntFire("stage_fire_temp","ForceSpawn","",3.26);
	EntFire("stage_fire_temp","keyvalue","origin -11539 9138 10721",3.28);
	EntFire("stage_fire_temp","ForceSpawn","",3.30);
	EntFire("stage_fire_temp","keyvalue","origin -11533 9308 10721",3.32);
	EntFire("stage_fire_temp","ForceSpawn","",3.34);
	EntFire("stage_fire_temp","keyvalue","origin -10945 9997 10503",3.36);
	EntFire("stage_fire_temp","ForceSpawn","",3.38);
	EntFire("stage_fire_temp","keyvalue","origin -10685 9762 10468",3.40);
	EntFire("stage_fire_temp","ForceSpawn","",3.42);
	EntFire("stage_fire_temp","keyvalue","origin -10965 9032 10499",3.44);
	EntFire("stage_fire_temp","ForceSpawn","",3.46);
	EntFire("stage_fire_temp","keyvalue","origin -10566 9221 10462",3.48);
	EntFire("stage_fire_temp","ForceSpawn","",3.50);
	EntFire("stage_fire_temp","keyvalue","origin -10381 9689 10464",3.52);
	EntFire("stage_fire_temp","ForceSpawn","",3.54);
	EntFire("stage_fire_temp","keyvalue","origin -10972 8439 10496",3.56);
	EntFire("stage_fire_temp","ForceSpawn","",3.58);
	EntFire("stage_fire_temp","keyvalue","origin -12415 9220 10500",3.60);
	EntFire("stage_fire_temp","ForceSpawn","",3.62);
	EntFire("stage_fire_temp","keyvalue","origin -12462 8958 10500",3.64);
	EntFire("stage_fire_temp","ForceSpawn","",3.66);
	EntFire("stage_fire_temp","keyvalue","origin -12367 9490 10500",3.68);
	EntFire("stage_fire_temp","ForceSpawn","",3.70);
	EntFire("stage_fire_temp","keyvalue","origin -12846 9454 10500",3.72);
	EntFire("stage_fire_temp","ForceSpawn","",3.74);
	EntFire("stage_fire_temp","keyvalue","origin -12941 8961 10500",3.76);
	EntFire("stage_fire_temp","ForceSpawn","",3.78);
	EntFire("stage_fire_temp","keyvalue","origin -12645 9820 10308",3.80);
	EntFire("stage_fire_temp","ForceSpawn","",3.82);
	EntFire("stage_fire_temp","keyvalue","origin -12408 9828 10308",3.84);
	EntFire("stage_fire_temp","ForceSpawn","",3.86);
	EntFire("stage_fire_temp","keyvalue","origin -12388 10065 10308",3.88);
	EntFire("stage_fire_temp","ForceSpawn","",3.90);
	EntFire("stage_fire_temp","keyvalue","origin -12389 9590 10308",3.92);
	EntFire("stage_fire_temp","ForceSpawn","",3.94);
	EntFire("stage_fire_temp","keyvalue","origin -12161 9826 10308",3.96);
	EntFire("stage_fire_temp","ForceSpawn","",3.98);
	EntFire("stage_fire_temp","keyvalue","origin -12642 10062 10308",4.0);
	EntFire("stage_fire_temp","ForceSpawn","",4.02);
	EntFire("stage_fire_temp","keyvalue","origin -12901 9818 10308",4.04);
	EntFire("stage_fire_temp","ForceSpawn","",4.06);
	EntFire("stage_fire_temp","keyvalue","origin -12900 9588 10308",4.08);
	EntFire("stage_fire_temp","ForceSpawn","",4.10);
	EntFire("stage_fire_temp","keyvalue","origin -12897 10079 10308",4.12);
	EntFire("stage_fire_temp","ForceSpawn","",4.14);
	EntFire("stage_fire_temp","keyvalue","origin -13121 9831 10308",4.16);
	EntFire("stage_fire_temp","ForceSpawn","",4.18);
	EntFire("stage_fire_temp","keyvalue","origin -13143 9286 10500",4.20);
	EntFire("stage_fire_temp","ForceSpawn","",4.22);
	EntFire("stage_fire_temp","keyvalue","origin -13298 9739 10500",4.24);
	EntFire("stage_fire_temp","ForceSpawn","",4.26);
	EntFire("stage_fire_temp","keyvalue","origin -13302 8712 10500",4.28);
	EntFire("stage_fire_temp","ForceSpawn","",4.30);
	EntFire("stage_fire_temp","keyvalue","origin -14349 8706 10500",4.32);
	EntFire("stage_fire_temp","ForceSpawn","",4.34);
	EntFire("stage_fire_temp","keyvalue","origin -14345 9737 10500",4.36);
	EntFire("stage_fire_temp","ForceSpawn","",4.38);
}
//--------------第三关64单位火焰刷新
function stage3_fire()
{
	EntFire("stage_fire_temp","keyvalue","origin -10477 -599 1537",0);
	EntFire("stage_fire_temp","ForceSpawn","",0.02);
	EntFire("stage_fire_temp","keyvalue","origin -10314 -599 1537",0.04);
	EntFire("stage_fire_temp","ForceSpawn","",0.06);
	EntFire("stage_fire_temp","keyvalue","origin -10058 666 1542",0.08);
	EntFire("stage_fire_temp","ForceSpawn","",0.10);
	EntFire("stage_fire_temp","keyvalue","origin -10058 486 1542",0.12);
	EntFire("stage_fire_temp","ForceSpawn","",0.14);
	EntFire("stage_fire_temp","keyvalue","origin -9438 707 1787",0.16);
	EntFire("stage_fire_temp","ForceSpawn","",0.18);
	EntFire("stage_fire_temp","keyvalue","origin -9438 456 1787",0.20);
	EntFire("stage_fire_temp","ForceSpawn","",0.22);
	EntFire("stage_fire_temp","keyvalue","origin -4941 1389 1782",0.24);
	EntFire("stage_fire_temp","ForceSpawn","",0.26);
	EntFire("stage_fire_temp","keyvalue","origin -4725 1209 1782",0.28);
	EntFire("stage_fire_temp","ForceSpawn","",0.30);
	EntFire("stage_fire_temp","keyvalue","origin -3547 1274 1782",0.32);
	EntFire("stage_fire_temp","ForceSpawn","",0.34);
	EntFire("stage_fire_temp","keyvalue","origin -4929 -125 1782",0.36);
	EntFire("stage_fire_temp","ForceSpawn","",0.38);
	EntFire("stage_fire_temp","keyvalue","origin -4636 -70 1782",0.40);
	EntFire("stage_fire_temp","ForceSpawn","",0.42);
	EntFire("stage_fire_temp","keyvalue","origin -3542 -97 1782",0.44);
	EntFire("stage_fire_temp","ForceSpawn","",0.46);
}

//---------------------------------------------------------------------------------皮肤神器-虚空仲裁------------------------------------------------------------------------------------
var soul_shnum = 0
var soul_selfheal = 20
var soul_hp = 60
var soul_point = 0
var soul_reget = false
var soul_quanji_counter = 30
var soul_skill1num = 0
var soul_skill2num = 0
var soul_quanjimax = 30
var soul_quanjitime = 20
var soul_combo_delay = 0.3
var soul_maxhp = 30
var soul_quanjinum =2
var soul_maxpoint = 400

Instance.OnScriptInput("soul_noreget",() => {soul_reget = false})

Instance.OnScriptInput("soul_quanji",() => {_soul_quanji()})
function _soul_quanji(){
	soul_quanji_counter = -soul_quanjitime-1
	soul_reget = true
	EntFire("Seth_skin_soul_coreparti","Start","",0);
	EntFire("Seth_skin_soul_coreparti","Stop","",2);
	EntFire(self,"RunScriptInput","soul_noreget",soul_quanjitime+1)
	EntFire("Seth_skin_soul_callparti","Start","",0);
	EntFire("Seth_skin_soul_armparti*","Start","",1);
	EntFire("Seth_skin_soul_callparti","Stop","",3);
    EntFire("Seth_skin_soul_m","SetAnimationNoResetNotLooping","ani_summon",0);
	EntFire("Seth_skin_soul_quanji_zone","CountPlayersInZone","",1);
	_soul_mfade("fadein")
}

Instance.OnScriptInput("soul_shoupao",() => {_soul_shoupao()})
function _soul_shoupao(){
	if(soul_point <= 100){return}
	soul_point -= 100

	if(soul_quanji_counter > 0 ){
		EntFire("Seth_skin_soul_callparti","Start","",0);
		EntFire("Seth_skin_soul_callparti","Stop","",3);
		EntFire("Seth_skin_soul_coreparti","Start","",0);
		EntFire("Seth_skin_soul_coreparti","Stop","",2);
		_soul_mfade("fadein")
		}
	soul_quanji_counter = -soul_quanjitime-1

    EntFire("Seth_skin_soul_m","SetAnimationNoResetNotLooping","ani_stab",0);
	EntFire("Seth_skin_soul_quanji_zone","CountPlayersInZone","",1);
	EntFire("Seth_skin_soul_armparti*","Start","",1);

	EntFire("Seth_skin_soul_beambutton","Lock","",0);
	EntFire("Seth_skin_soul_beambutton","Unlock","",5);
    EntFire("Seth_skin_soul_beammaker","forcespawn","",0.5);
	EntFire("Seth_skin_soul_beambutton","Lock","",0);
	EntFire("Seth_skin_soul_beams1","StartSound","",0);
	EntFire("Seth_skin_soul_beams3","StartSound","",0);
	EntFire("Seth_skin_soul_beams2","StartSound","",0.5);
}

function soul_skill1(){
	soul_point -= 200
	if(soul_quanji_counter > 0 ){
		EntFire("Seth_skin_soul_callparti","Start","",0);
		EntFire("Seth_skin_soul_callparti","Stop","",3);
		EntFire("Seth_skin_soul_coreparti","Start","",0);
		EntFire("Seth_skin_soul_coreparti","Stop","",2);
		_soul_mfade("fadein")
		}
	soul_quanji_counter = -soul_quanjitime-1

    EntFire("Seth_skin_soul_m","SetAnimationNoResetNotLooping","ani_summon",0);
    EntFire("Seth_skin_soul_skill1_c","SetValue","1",1);
	EntFire("Seth_skin_soul_quanji_zone","CountPlayersInZone","",1);
	EntFire("Seth_skin_soul_skill1_s","startsound","",0);
	EntFire("Seth_skin_soul_armparti*","Start","",1);
	EntFire("Seth_skin_soul_skill1_p0","Start","",1);
	EntFire("Seth_skin_soul_skill1_p1","Start","",1);

    EntFire("Seth_skin_soul_skill1_c","SetValue","0",soul_quanjitime+1);
	EntFire("Seth_skin_soul_skill1_p0","Stop","",soul_quanjitime+1);
	EntFire("Seth_skin_soul_skill1_p1","Stop","",soul_quanjitime+1);
}

function soul_skill2(){
	soul_point -= soul_maxpoint
	if(soul_quanji_counter > 0 ){
		EntFire("Seth_skin_soul_callparti","Start","",0);
		EntFire("Seth_skin_soul_callparti","Stop","",3);
		EntFire("Seth_skin_soul_armparti*","Start","",1);
		_soul_mfade("fadein")
		}
	soul_quanji_counter = -soul_quanjitime-2

	EntFire("Seth_skin_soul_coreparti","Start","",0);
	EntFire("Seth_skin_soul_coreparti","Stop","",2);
    EntFire("Seth_skin_soul_m","SetAnimationNoResetNotLooping","ani_ult",0);
	EntFire("Seth_skin_soul_skill2_s","startsound","",0);
    EntFire("Seth_skin_newsfx_fall_maker0","forcespawn","",1.7);
	EntFire("Seth_skin_newsfx_fall_s2","StartSound","",2);
	EntFire("Seth_skin_newsfx_fall_s2","StartSound","",2.5);
	EntFire("Seth_skin_newsfx_fall_s2","StartSound","",3);
	EntFire("Seth_skin_soul_quanji_zone","CountPlayersInZone","",2);
}

Instance.OnScriptInput("soul_tick",() => {_soul_tick()})
function _soul_tick(){
	EntFire(self,"RunScriptInput","soul_tick",1)
	soul_quanji_counter++
	soul_shnum++
	soul_point++

	if(soul_shnum >= soul_selfheal){soul_hp++;if(soul_hp >= soul_maxhp){soul_hp = soul_maxhp};soul_shnum = 0}

	if(soul_point >= soul_maxpoint){soul_point = soul_maxpoint}

    if(soul_quanji_counter == 0){
		EntFire("Seth_skin_soul_armparti*","Stop","",0);
		EntFire("Seth_skin_soul_ui_quanji","Deactivate","0",0)
		EntFire("Seth_skin_soul_m","SetAnimationNoResetNotLooping","ani_umsummon",0);
		EntFire("Seth_skin_soul_callparti","Start","",2);
		EntFire("Seth_skin_soul_callparti","Stop","",5);
		EntFire(self,"RunScriptInput","soul_mfadeout",0.9);
		EntFire("Seth_skin_soul_calls2","StartSound","",1.1);
		EntFire("Seth_skin_soul_calls1","StartSound","",1.7);
	}
    else if(soul_quanji_counter < soul_quanjimax){
		EntFire("Seth_skin_soul_readyparti","Stop","",0);
		EntFire("Seth_skin_soul_ui_atk2compare","SetValue","0",0)
	}
	else if(soul_quanji_counter >= soul_quanjimax){
		soul_quanji_counter = soul_quanjimax
		EntFire("Seth_skin_soul_readyparti","Start","",0);
		EntFire("Seth_skin_soul_ui_atk2compare","SetValue","1",0)
	}

	let n = Math.abs(soul_quanji_counter)
	if(soul_quanji_counter > 0){n=0}
	let text = "Energy:"+soul_point.toString()+"|"+soul_maxpoint.toString()+"\nHP:"+Math.ceil(soul_hp).toString()+"|"+soul_maxhp.toString()+"\n2 R-clicks:Boxing|cost:0\nPress E:cannon|cost:100\nAADD:FlameFist|cost:200\nSAWD:EtherMeteor|cost:"+soul_maxpoint.toString()+"\nBoxingTime:"+n.toString()
	EntFire("Seth_skin_soul_text","SetMessage",text,0);
}

Instance.OnScriptInput("soul_getheal",() => {soul_hp++;if(soul_hp >= soul_maxhp){soul_hp = soul_maxhp}})
Instance.OnScriptInput("soul_getnuke",() => {soul_hp = Math.round(soul_hp/5)})
Instance.OnScriptInput("soul_gethurt",() => {_soul_gethurt()})
function _soul_gethurt(){
	if(skin == 3){return}
	soul_hp--
	if(soul_hp <= 0){
		EntFire("Seth_skin_soul_ui_quanji","Deactivate","",0)
		EntFire("Seth_skin_soul_ui","Deactivate","",0)
		EntFire("Seth_skin_soul_phy","Break","",0)
		EntFire("Seth_skin_soul_m","alpha","255",0);
		EntFire("Seth_skin_soul_m","ClearParent","",0);
		EntFire("Seth_skin_soul_m","SetAnimationNoResetNotLooping","ani_umsummon",0);
		EntFire("Seth_skin_soul_dead","StartSound","",1.6);
		EntFire("Seth_skin_soul_dead_s2","StartSound","",0);
		EntFire("Seth_skin_soul_callparti","Start","",2);
		EntFire("Seth_skin_soul_armparti2","Stop","",2);
		EntFire("Seth_skin_soul_armparti1","Stop","",2);
		EntFire("Seth_skin_soul_skill1_p1","Stop","",2);
		EntFire("Seth_skin_soul_skill1_p0","Stop","",2);
		EntFire("Seth_skin_soul_callparti","Stop","",5);
		EntFire(self,"RunScriptInput","soul_mfadeout",0.9);
		EntFire("Seth_skin_soul_*","Kill","",5)
		EntFire("seth_mech","SetHealth","-69",0.2)
	}else if(soul_hp >= soul_maxhp){soul_hp = soul_maxhp}
}

Instance.OnScriptInput("soul_getpoint",() => {_soul_getpoint()})
function _soul_getpoint(){if(soul_reget){soul_point += soul_quanjinum}}

Instance.OnScriptInput("soul_mfadein",() => {_soul_mfadein()})
function _soul_mfadein(){
	let z = 0
	for(let i=0;z < 255;i+=0.04) {
		EntFire("Seth_skin_soul_m","alpha",z.toString(),i);
		z += 5
	}
}
Instance.OnScriptInput("soul_mfadeout",() => {_soul_mfadeout()})
function _soul_mfadeout(){
	let n = 255
	for(let i=0;n >= 0;i+=0.04) {
		EntFire("Seth_skin_soul_m","alpha",n.toString(),i);
		n -= 5
	}
}

Instance.OnScriptInput("soul_w",() => {_soul_w()})
function _soul_w(){
	if(soul_skill2num == 2){soul_skill2num = 3;EntFire(self,"RunScriptInput","soul_reset23",soul_combo_delay);}
}

Instance.OnScriptInput("soul_a",() => {_soul_a()})
function _soul_a(){
	if(soul_skill1num == 0){soul_skill1num = 1;EntFire(self,"RunScriptInput","soul_reset1",soul_combo_delay);}
	else if(soul_skill1num == 1){soul_skill1num = 2;EntFire(self,"RunScriptInput","soul_reset2",soul_combo_delay);}
	
	if(soul_skill2num == 1){soul_skill2num = 2;EntFire(self,"RunScriptInput","soul_reset22",soul_combo_delay);}
}

Instance.OnScriptInput("soul_s",() => {_soul_s()})
function _soul_s(){
	if(soul_skill2num == 0){soul_skill2num = 1;EntFire(self,"RunScriptInput","soul_reset21",soul_combo_delay);}
}

Instance.OnScriptInput("soul_d",() => {_soul_d()})
function _soul_d(){
	if(soul_skill2num == 3 && soul_point >= soul_maxpoint){soul_skill2();soul_skill2num = 0}

	if(soul_skill1num == 2){soul_skill1num = 3;EntFire(self,"RunScriptInput","soul_reset3",soul_combo_delay);}
	else if(soul_skill1num == 3 && soul_point >= 200){soul_skill1();soul_skill1num = 0}
}

Instance.OnScriptInput("soul_reset1",() => {if(soul_skill1num == 1){soul_skill1num = 0}})
Instance.OnScriptInput("soul_reset2",() => {if(soul_skill1num == 2){soul_skill1num = 0}})
Instance.OnScriptInput("soul_reset3",() => {if(soul_skill1num == 3){soul_skill1num = 0}})
Instance.OnScriptInput("soul_reset21",() => {if(soul_skill2num == 1){soul_skill1num = 0}})
Instance.OnScriptInput("soul_reset22",() => {if(soul_skill2num == 2){soul_skill1num = 0}})
Instance.OnScriptInput("soul_reset23",() => {if(soul_skill2num == 3){soul_skill1num = 0}})
//------------------------------------------------------------------  黄 泉  ---------------------------------------------------------------------------------
var hq_cd = [1,30,60,90,-99999999999999999]
var hq_maxhp = 30
var hq_hp = 30
var hq_combo_delay = 0.3
var hq_s1_counter = 0
var hq_s1_cd = 0
var hq_s2_counter = 0
var hq_s2_cd = 0
var hq_s3_counter = 0
var hq_s3_cd = 0
var hq_s4_counter = 0
var hq_s4_cd = 0
var hq_s4_cd_max = 200
var hq_s4_atk_counter = 0
var hq_shnum = 0
var hq_selfheal = 20
var hq_snum = 0
var hq_sing = false
var skin = 1

Instance.OnScriptInput("hq_tick",() => {_hq_tick()})
function _hq_tick(){
	EntFire(self,"RunScriptInput","hq_tick",1)
	hq_s1_cd--;hq_s2_cd--;hq_s3_cd--;hq_shnum++;hq_snum--;
	if(hq_s1_cd <= 0){hq_s1_cd = 0;EntFire("hq_skill1_relay0","enable","",0);}
	if(hq_s2_cd <= 0){hq_s2_cd = 0;EntFire("hq_skill2_relay0","enable","",0);}
	if(hq_s3_cd <= 0){hq_s3_cd = 0;EntFire("hq_skill3_relay0","enable","",0);}
	if(hq_s4_cd >= 200){EntFire("hq_skill4_relay0","enable","",0);}

	if(hq_snum <= 0){hq_sing = false}

	if(hq_shnum >= hq_selfheal){hq_hp++;if(hq_hp >= hq_maxhp){hq_hp = hq_maxhp};hq_shnum = 0}
 
	let s4_text = hq_s4_cd.toString()+"|"+hq_s4_cd_max.toString()
	if(hq_s4_cd < 0){s4_text = "Invalid"}
	let text = "HP:"+hq_hp.toString()+"|"+hq_maxhp.toString()+"||Slashed Dream:"+s4_text+"\n2 R-clicks\nOctobolt-Flash:"+(hq_cd[1]-hq_s1_cd).toString()+"|"+hq_cd[1].toString()+"\nShift L-clicks\nTrilateral-Wiltcross:"+(hq_cd[2]-hq_s2_cd).toString()+"|"+hq_cd[2].toString()+"\nShift R-clicks\nQuadrivalent-Ascendance:"+(hq_cd[3]-hq_s3_cd).toString()+"|"+hq_cd[3].toString()
	EntFire("hq_text","SetMessage",text,0);
}

Instance.OnScriptInput("hq_getheal",() => {hq_hp ++;if(hq_hp >= hq_maxhp){hq_hp = hq_maxhp}})
Instance.OnScriptInput("hq_getnuke",() => {hq_hp = Math.round(hq_hp/5)})
Instance.OnScriptInput("hq_gethurt",() => {_hq_gethurt()})
function _hq_gethurt(){
	if(skin == 1){return}
	hq_hp--
	if(hq_hp <= 0){
		EntFire("hq_sound_voice","SetSoundEventName","music.die",0);
		EntFire("hq_sound_voice","StartSound","",0.02);
		EntFire("hq_ui","Deactivate","",0);
		EntFire("hq_hitbox","kill","",0);
		EntFire("hq_model","clearparent","",0);
		EntFire("hq_model","SetAnimationNoResetNotLooping","die",0);
		EntFire("hq_model","SetIdleAnimationNotLooping","die",0);
		EntFire("hq_user","SetHealth","-69",0.2)
	}else if(hq_hp >= hq_maxhp){hq_hp = hq_maxhp}
}

Instance.OnScriptInput("hq_getpoint_sub",() => {_hq_getpoint_sub()})
function _hq_getpoint_sub(){
	hq_s4_cd += 200
	if(hq_s4_cd >= hq_s4_cd_max){hq_s4_cd = hq_s4_cd_max}
}

Instance.OnScriptInput("hq_getpoint",() => {_hq_getpoint()})
function _hq_getpoint(){
	hq_s4_cd ++
	if(hq_s4_cd >= hq_s4_cd_max){hq_s4_cd = hq_s4_cd_max}
}

Instance.OnScriptInput("hq_reset0",() => {hq_s2_counter = 0;hq_s3_counter = 0;hq_s4_counter = 0})
Instance.OnScriptInput("hq_reset1",() => {hq_s1_counter = 0})
Instance.OnScriptInput("hq_reset2",() => {hq_s2_counter = 0})
Instance.OnScriptInput("hq_reset3",() => {hq_s3_counter = 0})
Instance.OnScriptInput("hq_reset4",() => {hq_s4_counter = 0})

Instance.OnScriptInput("hq_reset11",() => {if(hq_s1_counter == 1){hq_s1_counter = 0}})
Instance.OnScriptInput("hq_reset21",() => {if(hq_s2_counter == 1){hq_s2_counter = 0}})
Instance.OnScriptInput("hq_reset31",() => {if(hq_s3_counter == 1){hq_s2_counter = 0}})

Instance.OnScriptInput("hq_reset41",() => {if(hq_s4_counter == 1){hq_s4_counter = 0}})
Instance.OnScriptInput("hq_reset42",() => {if(hq_s4_counter == 2){hq_s4_counter = 0}})
Instance.OnScriptInput("hq_reset43",() => {if(hq_s4_counter == 3){hq_s4_counter = 0}})

Instance.OnScriptInput("hq_shift",() => {_hq_shift()})
function _hq_shift(){
	if(hq_sing){return}
	if(hq_s2_counter == 0 || hq_s3_counter == 0){
		hq_s2_counter = 1;
		hq_s3_counter = 1;
		EntFire(self,"RunScriptInput","hq_reset21",hq_combo_delay);
		EntFire(self,"RunScriptInput","hq_reset31",hq_combo_delay);
		EntFire(self,"RunScriptInput","hq_reset1",0);
		EntFire(self,"RunScriptInput","hq_reset4",0);
	}
}

Instance.OnScriptInput("hq_atk1",() => {_hq_atk1()})
function _hq_atk1(){
	if(hq_sing){return}
	if(hq_s2_counter == 1 && hq_s2_cd <= 0){
		EntFire(self,"RunScriptInput","hq_reset0",0);
		hq_s2_cd = hq_cd[2];
		EntFire("hq_skill2_relay0","trigger","",0);
	}
	else{
		EntFire(self,"RunScriptInput","hq_reset0",0);
		EntFire("hq_atk1_relay0","trigger","",0);
		EntFire("hq_atk1_relay0","disable","",0);
		EntFire("hq_atk1_relay0","enable","",hq_cd[0]);
	}
}

Instance.OnScriptInput("hq_atk2",() => {_hq_atk2()})
function _hq_atk2(){
	if(hq_sing){return}
	if(hq_s3_counter == 1 && hq_s3_cd <= 0){
		EntFire(self,"RunScriptInput","hq_reset0",0);
		hq_s3_cd = hq_cd[3];
		EntFire("hq_skill3_relay0","trigger","",0);
	}else if(hq_s1_counter == 0 ){hq_s1_counter = 1;EntFire(self,"RunScriptInput","hq_reset11",hq_combo_delay);}
	else if(hq_s1_counter == 1 && hq_s1_cd <= 0){
		EntFire(self,"RunScriptInput","hq_reset0",0);
		hq_s1_cd = hq_cd[1];
		EntFire("hq_skill1_relay0","trigger","",0);
	}
	else {EntFire(self,"RunScriptInput","hq_reset0",0);}
}

Instance.OnScriptInput("hq_a",() => {_hq_a()})
function _hq_a(){
	if(hq_sing){return}
	if(hq_s4_counter == 0){hq_s4_counter = 1;EntFire(self,"RunScriptInput","hq_reset41",hq_combo_delay);}
	else if(hq_s4_counter == 1){hq_s4_counter = 2;EntFire(self,"RunScriptInput","hq_reset42",hq_combo_delay);}
	else {EntFire(self,"RunScriptInput","hq_reset0",0);}
}

Instance.OnScriptInput("hq_d",() => {_hq_d()})
function _hq_d(){
	if(hq_sing){return}
	if(hq_s4_counter == 2 && hq_s4_cd >= 200){
		EntFire(self,"RunScriptInput","hq_reset0",0);
		EntFire("hq_skill4_comp","setvalue","1",0);
		EntFire("hq_skill4_comp","setvalue","0",hq_combo_delay);
	}
	else {EntFire(self,"RunScriptInput","hq_reset0",0);}
}

Instance.OnScriptInput("hq_nothing",() => {_hq_nothing()})
function _hq_nothing(){
	EntFire(self,"RunScriptInput","hq_reset0",0);
}
Instance.OnScriptInput("hq_s1",() => {_hq_s1()})
function _hq_s1(){
	hq_snum = 2
	hq_sing = true
	EntFire("hq_skill1_relay0","disable","",0);
	let z = 0
	EntFire("hq_user","keyvalue","speed 0",0);
	EntFire("hq_user","keyvalue","speed 1",2.1);
	EntFire("hq_model","alpha","0",0);
	EntFire("hq_skill1_hurt0","enable","",0);
	EntFire("hq_skill1_hurt0","kill","",2.8);
	EntFire("hq_skill1_hurt1","enable","",0.6);
	EntFire("hq_skill1_hurt1","kill","",1.6);
	EntFire("hq_skill1_hurt2","enable","",0.6);
	EntFire("hq_skill1_hurt2","kill","",1);
	EntFire("hq_skill1_mod1","SetAnimationNoResetLooping","atk2_slow",0.8);
	EntFire("hq_skill1_mod2","SetAnimationNoResetLooping","atk4_slow",1);
	EntFire("hq_skill1_m0","kill","",2.8);
	EntFire("hq_skill1_mod0","kill","",2.1);
	EntFire("hq_skill1_mod1","kill","",2.8);
	EntFire("hq_skill1_mod2","kill","",2.8);
	EntFire("hq_model","alpha","255",2.1);
	for(let i=0.6;z < 4000;i+=0.01) {
		EntFire("hq_skill1_m0","setscale",z.toString(),i);
		z += 80
	}

	let n = 255
	for(let i=1.1;n >= 0;i+=0.01) {
		EntFire("hq_skill1_m0","alpha",n.toString(),i);
		n -= 5
	}
	
	let x = 255
	for(let i=1.6;x >= 0;i+=0.01) {
		EntFire("hq_skill1_mod0","alpha",x.toString(),i);
		x -= 5
	}
	
	let m = 0
	for(let i=0.3;m < 200;i+=0.01) {
		EntFire("hq_skill1_mod1","alpha",m.toString(),i);
		m += 3
	}
	for(let i=2.3;m >= 0;i+=0.01) {
		EntFire("hq_skill1_mod1","alpha",m.toString(),i);
		m -= 3
	}

	let t = 0
	for(let i=0.5;t < 200;i+=0.01) {
		EntFire("hq_skill1_mod2","alpha",t.toString(),i);
		t += 3
	}
	for(let i=2.3;t >= 0;i+=0.01) {
		EntFire("hq_skill1_mod2","alpha",t.toString(),i);
		t -= 3
	}
	EntFire("hq_sound_weapon0","SetSoundEventName","ambient.hq_s1",0);
	EntFire("hq_sound_weapon0","StartSound","",0.02);
}

Instance.OnScriptInput("hq_s2",() => {_hq_s2()})
function _hq_s2(){
	hq_snum = 5
	hq_sing = true
	EntFire("hq_skill2_relay0","disable","",0);
	EntFire("hq_user","keyvalue","speed 0",0);
	EntFire("hq_user","keyvalue","speed 1",4.5);
	EntFire("hq_model","alpha","0",0);
	EntFire("hq_skill2_hurt1","enable","",0.6);
	EntFire("hq_skill2_hurt0","kill","",4);
	EntFire("hq_skill2_hurt1","addoutput","OnHurtPlayer>!activator>keyvalue>movetype 0>0>0",3.5);
	EntFire("hq_skill2_hurt1","addoutput","OnHurtPlayer>!activator>keyvalue>movetype 2>3>0",3.5);
	EntFire("hq_skill2_hurt1","kill","",4);
	EntFire("hq_skill2_mod0","SetAnimationNoResetLooping","atk2_slow",0.6);
	EntFire("hq_skill2_mod0","SetAnimationNoResetLooping","atk3_slow",0.9);
	EntFire("hq_skill2_mod0","SetAnimationNoResetLooping","atk4_slow",1.2);
	EntFire("hq_skill2_mod0","SetAnimationNoResetLooping","atk2_slow",1.5);
	EntFire("hq_skill2_mod0","SetAnimationNoResetLooping","atk3_slow",1.8);
	EntFire("hq_skill2_mod0","SetAnimationNoResetLooping","atk4_slow",2.1);
	EntFire("hq_skill2_mod0","SetAnimationNoResetLooping","atk2_skill",2.4);

	EntFire("hq_sound_voice","SetSoundEventName","ambient.hq_s2_v",0);
	EntFire("hq_sound_voice","StartSound","",0.02);
	EntFire("hq_sound_weapon0","SetSoundEventName","ambient.hq_atk1",0);
	EntFire("hq_sound_weapon0","StartSound","",0.02);
	EntFire("hq_sound_weapon0","SetSoundEventName","ambient.hq_atk4",0.6);
	EntFire("hq_sound_weapon0","StartSound","",0.62);
	EntFire("hq_sound_weapon0","SetSoundEventName","ambient.hq_atk2",0.9);
	EntFire("hq_sound_weapon0","StartSound","",0.92);
	EntFire("hq_sound_weapon0","SetSoundEventName","ambient.hq_atk3",1.2);
	EntFire("hq_sound_weapon0","StartSound","",1.22);
	EntFire("hq_sound_weapon0","SetSoundEventName","ambient.hq_atk4",1.5);
	EntFire("hq_sound_weapon0","StartSound","",1.52);
	EntFire("hq_sound_weapon0","SetSoundEventName","ambient.hq_atk1",1.8);
	EntFire("hq_sound_weapon0","StartSound","",1.82);
	EntFire("hq_sound_weapon0","SetSoundEventName","ambient.hq_atk3",2.1);
	EntFire("hq_sound_weapon0","StartSound","",2.12);
	EntFire("hq_sound_weapon0","SetSoundEventName","ambient.hq_atk4",2.4);
	EntFire("hq_sound_weapon0","StartSound","",2.42);

	EntFire("hq_skill2_mod0","kill","",5.4);
	EntFire("hq_model","alpha","255",5.4);

	let n = 0
	for(let i=4.5;n < 255;i+=0.01) {
		EntFire("hq_model","alpha",n.toString(),i);
		n += 3
	}

	let m = 255
	for(let i=4.5;m >= 0;i+=0.01) {
		EntFire("hq_skill2_mod0","alpha",m.toString(),i);
		m -= 3
	}
}

Instance.OnScriptInput("hq_s3",() => {_hq_s3()})
function _hq_s3(){
	hq_snum = 4
	hq_sing = true
	EntFire("hq_skill3_relay0","disable","",0);
	EntFire("hq_user","keyvalue","speed 0",0);
	EntFire("hq_user","keyvalue","speed 1",4);
	EntFire("hq_model","alpha","0",0);
	EntFire("hq_skill3_hurt0","enable","",0.4);
	EntFire("hq_skill3_mod1","SetAnimationNoResetLooping","atk2_slow",0.6);
	EntFire("hq_skill3_mod1","alpha","200",0.6);
	EntFire("hq_skill3_mod1","alpha","0",1.6);
	EntFire("hq_skill3_mod2","SetAnimationNoResetLooping","atk3_slow",1);
	EntFire("hq_skill3_mod2","alpha","200",1);
	EntFire("hq_skill3_mod2","alpha","0",2);
	EntFire("hq_skill3_mod3","SetAnimationNoResetLooping","atk4_slow",1.2);
	EntFire("hq_skill3_mod3","alpha","200",1.2);
	EntFire("hq_skill3_mod3","alpha","0",2.2);
	EntFire("hq_skill3_mod4","SetAnimationNoResetLooping","atk1_slow",0.8);
	EntFire("hq_skill3_mod4","alpha","200",0.8);
	EntFire("hq_skill3_mod4","alpha","0",1.8);
	EntFire("hq_skill3_hurt1","enable","",5);
	EntFire("hq_skill3_push0","enable","",3);
	EntFire("hq_skill3_par0","start","",3);
	EntFire("hq_skill3_push0","kill","",5.5);
	EntFire("hq_skill3_hurt0","kill","",3);
	EntFire("hq_skill3_hurt1","kill","",6);
	EntFire("hq_skill3_m0","kill","",5.5);
	EntFire("hq_skill3_mod*","kill","",4);
	EntFire("hq_model","alpha","255",4);
	let z = 0
	for(let i=3;z < 800;i+=0.01) {
		EntFire("hq_skill3_m0","setscale",z.toString(),i);
		z += 80
	}
	for(let i=3.1;z > 640;i+=0.02) {
		EntFire("hq_skill3_m0","setscale",z.toString(),i);
		z -= 1.6
	}
	for(let i=5.1;z >= 0;i+=0.01) {
		EntFire("hq_skill3_m0","setscale",z.toString(),i);
		z -= 56
	}

	let m = 255
	for(let i=0.15;m >= 0;i+=0.01) {
		EntFire("hq_skill3_mod0","alpha",m.toString(),i);
		m -= 10
	}
	for(let i=1;m < 255;i+=0.01) {
		EntFire("hq_skill3_mod0","alpha",m.toString(),i);
		m += 5
	}

	EntFire("hq_sound_voice","SetSoundEventName","ambient.hq_s3_v",0);
	EntFire("hq_sound_voice","StartSound","",0.02);
	EntFire("hq_sound_weapon0","SetSoundEventName","ambient.hq_s3",0);
	EntFire("hq_sound_weapon0","StartSound","",0.02);
}

Instance.OnScriptInput("hq_s4",() => {_hq_s4()})
function _hq_s4(){
	hq_snum = 5
	hq_sing = true
	hq_s4_cd = hq_cd[4]
	EntFire("hq_skill4_hurt0","SetDamage","1000",0);//-------------------------------黄泉前4刀伤害/对半计算--------------------------------------
	EntFire("hq_skill4_relay0","disable","",0);
	EntFire("hq_skill4_par0","start","",0);
	EntFire("hq_skill4_par0","stop","",1);
	EntFire("hq_skill4_mod0","SetAnimationNoResetLooping","ult_1",1.6);
	EntFire("hq_skill4_mod0","SetAnimationNoResetLooping","ult_ready",2.4);
	EntFire("sky_space","disable","",1);
	EntFire("sky_space_red","enable","",1);
	EntFire("hq_skill4_tele0","enable","",1);
	EntFire("hq_skill4_post0","enable","",1);
	EntFire("hq_skill4_view0","enablecameraall","",1);
	EntFire("hq_skill4_camera_base","keyvalue","angles -7 180 0",1);
	EntFire("hq_skill4_camera_m0","setspeed","150",1);
	EntFire("hq_skill4_camera_m0","open","",1);
	EntFire("hq_skill4_camera_m0","setspeed","0",2);
	EntFire("hq_skill4_camera","clearparent","",2);
	EntFire("hq_skill4_camera_m0","setspeed","10000000",2);
	EntFire("hq_skill4_camera_m0","setposition","0",2);
	EntFire("hq_skill4_camera_base","keyvalue","origin -13460.875 -13424. 10626.28125",2.1);
	EntFire("hq_skill4_camera_base","keyvalue","angles -1 280 0",2.1);
	EntFire("hq_skill4_camera","setparent","hq_skill4_camera_m0",2.2);
	let n = 0
	for(let i=4.5;n < 255;i+=0.01) {
		EntFire("hq_model","alpha",n.toString(),i);
		n += 3
	}

	let m = 255
	for(let i=4.5;m >= 0;i+=0.01) {
		EntFire("hq_skill2_mod0","alpha",m.toString(),i);
		m -= 3
	}
	EntFire("hq_sound_voice","SetSoundEventName","music.hq_s4_v",0);
	EntFire("hq_sound_voice","StartSound","",0.02);
}

Instance.OnScriptInput("hq_s4_reset",() => {hq_s4_atk_counter = 0})
Instance.OnScriptInput("hq_s4_auto",() => {hq_s4_atk_counter = 2})
Instance.OnScriptInput("hq_s4_atk",() => {_hq_s4_atk()})
function _hq_s4_atk(){
	if(hq_s4_atk_counter != 3){
	switch(hq_s4_atk_counter){
		case 0:
			EntFire("hq_skill4_hurt0","enable","",0.3);
			EntFire("hq_skill4_hurt0","disable","",0.5);
			EntFire("hq_sound_skill4_1","StartSound","",0);
			EntFire("hq_skill4_ui_relay0","disable","",0);
			EntFire("hq_skill4_ui_relay0","enable","",1);
			
			hq_s4_atk_counter = 1
			EntFire("hq_skill4_post1","enable","",0.3);
			EntFire("hq_skill4_post1","disable","",0.7);
			EntFire("hq_skill4_mod0","SetAnimationNoResetLooping","ult1",0);
			EntFire("hq_skill4_par1","stop","",0);
			EntFire("hq_skill4_mod0","SetAnimationNoResetLooping","ult1_loop",0.9);
			EntFire("hq_skill4_camera_m0","setspeed","1500",0.3);
			EntFire("hq_skill4_camera_m0","setposition","0.023",0.3);
			EntFire("hq_skill4_camera","keyvalue","angles 0 5 20",0.3);
			EntFire("hq_skill4_camera","clearparent","",0.8);
			EntFire("hq_skill4_camera_m0","setspeed","9999999",0.8);
			EntFire("hq_skill4_camera_m0","setposition","0",0.8);
			EntFire("hq_skill4_camera","setparent","hq_skill4_camera_m0",0.9);
			EntFire("hq_skill4_camera_base","keyvalue","origin -13420.978516 -13650.446289 10630.294922",0.8);
			EntFire("hq_skill4_camera_base","keyvalue","angles -48 75 0",0.8);
			break;
		case 1:
			EntFire("hq_skill4_hurt0","enable","",0.7);
			EntFire("hq_skill4_hurt0","disable","",0.9);
			EntFire("hq_sound_skill4_2","StartSound","",0);
			EntFire("hq_skill4_ui_relay0","disable","",0);
			EntFire("hq_skill4_ui_relay0","enable","",1.5);

			hq_s4_atk_counter = 2
			EntFire("hq_skill4_par5","stop","",0);
			EntFire("hq_skill4_par8","start","",0);
			EntFire("hq_skill4_post1","enable","",0.7);
			EntFire("hq_skill4_post1","disable","",1.1);
			EntFire("hq_skill4_mod0","SetAnimationNoResetLooping","ult2",0);
			EntFire("hq_skill4_mod0","SetAnimationNoResetLooping","ult2_loop",1);
			EntFire("hq_skill4_camera_m0","setspeed","2700",0.7);
			EntFire("hq_skill4_camera_m0","setposition","0.05",0.7);
			EntFire("hq_skill4_camera","keyvalue","angles 45 350 0",0.7);
			EntFire("hq_skill4_camera","clearparent","",1);
			EntFire("hq_skill4_camera_m0","setspeed","99999999",1);
			EntFire("hq_skill4_camera_m0","setposition","0",1);
			EntFire("hq_skill4_camera_base","keyvalue","origin -13334.351562 -13327.300781 11001.830078",1.1);
			EntFire("hq_skill4_camera_base","keyvalue","angles 52 8 0",1.1);
			EntFire("hq_skill4_camera","setparent","hq_skill4_camera_m0",1.2);
			break;
		case 2:
			EntFire("hq_skill4_hurt0","enable","",0);
			EntFire("hq_skill4_hurt0","disable","",0.2);
			EntFire("hq_skill4_hurt0","enable","",1.6);
			EntFire("hq_skill4_hurt0","disable","",1.8);
			EntFire("hq_skill4_hurt0","SetDamage","120000",5.5);//-------------------------------黄泉最后一刀伤害/对半计算--------------------------------------
			EntFire("hq_skill4_hurt0","enable","",6.1);
			EntFire("hq_skill4_hurt0","disable","",6.3);
			EntFire("hq_sound_skill4_3","StartSound","",0);
			EntFire("hq_sound_voice","SetSoundEventName","music.hq_s4_v2",0.9);
			EntFire("hq_sound_voice","StartSound","",0.92);

			hq_s4_atk_counter = 3
			EntFire("hq_skill4_ui","Deactivate","",0);
			EntFire("hq_skill4_relay1","CancelPending","",0);
			EntFire("hq_skill4_par8","stop","",0);
			EntFire("hq_skill4_post1","enable","",0.07);
			EntFire("hq_skill4_post1","disable","",0.37);
			EntFire("hq_skill4_mod0","SetAnimationNoResetLooping","ult3",0);
			EntFire("hq_skill4_camera_m0","setspeed","2700",0);
			EntFire("hq_skill4_camera_m0","setposition","0.05",0);
			EntFire("hq_skill4_camera","keyvalue","angles -3 353 0",0.05);
			EntFire("hq_skill4_camera","keyvalue","origin -13029.523438 -13284.502930 10607.862305",0.17);

			EntFire("hq_skill4_mod0","SetAnimationNoResetLooping","ult_end",0.17);
			EntFire("hq_skill4_camera","clearparent","",0.6);
			EntFire("hq_skill4_camera_m0","setspeed","99999999",0.65);
			EntFire("hq_skill4_camera_m0","setposition","0",0.65);
			EntFire("hq_skill4_camera_base","keyvalue","origin -12908 -13351 10624",0.65);
			EntFire("hq_skill4_camera_base","keyvalue","angles 0 174 0",0.65);
			EntFire("hq_skill4_camera","keyvalue","origin -12908 -13351 10624",0.9);
			EntFire("hq_skill4_camera","keyvalue","angles 0 174 0",0.9);
			EntFire("hq_skill4_camera","setparent","hq_skill4_camera_m0",0.9);
			EntFire("hq_skill4_camera_m0","setspeed","72",0.9);
			EntFire("hq_skill4_camera_m0","setposition","0.003",0.9);
			EntFire("hq_skill4_camera_m0","setposition","0",1.25);
			EntFire("hq_skill4_camera_base","keyvalue","origin -13490 -13198 10576",1.55);
			EntFire("hq_skill4_move0","open","",1);
			EntFire("hq_skill4_camera","keyvalue","angles 0 345 10",1.6);
			EntFire("hq_skill4_par9","start","",1.8);
			EntFire("hq_skill4_par2","start","",1.55);
			EntFire("hq_skill4_par4","start","",1.55);
			EntFire("hq_skill4_camera_base","keyvalue","angles 0 160 0",1.55);
			EntFire("hq_skill4_camera_m0","setspeed","300",1.55);
			EntFire("hq_skill4_camera_m0","setposition","0.01",1.55);
			
			for(let i = 3.8;i < 4.8;i+=0.01){
				let n = 10+Rand(-10,10)
				EntFire("hq_skill4_camera","keyvalue","angles 0 345 "+n.toString(),i);
			}
			EntFire("hq_skill4_camera","keyvalue","angles 0 345 10",4.82);
			EntFire("hq_skill4_sky_dy*","SetAnimationNoResetNotLooping","break1",1.87);
			EntFire("hq_skill4_sky_dy*","SetAnimationNoResetNotLooping","break1_loop",2.34);
			EntFire("hq_skill4_par7","start","",3.27);
			EntFire("hq_skill4_post3","enable","",3.97);
			EntFire("hq_skill4_post3","disable","",4.47);
			EntFire("hq_skill4_sky_dy*","SetAnimationNoResetNotLooping","break2",4);
			EntFire("hq_skill4_sky_dy1","alpha","255",3.27);
			EntFire("hq_skill4_post2","enable","",2.4);
			EntFire("hq_skill4_post2","disable","",4.47);
			EntFire("hq_skill4_water","kill","",4.47);
			EntFire("hq_skill4_sky_dy1","alpha","0",4.47);
			EntFire("hq_skill4_sky_dy0","alpha","0",4.47);
			EntFire("hq_skill4_mod0","SetAnimationNoResetLooping","ult_end_loop",4.8);
			
			EntFire("hq_skill4_hurt0","SetDamage","15000",7);
			EntFire("hq_model","Skin","3",5.5);
			EntFire("hq_atk1_relay1","kill","",5.5);
			EntFire("hq_skill4_tele0","disable","",5.5);
			EntFire("hq_skill4_tele1","enable","",6.3);
			EntFire("hq_skill4_tele1","disable","",6.7);
			EntFire("hq_skill4_fade","fade","",5.5);
			EntFire("hq_skill4_zone_timer0","disable","",5.7);
			EntFire("hq_sound_skill4_0","StopSound","",4);
			EntFire("hq_sound_skill4_1","StopSound","",6);
			EntFire("hq_sound_skill4_2","StopSound","",6);
			EntFire("hq_sound_skill4_3","StopSound","",10);
			EntFire(self,"RunScriptInput","hq_s4_reset",6);
			EntFire("hq_skill4_fade2","fade","",6);
			EntFire("hq_skill4_par2","stop","",6);
			EntFire("hq_skill4_par4","stop","",6);
			EntFire("hq_skill4_par7","stop","",6);
			EntFire("hq_skill4_par9","stop","",6);
			EntFire("hq_skill4_par1","start","",6);
			EntFire("hq_skill4_par5","start","",6);
			EntFire("hq_skill4_par8","start","",6);
			EntFire("sky_space","enable","",6);
			EntFire("sky_space_red","disable","",6);
			EntFire("hq_skill4_sky_b0","kill","",6);
			EntFire("hq_skill4_move0","kill","",6);
			EntFire("hq_skill4_post0","disable","",6);
			EntFire("hq_skill4_mod0","kill","",6);
			EntFire("hq_skill4_sky_dy0","kill","",6);
			EntFire("hq_skill4_sky_dy1","kill","",6);
			EntFire("hq_skill4_view0","disablecameraall","",6);
			EntFire("hq_skill4_camera","clearparent","",6);

			EntFire("hq_skill4_camera_m0","setspeed","99999999",6.2);
			EntFire("hq_skill4_camera_m0","setposition","0",6.2);
			EntFire("hq_skill4_camera_base","keyvalue","origin -13312 -13424 10608",6.2);
			EntFire("hq_skill4_camera_base","keyvalue","angles 0 0 0",6.2);
			EntFire("hq_skill4_camera","keyvalue","angles 0 180 0",6.4);
			EntFire("hq_skill4_camera","keyvalue","origin -13312 -13424 10608",6.2);
			EntFire("hq_skill4_camera","setparent","hq_skill4_camera_m0",6.3);
			break;
		}
	}
}
//----------------------------------------------------------------------hina-----------------------------------------------------------------------------------------
var hina_cd = [3,300]
var hina_atk_cd = 0
var hina_ult_cd = 0
var hina_hp = 16
var hina_maxhp = 16

Instance.OnScriptInput("hina_tick",() => {_hina_tick()})
function _hina_tick(){
	EntFire(self,"RunScriptInput","hina_tick",1);
	hina_ult_cd--;hina_atk_cd--;
	if(hina_atk_cd <= 0 ){hina_atk_cd = 0;EntFire("hina_atk_relay","Enable","",0)}
	if(hina_ult_cd <= 0 ){hina_ult_cd = 0;EntFire("hina_ult_relay","Enable","",0)}
	
	let text = "HP:"+hina_hp.toString()+"|"+hina_maxhp.toString()+"\nFinale Melody:"+(hina_cd[1]-hina_ult_cd).toString()+"|"+hina_cd[1].toString()
	EntFire("hina_text","SetMessage",text,0);
}

Instance.OnScriptInput("hina_ult",() => {_hina_ult()})
function _hina_ult(){
	hina_ult_cd = 300
	hina_atk_cd = 5
	let n = Rand(1,3)
	EntFire("hina_s_ult"+n.toString(),"StartSound","",0);
	EntFire("hina_model","SetAnimationNoResetNotLooping","alt_attack",0);
	EntFire("hina_ult_relay","disable","",0)
	EntFire("hina_atk_relay","disable","",0)
	EntFire("hina_ult_hurt0","enable","",0)
	EntFire("hina_ult_hurt0","disable","",5)
	EntFire("hina_user","keyvalue","speed 0.7",0)
	EntFire("hina_user","keyvalue","speed 1",5)
}

Instance.OnScriptInput("hina_atk",() => {_hina_atk()})
function _hina_atk(){
	hina_atk_cd = 3
	EntFire("hina_model","SetAnimationNoResetNotLooping","attack1",0);
	EntFire("hina_atk_relay","disable","",0)
	EntFire("hina_atk_push","enable","",0)
	EntFire("hina_atk_push","disable","",0.5)
}

Instance.OnScriptInput("hina_gethurt",() => {_hina_gethurt()})
function _hina_gethurt(){
	hina_hp--
	if(hina_hp <= 0){
		EntFire("hina_die_relay","trigger","",0);
	}
}

//------------------------------------------------------------------  星 见 雅  ---------------------------------------------------------------------------------
var xjy_cd = [30,75,90,100,10]
var xjy_cd_num = [0,0,0,100,10]
var xjy_hp = 30
var xjy_maxhp = xjy_hp
var xjy_selfheal = 20
var xjy_combo_delay = 0.3
var xjy_shnum = 0
var xjy_snum = 0
var xjy_sing = false
var xjy_atk_combo_num = 1
var xjy_atking = false
var xjy_atk_cp = 1
var xjy_s_counter = 0

Instance.OnScriptInput("xjy_zanzhu",() => {xjy_cd_num = [0,0,0,100,10]})

Instance.OnScriptInput("xjy_act11",() => {xjy_snum = 4.2;xjy_cd_num[3]-=xjy_cd[0];xjy_cd_num[4]+=2})
Instance.OnScriptInput("xjy_act12",() => {xjy_snum = 3.4;xjy_cd_num[3]-=xjy_cd[1];xjy_cd_num[4]+=5})
Instance.OnScriptInput("xjy_act2",() => {xjy_snum = 3;xjy_cd_num[2]=xjy_cd[2];xjy_cd_num[4]+=2})
Instance.OnScriptInput("xjy_act3",() => {xjy_snum = 4.6;xjy_cd_num[4]=0})

Instance.OnScriptInput("xjy_tick",() => {_xjy_tick()})
function _xjy_tick(){
	EntFire(self,"RunScriptInput","xjy_tick",0.1)
	xjy_cd_num[0]-=0.1;xjy_cd_num[1]-=0.1;xjy_cd_num[2]-=0.1;xjy_shnum+=0.1;xjy_snum-=0.1;
	if(xjy_cd_num[3] >= xjy_cd[0] && xjy_cd_num[3] < xjy_cd[1]){xjy_cd_num[0] = 0;EntFire("xjy_s1_relay0","enable","",0);EntFire("xjy_s1_relay1","disable","",0);}else{EntFire("xjy_s1_relay0","disable","",0);}
	if(xjy_cd_num[3] >= xjy_cd[1]){xjy_cd_num[1] = 0;EntFire("xjy_s1_relay1","enable","",0);EntFire("xjy_s1_relay0","disable","",0);}else{EntFire("xjy_s1_relay1","disable","",0);}
	if(xjy_cd_num[2] <= 0){xjy_cd_num[2] = 0;EntFire("xjy_s2_relay0","enable","",0);}else{EntFire("xjy_s2_relay0","disable","",0);}
	if(xjy_cd_num[4] >= xjy_cd[4]){xjy_cd_num[4] = xjy_cd[4];EntFire("xjy_s3_relay0","enable","",0);}else{EntFire("xjy_s3_relay0","disable","",0);}

	if(xjy_snum <= 0){xjy_sing = false}else{
		xjy_sing = true;
		EntFire("xjy_s1_relay0","disable","",0);
		EntFire("xjy_s1_relay1","disable","",0);
		EntFire("xjy_s2_relay0","disable","",0);
		EntFire("xjy_s3_relay0","disable","",0);
	}

	if(xjy_shnum >= xjy_selfheal){xjy_hp ++;if(xjy_hp >= xjy_maxhp){xjy_hp = xjy_maxhp};xjy_shnum = 0}

	let text = "HP:"+Math.ceil(xjy_hp)+"|"+xjy_maxhp+"\nShift + L-c:"+Math.ceil(xjy_cd_num[3])+"|"+xjy_cd[3]+"\nShift + R-c:"+Math.ceil(xjy_cd[2]-xjy_cd_num[2])+"|"+xjy_cd[2]+"\nAADD:"+Math.ceil(xjy_cd_num[4])+"|"+xjy_cd[4]+"\nWW/SS:Dash"
	EntFire("xjy_text","SetMessage",text,0);
}

Instance.OnScriptInput("xjy_getheal",() => {xjy_hp ++;if(xjy_hp >= xjy_maxhp){xjy_hp = xjy_maxhp}})
Instance.OnScriptInput("xjy_getnuke",() => {xjy_hp = Math.round(xjy_hp/5)})
Instance.OnScriptInput("xjy_gethurt",() => {_xjy_gethurt()})
function _xjy_gethurt(){
	if(skin == 2){return}
	xjy_hp--

	if(xjy_hp <= 0){
		EntFire("xjy_sound_voice","SetSoundEventName","music.die",0);
		EntFire("xjy_sound_voice","StartSound","",0.02);
		EntFire("xjy_ui","Deactivate","",0);
		EntFire("xjy_hitbox","kill","",0);
		EntFire("xjy_model","clearparent","",0);
		EntFire("xjy_model","SetAnimationNoResetNotLooping","die",0);
		EntFire("xjy_model","SetIdleAnimationNotLooping","die",0);
		EntFire("xjy_model","fireuser1","",0.1);
		EntFire("xjy_user","SetHealth","-69",0.2)
	}else if(xjy_hp >= xjy_maxhp){xjy_hp = xjy_maxhp}
}

Instance.OnScriptInput("xjy_getpoint_sub",() => {_xjy_getpoint_sub()})
function _xjy_getpoint_sub(){
	xjy_cd_num[3] += 100
	if(xjy_cd_num[3] >= xjy_cd[3]){xjy_cd_num[3] = xjy_cd[3]}
}

Instance.OnScriptInput("xjy_getpoint",() => {_xjy_getpoint()})
function _xjy_getpoint(){
	xjy_cd_num[3] ++
	if(xjy_cd_num[3] >= xjy_cd[3]){xjy_cd_num[3] = xjy_cd[3]}
}

Instance.OnScriptInput("xjy_reset0",() => {xjy_s_counter = 0})
Instance.OnScriptInput("xjy_reset1",() => {if(xjy_s_counter == 1){xjy_s_counter = 0}})
Instance.OnScriptInput("xjy_reset2",() => {if(xjy_s_counter == 2){xjy_s_counter = 0}})

Instance.OnScriptInput("xjy_a",() => {_xjy_a()})
function _xjy_a(){
	if(xjy_sing){return}
	if(xjy_s_counter == 0){xjy_s_counter = 1;EntFire(self,"RunScriptInput","xjy_reset1",xjy_combo_delay)}
	else if(xjy_s_counter == 1){xjy_s_counter = 2;EntFire(self,"RunScriptInput","xjy_reset2",xjy_combo_delay)}
	else {EntFire(self,"RunScriptInput","xjy_reset0",0);}
}

Instance.OnScriptInput("xjy_d",() => {_xjy_d()})
function _xjy_d(){
	if(xjy_sing){return}
	if(xjy_s_counter == 2 && xjy_cd_num[4] >= xjy_cd[4]){
		print("s3-3")
		EntFire(self,"RunScriptInput","xjy_rese0t",0);
		EntFire("xjy_s3_comp0","setvalue","1",0);
		EntFire("xjy_s3_comp0","setvalue","0",xjy_combo_delay);
	}
	else {EntFire(self,"RunScriptInput","xjy_reset0",0);}
}

Instance.OnScriptInput("xjy_nothing",() => {_xjy_nothing()})
function _xjy_nothing(){
	EntFire(self,"RunScriptInput","xjy_reset0",0);
}

Instance.OnScriptInput("xjy_atk_cp1",() => {xjy_atk_cp=2})
Instance.OnScriptInput("xjy_atk_cp2",() => {xjy_atk_cp=3})
Instance.OnScriptInput("xjy_atk_cp3",() => {xjy_atk_cp=4})
Instance.OnScriptInput("xjy_atk_cp4",() => {xjy_atk_cp=5})
Instance.OnScriptInput("xjy_atk_cpend1",() => {if(xjy_atk_cp==xjy_atk_combo_num&&xjy_atk_combo_num-1==1){xjy_atk_cp=-1}})
Instance.OnScriptInput("xjy_atk_cpend2",() => {if(xjy_atk_cp==xjy_atk_combo_num&&xjy_atk_combo_num-1==2){xjy_atk_cp=-1}})
Instance.OnScriptInput("xjy_atk_cpend3",() => {if(xjy_atk_cp==xjy_atk_combo_num&&xjy_atk_combo_num-1==3){xjy_atk_cp=-1}})
Instance.OnScriptInput("xjy_atk_cpend4",() => {if(xjy_atk_cp==xjy_atk_combo_num&&xjy_atk_combo_num-1==4){xjy_atk_cp=-1}})
	
Instance.OnScriptInput("xjy_atk_reset",() => {xjy_atk_combo_num=1;xjy_atk_cp=1})

Instance.OnScriptInput("xjy_atk0",() => {xjy_atking = false})
Instance.OnScriptInput("xjy_atk1",() => {xjy_atking = true})

Instance.OnScriptInput("xjy_atk_check",() => {_xjy_atk_check()})
function _xjy_atk_check(){
	if(xjy_hp <= 0){return}
	EntFire(self,"RunScriptInput","xjy_atk_check",0.02)
	if(xjy_atking  && !xjy_sing && xjy_atk_cp > 0){
		xjy_atk_cp = 0
		switch(xjy_atk_combo_num){
			case 1:
				EntFire("xjy_model","SetAnimationnotLooping","a1",0.05)
				EntFire(self,"RunScriptInput","xjy_atk_cp1",0.35)
				EntFire(self,"RunScriptInput","xjy_atk_cpend1",0.95)
				EntFire("xjy_atk1_push0","enable","",0.1)
				EntFire("xjy_atk1_push0","disable","",0.4)
				xjy_atk_combo_num ++
				break;
			case 2:
				EntFire("xjy_model","SetAnimationnotLooping","a2",0.05)
				EntFire(self,"RunScriptInput","xjy_atk_cp2",0.35)
				EntFire(self,"RunScriptInput","xjy_atk_cpend2",0.95)
				EntFire("xjy_atk1_push0","enable","",0.1)
				EntFire("xjy_atk1_push0","disable","",0.4)
				xjy_atk_combo_num ++
				break;
			case 3:
				EntFire("xjy_model","SetAnimationnotLooping","a3",0.05)
				EntFire(self,"RunScriptInput","xjy_atk_cp3",0.55)
				EntFire(self,"RunScriptInput","xjy_atk_cpend3",1.15)
				EntFire("xjy_atk1_push2","enable","",0.1)
				EntFire("xjy_atk1_push2","disable","",0.4)
				xjy_atk_combo_num ++
				break;
			case 4:
				EntFire("xjy_model","SetAnimationnotLooping","a4",0.05)
				EntFire(self,"RunScriptInput","xjy_atk_cp4",0.75)
				EntFire(self,"RunScriptInput","xjy_atk_cpend4",1.35)
				EntFire("xjy_atk1_push1","enable","",0.1)
				EntFire("xjy_atk1_push1","disable","",0.8)
				xjy_atk_combo_num ++
				break;
			case 5:
				EntFire("xjy_model","SetAnimationnotLooping","a5",0.05)
				EntFire("xjy_atk1_push2","enable","",0.1)
				EntFire("xjy_atk1_push2","disable","",1.5)
				xjy_atk_combo_num ++
				break;
		}
	}else if(!xjy_atking && xjy_atk_cp == -1){
		xjy_atk_combo_num = 7
		xjy_atk_cp = 0
		EntFire(self,"RunScriptInput","xjy_atk_reset",2.5)
		EntFire("xjy_user","keyvalues","speed 0.1",0)
		EntFire("xjy_user","keyvalues","speed 1",2)
	}else if(xjy_atk_combo_num == 6){
		xjy_atk_combo_num = 7
		xjy_atk_cp = 0
		EntFire(self,"RunScriptInput","xjy_atk_reset",2.5)
		EntFire("xjy_user","keyvalues","speed 0.1",0.5)
		EntFire("xjy_user","keyvalues","speed 1",2.5)
	}
	print(xjy_atk_cp+"|"+xjy_atk_combo_num)
}
