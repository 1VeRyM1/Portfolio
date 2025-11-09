// Theme module: handles light/dark theme, icon swap and remembers choice
const ThemeModule = (function () {
  const THEME_KEY = 'theme';
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return null;

  const icon = toggle.querySelector('.theme-icon');
  const ICONS = {
    light: 'images/icons/light-theme.svg',
    dark: 'images/icons/dark-theme.svg'
  };

  const stored = localStorage.getItem(THEME_KEY);
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const initial = stored ? stored : (prefersLight ? 'light' : 'dark');

  function applyTheme(theme) {
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
      toggle.setAttribute('aria-pressed', 'true');
      if (icon) { icon.src = ICONS.light; icon.alt = 'Светлая тема'; }
    } else {
      root.removeAttribute('data-theme');
      toggle.setAttribute('aria-pressed', 'false');
      if (icon) { icon.src = ICONS.dark; icon.alt = 'Тёмная тема'; }
    }
  }

  function setTheme(theme) {
    applyTheme(theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }

  function bind() {
    toggle.addEventListener('click', () => {
      const isLight = root.getAttribute('data-theme') === 'light';
      setTheme(isLight ? 'dark' : 'light');
    });

    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: light)');
      mq.addEventListener && mq.addEventListener('change', e => {
        const storedNow = localStorage.getItem(THEME_KEY);
        if (!storedNow) setTheme(e.matches ? 'light' : 'dark');
      });
    }
  }

  setTheme(initial);
  bind();

  return { setTheme, applyTheme };
})();

// Modal module: opens project preview modal, fills content and handles close
const ModalModule = (function () {
  const projects = Array.from(document.querySelectorAll('.projects__item'));
  const modalWindow = document.querySelector('.modal');
  const modalOverlay = document.querySelector('.overlay');
  const modalCloseBtn = document.querySelector('.modal__trigger');
  if (!modalWindow || !modalOverlay) {
    // still attach nothing if modal markup absent
    return null;
  }

  function readContent(element) {
    const imgEl = element.querySelector('img');
    const imagesProject = imgEl ? imgEl.getAttribute('src') : '';
    const titleEl = element.querySelector('.projects__item-title');
    const titleProject = titleEl ? titleEl.innerHTML : '';
    const descEl = element.querySelector('.projects__item-description');
    const descriptionProject = descEl ? descEl.innerHTML : '';
    const demoProject = element.hasAttribute('data-demo') ? element.getAttribute('data-demo') : '';
    return { imagesProject, titleProject, descriptionProject, demoProject };
  }

  function showModalContent(content) {
    const img = modalWindow.querySelector('img');
    const title = modalWindow.querySelector('.modal__title');
    const desc = modalWindow.querySelector('.modal__description');
    const link = modalWindow.querySelector('.modal__link');

    if (img && content.imagesProject) img.setAttribute('src', content.imagesProject);
    if (title) title.innerHTML = content.titleProject;
    if (desc) desc.innerHTML = content.descriptionProject;

    if (link) {
      if (content.demoProject && content.demoProject !== '') {
        link.style.display = 'inline-block';
        link.setAttribute('href', content.demoProject);
      } else {
        link.style.display = 'none';
        link.removeAttribute('href');
      }
    }
  }

  function openModal(content) {
    showModalContent(content);
    document.body.style.overflow = 'hidden';
    modalWindow.style.display = 'flex';
    modalOverlay.style.display = 'block';
    modalWindow.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    document.body.style.overflow = '';
    modalWindow.style.display = 'none';
    modalOverlay.style.display = 'none';
    modalWindow.setAttribute('aria-hidden', 'true');
    const img = modalWindow.querySelector('img');
    if (img) img.removeAttribute('src');
  }

  function bindProjectClicks() {
    projects.forEach(p => {
      p.addEventListener('click', () => {
        const content = readContent(p);
        openModal(content);
      });
    });
  }

  function bindCloseHandlers() {
    modalOverlay.addEventListener('click', closeModal);
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalWindow.style.display === 'flex') closeModal();
    });
  }

  bindProjectClicks();
  bindCloseHandlers();

  return { openModal, closeModal };
})();

