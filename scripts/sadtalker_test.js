import fs from 'fs';

// Use global fetch when available (Node 18+). Otherwise fall back to node-fetch.
let fetchFn = globalThis.fetch;
if (!fetchFn) {
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    const nf = await import('node-fetch');
    fetchFn = nf.default;
  } catch (e) {
    console.error('No fetch available. Please run on Node 18+ or install node-fetch.');
    process.exit(1);
  }
}

const fetch = fetchFn;

// Usage: node scripts/sadtalker_test.js http://SERVER_IP:5000 "Hello from test"
// Saves out.mp4 in the current directory and attempts to open it (macOS `open`)

const [,, serverUrl = 'http://localhost:5000', text = 'Hello from your SadTalker server!'] = process.argv;

(async () => {
  try {
    const res = await fetch(`${serverUrl.replace(/\/$/, '')}/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error('Server error:', res.status, txt);
      process.exit(1);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const outPath = 'sadtalker_out.mp4';
    fs.writeFileSync(outPath, buffer);
    console.log('Saved', outPath);

    // Try to open on macOS
    if (process.platform === 'darwin') {
      const child = await import('child_process');
      child.exec(`open ${outPath}`);
    } else {
      console.log('Open the file manually to play it.');
    }
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
})();
