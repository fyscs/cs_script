import { Instance } from "cs_script/point_script";

// Debug logging - set to false to disable movement logs
const MOVEMENT_DEBUG_LOGGING = false;
const SCRIPT_ENTITY_NAME = "st4_boss2_script";
const MIN_SCHEDULER_INTERVAL = 0.1;
const MIN_MOVEMENT_LOOP_INTERVAL = 0.1;
const MOVEMENT_STEP_RATE = 0.02;

let _rngState = 0;
function _seedRngIfNeeded() {
    if (!_rngState) {
        _rngState = (Math.floor(Math.random() * 0xffffffff) >>> 0) || 1;
    }
}
function _xorshift32() {
    _seedRngIfNeeded();
    let x = _rngState >>> 0;
    x ^= (x << 13) >>> 0;
    x >>>= 0;
    x ^= x >>> 17;
    x >>>= 0;
    x ^= (x << 5) >>> 0;
    x >>>= 0;
    _rngState = x;
    return x >>> 0;
}

function RandomInt(min, max) {
    min = Math.floor(min);
    max = Math.floor(max);
    if (isNaN(min) || isNaN(max)) return 0;
    if (max < min) {
        const t = min;
        min = max;
        max = t;
    }
    const range = (max - min) + 1;
    if (range <= 1) return min;

    const maxUInt = 0xffffffff >>> 0;
    const limit = maxUInt - ((maxUInt + 1) % range);
    let r;
    do {
        r = _xorshift32();
    } while (r > limit);
    return min + (r % range);
}

// Simple scheduler (RunScriptInput self-scheduling) using a min-heap for low overhead.
const _taskHeap = [];
let _schedulerScheduled = false;

function heapPush(task) {
    _taskHeap.push(task);
    let i = _taskHeap.length - 1;
    while (i > 0) {
        const p = Math.floor((i - 1) / 2);
        if (_taskHeap[p].runAt <= _taskHeap[i].runAt) break;
        const tmp = _taskHeap[p];
        _taskHeap[p] = _taskHeap[i];
        _taskHeap[i] = tmp;
        i = p;
    }
}

function heapPop() {
    if (_taskHeap.length === 0) return undefined;
    const root = _taskHeap[0];
    const last = _taskHeap.pop();
    if (_taskHeap.length === 0) return root;
    _taskHeap[0] = last;
    let i = 0;
    while (true) {
        const l = 2 * i + 1;
        const r = l + 1;
        let smallest = i;
        if (l < _taskHeap.length && _taskHeap[l].runAt < _taskHeap[smallest].runAt) smallest = l;
        if (r < _taskHeap.length && _taskHeap[r].runAt < _taskHeap[smallest].runAt) smallest = r;
        if (smallest === i) break;
        const tmp = _taskHeap[i];
        _taskHeap[i] = _taskHeap[smallest];
        _taskHeap[smallest] = tmp;
        i = smallest;
    }
    return root;
}

function heapPeek() {
    return _taskHeap.length ? _taskHeap[0] : undefined;
}

function schedule(fn, delaySeconds = 0) {
    const runAt = Instance.GetGameTime() + Math.max(0, delaySeconds);
    heapPush({ runAt, fn });
    ensureScheduler();
}

function ensureScheduler() {
    if (_schedulerScheduled) return;
    _schedulerScheduled = true;
    Instance.EntFireAtName({ name: SCRIPT_ENTITY_NAME, input: "RunScriptInput", value: "SchedulerTick", delay: MIN_SCHEDULER_INTERVAL });
}

function runScheduler() {
    _schedulerScheduled = false;
    const now = Instance.GetGameTime();
    while (true) {
        const next = heapPeek();
        if (!next || next.runAt > now + 0.0001) break;
        const task = heapPop();
        try {
            task.fn();
        } catch (e) {
            try { Instance.Msg(`[st4boss2] task error: ${e}`); } catch (e2) { }
        }
    }
    const upcoming = heapPeek();
    if (upcoming) {
        const delay = Math.max(MIN_SCHEDULER_INTERVAL, upcoming.runAt - now);
        _schedulerScheduled = true;
        Instance.EntFireAtName({ name: SCRIPT_ENTITY_NAME, input: "RunScriptInput", value: "SchedulerTick", delay });
    }
}

function getAlivePlayers() {
    const players = Instance.FindEntitiesByClass("player") || [];
    return players.filter((p) => p.GetTeamNumber() === 3 && p.GetHealth() > 0);
}

// Boss state
const state = {
    bossHealth: 100.0,
    playerCount: 0,
    lives: 5,
    atkCycle: 3,
    skillCycle: 10,
    atkTick: true,
    bossKilled: false,
    atkName: "",
    orbFlag: 0,
    h2BreakCount: 4,
    tickHealthLoop: false,
    skillPool: [],
    currentSkill: null
};

// Movement instance (func_movelinear based; see block below)
let movement = null;

function logInit(msg) {
    try { Instance.Msg(`[st4boss2] ${msg}`); } catch (e) { }
}

