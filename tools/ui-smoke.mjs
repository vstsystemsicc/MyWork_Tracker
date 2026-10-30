/**
 * UI smoke test + screenshots via the Chrome DevTools Protocol.
 * Usage: node tools/ui-smoke.mjs [baseUrl]
 * Requires a static server for the app (default http://127.0.0.1:5599/).
 */
import { spawn } from 'node:child_process';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const CHROME = process.env.CHROME_PATH ||
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = process.argv[2] || 'http://127.0.0.1:5599/';
const PORT = 9333;
const SHOTS = 'tools/shots';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForJson(url, timeoutMs = 20000) {
  const end = Date.now() + timeoutMs;
  let lastErr;
  while (Date.now() < end) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (err) {
      lastErr = err;
    }
    await sleep(150);
  }
  throw new Error(`Timed out waiting for ${url}: ${lastErr}`);
}

const profileDir = await mkdtemp(path.join(tmpdir(), 'mwt-chrome-'));
const chrome = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--hide-scrollbars',
  `--user-data-dir=${profileDir}`,
  `--remote-debugging-port=${PORT}`,
  '--window-size=430,932',
  'about:blank'
], { stdio: 'ignore' });

let ws;
let nextId = 0;
const pending = new Map();
const handlers = new Map();

function on(method, fn) {
  if (!handlers.has(method)) handlers.set(method, new Set());
  handlers.get(method).add(fn);
  return () => handlers.get(method).delete(fn);
}

function send(method, params = {}, sessionId) {
  const id = ++nextId;
  const payload = { id, method, params };
  if (sessionId) payload.sessionId = sessionId;
  ws.send(JSON.stringify(payload));
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, method });
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }
    }, 30000);
  });
}

function once(method, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`No ${method} within ${timeoutMs}ms`)), timeoutMs);
    const off = on(method, (params) => {
      clearTimeout(timer);
      off();
      resolve(params);
    });
  });
}

