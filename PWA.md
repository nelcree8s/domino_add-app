# Making this app a PWA

Your app is set up as a **Progressive Web App (PWA)**. Here’s what was added and how to use it.

---

## What’s in place

### 1. **Web App Manifest** (`manifest.json`)

Tells the browser how to show your app when it’s “installed” (added to home screen):

- **name** / **short_name** — Shown under the icon and in the app switcher.
- **start_url** — Opens at `/` (your index).
- **display: "standalone"** — Full screen, no browser UI (address bar, etc.).
- **theme_color** — Status bar color (we use your blue `#5f7dff`).
- **background_color** — Splash background.
- **icons** — 192 and 512 px; see `icons/README.md` to add your own.

The manifest is linked from `index.html` with `<link rel="manifest" href="manifest.json">`.

### 2. **Service worker** (`sw.js`)

Runs in the background and **caches** your app files (HTML, CSS, JS, manifest) after the first visit. That means:

- After one load, the app can open **offline** (e.g. in a subway or bad signal).
- “Add to Home Screen” still works; the icon launches the cached app.

Flow:

- **install** — Caches the list of URLs once.
- **fetch** — Serves from cache when possible, otherwise from the network.
- **activate** — Cleans up old caches when you change `CACHE_NAME` in `sw.js`.

### 3. **Registration** (in `index.html`)

A small script at the bottom of the page registers the service worker:

```js
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(function () {});
}
```

If the browser doesn’t support service workers (or registration fails), the app still works normally.

### 4. **Apple-specific meta tags**

- `apple-mobile-web-app-capable` — Use full screen on iOS when launched from home screen.
- `apple-mobile-web-app-title` — Short name under the icon.
- `theme-color` — Affects the status bar when the app is standalone.

---

## How to test

1. **Serve over HTTPS or localhost**  
   PWAs need a “secure context”. Use your local server (e.g. `python3 -m http.server 5501`) or any HTTPS host.

2. **Open the app in your phone’s browser**  
   Use your computer’s local IP if testing on the same network (e.g. `http://192.168.1.x:5501`).

3. **Add to Home Screen**  
   - **iOS Safari:** Share → “Add to Home Screen”.  
   - **Android Chrome:** Menu (⋮) → “Add to Home screen” / “Install app”.

4. **Open from the home screen**  
   The app should open full screen (no browser chrome). Turn off Wi‑Fi and open again to verify offline.

5. **Icons (optional)**  
   Add `icons/icon-192.png` and `icons/icon-512.png` (see `icons/README.md`). Without them, the system may use a generic icon.

---

## If you deploy to a subpath (e.g. GitHub Pages)

If the app lives at `https://you.github.io/domino_add-app/`:

- In **manifest.json**, set `"start_url": "/domino_add-app/"` (or use `"."` for relative).
- In **sw.js**, cache URLs like `"/domino_add-app/"`, `"/domino_add-app/index.html"`, etc., or build the list in code from a base path.
- When you change the cache list, bump **CACHE_NAME** (e.g. `domino-score-v2`) so the new cache is installed.

---

## Next: Capacitor (native iOS/Android builds)

After you’re comfortable with the PWA, you can wrap this same app with **Capacitor** to build real `.ipa` (iOS) and `.apk`/`.aab` (Android) and publish to the stores. Same HTML/CSS/JS; Capacitor adds a native shell and build tooling. If you want to do that next, we can add the Capacitor project step by step.
