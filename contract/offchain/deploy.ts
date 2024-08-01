import dotenv from "dotenv";
import { Lucid } from "lucid-cardano";
import { lucidBase } from "./endpoints";
import { deployScripts } from "./operations/operations";
import * as fs from "fs";

dotenv.config();
export const deploy = async () => {
  const lucid = await lucidWithSeed();
  const { txHash, mintingPolicyId, orderAddress } = await deployScripts(lucid);
  return { txHash, mintingPolicyId, orderAddress };
};

const lucidWithSeed = async (): Promise<Lucid> => {
  const lucid = await lucidBase();
  return lucid.selectWalletFromSeed(process.env.SEED as string);
};

const references = (txHash: string) => {
  return `txHash=${txHash}\n`;
};

const { txHash, mintingPolicyId, orderAddress } = await deploy();

fs.writeFile("./operations/referenceScripts.txt", references(txHash), "utf8", (err) => {
  if (err) throw err;
  console.log("Reference scripts file updated!");
});

fs.writeFile("./operations/policyId.txt", mintingPolicyId, "utf8", (err) => {
  if (err) throw err;
  console.log("Policy ID file updated!");
});

fs.writeFile("../../webapp/utils/orderAddress.txt", orderAddress, "utf8", (err) => {
  if (err) throw err;
  console.log("Order address file updated!");
});
