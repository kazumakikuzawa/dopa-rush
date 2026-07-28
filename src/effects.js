// IMP-002 / REQ-UI-002..007, REQ-NFR-001: silent, bounded visual feedback.
const PARTICLE_LIMIT = 160;
const DOM_EFFECT_LIMIT = 24;

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export function createEffects() {
  const canvas = document.getElementById('fxCanvas');
  const context = canvas?.getContext('2d', { alpha: true });
  const fxLayer = document.getElementById('fxLayer');
  const phaseReveal = document.getElementById('phaseReveal');
  const core = document.getElementById('dopaButton');
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const particles = [];
  const domEffects = [];
  let width = window.innerWidth;
  let height = window.innerHeight;
  let dpr = 1;
  let pointerX = width / 2;
  let pointerY = height / 2;
  let energy = 0;
  let flow = 1;
  let frameId = 0;
  let previousTime = performance.now();
  let phaseTimer = 0;
  let hidden = document.hidden;

  const reduced = () => media.matches || document.body.classList.contains('reduce-motion');

  function resize() {
    if (!canvas || !context) return;
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeAmbient(index, count) {
    return {
      ambient: true,
      x: (width / count) * index + Math.random() * (width / count),
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.08,
      vy: -0.03 - Math.random() * 0.12,
      radius: 0.6 + Math.random() * 1.8,
      life: Infinity,
      maxLife: Infinity,
      hue: index % 3 === 0 ? 174 : 270 + Math.random() * 35,
    };
  }

  function seedAmbient() {
    const target = width < 700 ? 22 : 42;
    const ambient = particles.filter((particle) => particle.ambient).length;
    for (let index = ambient; index < target; index += 1) {
      particles.push(makeAmbient(index, target));
    }
  }

  function burst(x, y, count, spread = 1) {
    if (reduced()) return;
    const safeCount = Math.min(count, PARTICLE_LIMIT - particles.length);
    for (let index = 0; index < safeCount; index += 1) {
      const angle = (Math.PI * 2 * index) / safeCount + Math.random() * 0.4;
      const speed = (1.5 + Math.random() * 5.5) * spread;
      particles.push({
        ambient: false,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1 + Math.random() * 3.5,
        life: 520 + Math.random() * 520,
        maxLife: 1040,
        hue: index % 3 === 0 ? 174 : 266 + Math.random() * 54,
      });
    }
  }

  function addDomEffect(node) {
    if (!fxLayer) return;
    while (domEffects.length >= DOM_EFFECT_LIMIT) domEffects.shift()?.remove();
    fxLayer.append(node);
    domEffects.push(node);
    const remove = () => {
      node.remove();
      const index = domEffects.indexOf(node);
      if (index >= 0) domEffects.splice(index, 1);
    };
    node.addEventListener('animationend', remove, { once: true });
    window.setTimeout(remove, 1000);
  }

  function shockwave(x, y, strength) {
    if (reduced()) return;
    const wave = document.createElement('span');
    wave.className = 'shockwave';
    wave.style.left = `${x}px`;
    wave.style.top = `${y}px`;
    wave.style.setProperty('--wave-scale', String(1 + strength * 0.13));
    addDomEffect(wave);
  }

  function ignite(event, amount, nextFlow) {
    flow = nextFlow;
    const rect = core.getBoundingClientRect();
    const x = event?.clientX || rect.left + rect.width / 2;
    const y = event?.clientY || rect.top + rect.height / 2;
    core.style.setProperty('--hit-x', `${((x - rect.left) / rect.width) * 100}%`);
    core.style.setProperty('--hit-y', `${((y - rect.top) / rect.height) * 100}%`);
    core.classList.remove('is-ignited');
    void core.offsetWidth;
    core.classList.add('is-ignited');
    document.body.classList.add('flow-active');
    shockwave(x, y, flow);
    burst(x, y, Math.round(7 + flow * 1.4), 0.75 + flow * 0.04);
    window.setTimeout(() => core.classList.remove('is-ignited'), 280);
    return { x, y, amount };
  }

  function purchase(element) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    element.classList.remove('just-purchased');
    void element.offsetWidth;
    element.classList.add('just-purchased');
    burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 26, 0.8);
    window.setTimeout(() => element.classList.remove('just-purchased'), 650);
  }

  function phase(name, number) {
    if (!phaseReveal) return;
    window.clearTimeout(phaseTimer);
    document.getElementById('phaseRevealNumber').textContent =
      `PHASE ${String(number).padStart(2, '0')}`;
    document.getElementById('phaseRevealName').textContent = name;
    phaseReveal.hidden = false;
    phaseReveal.classList.remove('is-visible');
    void phaseReveal.offsetWidth;
    phaseReveal.classList.add('is-visible');
    phaseTimer = window.setTimeout(
      () => {
        phaseReveal.classList.remove('is-visible');
        window.setTimeout(
          () => {
            phaseReveal.hidden = true;
          },
          reduced() ? 0 : 500,
        );
      },
      reduced() ? 900 : 2100,
    );
  }

  function achievement(element) {
    const rect = element?.getBoundingClientRect();
    if (rect) burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 34, 0.9);
    document.body.classList.remove('achievement-flash');
    void document.body.offsetWidth;
    document.body.classList.add('achievement-flash');
    window.setTimeout(() => document.body.classList.remove('achievement-flash'), 850);
  }

  function setEnergy(nextFlow, dps = 0) {
    flow = clamp(nextFlow, 1, 10);
    energy = clamp((flow - 1) / 9 + Math.log10(dps + 1) / 14, 0, 1);
    document.documentElement.style.setProperty('--energy', energy.toFixed(3));
    document.documentElement.style.setProperty('--flow', flow.toFixed(2));
    if (flow <= 1.01) document.body.classList.remove('flow-active');
  }

  function setPointer(event) {
    pointerX = event.clientX;
    pointerY = event.clientY;
    document.documentElement.style.setProperty('--pointer-x', `${(pointerX / width) * 100}%`);
    document.documentElement.style.setProperty('--pointer-y', `${(pointerY / height) * 100}%`);
    if (!core || reduced()) return;
    const rect = core.getBoundingClientRect();
    const dx = clamp((pointerX - (rect.left + rect.width / 2)) / rect.width, -0.5, 0.5);
    const dy = clamp((pointerY - (rect.top + rect.height / 2)) / rect.height, -0.5, 0.5);
    core.style.setProperty('--tilt-x', `${(-dy * 10).toFixed(2)}deg`);
    core.style.setProperty('--tilt-y', `${(dx * 10).toFixed(2)}deg`);
  }

  function drawParticle(particle, delta) {
    particle.x += particle.vx * delta;
    particle.y += particle.vy * delta;
    if (particle.ambient) {
      const pullX = (pointerX - particle.x) * 0.000003 * delta * (1 + energy);
      const pullY = (pointerY - particle.y) * 0.000003 * delta * (1 + energy);
      particle.vx = clamp(particle.vx + pullX, -0.24, 0.24);
      particle.vy = clamp(particle.vy + pullY, -0.24, 0.1);
      if (particle.y < -10) particle.y = height + 10;
      if (particle.x < -10) particle.x = width + 10;
      if (particle.x > width + 10) particle.x = -10;
    } else {
      particle.life -= delta;
      particle.vx *= 0.985;
      particle.vy = particle.vy * 0.985 + 0.002 * delta;
    }
    const alpha = particle.ambient ? 0.22 + energy * 0.35 : clamp(particle.life / 600, 0, 1);
    context.beginPath();
    context.fillStyle = `hsla(${particle.hue} 100% 70% / ${alpha})`;
    context.shadowBlur = particle.ambient ? 4 + energy * 5 : 7 + energy * 10;
    context.shadowColor = `hsl(${particle.hue} 100% 65%)`;
    context.arc(particle.x, particle.y, particle.radius * (1 + energy * 0.5), 0, Math.PI * 2);
    context.fill();
    if (!particle.ambient) {
      context.beginPath();
      context.strokeStyle = `hsla(${particle.hue} 100% 72% / ${alpha * 0.6})`;
      context.moveTo(particle.x, particle.y);
      context.lineTo(particle.x - particle.vx * 5, particle.y - particle.vy * 5);
      context.stroke();
    }
  }

  function animate(now) {
    if (!context || hidden) return;
    const delta = Math.min(32, now - previousTime);
    previousTime = now;
    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = 'lighter';
    context.lineWidth = 1;
    context.shadowBlur = 0;
    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      drawParticle(particle, delta);
      if (!particle.ambient && particle.life <= 0) particles.splice(index, 1);
    }
    canvas.dataset.particleCount = String(particles.length);
    frameId = requestAnimationFrame(animate);
  }

  function visibilityChange() {
    hidden = document.hidden;
    if (!hidden && !frameId) {
      previousTime = performance.now();
      frameId = requestAnimationFrame(animate);
    }
    if (hidden && frameId) {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    }
  }

  resize();
  seedAmbient();
  frameId = context ? requestAnimationFrame(animate) : 0;
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', setPointer, { passive: true });
  document.addEventListener('visibilitychange', visibilityChange);

  return {
    ignite,
    purchase,
    phase,
    achievement,
    setEnergy,
    destroy() {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(phaseTimer);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', setPointer);
      document.removeEventListener('visibilitychange', visibilityChange);
      domEffects.forEach((node) => node.remove());
    },
  };
}
