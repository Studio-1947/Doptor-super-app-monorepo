/*
 * Runs every *.smoke.js in this directory in order, against a running API.
 * Exits non-zero if any suite fails. See README.md for prerequisites.
 */
const { readdirSync } = require("fs");
const { join } = require("path");
const { spawnSync } = require("child_process");

const dir = __dirname;
const suites = readdirSync(dir)
  .filter((f) => f.endsWith(".smoke.js"))
  .sort();

let failed = 0;
for (const suite of suites) {
  console.log(`\n─── ${suite} ───`);
  const res = spawnSync(process.execPath, [join(dir, suite)], {
    stdio: "inherit",
    env: process.env,
  });
  if (res.status !== 0) failed++;
}

console.log(
  `\n=== ${suites.length - failed}/${suites.length} suite(s) passed ===`,
);
process.exit(failed === 0 ? 0 : 1);
