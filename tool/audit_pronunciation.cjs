// Real HTTP API + Chromium fake microphone (synthetic input, not accuracy evidence).
const {spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{
   const p=path.join(root,decodeURIComponent(req.url.split('?')[0]));
   if(!p.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
   fs.readFile(p,(e,data)=>{res.writeHead(e?404:200,{'Content-Type':p.endsWith('.js')?'application/javascript':p.endsWith('.css')?'text/css':'text/html'});res.end(e?'missing':data);});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const api=spawn(process.env.SPEECH_PYTHON||'python',['-m','uvicorn','app.main:app','--port','18765','--no-access-log'],{cwd:path.join(root,'pronunciation_backend'),env:{...process.env,DEV_NO_AUTH:'true',CORS_ORIGINS:base},stdio:'ignore'});
 let browser;
 try{
  for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:18765/health')).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));}
  browser=await chromium.launch({channel:'chrome',args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
  const page=await browser.newPage();await page.goto(base+'/assets/app/index.html');
  await page.evaluate(()=>{window.SPEAKIDS_PRONUNCIATION={baseUrl:'http://127.0.0.1:18765'};});
  await page.locator('[data-a="games"]').click();await page.locator('[data-a="game"][data-v="3"]').click();
  await page.locator('[data-a="mic"]').click();await page.waitForTimeout(1200);
  const response=page.waitForResponse(r=>r.url().endsWith('/pronunciation/assess'));
  await page.locator('[data-a="stopRecording"]').click();const result=await (await response).json();
  assert.equal(result.can_pass,false);assert.equal(result.overall_score,null);
  assert.ok(['model_unavailable','no_speech','uncertain'].includes(result.assessment_status));
  await page.waitForTimeout(100);assert.equal(await page.locator('[data-a="nextGame"]').count(),0);
  await page.locator('[data-a="assist"]').click();await page.locator('[data-a="assisted"]').click();
  assert.equal(await page.locator('[data-a="nextGame"]').count(),1);
  console.log('PASS real HTTP record/stop/upload/response; unavailable does not pass; assistance available. Status:',result.assessment_status);
 }finally{await browser?.close();api.kill();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
