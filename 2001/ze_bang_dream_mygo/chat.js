import { Instance } from "cs_script/point_script";

/**
 * 气泡系统
 * 此脚本由皮皮猫233编写
 * 仅供MyGO地图使用
 * 交流学习请联系作者
 * 2025/10/29
 */

// ========== 全局变量定义 ==========

/**
 * VIP玩家分组 - 包含MyGO和Mujica乐队所有人物
 */
const vipPlayers = {
    // Mygo乐队成员
    tomorrinPlayers: [],
    anonPlayers: [],
    takiPlayers: [],
    soyorinPlayers: [],
    ranaPlayers: [],
    
    // Mujica乐队成员
    mutsumiPlayers: [],
    sakikoPlayers: [],
    umiriPlayers: [],
    nyamuPlayers: [],
    kanaPlayers: []
};

// ========== 事件监听器 ==========

/**
 * 回合重启时检查是否为VIP玩家
 */
Instance.OnRoundStart(() => {
    const players = Instance.FindEntitiesByClass("player");
    for (const player of players) {
        Instance.EntFireAtName({ name: "mujica_mutsumi_filter", input: "TestActivator", activator: player });
        Instance.EntFireAtName({ name: "mygo_nana_filter", input: "TestActivator", activator: player });
        Instance.EntFireAtName({ name: "mygo_tomorrin_filter", input: "TestActivator", activator: player });
        Instance.EntFireAtName({ name: "mygo_anon_filter", input: "TestActivator", activator: player });
        Instance.EntFireAtName({ name: "mygo_soyorrin_filter", input: "TestActivator", activator: player });
    }
});

/**
 * 添加VIP玩家 - 各角色添加函数
 */
Instance.OnScriptInput("mutsumiAdd", (inputData) => {
    AddVipPlayer(inputData, "mutsumiPlayers");
});

Instance.OnScriptInput("sakikoAdd", (inputData) => {
    AddVipPlayer(inputData, "sakikoPlayers");
});

Instance.OnScriptInput("umiriAdd", (inputData) => {
    AddVipPlayer(inputData, "umiriPlayers");
});

Instance.OnScriptInput("nyamuAdd", (inputData) => {
    AddVipPlayer(inputData, "nyamuPlayers");
});

Instance.OnScriptInput("kanaAdd", (inputData) => {
    AddVipPlayer(inputData, "kanaPlayers");
});

Instance.OnScriptInput("tomorrinAdd", (inputData) => {
    AddVipPlayer(inputData, "tomorrinPlayers");
});

Instance.OnScriptInput("anonAdd", (inputData) => {
    AddVipPlayer(inputData, "anonPlayers");
});

Instance.OnScriptInput("takiAdd", (inputData) => {
    AddVipPlayer(inputData, "takiPlayers");
});

Instance.OnScriptInput("soyorinAdd", (inputData) => {
    AddVipPlayer(inputData, "soyorinPlayers");
});

Instance.OnScriptInput("ranaAdd", (inputData) => {
    AddVipPlayer(inputData, "ranaPlayers");
});

/**
 * 检测玩家聊天消息
 */
Instance.OnPlayerChat((event) => {
    const player = event.player.GetPlayerPawn();
    if (!player || !player.IsValid()) return;

    // 为VIP玩家处理特殊聊天效果
    if (IsVip(player)) {
        ProcessVipChat(player, event.text);
    }
});

// ========== 核心功能函数 ==========

/**
 * 处理VIP玩家聊天
 * @param {Object} player - 玩家实体
 * @param {string} text - 聊天文本
 */
function ProcessVipChat(player, text) {
    // 获取聊天模板实体
    const chatTemp = Instance.FindEntityByName("chat_temp");
    if (!chatTemp || !chatTemp.IsValid()) return;
    
    // 计算生成位置和角度
    const currentOrigin = player.GetAbsOrigin();
    const randomOffset = GetRandomOffset();
    const newOrigin = { 
        x: currentOrigin.x + randomOffset.x, 
        y: currentOrigin.y + randomOffset.y, 
        z: currentOrigin.z + 100 + randomOffset.z
    };

    const currentAngles = player.GetAbsAngles();
    const newAngles = { 
        pitch: 0, 
        yaw: currentAngles.yaw + 90, 
        roll: 0 
    };

    // 生成聊天实体
    const side = getForward(newAngles);
    const chatEntities = chatTemp.ForceSpawn(newOrigin, newAngles);

    // 生成角色专属表情
    GenerateCharacterEmoji(player, currentOrigin);

    // 处理聊天气泡和文本
    ProcessChatEntities(chatEntities, player, text, side, newOrigin);
}

/**
 * 生成角色专属表情
 * @param {Object} player - 玩家实体
 * @param {Object} currentOrigin - 玩家当前位置
 */
