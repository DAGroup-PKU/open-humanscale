'use strict';
const media = {
 pretrained: {
  positioning: [ ['goal-position-a','In front of the green block','A tabletop placement target in the visual goal.'], ['goal-position-b','On top of the purple block','A raised placement target specified by the visual goal.'] ]
 },
 zero: {
  coordination: [ ['zero-bottles','Bimanual bottle lifting','Lift one bottle with each hand in sequence.'], ['zero-handover','Bimanual object handling','Coordinate both hands to grasp and move everyday objects.'] ],
  precision: [ ['zero-mug','Mug placement','Grasp the mug by its handle and move it to the target location.'], ['zero-glue','Reposition and insert','Move the holder before inserting the glue stick.'] ],
  placement: [ ['zero-sort','Object sorting','Place the egg and ball into separate bowls.'], ['zero-stack','Elevated placement','Place a block on top of a stack of books.'] ]
 },
 organization: {
  drawers: [ ['desk-upper','The upper drawer','The goal specifies the upper drawer for the tape roll and tape measure.'], ['desk-middle','The middle drawer','A different visual goal changes the storage destination.'] ],
  toys: [ ['toy-reference','Cars in blue. Plush toys in white.','The goal assigns each toy category to a container.'], ['toy-swap','Swap the destinations','Reverse the category-to-bin assignment through the goal image.'] ],
  holders: [ ['desk-holders-a','Choose the holders','Collect the glue stick and pens into the indicated holders.'], ['desk-holders-b','Swap the holders','Change the destinations while keeping the policy fixed.'] ],
  books: [ ['toy-reference','Green-covered book on top','Arrange the books in the order specified by the goal.','toy-reference-books'], ['toy-books','Purple-covered book on top','Change the order and move the stack closer to the white bin.'] ]
 },
 human: {
  books: [ ['human-books-right','Brown notebook on the right','The human goal specifies the rightmost slot.'], ['human-books-left','Brown notebook on the left','A new human goal specifies the leftmost slot.'] ],
  mugs: [ ['human-mug-monitor','Mug near the monitor','A human-view image specifies the target placement.'], ['human-mug-rack','Mug near the file rack','Keep the policy fixed and change the visual target.'] ]
 }
};
const video = (name,label,edited=false) => `<video controls muted playsinline preload="none" poster="assets/posters/${edited?'edited/':'presentation/'}${name}.webp?v=7" aria-label="${label}"><source src="assets/videos/${edited?'edited/':'presentation/'}${name}.mp4?v=7" type="video/mp4">Your browser does not support video.</video>`;
const multiView = new Set(['zero-bottles','zero-mug','zero-glue','zero-sort','zero-stack','goal-position-a','goal-position-b','human-books-right','human-books-left','human-mug-monitor','human-mug-rack']);
function cameraControls(name,edited=false){return multiView.has(name)?`<div class="camera-options"><span>Camera</span><div class="segmented" role="group" aria-label="Camera view for ${name}"><button class="active" aria-pressed="true" data-camera="third" data-camera-name="${name}" data-camera-edited="${edited}">Third-person</button><button aria-pressed="false" data-camera="ego" data-camera-name="${name}" data-camera-edited="${edited}">Robot view</button></div></div>`:'';}
function setPressed(attribute,value){document.querySelectorAll(`[data-${attribute}]`).forEach(b=>{const selected=b.dataset[attribute]===value;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});}
function replaceGallery(id,html){const container=document.getElementById(id);container.querySelectorAll('video').forEach(v=>v.pause());container.innerHTML=html;}
const zeroCategories={coordination:'Bimanual coordination',precision:'Precise manipulation',placement:'Sorting & placement'};
// Interleave categories so the opening row shows the breadth of available tasks.
const zeroTasks=Array.from({length:Math.max(...Object.values(media.zero).map(items=>items.length))},(_,i)=>
 Object.entries(media.zero).flatMap(([category,items])=>items[i]?[{category,item:items[i]}]:[])).flat();
