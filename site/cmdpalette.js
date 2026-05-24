/**
 * 命令面板 — 由 Cmd/Ctrl+K 或搜索按钮触发的全局搜索。
 *
 * 完全在客户端侧，从 data.js 中已加载的数据搜索课程标题、摘要、Phase 名称、语言、类型和
 * 术语表条目。
 * 无网络请求。无外部依赖。
 *
 * API（挂载到 window.CmdPalette）：
 *   CmdPalette.open()   — 打开面板
 *   CmdPalette.close()  — 关闭面板
 *
 * 触发按钮：任何带有 [data-cmd-palette] 属性的元素。
 */
(function () {
  'use strict';

  // ── 常量 ────────────────────────────────────────────────────────────
  var PALETTE_ID  = 'cmdPalette';
  var MAX_RESULTS = 12;
  var BODY_ATTR   = 'data-palette-open';

  // ── 模块状态 ───────────────────────────────────────────────────────
  var _index      = null;   // 延迟构建的可搜索条目扁平数组
  var _activeIdx  = -1;
  var _isOpen     = false;
  var _prevFocus  = null;

  // ── 搜索索引 ───────────────────────────────────────────────────────
  /**
   * 从 window.PHASES 和 window.GLOSSARY 构建一次扁平搜索索引。
   * 幂等：后续调用会返回缓存数组。
   */
  function buildIndex() {
    if (_index !== null) return _index;
    _index = [];

    if (typeof PHASES !== 'undefined' && Array.isArray(PHASES)) {
      for (var i = 0; i < PHASES.length; i++) {
        var phase = PHASES[i];
        for (var j = 0; j < phase.lessons.length; j++) {
          var lesson = phase.lessons[j];

          // 提取 lesson.html?path= 使用的 phases/…/… 路径
          var lessonPath = '';
          if (lesson.url) {
            var m = lesson.url.match(/(phases\/[^/?#]+\/[^/?#]+)/);
            if (m) lessonPath = m[1];
          }

          _index.push({
            kind:       'lesson',
            id:         'l:' + i + ':' + j,
            phaseId:    phase.id,
            phaseName:  phase.name,
            name:       lesson.name     || '',
            summary:    lesson.summary  || '',
            keywords:   lesson.keywords || '',
            type:       lesson.type     || '',
            lang:       lesson.lang     || '',
            status:     lesson.status   || '',
            lessonPath: lessonPath,
            url:        lesson.url      || '',
          });
        }
      }
    }

    if (typeof GLOSSARY !== 'undefined' && Array.isArray(GLOSSARY)) {
      for (var k = 0; k < GLOSSARY.length; k++) {
        var g = GLOSSARY[k];
        _index.push({
          kind:    'glossary',
          id:      'g:' + k,
          name:    g.term  || '',
          summary: g.means || '',
          says:    g.says  || '',
        });
      }
    }

    if (typeof ARTIFACTS !== 'undefined' && Array.isArray(ARTIFACTS)) {
      for (var a = 0; a < ARTIFACTS.length; a++) {
        var art = ARTIFACTS[a];
        _index.push({
          kind:       'artifact',
          id:         'a:' + a,
          artKind:    art.kind || 'artifact',
          name:       art.name || '',
          summary:    art.description || '',
          keywords:   Array.isArray(art.tags) ? art.tags.join(' ') : '',
          phaseId:    art.phase,
          lesson:     art.lesson,
          lessonPath: art.lessonPath || '',
          file:       art.file || '',
        });
      }
    }

    return _index;
  }

  // ── 评分 ───────────────────────────────────────────────────────────
  function scoreItem(item, q) {
    // q 已由调用方完成小写转换与首尾空白裁剪
    var name     = item.name.toLowerCase();
    var summary  = (item.summary  || '').toLowerCase();
    var keywords = (item.keywords || '').toLowerCase();
    var phase    = (item.phaseName || '').toLowerCase();
    var lang     = (item.lang  || '').toLowerCase();
    var type     = (item.type  || '').toLowerCase();
    var says     = (item.says  || '').toLowerCase();

    var s = 0;

    // 完整名称精确匹配 — 最高优先级
    if (name === q) return 200;

    // 名称中的子串匹配（最重要的信号）
    if (name.startsWith(q))          s += 100;
    else if (name.indexOf(q) !== -1) s +=  70;

    // 多词查询：每个词都必须出现在名称中的某处
    var words = q.split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      var allInName = words.every(function (w) { return name.indexOf(w) !== -1; });
      if (allInName) {
        s += (s === 0 ? 65 : 20);
      } else {
        // 较弱匹配：每个词分布在 name + summary + keywords + phase 中
        var blob = name + ' ' + summary + ' ' + keywords + ' ' + phase;
        var allInBlob = words.every(function (w) { return blob.indexOf(w) !== -1; });
        if (allInBlob) s += 15;
      }
    }

    // 辅助字段 — 按预期相关性排序
    if (summary.indexOf(q)  !== -1) s += 25;
    if (keywords.indexOf(q) !== -1) s += 22; // H3 标题：高密度词汇
    if (says.indexOf(q)     !== -1) s += 22; // 术语表中的“人们如何表述”
    if (phase.indexOf(q)    !== -1) s += 18;
    if (lang.indexOf(q)     !== -1) s += 14;
    if (type.indexOf(q)     !== -1) s += 10;

    // 单词兜底：在名称 Token 上做词边界前缀匹配
    if (s === 0 && words.length === 1) {
      var nameParts = name.split(/[\s\-–—:,]+/).filter(Boolean);
      for (var i = 0; i < nameParts.length; i++) {
        if (nameParts[i].startsWith(q)) { s += 30; break; }
      }
      // 最后兜底：单个词出现在 keywords 或 summary 的任意位置
      if (s === 0 && keywords.indexOf(q) !== -1) s += 18;
      if (s === 0 && summary.indexOf(q)  !== -1) s += 12;
    }

    return s;
  }

  function search(query) {
    var q = query.trim().toLowerCase();
    if (!q) return [];

    var items   = buildIndex();
    var results = [];

    for (var i = 0; i < items.length; i++) {
      var s = scoreItem(items[i], q);
      if (s > 0) results.push({ item: items[i], s: s });
    }

    results.sort(function (a, b) { return b.s - a.s; });
    return results.slice(0, MAX_RESULTS).map(function (r) { return r.item; });
  }

  // ── 工具函数 ───────────────────────────────────────────────────────
  function escHtml(str) {
    var d = document.createElement('div');
    d.textContent = (str == null) ? '' : String(str);
    return d.innerHTML;
  }

  /**
   * 在 `text` 中高亮 `query` 的首次出现位置（或其第一个匹配词）。
   * 返回 HTML-safe 字符串，并用 <mark> 包住匹配内容。
   */
  function highlight(text, query) {
    if (!text) return '';
    if (!query) return escHtml(text);

    var lower = text.toLowerCase();
    var q     = query.trim().toLowerCase();
    var idx   = lower.indexOf(q);
    var matchLen = q.length;

    if (idx === -1) {
      // 逐词尝试
      var words = q.split(/\s+/).filter(Boolean);
      for (var i = 0; i < words.length; i++) {
        idx = lower.indexOf(words[i]);
        if (idx !== -1) { matchLen = words[i].length; break; }
      }
    }

    if (idx === -1) return escHtml(text);

    return (
      escHtml(text.slice(0, idx)) +
      '<mark>' + escHtml(text.slice(idx, idx + matchLen)) + '</mark>' +
      escHtml(text.slice(idx + matchLen))
    );
  }

  function truncate(str, max) {
    if (!str || str.length <= max) return str || '';
    var cut = str.slice(0, max).replace(/\s+\S*$/, '');
    return (cut.length > max * 0.6 ? cut : str.slice(0, max)) + '…';
  }

  // ── 面板 DOM（首次打开时延迟创建） ─────────────────────────────────
  function createPaletteDOM() {
    if (document.getElementById(PALETTE_ID)) return;

    // 检测平台，用于页脚快捷键提示
    var isMac = /Mac|iPhone|iPod|iPad/.test(
      (navigator.userAgentData && navigator.userAgentData.platform) ||
      navigator.platform || ''
    );
    var shortcutLabel = isMac ? '⌘K' : 'Ctrl+K';

    var el = document.createElement('div');
    el.id = PALETTE_ID;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', '搜索课程和术语表');

    el.innerHTML =
      '<div class="cp-backdrop" id="cpBackdrop"></div>' +
      '<div class="cp-panel">' +
        '<div class="cp-search-row">' +
          '<svg class="cp-search-icon" width="16" height="16" viewBox="0 0 24 24"' +
          ' fill="none" stroke="currentColor" stroke-width="2.5"' +
          ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<circle cx="11" cy="11" r="8"/>' +
            '<line x1="21" y1="21" x2="16.65" y2="16.65"/>' +
          '</svg>' +
          '<input class="cp-input" id="cpInput" type="search"' +
          ' placeholder="搜索课程和术语表…"' +
          ' autocomplete="off" autocorrect="off"' +
          ' autocapitalize="off" spellcheck="false"' +
          ' aria-label="搜索" aria-autocomplete="list"' +
          ' aria-controls="cpResults">' +
          '<kbd class="cp-kbd-esc" id="cpKbdEsc">Esc</kbd>' +
        '</div>' +
        '<ul class="cp-results" id="cpResults"' +
        ' role="listbox" aria-label="搜索结果"></ul>' +
        '<div class="cp-footer">' +
          '<span class="cp-footer-group">' +
            '<kbd>↑</kbd><kbd>↓</kbd>' +
            '<span class="cp-footer-label">导航</span>' +
          '</span>' +
          '<span class="cp-footer-group">' +
            '<kbd>↵</kbd>' +
            '<span class="cp-footer-label">打开</span>' +
          '</span>' +
          '<span class="cp-footer-group">' +
            '<kbd>Esc</kbd>' +
            '<span class="cp-footer-label">关闭</span>' +
          '</span>' +
          '<span class="cp-footer-shortcut">' + shortcutLabel + '</span>' +
        '</div>' +
      '</div>';

    document.body.appendChild(el);

    // 连接内部交互
    document.getElementById('cpBackdrop').addEventListener('click', close);
    document.getElementById('cpKbdEsc').addEventListener('click', close);

    var inp = document.getElementById('cpInput');
    inp.addEventListener('input', _onInput);
    inp.addEventListener('keydown', _onKeyDown);
  }

  function _palEl()   { return document.getElementById(PALETTE_ID); }
  function _inputEl() { return document.getElementById('cpInput'); }
  function _listEl()  { return document.getElementById('cpResults'); }

  // ── 打开 / 关闭 ───────────────────────────────────────────────────
  function open() {
    if (_isOpen) {
      // 已打开 — 确保输入框获得焦点
      var inp = _inputEl();
      if (inp) inp.focus();
      return;
    }

    _prevFocus = document.activeElement || null;
    _isOpen    = true;
    _activeIdx = -1;

    createPaletteDOM();
    document.body.setAttribute(BODY_ATTR, '');

    // 两帧延迟：第一帧触发过渡，第二帧确保聚焦
    requestAnimationFrame(function () {
      var pal = _palEl();
      if (pal) pal.classList.add('cp-open');

      requestAnimationFrame(function () {
        var inp = _inputEl();
        if (inp) {
          inp.focus();
          var q = inp.value.trim();
          renderResults(q ? search(q) : []);
        }
      });
    });
  }

  function close() {
    if (!_isOpen) return;
    _isOpen    = false;
    _activeIdx = -1;

    var pal = _palEl();
    if (pal) pal.classList.remove('cp-open');
    document.body.removeAttribute(BODY_ATTR);

    // 将焦点返回到用户之前所在的位置
    try {
      if (_prevFocus && typeof _prevFocus.focus === 'function') {
        _prevFocus.focus();
      }
    } catch (_) { /* 元素可能已从 DOM 中移除 */ }
    _prevFocus = null;
  }

  // ── 渲染结果 ───────────────────────────────────────────────────────
  function renderResults(results) {
    var list = _listEl();
    if (!list) return;

    var query = (_inputEl() ? _inputEl().value : '').trim();

    if (!query) {
      list.innerHTML =
        '<li class="cp-empty" role="option" aria-disabled="true">' +
        '输入内容以搜索 435 节课程、489 个输出物和术语表条目' +
        '</li>';
      _activeIdx = -1;
      return;
    }

    if (results.length === 0) {
      list.innerHTML =
        '<li class="cp-empty" role="option" aria-disabled="true">' +
        '没有找到 <em>' + escHtml(query) + '</em> 的结果' +
        '</li>';
      _activeIdx = -1;
      return;
    }

    var html = '';
    for (var i = 0; i < results.length; i++) {
      var r    = results[i];
      var dest = '';
      var chip = '';
      var chipClass = 'cp-item-chip';

      if (r.kind === 'lesson') {
        // 优先使用站内阅读器；回退到 GitHub URL
        dest = r.lessonPath
          ? 'lesson.html?path=' + encodeURIComponent(r.lessonPath)
          : r.url;
        chip = 'Phase ' + String(r.phaseId).padStart(2, '0');
      } else if (r.kind === 'artifact') {
        // 跳转到产出该 artifact 的课程
        dest = r.lessonPath
          ? 'lesson.html?path=' + encodeURIComponent(r.lessonPath)
          : ('https://github.com/rohitg00/ai-engineering-from-scratch/tree/main/' + r.file);
        var ak = (r.artKind || 'artifact');
        chip = ak.charAt(0).toUpperCase() + ak.slice(1);
        chipClass += ' cp-item-chip--alt';
      } else {
        // 深链接：用精确术语名称预填充术语表搜索
        // 让用户直接落到定义，而不是完整列表。
        dest      = 'glossary.html?q=' + encodeURIComponent(r.name);
        chip      = '术语表';
        chipClass += ' cp-item-chip--alt';
      }

      var snippet = r.summary ? truncate(r.summary, 110) : '';
      var metaParts = [];
      if (r.kind === 'lesson') {
        if (r.type && r.type !== '—') metaParts.push(r.type);
        if (r.lang && r.lang !== '—') metaParts.push(r.lang);
      } else if (r.kind === 'artifact') {
        if (r.phaseId !== undefined && r.phaseId !== null) {
          metaParts.push('Phase ' + String(r.phaseId).padStart(2, '0'));
        }
      }
      var meta = metaParts.join(' · '); // ·

      html +=
        '<li class="cp-item" role="option" aria-selected="false"' +
        ' data-idx="' + i + '"' +
        ' data-href="' + escHtml(dest) + '">' +
          '<div class="cp-item-body">' +
            '<span class="' + chipClass + '">' + escHtml(chip) + '</span>' +
            '<span class="cp-item-name">'    + highlight(r.name,    query) + '</span>' +
            (snippet ? '<span class="cp-item-summary">' + highlight(snippet, query) + '</span>' : '') +
            (meta    ? '<span class="cp-item-meta">'    + escHtml(meta)             + '</span>' : '') +
          '</div>' +
          '<svg class="cp-item-arrow" width="12" height="12" viewBox="0 0 24 24"' +
          ' fill="none" stroke="currentColor" stroke-width="2"' +
          ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<polyline points="9 18 15 12 9 6"/>' +
          '</svg>' +
        '</li>';
    }

    list.innerHTML = html;
    _activeIdx = -1;

    // 附加交互处理器
    var items = list.querySelectorAll('.cp-item');
    for (var j = 0; j < items.length; j++) {
      items[j].addEventListener('click',     _onItemClick);
      items[j].addEventListener('mousemove', _onItemMouseMove);
    }
  }

  // ── 事件处理器 ─────────────────────────────────────────────────────
  function _onInput(e) {
    var query = e.target.value;
    renderResults(search(query));
    _activeIdx = -1;
  }

  function _onKeyDown(e) {
    var list  = _listEl();
    var items = list ? list.querySelectorAll('.cp-item') : [];
    var count = items.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!count) return;
        _activeIdx = (_activeIdx + 1) % count;
        _updateActive(items);
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (!count) return;
        _activeIdx = (_activeIdx - 1 + count) % count;
        _updateActive(items);
        break;

      case 'Enter': {
        e.preventDefault();
        const target = (_activeIdx >= 0 && items[_activeIdx])
          ? items[_activeIdx]
          : (count === 1 ? items[0] : null);
        if (target) _navigate(target);
        break;
      }

      case 'Tab':
        // 将焦点限制在面板内（唯一可交互元素是输入框）
        e.preventDefault();
        break;

      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  }

  function _updateActive(items) {
    for (var i = 0; i < items.length; i++) {
      var active = (i === _activeIdx);
      items[i].classList.toggle('cp-item--active', active);
      items[i].setAttribute('aria-selected', active ? 'true' : 'false');
      if (active) items[i].scrollIntoView({ block: 'nearest' });
    }
  }

  function _onItemClick(e) {
    _navigate(e.currentTarget);
  }

  function _onItemMouseMove(e) {
    var list = _listEl();
    if (!list) return;
    var idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
    if (idx !== _activeIdx) {
      _activeIdx = idx;
      _updateActive(list.querySelectorAll('.cp-item'));
    }
  }

  function _navigate(item) {
    var href = item.getAttribute('data-href');
    if (!href) return;
    close();
    window.location.href = href;
  }

  // ── 全局键盘快捷键（Cmd/Ctrl+K）───────────────────────────────────
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (_isOpen) {
        // 面板已打开 — 仅重新聚焦输入框
        var inp = _inputEl();
        if (inp) inp.focus();
      } else {
        open();
      }
    }
  });

  // ── 初始化：连接触发按钮 + 预先构建索引 ───────────────────────────
  function _init() {
    // 任何带有 [data-cmd-palette] 的元素在点击时都会打开面板
    var triggers = document.querySelectorAll('[data-cmd-palette]');
    for (var i = 0; i < triggers.length; i++) {
      triggers[i].addEventListener('click', function (e) {
        e.preventDefault();
        open();
      });
    }

    // 现在构建搜索索引，让第一次按键即时响应
    buildIndex();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }

  // ── 公共 API ───────────────────────────────────────────────────────
  window.CmdPalette = { open: open, close: close };

}());
