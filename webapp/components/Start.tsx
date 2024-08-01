import React, { useState, useEffect } from "react";
import { orderOperations, submit } from "../utils/orders-operations";
import { startParams } from "../utils/parameters";
import { Lucid, type TxSigned } from "lucid-cardano";
import {
  FormControl,
  Button,
  FormHelperText,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Grid,
  ModalOverlay,
  ModalContent,
  GridItem,
  FormLabel,
  Box,
  Divider,
  Text,
} from "@chakra-ui/react";
import {
  AutoComplete,
  AutoCompleteInput,
  AutoCompleteItem,
  AutoCompleteList,
} from "@choc-ui/chakra-autocomplete";
import { getTokens } from "../utils/functions";

type StartProps = {
  showStartModal: boolean;
  setShowStartModal: React.Dispatch<React.SetStateAction<boolean>>;
  lucidState: Lucid | undefined;
};

// Component that displays the form for starting a new Order.
export const Start = ({
  showStartModal,
  setShowStartModal,
  lucidState,
}: StartProps) => {
  const [tokensList, setTokensList] = useState<{
    [key: string]: [string, string];
  }>({});
  const [selectedSendAsset, setSendAsset] = useState({
    sendCurrency: "",
    sendTokenName: "",
  });
  const [selectedReceiveAsset, setReceiveAsset] = useState({
    recCurrency: "",
    recTokenName: "",
  });
  const [maxSendAmount, setMaxSendAmount] = useState("");
  const [manual, setManual] = useState(true);

  useEffect(() => {
    if (lucidState) {
      getTokens(lucidState).then((tokensDict) => {
        setTokensList(tokensDict);
      });
    }
  }, [lucidState]);
  const handleClose = async (e: React.BaseSyntheticEvent): Promise<void> => {
    setShowStartModal(false);
    e.preventDefault();
    const formData = new FormData(e.target),
      sendAmount = parseInt(formData.get("sendAmount") as string),
      recCurrency = formData.get("recCurrency") as string,
      recTN = formData.get("recTokenName") as string,
      recAmount = parseInt(formData.get("recAmount") as string);
    const sAS: [string, string] = [
      selectedSendAsset.sendCurrency,
      selectedSendAsset.sendTokenName,
    ];
    const rAS: [string, string] = manual
      ? [recCurrency, recTN]
      : [selectedReceiveAsset.recCurrency, selectedReceiveAsset.recTokenName];
    const startParams: startParams = {
      sendAmount: sendAmount,
      sAssetClass: sAS,
      rAssetClass: rAS,
      receiveAmount: recAmount,
    };
    if (!lucidState) {
      throw new Error("Cannot connect with lucid :(");
    }
    try {
      const { tx } = await orderOperations("start", lucidState, startParams);
      const signedTx: TxSigned = await tx.sign().complete();
      const txHash = await submit(signedTx.toString());
      console.log(`TX HASH: ${txHash.toString()}`);
      alert(`Start succeeded. Tx hash: ${txHash}`);
    } catch (e) {
      const errorMessage = e.response?.data?.error || e;
      alert(`Start failed. ${errorMessage}`);
    }
    cleanForm();
  };
  const handleSenderAssetSelect = (selectedItem: string) => {
    setSendAsset((prevSelectedAsset) => ({
      ...prevSelectedAsset,
      sendCurrency: tokensList[selectedItem][0],
      sendTokenName: selectedItem === "lovelace" ? "" : selectedItem,
    }));
    setMaxSendAmount(tokensList[selectedItem][1]);
  };
  const handleReceiveAssetSelect = (selectedItem: string) => {
    setReceiveAsset((prevSelectedAsset) => ({
      ...prevSelectedAsset,
      recCurrency: tokensList[selectedItem][0],
      recTokenName: selectedItem === "lovelace" ? "" : selectedItem,
    }));
  };
  const useMaxSendAmount = () => {
    const sendAmountInput = document.getElementsByName(
      "sendAmount"
    )[0] as HTMLInputElement;
    sendAmountInput.value = maxSendAmount;
  };
  const cleanForm = () => {
    setSendAsset({ sendCurrency: "", sendTokenName: "" });
    setReceiveAsset({ recCurrency: "", recTokenName: "" });
    setMaxSendAmount("");
  };
  return (
    <>
      <Button
        colorScheme="teal"
        variant={"outline"}
        onClick={() => setShowStartModal(true)}
      >
        Start
      </Button>
      <Modal
        isOpen={showStartModal}
        size="2xl"
        onClose={() => setShowStartModal(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontSize="2xl">Create Order</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleClose}>
              <FormControl mb="3" id="startForm">
                <Grid templateColumns="2fr 1fr" gap="4">
                  <GridItem>
                    <FormControl>
                      <FormLabel>Send Asset Class</FormLabel>
                      <AutoComplete
                        openOnFocus
                        onChange={(selectedItem) =>
                          handleSenderAssetSelect(selectedItem)
                        }
                      >
                        <AutoCompleteInput
                          variant="outline"
                          placeholder="Select Token..."
                        />
                        <AutoCompleteList>
                          {Object.entries(tokensList).map(
                            ([token, currency]) => (
                              <AutoCompleteItem
                                key={token + currency}
                                value={token}
                              >
                                {token}
                              </AutoCompleteItem>
                            )
                          )}
                        </AutoCompleteList>
                      </AutoComplete>
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl>
                      <FormLabel>Send Amount</FormLabel>
                      <Input
                        isRequired
                        name="sendAmount"
                        type="number"
                        placeholder={
                          maxSendAmount
                            ? `Max available: ${maxSendAmount}`
                            : "Amount"
                        }
                        mb="4"
                        min={1}
                        max={maxSendAmount}
                      />
                      <FormHelperText position={"absolute"} bottom={-2}>
                        <Button
                          size="sm"
                          colorScheme="teal"
                          variant="link"
                          onClick={useMaxSendAmount}
                        >
                          Use max available
                        </Button>
                      </FormHelperText>
                    </FormControl>
                  </GridItem>
                </Grid>
                <Grid templateColumns="2fr 1fr" gap="4" marginTop={10}>
                  <GridItem>
                    {manual ? (
                      <FormControl>
                        <FormLabel>Receive Asset Class</FormLabel>
                        <Box borderWidth="1px" borderRadius="lg" p="4">
                          <Grid templateColumns="repeat(2, 1fr)" gap="4">
                            <GridItem>
                              <Input
                                name="recCurrency"
                                placeholder="Currency Symbol"
                              />
                            </GridItem>
                            <GridItem>
                              <Input
                                name="recTokenName"
                                placeholder="Token name"
                              />
                            </GridItem>
                          </Grid>
                          <div
                            style={{
                              textAlign: "center",
                              marginTop: "1rem",
                            }}
                          >
                            <Button
                              colorScheme="teal"
                              variant="outline"
                              onClick={() => setManual(false)}
                            >
                              Choose one of your tokens
                            </Button>
                          </div>
                        </Box>
                      </FormControl>
                    ) : (
                      <FormControl>
                        <FormLabel>Receive Asset Class</FormLabel>
                        <AutoComplete
                          openOnFocus
                          onChange={(selectedItem) =>
                            handleReceiveAssetSelect(selectedItem)
                          }
                        >
                          <AutoCompleteInput
                            variant="outline"
                            placeholder="Select Token..."
                          />
                          <AutoCompleteList>
                            {Object.entries(tokensList).map(
                              ([token, currency]) => (
                                <AutoCompleteItem
                                  key={token + currency}
                                  value={token}
                                >
                                  {token}
                                </AutoCompleteItem>
                              )
                            )}
                          </AutoCompleteList>
                        </AutoComplete>
                        <div
                          style={{
                            textAlign: "center",
                            marginBottom: "1rem",
                            marginTop: "1.5rem",
                          }}
                        >
                          <Button
                            colorScheme="teal"
                            variant="outline"
                            onClick={() => setManual(true)}
                          >
                            Enter token manually
                          </Button>
                        </div>
                      </FormControl>
                    )}
                  </GridItem>
                  <GridItem>
                    <FormLabel>Receive Amount</FormLabel>
                    <Input
                      isRequired
                      name="recAmount"
                      type="number"
                      placeholder="Amount"
                      mb="4"
                      min={1}
                    />
                  </GridItem>
                  <FormHelperText>
                    <Text as="em">* Note that 1000000 lovelace = 1 ADA</Text>
                  </FormHelperText>
                </Grid>
                <Divider />
                <div className="d-flex align-items-center">
                  <Button
                    variant="solid"
                    colorScheme="messenger"
                    type="submit"
                    className="mx-auto"
                  >
                    Submit
                  </Button>
                </div>
              </FormControl>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
