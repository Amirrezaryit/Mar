# Snake 6 — Online Battle Royale

## Files
- `index.html`, images, `manifest.webmanifest`, `server-config.js`: Netlify game frontend.
- `server.js`, `package.json`: multiplayer Node.js WebSocket backend.
- `render.yaml`: optional Render blueprint.

## Deployment
1. Upload **extracted files** (not the ZIP itself) to your GitHub repository, preserving filenames at the repository root.
2. In Render, create a **Web Service** from the GitHub repository. Runtime Node, build command `npm install`, start command `npm start`. Select a supported plan.
3. Copy your actual Render service HTTPS URL (for example `https://your-service.onrender.com`).
4. In GitHub, edit `server-config.js` and set `window.SNAKE6_SERVER_URL = 'https://your-service.onrender.com';` and commit.
5. Deploy the frontend files to Netlify again, or connect Netlify to this GitHub repository. Ensure `server-config.js` is included. Visit the Netlify game URL.
6. Two devices can join the same lobby. A 30-second countdown begins at 2 players; up to 5 players join. After the countdown, the round starts. Players steer using the on-screen joystick; offline mode is unchanged.

**Limitations:** Free Render services may sleep when idle, have usage limits, and do not guarantee 24/7 uptime. The server keeps game state in memory; restarting it resets active matches. Trophies are stored locally in the browser, not synced across devices. This prototype has not been end-to-end tested on Render and Netlify.
