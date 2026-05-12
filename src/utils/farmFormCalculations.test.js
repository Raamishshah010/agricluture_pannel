import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFarmDataFromFarmer,
  buildFarmsCsvContent,
  buildFarmsExportRows,
  calculateFieldCropAreaTotal,
  calculateFruitProduction,
  calculateGreenhouseArea,
  calculateGreenhouseProduction,
  calculateRowProduction,
  findFarmerByEmiratesId,
  getDisplayFarmStatus,
  shouldResetManageFarmsSession,
  sortAndFilterManageFarms,
} from './index.js';

test('buildFarmDataFromFarmer keeps only Emirates ID as hidden stored farm data', () => {
  const result = buildFarmDataFromFarmer({
    fullnameEN: 'Aisha Khan',
    agriculturalId: 'AGR-42',
    accountNumber: 'ACC-99',
    mobile: '+971500000000',
    emirateId: '784-1988-1234567-1',
  });

  assert.deepEqual(result, {
    emiratesID: '784-1988-1234567-1',
  });
});

test('findFarmerByEmiratesId matches farmer Emirates ID regardless of formatting', () => {
  const farmers = [
    { id: 'farmer-a', fullnameEN: 'Aisha Khan', emirateId: '784-1988-1234567-1' },
    { id: 'farmer-b', fullnameEN: 'Omar Ali', emirateId: '784199912345672' },
  ];

  const result = findFarmerByEmiratesId(farmers, '784198812345671');

  assert.equal(result.id, 'farmer-a');
});

test('buildFarmsCsvContent exports every farm table field and dynamic attributes', () => {
  const csv = buildFarmsCsvContent([
    {
      id: 'farm-1',
      emiratesID: '784198812345671',
      farmNo: 42,
      farmSerial: 7,
      totalArea: 120.5,
      crops: {
        fruits: [{ fruitType: 'date palm', area: 10 }],
      },
      mapData: [{ lat: 24.1, lng: 55.2 }],
      customTableField: 'kept',
    },
  ]);

  const [headers, row] = csv.split('\n');

  assert.match(headers, /^id,emiratesID,owner,holder,location,/);
  assert.ok(headers.includes('ownerID'));
  assert.ok(headers.endsWith('customTableField'));
  assert.ok(row.includes('"farm-1"'));
  assert.ok(row.includes('"[{""lat"":24.1,""lng"":55.2}]"'));
  assert.ok(row.endsWith('"kept"'));
});

test('buildFarmsExportRows prepares full farm table fields for xlsx export', () => {
  const rows = buildFarmsExportRows([
    {
      id: 'farm-1',
      farmNo: 42,
      crops: { vegetables: [{ vegetableType: 'tomato' }] },
      customTableField: 'xlsx-kept',
    },
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, 'farm-1');
  assert.equal(rows[0].farmNo, '42');
  assert.equal(rows[0].ownerID, '');
  assert.equal(rows[0].crops, '{"vegetables":[{"vegetableType":"tomato"}]}');
  assert.equal(rows[0].customTableField, 'xlsx-kept');
});

test('getDisplayFarmStatus treats unassigned farms as draft', () => {
  assert.equal(getDisplayFarmStatus({ status: 'active', isAssigned: false }), 'draft');
  assert.equal(getDisplayFarmStatus({ status: 'pending', isAssigned: true }), 'pending');
});

test('sortAndFilterManageFarms returns recent farms first and filters by displayed status', () => {
  const farms = [
    { id: 'old-active', status: 'active', isAssigned: true, createdAt: '2025-01-01T00:00:00.000Z' },
    { id: 'new-pending', status: 'pending', isAssigned: true, createdAt: '2026-01-01T00:00:00.000Z' },
    { id: 'newer-unassigned', status: 'active', isAssigned: false, createdAt: '2026-02-01T00:00:00.000Z' },
  ];

  assert.deepEqual(
    sortAndFilterManageFarms(farms).map((farm) => farm.id),
    ['newer-unassigned', 'new-pending', 'old-active'],
  );

  assert.deepEqual(
    sortAndFilterManageFarms(farms, { status: 'draft' }).map((farm) => farm.id),
    ['newer-unassigned'],
  );
});

test('shouldResetManageFarmsSession ignores number/string representation changes', () => {
  assert.equal(shouldResetManageFarmsSession(1, '1'), false);
  assert.equal(shouldResetManageFarmsSession('123456', 123456), false);
  assert.equal(shouldResetManageFarmsSession(123456, 654321), true);
});

test('calculateFieldCropAreaTotal sums fruit, vegetable, and fodder areas safely', () => {
  const total = calculateFieldCropAreaTotal({
    fruits: [
      { area: 10 },
      { area: '2.34' },
    ],
    vegetables: [
      { area: 4 },
      { area: null },
    ],
    fieldCropsFodder: [
      { area: 6 },
      { area: -4 },
    ],
  });

  assert.equal(total, 22.34);
});

test('calculateFruitProduction uses fruit-bearing trees and production value', () => {
  const total = calculateFruitProduction(
    { fruitBearing: 12 },
    { productionValue: 3.5 },
  );

  assert.equal(total, 42);
});

test('calculateRowProduction multiplies area and production value', () => {
  assert.equal(
    calculateRowProduction({ area: '2.5' }, { productionValue: '4' }),
    10,
  );
});

test('calculateGreenhouseArea multiplies house area by greenhouse count', () => {
  assert.equal(calculateGreenhouseArea('12.5', 3), 37.5);
});

test('calculateGreenhouseProduction uses crop production value from the crops table', () => {
  assert.equal(calculateGreenhouseProduction(37.5, { productionValue: 1.2 }), 45);
});
