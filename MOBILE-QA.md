# Revisão mobile-first

Alteração desta revisão: somente styles.css. index.html e script.js comparados por SHA-256 com o snapshot anterior: idênticos. Copy, ordem, imagens, links, UTMs, Pixel/Utmify e player preservados.

## Auditoria prévia do código
- Hero com padding de 48px e seções com 70px no mobile, prolongando desnecessariamente a página.
- Card de oferta em 320px com pouco espaço interno para texto, seta e CTA.
- Tipografia de H2 variando entre 24 e 32px em seções equivalentes.
- Tarja com grupos sem quebra e separador suscetível a ficar isolado.
- VSL HTML5 local, 9:16, controls, playsinline e preload metadata. Sem eventos de liberação ao terminar, aviso de rolagem, formulários, menus ou FAQ nesta versão.
- MP4 de 5,5 MB e logo horizontal PNG de 397 KB. Assets mantidos conforme solicitado; nenhuma dependência adicionada. O vídeo não é pré-carregado integralmente.

## Ajustes
- Containers com 16px laterais, grid com min-width:0 nos filhos e sem overflow-x:hidden.
- Hero compacto, H1 fluido 32–40px, H2 26–32px, corpo 16px.
- Botões principais com largura disponível e pelo menos 52px de altura; expansão com 48px.
- Cards e listas com espaçamentos e ícones consistentes; CTA da oferta ajustado para telas estreitas.
- VSL preservada em 9:16, com área reservada para evitar deslocamento de layout.
- Tarja organizada em duas linhas no celular, safe area superior e inferior e foco preservado.
- Mudanças de layout concentradas abaixo de 768px; desktop conserva seus grids e dimensões.

## Verificação executada
- node --check script.js: passou.
- Teste de lógica isolado: cinco UTMs no checkout, InitiateCheckout com R$99, preço da tarja com centavos, contador inicial/expirado, expansão/recolhimento: passou.
- Referências a arquivos locais: presentes.
- MP4 via HTTP com Range: 206 e Content-Type video/mp4.
- HTML e JS: nenhum byte alterado.
- Site estático: não há etapa de build nem package.json. Artefato de produção é a pasta com HTML, CSS, JS e assets, também empacotada em ZIP.

## Verificações pendentes
A automação do navegador foi bloqueada pela política do ambiente nesta conversa. Não foi contornada. Portanto NÃO foram realizados testes visuais em 320x568, 360x800, 375x667, 390x844, 393x873, 412x915, 430x932, tablet e desktop, nem reprodução real/play/pause/término do vídeo. As regras CSS cobrem essas larguras, mas ausência de overflow, cortes, sobreposições e regressões visuais ainda precisa de confirmação no navegador. Lighthouse/CLS não foram medidos. A revisão não deve ser considerada uma auditoria visual completa.

Checkout real segue vazio; Pixel/Utmify seguem comentados, como antes. O teste de tracking usa um checkout e uma função de Pixel simulados, sem enviar eventos reais.
