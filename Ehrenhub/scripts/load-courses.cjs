/* Build-time editorial loader. One course per file; no request from the browser. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
function loadCourses(directory,config){
  const courses=[],files={},seen=new Set();
  function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'de'))){
    if(entry.name.startsWith('.')||['KURS-VORLAGE.json','wegweiser.json'].includes(entry.name))continue;
    const filename=path.join(dir,entry.name),rel='data/fortbildungen/'+path.relative(directory,filename).split(path.sep).join('/');
    if(entry.isSymbolicLink())throw Error(rel+': Verknüpfungen sind nicht erlaubt.');
    if(entry.isDirectory()){walk(filename);continue;}if(!entry.name.endsWith('.json'))continue;
    let c;try{c=JSON.parse(fs.readFileSync(filename,'utf8'));}catch{throw Error(rel+': JSON unlesbar. Kommas und Anführungszeichen prüfen.');}
    if(!c||typeof c!=='object'||Array.isArray(c))throw Error(rel+': Genau ein Kursobjekt erwartet.');
    if(!['draft','published','archived'].includes(c.status))throw Error(rel+': status muss draft, published oder archived sein.');
    if(!/^[a-z][a-z0-9-]*$/.test(c.id)||entry.name!==c.id+'.json')throw Error(rel+': Dateiname und id müssen übereinstimmen.');
    if(seen.has(c.id))throw Error(rel+': doppelte Kurs-ID '+c.id);seen.add(c.id);
    if(c.status!=='published')continue;
    const provider=Object.hasOwn(config.providers||{},c.providerId)?config.providers[c.providerId]:null;if(!provider)throw Error(rel+': unbekannte providerId.');
    const visuals={leitung:['sage','graduation'],praevention:['rose','shield'],erstehilfe:['sand','heart'],organisation:['lavender','users']};
    const [color,icon]=visuals[c.topic]||['sage','graduation'];
    courses.push({...c,provider:provider.name,color,icon,source:'kurs-'+c.id});files[c.id]=rel;
  }}
  walk(directory);courses.sort((a,b)=>String(a.date).localeCompare(String(b.date))||a.id.localeCompare(b.id));
  return {courses,files,sources:Object.fromEntries(courses.map(c=>[c.source,{label:c.provider+' · '+c.title,url:c.url}]))};
}
module.exports={loadCourses};
