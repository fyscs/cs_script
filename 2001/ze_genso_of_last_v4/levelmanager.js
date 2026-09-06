import { Instance } from "cs_script/point_script";


// --- Logging / instrumentation helpers ---
function _logCall(name) {
	try {
		Instance.Msg("[LOG] function called: " + name);
		Instance.ServerCommand("echo [LOG] function called: " + name);
	} catch (e) {
		// ignore logging failures
	}
}

function _instrumentFunction(fnName) {
	try {
		const orig = eval(fnName);
		if (typeof orig !== 'function') return;
		eval(fnName + ' = function(...args) { _logCall("' + fnName + '"); return orig.apply(this, args); }');
	} catch (e) {
		// eval may fail in some environments; ignore
	}
}

// Wrap Instance.OnScriptInput to log incoming inputs (caller/activator names)
try {
	const _origOnScriptInput = Instance.OnScriptInput.bind(Instance);
	Instance.OnScriptInput = (name, callback) => {
		_origOnScriptInput(name, (inputData) => {
			try {
				const callerName = inputData && inputData.caller && inputData.caller.GetEntityName ? inputData.caller.GetEntityName() : (inputData && inputData.caller ? String(inputData.caller) : 'none');
				const activatorName = inputData && inputData.activator && inputData.activator.GetEntityName ? inputData.activator.GetEntityName() : (inputData && inputData.activator ? String(inputData.activator) : 'none');
				Instance.Msg("[LOG] OnScriptInput received: " + name + " caller=" + callerName + " activator=" + activatorName);
				Instance.ServerCommand("echo [LOG] OnScriptInput: " + name + " caller=" + callerName + " activator=" + activatorName);
			} catch (e) {
				// ignore
			}
			try {
				callback(inputData);
			} catch (e) {
				try { Instance.Msg("[LOG] OnScriptInput callback error: " + e); } catch (e2) {}
			}
		});
	};
} catch (e) {
	// ignore
}

// Direct implementation of EntFire helpers (moved from supportfunctions.js for debugging)
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

// Attempt to locate the current point_script entity (the script runner). If the map
// has multiple point_script entities this will return the first matching class.
const SELF = Instance.FindEntityByName("Manager");
const ZONECHECK_SCRIPT_NAME = "zonecheck_script";

let stage = 2; //1 = warmup, 2 = stage1, 3 = stage2, 4 = stage3, 5 = stage4, 6 = stage5, 7 = ZM mode

function notifyZoneStage() {
	// st1 corresponds to stage==2 => index = stage-1 (minimum 1)
	const idx = Math.max(1, stage - 1);
	try {
		const target = Instance.FindEntityByName(ZONECHECK_SCRIPT_NAME);
		if (target) {
			Instance.EntFireAtTarget(target, "RunScriptInput", `SetZoneStage(${idx})`, 0.00);
		}
	} catch (e) {
		// ignore
	}
}

Instance.OnScriptInput("start_map", () => {
    StartMap();
});

// Simplify Simplify IteOnScriptInputner OnScriby using a single handler with parametersth parameters
Instance.OnScriptInput("ItemSpawner", (inputData) => {
    const itemId = parseInt(inputData.parameter, 10); // Convert parameter to integer
    if (!isNaN(itemId)) {
        ItemSpawner(itemId);
    } else {
        Instance.Msg("[DEBUG] Invalid parameter for ItemSpawner.");
    }
});

