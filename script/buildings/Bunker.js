import { game } from '../core/Game.js';
import { utils } from '../core/utils.js';
import { common } from '../core/common.js';
import { rndInt, rnd, TYPES, FPS } from '../core/global.js';
import { collisionCheckMidPoint, checkProduction } from '../core/logic.js';
import { playSound, playSoundWithDelay, sounds } from '../core/sound.js';
import { Balloon } from '../elements/Balloon.js';
import { Chain } from '../elements/Chain.js';
import { zones } from '../core/zones.js';
import { sprites } from '../core/sprites.js';
import { effects } from '../core/effects.js';

const Bunker = (options = {}) => {

  let css, data, dom, objects, radarItem, exports;

  function createBalloon(useRandomY) {

    if (!objects.balloon) {

      objects.balloon = game.addObject(TYPES.balloon, {
        bunker: exports,
        leftMargin: 8,
        isEnemy: data.isEnemy,
        x: data.x,
        y: (useRandomY ? undefined : common.bottomAlignedY(-data.height))
      });

    }

    if (!objects.chain) {

      // create a chain, linking the base and the balloon
      objects.chain = game.addObject(TYPES.chain, {
        isEnemy: data.isEnemy,
        x: data.x + (data.halfWidth - 1),
        y: data.y,
        height: data.y - objects.balloon.data.y,
        balloon: objects.balloon,
        bunker: exports
      });

      // balloon <-> chain
      objects?.balloon?.attachChain(objects.chain);

    }

  }

  function capture(isEnemy) {

    if (isEnemy) {

      utils.css.add(dom.o, css.enemy);
      utils.css.add(radarItem.dom.o, css.enemy);

      game.objects.notifications.add('The enemy captured a bunker 🚩');

      playSoundWithDelay(sounds.enemyClaim, exports, 500);

    } else {

      utils.css.remove(dom.o, css.enemy);
      utils.css.remove(radarItem.dom.o, css.enemy);

      // first time capture (of original bunker state) vs. taking back from the enemy
      if (!data.isRecapture) {
        game.objects.notifications.add('You captured a bunker ⛳');
        data.isRecapture = true;
      } else {
        game.objects.notifications.add('You recaptured a bunker ⛳');
      }

      playSoundWithDelay(sounds.friendlyClaim, exports, 500);

    }

    data.isEnemy = isEnemy;

    zones.changeOwnership(exports);

    // and the balloon, too.
    objects?.balloon?.setEnemy(isEnemy);

    playSound(sounds.doorClose, exports);

    // check if enemy convoy production should stop or start
    checkProduction();

  }

  function engineerRepair(engineer) {

    if (data.energy < data.energyMax) {
      // stop, and don't fire
      engineer.stop(true);
      data.energy = Math.min(data.energy + 0.05, data.energyMax);
    } else {
      // repair complete - keep moving
      engineer.resume();
    }

    sprites.updateEnergy(exports);

  }

  function repair() {

    // fix the balloon, if it's broken - or, rather, flag it for respawn.
    if (objects.balloon) {

      if (objects.balloon.data.dead) {
        objects.balloon.data.canRespawn = true;
      }

    } else {

      // make a new one
      createBalloon();

    }

  }

  function nullifyChain() {
    objects.chain = null;
  }

  function nullifyBalloon() {
    objects.balloon = null;
  }

  function detachBalloon() {

    // update height of chain in the DOM, assuming it's
    // attached to the balloon now free from the base.
    // once height is assigned, the chain will either
    // hang from the balloon it's attached to, OR, will
    // fall due to gravity (i.e., no base, no balloon.)
    objects?.chain?.applyHeight();

    if (objects.balloon) {
      objects.balloon.attachChain(objects.chain);
      objects.balloon.detachFromBunker();
      objects.chain?.detachFromBunker();
      nullifyBalloon();
    }

  }

  function removeNukeSprite() {

    if (!dom?.oSubSpriteNuke) return;

    dom.oSubSpriteNuke.remove();
    dom.oSubSpriteNuke = null;

  }

  function die(dieOptions = {}) {

    if (data.dead) return;

    // if off-screen, just avoid the nuke entirely.
    if (!data.isOnScreen) {
      removeNukeSprite();
    }

    utils.css.add(dom.o, css.exploding);

    effects.damageExplosion(exports);

    effects.domFetti(exports, dieOptions.attacker);

    effects.smokeRing(exports, {
      count: 24,
      velocityMax: 16,
      offsetY: data.height - 2,
      isGroundUnit: true
    });

    detachBalloon();

    const rndXY = 1 + rnd(1);

    effects.shrapnelExplosion(data, { count: 16 + rndInt(24), velocity: (3 + rnd(3)), bottomAligned: true });
    effects.inertGunfireExplosion({ exports, count: 16 + rndInt(8), vX: rndXY, vY: rndXY });

    /**
     * ******* T R O G D O R ! ! ! *******
     * --------------- 💪🐉 ---------------
     * Burninating the countryside
     * Burninating the peasants
     * Burninating all the peoples
     * And their thatched-roof cottages!
     * Thatched-roof cottages!
     * http://www.hrwiki.org/wiki/Trogdor_(song)
     */
    data.burninating = true;

    // create and append rubbleContainer -> rubble nodes
    let rubbleContainer = sprites.makeSubSprite(css.rubbleContainer);
    let rubble = sprites.makeSubSprite(css.rubble);

    rubbleContainer.appendChild(rubble);
    dom.o.appendChild(rubbleContainer);

    // no longer needed. ;)
    dom.oArrow.remove();
    dom.oArrow = null;

    common.setFrameTimeout(() => {

      // slight delay before swapping in burning animation
      utils.css.swap(dom.o, css.exploding, css.burning);

      // start "burning out"...
      common.setFrameTimeout(() => {

        // match transition to timer...
        rubble.style.transitionDuration = ((burninatingTime * burnOutFade) / 1000) + 's';

        utils.css.add(dom.o, css.burningOut);

        // and eventually exinguish.
        common.setFrameTimeout(() => {

          data.burninating = false;

          utils.css.swap(dom.o, css.burning, css.dead);
          utils.css.swap(dom.o, css.burningOut, css.dead);

          // drop nodes
          rubbleContainer.remove();
          rubble = null;
          rubbleContainer = null;

        }, burninatingTime * burnOutFade);

      }, burninatingTime);

    }, 1200);

    // prevent this animation from re-appearing once played,
    // e.g., if bunker goes off / on-screen.
    common.setFrameTimeout(removeNukeSprite, 2000);

    data.energy = 0;

    data.dead = true;

    if (sounds.explosionLarge) {
      playSound(sounds.crashAndGlass, exports);
      playSound(sounds.explosionLarge, exports);
      playSound(sounds.nuke, exports);
    }

    // check if enemy convoy production should stop or start
    checkProduction();

    radarItem.die();

  }

  function animate() {

    sprites.moveWithScrollOffset(exports);

    if (!data.dead) {

      effects.smokeRelativeToDamage(exports);

    } else if (data.burninating) {

      if (data.smokeFramesLeft) {
        effects.smokeRelativeToDamage(exports, data.smokeFramesLeft / data.smokeFramesMax);
        data.smokeFramesLeft--;
      }

    }

  }

  function engineerHit(target) {

    // a friendly engineer unit has made contact with a bunker. repair damage when at the door, if any.
    if (target.data.isEnemy === data.isEnemy && collisionCheckMidPoint(exports, target)) {
      engineerRepair(target);
    }
   
  }

  function infantryHit(target) {

    // an infantry unit has made contact with a bunker.
    if (target.data.isEnemy === data.isEnemy) {

      // a friendly passer-by.
      repair();

    } else if (collisionCheckMidPoint(target, exports)) {

      // non-friendly, kill the infantry - but let them capture the bunker first.
      capture(target.data.isEnemy);
      target.die({ silent: true });

    }

  }

  function initDOM() {

    dom.o = sprites.create({
      className: css.className,
      isEnemy: (data.isEnemy ? css.enemy : false)
    });

    dom.oArrow = dom.o.appendChild(sprites.makeSubSprite(css.arrow));
    
    dom.oSubSpriteNuke = dom.o.appendChild(sprites.makeSubSprite(css.nuke));

    data.oClassName = dom.o.className;

    // note hackish Y-offset, sprite position vs. collision detection
    sprites.setTransformXY(exports, exports.dom.o, `${data.x}px`, `${data.y - 3}px`);

  }

  function initBunker() {

    initDOM();

    // first time, create at random Y location.
    createBalloon(true);

    data.midPoint = common.getDoorCoords(exports);

    radarItem = game.objects.radar.addItem(exports, data.oClassName);

  }

  css = common.inheritCSS({
    className: TYPES.bunker,
    arrow: 'arrow',
    burning: 'burning',
    burningOut: 'burning-out',
    rubbleContainer: 'rubble-container',
    rubble: 'rubble',
    nuke: 'nuke'
  });

  // how long bunkers take to "burn out"
  const burninatingTime = 10000;
  const burnOutFade = 0.5;

  const smokeFrames = ((burninatingTime + (burninatingTime * burnOutFade * 0.85)) / 1000) * FPS;

  data = common.inheritData({
    type: TYPES.bunker,
    y: (game.objects.view.data.world.height - 25) - 2, // override to fix helicopter / bunker vertical crash case
    smokeFramesLeft: parseInt(smokeFrames, 10),
    smokeFramesMax: smokeFrames,
    energy: 50,
    energyMax: 50,
    energyLineScale: 0.95,
    centerEnergyLine: true,
    isRecapture: false,
    width: 51,
    halfWidth: 25,
    height: 25,
    halfHeight: 12.5,
    midPoint: null,
    domFetti: {
      colorType: 'yellow',
      elementCount: 100 + rndInt(100),
      startVelocity: 15 + rndInt(15),
      spread: 180,
      decay: 0.94
    }
  }, options);

  dom = {
    o: null,
    oArrow: null,
    oSubSpriteNuke: null
  };

  objects = {
    balloon: null,
    chain: null,
    helicopter: null
  };

  exports = {
    animate,
    capture,
    objects,
    data,
    die,
    dom,
    engineerHit,
    infantryHit,
    init: initBunker,
    nullifyChain,
    nullifyBalloon,
    repair
  };

  return exports;

};

export { Bunker };