window.addEventListener('DOMContentLoaded', main);

const SELECTORS = {
  CLOCK: '#clock',
  MINUTE_HAND: '#minute-hand'
};

const STATES = {
  AUTOMATIC: 'automatic',
  MANIPULATING_RUN: 'manipulating run',
  MANIPULATING_STOP: 'manipulating stop'
};


function main() {
  app.init();
}

const app = {
  init: function() {
    this.clock.init();
    this.minuteHand.init();
    this.setCurrentState(STATES.AUTOMATIC);
  },
  currentState: null,
  setCurrentState: function(state) {
    console.log('SET', state);
    switch (state) {
      case STATES.AUTOMATIC:
        this.currentState = state;
        this.clock.setGlobalTimePeriodically.run();

        break;

      case STATES.MANIPULATING_RUN:
        if (this.currentState === STATES.AUTOMATIC) {
          this.clock.setGlobalTimePeriodically.stop();
        }

        document.addEventListener('mousemove', this.minuteHand.onMouseMove);
        document.onmouseup = () =>
          this.setCurrentState(STATES.MANIPULATING_STOP);

        this.currentState = state;
        break;

      case STATES.MANIPULATING_STOP:
        if (this.currentState === STATES.AUTOMATIC) {
          this.clock.setGlobalTimePeriodically.stop();
        }

        if (this.currentState === STATES.MANIPULATING_RUN) {
          document.removeEventListener("mousemove", this.minuteHand.onMouseMove);
          document.onmouseup = null;
        }

        this.currentState = state;
        break;

      default:
        break;
    }
  },
  clock: {
    init: function() {
      this.element = document.querySelector(SELECTORS.CLOCK);
      this.domRect = this.element.getBoundingClientRect();
      this.setGlobalTimePeriodically = getPeriodicProcess(() => this.setGlobalTime(), 1000);
      this.checkIfXYInside = getCheckIfCoordsInBoundingClientRect(this.domRect);
    },
    element: null,
    domRect: null,
    setClockCustomProperty: function(name, value) {
      this.element && this.element.style.setProperty(`--${name}`, value);
    },
    setClockTime: function(time) {
      this.setClockCustomProperty('hours', time.getHours());
      this.setClockCustomProperty('minutes', time.getMinutes());
    },
    setGlobalTime: function() {
      this.setClockTime(new Date());
    },
    setGlobalTimePeriodically: null,
    checkIfXYInside: null,
  },
  minuteHand: {
    init: function() {
      this.element = document.querySelector(SELECTORS.MINUTE_HAND);
      this.element.ondragstart = () => false;
      this.element.onmousedown = this.onMouseDownHandler;
    },
    onMouseDownHandler: function(e) {
      e.preventDefault();
      e.stopPropagation();
      app.setCurrentState(STATES.MANIPULATING_RUN);
      const { clientX, clientY } = e;
      console.log('START', clientX, clientY);
    },
    element: null,
    onMouseMove: function(e) {
      const { clientX, clientY } = e;
      if (!app.clock.checkIfXYInside(clientX, clientY)) {
        app.setCurrentState(STATES.MANIPULATING_STOP);
        return;
      }
      console.log('NEW', clientX, clientY);
    },
  }
};

function getPeriodicProcess(fn, period = 1000) {
  return {
    isRunning: false,
    timerId: null,
    run: function() {
      if (!this.isRunning) {
        this.timerId = setInterval(() => fn(), period);
        this.isRunning = true;
      }
    },
    stop: function() {
      if (this.isRunning) {
        clearTimeout(this.timerId);
        this.isRunning = false;
      }
    }
  };
}

function getCheckIfCoordsInBoundingClientRect(rect) {
  return (x, y) =>
    x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}