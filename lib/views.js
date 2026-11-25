const base = '/curso/';
export const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function page(title, content, signed = false) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)} · HERO.IA Curso</title>
<link rel="stylesheet" href="${base}assets/portal.css"><script src="${base}assets/portal.js" defer></script></head>
<body><a class="skip" href="#conteudo">Ir para o conteúdo</a><header class="top"><a class="brand" href="${base}">HERO<span>.IA</span> Curso</a>
<nav aria-label="Menu do curso"><a href="${base}preparacao">Preparação</a>${signed ? `<form action="${base}sair" method="post"><button class="plain">Sair</button></form>` : ''}</nav></header>
<main id="conteudo">${content}</main><footer>HERO.IA Curso · Augusto Seixas</footer></body></html>`;
}

export function home(niveis) {
  return `<section class="hero"><p class="eyebrow">Oficinas ao vivo</p><h1>Do ChatGPT<br>ao <em>Codex.</em></h1>
<p class="intro">Aprenda no próprio computador e construa um catálogo do primeiro briefing à publicação.</p>
<div class="facts"><span>13 aulas</span><span>19h30 de formação</span><span>1 projeto prático</span></div></section>
<section aria-labelledby="trilhas"><h2 id="trilhas">Escolha seu nível</h2><div class="cards">${niveis.map(n => `
<article class="card"><p class="eyebrow">Aulas ${n.inicio}–${n.fim}</p><h3>${n.nome}</h3><p>${n.escopo}</p>
<a class="button" href="${base}${n.id}/">Entrar no ${n.nome}</a></article>`).join('')}</div></section>`;
}

export function login(next, invalid) {
  return `<section class="panel login"><p class="eyebrow">Área do aluno</p><h1>Entrar no curso</h1><p>Use a senha do dia informada pelo instrutor.</p>
${invalid ? '<p class="error" role="alert">Senha incorreta. Confira a senha do dia.</p>' : ''}
<form action="${base}entrar" method="post"><input type="hidden" name="next" value="${esc(next)}"><label for="senha">Senha do dia</label>
<input id="senha" name="senha" type="password" inputmode="numeric" pattern="[0-9]{8}" maxlength="8" required autocomplete="off">
<button class="button">Entrar</button></form><a href="${base}">Voltar à página inicial</a></section>`;
}

export function nivel(n, grade) {
  return `<section class="heading"><p class="eyebrow">Área do aluno</p><h1>${n.nome}</h1><p>${n.escopo}</p></section>
<ol class="lessons" start="${n.inicio}">${grade.slice(n.inicio-1,n.fim).map((title,index) =>
    `<li><a href="${base}${n.id}/aula-${n.inicio+index}"><span>Aula ${n.inicio+index}</span>${esc(title)}</a></li>`).join('')}</ol>`;
}

export function aula(n, number, title, data) {
  const list = items => `<ul>${items.map(item => '<li>'+esc(item)+'</li>').join('')}</ul>`;
  return `<a class="back" href="${base}${n.id}/">← ${n.nome}</a><section class="heading"><p class="eyebrow">Aula ${number} · 90 min</p>
<h1>${esc(title)}</h1><p>${esc(data.objetivo)}</p></section>
<section class="panel"><h2>Roteiro ao vivo</h2><ol>${data.roteiro.map(item => '<li>'+esc(item)+'</li>').join('')}</ol>
<blockquote>${esc(data.abertura)}</blockquote></section>
<section class="panel"><h2>Laboratório</h2>${list(data.pratica)}
${(data.arquivos ?? []).map(file=>`<p><a href="${base}materiais/${esc(file)}" download>${esc(file)}</a></p>`).join('')}
${(data.links ?? []).map(([name,url])=>`<p><a href="${esc(url)}">${esc(name)}</a></p>`).join('')}</section>
<section class="panel"><h2>Prompts para copiar</h2>${data.prompts.map((prompt,index)=>`<div class="prompt"><h3>Prompt ${index+1}</h3>
<pre>${esc(prompt)}</pre><button type="button" class="button copy">Copiar prompt</button><span role="status"></span></div>`).join('')}</section>
<section class="panel"><h2>Plano B</h2><p>${esc(data.planoB)}</p><details><summary>Conferir gabarito</summary>${list(data.gabarito)}</details></section>`;
}
