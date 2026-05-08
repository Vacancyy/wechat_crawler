import PptxGenJS from 'pptxgenjs';

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_16x9';
pptx.title = '公众号运营系统汇报';

const colors = {
  primary: '1E3A5F',
  success: '27AE60',
  accent: 'E74C3C',
  text: '2C3E50'
};

// 第1页：标题
let s1 = pptx.addSlide();
s1.addShape('rect', { x: 0, y: 0, w: '100%', h: '100%', fill: { color: colors.primary } });
s1.addText('公众号运营系统', { x: 0.5, y: 2.2, w: 9, h: 1, fontSize: 44, bold: true, color: 'FFFFFF', align: 'center' });
s1.addText('自动化内容管理解决方案', { x: 0.5, y: 3.3, w: 9, h: 0.5, fontSize: 24, color: 'FFFFFF', align: 'center' });
s1.addText('2026年4月26日', { x: 0.5, y: 4.5, w: 9, h: 0.4, fontSize: 18, color: 'FFFFFF', align: 'center' });

// 第2页：目的与目标
let s2 = pptx.addSlide();
s2.addShape('rect', { x: 0, y: 0, w: '100%', h: 1, fill: { color: colors.primary } });
s2.addText('目的与目标', { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 32, bold: true, color: 'FFFFFF' });

s2.addText([
  { text: '目的\n', options: { bold: true, fontSize: 22, color: colors.primary } },
  { text: '自动化公众号日常运营，解放人力，提升效率\n\n', options: { fontSize: 18, color: colors.text } },
  { text: '目标\n', options: { bold: true, fontSize: 22, color: colors.success } },
  { text: '• 每天07:00自动爬取新闻内容\n', options: { fontSize: 18, color: colors.text } },
  { text: '• 自动过滤广告，生成规范素材\n', options: { fontSize: 18, color: colors.text } },
  { text: '• 管理后台可视化操作\n', options: { fontSize: 18, color: colors.text } },
  { text: '• 未来实现一键发布到公众号\n', options: { fontSize: 18, color: colors.text } },
], { x: 0.5, y: 1.5, w: 9, h: 3.5 });

// 第3页：系统内容
let s3 = pptx.addSlide();
s3.addShape('rect', { x: 0, y: 0, w: '100%', h: 1, fill: { color: colors.primary } });
s3.addText('系统内容', { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 32, bold: true, color: 'FFFFFF' });

s3.addText([
  { text: '核心功能\n\n', options: { bold: true, fontSize: 20, color: colors.primary } },
  { text: '自动爬取 ', options: { bold: true, fontSize: 16, color: colors.success } },
  { text: 'Chrome CDP + 搜狗搜索\n', options: { fontSize: 16, color: colors.text } },
  { text: '智能过滤 ', options: { bold: true, fontSize: 16, color: colors.success } },
  { text: '广告图片/推广文字自动识别\n', options: { fontSize: 16, color: colors.text } },
  { text: '语音播报 ', options: { bold: true, fontSize: 16, color: colors.success } },
  { text: 'Edge TTS免费生成音频\n', options: { fontSize: 16, color: colors.text } },
  { text: '数据存储 ', options: { bold: true, fontSize: 16, color: colors.success } },
  { text: 'SQLite数据库 + 图片库\n', options: { fontSize: 16, color: colors.text } },
  { text: '管理后台 ', options: { bold: true, fontSize: 16, color: colors.success } },
  { text: '图片编辑/模板配置/文章预览\n', options: { fontSize: 16, color: colors.text } },
], { x: 0.5, y: 1.5, w: 9, h: 3.5 });

// 第4页：进展成果
let s4 = pptx.addSlide();
s4.addShape('rect', { x: 0, y: 0, w: '100%', h: 1, fill: { color: colors.primary } });
s4.addText('进展与成果', { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 32, bold: true, color: 'FFFFFF' });

// 数据卡片
const stats = [
  { label: '文章总数', value: '12篇' },
  { label: '连续运行', value: '21天' },
  { label: '成功率', value: '100%' },
  { label: '每日节省', value: '30分钟' },
];

stats.forEach((s, i) => {
  const x = 0.5 + i * 2.4;
  s4.addShape('rect', { x: x, y: 1.5, w: 2.2, h: 1.5, fill: { color: colors.primary } });
  s4.addText(s.label, { x: x, y: 1.6, w: 2.2, h: 0.3, fontSize: 14, color: 'FFFFFF', align: 'center' });
  s4.addText(s.value, { x: x, y: 2.0, w: 2.2, h: 0.8, fontSize: 28, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
});

s4.addText([
  { text: '\n已完成：', options: { bold: true, fontSize: 18, color: colors.success } },
  { text: '爬虫 + 图片过滤 + 语音播报 + 云端部署 + 定时任务\n', options: { fontSize: 16, color: colors.text } },
  { text: '待完成：', options: { bold: true, fontSize: 18, color: colors.accent } },
  { text: '公众号API接入自动发布（需AppID/AppSecret权限）', options: { fontSize: 16, color: colors.text } },
], { x: 0.5, y: 3.2, w: 9, h: 1.5 });

// 第5页：谢谢
let s5 = pptx.addSlide();
s5.addShape('rect', { x: 0, y: 0, w: '100%', h: '100%', fill: { color: colors.primary } });
s5.addText('谢谢', { x: 0.5, y: 2.2, w: 9, h: 1, fontSize: 48, bold: true, color: 'FFFFFF', align: 'center' });
s5.addText('欢迎提问', { x: 0.5, y: 3.5, w: 9, h: 0.5, fontSize: 24, color: 'FFFFFF', align: 'center' });

await pptx.writeFile({ fileName: './output/汇报PPT_20260426.pptx' });
console.log('✅ PPT已生成: output/汇报PPT_20260426.pptx');