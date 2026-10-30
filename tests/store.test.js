/* Data-layer tests. Run: node --test tests */
const test = require('node:test');
const assert = require('node:assert/strict');

const { createStore, Dates, SCHEMA_VERSION } = require('../js/store.js');

function memStorage() {
  const map = new Map();
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k)
  };
}

function newStore(storage) {
  return createStore({ storage: storage || memStorage() });
}

test('fresh store has the default projects and no records', () => {
  const s = newStore();
  const names = s.projects().map((p) => p.name);
  assert.deepEqual(names, ['CookieJet', 'CNC Machine', 'CA_Controller', 'General']);
  assert.equal(s.counts().work, 0);
  assert.equal(s.counts().tasks, 0);
  assert.equal(s.getState().version, SCHEMA_VERSION);
});

test('work entries need a title and get sensible defaults', () => {
  const s = newStore();
  assert.throws(() => s.addWork({ title: '   ' }), /worked on/);

  const rec = s.addWork({ title: '  Built cart module  ', description: 'wired it up', projectId: 'p-cookiejet' });
  assert.equal(rec.title, 'Built cart module');
  assert.equal(rec.date, Dates.today());
  assert.equal(rec.projectId, 'p-cookiejet');
  assert.deepEqual(rec.photos, []);
  assert.ok(rec.createdAt && rec.updatedAt);
  assert.equal(s.counts().work, 1);
});

test('unknown project falls back to General instead of being stored', () => {
  const s = newStore();
  const rec = s.addWork({ title: 'Misc', projectId: 'does-not-exist' });
  assert.equal(rec.projectId, 'p-general');
});

test('records persist and reload through storage', () => {
  const storage = memStorage();
  const a = newStore(storage);
  a.addWork({ title: 'Backfilled Monday', date: '2026-10-26' });
  a.addTask({ title: 'Ship it', dueDate: '2026-11-02', priority: 'high' });

  const b = newStore(storage); // simulates a fresh page load
  assert.equal(b.counts().work, 1);
  assert.equal(b.counts().tasks, 1);
  assert.equal(b.getState().work[0].title, 'Backfilled Monday');
  assert.equal(b.getState().tasks[0].priority, 'high');
});

test('dashboard splits today, upcoming, overdue and completed', () => {
  const s = newStore();
  const today = Dates.today();
  const yesterday = Dates.addDays(today, -1);
  const tomorrow = Dates.addDays(today, 1);

  s.addWork({ title: 'Today A' });
  s.addWork({ title: 'Today B' });
  s.addWork({ title: 'Old day', date: yesterday });

  s.addTask({ title: 'Due tomorrow', dueDate: tomorrow, priority: 'low' });
  s.addTask({ title: 'Late', dueDate: yesterday, priority: 'high' });
  s.addTask({ title: 'Due today', dueDate: today, priority: 'medium' });
  s.addTask({ title: 'Finished', dueDate: today });
  s.setTaskDone(s.getState().tasks.find((t) => t.title === 'Finished').id, true);

  const d = s.getDashboard(today);
  assert.deepEqual(d.work.map((w) => w.title).sort(), ['Today A', 'Today B']);
  assert.deepEqual(d.upcoming.map((t) => t.title), ['Due tomorrow']);
  assert.deepEqual(d.overdue.map((t) => t.title), ['Late']);
  assert.deepEqual(d.dueToday.map((t) => t.title), ['Due today']);
  assert.deepEqual(d.todayTasks.map((t) => t.title), ['Late', 'Due today']);
  assert.deepEqual(d.doneToday.map((t) => t.title), ['Finished']);

  assert.equal(d.stats.loggedToday, 2);
  assert.equal(d.stats.tasksDoneToday, 1);
  assert.equal(d.stats.open, 3);
  assert.equal(d.stats.todaysTasks, 2);
  assert.equal(d.stats.upcoming, 1);
  assert.equal(d.stats.overdue, 1);
});

