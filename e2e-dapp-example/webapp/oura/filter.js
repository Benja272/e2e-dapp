const policy_id = "feac2e2378bcf87cd735a6e1996c236ef40ae26e1d7176a5dae2864b";
const token_name = "636f6e74726f6c546f6b656e";

const is_minting_control_token = (tx) => {
  if (!tx.mint || tx.mint.length == 0) {
    return false;
  }
  return tx.mint.some((mint_info) => {
    return mint_info.policy == policy_id && mint_info.asset == token_name;
  });
};

const is_burn = (tx) => {
  return tx.mint.some((mint_info) => {
    return mint_info.policy == policy_id && Object.values(mint_info.quantity)[0] == "-1";
  });
};

export async function mapEvent(event) {
  if (!event.block?.transactions || event.block?.transactions?.length == 0) {
    return;
  }

  var burn_txs = [];
  var start_txs = [];
  event.block.transactions.forEach((tx) => {
    if (!is_minting_control_token(tx)) {
      return;
    }
    if (is_burn(tx)) {
      burn_txs.push({ hash: tx.hash, inputs: tx.inputs, outputs: tx.outputs, type: "burn" });
    } else {
      start_txs.push({ hash: tx.hash, inputs: tx.inputs, outputs: tx.outputs, type: "start" });
    }
  });

  if (burn_txs.length === 0 && start_txs.length === 0) {
    return;
  }

  const event2 = { burn_txs: burn_txs, start_txs: start_txs };
  return event2;
}
