import {
  type Package,
  defaultPackage,
  defaultProcedureExport,
} from "@/lib/types";

const masm = `# NETWORK FUNGIBLE FAUCET CONTRACT
#
# Note: This component requires mint-policy and burn-policy components to also be present in the
# account.
# =================================================================================================

use miden::standards::faucets
use miden::standards::mint_policies::policy_manager

# PUBLIC INTERFACE
# ================================================================================================

# ASSET MINTING
# ------------------------------------------------------------------------------------------------

#! Mints fungible assets to the provided recipient by creating a note.
#!
#! This procedure first executes the active mint policy configured via
#! \`active_policy_proc_root\`, and then mints the asset and creates an output note
#! with that asset for the recipient.
#!
#! Inputs:  [amount, tag, note_type, RECIPIENT, pad(9)]
#! Outputs: [note_idx, pad(15)]
#!
#! Where:
#! - amount is the amount to be minted and sent.
#! - tag is the tag to be included in the note.
#! - note_type is the type of the note that holds the asset.
#! - RECIPIENT is the recipient of the asset.
#! - note_idx is the index of the created note.
#!
#! Panics if:
#! - active mint policy validation fails.
#! - any of the validations in faucets::mint_and_send fail.
#!
#! Invocation: call
pub proc mint_and_send
    exec.policy_manager::execute_mint_policy
    # => [new_amount, new_tag, new_note_type, NEW_RECIPIENT, pad(9)]

    exec.faucets::mint_and_send
    # => [note_idx, pad(15)]
end

#! Burns the fungible asset from the active note.
#!
#! This is a re-export of \`miden::standards::faucets::burn\`.
#!
#! The shared burn procedure first executes the active burn policy and then burns the single
#! fungible asset contained in the active note.
#!
#! Inputs:  [pad(16)]
#! Outputs: [pad(16)]
#!
#! Panics if:
#! - active burn policy validation fails.
#! - the procedure is not called from a note context (active_note::get_assets will fail).
#! - the note does not contain exactly one asset.
#! - the transaction is executed against an account which is not a fungible asset faucet.
#! - the transaction is executed against a faucet which is not the origin of the specified asset.
#! - the amount about to be burned is greater than the outstanding supply of the asset.
#!
#! Invocation: call
pub use faucets::burn
`;

const networkFungibleFaucet: Package = {
  ...defaultPackage(),
  id: "network-fungible-faucet",
  name: "network-fungible-faucet",
  type: "account",
  masm,
  digest: "0x94b171b4b25fbe0348941dbd651d9dea37089f3a6414523193617765e24f6c1f",
  exports: [
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::faucets::network_fungible_faucet::burn",
        digest:
          "0xe691b954bc9474baae6948b176642f425ea166970003fcf5666b1e4aa6af5257",
      },
    },
    {
      Procedure: {
        ...defaultProcedureExport(),
        path: "::miden::standards::components::faucets::network_fungible_faucet::mint_and_send",
        digest:
          "0xa3a25ccb1bfa64487fd7dc7e516f8b042d2144f4300a3ddbc0063294e1e92762",
      },
    },
  ],
};

export default networkFungibleFaucet;
