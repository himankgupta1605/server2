const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

(async () => {
  const dir = __dirname, FPS = 30, DUR = 8, N = FPS * DUR;
  const only = process.argv[2]; // optional: still frame time -> png
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1500 } });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  await page.goto('file://' + path.join(dir, 'scene.html'));
  if (only) {
    await page.evaluate(t => draw(t), parseFloat(only));
    const b64 = await page.evaluate(() => document.getElementById('c').toDataURL('image/png').split(',')[1]);
    fs.writeFileSync(path.join(dir, 'still.png'), Buffer.from(b64, 'base64'));
    await browser.close(); return;
  }
  const out = path.join(dir, 'rama_sita.mp4');
  const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart', out], { stdio: ['pipe', 'ignore', 'inherit'] });
  for (let i = 0; i < N; i++) {
    const b64 = await page.evaluate(t => { draw(t); return document.getElementById('c').toDataURL('image/png').split(',')[1]; }, i / FPS);
    if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('done', out);
})();
