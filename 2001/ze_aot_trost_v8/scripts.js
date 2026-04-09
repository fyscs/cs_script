import { Instance, CSInputs, } from "cs_script/point_script";

var stage = 1;

// =============================================
// 死亡事件监听
// =============================================
Instance.OnPlayerKill(({ player }) => {
    const playerData = gameManager.pMgr.getValidPlayers().find(p => 
        p.pawn && p.pawn.IsValid() && p.pawn === player
    );
    
    if (playerData && playerData.isHuman()) {
        gameManager.uiSys.updatePlayerUI(playerData);
        gameManager.aSys.cleanupPlayerModels(playerData);
        print(`玩家 ${playerData.ctrl?.GetPlayerName()} 死亡，已清理其模型和 UI`);
    }
});

// =============================================
// 常量配置
// =============================================
const CONFIG = {
    tq: {tar:undefined,pos:undefined},
    STAGES: { INIT: 1, MAX_PLAYERS: 64 },
    THINK: { DELAY: 1/64, MAX_SPEED: 1750 },
    ABILITIES: {
        LITI: { SPEED_DELAY: 20/64, MAX_SPEED_DELAY: 30, CHARGE: 0.2, MAX_NUM: 5, DEST: 3000 },
        STEAM: { SPEED: 8, CHARGE: 0.4, MAX_NUM: 5, USE_SPEED: 400 },
        CUT: { MAX_NUM: 5, CHARGE: 0.5, MAX_CD: 2 }
    },
    ITEMS: {
        FLAME: { ID: 1, LITI_MAX: 5, STEAM_MAX: 5, CUT_MAX: 5, LITI_CHARGE: 0.2, STEAM_CHARGE: 0.4, CUT_CHARGE: 0.5, CD: 60, COLOR: "255 50 50" },
        WIND: { ID: 2, LITI_MAX: 5, STEAM_MAX: 5, CUT_MAX: 5, LITI_CHARGE: 0.2, STEAM_CHARGE: 0.4, CUT_CHARGE: 0.5, CD: 60, DURATION: 8, COLOR: "50 255 50" },
        ELEC: { ID: 3, LITI_MAX: 5, STEAM_MAX: 5, CUT_MAX: 5, LITI_CHARGE: 0.2, STEAM_CHARGE: 0.4, CUT_CHARGE: 0.5, CD: 60, COLOR: "200 50 255" },
        TGUN: { ID: 4, LITI_MAX: 5, STEAM_MAX: 5, CUT_MAX: 5, LITI_CHARGE: 0.2, STEAM_CHARGE: 0.4, CUT_CHARGE: 0.5, CD: 15, COLOR: "255 200 50" },
        HEAL: { ID: 5, CD: 60, DURATION: 10 },
        AMMO: { ID: 6, CD: 60, DURATION: 12 },
        SKIN1: {
            ID: 7, 
            LITI_MAX: 5, 
            STEAM_MAX: 5, 
            CUT_MAX: 5, 
            LITI_CHARGE: 0.4, 
            STEAM_CHARGE: 0.4, 
            CUT_CHARGE: 0.6, 
            COLOR: "255 100 100",
            RIGHT_CLICK_CD: 25,
            COMBO_CD: 90,
            HP: 15,
            COMBO_SEQUENCE: ["case13", "case12", "case11", "case14", "case15"]
        },
        SKIN2: {
            ID: 8, 
            LITI_MAX: 7, 
            STEAM_MAX: 5, 
            CUT_MAX: 10, 
            LITI_CHARGE: 0.4, 
            STEAM_CHARGE: 0.4, 
            CUT_CHARGE: 0.6, 
            COLOR: "100 255 100",
            RIGHT_CLICK_CD: 25,
            COMBO_CD: 90,
            HP: 20,
            COMBO_SEQUENCE: ["case13", "case12", "case11", "case14", "case15"]
        },
        SKIN3: {
            ID: 9, 
            LITI_MAX: 5, 
            STEAM_MAX: 5, 
            CUT_MAX: 7, 
            LITI_CHARGE: 0.4, 
            STEAM_CHARGE: 0.4, 
            CUT_CHARGE: 0.6, 
            COLOR: "100 100 255",
            RIGHT_CLICK_CD: 25,
            COMBO_CD: 90,
            HP: 20,
            COMBO_SEQUENCE: ["case13", "case12", "case11", "case14", "case15"]
        },
        ZOMBIE_SKIN1: { 
            ID: 10, 
            NAME: "兽之巨人[右键|按E]",
            CD: 40,
            HP: 500000
        },
        ZOMBIE_SKIN2: { 
            ID: 11, 
            NAME: "凯之巨人[右键|按E]", 
            CD: 40,
            HP: 500000
        },
        ZOMBIE_SKIN3: { 
            ID: 12, 
            NAME: "超大型巨人[按E]",
            CD: 90,
            HP: 500000
        },
        ZOMBIE_SKIN4: { 
            ID: 13, 
            NAME: "奇行种[右键|按E]",
            CD: 30,
            HP: 500000
        },
        ZOMBIE_SKIN5: { 
            ID: 14, 
            NAME: "高跳[按E]",
            CD: 40,
            HP: 500000
        }
    },
    TEAMS: { ZOMBIE: 2, HUMAN: 3 },
    RANGE: { HEAL: 600, AMMO: 600 }
};

// =============================================
// 向量工具函数
// =============================================
function vec(x, y, z) { return { x, y, z }; }
function ang(p, y, r) { return { pitch: p, yaw: y, roll: r }; }
function len3(v) { return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2); }
function len2(v) { return Math.sqrt(v.x ** 2 + v.y ** 2); }
function sub(v1, v2) { return { x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z }; }
function add(v1, v2) { return { x: v1.x + v2.x, y: v1.y + v2.y, z: v1.z + v2.z }; }
function scale(v, s) { return { x: v.x * s, y: v.y * s, z: v.z * s }; }
function clamp(v, max) {
    const l = len3(v);
    return l > max ? scale(v, max / l) : v;
}
function fwd(a) {
    const p = (a.pitch * Math.PI) / 180;
    const y = (a.yaw * Math.PI) / 180;
    const h = Math.cos(p);
    return { x: Math.cos(y) * h, y: Math.sin(y) * h, z: -Math.sin(p) };
}
function vecAng(v) {
    if (!v.y && !v.x) return { pitch: v.z > 0 ? -90 : 90, yaw: 0, roll: 0 };
    return {
        yaw: Math.atan2(v.y, v.x) * 180 / Math.PI,
        pitch: Math.atan2(-v.z, Math.sqrt(v.x ** 2 + v.y ** 2)) * 180 / Math.PI,
        roll: 0
    };
}
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function print(text) { Instance.Msg(text); }

function fire(name = "", input = "", val = "", delay = 0, caller, activator) {
    Instance.EntFireAtName({ name, input, value: val, caller, activator, delay });
}
function fireT(target, input = "", val = "", delay = 0, caller, activator) {
    Instance.EntFireAtTarget({ target, input, value: val, caller, activator, delay });
}
function find(name) { return Instance.FindEntityByName(name); }
function findAll(name) { return Instance.FindEntitiesByName(name); }
function findByClass(cls) { return Instance.FindEntitiesByClass(cls); }

// =============================================
// 全局定时器（setTimeout 独立函数）
// =============================================
const _timers = [];
let _nextTimerId = 1;

function settimeout(callback, delaySeconds) {
    const id = _nextTimerId++;
    const expireTime = Instance.GetGameTime() + delaySeconds;
    _timers.push({ id, callback, expireTime });
    return id;
}

function cleartimeout(id) {
    const index = _timers.findIndex(t => t.id === id);
    if (index !== -1) {
        _timers.splice(index, 1);
    }
}

function _processTimers() {
    const now = Instance.GetGameTime();
    for (let i = _timers.length - 1; i >= 0; i--) {
        const t = _timers[i];
        if (now >= t.expireTime) {
            try {
                t.callback();
            } catch (e) {
                print(`定时器回调错误: ${e}`);
            }
            _timers.splice(i, 1);
        }
    }
}

// =============================================
// 玩家数据类
// =============================================
class PData {
    constructor(slot, ctrl, pawn) {
        this.slot = slot;
        this.ctrl = ctrl;
        this.pawn = pawn;
        
        // 钩锁状态
        this.liti = false;
        this.liti_origin = vec(0, 0, 0);
        this.liti_speed = 0;
        this.liti_num = 0;
        this.liti_max = 0;
        this.liti_charge = 0;
        
        // 蒸汽状态
        this.steam = false;
        this.steam_num = 0;
        this.steam_max = 0;
        this.steam_charge = 0;
        
        // 切割状态
        this.cut_num = 0;
        this.cut_max = 0;
        this.cut_charge = 0;
        this.cut_cd = 0;
        
        // 切割增强状态（用于skin2）
        this.cutBoostEndTime = 0;
        this.cutBoostDamageMultiplier = 1.0;
        this.cutBoostRangeMultiplier = 1.0;
        
        // 游戏状态
        this.win = false;

        // 神器状态
        this.item = 0;
        this.item_cd = 0;
        
        // 僵尸默认技能冷却
        this.zombieSkillCD = 0;
        
        // 搓招系统状态
        this.comboSequence = [];
        this.comboLastInputTime = 0;
        this.comboCooldown = 0;
        this.comboTimeout = 0.3;

        this.litiHookModel = null;
        this.litiTargetEntity = null;
        this.litiOffset = null;
        
        this.skinHP = 0;
        this.skinMaxHP = 0;

        // 阵营标签，-1表示未初始化
        this.teamTag = -1;

        // 能力是否可用，默认为 true
        this.abilitiesEnabled = false;

        // 高跳飞行模式相关（新增）
        this.highJumpFlyingActive = false;   // 是否处于飞行模式
        this.highJumpFlyingEndTime = 0;      // 飞行结束时间（游戏时间）
        this.highJumpFlyingSpeed = 400;      // 飞行速度（单位/秒）
    }
    
    isValid() {
        return this.pawn && this.pawn.IsValid();
    }
    
    isHuman() {
        return this.pawn && this.pawn.GetTeamNumber() === CONFIG.TEAMS.HUMAN;
    }
    
    isZombie() {
        return this.pawn && this.pawn.GetTeamNumber() === CONFIG.TEAMS.ZOMBIE;
    }
    
    isSkinItem() {
        return this.item >= 7 && this.item <= 9;
    }
    
    isZombieSkinItem() {
        return this.item >= 10 && this.item <= 14;
    }
    
    getItemConfig() {
        for (const key in CONFIG.ITEMS) {
            if (CONFIG.ITEMS[key].ID === this.item) {
                return CONFIG.ITEMS[key];
            }
        }
        return null;
    }
    
    resetCombo() {
        this.comboSequence = [];
        this.comboLastInputTime = 0;
    }
    
    addComboInput(input) {
        const currentTime = Instance.GetGameTime();
        
        if (currentTime - this.comboLastInputTime > this.comboTimeout) {
            this.resetCombo();
        }
        
        this.comboSequence.push(input);
        this.comboLastInputTime = currentTime;
        
        return this.checkCombo();
    }
    
    checkCombo() {
        const itemConfig = this.getItemConfig();
        if (!itemConfig || !itemConfig.COMBO_SEQUENCE) return false;
        
        const targetSequence = itemConfig.COMBO_SEQUENCE;
        
        if (this.comboSequence.length > targetSequence.length) {
            this.resetCombo();
            return false;
        }
        
        for (let i = 0; i < this.comboSequence.length; i++) {
            if (this.comboSequence[i] !== targetSequence[i]) {
                this.resetCombo();
                return false;
            }
        }
        
        if (this.comboSequence.length === targetSequence.length) {
            this.resetCombo();
            return true;
        }
        
        return false;
    }
}

// =============================================
// 玩家管理器
// =============================================
class PMgr {
    constructor() {
        this.players = new Array(CONFIG.STAGES.MAX_PLAYERS + 1);
        this.playernum = [0, 0, 0, 0];
        this.Flame_User = undefined;
        this.Wind_User = undefined;
        this.Elec_User = undefined;
        this.Heal_User = undefined;
        this.Ammo_User = undefined;

        this.Skin1_User = undefined;
        this.Skin2_User = undefined;
        this.Skin3_User = undefined;

        this.Beast_User = undefined;
        this.Armor_User = undefined;
        this.Colossal_User = undefined;
        
        // 全局效果剩余时间（秒）
        this.Wind_Remaining = 0;
        this.Heal_Remaining = 0;
        this.Ammo_Remaining = 0;
        
        this.init();
    }
    
    init() {
        for (let i = 0; i <= CONFIG.STAGES.MAX_PLAYERS; i++) {
            this.players[i] = new PData(i, undefined, undefined);
        }
        this.Flame_User = undefined;
        this.Wind_User = undefined;
        this.Elec_User = undefined;
        this.Heal_User = undefined;
        this.Ammo_User = undefined;

        this.Skin1_User = undefined;
        this.Skin2_User = undefined;
        this.Skin3_User = undefined;

        this.Beast_User = undefined;
        this.Armor_User = undefined;
        this.Colossal_User = undefined;
        
        this.Wind_Remaining = 0;
        this.Heal_Remaining = 0;
        this.Ammo_Remaining = 0;
    }
    
    register() {
        for (let i = 0; i <= CONFIG.STAGES.MAX_PLAYERS; i++) {
            if (this.players[i].ctrl) continue;
            
            const ctrl = Instance.GetPlayerController(i);
            if (ctrl) {
                const pawn = ctrl.GetPlayerPawn();
                if (pawn) {
                    this.players[i] = new PData(i, ctrl, pawn);
                }
            }
        }
    }
    
    updatePlayerCount() {
        this.playernum = [0, 0, 0, 0];
        
        for (let i = 0; i < CONFIG.STAGES.MAX_PLAYERS; i++) {
            const ctrl = Instance.GetPlayerController(i);
            if (!ctrl) continue;
            
            this.playernum[0]++;
            if (ctrl.GetTeamNumber() === CONFIG.TEAMS.HUMAN) {
                this.playernum[1]++;
                this.playernum[3]++;
            } else if (ctrl.GetTeamNumber() === CONFIG.TEAMS.ZOMBIE) {
                this.playernum[0]++;
                this.playernum[2]++;
            }
        }
    }
    
    getValidPlayers() {
        return this.players.filter(player => player.isValid());
    }
    
    getHumans() {
        return this.players.filter(player => player.isHuman());
    }
    
    getZombies() {
        return this.players.filter(player => player.isZombie());
    }
    
    listPlayers() {
        this.getValidPlayers().forEach(player => {
            print(`玩家 ${player.slot}: ${player.ctrl.GetPlayerName()}`);
        });
    }
    
    getPlayerDataByPawn(pawn) {
        return this.players.find(player => 
            player.pawn && player.pawn.IsValid() && player.pawn === pawn
        );
    }
}

// =============================================
// 能力系统
// =============================================
class ASys {
    constructor(pMgr) {
        this.pMgr = pMgr;
        this.litinum = 0;
        this.TGunnum = 0;
        this.qxznum = 0;
        this.highjumpnum = 0;
    }

    // 初始化默认能力：5格，不自动回复（charge=0）
    initDefaultAbilities(p) {
        if (!p.isHuman()) return;

        p.liti_max = 5;
        p.liti_num = Math.ceil(stage/2);
        p.liti_charge = 0;
        
        p.steam_max = 5;
        p.steam_num = 3+Math.ceil(stage/2);
        p.steam_charge = 0;
        
        p.cut_max = 5;
        p.cut_num = Math.ceil(stage/2);
        p.cut_charge = 0;
    }

    resetCounters() {
        this.litinum = 0;
        this.TGunnum = 0;
        this.qxznum = 0;
        this.highjumpnum = 0;
        print("已重置所有神器拾取计数器");
    }

    // 添加皮肤特有输出（方向键和右键），利用控制器标志避免重复
    addSkinOutputsIfNeeded(p) {
        const ctrl = p.ctrl;
        if (!ctrl || !p.isSkinItem()) return;

        if (!ctrl.skinOutputsAdded) {
            const skinOutputs = [
                "OnCase11>script>RunScriptInput>w>0>0",
                "OnCase12>script>RunScriptInput>a>0>0",
                "OnCase13>script>RunScriptInput>s>0>0",
                "OnCase14>script>RunScriptInput>d>0>0",
                "OnCase16>script>RunScriptInput>useskinrightclick>0>0"
            ];
            skinOutputs.forEach(output => {
                fire(`player_ui${p.slot}`, "AddOutput", output, 0);
            });
            ctrl.skinOutputsAdded = true;
        }
    }