function resetBossState() {
    state.bossHealth = 100.0;
    state.playerCount = 0;
    state.lives = 5;
    state.atkCycle = 3;
    state.skillCycle = 10;
    state.atkTick = false;
    state.bossKilled = false;
    state.atkName = "";
    state.orbFlag = 0;
    state.h2BreakCount = 4;
    state.tickHealthLoop = false;
    state.skillPool = [];
    state.currentSkill = null;

    try {
        _taskHeap.length = 0;
    } catch (e) { }
    _schedulerScheduled = false;

    try {
        if (movement) {
            movement.stop();
            movement.resume();
        }
    } catch (e) { }
}

// ===================== HP SYSTEM =====================
function AddHealth(value) {
    const players = getAlivePlayers();
    for (const p of players) {
        state.bossHealth += value;
        state.playerCount++;
    }
}

function SubHealthbyShoot() {
    state.bossHealth -= 1;
}

function SubHealthbyNade() {
    state.bossHealth -= 50;
}

function SubHealth(value) {
    if (value === 0) {
        state.bossHealth -= 120;
    } else if (value === 1) {
        state.bossHealth -= 150;
    } else if (value === 999) {
        state.bossHealth -= 999999;
    }
}

function TickHealth() {
    if (!state.tickHealthLoop) return;

    if (state.bossHealth < 1 && !state.bossKilled) {
        BossKilled();
        state.bossKilled = true;
        state.atkTick = false;
    }

    Instance.EntFireAtName({ name: "st4_boss2_counter", input: "SetValue", value: `${state.bossHealth.toFixed(0)}`, delay: 0.0 });
    HPText();

    schedule(TickHealth, 0.1);
}

function HPText() {
    const target = "st4_Boss_text"; // point_worldtext targetname
    const base = "<Aessidhe>\n HP: ";
    const hpText = state.bossHealth > 0 ? `${state.bossHealth.toFixed(0)}` : "0";
    // const message = `${base}${hpText}${state.atkName}`;
    const message = `${base}${hpText}`;
    Instance.EntFireAtName({ name: target, input: "Color", value: "255 255 255 230", delay: 0.0 });
    // point_worldtext: update text via SetMessage
    Instance.EntFireAtName({ name: target, input: "SetMessage", value: message, delay: 0.0 });
}

function BossKilled() {
    Stop();
    Instance.EntFireAtName({ name: "st4_boss2_model", input: "SetAnimation", value: "Dying", delay: 0.0 });
    Instance.EntFireAtName({ name: "st4_boss2_model", input: "ClearParent", value: "", delay: 0.0 });
    Instance.EntFireAtName({ name: "st4_boss2_model", input: "KeyValue", value: "targetname st4_boss2_ragdoll", delay: 0.01 });
    Instance.EntFireAtName({ name: "st4_boss2_model", input: "Kill", value: "", delay: 5.01 });

    Instance.EntFireAtName({ name: "st4_boss2_death_expmaker", input: "ClearParent", value: "", delay: 0.0 });
    Instance.EntFireAtName({ name: "st4_boss2_death_expmaker", input: "ForceSpawn", value: "", delay: 4.8 });
    Instance.EntFireAtName({ name: "st4_boss2_death_expmaker", input: "Kill", value: "", delay: 4.82 });

    Instance.EntFireAtName({ name: "st4_boss2_ragdoll", input: "Kill", value: "", delay: 5.0 });
    Instance.EntFireAtName({ name: "st4_boss2_holy*", input: "Kill", value: "", delay: 0.0 });
    Instance.EntFireAtName({ name: "st4_boss2_orb*", input: "Kill", value: "", delay: 0.0 });
    Instance.EntFireAtName({ name: "st4_boss2_attack*", input: "Kill", value: "", delay: 0.0 });
    Instance.EntFireAtName({ name: "st4_boss2_laser*", input: "Kill", value: "", delay: 0.0 });
    Instance.EntFireAtName({ name: "st4_boss2_bullet*", input: "Kill", value: "", delay: 0.0 });
    Instance.EntFireAtName({ name: "st4_boss2_aquaring*", input: "Kill", value: "", delay: 0.0 });
    Instance.EntFireAtName({ name: "st4_boss2_idlepart2", input: "Kill", value: "", delay: 0.0 });

    Instance.EntFireAtName({ name: "st4_end_relay", input: "FireUser1", value: "", delay: 1.0 });
}

// ===================== ATK CYCLE =====================
// ===================== SKILL POOL SYSTEM =====================
function createSkillPool() {
    const repeat = (item, count) => Array(count).fill(item);
    return [
        ...repeat('Holy1', 10),
        ...repeat('Holy2', 10),
        ...repeat('Holy3', 10),
        ...repeat('Meteor', 25),
        ...repeat('Aquaring', 20),
        ...repeat('Orb', 15),
        ...repeat('Tornado', 15),
        ...repeat('CrossCut', 10)
    ];
}

function initSkillPool() {
    state.skillPool = createSkillPool();
    // Fisher-Yates shuffle
    for (let i = state.skillPool.length - 1; i > 0; i--) {
        const j = RandomInt(0, i);
        const temp = state.skillPool[i];
        state.skillPool[i] = state.skillPool[j];
        state.skillPool[j] = temp;
    }
    state.currentSkill = null;
}

