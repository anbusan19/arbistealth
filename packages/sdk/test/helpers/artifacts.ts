import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { Abi, Hex } from "viem";

const here = path.dirname(fileURLToPath(import.meta.url));
const contractsOut = path.resolve(here, "../../../../contracts/out");

export interface Artifact {
  abi: Abi;
  bytecode: Hex;
}

export function loadArtifact(contractFile: string, contractName: string): Artifact {
  const jsonPath = path.join(contractsOut, contractFile, `${contractName}.json`);
  const parsed = JSON.parse(readFileSync(jsonPath, "utf-8"));
  return { abi: parsed.abi, bytecode: parsed.bytecode.object };
}