let visibleZeroTasks=zeroTasks,zeroTaskIndex=0,zeroTaskTrigger=null,activeZeroPreview=null;
const zeroTaskDialog=document.getElementById('zero-task-dialog');
const zeroPlayer=document.getElementById('zero-task-player');
const zeroPreviewMotion=window.matchMedia('(prefers-reduced-motion: reduce)');

function stopZeroPreview(){
 if(!activeZeroPreview)return;
 const preview=activeZeroPreview;activeZeroPreview=null;
 preview.pause();preview.closest('.zero-card-media').classList.remove('is-previewing');
 // Release the full source as soon as the pointer leaves, including any download.
 preview.removeAttribute('src');preview.load();
}
function startZeroPreview(preview){
 if(zeroPreviewMotion.matches||document.hidden||zeroTaskDialog.open||!window.matchMedia('(hover: hover) and (pointer: fine)').matches)return;
 stopZeroPreview();activeZeroPreview=preview;
 preview.src=preview.dataset.previewSrc;
 preview.play().then(()=>{
  if(activeZeroPreview===preview)preview.closest('.zero-card-media').classList.add('is-previewing');
  else preview.pause();
 }).catch(()=>{});
}
function renderZero(category='all'){
 stopZeroPreview();
 zeroPreviewObserver.disconnect();
 const restoreFilterFocus=document.activeElement?.hasAttribute('data-zero-filter');
 visibleZeroTasks=zeroTasks.filter(t=>category==='all'||t.category===category);
 const gallery=document.getElementById('zero-gallery');
 gallery.innerHTML=visibleZeroTasks.map(({category:group,item:[name,title]},index)=>`<article class="zero-task-card"><button class="zero-task-open" data-zero-task="${index}" type="button" aria-label="View ${title}${multiView.has(name)?' in two camera views':''}"><span class="zero-card-media"><img src="assets/posters/presentation/${name}.webp?v=7" alt="" loading="lazy" width="960" height="540"><video class="zero-card-preview" data-preview-src="assets/videos/presentation/${name}.mp4?v=7" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"></video><span class="zero-view-count">${multiView.has(name)?'2 views':'1 view'}</span><span class="zero-card-play" aria-hidden="true">▷</span></span><span class="zero-card-copy"><span class="zero-card-title">${title}</span><span class="zero-card-category">${zeroCategories[group]}</span></span></button></article>`).join('');
 gallery.querySelectorAll('.zero-task-open').forEach(button=>{
  const preview=button.querySelector('video');
  button.addEventListener('pointerenter',()=>startZeroPreview(preview));
  button.addEventListener('pointerleave',()=>{if(activeZeroPreview===preview)stopZeroPreview();});
  preview.addEventListener('timeupdate',()=>{if(activeZeroPreview===preview&&preview.currentTime>=6)preview.currentTime=0;});
  zeroPreviewObserver.observe(button);
 });
 document.getElementById('zero-gallery-summary').textContent=`${visibleZeroTasks.length}${category==='all'?'':` of ${zeroTasks.length}`} tasks · Pretrained checkpoint`;
 const filters=document.getElementById('zero-gallery-filters');
 filters.hidden=zeroTasks.length<9;
 if(!filters.hidden){
  filters.innerHTML=[['all','All',zeroTasks.length],...Object.entries(zeroCategories).map(([key,label])=>[key,label,zeroTasks.filter(t=>t.category===key).length])].filter(([, ,count])=>count>0).map(([key,label,count])=>`<button type="button" data-zero-filter="${key}" class="${category===key?'active':''}" aria-pressed="${category===key}">${label} <span>${count}</span></button>`).join('');
  if(restoreFilterFocus)filters.querySelector(`[data-zero-filter="${category}"]`).focus({preventScroll:true});
 }
}
function clearZeroPlayer(){
 zeroPlayer.querySelectorAll('video').forEach(v=>{
  v.pause();mediaObserver.unobserve(v);v.removeAttribute('src');v.querySelectorAll('source').forEach(s=>s.removeAttribute('src'));v.load();
 });
 zeroPlayer.replaceChildren();
}
function showZeroTask(index,trigger){
 stopZeroPreview();clearZeroPlayer();zeroTaskIndex=index;
 if(trigger)zeroTaskTrigger=trigger;
 const [name,title,description]=visibleZeroTasks[index].item;
 const paired=multiView.has(name);
 document.getElementById('task-dialog-title').textContent=title;
 document.getElementById('task-dialog-description').textContent=description;
 document.getElementById('task-dialog-position').textContent=`${index+1} / ${visibleZeroTasks.length}`;
 zeroTaskDialog.querySelector('[data-zero-prev]').disabled=index===0;
 zeroTaskDialog.querySelector('[data-zero-next]').disabled=index===visibleZeroTasks.length-1;
 const view=(suffix,label)=>`<figure class="zero-camera-panel"><figcaption>${label}</figcaption><div class="video-wrap">${video(name+suffix,title+' — '+label)}</div></figure>`;
 zeroPlayer.innerHTML=`<div class="zero-camera-pair ${paired?'':'single-camera'}">${view('','Third-person')}${paired?view('-ego','Robot view'):''}</div>`;
 const play=document.getElementById('task-dialog-play');
 play.dataset.videoCount=paired?'2':'1';play.textContent=paired?'▶ Play both from the start':'▶ Play from the start';
 document.getElementById('task-dialog-note').textContent=paired?'Two views of the same task · action-aligned, not hardware-synchronized. Playback speed is stated in each video.':'Third-person recording · playback speed is stated in the video.';
 if(!zeroTaskDialog.open){zeroTaskDialog.showModal();document.body.classList.add('task-dialog-open');}
 watchMedia();
}
zeroTaskDialog.querySelector('.task-dialog-close').addEventListener('click',()=>zeroTaskDialog.close());
zeroTaskDialog.addEventListener('click',e=>{if(e.target===zeroTaskDialog)zeroTaskDialog.close();});
zeroTaskDialog.addEventListener('close',()=>{clearZeroPlayer();document.body.classList.remove('task-dialog-open');zeroTaskTrigger?.focus({preventScroll:true});});
zeroPreviewMotion.addEventListener('change',e=>{if(e.matches)stopZeroPreview();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopZeroPreview();});
const zeroPreviewObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting&&activeZeroPreview&&e.target.contains(activeZeroPreview))stopZeroPreview();}));
function goalCard([name,title,description,editName=name],i,type){
 const source=type==='human'?'Human goal image':'Visual goal';
 return `<article class="goal-case" data-case-name="${editName}"><div class="goal-input"><div class="goal-thumbnail"><button data-figure="assets/goals/${name}.webp" data-caption="${source}: ${title}" aria-label="Enlarge ${source.toLowerCase()}: ${title}"><img src="assets/goals/${name}.webp" alt="${source}: ${title}" loading="lazy"></button></div><div class="goal-input-copy"><span class="case-label">${source} ${i===0?'A':'B'}</span><h4>${title}</h4><p>${description}</p></div><span class="goal-arrow" aria-hidden="true">↓</span></div><div class="video-wrap">${video(editName,`Robot execution: ${title}`,true)}</div><div class="goal-output-label"><span>Robot execution ${i===0?'A':'B'}</span><span>${type==='pretrained'?'Pretrained checkpoint':'After task post-training'}</span></div>${multiView.has(editName)?'<p class="camera-note">Action-aligned views · playback speed is stated in the video.</p>':''}</article>`;
}
const goalInsights={
 pretrained:{positioning:['Tabletop location → top of the purple block.','The bottle is moved toward different spatial targets.','Goal-responsive positioning is visible before task post-training; these excerpts do not establish completed-task success.']},
 organization:{
 drawers:['Upper drawer → middle drawer.','The robot places the tape roll and tape measure in the specified drawer.','The visual goal controls the destination after task specialization.'],
 toys:['Swap the toy categories assigned to each bin.','Cars and plush toys are routed to the newly specified containers.','Object-to-container assignments change with the goal image.'],
 holders:['Swap the holders assigned to the glue stick and pens.','The same object types are placed in different holders.','Goal conditioning controls object assignments within the specialized task.'],
 books:['Green book on top → purple book on top; change the stack location.','The robot changes the order and position of the book stack.','The goal specifies object relations as well as destinations.']},
 human:{
 books:['Human goal: brown notebook in the right slot → left slot.','The robot places the notebook in the human-specified slot.','Qualitative evidence that a human-view object relation can guide robot execution.'],
 mugs:['Human goal: mug near the monitor → near the file rack.','The robot moves the mug toward the location shown by the human goal.','The goal interface transfers the target relation across human and robot appearances.']}
};
function renderReasoning(type,key){const el=document.getElementById(`${type}-reasoning`);if(el)el.innerHTML=goalInsights[type][key].map((t,i)=>`<div><span>${['Goal change','Behavior change','What this shows'][i]}</span><p>${t}</p></div>`).join('');}
const watchFor={organization:{drawers:'Watch which drawer receives the tape roll and tape measure.',toys:'Watch the toy categories swap containers.',holders:'Watch the glue stick and pens change holders.',books:'Watch the top book and the position of the stack.'},human:{books:'Watch the brown notebook move to the human-specified slot.',mugs:'Watch the mug follow the human-specified location.'}};
function renderGoals(type,key){
 renderReasoning(type,key);replaceGallery(`${type}-gallery`,media[type][key].map((item,i)=>goalCard(item,i,type)).join(''));setPressed(type,key);
 const hint=document.getElementById(`${type}-watch`);if(hint)hint.textContent=watchFor[type][key];
 const playButton=document.querySelector(`[data-play-pair="${type}-gallery"]`);if(playButton)playButton.textContent='▶ Play both from the start';
 const controls=playButton.closest('.pair-controls');controls.querySelector('.pair-camera-control')?.remove();
 const paired=media[type][key].every(item=>multiView.has(item[3]||item[0]));
 if(paired)controls.insertAdjacentHTML('afterbegin',`<div class="segmented pair-camera-control" role="group" aria-label="Camera for both ${type} comparison videos"><button data-pair-camera="third" data-pair-type="${type}" class="active" aria-pressed="true">Third-person</button><button data-pair-camera="ego" data-pair-type="${type}" aria-pressed="false">Robot view</button></div>`);
 controls.append(playButton);
}
const longTasks={
 desk:{name:'long-desk',title:'A desk, progressively organized.',description:'Mug placement, stationery collection, drawer storage, and notebook arrangement in one recorded sequence.',steps:['Cup','Stationery','Drawers','Books'],protocol:'After task-specific post-training'},
 household:{name:'long-household',title:'From tabletop to household.',description:'Toy sorting, book stacking, bottle disposal, and garment collection across several work areas.',steps:['Toys & books','Bottle disposal','Garments','Back to the desk'],protocol:'After task-specific post-training · 2× speed'}
};
function renderLong(key){const d=longTasks[key];replaceGallery('long-stage',video(d.name,d.title));document.getElementById('long-title').textContent=d.title;document.getElementById('long-description').textContent=d.description;document.getElementById('long-protocol').textContent=d.protocol;document.getElementById('long-sequence').innerHTML=d.steps.map(t=>`<span>${t}</span>`).join('<i aria-hidden="true">→</i>');document.querySelector('.view-switch').hidden=key!=='desk';setPressed('long',key);setPressed('view','long-desk');}
renderZero();renderGoals('pretrained','positioning');renderGoals('organization','drawers');renderGoals('human','books');renderLong('desk');

