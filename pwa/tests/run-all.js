// Barcha sinovlarni ketma-ket ishga tushiradi: node tests/run-all.js
// Talab: Node 18+, `npm i playwright` va `npx playwright install chromium`. Natijalar WORK papkasiga yoziladi.
const { spawnSync } = require('child_process'), path = require('path');
const app = path.resolve(__dirname, '..'); let port = 8400, bad = 0;
for (const t of ['pin', 'ct', 'token', 'risk', 'fuzz', 'weak', 'backup', 'v13', 'v14', 'v15', 'v16', 'usdt', 'v18', 'v19', 'v20', 'v22', 'v23', 'v24', 'v25', 'v26', 'journey', 'v27', 'v28', 'v29', 'v30', 'v31', 'v32', 'v33', 'v34', 'v35', 'v36', 'mining']) {
  const r = spawnSync('node', [path.join(__dirname, t + '-test.js'), app, String(port++)], { encoding: 'utf8', timeout: 280000 });
  const out = (r.stdout || '') + (r.stderr || ''), errs = /"errs":\s*\[\s*"/.test(out), fail = r.status !== 0 || /FAIL/.test(out) || errs;
  console.log((fail ? 'XATO  ' : 'OK    ') + t); if (fail) { bad++; console.log(out.slice(-600)); }
}
process.exit(bad ? 1 : 0);
