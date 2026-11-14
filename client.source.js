/* Source module body, assembled by scripts/build.mjs with the pure helper modules. */
export function installE621(ctx, React, dictionaries) {
  const h = React.createElement;
  const core = createCore();
  const storage = createStorage();
  const ns = 'e621-style';
  let disposed = false;
  let settings = core.normalizeSettings(core.defaults);
  let displayed = createPattern();
  let lastRandom = '';
  let previousMode = '';
  let loaded = false;
  let message = '';
  let messageType = 'status';
  let busy = false;
  let timer;
  let cancelImage = () => {};
  let removeTokens = () => {};
  let previousTheme = null;
  const themeId = 'e621-style';
  let snapshot;
  let queue = Promise.resolve();
  const listeners = new Set();
  for (const [locale, dictionary] of Object.entries(dictionaries)) {
    ctx.effect(() => ctx.locale.register(ns, locale, dictionary.ui));
  }
  const t = ctx.locale.bind(ns);
  function tr(key) {
    const selected = settings.locale;
    if (selected !== 'auto') return dictionaries[selected]?.ui?.[key] ?? t(key);
    return t(key);
  }
  const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
  const getSnapshot = () => snapshot;
  function publish() {
    if (disposed) return;
    snapshot = { settings, displayed, loaded, message, messageType, busy };
    listeners.forEach(fn => fn());
  }
  function status(key, type = 'status', detail = '') {
    message = key ? tr(key) + detail : '';
    messageType = type;
    publish();
  }
  function restoreTheme() {
    if (previousTheme === null) return;
    const current = ctx.theme.getTheme();
    const target = previousTheme;
    previousTheme = null;
    if (current.preference === themeId) {
      ctx.theme.setTheme(target === 'system' || current.themes.some(theme => theme.id === target) ? target : 'system');
    }
  }
  function refreshTokens() {
    if (settings.enabled) {
      if (ctx.theme.getTheme().preference !== themeId) {
        previousTheme = ctx.theme.getTheme().preference;
        ctx.theme.setTheme(themeId);
      }
      const tokens = createThemeTokens(settings.opacity, Boolean(displayed));
      // The same named layer replaces itself atomically, without flashing the base theme.
      removeTokens = ctx.theme.overrideTokens('dsh-e621-style', Object.fromEntries(
        Object.entries(tokens).map(([key, value]) => [key, { light: value, dark: value }]),
      ));
    } else {
      removeTokens();
      removeTokens = () => {};
      restoreTheme();
    }
  }
  function rememberRandom(value) {
    lastRandom = value;
    queue = queue.catch(() => {}).then(async () => {
      if (disposed) return;
      await storage.write({ version: 1, settings, lastRandom });
    }).catch(error => status('storageFailed', 'error', String(error.message || error)));
  }
  function showImage(url) {
    cancelImage();
    cancelImage = () => {};
    if (!url) {
      displayed = settings.mode === 'none' ? '' : createPattern();
      refreshTokens();
      publish();
      return;
    }
    if (url === displayed) { refreshTokens(); publish(); return; }
    const image = new Image();
    let cancelled = false;
    const timeout = setTimeout(() => finish(false), 20000);
    function finish(ok) {
      if (cancelled || disposed) return;
      cancelled = true;
      clearTimeout(timeout);
      image.onload = image.onerror = null;
      if (ok) {
        displayed = url;
        if (settings.mode === 'random') rememberRandom(url);
        refreshTokens();
        status('saved');
      } else {
        status('imageFailed', 'error');
      }
    }
    image.referrerPolicy = 'no-referrer';
    image.onload = () => finish(true);
    image.onerror = () => finish(false);
    cancelImage = () => {
      cancelled = true;
      clearTimeout(timeout);
      image.onload = image.onerror = null;
      image.src = '';
    };
    status('imageLoading');
    image.src = url;
  }
  function pickRandom() {
    if (!settings.urls.length) { status('noImages', 'error'); return; }
    showImage(core.chooseRandom(settings.urls, displayed));
  }
  function schedule() {
    clearInterval(timer);
    if (settings.enabled && settings.mode === 'random' && settings.interval > 0 && settings.urls.length > 1) {
      timer = setInterval(() => { if (!document.hidden) pickRandom(); }, settings.interval * 1000);
    }
  }
  function applySettings(initial = false) {
    const modeChanged = previousMode !== settings.mode;
    previousMode = settings.mode;
    refreshTokens();
    schedule();
    if (!settings.enabled) { cancelImage(); publish(); return; }
    if (settings.mode === 'pattern' || settings.mode === 'none') {
      cancelImage();
      displayed = settings.mode === 'pattern' ? createPattern() : '';
      refreshTokens();
      publish();
    } else if (settings.mode === 'custom') {
      showImage(settings.customUrl);
    } else if (!settings.urls.length) {
      showImage('');
    } else if (initial || modeChanged || !settings.urls.includes(displayed)) {
      const target = initial && !settings.randomOnLoad && settings.urls.includes(lastRandom)
        ? lastRandom : core.chooseRandom(settings.urls, displayed);
      showImage(target);
    }
    publish();
  }
  function save(change) {
    queue = queue.catch(() => {}).then(async () => {
      if (disposed) return false;
      try {
        const proposed = typeof change === 'function' ? change(settings) : { ...settings, ...change };
        const next = core.normalizeSettings(proposed);
        const total = next.urls.reduce((sum, url) => sum + url.length, 0) + next.customUrl.length;
        if (total > core.LIBRARY_LIMIT) throw new Error(tr('libraryFull'));
        const nextRandom = next.urls.includes(lastRandom) ? lastRandom : '';
        await storage.write({ version: 1, settings: next, lastRandom: nextRandom });
        if (disposed) return false;
        lastRandom = nextRandom;
        settings = next;
        status('saved');
        applySettings();
        return true;
      } catch (error) {
        status('storageFailed', 'error', String(error.message || error));
        return false;
      }
    });
    return queue;
  }
  function addImages(images) {
    return save(current => {
      const urls = [...new Set([...current.urls, ...images])];
      if (urls.length > 100 || urls.reduce((sum, url) => sum + url.length, 0) + current.customUrl.length > core.LIBRARY_LIMIT) {
        throw new Error(tr('libraryFull'));
      }
      return { ...current, urls };
    });
  }
  function readFile(file) {
    return new Promise((resolve, reject) => {
      if (file.size > core.IMAGE_LIMIT) { reject(new Error(tr('fileTooLarge') + file.name)); return; }
      if (!/^image\/(png|jpeg|webp|gif|avif)$/i.test(file.type)) { reject(new Error(tr('fileType') + file.name)); return; }
      const reader = new FileReader();
      reader.onload = () => {
        try { resolve(core.validateImageUrl(reader.result)); } catch (error) { reject(error); }
      };
      reader.onerror = () => reject(new Error(tr('fileReadFailed') + file.name));
      reader.onabort = () => reject(new Error(tr('fileReadFailed') + file.name));
      reader.readAsDataURL(file);
    });
  }
  async function upload(files, multiple) {
    busy = true;
    status('working');
    try {
      if (!files.length) return;
      if (files.length > 100) throw new Error(tr('libraryFull'));
      // Read sequentially to avoid allocating an entire large batch twice in memory.
      const images = [];
      let size = 0;
      for (const file of files) {
        const image = await readFile(file);
        size += image.length;
        if (size > core.LIBRARY_LIMIT) throw new Error(tr('libraryFull'));
        images.push(image);
      }
      if (disposed) return;
      if (multiple) await addImages(images);
      else await save({ customUrl: images[0], mode: 'custom' });
    } catch (error) {
      status('invalid', 'error', String(error.message || error));
    } finally {
      busy = false;
      publish();
    }
  }
  publish();
  function useView() {
    const view = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    React.useSyncExternalStore(fn => ctx.locale.subscribe(fn), () => ctx.locale.getSnapshot(), () => ctx.locale.getSnapshot());
    return view;
  }
  function ThemeSurface() {
    const { settings: s, displayed: url } = useView();
    const patterned = url === createPattern();
    const size = patterned ? '168px 194px' : (s.scale === 100 ? s.fit : `${s.scale}% auto`);
    const dynamic = s.enabled ? `body:has([data-e621-active]){--e621-image:${core.cssUrl(url)};--e621-dim:${patterned ? 0 : s.dim};--e621-blur:${patterned ? 0 : s.blur}px;--e621-size:${size};--e621-repeat:${patterned ? 'repeat' : 'no-repeat'};--e621-position:${patterned ? 'left top' : s.position};}` : '';
    return h(React.Fragment, null,
      h('style', null, STYLE),
      s.enabled && h('span', { hidden: true, 'data-e621-active': '', 'data-classic': s.classic ? '' : undefined }),
      s.enabled && h('style', null, dynamic),
    );
  }
  function ToggleRow({ id, value, onChange, hint, disabled }) {
    const [draft, setDraft] = React.useState(value);
    const [pending, setPending] = React.useState(false);
    React.useEffect(() => { if (!pending) setDraft(value); }, [value, pending]);
    const inputId = `e621-toggle-${id}`;
    const helpId = `${inputId}-help`;
    return h('div', { className: 'e621-toggle-row' },
      h('label', { className: 'e621-toggle-control', htmlFor: inputId, 'aria-busy': pending || undefined },
        h('input', {
          id: inputId, className: 'e621-toggle-input', type: 'checkbox', role: 'switch',
          checked: draft, 'aria-checked': draft, 'aria-describedby': hint ? helpId : undefined,
          disabled: disabled || pending,
          onChange: async event => {
            const next = event.target.checked;
            setDraft(next);
            setPending(true);
            try {
              if (await onChange(next) === false) setDraft(value);
            } catch (error) {
              setDraft(value);
              status('storageFailed', 'error', String(error.message || error));
            } finally { setPending(false); }
          },
        }),
        h('span', { className: 'e621-toggle-track', 'aria-hidden': true }),
        h('span', { className: 'e621-toggle-title' }, tr(id)),
      ),
      hint && h('p', { id: helpId, className: 'e621-muted e621-toggle-help' }, tr(hint)),
    );
  }
  function Settings() {
    const { settings: s, displayed: url, message: notice, messageType: type, loaded: ready, busy: processing } = useView();
    const [customUrl, setCustomUrl] = React.useState(s.customUrl.startsWith('data:') ? '' : s.customUrl);
    const [urlsText, setUrlsText] = React.useState('');
    const [confirm, setConfirm] = React.useState('');
    const [intervalText, setIntervalText] = React.useState(String(s.interval));
    React.useEffect(() => { setIntervalText(String(s.interval)); }, [s.interval]);
    React.useEffect(() => { setCustomUrl(s.customUrl.startsWith('data:') ? '' : s.customUrl); }, [s.customUrl]);
    React.useEffect(() => {
      if (!confirm) return;
      const handle = setTimeout(() => setConfirm(''), 5000);
      return () => clearTimeout(handle);
    }, [confirm]);
    const locked = !ready || processing;
    const field = (key, value) => save({ [key]: value });
    const button = (key, onClick, props = {}) => h('button', { type: 'button', onClick, disabled: locked, ...props }, tr(key));
    const check = (key, value, onChange, hint) => h(ToggleRow, { id: key, value, onChange, hint, disabled: locked });
    const select = (key, value, options) => h('div', { className: 'e621-row' },
      h('label', { htmlFor: `e621-${key}` }, tr(key)),
      h('select', { id: `e621-${key}`, value, disabled: locked, onChange: e => field(key, e.target.value) },
        options.map(option => h('option', { key: option, value: option }, tr(option)))));
    const slider = (key, value, min, max, step, format) => h('div', { className: 'e621-row' },
      h('label', { htmlFor: `e621-${key}` }, tr(key)),
      h('div', { className: 'e621-actions' },
        h('input', { id: `e621-${key}`, type: 'range', min, max, step, value, disabled: locked, onChange: e => field(key, Number(e.target.value)), 'aria-valuetext': format(value) }),
        h('output', { htmlFor: `e621-${key}`, className: 'e621-count' }, format(value))));
    const fileInput = (multiple) => h('label', { className: 'e621-stack' }, tr(multiple ? 'uploadMany' : 'upload'),
      h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp,image/gif,image/avif', multiple, disabled: locked,
        onChange: e => { const files = Array.from(e.target.files || []); e.target.value = ''; void upload(files, multiple); } }));
    function confirmAction(name, action) {
      if (confirm === name) { setConfirm(''); void action(); } else setConfirm(name);
    }
    return h('div', { className: 'e621-settings' },
      h('h2', null, tr('title')),
      h('p', { className: 'e621-muted' }, tr('subtitle')),
      !ready && h('p', { role: 'status' }, tr('loading')),
      notice && h('div', { role: type === 'error' ? 'alert' : 'status', className: `e621-status${type === 'error' ? ' e621-error' : ''}` }, notice),
      h('section', { className: 'e621-section' },
        h('div', { className: 'e621-language-row' },
          h('span', { className: 'e621-language-label' }, tr('language')),
          h('div', { className: 'e621-language-segmented', role: 'group', 'aria-label': tr('language') },
            [['auto', 'languageAuto'], ['zh', 'languageZh'], ['en', 'languageEn']].map(([value, label]) =>
              button(label, () => { void field('locale', value); }, { key: value, 'aria-pressed': s.locale === value })))),
        check('enable', s.enabled, value => field('enabled', value), 'enabledHint'),
        h('p', { className: 'e621-muted' }, tr('conflict')),
        h('h3', null, tr('mode')),
        h('div', { className: 'e621-actions' }, ['pattern', 'none', 'custom', 'random'].map(mode => button(mode, () => field('mode', mode), { key: mode, 'aria-pressed': s.mode === mode }))),
        h('div', { className: 'e621-preview', style: { backgroundImage: core.cssUrl(url) }, 'aria-label': tr('preview') },
          h('div', { className: 'e621-preview-card' }, h('strong', null, tr('previewTitle')), h('p', null, tr('previewText')))),
      ),
      h('section', { className: 'e621-section' },
        h('h3', null, tr('customTitle')),
        h('form', { className: 'e621-stack', onSubmit: e => {
          e.preventDefault();
          try { void save({ customUrl: core.validateImageUrl(customUrl), mode: 'custom' }); }
          catch (error) { status('invalid', 'error', error.message); }
        } }, h('label', { htmlFor: 'e621-url' }, tr('url')),
        h('input', { id: 'e621-url', type: 'url', value: customUrl, placeholder: tr('urlPlaceholder'), disabled: locked, onChange: e => setCustomUrl(e.target.value) }),
        h('div', { className: 'e621-actions' }, h('button', { type: 'submit', disabled: locked || !customUrl.trim(), className: 'e621-primary' }, tr('apply')))),
        h('div', { className: 'e621-row' }, fileInput(false)),
        h('p', { className: 'e621-muted' }, tr('uploadHint')),
      ),
      h('section', { className: 'e621-section' },
        h('h3', null, tr('randomTitle')),
        h('p', { className: 'e621-muted' }, tr('randomHint')),
        h('label', { className: 'e621-stack' }, tr('addUrls'),
          h('textarea', { value: urlsText, disabled: locked, placeholder: tr('urlPlaceholder'), onChange: e => setUrlsText(e.target.value) })),
        h('div', { className: 'e621-actions', style: { marginTop: 8 } },
          button('add', async () => {
            try { if (await addImages(core.parseUrls(urlsText))) setUrlsText(''); }
            catch (error) { status('invalid', 'error', error.message); }
          }, { disabled: locked || !urlsText.trim() }),
          button('next', () => {
            if (s.mode !== 'random') { void save({ mode: 'random' }); } else pickRandom();
          }, { disabled: locked || !s.urls.length })),
        h('div', { className: 'e621-row' }, fileInput(true)),
        check('randomOnLoad', s.randomOnLoad, value => field('randomOnLoad', value)),
        h('div', { className: 'e621-row' }, h('label', { htmlFor: 'e621-interval' }, tr('interval')),
          h('input', { id: 'e621-interval', type: 'number', min: 0, max: 86400, step: 1, disabled: locked, value: intervalText,
            onChange: e => setIntervalText(e.target.value), onBlur: () => { field('interval', Number(intervalText)); },
            onKeyDown: e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } } })),
        h('p', { className: 'e621-muted' }, tr('intervalHint')),
        h('div', { className: 'e621-row' }, h('strong', null, `${tr('gallery')} · ${s.urls.length} ${tr('count')}`),
          button(confirm === 'clear' ? 'clearConfirm' : 'clear', () => confirmAction('clear', () => save({ urls: [] })), { disabled: locked || !s.urls.length })),
        !s.urls.length && h('p', { className: 'e621-muted' }, tr('empty')),
        h('div', { className: 'e621-grid' }, s.urls.map((image, index) => h('div', { className: 'e621-tile', key: image },
          h('img', { src: image, alt: `${tr('imageAlt')} ${index + 1}`, loading: 'lazy', referrerPolicy: 'no-referrer' }),
          h('div', { className: 'e621-actions' },
            button('use', () => { void save({ customUrl: image, mode: 'custom' }); }, { 'aria-label': `${tr('use')} ${index + 1}` }),
            button('remove', () => { void save(current => ({ ...current, urls: current.urls.filter(item => item !== image) })); }, { 'aria-label': `${tr('remove')} ${index + 1}` }))))),
      ),
      h('section', { className: 'e621-section' },
        h('h3', null, tr('appearance')),
        slider('opacity', s.opacity, 0.35, 1, 0.01, value => `${Math.round(value * 100)}%`),
        slider('dim', s.dim, 0, 0.85, 0.01, value => `${Math.round(value * 100)}%`),
        slider('blur', s.blur, 0, 20, 1, value => `${value}px`),
        slider('scale', s.scale, 25, 300, 1, value => `${value}%`),
        h('p', { className: 'e621-muted' }, tr('scaleHint')),
        select('fit', s.fit, ['cover', 'contain', 'auto']),
        select('position', s.position, ['center', 'top', 'bottom', 'left', 'right']),
        check('classic', s.classic, value => field('classic', value), 'classicHint'),
      ),
      h('section', { className: 'e621-section' },
        button(confirm === 'reset' ? 'resetConfirm' : 'reset', () => confirmAction('reset', () => save(() => ({ ...core.defaults, urls: [] })))),
        h('p', { className: 'e621-muted' }, tr('resetHint')),
        h('p', { className: 'e621-muted' }, tr('privacy')),
      ),
    );
  }
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({ name: 'shell.overlay', id: 'e621-theme-surface', order: -100 }, ThemeSurface));
  ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: 'e621-style', order: 23, label: () => tr('title') }, Settings));
  ctx.effect(() => {
    const unregisterTheme = ctx.theme.register({ id: themeId, colorScheme: 'dark', tokens: createThemeTokens(1, false) });
    storage.read().then(record => {
      if (disposed) return;
      settings = core.normalizeSettings(record?.settings);
      lastRandom = typeof record?.lastRandom === 'string' ? record.lastRandom : '';
      loaded = true;
      applySettings(true);
    }).catch(() => {
      if (disposed) return;
      loaded = true;
      status('storageUnavailable', 'error');
      applySettings(true);
    });
    return () => {
      disposed = true;
      clearInterval(timer);
      cancelImage();
      removeTokens();
      restoreTheme();
      unregisterTheme();
      storage.close();
      listeners.clear();
    };
  });
}
