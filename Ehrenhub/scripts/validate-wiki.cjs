/* Fail before publication with the exact editorial file and field. */
const types=['scenario','detective','comparison','perspectives','decision','challenge'];
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function validateWiki(article,p,{fail,internalLink}){
  const text=(v,q)=>{if(typeof v!=='string'||!v.trim())fail(q,'nichtleeren Text angeben');};
  const id=(v,q)=>{if(typeof v!=='string'||!/^[a-z][a-z0-9-]*$/.test(v))fail(q,'ID mit Kleinbuchstaben, Ziffern und Bindestrichen angeben');};
  const bool=(v,q)=>{if(typeof v!=='boolean')fail(q,'true oder false angeben');};
  const fields=(v,allowed,q)=>{for(const k of Object.keys(v))if(!allowed.includes(k))fail(q+'.'+k,'unbekanntes Feld. Schreibweise mit der Vorlage vergleichen.');};
  function list(v,q,min=1){if(!Array.isArray(v)){fail(q,'Liste [ ... ] erwartet');return [];}if(v.length<min)fail(q,`mindestens ${min} Einträge angeben`);return v.filter((x,i)=>{if(!object(x)){fail(q+'['+i+']','Objekt { ... } erwartet');return false;}return true;});}
  function ids(items,q){const used=new Set();for(const x of items){id(x.id,q+'.id');if(used.has(x.id))fail(q,`doppelte ID "${x.id}"`);used.add(x.id);}}
  function hubi(v,q,articleLevel=false){
    if(v===undefined)return;if(!object(v)){fail(q,'Objekt erwartet');return;}
    fields(v,articleLevel?['enabled','intro','pet','checklistComplete','start','success','retry','complete','change']:['start','success','retry','complete','change'],q);
    for(const [k,val] of Object.entries(v)){
      if(k==='enabled')bool(val,q+'.enabled');
      else if(k==='pet'){if(!Array.isArray(val)||!val.length)fail(q+'.pet','Liste mit mindestens einem Satz erwartet');else val.forEach(t=>text(t,q+'.pet'));}
      else text(val,q+'.'+k);
    }
  }
  fields(article,['id','title','summary','category','icon','color','minutes','tags','featured','intro','sections','related','source','status','hubi','author','reviewed'],p);
  id(article.id,p+'.id');
  if(article.featured!==undefined)bool(article.featured,p+'.featured');
  if(article.status!==undefined&&!['draft','example','published'].includes(article.status))fail(p+'.status','draft, example oder published angeben');
  for(const k of ['author','reviewed'])if(article[k]!==undefined)text(article[k],p+'.'+k);
  hubi(article.hubi,p+'.hubi',true);
  const sections=list(article.sections,p+'.sections');const sectionIds=new Set();
  sections.forEach((s,si)=>{
    const q=p+'.sections['+si+']';
    fields(s,['id','title','text','bullets','timeline','checklist','tip','action','blocks'],q);
    if(s.id!==undefined)id(s.id,q+'.id');
    const sid=s.id||String(si);if(sectionIds.has(sid))fail(q+'.id','Abschnitts-ID bereits vergeben');sectionIds.add(sid);
    if(s.checklist!==undefined){
      if(!Array.isArray(s.checklist))fail(q+'.checklist','Liste erwartet');
      else{const seen=new Set();s.checklist.forEach((x,ci)=>{
        if(typeof x==='string')text(x,q+'.checklist['+ci+']');
        else if(object(x)){fields(x,['id','text'],q+'.checklist['+ci+']');id(x.id,q+'.checklist.id');text(x.text,q+'.checklist.text');}
        else fail(q+'.checklist['+ci+']','Text oder Objekt mit id und text erwartet');
        const ck=object(x)?x.id:String(ci);if(seen.has(ck))fail(q+'.checklist','Punkt-ID bereits vergeben');seen.add(ck);
      });}
    }
    if(s.blocks===undefined)return;
    const blocks=list(s.blocks,q+'.blocks');ids(blocks,q+'.blocks');
    blocks.forEach((b,bi)=>{
      const r=q+'.blocks['+bi+']';id(b.id,r+'.id');text(b.title,r+'.title');if(b.prompt!==undefined)text(b.prompt,r+'.prompt');hubi(b.hubi,r+'.hubi');if(b.celebrate!==undefined)bool(b.celebrate,r+'.celebrate');
      if(!types.includes(b.type)){fail(r+'.type','unbekannter Baustein');return;}
      const extras={scenario:['options'],detective:['items','success'],comparison:['variants'],perspectives:['perspectives'],decision:['start','nodes'],challenge:['items','solution','success','retry']};
      fields(b,['id','type','title','prompt','hubi','celebrate',...extras[b.type]],r);
      if(b.type==='scenario'){
        const options=list(b.options,r+'.options',2);ids(options,r+'.options');
        for(const o of options){fields(o,['id','label','feedback','result'],r+'.options');text(o.label,r+'.options.label');text(o.feedback,r+'.options.feedback');if(!['success','reflect'].includes(o.result))fail(r+'.options.result','success oder reflect angeben');}
        if(!options.some(o=>o.result==='success'))fail(r+'.options','mindestens eine Antwort mit result: success angeben');
      }
      if(b.type==='detective'){
        const items=list(b.items,r+'.items',2);ids(items,r+'.items');
        for(const x of items){fields(x,['id','label','issue','feedback'],r+'.items');text(x.label,r+'.items.label');text(x.feedback,r+'.items.feedback');bool(x.issue,r+'.items.issue');}
        if(!items.some(x=>x.issue===true))fail(r+'.items','mindestens eine Stolperstelle mit issue: true angeben');text(b.success,r+'.success');
      }
      if(b.type==='comparison'||b.type==='perspectives'){
        const name=b.type==='comparison'?'variants':'perspectives';const items=list(b[name],r+'.'+name,2);
        if(b.type==='comparison'&&items.length!==2)fail(r+'.variants','genau zwei Varianten angeben');
        for(const x of items){fields(x,['label','text','note'],r+'.'+name);text(x.label,r+'.'+name+'.label');text(x.text,r+'.'+name+'.text');if(x.note!==undefined)text(x.note,r+'.'+name+'.note');}
      }
      if(b.type==='challenge'){
        const items=list(b.items,r+'.items',2);ids(items,r+'.items');
        for(const x of items){fields(x,['id','label'],r+'.items');text(x.label,r+'.items.label');}
        if(!Array.isArray(b.solution)||b.solution.length!==items.length||new Set(b.solution).size!==items.length||b.solution.some(x=>!items.some(i=>i.id===x)))fail(r+'.solution','jede Item-ID genau einmal in der Zielreihenfolge angeben');
        text(b.success,r+'.success');text(b.retry,r+'.retry');
      }
      if(b.type==='decision'){
        const nodes=list(b.nodes,r+'.nodes',2);ids(nodes,r+'.nodes');id(b.start,r+'.start');
        const byId=new Map(nodes.map(n=>[n.id,n]));
        if(!byId.has(b.start))fail(r+'.start','Start-ID fehlt in nodes');
        for(const n of nodes){
          fields(n,['id','question','options','title','result','action'],r+'.nodes.'+n.id);
          if(n.result!==undefined){text(n.title,r+'.nodes.title');text(n.result,r+'.nodes.result');if(n.options!==undefined||n.question!==undefined)fail(r+'.nodes.'+n.id,'Ergebnis enthält keine Frage oder Optionen');}
          else{ text(n.question,r+'.nodes.question');const options=list(n.options,r+'.nodes.options',2);ids(options,r+'.nodes.options');
            for(const o of options){fields(o,['id','label','next'],r+'.nodes.options');text(o.label,r+'.nodes.options.label');if(!byId.has(o.next))fail(r+'.nodes.options.next',`Ziel "${o.next}" fehlt`);}
          }
          if(n.action!==undefined){if(!object(n.action))fail(r+'.nodes.action','Objekt erwartet');else{text(n.action.label,r+'.nodes.action.label');internalLink(n.action.href,r+'.nodes.action.href');}}
        }
        const visited=new Set(),active=new Set();
        function visit(nodeId){
          if(active.has(nodeId)){fail(r+'.nodes','Kreis im Entscheidungsweg. Jeder Weg muss zu einem Ergebnis führen.');return;}
          if(visited.has(nodeId)||!byId.has(nodeId))return;
          visited.add(nodeId);active.add(nodeId);const n=byId.get(nodeId);
          if(Array.isArray(n.options))for(const o of n.options)if(object(o))visit(o.next);
          active.delete(nodeId);
        }
        visit(b.start);
        if(visited.size!==nodes.length)fail(r+'.nodes','Einige Fragen oder Ergebnisse sind vom Start aus nicht erreichbar.');
      }
    });
  });
}
module.exports={validateWiki};
