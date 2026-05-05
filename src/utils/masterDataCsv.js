import * as XLSX from 'xlsx';

const TIMESTAMP_FIELDS = new Set(['createdAt', 'updatedAt']);

export function normalizeCsvCellValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

export function escapeCsvCell(value) {
  return `"${normalizeCsvCellValue(value).replace(/"/g, '""')}"`;
}

export function getMasterDataExportFields(items = [], fallbackFields = []) {
  if (Array.isArray(fallbackFields) && fallbackFields.length > 0) {
    return fallbackFields.filter((field) => !TIMESTAMP_FIELDS.has(field));
  }

  const fields = [];
  items.forEach((item) => {
    Object.keys(item || {}).forEach((field) => {
      if (!TIMESTAMP_FIELDS.has(field) && !fields.includes(field)) {
        fields.push(field);
      }
    });
  });

  return fields;
}

export function buildMasterDataExportRows(items = [], fallbackFields = []) {
  const fields = getMasterDataExportFields(items, fallbackFields);

  return items.map((item) =>
    fields.reduce((row, field) => {
      row[field] = normalizeCsvCellValue(item?.[field]);
      return row;
    }, {}),
  );
}

export function buildMasterDataCsvContent(items = [], fallbackFields = []) {
  const fields = getMasterDataExportFields(items, fallbackFields);
  const rows = buildMasterDataExportRows(items, fields).map((row) =>
    fields.map((field) => escapeCsvCell(row[field])).join(','),
  );

  return [fields.join(','), ...rows].join('\n');
}

export function downloadCsvFile(filename, csvContent) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function readCsvRows(file) {
  const text = await file.text();
  const workbook = XLSX.read(text, { type: 'string' });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    return [];
  }

  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
}
