
"use strict";
const K="bp4_alpha1",LEGACY="bp3_";
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid=()=>crypto.randomUUID?crypto.randomUUID():"id_"+Date.now()+"_"+Math.random().toString(36).slice(2);
const clone=x=>JSON.parse(JSON.stringify(x));
const now=()=>new Date().toISOString();
let seed,starter,legacy,db,page="dashboard",selectedPlan=null,selectedDay=null,query="",notice="";
const save=()=>{db.updatedAt=now();localStorage.setItem(K,JSON.stringify(db))};
function legacySnapshot(){let o={};for(let i=0;i<localStorage.length;i++){let k=localStorage.key(i);if(k.startsWith(LEGACY))o[k]=localStorage.getItem(k)}return o}
function download(name,data){let b=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function backup(){download("bodyplan-backup-"+new Date().toISOString().slice(0,10)+".json",{format:"bodyplan-backup",version:1,createdAt:now(),legacy:legacySnapshot(),alpha:db})}
function readLegacy(k,fallback){try{return JSON.parse(localStorage.getItem(LEGACY+k))??fallback}catch{return fallback}}
function slug(s){return String(s).normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function newExercise(name){return {id:"ex_"+uid(),name,muscles:{},primaryMuscle:"",equipment:"",type:"strength",notes:"",aliases:[],source:"custom",createdAt:now(),updatedAt:now()}}
function normalizePlan(p){p=clone(p);p.id=uid();p.createdAt=now();p.updatedAt=now();p.days.forEach(d=>{d.id=uid();d.exercises.forEach(e=>{e.id=uid();e.sets.forEach(s=>s.id=uid())})});return p}
function migrate(){
 const raw=legacySnapshot(),old=readLegacy("history",[]),ex=clone(seed.exercises),byName=new Map();
 ex.forEach(e=>{byName.set(e.name.toLowerCase(),e.id);(e.aliases||[]).forEach(a=>byName.set(a.toLowerCase(),e.id))});
 const unresolved=[];
 function resolve(name){let key=String(name||"").trim().toLowerCase();if(byName.has(key))return byName.get(key);let e=newExercise(name||"Unbekannte Übung");e.source="legacy";ex.push(e);byName.set(key,e.id);unresolved.push(e.id);return e.id}
 const fieldNotes={};
 for(const w of [...legacy.workouts,...legacy.altWorkouts])w.ex.forEach((e,i)=>{let v=raw[LEGACY+"field_"+w.id+"_"+i+"_0_note"];if(v){try{v=JSON.parse(v)}catch{}if(typeof v==="string"&&v.trim())(fieldNotes[resolve(e[0])]??=[]).push(v.trim())}});
 ex.forEach(e=>{let notes=[...new Set(fieldNotes[e.id]||[])];if(notes.length)e.notes=notes.join("\n\n")});
 const sessions=old.map((s,i)=>({id:uid(),legacyIndex:i,legacyWid:s.wid,planId:null,dayId:null,title:s.title||"Training",startedAt:s.ts||s.iso||null,localDate:s.localIso||String(s.iso||"").slice(0,10)||null,durationSec:s.durationSec??null,source:"v44",original:clone(s),exercises:(s.exercises||[]).map(e=>({id:uid(),exerciseId:resolve(e.name),nameSnapshot:e.name,sets:(e.sets||[]).map(x=>({...clone(x),id:uid(),kind:"working",completed:true})),sessionNote:e.note||""}))}));
 const plans=[normalizePlan(starter)];
 for(const w of [...legacy.workouts,...legacy.altWorkouts]){
  plans.push(normalizePlan({name:"Legacy · "+w.title,status:"archived",days:[{name:w.title,label:w.day,weekday:null,exercises:w.ex.map(e=>({exerciseId:resolve(e[0]),sets:Array.from({length:e[2]},()=>({kind:"working",repsMin:parseInt(e[3])||0,repsMax:parseInt(String(e[3]).split("–").pop())||0})),alternatives:[],supersetGroup:null,notes:e[1]}))}],rules:w.footer||""}));
 }
 return {schemaVersion:1,createdAt:now(),updatedAt:now(),exercises:ex,plans,activePlanId:plans[0].id,sessions,legacySnapshot:raw,legacyFingerprint:JSON.stringify(raw).length,unresolved,settings:{dashboard:["next","week","last","body"],habitsEnabled:false},migration:{source:"v44",at:now(),historyCount:old.length,legacyKeyCount:Object.keys(raw).length}};
}
function init(){let stored=localStorage.getItem(K);if(stored){try{db=JSON.parse(stored);if(db.schemaVersion!==1)throw Error("Unbekannte Datenversion")}catch(e){$("content").innerHTML="<div class=warning>Die Alpha-Daten konnten nicht gelesen werden. Es wurde nichts überschrieben.</div>";return}}else{db=migrate();save()}render()}
function msg(s){notice=s;render()}
function mutate(fn){fn();save();render()}
function plan(){return db.plans.find(p=>p.id===selectedPlan)}
function day(){return plan()?.days.find(d=>d.id===selectedDay)}
function ex(id){return db.exercises.find(e=>e.id===id)}
function field(label,value,action,type="text"){return `<div class=field><label>${esc(label)}</label><input type="${type}" value="${esc(value)}" data-action="${action}"></div>`}
function button(label,action,cls=""){return `<button class="${cls}" data-action="${action}">${esc(label)}</button>`}
function render(){document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===page));$("notice").innerHTML=notice?`<div class=warning>${esc(notice)}</div>`:"";$("content").innerHTML=({dashboard:dashboard,plans:plansPage,library:libraryPage,settings:settingsPage}[page]||dashboard)()}
function dashboard(){
 let active=db.plans.find(p=>p.id===db.activePlanId),cards=db.settings.dashboard,items={
 next:`<div class=card><div class=eyebrow>Aktiver Plan</div><div class=title>${esc(active?.name||"Kein Plan")}</div><p class=muted>${active?.days.length||0} Einheiten · Trainingsstart folgt in Alpha 2</p>${button("Plan bearbeiten","openplan:"+active?.id,"primary")}</div>`,
 week:`<div class=card><div class=eyebrow>Wochenfortschritt</div><div class=title>— / ${active?.days.length||0}</div><p class=muted>Die neue Session-Engine wird in Alpha 2 angebunden. Bestehende Historie bleibt erhalten.</p></div>`,
 last:`<div class=card><div class=eyebrow>Historie</div><div class=title>${db.sessions.length}</div><p class=muted>Übernommene Sessions · unveränderte Originaldaten gespeichert</p></div>`,
 body:`<div class=card><div class=eyebrow>Körperfortschritt</div><p class=muted>Die bestehende v44-Körperdatenansicht bleibt verfügbar.</p><a class=back href="index.html">Zur bisherigen App →</a></div>`,
 prs:`<div class=card><div class=eyebrow>Persönliche Rekorde</div><p class=muted>Wird mit der neuen Trainingshistorie verbunden.</p></div>`,
 habits:`<div class=card><div class=eyebrow>Gewohnheiten</div><p class=muted>Optionales Modul. Historische Daten bleiben erhalten.</p></div>`,
 heatmap:`<div class=card><div class=eyebrow>Muskel-Heatmap</div><p class=muted>Die anatomische Darstellung folgt nach der neuen Session-Engine.</p></div>`};
 return `<div class=eyebrow>Dein Training</div><h2>Dashboard</h2>${cards.map(k=>items[k]||"").join("")}<div class=card><div class=eyebrow>Alpha 1</div><p>Bibliothek, Plan-Editor und Datenmigration sind aktiv. Die bisherige App bleibt separat nutzbar.</p>${button("Pläne öffnen","page:plans","primary")}</div>`}
