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

  /* ---------- Free AI Literacy Library: resource request modal ----------
     No direct download is exposed. Each resource row carries data-resource / data-pdf /
     data-audience; clicking the title or "Get PDF" opens a modal that (later) collects the
     visitor before the PDF is emailed to them. */
  var resourceModal = document.getElementById("resourceModal");
  if (resourceModal) {
    var rmName = document.getElementById("modalResourceName");
    var rmForm = document.getElementById("resourceForm");
    var rmThanks = document.getElementById("modalThanks");
    var rmClose = document.getElementById("modalClose");
    var rmSubmit = document.getElementById("resourceSubmit");
    var rmFirst = document.getElementById("mFirst");
    var rmEmail = document.getElementById("mEmail");
    var rmOptin = document.getElementById("mOptin");

    // Enable "Send Me the PDF" only when First Name + Email are filled and consent is checked.
    var validateResourceForm = function () {
      if (!rmSubmit) return;
      var ready = !!(rmFirst && rmFirst.value.trim()) &&
                  !!(rmEmail && rmEmail.value.trim()) &&
                  !!(rmOptin && rmOptin.checked);
      rmSubmit.disabled = !ready;
    };
    [rmFirst, rmEmail].forEach(function (el) { if (el) el.addEventListener("input", validateResourceForm); });
    if (rmOptin) rmOptin.addEventListener("change", validateResourceForm);

    var openResourceModal = function (row) {
      resourceModal.dataset.pdf = row.getAttribute("data-pdf") || "";
      resourceModal.dataset.audience = row.getAttribute("data-audience") || "";
      if (rmName) rmName.textContent = row.getAttribute("data-resource") || "your free resource";
      if (rmForm) { rmForm.reset(); rmForm.hidden = false; }
      if (rmThanks) rmThanks.hidden = true;
      validateResourceForm();
      resourceModal.classList.add("open");
      resourceModal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      var first = document.getElementById("mFirst");
      if (first) first.focus();
    };
    var closeResourceModal = function () {
      resourceModal.classList.remove("open");
      resourceModal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };

    document.querySelectorAll(".resource-trigger").forEach(function (t) {
      t.addEventListener("click", function () {
        var row = t.closest(".resource-row");
        if (row) openResourceModal(row);
      });
    });
    if (rmClose) rmClose.addEventListener("click", closeResourceModal);
    resourceModal.addEventListener("click", function (e) { if (e.target === resourceModal) closeResourceModal(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && resourceModal.classList.contains("open")) closeResourceModal();
    });

    if (rmForm) {
      rmForm.addEventListener("submit", function (e) {
        e.preventDefault();
        /* === MailerLite integration point ===
           Replace this block with your MailerLite subscribe call using:
             first name → #mFirst, email → #mEmail, opt-in → #mOptin,
             audience   → resourceModal.dataset.audience
           On success, MailerLite emails the file at resourceModal.dataset.pdf.
           Do NOT expose a direct download link on the page. */
        rmForm.hidden = true;
        if (rmThanks) rmThanks.hidden = false;
      });
    }
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
