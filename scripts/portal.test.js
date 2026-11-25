import {test} from 'node:test';
import {equal,match} from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {agoraBrasilia} from '../lib/crypto.js';
import portal from '../api/portal.js';
import {existsSync} from 'node:fs';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');
test('senha diária no fuso de Brasília reproduz o exemplo e muda na meia-noite local', () => {
  equal(agoraBrasilia(new Date('2026-11-26T02:59:59Z')).password, '11526202');
  equal(agoraBrasilia(new Date('2026-11-26T03:00:00Z')).password, '11626202');
});

test('fluxo HTTP do portal', async t => {
  const server=createServer(portal).listen(0,'127.0.0.1');
  await once(server,'listening');
  t.after(()=>server.close());
  const root='http://127.0.0.1:'+server.address().port;
  const get=(path,options)=>fetch(root+path,options);
  equal((await get('/curso/')).status,200);
  equal((await get('/api/portal?rota=basico/aula-2')).status,401);
  equal((await get('/curso/materiais/regimento_condominio.pdf')).status,401);
  equal((await get('/curso/avancado/aula-2')).status,404);
  const enter=password=>get('/curso/entrar',{method:'POST',body:new URLSearchParams({senha:password,next:'/curso/basico/aula-2'}),redirect:'manual'});
  if (!process.env.COURSE_SECRET) {
    equal((await enter(agoraBrasilia().password)).status,503);
    return;
  }
  equal((await enter('00000000')).status,401);
  const result=await enter(agoraBrasilia().password);
  equal(result.status,303);
  equal(result.headers.get('location'),'/curso/basico/aula-2');
  const setCookie=result.headers.get('set-cookie');
  match(setCookie,/HttpOnly/);
  const headers={cookie:setCookie.split(';')[0]};
  for (let num=1;num<=13;num++) {
    const level=num<=5?'basico':num<=7?'intermediario':'avancado';
    const page=await get('/curso/'+level+'/aula-'+num,{headers});
    equal(page.status,200);
    match(await page.text(),new RegExp('Aula '+num+' · 90 min'));
  }
  const file=await get('/curso/materiais/regimento_condominio.pdf',{headers});
  equal(file.status,200);
  equal(file.headers.get('content-type'),'application/pdf');
  match(await file.text(),/^%PDF/);
  equal((await get('/curso/preparacao',{headers})).status,200);
  equal((await get('/curso/sair',{method:'POST',headers,redirect:'manual'})).status,303);
});
