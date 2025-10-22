import { Instance } from "cs_script/point_script";

var self = "script"
//------------------------------------------------------- function by 7ychu5 --------------------------------------------------------------

function print(a) {Instance.Msg(a);}

function EntFire(targetname,key,value="",delay=0) {Instance.EntFireAtName(targetname,key,value,delay)}

function Rand(min, max) {return Math.floor(Math.random() * (max - min + 1) ) + min;}

function GetDistance3D(v1,v2) {return Math.sqrt((v1[0]-v2[0])*(v1[0]-v2[0]) + (v1[1]-v2[1])*(v1[1]-v2[1]) + (v1[2]-v2[2])*(v1[2]-v2[2]))}

//------------------------------------------------------- function by lopb ----------------------------------------------------------------------------------------------------

function _cmd(context,num){EntFire("cmd","command","say "+context.toString(),Number(num))}

function origininbox(ent,x,y,z,a,b,c){let origin = ent.GetOrigin().toString().split(",");if( Number(origin[0]) < Number(x)+Number(a)/2 && Number(origin[0]) >= Number(x)-Number(a)/2 && Number(origin[1]) < Number(y)+Number(b)/2 && Number(origin[1]) >= Number(y)-Number(b)/2 && Number(origin[2]) < Number(z)+Number(c)/2 && Number(origin[2]) >= Number(z)-Number(c)/2 ){return true}}

function origininsphere(ent,x,y,z,length){let origin = ent.GetOrigin().toString().split(",");if( GetDistance3D([Number(x),Number(y),Number(z)],origin) <= Number(length) ){return true}}

Instance.OnScriptInput("wai_tp",() => {_wai_tp()});function _wai_tp(){EntFire("item_random_maker","keyvalue","EntityTemplate wai_tp_5_t",0);let n = Rand(1,2);if(n==1){EntFire("item_random_maker","keyvalue","origin 7488 13436 70",0.05);EntFire("item_random_maker","forcespawn","",0.1);EntFire("luoli_weapon","addoutput","onplayerpickup>!activator>keyvalue>origin 7098 13374 141>0>1",0);}else{EntFire("item_random_maker","keyvalue","origin -1091.27 13461 -471",0.05);EntFire("item_random_maker","forcespawn","",0.1);EntFire("luoli_weapon","addoutput","onplayerpickup>!activator>keyvalue>origin -2244 11872 -320>0>1",0);}}

//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Instance.OnScriptInput("reset",() => {_reset()})
function _reset(){
    //EntFire("kaishi_bgm","disable","",1);
    boss_stage = 1
    fognum = 2000
    duanqiaonum = 0
    boss_hp_per_els = 604
    boss_hp_per_end = 300
    boss_hp = 800//boss_hp
    boss_hitable = true
    boss_ghp = 800
    humans = 0
    erjieduan = false
    fogfade = true
    exhuman = 0
    exvote = 0
    boss_alive = false
    skill4num = 0
    excontext = 0
    shuijing = 1
    hina_cd = [3,300]
    hina_atk_cd = 0
    hina_ult_cd = 0
    hina_hp = 16
    hina_maxhp = 16
    if(exmod){
        EntFire("ex_vote_text","SetMessage","EX模式开启",0);
        EntFire("ex_relay1","enable","",0);
        EntFire("map_brush","runscriptcode","ex = true;",0);
    }
}

var boss_stage = 1
var fognum = 2000//fog
var duanqiaonum = 0//duanqiao
var boss_hp_per_els = 604
var boss_hp_per_end = 300
var boss_hp = 800//boss_hp
var boss_hitable = true
var boss_ghp = 800
var humans = 0
var erjieduan = false
var fogfade = true
var exhuman = 0
var exvote = 0
var boss_alive = false;
var skill4num = 0
var excontext = 0
var shuijing = 1
var exmod = false

