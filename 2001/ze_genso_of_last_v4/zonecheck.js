import { Instance } from "cs_script/point_script";

// ==============================================================
// zonecheck.js - win/lose resolution on stN_wincheck
// ==============================================================

const SCRIPT_ENTITY_NAME = "wincheck_script";
const MANAGER_NAME = "Manager";

const VALID_ZONE_PATTERN = /^st[1-7]_wincheck$/i;

const COUNTDOWN_BY_STAGE = {
	default: 11.0,
	1: 11.0,
	2: 11.0,
	3: 11.0,
	4: 11.0,
	5: 11.0,
	6: 11.0,
	7: 11.0,
};

const SCORE_BY_STAGE = {
	default: 1,
	1: 100,
	2: 100,
	3: 100,
	4: 1000,
	5: 1,
	6: 1,
	7: 1,
};

const WARNING_MESSAGE = {
	default: [
		"*** ZOMBIES ARE DETECTED ***",
		"*** Kill all zombies in {seconds} seconds ***",
	],
};

const VICTORY_MESSAGE = {
	default: "*** HUMANS WIN ***",
};

const FAIL_MESSAGE = {
	default: "*** Round Failed ***",
};

const STAGEWON_DELAY = 2.5;
const EVAL_DELAY = 0.2;
const CLEANUP_INTERVAL = 0.5;

const TEAM_T = 2;
const TEAM_CT = 3;
const DEBUG_MODE = true;

const objectIdMap = new WeakMap();
let nextObjectId = 1;

function log(msg) {
	try { Instance.Msg(`[WINCHECK] ${msg}`); } catch (e) {}
}

function debugLog(msg) {
	if (!DEBUG_MODE) return;
	try { Instance.Msg(`[WINCHECK-DEBUG] ${msg}`); } catch (e) {}
}

function debugError(scope, err) {
	if (!DEBUG_MODE) return;
	const detail = err && err.message ? err.message : String(err);
	debugLog(`${scope} error: ${detail}`);
}

const zoneStates = new Map();

function isValidZoneName(zoneName) {
	return zoneName ? VALID_ZONE_PATTERN.test(String(zoneName)) : false;
}

function getStageNumber(zoneName) {
	const m = zoneName ? String(zoneName).match(/st(\d+)_wincheck/i) : null;
	return m ? parseInt(m[1], 10) : undefined;
}

function getStageConfig(zoneName) {
	const stage = getStageNumber(zoneName);
	const score = (stage !== undefined && SCORE_BY_STAGE[stage] !== undefined) ? SCORE_BY_STAGE[stage] : (SCORE_BY_STAGE.default ?? 1);
	const warn = (stage !== undefined && WARNING_MESSAGE[stage] !== undefined) ? WARNING_MESSAGE[stage] : (WARNING_MESSAGE.default ?? []);
	const victory = (stage !== undefined && VICTORY_MESSAGE[stage] !== undefined) ? VICTORY_MESSAGE[stage] : (VICTORY_MESSAGE.default ?? "");
	const fail = (stage !== undefined && FAIL_MESSAGE[stage] !== undefined) ? FAIL_MESSAGE[stage] : (FAIL_MESSAGE.default ?? "");
	const countdown = (stage !== undefined && COUNTDOWN_BY_STAGE[stage] !== undefined) ? COUNTDOWN_BY_STAGE[stage] : (COUNTDOWN_BY_STAGE.default ?? 11.0);
	return { stage, score, warn, victory, fail, countdown };
}

function formatLine(line, cfg) {
	return String(line)
		.replace("{seconds}", String(cfg.countdown))
		.replace("{stage}", String(cfg.stage ?? ""));
}

function sendChatLines(lines, startDelay = 0.0, interval = 1.0) {
	if (!lines || lines.length === 0) return;
	for (let i = 0; i < lines.length; i++) {
		const d = startDelay + i * interval;
		try {
			Instance.EntFireAtName({ name: "server", input: "Command", value: `say ${lines[i]}`, delay: d });
		} catch (e) {
			debugError("sendChatLines", e);
		}
	}
}

function setTriggerEnabled(zoneName, enabled) {
	try {
		Instance.EntFireAtName({
			name: zoneName,
			input: enabled ? "Enable" : "Disable",
			value: "",
			delay: 0.0,
		});
	} catch (e) {
		debugError(`setTriggerEnabled:${zoneName}`, e);
	}
}