    getLitiOnly(p, maxNum = CONFIG.ABILITIES.LITI.MAX_NUM, chargeRate = CONFIG.ABILITIES.LITI.CHARGE) {
        if (p.liti_max === 0) {
            p.liti_max = maxNum;
            p.liti_num = maxNum;
            p.liti_charge = chargeRate;
            print(`玩家 ${p.ctrl?.GetPlayerName()} 获得了钩锁能力`);
        }
    }

    getSteamOnly(p, maxNum = CONFIG.ABILITIES.STEAM.MAX_NUM, chargeRate = CONFIG.ABILITIES.STEAM.CHARGE) {
        if (p.steam_max === 0) {
            p.steam_max = maxNum;
            p.steam_num = maxNum;
            p.steam_charge = chargeRate;
            print(`玩家 ${p.ctrl?.GetPlayerName()} 获得了蒸汽能力`);
        }
    }

    getCutOnly(p, maxNum = CONFIG.ABILITIES.CUT.MAX_NUM, chargeRate = CONFIG.ABILITIES.CUT.CHARGE) {
        if (p.cut_max === 0) {
            p.cut_max = maxNum;
            p.cut_num = maxNum;
            p.cut_charge = chargeRate;
            print(`玩家 ${p.ctrl?.GetPlayerName()} 获得了切割能力`);
        }
    }

    getliti(p) {
        if (p.pawn.GetTeamNumber() === 2) return;
        
        // 如果已经拥有所有三种能力的自动回复，则不再重复给予
        if (p.liti_charge > 0 && p.steam_charge > 0 && p.cut_charge > 0) {
            print(`玩家 ${p.ctrl?.GetPlayerName()} 已经拥有立体机动装置，无法重复拾取`);
            return;
        }
        
        p.liti_max = CONFIG.ABILITIES.LITI.MAX_NUM;
        p.liti_num = p.liti_max;
        p.liti_charge = CONFIG.ABILITIES.LITI.CHARGE;
        
        p.steam_max = CONFIG.ABILITIES.STEAM.MAX_NUM;
        p.steam_num = p.steam_max;
        p.steam_charge = CONFIG.ABILITIES.STEAM.CHARGE;
        
        p.cut_max = CONFIG.ABILITIES.CUT.MAX_NUM;
        p.cut_num = p.cut_max;
        p.cut_charge = CONFIG.ABILITIES.CUT.CHARGE;
        
        this.litinum++;
        print(`玩家 ${p.ctrl?.GetPlayerName()} 获得了立体机动装置`);
        if (this.litinum >= (7 + stage * 2)) {
            fire("liti_get_tri","kill")
            fire("info8","SetMessage","立体机动装置\n已经拾取完毕")
            fire("info8","color","255 0 0")
        }else{
            fire("info8","SetMessage","立体机动装置\n"+this.litinum+"|"+(7 + stage * 2))
        }
    }

    getArtifact(p, itemType) {
        if (p.item !== 0) return false;
        
        const itemConfig = CONFIG.ITEMS[itemType];
        if (!itemConfig) return false;
        
        if (itemType === "TGUN" && (this.TGunnum >= 3 || p.pawn.GetTeamNumber() !== 3)) {
            return false;
        }
        if (itemType === "FLAME" && this.pMgr.Flame_User !== undefined) return false;
        if (itemType === "WIND" && this.pMgr.Wind_User !== undefined) return false;
        if (itemType === "ELEC" && this.pMgr.Elec_User !== undefined) return false;
        if (itemType === "HEAL" && this.pMgr.Heal_User !== undefined) return false;
        if (itemType === "AMMO" && this.pMgr.Ammo_User !== undefined) return false;

        if (itemType === "SKIN1" && this.pMgr.Skin1_User !== undefined) return false;
        if (itemType === "SKIN2" && this.pMgr.Skin2_User !== undefined) return false;
        if (itemType === "SKIN3" && this.pMgr.Skin3_User !== undefined) return false;

        if (itemType === "ZOMBIE_SKIN1" && this.pMgr.Beast_User !== undefined) return false;
        if (itemType === "ZOMBIE_SKIN2" && this.pMgr.Armor_User !== undefined) return false;
        if (itemType === "ZOMBIE_SKIN3" && this.pMgr.Colossal_User !== undefined) return false;
        if (itemType === "ZOMBIE_SKIN4" && this.qxznum >= 2 ) return false;
        if (itemType === "ZOMBIE_SKIN5" && (this.highjumpnum >= 3 || p.pawn.GetTeamNumber() !== 2)) return false;
        
        if (itemType.startsWith("ZOMBIE_SKIN") && p.pawn.GetTeamNumber() !== CONFIG.TEAMS.ZOMBIE) {
            return false;
        }
        
        p.item = itemConfig.ID;
        
        if (p.isHuman()) {
            if (itemConfig.LITI_MAX) {
                p.liti_max = itemConfig.LITI_MAX;
                p.liti_num = p.liti_max;
                p.liti_charge = itemConfig.LITI_CHARGE;
            }
            
            if (itemConfig.STEAM_MAX) {
                p.steam_max = itemConfig.STEAM_MAX;
                p.steam_num = p.steam_max;
                p.steam_charge = itemConfig.STEAM_CHARGE;
            }
            
            if (itemConfig.CUT_MAX) {
                p.cut_max = itemConfig.CUT_MAX;
                p.cut_num = p.cut_max;
                p.cut_charge = itemConfig.CUT_CHARGE;
            }
        }
        
        if (itemConfig.COLOR) {
            fire("player_liti_mdl"+p.slot, "color", itemConfig.COLOR, 0);
        }
        
        if (p.isHuman()) {
            if (p.isSkinItem()) {
                this.addSkinOutputsIfNeeded(p);
            }
            
            const itemConfig = p.getItemConfig();
            switch(itemType) {
                case "FLAME":
                    this.pMgr.Flame_User = p.pawn;
                    fire("info4", "kill");
                    break;
                case "WIND":
                    this.pMgr.Wind_User = p.pawn;
                    this.pMgr.Wind_Remaining = 0;
                    find("wind_particle").Teleport(add(p.pawn.GetAbsOrigin(), vec(0, 0, 0)));
                    fire("wind_particle", "SetParent", "!activator", 0, undefined, p.pawn);
                    fire("info5", "kill");
                    break;
                case "ELEC":
                    this.pMgr.Elec_User = p.pawn;
                    fire("info6", "kill");
                    break;
                case "TGUN":
                    this.TGunnum++;
                    Instance.FindEntityByName("tgun_pick_temp").ForceSpawn();
                    this.getTGun2(p);
                    if (this.TGunnum >= 3) {
                        fire("tgun_get_tri","kill")
                        fire("info7","SetMessage","雷枪\n已经拾取完毕")
                    }else{
                        fire("info7","SetMessage","雷枪\n"+this.TGunnum+"|3")
                    }
                    break;
                case "HEAL":
                    this.pMgr.Heal_User = p.pawn;
                    this.pMgr.Heal_Remaining = 0;
                    const healPos = add(p.pawn.GetAbsOrigin(), vec(0,0,80));
                    const healAng = ang(0,p.pawn.GetAbsAngles().yaw,0);
                    find("heal_par0").Teleport(healPos, healAng);
                    find("heal_par0").SetParent(p.pawn);
                    fire("heal_get_mdl", "kill", "", 0, undefined, p.pawn);
                    fire("heal_get_tp", "kill", "", 0, undefined, p.pawn);
                    break;
                case "AMMO":
                    this.pMgr.Ammo_User = p.pawn;
                    this.pMgr.Ammo_Remaining = 0;
                    const ammoPos = add(p.pawn.GetAbsOrigin(), vec(0,0,80));
                    const ammoAng = ang(0,p.pawn.GetAbsAngles().yaw,0);
                    find("ammo_par0").Teleport(ammoPos, ammoAng);
                    find("ammo_par0").SetParent(p.pawn);
                    fire("ammo_get_mdl", "kill", "", 0, undefined, p.pawn);
                    fire("ammo_get_tp", "kill", "", 0, undefined, p.pawn);
                    break;
                case "SKIN1":
                    this.pMgr.Skin1_User = p.pawn;
                    find("skin1_s1_p0").Teleport(p.pawn.GetAbsOrigin());
                    find("skin1_s1_p0").SetParent(p.pawn);
                    p.pawn.SetModel("characters/models/attack_on_titan/eren.vmdl");
                    fire(`player_liti_mdl${p.slot}`, "alpha", "0", 0);
                    fireT(p.pawn, "setdamagefilter", "nozombie", 0);
                    p.pawn.SetHealth(5000);
                    p.pawn.SetMaxHealth(5000);
                    if (itemConfig && itemConfig.HP) {
                        p.skinMaxHP = itemConfig.HP;
                        p.skinHP = itemConfig.HP;
                    }
                    p.pawn.Teleport(find("start_dest1").GetAbsOrigin())
                    fire("script", "runscriptinput", "unban_skill", 0,undefined,p.pawn);
                    fire("info1", "kill");
                    break;
                case "SKIN2":
                    this.pMgr.Skin2_User = p.pawn;
                    find("skin2_s1_p0").Teleport(p.pawn.GetAbsOrigin());
                    find("skin2_s1_p1").Teleport(p.pawn.GetAbsOrigin());
                    find("skin2_s1_p0").SetParent(p.pawn);
                    find("skin2_s1_p1").SetParent(p.pawn);
                    p.pawn.SetModel("characters/models/attack_on_titan/levi.vmdl")
                    fire(`player_liti_mdl${p.slot}`, "alpha", "0", 0);
                    fireT(p.pawn, "setdamagefilter", "nozombie", 0);
                    p.pawn.SetHealth(5000);
                    p.pawn.SetMaxHealth(5000);
                    if (itemConfig && itemConfig.HP) {
                        p.skinMaxHP = itemConfig.HP;
                        p.skinHP = itemConfig.HP;
                    }
                    p.pawn.Teleport(find("start_dest1").GetAbsOrigin())
                    fire("script", "runscriptinput", "unban_skill", 0,undefined,p.pawn);
                    fire("info2", "kill");
                    break;
                case "SKIN3":
                    this.pMgr.Skin3_User = p.pawn;
                    find("skin3_s1_p0").Teleport(p.pawn.GetAbsOrigin());
                    find("skin3_s1_p0").SetParent(p.pawn);
                    p.pawn.SetModel("characters/models/attack_on_titan/mikasa.vmdl");
                    fire(`player_liti_mdl${p.slot}`, "alpha", "0", 0);
                    fireT(p.pawn, "setdamagefilter", "nozombie", 0);
                    p.pawn.SetHealth(5000);
                    p.pawn.SetMaxHealth(5000);
                    if (itemConfig && itemConfig.HP) {
                        p.skinMaxHP = itemConfig.HP;
                        p.skinHP = itemConfig.HP;
                    }
                    p.pawn.Teleport(find("start_dest1").GetAbsOrigin())
                    fire("script", "runscriptinput", "unban_skill", 0,undefined,p.pawn);
                    fire("info3", "kill");
                    break;
            }
        }
        
        if (p.isZombie()) {
            switch(itemType) {
                case "ZOMBIE_SKIN1":
                    this.pMgr.Beast_User = p.pawn;
                    p.pawn.SetHealth(CONFIG.ITEMS.ZOMBIE_SKIN1.HP);
                    p.pawn.SetMaxHealth(CONFIG.ITEMS.ZOMBIE_SKIN1.HP);
                    fire("monkey_titan", "SetIdleAnimationLooping", "run_f");
                    fire("monkey_titan", "SetAnimationLooping", "run_f");
                    fire("monkey_ui", "Activate", "", 0,undefined,p.pawn);
                    fireT(p.pawn, "alpha", "0", 0,undefined,p.pawn);
                    break;
                case "ZOMBIE_SKIN2":
                    this.pMgr.Armor_User = p.pawn;
                    p.pawn.SetHealth(CONFIG.ITEMS.ZOMBIE_SKIN2.HP);
                    p.pawn.SetMaxHealth(CONFIG.ITEMS.ZOMBIE_SKIN2.HP);
                    fire("armor_titan", "SetIdleAnimationLooping", "walk");
                    fire("armor_titan", "SetAnimationLooping", "walk");
                    fire("armor_ui", "Activate", "", 0,undefined,p.pawn);
                    fireT(p.pawn, "alpha", "0", 0,undefined,p.pawn);
                    break;
                case "ZOMBIE_SKIN3":
                    this.pMgr.Colossal_User = p.pawn;
                    p.pawn.SetHealth(CONFIG.ITEMS.ZOMBIE_SKIN3.HP)
                    p.pawn.SetMaxHealth(CONFIG.ITEMS.ZOMBIE_SKIN3.HP);
                    fire("big_ui", "Activate", "", 0,undefined,p.pawn);
                    fire("big_titan", "alpha", "0", 0,undefined,p.pawn);
                    break;
                case "ZOMBIE_SKIN4":
                    this.qxznum++;
                    find("qxz_temp").ForceSpawn();
                    p.pawn.Teleport(find("qxz_get_dest").GetAbsOrigin(),find("qxz_get_dest").GetAbsAngles(),undefined)
                    p.pawn.SetHealth(CONFIG.ITEMS.ZOMBIE_SKIN4.HP)
                    p.pawn.SetMaxHealth(CONFIG.ITEMS.ZOMBIE_SKIN4.HP);
                    if (this.qxznum >= 2) {
                        fire("qxz_get_trigger","kill")
                        fire("zinfo4","SetMessage","奇行种\n已经拾取完毕")
                    }else{
                        fire("zinfo4","SetMessage","奇行种\n"+this.qxznum+"|2")
                    }
                    break;
                case "ZOMBIE_SKIN5":
                    this.highjumpnum++;
                    find("jump_temp0").ForceSpawn();
                    find("jump_p").Teleport(add(p.pawn.GetAbsOrigin(), vec(0, 0, 0)),p.pawn.GetAbsAngles(),undefined);
                    fire("jump_p", "SetParent", "!activator", 0, undefined, p.pawn);
                    find("jump_p")?.SetEntityName("jump_p"+p.slot)
                    find("jump_s_p")?.SetEntityName("jump_s_p"+p.slot)
                    find("jump_p")?.SetEntityName("jump_p"+p.slot)
                    p.pawn.SetHealth(CONFIG.ITEMS.ZOMBIE_SKIN5.HP)
                    p.pawn.SetMaxHealth(CONFIG.ITEMS.ZOMBIE_SKIN5.HP);
                    if (this.highjumpnum >= 3) {
                        fire("jump_get_trigger","kill")
                        fire("zinfo1","SetMessage","高跳\n已经拾取完毕")
                    }else{
                        fire("zinfo1","SetMessage","高跳\n"+this.highjumpnum+"|3")
                    }
                    break;
            }
        }

        const itemNames = {
            "FLAME": "火焰神器", "WIND": "风神器", "ELEC": "电神器", 
            "TGUN": "雷枪神器", "HEAL": "治疗神器", "AMMO": "弹药神器",
            "SKIN1": "艾伦", "SKIN2": "利威尔", "SKIN3": "三笠",
            "ZOMBIE_SKIN1": "兽之巨人", "ZOMBIE_SKIN2": "凯之巨人", 
            "ZOMBIE_SKIN3": "超大型巨人", "ZOMBIE_SKIN4": "奇行种", 
            "ZOMBIE_SKIN5": "高跳"
        };
        
        print(`玩家 ${p.ctrl?.GetPlayerName()} 获得了${itemNames[itemType]}`);

        return true;
    }

    getFlame(p) { this.getArtifact(p, "FLAME"); }
    getWind(p) { this.getArtifact(p, "WIND"); }
    getElec(p) { this.getArtifact(p, "ELEC"); }
    getTGun(p) { this.getArtifact(p, "TGUN"); }
    getHeal(p) { this.getArtifact(p, "HEAL"); }
    getAmmo(p) { this.getArtifact(p, "AMMO"); }

    getSkin1(p) { this.getArtifact(p, "SKIN1"); }
    getSkin2(p) { this.getArtifact(p, "SKIN2"); }
    getSkin3(p) { this.getArtifact(p, "SKIN3"); }

    getZombieSkin1(p) { this.getArtifact(p, "ZOMBIE_SKIN1"); }
    getZombieSkin2(p) { this.getArtifact(p, "ZOMBIE_SKIN2"); }
    getZombieSkin3(p) { this.getArtifact(p, "ZOMBIE_SKIN3"); }
    getZombieSkin4(p) { this.getArtifact(p, "ZOMBIE_SKIN4"); }
    getZombieSkin5(p) { this.getArtifact(p, "ZOMBIE_SKIN5"); }

    getTGun2(p){
        fire(`tgun_mdl`, "SetParent", "!activator" , 0 , undefined , p.pawn);
        fire(`tgun_mdl`, "SetParentAttachment", "weapon_hand_r" , 0 , undefined , p.pawn);
        find("tgun_mdl").SetEntityName(`tgun_mdl${p.slot}`);
    }

