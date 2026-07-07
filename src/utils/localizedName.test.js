import test from "node:test";
import assert from "node:assert/strict";
import { getLocalizedPersonName } from "./localizedName.js";

test("normalizes UAE Pass comma-delimited names and removes empty trailing parts", () => {
  const person = {
    uaePassProfile: {
      fullnameEN: "HASAN,AHMAD,KAYALI,,,,",
      fullnameAR: "حسن,احمد,كيالي,,,,",
    },
  };

  assert.equal(getLocalizedPersonName(person, "en"), "HASAN AHMAD KAYALI");
  assert.equal(getLocalizedPersonName(person, "ar"), "حسن احمد كيالي");
});

test("falls back to farmer fullnameEN when Arabic-specific fields are missing", () => {
  const person = {
    fullnameEN: "Aisha Khan",
  };

  assert.equal(getLocalizedPersonName(person, "ar"), "Aisha Khan");
});
