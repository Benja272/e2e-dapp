import { ButtonWithSpinner } from "../utils/functions";
import { ObsState, UtxoOrderInfo } from "../utils/parameters";
import { userOrders } from "../dbRequests";
import { useEffect } from "react";
import { Lucid } from "lucid-cardano";
import { FiRefreshCw } from "react-icons/fi"


type ReloadProps = {
    isConnected: boolean
    setCurrentContractState: React.Dispatch<React.SetStateAction<ObsState>>
    currentContractState: ObsState
    lucidState: Lucid | undefined
  };

  // Reload component that reloads the contract state
export const Reload = ({ isConnected, currentContractState, setCurrentContractState, lucidState }: ReloadProps) => {
    const reload = async () => {
      if (!lucidState) {
        throw new Error("Cannot connect with lucid :(")
      }
      console.log("Reloading...")
      const userAddress = await lucidState.wallet.address()
      const ordersInfo: UtxoOrderInfo[] = await userOrders(userAddress);
      const obsState: ObsState = {
        ordersInfo: ordersInfo,
        networkId: currentContractState.networkId
      }
      setCurrentContractState(obsState)
    }

    useEffect(() => {
      if (isConnected) {
        reload();
      }
    }, [isConnected]);

    return (
      <ButtonWithSpinner
        onClick={reload}
        isDisabled={!isConnected}
        text={<FiRefreshCw />}
      />
    )
  }
