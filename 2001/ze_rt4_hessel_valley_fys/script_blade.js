// 刀伤脚本(blade_damage)
import { Instance } from "cs_script/point_script";

Instance.OnScriptInput("ps_blade", (event) => {
    const victim = event.activator;
    const parent = Instance.FindEntityByName("blade_user");
    if (!parent?.IsValid() || !parent.IsAlive()) return;
    if (!victim?.IsValid() || !victim.IsAlive()) return;

    const health = victim.GetHealth();
    let damage = 35;
    if (health <= 35) damage = 1000;

    // 使用对象形式施加刀伤害
    try {
        victim.TakeDamage({
            damage: damage,
            attacker: parent,
            inflictor: parent,
            damageType: 2
        });
    } catch (e) {}

    // 兜底
    if (victim.GetHealth() === health) {
        const newHealth = health - damage;
        if (newHealth > 0) victim.SetHealth(newHealth);
        else victim.Kill();
    }
});