function GenerateCharacterEmoji(player, currentOrigin) {
    const character = GetPlayerCharacter(player);
    
    if (character) {
        const characterChatTemp = Instance.FindEntityByName(`chat_${character}_temp`);
        if (characterChatTemp && characterChatTemp.IsValid()) {
            const characterRandomOffset = GetRandomOffset();
            const characterOrigin = { 
                x: currentOrigin.x + characterRandomOffset.x, 
                y: currentOrigin.y + characterRandomOffset.y, 
                z: currentOrigin.z + 100 + characterRandomOffset.z
            };
            
            const newAngles = { pitch: 0, yaw: 0, roll: 0 };
            const characterEntities = characterChatTemp.ForceSpawn(characterOrigin, newAngles);
            
            for (const entity of characterEntities) {
                if (entity.GetEntityName() === `chat_${character}_particle`) {
                    Instance.EntFireAtTarget({ target: entity, input: "SetParent", value: "!activator", activator: player });
                    Instance.EntFireAtTarget({ target: entity, input: "Kill", delay: 5 });
                }
            }
        }
    }
}

/**
 * 处理聊天实体（气泡和文本）
 * @param {Array} chatEntities - 聊天实体数组
 * @param {Object} player - 玩家实体
 * @param {string} text - 聊天文本
 * @param {Object} side - 方向向量
 * @param {Object} newOrigin - 生成位置
 */
function ProcessChatEntities(chatEntities, player, text, side, newOrigin) {
    for (const chatEntity of chatEntities) {
        if (chatEntity.GetEntityName() === "chat_particle") {
            // 处理聊天气泡
            const textLength = CalculateTextLength(text);
            const particlePosition = vectorAdd(vectorScale(side, textLength), newOrigin);
            
            chatEntity.Teleport({ position: particlePosition });
            Instance.EntFireAtTarget({ target: chatEntity, input: "SetParent", value: "!activator", activator: player });
            Instance.EntFireAtTarget({ target: chatEntity, input: "Kill", delay: 5 });
        } else if (chatEntity.GetEntityName() === "chat_text") {
            // 处理聊天文本
            Instance.EntFireAtTarget({ target: chatEntity, input: "SetMessage", value: text });
            Instance.EntFireAtTarget({ target: chatEntity, input: "SetParent", value: "!activator", activator: player });
            Instance.EntFireAtTarget({ target: chatEntity, input: "Kill", delay: 5 });
        }
    }
}

// ========== 辅助功能函数 ==========

/**
 * 检查玩家是否为VIP
 * @param {Object} player - 玩家实体
 * @returns {boolean} 是否为VIP
 */
function IsVip(player) {
    return Object.values(vipPlayers).some(band => 
        band.includes(player)
    );
}

/**
 * 获取玩家所属角色
 * @param {Object} player - 玩家实体
 * @returns {string|null} 角色名称
 */
function GetPlayerCharacter(player) {
    for (const [character, players] of Object.entries(vipPlayers)) {
        if (players.includes(player)) {
            return character.replace("Players", "");
        }
    }
    return null;
}

/**
 * 添加VIP玩家到指定分组
 * @param {Object} inputData - 输入数据
 * @param {string} playerGroup - 玩家分组
 */
function AddVipPlayer(inputData, playerGroup) {
    if (inputData.activator && inputData.activator.IsValid()) {
        if (!vipPlayers[playerGroup].includes(inputData.activator)) {
            vipPlayers[playerGroup].push(inputData.activator);
        }
    }
}

/**
 * 计算字符串显示长度
 * @param {string} text - 输入文本
 * @returns {number} 计算后的长度
 */
function CalculateTextLength(text) {
    let length = 0;
    for (const char of text) {
        if (char.match(/[^\x00-\xff]/)) {
            length += 8.4; // 全角字符
        } else if (char >= 'A' && char <= 'Z') {
            length += 5.55; // 大写字母
        } else {
            length += 4.75; // 半角字符和小写字母
        }
    }
    return length;
}

/**
 * 生成随机偏移位置
 * @returns {Object} 随机偏移向量
 */
function GetRandomOffset() {
    const range = 30;
    return {
        x: (Math.random() - 0.5) * 2 * range,
        y: (Math.random() - 0.5) * 2 * range,
        z: (Math.random() - 0.5) * 2 * range
    };
}

// ========== 数学工具函数 ==========

/**
 * 向量加法
 * @param {Object} vec1 - 向量1
 * @param {Object} vec2 - 向量2
 * @returns {Object} 相加后的向量
 */
function vectorAdd(vec1, vec2) {
    return { 
        x: vec1.x + vec2.x, 
        y: vec1.y + vec2.y, 
        z: vec1.z + vec2.z 
    };
}

/**
 * 向量缩放
 * @param {Object} vec - 向量
 * @param {number} scale - 缩放比例
 * @returns {Object} 缩放后的向量
 */
function vectorScale(vec, scale) {
    return { 
        x: vec.x * scale, 
        y: vec.y * scale, 
        z: vec.z * scale 
    };
}

/**
 * 将角度转换为前向向量
 * @param {Object} angles - 角度对象 {pitch, yaw, roll}
 * @returns {Object} 前向向量
 */
function getForward(angles) {
    const pitchRadians = (angles.pitch * Math.PI) / 180;
    const yawRadians = (angles.yaw * Math.PI) / 180;
    const hScale = Math.cos(pitchRadians);
    
    return {
        x: Math.cos(yawRadians) * hScale,
        y: Math.sin(yawRadians) * hScale,
        z: -Math.sin(pitchRadians)
    };
}
