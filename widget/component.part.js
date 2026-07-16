
/* ============================================================
// <tip-stream> — embeddable multi-method tip widget
// Author: Vince Gonzalez | © 2026 F-Keys | www.f-keys.com
// Project: TipStreams (a flagship project of F-Keys)
// File: tip-stream.js  |  Version: 0.1.0
// ------------------------------------------------------------
// One <script> tag. Zero external requests. Nothing leaves the
// browser. Renders a branded, scannable tip QR + method picker
// that deep-links straight to the creator's own wallets/links.
// QR encoder (Kazuhiko Arase, MIT) is vendored above; `qrcode`
// is in scope within this same IIFE.
// ------------------------------------------------------------
// CHANGE LOG v0.1.0:
//   - Web component <tip-stream>, shadow DOM, theme-aware
//   - Crypto BIP-21 deep links + fiat passthrough (PayPal, Cash
//     App, Venmo, Ko-fi, custom URL)
//   - Crisp SVG QR (scalable, no canvas), copy-URI, method chips
// NEXT STEPS:
//   - npm package @f-keys/tip-widget (ESM + this IIFE build)
//   - amount presets, custom logo in QR center, OBS transparent mode
// ============================================================ */
(function () {
  "use strict";
  if (typeof window === "undefined" || window.customElements == null) return;
  if (window.customElements.get("tip-stream")) return; // already defined

  // ---- payment method resolution --------------------------------------
  var CRYPTO = {
    bitcoin:     { scheme: "bitcoin",     amountParam: "amount",    label: "Bitcoin" },
    ethereum:    { scheme: "ethereum",    amountParam: "value",     label: "Ethereum" },
    litecoin:    { scheme: "litecoin",    amountParam: "amount",    label: "Litecoin" },
    dogecoin:    { scheme: "dogecoin",    amountParam: "amount",    label: "Dogecoin" },
    bitcoincash: { scheme: "bitcoincash", amountParam: "amount",    label: "Bitcoin Cash" },
    monero:      { scheme: "monero",      amountParam: "tx_amount", label: "Monero" },
    solana:      { scheme: "solana",      amountParam: "amount",    label: "Solana" }
  };

  // Build the scannable destination URI for one method.
  function buildURI(m) {
    if (!m) return "";
    var t = String(m.type || "").toLowerCase();
    var c = CRYPTO[t];
    if (c) {
      if (!m.address) return "";
      var uri = c.scheme + ":" + m.address;
      if (m.amount) uri += "?" + c.amountParam + "=" + encodeURIComponent(m.amount);
      return uri;
    }
    if (t === "paypal") {
      if (m.url) return m.url;
      if (m.handle) return "https://paypal.me/" + String(m.handle).replace(/^@/, "");
      return m.address || "";
    }
    if (t === "cashapp") {
      if (m.url) return m.url;
      var tag = String(m.handle || m.address || "").replace(/^\$/, "");
      return tag ? "https://cash.app/$" + tag : "";
    }
    if (t === "venmo") {
      if (m.url) return m.url;
      var vu = String(m.handle || m.address || "").replace(/^@/, "");
      return vu ? "https://venmo.com/u/" + vu : "";
    }
    // kofi / buymeacoffee / custom / anything URL-based
    return m.url || m.address || "";
  }

  var FIAT_LABEL = {
    paypal: "PayPal", cashapp: "Cash App", venmo: "Venmo",
    kofi: "Ko-fi", buymeacoffee: "Buy Me a Coffee", custom: "Link"
  };

  function labelFor(m) {
    if (m && m.label) return m.label;
    var t = String(m && m.type || "").toLowerCase();
    if (CRYPTO[t]) return CRYPTO[t].label;
    if (FIAT_LABEL[t]) return FIAT_LABEL[t];
    return (m && m.type) ? String(m.type) : "Link";
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch];
    });
  }

  // Render the QR matrix as crisp, scalable SVG (dark-on-light for scannability).
  function qrSVG(text) {
    var qr = qrcode(0, "M"); // type 0 = auto-fit smallest version, ECC level M
    qr.addData(text || " ");
    qr.make();
    var count = qr.getModuleCount();
    var quiet = 2;
    var dim = count + quiet * 2;
    var d = "";
    for (var r = 0; r < count; r++) {
      for (var col = 0; col < count; col++) {
        if (qr.isDark(r, col)) {
          d += "M" + (col + quiet) + "," + (r + quiet) + "h1v1h-1z";
        }
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + dim + ' ' + dim +
           '" shape-rendering="crispEdges" width="100%" height="100%" role="img" aria-label="Payment QR code">' +
           '<rect width="' + dim + '" height="' + dim + '" fill="#ffffff"/>' +
           '<path d="' + d + '" fill="#0b0e12"/></svg>';
  }

  // ---- styles (scoped to shadow DOM) ----------------------------------
  var STYLE =
    ':host{all:initial;display:inline-block;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;line-height:1.4;}' +
    '*{box-sizing:border-box;}' +
    '.card{width:300px;max-width:100%;border-radius:16px;padding:18px;border:1px solid var(--bd);background:var(--bg);color:var(--fg);box-shadow:0 8px 30px rgba(0,0,0,.18);}' +
    '.head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:14px;}' +
    '.title{font-size:16px;font-weight:700;margin:0;color:var(--fg);}' +
    '.name{font-size:12px;font-weight:600;color:var(--ac);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:45%;}' +
    '.chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;}' +
    '.chip{font:600 11px/1 inherit;letter-spacing:.02em;padding:7px 10px;border-radius:999px;border:1px solid var(--bd);background:var(--chip);color:var(--fg2);cursor:pointer;transition:.12s;}' +
    '.chip:hover{border-color:var(--ac);color:var(--fg);}' +
    '.chip[aria-pressed="true"]{background:var(--ac);border-color:var(--ac);color:#fff;}' +
    '.qrwrap{background:#fff;border-radius:12px;padding:12px;width:100%;aspect-ratio:1/1;display:flex;}' +
    '.qrwrap svg{border-radius:4px;}' +
    '.cap{text-align:center;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--fg2);margin:12px 0 8px;}' +
    '.uri{display:flex;align-items:center;gap:6px;background:var(--chip);border:1px solid var(--bd);border-radius:8px;padding:7px 9px;}' +
    '.uri code{font:500 11px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--fg2);word-break:break-all;flex:1;}' +
    '.copy{flex:none;font:600 11px/1 inherit;padding:6px 8px;border-radius:6px;border:1px solid var(--bd);background:transparent;color:var(--fg2);cursor:pointer;}' +
    '.copy:hover{border-color:var(--ac);color:var(--fg);}' +
    '.foot{margin-top:12px;text-align:center;font-size:10px;color:var(--fg3);}' +
    '.foot a{color:var(--fg3);text-decoration:none;}' +
    '.foot a:hover{text-decoration:underline;}' +
    '.err{font:500 12px/1.5 inherit;color:#e05a5a;padding:14px;border:1px solid #e05a5a55;border-radius:12px;}' +
    /* themes */
    ':host{--ac:#f7931a;}' +
    '.t-dark{--bg:#0f1319;--fg:#f0f4f8;--fg2:#aab4c0;--fg3:#6b7684;--bd:#232a33;--chip:#161c24;}' +
    '.t-light{--bg:#ffffff;--fg:#12161c;--fg2:#5a6472;--fg3:#9aa4b2;--bd:#e6e9ee;--chip:#f4f6f9;}';

  // ---- the element ----------------------------------------------------
  function TipStream() { return Reflect.construct(HTMLElement, [], TipStream); }
  TipStream.prototype = Object.create(HTMLElement.prototype);
  TipStream.prototype.constructor = TipStream;
  Object.setPrototypeOf(TipStream, HTMLElement);

  TipStream.prototype.connectedCallback = function () {
    if (this._mounted) return;
    this._mounted = true;
    this.STATE = { methods: [], active: 0, name: "", heading: "Tip me", theme: "dark", accent: "#f7931a" };
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    try {
      this._readConfig();
      this._render();
    } catch (e) {
      this.shadowRoot.innerHTML = "<style>" + STYLE + "</style><div class='err'>tip-stream: " + esc(e.message) + "</div>";
    }
  };

  TipStream.prototype._readConfig = function () {
    var cfg = {};
    var tag = this.querySelector('script[type="application/json"]');
    if (tag && tag.textContent.trim()) {
      try { cfg = JSON.parse(tag.textContent); }
      catch (e) { throw new Error("invalid JSON config (" + e.message + ")"); }
    }
    var raw = cfg.methods || [];
    var S = this.STATE;
    S.methods = raw.filter(function (m) { return buildURI(m); });
    S.name    = this.getAttribute("name")    || cfg.name    || "";
    S.heading = this.getAttribute("heading") || cfg.heading || "Tip me";
    S.accent  = this.getAttribute("accent")  || cfg.accent  || "#f7931a";
    S.theme   = String(this.getAttribute("theme") || cfg.theme || "dark").toLowerCase();
    if (!S.methods.length) throw new Error("no valid payment methods provided");
  };

  TipStream.prototype._render = function () {
    var S = this.STATE;
    var chips = S.methods.map(function (m, i) {
      return '<button class="chip" type="button" data-i="' + i + '" aria-pressed="' + (i === S.active) + '">' + esc(labelFor(m)) + "</button>";
    }).join("");

    this.shadowRoot.innerHTML =
      "<style>" + STYLE + ":host{--ac:" + esc(S.accent) + ";}</style>" +
      '<div class="card t-' + (S.theme === "light" ? "light" : "dark") + '">' +
        '<div class="head"><p class="title">' + esc(S.heading) + "</p>" +
          (S.name ? '<span class="name">' + esc(S.name) + "</span>" : "") + "</div>" +
        '<div class="chips" role="group" aria-label="Payment methods">' + chips + "</div>" +
        '<div class="qrwrap" id="qr"></div>' +
        '<div class="cap">Scan to support</div>' +
        '<div class="uri"><code id="uri"></code>' +
          '<button class="copy" id="copy" type="button">Copy</button></div>' +
        '<div class="foot">Powered by <a href="https://tipstreams.com" target="_blank" rel="noopener">TipStreams</a> · F-Keys</div>' +
      "</div>";

    var self = this;
    this.shadowRoot.querySelectorAll(".chip").forEach(function (btn) {
      btn.addEventListener("click", function () { self._select(parseInt(btn.dataset.i, 10)); });
    });
    this.shadowRoot.getElementById("copy").addEventListener("click", function () { self._copy(); });
    this._paint();
  };

  TipStream.prototype._select = function (i) {
    if (i === this.STATE.active) return;
    this.STATE.active = i;
    var chips = this.shadowRoot.querySelectorAll(".chip");
    chips.forEach(function (b, n) { b.setAttribute("aria-pressed", n === i); });
    this._paint();
  };

  TipStream.prototype._paint = function () {
    var m = this.STATE.methods[this.STATE.active];
    var uri = buildURI(m);
    this.shadowRoot.getElementById("qr").innerHTML = qrSVG(uri);
    this.shadowRoot.getElementById("uri").textContent = uri;
    this._current = uri;
    // notify host page listeners
    this.dispatchEvent(new CustomEvent("tip-select", { bubbles: true, detail: { method: m, uri: uri } }));
  };

  TipStream.prototype._copy = function () {
    var uri = this._current || "";
    var btn = this.shadowRoot.getElementById("copy");
    var done = function () { btn.textContent = "Copied"; setTimeout(function () { btn.textContent = "Copy"; }, 1400); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(uri).then(done, done);
    } else {
      var ta = document.createElement("textarea");
      ta.value = uri; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta); done();
    }
  };

  window.customElements.define("tip-stream", TipStream);
})();