async function main() {
  const version = await waitForJson(`http://127.0.0.1:${PORT}/json/version`);
  ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });

  const problems = [];
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(`${msg.error.message}`));
      else resolve(msg.result);
      return;
    }
    if (msg.method) {
      if (msg.method === 'Runtime.exceptionThrown') {
        problems.push('EXCEPTION: ' + (msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text));
      }
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        problems.push('CONSOLE: ' + msg.params.args.map((a) => a.value ?? a.description).join(' '));
      }
      const set = handlers.get(msg.method);
      if (set) set.forEach((fn) => fn(msg.params));
    }
  });

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const S = (method, params) => send(method, params, sessionId);
  const events = (method) => new Promise((res) => {
    const off = on(method, (p) => { off(); res(p); });
  });

  async function evaluate(expression) {
    const result = await S('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
      userGesture: true
    });
    if (result.exceptionDetails) {
      throw new Error('Eval failed: ' + (result.exceptionDetails.exception?.description || result.exceptionDetails.text));
    }
    return result.result.value;
  }

  async function screenshot(name, opts = {}) {
    await sleep(350);
    const shot = await S('Page.captureScreenshot', {
      format: 'png',
      ...(opts.full ? { captureBeyondViewport: true } : {})
    });
    const file = path.join(SHOTS, name + '.png');
    await writeFile(file, Buffer.from(shot.data, 'base64'));
    console.log('  shot:', file);
  }

  async function scrollTo(y) {
    await evaluate(`window.scrollTo(0, ${Number(y) || 0})`);
    await sleep(300);
  }

  await S('Page.enable');
  await S('Runtime.enable');
  await S('Log.enable');
  await S('Emulation.setDeviceMetricsOverride', {
    width: 430, height: 932, deviceScaleFactor: 2, mobile: true
  });
  await S('Emulation.setTouchEmulationEnabled', { enabled: true });

  async function open(url) {
    const loaded = events('Page.loadEventFired');
    await S('Page.navigate', { url });
    await loaded;
    await sleep(500);
  }

  const checks = [];
  const check = (label, ok, detail) => {
    checks.push({ label, ok, detail });
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail && !ok ? ' -> ' + detail : ''}`);
  };

  // text of the dashboard/planner section with this heading (survives reloads)
  async function secText(title) {
    return evaluate(`(() => {
      const head = [...document.querySelectorAll('.section-head h2')]
        .find(h => h.textContent.trim().indexOf(${JSON.stringify(title)}) === 0);
      return head ? head.closest('section').innerText : '';
    })()`);
  }

  /* ------------------------------------------------------------ empty */
  console.log('\n[1] Empty dashboard');
  await open(APP_URL);
  check('dashboard rendered', await evaluate(`!!document.querySelector('.greeting h1')`));
  check('tab bar has 5 tabs', (await evaluate(`document.querySelectorAll('.tab').length`)) === 5);
  check('empty states shown', (await evaluate(`document.querySelectorAll('.empty').length`)) === 4);
  const emptyOrder = await evaluate(
    `[...document.querySelectorAll('.section-head h2')].map(h => h.textContent.replace(/\\d+$/, '').trim())`
  );
  check('empty order: tasks, work, completed, upcoming',
    JSON.stringify(emptyOrder) === JSON.stringify(["Today's tasks", "Today's work", 'Completed today', 'Upcoming']),
    JSON.stringify(emptyOrder));

  // "Plan for today" should open the task sheet already set to today
  await evaluate(`document.querySelector('.empty button[data-mode="task"]').click()`);
  await sleep(450);
  check('"Plan for today" pre-fills today', await evaluate(
    `document.querySelector('#f-date').value === MWT.Dates.today() && document.querySelector('.segmented button[data-mode="task"]').classList.contains('active')`
  ));
  await evaluate(`document.querySelector('[data-action="close-sheet"]').click()`);
  await sleep(420);
  const emptyText = await evaluate(`document.querySelector('.greeting').innerText`);
  console.log('  greeting:', JSON.stringify(emptyText));
  await screenshot('01-dashboard-empty');

  /* ------------------------------------------------------------- seed */
  console.log('\n[2] Seeded dashboard');
  await evaluate(`(() => {
    const D = MWT.Dates;
    const today = D.today();
    const now = Date.now();
    const iso = (min) => new Date(now + min * 60000).toISOString();
    const data = {
      version: 1,
      createdAt: iso(-60 * 24 * 30),
      projects: [
        { id: 'p-cookiejet', name: 'CookieJet', color: '#8b5cf6', createdAt: iso(-600), archived: false },
        { id: 'p-cnc', name: 'CNC Machine', color: '#38bdf8', createdAt: iso(-600), archived: false },
        { id: 'p-ca', name: 'CA_Controller', color: '#f472b6', createdAt: iso(-600), archived: false },
        { id: 'p-general', name: 'General', color: '#94a3b8', createdAt: iso(-600), archived: false }
      ],
      work: [
        { id: 'w1', title: 'Finished CookieJet cart module', description: 'Wired the add-to-cart flow, tested on a small phone screen and fixed the sticky footer overlap.', projectId: 'p-cookiejet', date: today, photos: [], createdAt: iso(-190), updatedAt: iso(-190) },
        { id: 'w2', title: 'Calibrated the CNC spindle', description: 'Ran three test passes; tolerance now within 0.02 mm.', projectId: 'p-cnc', date: today, photos: [], createdAt: iso(-75), updatedAt: iso(-75) },
        { id: 'w3', title: 'Refactored CA_Controller serial buffer', description: 'Old record from yesterday.', projectId: 'p-ca', date: D.addDays(today, -1), photos: [], createdAt: iso(-1500), updatedAt: iso(-1500) }
      ],
      tasks: [
        { id: 't1', title: 'Write the controller test plan', notes: 'Cover the new serial buffer path.', projectId: 'p-ca', dueDate: D.addDays(today, -1), priority: 'high', done: false, completedAt: null, completedOn: null, createdAt: iso(-3000), updatedAt: iso(-3000) },
        { id: 't2', title: 'Order stepper drivers', notes: '', projectId: 'p-cnc', dueDate: today, priority: 'medium', done: true, completedAt: iso(-40), completedOn: today, createdAt: iso(-2500), updatedAt: iso(-40) },
        { id: 't3', title: 'Review the cart UI on my phone', notes: '', projectId: 'p-cookiejet', dueDate: today, priority: 'high', done: false, completedAt: null, completedOn: null, createdAt: iso(-2000), updatedAt: iso(-2000) },
        { id: 't4', title: 'Prepare the monthly progress report', notes: '', projectId: 'p-general', dueDate: D.addDays(today, 2), priority: 'medium', done: false, completedAt: null, completedOn: null, createdAt: iso(-1800), updatedAt: iso(-1800) },
        { id: 't5', title: 'Sketch enclosure v2', notes: '', projectId: 'p-ca', dueDate: D.addDays(today, 6), priority: 'low', done: false, completedAt: null, completedOn: null, createdAt: iso(-1700), updatedAt: iso(-1700) }
      ],
      notes: []
    };
    localStorage.setItem('mwt.data.v1', JSON.stringify(data));
  })()`);
  const reloaded = events('Page.loadEventFired');
  await S('Page.reload');
  await reloaded;
  await sleep(600);

  check('greeting shows 2 things logged', /2 things logged today/.test(await evaluate(`document.querySelector('.greeting .sub').innerText`)));
  const stats = await evaluate(`[...document.querySelectorAll('.stat .num')].map(n => n.innerText)`);
  check('stat cards = 2 / 1 / 4 open', JSON.stringify(stats) === '["2","1","4"]', JSON.stringify(stats));
  check('progress ring 33%', (await evaluate(`document.querySelector('.ring .pct').innerText`)) === '33%');

  // helper: find a dashboard section by its heading
  await evaluate(`window.__sec = function (title) {
    var head = [...document.querySelectorAll('.section-head h2')].find(function (h) {
      return h.textContent.trim().indexOf(title) === 0;
    });
    return head ? head.closest('section') : null;
  }`);

  const order = await evaluate(
    `[...document.querySelectorAll('.section-head h2')].map(h => h.textContent.replace(/\\d+$/, '').trim())`
  );
  console.log('  section order:', JSON.stringify(order));
  check('today tasks come before completed',
    JSON.stringify(order) === JSON.stringify(["Today's tasks", "Today's work", "Completed today", 'Upcoming']),
    JSON.stringify(order));

  const todayTasks = await evaluate(`[...__sec("Today's tasks").querySelectorAll('.item-title')].map(e => e.innerText)`);
  console.log('  today tasks:', JSON.stringify(todayTasks));
  check('today tasks list overdue + today', JSON.stringify(todayTasks) ===
    '["Write the controller test plan","Review the cart UI on my phone"]', JSON.stringify(todayTasks));

  const workTitles = await evaluate(`[...__sec("Today's work").querySelectorAll('.item-title')].map(e => e.innerText)`);
  console.log('  today work:', JSON.stringify(workTitles));
  check('only today work listed (newest first)', JSON.stringify(workTitles) === '["Calibrated the CNC spindle","Finished CookieJet cart module"]', JSON.stringify(workTitles));

  const upcoming = await evaluate(`[...__sec('Upcoming').querySelectorAll('.item-title')].map(e => e.innerText)`);
  console.log('  upcoming:', JSON.stringify(upcoming));
  check('upcoming is future only, sorted', JSON.stringify(upcoming) ===
    '["Prepare the monthly progress report","Sketch enclosure v2"]',
    JSON.stringify(upcoming));
  check('overdue chip shown on today list', (await evaluate(`__sec("Today's tasks").querySelector('.chip.overdue').innerText`)) === '1d overdue');
  check('completed section shows ordered task', (await evaluate(`__sec('Completed today').querySelector('.item.is-done .item-title').innerText`)) === 'Order stepper drivers');
  console.log('  item meta line:', JSON.stringify(await evaluate(`document.querySelector('.item-sub').innerText`)));
  await screenshot('02a-dashboard-top');
  await scrollTo(760);
  await screenshot('02b-dashboard-mid');
  await scrollTo(2000);
  await screenshot('02c-dashboard-bottom');
  await scrollTo(0);

  /* ---------------------------------------------------------- add work */
  console.log('\n[3] Add work through the sheet');
  await evaluate(`document.querySelector('.fab').click()`);
  await sleep(450);
  check('sheet opened', await evaluate(`document.querySelector('#sheet').classList.contains('open')`));
  check('project chips rendered', (await evaluate(`document.querySelectorAll('.project-picker .p-chip').length`)) === 4);
  check('Project is the first field, then the day', (await evaluate(
    `[...document.querySelectorAll('#quick-form > .field > label')].map(l => l.textContent.trim()).slice(0, 2).join('|')`
  )) === 'Project|Day');
  check('work log defaults to today', await evaluate(`document.querySelector('#f-date').value === MWT.Dates.today()`));
  check('Today chip is active by default', await evaluate(`document.querySelector('.day-chip[data-offset="0"]').classList.contains('active')`));

  await evaluate(`document.querySelector('.day-chip[data-offset="1"]').click()`);
  await sleep(150);
  check('Tomorrow chip sets the day', await evaluate(`document.querySelector('#f-date').value === MWT.Dates.addDays(MWT.Dates.today(), 1)`));
  check('Tomorrow chip highlights', await evaluate(`document.querySelector('.day-chip[data-offset="1"]').classList.contains('active')`));
  await evaluate(`document.querySelector('.day-chip[data-offset="0"]').click()`);
  await sleep(150);
  check('Today chip brings the day back', await evaluate(`document.querySelector('#f-date').value === MWT.Dates.today()`));
  await screenshot('03-sheet-add');

  await evaluate(`(() => {
    document.querySelector('#f-title').value = 'Packed first CookieJet unit';
    document.querySelector('input[name="projectId"][value="p-cnc"]').checked = true;
    document.querySelector('#f-details').value = 'Boxed, labelled and photographed for the client.';
    document.querySelector('#quick-form').requestSubmit();
  })()`);
  await sleep(600);
  check('work count is now 3', (await evaluate(`document.querySelector('.stat .num').innerText`)) === '3');
  check('toast appeared', (await evaluate(`document.querySelector('.toast')?.innerText || ''`)).includes('Work saved'));
  check('new item on dashboard', (await evaluate(`document.querySelector('.view').innerText`)).includes('Packed first CookieJet unit'));
  check('saved under the chosen project', (await evaluate(`(() => {
    const row = [...document.querySelectorAll('.item')].find(r => r.innerText.includes('Packed first CookieJet unit'));
    return row ? row.querySelector('.chip').innerText.trim() : 'missing';
  })()`)) === 'CNC Machine');

  /* --------------------------------------------------- validation guard */
  console.log('\n[3b] Empty title is rejected');
  await evaluate(`document.querySelector('.fab').click()`);
  await sleep(450);
  await evaluate(`document.querySelector('#quick-form').requestSubmit()`);
  await sleep(250);
  check('validation message shown', await evaluate(`(() => {
    const e = document.querySelector('#f-error');
    return !!e && !e.hidden && e.innerText.trim().length > 5;
  })()`));
  check('sheet stays open', await evaluate(`document.querySelector('#sheet').classList.contains('open')`));
  check('nothing was saved', (await evaluate(`document.querySelectorAll('.stat .num')[0].innerText`)) === '3');
  await evaluate(`document.querySelector('[data-action="close-sheet"]').click()`);
  await sleep(450);

  /* ------------------------------------------------------- plan a task */
  console.log('\n[4] Plan a task');
  await evaluate(`document.querySelector('.fab').click()`);
  await sleep(400);
  check('last project is remembered', (await evaluate(`document.querySelector('input[name="projectId"]:checked').value`)) === 'p-cnc');
  await evaluate(`document.querySelector('.segmented button[data-mode="task"]').click()`);
  await sleep(200);
  check('task mode shows priority', await evaluate(`!document.querySelector('#f-priority-field').hidden`));
  const defaultDue = await evaluate(`document.querySelector('#f-date').value`);
  const expectedDue = await evaluate(`MWT.Dates.addDays(MWT.Dates.today(), 1)`);
  check('task defaults to tomorrow', defaultDue === expectedDue, defaultDue);
  check('Tomorrow chip follows the mode switch', await evaluate(`document.querySelector('.day-chip[data-offset="1"]').classList.contains('active')`));

  // a long task, set to a day further out
  await evaluate(`(() => {
    const d = document.querySelector('#f-date');
    d.value = MWT.Dates.addDays(MWT.Dates.today(), 10);
    d.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  check('custom day clears the quick chips', (await evaluate(`document.querySelectorAll('.day-chip.active').length`)) === 0);
  await screenshot('03b-sheet-task');
  await evaluate(`(() => {
    document.querySelector('#f-title').value = 'Test the new cart flow';
    document.querySelector('input[name="projectId"][value="p-cookiejet"]').checked = true;
    document.querySelector('#pri-high').checked = true;
    document.querySelector('#f-details').value = 'On a real phone, low bandwidth.';
    document.querySelector('#quick-form').requestSubmit();
  })()`);
  await sleep(600);
  check('planned task shows in upcoming', (await evaluate(`document.querySelector('.view').innerText`)).includes('Test the new cart flow'));

  const savedDay = await evaluate(`MWT.Store.getState().tasks.find(t => t.title === 'Test the new cart flow').dueDate`);
  const wantedDay = await evaluate(`MWT.Dates.addDays(MWT.Dates.today(), 10)`);
  check('task saved on the chosen day', savedDay === wantedDay, `${savedDay} != ${wantedDay}`);
  check('task saved under the chosen project', (await evaluate(`MWT.Store.getState().tasks.find(t => t.title === 'Test the new cart flow').projectId`)) === 'p-cookiejet');
  check('3 future tasks in upcoming', (await evaluate(`[...__sec('Upcoming').querySelectorAll('.item')].length`)) === 3);

  /* ----------------------------------------------------------- toggling */
  console.log('\n[5] Complete a task from the dashboard');
  const doneBefore = await evaluate(`document.querySelectorAll('.item.is-done').length`);
  await evaluate(`(() => {
    const rows = [...document.querySelectorAll('.item')];
    const row = rows.find(r => r.innerText.includes('Review the cart UI'));
    row.querySelector('.check').click();
  })()`);
  await sleep(600);
  const doneAfter = await evaluate(`document.querySelectorAll('.item.is-done').length`);
  check('completed count grew', doneAfter === doneBefore + 1, `${doneBefore} -> ${doneAfter}`);
  check('moved into Completed today', (await evaluate(`document.querySelector('.view').innerText`)).includes('Review the cart UI on my phone'));
  check('progress updated', (await evaluate(`document.querySelector('.ring .pct').innerText`)) !== '33%');

  /* ------------------------------------------------------------ detail */
  console.log('\n[6] Open a detail sheet');
  await evaluate(`(() => {
    const rows = [...document.querySelectorAll('.item')];
    const row = rows.find(r => r.innerText.includes('Finished CookieJet cart module'));
    row.querySelector('.item-btn').click();
  })()`);
  await sleep(450);
  const detailText = await evaluate(`document.querySelector('#sheet').innerText`);
  check('detail sheet has description', /Wired the add-to-cart flow/.test(detailText));
  check('detail sheet has delete', /Delete/.test(detailText));
  await screenshot('04-detail-sheet');

  // two-tap delete guard: first tap must only arm
  await evaluate(`document.querySelector('[data-action="delete-work"]').click()`);
  await sleep(200);
  check('delete asks for confirmation first', (await evaluate(`document.querySelector('[data-action="delete-work"]').innerText`)) === 'Tap again to delete');
  await evaluate(`document.querySelector('[data-action="close-sheet"]').click()`);
  await sleep(450);

  /* ------------------------------------------------------------ route */
  console.log('\n[7] Navigation');
  await evaluate(`location.hash = '#/log'`);
  await sleep(500);
  check('log screen rendered', (await evaluate(`document.querySelector('.page-head h1')?.innerText || ''`)) === 'Daily Work Log');
  check('log shows the day with entries', (await evaluate(`document.querySelectorAll('#log-body .item').length`)) >= 2);
  await screenshot('05-log-screen');
  await evaluate(`location.hash = '#/more'`);
  await sleep(400);
  check('more page rows', (await evaluate(`document.querySelectorAll('.view a.item').length`)) === 2);
  await screenshot('08-more-page');
  await evaluate(`location.hash = '#/home'`);
  await sleep(400);

  /* ------------------------------------------------------------ desktop */
  console.log('\n[8] Desktop layout');
  await S('Emulation.setDeviceMetricsOverride', {
    width: 1280, height: 900, deviceScaleFactor: 1, mobile: false
  });
  await sleep(500);
  await screenshot('06-desktop');
  const width = await evaluate(`document.querySelector('.app').getBoundingClientRect().width`);
  check('app column capped at 560px', width === 560, String(width));

  /* ------------------------------------------------------------- reload */
  console.log('\n[9] Persistence after reload');
  await S('Emulation.setDeviceMetricsOverride', {
    width: 430, height: 932, deviceScaleFactor: 2, mobile: true
  });
  const back = events('Page.loadEventFired');
  await S('Page.reload');
  await back;
  await sleep(600);
  check('records survived reload', (await evaluate(`document.querySelectorAll('.item').length`)) >= 5);
  check('new work persisted', (await evaluate(`document.querySelector('.view').innerText`)).includes('Packed first CookieJet unit'));
  if (/^https?:/.test(APP_URL)) {
    check('service worker registered (offline support)', await evaluate(
      `navigator.serviceWorker.getRegistrations().then(r => r.length > 0)`
    ));
  }

  /* --------------------------------------------------------- small phone */
  console.log('\n[10] Small phone (375x667)');
  await S('Emulation.setDeviceMetricsOverride', {
    width: 375, height: 667, deviceScaleFactor: 2, mobile: true
  });
  const smallLoad = events('Page.loadEventFired');
  await S('Page.reload');
  await smallLoad;
  await sleep(600);
  check('no horizontal overflow', await evaluate(`document.documentElement.scrollWidth <= window.innerWidth + 1`));
  await evaluate(`window.scrollTo(0, document.body.scrollHeight)`);
  await sleep(350);
  check('last item clears the nav at page bottom', await evaluate(`(() => {
    const last = [...document.querySelectorAll('.item')].pop();
    if (!last) return true;
    const nav = document.querySelector('.tabbar');
    return last.getBoundingClientRect().bottom <= nav.getBoundingClientRect().top;
  })()`));
  await evaluate(`window.scrollTo(0, 0)`);
  await sleep(300);

  await evaluate(`document.querySelector('.fab').click()`);
  await sleep(500);
  check('sheet fits or scrolls on small screen', await evaluate(`(() => {
    const s = document.querySelector('#sheet');
    const btn = document.querySelector('#f-submit');
    s.scrollTop = s.scrollHeight;
    const r = btn.getBoundingClientRect();
    return r.bottom <= window.innerHeight + 2 && r.bottom > 0;
  })()`));
  await screenshot('07-small-phone-sheet');
  await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`);
  await sleep(450);

  await evaluate(`location.hash = '#/more'`);
  await sleep(400);
  check('theme row fits a 375px screen', await evaluate(`document.documentElement.scrollWidth <= window.innerWidth + 1`));
  check('all 6 swatches visible on small screen', await evaluate(`(() => {
    const row = document.querySelector('.theme-row');
    return row && row.getBoundingClientRect().right <= window.innerWidth + 1;
  })()`));

  for (const route of ['plan', 'projects', 'ideas', 'history']) {
    await evaluate(`location.hash = '#/${route}'`);
    await sleep(400);
    check(route + ' fits a 375px screen', await evaluate(`document.documentElement.scrollWidth <= window.innerWidth + 1`));
  }

  /* -------------------------------------------------------- theme colour */
  console.log('\n[11] Theme colour');
  await S('Emulation.setDeviceMetricsOverride', {
    width: 430, height: 932, deviceScaleFactor: 2, mobile: true
  });
  const themeLoad = events('Page.loadEventFired');
  await S('Page.reload');
  await themeLoad;
  await sleep(500);
  await evaluate(`location.hash = '#/more'`);
  await sleep(400);
  check('6 theme swatches', (await evaluate(`document.querySelectorAll('.theme-swatch').length`)) === 6);
  check('purple is active by default', (await evaluate(`document.querySelector('.theme-swatch.active')?.dataset.theme`)) === 'purple');

  await evaluate(`document.querySelector('.theme-swatch[data-theme="blue"]').click()`);
  await sleep(350);
  check('blue theme applied', (await evaluate(`document.documentElement.dataset.theme`)) === 'blue');
  check('accent variable follows the theme', (await evaluate(
    `getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()`
  )) === '#3b82f6');
  check('blue swatch marked active', (await evaluate(`document.querySelector('.theme-swatch.active')?.dataset.theme`)) === 'blue');
  await screenshot('09-theme-more');

  await evaluate(`location.hash = '#/home'`);
  await sleep(450);
  await screenshot('10-theme-home');

  const themeReload = events('Page.loadEventFired');
  await S('Page.reload');
  await themeReload;
  await sleep(600);
  check('theme survives a reload', (await evaluate(`document.documentElement.dataset.theme`)) === 'blue');

  await evaluate(`location.hash = '#/more'`);
  await sleep(400);
  await evaluate(`document.querySelector('.theme-swatch[data-theme="purple"]').click()`);
  await sleep(300);
  check('switched back to purple', (await evaluate(`document.documentElement.dataset.theme`)) === 'purple');

  // visual sweep of every remaining theme
  const sweep = ['green', 'orange', 'pink', 'teal'];
  for (const theme of sweep) {
    const applied = await evaluate(
      `(() => { document.querySelector('.theme-swatch[data-theme="${theme}"]').click(); return document.documentElement.dataset.theme; })()`
    );
    check(theme + ' theme applies', applied === theme, applied);
    await evaluate(`location.hash = '#/home'`);
    await sleep(400);
    await screenshot('11-theme-' + theme);
    await evaluate(`location.hash = '#/more'`);
    await sleep(350);
  }
  await evaluate(`document.querySelector('.theme-swatch[data-theme="purple"]').click()`);
  await sleep(250);

  /* --------------------------------------------------------- work log */
  console.log('\n[12] Daily work log');
  await evaluate(`location.hash = '#/log'`);
  await sleep(500);

  check('date nav defaults to today', await evaluate(`document.querySelector('#log-date').value === MWT.Dates.today()`));
  const logTitles = await evaluate(`[...document.querySelectorAll('#log-body .item-title')].map(e => e.innerText)`);
  console.log('  today log:', JSON.stringify(logTitles.slice(0, 4)));
  check('today entries listed', logTitles.length >= 2, JSON.stringify(logTitles));

  await evaluate(`document.querySelector('[data-action="log-prev"]').click()`);
  await sleep(350);
  check('previous day loads', await evaluate(`document.querySelector('#log-date').value === MWT.Dates.addDays(MWT.Dates.today(), -1)`));
  check('yesterday has one entry', (await evaluate(`document.querySelectorAll('#log-body .item').length`)) === 1);
  check('day summary counts entries', (await evaluate(`document.querySelector('.day-meta').innerText`)).includes('1 entry'));
  await screenshot('12-log-yesterday');

  await evaluate(`(() => {
    const i = document.querySelector('#log-date');
    i.value = MWT.Dates.addDays(MWT.Dates.today(), -5);
    i.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await sleep(400);
  check('empty day has its own state', (await evaluate(`document.querySelector('#log-body').innerText`)).includes('Nothing logged on this day'));
  check('empty day still offers add', await evaluate(`!!document.querySelector('.add-day')`));

  await evaluate(`(() => {
    const i = document.querySelector('#log-date');
    i.value = MWT.Dates.addDays(MWT.Dates.today(), -1);
    i.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await sleep(400);

  await evaluate(`document.querySelector('.add-day').click()`);
  await sleep(500);
  check('composer prefilled with the viewed day', await evaluate(`document.querySelector('#f-date').value === MWT.Dates.addDays(MWT.Dates.today(), -1)`));
  check('photos field present in work mode', await evaluate(`!document.querySelector('#f-photos-field').hidden`));

  // attach a generated photo, the same way the phone would
  await evaluate(`(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 900; canvas.height = 600;
    const ctx = canvas.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 900, 600);
    g.addColorStop(0, '#8b5cf6'); g.addColorStop(1, '#22d3ee');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 900, 600);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 96px sans-serif'; ctx.fillText('TEST', 70, 360);
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    const file = new File([blob], 'site.png', { type: 'image/png' });
    const dt = new DataTransfer();
    dt.items.add(file);
    const input = document.querySelector('#f-photos');
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await sleep(1200);
  check('photo added to the composer', (await evaluate(`document.querySelectorAll('#photo-grid .photo-thumb').length`)) === 1);
  check('photo compressed to jpeg', await evaluate(`document.querySelector('#photo-grid img').src.startsWith('data:image/jpeg')`));
  await screenshot('13-composer-photo');

  await evaluate(`(() => {
    document.querySelector('#f-title').value = 'Poured the test slab';
    document.querySelector('#f-details').value = 'Cured overnight, photographed for the record.';
    document.querySelector('input[name="projectId"][value="p-cnc"]').checked = true;
    document.querySelector('#quick-form').requestSubmit();
  })()`);
  await sleep(900);

  check('new entry appears on its day', (await evaluate(`document.querySelector('#log-body').innerText`)).includes('Poured the test slab'));
  check('entry shows a photo thumbnail', (await evaluate(`document.querySelectorAll('#log-body .thumb').length`)) >= 1);
  check('day summary counts the photo', (await evaluate(`document.querySelector('.day-meta').innerText`)).includes('1 photo'));

  await evaluate(`(() => {
    const row = [...document.querySelectorAll('#log-body .item')].find(r => r.innerText.includes('Poured the test slab'));
    row.querySelector('.item-btn').click();
  })()`);
  await sleep(500);
  check('detail shows the photo grid', (await evaluate(`document.querySelectorAll('.detail-photos .photo-thumb').length`)) === 1);
  await screenshot('14-detail-photo');

  await evaluate(`document.querySelector('[data-action="edit-work"]').click()`);
  await sleep(500);
  check('edit composer prefilled', (await evaluate(`document.querySelector('#f-title').value`)) === 'Poured the test slab');
  check('edit keeps the photo', (await evaluate(`document.querySelectorAll('#photo-grid .photo-thumb').length`)) === 1);
  await evaluate(`(() => {
    document.querySelector('#f-title').value = 'Poured and finished the test slab';
    document.querySelector('#quick-form').requestSubmit();
  })()`);
  await sleep(900);
  check('edit saved', (await evaluate(`document.querySelector('#log-body').innerText`)).includes('Poured and finished the test slab'));

  await evaluate(`(() => {
    const input = document.querySelector('#log-search');
    input.value = 'slab';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await sleep(400);
  check('search finds records across days', (await evaluate(`document.querySelector('#log-body').innerText`)).includes('Poured and finished the test slab'));
  check('search result shows its date', (await evaluate(`document.querySelector('#log-body .chip').innerText`)).length > 3);
  await screenshot('15-log-search');

  await evaluate(`document.querySelector('[data-action="log-clear"]').click()`);
  await sleep(350);
  check('clearing search returns to the day', await evaluate(`!!document.querySelector('.date-nav')`));

  await evaluate(`(() => {
    const row = [...document.querySelectorAll('#log-body .item')].find(r => r.innerText.includes('Poured and finished'));
    row.querySelector('.item-btn').click();
  })()`);
  await sleep(500);
  await evaluate(`document.querySelector('.detail-photos .photo-thumb').click()`);
  await sleep(400);
  check('photo opens in the lightbox', await evaluate(`!document.querySelector('#lightbox').hidden && document.querySelector('#lightbox img').src.startsWith('data:image')`));
  await evaluate(`document.querySelector('#lightbox').click()`);
  await sleep(400);
  check('lightbox closes', await evaluate(`document.querySelector('#lightbox').hidden`));
  await evaluate(`document.querySelector('[data-action="close-sheet"]').click()`);
  await sleep(400);

  const logReload = events('Page.loadEventFired');
  await S('Page.reload');
  await logReload;
  await sleep(800);
  check('photo record survives reload', (await evaluate(`MWT.Store.searchWork('slab').length`)) === 1);
  check('photo data survives reload', (await evaluate(`MWT.Store.searchWork('slab')[0].photos.length`)) === 1);

  /* ---------------------------------------------------------- planner */
  console.log('\n[13] Future planner');
  await evaluate(`location.hash = '#/plan'`);
  await sleep(500);
  const planHeads = await evaluate(
    `[...document.querySelectorAll('.section-head h2')].map(h => h.textContent.replace(/\\d+$/, '').trim())`
  );
  check('planner groups', JSON.stringify(planHeads) === '["Overdue","Today","Tomorrow","This week","Later"]', JSON.stringify(planHeads));
  check('overdue task in planner', (await secText('Overdue')).includes('Write the controller test plan'));
  check('later task in planner', (await secText('Later')).includes('Test the new cart flow'));

  await evaluate(`document.querySelector('[data-action="add"][data-mode="task"]').click()`);
  await sleep(500);
  await evaluate(`document.querySelector('.day-chip[data-offset="1"]').click()`);
  await sleep(150);
  await evaluate(`(() => {
    document.querySelector('#f-title').value = 'Order aluminium sheet';
    document.querySelector('#pri-high').checked = true;
    document.querySelector('#quick-form').requestSubmit();
  })()`);
  await sleep(800);
  check('new task lands in Tomorrow', (await secText('Tomorrow')).includes('Order aluminium sheet'));

  await evaluate(`(() => {
    const row = [...document.querySelectorAll('#view .item')].find(r => r.innerText.includes('Order aluminium sheet'));
    row.querySelector('.item-btn').click();
  })()`);
  await sleep(450);
  check('task detail has move buttons', (await evaluate(`document.querySelectorAll('.quick-day').length`)) === 3);
  await evaluate(`document.querySelector('.quick-day[data-offset="7"]').click()`);
  await sleep(700);
  const movedDue = await evaluate(`MWT.Store.getState().tasks.find(t => t.title === 'Order aluminium sheet').dueDate`);
  const weekDue = await evaluate(`MWT.Dates.addDays(MWT.Dates.today(), 7)`);
  check('reschedule moved the task', movedDue === weekDue, `${movedDue} != ${weekDue}`);
  check('task moved into This week group', (await secText('This week')).includes('Order aluminium sheet'));
  await screenshot('16-planner');

  /* --------------------------------------------------------- projects */
  console.log('\n[14] Projects');
  await evaluate(`location.hash = '#/projects'`);
  await sleep(500);
  check('projects listed', (await evaluate(`document.querySelectorAll('.project-row').length`)) === 4);
  await evaluate(`[...document.querySelectorAll('.project-row')].find(r => r.innerText.includes('CNC Machine')).click()`);
  await sleep(600);
  check('project detail opened', (await evaluate(`document.querySelector('.project-head h1').innerText`)) === 'CNC Machine');
  check('project work history listed', (await evaluate(`document.querySelector('#view').innerText`)).includes('Calibrated the CNC spindle'));
  await screenshot('17-project');

  await evaluate(`location.hash = '#/projects'`);
  await sleep(450);
  await evaluate(`document.querySelector('[data-action="new-project"]').click()`);
  await sleep(450);
  check('project sheet opened', await evaluate(`!!document.querySelector('#project-form')`));
  await evaluate(`(() => {
    document.querySelector('#p-name').value = 'Test Rig';
    document.querySelector('input[name="color"][value="#10b981"]').checked = true;
    document.querySelector('#project-form').requestSubmit();
  })()`);
  await sleep(700);
  check('project created', (await evaluate(`document.querySelector('#view').innerText`)).includes('Test Rig'));

  await evaluate(`[...document.querySelectorAll('.project-row')].find(r => r.innerText.includes('Test Rig')).click()`);
  await sleep(500);
  await evaluate(`document.querySelector('[data-action="edit-project"]').click()`);
  await sleep(450);
  await evaluate(`(() => {
    document.querySelector('#p-name').value = 'Test Rig 2';
    document.querySelector('#project-form').requestSubmit();
  })()`);
  await sleep(700);
  check('project renamed', (await evaluate(`document.querySelector('.project-head h1').innerText`)) === 'Test Rig 2');

  await evaluate(`document.querySelector('[data-action="archive-project"]').click()`);
  await sleep(700);
  check('project shows as archived', (await evaluate(`document.querySelector('.project-head-text p').innerText`)).includes('archived'));
  await evaluate(`location.hash = '#/projects'`);
  await sleep(500);
  check('archived group shown', (await evaluate(`document.querySelector('#view').innerText`)).includes('Archived'));
  await evaluate(`[...document.querySelectorAll('.project-row')].find(r => r.innerText.includes('Test Rig 2')).click()`);
  await sleep(500);
  await evaluate(`document.querySelector('[data-action="restore-project"]').click()`);
  await sleep(600);
  check('project restored', !(await evaluate(`document.querySelector('.project-head-text p').innerText`)).includes('archived'));

  /* ------------------------------------------------------------ notes */
  console.log('\n[15] Ideas & notes');
  await evaluate(`location.hash = '#/ideas'`);
  await sleep(500);
  check('notes empty state', (await evaluate(`document.querySelector('#view').innerText`)).includes('No ideas saved yet'));
  await evaluate(`document.querySelector('[data-action="new-note"]').click()`);
  await sleep(450);
  await evaluate(`(() => {
    document.querySelector('#n-title').value = 'Conveyor belt';
    document.querySelector('#n-body').value = 'Moves parts between stations';
    document.querySelector('#note-form').requestSubmit();
  })()`);
  await sleep(700);
  check('note saved', (await evaluate(`document.querySelector('#view').innerText`)).includes('Conveyor belt'));

  await evaluate(`document.querySelector('[data-action="new-note"]').click()`);
  await sleep(450);
  await evaluate(`(() => {
    document.querySelector('#n-title').value = 'Buy M4 screws';
    document.querySelector('#n-body').value = 'M4 x 20, 100 pieces';
    document.querySelector('input[name="pinned"]').checked = true;
    document.querySelector('#note-form').requestSubmit();
  })()`);
  await sleep(700);
  check('pinned note comes first', (await evaluate(`document.querySelector('.note-item .item-title').innerText`)).includes('Buy M4 screws'));

  await evaluate(`(() => {
    const input = document.querySelector('#ideas-search');
    input.value = 'conveyor';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await sleep(400);
  check('note search filters', (await evaluate(`document.querySelectorAll('#ideas-body .note-item').length`)) === 1);
  await evaluate(`document.querySelector('[data-action="ideas-clear"]').click()`);
  await sleep(350);

  await evaluate(`[...document.querySelectorAll('.note-item')].find(n => n.innerText.includes('Conveyor belt')).click()`);
  await sleep(450);
  await evaluate(`(() => {
    document.querySelector('#n-body').value = 'Moves parts between stations — revised';
    document.querySelector('#note-form').requestSubmit();
  })()`);
  await sleep(700);
  check('note edited', (await evaluate(`document.querySelector('#view').innerText`)).includes('revised'));

  await evaluate(`[...document.querySelectorAll('.note-item')].find(n => n.innerText.includes('Buy M4 screws')).click()`);
  await sleep(450);
  await evaluate(`document.querySelector('[data-action="delete-note"]').click()`);
  await sleep(250);
  check('note delete needs confirmation', (await evaluate(`document.querySelector('[data-action="delete-note"]').innerText`)) === 'Tap again to delete');
  await evaluate(`document.querySelector('[data-action="delete-note"]').click()`);
  await sleep(700);
  check('note deleted', !(await evaluate(`document.querySelector('#view').innerText`)).includes('Buy M4 screws'));
  await screenshot('18-notes');

  /* ---------------------------------------------------------- reports */
  console.log('\n[16] History & backup');
  await evaluate(`location.hash = '#/history'`);
  await sleep(600);
  check('calendar renders', (await evaluate(`document.querySelectorAll('.cal-cell').length`)) >= 28);
  check('today marked on calendar', (await evaluate(`document.querySelectorAll('.cal-cell.today').length`)) >= 1);
  check('backup section present', (await evaluate(`document.querySelector('#view').innerText`)).includes('Backup'));
  check('storage size shown', /Storage used/.test(await evaluate(`document.querySelector('#view').innerText`)));
  await screenshot('19-history');

  const monthBefore = await evaluate(`document.querySelector('.cal-head strong').innerText`);
  await evaluate(`document.querySelector('[data-action="month-prev"]').click()`);
  await sleep(500);
  const monthAfter = await evaluate(`document.querySelector('.cal-head strong').innerText`);
  check('month navigation works', monthBefore !== monthAfter, `${monthBefore} vs ${monthAfter}`);
  await evaluate(`document.querySelector('[data-action="month-next"]').click()`);
  await sleep(500);

  await evaluate(`document.querySelector('.cal-cell.has-work').click()`);
  await sleep(600);
  check('calendar day opens the log', (await evaluate(`location.hash`)) === '#/log');

  await evaluate(`location.hash = '#/history'`);
  await sleep(500);
  const backupText = await evaluate(`MWT.Store.exportJson()`);
  let backupParsed = null;
  try { backupParsed = JSON.parse(backupText); } catch (e) { backupParsed = null; }
  check('export is valid json', !!backupParsed && Array.isArray(backupParsed.work) && backupParsed.work.length > 0);

  const today = await evaluate(`MWT.Dates.today()`);
  backupParsed.work.push({
    id: 'w-imported', title: 'Imported record', description: 'Came from a backup file',
    projectId: 'p-general', date: today, photos: [],
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  });
  await evaluate(`window.__importText = ${JSON.stringify(JSON.stringify(backupParsed))}`);
  await evaluate(`(async () => {
    const file = new File([window.__importText], 'backup.json', { type: 'application/json' });
    const dt = new DataTransfer();
    dt.items.add(file);
    const input = document.querySelector('#import-file');
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await sleep(700);
  check('import asks before replacing', (await evaluate(`document.querySelector('#sheet').innerText`)).includes('Import backup'));
  await evaluate(`document.querySelector('[data-action="confirm-import"]').click()`);
  await sleep(800);
  check('import replaced the data', (await evaluate(`MWT.Store.counts().work`)) === backupParsed.work.length);
  check('imported record is present', (await evaluate(`MWT.Store.searchWork('Imported record').length`)) === 1);

  /* -------------------------------------------------------- reminders */
  console.log('\n[17] Reminders');
  await evaluate(`location.hash = '#/more'`);
  await sleep(500);
  check('reminders section on More', (await evaluate(`document.querySelector('#view').innerText`)).includes('Reminders'));

  await evaluate(`(() => {
    MWT.Store.addTask({
      title: 'Reminder test',
      dueDate: MWT.Dates.today(),
      remindAt: new Date(Date.now() - 60000).toISOString()
    });
    document.dispatchEvent(new Event('visibilitychange'));
  })()`);
  await sleep(1000);
  check('due reminder fired and was marked', await evaluate(
    `!!MWT.Store.getState().tasks.find(t => t.title === 'Reminder test').remindedAt`
  ));
  check('reminder toast shown', await evaluate(
    `[...document.querySelectorAll('.toast')].some(t => t.innerText.includes('Reminder'))`
  ));

  await evaluate(`location.hash = '#/plan'`);
  await sleep(500);
  await evaluate(`(() => {
    const row = [...document.querySelectorAll('#view .item')].find(r => r.innerText.includes('Order aluminium sheet'));
    row.querySelector('.item-btn').click();
  })()`);
  await sleep(500);
  check('task detail has a reminder field', await evaluate(`!!document.querySelector('#detail-remind')`));
  await evaluate(`(() => {
    document.querySelector('#detail-remind').value = '2030-01-01T09:00';
    document.querySelector('[data-action="save-reminder"]').click();
  })()`);
  await sleep(700);
  check('reminder saved on the task', await evaluate(
    `!!MWT.Store.getState().tasks.find(t => t.title === 'Order aluminium sheet').remindAt`
  ));
  await evaluate(`document.querySelector('[data-action="close-sheet"]').click()`);
  await sleep(450);

  /* ------------------------------------------------------------ report */
  const failures = checks.filter((c) => !c.ok);
  console.log('\n=== console problems ===');
  const real = problems.filter((p) => !/favicon|manifest|Failed to load resource/.test(p));
  if (real.length) real.forEach((p) => console.log(' -', p));
  else console.log(' none');

  console.log('\n=== summary ===');
  console.log(`checks: ${checks.length - failures.length}/${checks.length} passed`);
  if (failures.length) {
    failures.forEach((f) => console.log(' FAILED:', f.label, f.detail || ''));
    process.exitCode = 1;
  }
  if (real.length) process.exitCode = 1;
}

try {
  await mkdir(SHOTS, { recursive: true });
  await main();
} catch (err) {
  console.error('\nSMOKE TEST ERROR:', err.message);
  process.exitCode = 1;
} finally {
  try { if (ws) ws.close(); } catch { /* ignore */ }
  try { chrome.kill(); } catch { /* ignore */ }
  await sleep(300);
  try { await rm(profileDir, { recursive: true, force: true }); } catch { /* ignore */ }
}
