
const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
const store={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set(k,v){localStorage.setItem(k,JSON.stringify(v))}};
let state=store.get('applus-state',{name:'Apprentice',courseId:'brick',xp:0,completed:{},drafts:{},rewards:[],tab:'home'});
let view={tab:state.tab||'home',courseId:state.courseId||'brick',assignment:null,apprenticeshipTab:state.apprenticeshipTab||'assignments'};
const APP_VERSION='1.5';
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
function shell(title,body){$('#app').innerHTML=`<div class="app">${header(title)}<main class="main">${body}</main>${nav()}</div>`;$$('[data-tab]').forEach(b=>b.onclick=()=>{view.tab=b.dataset.tab;view.assignment=null;save();render()})}
function render(){if(view.assignment)return renderAssignment();({home:renderHome,academy:renderAcademy,apprenticeship:renderApprenticeship,documents:renderDocuments,settings:renderSettings}[view.tab]||renderHome)()}
function renderHome(){let total=APP_COURSES.reduce((n,c)=>n+c.assignments.length,0),done=Object.keys(state.completed).length; shell('Home',`<section class="hero"><div class="muted" style="color:#c9e7df">Welcome back,</div><div class="big">${esc(state.name)}</div><p>Build evidence, complete assignments and track your apprenticeship progress.</p><button class="btn btn-primary" id="continue">Continue apprenticeship</button></section><h2 class="section-title">Your progress</h2><div class="grid"><div class="stat"><b>${done}</b>Assignments complete</div><div class="stat"><b>${state.xp||0}</b>Total XP</div></div><div class="card"><h2>${esc(course().name)}</h2><p class="muted">${course().reference} · Version ${course().version}</p><div class="progress"><span style="width:${Math.round(completedCount()/course().assignments.length*100)}%"></span></div><p><b>${completedCount()} / ${course().assignments.length}</b> assignments</p></div><div class="card"><h2>Quick actions</h2><div class="grid"><button class="btn btn-secondary" data-go="academy">Open Academy</button><button class="btn btn-secondary" data-go="documents">View documents</button></div></div>`);$('#continue').onclick=()=>{view.tab='apprenticeship';render()};$$('[data-go]').forEach(b=>b.onclick=()=>{view.tab=b.dataset.go;render()})}
function renderAcademy(){let modules=['Health & Safety Essentials','Sustainability at Work','Maths for Construction','English for Evidence','EPA Knowledge Practice','Professional Behaviours'];shell('Academy',`<div class="card"><h2>Learning Academy</h2><p class="muted">Short revision modules and knowledge checks. Completed modules award XP.</p></div><div class="list">${modules.map((m,i)=>`<div class="assignment academy-item"><div class="num">${i+1}</div><div class="grow"><h3>${m}</h3><div class="muted">10 learning cards · 10 questions</div></div><span>›</span></div>`).join('')}</div>`);$$('.academy-item').forEach((x,i)=>x.onclick=()=>toast('Academy module ready for the next build phase'))}
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
function renderApprenticeship(){
  let c=course(),pct=Math.round(completedCount(c)/c.assignments.length*100),sub=view.apprenticeshipTab||'assignments';
  const assignments=`<h2 class="section-title">Assignments</h2><div class="list">${c.assignments.map(a=>{let d=state.completed[`${c.id}-${a.number}`];return `<div class="assignment ${d?'done':''}" data-a="${a.number}"><div class="num">${d?'✓':a.number}</div><div class="grow"><h3>Assignment ${a.number}: ${esc(a.title)}</h3><div class="muted">6 photos · 100+ word statement</div></div><span>›</span></div>`}).join('')}</div>`;
  const rows=ksbMatrix(c);
  const matrix=`<div class="card matrix-intro"><h2>KSB Matrix</h2><p class="muted">See exactly which assignments cover each Knowledge, Skill and Behaviour. A KSB turns green when every assignment mapped to it has been completed.</p><div class="matrix-summary"><span><b>${rows.filter(r=>r.assignments.every(a=>state.completed[`${c.id}-${a.number}`])).length}</b> complete</span><span><b>${rows.length}</b> total KSBs</span></div></div><div class="ksb-matrix">${rows.map(r=>{const done=r.assignments.length>0&&r.assignments.every(a=>state.completed[`${c.id}-${a.number}`]);return `<div class="matrix-row ${done?'complete':''}"><div class="matrix-code">${done?'✓ ':''}${esc(r.code)}</div><div class="matrix-content"><h3>${esc(r.description||r.code)}</h3><div class="matrix-assignments">${r.assignments.map(a=>{const adone=!!state.completed[`${c.id}-${a.number}`];return `<button class="matrix-assignment ${adone?'complete':''}" data-matrix-a="${a.number}" title="${esc(a.title)}">${adone?'✓ ':''}A${a.number}</button>`}).join('')}</div></div></div>`}).join('')}</div>`;
  shell('Apprenticeship',`<div class="card"><div class="form-row"><label><b>Course</b></label><select id="courseSelect">${APP_COURSES.map(x=>`<option value="${x.id}" ${x.id===c.id?'selected':''}>${esc(x.name)} — ${x.reference}</option>`).join('')}</select></div><div class="progress"><span style="width:${pct}%"></span></div><p><b>${completedCount(c)} / ${c.assignments.length}</b> completed · ${pct}%</p></div><div class="subtabs"><button class="${sub==='assignments'?'active':''}" data-subtab="assignments">Assignments</button><button class="${sub==='matrix'?'active':''}" data-subtab="matrix">KSB Matrix</button></div>${sub==='assignments'?assignments:matrix}`);
  $('#courseSelect').onchange=e=>{view.courseId=e.target.value;save();render()};
  $$('[data-subtab]').forEach(b=>b.onclick=()=>{view.apprenticeshipTab=b.dataset.subtab;save();render()});
  $$('[data-a],[data-matrix-a]').forEach(x=>x.onclick=()=>{view.assignment=Number(x.dataset.a||x.dataset.matrixA);render()});
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
  const text=`${p.keyword||''} ${p.detail||''}`.toLowerCase();
  const rules=[
    [/personal protective|\bppe\b|respiratory protective|\brpe\b/,'PPE'],
    [/risk assessment/,'Risk assessment'],[/method statement/,'Method statement'],
    [/health and safety|safe systems|safe working|safety regulations/,'Safe working'],
    [/environment|sustainab|recycl|reuse|waste|contamination/,'Environment'],
    [/communication|communicat|information sharing/,'Communication'],
    [/equality|diversity|inclusion|inclusive/,'Inclusion'],[/wellbeing|welfare/,'Wellbeing'],
    [/drawing|specification|technical information/,'Drawings'],[/digital/,'Digital tools'],
    [/tool|equipment|machinery/,'Tools'],[/material|timber|brick|block|mortar/,'Materials'],
    [/measure|setting out|dimension/,'Measurements'],[/cut|sawing/,'Cutting'],
    [/quality|check|inspection|tolerance/,'Quality checks'],[/customer|client/,'Customer care'],
    [/team|colleague|others/,'Teamwork'],[/problem|defect|fault/,'Problem solving'],
    [/regulation|standard|legislation|building control/,'Regulations'],[/professional development|development/,'Development'],
    [/cavity/,'Cavity wall'],[/solid wall/,'Solid wall'],[/joint finish|pointing/,'Joint finish'],
    [/brick on edge|soldier/,'Special brickwork'],[/roof/,'Roof work'],[/door/,'Door fitting'],
    [/window/,'Window fitting'],[/stair/,'Stair work'],[/floor/,'Flooring'],[/wall unit|cabinet/,'Cabinet work'],
    [/joint/,'Joints'],[/finish/,'Finishing']
  ];
  for(const [re,label] of rules) if(re.test(text)) return label;
  const stop=new Set(['the','and','with','from','into','that','this','their','they','how','use','using','used','work','working','carry','carrying','out','comply','identify','put','awareness','importance','considerations','associated','activities','requirements','principles','impact','role','of','to','in','on','for','a','an']);
  const words=(p.detail||p.keyword||'KSB prompt').replace(/[^a-zA-Z0-9 ]/g,' ').split(/\s+/).filter(w=>w&&!stop.has(w.toLowerCase()));
  return words.slice(0,2).join(' ')||'KSB prompt';
}
function renderAssignment(){
  let a=course().assignments.find(x=>x.number===view.assignment),d=getDraft(a),wc=words(d.text),hits=a.statementPrompts.filter(p=>promptHit(d.text,concisePrompt(p))).length,photos=d.photos.filter(Boolean).length,ready=wc>=100&&hits===6&&photos===6;
  shell(`Assignment ${a.number}`,`<button class="back" id="back">← Back to assignments</button><div class="card assignment-heading"><span class="tag">${esc(course().reference)}</span><h2>Assignment ${a.number}: ${esc(a.title)}</h2><div class="pillrow">${a.ksbs.map(k=>`<span class="ksb">${esc(k.match(/^[SKB]\d+/)?.[0]||'KSB')}</span>`).join('')}</div></div><div class="card"><h2>Photographic evidence</h2><p class="muted">Add all six photographs. Select a space to use the camera or choose a photo from your phone gallery.</p><div class="photo-grid">${a.photoPrompts.map((p,i)=>`<div class="photo-slot" data-slot="${i}">${d.photos[i]?`<img src="${d.photos[i]}"><button class="remove" data-remove="${i}">×</button>`:`<div class="photo-placeholder"><span class="photo-icon">＋</span><b>${esc(photoTitles[i]||`Photo ${i+1}`)}</b><small>${esc(p.replace(/^Show\s+/i,'').slice(0,68))}</small></div>`}</div>`).join('')}</div></div><div class="card statement-card"><h2>Activity statement</h2><p>Explain what you did, tools, equipment and materials used, safe working, quality checks and how you solved problems.</p><div id="prompts">${a.statementPrompts.map((p,i)=>`<div class="prompt ${promptHit(d.text,concisePrompt(p))?'ok':''}" data-prompt="${i}"><div class="prompt-head"><span class="dot"></span><span>${esc(concisePrompt(p))}</span><small class="muted">${esc(p.ksb)}</small><button class="info" type="button">i</button></div><div class="detail"><b>Suggested things to discuss:</b><div class="suggestions">${suggestedPoints(p).map(x=>`<span>${esc(x)}</span>`).join('')}</div></div></div>`).join('')}</div><textarea class="textarea" id="statement" rows="12" autocomplete="off" autocapitalize="sentences" spellcheck="true" placeholder="Write your full activity statement here. Minimum 100 words...">${esc(d.text)}</textarea><div class="counter"><span id="wordcount">${wc} / 100 words</span><span id="promptcount">${hits} / 6 prompts</span></div></div><div class="completion"><div class="completion-status"><b id="completionText">${photos}/6 photos · ${wc}/100 words · ${hits}/6 prompts</b></div><button class="btn btn-primary" id="complete" ${ready?'':'disabled'}>${state.completed[key(a)]?'Assignment completed':'Complete assignment'}</button></div>`);
  $('#back').onclick=()=>{view.assignment=null;render()};
  $$('.info').forEach(b=>b.onclick=e=>{e.stopPropagation();b.closest('.prompt').querySelector('.detail').classList.toggle('open')});
  $$('[data-slot]').forEach(slot=>slot.onclick=e=>{if(e.target.closest('.remove'))return;openPhotoChooser(Number(slot.dataset.slot),(data,i)=>{d.photos[i]=data;state.drafts[key(a)]=d;save();renderAssignment()},a.photoPrompts[Number(slot.dataset.slot)],photoTitles[Number(slot.dataset.slot)]||`Photo ${Number(slot.dataset.slot)+1}`)});
  $$('[data-remove]').forEach(b=>b.onclick=e=>{e.stopPropagation();d.photos[Number(b.dataset.remove)]=null;state.drafts[key(a)]=d;save();renderAssignment()});
  const ta=$('#statement');
  ta.oninput=e=>{
    d.text=e.target.value;state.drafts[key(a)]=d;save();
    const currentWords=words(d.text),currentHits=a.statementPrompts.filter(p=>promptHit(d.text,concisePrompt(p))).length,currentPhotos=d.photos.filter(Boolean).length,currentReady=currentWords>=100&&currentHits===6&&currentPhotos===6;
    $('#wordcount').textContent=`${currentWords} / 100 words`;$('#promptcount').textContent=`${currentHits} / 6 prompts`;$('#completionText').textContent=`${currentPhotos}/6 photos · ${currentWords}/100 words · ${currentHits}/6 prompts`;
    a.statementPrompts.forEach((p,i)=>document.querySelector(`[data-prompt="${i}"]`)?.classList.toggle('ok',promptHit(d.text,concisePrompt(p))));
    const complete=$('#complete');complete.disabled=!currentReady;
  };
  $('#complete').onclick=()=>{let nowReady=words(d.text)>=100&&a.statementPrompts.filter(p=>promptHit(d.text,concisePrompt(p))).length===6&&d.photos.filter(Boolean).length===6;if(!nowReady)return;if(!state.completed[key(a)]){state.completed[key(a)]={date:new Date().toISOString(),title:a.title,course:course().name};state.xp=(state.xp||0)+1000;save();toast('Assignment completed — 1,000 XP awarded')}setTimeout(()=>{view.assignment=null;render()},700)};
}
function renderDocuments(){let entries=Object.entries(state.completed);shell('Documents',`<div class="card"><h2>Assignment documents</h2><p class="muted">Completed evidence can be opened and printed or saved as a PDF from your browser.</p></div>${entries.length?`<div class="list">${entries.map(([k,v])=>`<div class="assignment" data-doc="${k}"><div class="num">✓</div><div class="grow"><h3>${esc(v.course)} — ${esc(v.title)}</h3><div class="muted">Completed ${new Date(v.date).toLocaleDateString()}</div></div><span>›</span></div>`).join('')}</div>`:`<div class="card empty">No completed assignments yet.</div>`}`);$$('[data-doc]').forEach(x=>x.onclick=()=>{let [cid,num]=x.dataset.doc.split(/-(?=\d+$)/);view.courseId=cid;view.assignment=Number(num);renderAssignment();setTimeout(()=>window.print(),300)})}
function renderSettings(){shell('Settings',`<div class="card"><h2>Profile</h2><div class="form-row"><label>Apprentice name</label><input id="name" value="${esc(state.name)}"></div><div class="form-row"><label>Selected course</label><select id="setCourse">${APP_COURSES.map(c=>`<option value="${c.id}" ${c.id===view.courseId?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div><button class="btn btn-primary" id="saveSettings">Save settings</button></div><div class="card update-card"><h2>App updates</h2><p class="muted">Current version: Build ${APP_VERSION}. Check GitHub for the newest files without clearing Chrome history.</p><button class="btn btn-primary" id="checkUpdates">Check for updates</button><p class="install-note" id="updateNote">The app also checks automatically whenever it opens.</p></div><div class="card"><h2>App data</h2><p class="muted">Your evidence is stored locally on this device.</p><button class="btn btn-secondary" id="export">Export backup</button> <button class="btn btn-danger" id="reset">Reset app</button></div><div class="card install-card"><h2>Install Apprentice+</h2><p class="muted">Install the full app version directly onto this phone for quick access and offline use.</p><button class="btn btn-primary" id="installApp">Install app</button><p class="install-note" id="installNote"></p></div>`);
  $('#saveSettings').onclick=()=>{state.name=$('#name').value.trim()||'Apprentice';view.courseId=$('#setCourse').value;save();toast('Settings saved');render()};
  $('#export').onclick=()=>{let b=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='apprentice-plus-backup.json';a.click();URL.revokeObjectURL(u)};
  $('#reset').onclick=()=>{if(confirm('Delete all local Apprentice+ data?')){localStorage.removeItem('applus-state');location.reload()}};
  $('#checkUpdates').onclick=async()=>{
    const button=$('#checkUpdates'),note=$('#updateNote');
    button.disabled=true;button.textContent='Checking…';note.textContent='Checking GitHub for a newer build…';
    try{
      const response=await fetch(`version.json?t=${Date.now()}`,{cache:'no-store'});
      const latest=response.ok?await response.json():null;
      const reg=swRegistration||await navigator.serviceWorker?.getRegistration();
      if(reg){await reg.update();if(reg.waiting){note.textContent='Update found. Installing now…';reg.waiting.postMessage({type:'SKIP_WAITING'});return}}
      if(latest&&latest.version!==APP_VERSION){note.textContent=`Build ${latest.version} is available. Reloading the newest version…`;setTimeout(()=>location.reload(),500);return}
      note.textContent=`Build ${APP_VERSION} is up to date.`;
    }catch(error){note.textContent='Could not check right now. Check your internet connection and try again.'}
    finally{button.disabled=false;button.textContent='Check for updates'}
  };
  $('#installApp').onclick=async()=>{
    const note=$('#installNote');
    if(window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone){note.textContent='Apprentice+ is already installed on this phone.';return}
    if(deferredInstallPrompt){deferredInstallPrompt.prompt();const result=await deferredInstallPrompt.userChoice;note.textContent=result.outcome==='accepted'?'Apprentice+ is being installed.':'Installation was cancelled.';deferredInstallPrompt=null;return}
    note.textContent='Open this page in Chrome, then press Install app again.';
  };
}
if('serviceWorker'in navigator){
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshingForUpdate)return;refreshingForUpdate=true;location.reload()});
  navigator.serviceWorker.register('service-worker.js',{updateViaCache:'none'}).then(reg=>{
    swRegistration=reg;
    if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'});
    reg.addEventListener('updatefound',()=>{const worker=reg.installing;if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)worker.postMessage({type:'SKIP_WAITING'})})});
    reg.update().catch(()=>{});
  }).catch(()=>{});
}
render();
