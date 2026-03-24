/* ========================================================================
   SMARTPHONE X — Scroll-driven frame animation + storytelling
   ======================================================================== */

(function () {
  'use strict';

  /* ── Configuration ──────────────────────────────────────────────────── */
  const TOTAL_FRAMES  = 240;
  const FRAME_DIR     = 'images-frames';
  const FRAME_PREFIX  = 'ezgif-frame-';
  const FRAME_EXT     = '.jpg';

  /* ── DOM refs ───────────────────────────────────────────────────────── */
  const canvas          = document.getElementById('phoneCanvas');
  const ctx             = canvas.getContext('2d');
  const navbar          = document.getElementById('navbar');
  const loader          = document.getElementById('loader');
  const loaderBar       = document.getElementById('loaderBar');
  const loaderText      = document.getElementById('loaderText');
  const scrollIndicator = document.getElementById('scrollIndicator');
  const animSection     = document.getElementById('animationSection');
  const storyPanels     = document.querySelectorAll('.story-panel');

  /* ── State ──────────────────────────────────────────────────────────── */
  let images        = [];
  let loadedCount   = 0;
  let currentFrame  = 0;
  let ticking       = false;

  /* ── Helpers ────────────────────────────────────────────────────────── */
  function framePath(index) {
    const num = String(index + 1).padStart(3, '0');
    return `${FRAME_DIR}/${FRAME_PREFIX}${num}${FRAME_EXT}`;
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  /* ── Image preloader ────────────────────────────────────────────────── */
  function preloadImages() {
    return new Promise((resolve) => {
      images = new Array(TOTAL_FRAMES);

      for (let i = 0; i < TOTAL_FRAMES; i++) {
        const img = new Image();
        img.src = framePath(i);

        img.onload = img.onerror = () => {
          loadedCount++;
          const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);
          loaderBar.style.width = pct + '%';
          loaderText.textContent = `Carregando experiência… ${pct}%`;

          if (loadedCount === TOTAL_FRAMES) {
            resolve();
          }
        };

        images[i] = img;
      }
    });
  }

  /* ── Canvas drawing ─────────────────────────────────────────────────── */
  function resizeCanvas() {
    canvas.width  = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width  = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    drawFrame(currentFrame);
  }

  function drawFrame(index) {
    const img = images[index];
    if (!img || !img.complete) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill background to match image bg
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cover: fill the entire canvas, cropping if needed
    const scale = Math.max(
      canvas.width  / img.naturalWidth,
      canvas.height / img.naturalHeight
    );
    const w = img.naturalWidth  * scale;
    const h = img.naturalHeight * scale;
    const x = (canvas.width  - w) / 2;
    const y = (canvas.height - h) / 2;

    ctx.drawImage(img, x, y, w, h);
  }

  /* ── Scroll progress inside animation section ───────────────────────── */
  function getScrollProgress() {
    const rect = animSection.getBoundingClientRect();
    const scrollableDistance = animSection.offsetHeight - window.innerHeight;
    if (scrollableDistance <= 0) return 0;
    const scrolled = -rect.top;
    return clamp(scrolled / scrollableDistance, 0, 1);
  }

  /* ── Update loop (rAF-throttled) ────────────────────────────────────── */
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  function update() {
    ticking = false;

    const progress = getScrollProgress();

    /* --- Frame animation --- */
    const frameIndex = Math.round(progress * (TOTAL_FRAMES - 1));
    if (frameIndex !== currentFrame) {
      currentFrame = frameIndex;
      drawFrame(currentFrame);
    }

    /* --- Navbar glass --- */
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    /* --- Scroll indicator --- */
    if (window.scrollY > 100) {
      scrollIndicator.classList.add('hidden');
    } else {
      scrollIndicator.classList.remove('hidden');
    }

    /* --- Check if we are inside the animation section viewport --- */
    const animRect = animSection.getBoundingClientRect();
    const inAnimSection = animRect.top <= 0 && animRect.bottom > window.innerHeight;

    /* --- Storytelling panels --- */
    storyPanels.forEach((panel) => {
      const start = parseFloat(panel.dataset.start);
      const end   = parseFloat(panel.dataset.end);

      if (inAnimSection && progress >= start && progress <= end) {
        panel.classList.add('visible');
        panel.classList.remove('fade-out');
      } else if (inAnimSection && progress > end && progress <= end + 0.04) {
        panel.classList.remove('visible');
        panel.classList.add('fade-out');
      } else {
        panel.classList.remove('visible', 'fade-out');
      }
    });
  }

  /* ── Smooth scroll for nav links ────────────────────────────────────── */
  document.querySelectorAll('.nav-links a').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  /* ── Highlight active nav link based on scroll ──────────────────────── */
  function updateActiveNav() {
    const progress = getScrollProgress();
    const links = document.querySelectorAll('.nav-links a');

    links.forEach(link => link.classList.remove('active'));

    if (progress < 0.15) {
      links[0]?.classList.add('active');
    } else if (progress < 0.40) {
      links[1]?.classList.add('active');
    } else if (progress < 0.65) {
      links[2]?.classList.add('active');
    } else if (progress < 0.85) {
      links[3]?.classList.add('active');
    } else {
      links[4]?.classList.add('active');
    }
  }

  /* ── Init ────────────────────────────────────────────────────────────── */
  async function init() {
    await preloadImages();

    // Hide loader
    loader.classList.add('hidden');
    setTimeout(() => { loader.style.display = 'none'; }, 700);

    // Setup canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Scroll listener
    window.addEventListener('scroll', () => {
      onScroll();
      updateActiveNav();
    }, { passive: true });

    // Initial draw
    drawFrame(0);
    update();
  }

  init();
})();