function drawSkillFromPool() {
    if (state.skillPool.length === 0) {
        initSkillPool();
    }
    const skill = state.skillPool.pop();

    if (state.skillPool.length < 50) {
        initSkillPool();
    }
    return skill;
}

function consumeExtraSkillCopies(skillType, extraCount) {
    if (!skillType || extraCount <= 0) return;

    for (let i = state.skillPool.length - 1; i >= 0 && extraCount > 0; i--) {
        if (state.skillPool[i] === skillType) {
            state.skillPool.splice(i, 1);
            extraCount--;
        }
    }

    if (state.skillPool.length < 50) {
        initSkillPool();
    }
}

function executeSkillAction(skillType) {
    let delay = 3.0;
    let message = "";
    
    switch (skillType) {
        case 'Holy1':
            AessidheHoly1();
            delay = 8.9;
            message = "say < Mercury Strike - Go to side. >";
            state.atkName = "\n< Mercury Strike - Go to side. >";
            break;
        case 'Holy2':
            AessidheHoly2();
            delay = 9.9;
            message = "say < Break all water columns at the corners. >";
            state.atkName = "\n";
            break;
        case 'Holy3':
            AessidheHoly3();
            delay = 9.5;
            message = "say < Get in the circles for obtaining immunity. >";
            state.atkName = "\n< Holy - Get in the circles for obtaining immunity. >";
            break;
        case 'Meteor':
            AessidheMeteor();
            delay = 6.0;
            state.atkName = "\n";
            break;
        case 'Aquaring':
            AessidheAquaring();
            delay = 9.9;
            state.atkName = "\n< Aquaring >";
            break;
        case 'Orb':
            if (state.orbFlag === 0) {
                AessidheOrb();
                state.orbFlag = 1;
                schedule(() => { state.orbFlag = 0; }, 13.0);
            }
            delay = 3.0;
            state.atkName = "\n";
            break;
        case 'Tornado':
            AessidheTornado();
            delay = 4.5;
            state.atkName = "\n< Tornado >";
            break;
        case 'CrossCut':
            AessidheCrossCut();
            delay = 9.9;
            message = "say < CrossCut - Get out of the corners. >";
            state.atkName = "\n< CrossCut >";
            break;
    }
    
    if (message) {
        Instance.EntFireAtName({ name: "server", input: "Command", value: message, delay: 0.0 });
    }
    
    return delay;
}

// ===================== ATK CYCLE =====================
function RandomAttack() {
    if (!state.atkTick) return;

    const atkNum = RandomInt(0, 99);
    if (atkNum <= 24) {
        Instance.EntFireAtName({ name: "st4_boss2_model", input: "SetAnimation", value: "Slash_3combo", delay: 0.0 });
        Instance.EntFireAtName({ name: "st4_boss2_model", input: "SetAnimation", value: "walk", delay: 6.5 });
        AessidheLaser1();
        const randomsec = RandomInt(-2, 2) + state.atkCycle;
        schedule(RandomAttack, 6.0 + randomsec);
    } else if (atkNum <= 49) {
        Instance.EntFireAtName({ name: "st4_boss2_model", input: "SetAnimation", value: "Slash_3combo", delay: 0.0 });
        Instance.EntFireAtName({ name: "st4_boss2_model", input: "SetAnimation", value: "walk", delay: 6.5 });
        AessidheLaser2();
        const randomsec = RandomInt(-2, 2) + state.atkCycle;
        schedule(RandomAttack, 6.0 + randomsec);
    } else if (atkNum <= 74) {
        Instance.EntFireAtName({ name: "st4_boss2_model", input: "SetAnimation", value: "aessidhe_attack_dash_slash", delay: 0.0 });
        Instance.EntFireAtName({ name: "st4_boss2_model", input: "SetAnimation", value: "walk", delay: 3.0 });
        schedule(AessidheLaser3, 1.0);
        const randomsec = RandomInt(-2, 2) + state.atkCycle;
        schedule(RandomAttack, 4.0 + randomsec);
    } else if (atkNum <= 99) {
        Instance.EntFireAtName({ name: "st4_boss2_model", input: "SetAnimation", value: "aessidhe_attack_dash_slash", delay: 0.0 });
        Instance.EntFireAtName({ name: "st4_boss2_model", input: "SetAnimation", value: "walk", delay: 3.0 });
        schedule(AessidheBullet, 1.00);
        const randomsec = RandomInt(-2, 2) + state.atkCycle;
        schedule(RandomAttack, 4.0 + randomsec);
    } else {
        Instance.EntFireAtName({ name: "server", input: "Command", value: "say Attack System got any error!!", delay: 0.0 });
        schedule(RandomAttack, 4.0);
    }
}

function RandomSkill() {
    if (!state.atkTick) return;

    const skill = drawSkillFromPool();
    if (skill === 'Orb') {
        consumeExtraSkillCopies(skill, Number.MAX_SAFE_INTEGER);
    } else {
        consumeExtraSkillCopies(skill, 3);
    }

    const randomsec = RandomInt(-2, 2) + state.skillCycle;
    const delay = executeSkillAction(skill);

    schedule(RandomSkill, delay + randomsec);
}

