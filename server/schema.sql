-- 完整的数据库表结构设计

-- ========================================
-- 文章表
-- ========================================
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT UNIQUE NOT NULL,              -- 日期：2026年4月9日
  title TEXT,                              -- 标题
  content TEXT,                            -- 纯文本内容
  html_path TEXT,                          -- HTML 文件路径
  text_path TEXT,                          -- 文本文件路径
  source_url TEXT,                         -- 原文链接
  weekday TEXT,                            -- 星期几
  category TEXT DEFAULT 'serious',         -- 分类：serious(严肃)/casual(轻松)/gossip(花边)
  status TEXT DEFAULT 'draft',             -- 状态：draft(草稿)/published(已发布)
  sort_order INTEGER DEFAULT 0,            -- 排序权重
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 内容模块表（每条新闻/图片/广告）
-- ========================================
CREATE TABLE IF NOT EXISTS content_modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL,             -- 所属文章
  type TEXT NOT NULL,                      -- 类型：section/news/image/ad
  content TEXT,                            -- 文字内容
  image_id INTEGER,                        -- 关联图片ID（type=image时）
  sort_order INTEGER DEFAULT 0,            -- 排序
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE SET NULL
);

-- ========================================
-- 图片表
-- ========================================
CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER,                      -- 所属文章（可为空，表示未关联）
  filename TEXT NOT NULL,                  -- 文件名
  original_url TEXT,                       -- 原始URL
  local_path TEXT,                         -- 本地路径
  hash TEXT,                               -- MD5哈希（去重用）
  size_kb INTEGER,                         -- 文件大小
  width INTEGER,                           -- 宽度
  height INTEGER,                          -- 高度
  tags TEXT,                               -- 标签（JSON数组）
  ocr_text TEXT,                           -- OCR识别文字
  related_paragraph INTEGER,               -- 关联段落索引
  status TEXT DEFAULT 'active',            -- 状态：active/deleted/replaced
  replaced_by INTEGER,                     -- 被哪个图片替换
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL
);

-- ========================================
-- 广告表
-- ========================================
CREATE TABLE IF NOT EXISTS ads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  position TEXT UNIQUE NOT NULL,           -- 位置：top/bottom/middle1/middle2
  product_name TEXT,
  description TEXT,
  price TEXT,
  original_price TEXT,
  features TEXT,                           -- JSON数组
  gift TEXT,
  buy_link TEXT,
  image_url TEXT,                          -- 广告图片URL
  start_date DATE,                         -- 开始日期
  end_date DATE,                           -- 结束日期
  is_active INTEGER DEFAULT 1,             -- 是否启用
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 发布日志表
-- ========================================
CREATE TABLE IF NOT EXISTS publish_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER,
  platform TEXT,                           -- wechat/website/...
  status TEXT DEFAULT 'pending',           -- pending/success/failed
  message TEXT,
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

-- ========================================
-- 标签表
-- ========================================
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,               -- 标签名
  type TEXT DEFAULT 'news',                -- 类型：news/image
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 系统配置表
-- ========================================
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 索引
-- ========================================
CREATE INDEX IF NOT EXISTS idx_articles_date ON articles(date);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_content_modules_article ON content_modules(article_id);
CREATE INDEX IF NOT EXISTS idx_images_article ON images(article_id);
CREATE INDEX IF NOT EXISTS idx_images_hash ON images(hash);
CREATE INDEX IF NOT EXISTS idx_images_status ON images(status);
CREATE INDEX IF NOT EXISTS idx_publish_logs_article ON publish_logs(article_id);