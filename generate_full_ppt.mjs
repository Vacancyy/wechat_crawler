import PptxGenJS from 'pptxgenjs';

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_16x9';
pptx.title = '公众号运营系统汇报';

const colors = {
  primary: '1E3A5F',
  success: '27AE60',
  accent: 'E74C3C',
  gold: 'D4AF37',
  warning: 'F39C12',
  text: '2C3E50'
};

// 第1页：标题
let s1 = pptx.addSlide();
s1.addShape('rect', { x: 0, y: 0, w: '100%', h: '100%', fill: { color: colors.primary } });
s1.addText('公众号运营系统', { x: 0.5, y: 2.2, w: 9, h: 1, fontSize: 44, bold: true, color: 'FFFFFF', align: 'center' });
s1.addText('冯站长之家·每日新闻自动化', { x: 0.5, y: 3.3, w: 9, h: 0.5, fontSize: 24, color: colors.gold, align: 'center' });
s1.addText('2026年4月26日', { x: 0.5, y: 4.5, w: 9, h: 0.4, fontSize: 18, color: 'FFFFFF', align: 'center' });

// 第2页：项目介绍
let s2 = pptx.addSlide();
s2.addShape('rect', { x: 0, y: 0, w: '100%', h: 1, fill: { color: colors.primary } });
s2.addText('项目介绍', { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 32, bold: true, color: 'FFFFFF' });

s2.addText([
  { text: '目标内容\n', options: { bold: true, fontSize: 20, color: colors.primary } },
  { text: '冯站长之家公众号 - 三分钟新闻早餐\n', options: { fontSize: 18, color: colors.text } },
  { text: '每天早上发布国内外新闻摘要，阅读量高\n\n', options: { fontSize: 18, color: colors.text } },
  { text: '业务价值\n', options: { bold: true, fontSize: 20, color: colors.gold } },
  { text: '• 自动获取内容，节省人工编辑时间\n', options: { fontSize: 18, color: colors.text } },
  { text: '• 过滤广告，保证发布质量\n', options: { fontSize: 18, color: colors.text } },
  { text: '• 快速生成素材，提高运营效率\n', options: { fontSize: 18, color: colors.text } },
], { x: 0.5, y: 1.5, w: 9, h: 3.5 });

// 第3页：已完成进度
let s3 = pptx.addSlide();
s3.addShape('rect', { x: 0, y: 0, w: '100%', h: 1, fill: { color: colors.success } });
s3.addText('已完成功能', { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 32, bold: true, color: 'FFFFFF' });

const completed = [
  ['功能', '状态', '效果'],
  ['自动爬取', '完成', '每天07:00自动运行'],
  ['广告过滤', '完成', '图片+文字广告自动剔除'],
  ['语音播报', '完成', '自动生成音频播放器'],
  ['数据存储', '完成', '12篇文章入库'],
  ['管理后台', '完成', '可视化管理界面'],
  ['云端部署', '完成', '24小时在线展示'],
];

s3.addTable(completed, {
  x: 0.5, y: 1.5, w: 9, h: 3,
  fontSize: 14,
  color: colors.text,
  border: { type: 'solid', pt: 1, color: 'CCCCCC' },
  colW: [2.5, 1.5, 6],
});

s3.addText('连续运行21天，成功率100%', {
  x: 0.5, y: 4.6, w: 9, h: 0.4, fontSize: 16, bold: true, color: colors.success, align: 'center'
});

// 第4页：待完成进度
let s4 = pptx.addSlide();
s4.addShape('rect', { x: 0, y: 0, w: '100%', h: 1, fill: { color: colors.warning } });
s4.addText('待完成功能', { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 32, bold: true, color: 'FFFFFF' });

const pending = [
  ['功能', '状态', '所需条件'],
  ['自动发布', '待开发', '需公众号API权限'],
  ['多公众号支持', '待开发', '需扩展架构'],
  ['多平台分发', '待开发', '头条/知乎/小红书'],
  ['数据分析', '待开发', '阅读量/转化统计'],
];

