(function () {
  'use strict';

  const canvas = document.getElementById('art-canvas');
  const ctx = canvas.getContext('2d');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initParticles();
  });

  // Settings & State
  let mode = 'flow';
  let particleCount = 1200;
  let speedMultiplier = 1.8;
  let fadeAlpha = 0.05;

  const palettes = {
    cyber: ['#00f5d4', '#7928ca', '#00b4d8', '#f72585'],
    sunset: ['#ff007f', '#ffbe0b', '#fb5607', '#ff0054'],
    aurora: ['#10b981', '#06b6d4', '#3b82f6', '#a7f3d0'],
    plasma: ['#f43f5e', '#8b5cf6', '#ec4899', '#6366f1']
  };
  let currentColors = palettes.cyber;

  // Mouse interaction
  let mouse = {
    x: width / 2,
    y: height / 2,
    isDown: false,
    radius: 180
  };

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mousedown', () => { mouse.isDown = true; });
  window.addEventListener('mouseup', () => { mouse.isDown = false; });
  window.addEventListener('touchstart', (e) => {
    mouse.isDown = true;
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
  });
  window.addEventListener('touchend', () => { mouse.isDown = false; });

  // Particles Array
  let particles = [];

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.prevX = this.x;
      this.prevY = this.y;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.color = currentColors[Math.floor(Math.random() * currentColors.length)];
      this.age = 0;
      this.lifespan = Math.random() * 300 + 100;
      this.size = Math.random() * 1.6 + 0.8;
    }

    update() {
      this.prevX = this.x;
      this.prevY = this.y;

      const angle = (Math.sin(this.x * 0.004) + Math.cos(this.y * 0.004)) * Math.PI * 2;

      if (mode === 'flow') {
        this.vx += Math.cos(angle) * 0.12 * speedMultiplier;
        this.vy += Math.sin(angle) * 0.12 * speedMultiplier;
      } else if (mode === 'gravity') {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (mouse.isDown ? 400 : 150) / dist;
        this.vx += (dx / dist) * force * 0.02 * speedMultiplier;
        this.vy += (dy / dist) * force * 0.02 * speedMultiplier;
      } else if (mode === 'vortex') {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        this.vx += (-dy / dist) * 1.5 * speedMultiplier;
        this.vy += (dx / dist) * 1.5 * speedMultiplier;
      } else if (mode === 'neural') {
        this.vx += (Math.random() - 0.5) * 0.4 * speedMultiplier;
        this.vy += (Math.random() - 0.5) * 0.4 * speedMultiplier;
      }

      // Mouse displacement
      const mdx = this.x - mouse.x;
      const mdy = this.y - mouse.y;
      const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mdist < mouse.radius && mouse.isDown) {
        const push = (1 - mdist / mouse.radius) * 8;
        this.vx += (mdx / mdist) * push;
        this.vy += (mdy / mdist) * push;
      }

      this.x += this.vx;
      this.y += this.vy;

      // Friction
      this.vx *= 0.94;
      this.vy *= 0.94;

      this.age++;
      if (this.age > this.lifespan || this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
        this.reset();
      }
    }

    draw() {
      ctx.beginPath();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.size;
      ctx.moveTo(this.prevX, this.prevY);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();
    }
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
    const activeEl = document.getElementById('active-particles');
    if (activeEl) activeEl.textContent = particleCount;
  }

  // Animation Loop with FPS Counter
  let lastTime = performance.now();
  let frameCount = 0;
  const fpsCounter = document.getElementById('fps-counter');

  function animate() {
    requestAnimationFrame(animate);

    // Trail Fade Effect
    ctx.fillStyle = `rgba(7, 9, 14, ${fadeAlpha})`;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }

    // Neural mode line connections
    if (mode === 'neural') {
      ctx.lineWidth = 0.4;
      for (let i = 0; i < particles.length; i += 4) {
        for (let j = i + 1; j < Math.min(i + 8, particles.length); j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 45) {
            ctx.strokeStyle = `rgba(0, 245, 212, ${1 - dist / 45})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    // Calculate FPS
    frameCount++;
    const now = performance.now();
    if (now - lastTime >= 1000) {
      if (fpsCounter) fpsCounter.textContent = frameCount;
      frameCount = 0;
      lastTime = now;
    }
  }

  // Clear Canvas
  document.getElementById('clear-btn').addEventListener('click', () => {
    ctx.fillStyle = '#07090e';
    ctx.fillRect(0, 0, width, height);
  });

  // Randomize
  document.getElementById('random-btn').addEventListener('click', () => {
    const modes = ['flow', 'gravity', 'vortex', 'neural'];
    mode = modes[Math.floor(Math.random() * modes.length)];
    document.querySelectorAll('.mode-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-mode') === mode);
    });

    const palKeys = Object.keys(palettes);
    const chosenPal = palKeys[Math.floor(Math.random() * palKeys.length)];
    currentColors = palettes[chosenPal];
    document.querySelectorAll('.pal-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-pal') === chosenPal);
    });

    speedMultiplier = (Math.random() * 2.5 + 1).toFixed(1);
    document.getElementById('slider-speed').value = speedMultiplier;
    document.getElementById('val-speed').textContent = speedMultiplier;

    initParticles();
  });

  // Export Artwork
  document.getElementById('export-btn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `neural-canvas-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  // Mode Buttons
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      mode = btn.getAttribute('data-mode');
    });
  });

  // Palette Buttons
  document.querySelectorAll('.pal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pal-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const palKey = btn.getAttribute('data-pal');
      currentColors = palettes[palKey];
      particles.forEach(p => {
        p.color = currentColors[Math.floor(Math.random() * currentColors.length)];
      });
    });
  });

  // Sliders
  const countSlider = document.getElementById('slider-count');
  countSlider.addEventListener('input', (e) => {
    particleCount = parseInt(e.target.value, 10);
    document.getElementById('val-count').textContent = particleCount;
    initParticles();
  });

  const speedSlider = document.getElementById('slider-speed');
  speedSlider.addEventListener('input', (e) => {
    speedMultiplier = parseFloat(e.target.value);
    document.getElementById('val-speed').textContent = speedMultiplier;
  });

  const fadeSlider = document.getElementById('slider-fade');
  fadeSlider.addEventListener('input', (e) => {
    fadeAlpha = parseFloat(e.target.value);
    document.getElementById('val-fade').textContent = fadeAlpha;
  });

  // Boot
  initParticles();
  animate();
})();
