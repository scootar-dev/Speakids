// Microphone PCM capture and assessment transport shared by browser and Android WebView.
(() => {
  let context, stream, node, source, chunks=[], timer, controller, generation=0, playbackUrl;
  const cfg=()=>window.SPEAKIDS_PRONUNCIATION || {};
  function closeCapture(){clearTimeout(timer);if(node){node.disconnect();node.onaudioprocess=null;}source?.disconnect();stream?.getTracks().forEach(t=>t.stop());context?.close();node=source=stream=context=null;}
  function wav(samples,rate){const b=new ArrayBuffer(44+samples.length*2),v=new DataView(b);const text=(o,s)=>[...s].forEach((c,i)=>v.setUint8(o+i,c.charCodeAt(0)));text(0,'RIFF');v.setUint32(4,36+samples.length*2,true);text(8,'WAVE');text(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);text(36,'data');v.setUint32(40,samples.length*2,true);samples.forEach((x,i)=>v.setInt16(44+i*2,Math.max(-1,Math.min(1,x))*32767,true));return new Blob([b],{type:'audio/wav'});}
  window.PronunciationService={
    recording:false,
    cancel(){generation++;this.recording=false;closeCapture();controller?.abort();chunks=[];if(playbackUrl)URL.revokeObjectURL(playbackUrl);playbackUrl=null;},
    replay(){if(playbackUrl)new Audio(playbackUrl).play().catch(()=>{});},
    async start(targetText,exerciseType,exerciseId,onState,onResult){
      this.cancel();const version=generation;let rate;
      try{
        if(!cfg().baseUrl)throw new Error('Penilai suara belum diatur. Gunakan latihan bersama pendamping.');
        stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true}});
        if(version!==generation){stream.getTracks().forEach(t=>t.stop());return;}
        context=new AudioContext({sampleRate:16000});await context.resume();rate=context.sampleRate;
        source=context.createMediaStreamSource(stream);node=context.createScriptProcessor(4096,1,1);
        node.onaudioprocess=e=>{chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));};
        source.connect(node);node.connect(context.destination);this.recording=true;onState('listening');
        this.stop=async()=>{
          if(!this.recording)return;this.recording=false;
          const length=chunks.reduce((n,x)=>n+x.length,0),samples=new Float32Array(length);let offset=0;for(const x of chunks){samples.set(x,offset);offset+=x.length;}chunks=[];closeCapture();
          const audio=wav(samples,rate);playbackUrl=URL.createObjectURL(audio);onState('processing');
          controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),45000);
          try{
            const token=await window.SpeaCloud?.getPronunciationToken();
            if(version!==generation)return;
            const form=new FormData();form.append('audio',audio,'speech.wav');form.append('target_text',targetText);form.append('exercise_type',exerciseType);form.append('exercise_id',exerciseId);
            const response=await fetch(cfg().baseUrl.replace(/\/$/,'')+'/api/v1/pronunciation/assess',{method:'POST',body:form,signal:controller.signal,headers:token?{Authorization:'Bearer '+token}:{}});
            if(!response.ok)throw new Error(response.status===401?'Sesi penilaian belum tersedia. Coba lagi atau minta pendamping.':'Penilai suara belum tersedia. Coba lagi, ya!');
            const result=await response.json();
            if(!result.assessment_status||typeof result.can_pass!=='boolean'||!result.feedback?.message)throw new Error('Respons penilai belum bisa dibaca.');
            if(version===generation)onResult(result);
          }catch(e){if(version===generation)onState('unavailable',e.message);}finally{clearTimeout(timeout);}
        };
        timer=setTimeout(()=>this.stop(),10000);
      }catch(e){if(version===generation){closeCapture();this.recording=false;onState('unavailable',e.name==='NotAllowedError'?'Izinkan mikrofon untuk berlatih, atau gunakan pendamping.':e.message);}}
    }
  };
})();