const studies={
 scaling:{src:'assets/figures/ego-scaling-v20.png',alt:'Pure egocentric pretraining scaling from 100 to 50,000 hours; Scene-OOD and Random success improve after robot adaptation.',caption:'Pure ego pretraining → robot adaptation. Best checkpoint per setting; 50 clean demonstrations per task. Dashed curves are descriptive fits.'},
 efficiency:{src:'assets/figures/efficiency.webp',alt:'Robot demonstration efficiency after egocentric pretraining with varying robot demonstration budgets.',caption:'Robot-data efficiency after adaptation: compare egocentric pretraining budgets across numbers of robot demonstrations per task. This measures robot demonstration efficiency, not compute efficiency.'}
};
function swapCameraVideo(container,name,edited=false){const old=container.querySelector('video');const time=old.currentTime;const playing=!old.paused&&!old.ended;const label=old.getAttribute('aria-label');old.pause();old.outerHTML=video(name,label,edited);const next=container.querySelector('video');next.addEventListener('loadedmetadata',()=>{next.currentTime=Math.min(time,Math.max(0,next.duration-.05));if(playing)next.play().catch(()=>{});},{once:true});next.load();}
const dialog=document.getElementById('figure-dialog');
let figureTrigger=null;
document.addEventListener('click',e=>{
 const camera=e.target.closest('[data-camera]');if(camera&&!camera.classList.contains('active')){const card=camera.closest('article');swapCameraVideo(card,camera.dataset.cameraName+(camera.dataset.camera==='ego'?'-ego':''),camera.dataset.cameraEdited==='true');card.querySelectorAll('[data-camera]').forEach(b=>{const active=b===camera;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});}

 const pairCamera=e.target.closest('[data-pair-camera]');if(pairCamera&&!pairCamera.classList.contains('active')){
  const gallery=document.getElementById(`${pairCamera.dataset.pairType}-gallery`);
  gallery.querySelectorAll('.goal-case').forEach(card=>swapCameraVideo(card,card.dataset.caseName+(pairCamera.dataset.pairCamera==='ego'?'-ego':''),true));
  pairCamera.closest('.pair-camera-control').querySelectorAll('button').forEach(b=>{const selected=b===pairCamera;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
 }
 const zeroTask=e.target.closest('[data-zero-task]');if(zeroTask)showZeroTask(Number(zeroTask.dataset.zeroTask),zeroTask);
 const zeroFilter=e.target.closest('[data-zero-filter]');if(zeroFilter)renderZero(zeroFilter.dataset.zeroFilter);
 if(e.target.closest('[data-zero-prev]')&&zeroTaskIndex>0)showZeroTask(zeroTaskIndex-1);
 if(e.target.closest('[data-zero-next]')&&zeroTaskIndex<visibleZeroTasks.length-1)showZeroTask(zeroTaskIndex+1);
 const pairButton=e.target.closest('[data-play-pair]');if(pairButton){const videos=[...document.getElementById(pairButton.dataset.playPair).querySelectorAll('video')];for(const v of videos)v.currentTime=0;Promise.allSettled(videos.map(v=>v.play())).then(results=>{if(!pairButton.isConnected||videos.some(v=>!v.isConnected))return;pairButton.textContent=results.some(r=>r.status==='rejected')?'Use the video play control':videos.length>1?'↻ Replay both from the start':'↻ Replay from the start';});}
 for(const type of ['organization','human']){const tab=e.target.closest(`[data-${type}]`);if(tab)renderGoals(type,tab.dataset[type]);}
 const task=e.target.closest('[data-long]');if(task)renderLong(task.dataset.long);
 const view=e.target.closest('[data-view]');if(view&&!view.classList.contains('active')){swapCameraVideo(document.getElementById('long-stage'),view.dataset.view);setPressed('view',view.dataset.view);}
 const study=e.target.closest('[data-study]');if(study){const d=studies[study.dataset.study];document.getElementById('study-image').src=d.src;document.getElementById('study-image').alt=d.alt;document.getElementById('study-caption').textContent=d.caption;const b=document.getElementById('study-enlarge');b.dataset.figure=d.src;b.dataset.caption=d.caption;setPressed('study',study.dataset.study);}
 const figure=e.target.closest('[data-figure]');if(figure){figureTrigger=figure;const img=document.getElementById('dialog-image');img.src=figure.dataset.figure;img.alt=figure.dataset.caption;document.getElementById('dialog-caption').textContent=figure.dataset.caption;dialog.showModal();document.body.classList.add('dialog-open');}
});
function closeFigure(){dialog.close();}
document.querySelector('.dialog-close').addEventListener('click',closeFigure);
dialog.addEventListener('click',e=>{if(e.target===dialog)closeFigure();});
dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');if(figureTrigger)figureTrigger.focus();});
// Paired goal videos may play together; other sections pause to keep attention local.
document.addEventListener('play',e=>{if(e.target.tagName!=='VIDEO')return;const pair=e.target.closest('.goal-comparison, .media-play-group');document.querySelectorAll('video').forEach(v=>{if(v!==e.target&&(!pair||!pair.contains(v)))v.pause();});},true);
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const visiblePreviewLoops=new Set();
const bonusGroup=document.querySelector('.bonus-pair');
const bonusMotion=document.getElementById('bonus-motion');
let bonusPaused=reduceMotion.matches;
function playPreviewLoop(v){
 const enabled=bonusGroup.contains(v)?!bonusPaused:!reduceMotion.matches;
 if(enabled&&!document.hidden&&visiblePreviewLoops.has(v))v.play().catch(()=>{});
}
function updateBonusMotion(){bonusMotion.textContent=bonusPaused?'Play animations':'Pause animations';bonusMotion.setAttribute('aria-pressed',String(bonusPaused));}
bonusMotion.addEventListener('click',()=>{bonusPaused=!bonusPaused;updateBonusMotion();bonusGroup.querySelectorAll('video').forEach(v=>bonusPaused?v.pause():playPreviewLoop(v));});
updateBonusMotion();
const mediaObserver=new IntersectionObserver(entries=>entries.forEach(e=>{
 const visible=e.isIntersecting&&e.intersectionRatio>=.25;
 if(e.target.hasAttribute('data-preview-loop')){
  if(visible){visiblePreviewLoops.add(e.target);playPreviewLoop(e.target);}
  else {visiblePreviewLoops.delete(e.target);e.target.pause();}
 } else if(!e.isIntersecting)e.target.pause();
}),{threshold:[0,.25]});
reduceMotion.addEventListener('change',e=>{if(e.matches){bonusPaused=true;updateBonusMotion();visiblePreviewLoops.forEach(v=>v.pause());}});
const observedVideos=new WeakSet();
function watchMedia(){document.querySelectorAll('video').forEach(v=>{if(!observedVideos.has(v)){mediaObserver.observe(v);observedVideos.add(v);}});}
new MutationObserver(records=>{records.forEach(r=>r.removedNodes.forEach(n=>{if(n.nodeType===1){if(n.tagName==='VIDEO')mediaObserver.unobserve(n);n.querySelectorAll('video').forEach(v=>mediaObserver.unobserve(v));}}));watchMedia();}).observe(document.querySelector('main'),{childList:true,subtree:true});watchMedia();
document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(v=>v.pause());else visiblePreviewLoops.forEach(playPreviewLoop);});

