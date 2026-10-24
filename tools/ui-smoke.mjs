/**
 * ui-smoke.mjs —— 在真实浏览器里跑交互冒烟测试（离线快照模式，不需要网络）
 *
 * 用法（先启动无头浏览器，带 --remote-debugging-port=9333）：
 *   node tools/ui-smoke.mjs --url=file:///...index.html?snapshot=1 --port=9333
 */
import fs from 'node:fs/promises';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const i = a.indexOf('=');
    return i === -1 ? [a.replace(/^--/, ''), '1'] : [a.slice(2, i), a.slice(i + 1)];
  })
);
const PORT = Number(args.port || 9333);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function findPage() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page;
    } catch (e) { /* retry */ }
    await sleep(250);
  }
  throw new Error('no page target');
}

const target = await findPage();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.addEventListener('open', res, { once: true });
  ws.addEventListener('error', rej, { once: true });
});

let seq = 0;
const pending = new Map();
const errors = [];
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(m.error.message)) : resolve(m.result);
  } else if (m.method === 'Runtime.exceptionThrown') {
    errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
    errors.push(m.params.args.map((a) => a.value ?? a.description).join(' '));
  }
});

function send(method, params = {}) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (res.exceptionDetails) throw new Error('eval error: ' + JSON.stringify(res.exceptionDetails.exception?.description || res.exceptionDetails.text));
  return res.result.value;
}

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')); }
}

await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: args.url });
await sleep(2000);

/* ---------- 1. 首屏 ---------- */
console.log('\n[首屏]');
check('渲染出卡片', await evaluate('document.querySelectorAll(".card").length') > 50);
check('四个榜单标签', await evaluate('document.querySelectorAll(".board-tab").length') === 4);
check('分类 chips 有 12 个', await evaluate('document.querySelectorAll(".chip").length') === 12);
check('横幅提示可见', await evaluate('!document.querySelector("#banner").hidden') === true);
check('星标带近似标记', await evaluate('document.querySelector(".stars").textContent.includes("≈")') === true);

/* ---------- 2. 切榜单 ---------- */
console.log('\n[切换榜单]');
await evaluate('document.querySelector("[data-board=month]").click()');
await sleep(400);
check('月榜：离线状态给出引导文案', (await evaluate('document.querySelector("#empty").textContent')).includes('离线快照只包含'));
check('月榜：列表为空', await evaluate('document.querySelectorAll(".card").length') === 0);
await evaluate('document.querySelector("[data-board=all]").click()');
await sleep(400);
check('切回总榜：卡片恢复', await evaluate('document.querySelectorAll(".card").length') > 50);

/* ---------- 3. 分类筛选 ---------- */
console.log('\n[分类筛选]');
await evaluate('document.querySelector("[data-cat=ai]").click()');
await sleep(300);
const aiCount = await evaluate('document.querySelectorAll(".card").length');
check('AI 分类有卡片', aiCount > 0, aiCount);
check('AI 分类过滤准确', await evaluate('Array.from(document.querySelectorAll(".card .tag.cat")).every(e => e.textContent.includes("AI"))') === true);
await evaluate('document.querySelector("[data-cat=all]").click()');
await sleep(300);
check('恢复全部分类', await evaluate('document.querySelectorAll(".card").length') > 50);

/* ---------- 4. 搜索 ---------- */
console.log('\n[搜索]');
await evaluate(`(() => { const i = document.querySelector('#search'); i.value = 'react'; i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
await sleep(500);
const searchCount = await evaluate('document.querySelectorAll(".card").length');
check('搜索 react 有结果', searchCount > 0 && searchCount < 90, searchCount);
check('搜索结果都含关键词', await evaluate(`Array.from(document.querySelectorAll('.card')).every(c => c.textContent.toLowerCase().includes('react'))`) === true);
await evaluate(`(() => { const i = document.querySelector('#search'); i.value = 'zzzz-not-exist'; i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
await sleep(400);
check('无结果时显示空态', (await evaluate('document.querySelector("#empty").textContent')).includes('没有匹配'));
await evaluate(`(() => { const i = document.querySelector('#search'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
await sleep(400);
check('清空搜索后恢复', await evaluate('document.querySelectorAll(".card").length') > 50);

/* ---------- 5. 排序 ---------- */
console.log('\n[排序]');
const starOrder = await evaluate('Array.from(document.querySelectorAll(".card .stars")).slice(0,5).map(e => e.textContent)');
await evaluate(`(() => { const s = document.querySelector('#sort'); s.value = 'name'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`);
await sleep(300);
const names = await evaluate('Array.from(document.querySelectorAll(".card .repo")).slice(0,3).map(e => e.textContent)');
const sorted = names.slice().sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
check('按名称排序生效', JSON.stringify(names) === JSON.stringify(sorted), names);
await evaluate(`(() => { const s = document.querySelector('#sort'); s.value = 'stars'; s.dispatchEvent(new Event('change', { bubbles: true })); })()`);
await sleep(300);
check('星标排序恢复首屏顺序', JSON.stringify(await evaluate('Array.from(document.querySelectorAll(".card .stars")).slice(0,5).map(e => e.textContent)')) === JSON.stringify(starOrder));

/* ---------- 6. 主题与设置 ---------- */
console.log('\n[主题 / 设置]');
const themeBefore = await evaluate('document.documentElement.dataset.theme');
await evaluate('document.querySelector("#theme").click()');
await sleep(200);
const themeAfter = await evaluate('document.documentElement.dataset.theme');
check('主题按钮切换深浅色', themeBefore !== themeAfter, [themeBefore, themeAfter]);
await evaluate('document.querySelector("#theme").click()');
await sleep(200);
await evaluate('document.querySelector("#settings-btn").click()');
await sleep(300);
check('设置弹窗可打开', await evaluate('document.querySelector("#settings-dialog").open') === true);
check('设置弹窗有 token 输入框', await evaluate('!!document.querySelector("#token-input")') === true);
await evaluate('document.querySelector("#dialog-close").click()');
await sleep(200);
check('设置弹窗可关闭', await evaluate('document.querySelector("#settings-dialog").open') === false);

/* ---------- 7. 卡片内容完整性 ---------- */
console.log('\n[卡片字段]');
const card = await evaluate(`(() => {
  const c = document.querySelector('.card');
  return {
    repo: c.querySelector('.repo').textContent,
    href: c.querySelector('.repo').getAttribute('href'),
    stars: c.querySelector('.stars').textContent,
    desc: c.querySelector('.desc').textContent,
    cat: c.querySelector('.tag.cat').textContent,
  };
})()`);
check('卡片有仓库名', /^[\w.\-]+\/[\w.\-]+$/.test(card.repo), card.repo);
check('卡片链接指向 GitHub 仓库', /^https:\/\/github\.com\/[^\/]+\/[^\/]+$/.test(card.href), card.href);
check('卡片有星标数', /★/.test(card.stars), card.stars);
check('卡片有中文简介', /[\u4e00-\u9fa5]/.test(card.desc) && card.desc.length > 6, card.desc);
check('卡片有分类标签', card.cat.length > 0, card.cat);

/* ---------- 8. 无脚本错误 ---------- */
console.log('\n[运行期错误]');
check('没有未捕获异常 / console.error', errors.length === 0, errors.slice(0, 3));

console.log('\n' + '─'.repeat(46));
console.log(fail === 0 ? '✅ 界面冒烟测试全部通过：' + pass + ' 项' : '❌ ' + fail + ' / ' + (pass + fail) + ' 项失败');
ws.close();
process.exit(fail === 0 ? 0 : 1);
