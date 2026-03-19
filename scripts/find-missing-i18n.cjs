const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'src');
const localesDir = path.join(srcDir, 'locales');
const enFile = path.join(localesDir, 'translations.json');
const arFile = path.join(localesDir, 'arabic.json');

function walk(dir, exts = ['.js', '.jsx', '.ts', '.tsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full, exts));
    } else {
      if (exts.includes(path.extname(full))) results.push(full);
    }
  });
  return results;
}

function extractKeysFromFile(content) {
  const re = /t\(\s*["'`]([A-Za-z0-9_.]+)["'`]\s*\)/g;
  const keys = new Set();
  let m;
  while ((m = re.exec(content)) !== null) {
    keys.add(m[1]);
  }
  return keys;
}

function flatten(obj, prefix = '') {
  const keys = new Set();
  Object.keys(obj).forEach(k => {
    const val = obj[k];
    const full = prefix ? prefix + '.' + k : k;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      flatten(val, full).forEach(x => keys.add(x));
    } else {
      keys.add(full);
    }
  });
  return keys;
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error('Failed to read', file, e.message);
    process.exit(2);
  }
}

const files = walk(srcDir);
const usedKeys = new Set();
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  extractKeysFromFile(content).forEach(k => {
    // ignore accidental single-word matches (keep namespaced keys like "admin.save")
    if (k.includes('.')) usedKeys.add(k);
  });
});

const en = readJson(enFile);
const ar = readJson(arFile);
const enKeys = flatten(en);
const arKeys = flatten(ar);

const missingEn = [];
const missingAr = [];

usedKeys.forEach(k => {
  if (!enKeys.has(k)) missingEn.push(k);
  if (!arKeys.has(k)) missingAr.push(k);
});

console.log('Scanned files:', files.length);
console.log('Unique translation keys used:', usedKeys.size);
console.log('Missing in English (translations.json):', missingEn.length);
missingEn.forEach(k => console.log('  EN MISSING:', k));
console.log('Missing in Arabic (arabic.json):', missingAr.length);
missingAr.forEach(k => console.log('  AR MISSING:', k));

// write a report
const report = { scannedFiles: files.length, usedKeys: [...usedKeys], missingEn, missingAr };
fs.writeFileSync(path.join(root, 'missing-i18n-report.json'), JSON.stringify(report, null, 2));
console.log('\nWrote report to', path.join(root, 'missing-i18n-report.json'));
