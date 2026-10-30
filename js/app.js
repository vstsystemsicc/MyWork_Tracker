/* ==========================================================================
   MyWork Tracker — UI
   Feature 1: app shell + dashboard (+ minimal quick-add to feed it)
   ========================================================================== */
(function () {
  'use strict';

  var Store = window.MWT.Store;
  var Dates = window.MWT.Dates;

  var view = document.getElementById('view');
  var tabbar = document.getElementById('tabbar');
  var fab = document.getElementById('fab');
  var backdrop = document.getElementById('backdrop');
  var sheet = document.getElementById('sheet');
  var toasts = document.getElementById('toasts');
  var headerDate = document.getElementById('header-date');

  /* ------------------------------------------------------------- icons */
  var ICONS = {
    home: '<path d="M3 10.8 12 3.5l9 7.3"/><path d="M5.5 9.6V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.6"/>',
    book: '<path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v16.5H7.5A2.5 2.5 0 0 0 5 21Z"/><path d="M9 7h6"/><path d="M9 10.5h4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3 10.5h18"/>',
    folder: '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.2l2 2.2h7.8A2.5 2.5 0 0 1 21 9.7v7.8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5Z"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
    check: '<path d="M5 12.5 10 17.5 19.5 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    trash: '<path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l.9 13h9.2l.9-13"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>',
    sparkle: '<path d="M12 3.2 13.9 8l4.8 1.9-4.8 1.9L12 16.6l-1.9-4.8L5.3 9.9 10.1 8Z"/><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z"/>',
    chevron: '<path d="m9 5.5 6.5 6.5-6.5 6.5"/>',
    chart: '<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 16v-4M12.5 16V8M17 16v-6"/>',
    bulb: '<path d="M9 17.5h6"/><path d="M10 20.5h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.5.4.8 1 .8 1.6V17h5.6v-1.6c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4.5h9.5l-1.4 4 1.4 4H5"/>',
    layers: '<path d="m12 3 8.5 4.5L12 12 3.5 7.5Z"/><path d="m4.5 12.5 7.5 4 7.5-4"/><path d="m4.5 17 7.5 4 7.5-4"/>',
    list: '<path d="M8 6.5h12M8 12h12M8 17.5h12"/><circle cx="4" cy="6.5" r="1.2"/><circle cx="4" cy="12" r="1.2"/><circle cx="4" cy="17.5" r="1.2"/>',
    arrow: '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
    chevronLeft: '<path d="M15 5.5 8.5 12l6.5 6.5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/>',
    camera: '<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8l1.3-2h4.8l1.3 2h1.8A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5Z"/><circle cx="12" cy="13" r="3.4"/>',
    edit: '<path d="M4 20h4l10.5-10.5a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5Z"/><path d="m13.5 6.5 4 4"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="m4 18 5-5 4 4 2.5-2.5L20 18"/>',
    bell: '<path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6Z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
    pin: '<path d="m9 4 6 0-1 6 3 3H7l3-3Z"/><path d="M12 13v7"/>',
    archive: '<rect x="3" y="4" width="18" height="4" rx="1.5"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M10 12h4"/>',
    download: '<path d="M12 4v10"/><path d="m8 10.5 4 4 4-4"/><path d="M5 19h14"/>',
    upload: '<path d="M12 15V5"/><path d="m8 8.5 4-4 4 4"/><path d="M5 19h14"/>',
    dots: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    moon: '<path d="M20 14.4A8.4 8.4 0 0 1 9.6 4 8.5 8.5 0 1 0 20 14.4Z"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/>'
  };

  function icon(name, size) {
    var s = size || 24;
    var weight = name === 'check' ? 2.6 : 1.9;
    return (
      '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" ' +
      'stroke-width="' + weight + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      ICONS[name] + '</svg>'
    );
  }

  /* ------------------------------------------------------------ helpers */
  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return ESC[c]; });
  }

  var timeFmt = new Intl.DateTimeFormat(undefined, { timeStyle: 'short' });
  var shortDayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  var longDayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  function fmtTime(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return isNaN(d.getTime()) ? '' : timeFmt.format(d);
  }
  function fmtShortDay(key) {
    return shortDayFmt.format(Dates.fromKey(key));
  }

  // "Today" / "Tomorrow" / "3d overdue" / "Mon, 3 Nov"
  function dueLabel(key) {
    var diff = Dates.diffDays(key, Dates.today());
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 0) return Math.abs(diff) + 'd overdue';
    return fmtShortDay(key);
  }

  function greetingWord() {
    var h = new Date().getHours();
    if (h < 5) return 'Still working';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 21) return 'Good evening';
    return 'Good night';
  }

  function projectChip(projectId) {
    var project = Store.getProject(projectId);
    if (!project) return '';
    return (
      '<span class="chip"><i class="dot" style="background:' + esc(project.color) + '"></i>' +
      esc(project.name) + '</span>'
    );
  }

  function projectColor(projectId) {
    var project = Store.getProject(projectId);
    return project ? project.color : 'var(--primary)';
  }

  var PRIORITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High' };

  /* ---------------------------------------------------- light / dark mode */
  var MODE_KEY = 'mwt.mode';

  function currentMode() {
    var saved = '';
    try { saved = localStorage.getItem(MODE_KEY) || ''; } catch (e) { saved = ''; }
    return saved === 'light' ? 'light' : 'dark';
  }

  function applyMode(mode) {
    var valid = mode === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-mode', valid);
    try { localStorage.setItem(MODE_KEY, valid); } catch (e) { /* storage unavailable */ }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', valid === 'light' ? '#f4f1fa' : '#0a0812');
    return valid;
  }

  /* ------------------------------------------------------------- router */
  var TABS = [
    { id: 'home', label: 'Home', icon: 'home', hash: '#/home' },
    { id: 'log', label: 'Log', icon: 'book', hash: '#/log' },
    { id: 'plan', label: 'Plan', icon: 'calendar', hash: '#/plan' },
    { id: 'projects', label: 'Projects', icon: 'folder', hash: '#/projects' },
    { id: 'more', label: 'More', icon: 'grid', hash: '#/more' }
  ];

  var ROUTES = ['home', 'log', 'plan', 'projects', 'more', 'ideas', 'history'];

  function currentRoute() {
    var raw = (location.hash || '').replace(/^#\/?/, '').split('?')[0];
    if (raw.indexOf('project/') === 0) return 'project';
    return ROUTES.indexOf(raw) >= 0 ? raw : 'home';
  }

  function currentProjectId() {
    var raw = (location.hash || '').replace(/^#\/?/, '').split('?')[0];
    var match = /^project\/([^/]+)$/.exec(raw);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function activeTab(route) {
    if (route === 'project') return 'projects';
    if (route === 'ideas' || route === 'history') return 'more';
    return route;
  }

  function renderTabs(route) {
    var active = activeTab(route);
    tabbar.innerHTML =
      '<div class="tabbar-inner">' +
      TABS.map(function (tab) {
        return (
          '<a class="tab' + (tab.id === active ? ' active' : '') + '" href="' + tab.hash + '"' +
          (tab.id === active ? ' aria-current="page"' : '') + '>' +
          icon(tab.icon, 21) +
          '<span>' + tab.label + '</span></a>'
        );
      }).join('') +
      '</div>';
  }

  function render() {
    var route = currentRoute();
    var html;
    switch (route) {
      case 'home': html = dashboardView(); break;
      case 'log': html = logView(); break;
      case 'plan': html = planView(); break;
      case 'projects': html = projectsView(); break;
      case 'project': html = projectDetailView(currentProjectId()); break;
      case 'ideas': html = ideasView(); break;
      case 'history': html = historyView(); break;
      case 'more': html = moreView(); break;
      default: html = dashboardView();
    }
    view.innerHTML = html;
    view.setAttribute('data-route', route);
    renderTabs(route);
    headerDate.textContent = shortDayFmt.format(new Date());
    document.title = route === 'home' ? 'MyWork Tracker' : routeTitle(route) + ' · MyWork Tracker';
  }

  function rerender() {
    render();
  }

  function routeTitle(route) {
    var map = {
      home: 'Dashboard', log: 'Daily Work Log', plan: 'Future Planner', projects: 'Projects',
      project: 'Project', more: 'More', ideas: 'Ideas & Notes', history: 'History & Reports'
    };
    return map[route] || 'MyWork Tracker';
  }

  /* ---------------------------------------------------------- dashboard */
  function dashboardView() {
    var data = Store.getDashboard();
    var stats = data.stats;

    var loggedWord = stats.loggedToday === 1 ? '1 thing logged today' : stats.loggedToday + ' things logged today';

    return (
      '<section class="greeting">' +
        '<h1>' + greetingWord() + '</h1>' +
        '<p class="sub">' + longDayFmt.format(new Date()) + ' · <b>' + loggedWord + '</b></p>' +
      '</section>' +
      glanceCard(data) +
      '<div class="stat-grid">' +
        statCard('book', stats.loggedToday, 'Logged today', '') +
        statCard('check', stats.tasksDoneToday, 'Done today', 'green') +
        statCard('calendar', stats.open, 'Open tasks', 'blue') +
      '</div>' +
      todayTasksSection(data) +
      workSection(data) +
      doneSection(data) +
      upcomingSection(data)
    );
  }

  function statCard(iconName, value, label, tone) {
    return (
      '<div class="stat ' + tone + '">' +
        '<span class="stat-ico">' + icon(iconName, 13) + '</span>' +
        '<div class="num">' + esc(value) + '</div>' +
        '<div class="lbl">' + esc(label) + '</div>' +
      '</div>'
    );
  }

  function glanceCard(data) {
    var s = data.stats;
    var radius = 18;
    var circumference = 2 * Math.PI * radius;
    var offset = circumference * (1 - s.progressPct / 100);

    var title;
    var caption;
    if (s.plannedToday === 0) {
      title = 'Nothing planned for today';
      caption = 'Plan a task or log work to get started.';
    } else {
      title = s.finishedPlanned + ' of ' + s.plannedToday + ' planned done';
      caption =
        (s.overdue ? s.overdue + ' overdue · ' : '') +
        (s.tasksDoneToday ? s.tasksDoneToday + ' completed today' : 'Keep going — you are on it');
    }

    return (
      '<div class="glance">' +
        '<div class="ring">' +
          '<svg viewBox="0 0 44 44" aria-hidden="true">' +
            '<defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">' +
              '<stop offset="0%" class="g-from"/><stop offset="100%" class="g-to"/>' +
            '</linearGradient></defs>' +
            '<circle class="track" cx="22" cy="22" r="' + radius + '" fill="none" stroke-width="4"/>' +
            '<circle class="meter" cx="22" cy="22" r="' + radius + '" fill="none" stroke-width="4" ' +
              'stroke-dasharray="' + circumference.toFixed(2) + '" ' +
              'stroke-dashoffset="' + offset.toFixed(2) + '"/>' +
          '</svg>' +
          '<span class="pct">' + s.progressPct + '%</span>' +
        '</div>' +
        '<div class="glance-body"><strong>' + esc(title) + '</strong><span>' + esc(caption) + '</span></div>' +
      '</div>'
    );
  }

  function sectionHead(title, count, action) {
    return (
      '<div class="section-head">' +
        '<h2>' + esc(title) + (count ? '<span class="count">' + count + '</span>' : '') + '</h2>' +
        (action || '') +
      '</div>'
    );
  }

  // Today's plan: everything still open for today, late work first.
  function todayTasksSection(data) {
    var rows = data.todayTasks;
    return (
      '<section class="section">' +
        sectionHead('Today\'s tasks', rows.length, '') +
        (rows.length
          ? '<div class="list">' + rows.map(taskItemOpen).join('') + '</div>'
          : emptyState('calendar', 'No tasks for today',
              'Plan something for today, or just log the work you did.',
              'Plan for today', 'task', 'today')) +
      '</section>'
    );
  }

  function workSection(data) {
    var body;
    if (!data.work.length) {
      body = emptyState('book', 'No work logged yet',
        'Record what you finished today — it stays in your history forever.',
        'Log today\'s work', 'work');
    } else {
      body = '<div class="list">' + data.work.map(workItem).join('') + '</div>';
    }
    return (
      '<section class="section">' +
        sectionHead('Today\'s work', data.work.length, '') +
        body +
      '</section>'
    );
  }

  function workItem(w) {
    var project = Store.getProject(w.projectId);
    var bar = project ? project.color : 'var(--primary)';
    var photos = w.photos || [];
    return (
      '<div class="item" style="--bar:' + esc(bar) + '">' +
        '<button class="item-main item-btn" data-action="open-work" data-id="' + esc(w.id) + '">' +
          '<span class="item-title">' + esc(w.title) + '</span>' +
          '<span class="item-sub">' + projectChip(w.projectId) +
            '<span>' + esc(fmtTime(w.createdAt)) + '</span>' +
            (photos.length ? '<span class="chip">' + icon('camera', 12) + photos.length + '</span>' : '') +
          '</span>' +
          (w.description ? '<span class="item-desc">' + esc(w.description) + '</span>' : '') +
        '</button>' +
      '</div>'
    );
  }

  function doneSection(data) {
    return (
      '<section class="section">' +
        sectionHead('Completed today', data.doneToday.length, '') +
        (data.doneToday.length
          ? '<div class="list">' + data.doneToday.map(taskItemDone).join('') + '</div>'
          : emptyState('check', 'Nothing completed yet',
              'Tick a task when it\'s done and it will show up here.', null, null)
        ) +
      '</section>'
    );
  }

  function taskItemDone(t) {
    return (
      '<div class="item is-done" style="--bar:' + esc(projectColor(t.projectId)) + '">' +
        '<button class="check done" data-action="toggle-task" data-id="' + esc(t.id) + '" aria-label="Mark as not done">' +
          icon('check', 13) +
        '</button>' +
        '<button class="item-main item-btn" data-action="open-task" data-id="' + esc(t.id) + '">' +
          '<span class="item-title">' + esc(t.title) + '</span>' +
          '<span class="item-sub">' + projectChip(t.projectId) +
            '<span>Done ' + esc(fmtTime(t.completedAt)) + '</span>' +
          '</span>' +
        '</button>' +
      '</div>'
    );
  }

  function upcomingSection(data) {
    var rows = data.upcoming;
    return (
      '<section class="section">' +
        sectionHead('Upcoming', rows.length,
          rows.length > 5 ? '<button class="link" data-action="goto" data-route="plan">See all</button>' : '') +
        (rows.length
          ? '<div class="list">' + rows.slice(0, 5).map(taskItemOpen).join('') + '</div>' +
            (rows.length > 5
              ? '<p class="hint" style="margin:10px 2px 0">' + (rows.length - 5) + ' more in the planner</p>'
              : '')
          : emptyState('calendar', 'Nothing planned ahead',
              'Add tomorrow\'s work or anything for a future date.', 'Plan a task', 'task')) +
      '</section>'
    );
  }

  function taskItemOpen(t) {
    var late = t.dueDate < Dates.today();
    return (
      '<div class="item" style="--bar:' + esc(projectColor(t.projectId)) + '">' +
        '<button class="check" data-action="toggle-task" data-id="' + esc(t.id) + '" aria-label="Mark as done">' +
          icon('check', 13) +
        '</button>' +
        '<button class="item-main item-btn" data-action="open-task" data-id="' + esc(t.id) + '">' +
          '<span class="item-title">' + esc(t.title) + '</span>' +
          '<span class="item-sub">' +
            '<span class="chip ' + (late ? 'overdue' : 'today') + '">' + icon('clock', 12) + esc(dueLabel(t.dueDate)) + '</span>' +
            projectChip(t.projectId) +
            (t.priority !== 'medium'
              ? '<span class="chip pri-' + esc(t.priority) + '">' + esc(PRIORITY_LABEL[t.priority]) + '</span>'
              : '') +
          '</span>' +
        '</button>' +
      '</div>'
    );
  }

  function emptyState(iconName, title, text, ctaLabel, mode, day) {
    return (
      '<div class="empty">' +
        '<div class="e-ico">' + icon(iconName, 17) + '</div>' +
        '<strong>' + esc(title) + '</strong>' +
        '<p>' + esc(text) + '</p>' +
        (ctaLabel
          ? '<button data-action="add" data-mode="' + esc(mode || 'work') + '"' +
            (day ? ' data-day="' + esc(day) + '"' : '') + '>' + esc(ctaLabel) + '</button>'
          : '') +
      '</div>'
    );
  }

  /* ----------------------------------------------------------- work log */
  var logState = { day: Dates.today(), query: '' };

  function logView() {
    var total = Store.counts().work;
    return (
      '<div class="page-head">' +
        '<p class="eyebrow">Work log</p>' +
        '<h1>Daily Work Log</h1>' +
        '<p class="lede">' + (total === 1 ? '1 record saved' : total + ' records saved') + ' — kept forever.</p>' +
      '</div>' +
      searchField() +
      '<div id="log-body">' + logBody() + '</div>'
    );
  }

  function searchField() {
    return (
      '<div class="search-field">' +
        icon('search', 16) +
        '<input id="log-search" type="search" placeholder="Search your work…" autocomplete="off"' +
          ' aria-label="Search work records" value="' + esc(logState.query) + '">' +
        '<button type="button" class="search-clear" data-action="log-clear" aria-label="Clear search"' +
          (logState.query ? '' : ' hidden') + '>' + icon('close', 13) + '</button>' +
      '</div>'
    );
  }

  function logBody() {
    return logState.query.trim() ? searchResults() : dayBody();
  }

  function refreshLogBody() {
    var body = document.getElementById('log-body');
    if (body) body.innerHTML = logBody();
    var clear = document.querySelector('.search-clear');
    if (clear) clear.hidden = !logState.query.trim();
  }

  function relativeDayWord(key) {
    var diff = Dates.diffDays(key, Dates.today());
    if (diff === 0) return 'Today';
    if (diff === -1) return 'Yesterday';
    if (diff === 1) return 'Tomorrow';
    return '';
  }

  function dayBody() {
    var day = logState.day;
    var entries = Store.workForDay(day);
    var summary = Store.workDaySummary(day);
    var word = relativeDayWord(day);

    var meta = [summary.count === 1 ? '1 entry' : summary.count + ' entries'];
    if (summary.photos) meta.push(summary.photos === 1 ? '1 photo' : summary.photos + ' photos');

    return (
      '<div class="date-nav">' +
        '<button type="button" class="date-step" data-action="log-prev" aria-label="Previous day">' + icon('chevronLeft', 18) + '</button>' +
        '<div class="date-label-wrap">' +
          '<div class="date-label" aria-hidden="true">' +
            '<strong>' + esc(fmtShortDay(day)) + '</strong>' +
            '<span>' + esc(word || 'Tap for the calendar') + '</span>' +
          '</div>' +
          '<input type="date" class="date-input-overlay" id="log-date" value="' + esc(day) + '" aria-label="Pick a day">' +
        '</div>' +
        '<button type="button" class="date-step" data-action="log-next" aria-label="Next day">' + icon('chevron', 18) + '</button>' +
      '</div>' +

      '<div class="day-meta">' +
        '<span>' + esc(meta.join(' · ')) + '</span>' +
        (summary.projects.length
          ? '<span class="day-projects">' + summary.projects.map(function (p) {
              return '<i class="dot" style="background:' + esc(p.color) + '"></i>' + esc(p.name);
            }).join('<i class="sep">·</i>') + '</span>'
          : '') +
      '</div>' +

      (entries.length
        ? '<div class="list">' + entries.map(workLogItem).join('') + '</div>'
        : emptyState('book', 'Nothing logged on this day',
            'Add what you finished — it stays in your history forever.', null, null)) +

      '<button type="button" class="btn block add-day" data-action="add" data-mode="work" data-day="' + esc(day) + '">' +
        icon('plus', 16) + 'Add work for this day' +
      '</button>'
    );
  }

  function searchResults() {
    var q = logState.query.trim();
    var results = Store.searchWork(q);
    if (!results.length) {
      return (
        '<div class="empty">' +
          '<div class="e-ico">' + icon('search', 17) + '</div>' +
          '<strong>No matches</strong>' +
          '<p>Nothing found for “' + esc(q) + '”. Try another word.</p>' +
        '</div>'
      );
    }
    return (
      '<div class="results-head">' + results.length + (results.length === 1 ? ' record' : ' records') + '</div>' +
      '<div class="list">' + results.map(searchResultItem).join('') + '</div>'
    );
  }

  function searchResultItem(w) {
    return (
      '<div class="item" style="--bar:' + esc(projectColor(w.projectId)) + '">' +
        '<button type="button" class="item-main item-btn" data-action="open-work" data-id="' + esc(w.id) + '">' +
          '<span class="item-title">' + esc(w.title) + '</span>' +
          '<span class="item-sub">' +
            '<span class="chip">' + esc(fmtShortDay(w.date)) + '</span>' +
            projectChip(w.projectId) +
            (w.photos && w.photos.length
              ? '<span class="chip">' + icon('camera', 12) + w.photos.length + '</span>'
              : '') +
          '</span>' +
          (w.description ? '<span class="item-desc">' + esc(w.description) + '</span>' : '') +
        '</button>' +
      '</div>'
    );
  }

  function workLogItem(w) {
    var photos = w.photos || [];
    return (
      '<div class="item" style="--bar:' + esc(projectColor(w.projectId)) + '">' +
        '<button type="button" class="item-main item-btn" data-action="open-work" data-id="' + esc(w.id) + '">' +
          '<span class="item-title">' + esc(w.title) + '</span>' +
          '<span class="item-sub">' + projectChip(w.projectId) +
            '<span>' + esc(fmtTime(w.createdAt)) + '</span>' +
            (photos.length ? '<span class="chip">' + icon('camera', 12) + photos.length + '</span>' : '') +
          '</span>' +
          (w.description ? '<span class="item-desc">' + esc(w.description) + '</span>' : '') +
          (photos.length ? photoStrip(photos) : '') +
        '</button>' +
      '</div>'
    );
  }

  function photoStrip(photos) {
    var shown = photos.slice(0, 4);
    return (
      '<span class="thumb-strip">' +
        shown.map(function (p) {
          return '<img class="thumb" src="' + esc(p.src) + '" alt="" loading="lazy">';
        }).join('') +
        (photos.length > shown.length ? '<span class="thumb more">+' + (photos.length - shown.length) + '</span>' : '') +
      '</span>'
    );
  }

  /* -------------------------------------------------------- "More" page */
  function moreView() {
    var counts = Store.counts();
    return (
      '<div class="page-head">' +
        '<p class="eyebrow">Workspace</p>' +
        '<h1>More</h1>' +
        '<p class="lede">' + counts.work + ' work records · ' + counts.open + ' open tasks · ' + counts.notes + ' notes</p>' +
      '</div>' +
      '<div class="list" style="gap:9px">' +
        moreRow('bulb', 'Ideas & Notes', 'Save thoughts for later', '#/ideas') +
        moreRow('chart', 'History & Reports', 'Daily, weekly and monthly progress', '#/history') +
      '</div>' +
      remindersSection() +
      appearanceSection() +
      '<p class="ph-note" style="text-align:center;margin-top:22px">MyWork Tracker · all data stays on this device.</p>'
    );
  }

  function appearanceSection() {
    var mode = currentMode();
    var options = [
      { id: 'dark', name: 'Dark', note: 'Purple on near-black', iconName: 'moon' },
      { id: 'light', name: 'Light', note: 'Purple on white', iconName: 'sun' }
    ];
    return (
      '<section class="section" style="margin-top:26px">' +
        '<div class="section-head"><h2>Appearance</h2></div>' +
        '<div class="mode-row" role="radiogroup" aria-label="Appearance">' +
          options.map(function (option) {
            var on = option.id === mode;
            return (
              '<button type="button" class="mode-option' + (on ? ' active' : '') + '"' +
                ' role="radio" aria-checked="' + (on ? 'true' : 'false') + '"' +
                ' data-action="set-mode" data-mode="' + option.id + '">' +
                '<span class="mode-ico">' + icon(option.iconName, 18) + '</span>' +
                '<span class="mode-name">' + option.name + '</span>' +
                '<span class="mode-note">' + option.note + '</span>' +
              '</button>'
            );
          }).join('') +
        '</div>' +
        '<p class="hint" style="margin:10px 2px 0">Saved automatically on this device.</p>' +
      '</section>'
    );
  }

  function moreRow(iconName, title, sub, hash) {
    return (
      '<a class="item" href="' + hash + '" style="--bar:transparent">' +
        '<span class="e-ico" style="width:34px;height:34px;border-radius:11px;display:grid;place-items:center;color:var(--primary-2);background:var(--primary-soft);flex:none">' +
          icon(iconName, 17) +
        '</span>' +
        '<span class="item-main">' +
          '<span class="item-title">' + esc(title) + '</span>' +
          '<span class="item-sub">' + esc(sub) + '</span>' +
        '</span>' +
        '<span style="color:var(--muted);margin-top:6px">' + icon('chevron', 16) + '</span>' +
      '</a>'
    );
  }

  /* ------------------------------------------------------ future planner */
  function planView() {
    var g = Store.tasksGrouped();
    var groups = [
      { title: 'Overdue', rows: g.overdue, always: true },
      { title: 'Today', rows: g.today, always: true },
      { title: 'Tomorrow', rows: g.tomorrow, always: true },
      { title: 'This week', rows: g.week, always: true },
      { title: 'Later', rows: g.later, always: false }
    ];
    return (
      '<div class="page-head">' +
        '<p class="eyebrow">Planner</p>' +
        '<h1>Future Planner</h1>' +
        '<p class="lede">' + g.openCount + ' open · ' + g.doneCount + ' completed</p>' +
      '</div>' +
      '<button type="button" class="btn block plan-add" data-action="add" data-mode="task">' +
        icon('plus', 16) + 'Add a task' +
      '</button>' +
      groups.map(function (group) {
        if (!group.rows.length && !group.always) return '';
        return (
          '<section class="section">' +
            sectionHead(group.title, group.rows.length, '') +
            (group.rows.length
              ? '<div class="list">' + group.rows.map(taskItemOpen).join('') + '</div>'
              : '<p class="hint plan-empty">' + esc(emptyGroupText(group.title)) + '</p>') +
          '</section>'
        );
      }).join('') +
      '<p class="ph-note" style="text-align:center">Tap a task to reschedule it or set a reminder.</p>'
    );
  }

  function emptyGroupText(title) {
    var map = {
      Overdue: 'Nothing overdue — you are on top of it.',
      Today: 'Nothing left for today.',
      Tomorrow: 'Nothing planned for tomorrow yet.',
      'This week': 'Nothing else this week.',
      Later: 'No later tasks.'
    };
    return map[title] || 'Nothing here.';
  }

  /* ----------------------------------------------------------- projects */
  function projectsView() {
    var overview = Store.projectsOverview();
    var archived = Store.getState().projects.filter(function (p) { return p.archived; });
    var totalOpen = overview.reduce(function (n, row) { return n + row.stats.openTasks; }, 0);

    return (
      '<div class="page-head">' +
        '<p class="eyebrow">Workspace</p>' +
        '<h1>Projects</h1>' +
        '<p class="lede">' + overview.length + ' projects · ' + totalOpen + ' open tasks</p>' +
      '</div>' +
      '<div class="list">' + overview.map(projectRow).join('') + '</div>' +
      '<button type="button" class="btn block plan-add" data-action="new-project">' +
        icon('plus', 16) + 'New project' +
      '</button>' +
      (archived.length
        ? '<section class="section">' +
            '<div class="section-head"><h2>Archived</h2></div>' +
            '<div class="list">' + archived.map(archivedRow).join('') + '</div>' +
          '</section>'
        : '')
    );
  }

  function projectRow(row) {
    var p = row.project;
    var s = row.stats;
    var bits = [
      s.openTasks === 1 ? '1 open task' : s.openTasks + ' open tasks',
      s.work === 1 ? '1 work record' : s.work + ' work records'
    ];
    return (
      '<a class="item project-row" href="#/project/' + encodeURIComponent(p.id) + '" style="--bar:transparent">' +
        '<span class="project-avatar" style="background:' + hexToRgba(p.color, 0.18) + ';color:' + esc(p.color) + '">' +
          esc(p.name.charAt(0).toUpperCase()) +
        '</span>' +
        '<span class="item-main">' +
          '<span class="item-title">' + esc(p.name) + '</span>' +
          '<span class="item-sub">' + esc(bits.join(' · ')) + '</span>' +
        '</span>' +
        '<span class="chev">' + icon('chevron', 16) + '</span>' +
      '</a>'
    );
  }

  function archivedRow(p) {
    return (
      '<a class="item project-row" href="#/project/' + encodeURIComponent(p.id) + '" style="--bar:transparent;opacity:.72">' +
        '<span class="project-avatar" style="background:' + hexToRgba(p.color, 0.14) + ';color:' + esc(p.color) + '">' +
          esc(p.name.charAt(0).toUpperCase()) +
        '</span>' +
        '<span class="item-main">' +
          '<span class="item-title">' + esc(p.name) + '</span>' +
          '<span class="item-sub">Archived · tap to restore</span>' +
        '</span>' +
        '<span class="chev">' + icon('chevron', 16) + '</span>' +
      '</a>'
    );
  }

  function projectDetailView(id) {
    var project = Store.getProject(id);
    if (!project) {
      return (
        '<div class="empty">' +
          '<div class="e-ico">' + icon('folder', 17) + '</div>' +
          '<strong>Project not found</strong>' +
          '<p>It may have been removed.</p>' +
          '<button data-action="goto" data-route="projects">Back to projects</button>' +
        '</div>'
      );
    }
    var stats = Store.projectStats(id);
    var tasks = Store.tasksForProject(id);
    var works = Store.worksForProject(id, 10);
    var bits = [
      stats.work + (stats.work === 1 ? ' record' : ' records'),
      stats.openTasks + ' open',
      stats.doneTasks + ' done'
    ];

    return (
      '<a class="back-link" href="#/projects">' + icon('chevronLeft', 14) + 'Projects</a>' +
      '<div class="project-head">' +
        '<span class="project-avatar big" style="background:' + hexToRgba(project.color, 0.2) + ';color:' + esc(project.color) + '">' +
          esc(project.name.charAt(0).toUpperCase()) +
        '</span>' +
        '<div class="project-head-text">' +
          '<h1>' + esc(project.name) + '</h1>' +
          '<p>' + esc(bits.join(' · ')) + (project.archived ? ' · archived' : '') + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="project-actions">' +
        '<button type="button" class="btn ghost sm" data-action="edit-project" data-id="' + esc(project.id) + '">' +
          icon('edit', 14) + 'Edit</button>' +
        (project.archived
          ? '<button type="button" class="btn ghost sm" data-action="restore-project" data-id="' + esc(project.id) + '">' +
              icon('archive', 14) + 'Restore</button>'
          : project.id === 'p-general'
            ? ''
            : '<button type="button" class="btn ghost sm" data-action="archive-project" data-id="' + esc(project.id) + '">' +
                icon('archive', 14) + 'Archive</button>') +
      '</div>' +
      '<section class="section">' +
        sectionHead('Open tasks', tasks.length, '') +
        (tasks.length
          ? '<div class="list">' + tasks.map(taskItemOpen).join('') + '</div>'
          : '<p class="hint plan-empty">No open tasks in this project.</p>') +
      '</section>' +
      '<section class="section">' +
        sectionHead('Recent work', works.length, '') +
        (works.length
          ? '<div class="list">' + works.map(workLogItem).join('') + '</div>'
          : '<p class="hint plan-empty">No work logged for this project yet.</p>') +
      '</section>' +
      '<button type="button" class="btn block" data-action="add" data-mode="work" data-project="' + esc(project.id) + '">' +
        icon('plus', 16) + 'Add work to this project' +
      '</button>' +
      '<button type="button" class="btn ghost block plan-add" data-action="add" data-mode="task" data-project="' + esc(project.id) + '">' +
        'Add a task to this project' +
      '</button>'
    );
  }

  /* ------------------------------------------------------- ideas & notes */
  var ideasState = { query: '' };

  function ideasView() {
    var notes = Store.notesList(ideasState.query);
    var pinned = notes.filter(function (n) { return n.pinned; }).length;
    var total = Store.getState().notes.length;
    return (
      '<div class="page-head">' +
        '<p class="eyebrow">Ideas</p>' +
        '<h1>Ideas & Notes</h1>' +
        '<p class="lede">' + total + (total === 1 ? ' note' : ' notes') + ' · ' + pinned + ' pinned</p>' +
      '</div>' +
      '<div class="search-field">' +
        icon('search', 16) +
        '<input id="ideas-search" type="search" placeholder="Search notes…" autocomplete="off"' +
          ' aria-label="Search notes" value="' + esc(ideasState.query) + '">' +
        '<button type="button" class="search-clear" data-action="ideas-clear" aria-label="Clear search"' +
          (ideasState.query ? '' : ' hidden') + '>' + icon('close', 13) + '</button>' +
      '</div>' +
      '<div id="ideas-body">' + notesListHtml(notes) + '</div>' +
      '<button type="button" class="btn block plan-add" data-action="new-note">' +
        icon('plus', 16) + 'New note' +
      '</button>'
    );
  }

  function notesListHtml(notes) {
    if (!notes.length) {
      return ideasState.query.trim()
        ? emptyState('search', 'No notes match', 'Try another word.', null, null)
        : emptyState('bulb', 'No ideas saved yet',
            'Keep build ideas, part numbers and reminders here.', null, null);
    }
    return '<div class="list">' + notes.map(noteItem).join('') + '</div>';
  }

  function refreshIdeasBody() {
    var body = document.getElementById('ideas-body');
    if (body) body.innerHTML = notesListHtml(Store.notesList(ideasState.query));
    var clear = document.querySelector('.search-clear');
    if (clear) clear.hidden = !ideasState.query.trim();
  }

  function noteItem(note) {
    return (
      '<button type="button" class="item note-item" data-action="open-note" data-id="' + esc(note.id) + '" style="--bar:transparent">' +
        '<span class="item-main">' +
          '<span class="item-title">' +
            (note.pinned ? '<span class="pin-mark">' + icon('pin', 12) + '</span>' : '') +
            esc(note.title) +
          '</span>' +
          (note.body ? '<span class="item-desc">' + esc(note.body) + '</span>' : '') +
          '<span class="item-sub">' +
            '<span class="chip">' + esc(fmtShortDay(Dates.key(new Date(note.updatedAt)))) + '</span>' +
            (note.pinned ? '<span class="chip today">Pinned</span>' : '') +
          '</span>' +
        '</span>' +
      '</button>'
    );
  }

  /* ----------------------------------------------------- history & reports */
  var historyState = { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };

  function historyView() {
    var cal = Store.monthCalendar(historyState.year, historyState.month);
    var weekStart = Store.weekStartOf();
    var weekStats = Store.rangeStats(weekStart, Dates.addDays(weekStart, 6));
    var monthStats = Store.rangeStats(cal.startKey, cal.endKey);
    var monthName = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' })
      .format(new Date(cal.year, cal.month - 1, 1));
    var todayKey = Dates.today();
    var storageKb = Math.max(1, Math.round(Store.storageBytes() / 1024));

    var cells = [];
    var i;
    for (i = 0; i < cal.firstWeekday; i += 1) cells.push('<span class="cal-cell blank"></span>');
    for (i = 1; i <= cal.days; i += 1) {
      var key = Dates.key(new Date(cal.year, cal.month - 1, i));
      var count = cal.workByDay[key] || 0;
      var done = cal.tasksByDay[key] || 0;
      cells.push(
        '<button type="button" class="cal-cell' + (key === todayKey ? ' today' : '') + (count ? ' has-work' : '') + '"' +
          ' data-action="open-day" data-day="' + key + '"' +
          ' aria-label="' + esc(fmtShortDay(key)) + '">' +
          '<span class="cal-day">' + i + '</span>' +
          (count ? '<span class="cal-count">' + count + '</span>' : (done ? '<span class="cal-done">' + done + '</span>' : '')) +
        '</button>'
      );
    }

    var bars = [];
    for (i = 6; i >= 0; i -= 1) {
      var barDay = Dates.addDays(todayKey, -i);
      var barCount = Store.workForDay(barDay).length;
      bars.push(
        '<span class="bar-col' + (barCount ? '' : ' bar-empty') + '" title="' + esc(fmtShortDay(barDay)) + '">' +
          '<i class="bar" style="height:' + Math.min(100, 10 + barCount * 28) + '%"></i>' +
          '<small>' + esc(shortDayFmt.format(Dates.fromKey(barDay)).slice(0, 2)) + '</small>' +
        '</span>'
      );
    }

    return (
      '<div class="page-head">' +
        '<p class="eyebrow">Reports</p>' +
        '<h1>History</h1>' +
        '<p class="lede">' + Store.counts().work + ' records · ' + Store.counts().tasks + ' tasks</p>' +
      '</div>' +
      '<div class="week-bars" aria-hidden="true">' + bars.join('') + '</div>' +
      '<div class="stat-grid">' +
        statCard('book', weekStats.records, 'This week', '') +
        statCard('calendar', monthStats.records, 'This month', 'blue') +
        statCard('check', monthStats.tasksDone, 'Tasks done', 'green') +
      '</div>' +
      '<div class="cal-head">' +
        '<button type="button" class="date-step" data-action="month-prev" aria-label="Previous month">' + icon('chevronLeft', 16) + '</button>' +
        '<strong>' + esc(monthName) + '</strong>' +
        '<button type="button" class="date-step" data-action="month-next" aria-label="Next month">' + icon('chevron', 16) + '</button>' +
      '</div>' +
      '<div class="cal-weekdays">' +
        ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(function (d) { return '<span>' + d + '</span>'; }).join('') +
      '</div>' +
      '<div class="cal-grid">' + cells.join('') + '</div>' +
      '<p class="hint cal-note">' + esc(
        monthStats.activeDays + ' active days · ' +
        monthStats.photos + (monthStats.photos === 1 ? ' photo' : ' photos') +
        ' · tap a day to open it'
      ) + '</p>' +
      backupSection(storageKb)
    );
  }

  function backupSection(storageKb) {
    return (
      '<section class="section" style="margin-top:26px">' +
        '<div class="section-head"><h2>Backup</h2></div>' +
        '<div class="backup-card">' +
          '<p>Everything lives on this device. Export a copy to keep your history safe.</p>' +
          '<div class="sheet-actions">' +
            '<button type="button" class="btn sm" data-action="export-backup">' + icon('download', 14) + 'Export</button>' +
            '<button type="button" class="btn ghost sm" data-action="import-backup">' + icon('upload', 14) + 'Import</button>' +
          '</div>' +
          '<p class="hint">Storage used: about ' + storageKb + ' KB</p>' +
          '<input type="file" id="import-file" accept="application/json,.json" hidden>' +
        '</div>' +
      '</section>'
    );
  }

  /* ------------------------------------------------------------ reminders */
  function fmtReminder(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return shortDayFmt.format(d) + ' · ' + timeFmt.format(d);
  }

  function toLocalInput(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function remindersSection() {
    var permission = 'unsupported';
    if (typeof Notification !== 'undefined') permission = Notification.permission;
    var next = Store.getState().tasks
      .filter(function (t) { return !t.done && t.remindAt; })
      .sort(function (a, b) { return String(a.remindAt).localeCompare(String(b.remindAt)); })[0];

    return (
      '<section class="section" style="margin-top:26px">' +
        '<div class="section-head"><h2>Reminders</h2></div>' +
        '<div class="backup-card">' +
          (next
            ? '<p><strong>Next:</strong> ' + esc(next.title) + '<br>' +
              '<span class="hint">' + esc(fmtReminder(next.remindAt)) + '</span></p>'
            : '<p>No reminders yet. Open a task and set one.</p>') +
          (permission === 'granted'
            ? '<p class="hint">Browser notifications are on.</p>'
            : permission === 'denied'
              ? '<p class="hint">Notifications are blocked. Reminders still appear inside the app.</p>'
              : permission === 'unsupported'
                ? '<p class="hint">This browser cannot show system notifications; reminders appear in the app.</p>'
                : '<button type="button" class="btn sm" data-action="enable-reminders">Turn on notifications</button>') +
          '<p class="hint">Reminders appear while the app is open, or the next time you open it.</p>' +
        '</div>' +
      '</section>'
    );
  }

  function showReminder(task) {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    var title = 'Reminder: ' + task.title;
    var body = task.notes || (fmtShortDay(task.dueDate) + ' task');
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(function (reg) {
          if (reg.showNotification) {
            reg.showNotification(title, {
              body: body,
              icon: 'icons/icon-192.png',
              badge: 'icons/icon-192.png',
              tag: task.id
            });
          }
        }).catch(function () { /* ignore */ });
        return;
      }
    } catch (e) { /* fall through to the constructor */ }
    try {
      new Notification(title, { body: body, icon: 'icons/icon-192.png' });
    } catch (e) { /* notifications unavailable */ }
  }

  function checkReminders() {
    var due = Store.dueReminders();
    if (!due.length) return;
    due.slice(0, 5).forEach(function (task) {
      Store.markTaskReminded(task.id);
      showReminder(task);
      toast('Reminder: ' + task.title);
    });
    if (due.length > 5) toast((due.length - 5) + ' more reminders');
  }

  /* ------------------------------------------------------- sheet system */
  var sheetState = { mode: 'work', dateTouched: false, dayOverride: '', editingId: '', photos: [] };
  var sheetToken = 0;

  function openSheet() {
    sheetToken += 1;
    backdrop.hidden = false;
    sheet.hidden = false;
    sheet.removeAttribute('aria-hidden');
    document.body.classList.add('no-scroll');
    requestAnimationFrame(function () {
      backdrop.classList.add('open');
      sheet.classList.add('open');
    });
    var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (!coarse) {
      var first = sheet.querySelector('input, textarea, select');
      if (first) setTimeout(function () { first.focus(); }, 320);
    }
  }

  function closeSheet() {
    sheetToken += 1;
    var token = sheetToken;
    sheet.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.classList.remove('no-scroll');
    sheet.setAttribute('aria-hidden', 'true');
    setTimeout(function () {
      if (token !== sheetToken) return; // reopened in the meantime
      sheet.hidden = true;
      backdrop.hidden = true;
      sheet.innerHTML = '';
      sheet.removeAttribute('aria-hidden');
    }, 320);
  }

  function openAddSheet(mode, dayKey, projectId) {
    sheetState.mode = mode === 'task' ? 'task' : 'work';
    sheetState.dateTouched = false;
    sheetState.dayOverride = Dates.isValidKey(dayKey) ? dayKey : '';
    sheetState.editingId = '';
    sheetState.photos = [];
    var isTask = sheetState.mode === 'task';
    var defaultDate = sheetState.dayOverride || (isTask ? Dates.addDays(Dates.today(), 1) : Dates.today());
    var preselect = Store.getProject(projectId) ? projectId : defaultProjectId();

    sheet.innerHTML =
      '<div class="sheet-grip"></div>' +
      '<div class="sheet-head">' +
        '<div>' +
          '<h2 id="sheet-title">' + (isTask ? 'Plan a task' : 'Log work') + '</h2>' +
          '<p id="sheet-sub">' + (isTask ? 'Pick the project, then the day it is due.' : 'Pick the project, then the day you did it.') + '</p>' +
        '</div>' +
        '<button class="icon-btn" data-action="close-sheet" aria-label="Close">' + icon('close', 15) + '</button>' +
      '</div>' +
      '<div class="segmented" role="tablist">' +
        '<button type="button" role="tab" class="' + (isTask ? '' : 'active') + '" data-action="switch-mode" data-mode="work"' +
          ' aria-selected="' + (isTask ? 'false' : 'true') + '">' + icon('book', 14) + 'Work log</button>' +
        '<button type="button" role="tab" class="' + (isTask ? 'active' : '') + '" data-action="switch-mode" data-mode="task"' +
          ' aria-selected="' + (isTask ? 'true' : 'false') + '">' + icon('calendar', 14) + 'Task</button>' +
      '</div>' +
      '<form id="quick-form" data-mode="' + sheetState.mode + '" novalidate>' +
        '<div class="field">' +
          '<label>Project</label>' +
          projectPickerHtml(preselect) +
        '</div>' +
        '<div class="field">' +
          '<label for="f-date" id="f-date-label">' + (isTask ? 'Due day' : 'Day') + '</label>' +
          '<div class="day-row" role="group" aria-label="Quick day">' +
            '<button type="button" class="day-chip" data-action="set-day" data-offset="0" aria-pressed="false">Today</button>' +
            '<button type="button" class="day-chip" data-action="set-day" data-offset="1" aria-pressed="false">Tomorrow</button>' +
          '</div>' +
          '<input id="f-date" name="date" type="date" value="' + defaultDate + '" max="' + Dates.addDays(Dates.today(), 1825) + '" aria-label="Choose a date">' +
        '</div>' +
        '<div class="field">' +
          '<label for="f-title" id="f-title-label">' + (isTask ? 'What needs doing?' : 'What did you work on?') + '</label>' +
          '<input id="f-title" name="title" type="text" maxlength="140" autocomplete="off" enterkeyhint="done"' +
            ' placeholder="' + (isTask ? 'e.g. Finish controller wiring' : 'e.g. Finished CookieJet cart module') + '">' +
          '<p class="hint field-error" id="f-error" hidden></p>' +
        '</div>' +
        '<div class="field" id="f-priority-field" ' + (isTask ? '' : 'hidden') + '>' +
          '<label>Priority</label>' +
          '<div class="choices">' +
            ['low', 'medium', 'high'].map(function (p) {
              return '<input type="radio" name="priority" id="pri-' + p + '" value="' + p + '"' +
                (p === 'medium' ? ' checked' : '') + '><label for="pri-' + p + '">' + PRIORITY_LABEL[p] + '</label>';
            }).join('') +
          '</div>' +
        '</div>' +
        '<div class="field" id="f-remind-field" ' + (isTask ? '' : 'hidden') + '>' +
          '<label for="f-remind">Remind me <span class="label-note">optional</span></label>' +
          '<input id="f-remind" name="remindAt" type="datetime-local">' +
          '<p class="hint">Shows a notification while the app is open.</p>' +
        '</div>' +
        '<div class="field">' +
          '<label for="f-details" id="f-details-label">' + (isTask ? 'Notes (optional)' : 'Description (optional)') + '</label>' +
          '<textarea id="f-details" name="details" maxlength="2000"' +
            ' placeholder="' + (isTask ? 'Anything to remember' : 'What exactly did you do?') + '"></textarea>' +
        '</div>' +
        '<div class="field" id="f-photos-field" ' + (isTask ? 'hidden' : '') + '>' +
          '<label>Photos <span class="label-note">optional · up to 6</span></label>' +
          '<div class="photo-grid" id="photo-grid">' + photoGridHtml() + '</div>' +
          '<input type="file" id="f-photos" accept="image/*" multiple hidden>' +
        '</div>' +
        '<button class="btn block" type="submit" id="f-submit">' + (isTask ? 'Save task' : 'Save work') + '</button>' +
      '</form>';

    openSheet();
    syncDayChips();
    setTimeout(function () { sheet.scrollTop = 0; }, 0);
  }

  var LAST_PROJECT_KEY = 'mwt.lastProject';

  function lastProjectId() {
    try { return localStorage.getItem(LAST_PROJECT_KEY) || ''; } catch (e) { return ''; }
  }

  function rememberProject(id) {
    try { localStorage.setItem(LAST_PROJECT_KEY, id); } catch (e) { /* storage unavailable */ }
  }

  function defaultProjectId() {
    var list = Store.projects();
    var wanted = lastProjectId();
    var found = list.some(function (p) { return p.id === wanted; });
    return found ? wanted : (list.length ? list[0].id : '');
  }

  // Project chips — the first thing you pick, so work and tasks always land
  // under the right project.
  function projectPickerHtml(selectedId) {
    var projects = Store.projects();
    var selected = projects.some(function (p) { return p.id === selectedId; }) ? selectedId : defaultProjectId();
    return (
      '<div class="project-picker" role="radiogroup" aria-label="Project">' +
        projects.map(function (p) {
          return (
            '<label class="p-chip" style="--pc:' + esc(p.color) +
              ';--pc-soft:' + hexToRgba(p.color, 0.18) +
              ';--pc-line:' + hexToRgba(p.color, 0.6) + '">' +
              '<input type="radio" name="projectId" value="' + esc(p.id) + '"' +
                (p.id === selected ? ' checked' : '') + '>' +
              '<span class="p-chip-face"><i class="dot"></i>' + esc(p.name) + '</span>' +
            '</label>'
          );
        }).join('') +
      '</div>'
    );
  }

  function hexToRgba(hex, alpha) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    if (h.length !== 6 || /[^0-9a-f]/i.test(h)) return 'rgba(139, 92, 246, ' + alpha + ')';
    var n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ', ' + ((n >> 8) & 255) + ', ' + (n & 255) + ', ' + alpha + ')';
  }

  // Highlights "Today" / "Tomorrow" when the chosen date matches them.
  function syncDayChips() {
    var input = sheet.querySelector('#f-date');
    if (!input) return;
    var value = input.value;
    sheet.querySelectorAll('.day-chip').forEach(function (chip) {
      var key = Dates.addDays(Dates.today(), Number(chip.dataset.offset));
      var on = key === value;
      chip.classList.toggle('active', on);
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function switchMode(mode) {
    if (mode !== 'work' && mode !== 'task') return;
    var isTask = mode === 'task';
    sheetState.mode = mode;
    var form = sheet.querySelector('#quick-form');
    if (form) form.dataset.mode = mode;

    sheet.querySelectorAll('.segmented button').forEach(function (btn) {
      var on = btn.dataset.mode === mode;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    setText('#sheet-title', isTask ? 'Plan a task' : 'Log work');
    setText('#sheet-sub', isTask ? 'Pick the project, then the day it is due.' : 'Pick the project, then the day you did it.');
    setText('#f-title-label', isTask ? 'What needs doing?' : 'What did you work on?');
    setText('#f-date-label', isTask ? 'Due day' : 'Day');
    setText('#f-details-label', isTask ? 'Notes (optional)' : 'Description (optional)');
    setText('#f-submit', isTask ? 'Save task' : 'Save work');

    var title = sheet.querySelector('#f-title');
    if (title) title.placeholder = isTask ? 'e.g. Finish controller wiring' : 'e.g. Finished CookieJet cart module';
    var details = sheet.querySelector('#f-details');
    if (details) details.placeholder = isTask ? 'Anything to remember' : 'What exactly did you do?';

    var priField = sheet.querySelector('#f-priority-field');
    if (priField) priField.hidden = !isTask;

    var photosField = sheet.querySelector('#f-photos-field');
    if (photosField) photosField.hidden = isTask;

    var remindField = sheet.querySelector('#f-remind-field');
    if (remindField) remindField.hidden = !isTask;

    var date = sheet.querySelector('#f-date');
    if (date && !sheetState.dateTouched) {
      date.value = sheetState.dayOverride || (isTask ? Dates.addDays(Dates.today(), 1) : Dates.today());
    }
    syncDayChips();
  }

  /* ------------------------------------------------------------- photos */
  var MAX_PHOTOS = 6;

  function photoGridHtml() {
    var photos = sheetState.photos || [];
    return (
      photos.map(function (p) {
        return (
          '<div class="photo-thumb">' +
            '<img src="' + esc(p.src) + '" alt="">' +
            '<button type="button" class="photo-remove" data-action="remove-photo" data-id="' + esc(p.id) + '" aria-label="Remove photo">' +
              icon('close', 11) +
            '</button>' +
          '</div>'
        );
      }).join('') +
      (photos.length < MAX_PHOTOS
        ? '<button type="button" class="photo-add" data-action="pick-photos" aria-label="Add photos">' +
            icon('camera', 18) +
            '<span>' + (photos.length ? 'Add' : 'Add photo') + '</span>' +
          '</button>'
        : '')
    );
  }

  function renderPhotoGrid() {
    var grid = sheet.querySelector('#photo-grid');
    if (grid) grid.innerHTML = photoGridHtml();
  }

  function loadImageFromFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('Could not read that file')); };
      reader.onload = function () {
        var img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = function () { reject(new Error('That file is not an image')); };
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }

  // Keeps entries small enough to live in localStorage: longest edge 1280px,
  // JPEG quality steps down if the data URL is still heavy.
  function compressImage(img) {
    var longest = Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height) || 1;
    var attempts = [
      { max: 1280, quality: 0.74, limit: 700000 },
      { max: 1000, quality: 0.68, limit: 500000 },
      { max: 800, quality: 0.6, limit: 350000 }
    ];
    var result = null;
    for (var i = 0; i < attempts.length; i += 1) {
      var attempt = attempts[i];
      var scale = Math.min(1, attempt.max / longest);
      var w = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
      var h = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
      var canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0b0714';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      var src = canvas.toDataURL('image/jpeg', attempt.quality);
      result = { src: src, w: w, h: h };
      if (src.length <= attempt.limit) break;
    }
    return result;
  }

  async function handlePhotoFiles(fileList) {
    var files = Array.prototype.slice.call(fileList || []);
    var room = MAX_PHOTOS - sheetState.photos.length;
    if (room <= 0) {
      toast('Up to ' + MAX_PHOTOS + ' photos per entry');
      return;
    }
    if (files.length > room) {
      toast('Only ' + room + ' more photo' + (room === 1 ? '' : 's') + ' can be added');
    }
    files = files.slice(0, room);

    var failed = 0;
    for (var i = 0; i < files.length; i += 1) {
      try {
        var img = await loadImageFromFile(files[i]);
        var compressed = compressImage(img);
        sheetState.photos.push({
          id: 'ph-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          src: compressed.src,
          w: compressed.w,
          h: compressed.h,
          addedAt: new Date().toISOString()
        });
      } catch (e) {
        failed += 1;
      }
    }
    renderPhotoGrid();
    if (failed) toast(failed === 1 ? 'One photo could not be added' : failed + ' photos could not be added');
  }

  function setText(selector, text) {
    var el = sheet.querySelector(selector);
    if (el) el.textContent = text;
  }

  function readForm() {
    var form = sheet.querySelector('#quick-form');
    if (!form) return null;
    var data = new FormData(form);
    var priorityInput = form.querySelector('input[name="priority"]:checked');
    var remindRaw = String(data.get('remindAt') || '');
    var remindDate = remindRaw ? new Date(remindRaw) : null;
    return {
      mode: form.dataset.mode,
      title: String(data.get('title') || '').trim(),
      projectId: String(data.get('projectId') || 'p-general'),
      date: String(data.get('date') || ''),
      details: String(data.get('details') || '').trim(),
      priority: priorityInput ? priorityInput.value : 'medium',
      remindAt: remindDate && !isNaN(remindDate.getTime()) ? remindDate.toISOString() : ''
    };
  }

  function submitQuickForm() {
    var values = readForm();
    if (!values) return;
    var errorEl = sheet.querySelector('#f-error');
    var titleInput = sheet.querySelector('#f-title');

    function showError(message) {
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.hidden = false;
      }
      if (titleInput) titleInput.focus();
    }

    if (!values.title) {
      showError(values.mode === 'task' ? 'Give the task a name first.' : 'Write what you worked on first.');
      return;
    }
    if (errorEl) errorEl.hidden = true;

    try {
      if (values.mode === 'task') {
        Store.addTask({
          title: values.title,
          notes: values.details,
          projectId: values.projectId,
          dueDate: values.date || Dates.addDays(Dates.today(), 1),
          priority: values.priority,
          remindAt: values.remindAt || null
        });
        toast(values.remindAt ? 'Task planned with a reminder' : 'Task planned');
      } else if (sheetState.editingId) {
        Store.updateWork(sheetState.editingId, {
          title: values.title,
          description: values.details,
          projectId: values.projectId,
          date: values.date || Dates.today(),
          photos: sheetState.photos
        });
        toast('Work updated');
      } else {
        Store.addWork({
          title: values.title,
          description: values.details,
          projectId: values.projectId,
          date: values.date || Dates.today(),
          photos: sheetState.photos
        });
        toast('Work saved to your history');
      }
      rememberProject(values.projectId);
      if (values.mode !== 'task') logState.day = values.date || Dates.today();
      closeSheet();
      rerender();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      showError(err.userMessage || 'Could not save that. Try again.');
    }
  }

  /* ------------------------------------------------------- detail sheet */
  function openWorkDetail(id) {
    var w = Store.getWork(id);
    if (!w) return;
    var project = Store.getProject(w.projectId);
    sheet.innerHTML =
      '<div class="sheet-grip"></div>' +
      '<div class="sheet-head">' +
        '<div><h2>' + esc(w.title) + '</h2><p>' + esc(fmtShortDay(w.date)) + ' · ' + esc(fmtTime(w.createdAt)) + '</p></div>' +
        '<button class="icon-btn" data-action="close-sheet" aria-label="Close">' + icon('close', 15) + '</button>' +
      '</div>' +
      '<div class="item-sub" style="margin:-6px 0 14px;gap:8px">' +
        (project ? projectChip(project.id) : '') +
        '<span class="chip">Work log</span>' +
      '</div>' +
      (w.description
        ? '<div class="detail-desc">' + esc(w.description) + '</div>'
        : '<p class="hint" style="margin:0 0 14px 2px">No description added.</p>') +
      (w.photos && w.photos.length
        ? '<div class="detail-photos">' + w.photos.map(function (p) {
            return (
              '<button type="button" class="photo-thumb" data-action="view-photo" data-id="' + esc(w.id) +
                '" data-photo="' + esc(p.id) + '" aria-label="View photo">' +
                '<img src="' + esc(p.src) + '" alt="">' +
              '</button>'
            );
          }).join('') + '</div>'
        : '') +
      '<dl class="detail-list" style="margin:0 0 18px">' +
        detailRow('Project', project ? project.name : 'General') +
        detailRow('Date', fmtShortDay(w.date)) +
        detailRow('Saved', fmtTime(w.createdAt)) +
        (w.updatedAt && w.updatedAt !== w.createdAt ? detailRow('Last edited', fmtTime(w.updatedAt)) : '') +
        detailRow('Photos', w.photos && w.photos.length ? w.photos.length + ' attached' : 'None') +
      '</dl>' +
      '<div class="sheet-actions">' +
        '<button class="btn" data-action="edit-work" data-id="' + esc(w.id) + '">' + icon('edit', 15) + 'Edit</button>' +
        '<button class="btn danger" data-action="delete-work" data-id="' + esc(w.id) + '">Delete</button>' +
      '</div>';
    openSheet();
  }

  // Opens the composer already filled with an existing record.
  function openEditWork(id) {
    var w = Store.getWork(id);
    if (!w) return;
    openAddSheet('work', w.date);
    sheetState.editingId = w.id;
    sheetState.photos = (w.photos || []).slice();

    var form = sheet.querySelector('#quick-form');
    if (!form) return;
    var title = form.querySelector('#f-title');
    var details = form.querySelector('#f-details');
    var date = form.querySelector('#f-date');
    if (title) title.value = w.title;
    if (details) details.value = w.description;
    if (date) date.value = w.date;
    var radio = form.querySelector('input[name="projectId"][value="' + w.projectId + '"]');
    if (radio) radio.checked = true;

    var segmented = sheet.querySelector('.segmented');
    if (segmented) segmented.hidden = true;
    setText('#sheet-title', 'Edit work');
    setText('#sheet-sub', 'Fix a detail or add a photo — the record keeps its place in history.');
    setText('#f-submit', 'Save changes');
    syncDayChips();
    renderPhotoGrid();
  }

  function openLightbox(src) {
    var box = document.getElementById('lightbox');
    var img = document.getElementById('lightbox-img');
    if (!box || !img) return;
    img.src = src;
    box.hidden = false;
    requestAnimationFrame(function () { box.classList.add('open'); });
  }

  function closeLightbox() {
    var box = document.getElementById('lightbox');
    var img = document.getElementById('lightbox-img');
    if (!box) return;
    box.classList.remove('open');
    setTimeout(function () {
      box.hidden = true;
      if (img) img.removeAttribute('src');
    }, 250);
  }

  function openTaskDetail(id) {
    var t = Store.getTask(id);
    if (!t) return;
    var project = Store.getProject(t.projectId);
    var late = !t.done && t.dueDate < Dates.today();
    sheet.innerHTML =
      '<div class="sheet-grip"></div>' +
      '<div class="sheet-head">' +
        '<div><h2>' + esc(t.title) + '</h2><p>' + esc(t.done ? 'Completed' : 'Open task') + '</p></div>' +
        '<button class="icon-btn" data-action="close-sheet" aria-label="Close">' + icon('close', 15) + '</button>' +
      '</div>' +
      '<div class="item-sub" style="margin:-6px 0 14px;gap:8px">' +
        '<span class="chip ' + (late ? 'overdue' : 'today') + '">' + icon('clock', 12) + esc(dueLabel(t.dueDate)) + '</span>' +
        '<span class="chip pri-' + esc(t.priority) + '">' + esc(PRIORITY_LABEL[t.priority]) + '</span>' +
        (project ? projectChip(project.id) : '') +
      '</div>' +
      (t.notes
        ? '<div class="detail-desc">' + esc(t.notes) + '</div>'
        : '<p class="hint" style="margin:0 0 14px 2px">No notes added.</p>') +
      (t.done ? '' :
        '<div class="field">' +
          '<label>Move to</label>' +
          '<div class="quick-days">' +
            '<button type="button" class="quick-day" data-action="reschedule" data-id="' + esc(t.id) + '" data-offset="1">Tomorrow</button>' +
            '<button type="button" class="quick-day" data-action="reschedule" data-id="' + esc(t.id) + '" data-offset="7">Next week</button>' +
            '<button type="button" class="quick-day" data-action="reschedule" data-id="' + esc(t.id) + '" data-offset="0">Today</button>' +
          '</div>' +
        '</div>') +
      (t.done ? '' :
        '<div class="field">' +
          '<label for="detail-remind">Reminder <span class="label-note">optional</span></label>' +
          '<div class="remind-row">' +
            '<input id="detail-remind" type="datetime-local" value="' + esc(toLocalInput(t.remindAt)) + '">' +
            '<button type="button" class="btn sm" data-action="save-reminder" data-id="' + esc(t.id) + '">Set</button>' +
          '</div>' +
          (t.remindAt
            ? '<p class="hint">' + esc((t.remindedAt ? 'Reminded ' : 'Set for ') + fmtReminder(t.remindAt)) + '</p>'
            : '<p class="hint">Leave empty and tap Set to clear.</p>') +
        '</div>') +
      '<dl class="detail-list" style="margin:0 0 18px">' +
        detailRow('Deadline', fmtShortDay(t.dueDate)) +
        detailRow('Priority', PRIORITY_LABEL[t.priority]) +
        detailRow('Project', project ? project.name : 'General') +
        detailRow('Reminder', t.remindAt ? fmtReminder(t.remindAt) : 'None') +
        detailRow('Created', fmtShortDay(Dates.key(new Date(t.createdAt)))) +
        (t.done && t.completedAt ? detailRow('Completed', fmtShortDay(t.completedOn) + ' · ' + fmtTime(t.completedAt)) : '') +
      '</dl>' +
      '<div class="sheet-actions">' +
        '<button class="btn ' + (t.done ? 'ghost' : '') + '" data-action="toggle-detail-task" data-id="' + esc(t.id) + '">' +
          (t.done ? 'Mark as not done' : 'Mark as done') +
        '</button>' +
        '<button class="btn danger" data-action="delete-task" data-id="' + esc(t.id) + '">Delete</button>' +
      '</div>';
    openSheet();
  }

  function detailRow(label, value) {
    return '<div class="detail-row"><dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd></div>';
  }

  /* ----------------------------------------------- project & note sheets */
  function openProjectSheet(id) {
    var project = id ? Store.getProject(id) : null;
    var colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f97316', '#ec4899', '#06b6d4', '#facc15', '#94a3b8'];
    var current = project ? project.color : colors[0];

    sheet.innerHTML =
      '<div class="sheet-grip"></div>' +
      '<div class="sheet-head">' +
        '<div><h2>' + (project ? 'Edit project' : 'New project') + '</h2>' +
          '<p>' + (project ? 'Rename it or change its colour.' : 'Group work and tasks under one name.') + '</p></div>' +
        '<button class="icon-btn" data-action="close-sheet" aria-label="Close">' + icon('close', 15) + '</button>' +
      '</div>' +
      '<form id="project-form" data-id="' + esc(project ? project.id : '') + '" novalidate>' +
        '<div class="field">' +
          '<label for="p-name">Project name</label>' +
          '<input id="p-name" name="name" type="text" maxlength="60" autocomplete="off" value="' +
            esc(project ? project.name : '') + '" placeholder="e.g. CNC Machine">' +
          '<p class="hint field-error" id="p-error" hidden></p>' +
        '</div>' +
        '<div class="field">' +
          '<label>Colour</label>' +
          '<div class="color-row">' +
            colors.map(function (c) {
              return '<label class="color-chip" style="--sw:' + c + '">' +
                '<input type="radio" name="color" value="' + c + '"' + (c === current ? ' checked' : '') + '>' +
                '<span></span></label>';
            }).join('') +
          '</div>' +
        '</div>' +
        '<button class="btn block" type="submit">' + (project ? 'Save project' : 'Create project') + '</button>' +
      '</form>' +
      (project && project.id !== 'p-general'
        ? '<button type="button" class="btn ghost block plan-add" data-action="' +
            (project.archived ? 'restore-project' : 'archive-project') + '" data-id="' + esc(project.id) + '">' +
            (project.archived ? 'Restore project' : 'Archive project') + '</button>'
        : '');
    openSheet();
  }

  function openNoteSheet(id) {
    var note = id ? Store.getNote(id) : null;
    sheet.innerHTML =
      '<div class="sheet-grip"></div>' +
      '<div class="sheet-head">' +
        '<div><h2>' + (note ? 'Edit note' : 'New note') + '</h2>' +
          '<p>' + (note ? 'Change anything and save.' : 'An idea, a part number, a reminder.') + '</p></div>' +
        '<button class="icon-btn" data-action="close-sheet" aria-label="Close">' + icon('close', 15) + '</button>' +
      '</div>' +
      '<form id="note-form" data-id="' + esc(note ? note.id : '') + '" novalidate>' +
        '<div class="field">' +
          '<label for="n-title">Title</label>' +
          '<input id="n-title" name="title" type="text" maxlength="90" autocomplete="off" value="' +
            esc(note ? note.title : '') + '" placeholder="e.g. Conveyor belt idea">' +
        '</div>' +
        '<div class="field">' +
          '<label for="n-body">Note</label>' +
          '<textarea id="n-body" name="body" maxlength="4000" placeholder="What should you remember?">' +
            esc(note ? note.body : '') + '</textarea>' +
        '</div>' +
        '<label class="switch-row">' +
          '<input type="checkbox" name="pinned"' + (note && note.pinned ? ' checked' : '') + '>' +
          '<span>Pin to the top</span>' +
        '</label>' +
        '<button class="btn block" type="submit">Save note</button>' +
      '</form>' +
      (note
        ? '<button type="button" class="btn danger block plan-add" data-action="delete-note" data-id="' + esc(note.id) + '">Delete note</button>'
        : '');
    openSheet();
  }

  function saveProjectForm(form) {
    var id = form.dataset.id;
    var nameInput = form.querySelector('#p-name');
    var colorInput = form.querySelector('input[name="color"]:checked');
    var errorEl = form.querySelector('#p-error');
    var data = {
      name: String(nameInput ? nameInput.value : '').trim(),
      color: colorInput ? colorInput.value : '#8b5cf6'
    };
    try {
      if (!data.name) throw new Error('Project name is required.');
      if (id) Store.updateProject(id, data);
      else Store.addProject(data);
      closeSheet();
      toast(id ? 'Project updated' : 'Project created');
      rerender();
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err.userMessage || err.message;
        errorEl.hidden = false;
      }
    }
  }

  function saveNoteForm(form) {
    var id = form.dataset.id;
    var title = String((form.querySelector('#n-title') || {}).value || '').trim();
    var body = String((form.querySelector('#n-body') || {}).value || '').trim();
    var pinned = !!(form.querySelector('input[name="pinned"]') || {}).checked;
    if (!title && !body) {
      toast('Write something first');
      return;
    }
    try {
      if (id) Store.updateNote(id, { title: title, body: body, pinned: pinned });
      else Store.addNote({ title: title, body: body, pinned: pinned });
      closeSheet();
      toast(id ? 'Note updated' : 'Note saved');
      rerender();
    } catch (err) {
      toast(err.userMessage || 'Could not save the note');
    }
  }

  /* -------------------------------------------------------------- backup */
  var pendingImport = null;

  function exportBackup() {
    try {
      var blob = new Blob([Store.exportJson()], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = 'mywork-backup-' + Dates.today() + '.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
      toast('Backup file created');
    } catch (e) {
      toast('Could not create the backup file');
    }
  }

  function handleImportFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onerror = function () { toast('Could not read that file'); };
    reader.onload = function () {
      var text = String(reader.result || '');
      try {
        var parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object') throw new Error('empty');
        pendingImport = {
          text: text,
          work: Array.isArray(parsed.work) ? parsed.work.length : 0,
          tasks: Array.isArray(parsed.tasks) ? parsed.tasks.length : 0,
          notes: Array.isArray(parsed.notes) ? parsed.notes.length : 0
        };
        openImportSheet();
      } catch (e) {
        toast('That file is not a MyWork backup');
      }
    };
    reader.readAsText(file);
  }

  function openImportSheet() {
    if (!pendingImport) return;
    sheet.innerHTML =
      '<div class="sheet-grip"></div>' +
      '<div class="sheet-head">' +
        '<div><h2>Import backup</h2><p>This replaces everything on this device.</p></div>' +
        '<button class="icon-btn" data-action="close-sheet" aria-label="Close">' + icon('close', 15) + '</button>' +
      '</div>' +
      '<div class="detail-desc">The file contains:<br>' +
        '<strong>' + pendingImport.work + '</strong> work records<br>' +
        '<strong>' + pendingImport.tasks + '</strong> tasks<br>' +
        '<strong>' + pendingImport.notes + '</strong> notes' +
      '</div>' +
      '<div class="sheet-actions">' +
        '<button class="btn ghost" data-action="cancel-import">Cancel</button>' +
        '<button class="btn danger" data-action="confirm-import">Replace</button>' +
      '</div>';
    openSheet();
  }

  /* -------------------------------------------------------------- toast */
  function toast(message) {
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = icon('check', 15) + '<span>' + esc(message) + '</span>';
    toasts.appendChild(el);
    setTimeout(function () {
      el.classList.add('out');
      setTimeout(function () { el.remove(); }, 260);
    }, 2100);
  }

  /* ------------------------------------------------------------ actions */
  function onAction(event) {
    var el = event.target.closest('[data-action]');
    if (!el) return;
    var action = el.dataset.action;

    switch (action) {
      case 'add': {
        event.preventDefault();
        var wantedDay = el.dataset.day === 'today' ? Dates.today() : '';
        if (!wantedDay && Dates.isValidKey(el.dataset.day)) wantedDay = el.dataset.day;
        openAddSheet(el.dataset.mode || 'work', wantedDay, el.dataset.project || '');
        break;
      }

      case 'log-prev':
        logState.day = Dates.addDays(logState.day, -1);
        refreshLogBody();
        break;

      case 'log-next':
        logState.day = Dates.addDays(logState.day, 1);
        refreshLogBody();
        break;

      case 'log-today':
        logState.day = Dates.today();
        refreshLogBody();
        break;

      case 'log-clear': {
        logState.query = '';
        var searchInput = document.getElementById('log-search');
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        refreshLogBody();
        break;
      }

      case 'pick-photos': {
        var fileInput = sheet.querySelector('#f-photos');
        if (fileInput) fileInput.click();
        break;
      }

      case 'remove-photo': {
        sheetState.photos = sheetState.photos.filter(function (p) { return p.id !== el.dataset.id; });
        renderPhotoGrid();
        break;
      }

      case 'edit-work':
        openEditWork(el.dataset.id);
        break;

      case 'view-photo': {
        var workRecord = Store.getWork(el.dataset.id);
        var photo = workRecord && (workRecord.photos || []).find(function (p) { return p.id === el.dataset.photo; });
        if (photo) openLightbox(photo.src);
        break;
      }

      case 'close-lightbox':
        closeLightbox();
        break;

      case 'new-project':
        openProjectSheet('');
        break;

      case 'edit-project':
        openProjectSheet(el.dataset.id);
        break;

      case 'archive-project':
        Store.updateProject(el.dataset.id, { archived: true });
        closeSheet();
        toast('Project archived');
        rerender();
        break;

      case 'restore-project':
        Store.updateProject(el.dataset.id, { archived: false });
        closeSheet();
        toast('Project restored');
        rerender();
        break;

      case 'new-note':
        openNoteSheet('');
        break;

      case 'open-note':
        openNoteSheet(el.dataset.id);
        break;

      case 'delete-note': {
        if (!el.dataset.armed) {
          el.dataset.armed = '1';
          el.textContent = 'Tap again to delete';
          setTimeout(function () {
            if (el.isConnected) {
              delete el.dataset.armed;
              el.textContent = 'Delete note';
            }
          }, 3500);
          return;
        }
        Store.deleteNote(el.dataset.id);
        closeSheet();
        toast('Note deleted');
        rerender();
        break;
      }

      case 'ideas-clear': {
        ideasState.query = '';
        var ideaInput = document.getElementById('ideas-search');
        if (ideaInput) {
          ideaInput.value = '';
          ideaInput.focus();
        }
        refreshIdeasBody();
        break;
      }

      case 'reschedule': {
        var offset = Number(el.dataset.offset) || 0;
        Store.updateTask(el.dataset.id, { dueDate: Dates.addDays(Dates.today(), offset) });
        closeSheet();
        toast(offset === 0 ? 'Moved to today' : offset === 1 ? 'Moved to tomorrow' : 'Moved ' + offset + ' days ahead');
        rerender();
        break;
      }

      case 'save-reminder': {
        var remindInput = document.getElementById('detail-remind');
        var raw = remindInput ? remindInput.value : '';
        var iso = '';
        if (raw) {
          var when = new Date(raw);
          if (!isNaN(when.getTime())) iso = when.toISOString();
        }
        Store.updateTask(el.dataset.id, { remindAt: iso || null });
        toast(iso ? 'Reminder set' : 'Reminder cleared');
        openTaskDetail(el.dataset.id);
        break;
      }

      case 'month-prev':
      case 'month-next': {
        var step = action === 'month-prev' ? -1 : 1;
        var month = historyState.month + step;
        var year = historyState.year;
        if (month < 1) { month = 12; year -= 1; }
        if (month > 12) { month = 1; year += 1; }
        historyState.month = month;
        historyState.year = year;
        render();
        break;
      }

      case 'open-day':
        logState.day = el.dataset.day;
        location.hash = '#/log';
        break;

      case 'export-backup':
        exportBackup();
        break;

      case 'import-backup': {
        var importInput = document.getElementById('import-file');
        if (importInput) importInput.click();
        break;
      }

      case 'confirm-import': {
        if (!pendingImport) return;
        try {
          Store.importJson(pendingImport.text);
          pendingImport = null;
          closeSheet();
          toast('Backup imported');
          rerender();
        } catch (err) {
          toast(err.userMessage || 'That backup could not be imported');
        }
        break;
      }

      case 'cancel-import':
        pendingImport = null;
        closeSheet();
        break;

      case 'enable-reminders': {
        if (typeof Notification === 'undefined') {
          toast('This browser cannot show notifications');
          break;
        }
        Notification.requestPermission().then(function (result) {
          toast(result === 'granted'
            ? 'Reminders are on'
            : 'Notifications blocked — reminders still show in the app');
          rerender();
        });
        break;
      }

      case 'set-mode': {
        var chosenMode = applyMode(el.dataset.mode);
        document.querySelectorAll('.mode-option').forEach(function (option) {
          var on = option.dataset.mode === chosenMode;
          option.classList.toggle('active', on);
          option.setAttribute('aria-checked', on ? 'true' : 'false');
        });
        toast(chosenMode === 'light' ? 'Light mode saved' : 'Dark mode saved');
        break;
      }

      case 'close-sheet':
        closeSheet();
        break;

      case 'switch-mode':
        switchMode(el.dataset.mode);
        break;

      case 'set-day': {
        var dateInput = sheet.querySelector('#f-date');
        if (!dateInput) return;
        dateInput.value = Dates.addDays(Dates.today(), Number(el.dataset.offset) || 0);
        sheetState.dateTouched = true;
        syncDayChips();
        break;
      }

      case 'goto': {
        var route = el.dataset.route;
        closeSheet();
        if (route) location.hash = '#/' + route;
        break;
      }

      case 'open-work':
        openWorkDetail(el.dataset.id);
        break;

      case 'open-task':
        openTaskDetail(el.dataset.id);
        break;

      case 'toggle-task': {
        var task = Store.getTask(el.dataset.id);
        if (!task) return;
        var wasDone = task.done;
        Store.setTaskDone(task.id, !wasDone); // store notifies -> re-render
        toast(wasDone ? 'Moved back to upcoming' : 'Nice — marked as done');
        break;
      }

      case 'toggle-detail-task': {
        var task2 = Store.getTask(el.dataset.id);
        if (!task2) return;
        var wasDone2 = task2.done;
        Store.setTaskDone(task2.id, !wasDone2); // notify is skipped while the sheet is open
        closeSheet();
        rerender();
        toast(wasDone2 ? 'Moved back to upcoming' : 'Nice — marked as done');
        break;
      }

      case 'delete-work':
      case 'delete-task': {
        var id = el.dataset.id;
        if (!el.dataset.armed) {
          el.dataset.armed = '1';
          el.textContent = 'Tap again to delete';
          setTimeout(function () {
            if (el.isConnected) {
              delete el.dataset.armed;
              el.textContent = 'Delete';
            }
          }, 3500);
          return;
        }
        if (action === 'delete-work') Store.deleteWork(id);
        else Store.deleteTask(id);
        closeSheet();
        toast('Deleted');
        rerender();
        break;
      }

      default:
        break;
    }
  }

  /* -------------------------------------------------------------- wiring */
  document.addEventListener('click', function (event) {
    if (backdrop.contains(event.target) && event.target === backdrop) {
      closeSheet();
      return;
    }
    onAction(event);
  });

  document.addEventListener('submit', function (event) {
    if (!event.target) return;
    if (event.target.id === 'quick-form') {
      event.preventDefault();
      submitQuickForm();
    } else if (event.target.id === 'project-form') {
      event.preventDefault();
      saveProjectForm(event.target);
    } else if (event.target.id === 'note-form') {
      event.preventDefault();
      saveNoteForm(event.target);
    }
  });

  document.addEventListener('input', function (event) {
    if (event.target && event.target.id === 'f-date') {
      sheetState.dateTouched = true;
      syncDayChips();
    }
    if (event.target && event.target.id === 'log-search') {
      logState.query = event.target.value;
      refreshLogBody();
    }
    if (event.target && event.target.id === 'ideas-search') {
      ideasState.query = event.target.value;
      refreshIdeasBody();
    }
  });

  document.addEventListener('change', function (event) {
    if (event.target && event.target.id === 'f-date') {
      sheetState.dateTouched = true;
      syncDayChips();
    }
    if (event.target && event.target.id === 'log-date' && Dates.isValidKey(event.target.value)) {
      logState.day = event.target.value;
      refreshLogBody();
    }
    if (event.target && event.target.id === 'f-photos') {
      handlePhotoFiles(event.target.files);
      event.target.value = ''; // allow picking the same file again
    }
    if (event.target && event.target.id === 'import-file') {
      handleImportFile(event.target.files && event.target.files[0]);
      event.target.value = '';
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      var box = document.getElementById('lightbox');
      if (box && !box.hidden) {
        closeLightbox();
        return;
      }
      if (sheet.classList.contains('open')) closeSheet();
    }
  });

  fab.addEventListener('click', function () {
    openAddSheet('work');
  });

  window.addEventListener('hashchange', function () {
    if (sheet.classList.contains('open')) closeSheet();
    window.scrollTo({ top: 0 });
    render();
  });

  // Re-render on external data changes (another tab, import, etc.)
  Store.subscribe(function () {
    if (sheet.classList.contains('open')) return;
    rerender();
  });

  // Another tab changed the data: pull it in and re-render.
  window.addEventListener('storage', function (event) {
    if (event.key === 'mwt.data.v1') Store.reload();
  });

  // Keep "today" honest if the app is left open across midnight, and refresh
  // the greeting when the tab becomes visible again.
  var lastDay = Dates.today();
  setInterval(function () {
    var now = Dates.today();
    if (now !== lastDay) {
      lastDay = now;
      render();
    }
  }, 60000);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && !sheet.classList.contains('open')) {
      lastDay = Dates.today();
      checkReminders();
      render();
    }
  });

  // Offline shell (only meaningful over http/https, not file://)
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline cache is optional */ });
    });
  }

  applyMode(currentMode());
  render();
  checkReminders();
  setInterval(checkReminders, 30000);
})();
