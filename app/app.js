(()=>{'use strict';
const $=s=>document.querySelector(s),canvas=$('#atlas'),ctx=canvas.getContext('2d');
const glowCanvas=document.createElement('canvas'),glowCtx=glowCanvas.getContext('2d');
const demoSpecs=['#40d9b2','#b580f2','#55a8f5','#efbd55','#ed7cba','#8ecf61','#f28c75','#8c8df3','#e6cf68','#65d3dd'].map((color,i)=>['Network region '+(i+1),'',color,['Discover','Process','Review'],[[12,8,4],[16,10,6],[8,12,4],[10,6,4],[14,10,6],[12,8,6],[10,8,4],[12,10,4],[10,12,6],[16,8,4]][i]]);
const externalMode=new URLSearchParams(location.search).get('source')==='external';
const specs=externalMode?MakerDemo.roles.map((r,i)=>[r.name,'',`hsl(${(i*137.508)%360} 65% 66%)`,['Reported work'],[Math.max(1,Math.floor(240/MakerDemo.roles.length))]]):demoSpecs;

const dataMode='demo';
const heroMotion=new URLSearchParams(location.search).has('art');
let projects=[],events=[],sim=0,paused=false,speed=1,view='live',selected=null,lastTick=0,W=0,H=0,lastFrame=0,seed=41,growth=[],focused=null,detailTab='now',detailKey='',previewText='',downloadUrl=null;
const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const clock=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
function emit(p,text,type='work'){const e={t:sim,p:p.id,text,type,unit:p.done,agent:agent(p),step:p.steps[Math.min(p.step,2)]};events.unshift(e);events.length=Math.min(events.length,80);p.log.unshift(e);p.log.length=Math.min(p.log.length,120);p.signal=sim;p.signalType=type;}
let makerData=null,makerNotice=null,makerSequence=MakerDemo.roles.map(()=>0);
function reset(){focused=null;sim=0;events=[];makerNotice=null;makerSequence=MakerDemo.roles.map(()=>0);missionKey='';
 growth=specs.map(()=>({units:0,opened:0,settled:0,activity:0,phase:0,effort:0,glow:0,resultLift:0,seenDone:0,births:[]}));
 projects=specs.map((s,i)=>({id:i,name:MakerDemo.roles[i]?.name||'Network scaffold',color:s[2],steps:s[3],targets:s[4],step:0,units:0,done:0,status:'queued',start:null,log:[],results:[],block:null}));
 if(dataMode==='demo'){MakerDemo.reset();makerData=MakerDemo.snapshot();syncMaker();}render();
}
const total=p=>p.targets.reduce((a,b)=>a+b,0);
function syncMaker(){projects.slice(0,MakerDemo.roles.length).forEach((p,i)=>{p.status=makerData.jobs[i].state==='running'?'working':'queued';p.start=0;});}
function tick(dt){if(dataMode==='live'||paused)return;sim+=dt*speed;
 for(const e of MakerDemo.advance(dt*speed)){const p=projects[e.worker],g=growth[e.worker],slot=makerSequence[e.worker]++%total(p);
  p.done=Math.max(p.done,slot+1);g.births[slot]=0;g.resultLift=.8;makerNotice={...e,unit:slot+1};
 }
 makerData=MakerDemo.snapshot();syncMaker();
}
function agent(p){return MakerDemo.roles[p.id]?.name||'Network scaffold';}
function render(){renderMaker();}
function renderMaker(){
 renderSource();$('#summary').textContent=makerData.origin==='external'?`External activity · ${makerData.history.length} retained results`:`Maker Node · ${makerData.sources} source records`;
 if(view==='dashboard')renderMissions();
 if(view==='live')$('#labels').innerHTML=`<div class="work-heading">${makerData.origin==='external'?'EXTERNAL ACTIVITY <span>REPORTED WORKER EVENTS</span>':'MAKER NODE <span>MAKER & DIY RESEARCH</span>'}</div><div class="agent-strip">${MakerDemo.roles.map((r,i)=>`<button class="agent-chip" data-focus="${i}" style="--color:${specs[i][2]}"><strong>${r.name}</strong><span>${paused?'Paused':makerData.origin==='external'?(makerData.connected?makerData.jobs[i].reportedState||'Waiting':makerData.status):makerData.jobs[i].state==='running'?'Working':'Queued / waiting'} · ${makerData.jobs[i].title}</span><small>${workCount(r.kind,'done')} completed · ${workCount(r.kind,'pending')} queued</small></button>`).join('')}</div>`;
 const note=$('#growth-note'),n=makerNotice,age=n?growth[n.worker].births[n.unit-1]:10;
 note.hidden=!n||age===undefined||age>=6.5||(view!=='pure'&&focused!==null&&focused!==n.worker);
 if(!note.hidden){note.dataset.project=n.worker;note.dataset.unit=n.unit;note.style.setProperty('--color',specs[n.worker][2]);note.innerHTML=`<strong>${MakerDemo.roles[n.worker].name} · completed</strong><span>${n.title}</span>`;}
 const e=makerData.history[0]||{title:'Waiting for completed work'};$('#ticker').textContent=`${paused?'PAUSED':makerData.origin==='external'?makerData.status:'LIVE · '+clock(sim)} · ${makerData.origin==='external'?'External activity':'Maker Node'} · ${e.title}${makerData.history.length?' · completed':''}`;
 if(selected!==null)renderDetail();
}
function workData(){return makerData;}
function workCount(kind,state){return (workData()?.counts||[]).filter(r=>r.kind===kind&&(!state||r.state===state)).reduce((n,r)=>n+r.count,0);}
function workJob(i){return (workData()?.jobs||[]).find(j=>j.kind===MakerDemo.roles[i]?.kind&&j.state==='running')||(workData()?.jobs||[]).find(j=>j.kind===MakerDemo.roles[i]?.kind&&j.state==='pending');}
function renderSource(){$('.source').dataset.state='live';$('#connection-status').textContent=makerData.origin==='external'?makerData.status:'Live';if(makerData.origin==='external')$('.source').dataset.state=makerData.connected?'live':'offline';}
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function openAgent(id){selected=id;focused=id;detailTab='now';detailKey='';previewText='';renderDetail();if(!$('#detail').open)$('#detail').showModal();render();}
function renderDetail(){if(makerData.origin==='external'){renderExternalDetail();return;}renderMakerDetail();}
function makerOutput(id){const e=makerData.history.find(e=>e.job===id);if(!e)return;
 previewText=JSON.stringify({project:'Maker Node',origin:'Fictional browser demo',worker:MakerDemo.roles.find(r=>r.kind===e.kind).name,topic:e.category,title:e.title,output:{scout:{registered_idea:e.title,research_question:e.question},collect:{fixture:'Parts and materials reference',notes:e.note,original_fetched:false},extract:{build_note:e.observation,locator:'Demo note / 01'},ai:{summary:e.observation,question:e.question,review:'Synthetic example; not validated'}}[e.kind],real_world_validation:false},null,2);
 if(downloadUrl)URL.revokeObjectURL(downloadUrl);downloadUrl=URL.createObjectURL(new Blob([previewText],{type:'application/json'}));detailKey='';renderMakerDetail();
}

function renderExternalDetail(){
 const role=MakerDemo.roles[selected];if(!role){$('#detail-content').textContent='Select a configured worker.';return;}
 const j=workJob(selected)||makerData.jobs[selected];
 $('#detail-content').innerHTML=`<div class="eyebrow">EXTERNAL WORKSPACE · SESSION ACTIVITY</div><h2>${role.name}</h2><p>${makerData.status}</p><p>${escapeHTML(role.project||'')} · ${role.type||'worker'} · ${role.machine||'Machine not specified'}</p><h3>GOAL</h3><p>${role.goal||'No goal configured.'}</p><h3>CURRENT WORK</h3><h2>${j.title}</h2><p>${j.category} · ${j.reportedState||'Waiting'}</p><p>${j.note}</p><h3>RECENT COMPLETIONS</h3>${makerData.history.filter(e=>e.kind===role.kind).map(e=>`<div class="event"><time>${liveTime(e.completed)}</time><strong>${e.title}</strong><p>${e.note}</p></div>`).join('')||'<p>No completed work received.</p>'}<p>Session history only. Real artifact links and reflections require a storage integration.</p>`;
}

function renderMakerDetail(){
 const role=MakerDemo.roles[selected];if(!role){$('#detail-content').innerHTML='<p>Visual scaffold · select one of the four Maker Node workers.</p>';return;}
 const job=workJob(selected),items=makerData.history.filter(e=>e.kind===role.kind);
 const key=['maker',selected,detailTab,Math.floor(sim),previewText,paused].join('|');if(key===detailKey)return;
 if(detailTab!=='now'&&detailKey.split('|').slice(0,3).join('|')===['maker',selected,detailTab].join('|'))return;detailKey=key;
 let content='';
 if(detailTab==='now')content=`<section class="agent-current"><div class="eyebrow">${paused?'PAUSED':job.state==='running'?'WORKING NOW':'WAITING FOR NEXT ITEM'}</div><h2>${job.title}</h2><p>${job.note}</p></section><h3>GOAL</h3><p>${role.goal}</p><div class="facts"><div><small>COMPLETED JOBS</small><span>${workCount(role.kind,'done')}</span></div><div><small>QUEUED / FAILED</small><span>${workCount(role.kind,'pending')} / ${workCount(role.kind,'failed')}</span></div></div><h3>CURRENT TOPIC</h3><p>${job.category} · ${job.state==='running'?'Processing project notes':'Waiting for the next item'}</p><h3>RESEARCH QUESTION</h3><p>${job.question}</p><h3>OBSERVATION</h3><p>${liveTime(makerData.observed_at)} · Maker & DIY research activity.</p>`;
 if(detailTab==='history')content=reflectionJournal(role.kind)+`<h3>RECENT WORK</h3>${items.map(e=>`<div class="event"><time>${liveTime(e.completed)}</time><strong>${e.title}</strong><div>${e.category} · ${e.note}</div></div>`).join('')}`;
 if(detailTab==='outputs')content=`<h3>CREATED OUTPUTS</h3><p>Example ${['discovery records','resource receipts','extracted build notes','research briefs'][selected]}, organized for project review.</p>${items.slice(0,12).map(e=>`<div class="resource-row"><div><strong>${e.title}</strong><p>${liveTime(e.completed)}</p></div><button data-maker-output="${e.job}">Open example JSON ↗</button></div>`).join('')}`;
 if(detailTab==='resources')content=`<h3>MAKER NODE · RESOURCE LIBRARY</h3><p>Project references and build notes.</p>${[...new Map(items.map(e=>[e.title,e])).values()].map(e=>`<div class="resource-row"><div><strong>${e.title}</strong><p>${e.note}</p></div><span>Project reference</span></div>`).join('')}`;
 if(detailTab==='outputs'&&previewText)content+=`<div class="artifact-preview"><a href="${downloadUrl}" download="maker-node-demo.json">Download JSON ↓</a><pre>${escapeHTML(previewText)}</pre></div>`;
 $('#detail-content').innerHTML=`<div class="eyebrow">LIVE WORKSPACE · MAKER NODE</div><div class="workspace-title"><h2>${role.name}</h2><div class="runtime-badges"><span>Maker Node · pipeline service</span></div></div><nav class="detail-tabs" aria-label="Maker workspace sections">${[['now','Now'],['history','History'],['outputs','Outputs'],['resources','Resources']].map(([id,label])=>`<button data-tab="${id}" class="${detailTab===id?'selected':''}">${label}</button>`).join('')}</nav><div class="workspace-body">${content}</div>`;
}

document.addEventListener('click',e=>{const focus=e.target.closest('[data-focus]');if(focus){openAgent(+focus.dataset.focus);return;}if(e.target.id==='clear-focus'){focused=null;render();return;}const tab=e.target.closest('[data-tab]');if(tab){detailTab=tab.dataset.tab;detailKey='';previewText='';renderDetail();return;}const artifact=e.target.closest('[data-maker-output]');if(artifact){makerOutput(artifact.dataset.makerOutput);return;}const b=e.target.closest('[data-project]');if(b){openAgent(+b.dataset.project);if(b.id==='growth-note'){detailTab='history';detailKey='';renderDetail();}}});
$('#close').onclick=()=>$('#detail').close();$('#detail').addEventListener('close',()=>selected=null);$('#detail').addEventListener('click',e=>{if(e.target===$('#detail')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
async function setView(v){globalThis.scrollTo?.(0,0);view=v;document.body.className=v==='pure'?'pure':v==='dashboard'?'dashboard':'';$('#live').hidden=v!=='live';$('#dashboard').hidden=v!=='dashboard';document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('selected',b.dataset.view===v));if(v==='pure'){try{await document.documentElement.requestFullscreen()}catch{}}render();}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));$('.brand').onclick=e=>{e.preventDefault();setView('live')};$('#pause').onclick=()=>{paused=!paused;$('#pause').textContent=paused?'▶':'Ⅱ';$('#pause').setAttribute('aria-label',paused?'Resume simulation':'Pause simulation');render()};$('#speed').onchange=e=>speed=+e.target.value;$('#reset').onclick=()=>{if(dataMode==='demo')reset()};$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{}};
async function leavePure(){if(view!=='pure')return;setView('live');if(document.fullscreenElement)try{await document.exitFullscreen()}catch{}}
document.addEventListener('keydown',e=>{if(e.key==='Escape')leavePure()});document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&view==='pure')setView('live')});canvas.onclick=e=>{if(dragMoved){dragMoved=false;return}if(view==='pure'){leavePure();return}if(view!=='live')return;let closest=null,dist=Infinity;projects.forEach(p=>{const c=center(p.id),d=Math.hypot(e.clientX-c.x,e.clientY-c.y);if(d<dist){dist=d;closest=p}});if(dist<Math.min(W,H)*.19){openAgent(closest.id);}};
const demoAnchors=[[.30,.42],[.62,.38],[.73,.64],[.46,.67],[.19,.65],[.45,.32],[.84,.43],[.32,.79],[.61,.79],[.14,.39]];
let yaw=.25,pitch=-.22,targetYaw=.25,targetPitch=-.22,zoom=1,targetZoom=1,orbit=false,drag=null,dragMoved=false;
const anchors=externalMode?MakerDemo.roles.map((_,i)=>{const a=i*2.39996,r=Math.sqrt((i+.5)/MakerDemo.roles.length);return [.49+Math.cos(a)*r*.32,.57+Math.sin(a)*r*.24]}):demoAnchors;
function depth(x,y){return Math.sin(x*10+y*4)*.17+Math.cos(y*13-x*3)*.12;}
function project3D(p){
 const x=(p.x-.49)*2.4,y=(p.y-.57)*2.4,z=p.z;
 const cx=Math.cos(yaw),sx=Math.sin(yaw),cy=Math.cos(pitch),sy=Math.sin(pitch);
 const rx=x*cx+z*sx,rz=-x*sx+z*cx,ry=y*cy-rz*sy,zz=y*sy+rz*cy;
 const perspective=3.1/(3.1-zz),scale=Math.min(W*.47,H*.51)*zoom;
 return {x:W*.5+rx*scale*perspective,y:H*(W<650?.55:.51)+ry*scale*perspective,z:zz,k:perspective};
}
function center(i){const a=anchors[i];return project3D(fieldPoint({x:a[0],y:a[1],z:depth(a[0],a[1])}));}
canvas.addEventListener('pointerdown',e=>{if(view==='dashboard')return;drag={x:e.clientX,y:e.clientY,id:e.pointerId};dragMoved=false;canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>2)dragMoved=true;targetYaw+=dx*.006;targetPitch=Math.max(-1.2,Math.min(1.2,targetPitch+dy*.006));drag.x=e.clientX;drag.y=e.clientY;});
canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
canvas.addEventListener('wheel',e=>{if(view==='dashboard')return;e.preventDefault();targetZoom=Math.max(.55,Math.min(1.8,targetZoom*Math.exp(-e.deltaY*.001)));},{passive:false});
$('#orbit').onclick=()=>{orbit=!orbit;$('#orbit').textContent=orbit?'Orbit on':'Orbit off';$('#orbit').setAttribute('aria-pressed',String(orbit));};
$('#home-view').onclick=()=>{targetYaw=.25;targetPitch=-.22;targetZoom=1;};
// One continuous, globally connected field. Project identity is assigned by
// location; it never partitions the graph into separate project trees.
const nodes=[],edges=[],edgeKeys=new Set(),BASE_NODES=1200;
function owner(x,y){let best=0,d=Infinity;anchors.forEach((a,i)=>{const q=(x-a[0])**2+(y-a[1])**2;if(q<d){d=q;best=i}});return best;}
for(let i=0;i<BASE_NODES;i++){
 const a=rand()*Math.PI*2,r=Math.sqrt(rand()),u=Math.cos(a)*r,v=Math.sin(a)*r;
 const x=.49+u*.39+Math.sin(v*7+u*3)*.045;
 const y=.57+v*.29+Math.sin(u*8-v*3)*.045;
 nodes.push({x,y,z:depth(x,y)+(rand()-.5)*.22,g:owner(x,y),unit:0,parent:-1});
}
// Every result adds three vertices near an existing part of its project region.
// Their reveal amount is derived solely from the verified-unit count.
for(let g=0;g<specs.length;g++){
 const seeds=nodes.slice(0,BASE_NODES).map((n,i)=>({n,i})).filter(v=>v.n.g===g);
 const count=specs[g][4].reduce((a,b)=>a+b,0);
 for(let unit=1;unit<=count;unit++){
  if(!seeds.length){const a=anchors[g];nodes.push({x:a[0],y:a[1],z:depth(...a),g,unit:0,parent:-1});seeds.push({n:nodes[nodes.length-1],i:nodes.length-1});}
  const root=seeds[(unit*17)%seeds.length],angle=unit*2.39996;
  for(let k=0;k<3;k++){
   const radius=.022+k*.018;
   nodes.push({x:root.n.x+Math.cos(angle+k*.65)*radius,y:root.n.y+Math.sin(angle+k*.65)*radius,z:root.n.z+Math.sin(angle+k)*radius*2,g,unit,delay:k*.22,parent:root.i});
  }
 }
}
function connect(a,b){if(a===b)return;const key=a<b?`${a}:${b}`:`${b}:${a}`;if(edgeKeys.has(key))return;edgeKeys.add(key);edges.push([a,b]);}
// Nearest neighbours cross project boundaries. An earlier-node link guarantees
// a single connected scaffold, with no runtime force solver or topology churn.
for(let i=0;i<nodes.length;i++){
 const n=nodes[i],limit=i<BASE_NODES?BASE_NODES:nodes.length;
 const nearest=[];let earlier=-1,earlierD=Infinity;
 for(let j=0;j<limit;j++){
  if(i===j)continue;const m=nodes[j],d=(n.x-m.x)**2+(n.y-m.y)**2+((n.z-m.z)*.35)**2;
  if(j<i&&j<BASE_NODES&&d<earlierD){earlier=j;earlierD=d;}
  nearest.push({j,d});
 }
 nearest.sort((a,b)=>a.d-b.d);
 nearest.slice(0,i<BASE_NODES?6:4).forEach(v=>connect(i,v.j));
 if(i<BASE_NODES&&earlier>=0)connect(i,earlier);
 if(n.parent>=0)connect(i,n.parent);
}
function resize(){W=innerWidth;H=innerHeight;const d=Math.min(devicePixelRatio||1,1.5,Math.sqrt(2400000/(W*H)));canvas.width=W*d;canvas.height=H*d;ctx.setTransform(d,0,0,d,0,0);const gd=Math.min(d,.65);glowCanvas.width=Math.ceil(W*gd);glowCanvas.height=Math.ceil(H*gd);glowCtx.setTransform(gd,0,0,gd,0,0);render();}addEventListener('resize',resize);
let reduced=false;canvas.dataset.motionMode=reduced?'reduced':'full';$('#animation-motion').value=reduced?'reduced':'full';
$('#animation-motion').onchange=e=>{reduced=e.target.value==='reduced';canvas.dataset.motionMode=reduced?'reduced':'full';};
// Geometry is a direct projection of measured work, not a particle system.
const clamp=v=>Math.max(0,Math.min(1,v));
const ease=v=>{v=clamp(v);return v*v*(3-2*v)};
function approach(value,target,dt){return value+(target-value)*(1-Math.exp(-dt/1.15));}
function updateGrowth(dt){
 if(paused)return;
 projects.forEach((p,i)=>{const g=growth[i];
  g.births.forEach((age,j)=>g.births[j]=Math.min(10,age+dt));
  while(g.births.length<(dataMode==='live'?(p.visualDone||0):p.done))g.births.push(0);
  const visual=dataMode==='live'?(p.visualDone||0):p.done;
  g.units=reduced?visual:approach(g.units,visual,dt);
  g.opened=reduced?(p.start!==null?1:0):approach(g.opened,p.start!==null?1:0,dt);
  g.settled=reduced?p.step:approach(g.settled,p.step,dt);
  g.activity=approach(g.activity,(p.status==='working'||false)?1:0,dt);
  g.effort=approach(g.effort,clamp(visual-g.units),dt);
  if(!reduced)g.phase+=dt*g.activity;
  // Result envelopes lift the light gently, then decay. The additional slow
  // modulation only describes ongoing work, never extra progress.
  if(visual>g.seenDone){g.resultLift=Math.min(1,g.resultLift+.45);g.seenDone=visual;}
  g.resultLift*=Math.exp(-dt/2.8);
  const breath=reduced?.62:.52+.16*Math.sin(g.phase*.68+i*.93)+.07*Math.sin(g.phase*.29+i*1.7);
  const target=Math.min(.95,g.activity*breath+g.resultLift*.24);
  g.glow+=(target-g.glow)*(1-Math.exp(-dt/(target>g.glow?1.4:2.1)));
 });
}
function nodeAge(n){return n.unit===0?10:(growth[n.g].births[n.unit-1]??-10);}
function nodeAmount(n){return n.unit===0?1:reduced?((dataMode==='live'?(projects[n.g].visualDone||0):projects[n.g].done)>=n.unit?1:0):ease((nodeAge(n)-(n.parent>=0?n.delay:0))/2.8);}
function connection(a,b,pts){
 const na=nodes[a],nb=nodes[b],fresh=na.unit>0||nb.unit>0;
 if(!fresh)return {a:pts[a],b:pts[b],amount:1,fresh:false,light:0};
 const age=Math.min(nodeAge(na),nodeAge(nb));
 const parent=na.parent===b||nb.parent===a;
 const amount=Math.min(nodeAmount(na),nodeAmount(nb));
 const reveal=parent?1:reduced?1:ease((age-1.7)/2.2);
 const start=nodeAge(na)<=nodeAge(nb)?pts[a]:pts[b],end=start===pts[a]?pts[b]:pts[a];
 return {a:start,b:{x:start.x+(end.x-start.x)*reveal,y:start.y+(end.y-start.y)*reveal},amount:amount*reveal,fresh:true,light:reduced?0:ease(age/.6)*(1-ease((age-4)/3))};
}
function fieldPoint(n){
 let x=n.x,y=n.y,z=n.z;
 projects.forEach(p=>{
  const a=anchors[p.id],dx=n.x-a[0],dy=n.y-a[1];
  const g=growth[p.id],weight=Math.exp(-(dx*dx+dy*dy)/.032);
  const influence=weight*g.units/total(p);
  // Accumulated results permanently expand and fold the shared XYZ mesh.
  x+=(dx*.16-dy*.06)*influence;y+=(dy*.16+dx*.06)*influence;z+=(n.z*.25+.035)*influence;
  if(!reduced){
   // A coherent local deformation field: neighbours flex together, without
   // disconnected jitter. Its envelope fades when agents become inactive.
   const strength=weight*g.activity*(.75+g.effort*.65)*1,t=g.phase;
   x+=strength*(Math.sin(t*.72+dy*10+p.id*.7)*.014+Math.sin(t*.31+n.z*7)*.006);
   y+=strength*(Math.cos(t*.61+dx*9+p.id*.4)*.012);
   z+=strength*(Math.sin(t*.83+dx*8-dy*6+p.id*.5)*.065+Math.sin(t*.37+dy*8)*.025);
  }
 });
 return {x,y,z};
}
let embedVisible=true;addEventListener('message',e=>{if(e.origin===location.origin&&e.source===parent&&e.data?.type==='atlas-visibility')embedVisible=!!e.data.visible;});
function draw(now){
 requestAnimationFrame(draw);if(document.hidden||!embedVisible){lastTick=now;return}
 if(reduced&&now-lastFrame<33)return;
 const dt=lastTick?Math.min((now-lastTick)/1000,.1):0;lastTick=now;lastFrame=now;const issue=matrixIssue();renderIssue(issue);if(issue){if(now-lastUI>500){render();lastUI=now;}$('#growth-note').hidden=true;return;}if(!issue){tick(dt);updateGrowth(dt);}
 if(!paused&&!issue){if(orbit&&!drag&&!reduced)targetYaw+=dt*.045;const blend=1-Math.exp(-dt*6);yaw+=(targetYaw-yaw)*blend;pitch+=(targetPitch-pitch)*blend;zoom+=(targetZoom-zoom)*blend;}
 ctx.clearRect(0,0,W,H);ctx.lineCap='round';ctx.lineJoin='round';
 const amounts=nodes.map(nodeAmount),positions=nodes.map(fieldPoint);
 if(now-lastUI>500){canvas.dataset.growingVertices=String(amounts.filter(a=>a>.001&&a<.999).length);canvas.dataset.peakGrowingVertices=String(Math.max(Number(canvas.dataset.peakGrowingVertices||0),Number(canvas.dataset.growingVertices)));canvas.dataset.observedLiveResults=String(makerSequence.reduce((a,b)=>a+b,0));}
 const pts=positions.map((p,i)=>{
  const n=nodes[i];if(n.parent<0)return project3D(p);
  const root=positions[n.parent],f=amounts[i];
  return project3D({x:root.x+(p.x-root.x)*f,y:root.y+(p.y-root.y)*f,z:root.z+(p.z-root.z)*f});
 });
 const frameLines=edges.map(([a,b])=>connection(a,b,pts));
 // The white scaffold remains dense from the start; colored contributions
 // become richer as real (here simulated) verified results accumulate.
 edges.forEach(([a,b],i)=>{
  const line=frameLines[i],amount=line.amount;if(amount<.003)return;
  const na=nodes[a],nb=nodes[b],newEdge=na.unit>0||nb.unit>0;
  const color=i%4===0?'#dce9ec':projects[na.g].color;
  ctx.strokeStyle=color;ctx.lineWidth=newEdge?.45:.4;
  ctx.globalAlpha=Math.max(.2,Math.min(1,((pts[a].z+pts[b].z)/2+1)*.65))*amount*(newEdge?.19:.10+(growth[na.g].units/total(projects[na.g]))*.035);
  if(view==='live'&&focused!==null&&na.g!==focused&&nb.g!==focused)ctx.globalAlpha*=.28;
  ctx.beginPath();ctx.moveTo(line.a.x,line.a.y);ctx.lineTo(line.b.x,line.b.y);ctx.stroke();
 });
 // Draw active light into a bounded layer, then soften the whole layer once.
 // Brightness means agent activity, while permanent added vertices mean results.
 glowCtx.clearRect(0,0,W,H);glowCtx.lineCap='round';glowCtx.lineJoin='round';
 projects.forEach(project=>{
  const g=growth[project.id],energy=g.glow*(view==='live'&&focused!==null&&project.id!==focused?.25:1);if(energy<.008)return;
  glowCtx.strokeStyle=project.color;
  for(const [width,alpha] of [[7,.04],[3,.14],[.7,.12]]){
   glowCtx.lineWidth=width;glowCtx.globalAlpha=energy*alpha;glowCtx.beginPath();
   edges.forEach(([a,b],i)=>{
    if(nodes[a].g!==project.id||i%4!==0||Math.min(amounts[a],amounts[b])<.98)return;
    const line=frameLines[i];glowCtx.moveTo(line.a.x,line.a.y);glowCtx.lineTo(line.b.x,line.b.y);
   });glowCtx.stroke();
  }
 });
 // New structural links get a temporary diffuse highlight as they form,
 // including cross-region links, then become ordinary persistent mesh edges.
 edges.forEach(([a,b],i)=>{
  const line=frameLines[i];if(!line.fresh||line.amount<.003||line.light<.01)return;
  const owner=nodes[a].unit>0?nodes[a]:nodes[b];glowCtx.strokeStyle=projects[owner.g].color;
  for(const [width,alpha] of [[6,.12],[2,.38]]){
   glowCtx.lineWidth=width;glowCtx.globalAlpha=line.light*line.amount*alpha;
   glowCtx.beginPath();glowCtx.moveTo(line.a.x,line.a.y);glowCtx.lineTo(line.b.x,line.b.y);glowCtx.stroke();
  }
 });
 ctx.save();ctx.globalAlpha=1;ctx.filter='blur(2px)';ctx.drawImage(glowCanvas,0,0,W,H);ctx.restore();
 pts.forEach((p,i)=>{
  const amount=amounts[i];if(amount<.003)return;const n=nodes[i],fresh=n.unit>0;
  ctx.fillStyle=i%5===0?'#e5edef':projects[n.g].color;
  ctx.globalAlpha=Math.max(.25,Math.min(1,(p.z+1)*.7))*amount*(fresh?.85:i%3===0?.65:.38);
  if(view==='live'&&focused!==null&&n.g!==focused)ctx.globalAlpha*=.28;
  ctx.beginPath();ctx.arc(p.x,p.y,(fresh?1.25:i%9===0?1.25:.7)*amount*p.k,0,7);ctx.fill();
 });
 // A blocked project's stable marker has a status meaning, not an animation.
 projects.filter(p=>p.status==='blocked').forEach(p=>{const c=center(p.id);ctx.globalAlpha=.9;ctx.fillStyle='#eeb85d';ctx.fillRect(c.x-2,c.y-2,4,4);});
 ctx.globalAlpha=1;
 if(view==='live'||view==='pure'){
  const note=$('#growth-note');
  if(!note.hidden){
   const id=+note.dataset.project,unit=+note.dataset.unit;
   {const age=growth[id].births[unit-1]||0;note.style.opacity=String(reduced?1:ease(age/.45)*(1-ease((age-4.5)/2)));if(age>=6.5)note.hidden=true;}
   const index=nodes.findIndex(n=>n.g===id&&n.unit===unit);
   if(index>=0){const point=pts[index],left=Math.max(16,Math.min(W-252,point.x+25)),top=view==='pure'?Math.max(20,Math.min(H-(note.offsetHeight||80)-20,point.y-45)):Math.max(W<650?290:260,Math.min(H-270,($('#labels').getBoundingClientRect?.().top??H-180)-(note.offsetHeight||80)-18,point.y-65));
    note.style.left=`${left}px`;note.style.top=`${top}px`;
    ctx.globalAlpha=.32;ctx.strokeStyle=projects[id].color;ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(point.x,point.y);ctx.lineTo(left,top+20);ctx.stroke();ctx.globalAlpha=1;
   }
  }
 }
 if(now-lastUI>500){render();lastUI=now}
}
function matrixIssue(){return '';}
function renderIssue(){}
function liveFresh(){return true;}
function liveTime(value){return value?new Date(value*1000).toLocaleString():'Unknown';}
function reflectionJournal(kind,opened=new Set()){
 const demo=dataMode==='demo',liveData=workData();
 const entries=(liveData?.reflections?.entries||[]).filter(e=>e.kind===kind);
 const status=liveData?.reflections?.status;
 return `<details class="mission-journal reflection-journal" data-journal="reflection-${kind}" ${opened.has('reflection-'+kind)?'open':''}><summary>Daily AI reflections <span>${entries.length} ${entries.length===1?'entry':'entries'} ↓</span></summary><div class="journal-scroll">${entries.map(e=>`<section><time>${liveTime(e.created)} · Maker Node</time><p class="reflection-text">${escapeHTML(e.text)}</p><p class="journal-note">Research journal. Window: ${liveTime(e.from)} – ${liveTime(e.to)}</p><div class="reflection-sources">${(e.facts?.samples||[]).map(item=>`<div><b>[${escapeHTML(item.reference)}] ${escapeHTML(item.title)}</b> </div>`).join('')}</div></section>`).join('')||'<p>No reflections published yet.</p>'}</div><p class="journal-note">Maker Node research notes and observations.</p></details>`;
}

