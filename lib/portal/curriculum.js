"use strict";
const p = require('./runtime');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LOCALE = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
const unavailable = () => p.fail(503, 'temporarily_unavailable');
function valid(value) { if (!value) unavailable(); }
function text(value, max = 32000) { valid(typeof value === 'string' && value.length <= max); return value; }
function parameters(url) {
  const allowed = ['workspace_id', 'program_version_id', 'mission_id', 'locale'];
  if ([...url.searchParams.keys()].some(k => !allowed.includes(k) || url.searchParams.getAll(k).length !== 1) ||
      url.search.length > 512) p.fail(400, 'invalid_request');
  const w = url.searchParams.get('workspace_id'), v = url.searchParams.get('program_version_id'), m = url.searchParams.get('mission_id');
  const locale = url.searchParams.has('locale') ? url.searchParams.get('locale') : 'en-US';
  if (!UUID.test(w || '') || (v !== null && !UUID.test(v)) || (m !== null && (!v || !UUID.test(m))) ||
      !LOCALE.test(locale) || locale.length > 35) p.fail(400, 'invalid_request');
  return { w: w.toLowerCase(), v: v && v.toLowerCase(), m: m && m.toLowerCase(), locale };
}
async function access(c, auth, w, versions = []) {
  const ctx = await p.context(c, auth, w);
  const ids = [...new Set(ctx.entitlements.filter(e => e.status === 'ACTIVE').map(e => e.program_version_id))];
  if (versions.some(v => !ids.includes(v))) p.fail(404, 'curriculum_unavailable');
  return ids;
}
async function read(c, auth, q) {
  const ids = await access(c, auth, q.w, q.v ? [q.v] : []);
  const wanted = q.v ? [q.v] : ids;
  const base = { workspace_id: q.w, requested_locale: q.locale };
  if (!wanted.length) return { data: { ...base, view: 'catalog', programs: [] }, versions: [] };
  const rows = path => p.rows(c, auth.token, path);
  const versions = await rows('program_version?select=id,program_id,version_key,status,fallback_locale' +
    '&id=in.(' + wanted.join(',') + ')&status=in.(PUBLISHED,RETIRED)&order=id&limit=101');
  valid(versions.length === wanted.length && new Set(versions.map(v => v.id)).size === wanted.length);
  versions.forEach(v => { valid(wanted.includes(v.id) && UUID.test(v.program_id) && ['PUBLISHED','RETIRED'].includes(v.status) &&
    (v.fallback_locale === null || (typeof v.fallback_locale === 'string' && v.fallback_locale.length <= 35 && LOCALE.test(v.fallback_locale)))); text(v.version_key, 200); });
  const programs = await rows('program?select=id,program_key&id=in.(' + [...new Set(versions.map(v => v.program_id))].join(',') + ')&limit=101');
  valid(new Set(programs.map(x => x.id)).size === programs.length);
  programs.forEach(x => { valid(versions.some(v => v.program_id === x.id)); text(x.program_key, 200); });
  // Locale fan-out must not turn the 100-version catalog into a 100-locale
  // catalog. Keep each read bounded and order by the unique version/locale pair.
  // Scale the finite aggregate budget with the authorized version count; read
  // one extra page when exactly full so overflow never returns a partial list.
  const locales = [], localePageSize = 100, localeLimit = wanted.length * localePageSize;
  for (let offset = 0; offset <= localeLimit; offset += localePageSize) {
    const page = await rows('program_version_locale?select=program_version_id,locale_code,title,description,guidance,status' +
      '&program_version_id=in.(' + wanted.join(',') + ')&status=eq.PUBLISHED&order=program_version_id,locale_code&limit=' + localePageSize + '&offset=' + offset);
    locales.push(...page);
    valid(locales.length <= localeLimit);
    if (page.length < localePageSize) break;
  }
  valid(new Set(locales.map(l => l.program_version_id + '/' + l.locale_code)).size === locales.length);
  locales.forEach(l => { valid(wanted.includes(l.program_version_id) && l.status === 'PUBLISHED' && LOCALE.test(l.locale_code)); text(l.locale_code, 35); text(l.title, 500); text(l.description); text(l.guidance); });
  const projected = versions.map(v => {
    const program = programs.find(x => x.id === v.program_id); valid(program);
    const localized = locales.find(l => l.program_version_id === v.id && l.locale_code === q.locale) ||
      locales.find(l => l.program_version_id === v.id && v.fallback_locale !== null && l.locale_code === v.fallback_locale);
    return { program_id: program.id, program_key: program.program_key, program_version_id: v.id, version_key: v.version_key,
      available_locales: locales.filter(l => l.program_version_id === v.id).map(l => l.locale_code).sort(),
      resolved_locale: localized ? localized.locale_code : null, title: localized ? localized.title : null,
      description: localized ? localized.description : null, guidance: localized ? localized.guidance : null };
  });
  if (!q.v) return { data: { ...base, view: 'catalog', programs: projected.map(({ description, guidance, ...item }) => item) }, versions: wanted };
  const program = projected[0];
  if (!program.resolved_locale) p.fail(409, 'locale_unavailable');
  const missions = await rows('mission?select=id,program_version_id,mission_key,sequence&program_version_id=eq.' + q.v +
    '&order=sequence,id&limit=101');
  valid(new Set(missions.map(m => m.id)).size === missions.length && new Set(missions.map(m => m.sequence)).size === missions.length);
  missions.forEach(m => { valid(UUID.test(m.id) && m.program_version_id === q.v && Number.isSafeInteger(m.sequence) && m.sequence > 0); text(m.mission_key, 200); });
  missions.sort((a,b) => a.sequence - b.sequence);
  const index = q.m ? missions.findIndex(m => m.id === q.m) : -1;
  if (q.m && index === -1) p.fail(404, 'curriculum_unavailable');
  const selected = q.m ? [missions[index]] : missions;
  const ml = selected.length ? await rows('mission_locale?select=mission_id,program_version_id,locale_code,title,status' +
    (q.m ? ',instructions,reflection' : '') + '&program_version_id=eq.' + q.v + '&mission_id=in.(' + selected.map(m => m.id).join(',') +
    ')&locale_code=eq.' + encodeURIComponent(program.resolved_locale) + '&status=eq.PUBLISHED&limit=101') : [];
  valid(ml.length === selected.length && new Set(ml.map(l => l.mission_id)).size === ml.length);
  ml.forEach(l => { valid(selected.some(m => m.id === l.mission_id) && l.program_version_id === q.v && l.locale_code === program.resolved_locale && l.status === 'PUBLISHED'); text(l.title, 500); });
  const list = selected.map(m => {
    const l = ml.find(l => l.mission_id === m.id); valid(l);
    const result = { id: m.id, mission_key: m.mission_key, sequence: m.sequence, title: l.title };
    if (q.m) { result.instructions = text(l.instructions, 64000); result.reflection = text(l.reflection); }
    return result;
  });
  // Add presentation metadata without changing the published mission identity.
  // Position is an ordinal in this authorized version, not a canonical lesson ID
  // or an entitlement range. The accepted entitlement still covers the version.
  const sequence = { unit: 'MISSION', total: missions.length, position: q.m ? index + 1 : null };
  return { data: { ...base, view: q.m ? 'mission' : 'program', program, sequence, ...(q.m ? { mission: list[0],
    navigation: { previous_mission_id:missions[index-1]?.id || null, next_mission_id:missions[index+1]?.id || null } } : { missions: list }) }, versions: wanted };
}
module.exports = { parameters, access, read };
