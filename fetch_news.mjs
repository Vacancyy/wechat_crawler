// 微信公众号新闻爬取 - 保持原始图文结构
// 核心改进：按DOM顺序遍历，准确记录图片位置 + 数据入库

import puppeteer from 'puppeteer-core';
import fs from 'fs/promises';
import path from 'path';
import { createArticle, createImages, getArticleByDate, deleteArticle } from './server/db.js';
import { rewriteTextsBatch, detectAdsWithAI } from './rewrite.js';
import { generateAudio, embedAudioPlayer } from './generate_audio.mjs';

const CDP_PORT = 18800;
const OUTPUT_DIR = './output';
const TEMPLATE_PATH = './templates/news_template.html';
const AD_CONFIG_PATH = './config/ad_config.json';
const TEMPLATE_CONFIG_PATH = './output/common/config.json';
const TEMPLATE_RULES_PATH = './config/template_config.json'; // 模块化模板配置
const TITLE_IMAGES_CONFIG_PATH = './output/common/title_images.json';
const AUTO_CRAWL_CONFIG_PATH = './config/auto_crawl_config.json'; // 自动爬取配置

// 标题图片关键词映射 - 按A-F顺序
const TITLE_ORDER = ['A', 'B', 'C', 'D', 'E', 'F'];
const TITLE_NAMES = {
  'A': '国内',
  'B': '国际',
  'C': '财经',
  'D': '体育',
  'E': '社会',
  'F': '其他'
};
const TITLE_KEYWORDS = {
  '国内': ['国内', '国内新闻', '国内要闻', 'A'],
  '国际': ['国际', '国际新闻', '国际焦点', '国际要闻', 'B'],
  '财经': ['财经', '财经新闻', '经济', '金融', 'C'],
  '体育': ['体育', '体育新闻', '竞技', 'D'],
  '社会': ['社会', '社会新闻', '民生', 'E'],
  '其他': ['科技', '娱乐', '军事', '港澳', '台湾', '法制', 'F']
};

// 标题字母映射
const TITLE_LETTERS = {
  '国内': 'A',
  '国际': 'B',
  '财经': 'C',
  '体育': 'D',
  '社会': 'E',
  '其他': 'F'
};

// 广告模式检测 - 基于句式和特征，而非硬编码关键词
function detectAdPattern(text) {
  // 模式1: 推销句式 "推荐XXX者一定要试试"
  if (/推荐.+者.{0,5}(一定要|建议|不妨)/.test(text)) return true;
  
  // 模式2: 症状+产品推荐（列出症状后推销）
  if (/[疼痛肿痛酸麻出血敏感松动].{0,20}(一定要|建议|试试|推荐)/.test(text)) return true;
  
  // 模式3: 价格/优惠促销
  if (/(限时|特惠|优惠|折扣|抢购|秒杀|原价|现价|立减|满减|包邮)/.test(text)) return true;
  
  // 模式4: 购买引导
  if (/(点击(下方|图片|链接)|扫码(购买|咨询)|立即购买|下单|抢购热线)/.test(text)) return true;
  
  // 模式5: 连续感叹号（推销语气）
  if ((text.match(/[！!]{2,}/g) || []).length >= 2) return true;
  
  // 模式6: 夸张功效承诺
  if (/(包治|根治|药到病除|告别.+问题|一.+见效)/.test(text)) return true;
  
  // 模式7: 联系方式+推销（客服、微信、电话）
  if (/(客服|咨询|微信|电话|热线).{0,30}(购买|下单|优惠|活动)/.test(text)) return true;
  
  // 模式8: 中药/保健品推销句式
  if (/(老字号|非遗|传承|秘方|祖传).{0,20}(膏|丸|贴|茶|粉)/.test(text)) return true;
  
  // 模式9: 身体部位问题+产品推荐
  if (/(牙|眼|颈|腰|腿|膝|关节|胃|肠|肝|肾|心|血管).{0,10}(问题|不适|疼痛).{0,20}(试试|推荐|使用)/.test(text)) return true;
  
  // 模式10: 以价格结尾（¥XX 或 X元/贴）
  if (/[¥￥]\d+|元\/(贴|盒|瓶|份)|\d+元起?$/.test(text)) return true;
  
  return false;
}

// 读取模板配置（优先读取模块化配置）
async function loadTemplateConfig() {
  try {
    // 先尝试读取模块化配置
    const rulesConfig = await fs.readFile(TEMPLATE_RULES_PATH, 'utf-8');
    const rules = JSON.parse(rulesConfig);
    
    // 合并素材配置
    try {
      const assetsConfig = await fs.readFile(TEMPLATE_CONFIG_PATH, 'utf-8');
      const assets = JSON.parse(assetsConfig);
      return { ...rules, templateAssets: assets.templateAssets || rules.templateAssets };
    } catch {
      return rules;
    }
  } catch {
    // 降级读取素材配置
    try {
      const config = await fs.readFile(TEMPLATE_CONFIG_PATH, 'utf-8');
      return JSON.parse(config);
    } catch {
      return { templateAssets: {}, imageFilter: {}, textFilter: {} };
    }
  }
}

// 检测 Chrome CDP 是否运行
async function checkChromeCDP() {
  try {
    const response = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
    return response.ok;
  } catch {
    return false;
  }
}

// 检查是否已登录搜狗微信
async function checkSogouLogin(browser) {
  const page = await browser.newPage();
  await page.goto('https://weixin.sogou.com/', { waitUntil: 'networkidle2' });
  
  // 检查是否有登录按钮（未登录状态）
  const hasLoginButton = await page.evaluate(() => {
    const loginText = document.body.innerText;
    return loginText.includes('登录') && !loginText.includes('已登录');
  });
  
  await page.close();
  return !hasLoginButton;
}

