import { Instance } from 'cs_script/point_script';

const thinkQueue = [];
function QueueThink(time, callback) {
    const indexAfter = thinkQueue.findIndex((t) => t.time > time);
    if (indexAfter === -1) thinkQueue.push({ time, callback });
    else thinkQueue.splice(indexAfter, 0, { time, callback });
    if (indexAfter === 0 || indexAfter === -1) Instance.SetNextThink(time);
}
function RunThinkQueue() {
    const upperThinkTime = Instance.GetGameTime() + 1 / 128;
    while (thinkQueue.length > 0 && thinkQueue[0].time <= upperThinkTime) thinkQueue.shift().callback();
    if (thinkQueue.length > 0) Instance.SetNextThink(thinkQueue[0].time);
}
function Delay(delay) {
    return new Promise((resolve) => QueueThink(Instance.GetGameTime() + delay, resolve));
}

const HUMAN_SAYSOUNDS = {
    '.': '_period',
    '?': '_period',
    '!': '_period',
    ',': '_period',
    '0': 'zero',
    '1': 'one',
    '2': 'two',
    '3': 'three',
    '4': 'four',
    '5': 'five',
    '6': 'six',
    'a': 'a',
    'an': 'a',
    'affirmative': 'affirmative',
    'alert': 'alert',
    'alien': 'alien',
    'aliens': 'alien',
    'all': 'all',
    'am': 'am',
    'anything': 'anything!',
    'are': "are",
    'r': 'are',
    'area': 'area',
    'ass': 'ass',
    '@': 'at!',
    'at': 'at!',
    'away': 'away!',
    'backup': 'backup',
    'bag': 'bag!',
    'bastard': 'bastard',
    'bastards': 'bastard',
    'blow': 'blow!',
    'blows': 'blow!',
    'bogies': 'bogies',
    'bogie': 'bogies',
    'bravo': 'bravo',
    'call': 'call!',
    'casualty': 'casualties!',
    'casualties': 'casualties!',
    'charlie': 'charlie',
    'check': 'check',
    'checking': 'checking',
    'clear': 'clear',
    'command': 'command',
    'continue': 'continue',
    'control': 'control',
    'cover': 'cover!',
    'creeps': 'creeps',
    'creep': 'creeps',
    'damn': 'damn',
    'dam': 'damn',
    'delta': 'delta',
    'down': 'down',
    'east': 'east',
    'echo': 'echo',
    'eliminate': 'eliminate',
    'everything': 'everything',
    'fall': 'fall!',
    'fight': 'fight',
    'fire': 'fire',
    'five': 'five',
    'force': 'force',
    'formation': 'formation',
    'four': 'four',
    'foxtrot': 'foxtrot',
    'freeman': 'freeman',
    'get': 'get!',
    'go': 'go',
    'god': 'god',
    'going': 'going',
    'got': 'got',
    'grenade': 'grenade!',
    'guard': 'guard',
    'have': 'have',
    'he': 'he!',
    'heavy': 'heavy',
    'hell': 'hell',
    'here': 'here',
    'hold': 'hold',
    'hole': 'hole',
    'hostiles': 'hostiles',
    'hot': 'hot',
    't': 't',
    'in': 'in',
    'is': 'is',
    'kick': 'kick!',
    'lay': 'lay!',
    'left': 'left',
    'lets': 'lets',
    "let's": 'lets',
    'level': 'level',
    'lookout': 'lookout',
    'maintain': 'maintain',
    'mission': 'mission',
    'mister': 'mister',
    'mother': 'mother!',
    'mom': 'mother!',
    'movement': 'movement',
    'moves': 'moves',
    'my': 'my',
    'need': 'need!',
    'negativ': 'negativ',
    'neutralized': 'neutralized!',
    'niner': 'niner',
    'no': 'no',
    'north': 'north',
    'nothing': 'nothing',
    'objective': 'objective',
    'of': 'of',
    'oh': 'oh!',
    'o': 'oh!',
    'ok': 'ok',
    'okay': 'ok',
    'one': 'one',
    'orders': 'orders',
    'order': 'orders',
    'our': 'our!',
    'out': 'out',
    'over': 'over',
    'patrol': 'patrol',
    'people': 'people',
    'position': 'position',
    'post': 'post',
    'private': 'private',
    'quiet': 'quiet',
    'radio': 'radio',
    'recon': 'recon',
    'request': 'request!',
    'right': 'right',
    'roger': 'roger',
    'sector': 'sector',
    'secure': 'secure',
    'shit': 'shit',
    'shut': 'shit',
    'shot': 'shot',
    'sign': 'sign',
    'signs': 'signs',
    'silence': 'silence',
    'sir': 'sir',
    'six': 'six',
    'some': 'some',
    'something': 'something',
    'south': 'south',
    'squad': 'squad',
    'stay': 'stay',
    'supressing': 'supressing!',
    'sweep': 'sweep',
    'take': 'take!',
    'tango': 'tango',
    'target': 'target',
    'team': 'team',
    'that': 'that',
    'dat': 'that',
    'the': 'the',
    'teh': 'the',
    'there': 'there',
    'theyre': 'there',
    "they're": 'there',
    'these': 'these',
    'this': 'this',
    'dis': 'this',
    'those': 'those',
    'three': 'three',
    'tight': 'tight',
    'two': 'two',
    'uhh': 'uhh',
    'uh': 'uhh',
    'under': 'under!',
    'up': 'up',
    'we': 'we',
    'weapons': 'weapons',
    'weapon': 'weapons',
    'weird': 'weird',
    'west': 'west',
    "we've": "we've",
    'weve': "we've",
    'will': 'will!',
    'yeah': 'yeah',
    'yea': 'yeah',
    'ya': 'yeah',
    'yeh': 'yeah',
    'ye': 'yeah',
    'ja': 'yeah',
    'yes': 'yes',
    'you': 'you',
    'u': 'you',
    'your': 'your',
    'ur': 'your',
    'zero': 'zero',
    'zone': 'zone',
    'zulu': 'zulu'
};
const ZOMBIE_SAYSOUNDS = [
    'slv_word1',
    'slv_word2',
    'slv_word3',
    'slv_word4',
    'slv_word5',
    'slv_word6',
    'slv_word7',
    'slv_word8'
];

