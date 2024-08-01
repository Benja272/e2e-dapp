import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  RangeSlider,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  RangeSliderTrack,
  Select,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  theme,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";
import { toText } from "lucid-cardano";
import { useContext, useEffect, useState } from "react";
import { TbTrashX } from "react-icons/tb";
import { UtxoOrderInfo } from "../../webapp/utils/parameters";
import OrdersButton from "../components/Operation";
import { Reload } from "../components/Reload";
import { OrderBookContext } from "./Layout";

type DisplayOrdersProps = {
  header: string;
  operation: "cancel" | "resolve" | "history";
  ordersInfo: UtxoOrderInfo[];
  buttonText: string;
  buttonColor: string;
};

const getAssetNames = (orderInfo: UtxoOrderInfo) => {
  const sendAsset = toText(orderInfo.sAsset[1]).toLowerCase() || "lovelace";
  const receiveAsset = toText(orderInfo.rAsset[1]).toLowerCase() || "lovelace";
  return {
    sendAsset,
    receiveAsset,
  };
};

const applyFilter =
  (
    sName: string | null,
    rName: string | null,
    sSliderValue: number[],
    rSliderValue: number[],
    selectedFilter: string
  ) =>
  (order: UtxoOrderInfo) => {
    const { sendAsset, receiveAsset } = getAssetNames(order);

    const sendAssetMatches =
      sName === null || sendAsset.includes(sName.toLowerCase());
    const receiveAssetMatches =
      rName === null || receiveAsset.includes(rName.toLowerCase());

    const sendAmountInRange =
      order.sAmount >= sSliderValue[0] && order.sAmount <= sSliderValue[1];

    const receiveAmountInRange =
      order.rAmount >= rSliderValue[0] && order.rAmount <= rSliderValue[1];

    const isCanceled = order.receiver === null;
    const isResolved = order.receiver !== null;

    const operationMatches =
      selectedFilter === "" ||
      (selectedFilter === "canceled" && isCanceled) ||
      (selectedFilter === "resolved" && isResolved);
    return (
      sendAssetMatches &&
      receiveAssetMatches &&
      sendAmountInRange &&
      receiveAmountInRange &&
      operationMatches
    );
  };

