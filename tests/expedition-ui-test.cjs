const fs=require('fs'),vm=require('vm'),assert=require('assert');const elements=new Map();const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>({addColorStop(){}})),set:(o,k,v)=>(o[k]=v,true)});function el(){return {style:{setProperty(){}},classList:{add(){},remove(){},contains(){return false},toggle(){}},children:[{},{}],append(){},prepend(){},insertBefore(){},addEventListener(){},querySelectorAll(){return []},setAttribute(){},getContext(){return ctx},closest(){return null},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}},dataset:{}}}const doc={querySelector(){return null},getElementById(id){if(!elements.has(id))elements.set(id,el());return elements.get(id)},createElement:el,addEventListener(){},documentElement:{},body:el(),createTreeWalker(){return {nextNode(){return null}}}};let mem={};let frames=[];const c=vm.createContext({document:doc,window:{innerWidth:1200,innerHeight:850,addEventListener(){},removeEventListener(){}},NodeFilter:{SHOW_TEXT:4},sessionStorage:{getItem(){return null},setItem(){},removeItem(){}},AbortController,localStorage:{getItem:k=>mem[k],setItem:(k,v)=>mem[k]=v},console,Date,Math,setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},requestAnimationFrame(f){frames.push(f)}});const s=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8');for(const m of s.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))vm.runInContext(m[1],c);function run(s){return vm.runInContext(s,c)};run("initAudio=()=>{};playChimeSound=()=>{};startMusic=()=>{};stopMusic=()=>{}");



// Isolated DOM surface; assertions target public UI actions and persisted state.
run(`document.createElement=()=>({style:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},querySelector(){return document.getElementById('axCanvas')},querySelectorAll(){return []},clientWidth:390,clientHeight:844});window.devicePixelRatio=1;selectLanguage('tr');nameAccepted=true;window.angioExpedition.state.meta.runs=3;window.angioExpedition.begin('UI-QA')`);
let simFrame=Date.now();function frame(n=1){for(let i=0;i<n;i++){const f=frames.shift();if(f)f(simFrame+=50);}}
assert.equal(run('window.angioExpedition.engine.status'),'playing');
run('window.angioExpedition.engine.hp=57');
run("window.angioExpedition.action('pause')");
assert.equal(run("db.get('angio-expedition-v6',{}).run.snapshot.hp"),57);
assert.ok(run("document.getElementById('axModal').innerHTML.includes('57')"));
run("window.angioExpedition.action('save');window.angioExpedition.action('resume')");
assert.equal(run('window.angioExpedition.engine.hp'),57);
run("window.angioExpedition.action('unpause')");frame(160);
run("window.angioExpedition.engine.stats.cuts=30;window.angioExpedition.engine.end(true,'complete')");frame(60);
assert.equal(run('window.angioExpedition.run.phase'),'cards');
assert.equal(run('window.angioExpedition.state.meta.frontier'),2);
const shards=run('rpgState().materials');frame(10);assert.equal(run('rpgState().materials'),shards);
const card=run('window.angioExpedition.run.offers[0]');run(`window.angioExpedition.action('card:${card}')`);
assert.equal(run('window.angioExpedition.run.cards.'+card),1);
run("window.angioExpedition.action('undo')");assert.equal(run('window.angioExpedition.run.phase'),'cards');assert.equal(run('window.angioExpedition.run.cards.'+card),undefined);
run(`window.angioExpedition.action('card:${card}')`);run("window.angioExpedition.action('route:0')");assert.equal(run('window.angioExpedition.run.stage'),2);
run("window.angioExpedition.action('pause');window.angioExpedition.action('practice:hunter')");const checkpoint=run("db.get('angio-expedition-v6',{}).run.stage");assert.equal(checkpoint,2);frame(100);assert.equal(run('rpgState().materials'),shards);assert.equal(run("db.get('angio-expedition-v6',{}).run.stage"),2);
run("window.angioExpedition.action('home')");assert.equal(run('window.angioExpedition.run.stage'),2);
console.log('PASS UI: saved combat snapshot/resume, card offers, undo, route advancement, once-only payout and isolated practice checkpoint');
