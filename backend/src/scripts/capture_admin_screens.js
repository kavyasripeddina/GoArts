// GoArts AI - Headless Chrome Screenshot Capture via DevTools Protocol
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/kavya/.gemini/antigravity/brain/d163b70c-26ce-4f41-8671-492c57074dcd';
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const DEBUG_PORT = 9222;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendCdp(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 1000000);
  return new Promise((resolve, reject) => {
    const handler = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      } catch (e) {
        // ignore
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function run() {
  console.log('1. Authenticating admin user...');
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@goarts.ai', password: 'GoArts_Admin#2026$' }),
  });
  const { token, user } = await loginRes.json();
  console.log('   Admin Token obtained:', token ? 'YES' : 'NO');

  console.log('2. Launching Headless Chrome on port', DEBUG_PORT);
  const chromeProcess = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${DEBUG_PORT}`,
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--window-size=1440,960',
      'http://localhost:5173',
    ],
    { stdio: 'ignore' }
  );

  try {
    // Wait for CDP to be available
    let version = null;
    for (let i = 0; i < 20; i++) {
      try {
        const vRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
        version = await vRes.json();
        if (version) break;
      } catch (e) {
        await sleep(400);
      }
    }
    if (!version) {
      throw new Error('Chrome did not start debugging interface in time.');
    }

    const listRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
    const pages = await listRes.json();
    const targetPage = pages.find((p) => p.type === 'page');
    if (!targetPage) throw new Error('No page target found');

    console.log('3. Connecting WebSocket to target page...');
    const ws = new WebSocket(targetPage.webSocketDebuggerUrl);
    await new Promise((resolve) => ws.addEventListener('open', resolve));

    await sendCdp(ws, 'Page.enable');
    await sendCdp(ws, 'Runtime.enable');

    // Login via UI demo button or inject
    console.log('4. Logging in as Admin via UI demo flow...');
    await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:5173/login' });
    await sleep(2000);
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        const btns = Array.from(document.querySelectorAll('button'));
        const adminBtn = btns.find(b => b.innerText.trim() === 'Admin');
        if (adminBtn) adminBtn.click();
      `,
    });
    await sleep(500);
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.click();
      `,
    });
    await sleep(3000);

    // 5. Capture Notification Dropdown
    console.log('5. Clicking Bell icon to test notification dropdown...');
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        const bellBtn = document.querySelector('button[title*="Notifications"]');
        if (bellBtn) bellBtn.click();
      `,
    });
    await sleep(1500);
    const notifShot = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    const notifPath = path.join(ARTIFACT_DIR, 'screenshot_admin_notification_dropdown.png');
    fs.writeFileSync(notifPath, Buffer.from(notifShot.data, 'base64'));
    console.log(`   Saved screenshot_admin_notification_dropdown.png (${fs.statSync(notifPath).size} bytes)`);

    // 6. Capture Eye Symbol Modal (Talent Management)
    console.log('6. Clicking Eye symbol in Talent Management...');
    await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:5173/admin?tab=artists' });
    await sleep(2500);
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        const eyeBtns = Array.from(document.querySelectorAll('button[title*="View Full Profile"]'));
        if (eyeBtns.length > 0) eyeBtns[0].click();
      `,
    });
    await sleep(1500);
    const eyeShot = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    const eyePath = path.join(ARTIFACT_DIR, 'screenshot_artist_eye_modal.png');
    fs.writeFileSync(eyePath, Buffer.from(eyeShot.data, 'base64'));
    console.log(`   Saved screenshot_artist_eye_modal.png (${fs.statSync(eyePath).size} bytes)`);

    // 7. Capture Comprehensive Famous Artist Verification Dossier Modal
    console.log('7. Opening Junnu Famous Artist Dossier modal...');
    await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:5173/admin?tab=verifications' });
    await sleep(2500);
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        const cards = Array.from(document.querySelectorAll('div')).filter(d => d.innerText && d.innerText.includes('Junnu'));
        const junnuCard = cards[cards.length - 1];
        if (junnuCard) {
          const btn = junnuCard.querySelector('button') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Audit Dossier & Decide'));
          if (btn) btn.click();
        } else {
          const btns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('Audit Dossier & Decide'));
          if (btns.length > 0) btns[btns.length - 1].click();
        }
      `,
    });
    await sleep(1500);
    const dossierShot = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    const dossierPath = path.join(ARTIFACT_DIR, 'screenshot_famous_artist_dossier_modal.png');
    fs.writeFileSync(dossierPath, Buffer.from(dossierShot.data, 'base64'));
    console.log(`   Saved screenshot_famous_artist_dossier_modal.png (${fs.statSync(dossierPath).size} bytes)`);

    ws.close();
    console.log('🎉 All admin screenshots successfully captured!');
  } finally {
    chromeProcess.kill();
  }
}

run().catch((err) => {
  console.error('Screenshot script failed:', err);
  process.exit(1);
});
