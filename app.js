
const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
const store={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set(k,v){localStorage.setItem(k,JSON.stringify(v))}};
let state=store.get('applus-state',{name:'Apprentice',courseId:'brick',xp:0,completed:{},drafts:{},rewards:[],academyPassed:{},academyScores:{},witnessTestimonies:{},tab:'home'});
state.academyPassed=state.academyPassed||{}; state.academyScores=state.academyScores||{}; state.witnessTestimonies=state.witnessTestimonies||{};
let view={tab:state.tab||'home',courseId:state.courseId||'brick',assignment:null,academyModule:null,witnessAssignment:null,apprenticeshipTab:state.apprenticeshipTab||'assignments'};
const APP_VERSION='2.0';
let deferredInstallPrompt=null;
let swRegistration=null;
let refreshingForUpdate=false;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;});
const course=()=>APP_COURSES.find(c=>c.id===view.courseId)||APP_COURSES[0];
function save(){state.courseId=view.courseId;state.tab=view.tab;state.apprenticeshipTab=view.apprenticeshipTab;store.set('applus-state',state)}
function key(a){return `${view.courseId}-${a.number}`}
function completedCount(c=course()){return c.assignments.filter(a=>state.completed[`${c.id}-${a.number}`]).length}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function toast(t){document.body.insertAdjacentHTML('beforeend',`<div class="toast">${esc(t)}</div>`);setTimeout(()=>$('.toast')?.remove(),1800)}
function header(title){return `<header class="header"><div class="brand"><img src="logo.png"><div><div class="eyebrow">APPRENTICE+</div><h1>${esc(title)}</h1><div class="subtitle">Your Course, Your Way</div><span class="build">Build ${APP_VERSION}</span></div></div></header>`}
const nav=()=>`<nav class="nav">${[['home','⌂','Home'],['academy','☆','Academy'],['apprenticeship','▣','Apprenticeship'],['documents','▤','Documents'],['settings','⚙','Settings']].map(([id,i,l])=>`<button data-tab="${id}" class="${view.tab===id?'active':''}"><span class="ico">${i}</span>${l}</button>`).join('')}</nav>`;
function shell(title,body){$('#app').innerHTML=`<div class="app">${header(title)}<main class="main">${body}</main>${nav()}</div>`;$$('[data-tab]').forEach(b=>b.onclick=()=>{view.tab=b.dataset.tab;view.assignment=null;view.academyModule=null;view.witnessAssignment=null;save();render()})}
function render(){if(view.assignment)return renderAssignment();if(view.academyModule)return renderAcademyModule();if(view.witnessAssignment)return renderWitnessTestimony();({home:renderHome,academy:renderAcademy,apprenticeship:renderApprenticeship,documents:renderDocuments,settings:renderSettings}[view.tab]||renderHome)()}
function renderHome(){let total=APP_COURSES.reduce((n,c)=>n+c.assignments.length,0),done=Object.keys(state.completed).length; shell('Home',`<section class="hero"><div class="muted" style="color:#c9e7df">Welcome back,</div><div class="big">${esc(state.name)}</div><p>Build evidence, complete assignments and track your apprenticeship progress.</p><button class="btn btn-primary" id="continue">Continue apprenticeship</button></section><h2 class="section-title">Your progress</h2><div class="grid"><div class="stat"><b>${done}</b>Assignments complete</div><div class="stat"><b>${state.xp||0}</b>Total XP</div></div><div class="card"><h2>${esc(course().name)}</h2><p class="muted">${course().reference} · Version ${course().version}</p><div class="progress"><span style="width:${Math.round(completedCount()/course().assignments.length*100)}%"></span></div><p><b>${completedCount()} / ${course().assignments.length}</b> assignments</p></div><div class="card"><h2>Quick actions</h2><div class="grid"><button class="btn btn-secondary" data-go="academy">Open Academy</button><button class="btn btn-secondary" data-go="documents">View documents</button></div></div>`);$('#continue').onclick=()=>{view.tab='apprenticeship';render()};$$('[data-go]').forEach(b=>b.onclick=()=>{view.tab=b.dataset.go;render()})}
function academyModules(c=course()){
  return c.assignments.map((a,i)=>({
    id:`${c.id}-AT${a.number}`,
    code:`AT${a.number}`,
    assignmentNumber:a.number,
    title:a.title,
    description:`Assignment ${a.number}: ${a.title}`,
    ksbs:(a.ksbs||[]).map(ksbCode),
    assignment:a,
    order:i+1
  }));
}
function academyQuestions(m){
  const a=m.assignment;
  const entries=(a.ksbs||[]).map(raw=>({
    code:ksbCode(raw),
    text:String(raw).replace(/^[KSB]\d+\s*:\s*/i,'').trim().replace(/\.$/,'')
  }));
  const fallback=entries[0]||{code:'KSB',text:a.title};
  const wrongActions=[
    'Continue using personal judgement without checking the assignment requirements.',
    'Use the quickest method and correct any problems only after the work is finished.',
    'Leave the decision to another person without recording or communicating the issue.',
    'Accept the result when it looks satisfactory without measurements, checks or evidence.',
    'Substitute materials, equipment or methods without approval from the relevant person.',
    'Ignore the requirement because the task appears routine or low risk.',
    'Cover the work before completing the required checks and recording the outcome.',
    'Rely only on previous experience rather than the current drawing, specification or safe system of work.'
  ];
  const scenarios=[
    e=>({
      q:`During Assignment ${a.number}: ${a.title}, which action best demonstrates ${e.code}: ${e.text}?`,
      correct:`Apply ${e.text.toLowerCase()} directly to the task, record the relevant checks and correct any non-conformance before continuing.`
    }),
    e=>({
      q:`Before starting ${a.title.toLowerCase()}, what must the apprentice confirm to meet ${e.code}?`,
      correct:`Confirm the current drawings, specification, safe system of work, required resources and quality criteria connected to ${e.text.toLowerCase()}.`
    }),
    e=>({
      q:`A problem occurs while completing ${a.title.toLowerCase()}. Which response most closely follows ${e.code}?`,
      correct:`Stop at the appropriate safe point, assess the problem against ${e.text.toLowerCase()}, report it where required and use an authorised corrective action.`
    }),
    e=>({
      q:`Which evidence would provide the strongest proof that ${e.code} was achieved during ${a.title.toLowerCase()}?`,
      correct:`Task-specific photographs, measurements, records or witness observations showing how ${e.text.toLowerCase()} was applied and checked.`
    }),
    e=>({
      q:`Which quality-control decision is most appropriate for ${e.code} in Assignment ${a.number}?`,
      correct:`Check the completed stage against the stated tolerance, standard or expected behaviour within ${e.text.toLowerCase()}, then rectify defects before the next stage.`
    }),
    e=>({
      q:`How should ${e.code} influence the selection of tools, equipment or materials for ${a.title.toLowerCase()}?`,
      correct:`Select suitable, serviceable and approved resources that allow ${e.text.toLowerCase()} to be achieved safely and to the required standard.`
    }),
    e=>({
      q:`Which communication is most important when applying ${e.code} to ${a.title.toLowerCase()}?`,
      correct:`Give clear, timely and accurate information about the requirement, any change or defect, and confirm understanding with the relevant person.`
    }),
    e=>({
      q:`What is the most serious consequence of failing to apply ${e.code} during Assignment ${a.number}?`,
      correct:`The work may become unsafe, non-compliant or defective because the requirement to ${e.text.toLowerCase()} has not been demonstrated or verified.`
    }),
    e=>({
      q:`At the end of ${a.title.toLowerCase()}, which final check best demonstrates ${e.code}?`,
      correct:`Inspect and record the finished work, confirm ${e.text.toLowerCase()} has been met, and leave the work area and evidence ready for review.`
    }),
    e=>({
      q:`Which explanation in an activity statement would best evidence ${e.code} for ${a.title.toLowerCase()}?`,
      correct:`A specific account of what was done, why it was done, how ${e.text.toLowerCase()} affected decisions, and how the result was checked.`
    })
  ];
  return Array.from({length:10},(_,i)=>{
    const e=entries[i%Math.max(entries.length,1)]||fallback;
    const item=scenarios[i](e);
    const distractors=[];
    for(let j=0;j<wrongActions.length&&distractors.length<3;j++){
      const w=wrongActions[(i+j*2)%wrongActions.length];
      if(w!==item.correct&&!distractors.includes(w))distractors.push(w);
    }
    const options=[item.correct,...distractors];
    const shift=(i*3)%4;
    const rotated=options.slice(shift).concat(options.slice(0,shift));
    return {q:item.q,options:rotated,answer:rotated.indexOf(item.correct),ksb:e.code};
  });
}
function renderAcademy(){
  const c=course(), modules=academyModules(c), passed=modules.filter(m=>state.academyPassed[m.id]).length;
  shell('Academy',`<div class="course-banner"><span>Selected course</span><strong>${esc(c.name)}</strong></div><div class="card academy-overview"><h2>Assignment Academy</h2><p class="muted">Each Academy topic matches one apprenticeship assignment. Every topic matches one assignment and contains 10 difficult questions based only on the KSBs mapped to that assignment. A passed topic provides supporting evidence.</p><div class="progress"><span style="width:${modules.length?Math.round(passed/modules.length*100):0}%"></span></div><p><b>${passed} / ${modules.length}</b> topics passed</p></div><div class="list">${modules.map(m=>{const done=!!state.academyPassed[m.id],score=state.academyScores[m.id];return `<div class="assignment academy-item ${done?'academy-passed':''}" data-module="${esc(m.id)}"><div class="num">${done?'✓':m.code}</div><div class="grow"><h3>${esc(m.code)}: ${esc(m.title)}</h3><div class="muted">${done?`Passed${score!=null?` · ${score}%`:''}`:'10 difficult questions · 80% pass'}</div></div><span>›</span></div>`}).join('')}</div>`);
  $$('[data-module]').forEach(x=>x.onclick=()=>{view.academyModule=x.dataset.module;render()});
}
function renderAcademyModule(){
  const c=course(),m=academyModules(c).find(x=>x.id===view.academyModule);
  if(!m){view.academyModule=null;return renderAcademy()}
  const qs=academyQuestions(m),passed=!!state.academyPassed[m.id];
  shell('Academy',`<button class="back" id="backAcademy">‹ Back to Academy</button><div class="card academy-topic"><span class="academy-ksb">${esc(m.code)}</span><h2>Assignment ${m.assignmentNumber}: ${esc(m.title)}</h2><p class="muted">Mapped KSBs: ${m.ksbs.map(esc).join(', ')}. Passing this assignment-specific quiz adds Academy supporting evidence. The related KSB can only complete when the matching assignment is also complete.</p></div><form class="card academy-quiz" id="academyQuiz"><h2>10-question assessment</h2><p class="muted">All questions relate to this assignment and its mapped KSBs. Score at least 80% to pass.</p>${qs.map((q,qi)=>`<fieldset><legend>${qi+1}. ${esc(q.q)} <small class="muted">${esc(q.ksb)}</small></legend>${q.options.map((o,oi)=>`<label><input type="radio" name="q${qi}" value="${oi}"> <span>${esc(o)}</span></label>`).join('')}</fieldset>`).join('')}<button class="btn btn-primary" type="submit">${passed?'Retake quiz':'Submit answers'}</button><div class="quiz-result" id="quizResult">${passed?`Previously passed${state.academyScores[m.id]!=null?` with ${state.academyScores[m.id]}%`:''}.`:''}</div></form>`);
  $('#backAcademy').onclick=()=>{view.academyModule=null;render()};
  $('#academyQuiz').onsubmit=e=>{e.preventDefault();let correct=0,answered=0;qs.forEach((q,i)=>{const picked=$(`input[name="q${i}"]:checked`);if(picked){answered++;if(Number(picked.value)===q.answer)correct++}});if(answered<qs.length){$('#quizResult').textContent='Answer all 10 questions before submitting.';return}const score=Math.round(correct/qs.length*100);state.academyScores[m.id]=score;if(score>=80){const first=!state.academyPassed[m.id];state.academyPassed[m.id]=true;if(first)state.xp=(state.xp||0)+Math.max(1,score-80);$('#quizResult').innerHTML=`<strong>Passed — ${score}%</strong><br>${m.code} is now shown in full yellow against every KSB mapped to Assignment ${m.assignmentNumber}.`;toast(`${m.code} passed`)}else{$('#quizResult').innerHTML=`<strong>Not passed — ${score}%</strong><br>Review the assignment KSBs and try again.`}save()};
}
function ksbCode(value=''){return String(value).match(/^[KSB]\d+/i)?.[0].toUpperCase()||String(value).trim()}
function ksbMatrix(c){
  const map=new Map();
  c.assignments.forEach(a=>(a.ksbs||[]).forEach(raw=>{
    const code=ksbCode(raw),description=String(raw).replace(/^[KSB]\d+\s*:\s*/i,'').trim();
    if(!map.has(code))map.set(code,{code,description,assignments:[]});
    if(!map.get(code).assignments.some(x=>x.number===a.number))map.get(code).assignments.push({number:a.number,title:a.title});
  }));
  const order={K:0,S:1,B:2};
  return [...map.values()].sort((a,b)=>(order[a.code[0]]-order[b.code[0]])||(Number(a.code.slice(1))-Number(b.code.slice(1))));
}
function witnessKey(number){return `${view.courseId}-WT${number}`}
function assignmentSupportComplete(c,a){const asDone=!!state.completed[`${c.id}-${a.number}`];const atDone=!!state.academyPassed[`${c.id}-AT${a.number}`];const wtDone=!!state.witnessTestimonies[`${c.id}-WT${a.number}`]?.completed;return asDone&&(atDone||wtDone)}
function renderApprenticeship(){
  let c=course(),pct=Math.round(completedCount(c)/c.assignments.length*100),sub=view.apprenticeshipTab||'assignments';
  const assignments=`<h2 class="section-title">Assignments</h2><div class="list">${c.assignments.map(a=>{let d=state.completed[`${c.id}-${a.number}`];return `<div class="assignment ${d?'done':''}" data-a="${a.number}"><div class="num">${d?'✓':a.number}</div><div class="grow"><h3>Assignment ${a.number}: ${esc(a.title)}</h3><div class="muted">6 photos · 100+ word statement</div></div><span>›</span></div>`}).join('')}</div>`;
  const witnesses=`<div class="card"><h2>Witness Testimonies</h2><p class="muted">An employer or workplace witness selects an assignment and writes a testimony against the same prompts used in that assignment.</p><button class="btn btn-primary" id="createWitness">Create witness testimony</button></div><div class="list">${c.assignments.map(a=>{const wt=state.witnessTestimonies[`${c.id}-WT${a.number}`];return `<div class="assignment ${wt?.completed?'witness-done':''}" data-wt="${a.number}"><div class="num">${wt?.completed?'✓':`WT${a.number}`}</div><div class="grow"><h3>${esc(a.title)}</h3><div class="muted">${wt?.completed?`Completed by ${esc(wt.witnessName||'workplace witness')}`:'Not completed'}</div></div><span>›</span></div>`}).join('')}</div>`;
  const rows=ksbMatrix(c);
  const matrix=`<div class="card matrix-intro"><h2>KSB Matrix</h2><p class="muted">AS = assignment evidence, AT = Academy topic quiz and WT = witness testimony. A KSB turns green only when each mapped assignment is complete and at least one matching supporting item—Academy topic or witness testimony—is complete.</p><div class="matrix-legend"><span class="legend-assignment">AS completed</span><span class="legend-academy pending">AT not passed</span><span class="legend-academy passed">AT passed</span><span class="legend-witness pending">WT not added</span><span class="legend-witness passed">WT completed</span></div></div><div class="ksb-matrix">${rows.map(r=>{const done=r.assignments.length>0&&r.assignments.every(a=>assignmentSupportComplete(c,a));return `<div class="matrix-row ${done?'complete':''}"><div class="matrix-code">${done?'✓ ':''}${esc(r.code)}</div><div class="matrix-content"><h3>${esc(r.description||r.code)}</h3><div class="matrix-evidence"><div class="matrix-assignments">${r.assignments.map(a=>{const adone=!!state.completed[`${c.id}-${a.number}`],atId=`${c.id}-AT${a.number}`,atDone=!!state.academyPassed[atId],wt=state.witnessTestimonies[`${c.id}-WT${a.number}`];return `<button class="matrix-assignment ${adone?'complete':''}" data-matrix-a="${a.number}" title="${esc(a.title)}">${adone?'✓ ':''}AS${a.number}</button><button class="academy-support ${atDone?'passed':'pending'}" data-academy-topic="${esc(atId)}" title="Academy: ${esc(a.title)}">${atDone?'✓ ':''}AT${a.number}</button><button class="witness-support ${wt?.completed?'passed':'pending'}" data-witness-topic="${a.number}" title="Witness testimony: ${esc(a.title)}">${wt?.completed?'✓ ':''}WT${a.number}</button>`}).join('')}</div></div></div></div>`}).join('')}</div>`;
  shell('Apprenticeship',`<div class="card"><div class="course-banner fixed"><span>Current course</span><strong>${esc(c.name)}</strong></div><div class="progress"><span style="width:${pct}%"></span></div><p><b>${completedCount(c)} / ${c.assignments.length}</b> completed · ${pct}%</p></div><div class="subtabs three"><button class="${sub==='assignments'?'active':''}" data-subtab="assignments">Assignments</button><button class="${sub==='matrix'?'active':''}" data-subtab="matrix">KSB Matrix</button><button class="${sub==='witness'?'active':''}" data-subtab="witness">Witness</button></div>${sub==='assignments'?assignments:sub==='matrix'?matrix:witnesses}`);
  $$('[data-subtab]').forEach(b=>b.onclick=()=>{view.apprenticeshipTab=b.dataset.subtab;save();render()});
  $$('[data-a],[data-matrix-a]').forEach(x=>x.onclick=()=>{view.assignment=Number(x.dataset.a||x.dataset.matrixA);render()});
  $$('[data-academy-topic]').forEach(x=>x.onclick=()=>{view.tab='academy';view.academyModule=x.dataset.academyTopic;save();render()});
  $$('[data-witness-topic],[data-wt]').forEach(x=>x.onclick=()=>{view.witnessAssignment=Number(x.dataset.witnessTopic||x.dataset.wt);render()});
  if($('#createWitness'))$('#createWitness').onclick=()=>{view.witnessAssignment=c.assignments[0].number;render()};
}
function renderWitnessTestimony(){
  const c=course();let a=c.assignments.find(x=>x.number===Number(view.witnessAssignment))||c.assignments[0];
  let wk=`${c.id}-WT${a.number}`,d=state.witnessTestimonies[wk]||{assignmentNumber:a.number,witnessName:'',jobTitle:'',employer:'',text:'',date:new Date().toISOString().slice(0,10),completed:false};
  const hits=a.statementPrompts.filter(p=>promptHit(d.text,concisePrompt(p))).length,wc=words(d.text);
  shell('Witness Testimony',`<button class="back" id="backWitness">‹ Back to Witness Testimonies</button><div class="card"><h2>Create witness testimony</h2><div class="form-row"><label>Assignment</label><select id="witnessAssignmentSelect">${c.assignments.map(x=>`<option value="${x.number}" ${x.number===a.number?'selected':''}>Assignment ${x.number}: ${esc(x.title)}</option>`).join('')}</select></div><div class="form-row"><label>Witness name</label><input id="witnessName" value="${esc(d.witnessName)}" placeholder="Employer or workplace witness"></div><div class="form-row"><label>Job title</label><input id="witnessRole" value="${esc(d.jobTitle)}" placeholder="Job title"></div><div class="form-row"><label>Employer</label><input id="witnessEmployer" value="${esc(d.employer)}" placeholder="Company or employer"></div><div class="form-row"><label>Date</label><input id="witnessDate" type="date" value="${esc(d.date)}"></div></div><div class="card"><h2>WT${a.number}: ${esc(a.title)}</h2><p class="muted">Describe what the witness personally observed. Use the same prompts as the selected assignment.</p><div id="witnessPrompts">${a.statementPrompts.map((p,i)=>`<div class="prompt ${promptHit(d.text,concisePrompt(p))?'ok':''}" data-wprompt="${i}"><div class="prompt-head"><span class="dot"></span><span>${esc(concisePrompt(p))}</span><small class="muted">${esc(p.ksb)}</small><button class="info" type="button">i</button></div><div class="detail"><b>Suggested things to confirm:</b><div class="suggestions">${suggestedPoints(p).map(x=>`<span>${esc(x)}</span>`).join('')}</div></div></div>`).join('')}</div><textarea class="textarea" id="witnessText" rows="14" autocapitalize="sentences" spellcheck="true" placeholder="Write the full witness testimony here...">${esc(d.text)}</textarea><div class="counter"><span id="witnessWords">${wc} words</span><span id="witnessHits">${hits} / ${a.statementPrompts.length} prompts</span></div><button class="btn btn-primary" id="saveWitness">Save witness testimony</button></div>`);
  $('#backWitness').onclick=()=>{view.witnessAssignment=null;view.apprenticeshipTab='witness';render()};
  $('#witnessAssignmentSelect').onchange=e=>{view.witnessAssignment=Number(e.target.value);render()};
  $$('.info').forEach(b=>b.onclick=e=>{e.stopPropagation();b.closest('.prompt').querySelector('.detail').classList.toggle('open')});
  const persist=()=>{d.witnessName=$('#witnessName').value.trim();d.jobTitle=$('#witnessRole').value.trim();d.employer=$('#witnessEmployer').value.trim();d.date=$('#witnessDate').value;d.text=$('#witnessText').value;state.witnessTestimonies[wk]=d;save()};
  ['witnessName','witnessRole','witnessEmployer','witnessDate'].forEach(id=>$('#'+id).oninput=persist);
  $('#witnessText').oninput=e=>{d.text=e.target.value;persist();const h=a.statementPrompts.filter(p=>promptHit(d.text,concisePrompt(p))).length;$('#witnessWords').textContent=`${words(d.text)} words`;$('#witnessHits').textContent=`${h} / ${a.statementPrompts.length} prompts`;a.statementPrompts.forEach((p,i)=>document.querySelector(`[data-wprompt="${i}"]`)?.classList.toggle('ok',promptHit(d.text,concisePrompt(p))))};
  $('#saveWitness').onclick=()=>{persist();if(!d.witnessName||!d.jobTitle||!d.text.trim()){toast('Add the witness name, job title and testimony');return}d.completed=true;d.savedAt=new Date().toISOString();state.witnessTestimonies[wk]=d;save();toast(`WT${a.number} saved`);setTimeout(()=>{view.witnessAssignment=null;view.apprenticeshipTab='witness';render()},600)};
}
function getDraft(a){return state.drafts[key(a)]||{text:'',photos:Array(6).fill(null)}}
function words(t){return (t.trim().match(/\b[\w'-]+\b/g)||[]).length}
function promptHit(text,keyword){let base=keyword.replace(/\s+\d+$/,'');return text.toLowerCase().includes(base.toLowerCase())}
function suggestedPoints(p){
  const d=(p.detail||'').replace(/\s+/g,' ').trim();
  const special={
    PPE:['Hard hat','Safety boots','High-visibility clothing','Gloves','Dust mask or suitable RPE'],
    'Safety control equipment':['Guards and barriers','Warning signs','Dust suppression','Fire extinguisher location','Correct PPE and RPE'],
    'Safe systems work':['Site induction','Toolbox talk','Risk assessment','Method statement','Hazards and controls'],
    'Awareness health safety':['Health and Safety at Work Act','COSHH requirements','Manual handling','Working at height','Slips, trips and falls']
  };
  let found=Object.entries(special).find(([k])=>p.keyword.toLowerCase().includes(k.toLowerCase())||d.toLowerCase().includes(k.toLowerCase()));
  if(found)return found[1];
  let parts=d.split(/[.:;]|,\s+(?=[A-Z])/).map(x=>x.trim()).filter(x=>x.length>3);
  let out=[];
  for(const x of parts){if(!out.some(y=>y.toLowerCase()===x.toLowerCase()))out.push(x);if(out.length===5)break}
  const fallback=['What you did','Tools, equipment or materials used','How you worked safely','How you checked the quality','Problems found and how you solved them'];
  while(out.length<5)out.push(fallback[out.length]);
  return out.slice(0,5);
}
function openPhotoChooser(index,onPick,prompt,title){
  const wrap=document.createElement('div');
  wrap.className='modal-wrap';
  wrap.innerHTML=`<div class="modal-card"><div class="modal-grip"></div><h3>${esc(title||`Photo ${index+1}`)}</h3><div class="photo-full-description"><b>What this photo should show</b><p>${esc(prompt||'Add clear photographic evidence for this skill.')}</p></div><p class="muted chooser-help">Choose where the photo should come from.</p><button class="choice camera">📷 <span><b>Take a photo</b><small>Open the phone camera</small></span></button><button class="choice gallery">🖼️ <span><b>Choose from gallery</b><small>Select an existing image</small></span></button><button class="modal-cancel">Cancel</button><input class="camera-input" type="file" accept="image/*" capture="environment"><input class="gallery-input" type="file" accept="image/*"></div>`;
  document.body.appendChild(wrap);
  const close=()=>wrap.remove();
  const process=input=>{input.onchange=e=>{const f=e.target.files&&e.target.files[0];if(!f)return close();const r=new FileReader();r.onload=()=>{onPick(r.result,index);close()};r.readAsDataURL(f)};input.click()};
  wrap.querySelector('.camera').onclick=()=>process(wrap.querySelector('.camera-input'));
  wrap.querySelector('.gallery').onclick=()=>process(wrap.querySelector('.gallery-input'));
  wrap.querySelector('.modal-cancel').onclick=close;
  wrap.onclick=e=>{if(e.target===wrap)close()};
}
const photoTitles=['Preparation','PPE','Safe Working','Technique','Quality Checks','Finished Work'];
function concisePrompt(p){
  return String(p.keyword||p.ksb||'KSB topic').trim();
}
function renderAssignment(){
  let a=course().assignments.find(x=>x.number===view.assignment),d=getDraft(a),wc=words(d.text),hits=a.statementPrompts.filter(p=>promptHit(d.text,concisePrompt(p))).length,photos=d.photos.filter(Boolean).length,ready=wc>=100&&hits===a.statementPrompts.length&&photos===6;
  shell(`Assignment ${a.number}`,`<button class="back" id="back">← Back to assignments</button><div class="card assignment-heading"><span class="tag">${esc(course().reference)}</span><h2>Assignment ${a.number}: ${esc(a.title)}</h2><div class="pillrow">${a.ksbs.map(k=>`<span class="ksb">${esc(k.match(/^[SKB]\d+/)?.[0]||'KSB')}</span>`).join('')}</div></div><div class="card"><h2>Photographic evidence</h2><p class="muted">Add all six photographs. Select a space to use the camera or choose a photo from your phone gallery.</p><div class="photo-grid">${a.photoPrompts.map((p,i)=>`<div class="photo-slot" data-slot="${i}">${d.photos[i]?`<img src="${d.photos[i]}"><button class="remove" data-remove="${i}">×</button>`:`<div class="photo-placeholder"><span class="photo-icon">＋</span><b>${esc(photoTitles[i]||`Photo ${i+1}`)}</b><small>${esc(p.replace(/^Show\s+/i,'').slice(0,68))}</small></div>`}</div>`).join('')}</div></div><div class="card statement-card"><h2>Activity statement</h2><p>Explain what you did, tools, equipment and materials used, safe working, quality checks and how you solved problems.</p><div id="prompts">${a.statementPrompts.map((p,i)=>`<div class="prompt ${promptHit(d.text,concisePrompt(p))?'ok':''}" data-prompt="${i}"><div class="prompt-head"><span class="dot"></span><span>${esc(concisePrompt(p))}</span><small class="muted">${esc(p.ksb)}</small><button class="info" type="button">i</button></div><div class="detail"><b>Suggested things to discuss:</b><div class="suggestions">${suggestedPoints(p).map(x=>`<span>${esc(x)}</span>`).join('')}</div></div></div>`).join('')}</div><textarea class="textarea" id="statement" rows="12" autocomplete="off" autocapitalize="sentences" spellcheck="true" placeholder="Write your full activity statement here. Minimum 100 words...">${esc(d.text)}</textarea><div class="counter"><span id="wordcount">${wc} / 100 words</span><span id="promptcount">${hits} / ${a.statementPrompts.length} prompts</span></div></div><div class="completion"><div class="completion-status"><b id="completionText">${photos}/6 photos · ${wc}/100 words · ${hits}/6 prompts</b></div><button class="btn btn-primary" id="complete" ${ready?'':'disabled'}>${state.completed[key(a)]?'Assignment completed':'Complete assignment'}</button></div>`);
  $('#back').onclick=()=>{view.assignment=null;render()};
  $$('.info').forEach(b=>b.onclick=e=>{e.stopPropagation();b.closest('.prompt').querySelector('.detail').classList.toggle('open')});
  $$('[data-slot]').forEach(slot=>slot.onclick=e=>{if(e.target.closest('.remove'))return;openPhotoChooser(Number(slot.dataset.slot),(data,i)=>{d.photos[i]=data;state.drafts[key(a)]=d;save();renderAssignment()},a.photoPrompts[Number(slot.dataset.slot)],photoTitles[Number(slot.dataset.slot)]||`Photo ${Number(slot.dataset.slot)+1}`)});
  $$('[data-remove]').forEach(b=>b.onclick=e=>{e.stopPropagation();d.photos[Number(b.dataset.remove)]=null;state.drafts[key(a)]=d;save();renderAssignment()});
  const ta=$('#statement');
  ta.oninput=e=>{
    d.text=e.target.value;state.drafts[key(a)]=d;save();
    const currentWords=words(d.text),currentHits=a.statementPrompts.filter(p=>promptHit(d.text,concisePrompt(p))).length,currentPhotos=d.photos.filter(Boolean).length,currentReady=currentWords>=100&&currentHits===a.statementPrompts.length&&currentPhotos===6;
    $('#wordcount').textContent=`${currentWords} / 100 words`;$('#promptcount').textContent=`${currentHits} / 6 prompts`;$('#completionText').textContent=`${currentPhotos}/6 photos · ${currentWords}/100 words · ${currentHits}/6 prompts`;
    a.statementPrompts.forEach((p,i)=>document.querySelector(`[data-prompt="${i}"]`)?.classList.toggle('ok',promptHit(d.text,concisePrompt(p))));
    const complete=$('#complete');complete.disabled=!currentReady;
  };
  $('#complete').onclick=()=>{let nowReady=words(d.text)>=100&&a.statementPrompts.filter(p=>promptHit(d.text,concisePrompt(p))).length===a.statementPrompts.length&&d.photos.filter(Boolean).length===6;if(!nowReady)return;if(!state.completed[key(a)]){state.completed[key(a)]={date:new Date().toISOString(),title:a.title,course:course().name};state.xp=(state.xp||0)+1000;save();toast('Assignment completed — 1,000 XP awarded')}setTimeout(()=>{view.assignment=null;render()},700)};
}
function renderDocuments(){let entries=Object.entries(state.completed);shell('Documents',`<div class="card"><h2>Assignment documents</h2><p class="muted">Completed evidence can be opened and printed or saved as a PDF from your browser.</p></div>${entries.length?`<div class="list">${entries.map(([k,v])=>`<div class="assignment" data-doc="${k}"><div class="num">✓</div><div class="grow"><h3>${esc(v.course)} — ${esc(v.title)}</h3><div class="muted">Completed ${new Date(v.date).toLocaleDateString()}</div></div><span>›</span></div>`).join('')}</div>`:`<div class="card empty">No completed assignments yet.</div>`}`);$$('[data-doc]').forEach(x=>x.onclick=()=>{let [cid,num]=x.dataset.doc.split(/-(?=\d+$)/);view.courseId=cid;view.assignment=Number(num);renderAssignment();setTimeout(()=>window.print(),300)})}
function renderSettings(){
  shell('Settings',`<div class="card"><h2>Profile</h2><div class="form-row"><label>Apprentice name</label><input id="name" value="${esc(state.name)}"></div><div class="form-row"><label>Selected course</label><select id="setCourse">${APP_COURSES.map(c=>`<option value="${c.id}" ${c.id===view.courseId?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div><button class="btn btn-primary" id="saveSettings">Save settings</button></div><div class="card update-card"><h2>App updates</h2><div class="version-grid"><div><span>Installed</span><b>Build ${APP_VERSION}</b></div><div><span>Latest on GitHub</span><b id="latestVersion">Not checked</b></div></div><div class="update-status" id="updateStatus">Checking for updates…</div><button class="btn btn-primary" id="checkUpdates">Check for updates</button><button class="btn btn-secondary" id="downloadUpdate" hidden>Download update</button><button class="btn btn-secondary" id="restartApp" hidden>Restart app</button><p class="install-note">Apprentice+ checks GitHub whenever it opens. Your saved evidence remains on this phone.</p></div><div class="card"><h2>App data</h2><p class="muted">Your evidence is stored locally on this device.</p><button class="btn btn-secondary" id="export">Export backup</button> <button class="btn btn-danger" id="reset">Reset app</button></div><div class="card install-card"><h2>Install Apprentice+</h2><p class="muted">Add Apprentice+ to your phone for full-screen access and offline use.</p><button class="btn btn-primary" id="installApp">Install app</button><p class="install-note" id="installNote">Chrome will show the installation option when it is available.</p></div>`);
  $('#saveSettings').onclick=()=>{state.name=$('#name').value.trim()||'Apprentice';view.courseId=$('#setCourse').value;save();toast('Settings saved');render()};
  $('#export').onclick=()=>{let b=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='apprentice-plus-backup.json';a.click();URL.revokeObjectURL(u)};
  $('#reset').onclick=()=>{if(confirm('Delete all local Apprentice+ data?')){localStorage.removeItem('applus-state');location.reload()}};

  const latestEl=$('#latestVersion'),statusEl=$('#updateStatus'),checkBtn=$('#checkUpdates'),downloadBtn=$('#downloadUpdate'),restartBtn=$('#restartApp');
  let latestVersion=APP_VERSION;
  const checkForUpdates=async(manual=false)=>{
    checkBtn.disabled=true;checkBtn.textContent='Checking…';statusEl.className='update-status';statusEl.textContent='Checking GitHub for the newest build…';downloadBtn.hidden=true;restartBtn.hidden=true;
    try{
      const response=await fetch(`version.json?t=${Date.now()}`,{cache:'no-store'});
      if(!response.ok)throw new Error('Version file unavailable');
      const latest=await response.json();
      latestVersion=String(latest.version||APP_VERSION);
      latestEl.textContent=`Build ${latestVersion}`;
      const reg=swRegistration||await navigator.serviceWorker?.getRegistration();
      if(reg)await reg.update();
      if(latestVersion!==APP_VERSION||reg?.waiting){
        statusEl.className='update-status available';statusEl.textContent=`Update available: Build ${latestVersion}.`;
        downloadBtn.hidden=false;
      }else{
        statusEl.className='update-status current';statusEl.textContent=`Build ${APP_VERSION} is up to date.`;
      }
    }catch(error){
      latestEl.textContent='Unable to check';statusEl.className='update-status error';statusEl.textContent='Could not check GitHub. Check your connection and try again.';
      if(manual)toast('Update check failed');
    }finally{checkBtn.disabled=false;checkBtn.textContent='Check for updates'}
  };
  checkBtn.onclick=()=>checkForUpdates(true);
  downloadBtn.onclick=async()=>{
    downloadBtn.disabled=true;downloadBtn.textContent='Downloading…';statusEl.className='update-status';statusEl.textContent='Downloading the latest Apprentice+ files…';
    try{
      const reg=swRegistration||await navigator.serviceWorker?.getRegistration();
      if(!reg)throw new Error('Service worker unavailable');
      await reg.update();
      let waiting=reg.waiting;
      if(!waiting&&reg.installing){
        waiting=reg.installing;
        await new Promise(resolve=>{const done=()=>{if(waiting.state==='installed'){waiting.removeEventListener('statechange',done);resolve()}};waiting.addEventListener('statechange',done);setTimeout(resolve,8000)});
      }
      statusEl.className='update-status ready';statusEl.textContent='Update downloaded. Restart Apprentice+ to use it.';
      restartBtn.hidden=false;downloadBtn.hidden=true;
    }catch(error){
      statusEl.className='update-status error';statusEl.textContent='The update could not be downloaded. Try again in a moment.';
      downloadBtn.disabled=false;downloadBtn.textContent='Download update';
    }
  };
  restartBtn.onclick=async()=>{
    const reg=swRegistration||await navigator.serviceWorker?.getRegistration();
    if(reg?.waiting){reg.waiting.postMessage({type:'SKIP_WAITING'});statusEl.textContent='Restarting Apprentice+…';setTimeout(()=>location.reload(),1200)}else{location.reload()}
  };

  $('#installApp').onclick=async()=>{
    const note=$('#installNote');
    if(deferredInstallPrompt){
      deferredInstallPrompt.prompt();
      const result=await deferredInstallPrompt.userChoice;
      note.textContent=result.outcome==='accepted'?'Installation started.':'Installation was cancelled.';
      deferredInstallPrompt=null;
      return;
    }
    note.textContent='In Chrome, open the three-dot menu and choose “Add to Home screen” or “Install app”.';
  };
  checkForUpdates(false);
}
if('serviceWorker'in navigator){
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(!refreshingForUpdate)return;
    location.reload();
  });
  navigator.serviceWorker.register('service-worker.js',{updateViaCache:'none'}).then(reg=>{
    swRegistration=reg;
    reg.update().catch(()=>{});
  }).catch(()=>{});
}
render();
