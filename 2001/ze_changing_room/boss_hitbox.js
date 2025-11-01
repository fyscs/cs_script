// @ts-nocheck
//by 凯岩城的狼
import { Instance } from "cs_script/point_script";

// 配置：目标实体名
const HITBOX_NAME = "dd_phy"; // func_phybox 的 targetname
const BOSS_BAR_NAME = "lv4_boss_hp_bar"; // env_particle_glow 的 targetname

// 配置：数值规则
const BASE_HP = 10000; // 初始基础血量
const CT_BONUS = 800; // 每个存活 CT 增加
const HURT_DELTA = 20; // 每次 hurt 扣血
const BAR_STEPS = 40; // 进度条从 39 到 0（共 40 档）

const state = {
	maxHp: 0,
	hp: 0,
	hitbox: undefined,
	lastHurtAt: 0,
	didBreak: false
};

function clamp(v, lo, hi) {
	return Math.max(lo, Math.min(hi, v));
}

function log(_msg) {}

function breakHitbox() {
    try {
        const bound = state.hitbox;
        if (bound && bound.IsValid?.()) {
            Instance.EntFireAtTarget({ target: bound, input: "Break" });
            return;
        }
        const ent = Instance.FindEntityByName(HITBOX_NAME);
        if (ent) {
            Instance.EntFireAtTarget({ target: ent, input: "Break" });
            return;
        }
        Instance.EntFireAtName({ name: HITBOX_NAME, input: "Break" });
    } catch (error) {
        // 静默处理错误
    }
}

// debug scanning removed per request

function countAliveCT() {
	try {
		let count = 0;
		const players = Instance.FindEntitiesByClass("player");
		for (const p of players) {
			if (!p || !p.IsValid()) {
				continue;
			}
			if (p.GetTeamNumber() === 3 && p.IsAlive()) {
				count++;
			}
		}
		return count;
	} catch (error) {
		return 0;
	}
}

function updateBossBar() {
	try {
		if (state.maxHp <= 0) {
			Instance.EntFireAtName({ name: BOSS_BAR_NAME, input: "SetAlphaScale", value: 0 });
			return;
		}
		// 可视步进使用 BAR_STEPS-1（如 40 档时显示 0..39）
		const stepsVisible = Math.max(1, BAR_STEPS - 1);
		const step = clamp(Math.floor((state.hp / state.maxHp) * stepsVisible), 0, stepsVisible);
		Instance.EntFireAtName({ name: BOSS_BAR_NAME, input: "SetAlphaScale", value: step });
	} catch (error) {
		// 静默处理错误
	}
}

function initBossHp() {
	try {
		const aliveCT = countAliveCT();
		state.maxHp = BASE_HP + aliveCT * CT_BONUS;
		state.hp = state.maxHp;
		state.hitbox = Instance.FindEntityByName(HITBOX_NAME);
		state.didBreak = false;
		log(`init -> aliveCT=${aliveCT}, maxHp=${state.maxHp}`);
		updateBossBar();
	} catch (error) {
		// 静默处理错误
	}
}

function applyHurt() {
	try {
		if (state.maxHp <= 0) {
			log("hurt received before init -> auto init");
			initBossHp();
		}
		// 简单节流：避免同一帧多次扣血
		const now = Instance.GetGameTime?.() ?? Date.now() / 1000;
		if (now - state.lastHurtAt < 0.05) {
			return;
		}
		state.lastHurtAt = now;
		state.hp = clamp(state.hp - HURT_DELTA, 0, state.maxHp);
		log(`hurt -> hp=${state.hp}/${state.maxHp}, didBreak=${state.didBreak}`);
		updateBossBar();
		if (state.hp <= 0) {
			log("hp <= 0 -> Break hitbox (force)");
			breakHitbox();
			state.didBreak = true;
		}
	} catch (error) {
		// 静默处理错误
	}
}

// RunScriptInput: 仅绑定一次，避免重复触发
Instance.OnScriptInput("start", (inputData) => {
    try {
        // 若通过触发器直接调用，尝试绑定 caller 为目标
        if (inputData?.caller && inputData.caller.IsValid?.()) {
            state.hitbox = inputData.caller;
        }
        initBossHp();
    } catch (error) {
        // 静默处理错误
    }
});

Instance.OnScriptInput("hurt", (inputData) => {
    try {
        if (!state.hitbox && inputData?.caller && inputData.caller.IsValid?.()) {
            state.hitbox = inputData.caller;
        }
        applyHurt();
    } catch (error) {
        // 静默处理错误
    }
});

// 直接测试破坏
// debug/test inputs removed per request

// 思考函数
function ScriptThink() {
    Instance.SetNextThink(0.1);
}

// 初始化函数
function Init() {
    Instance.SetNextThink(0.1);
    log("initialized");
}

// 热重载/激活确保状态不丢失
Instance.OnActivate(() => {
    Init();
    log("activated (waiting for RunScriptInput start)");
});

Instance.OnScriptReload({
    after: () => {
        Init();
        log("reloaded");
        updateBossBar();
    }
});

// 设置思考函数
Instance.SetThink(ScriptThink);
Instance.SetNextThink(0.1);



