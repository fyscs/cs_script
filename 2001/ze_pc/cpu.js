import { Instance } from "cs_script/point_script";

// ==========================================
// Configuration
// ==========================================
const START_HEALTH = 500;        
const ADD_HEALTH_AMOUNT = 500;   
const DECODE_TIME = 10;          
const EXECUTE_TIME = 10;         

// ==========================================
// Variables & State
// ==========================================
let A = [0, 0, 0, 0, 0, 0, 0, 0];
let B = [0, 0, 0, 0, 0, 0, 0, 0];
let O = [0, 0, 0, 0, 0, 0, 0, 0];
let OP = [0, 0];
let OPCODE = "ADD";

let A_DEC = 0;
let B_DEC = 0;

let STATE = "DECODING";

let decode_phase_time = DECODE_TIME;
let execute_phase_time = EXECUTE_TIME;

let health = START_HEALTH;
let maxHealth = START_HEALTH;
let started = false;
let dead = false;

// ==========================================
// Math & Evaluation
// ==========================================

function evaluate_opcode() {
    if (OP[0] === 0 && OP[1] === 0) OPCODE = "ADD";
    else if (OP[0] === 0 && OP[1] === 1) OPCODE = "MUL";
    else if (OP[0] === 1 && OP[1] === 0) OPCODE = "DIV";
    else if (OP[0] === 1 && OP[1] === 1) OPCODE = "SUB";
}

function evaluate() {
    let sum_a = 0;
    let sum_b = 0;
    
    for (let i = 0; i < 8; i++) {
        sum_a += A[i] * Math.pow(2, i);
        sum_b += B[i] * Math.pow(2, i);
    }

    A_DEC = sum_a;
    B_DEC = sum_b;

    let result = 0;

    switch (OPCODE) {
        case "ADD": 
            result = sum_a + sum_b; 
            break;
        case "SUB": 
            result = sum_a - sum_b; 
            break;
        case "MUL": 
            result = sum_a * sum_b; 
            break;
        case "DIV": 
            result = sum_b !== 0 ? Math.floor(sum_a / sum_b) : 0; 
            break;
    }

    result = ((result % 256) + 256) % 256;

    let temp_result = result;
    for (let i = 7; i >= 0; i--) {
        if (temp_result / Math.pow(2, i) >= 1) {
            temp_result -= Math.pow(2, i);
            O[i] = 1;
        } else {
            O[i] = 0;
        }
    }

    for (let i = 0; i < 2; i++) {
        if (OP[i] === 0) {
            Instance.EntFireAtName({ name: "cpu_in_door_OP" + i, input: "FireUser2" });
        } else {
            Instance.EntFireAtName({ name: "cpu_in_door_OP" + i, input: "FireUser1" });
        }
    }

    for (let i = 0; i < 8; i++) {
        if (O[i] === 0) Instance.EntFireAtName({ name: "cpu_in_door_O" + i, input: "FireUser2" });
        else Instance.EntFireAtName({ name: "cpu_in_door_O" + i, input: "FireUser1" });

        if (A[i] === 0) Instance.EntFireAtName({ name: "cpu_in_door_A" + i, input: "FireUser2" });
        else Instance.EntFireAtName({ name: "cpu_in_door_A" + i, input: "FireUser1" });

        if (B[i] === 0) Instance.EntFireAtName({ name: "cpu_in_door_B" + i, input: "FireUser2" });
        else Instance.EntFireAtName({ name: "cpu_in_door_B" + i, input: "FireUser1" });
    }
}

// ==========================================
// HP Display Logic
// ==========================================
function update_hp() {
    const percent = maxHealth > 0 ? Math.round((health / maxHealth) * 100) : 0;
    let activeId = 5; 
    
    if (percent > 80) activeId = 5;       
    else if (percent > 60) activeId = 4;       
    else if (percent > 40) activeId = 3;       
    else if (percent > 20) activeId = 2;       
    else activeId = 1;       

    const valueStr = `${health} HP | ${percent}%`;

    for (let i = 1; i <= 5; i++) {
        Instance.EntFireAtName({ name: `cpu_hp_text_${i}`, input: "Disable" });
    }

    Instance.EntFireAtName({ name: `cpu_hp_text_${activeId}`, input: "Enable" });
    Instance.EntFireAtName({ name: `cpu_hp_text_${activeId}`, input: "SetMessage", value: valueStr });
}

// ==========================================
// CS2 Inputs
// ==========================================

for (let wire = 0; wire < 2; wire++) {
    for (let i = 0; i < 8; i++) {
        for (let val = 0; val < 2; val++) {
            let func = () => {
                if (STATE !== "DECODING") return;
                if (wire === 0) A[i] = val;
                else B[i] = val;
                evaluate();
            };
            Instance.OnScriptInput(`set_in(${wire}, ${i}, ${val})`, func);
        }
    }
}

for (let i = 0; i < 2; i++) {
    for (let val = 0; val < 2; val++) {
        let func = () => {
            if (STATE !== "DECODING") return;
            OP[i] = val;
            evaluate_opcode();
            evaluate(); 
        };
        Instance.OnScriptInput(`set_op(${i}, ${val})`, func);
    }
}