function plansPage(){
 if(selectedPlan){let p=plan();if(!p){selectedPlan=null;return plansPage()}return `<div class=row>${button("‹ Alle Pläne","allplans")}<span class=pill>${esc(p.status)}</span></div><div class=spacer></div>${field("Planname",p.name,"planname:"+p.id)}<div class=actions>${button("Als aktiv setzen","activate:"+p.id,"primary")}${button("Duplizieren","duplicate:"+p.id)}${button(p.status==="archived"?"Reaktivieren":"Archivieren","archive:"+p.id)}</div><div class=spacer></div><h3>Einheiten</h3>${p.days.map(d=>dayCard(d)).join("")}${button("+ Einheit hinzufügen","addday","full outline")}<div class=spacer></div>${field("Planregeln",p.rules||"","planrules:"+p.id)}</div>`}
 return `<div class=row><h2>Trainingspläne</h2>${button("+ Neu","newplan","primary")}</div><p class=muted>Pläne sind Vorlagen. Änderungen an ihnen verändern keine gespeicherten Trainingseinheiten.</p>${db.plans.map(p=>`<div class=card><div class=row><div><div class=eyebrow>${p.status==="active"?"Aktiv":"Archiv"}</div><div class=title>${esc(p.name)}</div><div class=muted>${p.days.length} Einheiten</div></div>${button("Öffnen","openplan:"+p.id)}</div></div>`).join("")}`}
