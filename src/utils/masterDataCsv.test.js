import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMasterDataCsvContent, buildMasterDataExportRows } from './masterDataCsv.js';

test('master data csv export skips createdAt and updatedAt', () => {
  const rows = buildMasterDataExportRows([
    {
      id: 'row-1',
      name: 'Apple',
      nameInArrabic: 'تفاح',
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-02T00:00:00.000Z',
    },
  ]);

  assert.deepEqual(rows, [
    {
      id: 'row-1',
      name: 'Apple',
      nameInArrabic: 'تفاح',
    },
  ]);

  const csv = buildMasterDataCsvContent([
    {
      id: 'row-1',
      name: 'Apple',
      nameInArrabic: 'تفاح',
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-02T00:00:00.000Z',
    },
  ]);

  assert.equal(csv, 'id,name,nameInArrabic\n"row-1","Apple","تفاح"');
});
