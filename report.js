'use strict';
const reportCategoryNames = {memory: 'Memories', self: 'Self', connection: 'Connections'};
const reportClosing = 'This reflection is informed by research on identity, possessions and personal motivation. It offers possibilities for reflection rather than a fixed definition of who you are.';
const reportList = new Intl.ListFormat('en-GB', {style: 'long', type: 'conjunction'});
function reportNotes(item) {
  const notes = [item.story, ...(item.files || []).map(file => file.note), ...(item.books || []).map(book => book.notes)];
  return notes.filter(note => typeof note === 'string' && note.trim()).map(note => note.trim());
}
function reportQuote(note) {
  const words = note.split(/\s+/);
  return '“' + words.slice(0, 22).join(' ') + (words.length > 22 ? '…' : '') + '”';
}
function buildRoomReport(room) {
  const objects = room.items.filter(item => kind(item.type)).map(item => {
    const catalogue = kind(item.type);
    const categories = [].concat(item.categories || catalogue.cat).map(cat => reportCategoryNames[cat] || cat);
    return {name: item.title?.trim() || catalogue.name, categories: [...new Set(categories)], notes: reportNotes(item)};
  });
  const counts = new Map();
  for (const object of objects) for (const category of object.categories) counts.set(category, (counts.get(category) || 0) + 1);
  const groups = [...counts].sort((a,b) => b[1] - a[1]);
  const leaders = groups.filter(group => group[1] === groups[0][1]).map(group => group[0]);
  const named = objects.filter(object => object.notes.length);
  const examples = named.length ? named : objects;
  const first = examples[0];
  let glance = 'Your room is empty at the moment.';
  if (objects.length) {
    glance = 'Your room contains ' + objects.length + (objects.length === 1 ? ' object' : ' objects') + ' across ' + groups.length + (groups.length === 1 ? ' category. ' : ' categories. ');
    glance += reportList.format(groups.map(([cat,n]) => cat + ' (' + n + ')')) + '. ';
    if (groups.length > 1 && leaders.length === groups.length) glance += 'The categories are evenly represented, giving your collection a mix of different kinds of objects.';
    else if (leaders.length > 1) glance += reportList.format(leaders) + ' share the largest part of your collection.';
    else glance += leaders[0] + ' occupies the largest part of your collection.';
    if (objects.some(o => o.categories.length > 1)) glance += ' An object can appear in more than one category.';
  }
  const names = [...new Set(objects.map(o => o.name))];
  let choices = 'You can begin with one object that you would like to use to introduce yourself.';
  if (first) choices = 'Your collection includes ' + reportList.format(names.slice(0,3)) + '. An object can express something about you through the use you give it, the name you choose or the experience you associate with it. You decide which of these details belongs in your exhibition.';
  const stories = named.length ? named.slice(0,2).map(o => 'For ' + o.name + ', you wrote ' + reportQuote(o.notes[0]) + '.').join(' ') + ' Reading your words alongside the object lets you return to this account later and notice what you would keep or tell differently.' : 'You have not added any stories or notes yet. A few words about an object could capture what you want to remember when you return to it.';
  let connections = objects.length > 1 ? 'You can give two objects a shared story, or keep their meanings separate. Your arrangement leaves room for either reading.' : 'As your collection grows, you can link objects through a shared experience or leave each one with its own story.';
  const reference = named.flatMap(o => o.notes.map(note => ({o,note}))).find(({o,note}) => objects.some(other => other.name !== o.name && other.name.length >= 3 && note.toLowerCase().includes(other.name.toLowerCase())));
  if (reference) {
    const other = objects.find(other => other.name !== reference.o.name && other.name.length >= 3 && reference.note.toLowerCase().includes(other.name.toLowerCase()));
    connections = 'Your words for ' + reference.o.name + ' also mention ' + other.name + '. That reference gives you a starting point for reading the two objects together.';
  }
  const themes = [[/\bI (?:chose|decided|choose) to\b/i,'a choice you made for yourself'],[/\bI (?:learnt|learned|practised|practiced) to\b/i,'a skill you have worked on'],[/\b(?:connects me to|brings us together|feel close to)\b/i,'a connection you describe']];
  for (const [pattern,meaning] of themes) {
    const match = named.find(o => o.notes.some(note => pattern.test(note)));
    if (match) { connections += ' In your note for ' + match.name + ', ' + reportQuote(match.notes.find(note => pattern.test(note))) + ' invites you to consider ' + meaning + '.'; break; }
  }
  const question = first ? 'If you returned to ' + first.name + ' a year from now, what might you want it to say about you then?' : 'What would you like the first object in your room to say about you?';
  return [['Your Room at a Glance',glance],['What Your Choices May Reflect',choices],['The Stories Behind Your Objects',stories],['Connections Across Your Room',connections],['A Question for Your Future Self',question]];
}
const reportThemeGroups=[
 {types:['photos','box','map','tv'],name:'Memories and places',line:'Photographs, keepsakes, places and media give remembered experiences a place in the room.'},
 {types:['books','record','digital','kitchen'],name:'Interests and everyday rituals',line:'Reading, listening, making and everyday tastes form the room’s collection of interests and routines.'},
 {types:['mirror','wardrobe','moodWindow'],name:'Self-expression',line:'Objects for reflection, appearance and mood make space for how you choose to express yourself.'},
 {types:['pet','chair','letter','network'],name:'Connections',line:'Companionship, relationships and conversations are represented through the objects you have placed here.'},
 {types:['bed','stars','window','plant'],name:'Care and possibilities',line:'Rest, care, imagined places and future possibilities have a place alongside the things already familiar.'}
];
function reportText(value,max=4000){return typeof value==='string'?value.slice(0,max):'';}
function reportExcerpt(value,max=180){const text=reportText(value).replace(/\s+/g,' ').trim();return text.length>max?text.slice(0,max-1)+'…':text;}
function reportJoin(words){return words.length<2?words.join(''):words.slice(0,-1).join(', ')+' and '+words[words.length-1];}
function describeCollection(room,now=new Date()){
 const items=room.items.filter(item=>kind(item.type));
 const categories={memory:0,self:0,connection:0};
 const data=items.map(item=>{const k=kind(item.type);categories[k.cat]++;return {name:reportText(item.title,50)||k.name,type:item.type,kind:k.name,category:{memory:'Memories',self:'Self',connection:'Connections'}[k.cat],story:reportText(item.story),files:(item.files||[]).map(f=>({name:reportText(f.name,255),note:reportText(f.note,2000)})),books:(item.books||[]).map(b=>({title:reportText(b.title,50),notes:reportText(b.notes)})),people:(item.people||[]).map(p=>({name:reportText(p.name,30),relation:reportText(p.relation,40)}))};});
 const themes=reportThemeGroups.map(group=>({...group,objects:data.filter(item=>group.types.includes(item.type))})).filter(group=>group.objects.length);
 const title=room.title==='Make room for who you are.'?'My room':reportText(room.title,80)||'My room';
 const storyCount=data.filter(i=>i.story.trim()||i.files.some(f=>f.note.trim())||i.books.some(b=>b.notes.trim())||i.people.length).length;
 const fileCount=data.reduce((n,i)=>n+i.files.length,0);
 return {title,date:now.toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}),data,themes,storyCount,fileCount};
}
function roomReportMarkup(sections, report) {
 const e=esc;
 const themeMarkup=report.themes.map(t=>'<section class="report-theme"><h3>'+e(t.name)+'</h3><p>'+e(t.line)+'</p><div class="report-tags">'+t.objects.map(i=>'<span>'+e(i.name)+'</span>').join('')+'</div></section>').join('');
 const inventory=report.data.map((item,index)=>'<section class="report-item"><div class="report-item-top"><span>'+String(index+1).padStart(2,'0')+' / '+e(item.category)+'</span><span>'+e(item.kind)+'</span></div><h3>'+e(item.name)+'</h3>'+(item.story?'<p class="report-user-text">'+e(item.story)+'</p>':'')+item.books.map(b=>'<p class="report-user-text"><strong>'+e(b.title)+'</strong>'+(b.notes?' — '+e(b.notes):'')+'</p>').join('')+(item.people.length?'<p>'+e(reportJoin(item.people.map(p=>p.name+(p.relation?' · '+p.relation:''))))+'</p>':'')+item.files.map(f=>'<div class="report-file"><strong>'+e(f.name)+'</strong>'+(f.note?'<p class="report-user-text">'+e(f.note)+'</p>':'<p class="report-muted">No file note yet.</p>')+'</div>').join('')+'</section>').join('');
  return '<header class="report-heading"><span class="report-kicker">'+e(report.date)+'</span><h1 id="reportTitle">Your Room, in Words</h1>'+(report.title && report.title !== 'My room' ? '<p>'+e(report.title)+'</p>' : '')+'</header><div class="report-stats"><div><strong>'+report.data.length+'</strong><span>Objects</span></div><div><strong>'+report.storyCount+'</strong><span>With personal context</span></div><div><strong>'+report.fileCount+'</strong><span>Attached files</span></div></div>' + (report.data.length ? '<section class="report-section"><h2>What you have made space for</h2>'+themeMarkup+'</section><section class="report-section"><h2>The objects and their stories</h2>'+inventory+'</section>' : '') + sections.map(([heading,body],index) => '<section class="report-section"><h2>' + (index+1) + '. ' + heading + '</h2><p>' + esc(body) + '</p></section>').join('') + '<p class="report-method"><em>' + reportClosing + '</em></p>';
}

