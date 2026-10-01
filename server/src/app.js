const compression = require("compression");
const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const fs = require("node:fs");
const path = require("node:path");
const portfolio = require("./data/portfolio");

const app = express();
const projectRoot = path.resolve(__dirname, "../..");
const browserDist = path.join(
  projectRoot,
  "client",
  "dist",
  "exin-client",
  "browser",
);

app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());
app.use(express.json({ limit: "16kb" }));
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 120,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", service: "exin-api" });
});

app.get("/api/portfolio", (_request, response) => {
  response.set(
    "Cache-Control",
    process.env.NODE_ENV === "production"
      ? "public, max-age=300, stale-while-revalidate=600"
      : "no-store",
  );
  response.json(portfolio);
});

app.use("/api", (_request, response) => {
  response.status(404).json({ error: "Rota de API não encontrada." });
});

app.get("/logo-exin.png", (_request, response, next) => {
  response.sendFile(path.join(projectRoot, "logo-exin.png"), (error) => {
    if (error) next(error);
  });
});

app.use(
  "/movies",
  express.static(path.join(projectRoot, "movies"), {
    acceptRanges: true,
    fallthrough: false,
    maxAge: "1d",
  }),
);

if (fs.existsSync(browserDist)) {
  app.use(express.static(browserDist, { maxAge: "1h", index: false }));
  app.get(/.*/, (_request, response) => {
    response.sendFile(path.join(browserDist, "index.html"));
  });
} else {
  app.get("/", (_request, response) => {
    response.json({ service: "exin-api", health: "/api/health" });
  });
}

app.use((error, _request, response, _next) => {
  const status = error.statusCode || error.status || 500;
  response
    .status(status)
    .json({
      error:
        status >= 500 ? "Erro interno do servidor." : "Recurso não encontrado.",
    });
});

module.exports = app;
