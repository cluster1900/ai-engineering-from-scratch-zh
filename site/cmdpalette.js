/**
 * 命令面板——通过 Cmd/Ctrl+K 或搜索按钮触发全局搜索。
 *
 * 完全在客户端使用已加载的数据，搜索聚焦路径、课程标题、摘要、
 * 阶段名称、语言、类型和术语表条目。
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

  // ── 模块状态 ────────────────────────────────────────────────────────
  var _index      = null;   // 延迟构建的可搜索条目扁平数组
  var _activeIdx  = -1;
  var _isOpen     = false;
  var _prevFocus  = null;

  function learningPathEntryPath(entry) {
    return typeof entry === 'string' ? entry : entry && entry.path ? entry.path : '';
  }

  function learningPathDestination(lessonPath, learningPathId) {
    if (!lessonPath || !learningPathId) return '';
    return 'lesson.html?path=' + encodeURIComponent(lessonPath) +
      '&learningPath=' + encodeURIComponent(learningPathId);
  }

  function resultIndexForEnter(activeIndex, resultCount) {
    if (activeIndex >= 0 && activeIndex < resultCount) return activeIndex;
    return resultCount > 0 ? 0 : -1;
  }

  // ── 搜索索引 ────────────────────────────────────────────────────────
  function certificationData() {
    var data = null;
    if (typeof CLAUDE_CERTIFICATION_DATA !== 'undefined' && CLAUDE_CERTIFICATION_DATA) {
      data = CLAUDE_CERTIFICATION_DATA;
    } else if (typeof CERTIFICATIONS !== 'undefined' && CERTIFICATIONS) {
      data = CERTIFICATIONS;
    }

    var tracks = null;
    if (typeof CERTIFICATION_TRACKS !== 'undefined' && CERTIFICATION_TRACKS) {
      tracks = Array.isArray(CERTIFICATION_TRACKS)
        ? CERTIFICATION_TRACKS
        : CERTIFICATION_TRACKS.tracks;
    }

    if (!data && tracks) data = { tracks: tracks };
    else if (data && !Array.isArray(data.tracks) && tracks) {
      data = Object.assign({}, data, { tracks: tracks });
    }
    return data;
  }

  /**
   * 从 window.PHASES 和 window.GLOSSARY 构建一次扁平搜索索引。
   * 幂等：后续调用返回缓存数组。
   */
  function buildIndex() {
    if (_index !== null) return _index;
    _index = [];

    if (typeof LEARNING_PATHS !== 'undefined' && Array.isArray(LEARNING_PATHS)) {
      for (var lp = 0; lp < LEARNING_PATHS.length; lp++) {
        var learningPath = LEARNING_PATHS[lp] || {};
        var route = Array.isArray(learningPath.lessons) ? learningPath.lessons : [];
        var firstLessonPath = route.length ? learningPathEntryPath(route[0]) : '';
        var learningPathId = learningPath.id || String(lp);
        if (!firstLessonPath) continue;
        var checkpointKeywords = Array.isArray(learningPath.checkpoints)
          ? learningPath.checkpoints.map(function (checkpoint) {
              return typeof checkpoint === 'string'
                ? checkpoint
                : checkpoint && (checkpoint.title || checkpoint.name || checkpoint.goal) || '';
            }).join(' ')
          : '';
        _index.push({
          kind:        'learning-path',
          id:          'lp:' + learningPathId,
          name:        learningPath.title || learningPathId,
          summary:     learningPath.summary || '',
          keywords:    [learningPath.keywords || '', checkpointKeywords, '聚焦课程路线'].filter(Boolean).join(' '),
          lessonCount: route.length,
          minutes:     Number(learningPath.estimatedMinutes || 0),
          url:         learningPathDestination(firstLessonPath, learningPathId),
        });
      }
    }

    if (typeof PHASES !== 'undefined' && Array.isArray(PHASES)) {
      for (var i = 0; i < PHASES.length; i++) {
        var phase = PHASES[i];
        for (var j = 0; j < phase.lessons.length; j++) {
          var lesson = phase.lessons[j];

          // 提取用于 lesson.html?path= 的 phases/…/… 路径
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
          slug:    g.slug  || '',
          keywords: [
            g.category,
            g.whyItMatters,
            g.example,
            g.confusion,
            g.whyCalled,
            Array.isArray(g.aliases) ? g.aliases.join(' ') : '',
            Array.isArray(g.related) ? g.related.join(' ') : '',
          ].filter(Boolean).join(' '),
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

    // 认证数据是可选的。仅在页面已加载某个受支持的全局变量时建立索引；
    // 绝不只是为了搜索而获取大型数据包。
    var certs = certificationData();
    if (certs) {
      var tracks = Array.isArray(certs.tracks) ? certs.tracks : [];
      for (var t = 0; t < tracks.length; t++) {
        var track = tracks[t] || {};
        var trackId = track.id || track.slug || track.examCode || String(t);
        var domainNames = Array.isArray(track.domains)
          ? track.domains.map(function (domain) { return domain.name || domain.id || ''; }).join(' ')
          : '';
        _index.push({
          kind:     'certification-track',
          id:       'ct:' + trackId,
          name:     track.credential || track.name || track.shortName || track.examCode || '认证路线',
          summary:  track.summary || track.audience || '',
          keywords: [track.shortName, track.examCode, track.level, track.audience, domainNames].filter(Boolean).join(' '),
          examCode: track.examCode || '',
          level:    track.level || '',
          url:      'certification.html?id=' + encodeURIComponent(trackId),
        });
      }

      var lessonMap = certs.lessonsByPath || {};
      var lessonList = Array.isArray(certs.lessons) ? certs.lessons : [];
      var certLessons = Object.keys(lessonMap).map(function (path) {
        var lesson = lessonMap[path] || {};
        return Object.assign({ path: path }, lesson);
      }).concat(lessonList);
      var seenCertLessons = {};

      for (var c = 0; c < certLessons.length; c++) {
        var certLesson = certLessons[c] || {};
        var certPath = certLesson.path || certLesson.lessonPath || '';
        if (!certPath || seenCertLessons[certPath]) continue;
        seenCertLessons[certPath] = true;
        _index.push({
          kind:       'certification-lesson',
          id:         'cl:' + certPath,
          name:       certLesson.name || certLesson.title || certLesson.slug || '认证课程',
          summary:    certLesson.summary || '',
          keywords:   certLesson.keywords || '',
          type:       certLesson.type || '',
          lang:       certLesson.languages || certLesson.lang || '',
          lessonPath: certPath,
        });
      }
    }

    return _index;
  }

  function rebuildIndex() {
    _index = null;
    return buildIndex();
  }

  function refreshOpenPalette() {
    if (!_isOpen) return;
    var input = _inputEl();
    var query = input ? input.value.trim() : '';
    renderResults(query ? search(query) : []);
  }

  // ── 评分 ────────────────────────────────────────────────────────────
  function scoreItem(item, q) {
    // q 已由调用方转换为小写并去除首尾空白
    var name     = item.name.toLowerCase();
    var summary  = (item.summary  || '').toLowerCase();
    var keywords = (item.keywords || '').toLowerCase();
    var phase    = (item.phaseName || '').toLowerCase();
    var lang     = (item.lang  || '').toLowerCase();
    var type     = (item.type  || '').toLowerCase();
    var says     = (item.says  || '').toLowerCase();

    var s = 0;

    // 完整名称精确匹配——最高优先级
    if (name === q) return 200;

    // 名称中的子字符串匹配（最重要的信号）
    if (name.startsWith(q))          s += 100;
    else if (name.indexOf(q) !== -1) s +=  70;
    if (item.kind === 'learning-path' && name.startsWith(q)) s += 100;

    // 多词查询：每个词都必须出现在名称中的某处
    var words = q.split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      var allInName = words.every(function (w) { return name.indexOf(w) !== -1; });
      if (allInName) {
        s += (s === 0 ? 65 : 20);
      } else {
        // 较弱匹配：每个词分散出现在名称、摘要、关键词和阶段中
        var blob = name + ' ' + summary + ' ' + keywords + ' ' + phase;
        var allInBlob = words.every(function (w) { return blob.indexOf(w) !== -1; });
        if (allInBlob) s += 15;
      }
    }

    // 辅助字段——按预期相关性排序
    if (summary.indexOf(q)  !== -1) s += 25;
    if (keywords.indexOf(q) !== -1) s += 22; // H3 标题：词汇密集
    if (says.indexOf(q)     !== -1) s += 22; // 术语表中的“人们怎么说”
    if (phase.indexOf(q)    !== -1) s += 18;
    if (lang.indexOf(q)     !== -1) s += 14;
    if (type.indexOf(q)     !== -1) s += 10;

    // 单词回退：对名称中的词元进行词边界前缀匹配
    if (s === 0 && words.length === 1) {
      var nameParts = name.split(/[\s\-–—:,]+/).filter(Boolean);
      for (var i = 0; i < nameParts.length; i++) {
        if (nameParts[i].startsWith(q)) { s += 30; break; }
      }
      // 最后的回退方式：单个词出现在关键词或摘要中的任意位置
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

  // ── 工具函数 ────────────────────────────────────────────────────────
  function escHtml(str) {
    var d = document.createElement('div');
    d.textContent = (str == null) ? '' : String(str);
    return d.innerHTML;
  }

  /**
   * 高亮 `text` 中首次出现的 `query`（或其中第一个匹配的词）。
   * 返回 HTML 安全字符串，并用 <mark> 包裹匹配内容。
   */
  function highlight(text, query) {
    if (!text) return '';
    if (!query) return escHtml(text);

    var lower = text.toLowerCase();
    var q     = query.trim().toLowerCase();
    var idx   = lower.indexOf(q);
    var matchLen = q.length;

    if (idx === -1) {
      // 逐个尝试每个词
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

  // ── 面板 DOM（首次打开时延迟创建）────────────────────────────────────
  function createPaletteDOM() {
    if (document.getElementById(PALETTE_ID)) return;

    // 检测平台，以显示页脚快捷键提示
    var isMac = /Mac|iPhone|iPod|iPad/.test(
      (navigator.userAgentData && navigator.userAgentData.platform) ||
      navigator.platform || ''
    );
    var shortcutLabel = isMac ? '⌘K' : 'Ctrl+K';

    var el = document.createElement('div');
    el.id = PALETTE_ID;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', '搜索学习路径、课程和术语表');
    el.setAttribute('aria-hidden', 'true');
    el.inert = true;

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
          ' placeholder="搜索路径、课程和术语表…"' +
          ' autocomplete="off" autocorrect="off"' +
          ' autocapitalize="off" spellcheck="false"' +
          ' role="combobox" aria-label="搜索" aria-autocomplete="list"' +
          ' aria-haspopup="listbox" aria-expanded="false"' +
          ' aria-controls="cpResults">' +
          '<button class="cp-kbd-esc" id="cpClose" type="button"' +
          ' aria-label="关闭搜索">Esc</button>' +
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

    // 绑定内部交互
    document.getElementById('cpBackdrop').addEventListener('click', close);
    document.getElementById('cpClose').addEventListener('click', close);
    el.addEventListener('keydown', _onDialogKeyDown);

    var inp = document.getElementById('cpInput');
    inp.addEventListener('input', _onInput);
    inp.addEventListener('keydown', _onKeyDown);
  }

  function _palEl()   { return document.getElementById(PALETTE_ID); }
  function _inputEl() { return document.getElementById('cpInput'); }
  function _listEl()  { return document.getElementById('cpResults'); }

  function _clearActiveDescendant() {
    var input = _inputEl();
    if (input) input.removeAttribute('aria-activedescendant');
  }

  // ── 打开 / 关闭 ─────────────────────────────────────────────────────
  function open() {
    if (_isOpen) {
      // 已经打开——确保输入框获得焦点
      var inp = _inputEl();
      if (inp) inp.focus();
      return;
    }

    _prevFocus = document.activeElement || null;
    _isOpen    = true;
    _activeIdx = -1;

    createPaletteDOM();
    document.body.setAttribute(BODY_ATTR, '');

    var pal = _palEl();
    if (pal) {
      pal.inert = false;
      pal.setAttribute('aria-hidden', 'false');
      pal.classList.add('cp-open');
    }

    var input = _inputEl();
    if (input) {
      input.setAttribute('aria-expanded', 'true');
      _clearActiveDescendant();
      input.focus();
      var q = input.value.trim();
      renderResults(q ? search(q) : []);
    }
  }

  function close() {
    if (!_isOpen) return;
    _isOpen    = false;
    _activeIdx = -1;

    var pal = _palEl();
    if (pal) {
      pal.classList.remove('cp-open');
      pal.setAttribute('aria-hidden', 'true');
      pal.inert = true;
    }
    var input = _inputEl();
    if (input) input.setAttribute('aria-expanded', 'false');
    _clearActiveDescendant();
    document.body.removeAttribute(BODY_ATTR);

    // 将焦点返回到用户之前所在的位置
    try {
      if (_prevFocus && typeof _prevFocus.focus === 'function') {
        _prevFocus.focus();
      }
    } catch (_) { /* 元素可能已从 DOM 中移除 */ }
    _prevFocus = null;
  }

  // ── 渲染结果 ────────────────────────────────────────────────────────
  function renderResults(results) {
    var list = _listEl();
    if (!list) return;

    var query = (_inputEl() ? _inputEl().value : '').trim();

    if (!query) {
      var inventory = buildIndex();
      var lessonCount = inventory.filter(function (item) { return item.kind === 'lesson'; }).length;
      var certificationLessonCount = inventory.filter(function (item) { return item.kind === 'certification-lesson'; }).length;
      var learningPathCount = inventory.filter(function (item) { return item.kind === 'learning-path'; }).length;
      var artifactCount = inventory.filter(function (item) { return item.kind === 'artifact'; }).length;
      var glossaryCount = inventory.filter(function (item) { return item.kind === 'glossary'; }).length;
      var inventoryParts = [lessonCount + ' 节课程'];
      if (learningPathCount) {
        inventoryParts.push(learningPathCount + ' 条聚焦学习路径');
      }
      if (certificationLessonCount) {
        inventoryParts.push(certificationLessonCount + ' 节认证课程');
      }
      inventoryParts.push(artifactCount + ' 个产物');
      inventoryParts.push(glossaryCount + ' 个术语表条目');
      list.innerHTML =
        '<li class="cp-empty" role="option" aria-disabled="true">' +
        '搜索' + inventoryParts.slice(0, -1).join('、') + '和' +
        inventoryParts[inventoryParts.length - 1] +
        '</li>';
      _activeIdx = -1;
      _clearActiveDescendant();
      return;
    }

    if (results.length === 0) {
      list.innerHTML =
        '<li class="cp-empty" role="option" aria-disabled="true">' +
        '未找到与 <em>' + escHtml(query) + '</em> 相关的结果' +
        '</li>';
      _activeIdx = -1;
      _clearActiveDescendant();
      return;
    }

    var html = '';
    for (var i = 0; i < results.length; i++) {
      var r    = results[i];
      var dest = '';
      var chip = '';
      var chipClass = 'cp-item-chip';

      if (r.kind === 'learning-path') {
        dest = r.url;
        chip = '学习路径';
        chipClass += ' cp-item-chip--alt';
      } else if (r.kind === 'lesson') {
        // 优先使用站内阅读器；否则回退到 GitHub URL
        dest = r.lessonPath
          ? 'lesson.html?path=' + encodeURIComponent(r.lessonPath)
          : r.url;
        chip = '阶段 ' + String(r.phaseId).padStart(2, '0');
      } else if (r.kind === 'certification-lesson') {
        dest = 'lesson.html?path=' + encodeURIComponent(r.lessonPath);
        chip = '认证';
        chipClass += ' cp-item-chip--alt';
      } else if (r.kind === 'certification-track') {
        dest = r.url;
        chip = r.examCode || '认证';
        chipClass += ' cp-item-chip--alt';
      } else if (r.kind === 'artifact') {
        // 跳转到生成此产物的课程
        dest = r.lessonPath
          ? 'lesson.html?path=' + encodeURIComponent(r.lessonPath)
          : ('https://github.com/rohitg00/ai-engineering-from-scratch/tree/main/' + r.file);
        var ak = (r.artKind || 'artifact');
        chip = ak.charAt(0).toUpperCase() + ak.slice(1);
        chipClass += ' cp-item-chip--alt';
      } else {
        // 优先使用规范术语锚点。旧版生成数据在下次站点构建前
        // 回退到精确名称查询。
        dest      = r.slug
          ? 'glossary.html#' + encodeURIComponent(r.slug)
          : 'glossary.html?q=' + encodeURIComponent(r.name);
        chip      = '术语表';
        chipClass += ' cp-item-chip--alt';
      }

      var snippet = r.summary ? truncate(r.summary, 110) : '';
      var metaParts = [];
      if (r.kind === 'learning-path') {
        if (r.lessonCount) metaParts.push(r.lessonCount + ' 节课程');
        if (r.minutes) {
          var hours = Math.floor(r.minutes / 60);
          var minutes = r.minutes % 60;
          metaParts.push(((hours ? hours + ' 小时' : '') + (minutes ? ' ' + minutes + ' 分钟' : '')).trim());
        }
      } else if (r.kind === 'lesson' || r.kind === 'certification-lesson') {
        if (r.type && r.type !== '—') metaParts.push(r.type);
        if (r.lang && r.lang !== '—') metaParts.push(r.lang);
      } else if (r.kind === 'certification-track') {
        if (r.level) metaParts.push(r.level);
      } else if (r.kind === 'artifact') {
        if (r.phaseId !== undefined && r.phaseId !== null) {
          metaParts.push('阶段 ' + String(r.phaseId).padStart(2, '0'));
        }
      }
      var meta = metaParts.join(' · '); // ·

      html +=
        '<li class="cp-item" id="cpOption-' + i + '" role="option" aria-selected="false"' +
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
    _clearActiveDescendant();

    // 添加交互处理程序
    var items = list.querySelectorAll('.cp-item');
    for (var j = 0; j < items.length; j++) {
      items[j].addEventListener('click',     _onItemClick);
      items[j].addEventListener('mousemove', _onItemMouseMove);
    }
  }

  // ── 事件处理程序 ────────────────────────────────────────────────────
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
        var targetIndex = resultIndexForEnter(_activeIdx, count);
        var target = targetIndex >= 0 ? items[targetIndex] : null;
        if (target) _navigate(target);
        break;
      }

    }
  }

  function _onDialogKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
      return;
    }

    if (e.key !== 'Tab') return;
    var input = _inputEl();
    var closeButton = document.getElementById('cpClose');
    if (!input || !closeButton) return;

    if (e.shiftKey && document.activeElement === input) {
      e.preventDefault();
      closeButton.focus();
    } else if (!e.shiftKey && document.activeElement === closeButton) {
      e.preventDefault();
      input.focus();
    }
  }

  function _updateActive(items) {
    var input = _inputEl();
    var activeId = '';
    for (var i = 0; i < items.length; i++) {
      var active = (i === _activeIdx);
      items[i].classList.toggle('cp-item--active', active);
      items[i].setAttribute('aria-selected', active ? 'true' : 'false');
      if (active) {
        activeId = items[i].id;
        items[i].scrollIntoView({ block: 'nearest', behavior: 'instant' });
      }
    }
    if (input && activeId) input.setAttribute('aria-activedescendant', activeId);
    else _clearActiveDescendant();
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

  // ── 全局键盘快捷键（Cmd/Ctrl+K）─────────────────────────────────────
  if (typeof document !== 'undefined') {
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (_isOpen) {
          // 面板已打开——仅重新聚焦输入框
          var inp = _inputEl();
          if (inp) inp.focus();
        } else {
          open();
        }
      }
    });
  }

  // ── 初始化：绑定触发按钮并立即构建索引 ───────────────────────────────
  function _init() {
    // 点击任何带有 [data-cmd-palette] 的元素都会打开面板
    var triggers = document.querySelectorAll('[data-cmd-palette]');
    for (var i = 0; i < triggers.length; i++) {
      triggers[i].addEventListener('click', function (e) {
        e.preventDefault();
        open();
      });
    }

    // 立即构建核心索引，让第一次按键即可即时响应。在课程页面上，
    // certification-data.js 会按需加载，此时可能仍在传输中。
    // 等待其完成后重建索引，避免早期仅含核心数据的缓存永久隐藏
    // 认证路线和课程。
    buildIndex();

    var certificationReady = window.__AIFS_CERTIFICATION_DATA_READY;
    if (certificationReady && typeof certificationReady.then === 'function') {
      certificationReady.then(function () {
        rebuildIndex();
        refreshOpenPalette();
      }).catch(function () {
        // 可选认证数据包无法加载时，保留已构建的核心索引。
      });
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _init);
    } else {
      _init();
    }
  }

  // ── 公共 API ────────────────────────────────────────────────────────
  if (typeof window !== 'undefined') {
    window.CmdPalette = { open: open, close: close };
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      rebuildIndex: rebuildIndex,
      search: search,
      learningPathDestination: learningPathDestination,
      resultIndexForEnter: resultIndexForEnter,
    };
  }

}());
