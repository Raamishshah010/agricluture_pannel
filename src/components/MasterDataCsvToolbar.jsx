import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import { buildMasterDataCsvContent, downloadCsvFile, readCsvRows } from '../utils/masterDataCsv';

export default function MasterDataCsvToolbar({
  items = [],
  exportFields = [],
  exportFileName,
  importLabel,
  importingLabel,
  exportLabel,
  createItem,
  mapCsvRowToPayload,
  refreshItems,
  itemLabel = 'rows',
  loading = false,
}) {
  const fileInputRef = useRef(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = () => {
    const csvContent = buildMasterDataCsvContent(items, exportFields);
    downloadCsvFile(exportFileName, csvContent);
    toast.success(`${exportLabel} complete`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const rows = await readCsvRows(file);
      let imported = 0;
      let failed = 0;
      const errors = [];

      for (const [index, row] of rows.entries()) {
        const rowNumber = index + 2;

        try {
          const payload = mapCsvRowToPayload(row);
          if (!payload) {
            failed += 1;
            errors.push(`Row ${rowNumber}: skipped`);
            continue;
          }

          await createItem(payload);
          imported += 1;
        } catch (error) {
          failed += 1;
          errors.push(`Row ${rowNumber}: ${error.message}`);
        }
      }

      if (refreshItems) {
        await refreshItems();
      }

      const suffix = failed > 0 ? `, ${failed} failed` : '';
      toast.success(`Imported ${imported} ${itemLabel}${suffix}`);
      if (errors.length > 0) {
        toast.info(errors.slice(0, 3).join(' | '));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'CSV import failed');
    } finally {
      setIsImporting(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleImport}
      />
      <button
        onClick={handleImportClick}
        disabled={loading || isImporting}
        className="px-4 py-2.5 bg-white border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Upload size={18} />
        <span>{isImporting ? (importingLabel || importLabel) : importLabel}</span>
      </button>
      <button
        onClick={handleExport}
        disabled={loading || items.length === 0}
        className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Download size={18} />
        <span>{exportLabel}</span>
      </button>
    </div>
  );
}
