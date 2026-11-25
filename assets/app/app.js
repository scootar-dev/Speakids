// Keep application symbols private: window.top is a reserved browser property.
(() => {
'use strict';

const $ = id => document.getElementById(id);
const page = $('page'),
  dialog = $('dialog');
const keys = ['home', 'rewards', 'games', 'profile'],
  names = ['Beranda', 'Reward', 'Permainan', 'Profil'];
const navIcons = ['home', 'gift', 'game', 'user'];
const stages = ['Dengar & kenali', 'Pilih jawaban', 'Susun & baca', 'Ucapkan', 'Tantangan akhir'];
const badges = [['Alphabet Rookie', 'book', 'Selesaikan level pertama Alphabet.'], ['Vocabulary Explorer', 'map', 'Selesaikan level pertama Vocabulary.'], ['Daily Expression Hero', 'sound', 'Selesaikan level pertama Daily Expressions.'], ['Reading Champion', 'book', 'Selesaikan level pertama Simple Sentences.'], ['Speaking Star', 'mic', 'Kenali lima ucapan dalam satu kali bermain Bicara & Skor.']];
const activeCategories = [0, 1, 3];
const activeBadges = [0, 1, 3, 4];
function normalizeCategory() {
  if (!activeCategories.includes(profile.last)) { profile.last = 0; profile.lastLevel = 0; }
}
const defaults = {
  name: 'Teman',
  grade: '1',
  audio: true,
  stars: 0,
  done: [0, 0, 0, 0],
  last: 0,
  lastLevel: 0,
  missions: {},
  history: [],
  speaking: false
};
let profile = structuredCopy(defaults);
let activeAccount = null;
let revision = 0;
let syncTimer;
let syncRunning = null;
function storageKey() { return activeAccount ? 'speakids.account.' + activeAccount : 'speakids.v1'; }
function loadProfile() {
  profile = structuredCopy(defaults);
  try { Object.assign(profile, JSON.parse(localStorage.getItem(storageKey()) || '{}')); } catch (_) {}
  normalizeCategory();
}
function switchAccount() {
  clearTimeout(syncTimer);
  activeAccount = window.SpeaCloud?.getAccountKey() || null;
  revision++;
  loadProfile();
  go('profile');
}
async function syncCloud() {
  if (!activeAccount || !window.SpeaCloud?.getCurrentUser()) return;
  if (syncRunning) {
    await syncRunning;
    return syncCloud();
  }
  const account = activeAccount;
  const version = revision;
  const task = window.SpeaCloud.pushUserData(profile).then(data => {
    if (account !== activeAccount || !data) return;
    if (version === revision) {
      Object.assign(profile, data);
      localStorage.setItem(storageKey(), JSON.stringify(profile));
      if (['home','profile','rewards','history','levels','alllevels'].includes(screen)) render();
    } else scheduleSync();
  });
  syncRunning = task;
  try { await task; } finally { if (syncRunning === task) syncRunning = null; }
}
function scheduleSync() {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => syncCloud().catch(err => notice('Progres lokal tersimpan. Cloud gagal: ' + err.message)), 700);
}
async function restoreCloud() {
  const account = activeAccount;
  const version = revision;
  const data = await window.SpeaCloud.pullUserData();
  if (account !== activeAccount || !data) return;
  if (version !== revision) { scheduleSync(); return; }
  const local = profile;
  profile = { ...local, ...data, stars: Math.max(local.stars, data.stars || 0),
    done: local.done.map((n,i) => Math.max(n,data.done?.[i] || 0)),
    speaking: local.speaking || data.speaking,
    missions: { ...local.missions, ...data.missions },
    history: [...new Map([...local.history,...(data.history || [])].map(h => [h.id || h.time + h.title,h])).values()]
      .sort((a,b) => new Date(b.time)-new Date(a.time)).slice(0,100) };
  save();
  render();
}
function structuredCopy(a) {
  return JSON.parse(JSON.stringify(a));
}
try {
  Object.assign(profile, JSON.parse(localStorage.getItem('speakids.v1') || '{}'));
} catch (_) {}
let screen = 'home',
  tab = 'home',
  category = 0,
  level = 0,
  badgeIndex = 0,
  round = null,
  exercise = null,
  attempt = null;
let voice = 'ready',
  heard = '',
  speakingId = 0,
  recognizer = null,
  voiceTimer,
  player,
  noticeTimer;
let correct = false,
  msg = '',
  arranged = [],
  choices = [],
  answerWords = [],
  gameResult,
  levelResult;
const esc = s => String(s).replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[c]);
function save() {
  try {
    revision++;
    profile.history.forEach(h => { if (!h.id) h.id = h.time + ':' + h.title + ':' + h.note; });
    localStorage.setItem(storageKey(), JSON.stringify(profile));
  } catch (_) {
    notice('Penyimpanan penuh. Progres hanya tersimpan selama sesi ini.');
  }
  if (window.SpeaCloud && window.SpeaCloud.isReady() && window.SpeaCloud.getCurrentUser()) {
    if (activeAccount) scheduleSync();
  }
}
function notice(s) {
  $('notice').textContent = s;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    $('notice').textContent = '';
  }, 3300);
}
function action(a, label, cl = '', v = '', attrs = '') {
  return '<button type="button" class="' + cl + '" data-a="' + a + '" data-v="' + esc(v) + '" ' + attrs + '>' + label + '</button>';
}
function circle(a, icon, label, v = '', gloss = false, disable = false) {
  return action(a, ico(icon), 'round' + (gloss ? ' gloss' : ''), v, 'aria-label="' + esc(label) + '"' + (disable ? ' disabled' : ''));
}
function star() {
  return '<span class="pill">' + ico('star') + profile.stars + '</span>';
}
const arrow = '<span class="miniarr">' + ico('right') + '</span>';
function head(title, counter = '', game = false) {
  return '<header class="top">' + circle('back', game ? 'close' : 'left', game ? 'Tutup permainan' : 'Kembali') + '<span class="toplabel">' + esc(title) + '</span>' + (counter ? '<span class="counter">' + esc(counter) + '</span>' : '<span style="width:44px"></span>') + '</header>';
}
function brand() {
  return '<div class="brand"><i class="mark">' + ico('book') + '</i><span>Spea<span>Kids</span></span></div>';
}
function top() {
  return '<header class="top">' + brand() + star() + '</header>';
}
function banner(k, title, body, icon) {
  return '<div class="banner"><div><small class="kicker">' + k + '</small><h1>' + title + '</h1>' + (body ? '<p>' + body + '</p>' : '') + '</div>' + art(icon) + '</div>';
}
function tileCard(x, a, v, small = '') {
  if (!x) return '';
  return action(a, art(x.icon) + '<span class="copy">' + (small ? '<span class="kicker">' + small + '</span>' : '') + '<strong>' + x.title + '</strong><small>' + x.desc + '</small></span>' + arrow, 'item ' + x.color, v);
}
function line(a, icon, title, detail = '', v = '') {
  return action(a, ico(icon) + '<span><strong>' + esc(title) + '</strong>' + (detail ? '<small>' + esc(detail) + '</small>' : '') + '</span><span class="end">' + ico('right') + '</span>', 'linebtn', v);
}
function owl(cl) {
  return '<img class="' + cl + '" src="art/piko.png" alt="Piko, burung hantu yang membawa buku">';
}
function section(name, extra = '') {
  return '<div class="sectionhead"><h2>' + name + '</h2>' + extra + '</div>';
}
function hasBadge(i) {
  if (!activeBadges.includes(i)) return false;
  return i === 4 ? profile.speaking : profile.done[i] > 0;
}
function currentLevel(c) {
  return Math.min(profile.done[c], 4);
}
function resumeLevel() {
  const l = profile.lastLevel;
  return profile.missions[profile.last + '-' + l] ? l : currentLevel(profile.last);
}
function trail(c) {
  return '<div class="trail">' + CATEGORIES[c].levels.map((_, i) => '<span><i class="' + (i <= profile.done[c] ? 'on' : '') + '">' + ico(i < profile.done[c] ? 'check' : i === profile.done[c] ? 'star' : 'lock') + '</i>Lv. ' + (i + 1) + '</span>').join('') + '</div>';
}
function home() {
  const c = profile.last,
    l = resumeLevel(),
    x = CATEGORIES[c],
    current = x.levels[l];
  return top() + '<div class="heading"><h1>Halo, ' + esc(profile.name) + '!</h1><p>Piko siap belajar bersamamu.</p></div><div class="hero"><div><small class="kicker">Belajar bersama Piko</small><h2>Yuk, jelajahi bahasa Inggris!</h2>' + action('learn', 'Mulai Belajar ' + ico('right'), 'primarybtn sun') + '</div>' + owl('heroimg') + '</div>' + section('Lanjutkan Latihan') + tileCard({
    ...x,
    title: current.title,
    desc: profile.done[c] === 5 ? 'Ulangi tantangan favoritmu.' : x.short + ' · ' + (profile.missions[c + '-' + l] ? stages[profile.missions[c + '-' + l].stage] : 'Dengar & kenali')
  }, 'resume', '', 'Level ' + (l + 1)) + section('Progres belajarku', action('alllevels', 'Lihat Semua Level', 'linkbtn')) + '<div class="mapcard"><strong>' + x.short + '</strong>' + trail(c) + '</div>' + section('Reward-ku') + line('rewards', 'gift', profile.stars + ' bintang terkumpul', badges.filter((_, i) => hasBadge(i)).length + ' lencana terbuka');
}
function menu(isGame) {
  const a = isGame ? GAMES : CATEGORIES.map((c,i) => activeCategories.includes(i) ? c : null);
  return (isGame ? top() : head('SpeaKids')) + banner(isGame ? 'Taman bermain' : 'Buku petualangan', isGame ? 'Permainan' : 'Belajar', isGame ? 'Pilih permainan favoritmu.' : 'Pilih yang ingin kamu pelajari.', isGame ? 'phones' : 'book') + '<div class="stack category">' + a.map((x, i) => tileCard(x, isGame ? 'game' : 'category', i)).join('') + '</div>';
}
function levels() {
  const x = CATEGORIES[category];
  return head('Peta level') + banner('Jalur belajar', x.short, 'Pilih level untuk mulai.', x.icon) + '<div class="stack">' + x.levels.map((l, i) => {
    const done = i < profile.done[category],
      open = i === profile.done[category],
      locked = l.disabled || (!done && !open);
    return action('level', '<span class="num">' + (done ? ico('check') : locked ? ico('lock') : i + 1) + '</span><span><span class="kicker">Level ' + (i + 1) + '</span><strong>' + l.title + '</strong><small>' + (done ? 'Selesai · 3 bintang' : open ? 'Siap dipelajari' : 'Selesaikan level ' + i + ' dulu') + '</small></span><span class="end">' + ico(locked ? 'lock' : 'right') + '</span>', 'node ' + (done ? 'done' : open ? 'current' : 'locked'), i, locked ? 'disabled' : '');
  }).join('') + '</div>';
}
function allLevels() {
  return head('Progres belajarku') + '<div class="heading"><h1>Semua level</h1></div><div class="stack">' + activeCategories.map(i => action('category', '<strong>' + CATEGORIES[i].short + '</strong>' + trail(i), 'mapcard', i)).join('') + '</div>';
}
function reward() {
  return top() + '<div class="heading"><h1>Reward</h1><p>Koleksi bintang dan lencanamu.</p></div><div class="hero"><div><small class="kicker">Kantong bintang</small><h2>' + profile.stars + ' bintang</h2></div>' + owl('heroimg') + '</div>' + section('Lencana petualang') + '<div class="badges">' + activeBadges.map(i => action('badge', '<span class="medal">' + ico(badges[i][1]) + '</span><b>' + badges[i][0] + '</b><small>' + (hasBadge(i) ? 'Terkumpul' : 'Terkunci') + '</small>', 'badge ' + (hasBadge(i) ? '' : 'locked'), i)).join('') + '</div>';
}
function badgeDetail() {
  const b = badges[badgeIndex];
  return head('Lencana') + '<div class="speechcard"><span class="medal">' + ico(b[1]) + '</span><h2>' + b[0] + '</h2><p>' + b[2] + '</p><div class="feedback ' + (hasBadge(badgeIndex) ? 'good' : '') + '">' + (hasBadge(badgeIndex) ? 'Lencana ini sudah kamu kumpulkan!' : 'Lencana ini masih terkunci.') + '</div></div>';
}
function profilePage() {
  const n = badges.filter((_, i) => hasBadge(i)).length;
  return top() + '<div class="heading"><h1>Profil</h1></div><div class="panel"><div class="row">' + owl('profilepic') + '<div><h2>' + esc(profile.name) + '</h2><p>Kelas ' + esc(profile.grade) + ' SD</p>' + action('edit', 'Ubah profil', 'linkbtn') + '</div></div><div class="statrow">' + [[profile.stars, 'Bintang'], [n, 'Lencana'], [activeCategories.filter(i => profile.done[i] === 5).length + '/3', 'Kategori tamat']].map(s => '<div><b>' + s[0] + '</b><small>' + s[1] + '</small></div>').join('') + '</div><p>' + CATEGORIES[profile.last].short + ' · Level ' + (currentLevel(profile.last) + 1) + '</p></div>' + section('Kegiatan & pengaturan') + '<div class="stack">' + line('history', 'clock', 'Riwayat belajar') + line('rewards', 'gift', 'Lencana saya', n + ' lencana terkumpul') + line('audio', 'sound', 'Suara contoh', profile.audio ? 'Aktif' : 'Nonaktif') + line('help', 'help', 'Bantuan') + '</div>';
}
function historyPage() {
  return head('Profil') + '<div class="heading"><h1>Riwayat belajar</h1></div><div class="panel">' + (profile.history.length ? profile.history.map(h => '<div class="historyline"><strong>' + esc(h.title) + '</strong><small>' + esc(new Date(h.time).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })) + ' · ' + esc(h.note) + '</small></div>').join('') : '<p>Petualanganmu dimulai di sini. Selesaikan satu level atau permainan untuk mengisi riwayatmu.</p>') + '</div>';
}
function remember(title, note) {
  profile.history.unshift({
    id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2),
    title,
    note,
    time: new Date().toISOString()
  });
  profile.history = profile.history.slice(0, 100);
}
function shuffle(xs) {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim().replace(/\s+/g, ' ');
}
function speaker(word, label = 'Dengarkan') {
  return action('say', ico('sound') + ' ' + label, 'outlinebtn', word);
}
function play(word) {
  if (!profile.audio) {
    modal('Suara contoh mati', 'Aktifkan suara untuk mendengarkan contoh.', action('enableSound', 'Aktifkan suara', 'primarybtn', word));
    return;
  }
  if (voice === 'listening' || voice === 'processing') {
    stopVoice();
    render();
  }
  stopAudio();
  if (!SOUNDS[word]) {
    if (!window.speechSynthesis) { notice('Contoh suara belum tersedia pada perangkat ini.'); return; }
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US'; utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
    return;
  }
  player = new Audio('audio/' + SOUNDS[word]);
  player.play().catch(e => {
    if (e.name !== 'AbortError') notice('Suara belum bisa diputar. Ketuk lagi, ya.');
  });
}
function stopAudio() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  if (player) {
    player.pause();
    player = null;
  }
}
function modal(title, body, buttons = '') {
  dialog.innerHTML = '<h2>' + esc(title) + '</h2><p>' + esc(body) + '</p><div class="actions">' + buttons + action('dismiss', 'Tutup', 'outlinebtn') + '</div>';
  if (!dialog.open) dialog.showModal();
}
function nav() {
  return '<nav class="navbar" aria-label="Menu utama">' + keys.map((k, i) => action(k, ico(navIcons[i]) + '<span>' + names[i] + '</span>', k === tab ? 'active' : '', '', 'aria-label="' + names[i] + '"' + (k === tab ? ' aria-current="page"' : ''))).join('') + '</nav>';
}
function go(k) {
  stopVoice();
  stopAudio();
  if (dialog.open) dialog.close();
  screen = k;
  if (keys.includes(k)) tab = k;
  page.scrollTop = 0;
  render();
}
function render() {
  normalizeCategory();
  const pages = {
    home,
    learn: () => menu(false),
    games: () => menu(true),
    levels,
    alllevels: allLevels,
    rewards: reward,
    badge: badgeDetail,
    profile: profilePage,
    history: historyPage,
    lesson: lessonPage,
    play: gamePage,
    result: resultPage,
    completed: completePage
  };
  const pos = page.scrollTop;
  page.classList.toggle('primary', keys.includes(screen));
  page.innerHTML = pages[screen]();
  if (page.querySelector('[data-a="mic"]') && window.PronunciationService) {
    const controls = document.createElement('div');
    controls.className = 'actions';
    controls.innerHTML = voice === 'listening' ? action('stopRecording', 'Selesai merekam', 'outlinebtn') : voice !== 'processing' ? action('replayRecording', 'Dengarkan rekamanku', 'linkbtn') : '';
    page.querySelector('[data-a="mic"]').closest('.center').appendChild(controls);
  }
  $('nav').innerHTML = keys.includes(screen) ? nav() : '';
  page.scrollTop = pos;
}
function key() {
  return category + '-' + level;
}
function levelData() {
  return CATEGORIES[category].levels[level];
}
function lessonItem() {
  const a = levelData().items;
  return a[exercise.stage === 0 ? exercise.card : exercise.stage === 4 ? Math.floor(exercise.final * (a.length - 1) / 2) : Math.min(exercise.stage - 1, a.length - 1)];
}
function target(item) {
  return category === 0 ? item.letter : item.en;
}
function setupQuestion() {
  stopVoice();
  stopAudio();
  correct = false;
  msg = '';
  arranged = [];
  const game = screen === 'play';
  const item = game ? round.items[round.index] : lessonItem(),
    word = game ? item.en : target(item);
  const list = game ? gamePool : levelData().items;
  const alternatives = list.filter(x => (game ? x.en : target(x)) !== word);
  let alt = shuffle(alternatives)[0];
  if (game && round.index === 0 && round.type === 0) alt = gamePool.find(x => x.en === 'Cap' && x.en !== word) || alt;
  choices = shuffle([item, alt]);
  let parts;
  if (!game && category === 0 && exercise.stage === 2) {
    const p = levelData().items;
    parts = p.slice(0, 3).map(x => x.letter);
  } else parts = word.includes(' ') ? word.replace(/[!.?]/g, '').split(' ') : [...word.toUpperCase().replace(/[^A-Z]/g, '')];
  answerWords = parts;
  attempt = shuffle(parts);
  if (parts.length > 1 && parts.join('|') === attempt.join('|')) attempt.push(attempt.shift());
}
function startLevel(i) {
  if (!activeCategories.includes(category)) return;
  if (CATEGORIES[category].levels[i]?.disabled) { notice('Materi level ini sedang tidak tersedia.'); return; }
  if (i > profile.done[category]) return;
  level = i;
  profile.last = category;
  profile.lastLevel = i;
  exercise = structuredCopy(profile.missions[key()] || {
    stage: 0,
    card: 0,
    seen: 0,
    final: 0
  });
  tab = 'home';
  screen = 'lesson';
  setupQuestion();
  checkpoint();
  go('lesson');
}
function checkpoint() {
  profile.missions[key()] = structuredCopy(exercise);
  save();
}
function stepDots() {
  return '<div class="steps" aria-label="Misi ' + (exercise.stage + 1) + ' dari 5">' + stages.map((_, i) => '<i class="' + (i <= exercise.stage ? 'on' : '') + '"></i>').join('') + '</div>';
}
function options(item, game, illustrated = false) {
  return '<div class="options">' + choices.map((x, i) => action('answer', (illustrated ? imageWord(x) : '') + esc(game ? x.en : target(x)), '', i, correct ? 'disabled' : '')).join('') + '</div>';
}
function tiles() {
  return '<div class="slots" aria-label="Susunanmu">' + answerWords.map((_, i) => action('undo', arranged.length > i ? esc(attempt[arranged[i]]) : '·', 'slot', i, arranged.length <= i || correct ? 'disabled' : 'aria-label="Lepas bagian ' + (i + 1) + '"')).join('') + '</div><div class="tiles">' + attempt.map((v, i) => action('tile', esc(v), 'tile', i, arranged.includes(i) || correct ? 'disabled' : '')).join('') + '</div>';
}
function feedback() {
  return msg ? '<div role="status" class="feedback ' + (correct ? 'good' : '') + '">' + esc(msg) + '</div>' : '';
}
const voiceLabels = {
  ready: 'Ketuk mikrofon, lalu ucapkan.',
  listening: 'Piko sedang mendengarkan…',
  processing: 'Sebentar, Piko sedang memeriksa…',
  recognized: 'Hebat! Ucapanmu dikenali.',
  retry: 'Belum terdengar jelas. Coba lagi, ya.',
  unavailable: 'Mikrofon belum bisa digunakan.'
};
function micBlock() {
  const busy = voice === 'listening' || voice === 'processing';
  return '<div class="center"><div class="control"><span class="wave" aria-hidden="true">╵╿╵</span>' + action('mic', ico('mic'), 'micro ' + voice, '', 'aria-label="Ucapkan dengan mikrofon" ' + (busy || correct ? 'disabled' : '')) + '<span class="wave" aria-hidden="true">╵╿╵</span></div><p role="status" style="margin-top:8px">' + esc(voiceLabels[voice]) + '</p>' + (heard ? '<small>Terdengar “' + esc(heard) + '”</small>' : '') + (!correct && !busy ? '<div>' + action('assist', 'Latihan bersama pendamping', 'linkbtn assist') + '</div>' : '') + '</div>';
}
function lessonPage() {
  const c = CATEGORIES[category],
    items = levelData().items,
    it = lessonItem(),
    s = exercise.stage,
    word = target(it);
  const counter = s === 0 ? category === 0 ? it.letter.charCodeAt(0) - 64 + '/26' : exercise.card + 1 + '/' + items.length : s === 4 ? exercise.final + 1 + '/3' : s + 1 + '/5';
  const pre = head(c.title, counter) + '<div class="hud"><small>Level ' + (level + 1) + ' · ' + levelData().title + '</small><small>Misi ' + (s + 1) + '/5</small></div>' + stepDots() + '<h1>' + stages[s] + '</h1>';
  let body = '';
  if (s === 0) {
    body = '<div class="speechcard">' + (category === 0
      ? '<b class="letter">' + it.letter + it.letter.toLowerCase() + '</b><div class="control">' + speaker(it.letter, 'Dengarkan huruf') + '</div>'
      : imageWord(it) + '<h2>' + esc(it.en) + '</h2><p>' + esc(it.id) + '</p><div class="control">' + speaker(it.en) + '</div>')
      + '</div>' + micBlock() + '<div class="navcards">' + circle('card', 'left', 'Kartu sebelumnya', -1, true, exercise.card === 0) + '<span>Kartu ' + (exercise.card + 1) + ' dari ' + items.length + '</span>' + circle('card', 'right', 'Kartu berikutnya', 1, true, exercise.card === items.length - 1) + '</div>' + (exercise.card === items.length - 1 ? action('nextMission', 'Lanjut ke misi 2 ' + ico('right'), 'primarybtn full') : '');
  }
  if (s === 1 || s === 4) {
    const audio = s === 1 || category === 0;
    body = '<div class="speechcard"><h2>' + (audio ? (category === 0 ? 'Huruf apa yang kamu dengar?' : 'Apa yang kamu dengar?') : category === 1 ? 'Apa bahasa Inggrisnya?' : 'Pilih kalimat yang sesuai.') + '</h2>' + (audio ? '<div class="actions">' + speaker(word) + '</div>' : imageWord(it) + '<p>' + esc(it.id) + '</p>') + options(it, false) + feedback() + '</div>';
  }
  if (s === 2) {
    body = '<div class="speechcard"><h2>' + (category === 0 ? 'Urutkan hurufnya' : category === 1 ? 'Susun hurufnya' : 'Susun kata-katanya') + '</h2>' + (category === 0 ? '<p>Mulai dari ' + answerWords[0] + '.</p>' : imageWord(it) + '<p>' + esc(it.id) + '</p>') + tiles() + feedback() + '</div>';
  }
  if (s === 3) {
    body = '<div class="speechcard">' + (category === 0 ? '<b class="letter">' + it.letter + it.letter.toLowerCase() + '</b>' : imageWord(it) + '<h2>' + esc(word) + '</h2>') + speaker(word) + '</div>' + micBlock() + feedback();
  }
  return pre + body + (s !== 0 && correct ? action('nextMission', s === 4 && exercise.final === 2 ? 'Selesaikan level' : 'Lanjut ' + ico('right'), 'primarybtn full') : '');
}
const builtInGamePool = CATEGORIES[1].levels.flatMap(l => l.items);
let gamePool = builtInGamePool;
function startGame(i) {
  const first = gamePool.find(x => x.en === ['Cat', 'Cap', 'Apple', 'Cat'][i]) || gamePool[0];
  round = {
    type: i,
    index: 0,
    score: 0,
    assisted: 0,
    items: [first, ...shuffle(gamePool.filter(x => x !== first)).slice(0, 9)]
  };
  tab = 'games';
  screen = 'play';
  setupQuestion();
  go('play');
}
function gamePage() {
  const t = round.type,
    it = round.items[round.index],
    g = GAMES[t];
  let body = t === 0 ? '<div class="actions">' + action('say', ico('sound'), 'micro', it.en, 'aria-label="Dengarkan kata"') + '</div>' + options(it, true, true) : t === 1 ? imageWord(it) + tiles() : t === 2 ? imageWord(it) + options(it, true) : imageWord(it) + '<h2>' + esc(it.en) + '</h2><div class="actions">' + speaker(it.en) + '</div><br>' + micBlock();
  return head(g.title, round.index + 1 + '/10', true) + '<div class="heading"><span class="kicker">Taman bermain</span><h1>' + g.title + '</h1><p>' + g.desc + '</p></div><div class="speechcard gamearea">' + body + feedback() + '</div>' + (correct ? action('nextGame', round.index === 9 ? 'Lihat hasil' : 'Soal berikutnya ' + ico('right'), 'primarybtn full') : '');
}
function resultPage() {
  return head('Hasil permainan') + '<div class="speechcard">' + owl('resultpic') + '<h1>Permainan Selesai!</h1><p>' + GAMES[gameResult.type].title + '</p><div class="statrow"><div><b>' + gameResult.score + '/10</b><small>Jawaban berhasil</small></div><div><b>+' + gameResult.score + '</b><small>Bintang</small></div><div><b>' + gameResult.assisted + '</b><small>Didampingi</small></div></div><p>Kamu sudah berlatih sampai akhir. Tos dulu!</p></div><div class="stack">' + action('game', 'Main Lagi', 'primarybtn', gameResult.type) + action('games', 'Kembali ke Permainan', 'outlinebtn') + '</div>';
}
function completePage() {
  return head('Hasil belajar') + '<div class="speechcard">' + owl('resultpic') + '<h1>Level selesai!</h1><p>' + CATEGORIES[category].short + ' · ' + levelData().title + '</p><div class="feedback good">Lima misi selesai · +' + levelResult + ' bintang</div><p>' + (level < 4 ? 'Level ' + (level + 2) + ' sudah terbuka.' : 'Semua level kategori ini sudah kamu jelajahi!') + '</p></div><div class="stack">' + action('levels', 'Lihat peta level', 'primarybtn') + action('home', 'Kembali ke Beranda', 'outlinebtn') + '</div>';
}
function advance() {
  if (exercise.stage !== 0 && !correct) return;
  if (exercise.stage === 0 && exercise.card !== levelData().items.length - 1) return;
  if (exercise.stage === 4 && exercise.final === 2) {
    levelResult = level === profile.done[category] ? 3 : 0;
    if (levelResult) {
      profile.done[category]++;
      profile.stars += 3;
    }
    delete profile.missions[key()];
    remember(CATEGORIES[category].short + ' · ' + levelData().title, '5 misi selesai · +' + levelResult + ' bintang');
    save();
    go('completed');
    return;
  }
  if (exercise.stage === 4) exercise.final++;else exercise.stage++;
  checkpoint();
  setupQuestion();
  render();
  page.scrollTop = 0;
}
function success(s = 'Betul! Kamu hebat.') {
  if (correct) return;
  correct = true;
  msg = s;
  if (screen === 'play') round.score++;
  render();
}
function stopVoice() {
  window.PronunciationService?.cancel();
  clearTimeout(voiceTimer);
  speakingId++;
  if (recognizer) {
    const r = recognizer;
    recognizer = null;
    try {
      r.abort();
    } catch (_) {}
  }
  if (window.SpeaNative && ['listening', 'processing'].includes(voice)) window.SpeaNative.postMessage(JSON.stringify({
    action: 'cancel'
  }));
  voice = 'ready';
  heard = '';
}
function onVoice(id, state, transcript = '') {
  if (id !== speakingId || !['play', 'lesson'].includes(screen)) return;
  if (!['listening', 'processing'].includes(voice)) return;
  if (state === 'final') {
    clearTimeout(voiceTimer);
    heard = transcript;
    const w = screen === 'play' ? round.items[round.index].en : target(lessonItem());
    const letterAliases = {
      a: ['ay', 'hey'],
      b: ['bee', 'be'],
      c: ['see', 'sea'],
      d: ['dee'],
      e: ['ee'],
      f: ['eff'],
      g: ['gee'],
      h: ['aitch'],
      i: ['eye'],
      j: ['jay'],
      k: ['kay'],
      l: ['ell'],
      m: ['em'],
      n: ['en'],
      o: ['oh'],
      p: ['pea', 'pee'],
      q: ['cue', 'queue'],
      r: ['are'],
      s: ['ess'],
      t: ['tea', 'tee'],
      u: ['you'],
      v: ['vee'],
      w: ['double you'],
      x: ['ex'],
      y: ['why'],
      z: ['zee', 'zed']
    };
    const valid = [normalize(w), ...(screen === 'lesson' && category === 0 ? letterAliases[w.toLowerCase()] || [] : [])];
    voice = valid.includes(normalize(transcript)) ? 'recognized' : 'retry';
    if (voice === 'recognized' && (screen === 'play' || exercise.stage === 3)) {
      success('Ucapanmu cocok. Bagus sekali!');
      return;
    }
  } else {
    voice = state;
    if (['unavailable', 'retry'].includes(state)) clearTimeout(voiceTimer);
  }
  render();
}
window.speaVoice = onVoice;
function listen() {
  if (window.PronunciationService) {
    if (window.PronunciationService.recording) { window.PronunciationService.stop(); return; }
    stopVoice(); stopAudio();
    const id = speakingId;
    const word = screen === 'play' ? round.items[round.index].en : target(lessonItem());
    const mode = screen === 'lesson' && category === 0 ? 'letter_name' : word.trim().includes(' ') ? 'sentence' : 'word';
    voice = 'listening'; render();
    window.PronunciationService.start(word, mode, screen === 'play' ? 'game-' + round.type : key(),
      (state, detail) => { if (id !== speakingId) return; voice = state; msg = detail || ''; render(); },
      result => {
        if (id !== speakingId) return;
        heard = result.recognized_text || '';
        const passed = result.assessment_status === 'assessed' && result.can_pass === true;
        voice = passed ? 'recognized' : 'retry';
        msg = result.feedback.message;
        if (passed && (screen === 'play' || exercise.stage === 3)) success(msg);
        else { notice(msg); render(); }
      });
    return;
  }
  stopVoice();
  stopAudio();
  const id = speakingId;
  voice = 'listening';
  render();
  voiceTimer = setTimeout(() => {
    if (id === speakingId) {
      stopVoice();
      voice = 'retry';
      render();
    }
  }, 18000);
  if (window.SpeaNative) {
    window.SpeaNative.postMessage(JSON.stringify({
      action: 'listen',
      id
    }));
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    onVoice(id, 'unavailable');
    return;
  }
  try {
    const r = new SR();
    recognizer = r;
    r.lang = 'en-US';
    r.interimResults = false;
    r.continuous = false;
    r.onspeechend = () => onVoice(id, 'processing');
    r.onresult = e => onVoice(id, 'final', e.results[0][0].transcript);
    r.onerror = e => onVoice(id, ['no-speech', 'aborted', 'nomatch'].includes(e.error) ? 'retry' : 'unavailable');
    r.onend = () => {
      if (id === speakingId && ['listening', 'processing'].includes(voice)) onVoice(id, 'retry');
    };
    r.start();
  } catch (_) {
    onVoice(id, 'unavailable');
  }
}
function back() {
  if (dialog.open) {
    dialog.close();
    return true;
  }
  if (screen === 'play') {
    modal('Keluar dari permainan?', 'Bintang permainan disimpan setelah sepuluh soal selesai.', action('games', 'Keluar', 'primarybtn'));
    return true;
  }
  const dest = {
    lesson: 'levels',
    completed: 'levels',
    levels: levelOrigin,
    alllevels: 'home',
    learn: 'home',
    history: 'profile',
    badge: 'rewards',
    result: 'games',
    rewards: 'home',
    games: 'home',
    profile: 'home'
  }[screen];
  if (dest) {
    go(dest);
    return true;
  }
  return false;
}
window.speaBack = back;
let levelOrigin = 'learn';
document.addEventListener('click', e => {
  const b = e.target.closest('[data-a]');
  if (!b || b.disabled) return;
  const a = b.dataset.a,
    v = b.dataset.v,
    i = Number(v);
  if (keys.includes(a) || ['learn', 'alllevels', 'history', 'levels'].includes(a)) {
    go(a);
    return;
  }
  switch (a) {
    case 'back':
      back();
      break;
    case 'dismiss':
      dialog.close();
      break;
    case 'category':
      if (!activeCategories.includes(i)) break;
      levelOrigin = screen === 'alllevels' ? 'alllevels' : 'learn';
      category = i;
      go('levels');
      break;
    case 'level':
      startLevel(i);
      break;
    case 'resume':
      levelOrigin = 'learn';
      category = profile.last;
      startLevel(resumeLevel());
      break;
    case 'card':
      exercise.card = Math.min(levelData().items.length - 1, Math.max(0, exercise.card + i));
      exercise.seen = Math.max(exercise.seen, exercise.card);
      checkpoint();
      setupQuestion();
      render();
      break;
    case 'nextMission':
      advance();
      break;
    case 'game':
      startGame(i);
      break;
    case 'badge':
      if (!activeBadges.includes(i)) break;
      badgeIndex = i;
      go('badge');
      break;
    case 'say':
      play(v);
      break;
    case 'enableSound':
      profile.audio = true;
      save();
      dialog.close();
      play(v);
      break;
    case 'audio':
      profile.audio = !profile.audio;
      stopAudio();
      save();
      render();
      break;
    case 'answer':
      if (correct) break;
      {
        const item = screen === 'play' ? round.items[round.index] : lessonItem();
        if (choices[i] === item) success();else {
          msg = 'Hampir! Coba pilihan yang lain.';
          render();
        }
      }
      break;
    case 'tile':
      if (correct || arranged.includes(i)) break;
      arranged.push(i);
      msg = '';
      if (arranged.length === answerWords.length) {
        if (arranged.every((n, j) => attempt[n] === answerWords[j])) {
          success('Susunannya tepat!');
          break;
        }
        arranged = [];
        msg = 'Belum pas. Yuk, susun sekali lagi.';
      }
      render();
      break;
    case 'undo':
      if (!correct) {
        arranged.splice(i, 1);
        render();
      }
      break;
    case 'mic':
      listen();
      break;
    case 'stopRecording':
      window.PronunciationService?.stop();
      break;
    case 'replayRecording':
      window.PronunciationService?.replay();
      break;
    case 'assist':
      stopVoice();
      stopAudio();
      render();
      modal('Berlatih bersama', 'Dengarkan contoh, lalu ucapkan kepada guru atau orang tua. Pendamping dapat mengonfirmasi setelah mendengar ucapanmu.', speaker(screen === 'play' ? round.items[round.index].en : target(lessonItem()), 'Putar contoh') + action('assisted', 'Sudah berlatih bersama', 'primarybtn'));
      break;
    case 'assisted':
      dialog.close();
      stopAudio();
      if (screen === 'play' || exercise.stage === 3) {
        if (correct) break;
        correct = true;
        if (screen === 'play') round.assisted++;
        msg = screen === 'play' ? 'Latihan bersama selesai. Soal ini tanpa bintang.' : 'Pendamping sudah mengonfirmasi latihanmu.';
      } else notice('Latihan bersama selesai.');
      render();
      break;
    case 'nextGame':
      if (!correct) break;
      if (round.index === 9) {
        gameResult = {
          ...round
        };
        profile.stars += round.score;
        if (round.type === 3 && round.score >= 5) profile.speaking = true;
        remember(GAMES[round.type].title, round.score + '/10 berhasil · +' + round.score + ' bintang');
        save();
        go('result');
      } else {
        round.index++;
        setupQuestion();
        render();
        page.scrollTop = 0;
      }
      break;
    case 'edit':
      dialog.innerHTML = '<h2>Profil belajarku</h2><form id="editform"><label>Nama panggilan<input id="nickname" maxlength="20" required value="' + esc(profile.name) + '"></label><label>Kelas<select id="grade">' + [1, 2, 3, 4, 5, 6].map(n => '<option ' + (String(n) === profile.grade ? 'selected' : '') + '>' + n + '</option>').join('') + '</select></label><div class="actions"><button class="primarybtn">Simpan</button>' + action('dismiss', 'Tutup', 'outlinebtn') + '</div></form>';
      dialog.showModal();
      break;
    case 'help':
      modal('Belajar bersama Piko', 'Pilih Mulai Belajar, lalu pilih kategori dan level. Tuntaskan lima misi untuk membuka level berikutnya. Ketuk pengeras suara untuk mendengarkan contoh. Izin mikrofon hanya diperlukan untuk latihan bicara.');
      break;
    case 'cloud_account': {
      if (!window.SpeaCloud) {
        modal('Cloud Belum Siap', 'Pustaka Supabase belum termuat.');
        break;
      }
      const user = window.SpeaCloud.getCurrentUser();
      const cfg = window.SpeaCloud.getConfig();
      if (!cfg.url || !cfg.anonKey) {
        dialog.innerHTML = '<h2>Hubungkan ke Supabase</h2><p>Masukkan Project URL dan Anon Public Key dari Supabase kamu:</p><form id="supacfgform"><label>Project URL<input id="supaurl" type="url" placeholder="https://xyz.supabase.co" required value="' + esc(cfg.url) + '"></label><label>Anon Public Key<input id="supakey" type="text" placeholder="eyJh..." required value="' + esc(cfg.anonKey) + '"></label><div class="actions"><button class="primarybtn">Simpan Kunci</button>' + action('dismiss', 'Batal', 'outlinebtn') + '</div></form>';
        dialog.showModal();
        break;
      }
      if (user) {
        dialog.innerHTML = '<h2>Akun Cloud Supabase</h2><p>Tersambung sebagai: <strong>' + esc(user.email) + '</strong></p><p>Semua bintang (' + profile.stars + ') dan progres level tersimpan aman di cloud.</p><div class="actions"><button type="button" class="primarybtn" data-a="cloud_sync_now">Sinkronkan Sekarang</button><button type="button" class="outlinebtn" data-a="cloud_logout">Keluar Akun</button>' + action('dismiss', 'Tutup', 'outlinebtn') + '</div><div style="margin-top:14px;text-align:center">' + action('cloud_cfg', 'Ganti Kunci Supabase', 'linkbtn') + '</div>';
        dialog.showModal();
      } else {
        dialog.innerHTML = '<h2>Masuk Akun SpeaKids</h2><p>Simpan bintang dan level belajarmu di database Supabase.</p><form id="supaauthform"><label>Email<input id="supaemail" type="email" required placeholder="nama@email.com"></label><label>Kata Sandi<input id="supapassword" type="password" required minlength="6" placeholder="Minimal 6 karakter"></label><div class="actions"><button type="submit" name="btn" value="login" class="primarybtn">Masuk</button><button type="submit" name="btn" value="register" class="outlinebtn">Daftar Baru</button></div><div style="margin-top:14px;display:flex;justify-content:space-between">' + action('cloud_cfg', 'Ganti Kunci Supabase', 'linkbtn') + action('dismiss', 'Batal', 'linkbtn') + '</div></form>';
        dialog.showModal();
      }
      break;
    }
    case 'cloud_cfg': {
      const cfg = window.SpeaCloud.getConfig();
      dialog.innerHTML = '<h2>Konfigurasi Supabase</h2><p>Masukkan Project URL dan Anon Key dari dashboard Supabase:</p><form id="supacfgform"><label>Project URL<input id="supaurl" type="url" placeholder="https://xyz.supabase.co" required value="' + esc(cfg.url) + '"></label><label>Anon Public Key<input id="supakey" type="text" placeholder="eyJh..." required value="' + esc(cfg.anonKey) + '"></label><div class="actions"><button class="primarybtn">Simpan</button>' + action('dismiss', 'Batal', 'outlinebtn') + '</div></form>';
      dialog.showModal();
      break;
    }
    case 'cloud_sync_now': {
      if (!window.SpeaCloud) break;
      notice('Menyinkronkan data dengan Supabase...');
      clearTimeout(syncTimer);
      syncCloud().then(() => {
        notice('Data berhasil disinkronkan!');
        dialog.close();
        render();
      }).catch(err => {
        notice('Gagal sinkron: ' + err.message);
      });
      break;
    }
    case 'cloud_logout': {
      if (window.SpeaCloud) {
        window.SpeaCloud.logout().then(() => {
          notice('Berhasil keluar dari akun.');
          dialog.close();
          switchAccount();
        }).catch(err => { switchAccount(); notice('Keluar lokal. Server: ' + err.message); });
      }
      break;
    }
    case 'leaderboard': {
      if (!window.SpeaCloud || !window.SpeaCloud.isReady()) {
        modal('Papan Peringkat', 'Hubungkan ke Supabase terlebih dahulu untuk melihat papan peringkat siswa.');
        break;
      }
      dialog.innerHTML = '<h2>Papan Peringkat 🏆</h2><p>Memuat peringkat siswa...</p><div class="actions">' + action('dismiss', 'Tutup', 'outlinebtn') + '</div>';
      dialog.showModal();
      window.SpeaCloud.getLeaderboard().then(list => {
        let rows = '';
        if (!list || list.length === 0) {
          rows = '<p class="empty">Belum ada data siswa di papan peringkat.</p>';
        } else {
          rows = '<div class="stack" style="max-height:260px;overflow-y:auto;margin:12px 0">' + list.map((item, idx) => {
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '#' + (idx + 1);
            return '<div class="linebtn" style="cursor:default"><span><strong style="margin-right:8px">' + medal + '</strong>' + esc(item.name) + ' <small>(Kelas ' + esc(item.grade) + ')</small></span><span class="end" style="color:#d88e16;font-weight:bold">' + ico('star') + ' ' + (item.stars || 0) + '</span></div>';
          }).join('') + '</div>';
        }
        dialog.innerHTML = '<h2>Papan Peringkat 🏆</h2><p>Siswa dengan bintang terbanyak:</p>' + rows + '<div class="actions">' + action('dismiss', 'Tutup', 'primarybtn') + '</div>';
      }).catch(err => {
        dialog.innerHTML = '<h2>Papan Peringkat 🏆</h2><p>Gagal memuat: ' + esc(err.message) + '</p><div class="actions">' + action('dismiss', 'Tutup', 'outlinebtn') + '</div>';
      });
      break;
    }
  }
});
document.addEventListener('submit', e => {
  if (e.target.id === 'editform') {
    e.preventDefault();
    const n = $('nickname').value.trim();
    if (!n) {
      $('nickname').focus();
      return;
    }
    profile.name = n;
    profile.grade = $('grade').value;
    save();
    dialog.close();
    render();
    return;
  }
  if (e.target.id === 'supacfgform') {
    e.preventDefault();
    const u = $('supaurl').value.trim();
    const k = $('supakey').value.trim();
    if (window.SpeaCloud) {
      try { window.SpeaCloud.setConfig(u, k); }
      catch (err) { notice(err.message); return; }
      switchAccount();
      notice('Kunci Supabase disimpan.');
      dialog.close();
      render();
    }
    return;
  }
  if (e.target.id === 'supaauthform') {
    e.preventDefault();
    const email = $('supaemail').value.trim();
    const password = $('supapassword').value;
    const isRegister = e.submitter && e.submitter.value === 'register';
    if (!window.SpeaCloud) return;

    notice(isRegister ? 'Mendaftarkan akun...' : 'Sedang masuk...');
    const actionPromise = isRegister
      ? window.SpeaCloud.register(email, password, profile.name, profile.grade)
      : window.SpeaCloud.login(email, password);

    actionPromise.then(async result => {
      if (isRegister && result.requiresConfirmation) {
        notice('Pendaftaran diterima. Konfirmasi email, lalu masuk.');
        return;
      }
      switchAccount();
      await restoreCloud();
      notice('Akun aktif. Progres cloud berhasil dimuat.');
      dialog.close();
      render();
    }).catch(err => {
      notice('Gagal: ' + (err.message || 'Periksa email dan sandi.'));
    });
    return;
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !dialog.open) {
    e.preventDefault();
    back();
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopAudio();
    if (!window.SpeaNative) {
      stopVoice();
      render();
    }
  }
});
$('ground').innerHTML = hills();
render();

