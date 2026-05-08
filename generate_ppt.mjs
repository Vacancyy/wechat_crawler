import PptxGenJS from 'pptxgenjs';

// 创建演示文稿
const pptx = new PptxGenJS();

// 设置主题
pptx.layout = 'LAYOUT_16x9';
pptx.title = '公众号运营系统汇报';
pptx.author = '技术汇报';
pptx.subject = '技术总监汇报';

// 定义颜色主题
const colors = {
  primary: '1E3A5F',    // 深蓝
  secondary: '3498DB',  // 浅蓝
  accent: 'E74C3C',     // 红色强调
  text: '2C3E50',       // 深灰文字
  light: 'ECF0F1',      // 浅灰背景
  success: '27AE60',    // 绿色成功
  warning: 'F39C12',    // 橙色警告
};

// ========== 第1页：标题页 ==========
let slide1 = pptx.addSlide();
slide1.addShape('rect', { x: 0, y: 0, w: '100%', h: '100%', fill: { color: colors.primary } });
slide1.addText('公众号运营系统', {
  x: 0.5, y: 2.5, w: 9, h: 1,
  fontSize: 44, bold: true, color: 'FFFFFF',
  align: 'center'
});
slide1.addText('技术总监汇报', {
  x: 0.5, y: 3.5, w: 9, h: 0.5,
  fontSize: 24, color: 'FFFFFF',
  align: 'center'
});
slide1.addText('日期：2026年4月17日', {
  x: 0.5, y: 4.5, w: 9, h: 1,
  fontSize: 18, color: 'FFFFFF',
  align: 'center'
});

// ========== 第2页：项目概述 ==========
let slide2 = pptx.addSlide();
slide2.addShape('rect', { x: 0, y: 0, w: '100%', h: 1.2, fill: { color: colors.primary } });
slide2.addText('项目概述', {
  x: 0.5, y: 0.35, w: 9, h: 0.5,
  fontSize: 32, bold: true, color: 'FFFFFF'
});

slide2.addText([
  { text: '项目目标\n', options: { bold: true, fontSize: 20, color: colors.primary } },
  { text: '自动化爬取"冯站长之家"每日新闻，生成公众号发布素材\n\n', options: { fontSize: 16, color: colors.text } },
  { text: '核心功能\n', options: { bold: true, fontSize: 20, color: colors.primary } },
  { text: '• 每天07:00自动爬取新闻内容\n', options: { fontSize: 16, color: colors.text } },
  { text: '• 自动过滤广告图片和推广文字\n', options: { fontSize: 16, color: colors.text } },
  { text: '• 图片入库 + HTML生成\n', options: { fontSize: 16, color: colors.text } },
  { text: '• 管理后台可视化操作\n\n', options: { fontSize: 16, color: colors.text } },
  { text: '当前状态\n', options: { bold: true, fontSize: 20, color: colors.primary } },
  { text: '✅ 核心功能已完成，定时任务稳定运行\n', options: { fontSize: 16, color: colors.success } },
], { x: 0.5, y: 1.8, w: 9, h: 4 });

// ========== 第3页：系统架构 ==========
let slide3 = pptx.addSlide();
slide3.addShape('rect', { x: 0, y: 0, w: '100%', h: 1.2, fill: { color: colors.primary } });
slide3.addText('系统架构', {
  x: 0.5, y: 0.35, w: 9, h: 0.5,
  fontSize: 32, bold: true, color: 'FFFFFF'
});

// 架构流程图
const archData = [
  { x: 0.3, y: 2, w: 1.8, h: 0.9, fill: { color: colors.secondary }, text: '定时触发\n07:00' },
  { x: 2.3, y: 2, w: 1.8, h: 0.9, fill: { color: colors.accent }, text: '爬虫模块\nCDP' },
  { x: 4.3, y: 2, w: 1.8, h: 0.9, fill: { color: colors.success }, text: '数据入库\nSQLite' },
  { x: 6.3, y: 2, w: 1.8, h: 0.9, fill: { color: colors.primary }, text: 'Express API\n端口3000' },
  { x: 8.3, y: 2, w: 1.4, h: 0.9, fill: { color: colors.warning }, text: '管理后台' },
];

archData.forEach(item => {
  slide3.addShape('rect', { x: item.x, y: item.y, w: item.w, h: item.h, fill: item.fill, line: { color: 'FFFFFF', width: 2 } });
  slide3.addText(item.text, { x: item.x, y: item.y, w: item.w, h: item.h, fontSize: 12, color: 'FFFFFF', align: 'center', valign: 'middle' });
});

