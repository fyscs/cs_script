import { Instance } from "cs_script/point_script";

// ============================================================================
// Trigger Manager - Modular stage-specific trigger setup
// ============================================================================
// Centralizes stage-specific entity configuration and event chaining from
// levelmanager.js for cleaner separation of concerns.
//
// Pattern: Each stage has an AddTriggerN() function registered as OnScriptInput
// that fires all stage-specific entity setup via EntFire calls.
// ============================================================================

// ============================================================================
// EntFire Helper Functions (from levelmanager.js)
// ============================================================================
// These are the exact implementations from levelmanager.js to ensure compatibility

function EntFire(name, input, value = "", delay = 0) {
    if (input === "AddOutput" && typeof value === "string") {
        value = convertAddOutputString(value);
    }
    Instance.EntFireAtName(name, input, value, delay);
}

function EntFireAtTarget(targetEntity, input, value = "", delay = 0) {
    if (input === "AddOutput" && typeof value === "string") {
        value = convertAddOutputString(value);
    }
    Instance.EntFireAtTarget(targetEntity, input, value, delay);
}

function convertAddOutputString(s) {
    if (!s || typeof s !== "string") return s;
    const trimmed = s.trim();

    // If it already looks like CS2 AddOutput (has >=5 '>' separators), leave it.
    const gtCount = (trimmed.match(/>/g) || []).length;
    if (gtCount >= 5) return trimmed;

    // Expect legacy format: OutputName <space> remainder (remainder uses ':' separators)
    const firstSpace = trimmed.indexOf(' ');
    if (firstSpace === -1) {
        // No space — fallback: replace colons with '>' and try to pad fields.
        const fallbackParts = trimmed.split(':');
        while (fallbackParts.length < 5) fallbackParts.push('');
        return fallbackParts.join('>');
    }

    const outputName = trimmed.slice(0, firstSpace).trim();
    const rest = trimmed.slice(firstSpace + 1);
    const parts = rest.split(':');

    // Map parts to target, inputName, parameter, delay, times with heuristics.
    let target = '';
    let inputName = '';
    let parameter = '';
    let delay = '';
    let times = '';

    if (parts.length >= 5) {
        target = parts[0].trim();
        inputName = parts[1].trim();
        parameter = parts.slice(2, parts.length - 2).join(':').trim();
        delay = parts[parts.length - 2].trim();
        times = parts[parts.length - 1].trim();
    } else if (parts.length === 4) {
        target = parts[0].trim();
        inputName = parts[1].trim();
        parameter = parts[2].trim();
        delay = parts[3].trim();
        times = '';
    } else if (parts.length === 3) {
        target = parts[0].trim();
        inputName = parts[1].trim();
        parameter = '';
        delay = parts[2].trim();
        times = '';
    } else if (parts.length === 2) {
        target = parts[0].trim();
        inputName = parts[1].trim();
    } else if (parts.length === 1) {
        target = parts[0].trim();
    }

    // Check if parameter looks like a KeyValue assignment (e.g., "origin 100 200 300", "color 255 0 0")
    // If so, treat it as KeyValue to avoid malformed AddOutput strings
    const keyvaluePattern = /^(origin|color|fogcolor|health|alpha|rendercolor|renderamt|scale)\s+/i;
    if (keyvaluePattern.test(parameter)) {
        inputName = "KeyValue";
    }

    return `${outputName}>${target}>${inputName}>${parameter}>${delay}>${times}`;
}

// ============================================================================
// STAGE-SPECIFIC TRIGGER SETUP FUNCTIONS
// ============================================================================

function AddTrigger1() {
	// - Warmup stage
}

function AddTrigger2() {
	// st1 boss stage)
		EntFire("entrance_trigger","AddOutput","OnStartTouch entrance:Open::5:1",0.02);
		EntFire("entrance_trigger","AddOutput","OnStartTouch entrance_trigger_2_normal:enable::0:1",0.02);
		EntFire("entrance_trigger","AddOutput","OnStartTouch server:command:say *** Welcome to Genso ***:0:1",0.02);

		// EntFire("entrance_trigger","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetEventName(0):0.00:1",0.02);
		// EntFire("entrance_trigger","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(5):0.00:1",0.02);


		EntFire("entrance_trigger_2_normal","AddOutput","OnStartTouch server:command:say *** Left gate opens in 25 seconds ***:0:1",0.02);
		EntFire("entrance_trigger_2_normal","AddOutput","OnStartTouch entrance2:open::25:1",0.02);
		EntFire("entrance_trigger_2_normal","AddOutput","OnStartTouch entrance_trigger_3:enable::0:1",0.02);
		EntFire("entrance_trigger_2_normal","AddOutput","OnStartTouch afk1:enable::25:1",0.02);

		// EntFire("entrance_trigger_2_normal","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetEventName(2):0.00:1",0.02);
		// EntFire("entrance_trigger_2_normal","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(25):0.00:1",0.02);


		EntFire("entrance_trigger_3","AddOutput","OnStartTouch temple_trigger_1:enable::0:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch temple_entrance_gate:open::20:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch server:command:say *** Entrance gate opens in 20 seconds ***:0:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch afk2:enable::38:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch temple_entrance_gate_2:open::23:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch temple_entrance_gate:close::33:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch temple_entrance_gate_2:close::35:1",0.02);

		// EntFire("entrance_trigger_3","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetEventName(3):0.00:1",0.02);
		// EntFire("entrance_trigger_3","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(1):0.00:1",0.02);
		// EntFire("entrance_trigger_3","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(2):22.20:1",0.02);
		// EntFire("entrance_trigger_3","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(20):0.00:1",0.02);


		EntFire("temple_trigger_1","AddOutput","OnStartTouch server:command:say *** The gate opens in 20 seconds ***:0:1",0.02);
		EntFire("temple_trigger_1","AddOutput","OnStartTouch afk3:enable::30:1",0.02);
		EntFire("temple_trigger_1","AddOutput","OnStartTouch Temple_Entrance_Door2:open::20:1",0.02);
		EntFire("temple_trigger_1","AddOutput","OnStartTouch Temple_Entrance_Door2:close::28:1",0.02);
		EntFire("temple_trigger_1","AddOutput","OnStartTouch Temple_Entrance_Door2:close::28:1",0.02);
		EntFire("temple_trigger_1","AddOutput","OnStartTouch temple_trigger_2:enable::0:1",0.02);

		// EntFire("temple_trigger_1","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetEventName(0):0.00:1",0.02);
		// EntFire("temple_trigger_1","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(20):0.00:1",0.02);


		EntFire("temple_trigger_2","AddOutput","OnStartTouch temple_trigger_3:enable::0:1",0.02);
		EntFire("temple_trigger_2","AddOutput","OnStartTouch temple_gate_1:open::25:1",0.02);
		EntFire("temple_trigger_2","AddOutput","OnStartTouch server:command:say *** The gate opens in 25 seconds ***:0:1",0.02);

		// EntFire("temple_trigger_2","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(25):0.00:1",0.02);


		EntFire("temple_trigger_3","AddOutput","OnStartTouch afk4:enable::20:1",0.02);
		EntFire("temple_trigger_3","AddOutput","OnStartTouch temple_trigger_4:enable::0:1",0.02);
		EntFire("temple_trigger_3","AddOutput","OnStartTouch temple_gate_2:open::15:1",0.02);
		EntFire("temple_trigger_3","AddOutput","OnStartTouch temple_gate_1:close::18:1",0.02);
		EntFire("temple_trigger_3","AddOutput","OnStartTouch server:command:say *** The gate opens in 15 seconds ***:0:1",0.02);

		// EntFire("temple_trigger_3","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(15):0.00:1",0.02);


		EntFire("temple_trigger_4","AddOutput","OnStartTouch temple_trigger_5:enable::0:1",0.02);
		EntFire("temple_trigger_4","AddOutput","OnStartTouch temple_gate_3:open::15:1",0.02);
		EntFire("temple_trigger_4","AddOutput","OnStartTouch temple_gate_3:close::23:1",0.02);
		EntFire("temple_trigger_4","AddOutput","OnStartTouch server:command:say *** The gate opens in 15 seconds ***:0:1",0.02);
		EntFire("temple_trigger_4","AddOutput","OnStartTouch afk5:enable::25:1",0.02);
		EntFire("temple_trigger_4","AddOutput","OnStartTouch AFK_Teleport5:AddOutput:angles 0 0 0:24:1",0.02);

		// EntFire("temple_trigger_4","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(15):0.00:1",0.02);
		// EntFire("temple_trigger_4","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(4):14.00:1",0.02);
		// EntFire("temple_trigger_4","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(5):17.00:1",0.02);


		EntFire("temple_trigger_5","AddOutput","OnStartTouch temple_gate_4:close::35:1",0.02);
		EntFire("temple_trigger_5","AddOutput","OnStartTouch temple_gate_4:open::20:1",0.02);
		EntFire("temple_trigger_5","AddOutput","OnStartTouch server:command:say *** The gate opens in 20 seconds ***:0:1",0.02);
		EntFire("temple_trigger_5","AddOutput","OnStartTouch server:command:say *** Defend here for 10 seconds ***:25:1",0.02);
		EntFire("temple_trigger_5","AddOutput","OnStartTouch afk6:enable::38:1",0.02);
		EntFire("temple_trigger_5","AddOutput","OnStartTouch st1_boss_appear:FireUser1::40:1",0.02);

		// EntFire("temple_trigger_5","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(20):0.00:1",0.02);
		// EntFire("temple_trigger_5","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(6):19.00:1",0.02);
		// EntFire("temple_trigger_5","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(8):22.00:1",0.02);
		// EntFire("temple_trigger_5","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(10):25.00:1",0.02);
		// EntFire("temple_trigger_5","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetCompleteName(2):28.00:1",0.02);
		// EntFire("temple_trigger_5","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetCompleteName(0):45.00:1",0.02);

		EntFire("st1_boss_appear", "AddOutput", "OnUser1 music_scripts:RunScriptInput:PlayBGM(1):3.00:1", 0.02);
		EntFire("st1_boss_appear","AddOutput","OnUser1 st1_boss_start_relay:FireUser1::3.00:1",0.02);

		EntFire("Boss1_After_Relay","AddOutput","OnUser1 music_scripts:RunScriptInput:PlayBGM(2):3.00:1",0.02);
		EntFire("Boss1_After_Relay","AddOutput","OnUser1 wincheck_script:RunScriptInput:st1_wincheck:95.00:1",0.02);
		// EntFire("Boss1_After_Relay","AddOutput","OnUser1 Map_Text:RunScriptInput:SetCompleteName(2):94.00:1",0.02);
}

