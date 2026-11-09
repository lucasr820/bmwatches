/* ==========================================================
   BMJAPANWATCHES — Interações no navegador
   O HTML (vitrine, páginas dos relógios, idiomas) é gerado pelo
   build.js. Aqui ficam só os comportamentos:
   1. Reserva de imagem quando uma foto não carrega
   2. Menu mobile
   3. Efeitos de rolagem (header, barra de progresso, parallax)
   4. Revelar elementos ao entrar na tela
   5. Galeria da página do relógio (troca de foto + zoom)
   ========================================================== */

(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Fallback de imagens ----------
     Se uma foto não carregar, mostra um mostrador desenhado em CSS. */
  document.querySelectorAll(".card__img, .hero__img, .gallery__main img").forEach((img) => {
    const fail = () => {
      img.classList.add("is-broken");
      const box = img.closest(".card__media, .hero__media, .gallery__main");
      if (box) box.classList.add("has-fallback");
    };
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) fail();
    else img.addEventListener("error", fail, { once: true });
  });

  /* ---------- 2. Menu mobile ---------- */
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("nav");

  const setMenu = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? toggle.dataset.labelClose : toggle.dataset.labelOpen);
    document.body.style.overflow = open ? "hidden" : "";
  };

  toggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* ---------- 3. Efeitos de rolagem ----------
     Um único listener sincronizado com requestAnimationFrame
     (no máximo 1 atualização por quadro, sem travar a rolagem). */
  const header = document.getElementById("header");
  const hero = document.querySelector(".hero");
  const progress = document.getElementById("scrollProgress");
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
    if (hero && !reduceMotion) {
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

  /* ---------- 4. Revelar elementos ao entrar na tela ---------- */
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

  /* ---------- 5. Galeria da página do relógio ---------- */
  const galleryMain = document.querySelector(".gallery__main");
  if (galleryMain) {
    const mainImg = galleryMain.querySelector("img");
    const thumbs = document.querySelectorAll(".gallery__thumb");

    // Clique na miniatura troca a foto principal com um leve fade
    thumbs.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.classList.contains("is-active")) return;
        thumbs.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        mainImg.classList.add("is-swapping");
        setTimeout(() => {
          mainImg.src = btn.dataset.src;
          mainImg.classList.remove("is-swapping");
        }, 220);
      });
    });

    // Zoom que acompanha o mouse (só em telas com mouse)
    if (window.matchMedia("(hover: hover)").matches) {
      galleryMain.addEventListener("mouseenter", () => galleryMain.classList.add("is-zoomed"));
      galleryMain.addEventListener("mouseleave", () => galleryMain.classList.remove("is-zoomed"));
      galleryMain.addEventListener("mousemove", (e) => {
        const r = galleryMain.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        mainImg.style.transformOrigin = `${x}% ${y}%`;
      });
    }
  }
})();
