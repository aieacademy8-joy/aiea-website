"use strict";
const p=require('../../lib/portal/runtime');
const progress=require('../../lib/portal/progress');
module.exports=async(req,res)=>{
  let c;
  try {
    if (!['GET','POST'].includes(req.method)) { res.setHeader('Allow','GET, POST'); p.fail(405,'method_not_allowed'); }
    c=p.config();
    const url=new URL(req.url,c.origin);
    let input;
    if(req.method==='GET') {
      if(url.search.length>512 || [...url.searchParams.keys()].some(k=>url.searchParams.getAll(k).length!==1)) p.fail(400,'invalid_request');
      input=Object.fromEntries(url.searchParams);
    } else { if(url.search) p.fail(400,'invalid_request'); input=p.post(req,c); }
    const q=progress.parameters(input,req.method==='POST'), auth=await p.authenticate(req,c);
    const data=req.method==='POST'?await progress.write(c,auth,q):await progress.read(c,auth,q);
    const current=await p.authenticate(req,c);
    const fresh=await progress.scope(c,current,q);
    // A held read must not return codes for subjects no longer visible now.
    if(data.subjects && (fresh.workspace.kind!==data.kind || data.subjects.some(s=>!fresh.subjects.some(f=>f.id===s.id)))) p.fail(403,'status_access_denied');
    if(current.exp<=Math.floor(Date.now()/1000)) p.fail(401,'sign_in_required');
    const result={...data,session_expires_at:current.exp};
    if(Buffer.byteLength(JSON.stringify(result),'utf8')>524288) p.fail(503,'temporarily_unavailable');
    p.json(res,200,result);
  } catch(e) { if(c && (e.status===401 || e.code==='adult_access_required')) p.clear(res,c); p.error(res,e); }
};
