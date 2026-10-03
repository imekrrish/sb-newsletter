/*
 * SOLARbytes Daily Digest email template.
 * Refined from the reference nl_sb_9.html: table layout for Outlook, exact-size
 * CDN images, hidden preheader, and every repeated block generated from data.
 */
(function (root) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Merge tags such as $[USER:UNSUB_LINK]$ must reach the ESP untouched.
  const U = root.NLCommon || require('./common');
  const href = (u) => esc(U.safeUrl(u));

  const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  function page(d, S, h) {
    const C = S.colors;
    const L = S.labels;
    const B = S.brand;
    const F = S.footer;
    const IMG = S.images;

    const isCdn = (u) => /img-cdn\.publive\.online\//i.test(u || '');
    const imageFor = (story) => String((story && story.image) || '').trim() || IMG.fallback;

    // <img> sized for email: exact-size CDN crops scale with height:auto,
    // other hosts fall back to a fixed box with object-fit.
    function img(url, size, w, hgt, alt, cls, extra) {
      const src = U.safeUrl(h.sizedImage(url, size), '');
      const box = isCdn(src) ? 'height: auto;' : `height: ${hgt}px; object-fit: cover;`;
      return `<img src="${esc(src)}" alt="${esc(alt)}" width="${w}" height="${hgt}" class="${cls}" style="display: block; width: ${w === 600 ? '100%' : w + 'px'}; max-width: ${w}px; ${box} border: 0; outline: none; text-decoration: none; ${extra || ''}">`;
    }

    function pill(text, style) {
      const amber = style !== 'slate';
      const bg = amber ? C.pillBg : '#f1f5f9';
      const fg = amber ? C.pillText : C.ink;
      const bd = amber ? C.pillLine : C.line;
      return `<span style="display: inline-block; background-color: ${bg}; color: ${fg}; border: 1px solid ${bd}; font-size: 10px; line-height: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 7px; border-radius: 4px;">${esc(text)}</span>`;
    }

    // ---------- header ----------

    const header = `
          <tr>
            <td data-publication-header="sb" bgcolor="${C.ink}" style="background-color: ${C.ink}; padding: 14px 20px; border-bottom: 3px solid ${C.accent};" class="px">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="64" valign="middle" style="padding-right:12px">${U.publicationLogo(S)}</td>
                  <td><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td class="stack" valign="middle" style="font-family: ${FONT};">
                    <a href="${href(B.siteUrl)}" target="_blank" style="text-decoration: none; font-size: 22px; line-height: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">${esc(B.logoFirst)}<span style="color: ${C.accent};">${esc(B.logoAccent)}</span></a><div style="font-size:11px;line-height:17px;color:#fbbf24;margin-top:4px">${esc(B.tagline)}</div>${
                      d.issue
                        ? `
                    <span style="display: inline-block; background-color: #1e293b; color: #f8fafc; font-size: 10px; line-height: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; padding: 3px 8px; border-radius: 4px; margin-left: 10px; vertical-align: middle;">Issue #${esc(d.issue.replace(/^#/, ''))}</span>`
                        : ''
                    }
                  </td>
                  <td class="stack stack-gap" align="right" valign="middle" style="font-family: ${FONT}; color: #94a3b8; font-size: 12px; line-height: 18px; font-weight: 500; white-space: nowrap;">
                    ${esc(d.dateLong)}
                  </td>
                  </tr></table></td>
                </tr>
              </table>
            </td>
          </tr>`;

    const today = d.today
      ? `
          <tr>
            <td bgcolor="${C.canvas}" class="px" style="background-color: ${C.canvas}; border-bottom: 1px solid ${C.line}; padding: 11px 24px; font-family: ${FONT}; font-size: 13px; line-height: 20px; color: #475569;">
              <strong style="color: ${C.ink};">${esc(L.today)}</strong> ${esc(d.today).replace(/\r?\n/g, '<br>')}
            </td>
          </tr>`
      : '';

    // ---------- the lead byte ----------

    let lead = '';
    if (d.lead) {
      const s = d.lead.story;
      const bullets = d.lead.bullets.length
        ? `
                <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 0 0 16px 0;">
                  <tr>
                    <td bgcolor="${C.canvas}" style="background-color: ${C.canvas}; border-left: 3px solid ${C.accent}; padding: 10px 14px; border-radius: 0 4px 4px 0;">
                      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">${d.lead.bullets
                        .map(
                          (b) => `
                        <tr>
                          <td width="14" valign="top" style="font-family: ${FONT}; font-size: 13px; line-height: 20px; color: ${C.accentDark}; font-weight: 700;">&bull;</td>
                          <td valign="top" style="font-family: ${FONT}; font-size: 13px; line-height: 20px; color: #1e293b; padding-bottom: 2px;">${b.label ? `<strong>${esc(b.label)}:</strong> ` : ''}${esc(b.text)}</td>
                        </tr>`
                        )
                        .join('')}
                      </table>
                    </td>
                  </tr>
                </table>`
        : '';
      lead = `
          <tr>
            <td bgcolor="#ffffff" style="background-color: #ffffff; border-bottom: 3px solid ${C.accent}; font-size: 0; line-height: 0;">
              <a href="${href(s.link)}" target="_blank" style="text-decoration: none; display: block;">
                ${img(imageFor(s), IMG.hero, 600, 260, s.title, 'hero-img')}
              </a>
            </td>
          </tr>
          <tr>
            <td class="px" bgcolor="#ffffff" style="background-color: #ffffff; padding: 22px 24px 22px 24px; font-family: ${FONT};">
              <div style="margin: 0 0 10px 0;">${pill(`${L.lead} • ${s.tag || ''}`.replace(/ • $/, ''), 'amber')}</div>
              <h1 class="lead-title" style="margin: 0 0 10px 0; font-family: ${FONT}; font-size: 21px; line-height: 28px; color: ${C.ink}; font-weight: 800; letter-spacing: -0.2px;">
                <a href="${href(s.link)}" target="_blank" style="color: ${C.ink}; text-decoration: none;">${esc(s.title)}</a>
              </h1>
              ${s.summary ? `<p style="margin: 0 0 16px 0; font-size: 14px; line-height: 22px; color: ${C.body};">${esc(h.shorten(s.summary, 460))}</p>` : ''}${bullets}
              <a href="${href(s.link)}" target="_blank" style="font-size: 13px; line-height: 18px; font-weight: 700; color: ${C.accentDark}; text-decoration: none;">${esc(L.leadCta)} &rarr;</a>
            </td>
          </tr>`;
    }

    // ---------- sponsored ----------

    let sponsored = '';
    if (d.sponsored) {
      const sp = d.sponsored;
      const spImg = String(sp.image || '').trim();
      const body = `
                    <div style="font-size: 10px; line-height: 14px; font-weight: 700; text-transform: uppercase; color: #854d0e; letter-spacing: 0.6px; margin: 0 0 5px 0;">${esc(L.sponsored)} &bull; ${esc(L.sponsoredSub)}</div>
                    <p style="margin: 0 0 7px 0; font-size: 13px; line-height: 20px; color: #713f12;">${sp.title ? `<strong>${esc(sp.title)}${sp.text ? ':' : ''}</strong> ` : ''}${esc(sp.text || '')}</p>
                    ${sp.url ? `<a href="${href(sp.url)}" target="_blank" style="font-size: 12px; line-height: 18px; font-weight: 700; color: #b45309; text-decoration: none;">${esc(sp.cta || 'Learn more')} &rarr;</a>` : ''}`;
      sponsored = `
          <tr>
            <td class="px" bgcolor="#fefce8" style="background-color: #fefce8; border-top: 1px solid #fef08a; border-bottom: 1px solid #fef08a; padding: 16px 24px; font-family: ${FONT};">
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>${
                  spImg
                    ? `
                  <td class="thumb-col" width="90" valign="top" style="padding-right: 14px;">
                    <a href="${href(sp.url)}" target="_blank">${img(spImg, IMG.sponsor, 90, 72, sp.title || L.sponsored, 'thumb-img', 'border-radius: 6px; border: 1px solid #fde68a;')}</a>
                  </td>`
                    : ''
                }
                  <td valign="top" style="font-family: ${FONT};">${body}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
    }

    // ---------- sections ----------

    function storyRow(s, pillStyle, first) {
      return `
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td colspan="2" style="${first ? 'padding-top: 0;' : `padding-top: 14px; border-top: 1px solid #f1f5f9;`} font-size: 0; line-height: 0;">&nbsp;</td>
                </tr>
                <tr>
                  <td class="thumb-col" width="90" valign="top" style="padding-right: 14px;">
                    <a href="${href(s.link)}" target="_blank">${img(imageFor(s), IMG.thumb, 90, 72, s.title, 'thumb-img', `border-radius: 6px; border: 1px solid ${C.line};`)}</a>
                  </td>
                  <td valign="top" style="font-family: ${FONT};">
                    ${s.tag ? `<div style="margin: 0 0 4px 0;">${pill(s.tag, pillStyle)}</div>` : ''}
                    <div class="story-title" style="font-size: 14px; line-height: 20px; font-weight: 700; color: ${C.ink}; margin: 0 0 3px 0;">
                      <a href="${href(s.link)}" target="_blank" style="color: ${C.ink}; text-decoration: none;">${esc(s.title)}</a>
                    </div>
                    <div style="font-size: 13px; line-height: 19px; color: ${C.body};">
                      ${esc(h.shorten(s.summary, 190))}
                      <a href="${href(s.link)}" target="_blank" style="color: ${C.accentDark}; text-decoration: none; font-weight: 700; font-size: 12px; white-space: nowrap;">&nbsp;${esc(L.storyCta)}&nbsp;&rarr;</a>
                    </div>
                  </td>
                </tr>
              </table>
              <div style="height: 2px; line-height: 2px; font-size: 2px;">&nbsp;</div>`;
    }

    const sections = d.groups
      .map(
        (g, gi) => `
          <tr>
            <td class="px" bgcolor="#ffffff" style="background-color: #ffffff; padding: 20px 24px ${gi === d.groups.length - 1 ? '22px' : '18px'} 24px; ${gi < d.groups.length - 1 ? `border-bottom: 1px solid ${C.line};` : ''}">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 0 14px 0;">
                <tr>
                  <td style="font-family: ${FONT}; font-size: 12px; line-height: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; color: ${C.ink}; border-bottom: 2px solid ${C.accent}; padding: 0 0 4px 0;">${esc(g.name)}</td>
                </tr>
              </table>${g.items.map((s, i) => storyRow(s, g.pill, i === 0)).join('')}
            </td>
          </tr>`
      )
      .join('');

    // ---------- metric of the day ----------

    const metric = d.metric
      ? `
          <tr>
            <td class="px" bgcolor="${C.ink}" align="center" style="background-color: ${C.ink}; padding: 26px 24px; text-align: center; font-family: ${FONT};">
              <div style="font-size: 10px; line-height: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${C.accent}; margin: 0 0 6px 0;">${esc(L.metric)}</div>
              <div class="stat-number" style="font-size: 38px; line-height: 44px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin: 0 0 8px 0;">${esc(d.metric.value)}</div>
              ${d.metric.text ? `<p style="font-size: 13px; line-height: 20px; color: #94a3b8; margin: 0 auto ${d.metric.url ? '14px' : '0'} auto; max-width: 440px;">${esc(d.metric.text)}</p>` : ''}
              ${
                d.metric.url
                  ? `<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td style="border: 1px solid ${C.accent}; border-radius: 4px; padding: 7px 14px;">
                    <a href="${href(d.metric.url)}" target="_blank" style="font-size: 12px; line-height: 16px; font-weight: 700; color: ${C.accent}; text-decoration: none;">${esc(d.metric.cta || L.metricCta)} &rarr;</a>
                  </td>
                </tr>
              </table>`
                  : ''
              }
            </td>
          </tr>`
      : '';

    // ---------- footer ----------

    const btn = (url, label) =>
      `<a href="${href(url)}" target="_blank" style="display: inline-block; color: ${C.ink}; text-decoration: none; font-weight: 600; padding: 3px 9px; background-color: ${C.line}; border-radius: 4px;">${esc(label)}</a>`;

    const footer = `
          <tr>
            <td class="px" bgcolor="${C.canvas}" align="center" style="background-color: ${C.canvas}; border-top: 1px solid ${C.line}; padding: 22px 24px; text-align: center; font-family: ${FONT}; font-size: 12px; line-height: 19px; color: ${C.muted};">
              ${U.publisherLogo(S)}
              <div style="font-size:15px;font-weight:700;color:${C.ink};margin-bottom:6px">${esc(F.title)}</div>
              <p style="margin:0 0 14px;color:${C.body}">${esc(F.description)}</p>
              <p style="margin: 0 0 14px 0; color: ${C.body};">${esc(F.feedbackQuestion)}&nbsp; ${btn(F.helpfulUrl, 'Helpful')}&nbsp; ${btn(F.notForMeUrl, 'Not for me')}</p>
              <p style="margin: 0 0 12px 0;">${F.channels
                .map(
                  (c) =>
                    `<a href="${href(c.url)}" target="_blank" style="color: ${c.strong ? C.accentDark : '#475569'}; text-decoration: none; font-weight: ${c.strong ? 600 : 500};">${esc(c.label)}</a>`
                )
                .join(' &bull; ')}</p>
              <p style="margin: 0 0 12px 0;">Published daily by <strong>${esc(B.publisher)}</strong><br><a href="${href(B.siteUrl)}" style="color:${C.accentDark};text-decoration:none">${esc(B.name)}</a></p>
              <p style="margin: 0; font-size: 11px; line-height: 17px; color: #94a3b8;">${esc(F.reason)}<br>
                <a href="${href(F.unsubscribeUrl)}" style="color: ${C.muted}; text-decoration: underline;">Unsubscribe</a> &bull;
                <a href="${href(F.preferencesUrl)}" style="color: ${C.muted}; text-decoration: underline;">Update Preferences</a><br>
                &copy; ${d.year} ${esc(B.name)}. All rights reserved.
              </p>
            </td>
          </tr>`;

    // Hidden inbox preview text, padded so clients don't pull in body copy.
    const preheader = esc(d.today || (d.lead ? d.lead.story.title : B.title));

    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${esc(B.title)} | ${esc(d.dateShort)}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <style>table, td, div, p, a, span, h1 { font-family: Arial, Helvetica, sans-serif !important; }</style>
  <![endif]-->
  <style>
    body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: ${C.canvas}; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    u + #body a { color: inherit; text-decoration: none; }

    @media screen and (max-width: 620px) {
      .main-table { width: 100% !important; border-radius: 0 !important; border-left: 0 !important; border-right: 0 !important; }
      .outer-pad { padding: 0 !important; }
      .px { padding-left: 16px !important; padding-right: 16px !important; }
      .hero-img { width: 100% !important; height: auto !important; }
      .thumb-col { width: 76px !important; padding-right: 12px !important; }
      .thumb-img { width: 76px !important; height: 61px !important; }
      .lead-title { font-size: 19px !important; line-height: 26px !important; }
      .story-title { font-size: 14px !important; line-height: 19px !important; }
      .stat-number { font-size: 32px !important; line-height: 38px !important; }
    }
    @media screen and (max-width: 440px) {
      .stack { display: block !important; width: 100% !important; text-align: left !important; }
      .stack-gap { padding-top: 6px !important; }
    }
  </style>
</head>
<body id="body" style="margin: 0; padding: 0; background-color: ${C.canvas};">
  <div style="display: none; max-height: 0; max-width: 0; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: ${C.canvas}; opacity: 0;">${preheader}${'&#8199;&#847; '.repeat(60)}</div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="${C.canvas}" style="background-color: ${C.canvas};">
    <tr>
      <td align="center" class="outer-pad" style="padding: 24px 0;">
        <!--[if mso]><table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0" align="center"><tr><td><![endif]-->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="main-table" bgcolor="#ffffff" style="width: 600px; max-width: 600px; background-color: #ffffff; border: 1px solid ${C.line}; border-radius: 8px; border-collapse: separate; overflow: hidden; margin: 0 auto;">
${header}${today}${U.ad(d.ads.top,600)}${lead}${sponsored}${U.ad(d.ads.middle,600)}${sections}${metric}${U.ad(d.ads.bottom,600)}${footer}
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  const api = { page, esc };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SBTemplate = api;
})(typeof window !== 'undefined' ? window : globalThis);