function AddTrigger3() {
	// st2 boss stage
		EntFire("entrance_trigger","AddOutput","OnStartTouch entrance:open::10:1",0.02);
		EntFire("entrance_trigger","AddOutput","OnStartTouch entrance_trigger_2_normal:enable::0:1",0.02);
		EntFire("entrance_trigger","AddOutput","OnStartTouch server:command:say *** Welcome to Genso ***:0:1",0.02);

		// EntFire("entrance_trigger","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetEventName(0):0.00:1",0.02);
		// EntFire("entrance_trigger","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(10):0.00:1",0.02);


		EntFire("entrance_trigger_2_normal","AddOutput","OnStartTouch server:command:say *** Right gate opens in 30 seconds ***:0:1",0.02);
		EntFire("entrance_trigger_2_normal","AddOutput","OnStartTouch entrance3:open::30:1",0.02);
		EntFire("entrance_trigger_2_normal","AddOutput","OnStartTouch entrance_trigger_3:enable::0:1",0.02);
		EntFire("entrance_trigger_2_normal","AddOutput","OnStartTouch afk1:enable::30:1",0.02);

		// EntFire("entrance_trigger_2_normal","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetEventName(1):0.00:1",0.02);
		// EntFire("entrance_trigger_2_normal","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(30):0.00:1",0.02);


		EntFire("entrance_trigger_3","AddOutput","OnStartTouch temple_trigger_1:enable::0:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch temple_entrance_gate:open::20:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch server:command:say *** Entrance gate opens in 20 seconds ***:0:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch afk2:enable::38:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch temple_entrance_gate_2:close::35:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch temple_entrance_gate_2:open::25:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch temple_entrance_gate:close::33:1",0.02);

		// EntFire("entrance_trigger_3","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetEventName(3):19.00:1",0.02);
		// EntFire("entrance_trigger_3","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(1):0.00:1",0.02);
		// EntFire("entrance_trigger_3","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(2):22.20:1",0.02);
		// EntFire("entrance_trigger_3","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(20):0.00:1",0.02);


		EntFire("temple_trigger_1","AddOutput","OnStartTouch temple_trigger_2:enable::0:1",0.02);
		EntFire("temple_trigger_1","AddOutput","OnStartTouch temple_Entrance_Door2:open::20:1",0.02);
		EntFire("temple_trigger_1","AddOutput","OnStartTouch temple_Entrance_Door2:close::28:1",0.02);
		EntFire("temple_trigger_1","AddOutput","OnStartTouch server:command:say *** The gate opens in 20 seconds ***:0:1",0.02);
		EntFire("temple_trigger_1","AddOutput","OnStartTouch afk3:enable::30:1",0.02);

		// EntFire("temple_trigger_1","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetEventName(0):0.00:1",0.02);
		// EntFire("temple_trigger_1","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(20):0.00:1",0.02);


		EntFire("temple_trigger_2","AddOutput","OnStartTouch temple_trigger_3:enable::0:1",0.02);
		EntFire("temple_trigger_2","AddOutput","OnStartTouch temple_gate_1:open::25:1",0.02);
		EntFire("temple_trigger_2","AddOutput","OnStartTouch server:command:say *** The gate opens in 25 seconds ***:0:1",0.02);

		// EntFire("temple_trigger_2","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(25):0.00:1",0.02);


		EntFire("temple_trigger_3","AddOutput","OnStartTouch afk4:enable::20:1",0.02);
		EntFire("temple_trigger_3","AddOutput","OnStartTouch temple_trigger_4:enable::0:1",0.02);
		EntFire("temple_trigger_3","AddOutput","OnStartTouch temple_gate_1:close::18:1",0.02);
		EntFire("temple_trigger_3","AddOutput","OnStartTouch temple_gate_2:open::15:1",0.02);
		EntFire("temple_trigger_3","AddOutput","OnStartTouch server:command:say *** The gate opens in 15 seconds ***:0:1",0.02);

		// EntFire("temple_trigger_3","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(15):0.00:1",0.02);


		EntFire("temple_trigger_4","AddOutput","OnStartTouch temple_trigger_6:enable::0:1",0.02);
		EntFire("temple_trigger_4","AddOutput","OnStartTouch temple_gate_3:open::15:1",0.02);
		EntFire("temple_trigger_4","AddOutput","OnStartTouch server:command:say *** The gate opens in 15 seconds ***:0:1",0.02);

		// EntFire("temple_trigger_4","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(15):0.00:1",0.02);
		// EntFire("temple_trigger_4","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(4):14.00:1",0.02);
		// EntFire("temple_trigger_4","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(5):17.00:1",0.02);


		EntFire("temple_trigger_6","AddOutput","OnStartTouch temple_gate_3:close::23:1",0.02);
		EntFire("temple_trigger_6","AddOutput","OnStartTouch afk5:enable::25:1",0.02);
		EntFire("temple_trigger_6","AddOutput","OnStartTouch server:command:say *** The gate opens in 10 seconds ***:0:1",0.02);
		EntFire("temple_trigger_6","AddOutput","OnStartTouch temple_gate_6:open::10:1",0.02);
		EntFire("temple_trigger_6","AddOutput","OnStartTouch temple_trigger_7:enable::0:1",0.02);
		EntFire("temple_trigger_6","AddOutput","OnStartTouch server:command:say *** The metal gate breaks in 5 seconds ***:13:1",0.02);
		EntFire("temple_trigger_6","AddOutput","OnStartTouch Bottom_metal:break::18:1",0.02);

		// EntFire("temple_trigger_6","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(10):0.00:1",0.02);
		// EntFire("temple_trigger_6","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(7):17.00:1",0.02);
		// EntFire("temple_trigger_6","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(20):23.00:1",0.02);


		EntFire("temple_trigger_7","AddOutput","OnStartTouch temple_trigger_7_2:enable::0:1",0.02);
		EntFire("temple_trigger_7","AddOutput","OnStartTouch temple_gate_7:open::25:1",0.02);
		EntFire("temple_trigger_7","AddOutput","OnStartTouch server:command:say *** The gate opens in 25 seconds ***:0:1",0.02);
		EntFire("temple_trigger_7","AddOutput","OnStartTouch door_tp_t:enable::35:1",0.02);
		EntFire("temple_trigger_7","AddOutput","OnStartTouch afk9:enable::10:1",0.02);
		EntFire("temple_trigger_7","AddOutput","OnStartTouch afk6:KeyValue:target AFK_Teleport6:9:1",0.02);
		EntFire("temple_trigger_7","AddOutput","OnStartTouch afk6:enable::10:1",0.02);

		// EntFire("temple_trigger_7","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(25):0.00:1",0.02);


		EntFire("temple_trigger_7_2","AddOutput","OnStartTouch afk10:enable::50:1",0.02);
		EntFire("temple_trigger_7_2","AddOutput","OnStartTouch afk10:KeyValue:target st2_boss_zteleport:49:1",0.02);
		EntFire("temple_trigger_7_2","AddOutput","OnStartTouch server:command:say *** The gate opens in 20 seconds ***:0:1",0.02);
		EntFire("temple_trigger_7_2","AddOutput","OnStartTouch boss2_gate:open::20:1",0.02);
		EntFire("temple_trigger_7_2","AddOutput","OnStartTouch boss2_gate:close::35:1",0.02);
		EntFire("temple_trigger_7_2","AddOutput","OnStartTouch temple_gate_7:close::40:1",0.02);
		EntFire("temple_trigger_7_2","AddOutput","OnStartTouch st2_boss_teleport:enable::20:1",0.02);
		EntFire("temple_trigger_7_2","AddOutput","OnStartTouch st2_boss_teleport:disable::50:1",0.02);
		EntFire("temple_trigger_7_2","AddOutput","OnStartTouch st2_boss_start_trigger:enable::20:1",0.02);
		EntFire("temple_trigger_7_2","AddOutput","OnStartTouch st2_boss_timer:enable::45:1",0.02);
		EntFire("temple_trigger_7_2", "AddOutput", "OnStartTouch server:command:say *** Defend here for 10 seconds ***:25:1", 0.02);
		EntFire("temple_trigger_7_2","AddOutput","OnStartTouch filter_script:RunScriptInput:DisableZombieItems:35:1",0.02);


		// EntFire("temple_trigger_7_2","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(20):0.00:1",0.02);
		EntFire("temple_trigger_7_2","AddOutput","OnStartTouch music_scripts:RunScriptInput:PlayBGM(4):25:1",0.02);


		EntFire("temple_trigger_8","AddOutput","OnStartTouch temple_gate_8:open::10:1",0.02);
		EntFire("temple_trigger_8","AddOutput","OnStartTouch server:command:say *** The gate opens in 10 seconds ***:0:1",0.02);
		EntFire("temple_trigger_8","AddOutput","OnStartTouch temple_trigger_9:enable::0:1", 0.02);
		EntFire("temple_trigger_8","AddOutput","OnStartTouch stair_door:Break::25:1", 0.02);
		EntFire("temple_trigger_8","AddOutput","OnStartTouch filter_script:RunScriptInput:EnableZombieItems:10:1",0.02);

		// EntFire("temple_trigger_8","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(21):9.00:1",0.02);
		// EntFire("temple_trigger_8","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(13):13.00:1",0.02);
		// EntFire("temple_trigger_8","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(10):0.00:1",0.02);

		EntFire("temple_trigger_9","AddOutput","OnStartTouch temple_trigger_10:enable::0:1",0.02);
		EntFire("temple_trigger_9","AddOutput","OnStartTouch server:command:say *** The gate opens in 25 seconds ***:0:1",0.02);
		EntFire("temple_trigger_9","AddOutput","OnStartTouch temple_gate_9:open::25:1",0.02);
		EntFire("temple_trigger_9","AddOutput","OnStartTouch door_tp_t2:enable::0:1",0.02);
		EntFire("temple_trigger_9","AddOutput","OnStartTouch temple_gate_9_2:open::30:1",0.02);
		EntFire("temple_trigger_9","AddOutput","OnStartTouch server:command:say *** Go ***:25:1",0.02);
		EntFire("temple_trigger_9","AddOutput","OnStartTouch afk10:enable::15:1",0.02);
		EntFire("temple_trigger_9","AddOutput","OnStartTouch afk10:KeyValue:target AFK_Teleport7:14:1",0.02);

		// EntFire("temple_trigger_9","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(25):0.00:1",0.02);
		// EntFire("temple_trigger_9","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(15):24.00:1",0.02);
		// EntFire("temple_trigger_9","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(8):27.00:1",0.02);


		EntFire("temple_trigger_10","AddOutput","OnStartTouch temple_trigger_11:enable::0:1",0.02);
		EntFire("temple_trigger_10","AddOutput","OnStartTouch server:command:say *** The gate opens in 10 seconds ***:0:1",0.02);
		EntFire("temple_trigger_10","AddOutput","OnStartTouch temple_gate_10:open::0:1",0.02);
		EntFire("temple_trigger_10","AddOutput","OnStartTouch temple_gate_11:open::5:1",0.02);
		EntFire("temple_trigger_10","AddOutput","OnStartTouch temple_gate_11_2:open::10:1",0.02);
		EntFire("temple_trigger_10","AddOutput","OnStartTouch AFK12:enable::10:1",0.02);
		EntFire("temple_trigger_10","AddOutput","OnStartTouch st1_boss_metal:break::10:1",0.02);
		EntFire("temple_trigger_10","AddOutput","OnStartTouch temple_gate_9_2:close::8:1",0.02);
		EntFire("temple_trigger_10","AddOutput","OnStartTouch temple_gate_9:close::5:1",0.02);

		// EntFire("temple_trigger_10","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(10):0.00:1",0.02);
		// EntFire("temple_trigger_10","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(12):0.00:1",0.02);


		EntFire("temple_trigger_11","AddOutput","OnStartTouch server:command:say *** The gate opens in 20 seconds ***:0:1",0.02);
		EntFire("temple_trigger_11","AddOutput","OnStartTouch temple_gate_12:open::20:1",0.02);
		EntFire("temple_trigger_11", "AddOutput", "OnStartTouch out:open::25:1", 0.02);
		EntFire("temple_trigger_11","AddOutput","OnStartTouch out1:open::25:1",0.02);
		EntFire("temple_trigger_11", "AddOutput", "OnStartTouch out_2:open::30:1", 0.02);
		EntFire("temple_trigger_11","AddOutput","OnStartTouch out_21:open::30:1",0.02);
		EntFire("temple_trigger_11","AddOutput","OnStartTouch server:command:say *** Final defend for 20 seconds ***:35:1",0.02);
		EntFire("temple_trigger_11","AddOutput","OnStartTouch temple_gate_13:open::35:1",0.02);
		EntFire("temple_trigger_11","AddOutput","OnStartTouch temple_gate_13:close::55:1",0.02);

		// EntFire("temple_trigger_11","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(20):0.00:1",0.02);
		// EntFire("temple_trigger_11","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(20):35.00:1",0.02);
		// EntFire("temple_trigger_11","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetCompleteName(2):45.00:1",0.02);

		EntFire("temple_trigger_11","AddOutput","OnStartTouch wincheck_script:RunScriptInput:st2_wincheck:58.00:1",0.02);
		EntFire("st2_boss_end_relay","AddOutput","OnUser1 afk10:Disable::0:1",0.02);
		EntFire("temple_trigger_7","AddOutput","OnStartTouch door_tp_t_particle:start::35:1",0.02);
		EntFire("temple_trigger_9","AddOutput","OnStartTouch door_tp_t2_particle:start::0:1",0.02);
		EntFire("temple_trigger_9","AddOutput","OnStartTouch subway_door:break::5:1",0.02);
}

