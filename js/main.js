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

      // Not configured yet — remind whoever is setting it up.
      if (!action || action.indexOf("YOUR_FORM_ID") !== -1) {
        note.textContent = "Contact form isn't connected yet — add your Formspree form ID to the form's action.";
        note.style.color = "var(--red)";
        return;
      }

      var type = document.getElementById("inq").value;
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
            note.textContent = "Thank you! Your " + type.toLowerCase() + " has been received. We'll be in touch soon.";
            note.style.color = "var(--gold)";
            form.reset();
          } else {
            return res.json().then(function (d) {
              note.textContent = (d && d.errors && d.errors.length)
                ? d.errors.map(function (x) { return x.message; }).join(", ")
                : "Something went wrong. Please email missjoy@aiexplorersacademy.org.";
              note.style.color = "var(--red)";
            });
          }
        })
        .catch(function () {
          note.textContent = "Network error. Please email missjoy@aiexplorersacademy.org.";
          note.style.color = "var(--red)";
        })
        .then(function () { if (btn) { btn.disabled = false; } });
    });
  }
})();
