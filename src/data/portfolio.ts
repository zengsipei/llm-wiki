export const siteConfig = {
  name: "Developer",
  initials: "D",
  title: "9年PHP后端开发 | 成都",
  email: "your-email@example.com",
  github: "https://github.com/your-username",
  location: "成都 · 双流",
  status: "在职，对远程/新机会持开放态度",
  builtWith: "Next.js + Tailwind CSS",
  year: new Date().getFullYear(),
};

export const bio = {
  summary:
    "9年PHP后端开发经验，在成都中小型企业工作，经历过电商、ERP、CRM等多种业务场景。踏实写代码，不追新框架但保持学习，日常喜欢折腾Linux和自动化工具。",
};

export interface Skill {
  name: string;
  level: "主力" | "常用" | "了解";
}

export interface SkillGroup {
  category: string;
  skills: Skill[];
}

export const skillGroups: SkillGroup[] = [
  {
    category: "语言",
    skills: [
      { name: "PHP", level: "主力" },
      { name: "TypeScript", level: "常用" },
      { name: "Shell", level: "常用" },
      { name: "Go", level: "了解" },
    ],
  },
  {
    category: "框架",
    skills: [
      { name: "ThinkPHP", level: "主力" },
      { name: "Laravel", level: "主力" },
      { name: "Symfony", level: "常用" },
      { name: "Next.js", level: "了解" },
    ],
  },
  {
    category: "数据库",
    skills: [
      { name: "MySQL", level: "主力" },
      { name: "Redis", level: "常用" },
      { name: "MongoDB", level: "了解" },
      { name: "Elasticsearch", level: "了解" },
    ],
  },
  {
    category: "运维",
    skills: [
      { name: "Linux", level: "主力" },
      { name: "Docker", level: "常用" },
      { name: "Nginx", level: "常用" },
      { name: "CI/CD (GitLab)", level: "常用" },
    ],
  },
  {
    category: "其他",
    skills: [
      { name: "RESTful API", level: "主力" },
      { name: "支付对接", level: "常用" },
      { name: "小程序后端", level: "常用" },
      { name: "ERP开发", level: "常用" },
    ],
  },
];

export interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
  tags: string[];
}

export const experiences: Experience[] = [
  {
    company: "成都XX科技有限公司",
    role: "PHP高级开发工程师",
    period: "2020 - 至今",
    description:
      "负责公司电商系统和CRM后台维护，日均处理订单数据万级。主导支付模块重构，接入微信/支付宝双通道，对接多家第三方物流API。搭建内部API网关统一管理接口权限。",
    tags: ["PHP", "MySQL", "Redis", "Laravel", "Nginx"],
  },
  {
    company: "成都XX网络科技",
    role: "PHP中级开发工程师",
    period: "2017 - 2020",
    description:
      "参与公司ERP系统开发，负责进销存模块和财务报表功能。使用ThinkPHP框架，编写RESTful接口供小程序端调用。优化慢查询，核心接口响应时间从800ms降到200ms。",
    tags: ["PHP", "ThinkPHP", "MySQL", "微信小程序"],
  },
  {
    company: "成都XX信息技术",
    role: "PHP开发工程师",
    period: "2015 - 2017",
    description:
      "从零搭建公司官网和客户管理系统。负责服务器部署、域名配置、SSL证书申请等基础运维工作。编写Shell脚本实现自动化备份和日志轮转。",
    tags: ["PHP", "Linux", "Nginx", "Shell", "MySQL"],
  },
];

/* ─── Project types ─── */

export type DemoType = "table" | "dashboard" | "api-doc" | "screenshot" | "timeline";

export interface Highlight {
  title: string;
  description: string;
}

export interface ColumnDef {
  key: string;
  label: string;
}

export interface Project {
  slug: string;
  name: string;
  description: string;
  tags: string[];
  gradient: string;
  github?: string;

  // Detail page fields (all optional — section renders only if data exists)
  period?: string;
  role?: string;
  summary?: string;           // one-liner subtitle
  overview?: string;          // project background paragraph
  responsibilities?: string[];
  highlights?: Highlight[];

  // Demo
  demoType?: DemoType;
  demoConfig?: DemoConfig;

  note?: string;              // personal reflection (optional)
}

/* ─── Demo config types ─── */

export interface DemoConfig {
  title?: string;
  // For table type
  columns?: ColumnDef[];
  rows?: Record<string, string | number>[];
  // For dashboard type
  stats?: { label: string; value: string; trend?: string }[];
  recentLogs?: { time: string; method: string; path: string; status: number; duration: string }[];
  // For api-doc type
  endpoints?: { method: string; path: string; description: string; params?: { name: string; type: string; required?: boolean }[] }[];
  // For screenshot type
  screenshots?: string[]; // URLs or base64
  // For timeline type
  events?: { date: string; title: string; content: string }[];
}

