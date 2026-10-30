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
  var curriculumGeneration = 0, curriculumController, curriculumVersion = null, curriculumMission = null;
  var contextAuthority = null, readingContext = null, periodicRequest = 0;
  var progressGeneration = 0, progressController, progressSubject = null, progressData = null;
  var curriculumMissions = [];
  var curriculumLocale = 'en-US', curriculumResolvedLocale = null, curriculumLocales = [], missionNavigation = null;
  var resourceGeneration = 0, resourceController, resourceData = null;
  function clearResources() {
    resourceGeneration++; if (resourceController) resourceController.abort(); resourceData = null;
    $('resources-open').hidden = true; $('resources-open').disabled = false;
    $('resources-panel').hidden = true; $('resources-list').replaceChildren(); $('resources-notice').textContent = '';
  }
  function languageName(code) {
    try { return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) + ' (' + code + ')'; }
    catch (_) { return code; }
  }
  function clearProgress() {
    progressGeneration++; if (progressController) progressController.abort();
    progressSubject = null; progressData = null;
    $('progress-panel').hidden = true; $('progress-open').hidden = true;
    $('subject-select').replaceChildren(); $('progress-list').replaceChildren();
    $('curriculum-list').hidden = false;
    $('progress-summary').hidden = true; $('progress-continue').hidden = true;
    $('progress-summary').className = 'progress-summary';
    $('progress-meter').hidden = true; $('progress-meter').value = 0; $('progress-meter').max = 1;
    ['subject-label','progress-explanation','progress-notice','progress-summary-text','progress-title','progress-meter-label'].forEach(function (id) { $(id).textContent = ''; });
    ['progress-start','progress-finish','progress-retry'].forEach(function (id) { $(id).hidden = true; $(id).disabled = false; });
  }
  function authority(data) {
    var workspace = data.workspaces.find(function (item) { return item.id === data.selected_workspace_id; });
    return workspace && { workspace: workspace.id, kind: workspace.kind, role: workspace.role, expires: data.session_expires_at,
      versions: Array.from(new Set(data.entitlements.filter(function (e) { return e.status === 'ACTIVE'; })
        .map(function (e) { return e.program_version_id; }))).sort() };
  }
  function sameAuthority(resume, fresh) {
    return fresh && resume.workspace === fresh.workspace && resume.kind === fresh.kind && resume.role === fresh.role &&
      resume.expires === fresh.expires && (resume.version ? fresh.versions.includes(resume.version) :
        JSON.stringify(resume.versions) === JSON.stringify(fresh.versions));
  }
  function clearCurriculum() {
    clearProgress();
    clearResources();
    readingContext = null;
    curriculumMissions = [];
    curriculumLocales = []; curriculumResolvedLocale = null; missionNavigation = null;
    $('curriculum-language-controls').hidden = true; $('curriculum-language-select').replaceChildren();
    $('curriculum-language-select').value = ''; $('curriculum-language-notice').textContent = '';
    $('mission-navigation').hidden = true; $('mission-previous').disabled = true; $('mission-next').disabled = true;
    curriculumGeneration++; if (curriculumController) curriculumController.abort();
    $('curriculum').hidden = true; $('curriculum-list').replaceChildren();
    ['curriculum-title','curriculum-locale','curriculum-version','curriculum-sequence','curriculum-description','program-guidance',
      'mission-instructions','mission-reflection','curriculum-notice'].forEach(function (id) { $(id).textContent = ''; });
    ['programs-back','missions-back','program-guidance-section','mission-instructions-section',
      'mission-reflection-section','curriculum-retry'].forEach(function (id) { $(id).hidden = true; });
    ['curriculum-title','curriculum-description','program-guidance','mission-instructions','mission-reflection'].forEach(function (id) { $(id).lang = ''; });
  }
  function clear() {
    contextAuthority = null; periodicRequest = 0;
    clearCurriculum(); curriculumVersion = null; curriculumMission = null;
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
  async function load(resume, periodic) {
    if (signingOut || remotePending) return;
    var requestId = ++generation;
    if (controller) controller.abort(); controller = new AbortController();
    clear(); message('Loading your workspaces…');
    // Only the periodic caller supplies a route snapshot, never curriculum bytes.
    if (resume && resume.workspace === selected) periodicRequest = requestId;
    else { resume = null; if (periodic === true) periodicRequest = requestId; }
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
      if (data.session_expires_at * 1000 <= Date.now()) { endSession(); return; }
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
      contextAuthority = authority(data);
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
      if (resume) {
        if (sameAuthority(resume, contextAuthority)) await loadCurriculum(resume.version, resume.mission, resume);
        else message('Your access has changed. Open My Programs to see what is available.');
      }
    } catch (error) {
      if (requestId !== generation || error.name === 'AbortError') return;
      clear(); message('We couldn’t load your workspace. Please try again.'); $('retry').hidden = false;
    } finally {
      if (periodicRequest === requestId) periodicRequest = 0;
      if (requestId === generation) pendingValidation = false;
    }
  }
  async function loadCurriculum(version, mission, resume) {
    if (!selected || signingOut || remotePending || document.hidden) return;
    // Keep only the subject ID within this exact workspace/version. Every
    // navigation obtains fresh subject authorization/status before displaying it.
    var progressResume = resume && resume.progressOpen ? { subject: resume.progressSubject } :
      readingContext && readingContext.progressOpen && readingContext.workspace === selected && readingContext.version === version ?
        { subject: readingContext.progressSubject } : null;
    var locale = resume && resume.locale || curriculumLocale;
    clearCurriculum(); curriculumVersion = version || null; curriculumMission = mission || null;
    var requestId = curriculumGeneration, workspaceId = selected, sessionGeneration = generation;
    curriculumController = new AbortController(); message('Loading your programs…');
    var query = '?workspace_id=' + encodeURIComponent(workspaceId) + '&locale=' + encodeURIComponent(locale);
    if (version) query += '&program_version_id=' + encodeURIComponent(version);
    if (mission) query += '&mission_id=' + encodeURIComponent(mission);
    function current() { return requestId === curriculumGeneration && sessionGeneration === generation && selected === workspaceId; }
    try {
      var response = await fetch('/api/portal/curriculum' + query,
        { credentials: 'same-origin', cache: 'no-store', signal: curriculumController.signal });
      if (!current()) return;
      var data = await response.json(); if (!current()) return;
      if (response.status === 401) {
        if (data.error === 'signout_required') { clear(); window.location.replace('/portal/login.html?signout_pending=1'); }
        else endSession();
        return;
      }
      if (response.status === 403) { clear(); selected = null; message('Workspace access has changed. Choose an available workspace.'); $('retry').hidden = false; return; }
      if (!response.ok) {
        var notice = response.status === 409 ? 'This program is unavailable in the requested language. Return to My Programs to choose one of its published languages.' :
          response.status === 404 ? 'This curriculum is no longer available for this workspace.' : 'We couldn’t load your program. Please try again.';
        clearCurriculum(); $('curriculum').hidden = false; $('curriculum-notice').textContent = notice;
        $('programs-back').hidden = false; $('curriculum-retry').hidden = false; message(''); return;
      }
      if (data.workspace_id !== workspaceId || data.view !== (mission ? 'mission' : version ? 'program' : 'catalog')) throw new Error();
      if (version && (!data.program || data.program.program_version_id !== version || (mission && (!data.mission || data.mission.id !== mission)))) throw new Error();
      if (data.requested_locale !== undefined && data.requested_locale !== locale) throw new Error();
      // Legacy mission responses remain mission responses. Do not infer lesson
      // identity, hierarchy or partial pilot access from their keys or ordinals.
      if (data.sequence !== undefined) {
        var sequence = data.sequence;
        if (data.view === 'catalog' || !sequence || sequence.unit !== 'MISSION' ||
            !Number.isSafeInteger(sequence.total) || sequence.total < 0 || sequence.total > 100 ||
            (data.view === 'program' ? sequence.position !== null || !Array.isArray(data.missions) || sequence.total !== data.missions.length :
              !Number.isSafeInteger(sequence.position) || sequence.position < 1 || sequence.position > sequence.total || !data.navigation ||
              (data.navigation.previous_mission_id === null) !== (sequence.position === 1) ||
              (data.navigation.next_mission_id === null) !== (sequence.position === sequence.total))) throw new Error();
      }
      if (resume) {
        // Reconcile after the fresh curriculum read, before any automatic display.
        var checked = await fetch('/api/portal/context?workspace_id=' + encodeURIComponent(workspaceId),
          { credentials: 'same-origin', cache: 'no-store', signal: curriculumController.signal });
        if (!current()) return;
        var fresh = await checked.json(); if (!current()) return;
        if (checked.status === 401) {
          if (fresh.error === 'signout_required') { clear(); window.location.replace('/portal/login.html?signout_pending=1'); }
          else endSession();
          return;
        }
        if (checked.status === 403) { clear(); selected = null; message('Workspace access has changed. Choose an available workspace.'); $('retry').hidden = false; return; }
        if (!checked.ok) throw new Error();
        if (fresh.session_expires_at * 1000 <= Date.now() || data.session_expires_at * 1000 <= Date.now()) { endSession(); return; }
        var freshAuthority = authority(fresh);
        var sameContent = freshAuthority && (version ? data.program.program_version_id === version && (!mission || data.mission.id === mission) :
          JSON.stringify(data.programs.map(function (item) { return item.program_version_id; }).sort()) === JSON.stringify(freshAuthority.versions));
        if (!sameAuthority(resume, freshAuthority) || data.session_expires_at !== freshAuthority.expires || !sameContent) {
          // Valid transitions refresh the summary without continuing the old route.
          await load(null, true); return;
        }
      }
      window.clearTimeout(expiry);
      expiry = window.setTimeout(endSession, Math.max(0, data.session_expires_at * 1000 - Date.now()));
      $('curriculum-title').textContent = data.view === 'catalog' ? 'My Programs' : data.view === 'program' ? data.program.title : data.mission.title;
      $('programs-back').hidden = data.view === 'catalog'; $('missions-back').hidden = data.view !== 'mission';
      if (data.sequence) $('curriculum-sequence').textContent = data.view === 'program' ?
        data.sequence.total + (data.sequence.total === 1 ? ' mission available' : ' missions available') :
        'Mission ' + data.mission.sequence + ' · ' + data.sequence.position + ' of ' + data.sequence.total;
      if (data.program) {
        $('curriculum-locale').textContent = data.program.resolved_locale;
        $('curriculum-version').textContent = data.program.title + ' · Version ' + data.program.version_key;
        if (data.view === 'program') {
          $('curriculum-description').textContent = data.program.description;
          $('program-guidance').textContent = data.program.guidance;
          $('program-guidance-section').hidden = !data.program.guidance;
        }
      }
      // Choices come only from published rows in this authorized response.
      var localizedPrograms = data.view === 'catalog' ? data.programs : [data.program];
      curriculumLocales = Array.from(new Set(localizedPrograms.flatMap(function (item) { return item.available_locales || []; }))).sort();
      if (curriculumLocales.some(function (code) { return typeof code !== 'string' || code.length > 35 || !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(code); })) throw new Error();
      if (curriculumLocales.length) {
        if (!curriculumLocales.includes(locale)) {
          var chooseLanguage = document.createElement('option'); chooseLanguage.value = ''; chooseLanguage.textContent = 'Choose a published language'; $('curriculum-language-select').append(chooseLanguage);
        }
        curriculumLocales.forEach(function (code) { var option = document.createElement('option'); option.value = code; option.textContent = languageName(code); $('curriculum-language-select').append(option); });
        $('curriculum-language-select').value = curriculumLocales.includes(locale) ? locale : '';
        $('curriculum-language-select').disabled = curriculumLocales.length === 1 && curriculumLocales.includes(locale);
        $('curriculum-language-controls').hidden = false;
      }
      if (data.view !== 'catalog') {
        ['curriculum-title','curriculum-description','program-guidance','mission-instructions','mission-reflection'].forEach(function (id) { $(id).lang = data.program.resolved_locale; });
        if (data.program.resolved_locale !== locale) $('curriculum-language-notice').textContent = languageName(locale) +
          ' is unavailable for this program. Showing its published fallback: ' + languageName(data.program.resolved_locale) + '.';
      } else if (curriculumLocales.length && !curriculumLocales.includes(locale)) $('curriculum-language-notice').textContent =
        'The requested language is unavailable. Choose a published curriculum language.';
      if (data.view === 'mission') {
        $('mission-instructions').textContent = data.mission.instructions;
        $('mission-reflection').textContent = data.mission.reflection;
        $('mission-instructions-section').hidden = false; $('mission-reflection-section').hidden = !data.mission.reflection;
        $('resources-open').hidden = false;
        if (data.navigation) {
          var previous = data.navigation.previous_mission_id, next = data.navigation.next_mission_id;
          if ([previous,next].some(function (id) { return id !== null && (typeof id !== 'string' || !id || id === mission); }) || (previous && previous === next)) throw new Error();
          missionNavigation = data.navigation;
          $('mission-previous').disabled = previous === null; $('mission-next').disabled = next === null; $('mission-navigation').hidden = false;
        }
      } else {
        var list = data.view === 'catalog' ? data.programs : data.missions;
        list.forEach(function (item) {
          var li = document.createElement('li'), button = document.createElement('button'), detail = document.createElement('span');
          button.type = 'button'; button.className = 'curriculum-choice';
          button.textContent = data.view === 'catalog' ? (item.title || item.program_key) : item.sequence + '. ' + item.title;
          button.lang = data.view === 'catalog' ? item.resolved_locale || '' : data.program.resolved_locale;
          button.addEventListener('click', function () {
            loadCurriculum(data.view === 'catalog' ? item.program_version_id : version, data.view === 'catalog' ? null : item.id);
          });
          detail.textContent = data.view === 'catalog' ? 'Version ' + item.version_key + (item.resolved_locale ? ' · ' + item.resolved_locale : ' · Language unavailable') : 'Mission ' + item.sequence;
          if (data.view === 'catalog' && item.resolved_locale && item.resolved_locale !== locale) detail.textContent += ' · Published fallback for ' + languageName(locale);
          li.append(button, detail); $('curriculum-list').append(li);
        });
        if (!list.length) $('curriculum-notice').textContent = data.view === 'catalog' ? 'No programs are available for this workspace.' : 'No missions are published for this program.';
      }
      readingContext = { workspace: contextAuthority.workspace, kind: contextAuthority.kind, role: contextAuthority.role,
        expires: contextAuthority.expires, versions: contextAuthority.versions, version: version || null, mission: mission || null, locale: locale };
      curriculumLocale = locale;
      curriculumResolvedLocale = data.program && data.program.resolved_locale || null;
      curriculumMissions = data.view === 'program' ? data.missions : data.view === 'mission' ? [data.mission] : [];
      $('curriculum').hidden = false; message(''); $('curriculum-title').focus();
      $('progress-open').hidden = data.view === 'catalog';
      $('progress-open').textContent = data.view === 'program' ? 'View program progress' : 'Record mission status';
      if (progressResume) await loadProgress(progressResume.subject);
    } catch (error) {
      if (!current() || error.name === 'AbortError') return;
      clearCurriculum(); $('curriculum').hidden = false; $('curriculum-notice').textContent = 'We couldn’t load your program. Please try again.';
      $('programs-back').hidden = false; $('curriculum-retry').hidden = false; message('');
    }
  }
  async function loadResources() {
    if (!selected || !curriculumVersion || !curriculumMission || !readingContext || signingOut || remotePending || document.hidden) return;
    clearResources(); $('resources-open').hidden = false; $('resources-open').disabled = true;
    $('resources-panel').hidden = false; $('resources-notice').textContent = 'Loading learning resources…';
    var rid = resourceGeneration, sid = generation, cid = curriculumGeneration;
    var workspace = selected, version = curriculumVersion, mission = curriculumMission, locale = curriculumLocale;
    resourceController = new AbortController();
    function current() { return rid === resourceGeneration && sid === generation && cid === curriculumGeneration; }
    try {
      var query = new URLSearchParams({workspace_id:workspace,program_version_id:version,mission_id:mission,locale:locale});
      var response = await fetch('/api/portal/resources?' + query, {credentials:'same-origin',cache:'no-store',signal:resourceController.signal});
      if (!current()) return;
      var data = await response.json(); if (!current()) return;
      if (response.status === 401) { clear(); window.location.replace('/portal/login.html?' + (data.error === 'signout_required' ? 'signout_pending=1' : 'expired=1')); return; }
      if (response.status === 403 || response.status === 404) { clearCurriculum(); message('Your curriculum access has changed. Reload your workspace.'); $('retry').hidden = false; return; }
      if (!response.ok || data.workspace_id !== workspace || data.program_version_id !== version || data.mission_id !== mission ||
          data.requested_locale !== locale || data.resolved_locale !== curriculumResolvedLocale || !contextAuthority ||
          data.session_expires_at !== contextAuthority.expires || data.session_expires_at * 1000 <= Date.now() ||
          !Array.isArray(data.resources) || !Number.isSafeInteger(data.other_language_count) || data.other_language_count < 0 ||
          new Set(data.resources.map(function (r) { return r.id; })).size !== data.resources.length) throw new Error();
      data.resources.forEach(function (r) {
        if (typeof r.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(r.id) ||
            typeof r.asset_key !== 'string' || !r.asset_key || r.asset_key.length > 200 ||
            (r.locale_neutral === true ? r.locale_code !== null : r.locale_neutral !== false || r.locale_code !== curriculumResolvedLocale)) throw new Error();
        var li = document.createElement('li'), button = document.createElement('button');
        button.type = 'button'; button.className = 'curriculum-choice'; button.textContent = 'Download ' + r.asset_key;
        button.addEventListener('click', function () { downloadResource(r.id,button); });
        li.append(button); $('resources-list').append(li);
      });
      resourceData = {query:query.toString(),resources:data.resources};
      $('resources-notice').textContent = (data.resources.length ? 'Downloads use the published files for this program version.' :
        'No learning resources are published for this mission in this language.') +
        (data.other_language_count ? ' Additional resources exist in other published languages. Choose a curriculum language to view them.' : '');
    } catch(error) {
      if (!current() || error.name === 'AbortError') return;
      clearResources(); $('resources-open').hidden = false; $('resources-panel').hidden = false;
      $('resources-notice').textContent = 'We couldn’t load learning resources. Try opening them again.';
    } finally { if (current()) $('resources-open').disabled = false; }
  }
  async function downloadResource(id,button) {
    if (!resourceData || !resourceData.resources.some(function (r) { return r.id === id; }) || button.disabled || signingOut || remotePending || document.hidden) return;
    var rid = resourceGeneration, sid = generation, cid = curriculumGeneration;
    function current() { return rid === resourceGeneration && sid === generation && cid === curriculumGeneration; }
    button.disabled = true; $('resources-notice').textContent = 'Preparing your download…';
    try {
      var response = await fetch('/api/portal/resources?' + resourceData.query + '&resource_id=' + encodeURIComponent(id),
        {credentials:'same-origin',cache:'no-store',signal:resourceController.signal});
      if (!current()) return;
      if (response.status === 401) { var denied = await response.json(); if (!current()) return;
        clear(); window.location.replace('/portal/login.html?' + (denied.error === 'signout_required' ? 'signout_pending=1' : 'expired=1')); return; }
      if (response.status === 403 || response.status === 404) { clearCurriculum(); message('Your curriculum access has changed. Reload your workspace.'); $('retry').hidden = false; return; }
      if (!response.ok) { var failure = await response.json(); if (!current()) return;
        $('resources-notice').textContent = failure.error === 'resource_too_large' ? 'This file is too large for Portal downloads. Contact AIEA for help.' :
          failure.error === 'resources_not_configured' ? 'Resource downloads are not available yet. Contact AIEA for help.' : 'We couldn’t prepare this file. Try downloading it again.'; return; }
      var filename = /^attachment; filename="([A-Za-z0-9_.-]{1,115})"$/.exec(response.headers.get('Content-Disposition') || '');
      if (!filename || response.headers.get('Content-Type') !== 'application/octet-stream') throw new Error();
      var file = await response.blob(); if (!current()) return;
      if (file.size > 4000000) throw new Error();
      var url = URL.createObjectURL(file), link = document.createElement('a');
      try { link.href = url; link.download = filename[1]; document.body.append(link); link.click(); }
      finally { link.remove(); URL.revokeObjectURL(url); }
      $('resources-notice').textContent = 'Your file is ready. Check your browser’s downloads.';
    } catch(error) {
      if (!current() || error.name === 'AbortError') return;
      $('resources-notice').textContent = 'We couldn’t prepare this file. Try downloading it again.';
    } finally { if (current()) button.disabled = false; }
  }
  $('resources-open').addEventListener('click', loadResources);
  async function loadProgress(subject) {
    if (!selected || !curriculumVersion || !readingContext || signingOut || remotePending || document.hidden) return;
    clearProgress(); $('progress-open').hidden = false;
    var requestId = progressGeneration, sessionId = generation, curriculumId = curriculumGeneration;
    var workspaceId = selected, versionId = curriculumVersion;
    progressSubject = subject || null; progressController = new AbortController();
    function current() { return requestId === progressGeneration && sessionId === generation && curriculumId === curriculumGeneration && selected === workspaceId; }
    $('progress-panel').hidden = false; $('progress-notice').textContent = 'Loading mission status…';
    $('progress-title').textContent = curriculumMission ? 'Mission status' : 'Program progress';
    var query = '?workspace_id=' + encodeURIComponent(workspaceId) + '&program_version_id=' + encodeURIComponent(versionId);
    if (subject) query += '&subject_id=' + encodeURIComponent(subject);
    try {
      var response = await fetch('/api/portal/progress' + query, { credentials: 'same-origin', cache: 'no-store', signal: progressController.signal });
      if (!current()) return;
      var data = await response.json(); if (!current()) return;
      if (response.status === 401) { clear(); window.location.replace('/portal/login.html?' + (data.error === 'signout_required' ? 'signout_pending=1' : 'expired=1')); return; }
      if (response.status === 403) { clear(); message('Your status access has changed. Reload your workspace.'); $('retry').hidden = false; return; }
      if (!response.ok) throw new Error();
      if (data.workspace_id !== workspaceId || data.program_version_id !== versionId || data.subject_id !== progressSubject ||
          !contextAuthority || data.kind !== contextAuthority.kind || data.session_expires_at !== contextAuthority.expires ||
          data.session_expires_at * 1000 <= Date.now() || !Array.isArray(data.subjects) || !Array.isArray(data.missions)) throw new Error();
      progressData = data;
      var family = data.kind === 'FAMILY';
      $('subject-label').textContent = family ? 'Select a learner code' : 'Select a cohort';
      $('progress-explanation').textContent = family ? 'Record activity for one learner code. Completion is available only when the published requirements support adult confirmation.' :
        'Record delivery to this cohort. Delivery does not record individual completion or mastery.';
      var placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = family ? 'Choose a learner code' : 'Choose a cohort';
      $('subject-select').append(placeholder);
      data.subjects.forEach(function (s) { var option = document.createElement('option'); option.value = s.id; option.textContent = s.display_code; $('subject-select').append(option); });
      $('subject-select').value = progressSubject || '';
      if (subject && !data.subjects.some(function (s) { return s.id === subject; })) throw new Error();
      if (subject) {
        if (!data.summary || data.summary.total !== data.missions.length || !data.summary.counts ||
            (data.summary.next_mission_id !== null && !data.missions.some(function (m) { return m.mission_id === data.summary.next_mission_id; }))) throw new Error();
        var done = data.summary.counts[family ? 'COMPLETED' : 'DELIVERED'], active = data.summary.counts[family ? 'IN_PROGRESS' : 'STARTED'];
        var notStarted = data.summary.counts.NOT_STARTED;
        if (![done, active, notStarted].every(function (n) { return Number.isSafeInteger(n) && n >= 0; }) ||
            done + active + notStarted !== data.summary.total) throw new Error();
        $('progress-summary-text').textContent = done + ' of ' + data.summary.total + ' missions recorded as ' +
          (family ? 'completed.' : 'delivered to this cohort.') + ' ' + active + (family ? ' in progress' : ' started') + ' · ' + notStarted + ' not started.';
        // Visualize only recorded completion/delivery; reading and elapsed time
        // never advance this indicator or infer individual SCHOOL completion.
        $('progress-meter').max = data.summary.total || 1; $('progress-meter').value = done;
        $('progress-meter').hidden = data.summary.total === 0;
        $('progress-meter-label').textContent = data.summary.total ? (family ? 'Recorded learner completion' : 'Recorded cohort delivery') : '';
        $('progress-summary').className = 'progress-summary' + (data.summary.total > 0 && done === data.summary.total ? ' is-complete' : '');
        $('progress-summary').hidden = false;
        var next = data.missions.find(function (m) { return m.mission_id === data.summary.next_mission_id; });
        $('progress-continue').hidden = !!curriculumMission || !next;
        $('progress-continue').textContent = next && next.status === 'NOT_STARTED' ? 'Open next mission' : 'Continue mission';
        data.missions.forEach(function (m) {
          var li = document.createElement('li');
          li.className = 'mission-row' + (['COMPLETED','DELIVERED'].includes(m.status) ? ' is-done' : ['IN_PROGRESS','STARTED'].includes(m.status) ? ' is-active' : '');
          if (curriculumMission) li.textContent = 'Mission ' + m.sequence + ' · ' + m.status.replace(/_/g, ' ');
          else {
            var known = curriculumMissions.find(function (item) { return item.id === m.mission_id && item.sequence === m.sequence; });
            // Join only this freshly read program's titles, never cached content.
            if (!known) throw new Error();
            var button = document.createElement('button'), detail = document.createElement('span');
            button.type = 'button'; button.className = 'curriculum-choice'; button.textContent = m.sequence + '. ' + known.title;
            button.lang = curriculumResolvedLocale;
            button.addEventListener('click', function () { loadCurriculum(versionId, m.mission_id); });
            detail.textContent = ({NOT_STARTED:'Not started',IN_PROGRESS:'In progress',COMPLETED:'Completed',STARTED:'Started',DELIVERED:'Delivered to cohort'})[m.status];
            li.append(button, detail);
          }
          $('progress-list').append(li);
        });
        if (!curriculumMission && curriculumMissions.length !== data.missions.length) throw new Error();
        // The linked status list replaces the plain list for this selection.
        if (!curriculumMission) $('curriculum-list').hidden = true;
      }
      var mission = data.missions.find(function (m) { return m.mission_id === curriculumMission; });
      $('progress-start').hidden = !subject || !mission;
      $('progress-start').disabled = !!mission && mission.status !== 'NOT_STARTED';
      $('progress-finish').hidden = !subject || !mission || (family ? mission.status !== 'IN_PROGRESS' || !mission.completion_allowed : mission.status !== 'STARTED');
      $('progress-finish').textContent = family ? 'Mark completed' : 'Mark delivered';
      $('progress-notice').textContent = !data.subjects.length ? 'No authorized active ' + (family ? 'learner codes' : 'cohorts') + ' are available. Contact AIEA for help.' :
        !subject ? 'Choose a ' + (family ? 'learner code' : 'cohort') + ' to see saved status.' :
        !curriculumMission ? !data.missions.length ? 'No missions are published for this program.' : data.summary.next_mission_id ? 'Open a mission to read its instructions and record status.' :
        family ? 'All missions have a recorded completion for this learner code.' : 'All missions have a recorded delivery to this cohort.' : family && mission && mission.status === 'IN_PROGRESS' && !mission.completion_allowed ?
        'Completion is unavailable under this mission’s published requirements.' : 'Status loaded.';
      readingContext.progressOpen = true; readingContext.progressSubject = progressSubject;
    } catch (error) {
      if (!current() || error.name === 'AbortError') return;
      clearProgress(); $('progress-open').hidden = false; $('progress-panel').hidden = false;
      $('progress-notice').textContent = 'We couldn’t load status. Reload to check your current access.'; $('progress-retry').hidden = false;
    }
  }
  async function saveProgress(action) {
    if (!progressData || !progressSubject || !curriculumMission || signingOut || remotePending || document.hidden) return;
    var id = progressGeneration, sid = generation, cid = curriculumGeneration, subject = progressSubject;
    var body = { workspace_id: selected, program_version_id: curriculumVersion, mission_id: curriculumMission, subject_id: subject, action: action };
    progressData = null; $('progress-start').disabled = true; $('progress-finish').disabled = true;
    $('progress-summary').hidden = true; $('progress-continue').hidden = true; $('progress-summary-text').textContent = '';
    $('progress-summary').className = 'progress-summary';
    $('progress-meter').hidden = true; $('progress-meter').value = 0; $('progress-meter').max = 1; $('progress-meter-label').textContent = '';
    $('progress-notice').textContent = 'Saving status…';
    function current() { return id === progressGeneration && sid === generation && cid === curriculumGeneration; }
    try {
      var response = await fetch('/api/portal/progress', { method: 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: progressController.signal });
      if (!current()) return;
      var data = await response.json(); if (!current()) return;
      if (response.status === 401) { clear(); window.location.replace('/portal/login.html?' + (data.error === 'signout_required' ? 'signout_pending=1' : 'expired=1')); return; }
      if (response.status === 403) { clear(); message('Your status access has changed. Reload your workspace.'); $('retry').hidden = false; return; }
      if (!response.ok || data.workspace_id !== body.workspace_id || data.program_version_id !== body.program_version_id ||
          data.subject_id !== subject || data.mission_id !== body.mission_id) throw new Error();
      await loadProgress(subject); // fresh read only; never automatically repeat a write
    } catch (error) {
      if (!current() || error.name === 'AbortError') return;
      clearProgress(); $('progress-open').hidden = false; $('progress-panel').hidden = false;
      $('progress-notice').textContent = 'Status was not confirmed. Reload status before trying again.'; $('progress-retry').hidden = false;
    }
  }
  $('progress-open').addEventListener('click', function () { loadProgress(null); });
  $('progress-continue').addEventListener('click', function () {
    if (progressData && progressSubject && !curriculumMission && progressData.summary && progressData.summary.next_mission_id)
      loadCurriculum(curriculumVersion, progressData.summary.next_mission_id);
  });
  $('subject-select').addEventListener('change', function () { loadProgress(this.value || null); });
  $('progress-start').addEventListener('click', function () { saveProgress('start'); });
  $('progress-finish').addEventListener('click', function () { saveProgress(contextAuthority && contextAuthority.kind === 'FAMILY' ? 'complete' : 'deliver'); });
  $('progress-retry').addEventListener('click', function () { loadProgress(null); });
  $('programs-open').addEventListener('click', function () { loadCurriculum(null, null); });
  $('mission-previous').addEventListener('click', function () { if (missionNavigation && missionNavigation.previous_mission_id) loadCurriculum(curriculumVersion, missionNavigation.previous_mission_id); });
  $('mission-next').addEventListener('click', function () { if (missionNavigation && missionNavigation.next_mission_id) loadCurriculum(curriculumVersion, missionNavigation.next_mission_id); });
  $('curriculum-language-select').addEventListener('change', function () {
    if (curriculumLocales.includes(this.value)) { curriculumLocale = this.value; loadCurriculum(curriculumVersion, curriculumMission); }
  });
  $('programs-back').addEventListener('click', function () { loadCurriculum(null, null); });
  $('missions-back').addEventListener('click', function () { loadCurriculum(curriculumVersion, null); });
  $('curriculum-retry').addEventListener('click', function () { loadCurriculum(curriculumVersion, curriculumMission); });
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
    if (periodicRequest) return;
    if (!pendingValidation || !controller || controller.signal.aborted) {
      if (readingContext && !document.hidden && !signingOut && !remotePending && !pendingValidation) load(readingContext);
      else sessionChanged();
    }
  }, 30000);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { generation++; if (controller) controller.abort(); clear(); }
    else sessionChanged();
  });
  window.addEventListener('pageshow', load);
  window.addEventListener('pagehide', function () { generation++; if (controller) controller.abort(); clear(); });
}());
