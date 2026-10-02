// Command-line build:
//   node cli.js <feed.rss | https://…> [out.html] [--edition edition.json]
//                [--date YYYY-MM-DD] [--issue 142] [--today "text"]
//
// Without --edition, the stories tagged "NL" in the feed are used and the first
// one becomes The Lead Byte. See edition.example.json for every option.
const fs = require('fs');
const path = require('path');
const C = require('./public/converter');

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args.splice(i, 2)[1] : undefined;
};
const mode = opt('--mode') || 'sb';
if(!['bess','sb'].includes(mode)) throw new Error('Mode must be bess or sb');
const S = require(mode === 'bess' ? './public/bess-settings' : './public/settings');
const editionFile = opt('--edition');
const flags = { date: opt('--date'), issue: opt('--issue'), today: opt('--today') };
const [input, output] = args;

if (!input) {
  console.error('Usage: node cli.js <feed.rss | URL> [out.html] [--edition edition.json] [--date YYYY-MM-DD] [--issue N] [--today "text"]');
  process.exit(1);
}

async function readFeed(src) {
  if (/^https?:\/\//i.test(src)) {
    const r = await fetch(src, { headers: { 'User-Agent': 'Mozilla/5.0 (SOLARbytes Newsletter Generator)' } });
    if (!r.ok) throw new Error(`Feed responded ${r.status}`);
    return r.text();
  }
  return fs.readFileSync(src, 'utf8');
}

(async () => {
  const feed = C.parseRss(await readFeed(input),S);
  const ed = editionFile ? JSON.parse(fs.readFileSync(editionFile, 'utf8')) : {};
  Object.keys(flags).forEach((k) => flags[k] !== undefined && (ed[k] = flags[k]));

  const byLink = new Map(feed.items.map((i) => [i.link, i]));
  const ids = ed.stories && ed.stories.length ? ed.stories : C.defaultSelection(feed.items);
  const pick = (ref) => (typeof ref === 'string' ? byLink.get(ref) || feed.items.find((i) => i.id === ref) : Object.assign({}, byLink.get(ref.link), ref));
  const stories = ids.map(pick).filter(Boolean);
  const missing = ids.length - stories.length;

  const leadConf = ed.lead || {};
  const leadEnabled = leadConf.enabled !== false && stories.length > 0;
  const leadStory = leadEnabled ? (leadConf.link ? pick(leadConf.link) : stories[0]) : null;

  const { html, stats } = C.buildNewsletter({
    date: ed.date ? new Date(ed.date + 'T12:00:00') : new Date(),
    issue: ed.issue,
    today: ed.today,
    lead: { enabled: !!leadStory, story: leadStory, bullets: [].concat(leadConf.bullets || leadStory?.takeaways || []).join('\n'), paragraph1:leadConf.paragraph1 || leadStory?.paragraphs?.[0] || leadStory?.summary,paragraph2:leadConf.paragraph2 || leadStory?.paragraphs?.[1] },
    features: (ed.features || stories.slice(1,3).map(s=>({link:s.link,enabled:true}))).map(f=>({...f,enabled:f.enabled!==false,story:pick(f.link),bullets:[].concat(f.bullets || pick(f.link)?.takeaways?.slice(0,2) || []).join('\n')})),
    ads: ed.ads,
    sponsored: ed.sponsored,
    metric: ed.metric,
    stories,
  }, S);

  const out = output || stats.fileName;
  fs.writeFileSync(out, html);
  console.log(`Wrote ${path.resolve(out)}`);
  console.log(`  ${stats.stories} stories${stats.lead ? ' (incl. lead)' : ''} · ${stats.sections.join(', ')}`);
  if (missing) console.warn(`  ${missing} story link(s) from the edition file were not in the feed.`);
})().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});

