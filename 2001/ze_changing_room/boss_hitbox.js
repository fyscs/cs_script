import { Instance } from "cs_script/point_script";

// by 凯岩城的狼
const HITBOX_NAME = "dd_phy"; // func_physbox 的 targetname
const BOSS_BAR_NAME = "lv4_boss_hp_bar"; // env_particle_glow 的 targetname

// 配置：数值规则
const BASE_HP = 4000; // 初始基础血量
const CT_BONUS = 400; // 每个存活 CT 增加
const HURT_DELTA = 20; // 每次 hurt 扣血
const BAR_STEPS = 40; // 进度条从 39 到 0（共 40 档）

const state = {
	maxHp: 0,
	hp: 0,
	hitbox: null,
	lastHurtAt: 0,
	didBreak: false
};

function clamp(v, lo, hi) {
	return Math.max(lo, Math.min(hi, v));
}

function breakHitbox() {
    try {
        const bound = state.hitbox;
        if (bound && typeof bound.IsValid === "function" && bound.IsValid()) {
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
		updateBossBar();
	} catch (error) {
		// 静默处理错误
	}
}

function applyHurt() {
	try {
		if (state.maxHp <= 0) {
			initBossHp();
		}
		const now = Instance.GetGameTime();
		if (now - state.lastHurtAt < 0.05) {
			return;
		}
		state.lastHurtAt = now;
		state.hp = clamp(state.hp - HURT_DELTA, 0, state.maxHp);
		updateBossBar();
		if (state.hp <= 0) {
			breakHitbox();
			state.didBreak = true;
		}
	} catch (error) {
	}
}

// RunScriptInput: 仅绑定一次，避免重复触发
Instance.OnScriptInput("start", (inputData) => {
    try {
        // 若通过触发器直接调用，尝试绑定 caller 为目标
        if (inputData && inputData.caller && typeof inputData.caller.IsValid === "function" && inputData.caller.IsValid()) {
            state.hitbox = inputData.caller;
        }
        initBossHp();
    } catch (error) {
        // 静默处理错误
    }
});

Instance.OnScriptInput("hurt", (inputData) => {
    try {
        if (!state.hitbox && inputData && inputData.caller && typeof inputData.caller.IsValid === "function" && inputData.caller.IsValid()) {
            state.hitbox = inputData.caller;
        }
        applyHurt();
    } catch (error) {
        // 静默处理错误
    }
});

function Init() {
}

Instance.OnActivate(() => {});
Instance.OnScriptReload({
    after: () => {
        updateBossBar();
    }
});
