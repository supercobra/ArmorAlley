import {
  game,
  updateEnergy,
  rnd,
  rndInt,
  plusMinus
} from '../aa.js';

import { debug, TYPES, useDOMPruning, winloc } from '../core/global.js';
import { GunFire } from '../munitions/GunFire.js'
import { Smoke } from '../elements/Smoke.js';

// by default, transform: translate3d(), more GPU compositing seen vs.2d-base transform: translate().
const useTranslate3d = !winloc.match(/noTranslate3d/i);

// unique IDs for quick object equality checks
let guid = 0;

const common = {

  inheritData(data, options) {

    // mixin defaults, and apply common options
  
    options = options || {};
  
    // for quick object comparison
    if (data.id === undefined) {
      data.id = (options.id || guid++);
    }
  
    // assume not in view at first, used for DOM pruning / performance
    if (data.isOnScreen === undefined) {
      data.isOnScreen = false;
    }
  
    if (data.isEnemy === undefined) {
      data.isEnemy = (options.isEnemy || false);
    }
  
    if (data.bottomY === undefined) {
      data.bottomY = (options.bottomY || 0);
    }
  
    if (data.dead === undefined) {
      data.dead = false;
    }
  
    if (data.x === undefined) {
      data.x = (options.x || 0);
    }
  
    if (data.y === undefined) {
      data.y = (options.y || 0);
    }
  
    if (data.vX === undefined) {
      data.vX = (options.vX || 0);
    }
  
    if (data.vY === undefined) {
      data.vY = (options.vY || 0);
    }
  
    if (options.fireModulus !== undefined) {
      data.fireModulus = options.fireModulus;
    }
  
    return data;
  
  },

  inheritCSS(options) {

    // var defaults;
  
    options = options || {};
  
    if (options.animating === undefined) {
      options.animating = common.defaultCSS.animating;
    }
  
    if (options.dead === undefined) {
      options.dead = common.defaultCSS.dead;
    }
  
    if (options.enemy === undefined) {
      options.enemy = common.defaultCSS.enemy;
    }
  
    if (options.exploding === undefined) {
      options.exploding = common.defaultCSS.exploding;
    }
  
    return options;
  
  },

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

  removeNode(node) {

    // DOM pruning safety check: object dom references may include object -> parent node for items that died
    // while they were off-screen (e.g., infantry) and removed from the DOM, if pruning is enabled.
    // normally, all nodes would be removed as part of object clean-up. however, we don't want to remove
    // the battlefield under any circumstances. ;)
    if (useDOMPruning && node === game.objects.view.dom.battleField) return;

    // hide immediately, cheaply
    node.style.opacity = 0;

    game.objects.queue.add(() => {
      if (!node) return;
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
      node = null;
    });

  },

  removeNodeArray(nodeArray) {

    let i, j;

    j = nodeArray.length;

    // removal will invalidate layout, $$$. hide first, cheaply.
    for (i = 0; i < j; i++) {
      nodeArray[i].style.opacity = 0;
    }

    game.objects.queue.add(() => {

      for (i = 0; i < j; i++) {
        // TESTING: Does manually-removing transform before node removal help with GC? (apparently not.)
        // Chrome issue: https://code.google.com/p/chromium/issues/detail?id=304689
        // nodeArray[i].style.transform = 'none';
        nodeArray[i].parentNode.removeChild(nodeArray[i]);
        nodeArray[i] = null;
      }

      nodeArray = null;

    });

  },

  removeNodes(dom) {

    // remove all nodes in a structure
    let item;

    for (item in dom) {
      if (Object.prototype.hasOwnProperty.call(dom, item) && dom[item]) {
        // node reference, or array of nodes?
        if (dom[item] instanceof Array) {
          common.removeNodeArray(dom[item]);
        } else {
          common.removeNode(dom[item]);
        }
        dom[item] = null;
      }
    }

  },

  isOnScreen(target) {

    // is the target within the range of screen coordinates?
    return (
      target
      && target.data
      && (target.data.x + target.data.width) >= game.objects.view.data.battleField.scrollLeft
      && target.data.x < game.objects.view.data.battleField.scrollLeftWithBrowserWidth
    );
  
  },

  updateIsOnScreen(o, forceUpdate) {

    if (!o || !o.data || !useDOMPruning) return;
  
    if (common.isOnScreen(o) || forceUpdate) {
  
      // exit if not already updated
      if (o.data.isOnScreen) return;
  
      o.data.isOnScreen = true;
  
      // node may not exist
      if (!o.dom || !o.dom.o) return;
  
      if (o.dom.o._lastTransform) {
        // MOAR GPU! re-apply transform that was present at, or updated since, removal
        o.dom.o.style.transform = o.dom.o._lastTransform;
      }
  
      o.dom.o.style.contentVisibility = 'visible';
  
      if (o.dom._oRemovedParent) {
  
        // previously removed: re-append to DOM
        o.dom._oRemovedParent.appendChild(o.dom.o);
        o.dom._oRemovedParent = null;
  
      } else {
  
        // first-time append, first time on-screen
        game.dom.world.appendChild(o.dom.o);
  
      }
      
      // callback, if defined
      if (o.isOnScreenChange) {
        o.isOnScreenChange(o.data.isOnScreen);
      }
  
    } else if (o.data.isOnScreen) {
  
      o.data.isOnScreen = false;
  
      if (o.dom && o.dom.o) {
  
        // manually remove x/y transform, will be restored when on-screen.
        if (o.dom.o.style.transform) {
          // 'none' might be considered a type of transform per Chrome Dev Tools,
          // and thus incur an "inline transform" cost vs. an empty string.
          // notwithstanding, transform has a "value" and can be detected when restoring elements on-screen.
          o.dom.o._lastTransform = o.dom.o.style.transform;
          o.dom.o.style.transform = 'none';
        }
  
        if (o.dom.o.parentNode) {
          o.dom._oRemovedParent = o.dom.o.parentNode;
          o.dom._oRemovedParent.removeChild(o.dom.o);
        }
  
        o.dom.o.style.contentVisibility = 'hidden';
  
      }
  
      // callback, if defined
      if (o.isOnScreenChange) {
        o.isOnScreenChange(o.data.isOnScreen);
      }
  
    }
  
  },

  mixin(oMain, oAdd) {

    // edge case: if nothing to add, return "as-is"
    // if otherwise unspecified, `oAdd` is the default options object
    if (oAdd === undefined) return oMain;

    // the modern way
    return Object.assign(oMain, oAdd);

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
            common.mixin(smokeArgs, { vX: vectorX * 0.75, vY: vectorY * 0.75})
          ));
        }

        // third inner ring
        if (i % 3 === 0) {
          game.objects.smoke.push(Smoke(
            common.mixin(smokeArgs, { vX: vectorX * 0.66, vY: vectorY * 0.66})
          ));
        }

        // fourth inner ring
        if (i % 4 === 0) {
          game.objects.smoke.push(Smoke(
            common.mixin(smokeArgs, { vX: vectorX * 0.50, vY: vectorY * 0.50})
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