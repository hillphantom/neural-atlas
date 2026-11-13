/* Local event adapter. No credentials, outbound writes, or worker control. */
const ExternalActivity=(()=>{
 const config=globalThis.AtlasConfig;
 const selectedProject=new URLSearchParams(location.search).get('project')||'all';
 const escapeConfig=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const inventory=config?config.workers.map(w=>({kind:w.id,name:escapeConfig(w.name),goal:escapeConfig(w.goal),project:w.project,type:escapeConfig(w.type||'agent'),machine:escapeConfig(w.machine||'')})):MakerDemo.roles;
 if(!inventory.length||new Set(inventory.map(r=>r.kind)).size!==inventory.length||inventory.some(r=>!r.kind||typeof r.kind!=='string'))throw Error('Configure unique nonempty worker IDs');
 const roles=inventory.filter(r=>selectedProject==='all'||r.project===selectedProject);
 if(!roles.length)throw Error('No workers configured for selected project');
 let history=[],pending=[],seen=new Set(),jobs=[],last=0,counts={},error='Waiting for activity';
 const clean=v=>String(v??'').slice(0,500).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function reset(){history=[];pending=[];seen=new Set();last=0;counts={};error='Waiting for activity';jobs=roles.map(r=>({kind:r.kind,state:'pending',title:'Waiting for activity',category:'No topic yet',note:'No task reported.',question:'',updated:0}));}
 function ingest(input){
  const batch=Array.isArray(input)?input:[input];if(batch.length>500)throw Error('Maximum 500 events per batch');
  // Validate the entire batch before accepting any part of it.
  for(const e of batch)if(!e||typeof e.id!=='string'||!e.id||e.id.length>150||!inventory.some(r=>r.kind===e.worker)||!['running','queued','completed','failed','idle'].includes(e.state)||typeof e.title!=='string'||!e.title||typeof e.topic!=='string'||!Number.isFinite(Date.parse(e.at)))throw Error('Invalid activity event');
  if(new Set([...seen,...batch.map(e=>e.id)]).size>10000)throw Error('Session event limit reached; reload with a bounded current feed');
  let accepted=0;
  for(const e of [...batch].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at))){if(seen.has(e.id))continue;if(seen.size>=10000)throw Error('Session event limit reached; reload with a bounded current feed');seen.add(e.id);accepted++;
   const i=roles.findIndex(r=>r.kind===e.worker),at=Date.parse(e.at)/1000;if(i<0)continue;
   const item={project:roles[i].project||e.project||'',kind:e.worker,title:clean(e.title),category:clean(e.topic),note:clean(e.note||''),question:'',observation:clean(e.note||''),updated:at,job:clean(e.id)};
   if(at>=jobs[i].updated)jobs[i]={...item,state:e.state==='running'?'running':'pending',reportedState:e.state};
   if(e.state==='completed'){counts[e.worker]=(counts[e.worker]||0)+1;const event={...item,completed:at,worker:i};history.unshift(event);pending.push(event);}
  }
  history=history.sort((a,b)=>b.completed-a.completed).slice(0,200);last=Date.now()/1000;error='';return accepted;
 }
 function snapshot(){const now=Date.now()/1000,stale=!last||now-last>35;return {origin:'external',connected:!stale&&!error,observed_at:last,sources:history.length,jobs:jobs.map(j=>stale||error?{...j,state:'pending'}:j),history,counts:roles.flatMap(r=>[{kind:r.kind,state:'done',count:counts[r.kind]||0},{kind:r.kind,state:'pending',count:jobs.find(j=>j.kind===r.kind).reportedState==='queued'?1:0},{kind:r.kind,state:'failed',count:jobs.find(j=>j.kind===r.kind).reportedState==='failed'?1:0}]),mission_stats:roles.map(r=>({kind:r.kind,last_hour:history.filter(e=>e.kind===r.kind&&e.completed>now-3600).length,last_day:history.filter(e=>e.kind===r.kind&&e.completed>now-86400).length})),journal:[],reflections:{entries:[]},control:{},status:error||(stale?'Feed stale':'Connected')};}
 reset();return {roles,reset,ingest,snapshot,advance:()=>pending.splice(0),fail:message=>{error=message;}};
})();
if(new URLSearchParams(location.search).get('source')==='external'){
 MakerDemo=ExternalActivity;
 if(globalThis.AtlasConfig){
  const select=document.createElement('select');select.setAttribute('aria-label','Project');
  for(const p of [{id:'all',name:'All projects'},...AtlasConfig.projects.filter(p=>AtlasConfig.workers.some(w=>w.project===p.id))]){const o=document.createElement('option');o.value=p.id;o.textContent=p.name;select.append(o);}
  select.value=new URLSearchParams(location.search).get('project')||'all';
  select.onchange=()=>{const u=new URL(location.href);u.searchParams.set('project',select.value);location.href=u.href;};
  document.querySelector('.source').prepend(select);
 }
 window.NeuralAtlas={ingest:ExternalActivity.ingest,snapshot:ExternalActivity.snapshot};
 let inFlight=false;
 async function poll(){if(inFlight||document.hidden)return;inFlight=true;try{const r=await fetch('../activity.json',{cache:'no-store',signal:AbortSignal.timeout(4000)});if(!r.ok)throw Error();ExternalActivity.ingest(await r.json());}catch{ExternalActivity.fail('Feed unavailable');}finally{inFlight=false;}}
 setTimeout(poll,100);setInterval(poll,5000);
}
