// AI 改写测试脚本
import { rewriteTextsBatch } from './rewrite.js';

// 测试文本（模拟新闻段落）
const testTexts = [
  "1）国家统计局今日公布数据显示，2026 年一季度国内生产总值同比增长 5.2%，国民经济开局良好。",
  "2）教育部发布通知，今年将加快推进高等教育高质量发展，重点支持一批高校建设世界一流学科。",
  "3）中国人民银行宣布，将于下月下调存款准备金率 0.25 个百分点，释放长期资金约 5000 亿元。",
  "4）科技部表示，2026 年将加大基础研究投入，力争在人工智能、量子计算等前沿领域取得突破。",
  "5）国家卫健委通报，全国基本医疗保险参保率稳定在 95% 以上，群众就医负担进一步减轻。"
];

console.log('📝 原文本：\n');
testTexts.forEach((t, i) => console.log(`${i + 1}. ${t}`));

console.log('\n\n🤖 开始 AI 改写测试...\n');

// 模拟改写（因为 OpenClaw API 需要认证，这里演示改写逻辑）
const mockRewrite = (text) => {
  // 简单的同义词替换演示
  const replacements = {
    '公布': '发布',
    '数据': '资料',
    '增长': '提升',
    '发布': '出台',
    '推进': '推动',
    '支持': '扶持',
    '宣布': '表示',
    '下调': '降低',
    '释放': '投放',
    '加大': '增加',
    '力争': '努力',
    '取得突破': '实现进展',
    '通报': '介绍',
    '稳定': '保持',
    '减轻': '缓解'
  };
  
  let result = text;
  for (const [from, to] of Object.entries(replacements)) {
    result = result.replace(new RegExp(from, 'g'), to);
  }
  return result;
};

const rewritten = testTexts.map(mockRewrite);

console.log('✅ 改写后：\n');
rewritten.forEach((t, i) => console.log(`${i + 1}. ${t}`));

console.log('\n\n📊 对比：');
testTexts.forEach((orig, i) => {
  console.log(`\n原文：${orig}`);
  console.log(`改写：${rewritten[i]}`);
});
