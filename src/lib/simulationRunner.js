// Bộ kiểm thử cho Job Simulation. Test chạy trong Web Worker cô lập, giới hạn 5 giây.

const TASK1_SUITE = `[
  { name: "Có hàm total()", visible: true, run: function (m) { return typeof m.total === "function" ? true : "Không tìm thấy hàm total"; } },
  { name: "Đơn cơ bản: 2 × 100.000 = 200.000", visible: true, run: function (m) { var got = m.total([{ price: 100000, qty: 2 }], [], 0); return Math.abs(got - 200000) < 0.01 ? true : "Kỳ vọng 200000, nhận " + got; } },
  { name: "Đơn rỗng trả về 0", visible: true, run: function (m) { var got = m.total([], [], 0); return got === 0 ? true : "Kỳ vọng 0, nhận " + got; } },
  { name: "Một voucher 10%", visible: true, run: function (m) { var got = m.total([{ price: 100000, qty: 1 }], [0.1], 0); return Math.abs(got - 90000) < 0.01 ? true : "Kỳ vọng 90000, nhận " + got; } },
  { name: "Hai voucher cộng dồn (10% + 20%)", visible: false, run: function (m) { var got = m.total([{ price: 100000, qty: 1 }], [0.1, 0.2], 0); return Math.abs(got - 70000) < 0.01 ? true : "Kỳ vọng 70000, nhận " + got; } },
  { name: "Thuế tính trên giá sau giảm", visible: false, run: function (m) { var got = m.total([{ price: 100000, qty: 1 }], [0.1], 0.1); return Math.abs(got - 99000) < 0.01 ? true : "Kỳ vọng 99000, nhận " + got; } },
  { name: "Làm tròn 2 chữ số thập phân", visible: false, run: function (m) { var got = m.total([{ price: 33333.33, qty: 3 }], [0.15], 0); return Math.abs(got - 84999.99) < 0.01 ? true : "Kỳ vọng 84999.99, nhận " + got; } },
  { name: "Tổng voucher tối đa 100%", visible: false, run: function (m) { var got = m.total([{ price: 50000, qty: 2 }], [0.8, 0.8], 0); return Math.abs(got - 0) < 0.01 ? true : "Kỳ vọng 0, nhận " + got; } }
]`;

const TASK2_SUITE = `[
  { name: "Có hàm createRateLimiter()", visible: true, run: function (m) { return typeof m.createRateLimiter === "function" ? true : "Không tìm thấy hàm createRateLimiter"; } },
  { name: "Limit 3: 3 lần đầu được phép", visible: true, run: function (m) { var allow = m.createRateLimiter({ limit: 3, windowMs: 1000 }); var a = allow("a", 0), b = allow("a", 100), c = allow("a", 200); return a && b && c ? true : "Ba lần đầu phải trả về true"; } },
  { name: "Limit 3: lần thứ 4 bị chặn", visible: true, run: function (m) { var allow = m.createRateLimiter({ limit: 3, windowMs: 1000 }); allow("a", 0); allow("a", 100); allow("a", 200); return allow("a", 300) === false ? true : "Lần thứ 4 phải trả về false"; } },
  { name: "Mở lại sau windowMs", visible: false, run: function (m) { var allow = m.createRateLimiter({ limit: 2, windowMs: 1000 }); allow("a", 0); allow("a", 10); var blocked = allow("a", 500); var reopened = allow("a", 1200); return blocked === false && reopened === true ? true : "Sau 1000ms phải được phép lại"; } },
  { name: "Mỗi key có bộ đếm riêng", visible: false, run: function (m) { var allow = m.createRateLimiter({ limit: 1, windowMs: 1000 }); allow("a", 0); return allow("b", 10) === true ? true : "Key khác phải có lượt riêng"; } },
  { name: "Limit = 1 hoạt động đúng", visible: false, run: function (m) { var allow = m.createRateLimiter({ limit: 1, windowMs: 5000 }); var first = allow("x", 0); var second = allow("x", 5); return first === true && second === false ? true : "Limit 1 phải chặn ngay lần thứ 2"; } },
  { name: "Không truyền now không lỗi", visible: false, run: function (m) { var allow = m.createRateLimiter({ limit: 2, windowMs: 1000 }); allow("z"); allow("z"); return allow("z") === false ? true : "Phải dùng Date.now() khi không truyền now"; } }
]`;

export const TEST_SUITES = { task1: TASK1_SUITE, task2: TASK2_SUITE };

function workerSource(suite) {
  return `
self.onmessage = function (e) {
  var code = e.data.code || "";
  var TESTS = ${suite};
  var results = [];
  var mod;
  try {
    var factory = new Function(code + "\\n;return { total: typeof total !== 'undefined' ? total : undefined, createRateLimiter: typeof createRateLimiter !== 'undefined' ? createRateLimiter : undefined };");
    mod = factory();
  } catch (err) {
    self.postMessage({ error: "Code chưa chạy được: " + (err && err.message ? err.message : err), results: [] });
    return;
  }
  for (var i = 0; i < TESTS.length; i++) {
    var t = TESTS[i];
    try {
      var out = t.run(mod);
      results.push({ name: t.name, visible: !!t.visible, pass: out === true, message: out === true ? "" : String(out) });
    } catch (err) {
      results.push({ name: t.name, visible: !!t.visible, pass: false, message: err && err.message ? err.message : String(err) });
    }
  }
  self.postMessage({ results: results });
};
`;
}

export function runTests(taskId, code) {
  return new Promise((resolve) => {
    const suite = TEST_SUITES[taskId];
    if (!suite) {
      resolve({ results: [] });
      return;
    }
    let worker;
    let url;
    try {
      url = URL.createObjectURL(new Blob([workerSource(suite)], { type: "application/javascript" }));
      worker = new Worker(url);
    } catch (e) {
      resolve({ error: "Trình duyệt không hỗ trợ chạy test trong sandbox.", results: [] });
      return;
    }

    const done = (payload) => {
      clearTimeout(timer);
      try { worker.terminate(); } catch (e) {}
      try { URL.revokeObjectURL(url); } catch (e) {}
      resolve(payload);
    };

    const timer = setTimeout(() => done({ error: "Quá 5 giây — có thể có vòng lặp vô hạn trong code.", results: [] }), 5000);
    worker.onmessage = (e) => done(e.data || { results: [] });
    worker.onerror = (e) => done({ error: e.message || "Lỗi khi chạy test.", results: [] });
    worker.postMessage({ code });
  });
}

export function summarize(results) {
  const list = Array.isArray(results) ? results : [];
  return { passed: list.filter((r) => r.pass).length, total: list.length };
}