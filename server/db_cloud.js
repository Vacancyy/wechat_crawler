/**
 * 数据库模块 - SQLite（云端版）
 */

import Database from 'better-sqlite3';
import path from 'path';

// 数据库文件路径
const dbPath = path.join(process.cwd(), 'data/wechat_crawler.db');

// 创建数据库连接
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      title TEXT,
      content TEXT,
      html_path TEXT,
      text_path TEXT,
      source_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER,
      filename TEXT NOT NULL,
      original_url TEXT,
      hash TEXT,
      size_kb INTEGER,
      local_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS ads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      position TEXT UNIQUE NOT NULL,
      product_name TEXT,
      description TEXT,
      price TEXT,
      original_price TEXT,
      features TEXT,
      gift TEXT,
      buy_link TEXT,
      image_path TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_articles_date ON articles(date);
    CREATE INDEX IF NOT EXISTS idx_images_article ON images(article_id);
    CREATE INDEX IF NOT EXISTS idx_images_hash ON images(hash);
  `);
  console.log('✅ 数据库初始化完成:', dbPath);
}

export function getArticles(limit = 100, offset = 0) {
  return db.prepare(`
    SELECT * FROM articles 
    ORDER BY 
      CAST(SUBSTR(date, 1, INSTR(date, '年') - 1) AS INTEGER) DESC,
      CAST(SUBSTR(date, INSTR(date, '年') + 1, INSTR(date, '月') - INSTR(date, '年') - 1) AS INTEGER) DESC,
      CAST(REPLACE(SUBSTR(date, INSTR(date, '月') + 1), '日', '') AS INTEGER) DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
}

export function getArticleByDate(date) {
  return db.prepare('SELECT * FROM articles WHERE date = ?').get(date);
}

export function createArticle(article) {
  const stmt = db.prepare(`
    INSERT INTO articles (date, title, content, html_path, text_path, source_url)
    VALUES (@date, @title, @content, @html_path, @text_path, @source_url)
  `);
  return stmt.run(article).lastInsertRowid;
}

export function deleteArticle(id) {
  return db.prepare('DELETE FROM articles WHERE id = ?').run(id).changes > 0;
}

export function getArticleCount() {
  return db.prepare('SELECT COUNT(*) as count FROM articles').get().count;
}

export function getImagesByArticle(articleId) {
  return db.prepare('SELECT * FROM images WHERE article_id = ? ORDER BY id').all(articleId);
}

export function createImage(image) {
  const stmt = db.prepare(`
    INSERT INTO images (article_id, filename, original_url, hash, size_kb, local_path)
    VALUES (@article_id, @filename, @original_url, @hash, @size_kb, @local_path)
  `);
  return stmt.run(image).lastInsertRowid;
}

export function createImages(images) {
  const stmt = db.prepare(`
    INSERT INTO images (article_id, filename, original_url, hash, size_kb, local_path)
    VALUES (@article_id, @filename, @original_url, @hash, @size_kb, @local_path)
  `);
  const insertMany = db.transaction((items) => {
    for (const item of items) stmt.run(item);
  });
  insertMany(images);
}

export function getImageByHash(hash) {
  return db.prepare('SELECT * FROM images WHERE hash = ?').get(hash);
}

export function getImageCount() {
  return db.prepare('SELECT COUNT(*) as count FROM images').get().count;
}

export function getAds() {
  return db.prepare('SELECT * FROM ads ORDER BY position').all();
}

export function getAdByPosition(position) {
  return db.prepare('SELECT * FROM ads WHERE position = ?').get(position);
}

export function upsertAd(ad) {
  const stmt = db.prepare(`
    INSERT INTO ads (position, product_name, description, price, original_price, features, gift, buy_link, image_path)
    VALUES (@position, @product_name, @description, @price, @original_price, @features, @gift, @buy_link, @image_path)
    ON CONFLICT(position) DO UPDATE SET
      product_name = @product_name,
      description = @description,
      price = @price,
      original_price = @original_price,
      features = @features,
      gift = @gift,
      buy_link = @buy_link,
      image_path = @image_path,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(ad);
}

export { db };