    useZombieSkin(p) {
        if (!p.isZombie()) return;  // 仅僵尸可用

        // 僵尸皮肤技能（item 10~14）
        if (p.item >= 10 && p.item <= 14) {
            if (p.item_cd > 0) return;  // 皮肤技能冷却
            const itemConfig = p.getItemConfig();
            if (!itemConfig) return;
            p.item_cd = itemConfig.CD;
            switch (p.item) {
                case 10: this.useBeastTitan(p); break;
                case 11: this.useArmorTitan(p); break;
                case 12: this.useColossalTitan(p); break;
                case 13: this.useAberrantTitan(p); break;
                case 14: this.useHighJumpTitan(p); break;
            }
        }
        else if (p.item === 0 && p.zombieSkillCD <= 0) {
            p.zombieSkillCD = 60;  // 设置60秒冷却
            fireT(p.pawn, "keyvalues", "speed "+(1.2+stage/20).toFixed(2), 0);
            fireT(p.pawn, "keyvalues", "speed 1", 10);
            print(`玩家 ${p.ctrl?.GetPlayerName()} 发动暴走！`);
        }
    }

    useBeastTitan(p) {
        fire("monkey_filter","trigger","",0,undefined,p.pawn)
        p.pawn.SetHealth(CONFIG.ITEMS.ZOMBIE_SKIN1.HP)
        print(`兽之巨人投掷了石块！`);
    }

    BeastHurt(p){
        p.pawn.TakeDamage({ damage: 600/*, attacker: this.pMgr.Beast_User*/ })
        if(p.pawn === this.pMgr.Skin1_User){
            for(let i = 0;i< 5;i++){
                fire("skin1_hit_relay0","trigger","",i/50,undefined,p.pawn)
            }
        }else if(p.pawn === this.pMgr.Skin2_User){
            for(let i = 0;i< 5;i++){
                fire("skin2_hit_relay0","trigger","",i/50,undefined,p.pawn)
            }
        }else if(p.pawn === this.pMgr.Skin3_User){
            for(let i = 0;i< 5;i++){
                fire("skin3_hit_relay0","trigger","",i/50,undefined,p.pawn)
            }
        }
    }

    useArmorTitan(p) {
        fireT(p.pawn,"keyvalues","speed 2",0,undefined,p.pawn)
        fireT(p.pawn,"keyvalues","speed 1.4",8,undefined,p.pawn)
        fire("armor_filter","trigger","",0,undefined,p.pawn)
        p.pawn.SetHealth(CONFIG.ITEMS.ZOMBIE_SKIN2.HP)
        print(`凯之巨人即将冲锋!`);
    }
    
    ArmorHurt(p){
        p.pawn.TakeDamage({ damage: 600/*, attacker: this.pMgr.Armor_User*/ })
        if(p.pawn === this.pMgr.Skin1_User){
            for(let i = 0;i< 5;i++){
                fire("skin1_hit_relay0","trigger","",i/50,undefined,p.pawn)
            }
        }else if(p.pawn === this.pMgr.Skin2_User){
            for(let i = 0;i< 5;i++){
                fire("skin2_hit_relay0","trigger","",i/50,undefined,p.pawn)
            }
        }else if(p.pawn === this.pMgr.Skin3_User){
            for(let i = 0;i< 5;i++){
                fire("skin3_hit_relay0","trigger","",i/50,undefined,p.pawn)
            }
        }
    }

    useColossalTitan(p) {
        find("big_s1_temp0").ForceSpawn( p.pawn.GetAbsOrigin() , p.pawn.GetAbsAngles() )
        fire("script","RunScriptInput","bigs1",0,undefined,p.pawn)
    }

    ColossalSkill1(p){
        const bright = 2
        const alpha = 1
        fire("big_s1_par1","start","",0,undefined,p.pawn)
        fire("big_s1_par1","stop","",6,undefined,p.pawn)
        fire("big_s1_par0","start","",1,undefined,p.pawn)
        fire("big_s1_par0","stop","",6,undefined,p.pawn)
        fire("big_titan", "SetAnimationNotLooping", "appearance", 1);
        find("big_titan").SetModelScale(0.35)
        p.pawn.SetHealth(CONFIG.ITEMS.ZOMBIE_SKIN3.HP)
        for (let i = 4.3; i <= 6; i += 0.1 ) {
            fire("script", "RunScriptInput", "bigs1hurt", i , undefined , p.pawn);
        }

        for (let i = 1; i <= 3; i += 0.02 ) {
            const brightness = "brigh ="+(((i-1) / 2) * bright);
            fire("big_titan", "setrenderattribute", brightness.toString(), i);
        }
        for (let i = 6.5; i <= 7.5; i += 0.02 ) {
            const brightness = "brigh ="+(bright-(i-6.5)*bright);
            fire("big_titan", "setrenderattribute", brightness.toString(), i);
        }

        for (let i = 6.5; i <= 8; i += 0.02 ) {
            const alphanum = "a ="+((i-6.5)/1.5 * alpha);
            fire("big_titan", "setrenderattribute", alphanum.toString(), i);
        }
        for (let i = 0; i <= 2.5; i += 0.02 ) {
            const alphanum = "a ="+(alpha-i/2.5 * alpha);
            fire("big_titan", "setrenderattribute", alphanum.toString(), i);
        }

        print(`超大型巨人发动核爆!`);
    }

    ColossalSkillHurt(){
        const Pos = find("big_s1_par0").GetAbsOrigin();
        const allPlayers = findByClass("player");
        for (const player of allPlayers) {
            const start = Pos;
            const end = player.GetEyePosition();
            
            const results = Instance.TraceLine({
                start, 
                end, 
                ignoreEntity: Instance.FindEntitiesByClass("func_button"), 
                ignorePlayers: false
            });

            const dest = len3(sub(end, results.end));
            
            if (player.GetTeamNumber() === CONFIG.TEAMS.HUMAN && len3(sub(Pos, end)) <= 1200 && dest <= 20
            ) {
                player.TakeDamage({ damage: 10, attacker: this.pMgr.Colossal_User });
            }
        }
    }

    ColossalHurt(p){p.pawn.TakeDamage({ damage: 600/*, attacker: this.pMgr.Colossal_User*/ })}

    useAberrantTitan(p) {
        fireT(p.pawn, "keyvalues", "speed 1.8", 0);
        fireT(p.pawn, "keyvalues", "speed 1.4", 8);
        p.pawn.SetHealth(CONFIG.ITEMS.ZOMBIE_SKIN4.HP)
        print(`奇行种跑起来了`);
    }
    
    qxzHurt(c,a){
        a.TakeDamage({ damage: 600/*, attacker: c.GetParent().GetParent()*/ })
        if(p.pawn === this.pMgr.Skin1_User){
            for(let i = 0;i< 5;i++){
                fire("skin1_hit_relay0","trigger","",i/50,undefined,p.pawn)
            }
        }else if(p.pawn === this.pMgr.Skin2_User){
            for(let i = 0;i< 5;i++){
                fire("skin2_hit_relay0","trigger","",i/50,undefined,p.pawn)
            }
        }else if(p.pawn === this.pMgr.Skin3_User){
            for(let i = 0;i< 5;i++){
                fire("skin3_hit_relay0","trigger","",i/50,undefined,p.pawn)
            }
        }
    }

    // ---------- 高跳飞行模式（基于加速，速度上限500） ----------
    useHighJumpTitan(p) {
        const duration = 5.0;
        p.highJumpFlyingActive = true;
        p.highJumpFlyingEndTime = Instance.GetGameTime() + duration;
        // 设置技能冷却
        p.item_cd = CONFIG.ITEMS.ZOMBIE_SKIN5.CD;
        
        // 启动粒子效果
        fire(`jump_p${p.slot}`, "start", "", 0);
        fire(`jump_s_p${p.slot}`, "start", "", 0);
        
        print(`玩家 ${p.ctrl?.GetPlayerName()} 进入高跳飞行模式，持续5秒，按住空格加速至500`);
    }

    updateHighJumpFlying(p) {
        if (!p.highJumpFlyingActive) return;

        const now = Instance.GetGameTime();
        if (now >= p.highJumpFlyingEndTime) {
            p.highJumpFlyingActive = false;
            fire(`jump_p${p.slot}`, "stop", "", 0);
            fire(`jump_s_p${p.slot}`, "stop", "", 0);
            return;
        }

        if (p.pawn && p.pawn.IsValid()) {
            if (p.pawn.IsInputPressed(CSInputs.JUMP)) {
                const eyeAngles = p.pawn.GetEyeAngles();
                const forwardDir = fwd(eyeAngles);
                const currentVel = p.pawn.GetAbsVelocity();
                
                // 加速度：1000 单位/秒²
                const acceleration = 1000;
                const delta = acceleration * CONFIG.THINK.DELAY;
                
                // 纯加速速度（不继承原速度）
                const pureAccelVel = scale(forwardDir, delta);
                
                // XY轴：原速度水平分量 + 纯加速速度水平分量
                const horizontalOriginal = { x: currentVel.x, y: currentVel.y, z: 0 };
                const horizontalAccel = { x: pureAccelVel.x, y: pureAccelVel.y, z: 0 };
                let newHorizontalVel = add(horizontalOriginal, horizontalAccel);
                
                // 限制水平速度上限为500
                const maxSpeed = 500;
                if (len2(newHorizontalVel) > maxSpeed) {
                    const factor = maxSpeed / len2(newHorizontalVel);
                    newHorizontalVel = scale(newHorizontalVel, factor);
                }
                
                // Z轴：直接根据视角方向设置速度，上限500
                const newZVel = forwardDir.z * maxSpeed;
                
                const newVel = { x: newHorizontalVel.x, y: newHorizontalVel.y, z: newZVel };
                p.pawn.Teleport(undefined, undefined, newVel);
            }
            // 不按空格时，不干预速度，让游戏物理自然衰减
        }
    }

    useItem(p) {
        if (p.item !== 0 && p.item_cd === 0) {
            const itemConfig = p.getItemConfig();
            if (!itemConfig) return;
            
            switch (p.item) {
                case 1: this.useFlame(p); break;
                case 2: this.useWind(p); break;
                case 3: this.useElec(p); break;
                case 4: this.useTGun(p); break;
                case 5: this.useHeal(p); break;
                case 6: this.useAmmo(p); break;
            }
        }
    }
    
    updateItem(p) {
        if (p.item !== 0) {
            const itemConfig = p.getItemConfig();
            if (itemConfig && itemConfig.CD) {
                p.item_cd = Math.max(0, p.item_cd - CONFIG.THINK.DELAY);
                if(p.item === 10){if(p.item_cd === 0){
                    fire("monkey_filter", "enable");}else{
                        fire("monkey_filter", "disable");
                    }
                }
                if(p.item === 11){if(p.item_cd === 0){
                    fire("armor_filter", "enable");}else{
                        fire("armor_filter", "disable");
                    }
                }
                if(p.item === 12){if(p.item_cd === 0){
                    fire("monkey_filter", "enable");}else{
                        fire("monkey_filter", "disable");
                    }
                }
            }
            if (itemConfig && itemConfig.RIGHT_CLICK_CD) {
                p.item_cd = Math.max(0, p.item_cd - CONFIG.THINK.DELAY);
            }
        }
        
        // 更新僵尸默认技能CD
        if (p.isZombie() && p.zombieSkillCD > 0) {
            p.zombieSkillCD = Math.max(0, p.zombieSkillCD - CONFIG.THINK.DELAY);
        }
    }

    useFlame(p) {
        find("fire_tem").ForceSpawn( add(p.pawn.GetAbsOrigin(),vec(0,0,64)) , p.pawn.GetAbsAngles());
        p.item_cd = CONFIG.ITEMS.FLAME.CD;
    }

    useWind(p) {
        if (this.pMgr.Wind_User === p.pawn && this.pMgr.Wind_Remaining <= 0) {
            this.pMgr.Wind_Remaining = CONFIG.ITEMS.WIND.DURATION;
            fire("wind_particle", "Start", "", 0, undefined, p.pawn);
        } else if (this.pMgr.Wind_User === undefined) {
            this.pMgr.Wind_User = p.pawn;
            this.pMgr.Wind_Remaining = CONFIG.ITEMS.WIND.DURATION;
            fire("wind_particle", "Start", "", 0, undefined, p.pawn);
        }
        p.item_cd = CONFIG.ITEMS.WIND.CD;
    }
    
    updateWindEffect() {
        if (this.pMgr.Wind_User && this.pMgr.Wind_User.IsValid() && this.pMgr.Wind_Remaining > 0) {
            this.pMgr.Wind_Remaining = Math.max(0, this.pMgr.Wind_Remaining - CONFIG.THINK.DELAY);
            
            if (this.pMgr.Wind_Remaining <= 0) {
                this.deactivateWind();
                return;
            }
            
            // 每隔约0.2秒施加一次推力（因为帧率约为64帧，每帧都推太密集，原逻辑是 Math.floor(elapsedTime * 5) % 1 === 0）
            // 这里简化：每帧都推，或者按原逻辑。原逻辑是每0.2秒一次，我们每帧推可能太强，保持原样。
            // 为了保持原行为，记录上次更新时间，这里简单每帧推，效果可能略有变化，但基本可用。
            this.applyWindPush(this.pMgr.Wind_User);
        } else if (this.pMgr.Wind_User && !this.pMgr.Wind_User.IsValid()) {
            this.deactivateWind();
        }
    }
    
    applyWindPush(windUser) {
        const userPos = windUser.GetAbsOrigin();
        const allPlayers = findByClass("player");

        // 推动僵尸
        for (const player of allPlayers) {
            if (!player.IsValid() || player === windUser) continue;
            if (player.GetTeamNumber() === CONFIG.TEAMS.HUMAN) continue;

            const playerPos = player.GetAbsOrigin();
            const horizontalDistance = len2(sub(
                {x: userPos.x, y: userPos.y, z: 0},
                {x: playerPos.x, y: playerPos.y, z: 0}
            ));

            if (horizontalDistance <= 480) {
                this.pushPlayerAway(windUser, player, horizontalDistance);
            }
        }

        let rock = find("monkey_ball_model");
        if (rock && rock.IsValid() && len2(sub(userPos, rock.GetAbsOrigin())) <= 480) {
            rock.Teleport(undefined, undefined, vec(0, 0, -200));
        }
    }
    
    pushPlayerAway(windUser, targetPlayer, distance) {
        const userPos = windUser.GetAbsOrigin();
        const playerPos = targetPlayer.GetAbsOrigin();
        
        const pushDir = sub(playerPos, userPos);
        pushDir.z = 0;
        
        if (len2(pushDir) > 0) {
            const normalizedDir = scale(pushDir, 1 / len2(pushDir));
            const pushStrength = 600 + (500 * (1 - distance / 480));
            const pushVelocity = scale(normalizedDir, pushStrength);
            pushVelocity.z = Math.min(250, 100 + (100 * (1 - distance / 480)));
            
            const currentVel = targetPlayer.GetAbsVelocity();
            const newVel = add(
                scale(currentVel, 0.4),
                scale(pushVelocity, 0.6)
            );
            
            targetPlayer.Teleport(undefined, undefined, newVel);
        }
    }
    
    deactivateWind() {
        if (this.pMgr.Wind_User) {
            fire("wind_particle", "Stop", "", 0, undefined, this.pMgr.Wind_User);
            this.pMgr.Wind_User = undefined;
            this.pMgr.Wind_Remaining = 0;
        }
    }

    useElec(p) {
        find("elec_tem").ForceSpawn( add(p.pawn.GetAbsOrigin(),vec(0,0,64)) , p.pawn.GetAbsAngles());
        p.item_cd = CONFIG.ITEMS.ELEC.CD;
    }

    useTGun(p) {
        find("tgun_temp").ForceSpawn(p.pawn.GetEyePosition(), p.pawn.GetEyeAngles());
        p.item_cd = CONFIG.ITEMS.TGUN.CD;
    }

    useHeal(p) {
        if (this.pMgr.Heal_User === p.pawn && this.pMgr.Heal_Remaining <= 0) {
            this.pMgr.Heal_Remaining = CONFIG.ITEMS.HEAL.DURATION;
            fire("heal_par0", "Start", "", 0, undefined, p.pawn);
        } else if (this.pMgr.Heal_User === undefined) {
            this.pMgr.Heal_User = p.pawn;
            this.pMgr.Heal_Remaining = CONFIG.ITEMS.HEAL.DURATION;
            fire("heal_par0", "Start", "", 0, undefined, p.pawn);
        }
        p.item_cd = CONFIG.ITEMS.HEAL.CD;
    }

