/**
 * 自测脚本（Node 运行，不需要浏览器）
 *   node tests/selftest.js
 */
'use strict';

global.window = global;
require('../core.js');
require('../snapshot.js');

var core = global.GSRCore;
var snap = global.GSR_SNAPSHOT;

var fails = 0;
var checks = 0;

function ok(cond, label, extra) {
  checks++;
  if (!cond) {
    fails++;
    console.log('  ✗ ' + label + (extra ? '  → ' + JSON.stringify(extra) : ''));
  }
}

function section(name) { console.log('\n' + name); }

/* ---------------------------- 1. 分类器 ---------------------------- */
section('分类器（用接近 GitHub API 的原始数据测试）');

var cases = [
  ['facebook/react', 'A declarative, efficient, and flexible JavaScript library for building user interfaces.', 'JavaScript', ['react', 'ui'], 'frontend'],
  ['ollama/ollama', 'Get up and running with Llama 3, Mistral and other large language models.', 'Go', ['llm', 'llama', 'inference'], 'ai'],
  ['kubernetes/kubernetes', 'Production-Grade Container Scheduling and Management', 'Go', ['kubernetes', 'containers'], 'devops'],
  ['BurntSushi/ripgrep', 'ripgrep recursively searches directories for a regex pattern', 'Rust', ['cli', 'search', 'grep'], 'tools'],
  ['tensorflow/tensorflow', 'An Open Source Machine Learning Framework for Everyone', 'C++', ['machine-learning', 'deep-learning'], 'ai'],
  ['redis/redis', 'Redis is an in-memory database that persists on disk.', 'C', ['database', 'cache'], 'data'],
  ['flutter/flutter', 'Flutter makes it easy to build beautiful apps for mobile and beyond', 'Dart', ['flutter', 'mobile', 'dart'], 'mobile'],
  ['torvalds/linux', 'Linux kernel source tree', 'C', ['kernel', 'linux'], 'system'],
  ['dani-garcia/vaultwarden', 'Unofficial Bitwarden compatible server written in Rust', 'Rust', ['password-manager', 'bitwarden'], 'security'],
  ['nodejs/node', 'Node.js JavaScript runtime', 'JavaScript', ['runtime', 'nodejs'], 'backend'],
  ['sindresorhus/awesome', 'Awesome lists about all kinds of interesting topics', '', ['awesome', 'lists'], 'learn'],
  ['someorg/small-thing', 'A tiny helper for loading config files.', 'Python', ['config'], 'other'],
];

cases.forEach(function (c) {
  var repo = core.toRepo({
    full_name: c[0], description: c[1], language: c[2], topics: c[3],
    stargazers_count: 1000, forks_count: 10,
  });
  ok(repo.category === c[4], '分类 ' + c[0] + ' 应为 ' + c[4] + '，实际 ' + repo.category);
});

/* ---------------------------- 2. 查询构造 ---------------------------- */
section('查询构造');

var p = core.buildSearchPath('all', 1);
ok(/\/search\/repositories\?q=stars(%3A|:)>=?1000/.test(p.replace(/%3E/g, '>')) || p.indexOf('stars') > 0, '总榜查询含 stars 条件', p);
ok(p.indexOf('sort=stars') > 0 && p.indexOf('order=desc') > 0 && p.indexOf('per_page=100') > 0, '总榜查询参数完整', p);
ok(p.indexOf('created') === -1, '总榜不带时间条件', p);

var w = core.buildSearchPath('week', 2, '2026-10-24T00:00:00Z');
ok(w.indexOf('created%3A%3E%3D') > 0 || w.indexOf('created:>=') > 0, '周榜带 created 条件', w);
ok(w.indexOf('page=2') > 0, '翻页参数正确', w);
var weekFrom = new Date(Date.parse('2026-10-24T00:00:00Z') - 7 * 86400000).toISOString().slice(0, 10);
ok(decodeURIComponent(w).indexOf('created:>=' + weekFrom) > 0, '周榜起始日期 = 今天-7 天 (' + weekFrom + ')', decodeURIComponent(w));

