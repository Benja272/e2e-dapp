export type startParams = {
    sendAmount: number,
    sAssetClass: [string, string],
    rAssetClass: [string, string],
    receiveAmount: number
}

export type UtxoOrderInfo = {
    txHash: string;
    txOutRef: number;
    sender: string;
    sAmount: number;
    sAsset: [string, string];
    rAmount: number;
    rAsset: [string, string];
    consumed: boolean
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
    receiverUnit: string
    controlTokenUnit: string
}

export type DatumForDb = {
    senderAddress: string,
    receiveAmount: number,
    rAssetClass: [string, string]
}

export type TxInput = {
    address: string,
    amount: [ TxInputAsset ],
    tx_hash: string,
    output_index: number,
    data_hash: string,
    inline_datum: string,
    reference_script_hash: string,
    collateral: boolean,
    reference: boolean
}

export type TxInputAsset = {
    unit: string,
    quantity: string
}
