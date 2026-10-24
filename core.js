/**
 * core.js —— 纯逻辑层（不碰 DOM、不碰网络）
 * 浏览器里挂到 window.GSRCore；Node 里挂到 globalThis.GSRCore，方便自测。
 */
(function (root) {
  'use strict';

  /* ------------------------------ 榜单维度 ------------------------------ */

  // windowDays = null 表示不限时间；否则只统计「最近 N 天新建」的仓库
  var BOARDS = [
    {
      id: 'all',
      name: '总榜',
      short: '历史累计',
      desc: '有史以来星标最多的仓库（不限创建时间）',
      windowDays: null,
      minStars: 1000,
      pages: 3,
    },
    {
      id: 'year',
      name: '年榜',
      short: '近 1 年',
      desc: '近 1 年内新建、星标最高的仓库',
      windowDays: 365,
      minStars: 300,
      pages: 2,
    },
    {
      id: 'month',
      name: '月榜',
      short: '近 30 天',
      desc: '近 30 天新建、星标最高的仓库',
      windowDays: 30,
      minStars: 10,
      pages: 2,
    },
    {
      id: 'week',
      name: '周榜',
      short: '近 7 天',
      desc: '近 7 天新建、星标最高的仓库',
      windowDays: 7,
      minStars: 3,
      pages: 2,
    },
  ];

  function getBoard(id) {
    for (var i = 0; i < BOARDS.length; i++) if (BOARDS[i].id === id) return BOARDS[i];
    return BOARDS[0];
  }

  /* ------------------------------ 项目分类 ------------------------------ */

  var CATEGORIES = [
    { id: 'all', name: '全部', icon: '✦' },
    { id: 'ai', name: 'AI / 大模型', icon: '🤖' },
    { id: 'frontend', name: '前端', icon: '🎨' },
    { id: 'backend', name: '后端 / 服务端', icon: '🧱' },
    { id: 'data', name: '数据 / 数据库', icon: '🗄️' },
    { id: 'devops', name: '云原生 / 运维', icon: '☁️' },
    { id: 'mobile', name: '移动端', icon: '📱' },
    { id: 'tools', name: '开发工具', icon: '🛠️' },
    { id: 'learn', name: '学习资源', icon: '📚' },
    { id: 'system', name: '系统 / 底层', icon: '⚙️' },
    { id: 'security', name: '安全', icon: '🔐' },
    { id: 'other', name: '其他', icon: '📦' },
  ];

  function getCategory(id) {
    for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].id === id) return CATEGORIES[i];
    return CATEGORIES[CATEGORIES.length - 1];
  }

  // 按优先级从前到后匹配；先命中先归类
  var RULES = [
    {
      cat: 'learn',
      scope: 'name',
      words: [
        'awesome', 'awesomes', 'awesome lists', 'roadmap', 'roadmaps', 'developer roadmap',
        'interview', 'interviews', 'free programming books', 'programming books', 'books',
        'build your own x', 'coding interview university', 'system design primer',
        'tutorial', 'tutorials', 'cheatsheet', 'cheatsheets', 'cs notes', 'weekly',
        'public apis', 'education', 'learn to code', 'curated list', 'list of',
      ],
    },
    {
      cat: 'ai',
      scope: 'any',
      words: [
        'ai', 'llm', 'llms', 'gpt', 'chatgpt', 'machine learning', 'deep learning',
        'transformer', 'transformers', 'diffusion', 'stable diffusion', 'neural',
        'neural network', 'agent', 'agents', 'rag', 'embedding', 'embeddings',
        'langchain', 'pytorch', 'tensorflow', 'huggingface', 'ollama', 'mcp',
        'prompt', 'inference', 'whisper', 'nlp', 'computer vision', 'comfyui',
        'autogpt', 'copilot', 'reasoning', 'moe', 'quantization', 'speech recognition',
        'openai', 'chatbot', 'text generation', 'fine tuning', 'model context protocol',
        'artificial intelligence',
      ],
    },
    {
      cat: 'security',
      scope: 'any',
      words: [
        'security', 'hacking', 'pentest', 'penetration testing', 'vulnerability',
        'exploit', 'malware', 'ctf', 'reverse engineering', 'firewall', 'vpn',
        'password manager', 'zero trust', 'threat intel', 'forensics',
      ],
    },
    {
      cat: 'devops',
      scope: 'any',
      words: [
        'kubernetes', 'k8s', 'docker', 'devops', 'terraform', 'ansible', 'ci cd',
        'continuous integration', 'nginx', 'prometheus', 'grafana', 'observability',
        'cloud native', 'helm', 'argocd', 'serverless', 'infrastructure',
        'monitoring', 'containers', 'orchestration', 'deployment', 'ops',
      ],
    },
    {
      cat: 'mobile',
      scope: 'any',
      words: [
        'android', 'ios', 'swift', 'kotlin', 'flutter', 'react native', 'mobile',
        'jetpack compose', 'xamarin', 'app store', 'android app', 'ios app',
      ],
    },
    {
      cat: 'frontend',
      scope: 'any',
      words: [
        'react', 'vue', 'svelte', 'angular', 'next js', 'nuxt', 'tailwind', 'css',
        'frontend', 'front end', 'web components', 'three js', 'webgl', 'vite',
        'webpack', 'astro', 'shadcn', 'design system', 'component library',
        'ui components', 'dom', 'html5', 'typescript', 'javascript', 'jquery',
      ],
    },
    {
      cat: 'backend',
      scope: 'any',
      words: [
        'backend', 'back end', 'server', 'api', 'microservice', 'microservices',
        'framework', 'http', 'rest', 'graphql', 'grpc', 'spring', 'django',
        'flask', 'express', 'laravel', 'rails', 'fastapi', 'koa', 'nestjs',
        'golang', 'node', 'nodejs', 'deno', 'bun', 'php', 'java', 'supabase',
        'runtime', 'authentication', 'websocket', 'message queue',
      ],
    },
    {
      cat: 'data',
      scope: 'any',
      words: [
        'database', 'databases', 'sql', 'redis', 'postgres', 'postgresql', 'mysql',
        'mongodb', 'kafka', 'clickhouse', 'elasticsearch', 'etl', 'data warehouse',
        'dataframe', 'pandas', 'analytics', 'streaming', 'olap', 'vector database',
        'streamlit', 'jupyter', 'data science', 'data analysis', 'search engine',
        'full text search', 'nosql', 'timeseries', 'time series', 'messaging',
      ],
    },
    {
      cat: 'tools',
      scope: 'any',
      words: [
        'cli', 'terminal', 'editor', 'vscode', 'neovim', 'vim', 'productivity',
        'dotfiles', 'shell', 'zsh', 'git', 'package manager', 'build tool',
        'launcher', 'desktop app', 'remote desktop', 'file transfer', 'workflow',
        'automation', 'utilities', 'powershell', 'notes', 'screenshot',
        'clipboard', 'testing', 'e2e', 'api testing', 'docs', 'markdown',
      ],
    },
    {
      cat: 'system',
      scope: 'any',
      words: [
        'kernel', 'operating system', 'compiler', 'embedded', 'firmware', 'wasm',
        'webassembly', 'assembly', 'low level', 'drivers', 'virtual machine',
        'browser engine', 'rust', 'systems programming', 'linux kernel', 'bootloader',
      ],
    },
  ];

  function normalizeText(s) {
    return (' ' + String(s || '').toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() + ' ');
  }

  function hit(scopeText, words) {
    for (var i = 0; i < words.length; i++) {
      if (scopeText.indexOf(' ' + words[i] + ' ') !== -1) return true;
    }
    return false;
  }

  function classify(repo) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].id === repo.category) return repo.category;
    }
    var nameText = normalizeText(
      [repo.name, repo.fullName, (repo.topics || []).join(' ')].join(' ')
    );
    var anyText = normalizeText(
      [repo.name, repo.fullName, (repo.topics || []).join(' '), repo.description, repo.descZh].join(' ')
    );
    for (var r = 0; r < RULES.length; r++) {
      var rule = RULES[r];
      var text = rule.scope === 'name' ? nameText : anyText;
      if (hit(text, rule.words)) return rule.cat;
    }
    return 'other';
  }

  /* ------------------------------ 数据归一化 ------------------------------ */

  var WEB_REPO_RE = /^https:\/\/(?:www\.)?github\.com\/[^\/]+\/[^\/?#]+/;

  /**
   * 只认 GitHub 网页地址。
   * 注意：Search API 返回的 url 字段是 API 地址（api.github.com/repos/…），
   * 点开是一屏 JSON，绝不能用它当仓库链接；网页地址在 html_url 里。
   */
  function webUrl(fullName, raw) {
    var candidates = [raw.html_url, raw.url, raw.web_url];
    for (var i = 0; i < candidates.length; i++) {
      if (typeof candidates[i] === 'string' && WEB_REPO_RE.test(candidates[i])) {
        return candidates[i].split('?')[0].split('#')[0].replace(/\/+$/, '');
      }
    }
    return fullName ? 'https://github.com/' + fullName : '';
  }

  function toRepo(raw, boardId) {
    var fullName = raw.full_name || raw.fullName || raw.n || '';
    var created = raw.created_at || raw.created || null;
    var pushed = raw.pushed_at || raw.pushed || null;
    var repo = {
      fullName: fullName,
      name: fullName.split('/').pop() || fullName,
      owner: fullName.split('/')[0] || '',
      url: webUrl(fullName, raw),
      stars: Number(raw.stargazers_count != null ? raw.stargazers_count : raw.s) || 0,
      forks: Number(raw.forks_count != null ? raw.forks_count : raw.f) || 0,
      language: raw.language || raw.l || '',
      topics: (raw.topics || raw.t || []).slice(0, 8),
      descZh: raw.descZh || raw.zh || raw.d || '',
      descOriginal: raw.description || raw.desc || '',
      createdAt: created,
      pushedAt: pushed,
      category: raw.category || raw.c || '',
      board: boardId || raw.board || 'all',
      approx: !!raw.approx,
      source: raw.source || 'live',
      translated: false,
    };
    repo.category = classify(repo);
    if (!repo.descZh) repo.descZh = '';
    return repo;
  }

  /* ------------------------------ 查询构造 ------------------------------ */

  function isoDate(d) {
    return d.toISOString().slice(0, 10);
  }

  /**
   * 生成 GitHub Search API 的查询参数
   * @returns {{q:string, sort:string, order:string, per_page:number, page:number}}
   */
  function buildQuery(boardId, page, now) {
    var board = getBoard(boardId);
    var today = now ? new Date(now) : new Date();
    var q;
    if (board.windowDays) {
      var from = new Date(today.getTime() - board.windowDays * 86400000);
      q = 'created:>=' + isoDate(from) + ' stars:>=' + board.minStars;
    } else {
      q = 'stars:>=' + board.minStars;
    }
    return {
      q: q,
      sort: 'stars',
      order: 'desc',
      per_page: 100,
      page: Math.max(1, page || 1),
    };
  }

  function buildSearchPath(boardId, page, now) {
    var p = buildQuery(boardId, page, now);
    return '/search/repositories?q=' + encodeURIComponent(p.q) +
      '&sort=' + p.sort + '&order=' + p.order +
      '&per_page=' + p.per_page + '&page=' + p.page;
  }

  /* ------------------------------ 筛选与排序 ------------------------------ */

  var SORTS = [
    { id: 'stars', name: '星标数（多→少）' },
    { id: 'updated', name: '最近更新' },
    { id: 'name', name: '名称（A→Z）' },
  ];

  function matchQuery(repo, q) {
    if (!q) return true;
    var needle = q.toLowerCase();
    var hay = [
      repo.fullName, repo.descZh, repo.descOriginal, repo.language,
      (repo.topics || []).join(' '), repo.category,
    ].join(' ').toLowerCase();
    return hay.indexOf(needle) !== -1;
  }

  function filterRepos(list, opts) {
    opts = opts || {};
    var category = opts.category && opts.category !== 'all' ? opts.category : null;
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var repo = list[i];
      if (category && repo.category !== category) continue;
      if (!matchQuery(repo, (opts.query || '').trim())) continue;
      out.push(repo);
    }
    return sortRepos(out, opts.sort);
  }

  function sortRepos(list, sort) {
    var arr = list.slice();
    if (sort === 'name') {
      arr.sort(function (a, b) { return a.name.toLowerCase().localeCompare(b.name.toLowerCase()); });
    } else if (sort === 'updated') {
      arr.sort(function (a, b) {
        var ta = a.pushedAt ? Date.parse(a.pushedAt) : 0;
        var tb = b.pushedAt ? Date.parse(b.pushedAt) : 0;
        if (tb !== ta) return tb - ta;
        return b.stars - a.stars;
      });
    } else {
      arr.sort(function (a, b) {
        if (b.stars !== a.stars) return b.stars - a.stars;
        return a.fullName.localeCompare(b.fullName);
      });
    }
    return arr;
  }

  /* ------------------------------ 展示格式化 ------------------------------ */

  function formatStars(n) {
    n = Number(n) || 0;
    if (n >= 10000) {
      var w = n / 10000;
      return (w >= 100 ? Math.round(w) : Math.round(w * 10) / 10) + ' 万';
    }
    if (n >= 1000) return String(Math.round(n / 100) / 10) + 'k';
    return String(n);
  }

  function formatFull(n) {
    return (Number(n) || 0).toLocaleString('en-US');
  }

  function formatRelative(iso, now) {
    if (!iso) return '';
    var t = Date.parse(iso);
    if (isNaN(t)) return '';
    var diff = (now ? new Date(now).getTime() : Date.now()) - t;
    if (diff < 0) return '刚刚';
    var min = Math.floor(diff / 60000);
    if (min < 1) return '刚刚';
    if (min < 60) return min + ' 分钟前';
    var hr = Math.floor(min / 60);
    if (hr < 24) return hr + ' 小时前';
    var day = Math.floor(hr / 24);
    if (day < 30) return day + ' 天前';
    var mon = Math.floor(day / 30);
    if (mon < 12) return mon + ' 个月前';
    return Math.floor(mon / 12) + ' 年前';
  }

  // GitHub 常用语言配色
  var LANG_COLORS = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5', Go: '#00ADD8',
    Rust: '#dea584', Java: '#b07219', C: '#555555', 'C++': '#f34b7d', 'C#': '#178600',
    PHP: '#4F5D95', Ruby: '#701516', Swift: '#F05138', Kotlin: '#A97BFF',
    Dart: '#00B4AB', Shell: '#89e051', HTML: '#e34c26', CSS: '#563d7c',
    Vue: '#41b883', Svelte: '#ff3e00', Lua: '#000080', Zig: '#ec915c',
    'Jupyter Notebook': '#DA5B0B', Dockerfile: '#384d54',
  };

  function langColor(lang) {
    return LANG_COLORS[lang] || '#8b949e';
  }

  /* ------------------------------ 中文简介字典 ------------------------------ */

  // 常见项目的人工中文简介（命中就不用机器翻译）
  var ZH_DICT = {
    'freeCodeCamp/freeCodeCamp': '免费学编程的公益项目，课程覆盖前端、后端到数据科学。',
    'codecrafters-io/build-your-own-x': '从零手写 Docker、Git、Redis 等经典技术，最扎实的进阶方式。',
    'sindresorhus/awesome': '各种「Awesome 清单」的总入口，找资源先来这里。',
    'public-apis/public-apis': '免费公开 API 合集，做练手项目必备。',
    'kamranahmedse/developer-roadmap': '前端、后端、DevOps 的学习路线图，规划路径的好帮手。',
    'EbookFoundation/free-programming-books': '多语言免费编程书籍与课程索引。',
    'donnemartin/system-design-primer': '系统设计入门与面试题，大厂面试常备。',
    'vinta/awesome-python': 'Python 生态资源大全：库、框架、工具一网打尽。',
    'jwasham/coding-interview-university': '从零准备软件工程师面试的完整学习计划。',
    '996icu/996.ICU': '「工作 996，生病 ICU」——程序员加班文化的社会议题仓库。',
    'tensorflow/tensorflow': 'Google 的深度学习框架，工业界部署生态最完整。',
    'pytorch/pytorch': '研究者首选的深度学习框架，动态图易调试、GPU 支持好。',
    'huggingface/transformers': '预训练模型统一接口，几行代码调用主流大模型。',
    'langchain-ai/langchain': '构建大模型应用的框架：链式编排、工具调用、RAG 都支持。',
    'ollama/ollama': '一行命令在本机跑 Llama、Qwen 等开源大模型。',
    'open-webui/open-webui': '自托管的类 ChatGPT 界面，可接 Ollama 与 OpenAI 兼容接口。',
    'ggml-org/llama.cpp': '纯 C/C++ 的推理引擎，CPU 也能跑量化大模型。',
    'ggerganov/llama.cpp': '纯 C/C++ 的推理引擎，CPU 也能跑量化大模型。',
    'AUTOMATIC1111/stable-diffusion-webui': '最流行的 Stable Diffusion 网页界面，插件生态丰富。',
    'comfyanonymous/ComfyUI': '节点式 AI 绘图工作流，可控性远超普通界面。',
    'Significant-Gravitas/AutoGPT': '最早走红的自主 AI 智能体实验项目。',
    'openai/whisper': 'OpenAI 开源语音识别模型，多语言转写效果好。',
    'deepseek-ai/DeepSeek-R1': 'DeepSeek 开源推理模型，用强化学习练出长链思考能力。',
    'deepseek-ai/DeepSeek-V3': '671B 参数 MoE 大模型，开源权重、性价比极高。',
    'browser-use/browser-use': '让 AI 直接操作浏览器完成网页任务。',
    'modelcontextprotocol/servers': 'MCP 官方服务器合集，为 AI 接入文件、数据库等外部能力。',
    'All-Hands-AI/OpenHands': '开源 AI 软件工程师，在沙箱里自动写代码、跑测试。',
    'cline/cline': 'VS Code 里的自主编程智能体，能读写文件、执行命令。',
    'facebook/react': '声明式 UI 库，现代前端组件化的起点。',
    'vuejs/vue': '渐进式前端框架，上手快、中文文档友好。',
    'vercel/next.js': 'React 全栈框架，服务端渲染与文件路由开箱即用。',
    'twbs/bootstrap': '老牌响应式 UI 框架，快速搭原型最稳的选择。',
    'tailwindlabs/tailwindcss': '原子化 CSS 框架，样式直接写在 class 里。',
    'mrdoob/three.js': '浏览器 3D 渲染的标配库。',
    'vitejs/vite': '极快的现代前端构建工具，冷启动几乎无等待。',
    'shadcn-ui/ui': '复制即用的 React 组件集合，基于 Tailwind 与 Radix。',
    'storybookjs/storybook': '组件开发与文档工作台，隔离调试 UI。',
    'axios/axios': '浏览器与 Node 通用的 HTTP 请求库。',
    'microsoft/TypeScript': '给 JavaScript 加上静态类型。',
    'nodejs/node': '服务端 JavaScript 运行时。',
    'golang/go': 'Go 语言官方仓库，云原生时代的主力语言。',
    'fastapi/fastapi': '高性能 Python Web 框架，自动生成 OpenAPI 文档。',
    'django/django': '自带后台管理与 ORM 的 Python 全栈框架。',
    'spring-projects/spring-boot': 'Java 微服务的事实标准。',
    'laravel/laravel': 'PHP 生态里最优雅的全栈框架。',
    'rails/rails': '约定优于配置的 Ruby Web 框架。',
    'expressjs/express': 'Node 生态最经典的极简 Web 框架。',
    'supabase/supabase': '开源版 Firebase：Postgres + 鉴权 + 存储 + 实时订阅。',
    'denoland/deno': '默认安全的 JS/TS 运行时，内置格式化、测试等工具。',
    'oven-sh/bun': '集运行时、打包、测试于一体的超快 JS 工具链。',
    'appwrite/appwrite': '可自托管的后端即服务平台。',
    'redis/redis': '内存键值数据库，缓存与队列的常用选择。',
    'postgres/postgres': '功能最全的开源关系型数据库。',
    'mongodb/mongo': '文档型 NoSQL 数据库。',
    'elastic/elasticsearch': '分布式搜索与分析引擎。',
    'apache/kafka': '分布式消息与流处理平台。',
    'clickhouse/clickhouse': '列式分析数据库，亿级日志查询也能毫秒返回。',
    'streamlit/streamlit': '几行 Python 就能把数据脚本变成网页应用。',
    'pandas-dev/pandas': 'Python 数据分析的事实标准。',
    'kubernetes/kubernetes': '容器编排的事实标准。',
    'moby/moby': 'Docker 引擎的开源上游项目。',
    'ansible/ansible': '无 Agent 的配置管理与自动化部署。',
    'grafana/grafana': '可观测性看板，接 Prometheus 等数据源。',
    'prometheus/prometheus': '云原生监控与告警系统。',
    'netdata/netdata': '开箱即用的实时系统监控。',
    'hashicorp/terraform': '基础设施即代码，多云资源统一声明。',
    'flutter/flutter': 'Google 的跨平台 UI 框架，一套代码跑六端。',
    'facebook/react-native': '用 React 写原生移动应用。',
    'rustdesk/rustdesk': '开源自托管远程桌面，TeamViewer 的替代品。',
    'microsoft/vscode': '最流行的开源代码编辑器。',
    'ohmyzsh/ohmyzsh': 'Zsh 配置框架，终端颜值与效率一起提升。',
    'neovim/neovim': '现代化的 Vim，Lua 配置、内置 LSP。',
    'microsoft/terminal': 'Windows 现代终端，支持标签页与多 Shell。',
    'microsoft/PowerToys': 'Windows 效率工具集：窗口管理、批量重命名、取色等。',
    'puppeteer/puppeteer': 'Node 驱动 Chrome 的自动化工具。',
    'microsoft/playwright': '跨浏览器端到端测试框架。',
    'hoppscotch/hoppscotch': '开源的 Postman 替代品，在线调试 API。',
    'n8n-io/n8n': '可自托管的可视化工作流自动化工具。',
    'electron/electron': '用 Web 技术写跨平台桌面应用。',
    'localsend/localsend': '局域网跨设备传文件，开源的 AirDrop 替代。',
    'dani-garcia/vaultwarden': '轻量自托管密码管理器，兼容 Bitwarden 客户端。',
    'torvalds/linux': 'Linux 内核源码。',
    'rust-lang/rust': '兼顾安全与性能的系统级语言。',
    'home-assistant/core': '开源智能家居中枢，接入上千种设备。',
    'ruanyf/weekly': '科技爱好者周刊，每周分享技术资讯与工具。',
    'yt-dlp/yt-dlp': '功能强大的命令行视频下载工具，支持上千站点。',
    'nvm-sh/nvm': 'Node 版本管理工具。',
    'junegunn/fzf': '命令行模糊搜索，文件与历史命令都能秒找。',
    'BurntSushi/ripgrep': '超快的文本搜索工具，grep 的现代替代。',
    'jesseduffield/lazygit': '终端里的 Git 图形界面，提交与变基都变简单。',
    'tauri-apps/tauri': '用 Rust + Web 技术构建体积更小的桌面应用。',
  };

  function lookupZh(fullName) {
    if (!fullName) return '';
    if (ZH_DICT[fullName]) return ZH_DICT[fullName];
    var lower = fullName.toLowerCase();
    var keys = Object.keys(ZH_DICT);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].toLowerCase() === lower) return ZH_DICT[keys[i]];
    }
    return '';
  }

  /* ------------------------------ 导出 ------------------------------ */

  var api = {
    BOARDS: BOARDS,
    CATEGORIES: CATEGORIES,
    SORTS: SORTS,
    ZH_DICT: ZH_DICT,
    getBoard: getBoard,
    getCategory: getCategory,
    classify: classify,
    toRepo: toRepo,
    webUrl: webUrl,
    buildQuery: buildQuery,
    buildSearchPath: buildSearchPath,
    filterRepos: filterRepos,
    sortRepos: sortRepos,
    formatStars: formatStars,
    formatFull: formatFull,
    formatRelative: formatRelative,
    langColor: langColor,
    lookupZh: lookupZh,
    normalizeText: normalizeText,
  };

  root.GSRCore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
