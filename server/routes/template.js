/**
 * 模板配置路由
 */

import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();
const CONFIG_PATH = path.join(process.cwd(), 'output/common/config.json');
const RULES_PATH = path.join(process.cwd(), 'config/template_config.json');

// 获取模板素材配置
router.get('/', async (req, res) => {
  try {
    const config = await fs.readFile(CONFIG_PATH, 'utf-8');
    res.json({ success: true, data: JSON.parse(config) });
  } catch (error) {
    res.json({ success: true, data: { templateAssets: {} } });
  }
});

// 更新模板素材配置
router.put('/', async (req, res) => {
  try {
    const config = req.body;
    await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
    
    let existing = { templateAssets: {} };
    try {
      const data = await fs.readFile(CONFIG_PATH, 'utf-8');
      existing = JSON.parse(data);
    } catch {}
    
    const merged = {
      ...existing,
      templateAssets: {
        ...existing.templateAssets,
        ...config.templateAssets
      }
    };
    
    await fs.writeFile(CONFIG_PATH, JSON.stringify(merged, null, 2), 'utf-8');
    res.json({ success: true, message: '素材配置已保存' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// 获取完整模板规则配置
router.get('/rules', async (req, res) => {
  try {
    const rules = await fs.readFile(RULES_PATH, 'utf-8');
    res.json({ success: true, data: JSON.parse(rules) });
  } catch (error) {
    res.json({ success: true, data: { 
      version: "1.0",
      templateAssets: {},
      imageFilter: {},
      textFilter: {},
      autoPublish: { enabled: false }
    } });
  }
});

// 更新完整模板规则配置
router.put('/rules', async (req, res) => {
  try {
    const rules = req.body;
    await fs.mkdir(path.dirname(RULES_PATH), { recursive: true });
    
    // 验证必要字段
    if (!rules.version || !rules.name) {
      return res.json({ success: false, error: '缺少必要字段: version, name' });
    }
    
    await fs.writeFile(RULES_PATH, JSON.stringify(rules, null, 2), 'utf-8');
    res.json({ success: true, message: '规则配置已保存' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

export default router;