/**
 * 广告管理路由
 */

import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();
const AD_CONFIG_PATH = path.join(process.cwd(), 'config/ad_config.json');

// 获取广告配置
router.get('/', async (req, res) => {
  try {
    const config = await fs.readFile(AD_CONFIG_PATH, 'utf-8');
    res.json({ success: true, data: JSON.parse(config) });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// 更新广告配置
router.put('/', async (req, res) => {
  try {
    const newConfig = req.body;
    
    // 保留说明字段
    const existingConfig = JSON.parse(await fs.readFile(AD_CONFIG_PATH, 'utf-8'));
    newConfig.说明 = existingConfig.说明;
    
    await fs.writeFile(AD_CONFIG_PATH, JSON.stringify(newConfig, null, 2), 'utf-8');
    res.json({ success: true, message: '广告配置已更新' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

export default router;