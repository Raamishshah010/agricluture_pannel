const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const reportFile = path.join(root, 'missing-i18n-report.json');
const localesDir = path.join(root, 'src', 'locales');
const enFile = path.join(localesDir, 'translations.json');
const arFile = path.join(localesDir, 'arabic.json');

function readJson(file){
  return JSON.parse(fs.readFileSync(file,'utf8'));
}
function writeJson(file,obj){
  fs.writeFileSync(file, JSON.stringify(obj, null, 2), 'utf8');
}

function setNested(obj, key, value){
  const parts = key.split('.');
  let cur = obj;
  for(let i=0;i<parts.length-1;i++){
    if(!cur[parts[i]] || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length-1]] = value;
}

function humanize(str){
  // convert camelCase or snake_case or kebab to Title Case
  const s = str.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ');
  return s.split(' ').map(w=> w ? w[0].toUpperCase()+w.slice(1):'').join(' ').trim();
}

const report = readJson(reportFile);
const missingEn = report.missingEn || [];
const missingAr = report.missingAr || [];
const en = readJson(enFile);
const ar = readJson(arFile);

// small Arabic fallback map for common words
const arMap = {
  'View':'عرض',
  'Edit':'تعديل',
  'Delete':'حذف',
  'Add':'إضافة',
  'Cancel':'إلغاء',
  'Save':'حفظ',
  'Search':'بحث',
  'Select':'اختر',
  'Loading...':'جاري التحميل...',
  'No data found. Add your first coder to get started.':'لم يتم العثور على بيانات. أضف أول مرمز للبدء.'
};

missingEn.forEach(k=>{
  if(k==='.') return;
  // if exists skip
  const parts = k.split('.');
  // check if exists already
  try{
    let cur = en;
    for(const p of parts){ cur = cur[p]; if(cur===undefined) throw new Error('miss'); }
    return; // exists
  }catch(e){}
  const last = parts[parts.length-1];
  const value = humanize(last);
  setNested(en, k, value);
  // set Arabic fallback: try map or translate simple words
  const arValue = arMap[value] || (value + ' (AR)');
  setNested(ar, k, arValue);
});

// also ensure missingAr keys present in Arabic (for keys present in English but not Arabic)
missingAr.forEach(k=>{
  if(k==='.') return;
  try{
    let cur = ar;
    k.split('.').forEach(p=>{ cur = cur[p]; if(cur===undefined) throw new Error('miss'); });
    return;
  }catch(e){}
  // try to pull from en if available
  let fallback = null;
  try{
    let cur = en;
    k.split('.').forEach(p=> cur = cur[p]);
    fallback = cur;
  }catch(e){}
  const arValue = (fallback && arMap[fallback]) ? arMap[fallback] : (fallback ? (fallback + ' (AR)') : humanize(k.split('.').pop()) + ' (AR)');
  setNested(ar, k, arValue);
});

writeJson(enFile, en);
writeJson(arFile, ar);
console.log('Applied placeholders for missing i18n keys. Please review translations in translations.json and arabic.json');