s4.addTable(pending, {
  x: 0.5, y: 1.5, w: 9, h: 2.5,
  fontSize: 14,
  color: colors.text,
  border: { type: 'solid', pt: 1, color: 'CCCCCC' },
  colW: [2.5, 1.5, 6],
});

s4.addText('核心功能已完成，后续为增值功能', {
  x: 0.5, y: 4.1, w: 9, h: 0.4, fontSize: 16, bold: true, color: colors.warning, align: 'center'
});

// 第5页：盈利方向
let s5 = pptx.addSlide();
s5.addShape('rect', { x: 0, y: 0, w: '100%', h: 1, fill: { color: colors.gold } });
s5.addText('盈利方向', { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 32, bold: true, color: 'FFFFFF' });

s5.addText([
  { text: '广告替换盈利\n\n', options: { bold: true, fontSize: 20, color: colors.accent } },
  { text: '• 原文章含有iPhone、保健品等广告\n', options: { fontSize: 16, color: colors.text } },
  { text: '• 系统自动过滤这些广告\n', options: { fontSize: 16, color: colors.text } },
  { text: '• 可替换为公司自己的广告位\n', options: { fontSize: 16, color: colors.text } },
  { text: '• 每个广告位可对接客户投放\n\n', options: { fontSize: 16, color: colors.text } },
  { text: '直接变现\n\n', options: { bold: true, fontSize: 20, color: colors.success } },
  { text: '• 每天一篇内容 = 多个广告位曝光\n', options: { fontSize: 16, color: colors.text } },
  { text: '• 可向客户收取广告费\n', options: { fontSize: 16, color: colors.text } },
  { text: '• 形成稳定广告收入来源\n\n', options: { fontSize: 16, color: colors.text } },
  { text: '扩展放大\n\n', options: { bold: true, fontSize: 20, color: colors.primary } },
  { text: '• 多公众号运营 → 广告位倍增\n', options: { fontSize: 16, color: colors.text } },
  { text: '• 多平台分发 → 广告覆盖面扩大', options: { fontSize: 16, color: colors.text } },
], { x: 0.5, y: 1.5, w: 9, h: 3.5 });

// 第6页：成本收益
let s6 = pptx.addSlide();
s6.addShape('rect', { x: 0, y: 0, w: '100%', h: 1, fill: { color: colors.primary } });
s6.addText('价值总结', { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 32, bold: true, color: 'FFFFFF' });

s6.addText([
  { text: '核心价值\n\n', options: { bold: true, fontSize: 20, color: colors.success } },
  { text: '• 节省人力：每天自动运行，无需人工操作\n', options: { fontSize: 18, color: colors.text } },
  { text: '• 降低风险：广告自动过滤，减少品牌风险\n', options: { fontSize: 18, color: colors.text } },
  { text: '• 提高效率：内容素材快速生成\n\n', options: { fontSize: 18, color: colors.text } },
  { text: '盈利模式\n\n', options: { bold: true, fontSize: 20, color: colors.gold } },
  { text: '• 过滤原广告 → 替换为自家广告位\n', options: { fontSize: 18, color: colors.text } },
  { text: '• 每天多广告位曝光 → 可对接客户投放\n', options: { fontSize: 18, color: colors.text } },
  { text: '• 多公众号运营 → 广告收入倍增', options: { fontSize: 18, color: colors.text } },
], { x: 0.5, y: 1.5, w: 9, h: 3.5 });

// 第7页：谢谢
let s7 = pptx.addSlide();
s7.addShape('rect', { x: 0, y: 0, w: '100%', h: '100%', fill: { color: colors.primary } });
s7.addText('谢谢', { x: 0.5, y: 2.2, w: 9, h: 1, fontSize: 48, bold: true, color: 'FFFFFF', align: 'center' });
s7.addText('欢迎提问', { x: 0.5, y: 3.5, w: 9, h: 0.5, fontSize: 24, color: colors.gold, align: 'center' });

await pptx.writeFile({ fileName: './output/汇报PPT_完整版_20260426.pptx' });
console.log('✅ PPT已生成: output/汇报PPT_完整版_20260426.pptx');