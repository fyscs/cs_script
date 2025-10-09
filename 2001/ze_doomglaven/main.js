// s2ts v0.5.2
import { Instance } from "cs_script/point_script"

const announce = (message, delay) => Instance.EntFireAtName("server", "Command", `say *${message.toUpperCase()}*`, delay)
const generateUniqueRandomNumbers = (min, max, count) => {
    if (max < min || count <= 0) {
        return []
    }
    const result = []
    const possibleNumbers = Array.from({ length: max - min + 1 }, (_, i) => i + min)
    while (result.length < count) {
        const randomIndex = Math.floor(Math.random() * possibleNumbers.length)
        const randomElement = possibleNumbers[randomIndex]
        if (randomElement === undefined) {
            return result
        }
        result.push(randomElement)
        possibleNumbers.splice(randomIndex, 1)
    }
    return result
}

const locations = ["dock", "street", "sewer", "cave", "library", "chapel", "secret-one", "secret-two", "secret-three"]
const chestTypes = ["thunder", "quake", "heal", "trap-fire", "trap-poison", "key", "empty"]
const chestSettings = {
    dock: {
        possibleSpawns: 12,
        heal: 0,
        thunder: 1,
        quake: 1,
        key: 0,
        empty: 0,
        "trap-fire": 1,
        "trap-poison": 1
    },
    street: {
        possibleSpawns: 24,
        heal: 1,
        thunder: 1,
        quake: 1,
        key: 0,
        empty: 0,
        "trap-fire": 1,
        "trap-poison": 1
    },
    sewer: {
        possibleSpawns: 7,
        heal: 1,
        thunder: 1,
        quake: 0,
        key: 0,
        empty: 0,
        "trap-fire": 1,
        "trap-poison": 1
    },
    cave: {
        possibleSpawns: 12,
        heal: 0,
        thunder: 1,
        quake: 0,
        key: 0,
        empty: 0,
        "trap-fire": 1,
        "trap-poison": 1
    },
    library: {
        possibleSpawns: 8,
        heal: 0,
        thunder: 1,
        quake: 1,
        key: 0,
        empty: 0,
        "trap-fire": 1,
        "trap-poison": 1
    },
    chapel: {
        possibleSpawns: 27,
        heal: 0,
        thunder: 0,
        quake: 0,
        key: 1,
        empty: 18,
        "trap-fire": 2,
        "trap-poison": 2
    },
    "secret-one": {
        possibleSpawns: 2,
        heal: 0,
        thunder: 0,
        quake: 2,
        key: 0,
        empty: 0,
        "trap-fire": 0,
        "trap-poison": 0
    },
    "secret-two": {
        possibleSpawns: 0,
        heal: 0,
        thunder: 0,
        quake: 0,
        key: 0,
        empty: 0,
        "trap-fire": 0,
        "trap-poison": 0
    },
    "secret-three": {
        possibleSpawns: 4,
        heal: 0,
        thunder: 2,
        quake: 0,
        key: 0,
        empty: 0,
        "trap-fire": 0,
        "trap-poison": 0
    }
}
const getTotalSpawns = location => Object.values(chestSettings[location]).reduce((acc, curr) => acc + curr, 0) - chestSettings[location].possibleSpawns
const spawnChest = (location, position, type) =>
    Instance.EntFireAtName(`spawnable_chest-${type}_maker`, "ForceSpawnAtEntityOrigin", `spawner_chest_${location}${position}`)
const spawnChestsForLocation = location => {
    const chestPositions = generateUniqueRandomNumbers(1, chestSettings[location].possibleSpawns, getTotalSpawns(location))
    chestTypes.forEach(chestType => {
        const spawnPositions = chestPositions.splice(0, chestSettings[location][chestType])
        spawnPositions.forEach(position => spawnChest(location, position, chestType))
    })
}
const spawnAllChests = () => locations.forEach(spawnChestsForLocation)

