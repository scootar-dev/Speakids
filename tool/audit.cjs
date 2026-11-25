// Run: node tool/audit.cjs. Requires Playwright (or PLAYWRIGHT_MODULE).
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const results = [];
async function test(name, fn) {
  try { await fn(); results.push({ name, status: 'PASS' }); }
  catch (e) { results.push({ name, status: 'FAIL', error: e.message }); }
}
(async () => {
  let server;
  vm.runInNewContext(fs.readFileSync(path.join(root, 'server.js'), 'utf8'), {
    __dirname: root, console: { log() {} }, process: { platform: 'audit' },
    require(name) {
      if (name === 'http') return { createServer(handler) {
        server = require('node:http').createServer(handler);
        server.listen = function (_, cb) { return require('node:http').Server.prototype.listen.call(this, 0, '127.0.0.1', cb); };
        return server;
      } };
      return require(name);
    }
  });
  await new Promise(resolve => server.listening ? resolve() : server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    // Expose lexical state to tests only; production remains encapsulated.
    await page.route('**/app.js', route => route.fulfill({
      contentType: 'application/javascript',
      body: fs.readFileSync(path.join(root, 'assets/app/app.js'), 'utf8').replace(/\}\)\(\);\s*$/, 'window.auditEval = code => eval(code);\n})();')
    }));
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base + '/assets/app/index.html');
    const click = (a, v) => page.locator(`[data-a="${a}"]${v === undefined ? '' : `[data-v="${v}"]`}`).first().click();
    const ev = code => page.evaluate(code => window.auditEval(code), code);
    await test('Initial page and cloud default', async () => {
      assert.match(await page.locator('#page').innerText(), /Halo, Teman/);
      assert.equal(await ev('SpeaCloud.isReady()'), false);
    });
    await test('Navigation, badges, help, history and cloud dialogs', async () => {
      for (const a of ['rewards', 'games', 'profile', 'history', 'home', 'learn', 'alllevels']) await ev(`go('${a}')`);
      await ev("go('profile')");
      for (const a of ['help']) { await click(a); assert.equal(await page.locator('#dialog').evaluate(x => x.open), true); await click('dismiss'); }
      assert.equal(await page.locator('[data-a="cloud_account"]').count(),0);
      await ev("go('rewards')");
      for (const i of [0,1,3,4]) { await click('badge', i); await click('back'); }
    });
    await test('Profile edit, audio setting and reload persistence', async () => {
      await ev("go('profile')"); await click('edit');
      await page.locator('#nickname').fill('Audit Siswa'); await page.locator('#grade').selectOption('4');
      await page.locator('#editform button').first().click(); await click('audio');
      await page.reload(); assert.equal(await ev('profile.name'), 'Audit Siswa');
      assert.equal(await ev('profile.grade'), '4'); assert.equal(await ev('profile.audio'), false);
      await ev('profile.audio = true; save()');
    });
    await test('Daily removed and legacy resume redirected; profile has no cloud configuration', async () => {
      await ev("go('learn')");assert.equal(await page.locator('[data-a="category"]').count(),3);
      assert.equal(await page.locator('[data-a="category"][data-v="2"]').count(),0);
      await ev("profile.last=2;profile.lastLevel=3;go('home')");assert.equal(await ev('profile.last'),0);
      await ev("go('rewards')");assert.equal(await page.locator('[data-a="badge"]').count(),4);
      await ev("go('profile')");assert.match(await page.locator('#page').innerText(),/0\/3/);
      assert.doesNotMatch(await page.locator('#page').innerText(),/Supabase|Project URL|Daily/);
    });
    await test('All content audio and image assets exist', async () => {
      const sounds = await ev('Object.values(SOUNDS)');
      assert.equal(sounds.length, 89);
      for (const name of sounds) assert.ok(fs.existsSync(path.join(root, 'assets/app/audio', name)), name);
      const missing = await ev('CATEGORIES.flatMap(c=>c.levels.flatMap(l=>l.items)).filter(i=>!SOUNDS[i.en] || (i.letter && !SOUNDS[i.letter])).map(i=>i.en)');
      assert.deepEqual(missing, []);
      for (const img of await page.locator('img').evaluateAll(xs => xs.map(x => ({ src: x.src, ok: x.complete && x.naturalWidth > 0 })))) assert.ok(img.ok, img.src);
    });
    await test('Locked level and unfinished mission cannot advance', async () => {
      await ev('category=0; startLevel(0); startLevel(1); advance()');
      assert.equal(await ev('level'), 0); assert.equal(await ev('exercise.stage'), 0);
    });
    await test('Lesson checkpoint survives reload', async () => {
      await click('card', 1); await page.reload(); await click('resume');
      assert.equal(await ev('exercise.card'), 1);
    });
    await test('Alphabet cards: letters only, speaker and microphone recognition', async () => {
      await ev('category=0; startLevel(0)');
      assert.equal(await page.locator('#page img').count(),0);
      assert.equal(await page.locator('[data-a="mic"]').count(),1);
      assert.equal(await page.locator('[data-a="say"]').count(),1);
      assert.equal(await page.locator('[data-a="say"]').getAttribute('data-v'),await ev('lessonItem().letter'));
      await ev("voice='listening'; onVoice(speakingId,'final',lessonItem().letter)");
      assert.equal(await ev('voice'), 'recognized');
      assert.equal(await ev('exercise.stage'),0);
      for (const stage of [1,2,3,4]) {
        await ev(`exercise.stage=${stage}; setupQuestion(); render()`);
        assert.equal(await page.locator('#page img').count(),0);
        assert.equal(await page.locator('#page').innerText().then(t=>t.includes('Apple')),false);
      }
      await ev('exercise.stage=0; exercise.card=0; checkpoint(); setupQuestion(); render()');
    });
    async function finishLevel(c, l) {
      await ev(`category=${c}; startLevel(${l})`);
      while (await ev('exercise.card < levelData().items.length-1')) await click('card', 1);
      await click('nextMission');
      const wrong = await ev('choices.findIndex(x=>x!==lessonItem())'); await click('answer', wrong);
      assert.equal(await ev('correct'), false);
      await click('answer', await ev('choices.indexOf(lessonItem())')); await click('nextMission');
      for (const i of await ev('(()=>{const used=[];return answerWords.map(w=>{const i=attempt.findIndex((v,j)=>v===w&&!used.includes(j));used.push(i);return i})})()')) await click('tile', i);
      await click('nextMission'); await click('assist'); await click('assisted'); await click('nextMission');
      for (let i = 0; i < 3; i++) { await click('answer', await ev('choices.indexOf(lessonItem())')); await click('nextMission'); }
      assert.equal(await ev('screen'), 'completed');
    }
    for (const c of [0,1,3]) for (let l = 0; l < 5; l++) await test(`Lesson category ${c + 1} level ${l + 1}: five missions`, () => finishLevel(c, l));
    await test('15 completed levels award 45 stars; replay awards zero', async () => {
      assert.deepEqual(await ev('profile.done'), [5,5,0,5]); assert.equal(await ev('profile.stars'), 45);
      await finishLevel(0,0); assert.equal(await ev('levelResult'), 0); assert.equal(await ev('profile.stars'), 45);
    });
    for (let type = 0; type < 4; type++) await test(`Game ${type + 1}: ten questions and reward`, async () => {
      const before = await ev('profile.stars'); await ev(`startGame(${type})`);
      for (let n = 0; n < 10; n++) {
        if (type === 1) for (const i of await ev('(()=>{const used=[];return answerWords.map(w=>{const i=attempt.findIndex((v,j)=>v===w&&!used.includes(j));used.push(i);return i})})()')) await click('tile', i);
        else if (type === 3) await ev("voice='listening'; onVoice(speakingId,'final',round.items[round.index].en)");
        else await click('answer', await ev('choices.indexOf(round.items[round.index])'));
        await click('nextGame');
      }
      assert.equal(await ev('profile.stars'), before + 10); assert.equal(await ev('screen'), 'result');
    });
    await test('Speaking badge, wrong transcript, stale result and assisted scoring', async () => {
      assert.equal(await ev('profile.speaking'), true); await ev('startGame(3)');
      await ev("voice='listening'; onVoice(speakingId,'final','wrong')"); assert.equal(await ev('correct'), false);
      await ev("voice='listening'; onVoice(speakingId-1,'final',round.items[0].en)"); assert.equal(await ev('correct'), false);
      await click('assist'); await click('assisted'); assert.equal(await ev('round.score'), 0); assert.equal(await ev('round.assisted'), 1);
    });
    await test('Audio decodes and plays in Chrome', async () => {
      await ev("stopVoice(); play('Apple')"); await page.waitForFunction(() => window.auditEval('player && player.currentTime > 0'));
      assert.equal(await ev('player.error'), null); assert.ok(await ev('player.currentTime > 0'));
    });
    await test('History cap and persistent stars', async () => {
      await ev("for(let i=0;i<105;i++) remember('Audit','Test');save()"); await page.reload();
      assert.equal(await ev('profile.history.length'), 100); assert.equal(await ev('profile.stars'), 85);
    });
    await test('No browser JavaScript runtime errors', () => assert.deepEqual(errors, []));
    await test('Root URL serves usable application assets', async () => {
      const p = await browser.newPage(); await p.goto(base + '/');
      await p.waitForTimeout(500); assert.match(await p.locator('#page').innerText(), /Halo/); await p.close();
    });
    await test('Cloud propagates database rejection (mock)', async () => {
      const store = new Map([['speakids.supabase.cfg',JSON.stringify({url:'https://audit.supabase.co',anonKey:'test'})]]);
      const context = { localStorage: { getItem: k => store.get(k), setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k) }, setTimeout,clearTimeout,AbortController,URL, console,
        fetch:async url => ({ok:!url.includes('speakids_sync'),status:403,text:async()=>JSON.stringify(url.includes('/token')?{access_token:'test',expires_in:3600,user:{id:'audit'}}:{message:'RLS denied'})}) };
      context.window = context;
      context.supabase = { createClient: () => ({ auth: { getSession: async () => ({data:{session:{user:{id:'audit'}}}}) }, from: () => ({upsert:async()=>({error:{message:'RLS denied'}})}) }) };
      vm.runInNewContext(fs.readFileSync(path.join(root,'assets/app/supabase.js'),'utf8'), context);
      await context.SpeaCloud.login('audit@test.local','password');
      await assert.rejects(context.SpeaCloud.pushUserData({ name:'Audit',grade:'1',done:[] }), /RLS denied/);
    });
    await test('Stable history identity across repeated local saves', async () => {
      await ev("remember('Stable','test'); save()");
      const id=await ev('profile.history[0].id');
      await ev('save()'); assert.equal(await ev('profile.history[0].id'),id);
    });
    await test('Cloud confirmation, account isolation, audio and badge restore', async () => {
      await page.route('https://audit.supabase.co/**', async route => {
        const url=route.request().url();
        let data={};
        if(url.includes('/signup')) data={id:'pending'};
        else if(url.includes('/token')) data={access_token:'token',refresh_token:'refresh',expires_in:3600,user:{id:'student',email:'student@test.local'}};
        else if(url.includes('speakids_snapshot')) data={name:'Cloud Student',grade:'3',stars:7,done:[1,0,0,0],missions:{},history:[],audio:false,speaking:true};
        else if(url.includes('speakids_sync')) data=JSON.parse(route.request().postData()).payload;
        await route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
      });
      await ev("SpeaCloud.setConfig('https://audit.supabase.co','public-test')");
      const pending=await ev("SpeaCloud.register('pending@test.local','password','Pending','1')");
      assert.equal(pending.requiresConfirmation,true);assert.equal(await ev('SpeaCloud.getCurrentUser()'),null);
      await ev("SpeaCloud.login('student@test.local','password')");await ev('switchAccount(); restoreCloud()');
      assert.equal(await ev('profile.stars'),7);assert.equal(await ev('profile.audio'),false);assert.equal(await ev('profile.speaking'),true);
      await ev('SpeaCloud.logout()');await ev('switchAccount()');assert.equal(await ev('profile.stars'),85);
    });
    await test('Admin UI: login, publish, edit, delete and student material read', async () => {
      const admin=await browser.newPage();let rows=[];
      await admin.route('https://audit.supabase.co/**',async route=>{
        const url=route.request().url();let data=[];
        if(url.includes('/token'))data={access_token:'token',expires_in:3600,user:{id:'admin'}};
        else if(url.includes('content_admins'))data=[{user_id:'admin'}];
        else if(url.includes('save_learning_level')){const b=JSON.parse(route.request().postData());data={category_id:b.c,level_index:b.l,title:b.t,items:b.body,published:b.enabled,revision:b.expected_revision+1};rows=[data];}
        else if(url.includes('learning_levels'))data=rows;
        await route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
      });
      await admin.goto(base+'/admin/index.html');
      await admin.locator('#url').fill('https://audit.supabase.co');await admin.locator('#key').fill('test');await admin.locator('#config button').click();
      await admin.locator('#email').fill('admin@test.local');await admin.locator('#password').fill('password');await admin.locator('#login button').click();
      await admin.locator('#workspace').waitFor({state:'visible'});
      await admin.locator('#title').fill('Huruf admin');await admin.locator('#save').click();
      await admin.waitForFunction(()=>document.getElementById('status').textContent.includes('diterbitkan'));
      assert.equal(rows[0].title,'Huruf admin');
      await admin.locator('[data-remove="0"]').click();await admin.locator('#save').click();
      await admin.waitForFunction(()=>document.getElementById('source').textContent.includes('revisi 2'));
      assert.equal(rows[0].items.length,5);
      await page.route('https://audit.supabase.co/rest/v1/learning_levels**',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(rows)}));
      await ev("go('home'); loadPublishedMaterials()");assert.equal(await ev('CATEGORIES[0].levels[0].title'),'Huruf admin');
      admin.once('dialog',d=>d.accept());await admin.locator('#delete').click();
      await admin.waitForFunction(()=>document.getElementById('source').textContent.includes('Dinonaktifkan'));
      assert.equal(rows[0].published,false);
      await ev('loadPublishedMaterials()');assert.equal(await ev('CATEGORIES[0].levels[0].disabled'),true);
      await admin.close();
    });
    console.log(JSON.stringify({diagnosticWorkaround:process.env.AUDIT_WORKAROUND === '1',results, passed:results.filter(x=>x.status==='PASS').length, failed:results.filter(x=>x.status==='FAIL').length},null,2));
    if (results.some(x => x.status === 'FAIL')) process.exitCode = 1;
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exitCode=1; });