function getPlayerStableId(player) {
	try {
		if (!player || !player.IsValid()) return null;

		// Preferred: pawn entity index if available in current runtime.
		if (typeof player.GetEntityIndex === "function") {
			const entityIndex = player.GetEntityIndex();
			if (typeof entityIndex === "number" && entityIndex >= 0) {
				return `pawn:${entityIndex}`;
			}
		}

		// Fallback: controller slot (stable per client during round).
		if (typeof player.GetPlayerController === "function") {
			const controller = player.GetPlayerController();
			if (controller && typeof controller.GetPlayerSlot === "function") {
				const slot = controller.GetPlayerSlot();
				if (typeof slot === "number" && slot >= 0) {
					return `slot:${slot}`;
				}
			}
		}

		// Last fallback: object identity token.
		if (!objectIdMap.has(player)) {
			objectIdMap.set(player, nextObjectId++);
		}
		return `obj:${objectIdMap.get(player)}`;
	} catch (e) {
		debugError("getPlayerStableId", e);
		return null;
	}
}

function getState(zoneName) {
	if (!zoneStates.has(zoneName)) {
		zoneStates.set(zoneName, {
			phase: "idle", // idle | checking | waiting | finished
			hcount: 0,
			zcount: 0,
			finalized: false,
			players: new Set(),
			winnerPlayers: new Set(), // stores winning player stable IDs
			killLoopActive: false,
		});
	}
	return zoneStates.get(zoneName);
}

function resetZoneState(state) {
	state.phase = "idle";
	state.hcount = 0;
	state.zcount = 0;
	state.finalized = false;
	state.players.clear();
	state.winnerPlayers.clear();
	state.killLoopActive = false;
}

function resetAllZoneStates() {
	for (const state of zoneStates.values()) {
		resetZoneState(state);
	}
	debugLog(`RoundEnd reset: cleared ${zoneStates.size} zone states`);
}

function scanZonePlayers(state, zoneName) {
	let humans = 0;
	let zombies = 0;
	for (const player of [...state.players]) {
		try {
			if (!player || !player.IsValid() || player.GetHealth() <= 0) {
				state.players.delete(player);
				continue;
			}
			const team = player.GetTeamNumber();
			if (team === TEAM_CT) humans++;
			else if (team === TEAM_T) zombies++;
		} catch (e) {
			state.players.delete(player);
			debugError(`scanZonePlayers:${zoneName}`, e);
		}
	}
	state.hcount = humans;
	state.zcount = zombies;
	return { humans, zombies };
}

function snapshotWinners(state, zoneName) {
	state.winnerPlayers.clear();
	for (const player of [...state.players]) {
		try {
			if (!player || !player.IsValid()) continue;
			const health = player.GetHealth();
			if (health <= 0) continue;
			const team = player.GetTeamNumber();
			if (team !== TEAM_CT) continue;
			const stableId = getPlayerStableId(player);
			if (stableId === null) continue;
			state.winnerPlayers.add(stableId);
			debugLog(`WinnerSnapshot: zone='${zoneName}' id=${stableId} team=${team} hp=${health}`);
		} catch (e) {
			debugError(`snapshotWinners:${zoneName}`, e);
		}
	}
	debugLog(`WinnerSnapshotDone: zone='${zoneName}' winners=${state.winnerPlayers.size}`);
}

function isWinningHuman(state, player) {
	try {
		if (!player || !player.IsValid()) return false;
		const hp = player.GetHealth();
		if (hp <= 0) return false;
		const team = player.GetTeamNumber();
		if (team !== TEAM_CT) return false;
		const stableId = getPlayerStableId(player);
		if (stableId === null) return false;
		return state.winnerPlayers.has(stableId);
	} catch (e) {
		debugError("isWinningHuman", e);
		return false;
	}
}

function cleanupNonWinners(zoneName) {
	const state = getState(zoneName);
	if (!state.killLoopActive) return;

	const allPlayers = Instance.FindEntitiesByClass("player") || [];
	for (const player of allPlayers) {
		try {
			if (!player || !player.IsValid()) continue;
			const hp = player.GetHealth();
			if (hp <= 0) continue;
			const team = player.GetTeamNumber();
			const stableId = getPlayerStableId(player);
			const wasWinner = stableId !== null && state.winnerPlayers.has(stableId);
			const protectedNow = isWinningHuman(state, player);
			debugLog(`CleanupCheck: zone='${zoneName}' id=${stableId} team=${team} hp=${hp} winner=${wasWinner} protected=${protectedNow}`);

			if (protectedNow) {
				debugLog(`CleanupProtect: zone='${zoneName}' id=${stableId} team=${team} hp=${hp}`);
				continue;
			}

			debugLog(`CleanupKill: zone='${zoneName}' id=${stableId} team=${team} hp=${hp} reason=not_winning_human`);
			player.TakeDamage({ damage: 99999 });
		} catch (e) {
			debugError(`cleanupNonWinners:${zoneName}`, e);
		}
	}

	if (!state.killLoopActive) return;
	try {
		Instance.EntFireAtName({
			name: SCRIPT_ENTITY_NAME,
			input: "RunScriptInput",
			value: `KillLoopTick_${zoneName}`,
			delay: CLEANUP_INTERVAL,
		});
	} catch (e) {
		debugError(`cleanupSchedule:${zoneName}`, e);
	}
}

