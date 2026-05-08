/**
 * 标题图片管理路由
 */

import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();
const CONFIG_PATH = path.join(process.cwd(), 'output/common/title_images.json');
const COMMON_PATH = path.join(process.cwd(), 'output/common');

// 获取标题图片配置
router.get('/', async (req, res) => {
  try {
    const config = await fs.readFile(CONFIG_PATH, 'utf-8');
    res.json({ success: true, data: JSON.parse(config) });
  } catch (error) {
    // 返回默认配置
    res.json({ 
      success: true, 
      data: { titleImages: {} }
    });
  }
});

// 获取所有可用图片列表
router.get('/images', async (req, res) => {
  try {
    const files = await fs.readdir(COMMON_PATH);
    const images = files.filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));
    res.json({ success: true, data: images });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
});

// 新增标题图片分类
router.post('/add', async (req, res) => {
  try {
    const { letter, name, filename, enabled } = req.body;
    
    if (!letter || !name) {
      return res.json({ success: false, error: '缺少必要参数' });
    }
    
    // 读取现有配置
    let config = { titleImages: {} };
    try {
      const data = await fs.readFile(CONFIG_PATH, 'utf-8');
      config = JSON.parse(data);
    } catch {}
    
    // 添加新分类
    config.titleImages[letter] = {
      name,
      enabled: enabled !== false,
      filename: filename || null
    };
    
    // 确保目录存在
    await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    
    res.json({ success: true, message: '分类已添加', data: config.titleImages[letter] });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// 删除标题图片分类
router.delete('/:letter', async (req, res) => {
  try {
    const { letter } = req.params;
    
    // 读取现有配置
    let config = { titleImages: {} };
    try {
      const data = await fs.readFile(CONFIG_PATH, 'utf-8');
      config = JSON.parse(data);
    } catch {}
    
    // 删除分类
    if (config.titleImages[letter]) {
      delete config.titleImages[letter];
      await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
      res.json({ success: true, message: '分类已删除' });
    } else {
      res.json({ success: false, error: '分类不存在' });
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// 更新标题图片配置
router.put('/:letter', async (req, res) => {
  try {
    const { letter } = req.params;
    const { name, filename, enabled } = req.body;
    
    // 读取现有配置
    let config = { titleImages: {} };
    try {
      const data = await fs.readFile(CONFIG_PATH, 'utf-8');
      config = JSON.parse(data);
    } catch {}
    
    // 更新配置
    if (config.titleImages[letter]) {
      if (name !== undefined) config.titleImages[letter].name = name;
      if (filename !== undefined) config.titleImages[letter].filename = filename;
      if (enabled !== undefined) config.titleImages[letter].enabled = enabled;
    } else {
      // 创建新分类
      config.titleImages[letter] = {
        name: name || letter,
        enabled: enabled !== false,
        filename: filename || null
      };
    }
    
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    res.json({ success: true, message: '配置已更新' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// 批量更新顺序
router.put('/order', async (req, res) => {
  try {
    const { order } = req.body; // order: ['A', 'B', 'C', 'G', 'D', 'E', 'F']
    
    if (!order || !Array.isArray(order)) {
      return res.json({ success: false, error: '缺少顺序参数' });
    }
    
    // 读取现有配置
    let config = { titleImages: {} };
    try {
      const data = await fs.readFile(CONFIG_PATH, 'utf-8');
      config = JSON.parse(data);
    } catch {}
    
    // 重新排列
    const newTitleImages = {};
    order.forEach((letter, index) => {
      if (config.titleImages[letter]) {
        newTitleImages[letter] = config.titleImages[letter];
      }
    });
    
    // 保留未在order中的分类
    Object.keys(config.titleImages).forEach(letter => {
      if (!newTitleImages[letter]) {
        newTitleImages[letter] = config.titleImages[letter];
      }
    });
    
    config.titleImages = newTitleImages;
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    
    res.json({ success: true, message: '顺序已更新' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

export default router;