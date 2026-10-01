const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const app = require("../src/app");

let server;
let baseUrl;

before(
  () =>
    new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    }),
);

after(
  () =>
    new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
);

test("GET /api/health reports the service status", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "ok",
    service: "exin-api",
  });
});

test("GET /api/portfolio returns the configured media sources", async () => {
  const response = await fetch(`${baseUrl}/api/portfolio`);
  const items = await response.json();

  assert.equal(response.status, 200);
  assert.equal(items.length, 6);
  assert.ok(
    items.every(
      (item) =>
        item.source.type === "file" &&
        item.source.url.startsWith("/movies/") &&
        item.poster.endsWith("-thumb.webp"),
    ),
  );
});

test("GET /movies supports byte ranges for video playback", async () => {
  const response = await fetch(`${baseUrl}/movies/DT-arq-01.mp4`, {
    headers: { Range: "bytes=0-99" },
  });

  assert.equal(response.status, 206);
  assert.equal(response.headers.get("content-range"), "bytes 0-99/10276335");
  assert.equal((await response.arrayBuffer()).byteLength, 100);
});

test("unknown API routes return JSON 404 responses", async () => {
  const response = await fetch(`${baseUrl}/api/missing`);

  assert.equal(response.status, 404);
  assert.equal((await response.json()).error, "Rota de API não encontrada.");
});
