(() => {
  'use strict';

  const q = (selector, root = document) => root.querySelector(selector);
  const qa = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Both logo positions share one file. Keep a visible wordmark until it exists.
  qa('[data-brand-logo]').forEach(image => {
    const refresh = () => {
      image.closest('.brand-lockup')?.classList.toggle('has-logo', image.complete && image.naturalWidth > 1);
    };
    image.addEventListener('load', refresh);
    image.addEventListener('error', () => image.closest('.brand-lockup')?.classList.remove('has-logo'));
    refresh();
  });

  // The main cover artwork is optional in this package. When assets/brand/logo2.png
  // is provided, it replaces the large headline without showing a broken-image icon.
  const coverLogo = q('[data-hero-logo]');
  if (coverLogo) {
    const refreshCoverLogo = () => coverLogo.closest('.hero-title-lockup')?.classList.toggle(
      'has-hero-logo', coverLogo.complete && coverLogo.naturalWidth > 1
    );
    coverLogo.addEventListener('load', refreshCoverLogo);
    coverLogo.addEventListener('error', refreshCoverLogo);
    refreshCoverLogo();
  }

  // Explicitly scroll to the page top; keep href="#top" as a no-JS fallback.
  qa('[data-back-to-top]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.classList.add('is-going-top');
    window.setTimeout(() => document.documentElement.classList.remove('is-going-top'), 1600);
    window.scrollTo({ top: 0, left: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);
  }));

  const menu = q('.menu-toggle');
  const navigation = q('#navigation');
  if (menu && navigation) {
    const closeMenu = () => {
      menu.setAttribute('aria-expanded', 'false');
      navigation.setAttribute('data-menu-collapsed', '');
    };
    closeMenu();
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      navigation.toggleAttribute('data-menu-collapsed', !open);
    });
    qa('a', navigation).forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        menu.focus();
      }
    });
  }

  const clock = q('#profile-clock');
  if (clock) {
    const format = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: true,
    });
    const tick = () => { clock.textContent = format.format(new Date()); };
    tick();
    setInterval(tick, 1000);
  }

  const video = q('.hero-video');
  const videoButton = q('.video-toggle');
  if (video && videoButton) {
    // Start with a plain black surface (no poster or previous graphic).
    // Reveal the moving background only once the first video frame is decoded.
    const showFirstFrame = () => {
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      requestAnimationFrame(() => video.classList.add('is-ready'));
    };
    video.addEventListener('loadeddata', showFirstFrame);
    video.addEventListener('playing', showFirstFrame);
    video.addEventListener('canplay', showFirstFrame);
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) showFirstFrame();
    const syncVideoButton = () => {
      videoButton.textContent = video.paused ? 'Play video ▶' : 'Pause video Ⅱ';
      videoButton.setAttribute('aria-label', video.paused ? 'Play background video' : 'Pause background video');
      videoButton.setAttribute('aria-pressed', String(!video.paused));
    };
    const videoFailed = () => {
      video.closest('.hero')?.classList.add('video-unavailable');
      video.classList.remove('is-ready');
      videoButton.hidden = true;
    };
    video.addEventListener('play', syncVideoButton);
    video.addEventListener('pause', syncVideoButton);
    video.addEventListener('error', videoFailed);
    qa('source', video).forEach(source => source.addEventListener('error', videoFailed));
    videoButton.addEventListener('click', async () => {
      if (video.paused) {
        try { await video.play(); } catch { syncVideoButton(); }
      } else {
        video.pause();
      }
      syncVideoButton();
    });
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) video.pause();
    syncVideoButton();
  }

  // A local scroll controller replaces the embedded, hydration-dependent scene.
  // All five headings and descriptions are already in the HTML before this runs.
  const process = q('#process');
  if (!process) return;
  const stage = q('.process-stage', process);
  const panels = qa('.process-panel', process);
  const links = qa('[data-process-step]', process);
  const count = q('[data-process-count]', process);
  const previous = q('[data-process-prev]', process);
  const next = q('[data-process-next]', process);
  const ring = q('.process-ring', process);
  const ticks = q('.process-ticks', process);
  const marker = q('.process-orbit-marker', process);
  const angles = qa('[data-process-angle]', process);
  if (!stage || !panels.length || links.length !== panels.length) return;

  let current = 0;
  let enhanced = false;
  let scheduled = false;
  const clamp = value => Math.min(1, Math.max(0, value));
  const last = panels.length - 1;
  const STEP_ANGLE = 25 * Math.PI / 180;
  let orbit = { radius: 0, edgeX: 0, centerY: 0 };
  const tickNodes = [];
  if (ticks) {
    for (let degrees = -85; degrees <= 85; degrees += 10) {
      const tick = document.createElement('span');
      tick.className = 'process-tick' + (degrees % 25 === 0 ? ' is-major' : '');
      tick.setAttribute('aria-hidden', 'true');
      ticks.appendChild(tick);
      tickNodes.push({ tick, radians: degrees * Math.PI / 180 });
    }
  }

  const pointOnRing = angle => ({
    x: orbit.edgeX + orbit.radius * (Math.cos(angle) - 1),
    y: orbit.centerY + orbit.radius * Math.sin(angle),
  });

  // Keep the circle's rightmost point aligned with the large active number.
  // The numbered links follow the same circular trajectory as scroll progresses.
  const sizeOrbit = () => {
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    // Place the selected number on the actual headline's vertical centerline.
    // Using line-box geometry rather than the animated panel's bounding box keeps
    // the number still while the headline reveals, at every desktop viewport size.
    const copy = q('.process-copy', process);
    const heading = q('.process-panel:not([hidden]) h3', process);
    const copyTop = copy ? copy.getBoundingClientRect().top - stage.getBoundingClientRect().top : 0;
    const countMargin = count ? parseFloat(getComputedStyle(count.parentElement).marginBottom) || 0 : 0;
    const countHeight = count?.parentElement?.offsetHeight || 0;
    const headlineCenter = copyTop + countHeight + countMargin + (heading?.offsetHeight || 0) / 2;
    orbit = {
      radius: Math.max(470, Math.min(height * .76, 950)),
      edgeX: Math.min(width * .30, 480),
      centerY: heading ? headlineCenter : height * .43,
    };
    if (ring) {
      ring.style.width = `${orbit.radius * 2}px`;
      ring.style.height = `${orbit.radius * 2}px`;
      ring.style.left = `${orbit.edgeX - orbit.radius}px`;
      ring.style.top = `${orbit.centerY - orbit.radius}px`;
    }
    if (marker) {
      marker.style.left = `${orbit.edgeX}px`;
      marker.style.top = `${orbit.centerY}px`;
    }
    tickNodes.forEach(({ tick, radians }) => {
      const point = pointOnRing(radians);
      tick.style.left = `${point.x}px`;
      tick.style.top = `${point.y}px`;
      tick.style.transform = `translate(-50%, -50%) rotate(${radians}rad)`;
    });
    angles.forEach(label => {
      const degrees = Number(label.dataset.processAngle);
      const radians = degrees * Math.PI / 180;
      const point = pointOnRing(radians);
      label.style.left = `${point.x - 30}px`;
      label.style.top = `${point.y}px`;
    });
  };

  // The stage has a real dwell at each number and a longer, notched turn between them.
  // This stays linked to the actual scroll position (including manual scrollbar drags).
  const smoothStep = value => value * value * (3 - 2 * value);
  const stagedPosition = raw => {
    if (raw <= 0) return 0;
    if (raw >= last) return last;
    const base = Math.floor(raw);
    const phase = raw - base;
    // 0-18% lock; 18-84% turn; 84-100% settle at the next tooth.
    const turn = clamp((phase - .18) / .66);
    return base + smoothStep(turn);
  };

  const drawOrbit = activePosition => {
    if (!enhanced) return;
    links.forEach((link, index) => {
      const offset = index - activePosition;
      const radians = offset * STEP_ANGLE;
      const point = pointOnRing(radians);
      const emphasis = Math.max(0, 1 - Math.abs(offset));
      const horizontalOffset = -38 + emphasis * 96;
      link.style.left = `${point.x + horizontalOffset}px`;
      link.style.top = `${point.y}px`;
      link.style.setProperty('--orbit-scale', String(.60 + emphasis * .40));
      link.style.setProperty('--orbit-opacity', String(Math.max(.16, 1 - Math.abs(offset) * .28)));
      link.style.zIndex = String(Math.round(10 - Math.abs(offset)));
      link.setAttribute('aria-label', `${String(index + 1).padStart(2, '0')} — ${q('span:last-child', link).textContent}`);
    });
  };

  const showStep = index => {
    current = Math.min(last, Math.max(0, index));
    panels.forEach((panel, i) => { panel.hidden = enhanced && i !== current; });
    links.forEach((link, i) => {
      if (i === current && enhanced) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
    if (count) count.textContent = String(current + 1).padStart(2, '0');
    if (previous) previous.disabled = current === 0;
    if (next) next.disabled = current === last;
    if (enhanced) sizeOrbit();
  };

  const updateFromScroll = () => {
    scheduled = false;
    if (!enhanced) return;
    const range = Math.max(0, process.offsetHeight - stage.offsetHeight);
    const progress = range ? clamp(-process.getBoundingClientRect().top / range) : 0;
    const position = stagedPosition(progress * last);
    const step = Math.round(position);
    process.style.setProperty('--process-progress', String(progress));
    if (step !== current) showStep(step);
    drawOrbit(position);
  };

  const scheduleScroll = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updateFromScroll);
  };

  const getSectionTop = () => process.getBoundingClientRect().top + window.scrollY;
  const getStepTop = index => {
    const range = Math.max(0, process.offsetHeight - stage.offsetHeight);
    return getSectionTop() + (last ? index / last * range : 0);
  };

  // Seven little detents during each wheel stroke: the motion advances, catches,
  // then releases again. Each stroke takes longer than native browser smooth scroll.
  // Do not globally change scrolling outside the process section.
  const GEAR_STROKE_MS = 1430;
  const GEAR_DWELL_MS = 280;
  const GEAR_TEETH = 7;
  let animationFrame = 0;
  let gearLockedUntil = 0;
  let programmaticUntil = 0;
  let snapTimer;
  let catchTimer;
  const ratchetMotion = timeProgress => {
    if (timeProgress >= 1) return 1;
    // Slight acceleration at the beginning and deceleration toward the final click.
    const travel = (1 - Math.cos(Math.PI * timeProgress)) / 2;
    const toothPosition = travel * GEAR_TEETH;
    const tooth = Math.floor(toothPosition);
    // Roughly 25% of every tooth is a micro-pause rather than a slippery glide.
    const moving = smoothStep(clamp((toothPosition - tooth) / .73));
    return (tooth + moving) / GEAR_TEETH;
  };
  const markGearEngaged = () => {
    process.classList.remove('is-gear-engaged');
    // Restart the momentary marker highlight for each successive step.
    void process.offsetWidth;
    process.classList.add('is-gear-engaged');
    clearTimeout(catchTimer);
    catchTimer = setTimeout(() => process.classList.remove('is-gear-engaged'), 260);
  };
  const goToStep = (index, behavior = 'geared') => {
    const target = Math.min(last, Math.max(0, index));
    if (!enhanced) return;
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    const from = window.scrollY;
    const to = getStepTop(target);
    const distance = to - from;
    if (behavior === 'auto' || Math.abs(distance) < 2) {
      window.scrollTo(0, to);
      showStep(target);
      drawOrbit(target);
      process.style.setProperty('--process-progress', String(last ? target / last : 0));
      return;
    }
    const duration = GEAR_STROKE_MS * Math.min(1.9, Math.max(.9, Math.abs(distance) / Math.max(1, stage.clientHeight)));
    const started = performance.now();
    gearLockedUntil = started + duration + GEAR_DWELL_MS;
    programmaticUntil = gearLockedUntil + 100;
    const frame = now => {
      const t = clamp((now - started) / duration);
      window.scrollTo(0, from + distance * ratchetMotion(t));
      if (t < 1) {
        animationFrame = requestAnimationFrame(frame);
      } else {
        animationFrame = 0;
        window.scrollTo(0, to);
        showStep(target);
        drawOrbit(target);
        markGearEngaged();
      }
    };
    animationFrame = requestAnimationFrame(frame);
  };

  // One deliberate wheel gesture -> one numbered step. Momentum from a Mac
  // trackpad is absorbed while the mechanism turns instead of skipping pages.
  // Normal wheel behavior resumes before 01 and after 05, and inside the inquiry popup.
  let wheelImpulse = 0;
  let lastImpulseAt = 0;
  let lastImpulseDirection = 0;
  const onProcessWheel = event => {
    if (!enhanced || document.documentElement.classList.contains('is-going-top') ||
        q('#project-inquiry')?.open || event.ctrlKey) return;
    // Wheel deltas can be expressed in pixels, lines or pages depending on device.
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
    if (!delta) return;
    const bounds = process.getBoundingClientRect();
    if (bounds.top > 1 || bounds.bottom < window.innerHeight - 1) return;
    const now = performance.now();
    if (now < gearLockedUntil) {
      event.preventDefault();
      return;
    }
    const direction = Math.sign(delta);
    const range = Math.max(1, process.offsetHeight - stage.offsetHeight);
    const position = clamp(-bounds.top / range) * last;
    const nearest = Math.round(position);
    if ((direction < 0 && nearest === 0 && position < .08) ||
        (direction > 0 && nearest === last && position > last - .08)) return;
    event.preventDefault();
    // Combine tiny trackpad deltas into one intentional notch; they must not
    // slip through as free native scrolling during a mechanical lock.
    if (now - lastImpulseAt > 230 || lastImpulseDirection !== direction) wheelImpulse = 0;
    wheelImpulse += Math.min(120, Math.abs(delta));
    lastImpulseAt = now;
    lastImpulseDirection = direction;
    if (wheelImpulse < 12) return;
    wheelImpulse = 0;
    goToStep(nearest + direction);
  };
  window.addEventListener('wheel', onProcessWheel, { passive: false });

  // Scrollbar dragging, touch and PageDown still work normally. After manual
  // scrolling, the current step can settle instead of being left between teeth.
  const settleOnStep = () => {
    if (!enhanced || document.documentElement.classList.contains('is-going-top') ||
        performance.now() < programmaticUntil || animationFrame) return;
    const bounds = process.getBoundingClientRect();
    if (bounds.top > 0 || bounds.bottom < window.innerHeight) return;
    const range = Math.max(1, process.offsetHeight - stage.offsetHeight);
    const nearest = Math.round(clamp(-bounds.top / range) * last);
    const targetTop = getStepTop(nearest);
    if (Math.abs(window.scrollY - targetTop) > 28) goToStep(nearest);
  };
  const scheduleSettle = () => {
    clearTimeout(snapTimer);
    snapTimer = window.setTimeout(settleOnStep, 340);
  };
  window.addEventListener('scroll', scheduleSettle, { passive: true });

  const configure = () => {
    // Preserve the legible five-panel fallback on small screens and for reduced motion.
    enhanced = window.innerWidth >= 880 && window.innerHeight >= 560 &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
      (!window.CSS?.supports || window.CSS.supports('position', 'sticky'));
    if (!enhanced && animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      gearLockedUntil = 0;
    }
    process.classList.toggle('is-enhanced', enhanced);
    showStep(current);
    if (enhanced) updateFromScroll();
  };

  links.forEach((link, index) => {
    link.addEventListener('click', event => {
      if (!enhanced) return;
      event.preventDefault();
      goToStep(index);
    });
    link.addEventListener('keydown', event => {
      const movements = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (!(event.key in movements) || !enhanced) return;
      event.preventDefault();
      const target = Math.min(last, Math.max(0, index + movements[event.key]));
      links[target].focus();
      goToStep(target);
    });
  });
  previous?.addEventListener('click', () => goToStep(current - 1));
  next?.addEventListener('click', () => goToStep(current + 1));
  window.addEventListener('scroll', scheduleScroll, { passive: true });
  window.addEventListener('resize', configure);
  configure();
})();
