/*
 * SOLARbytes RSS -> newsletter data.
 * Pure string processing so it runs in the browser (window.SBConverter)
 * and in Node (require('./converter')) for the CLI.
 */
(function (root) {
  'use strict';

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getSettings = () => root.SBSettings || require('./settings');
  const getTemplate = () => root.SBTemplate || require('./template');

  // ---------- text helpers ----------

  function stripCdata(s) {
    const m = /^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/.exec(s || '');
    return m ? m[1] : s || '';
  }

  const NAMED = {
    nbsp: ' ', quot: '"', apos: "'", lt: '<', gt: '>', amp: '&',
    rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', sbquo: '‚', bdquo: '„',
    ndash: '–', mdash: '—', hellip: '…', bull: '•', middot: '·',
    deg: '°', times: '×', euro: '€', pound: '£', copy: '©', reg: '®', trade: '™',
    prime: '′', Prime: '″', laquo: '«', raquo: '»', shy: '',
  };

  // Decodes repeatedly, because the feed sometimes double-encodes ("&amp;rsquo;").
  function decodeEntities(s) {
    let out = String(s || '');
    for (let pass = 0; pass < 3 && /&(?:#\d+|#x[0-9a-f]+|[a-z]+);/i.test(out); pass++) {
      out = out.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (m, e) => {
        if (e[0] === '#') {
          const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1);
          return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
        }
        return Object.prototype.hasOwnProperty.call(NAMED, e) ? NAMED[e] : m;
      });
    }
    return out;
  }

  // Emoji can't be shown reliably in email, and feeds sometimes carry an emoji
  // that was already lost upstream as "?" + an invisible variation selector
  // (e.g. "Conference - Online ?️"). Both are removed. When something was
  // removed, the spaced " - " separator left behind is dropped too, so that
  // title becomes "Conference Online". (C) (R) TM are kept.
  const LOST_EMOJI = /\?[︎️‍⃣]+|�/g;
  const EMOJI = /(?![©®™])\p{Extended_Pictographic}(?:[︎️‍⃣]|\p{Emoji_Modifier}|\p{Extended_Pictographic})*/gu;
  const INVISIBLE = /[︎️​-‍⁠⃣]/g;

  function cleanText(s) {
    let removed = false;
    const hit = () => ((removed = true), ' ');
    s = String(s || '').replace(LOST_EMOJI, hit).replace(EMOJI, hit).replace(INVISIBLE, '');
    if (removed) s = s.replace(/\s+[-–—]\s+/g, ' ').replace(/\s+[-–—:|]\s*$/, '');
    return s.replace(/[ \t]{2,}/g, ' ').replace(/ +([,.;:!?])/g, '$1').trim();
  }

  // Every non-ASCII character as a numeric entity (’ -> &#8217;) so no email
  // tool can turn it into "?" because of a charset mismatch.
  function asciiSafe(html) {
    return String(html).replace(/[^\x00-\x7F]/gu, (ch) => '&#' + ch.codePointAt(0) + ';');
  }

  function textOf(html) {
    return cleanText(
      decodeEntities(String(html || '').replace(/<[^>]*>/g, ' '))
        .replace(/\s+/g, ' ')
        .replace(/\s+([,.;:])/g, '$1')
    );
  }

  function tag(xml, name) {
    const m = new RegExp('<' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + name + '>').exec(xml);
    return m ? stripCdata(m[1]) : '';
  }

  function tags(xml, name) {
    const re = new RegExp('<' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + name + '>', 'g');
    return [...xml.matchAll(re)].map((m) => stripCdata(m[1]));
  }

  function attr(xml, tagName, attrName) {
    const m = new RegExp('<' + tagName + '\\s[^>]*?' + attrName + '="([^"]*)"').exec(xml);
    return m ? decodeEntities(m[1]) : '';
  }

  // First `max` characters, cut at a sentence end when possible, else at a word.
  function shorten(text, max) {
    text = String(text || '').trim();
    if (text.length <= max) return text;
    const cut = text.slice(0, max);
    const sentence = cut.match(/^[\s\S]*[.!?](?=\s)/);
    if (sentence && sentence[0].length > max * 0.45) return sentence[0];
    return cut.replace(/\s+\S*$/, '').replace(/[,;:\s]+$/, '') + '…';
  }

  // ---------- images ----------

  // Publive CDN URLs carry the size in the path (".../fit-in/1280x960/solarbytes/...").
  // Replacing it with "WxH" returns an image cropped to exactly that size, which
  // keeps thumbnails tidy in email clients that ignore CSS object-fit.
  function sizedImage(url, size) {
    url = String(url || '').trim();
    if (!url || !size) return url;
    const m = /^(https?:\/\/img-cdn\.publive\.online\/)(?:fit-in\/)?(?:\d+x\d+\/)?(?:filters:[^/]*\/)?(.*)$/i.exec(url);
    return m ? `${m[1]}${size.width}x${size.height}/${m[2]}` : url;
  }

  // ---------- classification ----------

  const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

  // "Policy" -> "Policy Bytes" so tags read consistently.
  function tagLabel(cat) {
    return /bytes$/i.test(cat) ? cat : cat + ' Bytes';
  }

  function classify(categories, S) {
    S = S || getSettings();
    const cats = categories.map(norm);
    const section = S.sections.find((s) => s.match.some((m) => cats.includes(norm(m))));
    const hidden = new Set(S.hiddenCategories.map(norm));
    const regional = new Set(
      S.sections.filter((s) => !/tech|bess/i.test(s.name)).flatMap((s) => s.match.map(norm))
    );
    // Story tag: the first topical category (not a region, not hidden). Falls
    // back to the category that placed the story in its section.
    let tagCat = categories.find((c) => !hidden.has(norm(c)) && !regional.has(norm(c)));
    if (!tagCat && section) tagCat = categories.find((c) => section.match.map(norm).includes(norm(c)));
    return {
      section: section ? section.name : S.fallbackSection,
      tag: tagCat ? tagLabel(tagCat) : 'News Bytes',
      pick: categories.some((c) => norm(c) === norm(S.pickCategory)),
    };
  }

  // ---------- RSS parsing ----------

  function parseRss(xml, S) {
    S = S || getSettings();
    xml = String(xml || '');
    if (!/<rss[\s>]/.test(xml) || !/<item[\s>]/.test(xml)) {
      throw new Error('This does not look like an RSS feed (no <rss> / <item> found).');
    }
    const channel = xml.split(/<item[\s>]/)[0];
    const items = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/g)].map((m, i) => {
      const it = m[1];
      const categories = tags(it, 'category').map(textOf).filter(Boolean);
      const descHtml = tag(it, 'description');
      const firstP = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(descHtml);
      const pub = new Date(textOf(tag(it, 'pubDate')));
      const link = textOf(tag(it, 'link')) || textOf(tag(it, 'guid'));
      return Object.assign(
        {
          id: link || 'item-' + i,
          title: textOf(tag(it, 'title')),
          link,
          pubDate: isNaN(pub) ? '' : pub.toISOString(),
          author: textOf(tag(it, 'dc:creator')),
          categories,
          image:
            attr(it, 'media:content', 'url') ||
            attr(it, 'media:thumbnail', 'url') ||
            attr(descHtml, 'img', 'src') ||
            attr(it, 'enclosure', 'url'),
          summary: textOf(firstP ? firstP[1] : descHtml),
        },
        classify(categories, S)
      );
    });
    return { title: textOf(tag(channel, 'title')), items };
  }

  // Default selection: stories tagged as newsletter picks. If there are none,
  // everything published in the 24 hours before the newest story.
  function defaultSelection(items) {
    const picks = items.filter((i) => i.pick);
    if (picks.length) return picks.map((i) => i.id);
    const times = items.map((i) => Date.parse(i.pubDate)).filter((t) => !isNaN(t));
    if (!times.length) return items.slice(0, 8).map((i) => i.id);
    const newest = Math.max(...times);
    return items.filter((i) => newest - Date.parse(i.pubDate) <= 864e5).map((i) => i.id);
  }

  // ---------- dates ----------

  function longDate(d) {
    return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  function shortDate(d) {
    return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
  }

  // "SB_1Oct2026.html"
  function fileName(d) {
    return `SB_${d.getDate()}${MONTHS[d.getMonth()].slice(0, 3)}${d.getFullYear()}.html`;
  }

  // ---------- bullets ----------

  // One bullet per line. Leading "-", "*", "•" or "1." markers are dropped.
  // "Label: text" renders the label in bold.
  function parseBullets(text) {
    return String(text || '')
      .split(/\r?\n/)
      .map((l) => l.replace(/^\s*(?:[-*•‣▪]|\d+[.)])\s*/, '').trim())
      .filter(Boolean)
      .map((l) => {
        const m = /^([^:]{2,40}):\s+(.+)$/.exec(l);
        return m ? { label: m[1].trim(), text: m[2].trim() } : { label: '', text: l };
      });
  }

  // ---------- build ----------

  /**
   * @param {object} edition
   *   date: Date, issue: string, today: string,
   *   lead:      { enabled, story, bullets: string (one per line) }
   *   sponsored: { enabled, title, text, url, cta, image }
   *   metric:    { enabled, value, text, url, cta }
   *   stories:   [{ id, title, link, image, summary, tag, section }]
   * @returns {{ html: string, stats: object }}
   */
  function buildNewsletter(edition, S) {
    S = S || getSettings();
    const date = edition.date instanceof Date && !isNaN(edition.date) ? edition.date : new Date();
    const lead = edition.lead && edition.lead.enabled && edition.lead.story ? edition.lead : null;
    const leadId = lead ? lead.story.id || lead.story.link : null;
    const stories = (edition.stories || []).filter((s) => !leadId || (s.id || s.link) !== leadId);

    // Group into sections in the configured order. Unknown section names go last.
    const order = S.sections.map((s) => s.name);
    const groups = [];
    for (const story of stories) {
      let g = groups.find((x) => x.name === story.section);
      if (!g) groups.push((g = { name: story.section, items: [] }));
      g.items.push(story);
    }
    const rank = (n) => (order.includes(n) ? order.indexOf(n) : order.length);
    groups.sort((a, b) => rank(a.name) - rank(b.name));
    groups.forEach((g) => {
      const conf = S.sections.find((s) => s.name === g.name);
      g.pill = conf && conf.pill === 'amber' ? 'amber' : 'slate';
    });

    const sponsored = edition.sponsored && edition.sponsored.enabled ? edition.sponsored : null;
    const metric =
      edition.metric && edition.metric.enabled && String(edition.metric.value || '').trim() ? edition.metric : null;

    const html = asciiSafe(getTemplate().page(
      {
        dateLong: longDate(date),
        dateShort: shortDate(date),
        year: date.getFullYear(),
        issue: String(edition.issue || '').trim(),
        today: String(edition.today || '').trim(),
        lead: lead && { story: lead.story, bullets: parseBullets(lead.bullets) },
        sponsored,
        metric,
        groups,
      },
      S,
      { sizedImage, shorten }
    ));

    return {
      html,
      stats: {
        stories: stories.length + (lead ? 1 : 0),
        sections: groups.map((g) => `${g.name} (${g.items.length})`),
        lead: !!lead,
        sponsored: !!sponsored,
        metric: !!metric,
        dateLabel: shortDate(date),
        fileName: fileName(date),
      },
    };
  }

  const api = {
    parseRss, classify, defaultSelection, buildNewsletter, parseBullets, cleanText, asciiSafe,
    sizedImage, shorten, longDate, shortDate, fileName,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SBConverter = api;
})(typeof window !== 'undefined' ? window : globalThis);