let missionKey='';
function renderMissions(){
 const demo=dataMode==='demo',liveData=workData(),stages=MakerDemo.roles;
 const key=JSON.stringify([liveData?.observed_at,liveFresh(),matrixIssue(),demo&&paused]);
 if(missionKey===key&&$('#cards').dataset.mode==='missions')return;
 missionKey=key;
 const cards=$('#cards'),opened=new Set([...cards.querySelectorAll?.('details[open]')||[]].map(e=>e.dataset.journal));
 const active=document.activeElement?.dataset?.project;
 const journalFocus=document.activeElement?.closest?.('[data-journal]')?.dataset.journal;
 const scrolls=new Map([...cards.querySelectorAll?.('[data-journal]')||[]].map(e=>[e.dataset.journal,e.querySelector('.journal-scroll')?.scrollTop||0]));
 cards.dataset.mode='missions';
 const fresh=demo||liveFresh(),issue=matrixIssue(),pausedService=liveData?.control?.paused==='true';
 $('.dash-heading h1').textContent='Missions in motion.';
 $('.dash-heading p').textContent=makerData.origin==='external'?'External activity · session counts and reported states.':'Maker Node · Maker & DIY research.';
 cards.innerHTML=stages.map((stage,i)=>{
  const job=workJob(i),running=fresh&&!issue&&!pausedService&&!(demo&&paused)&&job?.state==='running';
  const stats=(liveData?.mission_stats||[]).find(r=>r.kind===stage.kind);
  const rows=(liveData?.journal||[]).filter(r=>r.kind===stage.kind);
  const recent=(liveData?.history||[]).find(r=>r.kind===stage.kind);
  const topic=job?.category||recent?.category||'Awaiting a topic';
  const state=demo&&paused?'Paused':!fresh?'Connection pending / stale':issue?'Signal interrupted':pausedService?(liveData?.control?.atlas_reflection_owner?'Writing daily reflections':'Research paused'):running?'Working now':job?'Waiting for its turn':'Waiting for work';
  const action=['Discovering sources','Preserving documents','Extracting text','Classifying excerpts'][i];
  const days=[...new Set(rows.map(r=>r.day))];
  return `<article class="mission-agent ${running?'is-working':''}" style="--color:${specs[i][2]}">
   <div class="mission-top"><span>0${i+1} / ${demo?'PIPELINE WORKER':i===3?'LOCAL AI':'PIPELINE WORKER'}</span><span class="mission-state"><i></i>${state}</span></div>
   <h2>${stage.name}</h2><div class="mission-now"><small>${demo?'LIVE MISSION':'LIVE MISSION'} · ${running?'IN PROGRESS':'CURRENT CONTEXT'}</small><h3>${escapeHTML(topic.replaceAll('_',' '))}</h3><p>${running?action+': ':job?'Next item: ':'Last completed: '}${escapeHTML(job?.title||recent?.title||'No recorded item available')}</p><span>${!fresh?'Last snapshot':issue?'Activity unavailable':running?'Activity observed': 'Awaiting activity'} · ${liveTime(liveData?.observed_at)}</span></div>
   <div class="mission-stats"><div><b>${workCount(stage.kind,'done').toLocaleString()}</b><small>jobs completed</small></div><div><b>${stats?stats.last_hour:'—'}</b><small>last hour</small></div><div><b>${stats?stats.last_day:'—'}</b><small>24 hours</small></div><div><b>${workCount(stage.kind,'pending')}</b><small>queued</small></div><div><b>${workCount(stage.kind,'failed')}</b><small>failed</small></div></div>
   <div class="journal-heading"><h3>TOPIC JOURNAL</h3><span>${demo?'Activity · UTC dates':'30 days · UTC dates'}</span></div>
   <div class="topic-trail">${[...new Set(rows.map(r=>r.topic))].slice(0,7).map(t=>`<span>${escapeHTML(t.replaceAll('_',' '))}</span>`).join('')||'<p>No recorded topics in this window.</p>'}</div>
   <details class="mission-journal" data-journal="${i}" ${opened.has(String(i))?'open':''}><summary>Explore daily activity <span>${days.length} recorded days ↓</span></summary><div class="journal-scroll">${days.map(day=>{
    const entries=rows.filter(r=>r.day===day),count=entries.reduce((n,r)=>n+r.completed,0);
    return `<section><time>${escapeHTML(day)}</time><strong>${count} completed jobs · ${entries.length} topics</strong>${entries.map(r=>`<p><b>${escapeHTML(r.topic.replaceAll('_',' '))}</b><span>${r.completed} jobs · latest ${liveTime(r.latest)}</span></p>`).join('')}</section>`;
   }).join('')||'<p>No completed activity recorded in the past 30 days.</p>'}</div><p class="journal-note">${demo?'Maker Node activity grouped by topic and date.':'Recorded activity summary, not an AI reflection or proof of learned knowledge. Up to 400 topic/day groups across the pipeline.'}</p></details>
   ${reflectionJournal(stage.kind,opened)}
   <button class="mission-open" data-project="${i}">Open worker workspace <span>↗</span></button>
  </article>`;
 }).join('');
 for(const e of cards.querySelectorAll?.('[data-journal]')||[]){e.querySelector('.journal-scroll').scrollTop=scrolls.get(e.dataset.journal)||0;if(e.dataset.journal===journalFocus)e.querySelector('summary').focus({preventScroll:true});}
 if(active!==undefined)document.querySelector(`[data-project="${active}"]`)?.focus({preventScroll:true});
}

