import { Instance } from "cs_script/point_script";

Instance.Msg("Script Loaded");

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

let HALLOWEEN = false;
let XMAS = false;

Instance.OnScriptInput("get_date",() => {
    const today = new Date();
    const month = today.getMonth();    
    if(month==11){Instance.Msg("It's December! Jolly!");Instance.EntFireAtName("snow","Start","",1);XMAS=true;}else{Instance.Msg("It's not December! Not Jolly!");};
    if(month==9){Instance.Msg("It's October! Spooky!");Instance.EntFireAtName("snow","Start","",1);XMAS=true;}else{Instance.Msg("It's not October! Not Spooky!");};
});

Instance.OnScriptInput("holidays",() => {
    if(XMAS)Instance.EntFireAtName("snow","Start","",1);
    if(HALLOWEEN)Instance.EntFireAtName("ash","Start","",1);
});

let CT_COUNT_MAIN = 1;

let DEBUG = false;
let VAPOR_HP = false;
let DEADAIR_HP = false;
let AIRPLANE_HP = false;
let ISLAND_HP = false;
let HISTORICAL_SOCIETY_HP = false;
let WATER_PRISON_HP = false;
let WATER_PRISON_ESCAPE_HP = false;
let ISLAND_ESCAPE_HP = false;
let PIECES_COUNT = 64;

const VAPOR_ZM_SPEED = 1.15;
const VAPOR_ZM_HP = 1000;
const DEADAIR_ZM_HP = 5;
const DEADAIR_ZM_SPEED = 1.15;
const AIRPLANE_ZM_HP = 50;
const AIRPLANE_ZM_SPEED = 1.25;
const ISLAND_ZM_HP = 1000;
const ISLAND_ZM_SPEED = 1.10;
const HISTORICAL_SOCIETY_ZM_HP = 500;
const HISTORICAL_SOCIETY_ZM_SPEED = 1.05;
const WATER_PRISON_ZM_HP = 750;
const WATER_PRISON_ZM_SPEED = 1.07;
const WATER_PRISON_ESCAPE_ZM_HP = 5;
const WATER_PRISON_ESCAPE_ZM_SPEED = 1.12;
const ISLAND_ESCAPE_ZM_HP = 200;
const ISLAND_ESCAPE_ZM_SPEED = 1.07;

const MAIN_NURSE_HP_SCALE = 30;
const MAIN_T800_HP_SCALE = 40;
const MAIN_CREEPER_HP_SCALE = 10;
const MAIN_MANNEQUIN_HP_SCALE = 25;
const MAIN_LYINGFIGURE_HP_SCALE = 30;
const MAIN_SUPERCOMPUTER_HP_SCALE = 500;
const MAIN_EPSTEIN_SCALE = 1500;
const MAIN_SDT_EPSTEIN_SCALE = 1200;
const MAIN_MANDARIN_HP_SCALE = 50;

Instance.OnScriptInput("zm_controller_main",()=>{
    func_zm_controller();
});

Instance.OnScriptInput("zm_controller_vapor",()=>{
    VAPOR_HP=true;
    DEADAIR_HP=false;
    AIRPLANE_HP=false;
    ISLAND_HP=false;
    HISTORICAL_SOCIETY_HP=false;
    WATER_PRISON_HP=false;
    WATER_PRISON_ESCAPE_HP=false;
    ISLAND_ESCAPE_HP=false;
    func_zm_controller();
});


Instance.OnScriptInput("zm_controller_deadair",()=>{
    VAPOR_HP=false;    
    DEADAIR_HP=true;
    AIRPLANE_HP=false;
    ISLAND_HP=false;
    HISTORICAL_SOCIETY_HP=false;
    WATER_PRISON_HP=false; 
    WATER_PRISON_ESCAPE_HP=false;   
    ISLAND_ESCAPE_HP=false;
    func_zm_controller();
});

