/**
 * 侧边栏组件
 */

export function renderSidebar(state) {
  const collapsed = state.sidebarCollapsed;
  const currentPage = state.currentPage;

  const menuItems = [
    { id: 'dashboard', icon: '📊', label: '仪表盘' },
    { id: 'articles', icon: '📰', label: '内容管理' },
    { id: 'ads', icon: '📢', label: '广告管理' },
    { id: 'crawler', icon: '🕷️', label: '爬虫任务' },
    { id: 'publish', icon: '🚀', label: '发布管理' },
    { id: 'templates', icon: '📝', label: '模板编辑' },
    { id: 'settings', icon: '⚙️', label: '系统设置' },
  ];

  const menuHtml = menuItems.map(item => `
    <a href="#" 
       class="menu-item ${currentPage === item.id ? 'active' : ''}" 
       data-page="${item.id}">
      <span class="menu-icon">${item.icon}</span>
      <span class="menu-label" ${collapsed ? 'style="display:none"' : ''}>${item.label}</span>
    </a>
  `).join('');

  return `
    <aside class="sidebar ${collapsed ? 'collapsed' : ''}">
      <div class="sidebar-header">
        <h1>${collapsed ? '📱' : '📱 公众号运营'}</h1>
      </div>
      <nav class="sidebar-menu">
        ${menuHtml}
      </nav>
    </aside>
  `;
}