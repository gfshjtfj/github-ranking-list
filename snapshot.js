/**
 * snapshot.js —— 内置离线快照（联网失败时兜底）
 *
 * 说明：星标数是整理时的近似值（页面会用「≈」标出），只用于断网时也能把界面跑起来。
 * 想更新这份数据：联网状态下点页面上的「更新」即可，不需要改这个文件。
 * 字段：n=仓库全名  s=星标  f=分叉  l=语言  t=话题  d=中文简介  c=分类
 */
window.GSR_SNAPSHOT = {
  updated: '2026-10-24',
  note: '内置离线快照，星标为整理时的近似值',
  repos: [
    /* ---------- 学习资源 ---------- */
    { n: 'freeCodeCamp/freeCodeCamp', s: 408000, f: 39200, l: 'TypeScript', t: ['education', 'learn-to-code', 'nonprofit'], c: 'learn', d: '免费学编程的公益项目，课程覆盖前端、后端到数据科学。' },
    { n: 'EbookFoundation/free-programming-books', s: 345000, f: 62000, l: '', t: ['books', 'education', 'list'], c: 'learn', d: '多语言免费编程书籍与课程索引。' },
    { n: 'sindresorhus/awesome', s: 340000, f: 27800, l: '', t: ['awesome', 'lists', 'resources'], c: 'learn', d: '各种「Awesome 清单」的总入口，找资源先来这里。' },
    { n: 'public-apis/public-apis', s: 330000, f: 35800, l: 'Python', t: ['api', 'public-apis', 'free'], c: 'learn', d: '免费公开 API 合集，做练手项目必备。' },
    { n: 'codecrafters-io/build-your-own-x', s: 320000, f: 29800, l: 'Markdown', t: ['tutorial', 'programming', 'learning'], c: 'learn', d: '从零手写 Docker、Git、Redis 等经典技术，最扎实的进阶方式。' },
    { n: 'jwasham/coding-interview-university', s: 315000, f: 76000, l: '', t: ['interview', 'computer-science', 'study-plan'], c: 'learn', d: '从零准备软件工程师面试的完整学习计划。' },
    { n: 'kamranahmedse/developer-roadmap', s: 300000, f: 39400, l: 'TypeScript', t: ['roadmap', 'learning', 'career'], c: 'learn', d: '前端、后端、DevOps 的学习路线图，规划路径的好帮手。' },
    { n: 'donnemartin/system-design-primer', s: 285000, f: 46800, l: 'Python', t: ['system-design', 'interview', 'architecture'], c: 'learn', d: '系统设计入门与面试题，大厂面试常备。' },
    { n: '996icu/996.ICU', s: 270000, f: 21500, l: '', t: ['work-life-balance', '996'], c: 'learn', d: '「工作 996，生病 ICU」——程序员加班文化的社会议题仓库。' },
    { n: 'vinta/awesome-python', s: 235000, f: 25700, l: 'Python', t: ['python', 'awesome', 'resources'], c: 'learn', d: 'Python 生态资源大全：库、框架、工具一网打尽。' },
    { n: 'ruanyf/weekly', s: 70000, f: 2900, l: '', t: ['weekly', 'newsletter', 'tech'], c: 'learn', d: '科技爱好者周刊，每周分享技术资讯与工具。' },

    /* ---------- AI / 大模型 ---------- */
    { n: 'tensorflow/tensorflow', s: 190000, f: 74600, l: 'C++', t: ['machine-learning', 'deep-learning', 'neural-network'], c: 'ai', d: 'Google 的深度学习框架，工业界部署生态最完整。' },
    { n: 'Significant-Gravitas/AutoGPT', s: 170000, f: 44200, l: 'Python', t: ['agent', 'automation', 'gpt'], c: 'ai', d: '最早走红的自主 AI 智能体实验项目。' },
    { n: 'AUTOMATIC1111/stable-diffusion-webui', s: 145000, f: 27000, l: 'Python', t: ['stable-diffusion', 'image-generation'], c: 'ai', d: '最流行的 Stable Diffusion 网页界面，插件生态丰富。' },
    { n: 'huggingface/transformers', s: 145000, f: 29100, l: 'Python', t: ['nlp', 'llm', 'pretrained-models'], c: 'ai', d: '预训练模型统一接口，几行代码调用主流大模型。' },
    { n: 'ollama/ollama', s: 105000, f: 8400, l: 'Go', t: ['llm', 'local', 'inference'], c: 'ai', d: '一行命令在本机跑 Llama、Qwen 等开源大模型。' },
    { n: 'langchain-ai/langchain', s: 100000, f: 16200, l: 'Python', t: ['llm', 'agent', 'rag'], c: 'ai', d: '构建大模型应用的框架：链式编排、工具调用、RAG 都支持。' },
    { n: 'deepseek-ai/DeepSeek-V3', s: 95000, f: 12400, l: 'Python', t: ['llm', 'moe', 'llm-inference'], c: 'ai', d: '671B 参数 MoE 大模型，开源权重、性价比极高。' },
    { n: 'deepseek-ai/DeepSeek-R1', s: 90000, f: 11800, l: 'Python', t: ['llm', 'reasoning', 'reinforcement-learning'], c: 'ai', d: 'DeepSeek 开源推理模型，用强化学习练出长链思考能力。' },
    { n: 'pytorch/pytorch', s: 88000, f: 23700, l: 'Python', t: ['deep-learning', 'gpu', 'tensor'], c: 'ai', d: '研究者首选的深度学习框架，动态图易调试、GPU 支持好。' },
    { n: 'openai/whisper', s: 80000, f: 9800, l: 'Python', t: ['speech-recognition', 'transcription', 'multilingual'], c: 'ai', d: 'OpenAI 开源语音识别模型，多语言转写效果好。' },
    { n: 'ggerganov/llama.cpp', s: 72000, f: 10300, l: 'C++', t: ['llm', 'inference', 'quantization'], c: 'ai', d: '纯 C/C++ 的推理引擎，CPU 也能跑量化大模型。' },
    { n: 'comfyanonymous/ComfyUI', s: 68000, f: 7400, l: 'Python', t: ['stable-diffusion', 'workflow', 'image-generation'], c: 'ai', d: '节点式 AI 绘图工作流，可控性远超普通界面。' },
    { n: 'open-webui/open-webui', s: 65000, f: 7600, l: 'JavaScript', t: ['llm', 'chat', 'self-hosted'], c: 'ai', d: '自托管的类 ChatGPT 界面，可接 Ollama 与 OpenAI 兼容接口。' },
    { n: 'browser-use/browser-use', s: 65000, f: 7300, l: 'Python', t: ['agent', 'browser-automation', 'llm'], c: 'ai', d: '让 AI 直接操作浏览器完成网页任务。' },
    { n: 'All-Hands-AI/OpenHands', s: 60000, f: 7100, l: 'Python', t: ['agent', 'coding', 'sandbox'], c: 'ai', d: '开源 AI 软件工程师，在沙箱里自动写代码、跑测试。' },
    { n: 'modelcontextprotocol/servers', s: 60000, f: 5800, l: 'TypeScript', t: ['mcp', 'llm', 'tools'], c: 'ai', d: 'MCP 官方服务器合集，为 AI 接入文件、数据库等外部能力。' },
    { n: 'cline/cline', s: 50000, f: 4800, l: 'TypeScript', t: ['agent', 'vscode', 'coding'], c: 'ai', d: 'VS Code 里的自主编程智能体，能读写文件、执行命令。' },

    /* ---------- 前端 ---------- */
    { n: 'facebook/react', s: 235000, f: 48000, l: 'JavaScript', t: ['react', 'ui', 'frontend'], c: 'frontend', d: '声明式 UI 库，现代前端组件化的起点。' },
    { n: 'vuejs/vue', s: 210000, f: 33500, l: 'TypeScript', t: ['vue', 'frontend', 'framework'], c: 'frontend', d: '渐进式前端框架，上手快、中文文档友好。' },
    { n: 'twbs/bootstrap', s: 172000, f: 78800, l: 'JavaScript', t: ['css', 'responsive', 'ui'], c: 'frontend', d: '老牌响应式 UI 框架，快速搭原型最稳的选择。' },
    { n: 'vercel/next.js', s: 130000, f: 27800, l: 'JavaScript', t: ['react', 'ssr', 'framework'], c: 'frontend', d: 'React 全栈框架，服务端渲染与文件路由开箱即用。' },
    { n: 'axios/axios', s: 108000, f: 11200, l: 'JavaScript', t: ['http', 'promise', 'xhr'], c: 'frontend', d: '浏览器与 Node 通用的 HTTP 请求库。' },
    { n: 'mrdoob/three.js', s: 105000, f: 35700, l: 'JavaScript', t: ['webgl', '3d', 'graphics'], c: 'frontend', d: '浏览器 3D 渲染的标配库。' },
    { n: 'microsoft/TypeScript', s: 105000, f: 12900, l: 'TypeScript', t: ['typescript', 'language', 'compiler'], c: 'frontend', d: '给 JavaScript 加上静态类型。' },
    { n: 'tailwindlabs/tailwindcss', s: 85000, f: 4400, l: 'TypeScript', t: ['css', 'utility-first', 'design'], c: 'frontend', d: '原子化 CSS 框架，样式直接写在 class 里。' },
    { n: 'storybookjs/storybook', s: 85000, f: 9300, l: 'TypeScript', t: ['ui', 'components', 'testing'], c: 'frontend', d: '组件开发与文档工作台，隔离调试 UI。' },
    { n: 'shadcn-ui/ui', s: 80000, f: 4600, l: 'TypeScript', t: ['react', 'components', 'tailwindcss'], c: 'frontend', d: '复制即用的 React 组件集合，基于 Tailwind 与 Radix。' },
    { n: 'vitejs/vite', s: 72000, f: 6500, l: 'TypeScript', t: ['build-tool', 'frontend', 'esm'], c: 'frontend', d: '极快的现代前端构建工具，冷启动几乎无等待。' },

    /* ---------- 后端 / 服务端 ---------- */
    { n: 'golang/go', s: 125000, f: 17800, l: 'Go', t: ['golang', 'language', 'backend'], c: 'backend', d: 'Go 语言官方仓库，云原生时代的主力语言。' },
    { n: 'nodejs/node', s: 110000, f: 31200, l: 'JavaScript', t: ['runtime', 'nodejs', 'javascript'], c: 'backend', d: '服务端 JavaScript 运行时。' },
    { n: 'denoland/deno', s: 98000, f: 5400, l: 'Rust', t: ['runtime', 'typescript', 'javascript'], c: 'backend', d: '默认安全的 JS/TS 运行时，内置格式化、测试等工具。' },
    { n: 'supabase/supabase', s: 80000, f: 8200, l: 'TypeScript', t: ['postgres', 'baas', 'realtime'], c: 'backend', d: '开源版 Firebase：Postgres + 鉴权 + 存储 + 实时订阅。' },
    { n: 'fastapi/fastapi', s: 82000, f: 7100, l: 'Python', t: ['python', 'api', 'openapi'], c: 'backend', d: '高性能 Python Web 框架，自动生成 OpenAPI 文档。' },
    { n: 'django/django', s: 82000, f: 32000, l: 'Python', t: ['python', 'framework', 'orm'], c: 'backend', d: '自带后台管理与 ORM 的 Python 全栈框架。' },
    { n: 'laravel/laravel', s: 80000, f: 24200, l: 'PHP', t: ['php', 'framework', 'mvc'], c: 'backend', d: 'PHP 生态里最优雅的全栈框架。' },
    { n: 'oven-sh/bun', s: 78000, f: 3100, l: 'Zig', t: ['javascript', 'runtime', 'bundler'], c: 'backend', d: '集运行时、打包、测试于一体的超快 JS 工具链。' },
    { n: 'spring-projects/spring-boot', s: 78000, f: 40700, l: 'Java', t: ['java', 'spring', 'microservices'], c: 'backend', d: 'Java 微服务的事实标准。' },
    { n: 'expressjs/express', s: 66000, f: 16900, l: 'JavaScript', t: ['nodejs', 'http', 'framework'], c: 'backend', d: 'Node 生态最经典的极简 Web 框架。' },
    { n: 'rails/rails', s: 56000, f: 21800, l: 'Ruby', t: ['ruby', 'framework', 'mvc'], c: 'backend', d: '约定优于配置的 Ruby Web 框架。' },
    { n: 'appwrite/appwrite', s: 50000, f: 4500, l: 'TypeScript', t: ['baas', 'backend', 'self-hosted'], c: 'backend', d: '可自托管的后端即服务平台。' },

    /* ---------- 数据 / 数据库 ---------- */
    { n: 'elastic/elasticsearch', s: 71000, f: 24700, l: 'Java', t: ['search', 'analytics', 'lucene'], c: 'data', d: '分布式搜索与分析引擎。' },
    { n: 'redis/redis', s: 68000, f: 24000, l: 'C', t: ['database', 'cache', 'nosql'], c: 'data', d: '内存键值数据库，缓存与队列的常用选择。' },
    { n: 'pandas-dev/pandas', s: 45000, f: 18200, l: 'Python', t: ['data-analysis', 'dataframe', 'python'], c: 'data', d: 'Python 数据分析的事实标准。' },
    { n: 'clickhouse/clickhouse', s: 38000, f: 6900, l: 'C++', t: ['olap', 'analytics', 'database'], c: 'data', d: '列式分析数据库，亿级日志查询也能毫秒返回。' },
    { n: 'streamlit/streamlit', s: 38000, f: 3300, l: 'Python', t: ['data', 'dashboard', 'python'], c: 'data', d: '几行 Python 就能把数据脚本变成网页应用。' },
    { n: 'apache/kafka', s: 29000, f: 14000, l: 'Java', t: ['streaming', 'messaging', 'distributed'], c: 'data', d: '分布式消息与流处理平台。' },
    { n: 'mongodb/mongo', s: 27000, f: 5600, l: 'C++', t: ['database', 'nosql', 'document'], c: 'data', d: '文档型 NoSQL 数据库。' },
    { n: 'postgres/postgres', s: 18000, f: 4800, l: 'C', t: ['database', 'sql', 'relational'], c: 'data', d: '功能最全的开源关系型数据库。' },

    /* ---------- 云原生 / 运维 ---------- */
    { n: 'kubernetes/kubernetes', s: 115000, f: 40500, l: 'Go', t: ['kubernetes', 'containers', 'orchestration'], c: 'devops', d: '容器编排的事实标准。' },
    { n: 'netdata/netdata', s: 72000, f: 5900, l: 'C', t: ['monitoring', 'observability', 'performance'], c: 'devops', d: '开箱即用的实时系统监控。' },
    { n: 'moby/moby', s: 70000, f: 18700, l: 'Go', t: ['docker', 'containers', 'engine'], c: 'devops', d: 'Docker 引擎的开源上游项目。' },
    { n: 'grafana/grafana', s: 66000, f: 12100, l: 'TypeScript', t: ['monitoring', 'dashboard', 'observability'], c: 'devops', d: '可观测性看板，接 Prometheus 等数据源。' },
    { n: 'ansible/ansible', s: 65000, f: 23800, l: 'Python', t: ['automation', 'configuration-management'], c: 'devops', d: '无 Agent 的配置管理与自动化部署。' },
    { n: 'prometheus/prometheus', s: 57000, f: 9300, l: 'Go', t: ['monitoring', 'metrics', 'alerting'], c: 'devops', d: '云原生监控与告警系统。' },
    { n: 'hashicorp/terraform', s: 44000, f: 9800, l: 'Go', t: ['iac', 'infrastructure', 'cloud'], c: 'devops', d: '基础设施即代码，多云资源统一声明。' },

    /* ---------- 移动端 ---------- */
    { n: 'flutter/flutter', s: 170000, f: 28000, l: 'Dart', t: ['flutter', 'dart', 'cross-platform'], c: 'mobile', d: 'Google 的跨平台 UI 框架，一套代码跑六端。' },
    { n: 'facebook/react-native', s: 120000, f: 24500, l: 'JavaScript', t: ['react-native', 'mobile', 'ios'], c: 'mobile', d: '用 React 写原生移动应用。' },

    /* ---------- 开发工具 ---------- */
    { n: 'ohmyzsh/ohmyzsh', s: 178000, f: 26000, l: 'Shell', t: ['shell', 'zsh', 'productivity'], c: 'tools', d: 'Zsh 配置框架，终端颜值与效率一起提升。' },
    { n: 'microsoft/vscode', s: 170000, f: 31500, l: 'TypeScript', t: ['editor', 'ide', 'typescript'], c: 'tools', d: '最流行的开源代码编辑器。' },
    { n: 'electron/electron', s: 118000, f: 16000, l: 'C++', t: ['desktop', 'javascript', 'chromium'], c: 'tools', d: '用 Web 技术写跨平台桌面应用。' },
    { n: 'microsoft/PowerToys', s: 115000, f: 6800, l: 'C#', t: ['windows', 'utilities', 'productivity'], c: 'tools', d: 'Windows 效率工具集：窗口管理、批量重命名、取色等。' },
    { n: 'microsoft/terminal', s: 97000, f: 8300, l: 'C++', t: ['terminal', 'windows', 'console'], c: 'tools', d: 'Windows 现代终端，支持标签页与多 Shell。' },
    { n: 'puppeteer/puppeteer', s: 90000, f: 9100, l: 'TypeScript', t: ['automation', 'browser', 'testing'], c: 'tools', d: 'Node 驱动 Chrome 的自动化工具。' },
    { n: 'n8n-io/n8n', s: 90000, f: 12800, l: 'TypeScript', t: ['automation', 'workflow', 'self-hosted'], c: 'tools', d: '可自托管的可视化工作流自动化工具。' },
    { n: 'neovim/neovim', s: 85000, f: 5800, l: 'Vim Script', t: ['vim', 'editor', 'lua'], c: 'tools', d: '现代化的 Vim，Lua 配置、内置 LSP。' },
    { n: 'microsoft/playwright', s: 72000, f: 4200, l: 'TypeScript', t: ['testing', 'e2e', 'browser'], c: 'tools', d: '跨浏览器端到端测试框架。' },
    { n: 'hoppscotch/hoppscotch', s: 72000, f: 4900, l: 'TypeScript', t: ['api', 'testing', 'rest'], c: 'tools', d: '开源的 Postman 替代品，在线调试 API。' },
    { n: 'localsend/localsend', s: 68000, f: 3500, l: 'Dart', t: ['file-transfer', 'cross-platform', 'lan'], c: 'tools', d: '局域网跨设备传文件，开源的 AirDrop 替代。' },
    { n: 'rustdesk/rustdesk', s: 80000, f: 9400, l: 'Rust', t: ['remote-desktop', 'self-hosted', 'rust'], c: 'tools', d: '开源自托管远程桌面，TeamViewer 的替代品。' },
    { n: 'tauri-apps/tauri', s: 85000, f: 2500, l: 'Rust', t: ['desktop', 'rust', 'webview'], c: 'tools', d: '用 Rust + Web 技术构建体积更小的桌面应用。' },
    { n: 'junegunn/fzf', s: 65000, f: 2400, l: 'Go', t: ['cli', 'fuzzy-search', 'productivity'], c: 'tools', d: '命令行模糊搜索，文件与历史命令都能秒找。' },
    { n: 'BurntSushi/ripgrep', s: 50000, f: 2000, l: 'Rust', t: ['cli', 'search', 'grep'], c: 'tools', d: '超快的文本搜索工具，grep 的现代替代。' },
    { n: 'jesseduffield/lazygit', s: 58000, f: 2000, l: 'Go', t: ['git', 'cli', 'terminal-ui'], c: 'tools', d: '终端里的 Git 图形界面，提交与变基都变简单。' },

    /* ---------- 安全 ---------- */
    { n: 'dani-garcia/vaultwarden', s: 46000, f: 2200, l: 'Rust', t: ['password-manager', 'bitwarden', 'self-hosted'], c: 'security', d: '轻量自托管密码管理器，兼容 Bitwarden 客户端。' },

    /* ---------- 系统 / 底层 ---------- */
    { n: 'torvalds/linux', s: 195000, f: 55000, l: 'C', t: ['kernel', 'operating-system', 'linux'], c: 'system', d: 'Linux 内核源码。' },
    { n: 'rust-lang/rust', s: 102000, f: 13000, l: 'Rust', t: ['rust', 'language', 'compiler'], c: 'system', d: '兼顾安全与性能的系统级语言。' },

    /* ---------- 其他 ---------- */
    { n: 'home-assistant/core', s: 78000, f: 33000, l: 'Python', t: ['home-automation', 'iot', 'smarthome'], c: 'other', d: '开源智能家居中枢，接入上千种设备。' },
    { n: 'yt-dlp/yt-dlp', s: 110000, f: 8600, l: 'Python', t: ['youtube-dl', 'cli', 'downloader'], c: 'tools', d: '功能强大的命令行视频下载工具，支持上千站点。' },
    { n: 'nvm-sh/nvm', s: 82000, f: 8100, l: 'Shell', t: ['node', 'version-manager', 'shell'], c: 'tools', d: 'Node 版本管理工具。' },
  ],
};
