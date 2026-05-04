import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFarmDataFromFarmer,
  calculateFieldCropAreaTotal,
  calculateFruitProduction,
  calculateGreenhouseArea,
  calculateGreenhouseProduction,
  calculateRowProduction,
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

test('calculateFieldCropAreaTotal sums area safely', () => {
  const total = calculateFieldCropAreaTotal([
    { area: 10 },
    { area: '2.345' },
    { area: null },
    { area: -4 },
  ]);

  assert.equal(total, 12.35);
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

test('calculateGreenhouseProduction uses calculated crop area and production value', () => {
  assert.equal(calculateGreenhouseProduction(37.5, { productionValue: 1.2 }), 45);
});
