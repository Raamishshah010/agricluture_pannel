import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFarmDataFromFarmer,
  calculateFieldCropAreaTotal,
  calculateFruitProduction,
  calculateGreenhouseArea,
  calculateGreenhouseProduction,
  calculateRowProduction,
  findFarmerByEmiratesId,
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