let reset_func = () => {
    A = [0, 0, 0, 0, 0, 0, 0, 0];
    B = [0, 0, 0, 0, 0, 0, 0, 0];
    O = [0, 0, 0, 0, 0, 0, 0, 0];
    OP = [0, 0];
    OPCODE = "ADD";
    A_DEC = 0; 
    B_DEC = 0;
    STATE = "DECODING";
    decode_phase_time = DECODE_TIME;
    execute_phase_time = EXECUTE_TIME;
    health = START_HEALTH;
    maxHealth = START_HEALTH; 
    dead = false;
    started = false;
};

Instance.OnRoundStart(() => {
    reset_func();
});

Instance.OnActivate(() => {
    reset_func();
});

let start_func = () => {
    started = true;
    Instance.SetNextThink(Instance.GetGameTime() + 1.0);
    update_hp();
};
Instance.OnScriptInput("start", start_func);

let hit_func = () => {
    if (!started || dead) return;
    health--;
    
    if (health <= 0) {
        health = 0;
        Instance.EntFireAtName({ name: "cpu_dead", input: "Trigger" });
        dead = true;
        for (let i = 1; i <= 5; i++) {
            Instance.EntFireAtName({ name: `cpu_hp_text_${i}`, input: "Disable" });
        }
    } else {
        update_hp(); 
    }
};
Instance.OnScriptInput("hit", hit_func);

let add_health_func = () => {
    health += ADD_HEALTH_AMOUNT;
    maxHealth += ADD_HEALTH_AMOUNT; 
    if (started) update_hp(); 
};
Instance.OnScriptInput("add_health", add_health_func);

// ==========================================
// Main Loop (Tick)
// ==========================================

Instance.SetThink(() => {
    if (started && !dead) {
        tick();
    }
    if (!dead) {
        Instance.SetNextThink(Instance.GetGameTime() + 1.0);
    }
});

function tick() {
    if (dead) return;

    switch (STATE) {
        case "DECODING":
            if (decode_phase_time === DECODE_TIME) {
                for (let i = 0; i < 2; i++) {
                    OP[i] = 0;
                    Instance.EntFireAtName({ name: "cpu_in_door_OP" + i, input: "FireUser2" });
                    Instance.EntFireAtName({ name: "cpu_in_OP" + i, input: "Enable", delay: 0.01 });
                }
                for (let i = 0; i < 8; i++) {
                    A[i] = 0;
                    B[i] = 0;
                    Instance.EntFireAtName({ name: "cpu_in_door_O" + i, input: "FireUser2" });
                    Instance.EntFireAtName({ name: "cpu_in_door_A" + i, input: "FireUser2" });
                    Instance.EntFireAtName({ name: "cpu_in_door_B" + i, input: "FireUser2" });
                    Instance.EntFireAtName({ name: "cpu_in_A" + i, input: "Enable", delay: 0.01 });
                    Instance.EntFireAtName({ name: "cpu_in_B" + i, input: "Enable", delay: 0.01 });
                }
                evaluate();
            }
            
            decode_phase_time--;
            
            let op_bin = "";
            let a_bin = "0b";
            let b_bin = "0b";

            for (let i = 1; i >= 0; i--) op_bin += OP[i].toString();
            for (let i = 7; i >= 0; i--) {
                a_bin += A[i].toString();
                b_bin += B[i].toString();
            }

            let decode_msg = `[ DECODE in ${decode_phase_time} s ]\nOP: ${OPCODE}\nA:  ${a_bin}\nB:  ${b_bin}`;
            Instance.EntFireAtName({ name: "cpu_text", input: "SetMessage", value: decode_msg });
            Instance.EntFireAtName({ name: "cpu_text", input: "Enable", delay: 0.01 });  

            if (decode_phase_time === 0) {
                decode_phase_time = DECODE_TIME;
                STATE = "EXECUTING";

                for (let i = 0; i < 2; i++) {
                    Instance.EntFireAtName({ name: "cpu_in_OP" + i, input: "Disable", delay: 0.01 });
                }
                for (let i = 0; i < 8; i++) {
                    Instance.EntFireAtName({ name: "cpu_in_A" + i, input: "Disable", delay: 0.01 });
                    Instance.EntFireAtName({ name: "cpu_in_B" + i, input: "Disable", delay: 0.01 });
                }
            }
            break;

        case "EXECUTING":
            execute_phase_time--;
            
            let exec_msg = `[ EXECUTE in ${execute_phase_time} s ]\nOP: ${OPCODE}\nA:  ${A_DEC}\nB:  ${B_DEC}`;
            Instance.EntFireAtName({ name: "cpu_text", input: "SetMessage", value: exec_msg });
            Instance.EntFireAtName({ name: "cpu_text", input: "Enable", delay: 0.01 });
            
            if (execute_phase_time === 0) {
                execute_phase_time = EXECUTE_TIME;
                STATE = "EXECUTING_WAIT";
                
                for (let i = 0; i < 8; i++) {
                    if (O[i] === 1) {
                        Instance.EntFireAtName({ name: "cpu_in_door_O" + i, input: "FireUser3" });
                    }
                }
            }
            break;
        
        case "EXECUTING_WAIT":
            STATE = "DECODING";
            break;
    }
}