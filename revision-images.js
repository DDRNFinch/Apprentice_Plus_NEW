(function(){
  const visuals={
    masonry:{src:'revision-images/masonry.webp',label:'Cavity wall construction',alt:'A UK cavity wall training sample showing brickwork, blockwork, insulation, wall ties and damp-proof course.'},
    carpentry:{src:'revision-images/carpentry.webp',label:'Site carpentry',alt:'An apprentice setting out timber roof and floor framing with measuring and levelling tools.'},
    joinery:{src:'revision-images/joinery.webp',label:'Architectural joinery',alt:'Timber door and window frames being assembled with traditional joinery tools in a workshop.'},
    safety:{src:'revision-images/safety.webp',label:'Safe working',alt:'Construction PPE, hand tools, safe access equipment and an isolated power tool.'},
    'maths-measure':{src:'revision-images/maths-measure.webp',label:'Maths in everyday use',alt:'Measurement equipment, a scale drawing, calculator, clock, measuring jug and weighing scales.'},
    'maths-data':{src:'revision-images/maths-data.webp',label:'Money and data',alt:'British money, a budget, calculator, receipt, charts and probability equipment.'},
    'english-writing':{src:'revision-images/english-writing.webp',label:'Reading and writing',alt:'A formal letter, report, email, dictionary and proofreading materials.'},
    'english-speaking':{src:'revision-images/english-speaking.webp',label:'Speaking and listening',alt:'Adult learners presenting, listening, asking questions and making notes during a group discussion.'}
  };
  const has=(value,words)=>words.some(word=>String(value||'').toLowerCase().includes(word));
  function choose(pack,topic,part){
    const text=[pack?.subject,pack?.title,topic?.title,topic?.learn,topic?.method].join(' ').toLowerCase();
    if(pack?.courseId==='brick')return has(text,['hazard','control','tool','equipment','ppe','rpe','safe'])?'safety':'masonry';
    if(pack?.courseId==='site')return has(text,['hazard','control','ppe','rpe','safe'])?'safety':'carpentry';
    if(pack?.courseId==='bench')return has(text,['hazard','control','ppe','rpe','safe'])?'safety':'joinery';
    if(has(text,['english'])){
      return has(text,['speak','listen','discuss','presentation','question','respond','persuad','argument'])?'english-speaking':'english-writing';
    }
    if(has(text,['money','finance','cost','budget','profit','chart','table','average','probability','data','scatter']))return 'maths-data';
    return 'maths-measure';
  }
  window.revisionImageMarkup=function(pack,topic,part){
    const visual=visuals[choose(pack,topic,part)]||visuals.safety;
    const slideLabel=part===3?'Question visual':visual.label;
    return `<button type="button" class="revision-visual" data-revision-image="${visual.src}" data-revision-alt="${esc(visual.alt)}" aria-label="Enlarge image: ${esc(visual.label)}"><img src="${visual.src}" alt="${esc(visual.alt)}" loading="eager"><span><b>${esc(slideLabel)}</b><small>Tap image to enlarge</small></span></button>`;
  };
  window.openRevisionImage=function(button){
    const src=button?.dataset?.revisionImage,alt=button?.dataset?.revisionAlt||'Revision learning image';
    if(!src)return;
    const overlay=document.createElement('div');
    overlay.className='revision-image-preview';
    overlay.innerHTML=`<div class="revision-image-preview-card" role="dialog" aria-modal="true" aria-label="Full-screen revision image"><button type="button" class="revision-image-close" aria-label="Close image">×</button><img src="${src}" alt="${esc(alt)}"><p>${esc(alt)}</p></div>`;
    const close=()=>overlay.remove();
    overlay.onclick=e=>{if(e.target===overlay)close()};
    overlay.querySelector('.revision-image-close').onclick=close;
    document.body.appendChild(overlay);
    overlay.querySelector('.revision-image-close').focus();
  };
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-revision-image]');
    if(button)window.openRevisionImage(button);
  });
})();