Instance.OnScriptInput("zm_controller_airplane",()=>{
    VAPOR_HP=false;    
    DEADAIR_HP=false;
    AIRPLANE_HP=true;
    ISLAND_HP=false;
    HISTORICAL_SOCIETY_HP=false;
    WATER_PRISON_HP=false;  
    WATER_PRISON_ESCAPE_HP=false;
    ISLAND_ESCAPE_HP=false;
    func_zm_controller();
});

Instance.OnScriptInput("zm_controller_island",()=>{
    VAPOR_HP=false;    
    DEADAIR_HP=false;
    AIRPLANE_HP=false;
    ISLAND_HP=true;
    HISTORICAL_SOCIETY_HP=false;
    WATER_PRISON_HP=false;  
    WATER_PRISON_ESCAPE_HP=false;
    ISLAND_ESCAPE_HP=false;
    func_zm_controller();
});

Instance.OnScriptInput("zm_controller_historical_society",()=>{
    VAPOR_HP=false;    
    DEADAIR_HP=false;
    AIRPLANE_HP=false;
    ISLAND_HP=false;
    HISTORICAL_SOCIETY_HP=true;
    WATER_PRISON_HP=false;  
    WATER_PRISON_ESCAPE_HP=false;
    ISLAND_ESCAPE_HP=false;
    func_zm_controller();
});

Instance.OnScriptInput("zm_controller_water_prison",()=>{
    VAPOR_HP=false;    
    DEADAIR_HP=false;
    AIRPLANE_HP=false;
    ISLAND_HP=false;
    HISTORICAL_SOCIETY_HP=false;
    WATER_PRISON_HP=true;  
    WATER_PRISON_ESCAPE_HP=false;
    ISLAND_ESCAPE_HP=false;
    func_zm_controller();
});

Instance.OnScriptInput("zm_controller_water_prison_escape",()=>{
    VAPOR_HP=false;    
    DEADAIR_HP=false;
    AIRPLANE_HP=false;
    ISLAND_HP=false;
    HISTORICAL_SOCIETY_HP=false;
    WATER_PRISON_HP=false;  
    WATER_PRISON_ESCAPE_HP=true;
    ISLAND_ESCAPE_HP=false;
    func_zm_controller();
});

Instance.OnScriptInput("zm_controller_island_escape",()=>{
    VAPOR_HP=false;    
    DEADAIR_HP=false;
    AIRPLANE_HP=false;
    ISLAND_HP=false;
    HISTORICAL_SOCIETY_HP=false;
    WATER_PRISON_HP=false;  
    WATER_PRISON_ESCAPE_HP=false;
    ISLAND_ESCAPE_HP=true;
    func_zm_controller();
});

Instance.OnScriptInput("reset_variables",()=>{
    VAPOR_HP=false;
    DEADAIR_HP=false;
    AIRPLANE_HP=false;
    ISLAND_HP=false;
    HISTORICAL_SOCIETY_HP=false;
    WATER_PRISON_HP=false;
    WATER_PRISON_ESCAPE_HP=false;
    ISLAND_ESCAPE_HP=false;
    CT_COUNT_MAIN = 1;
    PIECES_COUNT = 64;
});

Instance.OnScriptInput("zm_controller_off",()=>{
    VAPOR_HP=false;
    DEADAIR_HP=false;
    AIRPLANE_HP=false;
    ISLAND_HP=false;
    HISTORICAL_SOCIETY_HP=false;
    WATER_PRISON_HP=false;
    WATER_PRISON_ESCAPE_HP=false;
});

