#!/usr/bin/env node
/**
 * 导入历史数据到数据库
 */

import fs from 'fs/promises';
import path from 'path';
import { createArticle, createImages, getArticleByDate, deleteArticle } from './server/db.js';

const OUTPUT_DIR = './output';

async function importHistory() {
  console.log('📂 导入历史数据...\n');
  
  const dirs = await fs.readdir(OUTPUT_DIR);
  const dateDirs = dirs.filter(d => d.startsWith('2026年'));
  
  for (const dateDir of dateDirs) {
    const fullPath = path.join(OUTPUT_DIR, dateDir);
    
    // 检查是否有必要文件
    const htmlPath = path.join(fullPath, '完整版.html');
    const textPath = path.join(fullPath, '新闻内容.txt');
    const imagesJsonPath = path.join(fullPath, 'images.json');
    
    try {
      await fs.access(htmlPath);
    } catch {
      console.log(`  ⚠ ${dateDir}: 缺少完整版.html，跳过`);
      continue;
    }
    
    console.log(`📝 处理: ${dateDir}`);
    
    // 检查是否已存在
    const existing = getArticleByDate(dateDir);
    if (existing) {
      console.log(`  ⚠ 已存在 (ID: ${existing.id})，跳过`);
      continue;
    }
    
    // 读取内容
    const text = await fs.readFile(textPath, 'utf-8').catch(() => '');
    const imagesJson = await fs.readFile(imagesJsonPath, 'utf-8').catch(() => '[]');
    const images = JSON.parse(imagesJson);
    
    // 提取日期信息
    const match = dateDir.match(/(\d+)年(\d+)月(\d+)日/);
    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekdayStr = match ? weekday[new Date(+match[1], +match[2] - 1, +match[3]).getDay()] : '';
    
    // 创建文章
    const articleId = createArticle({
      date: dateDir,
      title: `${dateDir}（${weekdayStr}）三分钟信息早餐`,
      content: text,
      html_path: htmlPath,
      text_path: textPath,
      source_url: null
    });
    console.log(`  ✓ 文章入库 (ID: ${articleId})`);
    
    // 创建图片
    if (images.length > 0) {
      const imageRecords = images.map(img => ({
        article_id: articleId,
        filename: img.filename,
        original_url: img.originalUrl || img.original_url,
        hash: img.hash,
        size_kb: img.sizeKB || img.size_kb,
        local_path: path.join(fullPath, 'images', img.filename)
      }));
      createImages(imageRecords);
      console.log(`  ✓ 图片入库 (${images.length} 张)`);
    }
  }
  
  console.log('\n✅ 导入完成！');
}

importHistory().catch(console.error);