let player_next_times = {};
const SAYSOUNDENT_SUFFIX = 'player_saysound_ent_';
const PLAYERSOUND_SUFFIX = 'player_sound_';
function play_sound(player, text) {
    if (Instance.FindEntitiesByName(SAYSOUNDENT_SUFFIX + "*").length > 0) {
        let controller_slot = player.GetPlayerSlot();
        let sound_ent = Instance.FindEntityByName(SAYSOUNDENT_SUFFIX + controller_slot)
        parse_text_and_play(text, player, sound_ent);
    }
}
function can_be_said(tokens) {
    for (const t of tokens) {
        if (!Object.hasOwn(HUMAN_SAYSOUNDS, t.toString().toLowerCase())) {
            return false;
        }
    }
    return true;
}
function random_from_array(array) {
    return Math.floor(Math.random() * array.length);
}
async function parse_text_and_play(text, controller, sound_ent) {
    let tokens = text.trim().split(" ");
    // if player is under saysound CD, do not play saysound
    if (Instance.GetGameTime() < player_next_times[controller.GetPlayerSlot()]) {
        return;
    }
    if (!controller.IsValid()) {
        return;
    }

    if (controller.GetTeamNumber() == 3 && can_be_said(tokens)) {
        player_next_times[controller.GetPlayerSlot()] = Instance.GetGameTime() + tokens.length;
        for (const t of tokens) {
            if (controller.GetTeamNumber() == 3) {
                sound_ent.Teleport({position: controller.GetPlayerPawn().GetAbsOrigin()})
                sound_ent.SetParent(controller.GetPlayerPawn())
                Instance.EntFireAtName(SAYSOUNDENT_SUFFIX + controller.GetPlayerSlot(), "SetSoundEventName", "saysound." + HUMAN_SAYSOUNDS[t.toLowerCase()]);
                Instance.EntFireAtName(SAYSOUNDENT_SUFFIX + controller.GetPlayerSlot(), "StartSound", null, 0.1);
                await Delay(1);
            }
        }
    }
    else if (controller.GetTeamNumber() == 2) {
        player_next_times[controller.GetPlayerSlot()] = Instance.GetGameTime() + tokens.length;
        for (const t of tokens) {
            Instance.EntFireAtName(SAYSOUNDENT_SUFFIX + controller.GetPlayerSlot(), "SetSoundEventName", "saysound." + ZOMBIE_SAYSOUNDS[random_from_array(ZOMBIE_SAYSOUNDS)]);
            Instance.EntFireAtName(SAYSOUNDENT_SUFFIX + controller.GetPlayerSlot(), "StartSound", null, 0.1);
            await Delay(1);
        }
    }
}

