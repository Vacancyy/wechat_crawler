import { EdgeTTS } from 'edge-tts';
import fs from 'fs';

const text = '你好，这是测试语音。欢迎使用公众号运营系统。';
const output = '/Users/chengxie/.openclaw/workspace/wechat-crawler/output/test_audio.mp3';

async function testTTS() {
  console.log('🧪 测试 Edge TTS...');
  
  const tts = new EdgeTTS();
  await tts.setVoice('zh-CN-XiaoxiaoNeural'); // 晓晓，女声
  
  const audio = await tts.tts(text);
  await tts.toFile(output);
  
  console.log(`✅ 音频生成成功: ${output}`);
  console.log(`📊 文件大小: ${fs.statSync(output).size} bytes`);
}

testTTS().catch(console.error);