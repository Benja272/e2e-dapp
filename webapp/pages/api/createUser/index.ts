import type { NextApiRequest, NextApiResponse } from 'next'
import { getOrCreateUser } from '../controllers';


// POST /api/createUser
// Required fields in body: addr
export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  try{
    await getOrCreateUser(req.body.addr)
    res.json({ message:"Create User Ok"});
  }
  catch (e) {
    res.status(401).json({ error: e })
  }
}