let cd = 120;
function nuke_countdown(context) {
    cd--;
    const MIN = cd / 60;
    const SEC = cd % 60;
    const SEC_DECIMAL = SEC / 10;
    const SEC_UNIT = SEC % 10;
    if (cd === 0) {
        Instance.EntFireAtTarget(context.caller, 'Disable');
    }
    Instance.EntFireAtName("bomb_cd_min", "Skin", MIN.toString());
    Instance.EntFireAtName("bomb_cd_sec_decimal", "Skin", SEC_DECIMAL.toString());
    Instance.EntFireAtName("bomb_cd_sec_unit", "Skin", SEC_UNIT.toString());
}

let player_color_set = [];
function rand(min, max) {
    return Math.random() * (max - min) + min;
}
function randomize_rgb(activator) {
    if (!player_color_set.includes(activator)) {
        const random_r = parseInt(rand(0, 255));
        const random_g = parseInt(rand(0, 255));
        const random_b = parseInt(rand(0, 255));
        let random_color = random_r + " " + random_g + " " + random_b;
        Instance.EntFireAtTarget(activator, "Color", random_color);
    }
}
function reset_colors() {
    player_color_set = [];
}
function enforce_player_models(activator) {
    if (activator.IsValid()) {
        if (activator.GetTeamNumber() == 3) {
            activator.SetModel("models/player/custom_player/astronaut/astronaut_fix/astronaut.vmdl");
            randomize_rgb(activator);
            player_color_set.push(activator);
        }
        else if (activator.GetTeamNumber() == 2) {
            activator.SetModel("models/player/custom_player/kuristaja/fo4/alien/alien_fix/alien.vmdl");
            randomize_rgb(activator);
            player_color_set.push(activator);
        }
    }
}

