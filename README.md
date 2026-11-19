# REALITY DEBUGGER — GLITCH CITY (V1)

A free, playable, procedural 3D mini-city where reality itself can be repaired using a live webcam and hand tracking (MediaPipe Hand Landmarker), with complete keyboard/mouse and touch fallbacks.

## How to run

The game must be served over HTTP(S) rather than opened as a `file://` document, because browser module imports and webcam security restrictions need a web origin. Two no-cost options:

- **Locally**: run `python -m http.server 8000` from this directory and open `http://localhost:8000` in a modern browser.
- **Free public link**: upload the contents of this folder (index.html, styles.css, main.js) to a public GitHub repository and activate GitHub Pages from Settings > Pages > Deploy from a branch, selecting the root folder of the main branch. The link usually looks like `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`. Publishing is subject to the platform's free-tier policies.

An active Internet connection is required to download free JavaScript modules, the MediaPipe model, and font assets. There is **no paid API**, login, or cloud database. After loading, the hand model inference runs on your device. The video feed is not intentionally uploaded or recorded by this application.

## Controls

| When | Control | Result |
|---|---|---|
| Explore | W / up arrow | Walk forward |
| Explore | S / down arrow | Walk backward |
| Explore | A/D or left/right arrows | Turn left/right |
| Explore | Drag the mouse over city | Temporarily orbit follow camera |
| Explore | Show open palm in webcam, then move hand UP/DOWN | Walk forward/backward |
| Explore | Move open palm LEFT/RIGHT | Turn |
| Explore | Hold a fist | Stop |
| Explore | Hold only index finger upright for >0.7 seconds | Enter Debug mode near anomaly |
| Explore or Debug | E | Toggle Debug mode near an unresolved anomaly |
| Debug | Touch/mouse drag orange anomaly core to green target | Preview and complete geometry repair |
| Debug | Point fingertip at orange core, pinch thumb + index | Grab core |
| Debug | Keep pinching and move hand | Drag core |
| Debug | Release pinch near green target | Commit repair |
| Debug | Hold open palm for ~1 second | Exit Debug mode |

Camera permission is requested **only** after a user clicks a camera button. Use **Calibrate** with your open palm in the camera center to define the neutral position. Hand movement near neutral stays still (dead zone).

If tracking does not work, try the latest Chrome or Edge on a laptop, use HTTPS, enable camera access, and check lighting. Webcam/model compatibility on iPad browsers varies. Keyboard/mouse and touch controls remain available.

## Missions

1. **Reverse Gravity:** Grab car core and drag DOWN to the grounded anchor. Car visibly falls.
2. **Infinite Replication:** Drag building core DOWN to compress duplicated building fragments.
3. **Fractured Road:** Drag road stitch core RIGHT along the crack to restore aligned slabs.

Use **Settings > Reset All Three Anomalies** to replay. The city and all 3D graphics are created from procedural geometry, using original materials and no copyrighted game assets. The mini-city is a browser prototype, **not** a GTA-scale photorealistic city.

## Dependencies and usage

- Three.js open-source library via jsDelivr (version 0.168.0)
- Google MediaPipe Tasks Vision via jsDelivr (version 0.10.22)
- Official public Google MediaPipe Hand Landmarker model
- Web fonts via Google Fonts; safe fallback fonts when unavailable

No environment variables, installation scripts, paid API keys, or build steps required.

## Development notes

- `index.html`: game canvas, input HUD, settings, interaction elements
- `styles.css`: responsive game UI and visual styling
- `main.js`: procedural Three.js city, third-person controller, mission states, live hand recognition

Potential next iterations: optimize model and device-specific MediaPipe behavior; add free licensed glTF assets, cinematic postprocessing, more mission logic and sound; validate gestures across browsers and camera lighting conditions.
