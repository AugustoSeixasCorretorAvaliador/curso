import {readFileSync} from 'node:fs';
import {agoraBrasilia,iguais,assinar,decifrar} from '../lib/crypto.js';
import {niveis,grade} from '../lib/grade.js';
import {page,home,login,nivel,aula,esc} from '../lib/views.js';

const base = '/curso/';
const cookie = 'hero_curso';
const tipos = {pdf:'application/pdf',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',csv:'text/csv; charset=utf-8',png:'image/png',zip:'application/zip',sql:'text/plain; charset=utf-8',txt:'text/plain; charset=utf-8'};
let cache;
function conteudo(secret) {
  if (cache?.secret === secret) return cache.data;
  const data = JSON.parse(decifrar(secret,readFileSync(new URL('../lib/conteudo.enc',import.meta.url))));
  cache = {secret,data};
  return data;
}

async function formulario(req) {
  if (typeof req.body === 'string') return new URLSearchParams(req.body);
  if (req.body && !Buffer.isBuffer(req.body)) return new URLSearchParams(req.body);
  const pieces = [];
  let size = 0;
  for await (const block of req) {
    size += block.length;
    if (size > 2048) throw new Error('Formulário muito grande');
    pieces.push(block);
  }
  return new URLSearchParams(Buffer.concat(pieces).toString());
}

export default async function portal(req,res) {
  const url = new URL(req.url,'http://localhost');
  if (!/^\/curso(?:\/|$)|^\/api\/portal$/.test(url.pathname)) {
    res.statusCode=404;
    return res.end('Página indisponível');
  }
  const rota = url.pathname.startsWith(base) ? url.pathname.slice(base.length).replace(/\/$/,'') :
    (url.searchParams.get('rota') ?? '').replace(/\/$/,'');
  const destino = base + rota;
  const secret = process.env.COURSE_SECRET ?? '';
  const {date,password} = agoraBrasilia();
  const signature = secret.length >= 32 ? assinar(secret,date) : '';
  const session = (req.headers.cookie ?? '').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookie+'='))?.slice(cookie.length+1) ?? '';
  const signed = Boolean(signature) && iguais(session,signature);
  const secure = process.env.VERCEL || process.env.COURSE_ORIGIN?.startsWith('https:');
  const cookieFlags = `Path=/curso; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`;
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','same-origin');
  res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
  const html = (status,title,body) => {
    res.statusCode=status;
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.end(req.method === 'HEAD' ? undefined : page(title,body,signed));
  };
  const redirect = location => {res.statusCode=303;res.setHeader('Location',location);res.end();};
  if (req.method === 'POST' && ['entrar','sair'].includes(rota)) {
    if (req.headers['sec-fetch-site'] === 'cross-site') return html(403,'Acesso recusado','<h1>Acesso recusado</h1>');
    if (rota === 'sair') {
      res.setHeader('Set-Cookie',`${cookie}=; ${cookieFlags}; Max-Age=0`);
      return redirect(base);
    }
    if (!signature) return html(503,'Acesso indisponível','<h1>Acesso indisponível</h1><p>Aguarde a configuração do portal.</p>');
    if (!/^application\/x-www-form-urlencoded(?:;|$)/i.test(req.headers['content-type'] ?? '') || Number(req.headers['content-length']) > 2048) return html(400,'Pedido inválido','<h1>Pedido inválido</h1>');
    let fields;
    try { fields = await formulario(req); } catch { return html(400,'Pedido inválido','<h1>Pedido inválido</h1>'); }
    const next = fields.get('next') ?? base;
    const safe = /^\/curso\/(?:preparacao|(?:basico|intermediario|avancado)(?:\/aula-\d{1,2})?\/?)?$/.test(next) ? next : base;
    if (!iguais(fields.get('senha') ?? '',password)) return html(401,'Entrar',login(safe,true));
    res.setHeader('Set-Cookie',`${cookie}=${signature}; ${cookieFlags}; Max-Age=43200`);
    return redirect(safe);
  }
  if (!['GET','HEAD'].includes(req.method)) return html(405,'Método inválido','<h1>Método inválido</h1>');
  if (!rota) return html(200,'Início',home(niveis));
  if (rota === 'entrar') return html(200,'Entrar',login(base,false));
  const [nivelId,aulaId,extra] = rota.split('/');
  const n = niveis.find(item=>item.id===nivelId);
  const number = Number(/^aula-(\d{1,2})$/.exec(aulaId ?? '')?.[1]);
  const lesson = n && number >= n.inicio && number <= n.fim;
  const download = nivelId === 'materiais' && /^[a-zA-Z0-9._-]+$/.test(aulaId ?? '') && !extra;
  const prep = rota === 'preparacao';
  const trilha = n && !aulaId;
  if (extra || !(prep || download || trilha || lesson)) return html(404,'Página indisponível','<h1>Página indisponível</h1>');
  if (!signed) return html(401,'Entrar',login(download ? base : destino,false));
  try {
    if (trilha) return html(200,n.nome,nivel(n,grade));
    const data = conteudo(secret);
    if (prep) return html(200,'Preparação',`<section class="heading"><p class="eyebrow">Aula 0</p><h1>Prepare seu computador</h1></section><section class="panel"><pre>${esc(data.preparacao)}</pre></section>`);
    if (lesson) return html(200,grade[number-1],aula(n,number,grade[number-1],data.aulas[number-1]));
    const file = Object.hasOwn(data.arquivos,aulaId) ? data.arquivos[aulaId] : null;
    if (!file) return html(404,'Material indisponível','<h1>Material indisponível</h1>');
    res.setHeader('Content-Type',tipos[aulaId.split('.').at(-1)] ?? 'application/octet-stream');
    res.setHeader('Content-Disposition',`attachment; filename="${aulaId}"`);
    res.end(req.method === 'HEAD' ? undefined : Buffer.from(file,'base64'));
  } catch (error) {
    console.error('Falha ao abrir conteúdo do curso',error.code ?? error.message);
    html(503,'Conteúdo indisponível','<h1>Conteúdo indisponível</h1><p>Tente novamente ou avise o instrutor.</p>');
  }
}