function StartMap() {
	// Debug log to confirm this function is called
	Instance.Msg("=== StartMap() called ===");
	Instance.ServerCommand("echo === StartMap() CALLED FROM JAVASCRIPT ===");
	
	EntFire("server", "Command", "say *** ze_genso_of_last_v4 ***", 3.00);
	EntFire("server", "Command", "say *** Map by Pohmian/Mochi and Azure***", 4.00);
	EntFire("server", "Command", "say *** Special Thanks to...... ***", 5.00);
	EntFire("server", "Command", "say *** SHUFEN, kawagoe, Raio, uru ***", 6.00);
	EntFire("server", "Command", "say *** POSSESSION-SERVER, ZEDDY-GAMING and All Testing Players ***", 7.00);

	EntFire("filter_script", "RunScriptInput", "EnableZombieItems", 7.00);

	if (SELF) {
		EntFireAtTarget(SELF, "RunScriptInput", "ShowInfo()", 5.00);
		EntFireAtTarget(SELF, "RunScriptInput", "HealthBuff", 5.00);
	}

	EntFire("start_fire", "StartFire", "", 15.00);
	EntFire("waterfall_ground_small_particle", "Start", "", 5.00);
	EntFire("waterfall_ground_particle", "Start", "", 5.00);

	EntFire("map_fog", "TurnOff", "", 0.00);
	EntFire("map_fog_temple", "TurnOn", "", 0.00);

	if (stage == 1) {
		EntFire("CC_Genso", "Enable", "", 0.00);
		EntFire("CC_Genso_evening", "Disable", "", 0.00);
		EntFire("CC_Genso_night", "Disable", "", 0.00);
		
		EntFire("sky_cd", "Disable", "", 0.00);
		EntFire("sky_dark", "Disable", "", 0.00);
		EntFire("light_daytime", "SetLightBrightness", "3.1", 0.00);
		// EntFire("Map_text", "RunScriptInput", " StartTextHud()", 0.02);
		// EntFire("Map_text", "RunScriptInput", " SetCompleteName(4)", 40);
        EntFire("Map_fog*", "Kill", "", 0);//temp fog kill

		// Schedule a SetStage call on the script entity if present
		if (SELF) EntFireAtTarget(SELF, "RunScriptInput", "SetStage2", 48.00);

		EntFire("server", "Command", "say *** Moving to NORMAL mode ***", 48.00);
		EntFire("server", "Command", "mp_restartgame 1", 50.00);
		EntFire("music_scripts", "RunScriptInput", "PlayBGM(0)", 3.02);

		EntFire("st1_wintrig_temp", "ForceSpawn", "", 10.00);

		EntFire("tonemap_global", "SetAutoExposureMin", "1.5", 0.00);
		EntFire("tonemap_global", "SetAutoExposureMax", "1.5", 0.00);
		EntFire("tonemap_global", "SetBloomScale", "1.2", 0.00);

		EntFire("map_fog", "TurnOn", "", 0.02);
		EntFire("skycamera", "ActivateSkybox", "", 0.02);
		EntFire("light_brush", "Enable", "", 0.02);
		EntFire("skycamera", "KeyValue", "fogcolor 128 158 158", 0.03);

		//skybox
		EntFire("daytime", "Enable", "", 0.00);
		EntFire("evening", "Disable", "", 0.00);
		EntFire("night", "Disable", "", 0.00);
		//post processing
		EntFire("post_processing_daytime", "Enable", "", 0.00);
		EntFire("post_processing_evening", "Disable", "", 0.00);
		EntFire("post_processing_night", "Disable", "", 0.00);
	}
	else if (stage == 2) {
		EntFire("trigger_manager","RunScriptInput","AddTrigger2",0.00);
		EntFire("CC_Genso","Enable","",0.00);
		EntFire("CC_Genso_evening","Disable","",0.00);
		EntFire("CC_Genso_night","Disable","",0.00);
		EntFire("sky_cd","Disable","",0.00);
		EntFire("sky_dark","Disable","",0.00);
		EntFire("light_daytime","SetLightBrightness","3.1",0.00);
		EntFire("entrance_trigger","Enable","",0.00);
		// EntFire("Map_text","RunScriptInput","SetStageName(2)",0.10);
		EntFire("server","Command","say [Normal Mode]",9.00);
		// EntFire("Map_text","RunScriptInput","StartTextHud()",0.12);
		// EntFire("Map_text","RunScriptInput","SetTimer(-10)",0.02);
		// EntFire("Map_text","AddOutput","color 22 252 43",0.02);
		EntFire("Reset_ZMspeed_1_temp","ForceSpawn","",0.02);
		EntFire("st4_boss_start_relay","Kill","",0.02);
		//EntFire("Break_rock","Kill","",0.02);
		EntFire("st5_rock","Kill","",0.02);
		EntFire("st4_boss2_model","Alpha","0",0.02);
		EntFire("st4_def_bar","Open","",0.02);

		EntFire("music_scripts","RunScriptInput","PlayBGM(0) ",3.02);
		EntFire("st1_boss_holy_template","KeyValue","origin 3008 9024 -70",10.00);
		EntFire("st1_wintrig_temp","ForceSpawn","",10.00);
		EntFire("skybox_noon","Trigger","",0.1);
		EntFire("boss1_path_2","AddOutput","OnPass st1_boss_start_relay:FireUser1::0:1",0.02);

		EntFire("tonemap_global","SetAutoExposureMin","1.5",0.00);
		EntFire("tonemap_global","SetAutoExposureMax","1.5",0.00);
		EntFire("tonemap_global","SetBloomScale","1.2",0.00);

		EntFire("map_fog","TurnOn","",0.02);
		EntFire("skycamera","ActivateSkybox","",0.02);
		EntFire("light_brush","Enable","",0.02);
		EntFire("skycamera","KeyValue","fogcolor 128 158 158",0.03);
		
		EntFire("item_script", "RunScriptInput", "ItemSpawner1", 0.00);
		//skybox
		EntFire("daytime", "Enable", "", 0.00);
		EntFire("evening", "Disable", "", 0.00);
		EntFire("night", "Disable", "", 0.00);
		//post processing
		EntFire("post_processing_daytime", "Enable", "", 0.00);
		EntFire("post_processing_evening", "Disable", "", 0.00);
		EntFire("post_processing_night", "Disable", "", 0.00);

		EntFire("temple_fence1", "Break", "", 1.00);
	}
	else if (stage == 3) {
		//if (SELF) EntFireAtTarget(SELF, "RunScriptInput", "add_trigger", 1.00);
		EntFire("trigger_manager","RunScriptInput","AddTrigger3",0.00);
		EntFire("CC_Genso","Enable","",0.00);
		EntFire("CC_Genso_evening","Disable","",0.00);
		EntFire("CC_Genso_night","Disable","",0.00);
		EntFire("sky_cd","Disable","",0.00);
		EntFire("sky_dark","Disable","",0.00);
		EntFire("light_daytime","SetLightBrightness","3.1",0.00);
		EntFire("entrance_trigger","Enable","",0.00);
		EntFire("lv2music","PlaySound","",3.00);
		// EntFire("Map_text","RunScriptInput","SetStageName(3)",0.10);
		EntFire("server","Command","say [Hard Mode]",9.00);
		EntFire("Reset_ZMspeed_2_temp","ForceSpawn","",0.02);
		EntFire("st5_rock","Kill","",0.02);

		// EntFire("Map_text","KeyValue","color 30 83 255",0.02);
		// EntFire("Map_text","RunScriptInput","StartTextHud()",0.12);
		// EntFire("Map_text","RunScriptInput","SetTimer(-10)",0.02);
		EntFire("Boss1_toggle","Toggle","",10.00);
		EntFire("music_scripts","RunScriptInput","PlayBGM(3) ",3.02);
		EntFire("st4_def_bar","Open","",0.02);

		EntFire("st2_wintrig_temp","ForceSpawn","",10.00);
		EntFire("skybox_noon","Trigger","",0.1);

		EntFire("tonemap_global","SetAutoExposureMin","1.5",0.00);
		EntFire("tonemap_global","SetAutoExposureMax","1.5",0.00);
		EntFire("tonemap_global","SetBloomScale","1.2",0.00);
		EntFire("item_script","RunScriptInput","ItemSpawner2",0.00);

		EntFire("st4_def_bar1","Open","",1.02);

		EntFire("skycamera", "KeyValue", "fogcolor 128 158 158", 0.03);
		
		EntFire("map_fog", "TurnOn", "", 0.02);
		EntFire("map_fog_temple","TurnOn","",0.02);

		EntFire("skycamera","ActivateSkybox","",0.02);
		EntFire("light_brush", "Enable", "", 0.02);
		//skybox
		EntFire("daytime", "Enable", "", 0.00);
		EntFire("evening", "Disable", "", 0.00);
		EntFire("night", "Disable", "", 0.00);
		//post processing
		EntFire("post_processing_daytime", "Enable", "", 0.00);
		EntFire("post_processing_evening", "Disable", "", 0.00);
		EntFire("post_processing_night", "Disable", "", 0.00);
		//waterfall

		EntFire("temple_fence1", "Break", "", 1.00);
	}
	else if (stage == 4) {
		EntFire("trigger_manager", "RunScriptInput", "AddTrigger4", 0.00);
		//colorcorrection
		EntFire("CC_Genso","Disable","",0.00);
		EntFire("CC_Genso_evening","Enable","",0.00);
		EntFire("CC_Genso_night", "Disable", "", 0.00);
		
		EntFire("sky_cd","Disable","",0.00);
		EntFire("sky_dark","Disable","",0.00);
		EntFire("light_daytime","SetLightBrightness","0",0.00);
		EntFire("cloud","Enable","",0.00);
		EntFire("underway","Break","",0.00);
		EntFire("underway_bomb1","Enable","",0.00);
		EntFire("break_box2","Break","",0.00);
		
		EntFire("3D_Sky_Brush","Enable","",0.00);
		EntFire("entrance_trigger","Enable","",0.00);
		// EntFire("Map_text","RunScriptInput","SetStageName(4)",0.10);
		EntFire("server","Command","say [Soul-Mode]",9.00);
		EntFire("entrance_toggle","Toggle","",0.02);
		EntFire("entrance_prop","kill","",0.02);
		EntFire("Boss1_toggle","Toggle","",10.00);
		EntFire("Map_text","AddOutput","color 254 178 15",0.02);
		EntFire("Reset_ZMspeed_3_temp","ForceSpawn","",0.02);
		EntFire("Break_rock","Kill","",0.02);
		EntFire("st5_rock","Kill","",0.02);
		EntFire("st4_def_bar", "Open", "", 0.02);
		
		EntFire("map_fog", "Disable", "", 0.02);
		EntFire("map_fog_temple","Disable","",0.02);

		// EntFire("Map_text","RunScriptInput","StartTextHud()",0.12);
		// EntFire("Map_text","RunScriptInput","SetTimer(-10)",0.02);
		EntFire("music_scripts","RunScriptInput","PlayBGM(6) ",3.02);
		EntFire("st3_wintrig_temp","ForceSpawn","",10.00);
		EntFire("skybox_evening","Trigger","",0.1);

		EntFire("tonemap_global","SetAutoExposureMin","1.2",0.00);
		EntFire("tonemap_global","SetAutoExposureMax","1.2",0.00);
		EntFire("tonemap_global","SetBloomScale","2.0",0.00);
		EntFire("item_script","RunScriptInput","ItemSpawner3",0.00);

		EntFire("skycamera2","ActivateSkybox","",0.02);
		EntFire("light_brush","Enable","",0.02);
		EntFire("skycamera", "KeyValue", "fogcolor 158 136 128", 0.03);
		EntFire("entrance_break", "Break", "", 0.02);
		//skybox
		EntFire("daytime", "Disable", "", 0.00);
		EntFire("evening", "Enable", "", 0.00);
		EntFire("night", "Disable", "", 0.00);
		//post processing
		EntFire("post_processing_daytime", "Disable", "", 0.00);
		EntFire("post_processing_evening", "Enable", "", 0.00);
		EntFire("post_processing_night", "Disable", "", 0.00);
		//waterfall
		EntFire("waterfall_pending", "Start", "", 0.02);

		EntFire("light_ray", "Kill", "", 0.00);
	}
	else if (stage == 5) {
		EntFire("trigger_manager", "RunScriptInput", "AddTrigger5", 0.00);

		//colorcorrection
		EntFire("CC_Genso","Disable","",0.00);
		EntFire("CC_Genso_evening","Disable","",0.00);
		EntFire("CC_Genso_night", "Enable", "", 0.00);
		
		EntFire("sky_cd","Disable","",0.00);
		EntFire("sky_dark","Disable","",0.00);
		EntFire("light_daytime","SetLightBrightness","0",0.00);
		EntFire("cloud", "Enable", "", 0.00);
		
		EntFire("map_fog","Disable","",0.02);
		EntFire("map_fog_temple","Disable","",0.02);
		EntFire("st1_boss_partarea","Kill","",0.02);

		EntFire("3D_Sky_Brush","Enable","",0.00);
		EntFire("break_box2","Break","",0.00);
		EntFire("underway","Break","",0.00);
		EntFire("underway_bomb1","Enable","",0.00);
		EntFire("entrance_toggle","Toggle","",0.02);
		EntFire("entrance_prop","kill","",0.02);
		EntFire("st1_boss_start_relay","Kill","",0.02);
		EntFire("st4_boss_metal","break","",0.02);
		EntFire("entrance_trigger","Enable","",0.00);
		EntFire("Break_rock","Kill","",0.02);
		EntFire("st5_rock","Kill","",0.02);
		EntFire("st4_boss2_model","Alpha","0",0.02);
		EntFire("entrance_light_part","Start","",10.02);

		EntFire("st4_def_bar","Open","",0.02);

		EntFire("st1_boss_push", "Kill", "", 10.02);
		
		EntFire("streetlight","Start","",0.02);


		EntFire("st4_push_opening","KeyValue","origin 16 -9344 -288",5.00);
		// EntFire("Map_text","KeyValue","color 167 87 168",0.02);
		EntFire("Reset_ZMspeed_4_temp","ForceSpawn","",0.02);

		// EntFire("Map_text","RunScriptInput","SetStageName(5)",0.1);
		// EntFire("Map_text","RunScriptInput","StartTextHud()",0.12);
		// EntFire("Map_text","RunScriptInput","SetTimer(-10)",0.02);


		EntFire("st4_wintrig_temp","ForceSpawn","",10.00);
		EntFire("skybox_night","Trigger","",0.1);
		
 
		EntFire("Explosion_Temp","KeyValue","origin -302 -12096 -294",3.00);
		EntFire("Explosion_Temp","ForceSpawn","",3.02);
		EntFire("Explosion_Temp1","KeyValue","origin 334 -12097 -291.345",3.00);
		EntFire("Explosion_Temp1","ForceSpawn","",3.02);

		EntFire("tonemap_global","SetAutoExposureMin","0.8",0.00);
		EntFire("tonemap_global","SetAutoExposureMax","0.8",0.00);
		EntFire("tonemap_global","SetBloomScale","1.0",0.00);

		EntFire("item_script","RunScriptInput","ItemSpawner4",0.00);
		EntFire("st4_partballphysbox_temp","ForceSpawn","",0.00);
		EntFire("st1_boss_holy_template","KeyValue","origin 3008 9024 -70",10.00);

		EntFire("skycamera2","ActivateSkybox","",0.02);
		EntFire("light_brush","Disable","",0.02);
		EntFire("skycamera", "KeyValue", "fogcolor 71 69 90", 0.03);
		EntFire("entrance_break", "Break", "", 0.02);
		
		EntFire("daytime", "Disable", "", 0.00);
		EntFire("evening", "Disable", "", 0.00);
		EntFire("night", "Enable", "", 0.00);
		//post processing
		EntFire("post_processing_daytime", "Disable", "", 0.00);
		EntFire("post_processing_evening", "Disable", "", 0.00);
		EntFire("post_processing_night", "Enable", "", 0.00);
		//waterfall
		EntFire("waterfall_pending", "Start", "", 0.02);

		EntFire("light_ray", "Kill", "", 0.00);

		EntFire("item_swordmaker", "ForceSpawn", "", 0.00);
	}
	else if (stage == 6) {
		EntFire("trigger_manager", "RunScriptInput", "AddTrigger6", 0.00);
		//colorcorrection
		EntFire("CC_Genso","Disable","",0.00);
		EntFire("CC_Genso_evening","Disable","",0.00);
		EntFire("CC_Genso_night", "Enable", "", 0.00);
		
		EntFire("underway_bomb1","Enable","",0.02);
		EntFire("entrance_toggle","Toggle","",0.02);
		EntFire("entrance_prop","kill","",0.02);
		EntFire("Boss1_toggle","Toggle","",10.00);
		// EntFire("Map_text","KeyValue","color 199 8 29",0.02);
		EntFire("Reset_ZMspeed_4_temp","ForceSpawn","",0.02);
		EntFire("light_daytime","SetLightBrightness","0",0.00);
		EntFire("skybox_night","Trigger","",0.1);
		EntFire("st5_rock","Enable","",0.00);
		EntFire("entrance_trigger","Enable","",0.00);
		EntFire("Break_rock","Kill","",0.02);

		EntFire("st4_def_bar", "Open", "", 0.02);
		
		EntFire("map_fog", "Disable", "", 0.02);
		EntFire("map_fog_temple","Disable","",0.02);

		// EntFire("Map_text","RunScriptInput","SetStageName(6)",0.1);
		// EntFire("Map_text","RunScriptInput","StartTextHud()",0.12);
		// EntFire("Map_text","RunScriptInput","SetTimer(-10)",0.02);

		EntFire("music_scripts","RunScriptInput","PlayBGM(14) ",3.02);

		EntFire("tonemap_global","SetAutoExposureMin","0.8",0.00);
		EntFire("tonemap_global","SetAutoExposureMax","0.8",0.00);
		EntFire("tonemap_global","SetBloomScale","1.0",0.00);

		EntFire("item_script","RunScriptInput","ItemSpawner5",0.00);

		EntFire("skycamera2","ActivateSkybox","",0.02);
		EntFire("light_brush","Disable","",0.02);
		EntFire("skycamera", "KeyValue", "fogcolor 71 69 90", 0.03);
		EntFire("entrance_break", "Break", "", 0.02);
		EntFire("daytime", "Disable", "", 0.00);
		EntFire("evening", "Disable", "", 0.00);
		EntFire("night", "Enable", "", 0.00);
		//post processing
		EntFire("post_processing_daytime", "Disable", "", 0.00);
		EntFire("post_processing_evening", "Disable", "", 0.00);
		EntFire("post_processing_night", "Enable", "", 0.00);
		//waterfall
		EntFire("waterfall_pending", "Start", "", 0.02);

		EntFire("light_ray", "Kill", "", 0.00);
	}
	else if (stage == 7) {
		EntFire("trigger_manager","RunScriptInput","AddTrigger7",0.00);
		EntFire("entrance_toggle","Toggle","",0.02);
		EntFire("entrance_prop","kill","",0.02);
		EntFire("Boss1_toggle","Toggle","",10.00);
		EntFire("Reset_ZMspeed_4_temp","ForceSpawn","",0.02);

		EntFire("underway_bomb","kill","",0.02);
		EntFire("underway","kill","",0.02);
		EntFire("temple_entrance_gate","open","",0.02);
		EntFire("temple_entrance_gate2","open","",0.02);
		EntFire("Temple_Entrance_Door2","open","",0.02);
		EntFire("temple_gate_1","open","",0.02);
		EntFire("temple_gate_1_1","open","",0.02);
		EntFire("temple_fence1","break","",0.02);
		EntFire("door_break","break","",0.02);
		EntFire("temple_gate_2_1","open","",0.02);
		EntFire("temple_gate_2","open","",0.02);
		EntFire("temple_gate_3","open","",0.02);
		EntFire("underway_vent3","open","",0.02);
		EntFire("temple_gate_4","open","",0.02);
		EntFire("temple_gate_6","open","",0.02);
		EntFire("Bottom_metal","break","",0.02);
		EntFire("st5_rock","kill","",0.02);
		EntFire("temple_gate_7","open","",0.02);
		EntFire("temple_gate_8","open","",0.02);
		ntFire("temple_gate_9","open","",0.02);
		EntFire("temple_gate_9_2","open","",0.02);
		EntFire("subway_door","break","",0.02);

		EntFire("st4_def_bar","Open","",0.02);

		EntFire("map_fog","Enable","",0.02);
		EntFire("skycamera","ActivateSkybox","",0.02);
		EntFire("light_brush","Enable","",0.02);
		EntFire("skycamera", "AddOutput", "fogcolor 128 158 158", 0.03);
		
		EntFire("light_ray", "Kill", "", 0.00);
	}
}

