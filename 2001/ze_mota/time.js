// 沉默中的羔羊
// 简单的计时器，可以随意引用，如果要引用请告知我并标明出处。
import { Instance } from "cs_script/point_script";


let kzt = 0;
let kzts = 0;
let kztm = 0;


Instance.OnScriptInput("kztime", () => {
    kzt++;
    if (kzt == 100) {
        kzt = 0;
        kzts++;
        if (kzts == 60) {
            kzts = 0;
            kztm++;
        }
    }

});

Instance.OnScriptInput("kztime2", () => {
   Instance.EntFireAtName({ name: "sv_cmd", input: "command", value: "say 完成时间为 " + kztm + ":" + kzts + ":" + kzt + " 目前暂无最快完成时间，请联系我更改记录"});
});

// 重置函数
Instance.OnScriptInput("reset", () => {
    kzt = 0;
    kzts = 0;
    kztm = 0;
    Instance.ServerCommand("say 计时器已重置为 0:0:0");
});

   // Instance.ServerCommand("say 完成时间为 " + kztm + ":" + kzts + ":" + kzt );
    //if (kztm_max<kztm){
    //Instance.ServerCommand("say 目前暂无最快完成时间,如果你完成了该段kz,请联系我更改记录");
    //if (kztm_max==kztm&&kzts_max<kzts){
    //Instance.ServerCommand("say 目前暂无最快完成时间,如果你完成了该段kz,请联系我更改记录");
    //}
    //if (kztm_max==kztm&&kzts_max==kzts&&kzt_max<kzt){
    //Instance.ServerCommand("say 目前暂无最快完成时间,如果你完成了该段kz,请联系我更改记录");
    //}}
    //else{
     //   Instance.ServerCommand("say 当前最快记录为你好" + kztm_max + ":" + kzts + ":" + kzt);
    //}