// 引导用户登录搜狗
async function promptSogouLogin(browser) {
  console.log('\n⚠ 搜狗微信未登录');
  console.log('请在打开的浏览器窗口中登录搜狗微信');
  console.log('登录完成后，爬虫将自动继续...');
  
  const page = await browser.newPage();
  await page.goto('https://weixin.sogou.com/', { waitUntil: 'networkidle2' });
  
  // 等待用户登录（最多等待 5 分钟）
  for (let i = 0; i < 300; i++) {
    await new Promise(r => setTimeout(r, 1000));
    
    // 检查是否已登录
    const isLoggedIn = await page.evaluate(() => {
      const loginText = document.body.innerText;
      return !loginText.includes('登录') || loginText.includes('已登录');
    });
    
    if (isLoggedIn) {
      console.log('✅ 登录成功！');
      await page.close();
      return true;
    }
    
    if (i % 10 === 0) {
      console.log(`等待登录... (${i}s)`);
    }
  }
  
  await page.close();
  return false;
}

// 自动启动 Chrome CDP（使用专用 profile，保持登录态）
async function launchChromeCDP() {
  const { spawn } = await import('child_process');
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  // 使用专用 profile 目录（保持微信登录态）
  const userDataDir = path.join(process.env.HOME, '.openclaw', 'chrome-cdp-profile');
  
  console.log(`正在启动 Chrome CDP...`);
  console.log(`端口: ${CDP_PORT}`);
  console.log(`Profile: ${userDataDir}`);
  
  // 确保目录存在
  await fs.mkdir(userDataDir, { recursive: true });
  
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check'
  ], {
    detached: true,
    stdio: 'ignore'
  });
  
  chrome.unref(); // 让 Chrome 在后台运行
  
  // 等待 Chrome 启动
  console.log(`等待 Chrome 启动...`);
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 1000));
    if (await checkChromeCDP()) {
      console.log(`✅ Chrome 已启动 (${i + 1}s)`);
      // 重新连接
      try {
        const browser = await puppeteer.connect({
          browserURL: `http://127.0.0.1:${CDP_PORT}`,
          defaultViewport: null
        });
        return browser;
      } catch {
        continue;
      }
    }
  }
  
  console.log(`❌ Chrome 启动超时`);
  return null;
}

// 读取标题图片配置
async function loadTitleImagesConfig() {
  try {
    const config = await fs.readFile(TITLE_IMAGES_CONFIG_PATH, 'utf-8');
    return JSON.parse(config);
  } catch {
    return { titleImages: {} };
  }
}

// 保存成功爬取的 URL（用于 fallback）
async function saveSuccessUrl(url, dateStr) {
  try {
    const configPath = AUTO_CRAWL_CONFIG_PATH;
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    
    let config = {};
    try {
      const data = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(data);
    } catch {}
    
    config.fallback = {
      enabled: true,
      lastSuccessUrl: url,
      lastSuccessDate: dateStr,
      updatedAt: new Date().toISOString()
    };
    
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log(`💾 已保存成功 URL 到配置`);
  } catch (e) {
    console.log(`⚠ 保存 URL 失败: ${e.message}`);
  }
}

// 读取自动爬取配置
async function loadAutoCrawlConfig() {
  try {
    const data = await fs.readFile(AUTO_CRAWL_CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { fallback: { enabled: false, lastSuccessUrl: null } };
  }
}

// 检测是否是扁平图片（标题图片特征）
function isFlatImage(width, height) {
  // 标题图片通常宽度大于高度（比例 > 2:1）
  if (!width || !height) return false;
  const ratio = width / height;
  return ratio > 2 && width > 300;
}

// 从 buffer 解析图片尺寸（根据实际内容判断格式）
function getImageSizeFromBuffer(buffer) {
  try {
    // 根据文件头判断格式
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      // PNG: IHDR chunk 在第 8-24 字节
      // [16-20]: width (4 bytes), [20-24]: height (4 bytes)
      if (buffer.length >= 24) {
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        if (width > 0 && height > 0) return { width, height };
      }
    } else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      // GIF: GIF89a 或 GIF87a
      // [6-8]: width (2 bytes little-endian), [8-10]: height (2 bytes little-endian)
      if (buffer.length >= 10) {
        const width = buffer.readUInt16LE(6);
        const height = buffer.readUInt16LE(8);
        if (width > 0 && height > 0) return { width, height };
      }
    } else if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      // JPEG: 需要解析 SOF marker
      let offset = 2; // 跳过 SOI marker (FF D8)
      while (offset < buffer.length - 8) {
        if (buffer[offset] !== 0xFF) {
          offset++;
          continue;
        }
        const marker = buffer[offset + 1];
        
        // SOF markers: FFC0, FFC1, FFC2, FFC3, FFC5, FFC6, FFC7, FFC9, FFCA, FFCB, FFCD, FFCE, FFCF
        if ((marker >= 0xC0 && marker <= 0xCF) && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          if (width > 0 && height > 0) return { width, height };
        }
        
        // 跳过其他 markers
        if (marker === 0xD8 || marker === 0xD9) {
          offset += 2;
        } else if (marker >= 0xD0 && marker <= 0xD7) {
          offset += 2;
        } else {
          const segLen = buffer.readUInt16BE(offset + 2);
          offset += 2 + segLen;
        }
      }
    }
  } catch (e) {
    // 解析失败，返回 0
  }
  return { width: 0, height: 0 };
}

