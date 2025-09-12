import { createServer } from "node:http";

const server = createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end("Hello World");
});

const port = process.env.PORT ?? "3000";
const hostname = process.env.HOSTNAME ?? "0.0.0.0";

server.listen(port, hostname, () => {
  console.log(`Server running at http://${port}:${hostname}/`);
});
