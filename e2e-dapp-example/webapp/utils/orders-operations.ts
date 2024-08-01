import { UtxoOrderInfo, DatumForDb } from "./parameters"
import { Lucid, OutRef } from "lucid-cardano";
import axios from 'axios';


const orderReload = async (): Promise<UtxoOrderInfo[]> => {
  return axios.get('http://localhost:3001/reload')
    .then(function (response) {
      if (response.status === 200) {
        const ordersInfo: UtxoOrderInfo[] = response.data.orders
        return ordersInfo;
      }
      throw alert("Unexpected response status")
    })
    .catch((error) => {
      throw alert("Reload failed. " + error.message);
    });
}


const endpoints: { [index: string]: any; } = {
  "start": 'http://localhost:3001/start',
  "resolve": 'http://localhost:3001/resolve',
  "cancel": 'http://localhost:3001/cancel',
  "submit": 'http://localhost:3001/submit',
  "datum": 'http://localhost:3001/datum',
}

const orderOperations = async (key: string, lucid: Lucid, orderParams?: any, txOutRef?: OutRef): Promise<any> => {
  const addr = await lucid.wallet.address();
  const paramsField = key.concat("Params");
  return axios.get(endpoints[key], {
    params: {
      [paramsField]: orderParams || null,
      address: addr,
      txOutRef: txOutRef || null,
    }
  })
    .then((response) => {
      if (response.status === 200) {
        return { tx: lucid.fromTx(response.data.tx), index: response.data.index }
      }
      throw response
    })
    .catch((error) => {
      throw error
    });
}

const submit = async (tx: string): Promise<string> => {
  return axios.get(endpoints['submit'], {
    params: {
      tx: tx,
    }
  })
    .then((response) => {
      if (response.status === 200) {
        return response.data.txHash
      }
      throw response
    })
}

const getDatumInfo = async (plutusData: object): Promise<DatumForDb> => {
  return axios.get(endpoints['datum'], {
    params: {
      plutusData: plutusData,
    }
  })
    .then((response) => {
      if (response.status === 200) {
        return response.data.datumInfo
      }
      throw response
    })
    .catch((error) => {
      throw error
    });
}

export { orderReload, orderOperations, submit, getDatumInfo }
