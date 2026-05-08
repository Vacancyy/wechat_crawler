// AI 改写测试 - 使用百炼 GLM-5
import { rewriteTextsBatch } from './rewrite.js';

// 测试文本（模拟新闻段落）
const testTexts = [
  "1）国家统计局今日公布数据显示，2026 年一季度国内生产总值同比增长 5.2%，国民经济开局良好。",
  "2）教育部发布通知，今年将加快推进高等教育高质量发展，重点支持一批高校建设世界一流学科。",
  "3）中国人民银行宣布，将于下月下调存款准备金率 0.25 个百分点，释放长期资金约 5000 亿元。"
];

console.log('📝 原文本：\n');
testTexts.forEach((t, i) => console.log(`${i + 1}. ${t}`));

console.log('\n\n🤖 开始 AI 改写测试（使用百炼 GLM-5）...\n');

const rewritten = await rewriteTextsBatch(testTexts, 2);

console.log('✅ 改写后：\n');
rewritten.forEach((t, i) => console.log(`${i + 1}. ${t}`));

console.log('\n\n📊 对比：');
testTexts.forEach((orig, i) => {
  console.log(`\n原文：${orig}`);
  console.log(`改写：${rewritten[i]}`);
  console.log(`变化：${orig !== rewritten[i] ? '✅ 已改写' : '⚠ 未改变'}`);
});