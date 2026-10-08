'use strict';
// CONFIGURAÇÃO: altere apenas estes valores. Nunca coloque credenciais aqui.
const PRICE = 49;
const CHECKOUT_URL = 'https://ggcheckout.app/checkout/v5/dZjcEoFFynVmE5elIhAi'; // Exemplo: https://seu-checkout.com/produto
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];
const STORAGE_KEY = 'multa_utm';

const priceLabel = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(PRICE);
document.querySelectorAll('[data-price]').forEach(element => { element.textContent = element.dataset.priceDecimals === '2' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(PRICE) : priceLabel; });
const description = document.querySelector('meta[name="description"]');
if (description) description.content = `Aprenda a conferir sua notificação, entender prazos e protocolar sua defesa administrativa. Guia em PDF e vídeos curtos por ${priceLabel}.`;

// Persiste a atribuição na sessão. Uma nova campanha substitui a anterior.
let utms = {};
try {
  const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
  UTM_KEYS.forEach(key => { if (saved && typeof saved[key] === 'string') utms[key] = saved[key]; });
} catch (_) { /* O checkout funciona mesmo com armazenamento bloqueado. */ }
const params = new URLSearchParams(window.location.search);
if (UTM_KEYS.some(key => params.has(key))) {
  utms = {};
  UTM_KEYS.forEach(key => { const value = params.get(key); if (value) utms[key] = value; });
}
try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utms)); } catch (_) { /* Modo privado/restrições. */ }

// Link direto como fallback: falhas de tracking nunca bloqueiam a navegação.
let checkoutUrl = CHECKOUT_URL;
try {
  const candidate = new URL(CHECKOUT_URL);
  Object.entries(utms).forEach(([key, value]) => candidate.searchParams.set(key, value));
  checkoutUrl = candidate.href;
} catch (_) { /* Preserva o destino direto se a montagem das UTMs falhar. */ }

document.querySelectorAll('.checkout-link').forEach(link => {
  link.href = checkoutUrl;
  link.addEventListener('click', () => {
    try {
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'InitiateCheckout', { value: PRICE, currency: 'BRL', content_name: 'Multa Que Não Precisava Existir' });
      }
    } catch (_) { /* O navegador segue o href mesmo se o Pixel falhar. */ }
  });
});
// O CTA do hero mantém a rolagem para a oferta, conforme a copy solicitada.
// Somente os CTAs de compra usam CHECKOUT_URL e disparam InitiateCheckout.
// O checkout deve aplicar o prazo real do desconto; este contador é apenas visual.
// Persiste a primeira visita neste navegador e não reinicia ao recarregar.
const OFFER_DURATION_MS = 10 * 60 * 1000;
const OFFER_DEADLINE_KEY = 'multa_offer_deadline_v1';
const offerTimer = document.querySelector('.offer-timer');
if (offerTimer) {
  let deadline = Date.now() + OFFER_DURATION_MS;
  try {
    const saved = Number(localStorage.getItem(OFFER_DEADLINE_KEY));
    if (Number.isFinite(saved) && saved > 0) deadline = saved;
    else localStorage.setItem(OFFER_DEADLINE_KEY, String(deadline));
  } catch (_) {
    // Se o armazenamento persistente estiver bloqueado, mantém na sessão.
    try {
      const saved = Number(sessionStorage.getItem(OFFER_DEADLINE_KEY));
      if (Number.isFinite(saved) && saved > 0) deadline = saved;
      else sessionStorage.setItem(OFFER_DEADLINE_KEY, String(deadline));
    } catch (_) { /* Sem armazenamento, o prazo fica apenas nesta página. */ }
  }
  let timerInterval;
  function renderOfferTimer() {
    const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    offerTimer.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    if (seconds === 0) clearInterval(timerInterval);
  }
  timerInterval = setInterval(renderOfferTimer, 1000);
  renderOfferTimer();
  document.addEventListener('visibilitychange', renderOfferTimer);
  window.addEventListener('storage', event => {
    if (event.key === OFFER_DEADLINE_KEY && Number(event.newValue) > 0) {
      deadline = Number(event.newValue);
      renderOfferTimer();
    }
  });
}
// Sem JavaScript, todos os tópicos continuam disponíveis.
const topicsToggle = document.querySelector('.topics-toggle');
const extraTopics = document.getElementById('extra-learning-topics');
if (topicsToggle && extraTopics) {
  extraTopics.hidden = true;
  topicsToggle.hidden = false;
  topicsToggle.addEventListener('click', () => {
    const expanded = topicsToggle.getAttribute('aria-expanded') === 'true';
    extraTopics.hidden = expanded;
    topicsToggle.setAttribute('aria-expanded', String(!expanded));
    topicsToggle.textContent = expanded ? 'Ver mais' : 'Ver menos';
  });
}
// Botão adicional de play; controles nativos e eventos do vídeo preservados.
const vslVideo = document.querySelector('.vsl-slot video');
const vslPlay = document.querySelector('.vsl-play');
if (vslVideo && vslPlay) {
  const syncVslPlay = () => {
    vslPlay.hidden = !vslVideo.paused && !vslVideo.ended;
    vslPlay.setAttribute('aria-label', vslVideo.ended ? 'Reproduzir vídeo novamente' : 'Reproduzir vídeo');
  };
  ['play', 'pause', 'ended', 'loadedmetadata', 'error'].forEach(event => vslVideo.addEventListener(event, syncVslPlay));
  vslPlay.addEventListener('click', async () => {
    try {
      if (vslVideo.ended) vslVideo.currentTime = 0;
      await vslVideo.play();
      vslVideo.focus({ preventScroll: true });
    } catch (_) { syncVslPlay(); }
  });
  syncVslPlay();
}
