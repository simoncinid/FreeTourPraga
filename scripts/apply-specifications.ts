import { mkdir, readFile, writeFile } from "node:fs/promises";
import { applySpecifications } from "../src/lib/platform/specifications";
import {
  readState,
  transaction,
  localMode,
  database,
} from "../src/lib/platform/store";
const apply = process.argv.includes("--apply");
// This command deliberately targets the selected storage; no remote credentials are loaded.
if (!localMode())
  throw Error(
    "Usa PLATFORM_STORAGE=local. Per PostgreSQL prepara il trasferimento con la procedura di rilascio.",
  );
const before = await readState();
const preview = applySpecifications(structuredClone(before));
console.log(JSON.stringify({ apply, ...preview }));
if (apply && preview.applied) {
  await mkdir("privato", { recursive: true, mode: 0o700 });
  await writeFile(
    `privato/before-specifications-${Date.now()}.json`,
    await readFile(process.env.PLATFORM_DATA_FILE || ".data/platform.json"),
    { mode: 0o600, flag: "wx" },
  );
  await transaction((s) => applySpecifications(s));
}
await database().$disconnect();
