use aiken/bytearray
use aiken/transaction.{
  Mint, NoDatum, Output, OutputReference, ScriptPurpose, Spend, TransactionId,
}
use aiken/transaction/credential.{Address, VerificationKeyCredential}
use aiken/transaction/value
use types.{AssetClass}

// This module includes utility functions for testing the validator.

// ====================
// MOCK DATA GENERATION
// ====================

/// Produces a mock transaction payment output.
///
/// A helper function that crafts a transaction output for a given payment address and amount.
/// The output generated by this function is a simple one, without any datums or reference scripts
/// attached.
///
/// # Parameters:
/// - payment_addr: The address receiving the payment.
/// - amount: The amount of Lovelace being sent to the address.
///
/// # Returns:
/// A mock `Output` with the given address and amount.
pub fn generate_output(
  payment_addr: ByteArray,
  asset_class: AssetClass,
  amount: Int,
) -> Output {
  let address =
    Address {
      payment_credential: VerificationKeyCredential(payment_addr),
      stake_credential: None,
    }
  Output {
    address,
    value: value.from_asset(asset_class.policy, asset_class.name, amount),
    datum: NoDatum,
    reference_script: None,
  }
}

// ================
// INTERNAL HELPERS
// ================

/// Converts a given ScriptPurpose into a ByteArray representation.
///
/// This function is primarily designed to offer a way to uniquely represent different
/// `ScriptPurpose` variants in a `ByteArray` format. This is useful for operations like
/// comparisons, especially when we want to store these in a dictionary.
///
/// # Parameters:
/// - `sp`: The `ScriptPurpose` instance that needs to be converted.
///
/// # Returns:
/// A `ByteArray` representation of the provided `ScriptPurpose`.
fn script_purpose_to_byte_array(sp: ScriptPurpose) -> ByteArray {
  when sp is {
    Spend(ref) -> ref.transaction_id.hash
    Mint(policy_id) -> policy_id

    // Default case to handle any other unexpected variants.
    // It returns a generic ByteArray representation of "0".
    _ -> "0"
  }
}

/// Compares two ScriptPurpose instances.
///
/// This function leverages the `script_purpose_to_byte_array` function to convert each
/// `ScriptPurpose` into a `ByteArray` and then performs a comparison.
///
/// # Parameters:
/// - `a`: The first `ScriptPurpose` instance.
/// - `b`: The second `ScriptPurpose` instance.
///
/// # Returns:
/// An `Ordering` result (`Less`, `Equal`, or `Greater`) based on the comparison of the ByteArray
/// representations of the provided `ScriptPurpose` instances.
pub fn script_purpose_compare(a: ScriptPurpose, b: ScriptPurpose) -> Ordering {
  let byte_a = script_purpose_to_byte_array(a)
  let byte_b = script_purpose_to_byte_array(b)

  bytearray.compare(byte_a, byte_b)
}
