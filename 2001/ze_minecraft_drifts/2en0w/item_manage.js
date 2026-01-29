import { Instance } from "cs_script/point_script";

let self = null;

Instance.OnRoundStart((event) => {
	
    Instance.Msg("item_manage loaded");
	let newself = Instance.FindEntityByName("item_manage")
	item_ammo_weaponcase_temp = Instance.FindEntityByName("item_ammo_weaponcase_temp")
	if(self != newself){self = newself}
});

Instance.OnScriptInput("OnUse", (_input) => {

		if(_input.caller.GetParent().GetParent() === _input.activator){
			
			Instance.EntFireAtTarget({ target: _input.caller, input: "FireUser1", caller: _input.caller, activator: _input.activator });
		}

});

Instance.OnScriptInput("GiveAmmo", (_input) => {
	   let _len = 90000
       let _wps = Instance.FindEntitiesByClass("weapon_*");
	   let _pos = _input.caller.GetAbsOrigin();

	   for (let _i = 0; _i < _wps.length; _i++) {
			if(_len > vector3LengthSquare(vector3Sub(_wps[_i].GetAbsOrigin(),_pos))){
				Instance.EntFireAtTarget({ target: _wps[_i], input: "SetAmmoAmount", value: "999"});
			}
			
		}

		
		
});

Instance.OnScriptInput("GiveHegrenade", (_input) => {
	   let _len = 90000
       let _p = Instance.FindEntitiesByClass("player");
	   let _pos = _input.caller.GetAbsOrigin();

	   for (let _i = 0; _i < _p.length; _i++) {
			if(_p[_i].GetTeamNumber()==3&&_len > vector3LengthSquare(vector3Sub(_p[_i].GetAbsOrigin(),_pos))){
				_p[_i].GiveNamedItem("weapon_hegrenade",false)
			}
			
		}		
		
});

Instance.OnScriptInput("SetZombieHP", (_input) => {
	   let _len = 150000
       let _p = Instance.FindEntitiesByClass("player");
	   let _pos = _input.caller.GetAbsOrigin();

	   for (let _i = 0; _i < _p.length; _i++) {
			if(_p[_i].GetTeamNumber()==2&&_len > vector3LengthSquare(vector3Sub(_p[_i].GetAbsOrigin(),_pos))){
				_p[_i].SetHealth(300);
				_p[_i].SetMaxHealth(300);
			}
			
		}	
});

Instance.OnScriptInput("ItemAmmoUsing", (_input) => {
	let _r = Math.random();
	let _calpos = _input.caller.GetAbsOrigin();
	if(_r<0.2){
		Instance.EntFireAtTarget({ target: _input.caller, input: "FireUser3",  delay: 0});
		WeaponCaseNum = 0;
	}else if(0.2<=_r && _r<0.4){
		WeaponCaseNum = 1;
		WeaponcaseSpawn(_calpos);
		Instance.EntFireAtTarget({ target: _input.caller, input: "kill", delay:3});
	}else if(0.4<=_r && _r<0.6){
		WeaponCaseNum = 2;
		WeaponcaseSpawn(_calpos);
		Instance.EntFireAtTarget({ target: _input.caller, input: "kill", delay:3});
	}else if(0.6<=_r && _r<0.8){
		WeaponCaseNum = 3;
		WeaponcaseSpawn(_calpos);
		Instance.EntFireAtTarget({ target: _input.caller, input: "kill", delay:3});
	}else if(0.8<=_r && _r<=1){
		WeaponCaseNum = 4
		Instance.EntFireAtTarget({ target: self, input: "RunScriptInput", value:"GiveHegrenade", caller: _input.caller });
		Instance.EntFireAtTarget({ target: _input.caller, input: "kill", delay:3});

	}
});

let item_ammo_weaponcase_temp = null;

function WeaponcaseSpawn(_casepos){

		_casepos.z=_casepos.z+10;
		for (let _i = 8; _i > 0; _i--) {
			item_ammo_weaponcase_temp.ForceSpawn({ x:_casepos.x+Math.random()*60-30, y: _casepos.y+Math.random()*60-30, z:_casepos.z-10})
		}
}

Instance.OnScriptInput("ItemAmmoParticleCP", (_input) => {
		Instance.EntFireAtTarget({ target: _input.caller, input: "setdatacontrolpointx", value:WeaponCaseNum, delay:0.01})
		Instance.EntFireAtTarget({ target: _input.caller, input: "Start"})

});

let WeaponCaseModelGroup = [
	"",
	"weapons/models/m249/weapon_mach_m249.vmdl",
	"weapons/models/xm1014/weapon_shot_xm1014.vmdl",
	"weapons/models/awp/weapon_snip_awp.vmdl",
	""
]
let WeaponCaseNum = 0;

Instance.OnScriptInput("SetAmmoWeaponCaseModel", (_input) => {
	if(WeaponCaseModelGroup[WeaponCaseNum]!= ""){
		_input.caller.SetModel(WeaponCaseModelGroup[WeaponCaseNum]);
	}
});

Instance.OnScriptInput("GivePlayerWeapon", (_input) => {

	if(_input.activator.GetTeamNumber()==3){
		let _w = _input.activator.FindWeaponBySlot(0);
		let _case = _input.caller;
		let _act = _input.activator;
		if(_w!= undefined){ _w.Remove()};
		switch(_case.GetModelName()){
			case WeaponCaseModelGroup[1]:_act.GiveNamedItem("weapon_m249",true);break
			case WeaponCaseModelGroup[2]:_act.GiveNamedItem("weapon_xm1014",true);break
			case WeaponCaseModelGroup[3]:_act.GiveNamedItem("weapon_awp",true);break
			
		}
		Instance.EntFireAtTarget({ target: self, input: "RunScriptInput", value:"SetWeaponAmmo", activator: _act,delay:0.02 });
		_case.Remove();
	}
	
});

Instance.OnScriptInput("SetWeaponAmmo", (_input) => {

	let _w = _input.activator.FindWeaponBySlot(0);
	if(_w!= undefined){
		Instance.EntFireAtTarget({ target: _w, input: "addcontext", value:"gun_ammo_context:1"});
		Instance.EntFireAtTarget({ target: _w, input: "removecontext", value:"gun_ammo_context", delay: 40 });
		Instance.EntFireAtTarget({ target: _w, input: "FireUser1",  delay: 1,activator:_w });
		Instance.EntFireAtTarget({ target: _w, input: "addoutput", value: "onuser1>give_gun_ammo>TestActivator>>0>-1"});
		
	}
//	Instance.Msg(_w.GetClassName());
	
});
//Instance.OnGunReload((_input) => {
//	Instance.Msg(_input.weapon.Remove())
//	_input.weapon.GetOwner().GiveNamedItem("weapon_ak47",true)
//});


function vector3Sub(_vec1,_vec2){
	
	let _sum = { x: _vec1.x-_vec2.x, y: _vec1.y-_vec2.y, z: _vec1.z-_vec2.z };
	return _sum;
}

function vector3LengthSquare(_vec) {
  let _sum = 0;
  _sum = (_vec.x*_vec.x)+(_vec.y*_vec.y)+(_vec.z*_vec.z)
  return _sum;
}