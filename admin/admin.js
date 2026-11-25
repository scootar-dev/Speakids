(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let rows=[],items=[],revision=0,dirty=false,busy=false;
  let selectedCategory=0,selectedLevel=0;
  const status=text=>{$('status').textContent=text;};
  async function run(fn){if(busy)return;busy=true;document.querySelectorAll('button').forEach(b=>b.disabled=true);try{await fn();}catch(e){status(e.message);}finally{busy=false;document.querySelectorAll('button').forEach(b=>b.disabled=false);}}
  function renderCards(){
    $('cards').innerHTML=items.map((x,i)=>`<article class="card"><div class="cardhead"><strong>Kartu ${i+1}</strong><div><button class="secondary" data-move="${i}" ${i===0?'disabled':''}>Naik</button> <button class="danger" data-remove="${i}">Hapus kartu</button></div></div><div class="fields">${selectedCategory===0?`<label>Huruf A–Z<input data-i="${i}" data-field="letter" maxlength="1" value="${esc(x.letter)}"></label>`:`<label>Bahasa Inggris<input data-i="${i}" data-field="en" maxlength="160" value="${esc(x.en)}"></label><label>Arti Indonesia<input data-i="${i}" data-field="id" maxlength="200" value="${esc(x.id)}"></label><label>Emoji<input data-i="${i}" data-field="pic" maxlength="20" value="${esc(x.pic)}"></label>`}</div></article>`).join('');
  }
  function selectLevel(){
    selectedCategory=Number($('category').value);selectedLevel=Number($('level').value);
    const row=rows.find(r=>r.category_id===selectedCategory&&r.level_index===selectedLevel);
    const original=CATEGORIES[selectedCategory].levels[selectedLevel];
    revision=row?.revision||0;items=JSON.parse(JSON.stringify(row?row.items:original.items));
    $('title').value=row?.title||original.title;
    $('levelname').textContent=CATEGORIES[selectedCategory].short+' · Level '+(selectedLevel+1);
    $('source').textContent=row?(row.published?'Terbit di Supabase':'Dinonaktifkan')+' · revisi '+revision:'Materi bawaan · belum disimpan ke Supabase';
    dirty=false;renderCards();
  }
  async function load(){rows=await SpeaCloud.getLevels();selectLevel();}
  async function enter(){if(!await SpeaCloud.isAdmin())throw new Error('Akun ini bukan admin. Tambahkan UUID akun ke content_admins melalui SQL Editor.');await load();$('workspace').hidden=false;$('auth').hidden=true;$('connection').hidden=true;$('logout').hidden=false;status('Terhubung. Pilih level untuk mengelola materi.');}
  $('category').innerHTML=[0,1,3].map(i=>`<option value="${i}">${esc(CATEGORIES[i].short)}</option>`).join('');
  $('level').innerHTML=[0,1,2,3,4].map(i=>`<option value="${i}">Level ${i+1}</option>`).join('');
  const cfg=SpeaCloud.getConfig();$('url').value=cfg.url||'';$('key').value=cfg.anonKey||'';
  $('config').onsubmit=e=>{e.preventDefault();run(async()=>{SpeaCloud.setConfig($('url').value,$('key').value);status('Konfigurasi tersimpan. Silakan masuk.');});};
  $('login').onsubmit=e=>{e.preventDefault();run(async()=>{await SpeaCloud.login($('email').value.trim(),$('password').value);$('password').value='';await enter();});};
  $('logout').onclick=()=>run(async()=>{try{await SpeaCloud.logout();}finally{$('workspace').hidden=true;$('auth').hidden=false;$('connection').hidden=false;$('logout').hidden=true;dirty=false;}status('Keluar dari admin.');});
  for(const id of ['category','level'])$(id).onchange=()=>{if(dirty&&!confirm('Perubahan belum disimpan. Pindah level dan buang perubahan?')){$('category').value=selectedCategory;$('level').value=selectedLevel;return;}selectLevel();};
  $('reload').onclick=()=>{if(!dirty||confirm('Muat ulang dan buang perubahan yang belum disimpan?'))run(load);};
  $('title').oninput=()=>dirty=true;
  $('cards').oninput=e=>{const {i,field}=e.target.dataset;if(i===undefined)return;items[i][field]=field==='letter'?e.target.value.toUpperCase():e.target.value;if(field==='letter'){items[i].en=items[i].letter;items[i].id='Huruf '+items[i].letter;items[i].pic='';}dirty=true;};
  $('cards').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.remove!==undefined){items.splice(Number(b.dataset.remove),1);}else if(b.dataset.move!==undefined){const i=Number(b.dataset.move);if(i===0)return;[items[i-1],items[i]]=[items[i],items[i-1]];}else return;dirty=true;renderCards();};
  $('add').onclick=()=>{items.push({en:'',id:'',pic:'',...(selectedCategory===0?{letter:''}:{})});dirty=true;renderCards();};
  async function save(enabled){
    const title=$('title').value.trim();if(!title)throw new Error('Judul level wajib diisi.');
    const body=enabled?items.map(x=>selectedCategory===0?{letter:(x.letter||'').toUpperCase(),en:(x.letter||'').toUpperCase(),id:'Huruf '+(x.letter||'').toUpperCase(),pic:''}:{en:x.en.trim(),id:x.id.trim(),pic:x.pic||''}):[];
    if(enabled&&(body.length<3||body.length>100))throw new Error('Gunakan 3–100 kartu per level.');
    if(enabled&&body.some(x=>!x.en||!x.id||(selectedCategory===0&&!/^[A-Z]$/.test(x.letter))))throw new Error('Lengkapi kartu. Huruf Alphabet harus A–Z.');
    if(new Set(body.map(x=>x.letter||x.en)).size!==body.length)throw new Error('Kartu tidak boleh duplikat.');
    await SpeaCloud.saveLevel({category_id:selectedCategory,level_index:selectedLevel,title,items:body,published:enabled},revision);
    await load();status(enabled?'Materi berhasil diterbitkan. Muat ulang aplikasi siswa untuk melihat perubahan.':'Isi level dihapus. Level dinonaktifkan untuk siswa.');
  }
  $('save').onclick=()=>run(()=>save(true));
  $('delete').onclick=()=>{if(confirm('Hapus seluruh materi level ini dari database dan nonaktifkan untuk siswa?'))run(()=>save(false));};
  window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
  run(async()=>{if(await SpeaCloud.checkSession())await enter();});
})();
