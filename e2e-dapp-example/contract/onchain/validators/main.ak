use aiken/bytearray
use aiken/dict
use aiken/interval.{Finite, Interval, IntervalBound}
use aiken/list
use aiken/option
use aiken/transaction.{
  InlineDatum, Input, Mint, NoDatum, Output, OutputReference, ScriptContext,
  Spend, Transaction, TransactionId,
}
use aiken/transaction/credential.{
  Address, ScriptCredential, VerificationKeyCredential,
}
use aiken/transaction/value
use test_utils
use types.{
  AssetClass, CancelOrder, DatumValue, OrderDatum, OrderInfo, OrderRedeemer,
  ResolveOrder,
}
use utils

// This module defines the validation logic for the order contract, encompassing both the primary
// validator function and the minting policy. It ensures the correctness of redeemers, inputs,
// and minting operations in accordance with the contract's specifications.

validator {
  /// `spend` function
  ///
  /// This function validates a specific order transaction based on the provided datum, redeemer,
  /// and context.
  ///
  /// # Parameters:
  /// - `datum`: Contains the information related to the order, including the sender's payment hash,
  ///            the token's asset class, and the token's amount.
  /// - `redeemer`: Indicates the action to be taken on the order, i.e., whether it's a cancellation
  ///               or a resolution of the order.
  /// - `context`: Provides the surrounding context of the transaction, enabling access to
  ///              transaction details.
  ///
  /// # Returns:
  /// - `true` if the order is valid, `false` otherwise.
  fn spend(
    datum: OrderDatum,
    redeemer: OrderRedeemer,
    context: ScriptContext,
  ) -> Bool {
    // Retrieves minting information from the transaction.
    let (minted_policy, minted_name, minted_quantity) =
      utils.get_minting_info(context.transaction)

    // Checks if the redeemer action (either cancel or resolve) is valid.
    let is_redeemer_valid =
      when redeemer is {
        CancelOrder -> {
          // Retrieves extra signatories of the transaction. Expecting a single signer address.
          expect [signer_addr] = context.transaction.extra_signatories
          // Checks if the signer is the original sender.
          (signer_addr == datum.info.sender_payment_hash)?
        }
        ResolveOrder -> {
          // Retrieves the payment made to the sender's payment hash in the current transaction.
          let sender_payment =
            utils.value_paid_to(
              datum.info.sender_payment_hash,
              context.transaction,
            )

          // Retrieves the payment policies for the sender's payment excluding lovelace.
          let payment_policies = value.policies(sender_payment)

          // Prevents the sender from paying trash tokens.
          let valid_policies =
            [datum.info.token.asset_class.policy, value.ada_policy_id]

          // Checks if the quantity of token in the sender's payment matches the expected quantity
          // and the payment policy matches the valid policies.
          (value.quantity_of(
            sender_payment,
            datum.info.token.asset_class.policy,
            datum.info.token.asset_class.name,
          ) >= datum.info.token.amount)? && list.all(
            payment_policies,
            fn(policy) { list.has(valid_policies, policy) },
          )?
        }
      }

    // Checks if the correct token is being burned (negative minted quantity)
    // and matches the control asset class details.
    let is_token_burned =
      minted_quantity == -1 && minted_policy == datum.control_asset_class.policy && minted_name == datum.control_asset_class.name

    // The order is valid if both the redeemer logic is valid and the token is correctly burned.
    is_redeemer_valid? && is_token_burned?
  }

  /// `mint` function
  ///
  /// This function validates minting policies associated with a control token based on a provided
  /// redeemer and context.
  ///
  /// # Parameters:
  /// - `_redeemer`: Data related to the action on the control token.
  ///                Currently, this is not used in the function.
  /// - `context`: Provides the surrounding context of the transaction, including details about
  ///              minted tokens, signatories, etc.
  ///
  /// # Returns:
  /// - `true` if the minting policy for the control token is valid, `false` otherwise.
  fn mint(_redeemer: Data, context: ScriptContext) -> Bool {
    // - Extracts minting information to determine what token is being minted/burned, the policy
    //   it's associated with, and the quantity.
    let (minted_policy, minted_name, minted_quantity) =
      utils.get_minting_info(context.transaction)

    // - Checks if a token is being burned. If so, returns `true` immediately, signaling that the
    //   transaction is valid.
    let is_token_burned = minted_quantity == -1
    if is_token_burned {
      True
    } else {
      // - If not burning, the function checks the following:
      // 1. That there's exactly one UTXO output associated with a particular script address.
      expect [order_utxo] =
        context.transaction.outputs
          |> transaction.find_script_outputs(minted_policy)

      let OrderDatum { info, control_asset_class } =
        utils.to_order_datum(order_utxo.datum)

      // 2. Ensures that the signer of the transaction is indeed the sender.
      let is_signer_sender =
        list.has(
          context.transaction.extra_signatories,
          info.sender_payment_hash,
        )

      // 3. Validates that the control token is being correctly paid to the script.
      let is_control_token_paid_to_the_script =
        value.quantity_of(order_utxo.value, minted_policy, minted_name) == minted_quantity

      // 4. Ensures that the token amount in the datum is positive.
      let is_datum_payment_valid = info.token.amount > 0

      // 5. Validates that a new token is being minted with the correct policy, name, and quantity.
      let is_minting_valid =
        minted_quantity == 1 && minted_policy == control_asset_class.policy && minted_name == control_asset_class.name

      is_minting_valid? && is_signer_sender? && is_datum_payment_valid? && is_control_token_paid_to_the_script?
    }
  }
}

