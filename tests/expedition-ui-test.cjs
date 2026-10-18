const fs=require('fs'),vm=require('vm'),assert=require('assert');const elements=new Map();const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>({addColorStop(){}})),set:(o,k,v)=>(o[k]=v,true)});function el(){return {style:{setProperty(){}},classList:{add(){},remove(){},contains(){return false},toggle(){}},children:[{},{}],append(){},prepend(){},insertBefore(){},addEventListener(){},querySelectorAll(){return []},setAttribute(){},getContext(){return ctx},closest(){return null},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}},dataset:{}}}const doc={querySelector(){return null},getElementById(id){if(!elements.has(id))elements.set(id,el());return elements.get(id)},createElement:el,addEventListener(){},documentElement:{},body:el(),createTreeWalker(){return {nextNode(){return null}}}};let mem={};let frames=[];const c=vm.createContext({document:doc,window:{innerWidth:1200,innerHeight:850,addEventListener(){},removeEventListener(){}},NodeFilter:{SHOW_TEXT:4},sessionStorage:{getItem(){return null},setItem(){},removeItem(){}},AbortController,localStorage:{getItem:k=>mem[k],setItem:(k,v)=>mem[k]=v},console,Date,Math,btoa:s=>Buffer.from(s).toString('base64'),atob:s=>Buffer.from(s,'base64').toString(),setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},requestAnimationFrame(f){frames.push(f)}});const s=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8');for(const m of s.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))vm.runInContext(m[1],c);function run(s){return vm.runInContext(s,c)};run("initAudio=()=>{};playChimeSound=()=>{};startMusic=()=>{};stopMusic=()=>{}");



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

// v7 public controls: fair challenge gear, workshop preview, daily receipt idempotence and campaign restoration.
run("window.angioExpedition.action('home');window.angioExpedition.action('workshop')");assert.ok(run("document.getElementById('axModal').innerHTML.includes('Kahraman atölyesi')"));
run("window.angioExpedition.action('spec:precision');window.angioExpedition.action('variant:orbit')");assert.equal(run('window.angioExpedition.state.meta.specializations.cutter'),'precision');
run("window.angioExpedition.action('skill-preview')");assert.equal(run('window.angioExpedition.engine.variant'),'orbit');assert.equal(run('window.angioExpedition.engine.energy'),100);
run("window.angioExpedition.action('home');window.angioExpedition.action('challenge:daily')");assert.equal(run('window.angioExpedition.run.fair'),true);assert.equal(run('window.angioExpedition.engine.options.speed'),1);assert.equal(run('Object.keys(window.angioExpedition.engine.cards).length'),0);
run("window.angioExpedition.action('fight');window.angioExpedition.engine.end(false,'timeout')");frame(80);const beforeWin=run('rpgState().materials');run("window.angioExpedition.action('retry');window.angioExpedition.engine.end(true,'complete')");frame(90);assert.equal(run('rpgState().materials'),beforeWin+20,'a failed daily does not consume the win reward');
run("window.angioExpedition.action('retry');window.angioExpedition.engine.end(true,'complete')");frame(90);assert.equal(run('rpgState().materials'),beforeWin+20,'daily win reward is paid once');assert.equal(run('window.angioExpedition.run.shards'),0,'repeated win does not show an unearned reward');
run("window.angioExpedition.action('home')");assert.equal(run('window.angioExpedition.run.stage'),2,'challenge restores suspended campaign');
console.log('PASS UI v7: specialization/variant preview, fixed fair gear, failed-then-won daily rewards, repeat-win receipt, campaign restoration and challenge results');
run("window.angioExpedition.run.phase='cards';window.angioExpedition.run.offers=['wide','rhythm','focus'];window.angioExpedition.run.cards={};window.angioExpedition.run.blade='wide';window.angioExpedition.run.bladeLevel=3;window.angioExpedition.resume()");assert.ok(run("document.getElementById('axModal').innerHTML.includes('17.4px')"));assert.ok(run("document.getElementById('axModal').innerHTML.includes('22.4px')"));
console.log('PASS card comparison includes equipped blade width and forge level');
