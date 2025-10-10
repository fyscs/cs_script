import { Instance } from "cs_script/point_script";

let failNum = -1
let stageNum = 1

Instance.OnRoundStart((event) => {
		getItemTemp();
		switch(stageNum){
			case 1:triggerStage1();break
			case 2:triggerStage2();break
			
		}
		
});

Instance.OnScriptInput("SetStage1", (_input) => {
		stageNum = 1	
});
Instance.OnScriptInput("SetStage2", (_input) => {
		stageNum = 2	
});

Instance.OnRoundEnd((winningTeam) => {
	if(winningTeam == 2){	
		failNum++
	}
});


function triggerStage1(){
	
	Instance.EntFireAtName("st1_start_01","trigger")
	for (let _i = failNum; _i > 0; _i--) {
		item_ammo_tem.ForceSpawn({x:-12481 ,y:-11475 ,z:4290})
		item_book_tem.ForceSpawn({x:-12481 ,y:-11539 ,z:4290})
	
	}
	
}

function triggerStage2(){
	
	Instance.EntFireAtName("st1_start_02","trigger")
	for (let _i = failNum; _i > 0; _i--) {
		item_ammo_tem.ForceSpawn({x:-7223 ,y:-5983 ,z:1010})
		item_book_tem.ForceSpawn({x:-7223 ,y:-5862 ,z:1010})
	
	}
}

let item_ammo_tem
let item_book_tem

function getItemTemp(){
	item_ammo_tem = Instance.FindEntityByName("item_ammo_tem");
	item_book_tem = Instance.FindEntityByName("item_book_tem");	
}

Instance.OnScriptInput("Checkhuman20", (_input) => {
	
	let _pl = Instance.FindEntitiesByClass("player");
	let _human = 0
	for (let _i = 0; _i < _pl.length; _i++) {
		if(_pl[_i].GetTeamNumber()==3){
			_human++
		}
	}
	Instance.Msg(_pl.length)
	if(_human<20){
		Instance.EntFireAtName("st1_bgm_005","stopsound")
		Instance.EntFireAtName("st1_bgm_006","startsound")
	}
});