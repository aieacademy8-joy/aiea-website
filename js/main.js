/* ============================================================
   AI EXPLORERS ACADEMY™ — Interactions
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Year ---------- */
  var yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Nav scroll state ---------- */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (window.scrollY > 40) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var menu = document.getElementById("mobileMenu");
  var toggle = document.getElementById("navToggle");
  var close = document.getElementById("menuClose");
  if (toggle) toggle.addEventListener("click", function () { menu.classList.add("open"); });
  if (close) close.addEventListener("click", function () { menu.classList.remove("open"); });
  if (menu) menu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { menu.classList.remove("open"); });
  });

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Contact form (Formspree, AJAX) ---------- */
  var form = document.getElementById("contactForm");
  var note = document.getElementById("formNote");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var action = form.getAttribute("action") || "";

      if (btn) { btn.disabled = true; }
      note.style.color = "var(--ink-soft)";
      note.textContent = "Sending…";

      fetch(action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (res) {
          if (res.ok) {
            note.textContent = "Thank you! Your message has been sent successfully. We'll get back to you soon.";
            note.style.color = "var(--gold)";
            form.reset();
          } else {
            note.textContent = "Something went wrong. Please try again later.";
            note.style.color = "var(--red)";
          }
        })
        .catch(function () {
          note.textContent = "Something went wrong. Please try again later.";
          note.style.color = "var(--red)";
        })
        .then(function () { if (btn) { btn.disabled = false; } });
    });
  }

  /* ---------- Universal "← Back" link (sub-pages) ---------- */
  var backLink = document.getElementById("backLink");
  if (backLink) {
    backLink.addEventListener("click", function (e) {
      // If the visitor arrived from elsewhere on this site, go back in history;
      // otherwise let the link fall back to its href (index.html).
      var sameSiteReferrer = document.referrer && document.referrer.indexOf(window.location.origin) === 0;
      if (sameSiteReferrer && window.history.length > 1) {
        e.preventDefault();
        window.history.back();
      }
    });
  }
})();
