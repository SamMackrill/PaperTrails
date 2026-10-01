// Optional desktop verification. Native Chromium CDP; no npm/build dependency.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, mkdtemp, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, relative, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root = resolve(process.argv[2] || fileURLToPath(new URL('../../', import.meta.url)));
const output = resolve(process.env.PAPERTRAILS_AUDIT_DIR || join(tmpdir(), 'papertrails-prototype-audit'));
await mkdir(output, { recursive: true });
const browser = process.env.PAPERTRAILS_BROWSER || [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/chromium', '/usr/bin/google-chrome'
].find(existsSync);
if (!browser) throw new Error('Set PAPERTRAILS_BROWSER to a Chromium executable');
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const target = resolve(root, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`);
    const rel = relative(root, target);
    if (rel.startsWith('..') || rel.includes(':')) { response.writeHead(403).end(); return; }
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.yaml': 'text/yaml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' }[extname(target)] || 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store' }); response.end(await readFile(target));
  } catch { response.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;
const profile = await mkdtemp(join(tmpdir(), 'papertrails-browser-'));
const child = spawn(browser, ['--headless=new', '--disable-gpu', '--no-first-run', `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const delay = ms => new Promise(r => setTimeout(r, ms));
let socket;
const pending = new Map(); let sequence = 0;
const errors = [];
try {
  let port;
  for (let i = 0; i < 150; i++) {
    try { port = Number((await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); break; } catch { await delay(100); }
  }
  if (!port) throw new Error('Chromium did not expose its local debugging endpoint');
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r, reject) => { socket.onopen = r; socket.onerror = reject; });
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const job = pending.get(message.id); if (!job) return;
      pending.delete(message.id); clearTimeout(job.timer);
      if (message.error) job.reject(new Error(JSON.stringify(message.error))); else job.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text + ': ' + (message.params.exceptionDetails.exception?.description || ''));
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 30000);
    pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
  });
  await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const until = async expression => {
    let lastError;
    for (let i = 0; i < 150; i++) {
      try {
        if (await evaluate(expression)) return;
      } catch (error) {
        lastError = error;
      }
      await delay(100);
    }
    throw new Error(`Page readiness failed: ${expression}${lastError ? ` (${lastError.message})` : ''}`);
  };
  const navigate = async (path, ready = 'document.querySelector("#timeline-loading")?.hidden') => {
    await evaluate('window.__auditStale = true');
    await send('Page.navigate', { url: origin + path });
    await until(`!window.__auditStale && document.readyState !== 'loading' && (${ready})`);
  };
  const viewport = async (width, height) => { await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 1024 }); await delay(150); };
  const screenshot = async name => { const capture = await send('Page.captureScreenshot', { format: 'png' }); await writeFile(join(output, name), Buffer.from(capture.data, 'base64')); };
  await viewport(1440, 900);
  await send('Network.setBlockedURLs', { urls: ['*landscape-b-*.png'] });
  await navigate('/?fallback=1#context=landscape');
  await until('document.querySelectorAll(".tapestry-scene[data-art-rendered=true]").length > 0 && [...document.querySelectorAll(".tapestry-scene[data-art-rendered=true]")].every(e => e.dataset.artFallback === "original")');
  assert.equal(await evaluate('document.querySelectorAll(".tapestry-thread").length'), 25);
  await send('Network.setBlockedURLs', { urls: [] });
  await navigate('/');
  assert.ok(await evaluate('document.querySelectorAll(".publication").length > 100'));
  // One fixed chronological material is pleated without moving or swapping art.
  for (const style of ['landscape', 'tapestry']) {
    await navigate(`/?style-audit=${style}#context=${style}`);
    assert.equal(await evaluate('document.querySelector("#tapestryToggle").dataset.contextMode'), style);
    if (style === 'tapestry') {
      assert.ok(await evaluate('[...document.querySelectorAll(".tapestry-caption-date")].every(e => e.textContent === "")'));
      assert.ok(await evaluate('[...document.querySelectorAll(".tapestry-caption-title")].every(e => e.lang === "la" && !/\\d/.test(e.textContent))'));
      assert.equal(await evaluate('document.querySelectorAll("[data-quiet-scene]").length'), 0);
    } else {
      assert.ok(await evaluate('document.querySelectorAll("[data-quiet-scene]").length > 0'));
      assert.match(await evaluate('document.querySelector(".tapestry-caption-date").textContent'), /1400/);
    }
    await until('document.querySelector(".tapestry-ribbon")?.dataset.artReady==="true" || document.querySelector(".tapestry-ribbon")?.dataset.artReady==="fallback"');
    await evaluate(`window.__auditClothFaces=[...document.querySelectorAll('.tapestry-cloth-face')];window.__auditDates=[...document.querySelectorAll('.tapestry-thread')].map(e=>[e.dataset.startYear,e.dataset.endYear]);window.__auditArtHeight=document.querySelector('.tapestry-scene').clientHeight;window.__auditSourceBoxes=[...document.querySelectorAll('.tapestry-definitions svg[viewBox],.tapestry-cloth-face svg')].map(e=>e.getAttribute('viewBox'));`);
    assert.ok(await evaluate('window.__auditClothFaces.length > 21'));
    assert.ok(await evaluate(`window.__auditClothFaces.every(e=>{const m=new DOMMatrixReadOnly(getComputedStyle(e).transform);return m.a===1&&m.d===1})`));
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    const previousZoom = await evaluate('document.querySelector("#zoom-slider").value');
    await evaluate(`const slider=document.querySelector('#zoom-slider');slider.value=slider.max;slider.dispatchEvent(new Event('input',{bubbles:true}));`);
    assert.ok(await evaluate(`[...document.querySelectorAll('.tapestry-scene')].every(scene => scene.dataset.foldOpen === '1.0000')`));
    assert.ok(await evaluate(`[...document.querySelectorAll('.tapestry-cloth-face')].every(face => {const m=new DOMMatrixReadOnly(getComputedStyle(face).transform);return Number(face.style.getPropertyValue('--fold-shade') || 0)===0 && m.a===1 && m.d===1 && Math.abs(Number(face.dataset.exposedWidth)-parseFloat(face.style.width))<.001})`));
    assert.ok(await evaluate('window.__auditClothFaces.every(e=>e.isConnected)'));
    assert.equal(await evaluate('document.querySelector(".tapestry-scene").clientHeight'), await evaluate('window.__auditArtHeight'));
    assert.ok(await evaluate('JSON.stringify(window.__auditDates)===JSON.stringify([...document.querySelectorAll(".tapestry-thread")].map(e=>[e.dataset.startYear,e.dataset.endYear]))'));
    assert.ok(await evaluate(`JSON.stringify(window.__auditSourceBoxes)===JSON.stringify([...document.querySelectorAll('.tapestry-definitions svg[viewBox],.tapestry-cloth-face svg')].map(e=>e.getAttribute('viewBox')))`));
    assert.ok(await evaluate(`[...document.querySelectorAll('.tapestry-definitions image')].every(image=>{const m=image.getCTM();return Math.abs(m.a-m.d)<1e-7})`));
    assert.ok(await evaluate(`(()=>{const a=document.querySelector('[data-item-key="event:event-20"]'),b=document.querySelector('[data-item-key="event:event-16"]');return Math.abs(b.getBoundingClientRect().width/a.getBoundingClientRect().width-4)<.01})()`));
    assert.equal(await evaluate(`document.querySelector('.tapestry-ribbon').dataset.zoomLimit`), '32');
    await evaluate(`window.__auditFixedCloth=[...document.querySelectorAll('.tapestry-scene')].map(e=>[e.style.left,e.style.width]);`);
    const from = await evaluate(`document.querySelector('.zoom-level').textContent`);
    await evaluate(`document.querySelector('#pan-later').click()`);
    assert.notEqual(await evaluate(`document.querySelector('.zoom-level').textContent`), from);
    assert.ok(await evaluate(`JSON.stringify(window.__auditFixedCloth)===JSON.stringify([...document.querySelectorAll('.tapestry-scene')].map(e=>[e.style.left,e.style.width]))`));
    await evaluate(`document.querySelector('#pan-earlier').click();document.querySelector('#zoom-slider').value=${JSON.stringify(previousZoom)};document.querySelector('#zoom-slider').dispatchEvent(new Event('input',{bubbles:true}));`);
    await send('Emulation.setEmulatedMedia', { features: [] });
  }
  for (const mode of ['bars', 'landscape', 'tapestry']) {
    await evaluate('document.querySelector("#tapestryToggle").click()');
    assert.equal(await evaluate('document.querySelector("#tapestryToggle").dataset.contextMode'), mode);
    assert.equal(await evaluate('Boolean(document.querySelector(".tapestry-ribbon"))'), mode !== 'bars');
    if (mode === 'bars') assert.equal(await evaluate('document.querySelectorAll(".event-band").length'), 25);
  }
  await navigate('/?style-audit=complete#context=landscape');
  await evaluate('document.querySelector("#trail-select").value="understanding-charge";document.querySelector("#trail-select").dispatchEvent(new Event("change"));');
  assert.equal(await evaluate('document.querySelectorAll("[data-trail-stop]").length'), 8);
  assert.ok(await evaluate('document.querySelectorAll(".scientist-node, .scientist-cluster").length > 0'));
  assert.equal(await evaluate('document.querySelectorAll(".scientist-photo").length'), 0);
  await screenshot('trail-dark.png');
  await evaluate('document.querySelector("#trail-next").focus()');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', unmodifiedText: '\r', windowsVirtualKeyCode: 13 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  assert.equal(await evaluate('document.querySelector("#trail-progress").textContent'), '2 / 8');
  const target = await evaluate(`(()=>{const r=document.querySelector('[data-trail-stop=signs]').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...target, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...target, button: 'left', clickCount: 1 });
  assert.equal(await evaluate('document.querySelector("#trail-progress").textContent'), '1 / 8');
  const visited = await evaluate(`(()=>{let seen=[];for(let i=0;i<8;i++){seen.push({progress:document.querySelector('#trail-progress').textContent,title:document.querySelector('#trail-content h2').textContent,stop:document.querySelector('[aria-current=step]').dataset.trailStop});document.querySelector('#trail-next').click();}return seen})()`);
  assert.deepEqual(visited.map(s => s.stop), ['signs', 'force', 'induction', 'light', 'field', 'waves', 'carrier', 'unit']);
  assert.ok(await evaluate('document.querySelector("#trail-next").disabled'));
  await evaluate('document.querySelector("#fit-view").click()');
  assert.ok(await evaluate(`(()=>{const view=document.querySelector('#timeline-container').getBoundingClientRect();return [...document.querySelectorAll('[data-trail-stop]')].every(node=>{const r=node.getBoundingClientRect();return r.left>=view.left-1 && r.right<=view.right+1 && r.top>=view.top-1})})()`));
  await evaluate('document.querySelector(".trail-evidence").open=true;document.querySelector("#trail-close").click()');
  assert.ok(await evaluate('document.querySelector("#trail-panel").hidden && document.querySelectorAll("[data-trail-stop]").length===8'));
  await evaluate('document.querySelector("#trail-explain").click();document.querySelector("#trail-overview").click();document.querySelector("#mode-toggle").click()');
  await delay(150); await screenshot('trail-light.png');
  // The selected stop and explanation survive a shared URL and page reload.
  await evaluate('document.querySelector("[data-trail-stop=induction]").click()');
  const hash = await evaluate('location.hash');
  await navigate(`/?shared=1${hash}`);
  assert.equal(await evaluate('document.querySelector("[aria-current=step]").dataset.trailStop'), 'induction');
  assert.match(await evaluate('document.querySelector(".trail-date-note").textContent'), /1831.*1832/);
  await evaluate('document.querySelector("#trail-content > button").click()'); await delay(200);
  assert.match(await evaluate('document.querySelector("#detail-title").textContent'), /Series I/);
  assert.match(await evaluate('document.querySelector("#detail-panel").textContent'), /1832/);
  await navigate('/?legacy=1#item=publication:deBroglie:0');
  assert.match(await evaluate('document.querySelector("#detail-title").textContent'), /Recherches sur la théorie des quanta/);
  await navigate('/?phone=1#from=1731&to=1933&trail=understanding-charge&stop=carrier&explain=1');
  await viewport(390, 844);
  assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'));
  assert.equal(await evaluate('document.querySelector("#trail-progress").textContent'), '7 / 8');
  await screenshot('trail-phone.png');
  await viewport(1440, 900);
  await navigate('/print-trail.html?trail=understanding-charge', 'document.querySelector("#print-content")?.dataset.ready==="true"');
  assert.equal(await evaluate('document.querySelectorAll("article").length'), 8);
  assert.equal(await evaluate('document.querySelectorAll(".trail-sources a").length'), 27);
  const pdf = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true });
  await writeFile(join(output, 'charge-handout.pdf'), Buffer.from(pdf.data, 'base64'));
  await navigate('/print-trail.html?trail=missing', 'document.querySelector("#print-content [role=alert]")');
  assert.ok(await evaluate('document.querySelector("#print").disabled'));
  assert.deepEqual(errors, []);
  await writeFile(join(output, 'audit.json'), JSON.stringify({ at: new Date().toISOString(), visited, errors, result: 'passed' }, null, 2));
  console.log(`Browser audit passed; artifacts: ${output}`);
} finally {
  socket?.close(); server.close(); child.kill();
}
