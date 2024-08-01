import {
    Blockfrost,
    Lucid, Network, TxSigned
  } from "lucid-cardano";
import { orderResolve, orderStart, orderCancel, orderReload, datumInfo } from "./operations/operations"


export const reload = async (body: any) => {
    const lucid = await lucidBase()
    const orders = await orderReload(lucid)
    return {orders: orders};
}

export const start = async (body: any) => {
    const lucid = await lucidWithWallet(body.address)
    const {txBalanced, index} = await orderStart(body.startParams, body.address, lucid)
    return {tx: txBalanced.toString(), index: index};
}

export const cancel = async (body: any) => {
    const lucid = await lucidWithWallet(body.address)
    const tx = await orderCancel(body.txOutRef, body.address, lucid)
    return {tx: tx.toString()};
}

export const resolve = async (body: any) => {
    const lucid = await lucidWithWallet(body.address)
    body.txOutRef.outputIndex = parseInt(body.txOutRef.outputIndex)
    const tx = await orderResolve(body.txOutRef, body.address, lucid)
    return {tx: tx.toString()};
}

export const submit = async (body: any) => {
    const lucid = await lucidBase()
    const tx = new TxSigned(lucid, lucid.fromTx(body.tx).txComplete)
    const txHash = await tx.submit()
    return {txHash: txHash};
}

export const datum = async (body: any) => {
    const lucid = await lucidBase()
    const datumForDb = await datumInfo(body.plutusData ,lucid)
    return {datumInfo: datumForDb};
}


export const lucidBase = async (): Promise<Lucid> => {
    let lucid = await Lucid.new(
        new Blockfrost("https://cardano-preprod.blockfrost.io/api/v0", process.env.BLOCKFROST_PROJECT_ID),
        process.env.NETWORK as Network,
        );
    return lucid;
}


const lucidWithWallet = async (address: string): Promise<Lucid> => {
    const lucid = await lucidBase()
    return lucid.selectWalletFrom({address: address})
}