function func_zm_controller(){
    func_ct_counter();
    let NEW_ZM_HP_MAX=1;
    let NEW_ZM_SPEED_MAX=1;
    let players = Instance.FindEntitiesByClass("player");
    NEW_ZM_HP_MAX=1;NEW_ZM_SPEED_MAX=1;
    if(VAPOR_HP){NEW_ZM_HP_MAX = (VAPOR_ZM_HP * CT_COUNT_MAIN);NEW_ZM_SPEED_MAX=VAPOR_ZM_SPEED}
    else if(DEADAIR_HP){NEW_ZM_HP_MAX = (DEADAIR_ZM_HP * CT_COUNT_MAIN);NEW_ZM_SPEED_MAX=DEADAIR_ZM_SPEED}
    else if(AIRPLANE_HP){NEW_ZM_HP_MAX = (AIRPLANE_ZM_HP * CT_COUNT_MAIN);NEW_ZM_SPEED_MAX=AIRPLANE_ZM_SPEED;}
    else if(ISLAND_HP){NEW_ZM_HP_MAX = (ISLAND_ZM_HP * CT_COUNT_MAIN);NEW_ZM_SPEED_MAX=ISLAND_ZM_SPEED;}
    else if(HISTORICAL_SOCIETY_HP){NEW_ZM_HP_MAX = (HISTORICAL_SOCIETY_ZM_HP * CT_COUNT_MAIN);NEW_ZM_SPEED_MAX=HISTORICAL_SOCIETY_ZM_SPEED;}
    else if(WATER_PRISON_HP){NEW_ZM_HP_MAX = (WATER_PRISON_ZM_HP * CT_COUNT_MAIN);NEW_ZM_SPEED_MAX=WATER_PRISON_ZM_SPEED;}
    else if(WATER_PRISON_ESCAPE_HP){NEW_ZM_HP_MAX = (WATER_PRISON_ESCAPE_ZM_HP * CT_COUNT_MAIN);NEW_ZM_SPEED_MAX=WATER_PRISON_ESCAPE_ZM_SPEED;}
    else if(ISLAND_ESCAPE_HP){NEW_ZM_HP_MAX = (ISLAND_ESCAPE_ZM_HP * CT_COUNT_MAIN);NEW_ZM_SPEED_MAX=ISLAND_ESCAPE_ZM_SPEED;}    
    for (let player in players){
        if(players[player].GetTeamNumber()==2 && players[player].IsValid()){
            players[player].SetMaxHealth(NEW_ZM_HP_MAX);
            if(players[player].GetHealth()>NEW_ZM_HP_MAX){players[player].SetHealth(NEW_ZM_HP_MAX)}
            Instance.EntFireAtTarget(players[player], "KeyValues", "runspeed " + NEW_ZM_SPEED_MAX, 0);
        }
    }    
    if(DEBUG){Instance.Msg("ZOMBIE HP CAP: " + NEW_ZM_HP_MAX.toString());}
};

function func_zm_controller_fix(player){
    let NEW_ZM_HP_MAX=1;
    let NEW_ZM_SPEED_MAX=1;
    delay(500);
    if(VAPOR_HP){NEW_ZM_HP_MAX = (VAPOR_ZM_HP * CT_COUNT_MAIN);NEW_ZM_SPEED_MAX=VAPOR_ZM_SPEED}
    else if(DEADAIR_HP){NEW_ZM_HP_MAX = (DEADAIR_ZM_HP * CT_COUNT_MAIN);NEW_ZM_SPEED_MAX=DEADAIR_ZM_SPEED}
    else if(AIRPLANE_HP){NEW_ZM_HP_MAX = (AIRPLANE_ZM_HP * CT_COUNT_MAIN);NEW_ZM_SPEED_MAX=AIRPLANE_ZM_SPEED;}
    else if(ISLAND_HP){NEW_ZM_HP_MAX = (ISLAND_ZM_HP * CT_COUNT_MAIN);NEW_ZM_SPEED_MAX=ISLAND_ZM_SPEED;}
    else if(HISTORICAL_SOCIETY_HP){NEW_ZM_HP_MAX = (HISTORICAL_SOCIETY_ZM_HP * CT_COUNT_MAIN);NEW_ZM_SPEED_MAX=HISTORICAL_SOCIETY_ZM_SPEED;}
    else if(WATER_PRISON_HP){NEW_ZM_HP_MAX = (WATER_PRISON_ZM_HP * CT_COUNT_MAIN);NEW_ZM_SPEED_MAX=WATER_PRISON_ZM_SPEED;}
    if(player?.GetTeamNumber()==2 && player?.IsValid()){
        // player?.SetMaxHealth(NEW_ZM_HP_MAX);
        // if(player?.GetHealth()>NEW_ZM_HP_MAX){player?.SetHealth(NEW_ZM_HP_MAX)}
        // Instance.EntFireAtTarget(player, "KeyValues", "runspeed " + NEW_ZM_SPEED_MAX, 0);
        // Instance.Msg(NEW_ZM_HP_MAX);
        Instance.EntFireAtTarget(player,"KeyValues","max_health " + NEW_ZM_HP_MAX,0.25);
        Instance.EntFireAtTarget(player,"KeyValues","health " + NEW_ZM_HP_MAX,0.25);
        Instance.EntFireAtTarget(player, "KeyValues", "runspeed " + NEW_ZM_SPEED_MAX, 0.25);        
    }
    if(DEBUG){Instance.Msg("ZOMBIE HP CAP: " + NEW_ZM_HP_MAX.toString());}
};

