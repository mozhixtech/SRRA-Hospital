/**
 * SRRA Multispeciality Hospital - Core Website Interaction Script
 * Handles custom animations, canvas image sequences, scroll reveals,
 * counters, and lightweight validation.
 */

(() => {
  "use strict";

  /* ---------------------------------------------------------------------
     Utilities
     --------------------------------------------------------------------- */
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const debounce = (fn, wait = 150) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  };

  /* ---------------------------------------------------------------------
     Navbar: shrink + glass effect on scroll, mobile burger toggle
     --------------------------------------------------------------------- */
  function initNavbar() {
    const navbar = document.getElementById("navbar");
    const burger = document.getElementById("burgerBtn");
    const menu = document.getElementById("navMenu");
    if (!navbar) return;

    const onScroll = () => {
      navbar.classList.toggle("is-scrolled", window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (burger && menu) {
      burger.addEventListener("click", () => {
        const isOpen = menu.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", String(isOpen));
        burger.classList.toggle("is-open", isOpen);
      });

      menu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          menu.classList.remove("is-open");
          burger.setAttribute("aria-expanded", "false");
        });
      });
    }
  }

  // Heartbeat pulse scroll indicator
  function initPulseTrack() {
    const path = document.querySelector(".pulse-track__path");
    if (!path) return;
    const totalLength = path.getTotalLength();
    path.style.strokeDasharray = String(totalLength);
    path.style.strokeDashoffset = String(totalLength);

    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? clamp(scrollTop / docHeight, 0, 1) : 0;
      path.style.strokeDashoffset = String(totalLength * (1 - progress));
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", debounce(update, 100));
    update();
  }

  // Canvas-based image sequence driven by scrolling
  function initScrollSequence() {
    const section = document.querySelector(".hero-scroll");
    const canvas = document.getElementById("sequenceCanvas");
    if (!section || !canvas) return;

    const ctx = canvas.getContext("2d");
    const FRAME_COUNT = 151;
    const FRAME_PATH = (i) => `images/sequence/ezgif-frame-${String(i + 1).padStart(3, "0")}.jpg`;

    const state = {
      images: [],
      loaded: 0,
      useFallback: false,
      currentFrame: 0,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    };

    function resizeCanvas() {
      canvas.width = window.innerWidth * state.dpr;
      canvas.height = window.innerHeight * state.dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      drawCurrentFrame();
    }

    /* ---- Fallback procedural renderer (used only if no photo frames exist) ---- */
    function drawFallbackFrame(progress) {
      const w = canvas.width;
      const h = canvas.height;

      // Base gradient sweeps hue across the scroll range — calm clinical blues.
      const g = ctx.createLinearGradient(0, 0, w, h);
      const hueShift = progress * 40;
      g.addColorStop(0, `hsl(${214 + hueShift * 0.2}, 85%, ${8 + progress * 4}%)`);
      g.addColorStop(0.5, `hsl(${206 + hueShift * 0.3}, 70%, ${14 + progress * 6}%)`);
      g.addColorStop(1, `hsl(${198 + hueShift * 0.4}, 60%, ${10 + progress * 5}%)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Drifting soft light orbs — suggest movement without real photography.
      const orbCount = 4;
      for (let i = 0; i < orbCount; i++) {
        const t = progress * Math.PI * 2 + i * (Math.PI / 2);
        const ox = w * 0.5 + Math.cos(t + i) * w * 0.32;
        const oy = h * 0.5 + Math.sin(t * 0.7 + i) * h * 0.28;
        const radius = Math.min(w, h) * (0.18 + i * 0.03);
        const orbGrad = ctx.createRadialGradient(ox, oy, 0, ox, oy, radius);
        const alpha = 0.10 + 0.05 * Math.sin(progress * Math.PI * 2 + i);
        orbGrad.addColorStop(0, `rgba(25, 181, 254, ${alpha})`);
        orbGrad.addColorStop(1, "rgba(25, 181, 254, 0)");
        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(ox, oy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Faint ECG line etched across the frame for thematic continuity.
      ctx.save();
      ctx.strokeStyle = `rgba(0, 208, 132, ${0.18 + progress * 0.12})`;
      ctx.lineWidth = 2 * state.dpr;
      ctx.beginPath();
      const midY = h * 0.62;
      const span = w;
      const segment = span / 12;
      ctx.moveTo(0, midY);
      for (let x = 0; x <= span; x += segment) {
        const beatPhase = ((x / span) * 6 + progress * 6) % 1;
        let y = midY;
        if (beatPhase > 0.4 && beatPhase < 0.46) y = midY - h * 0.05;
        else if (beatPhase >= 0.46 && beatPhase < 0.5) y = midY + h * 0.09;
        else if (beatPhase >= 0.5 && beatPhase < 0.55) y = midY - h * 0.02;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    function drawCurrentFrame() {
      if (state.useFallback || state.images.length === 0) {
        drawFallbackFrame(state.currentFrame / (FRAME_COUNT - 1));
        return;
      }
      const idx = clamp(state.currentFrame, 0, state.images.length - 1);
      const img = state.images[idx];
      if (img && img.complete && img.naturalWidth) {
        const w = canvas.width, h = canvas.height;
        const scale = Math.max(w / img.width, h / img.height);
        const dw = img.width * scale, dh = img.height * scale;
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      } else {
        drawFallbackFrame(state.currentFrame / (FRAME_COUNT - 1));
      }
    }

    function loadFrame(i) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = FRAME_PATH(i);
      });
    }

    async function loadSequence() {
      const first = await loadFrame(0);
      if (!first) {
        // No photography frames present — use the procedural fallback.
        state.useFallback = true;
        drawCurrentFrame();
        return;
      }
      state.images[0] = first;
      drawCurrentFrame();

      // Lazy-load the remainder in chunks of 10, never blocking rendering.
      let next = 1;
      const loadChunk = async (deadline) => {
        let count = 0;
        while (next < FRAME_COUNT && count < 10) {
          const img = await loadFrame(next);
          if (img) state.images[next] = img;
          next++;
          count++;
          if (deadline && deadline.timeRemaining && deadline.timeRemaining() < 1) break;
        }
        if (next < FRAME_COUNT) {
          scheduleIdle(loadChunk);
        }
      };
      scheduleIdle(loadChunk);
    }

    function scheduleIdle(cb) {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(cb, { timeout: 1000 });
      } else {
        setTimeout(() => cb(null), 50);
      }
    }

    /* ---- Scroll → frame mapping ---- */
    const frames = Array.from(section.querySelectorAll(".hero-scroll__frame"));

    function onScrollTick() {
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const scrolled = clamp(-rect.top, 0, total);
      const progress = total > 0 ? scrolled / total : 0;

      const frameIdx = Math.round(progress * (FRAME_COUNT - 1));
      if (frameIdx !== state.currentFrame) {
        state.currentFrame = frameIdx;
      }
      drawCurrentFrame();

      // Text overlay fade between the 4 narrative beats.
      const beat = clamp(Math.floor(progress * frames.length), 0, frames.length - 1);
      frames.forEach((f, i) => f.classList.toggle("is-active", i === beat));
    }

    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            onScrollTick();
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );

    window.addEventListener("resize", debounce(resizeCanvas, 150));

    resizeCanvas();
    loadSequence();
    onScrollTick();
  }

  /* ---------------------------------------------------------------------
     Scroll reveal: fade-up / reveal utility classes via IntersectionObserver
     --------------------------------------------------------------------- */
  function initScrollReveal() {
    const targets = document.querySelectorAll(".fade-up, .reveal");
    if (!targets.length) return;

    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    // Stagger reveals inside the same grid/parent for a natural cascade.
    const groups = new Map();
    targets.forEach((el) => {
      const parent = el.parentElement;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });
    groups.forEach((els) => {
      els.forEach((el, i) => {
        el.style.transitionDelay = `${Math.min(i * 70, 280)}ms`;
      });
    });

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    targets.forEach((el) => observer.observe(el));
  }

  /* ---------------------------------------------------------------------
     Animated counters for the stats band
     --------------------------------------------------------------------- */
  function initCounters() {
    const counters = document.querySelectorAll(".stat__num");
    if (!counters.length) return;

    const animateCount = (el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      const duration = 1400;
      const start = performance.now();

      const tick = (now) => {
        const t = clamp((now - start) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(lerp(0, target, eased)).toLocaleString("en-IN");
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!("IntersectionObserver" in window)) {
      counters.forEach(animateCount);
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => observer.observe(el));
  }

  /* ---------------------------------------------------------------------
     Contact form: lightweight validation + ripple + status message
     No backend is wired up — swap the submit handler for a real
     endpoint (fetch/EmailJS/Formspree/etc.) when one is available.
     --------------------------------------------------------------------- */
  function initContactForm() {
    const form = document.getElementById("contactForm");
    const status = document.getElementById("formStatus");
    const submitBtn = document.getElementById("submitBtn");
    if (!form) return;

    const validators = {
      name: (v) => v.trim().length >= 2,
      phone: (v) => /^[6-9]\d{9}$/.test(v.trim()),
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      message: (v) => v.trim().length >= 5,
    };

    form.querySelectorAll("input, textarea").forEach((input) => {
      input.addEventListener("blur", () => validateField(input));
    });

    function validateField(input) {
      const rule = validators[input.name];
      const field = input.closest(".field");
      if (!rule) return true;
      const valid = rule(input.value);
      field.classList.toggle("has-error", !valid);
      return valid;
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      let allValid = true;
      form.querySelectorAll("input, textarea").forEach((input) => {
        if (!validateField(input)) allValid = false;
      });

      if (!allValid) {
        status.textContent = "Please check the highlighted fields and try again.";
        status.className = "contact__form-status is-error";
        return;
      }

      // Ripple feedback on the submit button.
      const ripple = submitBtn.querySelector(".btn__ripple");
      if (ripple) {
        ripple.classList.remove("is-active");
        void ripple.offsetWidth;
        ripple.style.width = ripple.style.height = "220px";
        ripple.style.left = "calc(50% - 110px)";
        ripple.style.top = "calc(50% - 110px)";
        ripple.classList.add("is-active");
      }

      status.textContent = "Thank you — our team will call you back shortly.";
      status.className = "contact__form-status is-success";
      form.reset();
    });
  }

  /* ---------------------------------------------------------------------
     Misc: footer year
     --------------------------------------------------------------------- */
  function initFooterYear() {
    const el = document.getElementById("year");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ---------------------------------------------------------------------
     Init
     --------------------------------------------------------------------- */
  function init() {
    initNavbar();
    initPulseTrack();
    initScrollSequence();
    initScrollReveal();
    initCounters();
    initContactForm();
    initFooterYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