// 箭头连接
slide3.addShape('rightArrow', { x: 2.1, y: 2.3, w: 0.2, h: 0.3, fill: { color: colors.text } });
slide3.addShape('rightArrow', { x: 4.1, y: 2.3, w: 0.2, h: 0.3, fill: { color: colors.text } });
slide3.addShape('rightArrow', { x: 6.1, y: 2.3, w: 0.2, h: 0.3, fill: { color: colors.text } });
slide3.addShape('rightArrow', { x: 8.1, y: 2.3, w: 0.2, h: 0.3, fill: { color: colors.text } });

// 技术栈列表
slide3.addText([
  { text: '技术栈\n', options: { bold: true, fontSize: 16, color: colors.primary } },
  { text: 'Node.js + Puppeteer CDP + Express + SQLite\n', options: { fontSize: 14, color: colors.text } },
  { text: 'OpenClaw Cron + Chrome浏览器\n', options: { fontSize: 14, color: colors.text } },
], { x: 0.3, y: 3.2, w: 9.5, h: 1.5 });

// ========== 第4页：技术选型说明（关键页面）==========
let slide4 = pptx.addSlide();
slide4.addShape('rect', { x: 0, y: 0, w: '100%', h: 1.2, fill: { color: colors.primary } });
slide4.addText('技术选型说明', {
  x: 0.5, y: 0.35, w: 9, h: 0.5,
  fontSize: 32, bold: true, color: 'FFFFFF'
});

// Puppeteer CDP 详细说明（左侧大卡片）
slide4.addShape('rect', { x: 0.3, y: 1.6, w: 4.5, h: 3.2, fill: { color: colors.light }, line: { color: colors.accent, width: 3 } });
slide4.addText('Puppeteer CDP', { x: 0.3, y: 1.7, w: 4.5, h: 0.5, fontSize: 20, bold: true, color: colors.accent, align: 'center' });
slide4.addText([
  { text: '什么是 CDP？\n', options: { bold: true, fontSize: 14, color: colors.primary } },
  { text: 'Chrome DevTools Protocol\nChrome 浏览器底层控制协议\n\n', options: { fontSize: 12, color: colors.text } },
  { text: '为什么需要？\n', options: { bold: true, fontSize: 14, color: colors.primary } },
  { text: '微信图片需 Cookie 认证\nPython requests 直接请求 → 403 禁止\n\n', options: { fontSize: 12, color: colors.text } },
  { text: '解决方案\n', options: { bold: true, fontSize: 14, color: colors.primary } },
  { text: '连接已登录的 Chrome (端口 18800)\n在页面上下文执行 fetch\n自动继承浏览器登录态 Cookie\n', options: { fontSize: 12, color: colors.success } },
], { x: 0.5, y: 2.3, w: 4.1, h: 2.4 });

// SQLite 和 OpenClaw Cron（右侧两小卡片）
slide4.addShape('rect', { x: 5, y: 1.6, w: 4.5, h: 1.5, fill: { color: colors.light }, line: { color: colors.success, width: 2 } });
slide4.addText('SQLite', { x: 5, y: 1.7, w: 4.5, h: 0.4, fontSize: 18, bold: true, color: colors.success, align: 'center' });
slide4.addText([
  { text: '数据量小（每天1篇），无需安装服务器\n', options: { fontSize: 12, color: colors.text } },
  { text: '一个文件，部署简单，后期可迁移 MySQL', options: { fontSize: 12, color: colors.text } },
], { x: 5.2, y: 2.2, w: 4.1, h: 0.8 });

slide4.addShape('rect', { x: 5, y: 3.3, w: 4.5, h: 1.5, fill: { color: colors.light }, line: { color: colors.secondary, width: 2 } });
slide4.addText('OpenClaw Cron', { x: 5, y: 3.4, w: 4.5, h: 0.4, fontSize: 18, bold: true, color: colors.secondary, align: 'center' });
slide4.addText([
  { text: 'OpenClaw 内置定时任务调度系统\n', options: { fontSize: 12, color: colors.text } },
  { text: '可视化管理（界面启用/禁用/查看历史）\n', options: { fontSize: 12, color: colors.text } },
  { text: '子会话隔离运行，自动推送结果', options: { fontSize: 12, color: colors.text } },
], { x: 5.2, y: 3.9, w: 4.1, h: 0.8 });

