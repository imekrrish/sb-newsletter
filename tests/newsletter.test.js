const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const C=require('../public/converter');
const S=require('../public/bess-settings');
const solar=require('../public/settings');
const U=require('../public/common');
const rss=fs.readFileSync(__dirname+'/sample.rss','utf8');
const items=C.parseRss(rss,S).items;
function edition(){return {date:new Date('2026-10-03T12:00:00Z'),today:'Today sample',stories:items,lead:{enabled:true,story:items[0],paragraph1:'Hero paragraph one',paragraph2:'Hero paragraph two',bullets:'Capacity: 1200 MWh\nRevenue: Long-term contract'},features:[{enabled:true,story:items[1],paragraph:'Feature one copy',bullets:'First detail\nSecond detail'},{enabled:true,story:items[2],paragraph:'Feature two copy',bullets:'First detail\nSecond detail'}]};}
test('RSS retains paragraphs, takeaways, and exact category priority',()=>{assert.equal(items.length,6);assert.equal(items[0].paragraphs.length,2);assert.equal(items[0].takeaways.length,3);assert.equal(items[1].section,'Markets & Tenders');assert.equal(items[3].section,'Policy, Grid & Regulation');assert.ok(!items[0].tag.includes('NL'));});
test('three tiers render once per story with correct copy and no signal images',()=>{const {html,stats}=C.buildNewsletter(edition(),S);assert.equal(stats.stories,6);assert.equal(stats.features,2);assert.equal(stats.fileName,'BN_3Oct2026.html');assert.match(html,/Hero paragraph one/);assert.match(html,/Hero paragraph two/);assert.match(html,/Feature two copy/);const signals=html.split('Quick Signals')[1];assert.ok(!signals.includes('<img'));items.forEach(s=>assert.equal((html.match(new RegExp('>'+s.title+'<','g'))||[]).length,1));assert.match(html,/\$\[USER:UNSUB_LINK\]\$/);});
test('duplicate features and lead cannot also render as signals',()=>{const e=edition();e.features[1].story=e.features[0].story;const r=C.buildNewsletter(e,S);assert.equal(r.stats.features,1);assert.equal(r.stats.stories,6);e.features[0].story=e.lead.story;assert.equal(C.buildNewsletter(e,S).stats.features,1);});
test('ad slots appear in both publications, disabled and incomplete slots disappear',()=>{for(const settings of [S,solar]){const e=edition();e.ads={top:{enabled:true,image:'https://example.com/ad.jpg',url:'https://example.com',label:'Test sponsor'},middle:{enabled:false,image:'https://example.com/hidden.jpg',url:'https://example.com'},bottom:{enabled:true,image:'javascript:bad',url:'https://example.com'}};const {html}=C.buildNewsletter(e,settings);assert.match(html,/Test sponsor/);assert.ok(!html.includes('hidden.jpg'));assert.ok(!html.includes('javascript:bad'));assert.equal((html.match(/Advertisement/g)||[]).length,1);}});
test('URLs, HTML, and Unicode survive safely',()=>{const e=edition();e.lead.story={...items[0],title:'<script>alert(1)</script> – ₹',link:'javascript:alert(1)',image:'data:text/html,bad'};const {html}=C.buildNewsletter(e,S);assert.ok(!html.includes('<script>'));assert.ok(!html.includes('javascript:'));assert.ok(!html.includes('data:text/html'));assert.match(html,/&#8377;/);assert.equal(U.safeUrl('https://example.com'),'https://example.com/');});
test('proxy rejects arbitrary hosts and private destinations',()=>{const {allowed}=require('../api/rss');for(const u of ['http://bessnews.com/rss','https://localhost/rss','https://127.0.0.1/rss','https://bessnews.com.evil.com/rss','https://user:pass@bessnews.com/rss','https://bessnews.com:444/rss'])assert.equal(allowed(u),false);assert.equal(allowed('https://bessnews.com/rss'),true);});
test('local server serves SB/BESS tabs and rejects unsupported proxy destinations',async t=>{
  const {spawn}=require('node:child_process');
  const port=45219;const server=spawn(process.execPath,['server.js'],{cwd:require('node:path').resolve(__dirname,'..'),env:{...process.env,PORT:String(port)}});
  t.after(()=>server.kill());
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(new Error('Server exited '+code)));});
  for(const path of ['/','/?mode=sb','/bess-settings.js']){const r=await fetch(`http://localhost:${port}${path}`);assert.equal(r.status,200,path);assert.ok((await r.text()).length>100);}
  const r=await fetch(`http://localhost:${port}/api/rss?url=https://127.0.0.1/rss`);assert.equal(r.status,400);
});