// ===================== Attacks =====================
function AessidheLaser1() {
    Instance.EntFireAtName({ name: "st4_boss2_attackhigh_maker", input: "KeyValue", value: "EntityTemplate st4_boss2_laser_temp", delay: 0.0 });
    Instance.EntFireAtName({ name: "st4_boss2_attackhigh_maker", input: "ForceSpawn", value: "", delay: 2.1 });
    Instance.EntFireAtName({ name: "st4_boss2_attackhigh_maker", input: "ForceSpawn", value: "", delay: 2.75 });
    Instance.EntFireAtName({ name: "st4_boss2_attackhigh_maker", input: "ForceSpawn", value: "", delay: 3.9 });
}

function AessidheLaser2() {
    Instance.EntFireAtName({ name: "st4_boss2_attacklow_maker", input: "KeyValue", value: "EntityTemplate st4_boss2_laser2_temp", delay: 0.0 });
    Instance.EntFireAtName({ name: "st4_boss2_attacklow_maker", input: "ForceSpawn", value: "", delay: 2.6 });
    Instance.EntFireAtName({ name: "st4_boss2_attacklow_maker", input: "ForceSpawn", value: "", delay: 3.5 });
    Instance.EntFireAtName({ name: "st4_boss2_attacklow_maker", input: "ForceSpawn", value: "", delay: 4.5 });
}

function AessidheLaser3() {
    Instance.EntFireAtName({ name: "st4_boss2_attackhigh_maker", input: "KeyValue", value: "EntityTemplate st4_boss2_laser3_temp", delay: 0.0 });
    Instance.EntFireAtName({ name: "st4_boss2_attackhigh_maker", input: "ForceSpawn", value: "", delay: 0.02 });
}

function AessidheBullet() {
    Instance.EntFireAtName({ name: "st4_boss2_attacklow_maker", input: "KeyValue", value: "EntityTemplate st4_boss2_bullet_temp", delay: 0.0 });
    Instance.EntFireAtName({ name: "st4_boss2_attacklow_maker", input: "ForceSpawn", value: "", delay: 0.02 });
}

function AessidheHoly1() {
    const template = Instance.FindEntityByName("st4_boss2_holy1_template");
    if (template && template.IsValid()) {
        template.ForceSpawn({ x: 6016, y: 9024, z: -64 });
    }
}

function AessidheHoly2() {
    const template = Instance.FindEntityByName("st4_boss2_holy2_template");
    if (template && template.IsValid()) {
        template.ForceSpawn({ x: 6016, y: 8992, z: 128 });
    }
    const atkselect = 1;
    if (atkselect === 1) {
        Instance.EntFireAtName({ name: "st4_boss2_holy2_relay1", input: "AddOutput", value: "OnUser1>st4_boss2_script>RunScriptInput>AessidheHoly2_1>5.00>1", delay: 0.02 });
    }
    Instance.EntFireAtName({ name: "st4_boss2_holy2_relay1", input: "FireUser1", value: "", delay: 0.04 });
}

function AessidheHoly2break() {
    state.h2BreakCount--;
}

function AessidheHoly2_1() {
    if (state.h2BreakCount < 1) {
        Instance.EntFireAtName({ name: "st4_boss2_holy2_relay1", input: "CancelPending", value: "", delay: 0.0 });
        Instance.EntFireAtName({ name: "st4_boss2_holy2_relay1", input: "FireUser2", value: "", delay: 0.01 });
        state.h2BreakCount = 4;
        return;
    }

    const players = Instance.FindEntitiesByClass("player") || [];
    for (const p of players) {
        if (p.GetTeamNumber() === 3) {
            p.TakeDamage({ damage: 5 });
        }
    }

    schedule(AessidheHoly2_1, 1.0);
}

function AessidheHoly3() {
    const yaw = RandomInt(0, 360);
    Instance.EntFireAtName({ name: "st4_boss2_holy3_maker", input: "KeyValue", value: `angles 0 ${yaw} 0`, delay: 0.0 });
    Instance.EntFireAtName({ name: "st4_boss2_holy3_maker", input: "ForceSpawn", value: "", delay: 0.01 });
}

function AessidheMeteor() {
    for (let i = 0; i < 3; i++) {
        schedule(AessidheMeteorSpawn, 2.0 * i);
    }
}

function AessidheMeteorSpawn() {
    let meteorTemplate = Instance.FindEntityByName("st4_boss2_meteor_template");
    if (!meteorTemplate || !meteorTemplate.IsValid()) return;
    const target = getAlivePlayers()[0];
    if (!target) return;
    meteorTemplate.ForceSpawn(target.GetAbsOrigin());
}

function AessidheAquaring() {
    const template = Instance.FindEntityByName("st4_boss2_aquaring_template");
    if (template && template.IsValid()) {
        template.ForceSpawn({ x: 6016, y: 8992, z: 443 });
    }
}

