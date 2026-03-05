import { Instance } from "cs_script/point_script";

function find(name) { return Instance.FindEntityByName(name); }

function fire(name = "", input = "", val = "", delay = 0, caller, activator) {
    Instance.EntFireAtName({ name, input, value: val, caller, activator, delay });
}

function fireT(target, input = "", val = "", delay = 0, caller, activator) {
    Instance.EntFireAtTarget({ target, input, value: val, caller, activator, delay });
}

function print(text) { Instance.Msg(text); }

Instance.OnScriptInput("qinli_w0_out", ({}) => {
    for(let i = 0;i.toFixed(2)<=0.3;i+=0.01){
        fire("qinli_dy0","setrenderattribute","a_weapon0 = "+(0.3-i)/0.3,i)
    }
})

Instance.OnScriptInput("qinli_w0_in", ({}) => {
    for(let i = 0.3;i.toFixed(2)>=0;i-=0.01){
        fire("qinli_dy0","setrenderattribute","a_weapon0 = "+i/0.3,i)
    }
})

Instance.OnScriptInput("qinli_g0_out", ({}) => {
    for(let i = 0;i.toFixed(2)<=0.3;i+=0.01){
        fire("qinli_dy0","setrenderattribute","a_gun0 = "+(0.3-i)/0.3,i)
    }
})

Instance.OnScriptInput("qinli_g0_in", ({}) => {
    for(let i = 0.3;i.toFixed(2)>=0;i-=0.01){
        fire("qinli_dy0","setrenderattribute","a_gun0 = "+i/0.3,i)
    }
})

var qinliDead = false

var qinli_hp = 20;
var qinli_hp_max = 20;

var qinli_s1_cd = 0;
var qinli_s2_cd = 0;

var energy = 0;
var energy_max = 240;
var energy_cost = 80;
var qinli_s3_cd = 0;
var energy_regen = 1;

var last_time = Instance.GetGameTime();

function qinli_hurt() {
    qinli_hp = qinli_hp - 1;
    if (qinli_hp <= 0) {
        qinliDead = true
        fire("qinli_dead_relay0","trigger")
    }
}

function update(dt) {
    if (qinliDead) return;

    if (qinli_s1_cd > 0) {
        qinli_s1_cd = qinli_s1_cd - dt;
        if (qinli_s1_cd < 0) qinli_s1_cd = 0;
    }
    
    if (qinli_s2_cd > 0) {
        qinli_s2_cd = qinli_s2_cd - dt;
        if (qinli_s2_cd < 0) qinli_s2_cd = 0;
    }
    
    if (qinli_s3_cd > 0) {
        qinli_s3_cd = qinli_s3_cd - dt;
        if (qinli_s3_cd < 0) qinli_s3_cd = 0;
    }
    
    energy = energy + (energy_regen * dt);
    if (energy > energy_max) energy = energy_max;
    let text ="生命值:"+qinli_hp+"\nshift+左键:"+(30-qinli_s2_cd)+"|30\nshift+右键:"+energy.toFixed(1)+"|"+energy_max
    fire("qinli_text","SetMessage",text)
}

function think() {    
    if (qinliDead) {
        return;
    }
    var now = Instance.GetGameTime();
    var dt = now - last_time;
    last_time = now;
    
    update(dt);
    
    Instance.SetNextThink(now + 0.1);
}

function qinli_s1() {
    if (qinli_s1_cd > 0) {
        return;
    }
    fire("qinli_atk_relay0","trigger")
    qinli_s1_cd = 3;
}

function qinli_s2() {
    if (qinli_s2_cd > 0) {
        return;
    }
    fire("qinli_s1_relay0","trigger")
    qinli_s2_cd = 30;
}

function qinli_s3() {
    if (qinli_s3_cd > 0) {return;}
    
    if (energy < energy_cost) {return;}
    
    fire("qinli_s2_relay0","trigger")
    qinli_s3_cd = 2;
    energy = energy - energy_cost;
}

function zm_danmu(activator){
    activator.SetEntityName("danmu_user")
    if(activator.GetEntityName() === "danmu_user"){
        find("danmu_temp0").ForceSpawn( activator.GetEyePosition() , activator.GetEyeAngles() )
    }
}

Instance.OnScriptInput("qinli_atk", function(inputData) {
    qinli_s1();
});

Instance.OnScriptInput("qinli_s1", function(inputData) {
    qinli_s2();
});

Instance.OnScriptInput("qinli_s2", function(inputData) {
    qinli_s3();
});

Instance.OnScriptInput("zm_danmu", function({activator}) {
    zm_danmu(activator);
});

Instance.OnScriptInput("qinli_s2_hurt", function({activator}) {
    if(activator.GetEntityName() === "kuangsan_user"){
        activator.TakeDamage({damage:150000});
    }else if(activator.GetEntityName() === "danmu_user"){
        activator.TakeDamage({damage:150000});
    }
    else{fireT(activator,"sethealth","-1")}
});

Instance.OnScriptInput("qinli_damage", function(inputData) {
    qinli_hurt();
});


Instance.OnScriptInput("chongzhi", function(inputData) {
 qinliDead = false;
Instance.SetThink(think);
Instance.SetNextThink(Instance.GetGameTime() + 0.1);
 qinli_hp = 20;
 qinli_hp_max = 20;

 qinli_s1_cd = 0;
 qinli_s2_cd = 0;

 energy = 0;
 energy_max = 240;
 energy_cost = 80;
 qinli_s3_cd = 0;
 energy_regen = 1;

 last_time = Instance.GetGameTime();;
});
Instance.OnScriptInput("setmodelks", ({activator}) => {
    activator.SetModel("characters/models/kurumi/kurumi.vmdl")

})