let crane_box_left_right;
let crane_box_front_back;
let crane_box_up_down;
let is_pressing = { 'w': false, 'a': false, 's': false, 'd': false, };
function get_crane_entities() {
    crane_box_left_right = Instance.FindEntityByName("crane_box_left_right");
    crane_box_front_back = Instance.FindEntityByName("crane_box_front_back");
    crane_box_up_down = Instance.FindEntityByName("crane_box_up_down");
}
function is_pressing_other_keys(key_to_ignore) {
    for (const key of Object.keys(is_pressing)) {
        if (key != key_to_ignore) {
            if (is_pressing[key])
                return true;
        }
    }
    return false;
}
function move_crane(direction, mode) {
    get_crane_entities();
    switch (direction) {
        case 'w':
            if (!is_pressing_other_keys('w')) {
                if (mode == "MOVE") {
                    Instance.EntFireAtTarget(crane_box_front_back, "ClearParent", "");
                    Instance.EntFireAtTarget(crane_box_up_down, "SetParent", "crane_box_front_back");
                    Instance.EntFireAtTarget(crane_box_front_back, "StartForward", null, 0.02);
                    Instance.EntFireAtName("fix_crane_path_pos_timer", "Enable");
                    is_pressing['w'] = true;
                }
                else if (mode == "LIFT") {
                    Instance.EntFireAtTarget(crane_box_up_down, "ClearParent", "");
                    Instance.EntFireAtTarget(crane_box_up_down, "StartBackward", null, 0.02);
                    is_pressing['w'] = true;
                }
            }
            break;
        case 'a':
            if (!is_pressing_other_keys('a')) {
                if (mode == "MOVE") {
                    Instance.EntFireAtTarget(crane_box_front_back, "SetParent", "crane_box_left_right");
                    Instance.EntFireAtTarget(crane_box_up_down, "SetParent", "crane_box_left_right");
                    Instance.EntFireAtTarget(crane_box_left_right, "StartForward", null, 0.02);
                    Instance.EntFireAtName("fix_crane_path_pos_timer", "Enable");
                    is_pressing['a'] = true;
                }
            }
            break;
        case 's':
            if (!is_pressing_other_keys('s')) {
                if (mode == "MOVE") {
                    Instance.EntFireAtTarget(crane_box_front_back, "ClearParent", "");
                    Instance.EntFireAtTarget(crane_box_up_down, "SetParent", "crane_box_front_back");
                    Instance.EntFireAtTarget(crane_box_front_back, "StartBackward", null, 0.02);
                    Instance.EntFireAtName("fix_crane_path_pos_timer", "Enable");
                    is_pressing['s'] = true;
                }
                if (mode == "LIFT") {
                    Instance.EntFireAtTarget(crane_box_up_down, "ClearParent", "");
                    Instance.EntFireAtTarget(crane_box_up_down, "StartForward", null, 0.02);
                    is_pressing['s'] = true;
                }
            }
            break;
        case 'd':
            if (!is_pressing_other_keys('d')) {
                if (mode == "MOVE") {
                    Instance.EntFireAtTarget(crane_box_front_back, "SetParent", "crane_box_left_right");
                    Instance.EntFireAtTarget(crane_box_up_down, "SetParent", "crane_box_left_right");
                    Instance.EntFireAtTarget(crane_box_left_right, "StartBackward", null, 0.02);
                    Instance.EntFireAtName("fix_crane_path_pos_timer", "Enable");
                    is_pressing['d'] = true;
                }
            }
            break;
    }
}
function stop_move_crane_all() {
    Instance.EntFireAtTarget(crane_box_front_back, "Stop", "");
    Instance.EntFireAtTarget(crane_box_up_down, "Stop");
    Instance.EntFireAtTarget(crane_box_left_right, "Stop");
    Instance.EntFireAtName("fix_crane_path_pos_timer", "Disable");
}
function stop_move_crane(direction, mode) {
    get_crane_entities();
    switch (direction) {
        case 'w':
            if (mode == "MOVE") {
                Instance.EntFireAtTarget(crane_box_front_back, "Stop");
                Instance.EntFireAtName("fix_crane_path_pos_timer", "Disable");
            }
            else if (mode == "LIFT") {
                Instance.EntFireAtTarget(crane_box_up_down, "Stop", "");
            }
            is_pressing['w'] = false;
            break;
        case 'a':
            if (mode == "MOVE") {
                Instance.EntFireAtTarget(crane_box_left_right, "Stop");
                Instance.EntFireAtName("fix_crane_path_pos_timer", "Disable");
                is_pressing['a'] = false;
            }
            break;
        case 's':
            if (mode == "MOVE") {
                Instance.EntFireAtTarget(crane_box_front_back, "Stop");
                Instance.EntFireAtName("fix_crane_path_pos_timer", "Disable");
            }
            if (mode == "LIFT") {
                Instance.EntFireAtTarget(crane_box_up_down, "Stop");
            }
            is_pressing['s'] = false;
            break;
        case 'd':
            if (mode == "MOVE") {
                Instance.EntFireAtTarget(crane_box_left_right, "Stop");
                Instance.EntFireAtName("fix_crane_path_pos_timer", "Disable");
                is_pressing['d'] = false;
            }
            break;
    }
}

let path_tracks_up_down = [];
let path_tracks_front_back = [];
let crane_mode = "MOVE";
let crane_magnet = "ON";
let allow_saysounds = false;
function get_soundevents() {
    let soundevents = Instance.FindEntitiesByName("player_saysound_*");
    let idx = 0;
    soundevents.forEach((s) => {
        s.SetEntityName("player_saysound_ent_" + idx);
        idx++;
    });
}
function get_path_tracks() {
    Instance.FindEntitiesByName("crane_box_up_down_path*").forEach((path) => {
        path_tracks_up_down.push(path);
    });
    Instance.FindEntitiesByName("crane_box_front_back_path*").forEach((path) => {
        path_tracks_front_back.push(path);
    });
}
function Init() {
    get_soundevents();
    get_path_tracks();
    reset_colors();
    allow_saysounds = false;
    cd = 120;
}