Instance.OnGameEvent("player_death", (event) => {
    let player = Instance.GetPlayerController(event.userid)?.GetPlayerPawn();
    let attacker = Instance.GetPlayerController(event.attacker)?.GetPlayerPawn();
    if(attacker?.GetTeamNumber()==2 && attacker?.GetHealth()>1 && event.weapon ==  "knife"){
        func_ct_counter();
        //func_zm_controller();
        Instance.EntFireAtTarget(player,"KeyValues","max_health 1",0.1);
        Instance.EntFireAtTarget(player,"KeyValues","health 1",0.1);
    }
});

Instance.OnGameEvent("player_spawn", (event) => {
    let player = Instance.GetPlayerController(event.userid)?.GetPlayerPawn();
    if(player?.GetTeamNumber()==2){func_zm_controller_fix(player);}
});

Instance.OnScriptInput("ct_counter",()=>{func_ct_counter();});

Instance.OnScriptInput("wp_break_1_trig_scale",()=>{
    func_ct_counter();
    Instance.EntFireAtName("wp_break_1_trig","SetHealth",CT_COUNT_MAIN*200,0);
});

Instance.OnScriptInput("wp_f2_break",()=>{
    PIECES_COUNT -= 1;
    if(PIECES_COUNT = 0){return};
    const pieces = Instance.FindEntitiesByName("wp_f2_ring_break");
    for(let ring in pieces){
        let randomIndex = Math.floor(Math.random() * pieces.length);
        Instance.EntFireAtTarget(pieces[randomIndex],"Break","",0);
        return;
    }
});


