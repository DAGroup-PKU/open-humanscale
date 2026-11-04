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
  toys: [ ['toy-reference','Cars in blue. Plush toys in white.','The goal assigns each toy category to a container.'], ['toy-swap','Plush toys in blue. Cars in white.','Reverse the category-to-bin assignment through the goal image.'] ],
  holders: [ ['desk-holders-a','Glue on the left. Pens on the right.','Collect the glue stick and pens into the indicated holders.'], ['desk-holders-b','Pens on the left. Glue on the right.','Change the destinations while keeping the policy fixed.'] ],
  books: [ ['toy-reference','Green-covered book on top','Arrange the books in the order specified by the goal.','toy-reference-books'], ['toy-books','Purple-covered book on top','Change the order and move the stack closer to the white bin.'] ]
 },
 human: {
  books: [ ['human-books-right','Brown notebook on the right','The human goal specifies the rightmost slot.'], ['human-books-left','Brown notebook on the left','A new human goal specifies the leftmost slot.'] ],
  mugs: [ ['human-mug-monitor','Mug near the monitor','A human-view image specifies the target placement.'], ['human-mug-rack','Mug near the file rack','Keep the policy fixed and change the visual target.'] ]
 }
};
const video = (name,label,edited=false) => `<video controls muted ${edited?'loop data-goal-loop':''} playsinline preload="none" poster="assets/posters/${edited?'clean-goals/':'presentation/'}${name}.webp?v=7" aria-label="${label}"><source src="assets/videos/${edited?'clean-goals/':'presentation/'}${name}.mp4?v=7" type="video/mp4">Your browser does not support video.</video>`;
const multiView = new Set(['zero-bottles','zero-mug','zero-glue','zero-sort','zero-stack','goal-position-a','goal-position-b','human-books-right','human-books-left','human-mug-monitor','human-mug-rack']);
function cameraControls(name,edited=false){return multiView.has(name)?`<div class="camera-options"><span>Camera</span><div class="segmented" role="group" aria-label="Camera view for ${name}"><button class="active" aria-pressed="true" data-camera="third" data-camera-name="${name}" data-camera-edited="${edited}">Third-person</button><button aria-pressed="false" data-camera="ego" data-camera-name="${name}" data-camera-edited="${edited}">Robot view</button></div></div>`:'';}
function setPressed(attribute,value){document.querySelectorAll(`[data-${attribute}]`).forEach(b=>{const selected=b.dataset[attribute]===value;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});}
function replaceGallery(id,html){const container=document.getElementById(id);container.querySelectorAll('video').forEach(v=>v.pause());container.innerHTML=html;}
const zeroCategories={coordination:'Bimanual coordination',precision:'Precise manipulation',placement:'Sorting & placement',articulation:'Drawers & articulated objects'};
const legacyZeroTasks=Object.entries(media.zero).flatMap(([category,items])=>items.map(([id,title,description])=>({id,title,description,category,src:`assets/videos/presentation/${id}.mp4`,poster:`assets/posters/presentation/${id}.webp`,legacy_id:id,camera_view:'Third-person'})));
let zeroTasks=legacyZeroTasks,visibleZeroTasks=zeroTasks,zeroTaskIndex=0,zeroTaskTrigger=null;
const zeroTaskDialog=document.getElementById('zero-task-dialog');
const zeroPlayer=document.getElementById('zero-task-player');
const zeroPreviewMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const zeroMotionButton=document.getElementById('zero-motion');
const visibleZeroPreviews=new Set();
let zeroPaused=zeroPreviewMotion.matches;
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function updateZeroMotion(){zeroMotionButton.textContent=zeroPaused?'Play previews':'Pause previews';zeroMotionButton.setAttribute('aria-pressed',String(zeroPaused));}
function stopZeroPreview(){document.querySelectorAll('.zero-card-preview').forEach(v=>v.pause());}
function startZeroPreview(v){
 if(zeroPaused||document.hidden||document.querySelector('dialog[open]')||!v.isConnected||!visibleZeroPreviews.has(v))return;
 if(!v.getAttribute('src')){v.src=v.dataset.previewSrc;v.muted=true;}
 v.play().catch(()=>{});
}
function resumeZeroPreviews(){visibleZeroPreviews.forEach(startZeroPreview);}
const zeroPreviewObserver=new IntersectionObserver(entries=>entries.forEach(e=>{
 if(e.isIntersecting&&e.intersectionRatio>=.25){visibleZeroPreviews.add(e.target);startZeroPreview(e.target);}
 else{visibleZeroPreviews.delete(e.target);e.target.pause();}
}),{threshold:[0,.25]});
zeroMotionButton.addEventListener('click',()=>{zeroPaused=!zeroPaused;updateZeroMotion();zeroPaused?stopZeroPreview():resumeZeroPreviews();updateGoalPlayback();});
zeroPreviewMotion.addEventListener('change',e=>{zeroPaused=e.matches;updateZeroMotion();zeroPaused?stopZeroPreview():resumeZeroPreviews();updateGoalPlayback();});
updateZeroMotion();
function renderZero(category='all'){
 stopZeroPreview();zeroPreviewObserver.disconnect();visibleZeroPreviews.clear();
 const restoreFilterFocus=document.activeElement?.hasAttribute('data-zero-filter');
 visibleZeroTasks=zeroTasks.filter(t=>category==='all'||t.category===category);
 const gallery=document.getElementById('zero-gallery');
 gallery.innerHTML=visibleZeroTasks.map((clip,index)=>`<article class="zero-task-card"><button class="zero-task-open" data-zero-task="${index}" type="button" aria-label="Watch ${escapeHTML(clip.title)}"><span class="zero-card-media"><video class="zero-card-preview" data-preview-src="${escapeHTML(clip.src)}" poster="${escapeHTML(clip.poster)}" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"></video><span class="zero-card-play" aria-hidden="true">↗</span></span><span class="zero-card-copy"><span class="zero-card-title">${escapeHTML(clip.title)}</span></span></button></article>`).join('');
 gallery.querySelectorAll('.zero-card-preview').forEach(v=>zeroPreviewObserver.observe(v));
 document.getElementById('zero-gallery-summary').textContent=`${visibleZeroTasks.length}${category==='all'?'':` / ${zeroTasks.length}`} recordings · Pretrained policy`;
 const filters=document.getElementById('zero-gallery-filters');
 filters.hidden=zeroTasks.length<9;
 if(!filters.hidden){
  filters.innerHTML=[['all','All',zeroTasks.length],...Object.entries(zeroCategories).map(([key,label])=>[key,label,zeroTasks.filter(t=>t.category===key).length])].filter(([, ,count])=>count>0).map(([key,label,count])=>`<button type="button" data-zero-filter="${key}" class="${category===key?'active':''}" aria-pressed="${category===key}">${label} <span>${count}</span></button>`).join('');
  if(restoreFilterFocus)filters.querySelector(`[data-zero-filter="${category}"]`)?.focus({preventScroll:true});
 }
}
function clearZeroPlayer(){
 zeroPlayer.querySelectorAll('video').forEach(v=>{v.pause();mediaObserver.unobserve(v);v.removeAttribute('src');v.querySelectorAll('source').forEach(s=>s.removeAttribute('src'));v.load();});
 zeroPlayer.replaceChildren();
}
function showZeroTask(index,trigger){
 stopZeroPreview();clearZeroPlayer();zeroTaskIndex=index;if(trigger)zeroTaskTrigger=trigger;
 const clip=visibleZeroTasks[index];
 document.getElementById('task-dialog-title').textContent=clip.title;
 document.getElementById('task-dialog-description').textContent=({'robot':'Robot view','third-person':'Third-person view'}[clip.camera_view]||clip.camera_view||'Robot demonstration');
 document.getElementById('task-dialog-position').textContent=`${index+1} / ${visibleZeroTasks.length}`;
 zeroTaskDialog.querySelector('[data-zero-prev]').disabled=index===0;
 zeroTaskDialog.querySelector('[data-zero-next]').disabled=index===visibleZeroTasks.length-1;
 const goal=clip.goal;
 const goalHTML=goal?`<figure class="zero-task-goal"><figcaption>Visual goal</figcaption><button class="figure-button" data-figure="${escapeHTML(goal.src)}" data-caption="Visual goal: ${escapeHTML(clip.title)}" data-goal-figure aria-label="Enlarge visual goal: ${escapeHTML(clip.title)}"><img src="${escapeHTML(goal.src)}" width="${goal.width}" height="${goal.height}" alt="Visual goal for ${escapeHTML(clip.title)}"><span aria-hidden="true">↗</span></button></figure>`:'';
 zeroPlayer.innerHTML=`<div class="zero-task-demonstration${goal?' has-goal':''}">${goalHTML}<div class="zero-camera-pair single-camera"><figure class="zero-camera-panel"><div class="video-wrap"><video controls muted loop playsinline preload="metadata" poster="${escapeHTML(clip.poster)}" aria-label="${escapeHTML(clip.title)}"><source src="${escapeHTML(clip.src)}" type="video/mp4"></video></div></figure></div></div>`;
 const legacy=clip.legacy_id;
 if(legacy&&multiView.has(legacy)){
  zeroPlayer.insertAdjacentHTML('beforeend',`<details class="research-details legacy-camera-views"><summary>Additional two-camera recording</summary><div class="zero-camera-pair">${['','-ego'].map(suffix=>`<figure class="zero-camera-panel"><figcaption>${suffix?'Robot view':'Third-person'}</figcaption><div class="video-wrap">${video(legacy+suffix,clip.title)}</div></figure>`).join('')}</div></details>`);
 }
 const play=document.getElementById('task-dialog-play');play.textContent='↻ Restart recording';
 document.getElementById('task-dialog-note').textContent=clip.note||'';
 if(!zeroTaskDialog.open){zeroTaskDialog.showModal();document.body.classList.add('task-dialog-open');updateGoalPlayback();}
 watchMedia();zeroPlayer.querySelector('video').play().catch(()=>{});
}
zeroTaskDialog.querySelector('.task-dialog-close').addEventListener('click',()=>zeroTaskDialog.close());
zeroTaskDialog.addEventListener('click',e=>{if(e.target===zeroTaskDialog)zeroTaskDialog.close();});
zeroTaskDialog.addEventListener('close',()=>{clearZeroPlayer();document.body.classList.remove('task-dialog-open');zeroTaskTrigger?.focus({preventScroll:true});resumeZeroPreviews();updateGoalPlayback();});
zeroPlayer.addEventListener('toggle',e=>{if(e.target.matches('.legacy-camera-views')&&!e.target.open)e.target.querySelectorAll('video').forEach(v=>v.pause());},true);
async function loadZeroGallery(){
 try{const response=await fetch('assets/zero-shot-gallery.json?v=24');if(!response.ok)throw Error('Gallery unavailable');const data=await response.json();if(!data.clips?.length)throw Error('Empty gallery');zeroTasks=data.clips;renderZero();}
 catch(error){console.warn('Using the existing demonstration gallery.',error);}
}
function goalMarks(name){
 return (goalAnnotations[name]||[]).map(mark=>`<span class="goal-mark" style="left:${mark.rect[0]}%;top:${mark.rect[1]}%;width:${mark.rect[2]}%;height:${mark.rect[3]}%"><span class="goal-mark-tag${mark.align==='end'?' align-end':''}${mark.placement==='below'?' below':''}${mark.placement==='side'?' side':''}">${escapeHTML(mark.label)}</span></span>`).join('');
}
function goalCard([name,title,description,editName=name],i,type){
 const source=type==='human'?'Human goal':'Visual goal';
 return `<article class="goal-case" data-case-name="${editName}"><div class="goal-input"><div class="goal-input-copy"><span class="case-label">${source} ${i===0?'A':'B'}</span><h4>${title}</h4></div><div class="goal-thumbnail"><button class="annotated-goal" data-goal-annotation="${editName}" data-figure="assets/goals/${name}.webp" data-caption="${source}: ${title}" aria-label="Enlarge annotated ${source.toLowerCase()}: ${title}"><img src="assets/goals/${name}.webp" alt="${source}: ${title}" width="${name.startsWith('goal-position-')?632:1200}" height="${name.startsWith('goal-position-')?304:675}" loading="lazy"><span class="goal-marks" aria-hidden="true">${goalMarks(editName)}</span><span class="goal-enlarge" aria-hidden="true">↗</span></button></div></div><div class="video-wrap">${video(editName,`Robot execution: ${title}`,true)}</div><div class="goal-output-label"><span>Robot execution</span></div></article>`;
}
function renderGoals(type,key,galleryId=`${type}-gallery`){
 replaceGallery(galleryId,media[type][key].map((item,i)=>goalCard(item,i,type)).join(''));
 const playButton=document.querySelector(`[data-play-pair="${galleryId}"]`);
 const controls=playButton.closest('.pair-controls');
 const paired=media[type][key].every(item=>multiView.has(item[3]||item[0]));
 if(paired)controls.insertAdjacentHTML('afterbegin',`<div class="segmented pair-camera-control" role="group" aria-label="Camera for ${type} ${key} videos"><button data-pair-camera="third" data-pair-gallery="${galleryId}" class="active" aria-pressed="true">Third-person</button><button data-pair-camera="ego" data-pair-gallery="${galleryId}" aria-pressed="false">Robot view</button></div>`);
}
const goalGroupTitles={drawers:'Drawer placement',toys:'Toy destinations',holders:'Object holders',books:'Book order'};
function renderGoalExperiments(type){
 const groups=Object.keys(media[type]);
 document.getElementById(`${type}-experiments`).innerHTML=groups.map((key,i)=>{
  const title=type==='human'?(key==='books'?'Notebook arrangement':'Mug placement'):goalGroupTitles[key];
  return `<section class="goal-experiment" aria-labelledby="${type}-${key}-heading"><div class="goal-experiment-heading"><h3 id="${type}-${key}-heading"><span>${String(i+1).padStart(2,'0')}</span>${title}</h3></div><div class="goal-comparison" id="${type}-${key}-gallery"></div><div class="pair-controls"><button class="button secondary" data-pause-pair="${type}-${key}-gallery" aria-pressed="false">Pause</button><button class="button secondary play-pair" data-play-pair="${type}-${key}-gallery">↻ Replay both from the start</button></div></section>`;
 }).join('');
 groups.forEach(key=>renderGoals(type,key,`${type}-${key}-gallery`));
}
let longPlayback = null;
const longTasks={
 household:{views:[['long-household-ego-v24','First-person'],['long-household-third-v25','Third-person']],title:'From tabletop to household.',description:'Toy sorting, book stacking, bottle disposal, and garment collection across several work areas.',steps:['Toys & books','Bottle disposal','Garments','Back to the desk']},
 desk:{views:[['long-desk-ego','First-person'],['long-desk','Third-person']],title:'A desk, progressively organized.',description:'Mug placement, stationery collection, drawer storage, and notebook arrangement in one recorded sequence.',steps:['Cup','Stationery','Drawers','Books']}
};
function renderLong(key){
 const d=longTasks[key],stage=document.getElementById('long-stage');
 longPlayback?.destroy();
 pausedGoalGroups.delete(stage);updateGoalPause(stage);
 replaceGallery('long-stage',d.views.map(([name,label])=>`<figure class="long-camera"><figcaption>${label}</figcaption><div class="video-wrap">${video(name,`${d.title} ${label}`).replace('controls muted','muted data-goal-loop').replace(name+'.webp',name+(/v2[45]$/.test(name)?'.jpg':'.webp'))}</div></figure>`).join(''));
 longPlayback=window.createSyncedPair(stage,paused=>{if(paused)pausedGoalGroups.add(stage);else pausedGoalGroups.delete(stage);updateGoalPause(stage);});
 document.getElementById('long-title').textContent=d.title;document.getElementById('long-description').textContent=d.description;
 document.getElementById('long-protocol').textContent='After task-specific post-training';
 document.getElementById('long-sequence').innerHTML=d.steps.map(t=>`<span>${t}</span>`).join('<i aria-hidden="true">→</i>');setPressed('long',key);
}
renderZero();renderGoals('pretrained','positioning');renderGoalExperiments('organization');renderGoalExperiments('human');

