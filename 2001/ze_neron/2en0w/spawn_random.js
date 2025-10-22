//-------- script by 2en0w | data 25.10.08 -------------//
import { Instance } from "cs_script/point_script";


Instance.OnScriptInput("MakerSpawnRandon0_90", (_input) => {
    
        MakerSpawnQAngleRamdon(_input.caller,0,90,0,0,30,0)
});

Instance.OnScriptInput("endlaser", (_input) => {
    
        MakerSpawnQAngleRamdon(_input.caller,0,0,0,0,-180,180)
});

Instance.OnScriptInput("st1_maker1", (_input) => {
    
        MakerSpawnQAngleRamdon(_input.caller,-180,180,-2,2,0,0)
});

Instance.OnScriptInput("random360", (_input) => {
    
        MakerSpawnQAngleRamdon(_input.caller,-180,180,0,0,0,0)
});

Instance.OnScriptInput("st3orange", (_input) => {
    
        MakerSpawnQAngleRamdon(_input.caller,-180,180,0,0,180,-180)
});

Instance.OnScriptInput("st3green", (_input) => {
    
        MakerSpawnQAngleRamdon(_input.caller,-180,180,-20,0,180,-180)
});

Instance.OnScriptInput("st3red", (_input) => {
    
        MakerSpawnQAngleRamdon(_input.caller,-180,180,-20,0,0,0)
});

Instance.OnScriptInput("brand12", (_input) => {
    
        MakerSpawnQAngleRamdon(_input.caller,125,235,0,0,180,-180)
});

Instance.OnScriptInput("brand3", (_input) => {
    
        MakerSpawnQAngleRamdon(_input.caller,140,220,0,0,0,0)
});

Instance.OnScriptInput("brand1", (_input) => {
    
        MakerSpawnQAngleRamdon(_input.caller,110,250,0,0,0,0)
});

Instance.OnScriptInput("brand1mini", (_input) => {
    
        MakerSpawnQAngleRamdon(_input.caller,-45,45,0,0,0,0)
});

Instance.OnScriptInput("brand26", (_input) => {
    
        MakerSpawnQAngleRamdon(_input.caller,180,270,0,0,0,0)
});

Instance.OnScriptInput("brand26-1", (_input) => {
    
        MakerSpawnQAngleRamdon(_input.caller,90,180,0,0,0,0)
});

Instance.OnScriptInput("brand24", (_input) => {
    
        MakerSpawnQAngleRamdon(_input.caller,-180,180,70,110,0,0)
});

Instance.OnScriptInput("st4mini", (_input) => {
    
        MakerSpawnQAngleRamdon(_input.caller,-45,-135,0,0,180,-180)
});

Instance.OnScriptInput("st4minileft", (_input) => {
    
        MakerSpawnQAngleRamdon(_input.caller,90,270,0,0,0,0)
});

Instance.OnScriptInput("st4miniright", (_input) => {
    
        MakerSpawnQAngleRamdon(_input.caller,-90,90,0,0,0,0)
});

function MakerSpawnQAngleRamdon(_maker,_yStart,_yEnd,_pStart,_pEnd,_rStart,_rEnd){
        
        _maker.Teleport(null,{ pitch: _pStart+Math.random() * (_pEnd-_pStart), yaw: _yStart+Math.random() * (_yEnd-_yStart), roll: _rStart+Math.random() * (_rEnd-_rStart)},null);
        Instance.EntFireAtTarget(_maker,"ForceSpawn")

}



function TempSpawnQAngleRamdon(_temp,_yStart,_yEnd,_pStart,_pEnd,_rStart,_rEnd,){

        _temp.ForceSpawn(_temp.GetAbsOrigin(), { pitch: _pStart+Math.random() * (_pEnd-_pStart), yaw: _yStart+Math.random() * (_yEnd-_yStart), roll: _rStart+Math.random() * (_rEnd-_rStart)})

}


function MoverSpeedRamdon(_mover,_start,_end){

        Instance.EntFireAtTarget(_mover,"SetSpeed",Math.random() * (_end-_start))
    
}
