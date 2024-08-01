import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { Lucid } from "lucid-cardano";
import { createUser, updateDB } from "../dbRequests";
import { useCardano, CardanoWalletSelector, Account } from "use-cardano";

type ConnectProps = {
  setIsConnected: React.Dispatch<React.SetStateAction<boolean>>;
  setLucidState: React.Dispatch<React.SetStateAction<Lucid | undefined>>;
  setAccountState: React.Dispatch<React.SetStateAction<Account | undefined>>;
};

export const Connect = ({
  setIsConnected,
  setLucidState,
  setAccountState,
}: ConnectProps) => {
  const router = useRouter();
  const { lucid, account } = useCardano();

  useEffect(() => {
    if (account.address) {
      updateDB("");
      createUser(account.address);
      router.push("/orders/all-orders");
    }
    setIsConnected(!!account.address);
    setLucidState(lucid);
    setAccountState(account);
  }, [account.address]);

  return <CardanoWalletSelector />;
};
