//@ts-nocheck

import { Instance } from "cs_script/point_script";

Instance.Msg("希区柯克变焦脚本已加载");

let zoomEffect = {
    isActive: false,
    startTime: 0,
    duration: 3.0,
    startFOV: 30,
    endFOV: 150
};

function getViewEntity() {
    return Instance.FindEntityByName("view_4");
}

function setCameraFOV(fovValue) {
    const viewEntity = getViewEntity();
    if (viewEntity && viewEntity.IsValid()) {
        viewEntity.SetHealth(fovValue);
    }
}

function startHitcookZoom() {
    if (zoomEffect.isActive) return;
    
    zoomEffect.isActive = true;
    zoomEffect.startTime = Instance.GetGameTime();
    
    setCameraFOV(zoomEffect.startFOV);
    
    Instance.SetNextThink(Instance.GetGameTime());
    Instance.SetThink(() => {
        if (!zoomEffect.isActive) return;
        
        const currentTime = Instance.GetGameTime();
        const elapsed = currentTime - zoomEffect.startTime;
        const progress = Math.min(elapsed / zoomEffect.duration, 1.0);
        
        const targetFOV = zoomEffect.startFOV + (zoomEffect.endFOV - zoomEffect.startFOV) * progress;
        const currentFOV = Math.round(targetFOV * 10) / 10;
        
        setCameraFOV(currentFOV);
        
        if (progress >= 1.0) {
            zoomEffect.isActive = false;
            return;
        }
        
        Instance.SetNextThink(Instance.GetGameTime() + 0.00833);
    });
}

Instance.OnScriptInput("hitcook", (inputData) => {
    startHitcookZoom();
});