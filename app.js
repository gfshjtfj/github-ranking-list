/**
 * app.js —— 界面与数据获取
 * 依赖：core.js（GSRCore）、snapshot.js（GSR_SNAPSHOT）
 */
(function () {
  'use strict';

  var core = window.GSRCore;
  var SNAP = window.GSR_SNAPSHOT || { repos: [], updated: '', note: '' };

  var STORE_KEYS = {
    settings: 'gsr:settings:v1',
    cache: 'gsr:cache:v2', // v2：旧的 v1 缓存里存着 API 地址，链接是坏的，直接弃用
    zh: 'gsr:zh:v1',
    api: 'gsr:api:v1',
    offline: 'gsr:offline-until:v1',
  };

  var CACHE_TTL = 10 * 60 * 1000; // 10 分钟内直接用缓存

  /* ------------------------------ 本地存储（失败就退化到内存） ------------------------------ */

  var memoryStore = {};
  function readJSON(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    if (memoryStore[key] !== undefined) return memoryStore[key];
    return fallback;
  }
  function writeJSON(key, value) {
    memoryStore[key] = value;
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }

  /* ------------------------------ 设置 ------------------------------ */

  var DEFAULT_SETTINGS = { token: '', apiBase: '', translate: true, theme: 'auto' };
  var settings = Object.assign({}, DEFAULT_SETTINGS, readJSON(STORE_KEYS.settings, {}));
  function saveSettings() { writeJSON(STORE_KEYS.settings, settings); }

  /* ------------------------------ 数据源适配器 ------------------------------ */

  var PROXIED = function (prefix) {
    return {
      id: prefix,
      name: prefix,
      url: function (path) { return prefix + 'https://api.github.com' + path; },
      useToken: false,
    };
  };

  var ADAPTERS = [
    {
      id: 'github', name: 'GitHub 官方 API（推荐）',
      url: function (path) { return 'https://api.github.com' + path; }, useToken: true,
    },
    {
      id: 'gh-proxy', name: 'gh-proxy 镜像',
      url: function (path) { return 'https://gh-proxy.com/https://api.github.com' + path; }, useToken: false,
    },
    {
      id: 'kkgithub', name: 'kkgithub 镜像',
      url: function (path) { return 'https://api.kkgithub.com' + path; }, useToken: false,
    },
    {
      id: 'corsproxy', name: 'corsproxy.io 中转',
      url: function (path) {
        return 'https://corsproxy.io/?url=' + encodeURIComponent('https://api.github.com' + path);
      }, useToken: false,
    },
    {
      id: 'allorigins', name: 'allorigins 中转',
      url: function (path) {
        return 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://api.github.com' + path);
      }, useToken: false,
    },
  ];

  function adapterList() {
    var list = ADAPTERS.slice();
    if (settings.apiBase && settings.apiBase.trim()) {
      var custom = PROXIED(settings.apiBase.trim().replace(/\/+$/, '') + '/');
      list.unshift(custom);
    } else {
      var preferred = readJSON(STORE_KEYS.api, '');
      if (preferred) {
        for (var i = 0; i < list.length; i++) {
          if (list[i].id === preferred) {
            var hit = list.splice(i, 1)[0];
            list.unshift(hit);
            break;
          }
        }
      }
    }
    return list;
  }

  /* ------------------------------ 网络请求 ------------------------------ */

  function fetchJSON(url, opts) {
    opts = opts || {};
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, opts.timeout || 12000);
    var headers = { 'Accept': 'application/vnd.github+json' };
    if (opts.token) headers['Authorization'] = 'Bearer ' + opts.token;
    return fetch(url, { headers: headers, signal: controller.signal })
      .then(function (res) {
        return res.text().then(function (text) {
          if (!res.ok) {
            var msg = '';
            try { msg = (JSON.parse(text) || {}).message || ''; } catch (e) { /* ignore */ }
            var err = new Error('HTTP ' + res.status + (msg ? '：' + msg : ''));
            err.status = res.status;
            throw err;
          }
          try {
            return JSON.parse(text);
          } catch (e) {
            throw new Error('返回内容不是 JSON');
          }
        });
      })
      .catch(function (err) {
        if (err.name === 'AbortError') throw new Error('请求超时');
        throw err;
      })
      .finally(function () { clearTimeout(timer); });
  }

  function describeError(err) {
    var msg = (err && err.message) || String(err);
    if (err && err.status === 403) return '接口被限流（403），可到设置里填入 GitHub Token 提升额度';
    if (err && err.status === 422) return '查询条件被拒绝（422）';
    if (/Failed to fetch|NetworkError|Load failed|网络|ERR_/i.test(msg)) return '网络不可达';
    return msg;
  }

  /* ------------------------------ 状态 ------------------------------ */

  var state = {
    board: 'all',
    category: 'all',
    query: '',
    sort: 'stars',
    loading: false,
    boards: {},     // boardId -> {items, page, total, source, updatedAt, more, note}
    lastError: '',
    translateBroken: false,
  };

  function boardState(boardId) {
    if (!state.boards[boardId]) {
      state.boards[boardId] = {
        items: [], page: 0, total: 0, source: '', updatedAt: 0, more: false, note: '',
      };
    }
    return state.boards[boardId];
  }

  /* ------------------------------ 缓存 ------------------------------ */

  function readCache(boardId) {
    var all = readJSON(STORE_KEYS.cache, {});
    return all[boardId] || null;
  }
  function writeCache(boardId, payload) {
    var all = readJSON(STORE_KEYS.cache, {});
    all[boardId] = payload;
    writeJSON(STORE_KEYS.cache, all);
  }

  /* ------------------------------ 拉取榜单 ------------------------------ */

  function fetchBoardPage(boardId, page) {
    var path = core.buildSearchPath(boardId, page);
    var list = adapterList();
    var tried = [];
    var deadline = Date.now() + 30000;

    function attempt(idx) {
      if (idx >= list.length || Date.now() > deadline) {
        var err = new Error('所有数据源都不可用');
        err.tried = tried;
        return Promise.reject(err);
      }
      var adapter = list[idx];
      var url = adapter.url(path);
      var token = adapter.useToken ? settings.token.trim() : '';
      return fetchJSON(url, { token: token, timeout: 9000 }).then(function (json) {
        if (!json || !Array.isArray(json.items)) throw new Error('返回格式异常');
        writeJSON(STORE_KEYS.api, adapter.id);
        return { items: json.items, total: json.total_count || json.items.length, adapter: adapter.name };
      }).catch(function (err) {
        tried.push(adapter.name + '(' + describeError(err) + ')');
        return attempt(idx + 1);
      });
    }
    return attempt(0);
  }

  function snapshotItems() {
    var list = (SNAP.repos || []).map(function (raw) {
      var repo = core.toRepo(Object.assign({}, raw, { source: 'snapshot', approx: true }), 'all');
      if (!repo.descZh) repo.descZh = raw.d || '';
      return repo;
    });
    return core.sortRepos(list, 'stars');
  }

  function loadBoard(boardId, opts) {
    opts = opts || {};
    var board = core.getBoard(boardId);
    var bs = boardState(boardId);
    if (state.loading) return;

    if (state.forceSnapshot && !opts.force) {
      applySnapshot(boardId);
      return render();
    }

    if (!opts.force && !opts.page && bs.items.length) return render();

    var cache = readCache(boardId);
    if (!opts.force && !opts.page && cache && Date.now() - cache.ts < CACHE_TTL) {
      bs.items = cache.items;
      bs.page = cache.page || 1;
      bs.total = cache.total || cache.items.length;
      bs.source = cache.source || 'live';
      bs.updatedAt = cache.ts;
      bs.more = cache.more !== false;
      bs.note = '';
      return render();
    }

    state.loading = true;
    renderLoading();

    // 刚才整轮都连不上：短时间内直接给快照，不让用户干等
    if (!opts.force && Date.now() < readJSON(STORE_KEYS.offline, 0)) {
      state.lastError = '网络暂不可用，稍后会自动重试';
      applySnapshot(boardId);
      state.loading = false;
      return render();
    }

    fetchBoardPage(boardId, opts.page || 1).then(function (result) {
      var incoming = result.items.map(function (raw) { return core.toRepo(raw, boardId); });
      var merged = opts.page && opts.page > 1 ? mergeUnique(bs.items, incoming) : incoming;
      bs.items = merged;
      bs.page = opts.page || 1;
      bs.total = result.total;
      bs.source = 'live';
      bs.updatedAt = Date.now();
      bs.more = bs.page < (board.pages || 1);
      bs.note = '';
      state.lastError = '';
      writeJSON(STORE_KEYS.offline, 0);
      writeCache(boardId, { ts: bs.updatedAt, items: bs.items, page: bs.page, total: bs.total, source: 'live', more: bs.more });
    }).catch(function (err) {
      state.lastError = describeError(err);
      writeJSON(STORE_KEYS.offline, Date.now() + 120000); // 2 分钟内不再重试
      if (!bs.items.length) applySnapshot(boardId);
    }).finally(function () {
      state.loading = false;
      render();
    });
  }

  // 回退到内置离线快照，并写一份缓存（下次打开不用等网络）
  // 快照只有总榜数据：其他榜单留空，由空态提示引导
  function applySnapshot(boardId) {
    var bs = boardState(boardId);
    var hasData = boardId === 'all';
    bs.items = hasData ? snapshotItems() : [];
    bs.page = 1;
    bs.total = bs.items.length;
    bs.source = 'snapshot';
    bs.updatedAt = Date.now();
    bs.more = false;
    bs.note = hasData ? '已使用内置离线快照（星标为近似值）' : '离线快照只包含总榜';
    writeCache(boardId, { ts: bs.updatedAt, items: bs.items, page: 1, total: bs.total, source: 'snapshot', more: false });
  }

  function mergeUnique(prev, next) {
    var seen = {};
    var out = [];
    prev.concat(next).forEach(function (repo) {
      if (seen[repo.fullName]) return;
      seen[repo.fullName] = true;
      out.push(repo);
    });
    return out;
  }

  /* ------------------------------ DOM 引用 ------------------------------ */

  var el = {};
  function $(id) { return document.getElementById(id); }

  function cacheDom() {
    el.boards = $('boards');
    el.cats = $('cats');
    el.search = $('search');
    el.sort = $('sort');
    el.refresh = $('refresh');
    el.theme = $('theme');
    el.settingsBtn = $('settings-btn');
    el.list = $('list');
    el.meta = $('meta');
    el.banner = $('banner');
    el.more = $('more');
    el.empty = $('empty');
    el.dialog = $('settings-dialog');
    el.token = $('token-input');
    el.apiBase = $('api-base-input');
    el.translate = $('translate-input');
    el.clearCache = $('clear-cache');
    el.saveSettings = $('save-settings');
    el.dialogClose = $('dialog-close');
    el.toast = $('toast');
    el.boardDesc = $('board-desc');
  }

  /* ------------------------------ 渲染 ------------------------------ */

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function renderBoards() {
    el.boards.innerHTML = core.BOARDS.map(function (b) {
      var active = b.id === state.board ? ' active' : '';
      return '<button class="board-tab' + active + '" role="tab" aria-selected="' + (b.id === state.board) +
        '" data-board="' + b.id + '">' +
        '<span class="board-name">' + b.name + '</span>' +
        '<span class="board-sub">' + b.short + '</span>' +
        '</button>';
    }).join('');
  }

  function renderCategories() {
    var counts = categoryCounts();
    el.cats.innerHTML = core.CATEGORIES.map(function (c) {
      var n = c.id === 'all' ? totalCount() : (counts[c.id] || 0);
      var active = c.id === state.category ? ' active' : '';
      var disabled = n === 0 && c.id !== 'all' ? ' dim' : '';
      return '<button class="chip' + active + disabled + '" data-cat="' + c.id + '" title="' + escapeHtml(c.name) +
        '">' + c.icon + ' ' + c.name + '<span class="chip-n">' + n + '</span></button>';
    }).join('');
  }

  function totalCount() {
    return boardState(state.board).items.length;
  }

  function categoryCounts() {
    var counts = {};
    boardState(state.board).items.forEach(function (r) {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return counts;
  }

  function visibleItems() {
    return core.filterRepos(boardState(state.board).items, {
      category: state.category,
      query: state.query,
      sort: state.sort,
    });
  }

  function renderMeta() {
    var bs = boardState(state.board);
    var board = core.getBoard(state.board);
    el.boardDesc.textContent = board.desc;
    if (!bs.items.length) {
      el.meta.textContent = '';
      return;
    }
    var src = bs.source === 'snapshot' ? '内置离线快照' : 'GitHub API';
    var updated = bs.updatedAt ? core.formatRelative(new Date(bs.updatedAt).toISOString()) : '';
    var shown = visibleItems().length;
    el.meta.innerHTML =
      '<span>共 <b>' + shown + '</b> 个' + (shown !== bs.items.length ? '（已筛选，总计 ' + bs.items.length + '）' : '') + '</span>' +
      '<span class="dot">·</span><span>来源：' + src + '</span>' +
      (updated ? '<span class="dot">·</span><span>更新于 ' + updated + '</span>' : '') +
      (bs.source === 'live' ? '<span class="dot">·</span><span class="rate-hint">无 Token 时 GitHub 限 10 次/分钟</span>' : '');
  }

  function renderBanner() {
    var bs = boardState(state.board);
    if (bs.source === 'snapshot') {
      var text = state.forceSnapshot
        ? '当前是<b>离线快照模式</b>（地址栏 ?snapshot=1），显示内置数据，星标为近似值。'
        : '联网获取失败，正在显示<b>内置离线快照</b>（星标为近似值）。原因：' +
          escapeHtml(state.lastError || '网络不可达');
      el.banner.innerHTML = '<span class="banner-icon">⚠️</span><span>' + text + '</span>' +
        '<button class="banner-btn" data-act="retry">重试联网</button>';
      el.banner.hidden = false;
    } else if (state.lastError) {
      el.banner.innerHTML = '<span class="banner-icon">⚠️</span><span>刷新失败：' +
        escapeHtml(state.lastError) + '，当前显示上次数据。</span>' +
        '<button class="banner-btn" data-act="retry">重试</button>';
      el.banner.hidden = false;
    } else {
      el.banner.hidden = true;
      el.banner.innerHTML = '';
    }
  }

  function rankBadge(i) {
    var cls = i === 0 ? ' gold' : i === 1 ? ' silver' : i === 2 ? ' bronze' : '';
    return '<span class="rank' + cls + '">' + (i + 1) + '</span>';
  }

  function cardHtml(repo, index) {
    var cat = core.getCategory(repo.category);
    var stars = (repo.approx ? '≈ ' : '') + core.formatStars(repo.stars);
    var hasDesc = !!(repo.descZh || repo.descOriginal);
    var desc = repo.descZh || repo.descOriginal || '（该项目未填写简介）';
    // 只有「有简介、但不是中文」才打英文原文标记（不少国内项目简介本身就是中文）
    var isEn = hasDesc && !/[\u4e00-\u9fa5]/.test(desc) && /[a-zA-Z]/.test(desc);
    var updated = repo.pushedAt ? '<span class="tag">' + core.formatRelative(repo.pushedAt) + '更新</span>' : '';
    var lang = repo.language
      ? '<span class="tag"><i class="lang-dot" style="background:' + core.langColor(repo.language) + '"></i>' +
        escapeHtml(repo.language) + '</span>'
      : '';
    var topics = (repo.topics || []).slice(0, 3).map(function (t) {
      return '<span class="topic">' + escapeHtml(t) + '</span>';
    }).join('');

    return '<article class="card" data-key="' + escapeHtml(repo.fullName) + '">' +
      '<div class="card-top">' + rankBadge(index) +
      '<a class="repo" href="' + escapeHtml(repo.url) + '" target="_blank" rel="noopener noreferrer">' +
      escapeHtml(repo.fullName) + '</a>' +
      '<span class="stars" title="' + core.formatFull(repo.stars) + ' 星标">★ ' + stars + '</span>' +
      '</div>' +
      '<p class="desc' + (isEn ? ' is-en' : '') + '">' + escapeHtml(desc) +
      (isEn ? '<span class="en-badge" title="暂无中文简介，显示英文原文">EN</span>' : '') + '</p>' +
      '<div class="tags">' +
      '<span class="tag cat">' + cat.icon + ' ' + escapeHtml(cat.name) + '</span>' +
      lang + updated +
      '<span class="tag forks">⑂ ' + core.formatStars(repo.forks) + '</span>' +
      '</div>' +
      (topics ? '<div class="topics">' + topics + '</div>' : '') +
      '</article>';
  }

  function render() {
    renderBoards();
    renderCategories();
    renderMeta();
    renderBanner();

    var items = visibleItems();
    var bs = boardState(state.board);

    if (state.loading && !bs.items.length) {
      renderLoading();
      return;
    }

    el.list.innerHTML = items.map(cardHtml).join('');

    if (!items.length) {
      el.empty.hidden = false;
      el.empty.innerHTML = bs.source === 'snapshot' && state.board !== 'all'
        ? '离线快照只包含<b>总榜</b>数据。切回总榜，或联网后点「更新」获取' + core.getBoard(state.board).name + '。'
        : (bs.items.length
          ? '没有匹配的项目，换个关键词或分类试试。'
          : '还没有数据，点右上角「更新」拉取一次。');
    } else {
      el.empty.hidden = true;
    }

    el.more.hidden = !(bs.more && bs.source === 'live' && items.length);
    el.refresh.classList.toggle('loading', state.loading);
    el.refresh.disabled = state.loading;

    if (settings.translate && !state.translateBroken && bs.source === 'live') queueTranslate(items);
  }

  function renderLoading() {
    el.list.innerHTML = new Array(6).fill(0).map(function () {
      return '<div class="card skeleton"><div class="sk-line w60"></div><div class="sk-line w90"></div>' +
        '<div class="sk-line w40"></div></div>';
    }).join('');
    el.empty.hidden = true;
    el.more.hidden = true;
  }

  /* ------------------------------ 简介机器翻译（可选） ------------------------------ */

  var zhCache = readJSON(STORE_KEYS.zh, {});
  var translating = {};
  var failStreak = 0;

  function queueTranslate(items) {
    if (!navigator.onLine) return;
    var pending = items.filter(function (r) {
      return !r.descZh && r.descOriginal && /[a-zA-Z]{3}/.test(r.descOriginal) &&
        !/[\u4e00-\u9fa5]/.test(r.descOriginal) && !translating[r.fullName];
    }).slice(0, 14);

    pending.forEach(function (repo, i) {
      setTimeout(function () { translateRepo(repo); }, i * 200);
    });
  }

  function translateRepo(repo) {
    if (repo.descZh || translating[repo.fullName]) return;
    var known = zhCache[repo.fullName] || core.lookupZh(repo.fullName);
    if (known) {
      repo.descZh = known;
      patchDesc(repo);
      return;
    }
    translating[repo.fullName] = true;
    var text = repo.descOriginal.slice(0, 180);
    var url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) + '&langpair=en|zh-CN';

    fetchJSON(url, { timeout: 9000 }).then(function (json) {
      var out = json && json.responseData && json.responseData.translatedText;
      if (!out || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(out)) throw new Error('翻译不可用');
      zhCache[repo.fullName] = out;
      writeJSON(STORE_KEYS.zh, zhCache);
      repo.descZh = out;
      failStreak = 0;
      patchDesc(repo);
    }).catch(function () {
      failStreak++;
      if (failStreak >= 3) {
        state.translateBroken = true;
      }
    }).finally(function () {
      delete translating[repo.fullName];
    });
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    return String(value).replace(/["\\]/g, '\\$&');
  }

  function patchDesc(repo) {
    var node = el.list.querySelector('.card[data-key="' + cssEscape(repo.fullName) + '"] .desc');
    if (!node) return;
    var en = node.querySelector('.en-badge');
    if (en) en.remove();
    node.classList.remove('is-en');
    node.textContent = repo.descZh;
  }

  /* ------------------------------ 提示条 ------------------------------ */

  var toastTimer = null;
  function toast(msg, kind) {
    el.toast.textContent = msg;
    el.toast.className = 'toast show' + (kind ? ' ' + kind : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.className = 'toast'; }, 3200);
  }

  /* ------------------------------ 主题 ------------------------------ */

  function applyTheme() {
    var theme = settings.theme;
    if (theme === 'auto') {
      var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    } else {
      document.documentElement.dataset.theme = theme;
    }
    el.theme.textContent = document.documentElement.dataset.theme === 'dark' ? '☀️' : '🌙';
    el.theme.setAttribute('aria-label', document.documentElement.dataset.theme === 'dark' ? '切换到浅色' : '切换到深色');
  }

  /* ------------------------------ 事件绑定 ------------------------------ */

  function bind() {
    el.boards.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-board]');
      if (!btn) return;
      state.board = btn.dataset.board;
      state.category = 'all';
      loadBoard(state.board, {});
    });

    el.cats.addEventListener('click', function (e) {
      var chip = e.target.closest('[data-cat]');
      if (!chip) return;
      state.category = chip.dataset.cat;
      render();
    });

    var searchTimer = null;
    el.search.addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        state.query = el.search.value;
        render();
      }, 150);
    });

    el.sort.addEventListener('change', function () {
      state.sort = el.sort.value;
      render();
    });

    el.refresh.addEventListener('click', function () {
      loadBoard(state.board, { force: true });
      toast('正在从 GitHub 拉取最新数据…');
    });

    el.more.addEventListener('click', function () {
      var bs = boardState(state.board);
      loadBoard(state.board, { page: (bs.page || 1) + 1 });
    });

    el.theme.addEventListener('click', function () {
      var current = document.documentElement.dataset.theme;
      settings.theme = current === 'dark' ? 'light' : 'dark';
      saveSettings();
      applyTheme();
    });

    el.banner.addEventListener('click', function (e) {
      if (e.target.dataset.act === 'retry') loadBoard(state.board, { force: true });
    });

    el.settingsBtn.addEventListener('click', function () {
      el.token.value = settings.token;
      el.apiBase.value = settings.apiBase;
      el.translate.checked = settings.translate;
      if (typeof el.dialog.showModal === 'function') el.dialog.showModal();
      else el.dialog.setAttribute('open', '');
    });

    el.dialogClose.addEventListener('click', function () { el.dialog.close(); });

    el.saveSettings.addEventListener('click', function () {
      settings.token = el.token.value.trim();
      settings.apiBase = el.apiBase.value.trim();
      settings.translate = el.translate.checked;
      saveSettings();
      el.dialog.close();
      toast('设置已保存，正在刷新…');
      loadBoard(state.board, { force: true });
    });

    el.clearCache.addEventListener('click', function () {
      try { window.localStorage.removeItem(STORE_KEYS.cache); } catch (e) { /* ignore */ }
      state.boards = {};
      el.dialog.close();
      toast('本地缓存已清除');
      loadBoard(state.board, { force: true });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement !== el.search) {
        e.preventDefault();
        el.search.focus();
      }
      if (e.key === 'Escape' && el.search === document.activeElement) el.search.blur();
    });

    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () { if (settings.theme === 'auto') applyTheme(); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
    }
  }

  /* ------------------------------ 启动 ------------------------------ */

  function init() {
    cacheDom();
    applyTheme();
    el.sort.innerHTML = core.SORTS.map(function (s) {
      return '<option value="' + s.id + '">' + s.name + '</option>';
    }).join('');
    el.sort.value = state.sort;
    bind();

    // 地址栏加 ?snapshot=1 可以强制用内置离线数据（演示 / 没网时很好用）
    state.forceSnapshot = /[?&]snapshot=1\b/.test(window.location.search);

    var bs = boardState('all');
    var cache = state.forceSnapshot ? null : readCache('all');
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      bs.items = cache.items;
      bs.page = cache.page || 1;
      bs.total = cache.total || 0;
      bs.source = cache.source || 'live';
      bs.updatedAt = cache.ts;
      bs.more = cache.more !== false;
      render();
    } else if (state.forceSnapshot) {
      state.lastError = '已启用离线快照模式（地址栏 ?snapshot=1）';
      applySnapshot('all');
      render();
    } else {
      loadBoard('all', {});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
