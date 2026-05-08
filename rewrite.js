// AI 改写模块 - 支持多种 AI 服务
import fs from 'fs/promises';
import { readFile } from 'fs/promises';

const REWRITE_CONFIG_PATH = './config/rewrite_config.json';
const OPENCLAW_ENV_PATH = process.env.HOME + '/.openclaw/.env';
const OPENCLAW_CONFIG_PATH = process.env.HOME + '/.openclaw/openclaw.json';

// 从多个来源获取 API Key（优先从 OpenClaw 配置读取）
async function getApiKey(provider, config) {
  // 1. 配置文件中的 apiKey
  if (config.providers?.[provider]?.apiKey) {
    return config.providers[provider].apiKey;
  }
  
  // 2. OpenClaw 主配置文件（最高优先级）
  try {
    const openclawConfig = await readFile(OPENCLAW_CONFIG_PATH, 'utf-8');
    
    // OpenClaw 配置使用特殊格式，需要预处理
    // 移除首尾大括号，提取 bailian 配置部分
    const bailianMatch = openclawConfig.match(/"bailian":\s*\{[^}]*"apiKey":\s*"([^"]+)"/);
    const baseUrlMatch = openclawConfig.match(/"bailian":\s*\{[^}]*"baseUrl":\s*"([^"]+)"/);
    
    if (bailianMatch && bailianMatch[1]) {
      console.log(`✓ 从 OpenClaw 配置读取到 ${provider} API Key`);
      // 更新 endpoint
      if (baseUrlMatch && baseUrlMatch[1]) {
        config.providers[provider].endpoint = baseUrlMatch[1] + '/chat/completions';
      }
      return bailianMatch[1];
    }
  } catch (e) {
    console.log(`⚠ 读取 OpenClaw 配置失败: ${e.message}`);
  }
  
  // 3. 环境变量
  const envKeyMap = {
    'bailian': ['DASHSCOPE_API_KEY', 'BAILIAN_API_KEY'],
    'glm': ['ZHIPU_API_KEY', 'GLM_API_KEY'],
    'moonshot': ['MOONSHOT_API_KEY', 'KIMI_API_KEY']
  };
  
  const envKeys = envKeyMap[provider] || [];
  for (const key of envKeys) {
    if (process.env[key]) {
      return process.env[key];
    }
  }
  
  // 4. ~/.openclaw/.env 文件
  try {
    const envContent = await readFile(OPENCLAW_ENV_PATH, 'utf-8');
    for (const key of envKeys) {
      const match = envContent.match(new RegExp(`${key}=(.+)`));
      if (match) {
        return match[1].trim();
      }
    }
  } catch {}
  
  return null;
}

// 加载改写配置
async function loadRewriteConfig() {
  try {
    const data = await fs.readFile(REWRITE_CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { enabled: false };
  }
}

// 改写单段文本（使用智谱 GLM-5）
async function rewriteWithGLM(text, config) {
  const apiKey = config.providers.glm?.apiKey;
  if (!apiKey) {
    console.log('⚠ GLM API Key 未配置，使用原文');
    return text;
  }
  
  try {
    const prompt = `请改写以下新闻段落，保持原意但改变表达方式。要求：
- 保持事实、数据、人名、地名不变
- 改变句式结构和用词
- 保持简洁专业的新闻风格
- 不要添加额外内容

原文：
${text}

改写：`;

    const response = await fetch(config.providers.glm.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: config.providers.glm.model || 'glm-5',
        messages: [
          { role: 'system', content: '你是一个专业的新闻编辑，擅长改写新闻内容，保持原意但改变表达方式。' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || text;
    }
    
    return text;
  } catch (e) {
    console.log(`⚠ GLM 改写失败：${e.message}`);
    return text;
  }
}

// 改写单段文本（使用 OpenClaw 内置模型）
async function rewriteWithOpenClaw(text, config) {
  try {
    // 增强改写 prompt，要求更彻底的改变
    const prompt = `你是专业的新闻编辑。请对以下新闻段落进行改写，要求：

1. **保持不变的内容**：
   - 数字、日期、百分比等精确数据
   - 人名、地名、机构名称
   - 核心事实和事件本身

2. **必须改变的内容**：
   - 句式结构（如：主动句改为被动句，长句拆分，短句合并）
   - 用词替换（使用同义词或近义词）
   - 表达顺序调整（不影响逻辑的前提下）

3. **改写风格**：
   - 保持新闻的客观、简洁风格
   - 不添加个人观点或评论
   - 不添加任何额外的开头或结尾说明

原文：
${text}

请直接输出改写后的内容（不要包含"改写后："等标注）：`;

    // 调用 OpenClaw API
    const endpoint = config.providers?.openclaw?.endpoint || 'http://127.0.0.1:8080/v1/chat/completions';
    const model = config.providers?.openclaw?.model || 'glm-5';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: '你是专业新闻编辑，擅长改写新闻内容，保持原意但改变表达方式。改写时必须改变句式和用词，不能只做简单的同义词替换。' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.8
      })
    }).catch(() => null);
    
    if (response && response.ok) {
      const data = await response.json();
      let result = data.choices?.[0]?.message?.content?.trim() || text;
      
      // 清理可能的前缀标注
      result = result.replace(/^(改写后[：:]?\s*|以下是改写[：:]?\s*|改写[：:]?\s*)/i, '').trim();
      
      // 如果改写结果太短或和原文几乎一样，返回原文
      if (result.length < text.length * 0.5 || result === text) {
        return text;
      }
      
      return result;
    }
    
    console.log(`⚠ OpenClaw API 调用失败，使用原文`);
    return text;
  } catch (e) {
    console.log(`⚠ OpenClaw 改写失败：${e.message}`);
    return text;
  }
}