function startCleanupLoop(zoneName) {
	const state = getState(zoneName);
	if (state.killLoopActive) return;
	state.killLoopActive = true;
	debugLog(`CleanupStart: zone='${zoneName}'`);
	cleanupNonWinners(zoneName);
}

function finishStage(zoneName, win) {
	const state = getState(zoneName);
	if (state.finalized) return;

	state.finalized = true;
	state.phase = "finished";
	setTriggerEnabled(zoneName, false);
	const cfg = getStageConfig(zoneName);
	log(`StageFinish: zone='${zoneName}' verdict=${win ? "WIN" : "FAIL"} h=${state.hcount} z=${state.zcount}`);

	if (!win) {
		if (cfg.fail) sendChatLines([formatLine(cfg.fail, cfg)], 0.0, 1.0);
		return;
	}

	// Snapshot winners first, then lock respawn immediately.
	snapshotWinners(state, zoneName);
	try {
		Instance.EntFireAtName({ name: "zr_toggle_respawn", input: "Disable", value: "", delay: 0.0 });
	} catch (e) {
		debugError(`disableRespawn:${zoneName}`, e);
	}

	startCleanupLoop(zoneName);

	// Award score only to winning CTs.
	for (const winnerStableId of state.winnerPlayers) {
		try {
			const allPlayers = Instance.FindEntitiesByClass("player") || [];
			for (const player of allPlayers) {
				if (!player || !player.IsValid() || player.GetHealth() <= 0) continue;
				const stableId = getPlayerStableId(player);
				if (stableId !== winnerStableId) continue;
				if (player.GetTeamNumber() !== TEAM_CT) continue;
				const controller = player.GetPlayerController();
				if (!controller) continue;
				const currentScore = controller.GetScore();
				controller.AddScore(cfg.score);
				debugLog(`ScoreAdd: zone='${zoneName}' id=${stableId} was=${currentScore} add=${cfg.score} total=${currentScore + cfg.score}`);
			}
		} catch (e) {
			debugError(`scoreAward:${zoneName}`, e);
		}
	}

	if (cfg.victory) sendChatLines([formatLine(cfg.victory, cfg)], 0.0, 1.0);

	try {
		Instance.EntFireAtName({ name: MANAGER_NAME, input: "RunScriptInput", value: "stagewon", delay: STAGEWON_DELAY });
	} catch (e) {
		debugError(`stagewon:${zoneName}`, e);
	}
}

function evaluateZone(zoneName, finalCheck) {
	const state = getState(zoneName);
	if (state.finalized) return;

	const cfg = getStageConfig(zoneName);
	const { humans, zombies } = scanZonePlayers(state, zoneName);
	log(`Evaluate: zone='${zoneName}' final=${finalCheck} h=${humans} z=${zombies} phase=${state.phase}`);

	if (humans > 0 && zombies === 0) {
		finishStage(zoneName, true);
		return;
	}

	if (zombies > 0 || humans === 0) {
		finishStage(zoneName, false);
		return;
	}

	if (finalCheck) {
		finishStage(zoneName, false);
		return;
	}

	if (state.phase !== "waiting") {
		state.phase = "waiting";
		const warnLines = (cfg.warn || []).map((line) => formatLine(line, cfg));
		sendChatLines(warnLines, 0.0, 1.0);
		try {
			Instance.EntFireAtName({
				name: SCRIPT_ENTITY_NAME,
				input: "RunScriptInput",
				value: `WincheckReEval_${zoneName}`,
				delay: cfg.countdown,
			});
			debugLog(`ReEvalScheduled: zone='${zoneName}' delay=${cfg.countdown}`);
		} catch (e) {
			debugError(`scheduleReEval:${zoneName}`, e);
		}
	}
}

function getInputZoneName(inputData) {
	try {
		const caller = inputData?.caller;
		if (!caller || !caller.GetEntityName) return undefined;
		return caller.GetEntityName();
	} catch (e) {
		debugError("getInputZoneName", e);
		return undefined;
	}
}