Instance.OnScriptInput("gethuman",() => {exhuman+=1})
Instance.OnScriptInput("getexvote",() => {if(exmod){return}else{exvote++;print("测试");EntFire("ex_vote_text","SetMessage","vote:"+exvote.toString(),0);}})
Instance.OnScriptInput("extest",() => {_extest()})
function _extest(){
    if(exvote >= exhuman*0.4 || exmod ){
        exmod = true;
        EntFire("ex_relay1","enable","",0);
        EntFire("map_brush","runscriptcode","ex = true;",0);
    }
}

Instance.OnScriptInput("exbutton",(ent) => {_exbutton(ent)})
function _exbutton(ent){
    excontext ++
    if(ent.activator.GetTeamNumber() == 3){EntFire(ent.caller.GetEntityName(),"KillHierarchy","",0)}
    if(excontext != 4){_cmd("找到隐藏的净化水晶!",0)}
        else if(excontext == 4){_cmd("净化水晶已准备就绪!",0);EntFire("ex_end_branch","SetValue","1",0);}
}


Instance.OnScriptInput("togglebosshit",() => {boss_hitable = !boss_hitable})
Instance.OnScriptInput("resethumans",() => {humans=0})
Instance.OnScriptInput("togglefog",() => {fogfade = !fogfade})
Instance.OnScriptInput("fog",() => {_fog()})
function _fog(){
    if(fogfade){
        fognum -= 1.4
        if(fognum < 400){fognum = 400}
        EntFire("slicoo_fog","SetFogEndDistance",fognum.toString(),0);
        EntFire("slicoo_fog","SetFogStartDistance",(fognum*2/15).toString(),0);
    }
    EntFire(self,"RunScriptInput","fog",1);
}

Instance.OnScriptInput("telefogin",() => {_telefogin()})
function _telefogin(){
    EntFire(self,"RunScriptInput","togglefog",0);
    let n = 0
    let i = 1
    EntFire("els_s_telefog","startsound","",0);
    for(i=fognum+1;i>=2;n+=0.01){
        i -= fognum/100
        EntFire("slicoo_fog","SetFogEndDistance",i.toString(),n);
        EntFire("slicoo_fog","SetFogStartDistance",(i*2/15).toString(),n);
        EntFire("slicoo_fog","setfogmaxopacity",(1-0.05*i/fognum).toString(),n);
    }
    n += 0.5
    for(i=0;i<6000;n+=0.01){
        i += 60
        EntFire("slicoo_fog","SetFogEndDistance",i.toString(),n);
        EntFire("slicoo_fog","SetFogStartDistance",(i*2/15).toString(),n);
        EntFire("slicoo_fog","setfogmaxopacity",(1-0.3*i/6000).toString(),n);
    }
}

Instance.OnScriptInput("telefogout",() => {_telefogout()})
function _telefogout(){
    EntFire(self,"RunScriptInput","togglefog",0);
    let n = 0
    let i = 1
    EntFire("els_s_telefog","startsound","",0);
    for(i=6001;i>=2;n+=0.01){
        i -= 60
        EntFire("slicoo_fog","SetFogEndDistance",i.toString(),n);
        EntFire("slicoo_fog","SetFogStartDistance",(i*2/15).toString(),n);
        EntFire("slicoo_fog","setfogmaxopacity",(1-0.3*i/6000).toString(),n);
    }
    n += 0.5
    for(i=0;i<fognum;n+=0.01){
        i += fognum/100
        EntFire("slicoo_fog","SetFogEndDistance",i.toString(),n);
        EntFire("slicoo_fog","SetFogStartDistance",(i*2/15).toString(),n);
        EntFire("slicoo_fog","setfogmaxopacity",(1-0.05*i/fognum).toString(),n);
    }
}

Instance.OnScriptInput("duanqiao",() => {_duanqiao()})
function _duanqiao(){
    duanqiaonum ++
    if(duanqiaonum == 12){_cmd("桥梁即将断裂!!!",0)}
    else if(duanqiaonum > 15){
    EntFire("duanqiao_break","break","",0);
    EntFire("duanqiao_trigger","disable","",0);
    }
}