var m = decodeURIComponent(core.buildSearchPath('month', 1, '2026-10-24T00:00:00Z'));
ok(m.indexOf('created:>=2026-09-24') > 0, '月榜起始日期 = 今天-30 天', m);

// 每个榜单的查询都要能被 URL 编码安全地发出
core.BOARDS.forEach(function (b) {
  var q = core.buildQuery(b.id, 1, '2026-10-24T00:00:00Z');
  ok(typeof q.q === 'string' && q.q.length > 5, b.id + ' 查询非空', q);
  ok(q.per_page === 100 && q.page === 1, b.id + ' 分页参数默认值正确', q);
});

/* ---------------------------- 3. 筛选 / 排序 ---------------------------- */
section('筛选与排序');

var list = [
  core.toRepo({ full_name: 'b/one', stargazers_count: 100, description: 'react something', topics: ['react'] }),
  core.toRepo({ full_name: 'a/two', stargazers_count: 300, description: 'python thing', topics: ['llm'] }),
  core.toRepo({ full_name: 'c/three', stargazers_count: 200, description: 'database', topics: ['sql'] }),
];

var byStars = core.filterRepos(list, { sort: 'stars' });
ok(byStars.map(function (r) { return r.stars; }).join(',') === '300,200,100', '按星标降序', byStars.map(function (r) { return r.stars; }));

var byName = core.filterRepos(list, { sort: 'name' });
ok(byName[0].fullName === 'b/one', '按名称升序', byName.map(function (r) { return r.name; }));

var q = core.filterRepos(list, { query: 'REACT', sort: 'stars' });
ok(q.length === 1 && q[0].fullName === 'b/one', '搜索大小写不敏感', q.map(function (r) { return r.fullName; }));

var cat = core.filterRepos(list, { category: 'data', sort: 'stars' });
ok(cat.length === 1 && cat[0].fullName === 'c/three', '按分类筛选', cat.map(function (r) { return r.fullName; }));

ok(core.filterRepos(list, { category: 'all' }).length === 3, '分类 all 不过滤');

/* ---------------------------- 4. 格式化 ---------------------------- */
section('格式化');

ok(core.formatStars(408000) === '40.8 万', 'formatStars 40.8 万', core.formatStars(408000));
ok(core.formatStars(12000) === '1.2 万', 'formatStars 1.2 万', core.formatStars(12000));
ok(core.formatStars(999) === '999', 'formatStars 999', core.formatStars(999));
ok(core.formatStars(1500) === '1.5k', 'formatStars 1.5k', core.formatStars(1500));
ok(core.formatFull(1234567) === '1,234,567', 'formatFull 千分位', core.formatFull(1234567));

var now = '2026-10-24T12:00:00Z';
ok(core.formatRelative('2026-10-24T11:40:00Z', now) === '20 分钟前', 'formatRelative 分钟', core.formatRelative('2026-10-24T11:40:00Z', now));
ok(core.formatRelative('2026-10-21T12:00:00Z', now) === '3 天前', 'formatRelative 天', core.formatRelative('2026-10-21T12:00:00Z', now));
ok(core.formatRelative('', now) === '', 'formatRelative 空值');

/* ---------------------------- 5. 中文简介 ---------------------------- */
section('中文简介');

ok(core.lookupZh('deepseek-ai/deepseek-r1').indexOf('推理') > 0, '字典大小写不敏感命中');
ok(core.lookupZh('not/exist') === '', '字典未命中返回空串');

/* ---------------------------- 6. 仓库链接 ---------------------------- */
section('仓库链接（API 的 url 字段是接口地址，不能当网页链接）');

var liveLike = core.toRepo({
  full_name: 'facebook/react',
  url: 'https://api.github.com/repos/facebook/react',
  html_url: 'https://github.com/facebook/react',
  stargazers_count: 235000,
});
ok(liveLike.url === 'https://github.com/facebook/react', '有 html_url 时用网页地址', liveLike.url);

