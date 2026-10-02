(function(root) {
  'use strict';
  const solar = root.SBSettings || require('./settings');
  const S = JSON.parse(JSON.stringify(solar));
  S.mode = 'bess';
  S.brand = { ...solar.brand, name:'BESSNEWS', logoFirst:'BESS', logoAccent:'NEWS', title:'BESSNews Executive Briefing', siteUrl:'https://bessnews.com' };
  S.feedUrl = 'https://bessnews.com/rss';
  S.colors = {...solar.colors, ink:'#0a192f', accent:'#10b981', accentDark:'#059669', pillBg:'#ecfdf5', pillText:'#065f46', pillLine:'#a7f3d0'};
  S.sections = [
    {name:'Projects & Deployments', match:['Projects','Projects & Deployments','Deployments','Utility','Grid-Scale','Commercial','Data Centers','EV Charging','Microgrids','Off-Grid']},
    {name:'Markets & Tenders', match:['Markets','Markets & Tenders','Market Outlook','Outlook','Power Markets','Open Tenders','Awarded','Supply Chain']},
    {name:'Policy, Grid & Regulation', match:['Policy','Policy & Regulation','Government','Grid','Regulation','EU Battery','Grid Interconnection','National','US & IRA']},
    {name:'Technology & Manufacturing', match:['Technology','Technology & Manufacturing','Tech','Chemistry','Manufacturing','Fire Safety','Components','System Design','Co-location']},
    {name:'Finance & Business', match:['Finance','Finance & Business','Business','Finance, Business & Raw Materials','Contracts','Expansion','Leadership','Strategy','Capital Raise','Infrastructure','M&A','Investments','Raw Materials']},
    {name:'Regional & Global Signals', match:['Global','Asia Pacific','Asia-Pacific','Europe','Latin America','Middle East','North America','Africa','India','China','Australia']}
  ];
  S.fallbackSection = 'Regional & Global Signals';
  S.labels = {...solar.labels, lead:'Hero Cover Story', leadCta:'Read Full Project Analysis', storyCta:'Read Brief', metric:'Storage Pricing Index', sponsoredSub:'Partner Spotlight'};
  S.images = {...solar.images, hero:{width:1240,height:560}, feature:{width:1240,height:440}};
  S.footer = {...solar.footer, reason:'You received this daily brief because you subscribed to BESSNEWS.', helpfulUrl:'https://bessnews.com',notForMeUrl:'https://bessnews.com',channels:[{label:'Search Archives',url:'https://bessnews.com'}]};
  if (typeof module !== 'undefined' && module.exports) module.exports = S; else root.BESSSettings = S;
})(typeof window !== 'undefined' ? window : globalThis);
