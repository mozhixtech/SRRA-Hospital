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

  // Looping background video scroll text controller
  function initHeroScroll() {
    const section = document.querySelector(".hero-scroll");
    if (!section) return;

    const frames = Array.from(section.querySelectorAll(".hero-scroll__frame"));
    let sectionTop = 0;
    let sectionHeight = 0;
    let targetProgress = 0;
    let currentProgress = 0;

    function updateMetrics() {
      const rect = section.getBoundingClientRect();
      sectionTop = rect.top + window.scrollY;
      sectionHeight = section.offsetHeight;
    }

    function onScroll() {
      const scrollTop = window.scrollY;
      const scrolled = clamp(scrollTop - sectionTop, 0, sectionHeight - window.innerHeight);
      const totalScrollable = sectionHeight - window.innerHeight;
      targetProgress = totalScrollable > 0 ? scrolled / totalScrollable : 0;
    }

    function animateLoop() {
      // Smoothly interpolate the progress
      currentProgress = lerp(currentProgress, targetProgress, 0.12);
      
      // Calculate which frame/beat should be active
      const beat = clamp(Math.floor(currentProgress * frames.length), 0, frames.length - 1);
      
      frames.forEach((f, i) => {
        // Toggle the active class
        const isActive = i === beat;
        f.classList.toggle("is-active", isActive);
        
        // Add subtle parallax translateY offset based on progress for extra visual quality
        if (isActive) {
          const frameProgress = (currentProgress * frames.length) - i; // 0 to 1 inside the active window
          const offset = (frameProgress - 0.5) * -30; // Float up as scroll goes down
          f.style.transform = `translateY(${offset}px)`;
        } else {
          f.style.transform = "";
        }
      });

      requestAnimationFrame(animateLoop);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    
    window.addEventListener(
      "resize",
      debounce(() => {
        updateMetrics();
        onScroll();
      }, 150)
    );

    // Initial setup
    updateMetrics();
    onScroll();
    animateLoop();
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
    initHeroScroll();
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
