import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {basename, join} from 'node:path';
import {cifrar} from '../lib/crypto.js';
const root = new URL('../',import.meta.url);
const arquivos = {};
for (const entry of readdirSync(new URL('kits-laboratorio/',root),{recursive:true,withFileTypes:true})) {
  if (!entry.isFile() || !/\.(pdf|xlsx|csv|png|zip|sql|txt)$/.test(entry.name)) continue;
  const name = basename(entry.name);
  if (Object.hasOwn(arquivos,name)) throw new Error('Nome duplicado: '+name);
  arquivos[name] = readFileSync(join(entry.parentPath,name)).toString('base64');
}
const aulas=JSON.parse(readFileSync(new URL('lib/aulas.json',root)));
if (aulas.length !== 13) throw new Error('A grade precisa de 13 aulas.');
for (const aula of aulas) {
  for (const f of aula.arquivos ?? []) if (!Object.hasOwn(arquivos,f)) throw new Error('Falta o arquivo '+f);
}
const preparacao=readFileSync(new URL('docs/aula-0-preparacao.md',root),'utf8');
writeFileSync(new URL('lib/conteudo.enc',root),cifrar(process.env.COURSE_SECRET,Buffer.from(JSON.stringify({aulas,preparacao,arquivos}))));
