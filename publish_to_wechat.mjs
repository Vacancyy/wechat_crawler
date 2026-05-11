/**
 * 发布文章到微信公众号
 * 
 * 核心逻辑：直接读取本地已生成的 "完整版.html"
 * 只上传 HTML 中实际引用的图片，完美复用本地项目的所有机制
 * 
 * 本地项目（fetch_news.mjs）已经处理：
 * - 图片过滤（isTitleImage）
 * - 模板配置
 * - 广告过滤
 * - 内容排版
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

const TOKEN_URL = 'https://jkx-stage.njzhyl.cn/insurance-issue/weixin/token?appId=wx022b53e2e1a7ff70';
const WECHAT_API = 'https://api.weixin.qq.com/cgi-bin';

// 获取token
async function getToken() {
  const res = await fetch(TOKEN_URL);
  const data = await res.json();
  return data.data;
}

// 上传图片到微信（永久素材，用于封面）
async function uploadMaterial(token, filePath, type = 'thumb') {
  const formData = new FormData();
  const fileContent = await fs.readFile(filePath);
  const fileName = path.basename(filePath);
  formData.append('media', new Blob([fileContent]), fileName);
  
  const res = await fetch(`${WECHAT_API}/material/add_material?access_token=${token}&type=${type}`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  return data.media_id;
}

// 上传图片到微信（临时素材，用于内容图片）
async function uploadImage(token, filePath) {
  const formData = new FormData();
  const fileContent = await fs.readFile(filePath);
  const fileName = path.basename(filePath);
  formData.append('media', new Blob([fileContent]), fileName);
  
  const res = await fetch(`${WECHAT_API}/media/uploadimg?access_token=${token}`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  return data.url;
}

// 上传音频到微信（永久素材，带日期标识）
async function uploadAudio(token, filePath, dateStr) {
  const formData = new FormData();
  const fileContent = await fs.readFile(filePath);
  // 文件名带日期标识，方便在素材库中识别
  const fileName = `信息播报_${dateStr}.mp3`;
  formData.append('media', new Blob([fileContent]), fileName);
  
  const res = await fetch(`${WECHAT_API}/material/add_material?access_token=${token}&type=voice`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  console.log('音频上传完整返回:', JSON.stringify(data));
  return data.media_id;
}

// 创建草稿
async function createDraft(token, article) {
  const res = await fetch(`${WECHAT_API}/draft/add?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ articles: [article] })
  });
  const data = await res.json();
  return data.media_id;
}

// 发布草稿
async function publish(token, mediaId) {
  const res = await fetch(`${WECHAT_API}/freepublish/submit?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ media_id: mediaId })
  });
  return await res.json();
}

// 查询发布状态
async function getStatus(token, publishId) {
  const res = await fetch(`${WECHAT_API}/freepublish/get?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publish_id: publishId })
  });
  return await res.json();
}

/**
 * 从 HTML 中提取所有图片路径
 * 返回: { localPath: string, htmlRef: string }[]
 */
