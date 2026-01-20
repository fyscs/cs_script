import { Instance } from "cs_script/point_script";

Instance.OnScriptInput("OnUse", (_input) => {

		if(_input.caller.GetParent().GetParent() === _input.activator){
			
			Instance.EntFireAtTarget(_input.caller,"FireUser1", null,_input.caller,_input.activator)

		}

});

Instance.OnScriptInput("GiveAmmo", (_input) => {
	   let _len = 90000
       let _wps = Instance.FindEntitiesByClass("weapon_*");
	   let _pos = _input.caller.GetAbsOrigin();

	   for (let _i = 0; _i < _wps.length; _i++) {
			if(_len > vector3LengthSquare(vector3Sub(_wps[_i].GetAbsOrigin(),_pos))){
				Instance.EntFireAtTarget(_wps[_i],"SetAmmoAmount","9999")
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

Instance.OnScriptInput("testfunction", (_input) => {
	 _input.activator.FindWeaponBySlot(0).Remove();
	_input.activator.GiveNamedItem("weapon_ak47",true)
	let _msg = _input.activator.FindWeaponBySlot(0).GetClassName();
	
	Instance.Msg(_msg)
	
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