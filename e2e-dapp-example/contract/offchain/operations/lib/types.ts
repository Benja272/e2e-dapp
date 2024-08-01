import { Data, Constr, toUnit, fromText } from "lucid-cardano";
import { DatumInfo } from "./parameters";

const redeemerSchema = Data.Enum([Data.Literal("CancelOrder"), Data.Literal("ResolveOrder")]);

type orderRedeemer = Data.Static<typeof redeemerSchema>;
const orderRedeemer = redeemerSchema as unknown as orderRedeemer;

const mkRedeemer = (red: string): string => {
  let originalRedeemer;

  switch (red) {
    case "CancelOrder":
      originalRedeemer = new Constr(0, []);
      break;
    case "ResolveOrder":
      originalRedeemer = new Constr(1, []);
      break;
    default:
      throw Error("Bad Order Redeemer Name.");
  }

  let wrappedRedeemer = new Constr(1, [originalRedeemer]);

  return Data.to(wrappedRedeemer);
};

const assetClass = Data.Object({
  policyId: Data.Bytes(),
  tokenName: Data.Bytes(),
});

const tokenClass = Data.Object({
  rAssetClass: assetClass,
  amount: Data.Integer(),
});

const datumSchema = Data.Object({
  eInfo: Data.Object({
    senderPayment: Data.Bytes(),
    senderStaking: Data.Bytes(),
    rValue: tokenClass,
  }),
  eAssetClass: assetClass,
});
type OrderDatum = Data.Static<typeof datumSchema>;
const OrderDatum = datumSchema as unknown as OrderDatum;

const mkOrderDatum = (
  senderWallet: [string, string],
  receiveAmount: number,
  rAssetClass: [string, string],
  eAssetClass: [string, string],
): string => {
  const d: OrderDatum = {
    eInfo: {
      senderPayment: senderWallet[0],
      senderStaking: senderWallet[1],
      rValue: {
        rAssetClass: {
          policyId: rAssetClass[0],
          tokenName: rAssetClass[1],
        },
        amount: BigInt(receiveAmount),
      },
    },
    eAssetClass: {
      policyId: eAssetClass[0],
      tokenName: eAssetClass[1],
    },
  };
  const datum = Data.to<OrderDatum>(d, OrderDatum);
  return datum;
};

const getDatumInfo = (dtm: string | undefined | null): DatumInfo => {
  if (!dtm) {
    throw Error("No datum found");
  }
  const datum: OrderDatum = Data.from(dtm, OrderDatum);
  const rAmount = Number(datum.eInfo.rValue.amount);
  const rAsset: [string, string] = [
    datum.eInfo.rValue.rAssetClass.policyId,
    datum.eInfo.rValue.rAssetClass.tokenName,
  ];
  const eAsset: [string, string] = [datum.eAssetClass.policyId, datum.eAssetClass.tokenName];
  return {
    senderWallet: [datum.eInfo.senderPayment, datum.eInfo.senderStaking],
    rAmount: rAmount,
    rAsset: rAsset[0] ? rAsset : [rAsset[0], fromText("lovelace")],
    eAsset: eAsset,
    receiverUnit: rAsset[0] ? toUnit(rAsset[0], rAsset[1]) : "lovelace",
    controlTokenUnit: toUnit(eAsset[0], eAsset[1]),
  };
};

export { orderRedeemer, mkOrderDatum, mkRedeemer, getDatumInfo };
