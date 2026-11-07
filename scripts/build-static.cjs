const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..'), output = path.join(root, 'dist');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
for (const entry of fs.readdirSync(root)) if (/\.(html|js|css|ico)$/.test(entry)) fs.copyFileSync(path.join(root, entry), path.join(output, entry));
fs.cpSync(path.join(root, 'assets'), path.join(output, 'assets'), {
  recursive: true,
  filter: source => !['sources', 'concepts'].includes(path.basename(source)) && !/\.(md|json)$/.test(source)
});
console.log('Static game exported to dist/');
