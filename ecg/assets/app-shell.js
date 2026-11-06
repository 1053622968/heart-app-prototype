(function () {
  let root;
  let backdrop;
  let locked = false;
  const icon = name => `<i data-lucide="${name}"></i>`;
  const refresh = () => window.lucide && window.lucide.createIcons({ attrs: { 'stroke-width': 2 } });

  function ensureRoot() {
    root = root || document.querySelector('.phone');
    if (!root) return null;
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'ai-shell-backdrop';
      backdrop.addEventListener('click', event => { if (event.target === backdrop) closeTaskDrawer(); });
      root.append(backdrop);
    }
    return root;
  }

  function guardianMarkup(tasks) {
    const measuring = tasks.filter(item => item.status === 'measuring').length;
    const waiting = tasks.filter(item => item.status === 'waiting').length;
    const analyzing = tasks.filter(item => item.status === 'analyzing').length;
    if (tasks.length === 1) {
      const task = tasks[0];
      if (task.status === 'waiting') return { cls: 'waiting', first: '测量已结束', second: '待接收数据' };
      if (task.status === 'analyzing') return { cls: 'analyzing', first: 'AI分析中', second: '请稍候…' };
      return { cls: '', first: '测量中', second: `剩 ${task.remaining}` };
    }
    return { cls: waiting ? 'waiting' : '', first: '健康守护中', second: `${measuring}个测量中，${waiting}个待接收，${analyzing}个分析中数据` };
  }

  function openActiveTasks(tasks = window.PrototypeState.getActiveTasks()) {
    if (!tasks.length) return;
    tasks.length === 1 ? openTaskDrawer(tasks[0].id) : openTaskPicker(tasks);
  }

  function renderTodayTaskCopy(tasks) {
    const entry = document.getElementById('todayTaskEntry');
    if (!entry) return;
    entry.hidden = !tasks.length;
    if (!tasks.length) return;
    const copy = guardianMarkup(tasks);
    document.getElementById('todayTaskStatus').textContent = copy.first;
    document.getElementById('todayTaskSummary').textContent = copy.second;
    const button = document.getElementById('todayTaskViewButton');
    if (button) button.onclick = () => openActiveTasks(tasks);
  }

  function renderProgressShortcut(tasks) {
    const shortcut = document.getElementById('dynamicProgressShortcut');
    if (!shortcut) return;
    shortcut.hidden = !tasks.length;
    shortcut.onclick = () => openActiveTasks(tasks);
  }

  function mount() {
    if (!ensureRoot()) return;
    root.querySelector('.guardian-entry')?.remove();
    const tasks = window.PrototypeState.getActiveTasks();
    renderTodayTaskCopy(tasks);
    renderProgressShortcut(tasks);
    refresh();
  }

  function openTaskPicker(tasks = window.PrototypeState.getActiveTasks()) {
    ensureRoot();
    locked = false;
    const statusCopy = task => task.status === 'waiting' ? '测量已结束 · 待接收数据' : task.status === 'analyzing' ? '分析中，请稍候...' : `测量中 · 剩 ${task.remaining}`;
    const statusIcon = task => task.status === 'waiting' ? 'download' : task.status === 'analyzing' ? 'sparkles' : 'activity';
    backdrop.innerHTML = `<section class="task-picker" role="dialog" aria-modal="true" aria-label="测量进程"><header class="task-picker-head"><h2>测量进程</h2><button type="button" aria-label="关闭">${icon('x')}</button></header><div>${tasks.map(task => `<button class="task-picker-item ${task.status}" type="button" data-task-id="${task.id}"><span class="task-picker-icon">${icon(statusIcon(task))}</span><span class="task-picker-copy"><strong>${statusCopy(task)}</strong><span>${window.PrototypeState.taskSubject(task)}</span></span>${icon('chevron-right')}</button>`).join('')}</div></section>`;
    backdrop.classList.add('open');
    backdrop.querySelector('.task-picker-head button').addEventListener('click', closeTaskDrawer);
    backdrop.querySelectorAll('[data-task-id]').forEach(button => button.addEventListener('click', () => openTaskDrawer(button.dataset.taskId)));
    refresh();
  }

  function openTaskDrawer(taskId) {
    ensureRoot();
    locked = false;
    backdrop.innerHTML = `<section class="ai-shell-drawer" role="dialog" aria-modal="true" aria-label="AI健康管家任务"><header class="ai-shell-head"><img src="assets/dongdong.png" alt=""><strong>AI健康管家</strong><button class="ai-shell-close" type="button" aria-label="关闭">${icon('x')}</button></header><iframe class="ai-shell-frame" title="动态心电任务流程" src="index.html?drawer=task&taskId=${encodeURIComponent(taskId)}"></iframe></section>`;
    backdrop.classList.add('open');
    backdrop.querySelector('.ai-shell-close').addEventListener('click', closeTaskDrawer);
    refresh();
  }

  function closeTaskDrawer() {
    if (!backdrop || !backdrop.classList.contains('open')) return;
    if (locked) {
      const frame = backdrop.querySelector('iframe');
      frame?.contentWindow?.postMessage({ type: 'task-lock-notice' }, '*');
      return;
    }
    backdrop.classList.remove('open');
    backdrop.innerHTML = '';
  }

  window.addEventListener('message', event => {
    if (!event.data || event.data.type !== 'task-lock') return;
    locked = Boolean(event.data.locked);
    const close = backdrop?.querySelector('.ai-shell-close');
    if (close) close.hidden = locked;
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeTaskDrawer(); });

  window.PrototypeShell = { mount, openActiveTasks, openTaskDrawer, openTaskPicker, closeTaskDrawer };
})();
