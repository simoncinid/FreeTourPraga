import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const config = JSON.parse(await readFile(new URL("../deploy/railway-services.json", import.meta.url), "utf8"));
const query = "mutation($environmentId:String!,$serviceId:String!,$input:ServiceInstanceUpdateInput!){serviceInstanceUpdate(environmentId:$environmentId,serviceId:$serviceId,input:$input)}";
for (const [name, service] of Object.entries(config.services)) {
  const variables = JSON.stringify({ environmentId: config.environmentId, ...service });
  const result = spawnSync("railway", ["api", query, "--variables", variables, "--compact"], { encoding: "utf8" });
  if (result.status !== 0) throw Error(`Railway ${name}: ${result.stderr || result.stdout}`);
  console.log(`Railway ${name}: configuration applied`);
}
