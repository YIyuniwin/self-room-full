let viewingTv=null,tvObjectUrl=null,tvNoteFile=null,tvNoteTimer=null,tvNoteDirty=false,tvNoteRevision=0;
const tvVideo=document.querySelector('#tvVideo'),tvView=document.querySelector('#tvView');
function openObject(id){const item=state.items.find(i=>i.id===id);if(item?.type==='tv'&&!arranging)openTv(id);else openEditor(id);}
function releaseTv(){if(tvNoteDirty)persistTvNote();tvVideo.pause();tvVideo.removeAttribute('src');tvVideo.load();if(tvObjectUrl){URL.revokeObjectURL(tvObjectUrl);tvObjectUrl=null;}}
function selectTvClip(index,autoplay=true){releaseTv();const item=state.items.find(i=>i.id===viewingTv);const clips=item?.files.filter(f=>f.blob.type.startsWith('video/'))||[];const file=clips[index];tvNoteFile=file||null;document.querySelector('#tvNoteSection').hidden=!file;document.querySelector('#tvFileNote').value=file?.note||'';document.querySelector('#tvNoteStatus').textContent='Saved with this video.';document.querySelector('#tvEmpty').hidden=!!file;tvVideo.hidden=!file;document.querySelector('#tvClips').disabled=!file;document.querySelector('#tvVolume').disabled=!file;document.querySelector('#tvStatus').textContent='';if(!file)return;tvObjectUrl=URL.createObjectURL(file.blob);tvVideo.src=tvObjectUrl;document.querySelector('#tvClips').value=String(index);if(autoplay){roomAudio.pause();tvVideo.play().catch(()=>{if(tvView.open)document.querySelector('#tvStatus').textContent='Press Play to start watching.';});}}
function openTv(id){const item=state.items.find(i=>i.id===id);if(!item)return;viewingTv=id;document.querySelector('#tvViewTitle').textContent=item.title||'Television';const select=document.querySelector('#tvClips');select.replaceChildren();item.files.filter(f=>f.blob.type.startsWith('video/')).forEach((f,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=f.name;select.append(option);});tvView.showModal();selectTvClip(0);}
function editTv(){const id=viewingTv;tvView.close();openEditor(id);}
document.querySelector('#tvClose').onclick=()=>tvView.close();
document.querySelector('#tvEdit').onclick=editTv;
document.querySelector('#tvUpload').onclick=()=>{editTv();document.querySelector('#fileInput').click();};
tvView.addEventListener('close',()=>{releaseTv();viewingTv=null;});
document.querySelector('#tvClips').onchange=e=>selectTvClip(Number(e.target.value));
tvVideo.volume=.6;
document.querySelector('#tvVolume').oninput=e=>{tvVideo.volume=Number(e.target.value);tvVideo.muted=false;};
tvVideo.addEventListener('volumechange',()=>{document.querySelector('#tvVolume').value=tvVideo.volume;document.querySelector('#tvVolumeValue').textContent=tvVideo.muted?'Muted':Math.round(tvVideo.volume*100)+'%';});
tvVideo.addEventListener('play',()=>{roomAudio.pause();document.querySelector('#tvStatus').textContent='';});
tvVideo.addEventListener('error',()=>{if(tvObjectUrl)document.querySelector('#tvStatus').textContent='This video cannot be played. Try another MP4 or WebM video in Edit & upload.';});

async function persistTvNote(){clearTimeout(tvNoteTimer);tvNoteTimer=null;if(!tvNoteDirty)return;tvNoteDirty=false;const revision=tvNoteRevision,file=tvNoteFile;const ok=await save();if(tvNoteFile===file&&revision===tvNoteRevision){document.querySelector('#tvNoteStatus').textContent=ok?'Saved with this video.':'Could not save. Please try Save note again.';if(!ok)tvNoteDirty=true;}}
document.querySelector('#tvFileNote').oninput=e=>{if(!tvNoteFile)return;tvNoteFile.note=e.target.value.slice(0,2000);tvNoteRevision++;tvNoteDirty=true;document.querySelector('#tvNoteStatus').textContent='Saving…';clearTimeout(tvNoteTimer);tvNoteTimer=setTimeout(persistTvNote,500);};
document.querySelector('#tvSaveNote').onclick=persistTvNote;