function extractImagesFromHTML(html, baseDir, commonDir) {
  const images = [];
  
  // 匹配 src="..." 属性
  const srcRegex = /src="([^"]+)"/g;
  let match;
  
  while ((match = srcRegex.exec(html)) !== null) {
    const src = match[1];
    
    // 跳过已经上传的微信URL
    if (src.startsWith('http://') || src.startsWith('https://')) {
      continue;
    }
    
    // 解析路径
    let localPath;
    if (src.startsWith('../common/')) {
      localPath = path.join(commonDir, src.replace('../common/', ''));
    } else if (src.startsWith('images/')) {
      localPath = path.join(baseDir, src);
    } else if (src.startsWith('./') || src.startsWith('/')) {
      localPath = path.join(baseDir, src.replace(/^\.?\//, ''));
    } else {
      continue;
    }
    
    images.push({ localPath, htmlRef: src });
  }
  
  // 去重
  const uniqueImages = [];
  const seen = new Set();
  for (const img of images) {
    if (!seen.has(img.localPath)) {
      seen.add(img.localPath);
      uniqueImages.push(img);
    }
  }
  
  return uniqueImages;
}

// 主流程
async function main() {
  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日`;
  const baseDir = `/Users/chengxie/.openclaw/workspace/wechat-crawler/output/${dateStr}`;
  const commonDir = `/Users/chengxie/.openclaw/workspace/wechat-crawler/output/common`;
  
  console.log('=== 获取Token ===');
  const token = await getToken();
  console.log('Token获取成功');
  
  // 读取本地已生成的完整版HTML
  console.log('\n=== 读取本地完整版.html ===');
  const htmlPath = `${baseDir}/完整版.html`;
  let html = await fs.readFile(htmlPath, 'utf-8');
  console.log('HTML读取成功，长度:', html.length);
  
  // 提取HTML中引用的所有图片
  console.log('\n=== 提取HTML中的图片引用 ===');
  const images = extractImagesFromHTML(html, baseDir, commonDir);
  console.log(`发现 ${images.length} 张图片需要上传`);
  
  // 分类统计
  const commonImages = images.filter(img => img.htmlRef.includes('common/'));
  const newsImages = images.filter(img => img.htmlRef.includes('images/'));
  console.log(`  模板图片: ${commonImages.length} 张`);
  console.log(`  新闻图片: ${newsImages.length} 张`);
  
  // 上传图片并建立映射
  const imageMap = {};
  
  // 封面图缓存：避免重复上传
  const cachePath = `${baseDir}/../cover_cache.json`;
  let coverId = null;
  
  console.log('\n=== 检查封面图缓存 ===');
  try {
    const cacheData = await fs.readFile(cachePath, 'utf-8');
    const cache = JSON.parse(cacheData);
    if (cache.coverMediaId && cache.date) {
      // 缓存有效期30天（微信永久素材不会过期，但可能被删除）
      const cacheAge = Date.now() - new Date(cache.date).getTime();
      if (cacheAge < 30 * 24 * 60 * 60 * 1000) {
        coverId = cache.coverMediaId;
        console.log('使用缓存封面:', coverId);
      }
    }
  } catch (e) {
    console.log('无缓存文件');
  }
  
  if (!coverId) {
    console.log('\n=== 上传封面图片 ===');
    const coverPath = `${commonDir}/新闻封面.png`;
    coverId = await uploadMaterial(token, coverPath, 'thumb');
    console.log('封面media_id:', coverId);
    // 保存缓存
    await fs.writeFile(cachePath, JSON.stringify({ coverMediaId: coverId, date: new Date().toISOString() }), 'utf-8');
    console.log('封面缓存已保存');
  }
  
  console.log('\n=== 上传内容图片 ===');
  for (const img of images) {
    try {
      const url = await uploadImage(token, img.localPath);
      imageMap[img.htmlRef] = url;
      console.log(`✓ ${img.htmlRef} -> ${url}`);
    } catch (err) {
      console.log(`✗ ${img.htmlRef} 上传失败: ${err.message}`);
    }
  }
  
  // ========== 关键修复：只提取 <div class="content"> 内部内容 ==========
  console.log('\n=== 提取正文内容 ===');
  const contentMatch = html.match(/<div[^>]*class="content"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*class="footer"/);
  if (contentMatch) {
    html = contentMatch[1].trim();
    console.log('正文提取成功，长度:', html.length);
  } else {
    // fallback: 移除外层结构，只保留body内容
    html = html.replace(/<![\s\S]*?>/g, '');
    html = html.replace(/<html[^>]*>[\s\S]*?<body[^>]*>/gi, '');
    html = html.replace(/<\/body>[\s\S]*?<\/html>/gi, '');
    html = html.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
    console.log('fallback模式：移除HTML外壳');
  }
  
  // ========== 通用移除函数：基于关键词定位块级元素并删除 ==========
  function removeBlockContaining(text, keyword) {
    let result = text;
    let safety = 0;
    while (safety < 20) {
      const idx = result.indexOf(keyword);
      if (idx === -1) break;
      safety++;
      
      let searchStart = Math.max(0, idx - 2000);
      const divPositions = [];
      let p = searchStart;
      while (p < idx) {
        const di = result.indexOf('<div', p);
        if (di === -1 || di >= idx) break;
        divPositions.push(di);
        p = di + 1;
      }
      
      if (divPositions.length === 0) break;
      
      let removed = false;
      for (const start of divPositions) {
        let depth = 0;
        let scanPos = start;
        let end = -1;
        while (scanPos < result.length) {
          const nextOpen = result.indexOf('<div', scanPos);
          const nextClose = result.indexOf('</div>', scanPos);
          if (nextClose === -1) break;
          if (nextOpen !== -1 && nextOpen < nextClose) {
            depth++;
            scanPos = nextOpen + 4;
            continue;
          }
          depth--;
          if (depth === 0) { end = nextClose + 6; break; }
          scanPos = nextClose + 6;
        }
        if (end !== -1 && end > idx) {
          result = result.substring(0, start) + result.substring(end);
          removed = true;
          break;
        }
      }
      if (!removed) break;
    }
    return result;
  }
  
  // 移除音频播放器
  console.log('\n=== 移除音频播放器 ===');
  html = removeBlockContaining(html, '🎧');
  html = html.replace(/<audio[^>]*>[\s\S]*?<\/audio>/gs, '');
  console.log('音频播放器已移除, 仍有🎧:', html.includes('🎧'));

  // 移除广告卡片块
  console.log('\n=== 移除广告内容 ===');
  html = removeBlockContaining(html, 'promo-card');
  html = removeBlockContaining(html, 'iPhone');
  html = removeBlockContaining(html, '叶黄素');
  html = removeBlockContaining(html, '炳济堂');
  html = removeBlockContaining(html, '膏药');
  html = removeBlockContaining(html, '牙齿松动');
  html = removeBlockContaining(html, '蓝莓精华');
  const promoKeywords = ['护眼黑科技', '原装进口', '黄金防护膜', '护眼营养素', '阻隔蓝光',
    '骨痛问题', '颈椎僵硬', '腰椎酸痛', '牙龈出血', '口臭异味', '敏感疼痛', '一定要试试',
    '限时特惠'];
  for (const keyword of promoKeywords) {
    html = html.replace(new RegExp(`<p[^>]*>[^<]*${keyword}[^<]*<\/p>`, 'gi'), '');
  }
  console.log('广告内容已移除');

  // 移除底部来源/编辑信息
  html = html.replace(/<p[^>]*>（来源[：:].*?）<\/p>/g, '');
  html = html.replace(/<p[^>]*>\(来源[：:].*?\)<\/p>/g, '');
  
  // 转换样式为微信格式
  console.log('\n=== 转换样式为微信格式 ===');
  
  // 定义样式映射
  const styleMap = {
    'container': 'max-width:677px;margin:0 auto;background:#fff;padding:20px;',
    'header': 'text-align:center;padding:30px 20px;border-bottom:1px solid #eee;',
    'meta': 'font-size:14px;color:#999;',
    'content': 'padding:20px;',
    'news-item': 'font-size:17px;line-height:1.9;color:#333;margin-bottom:10px;',
    'section-title': 'font-weight:bold;color:#c00000;margin:25px 0 15px;font-size:17px;padding-bottom:8px;border-bottom:2px solid #c00000;',
    'tag': 'color:#576b95;font-weight:500;',
    'divider': 'height:1px;background:linear-gradient(to right,transparent,#ddd,transparent);margin:25px 0;',
    'section-divider': 'text-align:center;margin:30px 0;padding:10px 0;',
    'title-image': 'text-align:center;margin:20px 0;',
    'section-title-img': 'max-width:100%;height:auto;display:block;margin:15px auto;',
    'template-header': 'max-width:100%;display:block;margin:15px auto;',
    'template-divider': 'display:block;margin:25px auto;max-width:100%;',
    'template-footer': 'max-width:100%;display:block;margin:15px auto;',
    'footer': 'padding:30px 20px;text-align:center;color:#999;font-size:14px;border-top:1px solid #eee;',
    'promo-card': 'background:linear-gradient(135deg,#1a1a2e,#16213e);padding:20px;border-radius:12px;margin:20px 0;color:#fff;',
    'product-name': 'font-size:20px;font-weight:bold;margin-bottom:10px;',
    'product-desc': 'font-size:14px;color:#ccc;margin-bottom:15px;',
    'product-features': 'margin:15px 0;padding-left:20px;color:#ddd;',
    'price': 'font-size:24px;color:#ffd700;font-weight:bold;margin:15px 0;',
    'gift': 'font-size:13px;color:#aaa;margin-bottom:15px;',
    'audio-player': 'background:linear-gradient(135deg,#667eea,#764ba2);padding:20px;margin:15px 0;border-radius:12px;color:#fff;',
    'audio-title': 'font-size:28px;margin-bottom:10px;',
    'audio-desc': 'font-size:14px;color:#fff;'
  };
  
  // 将 class 转换为 inline style
  for (const [className, style] of Object.entries(styleMap)) {
    html = html.replace(new RegExp(`class="${className}"`, 'g'), `style="${style}"`);
    html = html.replace(new RegExp(`class='${className}'`, 'g'), `style="${style}"`);
  }
  
  // 处理图片样式（确保所有图片都有样式）
  html = html.replace(/<img([^>]*)>/g, (match, attrs) => {
    if (!attrs.includes('style=')) {
      return `<img${attrs} style="max-width:100%;display:block;margin:15px auto;">`;
    }
    return match;
  });
  
  // 移除所有残留的HTML外壳标签（确保只有内容片段）
  html = html.replace(/<![\s\S]*?>/g, '');
  html = html.replace(/<\/?(html|head|body|meta|title)[^>]*>/gi, '');
  html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gs, '');
  
  console.log('样式转换完成');
  
  // 替换HTML中的图片路径为微信URL
  console.log('\n=== 替换图片路径 ===');
  for (const [localRef, wechatUrl] of Object.entries(imageMap)) {
    html = html.replace(new RegExp(`src="${localRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'), `src="${wechatUrl}"`);
  }
  console.log('图片路径替换完成');
  
  // 广告卡片已在前面移除，跳过重构
  console.log('\n=== 跳过广告卡片重构（已移除）===');
  
  // 构建微信格式的文章数据
  // 上传音频并插入文章（必须在创建草稿之前）
  let audioMediaId = null;
  console.log('\n=== 上传音频文件 ===');
  const audioPath = `${baseDir}/audio.mp3`;
  const wxAudioPath = `${baseDir}/audio_wx.mp3`;
  // 优先使用微信素材版（小文件），不存在则用原版
  const uploadPath = fsSync.existsSync(wxAudioPath) ? wxAudioPath : audioPath;
  try {
    await fs.access(audioPath);
    audioMediaId = await uploadAudio(token, uploadPath, dateStr);
    console.log('音频media_id:', audioMediaId);
  } catch (e) {
    console.log('音频上传失败（可能超过2MB限制）:', e.message?.substring(0, 50));
  }
  
  // 同步高质量音频到云端
  const audioExists = fsSync.existsSync(audioPath);
  if (audioExists) {
    console.log('\n=== 同步音频到云端 ===');
    try {
      const { execSync } = await import('child_process');
      execSync(`rsync -avz "${audioPath}" tecent:/home/ubuntu/wechat-crawler/public/audio/${dateStr}.mp3`, { stdio: 'inherit' });
      console.log('音频已同步到云端');
      execSync('rsync -avz public/audio/ tecent:/home/ubuntu/wechat-crawler/public/audio/', { stdio: 'inherit' });
      console.log('播放器页面已同步到云端');
    } catch (err) {
      console.log('音频同步失败:', err.message);
    }
  }
  
  // 保存处理后的HTML用于调试
  const debugPath = `${baseDir}/wechat_content_debug.html`;
  await fs.writeFile(debugPath, html, 'utf-8');
  console.log('\n=== 调试：处理后HTML已保存 ===');
  console.log('路径:', debugPath);
  console.log('内容长度:', html.length);
  console.log('内容预览(前500字):', html.substring(0, 500));
  
  console.log('\n=== 构建微信文章数据 ===');
  const article = {
    title: `${dateStr}三分钟信息早餐`,
    author: '公众号运营系统',
    digest: '每日信息速递，国内外热点一览',
    content: html,
    content_source_url: '',
    thumb_media_id: coverId,
    need_open_comment: 0,
    only_fans_can_comment: 0
  };
  
  console.log('\n=== 创建草稿 ===');
  const draftMediaId = await createDraft(token, article);
  console.log('草稿media_id:', draftMediaId);
  
  console.log('\n✅ 草稿创建成功！');
  console.log('');
  console.log('📋 接下来请手动操作：');
  console.log('  1. 登录 mp.weixin.qq.com');
  console.log('  2. 草稿箱 → 打开今天的草稿');
  console.log('  3. 点击🎵音频按钮 → 从素材库选择「信息播报_' + dateStr + '.mp3」');
  console.log('  4. 插入音频 → 点击发布');
  console.log('');
}

main().catch(console.error);