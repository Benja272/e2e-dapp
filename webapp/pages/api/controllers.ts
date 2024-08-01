import prisma from '../../prisma/prisma'
import { User, Asset, Order } from '@prisma/client'
import { type OrderSchema } from '../../dbRequests'
import { getDatumInfo, orderReload } from '../../utils/orders-operations'
import { DatumForDb, OuraAssetInfo, OuraInputInfo, OuraOutputInfo, OuraTxInfo } from '../../utils/parameters'
import { minAda, orderAddress } from '../../utils/constants'

const getOrCreateAsset = async (currencyId: string, name: string): Promise<Asset> => {
    const asset = await prisma.asset.findFirst({
        where: {
            currencyId: currencyId,
            name: name
        }
    })
    if (!asset) {
        const result = await prisma.asset.create({
            data: {
                currencyId: currencyId,
                name: name
            },
        });
        return result
    } else {
        return asset
    }
}


export const getOrCreateUser = async (address: string): Promise<User> => {
    const user = await prisma.user.findUnique({
        where: { address: address }
    })
    if (!user) {
        const result = await prisma.user.create({
            data: {
                address: address,
            },
        });
        return result
    } else {
        return user
    }
}


export const getOrCreateOrder = async (params: OrderSchema): Promise<Order> => {
    const { txHash } = params;
    const order = await prisma.order.findUnique({
        where: { txHash: txHash }
    })
    if (!order) {
        const result = await createOrder(params)
        return result
    } else {
        console.log("Order Already Exists", order)
        return order
    }
}


export const consumeOrder = async (txHash: string, receiverAddress: string | undefined): Promise<Order> => {
    const order = await prisma.order.findUnique({
        where: { txHash: txHash }
    })
    if (!order) {
        throw "Order not found"
    } else {
        const receiver = receiverAddress ? await getOrCreateUser(receiverAddress) : undefined
        const result = await prisma.order.update({
            where: { txHash: txHash },
            data: {
                consumed: true,
                receiverAddress: receiver ? receiver.address : order.receiverAddress
            }
        })
        console.log("Order Consumed ", result)
        return result
    }
}


export const allUsers = async (): Promise<User[]> => {
    const users = await prisma.user.findMany()
    return users
}


export const updateOrders = async (params: OrderSchema[]): Promise<Order[]> => {
    const ordersInDB = await prisma.order.findMany({
        where: { consumed: false }
    })
    const hashesInDB = ordersInDB.map(order => order.txHash)
    const ordersToInclude = params.filter(order => !hashesInDB.includes(order.txHash))
    const ordersToConsume = hashesInDB.filter(hash => !params.map(order => order.txHash).includes(hash))

    var results = []
    for (const e of ordersToInclude) {
        const result = await createOrder(e)
        results.push(result)
    }
    for (const e of ordersToConsume) {
        const result = await consumeOrder(e, undefined)
        results.push(result)
    }
    return results
}


export const userOrders = async (): Promise<any[]> => {
    const orders = await prisma.order.findMany({
        include: { sendAsset: true, receiveAsset: true }
    })
    return orders
}

export const createOrder = async (e: OrderSchema): Promise<Order> => {
    const senderInDB = await getOrCreateUser(e.senderAddress);
    const sendAssetInDB = await getOrCreateAsset(e.sAssetClass[0], e.sAssetClass[1]);
    const receiveAssetInDB = await getOrCreateAsset(e.rAssetClass[0], e.rAssetClass[1])
    const result = await prisma.order.create({
        data: {
            txHash: e.txHash,
            senderAddress: senderInDB.address,
            sendAmount: e.sendAmount,
            sAssetClass: sendAssetInDB.id,
            receiveAmount: e.receiveAmount,
            rAssetClass: receiveAssetInDB.id
        }
    })
    console.log("Order Created ", result)
    return result
}


export const updateDB = async () => {
    console.log("Updating data base...")
    const ordersToUpdate: OrderSchema[] = []
    const ordersInfo = await orderReload();
    for (const info of ordersInfo) {
        const { txHash, sender, sAmount, sAsset, rAmount, rAsset } = info;
        const orderSchema = {
            txHash: txHash,
            senderAddress: sender,
            sendAmount: sAmount,
            sAssetClass: sAsset,
            receiveAmount: rAmount,
            rAssetClass: rAsset,
        }
        ordersToUpdate.push(orderSchema)
    }
    const result = await updateOrders(ordersToUpdate);
    return result
}

export const updateNewOrders = async (start_txs) => {
    start_txs.forEach(async (tx: OuraTxInfo) => {
        const orderOutput = tx.outputs.find((output) => output.address === orderAddress)
        if (orderOutput !== undefined) {
            const datumInfo: DatumForDb = await getDatumInfo(orderOutput.inline_datum.plutus_data)
            const assets: [OuraAssetInfo] = orderOutput.assets
            let sAssetClass: [string, string] = ["", ""]
            let sAmount: number = 0
            if (assets.length > 1) {
                const sentAssets = assets.filter(asset => asset.asset_ascii !== "controlToken")
                const sentAsset = sentAssets[0]
                sAssetClass = [sentAsset.policy, sentAsset.asset]                                        
                sAmount = sentAsset.amount
            } else {
                sAmount = orderOutput.amount - minAda
            }
            await createOrder({
                senderAddress: datumInfo.senderAddress,
                receiveAmount: datumInfo.receiveAmount,
                rAssetClass: datumInfo.rAssetClass,
                sendAmount: sAmount,
                sAssetClass: sAssetClass,
                txHash: tx.hash
            })
        }        
    })
}

export const updateConsumedOrders = async (burn_txs) => {
    burn_txs.forEach(async (tx: OuraTxInfo) => {
        const order = await findOrderInput(tx.inputs)
        if (order) {
            const receiverOutputs = tx.outputs.filter(output => output.address !== order.senderAddress)
            if (receiverOutputs.length !== 0) {
                const receiverAddress = receiverOutputs[0].address
                await consumeOrder(order.txHash, receiverAddress)
            } else {
                await consumeOrder(order.txHash, undefined)
            }
        }
    })
}

const findOrderInput = async (inputs: [OuraInputInfo]) => {
    const indexZeroInputs = inputs.filter((input) => input.index === 0)
    for (const input of indexZeroInputs) {
        const order = prisma.order.findFirst({
            where: {
                txHash: input.tx_id,
            }
        })
        if (order) {
            return order
        }
    }
    return null
}
