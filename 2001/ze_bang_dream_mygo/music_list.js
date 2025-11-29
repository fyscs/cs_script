import { Instance, PointTemplate } from "cs_script/point_script";

/**
 * 曲目列表
 * 此脚本由皮皮猫233编写
 * 仅供MyGO地图使用
 * 交流学习请联系作者
 * 2025/11/29
 */

let currentMusic = "";

const pickNumber = 5;

const musicList = ["MusicaCaelestis", "SeeYouAgain", "HatedByLife", "InternetOverdose", "FeastOfMouse", "CornerstoneCorolla", "Tanebi", "ImprisonedXII", "Refrain", "SilhouetteDance", "SpringSunshine", "Encoder", "NamaeNoNaiKaibutsu", "TheTempest", "TengokuJigokuguni", "Mayoiuta", "Hitoshizuku", "BeepBeepImASheep", "TheOtherSide", "MyDemons", "Mujinku", "Rrharil", "Terrasphere", "DossolesHoliday"];

Instance.OnScriptInput("Start", (inputData) => {
    const entity = Instance.FindEntityByName("music_game_init_relay");
    if (!entity || !entity.IsValid()) return;
    entity.SetEntityName(currentMusic);
    Instance.EntFireAtTarget({ target: entity, input: "Trigger" });
});

// 随机抽取曲库中的曲目
Instance.OnScriptInput("PickRandom", (inputData) => {
    const currentList = getRandomElements(musicList, pickNumber);

    for (let i = 0; i < pickNumber; i ++) {
        const temp = /** @type {PointTemplate|undefined} */ (Instance.FindEntityByName("music_vote_" + currentList[i].toLowerCase() + "_temp"));
        if (!temp || !temp.IsValid()) return;

        const positionEntity = Instance.FindEntityByName("music_vote" + (i + 2) + "_ptp");
        if (!positionEntity || !positionEntity.IsValid()) return;

        const entities = temp.ForceSpawn(positionEntity.GetAbsOrigin());
        if (!entities) return;

        for (const entity of entities) {
            if (entity.GetClassName() === "logic_relay") {
                entity.SetEntityName("music_vote_" + (i + 2) + "_relay");
                break;
            }
        }
    }
});

Instance.OnScriptInput("KimitoatsumatteSeizaninaretara", (inputData) => {
    currentMusic = "KimitoatsumatteSeizaninaretara";
});

Instance.OnScriptInput("MusicaCaelestis", (inputData) => {
    currentMusic = "MusicaCaelestis";
});

Instance.OnScriptInput("SeeYouAgain", (inputData) => {
    currentMusic = "SeeYouAgain";
});

Instance.OnScriptInput("HatedByLife", (inputData) => {
    currentMusic = "HatedByLife";
});

Instance.OnScriptInput("FeastOfMouse", (inputData) => {
    currentMusic = "FeastOfMouse";
});

Instance.OnScriptInput("InternetOverdose", (inputData) => {
    currentMusic = "InternetOverdose";
});

Instance.OnScriptInput("CornerstoneCorolla", (inputData) => {
    currentMusic = "CornerstoneCorolla";
});

Instance.OnScriptInput("Tanebi", (inputData) => {
    currentMusic = "Tanebi";
});

Instance.OnScriptInput("ImprisonedXII", (inputData) => {
    currentMusic = "ImprisonedXII";
});

Instance.OnScriptInput("Refrain", (inputData) => {
    currentMusic = "Refrain";
});

Instance.OnScriptInput("SilhouetteDance", (inputData) => {
    currentMusic = "SilhouetteDance";
});

Instance.OnScriptInput("SpringSunshine", (inputData) => {
    currentMusic = "SpringSunshine";
});

Instance.OnScriptInput("Encoder", (inputData) => {
    currentMusic = "Encoder";
});

Instance.OnScriptInput("NamaeNoNaiKaibutsu", (inputData) => {
    currentMusic = "NamaeNoNaiKaibutsu";
});

Instance.OnScriptInput("TheTempest", (inputData) => {
    currentMusic = "TheTempest";
});

Instance.OnScriptInput("TengokuJigokuguni", (inputData) => {
    currentMusic = "TengokuJigokuguni";
});

Instance.OnScriptInput("Mayoiuta", (inputData) => {
    currentMusic = "Mayoiuta";
});

Instance.OnScriptInput("Hitoshizuku", (inputData) => {
    currentMusic = "Hitoshizuku";
});

Instance.OnScriptInput("BeepBeepImASheep", (inputData) => {
    currentMusic = "BeepBeepImASheep";
});

Instance.OnScriptInput("TheOtherSide", (inputData) => {
    currentMusic = "TheOtherSide";
});

Instance.OnScriptInput("MyDemons", (inputData) => {
    currentMusic = "MyDemons";
});

Instance.OnScriptInput("Mujinku", (inputData) => {
    currentMusic = "Mujinku";
});

Instance.OnScriptInput("Rrharil", (inputData) => {
    currentMusic = "Rrharil";
});

Instance.OnScriptInput("Terrasphere", (inputData) => {
    currentMusic = "Terrasphere";
});

Instance.OnScriptInput("DossolesHoliday", (inputData) => {
    currentMusic = "DossolesHoliday";
});

/**
 * 无放回抽样
 * @param {Array<string>} array 
 * @param {number} count 
 * @returns {Array<string>}
 */
function getRandomElements(array, count) {
    // 复制原数组以避免修改原数组
    const shuffled = [...array];
    
    // Fisher-Yates 洗牌算法
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // 返回前count个元素
    return shuffled.slice(0, count);
}