function dayCard(d){
 let open=selectedDay===d.id;
 return `<div class=card><div class=row><div><div class=eyebrow>${esc(d.label||"Einheit")}</div><h3>${esc(d.name)}</h3><div class=muted>${d.exercises.length} Übungen</div></div>${button(open?"Schließen":"Bearbeiten","day:"+d.id)}</div>${open?`<div class=spacer></div><div class=grid2>${field("Bezeichnung",d.name,"dayname:"+d.id)}${field("Tag / Kürzel",d.label||"","daylabel:"+d.id)}</div><div class=field><label>Wochentag (optional)</label><select data-action="weekday:${d.id}">${[["","Keine Vorgabe"],[1,"Montag"],[2,"Dienstag"],[3,"Mittwoch"],[4,"Donnerstag"],[5,"Freitag"],[6,"Samstag"],[0,"Sonntag"]].map(([v,l])=>`<option value="${v}" ${String(d.weekday??"")===String(v)?"selected":""}>${l}</option>`).join("")}</select></div>${d.exercises.map((e,i)=>exerciseCard(e,i)).join("")}${button("+ Übung hinzufügen","pickexercise","full outline")}<div class=actions>${button("Einheit duplizieren","duplicateday")}${button("Einheit entfernen","removeday","danger")}</div>`:""}</div>`}
