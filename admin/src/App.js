/**
 * 主应用组件 - 增强版
 */

import { renderSidebar } from './components/Sidebar.js';
import { renderHeader } from './components/Header.js';
import { renderDashboard, initDashboard } from './pages/Dashboard.js';

export function createApp() {
  const state = {
    currentPage: 'dashboard',
    sidebarCollapsed: false
  };

  function render() {
    return `
      <div class="app-container">
        ${renderSidebar(state)}
        <div class="main-content">
          ${renderHeader(state)}
          <div class="page-content">
            ${renderPage(state.currentPage)}
          </div>
        </div>
      </div>
    `;
  }

  function renderPage(page) {
    switch (page) {
      case 'dashboard': return renderDashboard();
      case 'articles': return '<h2>📰 内容管理</h2><p>开发中...</p>';
      case 'ads': return '<h2>📢 广告管理</h2><p>开发中...</p>';
      case 'crawler': return '<h2>🕷️ 爬虫任务</h2><p>开发中...</p>';
      case 'publish': return '<h2>🚀 发布管理</h2><p>开发中...</p>';
      case 'templates': return '<h2>📝 模板编辑</h2><p>开发中...</p>';
      case 'settings': return '<h2>⚙️ 系统设置</h2><p>开发中...</p>';
      default: return renderDashboard();
    }
  }

  function mount(selector) {
    const container = document.querySelector(selector);
    if (container) {
      container.innerHTML = render();
      bindEvents();
      
      // 初始化 Dashboard（如果是当前页面）
      if (state.currentPage === 'dashboard') {
        initDashboard();
      }
    }
  }

  function bindEvents() {
    // 侧边栏导航
    document.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        state.currentPage = el.dataset.page;
        mount('#app');
      });
    });

    // 折叠侧边栏
    const toggleBtn = document.querySelector('[data-toggle-sidebar]');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        state.sidebarCollapsed = !state.sidebarCollapsed;
        mount('#app');
      });
    }
  }

  return { mount, render };
}