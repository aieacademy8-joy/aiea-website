"use strict";
const p = require('./runtime');
const curriculum = require('./curriculum');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const valid = value => { if (!value) p.fail(503, 'temporarily_unavailable'); };
function parameters(input, write = false) {
  p.exactKeys(input, write ? ['workspace_id','program_version_id','mission_id','subject_id','action'] :
    ['workspace_id','program_version_id',...(Object.hasOwn(input,'subject_id') ? ['subject_id'] : [])]);
  for (const key of ['workspace_id','program_version_id',...(write ? ['mission_id','subject_id'] : Object.hasOwn(input,'subject_id') ? ['subject_id'] : [])]) {
    if (typeof input[key] !== 'string' || !UUID.test(input[key])) p.fail(400, 'invalid_request');
  }
  if (write && !['start','complete','deliver'].includes(input.action)) p.fail(400, 'invalid_request');
  return Object.fromEntries(Object.entries(input).map(([k,v]) => [k,k==='action' ? v : v.toLowerCase()]));
}
function completion(version, mission) {
  const only = (x,k,v) => x && typeof x==='object' && !Array.isArray(x) && Object.keys(x).length===1 && x[k]===v;
  return !!(only(version.completion_rules,'method','ADULT_ATTESTATION') &&
    only(mission.completion_rules,'method','ADULT_ATTESTATION') && only(mission.evidence_expectations,'required',false));
}
async function scope(c, auth, q) {
  await curriculum.access(c,auth,q.workspace_id,[q.program_version_id]);
  const ctx = await p.context(c,auth,q.workspace_id);
  const workspace=ctx.workspaces.find(w=>w.id===q.workspace_id); valid(workspace);
  const versions=await p.rows(c,auth.token,'program_version?select=id,status,completion_rules&id=eq.'+q.program_version_id+'&status=in.(PUBLISHED,RETIRED)&limit=2');
  valid(versions.length===1 && versions[0].id===q.program_version_id && ['PUBLISHED','RETIRED'].includes(versions[0].status));
  const family=workspace.kind==='FAMILY', table=family?'learner_ref':'cohort';
  const subjects=await p.rows(c,auth.token,table+'?select=id,workspace_id,display_code,status&workspace_id=eq.'+q.workspace_id+'&status=eq.ACTIVE&order=display_code,id&limit=101');
  valid(new Set(subjects.map(s=>s.id)).size===subjects.length);
  subjects.forEach(s=>valid(UUID.test(s.id) && s.workspace_id===q.workspace_id && s.status==='ACTIVE' &&
    typeof s.display_code==='string' && s.display_code.length>0 && s.display_code.length<=(family?60:80)));
  if (q.subject_id && !subjects.some(s=>s.id===q.subject_id)) p.fail(404,'subject_unavailable');
  return { workspace,version:versions[0],subjects,family };
}
async function read(c,auth,q) {
  const s=await scope(c,auth,q);
  const missions=await p.rows(c,auth.token,'mission?select=id,program_version_id,sequence,completion_rules,evidence_expectations&program_version_id=eq.'+q.program_version_id+'&order=sequence,id&limit=101');
  valid(new Set(missions.map(m=>m.id)).size===missions.length);
  missions.forEach(m=>valid(UUID.test(m.id) && m.program_version_id===q.program_version_id && Number.isSafeInteger(m.sequence) && m.sequence>0));
  const table=s.family?'mission_progress':'cohort_mission_delivery', key=s.family?'learner_ref_id':'cohort_id';
  const rows=q.subject_id ? await p.rows(c,auth.token,table+'?select=workspace_id,program_version_id,mission_id,'+key+',status&workspace_id=eq.'+
    q.workspace_id+'&program_version_id=eq.'+q.program_version_id+'&'+key+'=eq.'+q.subject_id+'&order=mission_id&limit=101') : [];
  valid(new Set(rows.map(r=>r.mission_id)).size===rows.length);
  rows.forEach(r=>valid(r.workspace_id===q.workspace_id && r.program_version_id===q.program_version_id && r[key]===q.subject_id &&
    missions.some(m=>m.id===r.mission_id) && (s.family?['NOT_STARTED','IN_PROGRESS','COMPLETED']:['STARTED','DELIVERED']).includes(r.status)));
  return {workspace_id:q.workspace_id,program_version_id:q.program_version_id,kind:s.workspace.kind,
    subject_id:q.subject_id || null,subjects:s.subjects.map(x=>({id:x.id,display_code:x.display_code})),
    missions:missions.map(m=>({mission_id:m.id,sequence:m.sequence,status:rows.find(r=>r.mission_id===m.id)?.status || 'NOT_STARTED',
      completion_allowed:s.family && completion(s.version,m)}))};
}
async function write(c,auth,q) {
  const s=await scope(c,auth,q);
  if ((s.family && q.action==='deliver') || (!s.family && q.action==='complete')) p.fail(400,'invalid_request');
  const name=s.family?'record_mission_progress':'record_cohort_delivery';
  const body={workspace_id:q.workspace_id,program_version_id:q.program_version_id,mission_id:q.mission_id,
    [s.family?'learner_ref_id':'cohort_id']:q.subject_id,action:q.action};
  const r=await p.upstream(c,'/rest/v1/rpc/'+name,{token:auth.token,body,method:'POST',data:true});
  if (r.status!==200) {
    if (r.value?.code==='42501') p.fail(403,'status_access_denied');
    if (r.value?.code==='22023') p.fail(409,'status_action_unavailable');
    p.fail(503,'temporarily_unavailable');
  }
  valid(r.value && r.value.subject_id===q.subject_id && r.value.mission_id===q.mission_id &&
    (s.family?['IN_PROGRESS','COMPLETED']:['STARTED','DELIVERED']).includes(r.value.status));
  return {workspace_id:q.workspace_id,program_version_id:q.program_version_id,subject_id:q.subject_id,
    mission_id:q.mission_id,status:r.value.status};
}
module.exports={parameters,completion,scope,read,write};
