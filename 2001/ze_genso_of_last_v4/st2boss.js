import { Instance } from "cs_script/point_script";

// === ボスシステムクラス ===
class GolemBossSystem {
	constructor() {
		this.bossHealth = 500.00;
		this.bossKill = 0;
		this.atkCycle = 6;
		this.atkTick = true;
		this.attackQueue = [];
		this.attackCounter = 0;
		this.BATCH_SIZE = 5;
		this.REFILL_INTERVAL = 8;
		this.windFlag = 0;
		this.gravFlag = 0;
		this.debugTornado = false;
		this.tornadoSpawnPresets = [
			{
				name: "single_left",
				weight: 1,
				positions: [{ x: -4024, y: 13376, z: 199 }],
			},
			{
				name: "single_center",
				weight: 1,
				positions: [{ x: -3840, y: 13376, z: 199 }],
			},
			{
				name: "single_right",
				weight: 1,
				positions: [{ x: -3656, y: 13376, z: 199 }],
			},
			{
				name: "pair_left_center",
				weight: 1,
				positions: [
					{ x: -4024, y: 13376, z: 199 },
					{ x: -3840, y: 13376, z: 199 },
				],
			},
			{
				name: "pair_center_right",
				weight: 1,
				positions: [
					{ x: -3840, y: 13376, z: 199 },
					{ x: -3656, y: 13376, z: 199 },
				],
			},
			{
				name: "pair_left_right",
				weight: 1,
				positions: [
					{ x: -4024, y: 13376, z: 199 },
					{ x: -3656, y: 13376, z: 199 },
				],
			},
		];
		// Use point_template for meteor spawns
		this.meteorTemp = Instance.FindEntityByName("st2_boss_meteor_template");
		this.tornadoTemplate1 = Instance.FindEntityByName("st2_boss_tornado_template");
		this.tornadoTemplate2 = Instance.FindEntityByName("st2_boss_tornado_template2");
		// Bag-based attack selection
		this.bag = [];
		this.BAG_COUNTS = { stomp: 20, earthquake: 15, pushgrav: 15, meteor: 20, shockwave: 15, tornado: 15 };
		this.MIN_BAG_REBUILD = 30;
		this.buildBag = this.buildBag.bind(this);
		this.buildBag();
		this.attackThinkRegistered = false;
		this.tornadoSpawnQueue = [];
		this.shockwaveSpawnQueue = [];
		this.meteorTargetList = [];
		
		this.self = Instance.FindEntityByName("st2_boss_script");
	}

	debug(msg) {
		if (!this.debugTornado) return;
		this.log(msg);
	}

	getValidTemplate(cachedTemplate, templateName) {
		if (cachedTemplate && cachedTemplate.IsValid && cachedTemplate.IsValid()) {
			return cachedTemplate;
		}
		return Instance.FindEntityByName(templateName);
	}

	clonePositions(positions) {
		const cloned = [];
		for (const pos of positions) {
			cloned.push({ x: pos.x, y: pos.y, z: pos.z });
		}
		return cloned;
	}

	chooseWeightedPreset(presets) {
		let totalWeight = 0;
		for (const preset of presets) {
			totalWeight += preset.weight > 0 ? preset.weight : 0;
		}
		if (totalWeight <= 0) return presets[0];

		let roll = Math.random() * totalWeight;
		for (const preset of presets) {
			roll -= preset.weight > 0 ? preset.weight : 0;
			if (roll <= 0) return preset;
		}
		return presets[presets.length - 1];
	}
	log(msg) {
		try {
			Instance.Msg(msg);
			Instance.ServerCommand("echo " + msg);
		} catch (e) {}
	}
	// === ティック処理を自己参照呼び出しで実行 ===
	startTickSystem() {
		this.entFire("st2_boss_script", "RunScriptInput", "TickHealth", 0.1);
	}

	stopTickSystem() {
		try {
			// 自己参照ティック呼び出しの停止処理（tickHealth内で判定される）
		} catch (e) {
			this.log("[WARN] stopTickSystem failed: " + e);
		}
	}

	resetStartState() {
		this.stopTickSystem();
		this.bossKill = 0;
		this.atkTick = true;
		this.attackQueue = [];
		this.attackCounter = 0;
		this.windFlag = 0;
		this.gravFlag = 0;
		this.tornadoSpawnQueue = [];
		this.shockwaveSpawnQueue = [];
		this.buildBag();
		this.meteorTargetList = [];
	}