function AddTrigger4() {
	// Stage 4 (st3 soul mode)
		EntFire("entrance_trigger","AddOutput","OnStartTouch entrance:open::15:1",0.02);
		EntFire("entrance_trigger","AddOutput","OnStartTouch entrance_trigger_2_normal:enable::0:1",0.02);
		EntFire("entrance_trigger","AddOutput","OnStartTouch server:command:say *** Welcome to Genso ***:0:1",0.02);

		// EntFire("entrance_trigger","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetEventName(0):0.00:1",0.02);
		// EntFire("entrance_trigger","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(15):0.00:1",0.02);


		EntFire("entrance_trigger_2_normal","AddOutput","OnStartTouch server:command:say *** Two gates open in 30 seconds ***:0:1",0.02);
		EntFire("entrance_trigger_2_normal","AddOutput","OnStartTouch entrance2:open::30:1",0.02);
		EntFire("entrance_trigger_2_normal","AddOutput","OnStartTouch entrance3:open::30:1",0.02);
		EntFire("entrance_trigger_2_normal","AddOutput","OnStartTouch entrance_trigger_3:enable::0:1",0.02);
		EntFire("entrance_trigger_2_normal","AddOutput","OnStartTouch afk1:enable::30:1",0.02);

		// EntFire("entrance_trigger_2_normal","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetEventName(5):0.00:1",0.02);
		// EntFire("entrance_trigger_2_normal","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(30):0.00:1",0.02);


		EntFire("entrance_trigger_3","AddOutput","OnStartTouch temple_trigger_1:enable::0:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch temple_entrance_gate:open::25:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch server:command:say *** Entrance gate opens in 25 seconds ***:0:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch afk2:enable::40:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch temple_entrance_gate_2:close::38:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch temple_entrance_gate_2:open::28:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch temple_trigger_1:enable::0:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch temple_entrance_gate:close::36:1",0.02);

		// EntFire("entrance_trigger_3","AddOutput","OnStartTouch Map_Text:RunScriptCode:SetEventName(3):19.00:1",0.02,null);
		// EntFire("entrance_trigger_3","AddOutput","OnStartTouch Map_Text:RunScriptCode:SetAreaName(1):0.00:1",0.02,null);
		// EntFire("entrance_trigger_3","AddOutput","OnStartTouch Map_Text:RunScriptCode:SetAreaName(2):27.20:1",0.02,null);
		// EntFire("entrance_trigger_3","AddOutput","OnStartTouch Map_Text:RunScriptCode:SetTimer(25):0.00:1",0.02,null);


		EntFire("temple_trigger_1","AddOutput","OnStartTouch server:command:say *** The gate opens in 25 seconds ***:0:1",0.02);
		EntFire("temple_trigger_1","AddOutput","OnStartTouch Temple_Entrance_Door2:open::25:1",0.02);
		EntFire("temple_trigger_1","AddOutput","OnStartTouch temple_trigger_2_hard:enable::0:1",0.02);
		EntFire("temple_trigger_1","AddOutput","OnStartTouch music_scripts:RunScriptInput:PlayBGM(7):0:1",0.02);

		// EntFire("temple_trigger_1","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetEventName(0):0.00:1",0.02);
		// EntFire("temple_trigger_1","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(25):0.00:1",0.02);

		EntFire("temple_trigger_2_hard","AddOutput","OnStartTouch temple_trigger_3_hard:enable::0:1",0.02);
		EntFire("temple_trigger_2_hard","AddOutput","OnStartTouch temple_gate_1_1:open::10:1",0.02);
		EntFire("temple_trigger_2_hard","AddOutput","OnStartTouch server:command:say *** The gates open in 10 seconds ***:0:1",0.02);
		EntFire("temple_trigger_2_hard","AddOutput","OnStartTouch door_break:break::35:1",0.02);
		EntFire("temple_trigger_2_hard","AddOutput","OnStartTouch afk3:enable::12:1",0.02);
		EntFire("temple_trigger_2_hard","AddOutput","OnStartTouch Temple_Entrance_Door2:close::10:1",0.02);

		EntFire("temple_trigger_2_hard","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(20):15.00:1",0.02);



		EntFire("temple_trigger_3_hard","AddOutput","OnStartTouch temple_trigger_4:enable::0:1",0.02);
		EntFire("temple_trigger_3_hard","AddOutput","OnStartTouch temple_gate_2_1:open::20:1",0.02);
		EntFire("temple_trigger_3_hard","AddOutput","OnStartTouch server:command:say *** The gates open in 20 seconds ***:0:1",0.02);

		//EntFire("temple_trigger_3_hard","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(20):0.00:1",0.02);

        EntFire("temple_trigger_4","AddOutput","OnStartTouch afk4:KeyValue:target AFK_Teleport4_hard:4:1",0.02);
        EntFire("temple_trigger_4","AddOutput","OnStartTouch afk4:enable::5:1",0.02);
		EntFire("temple_trigger_4","AddOutput","OnStartTouch temple_gate_3:open::15:1",0.02);
		EntFire("temple_trigger_4","AddOutput","OnStartTouch temple_trigger_6:enable::0:1",0.02);
		EntFire("temple_trigger_4","AddOutput","OnStartTouch server:command:say *** The gate opens in 15 seconds ***:0:1",0.02);

		EntFire("temple_trigger_4","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(15):0.00:1",0.02);
		EntFire("temple_trigger_4","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(4):0.00:1",0.02);
		EntFire("temple_trigger_4","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(5):17.00:1",0.02);


		EntFire("temple_trigger_6","AddOutput","OnStartTouch Bottom_metal:break::18:1",0.02);
		EntFire("temple_trigger_6","AddOutput","OnStartTouch server:command:say *** The metal gate breaks in 5 seconds ***:13:1",0.02);
		EntFire("temple_trigger_6","AddOutput","OnStartTouch temple_trigger_7:enable::0:1",0.02);
		EntFire("temple_trigger_6","AddOutput","OnStartTouch temple_gate_6:open::10:1",0.02);
		EntFire("temple_trigger_6","AddOutput","OnStartTouch server:command:say *** The gate opens in 10 seconds ***:0:1",0.02);
		EntFire("temple_trigger_6","AddOutput","OnStartTouch temple_gate_3:close::23:1",0.02);
		EntFire("temple_trigger_6","AddOutput","OnStartTouch afk5:enable::25:1",0.02);
		EntFire("temple_trigger_6","AddOutput","OnStartTouch boss3_push:enable::0:1",0.02);
		EntFire("temple_trigger_6","AddOutput","OnStartTouch boss3_trigger:enable::0:1",0.02);
		EntFire("temple_trigger_6","AddOutput","OnStartTouch st3_boss_counter:enable::0:1", 0.02);
		EntFire("temple_trigger_6","AddOutput","OnStartTouch st3_boss_counter:add:250:0:1",0.03);
		EntFire("temple_trigger_6","AddOutput","OnStartTouch st3_boss_template:forcespawn::18:1",0.02);
		EntFire("temple_trigger_6","AddOutput","OnStartTouch st3_boss_hurt:enable::18:1",0.02);
		EntFire("temple_trigger_6","AddOutput","OnStartTouch st3_boss_toggle:toggle::18:1", 0.02);
		EntFire("temple_trigger_6","AddOutput","OnStartTouch st3_boss1_screen:Start::20:1",0.02);
		EntFire("temple_trigger_6","AddOutput","OnStartTouch music_scripts:RunScriptInput:PlayBGM(8):21:1",0.02);

		EntFire("temple_trigger_6","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(10):0.00:1",0.02);
		EntFire("temple_trigger_6","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(20):20.00:1",0.02);

		EntFire("temple_trigger_7","AddOutput","OnStartTouch afk6:KeyValue:target AFK_Teleport6:10:1",0.02);
		EntFire("temple_trigger_7","AddOutput","OnStartTouch afk5:enable::10:1",0.02);
		EntFire("temple_trigger_7","AddOutput","OnStartTouch door_tp_t:enable::35:1",0.02);
		EntFire("temple_trigger_7","AddOutput","OnStartTouch server:command:say *** The gate opens in 25 seconds ***:0:1",0.02);
		EntFire("temple_trigger_7","AddOutput","OnStartTouch temple_gate_7:open::25:1",0.02);
		EntFire("temple_trigger_7","AddOutput","OnStartTouch temple_trigger_8:enable::0:1",0.02);
		EntFire("temple_trigger_7","AddOutput","OnStartTouch afk9:enable::5:1",0.02);
		EntFire("temple_trigger_7","AddOutput","OnStartTouch afk6:KeyValue:target AFK_Teleport6:3:1",0.02);
		EntFire("temple_trigger_7","AddOutput","OnStartTouch afk6:enable::5:1",0.02);

		EntFire("temple_trigger_7","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(25):0.00:1",0.02);


		EntFire("temple_trigger_8","AddOutput","OnStartTouch temple_trigger_12_1:enable::0:1",0.02);
		EntFire("temple_trigger_8","AddOutput","OnStartTouch temple_gate_8:open::25:1",0.02);
		EntFire("temple_trigger_8","AddOutput","OnStartTouch server:command:say *** The gate opens in 25 seconds ***:0:1",0.02);
		EntFire("temple_trigger_8", "AddOutput", "OnStartTouch music_scripts:RunScriptInput:PlayBGM(9):25:1", 0.02);
	
		EntFire("temple_trigger_8","AddOutput","OnStartTouch stair_door:Break::35:1",0.02);

		// EntFire("temple_trigger_8","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(25):0.00:1",0.02);
		// EntFire("temple_trigger_8","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(21):0.00:1",0.02);
		// EntFire("temple_trigger_8","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(13):28.00:1",0.02);

		EntFire("temple_trigger_12_1","AddOutput","OnStartTouch st3_boss2_trigger:enable::0:1",0.02);
		EntFire("temple_trigger_12_1","AddOutput","OnStartTouch temple_gate_14_1:open::30:1",0.02);
		EntFire("temple_trigger_12_1","AddOutput","OnStartTouch server:command:say *** The gate opens in 30 seconds ***:0:1",0.02);
		EntFire("temple_trigger_12_1","AddOutput","OnStartTouch door_tp_t2:enable::5:1",0.02);
		EntFire("temple_trigger_12_1","AddOutput","OnStartTouch temple_gate_14_2:open::38:1",0.02);
		EntFire("temple_trigger_12_1","AddOutput","OnStartTouch st3_boss2_push:enable::0:1",0.02);
		EntFire("temple_trigger_12_1","AddOutput","OnStartTouch afk10:enable::20:1",0.02);
		EntFire("temple_trigger_12_1","AddOutput","OnStartTouch afk10:KeyValue:target AFK_Teleport7:19:1",0.02);
		EntFire("temple_trigger_12_1","AddOutput","OnStartTouch st3_boss2_model:enable::0:1",0.02);
		EntFire("temple_trigger_12_1","AddOutput","OnStartTouch subway_door:break::0:1",0.02);

		EntFire("temple_trigger_12_1","AddOutput","OnStartTouch Explosion_Temp1:KeyValue:origin 5048 10742 -71:0:1",0.02);
		EntFire("temple_trigger_12_1","AddOutput","OnStartTouch Explosion_Temp1:ForceSpawn::0.05:1",0.02);
		EntFire("temple_trigger_12_1","AddOutput","OnStartTouch Explosion_Temp1:KeyValue:origin 5048 12048 -305:0.1:1",0.02);
		EntFire("temple_trigger_12_1","AddOutput","OnStartTouch Explosion_Temp1:ForceSpawn::0.15:1",0.02);
		EntFire("temple_trigger_12_1","AddOutput","OnStartTouch st3_fire_particle_1:Start::0.1:1",0.02);
		EntFire("temple_trigger_12_1","AddOutput","OnStartTouch Explosion_Temp1:KeyValue:origin 4565 10525 -70:1:1",0.02);
		EntFire("temple_trigger_12_1","AddOutput","OnStartTouch Explosion_Temp1:ForceSpawn::1.05:1",0.02);
		EntFire("temple_trigger_12_1","AddOutput","OnStartTouch st3_fire_particle_2:Start::1.15:1",0.02);
		EntFire("temple_trigger_12_1","AddOutput","OnStartTouch Explosion_Temp1:KeyValue:origin 7255 10518 -70:38:1",0.02);
		EntFire("temple_trigger_12_1","AddOutput","OnStartTouch Explosion_Temp1:ForceSpawn::39.5:1",0.02);

		EntFire("temple_trigger_12_1","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(30):0.00:1",0.02);
		EntFire("temple_trigger_12_1","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(14):0.00:1",0.02);
		EntFire("temple_trigger_12_1","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(17):33.00:1",0.02);

		EntFire("underway_bomb1","AddOutput","OnStartTouch server:Command:say *** The boxes break soon ***:0:1",0.02);
		EntFire("underway_bomb1","AddOutput","OnStartTouch break_fire:Start::0:1",0.02);
		EntFire("underway_bomb1","AddOutput","OnStartTouch underway_bomb:Break::20:1",0.02);
		EntFire("underway_bomb1","AddOutput","OnStartTouch break_fire:kill::20:1",0.02);
		EntFire("underway_bomb1","AddOutput","OnStartTouch break_exp:explode::20:1",0.02);
		EntFire("underway_bomb1","AddOutput","OnStartTouch break_exp:kill::30:1",0.02);

		EntFire("temple_trigger_1","AddOutput","OnStartTouch afk3:enable::35:1",0.02);

		EntFire("temple_trigger_2_hard","AddOutput","OnStartTouch server:command:say *** The doors break in 20 seconds ***:15:1",0.02);

		EntFire("temple_trigger_9","AddOutput","OnStartTouch subway_door:break::5:1",0.02);

		EntFire("temple_trigger_8","AddOutput","OnStartTouch Explosion_Temp1:KeyValue:origin 5336 12288 -960:14:1",0.02);
		EntFire("temple_trigger_8","AddOutput","OnStartTouch Explosion_Temp1:ForceSpawn::15:1",0.02);

		EntFire("st3_boss2_breakable","AddOutput","OnBreak Explosion_Temp1:KeyValue:origin 8107 11696 -70:33:1",0.02);
		EntFire("st3_boss2_breakable","AddOutput","OnBreak Explosion_Temp1:ForceSpawn::33.5:1",0.02);
		EntFire("st3_boss2_breakable","AddOutput","OnBreak Explosion_Temp1:KeyValue:origin 8108 12344 -70:34:1",0.02);
		EntFire("st3_boss2_breakable","AddOutput","OnBreak Explosion_Temp1:ForceSpawn::34.5:1",0.02);

		EntFire("underway_bomb1","AddOutput","OnStartTouch break_fire:kill::20:1",0.02);
		EntFire("temple_trigger_7","AddOutput","OnStartTouch door_tp_t_particle:start::35:1",0.02);
		EntFire("temple_trigger_12_1","AddOutput","OnStartTouch door_tp_t2_particle:start::5:1",0.02);
}