// Instrument selected functions to emit logs when called (for debugging)
try {
	[
		'EntFire','EntFireAtTarget','convertAddOutputString','StartMap',
		'StageWon','SetStage','CheckStage','HealthBuff','KillAll','RoundEnd','ShowInfo'
	].forEach(name => _instrumentFunction(name));
} catch (e) {
	// noop
}

Instance.OnScriptInput("stagewon", () => {
    StageWon();
});

Instance.OnScriptInput("KillAll", () => {
    KillAll();
});

Instance.OnScriptInput("HealthBuff", () => {
	const players = Instance.FindEntitiesByClass("player") || [];
	for (const p of players) {
		if (!p) continue;
		const getHealth = typeof p.GetHealth === "function" ? p.GetHealth.bind(p) : null;
		let hp = null;
		try {
			hp = getHealth ? getHealth() : (p.health !== undefined ? p.health : null);
		} catch (e) {
			hp = null;
		}

		if (hp !== null && hp > 0) {
			if (hp < 120) {
				p.SetMaxHealth(220);
				p.SetHealth(120);
			}
			EntFireAtTarget(p, "SetDamageFilter", "", 0.00);
		}
	}
});

function StageWon() {
	if (stage == 1) stage = 2;
	else if (stage == 2) stage = 3;
	else if (stage == 3) stage = 4;
	else if (stage == 4) stage = 5;
	else if (stage == 5) stage = 2;
	else if (stage == 6) stage = 7;
	notifyZoneStage();
}