function AessidheOrb() {
    Instance.EntFireAtName({ name: "st4_boss2_orb_rotate", input: "Start", value: "", delay: 0.0 });
    Instance.EntFireAtName({ name: "st4_boss2_orb_part", input: "Start", value: "", delay: 0.0 });
    Instance.EntFireAtName({ name: "st4_boss2_orb_hurt", input: "Enable", value: "", delay: 0.0 });

    Instance.EntFireAtName({ name: "st4_boss2_orb_rotate", input: "Stop", value: "", delay: 12.0 });
    Instance.EntFireAtName({ name: "st4_boss2_orb_part", input: "Stop", value: "", delay: 12.0 });
    Instance.EntFireAtName({ name: "st4_boss2_orb_hurt", input: "Disable", value: "", delay: 12.0 });
}

function AessidheTornado() {
    const template = Instance.FindEntityByName("st4_boss2_tornado_temp");
    if (!template || !template.IsValid()) return;
    for (let i = 0; i < 4; i++) {
        schedule(() => {
            const target = getAlivePlayers()[0];
            if (!target) return;
            const yaw = RandomInt(0, 359);
            template.ForceSpawn({
                ...target.GetAbsOrigin(),
                angles: { x: 0, y: yaw, z: 0 }
            });
        }, i * 3.5);
    }
}
function AessidheCrossCut() {
    const template = Instance.FindEntityByName("st4_boss2_cross_temp");
    if (!template || !template.IsValid()) return;
    const pattern = RandomInt(0, 3);
    if (pattern === 0) {
        template.ForceSpawn({ x: 6656, y: 9664, z: 128 });
    } else if (pattern === 1) {
        template.ForceSpawn({ x: 6656, y: 8384, z: 128 });
    } else if (pattern === 2) {
        template.ForceSpawn({ x: 5376, y: 8384, z: 128 });
    } else if (pattern === 3) {
        template.ForceSpawn({ x: 5376, y: 9664, z: 128 });
    }
}

// ===================== Movement (func_movelinear) =====================
// Teleport-based movement (no func_movelinear)
const MOVEMENT_CONFIG = {
    tickRate: MIN_MOVEMENT_LOOP_INTERVAL,
    rotationTickRate: MIN_MOVEMENT_LOOP_INTERVAL,
    movementStepRate: MOVEMENT_STEP_RATE,
    rotationStepRate: MOVEMENT_STEP_RATE,
    targetDistance: 5000,
    maxSpeed: 420,
    acceleration: 0.3,
    enableZMovement: false,
    minDistanceToTarget: 50,
    targetRetargetInterval: 6.0,
    bossMoverName: "st4_boss2_mover",
    bossRotName: "st4_boss2_rot",
    rotationOffset: 0
};

function ensureMovement() {
    if (!movement) {
        movement = new TeleportMovementSystem(MOVEMENT_CONFIG);
    }
}

function Start() {
    ensureMovement();
    state.atkTick = true;
    movement.start();
    movement.searchTarget();

    if (!state.tickHealthLoop) {
        state.tickHealthLoop = true;
        TickHealth();
    }

    // Initialize skill pool
    initSkillPool();

    schedule(RandomAttack, 0.01);
    schedule(RandomSkill, 0.01);

    Instance.EntFireAtName({ name: "st4_boss2_measure_movement", input: "SetMeasureTarget", value: "st4_boss2_rot", delay: 0.00 });
    Instance.EntFireAtName({ name: "st4_boss2_measure_movement", input: "SetTarget", value: "st4_boss2_model", delay: 0.00 });
    Instance.EntFireAtName({ name: "st4_boss2_measure_movement", input: "SetMeasureReference", value: "st4_boss2_physbreak", delay: 0.00 });
    Instance.EntFireAtName({ name: "st4_boss2_measure_movement", input: "SetTargetReference", value: "st4_boss2_physbreak", delay: 0.00 });
    Instance.EntFireAtName({ name: "st4_boss2_measure_movement", input: "Enable", value: "", delay: 0.01 });

    Instance.EntFireAtName({ name: "st4_boss2_damage", input: "Enable", value: "", delay: 0.80 });
    Instance.EntFireAtName({ name: "st4_boss2_bodyhurt", input: "Enable", value: "", delay: 0.80 });
    Instance.EntFireAtName({ name: "st4_boss2_stop_damage", input: "Enable", value: "", delay: 0.80 });
    Instance.EntFireAtName({ name: "hfire_but", input: "AddOutput", value: "OnUser4>st4_boss2_damage>FireUser1>>0>-1", delay: 0.02 });
    Instance.EntFireAtName({ name: "hgrav_but", input: "AddOutput", value: "OnUser4>st4_boss2_damage>FireUser1>>0>-1", delay: 0.02 });
    Instance.EntFireAtName({ name: "hice_but", input: "AddOutput", value: "OnUser4>st4_boss2_stop_damage>FireUser1>>0>-1", delay: 0.02 });
    Instance.EntFireAtName({ name: "hstop_but", input: "AddOutput", value: "OnUser4>st4_boss2_stop_damage>FireUser1>>0>-1", delay: 0.02 });
    Instance.EntFireAtName({ name: "hlance_but", input: "AddOutput", value: "OnUser4>st4_boss2_damage>FireUser1>>0>-1", delay: 0.02 });

    //EntFire("Boss_text", "AddOutput", "color 29 29 255", 0.0);
    logInit("Start");
}

