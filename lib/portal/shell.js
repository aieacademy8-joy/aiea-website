"use strict";
// No private data or tokens embedded in HTML. The handler gates this document;
// context is fetched separately under current Auth/profile/membership checks.
module.exports = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Your workspace — AI Explorers Academy</title>
<link rel="stylesheet" href="/portal/portal.css"><script src="/portal/portal.js" defer></script></head>
<body data-page="workspace"><header class="topbar"><a class="brand" href="/" aria-label="AI Explorers Academy home">AI EXPLORERS <span>ACADEMY</span></a>
<button class="quiet" id="signout" type="button">Sign out</button></header>
<main class="workspace"><p class="eyebrow">Your Portal</p><h1>A place to explore.</h1>
<p class="intro">Choose your workspace to explore your programs.</p>
<p id="status" role="status" aria-live="polite">Loading your workspaces…</p>
<button class="quiet" id="retry" type="button" hidden>Try again</button>
<section id="workspace-controls" class="panel" aria-labelledby="choose-title" hidden>
<h2 id="choose-title">Your workspace</h2><label for="workspace-select">Select a workspace</label>
<select id="workspace-select"></select></section>
<section id="workspace-detail" class="panel" aria-labelledby="workspace-name" hidden>
<p id="workspace-kind" class="eyebrow"></p><h2 id="workspace-name"></h2><p id="workspace-role"></p>
<div class="divider"></div><h3>Program access status</h3><ul id="entitlements" class="access-list"></ul>
<button id="programs-open" type="button">My Programs</button></section>
<section id="curriculum" class="panel curriculum" aria-labelledby="curriculum-title" hidden>
<nav class="curriculum-nav" aria-label="Program navigation">
<button id="programs-back" class="quiet" type="button" hidden>My Programs</button>
<button id="missions-back" class="quiet" type="button" hidden>Mission list</button></nav>
<p id="curriculum-locale" class="eyebrow"></p><h2 id="curriculum-title" tabindex="-1"></h2>
<p id="curriculum-version" class="version-note"></p><p id="curriculum-description" class="curriculum-text"></p>
<section id="program-guidance-section" hidden><h3>Guidance</h3><p id="program-guidance" class="curriculum-text"></p></section>
<ol id="curriculum-list" class="curriculum-list"></ol>
<section id="mission-instructions-section" hidden><h3>Instructions</h3><p id="mission-instructions" class="curriculum-text"></p></section>
<section id="mission-reflection-section" hidden><h3>Reflection</h3><p id="mission-reflection" class="curriculum-text"></p></section>
<button id="progress-open" class="quiet" type="button" hidden>Record mission status</button>
<section id="progress-panel" class="mission-status" aria-labelledby="progress-title" hidden>
<h3 id="progress-title">Mission status</h3><p id="progress-explanation"></p>
<label id="subject-label" for="subject-select"></label><select id="subject-select"></select>
<ol id="progress-list" class="access-list"></ol><p id="progress-notice" role="status" aria-live="polite"></p>
<div class="status-actions"><button id="progress-start" type="button" hidden>Start mission</button>
<button id="progress-finish" type="button" hidden>Mark completed</button>
<button id="progress-retry" class="quiet" type="button" hidden>Reload status</button></div></section>
<p id="curriculum-notice" role="status"></p><button id="curriculum-retry" class="quiet" type="button" hidden>Try loading again</button>
</section>
<section id="empty-workspaces" class="panel" hidden><h2>No workspace is available yet.</h2>
<p>Your account does not currently have an active workspace membership. Contact AIEA if you need help.</p></section>
<noscript><p>Enable JavaScript to select your workspace. Your private data stays protected.</p></noscript>
</main><footer>Discover · Imagine · Create with AI</footer></body></html>`;