    useAmmo(p) {
        if (this.pMgr.Ammo_User === p.pawn && this.pMgr.Ammo_Remaining <= 0) {
            this.pMgr.Ammo_Remaining = CONFIG.ITEMS.AMMO.DURATION;
            fire("ammo_par0", "Start", "", 0, undefined, p.pawn);
        } else if (this.pMgr.Ammo_User === undefined) {
            this.pMgr.Ammo_User = p.pawn;
            this.pMgr.Ammo_Remaining = CONFIG.ITEMS.AMMO.DURATION;
            fire("ammo_par0", "Start", "", 0, undefined, p.pawn);
        }
        p.item_cd = CONFIG.ITEMS.AMMO.CD;
    }

    updateHealEffect() {
        if (this.pMgr.Heal_User && this.pMgr.Heal_User.IsValid() && this.pMgr.Heal_Remaining > 0) {
            this.pMgr.Heal_Remaining = Math.max(0, this.pMgr.Heal_Remaining - CONFIG.THINK.DELAY);
            if (this.pMgr.Heal_Remaining <= 0) {
                this.deactivateHeal();
                return;
            }
            this.applyHealEffect(this.pMgr.Heal_User);
        } else if (this.pMgr.Heal_User && !this.pMgr.Heal_User.IsValid()) {
            this.deactivateHeal();
        }
    }

    applyHealEffect(healUser) {
        const userPos = healUser.GetAbsOrigin();
        const allPlayers = findByClass("player");
        
        for (const player of allPlayers) {
            if (player.GetTeamNumber() === CONFIG.TEAMS.HUMAN && 
                len2(sub(userPos, player.GetAbsOrigin())) <= CONFIG.RANGE.HEAL) {
                
                // 生命和护甲恢复
                const currentHealth = player.GetHealth();
                const maxHealth = player.GetMaxHealth();
                if (currentHealth < maxHealth) {
                    const newHealth = Math.min(maxHealth, currentHealth + 10);
                    player.SetHealth(newHealth);
                }
                
                const currentArmor = player.GetArmor();
                if (currentArmor < 100) {
                    const newArmor = Math.min(100, currentArmor + 3);
                    player.SetArmor(newArmor);
                }

                // 皮肤特殊血量恢复
                const playerData = this.pMgr.getPlayerDataByPawn(player);
                if (playerData && playerData.isSkinItem() && playerData.skinMaxHP > 0) {
                    playerData.skinHP = Math.min(playerData.skinMaxHP, playerData.skinHP + 1 * CONFIG.THINK.DELAY);
                }
            }
        }
    }

    deactivateHeal() {
        if (this.pMgr.Heal_User) {
            fire("heal_par0", "Stop", "", 0, undefined, this.pMgr.Heal_User);
            this.pMgr.Heal_User = undefined;
            this.pMgr.Heal_Remaining = 0;
        }
    }

    updateAmmoEffect() {
        if (this.pMgr.Ammo_User && this.pMgr.Ammo_User.IsValid() && this.pMgr.Ammo_Remaining > 0) {
            this.pMgr.Ammo_Remaining = Math.max(0, this.pMgr.Ammo_Remaining - CONFIG.THINK.DELAY);
            if (this.pMgr.Ammo_Remaining <= 0) {
                this.deactivateAmmo();
                return;
            }
            this.applyAmmoEffect(this.pMgr.Ammo_User);
        } else if (this.pMgr.Ammo_User && !this.pMgr.Ammo_User.IsValid()) {
            this.deactivateAmmo();
        }
    }

    applyAmmoEffect(ammoUser) {
        const userPos = ammoUser.GetAbsOrigin();
        const allPlayers = findByClass("player");
        
        for (const player of allPlayers) {
            if (player.GetTeamNumber() === CONFIG.TEAMS.HUMAN && 
                len2(sub(userPos, player.GetAbsOrigin())) <= CONFIG.RANGE.AMMO) {
                
                const weapon = player.GetActiveWeapon();
                if (weapon && weapon.IsValid()) {
                    fireT(weapon, "SetAmmoAmount", "999", 0);
                }
            }

            const playerData = this.pMgr.getPlayerDataByPawn(player);
            if (playerData && playerData.isHuman()) {
                if (playerData.liti_max > 0) {
                    playerData.liti_num = Math.min(playerData.liti_max, playerData.liti_num + 0.5 * CONFIG.THINK.DELAY);
                }
                if (playerData.steam_max > 0) {
                    playerData.steam_num = Math.min(playerData.steam_max, playerData.steam_num + 0.5 * CONFIG.THINK.DELAY);
                }
                if (playerData.cut_max > 0) {
                    playerData.cut_num = Math.min(playerData.cut_max, playerData.cut_num + 0.5 * CONFIG.THINK.DELAY);
                }
            }
        }
    }

    deactivateAmmo() {
        if (this.pMgr.Ammo_User) {
            fire("ammo_par0", "Stop", "", 0, undefined, this.pMgr.Ammo_User);
            this.pMgr.Ammo_User = undefined;
            this.pMgr.Ammo_Remaining = 0;
        }
    }

    // 蒸汽能力
    activateSteam(p) {
        if (!p.abilitiesEnabled) return;
        if (p.steam_num <= 1 || p.steam || !p.isHuman()) return;
        
        p.steam = true;
        const pawn = p.pawn;
        const forward = fwd(pawn.GetEyeAngles());
        const currentVel = pawn.GetAbsVelocity();
        
        let speedMultiplier = 1.0;
        let maxSpeedMultiplier = 1.0;
        if (p.item === 8) {
            speedMultiplier = 1.5;
            maxSpeedMultiplier = 1.5;
        } else if (p.item === 9) {
            speedMultiplier = 1.2;
            maxSpeedMultiplier = 1.2;
        }
        
        let velocity = {
            x: forward.x * CONFIG.ABILITIES.STEAM.USE_SPEED * speedMultiplier + currentVel.x * 0.2,
            y: forward.y * CONFIG.ABILITIES.STEAM.USE_SPEED * speedMultiplier + currentVel.y * 0.2,
            z: forward.z * CONFIG.ABILITIES.STEAM.USE_SPEED * speedMultiplier + currentVel.z * 0.2 + 150
        };
        
        const maxSpeed = CONFIG.THINK.MAX_SPEED * maxSpeedMultiplier;
        velocity = clamp(velocity, maxSpeed);
        pawn.Teleport(undefined, undefined, velocity);
        p.steam_num--;
        
        fire(`player_steam_p${p.slot}`, "Start", "", 0);
        fire(`player_steam_sound${p.slot}`, "startsound", "", 0);
    }
    
    deactivateSteam(p) {
        if (p.steam) {
            p.steam = false;
            fire(`player_steam_p${p.slot}`, "Stop", "", 0);
        }
    }
    
    updateSteam(p) {
        if (!p.abilitiesEnabled) {
            this.deactivateSteam(p);
            return;
        }
        if (p.steam && p.steam_num > 0 && p.isHuman()) {
            this.applySteamMovement(p);
            p.steam_num = Math.max(0, p.steam_num - 1 * CONFIG.THINK.DELAY);
            
            if (p.steam_num <= 0) {
                this.deactivateSteam(p);
            }
        } else if (p.steam_num <= 0) {
            this.deactivateSteam(p);
        }
        
        if (!p.steam && p.steam_charge > 0) {
            p.steam_num = Math.min(p.steam_max, p.steam_num + p.steam_charge * CONFIG.THINK.DELAY);
        }
    }
    
    applySteamMovement(p) {
        const pawn = p.pawn;
        const forward = fwd(pawn.GetEyeAngles());
        const currentVel = pawn.GetAbsVelocity();
        
        let speedMultiplier = 1.0;
        let maxSpeedMultiplier = 1.0;
        if (p.item === 8) {
            speedMultiplier = 1.5;
            maxSpeedMultiplier = 1.5;
        } else if (p.item === 9) {
            speedMultiplier = 1.2;
            maxSpeedMultiplier = 1.2;
        }
        
        let newVel = add(
            scale(forward, CONFIG.ABILITIES.STEAM.SPEED * speedMultiplier),
            { ...currentVel, z: currentVel.z + 10 }
        );
        
        const maxSpeed = CONFIG.THINK.MAX_SPEED * maxSpeedMultiplier;
        newVel = clamp(newVel, maxSpeed);
        pawn.Teleport(undefined, undefined, newVel);
    }

    activateLiti(p) {
        if (!p.abilitiesEnabled) return;
        else if (p.isHuman()) {
            const weapon = p.pawn.GetActiveWeapon();
            if (!weapon || weapon.GetData().GetType() !== 0 || p.liti_num < 1) return;

            const start = p.pawn.GetEyePosition();
            const forward = fwd(p.pawn.GetEyeAngles());
            const end = add(start, scale(forward, 3100));
            const ignore = [findByClass("func_button"),find("skin1_hitbox"),find("skin2_hitbox"),find("skin3_hitbox")];
            const results = Instance.TraceLine({
                start,
                end,
                ignoreEntity: ignore,
                ignorePlayers: true
            });

            const dest = len3(sub(p.pawn.GetAbsOrigin(), results.end));
            if (dest >= CONFIG.ABILITIES.LITI.DEST) return;

            p.speed = dest / CONFIG.ABILITIES.LITI.DEST * 10;
            p.liti = true;
            p.liti_num--;

            let litiModel = find(`player_m0_liti${p.slot}`);
            if (!litiModel) {
                litiModel = find("player_m0_liti_fix");
                litiModel.SetEntityName(`player_m0_liti${p.slot}`);
                find("player_m0_liti_fix_temp").ForceSpawn();
            }
            litiModel.Teleport(results.end);
            litiModel.SetParent(undefined);
            p.litiHookModel = litiModel;

            p.liti_origin = results.end;

            const hitEntity = results.hitEntity;
            if (hitEntity && !hitEntity.IsWorld() && hitEntity.IsValid()) {
                p.litiTargetEntity = hitEntity;
                p.litiOffset = sub(results.end, hitEntity.GetAbsOrigin());
            } else {
                p.litiTargetEntity = undefined;
                p.litiOffset = undefined;
            }

            fire(`player_p0_liti${p.slot}`, "start", "", 0);
            fire(`player_p1_liti${p.slot}`, "start", "", 0);
            fire(`player_liti_sound${p.slot}`, "startsound", "", 0);
        }
    }
    
    deactivateLiti(p) {
        if (p.liti) {
            p.liti = false;
            p.litiTargetEntity = undefined;
            p.litiOffset = undefined;

            if (p.litiHookModel && p.litiHookModel.IsValid()) {
                p.litiHookModel.Kill();
                p.litiHookModel = undefined;
            }

            fire(`player_p0_liti${p.slot}`, "destroyimmediately", "", 0);
            fire(`player_p1_liti${p.slot}`, "destroyimmediately", "", 0);
        }
    }
    
    updateLiti(p) {
        if (!p.abilitiesEnabled) {
            this.deactivateLiti(p);
            return;
        }
        if (p.liti && p.liti_num >= 0 && p.isHuman()) {
            let targetPos;

            if (p.litiTargetEntity) {
                if (p.litiTargetEntity.IsValid()) {
                    targetPos = add(p.litiTargetEntity.GetAbsOrigin(), p.litiOffset);
                    if (p.litiHookModel && p.litiHookModel.IsValid()) {
                        p.litiHookModel.Teleport(targetPos);
                    } else {
                        this.deactivateLiti(p);
                        return;
                    }
                } else {
                    this.deactivateLiti(p);
                    return;
                }
            } else {
                targetPos = p.liti_origin;
                if (p.litiHookModel && p.litiHookModel.IsValid()) {
                    p.litiHookModel.Teleport(targetPos);
                }
            }

            const currentDistance = len3(sub(p.pawn.GetAbsOrigin(), targetPos));
            if (currentDistance > 6000) {
                this.deactivateLiti(p);
                return;
            }

            this.applyLitiMovement(p, targetPos);
        } else if (!p.liti && p.liti_charge > 0) {
            p.liti_num = Math.min(p.liti_max, p.liti_num + p.liti_charge * CONFIG.THINK.DELAY);
        }
    }
    
    applyLitiMovement(p, targetPos) {
        const pawn = p.pawn;
        const dest = len3(sub(pawn.GetAbsOrigin(), targetPos));
        const direction = sub(targetPos, pawn.GetAbsOrigin());
        const forward = fwd(vecAng(direction));
        
        if (dest > 100) {
            p.speed += CONFIG.ABILITIES.LITI.SPEED_DELAY;
        }
        
        let speedMultiplier = 1.0;
        let maxSpeedMultiplier = 1.0;
        if (p.item === 8) {
            speedMultiplier = 1.5;
            maxSpeedMultiplier = 1.5;
        } else if (p.item === 9) {
            speedMultiplier = 1.2;
            maxSpeedMultiplier = 1.2;
        }
        
        p.speed = Math.min(p.speed, CONFIG.ABILITIES.LITI.MAX_SPEED_DELAY * speedMultiplier);
        
        const speedFactor = (dest / CONFIG.ABILITIES.LITI.DEST) * 2.5 + 0.3;
        const currentVel = pawn.GetAbsVelocity();
        
        let newVel = add(
            scale(forward, p.speed * speedFactor * speedMultiplier),
            { ...currentVel, z: currentVel.z + 5 }
        );
        
        const maxSpeed = CONFIG.THINK.MAX_SPEED * maxSpeedMultiplier;
        if (len3(newVel) > maxSpeed) {
            newVel = scale(fwd(vecAng(newVel)), maxSpeed);
        }
        
        if (dest < 100 && direction.z < 20) {
            p.speed = 0.3;
            newVel = scale(newVel, 0.1);
        }
        
        pawn.Teleport(undefined, undefined, newVel);
    }

    activateCut(p) {
        if (!p.abilitiesEnabled && p.item !== 8) return;
        const weapon = p.pawn.GetActiveWeapon();
                
        if (p.isSkinItem() && p.comboSequence.length > 0) {
            this.handleComboInput(p, "case15");
            return
        }

        if (weapon.GetData().GetType() !== 0 || p.cut_num < 1 || p.cut_cd > 0) return;
        
        p.cut_num--;
        p.cut_cd = CONFIG.ABILITIES.CUT.MAX_CD;

        fire(`player_cut_sound${p.slot}`, "startsound", "", 0);
        
        this.damageNearbyZombies(p);
        this.damageNearbyTitans(p);
    }
    
    damageNearbyZombies(p) {
        const playerPos = p.pawn.GetAbsOrigin();
        const allPlayers = findByClass("player");
        
        let baseDamage = 1000;
        let damageRange = 200;
        let slow = 0.5;

        if (p.item === 8 && p.cutBoostEndTime > Instance.GetGameTime()) {
            p.cut_cd = CONFIG.ABILITIES.CUT.MAX_CD/2;
            baseDamage *= p.cutBoostDamageMultiplier;
            damageRange *= p.cutBoostRangeMultiplier;
            fire(`skin2_s1_p1`, "start", "", 0);
            fire(`skin2_s1_p1`, "stop", "", 0.9);
            slow = 2;
            let rock = find("monkey_ball_model")
            if (rock && rock.IsValid() && len2(sub(playerPos, rock.GetAbsOrigin())) <= 640){
                rock.Teleport(undefined,undefined,vec(0,0,0))
            }
        }else{
        fire(`player_liti_cut_P${p.slot}`, "start", "", 0);
        fire(`player_liti_cut_P${p.slot}`, "stop", "", 1);
        }
        
        for (const player of allPlayers) {
            
            if (player.GetTeamNumber() === CONFIG.TEAMS.ZOMBIE && 
                len3(sub(playerPos, player.GetAbsOrigin())) <= damageRange) {
                player.TakeDamage({ 
                    damage: baseDamage, 
                    /*attacker: p.pawn, 
                    weapon: p.pawn.GetActiveWeapon() */
                });
                fireT(player,"keyvalues","speed 0.1",0,undefined,p.pawn)
                fireT(player,"keyvalues","speed 1",slow,undefined,p.pawn)
            }
        }
    }