function func_ct_counter(){
    let players = Instance.FindEntitiesByClass("player");
    let CT_COUNT_MAIN_TEMP = 0;
    for (let player in players){
        if(players[player].GetTeamNumber()==3 && players[player].IsValid()){CT_COUNT_MAIN_TEMP+=1};
    }
    CT_COUNT_MAIN = CT_COUNT_MAIN_TEMP + 1;
    Instance.EntFireAtName("nurse_ow_scale", "SetValue", MAIN_NURSE_HP_SCALE * CT_COUNT_MAIN + 1, 0);
    Instance.EntFireAtName("t800_scale", "SetValue", MAIN_T800_HP_SCALE * CT_COUNT_MAIN + 1, 0);
    Instance.EntFireAtName("creeper_scale", "SetValue", MAIN_CREEPER_HP_SCALE * CT_COUNT_MAIN + 1, 0);
    Instance.EntFireAtName("mannequin_scale", "SetValue", MAIN_MANNEQUIN_HP_SCALE * CT_COUNT_MAIN + 1, 0);
    Instance.EntFireAtName("lyingfigure_scale", "SetValue", MAIN_LYINGFIGURE_HP_SCALE * CT_COUNT_MAIN + 1, 0);
    Instance.EntFireAtName("supercomputer_scale", "SetValue", MAIN_SUPERCOMPUTER_HP_SCALE * CT_COUNT_MAIN + 1, 0);
    Instance.EntFireAtName("epstein_scale", "SetValue", MAIN_EPSTEIN_SCALE * CT_COUNT_MAIN + 1, 0);
    Instance.EntFireAtName("sdt_epstein_scale", "SetValue", MAIN_SDT_EPSTEIN_SCALE * CT_COUNT_MAIN + 1, 0);
    Instance.EntFireAtName("mandarin_scale", "SetValue", MAIN_MANDARIN_HP_SCALE * CT_COUNT_MAIN + 1, 0);
    if(DEBUG){
        Instance.Msg("nurse hp: " + MAIN_NURSE_HP_SCALE.toString());
        Instance.Msg("t800 hp: " + MAIN_T800_HP_SCALE.toString());
        Instance.Msg("creeper hp: " + MAIN_CREEPER_HP_SCALE.toString());
        Instance.Msg("mannequin hp: " + MAIN_MANNEQUIN_HP_SCALE.toString());
        Instance.Msg("lyingfigure hp: " + MAIN_LYINGFIGURE_HP_SCALE.toString());
    }    
}

Instance.OnScriptInput("spawn_summon_sword",()=>{
    let players = Instance.FindEntitiesByClass("player");
    let humans = [];
    for (let player in players){
        if(players[player].GetTeamNumber()==3 && players[player].IsValid()){humans.push(players[player])};
    }
    let randomIndex = Math.floor(Math.random() * humans.length);
    let temp_ss = Instance.FindEntityByName("temp_ei_ss");
    let origin_ss = Instance.FindEntityByName("ei_ss_spawn");
    if(humans[randomIndex].IsValid()){
        temp_ss.ForceSpawn(origin_ss?.GetAbsOrigin(),getAngles(humans[randomIndex].GetAbsOrigin(),origin_ss?.GetAbsOrigin()));
    }
});

Instance.OnScriptInput("tp_test",()=>{
    let players = Instance.FindEntitiesByClass("player");
    let test_vector = {x:0,y:0,z:0};
    for (let player in players){
        players[player].Teleport(test_vector,null,null);
    }
});

/**
 * Get Source-style angles (pitch, yaw, roll) from origin -> target.
 * @param {Object} origin {x,y,z}
 * @param {Object} target {x,y,z}
 * @returns {Object} {pitch, yaw, roll} in degrees [0–360)
 */
function getAngles(origin, target) {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const dz = target.z - 48 - origin.z;

  // Yaw: angle around Z (atan2 of Y/X)
  let yaw = (Math.atan2(dy, dx) * 180 / Math.PI) + 180;
  if (yaw < 0) yaw += 360;

  // Pitch: up/down; Source uses negative pitch for "up"
  const dist = Math.sqrt(dx*dx + dy*dy);
  let pitch = Math.atan2(dz, dist) * 180 / Math.PI;
  if (pitch < 0) pitch += 360;

  // Roll: typically 0 unless you define a banking direction
  let roll = 0;

  return { pitch, yaw, roll };
}

const SUMMON_SWORD_PARRY_DISTANCE = 192;

