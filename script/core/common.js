import {
  game,
  TYPES,
  updateEnergy,
  rnd,
  rndInt,
  mixin,
  plusMinus
} from '../aa.js';

import { GunFire } from '../munitions/GunFire.js'
import { Smoke } from '../elements/Smoke.js';

const winloc = window.location.href.toString();

// by default, transform: translate3d(), more GPU compositing seen vs.2d-base transform: translate().
const useTranslate3d = !winloc.match(/noTranslate3d/i);

const debug = winloc.match(/debug/i);

const common = {

  defaultCSS: {
    animating: 'animating',
    dead: 'dead',
    enemy: 'enemy',
    exploding: 'exploding',
  },

  updateXY(exports, x, y) {

    let didUpdate;

    if (x !== undefined && exports.data.x !== x) {
      exports.data.x = x;
      didUpdate = true;
    }

    if (y !== undefined && exports.data.y !== y) {
      exports.data.y = y;
      didUpdate = true;
    }

    return didUpdate;
  },

  moveTo(exports, x, y) {

    // only set transform if data changed
    if (common.updateXY(exports, x, y)) {
      common.setTransformXY(exports, exports.dom.o, `${exports.data.x}px`, `${exports.data.y}px`);
    }
   
  },

  setTransformXY(exports, o, x, y, extraTransforms) {

    /**
     * given an object (and its on-screen/off-screen status), apply transform to its live DOM node -
     * and/or, if off-screen, as a string to be applied when the element is on-screen.
     * positioning can be moderately complex, and is calculated with each animate() / moveTo() call.
     */

    let transformString;

    if (!o) return;

    // additional transform arguments, e.g., rotate3d(0, 0, 1, 45deg)
    extraTransforms = extraTransforms ? (` ${extraTransforms}`) : '';

    // EXPERIMENTAL
    // all elements are affected by scroll, too.
    /*
    if (x && x.indexOf('px') !== -1) {
      if (game.objects.view && game.objects.view.data && game.objects.view.data.battleField) {
        // console.log(game.objects.view.data.battleField.scrollLeft);
        x = (parseInt(x, 10) - game.objects.view.data.battleField.scrollLeft) + 'px';
      }
    }
    */

    // if (game.objects.view && o !== game.objects.view.data.battleField) return;

    if (useTranslate3d) {
      transformString = `translate3d(${x}, ${y}, 0px)${extraTransforms}`;
    } else {
      transformString = `translate(${x}, ${y})${extraTransforms}`;
    }

    /**
     * sometimes, exports is explicitly provided as `undefined`.
     * if any are undefined, "just do it" and apply the transform -
     * provided we haven't applied the same one.
     */
    if ((!exports || !exports.data || exports.data.isOnScreen) && o._lastTransform !== transformString) {
      o.style.transform = transformString;
      if (debug) {
        // show that this element was moved
        o.style.outline = `1px solid #${rndInt(9)}${rndInt(9)}${rndInt(9)}`;
        game.objects.gameLoop.incrementTransformCount();
      }
    } else if (debug) {
      game.objects.gameLoop.incrementTransformCount(true /* count as an "excluded" transform */);
    }

    // assign for future re-append to DOM
    o._lastTransform = transformString;

  },

  hit(target, hitPoints, attacker) {

    let newEnergy, energyChanged;

    if (target.data.dead) return;

    hitPoints = hitPoints || 1;

    /**
     * special case: super-bunkers can only be damaged by tank gunfire.
     * other things can hit super-bunkers, but we don't want damage done in this case.
     */

    if (target.data.type === TYPES.superBunker) {
      // non-tank gunfire will ricochet off of super bunkers.
      if (!attacker || !attacker.data || !attacker.data.parentType || attacker.data.parentType !== TYPES.tank) {
        return;
      }
    } else if (target.data.type === TYPES.tank) {
      // tanks shouldn't be damaged by shrapnel - but, let the shrapnel die.
      if (attacker && attacker.data && attacker.data.parentType && attacker.data.parentType === TYPES.shrapnel) {
        hitPoints = 0;
      }
    }

    newEnergy = Math.max(0, target.data.energy - hitPoints);

    energyChanged = target.data.energy !== newEnergy;

    target.data.energy = newEnergy;

    // special cases for updating state
    if (energyChanged && target.updateHealth) {
      target.updateHealth(attacker);
    }

    updateEnergy(target);

    if (!target.data.energy) {

      if (target.die) {
        target.die({ attacker });
      }

    }

  },

  // height offsets for certain common ground units
  // TODO: reference constants or similar
  ricochetBoundaries: {
    'tank': 18,
    'bunker': 25,
    'super-bunker': 28
  },

  lastInfantryRicochet: 0,

  getLandingPadOffsetX(helicopter) {
    const landingPad = game.objects.landingPads[helicopter.data.isEnemy ? game.objects.landingPads.length - 1 : 0];
    return landingPad.data.x + (landingPad.data.width / 2) - helicopter.data.halfWidth;
  },

  smokeRing(item, smokeOptions) {

    // don't create if not visible
    if (!item.data.isOnScreen) return;

    smokeOptions = smokeOptions || {};
    
    let angle, smokeArgs, angleIncrement, count, i, radians, velocityMax, vX, vY, vectorX, vectorY;

    angle = 0;

    // some sort of min / max
    velocityMax = smokeOptions.velocityMax || (3 + rnd(4));

    // # of smoke elements
    count = parseInt((smokeOptions.count ? smokeOptions.count / 2 : 5) + rndInt(smokeOptions.count || 11), 10);

    angleIncrement = 180 / count;

    // random: 50% to 100% of range
    vX = vY = (velocityMax / 2) + rnd(velocityMax / 2);

    for (i = 0; i < count; i++) {

      angle += angleIncrement;

      // calculate vectors for each element
      radians = angle * Math.PI / 90;

      vectorX = vX * Math.cos(radians);
      vectorY = vY * Math.sin(radians);

      // ground-based object, e.g., base? explode "up", and don't mirror the upper half.
      if (vectorY > 0 && smokeOptions.isGroundUnit) {
        vectorY *= -0.33;
        vectorX *= 0.33;
      }

      smokeArgs = {
        // fixedSpeed: true, // don't randomize vX / vY each time
        x: item.data.x + ((smokeOptions.offsetX || 0) || (item.data.halfWidth || 0)),
        y: item.data.y + ((smokeOptions.offsetY || 0) || (item.data.halfHeight || 0)),
        // account for some of parent object's motion, e.g., helicopter was moving when it blew up
        vX: vectorX + ((smokeOptions.parentVX || 0) / 3),
        vY: vectorY + ((smokeOptions.parentVY || 0) / 3),
        // spriteFrame: (Math.random() > 0.5 ? 0 : rndInt(5)),
        spriteFrameModulus: smokeOptions.spriteFrameModulus || 3,
        gravity: 0.25,
        deceleration: 0.98,
        increaseDeceleration: 0.9985
      };

      game.objects.smoke.push(Smoke(smokeArgs));

      // past a certain amount, create inner "rings"
      if (count >= 20 || velocityMax > 15) {

        // second inner ring
        if (i % 2 === 0) {
          game.objects.smoke.push(Smoke(
            mixin(smokeArgs, { vX: vectorX * 0.75, vY: vectorY * 0.75})
          ));
        }

        // third inner ring
        if (i % 3 === 0) {
          game.objects.smoke.push(Smoke(
            mixin(smokeArgs, { vX: vectorX * 0.66, vY: vectorY * 0.66})
          ));
        }

        // fourth inner ring
        if (i % 4 === 0) {
          game.objects.smoke.push(Smoke(
            mixin(smokeArgs, { vX: vectorX * 0.50, vY: vectorY * 0.50})
          ));
        }

      }

    }

  },

  smokeRelativeToDamage(exports, chance) {
    
    if (!exports || !exports.data || !exports.dom) return;

    const data = exports.data;

    if (!data.isOnScreen) return;

    // first off: certain chance of no smoke, regardless of status
    if (Math.random() >= (chance || 0.66)) return;
    
    // a proper roll of the dice: smoke at random. higher damage = greater chance of smoke
    if (Math.random() < 1 - ((data.energyMax -data.energy) / data.energyMax)) return;

    game.objects.smoke.push(Smoke({
      x: data.x + data.halfWidth + (parseInt(rnd(data.halfWidth) * 0.33 * plusMinus(), 10)),
      y: data.y + data.halfHeight + (parseInt(rnd(data.halfHeight) * 0.25 * (data.vY <= 0 ? -1 : 1), 10)),
      // if undefined or zero, allow smoke to go left or right
      // special handling for helicopters and turrets. this should be moved into config options.
      vX: (data.type === TYPES.helicopter ? rnd(1.5) * plusMinus() : -(data.vX || 0) + rnd(1.5) * (data.vX === undefined || data.vX === 0 ? plusMinus() : 1)),
      vY: (data.type === TYPES.helicopter || data.type === TYPES.turret ? rnd(-3) : -(data.vY || 0.25) + rnd(-2))
    }));

  },

  inertGunfireExplosion(options) {

    /* { count: int, exports: exports } */

    if (!options || !options.exports || !options.exports.data) return;

    const data = options.exports.data;

    if (!data.isOnScreen) return;

    // create some inert (harmless) gunfire, as decorative shrapnel.
    for (let i = 0, j = options.count || (3 + rndInt(1)); i < j; i++) {

      game.objects.gunfire.push(GunFire({
        parentType: data.type,
        isEnemy: data.isEnemy,
        isInert: true,
        // empty array may prevent collision, but `isInert` is provided explicitly for this purpose
        collisionItems: [],
        x: data.x + data.halfWidth,
        y: data.y + data.halfHeight,
        // if there are more "particles", allow them to move further.
        vX: rnd(2) * plusMinus() * (j > 4 ? rnd(j / 2) : 1),
        vY: -rnd(2)  * (j > 4 ? rnd(j / 2) : 1)
      }));

    }

  }

};

export { common };