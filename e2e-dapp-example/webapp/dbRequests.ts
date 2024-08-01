import { UtxoOrderInfo } from "./utils/parameters";

export interface OrderSchema {
  txHash: string,
  senderAddress: string,
  sendAmount: number,
  sAssetClass: [string, string],
  receiveAmount: number,
  rAssetClass: [string, string],
}

export const makeRequest = async (url: string, body: any) => {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    const { message, error } = json
    if (message) {
      console.log(message)
      return json
    } else {
      console.log(error)
      return error
    }
  } catch (error) {
    console.log(error)
    alert(error)
  }
}

export const createUser = async (addr: string) => {
  makeRequest(`/api/createUser`, { addr })
}


export const userOrders = async (userAddress: string): Promise<UtxoOrderInfo[]> => {
  const response = await makeRequest(`/api/userOrder`, { userAddress })
  const orders = JSON.parse(response.orders)
  return orders
}

export const updateDB = async (addr: string) => {
  makeRequest(`/api/updateDB`, addr)
}
