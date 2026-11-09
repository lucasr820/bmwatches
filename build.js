/* ==========================================================
   BMJAPANWATCHES — Gerador do site
   ----------------------------------------------------------
   Lê os conteúdos editáveis (content/) e gera o site pronto
   na pasta dist/, que é o que o AWS Amplify publica.

   content/site.json        → textos gerais, WhatsApp, Instagram, foto do topo
   content/relogios/*.json  → um arquivo por relógio (o nome do
                               arquivo vira o endereço da página)
   public/                  → CSS, JS, ícones e mídias enviadas

   Gera, para cada idioma (PT e EN):
   - página inicial com a vitrine
   - uma página por relógio
   e também 404.html, sitemap.xml e robots.txt (para o Google).

   Uso:  node build.js      (não precisa instalar nada)
   ========================================================== */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const OUT = path.join(ROOT, "dist");
const BRAND = "BMJAPANWATCHES";
const LANGS = ["pt", "en"];
const TODAY = new Date().toISOString().slice(0, 10);
const YEAR = new Date().getFullYear();

/* ---------- Endereços (URLs) de cada página por idioma ---------- */
const paths = {
  home: { pt: "/", en: "/en/" },
  product: (slug) => ({ pt: `/relogios/${slug}/`, en: `/en/watches/${slug}/` }),
};

/* ---------- Textos fixos da interface, por idioma ----------
   Os textos de marketing ficam em content/site.json (editáveis no painel).
   Aqui ficam rótulos de botões, menus e especificações. */
