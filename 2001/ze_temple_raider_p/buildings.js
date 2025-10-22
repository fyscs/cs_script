import { Instance } from 'cs_script/point_script'

Instance.OnScriptInput("ExplodeBuildings", (context) => {
    let physboxes = Instance.FindEntitiesByName("Fuking_Building_To_Cut_*")
    physboxes.forEach((p) => {
        p.Teleport({velocity: {x: rand(-2050, 3050), y: rand(2150, 2550),z: rand(900, 1400)}})
    })
})

function rand(num1, num2) {
    if (num1 < num2) return parseInt(Math.random() * (num2 - num1) + num1)
    return parseInt(Math.random() * (num1 - num2) + num2)
}