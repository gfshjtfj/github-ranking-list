/**
 * build-standalone.mjs —— 把 index.html + styles.css + 三个 JS 打成一个自包含 HTML
 *
 * 产物：dist/github-star-ranking.html
 * 用法：node tools/build-standalone.mjs
 * 特点：单个文件、双击即用、断网自动用内置快照，适合放 Releases 当「下载即用」入口。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFile(path.join(root, p), 'utf8');

const [html, css, core, snapshot, app] = await Promise.all([
  read('index.html'),
  read('styles.css'),
  read('core.js'),
  read('snapshot.js'),
  read('app.js'),
]);

function assertNoTerminator(code, source) {
  if (new RegExp('</' + (source === 'css' ? 'style' : 'script'), 'i').test(code)) {
    throw new Error('源码里出现了会提前闭合标签的字符串，改成转义写法：' + source);
  }
}

assertNoTerminator(css, 'css');
assertNoTerminator(core, 'js');
assertNoTerminator(snapshot, 'js');
assertNoTerminator(app, 'js');

let out = html;

// 注意：一律用「函数式替换」。字符串替换会把源码里的 $& / $1 当成替换标记展开
out = out.replace(
  /<link rel="stylesheet" href="styles\.css">\s*/,
  () => '<style>\n' + css + '\n</style>\n'
);

out = out.replace(
  /\s*<script src="core\.js"><\/script>\s*<script src="snapshot\.js"><\/script>\s*<script src="app\.js"><\/script>/,
  () => '\n<script>\n' + core + '\n</script>\n<script>\n' + snapshot + '\n</script>\n<script>\n' + app + '\n</script>'
);

out = out.replace(
  '<!DOCTYPE html>',
  () => '<!--\n  单文件版（由 tools/build-standalone.mjs 自动生成，别直接改这个文件）\n' +
    '  双击即可在浏览器打开：联网时拉 GitHub 实时数据，断网时用内置快照。\n-->\n<!DOCTYPE html>'
);

if (/<script\s+src=/i.test(out)) throw new Error('还有外链 script 没内联');
if (/<link[^>]+href="(?!https?:|data:)/i.test(out)) throw new Error('还有外链样式没内联');

await fs.mkdir(path.join(root, 'dist'), { recursive: true });
const target = path.join(root, 'dist', 'github-star-ranking.html');
await fs.writeFile(target, out, 'utf8');

const kb = (len) => (len / 1024).toFixed(0) + ' KB';
console.log('已生成：dist/github-star-ranking.html（' + kb(Buffer.byteLength(out)) + '）');
console.log('源文件合计：' + kb([html, css, core, snapshot, app].reduce((n, s) => n + Buffer.byteLength(s), 0)));
