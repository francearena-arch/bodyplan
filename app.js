
"use strict";
const DB_KEY="bp4_bodyplan_v2", ALPHA_KEY="bp4_alpha1", ACTIVE_KEY="bp4_active_session_v2", REST_KEY="bp4_rest_v2";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const uid=()=>crypto.randomUUID?crypto.randomUUID():"id_"+Date.now()+"_"+Math.random().toString(36).slice(2);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clone=x=>JSON.parse(JSON.stringify(x));
const now=()=>new Date().toISOString();
const localISO=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const mondayOf=d=>{let x=new Date(d);x.setHours(0,0,0,0);let day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return x};
const fmtDate=iso=>{if(!iso)return"—";let d=new Date(iso);return isNaN(d)?"—":d.toLocaleDateString("de-CH",{day:"2-digit",month:"2-digit",year:"numeric"})};
const fmtTime=s=>{s=Math.max(0,Math.floor(s||0));return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`};
let seed,starter,db,page="dashboard",selectedPlan=null,selectedDay=null,query="",heatRange=30,sessionTick=null,restTick=null,dashboardTick=null;

function getJSON(k,f=null){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}}
function setJSON(k,v){localStorage.setItem(k,JSON.stringify(v))}
function save(){db.updatedAt=now();setJSON(DB_KEY,db)}
function legacySnapshot(){let o={};for(let i=0;i<localStorage.length;i++){let k=localStorage.key(i);if(k.startsWith("bp3_"))o[k]=localStorage.getItem(k)}return o}
function download(name,data){let b=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1200)}
function backup(){download("bodyplan-backup-"+localISO()+".json",{format:"bodyplan-backup",version:2,createdAt:now(),app:db,legacy:legacySnapshot()})}
function stripTransient(o){if(!o||typeof o!=="object")return o;if(Array.isArray(o))return o.map(stripTransient);let r={};for(let [k,v] of Object.entries(o))if(!k.startsWith("_"))r[k]=stripTransient(v);return r}
function newExercise(name){return {id:"ex_"+uid(),name,muscles:{},primaryMuscle:"",equipment:"",type:"strength",notes:"",aliases:[],source:"custom",createdAt:now(),updatedAt:now()}}
function normalizePlan(p){p=clone(p);p.id=uid();p.createdAt=now();p.updatedAt=now();p.days=(p.days||[]).map(d=>({...d,id:uid(),exercises:(d.exercises||[]).map(e=>({...e,id:uid(),sets:(e.sets||[]).map(s=>({...s,id:uid()}))}))}));return p}

function migrateFresh(){
  const alpha=getJSON(ALPHA_KEY,null);
  if(alpha&&alpha.schemaVersion===1){
    let x=stripTransient(clone(alpha));
    x.schemaVersion=2;
    x.settings=x.settings||{};
    x.settings.dashboard=x.settings.dashboard||["next","week","last","body"];
    x.settings.habitsEnabled=!!x.settings.habitsEnabled;
    x.migration={...(x.migration||{}),upgradedFrom:"alpha1",upgradedAt:now()};
    return x;
  }
  const oldHist=getJSON("bp3_history",[]);
  let exercises=clone(seed.exercises);
  const byName=new Map();
  exercises.forEach(e=>{byName.set(e.name.toLowerCase(),e.id);(e.aliases||[]).forEach(a=>byName.set(a.toLowerCase(),e.id))});
  const resolve=name=>{
    let k=String(name||"").trim().toLowerCase();
    if(byName.has(k))return byName.get(k);
    let e=newExercise(name||"Unbekannte Übung");e.source="legacy";exercises.push(e);byName.set(k,e.id);return e.id
  };
  let sessions=oldHist.map((s,i)=>({id:uid(),legacyIndex:i,source:"v44",planId:null,dayId:null,title:s.title||"Training",localDate:s.localIso||String(s.iso||"").slice(0,10)||localISO(),startedAt:s.ts||s.iso||null,durationSec:s.durationSec||0,exercises:(s.exercises||[]).map(e=>({id:uid(),exerciseId:resolve(e.name),nameSnapshot:e.name,sets:(e.sets||[]).map(z=>({...clone(z),id:uid(),kind:"working",completed:true})),sessionNote:e.note||""})),original:clone(s)}));
  let p=normalizePlan(starter);p.status="active";
  return {schemaVersion:2,createdAt:now(),updatedAt:now(),exercises,plans:[p],activePlanId:p.id,sessions,settings:{dashboard:["next","week","last","body"],habitsEnabled:false},migration:{source:"v44",at:now(),historyCount:oldHist.length}};
}

function normalizeName(s){return String(s||"").trim().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"")}
function repairMuscleMappings(){
  if(!seed?.exercises||!db?.exercises)return false;
  const seedMap=new Map();
  seed.exercises.forEach(s=>{
    seedMap.set(normalizeName(s.name),s);
    (s.aliases||[]).forEach(a=>seedMap.set(normalizeName(a),s));
  });
  let changed=false;
  db.exercises.forEach(e=>{
    const s=seedMap.get(normalizeName(e.name)) || (e.aliases||[]).map(a=>seedMap.get(normalizeName(a))).find(Boolean);
    if(!s)return;
    const empty=!e.muscles||Object.keys(e.muscles).length===0;
    if(empty&&s.muscles&&Object.keys(s.muscles).length){
      e.muscles=clone(s.muscles); e.primaryMuscle=e.primaryMuscle||s.primaryMuscle||""; changed=true;
    } else if(!e.primaryMuscle&&s.primaryMuscle){e.primaryMuscle=s.primaryMuscle;changed=true}
  });
  (db.sessions||[]).forEach(sess=>(sess.exercises||[]).forEach(se=>{
    let linked=db.exercises.find(e=>e.id===se.exerciseId);
    if(linked&&linked.muscles&&Object.keys(linked.muscles).length)return;
    const s=seedMap.get(normalizeName(se.nameSnapshot));
    if(!s)return;
    if(linked){
      linked.muscles=clone(s.muscles||{});linked.primaryMuscle=linked.primaryMuscle||s.primaryMuscle||"";changed=true;
    }else{
      const existing=db.exercises.find(e=>normalizeName(e.name)===normalizeName(s.name));
      if(existing){se.exerciseId=existing.id;changed=true}
    }
  }));
  return changed;
}
function init(){
  db=getJSON(DB_KEY,null);
  if(!db){db=migrateFresh()}
  db.schemaVersion=2;
  db.settings=db.settings||{dashboard:["next","week","last","body"],habitsEnabled:false};
  db.sessions=db.sessions||[];db.plans=db.plans||[];db.exercises=db.exercises||[];
  repairMuscleMappings();
  save();bindShell();render();restoreActiveBanner();
}
function activePlan(){return db.plans.find(p=>p.id===db.activePlanId)||db.plans.find(p=>p.status==="active")||db.plans[0]}
function plan(){return db.plans.find(p=>p.id===selectedPlan)}
function day(){return plan()?.days.find(d=>d.id===selectedDay)}
function ex(id){return db.exercises.find(e=>e.id===id)}
function currentWeekSessions(){
  const start=mondayOf(new Date()).getTime();
  return db.sessions.filter(s=>s.planId===activePlan()?.id && new Date(s.startedAt||s.localDate).getTime()>=start);
}
function nextDay(){
  const p=activePlan(); if(!p?.days?.length)return null;
  const completed=new Set(currentWeekSessions().map(s=>s.dayId));
  return p.days.find(d=>!completed.has(d.id))||p.days[0];
}
function lastSession(){return [...db.sessions].sort((a,b)=>new Date(b.startedAt||b.localDate)-new Date(a.startedAt||a.localDate))[0]||null}
function latestBody(){
  const weight=getJSON("bp3_bodyWeightHistory",[]), fat=getJSON("bp3_bodyFatHistory",[]);
  const pick=a=>Array.isArray(a)&&a.length?a[a.length-1]:null;
  return {weight:pick(weight),fat:pick(fat)}
}
function bodyVal(x){if(x==null)return null;if(typeof x==="number")return x;return x.value??x.weight??x.kg??x.bodyFat??null}

function openDrawer(){ $("#drawer").classList.add("open");$("#drawerBackdrop").classList.add("open");$("#drawer").setAttribute("aria-hidden","false") }
function closeDrawer(){ $("#drawer").classList.remove("open");$("#drawerBackdrop").classList.remove("open");$("#drawer").setAttribute("aria-hidden","true") }
function bindShell(){
  $("#brandHome").onclick=()=>{page="dashboard";selectedPlan=null;selectedDay=null;closeDrawer();render()};
  $("#menuBtn").onclick=openDrawer;$("#closeDrawer").onclick=closeDrawer;$("#drawerBackdrop").onclick=closeDrawer;
  $$(".drawer-nav button[data-page]").forEach(b=>b.onclick=()=>{page=b.dataset.page;selectedPlan=null;selectedDay=null;closeDrawer();render()});
  $("#backupBtn").onclick=backup;$("#importBtn").onclick=()=>$("#importFile").click();
  $("#importFile").onchange=importBackup;
  $("#closeSession").onclick=closeSession;
  $("#finishSession").onclick=finishSession;$("#abortSession").onclick=abortSession;
  $$(".rest-actions button").forEach(b=>b.onclick=()=>startRest(Number(b.dataset.rest)));
}
function render(){
  clearInterval(dashboardTick);dashboardTick=null;
  $$(".drawer-nav button[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  const views={dashboard:renderDashboard,plans:renderPlans,library:renderLibrary,history:renderHistory,progress:renderProgress,heatmap:renderHeatmap,settings:renderSettings};
  $("#app").innerHTML=(views[page]||renderDashboard)();
  bindPageActions();
  if(page==="plans"&&!selectedPlan)bindPlanSwipes();
  if(page==="dashboard")startDashboardTicker();
  if(page==="heatmap"){const scores=muscleScores(heatRange);paintHeatmaps(scores,Math.max(0,...Object.values(scores)))}
}
function bindPageActions(){
  $$("[data-action]").forEach(el=>{
    const ev=(["INPUT","TEXTAREA","SELECT"].includes(el.tagName))?"change":"click";
    el.addEventListener(ev,()=>handleAction(el.dataset.action,el))
  });
  const s=$("#librarySearch");if(s)s.addEventListener("input",()=>{query=s.value;render()});
  $$(".range-tabs button").forEach(b=>b.onclick=()=>{heatRange=Number(b.dataset.range);render()});
}
function btn(label,action,cls="secondary"){return `<button class="${cls}" data-action="${action}">${esc(label)}</button>`}
function field(label,value,action,type="text"){return `<div class="form-field"><label>${esc(label)}</label><input type="${type}" value="${esc(value)}" data-action="${action}"></div>`}

function sessionSetStats(a){
  const work=(a?.exercises||[]).flatMap(e=>(e.sets||[]).filter(s=>s.kind!=="warmup"));
  return {done:work.filter(s=>s.completed).length,total:work.length};
}
function dashboardActiveCard(active){
  const stats=sessionSetStats(active), elapsed=Math.max(0,(Date.now()-new Date(active.startedAt).getTime())/1000);
  return `<div class="card active-workout-card">
    <div class="eyebrow"><span class="active-pulse"></span>Training läuft</div>
    <div class="hero-title">${esc(active.title||"Training")}</div>
    <div class="muted">${esc(active.planName||"")}</div>
    <div class="active-session-meta">
      <div><span>Zeit</span><strong id="activeElapsedDashboard">${fmtTime(elapsed)}</strong></div>
      <div><span>Sätze</span><strong>${stats.done} / ${stats.total}</strong></div>
    </div>
    <div class="actions">${btn("Training fortsetzen","start:"+active.dayId,"primary")}</div>
  </div>`;
}
function startDashboardTicker(){
  const el=$("#activeElapsedDashboard"),a=getJSON(ACTIVE_KEY,null);if(!el||!a)return;
  const tick=()=>{const node=$("#activeElapsedDashboard");if(!node)return;node.textContent=fmtTime((Date.now()-new Date(a.startedAt).getTime())/1000)};
  tick();dashboardTick=setInterval(tick,1000);
}
function renderDashboard(){
  const p=activePlan(), n=nextDay(), week=currentWeekSessions(), last=lastSession(), body=latestBody(), cards=db.settings.dashboard||[], active=getJSON(ACTIVE_KEY,null);
  let html=`<div class="dashboard-intro"><div class="eyebrow">BodyPlan</div><h1 class="page-title">${active?"Training in progress":"Dein Training"}</h1></div>`;
  if(active)html+=dashboardActiveCard(active);
  else if(cards.includes("next"))html+=`<div class="workout-hero">
    <div class="eyebrow">Nächste Einheit</div>
    <div class="hero-title">${esc(n?`${n.label||""} · ${n.name}`:"Plan auswählen")}</div>
    <div class="muted">${esc(p?.name||"Kein aktiver Plan")}</div>
    ${n?`<div class="hero-meta">
      <span class="hero-chip"><strong>${n.exercises?.length||0}</strong> Übungen</span>
      ${p?.targetMinutes?`<span class="hero-chip">ca. <strong>${p.targetMinutes}</strong> Min</span>`:""}
      <span class="hero-chip"><strong>${week.length}</strong> / ${p?.days?.length||0} diese Woche</span>
    </div>
    <div class="actions">${btn("Training starten","start:"+n.id,"primary")}${btn("Plan ansehen","openplan:"+p.id)}</div>`:""}
  </div>`;
  if(cards.includes("week"))html+=`<div class="card"><div class="eyebrow">Wochenfortschritt</div><div class="kpi">${week.length} / ${p?.days?.length||0}</div><div class="bar"><span style="width:${Math.min(100,(week.length/(p?.days?.length||1))*100)}%"></span></div><div class="muted" style="margin-top:10px">${week.length===0?"Die Woche beginnt mit deiner ersten Einheit.":week.length>=(p?.days?.length||0)?"Trainingswoche abgeschlossen.":"Noch "+((p?.days?.length||0)-week.length)+" Einheit"+(((p?.days?.length||0)-week.length)===1?"":"en")+" offen."}</div></div>`;
  if(cards.includes("last"))html+=`<div class="card"><div class="eyebrow">Letztes Training</div>${last?`<div class="hero-title" style="font-size:24px">${esc(last.title)}</div><div class="muted">${fmtDate(last.startedAt||last.localDate)}${last.durationSec?` · ${Math.round(last.durationSec/60)} Min`:``}</div><div class="actions">${btn("Historie öffnen","page:history")}</div>`:`<div class="empty">Noch kein Training gespeichert.</div>`}</div>`;
  if(cards.includes("body"))html+=`<div class="card"><div class="eyebrow">Körper</div><div class="grid2" style="margin-top:10px"><div><div class="small">Gewicht</div><div class="kpi" style="font-size:27px">${bodyVal(body.weight)??"—"}${bodyVal(body.weight)!=null?" kg":""}</div></div><div><div class="small">KFA</div><div class="kpi" style="font-size:27px">${bodyVal(body.fat)??"—"}${bodyVal(body.fat)!=null?" %":""}</div></div></div><div class="actions">${btn("Fortschritt öffnen","page:progress")}</div></div>`;
  if(cards.includes("prs"))html+=`<div class="card"><div class="eyebrow">Persönliche Rekorde</div><div class="muted" style="margin-top:8px">Rekorde werden aus deinen gespeicherten Arbeitssätzen abgeleitet.</div><div class="actions">${btn("Historie öffnen","page:history")}</div></div>`;
  if(cards.includes("heatmap"))html+=`<div class="card"><div class="eyebrow">Muskelbelastung</div><div class="muted" style="margin-top:8px">Sieh, welche Muskelgruppen dein Training zuletzt am stärksten belastet hat.</div><div class="actions">${btn("Heatmap öffnen","page:heatmap")}</div></div>`;
  if(cards.includes("habits")&&db.settings.habitsEnabled)html+=`<div class="card"><div class="eyebrow">Gewohnheiten</div><div class="muted" style="margin-top:8px">Deine Daily-Consistency-Daten bleiben optional verfügbar.</div></div>`;
  return html;
}
function planListCard(p){
 const active=p.id===db.activePlanId;
 return `<div class="swipe-row" data-plan-swipe="${esc(p.id)}"><div class="swipe-actions"><button class="swipe-delete" data-action="deleteplan:${esc(p.id)}">Löschen</button></div><div class="card swipe-face"><div class="row"><div><div class="eyebrow">${active?"Aktiver Plan":"Plan"}</div><div class="plan-card-title">${esc(p.name)}</div><div class="muted">${p.days.length} Einheiten</div></div>${btn("Öffnen","openplan:"+p.id)}</div></div></div>`;
}
function renderPlans(){
 if(selectedPlan){
  const p=plan();if(!p){selectedPlan=null;return renderPlans()}
  return `<div class="row"><button class="link-btn" data-action="allplans">‹ Alle Pläne</button><span class="tag">${esc(p.status||"draft")}</span></div>
  <div class="eyebrow" style="margin-top:18px">Trainingsplan</div><h1 class="page-title">${esc(p.name)}</h1>
  ${field("Planname",p.name,"planname:"+p.id)}
  <div class="actions">${btn("Als aktiven Plan setzen","activate:"+p.id,"primary")}${btn("Duplizieren","duplicate:"+p.id)}${btn(p.status==="archived"?"Reaktivieren":"Archivieren","archive:"+p.id)}${btn("Plan löschen","deleteplan:"+p.id,"mini danger")}</div>
  <div class="section-head"><h2>Einheiten</h2>${btn("+ Einheit","addday","mini")}</div>
  ${p.days.map(d=>renderDayCard(d)).join("")}
  <div class="form-field"><label>Planregeln</label><textarea data-action="planrules:${p.id}">${esc(p.rules||"")}</textarea></div>`;
 }
 const archived=db.plans.filter(p=>p.status==="archived");
 return `<div class="row top"><div><div class="eyebrow">Training</div><h1 class="page-title">Trainingspläne</h1></div>${btn("+ Neu","newplan","primary")}</div>
 ${db.plans.filter(p=>p.status!=="archived").map(planListCard).join("")}
 ${archived.length?`<details class="archive-fold"><summary>Archiv <span>${archived.length}</span></summary><div class="archive-content">${archived.map(planListCard).join("")}</div></details>`:""}`;
}
function bindPlanSwipes(){
 document.querySelectorAll(".swipe-row").forEach(row=>{
  const face=row.querySelector(".swipe-face");let startX=0,startY=0,origin=0,dragging=false,tracking=false;
  const set=x=>{face.style.transform=`translateX(${x}px)`;row.classList.toggle("revealed",x<0)};
  row.addEventListener("touchstart",e=>{if(e.target.closest("button"))return;startX=e.touches[0].clientX;startY=e.touches[0].clientY;origin=row.classList.contains("revealed")?-92:0;tracking=true;dragging=false},{passive:true});
  row.addEventListener("touchmove",e=>{if(!tracking)return;const dx=e.touches[0].clientX-startX,dy=e.touches[0].clientY-startY;if(!dragging&&Math.abs(dy)>Math.abs(dx)+8){tracking=false;return}if(Math.abs(dx)>8)dragging=true;if(dragging){e.preventDefault();set(Math.max(-92,Math.min(0,origin+dx)))}},{passive:false});
  row.addEventListener("touchend",e=>{if(!tracking)return;const dx=e.changedTouches[0].clientX-startX;set(origin+dx<-46?-92:0);tracking=false;if(dragging){face.addEventListener("click",ev=>{ev.preventDefault();ev.stopPropagation()},{capture:true,once:true})}},{passive:true});
 });
}

function renderDayCard(d){
  const open=selectedDay===d.id;
  return `<div class="card"><div class="row"><div><div class="eyebrow">${esc(d.label||"Einheit")}</div><div class="plan-card-title">${esc(d.name)}</div><div class="muted">${d.exercises.length} Übungen</div></div>${btn(open?"Schließen":"Bearbeiten","day:"+d.id,"mini")}</div>
  ${open?`<div class="grid2">${field("Name",d.name,"dayname:"+d.id)}${field("Kürzel",d.label||"","daylabel:"+d.id)}</div>
  ${d.exercises.map((e,i)=>renderPlanExercise(e,i)).join("")}
  ${btn("+ Übung hinzufügen","pickexercise","secondary full")}
  <div class="actions">${btn("Einheit duplizieren","duplicateday","mini")}${btn("Einheit entfernen","removeday","mini danger")}</div>`:""}</div>`;
}
function renderPlanExercise(e,i){
  const x=ex(e.exerciseId);
  return `<div class="exercise-item"><div class="row top"><div><div class="exercise-name">${i+1}. ${esc(x?.name||"Unbekannte Übung")}</div><div class="exercise-meta">${e.sets.length} Sätze · ${e.sets[0]?.repsMin??0}–${e.sets[0]?.repsMax??0} Wdh${e.supersetGroup?` · Supersatz ${esc(e.supersetGroup)}`:""}</div></div>${btn(e._open?"Schließen":"Anpassen","toggleex:"+e.id,"mini")}</div>
  ${e._open?`<div class="actions">${btn("↑","moveex:"+e.id+":-1","mini")}${btn("↓","moveex:"+e.id+":1","mini")}${btn("Duplizieren","duplicateex:"+e.id,"mini")}${btn("Entfernen","removeex:"+e.id,"mini danger")}</div>
  <div class="form-field"><label>Übung ersetzen</label><select data-action="replace:${e.id}"><option value="">Auswählen …</option>${db.exercises.filter(a=>a.id!==e.exerciseId).map(a=>`<option value="${esc(a.id)}">${esc(a.name)}</option>`).join("")}</select></div>
  <div class="form-field"><label>Supersatz-Gruppe</label><input value="${esc(e.supersetGroup||"")}" data-action="superset:${e.id}" placeholder="z. B. A"></div>
  <div class="form-field"><label>Plan-Notiz</label><textarea data-action="plannote:${e.id}">${esc(e.notes||"")}</textarea></div>
  <div class="form-field"><label>Dauerhafte Übungsnotiz</label><textarea data-action="globalnote:${e.exerciseId}">${esc(x?.notes||"")}</textarea></div>
  ${e.sets.map((s,j)=>`<div class="set-edit"><span class="small">${j+1}</span><input type="number" min="0" value="${s.repsMin??0}" data-action="setmin:${e.id}:${s.id}"><input type="number" min="0" value="${s.repsMax??0}" data-action="setmax:${e.id}:${s.id}">${btn("×","removeset:"+e.id+":"+s.id,"mini danger")}</div>`).join("")}
  ${btn("+ Satz","addset:"+e.id,"mini")}`:""}</div>`;
}

function renderLibrary(){
  const list=db.exercises.filter(e=>(e.name+" "+(seed.muscleGroups[e.primaryMuscle]||"")).toLowerCase().includes(query.toLowerCase()));
  return `<div class="row top"><div><div class="eyebrow">Training</div><h1 class="page-title">Übungsbibliothek</h1></div>${btn("+ Neu","newexercise","primary")}</div>
  <input id="librarySearch" placeholder="Übung oder Muskelgruppe suchen" value="${esc(query)}" style="margin-bottom:14px">
  ${list.map(e=>`<div class="library-card"><div class="row top"><div><div class="exercise-name">${esc(e.name)}</div><div class="exercise-meta">${esc(seed.muscleGroups[e.primaryMuscle]||"Muskelgruppe nicht zugeordnet")}${e.equipment?` · ${esc(e.equipment)}`:""}</div></div>${btn(e._open?"Schließen":"Bearbeiten","editexercise:"+e.id,"mini")}</div>
  ${e._open?renderExerciseEditor(e):""}</div>`).join("")}`;
}
function renderExerciseEditor(e){
  return `${field("Name",e.name,"exname:"+e.id)}${field("Equipment",e.equipment||"","equipment:"+e.id)}
  <div class="form-field"><label>Primäre Muskelgruppe</label><select data-action="primary:${e.id}"><option value="">Nicht zugeordnet</option>${Object.entries(seed.muscleGroups).map(([k,v])=>`<option value="${k}" ${e.primaryMuscle===k?"selected":""}>${v}</option>`).join("")}</select></div>
  <div class="form-field"><label>Dauerhafte Notiz</label><textarea data-action="globalnote:${e.id}">${esc(e.notes||"")}</textarea></div>
  <details><summary>Muskelgewichtung</summary><div class="muted" style="margin-bottom:8px">Relative Beteiligung pro Arbeitssatz von 0 bis 1.</div>${Object.entries(seed.muscleGroups).map(([k,v])=>`<div class="settings-row"><span class="small">${esc(v)}</span><input style="width:90px" type="number" min="0" max="1" step=".05" value="${e.muscles?.[k]??0}" data-action="muscle:${e.id}:${k}"></div>`).join("")}</details>`;
}

function renderHistory(){
  const sessions=[...db.sessions].sort((a,b)=>new Date(b.startedAt||b.localDate)-new Date(a.startedAt||a.localDate));
  return `<div class="eyebrow">Training</div><h1 class="page-title">Historie</h1>
  ${sessions.length?sessions.map(s=>`<div class="history-card"><div class="history-date">${fmtDate(s.startedAt||s.localDate)}</div><div class="history-title">${esc(s.title)}</div><div class="muted">${s.durationSec?Math.round(s.durationSec/60)+" Min · ":""}${s.exercises?.length||0} Übungen</div>
  <details><summary class="link-btn">Details</summary>${(s.exercises||[]).map(e=>`<div class="history-ex"><strong>${esc(e.nameSnapshot||ex(e.exerciseId)?.name||"Übung")}</strong><br>${(e.sets||[]).filter(z=>z.completed!==false).map(z=>`${z.kg??"—"} kg × ${z.reps??"—"}`).join(" · ")}</div>`).join("")}</details></div>`).join(""):`<div class="card empty">Noch keine Trainings gespeichert.</div>`}`;
}
function renderProgress(){
  const body=latestBody(), total=db.sessions.length, recent=(db.sessions||[]).filter(s=>new Date(s.startedAt||s.localDate)>new Date(Date.now()-30*864e5)).length;
  return `<div class="eyebrow">Entwicklung</div><h1 class="page-title">Fortschritt</h1>
  <div class="grid2"><div class="card"><div class="eyebrow">30 Tage</div><div class="kpi">${recent}</div><div class="muted">Trainings</div></div><div class="card"><div class="eyebrow">Gesamt</div><div class="kpi">${total}</div><div class="muted">gespeicherte Sessions</div></div></div>
  <div class="card"><div class="eyebrow">Körperdaten</div><div class="metric-list" style="margin-top:12px"><div class="metric-line"><span>Gewicht</span><strong>${bodyVal(body.weight)??"—"}${bodyVal(body.weight)!=null?" kg":""}</strong></div><div class="metric-line"><span>Körperfett</span><strong>${bodyVal(body.fat)??"—"}${bodyVal(body.fat)!=null?" %":""}</strong></div></div></div>`;
}

function muscleScores(days){
  const cutoff=Date.now()-days*864e5, scores={};
  (db.sessions||[]).filter(s=>new Date(s.startedAt||s.localDate).getTime()>=cutoff).forEach(s=>(s.exercises||[]).forEach(se=>{
    const x=ex(se.exerciseId);if(!x&&!se.musclesSnapshot)return;
    const completed=(se.sets||[]).filter(z=>z.completed!==false&&z.kind!=="warmup").length;
    for(const [m,w] of Object.entries(se.musclesSnapshot||x?.muscles||{}))scores[m]=(scores[m]||0)+completed*Number(w||0);
  }));
  return scores;
}
function level(v,max){if(!v||!max)return 0;const r=v/max;return r>.75?4:r>.5?3:r>.25?2:1}
function svgBody(view,scores,max){
  const cls=m=>`muscle-shape l${level(scores[m]||0,max)}`;
  if(view==="front")return `<svg viewBox="0 0 220 460" aria-label="Körper Vorderseite"><circle class="body-outline" cx="110" cy="35" r="24"/><path class="body-outline" d="M80 64 Q110 52 140 64 L155 185 Q142 230 136 286 L145 430 L116 430 L110 300 L104 430 L75 430 L84 286 Q78 230 65 185 Z"/><path class="${cls("chest")}" d="M78 83 Q95 68 108 84 L106 125 Q88 132 75 115 Z"/><path class="${cls("chest")}" d="M142 83 Q125 68 112 84 L114 125 Q132 132 145 115 Z"/><path class="${cls("front_delts")}" d="M66 79 Q72 62 91 66 L82 100 Q69 102 62 91 Z"/><path class="${cls("front_delts")}" d="M154 79 Q148 62 129 66 L138 100 Q151 102 158 91 Z"/><path class="${cls("biceps")}" d="M58 104 Q70 96 78 106 L70 157 Q61 161 53 150 Z"/><path class="${cls("biceps")}" d="M162 104 Q150 96 142 106 L150 157 Q159 161 167 150 Z"/><path class="${cls("abs")}" d="M91 130 Q110 122 129 130 L128 205 Q110 216 92 205 Z"/><path class="${cls("quads")}" d="M83 232 Q98 220 106 239 L103 330 Q86 337 78 321 Z"/><path class="${cls("quads")}" d="M137 232 Q122 220 114 239 L117 330 Q134 337 142 321 Z"/><path class="${cls("calves")}" d="M79 334 Q94 328 101 344 L96 414 Q82 422 74 405 Z"/><path class="${cls("calves")}" d="M141 334 Q126 328 119 344 L124 414 Q138 422 146 405 Z"/></svg>`;
  return `<svg viewBox="0 0 220 460" aria-label="Körper Rückseite"><circle class="body-outline" cx="110" cy="35" r="24"/><path class="body-outline" d="M80 64 Q110 52 140 64 L155 185 Q142 230 136 286 L145 430 L116 430 L110 300 L104 430 L75 430 L84 286 Q78 230 65 185 Z"/><path class="${cls("traps")}" d="M88 66 L110 57 L132 66 L124 106 L96 106 Z"/><path class="${cls("rear_delts")}" d="M65 79 Q73 61 91 67 L83 100 Q69 103 62 91 Z"/><path class="${cls("rear_delts")}" d="M155 79 Q147 61 129 67 L137 100 Q151 103 158 91 Z"/><path class="${cls("lats")}" d="M82 103 Q98 91 107 106 L103 177 Q84 180 74 157 Z"/><path class="${cls("lats")}" d="M138 103 Q122 91 113 106 L117 177 Q136 180 146 157 Z"/><path class="${cls("upper_back")}" d="M94 106 Q110 98 126 106 L123 170 Q110 181 97 170 Z"/><path class="${cls("triceps")}" d="M58 104 Q70 96 78 106 L70 157 Q61 161 53 150 Z"/><path class="${cls("triceps")}" d="M162 104 Q150 96 142 106 L150 157 Q159 161 167 150 Z"/><path class="${cls("glutes")}" d="M86 191 Q102 179 108 198 L105 234 Q89 242 80 224 Z"/><path class="${cls("glutes")}" d="M134 191 Q118 179 112 198 L115 234 Q131 242 140 224 Z"/><path class="${cls("hamstrings")}" d="M82 236 Q98 228 105 244 L102 329 Q85 335 78 319 Z"/><path class="${cls("hamstrings")}" d="M138 236 Q122 228 115 244 L118 329 Q135 335 142 319 Z"/><path class="${cls("calves")}" d="M79 334 Q94 328 101 344 L96 414 Q82 422 74 405 Z"/><path class="${cls("calves")}" d="M141 334 Q126 328 119 344 L124 414 Q138 422 146 405 Z"/></svg>`;
}
function anatomyZones(view,scores,max){
  const lv=m=>level(scores[m]||0,max);
  if(view==="front")return `
    <span class="heat-zone z-chest l${lv("chest")}"></span>
    <span class="heat-zone z-front-delts-l l${lv("front_delts")}"></span><span class="heat-zone z-front-delts-r l${lv("front_delts")}"></span>
    <span class="heat-zone z-side-delts-l l${lv("side_delts")}"></span><span class="heat-zone z-side-delts-r l${lv("side_delts")}"></span>
    <span class="heat-zone z-biceps-l l${lv("biceps")}"></span><span class="heat-zone z-biceps-r l${lv("biceps")}"></span>
    <span class="heat-zone z-forearms-l l${lv("forearms")}"></span><span class="heat-zone z-forearms-r l${lv("forearms")}"></span>
    <span class="heat-zone z-abs l${lv("abs")}"></span>
    <span class="heat-zone z-obliques-l l${lv("obliques")}"></span><span class="heat-zone z-obliques-r l${lv("obliques")}"></span>
    <span class="heat-zone z-quads-l l${lv("quads")}"></span><span class="heat-zone z-quads-r l${lv("quads")}"></span>
    <span class="heat-zone z-calves-l l${lv("calves")}"></span><span class="heat-zone z-calves-r l${lv("calves")}"></span>`;
  return `
    <span class="heat-zone z-traps l${lv("traps")}"></span>
    <span class="heat-zone z-rear-delts-l l${lv("rear_delts")}"></span><span class="heat-zone z-rear-delts-r l${lv("rear_delts")}"></span>
    <span class="heat-zone z-side-delts-l l${lv("side_delts")}"></span><span class="heat-zone z-side-delts-r l${lv("side_delts")}"></span>
    <span class="heat-zone z-upper-back l${lv("upper_back")}"></span>
    <span class="heat-zone z-lats l${lv("lats")}"></span>
    <span class="heat-zone z-erectors l${lv("erectors")}"></span>
    <span class="heat-zone z-triceps-l l${lv("triceps")}"></span><span class="heat-zone z-triceps-r l${lv("triceps")}"></span>
    <span class="heat-zone z-glutes l${lv("glutes")}"></span>
    <span class="heat-zone z-hamstrings-l l${lv("hamstrings")}"></span><span class="heat-zone z-hamstrings-r l${lv("hamstrings")}"></span>
    <span class="heat-zone z-calves-l l${lv("calves")}"></span><span class="heat-zone z-calves-r l${lv("calves")}"></span>`;
}
function anatomyView(view,scores,max){
 const label=view==="front"?"Vorderseite":"Rückseite";
 return `<div class="anatomy-card"><div class="eyebrow">${label}</div><div class="anatomy-wrap anatomy-canvas-wrap"><canvas class="heat-canvas" data-heat-view="${view}" width="768" height="1024" role="img" aria-label="Anatomische Muskelansicht ${label}"></canvas></div></div>`;
}
const HEAT_GROUPS=["chest", "lats", "upper_back", "traps", "front_delts", "side_delts", "rear_delts", "biceps", "triceps", "forearms", "abs", "obliques", "erectors", "quads", "hamstrings", "glutes", "calves"];
const heatImages={};
function loadHeatImage(src){
 if(!heatImages[src])heatImages[src]=new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src});
 return heatImages[src];
}
async function paintHeatmaps(scores,max){
 for(const canvas of document.querySelectorAll("[data-heat-view]")){
  const view=canvas.dataset.heatView,ctx=canvas.getContext("2d");
  if(!ctx)continue;
  try{
   const [base,mask]=await Promise.all([loadHeatImage("assets/heatmap-"+view+".png"),loadHeatImage("assets/heatmap-mask-"+view+".png")]);
   if(!canvas.isConnected)continue;
   const w=768,h=1024;ctx.clearRect(0,0,w,h);ctx.drawImage(base,0,0,w,h);
   const off=document.createElement("canvas");off.width=w;off.height=h;
   const oc=off.getContext("2d",{willReadFrequently:true});oc.drawImage(mask,0,0,w,h);
   const data=oc.getImageData(0,0,w,h),a=data.data;
   for(let i=0;i<a.length;i+=4){
    const group=HEAT_GROUPS[a[i]-1],v=group?Number(scores[group]||0):0;
    if(!v||!max||!a[i+1]){a[i+3]=0;continue}
    const r=v/max,coverage=a[i+1]/255;
    const c=r>.75?[239,72,49]:r>.5?[235,124,49]:r>.25?[225,165,62]:[206,174,94];
    a[i]=c[0];a[i+1]=c[1];a[i+2]=c[2];a[i+3]=Math.round((r>.75?.72:r>.5?.60:r>.25?.48:.35)*255*coverage);
   }
   oc.putImageData(data,0,0);ctx.drawImage(off,0,0);
  }catch(err){console.error("Heatmap asset could not be loaded",err)}
 }
}

function completedSetsInRange(days){
  const cutoff=Date.now()-days*864e5;
  return (db.sessions||[]).filter(s=>new Date(s.startedAt||s.localDate).getTime()>=cutoff)
    .reduce((sum,s)=>sum+(s.exercises||[]).reduce((n,e)=>n+(e.sets||[]).filter(z=>z.kind!=="warmup"&&z.completed!==false).length,0),0);
}
function renderHeatmap(){
 const scores=muscleScores(heatRange),max=Math.max(0,...Object.values(scores)),totalSets=completedSetsInRange(heatRange);
 const ranked=Object.entries(scores).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
 return `<div class="eyebrow">Analyse</div><h1 class="page-title">Muskel-Heatmap</h1>
 <div class="range-tabs"><button data-range="30" class="${heatRange===30?"active":""}">30 Tage</button><button data-range="90" class="${heatRange===90?"active":""}">90 Tage</button><button data-range="365" class="${heatRange===365?"active":""}">12 Monate</button></div>
 <div class="heat-summary"><div><strong>${totalSets}</strong><span>Arbeitssätze</span></div><div><strong>${ranked.length}</strong><span>Muskelgruppen</span></div></div>
 <div class="heat-layout">${anatomyView("front",scores,max)}${anatomyView("back",scores,max)}</div>
 <div class="card" style="margin-top:14px"><div class="eyebrow">Deine Muskelbelastung</div>
 <p class="muted" style="margin:9px 0 15px">Je länger der Balken, desto stärker wurde die Muskelgruppe im gewählten Zeitraum beansprucht.</p>
 ${ranked.length?`<div class="muscle-rank">${ranked.map(([m,v])=>`<div class="muscle-simple"><div class="muscle-simple-head"><span>${esc(seed.muscleGroups[m]||m)}</span><strong>${Math.round(v/max*100)}%</strong></div><div class="bar"><span style="width:${Math.round(v/max*100)}%"></span></div></div>`).join("")}</div>`:`<div class="empty">Für diesen Zeitraum liegen noch keine auswertbaren Trainings vor.</div>`}
 <div class="heat-legend-scale"><div><i></i>Niedrig</div><div><i></i>Moderat</div><div><i></i>Hoch</div><div><i></i>Sehr hoch</div></div>
 <details class="heat-method"><summary>Wie wird die Belastung berechnet?</summary><p>BodyPlan zählt absolvierte Arbeitssätze und gewichtet sie nach der Muskelbeteiligung der Übung. Ein Satz kann mehrere Muskelgruppen beanspruchen. Die Prozentwerte vergleichen die Muskelgruppen innerhalb des gewählten Zeitraums: 100 % ist die am stärksten belastete Gruppe. Sie sind keine Messung von Muskelwachstum, Erholung oder Trainingsqualität.</p><p>Beispiel: 3 Sätze Bankdrücken mit Brustgewichtung 1,0 ergeben 3 Reizpunkte. Eine sekundäre Gewichtung von 0,5 ergibt 1,5 Punkte. Historische Übungen ohne eindeutige Zuordnung werden nicht geschätzt.</p></details>
 </div>`;
}
function renderSettings(){
  const opts=[["next","Nächste Einheit"],["week","Wochenfortschritt"],["last","Letztes Training"],["body","Körperfortschritt"],["prs","Persönliche Rekorde"],["heatmap","Muskelbelastung"],["habits","Gewohnheiten"]];
  return `<div class="eyebrow">BodyPlan</div><h1 class="page-title">Einstellungen</h1>
  <div class="card"><div class="section-head" style="margin:0 0 8px"><h2>Dashboard</h2></div>${opts.map(([k,l])=>{let on=db.settings.dashboard.includes(k);return `<div class="settings-row"><span>${esc(l)}</span><button class="toggle ${on?"on":""}" data-action="tile:${k}" aria-label="${esc(l)}"></button></div>`}).join("")}</div>
  <div class="card"><h2 style="margin:0 0 8px;font-size:19px">Gewohnheiten</h2><div class="settings-row"><div><strong>Daily Challenge</strong><div class="muted">Optional anzeigen, historische Daten bleiben erhalten.</div></div><button class="toggle ${db.settings.habitsEnabled?"on":""}" data-action="habits"></button></div></div>
  <div class="card"><h2 style="margin:0 0 8px;font-size:19px">Daten</h2><div class="muted">Deine Daten werden weiterhin lokal auf diesem Gerät gespeichert.</div><div class="actions">${btn("Backup erstellen","backup","primary")}${btn("Backup importieren","import")}</div></div>`;
}

function handleAction(a,el){
  const [op,id,arg]=a.split(":");
  if(op==="page"){page=id;return render()}
  if(op==="backup")return backup();
  if(op==="import")return $("#importFile").click();
  if(op==="allplans"){selectedPlan=null;selectedDay=null;return render()}
  if(op==="openplan"){selectedPlan=id;selectedDay=null;page="plans";return render()}
  if(op==="day"){selectedDay=selectedDay===id?null:id;return render()}
  if(op==="start")return openSession(id);
  if(op==="editexercise"){let e=ex(id);e._open=!e._open;return render()}
  if(op==="toggleex"){let e=day()?.exercises.find(x=>x.id===id);if(e)e._open=!e._open;return render()}
  if(op==="newexercise"){let n=prompt("Name der neuen Übung");if(!n?.trim())return;db.exercises.push(newExercise(n.trim()));save();return render()}
  if(op==="newplan"){let n=prompt("Name des Trainingsplans");if(!n?.trim())return;let p=normalizePlan({name:n.trim(),status:"draft",days:[],rules:""});db.plans.push(p);selectedPlan=p.id;save();return render()}
  if(op==="activate"){db.plans.forEach(p=>{if(p.status==="active")p.status="draft"});let p=plan();p.status="active";db.activePlanId=p.id;save();return render()}
  if(op==="deleteplan"){
    const target=db.plans.find(p=>p.id===id);if(!target)return;
    if(id===db.activePlanId){alert("Aktiven Plan zuerst wechseln oder archivieren.");return}
    if(getJSON(ACTIVE_KEY,null)?.planId===id){alert("Dieser Plan wird gerade trainiert. Beende oder verwerfe zuerst das Training.");return}
    if(!confirm(`„${target.name}“ endgültig löschen? Gespeicherte Trainings und Übungsdaten bleiben erhalten.`))return;
    db.plans=db.plans.filter(p=>p.id!==id);if(selectedPlan===id){selectedPlan=null;selectedDay=null}
    save();return render();
  }
  if(op==="archive"){let p=plan();p.status=p.status==="archived"?"draft":"archived";if(db.activePlanId===p.id&&p.status==="archived")db.activePlanId=null;save();return render()}
  if(op==="duplicate"){let p=normalizePlan(plan());p.name+=" · Kopie";p.status="draft";db.plans.push(p);selectedPlan=p.id;selectedDay=null;save();return render()}
  if(op==="addday"){let d={id:uid(),name:"Neue Einheit",label:String(plan().days.length+1),weekday:null,exercises:[]};plan().days.push(d);selectedDay=d.id;save();return render()}
  if(op==="duplicateday"){let d=clone(day());d.id=uid();d.name+=" · Kopie";d.exercises.forEach(e=>{e.id=uid();e.sets.forEach(s=>s.id=uid())});plan().days.push(d);selectedDay=d.id;save();return render()}
  if(op==="removeday"){if(confirm("Einheit aus dem Plan entfernen? Gespeicherte Trainings bleiben erhalten.")){plan().days=plan().days.filter(d=>d.id!==selectedDay);selectedDay=null;save();render()}return}
  if(op==="pickexercise"){
    let n=prompt("Übung suchen");if(n===null)return;
    let m=db.exercises.filter(e=>e.name.toLowerCase().includes(n.toLowerCase()));
    if(!m.length){if(!confirm("Keine Übung gefunden. Neue Übung anlegen?"))return;let e=newExercise(n.trim());if(!e.name)return;db.exercises.push(e);m=[e]}
    let choice=m.length===1?m[0]:m[Number(prompt(m.slice(0,25).map((e,i)=>`${i+1} · ${e.name}`).join("\n")+"\n\nNummer wählen"))-1];
    if(!choice)return;
    day().exercises.push({id:uid(),exerciseId:choice.id,sets:[1,2,3].map(()=>({id:uid(),kind:"working",repsMin:8,repsMax:12})),alternatives:[],supersetGroup:null,notes:""});save();return render()
  }
  const entry=()=>day()?.exercises.find(e=>e.id===id);
  if(op==="moveex"){let arr=day().exercises,i=arr.findIndex(e=>e.id===id),j=i+Number(arg);if(j>=0&&j<arr.length){[arr[i],arr[j]]=[arr[j],arr[i]];save();render()}return}
  if(op==="duplicateex"){let e=clone(entry());e.id=uid();e.sets.forEach(s=>s.id=uid());day().exercises.splice(day().exercises.findIndex(x=>x.id===id)+1,0,e);save();return render()}
  if(op==="removeex"){day().exercises=day().exercises.filter(e=>e.id!==id);save();return render()}
  if(op==="addset"){let e=entry(),s=clone(e.sets.at(-1)||{kind:"working",repsMin:8,repsMax:12});s.id=uid();e.sets.push(s);save();return render()}
  if(op==="removeset"){let e=entry();e.sets=e.sets.filter(s=>s.id!==arg);save();return render()}
  if(op==="tile"){let arr=db.settings.dashboard,on=arr.includes(id);db.settings.dashboard=on?arr.filter(x=>x!==id):[...arr,id];save();return render()}
  if(op==="habits"){db.settings.habitsEnabled=!db.settings.habitsEnabled;save();return render()}
  if(op==="replace"){if(el.value){entry().exerciseId=el.value;save()}return render()}
  let val=el.type==="checkbox"?el.checked:el.value;
  if(op==="planname"||op==="planrules"){let p=db.plans.find(p=>p.id===id);p[op==="planname"?"name":"rules"]=val;save();return}
  if(op==="dayname"||op==="daylabel"){day()[op==="dayname"?"name":"label"]=val;save();return}
  if(op==="exname"||op==="equipment"||op==="primary"||op==="globalnote"){let e=ex(id);e[{exname:"name",equipment:"equipment",primary:"primaryMuscle",globalnote:"notes"}[op]]=val;e.updatedAt=now();save();return}
  if(op==="muscle"){let e=ex(id),v=Math.max(0,Math.min(1,Number(val)||0));if(v)e.muscles[arg]=v;else delete e.muscles[arg];save();return}
  if(op==="superset"||op==="plannote"){entry()[op==="superset"?"supersetGroup":"notes"]=val||null;save();return}
  if(op==="setmin"||op==="setmax"){let s=entry().sets.find(s=>s.id===arg);s[op==="setmin"?"repsMin":"repsMax"]=Math.max(0,Number(val)||0);save();return}
}

function lastExercisePerformance(exerciseId){
  const sessions=[...(db.sessions||[])].sort((a,b)=>new Date(b.startedAt||b.localDate)-new Date(a.startedAt||a.localDate));
  for(const s of sessions){
    const e=(s.exercises||[]).find(x=>x.exerciseId===exerciseId);
    if(!e)continue;
    const sets=(e.sets||[]).filter(x=>x.kind!=="warmup"&&x.completed!==false&&(x.kg!==""||x.reps!==""));
    if(!sets.length)continue;
    return {date:s.startedAt||s.localDate,sets};
  }
  return null;
}
function formatLastPerformance(perf){
  if(!perf)return "";
  const parts=perf.sets.slice(0,5).map(s=>{
    const kg=String(s.kg??"").trim(), reps=String(s.reps??"").trim();
    if(kg&&reps)return `${esc(kg)} kg × ${esc(reps)}`;
    if(reps)return `${esc(reps)} Wdh`;
    if(kg)return `${esc(kg)} kg`;
    return "";
  }).filter(Boolean);
  if(!parts.length)return "";
  return `<div class="last-performance"><strong>Letztes Mal · ${fmtDate(perf.date)}</strong><br>${parts.join(" · ")}</div>`;
}
function updateSessionProgress(active){
  const stats=sessionSetStats(active), bar=$("#sessionProgressBar");
  if(bar)bar.style.width=(stats.total?Math.round(stats.done/stats.total*100):0)+"%";
}
function openSession(dayId){
  const p=activePlan(), d=p?.days.find(x=>x.id===dayId);if(!d)return;
  let active=getJSON(ACTIVE_KEY,null);
  if(active&&active.dayId!==dayId){
    if(!confirm("Es läuft bereits ein anderes Training. Dieses verwerfen und die neue Einheit starten?"))return;
    localStorage.removeItem(ACTIVE_KEY);localStorage.removeItem(REST_KEY);active=null;
  }
  if(!active||active.dayId!==dayId){
    active={id:uid(),planId:p.id,dayId:d.id,title:`${d.label||""} · ${d.name}`.replace(/^ · /,""),planName:p.name,startedAt:now(),localDate:localISO(),exercises:d.exercises.map(pe=>{
      const x=ex(pe.exerciseId);
      return{id:uid(),exerciseId:pe.exerciseId,nameSnapshot:x?.name||"Übung",musclesSnapshot:clone(x?.muscles||{}),permanentNote:x?.notes||"",sessionNote:"",sets:pe.sets.map(s=>({id:uid(),kind:s.kind||"working",repsMin:s.repsMin,repsMax:s.repsMax,kg:"",reps:"",completed:false}))}
    })};
    setJSON(ACTIVE_KEY,active)
  }
  renderSession(active);
  $("#sessionOverlay").classList.add("open");
  updateSessionProgress(active);
  startElapsedTicker();
  resumeRestTicker();
}
function restoreActiveBanner(){/* Running workouts are rendered directly on the dashboard. */}
function renderSession(active){
  $("#sessionPlanLabel").textContent=active.planName||"Training";
  $("#sessionTitle").textContent=active.title||"Einheit";
  $("#sessionContent").innerHTML=active.exercises.map((e,ei)=>{
    const perf=lastExercisePerformance(e.exerciseId);
    return `<div class="session-ex">
      <div class="session-ex-head"><div><div class="session-ex-title">${esc(e.nameSnapshot)}</div><div class="exercise-meta">${e.sets.filter(s=>s.kind!=="warmup").length} Arbeitssätze</div></div></div>
      ${e.permanentNote?`<div class="muted" style="margin:7px 0 8px">${esc(e.permanentNote)}</div>`:""}
      ${formatLastPerformance(perf)}
      <div class="set-head"><span>Satz</span><span>kg</span><span>Wdh</span><span>OK</span></div>
      ${e.sets.map((s,si)=>`<div class="session-set">
        <span class="small">${s.kind==="warmup"?"W":si+1}</span>
        <input inputmode="decimal" aria-label="Gewicht Satz ${si+1}" placeholder="kg" value="${esc(s.kg)}" data-session="kg:${ei}:${si}">
        <input inputmode="numeric" aria-label="Wiederholungen Satz ${si+1}" placeholder="${s.repsMin??""}–${s.repsMax??""}" value="${esc(s.reps)}" data-session="reps:${ei}:${si}">
        <button class="done-btn ${s.completed?"done":""}" data-session="done:${ei}:${si}" aria-label="Satz ${si+1} erledigt">✓</button>
      </div>`).join("")}
      <div class="form-field"><label>Notiz für dieses Training</label><textarea data-session="note:${ei}" placeholder="Optional">${esc(e.sessionNote||"")}</textarea></div>
    </div>`;
  }).join("");
  $$("[data-session]").forEach(el=>{
    const [op,ei,si]=el.dataset.session.split(":");
    const evt=op==="done"?"click":"input";
    el.addEventListener(evt,()=>updateSessionField(op,Number(ei),si==null?null:Number(si),el))
  });
}
function updateSessionField(op,ei,si,el){
  let a=getJSON(ACTIVE_KEY,null);if(!a)return;
  if(op==="kg")a.exercises[ei].sets[si].kg=el.value;
  if(op==="reps")a.exercises[ei].sets[si].reps=el.value;
  if(op==="done"){
    a.exercises[ei].sets[si].completed=!a.exercises[ei].sets[si].completed;
    el.classList.toggle("done",a.exercises[ei].sets[si].completed);
  }
  if(op==="note")a.exercises[ei].sessionNote=el.value;
  setJSON(ACTIVE_KEY,a);
  if(op==="done")updateSessionProgress(a);
}
function startElapsedTicker(){
  clearInterval(sessionTick);
  const tick=()=>{
    let a=getJSON(ACTIVE_KEY,null), el=$("#elapsed");
    if(a&&el)el.textContent=fmtTime((Date.now()-new Date(a.startedAt).getTime())/1000)
  };
  tick();sessionTick=setInterval(tick,1000)
}
function closeSession(){
  $("#sessionOverlay").classList.remove("open");
  clearInterval(sessionTick);sessionTick=null;
  page="dashboard";selectedPlan=null;selectedDay=null;render()
}
function runRestTicker(r){
  clearInterval(restTick);
  const tick=()=>{
    let left=Math.ceil((r.endsAt-Date.now())/1000),el=$("#restTimer");
    if(el)el.textContent=fmtTime(Math.max(0,left));
    if(left<=0){clearInterval(restTick);restTick=null;localStorage.removeItem(REST_KEY)}
  };
  tick();if(r.endsAt>Date.now())restTick=setInterval(tick,250)
}
function resumeRestTicker(){
  const r=getJSON(REST_KEY,null);
  if(r?.endsAt>Date.now())runRestTicker(r);
  else{localStorage.removeItem(REST_KEY);const el=$("#restTimer");if(el)el.textContent="00:00"}
}
function startRest(sec){
  const r={endsAt:Date.now()+sec*1000};setJSON(REST_KEY,r);runRestTicker(r)
}
function finishSession(){
  let a=getJSON(ACTIVE_KEY,null);if(!a)return;
  const workSets=a.exercises.flatMap(e=>e.sets).filter(s=>s.kind!=="warmup");
  if(!workSets.some(s=>s.completed)){if(!confirm("Noch kein Satz ist als erledigt markiert. Training trotzdem speichern?"))return}
  a.durationSec=Math.round((Date.now()-new Date(a.startedAt).getTime())/1000);a.savedAt=now();a.source="bodyplan2";
  db.sessions.push(a);save();
  localStorage.removeItem(ACTIVE_KEY);localStorage.removeItem(REST_KEY);
  clearInterval(restTick);restTick=null;
  $("#sessionOverlay").classList.remove("open");clearInterval(sessionTick);sessionTick=null;
  page="dashboard";selectedPlan=null;selectedDay=null;render()
}
function abortSession(){
  if(!confirm("Laufendes Training wirklich verwerfen?"))return;
  localStorage.removeItem(ACTIVE_KEY);localStorage.removeItem(REST_KEY);
  clearInterval(restTick);restTick=null;
  $("#sessionOverlay").classList.remove("open");clearInterval(sessionTick);sessionTick=null;
  page="dashboard";selectedPlan=null;selectedDay=null;render()
}
async function importBackup(e){
  const f=e.target.files[0];if(!f)return;
  try{const data=JSON.parse(await f.text()), incoming=data.app||data.alpha;if(!incoming||![1,2].includes(incoming.schemaVersion))throw Error("Unbekanntes Backup-Format");if(!confirm("Aktuelle BodyPlan-Daten durch dieses Backup ersetzen?"))return;backup();db=stripTransient(clone(incoming));db.schemaVersion=2;save();page="dashboard";selectedPlan=null;selectedDay=null;render()}catch(err){alert("Import fehlgeschlagen: "+err.message)}finally{e.target.value=""}
}

Promise.all(["exercise-seed.json","starter-plan.json"].map(u=>fetch(u,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error(u);return r.json()})))
.then(([s,p])=>{seed=s;starter=p;init()})
.catch(err=>{$("#app").innerHTML=`<div class="card"><div class="eyebrow">BodyPlan</div><h1 class="page-title">Start fehlgeschlagen</h1><div class="muted">${esc(err.message)}</div></div>`});
