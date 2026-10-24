/**
 * cdp-shot.mjs —— 用 Chrome DevTools Protocol 做真实的设备尺寸截图 + 页面内检查
 *
 * 用法：
 *   node tools/cdp-shot.mjs --url=<页面> --out=<png> --width=390 --height=844 --dsf=2 --mobile=1
 * 需要先启动无头浏览器：msedge --headless=new --remote-debugging-port=9333 about:blank
 */
import fs from 'node:fs/promises';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const i = a.indexOf('=');
    return i === -1 ? [a.replace(/^--/, ''), '1'] : [a.slice(2, i), a.slice(i + 1)];
  })
);

const PORT = Number(args.port || 9333);
const width = Number(args.width || 1440);
const height = Number(args.height || 1000);
const dsf = Number(args.dsf || 1);
const mobile = args.mobile === '1';

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function findPageTarget() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const targets = await res.json();
      const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page;
    } catch (e) { /* 浏览器还没起来 */ }
    await sleep(250);
  }
  throw new Error('找不到可调试的页面目标');
}

const target = await findPageTarget();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});

let seq = 0;
const pending = new Map();
const events = [];
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(msg.error.message));
    else resolve(msg.result);
  } else if (msg.method) {
    events.push(msg);
  }
});

function send(method, params = {}) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error('CDP 超时：' + method));
      }
    }, 20000);
  });
}

await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width, height, deviceScaleFactor: dsf, mobile,
});
await send('Page.navigate', { url: args.url });

await sleep(Number(args.wait || 1800));

// 可选：截图前先执行一段脚本（比如切深色模式、点某个按钮）
if (args.js) {
  await send('Runtime.evaluate', { expression: args.js, returnByValue: true, awaitPromise: true });
  await sleep(400);
}

// 页面内检查：视口宽度、横向溢出元素、卡片数量
const probe = await send('Runtime.evaluate', {
  returnByValue: true,
  awaitPromise: true,
  expression: `(() => {
    const w = window.innerWidth;
    const bad = [];
    document.querySelectorAll('body *').forEach((e) => {
      const r = e.getBoundingClientRect();
      if (r.width > 0 && r.right > w + 1) bad.push(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : ''));
    });
    return {
      innerWidth: w,
      scrollWidth: document.documentElement.scrollWidth,
      docHeight: document.documentElement.scrollHeight,
      cards: document.querySelectorAll('.card').length,
      chips: document.querySelectorAll('.chip').length,
      tabs: document.querySelectorAll('.board-tab').length,
      overflow: bad.slice(0, 8),
      overflowCount: bad.length,
      firstCard: (document.querySelector('.card .desc') || {}).textContent,
      sample: Array.from(document.querySelectorAll('.card')).slice(0, 3).map((c) => ({
        repo: (c.querySelector('.repo') || {}).textContent,
        stars: (c.querySelector('.stars') || {}).textContent,
        desc: (c.querySelector('.desc') || {}).textContent,
        tags: Array.from(c.querySelectorAll('.tag')).map((t) => t.textContent),
        href: (c.querySelector('.repo') || {}).href,
      })),
      headerH: Math.round((document.querySelector('.app-header') || {}).getBoundingClientRect?.().height || 0),
      bannerVisible: !!(document.querySelector('#banner') && !document.querySelector('#banner').hidden),
    };
  })()`,
});

const errors = events
  .filter((e) => e.method === 'Runtime.exceptionThrown' || (e.method === 'Log.entryAdded' && e.params.entry.level === 'error'))
  .map((e) => e.method === 'Runtime.exceptionThrown'
    ? 'EXCEPTION: ' + (e.params.exceptionDetails.exception?.description || e.params.exceptionDetails.text)
    : 'LOG_ERROR: ' + e.params.entry.text);

if (args.out) {
  const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await fs.writeFile(args.out, Buffer.from(shot.data, 'base64'));
}

console.log(JSON.stringify({
  out: args.out || null,
  width, height, dsf, mobile,
  probe: probe.result.value,
  errors,
}, null, 2));

ws.close();
process.exit(0);
