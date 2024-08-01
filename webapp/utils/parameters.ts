export type startParams = {
    sendAmount: number,
    sAssetClass: [string, string],
    rAssetClass: [string, string],
    receiveAmount: number
}

export type UtxoOrderInfo = {
    txHash: string;
    sender: string;
    sAmount: number;
    sAsset: [string, string];
    receiver?: string;
    rAmount: number;
    rAsset: [string, string];
    consumed: boolean;
}

export type ObsState = {
    ordersInfo: UtxoOrderInfo[],
    networkId: number | undefined
}

export type DatumInfo = {
    senderWallet: [string, string],
    rAmount: number,
    rAsset: [string, string]
    eAsset: [string, string]
}

export type DatumForDb = {
    senderAddress: string,
    receiveAmount: number,
    rAssetClass: [string, string]
}

export type OuraTxInfo = {
    hash: string,
    inputs: [OuraInputInfo],
    outputs: [OuraOutputInfo],
    type: string
}

export type OuraInputInfo = {
    tx_id : string,
    index: number
}

export type OuraOutputInfo = {
    address: string,
    amount: number,
    assets: [OuraAssetInfo],
    datum_hash: string,
    inline_datum: {
        datum_hash: string,
        plutus_data: object
    }
}

export type OuraAssetInfo = {
    policy: string,
    asset: string,
    asset_ascii: string,
    amount: number
}
