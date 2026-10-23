/* One delegated handler for all article activities. State lasts for this tab only. */
(function(root){
  'use strict';
  const {Data:D,WikiBlocks:M,WikiBlockView:V}=root.EH;
  function create({react}){
    const states=Object.create(null),entries=new Map();
    for(const a of D.articles)for(const [si,s] of a.sections.entries())for(const b of s.blocks||[])entries.set(V.key(a,s.id||String(si),b),{article:a,sectionId:s.id||String(si),block:b});
    function handleClick(event){
      const target=event.target instanceof Element?event.target:null;
      const button=target?.closest('[data-wb-action]');if(!button)return false;
      const container=button.closest('[data-wb-key]');if(!container)return false;
      const entry=entries.get(container.dataset.wbKey);if(!entry)return false;
      event.preventDefault();
      const k=container.dataset.wbKey,action=button.dataset.wbAction,value=button.dataset.wbValue;
      const before=states[k]||M.initial(entry.block);
      const after=M.transition(entry.block,before,action,value);states[k]=after;
      const shell=document.createElement('div');shell.innerHTML=V.render(entry.article,entry.sectionId,entry.block,after);
      const fresh=shell.firstElementChild;container.replaceWith(fresh);
      const candidates=[...fresh.querySelectorAll('[data-wb-action]')];
      const same=candidates.find(x=>x.dataset.wbAction===action&&x.dataset.wbValue===value&&!x.disabled);
      const rowControl=candidates.find(x=>['up','down'].includes(x.dataset.wbAction)&&x.dataset.wbValue===value&&!x.disabled);
      const focus=['up','down','switch','inspect'].includes(action)?same||rowControl:(fresh.querySelector('[data-wb-focus]')||same||candidates[0]);
      if(focus)focus.focus({preventScroll:true});
      const announcement=fresh.querySelector('.wb-announcement');
      if(announcement)announcement.textContent=after.feedback||(action==='up'||action==='down'?`Neue Position: ${after.order.indexOf(value)+1}`:action==='switch'?fresh.querySelector('.wb-panel')?.textContent||'':'');
      if(after.event){
        const celebrate=!before.done&&after.done&&entry.block.celebrate!==false&&entry.article.category!=='schutz';
        react(M.message(entry.article,entry.block,after.event,D.hubi),celebrate,fresh,entry.article.hubi?.enabled!==false);
      }
      return true;
    }
    function reset(){for(const k of Object.keys(states))delete states[k];}
    return {states,handleClick,reset};
  }
  root.EH.WikiBlockController={create};
})(globalThis);
