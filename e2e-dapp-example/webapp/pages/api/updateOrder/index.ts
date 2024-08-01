import type { NextApiRequest, NextApiResponse } from 'next'
import { updateConsumedOrders, updateNewOrders } from '../controllers'

// POST /api/updateOrder
export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  console.log("Updating data base with orders info...")
  try{
    if (req.body.start_txs) {
      await updateNewOrders(req.body.start_txs)
    }
    if (req.body.burn_txs) {
      await updateConsumedOrders(req.body.burn_txs)
    }
    res.json({ message:"DB Updated with orders info"});
  }
  catch (e) {
    res.status(401).json({ error: e })
  }
}