test('upcoming sorts by due date, then highest priority first', () => {
  const s = newStore();
  const day = Dates.addDays(Dates.today(), 3);
  s.addTask({ title: 'low same day', dueDate: day, priority: 'low' });
  s.addTask({ title: 'high same day', dueDate: day, priority: 'high' });
  s.addTask({ title: 'earlier', dueDate: Dates.addDays(Dates.today(), 1), priority: 'low' });

  const titles = s.getDashboard().upcoming.map((t) => t.title);
  assert.deepEqual(titles, ['earlier', 'high same day', 'low same day']);
});

test('completion leaves today history intact when toggled back off', () => {
  const s = newStore();
  const task = s.addTask({ title: 'Toggle me', dueDate: Dates.today() });
  s.setTaskDone(task.id, true);

  let state = s.getTask(task.id);
  assert.equal(state.done, true);
  assert.equal(state.completedOn, Dates.today());
  assert.ok(state.completedAt);
  assert.equal(s.getDashboard().todayTasks.length, 0);

  s.setTaskDone(task.id, false);
  state = s.getTask(task.id);
  assert.equal(state.done, false);
  assert.equal(state.completedAt, null);
  assert.equal(state.completedOn, null);
  assert.equal(s.getDashboard().todayTasks.length, 1);
  assert.equal(s.getDashboard().upcoming.length, 0);
});

test('progress counts overdue tasks so a late list cannot show 100%', () => {
  const s = newStore();
  const today = Dates.today();
  s.addTask({ title: 'done today', dueDate: today });
  s.addTask({ title: 'late', dueDate: Dates.addDays(today, -2) });
  const doneId = s.getState().tasks.find((t) => t.title === 'done today').id;
  s.setTaskDone(doneId, true);

  const stats = s.getDashboard(today).stats;
  assert.equal(stats.plannedToday, 2);
  assert.equal(stats.finishedPlanned, 1);
  assert.equal(stats.progressPct, 50);
});

test('editing and deleting work records', () => {
  const s = newStore();
  const rec = s.addWork({ title: 'Draft' });
  s.updateWork(rec.id, { title: 'Final', description: 'done', date: '2026-10-01' });

  const updated = s.getWork(rec.id);
  assert.equal(updated.title, 'Final');
  assert.equal(updated.description, 'done');
  assert.equal(updated.date, '2026-10-01');
  assert.ok(new Date(updated.updatedAt).getTime() >= new Date(updated.createdAt).getTime());

  assert.throws(() => s.updateWork(rec.id, { title: '  ' }), /empty/);
  assert.equal(s.deleteWork(rec.id), true);
  assert.equal(s.deleteWork(rec.id), false);
  assert.equal(s.counts().work, 0);
});

test('corrupt storage is preserved, not silently destroyed', () => {
  const storage = memStorage();
  storage.setItem('mwt.data.v1', '{not json');

  const s = newStore(storage);
  assert.equal(s.counts().work, 0);
  assert.equal(s.projects().length, 4);
  const backupKeys = [...storage.map.keys()].filter((k) => k.startsWith('mwt.data.v1.corrupt.'));
  assert.equal(backupKeys.length, 1);
  assert.equal(storage.map.get(backupKeys[0]), '{not json');
});

test('normalize repairs partial or hand-edited data', () => {
  const storage = memStorage();
  storage.setItem('mwt.data.v1', JSON.stringify({
    work: [{ id: 'w1', title: 'No date', date: 'garbage' }],
    tasks: [{ id: 't1', title: 'No priority', priority: 'extreme', dueDate: '2026-13-01' }]
  }));

  const s = newStore(storage);
  const work = s.getState().work[0];
  const task = s.getState().tasks[0];
  assert.equal(work.date, Dates.today());
  assert.equal(work.projectId, 'p-general');
  assert.equal(task.priority, 'medium');
  assert.equal(task.dueDate, Dates.today());
  assert.ok(s.projects().some((p) => p.id === 'p-general'));
});