// Filter module: filters projects by tag buttons and manages active state
const FilterModule = (function () {
  const filterButtons = Array.from(document.querySelectorAll('.projects__technology'));
  const items = Array.from(document.querySelectorAll('.projects__item'));
  const ACTIVE_CLASS = 'is-active';
  if (!filterButtons.length || !items.length) return null;

  const getTags = el => {
    const raw = el.getAttribute('data-technology') || '';
    return raw.split(/\s+/).filter(Boolean).map(t => t.toLowerCase());
  };

  const showItem = (el) => { el.style.display = ''; el.removeAttribute('aria-hidden'); };
  const hideItem = (el) => { el.style.display = 'none'; el.setAttribute('aria-hidden', 'true'); };

  const applyFilter = (filter) => {
    const normFilter = (filter || '').toString().toLowerCase();
    items.forEach(item => {
      if (!normFilter || normFilter === '*') {
        showItem(item);
        return;
      }
      const tags = getTags(item);
      if (tags.includes(normFilter)) showItem(item);
      else hideItem(item);
    });
  };

  const setActiveButton = (btn) => {
    filterButtons.forEach(b => {
      if (b === btn) {
        b.classList.add(ACTIVE_CLASS);
        b.setAttribute('aria-pressed', 'true');
      } else {
        b.classList.remove(ACTIVE_CLASS);
        b.setAttribute('aria-pressed', 'false');
      }
    });
  };

  function bind() {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const filter = btn.getAttribute('data-filter') || '*';
        applyFilter(filter);
        setActiveButton(btn);
      });
    });

    const defaultBtn = filterButtons.find(b => (b.getAttribute('data-filter') || '') === '*') || filterButtons[0];
    if (defaultBtn) {
      setActiveButton(defaultBtn);
      applyFilter(defaultBtn.getAttribute('data-filter') || '*');
    }

    filterButtons.forEach((btn, idx) => {
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const next = filterButtons[(idx + 1) % filterButtons.length];
          next.focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = filterButtons[(idx - 1 + filterButtons.length) % filterButtons.length];
          prev.focus();
        }
      });
    });
  }

  bind();
  return { applyFilter, setActiveButton };
})();

// Form module: AJAX submit to Formspree, shows status messages
const FormModule = (function () {
  const form = document.querySelector('.contact__form');
  const msgBox = document.getElementById('formMsg');
  if (!form || !msgBox) return null;

  async function submitHandler(e) {
    e.preventDefault();
    msgBox.textContent = 'Отправка...';
    msgBox.style.color = '';

    const url = form.getAttribute('action');
    const formData = new FormData(form);

    try {
      const res = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        await res.json();
        msgBox.textContent = 'Сообщение успешно отправлено. Спасибо!';
        msgBox.style.color = 'var(--accent)';
        form.reset();
      } else {
        let errText = 'Ошибка отправки. Попробуйте позже.';
        try {
          const errData = await res.json();
          if (errData && errData.errors && errData.errors.length) {
            errText = errData.errors.map(x => x.message).join(', ');
          }
        } catch (jsonErr) {}
        msgBox.textContent = errText;
        msgBox.style.color = 'crimson';
      }
    } catch (networkErr) {
      msgBox.textContent = 'Ошибка сети. Проверьте подключение и попробуйте ещё раз.';
      msgBox.style.color = 'crimson';
    }
  }

  form.addEventListener('submit', submitHandler);
  return { submitHandler };
})();

// Scroll module: smooth scroll to anchors and data-target buttons with header offset
const ScrollModule = (function () {
  const HEADER = document.querySelector('.header');
  const HEADER_OFFSET = HEADER ? HEADER.offsetHeight : 0;

  function scrollToElement(target) {
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const top = rect.top + scrollTop - HEADER_OFFSET - 12;
    window.scrollTo({ top, behavior: 'smooth' });
    try { history.pushState(null, '', `#${target.id}`); } catch (err) {}
    setTimeout(() => {
      try {
        target.focus({ preventScroll: true });
      } catch (e) {
        const tabindex = target.getAttribute('tabindex');
        if (!tabindex) target.setAttribute('tabindex', '-1');
        target.focus();
        if (!tabindex) target.removeAttribute('tabindex');
      }
    }, 550);
  }

  function bindAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        scrollToElement(target);
      });
    });
  }

  function bindDataTargets() {
    document.querySelectorAll('[data-target]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const sel = btn.getAttribute('data-target');
        const target = document.querySelector(sel);
        scrollToElement(target);
      });
    });
  }

  bindAnchors();
  bindDataTargets();

  return { scrollToElement };
})();

