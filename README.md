# HERO.IA Curso

Oficinas ao vivo de ChatGPT e Codex. 13 aulas em três níveis e um projeto prático com dados fictícios.

**Entrada pública:** https://hero.ia.br/curso/

**Área do aluno:** https://hero-ia-curso.vercel.app/curso/

O HTML é renderizado no Node.js. O JavaScript do navegador copia os prompts. A função da Vercel serve as aulas e os downloads após validar a senha e emitir um cookie assinado. Há uma senha de turma por dia, compartilhada entre os níveis, baseada na data de Brasília. Essa regra previsível serve exclusivamente para o laboratório.

## Desenvolvimento

Use Node.js 24. Configure COURSE_SECRET em .env.local com a mesma chave usada para empacotar lib/conteudo.enc. Execute npm test e npm run dev. Abra http://127.0.0.1:3000/curso/. A chave deve ter pelo menos 32 caracteres e permanecer nos ambientes autorizados.

O repositório público guarda código, grade pública e um pacote cifrado. Para atualizar as aulas, edite a cópia de autoria e execute npm run pack antes de enviar o novo pacote.

## Deploy

Importe este repositório na Vercel e configure COURSE_SECRET em Preview e Production. A função serve /curso/ e suas subrotas no mesmo projeto. Valide primeiro no Preview. Para manter o caminho no domínio existente, configure o proxy de /curso e /curso/* no provedor que recebe hero.ia.br, encaminhando o mesmo caminho para a Vercel. Preserve cookies e desative cache das respostas protegidas. DNS sozinho não roteia por caminho. Como o domínio principal usa GitHub Pages, o index.html da raiz é a entrada pública com links para a área do aluno na Vercel. Para manter o domínio principal também durante a navegação nas aulas, use o proxy descrito acima.
