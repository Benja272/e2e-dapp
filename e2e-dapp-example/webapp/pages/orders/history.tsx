import React, { useContext, useEffect, useState } from "react";
import DisplayOrders from "../../components/Table";
import { OrderBookContext } from "../../components/Layout";
import { UtxoOrderInfo } from "../../../webapp/utils/parameters";

export default function History() {
  const { currentContractState, lucidState, account } =
    useContext(OrderBookContext);
  const [ordersInfo, setOrdersInfo] = useState<UtxoOrderInfo[]>([]);
  useEffect(() => {
    if (lucidState) {
      const filteredOrders = currentContractState.ordersInfo.filter(
        (order) =>
          order.consumed == true &&
          (order.receiver == account.address || order.sender == account.address)
      );
      setOrdersInfo(filteredOrders);
    }
  }, [currentContractState]);
  return (
    <>
      <DisplayOrders
        header="Order History"
        operation="history"
        ordersInfo={ordersInfo}
        buttonText=""
        buttonColor=""
      ></DisplayOrders>
    </>
  );
}
