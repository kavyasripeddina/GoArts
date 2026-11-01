// GoArts AI - Headless Chrome Screenshot Capture for Security Audit & Artist Sync
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/kavya/.gemini/antigravity/brain/d163b70c-26ce-4f41-8671-492c57074dcd';
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const DEBUG_PORT = 9223;

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
  console.log('1. Launching Headless Chrome on port', DEBUG_PORT);
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

    console.log('2. Connecting WebSocket to target page...');
    const ws = new WebSocket(targetPage.webSocketDebuggerUrl);
    await new Promise((resolve) => ws.addEventListener('open', resolve));

    await sendCdp(ws, 'Page.enable');
    await sendCdp(ws, 'Runtime.enable');

    // ── STEP A: Admin Security & Audit Tab ───────────────────────
    console.log('3. Logging in as Admin...');
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

    console.log('4. Navigating to Security & Audit Tab...');
    await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:5173/admin?tab=logs' });
    await sleep(3000);

    const auditShot = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    const auditPath = path.join(ARTIFACT_DIR, 'screenshot_admin_security_audit_tab.png');
    fs.writeFileSync(auditPath, Buffer.from(auditShot.data, 'base64'));
    console.log(`   Saved screenshot_admin_security_audit_tab.png (${fs.statSync(auditPath).size} bytes)`);

    // ── STEP B: Artist Dashboard with Rejection & Resubmit ─────────
    console.log('5. Logging out admin and logging in as Artist (Arjun)...');
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        localStorage.clear();
        sessionStorage.clear();
      `,
    });
    await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:5173/login' });
    await sleep(2000);

    // Enter Arjun's credentials directly
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        const emailInput = document.querySelector('input[type="email"]');
        const passInput = document.querySelector('input[type="password"]');
        if (emailInput && passInput) {
          // Use native input setter to trigger React synthetic events
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(emailInput, 'arjun@example.com');
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));

          nativeInputValueSetter.call(passInput, 'GoArts_Artist#2026$');
          passInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      `,
    });
    await sleep(500);
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.click();
      `,
    });
    await sleep(3500);

    console.log('6. Navigating to Artist Dashboard (Settings & KYC tab)...');
    await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:5173/artist/dashboard?tab=settings' });
    await sleep(3000);

    // Capture Artist Dashboard showing Rejected banner & notes
    const artistShot1 = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    const artistPath1 = path.join(ARTIFACT_DIR, 'screenshot_artist_dashboard_rejected.png');
    fs.writeFileSync(artistPath1, Buffer.from(artistShot1.data, 'base64'));
    console.log(`   Saved screenshot_artist_dashboard_rejected.png (${fs.statSync(artistPath1).size} bytes)`);

    // Click Resubmit Rectified Application button
    console.log('7. Opening Resubmit Rectified Application Form...');
    await sendCdp(ws, 'Runtime.evaluate', {
      expression: `
        const btns = Array.from(document.querySelectorAll('button'));
        const resubmitBtn = btns.find(b => b.innerText.includes('Resubmit Rectified Application') || b.innerText.includes('Update Application'));
        if (resubmitBtn) resubmitBtn.click();
      `,
    });
    await sleep(1500);

    const artistShot2 = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
    const artistPath2 = path.join(ARTIFACT_DIR, 'screenshot_artist_resubmit_form.png');
    fs.writeFileSync(artistPath2, Buffer.from(artistShot2.data, 'base64'));
    console.log(`   Saved screenshot_artist_resubmit_form.png (${fs.statSync(artistPath2).size} bytes)`);

    ws.close();
    console.log('🎉 All verification and security audit screenshots successfully captured!');
  } finally {
    chromeProcess.kill();
  }
}

run().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
