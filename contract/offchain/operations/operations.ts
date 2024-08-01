import {
  getAddressCredentials,
  getSenderInfo,
  toBech32,
  getCredentials,
  getOutputWithAddress,
  getReferenceUTxO,
} from "./lib/utils";
import { mkRedeemer, mkOrderDatum, getDatumInfo } from "./lib/types";
import { startParams, UtxoOrderInfo, DatumForDb } from "./lib/parameters";
import { label, minAda, controlTokenName, referenceTxHash } from "./lib/constants";
import {
  Data,
  toUnit,
  fromUnit,
  Lucid,
  fromText,
  OutRef,
  UTxO,
  Tx,
  TxComplete,
} from "lucid-cardano";

let validatorRefUTxO: UTxO;

const setupReferences = async (lucid: Lucid) => {
  validatorRefUTxO = await getReferenceUTxO(referenceTxHash, lucid);
};

const spendScriptUTxO = (
  tx: Tx,
  utxos: UTxO[],
  validatorRefUTxO: any,
  redeemer: string,
  signerPkh: string,
): Tx => {
  return tx.collectFrom(utxos, redeemer).readFrom([validatorRefUTxO]).addSignerKey(signerPkh);
};

const mintControlToken = (
  tx: Tx,
  controlTokenUnit: string,
  mintingRefUTxO: any,
  mint: number,
): Tx => {
  return tx
    .mintAssets({ [controlTokenUnit]: BigInt(mint) }, Data.void())
    .readFrom([mintingRefUTxO]);
};

const balance = async (tx: Tx, metadata: string): Promise<TxComplete> => {
  return await tx.attachMetadata(label, { msg: [metadata] }).complete();
};

const assetsToPay = (startParams: startParams, controlTokenUnit: string) => {
  let senderAsset: string = "";
  const assets = {
    [controlTokenUnit]: BigInt(1),
    lovelace: minAda,
  };
  if (startParams.sAssetClass[0] !== "") {
    senderAsset = toUnit(startParams.sAssetClass[0], fromText(startParams.sAssetClass[1]));
    assets[senderAsset] = BigInt(startParams.sendAmount);
  } else {
    assets["lovelace"] = minAda + BigInt(startParams.sendAmount);
  }
  return assets;
};

const orderStart = async (startParams: startParams, senderAddress: string, lucid: Lucid) => {
  const { orderAddress, mintingPolicyId } = getCredentials(lucid);
  const sCredentials = getAddressCredentials(senderAddress);
  const senderPkh = sCredentials[0];

  const controlTokenUnit = toUnit(mintingPolicyId, fromText(controlTokenName));
  const rAssetClass: [string, string] = [
    startParams.rAssetClass[0],
    fromText(startParams.rAssetClass[1]),
  ];
  const eAssetClass: [string, string] = [mintingPolicyId, fromText(controlTokenName)];
  const assets = assetsToPay(startParams, controlTokenUnit);
  const datum: string = mkOrderDatum(
    sCredentials,
    startParams.receiveAmount,
    rAssetClass,
    eAssetClass,
  );

  const tx = lucid
    .newTx()
    .payToContract(orderAddress, { inline: datum }, assets)
    .addSignerKey(senderPkh);
  const txMint = mintControlToken(tx, controlTokenUnit, validatorRefUTxO, 1);
  const txBalanced = await balance(txMint, "Start Order");
  const index = getOutputWithAddress(txBalanced, orderAddress);
  console.log(`Transaction: ${txBalanced}`);
  return { txBalanced, index: index };
};

