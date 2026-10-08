// Execute the actual browser client with a deterministic DOM/clock and mocked
// context responses. Native/browser proof is separate. Optional source override
// permits saved pre-correction negative controls without changing production source.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const source = await fs.readFile(process.env.AIEA_PORTAL_CLIENT_SOURCE || new URL('../../portal/portal.js', import.meta.url), 'utf8');
const epoch = 1800000000000;
const family = { id: '10000000-0000-0000-0000-000000000002', kind: 'FAMILY', display_name: 'Adult A family', role: 'OWNER' };
const school = { id: '10000000-0000-0000-0000-000000000001', kind: 'SCHOOL', display_name: 'Adult B school', role: 'TEACHER' };
function context(workspace = family) {
  return { workspaces: [workspace], selected_workspace_id: workspace.id,
    entitlements: [{ id: 'entitlement', program_version_id: 'version', status: 'ACTIVE' }], session_expires_at: epoch / 1000 + 3600 };
}
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
async function fixture(withChannel = true) {
  let now = 0, nextTimer = 0, channel;
  const timers = new Map(), elements = new Map(), windowEvents = new Map(), documentEvents = new Map();
  function element() {
    return { hidden: true, textContent: '', value: '', disabled: false, children: [], events: new Map(),
      append(...items) { this.children.push(...items); }, replaceChildren(...items) { this.children = items; },
      addEventListener(name, callback) { this.events.set(name, callback); } };
  }
  const get = id => { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); };
  const requests = [], redirects = [];
  const setTimer = (fn, delay, repeat = false) => {
    const id = ++nextTimer; timers.set(id, { fn, at: now + delay, repeat: repeat ? delay : 0 }); return id;
  };
  const window = { location: { replace: url => redirects.push(url) },
    addEventListener: (name, fn) => windowEvents.set(name, fn),
    setTimeout: (fn, delay) => setTimer(fn, delay), clearTimeout: id => timers.delete(id),
    setInterval: (fn, delay) => setTimer(fn, delay, true) };
  const document = { body: { dataset: { page: 'workspace' } }, hidden: false,
    getElementById: get, createElement: element,
    addEventListener: (name, fn) => documentEvents.set(name, fn) };
  const sandbox = { window, document, AbortController, URLSearchParams,
    Date: class extends Date { static now() { return epoch + now; } }, performance: { now: () => now },
    fetch: (url, options) => new Promise(resolve => requests.push({ url, options, resolve })) };
  if (withChannel) sandbox.BroadcastChannel = class { constructor() { channel = this; } postMessage() {} };
  vm.runInNewContext(source, sandbox, { timeout: 1000 });
  const event = async (name, onDocument = false) => { (onDocument ? documentEvents : windowEvents).get(name)?.({ type: name }); await flush(); };
  const reply = async (n, data = context(), status = 200) => {
    requests[n].resolve({ status, ok: status === 200, json: async () => data }); await flush();
  };
  const signal = async (value = 'pending') => { channel.onmessage({ data: value }); await flush(); };
  const advance = async (ms, deliver = true) => {
    const target = now + ms;
    if (deliver) {
      for (;;) {
        const due = [...timers].filter(([, t]) => t.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        const [id, t] = due; now = Math.max(now, t.at);
        if (t.repeat) t.at = now + t.repeat; else timers.delete(id);
        t.fn(); await flush();
      }
    }
    now = target; await flush();
  };
  const cleared = () => get('workspace-detail').hidden && get('workspace-name').textContent === '' &&
    get('workspace-role').textContent === '' && get('entitlements').children.length === 0 && get('workspace-select').children.length === 0;
  await event('pageshow'); await reply(0);
  assert.equal(get('workspace-name').textContent, family.display_name);
  return { get, requests, redirects, document, event, reply, signal, advance, cleared };
}
function freshRequest(f, count = 2) {
  assert.equal(f.requests.length, count, 'missing completion must recover through a fresh context request');
  assert.equal(f.requests.at(-1).url, '/api/portal/context', 'discard old selected workspace');
  assert.ok(f.cleared(), 'never render private state before authoritative response');
}
test('A04 lost completion: early focus holds cleared state, deadline revalidates current adult', async () => {
  const f = await fixture(); await f.signal(); assert.ok(f.cleared());
  await f.event('focus'); await f.advance(9999); assert.equal(f.requests.length, 1); assert.ok(f.cleared());
  await f.advance(1); freshRequest(f); await f.reply(1, context(school));
  assert.equal(f.get('workspace-name').textContent, school.display_name);
  assert.equal(f.get('workspace-role').textContent, 'Your role: Teacher');
});
test('A04 focus restoration recovers elapsed pending when background timers were deferred', async () => {
  const f = await fixture(); await f.signal(); await f.advance(11000, false); await f.event('focus');
  freshRequest(f); await f.reply(1, context(school)); assert.equal(f.get('workspace-name').textContent, school.display_name);
});
test('A04 visibility restoration independently recovers an elapsed pending lease', async () => {
  const f = await fixture(); await f.signal(); f.document.hidden = true; await f.event('visibilitychange', true);
  await f.advance(11000, false); f.document.hidden = false; await f.event('visibilitychange', true);
  freshRequest(f); await f.reply(1, context(school)); assert.equal(f.get('workspace-name').textContent, school.display_name);
});
test('A04 visible receiver recovers by timeout without focus or completion signal', async () => {
  const f = await fixture(); await f.signal(); await f.advance(10000); freshRequest(f);
});
test('A04 hidden receiver remains empty and revalidates only on visibility restoration', async () => {
  const f = await fixture(); await f.signal(); f.document.hidden = true; await f.event('visibilitychange', true);
  await f.advance(10000); assert.equal(f.requests.length, 1); assert.ok(f.cleared());
  f.document.hidden = false; await f.event('visibilitychange', true); freshRequest(f);
});
test('A02 completed revalidate cancels pending recovery and authorizes current summary', async () => {
  const f = await fixture(); await f.signal(); await f.signal('revalidate'); freshRequest(f);
  await f.reply(1, context(school)); await f.advance(10000); assert.equal(f.requests.length, 2);
  assert.equal(f.get('workspace-name').textContent, school.display_name);
});
test('A05 another pending signal cannot replace the episode initial deadline', async () => {
  const f = await fixture(); await f.signal(); await f.advance(5000); await f.signal();
  await f.advance(5000); freshRequest(f);
});
test('A04 server outage during recovery fails closed and offers explicit retry', async () => {
  const f = await fixture(); await f.signal(); await f.advance(10000); freshRequest(f);
  await f.reply(1, { error: 'temporarily_unavailable' }, 503);
  assert.ok(f.cleared()); assert.equal(f.get('retry').hidden, false);
});
test('A04 recovery preserves A01 server logout quarantine instead of displaying cached data', async () => {
  const f = await fixture(); await f.signal(); await f.advance(10000); freshRequest(f);
  await f.reply(1, { error: 'signout_required' }, 401);
  assert.ok(f.cleared()); assert.deepEqual(f.redirects, ['/portal/login.html?signout_pending=1']);
});
test('A04 pending invalidates an in-flight old-adult response before eventual recovery', async () => {
  const f = await fixture(); f.get('workspace-select').value = family.id;
  f.get('workspace-select').events.get('change').call(f.get('workspace-select')); await flush();
  await f.signal(); await f.reply(1); assert.ok(f.cleared());
  await f.advance(10000); freshRequest(f, 3); await f.reply(2, context(school));
  assert.equal(f.get('workspace-name').textContent, school.display_name);
});
test('A02 browser without BroadcastChannel retains authoritative periodic revalidation', async () => {
  const f = await fixture(false); await f.advance(30000); freshRequest(f);
});
test('A04 repeated focus while pending does not extend the ten-second recovery bound', async () => {
  const f = await fixture(); await f.signal(); await f.advance(5000); await f.event('focus');
  await f.advance(4999); assert.equal(f.requests.length, 1); await f.advance(1); freshRequest(f);
});
test('A04 periodic authority validation covers a late cookie change after pending recovery', async () => {
  const f = await fixture(); await f.signal(); await f.advance(10000); freshRequest(f);
  // The sender's slow operation has not finished yet: current server adult is A.
  await f.reply(1); await f.advance(20000); freshRequest(f, 3);
  await f.reply(2, context(school)); assert.equal(f.get('workspace-name').textContent, school.display_name);
});
test('A05 sustained and replayed pending cannot postpone or cancel authoritative recovery', async () => {
  const f = await fixture(); await f.signal(); assert.ok(f.cleared());
  // 45 seconds of one-second messages would continually renew the old lease.
  for (let second = 1; second <= 45; second++) {
    await f.advance(1000); await f.signal(); assert.ok(f.cleared());
    if (second >= 10) {
      freshRequest(f); assert.equal(f.requests[1].options.signal.aborted, false);
    }
  }
  await f.reply(1, context(school));
  assert.equal(f.get('workspace-name').textContent, school.display_name);
  // Later stale replays can start another bounded episode, never a sliding lease.
  for (let second = 1; second <= 45; second++) {
    await f.advance(1000); await f.signal(); assert.ok(f.cleared());
    if (second >= 11) {
      freshRequest(f, 3); assert.equal(f.requests[2].options.signal.aborted, false);
    }
  }
  await f.reply(2, context(school));
  assert.equal(f.get('workspace-name').textContent, school.display_name);
  assert.equal(f.get('workspace-role').textContent, 'Your role: Teacher');
});
test('A05 replay after elapsed deadline recovers even when timer delivery was deferred', async () => {
  const f = await fixture(); await f.signal(); await f.advance(11000, false); await f.signal();
  freshRequest(f); await f.reply(1, context(school)); assert.equal(f.get('workspace-name').textContent, school.display_name);
});
test('A05 sustained pending cannot bypass A01 authoritative logout quarantine', async () => {
  const f = await fixture(); await f.signal();
  for (let second = 1; second <= 12; second++) { await f.advance(1000); await f.signal(); }
  freshRequest(f); await f.reply(1, { error: 'signout_required' }, 401);
  assert.ok(f.cleared()); assert.deepEqual(f.redirects, ['/portal/login.html?signout_pending=1']);
});