const POSSIBLE_SPAWNS = 15
const spawnAllGrimoires = () => {
    const grimoirePositions = generateUniqueRandomNumbers(1, POSSIBLE_SPAWNS, 4)
    Instance.EntFireAtName("spell_grimoire-gnashing_maker", "ForceSpawnAtEntityOrigin", `spawner_grimoire${grimoirePositions[0]}`)
    Instance.EntFireAtName("spell_grimoire-gasping_maker", "ForceSpawnAtEntityOrigin", `spawner_grimoire${grimoirePositions[1]}`)
    Instance.EntFireAtName("spell_grimoire-gyration_maker", "ForceSpawnAtEntityOrigin", `spawner_grimoire${grimoirePositions[2]}`)
    Instance.EntFireAtName("spell_grimoire-gluttony_maker", "ForceSpawnAtEntityOrigin", `spawner_grimoire${grimoirePositions[3]}`)
}

const TOTAL_BREAKABLE_WINDOWS = 26
const TOTAL_OUTSIDE_LIGHTNING = 15
let placedGrimoires = 0
Instance.OnScriptInput("resetState", () => {
    placedGrimoires = 0
})
Instance.OnScriptInput("placeGnashingGrimoire", () => placeGrimoire("gnashing"))
Instance.OnScriptInput("placeGaspingGrimoire", () => placeGrimoire("gasping"))
Instance.OnScriptInput("placeGyrationGrimoire", () => placeGrimoire("gyration"))
Instance.OnScriptInput("placeGluttonyGrimoire", () => placeGrimoire("gluttony"))
const placeGrimoire = grimoireNameString => {
    const grimoireName = grimoireNameString
    placedGrimoires++
    Instance.EntFireAtName(`spell_grimoire-${grimoireName}_book`, "Kill")
    Instance.EntFireAtName(`spell_grimoire-${grimoireName}_trigger`, "Kill")
    Instance.EntFireAtName(`ritual_placedbook${placedGrimoires}`, "Enable")
    Instance.EntFireAtName(`ritual_lightning_timer${placedGrimoires}`, "Enable")
    Instance.EntFireAtName("ritual_book_sound", "StartSound")
    if (placedGrimoires <= 3) {
        announce(`GRIMOIRE OF ${grimoireName.toUpperCase()} PLACED`, 0)
        announce(`${placedGrimoires}/3 GRIMOIRES PLACED`, 0.5)
    }
    if (placedGrimoires === 3) {
        Instance.EntFireAtName("ritual_start_relay", "Trigger")
    }
    if (placedGrimoires === 4) {
        announce("A 4TH GRIMOIRE?", 1)
    }
    triggerRitualLightning()
}
const triggerRitualLightning = () => {
    const windowNumber = Math.floor(Math.random() * TOTAL_BREAKABLE_WINDOWS) + 1
    Instance.EntFireAtName(`library_window${windowNumber}_particle`, "Start")
    Instance.EntFireAtName(`library_window${windowNumber}_particle`, "Stop", "", 2)
    Instance.EntFireAtName(`library_window${windowNumber}_particle2`, "Start")
    Instance.EntFireAtName(`library_window${windowNumber}_particle2`, "Stop", "", 2)
    Instance.EntFireAtName(`library_window${windowNumber}_breakable`, "Break")
    Instance.EntFireAtName("ritual_lightning_sound", "StartSound")
    Instance.EntFireAtName("sound_lightning_distant", "StartSound")
}
Instance.OnScriptInput("triggerRitualLightning", triggerRitualLightning)
Instance.OnScriptInput("triggerOutsideLightning", () => {
    const lightningNumber = Math.floor(Math.random() * TOTAL_OUTSIDE_LIGHTNING) + 1
    Instance.EntFireAtName(`library_random-lightning${lightningNumber}`, "ForceSpawn")
})
Instance.OnScriptInput("spawnRandomSpawnables", () => {
    spawnAllChests()
    spawnAllGrimoires()
})
