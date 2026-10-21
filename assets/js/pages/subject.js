(function (G) {
  var U = G.UI,
    E = U.esc,
    B = U.btn,
    L = U.link;
  G.Subject = {
    mount: function (root, subject, store) {
      var meta = G.manifest.subjects.find(function (s) {
          return s.id === subject.id;
        }),
        P = G.Practice,
        Q = G.Questions,
        active = null,
        readingUI = {
          cardId: null,
          hidden: false,
          example: false,
          pitfall: false
        };
      U.setup(root, store);
      root.dataset.world = subject.id;
      function card(id) {
        return subject.cards.find(function (c) {
          return c.id === id;
        });
      }
      function route(value) {
        if (location.hash === '#' + value) render();else location.hash = value;
      }
      function persist() {
        if (active) store.load().sessions[active.id] = active;
        U.save(store);
      }
      function top(tab) {
        var read = G.Content.progress(subject, store.load()).read;
        return U.header('subject') + '<main class="g7-shell"><a href="index.html" class="g7-back">← 返回学习首页</a><section class="g7-subject-hero"><div><span class="g7-eyebrow">' + E(meta.tag) + ' / 七年级上册</span><h1><span class="g7-subject-icon">' + U.icon(subject.id) + '</span>' + E(subject.title) + '</h1><p>' + E(meta.description) + '</p></div><div class="g7-subject-summary"><b>' + read + '<small> / ' + subject.cards.length + '</small></b><span>张知识卡已读</span></div></section><nav class="g7-tabs" aria-label="学科学习方式">' + [['learn', '学考点'], ['challenge', '闯小关'], ['mock', '考点模拟'], ['wrong', '错题本']].map(function (t) {
          return '<a href="#' + t[0] + '" ' + (tab === t[0] ? 'aria-current="page"' : '') + '>' + t[1] + '</a>';
        }).join('') + '<a href="#legacy">旧版资料 ↗</a></nav>';
      }
      function unitList(challenge) {
        return '<div class="g7-section-title"><div><span class="g7-overline">' + (challenge ? 'A LITTLE CHALLENGE' : 'FOLLOW YOUR CURIOSITY') + '</span><h2>' + (challenge ? '读过的知识，拿来试一试' : '从一张卡，发现一个小世界') + '</h2><p>' + (challenge ? '每关最多5题，答完看懂思路，再向前一步。' : '按课本顺序，也可以从你好奇的地方开始。') + '</p></div><span>' + subject.units.length + ' 个单元 · 自由探索</span></div><div class="g7-unit-list">' + subject.units.map(function (u, i) {
          var cs = subject.cards.filter(function (c) {
              return c.unitId === u.id;
            }),
            read = cs.filter(function (c) {
              return store.load().readCards[c.id];
            }).length,
            pool = G.Content.pool(subject, {
              unitId: u.id
            });
          return '<details class="g7-unit" ' + (i === 0 ? 'open' : '') + '><summary><span class="g7-unit-number">' + String(i + 1).padStart(2, '0') + '</span><span><b>' + E(u.title) + '</b><small>' + cs.length + ' 张知识卡 · 已读 ' + read + ' 张</small></span><span class="g7-expand">＋</span></summary><div class="g7-unit-body">' + (challenge ? '<div class="g7-unit-challenge"><div><b>小挑战，看看记住了多少</b><p>本单元有 ' + pool.length + ' 道可用题，本次随机选取 ' + Math.min(5, pool.length) + ' 题。</p></div>' + B('开始单元挑战 →', 'unit', u.id, 'primary') + '</div>' : '') + '<div class="g7-topic-grid">' + cs.map(function (c, index) {
            var learned = Boolean(store.load().readCards[c.id]),
              n = G.Content.pool(subject, {
                cardId: c.id
              }).length;
            return '<a class="g7-card-row" href="#learn/' + encodeURIComponent(c.id) + '"><span class="g7-topic-top"><span class="g7-topic-number">' + String(index + 1).padStart(2, '0') + '</span><span class="g7-topic-state ' + (learned ? 'done' : '') + '">' + (learned ? '✓ 已读' : '待探索') + '</span></span><span class="g7-topic-content"><small>' + E(c.lesson) + '</small><b>' + E(c.title) + '</b></span><span class="g7-topic-bottom"><span>读一张卡 · ' + (n ? '练' + n + '题' : '暂无关联题') + '</span><span class="g7-round-arrow" aria-hidden="true">↗</span></span></a>';
          }).join('') + '</div></div></details>';
        }).join('') + '</div>';
      }
      function learning(c) {
        if (readingUI.cardId !== c.id) readingUI = {
          cardId: c.id,
          hidden: false,
          example: false,
          pitfall: false
        };
        var index = subject.cards.indexOf(c),
          qs = G.Content.pool(subject, {
            cardId: c.id
          }),
          next = subject.cards[index + 1],
          previous = subject.cards[index - 1],
          unitCards = subject.cards.filter(function (x) {
            return x.unitId === c.unitId;
          }),
          read = unitCards.filter(function (x) {
            return store.load().readCards[x.id];
          }).length;
        function discovery(key, label, subtitle, icon) {
          return '<details class="g7-discovery g7-discovery-' + key + '" data-discovery="' + key + '" ' + (readingUI[key] ? 'open' : '') + '><summary><span class="g7-discovery-icon">' + U.icon(icon) + '</span><span><b>' + label + '</b><small>' + subtitle + '</small></span><span class="g7-discovery-plus" aria-hidden="true">＋</span></summary><p class="g7-discovery-content">' + E(c[key]) + '</p></details>';
        }
        return '<div class="g7-learning-layout"><aside class="g7-reading-nav"><details class="g7-outline" ' + (window.matchMedia('(min-width: 800px)').matches ? 'open' : '') + '><summary>本单元知识卡 <span>＋</span></summary><nav aria-label="本单元知识点">' + unitCards.map(function (x, i) {
          return '<a ' + (x.id === c.id ? 'aria-current="page"' : '') + ' href="#learn/' + encodeURIComponent(x.id) + '"><span>' + String(i + 1).padStart(2, '0') + '</span><b>' + E(x.title) + '</b>' + (store.load().readCards[x.id] ? ' <i>✓</i>' : '') + '</a>';
        }).join('') + '</nav></details><div class="g7-reading-hint">' + U.icon('bulb') + '<p>先理解，再回忆。<br>不急着记住所有细节。</p></div></aside><article class="g7-knowledge"><div class="g7-card-label"><span class="g7-chip">' + U.icon(subject.id) + ' 知识卡 ' + (index + 1) + ' / ' + subject.cards.length + '</span><span>' + E(c.lesson) + '</span></div><h2 tabindex="-1">' + E(c.title) + '</h2><div class="g7-reading-intro"><span>01 / 读懂这个知识点</span><span>慢慢读，想一想</span></div><div class="g7-knowledge-body" id="g7-reading-body" ' + (readingUI.hidden ? 'hidden' : '') + '>' + E(c.body).split(/(?=[①②③④⑤⑥⑦⑧⑨])/).filter(Boolean).map(function (p) {
          return '<p>' + p + '</p>';
        }).join('') + '</div>' + (c.example ? '<div class="g7-explore-heading"><span>02 / 换个角度看一看</span>' + B('全部展开', 'expand-discoveries', '', 'text') + '</div><div class="g7-discoveries">' + discovery('example', '看个例子', '把知识放进具体情境', 'compass') + discovery('pitfall', '容易混淆', '发现那个容易忽略的地方', 'bulb') + '</div>' : '') + '<div class="g7-recall"><div class="g7-recall-label"><span>' + U.icon('star') + '</span><b>03 / 给记忆一个小挑战</b></div><p>' + E(c.recall || '你能用自己的话讲清这个知识点吗？') + '</p><button class="g7-btn quiet" data-action="recall" aria-controls="g7-reading-body" aria-expanded="' + !readingUI.hidden + '">' + (readingUI.hidden ? '展开知识内容' : '收起正文，试着回忆') + '</button><small>只收起正文，不影响学习记录</small></div><div class="g7-exam-type"><b>可以怎样考</b><span>' + E(c.examType || '理解与应用') + '</span></div><details class="g7-explanation g7-source"><summary>教材版本与整理依据</summary><p>' + E(subject.publisher) + ' · ' + E(subject.editionDate) + '版 · ISBN ' + E(subject.isbn) + (c.page ? ' · 本课起始页 ' + c.page : '') + '</p><p>原创概括与练习；教材正文尚未逐页校核。</p>' + (subject.sources || []).filter(function (source) {
          return c.sourceIds && c.sourceIds.includes(source.id);
        }).map(function (source) {
          return '<p>' + ((source.url || '').startsWith('https://') ? '<a target="_blank" rel="noopener noreferrer" href="' + E(source.url) + '">' + E(source.title) + ' ↗</a>' : E(source.title)) + '</p>';
        }).join('') + '</details><div class="g7-card-actions">' + B(store.load().readCards[c.id] ? '✓ 已读这张卡' : '标记已读', 'read', c.id, 'quiet') + (qs.length ? B('练一小关 · ' + Math.min(5, qs.length) + '题 →', 'card', c.id, 'primary') : '<span class="g7-muted">本知识点暂无关联练习</span>') + '</div><div class="g7-card-next">' + L(previous ? '← 上一张' : '← 回到章节目录', previous ? '#learn/' + encodeURIComponent(previous.id) : '#learn', 'quiet') + (next ? L('下一张知识卡 →', '#learn/' + encodeURIComponent(next.id), 'quiet') : '<span>已经探索到最后一张了 ✦</span>') + '</div></article><aside class="g7-reading-rail" aria-label="本单元进度"><span class="g7-rail-mark">' + U.icon('star') + '</span><span class="g7-overline">YOUR LITTLE STEPS</span><h2>一点点，读懂它。</h2><p>每次理解一个知识点，<br>就是一次小小的进步。</p><div class="g7-rail-meter"><b>' + read + '<small> / ' + unitCards.length + '</small></b><p>本单元知识卡已读</p><div class="g7-progress"><span style="width:' + read / unitCards.length * 100 + '%"></span></div></div><div class="g7-rail-next"><span>接下来可以</span><b>用 ' + qs.length + ' 道题，试试理解</b><p>准备好了，再开始。</p></div>' + L('看看本单元挑战 →', '#challenge', 'quiet') + '</aside></div>';
      }
      function legacyInfo() {
        var keys = {
            history: 'history_quiz_v2',
            geography: 'geography_xjb_v1',
            biology: 'biology_quiz_v1',
            morality: 'morality_quiz_grade7_v1'
          },
          old = store.legacy(keys[subject.id]),
          count = old && old.sessions ? Object.keys(old.sessions).length : 0;
        var currentIds = new Set(subject.questions.map(function (q) {
            return q.id;
          })),
          state = store.load(),
          previous = Object.values(state.sessions).filter(function (session) {
            return session.subjectId === subject.id && session.questions.some(function (q) {
              return !currentIds.has(q.id);
            });
          }).sort(function (a, b) {
            return b.updatedAt - a.updatedAt;
          }),
          oldWrongIds = new Set(state.events.filter(function (e) {
            return !e.firstCorrect && !currentIds.has(e.questionId);
          }).map(function (e) {
            return e.questionId;
          })),
          historicalQuestions = new Map();
        previous.forEach(function (session) {
          session.questions.forEach(function (q) {
            if (oldWrongIds.has(q.id) || oldWrongIds.has(q.canonicalId)) historicalQuestions.set(q.id, q);
          });
        });
        return (count ? '<div class="g7-info">发现 ' + count + ' 个旧专项记录，保留在原练习模式中。' + L('继续旧专项 →', '#legacy', 'quiet') + '</div>' : '') + (previous.length ? '<details class="g7-panel g7-history"><summary>历史学习记录 · ' + previous.length + ' 次练习 / ' + historicalQuestions.size + ' 道历史错题</summary><p>早期试用版记录保留在这里，不计入新版学习进度。</p>' + previous.map(function (session) {
          return '<p>' + L((session.status === 'complete' ? '回看：' : '继续：') + session.title, '#session/' + encodeURIComponent(session.id), 'quiet') + '</p>';
        }).join('') + Array.from(historicalQuestions.values()).map(function (q) {
          return '<details class="g7-wrong-item"><summary>' + E(q.raw.q) + '</summary><p>参考答案：' + E(Q.answerText(q)) + '</p><p>' + E(q.raw.explain) + '</p></details>';
        }).join('') + '</details>' : '');
      }
      function mock() {
        var pool = G.Content.pool(subject);
        return '<div class="g7-section-title"><div><h2>把学过的，连起来试一试</h2><p>提交后先不揭晓答案，完成整组后一起看解析。不默认计时。</p></div></div><div class="g7-mock-grid"><section class="g7-mock-feature"><span class="g7-chip">综合模拟</span><h2>上册考点模拟</h2><p>从四处学来的知识，<br>在这里串成自己的理解。</p><div class="g7-mock-number">' + Math.min(20, pool.length) + '<small>题 · 完成后统一解析</small></div>' + B('开始综合模拟 →', 'mock', '', 'primary') + '<small>原创考点模拟 · 完成后统一解析。</small></section><section class="g7-panel"><h2>按单元练习</h2>' + subject.units.map(function (u) {
          var n = Math.min(7, G.Content.pool(subject, {
            unitId: u.id
          }).length);
          return '<div class="g7-mock-unit"><div><b>' + E(u.title) + '</b><small>' + n + ' 题' + (n < 7 ? ' · 按实际可用题量' : '') + '</small></div>' + B('开始 →', 'unitMock', u.id, 'quiet') + '</div>';
        }).join('') + '</section></div>';
      }
      function wrong() {
        var state = store.load(),
          wrongIds = new Set(state.events.filter(function (e) {
            return !e.firstCorrect;
          }).map(function (e) {
            return e.questionId;
          })),
          newQs = G.Content.unique(subject.questions.filter(function (q) {
            return wrongIds.has(q.canonicalId || q.id);
          })),
          old = store.legacy('wrongbook_v1'),
          oldList = old && Array.isArray(old[subject.id]) ? old[subject.id] : [],
          pending = newQs.filter(function (q) {
            return store.wrongStatus(q.id) !== 'consolidated';
          });
        return '<div class="g7-section-title"><div><h2>再想一想，就会更熟悉</h2><p>在两次独立练习中首次答对，标记为已巩固；历史错题始终保留。</p></div>' + B('复练待巩固 · ' + Math.min(5, pending.length) + '题', 'wrong', '', 'primary') + '</div><div class="g7-status-row"><span>待巩固 <b>' + pending.length + '</b></span><span>已巩固 <b>' + (newQs.length - pending.length) + '</b></span><span>历史记录 <b>' + oldList.length + '</b></span></div>' + (newQs.length ? newQs.map(function (q) {
          return '<details class="g7-wrong-item"><summary><span class="g7-chip">' + (store.wrongStatus(q.id) === 'consolidated' ? '✓ 已巩固' : '待巩固') + '</span><b>' + E(q.raw.q) + '</b></summary><div><p>参考答案：' + E(Q.answerText(q)) + '</p><p>' + E(q.raw.explain) + '</p>' + q.cardIds.map(function (id) {
            var c = card(id);
            return c ? L('回顾：' + c.title, '#learn/' + encodeURIComponent(id), 'quiet') : '';
          }).join('') + '</div></details>';
        }).join('') : '<section class="g7-empty"><span>✦</span><h2>这里还没有新错题</h2><p>先去学一张知识卡，练一小关吧。答错的题会自动留在这里。</p>' + L('去学考点 →', '#learn', 'primary') + '</section>') + (oldList.length ? '<section class="g7-panel"><h2>历史错题</h2><p>旧记录保留原始题目与累计次数，不直接判断是否掌握。</p>' + oldList.map(function (q) {
          return '<details class="g7-wrong-item"><summary><span class="g7-chip">历史记录</span><b>' + E(q.q) + '</b></summary><div><p>' + E(q.explain) + '</p><small>累计答错 ' + (Number(q.wrongCount) || 0) + ' 次</small></div></details>';
        }).join('') + L('在原错题本中继续练习 →', '#legacy', 'quiet') + '</section>' : '');
      }
      function options(q, response) {
        var locked = Boolean(response),
          a = active.draft,
          r = q.raw;
        if (q.type === 'choice' || q.type === 'judge') {
          var options = q.type === 'choice' ? r.options : ['正确', '错误'];
          return '<div class="g7-options" role="group" aria-label="选择答案">' + options.map(function (text, i) {
            var value = q.type === 'judge' ? i === 0 : i;
            return '<button class="g7-option ' + (a === value ? 'selected' : '') + '" data-action="answer" data-value="' + i + '" aria-pressed="' + (a === value) + '" ' + (locked ? 'disabled' : '') + '><span>' + String.fromCharCode(65 + i) + '</span><b>' + E(text) + '</b><i>' + (a === value ? '●' : '○') + '</i></button>';
          }).join('') + '</div>';
        }
        if (q.type === 'sort') return '<ol class="g7-sort">' + a.map(function (index, i) {
          return '<li><span>' + (i + 1) + '</span><b>' + E(r.items[index]) + '</b><div><button aria-label="向上移动第' + (i + 1) + '项" data-action="move" data-value="' + i + ':-1" ' + (locked || i === 0 ? 'disabled' : '') + '>↑</button><button aria-label="向下移动第' + (i + 1) + '项" data-action="move" data-value="' + i + ':1" ' + (locked || i === a.length - 1 ? 'disabled' : '') + '>↓</button></div></li>';
        }).join('') + '</ol>';
        if (q.type === 'match') return '<div class="g7-matching">' + r.left.map(function (text, i) {
          return '<label><span>' + E(text) + '</span><select data-match="' + i + '" ' + (locked ? 'disabled' : '') + ' aria-label="' + E(text) + '的对应项"><option value="">选择对应项</option>' + r.right.map(function (right, j) {
            return '<option value="' + j + '" ' + (a[i] === j ? 'selected' : '') + '>' + E(right) + '</option>';
          }).join('') + '</select></label>';
        }).join('') + '</div>';
        return '';
      }
      function sessionView() {
        if (!active) return '<div class="g7-empty"><h2>未找到这次练习</h2>' + L('回到学科首页', '#learn', 'primary') + '</div>';
        if (active.status === 'empty') return '<div class="g7-empty"><h2>暂时没有可用练习题</h2><p>可以先阅读知识卡，不会补入无关题目。</p>' + L('去学考点', '#learn', 'primary') + '</div>';
        if (active.status === 'complete') return result();
        var q = active.questions[active.current],
          r = active.responses[active.current],
          isMock = active.kind === 'mock' || active.kind === 'unitMock',
          percent = active.current / active.questions.length * 100;
        return '<div class="g7-practice-head"><div><span class="g7-chip">' + (isMock ? '考点模拟' : '短关挑战') + '</span><h2>' + E(active.title) + '</h2></div><span>第 <b>' + (active.current + 1) + '</b> / ' + active.questions.length + ' 题</span></div><div class="g7-progress large"><span style="width:' + percent + '%"></span></div><article class="g7-question"><div class="g7-card-label"><span>' + {
          choice: '选择题',
          judge: '判断题',
          sort: '排序题',
          match: '匹配题'
        }[q.type] + '</span><span>' + E(q.provenance && q.provenance.label || '历史练习 · 来源待核验') + '</span></div>' + (q.raw.material || q.raw.scenario ? '<div class="g7-material">' + E(q.raw.material || q.raw.scenario) + '</div>' : '') + '<h2 tabindex="-1">' + E(q.raw.q) + '</h2>' + options(q, r) + (r ? '<div class="g7-feedback ' + (isMock ? 'neutral' : r.correct ? 'correct' : 'retry') + '" role="status">' + (isMock ? '✓ 本题已提交，完成后一起看解析。' : r.correct ? '✓ 答对了！看看思路是否一致。' : '↻ 这题值得再想一想，先看懂原因。') + '</div>' + (!isMock ? '<details class="g7-explanation" open><summary>答案与解析</summary><p><b>' + E(Q.answerText(q)) + '</b></p><p>' + E(q.raw.explain) + '</p>' + q.cardIds.map(function (id) {
          var c = card(id);
          return c ? L('回顾：' + c.title, '#learn/' + encodeURIComponent(id), 'quiet') : '';
        }).join('') + '</details>' : '') : '') + '<div class="g7-question-actions">' + (r ? B(active.current === active.questions.length - 1 ? '完成，看看收获 →' : '下一题 →', 'next', '', 'primary') : B('提交答案', 'submit', '', 'primary')) + L('暂时退出，稍后继续', '#learn', 'quiet') + '</div><p class="g7-small">' + (isMock ? '不计时 · 提交后答案锁定 · 整组完成后统一解析' : '不用着急，先想清楚再提交。') + '</p></article>';
      }
      function result() {
        var summary = P.summary(active),
          isMock = active.kind === 'mock' || active.kind === 'unitMock';
        return '<section class="g7-result"><span class="g7-result-star">✦</span><span class="g7-chip">完成了一小步</span><h2>' + (summary.correct === summary.total ? '这一组，你都答对了！' : '练完了，也更清楚了。') + '</h2><p>完成 ' + summary.total + ' 题，首次答对 ' + summary.correct + ' 题。' + (summary.wrongQuestionIds.length ? '还有 ' + summary.wrongQuestionIds.length + ' 题，值得再巩固一下。' : '给自己的认真点个赞。') + '</p><div class="g7-result-score"><b>' + summary.correct + '</b><span> / ' + summary.total + '<small>首次答对</small></span></div><div class="g7-result-actions">' + (summary.wrongQuestionIds.length ? B('再练本组错题 →', 'retryWrong', '', 'primary') : L('继续学考点 →', '#learn', 'primary')) + L('看看错题本', '#wrong', 'quiet') + '</div></section>' + (summary.weakCardIds.length ? '<section class="g7-panel"><h2>回顾这些知识点</h2><div class="g7-inline-subjects">' + summary.weakCardIds.map(function (id) {
          var c = card(id);
          return c ? L(c.title + ' →', '#learn/' + encodeURIComponent(id), 'quiet') : '';
        }).join('') + '</div></section>' : '') + '<section class="g7-panel"><h2>' + (isMock ? '模拟解析' : '本关回顾') + '</h2>' + active.questions.map(function (q, i) {
          return '<details class="g7-wrong-item"><summary><span class="g7-chip">' + (active.responses[i].correct ? '✓ 答对' : '↻ 待巩固') + '</span><b>' + E(q.raw.q) + '</b></summary><div><p>参考答案：' + E(Q.answerText(q)) + '</p><p>' + E(q.raw.explain) + '</p></div></details>';
        }).join('') + '</section>';
      }
      function render() {
        var parts = location.hash.slice(1).split('/'),
          tab = parts[0] || 'learn',
          id;
        try {
          id = decodeURIComponent(parts.slice(1).join('/'));
        } catch (e) {
          id = '';
        }
        root.dataset.view = tab === 'learn' && id ? 'reading' : tab;
        document.body.classList.toggle('g7-reading-mode', root.dataset.view === 'reading');
        var legacy = document.getElementById('legacy-root');
        if (tab === 'legacy') {
          var restored = store.restoreLegacy();
          if (!restored.ok) {
            location.hash = 'learn';
            U.notice(restored.error);
            return;
          }
          if (window.g7InitLegacy) window.g7InitLegacy();
          root.hidden = true;
          legacy.hidden = false;
          document.body.classList.remove('g7-body');
          return;
        }
        root.hidden = false;
        legacy.hidden = true;
        document.body.classList.add('g7-body');
        var body;
        if (tab === 'session') {
          active = store.load().sessions[id] || null;
          body = sessionView();
        } else if (tab === 'learn' && id) {
          var c = card(id);
          body = c ? learning(c) : '<div class="g7-empty"><h2>这张知识卡不存在</h2>' + L('返回目录', '#learn', 'primary') + '</div>';
          if (c) {
            store.load().lastActivity = {
              subjectId: subject.id,
              cardId: c.id,
              at: Date.now()
            };
            U.save(store);
          }
        } else if (tab === 'mock') body = mock();else if (tab === 'wrong') body = wrong();else body = unitList(tab === 'challenge');
        root.innerHTML = top(tab === 'session' ? active && active.kind.includes('Mock') || active && active.kind === 'mock' ? 'mock' : 'challenge' : tab) + legacyInfo() + body + '</main>' + U.footer();
        if (store.error()) U.notice(store.error());
        var submit = root.querySelector('[data-action="submit"]');
        if (submit && active) submit.disabled = !Q.isComplete(active.questions[active.current], active.draft);
      }
      function start(kind, pool, title) {
        pool = pool.slice();
        for (var i = pool.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1)),
            q = pool[i];
          pool[i] = pool[j];
          pool[j] = q;
        }
        active = P.create({
          id: subject.id + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
          kind: kind,
          questions: pool,
          subjectId: subject.id,
          title: title
        });
        persist();
        route('session/' + encodeURIComponent(active.id));
      }
      root.addEventListener('click', function (e) {
        var el = e.target.closest('[data-action]');
        if (!el) return;
        var action = el.dataset.action,
          value = el.dataset.value,
          q = active && active.questions[active.current];
        if (action === 'recall') {
          readingUI.hidden = !readingUI.hidden;
          var body = root.querySelector('#g7-reading-body');
          if (body) {
            body.hidden = readingUI.hidden;
            el.setAttribute('aria-expanded', String(!readingUI.hidden));
            el.textContent = readingUI.hidden ? '展开知识内容' : '收起正文，试着回忆';
          }
          return;
        }
        if (action === 'expand-discoveries') {
          var disclosures = Array.from(root.querySelectorAll('.g7-discovery')),
            expand = disclosures.some(function (d) {
              return !d.open;
            });
          disclosures.forEach(function (d) {
            d.open = expand;
            readingUI[d.dataset.discovery] = expand;
          });
          el.textContent = expand ? '全部收起' : '全部展开';
          return;
        }
        if (action === 'read') {
          store.load().readCards[value] = Date.now();
          U.save(store);
          render();
        }
        if (action === 'card') {
          var c = card(value);
          start('challenge', G.Content.pool(subject, {
            cardId: value
          }), c.title);
        }
        if (action === 'unit' || action === 'unitMock') {
          var u = subject.units.find(function (x) {
            return x.id === value;
          });
          start(action === 'unit' ? 'challenge' : 'unitMock', G.Content.pool(subject, {
            unitId: value
          }), u.title);
        }
        if (action === 'mock') start('mock', G.Content.pool(subject), '上册综合考点模拟');
        if (action === 'wrong') {
          var ids = new Set(store.load().events.filter(function (ev) {
            return !ev.firstCorrect && store.wrongStatus(ev.questionId) !== 'consolidated';
          }).map(function (ev) {
            return ev.questionId;
          }));
          start('wrong', subject.questions.filter(function (x) {
            return ids.has(x.canonicalId || x.id);
          }), '错题巩固');
        }
        if (action === 'retryWrong') {
          var wrongIds = P.summary(active).wrongQuestionIds;
          start('wrong', active.questions.filter(function (x) {
            return wrongIds.includes(x.id);
          }), '本组错题巩固');
        }
        if (action === 'answer') {
          P.select(active, q.type === 'judge' ? value === '0' : Number(value));
          persist();
          render();
        }
        if (action === 'move') {
          var nums = value.split(':').map(Number),
            order = active.draft.slice(),
            to = nums[0] + nums[1];
          if (to >= 0 && to < order.length) {
            var temp = order[to];
            order[to] = order[nums[0]];
            order[nums[0]] = temp;
            P.select(active, order);
            persist();
            render();
          }
        }
        if (action === 'submit') {
          var event = P.submit(active).event;
          if (event && !store.load().events.some(function (x) {
            return x.id === event.id;
          })) store.load().events.push(event);
          persist();
          render();
        }
        if (action === 'next') {
          P.next(active);
          P.events(active).forEach(function (event) {
            if (!store.load().events.some(function (e) {
              return e.id === event.id;
            })) store.load().events.push(event);
          });
          persist();
          render();
          var heading = root.querySelector('.g7-question h2');
          if (heading) heading.focus();
        }
        if (action === 'answer') {
          var chosen = root.querySelector('[data-action="answer"][data-value="' + value + '"]');
          if (chosen) chosen.focus({
            preventScroll: true
          });
        }
        if (action === 'submit') {
          var next = root.querySelector('[data-action="next"]');
          if (next) next.focus({
            preventScroll: true
          });
          var feedback = root.querySelector('.g7-feedback');
          if (feedback) U.announce(feedback.textContent);
        }
        if (action === 'move') {
          var target = root.querySelector('[data-action="move"][data-value="' + to + ':' + nums[1] + '"]:not(:disabled)') || root.querySelector('[data-action="submit"]');
          if (target) target.focus({
            preventScroll: true
          });
        }
        if (action === 'read') {
          var readButton = root.querySelector('[data-action="read"]');
          if (readButton) readButton.focus({
            preventScroll: true
          });
        }
      });
      root.addEventListener('toggle', function (e) {
        if (e.target.matches('.g7-discovery')) {
          readingUI[e.target.dataset.discovery] = e.target.open;
          var button = root.querySelector('[data-action="expand-discoveries"]');
          if (button) button.textContent = Array.from(root.querySelectorAll('.g7-discovery')).every(function (d) {
            return d.open;
          }) ? '全部收起' : '全部展开';
        }
      }, true);
      root.addEventListener('change', function (e) {
        if (e.target.matches('[data-match]') && active) {
          var answer = active.draft.slice();
          answer[Number(e.target.dataset.match)] = e.target.value === '' ? null : Number(e.target.value);
          P.select(active, answer);
          persist();
          var submit = root.querySelector('[data-action="submit"]');
          submit.disabled = !Q.isComplete(active.questions[active.current], active.draft);
        }
      });
      render();
      window.addEventListener('hashchange', function () {
        render();
        window.scrollTo(0, 0);
      });
    }
  };
})(window.Grade7 = window.Grade7 || {});
