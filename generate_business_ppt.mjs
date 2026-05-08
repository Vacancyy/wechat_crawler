import PptxGenJS from 'pptxgenjs';

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_16x9';
pptx.title = '公众号运营系统汇报';

const colors = {
  primary: '1E3A5F',
  success: '27AE60',
  accent: 'E74C3C',
  gold: 'D4AF37',
  text: '2C3E50'
};

// 第1页：标题
let s1 = pptx.addSlide();
s1.addShape('rect', { x: 0, y: 0, w: '100%', h: '100%', fill: { color: colors.primary } });
s1.addText('公众号自动化运营', { x: 0.5, y: 2.2, w: 9, h: 1, fontSize: 44, bold: true, color: 'FFFFFF', align: 'center' });
s1.addText('人力成本优化方案', { x: 0.5, y: 3.3, w: 9, h: 0.5, fontSize: 24, color: colors.gold, align: 'center' });

// 第2页：问题与成本
let s2 = pptx.addSlide();
s2.addShape('rect', { x: 0, y: 0, w: '100%', h: 1, fill: { color: colors.accent } });
s2.addText('当前问题', { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 32, bold: true, color: 'FFFFFF' });

s2.addText([
  { text: '人工运营成本\n\n', options: { bold: true, fontSize: 20, color: colors.accent } },
  { text: '• 每天需要专人操作 30-45 分钟\n', options: { fontSize: 18, color: colors.text } },
  { text: '• 容易遗漏广告，造成品牌风险\n', options: { fontSize: 18, color: colors.text } },
  { text: '• 内容质量不稳定\n', options: { fontSize: 18, color: colors.text } },
  { text: '• 新人培训成本高\n\n', options: { fontSize: 18, color: colors.text } },
  { text: '年人力成本估算：', options: { bold: true, fontSize: 20, color: colors.accent } },
  { text: ' 约 15,000-20,000 元', options: { fontSize: 18, color: colors.text } },
], { x: 0.5, y: 1.5, w: 9, h: 3.5 });

// 第3页：解决方案与收益
let s3 = pptx.addSlide();
s3.addShape('rect', { x: 0, y: 0, w: '100%', h: 1, fill: { color: colors.success } });
s3.addText('自动化方案', { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 32, bold: true, color: 'FFFFFF' });

s3.addText([
  { text: '系统自动完成\n\n', options: { bold: true, fontSize: 20, color: colors.success } },
  { text: '• 每天早上7点自动爬取内容\n', options: { fontSize: 18, color: colors.text } },
  { text: '• 自动过滤广告和劣质图片\n', options: { fontSize: 18, color: colors.text } },
  { text: '• 自动生成规范素材\n', options: { fontSize: 18, color: colors.text } },
  { text: '• 管理后台可视化操作\n\n', options: { fontSize: 18, color: colors.text } },
  { text: '收益\n\n', options: { bold: true, fontSize: 20, color: colors.gold } },
  { text: '• 每天节省 30-45 分钟 = 年节省 180+ 小时\n', options: { fontSize: 18, color: colors.text } },
  { text: '• 相当于节省 0.5 个人力\n', options: { fontSize: 18, color: colors.text } },
  { text: '• 年节省成本约 8,000-10,000 元', options: { fontSize: 18, color: colors.text } },
], { x: 0.5, y: 1.5, w: 9, h: 3.5 });

// 第4页：投资回报
let s4 = pptx.addSlide();
s4.addShape('rect', { x: 0, y: 0, w: '100%', h: 1, fill: { color: colors.gold } });
s4.addText('投资回报分析', { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 32, bold: true, color: 'FFFFFF' });

