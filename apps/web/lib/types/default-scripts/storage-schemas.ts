// The storage schemas of the built-in scripts, which are assembled from MASM
// and have no package for api-compile to read one from: the slots the SDK's
// components declare, as a compiled package's `metadata.storage` gives them
// (lib/types/script.ts). Every slot holds words, so every type is `word`; a
// value slot's default is a word in hex, absent when it is zero. No SDK
// import: the unit tests run on plain node.
import { wordTextToHex } from "../../utils/storage-slots.ts";
import type { StorageSchema } from "../script.ts";

export const authSingleSigStorage: StorageSchema = {
  slots: [
    {
      name: "miden::standards::auth::singlesig::pub_key",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::auth::singlesig::scheme",
      type: "value",
      valueType: "word",
      defaultValue: wordTextToHex("2"),
    },
  ],
};

export const authGuardedMultisigStorage: StorageSchema = {
  slots: [
    {
      name: "openzeppelin::multisig::threshold_config",
      type: "value",
      valueType: "word",
    },
    {
      name: "openzeppelin::multisig::signer_public_keys",
      type: "map",
      keyType: "word",
      valueType: "word",
    },
    {
      name: "openzeppelin::multisig::executed_transactions",
      type: "map",
      keyType: "word",
      valueType: "word",
    },
    {
      name: "openzeppelin::multisig::procedure_thresholds",
      type: "map",
      keyType: "word",
      valueType: "word",
    },
    {
      name: "openzeppelin::guardian::selector",
      type: "value",
      valueType: "word",
    },
    {
      name: "openzeppelin::guardian::public_key",
      type: "map",
      keyType: "word",
      valueType: "word",
    },
  ],
};

export const authNetworkAccountStorage: StorageSchema = {
  slots: [
    {
      name: "miden::standards::auth::network_account::allowed_note_scripts",
      type: "map",
      keyType: "word",
      valueType: "word",
    },
    {
      name: "miden::standards::auth::network_account::allowed_tx_scripts",
      type: "map",
      keyType: "word",
      valueType: "word",
    },
  ],
};

export const fungibleFaucetStorage: StorageSchema = {
  slots: [
    {
      name: "miden::standards::faucets::token_description_4",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::external_link_2",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::external_link_5",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::token_description_2",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::logo_uri_3",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::token_description_0",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::logo_uri_4",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::policies::policy_manager::active_mint_policy_proc_root",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::token_name_1",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::external_link_3",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::logo_uri_5",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::mutability_config",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::external_link_4",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::auth::singlesig::scheme",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::policies::policy_manager::active_burn_policy_proc_root",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::access::pausable::is_paused",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::token_description_3",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::policies::policy_manager::allowed_send_policy_proc_roots",
      type: "map",
      keyType: "word",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::logo_uri_6",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::policies::policy_manager::allowed_burn_policy_proc_roots",
      type: "map",
      keyType: "word",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::logo_uri_0",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::external_link_1",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::logo_uri_1",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::token_description_5",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::fungible::token_config",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::token_description_1",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::auth::singlesig::pub_key",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::token_description_6",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::logo_uri_2",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::external_link_0",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::external_link_6",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::token_name_0",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::policies::policy_manager::allowed_receive_policy_proc_roots",
      type: "map",
      keyType: "word",
      valueType: "word",
    },
    {
      name: "miden::standards::metadata::storage_schema::commitment",
      type: "value",
      valueType: "word",
    },
    {
      name: "miden::standards::faucets::policies::policy_manager::allowed_mint_policy_proc_roots",
      type: "map",
      keyType: "word",
      valueType: "word",
    },
  ],
};