Instance.OnScriptInput("human_count",() => {_human_count()})
function _human_count(){
    humans ++;
    boss_alive = true;
    if(boss_stage == 1){
        boss_ghp = humans*boss_hp_per_els+1200;
        boss_hp = humans*boss_hp_per_els+1200
        }
    else if(boss_stage == 2){
        boss_ghp = humans*boss_hp_per_end+200;
        boss_hp = humans*boss_hp_per_end+200
    }
}

Instance.OnScriptInput("hitend",() => {_hitend()})
function _hitend(){
    if(boss_hitable){boss_hp --}
    //print(boss_hp)
    let n = (boss_hp/boss_ghp)/0.95
    EntFire("ex_end_hp_par0","setalphascale",n.toString(),0);
    if(boss_hp <= 0){
        boss_hitable = !boss_hitable
        EntFire("ex_end_model","fireuser1","",0);
    }
}

Instance.OnScriptInput("killels",() => {boss_hp = 5})

Instance.OnScriptInput("hitels",() => {_hitels()})
function _hitels(){
    if(boss_hitable && boss_alive){boss_hp --}
    print(boss_hp)
    if(boss_alive){
        if(boss_hp == Math.floor(boss_ghp*0.8)){
            EntFire("ex_els_hp_dy0_p","start","",0);
            EntFire("els_s_hp","StartSound","",0);
            EntFire("ex_els_hp_dy0","KillHierarchy","",0.3);
        }else if(boss_hp == Math.floor(boss_ghp*0.6)){
            EntFire("ex_els_hp_dy1_p","start","",0);
            EntFire("els_s_hp","StartSound","",0);
            EntFire("ex_els_hp_dy1","KillHierarchy","",0.3);
        }else if(boss_hp == Math.floor(boss_ghp*0.4)){
            EntFire("ex_els_hp_dy2_p","start","",0);
            EntFire("els_s_hp","StartSound","",0);
            EntFire("ex_els_hp_dy2","KillHierarchy","",0.3);
        }else if(boss_hp == Math.floor(boss_ghp*0.2)){
            EntFire("ex_els_hp_dy3_p","start","",0);
            EntFire("els_s_hp","StartSound","",0);
            EntFire("ex_els_hp_dy3","KillHierarchy","",0.3);
        }else if(boss_hp <= 0){
            EntFire("ex_els_hp_dy4_p","start","",0);
            EntFire("els_s_hp","StartSound","",0);
            EntFire("ex_els_hp_dy4","KillHierarchy","",0.3);
            EntFire("els_die_test","SetValue","2",0);
            boss_hitable = !boss_hitable
            boss_stage = 2
            boss_alive = false
        }
    }
    if(boss_hp <= boss_ghp/2 && !erjieduan){
        erjieduan = true
        boss_hitable = false
        EntFire("els_die_test","SetValue","1",0);
    }
}

Instance.OnScriptInput("elsfadein",() => {_elsfadein()})
function _elsfadein(){
    let n = 0
    for(let i=0;i<=255;i++){
        EntFire("els_model","alpha",i.toString(),n);
        n += 0.01
    }
}

Instance.OnScriptInput("elsfadeout",() => {_elsfadeout()})
function _elsfadeout(){
    let n = 0
    for(let i=255;i>=0;i--){
        EntFire("els_model","alpha",i.toString(),n);
        n += 0.01
    }
}

Instance.OnScriptInput("endfadein",() => {_endfadein()})
function _endfadein(){
    let n = 0
    for(let i=0;i<=255;i++){
        EntFire("ex_end_model","alpha",i.toString(),n);
        n += 0.01
    }
}

Instance.OnScriptInput("endfadeout",() => {_endfadeout()})
function _endfadeout(){
    let n = 0
    for(let i=255;i>=0;i--){
        EntFire("ex_end_model","alpha",i.toString(),n);
        n += 0.01
    }
}
Instance.OnScriptInput("els_skill1",() => {_els_skill1()})
function _els_skill1(){
    let x = Rand(-5446,-5086);
    let y = Rand(-7540,-7180);
    let pit = Rand(0,360);
    let yaw = Rand(-8,8);
    let angles = "angles " + yaw + " " + pit + " 0";
    EntFire("els_skill1_maker0","keyvalue",angles,0);
    EntFire("els_skill1_maker0","keyvalue","origin "+x.toString()+" "+ y.toString()+" -10480",0);
    EntFire("els_skill1_maker0","forcespawn","",0.03);
}

