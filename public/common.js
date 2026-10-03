(function(root) {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  function safeUrl(value, fallback = '#') {
    const s = String(value || '').trim();
    if (/^\$\[[^\r\n<>]+\]\$$/.test(s)) return s;
    try { const u = new URL(s); return /^https?:$/.test(u.protocol) ? u.href : fallback; } catch { return fallback; }
  }
  function ad(slot, width = 620) {
    if (!slot || !slot.enabled || safeUrl(slot.image, '') === '' || safeUrl(slot.url, '') === '') return '';
    return `<tr><td align="center" bgcolor="#f1f5f9" style="padding:14px 20px;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;font-family:Arial,sans-serif"><div style="font-size:9px;line-height:14px;text-transform:uppercase;letter-spacing:.8px;color:#64748b;margin-bottom:6px">Advertisement &bull; ${esc(slot.label || 'Sponsor')}</div><a href="${esc(safeUrl(slot.url))}" target="_blank" rel="noopener"><img src="${esc(safeUrl(slot.image,''))}" alt="${esc(slot.alt || slot.label || 'Sponsor advertisement')}" width="${width-40}" style="display:block;width:100%;max-width:${width-40}px;height:auto;border:0;border-radius:4px"></a></td></tr>`;
  }
  function assetUrl(path, S) {
    const base = S.assetBaseUrl || root.location?.origin || (typeof process !== 'undefined' && process.env.NEWSLETTER_ASSET_BASE_URL);
    if (!safeUrl(base, '')) throw new Error('Set a public asset base URL (CLI: --asset-base-url https://your-deployment-domain).');
    return new URL(path, base).href;
  }
  function publicationLogo(S) {
    if(!S.brand.logoPath) return '';
    return `<a href="${esc(safeUrl(S.brand.siteUrl))}" target="_blank"><img src="${esc(assetUrl(S.brand.logoPath,S))}" alt="${esc(S.brand.name)} logo" width="64" height="64" style="display:block;width:64px;height:64px;border:0;background:#ffffff;border-radius:6px"></a>`;
  }
  function publisherLogo(S) {
    if(!S.brand.publisherLogoPath)return '';
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:0 0 14px"><img src="${esc(assetUrl(S.brand.publisherLogoPath,S))}" alt="Wat(t) Bytes Media Pvt. Ltd. logo" width="220" height="75" style="display:block;width:220px;max-width:100%;height:auto;border:0;margin:0 auto;background:#ffffff"></td></tr></table>`;
  }
  const api = { esc, safeUrl, ad, assetUrl, publicationLogo, publisherLogo };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.NLCommon = api;
})(typeof window !== 'undefined' ? window : globalThis);
