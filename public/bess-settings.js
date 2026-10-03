(function(root) {
  'use strict';
  const solar = root.SBSettings || require('./settings');
  const S = JSON.parse(JSON.stringify(solar));
  S.mode = 'bess';
  S.brand = {
    name:'BESSNEWS', logoPath:'/assets/bessnews-logo.jpeg',
    publisherLogoPath:'/assets/watt-bytes-logo.jpeg',
    logoFirst:'BESS', logoAccent:'NEWS', title:'BESSNEWS Executive Briefing',
    tagline:'Everything Energy Storage • Global Intelligence',
    siteUrl:'https://bessnews.com', publisher:'Wat(t) Bytes Media Pvt. Ltd.',
    sister:[{label:'BESSNEWS.com',url:'https://bessnews.com'}]
  };
  S.feedUrl = 'https://bessnews.com/api/v1/collections/nl.rss';
  S.colors = {...solar.colors, ink:'#0a192f', accent:'#10b981', accentDark:'#059669', pillBg:'#ecfdf5', pillText:'#065f46', pillLine:'#a7f3d0'};
  // Exact newsletter taxonomy from the supplied category table.
  // Parent aliases support existing feeds; child categories become tag pills.
  S.sections = [
    {name:'PROJECTS & DEPLOYMENTS', parent:'Projects', parents:['Projects'], tags:['Utility','Grid-Scale','Commercial','Data Centers','EV Charging','Microgrids','Off-Grid','Residential','Under Development']},
    {name:'MARKETS & TENDERS', parent:'Markets / Tender', parents:['Markets / Tender','Markets / Tenders','Markets','Tenders'], tags:['Deployments','Outlook','Power Markets','Supply Chain','Open Tenders','Awarded','By Country']},
    {name:'POLICY, GRID & REGULATION', parent:'Policy', parents:['Policy','Policy & Regulation'], tags:['Government','Grid','Regulation','EU Battery','Grid Interconnection','National','US & IRA']},
    {name:'TECHNOLOGY & SYSTEM DESIGN', parent:'Technology', parents:['Technology','Tech'], tags:['Chemistry','Manufacturing','Fire Safety','Components','System Design','Co-location','EMS & Software']},
    {name:'FINANCE, DEALS & M&A', parent:'Business & Finance', parents:['Business & Finance','Business & Financial','Business & Financials','Business','Finance'], tags:['Contracts','Expansion','Leadership','Strategy','Capital Raise','Infrastructure','M&A','Venture','Corporate','Hybrid Solar+BESS','Utility PPA']},
    {name:'REGIONAL INTELLIGENCE', parent:'Regional Parent', parents:['Regional Parent','Regional','Global'], tags:['Asia Pacific','Europe','Latin America','Middle East','North America']}
  ];
  S.sections.forEach(s => { s.match = [...s.parents, ...s.tags]; });
  S.fallbackSection = 'REGIONAL INTELLIGENCE';
  S.sectionAliases = {
    'Projects & Deployments':'PROJECTS & DEPLOYMENTS',
    'Markets & Tenders':'MARKETS & TENDERS',
    'Policy, Grid & Regulation':'POLICY, GRID & REGULATION',
    'Technology & Manufacturing':'TECHNOLOGY & SYSTEM DESIGN',
    'Finance & Business':'FINANCE, DEALS & M&A',
    'Regional & Global Signals':'REGIONAL INTELLIGENCE'
  };
  S.labels = {...solar.labels, lead:'Hero Cover Story', leadCta:'Read Full Project Analysis', storyCta:'Read Brief', metric:'Storage Pricing Index', sponsoredSub:'Partner Spotlight'};
  S.images = {...solar.images, hero:{width:1240,height:560}, feature:{width:1240,height:440}};
  S.footer = {
    title:'BESSNEWS Executive Briefing',
    description:'Dedicated to utility, industrial, and commercial battery energy storage intelligence.',
    channels:[{label:'Read the latest energy storage intelligence',url:'https://bessnews.com',strong:true}],
    reason:'You received this executive briefing because you subscribed to BESSNEWS.',
    unsubscribeUrl:'$[USER:UNSUB_LINK]$',
    preferencesUrl:'$[USER:PREFERENCES_LINK]$'
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = S; else root.BESSSettings = S;
})(typeof window !== 'undefined' ? window : globalThis);
