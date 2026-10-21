(function (G) {
  G.content = G.content || {};
  G.Content = {
    lessonGroups: function (subject, unit) {
      return (unit.lessons || []).map(function (lesson) {
        return {
          id: lesson.id,
          title: lesson.title,
          kind: lesson.kind || 'lesson',
          cards: subject.cards.filter(function (card) {
            return card.unitId === unit.id && card.lessonId === lesson.id;
          })
        };
      }).filter(function (lesson) { return lesson.cards.length; });
    },
    orderedCards: function (subject) {
      if (subject.presentation !== 'lessons') return subject.cards;
      return subject.units.flatMap(function (unit) {
        return G.Content.lessonGroups(subject, unit).flatMap(function (lesson) {
          return lesson.cards;
        });
      });
    },
    unique: function (questions) {
      var ids = new Set();
      return questions.filter(function (q) {
        var id = q.canonicalId || q.id;
        if (ids.has(id)) return false;
        ids.add(id);
        return true;
      });
    },
    legacy: function (id) {
      var s = (G.legacyContent || G.content)[id],
        questions = {},
        quiz = [];
      s.questions.forEach(function (q) {
        q.legacyRefs.forEach(function (ref) {
          var parts = ref.split(':');
          if (parts[0] === 'unit') {
            var index = Number(parts[1]);
            quiz[index] = quiz[index] || {
              unitIndex: index,
              questions: []
            };
            quiz[index].questions[Number(parts[2]) - 1] = q.raw;
          } else {
            questions[parts[0]] = questions[parts[0]] || {};
            questions[parts[0]][parts[1]] = questions[parts[0]][parts[1]] || [];
            questions[parts[0]][parts[1]][Number(parts[2]) - 1] = q.raw;
          }
        });
      });
      return {
        REVIEW_DATA: s.legacyReview,
        QUESTIONS: questions,
        UNIT_QUIZ: quiz
      };
    },
    pool: function (subject, filter) {
      filter = filter || {};
      return subject.questions.filter(function (q) {
        return q.eligible && (!filter.cardId || q.cardIds.indexOf(filter.cardId) >= 0) && (!filter.unitId || q.unitId === filter.unitId);
      });
    },
    progress: function (subject, state) {
      var cards = new Set(subject.cards.map(function (c) {
          return c.id;
        })),
        questions = new Set(subject.questions.map(function (q) {
          return q.id;
        })),
        sessions = Object.values(state.sessions || {}).filter(function (s) {
          return s.subjectId === subject.id && s.questions.length && s.questions.every(function (q) {
            return questions.has(q.id);
          });
        });
      return {
        read: Object.keys(state.readCards || {}).filter(function (id) {
          return cards.has(id);
        }).length,
        completed: sessions.filter(function (s) {
          return s.status === 'complete';
        }).length,
        resume: sessions.filter(function (s) {
          return s.status === 'active';
        }).sort(function (a, b) {
          return b.updatedAt - a.updatedAt;
        })[0] || null
      };
    },
    validate: function (s) {
      var ids = new Set(),
        cards = new Set(s.cards.map(function (c) {
          return c.id;
        })),
        issues = [];
      s.questions.forEach(function (q) {
        if (ids.has(q.id)) issues.push({
          id: q.id,
          severity: 'error',
          reason: '重复题目ID'
        });
        ids.add(q.id);
        q.cardIds.forEach(function (id) {
          if (!cards.has(id)) issues.push({
            id: q.id,
            severity: 'error',
            reason: '知识点不存在：' + id
          });
        });
        if (!q.cardIds.length) issues.push({
          id: q.id,
          severity: 'warning',
          reason: '尚未关联知识点'
        });
      });
      return issues;
    }
  };
})(window.Grade7 = window.Grade7 || {});