const T = {
  pt: {
    htmlLang: "pt-BR", ogLocale: "pt_BR", locale: "pt-BR", short: "PT", name: "Português",
    homeTitle: "BMJAPANWATCHES — Relógios de luxo importados do Japão",
    homeLabel: "página inicial", navLabel: "Navegação principal", langLabel: "Idioma",
    menuOpen: "Abrir menu", menuClose: "Fechar menu",
    nav: { colecao: "Coleção", vitrine: "Vitrine", importacao: "Importação", contato: "Contato" },
    heroCta: "Explorar Coleção", heroCta2: "Como Importamos",
    heroAlt: "Relógio de luxo fotografado em preto e branco", scrollHint: "Rolar para a vitrine",
    showcaseEyebrow: "A Vitrine", showcaseTitle: "Peças selecionadas",
    showcaseText: "Peças escolhidas uma a uma no Japão, prontas para chegar até você.",
    empty: "Novas peças chegando em breve.",
    status: { disponivel: "Disponível", reservado: "Reservado", vendido: "Vendido" },
    tags: { novo: "Novo", "edicao-limitada": "Edição Limitada", raro: "Raro", "ultima-unidade": "Última unidade" },
    cta: { disponivel: "Tenho interesse", reservado: "Entrar na fila", vendido: "Quero um similar" },
    note: {
      disponivel: "Atendimento direto pelo WhatsApp: tire dúvidas, peça mais fotos e combine a entrega.",
      reservado: "Esta peça está reservada para outro cliente. Entre na fila e avisamos se ela voltar a ficar disponível.",
      vendido: "Esta peça já foi vendida. Podemos procurar uma semelhante no Japão para você.",
    },
    msg: {
      disponivel: (n, pr, u) => `Olá! Tenho interesse no relógio ${n} (${pr}) que vi no site BMJAPANWATCHES. Ainda está disponível?\n${u}`,
      reservado: (n, pr, u) => `Olá! Vi que o relógio ${n} está reservado. Posso entrar na fila caso a reserva não se confirme?\n${u}`,
      vendido: (n, pr, u) => `Olá! Vi que o relógio ${n} já foi vendido. Vocês conseguem encontrar um parecido para mim?\n${u}`,
      geral: "Olá! Vim pelo site BMJAPANWATCHES e gostaria de mais informações.",
    },
    breadcrumbHome: "Início", back: "Voltar à vitrine", photo: "Foto",
    specsTitle: "Especificações",
    specs: { referencia: "Referência", ano: "Ano", diametro: "Diâmetro", material: "Caixa", movimento: "Movimento", pulseira: "Pulseira", estado: "Estado", acompanha: "Acompanha" },
    values: {
      material: { aco: "Aço inoxidável", ouro: "Ouro", "ouro-rose": "Ouro rosé", titanio: "Titânio", ceramica: "Cerâmica", platina: "Platina" },
      movimento: { automatico: "Automático", manual: "Corda manual", quartzo: "Quartzo", "spring-drive": "Spring Drive", solar: "Solar" },
      pulseira: { aco: "Aço", couro: "Couro", borracha: "Borracha", tecido: "Tecido / NATO", titanio: "Titânio" },
      estado: { novo: "Novo, sem uso", excelente: "Excelente", "muito-bom": "Muito bom", bom: "Bom" },
      acompanha: { caixa: "Caixa original", papeis: "Papéis / certificado", manual: "Manual", "pulseira-extra": "Pulseira extra" },
    },
    relatedEyebrow: "Continue explorando", related: "Você também pode gostar",
    metaFallback: "Relógio de luxo importado do Japão.",
    floatLabel: "Fale conosco", socialLabel: "Redes sociais", footerNav: "Navegação",
    rights: "Todos os direitos reservados.", footerTag: "Importados do Japão para o Brasil",
    notFoundTitle: "Página não encontrada",
    notFoundText: "O endereço que você procurou não existe ou a peça saiu da vitrine.",
    notFoundCta: "Ir para a vitrine",
  },
  en: {
    htmlLang: "en", ogLocale: "en_US", locale: "en-US", short: "EN", name: "English",
    homeTitle: "BMJAPANWATCHES — Luxury watches imported from Japan",
    homeLabel: "home page", navLabel: "Main navigation", langLabel: "Language",
    menuOpen: "Open menu", menuClose: "Close menu",
    nav: { colecao: "Collection", vitrine: "Showcase", importacao: "Import", contato: "Contact" },
    heroCta: "Explore the Collection", heroCta2: "How We Import",
    heroAlt: "Luxury watch photographed in black and white", scrollHint: "Scroll to the showcase",
    showcaseEyebrow: "The Showcase", showcaseTitle: "Selected pieces",
    showcaseText: "Each piece hand-picked in Japan, ready to reach you.",
    empty: "New pieces arriving soon.",
    status: { disponivel: "Available", reservado: "Reserved", vendido: "Sold" },
    tags: { novo: "New", "edicao-limitada": "Limited Edition", raro: "Rare", "ultima-unidade": "Last piece" },
    cta: { disponivel: "I'm interested", reservado: "Join the waitlist", vendido: "Find me a similar one" },
    note: {
      disponivel: "Direct service via WhatsApp: ask questions, request more photos and arrange delivery.",
      reservado: "This piece is reserved for another client. Join the waitlist and we'll let you know if it becomes available again.",
      vendido: "This piece has been sold. We can source a similar one in Japan for you.",
    },
    msg: {
      disponivel: (n, pr, u) => `Hello! I'm interested in the ${n} watch (${pr}) I saw on the BMJAPANWATCHES website. Is it still available?\n${u}`,
      reservado: (n, pr, u) => `Hello! I saw the ${n} watch is reserved. Can I join the waitlist in case the reservation falls through?\n${u}`,
      vendido: (n, pr, u) => `Hello! I saw the ${n} watch has been sold. Could you find a similar one for me?\n${u}`,
      geral: "Hello! I found you through the BMJAPANWATCHES website and would like more information.",
    },
    breadcrumbHome: "Home", back: "Back to the showcase", photo: "Photo",
    specsTitle: "Specifications",
    specs: { referencia: "Reference", ano: "Year", diametro: "Diameter", material: "Case", movimento: "Movement", pulseira: "Strap", estado: "Condition", acompanha: "Included" },
    values: {
      material: { aco: "Stainless steel", ouro: "Gold", "ouro-rose": "Rose gold", titanio: "Titanium", ceramica: "Ceramic", platina: "Platinum" },
      movimento: { automatico: "Automatic", manual: "Manual winding", quartzo: "Quartz", "spring-drive": "Spring Drive", solar: "Solar" },
      pulseira: { aco: "Steel", couro: "Leather", borracha: "Rubber", tecido: "Fabric / NATO", titanio: "Titanium" },
      estado: { novo: "New, unworn", excelente: "Excellent", "muito-bom": "Very good", bom: "Good" },
      acompanha: { caixa: "Original box", papeis: "Papers / certificate", manual: "Manual", "pulseira-extra": "Extra strap" },
    },
    relatedEyebrow: "Keep exploring", related: "You may also like",
    metaFallback: "Luxury watch imported from Japan.",
    floatLabel: "Talk to us", socialLabel: "Social media", footerNav: "Navigation",
    rights: "All rights reserved.", footerTag: "Imported from Japan to Brazil",
    notFoundTitle: "Page not found",
    notFoundText: "The page you were looking for doesn't exist or the piece has left the showcase.",
    notFoundCta: "Go to the showcase",
  },
};

