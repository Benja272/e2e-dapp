import { Lucid, fromUnit, toText } from "lucid-cardano";
import { useState } from "react"
import { Button } from '@chakra-ui/react';

// Function to get all tokens in the wallet. Returns a dictionary in the format {tokenName: [currency, amount]}
const getTokens = async (lucid: Lucid) => {
  const addr = await lucid.wallet.address();
  const utxos = await lucid.utxosAt(addr);
  const tokensDict: { [key: string]: [string, string]} = {};

  for (const utxo of utxos) {
    const assets = utxo.assets;
    if (typeof assets === "object" && assets !== null) {
      const rawData = Object.keys(assets);
      for (const token of rawData) {
        const hexData = fromUnit(token).assetName || "";
        const tokenName: string = hexData.length > 32 // Avoid converting tokens that the name is already in utf8
          ? hexData
          : toText(hexData) || "lovelace";
        const amount: string = String(assets[token]);
        const currency: string = fromUnit(token).policyId;
        if (tokensDict[tokenName]) {
          tokensDict[tokenName][1] = String(BigInt(tokensDict[tokenName][1]) + BigInt(amount));
        } else {
          tokensDict[tokenName] = [(currency === "lovelace" ? "" : currency), amount];
        }
      }
    }
  }
  return tokensDict;
};


type ButtonWithSpinnerProps = {
  onClick: () => Promise<void>
  isDisabled: boolean
  text: string | JSX.Element
  color?: string
}

const ButtonWithSpinner = ({ onClick, isDisabled, text, color }: ButtonWithSpinnerProps) => {
  const [isSpinning, setIsSpinning] = useState(false);

  const handleOnClick = async () => {
    setIsSpinning(true)
    await onClick()
    setIsSpinning(false)
  }

  return (
    <Button
      variant="solid"
      colorScheme={color || "teal"}
      size="sm"
      isDisabled={isDisabled}
      onClick={handleOnClick}
      isLoading={isSpinning}
    >
      {text}
    </Button>
  );
};


export { getTokens, ButtonWithSpinner };