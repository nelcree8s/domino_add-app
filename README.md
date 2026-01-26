# Domino Score — Scan & Add

Add up points from remaining domino pieces after a round: **scan the table with your phone’s camera** or add pieces manually.

## How it works

- **Scan table**: Point the camera at the dominoes and tap **Scan table**. The app uses [OpenCV.js](https://docs.opencv.org/4.x/d0/d84/tutorial_js_usage.html) to find domino-shaped regions and count pips on each half.
- **Choose photo**: Pick an existing image from your gallery instead of the live camera.
- **Add manually**: Select left and right values (0–6) and tap **Add** for each piece.
- **Total**: The sum of all piece values is shown at the top. Use **Reset** to start a new round.

## Running the app

Camera access needs a **secure context** (HTTPS or `localhost`). Use a local server instead of opening `index.html` as a file.

### Option 1: npm (npx)

```bash
npx -y serve .
```

Then open `http://localhost:3000` (or the URL shown). On a phone, use your computer’s local IP and the same port (e.g. `http://192.168.1.x:3000`) if both are on the same Wi‑Fi.

### Option 2: Python

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`. For a phone on the same network: `http://<your-machine-ip>:8080`.

### Option 3: Deploy (HTTPS)

Deploy the folder to any static host (Netlify, Vercel, GitHub Pages, etc.) so it’s served over HTTPS. Then you can open it on your phone without `localhost`.

## Tips for better scans

- Good lighting and minimal shadows.
- Dominoes with clear, dark pips on a light background work best.
- Lay pieces flat and avoid strong tilt; a roughly top‑down view helps.
- If auto‑scan is wrong or misses pieces, use **Add manually** to correct or fill in.

## Tech

- **Camera**: `getUserMedia` (with fallback to file picker).
- **Detection**: OpenCV.js (contours, thresholding, blob count for pip values).
- **Stack**: Vanilla HTML, CSS, JS; no build step. OpenCV.js is loaded from the official CDN.

## License

MIT.