/* ---------- Ícones em line art ---------- */
const ICON = {
  wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 20.5 4.8 16.3A8.5 8.5 0 1 1 8 19.4l-4.5 1.1Z" /><path d="M9.2 8.2c-.4 3.6 3 7 6.6 6.6l.7-1.4-1.8-1-1 .8a5 5 0 0 1-2.3-2.3l.8-1-1-1.8-1.4.7" /></svg>',
  insta: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".6" /></svg>',
};

/* ---------- Funções auxiliares ---------- */
// Escapa texto para HTML (evita que um texto do painel quebre a página)
const esc = (s) => String(s ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
// Título do hero: quebra de linha vira <br>, *texto* vira itálico
const rich = (s) => esc(s).replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/\r?\n/g, "<br />");
// Descrição: linhas em branco separam parágrafos
const paragraphs = (s) => String(s || "").split(/\r?\n\s*\r?\n/).map((t) => t.trim()).filter(Boolean)
  .map((t) => `<p>${esc(t).replace(/\r?\n/g, "<br />")}</p>`).join("");
// Pega o campo no idioma pedido (ex.: titulo_en), com o português como reserva
const pick = (obj, key, lang) => (obj && (obj[`${key}_${lang}`] || obj[`${key}_pt`])) || "";
const jsonld = (data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
const order = (v) => (v === "" || v == null || !Number.isFinite(Number(v)) ? 999 : Number(v));

/* ---------- Leitura do conteúdo ---------- */
const readJSON = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    throw new Error(`Erro ao ler ${path.relative(ROOT, file)}: ${err.message}`);
  }
};

