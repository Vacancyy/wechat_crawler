/**
 * 文章管理路由 - 使用数据库
 */

import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { 
  getArticles, 
  getArticleByDate, 
  getArticleCount,
  getImagesByArticle,
  deleteArticle 
} from '../db.js';

const router = express.Router();
const OUTPUT_DIR = path.join(process.cwd(), 'output');

// 获取文章列表（从数据库）
router.get('/', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const articles = getArticles(+limit, +offset);
    const total = getArticleCount();
    
    res.json({ 
      success: true, 
      data: articles,
      total,
      limit: +limit,
      offset: +offset
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// 获取单篇文章（从数据库 + 文件系统）
router.get('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    // 从数据库获取元数据
    const article = getArticleByDate(date);
    if (!article) {
      return res.status(404).json({ success: false, error: '文章不存在' });
    }
    
    // 获取关联图片
    const images = getImagesByArticle(article.id);
    
    // 读取文件内容
    let html = null;
    let text = null;
    
    if (article.html_path) {
      try {
        html = await fs.readFile(article.html_path, 'utf-8');
      } catch {}
    }
    
    if (article.text_path) {
      try {
        text = await fs.readFile(article.text_path, 'utf-8');
      } catch {}
    }
    
    res.json({ 
      success: true, 
      data: { 
        ...article,
        images,
        html,
        text
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// 保存编辑后的内容
router.put('/:date/content', async (req, res) => {
  try {
    const { date } = req.params;
    const { text, html } = req.body;
    
    const article = getArticleByDate(date);
    if (!article) {
      return res.status(404).json({ success: false, error: '文章不存在' });
    }
    
    const dir = path.join(OUTPUT_DIR, date);
    
    // 保存文本内容
    if (text && article.text_path) {
      await fs.writeFile(article.text_path, text, 'utf-8');
    }
    
    // 保存 HTML 内容
    if (html && article.html_path) {
      await fs.writeFile(article.html_path, html, 'utf-8');
    }
    
    res.json({ success: true, message: '内容已保存' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// 删除文章
router.delete('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const article = getArticleByDate(date);
    
    if (!article) {
      return res.status(404).json({ success: false, error: '文章不存在' });
    }
    
    const deleted = deleteArticle(article.id);
    
    if (deleted) {
      // 同时删除文件目录
      const dir = path.join(OUTPUT_DIR, date);
      await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
      
      res.json({ success: true, message: '文章已删除' });
    } else {
      res.json({ success: false, error: '删除失败' });
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

export default router;