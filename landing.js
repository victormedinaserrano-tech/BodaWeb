const envelope = document.getElementById('open-invitation');
const landing = document.querySelector('.landing');
const fallingLayer = document.querySelector('.falling');
let isTransitionRunning = false;

function seedFallingNature() {
  if (!fallingLayer) {
    return;
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const itemCount = window.matchMedia('(max-width: 540px)').matches ? 10 : 20;
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < itemCount; i += 1) {
    const item = document.createElement('span');
    const isBlossom = Math.random() < 0.62;
    const size = isBlossom ? 12 + Math.random() * 8 : 10 + Math.random() * 8;

    item.className = `fall-item ${isBlossom ? 'fall-item--blossom' : 'fall-item--leaf'}`;
    item.style.left = `${Math.random() * 100}%`;
    item.style.setProperty('--item-size', `${size.toFixed(2)}px`);
    item.style.setProperty('--item-opacity', `${(0.48 + Math.random() * 0.42).toFixed(2)}`);
    item.style.setProperty('--fall-duration', `${(8.4 + Math.random() * 8.6).toFixed(2)}s`);
    item.style.setProperty('--sway-duration', `${(3.5 + Math.random() * 3.8).toFixed(2)}s`);
    item.style.setProperty('--fall-delay', `${(-Math.random() * 18).toFixed(2)}s`);
    item.style.setProperty('--drift-start', `${(-28 + Math.random() * 56).toFixed(0)}px`);
    item.style.setProperty('--drift-end', `${(-40 + Math.random() * 80).toFixed(0)}px`);
    item.style.setProperty('--sway-distance', `${(8 + Math.random() * 24).toFixed(0)}px`);
    item.style.setProperty('--rot-start', `${(Math.random() * 360).toFixed(0)}deg`);
    item.style.setProperty('--rot-end', `${(220 + Math.random() * 520).toFixed(0)}deg`);

    fragment.appendChild(item);
  }

  fallingLayer.appendChild(fragment);
}

seedFallingNature();

if (envelope) {
  envelope.addEventListener('click', () => {
    if (isTransitionRunning) {
      return;
    }

    isTransitionRunning = true;
    landing?.classList.add('is-transitioning');
    envelope.classList.add('is-open');

    setTimeout(() => {
      envelope.classList.add('is-launching');
    }, 220);

    setTimeout(() => {
      window.location.href = 'boda.html';
    }, 2020);
  });
}