const site = readJSON(path.join(ROOT, "content", "site.json"));
const SITE_URL = String(site.url || "").replace(/\/+$/, "");
const abs = (u) => (!u ? "" : /^https?:\/\//.test(u) ? u : SITE_URL + (u.startsWith("/") ? u : `/${u}`));
const phone = String(site.whatsapp || "").replace(/\D/g, "");
const wa = (msg) => `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
const insta = site.instagram
  ? (/^https?:\/\//.test(site.instagram) ? site.instagram : `https://instagram.com/${site.instagram.replace(/^@/, "")}`)
  : "";

// Ordem da vitrine: disponíveis → reservados → vendidos, depois pelo campo "ordem"
const STATUS_RANK = { disponivel: 0, reservado: 1, vendido: 2 };
const productsDir = path.join(ROOT, "content", "relogios");
const products = fs.readdirSync(productsDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => {
    const p = readJSON(path.join(productsDir, f));
    return {
      ...p,
      slug: f.replace(/\.json$/, ""),
      status: p.status in STATUS_RANK ? p.status : "disponivel",
      fotos: (Array.isArray(p.fotos) ? p.fotos : [p.fotos]).filter(Boolean),
    };
  })
  .sort((a, b) =>
    STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
    order(a.ordem) - order(b.ordem) ||
    String(a.modelo).localeCompare(String(b.modelo)));

const money = (v, lang) =>
  new Intl.NumberFormat(T[lang].locale, { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(Number(v) || 0);
const fullName = (p) => `${p.marca} ${p.modelo}`;

// Botão de WhatsApp de cada relógio: texto e mensagem mudam conforme o status
function ctaFor(p, lang) {
  const t = T[lang];
  const url = SITE_URL + paths.product(p.slug)[lang];
  return { label: t.cta[p.status], href: wa(t.msg[p.status](fullName(p), money(p.preco, lang), url)) };
}

/* ==========================================================
   COMPONENTES
   ========================================================== */

function langSwitch(lang, alt) {
  const items = LANGS.map((l) => (l === lang
    ? `<span class="lang__item is-active" aria-current="true">${T[l].short}</span>`
    : `<a class="lang__item" href="${alt[l]}" hreflang="${T[l].htmlLang}" lang="${T[l].htmlLang}" title="${T[l].name}">${T[l].short}</a>`));
  return `<div class="lang" role="group" aria-label="${T[lang].langLabel}">${items.join('<span class="lang__sep" aria-hidden="true">/</span>')}</div>`;
}

function header(lang, alt) {
  const t = T[lang];
  const h = paths.home[lang];
  return `
  <!-- HEADER: logotipo, navegação, idioma e menu mobile -->
  <header class="header" id="header">
    <div class="container header__inner">
      <a href="${h}" class="logo" aria-label="${BRAND} — ${t.homeLabel}">BMJAPAN<span class="logo__sub">WATCHES</span></a>
      <nav class="nav" id="nav" aria-label="${t.navLabel}">
        <ul class="nav__list">
          <li><a href="${h}#colecao" class="nav__link">${t.nav.colecao}</a></li>
          <li><a href="${h}#vitrine" class="nav__link">${t.nav.vitrine}</a></li>
          <li><a href="${h}#sobre" class="nav__link">${t.nav.importacao}</a></li>
          <li><a href="#contato" class="nav__link">${t.nav.contato}</a></li>
        </ul>
      </nav>
      <div class="header__actions">
        ${langSwitch(lang, alt)}
        <button class="menu-toggle" id="menuToggle" aria-label="${t.menuOpen}" data-label-open="${t.menuOpen}" data-label-close="${t.menuClose}" aria-expanded="false" aria-controls="nav">
          <span></span><span></span>
        </button>
      </div>
    </div>
  </header>`;
}

function footer(lang) {
  const t = T[lang];
  const h = paths.home[lang];
  const instaLink = insta ? `href="${esc(insta)}" target="_blank" rel="noopener"` : 'href="#"';
  const waLink = `href="${esc(wa(t.msg.geral))}" target="_blank" rel="noopener"`;
  return `
  <!-- FOOTER -->
  <footer class="footer" id="contato">
    <div class="container">
      <div class="footer__grid" data-reveal>
        <div class="footer__brand">
          <a href="${h}" class="logo">BMJAPAN<span class="logo__sub">WATCHES</span></a>
          <p>${esc(pick(site, "descricao", lang))}</p>
          <ul class="social" aria-label="${t.socialLabel}">
            <li><a ${instaLink} aria-label="Instagram">${ICON.insta}</a></li>
            <li><a ${waLink} aria-label="WhatsApp">${ICON.wa}</a></li>
          </ul>
        </div>
        <nav class="footer__col" aria-label="${t.footerNav}">
          <h3>${t.footerNav}</h3>
          <ul>
            <li><a href="${h}#vitrine">${t.nav.vitrine}</a></li>
            <li><a href="${h}#sobre">${t.nav.importacao}</a></li>
          </ul>
        </nav>
        <div class="footer__col">
          <h3>${t.nav.contato}</h3>
          <ul>
            <li><a ${waLink}>WhatsApp</a></li>
            <li><a ${instaLink}>Instagram</a></li>
          </ul>
        </div>
      </div>
      <div class="footer__bottom">
        <span>© ${YEAR} ${BRAND}. ${t.rights}</span>
        <span>${t.footerTag}</span>
      </div>
    </div>
  </footer>`;
}

// Botão flutuante do WhatsApp (canto inferior direito, em todas as páginas)
function floatButton(lang, msg) {
  const label = T[lang].floatLabel;
  return `
  <a class="wa-float" href="${esc(wa(msg))}" target="_blank" rel="noopener" aria-label="${label} — WhatsApp">
    ${ICON.wa}<span class="wa-float__label">${label}</span>
  </a>`;
}

// Card da vitrine: foto e textos levam à página do relógio;
// o botão revelado no hover abre o WhatsApp direto.
function card(p, lang, i) {
  const t = T[lang];
  const url = paths.product(p.slug)[lang];
  const cta = ctaFor(p, lang);
  const tag = p.status === "disponivel" && t.tags[p.etiqueta] ? `<span class="card__tag">${t.tags[p.etiqueta]}</span>` : "";
  const status = p.status !== "disponivel" ? `<span class="badge badge--${p.status} card__status">${t.status[p.status]}</span>` : "";
  return `
          <article class="card is-${p.status}" style="transition-delay:${(i % 3) * 120}ms">
            <div class="card__media">
              <a class="card__cover" href="${url}" tabindex="-1" aria-hidden="true">
                <img class="card__img" src="${esc(p.fotos[0] || "")}" alt="${esc(fullName(p))}" loading="lazy" width="800" height="1000" />
              </a>
              ${tag}${status}
              <a class="card__buy" href="${esc(cta.href)}" target="_blank" rel="noopener" aria-label="${esc(`${cta.label} — ${fullName(p)}`)}">${ICON.wa}<span>${cta.label}</span></a>
            </div>
            <a class="card__body" href="${url}">
              <div>
                <p class="card__brand">${esc(p.marca)}</p>
                <h3 class="card__name">${esc(p.modelo)}</h3>
              </div>
              <p class="card__price${p.status === "vendido" ? " is-sold" : ""}">${money(p.preco, lang)}</p>
            </a>
          </article>`;
}

function hero(lang) {
  const t = T[lang];
  const h = site.hero || {};
  const figure = `<figure class="hero__media">
          <img src="${esc(h.imagem || "")}" alt="${t.heroAlt}" class="hero__img" width="1200" height="1200" fetchpriority="high" />
        </figure>`;
  return `
    <!-- HERO: foto do relógio em destaque -->
    <section class="hero" id="colecao">
      <div class="container hero__inner">
        <div class="hero__content">
          <p class="eyebrow">${esc(pick(h, "etiqueta", lang))}</p>
          <h1 class="hero__title">${rich(pick(h, "titulo", lang))}</h1>
          <p class="hero__text">${esc(pick(h, "texto", lang))}</p>
          <div class="hero__cta">
            <a href="#vitrine" class="btn btn--light">${t.heroCta}</a>
            <a href="#sobre" class="btn btn--ghost">${t.heroCta2}</a>
          </div>
        </div>
        ${figure}
      </div>
      <a href="#vitrine" class="scroll-hint" aria-label="${t.scrollHint}"><span class="scroll-hint__line"></span></a>
    </section>`;
}

function about(lang) {
  const items = Array.isArray(site.diferenciais) ? site.diferenciais : [];
  if (!items.length) return "";
  return `
    <!-- Diferenciais da loja (link "Importação") -->
    <section class="about" id="sobre">
      <div class="container about__inner">
        ${items.map((d, i) => `<div class="about__stat" data-reveal style="--d:${i * 120}ms"><strong>${esc(pick(d, "valor", lang))}</strong><span>${esc(pick(d, "rotulo", lang))}</span></div>`).join("\n        ")}
      </div>
    </section>`;
}

function specRows(p, lang) {
  const t = T[lang];
  const V = t.values;
  const list = (Array.isArray(p.acompanha) ? p.acompanha : [p.acompanha]).filter(Boolean);
  const rows = [
    ["referencia", p.referencia],
    ["ano", p.ano],
    ["diametro", p.diametro ? `${p.diametro} mm` : ""],
    ["material", V.material[p.material] || p.material],
    ["movimento", V.movimento[p.movimento] || p.movimento],
    ["pulseira", V.pulseira[p.pulseira] || p.pulseira],
    ["estado", V.estado[p.estado] || p.estado],
    ["acompanha", list.map((a) => V.acompanha[a] || a).join(", ")],
  ];
  return rows
    .filter(([, v]) => v != null && String(v).trim() !== "")
    .map(([k, v]) => `<div><dt>${t.specs[k]}</dt><dd>${esc(v)}</dd></div>`)
    .join("\n            ");
}

/* ==========================================================
   MOLDE DA PÁGINA (head com SEO + header + footer)
   ========================================================== */
function layout({ lang, title, description, alt, image, type = "website", schema = [], body, floatMsg, noindex = false }) {
  const t = T[lang];
  const canonical = SITE_URL + alt[lang];
  const img = abs(image);
  return `<!DOCTYPE html>
<html lang="${t.htmlLang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  ${noindex ? '<meta name="robots" content="noindex" />' : `<link rel="canonical" href="${esc(canonical)}" />`}

  <!-- Versões em outros idiomas (Google mostra a certa para cada visitante) -->
  ${LANGS.map((l) => `<link rel="alternate" hreflang="${T[l].htmlLang}" href="${esc(SITE_URL + alt[l])}" />`).join("\n  ")}
  <link rel="alternate" hreflang="x-default" href="${esc(SITE_URL + alt.pt)}" />

  <!-- Prévia do link no WhatsApp, Instagram, Facebook etc. -->
  <meta property="og:site_name" content="${BRAND}" />
  <meta property="og:type" content="${type}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${esc(canonical)}" />
  ${img ? `<meta property="og:image" content="${esc(img)}" />` : ""}
  <meta property="og:locale" content="${t.ogLocale}" />
  <meta name="twitter:card" content="summary_large_image" />

  <!-- Ícones -->
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <meta name="theme-color" content="#000000" />

  <!-- Tipografia: Cormorant Garamond (títulos) + Inter (textos) -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300&family=Inter:wght@200;300;400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/style.css" />

  <!-- Dados estruturados para o Google -->
  ${schema.map(jsonld).join("\n  ")}
</head>
<body>
  <!-- Barra de progresso de leitura -->
  <div class="scroll-progress" id="scrollProgress" aria-hidden="true"></div>
${header(lang, alt)}
${body}
${footer(lang)}
${floatButton(lang, floatMsg || t.msg.geral)}

  <script src="/script.js"></script>
</body>
</html>
`;
}

/* ==========================================================
   PÁGINAS
   ========================================================== */
function homePage(lang) {
  const t = T[lang];
  const alt = paths.home;
  const description = pick(site, "descricao", lang);
  const store = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: BRAND,
    url: SITE_URL + alt[lang],
    logo: `${SITE_URL}/apple-touch-icon.png`,
    image: abs(site.hero && site.hero.imagem),
    description,
    ...(insta && { sameAs: [insta] }),
    ...(phone && { telephone: `+${phone}` }),
  };
  const body = `
  <main>${hero(lang)}

    <!-- VITRINE -->
    <section class="showcase" id="vitrine">
      <div class="container">
        <header class="section-head" data-reveal>
          <p class="eyebrow">${t.showcaseEyebrow}</p>
          <h2 class="section-title">${t.showcaseTitle}</h2>
          <p class="section-text">${t.showcaseText}</p>
        </header>
        <div class="grid">${products.map((p, i) => card(p, lang, i)).join("") || `<p class="section-text">${t.empty}</p>`}
        </div>
      </div>
    </section>
${about(lang)}
  </main>`;
  return layout({ lang, title: t.homeTitle, description, alt, image: site.hero && site.hero.imagem, schema: [store], body });
}

function productPage(p, lang) {
  const t = T[lang];
  const alt = paths.product(p.slug);
  const h = paths.home[lang];
  const name = fullName(p);
  const url = SITE_URL + alt[lang];
  const desc = pick(p, "descricao", lang);
  const cta = ctaFor(p, lang);
  const specs = specRows(p, lang);

  // Relacionados: primeiro os disponíveis, completando com os demais
  const related = products.filter((o) => o.slug !== p.slug).slice(0, 3);

  const thumbs = p.fotos.length > 1
    ? `<div class="gallery__thumbs">
            ${p.fotos.map((f, i) => `<button type="button" class="gallery__thumb${i === 0 ? " is-active" : ""}" data-src="${esc(f)}" aria-label="${t.photo} ${i + 1}"><img src="${esc(f)}" alt="" loading="lazy" /></button>`).join("\n            ")}
          </div>`
    : "";

  const availability = { disponivel: "InStock", reservado: "LimitedAvailability", vendido: "SoldOut" }[p.status];
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    brand: { "@type": "Brand", name: p.marca },
    image: p.fotos.map(abs),
    description: desc,
    sku: p.referencia || p.slug,
    url,
    offers: {
      "@type": "Offer",
      price: Number(p.preco) || 0,
      priceCurrency: "BRL",
      availability: `https://schema.org/${availability}`,
      itemCondition: `https://schema.org/${p.estado === "novo" ? "NewCondition" : "UsedCondition"}`,
      url,
      seller: { "@type": "Organization", name: BRAND },
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.breadcrumbHome, item: SITE_URL + h },
      { "@type": "ListItem", position: 2, name, item: url },
    ],
  };

  const body = `
  <main class="product">
    <div class="container">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="${h}">${t.breadcrumbHome}</a><span aria-hidden="true">/</span>
        <a href="${h}#vitrine">${t.nav.vitrine}</a><span aria-hidden="true">/</span>
        <span aria-current="page">${esc(p.modelo)}</span>
      </nav>

      <div class="product__grid">
        <!-- Galeria: foto principal com zoom + miniaturas -->
        <div class="gallery" data-reveal>
          <div class="gallery__main is-${p.status}">
            <img src="${esc(p.fotos[0] || "")}" alt="${esc(name)}" width="1200" height="1500" fetchpriority="high" />
            ${p.status !== "disponivel" ? `<span class="badge badge--${p.status} gallery__badge">${t.status[p.status]}</span>` : ""}
          </div>
          ${thumbs}
        </div>

        <!-- Informações -->
        <div class="product__info" data-reveal style="--d:150ms">
          <p class="eyebrow">${esc(p.marca)}</p>
          <h1 class="product__title">${esc(p.modelo)}</h1>
          <div class="product__meta">
            <p class="product__price${p.status === "vendido" ? " is-sold" : ""}">${money(p.preco, lang)}</p>
            <span class="status-pill status-pill--${p.status}">${t.status[p.status]}</span>
          </div>
          <div class="product__desc">${paragraphs(desc)}</div>
          <div class="product__actions">
            <a class="btn btn--light btn--wa" href="${esc(cta.href)}" target="_blank" rel="noopener">${ICON.wa}<span>${cta.label}</span></a>
            <a class="btn btn--ghost" href="${h}#vitrine">${t.back}</a>
          </div>
          <p class="product__note">${t.note[p.status]}</p>
          ${specs ? `<h2 class="specs__title">${t.specsTitle}</h2>
          <dl class="specs">
            ${specs}
          </dl>` : ""}
        </div>
      </div>
${related.length ? `
      <!-- Relacionados -->
      <section class="related">
        <header class="section-head" data-reveal>
          <p class="eyebrow">${t.relatedEyebrow}</p>
          <h2 class="section-title">${t.related}</h2>
        </header>
        <div class="grid">${related.map((o, i) => card(o, lang, i)).join("")}
        </div>
      </section>` : ""}
    </div>
  </main>`;

  const metaDesc = desc
    ? desc.replace(/\s+/g, " ").trim().slice(0, 155)
    : `${name} — ${money(p.preco, lang)}. ${t.metaFallback}`;

  return layout({
    lang,
    title: `${name} | ${BRAND}`,
    description: metaDesc,
    alt,
    image: p.fotos[0],
    type: "product",
    schema: [productSchema, breadcrumbSchema],
    body,
    floatMsg: t.msg[p.status](name, money(p.preco, lang), url),
  });
}

