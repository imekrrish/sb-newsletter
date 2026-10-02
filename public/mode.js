(function() {
  const solar = window.SBSettings;
  const bess = new URLSearchParams(location.search).get('mode') === 'bess';
  window.SBSettings = bess ? window.BESSSettings : {...solar, mode:'sb'};
  document.documentElement.dataset.mode = bess ? 'bess' : 'sb';
  document.title = bess ? 'BESSNEWS Newsletter Studio' : 'SOLARbytes Newsletter Studio';
  document.querySelector('.logo').textContent = bess ? 'BN' : 'SB';
  document.querySelector('.brand p').textContent = bess ? 'Energy storage intelligence · Executive Briefing' : 'SOLARbytes · Daily Digest';
  document.querySelector('[data-mode="'+(bess?'bess':'sb')+'"]').classList.add('active');
  document.querySelectorAll('[data-bess]').forEach(el=>el.hidden=!bess);
  if(bess){
    document.querySelector('#leadHeading').textContent='Hero Cover Story';
    document.querySelector('#leadDescription').textContent='Full banner, two paragraphs and an in-depth bullet box';
    document.querySelector('#leadLabel').textContent='Hero Cover Story';
    document.querySelector('#mValue').placeholder='$64–$69 / kWh';
    document.querySelector('#mText').placeholder='Add a verified storage pricing benchmark and its source.';
  }
})();