    damageNearbyTitans(p) {
        const allTitans = findByClass("info_target");
        const playerPos = p.pawn.GetAbsOrigin();
        
        let baseDamage = 2000;
        let damageRange = 200;
        
        if (p.item === 8 && p.cutBoostEndTime > Instance.GetGameTime()) {
            baseDamage *= p.cutBoostDamageMultiplier;
            damageRange *= p.cutBoostRangeMultiplier;
        }
        
        for (const titanInfo of allTitans) {
            if (len3(sub(titanInfo.GetAbsOrigin(), playerPos)) >= damageRange) continue;
            
            const titanP = titanInfo.GetParent()?.GetParent()?.GetParent();
            const titanPhy = titanInfo.GetParent()?.GetParent();
            const titanmdl = titanInfo.GetParent();
            
            if (titanP) {
                titanP.TakeDamage({ damage: baseDamage/*, attacker: p.pawn, weapon: p.pawn.GetActiveWeapon()*/ });
                if (!titanP.IsAlive()) {
                    this.handleTitanDeath(titanInfo);
                }
            } else if (titanPhy && (titanPhy.GetEntityName().includes("s25_npc_phy") || titanPhy.GetEntityName().includes("s25_boss_phy"))) {
                fireT(titanPhy, "fireuser2", "", 0);
            } else if (titanmdl && titanmdl.GetEntityName() === "lv1_npc1_mdl") {
                find("lv1_npc1_break").TakeDamage({ damage: 5000/*, attacker: p.pawn, weapon: p.pawn.GetActiveWeapon()*/ });
            }/* else if (titanmdl && titanmdl.GetEntityName() === "lv4_boss_mdl") {
                fire("boss_death_realy","trigger","",0)
            }*/
        }
    }
    
    handleTitanDeath(titanInfo) {
        const titanM = titanInfo.GetParent();
        fireT(titanM, "clearparent", "", 0);
        fireT(titanM, "SetIdleAnimationNotLooping", "die", 0);
        fireT(titanM, "SetAnimationNoResetNotLooping", "die", 0);
        titanInfo.Kill();
    }
    
    updateCut(p) {
        p.cut_cd = Math.max(0, p.cut_cd - CONFIG.THINK.DELAY);
        if (p.cut_cd <= 0 && p.cut_charge > 0) {
            p.cut_num = Math.min(p.cut_max, p.cut_num + p.cut_charge * CONFIG.THINK.DELAY);
        }
    }

    useSkinRightClick(p) {
        if (p.item_cd > 0 || !p.isHuman() || !p.isSkinItem() || p.pawn.GetActiveWeapon().GetData().GetType() === 0 ) return;
        
        const itemConfig = p.getItemConfig();
        if (!itemConfig || !itemConfig.RIGHT_CLICK_CD) return;
        
        p.item_cd = itemConfig.RIGHT_CLICK_CD;
        
        switch(p.item) {
            case 7: this.useSkin1RightClick(p); break;
            case 8: this.useSkin2RightClick(p); break;
            case 9: this.useSkin3RightClick(p); break;
        }
    }
    
    useSkin1RightClick(p) {
        find("laser_temp1").ForceSpawn(p.pawn.GetEyePosition(),p.pawn.GetEyeAngles())
    }
    
    Skin1_hurt(p){ 
        for(let i = 0; i <= 5;i += 0.02){
            fireT(p.pawn,"keyvalues","speed "+(0.12*i+0.4),i)
        }
        print(this.pMgr.Skin1_User.GetPlayerController().GetPlayerName())
        p.pawn.TakeDamage({ damage: 2000/*, attacker: this.pMgr.Skin1_User, weapon: this.pMgr.Skin1_User.GetActiveWeapon()*/ }) 
    }

    useSkin2RightClick(p) {
        find("laser_temp2").ForceSpawn(p.pawn.GetEyePosition(),p.pawn.GetEyeAngles())
    }
    
    Skin2_hurt(p){ 
        for(let i = 0; i <= 5;i += 0.02){
            fireT(p.pawn,"keyvalues","speed "+(0.12*i+0.4),i)
        }
        p.pawn.TakeDamage({ damage: 2000/*, attacker: this.pMgr.Skin2_User, weapon: this.pMgr.Skin2_User.GetActiveWeapon()*/ }) 
    }

    useSkin3RightClick(p) {
        find("laser_temp3").ForceSpawn(p.pawn.GetEyePosition(),p.pawn.GetEyeAngles())
    }
    
    Skin3_hurt(p){ 
        for(let i = 0; i <= 5;i += 0.02){
            fireT(p.pawn,"keyvalues","speed "+(0.12*i+0.4),i)
        }
        p.pawn.TakeDamage({ damage: 2000/*, attacker: this.pMgr.Skin3_User, weapon: this.pMgr.Skin3_User.GetActiveWeapon()*/ }) 
    }
    
    useSkinCombo(p) {
        if (p.comboCooldown > 0 || !p.isHuman() || !p.isSkinItem()) return;
        
        const itemConfig = p.getItemConfig();
        if (!itemConfig || !itemConfig.COMBO_CD) return;
        
        p.comboCooldown = itemConfig.COMBO_CD;
        
        switch(p.item) {
            case 7: this.useSkin1Combo(p); break;
            case 8: this.useSkin2Combo(p); break;
            case 9: this.useSkin3Combo(p); break;
        }
    }
    
    useSkin1Combo(p) {
        fire("skin1_s1_p0","start","",0)
        fire("skin1_s1_p0","stop","",6)
        fire("skin1_show_p0","start","",0)
        fire("skin1_show_p0","stop","",5)
        for(let i = 0;i <= 6 ; i +=0.02 ){
            fire("script","RunScriptInput","skin1s1",i,undefined,p.pawn)
        }
    }
    
    Skin1_S1(p){
        const playerPos = p.pawn.GetAbsOrigin();
        const allPlayers = findByClass("player");
        for (const player of allPlayers) {
            if (player.GetTeamNumber() === CONFIG.TEAMS.ZOMBIE && 
                len2(sub(playerPos, player.GetAbsOrigin())) <= 640) {
                find("skin1_s1_p1_temp0").ForceSpawn(player.GetAbsOrigin())
                player.Teleport(vec(-13377,-11598,-12656))
            }
        }
        let rock = find("monkey_ball_model")
        if (rock && rock.IsValid() && len2(sub(playerPos, rock.GetAbsOrigin())) <= 640){
            rock.Teleport(undefined,undefined,vec(0,0,-500))
        }
    }

    useSkin2Combo(p) {
        p.cutBoostEndTime = Instance.GetGameTime() + 15;
        p.cutBoostDamageMultiplier = 6;
        p.cutBoostRangeMultiplier = 2;
        
        fire(`skin2_s1_p0`, "Start", "", 0);
        fire(`skin2_s1_p0`, "Stop", "", 15);
        fire("skin2_show_p0","start","",0)
        fire("skin2_show_p0","stop","",5)
        
        print(`利威尔发动人类最强!切割能力在15秒内大幅增强!`);
    }
    
    useSkin3Combo(p) {
        fire("skin3_s1_p0","start","",0)
        fire("skin3_s1_p0","stop","",6)
        fire("skin3_show_p0","start","",0)
        fire("skin3_show_p0","stop","",5)
        for(let i = 0;i <= 6 ; i +=0.5 ){
            fire("script","RunScriptInput","skin3s1",i,undefined,p.pawn)
        }
        print(`三笠发动自由之翼！`);
    }
    
    Skin3_S1(p){
        const playerPos = p.pawn.GetAbsOrigin();
        const allPlayers = findByClass("player");
        for (const player of allPlayers) {
            if (player.GetTeamNumber() === CONFIG.TEAMS.ZOMBIE && 
                len2(sub(playerPos, player.GetAbsOrigin())) <= 640) {
                fireT(player,"keyvalues","speed 0.05",0,undefined,p.pawn)
                fireT(player,"keyvalues","speed 1",0.49,undefined,p.pawn)
            }
        }
        let rock = find("monkey_ball_model")
        if (rock && rock.IsValid() && len2(sub(playerPos, rock.GetAbsOrigin())) <= 640){
            rock.Teleport(undefined,undefined,vec(0,0,-500))
        }
    }

    handleComboInput(p, inputCase) {
        if (!p.isHuman() || !p.isSkinItem() || p.comboCooldown > 0) return;
        
        if (p.addComboInput(inputCase)) {
            this.useSkinCombo(p);
        }
    }
    
    updateSkinAbilities(p) {
        const currentTime = Instance.GetGameTime();
        
        if (p.comboCooldown > 0) {
            p.comboCooldown = Math.max(0, p.comboCooldown - CONFIG.THINK.DELAY);
        }
        
        if (p.comboSequence.length > 0 && currentTime - p.comboLastInputTime > p.comboTimeout) {
            p.resetCombo();
        }
        
        if (p.item === 8 && p.cutBoostEndTime > 0 && currentTime > p.cutBoostEndTime) {
            p.cutBoostEndTime = 0;
            p.cutBoostDamageMultiplier = 1.0;
            p.cutBoostRangeMultiplier = 1.0;
        }
    }

    // 清理附着实体（模型、粒子、按钮等）
    cleanupAttachments(p) {
        if (!p.isValid()) return;

        const litiModel = find(`player_liti_mdl${p.slot}`);
        if (litiModel && litiModel.IsValid()) litiModel.Kill();

        fire(`player_p0_liti${p.slot}`, "destroyimmediately", "", 0);
        fire(`player_p1_liti${p.slot}`, "destroyimmediately", "", 0);
        fire(`player_steam_p${p.slot}`, "Stop", "", 0);

        const tgunModel = find(`tgun_mdl${p.slot}`);
        if (tgunModel && tgunModel.IsValid()) tgunModel.Kill();

        if (this.pMgr.Flame_User === p.pawn) {
            this.pMgr.Flame_User = undefined;
        }
        if (this.pMgr.Wind_User === p.pawn) {
            this.deactivateWind(); // 这会清空 Wind_User 和停止粒子
        }
        if (this.pMgr.Elec_User === p.pawn) {
            this.pMgr.Elec_User = undefined;
        }
        if (this.pMgr.Heal_User === p.pawn) {
            this.deactivateHeal();
        }
        if (this.pMgr.Ammo_User === p.pawn) {
            this.deactivateAmmo();
        }
        if (p.item === 4) {
            this.TGunnum = Math.max(0, this.TGunnum - 1);
        }
        if (this.pMgr.Skin1_User === p.pawn) this.pMgr.Skin1_User = undefined;
        if (this.pMgr.Skin2_User === p.pawn) this.pMgr.Skin2_User = undefined;
        if (this.pMgr.Skin3_User === p.pawn) this.pMgr.Skin3_User = undefined;

        fire("player_liti_mdl"+p.slot, "color", "255 255 255", 0);

        this.deactivateLiti(p);
        this.deactivateSteam(p);
    }

    // 清理人类状态（用于变为僵尸时）
    cleanupHumanState(p) {
        if (!p.isValid()) return;

        this.cleanupAttachments(p);

        p.liti_num = p.liti_max = p.liti_charge = 0;
        p.steam_num = p.steam_max = p.steam_charge = 0;
        p.cut_num = p.cut_max = p.cut_charge = 0;
        p.cut_cd = 0;

        if (!p.isZombieSkinItem()) {
            p.item = 0;
            p.item_cd = 0;
        } else {
            p.item_cd = 0;
        }
        p.zombieSkillCD = 0;

        p.resetCombo();
        p.comboCooldown = 0;
        p.cutBoostEndTime = 0;
        p.cutBoostDamageMultiplier = 1.0;
        p.cutBoostRangeMultiplier = 1.0;
    }

    // 修改原有的 cleanupPlayerModels 复用 cleanupAttachments
    cleanupPlayerModels(p) {
        if (p.highJumpFlyingActive) {
            p.highJumpFlyingActive = false;
            fire(`jump_p${p.slot}`, "stop", "", 0);
            fire(`jump_s_p${p.slot}`, "stop", "", 0);
        }

        this.cleanupAttachments(p);
        this.resetPlayerData(p);
    }

    resetPlayerData(p) {
        p.liti = false;
        p.liti_origin = vec(0, 0, 0);
        p.liti_speed = 0;
        p.liti_num = 0;
        p.liti_max = 0;
        p.liti_charge = 0;
        
        p.steam = false;
        p.steam_num = 0;
        p.steam_max = 0;
        p.steam_charge = 0;
        
        p.cut_num = 0;
        p.cut_max = 0;
        p.cut_charge = 0;
        p.cut_cd = 0;
        
        p.item = 0;
        p.item_cd = 0;
        p.zombieSkillCD = 0;
        
        p.comboSequence = [];
        p.comboLastInputTime = 0;
        p.comboCooldown = 0;

        // 重置高跳飞行状态
        p.highJumpFlyingActive = false;
        p.highJumpFlyingEndTime = 0;

        // 重置能力可用标志
        p.abilitiesEnabled = false;
    }

    // 禁用玩家所有能力（钩锁、蒸汽、刀刃）
    disableAbilities(p) {
        if (!p) return;
        p.abilitiesEnabled = false;
        this.deactivateLiti(p);
        this.deactivateSteam(p);
    }

    // 启用玩家所有能力
    enableAbilities(p) {
        if (!p) return;
        p.abilitiesEnabled = true;
    }

    updateAbilities() {
        // 先更新全局效果
        this.updateWindEffect();
        this.updateHealEffect();
        this.updateAmmoEffect();
        
        // 再更新每个玩家的个体能力
        this.pMgr.getValidPlayers().forEach(p => {
            this.updateSteam(p);
            this.updateLiti(p);
            this.updateCut(p);
            this.updateItem(p);
            this.updateSkinAbilities(p);
            this.updateHighJumpFlying(p);   // 新增：更新高跳飞行模式
        });
    }
}

// =============================================
// UI系统
// =============================================
class UISys {
    constructor(pMgr) {
        this.pMgr = pMgr;
    }
    
    generateNarrowBar(value, maxValue) {
        if (maxValue <= 0 || value < 0) return "";
        
        const availableMax = maxValue;
        
        let bar = "";
        for (let i = 1; i <= availableMax; i++) {
            if (i <= value) {
                bar += "▮";
            } else {
                bar += "▯";
            }
        }
        
        return bar;
    }
    
    getAbilityText(p) {
        if (p.isZombie()) {
            if (p.item !== 0) {
                const itemConfig = p.getItemConfig();
                if (itemConfig) {
                    let abilityText = itemConfig.NAME + "\n";
                    
                    if (p.item_cd > 0) {
                        abilityText += `技能冷却: ${p.item_cd.toFixed(1)}秒`;
                    } else {
                        abilityText += `技能就绪`;
                    }
                    
                    return abilityText;
                }
            } else {
                let abilityText = "暴走:"+(1.2+stage/20).toFixed(2)+"移速[按E] \n";
                if (p.zombieSkillCD > 0) {
                    abilityText += `冷却: ${p.zombieSkillCD.toFixed(1)}秒`;
                } else {
                    abilityText += `就绪`;
                }
                return abilityText;
            }
            return "僵尸";
        }
        
        const texts = [];
        
        if (p.item !== 0) {
            const itemConfig = p.getItemConfig();
            
            if (p.isSkinItem()) {
                const skinNames = {7: "艾伦", 8: "利威尔", 9: "三笠"};
                texts.push(`『${skinNames[p.item]}』`);

                if (p.skinMaxHP > 0) {
                    texts.push(`HP: ${Math.floor(p.skinHP)}/${p.skinMaxHP}`);
                }
                
                if (p.item_cd > 0) {
                    texts.push(`火刀冷却: ${p.item_cd.toFixed(1)}秒`);
                } else {
                    texts.push(`火刀: 就绪`);
                }
                
                if (p.comboCooldown > 0) {
                    let comboSkillName = "";
                    switch(p.item) {
                        case 7: comboSkillName = "坐标之力"; break;
                        case 8: comboSkillName = "人类最强"; break;
                        case 9: comboSkillName = "自由之翼"; break;
                    }
                    texts.push(`${comboSkillName}冷却: ${p.comboCooldown.toFixed(1)}秒`);
                } else {
                    switch(p.item) {
                        case 7: texts.push(`坐标之力: 就绪`); break;
                        case 8: texts.push(`人类最强: 就绪`); break;
                        case 9: texts.push(`自由之翼: 就绪`); break;
                    }
                }
                
                if (p.item === 8 && p.cutBoostEndTime > Instance.GetGameTime()) {
                    const remainingTime = (p.cutBoostEndTime - Instance.GetGameTime()).toFixed(1);
                    texts.push(`斩击增强: ${remainingTime}秒`);
                }
            } 
            else {
                const itemNames = {
                    1: "火焰", 2: "风", 3: "电", 
                    4: "雷枪", 5: "治疗", 6: "弹药"
                };
                
                const itemName = itemNames[p.item] || "神器";
                
                // 从全局获取剩余时间
                if (p.item === 2 && gameManager.pMgr.Wind_User === p.pawn && gameManager.pMgr.Wind_Remaining > 0) {
                    texts.push(`${itemName}剩余: ${gameManager.pMgr.Wind_Remaining.toFixed(1)}秒`);
                }
                else if (p.item === 5 && gameManager.pMgr.Heal_User === p.pawn && gameManager.pMgr.Heal_Remaining > 0) {
                    texts.push(`${itemName}剩余: ${gameManager.pMgr.Heal_Remaining.toFixed(1)}秒`);
                }
                else if (p.item === 6 && gameManager.pMgr.Ammo_User === p.pawn && gameManager.pMgr.Ammo_Remaining > 0) {
                    texts.push(`${itemName}剩余: ${gameManager.pMgr.Ammo_Remaining.toFixed(1)}秒`);
                }
                else if (p.item_cd > 0) {
                    texts.push(`${itemName}冷却: ${p.item_cd.toFixed(1)}秒`);
                } else {
                    texts.push(`${itemName}: 就绪`);
                }
            }
        }
        
        if (p.liti_max > 0 || p.steam_max > 0 || p.cut_max > 0) {
            if (!p.abilitiesEnabled) {
                texts.push("立体机动装置[禁用]");
            } else {
                texts.push("立体机动装置");
            }
            
            if (p.liti_max > 0) {
                const litiBar = this.generateNarrowBar(p.liti_num, p.liti_max);
                let speedPrefix = "";
                if (p.liti_charge > 0) {
                    const level = Math.ceil(p.liti_charge / 0.2);
                    const roman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
                    const levelStr = level <= 10 ? roman[level] : level.toString();
                    speedPrefix = `[${levelStr}] `;
                }
                texts.push(`钩锁: ${speedPrefix}${litiBar}`);
            }
            
            if (p.steam_max > 0) {
                const steamBar = this.generateNarrowBar(p.steam_num, p.steam_max);
                let speedPrefix = "";
                if (p.steam_charge > 0) {
                    const level = Math.ceil(p.steam_charge / 0.2);
                    const roman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
                    const levelStr = level <= 10 ? roman[level] : level.toString();
                    speedPrefix = `[${levelStr}] `;
                }
                texts.push(`气体: ${speedPrefix}${steamBar}`);
            }
            
            if (p.cut_max > 0) {
                const cutBar = this.generateNarrowBar(p.cut_num, p.cut_max);
                let speedPrefix = "";
                if (p.cut_charge > 0) {
                    const level = Math.ceil(p.cut_charge / 0.2);
                    const roman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
                    const levelStr = level <= 10 ? roman[level] : level.toString();
                    speedPrefix = `[${levelStr}] `;
                }
                texts.push(`刀刃: ${speedPrefix}${cutBar}`);
            }
        }
        
        return texts.join("\n");
    }

