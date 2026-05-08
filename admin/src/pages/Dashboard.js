/**
 * 仪表盘页面 - 增强版（带 API 调用）
 */

let statsCache = null;

export function renderDashboard() {
  return `
    <div class="dashboard" id="dashboard-page">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📰</div>
          <div class="stat-info">
            <div class="stat-value" id="stat-articles">--</div>
            <div class="stat-label">文章总数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📷</div>
          <div class="stat-info">
            <div class="stat-value" id="stat-images">--</div>
            <div class="stat-label">图片数量</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📢</div>
          <div class="stat-info">
            <div class="stat-value" id="stat-ads">2</div>
            <div class="stat-label">广告位</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🚀</div>
          <div class="stat-info">
            <div class="stat-value" id="stat-status">--</div>
            <div class="stat-label">爬虫状态</div>
          </div>
        </div>
      </div>

      <div class="quick-actions">
        <h3>快捷操作</h3>
        <div class="action-buttons">
          <button class="action-btn primary" id="btn-crawl">
            🕷️ 立即爬取
          </button>
          <button class="action-btn" id="btn-preview">
            👁️ 预览文章
          </button>
          <button class="action-btn" id="btn-ads">
            📢 广告配置
          </button>
        </div>
        <div class="crawl-status" id="crawl-status" style="margin-top:15px;color:#666;"></div>
      </div>

      <div class="recent-activity">
        <h3>最近活动</h3>
        <div class="activity-list" id="activity-list">
          <div class="activity-item">
            <span class="activity-time">加载中...</span>
            <span class="activity-desc">正在获取数据</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 初始化 Dashboard（绑定事件和加载数据）
export function initDashboard() {
  loadStats();
  bindDashboardEvents();
}

// 加载统计数据
async function loadStats() {
  try {
    const res = await fetch('/api/crawler/stats');
    const data = await res.json();
    
    if (data.success) {
      // 更新统计卡片
      document.getElementById('stat-articles').textContent = data.data.totalArticles || 0;
      document.getElementById('stat-images').textContent = data.data.totalImages || 0;
      document.getElementById('stat-status').textContent = 
        data.data.crawlerRunning ? '运行中' : '空闲';
      
      // 更新活动列表
      const activityList = document.getElementById('activity-list');
      if (data.data.todayArticle) {
        activityList.innerHTML = `
          <div class="activity-item">
            <span class="activity-time">今天</span>
            <span class="activity-desc">✅ 已爬取文章 (${data.data.todayArticle.date})</span>
          </div>
        `;
      } else {
        activityList.innerHTML = `
          <div class="activity-item">
            <span class="activity-time">今天</span>
            <span class="activity-desc">⚠️ 尚未爬取</span>
          </div>
        `;
      }
      
      statsCache = data.data;
    }
  } catch (err) {
    console.error('加载统计失败:', err);
    document.getElementById('crawl-status').textContent = '❌ 无法连接服务器';
  }
}

// 绑定事件
function bindDashboardEvents() {
  // 爬取按钮
  const crawlBtn = document.getElementById('btn-crawl');
  if (crawlBtn) {
    crawlBtn.addEventListener('click', async () => {
      const statusEl = document.getElementById('crawl-status');
      statusEl.textContent = '⏳ 启动爬虫...';
      crawlBtn.disabled = true;
      
      try {
        const res = await fetch('/api/crawler/run', { method: 'POST' });
        const data = await res.json();
        
        if (data.success) {
          statusEl.textContent = '✅ 爬虫已启动，请稍候...';
          // 轮询状态
          pollCrawlerStatus();
        } else {
          statusEl.textContent = '❌ ' + data.error;
          crawlBtn.disabled = false;
        }
      } catch (err) {
        statusEl.textContent = '❌ 启动失败';
        crawlBtn.disabled = false;
      }
    });
  }
  
  // 预览按钮
  const previewBtn = document.getElementById('btn-preview');
  if (previewBtn) {
    previewBtn.addEventListener('click', () => {
      // 打开最新的文章预览
      const today = new Date();
      const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
      window.open(`/output/${dateStr}/完整版.html`, '_blank');
    });
  }
  
  // 广告配置按钮
  const adsBtn = document.getElementById('btn-ads');
  if (adsBtn) {
    adsBtn.addEventListener('click', () => {
      // 切换到广告管理页面
      const adsMenuItem = document.querySelector('[data-page="ads"]');
      if (adsMenuItem) {
        adsMenuItem.click();
      }
    });
  }
}

// 轮询爬虫状态
function pollCrawlerStatus() {
  const statusEl = document.getElementById('crawl-status');
  const crawlBtn = document.getElementById('btn-crawl');
  
  let attempts = 0;
  const maxAttempts = 60; // 最多轮询 60 次（约 2 分钟）
  
  const poll = async () => {
    if (attempts >= maxAttempts) {
      statusEl.textContent = '⚠️ 状态查询超时';
      crawlBtn.disabled = false;
      return;
    }
    
    attempts++;
    
    try {
      const res = await fetch('/api/crawler/status');
      const data = await res.json();
      
      if (data.success) {
        statusEl.textContent = data.status.message || '运行中...';
        
        if (!data.status.running) {
          // 爬虫完成
          statusEl.textContent = '✅ ' + data.status.message;
          crawlBtn.disabled = false;
          // 重新加载统计
          loadStats();
          return;
        }
      }
    } catch (err) {}
    
    // 继续轮询
    setTimeout(poll, 2000);
  };
  
  poll();
}