	resetState() {
		this.stopTickSystem();
		this.bossHealth = 500.00;
		this.bossKill = 0;
		this.atkTick = true;
		this.attackQueue = [];
		this.attackCounter = 0;
		this.windFlag = 0;
		this.gravFlag = 0;
		this.tornadoSpawnQueue = [];
		this.shockwaveSpawnQueue = [];
		this.buildBag();
		this.meteorTargetList = [];
	}

	stopAttackSystem() {
		this.atkTick = false;
		this.attackQueue = [];
		this.attackCounter = 0;
	}
	
	// === 体力システム ===
	addHealth(value) {
		if (this.bossKill) return;
		const players = Instance.FindEntitiesByClass("player");
		for (const p of players) {
			if (p.GetTeamNumber() == 3 && this.bossKill == 0) {
				this.bossHealth += value;
			}
		}
	}

	// Called from RunScriptInput "InMeteorTargetList" via trigger_multiple activator
	addMeteorTarget(ent) {
		try {
			if (!ent) { this.log('[DEBUG] addMeteorTarget called with no entity'); return; }
			// Accept entities that report health > 0 (players/pawns). Be permissive for Hammer activator types.
			if (typeof ent.GetHealth === 'function') {
				if (ent.GetHealth() <= 0) { this.log('[DEBUG] addMeteorTarget: entity has no health or is dead'); return; }
			} else {
				this.log('[DEBUG] addMeteorTarget: entity has no GetHealth method, accepting anyway');
			}
			// Avoid duplicates
			for (const e of this.meteorTargetList) { if (e === ent) { this.log('[DEBUG] addMeteorTarget: duplicate, ignoring'); return; } }
			this.meteorTargetList.push(ent);
			this.log('[DEBUG] Meteor target added, total=' + this.meteorTargetList.length);
		} catch (e) { this.log('[WARN] addMeteorTarget failed: ' + e); }
	}
	
	subHealthByShoot() {
		this.bossHealth--;
	}
	subHealthByItem() {
		this.bossHealth -= 120;
	}
	
	subHealth(value) {
		if (value == 0) this.bossHealth -= 120;
		else if (value == 999) this.bossHealth -= 999999;
	}
	
	tickHealth() {
		if (this.bossKill) {
			return;
		}

		if (this.bossHealth < 1 && this.bossKill == 0) {
			this.bossKilled();
			this.bossKill = 1;
			return;
		}
		
		// st2_boss_counter (math_counter) にHP値を反映
		this.entFire("st2_boss_counter", "SetValue", String(this.bossHealth), 0.00);
		this.hpText();
		
		// 次のティックを自己参照呼び出しでスケジュール
		this.entFire("st2_boss_script", "RunScriptInput", "TickHealth", 0.1);
	}
	
	hpText() {
		const target = "st2_boss_text"; // point_worldtext targetname
		const message = this.bossHealth > 0
			? `< Golem Ahglan >\n HP: ${this.bossHealth}`
			: "< Golem Ahglan >\n HP: 0";

		// point_worldtext: update text via SetMessage
		this.entFire(target, "SetMessage", message, 0.00);
	}
	
	bossKilled() {
		this.stopTickSystem();
		this.stopAttackSystem();
		this.entFire("st2_boss_breakable", "Break", "", 0.00);
		this.entFire("st2_boss_meteor*", "Kill", "", 0.00);
		this.entFire("st2_boss_tornado*", "Kill", "", 0.00);
		this.entFire("st2_boss_shock*", "Kill", "", 0.00);
		this.entFire("st2_boss_hurt*", "Kill", "", 0.00);
		this.entFire("music_scripts", "RunScriptInput", "PlayBGM(5) ", 1.02);

		this.entFire("item_script", "RunScriptInput", "ZMItemRestrictToggle", 17.00);
		
		this.entFire("Map_text", "RunScriptInput", "SetEventName(6)", 0.00);
		this.entFire("Map_text", "RunScriptInput", "SetEventName(0)", 15.00);
		this.entFire("Map_text", "RunScriptInput", "SetTimer(10)", 0.01);
	}
	