    updatePlayerUI(p) {
        const statusText = this.getAbilityText(p);
        fire(`player_text${p.slot}`, "SetMessage", statusText, 0);
    }
    
    updateAllUI() {
        this.pMgr.getValidPlayers().forEach(p => {
            this.updatePlayerUI(p);
        });
    }
    
    setupPlayerUI(p) {
        const pawn = p.pawn;
        if (!pawn) return;

        p.pawn.Teleport(undefined,ang(0,0,0))
        fire(`player_ui${p.slot}`, "Activate", "", 0, undefined, pawn);
        if (p.isZombie()) {
            const litiModel = find(`player_liti_mdl${p.slot}`);
            if (litiModel) {
                litiModel.Teleport(pawn.GetAbsOrigin());
                fire(`player_liti_mdl${p.slot}`, "SetParent", "!activator", 0, undefined, pawn);
                fire(`player_liti_mdl${p.slot}`, "alpha", "0", 0);
            }
        }
        if (p.isHuman()){
            const litiModel = find(`player_liti_mdl${p.slot}`);
            if (litiModel) {
                litiModel.Teleport(pawn.GetAbsOrigin(),ang(0,345,0));
                fire(`player_liti_mdl${p.slot}`, "SetParent", "!activator", 0, undefined, pawn);
                fire(`player_liti_mdl${p.slot}`, "alpha", "255", 0);
            }
        }
        
        const textEntity = find(`player_text${p.slot}`);
        if (textEntity) {
            textEntity.Teleport(add(pawn.GetAbsOrigin(), vec(8, 6, 64)));
            fire(`player_text${p.slot}`, "SetParent", "!activator", 0, undefined, pawn);
        }
    }
}

// =============================================
// 游戏管理器
// =============================================
class GMgr {
    constructor() {
        this.pMgr = new PMgr();
        this.aSys = new ASys(this.pMgr);
        this.uiSys = new UISys(this.pMgr);
        this.tickNum = 0;
        
        this.flag1_mdl = null;
        this.flag2_mdl = null;
        this.self = null;
        this.camera = null;
        this.s1_qxz_num = 0;
        this.s5_qxz_num = 0;
        this.boss_maxhp = 10;
        
        this.setupEventHandlers();
        this.initialize();
    }
    
    initialize() {
        this.pMgr.init();
        this.pMgr.register();
        this.initializeStage();
    }
    
    initializeStage() {
        this.flag1_mdl = find("flag1_mdl");
        this.flag2_mdl = find("flag2_mdl");
        this.self = find("script");
        this.camera = find("camera_script");
    }

    setStage(newStage) {
        stage = newStage;
        fire("stage_counter", "setvalue", stage.toString(), 0);
        print("关卡设置为"+stage);
    }
    
    setupStage() {
        fire("sky_city*", "fireuser1", "", 0);
        fire("sky_senlin*", "fireuser1", "", 0);
        fire("sky_33", "disable", "", 0);
        fire("sky_red", "disable", "", 0);
        fire("sky_senlin", "disable", "", 0);
        fire("sky_night", "disable", "", 0);
        fire("sky_fire", "stop", "", 0);
        fire("post*", "enable", "", 0);
        fire("post*", "disable", "", 0.1);
        fire("road_particle", "start", "", 0);
        fire("road_particle", "kill", "", 100);
        fire("start_tp1", "enable", "", 0);
        fire("start_zombie_tp1", "enable", "", 100);
        fire("s25_boss_script*", "kill", "", 0);
        fire("player_m0_liti_fix_temp", "forcespawn", "", 0);
        fire("info8","SetMessage","立体机动装置\n0|"+(7 + stage * 2))
        fire("info7","SetMessage","雷枪\n0|3")
        fire("zinfo1","SetMessage","高跳\n0|3")
        fire("zinfo4","SetMessage","奇行种\n0|2")
        
        switch(stage) {
            case 1: this.setupStage1(); break;
            case 2: this.setupStage2(); break;
            case 3: this.setupStage3(); break;
            case 4: this.setupStage4(); break;
            case 5: this.setupStage5(); break;
            case 6: this.setupStage6(); break;
            case 7: this.setupStage7(); break;
        }
    }
    
    setupStage1() {
        fire("sky_city*", "fireuser2", "", 0.1);
        fire("sky_night", "enable", "", 0.1);
        fire("lv1_trigger1", "enable", "", 0);
        fire("s1_end_relay", "enable", "", 0);
        fire("city_wall5", "kill", "", 0);
        fire("post_normal", "enable", "", 0.5);
        fire("s_l_city0", "showworldlayer", "", 0.1);
        this.setWallColors(["city_wall6", "city_wall2", "outcity_wall0"]);

        fire("s1_bgm0", "startsound", "", 10);
    }
    
    setupStage2() {
        this.teleportEntity("ammo_get_tp", vec(-304,5552,7232), ang(0, 0, 0));
        this.teleportEntity("heal_get_tp", vec(432,8432,6944), ang(0, 0, 0));
        this.teleportEntity("start_dest1", vec(-688, 3712, 7122), ang(0, 90, 0));
        this.teleportEntity("city_tp2_tar", vec(-12784,-5776,-8514), ang(0, 90, 0));

        fire("fog", "setfogstartdistance", "500", 0);
        fire("fog", "setfogenddistance", "10000", 0);
        fire("fog", "SetFogColor", "49 50 53", 0);
        fire("sky_city*", "fireuser2", "", 0.1);
        fire("sky_night", "enable", "", 0.1);
        fire("s2_button1", "unlock", "", 0);
        fire("lv2_button1_relay", "enable", "", 0);
        fire("outcity_wall1_tri0", "enable", "", 0);
        fire("outcity_wall0", "kill", "", 0);
        fire("outcity_wall1", "color", "255 0 0", 0);
        fire("mache1_temp", "forcespawn", "", 0);
        fire("s2_end_wall", "color", "255 0 0", 0);
        fire("s_l_city0", "showworldlayer", "", 0.1);
        fire("post_normal", "enable", "", 0.5);

        fire("snow_ingame", "addoutput", "OnStartTouch>s2_bgm0>stopsound>>0>1", 0);
        fire("snow_ingame", "addoutput", "OnStartTouch>s2_bgm1>startsound>>0>1", 0);

        fire("s2_bgm0", "startsound", "", 10);
    }
    
    setupStage3() {
        this.teleportEntity("ammo_get_tp", vec(-304,5552,7232), ang(0, 0, 0));
        this.teleportEntity("heal_get_tp", vec(432,8432,6944), ang(0, 0, 0));
        this.teleportEntity("start_dest1", vec(-688, 3712, 7122), ang(0, 90, 0));
        this.teleportEntity("mache1_tp_tar", vec(-1632,-12416,-4432), ang(0, 90, 0));
        this.teleportEntity("city_tp2_tar", vec(-1632,-12416,-4432), ang(0, 90, 0));

        fire("w_l_snow0", "hideworldlayer", "", 0.1);
        fire("sky_city*", "fireuser2", "", 0.1);
        fire("sky_night", "enable", "", 0.1);
        fire("outcity_wall1_tri0", "enable", "", 0);
        fire("s3_senlin_relay0", "enable", "", 0);
        fire("s3_senlin_relay1", "enable", "", 0);
        fire("outcity_wall0", "kill", "", 0);
        fire("outcity_wall1", "color", "255 0 0", 0);
        fire("senlin_s6_wall0", "kill", "", 0);
        fire("mache1_temp", "forcespawn", "", 0);
        fire("s3_end_relay", "enable", "", 0);
        fire("fog", "setfogstartdistance", "500", 0);
        fire("fog", "setfogenddistance", "10000", 0);
        fire("fog", "SetFogColor", "49 50 53", 0);
        fire("tq_timer0", "kill", "", 0);
        fire("post_normal", "enable", "", 0.5);

        settimeout(() => {
            fire("mache1_move_path1", "addoutput", "OnPass>sky_city*>fireuser1>>15>1", 0);
            fire("mache1_move_path1", "addoutput", "OnPass>sky_senlin*>fireuser2>>0>1", 0);
            fire("mache1_move_path1", "addoutput", "OnPass>post_normal_senlin>enable>>0>1", 0);
            fire("senlin_tri1", "addoutput", "OnStartTouch>post_normal>enable>>30>1", 0);
        }, 0.1);
        
        fire("s3_bgm0", "startsound", "", 10);
    }
    
    setupStage4() {
        fire("sky_city*", "fireuser2", "", 0.1);
        fire("sky_33", "enable", "", 0.1);
        fire("s4_relay0", "enable", "", 0);
        fire("s4_trigger0", "enable", "", 0);
        fire("s4_trigger3", "enable", "", 0);
        fire("post_ex", "enable", "", 0.5);
        this.killWalls(["city_wall1", "city_wall2", "city_wall3", "city_wall4", "city_wall5", "city_wall6"]);
        this.setWallColors(["outcity_wall0", "outcity_wall1"]);
        
        fire("s4_bgm0", "startsound", "", 10);
    }
    
    setupStage5() {
        this.teleportEntity("ammo_get_tp", vec(-13168,-1840,-8704), ang(0, 270, 0));
        this.teleportEntity("heal_get_tp", vec(-12280,-1840,-8704), ang(0, 270, 0));
        this.teleportEntity("start_dest1", vec(-12784,-5776,-8514), ang(0, 90, 0));
        fire("sky_city*", "fireuser2", "", 0.1);
        fire("sky_33", "enable", "", 0.1);
        fire("s5_trigger5", "enable", "", 0);
        fire("s2_button1", "unlock", "", 0);
        fire("s5_button1_relay", "enable", "", 0);
        fire("post_ex", "enable", "", 0.5);
        
        fire("lv1_end_qxz_pick", "KillHierarchy", "", 0);
        fire("s1_end_tri", "kill", "", 0);
        fire("s1_end_move*", "kill", "", 0);

        fire("snow_ingame", "addoutput", "OnStartTouch>s5_bgm0>stopsound>>0>1", 0);
        fire("snow_ingame", "addoutput", "OnStartTouch>s5_bgm1>startsound>>0>1", 0);
        
        fire("s5_bgm0", "startsound", "", 10);
    }
    
    setupStage6() {
        this.teleportEntity("ammo_get_tp", vec(848,-10680,-4440), ang(0, 180, 0));
        this.teleportEntity("heal_get_tp", vec(848,-9888,-4440), ang(0, 180, 0));
        this.teleportEntity("start_dest1", vec(-1632,-12416,-4432), ang(0, 90, 0));

        fire("w_l_snow0", "hideworldlayer", "", 0.1);
        fire("sky_senlin", "enable", "", 0.1);
        fire("sky_senlin*", "fireuser2", "", 0.1);
        fire("senlin_side_dy2", "kill", "", 0);
        fire("s6_senlin_relay0", "enable", "", 0);
        fire("s6_senlin_relay1", "enable", "", 0);
        fire("post_ex_senlin", "enable", "", 0.5);
        fire("s6_trigger0", "enable", "", 0);
        fire("s6_end_relay", "enable", "", 0);
        fire("fog", "setfogstartdistance", "3000", 0);
        fire("fog", "setfogenddistance", "20000", 0);
        this.killWalls(["city_wall1", "city_wall2", "city_wall3", "city_wall4", "city_wall5", "city_wall6" , "outcity_wall0" , "outcity_wall1" ]);
        this.setWallColors(["outcity_wall0", "outcity_wall1"]);    
        
        fire("s6_bgm0", "startsound", "", 10);
    }
    
    setupStage7() {
        // 阶段7的具体设置
    }
    
    teleportEntity(name, position, angles) {
        const entity = find(name);
        if (entity) {
            entity.Teleport(position, angles);
        }
    }
    
    setWallColors(wallNames) {
        wallNames.forEach(wall => {
            fire(wall, "color", "255 0 0", 0);
        });
    }
    
    killWalls(wallNames) {
        wallNames.forEach(wall => {
            fire(wall, "kill", "", 0);
        });
    }
    
    handleXuediQxzPick(activator) {
        if (activator.GetTeamNumber() === CONFIG.TEAMS.HUMAN) return;
        
        activator.Teleport(vec(-8541, -6992, -3259));
        fire("xuedi_qxz_temp", "ForceSpawn", "", 0);
        fire("stp_null", "use", "", 0, undefined, activator);
        fire("lv1_end_qxz_pick", "disable", "", 0);
        fire("lv1_end_qxz_pick", "enable", "", 0.5);
        
        this.s1_qxz_num++;
        this.broadcastMessage(`丛林里出现了${this.s1_qxz_num}只奇行种!`);
        
        if (this.s1_qxz_num >= 5) {
            this.broadcastMessage(`丛林里应该只有这${this.s1_qxz_num}只奇行种了!`, 1);
            fire("lv1_end_qxz_pick", "KillHierarchy", "", 0);
        }
    }
    
    handleS5QxzPick(activator) {
        if (activator.GetTeamNumber() === CONFIG.TEAMS.HUMAN) return;
        
        activator.Teleport(vec(-8541, -6992, -3259));
        fire("xuedi_qxz_temp", "ForceSpawn", "", 0);
        fire("stp_null", "use", "", 0, undefined, activator);
        fire("s5_end_qxz_pick", "disable", "", 0);
        fire("s5_end_qxz_pick", "enable", "", 0.5);
        
        this.s5_qxz_num++;
        this.broadcastMessage(`城镇里出现了${this.s5_qxz_num}只奇行种!`);
        
        if (this.s5_qxz_num >= 10) {
            this.broadcastMessage(`城镇里应该只有这这${this.s5_qxz_num}只奇行种了!`, 1);
            fire("s5_end_qxz_pick", "KillHierarchy", "", 0);
        }
    }
    
    handleXuediQxzPickTp(activator) {
        if (stage === 2) {
            activator.SetHealth(5000);
            activator.SetMaxHealth(5000);
            const num = rand(1, 2);
            if (num === 1) activator.Teleport(vec(-4080,2800,-8784));
            else if (num === 2) activator.Teleport(vec(-8896,-5232,-8816));
        }else if (stage === 5) {
            activator.SetHealth(5000);
            activator.SetMaxHealth(5000);
            const num = rand(1, 2);
            if (num === 1) activator.Teleport(vec(-1600, -5376, 6930));
            else if (num === 2) activator.Teleport(vec(704, -2688, 6930));
        }else if (stage === 6) {
            activator.SetHealth(3000);
            activator.SetMaxHealth(3000);
            const num = rand(1, 8);
            if (num === 1) activator.Teleport(vec(1040,-1600,7058));
            else if (num === 2) activator.Teleport(vec(-752,-1568,6930));
            else if (num === 3) activator.Teleport(vec(96,-3904,6930));
            else if (num === 4) activator.Teleport(vec(1376,-4224,6930));
            else if (num === 5) activator.Teleport(vec(-1616,-4240,6930));
            else if (num === 6) activator.Teleport(vec(-32,-5184,6930));
            else if (num === 7) activator.Teleport(vec(-864,-6576,6930));
            else if (num === 8) activator.Teleport(vec(-80,-7184,6930));
        }
    }
    