// 根据图片位置判断标题字母（A-F顺序）
function getTitleLetterByPosition(position, totalTitles) {
  // 按顺序分配：第1个标题=A（国内），第2个=B（国际），依此类推
  if (position <= 5) {
    return TITLE_ORDER[position - 1]; // 国内、国际、财经、体育、社会
  }
  return '其他'; // 第6个及以后
}

// 根据前后文判断可能是什么标题
function guessTitleType(width, height, prevText) {
  if (!isFlatImage(width, height)) return null;
  
  // 检查前文是否包含标题关键词，返回对应字母
  for (const [title, keywords] of Object.entries(TITLE_KEYWORDS)) {
    if (keywords.some(k => prevText?.includes(k))) {
      return TITLE_LETTERS[title] || title;
    }
  }
  
  // 如果无法判断，返回null（后续按位置分配）
  return null;
}

// 生成模板素材HTML
// 获取指定章节的副标题图片 HTML
function getSubtitleHTML(config, chapterLetter) {
  const assets = config.templateAssets || {};
  
  // 使用新的 subtitle 配置结构
  if (assets.subtitle?.enabled && assets.subtitle?.subtitles?.[chapterLetter]?.enabled) {
    const filename = assets.subtitle.subtitles[chapterLetter].filename;
    if (filename) {
      return `<div class="title-image">\n              <img src="../common/${filename}" alt="${chapterLetter}" class="section-title-img">\n            </div>\n`;
    }
  }
  
  // 兼容旧配置（divider）
  if (assets.divider?.enabled && assets.divider.filenames?.length > 0) {
    const filenames = assets.divider.filenames;
    const chapterIndex = TITLE_ORDER.indexOf(chapterLetter);
    const filename = filenames[chapterIndex % filenames.length];
    return `<div class="section-divider">\n              <img src="../common/${filename}" alt="分割线" class="template-divider">\n            </div>\n`;
  }
  
  return '';
}

function generateTemplateAssetsHTML(config) {
  const assets = config.templateAssets || {};
  const html = { header: '', footer: '' };
  
  // 头部背景
  if (assets.header?.enabled && assets.header.filename) {
    html.header = `<div class="section-divider">\n              <img src="../common/${assets.header.filename}" alt="头部背景" class="template-header">\n            </div>\n`;
  }
  
  // 底部Logo
  if (assets.footer?.enabled && assets.footer.filename) {
    html.footer = `<div class="section-divider">\n              <img src="../common/${assets.footer.filename}" alt="底部Logo" class="template-footer">\n            </div>\n`;
  }
  
  return html;
}

function parseDate(dateStr) {
  const d = dateStr 
    ? new Date(...dateStr.split('-').map((v, i) => i === 1 ? v - 1 : +v))
    : new Date();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return {
    dateStr: `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`,
    folderName: `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`,
    weekday: weekdays[d.getDay()]
  };
}

function generateAdHTML(ad) {
  if (!ad) return '';
  return `
            <div class="promo-card">
                <div class="product-name">${ad.product_name}</div>
                ${ad.description ? `<p class="product-desc">${ad.description}</p>` : ''}
                <ul class="product-features">
                    ${ad.features.map(f => `<li>${f}</li>`).join('\n                    ')}
                </ul>
                <div class="price">¥${ad.price} <span class="original">¥${ad.original_price}</span></div>
                ${ad.gift ? `<p class="gift">${ad.gift}</p>` : ''}
                <a href="${ad.buy_link}" class="buy-btn">立即购买 →</a>
            </div>`;
}

