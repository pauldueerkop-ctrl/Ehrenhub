import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const modules=['core.js','content.js','icons.js','views.js','app.js'];
const [template,css,...js]=await Promise.all([
  fs.readFile(path.join(root,'src/template.html'),'utf8'),
  fs.readFile(path.join(root,'src/styles.css'),'utf8'),
  ...modules.map(file=>fs.readFile(path.join(root,'src',file),'utf8'))
]);
// Avoid replacement-string interpretation of any future dollar signs in content.
const html=template.replace('/*__STYLE__*/',()=>css).replace('/*__APP__*/',()=>js.join('\n\n').replace(/<\/script/gi,'<\\/script'));
await fs.mkdir(path.join(root,'dist'),{recursive:true});
await fs.writeFile(path.join(root,'dist/index.html'),html);
await fs.writeFile(path.join(root,'Ehrenhub.html'),html);
console.log(`Built Ehrenhub.html and dist/index.html (${Math.round(Buffer.byteLength(html)/1024)} KB). No external dependencies.`);