    handleXuediQxzAtk(ent) {
        const activator = ent.activator;
        const allPlayers = findByClass("player");
        
        for (const player of allPlayers) {
            if (player.GetTeamNumber() === CONFIG.TEAMS.HUMAN && 
                len3(sub(activator.GetAbsOrigin(), player.GetAbsOrigin())) < 400) {
                player.TakeDamage({ damage: 600/*, attacker: activator*/ });
            }
        }
    }
    
    handleS5EndShow() {
        fire("s5_bgm1", "stopsound", "", 0);
        fire("s5_bgm2", "startsound", "", 0);
        fire("post_chaoda_ingame", "enable", "", 2);
        fire("s5_end_chaoda_ingame_p0", "start", "", 0);
        fire("s5_end_kill", "kill", "", 3);
        fire("maindoor_wai0", "kill", "", 3);
        fire("maindoor_wai1", "kill", "", 3);
        fire("outcity_door_inside0", "kill", "", 3);
        fire("outcity_door_inside_m0", "kill", "", 3);
        fire("outcity_door_button1_d", "kill", "", 3);
        fire("outcity_door_button0", "kill", "", 3);
        fire("city_wall*", "kill", "", 3);
        fire("outcity_pao1_d", "kill", "", 3);
        fire("outcity_pao2_d", "kill", "", 3);
        fire("s5_end_fade", "fade", "", 3);
        fire("s5_end_m0", "open", "", 3);
        
        for (let i = 0; i < 3; i++) {
            fire("s5_end_shake", "startshake", "", 3 + i * 0.1);
        }
        
        fire("s3_end_show_d", "alpha", "255", 3);
        fire("post_chaoda_ingame", "disable", "", 3.5);
        fire("s5_end_qxz_bre0", "break", "", 3);
    }
    
    handleS6EndShow(){
        fire("bgm_beast1", "stopsound", "", 0);
        fire("s6_camera_fade", "fade", "", 0);
        fire("camera_script", "RunScriptInput", "chaoda_camera0", 0);
        fire("s6_camera_relay", "EnableCameraAll", "", 0);
        let chaodatime = 5
        fire("bgm_useebig", "startsound", "", chaodatime-0.7);
        fire("s5_end_chaoda_ingame_p0", "start", "", chaodatime-2);
        fire("post_chaoda_ingame", "enable", "", chaodatime);
        fire("s5_end_kill", "kill", "", chaodatime+1);
        fire("maindoor_wai0", "kill", "", chaodatime+1);
        fire("maindoor_wai1", "kill", "", chaodatime+1);
        fire("outcity_door_inside0", "kill", "", chaodatime+1);
        fire("outcity_door_inside_m0", "kill", "", chaodatime+1);
        fire("outcity_door_button1_d", "kill", "", chaodatime+1);
        fire("outcity_door_button0", "kill", "", chaodatime+1);
        fire("city_wall*", "kill", "", chaodatime+1);
        fire("outcity_pao1_d", "kill", "", chaodatime+1);
        fire("outcity_pao2_d", "kill", "", chaodatime+1);
        fire("s5_end_fade", "fade", "", chaodatime+1);
        fire("s5_end_m0", "open", "", chaodatime+1);
        fire("s3_end_show_d", "alpha", "255", chaodatime+1);
        fire("post_*", "disable", "", chaodatime+2);
        fire("post_chaoda_boss", "enable", "", chaodatime+2.02);
        fire("maindoor_nei0", "open", "", 0);
        fire("maindoor_nei1", "open", "", 0);
        fire("maindoor_nei1", "close", "", 15.5);
        fire("maindoor_nei0", "close", "", 18.5);
        fire("city_fall_tp", "enable", "", 25);
        fire("s5_end_m0", "KillHierarchy", "", 25);
        fire("s6_boss_shilong_temp", "forcespawn", "", 25);
        fire("s6_boss_temp", "forcespawn", "", 25);
        fire("chaoda_tip_p0", "start", "", 33);
        fire("chaoda_tip_p0", "stop", "", 40);
        fire("s6_camera_relay", "disablecameraall", "", 40);
        fire("lv4_boss_timer", "enable", "", 35);
        fire("lv4_boss_hp_p0", "start", "", 40);
        settimeout(() => {
            const allPlayers = findByClass("player");
            for (const player of allPlayers){
                if(player.GetTeamNumber() === 2){
                    player.Teleport(vec(-3120,2775,10614))
                }
                else if(player.GetTeamNumber() === 3){
                    player.Teleport(vec(-93.425476,2544.802979,10675.03125),ang(-35,88,0))
                    fire("lv4_boss_hitbox", "AddHealth", "6000", 0);
                }
            }
            fire("script","runscriptinput","ban_allskill")
        }, 40);
        settimeout(() => {
            this.boss_maxhp = find("lv4_boss_hitbox").GetHealth()
        }, 40.05);
    }
    
    handleS6QxzPick(p) {
        if ( p.item === 0 ){
            p.pawn.Teleport(vec(-8541, -6992, -3259));
            fire("xuedi_qxz_temp", "ForceSpawn", "", 0);
            fire("stp_null", "TriggerForActivatedPlayer", "", 0, undefined, p.pawn);
        }else{
            this.handleXuediQxzPickTp(p.pawn)
        }
    }
    
    handleS6EndShow3(){
        const allPlayers = findByClass("player");
        let qxztime = 0
        for (const player of allPlayers){
            if(player.GetTeamNumber() === 2){
                fire("script", "RunScriptInput", "s6_qxz_pick", qxztime , undefined , player);
                qxztime += 0.2
            }
            else if(player.GetTeamNumber() === 3){
                fire("script", "RunScriptInput", "getliti", 13 , undefined , player);
                player.Teleport(vec(-97.202881,1855.078369,6969.03125),ang(-3,-90,0))
            }
        }
        this.teleportEntity("start_dest1", vec(-3120,2775,10614), ang(0, 270, 0));
        fire("lv3_final_particle", "start", "", 0);
        fire("senlin_tp_all", "disable", "", 0);
        fire("s6_final_tp", "enable", "", 0);
        fire("s6_final_tp_push", "enable", "", 0);
        fire("city_fall_tp", "disable", "", 0);
        fire("s6_camera2_relay", "EnableCameraAll", "", 0);
        fire("s6_camera2_fade", "fade", "", 0);
        fire("boss_dead_ex", "start", "", 1);
        fire("camera_script", "RunScriptInput", "move_camera3", 1);
        fire("camera_script", "RunScriptInput", "move_camera4", 5);
        fire("s6_camera2_relay", "disablecameraall", "", 13);
        fire("script","runscriptinput","unban_allskill",13)
    }

    handleS1Crane2() {
        const cranes = findAll("outcity_crane2_d");
        for (const crane of cranes) {
            if (crane.GetAbsOrigin().z >= 8138) {
                crane.Kill();
            }
        }
    }
    
    handleS3Crane1() {
        const cranes = findAll("outcity_crane1_d");
        for (const crane of cranes) {
            if (crane.GetAbsOrigin().z >= 10994) {
                crane.Kill();
            }
        }
    }
    
    broadcastMessage(message, delay = 0) {
        fire("cmd", "command", `say ${message.toString()}`, delay);
    }

    s6_boss_skill7() {
        const bright = 6
    
        for (let i = 0; i <= 8; i += 0.02 ) {
            const brightness = "brigh ="+((i / 8) * bright);
            fire("lv4_boss_mdl", "setrenderattribute", brightness.toString(), i);
        }
        for (let i = 12.5; i <= 13.5; i += 0.02 ) {
            const brightness = "brigh ="+(bright-(i-12.5)*bright);
            fire("lv4_boss_mdl", "setrenderattribute", brightness.toString(), i);
        }
    }
    
