# Contract Endpoints

## Start Order

**url:** /start
PARAMETERS:
>
>    1. startParams: StartParams
>    2. address: Connected Address(bech32)

>StartParams:
    >>receiverAddress: string,
    sendAmount: number,
    sAssetClass: [string, string],
    rAssetClass: [string, string],
    receiveAmount: number

RESPONSE:
> tx: balanced tx

## Resolve Order

**url:** /resolve
PARAMETERS:
>
>    1. txOutRef: OutRef (UTxO)
>    2. address: Connected Address(bech32)

>OutRef:
    >>txHash: string,
    outputIndex: number

RESPONSE:
> tx: balanced tx

## Cancel Order

**url:** /cancel
PARAMETERS:
>
>    1. txOutRef: OutRef (UTxO)
>    2. address: Connected Address(bech32)

>OutRef:
    >>txHash: string,
    outputIndex: number

RESPONSE:
> tx: balanced tx
>
## Reload

**url:** /reload
PARAMETERS:
>
>    1. address: Connected Address(bech32)

RESPONSE:
> Orders: list of Orders with address as receiver address.

## Submit

**url:** /submit
PARAMETERS:
> tx: Transaction signed cbor
RESPONSE:
> txHash: Hash of the submited transaction
