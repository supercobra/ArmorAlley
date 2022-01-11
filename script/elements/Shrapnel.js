import {
  game,
  inheritData,
  inheritCSS,
  utils,
  makeSprite,
  setFrameTimeout,
  rnd,
  rndInt,
  collisionTest,
  plusMinus,
  makeTransformSprite
} from '../aa.js';

import { common } from '../core/common.js';

import {
  TYPES,
  worldHeight
} from '../core/global.js';

import {
  playSound,
  sounds
} from '../core/sound.js';

import { Smoke } from './Smoke.js';

const Shrapnel = options => {

  let css, dom, data, collision, radarItem, scale, exports;

  function moveTo(x, y) {

    let relativeScale;

    if (common.updateXY(exports, x, y)) {
      // shrapnel is magnified somewhat when higher on the screen, "vaguely" 3D
      relativeScale = Math.min(1, data.y / (worldHeight * 0.9));

      // allow slightly larger, and a fair bit smaller
      relativeScale = 1.1 - (relativeScale * 0.45);

      data.scaleTransform = `scale3d(${[relativeScale, relativeScale, 1].join(',')})`

      // move, and retain 3d scaling
      common.setTransformXY(exports, dom.o, `${data.x}px`, `${data.y}px`, data.scaleTransform);
    }

  }

  function shrapnelNoise() {

    if (!data.hasSound) return;

    const i = `hit${sounds.shrapnel.counter}`;

    sounds.shrapnel.counter += (sounds.shrapnel.counter === 0 && Math.random() > 0.5 ? 2 : 1);

    if (sounds.shrapnel.counter >= sounds.shrapnel.counterMax) {
      sounds.shrapnel.counter = 0;
    }

    if (sounds.shrapnel[i]) {
      playSound(sounds.shrapnel[i], exports);
    }

  }

  function die() {

    if (data.dead) return;

    shrapnelNoise();

    utils.css.add(dom.o, css.stopped);

    data.deadTimer = setFrameTimeout(() => {
      common.removeNodes(dom);
      data.deadTimer = null;
    }, 750);

    data.energy = 0;

    data.dead = true;

    if (radarItem) {
      radarItem.die({
        silent: true
      });
    }

  }

  function hitAndDie(target) {

    let targetType, damageTarget = true;

    if (!target) {
      die();
      return;
    }

    // hackish: there was a collision, but "pass-thru" if the target says to ignore shrapnel.
    // e.g., parachute infantry dropped from a helicopter while it's exploding mid-air,
    // so the infantry doesn't die and the shrapnel isn't taken out in the process.
    if (target.data.ignoreShrapnel) return;

    // shrapnel hit something; what should it sound like, if anything?
    targetType = target.data.type;

    if (targetType === TYPES.helicopter) {
      playSound(sounds.boloTank, exports);
    } else if (targetType === TYPES.tank || targetType === TYPES.superBunker) {
      // shrapnel -> [tank | superbunker]: no damage.
      damageTarget = false;

      // ricochet if shrapnel is connected to "sky" units (helicopter, balloon etc.)
      // otherwise, die silently. this helps prevent ground units' shrapnel from causing mayhem with neighbouring tanks etc.
      if (data.ricochetTypes.includes(data.parentType)) {
        ricochet(targetType);
        // bail early, don't die
        return;
      }
    } else if (utils.array.includes(sounds.types.metalHit, targetType)) {
      playSound(sounds.metalHit, exports);
    } else if (utils.array.includes(sounds.types.genericSplat, targetType)) {
      playSound(sounds.genericSplat, exports);
    }

    if (damageTarget) {
      common.hit(target, data.damagePoints);
    }

    die();

  }

  function ricochet(targetType) {

    // bounce upward if ultimately heading down
    if ((data.vY + data.gravity) <= 0) return;

    // at least...
    data.vY = Math.max(data.vY, data.maxVY / 6);

    // but no more than...
    data.vY = Math.min(data.vY, data.maxVY / 3);

    // ensure we end negative, and lose (or gain) a bit of velocity
    data.vY = Math.abs(data.vY) * -data.rndRicochetAmount;

    // sanity check: don't get stuck "inside" tank or super bunker sprites.
    // ensure that the shrapnel stays at or above the height of both.
    data.y = Math.min(worldHeight - ((common.ricochetBoundaries[targetType]) || 16), data.y);

    // randomize vX strength, and randomly reverse direction.
    data.vX += Math.random();
    data.vX *= (Math.random() > 0.75 ? -1 : 1);

    // and, throttle
    if (data.vX > 0) {
      data.vX = Math.min(data.vX, data.maxVX);
    } else {
      data.vX = Math.max(data.vX, data.maxVX * -1);
    }

    // reset "gravity" effect, too.
    data.gravity = 1;

    // data.y may have been "corrected" - move again, just to be safe.
    moveTo(data.x + data.vX, data.y + (Math.min(data.maxVY, data.vY + data.gravity)));

    playSound(sounds.ricochet, exports);

  }

  function animate() {

    if (data.dead) return (!data.deadTimer && !dom.o);

    moveTo(data.x + data.vX, data.y + (Math.min(data.maxVY, data.vY + data.gravity)));

    // random: smoke while moving?
    if (data.isOnScreen && Math.random() >= 0.99) {
      makeSmoke();
    }

    // did we hit the ground?
    if (data.y - data.height >= worldHeight) {
      moveTo(data.x + data.vX, worldHeight);
      die();
    }

    // collision check
    collisionTest(collision, exports);

    data.gravity *= data.gravityRate;

    data.frameCount++;

    return (data.dead && !data.deadTimer && !dom.o);

  }

  function makeSmoke() {

    game.objects.smoke.push(Smoke({
      x: data.x + 6 + rnd(6) * 0.33 * plusMinus(),
      y: data.y + 6 + rnd(6) * 0.33 * plusMinus(),
      vX: rnd(6) * plusMinus(),
      vY: rnd(-5),
      spriteFrame: rndInt(5)
    }));

  }

  function initShrapnel() {

    dom.o = makeSprite({
      className: css.className + (Math.random() > 0.5 ? ` ${css.reverse}` : '')
    });

    dom.oTransformSprite = makeTransformSprite();
    dom.o.appendChild(dom.oTransformSprite);

    common.setTransformXY(exports, dom.o, `${data.x}px`, `${data.y}px`);

    // apply the type of shrapnel, reversing any scaling (so we get the original pixel dimensions)
    dom.oTransformSprite.style.backgroundPosition = `${data.spriteType * -data.width * 1 / data.scale}px 0px`;

    // spinning animation duration?
    dom.oTransformSprite.style.animationDuration = `${0.2 + Math.random()}s`;

    if (Math.random() >= 0.5) {
      dom.oTransformSprite.style.animationDirection = 'reverse';
    }

    radarItem = game.objects.radar.addItem(exports, dom.o.className);

    if (data.isEnemy) {
      utils.css.add(radarItem.dom.o, css.enemy);
    }

    // special case for end game (base) explosion: don't create identical "clouds" of smoke *at* base.
    if (data.isOnScreen && !options.noInitialSmoke) {
      makeSmoke();
    }

    shrapnelNoise();

  }

  options = options || {};

  // default
  scale = options.scale || (0.8 + rnd(0.15));

  css = inheritCSS({
    className: 'shrapnel',
    reverse: 'reverse',
    stopped: 'stopped'
  });

  data = inheritData({
    type: 'shrapnel',
    parentType: (options.type || null),
    frameCount: 0,
    spriteType: rndInt(4),
    direction: 0,
    // sometimes zero / non-moving?
    vX: options.vX || 0,
    vY: options.vY || 0,
    maxVX: 36,
    maxVY: 32,
    gravity: 1,
    // randomize fall rate
    gravityRate: 1.06 + rnd(0.05),
    width: 12 * scale,
    height: 12 * scale,
    scale,
    scaleTransform: `scale3d(${[scale, scale, 1].join(',')})`,
    hostile: true,
    damagePoints: 0.5,
    hasSound: !!options.hasSound,
    rndRicochetAmount: 0.5 + Math.random(),
    // let shrapnel that originates "higher up in the sky" from the following types, bounce off tanks and super bunkers
    ricochetTypes: [TYPES.balloon, TYPES.helicopter, TYPES.smartMissile],
  }, options);

  dom = {
    o: null,
    oTransformSprite: null,
  };

  exports = {
    animate,
    data,
    dom,
    die
  };

  collision = {
    options: {
      source: exports,
      targets: undefined,
      hit(target) {
        hitAndDie(target);
      }
    },
    items: ['superBunkers', 'bunkers', 'helicopters', 'balloons', 'tanks', 'vans', 'missileLaunchers', 'infantry', 'parachuteInfantry', 'engineers', 'smartMissiles', 'turrets']
  };

  initShrapnel();

  return exports;

};

export { Shrapnel };