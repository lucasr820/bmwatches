# BMJAPANWATCHES

Site da loja de relógios de luxo importados do Japão. Em português e inglês, com uma página para cada relógio.

## Como o projeto está organizado

| Pasta / arquivo | O que é |
|---|---|
| `content/site.json` | Textos gerais, WhatsApp, Instagram, endereço do site, foto do topo |
| `content/relogios/` | Um arquivo por relógio. O nome do arquivo vira o endereço da página |
| `public/` | Estilo (`style.css`), interações (`script.js`), ícones e mídias enviadas (`midia/`) |
| `build.js` | Gera o site pronto na pasta `dist/` (não precisa instalar nada) |
| `.pages.yml` | Configuração do painel de administração (Pages CMS) |
| `amplify.yml` | Configuração de publicação no AWS Amplify |

## Ver o site no computador

```bash
node serve.js
```

Abra http://localhost:5173. O site é refeito sozinho quando algum arquivo muda.

## Publicar no AWS Amplify (uma vez só)

1. No console da AWS, abra **AWS Amplify → Create new app → GitHub**.
2. Autorize o GitHub e escolha o repositório `lucasr820/bmwatches`, branch `main`.
3. O Amplify lê o `amplify.yml` sozinho. Confirme e clique em **Save and deploy**.
4. Em **Rewrites and redirects**, adicione a regra para a página 404:
   - Source: `/<*>` · Target: `/404.html` · Type: `404 (Rewrite)`
5. Em **Custom domains**, conecte o domínio (ex.: `bmjapanwatches.com.br`).
6. Atualize o campo **Endereço do site** no painel com o domínio final.

A partir daí, cada alteração enviada ao GitHub publica o site automaticamente em 1 a 2 minutos.

## Painel de administração (para editar sem código)

1. Acesse https://app.pagescms.org e entre com a conta do GitHub.
2. Escolha o repositório `bmwatches`.
3. Em **Relógios**, adicione, edite ou marque peças como Reservado/Vendido.
4. Em **Textos do site**, altere textos, WhatsApp, Instagram e a foto do topo.

Para outra pessoa editar, convide-a no próprio Pages CMS (Settings → Collaborators) ou adicione-a como colaboradora do repositório no GitHub.

**Dicas:**
- A primeira foto de cada relógio é a capa na vitrine.
- Fotos coloridas viram preto e branco automaticamente no site.

## Google

O site já gera:
- título e descrição próprios em cada página
- `sitemap.xml` e `robots.txt`
- dados de produto (preço, disponibilidade, marca) para o Google
- versões em português e inglês ligadas entre si

Depois de publicar, cadastre o site no [Google Search Console](https://search.google.com/search-console) e envie o endereço `/sitemap.xml`.
