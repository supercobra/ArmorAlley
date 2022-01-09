import {
  utils,
  setFrameTimeout
} from '../aa.js';

const Notifications = () => {

  let css, data, dom, exports;

  function addNoRepeat(text, options = {}) {

    options = {
      ...options,
      noRepeat: true
    };

    return add(text, options);
  }

  function add(text, options) {
    /* options = { onRender, onComplete, type } */

    let i, j, item, isDuplicate, replacementItem, renderedText;

    options = options || {};

    if (!data.items) data.items = [];

    // account for duplicate / repeated items
    for (i = 0, j = data.items.length; i < j; i++) {
      item = data.items[i];

      // hackish: update item / node of same text, or matching type
      if (item && item.node && (item.text === text || (item.type && item.type === options.type))) {
        
        // ignore if newest (last) item is about to be repeated, and shouldn't be
        if (i === j - 1 && options.noRepeat) {
          isDuplicate = true;
          break;
        }

        item.count++;

        if (options.onRender) {
          renderedText = options.onRender(text);
          item.delay = calcDelay(renderedText);
        }

        // provided text, or, custom render function
        // if options.onRender(), that function gets called to do the work.
        // otherwise, plain text - and if options.onRepeat, don't show multiplier.
        item.node.innerHTML = `<span>${options.onRender ? renderedText : ( item.text + (options.noRepeat ? '' : ` × ${item.count}`))}</span>`;

        // clear, start new timer
        if (item.timer) {
          item.timer.reset();
          item.timer = setFrameTimeout(displayItemComplete, item.delay);
        }

        replacementItem = item;

        break;
      }
    }

    // the last item was going to be repeated
    if (isDuplicate) return;

    if (replacementItem) return replacementItem;

    item = {
      text,
      count: 1,
      node: null,
      delay: calcDelay(text),
      doubleHeight: options.doubleHeight,
      onComplete: options.onComplete,
      onRender: options.onRender,
      timer: null,
    };

    data.items.push(item);

    showItem(item);

  }

  function calcDelay(text) {

    // number of words / letters? let's say 240 WPM, 4 words per second as an optimum.
    let delay, defaultDelay, delayPerWord, maxDelay;

    defaultDelay = 2000;
    delayPerWord = 1000;
    maxDelay = 5000;

    // just in case
    if (!text || !text.length || text.indexOf(' ') === -1) return defaultDelay;

    // hackish: if "NSF", return special delay
    if (text.match(/nsf/i)) return maxDelay / 2;

    // e.g., `this is a test` = 4 * delayPerWord - stripping HTML, also.
    delay = Math.min(text.replace('/<(.|\n)*?>/', '').split(' ').length * delayPerWord, maxDelay);

    return delay;

  }

  function showItem(item) {

    let oToast;

    // show, and queue the next check.
    oToast = document.createElement('div');
    oToast.className = css.notificationToast;

    if (item.doubleHeight) utils.css.add(oToast, css.doubleHeight);

    oToast.innerHTML = `<span>${item.onRender ? item.onRender(item.text) : item.text}</span>`;

    dom.oToasts.appendChild(oToast);

    // delay required for transition to work
    setFrameTimeout(() => {
      utils.css.add(oToast, css.toastActive);
    }, 96);

    // assign for later node removal
    item.node = oToast;

    // these can pile up. display immediately but process one at a time, FIFO.
    if (!data.isDisplaying) {
      data.isDisplaying = true;
      item.timer = setFrameTimeout(displayItemComplete, item.delay);
    }

  }

  function displayItemComplete() {

    let item;

    if (!data.items.length) {
      data.isDisplaying = false;
      return;
    }

    item = data.items.shift();

    // slide contents out of view, to the right
    // utils.css.remove(item.node, css.toastActive);
    utils.css.add(item.node, css.toastExpiring);

    if (item.onComplete) {
      item.onComplete();
    }

    // collapse height, and then disappear.
    setFrameTimeout(() => {
      utils.css.add(item.node, css.toastExpired);
      setFrameTimeout(() => {
        item.node.parentNode.removeChild(item.node);
      }, 500);
    }, 500);

    if (!data.items.length) {
      // all done.
      data.isDisplaying = false;
    } else {
      // we're onto the next one.
      // queue its removal.
      setFrameTimeout(displayItemComplete, data.items[0].delay);
    }

  }

  function initDOM() {
    dom.oToasts = document.getElementById('notification-toasts');
  }

  css = {
    doubleHeight: 'double-height',
    notificationToast: 'notification-toast',
    toastActive: 'toast-active',
    toastExpiring: 'toast-expiring',
    toastExpired: 'toast-expired'
  };

  data = {
    items: [],
    isDisplaying: false
  };

  dom = {
    oToasts: null
  }

  initDOM();

  exports = {
    add,
    addNoRepeat
  };

  return exports;
  
}

export { Notifications };