function Stop() {
    movement.stop();
}

function Pause() {
    movement.pause();
}

function Resume() {
    movement.resume();
}

function SetSpeedForw(speed) {
    movement.setSpeedMultiplier(speed);
}

function SearchTarget() {
    movement.searchTarget();
}

Instance.OnScriptInput("Start", () => {
    if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] OnScriptInput(Start) triggered");
    Start();
});
Instance.OnScriptInput("Stop", () => {
    if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] OnScriptInput(Stop) triggered");
    Stop();
});
Instance.OnScriptInput("SchedulerTick", () => {
    runScheduler();
});
Instance.OnRoundStart(() => {
    if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] OnRoundStart: resetting boss state");
    resetBossState();
});
Instance.OnRoundEnd((event) => {
    if (MOVEMENT_DEBUG_LOGGING) Instance.Msg(`[TeleportMovement] OnRoundEnd: winner=${event.winningTeam}, reason=${event.reason}`);
    resetBossState();
});
Instance.OnScriptInput("Pause", () => {
    if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] OnScriptInput(Pause) triggered");
    Pause();
});
Instance.OnScriptInput("Resume", () => {
    if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] OnScriptInput(Resume) triggered");
    Resume();
});
Instance.OnScriptInput("MovementTick", () => movement.tick());
Instance.OnScriptInput("RotationTick", () => movement.rotationTick());
Instance.OnScriptInput("SetSpeedForw", (data) => {
    if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] OnScriptInput(SetSpeedForw) triggered");
    const speed = parseFloat(data && data.value) || 1.0;
    SetSpeedForw(speed);
});
Instance.OnScriptInput("AddHealth", () => {
    if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] OnScriptInput(AddHealth) triggered");
    AddHealth(280);
});
Instance.OnScriptInput("SubHealthbyShoot", () => {
    if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] OnScriptInput(SubHealthbyShoot) triggered");
    SubHealthbyShoot();
});
Instance.OnScriptInput("SubHealthbyNade", () => {
    if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] OnScriptInput(SubHealthbyNade) triggered");
    SubHealthbyNade();
});
Instance.OnScriptInput("SubHealth0", (data) => {
    if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] OnScriptInput(SubHealth) triggered");
    SubHealth(0);
});
Instance.OnScriptInput("SubHealth1", (data) => {
    if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] OnScriptInput(SubHealth) triggered");
    SubHealth(1);
});
Instance.OnScriptInput("TickHealth", () => {
    if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] OnScriptInput(TickHealth) triggered");
    if (!state.tickHealthLoop) {
        state.tickHealthLoop = true;
        TickHealth();
    }
});
Instance.OnScriptInput("AessidheHoly2break", () => {
    if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] OnScriptInput(AessidheHoly2break) triggered");
    AessidheHoly2break();
});
Instance.OnScriptInput("AessidheHoly2_1", () => {
    if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] OnScriptInput(AessidheHoly2_1) triggered");
    AessidheHoly2_1();
});
Instance.OnScriptInput("AessidheHoly2_2", () => {
    if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] OnScriptInput(AessidheHoly2_2) triggered");
    AessidheHoly2_2();
});
Instance.OnScriptInput("AessidheHoly2_3", () => {
    if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] OnScriptInput(AessidheHoly2_3) triggered");
    AessidheHoly2_3();
});
Instance.OnScriptInput("SearchTarget", () => {
    if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] OnScriptInput(SearchTarget) triggered");
    SearchTarget();
});

logInit("st4boss2.js loaded");
if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] MOVEMENT_DEBUG_LOGGING enabled");
Instance.OnActivate(() => {
    Instance.Msg("[TeleportMovement] OnActivate: script initialized");
});

//==============================================================//
//     TELEPORT MOVEMENT SYSTEM                                //
//==============================================================//


// TeleportMovementSystem: Direct teleport-based movement using RunScriptInput self-scheduling
class TeleportMovementSystem {
    constructor(config) {
        this.config = config;
        this.movementStepRate = config.movementStepRate || config.tickRate;
        this.rotationStepRate = config.rotationStepRate || config.rotationTickRate;
        this.bossEntity = null;
        this.bossRotEntity = null;
        this.target = null;
        this.isRunning = false;
        this.isPaused = false;
        this.currentPos = { x: 0, y: 0, z: 0 };
        this.currentVelocityX = 0.0;
        this.currentVelocityY = 0.0;
        this.speedMultiplier = 1.0;
        this.lastLogTime = -999.0;
        this.lastTargetRetargetTime = -999.0;
    }
    
    // Start movement system
    start() {
        if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] TeleportMovementSystem.start() called");
        
