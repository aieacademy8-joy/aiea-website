(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var status = $('status');
  function message(text) { status.textContent = text; }
  // Coordination carries only a signal, never identities, codes or credentials.
  var channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('aiea-portal-session') : null;
  var sessionChanged = function () {};
  if (channel) channel.onmessage = function (event) { sessionChanged(event.data === 'pending'); };
  function announce(pending) { if (channel) channel.postMessage(pending ? 'pending' : 'revalidate'); }
  async function api(body) {
    var response = await fetch('/api/portal/auth', { method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' });
    var data = await response.json();
    if (!response.ok) throw new Error(data.error || 'temporarily_unavailable');
    return data;
  }
  function friendly(error) {
    return ({ invalid_or_expired_code: 'That code is invalid or has expired. Please try again or request a new code.',
      invalid_code: 'Enter the six digits from your email.', try_again_later: 'Please wait a minute before trying again.',
      adult_access_required: 'This account does not currently have adult Portal access. Contact AIEA for help.',
      not_configured: 'Sign-in is not available yet. Please try again later.',
      signout_required: 'Signout is incomplete. Retry signout before signing in again.' })[error.message] || 'We couldn’t complete that request. Please try again.';
  }
  if (document.body.dataset.page === 'login') {
    var address = '', busy = false, cooldown = 0;
    var notice = new URLSearchParams(window.location.search);
    if (notice.has('expired')) message('Your session has ended. Sign in again to continue.');
    if (notice.has('signed_out')) message('You’re signed out of this Portal session.');
    if (notice.has('signout_pending')) { message(friendly(new Error('signout_required'))); $('retry-signout').hidden = false; }
    $('retry-signout').addEventListener('click', async function () {
      this.disabled = true; announce(true); message('Retrying signout…');
      try { await api({ action: 'signout' }); announce(); window.location.replace('/portal/login.html?signed_out=1'); }
      catch (_) { announce(); message('Signout is still incomplete. Please retry.'); this.disabled = false; }
    });
    function lock(value) {
      busy = value;
      ['request-code','verify-code','change-email'].forEach(function (id) { $(id).disabled = value; });
      $('resend').disabled = value || cooldown > Date.now();
    }
    function countdown() {
      var left = Math.max(0, Math.ceil((cooldown - Date.now()) / 1000));
      $('resend').textContent = left ? 'Resend in ' + left + 's' : 'Resend code';
      $('resend').disabled = busy || left > 0;
      if (left) window.setTimeout(countdown, 1000);
    }
    async function request() {
      if (busy) return;
      lock(true); message('Requesting your sign-in code…');
      try {
        await api({ action: 'request', email: address }); cooldown = Date.now() + 60000;
        $('email-form').hidden = true; $('code-form').hidden = false;
        $('delivery-note').textContent = 'If an existing account uses ' + address + ', a code will arrive shortly.';
        message('Check your inbox for your sign-in code.'); $('code').focus(); countdown();
      } catch (error) { message(friendly(error)); if (error.message === 'signout_required') $('retry-signout').hidden = false; }
      finally { lock(false); }
    }
    $('email-form').addEventListener('submit', function (event) {
      event.preventDefault(); address = $('email').value.trim(); request();
    });
    $('resend').addEventListener('click', request);
    $('change-email').addEventListener('click', function () {
      $('code-form').hidden = true; $('email-form').hidden = false; $('code').value = '';
      message(''); $('email').focus();
    });
    $('code-form').addEventListener('submit', async function (event) {
      event.preventDefault(); if (busy) return; lock(true); message('Checking your code…');
      announce(true);
      var code = $('code').value; $('code').value = '';
      try { await api({ action: 'verify', email: address, code: code }); window.location.replace('/portal'); }
      catch (error) { message(friendly(error)); if (error.message === 'signout_required') $('retry-signout').hidden = false; $('code').focus(); }
      finally { announce(); code = ''; lock(false); }
    });
    return;
  }
  var selected = null, generation = 0, controller, expiry, signingOut = false, remotePending = false;
  var pendingRecovery, pendingUntil = 0, pendingGrace = 10000, pendingValidation = false;
  function clear() {
    $('workspace-detail').hidden = true; $('workspace-controls').hidden = true;
    $('empty-workspaces').hidden = true;
    ['workspace-name','workspace-kind','workspace-role'].forEach(function (id) { $(id).textContent = ''; });
    $('entitlements').replaceChildren(); $('workspace-select').replaceChildren();
    $('retry').hidden = true; window.clearTimeout(expiry);
  }
  function endSession() {
    generation++; if (controller) controller.abort(); clear();
    window.location.replace('/portal/login.html?expired=1');
  }
  async function load() {
    if (signingOut || remotePending) return;
    var requestId = ++generation;
    if (controller) controller.abort(); controller = new AbortController();
    clear(); message('Loading your workspaces…');
    try {
      var response = await fetch('/api/portal/context' + (selected ? '?workspace_id=' + encodeURIComponent(selected) : ''),
        { credentials: 'same-origin', cache: 'no-store', signal: controller.signal });
      if (requestId !== generation) return;
      if (response.status === 401) {
        var denied = await response.json();
        if (requestId !== generation) return;
        if (denied.error === 'signout_required') { clear(); window.location.replace('/portal/login.html?signout_pending=1'); }
        else endSession();
        return;
      }
      if (response.status === 403 && !selected) { endSession(); return; }
      if (response.status === 403) { selected = null; message('Workspace access has changed.'); await load(); return; }
      if (!response.ok) throw new Error();
      var data = await response.json(); if (requestId !== generation) return;
      expiry = window.setTimeout(endSession, Math.max(0, data.session_expires_at * 1000 - Date.now()));
      selected = data.selected_workspace_id;
      if (!data.workspaces.length) { $('empty-workspaces').hidden = false; message(''); return; }
      var placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = 'Choose a workspace';
      $('workspace-select').append(placeholder);
      data.workspaces.forEach(function (workspace) {
        var option = document.createElement('option'); option.value = workspace.id;
        option.textContent = workspace.display_name; $('workspace-select').append(option);
      });
      $('workspace-select').value = selected || ''; $('workspace-controls').hidden = false;
      var workspace = data.workspaces.find(function (item) { return item.id === selected; });
      if (!workspace) { message('Select a workspace to continue.'); return; }
      $('workspace-name').textContent = workspace.display_name;
      $('workspace-kind').textContent = workspace.kind === 'FAMILY' ? 'Family workspace' : 'School workspace';
      $('workspace-role').textContent = 'Your role: ' + ({ OWNER: 'Owner', SCHOOL_ADMIN: 'School administrator', TEACHER: 'Teacher' })[workspace.role];
      data.entitlements.forEach(function (entitlement) {
        var li = document.createElement('li'), label = document.createElement('strong'), version = document.createElement('span');
        label.textContent = entitlement.status;
        version.textContent = 'Program version ' + entitlement.program_version_id;
        li.append(label, version); $('entitlements').append(li);
      });
      if (!data.entitlements.length) {
        var empty = document.createElement('li'); empty.textContent = 'No program access is listed for this workspace.'; $('entitlements').append(empty);
      }
      $('workspace-detail').hidden = false; message('');
    } catch (error) {
      if (requestId !== generation || error.name === 'AbortError') return;
      clear(); message('We couldn’t load your workspace. Please try again.'); $('retry').hidden = false;
    } finally {
      if (requestId === generation) pendingValidation = false;
    }
  }
  $('workspace-select').addEventListener('change', function () { selected = this.value || null; load(); });
  $('retry').addEventListener('click', load);
  $('signout').addEventListener('click', async function () {
    signingOut = true; generation++; if (controller) controller.abort(); clear();
    announce(true);
    $('signout').disabled = true; message('Signing out…');
    try { await api({ action: 'signout' }); announce(); window.location.replace('/portal/login.html?signed_out=1'); }
    catch (_) { announce(); message('Your private view is cleared. Signout is incomplete. Please try signing out again.'); $('signout').disabled = false; }
  });
  sessionChanged = function (pending) {
    if (pending === true && (remotePending || pendingValidation)) {
      // One episode includes its recovery read. Duplicate/stale pending cannot
      // renew the first deadline or cancel that read while its response is held.
      if (remotePending && performance.now() >= pendingUntil) sessionChanged(false);
      else { clear(); selected = null; }
      return;
    }
    if (pending === true) {
      remotePending = true; pendingUntil = performance.now() + pendingGrace;
      window.clearTimeout(pendingRecovery);
      // The sender can disappear. Expiry permits only a fresh server read,
      // never restoration of the cleared workspace or removal of logout quarantine.
      pendingRecovery = window.setTimeout(function () { sessionChanged(false); }, pendingGrace);
    } else if (pending === false || (remotePending && performance.now() >= pendingUntil)) {
      pendingValidation = pendingValidation || remotePending;
      remotePending = false; pendingUntil = 0; window.clearTimeout(pendingRecovery);
    }
    generation++; if (controller) controller.abort(); clear(); selected = null;
    if (!document.hidden && !signingOut) load();
  };
  // Clear before focus returns to trusted content; re-read server authority.
  window.addEventListener('blur', function () { generation++; if (controller) controller.abort(); clear(); });
  window.addEventListener('focus', sessionChanged);
  // Recover missing completion even with a channel; focus/visibility also check
  // the monotonic deadline if background timer delivery was deferred.
  window.setInterval(function () {
    // An active recovery already revalidates; periodic work must not starve it.
    if (!pendingValidation || !controller || controller.signal.aborted) sessionChanged();
  }, 30000);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { generation++; if (controller) controller.abort(); clear(); }
    else sessionChanged();
  });
  window.addEventListener('pageshow', load);
  window.addEventListener('pagehide', function () { generation++; if (controller) controller.abort(); clear(); });
}());
