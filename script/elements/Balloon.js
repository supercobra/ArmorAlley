import {
  common,
  game,
  inheritData,
  inheritCSS,
  TYPES,
  updateEnergy,
  utils,
  shrapnelExplosion,
  setFrameTimeout,
  makeSprite,
  gameType,
  rndInt,
  plusMinus,
  bottomAlignedY,
  worldWidth
} from '../aa.js';

import {
  playSound,
  sounds
} from '../core/sound.js';

const Balloon = options => {

  let css, data, dom, height, objects, radarItem, reset, exports;

  function checkRespawn() {

    // odd edge case - data not always defined if destroyed at the right time?
    if (data && data.canRespawn && data.dead && objects.bunker && objects.bunker.data && !objects.bunker.data.dead) {
      reset();
    }

  }

  function setEnemy(isEnemy) {

    data.isEnemy = isEnemy;

    if (isEnemy) {
      utils.css.remove(dom.o, css.friendly);
      utils.css.add(dom.o, css.enemy);
    } else {
      utils.css.remove(dom.o, css.enemy);
      utils.css.add(dom.o, css.friendly);
    }

    // apply CSS animation effect, and stop/remove in one second.
    // this prevents the animation from replaying when switching
    // between on / off-screen.
    utils.css.add(dom.o, css.animating);

    data.frameTimeout = setFrameTimeout(() => {
      if (!dom.o) return;
      utils.css.remove(dom.o, css.animating);
      data.frameTimeout = null;
    }, 1200);

  }

  function detach() {

    if (data.detached) return;

    data.detached = true;

    // and become hostile.
    data.hostile = true;

    // disconnect bunker <-> balloon references
    if (objects.bunker) {
      objects.bunker.nullifyBalloon();
      objects.bunker = null;
    }

  }

  function die() {

    if (data.dead) return;

    // pop!
    utils.css.add(dom.o, css.exploding);

    if (sounds.balloonExplosion) {
      playSound(sounds.balloonExplosion, exports);
    }

    common.inertGunfireExplosion({ exports });

    common.smokeRing(exports, { parentVX: data.vX, parentVY: data.vY });

    if (gameType === 'hard' || gameType === 'extreme') {
      shrapnelExplosion(data, {
        count: 3 + rndInt(3),
        velocity: rndInt(4)
      });
    }

    // sanity check: balloon may be almost immediately restored
    // if shot while a group of infantry are passing by the bunker,
    // so only "finish" dying if still dead.

    // radar die -> hide has its own timeout, it will check
    // the parent (i.e., this) balloon's `data.dead` before hiding.
    radarItem.die();

    data.deadTimer = setFrameTimeout(() => {
      data.deadTimer = null;

      // sanity check: don't hide if already respawned
      if (!data.dead) return;

      if (dom.o) {
        // hide the balloon
        utils.css.swap(dom.o, css.exploding, css.dead);
      }
    }, 550);

    data.dead = true;

  }

  function applyAnimatingTransition() {

    // balloons might be off-screen, then return on-screen
    // and will not animate unless explicitly enabled.
    // this adds the animation class temporarily.
    if (!dom?.o) return;

    // enable transition (balloon turning left or right, or dying.)
    utils.css.add(dom.o, css.animating);

    // reset, if previously queued.
    if (data.animationFrameTimeout) {
      data.animationFrameTimeout.reset();
    }

    data.animationFrameTimeout = setFrameTimeout(() => {
      data.animationFrameTimeout = null;
      // balloon might have been destroyed.
      if (!dom?.o) return;
      utils.css.remove(dom.o, css.animating);
      data.frameTimeout = null;
    }, 1200);

  }

  function animate() {

    if (data.dead) {

      if (data.y > 0) {

        // dead, but chain has not retracted yet. Make sure it's moving down.
        if (data.verticalDirection > 0) {
          data.verticalDirection *= -1;
        }

        common.moveTo(exports, data.x, data.y + data.verticalDirection);

      }

      checkRespawn();

      return;

    }

    // not dead...

    common.smokeRelativeToDamage(exports, 0.25);

    if (!data.detached) {

      // move relative to bunker

      if ((data.y >= data.maxY && data.verticalDirection > 0) || (data.y <= data.minY && data.verticalDirection < 0)) {
        data.verticalDirection *= -1;
      }

      common.moveTo(exports, data.x, data.y + data.verticalDirection);

    } else {

      // free-floating balloon

      data.frameCount++;

      if (data.frameCount % data.windModulus === 0) {

        data.windOffsetX += (plusMinus() * 0.25);

        data.windOffsetX = Math.max(-3, Math.min(3, data.windOffsetX));

        if (data.windOffsetX > 0 && data.direction !== 1) {

          // heading right
          utils.css.remove(dom.o, css.facingLeft);
          utils.css.add(dom.o, css.facingRight);

          applyAnimatingTransition();

          data.direction = 1;

        } else if (data.windOffsetX < 0 && data.direction !== -1) {

          // heading left
          utils.css.remove(dom.o, css.facingRight);
          utils.css.add(dom.o, css.facingLeft);

          applyAnimatingTransition();

          data.direction = -1;

        }

        data.windOffsetY += (plusMinus() * 0.05);

        data.windOffsetY = Math.max(-0.5, Math.min(0.5, data.windOffsetY));

        // and randomize
        data.windModulus = 32 + rndInt(32);

      }

      // if at end of world, change the wind and prevent randomization until within world limits
      // this allows balloons to drift a little over, but they will return.
      if (data.x + data.windOffsetX >= data.maxX) {
        data.frameCount = 0;
        data.windOffsetX -= 0.1;
      } else if (data.x + data.windOffsetX <= data.minX) {
        data.frameCount = 0;
        data.windOffsetX += 0.1;
      }

      // limit to screen, too
      if (data.y + data.windOffsetY >= data.maxY) {
        data.frameCount = 0;
        data.windOffsetY -= 0.1;
      } else if (data.y + data.windOffsetY <= data.minY) {
        data.frameCount = 0;
        data.windOffsetY += 0.1;
      }

      // hackish: enforce world min/max limits
      common.moveTo(exports, data.x + data.windOffsetX, data.y + data.windOffsetY);

    }

  }

  reset = () => {

    // respawn can actually happen now

    data.energy = data.energyMax;

    // restore default vertical
    data.verticalDirection = data.verticalDirectionDefault;

    // look ma, no longer dead!
    data.dead = false;

    // reset position, too
    data.y = bottomAlignedY(-data.height);

    radarItem.reset();

    data.canRespawn = false;

    if (data.deadTimer) {
      data.deadTimer.reset();
      data.deadTimer = null;
    }

    // update UI, right away?
    animate();

    utils.css.remove(dom.o, css.exploding);
    utils.css.remove(dom.o, css.dead);

    updateEnergy(exports);

    // presumably, triggered by an infantry.
    if (sounds.chainRepair) {
      playSound(sounds.chainRepair, exports);
    }

  };

  function initBalloon() {

    dom.o = makeSprite({
      className: css.className
    });

    if (data.isEnemy) {
      utils.css.add(dom.o, css.enemy);
    }

    // TODO: remove?
    dom.o.style.marginLeft = `${data.leftMargin}px`;

    common.moveTo(exports, data.x, data.y);

    if (!objects.bunker) {
      detach();
    }

    // TODO: review hacky "can respawn" parameter
    radarItem = game.objects.radar.addItem(exports, dom.o.className, true);

  }

  options = options || {};

  height = 16;

  css = inheritCSS({
    className: TYPES.balloon,
    friendly: 'facing-right',
    enemy: 'facing-left',
    facingLeft: 'facing-left',
    facingRight: 'facing-right'
  });

  data = inheritData({
    type: TYPES.balloon,
    canRespawn: false,
    frameCount: 0,
    windModulus: 16,
    windOffsetX: 0,
    windOffsetY: 0,
    energy: 3,
    energyMax: 3,
    direction: 0,
    detached: false,
    hostile: false, // dangerous when detached
    verticalDirection: 1,
    verticalDirectionDefault: 1,
    leftMargin: options.leftMargin || 0,
    width: 38,
    height,
    halfWidth: 19,
    halfHeight: height / 2,
    deadTimer: null,
    minX: 0,
    maxX: worldWidth,
    minY: 48,
    // don't allow balloons to fly into ground units, generally speaking
    maxY: game.objects.view.data.world.height - height - 32
  }, options);

  dom = {
    o: null
  };

  objects = {
    bunker: options.bunker || null
  };

  exports = {
    animate,
    data,
    detach,
    die,
    dom,
    reset,
    setEnemy
  };

  initBalloon();

  return exports;

};

export { Balloon };