// ============================================================
//  SYSTÈME D'ITEMS — sans func_button, via WasInputJustPressed
// ============================================================
//  NOMMAGE : item01_gun / item01_relay (plus de _button du tout)
//
//  CÂBLAGE : après chaque spawn d'arme :
//    > script_guns > RunScriptInput > RegisterGuns  (delay 0.1+)
//
//  PRINCIPE : chaque tick, on scanne les joueurs connectés ; si l'un
//  vient de presser USE (WasInputJustPressed) et qu'il porte une des
//  armes enregistrées, on déclenche le relay correspondant.
// ============================================================
import { Instance, CSInputs } from "cs_script/point_script";

const ITEMS = ["item01", "item02", "item03", "item04"];
const TICKRATE = 0.1;

let armes = {};
let usePressedSlots = new Set();

function capturerArmes() {
	for (const prefixe of ITEMS) {
		if (armes[prefixe] && armes[prefixe].IsValid()) continue;
		const e = Instance.FindEntityByName(prefixe + "_gun");
		if (e && e.IsValid()) armes[prefixe] = e;
		else Instance.Msg("[items] capture " + prefixe + "_gun : introuvable");
	}
}

function samePlayer(a, b) {
	if (a === b) return true;
	try { if (a.GetEntityIndex && a.GetEntityIndex() === b.GetEntityIndex()) return true; } catch (e) {}
	try {
		const ca = a.GetPlayerController(), cb = b.GetPlayerController();
		if (ca && cb && ca.GetPlayerSlot() === cb.GetPlayerSlot()) return true;
	} catch (e) {}
	return false;
}

Instance.OnScriptInput("RegisterGuns", capturerArmes);

Instance.OnRoundStart(() => {
	armes = {};
	usePressedSlots.clear();
});

function tickItems() {
	Instance.SetNextThink(Instance.GetGameTime() + TICKRATE);

	for (let slot = 0; slot < 64; slot++) {
		const controller = Instance.GetPlayerController(slot);
		if (!controller || !controller.IsConnected()) {
			usePressedSlots.delete(slot);
			continue;
		}
		const pawn = controller.GetPlayerPawn();
		if (!pawn || !pawn.IsValid() || !pawn.IsAlive()) {
			usePressedSlots.delete(slot);
			continue;
		}

		if (!pawn.IsInputPressed(CSInputs.USE)) {
			usePressedSlots.delete(slot);
			continue;
		}
		if (usePressedSlots.has(slot)) continue;
		usePressedSlots.add(slot);

		for (const prefixe of ITEMS) {
			const arme = armes[prefixe];
			if (!arme || !arme.IsValid()) continue;

			const porteur = arme.GetOwner();
			if (!porteur || !porteur.IsValid()) continue;

			if (samePlayer(pawn, porteur)) {
				Instance.EntFireAtName(prefixe + "_relay", "Trigger", undefined, 0, { activator: pawn });
				break;
			}
		}
	}
}
Instance.SetThink(tickItems);
Instance.SetNextThink(Instance.GetGameTime() + TICKRATE);