Instance.OnScriptInput("connect_parry",()=>{
    const relayEnt = Instance.FindEntitiesByName("parry_relay*");
    for(let ent in relayEnt){
        Instance.ConnectOutput(relayEnt[ent], "OnTrigger", (arg, context) => 
        {
            if(context.activator.IsValid()){
                const summon_swords = Instance.FindEntitiesByName("ei_ss_move*");
                const player_origin = context.activator.GetAbsOrigin();
                for (let sword in summon_swords){
                    Instance.Msg(summon_swords[sword].GetEntityName())
                    if (summon_swords[sword].IsValid()){
                        const delta = getDistance(context.activator.GetAbsOrigin(),summon_swords[sword].GetAbsOrigin())
                        if(delta<=SUMMON_SWORD_PARRY_DISTANCE){
                            Instance.EntFireAtTarget(summon_swords[sword],"FireUser1","",0);
                        }
                        Instance.Msg(delta);
                    }
                }
            }
        });            
    }
});

function getDistance(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z + 64;
  return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

// Water Prison Maze courtesy of Chat GPT because i don't know fucking typescript bro, surely this won't break

// Labyrinth Maze Generator for Counter-Strike 2
// Generates a random path using DFS and spawns blockers at unused junctions
const GRID_WIDTH = 9;
const GRID_HEIGHT = 9;
const CELL_SIZE = 448;
const START_X = -10768;
const START_Y = -1792;
const Z = -12789.5;
// Directions: [dx, dy, name]
const DIRS = [
    [1, 0, "right"],
    [-1, 0, "left"],
    [0, 1, "forward"],
    [0, -1, "aft"],
];
function key([x, y]) {
    return `${x},${y}`;
}
function wallKey(a, b) {
    // Order the coordinates consistently
    const [ax, ay] = a;
    const [bx, by] = b;
    if (ax < bx || (ax === bx && ay < by)) {
        return `${ax},${ay}_${bx},${by}`;
    }
    else {
        return `${bx},${by}_${ax},${ay}`;
    }
}
const visited = new Set();
const openedWalls = new Set();
function dfs(cell) {
    visited.add(key(cell));
    const shuffledDirs = DIRS.sort(() => Math.random() - 0.5);
    for (const [dx, dy] of shuffledDirs) {
        const next = [cell[0] + dx, cell[1] + dy];
        if (next[0] < 0 || next[0] >= GRID_WIDTH ||
            next[1] < 0 || next[1] >= GRID_HEIGHT)
            continue;
        if (!visited.has(key(next))) {
            // Mark this wall as open (do NOT block it)
            openedWalls.add(wallKey(cell, next));
            dfs(next);
        }
    }
}

const zero_vector = {pitch: 0, yaw: 0, roll:0};
function spawnBlockerAt(x, y, template) {
    const wx = START_X + x * CELL_SIZE;
    const wy = START_Y + y * CELL_SIZE;
    const new_vector = {x: wx, y: wy, z:Z};
    if(DEBUG){Instance.Msg(wx.toString() + " " + wy.toString());};
    template.ForceSpawn(new_vector,zero_vector);
}

function spawnMaze() {
    const temp_laby = Instance.FindEntityByName("temp_labyrinth_block");
    const temp_npc  = Instance.FindEntityByName("temp_mannequin");

    visited.clear();
    openedWalls.clear();
    dfs([0, 4]); // Start at blue dot

    // --- Spawn walls ---
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            for (const [dx, dy] of DIRS) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx < 0 || nx >= GRID_WIDTH ||
                    ny < 0 || ny >= GRID_HEIGHT) continue;

                const wall = wallKey([x, y], [nx, ny]);
                // only spawn once per wall (avoid duplicates)
                if (!openedWalls.has(wall)) {
                    const bx = (x + nx) / 2;
                    const by = (y + ny) / 2;
                    spawnBlockerAt(bx, by, temp_laby);
                }
            }
        }
    }

    // --- Spawn mannequins on path cells ---
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (visited.has(key([x, y]))) {
                const wx = START_X + x * CELL_SIZE;
                const wy = START_Y + y * CELL_SIZE;
                const new_vector = { x: wx, y: wy, z: Z };
                temp_npc.ForceSpawn(new_vector, zero_vector);
            }
        }
    }
}


Instance.OnScriptInput("generate_labyrinth", () => {
    spawnMaze();
})

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
