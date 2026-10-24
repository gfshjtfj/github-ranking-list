/**
 * eval-page.mjs —— 连到无头浏览器，在页面里跑一段表达式并打印结果
 *   node tools/eval-page.mjs --url=<页面> --port=9333 --expr="document.title"
 */
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const i = a.indexOf('=');
    return i === -1 ? [a.replace(/^--/, ''), '1'] : [a.slice(2, i), a.slice(i + 1)];
  })
);
const PORT = Number(args.port || 9333);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', rej, { once: true }); });

let seq = 0;
const pending = new Map();
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve } = pending.get(m.id);
    pending.delete(m.id);
    resolve(m.result);
  }
});
const send = (method, params = {}) => {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((r) => pending.set(id, { resolve: r }));
};

await send('Page.enable');
await send('Runtime.enable');
if (args.url) {
  await send('Page.navigate', { url: args.url });
  await sleep(Number(args.wait || 12000));
}
const expr = args['expr-file']
  ? (await import('node:fs/promises')).readFile(args['expr-file'], 'utf8')
  : args.expr;
const res = await send('Runtime.evaluate', { expression: await expr, returnByValue: true, awaitPromise: true });
console.log(JSON.stringify(res.result?.value ?? res, null, 2));
ws.close();
process.exit(0);
