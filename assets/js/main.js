/* ============================================================
   SAVORO — Main.js (Shared Page Behavior)
   Mobile menu, sticky navbar, announcement bar, back-to-top,
   toast notifications, scroll-reveal, smooth scroll, dark/light
   mode toggle.
   Loaded on EVERY page.
   ============================================================ */

(function () {
  "use strict";

  /* ----------------------------------------------------------
     0. PRELOADER — Food-themed with progress bar
     ---------------------------------------------------------- */
  function initPreloader() {
    var preloader = document.getElementById("preloader");
    var bar = document.getElementById("preloaderBar");
    if (!preloader) return;

    // Prevent scrolling
    document.body.style.overflow = "hidden";

    var progress = 0;
    var interval = setInterval(function () {
      // Slow down as it approaches 100
      var increment = progress < 60 ? 8 : progress < 85 ? 3 : 1;
      progress = Math.min(progress + increment, 100);
      if (bar) bar.style.width = progress + "%";

      if (progress >= 100) {
        clearInterval(interval);
        hidePreloader();
      }
    }, 80);

    function hidePreloader() {
      preloader.classList.add("is-hidden");
      document.body.style.overflow = "";
      setTimeout(function () {
        if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
      }, 700);
    }

    // Safety: hide after 4s max regardless
    setTimeout(function () {
      clearInterval(interval);
      if (!preloader.classList.contains("is-hidden")) {
        if (bar) bar.style.width = "100%";
        hidePreloader();
      }
    }, 4000);
  }

  initPreloader();

  /* ----------------------------------------------------------
     1. MOBILE MENU TOGGLE
     ---------------------------------------------------------- */
  function initMobileMenu() {
    const hamburger = document.querySelector(".navbar__hamburger");
    const mobileMenu = document.querySelector(".navbar__mobile-menu");
    if (!hamburger || !mobileMenu) return;

    hamburger.addEventListener("click", function () {
      const isOpen = mobileMenu.classList.contains("open");
      hamburger.classList.toggle("active");
      mobileMenu.classList.add("active"); // ensures display: block

      if (isOpen) {
        mobileMenu.classList.remove("open");
        document.body.style.overflow = "";
        // After transition ends, remove display for cleanliness
        mobileMenu.addEventListener("transitionend", function handler() {
          if (!mobileMenu.classList.contains("open")) {
            mobileMenu.classList.remove("active");
          }
          mobileMenu.removeEventListener("transitionend", handler);
        });
      } else {
        mobileMenu.classList.add("open");
        document.body.style.overflow = "hidden";
      }
    });

    // Close on link click
    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        hamburger.classList.remove("active");
        mobileMenu.classList.remove("open");
        document.body.style.overflow = "";
        setTimeout(function () {
          mobileMenu.classList.remove("active");
        }, 250);
      });
    });

    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mobileMenu.classList.contains("open")) {
        hamburger.classList.remove("active");
        mobileMenu.classList.remove("open");
        document.body.style.overflow = "";
        setTimeout(function () {
          mobileMenu.classList.remove("active");
        }, 250);
      }
    });
  }

  /* ----------------------------------------------------------
     2. STICKY NAVBAR — Shadow/Glass on Scroll
     ---------------------------------------------------------- */
  function initStickyNavbar() {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    var lastScroll = 0;
    var ticking = false;

    function onScroll() {
      lastScroll = window.scrollY;
      if (!ticking) {
        window.requestAnimationFrame(function () {
          if (lastScroll > 20) {
            navbar.classList.add("navbar--scrolled");
          } else {
            navbar.classList.remove("navbar--scrolled");
          }
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // Initial check
  }

  /* ----------------------------------------------------------
     3. ANNOUNCEMENT BAR — Infinite Marquee Scroll
     ---------------------------------------------------------- */
  function initAnnouncementBar() {
    var bar = document.querySelector(".announcement-bar");
    var track = document.querySelector(".announcement-bar__track");
    if (!bar || !track) return;

    // Duplicate all children for seamless infinite loop
    var children = Array.prototype.slice.call(track.children);
    children.forEach(function (child) {
      track.appendChild(child.cloneNode(true));
    });

    // Add dividers between items if not already present
    var slides = track.querySelectorAll(".announcement-bar__slide");
    slides.forEach(function (slide, i) {
      if (i > 0 && !slide.previousElementSibling.classList.contains("announcement-bar__divider")) {
        var divider = document.createElement("div");
        divider.className = "announcement-bar__divider";
        track.insertBefore(divider, slide);
      }
    });

    // Re-duplicate after adding dividers for seamless loop
    var allItems = Array.prototype.slice.call(track.children);
    allItems.forEach(function (child) {
      track.appendChild(child.cloneNode(true));
    });

    // Dynamically set animation duration based on content width
    var totalWidth = track.scrollWidth / 2;
    var speed = 50; // px per second
    var duration = Math.max(totalWidth / speed, 20);
    track.style.setProperty("--marquee-duration", duration + "s");

    // Touch support: pause on touch, resume after
    bar.addEventListener("touchstart", function () {
      track.style.animationPlayState = "paused";
    }, { passive: true });

    bar.addEventListener("touchend", function () {
      track.style.animationPlayState = "running";
    }, { passive: true });
  }

  /* ----------------------------------------------------------
     4. BACK-TO-TOP BUTTON
     ---------------------------------------------------------- */
  function initBackToTop() {
    var btn = document.querySelector(".back-to-top");
    if (!btn) return;

    var ticking = false;

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          if (window.scrollY > 400) {
            btn.classList.add("visible");
          } else {
            btn.classList.remove("visible");
          }
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ----------------------------------------------------------
     5. TOAST NOTIFICATION SYSTEM
     window.showToast(type, title, message, duration)
     type: "success" | "danger" | "warning" | "info"
     ---------------------------------------------------------- */
  function showToast(type, title, message, duration) {
    type = type || "info";
    duration = duration || 4000;

    var container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    // SVG icon map
    var icons = {
      success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      danger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    var toast = document.createElement("div");
    toast.className = "toast toast--" + type;
    toast.innerHTML =
      '<div class="toast__icon">' + (icons[type] || icons.info) + '</div>' +
      '<div class="toast__content">' +
        '<div class="toast__title">' + escapeHTML(title) + '</div>' +
        (message ? '<div class="toast__message">' + escapeHTML(message) + '</div>' : '') +
      '</div>' +
      '<button class="toast__close" aria-label="Close notification">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>';

    container.appendChild(toast);

    // Close button
    var closeBtn = toast.querySelector(".toast__close");
    closeBtn.addEventListener("click", function () {
      removeToast(toast);
    });

    // Auto-dismiss
    var timer = setTimeout(function () {
      removeToast(toast);
    }, duration);

    // Pause on hover
    toast.addEventListener("mouseenter", function () {
      clearTimeout(timer);
    });
    toast.addEventListener("mouseleave", function () {
      timer = setTimeout(function () {
        removeToast(toast);
      }, 2000);
    });
  }

  function removeToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.add("toast--exiting");
    toast.addEventListener("transitionend", function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    });
    // Fallback if transitionend doesn't fire
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }

  function escapeHTML(str) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // Expose globally
  window.showToast = showToast;

  /* ----------------------------------------------------------
     6. INTERSECTION OBSERVER — Scroll Reveal
     ---------------------------------------------------------- */
  function initScrollReveal() {
    var elements = document.querySelectorAll(".reveal");
    if (!elements.length) return;

    // Respect reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elements.forEach(function (el) {
        el.classList.add("revealed");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px"
      }
    );

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ----------------------------------------------------------
     7. SMOOTH SCROLL for anchor links
     ---------------------------------------------------------- */
  function initSmoothScroll() {
    document.addEventListener("click", function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;

      var targetId = link.getAttribute("href");
      if (targetId === "#" || targetId === "#0") return;

      var target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      var navbarHeight = document.querySelector(".navbar");
      var offset = navbarHeight ? navbarHeight.offsetHeight + 16 : 80;

      var top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: top, behavior: "smooth" });

      // Update URL hash without jump
      history.pushState(null, "", targetId);
    });
  }

  /* ----------------------------------------------------------
     8. DARK / LIGHT MODE TOGGLE
     Persists choice in localStorage.
     ---------------------------------------------------------- */
  function initThemeToggle() {
    var toggleBtn = document.querySelector(".theme-toggle");
    if (!toggleBtn) return;

    var STORAGE_KEY = "savoro-theme";

    function getPreferredTheme() {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return stored;
      return window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark";
    }

    function applyTheme(theme) {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem(STORAGE_KEY, theme);
      updateToggleIcon(theme);
    }

    function updateToggleIcon(theme) {
      var sunIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
      var moonIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
      toggleBtn.innerHTML = theme === "dark" ? sunIcon : moonIcon;
      toggleBtn.setAttribute("aria-label", "Switch to " + (theme === "dark" ? "light" : "dark") + " mode");
    }

    // Apply on load (prevent flash)
    applyTheme(getPreferredTheme());

    toggleBtn.addEventListener("click", function () {
      var current = document.documentElement.getAttribute("data-theme") || "dark";
      var next = current === "dark" ? "light" : "dark";
      applyTheme(next);
    });

    // Listen for OS theme changes
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
      if (!localStorage.getItem(STORAGE_KEY)) {
        applyTheme(e.matches ? "dark" : "light");
      }
    });
  }

  /* ----------------------------------------------------------
     9. QUANTITY SELECTOR (delegated)
     ---------------------------------------------------------- */
  function initQuantitySelectors() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest(".qty-selector__btn");
      if (!btn) return;

      var container = btn.closest(".qty-selector");
      var valueEl = container.querySelector(".qty-selector__value");
      var current = parseInt(valueEl.textContent, 10) || 1;
      var min = parseInt(container.getAttribute("data-min"), 10) || 1;
      var max = parseInt(container.getAttribute("data-max"), 10) || 99;

      if (btn.classList.contains("qty-selector__minus")) {
        valueEl.textContent = Math.max(min, current - 1);
      } else if (btn.classList.contains("qty-selector__plus")) {
        valueEl.textContent = Math.min(max, current + 1);
      }

      // Dispatch event for external listeners
      container.dispatchEvent(new CustomEvent("qty-change", {
        detail: { value: parseInt(valueEl.textContent, 10) },
        bubbles: true
      }));
    });
  }

  /* ----------------------------------------------------------
     10. SET ACTIVE NAV LINK (based on current page)
     ---------------------------------------------------------- */
  function setActiveNavLink() {
    var path = window.location.pathname;
    var filename = path.split("/").pop() || "index.html";

    document.querySelectorAll(".navbar__link, .navbar__mobile-link").forEach(function (link) {
      var href = link.getAttribute("href") || "";
      var linkFile = href.split("/").pop();
      if (linkFile === filename || (filename === "" && linkFile === "index.html")) {
        link.classList.add("active");
      }
    });
  }

  /* ----------------------------------------------------------
     INIT — Run everything on DOMContentLoaded
     ---------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    initMobileMenu();
    initStickyNavbar();
    initAnnouncementBar();
    initBackToTop();
    initScrollReveal();
    initSmoothScroll();
    initThemeToggle();
    initQuantitySelectors();
    setActiveNavLink();
  });

})();