// 改写单段文本（使用 Kimi）
async function rewriteWithMoonshot(text, config) {
  const apiKey = config.providers.moonshot?.apiKey;
  if (!apiKey) return text;
  
  try {
    const prompt = `请改写以下新闻段落，保持原意但改变表达方式。要求：
- 保持事实、数据、人名、地名不变
- 改变句式结构和用词
- 保持简洁专业的新闻风格

原文：${text}

改写：`;

    const response = await fetch(config.providers.moonshot.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: config.providers.moonshot.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || text;
    }
    
    return text;
  } catch {
    return text;
  }
}

// 改写单段文本（使用阿里百炼 - GLM-5）
async function rewriteWithBailian(text, config) {
  const apiKey = await getApiKey('bailian', config);
  if (!apiKey) {
    console.log('⚠ 百炼 API Key 未配置，使用原文');
    return text;
  }
  
  try {
    // 提取编号（如：1）、2）、[法治]等）
    const numberMatch = text.match(/^(\d+[）\.\:：]\s*)/);
    const tagMatch = text.match(/^(\[[^\]]+\]\s*)/);
    const prefix = numberMatch?.[1] || tagMatch?.[1] || '';
    const contentToRewrite = prefix ? text.slice(prefix.length) : text;
    
    // 如果没有实际内容需要改写，直接返回原文
    if (contentToRewrite.length < 10) {
      return text;
    }
    
    const endpoint = config.providers?.bailian?.endpoint || 'https://coding.dashscope.aliyuncs.com/v1/chat/completions';
    const model = config.providers?.bailian?.model || 'glm-5';
    
    // 先判断是否是广告内容
    const adCheckPrompt = `判断以下文本是否是广告/推广内容。广告特征包括：
- 推销产品或服务
- 包含购买引导（点击购买、扫码咨询等）
- 促销优惠信息（限时、特惠、折扣等）
- 夸张功效承诺
- 推荐某种产品/服务让人"一定要试试"

文本：${contentToRewrite}

如果是广告，回复：[AD_SKIP]
如果是正常新闻内容，回复：[NEWS_OK]`;
    
    // 先做广告检测
    const adCheckResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: adCheckPrompt }],
        max_tokens: 20,
        temperature: 0.1
      })
    });
    
    if (adCheckResponse.ok) {
      const adCheckData = await adCheckResponse.json();
      const adCheckResult = adCheckData.choices?.[0]?.message?.content?.trim() || '';
      
      // 如果AI判断是广告，返回跳过标记
      if (adCheckResult.includes('[AD_SKIP]')) {
        return '[AD_SKIP]';
      }
    }
    
    // 不是广告，继续改写
    const prompt = `请改写以下新闻内容，保持原意但改变表达方式。要求：
1. 保持数字、日期、人名、地名不变
2. 改变句式结构和用词
3. 保持新闻的客观简洁风格
4. 直接输出改写后的内容，不要添加编号或标注

内容：${contentToRewrite}

改写：`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 600,
        temperature: 0.8
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      let result = data.choices?.[0]?.message?.content?.trim() || contentToRewrite;
      
      // 清理可能的前缀标注
      result = result.replace(/^(改写后[：:]?\s*|以下是[^\n]*\n|改写[：:]?\s*)/i, '').trim();
      
      // 提取第一个有效段落（如果有多条建议）
      const lines = result.split('\n');
      let cleanResult = '';
      for (const line of lines) {
        const trimmed = line.trim();
        // 跳过标题行、空行、编号说明
        if (trimmed && !trimmed.startsWith('**') && !trimmed.startsWith('-') && 
            !trimmed.match(/^[\d]+\./) && !trimmed.includes('以下是') &&
            trimmed.length > 20 && !trimmed.includes('风格')) {
          cleanResult = trimmed;
          break;
        }
      }
      
      if (cleanResult) {
        result = cleanResult;
      }
      
      // 强制添加编号/标签前缀（确保格式正确）
      if (prefix && !result.startsWith(prefix.trim())) {
        result = prefix + result;
      }
      
      // 如果改写结果太短，返回原文
      if (result.length < text.length * 0.5) {
        return text;
      }
      
      return result;
    } else {
      const errorText = await response.text();
      console.log(`⚠ 百炼 API 错误: ${response.status} - ${errorText.substring(0, 100)}`);
    }
    
    return text;
  } catch (e) {
    console.log(`⚠ 百炼改写失败：${e.message}`);
    return text;
  }
}

