//这是一份倒计时脚本，可以使用纯数字进行倒计时，但如果你希望使用一些前缀，那么你需要先到前缀映射表设定好你的前缀才可以使用
//根据现有的前缀映射编辑你想要的效果，左边的值如"doorclose"，即为要在游戏中RunScriptInput输入值的前缀
//ent_fire countdown_script RunScriptInput doorclose_10，就是Door close in 10的倒数文本以此类推
//为什么不做实时识别前缀的形式，我不会写脚本，这个脚本完全由ai编写，可能有很多冗杂部分但我不会自己优化
//我也有在投喂了一些vjs的内容后询问ai实时识别前缀是否可行，以下是它给出的答案
//回调函数只接收一个inputData对象，包含caller和activator，不包含输入值。
//无法实时读取输入值中的前缀，这是CS2脚本API的设计限制。目前最实用的方案仍然是使用预设的前缀映射表。
//如果你想要使用该脚本，除了要预设自己需要的前缀以外还要注意以下几点
//1、我让ai写的最大倒数数字为180，所以脚本最大只能从180开始倒数，为什么不改，因为它能运行我就懒得改了
//2、你需要在你的游戏里有以下实体
     //①、一个game_zone_player固实体，命名为countdown_game_zone_player_hide，实体内io:OnPlayerOutZone>countdown_hudhint>HideHudHint>>0>-1
     //②、一个game_zone_player固实体，命名为countdown_game_zone_player_show，实体内io:OnPlayerOutZone>countdown_hudhint>ShowHudHint>>0>-1
     //③、一个env_hudhint点实体，命名为countdown_hudhint
     //④、一个point_script点实体，命名为countdown_script，并应用上该vjs
//脚本系统属于热加载，每次更改脚本内容不需要重新编译地图，但每次更改为内容后或者编译地图后都要到编辑文本的地方Ctrl+s保存一次脚本才可以使脚本加载，单机无需考虑这个情况
//当以上一切准备好使，你就可以在hammer中配置io了
//例如：OnPressed>countdown_script>RunScriptInput>doorclose_10 那么他就会以Door close in 10的形式开始倒数
//OnPressed>countdown_script>RunScriptInput>10 那么他就会以> > > 10 < < <的形式开始倒数
//这些io最好全部都勾上只执行一次
//当你将输入的值改为stop时，倒计时会直接结束，回合开始时它自己就会执行一次stop
import { Instance } from "cs_script/point_script";

// 定义实体名称
const HUD_HINT_NAME = "countdown_hudhint";
const ZONE_SHOW_NAME = "countdown_game_zone_player_show";
const ZONE_HIDE_NAME = "countdown_game_zone_player_hide";

// 存储倒计时相关状态
let isCounting = false;
let countdownEndTime = 0;
let lastUpdateSecond = -1;
let currentTemplate = ""; // 当前显示的文本模板

// 模板映射表 - 使用 {time} 作为数字占位符,支持中文
const templateMap = {
    "timer": "> > > {time} < < <", // 纯数字模板
    "doorclosetest": "Door close in {time} sec",    // 数字在末尾的模板
    "bpoop": "化身大便超人倒计时：{time}秒",
    "warning": "Warning: {time} seconds remaining",    // 数字在中间的模板
    "mpoop": "我要在{time}秒后化身大便超人",
    "count": "{time} seconds until start",    // 数字在前面的模板
    "fpoop": "{time}秒后我要化身大便超人",
    "format1": ">>> {time} <<<",    // 特殊格式模板
    "custom1": "Event begins in {time} seconds from now",    // 自定义位置示例
    
    "nukeboom": "核弹将于{time}秒后降临",
    "nukecuming": "{time}秒后核爆降临",
    "flykill": "{time}秒后禁飞",
    "knifefight": "{time}秒后用刀决战！！！",
    "endin": "{time}秒内结束战斗",
};

// 隐藏HUD提示
function hideHudHint() {
    Instance.EntFireAtName({
        name: ZONE_HIDE_NAME,
        input: "CountPlayersInZone"
    });
}

// 显示HUD提示
function showHudHint() {
    Instance.EntFireAtName({
        name: ZONE_SHOW_NAME,
        input: "CountPlayersInZone"
    });
}

