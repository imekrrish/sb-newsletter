(function () {
  'use strict';

  const S = window.SBSettings;
  const C = window.SBConverter;
  const esc = window.SBTemplate.esc;
  const $ = (id) => document.getElementById(id);

  const DRAFT_KEY = S.mode === 'sb' ? 'sb-newsletter-draft-v1' : 'bess-newsletter-draft-v2';
  const SENT_KEY = S.mode === 'sb' ? 'sb-newsletter-last-sent-v1' : 'bess-newsletter-last-sent-v2';
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* storage blocked */ } },
    del(k) { try { localStorage.removeItem(k); } catch (_) { /* storage blocked */ } },
  };

  const form = $('form');
  const fileInput = $('rssFile');
  const drop = $('drop');
  const list = $('stories');
  const resultBtns = ['copyBtn', 'openBtn', 'downloadBtn'].map($);

  let source = 'url';
  let items = [];               // parsed feed items, feed order
  let selected = new Set();     // ids of included stories
  let overrides = {};           // id -> { title, summary, tag, section, image }
  let featureIds = ['', ''];
  let leadId = '';
  let metricLink = '';          // story id, '__custom' or ''
  let pending = null;           // selection restored from a saved draft, applied after feed load
  let lastHtml = '';
  let lastStats = null;
  const openEditors = new Set();

  // ---------- status + toast ----------

  function setStatus(text, kind) {
    const s = $('status');
    s.textContent = text;
    s.className = 'status ' + (kind || '');
  }

  let toastTimer;
  function toast(text, kind) {
    const t = $('toast');
    t.textContent = text;
    t.className = 'toast show ' + (kind || '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.className = 'toast'), kind === 'err' ? 5000 : 2500);
  }

  // ---------- dates ----------

  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // The digest goes out the morning after the feed is built, so default to tomorrow.
  function defaultDate() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return ymd(d);
  }

  // ---------- draft persistence ----------

  const saveables = () => [...document.querySelectorAll('[data-save]')];

  function draft() {
    const fields = {};
    saveables().forEach((el) => (fields[el.id] = el.type === 'checkbox' ? el.checked : el.value));
    return { date: $('nlDate').value, fields, selected: [...selected], overrides, leadId, metricLink, featureIds, items };
  }

  let saveTimer;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => store.set(DRAFT_KEY, draft()), 300);
  }

  // Copy that changes every day. Cleared when a new edition starts.
  const DAILY = ['today', 'bullets', 'mValue', 'mText', 'mUrl', 'heroP1','heroP2','f1Paragraph','f2Paragraph','f1Bullets','f2Bullets'];

  function restore() {
    $('rssUrl').value = S.feedUrl;
    const d = store.get(DRAFT_KEY);
    const current = d && d.date && d.date >= ymd(new Date());
    if (d && d.fields) {
      saveables().forEach((el) => {
        if (!(el.id in d.fields)) return;
        if (!current && DAILY.includes(el.id)) return;
        if (el.type === 'checkbox') el.checked = !!d.fields[el.id];
        else el.value = d.fields[el.id];
      });
    }
    $('nlDate').value = current ? d.date : defaultDate();
    if (current) {
      pending = { selected: d.selected || [], leadId: d.leadId || '', metricLink: d.metricLink || '' };
      overrides = d.overrides || {};
      featureIds = d.featureIds || ['', ''];
      items = (d.items || []).map(it => ({...it,...C.classify(it.categories || [],S)}));
      if(S.mode==='bess') Object.values(overrides).forEach(o => {if(o.section) o.section=S.sectionAliases[o.section] || o.section;});
      selected = new Set((d.selected || []).filter(id => items.some(i => i.id === id)));
      leadId = d.leadId || '';
    } else {
      // New edition: suggest the next issue number after the last download.
      const sent = store.get(SENT_KEY);
      if (sent && /^\d+$/.test(String(sent.issue)) && sent.date < $('nlDate').value) {
        $('issue').value = String(+sent.issue + 1);
      }
    }
    if (!$('rssUrl').value) $('rssUrl').value = S.feedUrl;
    $('todayCount').textContent = $('today').value.length;
    syncToggles();
    syncImagePreview($('spImage'), $('spImagePrev'));
  }

  // ---------- toggles ----------

  function syncToggles() {
    document.querySelectorAll('.when[data-when]').forEach((w) => w.classList.toggle('off', !$(w.dataset.when).checked));
  }

  // ---------- feed source ----------

  function setSource(src) {
    source = src;
    document.querySelectorAll('[data-src]').forEach((b) => b.classList.toggle('active', b.dataset.src === src));
    document.querySelector('.src-url').hidden = src !== 'url';
    document.querySelector('.src-file').hidden = src !== 'file';
  }
  document.querySelectorAll('[data-src]').forEach((b) => b.addEventListener('click', () => setSource(b.dataset.src)));

  function showFile() {
    const f = fileInput.files[0];
    drop.classList.toggle('has-file', !!f);
    $('dropText').innerHTML = f
      ? `<b>${esc(f.name)}</b> · ${(f.size / 1024).toFixed(0)} KB`
      : 'Drop the <b>.rss</b> file here or <u>browse</u>';
  }
  fileInput.addEventListener('change', showFile);
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.add('over')));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove('over')));

  async function loadRss() {
    if (source === 'file') {
      const file = fileInput.files[0];
      if (!file) throw new Error('Choose an RSS file first.');
      return file.text();
    }
    const url = $('rssUrl').value.trim();
    if (!url) throw new Error('Enter an RSS URL.');
    // Prefer the local proxy (avoids CORS). Fall back to a direct fetch.
    let res;
    try {
      res = await fetch('/api/rss?url=' + encodeURIComponent(url));
      if (res.status === 404) throw new Error('no proxy');
    } catch (_) {
      res = await fetch(url).catch(() => {
        throw new Error('Could not fetch the RSS URL. Start the app with "npm start", or upload the .rss file.');
      });
    }
    const text = await res.text();
    if (!res.ok) throw new Error('RSS fetch failed: ' + (text || res.status));
    return text;
  }

  $('loadBtn').addEventListener('click', async () => {
    const btn = $('loadBtn');
    btn.disabled = true;
    btn.classList.add('loading');
    btn.querySelector('.btn-label').textContent = 'Loading…';
    setStatus(source === 'url' ? 'Fetching feed…' : 'Reading file…', 'busy');
    try {
      const feed = C.parseRss(await loadRss(), S);
      if (!feed.items.length) throw new Error('The feed has no stories.');
      items = feed.items;
      const ids = new Set(items.map((i) => i.id));

      // Keep a saved selection for this edition when its stories are still in the feed.
      const saved = pending && pending.selected.filter((id) => ids.has(id));
      if (pending && Array.isArray(pending.selected)) {
        selected = new Set(saved);
        leadId = ids.has(pending.leadId) ? pending.leadId : '';
        metricLink = pending.metricLink === '__custom' || ids.has(pending.metricLink) ? pending.metricLink : '';
      } else {
        selected = new Set(C.defaultSelection(items));
        leadId = '';
      }
      pending = null;
      if(S.mode==='bess') {
        if(!$('heroP1').value && !$('heroP2').value) fillStoryCopy(effectiveLeadId(),'hero');
        const candidates = selectedStories().filter(s=>s.id!==effectiveLeadId());
        [0,1].forEach(i=>{if(!featureIds[i] && candidates[i]){featureIds[i]=candidates[i].id;fillStoryCopy(featureIds[i],'f'+(i+1));}});
      }
      save();
      $('filterWrap').hidden = false;
      renderStories();
      build();
      const picks = items.filter((i) => i.pick).length;
      toast(`Loaded ${items.length} stories${picks ? `, ${picks} tagged ${S.pickCategory}` : ''}`, 'ok');
      btn.querySelector('.btn-label').textContent = 'Reload stories';
    } catch (err) {
      setStatus('Error', 'err');
      toast(err.message || String(err), 'err');
      btn.querySelector('.btn-label').textContent = items.length ? 'Reload stories' : 'Load stories';
    } finally {
      btn.disabled = false;
      btn.classList.remove('loading');
    }
  });

  // ---------- stories ----------

  const story = (id) => {
    const it = items.find((i) => i.id === id);
    return it ? Object.assign({}, it, overrides[id] || {}) : null;
  };
  const selectedStories = () => items.filter((i) => selected.has(i.id)).map((i) => story(i.id));

  function fmtTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  function thumbSrc(url) {
    return C.sizedImage(String(url || '').trim() || S.images.fallback, { width: 128, height: 96 });
  }

  function editorHtml(s) {
    const sectionOpts = S.sections
      .map((x) => x.name)
      .concat(S.sections.some((x) => x.name === s.section) ? [] : [s.section])
      .map((n) => `<option${n === s.section ? ' selected' : ''}>${esc(n)}</option>`)
      .join('');
    return `
      <div class="st-editor">
        <label class="lbl">Title</label>
        <input class="ta" data-field="title" value="${esc(s.title)}">
        <label class="lbl">Summary <span class="muted">${S.mode === 'bess' ? '· two-line Quick Signal' : '· trimmed for the email'}</span></label>
        <textarea class="ta" rows="3" data-field="summary">${esc(s.summary)}</textarea>
        <div class="row">
          <div><label class="lbl">Tag</label><input class="ta" data-field="tag" value="${esc(s.tag)}"></div>
          <div><label class="lbl">Section</label><select class="ta" data-field="section">${sectionOpts}</select></div>
        </div>
        <label class="lbl">Image URL</label>
        <div class="img-field">
          <img class="img-prev" src="${esc(thumbSrc(s.image))}" alt="">
          <input class="ta" type="url" data-field="image" value="${esc(s.image)}" placeholder="${esc(S.images.fallback)}">
        </div>
        ${overrides[s.id] ? '<button type="button" class="link-btn" data-act="revert">Revert to feed version</button>' : ''}
      </div>`;
  }

  function storyHtml(it) {
    const s = story(it.id);
    const on = selected.has(it.id);
    const isLead = $('leadOn').checked && on && it.id === effectiveLeadId();
    const open = openEditors.has(it.id);
    return `
      <li class="story${on ? ' on' : ''}${isLead ? ' is-lead' : ''}" data-id="${esc(it.id)}">
        <div class="st-row">
          <input type="checkbox" data-act="toggle"${on ? ' checked' : ''} aria-label="Include story">
          <img class="st-thumb" src="${esc(thumbSrc(s.image))}" alt="" loading="lazy">
          <div>
            <div class="st-title" data-act="toggle-title">${esc(s.title)}</div>
            <div class="st-meta">
              ${isLead ? '<span class="badge lead">Lead</span>' : ''}
              ${it.pick ? `<span class="badge nl">${esc(S.pickCategory)}</span>` : ''}
              ${overrides[it.id] ? '<span class="badge edited">Edited</span>' : ''}
              <span>${esc(s.section)}</span>·<span>${esc(s.tag)}</span>·<span>${esc(fmtTime(it.pubDate))}</span>
            </div>
          </div>
          <button type="button" class="st-edit-btn${open ? ' open' : ''}" data-act="edit">${open ? 'Close' : 'Edit'}</button>
        </div>
        ${open ? editorHtml(s) : ''}
      </li>`;
  }

  function renderStories() {
    const q = $('filter').value.trim().toLowerCase();
    const shown = items.filter((it) => {
      if (!q) return true;
      const s = story(it.id);
      return [s.title, s.section, s.tag].join(' ').toLowerCase().includes(q);
    });
    list.innerHTML = shown.length
      ? shown.map(storyHtml).join('')
      : `<li class="stories-empty">${items.length ? 'No stories match the filter.' : 'Load the feed to pick stories.'}</li>`;
    $('selCount').textContent = items.length ? `${selected.size} of ${items.length} selected` : 'No feed loaded';
    renderLeadOptions();
    renderFeatureOptions();
    renderMetricOptions();
  }

  // Re-render one row without losing focus in other rows.
  function rerenderRow(id) {
    const li = list.querySelector(`li[data-id="${CSS.escape(id)}"]`);
    if (li) li.outerHTML = storyHtml(items.find((i) => i.id === id));
  }

  function effectiveLeadId() {
    if (leadId && selected.has(leadId)) return leadId;
    const first = items.find((i) => selected.has(i.id));
    return first ? first.id : '';
  }

  const shortTitle = (t) => (t.length > 70 ? t.slice(0, 68) + '…' : t);

  function renderLeadOptions() {
    const sel = $('leadStory');
    const stories = selectedStories();
    const lid = effectiveLeadId();
    sel.innerHTML = stories.length
      ? stories.map((s) => `<option value="${esc(s.id)}"${s.id === lid ? ' selected' : ''}>${esc(shortTitle(s.title))}</option>`).join('')
      : `<option value="">${items.length ? 'Select stories below first' : 'Load stories first'}</option>`;
  }

  
  function renderFeatureOptions() {
    const candidates = selectedStories().filter(s => !$('leadOn').checked || s.id !== effectiveLeadId());
    for(let i=0;i<2;i++) {
      const sel = $('f'+(i+1)+'Story');
      if(!candidates.some(s=>s.id === featureIds[i])) featureIds[i]='';
      sel.innerHTML='<option value="">Choose a feature…</option>'+candidates.map(s=>`<option value="${esc(s.id)}">${esc(shortTitle(s.title))}</option>`).join('');
      sel.value=featureIds[i];
    }
  }
  function fillStoryCopy(id, prefix) {
    const s=story(id); if(!s)return;
    if(prefix==='hero') {
      $('heroP1').value=(s.paragraphs || [])[0] || s.summary || '';
      $('heroP2').value=(s.paragraphs || [])[1] || '';
      $('bullets').value=(s.takeaways || []).join('\n');
    } else {
      $(prefix+'Paragraph').value=s.summary || '';
      $(prefix+'Bullets').value=(s.takeaways || []).slice(0,2).join('\n');
    }
  }
  [1,2].forEach(n=>$('f'+n+'Story').addEventListener('change', e=> {
    featureIds[n-1]=e.target.value;
    if(featureIds[n-1] && featureIds[n-1]===featureIds[2-n]) { featureIds[2-n]=''; toast('A story can appear in only one feature slot.'); }
    fillStoryCopy(e.target.value,'f'+n); renderFeatureOptions(); changed();
  }));

  function renderMetricOptions() {
    const sel = $('mLink');
    const opts = ['<option value="">No link</option>']
      .concat(selectedStories().map((s) => `<option value="${esc(s.id)}">${esc(shortTitle(s.title))}</option>`))
      .concat('<option value="__custom">Custom URL…</option>');
    sel.innerHTML = opts.join('');
    if (metricLink && metricLink !== '__custom' && !selected.has(metricLink)) metricLink = '';
    sel.value = metricLink;
    $('mUrl').hidden = metricLink !== '__custom';
  }

  list.addEventListener('click', (e) => {
    const li = e.target.closest('li[data-id]');
    if (!li) return;
    const previousLead = effectiveLeadId();
    const id = li.dataset.id;
    const act = e.target.closest('[data-act]');
    if (!act) return;
    switch (act.dataset.act) {
      case 'toggle':
      case 'toggle-title':
        if (selected.has(id)) selected.delete(id);
        else selected.add(id);
        if (!selected.has(leadId)) leadId = '';
        if(S.mode==='bess' && previousLead!==effectiveLeadId()) fillStoryCopy(effectiveLeadId(),'hero');
        renderStories();
        break;
      case 'edit':
        if (openEditors.has(id)) openEditors.delete(id);
        else openEditors.add(id);
        rerenderRow(id);
        return;
      case 'revert':
        delete overrides[id];
        rerenderRow(id);
        break;
      default:
        return;
    }
    changed();
  });

  // Prevent the checkbox click from also firing the native toggle twice.
  list.addEventListener('change', (e) => {
    if (e.target.matches('input[data-act="toggle"]')) e.stopPropagation();
  });

  list.addEventListener('input', (e) => {
    const field = e.target.dataset.field;
    if (!field) return;
    const id = e.target.closest('li[data-id]').dataset.id;
    const it = items.find((i) => i.id === id);
    const o = Object.assign({}, overrides[id]);
    if (e.target.value === it[field]) delete o[field];
    else o[field] = e.target.value;
    if (Object.keys(o).length) overrides[id] = o;
    else delete overrides[id];

    // Light updates in place, full row refresh only on blur (keeps typing smooth).
    const li = e.target.closest('li');
    if (field === 'title') li.querySelector('.st-title').textContent = e.target.value;
    if (field === 'image') {
      const src = thumbSrc(e.target.value);
      li.querySelector('.st-thumb').src = src;
      li.querySelector('.img-prev').src = src;
    }
    changed();
  });

  list.addEventListener('focusout', (e) => {
    if (!e.target.dataset.field) return;
    const li = e.target.closest('li[data-id]');
    // Defer so a click on another field in the same row still lands.
    setTimeout(() => {
      if (li.isConnected && !li.contains(document.activeElement)) {
        rerenderRow(li.dataset.id);
        renderLeadOptions();
        renderMetricOptions();
      }
    }, 0);
  });

  $('filter').addEventListener('input', renderStories);

  document.querySelectorAll('[data-quick]').forEach((b) =>
    b.addEventListener('click', () => {
      if (!items.length) return toast('Load stories first', 'err');
      const mode = b.dataset.quick;
      if (mode === 'all') selected = new Set(items.map((i) => i.id));
      else if (mode === 'none') selected = new Set();
      else if (mode === 'picks') {
        const picks = items.filter((i) => i.pick).map((i) => i.id);
        if (!picks.length) toast(`No stories are tagged ${S.pickCategory} in this feed`, 'err');
        selected = new Set(picks);
      } else if (mode === 'day') {
        selected = new Set(C.defaultSelection(items.map((i) => Object.assign({}, i, { pick: false }))));
      }
      renderStories();
      changed();
    })
  );

  $('leadStory').addEventListener('change', (e) => {
    leadId = e.target.value;
    fillStoryCopy(leadId,'hero');
    renderStories();
  });

  $('mLink').addEventListener('change', (e) => {
    metricLink = e.target.value;
    $('mUrl').hidden = metricLink !== '__custom';
    if (metricLink === '__custom') $('mUrl').focus();
  });

  // ---------- form ----------

  function syncImagePreview(input, img) {
    const v = input.value.trim();
    img.hidden = !v;
    if (v) img.src = v;
  }
  $('spImage').addEventListener('input', () => syncImagePreview($('spImage'), $('spImagePrev')));
  $('today').addEventListener('input', (e) => ($('todayCount').textContent = e.target.value.length));
  $('leadOn').addEventListener('change', () => renderStories());
  form.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox' && e.target.id) syncToggles();
  });

  let buildTimer;
  function changed() {
    save();
    clearTimeout(buildTimer);
    buildTimer = setTimeout(build, 250);
  }
  form.addEventListener('input', (e) => {
    if (!list.contains(e.target)) changed();
  });
  form.addEventListener('change', (e) => {
    if (!list.contains(e.target)) changed();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!items.length) return $('loadBtn').click();
    build();
    toast('Preview refreshed', 'ok');
  });

  $('resetBtn').addEventListener('click', () => {
    if (!confirm('Clear this edition? Summary, bullets, metric, story picks and story edits will be reset.')) return;
    store.del(DRAFT_KEY);
    form.reset();
    DAILY.forEach((id) => ($(id).value = ''));
    overrides = {};
    featureIds = ['', ''];
    leadId = '';
    metricLink = '';
    openEditors.clear();
    $('rssUrl').value = S.feedUrl;
    $('nlDate').value = defaultDate();
    fileInput.value = '';
    showFile();
    setSource('url');
    syncToggles();
    syncImagePreview($('spImage'), $('spImagePrev'));
    $('todayCount').textContent = '0';
    if (items.length) selected = new Set(C.defaultSelection(items));
    renderStories();
    build();
    setStatus('Ready');
  });

  // ---------- build ----------

  function edition() {
    const metricUrl = metricLink === '__custom' ? $('mUrl').value.trim() : metricLink ? (story(metricLink) || {}).link : '';
    const lid = effectiveLeadId();
    return {
      date: $('nlDate').value ? new Date($('nlDate').value + 'T12:00:00') : new Date(),
      issue: $('issue').value,
      today: $('today').value,
      lead: { enabled: $('leadOn').checked && !!lid, story: lid ? story(lid) : null, bullets: $('bullets').value, paragraph1:$('heroP1').value, paragraph2:$('heroP2').value },
      features: [1,2].map(n=>({enabled:$('f'+n+'On').checked, story:story(featureIds[n-1]), paragraph:$('f'+n+'Paragraph').value, bullets:$('f'+n+'Bullets').value})),
      ads: Object.fromEntries(['top','middle','bottom'].map(k=>[k,{enabled:$('ad'+k+'On').checked,image:$('ad'+k+'Image').value.trim(),url:$('ad'+k+'Url').value.trim(),label:$('ad'+k+'Label').value.trim()}])),
      sponsored: {
        enabled: $('spOn').checked,
        title: $('spTitle').value.trim(),
        text: $('spText').value.trim(),
        url: $('spUrl').value.trim(),
        cta: $('spCta').value.trim() || 'Learn more',
        image: $('spImage').value.trim(),
      },
      metric: {
        enabled: $('mOn').checked,
        value: $('mValue').value.trim(),
        text: $('mText').value.trim(),
        url: metricUrl,
        cta: $('mCta').value.trim() || S.labels.metricCta,
      },
      stories: selectedStories(),
    };
  }

  function renderStats(st) {
    const chips = [`<span class="chip main">${st.stories} stories</span>`]
      .concat(st.lead ? ['<span class="chip">Lead</span>'] : [])
      .concat(st.sponsored ? ['<span class="chip">Sponsored</span>'] : [])
      .concat(st.metric ? ['<span class="chip">Metric</span>'] : [])
      .concat(st.sections.map((s) => `<span class="chip">${esc(s)}</span>`));
    $('stats').innerHTML = chips.join('');
  }

  function build() {
    if (!items.length) return;
    try {
      const ed = edition();
      const { html, stats } = C.buildNewsletter(ed, S);
      lastHtml = html;
      lastStats = stats;
      renderStats(stats);

      // Keep the preview's scroll position while it re-renders.
      const frame = $('preview');
      let y = 0;
      try { y = frame.contentWindow ? frame.contentWindow.scrollY : 0; } catch (_) { /* not ready */ }
      frame.onload = () => { try { frame.contentWindow.scrollTo(0, y); } catch (_) { /* ignore */ } };
      frame.srcdoc = html;
      frame.hidden = false;
      $('empty').hidden = true;
      resultBtns.forEach((b) => (b.disabled = false));

      const warn = [];
      if (!stats.stories) warn.push('no stories selected');
      if(S.mode==='bess' && ed.lead.enabled && (!ed.lead.paragraph1.trim() || !ed.lead.paragraph2.trim())) warn.push('hero needs two paragraphs');
      if(S.mode==='bess' && ed.lead.enabled && !C.parseBullets(ed.lead.bullets).length) warn.push('hero highlights are empty');
      if(S.mode==='bess') ed.features.forEach((f,i)=> { if(f.enabled && !f.story)warn.push('choose feature '+(i+1)); else if(f.enabled && !f.paragraph.trim()) warn.push('feature '+(i+1)+' needs a paragraph'); else if(f.enabled && C.parseBullets(f.bullets).length!==2) warn.push('feature '+(i+1)+' needs two bullets'); });
      Object.entries(ed.ads).forEach(([k,a])=> {if(a.enabled && (!window.NLCommon.safeUrl(a.image,'') || !window.NLCommon.safeUrl(a.url,'')))warn.push(k+' ad needs valid image and link URLs');});
      if ($('mOn').checked && !ed.metric.value) warn.push('metric is empty');
      if ($('spOn').checked && !ed.sponsored.text && !ed.sponsored.title) warn.push('sponsored is empty');
      setStatus(warn.length ? 'Check: ' + warn.join(', ') : 'Ready · ' + stats.dateLabel, warn.length ? 'busy' : 'ok');
    } catch (err) {
      setStatus('Error', 'err');
      resultBtns.forEach(b=>b.disabled=true);
      toast(err.message || String(err), 'err');
    }
  }

  // ---------- preview + result actions ----------

  document.querySelectorAll('[data-view]').forEach((b) =>
    b.addEventListener('click', () => {
      document.querySelectorAll('[data-view]').forEach((x) => x.classList.toggle('active', x === b));
      document.querySelector('.pv-stage').classList.toggle('mobile', b.dataset.view === 'mobile');
    })
  );

  const htmlBlob = () => new Blob([lastHtml], { type: 'text/html;charset=utf-8' });

  function markSent() {
    store.set(SENT_KEY, { issue: $('issue').value.trim().replace(/^#/, ''), date: $('nlDate').value });
  }

  $('downloadBtn').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(htmlBlob());
    a.download = lastStats.fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    markSent();
    toast('Downloaded ' + lastStats.fileName, 'ok');
  });

  $('copyBtn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(lastHtml);
      markSent();
      toast('HTML copied to clipboard', 'ok');
    } catch (_) {
      toast('Copy failed. Use Download instead.', 'err');
    }
  });

  $('openBtn').addEventListener('click', () => window.open(URL.createObjectURL(htmlBlob()), '_blank'));

  // ---------- start ----------

  restore();
  if(items.length){$('filterWrap').hidden=false;renderStories();build();}
  // Load the default feed straight away so the editor opens on today's stories.
  if (location.protocol.startsWith('http')) $('loadBtn').click();
})();

