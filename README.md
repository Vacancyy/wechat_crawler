# 公众号运营系统

自动爬取「冯站长之家」新闻，替换广告，生成完整 HTML 页面，支持后台管理。

## 📁 项目结构

```
wechat-crawler/
├── admin/                    # 管理端
│   ├── index.html           # 入口页面
│   └── src/
│       ├── main.js          # 入口脚本
│       ├── App.js           # 主应用
│       ├── styles.css       # 全局样式
│       ├── components/      # 组件
│       │   ├── Sidebar.js   # 侧边栏
│       │   └── Header.js    # 头部
│       └── pages/           # 页面
│           └── Dashboard.js # 仪表盘
│
├── server/                   # 服务端
│   ├── index.js             # 入口
│   └── routes/              # API 路由
│       ├── articles.js      # 文章管理
│       ├── ads.js           # 广告管理
│       └── crawler.js       # 爬虫任务
│
├── config/                   # 配置
│   └── ad_config.json       # 广告配置
│
├── templates/                # 模板
│   └── news_template.html   # 新闻模板
│
├── output/                   # 输出
│   └── 2026年4月8日/
│       ├── 完整版.html
│       └── images/
│
├── data/                     # 数据库（待实现）
│
├── fetch_news.mjs            # 爬虫脚本
├── package.json
└── README.md
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动管理后台

```bash
# 启动服务端
node server/index.js

# 访问管理后台
open http://localhost:3000
```

### 3. 启动爬虫

**方式一：命令行**
```bash
# 爬取今天的新闻
node fetch_news.mjs

# 爬取指定日期
node fetch_news.mjs 2026-04-06
```

**方式二：管理后台**
- 打开 http://localhost:3000
- 点击「立即爬取」按钮

### 4. 前提条件

Chrome 浏览器已开启 CDP：
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=18800
```

## 🎯 功能模块

| 模块 | 状态 | 说明 |
|------|------|------|
| 爬虫 | ✅ 已完成 | 自动爬取、下载图片 |
| 模板 | ✅ 已完成 | HTML模板、占位符替换 |
| 广告配置 | ✅ 已完成 | JSON配置、运行时替换 |
| 管理后台 | 🔄 开发中 | React/Vue 界面 |
| 数据存储 | 📋 计划中 | SQLite 持久化 |
| 自动发布 | 📋 计划中 | 定时发布到公众号 |

## 📡 API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/articles` | GET | 文章列表 |
| `/api/articles/:date` | GET | 单篇文章 |
| `/api/crawler/run` | POST | 启动爬虫 |
| `/api/crawler/status` | GET | 爬虫状态 |
| `/api/ads` | GET | 广告配置 |
| `/api/ads` | PUT | 更新广告 |

## ✏️ 修改广告

编辑 `config/ad_config.json`：

```json
{
  "ads": {
    "top": {
      "product_name": "📱 你的商品",
      "features": ["特点1", "特点2"],
      "price": "999",
      "buy_link": "https://..."
    }
  }
}
```

## 🔧 开发计划

- [ ] 完善管理后台界面
- [ ] 实现 SQLite 数据存储
- [ ] 图片处理（压缩、去水印）
- [ ] 自动发布到公众号
- [ ] AI 图片生成

---

*最后更新: 2026-04-08*