function SetStage(num) {
	stage = num;
	notifyZoneStage();
}

Instance.OnScriptInput("setstage1", () => {
    SetStage(1);
});
Instance.OnScriptInput("setstage2", () => {
    SetStage(2);
});
Instance.OnScriptInput("setstage3", () => {
    SetStage(3);
});
Instance.OnScriptInput("setstage4", () => {
    SetStage(4);
});
Instance.OnScriptInput("setstage5", () => {
    SetStage(5);
});
Instance.OnScriptInput("setstage6", () => {
    SetStage(6);
});
Instance.OnScriptInput("setstage7", () => {
    SetStage(7);
});

function CheckStage() {
	return stage;
}

function KillAll() {
	const players = Instance.FindEntitiesByClass("player") || [];
	for (const p of players) {
		if (!p) continue;
		const getHealth = typeof p.GetHealth === "function" ? p.GetHealth.bind(p) : null;
		let hp = null;
		try { hp = getHealth ? getHealth() : (p.health !== undefined ? p.health : null); } catch (e) { hp = null; }
		if (hp !== null && hp > 0) {
			p.TakeDamage({ damage: 9999999 });
		}
	}
}

function RoundEnd() {
	EntFire("trigger_multiple", "Kill", "", 3.00);
	EntFire("ambient_generic", "Kill", "", 3.00);
	EntFire("func_breakable", "Kill", "", 3.00);
	EntFire("trigger_hurt", "Kill", "", 3.00);
	EntFire("trigger_teleport", "Kill", "", 3.00);
	EntFire("func_button", "Kill", "", 3.00);
}

const messageTEXT = `ze Genso of Last v4
====================
Map by Pohmian/Mochi and Azure
Special thanks
 SHUFEN, kawagoe, Raio, nakachan, yukkuriゆっくり
 POSSESSION SERVER, ZEDDY GAMING and All Testing Players`;

function ShowInfo() {
	EntFire("Map_HudHint", "SetText", messageTEXT, 0.00);
	EntFire("Map_HudHint", "Display", "", 0.01);
}