async function loadPublishedMaterials() {
  if (!window.SpeaCloud?.isReady()) return;
  const rows = await window.SpeaCloud.getLevels();
  if (['lesson','play'].includes(screen)) { notice('Materi baru tersedia. Buka ulang aplikasi setelah latihan.'); return; }
  profile.materialRevisions ||= {};
  for (const row of rows) {
    const entry = CATEGORIES[row.category_id]?.levels[row.level_index];
    if (!entry || !activeCategories.includes(row.category_id)) continue;
    const materialKey = row.category_id + '-' + row.level_index;
    const changed = profile.materialRevisions[materialKey] !== row.revision;
    entry.title = row.title;
    entry.disabled = !row.published;
    if (row.published && row.items.length >= 3) entry.items = row.items;
    if (changed) delete profile.missions[materialKey];
    profile.materialRevisions[materialKey] = row.revision;
  }
  const pool = CATEGORIES[1].levels.filter(l => !l.disabled).flatMap(l => l.items);
  gamePool = pool.length >= 10 ? pool : builtInGamePool;
  localStorage.setItem(storageKey(), JSON.stringify(profile));
  render();
}
loadPublishedMaterials().catch(err => notice('Materi cloud belum dimuat; memakai materi lokal. ' + err.message));

if (window.SpeaCloud) {
  window.SpeaCloud.checkSession().then(async user => {
    if (user) {
      switchAccount();
      await restoreCloud();
    }
  }).catch(err => notice('Cloud belum tersedia: ' + err.message));
}
})();
