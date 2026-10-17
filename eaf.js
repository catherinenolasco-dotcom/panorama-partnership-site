/* Sample Employee Action Form: a self-contained demo. Nothing is sent or stored. */
(function () {
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  var APPR = {
    m: ["Manager", "The requesting manager"],
    l2: ["Second-level manager", "One level up"],
    hr: ["HR or HRBP", "Judgment and policy"],
    fin: ["Finance", "Comp-related changes only"],
    exec: ["Executive team", "Out-of-cycle pay changes"],
    legal: ["Legal review", "Involuntary changes only"]
  };
  var M = "m", L2 = "l2", HR = "hr", FIN = "fin", EXEC = "exec", LEG = "legal";
  var TYPES = [
    { id: "pay", grp: "Compensation", name: "Pay rate change", comp: true, ap: [M, L2, HR, FIN, EXEC], cur: "Current pay rate", nw: "New pay rate", ph: ["$40.00 per hour", "$44.00 per hour"] },
    { id: "bonus", grp: "Compensation", name: "Bonus or one-time payment", comp: true, ap: [M, L2, HR, FIN, EXEC], cur: "Payment type", nw: "Amount", ph: ["Spot bonus", "$1,000"] },
    { id: "promo", grp: "Compensation", name: "Promotion (title and pay)", comp: true, ap: [M, L2, HR, FIN, EXEC], cur: "Current title and pay", nw: "New title and pay", ph: ["Analyst, $70,000", "Senior Analyst, $82,000"] },
    { id: "title", grp: "Job", name: "Title change, no pay change", ap: [M, HR], cur: "Current title", nw: "New title", ph: ["Coordinator", "Specialist"] },
    { id: "transfer", grp: "Job", name: "Department or team transfer", ap: [M, L2, HR], cur: "Current team", nw: "New team", ph: ["Support", "Operations"] },
    { id: "mgr", grp: "Job", name: "Manager change", ap: [M, HR], cur: "Current manager", nw: "New manager", ph: ["Manager A", "Manager B"] },
    { id: "loc", grp: "Job", name: "Work location change", ap: [M, HR], cur: "Current location", nw: "New location", ph: ["California", "Texas"], note: "A new location can change tax withholding, so Payroll checks it at the end." },
    { id: "ftpt", grp: "Status", name: "Full-time to part-time, or back", comp: true, ap: [M, L2, HR, FIN], cur: "Current status", nw: "New status", ph: ["Full-time, 40 hours", "Part-time, 24 hours"], note: "Hours can change pay and benefits eligibility." },
    { id: "loa", grp: "Leave", name: "Leave of absence starts", ap: [M, HR], cur: "Current status", nw: "New status", ph: ["Active", "On leave"] },
    { id: "rtw", grp: "Leave", name: "Return from leave", ap: [M, HR], cur: "Current status", nw: "New status", ph: ["On leave", "Active"] },
    { id: "resign", grp: "Separation", name: "Resignation", ap: [M, HR], cur: "Current status", nw: "Last day of work", ph: ["Active", "Last day of the month"] },
    { id: "term", grp: "Separation", name: "Involuntary termination", ap: [M, L2, HR, LEG], cur: "Current status", nw: "Last day of work", ph: ["Active", "End of day, effective date"], note: "Legal reviews before it is signed. Final pay and access timing follow." }
  ];
  var REASONS = ["Annual review or merit", "Promotion", "Market adjustment", "Correction of an error", "Change in role or scope", "Reorganization", "Performance", "Employee request", "Leave or return", "Resignation", "Other"];
  var CHECKS = ["The change in Rippling matches the signed form", "The effective date falls in the right pay period", "Validation rule passed, nothing unusual in the amount"];
  var STAGES = ["Complete the form", "Approvals by Slack", "Change in Rippling", "Payroll signs off", "Logged"];

  var S;
  function fresh() { return { stage: 0, f: { name: "", type: "", eff: "", cur: "", nw: "", rcat: "", rtxt: "" }, err: "", ap: {}, signing: null, sgn: { ok: false, name: "", sig: false }, rip: null, pay: { c: [false, false, false], name: "" }, log: [], n: 1 }; }
  S = fresh();
  function T() { for (var i = 0; i < TYPES.length; i++) if (TYPES[i].id === S.f.type) return TYPES[i]; return null; }
  function now() { var d = new Date(); return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + ", " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }); }
  function log(t) { S.log.push([now(), t]); }
  function eafId() { return "EAF-" + ("000" + S.n).slice(-4); }
  function fmtDate(v) { if (!v) return ""; var p = v.split("-"); if (p.length !== 3) return v; var d = new Date(+p[0], +p[1] - 1, +p[2]); return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }); }

  function css() {
    if (document.getElementById("eaf-css")) return;
    var st = document.createElement("style"); st.id = "eaf-css";
    st.textContent = ".eaf-note{background:#17301D;border:1px solid #2F6B3D;border-radius:12px;padding:12px 14px;font-size:14px;line-height:1.5;margin:14px 0}" +
      ".eaf-stages{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin:14px 0 18px}" +
      ".eaf-st{background:#23232d;border:1px solid #34343f;border-radius:10px;padding:8px 8px;font-size:12px;line-height:1.3;color:#9a9aa6}" +
      ".eaf-st b{display:block;font:700 11px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.06em;margin-bottom:2px}" +
      ".eaf-st.on{border-color:#5FCB73;color:#fff;background:#17301D}.eaf-st.done{border-color:#2FD07A;color:#cfeedd}" +
      ".eaf-grp{font:500 12px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;color:#9a9aa6;margin:14px 0 6px}" +
      ".eaf-picks{display:flex;flex-wrap:wrap;gap:8px}" +
      ".eaf-pick{background:#23232d;border:1px solid #34343f;border-radius:10px;padding:10px 14px;color:#ECECEC;font-size:14px;font-weight:600;min-height:44px;cursor:pointer;text-align:left}" +
      ".eaf-pick:hover{border-color:#5FCB73}.eaf-pick.on{background:#5FCB73;border-color:#5FCB73;color:#191919}" +
      ".eaf-pick small{display:block;font-weight:500;font-size:11px;opacity:.75}" +
      ".eaf-fld{display:block;margin:12px 0 0}.eaf-fld span{display:block;font-size:13px;font-weight:600;margin-bottom:5px;color:#e8e8f0}" +
      ".eaf-fld input,.eaf-fld select,.eaf-fld textarea{width:100%;box-sizing:border-box;background:#23232d;border:1px solid #4b4b5c;border-radius:10px;color:#fff;font:16px Nunito Sans,Inter,sans-serif;padding:11px 12px;min-height:46px}" +
      ".eaf-fld textarea{min-height:90px;resize:vertical}.eaf-fld input:focus,.eaf-fld select:focus,.eaf-fld textarea:focus{outline:3px solid #5FCB73;outline-offset:1px}" +
      ".eaf-two{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media(max-width:640px){.eaf-two{grid-template-columns:1fr}.eaf-stages{grid-template-columns:1fr 1fr}}" +
      ".eaf-err{color:#ffb3c8;background:#2a1d22;border:1px solid #FF5B8A;border-radius:10px;padding:10px 12px;margin-top:12px;font-size:14px}" +
      ".eaf-ap{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 0}.eaf-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid #2F6B3D;background:#17301D;border-radius:100px;padding:5px 12px;font-size:13px;font-weight:600}" +
      ".eaf-chip.last{border-color:#FF4F00;background:#2b1a10}" +
      ".eaf-paper{background:#F8F4E9;color:#191919;border-radius:12px;padding:20px;margin-top:14px}" +
      ".eaf-paper h3{margin:0 0 2px;font:500 20px 'Platypi',Georgia,serif;color:#191919}.eaf-paper .sub2{color:#5b5b5b;font-size:13px;margin:0 0 12px}" +
      ".eaf-paper table{width:100%;border-collapse:collapse;font-size:14px}.eaf-paper td{padding:7px 0;border-bottom:1px solid #d9d5c8;vertical-align:top}.eaf-paper td:first-child{width:38%;color:#5b5b5b;font-weight:600;padding-right:10px}" +
      ".eaf-sigs{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-top:14px}" +
      ".eaf-sig{border-bottom:2px solid #191919;min-height:64px;display:flex;align-items:flex-end;padding-bottom:4px}.eaf-sig img{max-height:56px;max-width:100%}" +
      ".eaf-sigl{font-size:12px;color:#5b5b5b;margin-top:4px;line-height:1.35}.eaf-wait{color:#9a8f6a;font-size:13px;font-style:italic}" +
      ".eaf-slack{background:#1a1d21;color:#d1d2d3;border:1px solid #34373b;border-radius:12px;padding:12px 14px;font-size:14px;line-height:1.5}" +
      ".eaf-slack .who{font-weight:800;color:#fff}.eaf-slack .app{background:#3a3d42;border-radius:4px;font-size:10px;padding:1px 5px;margin-left:6px;color:#b9bbbe}" +
      ".eaf-slack .rowq{border-left:4px solid #5FCB73;padding-left:10px;margin:8px 0}" +
      ".eaf-badge{display:inline-block;font-size:11px;font-weight:700;border-radius:100px;padding:2px 9px;margin-left:8px}" +
      ".eaf-badge.p{background:#3a3300;color:#FFC93C}.eaf-badge.s{background:#12351f;color:#2FD07A}.eaf-badge.d{background:#3a1522;color:#FF8AA8}" +
      ".eaf-modal{position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.7);display:flex;align-items:flex-end;justify-content:center;overflow:auto}" +
      ".eaf-sheet{background:#1d1d26;border:1px solid #34343f;border-radius:18px 18px 0 0;width:100%;max-width:520px;padding:18px 18px 24px;margin-top:auto;max-height:100vh;overflow:auto}" +
      "@media(min-width:700px){.eaf-modal{align-items:center}.eaf-sheet{border-radius:18px;margin:20px}}" +
      ".eaf-canvas{display:block;width:100%;height:150px;background:#fff;border-radius:10px;touch-action:none;cursor:crosshair}" +
      ".eaf-chk{display:flex;gap:10px;align-items:flex-start;margin:10px 0;font-size:15px;line-height:1.4}.eaf-chk input{width:22px;height:22px;flex:none;margin-top:1px;accent-color:#5FCB73}" +
      ".eaf-log .risk{font-size:14px}" +
      ".eaf-rules{width:100%;border-collapse:collapse;font-size:13.5px}.eaf-rules th,.eaf-rules td{padding:9px 8px;border-bottom:1px solid #34343f;text-align:center}.eaf-rules th{font:500 11px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.05em;text-transform:uppercase;color:#9a9aa6}.eaf-rules td:first-child,.eaf-rules th:first-child{text-align:left}.eaf-dot{display:inline-block;width:14px;height:14px;border-radius:50%;background:#5FCB73}";
    document.head.appendChild(st);
  }

  /* ---------- pieces ---------- */
  function stagesHtml() {
    return '<div class="eaf-stages">' + STAGES.map(function (s, i) {
      var c = i < S.stage ? " done" : i === S.stage ? " on" : "";
      return '<div class="eaf-st' + c + '"><b>' + (i < S.stage ? "DONE" : "STEP " + (i + 1)) + "</b>" + esc(s) + "</div>";
    }).join("") + "</div>";
  }
  function apChips(t) {
    return '<div class="eaf-ap">' + t.ap.map(function (a) { return '<span class="eaf-chip">' + esc(APPR[a][0]) + "</span>"; }).join("") + '<span class="eaf-chip last">Payroll signs off last</span></div>';
  }
  function formHtml() {
    var t = T(), groups = [], seen = {};
    TYPES.forEach(function (x) { if (!seen[x.grp]) { seen[x.grp] = 1; groups.push(x.grp); } });
    var picker = groups.map(function (g) {
      return '<div class="eaf-grp">' + esc(g) + '</div><div class="eaf-picks">' + TYPES.filter(function (x) { return x.grp === g; }).map(function (x) {
        return '<button type="button" class="eaf-pick' + (S.f.type === x.id ? " on" : "") + '" data-act="eaf-type" data-v="' + x.id + '" aria-pressed="' + (S.f.type === x.id) + '">' + esc(x.name) + (x.comp ? "<small>Comp-related</small>" : "") + "</button>";
      }).join("") + "</div>";
    }).join("");
    var fields = "";
    if (t) {
      fields = '<div class="eaf-grp">Approvals required for this change</div>' + apChips(t) + (t.note ? '<p class="abcap">' + esc(t.note) + "</p>" : "") +
        '<div class="eaf-two"><label class="eaf-fld"><span>' + esc(t.cur) + '</span><input data-eaf="cur" value="' + esc(S.f.cur) + '" placeholder="' + esc(t.ph[0]) + '" autocomplete="off"></label>' +
        '<label class="eaf-fld"><span>' + esc(t.nw) + '</span><input data-eaf="nw" value="' + esc(S.f.nw) + '" placeholder="' + esc(t.ph[1]) + '" autocomplete="off"></label></div>' +
        '<div class="eaf-two"><label class="eaf-fld"><span>Effective date</span><input type="date" data-eaf="eff" value="' + esc(S.f.eff) + '"></label>' +
        '<label class="eaf-fld"><span>Reason for change</span><select data-eaf="rcat"><option value="">Choose a reason</option>' + REASONS.map(function (r) { return '<option' + (S.f.rcat === r ? " selected" : "") + ">" + esc(r) + "</option>"; }).join("") + "</select></label></div>" +
        '<label class="eaf-fld"><span>Explain the reason</span><textarea data-eaf="rtxt" placeholder="A sentence or two the approvers can sign against">' + esc(S.f.rtxt) + "</textarea></label>";
    }
    return '<div class="panel" style="margin-top:0"><div class="eaf-grp" style="margin-top:0">1. Employee</div>' +
      '<label class="eaf-fld" style="margin-top:0"><span>Employee name (sample data only)</span><input data-eaf="name" value="' + esc(S.f.name) + '" placeholder="Sample Employee" autocomplete="off"></label>' +
      '<div class="eaf-grp">2. What is changing</div>' + picker + fields +
      (S.err ? '<div class="eaf-err" role="alert">' + esc(S.err) + "</div>" : "") +
      '<div class="toolrow" style="margin-top:16px"><button type="button" class="btn primary" data-act="eaf-submit">Send for approval</button><button type="button" class="btn" data-act="eaf-sample">Fill with sample data</button></div></div>';
  }
  function docHtml() {
    var t = T(), f = S.f;
    var sigs = t.ap.map(function (a) {
      var s = S.ap[a];
      return '<div><div class="eaf-sig">' + (s && s.status === "signed" ? (s.sig ? '<img src="' + s.sig + '" alt="Signature of ' + esc(s.name) + '">' : '<span style="font:italic 700 22px Georgia,serif">' + esc(s.name) + "</span>") : '<span class="eaf-wait">' + (s && s.status === "declined" ? "Declined" : "Awaiting signature") + "</span>") + '</div><div class="eaf-sigl"><b>' + esc(APPR[a][0]) + "</b>" + (s && s.status === "signed" ? "<br>" + esc(s.name) + ", " + esc(s.at) : "") + "</div></div>";
    }).join("");
    var tail = '<div><div class="eaf-sig">' + (S.rip && S.rip.done ? '<span style="font-weight:700">Made in Rippling</span>' : '<span class="eaf-wait">Not yet made</span>') + '</div><div class="eaf-sigl"><b>People Ops</b>' + (S.rip && S.rip.done ? "<br>" + esc(S.rip.at) : "") + '</div></div>' +
      '<div><div class="eaf-sig">' + (S.stage >= 4 ? '<span style="font:italic 700 22px Georgia,serif">' + esc(S.pay.name) + "</span>" : '<span class="eaf-wait">Awaiting final sign-off</span>') + '</div><div class="eaf-sigl"><b>Payroll, final</b>' + (S.stage >= 4 ? "<br>" + esc(S.payAt) : "") + "</div></div>";
    return '<div class="eaf-paper"><h3>Employee Action Form</h3><p class="sub2">' + eafId() + " &middot; Sample, not a real record</p><table>" +
      "<tr><td>Employee</td><td>" + esc(f.name) + "</td></tr><tr><td>Change</td><td>" + esc(t.name) + (t.comp ? " (comp-related)" : "") + "</td></tr>" +
      "<tr><td>" + esc(t.cur) + " to " + esc(t.nw.toLowerCase()) + "</td><td>" + esc(f.cur) + " &rarr; " + esc(f.nw) + "</td></tr>" +
      "<tr><td>Effective date</td><td>" + esc(fmtDate(f.eff)) + "</td></tr><tr><td>Reason</td><td>" + esc(f.rcat) + ": " + esc(f.rtxt) + "</td></tr></table>" +
      '<div class="eaf-sigs">' + sigs + tail + "</div></div>";
  }
  function slackMsg(a) {
    var t = T(), f = S.f;
    return '<div class="eaf-slack"><span class="who">Approvals bot</span><span class="app">APP</span> <span style="color:#9a9aa6;font-size:12px">now</span>' +
      '<div style="margin-top:4px"><b>' + eafId() + ": " + esc(t.name) + " needs your approval as " + esc(APPR[a][0]) + "</b></div>" +
      '<div class="rowq">Employee: ' + esc(f.name) + "<br>Effective: " + esc(fmtDate(f.eff)) + "<br>Change: " + esc(f.cur) + " &rarr; " + esc(f.nw) + "<br>Reason: " + esc(f.rcat) + "</div></div>";
  }
  function approvalsHtml() {
    var t = T();
    var cards = t.ap.map(function (a) {
      var s = S.ap[a] || { status: "pending" };
      var b = s.status === "signed" ? '<span class="eaf-badge s">Signed</span>' : s.status === "declined" ? '<span class="eaf-badge d">Declined</span>' : '<span class="eaf-badge p">Waiting</span>';
      return '<div class="panel" style="margin-top:12px"><div style="display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:10px"><b style="font-size:16px">' + esc(APPR[a][0]) + "</b>" + b + '<span style="color:var(--muted);font-size:13px;margin-left:4px">' + esc(APPR[a][1]) + "</span></div>" + slackMsg(a) +
        (s.status === "pending" ? '<div class="toolrow" style="margin-top:10px"><button type="button" class="btn primary" data-act="eaf-open" data-v="' + a + '">Open the link to review and sign</button></div><p class="abcap">On a phone, this link opens the document to sign with a finger. On a laptop, it works with a mouse or trackpad.</p>' : "") + "</div>";
    }).join("");
    return '<h2 style="margin-top:22px">Step 2. Approvals by Slack</h2><p class="sub">Every approver gets the request at the same moment, in parallel. Open each link to sign as that approver.</p>' + cards +
      '<div class="toolrow" style="margin-top:12px"><button type="button" class="btn" data-act="eaf-all">Demo shortcut: approve everyone</button></div>';
  }
  function ripHtml() {
    var t = T(), f = S.f;
    var done = S.rip && S.rip.done;
    return '<h2 style="margin-top:22px">Step 3. Make the change in Rippling</h2><p class="sub">With every signature in, People Ops makes the change in the HRIS. Later, Rippling&rsquo;s approvals feature can carry steps 2 and 3 together.</p>' +
      '<div class="panel" style="margin-top:12px">' + [["Employee", f.name], ["Field", t.name], ["Before", f.cur], ["After", f.nw], ["Effective", fmtDate(f.eff)]].map(function (r) { return '<div class="risk"><b>' + esc(r[0]) + "</b><span>" + esc(r[1]) + "</span></div>"; }).join("") +
      (done ? '<p style="margin:12px 0 0;color:#2FD07A;font-weight:700">Change made in Rippling, ' + esc(S.rip.at) + "</p>" : '<div class="toolrow" style="margin-top:12px"><button type="button" class="btn primary" data-act="eaf-rip">Mark the change as made in Rippling</button></div>') + "</div>";
  }
  function payHtml() {
    var chk = CHECKS.map(function (c, i) { return '<label class="eaf-chk"><input type="checkbox" data-eafchk="' + i + '"' + (S.pay.c[i] ? " checked" : "") + "><span>" + esc(c) + "</span></label>"; }).join("");
    return '<h2 style="margin-top:22px">Step 4. Payroll signs off last</h2><p class="sub">Payroll compares Rippling to the signed form before anything reaches a paycheck.</p>' +
      '<div class="panel" style="margin-top:12px">' + chk + '<label class="eaf-fld"><span>Type your name to sign off</span><input data-eaf-pay="name" value="' + esc(S.pay.name) + '" placeholder="Payroll, sample name" autocomplete="off"></label>' +
      (S.err ? '<div class="eaf-err" role="alert">' + esc(S.err) + "</div>" : "") +
      '<div class="toolrow" style="margin-top:14px"><button type="button" class="btn primary" data-act="eaf-pay">Sign off as Payroll</button><button type="button" class="btn" data-act="eaf-flag">Flag a mismatch</button></div></div>';
  }
  function doneHtml() {
    return '<div class="eaf-note" style="border-color:#2FD07A;background:#10231a"><b>Complete.</b> The change is signed, made in Rippling and signed off by Payroll. In the real flow the signed document and this audit trail go to the shared tracker and a restricted Slack log.</div>' +
      '<div class="toolrow"><button type="button" class="btn primary" data-act="eaf-reset">Start another sample</button></div>';
  }
  function logHtml() {
    if (!S.log.length) return "";
    return '<h2 style="margin-top:22px">Audit trail</h2><div class="wfwrap eaf-log" style="padding:4px 16px;color:#e8e8f0">' + S.log.map(function (l) { return '<div class="risk"><b>' + esc(l[0]) + "</b><span>" + esc(l[1]) + "</span></div>"; }).join("") + "</div>";
  }
  function modalHtml() {
    var a = S.signing; if (!a) return "";
    var t = T(), f = S.f;
    return '<div class="eaf-modal" role="dialog" aria-modal="true" aria-label="Review and sign"><div class="eaf-sheet">' +
      '<div class="eyebrow">Signing link, opened on a phone</div><h3 style="margin:4px 0 4px;font-size:20px">Sign as ' + esc(APPR[a][0]) + "</h3>" +
      '<div class="eaf-paper" style="margin-top:8px;padding:14px"><table><tr><td>Employee</td><td>' + esc(f.name) + "</td></tr><tr><td>Change</td><td>" + esc(t.name) + "</td></tr><tr><td>From, to</td><td>" + esc(f.cur) + " &rarr; " + esc(f.nw) + "</td></tr><tr><td>Effective</td><td>" + esc(fmtDate(f.eff)) + "</td></tr><tr><td>Reason</td><td>" + esc(f.rcat) + "</td></tr></table></div>" +
      '<label class="eaf-chk"><input type="checkbox" id="eaf-agree"' + (S.sgn.ok ? " checked" : "") + '><span>I have reviewed the details above and approve this change.</span></label>' +
      '<label class="eaf-fld" style="margin-top:4px"><span>Type your name</span><input id="eaf-signame" value="' + esc(S.sgn.name) + '" placeholder="Sample ' + esc(APPR[a][0]) + '" autocomplete="off"></label>' +
      '<div class="eaf-fld"><span>Sign with your finger or mouse</span><canvas id="eaf-canvas" class="eaf-canvas" aria-label="Signature pad"></canvas></div>' +
      (S.err ? '<div class="eaf-err" role="alert">' + esc(S.err) + "</div>" : "") +
      '<div class="toolrow" style="margin-top:14px"><button type="button" class="btn primary" data-act="eaf-sign">Sign and approve</button><button type="button" class="btn" data-act="eaf-clear">Clear</button><button type="button" class="btn" data-act="eaf-decline">Decline</button><button type="button" class="btn" data-act="eaf-close">Close</button></div></div></div>';
  }

  function body() {
    var o = stagesHtml();
    if (S.stage === 0) return o + '<div class="eaf-note">This is a working sample. Complete it and follow the request through every step. Use sample data only. Nothing on this page is sent or saved anywhere.</div>' + formHtml();
    o += '<div class="toolrow" style="margin:0"><button type="button" class="btn small" data-act="eaf-reset">Start over</button></div>' + docHtml();
    if (S.stage === 1) o += approvalsHtml();
    if (S.stage === 2) o += ripHtml();
    if (S.stage === 3) o += payHtml();
    if (S.stage === 4) o += doneHtml();
    return o + logHtml() + modalHtml();
  }

  /* ---------- canvas ---------- */
  function wireCanvas() {
    var c = document.getElementById("eaf-canvas"); if (!c) return;
    var r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    c.width = Math.max(10, r.width * dpr); c.height = Math.max(10, r.height * dpr);
    var g = c.getContext("2d"); g.scale(dpr, dpr); g.lineWidth = 2.4; g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = "#191919";
    var down = false;
    function pt(e) { var b = c.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; }
    c.addEventListener("pointerdown", function (e) { down = true; var p = pt(e); g.beginPath(); g.moveTo(p[0], p[1]); S.sgn.sig = true; try { c.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); });
    c.addEventListener("pointermove", function (e) { if (!down) return; var p = pt(e); g.lineTo(p[0], p[1]); g.stroke(); e.preventDefault(); });
    function up() { down = false; }
    c.addEventListener("pointerup", up); c.addEventListener("pointercancel", up); c.addEventListener("pointerleave", up);
    c._clear = function () { g.clearRect(0, 0, c.width, c.height); S.sgn.sig = false; };
  }
  function draw() {
    var r = document.getElementById("eafroot"); if (!r) return;
    r.innerHTML = body(); wireCanvas();
  }

  /* ---------- actions ---------- */
  function validate() {
    var f = S.f, t = T();
    if (!f.name.trim()) return "Enter an employee name. Use a sample name.";
    if (!t) return "Choose what is changing.";
    if (!f.cur.trim() || !f.nw.trim()) return "Fill in both the current and the new value.";
    if (!f.eff) return "Choose an effective date.";
    if (!f.rcat) return "Choose a reason for the change.";
    if (f.rtxt.trim().length < 10) return "Explain the reason in a sentence, so the approvers have something to sign against.";
    return "";
  }
  function allSigned() { var t = T(); return t.ap.every(function (a) { return S.ap[a] && S.ap[a].status === "signed"; }); }
  function afterSign() { if (allSigned()) { S.stage = 2; log("All approvals are in. Ready to make the change in Rippling."); } }
  function act(a, el) {
    var v = el.getAttribute("data-v"), t = T();
    if (a === "eaf-type") { S.f.type = v; S.f.cur = ""; S.f.nw = ""; S.err = ""; draw(); return; }
    if (a === "eaf-sample") {
      if (!S.f.type) S.f.type = "pay"; t = T();
      var d = new Date(); d.setDate(d.getDate() + 14);
      S.f.name = "Sample Employee"; S.f.cur = t.ph[0]; S.f.nw = t.ph[1];
      S.f.eff = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
      S.f.rcat = S.f.rcat || REASONS[0]; S.f.rtxt = S.f.rtxt || "Sample reason: strong results this year and a change in scope.";
      S.err = ""; draw(); return;
    }
    if (a === "eaf-submit") {
      S.err = validate(); if (S.err) { draw(); return; }
      S.stage = 1; S.ap = {}; t = T(); t.ap.forEach(function (x) { S.ap[x] = { status: "pending" }; });
      S.log = []; log(eafId() + " submitted: " + t.name + " for " + S.f.name + ".");
      log("Slack messages sent in parallel to: " + t.ap.map(function (x) { return APPR[x][0]; }).join(", ") + ".");
      draw(); window.scrollTo({ top: document.getElementById("eafroot").offsetTop - 80, behavior: "smooth" }); return;
    }
    if (a === "eaf-reset") { var n = S.n + (S.stage === 4 ? 1 : 0); S = fresh(); S.n = n; draw(); return; }
    if (a === "eaf-open") { S.signing = v; S.sgn = { ok: false, name: "", sig: false }; S.err = ""; draw(); return; }
    if (a === "eaf-close") { S.signing = null; S.err = ""; draw(); return; }
    if (a === "eaf-clear") { var c = document.getElementById("eaf-canvas"); if (c && c._clear) c._clear(); return; }
    if (a === "eaf-sign") {
      var nm = (document.getElementById("eaf-signame").value || "").trim(), ok = document.getElementById("eaf-agree").checked;
      S.sgn.name = nm; S.sgn.ok = ok;
      if (!ok) { S.err = "Tick the box to confirm you reviewed the change."; draw(); return; }
      if (!nm) { S.err = "Type your name."; draw(); return; }
      if (!S.sgn.sig) { S.err = "Add your signature in the box."; draw(); return; }
      var cv = document.getElementById("eaf-canvas"), url = ""; try { url = cv.toDataURL("image/png"); } catch (x) {}
      var who = S.signing; S.ap[who] = { status: "signed", sig: url, name: nm, at: now() }; S.signing = null; S.err = "";
      log(APPR[who][0] + " signed (" + nm + ")."); afterSign(); draw(); return;
    }
    if (a === "eaf-decline") { var w2 = S.signing; S.ap[w2] = { status: "declined", at: now() }; S.signing = null; log(APPR[w2][0] + " declined. The request goes back to the requester with a comment."); S.stage = 0; S.err = APPR[w2][0] + " declined this request. Update it and send it again."; draw(); return; }
    if (a === "eaf-all") { t.ap.forEach(function (x) { if (!S.ap[x] || S.ap[x].status !== "signed") { S.ap[x] = { status: "signed", sig: "", name: "Sample " + APPR[x][0], at: now() }; log(APPR[x][0] + " signed (demo shortcut)."); } }); afterSign(); draw(); return; }
    if (a === "eaf-rip") { S.rip = { done: true, at: now() }; S.stage = 3; log("People Ops made the change in Rippling and sent it to Payroll for final sign-off."); draw(); return; }
    if (a === "eaf-pay") {
      var all = S.pay.c.every(function (x) { return x; });
      if (!all) { S.err = "Tick all three checks before signing off."; draw(); return; }
      if (!S.pay.name.trim()) { S.err = "Type your name to sign off."; draw(); return; }
      S.err = ""; S.stage = 4; S.payAt = now(); log("Payroll signed off (" + S.pay.name.trim() + "). Change is final."); log("Signed form and audit trail logged to the tracker and the restricted Slack log."); draw(); return;
    }
    if (a === "eaf-flag") { S.err = ""; S.rip = null; S.stage = 2; S.pay = { c: [false, false, false], name: "" }; log("Payroll flagged a mismatch. Sent back to People Ops and Finance to correct in Rippling."); draw(); return; }
  }

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]"); if (!el) return;
    var a = el.getAttribute("data-act"); if (a.indexOf("eaf-") !== 0) return;
    act(a, el);
  });
  document.addEventListener("input", function (e) {
    var el = e.target;
    var k = el.getAttribute && el.getAttribute("data-eaf");
    if (k) { S.f[k] = el.value; if (S.err) { S.err = ""; var er = document.querySelector("#eafroot .eaf-err"); if (er) er.remove(); } return; }
    if (el.getAttribute && el.getAttribute("data-eaf-pay")) { S.pay.name = el.value; return; }
    if (el.id === "eaf-signame") S.sgn.name = el.value;
  });
  document.addEventListener("change", function (e) {
    var el = e.target, i = el.getAttribute && el.getAttribute("data-eafchk");
    if (i != null) { S.pay.c[+i] = el.checked; return; }
    if (el.id === "eaf-agree") S.sgn.ok = el.checked;
  });

  function rulesHtml() {
    var cols = [M, L2, HR, FIN, EXEC, LEG];
    var head = "<tr><th>Change</th>" + cols.map(function (c) { return "<th>" + esc(APPR[c][0]) + "</th>"; }).join("") + "<th>Payroll</th></tr>";
    var rows = TYPES.map(function (t) {
      return "<tr><td>" + esc(t.name) + "</td>" + cols.map(function (c) { return "<td>" + (t.ap.indexOf(c) >= 0 ? '<span class="eaf-dot" role="img" aria-label="Required"></span>' : "") + "</td>"; }).join("") + '<td><span class="eaf-dot" style="background:#FF4F00" role="img" aria-label="Final sign-off"></span></td></tr>';
    }).join("");
    return '<div class="wfwrap" style="padding:8px 12px;overflow-x:auto"><table class="eaf-rules">' + head + rows + "</table></div>";
  }
  window.EAF = { html: function () { css(); return '<div id="eafroot">' + body() + "</div>"; }, after: wireCanvas, rules: rulesHtml };
})();
