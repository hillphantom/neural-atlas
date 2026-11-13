/* Entirely local, fictional Maker Node telemetry. No external AI connections. */
let MakerDemo=(()=>{
 const roles=[
  {kind:'scout',name:'Maker Discovery Worker',goal:'Discover useful Maker and DIY project ideas and register source references under Maker Node project policy.'},
  {kind:'collect',name:'Build Resource Collector',goal:'Collect parts lists, material notes and build references from the Discovery Worker.'},
  {kind:'extract',name:'Build Notes Extractor',goal:'Organize dimensions, component details and build observations into searchable project notes.'},
  {kind:'ai',name:'Maker Research Analyst',goal:'Compare project notes, identify trade-offs and save a structured research brief for review.'}
 ];
 const topics=[
  ['3D printing','Parametric pegboard tool holders','Compare snap-fit clearance test coupons','A removable clip could make a holder easier to rearrange.','Which clearance fits the same clip across different printers?'],
  ['Woodworking','Modular plywood workbench','Compare bench layouts and storage dimensions','A common module width could simplify the cut list.','Could the same drawer fit both a mobile cart and the bench?'],
  ['Electronics','USB-powered desk sensor','Organize sensor pin maps and enclosure notes','Separating the connector opening from the sensor vent could make the case easier to revise.','How could a replaceable sensor mount help future upgrades?'],
  ['Robotics','Small line-following rover','Compare chassis layouts and wheel spacing','An adjustable sensor bracket could support several track layouts.','Would a removable front module make experiments easier to compare?'],
  ['Sewing & textiles','Roll-up tool organizer','Compare pocket layouts and fabric samples','Mixed pocket widths could accommodate both hand tools and measuring tools.','Which pockets need labels rather than extra dividers?'],
  ['Repair & reuse','Restored desktop task lamp','Catalog reusable housing and mounting pieces','A replaceable mount could preserve more of the original housing.','Which pieces can be reused without redesigning the entire shell?'],
  ['Digital fabrication','Laser-cut desk organizer','Compare tab-and-slot layout fixtures','A small test joint could reveal fit problems before a full sheet is cut.','Could one joint sample represent all the organizer corners?'],
  ['Workshop storage','Rolling small-parts cabinet','Compare drawer bins and label layouts','Standard bin footprints could make inventory easier to reorganize.','Would shallow drawers improve visibility for tiny components?']
 ];
 let epoch=0,elapsed=0,serial=0,history=[],workers=[];
 function item(i,n){const topic=topics[(Math.floor(n/3)+i*2)%topics.length];return {title:topic[1],category:topic[0],note:topic[2],observation:topic[3],question:topic[4]};}
 function result(i,n,at){const x=item(i,n);return {...x,simulated:true,job:'maker-demo-'+(++serial),kind:roles[i].kind,completed:at,reference:'M'+serial};}
 function reset(){epoch=Date.now()/1000;elapsed=0;serial=0;history=[];workers=roles.map((_,i)=>({count:60+i*12,cycle:0,next:4+i*1.7}));
  for(let i=0;i<4;i++)for(let n=0;n<workers[i].count;n++)history.push(result(i,n,epoch-180-(workers[i].count-n)*900));
  history.sort((a,b)=>b.completed-a.completed);
 }
 function advance(dt){elapsed+=dt;const added=[];
  workers.forEach((w,i)=>{let guard=0;while(elapsed>=w.next&&guard++<1000){const e=result(i,w.cycle,epoch+w.next);history.unshift(e);added.push({...e,worker:i});w.count++;w.cycle++;w.next+=8+i*1.5;}});
  history.sort((a,b)=>b.completed-a.completed);history=history.slice(0,1200);return added;
 }
 function snapshot(){const now=epoch+elapsed;
  const jobs=workers.map((w,i)=>({...item(i,w.cycle),kind:roles[i].kind,state:w.next-elapsed>2?'running':'pending',updated:now-2,next_at:epoch+w.next,attempts:1,simulated:true}));
  const journal=new Map();for(const e of history){const day=new Date(e.completed*1000).toISOString().slice(0,10),key=e.kind+day+e.category;
   if(!journal.has(key))journal.set(key,{kind:e.kind,topic:e.category,day,completed:0,latest:e.completed});journal.get(key).completed++;
  }
  const reflections=roles.map((role,i)=>{const t=topics[i*2],last=history.find(e=>e.kind===role.kind);return {kind:role.kind,created:last.completed,from:epoch-86400,to:epoch,text:`Worked on\nI explored ${t[1].toLowerCase()} and organized example ${['project ideas','material and component references','build notes','design comparisons'][i]}.\n\nLearned\n${t[3]}\n\nFound interesting\n${t[4]}`,facts:{samples:[]}};});
  return {origin:'demo',connected:true,observed_at:now,sources:312+workers.reduce((n,w)=>n+w.cycle,0),jobs,history:history.slice(0,80),journal:[...journal.values()],
   counts:roles.flatMap((r,i)=>[{kind:r.kind,state:'done',count:workers[i].count},{kind:r.kind,state:'pending',count:8+(workers[i].cycle%5)},{kind:r.kind,state:'failed',count:i===2?1:0}]),
   mission_stats:roles.map(r=>({kind:r.kind,last_hour:history.filter(e=>e.kind===r.kind&&e.completed>now-3600).length,last_day:history.filter(e=>e.kind===r.kind&&e.completed>now-86400).length})),
   reflections:{status:'demo',entries:reflections},control:{},runtime:{host:'Local demo'},outputs:[]};
 }
 return {roles,reset,advance,snapshot};
})();
