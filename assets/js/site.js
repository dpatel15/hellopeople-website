/* =============================================================================
   HELLO PEOPLE, website behaviour
   Small, dependency-free. Handles: theme (light/dark) with saved preference,
   sticky-header shadow, mobile nav, reveal-on-scroll, footer year, and the
   contact form (client-side validation + friendly success state).
   ============================================================================= */
(function () {
  "use strict";
  var root = document.documentElement;

  /* ---------------------------------------------------------------- Theme */
  var THEME_KEY = "hp-theme";
  function applyTheme(mode) {
    if (mode === "light" || mode === "dark") {
      root.setAttribute("data-theme", mode);
    } else {
      root.removeAttribute("data-theme"); // fall back to the OS setting
    }
  }
  try { applyTheme(localStorage.getItem(THEME_KEY)); } catch (e) {}

  function currentMode() {
    var set = root.getAttribute("data-theme");
    if (set) return set;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-theme-toggle]");
    if (!btn) return;
    var next = currentMode() === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (err) {}
  });

  /* -------------------------------------------------------- Sticky header */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 4);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ------------------------------------------------------------ Mobile nav */
  var toggle = document.querySelector("[data-nav-toggle]");
  var panel = document.querySelector(".nav-panel");
  if (toggle && panel) {
    var setOpen = function (open) {
      panel.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    };
    toggle.addEventListener("click", function () {
      setOpen(!panel.classList.contains("is-open"));
    });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  }

  /* ------------------------------------------------------- Reveal on scroll
     Robust by design: an element is revealed the moment it reaches the
     viewport, and a scroll/resize sweep guarantees nothing that has already
     scrolled into view can ever stay hidden (a single missed intersection
     sample must never leave real content invisible). */
  var reveals = [].slice.call(document.querySelectorAll(".reveal"));
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function reveal(el) {
    if (el.classList.contains("is-in")) return;
    el.style.transitionDelay = (el.dataset.delay || "0") + "ms";
    el.classList.add("is-in");
  }
  if (reveals.length && "IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { reveal(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });

    var sweep = function () {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      for (var i = reveals.length - 1; i >= 0; i--) {
        var el = reveals[i];
        if (el.classList.contains("is-in")) { reveals.splice(i, 1); continue; }
        if (el.getBoundingClientRect().top < vh * 0.95) { reveal(el); io.unobserve(el); }
      }
    };
    window.addEventListener("scroll", sweep, { passive: true });
    window.addEventListener("resize", sweep, { passive: true });
    window.addEventListener("load", sweep);
    sweep();
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ------------------------------------------------------------ Footer year */
  var yr = document.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ----------------------------------------------------------- Contact form
     Security posture (see contact.html + README):
       - Delivery via Web3Forms, so there is no backend of ours to attack.
       - Honeypot (botcheck) + a time-trap catch dumb bots for free.
       - hCaptcha (Web3Forms' free zero-config) catches the smart ones,
         verified server-side by Web3Forms.
       - We only ever send plain text; nothing is rendered as HTML. */
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    var success = document.querySelector("[data-form-success]");
    var errorBox = form.querySelector("[data-form-error]");
    var submitBtn = form.querySelector("button[type=submit]");
    var loadedAt = Date.now();
    var accessKey = (form.querySelector("[name=access_key]") || {}).value || "";
    var configured = accessKey && accessKey.indexOf("YOUR_") !== 0;

    var showFieldError = function (field, on) {
      var wrap = field.closest(".hp-field");
      if (wrap) wrap.classList.toggle("hp-field--error", on);
    };
    var showSuccess = function () {
      if (!success) return;
      form.style.display = "none";
      if (errorBox) errorBox.classList.remove("is-visible");
      success.classList.add("is-visible");
      success.setAttribute("tabindex", "-1");
      success.focus();
    };
    var showError = function () {
      if (errorBox) errorBox.classList.add("is-visible");
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Try again"; }
    };
    var validate = function () {
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (field) {
        var valid = field.value.trim() !== "";
        if (valid && field.type === "email") {
          valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
        }
        showFieldError(field, !valid);
        if (!valid && ok) field.focus();
        if (!valid) ok = false;
      });
      return ok;
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (errorBox) errorBox.classList.remove("is-visible");

      // Honeypot: a real user cannot tick a hidden box.
      var hp = form.querySelector("[name=botcheck]");
      if (hp && hp.checked) { showSuccess(); return; } // look normal, drop it

      // Time-trap: a genuine person takes more than a few seconds to fill this.
      if (Date.now() - loadedAt < 3000) { showSuccess(); return; }

      if (!validate()) return;

      // Not configured yet (keys still placeholders): confirm locally so the
      // page never looks broken before Web3Forms is set up.
      if (!configured) { showSuccess(); return; }

      // Require the hCaptcha token when the widget is present.
      var widget = form.querySelector(".h-captcha");
      var token = (form.querySelector("[name='h-captcha-response']") || {}).value || "";
      if (widget && !token) { showError(); return; }

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending..."; }

      var data = {};
      new FormData(form).forEach(function (v, k) { if (k !== "botcheck") data[k] = v; });

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.success) { showSuccess(); }
        else { showError(); if (window.hcaptcha) try { window.hcaptcha.reset(); } catch (e) {} }
      })
      .catch(function () {
        showError();
        if (window.hcaptcha) try { window.hcaptcha.reset(); } catch (e) {}
      });
    });

    form.addEventListener("input", function (e) {
      if (e.target.closest(".hp-field--error")) showFieldError(e.target, false);
    });
  }
})();
