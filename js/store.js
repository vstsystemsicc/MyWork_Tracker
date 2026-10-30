/* ==========================================================================
   MyWork Tracker — data layer
   Plain script (no modules) so the app also runs from file://
   Exposes: window.MWT.Store / window.MWT.Dates
   Runs under Node too (module.exports) for tests.
   ========================================================================== */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.MWT = root.MWT || {};
    root.MWT.Store = api.Store;
    root.MWT.Dates = api.Dates;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var STORAGE_KEY = 'mwt.data.v1';
  var SCHEMA_VERSION = 1;
  var PRIORITY_RANK = { low: 1, medium: 2, high: 3 };

  /* ---------------------------------------------------------------- dates */
  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function dateKey(date) {
    var d = date || new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function fromKey(key) {
    var parts = String(key).split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function isValidKey(key) {
    var s = String(key);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    var d = fromKey(s);
    if (isNaN(d.getTime())) return false;
    return dateKey(d) === s; // rejects 2026-02-31, 2026-13-01, ...
  }

  function addDays(key, amount) {
    var d = fromKey(key);
    d.setDate(d.getDate() + amount);
    return dateKey(d);
  }

  function diffDays(a, b) {
    return Math.round((fromKey(a).getTime() - fromKey(b).getTime()) / 86400000);
  }

  function today() {
    return dateKey(new Date());
  }

  var Dates = {
    pad2: pad2,
    key: dateKey,
    fromKey: fromKey,
    isValidKey: isValidKey,
    addDays: addDays,
    diffDays: diffDays,
    today: today
  };

  /* ------------------------------------------------------------- helpers */
  function uid() {
    return (
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function defaultProjects() {
    var created = nowIso();
    return [
      { id: 'p-cookiejet', name: 'CookieJet', color: '#8b5cf6', createdAt: created, archived: false },
      { id: 'p-cnc', name: 'CNC Machine', color: '#38bdf8', createdAt: created, archived: false },
      { id: 'p-ca', name: 'CA_Controller', color: '#f472b6', createdAt: created, archived: false },
      { id: 'p-general', name: 'General', color: '#94a3b8', createdAt: created, archived: false }
    ];
  }

  function emptyState() {
    return {
      version: SCHEMA_VERSION,
      createdAt: nowIso(),
      projects: defaultProjects(),
      work: [],
      tasks: [],
      notes: []
    };
  }

  // Fills in anything missing so older/hand-edited data never crashes the app.
  function normalize(raw) {
    var base = emptyState();
    if (!raw || typeof raw !== 'object') return base;

    var out = {
      version: SCHEMA_VERSION,
      createdAt: raw.createdAt || base.createdAt,
      projects: Array.isArray(raw.projects) && raw.projects.length
        ? raw.projects
            .filter(function (p) { return p && p.id && p.name; })
            .map(function (p) {
              return {
                id: String(p.id),
                name: String(p.name),
                color: p.color || '#8b5cf6',
                createdAt: p.createdAt || nowIso(),
                archived: !!p.archived
              };
            })
        : base.projects,
      work: Array.isArray(raw.work) ? raw.work.filter(function (w) { return w && w.id; }).map(normalizeWork) : [],
      tasks: Array.isArray(raw.tasks) ? raw.tasks.filter(function (t) { return t && t.id; }).map(normalizeTask) : [],
      notes: Array.isArray(raw.notes)
        ? raw.notes.filter(function (n) { return n && n.id; }).map(normalizeNote)
        : []
    };

    if (!out.projects.some(function (p) { return p.id === 'p-general'; })) {
      out.projects.push({ id: 'p-general', name: 'General', color: '#94a3b8', createdAt: nowIso(), archived: false });
    }
    return out;
  }

  function normalizeWork(w) {
    return {
      id: String(w.id),
      title: String(w.title || 'Untitled work'),
      description: w.description ? String(w.description) : '',
      projectId: w.projectId || 'p-general',
      date: isValidKey(w.date) ? w.date : today(),
      photos: Array.isArray(w.photos) ? w.photos.map(normalizePhoto).filter(Boolean) : [],
      createdAt: w.createdAt || nowIso(),
      updatedAt: w.updatedAt || w.createdAt || nowIso()
    };
  }

  // A photo is { id, src (data URL), w, h, addedAt }.
  // Older records may hold a plain data-URL string; both are accepted.
  function normalizePhoto(photo) {
    if (!photo) return null;
    if (typeof photo === 'string') {
      if (photo.indexOf('data:image') !== 0) return null;
      return { id: 'ph-' + uid(), src: photo, w: 0, h: 0, addedAt: nowIso() };
    }
    if (typeof photo.src !== 'string' || photo.src.indexOf('data:image') !== 0) return null;
    return {
      id: String(photo.id || 'ph-' + uid()),
      src: photo.src,
      w: Number(photo.w) || 0,
      h: Number(photo.h) || 0,
      addedAt: photo.addedAt || nowIso()
    };
  }

  function normalizeTask(t) {
    return {
      id: String(t.id),
      title: String(t.title || 'Untitled task'),
      notes: t.notes ? String(t.notes) : '',
      projectId: t.projectId || 'p-general',
      dueDate: isValidKey(t.dueDate) ? t.dueDate : today(),
      priority: PRIORITY_RANK[t.priority] ? t.priority : 'medium',
      done: !!t.done,
      completedAt: t.done ? (t.completedAt || nowIso()) : null,
      completedOn: t.done ? (isValidKey(t.completedOn) ? t.completedOn : today()) : null,
      remindAt: isIso(t.remindAt) ? t.remindAt : null,
      remindedAt: isIso(t.remindedAt) ? t.remindedAt : null,
      createdAt: t.createdAt || nowIso(),
      updatedAt: t.updatedAt || t.createdAt || nowIso()
    };
  }

  function normalizeNote(n) {
    return {
      id: String(n.id),
      title: String(n.title || 'Untitled note'),
      body: n.body ? String(n.body) : '',
      pinned: !!n.pinned,
      createdAt: n.createdAt || nowIso(),
      updatedAt: n.updatedAt || n.createdAt || nowIso()
    };
  }

  function isIso(value) {
    if (!value) return false;
    var d = new Date(value);
    return !isNaN(d.getTime());
  }

  function memoryStorage() {
    var map = new Map();
    return {
      getItem: function (k) { return map.has(k) ? map.get(k) : null; },
      setItem: function (k, v) { map.set(k, String(v)); },
      removeItem: function (k) { map.delete(k); }
    };
  }

  function safeStorage() {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.setItem('__mwt_probe__', '1');
        localStorage.removeItem('__mwt_probe__');
        return localStorage;
      }
    } catch (e) {
      /* private mode / disabled storage — fall through */
    }
    return memoryStorage();
  }

  function trim(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function fail(message) {
    var err = new Error(message);
    err.userMessage = message;
    return err;
  }

  /* --------------------------------------------------------------- store */
  function createStore(options) {
    var opts = options || {};
    var key = opts.key || STORAGE_KEY;
    var storage = opts.storage || safeStorage();
    var listeners = new Set();
    var state = read();

    function read() {
      var raw = null;
      try {
        raw = storage.getItem(key);
      } catch (e) {
        raw = null;
      }
      if (!raw) return emptyState();
      try {
        return normalize(JSON.parse(raw));
      } catch (e) {
        // keep a copy of unreadable data instead of silently destroying it
        try { storage.setItem(key + '.corrupt.' + Date.now(), raw); } catch (e2) { /* ignore */ }
        return emptyState();
      }
    }

    function persist() {
      var ok = true;
      try {
        storage.setItem(key, JSON.stringify(state));
      } catch (e) {
        ok = false;
      }
      if (ok) notify(); // a failed write must not look like a successful one
      return ok;
    }

    function notify() {
      listeners.forEach(function (fn) {
        try { fn(state); } catch (e) { /* listener errors must not break writes */ }
      });
    }

    // Re-read from storage (another tab wrote, or data was restored elsewhere).
    function reload() {
      state = read();
      notify();
      return state;
    }

    function subscribe(fn) {
      listeners.add(fn);
      return function () { listeners.delete(fn); };
    }

    function getState() {
      return state;
    }

    function projectList() {
      return state.projects.filter(function (p) { return !p.archived; });
    }

    function getProject(id) {
      return state.projects.find(function (p) { return p.id === id; }) || null;
    }

    /* ------------------------------------------------------------ work */
    function addWork(input) {
      var data = input || {};
      var title = trim(data.title);
      if (!title) throw fail('Write what you worked on first.');
      var date = isValidKey(data.date) ? data.date : today();
      var now = nowIso();
      var record = normalizeWork({
        id: 'w-' + uid(),
        title: title,
        description: data.description,
        projectId: getProject(data.projectId) ? data.projectId : 'p-general',
        date: date,
        photos: data.photos || [],
        createdAt: now,
        updatedAt: now
      });
      state.work.unshift(record);
      if (!persist()) {
        state.work = state.work.filter(function (w) { return w.id !== record.id; });
        throw fail('Not enough storage for this entry. Remove a photo or an old record, then try again.');
      }
      return record;
    }

    function updateWork(id, patch) {
      var record = state.work.find(function (w) { return w.id === id; });
      if (!record) throw fail('That work record no longer exists.');
      var data = patch || {};
      var before = JSON.stringify(record);
      if (data.title !== undefined) {
        var title = trim(data.title);
        if (!title) throw fail('Title cannot be empty.');
        record.title = title;
      }
      if (data.description !== undefined) record.description = String(data.description);
      if (data.projectId !== undefined && getProject(data.projectId)) record.projectId = data.projectId;
      if (data.date !== undefined && isValidKey(data.date)) record.date = data.date;
      if (data.photos !== undefined && Array.isArray(data.photos)) {
        record.photos = data.photos.map(normalizePhoto).filter(Boolean);
      }
      record.updatedAt = nowIso();
      if (!persist()) {
        Object.assign(record, JSON.parse(before)); // put the old version back
        throw fail('Not enough storage to save this change. Remove a photo or an old record, then try again.');
      }
      return record;
    }

    function deleteWork(id) {
      var before = state.work.length;
      state.work = state.work.filter(function (w) { return w.id !== id; });
      if (state.work.length !== before) persist();
      return state.work.length !== before;
    }

    /* ------------------------------------------------- work log queries */
    function workForDay(dayKey) {
      var day = isValidKey(dayKey) ? dayKey : today();
      return state.work
        .filter(function (w) { return w.date === day; })
        .sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
    }

    function searchWork(query) {
      var q = trim(query).toLowerCase();
      if (!q) return [];
      return state.work
        .filter(function (w) {
          return w.title.toLowerCase().indexOf(q) >= 0 ||
            String(w.description || '').toLowerCase().indexOf(q) >= 0;
        })
        .sort(function (a, b) {
          if (a.date !== b.date) return a.date < b.date ? 1 : -1;
          return String(b.createdAt).localeCompare(String(a.createdAt));
        })
        .slice(0, 100);
    }

    function workDaySummary(dayKey) {
      var entries = workForDay(dayKey);
      var photos = 0;
      var projectIds = [];
      entries.forEach(function (w) {
        photos += w.photos ? w.photos.length : 0;
        if (projectIds.indexOf(w.projectId) < 0) projectIds.push(w.projectId);
      });
      return {
        count: entries.length,
        photos: photos,
        projects: projectIds.map(getProject).filter(Boolean)
      };
    }

    /* ---------------------------------------------------------- reports */
    function weekStartOf(dayKey) {
      var d = fromKey(isValidKey(dayKey) ? dayKey : today());
      var shift = (d.getDay() + 6) % 7; // Monday first
      d.setDate(d.getDate() - shift);
      return dateKey(d);
    }

    function monthCalendar(year, month) {
      var first = new Date(year, month - 1, 1);
      var last = new Date(year, month, 0);
      var startKey = dateKey(first);
      var endKey = dateKey(last);
      var workByDay = {};
      var tasksByDay = {};

      state.work.forEach(function (w) {
        if (w.date >= startKey && w.date <= endKey) workByDay[w.date] = (workByDay[w.date] || 0) + 1;
      });
      state.tasks.forEach(function (t) {
        if (t.done && t.completedOn && t.completedOn >= startKey && t.completedOn <= endKey) {
          tasksByDay[t.completedOn] = (tasksByDay[t.completedOn] || 0) + 1;
        }
      });

      return {
        year: year,
        month: month,
        startKey: startKey,
        endKey: endKey,
        days: last.getDate(),
        firstWeekday: (first.getDay() + 6) % 7, // Monday = 0
        workByDay: workByDay,
        tasksByDay: tasksByDay
      };
    }

    function rangeStats(fromKey, toKey) {
      var records = 0;
      var photos = 0;
      var tasksDone = 0;
      var active = {};
      state.work.forEach(function (w) {
        if (w.date >= fromKey && w.date <= toKey) {
          records += 1;
          photos += w.photos ? w.photos.length : 0;
          active[w.date] = true;
        }
      });
      state.tasks.forEach(function (t) {
        if (t.done && t.completedOn && t.completedOn >= fromKey && t.completedOn <= toKey) tasksDone += 1;
      });
      return {
        records: records,
        photos: photos,
        tasksDone: tasksDone,
        activeDays: Object.keys(active).length
      };
    }

    function storageBytes() {
      try { return JSON.stringify(state).length * 2; } catch (e) { return 0; }
    }

    /* ----------------------------------------------------------- tasks */
    function addTask(input) {
      var data = input || {};
      var title = trim(data.title);
      if (!title) throw fail('Give the task a name first.');
      var now = nowIso();
      var record = normalizeTask({
        id: 't-' + uid(),
        title: title,
        notes: data.notes,
        projectId: getProject(data.projectId) ? data.projectId : 'p-general',
        dueDate: isValidKey(data.dueDate) ? data.dueDate : today(),
        priority: data.priority || 'medium',
        done: false,
        remindAt: data.remindAt,
        createdAt: now,
        updatedAt: now
      });
      state.tasks.unshift(record);
      persist();
      return record;
    }

    function updateTask(id, patch) {
      var record = state.tasks.find(function (t) { return t.id === id; });
      if (!record) throw fail('That task no longer exists.');
      var data = patch || {};
      if (data.title !== undefined) {
        var title = trim(data.title);
        if (!title) throw fail('Title cannot be empty.');
        record.title = title;
      }
      if (data.notes !== undefined) record.notes = String(data.notes);
      if (data.projectId !== undefined && getProject(data.projectId)) record.projectId = data.projectId;
      if (data.dueDate !== undefined && isValidKey(data.dueDate)) record.dueDate = data.dueDate;
      if (data.priority !== undefined && PRIORITY_RANK[data.priority]) record.priority = data.priority;
      if (data.remindAt !== undefined) {
        record.remindAt = isIso(data.remindAt) ? new Date(data.remindAt).toISOString() : null;
        record.remindedAt = null; // a new reminder time is a new reminder
      }
      record.updatedAt = nowIso();
      persist();
      return record;
    }

    function setTaskDone(id, done) {
      var record = state.tasks.find(function (t) { return t.id === id; });
      if (!record) throw fail('That task no longer exists.');
      var next = done === undefined ? !record.done : !!done;
      record.done = next;
      record.completedAt = next ? nowIso() : null;
      record.completedOn = next ? today() : null;
      record.updatedAt = nowIso();
      persist();
      return record;
    }

    function markTaskReminded(id) {
      var record = state.tasks.find(function (t) { return t.id === id; });
      if (!record) return null;
      record.remindedAt = nowIso();
      persist();
      return record;
    }

    // Reminders that are due and not yet announced.
    function dueReminders(nowIsoString) {
      var now = isIso(nowIsoString) ? new Date(nowIsoString).toISOString() : nowIso();
      return state.tasks.filter(function (t) {
        if (t.done || !t.remindAt) return false;
        if (new Date(t.remindAt).toISOString() > now) return false;
        return !t.remindedAt || new Date(t.remindedAt).toISOString() < new Date(t.remindAt).toISOString();
      }).sort(function (a, b) {
        return String(a.remindAt).localeCompare(String(b.remindAt));
      });
    }

    // Planner groups relative to a day (defaults to today).
    function tasksGrouped(dayKey) {
      var day = isValidKey(dayKey) ? dayKey : today();
      var tomorrow = addDays(day, 1);
      var weekEnd = addDays(day, 7);
      var open = state.tasks.filter(function (t) { return !t.done; }).sort(byDueThenPriority);
      function pick(from, to) {
        return open.filter(function (t) { return t.dueDate >= from && t.dueDate <= to; });
      }
      return {
        day: day,
        overdue: open.filter(function (t) { return t.dueDate < day; }),
        today: pick(day, day),
        tomorrow: pick(tomorrow, tomorrow),
        week: pick(addDays(day, 2), weekEnd),
        later: open.filter(function (t) { return t.dueDate > weekEnd; }),
        openCount: open.length,
        doneCount: state.tasks.filter(function (t) { return t.done; }).length
      };
    }

    function deleteTask(id) {
      var before = state.tasks.length;
      state.tasks = state.tasks.filter(function (t) { return t.id !== id; });
      if (state.tasks.length !== before) persist();
      return state.tasks.length !== before;
    }

    /* ------------------------------------------------------------ notes */
    function addNote(input) {
      var data = input || {};
      var title = trim(data.title);
      var body = trim(data.body);
      if (!title && !body) throw fail('Write something first.');
      var now = nowIso();
      var note = {
        id: 'n-' + uid(),
        title: title || 'Untitled note',
        body: body,
        pinned: !!data.pinned,
        createdAt: now,
        updatedAt: now
      };
      state.notes.unshift(note);
      persist();
      return note;
    }

    function deleteNote(id) {
      var before = state.notes.length;
      state.notes = state.notes.filter(function (n) { return n.id !== id; });
      if (state.notes.length !== before) persist();
      return state.notes.length !== before;
    }

    function updateNote(id, patch) {
      var note = state.notes.find(function (n) { return n.id === id; });
      if (!note) throw fail('That note no longer exists.');
      var data = patch || {};
      if (data.title !== undefined) note.title = trim(data.title) || 'Untitled note';
      if (data.body !== undefined) note.body = String(data.body);
      if (data.pinned !== undefined) note.pinned = !!data.pinned;
      note.updatedAt = nowIso();
      persist();
      return note;
    }

    function toggleNotePin(id) {
      var note = state.notes.find(function (n) { return n.id === id; });
      if (!note) return null;
      note.pinned = !note.pinned;
      note.updatedAt = nowIso();
      persist();
      return note;
    }

    function getNote(id) {
      return state.notes.find(function (n) { return n.id === id; }) || null;
    }

    function notesList(query) {
      var q = trim(query).toLowerCase();
      return state.notes
        .filter(function (n) {
          if (!q) return true;
          return n.title.toLowerCase().indexOf(q) >= 0 || n.body.toLowerCase().indexOf(q) >= 0;
        })
        .sort(function (a, b) {
          if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
          return String(b.updatedAt).localeCompare(String(a.updatedAt));
        });
    }

    /* --------------------------------------------------------- projects */
    function addProject(input) {
      var data = input || {};
      var name = trim(data.name);
      if (!name) throw fail('Project name is required.');
      var exists = state.projects.some(function (p) {
        return p.name.toLowerCase() === name.toLowerCase() && !p.archived;
      });
      if (exists) throw fail('A project with that name already exists.');
      var project = {
        id: 'p-' + uid(),
        name: name,
        color: data.color || '#8b5cf6',
        createdAt: nowIso(),
        archived: false
      };
      state.projects.push(project);
      persist();
      return project;
    }

    function updateProject(id, patch) {
      var project = state.projects.find(function (p) { return p.id === id; });
      if (!project) throw fail('That project no longer exists.');
      var data = patch || {};
      if (data.name !== undefined) {
        var name = trim(data.name);
        if (!name) throw fail('Project name is required.');
        var clash = state.projects.some(function (p) {
          return p.id !== id && !p.archived && p.name.toLowerCase() === name.toLowerCase();
        });
        if (clash) throw fail('Another project already uses that name.');
        project.name = name;
      }
      if (data.color !== undefined) project.color = String(data.color);
      if (data.archived !== undefined) {
        if (id === 'p-general' && data.archived) throw fail('The General project cannot be archived.');
        project.archived = !!data.archived;
      }
      persist();
      return project;
    }

    function projectStats(id) {
      var work = state.work.filter(function (w) { return w.projectId === id; });
      var tasks = state.tasks.filter(function (t) { return t.projectId === id; });
      var lastWork = work.reduce(function (max, w) { return w.date > max ? w.date : max; }, '');
      return {
        work: work.length,
        photos: work.reduce(function (n, w) { return n + (w.photos ? w.photos.length : 0); }, 0),
        openTasks: tasks.filter(function (t) { return !t.done; }).length,
        doneTasks: tasks.filter(function (t) { return t.done; }).length,
        lastWorkDate: lastWork
      };
    }

    function projectsOverview() {
      return projectList().map(function (p) {
        var stats = projectStats(p.id);
        return { project: p, stats: stats };
      });
    }

    function worksForProject(id, limit) {
      return state.work
        .filter(function (w) { return w.projectId === id; })
        .sort(function (a, b) {
          if (a.date !== b.date) return a.date < b.date ? 1 : -1;
          return String(b.createdAt).localeCompare(String(a.createdAt));
        })
        .slice(0, limit || 20);
    }

    function tasksForProject(id) {
      return state.tasks
        .filter(function (t) { return t.projectId === id && !t.done; })
        .sort(byDueThenPriority);
    }

    function counts() {
      return {
        work: state.work.length,
        tasks: state.tasks.length,
        open: state.tasks.filter(function (t) { return !t.done; }).length,
        projects: projectList().length,
        notes: state.notes.length
      };
    }

    /* ------------------------------------------------------ dashboard */
    function getDashboard(dayKey) {
      var day = isValidKey(dayKey) ? dayKey : today();

      var todaysWork = workForDay(day);

      var doneToday = state.tasks
        .filter(function (t) { return t.done && t.completedOn === day; })
        .sort(function (a, b) { return String(b.completedAt).localeCompare(String(a.completedAt)); });

      var open = state.tasks.filter(function (t) { return !t.done; });

      var overdue = open
        .filter(function (t) { return t.dueDate < day; })
        .sort(byDueThenPriority);

      var dueToday = open
        .filter(function (t) { return t.dueDate === day; })
        .sort(byDueThenPriority);

      // What still needs attention today: late work first, then today's list.
      var todayTasks = overdue.concat(dueToday);

      var upcoming = open
        .filter(function (t) { return t.dueDate > day; })
        .sort(byDueThenPriority);

      var plannedToday = state.tasks.filter(function (t) {
        return !t.done ? t.dueDate <= day : t.completedOn === day;
      });
      var finishedPlanned = plannedToday.filter(function (t) { return t.done; }).length;

      var stats = {
        loggedToday: todaysWork.length,
        tasksDoneToday: doneToday.length,
        open: open.length,
        todaysTasks: todayTasks.length,
        dueToday: dueToday.length,
        upcoming: upcoming.length,
        overdue: overdue.length,
        plannedToday: plannedToday.length,
        finishedPlanned: finishedPlanned,
        progressPct: plannedToday.length
          ? Math.round((finishedPlanned / plannedToday.length) * 100)
          : 0
      };

      return {
        day: day,
        work: todaysWork,
        doneToday: doneToday,
        todayTasks: todayTasks,
        dueToday: dueToday,
        upcoming: upcoming,
        overdue: overdue,
        stats: stats
      };
    }

    function byDueThenPriority(a, b) {
      if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
      var pr = (PRIORITY_RANK[b.priority] || 0) - (PRIORITY_RANK[a.priority] || 0);
      if (pr !== 0) return pr;
      return String(b.createdAt).localeCompare(String(a.createdAt));
    }

    function getWork(id) {
      return state.work.find(function (w) { return w.id === id; }) || null;
    }

    function getTask(id) {
      return state.tasks.find(function (t) { return t.id === id; }) || null;
    }

    /* ------------------------------------------------- backup / restore */
    function exportJson() {
      return JSON.stringify(state, null, 2);
    }

    function importJson(text) {
      var parsed;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        throw fail('That backup file is not valid JSON.');
      }
      if (!parsed || typeof parsed !== 'object') throw fail('That backup file has no data.');
      state = normalize(parsed);
      persist();
      return counts();
    }

    return {
      // state
      getState: getState,
      subscribe: subscribe,
      reload: reload,
      counts: counts,
      // work
      addWork: addWork,
      updateWork: updateWork,
      deleteWork: deleteWork,
      getWork: getWork,
      workForDay: workForDay,
      searchWork: searchWork,
      workDaySummary: workDaySummary,
      // tasks
      addTask: addTask,
      updateTask: updateTask,
      setTaskDone: setTaskDone,
      deleteTask: deleteTask,
      getTask: getTask,
      markTaskReminded: markTaskReminded,
      dueReminders: dueReminders,
      tasksGrouped: tasksGrouped,
      tasksForProject: tasksForProject,
      // notes
      addNote: addNote,
      updateNote: updateNote,
      deleteNote: deleteNote,
      getNote: getNote,
      notesList: notesList,
      toggleNotePin: toggleNotePin,
      // projects
      addProject: addProject,
      updateProject: updateProject,
      projects: projectList,
      getProject: getProject,
      projectStats: projectStats,
      projectsOverview: projectsOverview,
      worksForProject: worksForProject,
      // views
      getDashboard: getDashboard,
      // reports
      monthCalendar: monthCalendar,
      rangeStats: rangeStats,
      weekStartOf: weekStartOf,
      storageBytes: storageBytes,
      // backup
      exportJson: exportJson,
      importJson: importJson
    };
  }

  return {
    createStore: createStore,
    Store: createStore(),
    Dates: Dates,
    PRIORITY_RANK: PRIORITY_RANK,
    STORAGE_KEY: STORAGE_KEY,
    SCHEMA_VERSION: SCHEMA_VERSION
  };
});
