(function (G) {
  function permutation(a, n) {
    return Array.isArray(a) && a.length === n && new Set(a).size === n && a.every(function (x) {
      return Number.isInteger(x) && x >= 0 && x < n;
    });
  }
  function complete(q, a) {
    var r = q.raw;
    if (q.type === 'choice') return Number.isInteger(a) && a >= 0 && a < r.options.length;
    if (q.type === 'judge') return typeof a === 'boolean';
    if (q.type === 'sort') return permutation(a, r.items.length);
    if (q.type === 'match') return permutation(a, r.left.length) && r.left.length === r.right.length;
    return false;
  }
  G.Questions = {
    initialAnswer: function (q) {
      if (q.type === 'sort') return q.raw.items.map(function (_, i) {
        return i;
      }).reverse();
      if (q.type === 'match') return q.raw.left.map(function () {
        return null;
      });
      return null;
    },
    isComplete: complete,
    grade: function (q, a) {
      if (q.type === 'open') return {
        gradable: false,
        correct: false
      };
      if (!complete(q, a)) return {
        gradable: true,
        correct: false
      };
      var expected = q.type === 'sort' ? q.raw.order : q.type === 'match' ? q.raw.pairs : q.raw.answer;
      return {
        gradable: true,
        correct: JSON.stringify(a) === JSON.stringify(expected)
      };
    },
    answerText: function (q) {
      var r = q.raw;
      if (q.type === 'choice') return r.options[r.answer];
      if (q.type === 'judge') return r.answer ? '正确' : '错误';
      if (q.type === 'sort') return r.order.map(function (i) {
        return r.items[i];
      }).join(' → ');
      if (q.type === 'match') return r.left.map(function (x, i) {
        return x + ' → ' + r.right[r.pairs[i]];
      }).join('；');
      return r.answer || r.reference || r.explain || '请结合知识卡自我检查';
    }
  };
})(window.Grade7 = window.Grade7 || {});
