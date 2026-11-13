const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
function app(dir,external=false,hero=false,config=null,project=null){
 const elements=new Map(),el=()=>({innerHTML:'',append(){},prepend(){},hidden:false,dataset:{},style:{setProperty(){}},classList:{toggle(){}},addEventListener(){},setAttribute(){},focus(){},close(){this.open=false},showModal(){this.open=true},querySelectorAll:()=>[],getBoundingClientRect:()=>({top:700})});
 const ctx=new Proxy({},{get:()=> (...args)=>assert(args.filter(a=>typeof a==='number').every(Number.isFinite))}),canvas=()=>({...el(),getContext:()=>ctx}),main=canvas();
 const box={document:{createElement:canvas,querySelector:s=>{if(s==='#atlas')return main;if(!elements.has(s))elements.set(s,el());return elements.get(s)},querySelectorAll:s=>s==='.reading-key p'?[el()]:[],addEventListener(){},body:{},hidden:false},innerWidth:1440,innerHeight:900,devicePixelRatio:1,addEventListener(){},matchMedia:()=>({matches:false}),requestAnimationFrame(){},setInterval(){},setTimeout(){},URL,URLSearchParams,Blob,location:{protocol:'http:',origin:'http://localhost',search:external?'?source=external':''},Date,window:{}};
 if(hero){box.location.search='?art';box.matchMedia=()=>({matches:true});}
 if(config)box.AtlasConfig=config;if(project)box.location.search+='&project='+project;vm.createContext(box);vm.runInContext(fs.readFileSync(path.join(dir,'maker-demo.js'),'utf8'),box);
 if(external)vm.runInContext(fs.readFileSync(path.join(dir,'activity-adapter.js'),'utf8'),box);
 let code=fs.readFileSync(path.join(dir,'app.js'),'utf8').replace('let lastUI=0;',`globalThis.check={tick,draw,render,renderMissions,openAgent,tab:v=>{detailTab=v;detailKey='';renderDetail();},get:()=>({projects,growth,makerSequence,orbit,yaw,reduced})};let lastUI=0;`);vm.runInContext(code,box);return {box,elements,t:box.check};
}
const demo=app(path.join(__dirname,'app'));assert.equal(demo.t.get().orbit,false);demo.t.tick(3);assert.equal(demo.t.get().makerSequence[0],0);demo.t.tick(1);assert.equal(demo.t.get().makerSequence[0],1);demo.t.renderMissions();assert(demo.elements.get('#cards').innerHTML.includes('Daily AI reflections'));
for(let i=0;i<4;i++){demo.t.openAgent(i);for(const view of ['now','history','outputs','resources'])demo.t.tab(view);}
for(let i=0;i<120;i++)demo.t.tick(60);assert(demo.t.get().projects.every(p=>p.done<=p.targets.reduce((a,b)=>a+b,0)));demo.t.draw(100);demo.t.draw(116);
const ext=app(path.join(__dirname,'app'),true),api=ext.box.window.NeuralAtlas;
assert.equal(api.snapshot().history.length,0);ext.t.tick(1000);assert.equal(ext.t.get().makerSequence[0],0);
const event={id:'one',worker:'scout',state:'running',title:'<img src=x onerror=alert(1)>',topic:'Workshop',at:new Date().toISOString()};
assert.equal(api.ingest(event),1);ext.t.tick(1);assert.equal(ext.t.get().makerSequence[0],0);ext.t.openAgent(0);assert(!ext.elements.get('#detail-content').innerHTML.includes('<img'));
assert.equal(api.ingest({...event,id:'two',state:'completed'}),1);ext.t.tick(1);assert.equal(ext.t.get().makerSequence[0],1);assert.equal(api.ingest({...event,id:'two',state:'completed'}),0);ext.t.tick(1);assert.equal(ext.t.get().makerSequence[0],1);
assert.throws(()=>api.ingest({...event,id:'bad',worker:'unknown'}));assert.equal(api.snapshot().history.length,1);
api.ingest({...event,id:'three',state:'failed'});ext.t.tick(1);assert.equal(ext.t.get().projects[0].status,'queued');ext.t.renderMissions();ext.t.draw(100);ext.t.draw(116);
vm.runInContext("ExternalActivity.fail('Feed unavailable')",ext.box);ext.t.tick(1);ext.t.render();assert.equal(ext.elements.get('#connection-status').textContent,'Feed unavailable');assert(ext.t.get().projects.every(p=>p.status==='queued'));
assert.deepEqual(JSON.parse(fs.readFileSync(path.join(__dirname,'activity.json'),'utf8')),[], 'Do not publish runtime activity');
console.log('PASS: demo timing, bounded growth, workspaces, missions, external-only progress, dedupe, invalid events, safe text, failure/connection state.');


const inventory={projects:[{id:'a',name:'Alpha'},{id:'b',name:'Beta'}],workers:Array.from({length:12},(_,i)=>({id:'custom-'+i,name:'Pipeline '+i,project:i<6?'a':'b',type:'pipeline',goal:'Custom goal'}))};
const many=app(path.join(__dirname,'app'),true,false,inventory);
assert.equal(many.t.get().projects.length,12);
for(let i=0;i<12;i++)many.box.window.NeuralAtlas.ingest({id:'result-'+i,worker:'custom-'+i,state:'completed',title:'Result '+i,topic:'Topic',at:new Date().toISOString()});
many.t.tick(1);assert(many.t.get().makerSequence.every(n=>n===1));many.t.renderMissions();many.t.openAgent(11);many.t.draw(100);many.t.draw(116);
const filtered=app(path.join(__dirname,'app'),true,false,inventory,'a');assert.equal(filtered.t.get().projects.length,6);
filtered.box.window.NeuralAtlas.ingest({id:'other-project',worker:'custom-11',state:'completed',title:'Other work',topic:'Topic',at:new Date().toISOString()});filtered.t.tick(1);assert(filtered.t.get().makerSequence.every(n=>n===0));
console.log('PASS: 12 custom pipelines, all-worker growth, workspace rendering, project filtering and isolated counts.');
