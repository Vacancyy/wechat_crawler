#!/bin/bash
# 同步公众号运营系统数据到云端
# 包含：数据库 + output目录（HTML/图片/音频） + 模板图片

echo "🚀 开始同步数据到云端..."

# 配置
SSH_HOST="tecent"
REMOTE_DIR="/home/ubuntu/wechat-crawler"
LOCAL_DIR="$HOME/.openclaw/workspace/wechat-crawler"
DB_LOCAL="$HOME/.openclaw/data/wechat_crawler.db"
DB_REMOTE="$REMOTE_DIR/data/wechat_crawler.db"

# 1. 同步数据库（包含WAL文件）
echo "📦 同步数据库..."
scp "$DB_LOCAL" "$DB_LOCAL-wal" "$DB_LOCAL-shm" "$SSH_HOST:$REMOTE_DIR/data/"
echo "  ✓ 数据库同步完成"

# 2. 同步 output/common（通用模板图片）
echo "🖼️ 同步模板图片..."
rsync -avz "$LOCAL_DIR/output/common" "$SSH_HOST:$REMOTE_DIR/output/" 2>/dev/null
echo "  ✓ 模板图片同步完成"

# 3. 同步所有日期目录（HTML + 图片 + 音频 + 其他文件）
echo "📁 同步所有文章目录..."
rsync -avz --include='*/' \
  --include='完整版.html' \
  --include='新闻内容.txt' \
  --include='images.json' \
  --include='audio.mp3' \
  --include='images/' \
  --include='images/*' \
  --exclude='*' \
  "$LOCAL_DIR/output/" "$SSH_HOST:$REMOTE_DIR/output/" 2>/dev/null
echo "  ✓ 文章目录同步完成"

# 4. 重启云端服务并刷新数据
echo "🔄 重启云端服务..."
ssh "$SSH_HOST" "cd $REMOTE_DIR && pm2 restart wechat-crawler" 2>/dev/null
sleep 2
echo "  ✓ 云端服务已重启"

echo "✅ 全部同步完成！"
echo "📊 云端文章数：$(ssh $SSH_HOST "curl -s 'http://localhost:3000/api/articles' | jq '.total'" 2>/dev/null)"