function exerciseCard(e,i){
 let x=ex(e.exerciseId),choices=db.exercises.filter(a=>a.id!==e.exerciseId);
 return `<div class=excard><div class=row><div><div class=eyebrow>${i+1} · ${esc(seed.muscleGroups[x?.primaryMuscle]||"Übung")}</div><h3>${esc(x?.name||"Unbekannt")}</h3></div>${button("⋯","toggleex:"+e.id)}</div><div class=muted>${e.sets.length} Sätze · ${esc(e.sets[0]?.repsMin??0)}–${esc(e.sets[0]?.repsMax??0)} Wdh</div>${e.supersetGroup?`<span class=pill>Supersatz ${esc(e.supersetGroup)}</span>`:""}${e._open?`<div class=actions>${button("↑","moveex:"+e.id+":-1")}${button("↓","moveex:"+e.id+":1")}${button("Duplizieren","duplicateex:"+e.id)}${button("Entfernen","removeex:"+e.id,"danger")}</div><div class=field><label>Übung ersetzen</label><select data-action="replace:"+e.id"><option value="">Auswählen …</option>${choices.map(a=>`<option value="${esc(a.id)}">${esc(a.name)}</option>`).join("")}</select></div><div class=field><label>Supersatz-Gruppe (gleicher Wert verbindet Übungen)</label><input value="${esc(e.supersetGroup||"")}" data-action="superset:${e.id}" placeholder="z. B. A"></div><div class=field><label>Plan-spezifische Notiz</label><textarea data-action="plannote:${e.id}">${esc(e.notes||"")}</textarea></div><div class=field><label>Dauerhafte Übungsnotiz</label><textarea data-action="globalnote:${e.exerciseId}">${esc(x?.notes||"")}</textarea></div><div class=muted>Arbeitssätze · Aufwärmsätze separat markieren</div>${e.sets.map((s,j)=>`<div class=setrow><span class=muted>${j+1}</span><input inputmode=numeric type=number min=0 value="${s.repsMin??0}" data-action="setmin:${e.id}:${s.id}"><input inputmode=numeric type=number min=0 value="${s.repsMax??0}" data-action="setmax:${e.id}:${s.id}">${button("×","removeset:"+e.id+":"+s.id,"danger")}</div><div class=small><label class=check><input type=checkbox data-action="warmup:${e.id}:${s.id}" ${s.kind==="warmup"?"checked":""}> Aufwärmsatz</label></div>`).join("")}${button("+ Satz","addset:"+e.id,"outline")}`:""}</div>`}
function libraryPage(){
 let list=db.exercises.filter(e=>(e.name+" "+(seed.muscleGroups[e.primaryMuscle]||"")).toLowerCase().includes(query.toLowerCase()));
 return `<div class=row><h2>Übungsbibliothek</h2>${button("+ Neu","newexercise","primary")}</div><input id=search placeholder="Übung oder Muskelgruppe suchen" value="${esc(query)}"><p class=muted>${db.exercises.length} Übungen · ${db.unresolved.length} historische Zuordnungen prüfen</p>${list.map(e=>`<div class=card><div class=row><div><h3>${esc(e.name)}</h3><div class=muted>${esc(seed.muscleGroups[e.primaryMuscle]||"Nicht zugeordnet")}</div></div>${button("Bearbeiten","editexercise:"+e.id)}</div>${e._open?exerciseEditor(e):""}</div>`).join("")}`}
function exerciseEditor(e){
 return `${field("Name",e.name,"exname:"+e.id)}${field("Equipment",e.equipment||"","equipment:"+e.id)}<div class=field><label>Primäre Muskelgruppe</label><select data-action="primary:"+e.id><option value="">Nicht zugeordnet</option>${Object.entries(seed.muscleGroups).map(([k,v])=>`<option value="${k}" ${e.primaryMuscle===k?"selected":""}>${v}</option>`).join("")}</select></div><div class=muted>Geschätzte Beteiligung pro Arbeitssatz (0–1). Keine EMG- oder Wachstumsmessung.</div>${Object.entries(seed.muscleGroups).map(([k,v])=>`<div class=grid2><label class=small>${v}</label><input type=number min=0 max=1 step=.05 value="${e.muscles[k]??0}" data-action="muscle:${e.id}:${k}"></div>`).join("")}<div class=field><label>Dauerhafte Notiz</label><textarea data-action="globalnote:${e.id}">${esc(e.notes||"")}</textarea></div><div class=muted>Exercise-ID: ${esc(e.id)}</div>`}
function settingsPage(){
 let options=[["next","Nächste Einheit"],["week","Wochenfortschritt"],["last","Letztes Training / Historie"],["body","Körperfortschritt"],["prs","Persönliche Rekorde"],["habits","Gewohnheiten"],["heatmap","Heatmap-Summary"]];
 return `<h2>Einstellungen</h2><div class=card><h3>Dashboard anpassen</h3><p class=muted>Die Reihenfolge kann mit den Pfeilen verändert werden. Nicht verfügbare Analytics werden erst mit der neuen Session-Engine aktiviert.</p>${options.map(([k,l])=>`<div class=row><label class=check><input type=checkbox data-action="tile:${k}" ${db.settings.dashboard.includes(k)?"checked":""}>${l}</label><div class=actions>${button("↑","tilemove:"+k+":-1")}${button("↓","tilemove:"+k+":1")}</div></div>`).join("")}</div><div class=card><h3>Gewohnheiten</h3><label class=check><input type=checkbox data-action="habits" ${db.settings.habitsEnabled?"checked":""}> Daily Challenge aktivieren</label><p class=muted>Die bisherigen Einträge werden nicht gelöscht.</p></div><div class=card><h3>Daten & Migration</h3><p class=muted>Quelle: v44 · ${db.migration.historyCount} Sessions übernommen · ${db.migration.legacyKeyCount} Legacy-Keys beim ersten Start erkannt.</p><div class=actions>${button("Vollständiges Backup","backup","primary")}${button("Backup importieren","import")}${button("Migration prüfen","review")}</div><p class=muted>Import ersetzt ausschließlich den Alpha-Datenbestand. Legacy-Daten werden niemals automatisch zurückgeschrieben.</p></div><div class=card><h3>Zurück zur bisherigen App</h3><p class=muted>v44 bleibt unverändert nutzbar. Die neue Trainingsaufzeichnung wird erst nach dem Migrationstest freigeschaltet.</p><a class=back href="index.html">BodyPlan v44 öffnen →</a></div>`}

function findEntry(id){return day()?.exercises.find(e=>e.id===id)}
function editExercise(id){let e=ex(id);e._open=!e._open;page="library";render()}
function act(a,el){
 let [op,id,arg,extra]=a.split(":");
 if(op==="page"){page=id;selectedPlan=null;selectedDay=null;return render()}
 if(op==="backup")return backup();
 if(op==="import")return $("importFile").click();
 if(op==="review"){let current=legacySnapshot();return msg("Migration: "+db.sessions.length+" Sessions, "+db.exercises.length+" Übungen, "+db.unresolved.length+" ungeklärte Übungszuordnungen. Legacy-Keys aktuell: "+Object.keys(current).length+". Die Originaldaten sind im Backup enthalten.")}
 if(op==="allplans"){selectedPlan=null;selectedDay=null;return render()}
 if(op==="openplan"){selectedPlan=id;selectedDay=null;page="plans";return render()}
 if(op==="day"){selectedDay=selectedDay===id?null:id;return render()}
 if(op==="toggleex"){let e=findEntry(id);e._open=!e._open;return render()}
 if(op==="editexercise")return editExercise(id);
 if(op==="newexercise"){let name=prompt("Name der neuen Übung");if(!name?.trim())return;return mutate(()=>{let e=newExercise(name.trim());db.exercises.push(e);e._open=true;page="library";query=e.name})}
 if(op==="newplan"){let name=prompt("Name des Trainingsplans");if(!name?.trim())return;return mutate(()=>{let p=normalizePlan({name:name.trim(),status:"draft",days:[],rules:""});db.plans.push(p);selectedPlan=p.id;page="plans"})}
 if(op==="activate")return mutate(()=>{db.plans.forEach(p=>{if(p.status==="active")p.status="archived"});plan().status="active";db.activePlanId=id});
 if(op==="archive")return mutate(()=>{let p=plan();p.status=p.status==="archived"?"draft":"archived";if(db.activePlanId===id&&p.status==="archived")db.activePlanId=null});
 if(op==="duplicate")return mutate(()=>{let p=normalizePlan(plan());p.name+=" · Kopie";p.status="draft";db.plans.push(p);selectedPlan=p.id;selectedDay=null});
 if(op==="addday")return mutate(()=>{let d={id:uid(),name:"Neue Einheit",label:String(plan().days.length+1),weekday:null,exercises:[]};plan().days.push(d);selectedDay=d.id});
 if(op==="duplicateday")return mutate(()=>{let d=clone(day());d.id=uid();d.name+=" · Kopie";d.exercises.forEach(e=>{e.id=uid();e.sets.forEach(s=>s.id=uid())});plan().days.push(d);selectedDay=d.id});
 if(op==="removeday"){if(!confirm("Diese Einheit aus dem Plan entfernen? Historische Sessions bleiben erhalten."))return;return mutate(()=>{plan().days=plan().days.filter(d=>d.id!==selectedDay);selectedDay=null})}
 if(op==="pickexercise"){let name=prompt("Übung suchen (Name oder Teil des Namens)");if(name===null)return;let matches=db.exercises.filter(e=>e.name.toLowerCase().includes(name.toLowerCase()));if(!matches.length){if(!confirm("Keine Übung gefunden. Neue Übung anlegen?"))return;let e=newExercise(name.trim());if(!e.name)return;db.exercises.push(e);matches=[e]}let choice=matches.length===1?matches[0]:matches[Number(prompt(matches.slice(0,30).map((e,i)=>i+1+" · "+e.name).join("\n")+"\n\nNummer wählen"))-1];if(!choice)return;return mutate(()=>{day().exercises.push({id:uid(),exerciseId:choice.id,sets:[1,2,3].map(()=>({id:uid(),kind:"working",repsMin:8,repsMax:12})),alternatives:[],supersetGroup:null,notes:""})})}
 if(op==="moveex"){let arr=day().exercises,i=arr.findIndex(e=>e.id===id),j=i+Number(arg);if(j<0||j>=arr.length)return;return mutate(()=>{[arr[i],arr[j]]=[arr[j],arr[i]]})}
 if(op==="duplicateex")return mutate(()=>{let e=clone(findEntry(id));e.id=uid();e.sets.forEach(s=>s.id=uid());day().exercises.splice(day().exercises.findIndex(x=>x.id===id)+1,0,e)});
 if(op==="removeex")return mutate(()=>{day().exercises=day().exercises.filter(e=>e.id!==id)});
 if(op==="addset")return mutate(()=>{let e=findEntry(id),s=clone(e.sets.at(-1)||{kind:"working",repsMin:8,repsMax:12});s.id=uid();e.sets.push(s)});
 if(op==="removeset")return mutate(()=>{let e=findEntry(id);e.sets=e.sets.filter(s=>s.id!==arg)});
 if(op==="tilemove"){let arr=db.settings.dashboard,i=arr.indexOf(id),j=i+Number(arg);if(i<0||j<0||j>=arr.length)return;return mutate(()=>{[arr[i],arr[j]]=[arr[j],arr[i]]})}
 if(op==="tile")return mutate(()=>{let arr=db.settings.dashboard;db.settings.dashboard=el.checked?[...new Set([...arr,id])]:arr.filter(k=>k!==id)});
 if(op==="habits")return mutate(()=>db.settings.habitsEnabled=el.checked);
 const val=el.type==="checkbox"?el.checked:el.value;
 if(op==="planname"||op==="planrules")return mutate(()=>{let p=db.plans.find(p=>p.id===id);p[op==="planname"?"name":"rules"]=val;p.updatedAt=now()});
 if(["dayname","daylabel","weekday"].includes(op))return mutate(()=>{let d=day();d[op==="dayname"?"name":op==="daylabel"?"label":"weekday"]=op==="weekday"?(val===""?null:Number(val)):val});
 if(["exname","equipment","primary","globalnote"].includes(op))return mutate(()=>{let e=ex(id);e[{exname:"name",equipment:"equipment",primary:"primaryMuscle",globalnote:"notes"}[op]]=val;e.updatedAt=now()});
 if(op==="muscle")return mutate(()=>{let e=ex(id),v=Math.max(0,Math.min(1,Number(val)||0));if(v)e.muscles[arg]=v;else delete e.muscles[arg];e.updatedAt=now()});
 if(op==="replace")return mutate(()=>{if(!val)return;findEntry(id).exerciseId=val});
 if(op==="superset"||op==="plannote")return mutate(()=>findEntry(id)[op==="superset"?"supersetGroup":"notes"]=val||null);
 if(["setmin","setmax","warmup"].includes(op))return mutate(()=>{let s=findEntry(id).sets.find(s=>s.id===arg);if(op==="warmup")s.kind=val?"warmup":"working";else s[op==="setmin"?"repsMin":"repsMax"]=Math.max(0,Number(val)||0)});
}
document.addEventListener("click",e=>{let b=e.target.closest("button[data-action]");if(b)act(b.dataset.action,b)});
document.addEventListener("change",e=>{let a=e.target.dataset.action;if(a)act(a,e.target)});
document.addEventListener("input",e=>{if(e.target.id==="search"){query=e.target.value;let pos=e.target.selectionStart;render();$("search").focus();$("search").setSelectionRange(pos,pos)}else if(e.target.dataset.action&&e.target.tagName!=="SELECT"&&e.target.type!=="checkbox"){let a=e.target.dataset.action;let [op,id,arg]=a.split(":");let v=e.target.value;if(op==="globalnote"){ex(id).notes=v;save()}else if(op==="plannote"){findEntry(id).notes=v;save()}else if(op==="planname"||op==="planrules"){db.plans.find(p=>p.id===id)[op==="planname"?"name":"rules"]=v;save()}else if(op==="dayname"||op==="daylabel"){day()[op==="dayname"?"name":"label"]=v;save()}else if(op==="exname"||op==="equipment"){ex(id)[op==="exname"?"name":"equipment"]=v;save()}else if(op==="superset"){findEntry(id).supersetGroup=v;save()}else if(op==="setmin"||op==="setmax"){let s=findEntry(id).sets.find(s=>s.id===arg);s[op==="setmin"?"repsMin":"repsMax"]=Math.max(0,Number(v)||0);save()}else if(op==="muscle"){let n=Math.max(0,Math.min(1,Number(v)||0));if(n)ex(id).muscles[arg]=n;else delete ex(id).muscles[arg];save()}}});
$("backup").onclick=backup;
$("importFile").onchange=async e=>{let f=e.target.files[0];if(!f)return;try{let data=JSON.parse(await f.text());if(data.format!=="bodyplan-backup"||data.version!==1||!data.alpha||data.alpha.schemaVersion!==1)throw Error("Ungültiges Backup-Format");if(!confirm("Alpha-Daten durch dieses Backup ersetzen? Die bestehenden bp3-Daten bleiben unverändert."))return;download("bodyplan-alpha-before-import.json",{format:"bodyplan-backup",version:1,createdAt:now(),legacy:legacySnapshot(),alpha:db});db=data.alpha;save();selectedPlan=null;selectedDay=null;msg("Alpha-Backup importiert. Die bisherigen v44-Daten wurden nicht verändert.")}catch(err){msg("Import fehlgeschlagen: "+err.message)}finally{e.target.value=""}};
Promise.all(["exercise-seed.json","starter-plan.json","legacy-plans.json"].map(u=>fetch(u).then(r=>{if(!r.ok)throw Error(u);return r.json()}))).then(([s,p,l])=>{seed=s;starter=p;legacy=l;init()}).catch(e=>{$("content").innerHTML="<div class=warning>Start fehlgeschlagen: "+esc(e.message)+". Bitte alle Dateien gemeinsam über HTTPS bereitstellen.</div>"});