const orderResolve = async (txOutRef: OutRef, receiverAddress: string, lucid: Lucid) => {
  const receiverPkh = getAddressCredentials(receiverAddress)[0];

  const utxos = await lucid.utxosByOutRef([txOutRef]);
  const datum = getDatumInfo(utxos[0].datum);
  const senderAddress = toBech32(lucid, datum.senderWallet);
  const orderRedeemer = mkRedeemer("ResolveOrder");

  const tx = spendScriptUTxO(lucid.newTx(), utxos, validatorRefUTxO, orderRedeemer, receiverPkh);
  const txMint = mintControlToken(tx, datum.controlTokenUnit, validatorRefUTxO, -1).payToAddress(
    senderAddress,
    {
      [datum.receiverUnit]: BigInt(datum.rAmount),
    },
  );
  const txBalanced = await balance(txMint, "Resolve Order");
  console.log(`Transaction: ${txBalanced}`);
  return txBalanced;
};

const orderCancel = async (txOutRef: OutRef, senderAddress: string, lucid: Lucid) => {
  const { orderAddress } = getCredentials(lucid);
  const sCredentials = getAddressCredentials(senderAddress);
  const senderPkh = sCredentials[0];
  const utxoAtScript = await lucid.utxosAt(orderAddress);
  const ourUTxO: UTxO[] = utxoAtScript.filter((utxo) => utxo.txHash == txOutRef.txHash);
  const datum = getDatumInfo(ourUTxO[0].datum);
  const orderRedeemer = mkRedeemer("CancelOrder");

  const tx = spendScriptUTxO(lucid.newTx(), ourUTxO, validatorRefUTxO, orderRedeemer, senderPkh);
  const txMint = mintControlToken(tx, datum.controlTokenUnit, validatorRefUTxO, -1);
  const txBalanced = await balance(txMint, "Cancel Order");
  console.log(`Transaction: ${txBalanced}`);
  return txBalanced;
};

const orderReload = async (lucid: Lucid): Promise<UtxoOrderInfo[]> => {
  const { orderAddress } = getCredentials(lucid);
  const utxos = await lucid.utxosAt(orderAddress);
  const utxosInfo: UtxoOrderInfo[] = [];
  for (const utxo of utxos) {
    const datum = getDatumInfo(utxo.datum);
    if (utxo.assets[datum.controlTokenUnit] == BigInt(1)) {
      const senderInfo = getSenderInfo(utxo, datum.eAsset);
      const senderAsset = fromUnit(senderInfo[0]);
      if (!senderAsset.assetName) {
        senderAsset.assetName = fromText("lovelace");
      }
      const senderBech32 = toBech32(lucid, datum.senderWallet);
      const info: UtxoOrderInfo = {
        txHash: utxo.txHash,
        txOutRef: utxo.outputIndex,
        sender: senderBech32,
        sAmount: Number(senderInfo[1]),
        sAsset: [senderAsset.policyId, senderAsset.assetName],
        rAmount: datum.rAmount,
        rAsset: datum.rAsset,
        consumed: false,
      };
      utxosInfo.push(info);
    }
  }
  return utxosInfo;
};

const datumInfo = async (plutusData: any, lucid: Lucid): Promise<DatumForDb> => {
  const eInfoFields = plutusData.fields[0].fields;
  const rValue = eInfoFields[2].fields;
  const rAmount = Number(rValue["[1][int]"]);
  const rAssetClass: [string, string] = [
    rValue["[0][fields][0][bytes]"],
    rValue["[0][fields][1][bytes]"],
  ];
  const senderAddr = toBech32(lucid, [eInfoFields[0].bytes, eInfoFields[1].bytes]);
  return {
    senderAddress: senderAddr,
    receiveAmount: rAmount,
    rAssetClass: rAssetClass,
  };
};

const deployScripts = async (lucid: Lucid) => {
  const { burnAddress, validatorScript, mintingPolicyId, orderAddress } = getCredentials(lucid);
  const tx = await lucid
    .newTx()
    .payToContract(burnAddress, { inline: Data.void(), scriptRef: validatorScript }, {})
    .complete();
  const txSigned = await tx.sign().complete();
  const txHash = await txSigned.submit();
  console.log(`Transaction submitted. TxHash: ${txHash}`);
  return { txHash, mintingPolicyId, orderAddress };
};

export {
  orderStart,
  orderReload,
  orderResolve,
  orderCancel,
  deployScripts,
  setupReferences,
  datumInfo,
};