// ==============================================================================================
// Resolve Operation Tests
// ==============================================================================================

type ResolveTestOptions {
  edit_payment_address: Option<ByteArray>,
  edit_minted_amount: Option<Int>,
}

fn default_resolve_test_options() -> ResolveTestOptions {
  ResolveTestOptions { edit_payment_address: None, edit_minted_amount: None }
}

fn resolve(options: ResolveTestOptions) {
  let script_addr = #"6af53ff4f054348ad825c692dd9db8f1760a8e0eacf9af9f99306513"
  let sender_payment_addr =
    #"a1b23cd45e67890f12ab34cd56ef789012bc34de56f78901a2b3c4d5"
  let sender_staking_addr =
    #"5e6f78901a2b3c4d5a1b23cd45e67890f12ab34cd56ef789012bc34d"
  let receiver_payment_addr =
    #"9a8b76cd45e32190f12ab54cd67ef890123cd45ef67f8901234f4f5f"
  let tokenA_policy_id =
    #"0298aa99f95e2fe0a0132a6bb794261fb7e7b0d988215da2f2de2005"
  let tokenA_asset_name = "tokenA"
  let tokenB_policy_id =
    #"f4c76b5c82e4f8e6b465f71c2856e6faa8b2c4f2a3f486a8c2ed45ef"
  let tokenB_asset_name = "tokenB"
  let control_policy_id =
    #"146198d2e3f9d5f8b3d337a4990a8dfbea493f1419f6f21fec513dc0"
  let control_asset_name = "controlToken"
  let transaction_id =
    #"6dcd4ce23d88e2ee95838f4b759b3456c63d219231a64a3ce6dd2bf72f5c5b6a"
  let transaction_id_2 =
    #"6dcd4ce23d88e2ee95838f4b759b3456c63d219231a64a3ce6dd2bf72f5c5b6a"
  let minted_amount = option.or_else(options.edit_minted_amount, -1)
  let receiver_payment = 1
  let sender_payment = 2
  let datum =
    OrderDatum {
      info: OrderInfo {
        sender_payment_hash: sender_payment_addr,
        sender_staking_hash: sender_staking_addr,
        token: DatumValue {
          asset_class: AssetClass {
            policy: tokenB_policy_id,
            name: tokenB_asset_name,
          },
          amount: 2,
        },
      },
      control_asset_class: AssetClass {
        policy: control_policy_id,
        name: control_asset_name,
      },
    }
  let redeemer = ResolveOrder
  let script_utxo = {
    let output = {
      let address =
        Address {
          payment_credential: ScriptCredential(script_addr),
          stake_credential: None,
        }
      let value =
        value.from_lovelace(2_000_000)
          |> value.add(control_policy_id, control_asset_name, minted_amount)
          |> value.add(tokenA_policy_id, tokenA_asset_name, 1)
      Output {
        address,
        value,
        datum: InlineDatum(datum),
        reference_script: None,
      }
    }
    Input {
      output_reference: OutputReference {
        transaction_id: TransactionId { hash: transaction_id },
        output_index: 0,
      },
      output,
    }
  }
  let receiver_wallet_utxo = {
    let output = {
      let address =
        Address {
          payment_credential: VerificationKeyCredential(receiver_payment_addr),
          stake_credential: None,
        }
      let value =
        value.from_lovelace(10_000_000)
          |> value.add(tokenB_policy_id, tokenB_asset_name, 2)
      Output { address, value, datum: NoDatum, reference_script: None }
    }
    let output_reference =
      OutputReference {
        transaction_id: TransactionId { hash: transaction_id_2 },
        output_index: 0,
      }
    Input { output_reference, output }
  }
  let receiver_payment_utxo =
    test_utils.generate_output(
      receiver_payment_addr,
      AssetClass(tokenA_policy_id, tokenA_asset_name),
      receiver_payment,
    )
  let sender_payment_utxo =
    test_utils.generate_output(
      option.or_else(options.edit_payment_address, sender_payment_addr),
      AssetClass(tokenB_policy_id, tokenB_asset_name),
      sender_payment,
    )
  let tx =
    Transaction {
      inputs: [script_utxo, receiver_wallet_utxo],
      reference_inputs: [],
      outputs: [sender_payment_utxo, receiver_payment_utxo],
      fee: value.from_lovelace(5_000),
      mint: value.to_minted_value(
        value.from_asset(control_policy_id, control_asset_name, minted_amount),
      ),
      certificates: [],
      withdrawals: dict.new(),
      validity_range: Interval {
        lower_bound: IntervalBound { bound_type: Finite(1), is_inclusive: True },
        upper_bound: IntervalBound {
          bound_type: Finite(10),
          is_inclusive: True,
        },
      },
      extra_signatories: [receiver_payment_addr],
      redeemers: dict.new()
        |> dict.insert(
             key: Spend(
               OutputReference {
                 transaction_id: TransactionId { hash: transaction_id },
                 output_index: 0,
               },
             ),
             value: utils.redeemer_to_data(ResolveOrder),
             compare: test_utils.script_purpose_compare,
           )
        |> dict.insert(
             key: Mint(control_policy_id),
             value: utils.redeemer_to_data(ResolveOrder),
             compare: test_utils.script_purpose_compare,
           ),
      datums: dict.new()
        |> dict.insert(
             transaction_id,
             utils.datum_to_data(InlineDatum(datum)),
             compare: bytearray.compare,
           ),
      id: TransactionId { hash: transaction_id },
    }
  let spend_ctx =
    ScriptContext {
      transaction: tx,
      purpose: Spend(
        OutputReference {
          transaction_id: TransactionId { hash: transaction_id },
          output_index: 0,
        },
      ),
    }
  let mint_ctx =
    ScriptContext { transaction: tx, purpose: Mint(control_policy_id) }
  let result = spend(datum, redeemer, spend_ctx) && mint(redeemer, mint_ctx)
  result
}

