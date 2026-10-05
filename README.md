# Multa Que Não Precisava Existir

## Tecnologia e raiz
Site estático: HTML, CSS e JavaScript puro, sem framework, dependências ou package.json. A raiz é esta pasta, que contém index.html, styles.css, script.js, vercel.json e assets/. Não use a pasta Downloads, outputs ou o diretório inteiro da conversa como raiz do repositório.

## GitHub
Envie o conteúdo desta pasta, incluindo .gitignore, os quatro arquivos HTML, styles.css, script.js, vercel.json e assets/. O MP4 da VSL deve ser enviado em assets/vsl.mp4 (cerca de 5,5 MB); não precisa de Git LFS. Preserve as duas imagens PNG existentes.

Não envie .env e segredos, node_modules/, .vercel/, caches, logs, ZIPs, work/, tmp/, relatórios de teste nem pastas de configuração do editor. O .gitignore cobre esses arquivos. Não envie toda a pasta Downloads nem o conteúdo de outras conversas. Arquivos já rastreados não são removidos pelo .gitignore.

## Configuração da Vercel quando for publicar
- Framework Preset: Other.
- Root Directory: a raiz do repositório (.), se enviar o conteúdo desta pasta diretamente.
- Build Command: vazio, com Override habilitado para omitir o build.
- Output Directory: .
- Install Command: vazio; não há dependências.
- Não executar npm run build: não existe package.json nem compilação neste projeto.

O vercel.json existente define headers e foi preservado. Não é preciso servidor Node em produção, rewrite de SPA, API, npm install ou criação de framework. A Vercel serve o HTML e os assets diretamente.
Referência: https://vercel.com/docs/builds/configure-a-build

## Verificação local de produção
A saída de produção é o próprio código estático desta pasta. A verificação usada foi `node --check script.js`, acompanhada de validação JSON, referências locais e destinos de âncoras. Esses testes passaram; não houve execução de build Vercel nem deploy. A ausência de build é intencional, não um erro.

Nesta preparação, arquivos de execução, textos, links, estilos, imagens, vídeo e rastreamentos não foram alterados. Apenas .gitignore e documentação foram criados/atualizados. Os testes não substituem revisão visual, reprodução real em todos os navegadores ou compra de teste no checkout.

## Pendências existentes, preservadas
- CHECKOUT_URL em script.js está vazio: o site pode ser hospedado, mas o botão de compra não conclui vendas até configurar a URL real.
- Meta Pixel está comentado com PIXEL_ID placeholder; Utmify tem apenas espaço comentado. Não estão ativos. UTMs continuam implementadas.
- termos.html, privacidade.html e contato.html são placeholders e continuam assim.
- A VSL usa assets/vsl.mp4, vídeo HTML5 com controles, playsinline e botão central de play. Não usa YouTube.
- O contador de dez minutos persiste no navegador e para em 00:00. O preço/prazo real precisa ser aplicado pelo checkout, pois esta página não o valida no servidor.
- A URL definitiva de Open Graph não foi configurada. Pode ser preenchida quando houver domínio.

Essas pendências não impedem subir os arquivos ao GitHub ou hospedar o site; checkout e entrega do produto precisam estar configurados para operação comercial. Nenhum repositório foi criado e nenhum deploy foi realizado nesta revisão.
