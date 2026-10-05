process.env.NEWSLETTER_ASSET_BASE_URL = 'https://newsletter.example.com';
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
test('RSS retains paragraphs, takeaways, and exact category priority',()=>{assert.equal(items.length,6);assert.equal(items[0].paragraphs.length,2);assert.equal(items[0].takeaways.length,3);assert.equal(items[1].section,'MARKETS & TENDERS');assert.equal(items[3].section,'POLICY, GRID & REGULATION');assert.ok(!items[0].tag.includes('NL'));});
test('three tiers render once per story with correct copy and no signal images',()=>{const {html,stats}=C.buildNewsletter(edition(),S);assert.equal(stats.stories,6);assert.equal(stats.features,2);assert.equal(stats.fileName,'BN_3Oct2026.html');assert.match(html,/Hero paragraph one/);assert.match(html,/Hero paragraph two/);assert.match(html,/Feature two copy/);const signals=html.split('Quick Signals')[1].split('watt-bytes-logo.jpeg')[0].split('<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"')[0];assert.ok(!signals.includes('<img'));items.forEach(s=>assert.equal((html.match(new RegExp('>'+s.title+'<','g'))||[]).length,1));assert.match(html,/\$\[USER:UNSUB_LINK\]\$/);});
test('duplicate features and lead cannot also render as signals',()=>{const e=edition();e.features[1].story=e.features[0].story;const r=C.buildNewsletter(e,S);assert.equal(r.stats.features,1);assert.equal(r.stats.stories,6);e.features[0].story=e.lead.story;assert.equal(C.buildNewsletter(e,S).stats.features,1);});
test('ad slots appear in both publications, disabled and incomplete slots disappear',()=>{for(const settings of [S,solar]){const e=edition();e.ads={top:{enabled:true,image:'https://example.com/ad.jpg',url:'https://example.com',label:'Test sponsor'},middle:{enabled:false,image:'https://example.com/hidden.jpg',url:'https://example.com'},bottom:{enabled:true,image:'javascript:bad',url:'https://example.com'}};const {html}=C.buildNewsletter(e,settings);assert.match(html,/Test sponsor/);assert.ok(!html.includes('hidden.jpg'));assert.ok(!html.includes('javascript:bad'));assert.equal((html.match(/Advertisement/g)||[]).length,1);}});
test('URLs, HTML, and Unicode survive safely',()=>{const e=edition();e.lead.story={...items[0],title:'<script>alert(1)</script> – ₹',link:'javascript:alert(1)',image:'data:text/html,bad'};const {html}=C.buildNewsletter(e,S);assert.ok(!html.includes('<script>'));assert.ok(!html.includes('javascript:'));assert.ok(!html.includes('data:text/html'));assert.match(html,/&#8377;/);assert.equal(U.safeUrl('https://example.com'),'https://example.com/');});
test('proxy rejects arbitrary hosts and private destinations',()=>{const {allowed}=require('../api/rss');for(const u of ['http://bessnews.com/rss','https://localhost/rss','https://127.0.0.1/rss','https://bessnews.com.evil.com/rss','https://user:pass@bessnews.com/rss','https://bessnews.com:444/rss'])assert.equal(allowed(u),false);assert.equal(allowed('https://bessnews.com/rss'),true);});
test('Railway server uses assigned port, serves both tabs, passes healthcheck and shuts down cleanly',async t=>{
  const {spawn}=require('node:child_process');
  const config=JSON.parse(fs.readFileSync(__dirname+'/../railway.json','utf8'));
  const [runtime,...startArgs]=config.deploy.startCommand.split(' ');
  assert.equal(runtime,'node');
  const server=spawn(process.execPath,startArgs,{cwd:require('node:path').resolve(__dirname,'..'),env:{...process.env,PORT:'0'}});
  t.after(()=>server.kill());
  const ready=await new Promise((resolve,reject)=>{server.stdout.once('data',data=>resolve(String(data)));server.once('error',reject);server.once('exit',code=>reject(new Error('Server exited '+code)));});
  const port=Number(/0\.0\.0\.0:(\d+)/.exec(ready)[1]);
  const health=await fetch(`http://localhost:${port}${config.deploy.healthcheckPath}`);
  assert.equal(health.status,200);
  assert.deepEqual(await health.json(),{status:'ok'});
  assert.equal(health.headers.get('cache-control'),'no-store');
  const head=await fetch(`http://localhost:${port}${config.deploy.healthcheckPath}`,{method:'HEAD'});
  assert.equal(head.status,200);assert.equal(await head.text(),'');
  for(const path of ['/','/?mode=sb','/bess-settings.js','/assets/bessnews-logo.jpeg','/assets/solarbytes-logo.jpeg','/assets/watt-bytes-logo.jpeg']){const r=await fetch(`http://localhost:${port}${path}`);assert.equal(r.status,200,path);assert.ok((await r.text()).length>100);}
  const r=await fetch(`http://localhost:${port}/api/rss?url=https://127.0.0.1/rss`);assert.equal(r.status,400);
  await r.text();
  const closed=new Promise(resolve=>server.once('exit',(code,signal)=>resolve({code,signal})));
  server.kill('SIGTERM');
  assert.deepEqual(await closed,{code:0,signal:null});
});

test('exact BESS parent headers and all child tag pills follow supplied taxonomy',()=>{
  const headers=['PROJECTS & DEPLOYMENTS','MARKETS & TENDERS','POLICY, GRID & REGULATION','TECHNOLOGY & SYSTEM DESIGN','FINANCE, DEALS & M&A','REGIONAL INTELLIGENCE'];
  assert.deepEqual(S.sections.map(s=>s.name),headers);
  for(const section of S.sections) for(const tag of section.tags){
    const story=C.classify(['NL',section.parent,tag],S);
    assert.equal(story.section,section.name);
    assert.equal(story.tag,tag);
    assert.equal(story.pick,true);
  }
  assert.equal(C.classify(['Deployments'],S).section,'MARKETS & TENDERS');
  assert.equal(C.classify(['Grid-Scale','Technology','EMS & Software'],S).section,'TECHNOLOGY & SYSTEM DESIGN');
});

test('correct BESS feed and publication/header plus shared footer logos use absolute URLs',()=>{
  assert.equal(S.feedUrl,'https://bessnews.com/api/v1/collections/nl.rss');
  for(const settings of [S,solar]){
    const {html}=C.buildNewsletter(edition(),{...settings,assetBaseUrl:'https://newsletters.example.org'});
    assert.match(html,new RegExp('https://newsletters.example.org'+settings.brand.logoPath));
    assert.match(html,/https:\/\/newsletters.example.org\/assets\/watt-bytes-logo.jpeg/);
    assert.ok(html.indexOf(settings.brand.logoPath)<html.lastIndexOf('Today sample'));
    assert.ok(html.indexOf('watt-bytes-logo.jpeg')>html.indexOf('Quick Signals') || settings.mode!=='bess');
  }
});
test('SolarBytes and BESSNEWS own distinct header and footer identities',()=>{
  assert.equal(solar.brand.name,'SolarBytes');
  assert.equal(solar.brand.logoFirst+solar.brand.logoAccent,'SolarBytes');
  assert.notDeepEqual(solar.footer,S.footer);
  const sb=C.buildNewsletter(edition(),solar).html;
  const bn=C.buildNewsletter(edition(),S).html;
  assert.match(sb,/Solar<span[^>]*>Bytes/);
  assert.match(sb,/Solar News/);
  assert.match(sb,/Bite-sized solar news/);
  assert.ok(!sb.includes('Dedicated to utility, industrial'));
  assert.match(bn,/Everything Energy Storage/);
  assert.match(bn,/Dedicated to utility, industrial/);
  assert.ok(!bn.includes('Bite-sized solar news'));
  assert.ok(!bn.includes('Read the latest solar news'));
  assert.ok(!sb.includes('Read the latest energy storage intelligence'));
  for(const output of [sb,bn])assert.match(output,/watt-bytes-logo.jpeg/);
});

test('publication logos sit inside compact headers rather than a separate banner row',()=>{
  for(const settings of [solar,S]){
    const html=C.buildNewsletter(edition(),settings).html;
    const marker=`data-publication-header="${settings.mode || 'sb'}"`;
    const headerStart=html.indexOf(marker);
    const logoStart=html.indexOf(settings.brand.logoPath);
    assert.ok(headerStart>=0 && logoStart>headerStart);
    assert.ok(logoStart<html.lastIndexOf('Today sample'));
    assert.equal(html.split(settings.brand.logoPath).length-1,1);
    assert.match(U.publicationLogo(settings),/width="64" height="64"/);
    assert.ok(!U.publicationLogo(settings).includes('<tr>'));
  }
});
