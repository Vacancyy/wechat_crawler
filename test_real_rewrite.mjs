// 测试实际文章改写效果
import { rewriteTextsBatch } from './rewrite.js';

// 使用今天实际爬取的文章段落
const realTexts = [
  '1）"让互联网更好造福国家和人民"——我国推进网络强国建设助力中国式现代化。',
  '2）4月19日，2026北京亦庄半程马拉松暨人形机器人半程马拉松举行，齐天大圣队自主选手闪电夺冠。',
  '3）持续识别遏制恶意抢票行为，铁路12306三天拒绝出票105.6万张。',
  '4）五一假期首尾高峰时段，平均每天增开直通夜间高铁700列。',
  '5）我国成功摧毁一个特大制售商标侵权和伪劣白酒的违法犯罪网络，涉案2.6亿元.'
];

console.log('📝 原文（今天实际爬取内容）：\n');
realTexts.forEach((t, i) => console.log(`${i + 1}. ${t}`));

console.log('\n\n🤖 开始 AI 改写...\n');

const rewritten = await rewriteTextsBatch(realTexts, 2);

console.log('✅ 改写结果：\n');
rewritten.forEach((t, i) => console.log(`${i + 1}. ${t}`));

console.log('\n\n📊 详细对比：');
realTexts.forEach((orig, i) => {
  const rew = rewritten[i];
  const changed = orig !== rew;
  console.log(`\n=== 第${i + 1}段 ===`);
  console.log(`原文：${orig}`);
  console.log(`改写：${rew}`);
  console.log(`状态：${changed ? '✅ 已改写' : '⚠ 未改变'}`);
});