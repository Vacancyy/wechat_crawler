/**
 * 爬虫任务路由 - 增强版
 */

import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { getArticleByDate, getArticleCount, getImageCount } from '../db.js';

const router = express.Router();

// 爬虫状态（内存存储）
let crawlerStatus = {
  running: false,
  lastRun: null,
  lastDate: null,
  message: null
};

// 启动爬虫任务
router.post('/run', async (req, res) => {
  try {
    if (crawlerStatus.running) {
      return res.json({ 
        success: false, 
        error: '爬虫正在运行中，请等待完成'
      });
    }
    
    const { date } = req.body; // 可选：指定日期
    
    crawlerStatus.running = true;
    crawlerStatus.lastDate = date || 'today';
    crawlerStatus.message = '启动中...';
    
    const scriptPath = path.join(process.cwd(), 'fetch_news.mjs');
    const args = date ? [date] : [];
    
    // 启动爬虫并收集输出
    const child = spawn('node', [scriptPath, ...args], {
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    let output = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
      // 更新消息（取最后一行）
      const lines = output.split('\n').filter(l => l.trim());
      if (lines.length > 0) {
        crawlerStatus.message = lines[lines.length - 1];
      }
    });
    
    child.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('close', (code) => {
      crawlerStatus.running = false;
      crawlerStatus.lastRun = new Date().toISOString();
      crawlerStatus.message = code === 0 ? '完成' : `失败 (code: ${code})`;
    });
    
    res.json({ 
      success: true, 
      message: '爬虫任务已启动',
      date: date || 'today'
    });
  } catch (error) {
    crawlerStatus.running = false;
    res.json({ success: false, error: error.message });
  }
});

// 获取爬虫状态
router.get('/status', (req, res) => {
  res.json({ 
    success: true, 
    status: crawlerStatus
  });
});

// 获取统计信息
router.get('/stats', (req, res) => {
  try {
    const articleCount = getArticleCount();
    const imageCount = getImageCount();
    
    // 获取今天是否有文章
    const today = new Date();
    const todayStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
    const todayArticle = getArticleByDate(todayStr);
    
    res.json({
      success: true,
      data: {
        totalArticles: articleCount,
        totalImages: imageCount,
        todayArticle: todayArticle ? {
          id: todayArticle.id,
          date: todayArticle.date,
          hasHtml: !!todayArticle.html_path
        } : null,
        crawlerRunning: crawlerStatus.running
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

export default router;