Instance.OnScriptInput("els_skill2",() => {_els_skill2()})
function _els_skill2(){
    let x = Rand(-6108,-4424);
    let y = Rand(-8202,-6518);
    EntFire("els_skill2_maker0","keyvalue","origin "+x.toString()+" "+ y.toString()+" -8750",0);
    EntFire("els_skill2_maker0","forcespawn","",0.03);
}

Instance.OnScriptInput("els_skill3",() => {_els_skill3()})
function _els_skill3(){
    let pit = Rand(0,360);
    let yaw = Rand(10,85);
    let angles = "angles " + yaw + " " + pit + " 0";
    let pit1 = Rand(0,360);
    let yaw1 = Rand(10,85);
    let angles1 = "angles " + yaw1 + " " + pit1 + " 0";
    EntFire("els_skill3_maker0","keyvalue",angles,0);
    EntFire("els_skill3_maker0","keyvalue","origin -5536 -7296 -10112",0);
    EntFire("els_skill3_maker0","forcespawn","",0.02);
    EntFire("els_skill3_maker1","keyvalue",angles1,0);
    EntFire("els_skill3_maker1","keyvalue","origin -5536 -7296 -10112",0);
    EntFire("els_skill3_maker1","forcespawn","",0.02);
}

Instance.OnScriptInput("els_skill4",() => {_els_skill4()})
function _els_skill4(){
    let x = -5266+Rand(-500,500);
    let y = -7360+Rand(-500,500);
    let pit = Rand(0,360);
    let angles = "angles 0 " + pit + " 0";
    EntFire("els_skill4_maker0","keyvalue",angles,0);
    EntFire("els_skill4_maker0","keyvalue","origin "+x.toString()+" "+ y.toString()+" -10528",0);
    EntFire("els_skill4_maker0","forcespawn","",0.03);
}

Instance.OnScriptInput("els_skill4_ring",() => {_els_skill4_ring()})
function _els_skill4_ring(){
    skill4num++
    EntFire("els_skill4_hurt0","keyvalue","targetname els_skill4_hurt"+skill4num.toString(),0.02);
    let i = 1
    let n = 0.04
    for(;i<110;n+=0.02){
        EntFire("els_skill4_hurt0","setscale",i.toString(),n);
        i += 0.5
    }
    EntFire("els_skill4_hurt0","KillHierarchy","",n+0.1);
}

Instance.OnScriptInput("els_skill5",() => {_els_skill5()})
function _els_skill5(){
    let x = Rand(-5866,-4666);
    let y = Rand(-7960,-6760);
    EntFire("els_skill5_maker0","keyvalue","origin "+x.toString()+" "+ y.toString()+" -10528",0);
    EntFire("els_skill5_maker0","forcespawn","",0.03);
}

Instance.OnScriptInput("end_skill1",() => {_end_skill1()})
function _end_skill1(){
    let x = Rand(7296,8752);
    let y = Rand(3376,5616);
    EntFire("ex_end_skill1_maker0","keyvalue","origin "+x.toString()+" "+ y.toString()+" 9300",0);
    EntFire("ex_end_skill1_maker0","forcespawn","",0.03);
}
Instance.OnScriptInput("tianqian",(ent) => {_tianqian(ent)})
function _tianqian(ent){
	let v = ent.caller.GetAbsOrigin()
	let y = Rand(0,360)
	EntFire("drg2_maker","keyvalue","origin "+v.x+" "+v.y+" "+v.z,0)
	EntFire("drg2_maker","keyvalue","angles 0 "+y+" 0",0)
	EntFire("drg2_maker","ForceSpawn","",0)
	if(exmod) {
	EntFire("drg2_hurt","SetDamage","42",0.05)
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
    EntFire("hina_user","keyvalue","speed 0.5",0)
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
    hina_hp --
    if(hina_hp <= 0){
        EntFire("hina_die_relay","trigger","",0);
    }
}