function getPlayerDebugFields(player) {
	let id = null;
	let team = "?";
	let hp = "?";
	try { id = getPlayerStableId(player); } catch (e) { debugError("getPlayerDebugFields:id", e); }
	try { team = player && player.IsValid() ? player.GetTeamNumber() : "?"; } catch (e) { debugError("getPlayerDebugFields:team", e); }
	try { hp = player && player.IsValid() ? player.GetHealth() : "?"; } catch (e) { debugError("getPlayerDebugFields:hp", e); }
	return { id, team, hp };
}

log("Registering st1-st7 wincheck handlers");
for (let stageNum = 1; stageNum <= 7; stageNum++) {
	const zoneName = `st${stageNum}_wincheck`;
	const triggerInputName = zoneName;
	const deferredInputName = `WincheckDeferredEval_${zoneName}`;
	const reevalInputName = `WincheckReEval_${zoneName}`;
	const killLoopInputName = `KillLoopTick_${zoneName}`;

	Instance.OnScriptInput(killLoopInputName, () => {
		cleanupNonWinners(zoneName);
	});

	Instance.OnScriptInput(deferredInputName, () => {
		const state = getState(zoneName);
		if (state.finalized) return;
		if (state.phase !== "checking") {
			debugLog(`DeferredEvalSkip: zone='${zoneName}' phase=${state.phase}`);
			return;
		}
		evaluateZone(zoneName, false);
	});

	Instance.OnScriptInput(reevalInputName, () => {
		const state = getState(zoneName);
		if (state.finalized) return;
		if (state.phase !== "waiting") {
			debugLog(`ReEvalSkip: zone='${zoneName}' phase=${state.phase}`);
			return;
		}
		evaluateZone(zoneName, true);
	});

	Instance.OnScriptInput(triggerInputName, () => {
		const state = getState(zoneName);
		if (state.finalized || state.phase === "finished") {
			debugLog(`TriggerIgnored: zone='${zoneName}' finalized`);
			return;
		}
		if (state.phase === "checking" || state.phase === "waiting") {
			debugLog(`TriggerIgnored: zone='${zoneName}' phase=${state.phase}`);
			return;
		}

		state.phase = "checking";
		state.players.clear();
		state.hcount = 0;
		state.zcount = 0;
		setTriggerEnabled(zoneName, true);
		log(`Trigger: ${triggerInputName} (zoneName: ${zoneName})`);
		try {
			Instance.EntFireAtName({
				name: SCRIPT_ENTITY_NAME,
				input: "RunScriptInput",
				value: deferredInputName,
				delay: EVAL_DELAY,
			});
			debugLog(`DeferredEvalScheduled: zone='${zoneName}' delay=${EVAL_DELAY}`);
		} catch (e) {
			debugError(`scheduleDeferred:${zoneName}`, e);
		}
	});
}

Instance.OnScriptInput("PlayerEnterZone", (inputData) => {
	const zoneName = getInputZoneName(inputData);
	const activator = inputData?.activator;
	if (!isValidZoneName(zoneName)) {
		debugLog(`[Hammer] PlayerEnterZone: ignored unknown zone='${zoneName}'`);
		return;
	}
	if (!activator || !activator.IsValid() || activator.GetHealth() <= 0) return;

	const state = getState(zoneName);
	state.players.add(activator);
	const fields = getPlayerDebugFields(activator);
	debugLog(`[Hammer] PlayerEnterZone: zone='${zoneName}' id=${fields.id} team=${fields.team} hp=${fields.hp} size=${state.players.size}`);
});

Instance.OnScriptInput("PlayerLeaveZone", (inputData) => {
	const zoneName = getInputZoneName(inputData);
	const activator = inputData?.activator;
	if (!isValidZoneName(zoneName)) {
		debugLog(`[Hammer] PlayerLeaveZone: ignored unknown zone='${zoneName}'`);
		return;
	}
	if (!activator) return;

	const state = getState(zoneName);
	state.players.delete(activator);
	const fields = getPlayerDebugFields(activator);
	debugLog(`[Hammer] PlayerLeaveZone: zone='${zoneName}' id=${fields.id} team=${fields.team} hp=${fields.hp} size=${state.players.size}`);
});

Instance.OnRoundEnd(() => {
	resetAllZoneStates();
});

Instance.OnRoundStart(() => {
	for (const state of zoneStates.values()) {
		state.players.clear();
		state.hcount = 0;
		state.zcount = 0;
		state.finalized = false;
		state.phase = "idle";
		state.winflag = false;
		state.killLoopActive = false;
		state.winnerPlayers.clear();
	}
});
