/* Interactive article state. Pure functions; no network, eval or storage. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else (root.EH=root.EH||{}).WikiBlocks=api;
})(globalThis,function(){
  'use strict';
  const types=['scenario','detective','comparison','perspectives','decision','challenge'];
  function initial(b){return {started:false,selected:[],choice:0,order:(b.items||[]).map(x=>x.id),node:b.start,history:[],feedback:'',tone:'',done:false,event:''};}
  function transition(b,previous,action,value){
    const s=JSON.parse(JSON.stringify(previous||initial(b))); s.event='';
    if(action==='reset')return initial(b);
    if(action==='start'){s.started=true;s.event='start';return s;}
    if(['scenario','detective','decision','challenge'].includes(b.type)&&!s.started)return s;
    if(b.type==='scenario'&&action==='choose'){
      const option=b.options.find(x=>x.id===value); if(!option)return s;
      s.selected=[value];s.feedback=option.feedback;s.done=option.result==='success';s.tone=s.done?'success':'reflect';s.event=s.done?'success':'retry';
    }
    if(b.type==='detective'&&action==='inspect'){
      const item=b.items.find(x=>x.id===value);if(!item)return s;
      if(item.issue&&!s.selected.includes(value))s.selected.push(value);
      s.feedback=item.feedback;s.tone=item.issue?'success':'reflect';
      s.done=b.items.filter(x=>x.issue).every(x=>s.selected.includes(x.id));
      s.event=s.done?'complete':item.issue?'success':'retry';
    }
    if(['comparison','perspectives'].includes(b.type)&&action==='switch'){
      const choices=b.type==='comparison'?b.variants:b.perspectives;
      const n=Number(value);if(!Number.isInteger(n)||n<0||n>=choices.length)return s;
      s.choice=n;s.event='change';
    }
    if(b.type==='decision'){
      if(action==='back'&&s.history.length){s.node=s.history.pop();s.done=false;s.event='change';}
      if(action==='answer'){
        const node=b.nodes.find(x=>x.id===s.node);
        const option=(node?.options||[]).find(x=>x.id===value);
        if(!option||!b.nodes.some(x=>x.id===option.next))return s;
        s.history.push(s.node);s.node=option.next;
        s.done=Boolean(b.nodes.find(x=>x.id===s.node).result);s.event=s.done?'complete':'change';
      }
    }
    if(b.type==='challenge'){
      if(action==='up'||action==='down'){
        const from=s.order.indexOf(value),to=from+(action==='up'?-1:1);
        if(from<0||to<0||to>=s.order.length)return s;
        [s.order[from],s.order[to]]=[s.order[to],s.order[from]];s.feedback='';s.tone='';s.done=false;
      }
      if(action==='check'){
        s.done=s.order.every((id,i)=>b.solution[i]===id);
        s.feedback=s.done?b.success:b.retry;s.tone=s.done?'success':'reflect';s.event=s.done?'complete':'retry';
      }
    }
    return s;
  }
  function message(article,block,event,defaults){
    return block?.hubi?.[event]||article?.hubi?.[event]||defaults?.[event]||'';
  }
  return {types,initial,transition,message};
});