	// === スタート ===
	start() {
		this.resetStartState();
		// Ensure templates are valid at start in case they weren't available during construction
		try { this.meteorTemp = this.getValidTemplate(this.meteorTemp, "st2_boss_meteor_template"); } catch (e) { this.log('[WARN] start() meteorTemp refresh failed: ' + e); }
		this.addHealth(650);
		this.scheduleAttack(5.0);
		this.entFire("st2_boss_hurt", "Enable", "", 0.00);
		this.startTickSystem();
		this.entFire("st2_boss_damage", "Enable", "", 0.80);
		this.entFire("hfire_but", "AddOutput", "OnUser4>st2_boss_damage>Trigger>>0>-1", 0.02);
		this.entFire("hgrav_but", "AddOutput", "OnUser4>st2_boss_damage>Trigger>>0>-1", 0.02);
		this.entFire("hice_but", "AddOutput", "OnUser4>st2_boss_damage>Trigger>>0>-1", 0.02);
		this.entFire("hstop_but", "AddOutput", "OnUser4>st2_boss_damage>Trigger>>0>-1", 0.02);
		
		this.entFire("filter_script", "RunScriptInput", "ZMItemRestrictToggle", 0.00);
	}
	
	// === scheduleAttack ===
	scheduleAttack(delay) {
		this.entFire("st2_boss_script", "RunScriptInput", "StartGolemAttack", delay);
	}

	// バッチ処理: 一度に BATCH_SIZE 個の攻撃をキューに詰め、REFILL_INTERVAL ごとにリセット
	refillAttackQueue() {
		const entries = [];
		const push = (id, count) => { for (let i = 0; i < count; i++) entries.push(id); };
		push("stomp", 25);
		push("earthquake", 15);
		push("pushgrav", 15);
		push("meteor", 15);
		push("shockwave", 15);
		push("tornado", 15);
		const shuffled = this.shuffle(entries);
		// BATCH_SIZE 個を取り出してキューに追加
		for (let i = 0; i < this.BATCH_SIZE && shuffled.length > 0; i++) {
			this.attackQueue.push(shuffled.pop());
		}
	}

	getNextAttack() {
		// Bag-based selection: pick one from current bag, remove it and 4 more of same type (合計5)
		if (!this.bag || this.bag.length === 0) {
			this.buildBag();
		}
		const idx = Math.floor(Math.random() * this.bag.length);
		const atk = this.bag.splice(idx, 1)[0];
		// Remove up to 4 more of same attack from bag
		let toRemove = 4;
		while (toRemove > 0) {
			const j = this.bag.indexOf(atk);
			if (j === -1) break;
			this.bag.splice(j, 1);
			toRemove--;
		}
		// Rebuild bag when low
		if (this.bag.length <= this.MIN_BAG_REBUILD) {
			this.buildBag();
		}
		return atk;
	}

