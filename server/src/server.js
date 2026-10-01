const app = require("./app");

const port = Number(process.env.PORT) || 3000;
const server = app.listen(port, () => {
  console.log(`EXIN API disponível em http://localhost:${port}`);
});

function shutDown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);