// 主改写函数
export async function rewriteText(texts, onProgress) {
  const config = await loadRewriteConfig();
  
  if (!config.enabled) {
    console.log('⚠ AI 改写未启用，使用原文');
    return texts;
  }
  
  const provider = config.provider || 'openclaw';
  console.log(`\n🤖 AI 改写模式：${config.providers[provider]?.description || provider}`);
  console.log(`📝 待改写段落：${texts.length} 段`);
  
  const rewritten = [];
  
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    
    // 跳过太短的段落（少于 10 字）
    if (text.length < 10) {
      rewritten.push(text);
      continue;
    }
    
    let result = text;
    
    // 根据 provider 选择改写方式
    switch (provider) {
      case 'glm':
        result = await rewriteWithGLM(text, config);
        break;
      case 'moonshot':
        result = await rewriteWithMoonshot(text, config);
        break;
      case 'bailian':
        result = await rewriteWithBailian(text, config);
        break;
      case 'openclaw':
      default:
        result = await rewriteWithOpenClaw(text, config);
        break;
    }
    
    rewritten.push(result);
    
    if (onProgress) {
      onProgress(i + 1, texts.length);
    }
    
    // 避免请求过快
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log(`✅ 改写完成`);
  return rewritten;
}

// 批量改写（并发控制）
export async function rewriteTextsBatch(texts, concurrency = 3) {
  const config = await loadRewriteConfig();
  
  if (!config.enabled) {
    return texts;
  }
  
  const provider = config.provider || 'openclaw';
  console.log(`\n🤖 AI 改写模式：${config.providers[provider]?.description || provider} (并发：${concurrency})`);
  console.log(`📝 待改写段落：${texts.length} 段`);
  
  const results = new Array(texts.length);
  const queue = [...texts.map((t, i) => ({ text: t, index: i }))];
  const workers = [];
  let adFiltered = 0; // 记录广告过滤数量
  
  async function worker() {
    while (queue.length > 0) {
      const { text, index } = queue.shift();
      
      // 跳过太短的段落
      if (text.length < 10) {
        results[index] = text;
        continue;
      }
      
      let result = text;
      
      switch (provider) {
        case 'bailian':
          result = await rewriteWithBailian(text, config);
          break;
        case 'glm':
          result = await rewriteWithGLM(text, config);
          break;
        case 'moonshot':
          result = await rewriteWithMoonshot(text, config);
          break;
        case 'openclaw':
        default:
          result = await rewriteWithOpenClaw(text, config);
          break;
      }
      
      // 如果AI判断是广告，标记为跳过（保持数组长度不变）
      if (result === '[AD_SKIP]') {
        adFiltered++;
        results[index] = '[AD_SKIP]';
      } else {
        results[index] = result;
      }
    }
  }
  
  // 启动并发 worker
  for (let i = 0; i < Math.min(concurrency, texts.length); i++) {
    workers.push(worker());
  }
  
  await Promise.all(workers);
  
  if (adFiltered > 0) {
    console.log(`✅ 改写完成，AI 过滤广告：${adFiltered} 段`);
  } else {
    console.log(`✅ 改写完成`);
  }
  
  // 返回相同长度的数组（广告位置标记为 [AD_SKIP]）
  return results;
}