	shuffle(arr) {
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			const tmp = arr[i];
			arr[i] = arr[j];
			arr[j] = tmp;
		}
		return arr;
	}

	// Build full 100-entry bag according to BAG_COUNTS
	buildBag() {
		this.bag = [];
		for (const key of Object.keys(this.BAG_COUNTS)) {
			const count = this.BAG_COUNTS[key];
			for (let i = 0; i < count; i++) this.bag.push(key);
		}
		this.shuffle(this.bag);
		this.log("[DEBUG] Attack bag rebuilt, entries=" + this.bag.length);
	}
	
	// === 攻撃制御 ===
	startGolemAttack() {
		if (!this.atkTick) return;
		
		const atk = this.getNextAttack();
		switch (atk) {
			case "stomp": {
				this.golemStomp();
				const randomsec = this.randomInt(-2, 2) + this.atkCycle;
				this.scheduleAttack(3.0 + randomsec);
				break;
			}
			case "earthquake": {
				this.golemEarthquake();
				const randomsec = this.randomInt(-2, 2) + this.atkCycle;
				this.scheduleAttack(5.0 + randomsec);
				break;
			}
			case "pushgrav": {
				this.golemPushGrav();
				const randomsec = this.randomInt(-2, 2) + this.atkCycle;
				this.scheduleAttack(7.0 + randomsec);
				break;
			}
			case "meteor": {
				this.golemMeteor();
				this.entFire("st2_boss_model", "SetAnimationNotLooping", "ACT_ATTACK1", 0.00);
				const randomsec = this.randomInt(-2, 2) + this.atkCycle;
				this.scheduleAttack(5.0 + randomsec);
				this.entFire("server", "Command", "say < Meteor >", 0.00);
				break;
			}
			case "shockwave": {
				this.golemShockWave();
				this.entFire("st2_boss_model", "SetAnimationNotLooping", "ACT_ATTACK1", 0.00);
				const randomsec = this.randomInt(-2, 2) + this.atkCycle;
				this.scheduleAttack(7.0 + randomsec);
				this.entFire("server", "Command", "say < Shock Wave >", 0.00);
				break;
			}
			case "tornado":
			default: {
				this.golemTornado();
				this.entFire("st2_boss_model", "SetAnimationNotLooping", "ACT_ATTACK3", 0.00);
				const randomsec = this.randomInt(-2, 2) + this.atkCycle;
				this.scheduleAttack(17.0 + randomsec);
				this.entFire("server", "Command", "say < Tornado >", 0.00);
				break;
			}
		}
	}
	
	golemStomp() {
		const r = this.randomInt(0, 1);
		if (r == 0) this.entFire("st2_boss_attack3_relay", "FireUser1", "", 0.00);
		else this.entFire("st2_boss_attack1_relay", "FireUser1", "", 0.00);
	}
	
	golemEarthquake() {
		this.entFire("st2_boss_attack2_relay", "FireUser1", "", 0.00);
	}
	
	golemPushGrav() {
		if (this.windFlag == 1 && this.gravFlag == 1) { this.windFlag = 0; this.gravFlag = 0; }
		const i = this.randomInt(0, 1);
		if (i == 0) {
			if (this.windFlag == 0) { this.entFire("st2_boss_wind_relay", "FireUser1", "", 0.00); this.windFlag = 1; }
			else { this.entFire("st2_boss_gravity_relay", "FireUser1", "", 0.00); this.windFlag = 0; }
		} else {
			if (this.gravFlag == 0) { this.entFire("st2_boss_gravity_relay", "FireUser1", "", 0.00); this.gravFlag = 1; }
			else { this.entFire("st2_boss_wind_relay", "FireUser1", "", 0.00); this.gravFlag = 0; }
		}
	}
	
	golemMeteor() {
		this.log('[DEBUG] golemMeteor invoked');
		// Re-resolve meteor template at call time in case it was not available during construction
		try { this.meteorTemp = this.getValidTemplate(this.meteorTemp, "st2_boss_meteor_template"); } catch (e) { this.log('[WARN] golemMeteor meteorTemp refresh failed: ' + e); }
		let meteorTarget = null;
		// Prefer targets added via InMeteorTargetList (trigger_multiple). Clean invalid/dead entries first.
		try {
			this.meteorTargetList = this.meteorTargetList.filter(p => p && p.IsValid && p.IsValid() && p.GetHealth && p.GetHealth() > 0);
			this.log('[DEBUG] meteorTargetList length=' + this.meteorTargetList.length);
			if (this.meteorTargetList.length > 0) {
				meteorTarget = this.meteorTargetList[Math.floor(Math.random() * this.meteorTargetList.length)];
				if (meteorTarget) {
					try {
						const mo = meteorTarget.GetAbsOrigin ? meteorTarget.GetAbsOrigin() : null;
						this.log('[DEBUG] selected meteorTarget from list, origin=' + (mo ? (mo.x + ',' + mo.y + ',' + mo.z) : 'unknown'));
					} catch (e) { this.log('[DEBUG] could not read selected meteorTarget origin: ' + e); }
				}
			}
		} catch (e) { this.log('[WARN] meteorTargetList filter failed: ' + e); }
		// Fallback to scanning players if list is empty
		if (!meteorTarget) {
			this.log('[DEBUG] meteorTargetList empty, scanning players');
			const players = Instance.FindEntitiesByClass("player");
			this.log('[DEBUG] players count=' + (players ? players.length : 0));
			for (const p of players) {
				try {
					if (p.GetTeamNumber && p.GetTeamNumber() == 3 && p.GetHealth && p.GetHealth() > 0) { meteorTarget = p; this.log('[DEBUG] selected player target'); break; }
				} catch (e) { this.log('[DEBUG] error checking player during scan: ' + e); }
			}
		}
		if (!meteorTarget) {
			this.log('[DEBUG] golemMeteor: no valid meteorTarget found');
		}
		if (!this.meteorTemp) this.log('[DEBUG] meteorTemp is undefined');
		else try { this.log('[DEBUG] meteorTemp.IsValid=' + (this.meteorTemp.IsValid ? !!this.meteorTemp.IsValid() : 'no IsValid')); } catch (e) { this.log('[DEBUG] meteorTemp IsValid check failed: ' + e); }
		if (this.meteorTemp && this.meteorTemp.IsValid && this.meteorTemp.IsValid() && meteorTarget) {
			try {
				const origin = meteorTarget.GetAbsOrigin();
				this.log("[DEBUG] Meteor: Spawning via point_template at (" + origin.x + ", " + origin.y + ", " + origin.z + ") class=" + this.meteorTemp.GetClassName());
				if (typeof this.meteorTemp.ForceSpawn === "function") {
					try {
						const res = this.meteorTemp.ForceSpawn(origin);
						this.log('[DEBUG] meteorTemp.ForceSpawn returned: ' + JSON.stringify(res));
					} catch (e) { this.log('[WARN] meteorTemp.ForceSpawn failed: ' + e); }
				} else {
					try { this.meteorTemp.Teleport({ position: origin }); } catch (e) { this.log('[WARN] meteorTemp.Teleport failed: ' + e); }
					this.log('[WARN] meteorTemp.ForceSpawn not available on entity; teleported template to origin');
				}
			} catch (e) {
				this.log("[WARN] Meteor template spawn failed: " + e);
			}
		}
	}
	
	golemShockWave() {
		let initorigin = 13312;
		for (let i = 0; i < 10; i++) {
			const pos = { x: -3840, y: initorigin, z: 212 };
			this.shockwaveSpawnQueue.push(pos);
			this.entFire("st2_boss_script", "RunScriptInput", "SpawnShockwave", 0.00 + i * 0.75);
			initorigin -= 128;
		}
	}
	
	SpawnShockwave() {
		if (this.shockwaveSpawnQueue.length > 0) {
			const pos = this.shockwaveSpawnQueue.shift();
			const template = Instance.FindEntityByName("st2_boss_shockwave_template");
			if (template && template.IsValid && template.IsValid() && pos) {
				try {
					this.log("[DEBUG] Shockwave: About to teleport to (" + pos.x + ", " + pos.y + ", " + pos.z + "), class=" + template.GetClassName());
					template.Teleport({ position: pos });
					// Prefer direct API ForceSpawn when available
					if (typeof template.ForceSpawn === "function") {
						try { template.ForceSpawn(pos); } catch (e) { this.log("[WARN] Shockwave ForceSpawn failed: " + e); }
					} else {
							try {
								// Prefer direct API ForceSpawn on the template entity
								const sTemplate = Instance.FindEntityByName("st2_boss_shockwave_template");
								if (sTemplate && typeof sTemplate.ForceSpawn === 'function') {
									sTemplate.ForceSpawn(pos);
								} else {
									this.log('[WARN] st2_boss_shockwave_template ForceSpawn not available');
								}
							} catch (e) { this.log('[WARN] shockwave ForceSpawn invocation failed: ' + e); }
					}
				} catch (e) {
					this.log("[WARN] Shockwave template teleport failed: " + e);
				}
			}
		}
	}
	
	golemTornado() {
		for (let i = 0; i < 5; i++) {
			const spawnData = this.generateTornadoSpawnData();
			this.tornadoSpawnQueue.push(spawnData);
			this.entFire("st2_boss_script", "RunScriptInput", "ProcessTornadoQueue", 3.0 * i);
		}
	}
	
	
	generateTornadoSpawnData() {
		const preset = this.chooseWeightedPreset(this.tornadoSpawnPresets);
		return {
			presetName: preset.name,
			positions: this.clonePositions(preset.positions),
		};
	}
	
	ProcessTornadoQueue() {
		if (this.tornadoSpawnQueue.length > 0) {
			const spawnData = this.tornadoSpawnQueue.shift();
			this.debug(`[TORNADO-QUEUE] Processing preset ${spawnData.presetName}: ${spawnData.positions.length} positions`);
			
			for (let i = 0; i < spawnData.positions.length; i++) {
				const pos = spawnData.positions[i];
				this.debug(`[TORNADO-QUEUE] Spawn index ${i}: (${pos.x}, ${pos.y}, ${pos.z})`);
				
				const templateName = i === 0 ? "st2_boss_tornado_template" : "st2_boss_tornado_template2";
				const template = this.getValidTemplate(
					i === 0 ? this.tornadoTemplate1 : this.tornadoTemplate2,
					templateName
				);
				
				if (template && pos) {
					try {
						this.debug("[DEBUG] Tornado: ForceSpawn only, class=" + template.GetClassName());
						template.ForceSpawn(pos, { pitch: 0, yaw: 90, roll: 0 });
					} catch (e) {
						this.log("[WARN] Tornado ForceSpawn failed: " + e);
					}
				}
			}
		} else {
			this.debug("[TORNADO-QUEUE] Queue is empty!");
		}
	}
	randomInt(min, max) {
		min = Math.floor(min);
		max = Math.floor(max);
		if (isNaN(min) || isNaN(max)) return 0;
		if (max < min) { const t = min; min = max; max = t; }
		const range = (max - min) + 1;
		if (range <= 1) return min;
		return min + Math.floor(Math.random() * range);
	}
	
	entFire(name, input, value = "", delay = 0) {
		try {
			Instance.EntFireAtName({ name, input, value, delay });
		} catch (e) {
			this.log("[ERROR] EntFire: " + e);
		}
	}
	
	entFireByHandle(target, input, value, delay) {
		try {
			Instance.EntFireAtTarget({ target, input, value, delay });
		} catch (e) {
			this.log("[ERROR] EntFireByHandle: " + e);
		}
	}
}


