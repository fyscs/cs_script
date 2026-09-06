import { Instance } from "cs_script/point_script";

// ==========================================
// Configuration
// ==========================================
const ADD_HEALTH_AMOUNT = 5; 
const HIT_EVERY_BLADE_AMOUNT = 15; 

// ==========================================
// Variables & State
// ==========================================
let fan_hp = [5, 10, 15, 20, 25, 30, 50];
let blade_is_dead = [false, false, false, false, false, false, false]; 
let started = false;
let fan_speed = 800;
let blades_dead = 0;
let max_fan_hp = 155; 

// ==========================================
// Core Functions
// ==========================================

function get_total_hp() {
    let sum = 0;
    for (let i = 0; i < fan_hp.length; i++) {
        sum += fan_hp[i];
    }
    return sum;
}

function update_hp_display() {
    let fan_sum_hp = get_total_hp();
    
    const percent = max_fan_hp > 0 ? Math.round((fan_sum_hp / max_fan_hp) * 100) : 0;
    
    let activeId = 5; 
    
    if (percent > 80) activeId = 5;       
    else if (percent > 60) activeId = 4;       
    else if (percent > 40) activeId = 3;       
    else if (percent > 20) activeId = 2;       
    else activeId = 1;

    const valueStr = `${percent}%\n${fan_sum_hp} HP`;

    for (let i = 1; i <= 5; i++) {
        Instance.EntFireAtName({ name: `fan_text_${i}`, input: "Disable" });
    }

    Instance.EntFireAtName({ name: `fan_text_${activeId}`, input: "Enable" });
    Instance.EntFireAtName({ name: `fan_text_${activeId}`, input: "SetMessage", value: valueStr });

    if (fan_sum_hp <= 0 && started) {
        Instance.EntFireAtName({ name: "fan_dead", input: "Trigger" });
        
        for (let i = 1; i <= 5; i++) {
            Instance.EntFireAtName({ name: `fan_text_${i}`, input: "Disable" });
        }
    }
}

function hit(id) {
    if (!started) return;
    if (blade_is_dead[id]) return; 

    fan_hp[id]--;
    
    if (fan_hp[id] <= 0) {
        fan_hp[id] = 0;
        blade_is_dead[id] = true;
        blades_dead++;
        
        Instance.EntFireAtName({ name: `fan_blade${id}`, input: "FireUser1" });
        Instance.EntFireAtName({ name: `fan_blade_dead${blades_dead}`, input: "Trigger" });
    }

    update_hp_display();
}

function hit_every_blade() {
    if (HIT_EVERY_BLADE_AMOUNT > 0) {
        for (let i = 0; i < HIT_EVERY_BLADE_AMOUNT; i++) {
            for (let j = 0; j < fan_hp.length; j++) {
                hit(j);
            }
        }
    }
}

function add_health() {
    for (let i = 0; i < fan_hp.length; i++) {
        let added_hp = (i + 1) * ADD_HEALTH_AMOUNT;
        fan_hp[i] += added_hp;
        max_fan_hp += added_hp; 
    }
    
    if (started) update_hp_display(); 
}

function set_speed(speed) {
    Instance.EntFireAtName({ name: "fan_rotating", input: "SetSpeed", value: speed.toString() });
}

function reduce_speed(speed) {
    fan_speed -= speed;
    set_speed(fan_speed);
}

function reset() {
    fan_hp = [5, 10, 15, 20, 25, 30, 50];
    blade_is_dead = [false, false, false, false, false, false, false];
    fan_speed = 800;
    blades_dead = 0;
    max_fan_hp = get_total_hp(); 
    started = false;
}

Instance.OnRoundStart(() => {
    reset();
});

Instance.OnActivate(() => {
    reset();
});

function start() {
    started = true;
    set_speed(fan_speed);
    update_hp_display(); 
}

// ==========================================
// CS2 Inputs
// ==========================================

Instance.OnScriptInput("start", start);
Instance.OnScriptInput("add_health", add_health);
Instance.OnScriptInput("hit_every_blade", hit_every_blade);

for (let i = 0; i < 7; i++) {
    Instance.OnScriptInput(`hit(${i})`, () => hit(i));
}

for (let i = 1; i <= 100; i++) {
    Instance.OnScriptInput(`reduce_speed(${i})`, () => reduce_speed(i));
}