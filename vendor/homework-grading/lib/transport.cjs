'use strict';
function createModelTransport({url,apiKey,fetchImpl=fetch}){
  if(!url||!apiKey)throw Error('Configure the model gateway URL and API key on the server');
  return async function callModel(body,{signal}={}){
    const response=await fetchImpl(url,{method:'POST',headers:{'content-type':'application/json',Authorization:'Bearer '+apiKey},body:JSON.stringify(body),signal});
    if(!response.ok)throw Error('Model gateway HTTP '+response.status);
    let result='',finish='';
    function consume(s){
      if(s==='[DONE]')return;
      const value=JSON.parse(s);if(value.error||value.wel_error)throw Error('Model gateway error');
      const c=value.choices?.[0];if(!c)return;
      result+=c.delta?.content||c.message?.content||'';if(c.finish_reason)finish=c.finish_reason;
    }
    if((response.headers.get('content-type')||'').includes('text/event-stream')){
      const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
      try{
        while(true){const part=await reader.read();if(part.done)break;buffer+=decoder.decode(part.value,{stream:true});let at;
          while((at=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,at).trim();buffer=buffer.slice(at+1);if(line.startsWith('data:'))consume(line.slice(5).trim());}}
        buffer+=decoder.decode();if(buffer.trim().startsWith('data:'))consume(buffer.trim().slice(5).trim());
      }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
    }else consume(JSON.stringify(await response.json()));
    if(!result.trim()||finish==='length')throw Error('Incomplete model response');
    return result;
  };
}
module.exports={createModelTransport};
