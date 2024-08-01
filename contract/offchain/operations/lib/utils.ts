import {
  Lucid,
  MintingPolicy,
  PolicyId,
  TxHash,
  AddressDetails,
  getAddressDetails,
  Script,
  UTxO,
  Credential,
  fromUnit,
  toUnit,
  applyDoubleCborEncoding,
  TxComplete,
  fromText,
} from "lucid-cardano";
import { orderScript, minAda, burnScript, controlTokenName } from "./constants";

const getPolicyId = (lucid: Lucid, mintingPolicy: MintingPolicy) => {
  const policyId: PolicyId = lucid.utils.mintingPolicyToId(mintingPolicy);

  return policyId;
};

const getAddressCredentials = (address: string): [string, string] => {
  const details: AddressDetails = getAddressDetails(address);
  if (!details.paymentCredential) {
    throw Error("Unable to obtain address credentials");
  }
  const paymentCredential = details.paymentCredential.hash;
  const stakingCredential = details.stakeCredential?.hash || "";

  return [paymentCredential, stakingCredential];
};

const toBech32 = (lucid: Lucid, credentials: [string, string]): string => {
  const paymentCredential: Credential = { type: "Key", hash: credentials[0] };
  const stakingCredential: Credential = { type: "Key", hash: credentials[1] };
  const det = lucid.utils.credentialToAddress(paymentCredential, stakingCredential);
  return det;
};

const getValidatorScript = (): Script => {
  const encodedScript: Script = {
    type: "PlutusV2",
    script: applyDoubleCborEncoding(orderScript.script),
  };
  return encodedScript;
};

const getSenderInfo = (utxo: UTxO, controlToken: [string, string]): [string, bigint] => {
  var senderAsset: [string, bigint] = ["lovelace", utxo.assets["lovelace"] - minAda];
  for (var key in utxo.assets) {
    const asset = fromUnit(key);
    if (asset.policyId != controlToken[0] && asset.assetName != null) {
      senderAsset = [key, utxo.assets[key]];
    }
  }
  return senderAsset;
};

const getCredentials = (lucid: Lucid) => {
  const burnAddress = lucid.utils.validatorToAddress(burnScript);
  const validatorScript: Script = getValidatorScript();
  const orderAddress = lucid.utils.validatorToAddress(validatorScript);
  const scriptCredentials = getAddressCredentials(orderAddress);

  const mintingPolicyId = getPolicyId(lucid, validatorScript);
  const controlTokenUnit = toUnit(mintingPolicyId, fromText(controlTokenName));

  return {
    validatorScript,
    orderAddress,
    scriptCredentials,
    mintingPolicyId,
    burnAddress,
    controlTokenUnit,
  };
};

const getOutputWithAddress = (tx: TxComplete, address: string): number | undefined => {
  const outputs = tx.txComplete.body().outputs();
  for (let i = 0; i < outputs.len(); i++) {
    const output = outputs.get(i);
    if (output.address().to_bech32(undefined) === address) {
      return i;
    }
  }
};

const getOutputWithScript = (tx: TxComplete, script: string): number | undefined => {
  const outputs = tx.txComplete.body().outputs();
  for (let i = 0; i < outputs.len(); i++) {
    const output = outputs.get(i);
    const ref = output.script_ref();
    if (ref) {
      const encoded = applyDoubleCborEncoding(ref?.to_js_value().PlutusScriptV2);
      if (encoded === script) {
        return i;
      }
    }
  }
};

const getReferenceUTxO = async (txHash: TxHash, lucid: Lucid): Promise<UTxO> => {
  const UTxOs = await lucid.utxosByOutRef([
    {
      txHash: txHash,
      outputIndex: 0,
    },
  ]);
  return UTxOs[0];
};

const getTxInfo = async (txHash: TxHash) => {
  const url = `https://cardano-preprod.blockfrost.io/api/v0/txs/${txHash}/utxos`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { project_id: String(process.env.BLOCKFROST_PROJECT_ID) },
    });
    const json = await res.json();
    return json;
  } catch (error) {
    console.log(error);
  }
};

export {
  getPolicyId,
  getAddressCredentials,
  getValidatorScript,
  getSenderInfo,
  toBech32,
  getCredentials,
  getOutputWithAddress,
  getOutputWithScript,
  getReferenceUTxO,
  getTxInfo,
};