const roomReportCss=`
.report-heading{padding:30px 0 25px;border-bottom:1px solid #cbd2c4}.report-kicker,.report-section-label{font-size:11px;letter-spacing:1.6px;color:#68745f}.report-heading h1{font-size:44px;font-weight:500;line-height:1.15;letter-spacing:-1px;margin:18px 0;overflow-wrap:anywhere}.report-heading p{font-size:16px;color:#6c7566}.report-stats{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid #cbd2c4;padding:22px 0;gap:20px}.report-stats strong{display:block;font-size:30px;font-weight:500}.report-stats span{font-size:12px;color:#68745f}.report-section{padding:30px 0;border-bottom:1px solid #dfe3d9}.report-section h2{font-size:26px;font-weight:500;margin:12px 0 20px}.report-section p{font-size:15px;line-height:1.8;color:#404b3b;overflow-wrap:anywhere}.report-theme{margin:24px 0}.report-theme h3,.report-item h3{font-size:19px;font-weight:500;margin:10px 0}.report-tags{display:flex;flex-wrap:wrap;gap:8px}.report-tags span{font-size:12px;border:1px solid #cbd2c4;border-radius:20px;padding:6px 12px}.report-item{padding:22px 0;border-top:1px solid #e3e6df;break-inside:avoid}.report-item-top{display:flex;gap:16px;justify-content:space-between;color:#77816f;font-size:11px}.report-user-text{white-space:pre-wrap}.report-file{border-left:2px solid #cbd2c4;padding:8px 14px;margin:12px 0}.report-file strong{font-size:13px;overflow-wrap:anywhere}.report-file p{margin:5px 0}.report-method,.report-muted{font-size:12px!important;line-height:1.7;color:#7d8577!important}.report-method{padding:20px 0} @media(max-width:540px){.report-heading h1{font-size:30px}.report-stats{gap:10px}.report-item-top{flex-wrap:wrap}}`;
let currentReportMarkup='';
$('#generateReport').onclick=()=>{currentReportMarkup=roomReportMarkup(buildRoomReport(state), describeCollection(state));$('#reportContent').innerHTML=currentReportMarkup;$('#roomReport').showModal();$('#roomReport').scrollTop=0;};
$('#closeReport').onclick=()=>$('#roomReport').close();
$('#downloadReport').onclick=()=>{if(!currentReportMarkup)return;const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your Room, in Words</title><style>body{font-family:Arial,sans-serif;color:#263021;background:#fff;margin:0 auto;padding:32px;max-width:820px}*{box-sizing:border-box}'+roomReportCss+'@media print{body{padding:0} .report-section{break-before:auto}}</style></head><body>'+currentReportMarkup+'</body></html>';download(new Blob([html],{type:'text/html;charset=utf-8'}),'my-room-report.html');};
const reportStyle=document.createElement('style');reportStyle.textContent=roomReportCss;document.head.append(reportStyle);
