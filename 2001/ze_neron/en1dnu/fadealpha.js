import { Instance } from "cs_script/point_script";


// ========================================
// 1️⃣ Alpha 淡出 5 秒
// ========================================

Instance.OnScriptInput("fadein", (_input) => {

    let ent = Instance.FindEntityByName("statsis");
    if (!ent) return;

    FadeAlphaByEntity(ent, 5.0, 255, 0, 2);
});


// ========================================
// 2️⃣ Alpha 淡入 5 秒
// ========================================

Instance.OnScriptInput("fadeout_5", (_input) => {

    let ent = Instance.FindEntityByName("statsis");
    if (!ent) return;

    FadeAlphaByEntity(ent, 5.0, 0, 255, 2);
});


// ========================================
// 3️⃣ Alpha 淡入 1 秒
// ========================================

Instance.OnScriptInput("fadeout_1", (_input) => {

    let ent = Instance.FindEntityByName("statsis");
    if (!ent) return;

    FadeAlphaByEntity(ent, 1.0, 0, 255, 2);
});


// ========================================
// 4️⃣ XYZ 等比放大 1 秒
// ========================================

Instance.OnScriptInput("ScaleUp", (_input) => {

    let ent = Instance.FindEntityByName("statsis");
    if (!ent) return;

    ScaleEntity(ent, 1.0, 1.0, 0.01);
});


// ========================================
// 5️⃣ XYZ 等比縮小 1 秒
// ========================================

Instance.OnScriptInput("Scaledown", (_input) => {

    let ent = Instance.FindEntityByName("statsis");
    if (!ent) return;

    ScaleEntityDown(ent, 1.0, 1.0, 0.01);
});


// ========================================
// 6️⃣ 從當前大小放大
// 例如:
// 目前 1.0 -> 放大到 2.0
// ========================================

Instance.OnScriptInput("ScaleFromCurrentUp", (_input) => {

    let ent = Instance.FindEntityByName("test_movelinear");
    if (!ent) return;

    ScaleEntityFromCurrent(ent, 20.0, 1.0, 4.0, 0.001);  //動畫秒數,起始大小,結束大小,每次變化
});


Instance.OnScriptInput("ScaleFromCurrentUp2", (_input) => {

    let ent = Instance.FindEntityByName("test_movelinear2");
    if (!ent) return;

    ScaleEntityFromCurrent(ent, 20.0, 1.0, 4.0, 0.001);  //動畫秒數,起始大小,結束大小,每次變化
});


// ========================================
// 7️⃣ 從當前大小縮小
// 例如:
// 目前 2.0 -> 縮小到 1.0
// ========================================

Instance.OnScriptInput("ScaleFromCurrentDown", (_input) => {

    let ent = Instance.FindEntityByName("statsis");
    if (!ent) return;

    ScaleEntityFromCurrent(ent, 1.0, 2.0, 1.0, 0.01); 
});


// ========================================
// Alpha 漸變
// ========================================

function FadeAlphaByEntity(_ent, duration, startAlpha, endAlpha, step) {

    if (duration < 0.1) {
        Instance.EntFireAtTarget(_ent, "Alpha", endAlpha, 0);
        return;
    }

    const steps = Math.max(1, Math.floor(duration / 0.1));
    const interval = duration / steps;

    for (let i = 0; i <= steps; i++) {

        const progress = i / steps;
        let alpha = Math.round(startAlpha + ((endAlpha - startAlpha) * progress));

        if (i === steps)
            alpha = endAlpha;

        Instance.EntFireAtTarget(
            _ent,
            "Alpha",
            alpha,
            i * interval
        );
    }
}


// ========================================
// XYZ 等比放大
// ========================================

function ScaleEntity(_ent, duration, maxScale, step) {

    if (duration < 0.1) {
        Instance.EntFireAtTarget(_ent, "SetScale", maxScale, 0);
        return;
    }

    const steps = Math.max(1, Math.floor(duration / 0.1));
    const interval = duration / steps;

    for (let i = 0; i <= steps; i++) {

        const progress = i / steps;
        let scale = maxScale * progress;

        if (i === steps)
            scale = maxScale;

        Instance.EntFireAtTarget(
            _ent,
            "SetScale",
            scale,
            i * interval
        );
    }
}


// ========================================
// XYZ 等比縮小
// ========================================

function ScaleEntityDown(_ent, duration, maxScale, step) {

    if (duration < 0.1) {
        Instance.EntFireAtTarget(_ent, "SetScale", 0, 0);
        return;
    }

    const steps = Math.max(1, Math.floor(duration / 0.1));
    const interval = duration / steps;

    for (let i = 0; i <= steps; i++) {

        const progress = i / steps;
        let scale = maxScale * (1 - progress);

        if (i === steps)
            scale = 0;

        Instance.EntFireAtTarget(
            _ent,
            "SetScale",
            scale,
            i * interval
        );
    }
}


// ========================================
// 從當前大小縮放
// startScale = 起始大小
// endScale   = 結束大小
// ========================================

function ScaleEntityFromCurrent(_ent, duration, startScale, endScale, step) {

    if (duration < 0.1) {
        Instance.EntFireAtTarget(_ent, "SetScale", endScale, 0);
        return;
    }

    const steps = Math.max(1, Math.floor(duration / 0.1));
    const interval = duration / steps;

    for (let i = 0; i <= steps; i++) {

        const progress = i / steps;
        let scale = startScale + ((endScale - startScale) * progress);

        if (i === steps)
            scale = endScale;

        Instance.EntFireAtTarget(
            _ent,
            "SetScale",
            scale,
            i * interval
        );
    }
}
