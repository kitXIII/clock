window.addEventListener("DOMContentLoaded", main);

const SELECTORS = {
  CLOCK: "#clock",
  MINUTE_HAND: "#minute-hand"
};

const STATES = {
  AUTOMATIC: "automatic",
  MANIPULATING_RUN: "manipulating run",
  MANIPULATING_STOP: "manipulating stop"
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
    console.log("SET", state);
    switch (state) {
      case STATES.AUTOMATIC:
        this.currentState = state;
        this.clock.setGlobalTimePeriodically.run();

        break;

      case STATES.MANIPULATING_RUN:
        if (this.currentState === STATES.AUTOMATIC) {
          this.clock.setGlobalTimePeriodically.stop();
        }

        document.addEventListener("mousemove", this.minuteHand.onMouseMove);
        document.onmouseup = () =>
          this.setCurrentState(STATES.MANIPULATING_STOP);

        this.currentState = state;
        break;

      case STATES.MANIPULATING_STOP:
        if (this.currentState === STATES.AUTOMATIC) {
          this.clock.setGlobalTimePeriodically.stop();
        }

        if (this.currentState === STATES.MANIPULATING_RUN) {
          document.removeEventListener(
            "mousemove",
            this.minuteHand.onMouseMove
          );
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
      this.center = getClientRectCenter(this.domRect);
      this.setGlobalTimePeriodically = getPeriodicProcess(
        () => this.setGlobalTime(),
        1000
      );
      this.checkIfXYInside = getCheckIfCoordsInBoundingClientRect(this.domRect);
    },
    element: null,
    domRect: null,
    center: {
      x: 0,
      y: 0
    },
    currentTime: {
      hours: 0,
      minutes: 0
    },
    setClockCustomProperty: function(name, value) {
      this.element && this.element.style.setProperty(`--${name}`, value);
    },
    setClockTime: function(hours, minutes) {
      this.currentTime.hours = hours;
      this.currentTime.minutes = minutes;
      this.setClockCustomProperty("hours", hours);
      this.setClockCustomProperty("minutes", minutes);
    },
    setGlobalTime: function() {
      const time = new Date();
      this.setClockTime(time.getHours(), time.getMinutes());
    },
    setGlobalTimePeriodically: null,
    checkIfXYInside: null
  },
  minuteHand: {
    init: function() {
      this.element = document.querySelector(SELECTORS.MINUTE_HAND);
      this.element.ondragstart = () => false;
      this.element.onmousedown = this.onMouseDownHandler;
    },
    element: null,
    currentCoords: {
      x: 0,
      y: 0
    },
    setCurrentCoords: function(x, y) {
      app.minuteHand.currentCoords.x = x;
      app.minuteHand.currentCoords.y = y;
    },
    onMouseDownHandler: function(e) {
      e.preventDefault();
      e.stopPropagation();
      app.setCurrentState(STATES.MANIPULATING_RUN);
      const { clientX, clientY } = e;
      app.minuteHand.setCurrentCoords(clientX, clientY);
    },
    onMouseMove: function(e) {
      const { clientX, clientY } = e;
      if (!app.clock.checkIfXYInside(clientX, clientY)) {
        app.setCurrentState(STATES.MANIPULATING_STOP);
        return;
      }

      const angle = getAngleInRads(
        app.clock.center,
        app.minuteHand.currentCoords,
        { x: clientX, y: clientY }
      );

      const minutes = convertRadsToMinutes(angle);
      
      if (!minutes) {
        return;
      }

      const newTime = addMinutesToTime(app.clock.currentTime, minutes);
      app.minuteHand.setCurrentCoords(clientX, clientY);
      app.clock.setClockTime(newTime.hours, newTime.minutes);
    }
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

function getClientRectCenter(rect) {
  const x = Math.round((rect.right - rect.left) / 2) + rect.left;
  const y = Math.round((rect.bottom - rect.top) / 2) + rect.top;
  return { x, y };
}

function getAngleInRads(center, prev, next) {
  // equation of line by 2 points: x(y0 - y1) + y(x1 - x0) + (x0y1 - y0x1) = 0
  //
  // 2 equation of line: xa1 + yb1 + c1 = 0
  //                     xa2 + yb2 + c2 = 0
  //
  // cos(angle) = (a1*a2 + b1*b2) / (sqrt(a1^2 + b1^2) * sqrt(a2^2 + b2^2))

  const a1 = center.y - prev.y;
  const b1 = prev.x - center.x;

  const a2 = center.y - next.y;
  const b2 = next.x - center.x;

  const cosAngle =
    (a1 * a2 + b1 * b2) /
    (Math.sqrt(a1 * a1 + b1 * b1) * Math.sqrt(a2 * a2 + b2 * b2));

    return Math.acos(cosAngle);
}

function convertRadsToMinutes(radian) {
  // 1min = 6deg
  // angleInDegs = angleInRads * 180 / pi;
  // angleInMinutes = angleInRads * 180 / pi / 6 = angleInReds * 30 / pi;

  return (radian * 30) / Math.PI;
}

function addMinutesToTime(time, minutes) {
  const newMinutes = time.minutes + minutes;
  if (newMinutes < 60) {
    return { ...time, minutes: newMinutes };
  }

  const correctedMinutes = newMinutes - 60;
  const newHours = time.hours + 1;

  if (newHours < 24) {
    return { hours: newHours, minutes: correctedMinutes };
  }

  const correctedHours = newHours - 24;

  return { hours: correctedHours, minutes: correctedMinutes };
}
