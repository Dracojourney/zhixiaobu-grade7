(function (G) {
  function esc(x) {
    return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[c];
    });
  }
  function btn(label, action, value, cls) {
    return '<button class="g7-btn ' + (cls || '') + '" data-action="' + action + '" data-value="' + esc(value || '') + '">' + esc(label) + '</button>';
  }
  function link(label, href, cls) {
    return '<a class="g7-btn ' + (cls || '') + '" href="' + esc(href) + '">' + esc(label) + '</a>';
  }
  function setup(root, store) {
    if (!document.getElementById('g7-live')) {
      var live = document.createElement('div');
      live.id = 'g7-live';
      live.className = 'g7-sr';
      live.setAttribute('role', 'status');
      live.setAttribute('aria-live', 'polite');
      document.body.appendChild(live);
    }
    root.addEventListener('click', function (e) {
      var el = e.target.closest('[data-action]');
      if (!el) return;
      if (el.dataset.action === 'export') {
        var blob = new Blob([store.exportJSON()], {
            type: 'application/json'
          }),
          url = URL.createObjectURL(blob),
          a = document.createElement('a');
        a.href = url;
        a.download = '七年级学习记录-' + new Date().toISOString().slice(0, 10) + '.json';
        a.click();
        setTimeout(function () {
          URL.revokeObjectURL(url);
        }, 1000);
      }
      if (el.dataset.action === 'import') root.querySelector('#g7-import').click();
    });
    root.addEventListener('change', function (e) {
      if (e.target.id !== 'g7-import') return;
      var file = e.target.files[0];
      if (!file) return;
      file.text().then(function (text) {
        var result = store.importJSON(text);
        if (result.ok) {
          store.normalizeIdentities(G.content);
          window.dispatchEvent(new Event('hashchange'));
        }
        G.UI.notice(result.ok ? '学习记录已导入' + (result.conflicts ? '，冲突版本已备份' : '') : result.error);
      });
    });
  }
  G.UI = {
    icon: function (name) {
      var shapes = {
        chinese: '<path d="M5 3h14v18H5zM8 7h8M8 11h8M8 15h5"/>',
        math: '<path d="M4 7h8M8 3v8M15 5h6M15 9h6M4 16l6 6M10 16l-6 6M15 18h6"/>',
        english: '<path d="M3 4h18v13H9l-6 4zM7 13l3-6 3 6M8 11h4M16 7v6M16 7h2a2 2 0 0 1 0 4h-2"/>',
        history: '<path d="M5 5h14v15H5zM8 5V3h8v2M8 9h8M8 13h8M8 17h5"/>',
        geography: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18z"/>',
        biology: '<path d="M12 21V11M12 15C5 15 3 11 4 6c6-1 9 3 8 9zM12 11c0-6 4-9 9-8 0 6-3 9-9 8z"/>',
        morality: '<path d="M12 21S3 15 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-9 13-9 13zM8 11h8M12 7v8"/>',
        star: '<path d="m12 3 2.8 6.2 6.7.7-5 4.5 1.4 6.6-5.9-3.4L6.1 21l1.4-6.6-5-4.5 6.7-.7z"/>',
        book: '<path d="M12 6C9 3 5 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-3-1-7-1-10 2zM12 6v15"/>',
        compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6z"/>',
        bulb: '<path d="M8 16c0-3-3-3-3-7a7 7 0 0 1 14 0c0 4-3 4-3 7zM9 20h6M10 23h4M12 0v2"/>'
      };
      return '<svg class="g7-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (shapes[name] || shapes.book) + '</svg>';
    },
    esc: esc,
    btn: btn,
    link: link,
    setup: setup,
    store: function () {
      var storage;
      try {
        storage = window.localStorage;
      } catch (e) {
        storage = {
          getItem: function () {
            throw e;
          },
          setItem: function () {
            throw e;
          }
        };
      }
      var store = G.Storage.create(storage);
      store.migrateLegacy();
      store.normalizeIdentities(G.content);
      return store;
    },
    header: function (active) {
      return '<header class="g7-top"><a class="g7-brand" href="index.html"><span class="g7-brandmark">' + G.UI.icon('book') + '</span><span>知小步<small>七年级 · 上册学习站</small></span></a><nav aria-label="主导航"><a ' + (active === 'home' ? 'aria-current="page"' : '') + ' href="index.html">学习首页</a><a ' + (active === 'subject' ? 'aria-current="page"' : '') + ' href="index.html#subjects">学科学习</a></nav><span class="g7-term">一点好奇，一点进步 ✦</span></header>' + (G.manifest.contentStatus === 'edition-review' || G.manifest.contentStatus === 'edition-aligned-editorial' ? '<details class="g7-edition-note"><summary>七年级上册 · 原创核心知识试用版 <span>版本说明 ＋</span></summary><p>语文、数学及原小四门按上传照片登记教材信息；英语目前仅确认封面出版社，具体版次与范围以卡片说明为准。配套练习为原创编写，教材正文逐页校核仍在完善。</p></details>' : '');
    },
    footer: function () {
      return '<footer class="g7-footer"><span>一次学一点，把知识变成自己的。</span><div>' + btn('导出记录', 'export') + btn('导入记录', 'import') + '<input id="g7-import" type="file" accept="application/json,.json" hidden></div><small>记录保存在当前浏览器。更换浏览器或文件路径前，请先导出备份。</small></footer><div id="g7-notice" role="status" aria-live="polite"></div>';
    },
    notice: function (text) {
      var el = document.getElementById('g7-notice');
      if (el) {
        el.textContent = text;
        el.classList.add('visible');
      }
    },
    announce: function (text) {
      var live = document.getElementById('g7-live');
      if (live) live.textContent = text;
    },
    save: function (store) {
      var result = store.save(store.load());
      if (!result.ok) G.UI.notice(result.error + '，可先导出备份');
    },
    boot: function () {
      var root = document.getElementById('learning-app');
      if (!root) return;
      var subject = document.body.dataset.subject,
        store = G.UI.store();
      if (subject) G.Subject.mount(root, G.content[subject], store);else G.Home.mount(root, store, G.manifest);
      if (store.error()) G.UI.notice(store.error());
    }
  };
})(window.Grade7 = window.Grade7 || {});
