(function(){
  const functional=window.REVISION_PACKS||{};
  const themes=[
    ['Purpose and standards','underpinning purpose, recognised standards and the result that competent work must achieve'],
    ['Planning and information','drawings, specifications, instructions, sequencing and the checks needed before work begins'],
    ['Hazards and controls','task-specific hazards, RAMS, PPE or RPE, access, dust controls and protection of other people'],
    ['Tools and equipment','selection, inspection, adjustment and controlled use of the tools or equipment required'],
    ['Materials and preparation','material suitability, defects, storage, conditioning, preparation and efficient use'],
    ['Setting out and accuracy','datum points, measurements, calculations, tolerances and independent dimensional checks'],
    ['Trade technique','the correct practical sequence, workmanship principles and reasons for each important operation'],
    ['Quality and defects','quality criteria, common defects, likely causes, prevention and proportionate corrective action'],
    ['Communication and decisions','clear reporting, coordination, changes, limits of authority and evidence-based decisions'],
    ['Completion and evidence','final inspection, safe handover, records, sustainability, reflection and evidence of competence']
  ];
  const tradeDetails={
    brick:{name:'bricklaying',work:'masonry, mortar, walling and associated components',checks:'gauge, line, level, plumb, square, bond, joint finish and dimensional tolerance'},
    site:{name:'site carpentry',work:'timber components, structural fixings, first-fix and second-fix installation',checks:'datum, line, level, plumb, square, fit, fixing, tolerance and finish'},
    bench:{name:'architectural joinery',work:'timber selection, setting-out rods, machining, joints, assembly and finishing',checks:'size, square, twist, joint fit, profile continuity, surface quality and tolerance'}
  };
  const strip=s=>String(s||'').replace(/^[KSB]\d+\s*:\s*/i,'').replace(/\s+/g,' ').trim();
  const code=s=>(String(s||'').match(/^[KSB]\d+/i)||['KSB'])[0].toUpperCase();
  const shortened=(s,n=230)=>{s=strip(s);return s.length>n?s.slice(0,n).replace(/\s+\S*$/,'')+'…':s};
  function assignmentPack(c,a){
    const trade=tradeDetails[c.id]||{name:c.name.toLowerCase(),work:'course-specific work',checks:'accuracy, quality, safety and finish'};
    const ksbs=(a.ksbs||[]).filter(Boolean),skills=(a.skills||ksbs.filter(x=>/^S\d+/i.test(x))),knowledge=(a.knowledge||ksbs.filter(x=>/^K\d+/i.test(x))),behaviours=(a.behaviours||ksbs.filter(x=>/^B\d+/i.test(x)));
    const pool=ksbs.length?ksbs:[`${a.title}: complete the work safely, accurately and to the specified quality`];
    const topics=themes.map(([title,focus],i)=>{
      const primary=pool[i%pool.length],secondary=pool[(i+1)%pool.length],skill=skills[i%Math.max(1,skills.length)]||primary,know=knowledge[i%Math.max(1,knowledge.length)]||secondary,behaviour=behaviours[i%Math.max(1,behaviours.length)]||'Take responsibility, communicate professionally and seek guidance when required.';
      const label=`${title}: ${code(primary)}`;
      const learn=`This topic develops ${focus} for Assignment ${a.number}, ${a.title}, within ${c.name}. The central requirement is ${shortened(primary)}. In ${trade.name}, this must be understood in relation to ${trade.work}. Competence means explaining why the requirement matters, recognising when it applies, and linking decisions to the specification, manufacturer guidance, site rules and current safe working arrangements. The learner should distinguish an acceptable method from a shortcut that creates hidden safety, durability or quality risks.`;
      const method=`Before starting, confirm the task information, identify the required outcome and turn the KSB into observable actions. Apply ${shortened(know)}. Plan the sequence, resources, controls and inspection points. During the work, demonstrate ${shortened(skill)}. Stop at logical stages to compare the work with the drawing or specification and record any change rather than relying on memory. For ${a.title.toLowerCase()}, checks should include ${trade.checks}. If information conflicts or the work exceeds personal authority, pause, protect the work and obtain an authorised decision.`;
      const example=`Applied example: the apprentice is completing ${a.title.toLowerCase()} and discovers that a dimension, material, condition or instruction differs from the planned information. They protect the area, verify the discrepancy with a second check, consider the effect on safety, following work and finished performance, and report concise facts to the correct person. They agree and record the response before continuing, then re-check the affected stage. This demonstrates ${shortened(behaviour)} It also produces stronger evidence: photographs at meaningful stages, measurements, a clear explanation of decisions and a final comparison against the required standard.`;
      const correct=`Verify the information, apply the relevant controls, complete staged ${trade.name} checks and record any authorised change.`;
      const distractors=['Continue using the quickest familiar method and only report a problem if the finished appearance is visibly poor.','Ask another apprentice to choose the method, avoid recording the change and complete all checks only at handover.','Replace the specified process with personal preference whenever it saves material or reduces the completion time.'];
      const answer=(a.number+i)%4,options=[...distractors];options.splice(answer,0,correct);
      return {title:label,learn,method,example,q:`During ${a.title.toLowerCase()}, which action best demonstrates ${code(primary)} while maintaining safe, accurate and accountable ${trade.name} work?`,options,answer};
    });
    return {title:`AS${a.number}: ${a.title}`,subject:`${c.name.toUpperCase()} · ASSIGNMENT ${a.number}`,courseId:c.id,assignment:a.number,topics};
  }
  function selectedPack(id){
    if(functional[id])return functional[id];
    const match=String(id||'').match(/^trade:([^:]+):(\d+)$/);if(!match)return null;
    const c=APP_COURSES.find(x=>x.id===match[1]),a=c?.assignments.find(x=>x.number===Number(match[2]));
    return c&&a?assignmentPack(c,a):null;
  }
  function openPack(id){
    const key=`revision:${id}`,start=()=>{view.revisionPack=id;view.revisionSlide=0;view.revisionAnswers={};render()},resume=p=>{view.revisionPack=id;view.revisionSlide=Number(p.current)||0;view.revisionAnswers=p.answers||{};render()};
    if(state.quizProgress[key])offerQuizResume(key,resume,start);else start();
  }
  window.renderRevisionOverview=function(){
    const c=course();
    shell('Revision Packs',`<button class="back" id="backRevisionFolders">‹ Back to Academy</button><div class="revision-hero"><span>APPRENTICE+ REVISION LIBRARY</span><h2>Revision Packs</h2><p>Guided Functional Skills and assignment-by-assignment trade revision. Every pack uses 30 teaching slides and 10 knowledge checks.</p></div><div class="revision-library-label"><b>${esc(c.name.toUpperCase())} ASSIGNMENT PACKS</b><span>${c.assignments.length} packs</span></div><div class="revision-pack-grid trade-revision-grid">${c.assignments.map(a=>`<button class="revision-pack-card trade-pack-card" data-revision-pack="trade:${c.id}:${a.number}"><span>TRADE REVISION · AS${a.number}</span><h3>${esc(a.title)}</h3><p>30 detailed slides · 10 questions · ${a.ksbs.length} KSBs</p><b>Open pack ›</b></button>`).join('')}</div><div class="revision-library-label"><b>FUNCTIONAL SKILLS</b><span>4 packs</span></div><div class="revision-pack-grid">${Object.entries(functional).map(([id,p])=>`<button class="revision-pack-card" data-revision-pack="${id}"><span>FUNCTIONAL SKILLS</span><h3>${esc(p.title)}</h3><p>30 teaching slides · 10 questions</p><b>Open pack ›</b></button>`).join('')}</div>`);
    $('#backRevisionFolders').onclick=()=>{view.academySection=null;render()};
    $$('[data-revision-pack]').forEach(b=>b.onclick=()=>openPack(b.dataset.revisionPack));
  };
  window.renderRevisionPack=function(){
    const p=selectedPack(view.revisionPack);if(!p){view.revisionPack=null;return renderAcademy()}
    const progressKey=`revision:${view.revisionPack}`,index=Math.max(0,Math.min(39,Number(view.revisionSlide)||0)),topic=Math.floor(index/4),part=index%4,x=p.topics[topic],isQ=part===3,answer=view.revisionAnswers?.[topic];
    const teaching=part===0?['Understand the requirement',x.learn]:part===1?['Apply the method',x.method]:['Trade-specific applied example',x.example];
    const persist=()=>{state.quizProgress[progressKey]={current:Number(view.revisionSlide)||0,answers:{...(view.revisionAnswers||{})},updated:new Date().toISOString()};save()};
    const options=isQ?x.options.map((o,n)=>{const cls=answer==null?'':n===x.answer?'correct':n===answer?'incorrect':'';return `<label class="${cls}"><input type="radio" name="revisionAnswer" value="${n}" ${answer===n?'checked':''} ${answer!=null?'disabled':''}><b>${esc(o)}</b></label>`}).join(''):'';
    const visual=window.revisionImageMarkup?window.revisionImageMarkup(p,x,part):'';
    shell('Revision Pack',`<button class="back" id="backRevisionPack">‹ Back to Revision Packs</button><div class="course-banner revision-banner"><span>${esc(p.subject)}</span><strong>Topic ${topic+1} of 10 · ${isQ?'Question '+(topic+1):'Teaching slide '+(topic*3+part+1)+' of 30'}</strong></div><article class="card revision-slide ${isQ?'revision-question':''}"><span>${isQ?'KNOWLEDGE CHECK':`TEACHING SLIDE ${part+1} OF 3`}</span><h2>${esc(x.title)}</h2>${visual}${isQ?`<h3>${esc(x.q)}</h3><div class="revision-options">${options}</div><div class="revision-feedback">${answer==null?'Choose an answer, then confirm.':answer===x.answer?'Correct. Continue to the next topic.':`Review the teaching slides. The best response is: ${esc(x.options[x.answer])}`}</div>`:`<h3>${esc(teaching[0])}</h3><p>${esc(teaching[1])}</p>`}<div class="training-progress"><span style="width:${(index+1)/40*100}%"></span></div><div class="training-controls"><button class="btn btn-secondary" id="revisionPrevious" ${index===0?'disabled':''}>‹ Previous</button><button class="btn btn-primary" id="revisionNext">${isQ&&answer==null?'Confirm answer':index===39?'Finish pack':'Next ›'}</button></div></article>`);
    $('#backRevisionPack').onclick=()=>{persist();view.revisionPack=null;view.academySection='revision';render()};
    $('#revisionPrevious').onclick=()=>{view.revisionSlide=Math.max(0,index-1);persist();render()};
    $('#revisionNext').onclick=()=>{if(isQ&&answer==null){const selected=$('input[name="revisionAnswer"]:checked');if(!selected)return toast('Choose an answer first');view.revisionAnswers=view.revisionAnswers||{};view.revisionAnswers[topic]=Number(selected.value);persist();render();return}if(index===39){state.revisionProgress[view.revisionPack]={completed:true,date:new Date().toISOString()};delete state.quizProgress[progressKey];save();view.revisionPack=null;view.academySection='revision';toast('Revision pack completed');render()}else{view.revisionSlide=index+1;persist();render()}};
  };
})();