// 底部对比表格
slide4.addShape('rect', { x: 0.3, y: 4.95, w: 9.4, h: 0.9, fill: { color: colors.primary } });
slide4.addText('选型对比：CDP vs Python | SQLite vs MySQL | OpenClaw Cron vs 系统 crontab', {
  x: 0.3, y: 5.05, w: 9.4, h: 0.7,
  fontSize: 13, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle'
});

// ========== 第5页：核心技术难点 ==========
let slide5 = pptx.addSlide();
slide5.addShape('rect', { x: 0, y: 0, w: '100%', h: 1.2, fill: { color: colors.primary } });
slide5.addText('核心技术难点', {
  x: 0.5, y: 0.35, w: 9, h: 0.5,
  fontSize: 32, bold: true, color: 'FFFFFF'
});

// 三个难点卡片
const difficulties = [
  {
    title: '难点一：微信图片 Cookie 认证',
    problem: '微信图片 URL 需要登录态\nPython requests → 403 Forbidden',
    solution: 'Puppeteer CDP 方案',
    detail: '• 连接已登录 Chrome (端口 18800)\n• 在页面上下文执行 fetch\n• 自动继承浏览器 Cookie',
    result: '图片下载成功率 100%',
    color: colors.accent
  },
  {
    title: '难点二：搜狗搜索反爬',
    problem: '搜狗对未登录用户\n返回空搜索结果',
    solution: 'Fallback URL 机制',
    detail: '• 缓存上次成功的 URL\n• 搜索失败时自动使用\n• 成功后更新缓存',
    result: '即使搜索失败也能爬取',
    color: colors.warning
  },
  {
    title: '难点三：广告图片识别',
    problem: '文章夹杂大量广告\n标题图/二维码/推广封面',
    solution: '尺寸特征检测',
    detail: '• 标题图：宽高比 > 2\n• 二维码：宽 > 700 且接近正方形\n• 推广图：宽 500-800 且扁平',
    result: '自动跳过 + 关键词匹配',
    color: colors.secondary
  },
];

difficulties.forEach((diff, i) => {
  const x = 0.3 + i * 3.2;
  const y = 1.6;
  
  // 标题
  slide5.addShape('rect', { x: x, y: y, w: 3, h: 0.5, fill: { color: diff.color } });
  slide5.addText(diff.title, { x: x, y: y + 0.05, w: 3, h: 0.4, fontSize: 12, bold: true, color: 'FFFFFF', align: 'center' });
  
  // 问题
  slide5.addText('问题', { x: x, y: y + 0.6, w: 3, h: 0.3, fontSize: 11, bold: true, color: colors.accent });
  slide5.addText(diff.problem, { x: x, y: y + 0.85, w: 3, h: 0.6, fontSize: 10, color: colors.text });
  
  // 解决方案
  slide5.addText('方案', { x: x, y: y + 1.55, w: 3, h: 0.3, fontSize: 11, bold: true, color: colors.success });
  slide5.addText(diff.solution, { x: x, y: y + 1.8, w: 3, h: 0.35, fontSize: 10, bold: true, color: colors.success });
  slide5.addText(diff.detail, { x: x, y: y + 2.1, w: 3, h: 1, fontSize: 9, color: colors.text });
  
  // 结果
  slide5.addShape('rect', { x: x, y: y + 3.15, w: 3, h: 0.35, fill: { color: colors.light }, line: { color: colors.success, width: 1 } });
  slide5.addText('✓ ' + diff.result, { x: x, y: y + 3.2, w: 3, h: 0.25, fontSize: 10, bold: true, color: colors.success, align: 'center' });
});

// 底部技术原理图示意
slide5.addText('核心原理：CDP 让代码控制已登录浏览器 → 继承 Cookie → 访问需登录的网站', {
  x: 0.3, y: 5.1, w: 9.4, h: 0.4,
  fontSize: 12, color: colors.primary, align: 'center'
});

// ========== 第6页：已完成功能 ==========
let slide6 = pptx.addSlide();
slide6.addShape('rect', { x: 0, y: 0, w: '100%', h: 1.2, fill: { color: colors.primary } });
slide6.addText('已完成功能', {
  x: 0.5, y: 0.35, w: 9, h: 0.5,
  fontSize: 32, bold: true, color: 'FFFFFF'
});

