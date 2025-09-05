import { createServer } from "node:http";

const server = createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end("Hello World");
});

server.listen(process.env.PORT, process.env.HOSTNAME, () => {
  console.log(
    `Server running at http://${process.env.HOSTNAME}:${process.env.PORT}/`
  );
});
