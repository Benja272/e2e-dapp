import type { NextApiRequest, NextApiResponse } from 'next'
import { userOrders } from '../controllers';
import { UtxoOrderInfo } from '../../../utils/parameters'


// POST /api/userOrders
// Required fields in body: userAddress
export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  try {
    const orders = await userOrders()
    const utxos: UtxoOrderInfo[] = []
    orders.forEach((e) => {
      utxos.push({
        txHash: e.txHash,
        sender: e.senderAddress,
        sAmount: e.sendAmount,
        sAsset: [e.sendAsset.currencyId, e.sendAsset.name],
        receiver: e.receiverAddress,
        rAmount: e.receiveAmount,
        rAsset: [e.receiveAsset.currencyId, e.receiveAsset.name],
        consumed: e.consumed
      })
    })
    res.json({ orders: JSON.stringify(utxos), message: "User Orders Ok" });
  }
  catch (e) {
    res.status(401).json({ error: e })
  }
}