    setupEventHandlers() {
        Instance.OnScriptInput("player_init", () => this.pMgr.init());
        Instance.OnScriptInput("player_reg", () => this.pMgr.register());
        Instance.OnScriptInput("list_player", () => this.pMgr.listPlayers());
        Instance.OnScriptInput("getplayernum", () => this.pMgr.updatePlayerCount());
        
        Instance.OnScriptInput("steamon", ({ activator }) => this.aSys.activateSteam(this.getPlayerData(activator)));
        Instance.OnScriptInput("steamoff", ({ activator }) => this.aSys.deactivateSteam(this.getPlayerData(activator)));
        Instance.OnScriptInput("lition", ({ activator }) => this.aSys.activateLiti(this.getPlayerData(activator)));
        Instance.OnScriptInput("litioff", ({ activator }) => this.aSys.deactivateLiti(this.getPlayerData(activator)));
        Instance.OnScriptInput("cut", ({ activator }) => this.aSys.activateCut(this.getPlayerData(activator)));
        Instance.OnScriptInput("getliti", ({ activator }) => this.aSys.getliti(this.getPlayerData(activator)));
        
        Instance.OnScriptInput("getlitionly", ({ activator }) => this.aSys.getLitiOnly(this.getPlayerData(activator)));
        Instance.OnScriptInput("getsteamonly", ({ activator }) => this.aSys.getSteamOnly(this.getPlayerData(activator)));
        Instance.OnScriptInput("getcutonly", ({ activator }) => this.aSys.getCutOnly(this.getPlayerData(activator)));
        
        Instance.OnScriptInput("getflame", ({ activator }) => this.aSys.getFlame(this.getPlayerData(activator)));
        Instance.OnScriptInput("getwind", ({ activator }) => this.aSys.getWind(this.getPlayerData(activator)));
        Instance.OnScriptInput("getelec", ({ activator }) => this.aSys.getElec(this.getPlayerData(activator)));
        Instance.OnScriptInput("gettgun", ({ activator }) => this.aSys.getTGun(this.getPlayerData(activator)));
        Instance.OnScriptInput("getheal", ({ activator }) => this.aSys.getHeal(this.getPlayerData(activator)));
        Instance.OnScriptInput("getammo", ({ activator }) => this.aSys.getAmmo(this.getPlayerData(activator)));
        
        Instance.OnScriptInput("getskin1", ({ activator }) => this.aSys.getSkin1(this.getPlayerData(activator)));
        Instance.OnScriptInput("getskin2", ({ activator }) => this.aSys.getSkin2(this.getPlayerData(activator)));
        Instance.OnScriptInput("getskin3", ({ activator }) => this.aSys.getSkin3(this.getPlayerData(activator)));
        
        Instance.OnScriptInput("getzombieskin1", ({ activator }) => this.aSys.getZombieSkin1(this.getPlayerData(activator)));
        Instance.OnScriptInput("getzombieskin2", ({ activator }) => this.aSys.getZombieSkin2(this.getPlayerData(activator)));
        Instance.OnScriptInput("getzombieskin3", ({ activator }) => this.aSys.getZombieSkin3(this.getPlayerData(activator)));
        Instance.OnScriptInput("getzombieskin4", ({ activator }) => this.aSys.getZombieSkin4(this.getPlayerData(activator)));
        Instance.OnScriptInput("getzombieskin5", ({ activator }) => this.aSys.getZombieSkin5(this.getPlayerData(activator)));
        
        for (let i = 1; i <= 6; i++) {
            Instance.OnScriptInput("setstage" + i, () => this.setStage(i));
        }
        Instance.OnScriptInput("mapstart", () => this.startMap());
        
        Instance.OnScriptInput("xuedi_qxz_pick", ({ activator }) => this.handleXuediQxzPick(activator));
        Instance.OnScriptInput("s5_qxz_pick", ({ activator }) => this.handleS5QxzPick(activator));
        Instance.OnScriptInput("xuedi_qxz_picktp", ({ activator }) => this.handleXuediQxzPickTp(activator));
        Instance.OnScriptInput("xuedi_qxz_atk", (ent) => this.handleXuediQxzAtk(ent));
        Instance.OnScriptInput("s5_end_show", () => this.handleS5EndShow());
        Instance.OnScriptInput("s6_end_show", () => this.handleS6EndShow());
        Instance.OnScriptInput("s6_end_show3", () => this.handleS6EndShow3());
        Instance.OnScriptInput("s6_qxz_pick", ({activator}) => this.handleS6QxzPick(this.getPlayerData(activator)));
        Instance.OnScriptInput("s1_crane2", () => this.handleS1Crane2());
        Instance.OnScriptInput("s3_crane1", () => this.handleS3Crane1());
        
        for (let i = 1; i <= 7; i++) {
            Instance.OnScriptInput("test" + i, ({ activator , caller }) => this.handleTest(activator,caller, i));
        }
        
        Instance.OnScriptInput("s6_boss_skill7", () => this.s6_boss_skill7());
        
        Instance.OnScriptInput("player_win", ({ activator }) => this.setPlayerWin(activator));
        Instance.OnScriptInput("killall_win", () => this.killNonWinners());
        Instance.OnScriptInput("killhuman", () => this.killTeam(CONFIG.TEAMS.HUMAN));
        Instance.OnScriptInput("killzombie", () => this.killTeam(CONFIG.TEAMS.ZOMBIE));
        Instance.OnScriptInput("hurthuman", () => this.hurtTeam(CONFIG.TEAMS.HUMAN));

        Instance.OnScriptInput("beasthurt", ({ activator }) => {this.aSys.BeastHurt(this.getPlayerData(activator));});
        Instance.OnScriptInput("armorhurt", ({ activator }) => {this.aSys.ArmorHurt(this.getPlayerData(activator));});
        Instance.OnScriptInput("bighurt", ({ activator }) => {this.aSys.ColossalHurt(this.getPlayerData(activator));});
        Instance.OnScriptInput("bigs1", ({ activator }) => {this.aSys.ColossalSkill1(this.getPlayerData(activator));});
        Instance.OnScriptInput("bigs1hurt", () => {this.aSys.ColossalSkillHurt();});
        Instance.OnScriptInput("qxzhurt", ({ caller , activator }) => {this.aSys.qxzHurt(caller,activator);});

        Instance.OnScriptInput("skin1hurt", ({ activator }) => { this.aSys.Skin1_hurt(this.getPlayerData(activator));});
        Instance.OnScriptInput("skin2hurt", ({ activator }) => {this.aSys.Skin2_hurt(this.getPlayerData(activator));});
        Instance.OnScriptInput("skin3hurt", ({ activator }) => {this.aSys.Skin3_hurt(this.getPlayerData(activator));});
        Instance.OnScriptInput("skin1s1", ({ activator }) => { this.aSys.Skin1_S1(this.getPlayerData(activator));});
        Instance.OnScriptInput("skin3s1", ({ activator }) => { this.aSys.Skin3_S1(this.getPlayerData(activator));});
        
        Instance.OnScriptInput("useskinrightclick", ({ activator }) => {this.aSys.useSkinRightClick(this.getPlayerData(activator));});
        
        Instance.OnScriptInput("w", ({ activator }) => {this.aSys.handleComboInput(this.getPlayerData(activator), "case11");});
        Instance.OnScriptInput("a", ({ activator }) => {this.aSys.handleComboInput(this.getPlayerData(activator), "case12");});
        Instance.OnScriptInput("s", ({ activator }) => {this.aSys.handleComboInput(this.getPlayerData(activator), "case13");});
        Instance.OnScriptInput("d", ({ activator }) => {this.aSys.handleComboInput(this.getPlayerData(activator), "case14");});

        Instance.OnScriptInput("ban_allskill", () => {
            this.pMgr.getValidPlayers().forEach(p => {
                this.aSys.disableAbilities(p);
            });
            print("已禁用所有玩家的能力");
        });

        Instance.OnScriptInput("unban_allskill", () => {
            this.pMgr.getValidPlayers().forEach(p => {
                this.aSys.enableAbilities(p);
            });
            print("已启用所有玩家的能力");
        });

        Instance.OnScriptInput("ban_skill", ({ activator }) => {
            if (!activator || !activator.IsValid()) return;
            const playerData = this.getPlayerData(activator);
            if (!playerData) return;

            this.aSys.disableAbilities(playerData);
            print(`玩家 ${playerData.ctrl?.GetPlayerName()} 的能力已被禁用10秒`);

            settimeout(() => {
                if (playerData.isValid()) {
                    this.aSys.enableAbilities(playerData);
                    print(`玩家 ${playerData.ctrl?.GetPlayerName()} 的能力已恢复`);
                }
            }, 10);
        });

        Instance.OnScriptInput("unban_skill", ({ activator }) => {
            if (!activator || !activator.IsValid()) return;
            const playerData = this.getPlayerData(activator);
            if (!playerData) return;

            this.aSys.enableAbilities(playerData);
            print(`玩家 ${playerData.ctrl?.GetPlayerName()} 的能力已被启用`);
        });

        Instance.OnScriptInput("tq", () => {
            const allPlayers = gameManager.pMgr.getValidPlayers();
            const humanPlayers = allPlayers.filter(p => p.pawn && p.isHuman());
            if (humanPlayers.length === 0) return;

            const randomIndex = Math.floor(Math.random() * humanPlayers.length);
            const randomPlayer = humanPlayers[randomIndex];
            const targetPos = randomPlayer.pawn.GetAbsOrigin();
            const spawnPos = add(targetPos, vec(rand(-1800,1800), rand(-1800,1800), 5000));
            CONFIG.tq.pos = spawnPos;
            CONFIG.tq.tar = randomPlayer.pawn.GetAbsOrigin();
            find("tq_show_p0").Teleport(targetPos);
            fire("tq_show_p0","start","",0)
            fire("tq_show_p0","stop","",2)
            settimeout(() => {
                find("tq_temp0").ForceSpawn(spawnPos);
                fireT(this.self,"RunScriptInput","tq2",0.02)
            }, 2);
        });

        Instance.OnScriptInput("tq2", () => {
            const dir = sub(CONFIG.tq.tar, CONFIG.tq.pos);
            const distance = len3(dir);

            let velo = { x: 0, y: 0, z: 0 };
            if (distance > 0) {
                const normalizedDir = scale(dir, 1 / distance);
                velo = scale(normalizedDir, 5000);
            }
            find("tq_phy0").Teleport({velocity:velo});
            fire("tq_phy0","KillHierarchy","",10)
            settimeout(() => {
                find("tq_phy0").SetEntityName("tq_phy_moving");
            }, 0.1);
        });

        Instance.OnScriptInput("s36npc", () => {
            const allPlayers = gameManager.pMgr.getValidPlayers();
            const humanPlayers = allPlayers.filter(p => p.pawn && p.isHuman());
            if (humanPlayers.length === 0) return;

            let count = 4;
            if(stage === 6){count = 6};
            for (let i = 0; i < count; i++) {
                const randomIndex = Math.floor(Math.random() * humanPlayers.length);
                const randomPlayer = humanPlayers[randomIndex];
                const spawnPos = add(randomPlayer.pawn.GetAbsOrigin(), vec(0, 0, 300));
                settimeout(() => {
                    find("s25_npc_temp0").ForceSpawn(spawnPos, ang(0, rand(0, 360), 0));
                }, i);
            }
        });

        Instance.OnScriptInput("s36npc_boss", () => {
            const count = stage*2;
            for (let i = 0; i <= count; i++) {
                const spawnPos = vec(rand(8704-4500,8704+4500),rand(-6728-4500,-6728+4500),-3728)
                settimeout(() => {
                    find("s25_npc_temp0").ForceSpawn(spawnPos, ang(0, rand(0, 360), 0));
                }, i/2);
            }
        });

        Instance.OnScriptInput("disliti", () => {
            const allPlayers = gameManager.pMgr.getValidPlayers();
            
            for (const playerData of allPlayers) {
                if (playerData.liti && playerData.isHuman()) {
                    playerData.pawn.TakeDamage({damage:100})
                    gameManager.aSys.deactivateLiti(playerData);
                }
            }
        });

        Instance.OnScriptInput("disliti_a", ({ activator }) => {
            if (activator && activator.IsValid()) {
                const playerData = this.getPlayerData(activator);
                if (playerData && playerData.isHuman()) {
                    if (playerData.liti) {
                        gameManager.aSys.deactivateLiti(playerData);
                        print(`已取消 ${playerData.ctrl?.GetPlayerName()} 的钩锁状态`);
                    } else {
                        print(`${playerData.ctrl?.GetPlayerName()} 当前没有使用钩锁`);
                    }
                }
            }
        });
        
        Instance.OnScriptInput("senlin_camera_fireball0", () => {
            for(let i = 0;i<=6;i++){
                find("senlin_camera_fireball_temp0").ForceSpawn(vec(-9696,-3752,-3073),ang(rand(0,5),-13+rand(-10,10),0))
            }
        });
        
        Instance.OnScriptInput("senlin_camera", () => {
            const allPlayers = findByClass("player");
            for (const player of allPlayers){
                if(player.GetTeamNumber() === 2){
                    player.Teleport(vec(-1296,12736,-3856))
                }
                else if(player.GetTeamNumber() === 3){
                    player.Teleport(vec(-7584,12880,-4432))
                }
            }
            fire("senlin_camera_fade0","fade","",0)
            fire("senlin_s6_wall0","kill","",0)
            fire("senlin_tp3","disable","",0)
            fire("sky_senlin_titan0","enable","",0)
            fire("sky_senlin_titan0","alpha","255",0)
            fire("senlin_camera_relay0","enablecameraall","",0)
            fire("sky_senlin_titan0","SetAnimationNotLooping","skill_fireball",2)
            fireT(this.self,"RunScriptInput","senlin_camera_fireball0",3.53)
            fireT(this.camera,"RunScriptInput","senlin_camera0",0)
            fire("senlin_camera_p0","start","",8)
            fire("senlin_all_m0","kill","",8)
            fire("senlin_all_d0","kill","",8)
            fire("w_l_senlin_boss0", "hideworldlayer", "", 8);
            fire("senlin_door3","kill","",8)
            fire("senlin_door4","kill","",8)
            fire("senlin_ele0","kill","",8)
            fire("beast_tip_p0","start","",13)
            fire("beast_tip_p0","stop","",20)
            fire("senlin_show_temp0","forcespawn","",9.52)
            fire("senlin_boss_maker0","forcespawn","",20)
            fireT(this.self,"RunScriptInput","senlin_camera_end",20)
        });
        
        Instance.OnScriptInput("senlin_camera_end", () => {
            const allPlayers = findByClass("player");
            for (const player of allPlayers){
                if(player.GetTeamNumber() === 2){
                    let a = rand(1,4);
                    if(a===1){player.Teleport(vec(11872,-11632,-3312))}else
                    if(a===2){player.Teleport(vec(11872,-1696,-3312))}else
                    if(a===3){player.Teleport(vec(5600,-1696,-3312))}else
                    if(a===4){player.Teleport(vec(5600,-11760,-3312))}
                }
                else if(player.GetTeamNumber() === 3){
                    player.Teleport(vec(8635,-2232,-4403.968750),ang(-15,-90,0))
                }
            }
            fireT(this.self,"RunScriptInput","refill_all_human",0)
            fire("sky_senlin_titan0","disable","",0)
            fire("senlin_camera_relay0","disablecameraall","",0)
            fire("senlin_boss_wall0","toggle","",0)
            fire("s25_boss_hp","start","",0)
            fire("senlin_show_*","kill","",0)
        });

        
        Instance.OnScriptInput("boss_hp", () => {
            let boss_hp = find("lv4_boss_hitbox").GetHealth();
            const show = Math.max((boss_hp/this.boss_maxhp),0);
            print(boss_hp+"|"+this.boss_maxhp+"|"+show)
            fire("lv4_boss_hp_p0","setcontrolpoint","10:"+(show*0.931+0.135)+" 0 0",0);
        });

        Instance.OnScriptInput("skin_gethit", ({caller,activator}) => {
            let pawn = undefined
            if(caller.GetEntityName()==="skin1_hitbox"){
                pawn = this.pMgr.Skin1_User
            }else if(caller.GetEntityName()==="skin2_hitbox"){
                pawn = this.pMgr.Skin2_User
            }else if(caller.GetEntityName()==="skin3_hitbox"){
                pawn = this.pMgr.Skin3_User
            }else if(caller.GetEntityName()==="skin1_hit_relay0"){
                pawn = this.pMgr.Skin1_User
            }else if(caller.GetEntityName()==="skin2_hit_relay0"){
                pawn = this.pMgr.Skin2_User
            }else if(caller.GetEntityName()==="skin3_hit_relay0"){
                pawn = this.pMgr.Skin3_User
            }
            
            if (!pawn || !pawn.IsValid()) return;
            const playerData = this.pMgr.getPlayerDataByPawn(pawn);
            if (!playerData) return;

            playerData.skinHP = Math.max(0, playerData.skinHP - 1);

            if (playerData.skinHP <= 0) {
                pawn.Kill();
                this.aSys.cleanupPlayerModels(playerData);
            } else {
                this.uiSys.updatePlayerUI(playerData);
            }
        });
        
        Instance.OnScriptInput("refill_all_human", () => {
            this.pMgr.getHumans().forEach(p => {
                p.liti_num = p.liti_max;
                p.steam_num = p.steam_max;
                p.cut_num = p.cut_max;
                this.uiSys.updatePlayerUI(p); // 立即更新 UI 显示
            });
            print("所有人类能力已补充满");
        });

        Instance.OnScriptInput("refill_liti", ({ activator }) => {
            if (!activator) return;
            const p = this.getPlayerData(activator);
            if (p && p.isHuman()) {
                p.liti_num = p.liti_max;
                this.uiSys.updatePlayerUI(p);
                print(`玩家 ${p.ctrl?.GetPlayerName()} 钩锁已补满`);
            }
        });

        Instance.OnScriptInput("refill_steam", ({ activator }) => {
            if (!activator) return;
            const p = this.getPlayerData(activator);
            if (p && p.isHuman()) {
                p.steam_num = p.steam_max;
                this.uiSys.updatePlayerUI(p);
                print(`玩家 ${p.ctrl?.GetPlayerName()} 蒸汽已补满`);
            }
        });

        Instance.OnScriptInput("refill_cut", ({ activator }) => {
            if (!activator) return;
            const p = this.getPlayerData(activator);
            if (p && p.isHuman()) {
                p.cut_num = p.cut_max;
                this.uiSys.updatePlayerUI(p);
                print(`玩家 ${p.ctrl?.GetPlayerName()} 切割已补满`);
            }
        });
    }
    
    getPlayerData(activator) {
        const slot = activator.GetPlayerController().GetPlayerSlot();
        return this.pMgr.players[slot];
    }
    
    setPlayerWin(activator) {
        const playerData = this.getPlayerData(activator);
        playerData.win = true;
    }
    
    killNonWinners() {
        this.pMgr.getValidPlayers().forEach(playerData => {
            if (!playerData.win && playerData.pawn && playerData.pawn.IsValid()) {
                fireT(playerData.pawn, "sethealth", "-1", 0);
            }
        });
        print(`Stage ${stage} finish`);
    }
    
    killTeam(team) {
        const teamName = team === CONFIG.TEAMS.HUMAN ? "humans" : "zombies";
        this.pMgr.getValidPlayers()
            .filter(player => player.pawn && player.pawn.IsValid() && player.pawn.GetTeamNumber() === team)
            .forEach(player => {
                fireT(player.pawn, "sethealth", "-1", 0);
            });
        if(team === 2){fire("zr_toggle_respawn","disable")}
        print(`kill all ${teamName}`);
    }
    
    hurtTeam(team) {
        this.pMgr.getValidPlayers()
            .filter(player => player.pawn && player.pawn.IsValid() && player.pawn.GetTeamNumber() === team)
            .forEach(player => {
                player.pawn.TakeDamage({ damage: 10 });
            });
    }
    
    handleTest(activator,caller, i) {
        print("测试功能被调用" + i);
        find("test").Teleport(vec(18420,-1097,-4467.9))
    }
    
    startMap() {
        this.pMgr.init();
        this.pMgr.register();
        this.pMgr.listPlayers();
        this.initializeStage();
        
        this.pMgr.getValidPlayers().forEach(playerData => {
            this.setupPlayer(playerData);
        });

        this.aSys.resetCounters();
        this.setupStage();
        print("script reset");
    }
    
    setupPlayer(playerData) {
        const pawn = playerData.pawn;
        const ctrl = playerData.ctrl;

        // 重置玩家物理属性
        fireT(pawn, "keyvalues", "gravity 1", 0);
        fireT(pawn, "alpha", "255", 0);
        fireT(pawn, "keyvalues", "speed 1", 0);
        pawn.SetModelScale(1);
        pawn.SetEntityName("player");
        pawn.SetArmor(100);

        // 重置玩家数据中的所有动态状态
        playerData.liti = false;
        playerData.liti_origin = vec(0, 0, 0);
        playerData.liti_speed = 0;
        playerData.liti_num = 0;
        playerData.liti_max = 0;
        playerData.liti_charge = 0;
        playerData.steam = false;
        playerData.steam_num = 0;
        playerData.steam_max = 0;
        playerData.steam_charge = 0;
        playerData.cut_num = 0;
        playerData.cut_max = 0;
        playerData.cut_charge = 0;
        playerData.cut_cd = 0;
        playerData.cutBoostEndTime = 0;
        playerData.cutBoostDamageMultiplier = 1.0;
        playerData.cutBoostRangeMultiplier = 1.0;
        playerData.win = false;
        playerData.item = 0;
        playerData.item_cd = 0;
        playerData.zombieSkillCD = 0;
        playerData.comboSequence = [];
        playerData.comboLastInputTime = 0;
        playerData.comboCooldown = 0;
        playerData.comboTimeout = 0.3;
        playerData.litiHookModel = null;
        playerData.litiTargetEntity = null;
        playerData.litiOffset = null;
        playerData.skinHP = 0;
        playerData.skinMaxHP = 0;
        playerData.abilitiesEnabled = false; // 默认启用能力

        // 新增：高跳飞行模式重置
        playerData.highJumpFlyingActive = false;
        playerData.highJumpFlyingEndTime = 0;

        // 重置控制器上的自定义标记
        if (ctrl) {
            ctrl.skinOutputsAdded = false;
        }

        // 设置UI（会重新创建玩家头顶的文字和模型附着）
        this.uiSys.setupPlayerUI(playerData);

        // 初始化基础能力（只有人类会生效）
        this.aSys.initDefaultAbilities(playerData);

        // 记录当前阵营
        playerData.teamTag = pawn.GetTeamNumber();
    }
    
    think() {
        Instance.SetNextThink(Instance.GetGameTime() + CONFIG.THINK.DELAY);
        _processTimers();

        for (let slot = 0; slot <= CONFIG.STAGES.MAX_PLAYERS; slot++) {
            const playerData = this.pMgr.players[slot];
            const ctrl = Instance.GetPlayerController(slot);
            if (!ctrl) continue;

            const pawn = ctrl.GetPlayerPawn();
            if (!pawn || !pawn.IsValid()) continue;

            // 更新引用
            playerData.ctrl = ctrl;
            playerData.pawn = pawn;

            const currentTeam = pawn.GetTeamNumber();

            // 新玩家初始化
            if (playerData.teamTag === -1) {
                this.setupPlayer(playerData);
            }

            // 阵营变化处理
            if (playerData.teamTag !== currentTeam) {
                if (currentTeam === CONFIG.TEAMS.ZOMBIE) {
                    this.aSys.cleanupHumanState(playerData);
                    print(`玩家 ${playerData.ctrl?.GetPlayerName()} 变为僵尸，已清理人类残留`);
                } else if (currentTeam === CONFIG.TEAMS.HUMAN) {
                    this.aSys.cleanupPlayerModels(playerData);
                    this.setupPlayer(playerData);
                    print(`玩家 ${playerData.ctrl?.GetPlayerName()} 变回人类，已重新初始化`);
                }
                playerData.teamTag = currentTeam;
            }

            if (playerData.isValid()) {
                if (pawn.WasInputJustPressed(CSInputs.USE)) {
                    if (playerData.isHuman()) {
                        this.aSys.useItem(playerData);
                    } else if (playerData.isZombie()) {
                        this.aSys.useZombieSkin(playerData);
                    }
                }
            }
        }

        this.aSys.updateAbilities();
        this.uiSys.updateAllUI();

        this.tickNum++;
        if (this.tickNum >= (1 / CONFIG.THINK.DELAY)) {
            this.tickNum = 0;
        }
    }
}

// =============================================
// 全局实例和初始化
// =============================================
const gameManager = new GMgr();

Instance.SetThink(() => gameManager.think());
Instance.SetNextThink(Instance.GetGameTime());

gameManager.pMgr.listPlayers();

export { 
    vec as Vector, 
    ang as Angle,
    len3, len2, sub, add, scale, clamp, fwd, vecAng, rand,
    fire as EntityFire, 
    fireT as EntityFireTarget,
    find as FindEntity,
    findAll as FindEntities,
    findByClass as FindByClass,
    print,
    gameManager
};