test ok_resolve() {
  let options = default_resolve_test_options()
  resolve(options)
}

test resolve_control_token_not_burned() fail {
  let options =
    ResolveTestOptions {
      edit_payment_address: None,
      edit_minted_amount: Some(0),
    }
  resolve(options)
}

test mints_extra_control_token() fail {
  let options =
    ResolveTestOptions {
      edit_payment_address: None,
      edit_minted_amount: Some(1),
    }
  resolve(options)
}

test wrong_payment_address() fail {
  let options =
    ResolveTestOptions {
      edit_payment_address: Some(
        #"9a8b76cd45e32190f12ab54cd67ef890123cd45ef67f8901234f4f5f",
      ),
      edit_minted_amount: None,
    }
  resolve(options)
}

// ==============================================================================================
// Cancel Operation Tests
// ==============================================================================================

type CancelTestOptions {
  edit_signer: Option<ByteArray>,
  edit_minted_amount: Option<Int>,
}

fn default_cancel_test_options() -> CancelTestOptions {
  CancelTestOptions { edit_signer: None, edit_minted_amount: None }
}

fn cancel(options: CancelTestOptions) {
  let script_addr = #"6af53ff4f054348ad825c692dd9db8f1760a8e0eacf9af9f99306513"
  let sender_payment_addr =
    #"a1b23cd45e67890f12ab34cd56ef789012bc34de56f78901a2b3c4d5"
  let sender_staking_addr =
    #"5e6f78901a2b3c4d5a1b23cd45e67890f12ab34cd56ef789012bc34d"
  let receiver_payment_addr =
    #"9a8b76cd45e32190f12ab54cd67ef890123cd45ef67f8901234f4f5f"
  let tokenA_policy_id =
    #"0298aa99f95e2fe0a0132a6bb794261fb7e7b0d988215da2f2de2005"
  let tokenA_asset_name = "tokenA"
  let tokenB_policy_id =
    #"f4c76b5c82e4f8e6b465f71c2856e6faa8b2c4f2a3f486a8c2ed45ef"
  let tokenB_asset_name = "tokenB"
  let control_policy_id =
    #"146198d2e3f9d5f8b3d337a4990a8dfbea493f1419f6f21fec513dc0"
  let control_asset_name = "controlToken"
  let transaction_id =
    #"6dcd4ce23d88e2ee95838f4b759b3456c63d219231a64a3ce6dd2bf72f5c5b6a"
  let transaction_id_2 =
    #"6dcd4ce23d88e2ee95838f4b759b3456c63d219231a64a3ce6dd2bf72f5c5b6a"
  let minted_amount = option.or_else(options.edit_minted_amount, -1)
  let receiver_payment = 1
  let sender_payment = 2
  let redeemer = CancelOrder
  let datum =
    OrderDatum {
      info: OrderInfo {
        sender_payment_hash: sender_payment_addr,
        sender_staking_hash: sender_staking_addr,
        token: DatumValue {
          asset_class: AssetClass {
            policy: tokenB_policy_id,
            name: tokenB_asset_name,
          },
          amount: 2,
        },
      },
      control_asset_class: AssetClass {
        policy: control_policy_id,
        name: control_asset_name,
      },
    }
  let script_utxo = {
    let output = {
      let address =
        Address {
          payment_credential: ScriptCredential(script_addr),
          stake_credential: None,
        }
      let value =
        value.from_lovelace(2_000_000)
          |> value.add(control_policy_id, control_asset_name, minted_amount)
          |> value.add(tokenA_policy_id, tokenA_asset_name, 1)
      Output {
        address,
        value,
        datum: InlineDatum(datum),
        reference_script: None,
      }
    }
    Input {
      output_reference: OutputReference {
        transaction_id: TransactionId { hash: transaction_id },
        output_index: 0,
      },
      output,
    }
  }
  let receiver_wallet_utxo = {
    let output = {
      let address =
        Address {
          payment_credential: VerificationKeyCredential(receiver_payment_addr),
          stake_credential: None,
        }
      let value =
        value.from_lovelace(10_000_000)
          |> value.add(tokenB_policy_id, tokenB_asset_name, 2)
      Output { address, value, datum: NoDatum, reference_script: None }
    }
    let output_reference =
      OutputReference {
        transaction_id: TransactionId { hash: transaction_id_2 },
        output_index: 0,
      }
    Input { output_reference, output }
  }
  let receiver_payment_utxo =
    test_utils.generate_output(
      receiver_payment_addr,
      AssetClass(tokenA_policy_id, tokenA_asset_name),
      receiver_payment,
    )
  let sender_payment_utxo =
    test_utils.generate_output(
      sender_payment_addr,
      AssetClass(tokenB_policy_id, tokenB_asset_name),
      sender_payment,
    )
  let tx =
    Transaction {
      inputs: [script_utxo, receiver_wallet_utxo],
      reference_inputs: [],
      outputs: [sender_payment_utxo, receiver_payment_utxo],
      fee: value.from_lovelace(5_000),
      mint: value.to_minted_value(
        value.from_asset(control_policy_id, control_asset_name, minted_amount),
      ),
      certificates: [],
      withdrawals: dict.new(),
      validity_range: Interval {
        lower_bound: IntervalBound { bound_type: Finite(1), is_inclusive: True },
        upper_bound: IntervalBound {
          bound_type: Finite(10),
          is_inclusive: True,
        },
      },
      extra_signatories: [
        option.or_else(options.edit_signer, sender_payment_addr),
      ],
      redeemers: dict.new()
        |> dict.insert(
             key: Spend(
               OutputReference {
                 transaction_id: TransactionId { hash: transaction_id },
                 output_index: 0,
               },
             ),
             value: utils.redeemer_to_data(ResolveOrder),
             compare: test_utils.script_purpose_compare,
           )
        |> dict.insert(
             key: Mint(control_policy_id),
             value: utils.redeemer_to_data(ResolveOrder),
             compare: test_utils.script_purpose_compare,
           ),
      datums: dict.new()
        |> dict.insert(
             transaction_id,
             utils.datum_to_data(InlineDatum(datum)),
             compare: bytearray.compare,
           ),
      id: TransactionId { hash: transaction_id },
    }
  let spend_ctx =
    ScriptContext {
      transaction: tx,
      purpose: Spend(
        OutputReference {
          transaction_id: TransactionId { hash: transaction_id },
          output_index: 0,
        },
      ),
    }
  let mint_ctx =
    ScriptContext { transaction: tx, purpose: Mint(control_policy_id) }
  let result = spend(datum, redeemer, spend_ctx) && mint(redeemer, mint_ctx)
  result
}

test ok_cancel() {
  let options = default_cancel_test_options()
  cancel(options)
}

test cancel_control_token_not_burned() fail {
  let options =
    CancelTestOptions { edit_signer: None, edit_minted_amount: Some(0) }
  cancel(options)
}

test wrong_signer() fail {
  let options =
    CancelTestOptions {
      edit_signer: Some(
        #"9a8b76cd45e32190f12ab54cd67ef890123cd45ef67f8901234f4f5f",
      ),
      edit_minted_amount: None,
    }
  cancel(options)
}