test('json export/import round-trips the whole state', () => {
  const s = newStore();
  s.addWork({ title: 'Exported work' });
  s.addTask({ title: 'Exported task', dueDate: Dates.addDays(Dates.today(), 2) });
  s.addNote({ title: 'Idea', body: 'try a dashboard chart' });

  const json = s.exportJson();
  const target = newStore();
  target.importJson(json);

  assert.equal(target.counts().work, 1);
  assert.equal(target.counts().tasks, 1);
  assert.equal(target.counts().notes, 1);
  assert.throws(() => target.importJson('nope'), /valid JSON/);
});

test('date helpers handle month, year and invalid dates', () => {
  assert.equal(Dates.addDays('2026-10-30', 2), '2026-11-01');
  assert.equal(Dates.addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(Dates.addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(Dates.diffDays('2026-11-01', '2026-10-30'), 2);
  assert.equal(Dates.isValidKey('2026-10-30'), true);
  assert.equal(Dates.isValidKey('2026-02-31'), false);
  assert.equal(Dates.isValidKey('2026-13-01'), false);
  assert.equal(Dates.isValidKey('30-10-2026'), false);
  assert.equal(Dates.isValidKey(''), false);
});

/* ------------------------------------------------------------- work log */

const TINY_PHOTO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function workPhoto(id) {
  return { id, src: TINY_PHOTO, w: 1, h: 1, addedAt: new Date().toISOString() };
}

test('work records keep photos as objects', () => {
  const s = newStore();
  const rec = s.addWork({ title: 'With a photo', photos: [workPhoto('ph-1')] });
  assert.equal(rec.photos.length, 1);
  assert.equal(rec.photos[0].id, 'ph-1');
  assert.ok(rec.photos[0].src.startsWith('data:image/png'));

  s.updateWork(rec.id, { photos: [workPhoto('ph-1'), workPhoto('ph-2')] });
  assert.equal(s.getWork(rec.id).photos.length, 2);
});

test('legacy string photos are upgraded on load', () => {
  const storage = memStorage();
  storage.setItem('mwt.data.v1', JSON.stringify({
    work: [{ id: 'w-old', title: 'Old entry', date: '2026-10-01', photos: [TINY_PHOTO] }]
  }));
  const s = newStore(storage);
  const photo = s.getWork('w-old').photos[0];
  assert.equal(typeof photo, 'object');
  assert.ok(photo.id);
  assert.ok(photo.src.startsWith('data:image'));
});

test('broken photo entries are dropped instead of crashing', () => {
  const storage = memStorage();
  storage.setItem('mwt.data.v1', JSON.stringify({
    work: [{ id: 'w1', title: 'Bad photos', date: '2026-10-01', photos: ['not-an-image', null, { src: 'https://example.com/x.jpg' }] }]
  }));
  const s = newStore(storage);
  assert.deepEqual(s.getWork('w1').photos, []);
});

test('workForDay returns only that day, newest first', () => {
  const s = newStore();
  s.addWork({ title: 'Older', date: '2026-10-01' });
  s.addWork({ title: 'Newer', date: '2026-10-01' });
  s.addWork({ title: 'Other day', date: '2026-10-02' });

  const day = s.workForDay('2026-10-01');
  assert.equal(day.length, 2);
  assert.equal(day[0].title, 'Newer'); // unshifted last => newest first
  assert.equal(s.workForDay('2026-10-02').length, 1);
  assert.equal(s.workForDay('2026-09-30').length, 0);
});

test('workDaySummary counts entries, photos and projects', () => {
  const s = newStore();
  s.addWork({ title: 'A', date: '2026-10-05', projectId: 'p-cnc', photos: [workPhoto('a')] });
  s.addWork({ title: 'B', date: '2026-10-05', projectId: 'p-cnc', photos: [workPhoto('b'), workPhoto('c')] });
  s.addWork({ title: 'C', date: '2026-10-05', projectId: 'p-cookiejet' });

  const summary = s.workDaySummary('2026-10-05');
  assert.equal(summary.count, 3);
  assert.equal(summary.photos, 3);
  assert.deepEqual(summary.projects.map((p) => p.name).sort(), ['CNC Machine', 'CookieJet']);
});

test('search matches title and description, newest day first', () => {
  const s = newStore();
  s.addWork({ title: 'Wired the cart', date: '2026-10-01' });
  s.addWork({ title: 'Painted the frame', description: 'Used the new cart spray booth', date: '2026-10-03' });
  s.addWork({ title: 'Cart review', date: '2026-10-02' });

  const hits = s.searchWork('CART');
  assert.deepEqual(hits.map((w) => w.title), ['Painted the frame', 'Cart review', 'Wired the cart']);
  assert.equal(s.searchWork('   ').length, 0);
  assert.equal(s.searchWork('nothing here').length, 0);
});

test('a full storage rejects the write and keeps the old data', () => {
  let used = 0;
  const map = new Map();
  const limited = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      const next = String(v);
      if (next.length > 8000) throw Object.assign(new Error('QuotaExceededError'), { name: 'QuotaExceededError' });
      used = next.length;
      map.set(k, next);
    },
    removeItem: (k) => map.delete(k)
  };
  const s = createStore({ storage: limited });

  s.addWork({ title: 'Fits fine' });
  assert.equal(s.counts().work, 1);

  const huge = { id: 'ph-big', src: 'data:image/png;base64,' + 'A'.repeat(20000), w: 1, h: 1 };
  assert.throws(() => s.addWork({ title: 'Too big', photos: [huge] }), /storage/i);
  assert.equal(s.counts().work, 1, 'failed entry must not stay in memory');
  assert.ok(used < 8000);

  const rec = s.getState().work[0];
  assert.throws(() => s.updateWork(rec.id, { title: 'Renamed', photos: [huge] }), /storage/i);
  assert.equal(s.getWork(rec.id).title, 'Fits fine', 'failed edit must be rolled back');
  assert.deepEqual(s.getWork(rec.id).photos, []);
});

