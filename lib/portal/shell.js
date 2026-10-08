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
<p class="intro">Choose your workspace to see its access status.</p>
<p id="status" role="status" aria-live="polite">Loading your workspaces…</p>
<button class="quiet" id="retry" type="button" hidden>Try again</button>
<section id="workspace-controls" class="panel" aria-labelledby="choose-title" hidden>
<h2 id="choose-title">Your workspace</h2><label for="workspace-select">Select a workspace</label>
<select id="workspace-select"></select></section>
<section id="workspace-detail" class="panel" aria-labelledby="workspace-name" hidden>
<p id="workspace-kind" class="eyebrow"></p><h2 id="workspace-name"></h2><p id="workspace-role"></p>
<div class="divider"></div><h3>Program access status</h3><ul id="entitlements" class="access-list"></ul></section>
<section id="empty-workspaces" class="panel" hidden><h2>No workspace is available yet.</h2>
<p>Your account does not currently have an active workspace membership. Contact AIEA if you need help.</p></section>
<noscript><p>Enable JavaScript to select your workspace. Your private data stays protected.</p></noscript>
</main><footer>Discover · Imagine · Create with AI</footer></body></html>`;
