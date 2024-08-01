import React, { useContext } from "react";
import { orderOperations, submit } from "../utils/orders-operations";
import { OutRef } from "lucid-cardano";
import { ButtonWithSpinner } from "../utils/functions";
import { OrderBookContext } from "./Layout";

type OrderProps = {
  txOutRef: OutRef;
  operation: string;
  buttonText: string;
  buttonColor: string;
};

const OrdersButton = ({
  txOutRef,
  operation,
  buttonText,
  buttonColor,
}: OrderProps) => {
  const { isConnected, lucidState, account } = useContext(OrderBookContext);
  const handleOrdersClick = async () => {
    console.log(`Resolving order for ref: ${txOutRef}`);
    if (!lucidState) {
      throw new Error("Cannot connect with lucid :(");
    }

    try {
      const { tx } = await orderOperations(
        operation,
        lucidState,
        null,
        txOutRef
      );
      const signedTx = await tx.sign().complete();
      const txHash = await submit(signedTx.toString());
      console.log(`TX HASH: ${txHash.toString()}`);
      alert(`${buttonText} succeeded. Tx hash: ${txHash}`);
    } catch (e) {
      const errorMessage = e.response?.data?.error || e;
      alert(`${buttonText} failed. ${errorMessage}`);
    }
  };

  return (
    <ButtonWithSpinner
      onClick={handleOrdersClick}
      isDisabled={!isConnected}
      text={buttonText}
      color={buttonColor}
    />
  );
};

export default OrdersButton;
