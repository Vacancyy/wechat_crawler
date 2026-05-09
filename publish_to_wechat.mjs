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
  
  console.log('\n=== 上传封面图片 ===');
  const coverPath = `${commonDir}/新闻封面.png`;
  const coverId = await uploadMaterial(token, coverPath, 'thumb');
  console.log('封面media_id:', coverId);
  
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
  
  // 先移除标题和元信息（在样式转换之前，原始HTML中是 class="header"）
  console.log('\n=== 移除标题和元信息 ===');
  html = html.replace(/<div[^>]*class="header"[^>]*>.*?<\/div>/gs, '');
  html = html.replace(/<div[^>]*class="meta"[^>]*>.*?<\/div>/gs, '');
  console.log('标题和元信息已移除');
  
  // 移除分割线和audio标签
  console.log('\n=== 移除分割线 ===');
  html = html.replace(/<div[^>]*class="section-divider"[^>]*>.*?<\/div>/gs, '');
  html = html.replace(/<hr[^>]*>/g, '');
  html = html.replace(/<div[^>]*class="divider"[^>]*>.*?<\/div>/gs, '');
  html = html.replace(/<audio[^>]*>.*?<\/audio>/gs, '');
  console.log('分割线和audio已移除');
  
  // 移除广告内容（根据关键词过滤）
  console.log('\n=== 移除广告内容 ===');
  
  // 移除 promo-card 整块（iPhone等广告卡片）
  html = html.replace(/<div[^>]*class="promo-card"[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi, '');
  html = html.replace(/<section[^>]*class="promo-card"[^>]*>[\s\S]*?<\/section>/gi, '');
  
  // 移除音频播放器区域（🎧语音播报等）
  html = html.replace(/<div[^>]*class="audio-player"[^>]*>[\s\S]*?<\/div>/gi, '');
  html = html.replace(/<section[^>]*>[\s\S]*?🎧[\s\S]*?语音播报[\s\S]*?<\/section>/gi, '');
  html = html.replace(/<div[^>]*>[\s\S]*?🎧[\s\S]*?语音播报[\s\S]*?<\/div>/gi, '');
  
  const promoKeywords = ['叶黄素', '蓝莓精华', '护眼黑科技', '原装进口', '黄金防护膜', '护眼营养素', '阻隔蓝光',
    '炳济堂', '老黑膏', '膏药', '骨痛问题', '颈椎僵硬', '腰椎酸痛',
    '牙齿松动', '牙龈出血', '口臭异味', '敏感疼痛', '一定要试试',
    '优惠', '限时活动', '免费试用', '全场95折', '年卡', '多赠',
    'iPhone', '立即购买', '限时特惠'];
  
  // 移除包含广告关键词的 <p> 段落
  for (const keyword of promoKeywords) {
    const regex = new RegExp(`<p[^>]*>[^<]*${keyword}[^<]*<\/p>`, 'gi');
    html = html.replace(regex, '');
  }
  // 移除包含广告关键词的 <div> 块
  for (const keyword of promoKeywords) {
    const regex = new RegExp(`<div[^>]*>[^<]*${keyword}[\s\S]*?<\/div>`, 'gi');
    html = html.replace(regex, '');
  }
  console.log('广告内容已移除');

  // 移除底部来源/编辑信息
  html = html.replace(/<p[^>]*>（来源[：:].*?）<\/p>/g, '');
  html = html.replace(/<p[^>]*>\(来源[：:].*?\)<\/p>/g, '');
  
  // 转换样式为微信格式（移除style标签，转换为inline style）
  console.log('\n=== 转换样式为微信格式 ===');
  
  // 移除 <style> 标签（微信不支持）
  html = html.replace(/<style[^>]*>.*?<\/style>/gs, '');
  
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
  
  console.log('样式转换完成');
  
  // 替换HTML中的图片路径为微信URL
  console.log('\n=== 替换图片路径 ===');
  for (const [localRef, wechatUrl] of Object.entries(imageMap)) {
    html = html.replace(new RegExp(`src="${localRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'), `src="${wechatUrl}"`);
  }
  console.log('图片路径替换完成');
  
  // 将广告卡片重构为微信兼容格式（section + inline style）
  console.log('\n=== 重构广告卡片 ===');
  html = html.replace(/<div[^>]*class="promo-card"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g, (match, inner) => {
    // 从内部提取内容
    const nameM = inner.match(/<div[^>]*class="product-name"[^>]*>([\s\S]*?)<\/div>/);
    const descM = inner.match(/<p[^>]*class="product-desc"[^>]*>([\s\S]*?)<\/p>/);
    const featM = inner.match(/<ul[^>]*class="product-features"[^>]*>([\s\S]*?)<\/ul>/);
    const priceM = inner.match(/<div[^>]*class="price"[^>]*>([\s\S]*?)<\/div>/);
    const giftM = inner.match(/<p[^>]*class="gift"[^>]*>([\s\S]*?)<\/p>/);
    const btnM = inner.match(/<a[^>]*class="buy-btn"[^>]*>([\s\S]*?)<\/a>/);
    
    const name = nameM ? nameM[1].trim() : '';
    const desc = descM ? descM[1].trim() : '';
    const features = featM ? featM[1].replace(/<li>/g, '<p style="font-size:14px;color:#ddd;margin:5px 0;">• ').replace(/<\/li>/g, '</p>') : '';
    const price = priceM ? priceM[1].replace(/<span[^>]*class="original"[^>]*>([\s\S]*?)<\/span>/g, '<span style="text-decoration:line-through;color:#999;font-size:14px;">$1</span>') : '';
    const gift = giftM ? giftM[1].trim() : '';
    const btn = btnM ? btnM[1].trim() : '';
    
    return `<section style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:20px;border-radius:12px;margin:20px 0;color:#fff;">
<p style="font-size:20px;font-weight:bold;margin:0 0 10px;">${name}</p>
<p style="font-size:14px;color:#ccc;margin:0 0 15px;">${desc}</p>
${features}
<p style="font-size:24px;color:#ffd700;font-weight:bold;margin:15px 0;">${price}</p>
<p style="font-size:13px;color:#aaa;margin:0 0 15px;">${gift}</p>
<p style="text-align:center;"><span style="display:inline-block;padding:8px 25px;background:#ffd700;color:#1a1a2e;border-radius:20px;font-weight:bold;font-size:14px;">${btn}</span></p>
</section>`;
  });
  console.log('广告卡片重构完成');
  
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