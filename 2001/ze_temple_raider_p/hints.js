import { Instance } from 'cs_script/point_script'

let holdTimerCase
let hudHint
let holdTime
let yolo
const yoloTime = 100

const introText = 'The world is falling apart! Fight your way to the temple and escape.'

function Init(){
    yolo = false
    holdTimerCase = Instance.FindEntityByName("hold_timer_case")
    hudHint = Instance.FindEntityByName("hold_hint")
    Instance.ConnectOutput(holdTimerCase, "OnDefault", (inputData) => {
        holdTime = Number(inputData.value)
    })
}

Init()

Instance.OnScriptInput("SetYoloMode", (context) => {
    yolo = true
})

Instance.OnScriptInput("YoloCountdown", (context) => {
    Instance.FindEntitiesByClass("player").forEach((p) => {
        let timer = yoloTime
        for(let i=0; i<yoloTime; i++){
            let s = (timer > 1 ? 'S' : '')
            Instance.EntFireAtTarget({target: hudHint, input: "SetMessage", value: `BOMB EXPLODING IN ${timer} SECOND${s}`, delay: i})
            Instance.EntFireAtTarget({target: hudHint, input: "ShowHudHint", delay: i+0.01, activator: p})
            timer--
        }
        Instance.EntFireAtTarget({target: hudHint, input: "SetMessage", value: `KABOOOM`, delay: yoloTime + 1})
        Instance.EntFireAtTarget({target: hudHint, input: "ShowHudHint", delay: yoloTime+1.01, activator: p})
    })
})

Instance.OnScriptInput("HoldCountdown", (context) => {
    if (!yolo){
        Instance.FindEntitiesByClass("player").forEach((p) => {
            if (!isNaN(holdTime)){
                let timer = holdTime
                for(let i=0; i<holdTime; i++){
                    let s = (timer > 1 ? 'S' : '')
                    Instance.EntFireAtTarget({target: hudHint, input: "SetMessage", value: `HOLD ${timer} SECOND${s}`, delay: i})
                    Instance.EntFireAtTarget({target: hudHint, input: "ShowHudHint", delay: i+0.01, activator: p})
                    timer--
                }
                Instance.EntFireAtTarget({target: hudHint, input: "SetMessage", value: `GO GO GO`, delay: holdTime})
                Instance.EntFireAtTarget({target: hudHint, input: "ShowHudHint", delay: holdTime+0.01, activator: p})
            }
        })
    }
})

Instance.OnScriptInput("IntroMessage", (context) => {
    Instance.FindEntitiesByClass("player").forEach((p) => {
        let message = ''
        let delay = 0.1
        for (let i=0; i<introText.length; i++){
            message += introText.charAt(i)
            Instance.EntFireAtTarget({target: hudHint, input: "SetMessage", value: message.toUpperCase(), delay: delay})
            Instance.EntFireAtTarget({target: hudHint, input: "ShowHudHint", delay: delay+0.01, activator: p})
            delay += 0.1
        }
    })
})

Instance.OnRoundStart(() => {
    Init()
})
