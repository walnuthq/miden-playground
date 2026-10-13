// Evaluates a JS expression in a Chrome page target over the DevTools protocol.
// agent-browser doesn't list Bread Wallet's popup windows (confirm.html), so
// this is how approval popups are read and clicked.
//
// Usage: node cdp.mjs <port> <url-substring> <js-expression>
const [port, match, expr] = process.argv.slice(2);
const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const target = targets.find((t) => t.type === "page" && t.url.includes(match));
if (!target) {
  console.error(`no page target matching ${match}`);
  process.exit(1);
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve) => ws.addEventListener("open", resolve));
ws.send(
  JSON.stringify({
    id: 1,
    method: "Runtime.evaluate",
    params: { expression: expr, awaitPromise: true, returnByValue: true },
  }),
);
ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id !== 1) return;
  const { result, exceptionDetails } = msg.result;
  if (exceptionDetails) console.error(JSON.stringify(exceptionDetails));
  else
    console.log(
      typeof result.value === "string" ? result.value : JSON.stringify(result.value),
    );
  ws.close();
});
