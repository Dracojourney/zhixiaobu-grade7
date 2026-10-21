(function (G) {
  var U = G.UI,
    E = U.esc;
  G.Home = {
    mount: function (root, store, manifest) {
      U.setup(root, store);
      function render() {
        var state = store.load(),
          progress = Object.values(G.content).map(function (s) {
            return G.Content.progress(s, state);
          }),
          resume = progress.map(function (p) {
            return p.resume;
          }).filter(Boolean).sort(function (a, b) {
            return b.updatedAt - a.updatedAt;
          })[0],
          read = progress.reduce(function (n, p) {
            return n + p.read;
          }, 0),
          done = progress.reduce(function (n, p) {
            return n + p.completed;
          }, 0),
          currentIds = new Set(Object.values(G.content).flatMap(function (s) {
            return s.questions.map(function (q) {
              return q.id;
            });
          })),
          wrong = new Set(state.events.filter(function (e) {
            return currentIds.has(e.questionId) && !e.firstCorrect && store.wrongStatus(e.questionId) !== 'consolidated';
          }).map(function (e) {
            return e.questionId;
          })),
          total = Object.values(G.content).reduce(function (n, s) {
            return n + s.cards.length;
          }, 0),
          recent = state.lastActivity;
        if (recent && (!G.content[recent.subjectId] || !G.content[recent.subjectId].cards.some(function (c) {
          return c.id === recent.cardId;
        }))) recent = null;
        var href = resume ? resume.subjectId + '-grade7.html#session/' + encodeURIComponent(resume.id) : recent ? recent.subjectId + '-grade7.html#learn/' + encodeURIComponent(recent.cardId) : '#subjects';
        root.innerHTML = U.header('home') + '<main class="g7-shell g7-home-shell"><div class="g7-home-layout"><div class="g7-home-main"><section class="g7-welcome"><div class="g7-eyebrow"><span class="g7-tiny-star">✦</span> 给好奇心，一点生长的空间</div><h1>今天，发现一点<br><span>新知识。</span></h1><p>从一个小问题出发，读懂一个知识点。<br>学一点，练一下，慢慢变成自己的。</p><div class="g7-welcome-actions">' + U.link(resume ? '继续上次练习 ↗' : recent ? '继续上次学习 ↗' : '开始今天的探索 ↗', href, 'primary') + '<span>按自己的节奏，就很好。</span></div><div class="g7-hero-art" aria-hidden="true"><span class="g7-art-orbit"></span><span class="g7-art-book">' + U.icon('book') + '</span><span class="g7-art-star">✦</span><span class="g7-art-note">A little<br>curiosity.</span></div></section><section id="subjects"><div class="g7-section-title"><div><span class="g7-overline">PICK YOUR WORLD</span><h2>七个世界，等你探索</h2></div><span>七年级上册 · 从课本出发</span></div><nav class="g7-world-tabs" aria-label="学科快捷入口"><a href="#subjects" aria-current="page">' + U.icon('compass') + '全部学科</a>' + manifest.subjects.map(function (s) {
          return '<a href="' + s.id + '-grade7.html">' + U.icon(s.id) + E(s.title) + '</a>';
        }).join('') + '</nav><div class="g7-subject-grid">' + manifest.subjects.map(function (s) {
          var data = G.content[s.id],
            count = data.cards.length,
            learned = G.Content.progress(data, state).read;
          return '<a class="g7-subject-card" data-world="' + s.id + '" href="' + s.id + '-grade7.html"><div class="g7-subject-top"><span class="g7-world-label"><span class="g7-subject-icon">' + U.icon(s.id) + '</span>' + E(s.tag) + '</span><span class="g7-card-badge">' + count + ' 张卡片</span></div><h3>' + E(s.title) + '</h3><p>' + E(s.description) + '</p><div class="g7-subject-bottom"><span>' + data.units.length + ' 个单元 · ' + (learned ? '已读 ' + learned + ' 张' : '等待你的第一步') + '</span><span class="g7-round-arrow" aria-hidden="true">↗</span></div><div class="g7-progress"><span style="width:' + learned / count * 100 + '%"></span></div></a>';
        }).join('') + '</div></section><section class="g7-learning-strip"><span class="g7-strip-icon">' + U.icon('compass') + '</span><div><b>探索的小路线</b><p>读懂知识卡 <span>→</span> 练一小关 <span>→</span> 回顾错题 <span>→</span> 考点模拟</p></div></section></div><aside class="g7-home-rail" aria-label="我的学习进度"><section class="g7-profile"><span class="g7-profile-symbol">' + U.icon('star') + '</span><h2>每一小步，都算数。</h2><p>这是属于你的学习空间</p><div class="g7-rail-meter"><div class="g7-section-title"><b>我的探索进度</b><span>' + read + ' / ' + total + '</span></div><div class="g7-progress"><span style="width:' + read / total * 100 + '%"></span></div><small>已读知识卡，持续积累中</small></div><div class="g7-metrics"><span><b>' + read + '</b>张卡片已读</span><span><b>' + done + '</b>次练习完成</span></div></section><section class="g7-rail-card"><span class="g7-overline">NEXT LITTLE STEP</span><h2>' + (resume ? '接着练，别丢了思路' : recent ? '接着上次的小发现' : '从一张卡开始就好') + '</h2><p>' + (resume ? E(resume.title) : recent ? E(G.content[recent.subjectId].cards.find(function (c) {
          return c.id === recent.cardId;
        }).title) : '选一科感兴趣的内容，读完后试着用自己的话讲一遍。') + '</p>' + U.link(resume ? '继续练习 →' : recent ? '继续学习 →' : '去选一科 →', href, 'quiet') + '</section><section class="g7-rail-card g7-wrong-preview"><div class="g7-section-title"><h2>再想一想</h2><span class="g7-card-badge">' + wrong.size + ' 道待巩固</span></div><p>答错的题，也是新的发现。分两次练习答对，让理解更牢一点。</p><div class="g7-inline-subjects">' + manifest.subjects.map(function (s) {
          return U.link(s.title + ' ↗', s.id + '-grade7.html#wrong', 'quiet');
        }).join('') + '</div></section><div class="g7-rail-note">' + U.icon('bulb') + '<p>不必一次学完。<br>好奇心，会带你走得更远。</p></div></aside></div></main>' + U.footer();
        if (store.error()) U.notice(store.error());
      }
      render();
      window.addEventListener('hashchange', render);
    }
  };
})(window.Grade7 = window.Grade7 || {});
