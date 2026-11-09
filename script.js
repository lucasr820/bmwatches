/* ==========================================================
   BMJAPANWATCHES — Interações da landing page
   - Renderiza os 6 cards da vitrine a partir de dados
   - Clique no relógio abre o WhatsApp com mensagem pronta
   - Header que muda ao rolar + menu mobile
   - Animação de entrada dos cards (IntersectionObserver)
   ========================================================== */

(() => {
  "use strict";

  /* ---------- 1. Dados dos produtos ----------
     Centralizar os dados facilita trocar por uma API no futuro.
     As fotos são exibidas em P&B via CSS (filter: grayscale). */
  const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

  const products = [
    { brand: "Maison Vauclair", name: "Héritage Automatique", price: 48900, image: img("photo-1524592094714-0f0654e20314"), tag: "Novo" },
    { brand: "Atelier Kessler", name: "Chronographe Noir", price: 72500, image: img("photo-1612817159949-195b6eb9e31a") },
    { brand: "Orsini Genève", name: "Profondeur 300", price: 61200, image: img("photo-1522312346375-d1a52e2b99b3") },
    { brand: "Maison Vauclair", name: "Squelette Tourbillon", price: 189000, image: img("photo-1508685096489-7aacd43bd3b1"), tag: "Edição Limitada" },
    { brand: "Hartmann & Fils", name: "Lune Perpétuelle", price: 134700, image: img("photo-1542496658-e33a6d0d50f6") },
    { brand: "Atelier Kessler", name: "Minimal 38", price: 29900, image: img("photo-1587836374828-4dbafa94cf0e") },
  ];

  /* Formatação de moeda no padrão brasileiro (R$ 48.900) */
  const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  /* ---------- 2. WhatsApp ----------
     Coloque aqui o número da loja: 55 + DDD + número, só algarismos.
     Ex.: "5511999998888". Enquanto estiver vazio, o WhatsApp abre
     pedindo para escolher o contato (a mensagem já vai preenchida). */
  const WHATSAPP_NUMBER = "";

  const whatsappLink = (p) => {
    const msg = `Olá! Tenho interesse no relógio ${p.brand} ${p.name} (${brl.format(p.price)}) que vi no site BMJAPANWATCHES. Ainda está disponível?`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  /* Ícone do WhatsApp em line art, reaproveitado em todos os cards */
  const waIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 20.5 4.8 16.3A8.5 8.5 0 1 1 8 19.4l-4.5 1.1Z" /><path d="M9.2 8.2c-.4 3.6 3 7 6.6 6.6l.7-1.4-1.8-1-1 .8a5 5 0 0 1-2.3-2.3l.8-1-1-1.8-1.4.7" /></svg>`;

  /* ---------- 3. Renderização da vitrine ----------
     Cada card é um link (<a>): clicar em qualquer parte do relógio
     abre a conversa no WhatsApp em uma nova aba. */
  const grid = document.getElementById("productGrid");

  grid.innerHTML = products
    .map(
      (p, i) => `
      <a class="card" href="${whatsappLink(p)}" target="_blank" rel="noopener"
         aria-label="Falar no WhatsApp sobre o ${p.brand} ${p.name}"
         style="transition-delay:${(i % 3) * 120}ms">
        <div class="card__media">
          ${p.tag ? `<span class="card__tag">${p.tag}</span>` : ""}
          <img class="card__img" src="${p.image}" alt="${p.brand} ${p.name}" loading="lazy" width="800" height="1000" />
          <span class="card__buy">${waIcon} Tenho interesse</span>
        </div>
        <div class="card__body">
          <div>
            <p class="card__brand">${p.brand}</p>
            <h3 class="card__name">${p.name}</h3>
          </div>
          <p class="card__price">${brl.format(p.price)}</p>
        </div>
      </a>`
    )
    .join("");

  /* Fallback: se uma imagem externa falhar, mostra um mostrador desenhado em CSS */
  document.querySelectorAll(".card__img, .hero__img").forEach((el) => {
    el.addEventListener("error", () => {
      el.classList.add("is-broken");
      el.parentElement.classList.add("has-fallback");
    }, { once: true });
  });

  /* ---------- 4. Menu mobile ---------- */
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("nav");

  const setMenu = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    document.body.style.overflow = open ? "hidden" : "";
  };

  toggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  // Fecha o menu ao clicar em um link ou pressionar Esc
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* ---------- 5. Efeitos de rolagem ----------
     Um único listener de scroll, sincronizado com requestAnimationFrame
     (no máximo 1 atualização por quadro, sem travar a rolagem). */
  const header = document.getElementById("header");
  const hero = document.querySelector(".hero");
  const progress = document.getElementById("scrollProgress");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let lastY = window.scrollY;
  let ticking = false;

  const updateOnScroll = () => {
    const y = window.scrollY;

    // a) Header: linha fina após 20px; esconde ao descer, volta ao subir
    header.classList.toggle("is-scrolled", y > 20);
    const goingDown = y > lastY;
    header.classList.toggle("is-hidden", goingDown && y > 400 && !nav.classList.contains("is-open"));

    // b) Barra de progresso: fração da página já rolada
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    // c) Parallax do hero: --hp vai de 0 (topo) a 1 (hero fora da tela)
    if (!reduceMotion) {
      const hp = Math.min(Math.max(y / hero.offsetHeight, 0), 1);
      hero.style.setProperty("--hp", hp.toFixed(3));
    }

    lastY = y;
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(updateOnScroll);
      ticking = true;
    }
  }, { passive: true });
  updateOnScroll();

  /* ---------- 6. Revelar elementos ao entrar na tela ----------
     Cards da vitrine e tudo que tiver o atributo data-reveal. */
  const revealEls = document.querySelectorAll(".card, [data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      }),
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* Ano atual no rodapé */
  document.getElementById("year").textContent = new Date().getFullYear();
})();
