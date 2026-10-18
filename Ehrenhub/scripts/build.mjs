import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';
import data from '../src/content.js';
import { assertValidContent } from './validate-content.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
assertValidContent(data);
const modules=JSON.parse(await fs.readFile(path.join(root,'scripts/modules.json'),'utf8'));
if (!Array.isArray(modules) || modules.length !== new Set(modules).size || modules.some(file=>typeof file!=='string'||file.includes('..')||path.isAbsolute(file))) {
  throw new Error('scripts/modules.json muss eindeutige relative Modulpfade enthalten.');
}
const styles=JSON.parse(await fs.readFile(path.join(root,'scripts/styles.json'),'utf8'));
if (!Array.isArray(styles) || styles.some(file=>typeof file!=='string'||file.includes('..')||path.isAbsolute(file))) throw new Error('scripts/styles.json braucht relative CSS-Dateipfade.');
const [template,css,...js]=await Promise.all([
  fs.readFile(path.join(root,'src/template.html'),'utf8'),
  Promise.all(styles.map(file=>fs.readFile(path.join(root,'src',file),'utf8'))).then(parts=>parts.join('\n\n')),
  ...modules.map(file=>fs.readFile(path.join(root,'src',file),'utf8'))
]);
// JSON is embedded at build time. Opening the HTML offline never needs fetch().
// Escape all '<' in JSON, including script terminators and HTML comment starts.
const serialized=JSON.stringify(data).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
const bootstrap=`globalThis.EH = { Data: ${serialized} };`;
const javascript=[bootstrap,...js].join('\n\n').replace(/<\/script/gi,'<\\/script');
new Script(javascript,{filename:'Ehrenhub.bundle.js'});
for (const marker of ['/*__STYLE__*/','/*__APP__*/']) {
  if (template.split(marker).length !== 2) throw new Error(`HTML-Vorlage braucht genau einen Platzhalter ${marker}`);
}
// Function replacements preserve literal dollar signs in future content.
const html=template.replace('/*__STYLE__*/',()=>css).replace('/*__APP__*/',()=>javascript);
await fs.mkdir(path.join(root,'dist'),{recursive:true});
await fs.writeFile(path.join(root,'dist/index.html'),html);
await fs.writeFile(path.join(root,'Ehrenhub.html'),html);
console.log(`Built Ehrenhub.html and dist/index.html (${Math.round(Buffer.byteLength(html)/1024)} KB). No external dependencies.`);
