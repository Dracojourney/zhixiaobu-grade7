(function (G) {
  function copy(x) {
    return JSON.parse(JSON.stringify(x));
  }
  G.Practice = {
    create: function (o) {
      var ids = new Set(),
        texts = new Set(),
        limit = {
          challenge: 5,
          unitMock: 7,
          mock: 20,
          wrong: 5
        }[o.kind] || 5;
      var qs = o.questions.filter(function (q) {
        var r = q.raw,
          key = JSON.stringify([q.type, r.q, r.scenario, r.material, r.options, r.items, r.order, r.left, r.right, r.pairs, r.answer]);
        if (!q.eligible || ids.has(q.id) || texts.has(key)) return false;
        ids.add(q.id);
        texts.add(key);
        return true;
      }).slice(0, limit);
      return {
        id: o.id,
        kind: o.kind,
        questions: copy(qs),
        current: 0,
        draft: qs.length ? G.Questions.initialAnswer(qs[0]) : null,
        responses: [],
        updatedAt: o.now || Date.now(),
        status: qs.length ? 'active' : 'empty',
        subjectId: o.subjectId || '',
        title: o.title || ''
      };
    },
    select: function (s, a) {
      if (s.status === 'active' && !s.responses[s.current]) s.draft = copy(a);
      s.updatedAt = Date.now();
      return s;
    },
    submit: function (s) {
      if (s.status !== 'active' || s.responses[s.current]) return {
        session: s,
        event: null
      };
      var q = s.questions[s.current];
      if (!G.Questions.isComplete(q, s.draft)) return {
        session: s,
        event: null
      };
      var result = G.Questions.grade(q, s.draft);
      s.responses[s.current] = {
        answer: copy(s.draft),
        correct: result.correct,
        at: Date.now()
      };
      s.updatedAt = Date.now();
      return {
        session: s,
        event: s.kind === 'mock' || s.kind === 'unitMock' ? null : {
          id: s.id + ':' + (q.canonicalId || q.id),
          sessionId: s.id,
          questionId: q.canonicalId || q.id,
          firstCorrect: result.correct,
          at: s.updatedAt
        }
      };
    },
    events: function (s) {
      if ((s.kind === 'mock' || s.kind === 'unitMock') && s.status !== 'complete') return [];
      return s.responses.flatMap(function (r, i) {
        if (!r) return [];
        var id = s.questions[i].canonicalId || s.questions[i].id;
        return [{
          id: s.id + ':' + id,
          sessionId: s.id,
          questionId: id,
          firstCorrect: r.correct,
          at: r.at || s.updatedAt
        }];
      });
    },
    next: function (s) {
      if (s.status !== 'active' || !s.responses[s.current]) return s;
      if (s.current === s.questions.length - 1) s.status = 'complete';else {
        s.current++;
        s.draft = G.Questions.initialAnswer(s.questions[s.current]);
      }
      s.updatedAt = Date.now();
      return s;
    },
    summary: function (s) {
      if (s.status !== 'complete') return null;
      var wrong = s.questions.filter(function (_, i) {
        return !s.responses[i]?.correct;
      });
      return {
        total: s.questions.length,
        correct: s.responses.filter(function (r) {
          return r.correct;
        }).length,
        wrongQuestionIds: wrong.map(function (q) {
          return q.id;
        }),
        weakCardIds: Array.from(new Set(wrong.flatMap(function (q) {
          return q.cardIds;
        })))
      };
    }
  };
})(window.Grade7 = window.Grade7 || {});
