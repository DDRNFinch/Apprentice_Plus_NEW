
const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
const store={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set(k,v){localStorage.setItem(k,JSON.stringify(v))}};
let state=store.get('applus-state',{name:'Apprentice',signature:'',courseId:'brick',xp:0,completed:{},drafts:{},rewards:[],academyPassed:{},academyScores:{},academyCompletionDates:{},witnessTestimonies:{},tab:'home'});
state.signature=state.signature||''; state.academyPassed=state.academyPassed||{}; state.academyScores=state.academyScores||{}; state.academyCompletionDates=state.academyCompletionDates||{}; state.witnessTestimonies=state.witnessTestimonies||{};
let view={tab:state.tab||'home',courseId:state.courseId||'brick',assignment:null,academyModule:null,academySection:null,witnessAssignment:null,apprenticeshipTab:state.apprenticeshipTab||'assignments'};
const APP_VERSION='2.3';
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
function shell(title,body){$('#app').innerHTML=`<div class="app">${header(title)}<main class="main">${body}</main>${nav()}</div>`;$$('[data-tab]').forEach(b=>b.onclick=()=>{view.tab=b.dataset.tab;view.assignment=null;view.academyModule=null;view.academySection=null;view.witnessAssignment=null;save();render()})}
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
  const bank=window.ACADEMY_QUESTION_BANK?.[course().id]?.[m.assignmentNumber];
  if(bank&&bank.length===10)return bank.map(item=>({q:item.q,options:item.options,answer:item.answer,ksb:item.ksb}));
  const a=m.assignment;
  const entries=(a.ksbs||[]).map(raw=>({code:ksbCode(raw),text:String(raw).replace(/^[KSB]\d+\s*:\s*/i,'').trim()}));
  return Array.from({length:10},(_,i)=>{const e=entries[i%entries.length];return {q:`Which action best demonstrates ${e.code} during ${a.title}?`,options:[e.text,'Ignore the stated requirement','Continue without checking the specification','Use an unapproved shortcut'],answer:0,ksb:e.code}});
}
function renderAcademy(){
  const c=course();
  if(!view.academySection){
    const folders=[
      ['trade','Trade Academy','Assignment-based trade topics and KSB quizzes','▣'],
      ['functional','Functional Skills','Maths and English learning and assessment','∑'],
      ['cscs','CSCS','Construction health, safety and environment preparation','⛑'],
      ['inhouse','In-house Training','Additional training delivered by your provider or employer','★']
    ];
    shell('Academy',`<div class="course-banner"><span>Selected course</span><strong>${esc(c.name)}</strong></div><div class="academy-folders">${folders.map(([id,title,desc,icon])=>`<button class="academy-folder" data-academy-section="${id}"><span class="folder-icon">${icon}</span><span><strong>${title}</strong><small>${desc}</small></span><b>›</b></button>`).join('')}</div>`);
    $$('[data-academy-section]').forEach(b=>b.onclick=()=>{view.academySection=b.dataset.academySection;render()});
    return;
  }
  if(view.academySection!=='trade'){
    const names={functional:'Functional Skills',cscs:'CSCS',inhouse:'In-house Training'};
    const info={functional:'This section is ready for Maths and English modules.',cscs:'This section is ready for CSCS health, safety and environment modules.',inhouse:'This section is ready for provider and employer training modules.'};
    shell('Academy',`<button class="back" id="backAcademyFolders">‹ Back to Academy</button><div class="card"><h2>${names[view.academySection]}</h2><p class="muted">${info[view.academySection]}</p></div><div class="card empty">No topics have been added to this section yet.</div>`);
    $('#backAcademyFolders').onclick=()=>{view.academySection=null;render()};
    return;
  }
  const modules=academyModules(c),passed=modules.filter(m=>state.academyPassed[m.id]).length;
  shell('Academy',`<button class="back" id="backAcademyFolders">‹ Back to Academy</button><div class="course-banner"><span>Trade Academy</span><strong>${esc(c.name)}</strong></div><div class="card academy-overview"><h2>Assignment topics</h2><p class="muted">Each topic matches one apprenticeship assignment. Its 10 difficult questions are based directly on the KSB descriptions mapped to that assignment.</p><div class="progress"><span style="width:${modules.length?Math.round(passed/modules.length*100):0}%"></span></div><p><b>${passed} / ${modules.length}</b> topics passed</p></div><div class="list">${modules.map(m=>{const done=!!state.academyPassed[m.id],score=state.academyScores[m.id];return `<div class="assignment academy-item ${done?'academy-passed':''}" data-module="${esc(m.id)}"><div class="num">${done?'✓':m.code}</div><div class="grow"><h3>${esc(m.code)}: ${esc(m.title)}</h3><div class="muted">${done?`Passed${score!=null?` · ${score}%`:''}`:'10 KSB-specific questions · 80% pass'}</div></div><span>›</span></div>`}).join('')}</div>`);
  $('#backAcademyFolders').onclick=()=>{view.academySection=null;render()};
  $$('[data-module]').forEach(x=>x.onclick=()=>{view.academyModule=x.dataset.module;render()});
}
function renderAcademyModule(){
  const c=course(),m=academyModules(c).find(x=>x.id===view.academyModule);
  if(!m){view.academyModule=null;return renderAcademy()}
  const qs=academyQuestions(m),passed=!!state.academyPassed[m.id];
  shell('Academy',`<button class="back" id="backAcademy">‹ Back to Academy</button><div class="card academy-topic"><span class="academy-ksb">${esc(m.code)}</span><h2>Assignment ${m.assignmentNumber}: ${esc(m.title)}</h2><p class="muted">Mapped KSBs: ${m.ksbs.map(esc).join(', ')}. Passing this assignment-specific quiz adds Academy supporting evidence. The related KSB can only complete when the matching assignment is also complete.</p></div><form class="card academy-quiz" id="academyQuiz"><h2>10-question assessment</h2><p class="muted">All questions relate to this assignment and its mapped KSBs. Score at least 80% to pass.</p>${qs.map((q,qi)=>`<fieldset><legend>${qi+1}. ${esc(q.q)} <small class="muted">${esc(q.ksb)}</small></legend>${q.options.map((o,oi)=>`<label><input type="radio" name="q${qi}" value="${oi}"> <span>${esc(o)}</span></label>`).join('')}</fieldset>`).join('')}<button class="btn btn-primary" type="submit">${passed?'Retake quiz':'Submit answers'}</button><div class="quiz-result" id="quizResult">${passed?`Previously passed${state.academyScores[m.id]!=null?` with ${state.academyScores[m.id]}%`:''}.`:''}</div></form>`);
  $('#backAcademy').onclick=()=>{view.academyModule=null;view.academySection='trade';render()};
  $('#academyQuiz').onsubmit=e=>{e.preventDefault();let correct=0,answered=0;qs.forEach((q,i)=>{const picked=$(`input[name="q${i}"]:checked`);if(picked){answered++;if(Number(picked.value)===q.answer)correct++}});if(answered<qs.length){$('#quizResult').textContent='Answer all 10 questions before submitting.';return}const score=Math.round(correct/qs.length*100);state.academyScores[m.id]=score;if(score>=80){const first=!state.academyPassed[m.id];state.academyPassed[m.id]=true;state.academyCompletionDates[m.id]=state.academyCompletionDates[m.id]||new Date().toISOString();if(first)state.xp=(state.xp||0)+Math.max(1,score-80);$('#quizResult').innerHTML=`<strong>Passed — ${score}%</strong><br>${m.code} is now shown in full yellow against every KSB mapped to Assignment ${m.assignmentNumber}.`;toast(`${m.code} passed`)}else{$('#quizResult').innerHTML=`<strong>Not passed — ${score}%</strong><br>Review the assignment KSBs and try again.`}save()};
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
  let wk=`${c.id}-WT${a.number}`,d=state.witnessTestimonies[wk]||{assignmentNumber:a.number,witnessName:'',jobTitle:'',employer:'',text:'',date:new Date().toISOString().slice(0,10),signature:'',completed:false};d.signature=d.signature||'';
  const hits=a.statementPrompts.filter(p=>promptHit(d.text,concisePrompt(p))).length,wc=words(d.text);
  shell('Witness Testimony',`<button class="back" id="backWitness">‹ Back to Witness Testimonies</button><div class="card"><h2>Create witness testimony</h2><div class="form-row"><label>Assignment</label><select id="witnessAssignmentSelect">${c.assignments.map(x=>`<option value="${x.number}" ${x.number===a.number?'selected':''}>Assignment ${x.number}: ${esc(x.title)}</option>`).join('')}</select></div><div class="form-row"><label>Witness name</label><input id="witnessName" value="${esc(d.witnessName)}" placeholder="Employer or workplace witness"></div><div class="form-row"><label>Job title</label><input id="witnessRole" value="${esc(d.jobTitle)}" placeholder="Job title"></div><div class="form-row"><label>Employer</label><input id="witnessEmployer" value="${esc(d.employer)}" placeholder="Company or employer"></div><div class="form-row"><label>Date</label><input id="witnessDate" type="date" value="${esc(d.date)}"></div></div><div class="card"><h2>WT${a.number}: ${esc(a.title)}</h2><p class="muted">Describe what the witness personally observed. Use the same prompts as the selected assignment.</p><div id="witnessPrompts">${a.statementPrompts.map((p,i)=>`<div class="prompt ${promptHit(d.text,concisePrompt(p))?'ok':''}" data-wprompt="${i}"><div class="prompt-head"><span class="dot"></span><span>${esc(concisePrompt(p))}</span><small class="muted">${esc(p.ksb)}</small><button class="info" type="button">i</button></div><div class="detail"><b>Suggested things to confirm:</b><div class="suggestions">${suggestedPoints(p).map(x=>`<span>${esc(x)}</span>`).join('')}</div></div></div>`).join('')}</div><textarea class="textarea" id="witnessText" rows="14" autocapitalize="sentences" spellcheck="true" placeholder="Write the full witness testimony here...">${esc(d.text)}</textarea><div class="counter"><span id="witnessWords">${wc} words</span><span id="witnessHits">${hits} / ${a.statementPrompts.length} prompts</span></div><div class="form-row witness-signature-block"><label>Witness signature</label><div class="signature-wrap"><canvas id="witnessSignaturePad" width="600" height="180"></canvas></div><div class="signature-actions"><button type="button" class="btn btn-secondary" id="clearWitnessSignature">Clear signature</button></div><p class="muted">The witness must sign inside this box before the testimony can be completed.</p></div><button class="btn btn-primary" id="saveWitness">Save witness testimony</button></div>`);
  $('#backWitness').onclick=()=>{view.witnessAssignment=null;view.apprenticeshipTab='witness';render()};
  $('#witnessAssignmentSelect').onchange=e=>{view.witnessAssignment=Number(e.target.value);render()};
  $$('.info').forEach(b=>b.onclick=e=>{e.stopPropagation();b.closest('.prompt').querySelector('.detail').classList.toggle('open')});
  const persist=()=>{d.witnessName=$('#witnessName').value.trim();d.jobTitle=$('#witnessRole').value.trim();d.employer=$('#witnessEmployer').value.trim();d.date=$('#witnessDate').value;d.text=$('#witnessText').value;state.witnessTestimonies[wk]=d;save()};
  ['witnessName','witnessRole','witnessEmployer','witnessDate'].forEach(id=>$('#'+id).oninput=persist);setupCanvasSignature('witnessSignaturePad',d.signature,data=>{d.signature=data;state.witnessTestimonies[wk]=d;save()},'clearWitnessSignature');
  $('#witnessText').oninput=e=>{d.text=e.target.value;persist();const h=a.statementPrompts.filter(p=>promptHit(d.text,concisePrompt(p))).length;$('#witnessWords').textContent=`${words(d.text)} words`;$('#witnessHits').textContent=`${h} / ${a.statementPrompts.length} prompts`;a.statementPrompts.forEach((p,i)=>document.querySelector(`[data-wprompt="${i}"]`)?.classList.toggle('ok',promptHit(d.text,concisePrompt(p))))};
  $('#saveWitness').onclick=()=>{persist();if(!d.witnessName||!d.jobTitle||!d.text.trim()||!d.signature){toast('Add the witness details, testimony and signature');return}d.completed=true;d.savedAt=new Date().toISOString();state.witnessTestimonies[wk]=d;save();toast(`WT${a.number} saved`);setTimeout(()=>{view.witnessAssignment=null;view.apprenticeshipTab='witness';render()},600)};
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
function compressPhoto(file){
  return new Promise((resolve,reject)=>{
    if(!file||!file.type.startsWith('image/'))return reject(new Error('Please choose an image file.'));
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error('The photo could not be read.'));
    reader.onload=()=>{
      const img=new Image();
      img.onerror=()=>reject(new Error('The photo could not be opened.'));
      img.onload=()=>{
        const max=1400,scale=Math.min(1,max/Math.max(img.width,img.height));
        const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
        const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);
        resolve(canvas.toDataURL('image/jpeg',0.72));
      };
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
}
function openPhotoChooser(index,onPick,prompt,title){
  const wrap=document.createElement('div');
  wrap.className='modal-wrap';
  wrap.innerHTML=`<div class="modal-card"><div class="modal-grip"></div><h3>${esc(title||`Photo ${index+1}`)}</h3><div class="photo-full-description"><b>What this photo should show</b><p>${esc(prompt||'Add clear photographic evidence for this skill.')}</p></div><p class="muted chooser-help">Choose where the photo should come from.</p><button class="choice camera">📷 <span><b>Take a photo</b><small>Open the phone camera</small></span></button><button class="choice gallery">🖼️ <span><b>Choose from gallery</b><small>Select an existing image</small></span></button><div class="photo-save-status" hidden>Saving photo…</div><button class="modal-cancel">Cancel</button><input class="camera-input" type="file" accept="image/*" capture="environment"><input class="gallery-input" type="file" accept="image/*"></div>`;
  document.body.appendChild(wrap);
  const close=()=>wrap.remove();
  const process=input=>{
    input.value='';
    input.onchange=async e=>{
      const f=e.target.files&&e.target.files[0];if(!f)return;
      const status=wrap.querySelector('.photo-save-status');status.hidden=false;
      wrap.querySelectorAll('button').forEach(b=>b.disabled=true);
      try{const data=await compressPhoto(f);await onPick(data,index);close();toast('Photo saved')}
      catch(err){status.hidden=false;status.textContent=err.message||'Photo could not be saved.';wrap.querySelectorAll('button').forEach(b=>b.disabled=false)}
    };
    input.click();
  };
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
  $('#complete').onclick=()=>{let nowReady=words(d.text)>=100&&a.statementPrompts.filter(p=>promptHit(d.text,concisePrompt(p))).length===a.statementPrompts.length&&d.photos.filter(Boolean).length===6;if(!nowReady)return;if(!state.completed[key(a)]){const completedAt=new Date().toISOString();state.completed[key(a)]={date:completedAt,title:a.title,course:course().name,number:a.number};state.xp=(state.xp||0)+1000;save();toast('Assignment completed — '+new Date(completedAt).toLocaleDateString())}setTimeout(()=>{view.assignment=null;render()},700)};
}
function documentWindow(title,body){
  const w=window.open('','_blank');if(!w){toast('Allow pop-ups to open the PDF');return null}
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>@page{size:A4;margin:14mm}body{font-family:Arial,sans-serif;color:#073f43;margin:0}h1{font-size:25px;margin:0 0 5px}h2{font-size:18px;border-bottom:2px solid #66e52b;padding-bottom:5px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0}.box{border:1px solid #b9d7d2;border-radius:12px;padding:10px}.photos{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.photos img{width:100%;height:150px;object-fit:cover;border-radius:8px}.statement{white-space:pre-wrap;line-height:1.45}.signature{height:70px;max-width:260px;object-fit:contain}.footer{margin-top:18px;padding-top:10px;border-top:1px solid #ccc;font-size:12px;color:#567}.no-print{position:fixed;right:15px;top:15px}button{padding:10px 16px;border:0;border-radius:8px;background:#18a77d;color:#fff;font-weight:bold}@media print{.no-print{display:none}}</style></head><body><button class="no-print" onclick="window.print()">Download / Save PDF</button>${body}<div class="footer">Generated by Apprentice+ · Your Course, Your Way</div></body></html>`);w.document.close();return w;
}
function assignmentPdf(cid,num){
  const c=APP_COURSES.find(x=>x.id===cid),a=c?.assignments.find(x=>x.number===Number(num));if(!c||!a)return;
  const d=state.drafts[`${cid}-${a.number}`]||{text:'',photos:[]},done=state.completed[`${cid}-${a.number}`];
  const date=done?.date?new Date(done.date).toLocaleDateString('en-GB'):'Not completed';
  documentWindow(`AS${a.number} ${a.title}`,`<h1>Assignment ${a.number}: ${esc(a.title)}</h1><div>${esc(c.name)} · ${esc(c.reference)} · Version ${esc(c.version)}</div><div class="meta"><div class="box"><b>Apprentice</b><br>${esc(state.name)}</div><div class="box"><b>Completion date</b><br>${date}</div></div><h2>Photographic evidence</h2><div class="photos">${(d.photos||[]).filter(Boolean).map(x=>`<img src="${x}">`).join('')}</div><h2>Activity statement</h2><div class="statement">${esc(d.text||'')}</div><h2>Mapped KSBs</h2><p>${a.ksbs.map(esc).join(' · ')}</p><h2>Apprentice signature</h2>${state.signature?`<img class="signature" src="${state.signature}">`:'<p>No signature saved.</p>'}`);
}
function academyPdf(cid,num){
  const c=APP_COURSES.find(x=>x.id===cid),m=academyModules(c).find(x=>x.assignmentNumber===Number(num));if(!c||!m)return;
  const score=state.academyScores[m.id],date=state.academyCompletionDates[m.id]?new Date(state.academyCompletionDates[m.id]).toLocaleDateString('en-GB'):'Not completed';
  documentWindow(`${m.code} ${m.title}`,`<h1>${esc(m.code)}: ${esc(m.title)}</h1><div>${esc(c.name)} · ${esc(c.reference)} · Version ${esc(c.version)}</div><div class="meta"><div class="box"><b>Apprentice</b><br>${esc(state.name)}</div><div class="box"><b>Completion date</b><br>${date}</div><div class="box"><b>Quiz result</b><br>${score??0}%</div><div class="box"><b>Status</b><br>${state.academyPassed[m.id]?'Passed':'Not passed'}</div></div><h2>Mapped KSBs</h2><p>${m.ksbs.map(esc).join(' · ')}</p><h2>Apprentice signature</h2>${state.signature?`<img class="signature" src="${state.signature}">`:'<p>No signature saved.</p>'}`);
}
function witnessPdf(cid,num){
  const c=APP_COURSES.find(x=>x.id===cid),a=c?.assignments.find(x=>x.number===Number(num)),d=state.witnessTestimonies[`${cid}-WT${num}`];if(!c||!a||!d)return;
  documentWindow(`WT${a.number} ${a.title}`,`<h1>Witness Testimony ${a.number}: ${esc(a.title)}</h1><div>${esc(c.name)} · ${esc(c.reference)} · Version ${esc(c.version)}</div><div class="meta"><div class="box"><b>Witness</b><br>${esc(d.witnessName)}</div><div class="box"><b>Job title</b><br>${esc(d.jobTitle)}</div><div class="box"><b>Employer</b><br>${esc(d.employer||'')}</div><div class="box"><b>Date</b><br>${d.date?new Date(d.date+'T00:00:00').toLocaleDateString('en-GB'):''}</div></div><h2>Witness testimony</h2><div class="statement">${esc(d.text||'')}</div><h2>Mapped KSBs</h2><p>${a.ksbs.map(esc).join(' · ')}</p><h2>Witness signature</h2>${d.signature?`<img class="signature" src="${d.signature}">`:'<p>No signature saved.</p>'}`);
}
const enc=new TextEncoder();
function bytes(s){return enc.encode(s)}
function concatBytes(parts){let n=parts.reduce((a,b)=>a+b.length,0),out=new Uint8Array(n),o=0;for(const p of parts){out.set(p,o);o+=p.length}return out}
function dataUrlBytes(u){const b=atob(u.split(',')[1]||''),x=new Uint8Array(b.length);for(let i=0;i<b.length;i++)x[i]=b.charCodeAt(i);return x}
function crc32(data){let c=0xffffffff;for(const b of data){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
function le16(n){return new Uint8Array([n&255,(n>>>8)&255])}function le32(n){return new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255])}
function makeZip(files){let locals=[],centrals=[],offset=0;for(const f of files){const name=bytes(f.name),data=f.data instanceof Uint8Array?f.data:bytes(f.data),crc=crc32(data),local=concatBytes([le32(0x04034b50),le16(20),le16(0),le16(0),le16(0),le16(0),le32(crc),le32(data.length),le32(data.length),le16(name.length),le16(0),name,data]);locals.push(local);centrals.push(concatBytes([le32(0x02014b50),le16(20),le16(20),le16(0),le16(0),le16(0),le16(0),le32(crc),le32(data.length),le32(data.length),le16(name.length),le16(0),le16(0),le16(0),le16(0),le32(0),le32(offset),name]));offset+=local.length}const central=concatBytes(centrals),end=concatBytes([le32(0x06054b50),le16(0),le16(0),le16(files.length),le16(files.length),le32(central.length),le32(offset),le16(0)]);return new Blob([...locals,central,end],{type:'application/zip'})}
function wrapCanvasText(ctx,text,x,y,maxWidth,lineHeight,maxLines=999){const paras=String(text||'').split(/\n/);let lines=0;for(const para of paras){let line='';for(const word of para.split(/\s+/)){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,y);y+=lineHeight;lines++;line=word;if(lines>=maxLines)return y}else line=test}if(line){ctx.fillText(line,x,y);y+=lineHeight;lines++;if(lines>=maxLines)return y}y+=lineHeight*.25}return y}
function pageCanvas(){const c=document.createElement('canvas');c.width=1240;c.height=1754;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.fillStyle='#073f43';return [c,x]}
function drawHeader(ctx,title,sub){ctx.fillStyle='#073f43';ctx.fillRect(0,0,1240,165);ctx.fillStyle='#72ed2d';ctx.font='bold 31px Arial';ctx.fillText('APPRENTICE+',70,65);ctx.fillStyle='#fff';ctx.font='bold 46px Arial';ctx.fillText(title,70,125);ctx.fillStyle='#073f43';ctx.font='25px Arial';ctx.fillText(sub,70,215);ctx.fillStyle='#72ed2d';ctx.fillRect(70,240,1100,7)}
async function loadImg(src){return new Promise(r=>{if(!src)return r(null);const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src})}
async function assignmentPdfBytes(cid,num){const c=APP_COURSES.find(x=>x.id===cid),a=c.assignments.find(x=>x.number===num),d=state.drafts[`${cid}-${num}`]||{text:'',photos:[]},done=state.completed[`${cid}-${num}`];let pages=[];let [cv,ctx]=pageCanvas();drawHeader(ctx,`AS${num}: ${a.title}`,`${c.name} · ${c.reference} · Version ${c.version}`);ctx.font='bold 25px Arial';ctx.fillText(`Apprentice: ${state.name}`,70,300);ctx.fillText(`Completed: ${done?.date?new Date(done.date).toLocaleDateString('en-GB'):'Not completed'}`,650,300);ctx.font='bold 30px Arial';ctx.fillText('Photographic evidence',70,365);const imgs=await Promise.all((d.photos||[]).slice(0,6).map(loadImg));for(let i=0;i<6;i++){const col=i%2,row=Math.floor(i/2),x=70+col*555,y=405+row*360;ctx.strokeStyle='#b9d7d2';ctx.lineWidth=3;ctx.strokeRect(x,y,515,310);if(imgs[i]){const im=imgs[i],scale=Math.min(515/im.width,270/im.height),w=im.width*scale,h=im.height*scale;ctx.drawImage(im,x+(515-w)/2,y+(270-h)/2,w,h)}ctx.fillStyle='#073f43';ctx.font='bold 20px Arial';ctx.fillText(photoTitles[i]||`Photo ${i+1}`,x+15,y+295)}pages.push(cv);[cv,ctx]=pageCanvas();drawHeader(ctx,'Activity statement',`AS${num}: ${a.title}`);ctx.font='24px Arial';ctx.fillStyle='#073f43';wrapCanvasText(ctx,d.text||'',70,305,1100,35,32);ctx.font='bold 27px Arial';ctx.fillText('Mapped KSBs',70,1450);ctx.font='22px Arial';wrapCanvasText(ctx,a.ksbs.join(' · '),70,1490,1100,31,4);ctx.font='bold 25px Arial';ctx.fillText('Apprentice signature',70,1620);const sig=await loadImg(state.signature);if(sig)ctx.drawImage(sig,350,1550,400,120);pages.push(cv);return canvasesToPdf(pages)}
async function academyPdfBytes(cid,num){const c=APP_COURSES.find(x=>x.id===cid),m=academyModules(c).find(x=>x.assignmentNumber===num),[cv,ctx]=pageCanvas();drawHeader(ctx,`${m.code}: ${m.title}`,`${c.name} · ${c.reference} · Version ${c.version}`);ctx.font='bold 26px Arial';ctx.fillText(`Apprentice: ${state.name}`,70,310);ctx.fillText(`Quiz result: ${state.academyScores[m.id]||0}%`,70,360);ctx.fillText(`Completed: ${new Date(state.academyCompletionDates[m.id]||Date.now()).toLocaleDateString('en-GB')}`,70,410);ctx.font='bold 30px Arial';ctx.fillText('Mapped KSBs',70,500);ctx.font='23px Arial';wrapCanvasText(ctx,m.ksbs.join(' · '),70,545,1100,34,12);ctx.font='bold 25px Arial';ctx.fillText('Apprentice signature',70,1450);const sig=await loadImg(state.signature);if(sig)ctx.drawImage(sig,70,1490,450,135);return canvasesToPdf([cv])}
async function witnessPdfBytes(cid,num){const c=APP_COURSES.find(x=>x.id===cid),a=c.assignments.find(x=>x.number===num),d=state.witnessTestimonies[`${cid}-WT${num}`],[cv,ctx]=pageCanvas();drawHeader(ctx,`WT${num}: ${a.title}`,`${c.name} · ${c.reference} · Version ${c.version}`);ctx.font='bold 24px Arial';ctx.fillText(`Witness: ${d.witnessName}`,70,305);ctx.fillText(`Job title: ${d.jobTitle}`,70,350);ctx.fillText(`Employer: ${d.employer||''}`,70,395);ctx.fillText(`Date: ${d.date?new Date(d.date+'T00:00:00').toLocaleDateString('en-GB'):''}`,70,440);ctx.font='bold 30px Arial';ctx.fillText('Witness testimony',70,510);ctx.font='23px Arial';wrapCanvasText(ctx,d.text||'',70,555,1100,33,24);ctx.font='bold 25px Arial';ctx.fillText('Witness signature',70,1480);const sig=await loadImg(d.signature);if(sig)ctx.drawImage(sig,70,1520,450,135);return canvasesToPdf([cv])}
async function matrixPdfBytes(c){const rows=ksbRows(c),pages=[];for(let start=0;start<rows.length;start+=12){const [cv,ctx]=pageCanvas();drawHeader(ctx,'KSB Matrix',`${c.name} · ${c.reference} · Version ${c.version}`);let y=300;ctx.font='19px Arial';for(const r of rows.slice(start,start+12)){const done=r.assignments.length&&r.assignments.every(a=>assignmentSupportComplete(c,a));ctx.fillStyle=done?'#dff8e6':'#f4f8f7';ctx.fillRect(55,y-28,1130,100);ctx.fillStyle='#073f43';ctx.font='bold 23px Arial';ctx.fillText(`${done?'✓ ':''}${r.code}`,75,y);ctx.font='18px Arial';wrapCanvasText(ctx,r.description||r.code,165,y,650,24,2);let bx=840;for(const a of r.assignments.slice(0,3)){const ad=!!state.completed[`${c.id}-${a.number}`],at=!!state.academyPassed[`${c.id}-AT${a.number}`],wt=!!state.witnessTestimonies[`${c.id}-WT${a.number}`]?.completed;ctx.fillStyle=ad?'#20bf75':'#dce9e6';ctx.fillRect(bx,y-22,80,32);ctx.fillStyle=ad?'#fff':'#073f43';ctx.fillText(`AS${a.number}`,bx+8,y+1);bx+=90;ctx.fillStyle=at?'#f0c600':'#fff3b8';ctx.fillRect(bx,y-22,80,32);ctx.fillStyle='#073f43';ctx.fillText(`AT${a.number}`,bx+8,y+1);bx+=90;ctx.fillStyle=wt?'#55aeea':'#dcecf8';ctx.fillRect(bx,y-22,80,32);ctx.fillText(`WT${a.number}`,bx+8,y+1);bx+=90}y+=112}pages.push(cv)}return canvasesToPdf(pages)}
function canvasesToPdf(canvases){const imgs=canvases.map(c=>({data:dataUrlBytes(c.toDataURL('image/jpeg',.88)),w:c.width,h:c.height})),count=imgs.length,objCount=2+count*3,parts=[],offsets=[0],pos=0;const add=x=>{parts.push(x);pos+=x.length};add(bytes('%PDF-1.4\n%âãÏÓ\n'));const obj=(n,content)=>{offsets[n]=pos;add(bytes(`${n} 0 obj\n`));add(content instanceof Uint8Array?content:bytes(content));add(bytes('\nendobj\n'))};obj(1,'<< /Type /Catalog /Pages 2 0 R >>');const kids=imgs.map((_,i)=>`${3+i*3} 0 R`).join(' ');obj(2,`<< /Type /Pages /Kids [${kids}] /Count ${count} >>`);imgs.forEach((im,i)=>{const p=3+i*3,co=p+1,io=p+2;obj(p,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im${i} ${io} 0 R >> >> /Contents ${co} 0 R >>`);const stream=`q\n595 0 0 842 0 0 cm\n/Im${i} Do\nQ\n`;obj(co,`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);obj(io,concatBytes([bytes(`<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.data.length} >>\nstream\n`),im.data,bytes('\nendstream')]))});const xref=pos;add(bytes(`xref\n0 ${objCount+1}\n0000000000 65535 f \n`));for(let i=1;i<=objCount;i++)add(bytes(String(offsets[i]).padStart(10,'0')+' 00000 n \n'));add(bytes(`trailer\n<< /Size ${objCount+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`));return concatBytes(parts)}
async function downloadPortfolio(){const c=course(),btn=$('#downloadPortfolio');btn.disabled=true;btn.textContent='Building portfolio…';try{const files=[];for(const [k] of Object.entries(state.completed).filter(([k])=>k.startsWith(c.id+'-'))){const n=Number(k.split('-').pop());files.push({name:`AS${n}-${c.assignments.find(a=>a.number===n).title.replace(/[^a-z0-9]+/gi,'-')}.pdf`,data:await assignmentPdfBytes(c.id,n)})}for(const m of academyModules(c).filter(m=>state.academyPassed[m.id]))files.push({name:`${m.code}-${m.title.replace(/[^a-z0-9]+/gi,'-')}.pdf`,data:await academyPdfBytes(c.id,m.assignmentNumber)});for(const a of c.assignments){if(state.witnessTestimonies[`${c.id}-WT${a.number}`]?.completed)files.push({name:`WT${a.number}-${a.title.replace(/[^a-z0-9]+/gi,'-')}.pdf`,data:await witnessPdfBytes(c.id,a.number)})}files.push({name:'KSB-Matrix.pdf',data:await matrixPdfBytes(c)});const blob=makeZip(files),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=`${c.name.replace(/[^a-z0-9]+/gi,'-')}-Portfolio.zip`;a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);toast('Portfolio downloaded')}catch(e){console.error(e);toast('Portfolio could not be created')}finally{btn.disabled=false;btn.textContent='Download portfolio'}}
function renderDocuments(){
  const assignmentEntries=Object.entries(state.completed).filter(([k])=>k.startsWith(view.courseId+'-'));
  const academyEntries=academyModules(course()).filter(m=>state.academyPassed[m.id]);
  const witnessEntries=course().assignments.filter(a=>state.witnessTestimonies[`${view.courseId}-WT${a.number}`]?.completed);
  const assignmentCards=assignmentEntries.map(([k,v])=>{const num=Number(k.split('-').pop());return `<div class="document-card"><div><span class="tag">AS${num}</span><h3>${esc(v.title)}</h3><div class="muted">Completed ${new Date(v.date).toLocaleDateString('en-GB')}</div></div><div class="document-actions"><button data-edit-as="${num}">Edit</button><button data-download-as="${num}">Download</button><button class="danger-mini" data-delete-as="${num}">Delete</button></div></div>`}).join('');
  const academyCards=academyEntries.map(m=>`<div class="document-card"><div><span class="tag academy-tag">${m.code}</span><h3>${esc(m.title)}</h3><div class="muted">Passed ${state.academyScores[m.id]}% · ${new Date(state.academyCompletionDates[m.id]||Date.now()).toLocaleDateString('en-GB')}</div></div><div class="document-actions"><button data-edit-at="${m.assignmentNumber}">Edit</button><button data-download-at="${m.assignmentNumber}">Download</button><button class="danger-mini" data-delete-at="${m.assignmentNumber}">Delete</button></div></div>`).join('');
  const witnessCards=witnessEntries.map(a=>{const d=state.witnessTestimonies[`${view.courseId}-WT${a.number}`];return `<div class="document-card"><div><span class="tag witness-tag">WT${a.number}</span><h3>${esc(a.title)}</h3><div class="muted">Signed by ${esc(d.witnessName)} · ${d.date?new Date(d.date+'T00:00:00').toLocaleDateString('en-GB'):''}</div></div><div class="document-actions"><button data-edit-wt="${a.number}">Edit</button><button data-download-wt="${a.number}">Download</button><button class="danger-mini" data-delete-wt="${a.number}">Delete</button></div></div>`}).join('');
  shell('Documents',`<div class="card portfolio-card"><h2>Apprenticeship portfolio</h2><p class="muted">Download one ZIP containing every completed assignment PDF, passed Academy topic PDF, signed witness testimony PDF and the current KSB Matrix.</p><button class="btn btn-primary" id="downloadPortfolio">Download portfolio</button></div><div class="card"><h2>PDF documents</h2><p class="muted">Edit evidence, open a print-ready PDF, download it using Save as PDF, or delete the completed document.</p></div><h2 class="section-title">Assignments</h2>${assignmentCards||'<div class="card empty">No completed assignments yet.</div>'}<h2 class="section-title">Academy topics</h2>${academyCards||'<div class="card empty">No passed Academy topics yet.</div>'}<h2 class="section-title">Witness testimonies</h2>${witnessCards||'<div class="card empty">No signed witness testimonies yet.</div>'}`);
  $('#downloadPortfolio').onclick=downloadPortfolio;
  $$('[data-edit-as]').forEach(b=>b.onclick=()=>{view.tab='apprenticeship';view.assignment=Number(b.dataset.editAs);render()});$$('[data-download-as]').forEach(b=>b.onclick=()=>assignmentPdf(view.courseId,Number(b.dataset.downloadAs)));$$('[data-delete-as]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.deleteAs);if(confirm(`Delete completed AS${n} PDF status? The draft evidence will remain available for editing.`)){delete state.completed[`${view.courseId}-${n}`];save();renderDocuments()}});
  $$('[data-edit-at]').forEach(b=>b.onclick=()=>{view.tab='academy';view.academyModule=`${view.courseId}-AT${b.dataset.editAt}`;render()});$$('[data-download-at]').forEach(b=>b.onclick=()=>academyPdf(view.courseId,Number(b.dataset.downloadAt)));$$('[data-delete-at]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.deleteAt),id=`${view.courseId}-AT${n}`;if(confirm(`Delete completed AT${n} document and pass status?`)){delete state.academyPassed[id];delete state.academyScores[id];delete state.academyCompletionDates[id];save();renderDocuments()}});
  $$('[data-edit-wt]').forEach(b=>b.onclick=()=>{view.tab='apprenticeship';view.witnessAssignment=Number(b.dataset.editWt);render()});$$('[data-download-wt]').forEach(b=>b.onclick=()=>witnessPdf(view.courseId,Number(b.dataset.downloadWt)));$$('[data-delete-wt]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.deleteWt);if(confirm(`Delete WT${n} witness testimony?`)){delete state.witnessTestimonies[`${view.courseId}-WT${n}`];save();renderDocuments()}});
}

function setupCanvasSignature(canvasId,existing,onSave,clearId){
  const canvas=$('#'+canvasId);if(!canvas)return;const ctx=canvas.getContext('2d');ctx.lineWidth=4;ctx.lineCap='round';ctx.strokeStyle='#073f43';
  if(existing){const img=new Image();img.onload=()=>ctx.drawImage(img,0,0,canvas.width,canvas.height);img.src=existing}
  let drawing=false;
  const point=e=>{const r=canvas.getBoundingClientRect(),t=e.touches?.[0]||e;return {x:(t.clientX-r.left)*canvas.width/r.width,y:(t.clientY-r.top)*canvas.height/r.height}};
  const begin=e=>{e.preventDefault();drawing=true;const p=point(e);ctx.beginPath();ctx.moveTo(p.x,p.y)};
  const move=e=>{if(!drawing)return;e.preventDefault();const p=point(e);ctx.lineTo(p.x,p.y);ctx.stroke()};
  const end=e=>{if(!drawing)return;e?.preventDefault();drawing=false;onSave(canvas.toDataURL('image/png'))};
  canvas.addEventListener('pointerdown',begin);canvas.addEventListener('pointermove',move);window.addEventListener('pointerup',end);
  canvas.addEventListener('touchstart',begin,{passive:false});canvas.addEventListener('touchmove',move,{passive:false});canvas.addEventListener('touchend',end,{passive:false});
  const clear=$('#'+clearId);if(clear)clear.onclick=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);onSave('');toast('Signature cleared')};
}
function setupSignaturePad(){setupCanvasSignature('signaturePad',state.signature,data=>{state.signature=data;save()},'clearSignature')}
function renderSettings(){
  shell('Settings',`<div class="card"><h2>Apprentice profile</h2><div class="form-row"><label>Apprentice name</label><input id="name" value="${esc(state.name)}"></div><div class="form-row"><label>Apprentice signature</label><div class="signature-wrap"><canvas id="signaturePad" width="600" height="180"></canvas></div><div class="signature-actions"><button type="button" class="btn btn-secondary" id="clearSignature">Clear signature</button></div><p class="muted">Sign inside the box. This signature is added to assignment and Academy PDFs.</p></div><div class="form-row"><label>Selected course</label><select id="setCourse">${APP_COURSES.map(c=>`<option value="${c.id}" ${c.id===view.courseId?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div><button class="btn btn-primary" id="saveSettings">Save settings</button></div><div class="card update-card"><h2>App updates</h2><div class="version-grid"><div><span>Installed</span><b>Build ${APP_VERSION}</b></div><div><span>Latest on GitHub</span><b id="latestVersion">Not checked</b></div></div><div class="update-status" id="updateStatus">Checking for updates…</div><button class="btn btn-primary" id="checkUpdates">Check for updates</button><button class="btn btn-secondary" id="downloadUpdate" hidden>Download update</button><button class="btn btn-secondary" id="restartApp" hidden>Restart app</button><p class="install-note">Apprentice+ checks GitHub whenever it opens. Your saved evidence remains on this phone.</p></div><div class="card"><h2>App data</h2><p class="muted">Your evidence is stored locally on this device.</p><button class="btn btn-secondary" id="export">Export backup</button> <button class="btn btn-danger" id="reset">Reset app</button></div><div class="card install-card"><h2>Install Apprentice+</h2><p class="muted">Add Apprentice+ to your phone for full-screen access and offline use.</p><button class="btn btn-primary" id="installApp">Install app</button><p class="install-note" id="installNote">Chrome will show the installation option when it is available.</p></div>`);
  $('#saveSettings').onclick=()=>{state.name=$('#name').value.trim()||'Apprentice';view.courseId=$('#setCourse').value;save();toast('Settings saved');render()};
  setupSignaturePad();
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
