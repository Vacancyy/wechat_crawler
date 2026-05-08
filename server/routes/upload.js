/**
 * 文件上传路由
 */

import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();
const COMMON_DIR = path.join(process.cwd(), 'output/common');
const CONFIG_PATH = path.join(COMMON_DIR, 'config.json');
const TITLE_IMAGES_PATH = path.join(COMMON_DIR, 'title_images.json');

// 读取模板配置
async function loadConfig() {
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { templateAssets: {} };
  }
}

// 保存模板配置
async function saveConfig(config) {
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// 上传图片到通用图片库
router.post('/common', async (req, res) => {
  try {
    const { filename, imageData, usage } = req.body;
    
    if (!filename || !imageData) {
      return res.json({ success: false, error: '缺少文件名或图片数据' });
    }
    
    // 确保目录存在
    await fs.mkdir(COMMON_DIR, { recursive: true });
    
    // 解析 base64 数据
    const match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) {
      return res.json({ success: false, error: '无效的图片格式' });
    }
    
    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const buffer = Buffer.from(match[2], 'base64');
    
    // 根据用途生成文件名
    let finalFilename;
    if (usage && ['header', 'divider', 'footer', 'watermark'].includes(usage)) {
      // 保留原文件名，添加用途前缀便于识别
      const safeName = filename.replace(/[^a-zA-Z0-9\u4e00-\u9fa5._-]/g, '_');
      finalFilename = safeName.includes('.') ? safeName : `${safeName}.${ext}`;
    } else {
      const safeFilename = filename.replace(/[^a-zA-Z0-9\u4e00-\u9fa5._-]/g, '_');
      finalFilename = safeFilename.includes('.') ? safeFilename : `${safeFilename}.${ext}`;
    }
    
    const filepath = path.join(COMMON_DIR, finalFilename);
    await fs.writeFile(filepath, buffer);
    
    // 如果指定了用途，更新配置文件
    if (usage) {
      const config = await loadConfig();
      if (!config.templateAssets) {
        config.templateAssets = {};
      }
      if (!config.templateAssets[usage]) {
        config.templateAssets[usage] = { enabled: false, filename: null };
      }
      config.templateAssets[usage].filename = finalFilename;
      await saveConfig(config);
    }
    
    res.json({ 
      success: true, 
      message: '上传成功',
      filename: finalFilename,
      path: `/output/common/${finalFilename}`,
      usage: usage || null
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// 上传图片到指定日期目录
router.post('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { filename, imageData } = req.body;
    
    if (!filename || !imageData) {
      return res.json({ success: false, error: '缺少文件名或图片数据' });
    }
    
    const imagesDir = path.join(process.cwd(), 'output', date, 'images');
    await fs.mkdir(imagesDir, { recursive: true });
    
    // 解析 base64 数据
    const match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) {
      return res.json({ success: false, error: '无效的图片格式' });
    }
    
    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const buffer = Buffer.from(match[2], 'base64');
    
    const filepath = path.join(imagesDir, filename);
    await fs.writeFile(filepath, buffer);
    
    res.json({ 
      success: true, 
      message: '上传成功',
      filename,
      path: `/output/${date}/images/${filename}`
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// 列出通用图片库文件
router.get('/common/list', async (req, res) => {
  try {
    const files = await fs.readdir(COMMON_DIR).catch(() => []);
    const images = files.filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(f));
    
    const result = await Promise.all(images.map(async f => {
      const stat = await fs.stat(path.join(COMMON_DIR, f)).catch(() => ({ size: 0 }));
      return {
        filename: f,
        path: `/output/common/${f}`,
        size: stat.size
      };
    }));
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// 删除图片
router.delete('/common/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(COMMON_DIR, filename);
    
    await fs.unlink(filepath).catch(() => {});
    
    res.json({ success: true, message: '已删除' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// 获取标题图片配置
router.get('/title-images', async (req, res) => {
  try {
    const config = await fs.readFile(TITLE_IMAGES_PATH, 'utf-8');
    res.json({ success: true, data: JSON.parse(config) });
  } catch (error) {
    res.json({ success: true, data: { titleImages: {} } });
  }
});

// 更新标题图片配置
router.put('/title-images', async (req, res) => {
  try {
    const config = req.body;
    
    await fs.mkdir(COMMON_DIR, { recursive: true });
    await fs.writeFile(TITLE_IMAGES_PATH, JSON.stringify(config, null, 2), 'utf-8');
    
    res.json({ success: true, message: '标题图片配置已保存' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

export default router;