// 投入
s4.addShape('rect', { x: 0.5, y: 1.5, w: 4, h: 2, fill: { color: 'F5F5F5' } });
s4.addText('投入', { x: 0.5, y: 1.6, w: 4, h: 0.4, fontSize: 18, bold: true, color: colors.accent, align: 'center' });
s4.addText([
  { text: '开发时间：2周\n', options: { fontSize: 14, color: colors.text } },
  { text: '服务器：约 100元/月\n', options: { fontSize: 14, color: colors.text } },
  { text: '维护：每周约1小时\n\n', options: { fontSize: 14, color: colors.text } },
  { text: '总投入：约 2,000 元', options: { bold: true, fontSize: 16, color: colors.accent } },
], { x: 0.6, y: 2.1, w: 3.8, h: 1.3 });

// 回报
s4.addShape('rect', { x: 5.5, y: 1.5, w: 4, h: 2, fill: { color: 'E8F5E9' } });
s4.addText('回报', { x: 5.5, y: 1.6, w: 4, h: 0.4, fontSize: 18, bold: true, color: colors.success, align: 'center' });
s4.addText([
  { text: '年节省人力：8,000+ 元\n', options: { fontSize: 14, color: colors.text } },
  { text: '降低广告风险：无形价值\n', options: { fontSize: 14, color: colors.text } },
  { text: '可扩展更多公众号\n\n', options: { fontSize: 14, color: colors.text } },
  { text: 'ROI：4倍以上', options: { bold: true, fontSize: 16, color: colors.success } },
], { x: 5.6, y: 2.1, w: 3.8, h: 1.3 });

s4.addText('结论：投入2000元，年回报8000+元，ROI超过400%', {
  x: 0.5, y: 3.8, w: 9, h: 0.5, fontSize: 18, bold: true, color: colors.success, align: 'center'
});

// 第5页：未来赚钱方向
let s5 = pptx.addSlide();
s5.addShape('rect', { x: 0, y: 0, w: '100%', h: 1, fill: { color: colors.primary } });
s5.addText('未来扩展价值', { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 32, bold: true, color: 'FFFFFF' });

s5.addText([
  { text: '可复制到更多公众号\n', options: { bold: true, fontSize: 18, color: colors.gold } },
  { text: '一次开发，多号使用，边际成本接近零\n\n', options: { fontSize: 16, color: colors.text } },
  { text: '多平台分发\n', options: { bold: true, fontSize: 18, color: colors.gold } },
  { text: '同一内容可分发到头条、知乎、小红书等平台\n\n', options: { fontSize: 16, color: colors.text } },
  { text: '内容矩阵运营\n', options: { bold: true, fontSize: 18, color: colors.gold } },
  { text: '支撑公司运营多个公众号，形成内容矩阵\n\n', options: { fontSize: 16, color: colors.text } },
  { text: '潜在商业价值\n', options: { bold: true, fontSize: 18, color: colors.success } },
  { text: '可承接其他公司公众号代运营业务', options: { fontSize: 16, color: colors.text } },
], { x: 0.5, y: 1.5, w: 9, h: 3.5 });

// 第6页：总结
let s6 = pptx.addSlide();
s6.addShape('rect', { x: 0, y: 0, w: '100%', h: '100%', fill: { color: colors.primary } });
s6.addText('总结', { x: 0.5, y: 1.5, w: 9, h: 0.8, fontSize: 36, bold: true, color: 'FFFFFF', align: 'center' });
s6.addText([
  { text: '投入小，回报高\n', options: { fontSize: 24, color: colors.gold } },
  { text: '一次开发，持续收益\n', options: { fontSize: 24, color: colors.gold } },
  { text: '可扩展，有商业潜力', options: { fontSize: 24, color: colors.gold } },
], { x: 0.5, y: 2.5, w: 9, h: 1.5, align: 'center' });
s6.addText('谢谢', { x: 0.5, y: 4.0, w: 9, h: 0.8, fontSize: 32, bold: true, color: 'FFFFFF', align: 'center' });

await pptx.writeFile({ fileName: './output/汇报PPT_商业版_20260426.pptx' });
console.log('✅ PPT已生成: output/汇报PPT_商业版_20260426.pptx');