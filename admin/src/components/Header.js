/**
 * 头部组件
 */

export function renderHeader(state) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  });

  return `
    <header class="header">
      <div class="header-left">
        <button class="toggle-btn" data-toggle-sidebar>☰</button>
        <h2>${getPageTitle(state.currentPage)}</h2>
      </div>
      <div class="header-right">
        <span class="date">${dateStr}</span>
        <span class="user">👤 管理员</span>
      </div>
    </header>
  `;
}

function getPageTitle(page) {
  const titles = {
    dashboard: '仪表盘',
    articles: '内容管理',
    ads: '广告管理',
    crawler: '爬虫任务',
    publish: '发布管理',
    templates: '模板编辑',
    settings: '系统设置'
  };
  return titles[page] || '仪表盘';
}