        // Find entities
        this.bossEntity = Instance.FindEntityByName(this.config.bossMoverName || "st4_boss2_mover");
        this.bossRotEntity = Instance.FindEntityByName(this.config.bossRotName || "st4_boss2_rot");
        if (!this.bossEntity && this.bossRotEntity) {
            this.bossEntity = this.bossRotEntity;
            if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] WARN: mover not found, falling back to rot as mover");
        }
        if (!this.bossRotEntity && this.bossEntity) {
            this.bossRotEntity = this.bossEntity;
            if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] WARN: rot not found, falling back to mover as rot");
        }
        
        if (!this.bossEntity || !this.bossRotEntity) {
            Instance.Msg("[TeleportMovement] ERROR: Failed to find st4_boss2_mover or st4_boss2_rot entity");
            return;
        }
        
        this.currentPos = this.bossEntity.GetAbsOrigin();
        this.isRunning = true;
        this.isPaused = false;
        this.lastTargetRetargetTime = -999.0;
        this.scheduleNextTick();
        this.scheduleNextRotationTick();
        if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] TeleportMovementSystem started");
    }
    
    // Stop movement system
    stop() {
        if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] TeleportMovementSystem.stop() called");
        this.isRunning = false;
    }
    
    // Pause movement
    pause() {
        if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] TeleportMovementSystem.pause() called");
        this.isPaused = true;
    }
    
    // Resume movement
    resume() {
        if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] TeleportMovementSystem.resume() called");
        this.isPaused = false;
    }
    
    // Set speed multiplier
    setSpeedMultiplier(speed) {
        if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] TeleportMovementSystem.setSpeedMultiplier(" + speed + ")");
        this.speedMultiplier = speed;
    }
    
    // Schedule next movement tick via RunScriptInput
    scheduleNextTick() {
        if (!this.isRunning) return;
        Instance.EntFireAtName({ name: "st4_boss2_script", input: "RunScriptInput", value: "MovementTick", delay: this.config.tickRate });
    }
    
    // Schedule next rotation tick via RunScriptInput
    scheduleNextRotationTick() {
        if (!this.isRunning) return;
        Instance.EntFireAtName({ name: "st4_boss2_script", input: "RunScriptInput", value: "RotationTick", delay: this.config.rotationTickRate });
    }
    
    // Main movement tick - called via OnScriptInput("MovementTick")
    tick() {
        if (!this.isRunning) {
            this.scheduleNextTick();
            return;
        }
        
        this.scheduleNextTick();
        
        if (!this.bossEntity || !this.bossEntity.IsValid()) {
            Instance.Msg("[TeleportMovement] ERROR: Boss entity lost");
            return;
        }
        
        // Update current position
        this.currentPos = this.bossEntity.GetAbsOrigin();
        
        // Decelerate if paused or no target
        if (this.isPaused || !this.target || !this.target.IsValid()) {
            this.currentVelocityX *= (1.0 - this.config.acceleration);
            this.currentVelocityY *= (1.0 - this.config.acceleration);
            
            if (Math.abs(this.currentVelocityX) < 1.0) this.currentVelocityX = 0.0;
            if (Math.abs(this.currentVelocityY) < 1.0) this.currentVelocityY = 0.0;
            
            // Apply velocity
            this.currentPos.x += this.currentVelocityX * this.movementStepRate;
            this.currentPos.y += this.currentVelocityY * this.movementStepRate;
            
            this.bossEntity.Teleport({ position: this.currentPos });
            return;
        }
        
        // Get target position
        const targetPos = this.target.GetAbsOrigin();
        const deltaX = targetPos.x - this.currentPos.x;
        const deltaY = targetPos.y - this.currentPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Stop if too close
        if (distance < this.config.minDistanceToTarget) {
            this.currentVelocityX *= 0.5;
            this.currentVelocityY *= 0.5;
            
            if (Math.abs(this.currentVelocityX) < 1.0) this.currentVelocityX = 0.0;
            if (Math.abs(this.currentVelocityY) < 1.0) this.currentVelocityY = 0.0;
            
            this.currentPos.x += this.currentVelocityX * this.movementStepRate;
            this.currentPos.y += this.currentVelocityY * this.movementStepRate;
            
            this.bossEntity.Teleport({ position: this.currentPos });
            return;
        }
        
        // Calculate desired velocity
        const desiredVelX = (deltaX / distance) * this.config.maxSpeed * this.speedMultiplier;
        const desiredVelY = (deltaY / distance) * this.config.maxSpeed * this.speedMultiplier;
        
        // Apply acceleration interpolation
        this.currentVelocityX += (desiredVelX - this.currentVelocityX) * this.config.acceleration;
        this.currentVelocityY += (desiredVelY - this.currentVelocityY) * this.config.acceleration;
        
        // Clamp velocity
        this.currentVelocityX = Math.max(-this.config.maxSpeed, Math.min(this.config.maxSpeed, this.currentVelocityX));
        this.currentVelocityY = Math.max(-this.config.maxSpeed, Math.min(this.config.maxSpeed, this.currentVelocityY));
        
        // Update position
        this.currentPos.x += this.currentVelocityX * this.movementStepRate;
        this.currentPos.y += this.currentVelocityY * this.movementStepRate;
        
        // Handle Z movement if enabled
        if (this.config.enableZMovement) {
            const deltaZ = targetPos.z - this.currentPos.z;
            if (Math.abs(deltaZ) > 10) {
                this.currentPos.z += (deltaZ / Math.abs(deltaZ)) * this.config.maxSpeed * this.movementStepRate;
            }
        }
        
        // Teleport to new position
        this.bossEntity.Teleport({ position: this.currentPos });
        this.refreshTargetIfNeeded();
        
        // Debug logging
        if (MOVEMENT_DEBUG_LOGGING) {
            const currentTime = Instance.GetGameTime();
            if ((currentTime - this.lastLogTime) >= 2.0) {
                this.lastLogTime = currentTime;
                Instance.Msg(`[TeleportMovement] Dist: ${distance.toFixed(1)}, VelX: ${this.currentVelocityX.toFixed(1)}, VelY: ${this.currentVelocityY.toFixed(1)}`);
            }
        }
    }

    refreshTargetIfNeeded(force = false) {
        if (!this.isRunning || this.isPaused) {
            return;
        }

        const now = Instance.GetGameTime();
        if (!force && (now - this.lastTargetRetargetTime) < this.config.targetRetargetInterval) {
            return;
        }

        this.lastTargetRetargetTime = now;
        this.searchTarget(force);
    }
    
    // Rotation tick - called via OnScriptInput("RotationTick")
    rotationTick() {
        if (!this.isRunning || !this.bossRotEntity || !this.bossRotEntity.IsValid()) {
            this.scheduleNextRotationTick();
            return;
        }
        
        this.scheduleNextRotationTick();
        
        if (this.isPaused || !this.target || !this.target.IsValid()) {
            return;
        }
        
        const currentPos = this.bossEntity ? this.bossEntity.GetAbsOrigin() : this.currentPos;
        const targetPos = this.target.GetAbsOrigin();
        const deltaX = targetPos.x - currentPos.x;
        const deltaY = targetPos.y - currentPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance < 1.0) return;
        
        // Calculate target angle
        let targetAngle = Math.atan2(deltaY, deltaX) * (180.0 / Math.PI);
        if (targetAngle < 0) targetAngle += 360;
        
        // Apply rotation offset (for st1boss.js compatibility)
        targetAngle += this.config.rotationOffset;
        while (targetAngle < 0) targetAngle += 360;
        while (targetAngle >= 360) targetAngle -= 360;
        
        // Get current rotation
        const angles = this.bossRotEntity.GetAbsAngles();
        let currentYaw = angles.yaw;
        while (currentYaw < 0) currentYaw += 360;
        while (currentYaw >= 360) currentYaw -= 360;
        
        // Calculate angle difference
        let angleDiff = targetAngle - currentYaw;
        if (angleDiff > 180) angleDiff -= 360;
        if (angleDiff < -180) angleDiff += 360;
        
        // If close enough, set exact angle
        const ROTATION_EPSILON = 2.0;
        if (Math.abs(angleDiff) < ROTATION_EPSILON) {
            this.bossRotEntity.Teleport({
                angles: {
                    pitch: angles.pitch,
                    yaw: targetAngle,
                    roll: angles.roll
                }
            });
            return;
        }
        
        // Rotate towards target
        const maxRotSpeed = 360.0 * this.rotationStepRate; // bounded per update step
        const rotAmount = Math.max(-maxRotSpeed, Math.min(maxRotSpeed, angleDiff));
        const newYaw = currentYaw + rotAmount;
        
        this.bossRotEntity.Teleport({
            angles: {
                pitch: angles.pitch,
                yaw: newYaw,
                roll: angles.roll
            }
        });
    }
    
    // Search for nearest player target
    searchTarget(forceRetarget = false) {
        if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] TeleportMovementSystem.searchTarget() called");
        const previousTarget = this.target;
        this.target = null;
        
        const allPlayers = Instance.FindEntitiesByClass("player");
        if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] Found " + (allPlayers ? allPlayers.length : 0) + " players");
        const candidates = [];
        
        if (allPlayers) {
            for (let player of allPlayers) {
                const teamNum = player.GetTeamNumber();
                const health = player.GetHealth();
                const pos = player.GetAbsOrigin();
                const dist = Math.sqrt(
                    (pos.x - this.currentPos.x) * (pos.x - this.currentPos.x) +
                    (pos.y - this.currentPos.y) * (pos.y - this.currentPos.y) +
                    (pos.z - this.currentPos.z) * (pos.z - this.currentPos.z)
                );
                
                if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] Player: team=" + teamNum + ", health=" + health + ", dist=" + dist.toFixed(0));
                
                // Team 3 = CT (humans)
                if (teamNum == 3 && health > 0 && dist <= this.config.targetDistance) {
                    candidates.push(player);
                }
            }
        }

        if (forceRetarget && previousTarget && previousTarget.IsValid() && candidates.length > 1) {
            const filtered = candidates.filter((player) => player !== previousTarget);
            if (filtered.length > 0) {
                candidates.length = 0;
                for (const player of filtered) {
                    candidates.push(player);
                }
            }
        }
        
        if (candidates.length > 0) {
            this.target = candidates[RandomInt(0, candidates.length - 1)];
            if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] Found target (candidates: " + candidates.length + ")");
        } else {
            if (MOVEMENT_DEBUG_LOGGING) Instance.Msg("[TeleportMovement] No targets found");
        }
    }
}
