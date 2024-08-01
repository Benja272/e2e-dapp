import React, { useContext, useEffect, useState } from "react";
import DisplayOrders from "../../components/Table";
import { OrderBookContext } from "../../components/Layout";
import { UtxoOrderInfo } from "../../../webapp/utils/parameters";

export default function AllOrders() {
  const { currentContractState, lucidState, account } =
    useContext(OrderBookContext);
  const [ordersInfo, setOrdersInfo] = useState<UtxoOrderInfo[]>([]);
  useEffect(() => {
    if (lucidState) {
      const filteredOrders = currentContractState.ordersInfo.filter(
        (order) => order.sender !== account.address && order.consumed == false
      );
      setOrdersInfo(filteredOrders);
    }
  }, [currentContractState]);
  return (
    <>
      <DisplayOrders
        header="All Orders"
        operation="resolve"
        ordersInfo={ordersInfo}
        buttonText="Resolve"
        buttonColor="messenger"
      ></DisplayOrders>
    </>
  );
}
