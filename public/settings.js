/*
 * SolarBytes newsletter settings — brand, sections, links and image sizes.
 * Edit this file to change anything that is the same in every edition.
 * Loaded in the browser (window.SBSettings) and in Node (require('./settings')).
 */
(function (root) {
  'use strict';

  const settings = {
    brand: {
      name: 'SolarBytes',
      logoPath: '/assets/solarbytes-logo.jpeg',
      publisherLogoPath: '/assets/watt-bytes-logo.jpeg',
      // Logo is drawn as text: <first><accent>
      logoFirst: 'Solar',
      logoAccent: 'Bytes',
      title: 'SolarBytes Daily Digest',
      tagline: 'Solar News – Bite Sized',
      siteUrl: 'https://solarbytes.info',
      publisher: 'Wat(t) Bytes Media Pvt. Ltd.',
      sister: [
        { label: 'SolarBytes.info', url: 'https://solarbytes.info' },
        
      ],
    },

    feedUrl: 'https://solarbytes.info/rss',

    colors: {
      ink: '#0f172a',        // header, headings, metric band
      body: '#334155',
      muted: '#64748b',
      line: '#e2e8f0',
      canvas: '#f8fafc',
      accent: '#f59e0b',     // amber rules and highlights
      accentDark: '#d97706', // links
      pillBg: '#fef3c7',
      pillText: '#92400e',
      pillLine: '#fde68a',
    },

    // Section order in the email. A story goes into the first section whose
    // `match` list contains one of its feed categories. `pill: 'amber'` gives the
    // story tags the amber style, anything else uses the neutral slate style.
    sections: [
      { name: 'India Bytes', match: ['India Bytes'], pill: 'amber' },
      { name: 'Europe, Middle East & Africa Bytes', match: ['EMEA Bytes', 'Europe Bytes', 'Middle East Bytes', 'Africa Bytes'] },
      { name: 'Americas Bytes', match: ['America Bytes', 'Americas Bytes', 'US Bytes', 'LatAm Bytes'] },
      { name: 'Asia-Pacific Bytes', match: ['China Bytes', 'Australia Bytes', 'Asia Bytes', 'APAC Bytes'] },
      { name: 'Technology & BESS Bytes', match: ['Tech Bytes', 'BESS Bytes', 'R & D Bytes', 'R&D Bytes'], pill: 'amber' },
      { name: 'Global Bytes', match: ['Global Bytes'] },
    ],
    // Used when no section matches.
    fallbackSection: 'Global Bytes',

    // Feed categories that are never shown as the story tag.
    hiddenCategories: ['NL'],
    // Category that marks a story as a newsletter pick (pre-selected on load).
    pickCategory: 'NL',

    // Image sizes requested from the Publive CDN (2x the displayed size for
    // sharp images on retina screens). Other image hosts are used as-is.
    images: {
      hero: { width: 1200, height: 520 },
      thumb: { width: 180, height: 144 },
      sponsor: { width: 180, height: 144 },
      // Used when a story has no image.
      fallback: 'https://images.pexels.com/photos/9875441/pexels-photo-9875441.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },

    labels: {
      today: 'Today:',
      lead: 'The Lead Byte',
      leadCta: 'Read full breakdown',
      storyCta: 'Read',
      sponsored: 'Sponsored Byte',
      sponsoredSub: 'Partner Content',
      metric: 'Metric of the Day',
      metricCta: 'Go to story',
    },

    footer: {
      title: 'SolarBytes Daily Digest',
      description: 'Bite-sized solar news, technology updates and market developments from around the world.',
      feedbackQuestion: 'Was this edition useful?',
      helpfulUrl: 'https://solarbytes.info',
      notForMeUrl: 'https://solarbytes.info',
      channels: [{ label: 'Read the latest solar news', url: 'https://solarbytes.info', strong: true }],
      reason: 'You received this daily brief because you subscribed to SolarBytes.',
      // Zoho Campaigns merge tags, replaced when the campaign is sent.
      unsubscribeUrl: '$[USER:UNSUB_LINK]$',
      preferencesUrl: '$[USER:PREFERENCES_LINK]$',
    },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = settings;
  else root.SBSettings = settings;
})(typeof window !== 'undefined' ? window : globalThis);