/* --------------------------------------------------------------- planner */

test('tasksGrouped splits overdue, today, tomorrow, week and later', () => {
  const s = newStore();
  const today = Dates.today();
  s.addTask({ title: 'late', dueDate: Dates.addDays(today, -2) });
  s.addTask({ title: 'now', dueDate: today });
  s.addTask({ title: 'next', dueDate: Dates.addDays(today, 1) });
  s.addTask({ title: 'this week', dueDate: Dates.addDays(today, 4) });
  s.addTask({ title: 'far', dueDate: Dates.addDays(today, 30) });
  s.addTask({ title: 'done', dueDate: today });
  s.setTaskDone(s.getState().tasks.find((t) => t.title === 'done').id, true);

  const groups = s.tasksGrouped(today);
  assert.deepEqual(groups.overdue.map((t) => t.title), ['late']);
  assert.deepEqual(groups.today.map((t) => t.title), ['now']);
  assert.deepEqual(groups.tomorrow.map((t) => t.title), ['next']);
  assert.deepEqual(groups.week.map((t) => t.title), ['this week']);
  assert.deepEqual(groups.later.map((t) => t.title), ['far']);
  assert.equal(groups.openCount, 5);
  assert.equal(groups.doneCount, 1);
});

test('reminders fire once and can be reset', () => {
  const s = newStore();
  const past = new Date(Date.now() - 60000).toISOString();
  const task = s.addTask({ title: 'Call the client', dueDate: Dates.today(), remindAt: past });

  assert.equal(s.dueReminders().length, 1);
  s.markTaskReminded(task.id);
  assert.equal(s.dueReminders().length, 0);

  // changing the reminder time makes it new again
  const soon = new Date(Date.now() + 3600000).toISOString();
  s.updateTask(task.id, { remindAt: soon });
  assert.equal(s.getTask(task.id).remindedAt, null);
  assert.equal(s.dueReminders().length, 0, 'future reminders do not fire');

  // completing a task stops its reminder
  const second = s.addTask({ title: 'Second', dueDate: Dates.today(), remindAt: past });
  s.setTaskDone(second.id, true);
  assert.equal(s.dueReminders().length, 0);
});

