import { Script } from "lucid-cardano";
import * as fs from "fs";

const minAda: bigint = 2_000_000n;
const label: number = 674;

function readValidator(i: number): Script {
  const validator = JSON.parse(fs.readFileSync("../onchain/plutus.json", "utf-8")).validators[i];
  return {
    type: "PlutusV2",
    script: validator.compiledCode,
  };
}

function readReferences() {
  let referenceTxHash = "";
  const references = fs.readFileSync("./operations/referenceScripts.txt", "utf-8").split("\n");
  for (let i = 0; i < references.length; i++) {
    if (references[i].includes("txHash")) {
      referenceTxHash = references[i].split("=")[1].trim();
    }
  }
  return { referenceTxHash };
}

const burnScript: Script = {
  type: "PlutusV2",
  script: "581f581d01000022232632498cd5ce24810b6974206275726e7321212100120011",
};

const orderScript: Script = readValidator(0);
const controlTokenName = "controlToken";
const { referenceTxHash } = readReferences();

export { minAda, label, orderScript, controlTokenName, burnScript, referenceTxHash };
