import {
  game,
  utils,
  setFrameTimeout
} from '../aa.js';

function RadarItem(options) {

  let css, data, dom, oParent, exports;

  function dieComplete() {

    game.objects.radar.removeItem(exports);
    dom.o = null;
    options.o = null;

  }

  function die(dieOptions) {

    if (data.dead) return;

    if (!dieOptions?.silent) {
      utils.css.add(dom.o, css.dying);
    }

    game.objects.stats.destroy(exports);

    data.dead = true;

    if (!options.canRespawn) {

      // permanent removal
      if (dieOptions?.silent) {

        // bye bye! (next scheduled frame)
        setFrameTimeout(dieComplete, 1);

      } else {

        setFrameTimeout(dieComplete, 2000);

      }

    } else {

      // balloon, etc.
      setFrameTimeout(() => {
        // only do this if the parent (balloon) is still dead.
        // it may have respawned almost immediately by passing infantry.
        if (!oParent?.data?.dead) return;
        utils.css.add(dom.o, css.dead);
      }, 1000);

    }

  }

  function reset() {

    if (!data.dead) return;

    utils.css.remove(dom.o, css.dying);
    utils.css.remove(dom.o, css.dead);
    data.dead = false;

    // reset is the same as creating a new object.
    game.objects.stats.create(exports);

  }

  function initRadarItem() {
    // string -> array as params
    const classNames = options.className.split(' ');
    utils.css.add(dom.o, css.radarItem, ...classNames);
  }

  css = {
    radarItem: 'radar-item',
    dying: 'dying',
    dead: 'dead'
  };

  data = {
    type: 'radar-item',
    parentType: options.parentType,
    className: options.className,
    dead: false
  };

  dom = {
    o: options.o
  };

  oParent = options.oParent;

  initRadarItem();

  exports = {
    data,
    dom,
    die,
    oParent,
    reset
  };

  return exports;

}

export { RadarItem };