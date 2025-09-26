import { Instance } from "cs_script/point_script";

Instance.Msg("Script Loaded");

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
let DEADAIR_HP = false;
let AIRPLANE_HP = false;
let ISLAND_HP = false;

const DEADAIR_ZM_HP = 10;
const DEADAIR_ZM_SPEED = 1.25;
const ISLAND_ZM_HP = 1000;
const ISLAND_ZM_SPEED = 1.35;
const AIRPLANE_ZM_HP = 50;
const AIRPLANE_ZM_SPEED = 1.10;

const MAIN_NURSE_HP_SCALE = 30;
const MAIN_T800_HP_SCALE = 40;
const MAIN_T800_HURT_SCALE = 1;
const MAIN_CREEPER_HP_SCALE = 10;
const MAIN_MANNEQUIN_HP_SCALE = 25;
const MAIN_LYINGFIGURE_HP_SCALE = 30;
const MAIN_SUPERCOMPUTER_HP_SCALE = 500;
const MAIN_EPSTEIN_SCALE = 180;
const MAIN_SDT_EPSTEIN_SCALE = 120;

Instance.OnScriptInput("zm_controller_main",()=>{
    zm_controller();
});

Instance.OnScriptInput("zm_controller_deadair",()=>{
    DEADAIR_HP=true;
    AIRPLANE_HP=false;
    ISLAND_HP=false;
});

Instance.OnScriptInput("zm_controller_airplane",()=>{
    DEADAIR_HP=false;
    AIRPLANE_HP=true;
    ISLAND_HP=false;
});

Instance.OnScriptInput("zm_controller_island",()=>{
    DEADAIR_HP=false;
    AIRPLANE_HP=false;
    ISLAND_HP=true;
});

Instance.OnScriptInput("zm_controller_island_off",()=>{
    DEADAIR_HP=false;
    AIRPLANE_HP=false;
    ISLAND_HP=false;
});

Instance.OnScriptInput("zm_controller_airplane_off",()=>{
    DEADAIR_HP=false;
    AIRPLANE_HP=false;
    ISLAND_HP=false;
});

Instance.OnScriptInput("reset_variables",()=>{
    DEADAIR_HP=false;
    AIRPLANE_HP=false;
    ISLAND_HP=false;
});

function zm_controller(){
    let CT_COUNT_MAIN_TEMP=0;
    let NEW_ZM_HP_MAX=1;
    let NEW_ZM_SPEED_MAX=1;
    let players = Instance.FindEntitiesByClass("player");
    for (let player in players){
        if(players[player].GetTeamNumber()==3 && players[player].IsValid()){CT_COUNT_MAIN_TEMP+=1};
    }
    CT_COUNT_MAIN = CT_COUNT_MAIN_TEMP + 1;
    if(DEADAIR_HP){NEW_ZM_HP_MAX = (DEADAIR_ZM_HP * CT_COUNT_MAIN);NEW_ZM_SPEED_MAX=DEADAIR_ZM_SPEED}
    if(AIRPLANE_HP){NEW_ZM_HP_MAX = (AIRPLANE_ZM_HP * CT_COUNT_MAIN);NEW_ZM_SPEED_MAX=AIRPLANE_ZM_SPEED;}
    if(ISLAND_HP){NEW_ZM_HP_MAX = (ISLAND_ZM_HP * CT_COUNT_MAIN);NEW_ZM_SPEED_MAX=ISLAND_ZM_SPEED;}
    if(DEADAIR_HP||AIRPLANE_HP||ISLAND_HP){
        for (let player in players){
            if(players[player].GetTeamNumber()==2 && players[player].IsValid()){
                players[player].SetMaxHealth(NEW_ZM_HP_MAX);
                if(players[player].GetHealth()>NEW_ZM_HP_MAX){players[player].SetHealth(NEW_ZM_HP_MAX)}
                Instance.EntFireAtTarget(players[player], "KeyValues", "runspeed " + NEW_ZM_SPEED_MAX, 0);
            }
        }
    }    
    if(DEBUG){Instance.Msg("ZOMBIE HP CAP: " + NEW_ZM_HP_MAX.toString());}
    Instance.EntFireAtName("nurse_ow_scale", "SetValue", MAIN_NURSE_HP_SCALE * CT_COUNT_MAIN + 1, 0);
    Instance.EntFireAtName("t800_scale", "SetValue", MAIN_T800_HP_SCALE * CT_COUNT_MAIN + 1, 0);
    Instance.EntFireAtName("creeper_scale", "SetValue", MAIN_CREEPER_HP_SCALE * CT_COUNT_MAIN + 1, 0);
    Instance.EntFireAtName("mannequin_scale", "SetValue", MAIN_MANNEQUIN_HP_SCALE * CT_COUNT_MAIN + 1, 0);
    Instance.EntFireAtName("lyingfigure_scale", "SetValue", MAIN_LYINGFIGURE_HP_SCALE * CT_COUNT_MAIN + 1, 0);
    Instance.EntFireAtName("supercomputer_scale", "SetValue", MAIN_SUPERCOMPUTER_HP_SCALE * CT_COUNT_MAIN + 1, 0);
    Instance.EntFireAtName("epstein_scale", "SetValue", MAIN_EPSTEIN_SCALE * CT_COUNT_MAIN + 1, 0);
    Instance.EntFireAtName("sdt_epstein_scale", "SetValue", MAIN_SDT_EPSTEIN_SCALE * CT_COUNT_MAIN + 1, 0);
    if(DEBUG){
        Instance.Msg("nurse hp: " + MAIN_NURSE_HP_SCALE.toString());
        Instance.Msg("t800 hp: " + MAIN_T800_HP_SCALE.toString());
        Instance.Msg("creeper hp: " + MAIN_CREEPER_HP_SCALE.toString());
        Instance.Msg("mannequin hp: " + MAIN_MANNEQUIN_HP_SCALE.toString());
        Instance.Msg("lyingfigure hp: " + MAIN_LYINGFIGURE_HP_SCALE.toString());
    }
};

Instance.OnScriptInput("tp_test",()=>{
    let players = Instance.FindEntitiesByClass("player");
    let test_vector = {x:0,y:0,z:0};
    for (let player in players){
        players[player].Teleport(test_vector,null,null);
    }
});

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


function spawnBlockerAt(x, y, template) {
    const wx = START_X + x * CELL_SIZE;
    const wy = START_Y + y * CELL_SIZE;
    const new_vector = {x: wx, y: wy, z:Z};
    const zero_vector = {pitch: 0, yaw: 0, roll:0};
    if(DEBUG){Instance.Msg(wx.toString() + " " + wy.toString());};
    template.ForceSpawn(new_vector,zero_vector);
}

function spawnMaze() {
    const temp_laby = Instance.FindEntityByName("temp_labyrinth_block");
    visited.clear();
    openedWalls.clear();
    dfs([0, 4]); // Starting point (blue dot in image)
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            for (const [dx, dy] of DIRS) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx < 0 || nx >= GRID_WIDTH ||
                    ny < 0 || ny >= GRID_HEIGHT)
                    continue;
                const wall = wallKey([x, y], [nx, ny]);
                if (!openedWalls.has(wall)) {
                    // This wall wasn't opened, so place a blocker
                    const bx = (x + nx) / 2;
                    const by = (y + ny) / 2;
                    spawnBlockerAt(bx, by, temp_laby);
                }
            }
        }
    }
}

Instance.OnScriptInput("GenerateLabyrinth", () => {
    spawnMaze();
})

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}