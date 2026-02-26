# AGENTS.md

## Cursor Cloud specific instructions

**Domino Score** is a zero-dependency, vanilla HTML/CSS/JS Progressive Web App with no build step, no package manager, and no automated tests.

### Running the dev server

Serve the project root with any static HTTP server. Camera/PWA features require `localhost` or HTTPS.

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`. See `README.md` for alternative methods (`npx serve`, deployment).

### Lint / Test / Build

- **No linter, test framework, or build system is configured.** There is no `package.json`, `eslint` config, or test runner.
- **No automated tests exist.** Manual browser testing is the only verification method.
- All application state lives in `localStorage` under the key `domino_score_match_v3`.

### Key files

| File | Purpose |
|---|---|
| `index.html` | App shell and markup |
| `app.js` | All application logic, i18n strings, state management |
| `styles.css` | All styles |
| `sw.js` | Service worker for offline caching |
| `manifest.json` | PWA manifest |

### Gotchas

- External CDN resources (Google Fonts, Feather Icons from unpkg) are loaded at runtime; the app still functions without them but icons won't render.
- The service worker caches aggressively; when making changes during development, hard-refresh or clear the service worker cache to see updates.
