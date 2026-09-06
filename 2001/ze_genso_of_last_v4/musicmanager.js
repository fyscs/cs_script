import { Instance } from "cs_script/point_script";

// --- Constants ---
const DEBUG = true; // Set to true to enable debug logging

// BGM soundevent names (defined in soundevents_addon.vsndevts)
const bgm = [
	"Lumina", // 0: Normal
	"SiTE_n0w1", // 1
	"Lost_Within", // 2
	"lvl2_music1st", // 3: Hard
	"K21", // 4
	"C21_FX_Legacy_Epic_Orchestral_Choral", // 5
	"rE_CRe_T0RS", // 6: Soul
	"inside", // 7
	"iceofphoenix", // 8
	"Storm", // 9: Soul last
	"FAKEit", // 10: Terminal
	"aLIEz", // 11
	"lvl4boss", // 12: Boss
	"DOA1", // 13: Terminal end
	"through_my_blood", // 14: Last1
	"", // 15: Reserved (last inside)
	"lvl5Awaken", // 16: Boss
	"lvl5_HOLLOW_HUNGER", // 17: Last end
	"", // 18
	"", // 19
	"", // 20
	"", // 21
	"" // 22
];

// Helper to play a soundevent index
function _playIndex(index) {
	// Always look up BGMPlayer fresh each time (avoid stale references)
	const bgmPlayer = Instance.FindEntityByName("BGMPlayer");
	if (!bgmPlayer) {
		Instance.Msg("[ERROR] MusicManager: BGMPlayer not found!");
		return;
	}

	if (index < 0 || index >= bgm.length) return;
	const soundEvent = bgm[index];
	if (!soundEvent) return;

	if (DEBUG) Instance.Msg(`[MusicManager] PlayBGM(${index}): ${soundEvent}`);
	Instance.EntFireAtTarget({ target: bgmPlayer, input: "StopSound", delay: 0.00 });
	Instance.EntFireAtTarget({ target: bgmPlayer, input: "SetSoundEventName", value: soundEvent, delay: 0.01 });
	Instance.EntFireAtTarget({ target: bgmPlayer, input: "StartSound", delay: 0.02 });
}

// Stop handler
Instance.OnScriptInput("StopBGM", () => {
	// Always look up BGMPlayer fresh each time
	const bgmPlayer = Instance.FindEntityByName("BGMPlayer");
	if (!bgmPlayer) {
		Instance.Msg("[ERROR] MusicManager: BGMPlayer not found!");
		return;
	}

	if (DEBUG) Instance.Msg("[MusicManager] StopBGM");
	Instance.EntFireAtTarget({ target: bgmPlayer, input: "StopSound", delay: 0.00 });
});

// Register handlers for existing RunScriptInput pattern: PlayBGM(N)
for (let i = 0; i < bgm.length; i++) {
	const name = `PlayBGM(${i})`;
	const nameWithSpace = `PlayBGM(${i}) `; // some callers include a trailing space
	Instance.OnScriptInput(name, () => _playIndex(i));
	Instance.OnScriptInput(nameWithSpace, () => _playIndex(i));
}