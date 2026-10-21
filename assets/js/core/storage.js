(function (G) {
  var KEY = 'grade7_learning_v1',
    SUBJECTS = ['history', 'geography', 'biology', 'morality', 'chinese', 'math', 'english'],
    LEGACY = ['history_quiz_v2', 'morality_quiz_grade7_v1', 'biology_quiz_v1', 'geography_xjb_v1', 'wrongbook_v1'];
  function obj(x) {
    return x && typeof x === 'object' && !Array.isArray(x);
  }
  function blank() {
    return {
      schemaVersion: 1,
      readCards: {},
      sessions: {},
      events: [],
      legacyBackup: {},
      migration: {},
      importBackups: [],
      lastActivity: null
    };
  }
  function safeTree(x) {
    if (!x || typeof x !== 'object') return true;
    return Object.keys(x).every(function (k) {
      return !['__proto__', 'prototype', 'constructor'].includes(k) && safeTree(x[k]);
    });
  }
  function validQuestion(q) {
    if (!obj(q) || typeof q.id !== 'string' || !obj(q.raw) || !Array.isArray(q.cardIds) || !q.cardIds.every(function (x) {
      return typeof x === 'string';
    })) return false;
    var r = q.raw;
    if (typeof r.q !== 'string' || typeof r.explain !== 'string') return false;
    if (q.type === 'choice') return Array.isArray(r.options) && r.options.every(function (x) {
      return typeof x === 'string';
    }) && Number.isInteger(r.answer) && r.answer >= 0 && r.answer < r.options.length;
    if (q.type === 'judge') return typeof r.answer === 'boolean';
    if (q.type === 'sort') return Array.isArray(r.items) && Array.isArray(r.order) && r.items.length === r.order.length && new Set(r.order).size === r.items.length && r.order.every(function (i) {
      return Number.isInteger(i) && i >= 0 && i < r.items.length;
    });
    if (q.type === 'match') return Array.isArray(r.left) && Array.isArray(r.right) && r.left.length === r.right.length && Array.isArray(r.pairs) && r.pairs.length === r.left.length && new Set(r.pairs).size === r.left.length && r.pairs.every(function (i) {
      return Number.isInteger(i) && i >= 0 && i < r.right.length;
    });
    return false;
  }
  function validSession(x) {
    if (!obj(x) || typeof x.id !== 'string' || !SUBJECTS.includes(x.subjectId) || !['challenge', 'mock', 'unitMock', 'wrong'].includes(x.kind) || !Number.isFinite(x.updatedAt) || !Array.isArray(x.questions) || !x.questions.every(validQuestion) || !Array.isArray(x.responses) || x.responses.length > x.questions.length || !Number.isInteger(x.current) || x.current < 0 || !['active', 'complete', 'empty'].includes(x.status)) return false;
    if (x.status === 'active' && (x.current >= x.questions.length || !x.questions.length)) return false;
    if (x.status === 'complete' && (x.responses.length !== x.questions.length || x.responses.some(function (r) {
      return !r;
    }))) return false;
    if (x.status === 'active' && x.responses.slice(0, x.current).some(function (r) {
      return !r;
    })) return false;
    if (x.status === 'active') {
      var q = x.questions[x.current],
        draft = x.draft;
      if (['sort', 'match'].includes(q.type) && (!Array.isArray(draft) || draft.length !== (q.type === 'sort' ? q.raw.items.length : q.raw.left.length))) return false;
    }
    return x.responses.every(function (r) {
      return r === null || obj(r) && typeof r.correct === 'boolean' && Object.hasOwn(r, 'answer');
    });
  }
  function valid(s) {
    return safeTree(s) && obj(s) && s.schemaVersion === 1 && obj(s.readCards) && Object.values(s.readCards).every(Number.isFinite) && obj(s.sessions) && Array.isArray(s.events) && obj(s.legacyBackup) && Object.values(s.legacyBackup).every(function (x) {
      return typeof x === 'string';
    }) && obj(s.migration) && (!s.importBackups || Array.isArray(s.importBackups)) && (!s.lastActivity || obj(s.lastActivity) && SUBJECTS.includes(s.lastActivity.subjectId) && typeof s.lastActivity.cardId === 'string' && Number.isFinite(s.lastActivity.at)) && s.events.every(function (e) {
      return obj(e) && typeof e.id === 'string' && typeof e.sessionId === 'string' && typeof e.questionId === 'string' && typeof e.firstCorrect === 'boolean' && Number.isFinite(e.at);
    }) && Object.entries(s.sessions).every(function (entry) {
      return entry[0] === entry[1]?.id && validSession(entry[1]);
    });
  }
  function clone(x) {
    return JSON.parse(JSON.stringify(x));
  }
  function safeParse(s) {
    try {
      return JSON.parse(s);
    } catch (e) {
      return null;
    }
  }
  function normalizeLegacy(key, text) {
    var data = safeParse(text),
      issues = 0;
    if (!obj(data) || !safeTree(data)) return {
      data: null,
      issues: 1
    };
    if (key === 'wrongbook_v1') {
      var book = {};
      ['history', 'geography', 'biology', 'morality'].forEach(function (subject) {
        var list = data[subject];
        if (!Array.isArray(list)) {
          if (list !== undefined) issues++;
          list = [];
        }
        book[subject] = list.filter(function (q) {
          var good = obj(q) && typeof q.q === 'string' && (!q.options || Array.isArray(q.options) && q.options.every(function (x) {
            return typeof x === 'string';
          }));
          if (!good) issues++;
          return good;
        });
      });
      return {
        data: book,
        issues: issues
      };
    }
    var sessions = {},
      rounds = {},
      stats = [];
    if (obj(data.rounds)) Object.entries(data.rounds).forEach(function (entry) {
      if (Number.isFinite(entry[1]) && entry[1] >= 1 && entry[1] <= 3) rounds[entry[0]] = entry[1];else issues++;
    });
    ['time', 'sort', 'match', 'art', 'find', 'all', 'map', 'reason', 'calc', 'chart', 'compare', 'comprehensive', 'experiment', 'structure', 'concept', 'phenomenon'].forEach(function (m) {
      if (!rounds[m]) rounds[m] = 1;
    });
    if (Array.isArray(data.stats)) stats = data.stats.filter(function (x) {
      if (!obj(x)) {
        issues++;
        return false;
      }
      return true;
    });
    if (obj(data.sessions)) Object.entries(data.sessions).forEach(function (entry) {
      var s = entry[1],
        good = obj(s) && Array.isArray(s.questions) && s.questions.length && s.questions.every(function (q) {
          return obj(q) && validQuestion({
            id: 'legacy',
            raw: q,
            cardIds: [],
            type: q.options ? 'choice' : q.items ? 'sort' : q.left ? 'match' : typeof q.answer === 'boolean' ? 'judge' : 'open'
          });
        }) && Number.isInteger(s.current) && s.current >= 0 && s.current < s.questions.length && Array.isArray(s.results);
      if (good) {
        var q = s.questions[s.current];
        if (q.items && (!obj(s.sortState) || !Array.isArray(s.sortState.userOrder))) good = false;
        if (q.left && (!obj(s.matchState) || !Array.isArray(s.matchState.matchedLeft) || !Array.isArray(s.matchState.matchedRight))) good = false;
      }
      if (good) sessions[entry[0]] = s;else issues++;
    });
    return {
      data: Object.assign({}, data, {
        rounds: rounds,
        stats: stats,
        sessions: sessions
      }),
      issues: issues
    };
  }
  function legacyHTML(x) {
    if (typeof x === 'string') return x.replaceAll('<', '&lt;').replaceAll('>', '&gt;');
    if (Array.isArray(x)) return x.map(legacyHTML);
    if (obj(x)) {
      var out = {};
      Object.keys(x).forEach(function (k) {
        if (!['__proto__', 'constructor', 'prototype'].includes(k)) out[k] = legacyHTML(x[k]);
      });
      return out;
    }
    return x;
  }
  G.Storage = {
    normalizeLegacy: normalizeLegacy,
    legacyHTML: legacyHTML,
    create: function (storage) {
      var state = blank(),
        error = null,
        warning = null,
        identities = Object.create(null);
      try {
        var raw = storage.getItem(KEY);
        if (raw) {
          var parsed = safeParse(raw);
          if (valid(parsed)) state = parsed;else {
            state.legacyBackup[KEY] = raw;
            warning = '已有记录格式异常，已保留原始备份';
          }
        }
      } catch (e) {
        error = '本次记录暂未保存';
      }
      function save(s) {
        state = s;
        try {
          storage.setItem(KEY, JSON.stringify(s));
          error = null;
          return {
            ok: true
          };
        } catch (e) {
          error = '本次记录暂未保存';
          return {
            ok: false,
            error: error
          };
        }
      }
      var store = {
        load: function () {
          return state;
        },
        save: save,
        error: function () {
          return error || warning;
        },
        migrateLegacy: function () {
          try {
            var changed = !state.migration.legacyV1;
            LEGACY.forEach(function (key) {
              var raw = storage.getItem(key);
              if (raw !== null && raw !== undefined && state.legacyBackup[key] !== raw) {
                if (Object.hasOwn(state.legacyBackup, key)) {
                  state.importBackups = state.importBackups || [];
                  state.importBackups.push({
                    kind: 'legacy',
                    key: key,
                    at: Date.now(),
                    raw: state.legacyBackup[key]
                  });
                }
                state.legacyBackup[key] = raw;
                changed = true;
              }
            });
            state.migration.legacyV1 = true;
            var result = changed ? save(state) : {
              ok: true
            };
            if (!result.ok) delete state.migration.legacyV1;
            return result;
          } catch (e) {
            error = '本次记录暂未保存';
            return {
              ok: false,
              error: error
            };
          }
        },
        exportJSON: function () {
          store.migrateLegacy();
          return JSON.stringify(state, null, 2);
        },
        importJSON: function (text) {
          try {
            if (text.length > 15000000) throw Error('文件过大');
            var incoming = JSON.parse(text);
            if (!valid(incoming)) throw Error('记录格式或版本不支持');
            var next = clone(state),
              conflicts = 0;
            next.importBackups = next.importBackups || [];
            Object.entries(incoming.readCards).forEach(function (entry) {
              if (Number.isFinite(entry[1])) next.readCards[entry[0]] = Math.max(next.readCards[entry[0]] || 0, entry[1]);
            });
            Object.entries(incoming.sessions).forEach(function (entry) {
              var existing = next.sessions[entry[0]];
              if (existing && JSON.stringify(existing) !== JSON.stringify(entry[1])) conflicts++;
              if (!existing || (entry[1].updatedAt || 0) > (existing.updatedAt || 0)) next.sessions[entry[0]] = entry[1];
            });
            var ids = new Set(next.events.map(function (e) {
              return e.id;
            }));
            incoming.events.forEach(function (e) {
              if (!ids.has(e.id)) {
                next.events.push(e);
                ids.add(e.id);
              } else if (JSON.stringify(next.events.find(function (x) {
                return x.id === e.id;
              })) !== JSON.stringify(e)) conflicts++;
            });
            Object.entries(incoming.legacyBackup).forEach(function (entry) {
              if (!Object.hasOwn(next.legacyBackup, entry[0])) next.legacyBackup[entry[0]] = entry[1];else if (next.legacyBackup[entry[0]] !== entry[1]) conflicts++;
            });
            if (conflicts) {
              var snapshot = clone(incoming);
              snapshot.importBackups = [];
              var signature = JSON.stringify(snapshot);
              if (!next.importBackups.some(function (b) {
                return b.data && JSON.stringify(b.data) === signature;
              })) next.importBackups.push({
                at: Date.now(),
                data: snapshot
              });
            }
            if (incoming.lastActivity && (!next.lastActivity || incoming.lastActivity.at > next.lastActivity.at)) next.lastActivity = incoming.lastActivity;
            var result = save(next);
            return {
              ok: result.ok,
              conflicts: conflicts,
              error: result.error
            };
          } catch (e) {
            return {
              ok: false,
              error: '导入失败：' + e.message
            };
          }
        },
        wrongStatus: function (id) {
          id = identities[id] || id;
          var bySession = new Set(),
            streak = 0,
            seen = false;
          state.events.filter(function (e) {
            return e.questionId === id;
          }).sort(function (a, b) {
            return a.at - b.at;
          }).forEach(function (e) {
            if (bySession.has(e.sessionId)) return;
            bySession.add(e.sessionId);
            seen = true;
            streak = e.firstCorrect ? streak + 1 : 0;
          });
          return seen ? streak >= 2 ? 'consolidated' : 'pending' : 'historical';
        },
        legacy: function (key) {
          if (!state.legacyBackup[key]) return null;
          var result = normalizeLegacy(key, state.legacyBackup[key]);
          if (result.issues) warning = '部分历史记录格式异常，原始数据已保留在导出备份中';
          return result.data;
        },
        restoreLegacy: function () {
          try {
            var restored = 0;
            LEGACY.forEach(function (key) {
              if (storage.getItem(key) !== null || !state.legacyBackup[key]) return;
              var normalized = normalizeLegacy(key, state.legacyBackup[key]);
              if (normalized.issues) warning = '部分历史记录格式异常，原始数据已保留在导出备份中';
              if (normalized.data) {
                storage.setItem(key, JSON.stringify(normalized.data));
                restored++;
              }
            });
            return {
              ok: true,
              restored: restored
            };
          } catch (e) {
            error = '旧专项记录暂未恢复，可导出备份后重试';
            return {
              ok: false,
              error: error
            };
          }
        },
        normalizeIdentities: function (content) {
          var changed = false;
          Object.values(content || {}).forEach(function (subject) {
            subject.questions.forEach(function (q) {
              identities[q.id] = q.canonicalId || q.id;
            });
          });
          Object.values(state.sessions).forEach(function (s) {
            s.questions.forEach(function (q) {
              if (identities[q.id] && q.canonicalId !== identities[q.id]) {
                q.canonicalId = identities[q.id];
                changed = true;
              }
            });
          });
          var ids = new Set();
          state.events = state.events.filter(function (e) {
            var session = state.sessions[e.sessionId];
            if (session && ['mock', 'unitMock'].includes(session.kind) && session.status !== 'complete') {
              changed = true;
              return false;
            }
            var id = identities[e.questionId] || e.questionId,
              eventId = e.sessionId + ':' + id;
            if (id !== e.questionId || e.id !== eventId) {
              e.questionId = id;
              e.id = eventId;
              changed = true;
            }
            if (ids.has(e.id)) {
              changed = true;
              return false;
            }
            ids.add(e.id);
            return true;
          });
          if (changed) save(state);
          return {
            ok: true,
            changed: changed
          };
        }
      };
      return store;
    }
  };
})(window.Grade7 = window.Grade7 || {});
