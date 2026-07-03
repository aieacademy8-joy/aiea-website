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
    var rmError = document.getElementById("modalError");
    var rmSubmitHTML = rmSubmit ? rmSubmit.innerHTML : "";

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
      if (rmError) rmError.hidden = true;
      if (rmSubmit) rmSubmit.innerHTML = rmSubmitHTML;
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
        if (rmSubmit && rmSubmit.disabled) return;

        var payload = {
          first_name: rmFirst ? rmFirst.value.trim() : "",
          email: rmEmail ? rmEmail.value.trim() : "",
          audience: resourceModal.dataset.audience || "",  // parents | educators | schools
          consent: rmOptin ? rmOptin.checked : false
        };

        if (rmError) rmError.hidden = true;
        if (rmSubmit) { rmSubmit.disabled = true; rmSubmit.textContent = "Sending…"; }

        // Submits to our Vercel function, which subscribes the visitor to the matching
        // MailerLite group (Parents / Teachers / School Leaders). The group's automation
        // emails the correct PDF — no direct download is exposed here.
        fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
          .then(function (r) {
            if (!r.ok) throw new Error("subscribe_failed");
            rmForm.hidden = true;
            if (rmThanks) rmThanks.hidden = false;
            setTimeout(closeResourceModal, 3000); // show success, then close
          })
          .catch(function () {
            if (rmSubmit) { rmSubmit.innerHTML = rmSubmitHTML; rmSubmit.disabled = false; }
            if (rmError) {
              rmError.textContent = "Sorry — something went wrong. Please try again, or email missjoy@aiexplorersacademy.org.";
              rmError.hidden = false;
            }
          });
      });
    }
  }

  /* ---------- Community / Newsletter modal (homepage "Join the Movement") ----------
     Same look & interaction as the resource modal. Posts to /api/newsletter, which
     adds the visitor to the MailerLite "Newsletter" group — creating, re-adding, or
     (where allowed) automatically restoring an unsubscribed contact. */
  var nlModal = document.getElementById("newsletterModal");
  if (nlModal) {
    var nlForm = document.getElementById("newsletterForm");
    var nlThanks = document.getElementById("nlThanks");
    var nlThanksMsg = document.getElementById("nlThanksMsg");
    var nlNote = document.getElementById("nlResubNote");
    var nlClose = document.getElementById("nlClose");
    var nlSubmit = document.getElementById("newsletterSubmit");
    var nlFirst = document.getElementById("nlFirst");
    var nlEmail = document.getElementById("nlEmail");
    var nlOptin = document.getElementById("nlOptin");
    var nlError = document.getElementById("nlError");
    var nlSubmitHTML = nlSubmit ? nlSubmit.innerHTML : "";

    var WELCOME_HTML = "<strong>Welcome to the AI Explorers Community!</strong><br>Thank you for joining us. You'll now receive AI literacy resources, updates, and announcements from AI Explorers Academy.";
    var RECONFIRM_HTML = "It looks like you've unsubscribed from our emails before.<br>To respect your previous preference, we've sent you a confirmation email — please click the link inside to restore your subscription, or contact us if you need assistance.";

    // Enable "Join the Community" only when First Name + Email are filled and consent is checked.
    var validateNewsletter = function () {
      if (!nlSubmit) return;
      var ready = !!(nlFirst && nlFirst.value.trim()) &&
                  !!(nlEmail && nlEmail.value.trim()) &&
                  !!(nlOptin && nlOptin.checked);
      nlSubmit.disabled = !ready;
    };
    [nlFirst, nlEmail].forEach(function (el) { if (el) el.addEventListener("input", validateNewsletter); });
    if (nlOptin) nlOptin.addEventListener("change", validateNewsletter);

    var openNewsletter = function () {
      if (nlForm) { nlForm.reset(); nlForm.hidden = false; }
      if (nlNote) nlNote.hidden = false;
      if (nlThanks) nlThanks.hidden = true;
      if (nlError) nlError.hidden = true;
      if (nlSubmit) nlSubmit.innerHTML = nlSubmitHTML;
      validateNewsletter();
      nlModal.classList.add("open");
      nlModal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      if (nlFirst) nlFirst.focus();
    };
    var closeNewsletter = function () {
      nlModal.classList.remove("open");
      nlModal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };

    document.querySelectorAll(".newsletter-trigger").forEach(function (t) {
      t.addEventListener("click", function (e) { e.preventDefault(); openNewsletter(); });
    });
    if (nlClose) nlClose.addEventListener("click", closeNewsletter);
    nlModal.addEventListener("click", function (e) { if (e.target === nlModal) closeNewsletter(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nlModal.classList.contains("open")) closeNewsletter();
    });

    if (nlForm) {
      nlForm.addEventListener("submit", function (e) {
        e.preventDefault();
        if (nlSubmit && nlSubmit.disabled) return;

        var payload = {
          first_name: nlFirst ? nlFirst.value.trim() : "",
          email: nlEmail ? nlEmail.value.trim() : "",
          consent: nlOptin ? nlOptin.checked : false
        };

        if (nlError) nlError.hidden = true;
        if (nlSubmit) { nlSubmit.disabled = true; nlSubmit.textContent = "Joining…"; }

        fetch("/api/newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
          .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, data: d }; }); })
          .then(function (res) {
            if (!res.ok) throw new Error("subscribe_failed");
            var reconfirm = res.data && res.data.status === "reconfirm_required";
            if (nlForm) nlForm.hidden = true;
            if (nlNote) nlNote.hidden = true;
            if (nlThanksMsg) nlThanksMsg.innerHTML = reconfirm ? RECONFIRM_HTML : WELCOME_HTML;
            if (nlThanks) nlThanks.hidden = false;
            // Auto-close after the welcome; leave the re-confirm note up so it can be read.
            if (!reconfirm) setTimeout(closeNewsletter, 3500);
          })
          .catch(function () {
            if (nlSubmit) { nlSubmit.innerHTML = nlSubmitHTML; nlSubmit.disabled = false; }
            if (nlError) {
              nlError.textContent = "Sorry — something went wrong. Please try again, or email missjoy@aiexplorersacademy.org.";
              nlError.hidden = false;
            }
          });
      });
    }
  }

  /* ---------- Request a Printed Copy modal (book page) ----------
     Expression of interest for limited U.S. print batches (NOT a paid pre-order).
     Posts to /api/book-request, which adds the person to the MailerLite print-interest
     group with their state / quantity / audience. Same look as the other modals. */
  var brModal = document.getElementById("bookRequestModal");
  if (brModal) {
    var brForm = document.getElementById("bookRequestForm");
    var brThanks = document.getElementById("brThanks");
    var brNote = document.getElementById("brNote");
    var brClose = document.getElementById("brClose");
    var brSubmit = document.getElementById("bookRequestSubmit");
    var brName = document.getElementById("brName");
    var brEmail = document.getElementById("brEmail");
    var brState = document.getElementById("brState");
    var brQty = document.getElementById("brQty");
    var brFor = document.getElementById("brFor");
    var brError = document.getElementById("brError");
    var brSubmitHTML = brSubmit ? brSubmit.innerHTML : "";

    // Enable submit once Name + Email + State + Purchasing-for are provided (Quantity defaults to 1).
    var validateBookRequest = function () {
      if (!brSubmit) return;
      var ready = !!(brName && brName.value.trim()) &&
                  !!(brEmail && brEmail.value.trim()) &&
                  !!(brState && brState.value.trim()) &&
                  !!(brFor && brFor.value);
      brSubmit.disabled = !ready;
    };
    [brName, brEmail, brState, brQty].forEach(function (el) { if (el) el.addEventListener("input", validateBookRequest); });
    if (brFor) brFor.addEventListener("change", validateBookRequest);

    var openBookRequest = function () {
      if (brForm) { brForm.reset(); brForm.hidden = false; }
      if (brNote) brNote.hidden = false;
      if (brThanks) brThanks.hidden = true;
      if (brError) brError.hidden = true;
      if (brSubmit) brSubmit.innerHTML = brSubmitHTML;
      validateBookRequest();
      brModal.classList.add("open");
      brModal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      if (brName) brName.focus();
    };
    var closeBookRequest = function () {
      brModal.classList.remove("open");
      brModal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };

    document.querySelectorAll(".book-request-trigger").forEach(function (t) {
      t.addEventListener("click", function (e) { e.preventDefault(); openBookRequest(); });
    });
    if (brClose) brClose.addEventListener("click", closeBookRequest);
    brModal.addEventListener("click", function (e) { if (e.target === brModal) closeBookRequest(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && brModal.classList.contains("open")) closeBookRequest();
    });

    if (brForm) {
      brForm.addEventListener("submit", function (e) {
        e.preventDefault();
        if (brSubmit && brSubmit.disabled) return;

        var payload = {
          name: brName ? brName.value.trim() : "",
          email: brEmail ? brEmail.value.trim() : "",
          state: brState ? brState.value.trim() : "",
          quantity: brQty ? brQty.value.trim() : "",
          purchasing_for: brFor ? brFor.value : ""
        };

        if (brError) brError.hidden = true;
        if (brSubmit) { brSubmit.disabled = true; brSubmit.textContent = "Submitting…"; }

        fetch("/api/book-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
          .then(function (r) {
            if (!r.ok) throw new Error("request_failed");
            if (brForm) brForm.hidden = true;
            if (brNote) brNote.hidden = true;
            if (brThanks) brThanks.hidden = false;
            setTimeout(closeBookRequest, 4000);
          })
          .catch(function () {
            if (brSubmit) { brSubmit.innerHTML = brSubmitHTML; brSubmit.disabled = false; }
            if (brError) {
              brError.textContent = "Sorry — something went wrong. Please try again, or email missjoy@aiexplorersacademy.org.";
              brError.hidden = false;
            }
          });
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
