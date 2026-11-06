(() => {
  const inEcg = /\/ecg\//.test(location.pathname);
  const links = inEcg
    ? { home: '../index.html#/home', assistant: 'index.html', my: 'device-management.html', mascot: 'assets/dongdong.png' }
    : { home: '#/home', assistant: 'ecg/index.html', my: 'ecg/device-management.html', mascot: 'ecg/assets/dongdong.png' };

  function render(nav, current) {
    const selected = key => current === key ? ' active' : '';
    const here = key => current === key ? ' aria-current="page"' : '';
    nav.innerHTML = `<a class="source-nav-tab${selected('home')}" href="${links.home}" aria-label="今日"${here('home')}><i data-lucide="sun"></i><span>今日</span></a>
      <span class="source-nav-tab" aria-label="心脏"><i data-lucide="heart"></i><span>心脏</span></span>
      <a class="source-nav-tab mascot-tab${selected('assistant')}" href="${links.assistant}" aria-label="咚咚"${here('assistant')}><img class="source-nav-avatar" src="${links.mascot}" alt=""><span>咚咚</span></a>
      <span class="source-nav-tab" aria-label="发现"><i data-lucide="orbit"></i><span>发现</span></span>
      <a class="source-nav-tab${selected('my')}" href="${links.my}" aria-label="我的"${here('my')}><i data-lucide="circle-user-round"></i><span>我的</span></a>`;
    window.lucide?.createIcons({ attrs: { 'stroke-width': 2 } });
  }

  window.HeartplusNav = { render };
  if (!inEcg) return;
  const params = new URLSearchParams(location.search);
  if (params.has('drawer') || params.has('preview') || params.has('dialog')) return;
  const mount = () => {
    const phone = document.querySelector('.phone');
    if (!phone || phone.querySelector('.merged-nav')) return;
    const nav = document.createElement('nav');
    nav.className = 'merged-nav';
    nav.setAttribute('aria-label', '主导航');
    phone.append(nav);
    render(nav, location.pathname.endsWith('/device-management.html') ? 'my' : 'assistant');
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