// Component that displays the started orders in a table.
const DisplayOrders = ({
  header,
  operation,
  ordersInfo,
  buttonText,
  buttonColor,
}: DisplayOrdersProps) => {
  const [sName, setSName] = useState<string | null>(null);
  const [rName, setRName] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("");
  const [maxSendAmount, setMaxSendAmount] = useState<number>(Infinity);
  const [maxReceiveAmount, setMaxReceiveAmount] = useState<number>(Infinity);

  const [sSliderValue, setsSliderValue] = useState([1, Infinity]);
  const [rSliderValue, setrSliderValue] = useState([1, Infinity]);

  const {
    currentContractState,
    lucidState,
    isConnected,
    setCurrentContractState,
  } = useContext(OrderBookContext);
  const { colorMode } = useColorMode();

  const filteredOrders = ordersInfo.filter(
    applyFilter(sName, rName, sSliderValue, rSliderValue, selectedFilter)
  );

  const resetFilters = () => {
    setSName(null);
    setRName(null);
    setsSliderValue([1, maxSendAmount]);
    setrSliderValue([1, maxReceiveAmount]);
    setSelectedFilter("");
  };

  useEffect(() => {
    if (ordersInfo.length > 0) {
      setMaxSendAmount(Math.max(...ordersInfo.map((order) => order.sAmount)));
      setMaxReceiveAmount(
        Math.max(...ordersInfo.map((order) => order.rAmount))
      );
      setrSliderValue([1, maxReceiveAmount]);
      setsSliderValue([1, maxSendAmount]);
    }
  }, [ordersInfo, lucidState]);

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "1rem",
          maxWidth: "75%",
          margin: "0 auto",
          paddingTop: "1rem",
          paddingBottom: "1rem",
        }}
      >
        <Heading as="h2" size="lg">
          {header}
        </Heading>
        <Reload
          isConnected={isConnected}
          setCurrentContractState={setCurrentContractState}
          currentContractState={currentContractState}
          lucidState={lucidState}
        />
      </div>
      <Box
        bg={useColorModeValue("gray.50", "gray.700")}
        margin={"0 auto"}
        maxWidth={"75%"}
        overflowX={"auto"}
        border={"1px"}
        borderColor={useColorModeValue("teal.500", "teal.300")}
        borderBottom="none"
        borderTopLeftRadius="md"
        borderTopRightRadius="md"
      >
        <Flex justifyContent={"center"}>
          <Input
            value={sName || ""}
            placeholder="Search by send asset"
            onChange={(e) => setSName(e.target.value)}
            m={5}
            maxWidth={"20%"}
          />
          <RangeSlider
            aria-label={["min", "max"]}
            value={sSliderValue}
            onChange={(value) => setsSliderValue(value)}
            onChangeEnd={(value) => setsSliderValue(value)}
            colorScheme="teal"
            maxWidth={"20%"}
            min={1}
            max={maxSendAmount}
          >
            <Flex justify="space-between">
              <Text fontSize="sm">Min: {sSliderValue[0]}</Text>
              <Text fontSize="sm">Max: {sSliderValue[1]}</Text>
            </Flex>
            <RangeSliderTrack>
              <RangeSliderFilledTrack />
            </RangeSliderTrack>
            <RangeSliderThumb index={0} />
            <RangeSliderThumb index={1} />
          </RangeSlider>
          <Input
            placeholder="Search by receive asset"
            value={rName || ""}
            onChange={(e) => setRName(e.target.value)}
            m={5}
            maxWidth={"20%"}
          />
          <RangeSlider
            aria-label={["min", "max"]}
            value={rSliderValue}
            onChange={(value) => setrSliderValue(value)}
            onChangeEnd={(value) => setrSliderValue(value)}
            colorScheme="teal"
            maxWidth={"20%"}
            min={1}
            max={maxReceiveAmount}
          >
            <Flex justify="space-between">
              <Text fontSize="sm">Min: {rSliderValue[0]}</Text>
              <Text fontSize="sm">Max: {rSliderValue[1]}</Text>
            </Flex>
            <RangeSliderTrack>
              <RangeSliderFilledTrack />
            </RangeSliderTrack>
            <RangeSliderThumb index={0} />
            <RangeSliderThumb index={1} />
          </RangeSlider>
          {operation == "history" ? (
            <Select
              placeholder="All orders"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              mt={5}
              ml={5}
              maxWidth={"9%"}
            >
              <option value="canceled">Canceled</option>
              <option value="resolved">Resolved</option>
            </Select>
          ) : (
            <></>
          )}
          <Button
            onClick={resetFilters}
            m={5}
            width={operation === "history" ? "150px" : "55px"}
            marginLeft={operation === "history" ? "2%" : "4%"}
          >
            <TbTrashX style={{ fontSize: "20px" }} />
          </Button>
        </Flex>
      </Box>
      {
        <TableContainer
          margin={"0 auto"}
          maxWidth={"75%"}
          overflowY={"auto"}
          maxHeight={"60vh"}
          border={"1px solid"}
          borderColor={useColorModeValue("teal.500", "teal.300")}
          borderTop="none"
          borderBottomLeftRadius={"lg"}
          borderBottomRightRadius={"lg"}
        >
          <Table variant="simple">
            <Thead position={"sticky"} top={-0.5} zIndex={1}>
              <Tr
                border={`2px solid ${
                  colorMode === "light"
                    ? theme.colors.teal[500]
                    : theme.colors.teal[300]
                }`}
                borderTop="none"
                borderBottom="none"
              >
                <Th>Transaction Hash</Th>
                {operation == "cancel" ? <></> : <Th>Sender Address</Th>}
                <Th>Send Amount</Th>
                <Th>Send Asset</Th>
                <Th>Receive Amount</Th>
                <Th>Receive Asset</Th>
                <Th>Operation</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredOrders.map((order: UtxoOrderInfo, i) => {
                // if networkId is 0 (networkId for testnet),
                // assumes that preprod testnet is used
                const cardanoScanUrlPrefix =
                  currentContractState.networkId == 0 ? "preprod." : "";
                const sendAsset = order.sAsset[0] + order.sAsset[1];
                const receiveAsset = order.rAsset[0] + order.rAsset[1];
                const txHash = order.txHash;
                const senderAddr = order.sender;
                const orderUtxo = {
                  txHash: txHash,
                  outputIndex: 0
                };
                return (
                  <Tr key={i}>
                    <Td>
                      <a
                        href={`https://${cardanoScanUrlPrefix}cardanoscan.io/transaction/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Text as="ins" color={"blue.400"}>{`${txHash.substring(
                          0,
                          9
                        )}...${txHash.substring(txHash.length - 9)}`}</Text>
                      </a>
                    </Td>
                    {operation !== "cancel" ? (
                      <Td>
                        {`${senderAddr.substring(
                          0,
                          13
                        )}...${senderAddr.substring(senderAddr.length - 5)}`}
                      </Td>
                    ) : (
                      <></>
                    )}
                    <Td> {order.sAmount} </Td>
                    <Td>
                      <a
                        href={`https://${cardanoScanUrlPrefix}cardanoscan.io/token/${sendAsset}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {toText(order.sAsset[1]) || "lovelace"}
                      </a>
                    </Td>
                    <Td> {order.rAmount} </Td>
                    <Td>
                      <a
                        href={`https://${cardanoScanUrlPrefix}cardanoscan.io/token/${receiveAsset}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {toText(order.rAsset[1]) || "lovelace"}
                      </a>
                    </Td>
                    {operation == "history" && order.receiver ? (
                      <Td>
                        <Text as="em">Resolved</Text>
                      </Td>
                    ) : operation == "history" ? (
                      <Td>
                        <Text as="em">Canceled</Text>
                      </Td>
                    ) : (
                      <Td>
                        <OrdersButton
                          txOutRef={orderUtxo}
                          operation={operation}
                          buttonText={buttonText}
                          buttonColor={buttonColor}
                        />
                      </Td>
                    )}
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
      }
    </>
  );
};

export default DisplayOrders;
