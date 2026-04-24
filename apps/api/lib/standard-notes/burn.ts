import { type Package, defaultPackage } from "@/lib/types";

const rust = "";

const masm = `use miden::standards::faucets::network_fungible->network_faucet

#! BURN script: burns the asset from the note by calling the faucet's burn procedure.
#! This note is intended to be executed against a network fungible faucet account.
#! The compiled procedure root matches the standard fungible faucet burn wrapper shared by both
#! basic and network fungible faucets.
#!
#! The burn procedure in the faucet already handles all necessary validations including:
#! - Checking that the note contains exactly one asset
#! - Verifying the asset is a fungible asset issued by this faucet
#! - Ensuring the amount to burn doesn't exceed the outstanding supply
#!
#! Requires that the account exposes:
#! - \`miden::standards::faucets::network_fungible::burn\` procedure.
#!
#! Inputs:  [ARGS, pad(12)]
#! Outputs: [pad(16)]
#!
#! Panics if:
#! - account does not expose burn procedure.
#! - any of the validations in the burn procedure fail.
@note_script
pub proc main
    dropw
    # => [pad(16)]

    # Call the network fungible faucet burn wrapper which enforces burn policy and then burns the
    # asset.
    call.network_faucet::burn
    # => [pad(16)]
end
`;

const burn: Package = {
  ...defaultPackage(),
  id: "burn",
  name: "burn",
  type: "note-script",
  rust,
  masm,
  digest: "0xdad2020d27b388008dedb2dfa1952a1be7d45c9f8b8366ca734de06a07247f9e",
};

export default burn;
