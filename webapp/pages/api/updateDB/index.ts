import type { NextApiRequest, NextApiResponse } from 'next'
import { updateDB } from '../controllers';

// POST /api/updateDB
export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  try {
    await updateDB()
    res.json({ message: "DB Updated" });
  }
  catch (e) {
    res.status(401).json({ error: e })
  }
}
