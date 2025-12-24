import { Instance } from "cs_script/point_script";

Instance.OnScriptInput("SpawnCanister", () => {
    let ents = Instance.FindEntitiesByName("Human_Item_Random_Physbox*");
    if(ents.length > 0)
    {
        let rnd_n = GetRandomNumber(0, ents.length - 1);
        let r_ent = ents[rnd_n];
        if(r_ent?.IsValid())
        {
            Instance.EntFireAtTarget({ target: r_ent, input: "FireUser1", value: "", delay: 0.00 });
        }
    }
});

Instance.OnScriptInput("SpawnItem", () => {
    let ents = Instance.FindEntitiesByName("Human_Item_Random_Physbox*");
    if(ents.length > 0)
    {
        let rnd_n = GetRandomNumber(0, ents.length - 1);
        let r_ent = ents[rnd_n];
        if(r_ent?.IsValid())
        {
            Instance.EntFireAtTarget({ target: r_ent, input: "FireUser2", value: "", delay: 0.00 });
        }
    }
});

Instance.OnScriptInput("SpawnMeat", () => {
    let ents = Instance.FindEntitiesByName("Human_Item_Random_Physbox*");
    if(ents.length > 0)
    {
        let rnd_n = GetRandomNumber(0, ents.length - 1);
        let r_ent = ents[rnd_n];
        if(r_ent?.IsValid())
        {
            Instance.EntFireAtTarget({ target: r_ent, input: "FireUser3", value: "", delay: 0.00 });
        }
    }
});

function GetRandomNumber(min, max ) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