function notFoundPage() {
  const t = T.pt;
  const body = `
  <main class="notfound">
    <div class="container">
      <p class="eyebrow">404</p>
      <h1 class="section-title">${t.notFoundTitle}</h1>
      <p class="section-text">${t.notFoundText}<br /><span lang="en">${T.en.notFoundText}</span></p>
      <a class="btn btn--light" href="/#vitrine">${t.notFoundCta}</a>
    </div>
  </main>`;
  return layout({ lang: "pt", title: `${t.notFoundTitle} | ${BRAND}`, description: t.notFoundText, alt: paths.home, body, noindex: true });
}

function sitemap() {
  const pages = [paths.home, ...products.map((p) => paths.product(p.slug))];
  const urls = pages.flatMap((alt) => LANGS.map((l) => `  <url>
    <loc>${SITE_URL}${alt[l]}</loc>
    <lastmod>${TODAY}</lastmod>
${LANGS.map((x) => `    <xhtml:link rel="alternate" hreflang="${T[x].htmlLang}" href="${SITE_URL}${alt[x]}" />`).join("\n")}
  </url>`));
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`;
}

/* ==========================================================
   GERAÇÃO
   ========================================================== */
const write = (rel, content) => {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, "public"), OUT, { recursive: true });

for (const lang of LANGS) {
  write(path.join(paths.home[lang], "index.html"), homePage(lang));
  for (const p of products) write(path.join(paths.product(p.slug)[lang], "index.html"), productPage(p, lang));
}
write("404.html", notFoundPage());
write("sitemap.xml", sitemap());
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

console.log(`Site gerado em dist/ — ${products.length} relógios × ${LANGS.length} idiomas.`);