/* -------------------------------------------------------------- projects */

test('project rename, colour, archive and uniqueness', () => {
  const s = newStore();
  const created = s.addProject({ name: 'Website', color: '#22d3ee' });
  assert.equal(created.name, 'Website');

  assert.throws(() => s.addProject({ name: 'website' }), /already exists/);
  assert.throws(() => s.updateProject(created.id, { name: 'CookieJet' }), /already uses/);
  assert.throws(() => s.updateProject('p-general', { archived: true }), /cannot be archived/);

  s.updateProject(created.id, { name: 'Website v2', color: '#f97316' });
  assert.equal(s.getProject(created.id).name, 'Website v2');
  assert.equal(s.getProject(created.id).color, '#f97316');

  s.updateProject(created.id, { archived: true });
  assert.ok(!s.projects().some((p) => p.id === created.id));
  assert.ok(s.getProject(created.id), 'archived project is kept for history');
});

test('project summary counts work, photos and tasks', () => {
  const s = newStore();
  s.addWork({ title: 'Work A', projectId: 'p-cnc', date: '2026-10-05', photos: [workPhoto('x')] });
  s.addWork({ title: 'Work B', projectId: 'p-cnc', date: '2026-10-06' });
  s.addTask({ title: 'Open', projectId: 'p-cnc', dueDate: Dates.today() });
  const done = s.addTask({ title: 'Done', projectId: 'p-cnc', dueDate: Dates.today() });
  s.setTaskDone(done.id, true);

  const stats = s.projectStats('p-cnc');
  assert.equal(stats.work, 2);
  assert.equal(stats.photos, 1);
  assert.equal(stats.openTasks, 1);
  assert.equal(stats.doneTasks, 1);
  assert.equal(stats.lastWorkDate, '2026-10-06');
  assert.equal(s.worksForProject('p-cnc').length, 2);

  const overview = s.projectsOverview();
  assert.equal(overview.length, 4);
  assert.ok(overview.every((row) => row.project && row.stats));
});

/* ----------------------------------------------------------------- notes */

test('notes can be edited, pinned and searched', () => {
  const s = newStore();
  const first = s.addNote({ title: 'Idea: conveyor', body: 'Add a belt to move parts faster' });
  const second = s.addNote({ title: 'Buy screws', body: 'M4 x 20, 100 pieces' });

  s.updateNote(first.id, { body: 'Add a belt and a small motor' });
  assert.match(s.getNote(first.id).body, /small motor/);

  s.toggleNotePin(second.id);
  assert.equal(s.getNote(second.id).pinned, true);
  assert.deepEqual(s.notesList().map((n) => n.title), ['Buy screws', 'Idea: conveyor']);

  assert.deepEqual(s.notesList('m4').map((n) => n.title), ['Buy screws']);
  assert.equal(s.notesList('nothing').length, 0);

  assert.equal(s.deleteNote(first.id), true);
  assert.equal(s.getNote(first.id), null);
});

/* --------------------------------------------------------------- reports */

test('month calendar and range stats match the records', () => {
  const s = newStore();
  s.addWork({ title: 'A', date: '2026-10-01' });
  s.addWork({ title: 'B', date: '2026-10-01' });
  s.addWork({ title: 'C', date: '2026-10-15', photos: [workPhoto('p')] });
  s.addWork({ title: 'D', date: '2026-11-02' });

  const oct = s.monthCalendar(2026, 10);
  assert.equal(oct.days, 31);
  assert.equal(oct.workByDay['2026-10-01'], 2);
  assert.equal(oct.workByDay['2026-10-15'], 1);
  assert.equal(oct.workByDay['2026-11-02'], undefined);

  const stats = s.rangeStats('2026-10-01', '2026-10-31');
  assert.equal(stats.records, 3);
  assert.equal(stats.photos, 1);
  assert.equal(stats.activeDays, 2);

  assert.equal(s.weekStartOf('2026-10-30'), '2026-10-26'); // Friday -> Monday
  assert.ok(s.storageBytes() > 0);
});