/* ─── Mock data for demo ─── */

export const projects: Project[] = [
  {
    slug: "erp",
    name: "公司内部ERP系统",
    description:
      "基于ThinkPHP开发的进销存管理系统，包含采购、销售、库存、财务报表四大模块，支持多仓库管理和权限分级。",
    tags: ["PHP", "ThinkPHP", "MySQL"],
    gradient: "from-blue-500 to-cyan-500",
    period: "2020 - 至今",
    role: "PHP高级开发工程师",
    summary: "进销存 + 财务报表，中小制造企业的数字化核心",
    overview:
      "为一家年营收千万级的制造企业定制开发的ERP系统。系统覆盖采购管理、销售管理、库存管理和财务报表四大核心模块，支持多仓库多账套管理。系统日均处理订单流水300+，管理SKU 5000+，上线后替代了原有的Excel手工记账流程，财务月末结算效率提升约60%。",
    responsibilities: [
      "负责进销存模块的核心后端接口设计与开发",
      "设计并实现RBAC权限系统，支持5级角色和细粒度菜单权限",
      "优化财务报表SQL查询，复杂报表生成时间从8s降至200ms",
      "实现10万行Excel导入导出功能，基于队列异步处理避免超时",
      "编写数据迁移脚本，将历史3年数据从Access迁移至MySQL",
    ],
    highlights: [
      { title: "报表查询优化", description: "复杂关联查询从8s优化至200ms，提升40倍" },
      { title: "大数据量导入", description: "10万行Excel异步导入，内存占用控制在128MB以内" },
      { title: "权限系统", description: "5级RBAC，支持菜单/按钮/数据行三级权限控制" },
    ],
    demoType: "table",
    demoConfig: {
      title: "采购订单列表",
      columns: [
        { key: "id", label: "订单号" },
        { key: "supplier", label: "供应商" },
        { key: "amount", label: "金额" },
        { key: "status", label: "状态" },
        { key: "date", label: "日期" },
      ],
      rows: [
        { id: "PO-2026-0158", supplier: "华鑫五金有限公司", amount: "¥12,800", status: "已入库", date: "05-22" },
        { id: "PO-2026-0157", supplier: "鼎盛电子科技", amount: "¥5,360", status: "已入库", date: "05-21" },
        { id: "PO-2026-0156", supplier: "恒通钢材批发", amount: "¥45,200", status: "待审核", date: "05-21" },
        { id: "PO-2026-0155", supplier: "利达包装材料", amount: "¥2,100", status: "已入库", date: "05-20" },
        { id: "PO-2026-0154", supplier: "华鑫五金有限公司", amount: "¥8,750", status: "已取消", date: "05-20" },
        { id: "PO-2026-0153", supplier: "鼎盛电子科技", amount: "¥3,200", status: "待发货", date: "05-19" },
        { id: "PO-2026-0152", supplier: "恒通钢材批发", amount: "¥67,800", status: "已入库", date: "05-19" },
        { id: "PO-2026-0151", supplier: "利达包装材料", amount: "¥1,850", status: "待审核", date: "05-18" },
      ],
    },
    note: "这个项目让我深刻理解了业务逻辑和数据一致性在实际生产中的重要性，也学会了如何在性能和可维护性之间做权衡。",
  },
  {
    slug: "wechat-api",
    name: "微信小程序后端",
    description:
      "Laravel框架开发的API服务，涵盖用户认证、微信登录、支付对接、消息推送等功能，支撑日活5000+用户。",
    tags: ["Laravel", "MySQL", "Redis", "微信支付"],
    gradient: "from-emerald-500 to-teal-500",
    period: "2021 - 2023",
    role: "后端开发负责人",
    summary: "小程序全套后端服务，从登录到支付全链路覆盖",
    overview:
      "为公司核心业务小程序提供完整的后端API服务。系统包含用户认证（微信登录+手机号绑定）、商品展示、订单管理、微信支付（JSAPI+H5）、消息模板推送等模块。使用Redis做缓存和队列，日活用户5000+，日均API请求量15万次。",
    responsibilities: [
      "设计RESTful API架构，编写接口文档并对接前端联调",
      "实现微信登录、支付、退款全流程，处理异步回调",
      "基于Redis实现接口限流和热点数据缓存",
      "使用Laravel Queue异步处理订单状态变更和消息推送",
    ],
    highlights: [
      { title: "支付可靠性", description: "微信支付回调重试机制，订单状态零丢失" },
      { title: "接口性能", description: "热点接口QPS从200提升至1200，P99延迟<100ms" },
      { title: "限流保护", description: "基于Redis Token Bucket算法，防止恶意刷单" },
    ],
    demoType: "api-doc",
    demoConfig: {
      title: "核心接口文档",
      endpoints: [
        {
          method: "POST",
          path: "/api/v1/auth/login",
          description: "微信小程序登录，code换token",
          params: [
            { name: "code", type: "string", required: true },
          ],
        },
        {
          method: "GET",
          path: "/api/v1/orders",
          description: "获取订单列表，支持分页和状态筛选",
          params: [
            { name: "status", type: "string", required: false },
            { name: "page", type: "integer", required: false },
            { name: "limit", type: "integer", required: false },
          ],
        },
        {
          method: "POST",
          path: "/api/v1/pay/create",
          description: "创建微信支付预支付订单",
          params: [
            { name: "order_id", type: "string", required: true },
            { name: "pay_type", type: "string", required: true },
          ],
        },
        {
          method: "POST",
          path: "/api/v1/pay/notify",
          description: "微信支付回调通知（内部接口）",
        },
      ],
    },
  },
  {
    slug: "api-gateway",
    name: "API网关服务",
    description:
      "PHP微服务架构下的统一网关，实现接口路由、鉴权、限流、日志记录，管理20+下游服务接口。",
    tags: ["PHP", "Redis", "Docker", "Nginx"],
    gradient: "from-amber-500 to-orange-500",
    period: "2022 - 至今",
    role: "架构设计 & 开发",
    summary: "统一入口管控，20+微服务接口的流量枢纽",
    overview:
      "随着公司业务拆分为微服务架构，各服务间接口管理变得混乱。设计并实现了统一API网关，所有外部请求通过网关分发到下游服务。网关负责路由匹配、JWT鉴权、频率限制、请求日志和灰度发布。当前管理20+下游服务，日均处理请求50万次。",
    responsibilities: [
      "设计网关核心架构：路由规则引擎 + 中间件管道模式",
      "实现基于Redis的分布式限流（令牌桶算法）",
      "搭建请求日志系统，支持按服务/接口/时间维度查询",
      "编写Docker Compose部署方案，支持一键启动和水平扩展",
    ],
    highlights: [
      { title: "50万日请求", description: "网关自身延迟<5ms，对下游服务透明" },
      { title: "动态路由", description: "路由规则热更新，无需重启网关" },
      { title: "灰度发布", description: "基于权重和Header的流量分配，支持AB测试" },
    ],
    demoType: "dashboard",
    demoConfig: {
      title: "网关监控面板",
      stats: [
        { label: "今日请求", value: "523,847", trend: "+12.3%" },
        { label: "平均延迟", value: "4.2ms", trend: "-0.8ms" },
        { label: "错误率", value: "0.03%", trend: "-0.01%" },
        { label: "活跃服务", value: "23", trend: "+2" },
      ],
      recentLogs: [
        { time: "12:34:56", method: "GET", path: "/api/v1/users/profile", status: 200, duration: "3ms" },
        { time: "12:34:55", method: "POST", path: "/api/v1/orders/create", status: 201, duration: "12ms" },
        { time: "12:34:54", method: "GET", path: "/api/v1/products/list", status: 200, duration: "5ms" },
        { time: "12:34:53", method: "POST", path: "/api/v1/auth/refresh", status: 200, duration: "2ms" },
        { time: "12:34:52", method: "GET", path: "/api/v1/inventory/check", status: 200, duration: "8ms" },
        { time: "12:34:51", method: "DELETE", path: "/api/v1/cache/clear", status: 204, duration: "1ms" },
        { time: "12:34:50", method: "POST", path: "/api/v1/pay/notify", status: 200, duration: "15ms" },
        { time: "12:34:49", method: "GET", path: "/api/v1/stats/dashboard", status: 200, duration: "22ms" },
      ],
    },
  },
  {
    slug: "monitor",
    name: "运维监控面板",
    description:
      "Shell脚本 + PHP实现的服务器状态巡检工具，定时采集CPU、内存、磁盘、网络数据，异常时通过企业微信告警。",
    tags: ["Shell", "PHP", "Linux", "Crontab"],
    gradient: "from-rose-500 to-pink-500",
    period: "2019 - 2021",
    role: "独立开发",
    summary: "服务器健康巡检 + 企业微信告警，7×24守护",
    overview:
      "公司当时没有专业运维人员，服务器出问题往往是用户投诉后才知道。用Shell脚本定时采集服务器状态指标（CPU、内存、磁盘、网络IO、进程状态），数据写入MySQL，PHP提供Web面板查看历史趋势。当指标超过阈值时通过企业微信Webhook自动告警，做到问题先于用户发现。",
    responsibilities: [
      "编写Shell采集脚本，支持灵活配置监控指标和阈值",
      "搭建Web展示面板，历史数据图表展示（基于Chart.js）",
      "实现企业微信告警通知，支持告警升级（连续3次触发通知主管）",
      "编写自动清理脚本，历史数据保留90天自动归档",
    ],
    highlights: [
      { title: "主动告警", description: "90%的服务器问题在用户投诉前发现并处理" },
      { title: "轻量部署", description: "纯Shell+PHP，单机资源占用<50MB内存" },
      { title: "零成本", description: "无需商业监控软件，企业微信免费推送" },
    ],
    demoType: "dashboard",
    demoConfig: {
      title: "服务器状态",
      stats: [
        { label: "CPU 使用率", value: "23%", trend: "正常" },
        { label: "内存使用", value: "4.2 / 8 GB", trend: "正常" },
        { label: "磁盘使用", value: "67%", trend: "注意" },
        { label: "运行天数", value: "128天", trend: "" },
      ],
      recentLogs: [
        { time: "12:30:00", method: "INFO", path: "CPU采集完成", status: 200, duration: "23%" },
        { time: "12:30:00", method: "WARN", path: "磁盘使用率 > 60%", status: 200, duration: "67%" },
        { time: "12:25:00", method: "INFO", path: "内存采集完成", status: 200, duration: "52%" },
        { time: "12:20:00", method: "INFO", path: "网络IO采集完成", status: 200, duration: "正常" },
        { time: "12:15:00", method: "ERROR", path: "web-node-03 连接超时", status: 500, duration: "30s" },
      ],
    },
  },
  {
    slug: "blog",
    name: "个人技术博客",
    description:
      "记录PHP后端开发笔记和踩坑经验，包含Docker部署、数据库优化、支付对接等实战文章。",
    tags: ["Laravel", "Markdown", "Docker"],
    gradient: "from-violet-500 to-purple-500",
    period: "2018 - 至今",
    role: "独立开发",
    summary: "个人知识沉淀，70+ 篇技术实战文章",
    overview:
      "用Laravel搭建的个人博客系统，支持Markdown写作、代码高亮、标签分类和全文搜索。文章内容涵盖PHP后端开发、Docker部署、数据库优化、支付对接等实战经验。博客部署在个人服务器上，使用Docker Compose管理，Nginx反代+Let's Encrypt证书。",
    responsibilities: [
      "基于Laravel开发博客系统，支持Markdown编辑和实时预览",
      "集成全文搜索（MySQL FULLTEXT + 中文分词）",
      "Docker Compose一键部署方案",
    ],
    highlights: [
      { title: "70+ 篇文章", description: "持续更新，月均访问量2000+" },
      { title: "Docker部署", description: "一行命令完成部署，含自动SSL续期" },
    ],
    demoType: "screenshot",
    demoConfig: {
      title: "博客首页",
    },
    note: "写博客最大的收获不是流量，而是写的过程中理清了自己的思路。很多问题写完就懂了。",
  },
  {
    slug: "crm",
    name: "CRM客户管理系统",
    description:
      "客户信息管理、跟进记录、合同管理的后台系统，支持数据导出和简单统计分析。",
    tags: ["PHP", "MySQL", "Laravel", "Bootstrap"],
    gradient: "from-sky-500 to-indigo-500",
    period: "2019 - 2020",
    role: "后端开发",
    summary: "客户全生命周期管理，从线索到成单",
    overview:
      "销售团队的日常工作系统，管理客户信息、跟进记录、合同和回款。支持按销售员查看客户漏斗、转化率统计和业绩报表。系统上线后帮助销售团队将客户跟进及时率从40%提升至85%。",
    responsibilities: [
      "设计客户、线索、合同的数据模型和后端接口",
      "实现客户漏斗统计和转化率分析报表",
      "开发数据导出功能（Excel），支持自定义筛选条件",
    ],
    highlights: [
      { title: "转化率提升", description: "客户跟进及时率从40%提升至85%" },
      { title: "灵活导出", description: "支持20+筛选条件的自定义Excel导出" },
    ],
    demoType: "timeline",
    demoConfig: {
      title: "客户跟进记录",
      events: [
        { date: "05-20", title: "电话沟通", content: "客户对产品A的报价表示认可，需要内部审批流程" },
        { date: "05-18", title: "上门拜访", content: "现场演示产品功能，客户IT部门提出3个定制需求" },
        { date: "05-15", title: "发送方案", content: "邮件发送定制方案和报价单，抄送对方采购部" },
        { date: "05-10", title: "初次联系", content: "通过行业展会获取线索，添加微信并建群沟通" },
        { date: "05-08", title: "线索录入", content: "展会名片扫描录入系统，标注为A级潜在客户" },
      ],
    },
  },
];

export const navLinks = [
  { label: "首页", href: "#hero" },
  { label: "技术栈", href: "#skills" },
  { label: "经历", href: "#experience" },
  { label: "作品", href: "#projects" },
  { label: "关于", href: "#about" },
];