async function main() {
  // 支持三种方式：
  // 1. 自动模式：node fetch_news.mjs --auto（自动搜索当天早餐新闻）
  // 2. 直接 URL：node fetch_news.mjs --url 'https://...' --date=2026-04-13
  // 3. 指定日期：node fetch_news.mjs --date 2026-04-13（搜索当天）
  const allArgs = process.argv.slice(2);
  
  // 解析参数
  const isAuto = allArgs.includes('--auto');
  const urlArg = allArgs.find(a => a === '--url') ? allArgs[allArgs.indexOf('--url') + 1] : null;
  const dateArg = allArgs.find(a => a.startsWith('--date='));
  const dateValue = dateArg ? dateArg.replace('--date=', '') : 
                    (allArgs.includes('--date') && allArgs[allArgs.indexOf('--date') + 1]?.match(/^\d{4}-\d{1,2}-\d{1,2}$/)) 
                    ? allArgs[allArgs.indexOf('--date') + 1] : null;
  
  let dateInfo = dateValue ? parseDate(dateValue) : parseDate(null); // 默认今天
  let articleUrl = urlArg;
  
  // 检查 Chrome CDP 是否运行
  let browser;
  try {
    browser = await puppeteer.connect({
      browserURL: `http://127.0.0.1:${CDP_PORT}`,
      defaultViewport: null
    });
  } catch (e) {
    console.log(`⚠ Chrome CDP 未运行，尝试自动启动...`);
    browser = await launchChromeCDP();
    if (!browser) {
      console.log(`❌ 无法启动 Chrome CDP，请手动运行：`);
      console.log(`/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=${CDP_PORT} --user-data-dir=~/.openclaw/chrome-cdp-profile`);
      return;
    }
    console.log(`✅ Chrome CDP 已启动`);
  }
  
  // 检查搜狗登录状态（自动模式需要）
  if (isAuto && !articleUrl) {
    const isLoggedIn = await checkSogouLogin(browser);
    if (!isLoggedIn) {
      const loginSuccess = await promptSogouLogin(browser);
      if (!loginSuccess) {
        console.log('❌ 登录超时，请稍后重试');
        browser.disconnect();
        return;
      }
    }
  }
  
  // 显示运行模式
  if (isAuto) {
    console.log(`🤖 自动爬取模式`);
    console.log(`📅 目标日期: ${dateInfo.dateStr} ${dateInfo.weekday}`);
    console.log(`📋 目标文章: 三分钟信息早餐`);
  } else if (articleUrl) {
    console.log(`🔗 直接爬取模式`);
    console.log(`📅 目标日期: ${dateInfo.dateStr} ${dateInfo.weekday}`);
  } else {
    console.log(`📅 搜索模式: ${dateInfo.dateStr} ${dateInfo.weekday}`);
  }
  
  const template = await fs.readFile(TEMPLATE_PATH, 'utf-8');
  const adConfig = JSON.parse(await fs.readFile(AD_CONFIG_PATH, 'utf-8'));
  const templateConfig = await loadTemplateConfig();
  const templateAssets = generateTemplateAssetsHTML(templateConfig);
  
  let targetLink = articleUrl;
  
  // 如果没有直接提供 URL，则搜索
  if (!targetLink) {
    const searchPage = await browser.newPage();
    console.log(`🌐 搜索文章...`);
    await searchPage.goto(`https://weixin.sogou.com/weixin?type=2&query=冯站长之家`, { waitUntil: 'networkidle2' });
    
    // 等待搜索结果加载
    await searchPage.waitForSelector('.news-list', { timeout: 10000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));
    
    const results = await searchPage.evaluate(() =>
      Array.from(document.querySelectorAll('.news-list li')).slice(0, 20).map(item => ({
        title: item.querySelector('h3')?.innerText || '',
        link: item.querySelector('h3 a')?.href || '',
        account: item.querySelector('.account')?.innerText || ''
      }))
    );
    
    console.log(`  找到 ${results.length} 条结果`);
    
    // 自动模式：只选择"三分钟新闻早餐"（排除晚间新闻）
    let target;
    if (isAuto) {
      // 精确匹配：包含日期 + "三分钟新闻早餐"
      target = results.find(r => 
        r.title.includes(dateInfo.dateStr) && 
        r.title.includes('三分钟新闻早餐') || r.title.includes('三分钟信息早餐')
      );
      
      if (!target) {
        // 降级：包含日期 + 不是晚间新闻
        target = results.find(r => 
          r.title.includes(dateInfo.dateStr) && 
          !r.title.includes('晚间新闻')
        );
      }
      
      if (!target) {
        console.log('❌ 未找到早间信息早餐文章');
        console.log('  搜索结果:');
        results.slice(0, 5).forEach(r => console.log(`    - ${r.title}`));
        
        // 尝试使用 fallback URL
        const autoConfig = await loadAutoCrawlConfig();
        if (autoConfig.fallback?.enabled && autoConfig.fallback?.lastSuccessUrl) {
          console.log('\n⚠ 尝试使用缓存 URL...');
          targetLink = autoConfig.fallback.lastSuccessUrl;
          console.log(`  使用 URL: ${targetLink.substring(0, 50)}...`);
          await searchPage.close();
        } else {
          console.log('\n💡 提示: 请手动运行爬虫并提供 URL:');
          console.log('  node fetch_news.mjs --url "搜狗微信文章链接" --date=' + dateInfo.dateStr.replace(/年|月|日/g, '-').slice(0, 10));
          await searchPage.close();
          browser.disconnect();
          return;
        }
      } else {
        console.log(`✅ 找到早间信息: ${target.title}`);
        targetLink = target.link;
        await searchPage.close();
      }
    } else {
      // 非自动模式：选择包含日期的第一条
      target = results.find(r => r.title.includes(dateInfo.dateStr));
      if (!target) {
        console.log('❌ 未找到文章');
        await searchPage.close();
        browser.disconnect();
        return;
      }
      console.log(`✅ ${target.title}`);
      targetLink = target.link;
      await searchPage.close();
    }
  } else {
    console.log(`🌐 直接打开文章...`);
  }
  
  // 打开文章
  const page = await browser.newPage();
  await page.goto(targetLink, { waitUntil: 'networkidle2', timeout: 30000 });
  
  // 等待图片加载
  await page.waitForSelector('#js_content img', { timeout: 10000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));
  
  // 创建目录
  const outputDir = path.join(OUTPUT_DIR, dateInfo.folderName);
  const imagesDir = path.join(outputDir, 'images');
  await fs.mkdir(imagesDir, { recursive: true });
  
  // 提取内容（按DOM顺序，记录前后文用于识别标题图片）
  console.log('\n📝 提取文章内容...');
  // 将配置传递给页面评估函数
  const promoKeywords = templateConfig.textFilter?.skipPromoKeywords?.keywords || [];
  
  // 广告检测函数（关键词 + 模式识别）
  const detectAdScript = `
    function detectAd(text, keywords) {
      if (!text) return false;
      
      // 1. 关键词检测
      const defaultKeywords = [
        '冯站长特惠', '新西兰进口', '点击图片购买', '点击下图选购', '限时特惠',
        '全场95折', '年卡', '优惠券', '医疗晨报', '历史上的今天',
        '每周一曲', '一日一诗', '晚间新闻', '推荐阅读', '一键关注',
        '扫码', '二维码', '客服', '加入', '防失联',
        '免费试用', '退退退', '炳济堂', '老黑膏', '非遗',
        '河北老字号', '限时活动', '元/贴', '多赠', '无条件退'
      ];
      const allKeywords = [...new Set([...defaultKeywords, ...keywords])];
      if (allKeywords.some(k => text.includes(k))) return true;
      
      // 2. 模式识别（基于广告句式）
      // 推销句式："推荐XXX者一定要试试"
      if (/推荐.+者.{0,5}(一定要|建议|不妨)/.test(text)) return true;
      
      // 症状+产品推荐
      if (/[疼痛肿痛酸麻出血敏感松动].{0,20}(一定要|建议|试试|推荐)/.test(text)) return true;
      
      // 价格/优惠促销
      if (/(限时|特惠|优惠|折扣|抢购|秒杀|原价|现价|立减|满减|包邮)/.test(text)) return true;
      
      // 购买引导
      if (/(点击(下方|图片|链接)|扫码(购买|咨询)|立即购买|下单|抢购热线)/.test(text)) return true;
      
      // 连续感叹号（推销语气）
      if ((text.match(/[！!]{2,}/g) || []).length >= 2) return true;
      
      // emoji开头的推广（✨✅🔥🎁等+产品描述）
      if (/^[✨✅🔥🎁🎉💪🌟⭐👉👆👈🙏💰🛒].{0,5}(护眼|黑科技|原装|进口|精华|营养|阻隔|防护)/.test(text)) return true;
      
      // 含叶黄素/蓝莓/护眼等保健品关键词
      if (/(叶黄素|蓝莓精华|护眼黑科技|护眼营养素|黄金防护膜|阻隔蓝光|原装进口)/.test(text)) return true;
      
      // 夸张功效承诺
      if (/(包治|根治|药到病除|告别.+问题|一.+见效)/.test(text)) return true;
      
      // 联系方式+推销
      if (/(客服|咨询|微信|电话|热线).{0,30}(购买|下单|优惠|活动)/.test(text)) return true;
      
      // 中药/保健品推销句式
      if (/(老字号|非遗|传承|秘方|祖传).{0,20}(膏|丸|贴|茶|粉)/.test(text)) return true;
      
      // 身体部位问题+产品推荐
      if (/(牙|眼|颈|腰|腿|膝|关节|胃|肠|肝|肾|心|血管).{0,10}(问题|不适|疼痛).{0,20}(试试|推荐|使用)/.test(text)) return true;
      
      // 以价格结尾
      if (/[¥￥]\\d+|元\\/(贴|盒|瓶|份)|\\d+元起?$/.test(text)) return true;
      
      return false;
    }
  `;
  
  const contentData = await page.evaluate((keywords, adDetectFn) => {
    // 注入广告检测函数
    eval(adDetectFn);
    
    const content = document.querySelector('#js_content');
    if (!content) return { items: [] };
    
    const items = [];
    let imgIndex = 0;
    let lastText = ''; // 上一个文本内容
    
    // 递归遍历所有元素
    function walkElement(el, depth = 0) {
      if (depth > 20) return; // 防止无限递归
      
      const tagName = el.tagName?.toLowerCase();
      
      // 处理图片
      if (tagName === 'img') {
        const src = el.dataset.src || el.src;
        // 过滤条件：只排除明确的emoji和SVG
        if (src && 
            !src.includes('Expression') && // 排除微信表情
            !src.includes('/emoji') &&     // 排除emoji
            !src.startsWith('data:image/svg')) {
          
          // 尝试获取实际尺寸
          const w = el.naturalWidth || el.width || parseInt(el.getAttribute('data-w')) || 0;
          const h = el.naturalHeight || el.height || 0;
          
          // 检查前一个元素的文本，判断是否是广告图片或标题图片
          let isAdImage = false;
          const prevEl = el.previousElementSibling || el.parentElement?.previousElementSibling;
          if (prevEl) {
            const prevText = prevEl.innerText?.trim() || '';
            isAdImage = detectAd(prevText, keywords);
          }
          // 同时检查父元素和后续元素的文本
          if (!isAdImage && el.parentElement) {
            const parentText = el.parentElement.innerText?.trim() || '';
            isAdImage = detectAd(parentText, keywords);
          }
          const nextEl = el.nextElementSibling || el.parentElement?.nextElementSibling;
          if (!isAdImage && nextEl) {
            const nextText = nextEl.innerText?.trim() || '';
            isAdImage = detectAd(nextText, keywords);
          }
          
          if (!isAdImage) {
            items.push({
              type: 'image',
              src: src,
              index: ++imgIndex,
              width: w,
              height: h,
              prevText: lastText, // 记录前文用于判断标题
              isTitleImage: false // 后续根据尺寸判断
            });
          }
        }
        return;
      }
      
      // 处理文本段落
      if (tagName === 'p' || tagName === 'section') {
        const text = el.innerText?.trim();
        
        // 检查这个元素是否只包含文本（没有子图片）
        const hasImages = el.querySelector('img');
        
        if (text && text.length > 2 && !hasImages) {
          // 广告检测：关键词 + 模式识别
          const isAd = detectAd(text, keywords);
          // 底部来源信息过滤
          const isFooter = /^（来源[：:]/.test(text) || /^\(来源[：:]/.test(text) || text.includes('熊苗营养师') || text.includes('编辑：冯站长') || text.includes('编辑:冯站长') || text.includes('播音：黄欢') || text.includes('播音:黄欢');
          
          if (isFooter) {
            items.push({ type: 'ad', text: '[底部来源] ' + text.substring(0, 30) + '...' });
          } else if (!isAd) {
            items.push({
              type: 'text',
              text: text
            });
            lastText = text.substring(0, 100); // 记录最近的文本
          } else {
            items.push({
              type: 'ad',
              text: text.substring(0, 50) + '...'
            });
          }
          return;
        }
      }
      
      // 递归处理子元素
      for (const child of el.children) {
        walkElement(child, depth + 1);
      }
    }
    
    // 从内容区域开始遍历
    for (const child of content.children) {
      walkElement(child, 0);
    }
    
    return { items };
  }, promoKeywords, detectAdScript); // 传递关键词配置和广告检测函数
  
  // 统计
  const stats = {
    images: contentData.items.filter(i => i.type === 'image').length,
    texts: contentData.items.filter(i => i.type === 'text').length,
    ads: contentData.items.filter(i => i.type === 'ad').length
  };
  console.log(`✓ 提取完成: ${stats.images} 图片, ${stats.texts} 文字段落, ${stats.ads} 广告块`);
  
  // 下载图片
  console.log('\n📷 下载图片...');
  const images = contentData.items.filter(i => i.type === 'image');
  const imageFiles = new Map();
  const imageConfig = []; // 图片配置（用于管理后台）
  const downloadedHashes = new Map(); // 用于检测重复图片（hash -> filename）
  const crypto = await import('crypto');
  
  for (const img of images) {
    // 跳过GIF动画（通常是装饰图）
    if (img.src.includes('.gif')) {
      continue;
    }
    
    // 检查是否已下载过这个 URL
    if (imageFiles.has(img.src)) {
      img.filename = imageFiles.get(img.src);
      continue;
    }
    
    const ext = img.src.includes('.png') ? 'png' : 'jpg';
    const filename = `image_${img.index}.${ext}`;
    
    try {
      const base64 = await page.evaluate(async (url) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          const blob = await res.blob();
          return new Promise(resolve => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        } catch { return null; }
      }, img.src);
      
      if (base64) {
        const match = base64.match(/^data:image\/\w+;base64,(.+)$/);
        if (match) {
          const buffer = Buffer.from(match[1], 'base64');
          const sizeKB = buffer.length / 1024;
          
          // 过滤掉小图片（小于15KB的通常是装饰图）
          // 从配置读取小图片过滤规则
          const skipSmall = templateConfig.imageFilter?.skipSmall?.enabled !== false;
          const minSizeKB = templateConfig.imageFilter?.skipSmall?.minSizeKB || 15;
          
          if (skipSmall && sizeKB < minSizeKB) {
            console.log(`\n  ⚠ 跳过小图片 ${filename} (${sizeKB.toFixed(1)}KB)`);
            continue;
          }
          
          // 获取图片实际尺寸（从 buffer 解析）
          const actualSize = getImageSizeFromBuffer(buffer);
          img.width = actualSize.width;
          img.height = actualSize.height;
          
          // 从配置读取过滤规则
          const imageFilter = templateConfig.imageFilter || {};
          const ratio = img.width / img.height;
          
          // 检测是否是标题图片（扁平图）
          const skipTitle = imageFilter.skipTitleImage?.enabled !== false;
          const isTitleImage = skipTitle && img.width > 300 && ratio > 2;
          
          // 检测是否是二维码图片
          const skipQR = imageFilter.skipQRCode?.enabled !== false;
          const isQRCode = skipQR && img.width > 700 && img.height > 700 && 
                          (ratio >= 0.8 && ratio <= 1.2);
          
          // 检测是否是推广封面图
          const skipPromo = imageFilter.skipPromo?.enabled !== false;
          const isPromoImage = skipPromo && img.width >= 500 && img.width <= 800 && ratio > 3;
          
          // 计算图片哈希，检测重复
          const hash = crypto.createHash('md5').update(buffer).digest('hex');
          
          if (downloadedHashes.has(hash)) {
            // 重复图片，使用已下载的文件名
            const existingFilename = downloadedHashes.get(hash);
            img.filename = existingFilename;
            imageFiles.set(img.src, existingFilename);
            console.log(`\n  ⚠ 跳过重复图片 ${filename} -> 已存在 ${existingFilename}`);
            continue;
          }
          
          // 标记是否应该跳过（标题图、二维码、推广图）
          img.isTitleImage = isTitleImage || isQRCode || isPromoImage;
          
          // 同时更新 contentData.items 中对应图片的标记
          const contentItem = contentData.items.find(i => i.type === 'image' && i.src === img.src);
          if (contentItem) {
            contentItem.isTitleImage = img.isTitleImage;
            contentItem.width = img.width;
            contentItem.height = img.height;
          }
          
          await fs.writeFile(path.join(imagesDir, filename), buffer);
          imageFiles.set(img.src, filename);
          downloadedHashes.set(hash, filename);
          img.filename = filename;
          
          // 记录到配置（使用更新后的标记，包含二维码和推广图）
          imageConfig.push({
            id: `img-${img.index}`,
            filename: filename,
            originalUrl: img.src,
            sizeKB: Math.round(sizeKB),
            width: img.width,
            height: img.height,
            isTitleImage: img.isTitleImage, // 使用完整的标记（包含二维码/推广图）
            hash: hash.substring(0, 8) // 短哈希用于显示
          });
          
          process.stdout.write(`\r✓ 已下载 ${imageFiles.size}/${images.length} 张`);
        }
      }
    } catch (e) {}
    
    await new Promise(r => setTimeout(r, 100));
  }
  console.log(`\n✓ 图片下载完成: ${imageFiles.size} 张`);
  
  // 生成HTML - 按章节编号位置插入标题图片
  console.log('\n📄 生成HTML...');
  let newsHTML = '';
  let adCount = 0;
  let lastType = '';
  let lastItemNumber = 0; // 上一条新闻的编号
  let sectionCount = 0; // 章节计数（用于A-F标题）
  let hasStartedNumbering = false; // 是否已经开始输出编号内容
  let firstTitleInserted = false; // 是否已插入第一个标题图片
  
  for (const item of contentData.items) {
    switch (item.type) {
      case 'image':
        // 只输出已下载且有文件名的图片
        if (item.filename) {
          // 标题图片通过下载时的 isTitleImage 标记判断
          
          if (item.isTitleImage) {
            // 跳过标题图片（扁平图），用用户配置的副标题替换
            console.log(`  ✓ 跳过标题图片 ${item.filename} (${item.width}×${item.height}, 比例=${item.width/item.height?.toFixed(1)||'?'})`);
          } else if (!hasStartedNumbering) {
            // 跳过编号开始前的图片（这些是文章开头的主页图片/广告图）
            console.log(`  ✓ 跳过开头图片 ${item.filename} (编号未开始)`);
          } else {
            // 普通配图
            if (lastType === 'text') {
              newsHTML += '\n';
            }
            newsHTML += `            <img src="images/${item.filename}" alt="配图">\n`;
          }
        }
        break;
        
      case 'ad':
        // 在原文广告位置替换（第一个广告块）
        if (adCount === 0) {
          newsHTML = generateAdHTML(adConfig.ads?.top) + '\n' + newsHTML; // 广告放在开头
        }
        adCount++;
        break;
        
      case 'text':
        const text = item.text;
        // 按换行符分割成多段
        const paragraphs = text.split('\n').filter(p => p.trim());
        paragraphs.forEach(para => {
          const trimmed = para.trim();
          if (trimmed.length > 10) {
            // 检测编号格式：1）2）3）... 10）等
            const numberMatch = trimmed.match(/^(\d+)[）\.\:：]/);
            
            if (numberMatch) {
              const currentNumber = parseInt(numberMatch[1]);
              
              // 标记已经开始输出编号内容
              if (!hasStartedNumbering) {
                hasStartedNumbering = true;
                
                // 在第一个编号前插入第一个章节的副标题图片（A=国内）
                if (!firstTitleInserted) {
                  firstTitleInserted = true;
                  const titleLetter = TITLE_ORDER[sectionCount] || 'A';
                  const titleName = TITLE_NAMES[titleLetter] || '国内';
                  
                  console.log(`  ✓ 文章开头插入副标题图片 → ${titleLetter}（${titleName}）`);
                  
                  // 使用新的副标题配置
                  const subtitleHTML = getSubtitleHTML(templateConfig, titleLetter);
                  if (subtitleHTML) {
                    newsHTML += subtitleHTML;
                    console.log(`    ✓ 插入副标题图片成功`);
                  }
                }
              }
              
              // 如果编号是 1，且之前已有编号 > 1 的内容（编号重置），插入新章节标题
              if (currentNumber === 1 && lastItemNumber > 1) {
                sectionCount++;
                
                // 按章节顺序获取标题字母（A-F）
                const titleLetter = TITLE_ORDER[sectionCount] || 'F';
                const titleName = TITLE_NAMES[titleLetter] || '其他';
                
                // 插入章节副标题图片
                const subtitleHTML = getSubtitleHTML(templateConfig, titleLetter);
                if (subtitleHTML) {
                  newsHTML += subtitleHTML;
                  console.log(`    ✓ 插入副标题图片（${titleLetter}/${titleName}）`);
                }
              }
              
              lastItemNumber = currentNumber;
            }
            
            newsHTML += `            <p class="news-item">${trimmed}</p>\n`;
          }
        });
        break;
    }
    lastType = item.type;
  }
  
  // 生成纯文本（用于改写和入库）
  const originalTexts = contentData.items
    .filter(i => i.type === 'text')
    .map(i => i.text);
  
  // AI 改写（如果启用）
  const rewriteConfig = JSON.parse(await fs.readFile('./config/rewrite_config.json', 'utf-8').catch(() => '{"enabled":false}'));
  
  let rewrittenTexts;
  let aiAdFlags; // AI广告检测结果
  
  if (rewriteConfig.enabled) {
    // 改写模式：改写+内置广告检测
    rewrittenTexts = await rewriteTextsBatch(originalTexts, 1);
    aiAdFlags = null; // 广告检测已在改写中完成
  } else {
    // 改写关闭：单独做AI广告检测
    rewrittenTexts = originalTexts;
    aiAdFlags = await detectAdsWithAI(originalTexts);
  }
  
  // 在原始HTML基础上替换文本（保持图片位置不变）
  let finalHTML = newsHTML;
  
  // 按顺序替换每段文本
  let textReplaceIndex = 0;
  let adRemovedInHTML = 0;
  for (const item of contentData.items) {
    if (item.type === 'text') {
      const originalText = item.text;
      const rewrittenText = rewrittenTexts[textReplaceIndex] || originalText;
      
      // 如果AI判断是广告，删除这段文本
      const isAiAd = aiAdFlags && aiAdFlags[textReplaceIndex];
      if (rewrittenText === '[AD_SKIP]' || isAiAd) {
        // 在HTML中删除这段广告文本
        const escapedText = originalText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        finalHTML = finalHTML.replace(new RegExp(`<p class="news-item">${escapedText}</p>`), '');
        adRemovedInHTML++;
        textReplaceIndex++;
        continue;
      }
      
      // 如果改写后的文本和原文不同，进行替换
      if (rewrittenText !== originalText) {
        // 处理换行分隔的段落
        const originalParagraphs = originalText.split('\n').filter(p => p.trim());
        const rewrittenParagraphs = rewrittenText.split('\n').filter(p => p.trim());
        
        // 逐段落替换
        for (let i = 0; i < originalParagraphs.length && i < rewrittenParagraphs.length; i++) {
          const origPara = originalParagraphs[i].trim();
          const rewPara = rewrittenParagraphs[i].trim();
          
          if (origPara.length > 10 && rewPara.length > 10) {
            // 替换HTML中的对应段落
            finalHTML = finalHTML.replace(
              `<p class="news-item">${origPara}</p>`,
              `<p class="news-item">${rewPara}</p>`
            );
          }
        }
      }
      textReplaceIndex++;
    }
  }
  
  if (adRemovedInHTML > 0) {
    console.log(`  ✓ HTML 中删除广告：${adRemovedInHTML} 段`);
  }
  
  // 组装最终HTML - 使用改写后的HTML
  const finalOutput = template
    .replace(/\{\{date\}\}/g, dateInfo.dateStr)
    .replace(/\{\{weekday\}\}/g, dateInfo.weekday)
    .replace(/\{\{header_image\}\}/g, templateAssets.header)
    .replace(/\{\{ad_top\}\}/g, '')
    .replace(/\{\{news_content\}\}/g, finalHTML)
    .replace(/\{\{ad_bottom\}\}/g, '')
    .replace(/\{\{template_footer\}\}/g, templateAssets.footer)
    .replace(/\{\{generated_time\}\}/g, new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: 'long', day: 'numeric' }));
  
  // 生成纯文本（改写后，过滤广告）
  const plainText = rewrittenTexts
    .map((t, i) => {
      if (t === '[AD_SKIP]' || (aiAdFlags && aiAdFlags[i])) return null;
      return t;
    })
    .filter(t => t !== null)
    .join('\n');
  
  // 保存改写日志
  const rewriteLog = {
    date: dateInfo.dateStr,
    originalCount: originalTexts.length,
    rewrittenCount: rewrittenTexts.length,
    adFiltered: rewrittenTexts.filter(t => t === '[AD_SKIP]').length,
    changes: originalTexts.map((orig, i) => ({
      index: i,
      original: orig.substring(0, 50) + (orig.length > 50 ? '...' : ''),
      rewritten: rewrittenTexts[i]?.substring(0, 50) + (rewrittenTexts[i]?.length > 50 ? '...' : ''),
      changed: orig !== rewrittenTexts[i],
      isAd: rewrittenTexts[i] === '[AD_SKIP]'
    })).filter(c => c.changed || c.isAd)
  };
  await fs.writeFile(path.join(outputDir, 'rewrite_log.json'), JSON.stringify(rewriteLog, null, 2));
  
  // 保存
  await fs.writeFile(path.join(outputDir, '完整版.html'), finalOutput);
  await fs.writeFile(path.join(outputDir, '新闻内容.txt'), plainText);
  await fs.writeFile(path.join(outputDir, 'images.json'), JSON.stringify(imageConfig, null, 2));
  
  // ============ 语音播报生成 ============
  // 语音播报文本：只取编号开头的新闻段落（不含广告、来源等）
  const audioText = contentData.items
    .filter(i => i.type === 'text' && /^\d+[）)]/.test(i.text))
    .map(i => i.text)
    .join('\n');
  
  const audioPath = path.join(outputDir, 'audio.mp3');
  const audioSuccess = await generateAudio(audioText, audioPath);
  if (audioSuccess) {
    // 在 HTML 中嵌入音频播放器
    const htmlWithAudio = embedAudioPlayer(finalOutput, 'audio.mp3');
    await fs.writeFile(path.join(outputDir, '完整版.html'), htmlWithAudio);
    console.log(' ✓ 已嵌入音频播放器');
  }
  
  console.log(`\n✅ 文件保存完成！`);
  
  // ============ 数据入库 ============
  console.log('\n💾 数据入库...');
  try {
    // 检查是否已存在，存在则删除重建
    const existing = getArticleByDate(dateInfo.dateStr);
    if (existing) {
      deleteArticle(existing.id);
      console.log(`  ✓ 已删除旧数据 (ID: ${existing.id})`);
    }
    
    // 创建文章记录
    const articleId = createArticle({
      date: dateInfo.dateStr,
      title: `${dateInfo.dateStr}（${dateInfo.weekday}）三分钟信息早餐`,
      content: plainText,
      html_path: path.join(outputDir, '完整版.html'),
      text_path: path.join(outputDir, '新闻内容.txt'),
      source_url: targetLink
    });
    console.log(`  ✓ 文章入库成功 (ID: ${articleId})`);
    
    // 创建图片记录
    if (imageConfig.length > 0) {
      const imageRecords = imageConfig.map(img => ({
        article_id: articleId,
        filename: img.filename,
        original_url: img.originalUrl,
        hash: img.hash,
        size_kb: img.sizeKB,
        local_path: path.join(imagesDir, img.filename)
      }));
      createImages(imageRecords);
      console.log(`  ✓ 图片入库成功 (${imageConfig.length} 张)`);
    }
    
    console.log('\n🎉 全部完成！');
    
    // 保存成功 URL（用于下次 fallback）
    if (targetLink) {
      await saveSuccessUrl(targetLink, dateInfo.dateStr);
    }
  } catch (err) {
    console.log(`  ⚠ 入库失败: ${err.message}`);
    console.log('  (文件已保存，可手动处理)');
  }
  
  console.log(`\n📊 统计:`);
  console.log(`  📁 输出: ${outputDir}`);
  console.log(`  📷 图片: ${imageFiles.size} 张`);
  console.log(`  📝 文字: ${stats.texts} 段`);
  console.log(`  📢 广告替换: ${adCount} 处`);
  
  // 关闭文章页面
  await page.close();
  
  browser.disconnect();
}

main().catch(console.error);