const boss = new GolemBossSystem();

// === Instance.OnScriptInput ===
Instance.OnScriptInput("Start", () => boss.start());
Instance.OnScriptInput("TickHealth", () => boss.tickHealth());
Instance.OnScriptInput("AddHealth", () => boss.addHealth(0));
Instance.OnScriptInput("SubHealthbyShoot", () => boss.subHealthByShoot());
Instance.OnScriptInput("SubHealth", () => boss.subHealth(0));
Instance.OnScriptInput("SubHealthbyItem", () => boss.subHealthByItem());
Instance.OnScriptInput("BossKilled", () => boss.bossKilled());
Instance.OnScriptInput("StartGolemAttack", () => boss.startGolemAttack());
Instance.OnScriptInput("GolemStomp", () => boss.golemStomp());
Instance.OnScriptInput("GolemEarthquake", () => boss.golemEarthquake());
Instance.OnScriptInput("GolemPushGrav", () => boss.golemPushGrav());
Instance.OnScriptInput("GolemMeteor", () => boss.golemMeteor());
Instance.OnScriptInput("GolemShockWave", () => boss.golemShockWave());
Instance.OnScriptInput("Golemtornado", () => boss.golemTornado());
Instance.OnScriptInput("GolemtornadoSpawn", () => boss.golemTornadoSpawn());
Instance.OnScriptInput("SpawnShockwave", () => boss.SpawnShockwave());
Instance.OnScriptInput("ProcessTornadoQueue", () => boss.ProcessTornadoQueue());
Instance.OnScriptInput("InMeteorTargetList", (inputData) => {
	try {
		// Hammer may pass the touching entity as activator or caller depending on wiring.
		const activator = inputData && inputData.activator;
		const caller = inputData && inputData.caller;
		boss.log('[DEBUG] InMeteorTargetList fired - activator=' + (activator ? 'yes' : 'no') + ', caller=' + (caller ? 'yes' : 'no'));
		if (activator) {
			boss.addMeteorTarget(activator);
		} else if (caller) {
			boss.addMeteorTarget(caller);
		} else {
			boss.log('[DEBUG] InMeteorTargetList: no activator/caller in inputData');
		}
	} catch (e) { boss.log('[WARN] InMeteorTargetList handler failed: ' + e); }
});

try {
	Instance.OnRoundEnd(() => {
		boss.resetState();
	});

	Instance.OnRoundStart(() => {
		boss.resetState();
	});
} catch (e) {
	boss.log("[WARN] Round lifecycle registration failed: " + e);
}
boss.log("[INIT] st2boss.js loaded - Golem Ahglan boss system initialized");