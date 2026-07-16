# @f-keys/tip-widget — `<tip-stream>`

**An embeddable, multi-method tip QR web component for streamers and creators.** One `<script>` tag, zero dependencies, nothing leaves the browser. It renders a branded, scannable QR + method picker that deep-links straight to **your own** wallets and payment links — crypto (Bitcoin, Ethereum, Dogecoin, Solana, and more via BIP-21) plus PayPal, Cash App, Venmo, and Ko-fi.

No account. No custody. No platform fee. The widget never touches money — it just points supporters at destinations you control.

> Looking for a **free, no-account, client-side tip QR** you can drop into any page or OBS overlay? That's this.

---

## Install

**Script tag (no build step):**

```html
<script src="https://tipstreams.com/widget/tip-stream.js"></script>
```

**npm:**

```bash
npm install @f-keys/tip-widget
```

```js
import "@f-keys/tip-widget"; // registers the <tip-stream> custom element
```

---

## Use

```html
<tip-stream name="@you" accent="#f7931a" theme="dark">
  <script type="application/json">
  {
    "heading": "Tip me",
    "methods": [
      { "type": "bitcoin", "address": "YOUR_BTC_ADDRESS" },
      { "type": "paypal",  "handle": "yourname" },
      { "type": "cashapp", "handle": "$yourtag" }
    ]
  }
  </script>
</tip-stream>
```

That's the whole integration. The component reads its config from the inline JSON, builds a deep link per method, and renders a scannable QR the viewer's phone/wallet opens directly.

---

## Configuration

| Attribute | Default | Description |
|-----------|---------|-------------|
| `name`    | —       | Creator handle shown in the header |
| `heading` | `Tip me`| Card title |
| `accent`  | `#f7931a` | Brand/accent color (any CSS color) |
| `theme`   | `dark`  | `dark` or `light` |

`name`, `heading`, `accent`, and `theme` may also be set inside the JSON config.

### Methods

Each entry in `methods` is one payment option.

**Crypto** (rendered as BIP-21 wallet deep links — scanning opens the viewer's wallet with your address pre-filled):

```json
{ "type": "bitcoin", "address": "bc1q...", "amount": "0.001" }
```

Supported `type`s: `bitcoin`, `ethereum`, `litecoin`, `dogecoin`, `bitcoincash`, `monero`, `solana`. `amount` is optional.

**Fiat / links:**

```json
{ "type": "paypal",  "handle": "yourname" }        // → paypal.me/yourname
{ "type": "cashapp", "handle": "$yourtag" }        // → cash.app/$yourtag
{ "type": "venmo",   "handle": "@yourname" }       // → venmo.com/u/yourname
{ "type": "kofi",    "label": "Ko-fi", "url": "https://ko-fi.com/you" }
{ "type": "custom",  "label": "Any link", "url": "https://..." }
```

Any method may pass an explicit `url` to override the generated link, and a `label` to override the display name.

---

## Events

The element emits a `tip-select` event when a method is chosen:

```js
document.querySelector("tip-stream")
  .addEventListener("tip-select", (e) => console.log(e.detail.uri));
```

---

## Why it's different

- **No account, no custody, no cut.** It renders a QR/link to destinations you already own.
- **Nothing leaves the browser.** Addresses are encoded client-side — no network requests, no tracking, no backend.
- **Portable.** Works in any HTML: your site, a bio page, Notion, or an OBS browser source.
- **Tiny & self-contained.** ~32 KB, one file, no runtime dependencies.

---

## License

MIT © [F-Keys](https://f-keys.com). Bundled QR encoder © Kazuhiko Arase (MIT).

`<tip-stream>` is part of [TipStreams](https://tipstreams.com), a flagship project of **F-Keys** — a studio that ships portable creator widgets.
