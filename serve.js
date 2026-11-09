/* ==========================================================
   Servidor local para ver o site no computador.
   Uso:  node serve.js   →  abra http://localhost:5173
   Gera o site (build.js) e refaz sozinho quando algo em
   content/ ou public/ muda. Não precisa instalar nada.
   ========================================================== */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");
const PORT = Number(process.env.PORT) || 5173;

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon",
  ".mp4": "video/mp4", ".webm": "video/webm", ".xml": "application/xml", ".txt": "text/plain",
};

const build = () => {
  try {
    execFileSync(process.execPath, [path.join(ROOT, "build.js")], { stdio: "inherit" });
  } catch {
    console.error("Erro ao gerar o site — veja a mensagem acima.");
  }
};
build();

// Refaz o site quando um arquivo de conteúdo ou estilo muda
let timer;
for (const dir of ["content", "public"]) {
  fs.watch(path.join(ROOT, dir), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(build, 200);
  });
}
fs.watch(path.join(ROOT, "build.js"), () => { clearTimeout(timer); timer = setTimeout(build, 200); });

const send = (res, status, file) => {
  res.writeHead(status, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  let file = path.join(DIST, path.normalize(urlPath));
  if (!file.startsWith(DIST)) { res.writeHead(403); return res.end(); }

  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!urlPath.endsWith("/")) { res.writeHead(301, { Location: `${urlPath}/` }); return res.end(); }
    file = path.join(file, "index.html");
  }
  if (fs.existsSync(file)) return send(res, 200, file);
  return send(res, 404, path.join(DIST, "404.html"));
}).listen(PORT, () => console.log(`Site em http://localhost:${PORT}`));