function AddTrigger5() {
	// Stage 5 (st4 terminal)
		EntFire("entrance_trigger","AddOutput","OnStartTouch entrance:open::25:1",0.02);
		EntFire("entrance_trigger","AddOutput","OnStartTouch server:command:say *** Welcome to Genso ***:0:1",0.02);
		EntFire("entrance_trigger","AddOutput","OnStartTouch st4_entrance_trigger:enable::0:1",0.02);
		EntFire("entrance_trigger", "AddOutput", "OnStartTouch meteor_scripts:RunScriptInput:StartMeteorTick:0:1", 0.02);
		EntFire("entrance_trigger","AddOutput","OnStartTouch music_scripts:RunScriptInput:PlayBGM(10) :10:1",0.02);
		// EntFire("entrance_trigger","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetEventName(0):0.00:1",0.02);
		// EntFire("entrance_trigger","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(25):0.00:1",0.02);
		EntFire("entrance_trigger","AddOutput","OnStartTouch explosion_trigger:enable::0:1",0.02);


        EntFire("entrance_trigger","AddOutput","OnStartTouch Explosion_Temp1:KeyValue:origin 16 -11056 -272:24:1",0.02);
        EntFire("entrance_trigger","AddOutput","OnStartTouch Explosion_Temp1:ForceSpawn::25:1",0.02);
		EntFire("entrance_trigger","AddOutput","OnStartTouch Explosion_Temp1:KeyValue:origin -184 -10127 -303:26:1",0.02);
        EntFire("entrance_trigger","AddOutput","OnStartTouch Explosion_Temp1:ForceSpawn::27:1",0.02);
		EntFire("entrance_trigger","AddOutput","OnStartTouch Explosion_Temp1:KeyValue:origin 186 -8569 -303:28:1",0.02);
        EntFire("entrance_trigger","AddOutput","OnStartTouch Explosion_Temp1:ForceSpawn::29:1",0.02);

		EntFire("st4_entrance_trigger","AddOutput","OnStartTouch st4_push_opening_temp:ForceSpawn::0:1",0.02);
		EntFire("st4_entrance_trigger","AddOutput","OnStartTouch entrance_trigger_2_hard:enable::0:1",0.02);


		EntFire("entrance_trigger_2_hard","AddOutput","OnStartTouch server:command:say *** Two gates open in 35 seconds ***:0:1",0.02);
		EntFire("entrance_trigger_2_hard","AddOutput","OnStartTouch entrance2:open::35:1",0.02);
		EntFire("entrance_trigger_2_hard","AddOutput","OnStartTouch entrance3:open::35:1",0.02);
		EntFire("entrance_trigger_2_hard","AddOutput","OnStartTouch entrance_trigger_3:enable::0:1",0.02);
		EntFire("entrance_trigger_2_hard","AddOutput","OnStartTouch afk1:enable::35:1",0.02);

		// EntFire("entrance_trigger_2_hard","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetEventName(5):0.00:1",0.02);
		// EntFire("entrance_trigger_2_hard","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(35):0.00:1",0.02);


		EntFire("entrance_trigger_3","AddOutput","OnStartTouch temple_trigger_1:enable::0:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch temple_entrance_gate:open::30:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch server:command:say *** Entrance gate opens in 30 seconds ***:0:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch afk2:enable::45:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch temple_entrance_gate_2:close::43:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch temple_entrance_gate_2:open::33:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch temple_trigger_1:enable::0:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch temple_entrance_gate:close::41:1",0.02);
		EntFire("entrance_trigger_3","AddOutput","OnStartTouch meteor_scripts:RunScriptInput:StopMeteorTick:25:1",0.02);

		// EntFire("entrance_trigger_3","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetEventName(3):0.00:1",0.02);
		// EntFire("entrance_trigger_3","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(1):0.00:1",0.02);
		// EntFire("entrance_trigger_3","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(2):32.90:1",0.02);
		// EntFire("entrance_trigger_3","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(30) :0.00:1",0.02);


		EntFire("temple_trigger_1","AddOutput","OnStartTouch server:command:say *** The gate opens in 30 seconds ***:0:1",0.02);
		EntFire("temple_trigger_1","AddOutput","OnStartTouch Temple_Entrance_Door2:open::30:1",0.02);
		EntFire("temple_trigger_1","AddOutput","OnStartTouch temple_trigger_2:enable::0:1",0.02);
		EntFire("temple_trigger_1","AddOutput","OnStartTouch music_scripts:RunScriptInput:PlayBGM(11):0:1",0.02);
		//EntFire("temple_trigger_1","AddOutput","OnStartTouch meteor_scripts:RunScriptInput:ToggleMeteor():0:1",0.02);

		// EntFire("temple_trigger_1","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetEventName(0):0.00:1",0.02);
		// EntFire("temple_trigger_1","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(30):0.00:1",0.02);


		EntFire("temple_trigger_2","AddOutput","OnStartTouch temple_trigger_3_hard:enable::0:1",0.02);
		EntFire("temple_trigger_2","AddOutput","OnStartTouch server:command:say *** The gates open in 20 seconds ***:3:1",0.02);
		EntFire("temple_trigger_2","AddOutput","OnStartTouch door_break:break::23:1",0.02);
		EntFire("temple_trigger_2","AddOutput","OnStartTouch temple_fence1:break::0:1",0.02);
		EntFire("temple_trigger_2","AddOutput","OnStartTouch temple_gate_1:open::23:1",0.02);
		EntFire("temple_trigger_2","AddOutput","OnStartTouch temple_gate_1_1:open::0:1",0.02);
		EntFire("temple_trigger_2","AddOutput","OnStartTouch afk3:enable::6.5:1",0.02);
		EntFire("temple_trigger_2","AddOutput","OnStartTouch Temple_Entrance_Door2:close::5:1",0.02);

		EntFire("temple_trigger_2","AddOutput","OnStartTouch Explosion_Temp:KeyValue:origin -727.968750 4047.468506 -23.906189:0.00:1",0.02);
		EntFire("temple_trigger_2","AddOutput","OnStartTouch Explosion_Temp:ForceSpawn::0.01:1",0.02);
		EntFire("temple_trigger_2","AddOutput","OnStartTouch Explosion_Temp1:KeyValue:origin 759.968750 3878.449707 -28.037308:0.00:1",0.02);
		EntFire("temple_trigger_2","AddOutput","OnStartTouch Explosion_Temp1:ForceSpawn::0.01:1",0.02);

		// EntFire("temple_trigger_2","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(20):3.00:1",0.02);


		EntFire("temple_trigger_3_hard","AddOutput","OnStartTouch temple_trigger_4:enable::0:1",0.02);
		EntFire("temple_trigger_3_hard","AddOutput","OnStartTouch temple_gate_2_1:open::10:1",0.02);
		EntFire("temple_trigger_3_hard","AddOutput","OnStartTouch temple_gate_2:open::20:1",0.02);
		EntFire("temple_trigger_3","AddOutput","OnStartTouch temple_gate_1:close::28:1",0.02);
		EntFire("temple_trigger_3_hard","AddOutput","OnStartTouch server:command:say *** The side-gates open in 10 seconds ***:0:1",0.02);
		EntFire("temple_trigger_3_hard","AddOutput","OnStartTouch server:command:say *** The middle-gate opens in 15 seconds ***:5:1",0.02);

		EntFire("temple_trigger_3_hard","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(10):0.00:1",0.02);
		EntFire("temple_trigger_3_hard","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(5):15.00:1",0.02);

        EntFire("temple_trigger_4","AddOutput","OnStartTouch temple_gate_2:close::5:1",0.02);
        EntFire("temple_trigger_4","AddOutput","OnStartTouch afk4:KeyValue:target AFK_Teleport4_hard:0:1",0.02);
		EntFire("temple_trigger_4","AddOutput","OnStartTouch afk4:enable::5:1",0.02);
		EntFire("temple_trigger_4","AddOutput","OnStartTouch afk5:enable::38:1",0.02);
		EntFire("temple_trigger_4","AddOutput","OnStartTouch underway_vent2:Open::5:1",0.02);
		EntFire("temple_trigger_4","AddOutput","OnStartTouch underway_vent3:Open::0:1",0.02);
		EntFire("temple_trigger_4","AddOutput","OnStartTouch temple_gate_3:open::20:1",0.02);
		EntFire("temple_trigger_4","AddOutput","OnStartTouch temple_trigger_5:enable::0:1",0.02);
		EntFire("temple_trigger_4","AddOutput","OnStartTouch temple_gate_3:close::38:1",0.02);
		EntFire("temple_trigger_4","AddOutput","OnStartTouch server:command:say *** The gate opens in 20 seconds ***:0:1",0.02);

		EntFire("temple_trigger_4","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(20):0.00:1",0.02);
		EntFire("temple_trigger_4","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(4):0.00:1",0.02);
		EntFire("temple_trigger_4","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(5):21.00:1",0.02);


		EntFire("temple_trigger_5","AddOutput","OnStartTouch temple_gate_4:open::25:1",0.02);
		EntFire("temple_trigger_5","AddOutput","OnStartTouch server:command:say *** The gate opens in 25 seconds ***:0:1",0.02);
		EntFire("temple_trigger_5","AddOutput","OnStartTouch st1_boss_appear:FireUser1::30:1",0.02);
		EntFire("temple_trigger_5","AddOutput","OnStartTouch st4_def_bar:Close::33:1", 0.02);
		EntFire("temple_trigger_5","AddOutput","OnStartTouch st4_boss_start_relay:FireUser1::33:1",0.02);
		EntFire("temple_trigger_5","AddOutput","OnStartTouch Explosion_Temp:KeyValue:origin 2016 9016 57:34:1",0.02);
		EntFire("temple_trigger_5","AddOutput","OnStartTouch Explosion_Temp:ForceSpawn::34:1",0.02);

		// EntFire("temple_trigger_5","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetTimer(25):0.00:1",0.02);
		// EntFire("temple_trigger_5","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(6):24.00:1",0.02);
		// EntFire("temple_trigger_5","AddOutput","OnStartTouch Map_Text:RunScriptInput:SetAreaName(8):27.00:1",0.02);



		EntFire("st4_boss2_start","AddOutput","OnUser1 boss1_gate:Open::0:1",0.02);
		EntFire("st4_boss2_start","AddOutput","OnUser1 st4_boss2_opening_part:Start::0:1",0.02);
		EntFire("st4_boss2_start","AddOutput","OnUser1 Boss1_toggle:Kill::0:1",0.02);
		EntFire("st4_boss2_start","AddOutput","OnUser1 st4_def_bar:Open::0:1",0.02);
		EntFire("st4_boss2_start","AddOutput","OnUser1 boss12_gate:Toggle::0:1",0.02);
		EntFire("st4_boss2_start","AddOutput","OnUser1 temple_gate_4:Open::0.1:1",0.02);
		//EntFire("st4_boss2_start","AddOutput","OnUser1 temple_gate_4:AddOutput:origin 2016 9016 57:0:1",0.02);
		EntFire("st4_boss2_start","AddOutput","OnUser1 music_scripts:RunScriptInput:PlayBGM(12) :0:1",0.02);


		EntFire("st4_boss2_start","AddOutput","OnUser1 boss1_gate:Close::35:1",0.02);
		EntFire("st4_boss2_start","AddOutput","OnUser1 boss12_gate:Toggle::35:1",0.02);
		EntFire("st4_boss2_start","AddOutput","OnUser1 aessidhe_wallpart:Start::35:1",0.02);
		EntFire("st4_boss2_start","AddOutput","OnUser1 st4_boss2_cagetemp:ForceSpawn::35:1",0.02);

		// EntFire("st4_boss2_start","AddOutput","OnUser1 Map_Text:RunScriptInput:SetTimer(35):0.00:1",0.02);
		// EntFire("st4_boss2_start","AddOutput","OnUser1 Map_Text:RunScriptInput:SetCompleteName(2):20.00:1",0.02);
		// EntFire("st4_boss2_start","AddOutput","OnUser1 Map_Text:RunScriptInput:SetCompleteName(0):50.00:1",0.02);

		EntFire("st4_boss2_start","AddOutput","OnUser1 afk6:KeyValue:target AFK_Teleport_st4_1:35:1",0.02);
		EntFire("st4_boss2_start","AddOutput","OnUser1 afk8:KeyValue:target AFK_Teleport_st4_1:35:1",0.02);
		EntFire("st4_boss2_start","AddOutput","OnUser1 afk_st4_boss1:Enable::37:1",0.02);
		EntFire("st4_boss2_start","AddOutput","OnUser1 afk6:Enable::37:1",0.02);
		EntFire("st4_boss2_start","AddOutput","OnUser1 afk8:Enable::37:1",0.02);
		EntFire("st4_boss2_start","AddOutput","OnUser1 temple_gate_4:Close::37:1",0.02);

		EntFire("st4_boss2_start","AddOutput","OnUser1 st_4_boss2_spawn_animation_relay:FireUser1::35:1",0.02);
		EntFire("st4_boss2_start","AddOutput","OnUser1 st4_boss2_script:RunScriptInput:Start:45:1",0.02);
		EntFire("st4_boss2_start","AddOutput","OnUser1 st4_boss2_script:RunScriptInput:AddHealth:45:1",0.02);
		EntFire("st4_boss2_start","AddOutput","OnUser1 st4_boss2_nadetrigger:Enable::45:1",0.02);
		EntFire("st4_boss2_start","AddOutput","OnUser1 st4_boss2_physbreak:SetDamageFilter:filter_ct:44.9:1",0.02);
		EntFire("st4_boss2_start","AddOutput","OnUser1 st4_boss2_idlepart*:Start::45:1",0.02);

		EntFire("st4_boss2_start","AddOutput","OnUser1 st4_boss2_opening_part2:Kill::46:1",0.02);
		EntFire("st4_boss2_start","AddOutput","OnUser1 st4_boss2_opening_part:Kill::46:1",0.02);

		//lastpart
		EntFire("st4_end_relay", "AddOutput", "OnUser1 music_scripts:RunScriptInput:PlayBGM(13) :0:1", 0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 waterfall_pending:Stop::0:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 afk_st4_boss1:Disable::0:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 afk6:Disable::0:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 afk8:Disable::0:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 boss12_gate:Toggle::0:1", 0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 st4_boss_cage:Break::0:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 aessidhe_wallpart:Kill::0:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 st4_boss2_cage:Break::15:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 boss1_gate:open::25:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 afk_st4_boss2:Enable::25:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 st4_boss_gatetp:Start::25:1",0.02);
		// EntFire("st4_end_relay","AddOutput","OnUser1 Map_Text:RunScriptInput:SetTimer(15):0.01:1",0.02);
		// EntFire("st4_end_relay","AddOutput","OnUser1 Map_Text:RunScriptInput:SetEventName(6):0.01:1",0.02);
		// EntFire("st4_end_relay","AddOutput","OnUser1 Map_Text:RunScriptInput:SetTimer(10):20.00:1",0.02);
		// EntFire("st4_end_relay","AddOutput","OnUser1 Map_Text:RunScriptInput:SetEventName(0):19.98:1",0.02);
		// EntFire("st4_end_relay","AddOutput","OnUser1 Map_Text:RunScriptInput:SetAreaName(19):20.00:1",0.02);
		// EntFire("st4_end_relay","AddOutput","OnUser1 Map_Text:RunScriptInput:SetAreaName(8):30.00:1",0.02);

		EntFire("st4_end_relay","AddOutput","OnUser1 temple_gate_4:open::37:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 st4_def_bar:Close::29:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 temple_gate_9_2:open::37:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 temple_gate_10:open::60:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 Explosion_Temp1:KeyValue:origin 3213 7297 -70:56:1",0.02);
        EntFire("st4_end_relay","AddOutput","OnUser1 Explosion_Temp1:ForceSpawn::62:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 st4_fire_particle_1:start::62:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 st4_waterfall_particle_1:start::60:1",0.02);
		// EntFire("st4_end_relay","AddOutput","OnUser1 Map_Text:RunScriptInput:SetTimer(20):40.00:1",0.02);
		// EntFire("st4_end_relay","AddOutput","OnUser1 Map_Text:RunScriptInput:SetAreaName(9):40.00:1",0.02);
		// EntFire("st4_end_relay","AddOutput","OnUser1 Map_Text:RunScriptInput:SetAreaName(12):60.00:1",0.02);

		EntFire("st4_end_relay","AddOutput","OnUser1 metal:break::67:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 Explosion_Temp:KeyValue:origin 2684 7343.5 -65.6546:65:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 Explosion_Temp:ForceSpawn::67.01:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 Explosion_Temp1:KeyValue:origin 3320 7342.5 -63:65:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 Explosion_Temp1:ForceSpawn::67.01:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 temple_gate_10:Close::73:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 st4_boss_gatetp:Kill::73:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 afk_st4_boss3:Enable::75:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 afk_st4_boss1:KeyValue:target AFK_Teleport_st4_3:74:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 afk_st4_boss1:Enable::75:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 afk8:KeyValue:target AFK_Teleport_st4_3:74:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 afk8:Enable::75:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 afk12:KeyValue:target AFK_Teleport_st4_3:74:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 afk12:Enable::75:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 afk6:KeyValue:target AFK_Teleport_st4_3:74:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 afk6:Enable::75:1",0.02);

		EntFire("st4_end_relay","AddOutput","OnUser1 Map_Text:RunScriptInput:SetTimer(35):75.00:1",0.02);

		EntFire("st4_end_relay","AddOutput","OnUser1 temple_gate_11*:Open::98:1",0.02);

		EntFire("st4_end_relay","AddOutput","OnUser1 temple_gate_12:open::110:1",0.02);

		EntFire("st4_end_relay","AddOutput","OnUser1 Explosion_Temp1:KeyValue:origin 3000 4496 -70:109:1",0.02);
        EntFire("st4_end_relay","AddOutput","OnUser1 Explosion_Temp1:ForceSpawn::110:1",0.02);

		EntFire("st4_end_relay", "AddOutput", "OnUser1 out:open::115:1", 0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 out1:open::115:1",0.02);

		EntFire("st4_end_relay","AddOutput","OnUser1 explosion_trigger_1:enable::0:1",0.02);
		EntFire("st4_end_relay", "AddOutput", "OnUser1 out_2:open::115:1", 0.02);
		EntFire("st4_end_relay", "AddOutput", "OnUser1 out_21:open::115:1", 0.02);
	
		EntFire("st4_end_relay","AddOutput","OnUser1 out_3:open::117:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 out_31:open::117:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 out_4:open::119:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 st4_boss4_template:ForceSpawn::120:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 st4_boss4_script:RunScriptInput:StartTick:120.1:1",0.02);

		EntFire("st4_end_relay","AddOutput","OnUser1 temple_gate_12:Close::125:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 afk_st4_boss4:Enable::125:1",0.02);

		// EntFire("st4_end_relay","AddOutput","OnUser1 Map_Text:RunScriptInput:SetTimer(30):147.00:1",0.02);
		// EntFire("st4_end_relay","AddOutput","OnUser1 Map_Text:RunScriptInput:SetEventName(7):146.90:1",0.02);
		// EntFire("st4_end_relay","AddOutput","OnUser1 Map_Text:RunScriptInput:SetCompleteName(5):146.90:1",0.02);

		EntFire("st4_end_relay","AddOutput","OnUser1 st4_boss3_script:RunScriptInput:StartLaser:177:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 st4_boss3_template:ForceSpawn::175:1",0.02);
		//EntFire("st4_end_relay","AddOutput","OnUser1 server:Command:say *** ZM-Items are restricted!!! ***:175:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 filter_script:RunScriptInput:DisableZombieItems:175:1",0.02);
		
		EntFire("st4_end_relay","AddOutput","OnUser1 bridge_*:EnableMotion::202:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 Explosion_Temp2:KeyValue:origin 8303 2548 -397.972::201.7:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 Explosion_Temp2:ForceSpawn::202:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 bridge_physexp:Explode::202.03:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 Explosion_Temp_Water:KeyValue:origin 8319 2544 -940::201.7:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 Explosion_Temp_Water:ForceSpawn::203:1",0.02);
		EntFire("st4_end_relay","AddOutput","OnUser1 st4_bridge:Kill::202:1",0.02);

		//EntFire("Boss1_toggle","Toggle","",10.00);
		EntFire("st4_end_relay","AddOutput","OnUser1 wincheck_script:RunScriptInput:st4_wincheck:205:1",0.02);



		EntFire("underway_bomb1","AddOutput","OnStartTouch server:Command:say *** The boxes break soon ***:0:1",0.02);
		EntFire("underway_bomb1","AddOutput","OnStartTouch break_fire:Start::0:1",0.02);
		EntFire("underway_bomb1","AddOutput","OnStartTouch underway_bomb:Break::25:1",0.02);
		EntFire("underway_bomb1","AddOutput","OnStartTouch break_fire:kill::25:1",0.02);
		EntFire("underway_bomb1","AddOutput","OnStartTouch break_exp:explode::25:1",0.02);
		EntFire("underway_bomb1","AddOutput","OnStartTouch break_exp:kill::35:1",0.02);
		EntFire("underway_bomb1","AddOutput","OnStartTouch break_fire:kill::25:1",0.02);

		EntFire("temple_trigger_4","AddOutput","OnStartTouch afk4_1:enable::3:1",0.02);
		EntFire("temple_trigger_4","AddOutput","OnStartTouch temple_gate_2_1:close::36:1",0.02);

		EntFire("st4_end_relay","AddOutput","OnUser1 st4_lastpart_part1:start::25:1",0.02);
}

function AddTrigger6() {
	// Stage 6 (st5 final stage)

}

// ============================================================================
// TRIGGER MANAGER INITIALIZATION
// ============================================================================

// Register OnScriptInput handlers for stage-specific setup
Instance.OnScriptInput("AddTrigger1", () => { AddTrigger1(); });
Instance.OnScriptInput("AddTrigger2", () => { AddTrigger2(); });
Instance.OnScriptInput("AddTrigger3", () => { AddTrigger3(); });
Instance.OnScriptInput("AddTrigger4", () => { AddTrigger4(); });
Instance.OnScriptInput("AddTrigger5", () => { AddTrigger5(); });
Instance.OnScriptInput("AddTrigger6", () => { AddTrigger6(); });

// Log initialization
Instance.Msg("[TriggerManager] Initialized - Ready to handle stage-specific triggers\n");