var noHtml = core.toRepo({
  full_name: 'a/b',
  url: 'https://api.github.com/repos/a/b',
  stargazers_count: 1,
});
ok(noHtml.url === 'https://github.com/a/b', '没有 html_url 时按仓库名拼网页地址', noHtml.url);

var trailing = core.toRepo({ full_name: 'a/b', html_url: 'https://github.com/a/b/', stargazers_count: 1 });
ok(trailing.url === 'https://github.com/a/b', '去掉结尾斜杠', trailing.url);

var queryUrl = core.toRepo({ full_name: 'a/b', html_url: 'https://github.com/a/b?tab=readme', stargazers_count: 1 });
ok(queryUrl.url === 'https://github.com/a/b', '去掉查询串', queryUrl.url);

var evil = core.toRepo({ full_name: 'a/b', url: 'https://example.com/a/b', stargazers_count: 1 });
ok(evil.url === 'https://github.com/a/b', '非 GitHub 地址被忽略', evil.url);

ok(core.toRepo({ full_name: '', stargazers_count: 1 }).url === '', '空仓库名不给链接');

/* ---------------------------- 7. 离线快照 ---------------------------- */
section('离线快照');

ok(snap && Array.isArray(snap.repos), '快照结构正确');
ok(snap.repos.length >= 50, '快照条目数 >= 50，实际 ' + snap.repos.length);

var names = {};
var catCount = {};
var badDesc = [];
var badCat = [];
var validCat = {};
core.CATEGORIES.forEach(function (c) { validCat[c.id] = true; });

var snapRepos = snap.repos.map(function (raw) {
  var repo = core.toRepo(Object.assign({}, raw, { source: 'snapshot', approx: true }), 'all');
  if (names[repo.fullName]) console.log('  ! 重复条目：' + repo.fullName);
  names[repo.fullName] = true;
  if (!repo.descZh || repo.descZh.length < 6) badDesc.push(repo.fullName);
  if (!validCat[repo.category]) badCat.push(repo.fullName + '→' + repo.category);
  if (!/^https:\/\/github\.com\/[^\/]+\/[^\/]+$/.test(repo.url)) badDesc.push('url:' + repo.fullName);
  if (!(repo.stars > 0)) badDesc.push('stars:' + repo.fullName);
  catCount[repo.category] = (catCount[repo.category] || 0) + 1;
  return repo;
});
ok(badDesc.length === 0, '快照条目字段完整', badDesc.slice(0, 5));
ok(badCat.length === 0, '快照分类都是合法分类 id', badCat.slice(0, 5));
ok((catCount.other || 0) <= 3, '「其他」分类不超过 3 条，实际 ' + (catCount.other || 0));

var cats = Object.keys(catCount);
ok(cats.length >= 8, '快照覆盖至少 8 个分类，实际 ' + cats.length + '：' + cats.join(','), catCount);
['ai', 'frontend', 'backend', 'data', 'devops', 'mobile', 'tools', 'learn', 'system'].forEach(function (c) {
  ok((catCount[c] || 0) > 0, '快照包含分类 ' + c);
});

/* ---------------------------- 7. 端到端小模拟 ---------------------------- */
section('端到端小模拟');

var ranked = core.sortRepos(snapRepos, 'stars');
ok(ranked.length === snap.repos.length, '快照排序后数量不变');
ok(ranked[0].stars >= ranked[1].stars, '快照首位星标最高', [ranked[0].fullName, ranked[0].stars]);

var top = ranked.filter(function (r) { return r.category === 'ai'; });
ok(top.length >= 5, 'AI 分类条目足够展示，实际 ' + top.length);

var zhAll = ranked.filter(function (r) { return !r.descZh; });
ok(zhAll.length === 0, '所有快照条目都有中文简介', zhAll.map(function (r) { return r.fullName; }).slice(0, 5));

/* ---------------------------- 结果 ---------------------------- */
console.log('\n' + '─'.repeat(46));
console.log(fails === 0 ? '✅ 全部通过：' + checks + ' 项检查' : '❌ ' + fails + ' / ' + checks + ' 项失败');
process.exit(fails === 0 ? 0 : 1);