const nav=document.querySelector('nav'),menu=document.querySelector('.menu-toggle');
function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');}
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');});
nav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){closeMenu();menu.focus();}});
const sectionObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){nav.querySelectorAll('a').forEach(a=>{const active=a.hash===`#${e.target.id}`;a.classList.toggle('current',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}}),{rootMargin:'-10% 0px -60% 0px'});
for(const id of ['scaling','method','robotwin','zero-shot','visual-goals','human-goals','long-horizon','citation'])sectionObserver.observe(document.getElementById(id));
// Keep earlier shared section URLs useful after reorganizing the page.
const oldAnchors={'#pure-model':'#scaling'};
if(oldAnchors[location.hash]){const target=oldAnchors[location.hash];history.replaceState(null,'',target);requestAnimationFrame(()=>document.querySelector(target).scrollIntoView());}

document.getElementById('copy-citation').addEventListener('click',async()=>{const value=document.getElementById('bibtex').textContent,button=document.getElementById('copy-citation');try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(value);else{const field=document.createElement('textarea');field.value=value;field.style.position='fixed';field.style.opacity='0';document.body.append(field);field.select();const ok=document.execCommand('copy');field.remove();if(!ok)throw Error('Copy failed');}button.textContent='Copied ✓';document.getElementById('copy-status').textContent='Citation copied';setTimeout(()=>button.textContent='Copy citation ⧉',2200);}catch{button.textContent='Select text to copy';document.getElementById('copy-status').textContent='Select the citation text to copy it.';}});


// Open the citation as well as scrolling to it from the title resource row.
document.querySelector('[data-citation-link]')?.addEventListener('click', () => {
  const citation = document.querySelector('#citation .citation-details');
  if (citation) citation.open = true;
});
