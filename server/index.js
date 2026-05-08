/**
 * 公众号运营系统 - 服务端
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { initDatabase } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 初始化数据库
initDatabase();

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' })); // 允许上传50MB以内的图片
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 静态文件
app.use(express.static(path.join(__dirname, '../admin')));
app.use('/output', express.static(path.join(__dirname, '../output')));

// API 路由
import articlesRouter from './routes/articles.js';
import crawlerRouter from './routes/crawler.js';
import adsRouter from './routes/ads.js';
import templateRouter from './routes/template.js';
import uploadRouter from './routes/upload.js';
import titleImagesRouter from './routes/title-images.js';

app.use('/api/articles', articlesRouter);
app.use('/api/crawler', crawlerRouter);
app.use('/api/ads', adsRouter);
app.use('/api/template', templateRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/title-images', titleImagesRouter);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API 文档
app.get('/api', (req, res) => {
  res.json({
    name: '公众号运营系统 API',
    version: '1.0.0',
    endpoints: [
      'GET  /api/health         - 健康检查',
      'GET  /api/articles       - 文章列表',
      'GET  /api/articles/:date - 单篇文章',
      'DELETE /api/articles/:date - 删除文章',
      'POST /api/crawler/run    - 启动爬虫',
      'GET  /api/crawler/status - 爬虫状态',
      'GET  /api/crawler/stats  - 统计信息',
      'GET  /api/ads            - 广告配置',
      'PUT  /api/ads            - 更新广告',
    ]
  });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`🚀 服务已启动: http://localhost:${PORT}`);
  console.log(`📝 API 文档: http://localhost:${PORT}/api`);
});