// 更新HUD消息
function updateHudMessage(message) {
    Instance.EntFireAtName({
        name: HUD_HINT_NAME,
        input: "SetMessage",
        value: message
    });
    
    showHudHint();
}

// 格式化显示文本（替换占位符）
function formatDisplayText(template, number) {
    // 将模板中的 {time} 替换为数字
    return template.replace(/{time}/g, number.toString());
}

// 检查倒计时并更新显示的Think函数
function countdownThink() {
    if (!isCounting) {
        return;
    }
    
    const currentTime = Instance.GetGameTime();
    const remainingTime = Math.max(0, countdownEndTime - currentTime);
    const remainingSeconds = Math.ceil(remainingTime);
    
    // 只有当秒数变化时才更新显示
    if (remainingSeconds !== lastUpdateSecond) {
        lastUpdateSecond = remainingSeconds;
        
        if (remainingSeconds > 0) {
            // 格式化显示文本
            const displayText = formatDisplayText(currentTemplate, remainingSeconds);
            updateHudMessage(displayText);
        } else if (remainingSeconds === 0) {
            // 倒计时结束
            const displayText = formatDisplayText(currentTemplate, 0);
            updateHudMessage(displayText);
            
            // 1秒后隐藏HUD
            Instance.EntFireAtName({
                name: ZONE_HIDE_NAME,
                input: "CountPlayersInZone",
                delay: 1
            });
            
            // 倒计时结束，停止计数
            isCounting = false;
            return;
        } else {
            hideHudHint();
            isCounting = false;
            return;
        }
    }
    
    // 如果倒计时还在进行中，设置下一次Think
    if (isCounting) {
        Instance.SetNextThink(currentTime + 0.1);
    }
}

// 开始倒计时
function startCountdown(template, seconds) {
    // 停止当前的倒计时
    if (isCounting) {
        isCounting = false;
        hideHudHint();
    }
    
    // 设置倒计时状态
    isCounting = true;
    currentTemplate = template; // 存储当前文本模板
    countdownEndTime = Instance.GetGameTime() + seconds;
    lastUpdateSecond = -1;
    
    // 注册Think函数
    Instance.SetThink(countdownThink);
    Instance.SetNextThink(Instance.GetGameTime() + 0.1);
    
    // 立即显示初始值
    const displayText = formatDisplayText(template, seconds);
    updateHudMessage(displayText);
}

// 停止倒计时
function stopCountdown() {
    if (isCounting) {
        isCounting = false;
        hideHudHint();
    }
}

// 注册所有输入

// 纯数字输入处理（0-180） - 使用timer模板
for (let i = 0; i <= 180; i++) {
    const inputName = i.toString().padStart(3, '0');
    
    Instance.OnScriptInput(inputName, () => {
        startCountdown(templateMap["timer"], i);
    });
    
    if (i > 0 && i < 100) {
        const shortName = i.toString();
        Instance.OnScriptInput(shortName, () => {
            startCountdown(templateMap["timer"], i);
        });
    }
}

// 遍历所有模板，为每个模板注册数字输入
for (const [templateKey, templateText] of Object.entries(templateMap)) {
    // 为每个模板注册0-180的输入
    for (let i = 0; i <= 180; i++) {
        const seconds = i;
        
        // 注册三位数格式：模板键_010
        const threeDigitInput = `${templateKey}_${i.toString().padStart(3, '0')}`;
        Instance.OnScriptInput(threeDigitInput, () => {
            startCountdown(templateText, seconds);
        });
        
        // 注册简写格式：模板键_10（只注册1-99）
        if (i > 0 && i < 100) {
            const shortInput = `${templateKey}_${i}`;
            Instance.OnScriptInput(shortInput, () => {
                startCountdown(templateText, seconds);
            });
        }
    }
}

// 停止命令
Instance.OnScriptInput("stop", () => {
    stopCountdown();
});

// 注册回合开始事件，自动停止倒计时
Instance.OnRoundStart(() => {
    // 当回合开始时，自动停止当前倒计时
    stopCountdown();
});

// 脚本重新加载时的处理
Instance.OnScriptReload({
    before: () => {
        return { wasCounting: isCounting };
    },
    after: (memory) => {
        // 不自动恢复倒计时
    }
});