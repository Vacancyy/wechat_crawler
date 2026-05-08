#!/usr/bin/env node
/**
 * 语音播报生成脚本
 * 使用 Edge TTS（免费）生成文章音频
 */

import { exec, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const TTS_VOICE = 'zh-CN-XiaoxiaoNeural'; // 晓晓，女声，适合新闻播报

/**
 * 生成音频文件
 * @param {string} text - 要朗读的文字
 * @param {string} outputPath - 输出音频路径
 * @returns {Promise<boolean>} - 是否成功
 */
export async function generateAudio(text, outputPath) {
  if (!text || text.length < 20) {
    console.log('⚠️ 文字太短，跳过音频生成');
    return false;
  }
  
  // 限制文字长度（TTS 有长度限制）
  const maxLength = 5000; // 不限制，读完全文
  const truncatedText = text.length > maxLength 
    ? text.substring(0, maxLength) + '...更多内容请阅读原文。' 
    : text;
  
  const finalText = truncatedText; // 直接使用传入的文本（已由调用方过滤为纯新闻）
  
  console.log('🎙️ 生成语音播报...');
  console.log(`  文字长度: ${finalText.length} 字`);
  
  const command = `python3 -m edge_tts --voice ${TTS_VOICE} --text "${finalText.replace(/"/g, "'").replace(/\n/g, ' ')}" --write-media "${outputPath}"`;
  
  return new Promise((resolve) => {
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.log(`❌ 音频生成失败: ${error.message}`);
        resolve(false);
      } else {
        const size = fs.statSync(outputPath).size;
        console.log(`✅ 音频生成成功: ${outputPath}`);
        console.log(`📊 文件大小: ${(size / 1024).toFixed(1)} KB`);
        
        // 转码：高质量版(44.1kHz/128kbps)用于云端播放 + 微信素材版(16kHz/动态比特率)控制在2MB内
        const tmpHQ = outputPath.replace('.mp3', '_hq.mp3');
        const tmpWX = outputPath.replace('.mp3', '_wx.mp3');
        try {
          // 获取音频时长，计算微信版最大比特率
          const probeOut = execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${outputPath}" 2>/dev/null`).toString().trim();
          const durationSec = parseFloat(probeOut) || 600;
          const maxBitrate = Math.floor((2 * 1024 * 8) / durationSec) - 4; // 2MB限制，留4kbps余量
          const wxBitrate = Math.max(16, Math.min(maxBitrate, 48)); // 动态计算，不低于16k，不高于48k
          
          // 高质量版（云端播放用）
          execSync(`ffmpeg -y -i "${outputPath}" -ar 44100 -ab 128k -ac 1 "${tmpHQ}" 2>/dev/null`);
          // 微信素材版（2MB内，44.1kHz保证音质）
          execSync(`ffmpeg -y -i "${outputPath}" -ar 22050 -b:a ${wxBitrate}k -ac 1 -codec:a libmp3lame "${tmpWX}" 2>/dev/null`);
          
          // 保留高质量版为主文件
          execSync(`mv "${tmpHQ}" "${outputPath}"`);
          
          const hqSize = fs.statSync(outputPath).size;
          const wxSize = fs.statSync(tmpWX).size;
          console.log(`🎵 高质量版 44.1kHz/128kbps (${(hqSize / 1024).toFixed(1)} KB)`);
          console.log(`🎵 微信素材版 22050Hz/${wxBitrate}kbps CBR (${(wxSize / 1024).toFixed(1)} KB, ${durationSec.toFixed(0)}秒)`);
        } catch (e) {
          console.log('⚠️ ffmpeg转码跳过（未安装ffmpeg）');
          resolve(true); return;
        }
        
        resolve(true);
      }
    });
  });
}

/**
 * 在 HTML 中嵌入音频播放器
 * @param {string} html - 原 HTML 内容
 * @param {string} audioPath - 音频文件路径（相对路径）
 * @returns {string} - 包含音频播放器的 HTML
 */
export function embedAudioPlayer(html, audioPath) {
  const audioPlayer = `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; margin: 15px 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(102,126,234,0.3);">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <div style="display: flex; align-items: center;">
          <span style="font-size: 28px; margin-right: 10px;">🎧</span>
          <span style="color: #fff; font-size: 16px; font-weight: 500;">语音播报</span>
        </div>
        <span style="color: rgba(255,255,255,0.8); font-size: 12px;">点击播放全文</span>
      </div>
      <audio controls style="width: 100%; height: 40px; border-radius: 8px;">
        <source src="${audioPath}" type="audio/mpeg">
        您的浏览器不支持音频播放
      </audio>
    </div>
  `;
  
  // 在内容区域开头插入音频播放器
  return html.replace('<div class="content">', `<div class="content">${audioPlayer}`);
}

// 测试
if (process.argv[1].includes('generate_audio.mjs')) {
  const testText = '你好，这是测试语音播报功能。欢迎使用公众号运营系统。';
  const testOutput = './output/test_audio.mjs.mp3';
  generateAudio(testText, testOutput).then(success => {
    if (success) {
      console.log('🎉 测试完成');
    }
  });
}