const features = [
  ['自动爬取', 'Chrome CDP + 搜狗搜索 + Fallback', '✅'],
  ['图片过滤', '尺寸检测跳过标题图/二维码/推广图', '✅'],
  ['广告过滤', '关键词匹配自动跳过推广文字', '✅'],
  ['数据入库', 'SQLite存储文章+图片元数据', '✅'],
  ['定时任务', 'OpenClaw Cron每天07:00自动运行', '✅'],
  ['管理后台', '图片编辑/模板配置/文章预览', '✅'],
  ['API接口', '9个RESTful端点供前端调用', '✅'],
  ['模块化配置', 'JSON配置文件管理所有规则', '✅'],
];

slide6.addTable(features, {
  x: 0.3, y: 1.6, w: 9.4, h: 3.5,
  fontSize: 14,
  color: colors.text,
  border: { type: 'solid', pt: 1, color: colors.light },
  colW: [2, 6.2, 1.2],
  fontFace: 'Microsoft YaHei',
});

// ========== 第7页：运行数据 ==========
let slide7 = pptx.addSlide();
slide7.addShape('rect', { x: 0, y: 0, w: '100%', h: 1.2, fill: { color: colors.primary } });
slide7.addText('运行数据', {
  x: 0.5, y: 0.35, w: 9, h: 0.5,
  fontSize: 32, bold: true, color: 'FFFFFF'
});

// 数据卡片
const statsCards = [
  { label: '文章总数', value: '12篇', color: colors.secondary },
  { label: '连续天数', value: '8天', color: colors.success },
  { label: '图片处理', value: '100+张', color: colors.accent },
  { label: 'API端点', value: '9个', color: colors.primary },
];