// Radio is opt-in for every page load. No stream is opened until Play.
let radio=null,radioEpoch=0;
$('#radio-toggle').onclick=async()=>{
 const button=$('#radio-toggle'),status=$('#radio-status');
 if(radio&&!radio.paused){radioEpoch++;radio.pause();radio.removeAttribute('src');radio.load();button.textContent='Play';status.textContent='Sound off';return;}
 if(!radio){radio=new Audio();radio.preload='none';radio.onerror=()=>{status.textContent='Station unavailable · tap Play to retry';button.textContent='Play';};}
 const epoch=++radioEpoch;radio.src='https://ice5.somafm.com/dronezone-128-mp3';radio.volume=Number($('#radio-volume').value)/100;radio.muted=false;
 status.textContent='Connecting…';button.textContent='Stop';
 try{await radio.play();if(epoch===radioEpoch)status.textContent='Playing · SomaFM Drone Zone';}catch{if(epoch===radioEpoch){status.textContent='Could not play · tap Play to retry';button.textContent='Play';}}
};
$('#radio-volume').oninput=e=>{if(radio)radio.volume=Number(e.target.value)/100;};
let lastUI=0;reset();resize();requestAnimationFrame(draw);
if(makerData.origin==='external'){document.title='Neural Atlas · External activity';document.querySelector('[data-view=dashboard] span').textContent=MakerDemo.roles.length;$('.source a').textContent='External activity';$('.intro>p').textContent='Your reported worker events.';$('#speed').disabled=true;$('#pause').setAttribute('aria-label','Pause visualization');const help=document.querySelectorAll('.reading-key p');help[help.length-1].textContent='External activity only. Glow means reported running work; growth means accepted completed events. This session is bounded and resets on reload. See CONNECTING.md for feed limits.';}
if(heroMotion){view='pure';orbit=true;document.body.className='pure hero-mode';render();}
})();

