import { Instance } from "cs_script/point_script";

const GRENADE_PUSH_FORCE = 900;

Instance.OnBeforePlayerDamage((event) => {
    const player = event.player;
    const inflictor = event.inflictor;

    if (!player || !player.IsValid() || !player.IsAlive())
        return;

    if (!inflictor || !inflictor.IsValid())
        return;

    // DMG_BLAST = 64
    if ((event.damageFlags & 64) === 0)
        return;

    const explosionPos = inflictor.GetAbsOrigin();
    const playerPos = player.GetAbsOrigin();

    let dx = playerPos.x - explosionPos.x;
    let dy = playerPos.y - explosionPos.y;
    let dz = playerPos.z - explosionPos.z;

    const len = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;

    dx /= len;
    dy /= len;
    dz /= len;

    const push = {
        x: dx * GRENADE_PUSH_FORCE,
        y: dy * GRENADE_PUSH_FORCE,
        z: dz * GRENADE_PUSH_FORCE + 250
    };

    player.Teleport({
        velocity: {
            x: player.GetAbsVelocity().x + push.x,
            y: player.GetAbsVelocity().y + push.y,
            z: player.GetAbsVelocity().z + push.z
        }
    });
});