statsCards.forEach((card, i) => {
  const x = 0.5 + i * 2.4;
  slide7.addShape('rect', { x: x, y: 2, w: 2.2, h: 1.8, fill: { color: card.color }, line: { color: 'FFFFFF', width: 3 } });
  slide7.addText(card.label, { x: x, y: 2.2, w: 2.2, h: 0.4, fontSize: 14, color: 'FFFFFF', align: 'center' });
  slide7.addText(card.value, { x: x, y: 2.7, w: 2.2, h: 0.8, fontSize: 32, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
});

slide7.addText('自动爬取成功率：100%（最近8次运行全部成功）', {
  x: 0.5, y: 4.2, w: 9, h: 0.5,
  fontSize: 16, bold: true, color: colors.success, align: 'center'
});

// ========== 第8页：商业价值（新增）==========
let slide8 = pptx.addSlide();
slide8.addShape('rect', { x: 0, y: 0, w: '100%', h: 1.2, fill: { color: colors.primary } });
slide8.addText('商业价值', {
  x: 0.5, y: 0.35, w: 9, h: 0.5,
  fontSize: 32, bold: true, color: 'FFFFFF'
});

// ROI对比卡片
slide8.addText('效率对比', { x: 0.3, y: 1.7, w: 3, h: 0.4, fontSize: 16, bold: true, color: colors.primary });

const efficiencyData = [
  ['指标', '人工操作', '自动化', '提升'],
  ['每日耗时', '30-45分钟', '全自动', '节省100%'],
  ['错误率', '易遗漏/遗漏广告', '规则过滤', '降低90%'],
  ['人力成本', '需要专人', '无人值守', '节省人力'],
  ['扩展成本', '每增加一个需培训', '配置复制', '低成本扩展'],
];

slide8.addTable(efficiencyData, {
  x: 0.3, y: 2.2, w: 4.5, h: 2.5,
  fontSize: 11,
  color: colors.text,
  border: { type: 'solid', pt: 1, color: colors.light },
  colW: [1.2, 1.3, 1.3, 1.2],
  fontFace: 'Microsoft YaHei',
});

// 商业意义卡片
slide8.addShape('rect', { x: 5, y: 1.6, w: 4.5, h: 3.1, fill: { color: colors.light }, line: { color: colors.success, width: 2 } });
slide8.addText('商业意义', { x: 5, y: 1.7, w: 4.5, h: 0.4, fontSize: 16, bold: true, color: colors.success, align: 'center' });
slide8.addText([
  { text: '运营效率提升\n', options: { bold: true, fontSize: 12, color: colors.primary } },
  { text: '每天节省30-45分钟人工操作\n可用于内容策划、数据分析\n\n', options: { fontSize: 11, color: colors.text } },
  { text: '降低运营风险\n', options: { bold: true, fontSize: 12, color: colors.primary } },
  { text: '规则化过滤，减少遗漏广告\n统一模板，保证发布质量\n\n', options: { fontSize: 11, color: colors.text } },
  { text: '可扩展性\n', options: { bold: true, fontSize: 12, color: colors.primary } },
  { text: '架构可复用于其他公众号\n支持多平台分发（头条/知乎）', options: { fontSize: 11, color: colors.text } },
], { x: 5.2, y: 2.2, w: 4.1, h: 2.4 });

// ========== 第9页：战略价值（新增）==========
let slide9 = pptx.addSlide();
slide9.addShape('rect', { x: 0, y: 0, w: '100%', h: 1.2, fill: { color: colors.primary } });
slide9.addText('战略价值', {
  x: 0.5, y: 0.35, w: 9, h: 0.5,
  fontSize: 32, bold: true, color: 'FFFFFF'
});

// 战略定位
slide9.addShape('rect', { x: 0.3, y: 1.6, w: 9.4, h: 0.6, fill: { color: colors.light }, line: { color: colors.primary, width: 2 } });
slide9.addText('定位：内容自动化基础设施，支撑未来运营规模化', {
  x: 0.3, y: 1.7, w: 9.4, h: 0.5,
  fontSize: 14, bold: true, color: colors.primary, align: 'center', valign: 'middle'
});

// 三列战略价值
const strategyItems = [
  {
    title: '技术复用',
    items: ['CDP方案可用于其他微信内容源', '爬虫框架可适配其他平台', '模块化配置可快速复制'],
    color: colors.secondary
  },
  {
    title: '业务扩展',
    items: ['多公众号批量运营', '多平台内容分发', '内容数据沉淀'],
    color: colors.success
  },
  {
    title: '团队赋能',
    items: ['运营人员专注策划', '减少重复劳动', '新人快速上手'],
    color: colors.warning
  },
];

strategyItems.forEach((item, i) => {
  const x = 0.3 + i * 3.2;
  slide9.addShape('rect', { x: x, y: 2.5, w: 3, h: 0.5, fill: { color: item.color } });
  slide9.addText(item.title, { x: x, y: 2.55, w: 3, h: 0.4, fontSize: 14, bold: true, color: 'FFFFFF', align: 'center' });
  slide9.addText(item.items.map(it => '• ' + it).join('\n'), {
    x: x + 0.1, y: 3.1, w: 2.8, h: 1.5,
    fontSize: 11, color: colors.text
  });
});

// 长期愿景
slide9.addText('长期愿景：打造内容自动化平台，支撑公司内容运营矩阵', {
  x: 0.3, y: 4.8, w: 9.4, h: 0.5,
  fontSize: 13, bold: true, color: colors.primary, align: 'center'
});

// ========== 第10页：后续规划与资源需求（合并）==========
let slide10 = pptx.addSlide();
slide10.addShape('rect', { x: 0, y: 0, w: '100%', h: 1.2, fill: { color: colors.primary } });
slide10.addText('后续规划与资源需求', {
  x: 0.5, y: 0.35, w: 9, h: 0.5,
  fontSize: 28, bold: true, color: 'FFFFFF'
});

// 左侧：三阶段规划
slide10.addText('规划阶段', { x: 0.3, y: 1.5, w: 4.5, h: 0.4, fontSize: 14, bold: true, color: colors.primary });

const plans = [
  { stage: '短期（1-2周）', items: ['服务器持久化', '通知配置', '关键词优化'], color: colors.secondary },
  { stage: '中期（1-2月）', items: ['自动发布', '多公众号支持', '数据分析'], color: colors.success },
  { stage: '长期（3+月）', items: ['AI摘要生成', '多平台分发', '运营矩阵'], color: colors.warning },
];

plans.forEach((plan, i) => {
  const y = 1.9 + i * 1.0;
  slide10.addShape('rect', { x: 0.3, y: y, w: 1.5, h: 0.5, fill: { color: plan.color } });
  slide10.addText(plan.stage, { x: 0.3, y: y + 0.05, w: 1.5, h: 0.4, fontSize: 10, bold: true, color: 'FFFFFF', align: 'center' });
  slide10.addText(plan.items.map(it => '• ' + it).join('  '), { x: 1.9, y: y, w: 2.8, h: 0.5, fontSize: 9, color: colors.text });
});

// 右侧：资源需求
slide10.addText('资源需求', { x: 5, y: 1.5, w: 4.5, h: 0.4, fontSize: 14, bold: true, color: colors.primary });

const resources = [
  { category: '权限申请', items: '公众号API权限 + 服务器部署权限', color: colors.secondary },
  { category: '配置支持', items: '推送渠道 + 持久化部署', color: colors.success },
  { category: '时间投入', items: '开发1-2周 + 维护每周1小时', color: colors.warning },
];

resources.forEach((res, i) => {
  const y = 1.9 + i * 0.7;
  slide10.addShape('rect', { x: 5, y: y, w: 1.2, h: 0.4, fill: { color: res.color } });
  slide10.addText(res.category, { x: 5, y: y + 0.05, w: 1.2, h: 0.3, fontSize: 9, bold: true, color: 'FFFFFF', align: 'center' });
  slide10.addText(res.items, { x: 6.3, y: y, w: 3.2, h: 0.4, fontSize: 9, color: colors.text });
});

// 底部：成本与收益
slide10.addShape('rect', { x: 0.3, y: 4.0, w: 9.4, h: 1.4, fill: { color: colors.light }, line: { color: colors.primary, width: 2 } });
slide10.addText([
  { text: '成本：API调用 ~50元/月 | 维护 ~2小时/月', options: { fontSize: 12, bold: true, color: colors.text } },
  { text: '\n收益：每天节省30-45分钟 → 月节省~15小时人力', options: { fontSize: 12, bold: true, color: colors.success } },
], { x: 0.4, y: 4.1, w: 9.2, h: 1.2, align: 'center', valign: 'middle' });

// ========== 第11页：风险与挑战 ==========
let slide11 = pptx.addSlide();
slide11.addShape('rect', { x: 0, y: 0, w: '100%', h: 1.2, fill: { color: colors.accent } });
slide11.addText('风险与挑战', {
  x: 0.5, y: 0.35, w: 9, h: 0.5,
  fontSize: 32, bold: true, color: 'FFFFFF'
});

// 风险列表
const risks = [
  { risk: '搜狗搜索反爬', impact: '搜索可能返回空结果', solution: 'Fallback URL 备用机制', status: '已解决' },
  { risk: '微信登录态过期', impact: 'Chrome Cookie失效', solution: '需手动重新登录浏览器', status: '可接受' },
  { risk: '通知推送失败', impact: '结果无法自动推送', solution: '需配置推送渠道', status: '待处理' },
  { risk: '服务器手动启动', impact: '重启后需手动启动', solution: '配置 PM2/LaunchAgent', status: '待处理' },
];

// 风险表格
slide11.addText('已识别风险', { x: 0.3, y: 1.7, w: 9, h: 0.4, fontSize: 16, bold: true, color: colors.primary });

const riskTableData = [
  ['风险项', '影响', '应对方案', '状态'],
  ...risks.map(r => [r.risk, r.impact, r.solution, r.status])
];

slide11.addTable(riskTableData, {
  x: 0.3, y: 2.2, w: 9.4, h: 2.5,
  fontSize: 12,
  color: colors.text,
  border: { type: 'solid', pt: 1, color: colors.light },
  colW: [2.2, 2.5, 3.2, 1.5],
  fontFace: 'Microsoft YaHei',
});

// 底部说明
slide11.addShape('rect', { x: 0.3, y: 4.8, w: 9.4, h: 0.8, fill: { color: colors.light }, line: { color: colors.success, width: 2 } });
slide11.addText('核心风险已解决，剩余问题均为配置层面，不影响爬虫运行', {
  x: 0.3, y: 4.9, w: 9.4, h: 0.6,
  fontSize: 13, bold: true, color: colors.success, align: 'center', valign: 'middle'
});

// ========== 第12页：完全自动化差距分析 ==========
let slide12 = pptx.addSlide();
slide12.addShape('rect', { x: 0, y: 0, w: '100%', h: 1.2, fill: { color: colors.primary } });
slide12.addText('完全自动化差距分析', {
  x: 0.5, y: 0.35, w: 9, h: 0.5,
  fontSize: 28, bold: true, color: 'FFFFFF'
});

// 目标说明
slide12.addShape('rect', { x: 0.3, y: 1.5, w: 9.4, h: 0.5, fill: { color: colors.light }, line: { color: colors.primary, width: 2 } });
slide12.addText('最终目标：爬虫自动运行 → 内容自动入库 → 自动发布到公众号（无人值守）', {
  x: 0.3, y: 1.55, w: 9.4, h: 0.4,
  fontSize: 13, bold: true, color: colors.primary, align: 'center', valign: 'middle'
});

// 当前状态 vs 目标差距表格
const gapTableData = [
  ['环节', '当前状态', '目标状态', '差距', '需要做的工作'],
  ['定时爬取', '✅ 已完成', '自动07:00运行', '无', ''],
  ['内容入库', '✅ 已完成', 'SQLite存储', '无', ''],
  ['图片处理', '✅ 已完成', '自动过滤+编辑', '无', ''],
  ['服务器运行', '⚠ 手动启动', '持久化运行', '有差距', '配置PM2'],
  ['通知推送', '⚠ 配置问题', '自动推送结果', '有差距', '配置推送渠道'],
  ['公众号发布', '❌ 未实现', '自动发布', '主要差距', '申请API权限+开发'],
];

slide12.addTable(gapTableData, {
  x: 0.3, y: 2.2, w: 9.4, h: 3,
  fontSize: 10,
  color: colors.text,
  border: { type: 'solid', pt: 1, color: colors.light },
  colW: [1.5, 1.5, 1.5, 1.2, 3.7],
  fontFace: 'Microsoft YaHei',
});

// 底部总结
slide12.addText([
  { text: '核心差距：公众号自动发布需要 API 权限申请 + 功能开发\n', options: { fontSize: 12, bold: true, color: colors.accent } },
  { text: '预计完成时间：获得权限后 1-2 周', options: { fontSize: 12, color: colors.text } },
], { x: 0.3, y: 5.3, w: 9.4, h: 0.6, align: 'center' });

// ========== 第13页：总结 ==========
let slide13 = pptx.addSlide();
slide13.addShape('rect', { x: 0, y: 0, w: '100%', h: 1.2, fill: { color: colors.primary } });
slide13.addText('总结', {
  x: 0.5, y: 0.35, w: 9, h: 0.5,
  fontSize: 32, bold: true, color: 'FFFFFF'
});

slide13.addText([
  { text: '核心成果\n', options: { bold: true, fontSize: 20, color: colors.primary } },
  { text: '✅ 完整自动化流程：定时爬取 → 数据入库 → 管理后台\n', options: { fontSize: 16, color: colors.text } },
  { text: '✅ 技术方案可靠：Puppeteer CDP 解决微信图片认证\n', options: { fontSize: 16, color: colors.text } },
  { text: '✅ 8天连续运行，100%成功率\n\n', options: { fontSize: 16, color: colors.text } },
  { text: '商业价值\n', options: { bold: true, fontSize: 20, color: colors.success } },
  { text: '• 每天节省30-45分钟人工操作\n', options: { fontSize: 16, color: colors.text } },
  { text: '• 降低运营风险，规则化过滤\n', options: { fontSize: 16, color: colors.text } },
  { text: '• 架构可复用，支撑业务扩展\n\n', options: { fontSize: 16, color: colors.text } },
  { text: '下一步：完善部署配置，推进自动发布，探索多平台分发', options: { fontSize: 14, color: colors.secondary } },
], { x: 0.5, y: 1.8, w: 9, h: 4 });

// ========== 第14页：谢谢 ==========
let slide14 = pptx.addSlide();
slide14.addShape('rect', { x: 0, y: 0, w: '100%', h: '100%', fill: { color: colors.primary } });
slide14.addText('谢谢！', {
  x: 0.5, y: 2.2, w: 9, h: 1,
  fontSize: 48, bold: true, color: 'FFFFFF', align: 'center'
});
slide14.addText('欢迎提问 & Demo演示', {
  x: 0.5, y: 3.5, w: 9, h: 0.5,
  fontSize: 24, color: colors.light, align: 'center'
});
slide14.addText('管理后台：http://localhost:3000', {
  x: 0.5, y: 4.2, w: 9, h: 0.4,
  fontSize: 16, color: colors.light, align: 'center'
});

// 生成文件
const outputPath = './output/公众号运营系统汇报_20260417.pptx';
await pptx.writeFile({ fileName: outputPath });

console.log(`✅ PPT已生成: ${outputPath}`);