function swapCameraVideo(container,name,edited=false){const old=container.querySelector('video');const time=old.currentTime;const playing=!old.paused&&!old.ended;const label=old.getAttribute('aria-label');pauseManagedVideo(old);old.outerHTML=video(name,label,edited);const next=container.querySelector('video');next.addEventListener('loadedmetadata',()=>{next.currentTime=Math.min(time,Math.max(0,next.duration-.05));if(playing)next.play().catch(()=>{});},{once:true});next.load();}
const dialog=document.getElementById('figure-dialog');
let figureTrigger=null;
document.addEventListener('click',e=>{
 const camera=e.target.closest('[data-camera]');if(camera&&!camera.classList.contains('active')){const card=camera.closest('article');swapCameraVideo(card,camera.dataset.cameraName+(camera.dataset.camera==='ego'?'-ego':''),camera.dataset.cameraEdited==='true');card.querySelectorAll('[data-camera]').forEach(b=>{const active=b===camera;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});}

 const pairCamera=e.target.closest('[data-pair-camera]');if(pairCamera&&!pairCamera.classList.contains('active')){
  const gallery=document.getElementById(pairCamera.dataset.pairGallery);
  gallery.querySelectorAll('.goal-case').forEach(card=>swapCameraVideo(card,card.dataset.caseName+(pairCamera.dataset.pairCamera==='ego'?'-ego':''),true));
  pairCamera.closest('.pair-camera-control').querySelectorAll('button').forEach(b=>{const selected=b===pairCamera;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
 }
 const zeroTask=e.target.closest('[data-zero-task]');if(zeroTask)showZeroTask(Number(zeroTask.dataset.zeroTask),zeroTask);
 const zeroFilter=e.target.closest('[data-zero-filter]');if(zeroFilter)renderZero(zeroFilter.dataset.zeroFilter);
 if(e.target.closest('[data-zero-prev]')&&zeroTaskIndex>0)showZeroTask(zeroTaskIndex-1);
 if(e.target.closest('[data-zero-next]')&&zeroTaskIndex<visibleZeroTasks.length-1)showZeroTask(zeroTaskIndex+1);
 const pauseButton=e.target.closest('[data-pause-pair]');if(pauseButton){const group=document.getElementById(pauseButton.dataset.pausePair);if(group.id==='long-stage'){longPlayback.toggle();return;}if(pausedGoalGroups.has(group)){pausedGoalGroups.delete(group);group.querySelectorAll('video').forEach(v=>v.play().catch(()=>{}));}else{pausedGoalGroups.add(group);group.querySelectorAll('video').forEach(pauseManagedVideo);}updateGoalPause(group);}
 const pairButton=e.target.closest('[data-play-pair]');if(pairButton){if(pairButton.dataset.playPair==='long-stage'){longPlayback.restart();return;}const videos=[...document.getElementById(pairButton.dataset.playPair).querySelectorAll('video')].filter(v=>!v.closest('details:not([open])')); const group=document.getElementById(pairButton.dataset.playPair);pausedGoalGroups.delete(group);updateGoalPause(group);for(const v of videos)v.currentTime=0;Promise.allSettled(videos.map(v=>v.play())).then(results=>{if(!pairButton.isConnected||videos.some(v=>!v.isConnected))return;pairButton.textContent=results.some(r=>r.status==='rejected')?'Use the video play control':videos.length>1?'↻ Replay both from the start':'↻ Replay from the start';});}
 const task=e.target.closest('[data-long]');if(task)renderLong(task.dataset.long);
 const figure=e.target.closest('[data-figure]');if(figure){figureTrigger=figure;const img=document.getElementById('dialog-image');img.src=figure.dataset.figure;img.alt=figure.dataset.caption;dialog.classList.toggle('is-goal-figure',!!figure.dataset.goalAnnotation||figure.hasAttribute('data-goal-figure'));document.getElementById('dialog-goal-marks').innerHTML=figure.dataset.goalAnnotation?goalMarks(figure.dataset.goalAnnotation):'';document.getElementById('dialog-caption').textContent=figure.dataset.caption;dialog.showModal();document.body.classList.add('dialog-open');document.querySelectorAll('video').forEach(pauseManagedVideo);}
});
function closeFigure(){dialog.close();}
document.querySelector('.dialog-close').addEventListener('click',closeFigure);
dialog.addEventListener('click',e=>{if(e.target===dialog)closeFigure();});
dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');if(figureTrigger)figureTrigger.focus({preventScroll:true});updateGoalPlayback();if(zeroTaskDialog.open)zeroPlayer.querySelector('video')?.play().catch(()=>{});else resumeZeroPreviews();});
// Paired goal videos may play together; other sections pause to keep attention local.
document.addEventListener('play',e=>{if(e.target.tagName!=='VIDEO'||e.target.classList.contains('zero-card-preview'))return;const pair=e.target.closest('.goal-comparison, .media-play-group');document.querySelectorAll('video').forEach(v=>{if(v!==e.target&&(!pair||!pair.contains(v)))pauseManagedVideo(v);});},true);
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const visibleGoalVideos=new Set(),pausedGoalGroups=new Set(),managedGoalPauses=new WeakSet(),observedGoalVideos=new WeakSet();
let activeGoalGroup=null;
function pauseManagedVideo(v){
 if(!v.paused){if(v.hasAttribute('data-goal-loop'))managedGoalPauses.add(v);v.pause();}
}
function updateGoalPause(group){
 if(!group)return;
 const button=document.querySelector(`[data-pause-pair="${group.id}"]`);
 if(button){const paused=pausedGoalGroups.has(group);button.textContent=paused?'Resume':'Pause';button.setAttribute('aria-pressed',String(paused));}
}
function updateGoalPlayback(){
 const enabled=!document.hidden&&!reduceMotion.matches&&!document.querySelector('dialog[open]');
 const candidates=[...visibleGoalVideos].filter(v=>v.isConnected);
 const groups=[...new Set(candidates.map(v=>v.closest('.goal-comparison')))];
 // Retain the current visible comparison so adjacent sections never fight for playback.
 activeGoalGroup=enabled?(groups.includes(activeGoalGroup)?activeGoalGroup:groups[0]||null):null;
 document.querySelectorAll('video[data-goal-loop]').forEach(v=>{
  const group=v.closest('.goal-comparison');
  if(group.id==='long-stage')return;
  if(enabled&&group===activeGoalGroup&&visibleGoalVideos.has(v)&&!pausedGoalGroups.has(group)){
   if(v.paused)v.play().catch(()=>{});
  }else pauseManagedVideo(v);
 });
 longPlayback?.setActive(enabled&&activeGoalGroup?.id==='long-stage');
}
const goalObserver=new IntersectionObserver(entries=>{
 entries.forEach(e=>{if(e.isIntersecting&&e.intersectionRatio>=.25)visibleGoalVideos.add(e.target);else visibleGoalVideos.delete(e.target);});
 updateGoalPlayback();
},{threshold:[0,.25]});
function watchGoalVideos(){
 document.querySelectorAll('video[data-goal-loop]').forEach(v=>{
  if(observedGoalVideos.has(v))return;
  observedGoalVideos.add(v);goalObserver.observe(v);
  if(v.closest('#long-stage'))return;
  v.addEventListener('pause',()=>{
   if(managedGoalPauses.delete(v)||!v.isConnected)return;
   const group=v.closest('.goal-comparison');pausedGoalGroups.add(group);updateGoalPause(group);
  });
  v.addEventListener('play',()=>{const group=v.closest('.goal-comparison');pausedGoalGroups.delete(group);updateGoalPause(group);});
 });
 for(const v of visibleGoalVideos)if(!v.isConnected){visibleGoalVideos.delete(v);goalObserver.unobserve(v);}
}
reduceMotion.addEventListener('change',updateGoalPlayback);
const visiblePreviewLoops=new Set();
const bonusGroup=document.querySelector('.bonus-pair');
const bonusMotion=document.getElementById('bonus-motion');
let bonusPaused=reduceMotion.matches;
function playPreviewLoop(v){
 if(document.querySelector('dialog[open]'))return;
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
 } else if(!e.isIntersecting&&!e.target.hasAttribute('data-goal-loop'))e.target.pause();
}),{threshold:[0,.25]});
reduceMotion.addEventListener('change',e=>{if(e.matches){bonusPaused=true;updateBonusMotion();visiblePreviewLoops.forEach(v=>v.pause());}});
const observedVideos=new WeakSet();
function watchMedia(){document.querySelectorAll('video:not(.zero-card-preview):not(#hero-video)').forEach(v=>{if(!observedVideos.has(v)){mediaObserver.observe(v);observedVideos.add(v);}});watchGoalVideos();}
new MutationObserver(records=>{records.forEach(r=>r.removedNodes.forEach(n=>{if(n.nodeType===1){if(n.tagName==='VIDEO')mediaObserver.unobserve(n);n.querySelectorAll('video').forEach(v=>mediaObserver.unobserve(v));}}));watchMedia();}).observe(document.querySelector('main'),{childList:true,subtree:true});watchMedia();
document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video:not(#hero-video)').forEach(pauseManagedVideo);else {visiblePreviewLoops.forEach(playPreviewLoop);resumeZeroPreviews();}updateGoalPlayback();});

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

renderLong('household');loadZeroGallery();