Instance.OnScriptInput("AllowSaysounds", () => {
    allow_saysounds = true
});
Instance.OnScriptInput("FetchSoundevents", () => {
    Init();
});
Instance.OnScriptInput("NukeCountdown", (context) => {
    nuke_countdown(context);
});
Instance.OnScriptInput("EnforcePlayerModels", (context) => {
    enforce_player_models(context.activator);
});
Instance.OnScriptInput("ChangeModeCrane", (context) => {
    stop_move_crane_all();
    if (crane_mode === "MOVE") {
        crane_mode = 'LIFT';
        Instance.EntFireAtName("Crane01LightLiftMode", "Color", "0 255 0");
        Instance.EntFireAtName("Crane01LightMoveMode", "Color", "255 255 255");
    }
    else if (crane_mode === "LIFT") {
        crane_mode = 'MOVE';
        Instance.EntFireAtName("Crane01LightMoveMode", "Color", "0 255 0");
        Instance.EntFireAtName("Crane01LightLiftMode", "Color", "255 255 255");
    }
});
Instance.OnScriptInput("StopMoveCraneAll", () => {
    stop_move_crane_all();
    Instance.EntFireAtName("crane_ui", "deactivate");
    Instance.EntFireAtName("crane_button", "Unlock", null, 0.04);
    Instance.EntFireAtName("crane_button", "Color", "0 255 0");
});
Instance.OnScriptInput("StopMoveCraneW", () => {
    stop_move_crane('w', crane_mode);
});
Instance.OnScriptInput("StopMoveCraneA", () => {
    stop_move_crane('a', crane_mode);
});
Instance.OnScriptInput("StopMoveCraneS", () => {
    stop_move_crane('s', crane_mode);
});
Instance.OnScriptInput("StopMoveCraneD", () => {
    stop_move_crane('d', crane_mode);
});
Instance.OnScriptInput("MoveCraneW", () => {
    move_crane('w', crane_mode);
});
Instance.OnScriptInput("MoveCraneA", () => {
    move_crane('a', crane_mode);
});
Instance.OnScriptInput("MoveCraneS", () => {
    move_crane('s', crane_mode);
});
Instance.OnScriptInput("MoveCraneD", () => {
    move_crane('d', crane_mode);
});
Instance.OnScriptInput("AttachContainerToCrane", (context) => {
    if (context.activator.GetClassName() == "prop_physics_override" && context.activator.GetEntityName() == "spawn_phys_props") {
        // let crane_box_up_down_origin = Instance.FindEntityByName("crane_box_up_down").GetAbsOrigin()
        // context.activator.Teleport(new Vec3(crane_box_up_down_origin.x, crane_box_up_down_origin.y, crane_box_up_down_origin.z), new Euler(0, 0, 0), new Vec3(0, 0, 0))
        Instance.EntFireAtTarget(context.activator, "DisableMotion");
        Instance.EntFireAtTarget(context.activator, "SetParent", "crane_box_up_down");
    }
});
Instance.OnScriptInput("ChangeMagnetCrane", () => {
    if (crane_magnet == "ON") {
        crane_magnet = "OFF";
        Instance.EntFireAtName("spawn_phys_props", "ClearParent");
        Instance.EntFireAtName("spawn_phys_props", "EnableMotion", null, 0.02);
        Instance.EntFireAtName("Crane01LightMagnetOFF", "Color", "0 255 0");
        Instance.EntFireAtName("Crane01LightMagnetON", "Color", "255 255 255");
        Instance.EntFireAtName("magnet_trigger", "Disable");
    }
    else {
        crane_magnet = "ON";
        Instance.EntFireAtName("Crane01LightMagnetON", "Color", "0 255 0");
        Instance.EntFireAtName("Crane01LightMagnetOFF", "Color", "255 255 255");
        Instance.EntFireAtName("magnet_trigger", "Enable");
    }
});
Instance.OnScriptInput("fixCranePathPos", () => {
    let main_crane = Instance.FindEntityByName("crane_box_left_right");
    let front_back_crane = Instance.FindEntityByName("crane_box_front_back");
    path_tracks_front_back.forEach((p) => {
        if (p.IsValid()) {
            p.Teleport({ x: p.GetAbsOrigin().x, y: main_crane.GetAbsOrigin().y, z: p.GetAbsOrigin().z }, { pitch: 0, yaw: 0, roll: 0 }, { x: 0, y: 0, z: 0 });
        }
    });
    path_tracks_up_down.forEach((p) => {
        if (p.IsValid()) {
            p.Teleport({ x: front_back_crane.GetAbsOrigin().x, y: main_crane.GetAbsOrigin().y, z: p.GetAbsOrigin().z }, { pitch: 0, yaw: 0, roll: 0 }, { x: 0, y: 0, z: 0 });
        }
    });
});
Instance.OnPlayerChat((event) => {
    if (allow_saysounds) {
        play_sound(event.player, event.text);
    }
});
Instance.OnRoundStart(() => {
    Init();
});
Instance.OnReload(Init);
Instance.SetThink(() => {
    RunThinkQueue();
});
