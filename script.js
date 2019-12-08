window.addEventListener('DOMContentLoaded', main);

function main() {
  const clock = document.querySelector('.clock');

  const setCustomProperty = (name, value) => {
    clock.style.setProperty(`--${name}`, value);
  };

  const setTimeVariables = (time) => {
    setCustomProperty('hours', time.getHours());
    setCustomProperty('minutes', time.getMinutes());
  };

  const setTime = () => setTimeVariables(new Date());

  setTime();

  setInterval(setTime, 10000);
}